/**
 * L2 Semantic 缓存 — 向量相似度命中
 *
 * 单一真相：docs/03 §6.3
 *
 * 规则：
 * - 默认关（setEnabled 才启用）
 * - 仅 confidence='high' 时存
 * - 仅 C1 闲聊/格式化（taskType='chat-text'）；动作型任务默认禁用
 * - 永不缓存 panel 中间结果（本模块只存最终 answer）
 * - 命中需同 workspace + 同 toolSet + 余弦相似度 > threshold（默认 0.95）
 * - 调用方须保证「无未解决 diff」再调用（本模块不持有 git 状态）
 * - store/lookup 写审计日志，供 timeline 核验
 *
 * 存储：内存 Map + 可选磁盘 `~/.craft-agent/cache/semantic/*.json`（测试用 memoryOnly）。
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CacheKey, TaskType } from './fusion-types.ts'

const ACTION_TASK_TYPES: TaskType[] = [
  'code-tools',
  'design-canvas',
  'animation',
  'video-edit',
  'automation',
]

const SEMANTIC_DIR = join(process.env.HOME || process.env.USERPROFILE || '.', '.craft-agent', 'cache', 'semantic')
const DEFAULT_TTL_MS = 60 * 60 * 1000

interface SemanticEntry {
  key: CacheKey
  answer: string
  embedding: number[]
  confidence: 'high' | 'low'
  createdAt: number
  expiresAt: number
}

export interface SemanticLookupResult {
  hit: boolean
  answer?: string
  similarity?: number
}

export type SemanticAuditAction =
  | 'store'
  | 'lookup-hit'
  | 'lookup-miss'
  | 'reject-disabled'
  | 'reject-low-confidence'
  | 'reject-action-task'

export interface SemanticAuditEntry {
  ts: number
  action: SemanticAuditAction
  workspaceId: string
  taskType: TaskType
  similarity?: number
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  if (denom === 0) return 0
  return dot / denom
}

function entryKey(key: CacheKey): string {
  return [key.workspaceId, key.toolSetHash, key.normalizedMessage].join('\u0001')
}

function diskPathForKey(key: CacheKey): string {
  const hash = createHash('sha256').update(entryKey(key)).digest('hex')
  return join(SEMANTIC_DIR, `${hash}.json`)
}

function ensureSemanticDir(): void {
  if (!existsSync(SEMANTIC_DIR)) mkdirSync(SEMANTIC_DIR, { recursive: true })
}

export class SemanticCache {
  private enabled = false
  private readonly memoryOnly: boolean
  private diskLoaded = false
  private readonly entries = new Map<string, SemanticEntry>()
  private readonly audit: SemanticAuditEntry[] = []

  constructor(options?: { memoryOnly?: boolean }) {
    this.memoryOnly = options?.memoryOnly ?? false
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (enabled && !this.memoryOnly) {
      this.loadFromDisk()
    }
  }

  isEnabled(): boolean {
    return this.enabled
  }

  loadFromDisk(): void {
    if (this.memoryOnly || this.diskLoaded) return
    this.diskLoaded = true
    if (!existsSync(SEMANTIC_DIR)) return
    const now = Date.now()
    for (const file of readdirSync(SEMANTIC_DIR)) {
      if (!file.endsWith('.json')) continue
      const path = join(SEMANTIC_DIR, file)
      try {
        const entry = JSON.parse(readFileSync(path, 'utf-8')) as SemanticEntry
        if (entry.expiresAt <= now) {
          unlinkSync(path)
          continue
        }
        this.entries.set(entryKey(entry.key), entry)
      } catch {
        // ignore corrupt entries
      }
    }
  }

  private persistEntry(entry: SemanticEntry): void {
    if (this.memoryOnly) return
    try {
      ensureSemanticDir()
      writeFileSync(diskPathForKey(entry.key), JSON.stringify(entry), 'utf-8')
    } catch {
      // best-effort
    }
  }

  store(
    key: CacheKey,
    answer: string,
    embedding: number[],
    confidence: 'high' | 'low',
  ): void {
    if (!this.enabled) {
      this.audit.push({
        ts: Date.now(),
        action: 'reject-disabled',
        workspaceId: key.workspaceId,
        taskType: key.taskType,
      })
      return
    }
    if (confidence !== 'high') {
      this.audit.push({
        ts: Date.now(),
        action: 'reject-low-confidence',
        workspaceId: key.workspaceId,
        taskType: key.taskType,
      })
      return
    }
    if (ACTION_TASK_TYPES.includes(key.taskType)) {
      this.audit.push({
        ts: Date.now(),
        action: 'reject-action-task',
        workspaceId: key.workspaceId,
        taskType: key.taskType,
      })
      return
    }
    const now = Date.now()
    const entry: SemanticEntry = {
      key,
      answer,
      embedding,
      confidence,
      createdAt: now,
      expiresAt: now + DEFAULT_TTL_MS,
    }
    this.entries.set(entryKey(key), entry)
    this.persistEntry(entry)
    this.audit.push({
      ts: Date.now(),
      action: 'store',
      workspaceId: key.workspaceId,
      taskType: key.taskType,
    })
  }

  lookup(
    key: CacheKey,
    embedding: number[],
    threshold: number = 0.95,
  ): SemanticLookupResult {
    if (!this.enabled) {
      this.audit.push({
        ts: Date.now(),
        action: 'reject-disabled',
        workspaceId: key.workspaceId,
        taskType: key.taskType,
      })
      return { hit: false }
    }
    if (!this.memoryOnly && !this.diskLoaded) {
      this.loadFromDisk()
    }
    if (ACTION_TASK_TYPES.includes(key.taskType)) {
      this.audit.push({
        ts: Date.now(),
        action: 'reject-action-task',
        workspaceId: key.workspaceId,
        taskType: key.taskType,
      })
      return { hit: false }
    }

    const now = Date.now()
    let best: { answer: string; similarity: number } | null = null
    for (const [mapKey, entry] of this.entries.entries()) {
      if (entry.expiresAt <= now) {
        this.entries.delete(mapKey)
        if (!this.memoryOnly) {
          try { unlinkSync(diskPathForKey(entry.key)) } catch { /* ignore */ }
        }
        continue
      }
      if (entry.key.workspaceId !== key.workspaceId) continue
      if (entry.key.toolSetHash !== key.toolSetHash) continue
      const sim = cosineSimilarity(embedding, entry.embedding)
      if (sim > threshold && (!best || sim > best.similarity)) {
        best = { answer: entry.answer, similarity: sim }
      }
    }

    if (best) {
      this.audit.push({
        ts: Date.now(),
        action: 'lookup-hit',
        workspaceId: key.workspaceId,
        taskType: key.taskType,
        similarity: best.similarity,
      })
      return { hit: true, answer: best.answer, similarity: best.similarity }
    }

    this.audit.push({
      ts: Date.now(),
      action: 'lookup-miss',
      workspaceId: key.workspaceId,
      taskType: key.taskType,
    })
    return { hit: false }
  }

  getAuditLog(): SemanticAuditEntry[] {
    return [...this.audit]
  }

  clear(): void {
    this.entries.clear()
    this.audit.length = 0
    if (!this.memoryOnly && existsSync(SEMANTIC_DIR)) {
      for (const file of readdirSync(SEMANTIC_DIR)) {
        if (file.endsWith('.json')) {
          try { unlinkSync(join(SEMANTIC_DIR, file)) } catch { /* ignore */ }
        }
      }
    }
    this.diskLoaded = false
  }

  size(): number {
    return this.entries.size
  }
}
