/**
 * Frozen v1.3.0 action admission policy.
 *
 * permissionLevel and undoSupport are the admission gate. The other fields are
 * the independent columns required by docs/contracts/action-ids.md. They do
 * not upgrade an id. workflow_runtime is absent from every caller list: it has
 * no independent authority on this version.
 */

import { InternalActionId, type ActionPermissionLevel } from './internal-action'

export type UndoContract = 'supported' | 'not_supported' | 'not_required'

export type SideEffectClass =
  | 'file_bytes'
  | 'destructive_delete'
  | 'local_header'
  | 'view_state'
  | 'export_artifact'
  | 'external_job'
  | 'workspace_name'
  | 'capability_scope'
  | 'evidence_capture'

export type ApprovalPolicy = 'none' | 'human_card' | 'human_card_or_preauthorized'

export type CancellationPolicy = 'before_commit' | 'before_external_submit' | 'n/a'

export type RetryPolicy = 'idempotent_replay' | 'reconcile_no_repeat' | 'new_invocation' | 'not_retryable'

export type EvidencePolicy = 'session_journal'

export type ActionCallerKind = 'human_ui' | 'agent'

export interface FrozenActionPolicy {
  permissionLevel: ActionPermissionLevel
  undoSupport: UndoContract
  sideEffect: SideEffectClass
  approval: ApprovalPolicy
  cancellation: CancellationPolicy
  retry: RetryPolicy
  evidence: EvidencePolicy
  callers: readonly ActionCallerKind[]
  sinceVersion: string
}

const humanAndAgent: readonly ActionCallerKind[] = ['human_ui', 'agent']
const humanOnly: readonly ActionCallerKind[] = ['human_ui']

function policy(
  permissionLevel: ActionPermissionLevel,
  undoSupport: UndoContract,
  sideEffect: SideEffectClass,
  approval: ApprovalPolicy,
  cancellation: CancellationPolicy,
  retry: RetryPolicy,
  callers: readonly ActionCallerKind[],
  sinceVersion: string,
): FrozenActionPolicy {
  return {
    permissionLevel,
    undoSupport,
    sideEffect,
    approval,
    cancellation,
    retry,
    evidence: 'session_journal',
    callers,
    sinceVersion,
  }
}

export const FROZEN_ACTION_POLICY: Record<InternalActionId, FrozenActionPolicy> = {
  [InternalActionId.FILE_CREATE]: policy('L1_reversible', 'supported', 'file_bytes', 'none', 'before_commit', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.FILE_UPDATE]: policy('L1_reversible', 'supported', 'file_bytes', 'none', 'before_commit', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.FILE_DELETE]: policy('L3_destructive', 'not_supported', 'destructive_delete', 'human_card', 'before_commit', 'not_retryable', humanAndAgent, '1.2.0'),
  [InternalActionId.FILE_RENAME]: policy('L1_reversible', 'supported', 'file_bytes', 'none', 'before_commit', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.FILE_MOVE]: policy('L1_reversible', 'supported', 'file_bytes', 'none', 'before_commit', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.FILE_PAGE_TARGET]: policy('L2_irreversible', 'supported', 'file_bytes', 'human_card_or_preauthorized', 'before_commit', 'idempotent_replay', humanAndAgent, '1.3.0'),
  [InternalActionId.SESSION_RENAME]: policy('L1_reversible', 'supported', 'local_header', 'none', 'before_commit', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.SESSION_FLAG]: policy('L0_read_only', 'supported', 'local_header', 'none', 'before_commit', 'idempotent_replay', humanOnly, '1.2.0'),
  [InternalActionId.SESSION_UNFLAG]: policy('L0_read_only', 'supported', 'local_header', 'none', 'before_commit', 'idempotent_replay', humanOnly, '1.3.0'),
  [InternalActionId.SESSION_SET_STATUS]: policy('L1_reversible', 'supported', 'local_header', 'none', 'before_commit', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.SESSION_SET_LABELS]: policy('L1_reversible', 'supported', 'local_header', 'none', 'before_commit', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.CANVAS_NODE_CREATE]: policy('L1_reversible', 'supported', 'view_state', 'none', 'before_commit', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.CANVAS_NODE_UPDATE]: policy('L1_reversible', 'supported', 'view_state', 'none', 'before_commit', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.CANVAS_NODE_DELETE]: policy('L3_destructive', 'not_supported', 'destructive_delete', 'human_card', 'before_commit', 'not_retryable', humanAndAgent, '1.2.0'),
  [InternalActionId.CANVAS_NODE_SELECT]: policy('L0_read_only', 'not_required', 'view_state', 'none', 'n/a', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.CANVAS_GROUP_CREATE]: policy('L1_reversible', 'supported', 'view_state', 'none', 'before_commit', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.CANVAS_GROUP_UNGROUP]: policy('L1_reversible', 'supported', 'view_state', 'none', 'before_commit', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.CANVAS_EDGE_CREATE]: policy('L1_reversible', 'supported', 'view_state', 'none', 'before_commit', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.CANVAS_EXPORT_SELECTION]: policy('L0_read_only', 'not_required', 'export_artifact', 'none', 'n/a', 'new_invocation', humanAndAgent, '1.2.0'),
  [InternalActionId.CANVAS_VIEWPORT_SET]: policy('L0_read_only', 'not_required', 'view_state', 'none', 'n/a', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.CANVAS_ZOOM_TO_NODE]: policy('L0_read_only', 'not_required', 'view_state', 'none', 'n/a', 'idempotent_replay', humanAndAgent, '1.2.0'),
  [InternalActionId.BROWSER_DOM_SNAPSHOT]: policy('L2_irreversible', 'not_required', 'evidence_capture', 'human_card_or_preauthorized', 'before_commit', 'new_invocation', humanAndAgent, '1.3.0'),
  [InternalActionId.WORKBENCH_SIDEBAR_FOCUS]: policy('L0_read_only', 'not_required', 'view_state', 'none', 'n/a', 'idempotent_replay', humanAndAgent, '1.3.0'),
  [InternalActionId.PLUGIN_LOADOUT_MUTATE]: policy('L2_irreversible', 'supported', 'capability_scope', 'human_card_or_preauthorized', 'before_commit', 'idempotent_replay', humanOnly, '1.3.0'),
  [InternalActionId.AIGC_JOB_SUBMIT]: policy('L1_reversible', 'not_supported', 'external_job', 'human_card', 'before_external_submit', 'reconcile_no_repeat', humanAndAgent, '1.2.0'),
  [InternalActionId.WORKSPACE_RENAME]: policy('L2_irreversible', 'supported', 'workspace_name', 'human_card_or_preauthorized', 'before_commit', 'idempotent_replay', humanOnly, '1.2.0'),
}

export function approvalForGate(policyRow: FrozenActionPolicy): ApprovalPolicy {
  switch (policyRow.permissionLevel) {
    case 'L0_read_only':
      return 'none'
    case 'L1_reversible':
      return policyRow.undoSupport === 'supported' ? 'none' : 'human_card'
    case 'L2_irreversible':
      return 'human_card_or_preauthorized'
    case 'L3_destructive':
      return 'human_card'
    default: {
      const unexpected: never = policyRow.permissionLevel
      throw new Error(`Unhandled permission level: ${String(unexpected)}`)
    }
  }
}

export function policyForAction(actionId: InternalActionId): FrozenActionPolicy {
  return FROZEN_ACTION_POLICY[actionId]
}

export function isInternalActionId(value: string): value is InternalActionId {
  return (Object.values(InternalActionId) as string[]).includes(value)
}
