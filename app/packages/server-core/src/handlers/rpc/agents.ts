/**
 * Agent registry RPC handlers.
 *
 * Read-only v1: exposes stable actor metadata for timeline/UI. It does not
 * create sessions, processes, messages, or a second agent store.
 */

import {
  RPC_CHANNELS,
  type AgentRegistryGetInput,
  type AgentRegistryListInput,
} from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { agentRegistryService } from '../../services/agent-registry'

export function registerAgentRegistryHandlers(server: RpcServer, _deps: HandlerDeps): void {
  server.handle(RPC_CHANNELS.agents.LIST, async (_ctx, input?: AgentRegistryListInput) => {
    return { agents: agentRegistryService.listAgents(input ?? {}) }
  })

  server.handle(RPC_CHANNELS.agents.GET, async (_ctx, input: AgentRegistryGetInput) => {
    return { agent: agentRegistryService.getAgent(input.agentId) }
  })
}
