import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ActorRef } from '../actor'
import { InternalActionId } from '../internal-action'
import { DESKTOP_APPROVER } from '../host-approval-bridge'
import {
  applyPluginMutationFromAgent,
  applyPluginMutationFromHuman,
  createPluginSettingsHost,
  pendingPluginCard,
  readPluginLoadout,
  resolvePluginGrant,
} from '../plugin-settings-host'
import {
  LOCKED_PLUGIN_PHASES,
  MARKET_CONTENT_FILTERS,
  PLUGIN_SETTINGS_SESSION_ID,
  PLUGIN_VIEWS,
  createPluginSettingsState,
  entriesForView,
  parseMarketFilter,
  parsePluginView,
  planPluginMutation,
  pluginPhaseStatus,
  projectWorkspacePlugins,
  selectMarketFilter,
  selectPluginView,
  type PluginCatalogEntry,
} from '../plugin-settings'

const human: ActorRef = { kind: 'human', id: 'user-1', displayName: 'Ada' }
const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }
const dirs: string[] = []

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
    id: 'mcp:docs',
    name: 'Docs',
    description: 'Workspace MCP source',
    kind: 'mcp',
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
    id: 'command:commit',
    name: 'Commit',
    description: 'Local command',
    kind: 'command',
    origin: 'caller',
    trust: 'first_party',
  },
]

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('plugin settings navigation and market filters', () => {
  test('the settings page does not write a loadout or render the session card', () => {
    const source = readFileSync(new URL(
      '../../../../../apps/electron/src/renderer/pages/settings/PluginsSettingsPage.tsx',
      import.meta.url,
    ), 'utf8')
    expect(source.includes('createPluginSettingsHost()')).toBe(false)
    expect(source.includes('applyPluginMutationFromHuman')).toBe(false)
    expect(source.includes('applyPluginMutationFromAgent')).toBe(false)
    expect(source.includes('resolvePluginGrant')).toBe(false)
    expect(source.includes('PLUGIN_SETTINGS_SESSION_ID')).toBe(false)
    expect(source.includes('PermissionRequest')).toBe(false)
    expect(source.includes('data-plugin-writes="locked"')).toBe(true)
  })

  test('five views stay distinct and an unknown view is rejected', () => {
    expect(PLUGIN_VIEWS).toEqual(['installed', 'market', 'skills', 'mcp', 'hooks'])
    expect(new Set(PLUGIN_VIEWS).size).toBe(5)
    expect(parsePluginView('market')).toBe('market')
    expect(parsePluginView('store')).toBeNull()
    expect(parseMarketFilter('chrome')).toBeNull()

    const installed = createPluginSettingsState({
      catalog,
      loadout: { version: 1, records: [{ id: 'skill:review', installed: true, enabled: true }] },
    })
    const seen = PLUGIN_VIEWS.map((view) => entriesForView(selectPluginView(installed, view)).map((entry) => entry.id))
    expect(seen).toEqual([
      ['skill:review'],
      ['skill:review', 'mcp:docs', 'hook:lint', 'command:commit'],
      ['skill:review'],
      ['mcp:docs'],
      ['hook:lint'],
    ])
  })

  test('market content filters narrow the market view and leave the other views alone', () => {
    expect(MARKET_CONTENT_FILTERS).toEqual(['all', 'skill', 'mcp', 'hook', 'command'])
    let state = createPluginSettingsState({
      catalog,
      view: 'market',
      loadout: { version: 1, records: [{ id: 'skill:review', installed: true, enabled: true }] },
    })
    const filtered = MARKET_CONTENT_FILTERS.map((filter) => {
      state = selectMarketFilter(state, filter)
      return entriesForView(state).map((entry) => entry.kind)
    })
    expect(filtered).toEqual([
      ['skill', 'mcp', 'hook', 'command'],
      ['skill'],
      ['mcp'],
      ['hook'],
      ['command'],
    ])

    const installed = entriesForView(selectPluginView(state, 'installed')).map((entry) => entry.id)
    expect(state.marketFilter).toBe('command')
    expect(installed).toEqual(['skill:review'])
  })

  test('workspace projection keeps skills and MCP sources and skips other source types', () => {
    const projected = projectWorkspacePlugins({
      skills: [{ slug: 'review', name: 'Review', description: 'Checks a diff' }],
      sources: [
        { slug: 'docs', name: 'Docs', type: 'mcp', description: 'Docs server' },
        { slug: 'gmail', name: 'Gmail', type: 'api', description: 'Mail' },
        { slug: 'notes', name: 'Notes', type: 'local' },
      ],
    })
    expect(projected.map((entry) => entry.id)).toEqual(['skill:review', 'mcp:docs'])
    expect(projected.every((entry) => entry.trust === 'first_party' && entry.origin === 'workspace')).toBe(true)
  })

  test('MCP Apps side pane is wired and the sandbox stays Locked', () => {
    expect(pluginPhaseStatus('third_party_hook_approval')).toBe('wired')
    expect(pluginPhaseStatus('mcp_apps_side_pane')).toBe('wired')
    expect(pluginPhaseStatus('agent_plugins_1_0_0')).toBe('wired')
    expect([...LOCKED_PLUGIN_PHASES]).toEqual(['mcp_apps_sandbox'])
    expect(LOCKED_PLUGIN_PHASES.map((phase) => pluginPhaseStatus(phase))).toEqual(['Locked'])
    const waiting = planPluginMutation(
      catalog,
      { version: 1, records: [{ id: 'hook:lint', installed: true, enabled: false }] },
      'enable',
      'hook:lint',
    )
    expect(waiting.status).toBe('approval')
  })
})

describe('plugin loadout admission', () => {
  test('human and agent install through file.update and do not enable', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fleet-plugin-'))
    dirs.push(dir)
    const filePath = join(dir, 'loadout.json')
    const shared = createPluginSettingsHost()

    const humanResult = await applyPluginMutationFromHuman(shared, {
      op: 'install',
      pluginId: 'skill:review',
      invocationId: 'invoke-human-install',
      actor: human,
      filePath,
      catalog,
    })
    expect(humanResult.status).toBe('completed')
    if (humanResult.status !== 'completed') return
    expect(humanResult.persisted).toBe(true)
    expect(humanResult.loadout.records).toEqual([
      { id: 'skill:review', installed: true, enabled: false },
    ])
    const written = JSON.parse(readFileSync(filePath, 'utf8')) as { records: Array<{ enabled: boolean }> }
    expect(written.records[0]?.enabled).toBe(false)

    const agentResult = await applyPluginMutationFromAgent(shared, {
      op: 'install',
      pluginId: 'mcp:docs',
      invocationId: 'invoke-agent-install',
      actor: agent,
      filePath,
      catalog,
    })
    expect(agentResult.status).toBe('completed')
    if (agentResult.status !== 'completed') return
    expect(agentResult.loadout.records.map((record) => record.id)).toEqual(['skill:review', 'mcp:docs'])
    expect(readPluginLoadout(filePath).status).toBe('ok')
  })

  test('enable and disable rewrite the same loadout after admission', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fleet-plugin-toggle-'))
    dirs.push(dir)
    const filePath = join(dir, 'loadout.json')
    const shared = createPluginSettingsHost()
    await applyPluginMutationFromHuman(shared, {
      op: 'install',
      pluginId: 'command:commit',
      invocationId: 'invoke-install-command',
      actor: human,
      filePath,
      catalog,
    })
    const enabled = await applyPluginMutationFromAgent(shared, {
      op: 'enable',
      pluginId: 'command:commit',
      invocationId: 'invoke-enable-command',
      actor: agent,
      filePath,
      catalog,
    })
    expect(enabled.status).toBe('completed')
    if (enabled.status !== 'completed') return
    expect(enabled.loadout.records[0]).toEqual({ id: 'command:commit', installed: true, enabled: true })

    const disabled = await applyPluginMutationFromHuman(shared, {
      op: 'disable',
      pluginId: 'command:commit',
      invocationId: 'invoke-disable-command',
      actor: human,
      filePath,
      catalog,
    })
    expect(disabled.status).toBe('completed')
    if (disabled.status !== 'completed') return
    expect(disabled.loadout.records[0]?.enabled).toBe(false)
    expect(disabled.loadout.records[0]?.installed).toBe(true)
  })

  test('deny blocks the enable write and approve enables a third-party hook once', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fleet-plugin-hook-'))
    dirs.push(dir)
    const filePath = join(dir, 'loadout.json')
    const shared = createPluginSettingsHost()
    const approvalCatalog: PluginCatalogEntry[] = [
      ...catalog,
      {
        id: 'mcp:remote',
        name: 'Remote',
        description: 'Catalog MCP server',
        kind: 'mcp',
        origin: 'catalog',
        trust: 'third_party',
      },
      {
        id: 'skill:extra',
        name: 'Extra',
        description: 'Catalog skill',
        kind: 'skill',
        origin: 'catalog',
        trust: 'third_party',
      },
    ]
    await applyPluginMutationFromHuman(shared, {
      op: 'install',
      pluginId: 'hook:lint',
      invocationId: 'invoke-install-hook',
      actor: human,
      filePath,
      catalog: approvalCatalog,
    })
    await applyPluginMutationFromHuman(shared, {
      op: 'install',
      pluginId: 'mcp:docs',
      invocationId: 'invoke-install-docs',
      actor: human,
      filePath,
      catalog: approvalCatalog,
    })
    await applyPluginMutationFromHuman(shared, {
      op: 'install',
      pluginId: 'mcp:remote',
      invocationId: 'invoke-install-remote',
      actor: human,
      filePath,
      catalog: approvalCatalog,
    })
    await applyPluginMutationFromHuman(shared, {
      op: 'install',
      pluginId: 'skill:extra',
      invocationId: 'invoke-install-skill',
      actor: human,
      filePath,
      catalog: approvalCatalog,
    })
    const before = readFileSync(filePath, 'utf8')

    const firstParty = await applyPluginMutationFromAgent(shared, {
      op: 'enable',
      pluginId: 'mcp:docs',
      invocationId: 'invoke-enable-docs',
      actor: agent,
      filePath,
      catalog: approvalCatalog,
    })
    expect(firstParty.status).toBe('completed')
    if (firstParty.status !== 'completed') return
    expect(firstParty.loadout.records.find((record) => record.id === 'mcp:docs')?.enabled).toBe(true)

    const skill = await applyPluginMutationFromAgent(shared, {
      op: 'enable',
      pluginId: 'skill:extra',
      invocationId: 'invoke-enable-skill',
      actor: agent,
      filePath,
      catalog: approvalCatalog,
    })
    expect(skill.status).toBe('completed')

    const requested = await applyPluginMutationFromAgent(shared, {
      op: 'enable',
      pluginId: 'hook:lint',
      invocationId: 'invoke-enable-hook',
      actor: agent,
      filePath,
      catalog: approvalCatalog,
    })
    expect(requested).toMatchObject({
      status: 'approval_required',
      invocationId: 'invoke-enable-hook',
      reason: 'human_approval_required',
    })
    const waiting = readFileSync(filePath, 'utf8')
    expect(JSON.parse(waiting).records.find((record: { id: string }) => record.id === 'hook:lint').enabled).toBe(false)
    await expect(shared.kernel.run('invoke-enable-hook')).resolves.toMatchObject({ status: 'approval_required' })
    expect(readFileSync(filePath, 'utf8')).toBe(waiting)

    const humanRequest = await applyPluginMutationFromHuman(shared, {
      op: 'enable',
      pluginId: 'hook:lint',
      invocationId: 'invoke-enable-hook-human',
      actor: human,
      filePath,
      catalog: approvalCatalog,
    })
    expect(humanRequest.status).toBe('approval_required')
    const card = pendingPluginCard(shared, 'invoke-enable-hook')
    expect(card).toMatchObject({
      requestId: 'host:invoke-enable-hook',
      toolName: 'file.update',
      command: 'hook:lint',
      type: 'file_write',
    })

    const selfApproved = await resolvePluginGrant(shared, {
      invocationId: card!.requestId,
      approver: agent,
      decision: { allowed: true, alwaysAllow: true },
      filePath,
    })
    expect(selfApproved).toMatchObject({ status: 'approval_required', invocationId: 'invoke-enable-hook' })
    expect(readFileSync(filePath, 'utf8')).toBe(waiting)
    expect(shared.kernel.snapshot().turns.find((turn) => turn.request.invocation.invocationId === 'invoke-enable-hook')?.phase)
      .toBe('awaiting_approval')

    const denied = await resolvePluginGrant(shared, {
      invocationId: 'host:invoke-enable-hook',
      approver: DESKTOP_APPROVER,
      decision: { allowed: false, alwaysAllow: true },
      filePath,
    })
    expect(denied).toMatchObject({ status: 'denied', reason: 'approval_rejected' })
    const afterDeny = JSON.parse(readFileSync(filePath, 'utf8')) as {
      records: Array<{ id: string; enabled: boolean }>
      grants: Array<{ id: string; decision: string }>
    }
    expect(afterDeny.records.find((record) => record.id === 'hook:lint')?.enabled).toBe(false)
    expect(afterDeny.grants).toEqual([{ id: 'hook:lint', decision: 'denied' }])
    expect(enableWrites(shared)).toEqual([])

    const askedAgain = await applyPluginMutationFromAgent(shared, {
      op: 'enable',
      pluginId: 'hook:lint',
      invocationId: 'invoke-enable-hook-again',
      actor: agent,
      filePath,
      catalog: approvalCatalog,
    })
    expect(askedAgain.status).toBe('approval_required')
    const allowed = await resolvePluginGrant(shared, {
      invocationId: 'invoke-enable-hook-again',
      approver: DESKTOP_APPROVER,
      decision: { allowed: true, alwaysAllow: true },
      filePath,
    })
    expect(allowed.status).toBe('completed')
    if (allowed.status !== 'completed') return
    expect(allowed.persisted).toBe(true)
    expect(allowed.loadout.records.find((record) => record.id === 'hook:lint')).toEqual({
      id: 'hook:lint',
      installed: true,
      enabled: true,
    })
    expect(allowed.loadout.grants).toEqual([{ id: 'hook:lint', decision: 'approved' }])
    expect(enableWrites(shared)).toEqual(['invoke-enable-hook-again'])
    const once = readFileSync(filePath, 'utf8')

    const repeat = await applyPluginMutationFromAgent(shared, {
      op: 'enable',
      pluginId: 'hook:lint',
      invocationId: 'invoke-enable-hook-repeat',
      actor: agent,
      filePath,
      catalog: approvalCatalog,
    })
    expect(repeat).toMatchObject({ status: 'completed', persisted: false })
    expect(readFileSync(filePath, 'utf8')).toBe(once)
    expect(enableWrites(shared)).toEqual(['invoke-enable-hook-again'])

    const other = await applyPluginMutationFromAgent(shared, {
      op: 'enable',
      pluginId: 'mcp:remote',
      invocationId: 'invoke-enable-remote',
      actor: agent,
      filePath,
      catalog: approvalCatalog,
    })
    expect(other).toMatchObject({ status: 'approval_required', reason: 'human_approval_required' })
    expect(JSON.parse(readFileSync(filePath, 'utf8')).records.find((record: { id: string }) => record.id === 'mcp:remote').enabled)
      .toBe(false)

    const remoteCard = pendingPluginCard(shared, 'invoke-enable-remote')
    const remoteAllowed = await resolvePluginGrant(shared, {
      invocationId: remoteCard!.requestId,
      approver: human,
      decision: { allowed: true },
      filePath,
    })
    expect(remoteAllowed.status).toBe('completed')
    if (remoteAllowed.status !== 'completed') return
    expect(remoteAllowed.loadout.records.find((record) => record.id === 'mcp:remote')?.enabled).toBe(true)
    expect(remoteAllowed.loadout.grants).toEqual([
      { id: 'hook:lint', decision: 'approved' },
      { id: 'mcp:remote', decision: 'approved' },
    ])

    const restored = createPluginSettingsHost()
    const disabled = await applyPluginMutationFromHuman(restored, {
      op: 'disable',
      pluginId: 'hook:lint',
      invocationId: 'invoke-disable-hook',
      actor: human,
      filePath,
      catalog: approvalCatalog,
    })
    expect(disabled.status).toBe('completed')
    const restoredEnable = await applyPluginMutationFromAgent(restored, {
      op: 'enable',
      pluginId: 'hook:lint',
      invocationId: 'invoke-restore-hook',
      actor: agent,
      filePath,
      catalog: approvalCatalog,
    })
    expect(restoredEnable).toMatchObject({ status: 'completed', persisted: true })
    if (restoredEnable.status !== 'completed') return
    expect(restoredEnable.loadout.records.find((record) => record.id === 'hook:lint')?.enabled).toBe(true)
    expect(restoredEnable.loadout.grants).toEqual([
      { id: 'hook:lint', decision: 'approved' },
      { id: 'mcp:remote', decision: 'approved' },
    ])
    expect(restored.kernel.snapshot().turns.find((turn) => turn.request.invocation.invocationId === 'invoke-restore-hook')?.phase)
      .toBe('completed')
    expect(shared.kernel.events(PLUGIN_SETTINGS_SESSION_ID).some((event) => (
      event.kind === 'supervision_resolved' && event.actorRef.kind === 'human'
    ))).toBe(true)
    expect(before).not.toBe(once)
  })

  test('an unadmitted caller and a credential loadout do not write', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fleet-plugin-deny-'))
    dirs.push(dir)
    const filePath = join(dir, 'loadout.json')
    const shared = createPluginSettingsHost()
    const denied = await applyPluginMutationFromAgent(shared, {
      op: 'install',
      pluginId: 'skill:review',
      invocationId: 'invoke-system',
      actor: { kind: 'system', id: 'system', displayName: 'System' },
      filePath,
      catalog,
    })
    expect(denied.status).toBe('denied')
    expect(existsSync(filePath)).toBe(false)

    const secretPath = join(dir, 'secret-loadout.json')
    writeFileSync(secretPath, JSON.stringify({ version: 1, records: [], apiKey: 'present' }))
    const rejected = await applyPluginMutationFromHuman(shared, {
      op: 'install',
      pluginId: 'skill:review',
      invocationId: 'invoke-secret',
      actor: human,
      filePath: secretPath,
      catalog,
    })
    expect(rejected.status).toBe('failed')
    if (rejected.status === 'failed') expect(rejected.reason).toBe('credential_material_rejected')
    expect(readFileSync(secretPath, 'utf8')).toContain('apiKey')

    const unsafe = await applyPluginMutationFromHuman(shared, {
      op: 'install',
      pluginId: 'skill:review',
      invocationId: 'invoke-unsafe',
      actor: human,
      filePath: `${dir}/../escape.json`,
      catalog,
    })
    expect(unsafe.status).toBe('failed')
    if (unsafe.status === 'failed') expect(unsafe.reason).toBe('unsafe_file_path')
    expect(existsSync(join(dir, '..', 'escape.json'))).toBe(false)
    expect(InternalActionId.FILE_UPDATE).toBe('file.update')
  })
})

function enableWrites(shared: ReturnType<typeof createPluginSettingsHost>, pluginId = 'hook:lint'): string[] {
  return shared.kernel.snapshot().turns
    .filter((turn) => (
      turn.phase === 'completed'
      && turn.request.invocation.payload.op === 'enable'
      && turn.request.invocation.payload.pluginId === pluginId
    ))
    .map((turn) => turn.request.invocation.invocationId)
}
