/**
 * Session Options Types
 *
 * Type definitions and helpers for session-scoped settings.
 * The actual hook is in AppShellContext.tsx as useSessionOptionsFor().
 *
 * ADDING A NEW SESSION OPTION:
 * 1. Add field to SessionOptions interface below
 * 2. Update defaultSessionOptions
 * 3. Add UI control in FreeFormInput.tsx (or wherever needed)
 */

import type { PermissionMode } from '../../shared/types'
import type { ExecutionPermissionMode, WorkMode, WorkModeSelection } from '@craft-agent/shared/agent/work-mode'
import type { ThinkingLevel } from '@craft-agent/shared/agent/thinking-levels'
import { DEFAULT_THINKING_LEVEL } from '@craft-agent/shared/agent/thinking-levels'

/**
 * All session-scoped options in one place.
 */
export interface SessionOptions {
  /** Permission mode ('safe', 'ask', 'allow-all') */
  permissionMode: PermissionMode
  workMode: WorkMode
  workModeSelection: WorkModeSelection
  executionPermissionMode: ExecutionPermissionMode
  /** Monotonic version from backend permission mode state (used to ignore stale events) */
  permissionModeVersion?: number
  /** Session-level thinking level — sticky, persisted. See {@link ThinkingLevel}. */
  thinkingLevel: ThinkingLevel
  /** Provider low-latency mode; only surfaced when the selected model supports it. */
  fastMode: boolean
  /** Classified non-fast runtime mode id; null means the model default. */
  runtimeMode: string | null
}

/**
 * Defaults for new sessions before server hydrate.
 * OpenCode: default primary agent is build (= Execute). Manual lock matches
 * composer agent select. executionPermissionMode is Execute-time approval only.
 */
export const defaultSessionOptions: SessionOptions = {
  permissionMode: 'ask',
  workMode: 'execute',
  workModeSelection: 'auto',
  executionPermissionMode: 'ask',
  thinkingLevel: DEFAULT_THINKING_LEVEL,
  fastMode: false,
  runtimeMode: null,
}

/** Type for partial updates to session options */
export type SessionOptionUpdates = Partial<SessionOptions>

/** Helper to merge session options with updates */
export function mergeSessionOptions(
  current: SessionOptions | undefined,
  updates: SessionOptionUpdates
): SessionOptions {
  return {
    ...defaultSessionOptions,
    ...current,
    ...updates,
  }
}

/**
 * SessionCommand payloads for option fields that the backend owns.
 * Independent commands are returned as a list so callers can Promise.all them
 * instead of waterfalling sequential awaits.
 */
export type SessionOptionCommand =
  | { type: 'setPermissionMode'; mode: PermissionMode }
  | { type: 'setWorkMode'; selection: WorkModeSelection; mode: WorkMode }
  | { type: 'setExecutionPermissionMode'; mode: ExecutionPermissionMode }
  | { type: 'setThinkingLevel'; level: ThinkingLevel }
  | { type: 'setFastMode'; enabled: boolean }
  | { type: 'setRuntimeMode'; mode: string | null }

export function buildSessionOptionCommands(
  previous: SessionOptions,
  updates: SessionOptionUpdates,
): SessionOptionCommand[] {
  const commands: SessionOptionCommand[] = []
  if (updates.permissionMode !== undefined) {
    commands.push({ type: 'setPermissionMode', mode: updates.permissionMode })
  }
  if (updates.workModeSelection !== undefined || updates.workMode !== undefined) {
    commands.push({
      type: 'setWorkMode',
      selection: updates.workModeSelection ?? previous.workModeSelection,
      mode: updates.workMode ?? previous.workMode,
    })
  }
  if (updates.executionPermissionMode !== undefined) {
    commands.push({
      type: 'setExecutionPermissionMode',
      mode: updates.executionPermissionMode,
    })
  }
  if (updates.thinkingLevel !== undefined) {
    commands.push({ type: 'setThinkingLevel', level: updates.thinkingLevel })
  }
  if (updates.fastMode !== undefined) {
    commands.push({ type: 'setFastMode', enabled: updates.fastMode })
  }
  if (updates.runtimeMode !== undefined) {
    commands.push({ type: 'setRuntimeMode', mode: updates.runtimeMode })
  }
  return commands
}

/**
 * Rollback only the keys that still hold the attempted optimistic value.
 * Concurrent user edits to other fields (or a later success) are preserved.
 */
export function rollbackSessionOptionUpdates(
  latest: SessionOptions,
  previous: SessionOptions,
  attempted: SessionOptionUpdates,
): SessionOptions {
  const rolled: SessionOptionUpdates = {}
  for (const key of Object.keys(attempted) as (keyof SessionOptionUpdates)[]) {
    if (attempted[key] === undefined) continue
    if (latest[key] === attempted[key]) {
      // Restore the pre-optimistic value for this key only.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(rolled as any)[key] = previous[key]
    }
  }
  if (Object.keys(rolled).length === 0) return latest
  return mergeSessionOptions(latest, rolled)
}
