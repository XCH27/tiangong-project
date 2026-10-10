import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
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
  runMcpAppsPaneClose,
  runMcpAppsPaneFocus,
  runMcpAppsPaneOpen,
  sidebarSlotForGesture,
} from '../mcp-apps-shell'
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
  test('the shell pane constructs one host and admits open, focus, and close', () => {
    const pane = readFileSync(new URL('../../../../../apps/electron/src/renderer/components/right-sidebar/McpAppsSidePane.tsx', import.meta.url), 'utf8')
    const settings = readFileSync(new URL('../../../../../apps/electron/src/renderer/pages/settings/PluginsSettingsPage.tsx', import.meta.url), 'utf8')
    const shell = readFileSync(new URL('../mcp-apps-shell.ts', import.meta.url), 'utf8')
    const popover = readFileSync(new URL('../../../../../apps/electron/src/renderer/components/ui/EditPopover.tsx', import.meta.url), 'utf8')
    const browser = readFileSync(new URL('../../../../../apps/electron/src/main/browser-pane-manager.ts', import.meta.url), 'utf8')
    expect(pane.includes('createMcpAppsHost()')).toBe(true)
    expect(pane.includes('runMcpAppsPaneOpen')).toBe(true)
    expect(pane.includes('runMcpAppsPaneFocus')).toBe(true)
    expect(pane.includes('runMcpAppsPaneClose')).toBe(true)
    expect(pane.includes('sidebarSlotForGesture')).toBe(true)
    expect(pane.includes('HostTurnKernel')).toBe(false)
    expect(pane.includes('canvas.node_select')).toBe(false)
    expect(pane.includes('openMcpAppsFromAgent')).toBe(false)
    expect(shell.includes('createMcpAppsHost(')).toBe(false)
    expect(shell.includes('openMcpAppsFromHuman')).toBe(true)
    expect(shell.includes('focusMcpAppFromHuman')).toBe(true)
    expect(shell.includes('closeMcpAppsFromHuman')).toBe(true)
    expect(shell.includes('openMcpAppsFromAgent')).toBe(false)
    expect(shell.includes('canvas.node_select')).toBe(false)
    expect(shell.includes('DESKTOP_APPROVER')).toBe(true)
    expect(settings.includes('createMcpAppsHost')).toBe(false)
    expect(settings.includes('createMcpAppsShell')).toBe(false)
    expect(settings.includes('runMcpAppsPaneOpen')).toBe(false)
    expect(settings.includes('openMcpAppsFromHuman')).toBe(false)
    expect(settings.includes('workbench.sidebar_focus')).toBe(false)
    expect(settings.includes('createPluginSettingsHost()')).toBe(false)
    expect(popover.includes('runMcpAppsPaneOpen')).toBe(false)
    expect(popover.includes('applyEditPageFromHuman')).toBe(false)
    expect(browser.includes('runMcpAppsPaneOpen')).toBe(false)
    expect(browser.includes('createMcpAppsHost')).toBe(false)
  })

  test('the pane host admits workbench.sidebar_focus for open, focus, and close with no card', async () => {
    const shared = createMcpAppsHost()
    const opened = await runMcpAppsPaneOpen(shared, read)
    expect(opened).toMatchObject({ status: 'completed', admitted: true, view: { open: true, focus: null } })
    expect(sidebarSlotForGesture('open', opened, shared.view())).toEqual({ type: 'mcp-apps' })

    const focused = await runMcpAppsPaneFocus(shared, read, {
      pluginId: 'mcp:docs',
      kind: 'tool',
      itemId: 'search',
    })
    expect(focused).toMatchObject({
      status: 'completed',
      admitted: true,
      view: { open: true, focus: { pluginId: 'mcp:docs', kind: 'tool', itemId: 'search' } },
    })
    expect(sidebarSlotForGesture('focus', focused, shared.view())).toEqual({
      type: 'mcp-apps',
      focus: { pluginId: 'mcp:docs', kind: 'tool', itemId: 'search' },
    })

    const closed = await runMcpAppsPaneClose(shared, read)
    expect(closed).toMatchObject({ status: 'completed', admitted: true, view: { open: false, focus: null } })
    expect(sidebarSlotForGesture('close', closed, shared.view())).toEqual({ type: 'none' })

    const turns = shared.kernel.snapshot().turns
    expect(turns.map((turn) => turn.request.invocation.actionId)).toEqual([
      InternalActionId.WORKBENCH_SIDEBAR_FOCUS,
      InternalActionId.WORKBENCH_SIDEBAR_FOCUS,
      InternalActionId.WORKBENCH_SIDEBAR_FOCUS,
    ])
    expect(turns.every((turn) => turn.phase === 'completed')).toBe(true)
    expect(turns.every((turn) => turn.request.actor.kind === 'human' && turn.request.actor.id === 'desktop-user')).toBe(true)
    const events = shared.kernel.events('mcp-apps')
    expect(events.every((event) => event.actionId === InternalActionId.WORKBENCH_SIDEBAR_FOCUS)).toBe(true)
    expect(events.some((event) => event.actionId === InternalActionId.CANVAS_NODE_SELECT)).toBe(false)
    expect(events.some((event) => event.kind === 'supervision_requested')).toBe(false)
    expect(events.some((event) => event.kind === 'action_completed')).toBe(true)
  })

  test('a refused focus keeps the admitted slot and canvas.node_select stays refused', async () => {
    const shared = createMcpAppsHost()
    await runMcpAppsPaneOpen(shared, read)
    const missing = await runMcpAppsPaneFocus(shared, read, {
      pluginId: 'mcp:docs',
      kind: 'tool',
      itemId: 'absent',
    })
    expect(missing.status).toBe('failed')
    expect(shared.view()).toEqual({ open: true, focus: null })
    expect(sidebarSlotForGesture('focus', missing, shared.view())).toEqual({ type: 'mcp-apps' })
    expect(sidebarSlotForGesture('open', { status: 'denied', invocationId: 'x', reason: 'denied' }, shared.view())).toEqual({ type: 'none' })
    expect(sidebarSlotForGesture('close', { status: 'failed', invocationId: 'y', reason: 'failed' }, shared.view())).toBeNull()

    expect(shared.kernel.admit({
      invocation: {
        invocationId: 'pane-old-verb',
        actionId: InternalActionId.CANVAS_NODE_SELECT,
        payload: { surface: 'mcp_apps', op: 'open' },
        targets: [{ kind: 'unknown', id: 'mcp-apps', label: 'mcp-apps' }],
        callerKind: 'human_ui',
        sessionId: 'mcp-apps',
        createdAt: '2026-10-10T00:00:00.000Z',
      },
      actor: human,
    })).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:sidebar_focus' })
    expect(shared.view()).toEqual({ open: true, focus: null })
    expect(shared.kernel.events('mcp-apps').some((event) => event.kind === 'supervision_requested')).toBe(false)
  })

  test('close waits for an in-flight open and then admits the close', async () => {
    const shared = createMcpAppsHost()
    const opened = runMcpAppsPaneOpen(shared, read)
    const closed = runMcpAppsPaneClose(shared, read)
    const [openResult, closeResult] = await Promise.all([opened, closed])
    expect(openResult).toMatchObject({ status: 'completed', admitted: true })
    expect(closeResult).toMatchObject({ status: 'completed', admitted: true, view: { open: false, focus: null } })
    expect(shared.view()).toEqual({ open: false, focus: null })
    expect(shared.kernel.snapshot().turns.filter((turn) => turn.phase === 'completed')).toHaveLength(2)
    expect(shared.kernel.snapshot().turns.every((turn) => turn.request.invocation.actionId === InternalActionId.WORKBENCH_SIDEBAR_FOCUS)).toBe(true)
  })

  test('human and agent open and focus admit workbench.sidebar_focus with no card', async () => {
    const shared = createMcpAppsHost()
    const opened = await openMcpAppsFromHuman(shared, {
      ...read,
      invocationId: 'mcp-open-human',
      actor: human,
    })
    expect(opened).toMatchObject({
      status: 'completed',
      admitted: true,
      view: { open: true, focus: null },
    })
    expect(shared.view()).toEqual({ open: true, focus: null })
    expect(mcpAppsLayoutSlot(shared.view())).toEqual({ type: 'mcp-apps' })

    const focused = await focusMcpAppFromAgent(shared, {
      ...read,
      invocationId: 'mcp-focus-agent',
      actor: agent,
      pluginId: 'mcp:docs',
      itemKind: 'tool',
      itemId: 'search',
    })
    expect(focused).toMatchObject({
      status: 'completed',
      admitted: true,
      view: { open: true, focus: { pluginId: 'mcp:docs', kind: 'tool', itemId: 'search' } },
    })
    expect(mcpAppsLayoutSlot(shared.view())).toEqual({
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
    expect(resource).toMatchObject({
      status: 'completed',
      admitted: true,
      view: { open: true, focus: { pluginId: 'mcp:docs', kind: 'resource', itemId: 'ui://docs/search' } },
    })

    const closed = await closeMcpAppsFromAgent(shared, {
      ...read,
      invocationId: 'mcp-close-agent',
      actor: agent,
    })
    expect(closed).toMatchObject({ status: 'completed', admitted: true, view: { open: false, focus: null } })
    expect(shared.view()).toEqual({ open: false, focus: null })

    const turns = shared.kernel.snapshot().turns
    expect(turns.map((turn) => turn.request.invocation.actionId)).toEqual([
      InternalActionId.WORKBENCH_SIDEBAR_FOCUS,
      InternalActionId.WORKBENCH_SIDEBAR_FOCUS,
      InternalActionId.WORKBENCH_SIDEBAR_FOCUS,
      InternalActionId.WORKBENCH_SIDEBAR_FOCUS,
    ])
    expect(turns.every((turn) => turn.phase === 'completed')).toBe(true)
    expect(turns.some((turn) => turn.phase === 'awaiting_approval')).toBe(false)
    const events = shared.kernel.events('mcp-apps')
    expect(events.every((event) => event.actionId === InternalActionId.WORKBENCH_SIDEBAR_FOCUS)).toBe(true)
    expect(events.some((event) => event.actionId === InternalActionId.CANVAS_NODE_SELECT)).toBe(false)
    expect(events.some((event) => event.actionId === InternalActionId.FILE_UPDATE)).toBe(false)
    expect(events.some((event) => event.kind === 'action_completed')).toBe(true)
    expect(events.some((event) => event.kind === 'supervision_requested')).toBe(false)
  })

  test('the same sidebar payload on canvas.node_select is still refused', () => {
    const shared = createMcpAppsHost()
    expect(shared.kernel.admit({
      invocation: {
        invocationId: 'old-verb-focus',
        actionId: InternalActionId.CANVAS_NODE_SELECT,
        payload: {
          surface: 'mcp_apps',
          op: 'focus',
          pluginId: 'mcp:docs',
          itemKind: 'tool',
          itemId: 'search',
        },
        targets: [{ kind: 'unknown', id: 'mcp:docs:tool:search', label: 'mcp-apps' }],
        callerKind: 'agent',
        sessionId: 'mcp-apps',
        createdAt: '2026-10-10T00:00:00.000Z',
      },
      actor: agent,
    })).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:sidebar_focus' })

    const slot = shared.kernel.admit({
      invocation: {
        invocationId: 'old-verb-slot',
        actionId: InternalActionId.CANVAS_NODE_SELECT,
        payload: { op: 'open' },
        targets: [{ kind: 'unknown', id: 'mcp-apps', label: 'mcp-apps' }],
        callerKind: 'human_ui',
        sessionId: 'mcp-apps',
        createdAt: '2026-10-10T00:00:00.000Z',
      },
      actor: human,
    })
    expect(slot).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:sidebar_focus' })
    expect(shared.view()).toEqual({ open: false, focus: null })
    expect(shared.kernel.snapshot().turns.every((turn) => turn.phase === 'denied')).toBe(true)
    expect(shared.kernel.events('mcp-apps').some((event) => event.kind === 'action_completed')).toBe(false)
    expect(shared.kernel.events('mcp-apps').some((event) => event.kind === 'supervision_requested')).toBe(false)
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
    expect(stopped).toMatchObject({ status: 'interrupted', reason: 'interrupted' })
    expect(shared.view().open).toBe(false)
    expect(shared.kernel.events('mcp-apps').some((event) => event.kind === 'action_completed')).toBe(false)
    expect(shared.kernel.events('mcp-apps').some((event) => event.kind === 'supervision_requested')).toBe(false)

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
    expect(again).toMatchObject({ status: 'completed', admitted: false, view: { open: true, focus: null } })
    expect(shared.view().open).toBe(true)
    expect(shared.kernel.snapshot().turns.filter((turn) => turn.phase === 'completed')).toHaveLength(1)
    expect(shared.kernel.snapshot().turns.every((turn) => turn.request.invocation.actionId === InternalActionId.WORKBENCH_SIDEBAR_FOCUS)).toBe(true)
  })

  test('close of an open layout admits workbench.sidebar_focus and closes the slot', async () => {
    const shared = createMcpAppsHost()
    const closed = await closeMcpAppsFromHuman(shared, {
      ...read,
      invocationId: 'mcp-close-layout',
      actor: human,
      layout: { open: true, focus: null },
    })
    expect(closed).toMatchObject({ status: 'completed', admitted: true, view: { open: false, focus: null } })
    expect(shared.view()).toEqual({ open: false, focus: null })
    expect(shared.kernel.events('mcp-apps').some((event) => event.kind === 'action_invoked' && event.actionId === InternalActionId.WORKBENCH_SIDEBAR_FOCUS)).toBe(true)
    expect(shared.kernel.events('mcp-apps').some((event) => event.kind === 'action_completed' && event.actionId === InternalActionId.WORKBENCH_SIDEBAR_FOCUS)).toBe(true)
    expect(shared.kernel.events('mcp-apps').some((event) => event.actionId === InternalActionId.CANVAS_NODE_SELECT)).toBe(false)
    expect(shared.kernel.events('mcp-apps').some((event) => event.kind === 'supervision_requested')).toBe(false)
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
