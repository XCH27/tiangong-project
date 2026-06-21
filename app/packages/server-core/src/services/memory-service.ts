import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { FileMemoryPersistence, getMemoryDataDir } from './memory-persistence'
import type { MemoryRecord, MemoryPartition } from '@craft-agent/shared/protocol'

export type { MemoryRecord } from '@craft-agent/shared/protocol'

export const MEMORY_PARTITIONS = [
  'user',
  'app',
  'project',
  'agent',
  'task',
  'design',
  'review',
] as const

export type { MemoryPartition }

export interface MemoryQuery {
  partition?: MemoryPartition
  projectId?: string
  agentId?: string
  keyword?: string
  limit?: number
}

export interface MemoryCreateInput {
  partition: MemoryPartition
  projectId?: string
  agentId?: string
  key?: string
  value?: unknown
  content?: unknown
  tags?: string[]
  source?: string
  meta?: Record<string, unknown>
  risk?: 'low' | 'medium' | 'high'
}

export interface MemoryUpdateInput {
  id: string
  value?: unknown
  key?: string
  meta?: Record<string, unknown>
}

export interface MemoryDeleteOptions {
  confirmed?: boolean
  reason?: string
  riskLevel?: 'low' | 'medium' | 'high'
}

function requirePartition(p: string): MemoryPartition {
  if (!MEMORY_PARTITIONS.includes(p as MemoryPartition)) {
    throw new Error(`invalid partition: ${p}`)
  }
  return p as MemoryPartition
}

function requireId(id: string): string {
  if (typeof id !== 'string' || !id.trim()) throw new Error('id is required')
  return id
}

function recordPath(dir: string, partition: MemoryPartition, projectId: string | undefined, id: string): string {
  const scope = projectId ? sanitize(projectId) : 'global'
  return join(dir, partition, scope, `${id}.json`)
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9_.-]/g, '_')
}

async function ensureDir(p: string) {
  await mkdir(p, { recursive: true })
}

async function readJsonSafe<T>(p: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(p, 'utf-8')) as T
  } catch (e: any) {
    if (e.code === 'ENOENT') return null
    throw e
  }
}

export class MemoryService {
  private persistence: FileMemoryPersistence

  constructor(dataDir?: string) {
    const dir = dataDir || getMemoryDataDir()
    this.persistence = new FileMemoryPersistence(dir)
  }

  async create(input: MemoryCreateInput, now = Date.now()): Promise<MemoryRecord> {
    const partition = requirePartition(input.partition)
    if (partition === 'project' && !input.projectId) {
      throw new Error('project partition requires projectId')
    }
    const val = input.value !== undefined ? input.value : input.content
    const rec = await this.persistence.add({
      partition,
      projectId: input.projectId,
      agentId: input.agentId,
      key: input.key,
      value: val,
      meta: input.meta,
      risk: input.risk,
    } as any)
    return rec
  }

  async get(id: string): Promise<MemoryRecord | null> {
    return this.persistence.get(id)
  }

  async update(input: MemoryUpdateInput, now = Date.now()): Promise<MemoryRecord> {
    // simple in-mem update via persistence get+re-add (for compatibility)
    const existing = await this.get(input.id)
    if (!existing) throw new Error(`memory record not found: ${input.id}`)
    const next: MemoryRecord = {
      ...existing,
      value: input.value !== undefined ? input.value : existing.value,
      key: input.key !== undefined ? input.key : existing.key,
      meta: input.meta !== undefined ? input.meta : existing.meta,
      updatedAt: now,
    }
    // re-add with same id
    await this.persistence.add({ ...next, id: next.id } as any)
    return next
  }

  async delete(id: string, opts?: MemoryDeleteOptions): Promise<boolean> {
    const rec = await this.get(id)
    if (!rec) return false
    const risk = (rec as any).risk || 'low'
    if ((risk === 'high' || risk === 'medium') && !opts?.confirmed) {
      throw new Error('delete requires explicit confirmation for medium/high risk memory')
    }
    return this.persistence.remove(id, { reason: opts?.reason, riskLevel: risk })
  }

  async query(q: MemoryQuery = {}): Promise<MemoryRecord[]> {
    let res = await this.persistence.list(q as any)
    if (!q.projectId) {
      res = res.filter((r: any) => r.partition !== 'project')
    }
    if (q.keyword) {
      const k = q.keyword.toLowerCase()
      res = res.filter((r: any) => JSON.stringify(r).toLowerCase().includes(k))
    }
    const lim = q.limit || 100
    return res.slice(0, lim)
  }

  async search(keyword: string, q: Omit<MemoryQuery, 'keyword'> = {}): Promise<MemoryRecord[]> {
    return this.persistence.search(keyword, q as any)
  }

  async clear(partition: MemoryPartition, projectId?: string): Promise<number> {
    const all = await this.persistence.list({ partition, projectId } as any)
    let n = 0
    for (const r of all) { if (await this.persistence.remove(r.id)) n++ }
    return n
  }

  async queryForProject(projectId: string, extra: Omit<MemoryQuery, 'projectId'> = {}): Promise<MemoryRecord[]> {
    if (!projectId) throw new Error('projectId required for project scoped query')
    return this.query({ ...extra, projectId })
  }
}

export const memoryService = new MemoryService()
