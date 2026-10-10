import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';
import { refusedSessionWrite } from './refused-session-write.ts';

export interface RenameSessionArgs {
  sessionId?: string;
  name: string;
}

export async function handleRenameSession(
  ctx: SessionToolContext,
  args: RenameSessionArgs
): Promise<ToolResult> {
  if (!ctx.renameSession) {
    return errorResponse('rename_session is not available in this context.');
  }

  try {
    const written = await ctx.renameSession(args.sessionId, args.name);
    const refused = refusedSessionWrite(written);
    if (refused) {
      return errorResponse(`Name was not set: ${refused}.`);
    }
    const target = args.sessionId ? `session ${args.sessionId}` : 'current session';
    return successResponse(`Session renamed to "${args.name}" on ${target}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to rename session: ${message}`);
  }
}
