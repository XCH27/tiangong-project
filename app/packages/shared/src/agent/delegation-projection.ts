/**
 * Pure projections of child Session/Task state for inline delegation UI (H11).
 * Surfaces must not own orchestration state — they only project authorities.
 */

import type { CostTier, DelegationSummary } from './delegation-routing.ts';

export interface ChildSessionProjectionInput {
  sessionId: string;
  name?: string | null;
  parentSessionId?: string | null;
  /** Derived activity: running when processing / in-progress. */
  isProcessing?: boolean;
  sessionStatus?: string | null;
  /** Optional model / candidate id when known. */
  model?: string | null;
  costTier?: CostTier;
  escalatedFrom?: string;
}

/**
 * Build compact delegation summaries for a parent conversation strip.
 * Only sessions with parentSessionId === parentId are included.
 */
export function projectDelegationStrip(
  parentSessionId: string,
  children: readonly ChildSessionProjectionInput[],
): readonly DelegationSummary[] {
  return children
    .filter((c) => c.parentSessionId === parentSessionId)
    .map((c) => {
      let status: DelegationSummary['status'] = 'running';
      const s = (c.sessionStatus ?? '').toLowerCase();
      if (s === 'done' || s === 'completed') status = 'completed';
      else if (s === 'cancelled' || s === 'failed' || s === 'needs-review') status = 'failed';
      else if (c.isProcessing) status = 'running';
      else if (s === 'todo') status = 'running';

      return {
        sessionId: c.sessionId,
        candidateId: c.model ?? c.sessionId,
        label: c.name?.trim() || c.model || c.sessionId,
        costTier: c.costTier ?? 'standard',
        status,
        escalatedFrom: c.escalatedFrom,
      };
    });
}

export interface DelegationStripViewModel {
  parentSessionId: string;
  total: number;
  running: number;
  completed: number;
  failed: number;
  items: readonly DelegationSummary[];
  /** One-line status for the strip chrome. */
  headline: string;
}

export function toDelegationStripViewModel(
  parentSessionId: string,
  children: readonly ChildSessionProjectionInput[],
): DelegationStripViewModel {
  const items = projectDelegationStrip(parentSessionId, children);
  const running = items.filter((i) => i.status === 'running').length;
  const completed = items.filter((i) => i.status === 'completed').length;
  const failed = items.filter((i) => i.status === 'failed' || i.status === 'escalated').length;
  const parts: string[] = [];
  if (running) parts.push(`${running} running`);
  if (completed) parts.push(`${completed} done`);
  if (failed) parts.push(`${failed} needs attention`);
  return {
    parentSessionId,
    total: items.length,
    running,
    completed,
    failed,
    items,
    headline: items.length === 0 ? 'No delegated work' : parts.join(' · ') || `${items.length} delegated`,
  };
}
