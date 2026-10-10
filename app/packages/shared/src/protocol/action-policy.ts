/**
 * Frozen v1.2 action admission policy.
 *
 * The action id table in docs/contracts/action-ids.md stays unchanged.
 * L1 rows whose undo contract is `not_supported` are fail-closed at admission
 * time (approval required). That does not reclassify the frozen permission
 * label; W0.1 still owns the table re-freeze.
 * Admission does not accept a side flag that upgrades a frozen L1 id.
 * Misowned payloads are refused in action-owner-policy.ts.
 */

import { InternalActionId, type ActionPermissionLevel } from './internal-action'

export type UndoContract = 'supported' | 'not_supported' | 'not_required'

export interface FrozenActionPolicy {
  permissionLevel: ActionPermissionLevel
  undoSupport: UndoContract
}

export const FROZEN_ACTION_POLICY: Record<InternalActionId, FrozenActionPolicy> = {
  [InternalActionId.FILE_CREATE]: { permissionLevel: 'L1_reversible', undoSupport: 'supported' },
  [InternalActionId.FILE_UPDATE]: { permissionLevel: 'L1_reversible', undoSupport: 'supported' },
  [InternalActionId.FILE_DELETE]: { permissionLevel: 'L3_destructive', undoSupport: 'not_supported' },
  [InternalActionId.FILE_RENAME]: { permissionLevel: 'L1_reversible', undoSupport: 'supported' },
  [InternalActionId.FILE_MOVE]: { permissionLevel: 'L1_reversible', undoSupport: 'supported' },
  [InternalActionId.SESSION_RENAME]: { permissionLevel: 'L1_reversible', undoSupport: 'supported' },
  [InternalActionId.SESSION_FLAG]: { permissionLevel: 'L0_read_only', undoSupport: 'supported' },
  [InternalActionId.SESSION_SET_STATUS]: { permissionLevel: 'L1_reversible', undoSupport: 'supported' },
  [InternalActionId.SESSION_SET_LABELS]: { permissionLevel: 'L1_reversible', undoSupport: 'supported' },
  [InternalActionId.CANVAS_NODE_CREATE]: { permissionLevel: 'L1_reversible', undoSupport: 'supported' },
  [InternalActionId.CANVAS_NODE_UPDATE]: { permissionLevel: 'L1_reversible', undoSupport: 'supported' },
  [InternalActionId.CANVAS_NODE_DELETE]: { permissionLevel: 'L3_destructive', undoSupport: 'not_supported' },
  [InternalActionId.CANVAS_NODE_SELECT]: { permissionLevel: 'L0_read_only', undoSupport: 'not_required' },
  [InternalActionId.CANVAS_GROUP_CREATE]: { permissionLevel: 'L1_reversible', undoSupport: 'supported' },
  [InternalActionId.CANVAS_GROUP_UNGROUP]: { permissionLevel: 'L1_reversible', undoSupport: 'supported' },
  [InternalActionId.CANVAS_EDGE_CREATE]: { permissionLevel: 'L1_reversible', undoSupport: 'supported' },
  [InternalActionId.CANVAS_EXPORT_SELECTION]: { permissionLevel: 'L0_read_only', undoSupport: 'not_required' },
  [InternalActionId.CANVAS_VIEWPORT_SET]: { permissionLevel: 'L0_read_only', undoSupport: 'not_required' },
  [InternalActionId.CANVAS_ZOOM_TO_NODE]: { permissionLevel: 'L0_read_only', undoSupport: 'not_required' },
  [InternalActionId.AIGC_JOB_SUBMIT]: { permissionLevel: 'L1_reversible', undoSupport: 'not_supported' },
  [InternalActionId.WORKSPACE_RENAME]: { permissionLevel: 'L2_irreversible', undoSupport: 'supported' },
}

export function policyForAction(actionId: InternalActionId): FrozenActionPolicy {
  return FROZEN_ACTION_POLICY[actionId]
}

export function isInternalActionId(value: string): value is InternalActionId {
  return (Object.values(InternalActionId) as string[]).includes(value)
}
