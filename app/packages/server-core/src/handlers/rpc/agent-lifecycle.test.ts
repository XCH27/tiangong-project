import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { HandlerFn, RequestContext, RpcServer } from '@craft-agent/server-core/transport'
import { AgentLifecycleService } from '../../services/agent-lifecycle'
import { registerAgentLifecycleHandlers } from './agent-lifecycle'

async function createHarness() {
  const dataDir = await mkdtemp(join(tmpdir(), 'agent-lifecycle-rpc-'))
  const service = new AgentLifecycleService({ dataDir, now: () => 1000, simulatePid: () => 4242 })
  const handlers = new Map<string, HandlerFn>()
  const server: RpcServer = {
    handle(channel, handler) {
      handlers.set(channel, handler)
    },
    push() {},
    async invokeClient() {
      return undefined
    },
    hasClientCapability() {
      return false
    },
    findClientsWithCapability() {
      return []
    },
  }

  registerAgentLifecycleHandlers(server, { agentLifecycleService: service } as never)

  const ctx: RequestContext = {
    clientId: 'client-1',
    workspaceId: 'workspace-1',
    webContentsId: 1,
  }

  return { handlers, ctx }
}

function requireHandler(handlers: Map<string, HandlerFn>, channel: string): HandlerFn {
  const handler = handlers.get(channel)
  if (!handler) throw new Error(`missing handler ${channel}`)
  return handler
}

describe('registerAgentLifecycleHandlers', () => {
  it('creates, lists, updates, marks active, and stops through AgentLifecycleService', async () => {
    const { handlers, ctx } = await createHarness()
    const create = requireHandler(handlers, RPC_CHANNELS.agentLifecycle.CREATE)
    const list = requireHandler(handlers, RPC_CHANNELS.agentLifecycle.LIST)
    const update = requireHandler(handlers, RPC_CHANNELS.agentLifecycle.UPDATE)
    const markActive = requireHandler(handlers, RPC_CHANNELS.agentLifecycle.MARK_ACTIVE)
    const stop = requireHandler(handlers, RPC_CHANNELS.agentLifecycle.STOP)

    const created = await create(ctx, {
      kind: 'project',
      sessionId: 'session-1',
      workspaceId: 'workspace-1',
      runtime: 'claude',
      role: 'code',
      displayName: 'Code Agent',
    })

    expect(created.agent).toMatchObject({
      agentId: 'project:session-1',
      kind: 'project',
      status: 'active',
      runtime: 'claude',
      role: 'code',
      displayName: 'Code Agent',
    })

    const listed = await list(ctx, { workspaceId: 'workspace-1', kind: 'project' })
    expect(listed.agents.map((agent: { agentId: string }) => agent.agentId)).toEqual(['project:session-1'])

    const updated = await update(ctx, { agentId: 'project:session-1', runtime: 'grok', status: 'blocked' })
    expect(updated.agent).toMatchObject({ agentId: 'project:session-1', runtime: 'grok', status: 'blocked' })

    const active = await markActive(ctx, { agentId: 'project:session-1' })
    expect(active.agent.status).toBe('active')

    const stopped = await stop(ctx, { agentId: 'project:session-1' })
    expect(stopped.agent.status).toBe('stopped')
  })

  it('rejects malformed lifecycle inputs before mutating state', async () => {
    const { handlers, ctx } = await createHarness()
    const create = requireHandler(handlers, RPC_CHANNELS.agentLifecycle.CREATE)
    const get = requireHandler(handlers, RPC_CHANNELS.agentLifecycle.GET)

    await expect(create(ctx, { kind: 'project' })).rejects.toThrow('agentId is required')
    await expect(get(ctx, { agentId: '   ' })).rejects.toThrow('agentId is required')
  })
})
