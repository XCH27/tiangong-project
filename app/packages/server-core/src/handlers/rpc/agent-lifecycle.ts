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
import { AgentLifecycleService, agentLifecycleService } from '../../services/agent-lifecycle'

type AgentLifecycleHandlerDeps = HandlerDeps & { agentLifecycleService?: AgentLifecycleService }

function requireAgentId(id: string): string {
  if (typeof id !== 'string' || !id.trim()) throw new Error('agentId is required')
  return id
}

export function registerAgentLifecycleHandlers(server: RpcServer, deps: HandlerDeps): void {
  const lifecycleService = (deps as AgentLifecycleHandlerDeps).agentLifecycleService ?? agentLifecycleService

  server.handle(RPC_CHANNELS.agentLifecycle.CREATE, async (_ctx, input: AgentLifecycleCreateInput): Promise<AgentLifecycleActionResult> => {
    if (!input || typeof input !== 'object') throw new Error('input required')
    const kind = input.kind === 'manager' ? 'manager' : 'project'
    const created = lifecycleService.create({
      agentId: requireAgentId((input as any).agentId ?? (kind === 'manager' ? `manager:${(input as any).workspaceId || 'global'}` : `project:${requireAgentId((input as any).sessionId || (input as any).agentId)}`)),
      kind,
      workspaceId: input.workspaceId,
      sessionId: (input as any).sessionId,
      runtime: input.runtime,
      role: input.role,
      displayName: input.displayName,
    })
    return { agent: lifecycleService.toLifecycleDescriptor(created) }
  })

  server.handle(RPC_CHANNELS.agentLifecycle.UPDATE, async (_ctx, input: AgentLifecycleUpdateInput): Promise<AgentLifecycleActionResult> => {
    if (!input || !input.agentId) throw new Error('agentId is required')
    const updated = lifecycleService.update({
      agentId: requireAgentId(input.agentId),
      runtime: input.runtime,
      role: input.role,
      displayName: input.displayName,
      status: input.status as any,
    })
    return { agent: lifecycleService.toLifecycleDescriptor(updated) }
  })

  server.handle(RPC_CHANNELS.agentLifecycle.LIST, async (_ctx, input?: AgentLifecycleListInput): Promise<AgentLifecycleListResult> => {
    const list = lifecycleService.list({ workspaceId: input?.workspaceId, sessionId: input?.sessionId, kind: input?.kind })
    return { agents: list.map((a) => lifecycleService.toLifecycleDescriptor(a)) }
  })

  server.handle(RPC_CHANNELS.agentLifecycle.GET, async (_ctx, input?: { agentId: string }): Promise<AgentLifecycleGetResult> => {
    if (!input || !input.agentId) throw new Error('agentId is required')
    const d = lifecycleService.get(requireAgentId(input.agentId))
    return { agent: d ? lifecycleService.toLifecycleDescriptor(d) : null }
  })

  server.handle(RPC_CHANNELS.agentLifecycle.MARK_ACTIVE, async (_ctx, input?: { agentId: string }): Promise<AgentLifecycleActionResult> => {
    if (!input || !input.agentId) throw new Error('agentId is required')
    const d = lifecycleService.markActive(requireAgentId(input.agentId))
    return { agent: lifecycleService.toLifecycleDescriptor(d) }
  })

  server.handle(RPC_CHANNELS.agentLifecycle.STOP, async (_ctx, input?: { agentId: string }): Promise<AgentLifecycleActionResult> => {
    if (!input || !input.agentId) throw new Error('agentId is required')
    const d = lifecycleService.stop(requireAgentId(input.agentId))
    return { agent: lifecycleService.toLifecycleDescriptor(d) }
  })
}
