import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ActorRef } from '../actor'
import { InternalActionId } from '../internal-action'
import {
  MCP_REGISTRY_LIST_URL,
  MCP_REGISTRY_SOURCE,
  SKILL_REPOSITORY_SOURCE,
  catalogSourceStatus,
  filterCatalogSources,
  isAllowedCatalogUrl,
  listCatalogMarket,
  readCatalogSource,
  type CatalogFetch,
  type CatalogRead,
} from '../plugin-catalog-sources'
import {
  applyPluginMutationFromAgent,
  applyPluginMutationFromHuman,
  createPluginSettingsHost,
} from '../plugin-settings-host'

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')
const human: ActorRef = { kind: 'human', id: 'user-1', displayName: 'Ada' }
const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }
const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixtureDir, name), 'utf8'))
}

function fixtureText(name: string): string {
  return readFileSync(join(fixtureDir, name), 'utf8')
}

const workspace = {
  skills: [{ slug: 'local-review', name: 'Local review', description: 'Workspace skill' }],
  sources: [
    { slug: 'docs', name: 'Docs', type: 'mcp', description: 'Workspace MCP source' },
    { slug: 'gmail', name: 'Gmail', type: 'api', description: 'Mail' },
  ],
}

describe('catalog source adapters', () => {
  test('recorded fixtures list MCP and skill entries and drop the rest', async () => {
    const registry = await readCatalogSource({
      source: MCP_REGISTRY_SOURCE,
      document: fixture('mcp-registry-servers.json'),
    })
    const skills = await readCatalogSource({
      source: SKILL_REPOSITORY_SOURCE,
      body: fixtureText('skill-repository-index.json'),
    })
    expect(registry.status).toBe('ok')
    expect(skills.status).toBe('ok')
    if (registry.status !== 'ok' || skills.status !== 'ok') return
    expect(registry.entries.map((entry) => entry.id)).toEqual([
      'mcp:io.github.example/filesystem',
      'mcp:io.github.example/weather',
    ])
    expect(registry.entries.every((entry) => entry.kind === 'mcp' && entry.origin === 'catalog' && entry.trust === 'third_party')).toBe(true)
    expect(skills.entries.map((entry) => ({ id: entry.id, kind: entry.kind }))).toEqual([
      { id: 'skill:review-diff', kind: 'skill' },
      { id: 'hook:lint-hook', kind: 'hook' },
      { id: 'command:commit-note', kind: 'command' },
    ])
  })

  test('market content filters and the source type filter narrow the same list', async () => {
    const reads = await recordedReads()
    const all = listCatalogMarket({ ...workspace, reads, contentFilter: 'all' }).map((entry) => entry.id)
    expect(all).toEqual([
      'skill:local-review',
      'mcp:docs',
      'mcp:io.github.example/filesystem',
      'mcp:io.github.example/weather',
      'skill:review-diff',
      'hook:lint-hook',
      'command:commit-note',
    ])

    expect(listCatalogMarket({ ...workspace, reads, contentFilter: 'skill' }).map((entry) => entry.id)).toEqual([
      'skill:local-review',
      'skill:review-diff',
    ])
    expect(listCatalogMarket({ ...workspace, reads, contentFilter: 'mcp' }).map((entry) => entry.id)).toEqual([
      'mcp:docs',
      'mcp:io.github.example/filesystem',
      'mcp:io.github.example/weather',
    ])
    expect(listCatalogMarket({ ...workspace, reads, contentFilter: 'hook' }).map((entry) => entry.id)).toEqual([
      'hook:lint-hook',
    ])
    expect(listCatalogMarket({ ...workspace, reads, contentFilter: 'command' }).map((entry) => entry.id)).toEqual([
      'command:commit-note',
    ])

    const registryOnly = listCatalogMarket({
      ...workspace,
      reads,
      sourceFilter: { kind: 'type', sourceKind: 'mcp_registry' },
      contentFilter: 'all',
    }).map((entry) => entry.id)
    expect(registryOnly).toEqual([
      'mcp:io.github.example/filesystem',
      'mcp:io.github.example/weather',
    ])
    expect(filterCatalogSources(
      [MCP_REGISTRY_SOURCE, SKILL_REPOSITORY_SOURCE],
      { kind: 'type', sourceKind: 'skill_repository' },
    ).map((source) => source.slug)).toEqual(['skill-repository'])
    expect(listCatalogMarket({
      ...workspace,
      reads,
      sourceFilter: { kind: 'type', sourceKind: 'skill_repository' },
      contentFilter: 'mcp',
    })).toEqual([])
    expect(catalogSourceStatus('mcp_registry')).toBe('wired')
    expect(catalogSourceStatus('skill_repository')).toBe('wired')
  })

  test('agent plugins and a plugin marketplace do not become market entries', async () => {
    const locked = await readCatalogSource({
      source: SKILL_REPOSITORY_SOURCE,
      document: fixture('agent-plugins-1.0.0.json'),
    })
    expect(locked).toMatchObject({ status: 'Locked', phase: 'agent_plugins_1_0_0', entries: [] })
    const marketplace = await readCatalogSource({
      source: SKILL_REPOSITORY_SOURCE,
      document: fixture('plugin-marketplace.json'),
    })
    expect(marketplace).toMatchObject({ status: 'closed', reason: 'plugin_marketplace_rejected', entries: [] })
    expect(listCatalogMarket({ reads: [locked, marketplace], contentFilter: 'all' })).toEqual([])
  })

  test('a closed read contributes nothing and live fetch stays optional', async () => {
    let calls = 0
    const fetchImpl: CatalogFetch = async () => {
      calls += 1
      return jsonResponse(200, fixtureText('mcp-registry-servers.json'))
    }
    const disabled = await readCatalogSource({
      source: MCP_REGISTRY_SOURCE,
      allowNetwork: false,
      url: MCP_REGISTRY_LIST_URL,
      fetchImpl,
    })
    expect(disabled).toMatchObject({ status: 'closed', reason: 'network_disabled', entries: [] })
    expect(calls).toBe(0)

    const fixtureFirst = await readCatalogSource({
      source: MCP_REGISTRY_SOURCE,
      document: fixture('mcp-registry-servers.json'),
      allowNetwork: true,
      url: MCP_REGISTRY_LIST_URL,
      fetchImpl,
    })
    expect(fixtureFirst.status).toBe('ok')
    expect(calls).toBe(0)

    const unsafe = await readCatalogSource({
      source: MCP_REGISTRY_SOURCE,
      allowNetwork: true,
      url: 'https://registry.modelcontextprotocol.io/v0.1/servers?include_deleted=true',
      fetchImpl,
    })
    expect(unsafe).toMatchObject({ status: 'closed', reason: 'unsafe_url', entries: [] })
    expect(calls).toBe(0)
    expect(isAllowedCatalogUrl('skill_repository', 'http://127.0.0.1/skills.json')).toBe(false)
    expect(isAllowedCatalogUrl('skill_repository', 'https://example.com/skills.json')).toBe(true)

    const redirected = await readCatalogSource({
      source: MCP_REGISTRY_SOURCE,
      allowNetwork: true,
      url: MCP_REGISTRY_LIST_URL,
      fetchImpl: async () => jsonResponse(302, ''),
    })
    expect(redirected).toMatchObject({ status: 'closed', reason: 'redirect_rejected', entries: [] })

    const html = await readCatalogSource({
      source: SKILL_REPOSITORY_SOURCE,
      allowNetwork: true,
      url: 'https://example.com/skills.json',
      fetchImpl: async () => ({
        status: 200,
        headers: { get: () => 'text/html' },
        text: async () => '<html></html>',
      }),
    })
    expect(html).toMatchObject({ status: 'closed', reason: 'invalid_catalog', entries: [] })

    const live = await readCatalogSource({
      source: MCP_REGISTRY_SOURCE,
      allowNetwork: true,
      url: MCP_REGISTRY_LIST_URL,
      fetchImpl,
    })
    expect(live.status).toBe('ok')
    if (live.status !== 'ok') return
    expect(live.entries.map((entry) => entry.id)).toEqual([
      'mcp:io.github.example/filesystem',
      'mcp:io.github.example/weather',
    ])
    expect(calls).toBe(1)

    const missingUrl = await readCatalogSource({
      source: SKILL_REPOSITORY_SOURCE,
      allowNetwork: true,
    })
    expect(missingUrl).toMatchObject({ status: 'closed', reason: 'source_url_missing', entries: [] })
    const broken = await readCatalogSource({
      source: SKILL_REPOSITORY_SOURCE,
      body: '{',
    })
    expect(broken).toMatchObject({ status: 'closed', reason: 'invalid_catalog', entries: [] })
    expect(listCatalogMarket({ reads: [disabled, redirected, html, broken], contentFilter: 'all' })).toEqual([])
  })

  test('install of a fixture catalog entry still admits file.update and does not enable', async () => {
    const reads = await recordedReads()
    const catalog = listCatalogMarket({ reads, contentFilter: 'all' })
    const dir = mkdtempSync(join(tmpdir(), 'fleet-catalog-'))
    dirs.push(dir)
    const filePath = join(dir, 'loadout.json')
    const shared = createPluginSettingsHost()
    const installed = await applyPluginMutationFromHuman(shared, {
      op: 'install',
      pluginId: 'mcp:io.github.example/filesystem',
      invocationId: 'invoke-catalog-install',
      actor: human,
      filePath,
      catalog,
    })
    expect(installed.status).toBe('completed')
    if (installed.status !== 'completed') return
    expect(installed.loadout.records).toEqual([
      { id: 'mcp:io.github.example/filesystem', installed: true, enabled: false },
    ])
    expect(JSON.parse(readFileSync(filePath, 'utf8')).records[0].enabled).toBe(false)

    const hookInstalled = await applyPluginMutationFromAgent(shared, {
      op: 'install',
      pluginId: 'hook:lint-hook',
      invocationId: 'invoke-catalog-hook-install',
      actor: agent,
      filePath,
      catalog,
    })
    expect(hookInstalled.status).toBe('completed')
    const enabled = await applyPluginMutationFromAgent(shared, {
      op: 'enable',
      pluginId: 'hook:lint-hook',
      invocationId: 'invoke-catalog-hook-enable',
      actor: agent,
      filePath,
      catalog,
    })
    expect(enabled).toMatchObject({
      status: 'approval_required',
      reason: 'human_approval_required',
      invocationId: 'invoke-catalog-hook-enable',
    })
    const written = JSON.parse(readFileSync(filePath, 'utf8')) as { records: Array<{ id: string; enabled: boolean }> }
    expect(written.records.find((record) => record.id === 'hook:lint-hook')?.enabled).toBe(false)
    expect(InternalActionId.FILE_UPDATE).toBe('file.update')
  })
})

async function recordedReads(): Promise<CatalogRead[]> {
  return [
    await readCatalogSource({ source: MCP_REGISTRY_SOURCE, document: fixture('mcp-registry-servers.json') }),
    await readCatalogSource({ source: SKILL_REPOSITORY_SOURCE, document: fixture('skill-repository-index.json') }),
  ]
}

function jsonResponse(status: number, body: string): { status: number; headers: { get(name: string): string | null }; text(): Promise<string> } {
  return {
    status,
    headers: { get: (name) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
    text: async () => body,
  }
}
