/**
 * Owner check beside the frozen v1.3.0 ids.
 *
 * plugin.loadout_mutate, browser.dom_snapshot, workbench.sidebar_focus, and
 * file.page_target own those operations. The same payload on any other id,
 * including file.update, file.create, and canvas.node_select, is still refused.
 * op "grant" is not a loadout mutation. There is no standing grant.
 * Approval stays on the frozen row. This check does not upgrade an L1 id.
 */

import type { ActionTargetRef } from './internal-action'
import { InternalActionId } from './internal-action'

export const ACTION_OWNER_MISMATCH_REASONS = [
  'action_owner_mismatch:plugin_loadout',
  'action_owner_mismatch:sidebar_focus',
  'action_owner_mismatch:dom_evidence',
  'action_owner_mismatch:page_target',
] as const

export type ActionOwnerMismatchReason = (typeof ACTION_OWNER_MISMATCH_REASONS)[number]

export const STANDING_GRANT_REJECTED = 'standing_grant_rejected'

export type ActionOwnerRefusal = ActionOwnerMismatchReason | typeof STANDING_GRANT_REJECTED

const PLUGIN_LOADOUT_OPS = ['install', 'enable', 'disable', 'grant'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isPluginLoadoutOp(value: unknown): boolean {
  return typeof value === 'string' && (PLUGIN_LOADOUT_OPS as readonly string[]).includes(value)
}

function isPluginLoadoutDocument(value: unknown): boolean {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.records)) return false
  return value.records.every((record) => {
    if (!isRecord(record)) return false
    return typeof record.id === 'string' && typeof record.installed === 'boolean' && typeof record.enabled === 'boolean'
  })
}

function isPluginLoadout(payload: Record<string, unknown>): boolean {
  const pluginId = typeof payload.pluginId === 'string' && payload.pluginId.trim().length > 0
  if (isPluginLoadoutOp(payload.op) && pluginId) return true
  if (isPluginLoadoutDocument(payload.nextDocument) && (pluginId || isPluginLoadoutOp(payload.op))) return true
  return false
}

function isSidebarFocus(payload: Record<string, unknown>, targets: readonly ActionTargetRef[]): boolean {
  if (payload.surface === 'mcp_apps') return true
  return targets.some((target) => target.id === 'mcp-apps' || target.label === 'mcp-apps')
}

function isDomEvidence(payload: Record<string, unknown>, targets: readonly ActionTargetRef[]): boolean {
  if (payload.captureKind === 'dom_snapshot' || payload.kind === 'dom_snapshot') return true
  return targets.some((target) => target.label === 'dom_snapshot')
}

function isPageTarget(payload: Record<string, unknown>): boolean {
  return typeof payload.editKey === 'string' && payload.editKey.trim().length > 0
}

export function isActionOwnerMismatch(reason: string | undefined): reason is ActionOwnerMismatchReason {
  return (ACTION_OWNER_MISMATCH_REASONS as readonly string[]).includes(reason ?? '')
}

/**
 * Typed refusal for a payload whose meaning is not the frozen id's owner.
 * Undefined means this check does not refuse the turn.
 */
export function actionOwnerMismatchReason(
  actionId: string,
  payload: Record<string, unknown> | undefined,
  targets: readonly ActionTargetRef[] | undefined,
): ActionOwnerRefusal | undefined {
  const body = payload ?? {}
  const refs = targets ?? []
  if (isPluginLoadout(body)) {
    if (actionId === InternalActionId.PLUGIN_LOADOUT_MUTATE) {
      return body.op === 'grant' ? STANDING_GRANT_REJECTED : undefined
    }
    return 'action_owner_mismatch:plugin_loadout'
  }
  if (isSidebarFocus(body, refs)) {
    return actionId === InternalActionId.WORKBENCH_SIDEBAR_FOCUS
      ? undefined
      : 'action_owner_mismatch:sidebar_focus'
  }
  if (isDomEvidence(body, refs)) {
    return actionId === InternalActionId.BROWSER_DOM_SNAPSHOT
      ? undefined
      : 'action_owner_mismatch:dom_evidence'
  }
  if (isPageTarget(body)) {
    return actionId === InternalActionId.FILE_PAGE_TARGET
      ? undefined
      : 'action_owner_mismatch:page_target'
  }
  return undefined
}
