import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';
import { normalizeProgressTasks, summarizeProgress, type ProgressTask } from '@craft-agent/shared/protocol';

export interface SetSessionProgressArgs {
  sessionId?: string;
  tasks: ProgressTask[];
}

/**
 * set_session_progress（docs/35）：替换会话当前任务进度清单。
 * agent-native：人和 Agent 共用同一条路径 → SessionEvent → timeline。
 */
export async function handleSetSessionProgress(
  ctx: SessionToolContext,
  args: SetSessionProgressArgs
): Promise<ToolResult> {
  if (!ctx.setSessionProgress) {
    return errorResponse('set_session_progress is not available in this context.');
  }

  try {
    const tasks = normalizeProgressTasks(args.tasks);
    await ctx.setSessionProgress(args.sessionId, tasks);
    const target = args.sessionId ? `session ${args.sessionId}` : 'current session';
    if (tasks.length === 0) {
      return successResponse(`Progress cleared on ${target}.`);
    }
    const { done, total, activeTitle } = summarizeProgress(tasks);
    const active = activeTitle ? ` · in progress: ${activeTitle}` : '';
    return successResponse(`Progress updated on ${target}: ${done}/${total} done${active}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to set progress: ${message}`);
  }
}
