import type { ActorRef, AgentRole } from './design'

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

export type AgentKind = 'manager' | 'project'

export interface AgentLifecycleDescriptor {
  agentId: string
  kind: AgentKind
  role: AgentRole
  displayName: string
  runtime?: string
  sessionId?: string
  workspaceId?: string
  status: AgentLifecycleStatus
  createdAt: number
  updatedAt: number
  lastActiveAt?: number
}

export interface AgentLifecycleCreateInput {
  kind: AgentKind
  workspaceId?: string
  sessionId?: string
  runtime?: string
  role?: AgentRole
  displayName?: string
}

export interface AgentLifecycleUpdateInput {
  agentId: string
  runtime?: string
  role?: AgentRole
  displayName?: string
  status?: AgentLifecycleStatus
}

export interface AgentLifecycleListInput {
  workspaceId?: string
  sessionId?: string
  kind?: AgentKind
}

export interface AgentLifecycleListResult {
  agents: AgentLifecycleDescriptor[]
}

export interface AgentLifecycleGetResult {
  agent: AgentLifecycleDescriptor | null
}

export interface AgentLifecycleActionResult {
  agent: AgentLifecycleDescriptor
}

export function actorFromLifecycleDescriptor(d: AgentLifecycleDescriptor): ActorRef {
  return {
    kind: 'agent',
    agentId: d.agentId,
    runtime: d.runtime,
    role: d.role,
    displayName: d.displayName,
  }
}
