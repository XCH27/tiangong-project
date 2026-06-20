import { describe, expect, it } from 'bun:test'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { HandlerFn, RequestContext, RpcServer } from '@craft-agent/server-core/transport'
import { registerAgentRegistryHandlers } from '../handlers/rpc/agents'
import { AgentRegistryService } from './agent-registry'

function createAgentRpcHarness() {
  const handlers = new Map<string, HandlerFn>()

  const server: RpcServer = {
    handle(channel, handler) {
      handlers.set(channel, handler)
    },
    push() {},
    async invokeClient() {
      return undefined
    },
    hasClientCapability() { return false },
    findClientsWithCapability() { return [] },
  }

  registerAgentRegistryHandlers(server, {} as Parameters<typeof registerAgentRegistryHandlers>[1])

  const list = handlers.get(RPC_CHANNELS.agents.LIST)
  const get = handlers.get(RPC_CHANNELS.agents.GET)

  if (!list || !get) {
    throw new Error('agent registry handlers not registered')
  }

  const ctx: RequestContext = {
    clientId: 'client-1',
    workspaceId: 'workspace-1',
    webContentsId: 1,
  }

  return { list, get, ctx }
}

describe('AgentRegistryService', () => {
  it('creates a stable project agent actor per session', () => {
    const registry = new AgentRegistryService({ now: () => 100 })

    const first = registry.ensureProjectAgentForSession({
      sessionId: 'session-1',
      workspaceId: 'workspace-1',
      runtime: 'claude-max',
    })
    const second = registry.ensureProjectAgentForSession({
      sessionId: 'session-1',
      workspaceId: 'workspace-1',
      runtime: 'grok',
    })

    expect(first.agentId).toBe('project:session-1')
    expect(second.agentId).toBe(first.agentId)
    expect(second.runtime).toBe('grok')
    expect(second.role).toBe('leader')
    expect(registry.actorForSession('session-1')).toEqual({
      kind: 'agent',
      agentId: 'project:session-1',
      runtime: 'grok',
      role: 'leader',
      displayName: '项目 Agent',
    })
  })

  it('queries project agents by session without creating missing agents', () => {
    const registry = new AgentRegistryService({ now: () => 100 })

    expect(registry.getProjectAgentForSession('session-1')).toBeNull()

    const ensured = registry.ensureProjectAgentForSession({
      sessionId: 'session-1',
      workspaceId: 'workspace-1',
      role: 'designer',
      displayName: 'Design Agent',
    })

    expect(registry.getProjectAgentForSession('session-1')).toEqual(ensured)
    expect(registry.getProjectAgentForSession('session-2')).toBeNull()
  })

  it('rejects blank session ids before creating project agents', () => {
    const registry = new AgentRegistryService({ now: () => 100 })

    expect(() => registry.ensureProjectAgentForSession({ sessionId: '   ' })).toThrow('sessionId is required')
    expect(registry.listAgents()).toEqual([])
  })

  it('filters agents by workspace and session without storing conversations', () => {
    const registry = new AgentRegistryService({ now: () => 100 })
    registry.ensureManagerAgent({ workspaceId: 'workspace-1' })
    registry.ensureProjectAgentForSession({ sessionId: 's1', workspaceId: 'workspace-1' })
    registry.ensureProjectAgentForSession({ sessionId: 's2', workspaceId: 'workspace-2' })

    expect(registry.listAgents({ workspaceId: 'workspace-1' }).map((agent) => agent.agentId)).toEqual([
      'manager:workspace-1',
      'project:s1',
    ])
    expect(registry.listAgents({ sessionId: 's2' }).map((agent) => agent.agentId)).toEqual(['project:s2'])
  })
})

describe('registerAgentRegistryHandlers', () => {
  it('rejects malformed list filters', async () => {
    const { list, ctx } = createAgentRpcHarness()

    await expect(list(ctx, { workspaceId: 123 })).rejects.toThrow('workspaceId must be a string')
    await expect(list(ctx, { sessionId: false })).rejects.toThrow('sessionId must be a string')
  })

  it('rejects malformed get input before lookup', async () => {
    const { get, ctx } = createAgentRpcHarness()

    await expect(get(ctx)).rejects.toThrow('agentId is required')
    await expect(get(ctx, { agentId: '   ' })).rejects.toThrow('agentId is required')
    await expect(get(ctx, { agentId: 123 })).rejects.toThrow('agentId must be a string')
  })
})
