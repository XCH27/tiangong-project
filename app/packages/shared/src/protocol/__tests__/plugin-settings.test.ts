import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ActorRef } from '../actor'
import {
  applyPluginMutationFromAgent,
  applyPluginMutationFromHuman,
  createPluginSettingsHost,
  resolvePluginGrant,
} from '../plugin-settings-host'
import {
  LOCKED_PLUGIN_PHASES,
  MARKET_CONTENT_FILTERS,
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

  test('list phases stay display-only and hook approval stays Locked', () => {
    expect(pluginPhaseStatus('third_party_hook_approval')).toBe('Locked')
    expect(pluginPhaseStatus('mcp_apps_side_pane')).toBe('display-only')
    expect(pluginPhaseStatus('agent_plugins_1_0_0')).toBe('display-only')
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
  test('human and agent install, enable, and disable are refused and do not write', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fleet-plugin-'))
    dirs.push(dir)
    const filePath = join(dir, 'loadout.json')
    const before = {
      version: 1,
      records: [
        { id: 'hook:lint', installed: true, enabled: false },
        { id: 'command:commit', installed: true, enabled: true },
      ],
    }
    writeFileSync(filePath, JSON.stringify(before))
    const shared = createPluginSettingsHost()

    const installed = await applyPluginMutationFromHuman(shared, {
      op: 'install',
      pluginId: 'skill:review',
      invocationId: 'invoke-human-install',
      actor: human,
      filePath,
      catalog,
    })
    expect(installed).toMatchObject({
      status: 'denied',
      reason: 'action_owner_mismatch:plugin_loadout',
    })

    const enabled = await applyPluginMutationFromAgent(shared, {
      op: 'enable',
      pluginId: 'hook:lint',
      invocationId: 'invoke-agent-enable',
      actor: agent,
      filePath,
      catalog,
    })
    expect(enabled).toMatchObject({
      status: 'denied',
      reason: 'action_owner_mismatch:plugin_loadout',
    })

    const disabled = await applyPluginMutationFromHuman(shared, {
      op: 'disable',
      pluginId: 'command:commit',
      invocationId: 'invoke-human-disable',
      actor: human,
      filePath,
      catalog,
    })
    expect(disabled).toMatchObject({
      status: 'denied',
      reason: 'action_owner_mismatch:plugin_loadout',
    })
    expect(JSON.parse(readFileSync(filePath, 'utf8'))).toEqual(before)

    const settled = await resolvePluginGrant(shared, {
      invocationId: 'invoke-agent-enable',
      approver: human,
      decision: { allowed: true, alwaysAllow: true },
      filePath,
    })
    expect(settled).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:plugin_loadout' })
    expect(JSON.parse(readFileSync(filePath, 'utf8'))).toEqual(before)
    expect(shared.kernel.snapshot().turns.every((turn) => turn.phase === 'denied')).toBe(true)
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
  })
})
