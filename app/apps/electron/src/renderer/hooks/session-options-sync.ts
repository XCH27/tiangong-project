/**
 * Production boundary for session option updates.
 *
 * Optimistic UI is applied here (via setMap) in the same turn as previous is
 * read, so rapid successive calls never see a stale previous. Backend commands
 * are awaited in parallel; only keys whose commands failed (and still hold
 * this attempt's optimistic value) are rolled back.
 */

import {
  buildSessionOptionCommands,
  defaultSessionOptions,
  mergeSessionOptions,
  rollbackSessionOptionUpdates,
  type SessionOptionCommand,
  type SessionOptions,
  type SessionOptionUpdates,
} from './useSessionOptions'

export type SessionCommandFn = (
  sessionId: string,
  command: SessionOptionCommand,
) => Promise<unknown>

function keysForCommand(
  command: SessionOptionCommand,
  updates: SessionOptionUpdates,
): SessionOptionUpdates {
  switch (command.type) {
    case 'setPermissionMode':
      return updates.permissionMode !== undefined
        ? { permissionMode: updates.permissionMode }
        : {}
    case 'setWorkMode': {
      const partial: SessionOptionUpdates = {}
      if (updates.workMode !== undefined) partial.workMode = updates.workMode
      if (updates.workModeSelection !== undefined) {
        partial.workModeSelection = updates.workModeSelection
      }
      // When only one side of work mode was in the update, still roll both
      // fields the command touched if it failed.
      if (Object.keys(partial).length === 0) {
        return {
          workMode: command.mode,
          workModeSelection: command.selection,
        }
      }
      return partial
    }
    case 'setExecutionPermissionMode':
      return updates.executionPermissionMode !== undefined
        ? { executionPermissionMode: updates.executionPermissionMode }
        : {}
    case 'setThinkingLevel':
      return updates.thinkingLevel !== undefined
        ? { thinkingLevel: updates.thinkingLevel }
        : {}
    case 'setFastMode':
      return updates.fastMode !== undefined ? { fastMode: updates.fastMode } : {}
    case 'setRuntimeMode':
      return updates.runtimeMode !== undefined ? { runtimeMode: updates.runtimeMode } : {}
  }
}

export interface ApplySessionOptionUpdatesArgs {
  sessionId: string
  previous: SessionOptions
  updates: SessionOptionUpdates
  /** Already-optimistic latest options at call time. */
  optimistic: SessionOptions
  sessionCommand: SessionCommandFn
  /**
   * Read the latest options map entry after awaits (concurrent edits may have
   * landed). Return undefined to use `optimistic` as the rollback base.
   */
  getLatest: () => SessionOptions | undefined
  setOptions: (next: SessionOptions) => void
  onFailure: (message: string) => void
}

export interface ApplySessionOptionUpdatesResult {
  ok: boolean
  failedCommands: SessionOptionCommand['type'][]
  /** Keys that were rolled back. */
  rolledBack: SessionOptionUpdates
}

/**
 * Await all independent session option commands. Roll back only failed keys.
 */
export async function applySessionOptionUpdates(
  args: ApplySessionOptionUpdatesArgs,
): Promise<ApplySessionOptionUpdatesResult> {
  const commands = buildSessionOptionCommands(args.previous, args.updates)
  if (commands.length === 0) {
    return { ok: true, failedCommands: [], rolledBack: {} }
  }

  const settled = await Promise.all(
    commands.map(async (command) => {
      try {
        await args.sessionCommand(args.sessionId, command)
        return { command, ok: true as const }
      } catch (error) {
        return {
          command,
          ok: false as const,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    }),
  )

  const failed = settled.filter((s) => !s.ok)
  if (failed.length === 0) {
    return { ok: true, failedCommands: [], rolledBack: {} }
  }

  // Only the keys owned by failed commands — successful commands stay optimistic.
  const failedKeys: SessionOptionUpdates = {}
  for (const item of failed) {
    Object.assign(failedKeys, keysForCommand(item.command, args.updates))
  }

  const latest = args.getLatest() ?? args.optimistic
  const rolled = rollbackSessionOptionUpdates(latest, args.previous, failedKeys)
  args.setOptions(rolled)

  const message = failed
    .map((f) => ('error' in f ? f.error : 'unknown'))
    .filter(Boolean)
    .join('; ')
  args.onFailure(message || 'Session option update failed')

  return {
    ok: false,
    failedCommands: failed.map((f) => f.command.type),
    rolledBack: failedKeys,
  }
}

export interface RunSessionOptionChangeArgs {
  sessionId: string
  updates: SessionOptionUpdates
  /**
   * Synchronous get/set of the options map. setMap MUST update any ref the
   * next getMap reads from (same tick), not only React state after paint.
   */
  getMap: () => Map<string, SessionOptions>
  setMap: (next: Map<string, SessionOptions>) => void
  sessionCommand: SessionCommandFn
  onFailure: (message: string) => void
}

/**
 * Full production path for one option-change gesture: read previous from the
 * live map, apply optimistic, await backend, roll back failed keys only.
 */
export async function runSessionOptionChange(
  args: RunSessionOptionChangeArgs,
): Promise<ApplySessionOptionUpdatesResult> {
  const previous = args.getMap().get(args.sessionId) ?? defaultSessionOptions
  const optimistic = mergeSessionOptions(previous, args.updates)
  const nextMap = new Map(args.getMap())
  nextMap.set(args.sessionId, optimistic)
  // Immediate map write — concurrent runSessionOptionChange sees this previous.
  args.setMap(nextMap)

  return applySessionOptionUpdates({
    sessionId: args.sessionId,
    previous,
    updates: args.updates,
    optimistic,
    sessionCommand: args.sessionCommand,
    getLatest: () => args.getMap().get(args.sessionId),
    setOptions: (nextOptions) => {
      const map = new Map(args.getMap())
      map.set(args.sessionId, nextOptions)
      args.setMap(map)
    },
    onFailure: args.onFailure,
  })
}
