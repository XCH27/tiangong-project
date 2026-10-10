/**
 * Plugin loadout writes.
 *
 * Install, enable, and disable admit file.update on HostTurnKernel and write
 * `.claude-plugin/loadout.json` with the same atomic replace as session.jsonl.
 * A human control and an agent caller share executePluginMutation. Installing
 * does not enable. Enabling a third-party hook or MCP server waits on the
 * existing permission card. An agent cannot approve that card. Denial does not
 * enable the plugin. The grant decision is stored on the loadout.
 */

import { readFileSync } from 'node:fs'
import type { ActorRef } from './actor'
import { containsCredentialMaterial } from './credential-boundary'
import { InternalActionId, type ActionInvocation } from './internal-action'
import {
  applyCraftPermissionDecision,
  craftCardForAwaitingTurn,
  invocationIdFromHostRequest,
  type CraftPermissionDecision,
  type HostPermissionCard,
} from './host-approval-bridge'
import { applyAtomicJsonEffect, NativeEffectRegistry } from './native-effect-executor'
import {
  emptyPluginLoadout,
  isPluginLoadoutFile,
  planPluginMutation,
  PLUGIN_SETTINGS_SESSION_ID,
  withPluginGrant,
  type LockedPluginPhase,
  type PluginCatalogEntry,
  type PluginLoadoutFile,
  type PluginMutationName,
} from './plugin-settings'
import { HostTurnKernel, MemoryTurnJournal, type TurnOutcome } from './turn-admission'

export { DESKTOP_APPROVER } from './host-approval-bridge'
export type { HostPermissionCard } from './host-approval-bridge'

export interface PluginSettingsShared {
  kernel: HostTurnKernel
  effects: NativeEffectRegistry
}

export interface PluginMutationCall {
  op: PluginMutationName
  pluginId: string
  invocationId: string
  sessionId?: string
  actor: ActorRef
  filePath: string
  catalog: readonly PluginCatalogEntry[]
}

export type PluginMutationResult =
  | { status: 'completed'; invocationId: string; loadout: PluginLoadoutFile; persisted: boolean }
  | { status: 'Locked'; phase: LockedPluginPhase; invocationId: string }
  | { status: Exclude<TurnOutcome['status'], 'completed'>; invocationId: string; reason?: string }

export type PluginLoadoutRead =
  | { status: 'ok'; loadout: PluginLoadoutFile }
  | { status: 'missing'; loadout: PluginLoadoutFile }
  | { status: 'failed'; reason: string }

export function createPluginSettingsHost(): PluginSettingsShared {
  const effects = new NativeEffectRegistry()
  effects.register(InternalActionId.FILE_UPDATE, async (request) => {
    const filePath = typeof request.payload.filePath === 'string' ? request.payload.filePath : ''
    const applied = await applyAtomicJsonEffect({
      filePath,
      next: request.payload.nextDocument,
      signal: request.signal,
      commit: request.commit,
    })
    return {
      output: { filePath, actionId: InternalActionId.FILE_UPDATE },
      undoHandle: {
        undoId: `undo-${request.sessionId}`,
        label: 'Restore previous plugin loadout',
        snapshot: applied.previous,
      },
    }
  })
  const kernel = new HostTurnKernel(new MemoryTurnJournal(), { nativeEffects: effects })
  return { kernel, effects }
}

export function applyPluginMutationFromHuman(
  shared: PluginSettingsShared,
  input: PluginMutationCall,
): Promise<PluginMutationResult> {
  return executePluginMutation(shared, { ...input, callerKind: 'human_ui' })
}

export function applyPluginMutationFromAgent(
  shared: PluginSettingsShared,
  input: PluginMutationCall,
): Promise<PluginMutationResult> {
  return executePluginMutation(shared, { ...input, callerKind: 'agent' })
}

export function readPluginLoadout(filePath: string): PluginLoadoutRead {
  if (!isSafePluginPath(filePath)) return { status: 'failed', reason: 'unsafe_file_path' }
  const current = readLoadout(filePath)
  if (current === 'missing') return { status: 'missing', loadout: emptyPluginLoadout() }
  if (current === 'invalid') return { status: 'failed', reason: 'invalid_loadout' }
  if (current === 'credential') return { status: 'failed', reason: 'credential_material_rejected' }
  if (current === 'version') return { status: 'failed', reason: 'unsupported_loadout_version' }
  return { status: 'ok', loadout: current }
}

export async function executePluginMutation(
  shared: PluginSettingsShared,
  input: PluginMutationCall & { callerKind: 'human_ui' | 'agent' },
): Promise<PluginMutationResult> {
  if (!isSafePluginPath(input.filePath)) return failed(input.invocationId, 'unsafe_file_path')
  const current = readLoadout(input.filePath)
  if (current === 'invalid') return failed(input.invocationId, 'invalid_loadout')
  if (current === 'credential') return failed(input.invocationId, 'credential_material_rejected')
  if (current === 'version') return failed(input.invocationId, 'unsupported_loadout_version')
  const loadout = current === 'missing' ? emptyPluginLoadout() : current
  const plan = planPluginMutation(input.catalog, loadout, input.op, input.pluginId)
  switch (plan.status) {
    case 'Locked':
      return { status: 'Locked', phase: plan.phase, invocationId: input.invocationId }
    case 'failed':
      return failed(input.invocationId, plan.reason)
    case 'unchanged':
      return { status: 'completed', invocationId: input.invocationId, loadout: plan.loadout, persisted: false }
    case 'approval':
      return writeLoadout(shared, input, plan.loadout, true)
    case 'write':
      return writeLoadout(shared, input, plan.loadout, false)
    default: {
      const unexpected: never = plan
      return failed(input.invocationId, `unknown_plugin_plan:${String(unexpected)}`)
    }
  }
}

export function pendingPluginCard(
  shared: PluginSettingsShared,
  invocationId: string,
): HostPermissionCard | undefined {
  return craftCardForAwaitingTurn(shared.kernel, invocationId)
}

export async function resolvePluginGrant(
  shared: PluginSettingsShared,
  input: {
    invocationId: string
    approver: ActorRef
    decision: CraftPermissionDecision
    filePath: string
  },
): Promise<PluginMutationResult> {
  if (!isSafePluginPath(input.filePath)) return failed(input.invocationId, 'unsafe_file_path')
  const bare = invocationIdFromHostRequest(input.invocationId) ?? input.invocationId
  const outcome = applyCraftPermissionDecision(shared.kernel, bare, input.approver, input.decision)
  if (outcome.status === 'approval_required') {
    return { status: 'approval_required', invocationId: bare, reason: outcome.reason }
  }
  if (outcome.status === 'denied') {
    const pluginId = pluginIdFromTurn(shared.kernel, bare)
    if (!pluginId) return { status: 'denied', invocationId: bare, reason: outcome.reason }
    const saved = await persistDeniedGrant(shared, input.filePath, bare, pluginId, input.approver)
    if (saved.status !== 'completed') return saved
    return { status: 'denied', invocationId: bare, reason: outcome.reason ?? 'approval_rejected' }
  }
  if (outcome.status !== 'admitted') return turnResult(outcome)
  const ran = await shared.kernel.run(bare)
  if (ran.status !== 'completed') return turnResult(ran)
  const read = readPluginLoadout(input.filePath)
  if (read.status !== 'ok') return failed(bare, read.status === 'failed' ? read.reason : 'loadout_missing')
  return { status: 'completed', invocationId: bare, loadout: read.loadout, persisted: true }
}

async function writeLoadout(
  shared: PluginSettingsShared,
  input: PluginMutationCall & { callerKind: 'human_ui' | 'agent' },
  next: PluginLoadoutFile,
  requireHumanApproval: boolean,
  payloadOp = input.op,
): Promise<PluginMutationResult> {
  const sessionId = input.sessionId ?? PLUGIN_SETTINGS_SESSION_ID
  const invocation: ActionInvocation = {
    invocationId: input.invocationId,
    actionId: InternalActionId.FILE_UPDATE,
    payload: {
      filePath: input.filePath,
      pluginId: input.pluginId,
      op: payloadOp,
      nextDocument: next,
    },
    targets: [{ kind: 'file', id: input.filePath, label: input.pluginId }],
    callerKind: input.callerKind,
    sessionId,
    createdAt: '2026-10-09T00:00:00.000Z',
  }
  const admitted = shared.kernel.admit({
    invocation,
    actor: input.actor,
    ...(requireHumanApproval ? { requireHumanApproval: true } : {}),
  })
  if (admitted.status === 'completed') return failed(input.invocationId, 'duplicate_invocation')
  if (admitted.status !== 'admitted') return turnResult(admitted)
  const ran = await shared.kernel.run(input.invocationId)
  if (ran.status !== 'completed') return turnResult(ran)
  return { status: 'completed', invocationId: input.invocationId, loadout: next, persisted: true }
}

async function persistDeniedGrant(
  shared: PluginSettingsShared,
  filePath: string,
  invocationId: string,
  pluginId: string,
  approver: ActorRef,
): Promise<PluginMutationResult> {
  const current = readLoadout(filePath)
  if (current === 'invalid') return failed(invocationId, 'invalid_loadout')
  if (current === 'credential') return failed(invocationId, 'credential_material_rejected')
  if (current === 'version') return failed(invocationId, 'unsupported_loadout_version')
  const loadout = current === 'missing' ? emptyPluginLoadout() : current
  const next = withPluginGrant(loadout, { id: pluginId, decision: 'denied' })
  return writeLoadout(shared, {
    op: 'enable',
    pluginId,
    invocationId: `${invocationId}:grant`,
    sessionId: PLUGIN_SETTINGS_SESSION_ID,
    actor: approver,
    filePath,
    catalog: [],
    callerKind: 'human_ui',
  }, next, false, 'grant')
}

function pluginIdFromTurn(kernel: HostTurnKernel, invocationId: string): string | undefined {
  const turn = kernel.snapshot().turns.find((item) => item.request.invocation.invocationId === invocationId)
  const pluginId = turn?.request.invocation.payload.pluginId
  return typeof pluginId === 'string' && pluginId.trim().length > 0 ? pluginId : undefined
}

function turnResult(outcome: TurnOutcome): PluginMutationResult {
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

function readLoadout(filePath: string): PluginLoadoutFile | 'missing' | 'invalid' | 'credential' | 'version' {
  let raw: string
  try {
    raw = readFileSync(filePath, 'utf8')
  } catch {
    return 'missing'
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return 'invalid'
  }
  if (containsCredentialMaterial(parsed)) return 'credential'
  if (isPluginLoadoutFile(parsed)) return parsed
  if (isVersioned(parsed) && parsed.version !== 1) return 'version'
  return 'invalid'
}

function isSafePluginPath(filePath: string): boolean {
  if (!filePath.trim()) return false
  return !filePath.split(/[\\/]/).includes('..')
}

function isVersioned(value: unknown): value is { version: unknown } {
  return !!value && typeof value === 'object' && !Array.isArray(value) && 'version' in value
}

function failed(invocationId: string, reason: string): PluginMutationResult {
  return { status: 'failed', invocationId, reason }
}
