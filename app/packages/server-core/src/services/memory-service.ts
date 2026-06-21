import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export const MEMORY_PARTITIONS = [
  'user',
  'app',
  'project',
  'agent',
  'task',
  'design',
  'review',
] as const

export type MemoryPartition = (typeof MEMORY_PARTITIONS)[number]

export interface MemoryRecord {
  id: string
  partition: MemoryPartition
  projectId?: string
  agentId?: string
  key?: string
  value: unknown
  createdAt: number
  updatedAt: number
  meta?: Record<string, unknown>
  risk?: 'low' | 'medium' | 'high'
}

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
  value: unknown
  meta?: Record<string, unknown>
}

export interface MemoryUpdateInput {
  id: string
  value?: unknown
  key?: string
  meta?: Record<string, unknown>
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

export function getMemoryDataDir(): string {
  return join(homedir(), '.craft-agent', 'fleet', 'memory')
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
  constructor(private readonly dataDir = getMemoryDataDir()) {}

  async create(input: MemoryCreateInput, now = Date.now()): Promise<MemoryRecord> {
    const partition = requirePartition(input.partition)
    if (partition === 'project' && !input.projectId) {
      throw new Error('project partition requires projectId')
    }
    const id = randomUUID()
    const rec: MemoryRecord = {
      id,
      partition,
      projectId: input.projectId,
      agentId: input.agentId,
      key: input.key,
      value: input.value,
      createdAt: now,
      updatedAt: now,
      meta: input.meta,
    }
    const path = recordPath(this.dataDir, partition, input.projectId, id)
    await ensureDir(join(this.dataDir, partition, input.projectId ? sanitize(input.projectId) : 'global'))
    await writeFile(path, JSON.stringify(rec, null, 2), 'utf-8')
    return rec
  }

  async get(id: string): Promise<MemoryRecord | null> {
    const safeId = requireId(id)
    // search all partitions/scopes for the id
    for (const p of MEMORY_PARTITIONS) {
      const base = join(this.dataDir, p)
      try {
        const scopes = await readdir(base)
        for (const sc of scopes) {
          const candidate = join(base, sc, `${safeId}.json`)
          const rec = await readJsonSafe<MemoryRecord>(candidate)
          if (rec) return rec
        }
      } catch {
        // ignore missing partition dir
      }
    }
    return null
  }

  async update(input: MemoryUpdateInput, now = Date.now()): Promise<MemoryRecord> {
    const existing = await this.get(input.id)
    if (!existing) throw new Error(`memory record not found: ${input.id}`)
    const next: MemoryRecord = {
      ...existing,
      value: input.value !== undefined ? input.value : existing.value,
      key: input.key !== undefined ? input.key : existing.key,
      meta: input.meta !== undefined ? input.meta : existing.meta,
      updatedAt: now,
    }
    const path = recordPath(this.dataDir, next.partition, next.projectId, next.id)
    await ensureDir(join(this.dataDir, next.partition, next.projectId ? sanitize(next.projectId) : 'global'))
    await writeFile(path, JSON.stringify(next, null, 2), 'utf-8')
    return next
  }

  async delete(id: string): Promise<boolean> {
    const rec = await this.get(id)
    if (!rec) return false
    const path = recordPath(this.dataDir, rec.partition, rec.projectId, rec.id)
    try {
      await rm(path, { force: true })
      return true
    } catch {
      return false
    }
  }

  async query(q: MemoryQuery = {}): Promise<MemoryRecord[]> {
    const limit = q.limit && q.limit > 0 ? q.limit : 100
    const results: MemoryRecord[] = []
    let parts = q.partition ? [requirePartition(q.partition)] : [...MEMORY_PARTITIONS]
    // Project memory is isolated by default: global queries (no projectId) must never return project partition items.
    if (!q.projectId) {
      parts = parts.filter((p) => p !== 'project')
    }

    for (const p of parts) {
      const base = join(this.dataDir, p)
      let scopes: string[] = []
      try {
        scopes = await readdir(base)
      } catch {
        continue
      }
      for (const sc of scopes) {
        if (q.projectId && sc !== sanitize(q.projectId) && sc !== 'global') continue
        const dir = join(base, sc)
        let names: string[]
        try {
          names = await readdir(dir)
        } catch {
          continue
        }
        for (const n of names) {
          if (!n.endsWith('.json')) continue
          const rec = await readJsonSafe<MemoryRecord>(join(dir, n))
          if (!rec) continue
          if (q.projectId && rec.projectId && rec.projectId !== q.projectId) continue
          if (q.agentId && rec.agentId !== q.agentId) continue
          if (q.keyword) {
            const hay = JSON.stringify(rec).toLowerCase()
            if (!hay.includes(q.keyword.toLowerCase())) continue
          }
          results.push(rec)
          if (results.length >= limit) break
        }
        if (results.length >= limit) break
      }
      if (results.length >= limit) break
    }
    return results.slice(0, limit)
  }

  async clear(partition: MemoryPartition, projectId?: string): Promise<number> {
    const p = requirePartition(partition)
    const scope = projectId ? sanitize(projectId) : null
    const base = join(this.dataDir, p)
    let deleted = 0
    try {
      const scopes = await readdir(base)
      for (const sc of scopes) {
        if (scope && sc !== scope) continue
        const dir = join(base, sc)
        let names: string[]
        try { names = await readdir(dir) } catch { continue }
        for (const n of names) {
          if (n.endsWith('.json')) {
            await rm(join(dir, n), { force: true })
            deleted++
          }
        }
      }
    } catch {
      // no dir
    }
    return deleted
  }

  // Project memory default isolation helper: queries without projectId never return project partition items
  async queryForProject(projectId: string, extra: Omit<MemoryQuery, 'projectId'> = {}): Promise<MemoryRecord[]> {
    if (!projectId) throw new Error('projectId required for project scoped query')
    return this.query({ ...extra, projectId })
  }
}

export const memoryService = new MemoryService()
