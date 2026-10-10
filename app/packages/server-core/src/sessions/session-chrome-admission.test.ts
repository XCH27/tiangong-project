import { describe, expect, it } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { ActorRef, TurnExecutor, TurnRequest } from '@craft-agent/shared/protocol'
import {
  agentActorForCallingSession,
  isRefusedSessionChrome,
  planSessionChrome,
  SESSION_HOST_ACTOR,
} from '@craft-agent/shared/protocol'
import { saveLabelConfig } from '@craft-agent/shared/labels/storage'
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

function hostEvents(text: string): Array<{
  kind: string
  actionId: string
  actorRef: { kind: string; id: string; displayName: string }
  payload?: { reason?: string }
}> {
  return text
    .split('\n')
    .filter((line) => line.includes('"record":"fleet_host_session_event"'))
    .map((line) => (JSON.parse(line) as { event: {
      kind: string
      actionId: string
      actorRef: { kind: string; id: string; displayName: string }
      payload?: { reason?: string }
    } }).event)
}

async function addHeldSession(
  held: Awaited<ReturnType<typeof holdSession>>,
  name: string,
) {
  const created = await createSession(held.root, { name })
  const stored = loadSession(held.root, created.id)
  if (!stored) throw new Error('session missing')
  stored.sessionStatus = 'todo'
  stored.labels = []
  await saveSession(stored)
  const managed = createManagedSession(
    { id: created.id, name, sessionStatus: 'todo', labels: [] },
    { id: 'ws-test', name: 'Test', rootPath: held.root, createdAt: Date.now() } as never,
  )
  ;(held.sm as unknown as { sessions: Map<string, unknown> }).sessions.set(created.id, managed)
  return created
}

describe('agent session chrome on the session kernel', () => {
  it('journals status and labels as the calling session, not the desktop user', async () => {
    const held = await holdSession()
    try {
      const caller = await addHeldSession(held, 'Worker')
      const status = await held.sm.setSessionStatusFromAgent(caller.id, held.created.id, 'in-progress')
      expect(status.status).toBe('completed')
      expect(isRefusedSessionChrome(status)).toBe(false)

      const labels = await held.sm.setSessionLabelsFromAgent(caller.id, held.created.id, ['bug'])
      expect(labels.status).toBe('completed')

      const human = await held.sm.setSessionStatus(held.created.id, 'done')
      expect(human.status).toBe('completed')

      const events = hostEvents(readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8'))
      const agentStatus = events.find((event) => event.kind === 'action_completed' && event.actionId === 'session.set_status' && event.actorRef.kind === 'agent')
      const agentLabels = events.find((event) => event.kind === 'action_completed' && event.actionId === 'session.set_labels')
      const humanStatus = events.find((event) => event.kind === 'action_completed' && event.actorRef.id === 'desktop-user')
      expect(agentStatus?.actorRef).toEqual({ kind: 'agent', id: caller.id, displayName: 'Worker' })
      expect(agentLabels?.actorRef).toEqual({ kind: 'agent', id: caller.id, displayName: 'Worker' })
      expect(humanStatus?.actionId).toBe('session.set_status')
      expect(events.some((event) => event.kind === 'supervision_requested')).toBe(false)
      expect(events.some((event) => event.actorRef.kind === 'agent' && event.actorRef.id === 'desktop-user')).toBe(false)

      const reloaded = loadSession(held.root, held.created.id)
      expect(reloaded?.sessionStatus).toBe('done')
      expect(reloaded?.labels).toEqual(['bug'])
      expect(loadSession(held.root, caller.id)?.sessionStatus).toBe('todo')
      expect(held.events.some((event) => event.type === 'permission_request')).toBe(false)
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('denies a malformed caller, a credential label, a missing caller, and a misowned payload', async () => {
    const held = await holdSession()
    try {
      const caller = await addHeldSession(held, 'Worker')
      const blank = createManagedSession(
        { id: '   ', name: 'Blank', sessionStatus: 'todo', labels: [] },
        { id: 'ws-test', name: 'Test', rootPath: held.root, createdAt: Date.now() } as never,
      )
      ;(held.sm as unknown as { sessions: Map<string, unknown> }).sessions.set('   ', blank)

      const malformed = await held.sm.setSessionStatusFromAgent('   ', held.created.id, 'done')
      expect(malformed).toMatchObject({ status: 'denied', reason: 'malformed_actor' })
      expect(isRefusedSessionChrome(malformed)).toBe(true)
      expect(loadSession(held.root, held.created.id)?.sessionStatus).toBe('todo')

      const secret = await held.sm.setSessionLabelsFromAgent(caller.id, held.created.id, ['Bearer tokentoken'])
      expect(secret).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
      expect(loadSession(held.root, held.created.id)?.labels ?? []).toEqual([])

      const missingCaller = await held.sm.setSessionStatusFromAgent('missing-caller', held.created.id, 'done')
      expect(missingCaller).toMatchObject({ status: 'failed', reason: 'caller_missing' })

      const missingTarget = await held.sm.setSessionLabelsFromAgent(caller.id, 'missing-target', ['bug'])
      expect(missingTarget).toMatchObject({ status: 'failed', reason: 'session_missing' })

      expect(held.sm.admitHostTurn(held.created.id, smuggle(
        held.created.id,
        InternalActionId.SESSION_SET_STATUS,
        'inv-plugin-status',
        {
          sessionStatus: 'done',
          pluginId: 'hook:lint',
          op: 'install',
          nextDocument: { version: 1, records: [{ id: 'hook:lint', installed: true, enabled: false }] },
        },
      ))).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:plugin_loadout' })

      expect(loadSession(held.root, held.created.id)?.sessionStatus).toBe('todo')
      const events = hostEvents(readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8'))
      expect(events.some((event) => event.kind === 'action_completed')).toBe(false)
      expect(events.some((event) => event.payload?.reason === 'malformed_actor')).toBe(true)
      expect(held.events.some((event) => event.type === 'permission_request')).toBe(false)
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('leaves mini-session status unchanged when the host actor is denied', async () => {
    const held = await holdSession()
    try {
      const managed = (held.sm as unknown as { sessions: Map<string, { systemPromptPreset?: string }> })
        .sessions.get(held.created.id)
      if (!managed) throw new Error('managed missing')
      managed.systemPromptPreset = 'mini'
      await (held.sm as unknown as {
        onProcessingStopped(sessionId: string, reason: 'complete'): Promise<void>
      }).onProcessingStopped(held.created.id, 'complete')
      await held.sm.flushSession(held.created.id)

      expect(loadSession(held.root, held.created.id)?.sessionStatus).toBe('todo')
      const events = hostEvents(readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8'))
      expect(events.some((event) => event.actionId === 'session.set_status' && event.actorRef.kind === 'system' && event.payload?.reason === 'actor_not_permitted')).toBe(true)
      expect(events.some((event) => event.kind === 'action_completed')).toBe(false)
      expect(events.some((event) => event.actorRef.id === 'desktop-user')).toBe(false)
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('does not admit a host turn when a normal session finishes', async () => {
    const held = await holdSession()
    try {
      await (held.sm as unknown as {
        onProcessingStopped(sessionId: string, reason: 'complete'): Promise<void>
      }).onProcessingStopped(held.created.id, 'complete')
      await held.sm.flushSession(held.created.id)
      const text = readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8')
      expect(text.includes('fleet_host_session_event')).toBe(false)
      expect(loadSession(held.root, held.created.id)?.sessionStatus).toBe('todo')
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('keeps agent tools on the kernel and leaves unflag off it', () => {
    const manager = readFileSync(new URL('./SessionManager.ts', import.meta.url), 'utf8')
    const tools = manager.slice(manager.indexOf('setSessionLabelsFn:'), manager.indexOf('getSessionInfoFn:'))
    expect(tools.includes('setSessionLabelsFromAgent')).toBe(true)
    expect(tools.includes('setSessionStatusFromAgent')).toBe(true)
    expect(tools.includes('writeSessionLabelsHeader')).toBe(false)
    expect(tools.includes('writeSessionStatusHeader')).toBe(false)

    const stopped = manager.slice(
      manager.indexOf('private async onProcessingStopped'),
      manager.indexOf('private processNextQueuedMessage'),
    )
    expect(stopped.includes('admitMiniSessionAutoComplete')).toBe(true)
    expect(stopped.includes('writeSessionStatusHeader')).toBe(false)

    const unflag = manager.slice(manager.indexOf('async unflagSession'), manager.indexOf('async archiveSession'))
    expect(unflag.includes('admitHostTurn')).toBe(false)
    expect(unflag.includes('admitSessionChrome')).toBe(false)
    expect(manager.includes('requireHumanApproval')).toBe(false)
    expect(manager.includes('setSessionNameFromAgent')).toBe(false)

    const titles = manager.slice(manager.indexOf('async refreshTitle'), manager.indexOf('updateWorkingDirectory'))
    expect(titles.includes('applyGeneratedSessionName')).toBe(true)
    expect(titles.includes('managed.name =')).toBe(false)
    const generated = manager.slice(manager.indexOf('private async generateTitle'), manager.indexOf('private async processEvent'))
    expect(generated.includes('applyGeneratedSessionName')).toBe(true)
    expect(generated.includes('managed.name =')).toBe(false)
    expect(generated.includes('SESSION_HOST_ACTOR')).toBe(false)
    expect(generated.includes('agentActorForCallingSession')).toBe(false)

    const firstName = manager.slice(
      manager.indexOf('If this is the first user message'),
      manager.indexOf('Evaluate auto-label rules'),
    )
    expect(firstName.includes('applyGeneratedSessionName')).toBe(true)
    expect(firstName.includes('managed.name =')).toBe(false)

    const autoLabels = manager.slice(
      manager.indexOf('Evaluate auto-label rules'),
      manager.indexOf('managed.lastMessageAt = Date.now()'),
    )
    expect(autoLabels.includes('applySendTimeAutoLabels')).toBe(true)
    expect(autoLabels.includes('managed.labels =')).toBe(false)

    const merge = manager.slice(
      manager.indexOf('private async applySendTimeAutoLabels'),
      manager.indexOf('private applySessionLabelsAs'),
    )
    expect(merge.includes('applySessionLabelsAs')).toBe(true)
    expect(merge.includes('managed.labels =')).toBe(false)
    expect(merge.includes('session.unflag')).toBe(false)

    const spawn = manager.slice(manager.indexOf('onSpawnSession'), manager.indexOf('sendAgentMessageFn:'))
    expect(spawn.includes('agentActorForCallingSession')).toBe(true)
    const agentSend = manager.slice(manager.indexOf('sendAgentMessageFn:'), manager.indexOf('activateSourceInSessionFn:'))
    expect(agentSend.includes('agentActorForCallingSession')).toBe(true)
    expect(agentSend.includes('labelActor:')).toBe(true)

    const apply = manager.slice(
      manager.indexOf('private applyGeneratedSessionName'),
      manager.indexOf('private renameSessionAs'),
    )
    expect(apply.includes('DESKTOP_APPROVER')).toBe(true)
    expect(apply.includes('SESSION_HOST_ACTOR')).toBe(false)
  })
})

function titleAgent(title: string | null) {
  return {
    generateTitle: async () => title,
    regenerateTitle: async () => title,
    destroy() {},
  }
}

describe('title generation on the session kernel', () => {
  it('journals generateTitle and refreshTitle as session.rename for the desktop user', async () => {
    const held = await holdSession()
    try {
      const managed = (held.sm as unknown as { sessions: Map<string, { agent: unknown }> })
        .sessions.get(held.created.id)
      if (!managed) throw new Error('managed missing')
      managed.agent = titleAgent('Kernel title')

      await (held.sm as unknown as {
        generateTitle(session: unknown, message: string): Promise<void>
      }).generateTitle(managed, 'name this chat')

      const refreshed = await held.sm.refreshTitle(held.created.id)
      expect(refreshed).toEqual({ success: true, title: 'Kernel title' })

      const events = hostEvents(readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8'))
      const completed = events.filter((event) => event.kind === 'action_completed' && event.actionId === 'session.rename')
      expect(completed.length).toBeGreaterThanOrEqual(2)
      expect(completed.every((event) => event.actorRef.kind === 'human' && event.actorRef.id === 'desktop-user')).toBe(true)
      expect(events.some((event) => event.kind === 'supervision_requested')).toBe(false)
      expect(events.some((event) => event.actorRef.kind === 'agent')).toBe(false)
      expect(events.some((event) => event.actorRef.kind === 'system')).toBe(false)

      expect(loadSession(held.root, held.created.id)?.name).toBe('Kernel title')
      expect(held.events.some((event) => event.type === 'title_generated')).toBe(true)
      expect(held.events.some((event) => event.type === 'permission_request')).toBe(false)
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('does not write a title when session.rename is refused', async () => {
    const held = await holdSession()
    try {
      const managed = (held.sm as unknown as { sessions: Map<string, { agent: unknown }> })
        .sessions.get(held.created.id)
      if (!managed) throw new Error('managed missing')
      managed.agent = titleAgent('Bearer tokentoken')

      await (held.sm as unknown as {
        generateTitle(session: unknown, message: string): Promise<void>
      }).generateTitle(managed, 'name this chat')
      const refreshed = await held.sm.refreshTitle(held.created.id)
      expect(refreshed.success).toBe(false)
      expect(refreshed.error).toBe('credential_material_rejected')
      expect(isRefusedSessionChrome({ status: 'denied' })).toBe(true)

      expect(loadSession(held.root, held.created.id)?.name).toBe('Old name')
      const events = hostEvents(readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8'))
      expect(events.some((event) => event.actionId === 'session.rename' && event.payload?.reason === 'credential_material_rejected')).toBe(true)
      expect(events.some((event) => event.kind === 'action_completed')).toBe(false)
      expect(held.events.some((event) => event.type === 'title_generated')).toBe(false)
      expect(held.events.some((event) => event.type === 'permission_request')).toBe(false)
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('does not write a title when the host system actor is denied session.rename', async () => {
    const held = await holdSession()
    try {
      const named = await (held.sm as unknown as {
        renameSessionAs(sessionId: string, name: string, actor: typeof SESSION_HOST_ACTOR): Promise<{ status: string; reason?: string }>
      }).renameSessionAs(held.created.id, 'System title', SESSION_HOST_ACTOR)
      expect(named).toMatchObject({ status: 'denied', reason: 'actor_not_permitted' })
      expect(isRefusedSessionChrome(named)).toBe(true)
      expect(loadSession(held.root, held.created.id)?.name).toBe('Old name')
      const events = hostEvents(readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8'))
      expect(events.some((event) => event.actionId === 'session.rename' && event.actorRef.kind === 'system' && event.payload?.reason === 'actor_not_permitted')).toBe(true)
      expect(events.some((event) => event.kind === 'action_completed')).toBe(false)
      expect(held.events.some((event) => event.type === 'title_generated')).toBe(false)
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })
})

describe('send-time auto-labels on the session kernel', () => {
  function writeRules(
    root: string,
    pattern: string,
    id = 'ticket',
  ) {
    saveLabelConfig(root, {
      version: 1,
      labels: [{
        id,
        name: 'Ticket',
        valueType: 'string',
        autoRules: [{ pattern, valueTemplate: '$1' }],
      }],
    })
  }

  async function send(held: Awaited<ReturnType<typeof holdSession>>, text: string) {
    await held.sm.sendMessage(held.created.id, text).catch(() => {
      // Agent init has no connection in this harness. Labels are admitted first.
    })
  }

  it('journals a regex merge as session.set_labels for the desktop user', async () => {
    const held = await holdSession()
    try {
      writeRules(held.root, '\\b(BUG-\\d+)\\b')
      await send(held, 'please look at BUG-42')

      const events = hostEvents(readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8'))
      const completed = events.filter((event) => event.kind === 'action_completed' && event.actionId === 'session.set_labels')
      expect(completed).toHaveLength(1)
      expect(completed[0]?.actorRef).toMatchObject({ kind: 'human', id: 'desktop-user' })
      expect(events.some((event) => event.kind === 'supervision_requested')).toBe(false)
      expect(events.some((event) => event.actorRef.kind === 'system')).toBe(false)
      expect(loadSession(held.root, held.created.id)?.labels).toEqual(['ticket::BUG-42'])
      expect(held.events.some((event) => event.type === 'labels_changed')).toBe(true)
      expect(held.events.some((event) => event.type === 'permission_request')).toBe(false)

      const unflag = readFileSync(new URL('./SessionManager.ts', import.meta.url), 'utf8')
      const unflagBody = unflag.slice(unflag.indexOf('async unflagSession'), unflag.indexOf('async archiveSession'))
      expect(unflagBody.includes('admitHostTurn')).toBe(false)
      expect(unflagBody.includes('session.unflag')).toBe(false)
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('does not merge labels when session.set_labels is refused', async () => {
    const held = await holdSession()
    try {
      const managed = (held.sm as unknown as { sessions: Map<string, { labels: string[] }> })
        .sessions.get(held.created.id)
      if (!managed) throw new Error('managed missing')
      managed.labels = ['keep']
      const stored = loadSession(held.root, held.created.id)
      if (!stored) throw new Error('stored missing')
      stored.labels = ['keep']
      await saveSession(stored)

      writeRules(held.root, '(Bearer\\s+\\S+)', 'secret')
      await send(held, 'token is Bearer tokentoken')

      expect(loadSession(held.root, held.created.id)?.labels).toEqual(['keep'])
      const events = hostEvents(readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8'))
      expect(events.some((event) => event.actionId === 'session.set_labels' && event.payload?.reason === 'credential_material_rejected')).toBe(true)
      expect(events.some((event) => event.kind === 'action_completed')).toBe(false)
      expect(held.events.some((event) => event.type === 'labels_changed')).toBe(false)
      expect(held.events.some((event) => event.type === 'permission_request')).toBe(false)
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('does not merge labels when the host system actor is denied', async () => {
    const held = await holdSession()
    try {
      writeRules(held.root, '\\b(BUG-\\d+)\\b')
      await (held.sm as unknown as {
        applySendTimeAutoLabels(sessionId: string, message: string, actor: typeof SESSION_HOST_ACTOR): Promise<void>
      }).applySendTimeAutoLabels(held.created.id, 'please look at BUG-7', SESSION_HOST_ACTOR)

      expect(loadSession(held.root, held.created.id)?.labels).toEqual([])
      const events = hostEvents(readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8'))
      expect(events.some((event) => event.actionId === 'session.set_labels' && event.actorRef.kind === 'system' && event.payload?.reason === 'actor_not_permitted')).toBe(true)
      expect(events.some((event) => event.kind === 'action_completed')).toBe(false)
      expect(held.events.some((event) => event.type === 'labels_changed')).toBe(false)
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('journals an agent send as the calling Craft session', async () => {
    const held = await holdSession()
    try {
      writeRules(held.root, '\\b(BUG-\\d+)\\b')
      const actor: ActorRef = agentActorForCallingSession(held.created.id, 'Old name')
      await (held.sm as unknown as {
        applySendTimeAutoLabels(sessionId: string, message: string, actor: ActorRef): Promise<void>
      }).applySendTimeAutoLabels(held.created.id, 'filed BUG-9', actor)

      const events = hostEvents(readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8'))
      const completed = events.filter((event) => event.kind === 'action_completed' && event.actionId === 'session.set_labels')
      expect(completed).toHaveLength(1)
      expect(completed[0]?.actorRef).toMatchObject({ kind: 'agent', id: held.created.id, displayName: 'Old name' })
      expect(completed[0]?.actorRef.id).not.toBe('desktop-user')
      expect(loadSession(held.root, held.created.id)?.labels).toEqual(['ticket::BUG-9'])
      expect(held.events.some((event) => event.type === 'permission_request')).toBe(false)
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })
})
