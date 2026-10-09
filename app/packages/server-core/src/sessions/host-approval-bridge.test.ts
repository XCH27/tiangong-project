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
  it('publishes the existing permission_request and Allow/Deny call the kernel', () => {
    const events: Array<{ type: string; request?: { requestId: string; toolName: string } }> = []
    const sm = new SessionManager()
    sm.setEventSink((_channel, _target, event) => {
      events.push(event as { type: string; request?: { requestId: string; toolName: string } })
    })
    const kernel = new HostTurnKernel()
    sm.attachHostTurnKernel('session-1', kernel, 'ws-1')

    expect(kernel.admit(request(InternalActionId.FILE_DELETE, 'inv-l3')).status).toBe('approval_required')
    const published = sm.publishHostApproval('session-1', 'inv-l3')
    expect(published?.delivered).toBe(true)
    expect(events[0]).toMatchObject({
      type: 'permission_request',
      request: { requestId: 'host:inv-l3', toolName: 'file.delete' },
    })

    expect(sm.respondToPermission('session-1', 'host:inv-l3', false, false)).toBe(true)
    expect(kernel.snapshot().turns[0]?.phase).toBe('denied')

    expect(kernel.admit(request(InternalActionId.AIGC_JOB_SUBMIT, 'inv-job')).reason).toBe('undo_contract_missing')
    expect(sm.respondToPermission('session-1', 'host:inv-job', true, true)).toBe(true)
    expect(kernel.snapshot().turns.find((turn) => turn.request.invocation.invocationId === 'inv-job')?.phase)
      .toBe('admitted')
    expect(kernel.admit(request(InternalActionId.FILE_DELETE, 'inv-next')).status).toBe('approval_required')
  })

  it('leaves ordinary Craft permission ids on the existing agent path', () => {
    const sm = new SessionManager()
    const kernel = new HostTurnKernel()
    sm.attachHostTurnKernel('session-1', kernel, 'ws-1')
    expect(sm.respondToPermission('session-1', 'craft-tool-req', true, false)).toBe(false)
  })
})
