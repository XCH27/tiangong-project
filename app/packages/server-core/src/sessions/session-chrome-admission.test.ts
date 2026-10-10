import { describe, expect, it } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { ActorRef, TurnExecutor, TurnRequest } from '@craft-agent/shared/protocol'
import {
  isRefusedSessionChrome,
  planSessionChrome,
} from '@craft-agent/shared/protocol'
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
): TurnRequest {
  return {
    actor: agent,
    invocation: {
      invocationId,
      actionId,
      payload,
      targets: [],
      callerKind: 'agent',
      sessionId,
      createdAt: '2026-10-10T00:00:00.000Z',
    },
  }
}

async function holdSession() {
  const root = mkdtempSync(join(tmpdir(), 'session-chrome-admit-'))
  const created = await createSession(root, { name: 'Old name' })
  const stored = loadSession(root, created.id)
  if (!stored) throw new Error('session missing')
  stored.messages = [message('msg-1', 'keep me')]
  stored.sessionStatus = 'todo'
  stored.labels = []
  await saveSession(stored)
  const events: Array<{ type: string }> = []
  const sm = new SessionManager()
  sm.setEventSink((_channel, _target, event) => {
    events.push(event as { type: string })
  })
  const managed = createManagedSession(
    { id: created.id, name: stored.name, sessionStatus: 'todo', labels: [], isFlagged: false },
    { id: 'ws-test', name: 'Test', rootPath: root, createdAt: Date.now() } as never,
  )
  ;(sm as unknown as { sessions: Map<string, unknown> }).sessions.set(created.id, managed)
  return { root, created, sm, events }
}

describe('human session chrome on the session kernel', () => {
  it('plans an L1 admit to run and an approval gate to the existing card', () => {
    expect(planSessionChrome('admitted')).toBe('run')
    expect(planSessionChrome('approval_required')).toBe('await_card')
    expect(planSessionChrome('denied')).toBe('refuse')
    expect(planSessionChrome('failed')).toBe('refuse')
  })

  it('admits rename, status, and labels into session.jsonl', async () => {
    const held = await holdSession()
    try {
      const renamed = await held.sm.renameSession(held.created.id, 'New name')
      expect(renamed.status).toBe('completed')
      expect(isRefusedSessionChrome(renamed)).toBe(false)

      const status = await held.sm.setSessionStatus(held.created.id, 'done')
      expect(status.status).toBe('completed')

      const labels = await held.sm.setSessionLabels(held.created.id, ['bug', 'urgent'])
      expect(labels.status).toBe('completed')

      expect(held.events.map((event) => event.type)).toEqual([
        'title_generated',
        'session_status_changed',
        'labels_changed',
      ])

      const text = readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8')
      expect(text).toContain('"record":"fleet_host_session_event"')
      expect(text).toContain('"actionId":"session.rename"')
      expect(text).toContain('"actionId":"session.set_status"')
      expect(text).toContain('"actionId":"session.set_labels"')
      expect(text).toContain('"kind":"action_invoked"')
      expect(text).toContain('"kind":"action_completed"')
      expect(text).toContain('"label":"Restore session name"')
      expect(text).not.toContain('"kind":"supervision_requested"')

      const reloaded = loadSession(held.root, held.created.id)
      expect(reloaded?.name).toBe('New name')
      expect(reloaded?.sessionStatus).toBe('done')
      expect(reloaded?.labels).toEqual(['bug', 'urgent'])
      expect(reloaded?.messages.map((entry) => entry.content)).toEqual(['keep me'])
      expect(held.events.some((event) => event.type === 'permission_request')).toBe(false)
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('refuses a credential-shaped rename and a misowned session.rename payload', async () => {
    const held = await holdSession()
    try {
      const refused = await held.sm.renameSession(held.created.id, 'Bearer tokentoken')
      expect(refused).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
      expect(isRefusedSessionChrome(refused)).toBe(true)
      expect(loadSession(held.root, held.created.id)?.name).toBe('Old name')

      expect(held.sm.admitHostTurn(held.created.id, smuggle(
        held.created.id,
        InternalActionId.SESSION_RENAME,
        'inv-plugin',
        {
          name: 'Stolen',
          pluginId: 'hook:lint',
          op: 'install',
          nextDocument: { version: 1, records: [{ id: 'hook:lint', installed: true, enabled: false }] },
        },
      ))).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:plugin_loadout' })
      expect(loadSession(held.root, held.created.id)?.name).toBe('Old name')
      expect(held.events.some((event) => event.type === 'permission_request')).toBe(false)
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('keeps the header until the existing card allows a held chrome turn', async () => {
    const held = await holdSession()
    try {
      const kernel = held.sm.openSessionHostKernel(held.created.id, held.root, 'ws-test')
      const mutable = kernel as unknown as {
        admit: (request: TurnRequest) => { status: 'approval_required'; invocationId: string; reason: string }
        approve: (invocationId: string) => { status: 'admitted'; invocationId: string }
        reject: (invocationId: string) => { status: 'denied'; invocationId: string; reason: string }
        run: (invocationId: string, executor?: TurnExecutor) => Promise<{ status: 'completed'; invocationId: string }>
      }
      mutable.admit = (request) => ({
        status: 'approval_required',
        invocationId: request.invocation.invocationId,
        reason: 'human_approval_required',
      })
      mutable.approve = (invocationId) => ({ status: 'admitted', invocationId })
      mutable.reject = (invocationId) => ({ status: 'denied', invocationId, reason: 'approval_rejected' })
      mutable.run = async (invocationId, executor) => {
        if (executor) {
          await executor({ signal: new AbortController().signal, noteNativeCommit: () => {} })
        }
        return { status: 'completed', invocationId }
      }

      const waiting = await held.sm.renameSession(held.created.id, 'After allow')
      expect(waiting.status).toBe('approval_required')
      expect(isRefusedSessionChrome(waiting)).toBe(true)
      expect(loadSession(held.root, held.created.id)?.name).toBe('Old name')

      expect(held.sm.respondToPermission(held.created.id, `host:${waiting.invocationId}`, true, false)).toBe(true)
      const tail = (held.sm as unknown as { sessionChromeTail: Map<string, Promise<unknown>> })
        .sessionChromeTail.get(held.created.id)
      if (tail) await tail
      expect(loadSession(held.root, held.created.id)?.name).toBe('After allow')
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('does not write when the existing card denies a held chrome turn', async () => {
    const held = await holdSession()
    try {
      const kernel = held.sm.openSessionHostKernel(held.created.id, held.root, 'ws-test')
      const mutable = kernel as unknown as {
        admit: (request: TurnRequest) => { status: 'approval_required'; invocationId: string; reason: string }
        reject: (invocationId: string) => { status: 'denied'; invocationId: string; reason: string }
        run: (invocationId: string, executor?: TurnExecutor) => Promise<{ status: 'completed'; invocationId: string }>
      }
      mutable.admit = (request) => ({
        status: 'approval_required',
        invocationId: request.invocation.invocationId,
        reason: 'human_approval_required',
      })
      mutable.reject = (invocationId) => ({ status: 'denied', invocationId, reason: 'approval_rejected' })
      let ran = false
      mutable.run = async (invocationId, executor) => {
        ran = true
        if (executor) await executor({ signal: new AbortController().signal, noteNativeCommit: () => {} })
        return { status: 'completed', invocationId }
      }

      const waiting = await held.sm.setSessionStatus(held.created.id, 'done')
      expect(waiting.status).toBe('approval_required')
      expect(held.sm.respondToPermission(held.created.id, `host:${waiting.invocationId}`, false, true)).toBe(true)
      expect(ran).toBe(false)
      expect(loadSession(held.root, held.created.id)?.sessionStatus).toBe('todo')
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('does not rename, relabel, or set status when the manager does not hold the session', async () => {
    const sm = new SessionManager()
    expect(await sm.renameSession('missing-session', 'Nope')).toMatchObject({
      status: 'failed',
      reason: 'session_missing',
    })
    expect(await sm.setSessionStatus('missing-session', 'done')).toMatchObject({
      status: 'failed',
      reason: 'session_missing',
    })
    const labels = await sm.setSessionLabels('missing-session', ['bug'])
    expect(labels).toMatchObject({ status: 'failed', reason: 'session_missing' })
    expect(isRefusedSessionChrome(labels)).toBe(true)
  })

  it('keeps unflag off the kernel and points the shell at the three chrome commands', () => {
    const manager = readFileSync(new URL('./SessionManager.ts', import.meta.url), 'utf8')
    const unflag = manager.slice(manager.indexOf('async unflagSession'), manager.indexOf('async archiveSession'))
    expect(unflag.includes('admitHostTurn')).toBe(false)
    expect(manager.includes('requireHumanApproval')).toBe(false)

    const shell = readFileSync(new URL(
      '../../../../apps/electron/src/renderer/App.tsx',
      import.meta.url,
    ), 'utf8')
    expect(shell.includes("type: 'rename'")).toBe(true)
    expect(shell.includes("type: 'setSessionStatus'")).toBe(true)
    expect(shell.includes('isRefusedSessionChrome')).toBe(true)

    const sidebar = readFileSync(new URL(
      '../../../../apps/electron/src/renderer/components/app-shell/AppShell.tsx',
      import.meta.url,
    ), 'utf8')
    expect(sidebar.includes("type: 'setLabels'")).toBe(true)

    const navigation = readFileSync(new URL(
      '../../../../apps/electron/src/renderer/contexts/NavigationContext.tsx',
      import.meta.url,
    ), 'utf8')
    expect(navigation.includes('isRefusedSessionChrome')).toBe(true)
  })
})
