import { describe, expect, test } from 'bun:test'
import type { ActorRef } from '../actor'
import { InternalActionId } from '../internal-action'
import {
  closeMcpAppsFromAgent,
  closeMcpAppsFromHuman,
  createMcpAppsHost,
  focusMcpAppFromAgent,
  focusMcpAppFromHuman,
  openMcpAppsFromAgent,
  openMcpAppsFromHuman,
} from '../mcp-apps-host'
import {
  MCP_APPS_LOCKED_PHASES,
  buildMcpAppsSidebarParam,
  listMcpAppsSurfaces,
  lockedMcpAppsPhase,
  mcpAppsLayoutSlot,
  parseMcpAppsSidebarParam,
  projectEnabledMcpApps,
  type McpAppInventoryEntry,
} from '../mcp-apps-pane'
import type { PluginCatalogEntry, PluginLoadoutFile } from '../plugin-settings'

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
    id: 'mcp:docs',
    name: 'Docs',
    description: 'Workspace MCP source',
    kind: 'mcp',
    origin: 'workspace',
    trust: 'first_party',
  },
  {
    id: 'mcp:notes',
    name: 'Notes',
    description: 'Installed MCP source',
    kind: 'mcp',
    origin: 'workspace',
    trust: 'first_party',
  },
]

const loadout: PluginLoadoutFile = {
  version: 1,
  records: [
    { id: 'skill:review', installed: true, enabled: true },
    { id: 'mcp:docs', installed: true, enabled: true },
    { id: 'mcp:notes', installed: true, enabled: false },
  ],
}

const inventory: McpAppInventoryEntry[] = [
  {
    pluginId: 'mcp:docs',
    tools: [
      { name: 'search', description: 'Search docs', uiResourceUri: 'ui://docs/search' },
      { name: 'sk-abcdefghijklmnop', description: 'secret tool' },
      { name: '../escape', description: 'bad name' },
    ],
    resources: [
      { uri: 'ui://docs/search', name: 'Search', description: 'Search panel' },
      { uri: 'https://example.test/guide', name: 'Guide', description: 'Public page' },
      { uri: 'javascript:alert(1)', name: 'Script', description: 'Rejected scheme' },
      { uri: 'ui://docs/secret', name: 'Secret', description: 'Bearer leaked-token' },
    ],
  },
  {
    pluginId: 'mcp:notes',
    tools: [{ name: 'hidden', description: 'Disabled server' }],
    resources: [],
  },
]

const read = { catalog, loadout, inventory }

describe('mcp apps side pane projection', () => {
  test('enabled MCP tools and resources are listed and locked phases stay locked', () => {
    expect(listMcpAppsSurfaces().filter((surface) => surface.status === 'wired').map((surface) => surface.id)).toEqual([
      'enabled_list',
      'open_focus',
    ])
    expect(MCP_APPS_LOCKED_PHASES.map((phase) => lockedMcpAppsPhase(phase).status)).toEqual([
      'Locked',
      'Locked',
      'Locked',
      'Locked',
      'Locked',
    ])

    const listed = projectEnabledMcpApps(read)
    expect(listed.map((app) => app.pluginId)).toEqual(['mcp:docs'])
    expect(listed[0]?.tools.map((tool) => tool.name)).toEqual(['search'])
    expect(listed[0]?.tools[0]?.uiResourceUri).toBe('ui://docs/search')
    expect(listed[0]?.resources.map((resource) => resource.uri)).toEqual([
      'ui://docs/search',
      'https://example.test/guide',
    ])
  })

  test('the sidebar param round-trips a focused tool and drops a closed pane', () => {
    const open = { open: true, focus: null }
    expect(buildMcpAppsSidebarParam(open)).toBe('mcp-apps')
    expect(parseMcpAppsSidebarParam('mcp-apps')).toEqual(open)
    expect(mcpAppsLayoutSlot(open)).toEqual({ type: 'mcp-apps' })

    const focused = {
      open: true,
      focus: { pluginId: 'mcp:docs', kind: 'tool' as const, itemId: 'search' },
    }
    const param = buildMcpAppsSidebarParam(focused)
    expect(param).toBe('mcp-apps:mcp%3Adocs:tool:search')
    expect(parseMcpAppsSidebarParam(param ?? '')).toEqual(focused)
    expect(mcpAppsLayoutSlot(focused)).toEqual({ type: 'mcp-apps', focus: focused.focus })

    const resource = {
      open: true,
      focus: { pluginId: 'mcp:docs', kind: 'resource' as const, itemId: 'ui://docs/search' },
    }
    expect(parseMcpAppsSidebarParam(buildMcpAppsSidebarParam(resource) ?? '')).toEqual(resource)
    expect(buildMcpAppsSidebarParam({ open: false, focus: null })).toBeUndefined()
    expect(parseMcpAppsSidebarParam('marketplace')).toBeNull()
    expect(mcpAppsLayoutSlot({ open: false, focus: null })).toEqual({ type: 'none' })
  })
})

describe('mcp apps side pane admission', () => {
  test('human and agent open and focus through canvas.node_select', async () => {
    const shared = createMcpAppsHost()
    const opened = await openMcpAppsFromHuman(shared, {
      ...read,
      invocationId: 'mcp-open-human',
      actor: human,
    })
    expect(opened.status).toBe('completed')
    if (opened.status !== 'completed') return
    expect(opened.admitted).toBe(true)
    expect(opened.view).toEqual({ open: true, focus: null })
    expect(shared.kernel.events('mcp-apps').every((event) => event.actionId === InternalActionId.CANVAS_NODE_SELECT)).toBe(true)
    expect(shared.kernel.events('mcp-apps').some((event) => event.actionId === InternalActionId.FILE_UPDATE)).toBe(false)

    const focused = await focusMcpAppFromAgent(shared, {
      ...read,
      invocationId: 'mcp-focus-agent',
      actor: agent,
      pluginId: 'mcp:docs',
      itemKind: 'tool',
      itemId: 'search',
    })
    expect(focused.status).toBe('completed')
    if (focused.status !== 'completed') return
    expect(focused.admitted).toBe(true)
    expect(focused.view.focus).toEqual({ pluginId: 'mcp:docs', kind: 'tool', itemId: 'search' })
    expect(mcpAppsLayoutSlot(focused.view)).toEqual({
      type: 'mcp-apps',
      focus: { pluginId: 'mcp:docs', kind: 'tool', itemId: 'search' },
    })

    const resource = await focusMcpAppFromHuman(shared, {
      ...read,
      invocationId: 'mcp-focus-resource',
      actor: human,
      pluginId: 'mcp:docs',
      itemKind: 'resource',
      itemId: 'ui://docs/search',
    })
    expect(resource.status).toBe('completed')
    if (resource.status !== 'completed') return
    expect(resource.view.focus?.itemId).toBe('ui://docs/search')

    const closed = await closeMcpAppsFromAgent(shared, {
      ...read,
      invocationId: 'mcp-close-agent',
      actor: agent,
    })
    expect(closed.status).toBe('completed')
    if (closed.status !== 'completed') return
    expect(closed.view).toEqual({ open: false, focus: null })
    expect(shared.view()).toEqual({ open: false, focus: null })
  })

  test('a disabled app, a missing item, and a mismatched caller do not focus', async () => {
    const shared = createMcpAppsHost()
    const hidden = await focusMcpAppFromAgent(shared, {
      ...read,
      invocationId: 'mcp-focus-hidden',
      actor: agent,
      pluginId: 'mcp:notes',
      itemKind: 'tool',
      itemId: 'hidden',
    })
    expect(hidden).toEqual({ status: 'failed', invocationId: 'mcp-focus-hidden', reason: 'not_in_loadout' })

    const missing = await focusMcpAppFromHuman(shared, {
      ...read,
      invocationId: 'mcp-focus-missing',
      actor: human,
      pluginId: 'mcp:docs',
      itemKind: 'tool',
      itemId: 'absent',
    })
    expect(missing.status).toBe('failed')
    if (missing.status === 'failed') expect(missing.reason).toBe('not_in_loadout')

    const mismatched = await openMcpAppsFromAgent(shared, {
      ...read,
      invocationId: 'mcp-open-mismatch',
      actor: human,
    })
    expect(mismatched.status).toBe('denied')
    expect(shared.view().open).toBe(false)
    expect(shared.kernel.snapshot().turns.every((turn) => turn.phase !== 'completed')).toBe(true)
  })

  test('stop before run leaves the pane closed and locked calls do not admit', async () => {
    const shared = createMcpAppsHost({
      beforeRun: (invocationId, kernel) => {
        kernel.stop(invocationId)
      },
    })
    const stopped = await openMcpAppsFromHuman(shared, {
      ...read,
      invocationId: 'mcp-open-stop',
      actor: human,
    })
    expect(stopped.status).toBe('interrupted')
    expect(shared.view().open).toBe(false)

    const turns = shared.kernel.snapshot().turns.length
    expect(lockedMcpAppsPhase('mcp_apps_sandbox').phase).toBe('mcp_apps_sandbox')
    expect(lockedMcpAppsPhase('tool_invocation').status).toBe('Locked')
    expect(lockedMcpAppsPhase('live_tool_list').status).toBe('Locked')
    expect(lockedMcpAppsPhase('remote_marketplace').status).toBe('Locked')
    expect(shared.kernel.snapshot().turns.length).toBe(turns)
  })

  test('a second open on the same host does not admit again', async () => {
    const shared = createMcpAppsHost()
    await openMcpAppsFromHuman(shared, { ...read, invocationId: 'mcp-open-once', actor: human })
    const again = await openMcpAppsFromAgent(shared, { ...read, invocationId: 'mcp-open-again', actor: agent })
    expect(again.status).toBe('completed')
    if (again.status !== 'completed') return
    expect(again.admitted).toBe(false)
    expect(shared.kernel.snapshot().turns.filter((turn) => turn.phase === 'completed')).toHaveLength(1)
  })

  test('close admits when the shell layout is already open', async () => {
    const shared = createMcpAppsHost()
    const closed = await closeMcpAppsFromHuman(shared, {
      ...read,
      invocationId: 'mcp-close-layout',
      actor: human,
      layout: { open: true, focus: null },
    })
    expect(closed.status).toBe('completed')
    if (closed.status !== 'completed') return
    expect(closed.admitted).toBe(true)
    expect(closed.view).toEqual({ open: false, focus: null })
    expect(shared.kernel.events('mcp-apps').some((event) => event.kind === 'action_invoked' && event.actionId === InternalActionId.CANVAS_NODE_SELECT)).toBe(true)
  })

  test('close from a fresh host reports the closed view without a turn', async () => {
    const shared = createMcpAppsHost()
    const closed = await closeMcpAppsFromHuman(shared, {
      ...read,
      invocationId: 'mcp-close-fresh',
      actor: human,
    })
    expect(closed.status).toBe('completed')
    if (closed.status !== 'completed') return
    expect(closed.admitted).toBe(false)
    expect(closed.view.open).toBe(false)
    expect(shared.kernel.snapshot().turns).toHaveLength(0)
  })
})
