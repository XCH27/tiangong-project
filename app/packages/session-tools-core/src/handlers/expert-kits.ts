/**
 * Expert kit tools — so a kit can be assembled in conversation.
 *
 * Qoder's plugin authoring is a skill the agent runs: it asks the user's role,
 * drafts a kit, resolves connectors, then writes the package. That flow is only
 * possible because the agent can *see* what is installed and *write* the kit.
 * Fleet had neither: `skill_validate` was the only skill-facing tool, and the
 * kit payload had no writer at all until H38.
 *
 * Two tools, not one, and the split is deliberate. Reading what exists is
 * `safeMode: 'allow'` because an agent that cannot even look at the kits in safe
 * mode cannot help you plan one; writing is `safeMode: 'block'` and goes through
 * the ordinary permission path like every other mutation.
 *
 * **The permission line, stated once.** `requestedPermissionMode` is a request
 * and nothing here grants it. A tool that let an agent widen its own permission
 * mode would be a second authority over the one decision the permission path
 * exists to make, and every other control in the product would become
 * decorative. The kit records what a role *asks* for; the permission path
 * decides, and may return something narrower (H14,
 * `agent/permission-intersection.ts`: privilege never expands past the parent).
 * Enabling or disabling a skill is a different act and is allowed here: a kit
 * narrows what the agent *sees*, never what it *may do*.
 */

import { flattenLabels, type LabelConfig } from '@craft-agent/shared/labels';
import { createLabel, updateLabel, deleteLabel } from '@craft-agent/shared/labels/crud';
import { loadLabelConfig } from '@craft-agent/shared/labels/storage';
import { normalizeLabelKind } from '@craft-agent/shared/labels/kind-normalize';
import { resolveKitCatalog } from '@craft-agent/shared/labels/kit-resolve';
import { loadAllSkills } from '@craft-agent/shared/skills';
import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

const PERMISSION_MODES = ['safe', 'ask', 'allow-all'] as const;
type RequestedPermissionMode = (typeof PERMISSION_MODES)[number];

export interface ListExpertKitsArgs {
  /** Include the installed skills a kit could carry. Default true. */
  includeAvailableSkills?: boolean;
}

export interface ManageExpertKitArgs {
  action: 'create' | 'update' | 'delete';
  /** Required for update and delete. */
  labelId?: string;
  /** Required for create. */
  name?: string;
  systemPromptPreset?: string;
  /** Replaces the kit's skill list whole. Slugs must name installed skills. */
  skills?: string[];
  /** A request the permission path may narrow. Never a grant. */
  requestedPermissionMode?: RequestedPermissionMode;
}

function resolveWorkspaceRoot(ctx: SessionToolContext): string | null {
  const fromField = ctx.workingDirectory?.trim();
  if (fromField) return fromField;
  const fromSession = ctx.getSessionInfo?.()?.workingDirectory?.trim();
  if (fromSession) return fromSession;
  const fromWorkspace = ctx.workspacePath?.trim();
  return fromWorkspace || null;
}

function isKit(label: LabelConfig): boolean {
  return normalizeLabelKind(label.kind) === 'expert';
}

/**
 * Read the kits and, unless asked not to, the skills they could carry.
 *
 * Both in one call because the authoring question is always "what exists, and
 * what could I put in it" — two tools for that would spend an extra turn and an
 * extra slot in a budget that is already the product's scarcest resource (H13).
 */
export async function handleListExpertKits(
  ctx: SessionToolContext,
  args: ListExpertKitsArgs = {}
): Promise<ToolResult> {
  const workspaceRoot = resolveWorkspaceRoot(ctx);
  if (!workspaceRoot) {
    return errorResponse('No workspace folder is bound to this session.');
  }

  let installed: ReturnType<typeof loadAllSkills>;
  try {
    installed = loadAllSkills(workspaceRoot, ctx.workingDirectory);
  } catch {
    installed = [];
  }

  let labels: LabelConfig[];
  try {
    labels = flattenLabels(loadLabelConfig(workspaceRoot).labels);
  } catch (error) {
    return errorResponse(
      `Could not read the label store: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const kits = labels.filter(isKit).map((label) => {
    const { catalog, unresolved } = resolveKitCatalog(label.expertKit?.skills, installed);
    return {
      id: label.id,
      name: label.name,
      systemPromptPreset: label.systemPromptPreset ?? null,
      skills: catalog.map((skill) => skill.id),
      // Named rather than dropped: a kit that carries fewer skills than it
      // declares looks like a specialist that cannot do its job, and the
      // missing file is the last place anyone looks.
      skillsNotInstalled: unresolved,
      sources: label.expertKit?.sources ?? [],
      tools: label.expertKit?.tools ?? [],
      requestedPermissionMode: label.expertKit?.requestedPermissionMode ?? null,
    };
  });

  const payload: Record<string, unknown> = { kits };
  if (args.includeAvailableSkills !== false) {
    payload.availableSkills = installed.map((skill) => ({
      slug: skill.slug,
      name: skill.metadata.name,
      description: skill.metadata.description,
      // Where it lives is where it applies: `global` reaches every workspace,
      // `workspace` only this one, `project` only this project folder.
      scope: skill.source,
      triggers: skill.metadata.triggers ?? [],
    }));
  }

  return successResponse(JSON.stringify(payload, null, 2));
}

/** Create, update or delete one expert kit. */
export async function handleManageExpertKit(
  ctx: SessionToolContext,
  args: ManageExpertKitArgs
): Promise<ToolResult> {
  const workspaceRoot = resolveWorkspaceRoot(ctx);
  if (!workspaceRoot) {
    return errorResponse('No workspace folder is bound to this session.');
  }

  const action = args.action;
  if (action !== 'create' && action !== 'update' && action !== 'delete') {
    return errorResponse("action must be one of 'create', 'update' or 'delete'.");
  }

  if (args.requestedPermissionMode && !PERMISSION_MODES.includes(args.requestedPermissionMode)) {
    return errorResponse(
      `requestedPermissionMode must be one of ${PERMISSION_MODES.join(', ')}.`
    );
  }

  // Refuse a slug that names nothing rather than writing a kit that will resolve
  // to less than it says. The alternative is a kit that looks right in the file
  // and behaves smaller at runtime, which is the failure H36 recorded.
  let unknownSkills: readonly string[] = [];
  if (args.skills && args.skills.length > 0) {
    let installed: ReturnType<typeof loadAllSkills>;
    try {
      installed = loadAllSkills(workspaceRoot, ctx.workingDirectory);
    } catch {
      installed = [];
    }
    unknownSkills = resolveKitCatalog(args.skills, installed).unresolved;
    if (unknownSkills.length > 0) {
      return errorResponse(
        `These skills are not installed: ${unknownSkills.join(', ')}. ` +
          'Call list_expert_kits to see what is available, or install the skill first.'
      );
    }
  }

  try {
    if (action === 'delete') {
      const labelId = args.labelId?.trim();
      if (!labelId) return errorResponse('labelId is required to delete a kit.');
      deleteLabel(workspaceRoot, labelId);
      return successResponse(`Deleted kit ${labelId}.`);
    }

    if (action === 'create') {
      const name = args.name?.trim();
      if (!name) return errorResponse('name is required to create a kit.');
      const created = createLabel(workspaceRoot, {
        name,
        kind: 'expert',
        ...(args.systemPromptPreset ? { systemPromptPreset: args.systemPromptPreset } : {}),
        ...(args.skills || args.requestedPermissionMode
          ? {
              expertKit: {
                ...(args.skills ? { skills: args.skills } : {}),
                ...(args.requestedPermissionMode
                  ? { requestedPermissionMode: args.requestedPermissionMode }
                  : {}),
              },
            }
          : {}),
      });
      return successResponse(
        JSON.stringify({ id: created.id, name: created.name, skills: created.expertKit?.skills ?? [] }, null, 2)
      );
    }

    const labelId = args.labelId?.trim();
    if (!labelId) return errorResponse('labelId is required to update a kit.');

    // The payload is replaced whole, so an update that touches one of its fields
    // must carry the others or it silently clears them.
    const existing = flattenLabels(loadLabelConfig(workspaceRoot).labels).find(
      (label) => label.id === labelId
    );
    if (!existing) return errorResponse(`No label with id ${labelId}.`);

    const touchesPayload = args.skills !== undefined || args.requestedPermissionMode !== undefined;
    const updated = updateLabel(workspaceRoot, labelId, {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.systemPromptPreset !== undefined
        ? { systemPromptPreset: args.systemPromptPreset }
        : {}),
      kind: 'expert',
      ...(touchesPayload
        ? {
            expertKit: {
              skills: args.skills ?? existing.expertKit?.skills ?? [],
              ...(existing.expertKit?.sources ? { sources: existing.expertKit.sources } : {}),
              ...(existing.expertKit?.tools ? { tools: existing.expertKit.tools } : {}),
              ...(args.requestedPermissionMode ?? existing.expertKit?.requestedPermissionMode
                ? {
                    requestedPermissionMode:
                      args.requestedPermissionMode ??
                      existing.expertKit?.requestedPermissionMode,
                  }
                : {}),
            },
          }
        : {}),
    });

    return successResponse(
      JSON.stringify(
        {
          id: updated.id,
          name: updated.name,
          skills: updated.expertKit?.skills ?? [],
          requestedPermissionMode: updated.expertKit?.requestedPermissionMode ?? null,
          note:
            updated.expertKit?.requestedPermissionMode
              ? 'requestedPermissionMode is a request. The permission path decides and may return something narrower.'
              : undefined,
        },
        null,
        2
      )
    );
  } catch (error) {
    return errorResponse(
      `Could not ${action} the kit: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
