import { describe, expect, it } from 'bun:test'
import type { ActorRef } from '@craft-agent/shared/protocol'
import { HostTurnKernel, type TurnRequest } from '@craft-agent/shared/protocol'
import { InternalActionId, type ActionInvocation } from '../../../shared/src/protocol/internal-action.ts'
import { SessionManager } from './SessionManager.ts'

const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }

function request(actionId: ActionInvocation['actionId'], invocationId: string): TurnRequest {
  return {
    actor: agent,
    invocation: {
      invocationId,
      actionId,
      payload: {},
      targets: [{ kind: 'file', id: 'notes.json', label: 'preferences-notes' }],
      callerKind: 'agent',
      sessionId: 'session-1',
      createdAt: '2026-10-09T00:00:00.000Z',
    },
  }
}

describe('SessionManager host approval card', () => {
  it('publishes the existing permission_request when the agent turn is admitted', () => {
    const events: Array<{ type: string; request?: { requestId: string; toolName: string } }> = []
    const sm = new SessionManager()
    sm.setEventSink((_channel, _target, event) => {
      events.push(event as { type: string; request?: { requestId: string; toolName: string } })
    })
    const kernel = new HostTurnKernel()
    sm.attachHostTurnKernel('session-1', kernel, 'ws-1')

    expect(sm.admitHostTurn('session-1', request(InternalActionId.FILE_DELETE, 'inv-l3'))).toMatchObject({
      status: 'approval_required',
      invocationId: 'inv-l3',
    })
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      type: 'permission_request',
      request: { requestId: 'host:inv-l3', toolName: 'file.delete' },
    })
    expect(sm.admitHostTurn('session-1', request(InternalActionId.FILE_DELETE, 'inv-l3')).status)
      .toBe('approval_required')
    expect(events).toHaveLength(1)

    expect(sm.respondToPermission('session-1', 'host:inv-l3', false, false)).toBe(true)
    expect(kernel.snapshot().turns[0]?.phase).toBe('denied')

    expect(sm.admitHostTurn('session-1', request(InternalActionId.AIGC_JOB_SUBMIT, 'inv-job')).reason)
      .toBe('undo_contract_missing')
    expect(events[1]).toMatchObject({
      type: 'permission_request',
      request: { requestId: 'host:inv-job', toolName: 'aigc.job_submit' },
    })
    expect(sm.respondToPermission('session-1', 'host:inv-job', true, true)).toBe(true)
    expect(kernel.snapshot().turns.find((turn) => turn.request.invocation.invocationId === 'inv-job')?.phase)
      .toBe('admitted')
    expect(sm.admitHostTurn('session-1', request(InternalActionId.FILE_DELETE, 'inv-next')).status)
      .toBe('approval_required')
    expect(events.some((event) => event.request?.requestId === 'host:inv-next')).toBe(true)
  })

  it('does not emit a card for an admitted turn or a missing kernel', () => {
    const events: Array<{ type: string }> = []
    const sm = new SessionManager()
    sm.setEventSink((_channel, _target, event) => {
      events.push(event as { type: string })
    })
    const kernel = new HostTurnKernel()
    sm.attachHostTurnKernel('session-1', kernel, 'ws-1')

    expect(sm.admitHostTurn('session-1', request(InternalActionId.SESSION_FLAG, 'inv-l0')).status)
      .toBe('admitted')
    expect(events).toHaveLength(0)
    expect(sm.admitHostTurn('missing', request(InternalActionId.FILE_DELETE, 'inv-none'))).toMatchObject({
      status: 'failed',
      reason: 'host_kernel_missing',
    })
    expect(events).toHaveLength(0)
  })

  it('publishes a turn that was already awaiting when the kernel is attached', () => {
    const events: Array<{ type: string; request?: { requestId: string } }> = []
    const sm = new SessionManager()
    sm.setEventSink((_channel, _target, event) => {
      events.push(event as { type: string; request?: { requestId: string } })
    })
    const kernel = new HostTurnKernel()
    expect(kernel.admit(request(InternalActionId.FILE_DELETE, 'inv-before')).status).toBe('approval_required')
    expect(events).toHaveLength(0)
    sm.attachHostTurnKernel('session-1', kernel, 'ws-1')
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      type: 'permission_request',
      request: { requestId: 'host:inv-before' },
    })
  })

  it('leaves ordinary Craft permission ids on the existing agent path', () => {
    const sm = new SessionManager()
    const kernel = new HostTurnKernel()
    sm.attachHostTurnKernel('session-1', kernel, 'ws-1')
    expect(sm.respondToPermission('session-1', 'craft-tool-req', true, false)).toBe(false)
  })
})
