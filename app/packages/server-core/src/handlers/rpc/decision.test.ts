import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'bun:test'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { HandlerFn, RequestContext, RpcServer } from '@craft-agent/server-core/transport'
import { DecisionService } from '../../services/decision-service'
import { registerDecisionHandlers } from './decision'

async function createHarness() {
  const dataDir = await mkdtemp(join(tmpdir(), 'decision-rpc-'))
  const service = new DecisionService(dataDir)
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
  registerDecisionHandlers(server, { decisionService: service } as never)
  const ctx: RequestContext = { clientId: 'client-1', workspaceId: 'workspace-1', webContentsId: 1 }
  return { handlers, ctx }
}

function requireHandler(handlers: Map<string, HandlerFn>, channel: string): HandlerFn {
  const handler = handlers.get(channel)
  if (!handler) throw new Error(`missing handler ${channel}`)
  return handler
}

describe('registerDecisionHandlers', () => {
  it('upserts, lists, applies, and deletes local decision rules', async () => {
    const { handlers, ctx } = await createHarness()
    const upsert = requireHandler(handlers, RPC_CHANNELS.decision.UPSERT_RULE)
    const list = requireHandler(handlers, RPC_CHANNELS.decision.LIST_RULES)
    const evaluate = requireHandler(handlers, RPC_CHANNELS.decision.EVALUATE)
    const remove = requireHandler(handlers, RPC_CHANNELS.decision.DELETE_RULE)

    const saved = await upsert(ctx, {
      id: 'allow-design-agent-style',
      action: 'write-design:set_style',
      scope: 'local',
      level: 'L2',
      allow: true,
      reason: 'User allowed design agent style edits in this workspace',
    })
    expect(saved.rule).toMatchObject({ id: 'allow-design-agent-style', allow: true, level: 'L2' })

    const listed = await list(ctx)
    expect(listed.rules.map((rule: { id: string }) => rule.id)).toEqual(['allow-design-agent-style'])

    const decision = await evaluate(ctx, {
      action: 'write-design:set_style',
      scope: 'local',
      risk: 'reversible',
    })
    expect(decision).toMatchObject({ outcome: 'allow', level: 'L2', ruleRef: 'RULE:allow-design-agent-style' })

    await expect(remove(ctx, { id: 'allow-design-agent-style' })).resolves.toEqual({ deleted: true, id: 'allow-design-agent-style' })
    expect(await list(ctx)).toEqual({ rules: [] })
  })

  it('rejects invalid rule mutations', async () => {
    const { handlers, ctx } = await createHarness()
    const upsert = requireHandler(handlers, RPC_CHANNELS.decision.UPSERT_RULE)
    const remove = requireHandler(handlers, RPC_CHANNELS.decision.DELETE_RULE)

    await expect(upsert(ctx, { action: 'write-design:set_style', allow: true })).rejects.toThrow('id is required')
    await expect(upsert(ctx, { id: 'x', action: '', allow: true })).rejects.toThrow('action is required')
    await expect(remove(ctx, { id: '   ' })).rejects.toThrow('id is required')
  })
})
