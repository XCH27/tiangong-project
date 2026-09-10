/**
 * Writing a skill, and choosing where it applies.
 *
 * A skill is a directory with a `SKILL.md`, and until `skills/scope.ts` there
 * was no way to create one except by hand — so an agent could validate a skill
 * (`skill_validate`) and never write one, which is the read-without-write shape
 * this area keeps producing.
 *
 * Scope is the whole point of the tool. `global` reaches every workspace through
 * `~/.agents/skills` **and is shared with other agent tools on this machine**;
 * `workspace` is this workspace only; `project` travels with the repository. The
 * result message always names which one was touched, because a model that writes
 * to the shared global directory without saying so has changed something outside
 * the product the user was looking at.
 *
 * Nothing here overwrites. A slug already taken at the target belongs to whoever
 * wrote it, and the refusal says how to proceed instead.
 */

import {
  moveSkillScope,
  writeSkillToScope,
  type SkillScope,
  type SkillScopeResult,
} from '@craft-agent/shared/skills';
import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

const SCOPES = ['global', 'workspace', 'project'] as const;

export interface ManageSkillArgs {
  action: 'write' | 'move';
  slug: string;
  /** Target scope for `write`, destination for `move`. */
  scope?: SkillScope;
  /** Source scope, required for `move`. */
  fromScope?: SkillScope;
  /** Complete SKILL.md content including frontmatter. Required for `write`. */
  content?: string;
}

function isScope(value: unknown): value is SkillScope {
  return typeof value === 'string' && (SCOPES as readonly string[]).includes(value);
}

/**
 * Frontmatter is checked here rather than left to fail at load time, because a
 * skill missing `name` or `description` is silently skipped by the loader — the
 * agent would report success and the skill would never appear.
 */
function frontmatterProblem(content: string): string | null {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith('---')) {
    return 'SKILL.md must open with a YAML frontmatter block delimited by ---.';
  }
  const end = trimmed.indexOf('\n---', 3);
  if (end === -1) return 'The frontmatter block is never closed with a --- line.';
  const block = trimmed.slice(3, end);
  if (!/^\s*name\s*:/m.test(block)) return 'The frontmatter needs a name field.';
  if (!/^\s*description\s*:/m.test(block)) return 'The frontmatter needs a description field.';
  return null;
}

function toResult(outcome: SkillScopeResult): ToolResult {
  if (!outcome.ok) return errorResponse(outcome.message);
  return successResponse(
    JSON.stringify(
      {
        ok: true,
        message: outcome.message,
        path: outcome.path,
        touchedSharedGlobal: outcome.touchedSharedGlobal ?? false,
      },
      null,
      2,
    ),
  );
}

export async function handleManageSkill(
  ctx: SessionToolContext,
  args: ManageSkillArgs,
): Promise<ToolResult> {
  const workspaceRoot = ctx.workspacePath?.trim();
  if (!workspaceRoot) {
    return errorResponse('No workspace folder is bound to this session.');
  }
  const projectRoot =
    ctx.workingDirectory?.trim() || ctx.getSessionInfo?.()?.workingDirectory?.trim() || undefined;
  const roots = { workspaceRoot, projectRoot };

  const slug = args.slug?.trim();
  if (!slug) return errorResponse('slug is required.');

  if (args.action === 'write') {
    if (!isScope(args.scope)) {
      return errorResponse(`scope must be one of ${SCOPES.join(', ')}.`);
    }
    const content = args.content;
    if (!content?.trim()) return errorResponse('content is required to write a skill.');

    const problem = frontmatterProblem(content);
    if (problem) {
      return errorResponse(
        `${problem} A skill without both fields is skipped by the loader, so it would look written and never appear.`,
      );
    }

    return toResult(writeSkillToScope({ slug, scope: args.scope, roots, content }));
  }

  if (args.action === 'move') {
    if (!isScope(args.fromScope) || !isScope(args.scope)) {
      return errorResponse(`fromScope and scope must each be one of ${SCOPES.join(', ')}.`);
    }
    return toResult(moveSkillScope({ slug, from: args.fromScope, to: args.scope, roots }));
  }

  return errorResponse("action must be 'write' or 'move'.");
}
