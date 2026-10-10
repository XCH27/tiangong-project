/**
 * Shell caller for the MCP Apps side pane.
 *
 * The pane constructs one createMcpAppsHost and calls these helpers for
 * open, focus, and close. Each helper admits workbench.sidebar_focus as the
 * desktop human. That row is L0, so the turn does not wait for a card and
 * does not call approve. The caller applies the returned slot after the
 * helper resolves.
 *
 * Agent helpers stay off this path. The old sidebar verb is not sent.
 * This module does not capture a DOM snapshot, write a page target, or
 * mutate the plugin loadout.
 */

import { DESKTOP_APPROVER } from './host-approval-bridge'
import {
  closeMcpAppsFromHuman,
  focusMcpAppFromHuman,
  openMcpAppsFromHuman,
  type McpAppsCall,
  type McpAppsOpResult,
  type McpAppsShared,
} from './mcp-apps-host'
import {
  mcpAppsLayoutSlot,
  type McpAppFocus,
  type McpAppInventoryEntry,
  type McpAppsLayoutSlot,
  type McpAppsPaneView,
} from './mcp-apps-pane'
import type { PluginCatalogEntry, PluginLoadoutFile } from './plugin-settings'

export type McpAppsPaneGesture = 'open' | 'focus' | 'close'

export interface McpAppsShellRead {
  catalog: readonly PluginCatalogEntry[]
  loadout: PluginLoadoutFile
  inventory?: readonly McpAppInventoryEntry[]
}

const queues = new WeakMap<McpAppsShared, Promise<void>>()

function enqueue(shared: McpAppsShared, task: () => Promise<McpAppsOpResult>): Promise<McpAppsOpResult> {
  const previous = queues.get(shared) ?? Promise.resolve()
  const result = previous.then(task, task)
  queues.set(shared, result.then(() => undefined, () => undefined))
  return result
}

function call(read: McpAppsShellRead, layout?: McpAppsPaneView): McpAppsCall {
  return {
    invocationId: `mcp-apps-${crypto.randomUUID()}`,
    actor: DESKTOP_APPROVER,
    catalog: read.catalog,
    loadout: read.loadout,
    inventory: read.inventory,
    layout,
  }
}

export function runMcpAppsPaneOpen(shared: McpAppsShared, read: McpAppsShellRead): Promise<McpAppsOpResult> {
  return enqueue(shared, () => openMcpAppsFromHuman(shared, call(read)))
}

export function runMcpAppsPaneFocus(
  shared: McpAppsShared,
  read: McpAppsShellRead,
  focus: McpAppFocus,
): Promise<McpAppsOpResult> {
  return enqueue(shared, () => focusMcpAppFromHuman(shared, {
    ...call(read),
    pluginId: focus.pluginId,
    itemKind: focus.kind,
    itemId: focus.itemId,
  }))
}

export function runMcpAppsPaneClose(
  shared: McpAppsShared,
  read: McpAppsShellRead,
  layout?: McpAppsPaneView,
): Promise<McpAppsOpResult> {
  return enqueue(shared, () => closeMcpAppsFromHuman(shared, call(read, layout)))
}

/**
 * Slot to write after a gesture.
 * Open failure closes the slot. Focus failure keeps the last admitted view.
 * Close failure leaves the slot alone. A completed gesture uses the host view.
 */
export function sidebarSlotForGesture(
  gesture: McpAppsPaneGesture,
  result: McpAppsOpResult,
  admittedView: McpAppsPaneView,
): McpAppsLayoutSlot | null {
  switch (gesture) {
    case 'open':
      if (result.status !== 'completed') return { type: 'none' }
      return mcpAppsLayoutSlot(result.view)
    case 'focus':
      if (result.status !== 'completed') return mcpAppsLayoutSlot(admittedView)
      return mcpAppsLayoutSlot(result.view)
    case 'close':
      if (result.status !== 'completed') return null
      return mcpAppsLayoutSlot(result.view)
    default: {
      const unexpected: never = gesture
      return unexpected
    }
  }
}
