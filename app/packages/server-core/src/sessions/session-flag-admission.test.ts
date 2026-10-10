import { describe, expect, it } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { ActorRef, TurnRequest } from '@craft-agent/shared/protocol'
import { isRefusedSessionFlag, isRefusedSessionUnflag } from '@craft-agent/shared/protocol'
import { InternalActionId, type ActionInvocation } from '../../../shared/src/protocol/internal-action.ts'
import {
  createSession,
  getSessionFilePath,
  loadSession,
  saveSession,
} from '@craft-agent/shared/sessions'
import type { StoredMessage } from '@craft-agent/shared/sessions'
import { SessionManager, createManagedSession } from './SessionManager.ts'

const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }

function message(id: string, content: string): StoredMessage {
  return { id, type: 'user', content, timestamp: 1 }
}

function smuggle(
  sessionId: string,
  actionId: ActionInvocation['actionId'],
  invocationId: string,
  payload: Record<string, unknown>,
  targets: ActionInvocation['targets'] = [],
): TurnRequest {
  return {
    actor: agent,
    invocation: {
      invocationId,
      actionId,
      payload,
      targets,
      callerKind: 'agent',
      sessionId,
      createdAt: '2026-10-10T00:00:00.000Z',
    },
  }
}

describe('human session flag on the session kernel', () => {
  it('admits session.flag into session.jsonl and refuses misowned verbs', async () => {
    const root = mkdtempSync(join(tmpdir(), 'session-flag-admit-'))
    try {
      const created = await createSession(root, { name: 'Flag me' })
      const stored = loadSession(root, created.id)
      expect(stored).not.toBeNull()
      stored!.messages = [message('msg-1', 'keep me')]
      await saveSession(stored!)

      const events: Array<{ type: string }> = []
      const sm = new SessionManager()
      sm.setEventSink((_channel, _target, event) => {
        events.push(event as { type: string })
      })
      const managed = createManagedSession(
        { id: created.id, name: stored!.name, isFlagged: false },
        { id: 'ws-test', name: 'Test', rootPath: root, createdAt: Date.now() } as never,
      )
      ;(sm as unknown as { sessions: Map<string, unknown> }).sessions.set(created.id, managed)

      const flagged = await sm.flagSession(created.id)
      expect(flagged.status).toBe('completed')
      expect(isRefusedSessionFlag(flagged)).toBe(false)
      expect(events.map((event) => event.type)).toEqual(['session_flagged'])

      const file = getSessionFilePath(root, created.id)
      const text = readFileSync(file, 'utf8')
      expect(text).toContain('"record":"fleet_host_session_event"')
      expect(text).toContain('"actionId":"session.flag"')
      expect(text).toContain('"kind":"action_invoked"')
      expect(text).toContain('"kind":"action_completed"')
      expect(text).not.toContain('"kind":"supervision_requested"')
      const reloaded = loadSession(root, created.id)
      expect(reloaded?.isFlagged).toBe(true)
      expect(reloaded?.messages.map((entry) => entry.content)).toEqual(['keep me'])

      const flagCount = text.split('"actionId":"session.flag"').length - 1
      const unflagged = await sm.unflagSession(created.id)
      expect(unflagged.status).toBe('completed')
      expect(isRefusedSessionUnflag(unflagged)).toBe(false)
      const afterUnflag = readFileSync(file, 'utf8')
      expect(afterUnflag.split('"actionId":"session.flag"').length - 1).toBe(flagCount)
      expect(afterUnflag).toContain('"actionId":"session.unflag"')
      expect(afterUnflag).toContain('"label":"Restore session flag"')
      expect(afterUnflag).not.toContain('"kind":"supervision_requested"')
      expect(loadSession(root, created.id)?.isFlagged).toBe(false)

      expect(sm.admitHostTurn(created.id, smuggle(created.id, InternalActionId.FILE_UPDATE, 'inv-plugin', {
        filePath: 'loadout.json',
        pluginId: 'hook:lint',
        op: 'install',
        nextDocument: { version: 1, records: [{ id: 'hook:lint', installed: true, enabled: false }] },
      }))).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:plugin_loadout' })
      expect(sm.admitHostTurn(created.id, smuggle(created.id, InternalActionId.CANVAS_NODE_SELECT, 'inv-side', {
        surface: 'mcp_apps',
        op: 'focus',
      }))).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:sidebar_focus' })
      expect(sm.admitHostTurn(created.id, smuggle(created.id, InternalActionId.FILE_CREATE, 'inv-dom', {
        captureKind: 'dom_snapshot',
        filePath: 'snap.json',
      }))).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:dom_evidence' })
      expect(sm.admitHostTurn(created.id, smuggle(created.id, InternalActionId.FILE_UPDATE, 'inv-page', {
        editKey: 'preferences-notes',
        filePath: 'preferences.json',
      }))).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:page_target' })
      expect(events.some((event) => event.type === 'permission_request')).toBe(false)
      expect(loadSession(root, created.id)?.messages.map((entry) => entry.id)).toEqual(['msg-1'])

      const shell = readFileSync(new URL(
        '../../../../apps/electron/src/renderer/App.tsx',
        import.meta.url,
      ), 'utf8')
      expect(shell.includes("type: 'flag'")).toBe(true)
      expect(shell.includes('isRefusedSessionFlag')).toBe(true)
      const unflagHandler = shell.slice(shell.indexOf('handleUnflagSession'), shell.indexOf('handleArchiveSession'))
      expect(unflagHandler.includes("type: 'unflag'")).toBe(true)
      expect(unflagHandler.includes('isRefusedSessionUnflag')).toBe(true)
      expect(unflagHandler.includes('isFlagged: true')).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('does not flag a session the manager does not hold', async () => {
    const sm = new SessionManager()
    const missing = await sm.flagSession('missing-session')
    expect(missing).toMatchObject({ status: 'failed', reason: 'session_missing' })
    expect(isRefusedSessionFlag(missing)).toBe(true)
    const missingUnflag = await sm.unflagSession('missing-session')
    expect(missingUnflag).toMatchObject({ status: 'failed', reason: 'session_missing' })
    expect(isRefusedSessionUnflag(missingUnflag)).toBe(true)
  })

  it('leaves the flag set when session.unflag is refused', async () => {
    const root = mkdtempSync(join(tmpdir(), 'session-unflag-refuse-'))
    try {
      const created = await createSession(root, { name: 'Stay flagged' })
      const stored = loadSession(root, created.id)
      expect(stored).not.toBeNull()
      stored!.isFlagged = true
      await saveSession(stored!)
      const sm = new SessionManager()
      const managed = createManagedSession(
        { id: created.id, name: stored!.name, isFlagged: true },
        { id: 'ws-test', name: 'Test', rootPath: root, createdAt: Date.now() } as never,
      )
      ;(sm as unknown as { sessions: Map<string, unknown> }).sessions.set(created.id, managed)
      ;(sm as unknown as { admitHostTurn: (sessionId: string) => { status: 'denied'; invocationId: string; reason: string } })
        .admitHostTurn = () => ({ status: 'denied', invocationId: 'inv-refuse', reason: 'denied' })
      const refused = await sm.unflagSession(created.id)
      expect(refused.status).toBe('denied')
      expect(isRefusedSessionUnflag(refused)).toBe(true)
      expect(loadSession(root, created.id)?.isFlagged).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
