import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { TokenUsage } from '@craft-agent/core/types';
import type { CreateSessionOptions } from '@craft-agent/shared/protocol';
import { parseTaskSpec, saveTaskSpec, readRunLog, readNodeOutput, type TaskSpec } from '@craft-agent/shared/tasks';
import type { SessionCompletionEvent } from '../sessions/SessionManager';
import { TaskRunner, __resetWorkspaceInFlightForTests, type ConductorSessionHost } from './TaskRunner';

// Flush pending microtasks so the runner's async dispatch (create → column → send) settles.
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

function tu(inputTokens: number, outputTokens: number): TokenUsage {
  return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, contextTokens: 0, costUsd: 0 };
}

function specOf(raw: unknown): TaskSpec {
  const r = parseTaskSpec(raw);
  if (!r.success) throw new Error('bad fixture: ' + JSON.stringify(r.error.issues));
  return r.data;
}

/** Mock host: records calls; the test drives completions via complete(). */
class MockHost implements ConductorSessionHost {
  // A Set, mirroring SessionManager — the Conductor keeps its main subscription AND a one-shot
  // verdict listener attached at the same time while a run is `verifying`.
  private readonly listeners = new Set<(evt: SessionCompletionEvent) => void>();
  readonly created: { id: string; options: CreateSessionOptions }[] = [];
  readonly sent: { sessionId: string; message: string }[] = [];
  readonly statuses: { sessionId: string; status: string }[] = [];
  readonly columns: { sessionId: string; column: string | null }[] = [];
  readonly nodeCounts: { sessionId: string; count: number }[] = [];
  readonly cancelled: string[] = [];
  readonly finalTextById = new Map<string, string>();

  async createSession(_workspaceId: string, options: CreateSessionOptions): Promise<{ id: string }> {
    const id = `sess-${options.name}`;
    this.created.push({ id, options });
    return { id };
  }
  async sendMessage(sessionId: string, message: string): Promise<void> {
    this.sent.push({ sessionId, message });
  }
  async setSessionStatus(sessionId: string, status: string): Promise<void> {
    this.statuses.push({ sessionId, status });
  }
  async setKanbanColumn(sessionId: string, column: string | null): Promise<void> {
    this.columns.push({ sessionId, column });
  }
  async setTaskNodeCount(sessionId: string, count: number): Promise<void> {
    this.nodeCounts.push({ sessionId, count });
  }
  async cancelProcessing(sessionId: string): Promise<void> {
    this.cancelled.push(sessionId);
  }
  onSessionComplete(listener: (evt: SessionCompletionEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  getSessionFinalText(sessionId: string): string | undefined {
    return this.finalTextById.get(sessionId);
  }
  workingDirById = new Map<string, string>();
  getSessionWorkingDirectory(sessionId: string): string | undefined {
    return this.workingDirById.get(sessionId);
  }
  permissionById = new Map<string, import('@craft-agent/shared/agent/mode-types').PermissionMode>();
  getSessionPermissionMode(sessionId: string): import('@craft-agent/shared/agent/mode-types').PermissionMode | undefined {
    return this.permissionById.get(sessionId);
  }
  runtimeById = new Map<string, { exists: boolean; isProcessing: boolean; finalText?: string }>();
  getSessionRuntimeState(sessionId: string) {
    return this.runtimeById.get(sessionId);
  }

  // --- test helpers (sessionId is derived from the node title, which defaults to the node id) ---
  sessionIdFor(nodeId: string): string {
    return `sess-${nodeId}`;
  }
  promptFor(nodeId: string): string | undefined {
    return this.sent.find((s) => s.sessionId === this.sessionIdFor(nodeId))?.message;
  }
  dispatchedNames(): string[] {
    return this.created.map((c) => c.options.name!).filter(Boolean);
  }
  complete(nodeId: string, opts: { reason?: SessionCompletionEvent['reason']; finalText?: string; tokenUsage?: TokenUsage } = {}): void {
    this.completeSession(this.sessionIdFor(nodeId), opts);
  }
  /** Fire a completion for an arbitrary session id (e.g. the orchestrator's verification verdict). */
  completeSession(sessionId: string, opts: { reason?: SessionCompletionEvent['reason']; finalText?: string; tokenUsage?: TokenUsage } = {}): void {
    const evt: SessionCompletionEvent = {
      sessionId,
      workspaceId: 'ws',
      reason: opts.reason ?? 'complete',
      finalText: opts.finalText,
      tokenUsage: opts.tokenUsage,
    };
    for (const listener of [...this.listeners]) listener(evt);
  }
}

describe('TaskRunner (Conductor)', () => {
  let root: string;
  let host: MockHost;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'conductor-test-'));
    host = new MockHost();
    __resetWorkspaceInFlightForTests();
  });
  afterEach(() => {
    __resetWorkspaceInFlightForTests();
    rmSync(root, { recursive: true, force: true });
  });

  function makeRunner() {
    return new TaskRunner({ host, workspaceId: 'ws', workspaceRoot: root, now: () => '2026-06-07T00:00:00.000Z' });
  }

  it('runs a dependency chain, feeding each output into the next', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'demo',
        title: 'Demo',
        goal: 'audit then design then implement',
        nodes: [
          { id: 'audit', prompt: 'Audit the code' },
          { id: 'design', depends_on: ['audit'], prompt: 'Design using ${nodes.audit.output}' },
          { id: 'impl', depends_on: ['design'], prompt: 'Implement ${nodes.design.output}' },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('demo', { runId: 'r1', orchestratorSessionId: 'orch' });
    await tick();

    expect(host.dispatchedNames()).toEqual(['audit']);
    expect(host.promptFor('audit')).toBe('Audit the code');

    host.complete('audit', { finalText: 'AUDIT', tokenUsage: tu(10, 5) });
    await tick();
    expect(host.dispatchedNames()).toEqual(['audit', 'design']);
    expect(host.promptFor('design')).toBe('Design using AUDIT');

    host.complete('design', { finalText: 'DESIGN', tokenUsage: tu(20, 10) });
    await tick();
    expect(host.promptFor('impl')).toBe('Implement DESIGN');

    host.complete('impl', { finalText: 'IMPL', tokenUsage: tu(5, 5) });
    await tick();

    // All nodes done → the run is verifying (not yet terminal) until the orchestrator returns a verdict.
    expect(runner.getRunState('demo', 'r1')!.status).toBe('verifying');
    expect(host.sent.some((s) => s.sessionId === 'orch' && s.message.includes('finished running'))).toBe(true);

    host.completeSession('orch', { finalText: 'Looks correct.\nVERDICT: PASS' });
    await tick();

    const snap = runner.getRunState('demo', 'r1')!;
    expect(snap.status).toBe('completed');
    expect(snap.nodes.every((n) => n.state === 'done')).toBe(true);
    expect(snap.tokensUsed).toBe(55);

    // Run-log + node output persisted.
    const log = readRunLog(root, 'demo', 'r1');
    expect(log[0]).toMatchObject({ kind: 'run-started' });
    expect(log.some((e) => e.kind === 'run-completed')).toBe(true);
    expect(readNodeOutput(root, 'demo', 'r1', 'audit')).toEqual({ text: 'AUDIT' });
  });

  it('passes llmConnection (node value, else the task default) to createSession', async () => {
    // Regression: pi/* models complete instantly with empty output unless the child session is
    // created with the connection slug that serves the model.
    saveTaskSpec(
      root,
      specOf({
        id: 'conn',
        title: 'Conn',
        goal: 'g',
        defaults: { llmConnection: 'default-conn' },
        nodes: [
          { id: 'a', prompt: 'a', model: 'pi/gpt-5.5', llmConnection: 'pi-conn' },
          { id: 'b', prompt: 'b', model: 'claude-opus-4-8' }, // inherits the task default
        ],
      }),
    )
    const runner = makeRunner()
    runner.run('conn', { runId: 'r1' })
    await tick()

    const optsA = host.created.find((c) => c.options.name === 'a')?.options
    const optsB = host.created.find((c) => c.options.name === 'b')?.options
    expect(optsA?.llmConnection).toBe('pi-conn')
    expect(optsB?.llmConnection).toBe('default-conn')
  })

  it('resolves permissionMode: node override → task default, intersected with parent', async () => {
    host.permissionById.set('orch', 'allow-all')
    saveTaskSpec(
      root,
      specOf({
        id: 'perm',
        title: 'Perm',
        goal: 'g',
        defaults: { permissionMode: 'allow-all' },
        nodes: [
          { id: 'a', prompt: 'a', permissionMode: 'safe' }, // node override wins
          { id: 'b', prompt: 'b', permissionMode: 'allow-all' }, // explicit allow-all under allow-all parent
        ],
      }),
    )
    const runner = makeRunner()
    runner.run('perm', { runId: 'r1', orchestratorSessionId: 'orch' })
    await tick()

    expect(host.created.find((c) => c.options.name === 'a')?.options.permissionMode).toBe('safe')
    expect(host.created.find((c) => c.options.name === 'b')?.options.permissionMode).toBe('allow-all')
  })

  it('defaults an omitted permission mode to safe (never implicit allow-all)', async () => {
    // Unattended children must not invent privilege. Missing node/task/parent → safe.
    saveTaskSpec(
      root,
      specOf({ id: 'perm2', title: 'Perm2', goal: 'g', nodes: [{ id: 'c', prompt: 'c' }] }),
    )
    const runner = makeRunner()
    runner.run('perm2', { runId: 'r1' })
    await tick()

    expect(host.created.find((c) => c.options.name === 'c')?.options.permissionMode).toBe('safe')
  })

  it('never lets a restricted parent spawn a more privileged child', async () => {
    host.permissionById.set('orch', 'safe')
    saveTaskSpec(
      root,
      specOf({
        id: 'perm-esc',
        title: 'PermEsc',
        goal: 'g',
        nodes: [{ id: 'x', prompt: 'x', permissionMode: 'allow-all' }],
      }),
    )
    const runner = makeRunner()
    runner.run('perm-esc', { runId: 'r1', orchestratorSessionId: 'orch' })
    await tick()

    expect(host.created.find((c) => c.options.name === 'x')).toBeUndefined()
    expect(runner.getRunState('perm-esc', 'r1')!.status).toBe('failed')
  })

  it('refuses unattended ask without an approval channel', async () => {
    host.permissionById.set('orch', 'ask')
    saveTaskSpec(
      root,
      specOf({
        id: 'perm-ask',
        title: 'PermAsk',
        goal: 'g',
        defaults: { permissionMode: 'ask' },
        nodes: [{ id: 'y', prompt: 'y' }],
      }),
    )
    const runner = makeRunner()
    runner.run('perm-ask', { runId: 'r1', orchestratorSessionId: 'orch' })
    await tick()

    expect(host.created).toHaveLength(0)
    expect(runner.getRunState('perm-ask', 'r1')!.status).toBe('failed')
  })

  it('records work-intent before node-spawned in the run-log', async () => {
    saveTaskSpec(
      root,
      specOf({ id: 'wi', title: 'Wi', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }] }),
    )
    const runner = makeRunner()
    runner.run('wi', { runId: 'r1' })
    await tick()
    const log = readRunLog(root, 'wi', 'r1')
    const kinds = log.map((e) => e.kind)
    const intentIdx = kinds.indexOf('work-intent')
    const spawnIdx = kinds.indexOf('node-spawned')
    expect(intentIdx).toBeGreaterThanOrEqual(0)
    expect(spawnIdx).toBeGreaterThan(intentIdx)
  })

  it('on restart re-attaches an in-flight session instead of spawning a second child', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'recon',
        title: 'Recon',
        goal: 'g',
        nodes: [{ id: 'a', prompt: 'a' }],
      }),
    )
    const r1 = makeRunner()
    r1.run('recon', { runId: 'r1' })
    await tick()
    expect(host.created).toHaveLength(1)

    // Crash mid-flight: new runner + host that still sees the session processing.
    const host2 = new MockHost()
    host2.runtimeById.set('sess-a', { exists: true, isProcessing: true })
    const r2 = new TaskRunner({
      host: host2,
      workspaceId: 'ws',
      workspaceRoot: root,
      now: () => '2026-06-07T00:00:00.000Z',
    })
    r2.resume('recon', 'r1')
    await tick()

    expect(host2.created).toHaveLength(0) // no second spawn
    expect(r2.getRunState('recon', 'r1')!.nodes.find((n) => n.id === 'a')!.state).toBe('running')

    // Late completion on the original session id settles the attempt.
    host2.completeSession('sess-a', { finalText: 'done' })
    await tick()
    expect(r2.getRunState('recon', 'r1')!.nodes.find((n) => n.id === 'a')!.state).toBe('done')
  })

  it('on restart refuses silent re-dispatch when spawned session is missing', async () => {
    saveTaskSpec(
      root,
      specOf({ id: 'miss', title: 'Miss', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }] }),
    )
    const r1 = makeRunner()
    r1.run('miss', { runId: 'r1' })
    await tick()

    const host2 = new MockHost()
    host2.runtimeById.set('sess-a', { exists: false, isProcessing: false })
    const r2 = new TaskRunner({
      host: host2,
      workspaceId: 'ws',
      workspaceRoot: root,
      now: () => '2026-06-07T00:00:00.000Z',
    })
    r2.resume('miss', 'r1')
    await tick()

    expect(host2.created).toHaveLength(0)
    expect(r2.getRunState('miss', 'r1')!.nodes.find((n) => n.id === 'a')!.state).toBe('failed')
  })

  it('stamps task/run/node linkage on each dispatched child session', async () => {
    // The manual subtask composer skips Conductor-owned children by checking taskRunId.
    saveTaskSpec(
      root,
      specOf({ id: 'link', title: 'Link', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }] }),
    )
    const runner = makeRunner()
    runner.run('link', { runId: 'r1', orchestratorSessionId: 'orch' })
    await tick()

    const optsA = host.created.find((c) => c.options.name === 'a')?.options
    expect(optsA?.taskSlug).toBe('link')
    expect(optsA?.taskRunId).toBe('r1')
    expect(optsA?.taskNodeId).toBe('a')
  })

  it('creates a child session per node (createSession announces each to the renderer by default)', async () => {
    // Renderer visibility depends on createSession emitting session_created; the runner's job is
    // simply to create one session per node (the host's createSession owns the announcement).
    saveTaskSpec(
      root,
      specOf({ id: 'announce', title: 'Announce', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }, { id: 'b', prompt: 'b' }] }),
    )
    const runner = makeRunner()
    runner.run('announce', { runId: 'r1' })
    await tick()

    expect(host.created.map((c) => c.id)).toEqual([host.sessionIdFor('a'), host.sessionIdFor('b')])
  })

  it("children inherit the orchestrator's working directory (falling back to spec.cwd)", async () => {
    saveTaskSpec(
      root,
      specOf({ id: 'cwd', title: 'Cwd', goal: 'g', cwd: '/spec/dir', nodes: [{ id: 'a', prompt: 'a' }] }),
    )
    host.workingDirById.set('orch', '/parent/dir')
    const runner = makeRunner()
    runner.run('cwd', { runId: 'r1', orchestratorSessionId: 'orch' })
    await tick()
    // Orchestrator cwd wins over the spec default.
    expect(host.created.find((c) => c.options.name === 'a')?.options.workingDirectory).toBe('/parent/dir')

    // With no orchestrator cwd, the spec's declared cwd is used.
    host.created.length = 0
    host.workingDirById.clear()
    const runner2 = makeRunner()
    runner2.run('cwd', { runId: 'r2', orchestratorSessionId: 'orch' })
    await tick()
    expect(host.created.find((c) => c.options.name === 'a')?.options.workingDirectory).toBe('/spec/dir')
  })

  it('moves the orchestrator tile to in-progress on start and done on completion', async () => {
    saveTaskSpec(root, specOf({ id: 'col', title: 'Col', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }] }))
    const runner = makeRunner()
    runner.run('col', { runId: 'r1', orchestratorSessionId: 'orch', verifyOnComplete: false })
    await tick()
    expect(host.columns).toContainEqual({ sessionId: 'orch', column: 'in-progress' })

    host.complete('a', { finalText: 'A' })
    await tick()
    expect(host.columns).toContainEqual({ sessionId: 'orch', column: 'done' })
  })

  it('runs a fan-out and joins at the synthesizer', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'fan',
        title: 'Fan',
        goal: 'g',
        nodes: [
          { id: 'design', prompt: 'design' },
          { id: 'impl-a', depends_on: ['design'], prompt: 'A: ${nodes.design.output}' },
          { id: 'impl-b', depends_on: ['design'], prompt: 'B: ${nodes.design.output}' },
          { id: 'review', depends_on: ['impl-a', 'impl-b'], prompt: 'review ${nodes.impl-a.output} ${nodes.impl-b.output}' },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('fan', { runId: 'r1' });
    await tick();
    expect(host.dispatchedNames()).toEqual(['design']);

    host.complete('design', { finalText: 'D' });
    await tick();
    // Both siblings dispatch in parallel; review waits for the barrier.
    expect(host.dispatchedNames().sort()).toEqual(['design', 'impl-a', 'impl-b']);
    expect(host.promptFor('review')).toBeUndefined();

    host.complete('impl-a', { finalText: 'A' });
    await tick();
    expect(host.promptFor('review')).toBeUndefined(); // still waiting on impl-b

    host.complete('impl-b', { finalText: 'B' });
    await tick();
    expect(host.promptFor('review')).toBe('review A B');

    host.complete('review', { finalText: 'R' });
    await tick();
    expect(runner.getRunState('fan', 'r1')!.status).toBe('completed');
  });

  it('marks a node failed, leaves dependents pending, and settles the run as failed', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'fail',
        title: 'F',
        goal: 'g',
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', depends_on: ['a'], prompt: 'b ${nodes.a.output}' },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('fail', { runId: 'r1' });
    await tick();

    host.complete('a', { reason: 'error' });
    await tick();

    const snap = runner.getRunState('fail', 'r1')!;
    expect(snap.status).toBe('failed');
    expect(snap.nodes.find((n) => n.id === 'a')!.state).toBe('failed');
    expect(snap.nodes.find((n) => n.id === 'b')!.state).toBe('pending');
    expect(host.promptFor('b')).toBeUndefined();
    expect(host.statuses.some((s) => s.sessionId === 'sess-a' && s.status === 'needs-review')).toBe(true);

    const log = readRunLog(root, 'fail', 'r1');
    expect(log.some((e) => e.kind === 'node-finished' && (e as { state?: string }).state === 'failed')).toBe(true);
    expect(log.some((e) => e.kind === 'run-failed')).toBe(true);
  });

  it('honors max_parallel', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'par',
        title: 'P',
        goal: 'g',
        max_parallel: 1,
        nodes: [
          { id: 'x', prompt: 'x' },
          { id: 'y', prompt: 'y' },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('par', { runId: 'r1' });
    await tick();
    expect(host.dispatchedNames()).toEqual(['x']); // only one slot

    host.complete('x', { finalText: 'X' });
    await tick();
    expect(host.dispatchedNames()).toEqual(['x', 'y']);

    host.complete('y', { finalText: 'Y' });
    await tick();
    expect(runner.getRunState('par', 'r1')!.status).toBe('completed');
  });

  it('pauses scheduling and resumes', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'pz',
        title: 'Pz',
        goal: 'g',
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', depends_on: ['a'], prompt: 'b ${nodes.a.output}' },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('pz', { runId: 'r1' });
    await tick();

    runner.pause('pz', 'r1');
    host.complete('a', { finalText: 'A' });
    await tick();
    expect(host.promptFor('b')).toBeUndefined(); // paused → no scheduling
    expect(runner.getRunState('pz', 'r1')!.status).toBe('paused');

    runner.resume('pz', 'r1');
    await tick();
    expect(host.promptFor('b')).toBe('b A');

    host.complete('b', { finalText: 'B' });
    await tick();
    expect(runner.getRunState('pz', 'r1')!.status).toBe('completed');
  });

  it('stops a run and cancels in-flight children', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'st',
        title: 'St',
        goal: 'g',
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', depends_on: ['a'], prompt: 'b' },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('st', { runId: 'r1' });
    await tick();

    await runner.stop('st', 'r1');
    const snap = runner.getRunState('st', 'r1')!;
    expect(snap.status).toBe('stopped');
    expect(snap.nodes.find((n) => n.id === 'a')!.state).toBe('cancelled');
    expect(host.cancelled).toContain('sess-a');
  });

  it('resumes a run from the persisted run-log after a restart, reusing finished node outputs', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'res',
        title: 'Res',
        goal: 'g',
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', depends_on: ['a'], prompt: 'b ${nodes.a.output}' },
        ],
      }),
    );
    // First runner: complete 'a' (output persisted), leave 'b' pending, then "crash" (drop the runner).
    const r1 = makeRunner();
    r1.run('res', { runId: 'r1', orchestratorSessionId: 'orch' });
    await tick();
    r1.pause('res', 'r1'); // so completing 'a' does not dispatch 'b'
    host.complete('a', { finalText: 'A', tokenUsage: tu(3, 4) });
    await tick();
    expect(readNodeOutput(root, 'res', 'r1', 'a')).toEqual({ text: 'A' });

    // Simulate an app restart: a brand-new runner + host with empty in-memory state.
    const host2 = new MockHost();
    const r2 = new TaskRunner({ host: host2, workspaceId: 'ws', workspaceRoot: root, now: () => '2026-06-07T00:00:00.000Z' });
    r2.resume('res', 'r1'); // not in memory → rehydrate from the run-log
    await tick();

    // 'a' is reused from disk (NOT re-spawned); only 'b' dispatches, seeded with a's recovered output.
    expect(host2.dispatchedNames()).toEqual(['b']);
    expect(host2.promptFor('b')).toBe('b A');
    // The orchestrator linkage is recovered from the run-log.
    expect(host2.created.find((c) => c.options.name === 'b')?.options.parentSessionId).toBe('orch');

    host2.complete('b', { finalText: 'B' });
    await tick();
    // Resumed run re-verifies (orchestrator recovered from the run-log) before going terminal.
    expect(r2.getRunState('res', 'r1')!.status).toBe('verifying');
    host2.completeSession('orch', { finalText: 'VERDICT: PASS' });
    await tick();
    expect(r2.getRunState('res', 'r1')!.status).toBe('completed');
  });

  it('retries a failed node up to retry.limit, then fails', async () => {
    saveTaskSpec(
      root,
      specOf({ id: 'rt', title: 'Rt', goal: 'g', nodes: [{ id: 'a', prompt: 'do a', retry: { limit: 1 } }] }),
    );
    const runner = makeRunner();
    runner.run('rt', { runId: 'r1' });
    await tick();

    // First failure → within budget → re-dispatched (still running, attempt 2).
    host.complete('a', { reason: 'error' });
    await tick();
    expect(host.created.filter((c) => c.options.name === 'a')).toHaveLength(2);
    let snap = runner.getRunState('rt', 'r1')!;
    expect(snap.nodes[0]!.state).toBe('running');
    expect(snap.nodes[0]!.attempt).toBe(2);

    // Second failure → budget exhausted → failed.
    host.complete('a', { reason: 'error' });
    await tick();
    snap = runner.getRunState('rt', 'r1')!;
    expect(snap.status).toBe('failed');
    expect(snap.nodes[0]!.state).toBe('failed');
    expect(readRunLog(root, 'rt', 'r1').some((e) => e.kind === 'node-retry')).toBe(true);
  });

  it('does not retry when retry.limit is 0', async () => {
    saveTaskSpec(
      root,
      specOf({ id: 'rt0', title: 'Rt0', goal: 'g', nodes: [{ id: 'a', prompt: 'a', retry: { limit: 0 } }] }),
    );
    const runner = makeRunner();
    runner.run('rt0', { runId: 'r1' });
    await tick();
    host.complete('a', { reason: 'error' });
    await tick();
    expect(runner.getRunState('rt0', 'r1')!.status).toBe('failed');
    expect(host.created.filter((c) => c.options.name === 'a')).toHaveLength(1);
  });

  it('feeds the prior failure into the retried prompt and can then succeed', async () => {
    saveTaskSpec(
      root,
      specOf({ id: 'rtok', title: 'RtOk', goal: 'g', nodes: [{ id: 'a', prompt: 'do a', retry: { limit: 2 } }] }),
    );
    const runner = makeRunner();
    runner.run('rtok', { runId: 'r1' });
    await tick();

    host.complete('a', { reason: 'timeout' });
    await tick();
    const retryPrompt = host.sent.filter((s) => s.sessionId === 'sess-a')[1]!.message;
    expect(retryPrompt).toContain('Previous attempt failed: timeout');
    expect(retryPrompt).toContain('do a');

    host.complete('a', { finalText: 'OK' });
    await tick();
    expect(runner.getRunState('rtok', 'r1')!.status).toBe('completed');
  });

  it('does not retry on error when retry.when targets a different failure class', async () => {
    saveTaskSpec(
      root,
      specOf({ id: 'rtw', title: 'RtW', goal: 'g', nodes: [{ id: 'a', prompt: 'a', retry: { limit: 3, when: 'empty' } }] }),
    );
    const runner = makeRunner();
    runner.run('rtw', { runId: 'r1' });
    await tick();
    host.complete('a', { reason: 'error' });
    await tick();
    expect(runner.getRunState('rtw', 'r1')!.status).toBe('failed');
    expect(host.created.filter((c) => c.options.name === 'a')).toHaveLength(1);
  });

  it('completes without verifying when there is no orchestrator', async () => {
    saveTaskSpec(root, specOf({ id: 'nov', title: 'NoV', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }] }));
    const runner = makeRunner();
    runner.run('nov', { runId: 'r1' }); // no orchestratorSessionId → nothing to verify against
    await tick();
    host.complete('a', { finalText: 'x' });
    await tick();
    expect(runner.getRunState('nov', 'r1')!.status).toBe('completed');
    expect(readRunLog(root, 'nov', 'r1').some((e) => e.kind === 'run-verifying')).toBe(false);
  });

  it('gates the run on the orchestrator verdict and includes acceptance_criteria in the prompt', async () => {
    saveTaskSpec(
      root,
      specOf({ id: 'vp', title: 'Vp', goal: 'g', acceptance_criteria: 'must be perfect', nodes: [{ id: 'a', prompt: 'do a' }] }),
    );
    const runner = makeRunner();
    runner.run('vp', { runId: 'r1', orchestratorSessionId: 'orch' });
    await tick();
    host.complete('a', { finalText: 'x' });
    await tick();
    expect(runner.getRunState('vp', 'r1')!.status).toBe('verifying');
    const vmsg = host.sent.find((s) => s.sessionId === 'orch')!.message;
    expect(vmsg).toContain('must be perfect');
    expect(vmsg).toContain('VERDICT: PASS');

    host.completeSession('orch', { finalText: 'VERDICT: PASS' });
    await tick();
    expect(runner.getRunState('vp', 'r1')!.status).toBe('completed');
  });

  it('re-runs the terminal node once on a FAIL verdict, then completes on PASS', async () => {
    saveTaskSpec(root, specOf({ id: 'vf', title: 'Vf', goal: 'g', nodes: [{ id: 'a', prompt: 'do a' }] }));
    const runner = makeRunner();
    runner.run('vf', { runId: 'r1', orchestratorSessionId: 'orch' });
    await tick();
    host.complete('a', { finalText: 'first' });
    await tick();

    host.completeSession('orch', { finalText: 'Not good enough.\nVERDICT: FAIL — missing X' });
    await tick();
    const snap = runner.getRunState('vf', 'r1')!;
    expect(snap.status).toBe('running');
    expect(snap.nodes[0]!.state).toBe('running');
    expect(snap.nodes[0]!.attempt).toBe(2);
    const retryPrompt = host.sent.filter((s) => s.sessionId === 'sess-a')[1]!.message;
    expect(retryPrompt).toContain('rejected on verification: missing X');

    host.complete('a', { finalText: 'second' });
    await tick();
    expect(runner.getRunState('vf', 'r1')!.status).toBe('verifying');
    host.completeSession('orch', { finalText: 'VERDICT: PASS' });
    await tick();
    expect(runner.getRunState('vf', 'r1')!.status).toBe('completed');
  });

  it('fails the run when FAIL verdicts exhaust the repair budget (max_iterations)', async () => {
    // max_iterations: 1 → one repair allowed; the second FAIL breaches the iteration budget.
    saveTaskSpec(root, specOf({ id: 'vff', title: 'Vff', goal: 'g', max_iterations: 1, nodes: [{ id: 'a', prompt: 'do a' }] }));
    const runner = makeRunner();
    runner.run('vff', { runId: 'r1', orchestratorSessionId: 'orch' });
    await tick();
    host.complete('a', { finalText: 'x' });
    await tick();
    host.completeSession('orch', { finalText: 'VERDICT: FAIL — nope' });
    await tick();
    expect(runner.getRunState('vff', 'r1')!.status).toBe('running'); // first repair in flight

    host.complete('a', { finalText: 'y' });
    await tick();
    host.completeSession('orch', { finalText: 'VERDICT: FAIL — still nope' });
    await tick();
    expect(runner.getRunState('vff', 'r1')!.status).toBe('failed');
    const log = readRunLog(root, 'vff', 'r1');
    expect(log.filter((e) => e.kind === 'verdict').length).toBe(2);
    expect(log.some((e) => e.kind === 'budget-breach' && (e as { metric?: string }).metric === 'iterations')).toBe(true);
    expect(log.some((e) => e.kind === 'run-failed')).toBe(true);
  });

  it('re-asks on an unparsable verdict and fails only after the re-ask budget is exhausted', async () => {
    saveTaskSpec(root, specOf({ id: 'unp', title: 'Unp', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }] }));
    const runner = makeRunner();
    runner.run('unp', { runId: 'r1', orchestratorSessionId: 'orch' });
    await tick();
    host.complete('a', { finalText: 'x' });
    await tick();

    // First malformed reply → re-asked, run stays verifying (not terminal).
    host.completeSession('orch', { finalText: 'I think it is fine but forgot the verdict line.' });
    await tick();
    expect(runner.getRunState('unp', 'r1')!.status).toBe('verifying');
    expect(host.sent.filter((s) => s.sessionId === 'orch' && s.message.includes('did not include a parseable verdict')).length).toBe(1);

    // Second malformed reply → re-asked again (MAX_UNPARSED_REASKS = 2).
    host.completeSession('orch', { finalText: 'still no verdict line, sorry' });
    await tick();
    expect(runner.getRunState('unp', 'r1')!.status).toBe('verifying');

    // Third malformed reply → budget exhausted → failed.
    host.completeSession('orch', { finalText: 'nope, no verdict again' });
    await tick();
    expect(runner.getRunState('unp', 'r1')!.status).toBe('failed');
    expect(readRunLog(root, 'unp', 'r1').filter((e) => e.kind === 'verdict' && (e as { result?: string }).result === 'unparsed').length).toBe(3);
  });

  it('scopes a repair to the named nodes and their transitive dependents', async () => {
    // Chain a → b → c. A FAIL naming only `b` must re-run b AND c (downstream), but leave a done.
    saveTaskSpec(
      root,
      specOf({
        id: 'scope',
        title: 'Scope',
        goal: 'g',
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', depends_on: ['a'], prompt: 'b ${nodes.a.output}' },
          { id: 'c', depends_on: ['b'], prompt: 'c ${nodes.b.output}' },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('scope', { runId: 'r1', orchestratorSessionId: 'orch' });
    await tick();
    host.complete('a', { finalText: 'A' });
    await tick();
    host.complete('b', { finalText: 'B' });
    await tick();
    host.complete('c', { finalText: 'C' });
    await tick();
    expect(runner.getRunState('scope', 'r1')!.status).toBe('verifying');

    host.completeSession('orch', { finalText: 'VERDICT: FAIL — nodes=b — b is wrong' });
    await tick();
    const snap = runner.getRunState('scope', 'r1')!;
    expect(snap.status).toBe('running');
    expect(snap.nodes.find((n) => n.id === 'a')!.state).toBe('done'); // upstream untouched
    expect(snap.nodes.find((n) => n.id === 'b')!.state).toBe('running'); // re-dispatched
    expect(snap.nodes.find((n) => n.id === 'c')!.state).toBe('pending'); // waits on b
    // a ran once; b re-dispatched (2); c not yet re-dispatched.
    expect(host.created.filter((c) => c.options.name === 'a')).toHaveLength(1);
    expect(host.created.filter((c) => c.options.name === 'b')).toHaveLength(2);
    expect(host.created.filter((c) => c.options.name === 'c')).toHaveLength(1);
  });

  it('an unparsed re-ask does not consume the repair budget', async () => {
    // max_iterations: 1. An intervening unparsed verdict must not eat the single repair allowance.
    saveTaskSpec(root, specOf({ id: 'unb', title: 'Unb', goal: 'g', max_iterations: 1, nodes: [{ id: 'a', prompt: 'a' }] }));
    const runner = makeRunner();
    runner.run('unb', { runId: 'r1', orchestratorSessionId: 'orch' });
    await tick();
    host.complete('a', { finalText: 'x' });
    await tick();

    host.completeSession('orch', { finalText: 'no verdict here' }); // unparsed → re-ask
    await tick();
    expect(runner.getRunState('unb', 'r1')!.status).toBe('verifying');

    host.completeSession('orch', { finalText: 'VERDICT: FAIL — fix it' }); // first real FAIL → repair still allowed
    await tick();
    expect(runner.getRunState('unb', 'r1')!.status).toBe('running');
  });

  it('does not hang in verifying when the verification send rejects', async () => {
    saveTaskSpec(root, specOf({ id: 'snd', title: 'Snd', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }] }));
    const runner = makeRunner();
    runner.run('snd', { runId: 'r1', orchestratorSessionId: 'orch' });
    await tick();
    // Make the orchestrator verification send reject (the verdict can never arrive).
    const origSend = host.sendMessage.bind(host);
    host.sendMessage = async (sessionId: string, message: string) => {
      if (sessionId === 'orch') throw new Error('send boom');
      return origSend(sessionId, message);
    };
    host.complete('a', { finalText: 'x' });
    await tick();
    await tick();
    expect(runner.getRunState('snd', 'r1')!.status).toBe('failed');
  });

  it('ignores a verdict that arrives after the run was stopped', async () => {
    saveTaskSpec(root, specOf({ id: 'late', title: 'Late', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }] }));
    const runner = makeRunner();
    runner.run('late', { runId: 'r1', orchestratorSessionId: 'orch' });
    await tick();
    host.complete('a', { finalText: 'x' });
    await tick();
    expect(runner.getRunState('late', 'r1')!.status).toBe('verifying');

    await runner.stop('late', 'r1');
    expect(runner.getRunState('late', 'r1')!.status).toBe('stopped');

    // A late verdict for the (now stopped) run must not flip it back to completed/failed.
    host.completeSession('orch', { finalText: 'VERDICT: PASS' });
    await tick();
    expect(runner.getRunState('late', 'r1')!.status).toBe('stopped');
  });

  it('reconstructs the repair counter from the run-log on a cross-restart resume', async () => {
    // max_iterations: 1. Consume the single repair, then "restart": the resumed run must remember
    // repairsUsed=1 (from the persisted FAIL verdict) so the next FAIL fails immediately.
    saveTaskSpec(root, specOf({ id: 'hyd', title: 'Hyd', goal: 'g', max_iterations: 1, nodes: [{ id: 'a', prompt: 'a' }] }));
    const r1 = makeRunner();
    r1.run('hyd', { runId: 'r1', orchestratorSessionId: 'orch' });
    await tick();
    host.complete('a', { finalText: 'x' });
    await tick();
    host.completeSession('orch', { finalText: 'VERDICT: FAIL — redo' }); // consumes the one repair
    await tick();
    expect(r1.getRunState('hyd', 'r1')!.status).toBe('running');

    // Restart: fresh host + runner with empty in-memory state, resume from the run-log.
    const host2 = new MockHost();
    const r2 = new TaskRunner({ host: host2, workspaceId: 'ws', workspaceRoot: root, now: () => '2026-06-07T00:00:00.000Z' });
    r2.resume('hyd', 'r1');
    await tick();
    expect(r2.getRunState('hyd', 'r1')!.status).toBe('verifying');

    // A single FAIL now exhausts the (carried-over) budget immediately.
    host2.completeSession('orch', { finalText: 'VERDICT: FAIL — still bad' });
    await tick();
    expect(r2.getRunState('hyd', 'r1')!.status).toBe('failed');
  });

  it('reconstructs the malformed-verdict re-ask cap from the run-log on a cross-restart resume', async () => {
    // MAX_UNPARSED_REASKS = 2. Persist two unparsed verdicts, then resume on a fresh runner:
    // the next unparsed must exhaust the carried-over budget and fail, not restart from zero.
    saveTaskSpec(root, specOf({ id: 'unp-hyd', title: 'UnpHyd', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }] }));
    const r1 = makeRunner();
    r1.run('unp-hyd', { runId: 'r1', orchestratorSessionId: 'orch' });
    await tick();
    host.complete('a', { finalText: 'x' });
    await tick();

    host.completeSession('orch', { finalText: 'malformed first' });
    await tick();
    expect(r1.getRunState('unp-hyd', 'r1')!.status).toBe('verifying');
    host.completeSession('orch', { finalText: 'malformed second' });
    await tick();
    expect(r1.getRunState('unp-hyd', 'r1')!.status).toBe('verifying');

    const host2 = new MockHost();
    const r2 = new TaskRunner({ host: host2, workspaceId: 'ws', workspaceRoot: root, now: () => '2026-06-07T00:00:00.000Z' });
    r2.resume('unp-hyd', 'r1');
    await tick();
    expect(r2.getRunState('unp-hyd', 'r1')!.status).toBe('verifying');

    // Third unparsed on the resumed process must honor the cap (already 2 re-asks in the log).
    host2.completeSession('orch', { finalText: 'malformed after restart' });
    await tick();
    expect(r2.getRunState('unp-hyd', 'r1')!.status).toBe('failed');
    const unparsed = readRunLog(root, 'unp-hyd', 'r1').filter(
      (e) => e.kind === 'verdict' && (e as { result?: string }).result === 'unparsed',
    );
    expect(unparsed.length).toBe(3);
  });

  it('fails a node that completes with no text despite declaring outputs (instead of marking it done)', async () => {
    // Bug 2: a clean turn-completion is not proof of success. A node that declared `outputs` but
    // produced empty final text delivered nothing — it must fail (→ needs-review), not silently pass.
    saveTaskSpec(
      root,
      specOf({
        id: 'empty',
        title: 'Empty',
        goal: 'g',
        nodes: [{ id: 'a', prompt: 'a', outputs: [{ name: 'result' }] }],
      }),
    );
    const runner = makeRunner();
    runner.run('empty', { runId: 'r1' });
    await tick();

    host.complete('a', { finalText: '   ' }); // whitespace-only → counts as empty
    await tick();

    const snap = runner.getRunState('empty', 'r1')!;
    expect(snap.nodes.find((n) => n.id === 'a')!.state).toBe('failed');
    expect(snap.status).toBe('failed');
    expect(host.statuses.some((s) => s.sessionId === 'sess-a' && s.status === 'needs-review')).toBe(true);
  });

  it('still marks a node done on empty text when it declares no outputs (lenient default)', async () => {
    // The empty-output guard must only bite nodes that declared outputs; output-less nodes keep the
    // lenient "completed = done" behavior.
    saveTaskSpec(root, specOf({ id: 'lenient', title: 'Lenient', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }] }));
    const runner = makeRunner();
    runner.run('lenient', { runId: 'r1' });
    await tick();

    host.complete('a', { finalText: '' });
    await tick();

    expect(runner.getRunState('lenient', 'r1')!.nodes.find((n) => n.id === 'a')!.state).toBe('done');
  });

  it('publishes the total node count to the orchestrator at run start (stable board denominator)', async () => {
    // Bug 3: the board derives subtask progress from lazily-spawned child sessions, so without an
    // up-front total the denominator grows (0/1 → 1/2 …). The runner publishes spec.nodes.length once.
    saveTaskSpec(
      root,
      specOf({
        id: 'count',
        title: 'Count',
        goal: 'g',
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', depends_on: ['a'], prompt: 'b' },
          { id: 'c', depends_on: ['b'], prompt: 'c' },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('count', { runId: 'r1', orchestratorSessionId: 'orch' });
    await tick();

    expect(host.nodeCounts).toContainEqual({ sessionId: 'orch', count: 3 });
  });

  it('stop mid-dispatch tears down the created child instead of orphaning it', async () => {
    saveTaskSpec(root, specOf({ id: 'mid', title: 'Mid', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }] }));
    // Gate createSession so stop() lands while dispatch is awaiting it.
    let release!: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    const origCreate = host.createSession.bind(host);
    host.createSession = async (ws, opts) => { await gate; return origCreate(ws, opts); };

    const runner = makeRunner();
    runner.run('mid', { runId: 'r1' });
    await runner.stop('mid', 'r1');
    release();
    await tick();

    // The belatedly-created session is cancelled and never receives the prompt.
    expect(host.cancelled).toContain('sess-a');
    expect(host.sent.some((s) => s.sessionId === 'sess-a')).toBe(false);
    expect(runner.getRunState('mid', 'r1')!.status).toBe('stopped');
  });

  it('ignores a late completion from a superseded attempt session', async () => {
    saveTaskSpec(root, specOf({ id: 'stale', title: 'Stale', goal: 'g', nodes: [{ id: 'a', prompt: 'a', retry: { limit: 1 } }] }));
    // Give each attempt a distinct session id (the default mock derives it from the node title).
    let n = 0;
    const origCreate = host.createSession.bind(host);
    host.createSession = async (ws, opts) => { n += 1; const r = await origCreate(ws, opts); return { id: `${r.id}-att${n}` }; };

    const runner = makeRunner();
    runner.run('stale', { runId: 'r1' });
    await tick();

    host.completeSession('sess-a-att1', { reason: 'error' }); // attempt 1 fails → retry dispatches attempt 2
    await tick();
    expect(host.created.filter((c) => c.options.name === 'a')).toHaveLength(2);
    expect(runner.getRunState('stale', 'r1')!.nodes[0]!.state).toBe('running');

    // A late completion from attempt 1's session must NOT settle the node.
    host.completeSession('sess-a-att1', { finalText: 'OLD' });
    await tick();
    const snap1 = runner.getRunState('stale', 'r1')!;
    expect(snap1.nodes[0]!.state).toBe('running');
    expect(snap1.status).toBe('running');

    // The current attempt's completion settles it normally.
    host.completeSession('sess-a-att2', { finalText: 'NEW' });
    await tick();
    expect(runner.getRunState('stale', 'r1')!.status).toBe('completed');
  });

  it('pauses (not fails) when the last in-flight node is externally interrupted, then resumes', async () => {
    saveTaskSpec(root, specOf({ id: 'int', title: 'Int', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }] }));
    const runner = makeRunner();
    runner.run('int', { runId: 'r1' });
    await tick();

    host.complete('a', { reason: 'interrupted' });
    await tick();
    const snap = runner.getRunState('int', 'r1')!;
    expect(snap.status).toBe('paused'); // cancelled nodes re-dispatch on resume — not a terminal failure
    expect(snap.nodes[0]!.state).toBe('cancelled');

    runner.resume('int', 'r1');
    await tick();
    expect(host.created.filter((c) => c.options.name === 'a')).toHaveLength(2);

    host.complete('a', { finalText: 'A' });
    await tick();
    expect(runner.getRunState('int', 'r1')!.status).toBe('completed');
  });

  it('replays params, verifyOnComplete, and cumulative tokens on a cross-restart resume', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'reh',
        title: 'Reh',
        goal: 'g',
        params: [{ name: 'p1', default: 'dflt' }],
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', depends_on: ['a'], prompt: 'b ${params.p1}' },
        ],
      }),
    );
    const r1 = makeRunner();
    r1.run('reh', { runId: 'r1', orchestratorSessionId: 'orch', params: { p1: 'custom' }, verifyOnComplete: false });
    await tick();
    r1.pause('reh', 'r1'); // keep 'b' pending while 'a' completes
    host.complete('a', { finalText: 'A', tokenUsage: tu(30, 20) });
    await tick();

    const host2 = new MockHost();
    const r2 = new TaskRunner({ host: host2, workspaceId: 'ws', workspaceRoot: root, now: () => '2026-06-07T00:00:00.000Z' });
    r2.resume('reh', 'r1');
    await tick();

    // Params replayed from the persisted run-started entry (not reset to the spec default).
    expect(host2.promptFor('b')).toBe('b custom');
    // Cumulative tokens replayed from node-finished entries.
    expect(r2.getRunState('reh', 'r1')!.tokensUsed).toBe(50);

    host2.complete('b', { finalText: 'B' });
    await tick();
    // verifyOnComplete: false persisted → completes directly, no verification round.
    expect(r2.getRunState('reh', 'r1')!.status).toBe('completed');
  });

  it('fails an over-budget run on resume instead of bouncing back into a budget pause', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'ob',
        title: 'Ob',
        goal: 'g',
        token_budget: 40,
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', depends_on: ['a'], prompt: 'b' },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('ob', { runId: 'r1' });
    await tick();
    host.complete('a', { finalText: 'A', tokenUsage: tu(30, 20) }); // 50 ≥ 40 → budget pause (b still pending)
    await tick();
    expect(runner.getRunState('ob', 'r1')!.status).toBe('paused');

    runner.resume('ob', 'r1');
    await tick();
    const snap = runner.getRunState('ob', 'r1')!;
    expect(snap.status).toBe('failed'); // hard cap — no unrecoverable pause loop
    expect(readRunLog(root, 'ob', 'r1').some((e) => e.kind === 'budget-breach')).toBe(true);
  });

  it('fails an over-budget run on a cross-restart resume (token counter replayed)', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'obr',
        title: 'Obr',
        goal: 'g',
        token_budget: 40,
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', depends_on: ['a'], prompt: 'b' },
        ],
      }),
    );
    const r1 = makeRunner();
    r1.run('obr', { runId: 'r1' });
    await tick();
    r1.pause('obr', 'r1'); // manual pause before the budget pause can fire
    host.complete('a', { finalText: 'A', tokenUsage: tu(30, 20) });
    await tick();

    const host2 = new MockHost();
    const r2 = new TaskRunner({ host: host2, workspaceId: 'ws', workspaceRoot: root, now: () => '2026-06-07T00:00:00.000Z' });
    r2.resume('obr', 'r1');
    await tick();
    expect(r2.getRunState('obr', 'r1')!.status).toBe('failed');
    expect(host2.created.filter((c) => c.options.name === 'b')).toHaveLength(0);
  });

  it('keeps a terminal snapshot after evicting the run, and refuses to resume it', async () => {
    saveTaskSpec(root, specOf({ id: 'ev', title: 'Ev', goal: 'g', nodes: [{ id: 'a', prompt: 'a' }] }));
    const runner = makeRunner();
    runner.run('ev', { runId: 'r1' });
    await tick();
    host.complete('a', { finalText: 'A' });
    await tick();
    expect(runner.getRunState('ev', 'r1')!.status).toBe('completed'); // snapshot survives eviction

    // A terminal run must not be restarted by resume() (it is no longer in the active registry).
    runner.resume('ev', 'r1');
    await tick();
    expect(host.created.filter((c) => c.options.name === 'a')).toHaveLength(1);
    expect(runner.getRunState('ev', 'r1')!.status).toBe('completed');
  });

  // ---------------------------------------------------------------------------
  // Delegation kernel wiring: RunReport, path leases, organization decision
  // ---------------------------------------------------------------------------

  function structuredReport(opts: {
    outcome?: string;
    criteria?: Array<{ id: string; status: 'met' | 'unmet' | 'unknown'; evidence?: Array<{ kind: 'file'; id: string; path?: string }> }>;
    changedPaths?: string[];
  } = {}): string {
    const report = {
      outcome: opts.outcome ?? 'done',
      criteria: opts.criteria ?? [{ id: 'c1', status: 'met' as const, evidence: [] }],
      changedPaths: opts.changedPaths ?? [],
      artifacts: [],
      evidence: [],
      decisions: [],
      open: [],
      status: 'wired but not visually checked',
    };
    return `Result:\n\`\`\`json\n${JSON.stringify(report)}\n\`\`\``;
  }

  it('stores a structured RunReport on node completion when parseable', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'rr',
        title: 'Rr',
        goal: 'g',
        nodes: [{ id: 'a', prompt: 'a', outputs: [{ name: 'result' }] }],
      }),
    );
    const runner = makeRunner();
    runner.run('rr', { runId: 'r1', verifyOnComplete: false });
    await tick();

    host.complete('a', { finalText: structuredReport() });
    await tick();

    const out = readNodeOutput(root, 'rr', 'r1', 'a');
    expect(out?.text).toContain('```json');
    expect(out?.report?.outcome).toBe('done');
    expect(out?.validation?.ok).toBe(true);
    expect(runner.getRunState('rr', 'r1')!.status).toBe('completed');
  });

  it('fails a node with declared outputs that returns natural language only', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'nl',
        title: 'Nl',
        goal: 'g',
        nodes: [{ id: 'a', prompt: 'a', outputs: [{ name: 'result' }] }],
      }),
    );
    const runner = makeRunner();
    runner.run('nl', { runId: 'r1' });
    await tick();

    host.complete('a', { finalText: 'I finished everything successfully.' });
    await tick();

    const snap = runner.getRunState('nl', 'r1')!;
    expect(snap.nodes.find((n) => n.id === 'a')!.state).toBe('failed');
    expect(snap.status).toBe('failed');
    const finished = readRunLog(root, 'nl', 'r1').find(
      (e) => e.kind === 'node-finished' && (e as { nodeId?: string }).nodeId === 'a',
    ) as { reason?: string } | undefined;
    expect(finished?.reason).toMatch(/natural language only|structured RunReport/i);
  });

  it('still accepts plain text for intermediate nodes without declared outputs', async () => {
    // Dependency-chain fixtures use "A"/"B" — must not require structured reports.
    saveTaskSpec(
      root,
      specOf({
        id: 'plain',
        title: 'Plain',
        goal: 'g',
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', depends_on: ['a'], prompt: 'b ${nodes.a.output}' },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('plain', { runId: 'r1', verifyOnComplete: false });
    await tick();
    host.complete('a', { finalText: 'A' });
    await tick();
    expect(host.promptFor('b')).toBe('b A');
    host.complete('b', { finalText: 'B' });
    await tick();
    expect(runner.getRunState('plain', 'r1')!.status).toBe('completed');
    expect(readNodeOutput(root, 'plain', 'r1', 'a')).toEqual({ text: 'A' });
  });

  it('halts node retries after two non-progressing structured attempts', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'nop',
        title: 'Nop',
        goal: 'g',
        nodes: [
          {
            id: 'a',
            prompt: 'a',
            outputs: [{ name: 'result' }],
            retry: { limit: 5 },
          },
        ],
      }),
    );
    // Distinct session ids per attempt so completions map correctly.
    let n = 0;
    const origCreate = host.createSession.bind(host);
    host.createSession = async (ws, opts) => {
      n += 1;
      const r = await origCreate(ws, opts);
      return { id: `${r.id}-att${n}` };
    };

    const runner = makeRunner();
    runner.run('nop', { runId: 'r1' });
    await tick();

    // Unmet criterion on every attempt → no progress.
    const bad = structuredReport({
      criteria: [{ id: 'c1', status: 'unmet', evidence: [] }],
    });
    host.completeSession('sess-a-att1', { finalText: bad });
    await tick();
    expect(host.created.filter((c) => c.options.name === 'a')).toHaveLength(2);

    host.completeSession('sess-a-att2', { finalText: bad });
    await tick();

    const snap = runner.getRunState('nop', 'r1')!;
    expect(snap.nodes.find((n) => n.id === 'a')!.state).toBe('failed');
    expect(snap.status).toBe('failed');
    // Halted without exhausting the full retry.limit of 5.
    expect(host.created.filter((c) => c.options.name === 'a').length).toBeLessThanOrEqual(2);
    const failed = readRunLog(root, 'nop', 'r1').find(
      (e) => e.kind === 'node-finished' && (e as { state?: string }).state === 'failed',
    ) as { reason?: string } | undefined;
    expect(failed?.reason).toMatch(/no-progress halt/i);
  });

  it('fails one of two parallel nodes with overlapping write_paths (path lease conflict)', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'lease',
        title: 'Lease',
        goal: 'g',
        max_parallel: 2,
        nodes: [
          { id: 'a', prompt: 'a', write_paths: ['src/shared'] },
          { id: 'b', prompt: 'b', write_paths: ['src/shared/util.ts'] },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('lease', { runId: 'r1', verifyOnComplete: false });
    await tick();

    const snap = runner.getRunState('lease', 'r1')!;
    const states = Object.fromEntries(snap.nodes.map((n) => [n.id, n.state]));
    // Exactly one writer may hold the overlapping path; the other fails with a lease message.
    const doneOrRunning = [states.a, states.b].filter((s) => s === 'running' || s === 'done');
    const failed = [states.a, states.b].filter((s) => s === 'failed');
    expect(doneOrRunning.length).toBe(1);
    expect(failed.length).toBe(1);

    const log = readRunLog(root, 'lease', 'r1');
    expect(log.some((e) => e.kind === 'path-lease-denied')).toBe(true);
    const leaseFail = log.find(
      (e) => e.kind === 'node-finished' && (e as { state?: string }).state === 'failed',
    ) as { reason?: string } | undefined;
    expect(leaseFail?.reason).toMatch(/path lease conflict/i);

    // The winner can still complete; the run fails because a sibling failed.
    const winner = states.a === 'running' ? 'a' : 'b';
    host.complete(winner, { finalText: 'ok' });
    await tick();
    expect(runner.getRunState('lease', 'r1')!.status).toBe('failed');
  });

  it('allows parallel nodes without write_paths (no leases)', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'nolease',
        title: 'NoLease',
        goal: 'g',
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', prompt: 'b' },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('nolease', { runId: 'r1', verifyOnComplete: false });
    await tick();
    expect(host.dispatchedNames().sort()).toEqual(['a', 'b']);
    host.complete('a', { finalText: 'A' });
    host.complete('b', { finalText: 'B' });
    await tick();
    expect(runner.getRunState('nolease', 'r1')!.status).toBe('completed');
    expect(readRunLog(root, 'nolease', 'r1').some((e) => e.kind === 'path-lease-denied')).toBe(false);
  });

  it('logs an organization-decision when the task has ≥2 independent root nodes', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'org',
        title: 'Org',
        goal: 'g',
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', prompt: 'b' },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('org', { runId: 'r1', verifyOnComplete: false });
    await tick();

    const log = readRunLog(root, 'org', 'r1');
    const org = log.find((e) => e.kind === 'organization-decision') as
      | { mode?: string; independentWorkUnits?: number; reasons?: string[] }
      | undefined;
    expect(org).toBeDefined();
    expect(org?.mode).toBe('bounded-parallel');
    expect(org?.independentWorkUnits).toBe(2);
    // Non-blocking: both roots still dispatch.
    expect(host.dispatchedNames().sort()).toEqual(['a', 'b']);
  });

  it('wraps structured-output nodes in a TaskBrief envelope', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'brief-wrap',
        title: 'BriefWrap',
        goal: 'produce report',
        nodes: [
          {
            id: 'out',
            prompt: 'Write the audit findings',
            outputs: [{ name: 'report' }],
          },
        ],
      }),
    )
    const runner = makeRunner()
    runner.run('brief-wrap', { runId: 'r1' })
    await tick()
    const prompt = host.promptFor('out') ?? ''
    expect(prompt).toContain('GOAL:')
    expect(prompt).toContain('ACCEPTANCE:')
    expect(prompt).toContain('Write the audit findings')
    expect(prompt).toContain('RunReport')
  })

  it('honors workspaceMaxParallel across concurrent schedule pressure', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'wscap',
        title: 'WsCap',
        goal: 'g',
        max_parallel: 4,
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', prompt: 'b' },
          { id: 'c', prompt: 'c' },
        ],
      }),
    )
    const runner = new TaskRunner({
      host,
      workspaceId: 'ws',
      workspaceRoot: root,
      now: () => '2026-06-07T00:00:00.000Z',
      workspaceMaxParallel: 1,
    })
    runner.run('wscap', { runId: 'r1' })
    await tick()
    // Only one child may be in-flight under workspace cap.
    expect(host.created).toHaveLength(1)
    host.complete(host.created[0]!.options.name!, { finalText: 'ok' })
    await tick()
    // After release, another root may dispatch.
    expect(host.created.length).toBeGreaterThanOrEqual(2)
  })

  it('does not log organization-decision for a single-root chain', async () => {
    saveTaskSpec(
      root,
      specOf({
        id: 'chain',
        title: 'Chain',
        goal: 'g',
        nodes: [
          { id: 'a', prompt: 'a' },
          { id: 'b', depends_on: ['a'], prompt: 'b' },
        ],
      }),
    );
    const runner = makeRunner();
    runner.run('chain', { runId: 'r1', verifyOnComplete: false });
    await tick();
    expect(readRunLog(root, 'chain', 'r1').some((e) => e.kind === 'organization-decision')).toBe(false);
  });
});
