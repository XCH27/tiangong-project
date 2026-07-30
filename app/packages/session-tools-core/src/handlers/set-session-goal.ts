import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

export interface SetSessionGoalArgs {
  sessionId?: string;
  goal: string | null;
}

export async function handleSetSessionGoal(
  ctx: SessionToolContext,
  args: SetSessionGoalArgs
): Promise<ToolResult> {
  if (!ctx.setSessionGoal) {
    return errorResponse('set_session_goal is not available in this context.');
  }

  try {
    const normalizedGoal = args.goal?.trim() || null;
    await ctx.setSessionGoal(args.sessionId, normalizedGoal);
    const target = args.sessionId ? `session ${args.sessionId}` : 'current session';
    return successResponse(
      normalizedGoal
        ? `Goal set on ${target}: ${normalizedGoal}`
        : `Goal cleared on ${target}.`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to set goal: ${message}`);
  }
}
