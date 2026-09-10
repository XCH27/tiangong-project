import { afterEach, describe, expect, it } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseDeliverableDocument } from '@craft-agent/shared/workspaces';
import type { SessionToolContext } from '../context.ts';
import { handleAcceptDeliverable } from './accept-deliverable.ts';

const dirs: string[] = [];

function fixtureWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-r3-tool-'));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

type StatusEntry = { id: string; label: string; category: 'open' | 'closed' };

const STATUSES: StatusEntry[] = [
  { id: 'todo', label: 'Todo', category: 'open' },
  { id: 'in-progress', label: 'In Progress', category: 'open' },
  { id: 'needs-review', label: 'Needs Review', category: 'open' },
  { id: 'done', label: 'Done', category: 'closed' },
  { id: 'cancelled', label: 'Cancelled', category: 'closed' },
];

function createCtx(
  workspaceRoot: string,
  opts?: { acceptedLabel?: boolean },
): {
  ctx: SessionToolContext;
  statuses: string[];
  labels: string[][];
} {
  const statuses: string[] = [];
  const labels: string[][] = [];
  const catalog = opts?.acceptedLabel === false ? ['bug'] : ['accepted', 'bug'];
  const currentLabels: string[] = ['bug'];

  const ctx = {
    sessionId: 'sess-1',
    workspacePath: workspaceRoot,
    workingDirectory: workspaceRoot,
    setSessionStatus: (_sessionId: string | undefined, status: string) => {
      statuses.push(status);
    },
    setSessionLabels: (_sessionId: string | undefined, next: string[]) => {
      labels.push(next);
      currentLabels.splice(0, currentLabels.length, ...next);
    },
    getSessionInfo: () => ({
      id: 'sess-1',
      name: 'Test',
      labels: [...currentLabels],
      status: 'todo',
      permissionMode: 'ask',
      createdAt: 0,
      isActive: true,
      workingDirectory: workspaceRoot,
    }),
    resolveStatus: (input: string) => {
      const available = STATUSES.map((s) => s.id);
      const hit =
        STATUSES.find((s) => s.id === input) ??
        STATUSES.find((s) => s.label.toLowerCase() === input.toLowerCase());
      return hit
        ? { resolved: hit.id, available, category: hit.category }
        : { resolved: null, available };
    },
    resolveLabels: (inputs: string[]) => {
      const resolved: string[] = [];
      const unknown: string[] = [];
      for (const input of inputs) {
        if (catalog.includes(input)) resolved.push(input);
        else unknown.push(input);
      }
      return { resolved, unknown, available: catalog };
    },
  } as unknown as SessionToolContext;

  return { ctx, statuses, labels };
}

describe('handleAcceptDeliverable', () => {
  it('copies the accepted file and sets needs-review, not done', async () => {
    const root = fixtureWorkspace();
    const body = '# Brief\n\nResearch notes.\n';
    writeFileSync(join(root, 'brief.md'), body);
    const { ctx, statuses, labels } = createCtx(root);

    const result = await handleAcceptDeliverable(ctx, {
      sourcePath: 'brief.md',
      evidence: [{ kind: 'session-evidence', id: 'ev-1' }],
    });

    expect(result.isError).toBeFalsy();
    const dest = join(root, 'deliverables', 'brief.md');
    expect(existsSync(dest)).toBe(true);
    const parsed = parseDeliverableDocument(readFileSync(dest, 'utf8'));
    expect(parsed?.body).toBe(body);
    expect(parsed?.provenance.sessionId).toBe('sess-1');
    expect(statuses).toEqual(['needs-review']);
    expect(labels).toEqual([['bug', 'accepted']]);
    expect(result.content[0]?.text).toContain('deliverables/brief.md');
  });

  it('returns an explicit error and writes nothing when the source escapes', async () => {
    const root = fixtureWorkspace();
    const { ctx, statuses, labels } = createCtx(root);

    const result = await handleAcceptDeliverable(ctx, { sourcePath: '../secret.md' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('source-outside-workspace');
    expect(existsSync(join(root, 'deliverables'))).toBe(false);
    expect(statuses).toHaveLength(0);
    expect(labels).toHaveLength(0);
  });

  it('returns overwrite-conflict and leaves the existing deliverable untouched', async () => {
    const root = fixtureWorkspace();
    writeFileSync(join(root, 'brief.md'), 'first');
    const { ctx, statuses } = createCtx(root);

    const first = await handleAcceptDeliverable(ctx, { sourcePath: 'brief.md' });
    expect(first.isError).toBeFalsy();
    statuses.length = 0;

    writeFileSync(join(root, 'brief.md'), 'second');
    const conflict = await handleAcceptDeliverable(ctx, { sourcePath: 'brief.md' });

    expect(conflict.isError).toBe(true);
    expect(conflict.content[0]?.text).toContain('overwrite-conflict');
    const parsed = parseDeliverableDocument(readFileSync(join(root, 'deliverables', 'brief.md'), 'utf8'));
    expect(parsed?.body).toBe('first');
    expect(statuses).toHaveLength(0);
  });

  it('returns an explicit error when the source is missing', async () => {
    const root = fixtureWorkspace();
    const { ctx, statuses } = createCtx(root);

    const result = await handleAcceptDeliverable(ctx, { sourcePath: 'brief.md' });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('source-missing');
    expect(existsSync(join(root, 'deliverables'))).toBe(false);
    expect(statuses).toHaveLength(0);
  });

  it('does not create an accepted label when the catalog lacks it', async () => {
    const root = fixtureWorkspace();
    writeFileSync(join(root, 'brief.md'), 'body');
    const { ctx, labels } = createCtx(root, { acceptedLabel: false });

    const result = await handleAcceptDeliverable(ctx, { sourcePath: 'brief.md' });

    expect(result.isError).toBeFalsy();
    expect(labels).toHaveLength(0);
    expect(result.content[0]?.text).toContain('not in the catalog');
  });
});
