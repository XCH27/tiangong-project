import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { InternalActionId, type ActionInvocation } from '../internal-action'
import { approvalForGate, FROZEN_ACTION_POLICY } from '../action-policy'
import { attributeTurnUsage } from '../usage-attribution'
import {
  EXECUTION_BOUNDARY,
  HostTurnKernel,
  KERNEL_SNAPSHOT_VERSION,
  PI_EXECUTION_ROLE,
  type KernelSnapshot,
  type TurnRequest,
} from '../turn-admission'
import type { ActorRef } from '../actor'

const human: ActorRef = { kind: 'human', id: 'user-1', displayName: 'Ada' }
const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }
const system: ActorRef = { kind: 'system', id: 'system', displayName: 'system' }

function invocation(
  actionId: ActionInvocation['actionId'],
  invocationId: string,
  actor: ActorRef,
  payload: Record<string, unknown> = {},
): ActionInvocation {
  return {
    invocationId,
    actionId,
    payload,
    targets: [],
    callerKind: actor.kind === 'human' ? 'human_ui' : 'agent',
    sessionId: 'session-1',
    createdAt: '2026-10-09T00:00:00.000Z',
  }
}

function request(actionId: ActionInvocation['actionId'], invocationId: string, actor: ActorRef = agent, payload: Record<string, unknown> = {}): TurnRequest {
  return { invocation: invocation(actionId, invocationId, actor, payload), actor }
}

function kernel(): HostTurnKernel {
  let tick = 0
  return new HostTurnKernel(undefined, {
    now: () => {
      tick += 1
      return `2026-10-09T00:00:${String(tick).padStart(2, '0')}.000Z`
    },
  })
}

describe('frozen action policy', () => {
  test('every frozen action id has one admission policy', () => {
    for (const actionId of Object.values(InternalActionId)) {
      const row = FROZEN_ACTION_POLICY[actionId]
      expect(row).toBeDefined()
      expect(row.approval).toBe(approvalForGate(row))
      expect(row.callers.includes('human_ui')).toBe(true)
      expect(row.evidence).toBe('session_journal')
    }
    expect(FROZEN_ACTION_POLICY[InternalActionId.SESSION_UNFLAG].sinceVersion).toBe('1.3.0')
    expect(FROZEN_ACTION_POLICY[InternalActionId.PLUGIN_LOADOUT_MUTATE].sideEffect).toBe('capability_scope')
    expect(FROZEN_ACTION_POLICY[InternalActionId.BROWSER_DOM_SNAPSHOT].sideEffect).toBe('evidence_capture')
    expect(FROZEN_ACTION_POLICY[InternalActionId.WORKBENCH_SIDEBAR_FOCUS].sideEffect).toBe('view_state')
    expect(FROZEN_ACTION_POLICY[InternalActionId.FILE_PAGE_TARGET].sideEffect).toBe('file_bytes')
  })
})

describe('usage attribution', () => {
  test('omitted usage stays unknown and does not become zero cost', () => {
    const usage = attributeTurnUsage()
    expect(usage.cache.status).toBe('unknown')
    expect(usage.cost.confidence).toBe('unknown')
    expect(usage.cost.amount).toBeUndefined()
    expect(usage.cachedInputTokens).toBeUndefined()
  })

  test('provider cache fields confirm a hit or a miss', () => {
    const hit = attributeTurnUsage({
      source: 'provider_response',
      cacheFieldPresent: true,
      cachedInputTokens: 12,
      inputTokens: 20,
      outputTokens: 4,
    })
    expect(hit.cache).toEqual({ status: 'confirmed_hit', source: 'provider_response' })

    const miss = attributeTurnUsage({
      source: 'provider_invoice',
      cacheFieldPresent: true,
      cachedInputTokens: 0,
    })
    expect(miss.cache.status).toBe('confirmed_miss')
  })

  test('absent cache fields are unknown, not a confirmed miss', () => {
    const usage = attributeTurnUsage({
      source: 'provider_response',
      inputTokens: 10,
      outputTokens: 2,
    })
    expect(usage.cache.status).toBe('unknown')
    expect(usage.cachedInputTokens).toBeUndefined()
  })

  test('cost is confirmed only with a provider source and pricing reference', () => {
    const confirmed = attributeTurnUsage({
      source: 'provider_invoice',
      amount: 0.12,
      currency: 'USD',
      pricingRef: 'price_2026_10',
    })
    expect(confirmed.cost.confidence).toBe('confirmed')
    expect(confirmed.cost.amount).toBe(0.12)

    const unpriced = attributeTurnUsage({
      source: 'provider_response',
      amount: 0.12,
      currency: 'USD',
    })
    expect(unpriced.cost.confidence).toBe('unknown')
    expect(unpriced.cost.amount).toBeUndefined()

    const estimate = attributeTurnUsage({ source: 'estimate', amount: 0.05, currency: 'USD' })
    expect(estimate.cost.confidence).toBe('estimated')
    expect(estimate.cost.amount).toBe(0.05)
  })
})

describe('host turn admission', () => {
  test('Pi execution role is the default turn sequencer and this module does not import Pi', () => {
    expect(PI_EXECUTION_ROLE).toBe('default_turn_sequencer_only')
    expect(EXECUTION_BOUNDARY.host).toBe('fleet_host_turn_admission')
    const source = readFileSync(new URL('../turn-admission.ts', import.meta.url), 'utf8')
    expect(source.includes('@earendil-works')).toBe(false)
    expect(source.includes('full Pi SDK')).toBe(false)
    const driver = readFileSync(new URL('../../agent/backend/internal/drivers/pi.ts', import.meta.url), 'utf8')
    expect(driver.includes('full Pi SDK')).toBe(false)
  })

  test('awaiting admit notifies once; a non-human approve does not', () => {
    const host = kernel()
    const seen: string[] = []
    host.setAdmissionObserver((outcome) => {
      seen.push(outcome.invocationId)
    })
    expect(host.admit(request(InternalActionId.SESSION_FLAG, 'inv-l0')).status).toBe('admitted')
    expect(seen).toEqual([])
    expect(host.admit(request(InternalActionId.FILE_DELETE, 'inv-l3')).status).toBe('approval_required')
    expect(host.admit(request(InternalActionId.FILE_DELETE, 'inv-l3')).status).toBe('approval_required')
    expect(seen).toEqual(['inv-l3', 'inv-l3'])
    expect(host.approve('inv-l3', agent).status).toBe('approval_required')
    expect(seen).toEqual(['inv-l3', 'inv-l3'])
  })

  test('L0 turn admits, completes once, and records unknown usage when the provider sent none', async () => {
    const host = kernel()
    const admitted = host.admit(request(InternalActionId.SESSION_FLAG, 'inv-l0'))
    expect(admitted.status).toBe('admitted')

    let calls = 0
    const first = await host.run('inv-l0', async () => {
      calls += 1
      return { output: { flagged: true } }
    })
    const second = await host.run('inv-l0', async () => {
      calls += 1
      return { output: { flagged: false } }
    })

    expect(calls).toBe(1)
    expect(first.status).toBe('completed')
    expect(second).toEqual(first)
    expect(first.usage?.cost.confidence).toBe('unknown')
    expect(first.usage?.cache.status).toBe('unknown')

    const events = host.events('session-1')
    expect(events.map((event) => event.kind)).toEqual(['action_invoked', 'action_completed'])
    expect(events.map((event) => event.seq)).toEqual([1, 2])
    expect(events[1]?.payload.executionBoundary).toEqual(EXECUTION_BOUNDARY)
    expect(JSON.stringify(events)).not.toContain('"amount":0')
  })

  test('unknown action, malformed actor, system mutation, and credential payload do not execute', async () => {
    const host = kernel()
    let calls = 0
    const executor = async () => {
      calls += 1
      return { output: 'no' }
    }

    const unknown = host.admit(request('not.real' as ActionInvocation['actionId'], 'inv-unknown'))
    expect(unknown).toMatchObject({ status: 'denied', reason: 'unknown_action' })
    await host.run('inv-unknown', executor)

    const malformed = host.admit({
      invocation: invocation(InternalActionId.SESSION_FLAG, 'inv-bad-actor', human),
      actor: { kind: 'human', id: ' ', displayName: '' },
    })
    const mismatched = host.admit({
      invocation: invocation(InternalActionId.SESSION_FLAG, 'inv-mismatch', agent),
      actor: human,
    })
    expect(mismatched).toMatchObject({ status: 'denied', reason: 'caller_actor_mismatch' })
    expect(malformed.reason).toBe('malformed_actor')

    const systemWrite = host.admit(request(InternalActionId.FILE_UPDATE, 'inv-system', system))
    expect(systemWrite).toMatchObject({ status: 'denied', reason: 'actor_not_permitted' })

    const secret = 'sk-testsecretvalue'
    const leaked = host.admit(request(InternalActionId.SESSION_FLAG, 'inv-secret', agent, { apiKey: secret, note: `Bearer ${secret}` }))
    expect(leaked).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
    const serialized = JSON.stringify(host.snapshot())
    expect(serialized).not.toContain(secret)
    expect(calls).toBe(0)
  })

  test('L3 ignores pre-authorization and waits for a human before any executor call', async () => {
    const host = kernel()
    let calls = 0
    const ask = host.admit({
      ...request(InternalActionId.FILE_DELETE, 'inv-l3'),
      preAuthorizedBy: human,
    })
    expect(ask.status).toBe('approval_required')
    expect(host.approve('inv-l3', agent).status).toBe('approval_required')
    await host.run('inv-l3', async () => {
      calls += 1
      return {}
    })
    expect(calls).toBe(0)

    expect(host.approve('inv-l3', human).status).toBe('admitted')
    const done = await host.run('inv-l3', async () => {
      calls += 1
      return { output: { deleted: true }, sideEffectCommitted: true }
    })
    expect(done.status).toBe('completed')
    expect(calls).toBe(1)
    expect(host.events('session-1').map((event) => event.kind)).toEqual([
      'supervision_requested',
      'supervision_resolved',
      'action_invoked',
      'action_completed',
    ])
  })

  test('L1 without an undo contract is approval-gated, and L2 accepts only human pre-authorization', async () => {
    const host = kernel()
    const job = host.admit(request(InternalActionId.AIGC_JOB_SUBMIT, 'inv-job'))
    expect(job).toMatchObject({ status: 'approval_required', reason: 'undo_contract_missing' })

    const agentPreauth = host.admit({
      ...request(InternalActionId.WORKSPACE_RENAME, 'inv-l2-agent'),
      preAuthorizedBy: agent,
    })
    expect(agentPreauth.status).toBe('approval_required')

    const humanPreauth = host.admit({
      ...request(InternalActionId.WORKSPACE_RENAME, 'inv-l2-human', human),
      preAuthorizedBy: human,
    })
    expect(humanPreauth.status).toBe('admitted')
    const renamed = await host.run('inv-l2-human', async () => ({
      output: { name: 'Fleet' },
      undoHandle: { undoId: 'undo-1', label: 'rename', snapshot: { name: 'Old' } },
    }))
    expect(renamed.status).toBe('completed')
  })

  test('misowned verbs are denied and a side flag does not upgrade an L1 row', () => {
    const host = kernel()
    expect(host.admit(request(InternalActionId.FILE_UPDATE, 'inv-plugin', agent, {
      filePath: 'loadout.json',
      pluginId: 'hook:lint',
      op: 'enable',
      nextDocument: { version: 1, records: [{ id: 'hook:lint', installed: true, enabled: true }] },
    }))).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:plugin_loadout' })

    expect(host.admit(request(InternalActionId.CANVAS_NODE_SELECT, 'inv-side', agent, {
      surface: 'mcp_apps',
      op: 'focus',
    }))).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:sidebar_focus' })

    const sidebarTarget = request(InternalActionId.CANVAS_NODE_SELECT, 'inv-slot', agent, { op: 'open' })
    sidebarTarget.invocation.targets = [{ kind: 'unknown', id: 'mcp-apps', label: 'mcp-apps' }]
    expect(host.admit(sidebarTarget)).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:sidebar_focus' })

    expect(host.admit(request(InternalActionId.FILE_CREATE, 'inv-dom', agent, {
      captureKind: 'dom_snapshot',
      filePath: 'snap.json',
    }))).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:dom_evidence' })

    expect(host.admit(request(InternalActionId.FILE_UPDATE, 'inv-page', agent, {
      editKey: 'preferences-notes',
      filePath: 'preferences.json',
      nextDocument: { notes: 'from the button' },
    }))).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:page_target' })

    expect(host.admit(request(InternalActionId.FILE_UPDATE, 'inv-office', agent, {
      filePath: 'notes.docx',
      suite: 'docx',
      nextBytesBase64: 'aaa',
    })).status).toBe('admitted')
    expect(host.admit(request(InternalActionId.CANVAS_NODE_SELECT, 'inv-card', agent, {
      surface: 'office_preview',
      op: 'open',
      nodeId: 'n1',
    })).status).toBe('admitted')

    expect(host.admit(request(InternalActionId.PLUGIN_LOADOUT_MUTATE, 'inv-loadout', agent, {
      pluginId: 'hook:lint',
      op: 'enable',
    }))).toMatchObject({ status: 'approval_required', reason: 'human_approval_required' })
    expect(host.admit(request(InternalActionId.PLUGIN_LOADOUT_MUTATE, 'inv-grant', agent, {
      pluginId: 'hook:lint',
      op: 'grant',
    }))).toMatchObject({ status: 'denied', reason: 'standing_grant_rejected' })
    expect(host.admit(request(InternalActionId.BROWSER_DOM_SNAPSHOT, 'inv-dom-id', agent, {
      captureKind: 'dom_snapshot',
    }))).toMatchObject({ status: 'approval_required', reason: 'human_approval_required' })
    expect(host.admit(request(InternalActionId.WORKBENCH_SIDEBAR_FOCUS, 'inv-focus-id', agent, {
      surface: 'mcp_apps',
      op: 'focus',
    })).status).toBe('admitted')
    expect(host.admit(request(InternalActionId.FILE_PAGE_TARGET, 'inv-page-id', agent, {
      editKey: 'preferences-notes',
    }))).toMatchObject({ status: 'approval_required', reason: 'human_approval_required' })
    expect(host.admit(request(InternalActionId.SESSION_UNFLAG, 'inv-unflag')).status).toBe('admitted')

    const sneaky = request(InternalActionId.FILE_UPDATE, 'inv-sneak', agent, {
      filePath: 'notes.txt',
    }) as TurnRequest & { requireHumanApproval?: boolean }
    sneaky.requireHumanApproval = true
    expect(host.admit(sneaky)).toMatchObject({ status: 'admitted', invocationId: 'inv-sneak' })
    const source = readFileSync(new URL('../turn-admission.ts', import.meta.url), 'utf8')
    expect(source.includes('requireHumanApproval')).toBe(false)
  })

  test('reversible L1 completion requires an undo handle and does not claim success without one', async () => {
    const host = kernel()
    host.admit(request(InternalActionId.FILE_UPDATE, 'inv-undo'))
    const failed = await host.run('inv-undo', async () => ({ output: { bytes: 1 } }))
    expect(failed).toMatchObject({ status: 'failed', reason: 'undo_handle_required' })
    expect(host.events('session-1').some((event) => event.kind === 'action_completed')).toBe(false)

    host.admit(request(InternalActionId.FILE_UPDATE, 'inv-undo-ok'))
    const ok = await host.run('inv-undo-ok', async () => ({
      output: { bytes: 1 },
      undoHandle: { undoId: 'undo-2', label: 'edit', snapshot: { bytes: 0 } },
      usage: {
        source: 'provider_response',
        providerId: 'openai',
        modelId: 'gpt-test',
        inputTokens: 30,
        outputTokens: 5,
        cacheFieldPresent: true,
        cachedInputTokens: 8,
        amount: 0.02,
        currency: 'USD',
        pricingRef: 'price_test',
      },
    }))
    expect(ok.status).toBe('completed')
    expect(ok.usage?.cache.status).toBe('confirmed_hit')
    expect(ok.usage?.cost).toMatchObject({ confidence: 'confirmed', amount: 0.02, currency: 'USD' })
  })

  test('stop before run records an interruption and retries later; an in-flight stop retries only when nothing committed', async () => {
    const host = kernel()
    host.admit(request(InternalActionId.SESSION_FLAG, 'inv-stop-early'))
    expect(host.stop('inv-stop-early').status).toBe('interrupted')
    let calls = 0
    await host.run('inv-stop-early', async () => {
      calls += 1
      return { output: 'late' }
    })
    expect(calls).toBe(1)

    host.admit(request(InternalActionId.SESSION_FLAG, 'inv-stop-mid'))
    let release: (() => void) | undefined
    const started = new Promise<void>((resolve) => {
      release = resolve
    })
    const running = host.run('inv-stop-mid', async ({ signal }) => {
      calls += 1
      release?.()
      await new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          const error = new Error('aborted')
          error.name = 'AbortError'
          reject(error)
        })
      })
      return { output: 'should-not-finish' }
    })
    await started
    expect(host.stop('inv-stop-mid').reason).toBe('stop_requested')
    await expect(running).resolves.toMatchObject({ status: 'interrupted' })

    const retried = await host.run('inv-stop-mid', async () => {
      calls += 1
      return { output: 'retried' }
    })
    expect(retried).toMatchObject({ status: 'completed', output: 'retried' })
    expect(calls).toBe(3)
  })

  test('a native commit followed by a crash restores as reconciling and does not execute again', async () => {
    const host = kernel()
    host.admit(request(InternalActionId.FILE_UPDATE, 'inv-crash'))
    let calls = 0
    let snapshot: KernelSnapshot | undefined
    const running = host.run('inv-crash', async ({ noteNativeCommit }) => {
      calls += 1
      noteNativeCommit()
      snapshot = host.snapshot()
      throw new Error('process crashed after native commit')
    })
    await expect(running).resolves.toMatchObject({ status: 'reconciling' })

    const serialized = JSON.parse(JSON.stringify(snapshot)) as KernelSnapshot
    const restored = HostTurnKernel.restore(serialized)
    expect(restored.events('session-1').some((event) => event.payload.reason === 'recovered_reconciling')).toBe(true)

    const replay = await restored.run('inv-crash', async () => {
      calls += 1
      return { output: 'duplicate' }
    })
    expect(replay.status).toBe('reconciling')
    expect(calls).toBe(1)

    const unresolved = restored.resolveReconciliation('inv-crash', {
      status: 'completed',
      output: { bytes: 4 },
    })
    expect(unresolved).toMatchObject({ status: 'reconciling', reason: 'undo_handle_required' })

    const closed = restored.resolveReconciliation('inv-crash', {
      status: 'completed',
      output: { bytes: 4 },
      undoHandle: { undoId: 'undo-crash', label: 'restore edit', snapshot: { bytes: 1 } },
      usage: {
        source: 'provider_invoice',
        amount: 0.4,
        currency: 'USD',
        pricingRef: 'invoice_9',
        inputTokens: 3,
        outputTokens: 1,
      },
    })
    expect(closed.status).toBe('completed')
    expect(closed.usage?.cost.confidence).toBe('confirmed')
    expect(closed.usage?.cache.status).toBe('unknown')
    const completed = restored.events('session-1').filter((event) => event.kind === 'action_completed')
    expect(completed).toHaveLength(1)

    const again = restored.resolveReconciliation('inv-crash', { status: 'failed' })
    expect(again.status).toBe('completed')
    expect(restored.events('session-1').filter((event) => event.kind === 'action_completed')).toHaveLength(1)
  })

  test('snapshot version mismatch fails closed', () => {
    const host = kernel()
    host.admit(request(InternalActionId.SESSION_FLAG, 'inv-version'))
    const snapshot = host.snapshot()
    expect(snapshot.version).toBe(KERNEL_SNAPSHOT_VERSION)
    expect(() => HostTurnKernel.restore({ ...snapshot, version: 999 as typeof KERNEL_SNAPSHOT_VERSION })).toThrow('unsupported_snapshot_version')
  })
})
