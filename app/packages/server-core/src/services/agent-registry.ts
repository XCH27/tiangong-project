import {
  actorFromAgentDescriptor,
  type ActorRef,
  type AgentDescriptor,
  type AgentRegistryEnsureManagerInput,
  type AgentRegistryEnsureProjectInput,
  type AgentRegistryListInput,
} from '@craft-agent/shared/protocol'

export interface AgentRegistryServiceOptions {
  now?: () => number
}

function sanitizeIdPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.:-]/g, '_')
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`${field} must be a string`)
  if (!value.trim()) throw new Error(`${field} is required`)
  return value
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new Error(`${field} must be a string`)
  return value.trim() ? value : undefined
}

export class AgentRegistryService {
  private readonly agents = new Map<string, AgentDescriptor>()
  private readonly now: () => number

  constructor(options: AgentRegistryServiceOptions = {}) {
    this.now = options.now ?? (() => Date.now())
  }

  ensureManagerAgent(input: AgentRegistryEnsureManagerInput = {}): AgentDescriptor {
    const workspaceId = optionalString(input.workspaceId, 'workspaceId')
    const scope = workspaceId ? sanitizeIdPart(workspaceId) : 'global'
    const agentId = `manager:${scope}`
    return this.upsert(agentId, {
      kind: 'manager',
      role: 'manager',
      displayName: input.displayName ?? '管理 Agent',
      runtime: input.runtime,
      workspaceId,
      status: 'active',
    })
  }

  ensureProjectAgentForSession(input: AgentRegistryEnsureProjectInput): AgentDescriptor {
    const sessionId = requireString(input.sessionId, 'sessionId')
    const agentId = `project:${sanitizeIdPart(sessionId)}`
    return this.upsert(agentId, {
      kind: 'project',
      role: input.role ?? 'leader',
      displayName: input.displayName ?? '项目 Agent',
      runtime: input.runtime,
      sessionId,
      workspaceId: input.workspaceId,
      status: 'active',
    })
  }

  actorForSession(sessionId: string): ActorRef | null {
    const agent = this.getProjectAgentForSession(sessionId)
    return agent ? actorFromAgentDescriptor(agent) : null
  }

  getProjectAgentForSession(sessionId: string): AgentDescriptor | null {
    return this.agents.get(`project:${sanitizeIdPart(requireString(sessionId, 'sessionId'))}`) ?? null
  }

  getManagerAgent(workspaceId?: string): AgentDescriptor | null {
    const normalizedWorkspaceId = optionalString(workspaceId, 'workspaceId')
    const scope = normalizedWorkspaceId ? sanitizeIdPart(normalizedWorkspaceId) : 'global'
    return this.agents.get(`manager:${scope}`) ?? null
  }

  getAgent(agentId: string): AgentDescriptor | null {
    return this.agents.get(requireString(agentId, 'agentId')) ?? null
  }

  listAgents(input: AgentRegistryListInput = {}): AgentDescriptor[] {
    const workspaceId = optionalString(input.workspaceId, 'workspaceId')
    const sessionId = optionalString(input.sessionId, 'sessionId')

    return Array.from(this.agents.values())
      .filter((agent) => workspaceId ? agent.workspaceId === workspaceId : true)
      .filter((agent) => sessionId ? agent.sessionId === sessionId : true)
      .sort((a, b) => a.agentId.localeCompare(b.agentId))
  }

  private upsert(agentId: string, patch: Omit<AgentDescriptor, 'agentId' | 'createdAt' | 'updatedAt'>): AgentDescriptor {
    const existing = this.agents.get(agentId)
    const timestamp = this.now()
    const next: AgentDescriptor = {
      ...(existing ?? { agentId, createdAt: timestamp }),
      ...patch,
      agentId,
      updatedAt: timestamp,
      lastActiveAt: patch.status === 'active' ? timestamp : existing?.lastActiveAt,
    }
    this.agents.set(agentId, next)
    return next
  }
}

export const agentRegistryService = new AgentRegistryService()
