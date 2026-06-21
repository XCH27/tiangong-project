import { mkdir, readFile, rename, writeFile, readdir, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { AgentLifecycleDescriptor } from '@craft-agent/shared/protocol'

export interface AgentLifecyclePersistence {
  save(agent: AgentLifecycleDescriptor): Promise<void>
  load(agentId: string): Promise<AgentLifecycleDescriptor | null>
  loadAll(): Promise<AgentLifecycleDescriptor[]>
  remove(agentId: string): Promise<void>
}

export function getAgentLifecycleDataDir(): string {
  return join(homedir(), '.craft-agent', 'fleet', 'agent-lifecycle')
}

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_.-]/g, '_')
}

async function readJson<T>(p: string): Promise<T | null> {
  try { return JSON.parse(await readFile(p, 'utf-8')) as T } catch (e: any) { if (e.code === 'ENOENT') return null; throw e }
}

export class FileAgentLifecyclePersistence implements AgentLifecyclePersistence {
  constructor(private readonly dataDir = getAgentLifecycleDataDir()) {}

  private file(agentId: string): string {
    return join(this.dataDir, `${safeId(agentId)}.json`)
  }

  async save(agent: AgentLifecycleDescriptor): Promise<void> {
    await mkdir(this.dataDir, { recursive: true })
    const p = this.file(agent.agentId)
    const tmp = `${p}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(agent, null, 2), 'utf-8')
    await rename(tmp, p)
  }

  async load(agentId: string): Promise<AgentLifecycleDescriptor | null> {
    return readJson(this.file(agentId))
  }

  async loadAll(): Promise<AgentLifecycleDescriptor[]> {
    try {
      const names = await readdir(this.dataDir)
      const recs = await Promise.all(names.filter(n => n.endsWith('.json')).map(n => readJson<AgentLifecycleDescriptor>(join(this.dataDir, n))))
      return recs.filter(Boolean) as AgentLifecycleDescriptor[]
    } catch { return [] }
  }

  async remove(agentId: string): Promise<void> {
    try { await rm(this.file(agentId), { force: true }) } catch {}
  }
}

export const agentLifecyclePersistence = new FileAgentLifecyclePersistence()
