/**
 * Plugin loadout writes.
 *
 * Install, enable, and disable admit file.update on HostTurnKernel and write
 * `.claude-plugin/loadout.json` with the same atomic replace as session.jsonl.
 * A human control and an agent caller share executePluginMutation. Installing
 * does not enable. Third-party hook approval stays Locked and does not write.
 */

import { readFileSync } from 'node:fs'
import type { ActorRef } from './actor'
import { containsCredentialMaterial } from './credential-boundary'
import { InternalActionId, type ActionInvocation } from './internal-action'
import { applyAtomicJsonEffect, NativeEffectRegistry } from './native-effect-executor'
import {
  emptyPluginLoadout,
  isPluginLoadoutFile,
  planPluginMutation,
  PLUGIN_SETTINGS_SESSION_ID,
  type LockedPluginPhase,
  type PluginCatalogEntry,
  type PluginLoadoutFile,
  type PluginMutationName,
} from './plugin-settings'
import { HostTurnKernel, MemoryTurnJournal, type TurnOutcome } from './turn-admission'

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
    case 'write':
      return writeLoadout(shared, input, plan.loadout)
    default: {
      const unexpected: never = plan
      return failed(input.invocationId, `unknown_plugin_plan:${String(unexpected)}`)
    }
  }
}

async function writeLoadout(
  shared: PluginSettingsShared,
  input: PluginMutationCall & { callerKind: 'human_ui' | 'agent' },
  next: PluginLoadoutFile,
): Promise<PluginMutationResult> {
  const sessionId = input.sessionId ?? PLUGIN_SETTINGS_SESSION_ID
  const invocation: ActionInvocation = {
    invocationId: input.invocationId,
    actionId: InternalActionId.FILE_UPDATE,
    payload: {
      filePath: input.filePath,
      pluginId: input.pluginId,
      op: input.op,
      nextDocument: next,
    },
    targets: [{ kind: 'file', id: input.filePath, label: 'plugin-loadout' }],
    callerKind: input.callerKind,
    sessionId,
    createdAt: '2026-10-09T00:00:00.000Z',
  }
  const admitted = shared.kernel.admit({ invocation, actor: input.actor })
  if (admitted.status === 'completed') return failed(input.invocationId, 'duplicate_invocation')
  if (admitted.status !== 'admitted') return turnResult(admitted)
  const ran = await shared.kernel.run(input.invocationId)
  if (ran.status !== 'completed') return turnResult(ran)
  return { status: 'completed', invocationId: input.invocationId, loadout: next, persisted: true }
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
