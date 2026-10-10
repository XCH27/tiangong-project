/**
 * Human session chrome on the Craft session kernel.
 *
 * session.rename, session.set_status, and session.set_labels are the frozen
 * M00 ids. The shell commands are the callers. Each row is L1 with an undo
 * contract, so admission does not publish the permission card. If the gate
 * returns approval_required, the caller waits for the existing card.
 * Unflag has no frozen id and is not in this file. This file does not add an
 * action id.
 */

import { DESKTOP_APPROVER } from './host-approval-bridge'
import { InternalActionId, type UndoHandle } from './internal-action'
import type { TurnRequest, TurnStatus } from './turn-admission'

export interface SessionChromeAdmission {
  status: TurnStatus
  invocationId: string
  reason?: string
}

export type SessionChromePlan = 'run' | 'await_card' | 'refuse'

export function planSessionChrome(status: TurnStatus): SessionChromePlan {
  switch (status) {
    case 'admitted':
      return 'run'
    case 'approval_required':
      return 'await_card'
    case 'denied':
    case 'failed':
    case 'interrupted':
    case 'reconciling':
    case 'completed':
      return 'refuse'
    default: {
      const unexpected: never = status
      return unexpected
    }
  }
}

/** True when a chrome command returned and the header write did not complete. */
export function isRefusedSessionChrome(result: unknown): boolean {
  if (!result || typeof result !== 'object' || !('status' in result)) return false
  return (result as { status: unknown }).status !== 'completed'
}

export function sessionChromeUndo(invocationId: string, label: string, snapshot: unknown): UndoHandle {
  return { undoId: `undo-${invocationId}`, label, snapshot }
}

function sessionChromeRequest(
  sessionId: string,
  invocationId: string,
  actionId: InternalActionId,
  payload: Record<string, unknown>,
  now: string,
): TurnRequest {
  return {
    actor: DESKTOP_APPROVER,
    invocation: {
      invocationId,
      actionId,
      payload,
      targets: [{ kind: 'session', id: sessionId, label: 'session' }],
      callerKind: 'human_ui',
      sessionId,
      createdAt: now,
    },
  }
}

export function sessionRenameRequest(
  sessionId: string,
  invocationId: string,
  name: string,
  now = new Date().toISOString(),
): TurnRequest {
  return sessionChromeRequest(sessionId, invocationId, InternalActionId.SESSION_RENAME, { name }, now)
}

export function sessionStatusRequest(
  sessionId: string,
  invocationId: string,
  sessionStatus: string,
  now = new Date().toISOString(),
): TurnRequest {
  return sessionChromeRequest(
    sessionId,
    invocationId,
    InternalActionId.SESSION_SET_STATUS,
    { sessionStatus },
    now,
  )
}

export function sessionLabelsRequest(
  sessionId: string,
  invocationId: string,
  labels: readonly string[],
  now = new Date().toISOString(),
): TurnRequest {
  return sessionChromeRequest(
    sessionId,
    invocationId,
    InternalActionId.SESSION_SET_LABELS,
    { labels: [...labels] },
    now,
  )
}
