import {
  actorFromAgentDescriptor,
  type ActorRef,
  type AgentDescriptor,
  type AgentRegistryEnsureProjectInput,
  type AgentRegistryListInput,
} from '@craft-agent/shared/protocol'

export interface AgentRegistryServiceOptions {
  now?: () => number
}

function sanitizeIdPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.:-]/g, '_')
}

export class AgentRegistryService {
  private readonly agents = new Map<string, AgentDescriptor>()
  private readonly now: () => number

  constructor(options: AgentRegistryServiceOptions = {}) {
    this.now = options.now ?? (() => Date.now())
  }

  ensureManagerAgent(input: { workspaceId?: string; runtime?: string; displayName?: string } = {}): AgentDescriptor {
    const scope = input.workspaceId ? sanitizeIdPart(input.workspaceId) : 'global'
    const agentId = `manager:${scope}`
    return this.upsert(agentId, {
      kind: 'manager',
      role: 'manager',
      displayName: input.displayName ?? '管理 Agent',
      runtime: input.runtime,
      workspaceId: input.workspaceId,
      status: 'active',
    })
  }

  ensureProjectAgentForSession(input: AgentRegistryEnsureProjectInput): AgentDescriptor {
    const agentId = `project:${sanitizeIdPart(input.sessionId)}`
    return this.upsert(agentId, {
      kind: 'project',
      role: input.role ?? 'leader',
      displayName: input.displayName ?? '项目 Agent',
      runtime: input.runtime,
      sessionId: input.sessionId,
      workspaceId: input.workspaceId,
      status: 'active',
    })
  }

  actorForSession(sessionId: string): ActorRef | null {
    const agent = this.agents.get(`project:${sanitizeIdPart(sessionId)}`)
    return agent ? actorFromAgentDescriptor(agent) : null
  }

  getAgent(agentId: string): AgentDescriptor | null {
    return this.agents.get(agentId) ?? null
  }

  listAgents(input: AgentRegistryListInput = {}): AgentDescriptor[] {
    return Array.from(this.agents.values())
      .filter((agent) => input.workspaceId ? agent.workspaceId === input.workspaceId : true)
      .filter((agent) => input.sessionId ? agent.sessionId === input.sessionId : true)
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
    }
    this.agents.set(agentId, next)
    return next
  }
}

export const agentRegistryService = new AgentRegistryService()
