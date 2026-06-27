import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import {
  PARTITION_DEFAULT_SENSITIVITY,
  isScopedPartition,
  memoryQueryAllowed,
  memoryEntryMatches,
  MEMORY_PARTITIONS,
  MEMORY_TIERS,
  type AddMemoryInput,
  type MemoryEntry,
  type MemoryQuery,
} from '@craft-agent/shared/protocol'

const STORE_RELATIVE_PATH = '.fleet/memory.json'

export interface UpdateMemoryInput {
  content?: string
  tier?: MemoryEntry['tier']
  sensitivity?: MemoryEntry['sensitivity']
}

export class MemoryStore {
  readonly path: string
  readonly globalPath: string

  constructor(workspaceRoot: string) {
    this.path = join(workspaceRoot, STORE_RELATIVE_PATH)
    const configDir = process.env.CRAFT_CONFIG_DIR || join(homedir(), '.craft-agent')
    this.globalPath = join(configDir, 'global-memory.json')
  }

  isMemoryEnabled(): boolean {
    const entries = this.loadGlobal()
    const enabledEntry = entries.find(e => e.partition === 'software' && e.content.startsWith('memory_enabled:'))
    if (enabledEntry) {
      return enabledEntry.content === 'memory_enabled:true'
    }
    return true // default is enabled
  }

  private isGlobalPartition(partition: string): boolean {
    return partition === 'user' || partition === 'software'
  }

  private isMemoryEnabledSetting(partition: string, content: string): boolean {
    return partition === 'software' && content.startsWith('memory_enabled:')
  }

  /** 新增一条记忆。scoped 分区（project/task/agent）必须带 scopeId。 */
  add(input: AddMemoryInput): MemoryEntry {
    const content = input.content?.trim()
    const isSetting = this.isMemoryEnabledSetting(input.partition, content)
    if (!isSetting && !this.isMemoryEnabled()) {
      throw new Error('Memory is currently disabled')
    }

    if (!MEMORY_PARTITIONS.includes(input.partition)) throw new Error(`未知记忆分区：${input.partition}`)
    if (!content) throw new Error('记忆内容不能为空')
    if (isScopedPartition(input.partition) && !input.scopeId?.trim()) {
      throw new Error(`分区 ${input.partition} 需要 scopeId（按归属隔离）`)
    }
    const tier = input.tier && MEMORY_TIERS.includes(input.tier) ? input.tier : 'semantic'
    const now = Date.now()
    const entry: MemoryEntry = {
      id: randomUUID(),
      partition: input.partition,
      tier,
      content,
      sensitivity: input.sensitivity ?? PARTITION_DEFAULT_SENSITIVITY[input.partition],
      scopeId: input.scopeId?.trim() || undefined,
      source: input.source?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    }

    if (this.isGlobalPartition(input.partition)) {
      const all = this.loadGlobal()
      if (isSetting) {
        const next = all.filter(e => !(e.partition === 'software' && e.content.startsWith('memory_enabled:')))
        next.push(entry)
        this.saveGlobal(next)
      } else {
        all.push(entry)
        this.saveGlobal(all)
      }
    } else {
      const all = this.loadWorkspace()
      all.push(entry)
      this.saveWorkspace(all)
    }

    return entry
  }

  /** 检索（含隔离）。scoped 分区不带 scopeId → 返回空（不可见）。 */
  list(query: MemoryQuery = {}): MemoryEntry[] {
    const isQueryingSetting = query.partition === 'software' && query.contains?.startsWith('memory_enabled')
    if (!isQueryingSetting && !this.isMemoryEnabled()) {
      return []
    }

    // Intercept suggestion queries
    if (query.partition === 'software' && query.contains?.startsWith('suggestion:')) {
      const queryText = query.contains.slice('suggestion:'.length)
      const { SuggestionService } = require('./suggestion-service')
      return SuggestionService.getSuggestions(dirname(this.path), queryText)
    }

    // Intercept snippet queries
    if (query.partition === 'software' && query.contains?.startsWith('snippet:')) {
      const triggerPrefix = query.contains.slice('snippet:'.length).toLowerCase()
      const allSoftware = this.loadGlobal()
      return allSoftware.filter(entry => {
        if (!entry.content.startsWith('snippet:')) return false
        if (!triggerPrefix) return true
        try {
          const parsed = JSON.parse(entry.content.slice('snippet:'.length))
          return parsed.trigger.toLowerCase().startsWith(triggerPrefix)
        } catch {
          return false
        }
      })
    }

    if (!memoryQueryAllowed(query)) return []

    let candidates: MemoryEntry[] = []
    if (query.partition) {
      if (this.isGlobalPartition(query.partition)) {
        candidates = this.loadGlobal()
      } else {
        candidates = this.loadWorkspace()
      }
    } else {
      candidates = this.loadAll()
    }

    // Filter by everything except 'contains' which we handle semantically
    const { contains, ...baseQuery } = query
    let matched = candidates.filter(entry => memoryEntryMatches(entry, baseQuery))

    if (contains) {
      const q = contains.toLowerCase()
      const scored = matched
        .map(entry => {
          let score = 0
          if (entry.content.toLowerCase().includes(q)) {
            score = 1.0
          } else {
            score = computeSimilarity(q, entry.content)
          }

          // Apply decay to episodic memories
          if (entry.tier === 'episodic') {
            const daysOld = (Date.now() - entry.updatedAt) / (1000 * 60 * 60 * 24)
            const decayFactor = Math.exp(-0.05 * daysOld)
            score *= decayFactor
          }

          return { entry, score }
        })
        .filter(x => x.score >= 0.15)
        .sort((a, b) => b.score - a.score)

      matched = scored.map(x => x.entry)
    } else {
      // Default sorting by createdAt desc
      matched = matched.sort((a, b) => b.createdAt - a.createdAt)
    }

    return typeof query.limit === 'number' ? matched.slice(0, Math.max(0, query.limit)) : matched
  }

  listWorkspaceMemoriesWithoutScope(): MemoryEntry[] {
    return this.loadWorkspace()
  }

  get(id: string): MemoryEntry | null {
    if (!this.isMemoryEnabled()) return null
    return this.loadAll().find(entry => entry.id === id) ?? null
  }

  /** 可改：内容/层/敏感度。 */
  update(id: string, patch: UpdateMemoryInput): MemoryEntry | null {
    if (!this.isMemoryEnabled()) return null

    let all = this.loadGlobal()
    let entry = all.find(item => item.id === id)
    if (entry) {
      if (patch.content !== undefined) entry.content = patch.content.trim()
      if (patch.tier && MEMORY_TIERS.includes(patch.tier)) entry.tier = patch.tier
      if (patch.sensitivity) entry.sensitivity = patch.sensitivity
      entry.updatedAt = Date.now()
      this.saveGlobal(all)
      return entry
    }

    all = this.loadWorkspace()
    entry = all.find(item => item.id === id)
    if (entry) {
      if (patch.content !== undefined) entry.content = patch.content.trim()
      if (patch.tier && MEMORY_TIERS.includes(patch.tier)) entry.tier = patch.tier
      if (patch.sensitivity) entry.sensitivity = patch.sensitivity
      entry.updatedAt = Date.now()
      this.saveWorkspace(all)
      return entry
    }

    return null
  }

  /** 可删。 */
  delete(id: string): boolean {
    let all = this.loadGlobal()
    let next = all.filter(entry => entry.id !== id)
    if (next.length !== all.length) {
      this.saveGlobal(next)
      return true
    }

    all = this.loadWorkspace()
    next = all.filter(entry => entry.id !== id)
    if (next.length !== all.length) {
      this.saveWorkspace(next)
      return true
    }

    return false
  }

  private loadAll(): MemoryEntry[] {
    return [...this.loadGlobal(), ...this.loadWorkspace()]
  }

  private loadGlobal(): MemoryEntry[] {
    if (!existsSync(this.globalPath)) return []
    try {
      const parsed = JSON.parse(readFileSync(this.globalPath, 'utf8')) as { entries?: unknown }
      return Array.isArray(parsed.entries) ? parsed.entries.filter(isMemoryEntry) : []
    } catch {
      return []
    }
  }

  private loadWorkspace(): MemoryEntry[] {
    if (!existsSync(this.path)) return []
    try {
      const parsed = JSON.parse(readFileSync(this.path, 'utf8')) as { entries?: unknown }
      return Array.isArray(parsed.entries) ? parsed.entries.filter(isMemoryEntry) : []
    } catch {
      return []
    }
  }

  private saveGlobal(entries: MemoryEntry[]): void {
    mkdirSync(dirname(this.globalPath), { recursive: true })
    const tempPath = `${this.globalPath}.${process.pid}.tmp`
    try {
      writeFileSync(tempPath, `${JSON.stringify({ version: 1, entries }, null, 2)}\n`, 'utf8')
      renameSync(tempPath, this.globalPath)
    } catch (error) {
      if (existsSync(tempPath)) unlinkSync(tempPath)
      throw error
    }
  }

  private saveWorkspace(entries: MemoryEntry[]): void {
    mkdirSync(dirname(this.path), { recursive: true })
    const tempPath = `${this.path}.${process.pid}.tmp`
    try {
      writeFileSync(tempPath, `${JSON.stringify({ version: 1, entries }, null, 2)}\n`, 'utf8')
      renameSync(tempPath, this.path)
    } catch (error) {
      if (existsSync(tempPath)) unlinkSync(tempPath)
      throw error
    }
  }
}

function isMemoryEntry(value: unknown): value is MemoryEntry {
  return typeof value === 'object' && value !== null
    && typeof (value as MemoryEntry).id === 'string'
    && typeof (value as MemoryEntry).partition === 'string'
    && typeof (value as MemoryEntry).content === 'string'
}

export function computeSimilarity(query: string, content: string): number {
  const qWords = tokenize(query)
  const cWords = tokenize(content)
  if (qWords.length === 0 || cWords.length === 0) return 0

  const wordScore = cosineSimilarity(qWords, cWords)

  const qGrams = getCharNGrams(query, 3)
  const cGrams = getCharNGrams(content, 3)
  const gramScore = cosineSimilarity(qGrams, cGrams)

  return 0.4 * wordScore + 0.6 * gramScore
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0)
}

function getCharNGrams(text: string, n: number): string[] {
  const normalized = text.toLowerCase().replace(/\s+/g, '')
  const ngrams: string[] = []
  for (let i = 0; i <= normalized.length - n; i++) {
    ngrams.push(normalized.substring(i, i + n))
  }
  return ngrams
}

function cosineSimilarity(tokensA: string[], tokensB: string[]): number {
  const freqA: Record<string, number> = {}
  const freqB: Record<string, number> = {}
  for (const t of tokensA) freqA[t] = (freqA[t] || 0) + 1
  for (const t of tokensB) freqB[t] = (freqB[t] || 0) + 1

  const allTokens = new Set([...Object.keys(freqA), ...Object.keys(freqB)])
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (const t of allTokens) {
    const valA = freqA[t] || 0
    const valB = freqB[t] || 0
    dotProduct += valA * valB
    normA += valA * valA
    normB += valB * valB
  }

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
