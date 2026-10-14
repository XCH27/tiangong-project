/** Replay observations against the unmodified original ZCode workflow engine. */
import { describe, expect, it } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WorkflowEngine, InMemoryJournalStore, type WorkflowDriver } from '../../.fleet/zcode/apps/zcode-cli/packages/dynamic-workflow/src/engine';

// The reference checkout has no TypeScript dependency. Execute the installed candidate only
// after proving its complete package source matches the original (apart from generated TS libs).
const original = fileURLToPath(new URL('../../源码参考/software/ZCode/apps/zcode-cli/packages/dynamic-workflow/src/', import.meta.url));
const installed = fileURLToPath(new URL('../../.fleet/zcode/apps/zcode-cli/packages/dynamic-workflow/src/', import.meta.url));
for (const relative of readdirSync(original, { recursive: true, withFileTypes: false })) {
  if (!relative.endsWith('.ts')) continue;
  expect(readFileSync(join(installed, relative)).equals(readFileSync(join(original, relative)))).toBe(true);
}

function fixture(executeWorldRead: WorkflowDriver['executeWorldRead']) {
  const journal = new InMemoryJournalStore();
  const driver: WorkflowDriver = {
    journal, executeWorldRead, emit() {},
    createActorSession: async () => { throw new Error('No actor expected'); },
    startAsk() { throw new Error('No model call expected'); },
    respondToSubmit() {}, cancelAsk() {},
  };
  const create = (scriptHash = 'fixture-v1') => new WorkflowEngine({
    runId: 'offline-workflow', driver, caps: { maxConcurrency: 1 },
    askSpecs: new Map(), validate: () => [], scriptHash,
  });
  return { journal, create };
}

describe('original workflow replay', () => {
  it('reuses a completed effect from the journal without running it again', async () => {
    let effects = 0;
    const f = fixture(async () => ({ receipt: ++effects }));
    expect(await f.create().worldRead('world#1', 'run', ['fake effect'])).toEqual({ receipt: 1 });
    expect(await f.create().worldRead('world#1', 'run', ['fake effect'])).toEqual({ receipt: 1 });
    expect(effects).toBe(1);
  });

  it('rejects a changed script before resuming a run', () => {
    const f = fixture(async () => null);
    f.create();
    expect(() => f.create('changed-v2')).toThrow('script changed');
    expect(f.journal.getRun('offline-workflow')?.scriptHash).toBe('fixture-v1');
  });

  it('re-dispatches an interrupted world.run whose effect has no committed result', async () => {
    let effects = 0;
    const f = fixture(() => {
      effects++;
      return effects === 1 ? new Promise(() => {}) : Promise.resolve({ receipt: effects });
    });
    // Represents a process disappearing after the external effect but before journal settlement.
    void f.create().worldRead('world#1', 'run', ['fake effect']);
    expect(f.journal.getNode('offline-workflow', 'world#1', 0)?.status ??
      f.journal.listNodes('offline-workflow')[0]?.status).toBe('running');
    await f.create().worldRead('world#1', 'run', ['fake effect']);
    expect(effects).toBe(2);
    // A media/payment adapter must reconcile unknown outcomes before this driver is dispatched.
  });
});
