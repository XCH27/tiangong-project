/**
 * Agent lifecycle RPC handlers (LOCAL_ONLY).
 * Backed by AgentRegistryService (no separate store). State model only.
 */

import {
  RPC_CHANNELS,
  type AgentLifecycleCreateInput,
  type AgentLifecycleUpdateInput,
  type AgentLifecycleListInput,
  type AgentLifecycleListResult,
  type AgentLifecycleGetResult,
  type AgentLifecycleActionResult,
} from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { agentRegistryService } from '../../services/agent-registry'

function requireAgentId(id: string): string {
  if (typeof id !== 'string' || !id.trim()) throw new Error('agentId is required')
  return id
}

export function registerAgentLifecycleHandlers(server: RpcServer, _deps: HandlerDeps): void {
  server.handle(RPC_CHANNELS.agentLifecycle.CREATE, async (_ctx, input: AgentLifecycleCreateInput): Promise<AgentLifecycleActionResult> => {
    if (!input || typeof input !== 'object') throw new Error('input required')
    const kind = input.kind === 'manager' ? 'manager' : 'project'
    const created = agentRegistryService.create({
      agentId: requireAgentId((input as any).agentId ?? (kind === 'manager' ? `manager:${(input as any).workspaceId || 'global'}` : `project:${requireAgentId((input as any).sessionId || (input as any).agentId)}`)),
      kind,
      workspaceId: input.workspaceId,
      sessionId: (input as any).sessionId,
      runtime: input.runtime,
      role: input.role,
      displayName: input.displayName,
    })
    return { agent: agentRegistryService.toLifecycleDescriptor(created) }
  })

  server.handle(RPC_CHANNELS.agentLifecycle.UPDATE, async (_ctx, input: AgentLifecycleUpdateInput): Promise<AgentLifecycleActionResult> => {
    if (!input || !input.agentId) throw new Error('agentId is required')
    const updated = agentRegistryService.update({
      agentId: requireAgentId(input.agentId),
      runtime: input.runtime,
      role: input.role,
      displayName: input.displayName,
      status: input.status as any,
    })
    return { agent: agentRegistryService.toLifecycleDescriptor(updated) }
  })

  server.handle(RPC_CHANNELS.agentLifecycle.LIST, async (_ctx, input?: AgentLifecycleListInput): Promise<AgentLifecycleListResult> => {
    const list = agentRegistryService.list({ workspaceId: input?.workspaceId, sessionId: input?.sessionId })
    const filtered = input?.kind ? list.filter((a) => a.kind === input.kind) : list
    return { agents: filtered.map((a) => agentRegistryService.toLifecycleDescriptor(a)) }
  })

  server.handle(RPC_CHANNELS.agentLifecycle.GET, async (_ctx, input?: { agentId: string }): Promise<AgentLifecycleGetResult> => {
    if (!input || !input.agentId) throw new Error('agentId is required')
    const d = agentRegistryService.get(requireAgentId(input.agentId))
    return { agent: d ? agentRegistryService.toLifecycleDescriptor(d) : null }
  })

  server.handle(RPC_CHANNELS.agentLifecycle.MARK_ACTIVE, async (_ctx, input?: { agentId: string }): Promise<AgentLifecycleActionResult> => {
    if (!input || !input.agentId) throw new Error('agentId is required')
    const d = agentRegistryService.markActive(requireAgentId(input.agentId))
    return { agent: agentRegistryService.toLifecycleDescriptor(d) }
  })

  server.handle(RPC_CHANNELS.agentLifecycle.STOP, async (_ctx, input?: { agentId: string }): Promise<AgentLifecycleActionResult> => {
    if (!input || !input.agentId) throw new Error('agentId is required')
    const d = agentRegistryService.stop(requireAgentId(input.agentId))
    return { agent: agentRegistryService.toLifecycleDescriptor(d) }
  })
}
