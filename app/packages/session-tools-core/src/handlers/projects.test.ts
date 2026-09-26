import { describe, it, expect } from 'bun:test';
import {
  handleListProjects,
  handleOpenProjectFolder,
  handleUpdateProject,
  handleSetSessionProject,
} from './projects.ts';
import type { SessionToolContext, ProjectsToolCallbacks, ProjectToolSummary } from '../context.ts';

const PROJECT: ProjectToolSummary = { id: 'proj_1', name: 'app', folder: '/work/app', archived: false, updatedAt: 2 };
const ARCHIVED: ProjectToolSummary = { id: 'proj_2', name: 'old', folder: '/work/old', archived: true, updatedAt: 1 };

function createCtx(projects?: ProjectsToolCallbacks) {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const record = (method: string, ...args: unknown[]) => calls.push({ method, args });
  const callbacks: ProjectsToolCallbacks = projects ?? {
    listProjects: () => { record('listProjects'); return [PROJECT, ARCHIVED]; },
    openProjectFolder: (folder) => { record('openProjectFolder', folder); return PROJECT; },
    updateProject: (id, patch) => { record('updateProject', id, patch); return { ...PROJECT, ...(patch.name ? { name: patch.name } : {}) }; },
    setSessionProject: async (sessionId, projectId) => { record('setSessionProject', sessionId, projectId); },
  };
  return { ctx: { projects: callbacks } as unknown as SessionToolContext, calls };
}

const text = (result: { content: Array<{ text?: string }> }) => result.content[0]?.text ?? '';

describe('project tools', () => {
  it('lists active projects unless archived ones are requested', async () => {
    const { ctx } = createCtx();
    expect(JSON.parse(text(await handleListProjects(ctx, {}))).total).toBe(1);
    expect(JSON.parse(text(await handleListProjects(ctx, { includeArchived: true }))).total).toBe(2);
  });

  it('opens a folder as a project and can move the current session into it', async () => {
    const { ctx, calls } = createCtx();
    const result = await handleOpenProjectFolder(ctx, { folder: '/work/app', moveCurrentSession: true });
    expect(result.isError).toBeFalsy();
    expect(calls.map(c => c.method)).toEqual(['openProjectFolder', 'setSessionProject']);
    expect(calls[1]!.args).toEqual([undefined, 'proj_1']);
  });

  it('refuses an empty update and forwards a real one', async () => {
    const { ctx, calls } = createCtx();
    expect((await handleUpdateProject(ctx, { projectId: 'proj_1' })).isError).toBe(true);
    const result = await handleUpdateProject(ctx, { projectId: 'proj_1', name: 'renamed' });
    expect(JSON.parse(text(result)).project.name).toBe('renamed');
    expect(calls).toEqual([{ method: 'updateProject', args: ['proj_1', { name: 'renamed' }] }]);
  });

  it('takes a session out of any project with null', async () => {
    const { ctx, calls } = createCtx();
    const result = await handleSetSessionProject(ctx, { projectId: null });
    expect(result.isError).toBeFalsy();
    expect(calls[0]!.args).toEqual([undefined, null]);
  });

  it('degrades gracefully without a project backend', async () => {
    const result = await handleListProjects({} as SessionToolContext, {});
    expect(result.isError).toBe(true);
  });
});
