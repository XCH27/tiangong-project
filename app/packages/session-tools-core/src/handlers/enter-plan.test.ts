import { describe, expect, it } from 'bun:test';
import { handleEnterPlan } from './enter-plan.ts';
import type { SessionToolContext } from '../context.ts';

function makeCtx(overrides?: Partial<SessionToolContext['callbacks']>): SessionToolContext {
  return {
    sessionId: 's1',
    workspacePath: '/tmp/ws',
    get sourcesPath() {
      return '/tmp/ws/sources';
    },
    get skillsPath() {
      return '/tmp/ws/skills';
    },
    plansFolderPath: '/tmp/ws/plans',
    callbacks: {
      onPlanSubmitted: () => {},
      onAuthRequest: () => {},
      ...overrides,
    },
    fs: {
      exists: () => false,
      readFile: () => '',
      readFileBuffer: () => Buffer.from(''),
      writeFile: () => {},
      isDirectory: () => false,
      readdir: () => [],
      stat: () => ({ size: 0, isDirectory: () => false }),
    },
    loadSourceConfig: () => null,
  } as SessionToolContext;
}

describe('handleEnterPlan', () => {
  it('errors when onEnterPlan is not wired', async () => {
    const result = await handleEnterPlan(makeCtx(), {});
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('not available');
  });

  it('invokes callback and returns guidance without requiring a plan file', async () => {
    const reasons: Array<string | undefined> = [];
    const result = await handleEnterPlan(
      makeCtx({
        onEnterPlan: (reason) => {
          reasons.push(reason);
          return { activated: true };
        },
      }),
      { reason: 'broad refactor' },
    );

    expect(result.isError).toBeFalsy();
    expect(reasons).toEqual(['broad refactor']);
    expect(result.content[0]?.text).toContain('Entered Plan phase');
    expect(result.content[0]?.text).toContain('SubmitPlan');
    expect(result.content[0]?.text).toContain('broad refactor');
  });

  it('reports already-in-plan when callback returns activated false (Grok no-op)', async () => {
    const result = await handleEnterPlan(
      makeCtx({
        onEnterPlan: () => ({ activated: false }),
      }),
      {},
    );

    expect(result.isError).toBeFalsy();
    expect(result.content[0]?.text).toContain('Already in Plan');
    expect(result.content[0]?.text).toContain('SubmitPlan');
  });
});
