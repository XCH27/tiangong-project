import { randomUUID } from 'node:crypto'
import { FileAgentLifecyclePersistence, getAgentLifecycleDataDir } from './agent-lifecycle-persistence'
import type { AgentLifecycleDescriptor } from '@craft-agent/shared/protocol'

export type AgentKind = 'manager' | 'project'
export type AgentLifecycleStatus =
  | 'starting'
  | 'running'
  | 'blocked'
  | 'stopping'
  | 'stopped'
  | 'resuming'
  | 'active'
  | 'idle'
  | 'unknown'

export interface AgentHandle {
  agentId: string
  kind: AgentKind
  status: AgentLifecycleStatus
  pid?: number
  startedAt?: number
  stoppedAt?: number
  lastTransitionAt: number
  reason?: string
  workspaceId?: string
  sessionId?: string
  runtime?: string
  role?: string
  displayName?: string
}

export interface LifecycleOptions {
  now?: () => number
  simulatePid?: (agentId: string, kind: AgentKind) => number | undefined
  dataDir?: string
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
  private persistence: FileAgentLifecyclePersistence

  constructor(options: LifecycleOptions = {}) {
    this.now = options.now ?? (() => Date.now())
    this.simulatePid = options.simulatePid ?? ((_id, _k) => Math.floor(Math.random() * 100000) + 1000)
    this.persistence = new FileAgentLifecyclePersistence(options.dataDir || getAgentLifecycleDataDir())
    // load persisted on construct (best effort)
    this.persistence.loadAll().then(list => {
      for (const d of list) {
        const h: AgentHandle = {
          agentId: d.agentId,
          kind: d.kind,
          status: (d.status as any) || 'active',
          lastTransitionAt: d.updatedAt || this.now(),
          workspaceId: d.workspaceId,
          sessionId: d.sessionId,
          runtime: d.runtime,
          role: d.role,
          displayName: d.displayName,
        }
        this.handles.set(d.agentId, h)
      }
    }).catch(() => {})
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
    handle.status = 'running'
    handle.lastTransitionAt = this.now()
    this.persistence.save(this.toDesc(handle)).catch(() => {})
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
    this.persistence.save(this.toDesc(h)).catch(() => {})
    return { ...h }
  }

  create(input: { agentId: string; kind?: AgentKind; workspaceId?: string; sessionId?: string; runtime?: string; role?: string; displayName?: string }): AgentHandle {
    const id = requireAgentId(input.agentId)
    const kind = input.kind ?? inferKind(id)
    const ts = this.now()
    const h: AgentHandle = {
      agentId: id,
      kind,
      status: 'active',
      lastTransitionAt: ts,
      workspaceId: input.workspaceId,
      sessionId: input.sessionId,
      runtime: input.runtime,
      role: input.role,
      displayName: input.displayName,
    }
    this.handles.set(id, h)
    this.persistence.save(this.toDesc(h)).catch(() => {})
    return { ...h }
  }

  update(input: { agentId: string; runtime?: string; role?: string; displayName?: string; status?: AgentLifecycleStatus }): AgentHandle {
    const id = requireAgentId(input.agentId)
    const h = this.getOrThrow(id)
    if (input.runtime !== undefined) h.runtime = input.runtime
    if (input.role !== undefined) h.role = input.role
    if (input.displayName !== undefined) h.displayName = input.displayName
    if (input.status !== undefined) h.status = input.status
    h.lastTransitionAt = this.now()
    this.persistence.save(this.toDesc(h)).catch(() => {})
    return { ...h }
  }

  markActive(agentId: string): AgentHandle {
    const id = requireAgentId(agentId)
    const h = this.getOrThrow(id)
    h.status = 'active'
    h.lastTransitionAt = this.now()
    this.persistence.save(this.toDesc(h)).catch(() => {})
    return { ...h }
  }

  list(input?: { workspaceId?: string; sessionId?: string; kind?: AgentKind }): AgentHandle[] {
    let res = Array.from(this.handles.values()).map((h) => ({ ...h })).sort((a, b) => a.agentId.localeCompare(b.agentId))
    if (input?.workspaceId) res = res.filter(h => h.workspaceId === input.workspaceId)
    if (input?.sessionId) res = res.filter(h => h.sessionId === input.sessionId)
    if (input?.kind) res = res.filter(h => h.kind === input.kind)
    return res
  }

  private toDesc(h: AgentHandle): AgentLifecycleDescriptor {
    return {
      agentId: h.agentId,
      kind: h.kind,
      role: (h.role as any) || 'leader',
      displayName: h.displayName || (h.kind === 'manager' ? '管理 Agent' : '项目 Agent'),
      runtime: h.runtime,
      sessionId: h.sessionId,
      workspaceId: h.workspaceId,
      status: h.status as any,
      createdAt: h.startedAt || h.lastTransitionAt || this.now(),
      updatedAt: h.lastTransitionAt || this.now(),
      lastActiveAt: h.lastTransitionAt,
    }
  }

  get(agentId: string): AgentHandle | null {
    const id = requireAgentId(agentId)
    const h = this.handles.get(id)
    return h ? { ...h } : null
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

// convenience factory for tests to override dataDir
export function createAgentLifecycleService(opts?: LifecycleOptions) { return new AgentLifecycleService(opts) }
