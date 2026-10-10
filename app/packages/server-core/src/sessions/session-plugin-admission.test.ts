import { describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { ActorRef, TurnRequest } from '@craft-agent/shared/protocol'
import { DESKTOP_APPROVER } from '@craft-agent/shared/protocol'
import { InternalActionId, type ActionInvocation } from '../../../shared/src/protocol/internal-action.ts'
import {
  pluginLoadoutPath,
  type PluginCatalogEntry,
} from '../../../shared/src/protocol/plugin-settings.ts'
import {
  createSession,
  getSessionFilePath,
  loadSession,
  saveSession,
} from '@craft-agent/shared/sessions'
import type { StoredMessage } from '@craft-agent/shared/sessions'
import { SessionManager } from './SessionManager.ts'

const human: ActorRef = { kind: 'human', id: 'user-1', displayName: 'Ada' }
const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }

const catalog: PluginCatalogEntry[] = [
  {
    id: 'skill:review',
    name: 'Review',
    description: 'Workspace skill',
    kind: 'skill',
    origin: 'workspace',
    trust: 'first_party',
  },
  {
    id: 'hook:lint',
    name: 'Lint hook',
    description: 'Third-party hook',
    kind: 'hook',
    origin: 'caller',
    trust: 'third_party',
  },
  {
    id: 'mcp:remote',
    name: 'Remote',
    description: 'Third-party MCP server',
    kind: 'mcp',
    origin: 'catalog',
    trust: 'third_party',
  },
]

function message(id: string, content: string): StoredMessage {
  return { id, type: 'user', content, timestamp: 1 }
}

describe('plugin enable and install on the session kernel', () => {
  it('waits on plugin.loadout_mutate and does not write before a human allow', async () => {
    const root = mkdtempSync(join(tmpdir(), 'session-plugin-admit-'))
    try {
      const created = await createSession(root, { name: 'Plugins' })
      const stored = loadSession(root, created.id)
      expect(stored).not.toBeNull()
      stored!.messages = [message('msg-1', 'keep me')]
      await saveSession(stored!)

      const events: Array<{ type: string; request?: { requestId: string; toolName: string } }> = []
      const sm = new SessionManager()
      sm.setEventSink((_channel, _target, event) => {
        events.push(event as { type: string; request?: { requestId: string; toolName: string } })
      })
      const kernel = sm.openSessionHostKernel(created.id, root, 'ws-test')
      const filePath = pluginLoadoutPath(root)
      const call = {
        actor: agent,
        filePath,
        catalog,
        callerKind: 'agent' as const,
      }

      const installed = await sm.applySessionPluginMutation(created.id, root, {
        ...call,
        op: 'install',
        pluginId: 'hook:lint',
        invocationId: 'inv-install-hook',
      }, 'ws-test')
      expect(installed).toMatchObject({
        status: 'approval_required',
        reason: 'human_approval_required',
        invocationId: 'inv-install-hook',
      })
      const enabled = await sm.applySessionPluginMutation(created.id, root, {
        ...call,
        op: 'enable',
        pluginId: 'hook:lint',
        invocationId: 'inv-enable-hook',
      }, 'ws-test')
      expect(enabled).toMatchObject({ status: 'failed', reason: 'not_installed' })
      expect(existsSync(filePath)).toBe(false)
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        type: 'permission_request',
        request: { requestId: 'host:inv-install-hook', toolName: 'plugin.loadout_mutate' },
      })
      expect(kernel.snapshot().turns.map((turn) => turn.request.invocation.actionId)).toEqual([
        InternalActionId.PLUGIN_LOADOUT_MUTATE,
      ])
      expect(kernel.snapshot().turns[0]?.request.preAuthorizedBy).toBeUndefined()
      expect(kernel.approve('inv-install-hook', agent).status).toBe('approval_required')
      expect(sm.openSessionHostKernel(created.id, root, 'ws-test')).toBe(kernel)

      const bypass = bypassEnable(created.id, 'inv-bypass')
      expect(sm.admitHostTurn(created.id, bypass)).toMatchObject({
        status: 'denied',
        reason: 'action_owner_mismatch:plugin_loadout',
      })
      const settled = await sm.resolveSessionPluginGrant(created.id, {
        invocationId: 'inv-bypass',
        approver: DESKTOP_APPROVER,
        decision: { allowed: true, alwaysAllow: true },
        filePath,
      })
      expect(settled).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:plugin_loadout' })
      expect(existsSync(filePath)).toBe(false)
      expect(loadSession(root, created.id)!.messages.map((entry) => entry.content)).toEqual(['keep me'])

      const rpc = readFileSync(new URL('../handlers/rpc/sessions.ts', import.meta.url), 'utf8')
      expect(rpc.includes('applySessionPluginMutation')).toBe(false)
      expect(rpc.includes('resolveSessionPluginGrant')).toBe(false)
      const settings = readFileSync(new URL(
        '../../../../apps/electron/src/renderer/pages/settings/PluginsSettingsPage.tsx',
        import.meta.url,
      ), 'utf8')
      expect(settings.includes('applySessionPluginMutation')).toBe(false)
      expect(settings.includes('resolveSessionPluginGrant')).toBe(false)
      expect(settings.includes('createPluginSettingsHost()')).toBe(false)
      expect(settings.includes('data-plugin-writes="locked"')).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('writes the loadout only after a human allow, and op grant writes nothing', async () => {
    const root = mkdtempSync(join(tmpdir(), 'session-plugin-allow-'))
    try {
      const created = await createSession(root, { name: 'Allow plugin' })
      const sm = new SessionManager()
      const kernel = sm.openSessionHostKernel(created.id, root, 'ws-test')
      const filePath = pluginLoadoutPath(root)
      const allowed = {
        op: 'install' as const,
        pluginId: 'skill:review',
        invocationId: 'inv-allow-skill',
        actor: human,
        filePath,
        catalog,
        callerKind: 'human_ui' as const,
      }
      expect(await sm.applySessionPluginMutation(created.id, root, allowed, 'ws-test')).toMatchObject({
        status: 'approval_required',
        reason: 'human_approval_required',
      })
      expect(existsSync(filePath)).toBe(false)
      expect(kernel.approve('inv-allow-skill', DESKTOP_APPROVER).status).toBe('admitted')
      const written = await sm.applySessionPluginMutation(created.id, root, allowed, 'ws-test')
      expect(written).toMatchObject({ status: 'completed', persisted: true })
      expect(JSON.parse(readFileSync(filePath, 'utf8'))).toEqual({
        version: 1,
        records: [{ id: 'skill:review', installed: true, enabled: false }],
      })
      const journal = readFileSync(getSessionFilePath(root, created.id), 'utf8')
      expect(journal).toContain('plugin.loadout_mutate')
      expect(journal).not.toContain('"actionId":"file.update"')

      const denied = {
        op: 'enable' as const,
        pluginId: 'hook:lint',
        invocationId: 'inv-deny-hook',
        actor: human,
        filePath,
        catalog,
        callerKind: 'human_ui' as const,
      }
      expect(await sm.applySessionPluginMutation(created.id, root, denied, 'ws-test')).toMatchObject({
        status: 'failed',
        reason: 'not_installed',
      })
      const installedHook = {
        ...denied,
        op: 'install' as const,
        invocationId: 'inv-deny-install',
      }
      expect(await sm.applySessionPluginMutation(created.id, root, installedHook, 'ws-test')).toMatchObject({
        status: 'approval_required',
      })
      const rejected = await sm.resolveSessionPluginGrant(created.id, {
        invocationId: 'inv-deny-install',
        approver: DESKTOP_APPROVER,
        decision: { allowed: false },
        filePath,
      })
      expect(rejected).toMatchObject({ status: 'denied', reason: 'standing_grant_rejected' })
      expect(JSON.parse(readFileSync(filePath, 'utf8')).records).toEqual([
        { id: 'skill:review', installed: true, enabled: false },
      ])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('does not open a kernel or write a loadout when the session file is missing', async () => {
    const root = mkdtempSync(join(tmpdir(), 'session-plugin-missing-'))
    try {
      const sm = new SessionManager()
      const result = await sm.applySessionPluginMutation('000000-missing-file', root, {
        op: 'install',
        pluginId: 'hook:lint',
        invocationId: 'inv-missing',
        actor: agent,
        filePath: pluginLoadoutPath(root),
        catalog,
        callerKind: 'agent',
      })
      expect(result).toMatchObject({ status: 'failed', invocationId: 'inv-missing', reason: 'session_file_missing' })
      expect(existsSync(pluginLoadoutPath(root))).toBe(false)
      const settled = await sm.resolveSessionPluginGrant('000000-missing-file', {
        invocationId: 'inv-missing',
        approver: agent,
        decision: { allowed: true },
        filePath: pluginLoadoutPath(root),
      })
      expect(settled).toMatchObject({ status: 'failed', reason: 'host_kernel_missing' })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('rejects credential material before a plugin install is journaled', async () => {
    const root = mkdtempSync(join(tmpdir(), 'session-plugin-secret-'))
    try {
      const created = await createSession(root, { name: 'Secret plugin' })
      const secret = 'sk-testsecretvalue'
      const sm = new SessionManager()
      sm.openSessionHostKernel(created.id, root, 'ws-test')
      const secretCatalog: PluginCatalogEntry[] = [{
        id: `hook:${secret}`,
        name: 'Secret hook',
        description: 'Third-party hook',
        kind: 'hook',
        origin: 'caller',
        trust: 'third_party',
      }]
      const result = await sm.applySessionPluginMutation(created.id, root, {
        op: 'install',
        pluginId: `hook:${secret}`,
        invocationId: 'inv-secret-plugin',
        actor: agent,
        filePath: pluginLoadoutPath(root),
        catalog: secretCatalog,
        callerKind: 'agent',
      }, 'ws-test')
      expect(result).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
      expect(existsSync(pluginLoadoutPath(root))).toBe(false)
      const text = readFileSync(getSessionFilePath(root, created.id), 'utf8')
      expect(text).toContain('"kind":"action_failed"')
      expect(text).not.toContain(secret)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

function bypassEnable(sessionId: string, invocationId: string): TurnRequest {
  const invocation: ActionInvocation = {
    invocationId,
    actionId: InternalActionId.FILE_UPDATE,
    payload: {
      filePath: 'loadout.json',
      pluginId: 'hook:lint',
      op: 'enable',
      nextDocument: {
        version: 1,
        records: [{ id: 'hook:lint', installed: true, enabled: true }],
      },
    },
    targets: [{ kind: 'file', id: 'loadout.json', label: 'hook:lint' }],
    callerKind: 'agent',
    sessionId,
    createdAt: '2026-10-10T00:00:00.000Z',
  }
  return { actor: agent, invocation }
}
