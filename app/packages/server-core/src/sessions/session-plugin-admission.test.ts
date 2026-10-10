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

function enabled(filePath: string, pluginId: string): boolean {
  if (!existsSync(filePath)) return false
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as {
    records?: Array<{ id: string; enabled: boolean }>
  }
  return parsed.records?.find((record) => record.id === pluginId)?.enabled === true
}

describe('plugin enable and install on the session kernel', () => {
  it('fails closed when an agent tries to approve third-party enable or install', async () => {
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
      expect(installed.status).toBe('completed')
      if (installed.status !== 'completed') return
      expect(installed.persisted).toBe(true)
      expect(installed.loadout.records).toEqual([{ id: 'hook:lint', installed: true, enabled: false }])
      expect(sm.openSessionHostKernel(created.id, root, 'ws-test')).toBe(kernel)
      expect(events).toEqual([])

      const skillInstalled = await sm.applySessionPluginMutation(created.id, root, {
        ...call,
        op: 'install',
        pluginId: 'skill:review',
        invocationId: 'inv-install-skill',
      }, 'ws-test')
      expect(skillInstalled.status).toBe('completed')
      const skillEnabled = await sm.applySessionPluginMutation(created.id, root, {
        ...call,
        op: 'enable',
        pluginId: 'skill:review',
        invocationId: 'inv-enable-skill',
      }, 'ws-test')
      expect(skillEnabled.status).toBe('completed')
      if (skillEnabled.status !== 'completed') return
      expect(skillEnabled.loadout.records.find((record) => record.id === 'skill:review')?.enabled).toBe(true)
      expect(events).toEqual([])

      const mcpInstalled = await sm.applySessionPluginMutation(created.id, root, {
        ...call,
        op: 'install',
        pluginId: 'mcp:remote',
        invocationId: 'inv-install-mcp',
      }, 'ws-test')
      expect(mcpInstalled.status).toBe('completed')
      expect(enabled(filePath, 'mcp:remote')).toBe(false)

      const hookEnable = await sm.applySessionPluginMutation(created.id, root, {
        ...call,
        op: 'enable',
        pluginId: 'hook:lint',
        invocationId: 'inv-enable-hook',
      }, 'ws-test')
      expect(hookEnable).toMatchObject({
        status: 'approval_required',
        invocationId: 'inv-enable-hook',
        reason: 'human_approval_required',
      })
      expect(enabled(filePath, 'hook:lint')).toBe(false)
      expect(events).toEqual([
        expect.objectContaining({
          type: 'permission_request',
          request: expect.objectContaining({ requestId: 'host:inv-enable-hook', toolName: 'file.update' }),
        }),
      ])
      expect(kernel.snapshot().turns.find((turn) => turn.request.invocation.invocationId === 'inv-enable-hook')?.phase)
        .toBe('awaiting_approval')

      const selfApproved = await sm.resolveSessionPluginGrant(created.id, {
        invocationId: 'host:inv-enable-hook',
        approver: agent,
        decision: { allowed: true, alwaysAllow: true },
        filePath,
      })
      expect(selfApproved).toMatchObject({
        status: 'approval_required',
        invocationId: 'inv-enable-hook',
        reason: 'human_approval_required',
      })
      expect(kernel.approve('inv-enable-hook', agent)).toMatchObject({
        status: 'approval_required',
        reason: 'human_approval_required',
      })
      expect(await kernel.run('inv-enable-hook')).toMatchObject({ status: 'approval_required' })
      expect(enabled(filePath, 'hook:lint')).toBe(false)
      expect(events).toHaveLength(1)

      const bypassRun = bypassEnable(created.id, 'inv-bypass-run')
      expect(sm.admitHostTurn(created.id, bypassRun)).toMatchObject({ status: 'admitted', invocationId: 'inv-bypass-run' })
      expect(await kernel.run('inv-bypass-run')).toMatchObject({ status: 'failed', reason: 'no_executor' })
      const bypassGrant = bypassEnable(created.id, 'inv-bypass-grant')
      expect(sm.admitHostTurn(created.id, bypassGrant)).toMatchObject({ status: 'admitted', invocationId: 'inv-bypass-grant' })
      const bypassSettled = await sm.resolveSessionPluginGrant(created.id, {
        invocationId: 'inv-bypass-grant',
        approver: agent,
        decision: { allowed: true, alwaysAllow: true },
        filePath,
      })
      expect(bypassSettled).toMatchObject({ status: 'failed', reason: 'plugin_grant_not_pending' })
      const bypassHuman = await sm.resolveSessionPluginGrant(created.id, {
        invocationId: 'inv-bypass-grant',
        approver: DESKTOP_APPROVER,
        decision: { allowed: true, alwaysAllow: true },
        filePath,
      })
      expect(bypassHuman).toMatchObject({ status: 'failed', reason: 'plugin_grant_not_pending' })
      expect(enabled(filePath, 'hook:lint')).toBe(false)

      expect(sm.respondToPermission(created.id, 'host:inv-enable-hook', true, true)).toBe(true)
      expect(kernel.snapshot().turns.find((turn) => turn.request.invocation.invocationId === 'inv-enable-hook')?.phase)
        .toBe('admitted')
      expect(enabled(filePath, 'hook:lint')).toBe(false)
      const agentAfterCard = await sm.resolveSessionPluginGrant(created.id, {
        invocationId: 'inv-enable-hook',
        approver: agent,
        decision: { allowed: true, alwaysAllow: true },
        filePath,
      })
      expect(agentAfterCard).toMatchObject({ status: 'approval_required', reason: 'human_approval_required' })
      expect(enabled(filePath, 'hook:lint')).toBe(false)

      const allowed = await sm.resolveSessionPluginGrant(created.id, {
        invocationId: 'host:inv-enable-hook',
        approver: DESKTOP_APPROVER,
        decision: { allowed: true, alwaysAllow: true },
        filePath,
      })
      expect(allowed.status).toBe('completed')
      if (allowed.status !== 'completed') return
      expect(allowed.loadout.records.find((record) => record.id === 'hook:lint')).toEqual({
        id: 'hook:lint',
        installed: true,
        enabled: true,
      })
      expect(allowed.loadout.grants).toEqual([{ id: 'hook:lint', decision: 'approved' }])

      const repeat = await sm.applySessionPluginMutation(created.id, root, {
        ...call,
        op: 'enable',
        pluginId: 'hook:lint',
        invocationId: 'inv-enable-hook-repeat',
      }, 'ws-test')
      expect(repeat).toMatchObject({ status: 'completed', persisted: false })

      const mcpEnable = await sm.applySessionPluginMutation(created.id, root, {
        ...call,
        op: 'enable',
        pluginId: 'mcp:remote',
        invocationId: 'inv-enable-mcp',
      }, 'ws-test')
      expect(mcpEnable).toMatchObject({
        status: 'approval_required',
        invocationId: 'inv-enable-mcp',
        reason: 'human_approval_required',
      })
      expect(enabled(filePath, 'mcp:remote')).toBe(false)
      const mcpSelf = await sm.resolveSessionPluginGrant(created.id, {
        invocationId: 'inv-enable-mcp',
        approver: agent,
        decision: { allowed: true },
        filePath,
      })
      expect(mcpSelf).toMatchObject({ status: 'approval_required', invocationId: 'inv-enable-mcp' })
      expect(sm.respondToPermission(created.id, 'host:inv-enable-mcp', false, true)).toBe(true)
      expect(enabled(filePath, 'mcp:remote')).toBe(false)
      const denied = await sm.resolveSessionPluginGrant(created.id, {
        invocationId: 'inv-enable-mcp',
        approver: DESKTOP_APPROVER,
        decision: { allowed: false, alwaysAllow: true },
        filePath,
      })
      expect(denied).toMatchObject({ status: 'denied', reason: 'approval_rejected' })
      const afterDeny = JSON.parse(readFileSync(filePath, 'utf8')) as {
        records: Array<{ id: string; enabled: boolean }>
        grants: Array<{ id: string; decision: string }>
      }
      expect(afterDeny.records.find((record) => record.id === 'mcp:remote')?.enabled).toBe(false)
      expect(afterDeny.grants).toEqual([
        { id: 'hook:lint', decision: 'approved' },
        { id: 'mcp:remote', decision: 'denied' },
      ])

      const askedAgain = await sm.applySessionPluginMutation(created.id, root, {
        ...call,
        op: 'enable',
        pluginId: 'mcp:remote',
        invocationId: 'inv-enable-mcp-again',
      }, 'ws-test')
      expect(askedAgain).toMatchObject({ status: 'approval_required', reason: 'human_approval_required' })
      expect(enabled(filePath, 'mcp:remote')).toBe(false)

      const text = readFileSync(getSessionFilePath(root, created.id), 'utf8')
      expect(text).toContain('"record":"fleet_host_session_event"')
      expect(text).toContain('"kind":"supervision_requested"')
      expect(text).toContain('"kind":"action_completed"')
      expect(text).toContain('"actionId":"file.update"')
      expect(loadSession(root, created.id)!.messages.map((entry) => entry.content)).toEqual(['keep me'])
      expect(kernel.events(created.id).some((event) => (
        event.kind === 'supervision_resolved' && event.actorRef.kind === 'human'
      ))).toBe(true)
      expect(kernel.events(created.id).some((event) => event.actorRef.kind === 'agent' && event.kind === 'supervision_resolved'))
        .toBe(false)
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
