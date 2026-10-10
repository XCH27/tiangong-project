import { describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { ActorRef } from '@craft-agent/shared/protocol'
import type { TurnRequest } from '@craft-agent/shared/protocol'
import { InternalActionId, type ActionInvocation } from '../../../shared/src/protocol/internal-action.ts'
import {
  createSession,
  getSessionFilePath,
  loadSession,
  saveSession,
  writeSessionJsonl,
} from '@craft-agent/shared/sessions'
import type { StoredMessage } from '@craft-agent/shared/sessions'
import { SessionManager } from './SessionManager.ts'

const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }

function message(id: string, content: string): StoredMessage {
  return { id, type: 'user', content, timestamp: 1 }
}

function request(
  sessionId: string,
  actionId: ActionInvocation['actionId'],
  invocationId: string,
  payload: Record<string, unknown> = {},
): TurnRequest {
  return {
    actor: agent,
    invocation: {
      invocationId,
      actionId,
      payload,
      targets: [{ kind: 'file', id: 'notes.json', label: 'preferences-notes' }],
      callerKind: 'agent',
      sessionId,
      createdAt: '2026-10-10T00:00:00.000Z',
    },
  }
}

describe('one HostTurnKernel per Craft session', () => {
  it('journals the admit into session.jsonl and keeps chat messages across rewrite', async () => {
    const root = mkdtempSync(join(tmpdir(), 'session-host-kernel-'))
    try {
      const created = await createSession(root, { name: 'Kernel' })
      const stored = loadSession(root, created.id)
      expect(stored).not.toBeNull()
      stored!.messages = [message('msg-1', 'hello')]
      await saveSession(stored!)

      const events: Array<{ type: string; request?: { requestId: string; toolName: string } }> = []
      const sm = new SessionManager()
      sm.setEventSink((_channel, _target, event) => {
        events.push(event as { type: string; request?: { requestId: string; toolName: string } })
      })
      const kernel = sm.openSessionHostKernel(created.id, root, 'ws-test')
      expect(sm.openSessionHostKernel(created.id, root, 'ws-test')).toBe(kernel)

      expect(sm.admitHostTurn(created.id, request(created.id, InternalActionId.FILE_DELETE, 'inv-l3')))
        .toMatchObject({ status: 'approval_required', invocationId: 'inv-l3' })
      expect(events).toEqual([
        expect.objectContaining({
          type: 'permission_request',
          request: expect.objectContaining({ requestId: 'host:inv-l3', toolName: 'file.delete' }),
        }),
      ])

      const file = getSessionFilePath(root, created.id)
      const text = readFileSync(file, 'utf-8')
      expect(text).toContain('"record":"fleet_host_session_event"')
      expect(text).toContain('"kind":"supervision_requested"')
      expect(loadSession(root, created.id)!.messages.map((entry) => entry.id)).toEqual(['msg-1'])

      const rewritten = loadSession(root, created.id)!
      rewritten.messages = [...rewritten.messages, message('msg-2', 'still here')]
      await saveSession(rewritten)
      writeSessionJsonl(file, loadSession(root, created.id)!)
      const after = readFileSync(file, 'utf-8')
      expect(after).toContain('"record":"fleet_host_session_event"')
      expect(after).toContain('"kind":"supervision_requested"')
      expect(loadSession(root, created.id)!.messages.map((entry) => entry.content)).toEqual(['hello', 'still here'])

      const reopened = new SessionManager().openSessionHostKernel(created.id, root, 'ws-test')
      expect(reopened).not.toBe(kernel)
      expect(reopened.events(created.id).some((event) => event.kind === 'supervision_requested')).toBe(true)
      expect(reopened.snapshot().turns).toEqual([])

      const other = await createSession(root, { name: 'Other' })
      expect(sm.openSessionHostKernel(other.id, root, 'ws-test')).not.toBe(kernel)
      expect(() => sm.openSessionHostKernel('000000-missing-file', root)).toThrow('session_file_missing')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('does not write credential material into session.jsonl', async () => {
    const root = mkdtempSync(join(tmpdir(), 'session-host-kernel-secret-'))
    try {
      const created = await createSession(root, { name: 'Secret' })
      const secret = 'sk-testsecretvalue'
      const sm = new SessionManager()
      sm.openSessionHostKernel(created.id, root, 'ws-test')
      expect(sm.admitHostTurn(
        created.id,
        request(created.id, InternalActionId.SESSION_FLAG, 'inv-secret', {
          apiKey: secret,
          note: `Bearer ${secret}`,
        }),
      )).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
      const text = readFileSync(getSessionFilePath(root, created.id), 'utf-8')
      expect(text).toContain('"kind":"action_failed"')
      expect(text).not.toContain(secret)
      expect(loadSession(root, created.id)!.messages).toEqual([])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
