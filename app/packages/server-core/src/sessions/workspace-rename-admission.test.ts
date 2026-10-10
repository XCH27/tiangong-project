import { describe, expect, it } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { loadWorkspaceConfig, saveWorkspaceConfig } from '@craft-agent/shared/workspaces'
import type { WorkspaceConfig } from '@craft-agent/shared/workspaces'
import {
  createSession,
  getSessionFilePath,
  loadSession,
} from '@craft-agent/shared/sessions'
import { SessionManager, createManagedSession } from './SessionManager.ts'

const WORKSPACE_ID = 'ws-rename'

function workspaceConfig(name: string): WorkspaceConfig {
  return {
    id: WORKSPACE_ID,
    name,
    slug: 'ws-rename',
    createdAt: 1,
    updatedAt: 1,
  }
}

async function holdWorkspace(name = 'Old workspace') {
  const root = mkdtempSync(join(tmpdir(), 'workspace-rename-admit-'))
  saveWorkspaceConfig(root, workspaceConfig(name))
  const created = await createSession(root, { name: 'Chat' })
  const events: Array<{ type: string; request?: { requestId: string; toolName: string } }> = []
  const sm = new SessionManager()
  sm.setEventSink((_channel, _target, event) => {
    events.push(event as { type: string; request?: { requestId: string; toolName: string } })
  })
  const managed = createManagedSession(
    { id: created.id, name: 'Chat', isFlagged: false, lastMessageAt: 1 },
    { id: WORKSPACE_ID, name, rootPath: root, createdAt: 1 } as never,
  )
  ;(sm as unknown as { sessions: Map<string, unknown> }).sessions.set(created.id, managed)
  return { root, created, sm, events }
}

async function settle(sm: SessionManager, sessionId: string): Promise<void> {
  const tail = (sm as unknown as { sessionChromeTail: Map<string, Promise<unknown>> })
    .sessionChromeTail.get(sessionId)
  if (tail) await tail
}

describe('settings workspace rename on the session kernel', () => {
  it('publishes the permission card and writes the name only after Allow', async () => {
    const held = await holdWorkspace()
    try {
      const waiting = await held.sm.requestWorkspaceRename(WORKSPACE_ID, 'Fleet')
      expect(waiting).toMatchObject({
        status: 'approval_required',
        reason: 'human_approval_required',
        sessionId: held.created.id,
      })
      expect(waiting.invocationId.length).toBeGreaterThan(0)
      expect(loadWorkspaceConfig(held.root)?.name).toBe('Old workspace')
      expect(held.events).toHaveLength(1)
      expect(held.events[0]).toMatchObject({
        type: 'permission_request',
        sessionId: held.created.id,
        request: {
          requestId: `host:${waiting.invocationId}`,
          toolName: 'workspace.rename',
        },
      })

      expect(held.sm.respondToPermission(held.created.id, `host:${waiting.invocationId}`, false, false)).toBe(true)
      await settle(held.sm, held.created.id)
      expect(loadWorkspaceConfig(held.root)?.name).toBe('Old workspace')

      const again = await held.sm.requestWorkspaceRename(WORKSPACE_ID, 'Fleet')
      expect(again.status).toBe('approval_required')
      expect(held.sm.respondToPermission(held.created.id, `host:${again.invocationId}`, true, true)).toBe(true)
      await settle(held.sm, held.created.id)
      expect(loadWorkspaceConfig(held.root)?.name).toBe('Fleet')

      const next = await held.sm.requestWorkspaceRename(WORKSPACE_ID, 'Fleet Two')
      expect(next.status).toBe('approval_required')
      expect(loadWorkspaceConfig(held.root)?.name).toBe('Fleet')
      expect(held.sm.respondToPermission(held.created.id, `host:${next.invocationId}`, true, false)).toBe(true)
      await settle(held.sm, held.created.id)
      expect(loadWorkspaceConfig(held.root)?.name).toBe('Fleet Two')

      const text = readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8')
      expect(text).toContain('"actionId":"workspace.rename"')
      expect(text).toContain('"kind":"supervision_requested"')
      expect(text).toContain('"kind":"action_completed"')
      expect(text).toContain('"label":"Restore workspace name"')
      expect(text).toContain('"name":"Old workspace"')
      expect(loadSession(held.root, held.created.id)?.messages).toEqual([])
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('does not rename when the workspace has no session or the name is credential-shaped', async () => {
    const held = await holdWorkspace()
    try {
      const missing = await new SessionManager().requestWorkspaceRename(WORKSPACE_ID, 'Fleet')
      expect(missing).toMatchObject({ status: 'failed', reason: 'session_missing' })
      expect(loadWorkspaceConfig(held.root)?.name).toBe('Old workspace')

      const blank = await held.sm.requestWorkspaceRename(WORKSPACE_ID, '   ')
      expect(blank).toMatchObject({ status: 'failed', reason: 'name_required' })
      expect(loadWorkspaceConfig(held.root)?.name).toBe('Old workspace')

      const secret = await held.sm.requestWorkspaceRename(WORKSPACE_ID, 'Bearer tokentoken')
      expect(secret).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
      expect(loadWorkspaceConfig(held.root)?.name).toBe('Old workspace')
      expect(held.events.some((event) => event.type === 'permission_request')).toBe(false)

      const beforeUnflag = readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8')
      expect(beforeUnflag).toContain('"reason":"credential_material_rejected"')
      expect(beforeUnflag).not.toContain('"kind":"action_completed"')
      await held.sm.unflagSession(held.created.id)
      const afterUnflag = readFileSync(getSessionFilePath(held.root, held.created.id), 'utf8')
      expect(afterUnflag.split('"actionId":"workspace.rename"').length)
        .toBe(beforeUnflag.split('"actionId":"workspace.rename"').length)
      expect(afterUnflag).not.toContain('"actionId":"session.flag"')
    } finally {
      rmSync(held.root, { recursive: true, force: true })
    }
  })

  it('keeps the production shell on this path and leaves unflag outside admission', () => {
    const settings = readFileSync(new URL(
      '../handlers/rpc/settings.ts',
      import.meta.url,
    ), 'utf8')
    const nameAt = settings.indexOf("if (key === 'name')")
    const nameBranch = settings.slice(nameAt, settings.indexOf('loadWorkspaceConfig', nameAt))
    expect(nameBranch.includes('requestWorkspaceRename(workspace.id')).toBe(true)
    expect(nameBranch.includes('saveWorkspaceConfig')).toBe(false)

    const page = readFileSync(new URL(
      '../../../../apps/electron/src/renderer/pages/settings/WorkspaceSettingsPage.tsx',
      import.meta.url,
    ), 'utf8')
    const submit = page.slice(page.indexOf('submitWorkspaceRename'), page.indexOf('const handleIconUpload'))
    expect(submit.includes("updateWorkspaceSetting('name', newName)")).toBe(true)
    expect(submit.includes('renameNeedsApproval')).toBe(true)
    expect(submit.includes('renameNeedsSession')).toBe(true)
    expect(submit.indexOf("result.status === 'completed'")).toBeLessThan(submit.indexOf('setWsName(newName)'))

    const app = readFileSync(new URL(
      '../../../../apps/electron/src/renderer/App.tsx',
      import.meta.url,
    ), 'utf8')
    expect(app.includes("toolName === 'workspace.rename'")).toBe(true)
    expect(app.includes('sessions:respondToPermission') || app.includes('respondToPermission')).toBe(true)

    const manager = readFileSync(new URL('./SessionManager.ts', import.meta.url), 'utf8')
    const unflag = manager.slice(manager.indexOf('async unflagSession'), manager.indexOf('async archiveSession'))
    expect(unflag.includes('admitHostTurn')).toBe(false)
    expect(unflag.includes('requestWorkspaceRename')).toBe(false)
    expect(manager.includes('requireHumanApproval')).toBe(false)
  })
})
