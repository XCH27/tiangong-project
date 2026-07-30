/**
 * EnterPlan Handler
 *
 * Mechanism reuse (EVIDENCE_ONLY sources — absorb behavior, not runtime):
 * - Grok Build `enter_plan_mode` + `PlanModeTracker::activate_from_tool`:
 *   agent-initiated Plan entry, mid-turn safe, no abort, idempotent when already Active.
 * - OpenCode `build` agent + `plan_enter` description (`plan-enter.txt`):
 *   default stays Build/Execute; Plan only when approach is ambiguous or user asks.
 *   Exit to implement is separate (Fleet: SubmitPlan ≈ OpenCode `plan_exit`).
 */

import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

export interface EnterPlanArgs {
  /** Optional short reason (logs / tool result only). */
  reason?: string;
}

export interface EnterPlanResult {
  /** false when already in Plan (Grok activate_from_tool no-op). */
  activated: boolean;
}

/**
 * Handle the EnterPlan tool call.
 *
 * 1. Invokes onEnterPlan so SessionManager projects workMode=plan (safe gate)
 * 2. Continues the turn (no forceAbort) — write plan, then SubmitPlan
 */
export async function handleEnterPlan(
  ctx: SessionToolContext,
  args: EnterPlanArgs
): Promise<ToolResult> {
  if (!ctx.callbacks.onEnterPlan) {
    return errorResponse(
      'EnterPlan is not available in this runtime. Switch to Plan from the work-mode control, or submit a plan with SubmitPlan when ready.'
    );
  }

  let activated = true;
  try {
    const result = ctx.callbacks.onEnterPlan(args.reason);
    if (result && typeof result === 'object' && 'activated' in result) {
      activated = Boolean(result.activated);
    }
  } catch (error) {
    return errorResponse(
      `Failed to enter Plan phase: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  const reasonSuffix = args.reason?.trim()
    ? ` Reason recorded: ${args.reason.trim()}.`
    : '';

  if (!activated) {
    return successResponse(
      `Already in Plan phase.${reasonSuffix} Continue the plan under plansFolderPath, then call SubmitPlan when ready for user review. Do not mutate project files except the plan artifact.`
    );
  }

  return successResponse(
    `Entered Plan phase.${reasonSuffix} Continue investigating as needed. Write the plan markdown under plansFolderPath, then call SubmitPlan when ready for user review. Do not mutate project files except the plan artifact.`
  );
}
