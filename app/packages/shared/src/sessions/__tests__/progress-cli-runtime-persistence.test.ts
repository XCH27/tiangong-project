import { describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { readSessionJsonl, writeSessionJsonl } from '../jsonl.ts';
import { SESSION_PERSISTENT_FIELDS, type StoredSession } from '../types.ts';
import { pickSessionFields } from '../utils.ts';

function makeStoredSession(overrides: Partial<StoredSession> = {}): StoredSession {
  return {
    id: '260623-progress-runtime',
    workspaceRootPath: '/tmp/workspace',
    createdAt: 1,
    lastUsedAt: 2,
    messages: [],
    tokenUsage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      contextTokens: 0,
      costUsd: 0,
    },
    ...overrides,
  } as StoredSession;
}

describe('session persistence: progress + CLI runtime selection', () => {
  it('includes progress, runtime and requested CLI model in persistent fields', () => {
    expect(SESSION_PERSISTENT_FIELDS).toContain('progress');
    expect(SESSION_PERSISTENT_FIELDS).toContain('cliRuntimeId');
    expect(SESSION_PERSISTENT_FIELDS).toContain('cliRuntimeModelId');
  });

  it('pickSessionFields preserves progress and cliRuntimeId', () => {
    const picked = pickSessionFields({
      ...makeStoredSession({
        progress: [{ id: 'p1', title: '落地 CLI 后端', status: 'completed' }],
        cliRuntimeId: 'grok',
        cliRuntimeModelId: 'grok-4',
      }),
      runtimeOnly: 'ignored',
    });

    expect(picked.progress).toEqual([{ id: 'p1', title: '落地 CLI 后端', status: 'completed' }]);
    expect(picked.cliRuntimeId).toBe('grok');
    expect(picked.cliRuntimeModelId).toBe('grok-4');
    expect((picked as Record<string, unknown>).runtimeOnly).toBeUndefined();
  });

  it('round-trips progress and cliRuntimeId through session.jsonl header', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fleet-session-progress-'));
    const file = join(dir, 'session.jsonl');
    try {
      writeSessionJsonl(file, makeStoredSession({
        workspaceRootPath: dir,
        progress: [
          { id: '1', title: '设计团队编排', status: 'completed' },
          { id: '2', title: '落地 Progress UI', status: 'in_progress', note: '等待前端' },
        ],
        cliRuntimeId: 'hermes',
        cliRuntimeModelId: 'openai/gpt-5',
      }));

      const loaded = readSessionJsonl(file);
      expect(loaded?.progress).toEqual([
        { id: '1', title: '设计团队编排', status: 'completed' },
        { id: '2', title: '落地 Progress UI', status: 'in_progress', note: '等待前端' },
      ]);
      expect(loaded?.cliRuntimeId).toBe('hermes');
      expect(loaded?.cliRuntimeModelId).toBe('openai/gpt-5');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
