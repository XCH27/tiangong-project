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
