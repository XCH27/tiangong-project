/**
 * Permission intersection for child sessions / delegated tasks.
 *
 * Authority rule (C3/C11, non-negotiable least privilege):
 *   effective = parent ∩ requested ∩ workspacePolicy ∩ runtimeCapability
 *
 * Privilege never expands past the parent. The historical Conductor default of
 * implicit `allow-all` for unattended children is removed — unattended work that
 * resolves to `ask` must wait for approval (or refuse dispatch), not escalate.
 */

import type { PermissionMode } from './mode-types.ts';

/** Lower rank = more restrictive. */
export const PERMISSION_MODE_RANK: Record<PermissionMode, number> = {
  safe: 0,
  ask: 1,
  'allow-all': 2,
};

export function permissionModeRank(mode: PermissionMode): number {
  return PERMISSION_MODE_RANK[mode];
}

/** True when `a` is strictly more privileged than `b`. */
export function isPermissionUpgrade(from: PermissionMode, to: PermissionMode): boolean {
  return PERMISSION_MODE_RANK[to] > PERMISSION_MODE_RANK[from];
}

/**
 * Lattice meet: the most restrictive of the provided modes.
 * Undefined/null entries are ignored. With no inputs, returns `safe`
 * (never invents `allow-all`).
 */
export function intersectPermissionModes(
  ...modes: Array<PermissionMode | null | undefined>
): PermissionMode {
  let min: PermissionMode | undefined;
  for (const mode of modes) {
    if (!mode) continue;
    if (!min || PERMISSION_MODE_RANK[mode] < PERMISSION_MODE_RANK[min]) {
      min = mode;
    }
  }
  return min ?? 'safe';
}

export type ChildPermissionDenialReason =
  | 'permission-escalation-denied'
  | 'ask-requires-approval'
  | 'no-executable-permission';

export interface ResolveChildPermissionInput {
  /** Parent / orchestrator session permission. When set, child cannot exceed it. */
  parent?: PermissionMode | null;
  /** Explicit request from node / TaskBrief / spawn args. */
  requested?: PermissionMode | null;
  /** Task-level default (task.yaml defaults.permissionMode). */
  taskDefault?: PermissionMode | null;
  /** Workspace or policy ceiling. */
  workspacePolicy?: PermissionMode | null;
  /** Runtime adapter capability ceiling (e.g. read-only remote). */
  runtimeCapability?: PermissionMode | null;
  /**
   * Child runs without a human at the prompt (Conductor nodes, background
   * spawns). When true and the effective mode is `ask`, dispatch is denied
   * unless `approvalAvailable` is true — never silently raised to allow-all.
   */
  unattended?: boolean;
  /** Host can surface approval prompts for this child. */
  approvalAvailable?: boolean;
}

export type ChildPermissionResolution =
  | {
      ok: true;
      mode: PermissionMode;
      /** True when the candidate was narrowed by intersection. */
      narrowed: boolean;
      candidate: PermissionMode;
    }
  | {
      ok: false;
      reason: ChildPermissionDenialReason;
      candidate?: PermissionMode;
      effective?: PermissionMode;
      parent?: PermissionMode;
      message: string;
    };

/**
 * Resolve the effective permission mode for a child session.
 *
 * Candidate selection (first present wins as the *request*):
 *   requested → taskDefault → parent → `safe`
 *
 * Then intersect with every ceiling. Escalation past parent is always denied
 * (even if intersection would clamp — we fail closed so callers see the bug).
 */
export function resolveChildPermission(
  input: ResolveChildPermissionInput,
): ChildPermissionResolution {
  const candidate: PermissionMode =
    input.requested ?? input.taskDefault ?? input.parent ?? 'safe';

  // Explicit request that exceeds the parent is a hard error, not a silent clamp.
  if (input.parent && input.requested && isPermissionUpgrade(input.parent, input.requested)) {
    return {
      ok: false,
      reason: 'permission-escalation-denied',
      candidate: input.requested,
      parent: input.parent,
      message:
        `Child permission "${input.requested}" exceeds parent "${input.parent}"; ` +
        'permission is monotonically non-increasing across delegation.',
    };
  }

  const effective = intersectPermissionModes(
    input.parent,
    candidate,
    input.workspacePolicy,
    input.runtimeCapability,
  );

  if (input.unattended && effective === 'ask' && !input.approvalAvailable) {
    return {
      ok: false,
      reason: 'ask-requires-approval',
      candidate,
      effective,
      parent: input.parent ?? undefined,
      message:
        'Unattended child resolved to permission mode "ask" with no approval channel; ' +
        'refusing to dispatch (will not escalate to allow-all).',
    };
  }

  return {
    ok: true,
    mode: effective,
    narrowed: effective !== candidate,
    candidate,
  };
}
