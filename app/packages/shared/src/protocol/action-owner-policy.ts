/**
 * Owner check for a frozen action id.
 *
 * docs/contracts/action-ids.md stays at v1.2.0. This module does not add ids.
 * file.* is M05 file bytes. canvas.* is M07 canvas. session.* is M00 session
 * state. A payload that is a plugin loadout, an MCP Apps sidebar focus, a DOM
 * evidence snapshot, or a page-target write is a different operation. Admission
 * refuses it. Approval stays on the frozen row: there is no side channel that
 * upgrades an L1 id to approval-required.
 */

import type { ActionTargetRef } from './internal-action'

export const ACTION_OWNER_MISMATCH_REASONS = [
  'action_owner_mismatch:plugin_loadout',
  'action_owner_mismatch:sidebar_focus',
  'action_owner_mismatch:dom_evidence',
  'action_owner_mismatch:page_target',
] as const

export type ActionOwnerMismatchReason = (typeof ACTION_OWNER_MISMATCH_REASONS)[number]

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
  payload: Record<string, unknown> | undefined,
  targets: readonly ActionTargetRef[] | undefined,
): ActionOwnerMismatchReason | undefined {
  const body = payload ?? {}
  const refs = targets ?? []
  if (isPluginLoadout(body)) return 'action_owner_mismatch:plugin_loadout'
  if (isSidebarFocus(body, refs)) return 'action_owner_mismatch:sidebar_focus'
  if (isDomEvidence(body, refs)) return 'action_owner_mismatch:dom_evidence'
  if (isPageTarget(body)) return 'action_owner_mismatch:page_target'
  return undefined
}
