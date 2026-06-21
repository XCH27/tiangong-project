import type { ActorRef, AgentRole } from './design'

export type AgentRegistryKind = 'manager' | 'project'
export type AgentRegistryStatus = 'active' | 'idle' | 'stopped' | 'unknown'

export interface AgentDescriptor {
  agentId: string
  kind: AgentRegistryKind
  role: AgentRole
  displayName: string
  runtime?: string
  sessionId?: string
  workspaceId?: string
  status: AgentRegistryStatus
  createdAt: number
  updatedAt: number
  lastActiveAt?: number
}

export interface AgentRegistryListInput {
  workspaceId?: string
  sessionId?: string
}

export interface AgentRegistryGetInput {
  agentId: string
}

export interface AgentRegistryListResult {
  agents: AgentDescriptor[]
}

export interface AgentRegistryGetResult {
  agent: AgentDescriptor | null
}

export interface AgentRegistryEnsureProjectInput {
  sessionId: string
  workspaceId?: string
  runtime?: string
  role?: AgentRole
  displayName?: string
}

export interface AgentRegistryEnsureManagerInput {
  workspaceId?: string
  runtime?: string
  displayName?: string
}

export function actorFromAgentDescriptor(agent: AgentDescriptor): ActorRef {
  return {
    kind: 'agent',
    agentId: agent.agentId,
    runtime: agent.runtime,
    role: agent.role,
    displayName: agent.displayName,
  }
}
