import { randomUUID } from 'node:crypto'

export type AgentKind = 'manager' | 'project'
export type AgentLifecycleStatus =
  | 'starting'
  | 'running'
  | 'blocked'
  | 'stopping'
  | 'stopped'
  | 'resuming'

export interface AgentHandle {
  agentId: string
  kind: AgentKind
  status: AgentLifecycleStatus
  pid?: number
  startedAt?: number
  stoppedAt?: number
  lastTransitionAt: number
  reason?: string
}

export interface LifecycleOptions {
  now?: () => number
  simulatePid?: (agentId: string, kind: AgentKind) => number | undefined
}

function requireAgentId(id: string): string {
  if (typeof id !== 'string' || !id.trim()) throw new Error('agentId is required')
  return id
}

function inferKind(agentId: string): AgentKind {
  if (agentId.startsWith('manager:')) return 'manager'
  if (agentId.startsWith('project:')) return 'project'
  // default to project for unknown to keep strict isolation for new ids
  return 'project'
}

export class AgentLifecycleService {
  private handles = new Map<string, AgentHandle>()
  private readonly now: () => number
  private readonly simulatePid: (agentId: string, kind: AgentKind) => number | undefined

  constructor(options: LifecycleOptions = {}) {
    this.now = options.now ?? (() => Date.now())
    this.simulatePid = options.simulatePid ?? ((_id, _k) => Math.floor(Math.random() * 100000) + 1000)
  }

  start(agentId: string, explicitKind?: AgentKind): AgentHandle {
    const id = requireAgentId(agentId)
    const kind = explicitKind ?? inferKind(id)
    const existing = this.handles.get(id)
    if (existing && (existing.status === 'running' || existing.status === 'starting')) {
      return existing
    }
    const ts = this.now()
    const handle: AgentHandle = {
      agentId: id,
      kind,
      status: 'starting',
      pid: this.simulatePid(id, kind),
      startedAt: ts,
      lastTransitionAt: ts,
    }
    this.handles.set(id, handle)
    // immediate transition to running for sync start in this layer
    handle.status = 'running'
    handle.lastTransitionAt = this.now()
    return { ...handle }
  }

  block(agentId: string, reason?: string): AgentHandle {
    const id = requireAgentId(agentId)
    const h = this.getOrThrow(id)
    if (h.status === 'stopped') throw new Error('cannot block a stopped agent')
    const ts = this.now()
    h.status = 'blocked'
    h.reason = reason ?? 'manual-block'
    h.lastTransitionAt = ts
    return { ...h }
  }

  resume(agentId: string): AgentHandle {
    const id = requireAgentId(agentId)
    const h = this.getOrThrow(id)
    if (h.status !== 'blocked' && h.status !== 'stopped') {
      // allow resume on running as no-op
      return { ...h }
    }
    const ts = this.now()
    h.status = h.status === 'stopped' ? 'resuming' : 'running'
    h.lastTransitionAt = ts
    if (h.status === 'resuming') {
      h.status = 'running'
      h.startedAt = ts
      delete h.stoppedAt
    }
    delete h.reason
    return { ...h }
  }

  stop(agentId: string): AgentHandle {
    const id = requireAgentId(agentId)
    const h = this.getOrThrow(id)
    if (h.status === 'stopped') return { ...h }
    const ts = this.now()
    h.status = 'stopping'
    h.lastTransitionAt = ts
    h.status = 'stopped'
    h.stoppedAt = ts
    return { ...h }
  }

  get(agentId: string): AgentHandle | null {
    const id = requireAgentId(agentId)
    const h = this.handles.get(id)
    return h ? { ...h } : null
  }

  list(): AgentHandle[] {
    return Array.from(this.handles.values()).map((h) => ({ ...h })).sort((a, b) => a.agentId.localeCompare(b.agentId))
  }

  getManagerHandles(): AgentHandle[] {
    return this.list().filter((h) => h.kind === 'manager')
  }

  getProjectHandles(): AgentHandle[] {
    return this.list().filter((h) => h.kind === 'project')
  }

  private getOrThrow(id: string): AgentHandle {
    const h = this.handles.get(id)
    if (!h) throw new Error(`agent not found: ${id}`)
    return h
  }
}

export const agentLifecycleService = new AgentLifecycleService()
