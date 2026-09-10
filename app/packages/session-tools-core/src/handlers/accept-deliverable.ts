import { relative } from 'node:path';
import {
  acceptDeliverable,
  type DeliverableEvidenceRef,
} from '@craft-agent/shared/workspaces';
import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';
import { handleSetSessionStatus } from './set-session-status.ts';

export interface AcceptDeliverableArgs {
  sourcePath: string;
  evidence?: Array<{ kind: DeliverableEvidenceRef['kind']; id: string }>;
}

const REVIEW_STATUS = 'needs-review';
const ACCEPTED_LABEL = 'accepted';

/**
 * Copy the accepted Project file into deliverables/ via the R3 helper.
 * Never sets done/cancelled. Optional needs-review / accepted use the
 * existing status and label authorities only when those already exist.
 */
export async function handleAcceptDeliverable(
  ctx: SessionToolContext,
  args: AcceptDeliverableArgs
): Promise<ToolResult> {
  const sourcePath = args.sourcePath?.trim();
  if (!sourcePath) {
    return errorResponse('sourcePath is required.');
  }

  const workspaceRoot = resolveWorkspaceRoot(ctx);
  if (!workspaceRoot) {
    return errorResponse(
      'No Project folder is bound to this session. Set a working directory before accepting a deliverable.'
    );
  }

  const sessionId = ctx.sessionId?.trim();
  if (!sessionId) {
    return errorResponse('A session id is required so the delivered copy can be traced.');
  }

  let result;
  try {
    result = acceptDeliverable({
      workspaceRoot,
      sessionId,
      sourcePath,
      evidence: args.evidence,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to accept deliverable: ${message}`);
  }

  if (!result.ok) {
    return errorResponse(`${result.reason}: ${result.message}`);
  }

  const extras: string[] = [];
  await applyNeedsReview(ctx, extras);
  await applyAcceptedLabel(ctx, extras);

  const destRel = relative(workspaceRoot, result.destPath).split('\\').join('/');
  return successResponse(
    [
      `Accepted ${sourcePath} → ${destRel}.`,
      `sha256: ${result.sha256}`,
      `recovery: ${result.recovery}`,
      ...extras,
      'Do not set done or cancelled — closing a task is the user\'s decision.',
    ].join('\n')
  );
}

function resolveWorkspaceRoot(ctx: SessionToolContext): string | null {
  const fromField = ctx.workingDirectory?.trim();
  if (fromField) return fromField;
  const fromSession = ctx.getSessionInfo?.()?.workingDirectory?.trim();
  if (fromSession) return fromSession;
  const fromWorkspace = ctx.workspacePath?.trim();
  return fromWorkspace || null;
}

async function applyNeedsReview(ctx: SessionToolContext, extras: string[]): Promise<void> {
  if (!ctx.setSessionStatus) return;
  try {
    const statusResult = await handleSetSessionStatus(ctx, { status: REVIEW_STATUS });
    const text = statusResult.content[0]?.text;
    if (text) extras.push(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    extras.push(`Status not updated: ${message}`);
  }
}

async function applyAcceptedLabel(ctx: SessionToolContext, extras: string[]): Promise<void> {
  if (!ctx.resolveLabels || !ctx.setSessionLabels || !ctx.getSessionInfo) return;

  const check = ctx.resolveLabels([ACCEPTED_LABEL]);
  if (check.unknown.length > 0 || check.resolved.length === 0) {
    extras.push('Label "accepted" is not in the catalog; not created.');
    return;
  }

  const acceptedId = check.resolved[0];
  if (!acceptedId) return;

  try {
    const current = ctx.getSessionInfo()?.labels ?? [];
    if (current.includes(acceptedId)) {
      extras.push(`Label "${acceptedId}" already present.`);
      return;
    }
    await ctx.setSessionLabels(undefined, [...current, acceptedId]);
    extras.push(`Label "${acceptedId}" added.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    extras.push(`Label not updated: ${message}`);
  }
}
