/** Real SIGKILL/reopen of Pi SQLite with a local fake external service. No model or paid calls. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const packages = new URL('../../源码参考/software/pi-mono-latest/packages/', import.meta.url);
globalThis.fetch = () => { throw new Error('OFFLINE_NETWORK_BLOCKED'); };

async function worker(directory, phase, mode) {
  const { Harness, createRegistry, defineDoc, defineTask } = await import(new URL('durable/dist/index.js', packages));
  const { createModels } = await import(new URL('ai/dist/index.js', packages));
  const { openNodeSqliteStorage } = await import(new URL('durable/dist/storage/sqlite/node.js', packages));
  const { BACKGROUND_CONTEXT: context } = await import(new URL('chord/dist/context/index.js', packages));
  const job = defineDoc({ kind: 'fleet.probe.crash-job', version: 1, scope: 'session',
    initial: () => ({ status: 'created', key: null, receipt: null }) });
  const providerFile = join(directory, 'fake-provider.json');
  const task = defineTask({
    name: 'fleet.probe.media-effect', version: 1, initial: () => ({ phase: 'prepare' }),
    phases: {
      prepare: async (record, runtime, ctx) => runtime.commit(async tx => {
        const key = `operation-${record.id}`;
        Object.assign(await tx.doc(job), { status: 'requested', key });
        return { status: 'running', checkpoint: { phase: 'effect', key } };
      }, ctx),
      effect: async (record, runtime, ctx) => {
        const key = record.state.checkpoint.key;
        if (phase === 'start') {
          // Simulated service accepted the charge before the host could store its response.
          writeFileSync(providerFile, JSON.stringify({ calls: 1, key,
            receipt: mode === 'queryable' ? 'fake-artifact-1' : null }), { flush: true });
          process.kill(process.pid, 'SIGKILL');
          await new Promise(() => {});
        }
        const provider = JSON.parse(await readFile(providerFile, 'utf8'));
        assert.equal(provider.key, key);
        // A provider without a queryable receipt must stop at an unknown outcome.
        await runtime.commit(async tx => {
          const state = await tx.doc(job);
          state.receipt = provider.receipt;
          state.status = provider.receipt ? 'completed' : 'needs-reconciliation';
          return provider.receipt
            ? { status: 'terminal', outcome: { status: 'completed', result: provider.receipt } }
            : { status: 'terminal', outcome: { status: 'failed', message: 'External outcome unknown' } };
        }, ctx);
      },
    },
    abort: async (_record, runtime, ctx) => runtime.commit(() => ({ status: 'terminal', outcome: { status: 'aborted' } }), ctx),
  });
  const registry = createRegistry();
  registry.tasks.add(task);
  const harness = await Harness.open(await openNodeSqliteStorage(join(directory, 'session.sqlite')),
    { registry, models: createModels() }, context);
  const root = await harness.root(context);
  try {
    let id;
    if (phase === 'start') {
      id = await root.commit(tx => tx.createTask(task, {}), context);
      writeFileSync(join(directory, 'task.json'), JSON.stringify({ id }), { flush: true });
    } else {
      ({ id } = JSON.parse(await readFile(join(directory, 'task.json'), 'utf8')));
    }
    harness.resume();
    await harness.waitForTask(id, context);
    process.stdout.write(JSON.stringify(await harness.snapshot(job, context)));
  } finally { await harness.close(context); }
}

async function child(directory, phase, mode) {
  return await new Promise((resolve, reject) => {
    const processChild = spawn(process.execPath, [scriptPath, '--worker', directory, phase, mode], {
      cwd: directory, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '', stderr = '';
    const deadline = setTimeout(() => processChild.kill('SIGKILL'), 15_000);
    processChild.stdout.on('data', chunk => { stdout += chunk; });
    processChild.stderr.on('data', chunk => { stderr += chunk; });
    processChild.on('error', error => { clearTimeout(deadline); reject(error); });
    processChild.on('close', (code, signal) => { clearTimeout(deadline); resolve({ code, signal, stdout, stderr }); });
  });
}

if (process.argv[2] === '--worker') {
  await worker(...process.argv.slice(3));
} else {
  for (const mode of ['queryable', 'unknown']) {
    const directory = await mkdtemp(join(tmpdir(), 'fleet-durable-kill-'));
    try {
      const killed = await child(directory, 'start', mode);
      assert.equal(killed.signal, 'SIGKILL', killed.stderr);
      const recovered = await child(directory, 'recover', mode);
      assert.equal(recovered.code, 0, recovered.stderr);
      const state = JSON.parse(recovered.stdout);
      assert.equal(state.status, mode === 'queryable' ? 'completed' : 'needs-reconciliation');
      const again = await child(directory, 'reopen', mode);
      assert.equal(again.code, 0, again.stderr);
      assert.deepEqual(JSON.parse(again.stdout), state);
      assert.equal(JSON.parse(await readFile(join(directory, 'fake-provider.json'), 'utf8')).calls, 1);
      process.stdout.write(`PASS ${mode}: real process kill, persisted intent, reopen twice, one fake external effect.\n`);
    } finally { await rm(directory, { recursive: true, force: true }); }
  }
}
