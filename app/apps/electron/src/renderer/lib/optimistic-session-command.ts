import type { SessionCommand } from '@craft-agent/shared/protocol'

/**
 * Fire-and-forget sessionCommand with optimistic UI rollback.
 *
 * `apply` runs the optimistic atom mutation synchronously and returns a revert
 * closure (capturing whatever previous value it needs). If the command rejects,
 * the failure is logged and the optimistic update is rolled back so the renderer
 * does not drift from main-process state.
 */
export function optimisticSessionCommand(
  sessionId: string,
  command: SessionCommand,
  apply: () => () => void,
): void {
  const revert = apply()
  window.electronAPI.sessionCommand(sessionId, command).catch((error) => {
    console.error(
      `[optimisticSessionCommand] '${command.type}' failed for session ${sessionId}:`,
      error,
    )
    revert()
  })
}
