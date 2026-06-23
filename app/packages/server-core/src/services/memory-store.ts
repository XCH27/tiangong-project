/**
 * MemoryStore —— 分层记忆的本地存储（D2 / docs/05）。
 *
 * 全本地、可查可删、按分区+scopeId 隔离。写进 `<workspace>/.fleet/memory.json`，不另起第二套真相。
 * 隔离纪律来自 `@craft-agent/shared/protocol`（`memoryQueryAllowed`/`memoryEntryMatches`）：
 * 项目/任务/Agent 分区按 scopeId 隔离，跨项目默认不可见。
 *
 * v1 单 workspace 一个文件，承载全部分区；"用户/软件分区真正全局共享"留作后续 global-store 层。
 */

import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
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

  constructor(workspaceRoot: string) {
    this.path = join(workspaceRoot, STORE_RELATIVE_PATH)
  }

  /** 新增一条记忆。scoped 分区（project/task/agent）必须带 scopeId。 */
  add(input: AddMemoryInput): MemoryEntry {
    if (!MEMORY_PARTITIONS.includes(input.partition)) throw new Error(`未知记忆分区：${input.partition}`)
    const content = input.content?.trim()
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
    const all = this.load()
    all.push(entry)
    this.save(all)
    return entry
  }

  /** 检索（含隔离）。scoped 分区不带 scopeId → 返回空（不可见）。 */
  list(query: MemoryQuery = {}): MemoryEntry[] {
    if (!memoryQueryAllowed(query)) return []
    const matched = this.load()
      .filter(entry => memoryEntryMatches(entry, query))
      .sort((a, b) => b.createdAt - a.createdAt)
    return typeof query.limit === 'number' ? matched.slice(0, Math.max(0, query.limit)) : matched
  }

  get(id: string): MemoryEntry | null {
    return this.load().find(entry => entry.id === id) ?? null
  }

  /** 可改：内容/层/敏感度。 */
  update(id: string, patch: UpdateMemoryInput): MemoryEntry | null {
    const all = this.load()
    const entry = all.find(item => item.id === id)
    if (!entry) return null
    if (patch.content !== undefined) entry.content = patch.content.trim()
    if (patch.tier && MEMORY_TIERS.includes(patch.tier)) entry.tier = patch.tier
    if (patch.sensitivity) entry.sensitivity = patch.sensitivity
    entry.updatedAt = Date.now()
    this.save(all)
    return entry
  }

  /** 可删。 */
  delete(id: string): boolean {
    const all = this.load()
    const next = all.filter(entry => entry.id !== id)
    if (next.length === all.length) return false
    this.save(next)
    return true
  }

  private load(): MemoryEntry[] {
    if (!existsSync(this.path)) return []
    try {
      const parsed = JSON.parse(readFileSync(this.path, 'utf8')) as { entries?: unknown }
      return Array.isArray(parsed.entries) ? parsed.entries.filter(isMemoryEntry) : []
    } catch {
      return []
    }
  }

  private save(entries: MemoryEntry[]): void {
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
