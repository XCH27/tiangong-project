/**
 * Human session flag on the Craft session kernel.
 *
 * session.flag is the frozen M00 id. The shell Flag command is the caller.
 * The row is L0, so admission does not publish the permission card. Unflag
 * has no frozen id and does not admit. This file does not add an action id.
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
