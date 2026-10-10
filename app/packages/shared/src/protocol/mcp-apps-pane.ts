/**
 * MCP Apps side pane projection.
 *
 * Claude Desktop and Cursor list an enabled MCP server's tools and resources,
 * then open the selected item in a side pane. This module does that read:
 * enabled MCP rows from the plugin loadout, joined with a local inventory the
 * caller already has. It does not call tools/list, it does not open a remote
 * registry, and it does not render a ui:// document.
 *
 * Open and focus are layout state on the existing right-sidebar slot. The
 * sandboxed app view, live tool listing, tool invocation, Agent Plugins
 * 1.0.0, and a remote marketplace stay Locked.
 */

import { containsCredentialMaterial } from './credential-boundary'
import { loadoutRecord, type PluginCatalogEntry, type PluginLoadoutFile } from './plugin-settings'

export const MCP_APPS_SESSION_ID = 'mcp-apps'
export const MCP_APPS_SIDEBAR = 'mcp-apps'

export const MCP_APPS_SURFACES = [
  { id: 'enabled_list', status: 'wired' },
  { id: 'open_focus', status: 'wired' },
  { id: 'sandboxed_app_view', status: 'Locked' },
  { id: 'tool_invocation', status: 'Locked' },
  { id: 'live_tool_list', status: 'Locked' },
  { id: 'mcp_registry_catalogs', status: 'Locked' },
  { id: 'agent_plugins_1_0_0', status: 'Locked' },
  { id: 'remote_marketplace', status: 'Locked' },
] as const

export type McpAppsSurface = (typeof MCP_APPS_SURFACES)[number]

export const MCP_APPS_LOCKED_PHASES = [
  'mcp_apps_sandbox',
  'tool_invocation',
  'live_tool_list',
  'mcp_registry_catalogs',
  'agent_plugins_1_0_0',
  'remote_marketplace',
] as const

export type McpAppsLockedPhase = (typeof MCP_APPS_LOCKED_PHASES)[number]

export type McpAppItemKind = 'tool' | 'resource'

export interface McpAppTool {
  name: string
  description: string
  uiResourceUri?: string
}

export interface McpAppResource {
  uri: string
  name: string
  description: string
}

export interface McpAppInventoryEntry {
  pluginId: string
  tools?: readonly McpAppTool[]
  resources?: readonly McpAppResource[]
}

export interface McpAppListing {
  pluginId: string
  name: string
  description: string
  tools: McpAppTool[]
  resources: McpAppResource[]
}

export interface McpAppFocus {
  pluginId: string
  kind: McpAppItemKind
  itemId: string
}

export interface McpAppsPaneView {
  open: boolean
  focus: McpAppFocus | null
}

export type McpAppsLayoutSlot =
  | { type: 'mcp-apps'; focus?: McpAppFocus }
  | { type: 'none' }

export function listMcpAppsSurfaces(): readonly McpAppsSurface[] {
  return MCP_APPS_SURFACES
}

export function lockedMcpAppsPhase(phase: McpAppsLockedPhase): { status: 'Locked'; phase: McpAppsLockedPhase } {
  switch (phase) {
    case 'mcp_apps_sandbox':
    case 'tool_invocation':
    case 'live_tool_list':
    case 'mcp_registry_catalogs':
    case 'agent_plugins_1_0_0':
    case 'remote_marketplace':
      return { status: 'Locked', phase }
    default: {
      const unexpected: never = phase
      return unexpected
    }
  }
}

export function emptyMcpAppsPane(): McpAppsPaneView {
  return { open: false, focus: null }
}

export function projectEnabledMcpApps(input: {
  catalog: readonly PluginCatalogEntry[]
  loadout: PluginLoadoutFile
  inventory?: readonly McpAppInventoryEntry[]
}): McpAppListing[] {
  if (input.loadout.version !== 1) return []
  const inventory = new Map<string, McpAppInventoryEntry>()
  for (const entry of input.inventory ?? []) {
    if (!inventory.has(entry.pluginId)) inventory.set(entry.pluginId, entry)
  }
  const listed: McpAppListing[] = []
  for (const entry of input.catalog) {
    if (entry.kind !== 'mcp') continue
    const record = loadoutRecord(input.loadout, entry.id)
    if (!record?.installed || !record.enabled) continue
    const declared = inventory.get(entry.id)
    listed.push({
      pluginId: entry.id,
      name: publicText(entry.name) || entry.id,
      description: publicText(entry.description),
      tools: sanitizeTools(declared?.tools ?? []),
      resources: sanitizeResources(declared?.resources ?? []),
    })
  }
  return listed
}

export function findMcpAppItem(listing: readonly McpAppListing[], focus: McpAppFocus): boolean {
  const app = listing.find((item) => item.pluginId === focus.pluginId)
  if (!app) return false
  switch (focus.kind) {
    case 'tool':
      return app.tools.some((tool) => tool.name === focus.itemId)
    case 'resource':
      return app.resources.some((resource) => resource.uri === focus.itemId)
    default: {
      const unexpected: never = focus.kind
      return unexpected
    }
  }
}

export function mcpAppsLayoutSlot(view: McpAppsPaneView): McpAppsLayoutSlot {
  if (!view.open) return { type: 'none' }
  return view.focus ? { type: 'mcp-apps', focus: view.focus } : { type: 'mcp-apps' }
}

export function buildMcpAppsSidebarParam(view: McpAppsPaneView): string | undefined {
  if (!view.open) return undefined
  if (!view.focus) return MCP_APPS_SIDEBAR
  return [
    MCP_APPS_SIDEBAR,
    encodeURIComponent(view.focus.pluginId),
    view.focus.kind,
    encodeURIComponent(view.focus.itemId),
  ].join(':')
}

export function parseMcpAppsSidebarParam(param: string): McpAppsPaneView | null {
  if (param === MCP_APPS_SIDEBAR) return { open: true, focus: null }
  if (!param.startsWith(`${MCP_APPS_SIDEBAR}:`)) return null
  const parts = param.slice(MCP_APPS_SIDEBAR.length + 1).split(':')
  if (parts.length !== 3) return null
  const encodedPlugin = parts[0]
  const kind = parts[1]
  const encodedItem = parts[2]
  if (!encodedPlugin || (kind !== 'tool' && kind !== 'resource') || !encodedItem) return null
  const pluginId = decodePart(encodedPlugin)
  const itemId = decodePart(encodedItem)
  if (!pluginId || !itemId) return null
  const focus: McpAppFocus = { pluginId, kind, itemId }
  if (!isFocusShape(focus)) return null
  return { open: true, focus }
}

function sanitizeTools(tools: readonly McpAppTool[]): McpAppTool[] {
  const seen = new Set<string>()
  const result: McpAppTool[] = []
  for (const tool of tools) {
    const name = tool.name.trim()
    if (!safeToolName(name) || seen.has(name)) continue
    if (containsCredentialMaterial(name) || containsCredentialMaterial(tool.description)) continue
    const ui = tool.uiResourceUri?.trim()
    if (ui && (containsCredentialMaterial(ui) || !ui.startsWith('ui://') || ui.includes('..'))) continue
    seen.add(name)
    const next: McpAppTool = { name, description: publicText(tool.description) }
    if (ui) next.uiResourceUri = ui
    result.push(next)
  }
  return result
}

function sanitizeResources(resources: readonly McpAppResource[]): McpAppResource[] {
  const seen = new Set<string>()
  const result: McpAppResource[] = []
  for (const resource of resources) {
    const uri = resource.uri.trim()
    if (!safeResourceUri(uri) || seen.has(uri)) continue
    if (containsCredentialMaterial(uri) || containsCredentialMaterial(resource.name) || containsCredentialMaterial(resource.description)) {
      continue
    }
    seen.add(uri)
    result.push({
      uri,
      name: publicText(resource.name) || uri,
      description: publicText(resource.description),
    })
  }
  return result
}

function isFocusShape(focus: McpAppFocus): boolean {
  if (!/^mcp:[A-Za-z0-9._-]+$/.test(focus.pluginId)) return false
  switch (focus.kind) {
    case 'tool':
      return safeToolName(focus.itemId)
    case 'resource':
      return safeResourceUri(focus.itemId)
    default: {
      const unexpected: never = focus.kind
      return unexpected
    }
  }
}

function safeToolName(value: string): boolean {
  return value.length > 0
    && !value.includes('..')
    && !value.includes('/')
    && !value.includes('\\')
    && !value.includes('\0')
    && !value.includes(':')
}

function safeResourceUri(value: string): boolean {
  if (!value || value.includes('\0') || value.includes('..')) return false
  return value.startsWith('ui://') || value.startsWith('https://') || value.startsWith('file://')
}

function publicText(value: string): string {
  const trimmed = value.trim()
  return containsCredentialMaterial(trimmed) ? '' : trimmed
}

function decodePart(value: string): string | null {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}
