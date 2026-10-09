/**
 * Product approval bridge for an awaiting host turn.
 *
 * The existing Craft permission card (Allow / Always Allow / Deny) is the
 * surface. This module does not draw a new dialog. Allow and Deny call
 * HostTurnKernel.approve and reject. Always Allow still resolves only the
 * current invocation; it does not open a second grant store.
 */

import type { ActorRef } from './actor'
import { containsCredentialMaterial } from './credential-boundary'
import { isInternalActionId, policyForAction } from './action-policy'
import type { HostTurnKernel, TurnOutcome } from './turn-admission'

export const HOST_APPROVAL_REQUEST_PREFIX = 'host:' as const

/** Human behind the existing desktop permission buttons. */
export const DESKTOP_APPROVER: ActorRef = {
  kind: 'human',
  id: 'desktop-user',
  displayName: 'Desktop user',
}

/**
 * Fields the existing PermissionRequest card already renders:
 * tool name, description, and optional command preview.
 */
export interface HostPermissionCard {
  requestId: string
  sessionId: string
  toolName: string
  description: string
  command?: string
  type: 'file_write'
}

/** Response shape already emitted by the Craft permission card. */
export interface CraftPermissionDecision {
  allowed: boolean
  alwaysAllow?: boolean
}

export interface HostApprovalResult extends TurnOutcome {
  /** Always false. Always Allow does not remember a host grant. */
  standingGrant: false
}

export function hostApprovalRequestId(invocationId: string): string {
  return invocationId.startsWith(HOST_APPROVAL_REQUEST_PREFIX)
    ? invocationId
    : `${HOST_APPROVAL_REQUEST_PREFIX}${invocationId}`
}

export function invocationIdFromHostRequest(requestId: string): string | undefined {
  if (!requestId.startsWith(HOST_APPROVAL_REQUEST_PREFIX)) return undefined
  const invocationId = requestId.slice(HOST_APPROVAL_REQUEST_PREFIX.length)
  return invocationId.length > 0 ? invocationId : undefined
}

export function craftCardForAwaitingTurn(
  kernel: HostTurnKernel,
  invocationId: string,
): HostPermissionCard | undefined {
  const bareId = invocationIdFromHostRequest(invocationId) ?? invocationId
  const turn = kernel.snapshot().turns.find((item) => item.request.invocation.invocationId === bareId)
  if (!turn || turn.phase !== 'awaiting_approval') return undefined

  const actionId = turn.request.invocation.actionId
  const policy = isInternalActionId(actionId) ? policyForAction(actionId) : undefined
  const level = policy?.permissionLevel ?? 'unknown'
  const reason = turn.reason === 'undo_contract_missing'
    ? `${level} needs approval because it has no undo contract.`
    : `${level} needs explicit human approval.`
  const targetText = turn.request.invocation.targets
    .map((target) => target.label || target.id)
    .filter((value) => value.trim().length > 0)
    .join(', ')
  const command = targetText && !containsCredentialMaterial(targetText) ? targetText : undefined

  return {
    requestId: hostApprovalRequestId(bareId),
    sessionId: turn.request.invocation.sessionId,
    toolName: actionId,
    description: reason,
    command,
    type: 'file_write',
  }
}

export function listAwaitingCraftCards(kernel: HostTurnKernel): HostPermissionCard[] {
  const cards: HostPermissionCard[] = []
  for (const turn of kernel.snapshot().turns) {
    if (turn.phase !== 'awaiting_approval') continue
    const card = craftCardForAwaitingTurn(kernel, turn.request.invocation.invocationId)
    if (card) cards.push(card)
  }
  return cards
}

export function applyCraftPermissionDecision(
  kernel: HostTurnKernel,
  requestOrInvocationId: string,
  approver: ActorRef,
  decision: CraftPermissionDecision,
): HostApprovalResult {
  const invocationId = invocationIdFromHostRequest(requestOrInvocationId) ?? requestOrInvocationId
  const outcome = decision.allowed
    ? kernel.approve(invocationId, approver)
    : kernel.reject(invocationId, approver)
  // decision.alwaysAllow is the existing Craft "Always Allow" button.
  // It resolves this invocation only. standingGrant stays false so the next
  // L3 or approval-gated L1 action asks again.
  return { ...outcome, standingGrant: false }
}
