/**
 * MCP Apps side pane admission.
 *
 * Open, focus, and close ask for canvas.node_select. That id is M07 canvas
 * selection. A sidebar slot is not a canvas node, so HostTurnKernel refuses
 * the turn and the pane does not change. workbench.view_open is not frozen.
 * This host does not add an action id. It does not write a canvas document,
 * a session file, or the plugin loadout.
 *
 * A human control and an agent caller share one function. Sandboxed ui://
 * rendering and tool invocation stay Locked and do not admit a turn.
 */

import type { ActorRef } from './actor'
import { InternalActionId, type ActionInvocation } from './internal-action'
import { NativeEffectRegistry } from './native-effect-executor'
import {
  emptyMcpAppsPane,
  findMcpAppItem,
  MCP_APPS_SESSION_ID,
  projectEnabledMcpApps,
  type McpAppFocus,
  type McpAppInventoryEntry,
  type McpAppItemKind,
  type McpAppsPaneView,
} from './mcp-apps-pane'
import type { PluginCatalogEntry, PluginLoadoutFile } from './plugin-settings'
import { HostTurnKernel, MemoryTurnJournal, type TurnOutcome } from './turn-admission'

export interface McpAppsShared {
  kernel: HostTurnKernel
  effects: NativeEffectRegistry
  view(): McpAppsPaneView
}

export interface McpAppsCall {
  invocationId: string
  sessionId?: string
  actor: ActorRef
  catalog: readonly PluginCatalogEntry[]
  loadout: PluginLoadoutFile
  inventory?: readonly McpAppInventoryEntry[]
  pluginId?: string
  itemKind?: McpAppItemKind
  itemId?: string
  layout?: McpAppsPaneView
}

export type McpAppsOpResult =
  | { status: 'completed'; invocationId: string; view: McpAppsPaneView; admitted: boolean }
  | { status: Exclude<TurnOutcome['status'], 'completed'>; invocationId: string; reason?: string }
  | { status: 'failed'; invocationId: string; reason: string }

interface McpAppsHostOptions {
  beforeRun?: (invocationId: string, kernel: HostTurnKernel) => void
}

interface PaneMemory {
  view: McpAppsPaneView
  listing: ReturnType<typeof projectEnabledMcpApps>
}

const memories = new WeakMap<McpAppsShared, PaneMemory>()
const beforeRuns = new WeakMap<McpAppsShared, McpAppsHostOptions['beforeRun']>()

export function createMcpAppsHost(options: McpAppsHostOptions = {}): McpAppsShared {
  const memory: PaneMemory = { view: emptyMcpAppsPane(), listing: [] }
  const effects = new NativeEffectRegistry()
  effects.register(InternalActionId.CANVAS_NODE_SELECT, async (request) => {
    if (request.signal.aborted) throw abortError()
    const next = applyPanePayload(memory.view, memory.listing, request.payload)
    if (!next) throw new Error('mcp_apps_focus_rejected')
    memory.view = next
    return { output: { surface: 'mcp_apps', open: next.open, focus: next.focus } }
  })
  const kernel = new HostTurnKernel(new MemoryTurnJournal(), { nativeEffects: effects })
  const shared = {
    kernel,
    effects,
    view: () => memory.view,
  }
  memories.set(shared, memory)
  beforeRuns.set(shared, options.beforeRun)
  return shared
}

export function openMcpAppsFromHuman(shared: McpAppsShared, input: McpAppsCall): Promise<McpAppsOpResult> {
  return executeMcpAppsOp(shared, { ...input, callerKind: 'human_ui', op: 'open' })
}

export function openMcpAppsFromAgent(shared: McpAppsShared, input: McpAppsCall): Promise<McpAppsOpResult> {
  return executeMcpAppsOp(shared, { ...input, callerKind: 'agent', op: 'open' })
}

export function focusMcpAppFromHuman(shared: McpAppsShared, input: McpAppsCall): Promise<McpAppsOpResult> {
  return executeMcpAppsOp(shared, { ...input, callerKind: 'human_ui', op: 'focus' })
}

export function focusMcpAppFromAgent(shared: McpAppsShared, input: McpAppsCall): Promise<McpAppsOpResult> {
  return executeMcpAppsOp(shared, { ...input, callerKind: 'agent', op: 'focus' })
}

export function closeMcpAppsFromHuman(shared: McpAppsShared, input: McpAppsCall): Promise<McpAppsOpResult> {
  return executeMcpAppsOp(shared, { ...input, callerKind: 'human_ui', op: 'close' })
}

export function closeMcpAppsFromAgent(shared: McpAppsShared, input: McpAppsCall): Promise<McpAppsOpResult> {
  return executeMcpAppsOp(shared, { ...input, callerKind: 'agent', op: 'close' })
}

export async function executeMcpAppsOp(
  shared: McpAppsShared,
  input: McpAppsCall & { callerKind: 'human_ui' | 'agent'; op: 'open' | 'focus' | 'close' },
): Promise<McpAppsOpResult> {
  const memory = memories.get(shared)
  if (!memory) return failed(input.invocationId, 'mcp_apps_host_missing')
  if (!input.invocationId.trim()) return failed(input.invocationId, 'malformed_invocation')
  if (input.layout) memory.view = input.layout
  const listing = projectEnabledMcpApps(input)
  memory.listing = listing
  const planned = planPaneOp(memory.view, listing, input)
  switch (planned.status) {
    case 'failed':
      return failed(input.invocationId, planned.reason)
    case 'unchanged':
      return { status: 'completed', invocationId: input.invocationId, view: memory.view, admitted: false }
    case 'change':
      break
    default: {
      const unexpected: never = planned
      return failed(input.invocationId, `unknown_mcp_apps_plan:${String(unexpected)}`)
    }
  }

  const sessionId = input.sessionId ?? MCP_APPS_SESSION_ID
  const invocation: ActionInvocation = {
    invocationId: input.invocationId,
    actionId: InternalActionId.CANVAS_NODE_SELECT,
    payload: planned.payload,
    targets: [{ kind: 'unknown', id: planned.targetId, label: 'mcp-apps' }],
    callerKind: input.callerKind,
    sessionId,
    createdAt: '2026-10-10T00:00:00.000Z',
  }
  const admitted = shared.kernel.admit({ invocation, actor: input.actor })
  if (admitted.status === 'completed') {
    return { status: 'completed', invocationId: input.invocationId, view: memory.view, admitted: false }
  }
  if (admitted.status !== 'admitted') return turnResult(admitted)
  beforeRuns.get(shared)?.(input.invocationId, shared.kernel)
  const stopped = shared.kernel.snapshot().turns.find((turn) => turn.request.invocation.invocationId === input.invocationId)
  if (stopped && stopped.phase !== 'admitted') return turnResult(outcomeFromPhase(input.invocationId, stopped.phase, stopped.reason))
  const ran = await shared.kernel.run(input.invocationId)
  if (ran.status !== 'completed') return turnResult(ran)
  return { status: 'completed', invocationId: input.invocationId, view: memory.view, admitted: true }
}

type PanePlan =
  | { status: 'unchanged' }
  | { status: 'failed'; reason: string }
  | { status: 'change'; payload: Record<string, unknown>; targetId: string }

function planPaneOp(
  view: McpAppsPaneView,
  listing: ReturnType<typeof projectEnabledMcpApps>,
  input: McpAppsCall & { op: 'open' | 'focus' | 'close' },
): PanePlan {
  switch (input.op) {
    case 'open': {
      const focus = focusStillListed(view.focus, listing) ? view.focus : null
      if (view.open && sameOptionalFocus(view.focus, focus)) return { status: 'unchanged' }
      return { status: 'change', payload: { surface: 'mcp_apps', op: 'open' }, targetId: 'mcp-apps' }
    }
    case 'close':
      if (!view.open && view.focus === null) return { status: 'unchanged' }
      return { status: 'change', payload: { surface: 'mcp_apps', op: 'close' }, targetId: 'mcp-apps' }
    case 'focus': {
      const focus = focusFromCall(input)
      if (!focus) return { status: 'failed', reason: 'malformed_focus' }
      if (!findMcpAppItem(listing, focus)) return { status: 'failed', reason: 'not_in_loadout' }
      if (view.open && sameFocus(view.focus, focus)) return { status: 'unchanged' }
      return {
        status: 'change',
        payload: { surface: 'mcp_apps', op: 'focus', pluginId: focus.pluginId, itemKind: focus.kind, itemId: focus.itemId },
        targetId: `${focus.pluginId}:${focus.kind}:${focus.itemId}`,
      }
    }
    default: {
      const unexpected: never = input.op
      return { status: 'failed', reason: `unknown_mcp_apps_op:${String(unexpected)}` }
    }
  }
}

function applyPanePayload(
  view: McpAppsPaneView,
  listing: ReturnType<typeof projectEnabledMcpApps>,
  payload: Record<string, unknown>,
): McpAppsPaneView | null {
  if (payload.surface !== 'mcp_apps') return null
  switch (payload.op) {
    case 'open':
      return { open: true, focus: focusStillListed(view.focus, listing) ? view.focus : null }
    case 'close':
      return emptyMcpAppsPane()
    case 'focus': {
      const focus = focusFromPayload(payload)
      if (!focus || !findMcpAppItem(listing, focus)) return null
      return { open: true, focus }
    }
    default:
      return null
  }
}

function focusFromCall(input: McpAppsCall): McpAppFocus | null {
  if (input.itemKind !== 'tool' && input.itemKind !== 'resource') return null
  if (!input.pluginId || !input.itemId) return null
  return { pluginId: input.pluginId, kind: input.itemKind, itemId: input.itemId }
}

function focusFromPayload(payload: Record<string, unknown>): McpAppFocus | null {
  if ((payload.itemKind !== 'tool' && payload.itemKind !== 'resource') || typeof payload.pluginId !== 'string' || typeof payload.itemId !== 'string') {
    return null
  }
  return { pluginId: payload.pluginId, kind: payload.itemKind, itemId: payload.itemId }
}

function focusStillListed(focus: McpAppFocus | null, listing: ReturnType<typeof projectEnabledMcpApps>): focus is McpAppFocus {
  return focus !== null && findMcpAppItem(listing, focus)
}

function sameFocus(current: McpAppFocus | null, next: McpAppFocus): boolean {
  return current?.pluginId === next.pluginId && current.kind === next.kind && current.itemId === next.itemId
}

function sameOptionalFocus(current: McpAppFocus | null, next: McpAppFocus | null): boolean {
  if (!current || !next) return current === next
  return sameFocus(current, next)
}

function outcomeFromPhase(invocationId: string, phase: string, reason?: string): TurnOutcome {
  switch (phase) {
    case 'interrupted':
      return { status: 'interrupted', invocationId, reason: reason ?? 'interrupted' }
    case 'denied':
      return { status: 'denied', invocationId, reason }
    case 'failed':
      return { status: 'failed', invocationId, reason }
    case 'awaiting_approval':
      return { status: 'approval_required', invocationId, reason }
    case 'reconciling':
      return { status: 'reconciling', invocationId, reason }
    default:
      return { status: 'failed', invocationId, reason: reason ?? 'not_admitted' }
  }
}

function turnResult(outcome: TurnOutcome): McpAppsOpResult {
  switch (outcome.status) {
    case 'completed':
      return failed(outcome.invocationId, outcome.reason ?? 'unexpected_completed')
    case 'admitted':
    case 'approval_required':
    case 'denied':
    case 'failed':
    case 'interrupted':
    case 'reconciling':
      return { status: outcome.status, invocationId: outcome.invocationId, reason: outcome.reason }
    default: {
      const unexpected: never = outcome.status
      return failed(outcome.invocationId, `unknown_turn_status:${String(unexpected)}`)
    }
  }
}

function failed(invocationId: string, reason: string): McpAppsOpResult {
  return { status: 'failed', invocationId, reason }
}

function abortError(): Error {
  const error = new Error('aborted')
  error.name = 'AbortError'
  return error
}
