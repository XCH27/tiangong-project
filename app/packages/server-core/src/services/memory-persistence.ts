import { mkdir, readFile, rename, writeFile, readdir, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { MemoryRecord, MemoryPartition } from '@craft-agent/shared/protocol'

export interface MemoryPersistence {
  add(rec: Omit<MemoryRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<MemoryRecord>
  get(id: string): Promise<MemoryRecord | null>
  list(filter?: { partition?: MemoryPartition; projectId?: string; agentId?: string; limit?: number }): Promise<MemoryRecord[]>
  search(keyword: string, filter?: { partition?: MemoryPartition; projectId?: string; agentId?: string; limit?: number }): Promise<MemoryRecord[]>
  remove(id: string, opts?: { reason?: string; riskLevel?: string }): Promise<boolean>
}

export function getMemoryDataDir(): string {
  return join(homedir(), '.craft-agent', 'fleet', 'memory')
}

function safe(s: string): string { return s.replace(/[^a-zA-Z0-9_.-]/g, '_') }

async function readJson<T>(p: string): Promise<T | null> {
  try { return JSON.parse(await readFile(p, 'utf-8')) as T } catch (e: any) { if (e.code === 'ENOENT') return null; throw e }
}

export class FileMemoryPersistence implements MemoryPersistence {
  constructor(private readonly dataDir = getMemoryDataDir()) {}

  private pathFor(partition: MemoryPartition, scope: string, id: string): string {
    return join(this.dataDir, partition, safe(scope), `${id}.json`)
  }

  async add(input: any): Promise<MemoryRecord> {
    const now = Date.now()
    const rec: MemoryRecord = {
      id: input.id || randomUUID(),
      partition: input.partition,
      projectId: input.projectId,
      agentId: input.agentId,
      key: input.key,
      value: input.value,
      createdAt: now,
      updatedAt: now,
      meta: input.meta,
      risk: input.risk,
    }
    const scope = rec.projectId || 'global'
    const dir = join(this.dataDir, rec.partition, safe(scope))
    await mkdir(dir, { recursive: true })
    const p = this.pathFor(rec.partition, scope, rec.id)
    const tmp = `${p}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(rec, null, 2), 'utf-8')
    await rename(tmp, p)
    return rec
  }

  async get(id: string): Promise<MemoryRecord | null> {
    for (const part of ['user','app','project','agent','task','design','review'] as const) {
      const base = join(this.dataDir, part)
      try {
        for (const sc of await readdir(base)) {
          const rec = await readJson<MemoryRecord>(join(base, sc, `${id}.json`))
          if (rec) return rec
        }
      } catch {}
    }
    return null
  }

  async list(filter: any = {}): Promise<MemoryRecord[]> {
    const limit = filter.limit || 200
    const out: MemoryRecord[] = []
    const parts = filter.partition ? [filter.partition] : ['user','app','project','agent','task','design','review'] as const
    for (const p of parts) {
      const base = join(this.dataDir, p)
      try {
        for (const sc of await readdir(base)) {
          if (filter.projectId && sc !== safe(filter.projectId) && sc !== 'global') continue
          const names = await readdir(join(base, sc))
          for (const n of names) {
            if (!n.endsWith('.json')) continue
            const r = await readJson<MemoryRecord>(join(base, sc, n))
            if (!r) continue
            if (filter.projectId && r.projectId && r.projectId !== filter.projectId) continue
            if (filter.agentId && r.agentId !== filter.agentId) continue
            out.push(r)
            if (out.length >= limit) return out
          }
        }
      } catch {}
    }
    return out
  }

  async search(keyword: string, filter: any = {}): Promise<MemoryRecord[]> {
    const k = keyword.toLowerCase()
    const all = await this.list(filter)
    return all.filter(r => JSON.stringify(r).toLowerCase().includes(k)).slice(0, filter.limit || 200)
  }

  async remove(id: string, opts?: { reason?: string; riskLevel?: string }): Promise<boolean> {
    const rec = await this.get(id)
    if (!rec) return false
    const scope = rec.projectId || 'global'
    const p = this.pathFor(rec.partition, scope, id)
    try {
      // audit note: we just delete; caller (service) is responsible for logging reason/riskLevel
      await rm(p, { force: true })
      return true
    } catch { return false }
  }
}

export const memoryPersistence = new FileMemoryPersistence()
