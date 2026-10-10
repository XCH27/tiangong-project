/**
 * Session chrome on the Craft session kernel.
 *
 * session.rename, session.set_status, and session.set_labels are the frozen
 * M00 ids. The shell commands use the desktop human. The session tools use
 * the calling Craft session as the agent actor. Title generation uses the
 * desktop human as well: the row is L1, so the host system actor is denied,
 * and there is no agent rename tool to borrow. Each row is L1 with an undo
 * contract, so admission does not publish the permission card. If the gate
 * returns approval_required, the caller waits for the existing card.
 * A system actor is not an agent seat. L1 denies it. Unflag has no frozen
 * id and is not in this file. This file does not add an action id.
 */

import type { ActorRef } from './actor'
import { DESKTOP_APPROVER } from './host-approval-bridge'
import { InternalActionId, type UndoHandle } from './internal-action'
import type { TurnRequest, TurnStatus } from './turn-admission'

/**
 * The host process. Not the desktop user and not an agent seat.
 * session.rename and session.set_status are L1, so this actor is denied.
 */
export const SESSION_HOST_ACTOR: ActorRef = {
  kind: 'system',
  id: 'system',
  displayName: 'system',
}

/**
 * The Craft session that invoked the tool. This is the agent caller.
 * It is not an AgentSeat record and it is not the desktop user.
 * A blank id stays blank so admission can deny malformed_actor.
 */
export function agentActorForCallingSession(sessionId: string, displayName: string | undefined): ActorRef {
  const name = displayName?.trim() ?? ''
  const id = sessionId.trim()
  return {
    kind: 'agent',
    id: sessionId,
    displayName: name.length > 0 ? name : id,
  }
}

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

function callerKindFor(actor: ActorRef): 'human_ui' | 'agent' {
  switch (actor.kind) {
    case 'human':
      return 'human_ui'
    case 'agent':
    case 'system':
      return 'agent'
    default: {
      const unexpected: never = actor.kind
      return unexpected
    }
  }
}

function sessionChromeRequest(
  sessionId: string,
  invocationId: string,
  actionId: InternalActionId,
  payload: Record<string, unknown>,
  actor: ActorRef,
  now: string,
): TurnRequest {
  return {
    actor,
    invocation: {
      invocationId,
      actionId,
      payload,
      targets: [{ kind: 'session', id: sessionId, label: 'session' }],
      callerKind: callerKindFor(actor),
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
  return sessionRenameRequestForActor(sessionId, invocationId, name, DESKTOP_APPROVER, now)
}

export function sessionRenameRequestForActor(
  sessionId: string,
  invocationId: string,
  name: string,
  actor: ActorRef,
  now = new Date().toISOString(),
): TurnRequest {
  return sessionChromeRequest(
    sessionId,
    invocationId,
    InternalActionId.SESSION_RENAME,
    { name },
    actor,
    now,
  )
}

export function sessionStatusRequest(
  sessionId: string,
  invocationId: string,
  sessionStatus: string,
  now = new Date().toISOString(),
): TurnRequest {
  return sessionStatusRequestForActor(sessionId, invocationId, sessionStatus, DESKTOP_APPROVER, now)
}

export function sessionLabelsRequest(
  sessionId: string,
  invocationId: string,
  labels: readonly string[],
  now = new Date().toISOString(),
): TurnRequest {
  return sessionLabelsRequestForActor(sessionId, invocationId, labels, DESKTOP_APPROVER, now)
}

export function sessionStatusRequestForActor(
  sessionId: string,
  invocationId: string,
  sessionStatus: string,
  actor: ActorRef,
  now = new Date().toISOString(),
): TurnRequest {
  return sessionChromeRequest(
    sessionId,
    invocationId,
    InternalActionId.SESSION_SET_STATUS,
    { sessionStatus },
    actor,
    now,
  )
}

export function sessionLabelsRequestForActor(
  sessionId: string,
  invocationId: string,
  labels: readonly string[],
  actor: ActorRef,
  now = new Date().toISOString(),
): TurnRequest {
  return sessionChromeRequest(
    sessionId,
    invocationId,
    InternalActionId.SESSION_SET_LABELS,
    { labels: [...labels] },
    actor,
    now,
  )
}

export function agentSessionStatusRequest(
  sessionId: string,
  invocationId: string,
  sessionStatus: string,
  actor: ActorRef,
  now = new Date().toISOString(),
): TurnRequest {
  return sessionStatusRequestForActor(sessionId, invocationId, sessionStatus, actor, now)
}

export function agentSessionLabelsRequest(
  sessionId: string,
  invocationId: string,
  labels: readonly string[],
  actor: ActorRef,
  now = new Date().toISOString(),
): TurnRequest {
  return sessionLabelsRequestForActor(sessionId, invocationId, labels, actor, now)
}
