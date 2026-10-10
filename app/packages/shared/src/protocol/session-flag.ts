/**
 * Human session flag and unflag on the Craft session kernel.
 *
 * session.flag and session.unflag are the frozen M00 ids. The shell commands
 * are the callers. Both rows are L0, so admission does not publish the
 * permission card. Unflag restores the previous flag only through the undo
 * snapshot on a completed turn. A refused admit does not clear the flag.
 */

import { DESKTOP_APPROVER } from './host-approval-bridge'
import { InternalActionId } from './internal-action'
import type { TurnRequest, TurnStatus } from './turn-admission'

export interface SessionFlagAdmission {
  status: TurnStatus
  invocationId: string
  reason?: string
}

export function sessionFlagRequest(sessionId: string, invocationId: string, now = new Date().toISOString()): TurnRequest {
  return {
    actor: DESKTOP_APPROVER,
    invocation: {
      invocationId,
      actionId: InternalActionId.SESSION_FLAG,
      payload: { flagged: true },
      targets: [{ kind: 'session', id: sessionId, label: 'session' }],
      callerKind: 'human_ui',
      sessionId,
      createdAt: now,
    },
  }
}

/** True when a flag command returned and the session was not flagged. */
export function isRefusedSessionFlag(result: unknown): boolean {
  if (!result || typeof result !== 'object' || !('status' in result)) return false
  return (result as { status: unknown }).status !== 'completed'
}

export function sessionUnflagRequest(sessionId: string, invocationId: string, now = new Date().toISOString()): TurnRequest {
  return {
    actor: DESKTOP_APPROVER,
    invocation: {
      invocationId,
      actionId: InternalActionId.SESSION_UNFLAG,
      payload: { flagged: false },
      targets: [{ kind: 'session', id: sessionId, label: 'session' }],
      callerKind: 'human_ui',
      sessionId,
      createdAt: now,
    },
  }
}

/** True when an unflag command returned and the flag was not cleared. */
export function isRefusedSessionUnflag(result: unknown): boolean {
  return isRefusedSessionFlag(result)
}
