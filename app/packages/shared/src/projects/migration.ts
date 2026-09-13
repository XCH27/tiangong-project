/**
 * Planning the P6 collapse: a nested Craft Project folds into the Workspace that
 * contains it, so one boundary is left and it is called Project.
 *
 * This module only *plans*. Note 20 §5 requires the migration to be previewable and
 * non-destructive, and for good reason: a nested Project can carry a working
 * directory, uploaded assets, a custom board layout and the sessions bound to it, and
 * flattening several of them into one Workspace silently would lose whichever lost the
 * race. So the plan is produced first, shown, and only then applied.
 *
 * The three cases come straight from §5:
 *  - **no nested Project** — the Workspace already is the user's Project; nothing to do;
 *  - **one nested Project** — merge its metadata and bindings after a conflict preview;
 *  - **several** — refuse to choose. The owner either splits them into Workspaces or
 *    picks one to merge; a silent flatten is the outcome this file exists to prevent.
 */

import type { KanbanColumnDef } from './types.ts';

export interface NestedProjectSnapshot {
  id: string;
  slug: string;
  name: string;
  description?: string;
  color?: string;
  workingDirectory?: string;
  kanbanColumns?: KanbanColumnDef[];
  /** Files under `projects/<slug>/assets/`. Count is enough for a preview. */
  assetCount: number;
  /** Sessions carrying this project's id. */
  sessionIds: string[];
}

export interface WorkspaceSnapshot {
  id: string;
  name: string;
  slug: string;
  /** Already-set Workspace-level values that a merge could overwrite. */
  description?: string;
  color?: string;
  workingDirectory?: string;
  kanbanColumns?: KanbanColumnDef[];
}

export type MigrationVerdict =
  /** The Workspace is already the only boundary. */
  | 'already-collapsed'
  /** Exactly one nested Project; the merge is mechanical apart from the conflicts listed. */
  | 'merge-one'
  /** More than one; the owner chooses, this module does not. */
  | 'owner-must-choose';

export interface FieldConflict {
  field: 'name' | 'description' | 'color' | 'workingDirectory' | 'kanbanColumns';
  /** What the Workspace holds today. */
  workspaceValue: string;
  /** What the nested Project would bring. */
  projectValue: string;
}

export interface MigrationPlan {
  verdict: MigrationVerdict;
  /** Values that move with no contest. */
  merges: Array<{ field: FieldConflict['field']; value: string }>;
  /** Values both sides define. Nothing is written for these until the owner picks. */
  conflicts: FieldConflict[];
  /** Sessions whose `projectId` binding is rewritten to the Workspace. */
  rebindSessionIds: string[];
  /** Files that must be copied to a Workspace-owned path before the record is archived. */
  assetCount: number;
  /** Nested Projects the owner must resolve by hand, when there is more than one. */
  contenders: string[];
  /** Always present: how to get back. */
  recovery: string;
}

function describe(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return `${value.length} column(s)`;
  return String(value);
}

/**
 * Build the plan. Pure: it reads snapshots and writes nothing, so a caller can show it,
 * discard it, or apply it later against a re-read of the same state.
 */
export function planNestedProjectMigration(
  workspace: WorkspaceSnapshot,
  nested: readonly NestedProjectSnapshot[],
): MigrationPlan {
  const recovery =
    'Nothing is deleted by applying this plan: the nested record is archived in place ' +
    '(projects/<slug>/ kept, marked archived) and can be restored by hand.';

  if (nested.length === 0) {
    return {
      verdict: 'already-collapsed',
      merges: [], conflicts: [], rebindSessionIds: [], assetCount: 0, contenders: [],
      recovery,
    };
  }

  if (nested.length > 1) {
    return {
      verdict: 'owner-must-choose',
      merges: [], conflicts: [], rebindSessionIds: [], assetCount: 0,
      // Named, so the choice is made against real projects rather than a count.
      contenders: nested.map((p) => p.name),
      recovery,
    };
  }

  const project = nested[0]!;
  const merges: MigrationPlan['merges'] = [];
  const conflicts: FieldConflict[] = [];

  const pairs: Array<[FieldConflict['field'], unknown, unknown]> = [
    // The Workspace always has a name, so this one is always a contest — surfaced
    // rather than resolved, because "My Workspace" vs "股票交易" is the owner's call.
    ['name', workspace.name, project.name],
    ['description', workspace.description, project.description],
    ['color', workspace.color, project.color],
    ['workingDirectory', workspace.workingDirectory, project.workingDirectory],
    ['kanbanColumns', workspace.kanbanColumns, project.kanbanColumns],
  ];

  for (const [field, wsValue, pjValue] of pairs) {
    const incoming = describe(pjValue);
    if (!incoming) continue;
    const existing = describe(wsValue);
    // Both sides agreeing is not a conflict and not a change — there is nothing to
    // decide and nothing to write. Reporting it either way would make a plan that
    // needs no owner input look like one that does.
    if (existing === incoming) continue;
    if (existing) conflicts.push({ field, workspaceValue: existing, projectValue: incoming });
    else merges.push({ field, value: incoming });
  }

  return {
    verdict: 'merge-one',
    merges,
    conflicts,
    rebindSessionIds: [...project.sessionIds],
    assetCount: project.assetCount,
    contenders: [],
    recovery,
  };
}

/** True when applying needs no owner input: something to do, and nothing contested. */
export function isPlanUnattended(plan: MigrationPlan): boolean {
  return plan.verdict === 'merge-one' && plan.conflicts.length === 0;
}
