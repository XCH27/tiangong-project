/**
 * Project tool handlers — list_projects / open_project_folder / update_project /
 * set_session_project.
 *
 * A Project is one folder. These are the Agent's path to the same project
 * operations the UI performs (folder picker, project menu), through the backend
 * callbacks in ctx.projects.
 */

import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

const PROJECTS_UNAVAILABLE =
  'Project tools are not available in this context (no project backend is attached to this session).';

function toError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export interface ListProjectsArgs {
  includeArchived?: boolean;
}

export async function handleListProjects(ctx: SessionToolContext, args: ListProjectsArgs): Promise<ToolResult> {
  if (!ctx.projects) return errorResponse(PROJECTS_UNAVAILABLE);
  try {
    const projects = (await ctx.projects.listProjects()).filter(p => args.includeArchived || !p.archived);
    return successResponse(JSON.stringify({ total: projects.length, projects }, null, 2));
  } catch (error) {
    return errorResponse(`Failed to list projects: ${toError(error)}`);
  }
}

export interface OpenProjectFolderArgs {
  folder: string;
  /** Also move the invoking session into this project. */
  moveCurrentSession?: boolean;
}

export async function handleOpenProjectFolder(ctx: SessionToolContext, args: OpenProjectFolderArgs): Promise<ToolResult> {
  if (!ctx.projects) return errorResponse(PROJECTS_UNAVAILABLE);
  try {
    const project = await ctx.projects.openProjectFolder(args.folder);
    if (args.moveCurrentSession) await ctx.projects.setSessionProject(undefined, project.id);
    return successResponse(JSON.stringify({ project, movedCurrentSession: !!args.moveCurrentSession }, null, 2));
  } catch (error) {
    return errorResponse(`Failed to open project folder: ${toError(error)}`);
  }
}

export interface UpdateProjectArgs {
  projectId: string;
  name?: string;
  description?: string | null;
  color?: string | null;
}

export async function handleUpdateProject(ctx: SessionToolContext, args: UpdateProjectArgs): Promise<ToolResult> {
  if (!ctx.projects) return errorResponse(PROJECTS_UNAVAILABLE);
  const { projectId, ...patch } = args;
  if (Object.keys(patch).length === 0) return errorResponse('Nothing to update: pass name, description or color.');
  try {
    const project = await ctx.projects.updateProject(projectId, patch);
    return successResponse(JSON.stringify({ project }, null, 2));
  } catch (error) {
    return errorResponse(`Failed to update project: ${toError(error)}`);
  }
}

export interface SetSessionProjectArgs {
  sessionId?: string;
  projectId: string | null;
}

export async function handleSetSessionProject(ctx: SessionToolContext, args: SetSessionProjectArgs): Promise<ToolResult> {
  if (!ctx.projects) return errorResponse(PROJECTS_UNAVAILABLE);
  try {
    await ctx.projects.setSessionProject(args.sessionId, args.projectId);
    const target = args.sessionId ? `session ${args.sessionId}` : 'current session';
    return successResponse(args.projectId
      ? `Moved ${target} into project ${args.projectId} (its working directory is now the project folder).`
      : `Moved ${target} out of any project.`);
  } catch (error) {
    return errorResponse(`Failed to set session project: ${toError(error)}`);
  }
}
