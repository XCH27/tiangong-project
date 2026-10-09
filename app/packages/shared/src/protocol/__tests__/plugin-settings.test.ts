import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ActorRef } from '../actor'
import { InternalActionId } from '../internal-action'
import {
  applyPluginMutationFromAgent,
  applyPluginMutationFromHuman,
  createPluginSettingsHost,
  readPluginLoadout,
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

  test('later plugin phases stay Locked', () => {
    expect(LOCKED_PLUGIN_PHASES.map((phase) => pluginPhaseStatus(phase))).toEqual([
      'Locked',
      'Locked',
      'Locked',
      'Locked',
    ])
    const blocked = planPluginMutation(catalog, { version: 1, records: [] }, 'enable', 'hook:lint')
    expect(blocked).toEqual({ status: 'Locked', phase: 'third_party_hook_approval' })
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

  test('a third-party hook enable stays Locked and does not write', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fleet-plugin-hook-'))
    dirs.push(dir)
    const filePath = join(dir, 'loadout.json')
    const shared = createPluginSettingsHost()
    const installed = await applyPluginMutationFromHuman(shared, {
      op: 'install',
      pluginId: 'hook:lint',
      invocationId: 'invoke-install-hook',
      actor: human,
      filePath,
      catalog,
    })
    expect(installed.status).toBe('completed')
    const before = readFileSync(filePath, 'utf8')
    const enabled = await applyPluginMutationFromAgent(shared, {
      op: 'enable',
      pluginId: 'hook:lint',
      invocationId: 'invoke-enable-hook',
      actor: agent,
      filePath,
      catalog,
    })
    expect(enabled).toEqual({
      status: 'Locked',
      phase: 'third_party_hook_approval',
      invocationId: 'invoke-enable-hook',
    })
    expect(readFileSync(filePath, 'utf8')).toBe(before)
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
