import { describe, expect, it } from 'bun:test'
import type { SessionToolContext } from '../context.ts'
import { handleInvokeInternalAction, handleListInternalActions } from './internal-action.ts'

function textOf(result: Awaited<ReturnType<typeof handleListInternalActions>>): string {
  return result.content.map((block) => block.type === 'text' ? block.text : '').join('\n')
}

describe('internal action session tools', () => {
  it('lists internal actions through context callback', async () => {
    const ctx = {
      listInternalActions: async () => [
        {
          id: 'files.move_entry',
          contractVersion: 1,
          surface: 'files',
          verb: 'mutate',
          title: 'Move file',
          permissionLevel: 'L2',
          inputSchema: { type: 'object' },
        },
      ],
    } as Partial<SessionToolContext> as SessionToolContext

    const result = await handleListInternalActions(ctx, { surface: 'files' })

    expect(result.isError).toBe(false)
    expect(textOf(result)).toContain('files.move_entry')
  })

  it('reports unavailable invoke callback honestly', async () => {
    const result = await handleInvokeInternalAction({} as SessionToolContext, {
      actionDefinitionId: 'files.move_entry',
      contractVersion: 1,
      actor: { kind: 'agent', agentId: 'agent-1' },
      input: {},
    })

    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('not available')
  })

  it('requires actionDefinitionId instead of actionId', async () => {
    const ctx = {
      invokeInternalAction: async () => ({ ok: true }),
    } as Partial<SessionToolContext> as SessionToolContext

    const result = await handleInvokeInternalAction(ctx, {
      actionDefinitionId: '',
      contractVersion: 1,
      actor: { kind: 'agent', agentId: 'agent-1' },
      input: {},
    })

    expect(result.isError).toBe(true)
    expect(textOf(result)).toContain('actionDefinitionId is required')
  })

  it('invokes internal action through context callback', async () => {
    const calls: unknown[] = []
    const ctx = {
      invokeInternalAction: async (invocation) => {
        calls.push(invocation)
        return { patchId: 'patch-1' }
      },
    } as Partial<SessionToolContext> as SessionToolContext

    const result = await handleInvokeInternalAction(ctx, {
      actionDefinitionId: 'files.move_entry',
      contractVersion: 1,
      actor: { kind: 'agent', agentId: 'agent-1', runtime: 'api', role: 'code' },
      input: { fromPath: 'a.txt', toPath: 'b.txt' },
      idempotencyKey: 'move-1',
    })

    expect(result.isError).toBe(false)
    expect(calls).toHaveLength(1)
    expect(textOf(result)).toContain('patch-1')
  })
})
