import { describe, expect, test } from 'bun:test'
import type { ActorRef } from '../actor'
import { InternalActionId, type ActionInvocation } from '../internal-action'
import {
  applyCraftPermissionDecision,
  craftCardForAwaitingTurn,
  DESKTOP_APPROVER,
  hostApprovalRequestId,
  listAwaitingCraftCards,
} from '../host-approval-bridge'
import { HostTurnKernel, type TurnRequest } from '../turn-admission'

const human: ActorRef = { kind: 'human', id: 'user-1', displayName: 'Ada' }
const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }

function request(
  actionId: ActionInvocation['actionId'],
  invocationId: string,
  actor: ActorRef = agent,
): TurnRequest {
  return {
    actor,
    invocation: {
      invocationId,
      actionId,
      payload: {},
      targets: [{ kind: 'file', id: 'notes.json', label: 'preferences-notes' }],
      callerKind: actor.kind === 'human' ? 'human_ui' : 'agent',
      sessionId: 'session-1',
      createdAt: '2026-10-09T00:00:00.000Z',
    },
  }
}

describe('host approval bridge', () => {
  test('L3 card uses the existing permission fields and only a human Allow admits it', () => {
    const kernel = new HostTurnKernel()
    expect(kernel.admit(request(InternalActionId.FILE_DELETE, 'inv-l3')).status).toBe('approval_required')

    const card = craftCardForAwaitingTurn(kernel, 'inv-l3')
    expect(card).toMatchObject({
      requestId: hostApprovalRequestId('inv-l3'),
      sessionId: 'session-1',
      toolName: 'file.delete',
      type: 'file_write',
      command: 'preferences-notes',
    })
    expect(card?.description).toContain('L3_destructive')

    expect(applyCraftPermissionDecision(kernel, card!.requestId, agent, { allowed: true }).status)
      .toBe('approval_required')
    const allowed = applyCraftPermissionDecision(kernel, card!.requestId, DESKTOP_APPROVER, {
      allowed: true,
      alwaysAllow: false,
    })
    expect(allowed).toMatchObject({ status: 'admitted', standingGrant: false })
    expect(kernel.events('session-1').some((event) => event.kind === 'supervision_resolved')).toBe(true)
  })

  test('Always Allow does not admit the next L3, and Deny rejects this one', () => {
    const kernel = new HostTurnKernel()
    kernel.admit(request(InternalActionId.FILE_DELETE, 'inv-a'))
    const first = applyCraftPermissionDecision(
      kernel,
      'host:inv-a',
      DESKTOP_APPROVER,
      { allowed: true, alwaysAllow: true },
    )
    expect(first).toMatchObject({ status: 'admitted', standingGrant: false })

    expect(kernel.admit(request(InternalActionId.CANVAS_NODE_DELETE, 'inv-b')).status).toBe('approval_required')
    const denied = applyCraftPermissionDecision(kernel, 'inv-b', human, { allowed: false, alwaysAllow: true })
    expect(denied).toMatchObject({ status: 'denied', reason: 'approval_rejected', standingGrant: false })
    expect(listAwaitingCraftCards(kernel)).toHaveLength(0)
  })

  test('approval-gated L1 uses the same Allow and Deny path', () => {
    const kernel = new HostTurnKernel()
    expect(kernel.admit(request(InternalActionId.AIGC_JOB_SUBMIT, 'inv-job'))).toMatchObject({
      status: 'approval_required',
      reason: 'undo_contract_missing',
    })
    const card = craftCardForAwaitingTurn(kernel, 'inv-job')
    expect(card?.description).toContain('undo contract')
    expect(card?.toolName).toBe('aigc.job_submit')

    expect(applyCraftPermissionDecision(kernel, 'host:inv-job', DESKTOP_APPROVER, { allowed: false }).status)
      .toBe('denied')
  })

  test('a missing host invocation does not look like a Craft tool request', () => {
    const kernel = new HostTurnKernel()
    expect(craftCardForAwaitingTurn(kernel, 'missing')).toBeUndefined()
    expect(applyCraftPermissionDecision(kernel, 'host:missing', DESKTOP_APPROVER, { allowed: true })).toMatchObject({
      status: 'failed',
      reason: 'unknown_invocation',
      standingGrant: false,
    })
  })
})
