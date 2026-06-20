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

function parseAgentListInput(input?: AgentRegistryListInput): AgentRegistryListInput {
  if (input === undefined) return {}
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('agents:list input must be an object')
  }
  return input
}

function parseAgentGetInput(input?: AgentRegistryGetInput): AgentRegistryGetInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('agentId is required')
  }
  return input
}

export function registerAgentRegistryHandlers(server: RpcServer, _deps: HandlerDeps): void {
  server.handle(RPC_CHANNELS.agents.LIST, async (_ctx, input?: AgentRegistryListInput) => {
    return { agents: agentRegistryService.listAgents(parseAgentListInput(input)) }
  })

  server.handle(RPC_CHANNELS.agents.GET, async (_ctx, input?: AgentRegistryGetInput) => {
    return { agent: agentRegistryService.getAgent(parseAgentGetInput(input).agentId) }
  })
}
