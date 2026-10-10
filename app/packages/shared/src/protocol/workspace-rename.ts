/**
 * Settings workspace rename on the Craft session kernel.
 *
 * workspace.rename is the frozen L2 id. The shell caller is Settings →
 * Workspace name, through workspaceSettings:update. The actor is the desktop
 * user. The request does not set preAuthorizedBy, so the L2 row waits for
 * the existing permission card. This file does not add an action id.
 */

import { DESKTOP_APPROVER } from './host-approval-bridge'
import { InternalActionId } from './internal-action'
import type { TurnRequest, TurnStatus } from './turn-admission'

export interface WorkspaceRenameAdmission {
  status: TurnStatus
  invocationId: string
  reason?: string
  sessionId?: string
}

export function workspaceRenameRequest(
  sessionId: string,
  invocationId: string,
  input: { workspaceId: string; name: string; previousName: string },
  now = new Date().toISOString(),
): TurnRequest {
  return {
    actor: DESKTOP_APPROVER,
    invocation: {
      invocationId,
      actionId: InternalActionId.WORKSPACE_RENAME,
      payload: {
        name: input.name,
        previousName: input.previousName,
      },
      targets: [{ kind: 'workspace', id: input.workspaceId, label: input.name }],
      callerKind: 'human_ui',
      sessionId,
      createdAt: now,
    },
  }
}
