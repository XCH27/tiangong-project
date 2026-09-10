/**
 * Delegation Kernel (TaskRunner / Conductor) — in-process DAG runner for Tasks.
 *
 * This is the single scheduling authority over the existing Task / Session /
 * SessionEvents stores (C3/C6). It is not a second team runtime.
 *
 * A `task.yaml` (parsed + validated in @craft-agent/shared/tasks) describes a
 * graph of nodes; each node is a child session. The kernel:
 *   1. schedules ready nodes (deps satisfied) honoring `max_parallel`,
 *   2. persists work-intent, intersects permissions, then dispatches each as a
 *      child session (create + sendMessage), interpolating
 *      `${nodes.<id>.output}` / `${params.<name>}` / `${inputs.<name>}` into the prompt,
 *   3. subscribes to SessionManager's in-process `onSessionComplete` seam,
 *   4. on completion reads the child's final assistant text as the node output,
 *      feeds it to dependents, and reschedules,
 *   5. drives child `sessionStatus` + `kanbanColumn` so the board renders the live DAG,
 *   6. persists an append-only run-log under `tasks/<slug>/runs/<runId>/`,
 *   7. on restart reconciles in-flight attempts via the host runtime adapter —
 *      never silently re-dispatches chargeable work.
 *
 * v1 executes `kind: 'session'` nodes wired by `depends_on` + `inputs`. Control-flow
 * kinds (route/loop/approval/…) parse but are not yet executed (deferred).
 *
 * The runner depends on a minimal `ConductorSessionHost` interface (which
 * SessionManager structurally satisfies) so it is unit-testable with a mock.
 */
import type { CreateSessionOptions } from '@craft-agent/shared/protocol';
import type { PermissionMode } from '@craft-agent/shared/agent/mode-types';
import {
  attemptIdempotencyKey,
  chooseOrganization,
  contractFromBrief,
  formatTaskBriefMessage,
  parseRunReportFromText,
  pathOverlaps,
  PathLeaseManager,
  resolveChildPermission,
  shouldHaltForNoProgress,
  validateRunReport,
  type RunReport,
  type TaskBrief,
  type TaskContract,
} from '@craft-agent/shared/agent';
import type { SessionCompletionEvent } from '../sessions/SessionManager';
import {
  type TaskSpec,
  type TaskNode,
  type NodeOutput,
  type RunLogEntry,
  type NodeRunState,
  nodeTitle,
  interpolateRefs,
  materializeDeps,
  appendRunLog,
  writeNodeOutput,
  readNodeOutput,
  readRunLog,
  loadTaskSpec,
  writeRunSpecSnapshot,
  DEFAULT_REPAIR_ATTEMPTS,
  MAX_REPAIR_ATTEMPTS_CAP,
} from '@craft-agent/shared/tasks';

// ---------------------------------------------------------------------------
// Host interface (SessionManager satisfies this structurally)
// ---------------------------------------------------------------------------

/** Runtime view of a child session after restart (AionCore-style reconcile input). */
export interface ChildSessionRuntimeState {
  exists: boolean;
  isProcessing: boolean;
  finalText?: string;
}

export interface ConductorSessionHost {
  /** Creates the child session AND announces it to the renderer (createSession emits
   *  session_created by default), so the subtask appears on the board with its real title. */
  createSession(workspaceId: string, options: CreateSessionOptions): Promise<{ id: string }>;
  sendMessage(sessionId: string, message: string): Promise<void>;
  setSessionStatus(sessionId: string, status: string): Promise<void>;
  setKanbanColumn(sessionId: string, column: string | null): Promise<void>;
  /** Records the total DAG node count on the orchestrator session for a stable board progress denominator. */
  setTaskNodeCount(sessionId: string, count: number): Promise<void>;
  cancelProcessing(sessionId: string, silent?: boolean): Promise<void>;
  onSessionComplete(listener: (evt: SessionCompletionEvent) => void): () => void;
  getSessionFinalText(sessionId: string): string | undefined;
  /** Resolved working directory of a session, so children inherit the orchestrator's cwd. */
  getSessionWorkingDirectory(sessionId: string): string | undefined;
  /** Parent/orchestrator permission mode for monotonic intersection (optional; missing → treat as unknown). */
  getSessionPermissionMode?(sessionId: string): PermissionMode | undefined;
  /**
   * Query live/runtime state of a child session for crash recovery.
   * When present, in-flight nodes are reconciled instead of silently re-dispatched.
   */
  getSessionRuntimeState?(sessionId: string): ChildSessionRuntimeState | undefined;
}

export interface TaskRunnerDeps {
  host: ConductorSessionHost;
  workspaceId: string;
  workspaceRoot: string;
  /** Optional output summarizer (call_llm/Haiku). When absent, summarize-flagged inputs pass through. */
  summarize?: (text: string) => Promise<string>;
  /** Default `max_parallel` when the spec omits it. */
  defaultMaxParallel?: number;
  /**
   * Workspace-level concurrent child-session cap across all active runs in this process
   * (third capacity tier after global process default and per-run max_parallel).
   */
  workspaceMaxParallel?: number;
  /** Injectable clock (run-log timestamps) + run-id generator, for determinism in tests. */
  now?: () => string;
  genRunId?: () => string;
}

/** Process-wide default ceiling for concurrent Conductor children (global capacity). */
const GLOBAL_MAX_PARALLEL_CHILDREN = 32;
/** In-flight child count per workspaceId across TaskRunner instances in this process. */
const workspaceInFlight = new Map<string, number>();

function workspaceInFlightCount(workspaceId: string): number {
  return workspaceInFlight.get(workspaceId) ?? 0;
}
function workspaceInFlightAdd(workspaceId: string, delta: number): void {
  const next = Math.max(0, workspaceInFlightCount(workspaceId) + delta);
  if (next === 0) workspaceInFlight.delete(workspaceId);
  else workspaceInFlight.set(workspaceId, next);
}

/** Test-only: clear process-wide workspace capacity counters between cases. */
export function __resetWorkspaceInFlightForTests(): void {
  workspaceInFlight.clear();
}

export interface RunOptions {
  /** The task's persistent parent/orchestrator session (author + final verifier). */
  orchestratorSessionId?: string;
  /** Resolved task param values (merged over the spec's declared defaults). */
  params?: Record<string, unknown>;
  /** Explicit run id (otherwise generated). */
  runId?: string;
  /** When the run completes, message the orchestrator to verify the result. Default true. */
  verifyOnComplete?: boolean;
}

export type RunStatus = 'running' | 'paused' | 'verifying' | 'stopped' | 'completed' | 'failed';

export interface NodeRunStatus {
  id: string;
  state: NodeRunState;
  sessionId?: string;
  attempt: number;
}

export interface RunSnapshot {
  slug: string;
  runId: string;
  taskId: string;
  status: RunStatus;
  orchestratorSessionId?: string;
  nodes: NodeRunStatus[];
  /** Sum of each child's (input + output) tokens observed at completion. */
  tokensUsed: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_PARALLEL = 4;
// Unattended children never invent privilege. When nothing is specified, intersection falls back to
// `safe` (see resolveChildPermission). Historical implicit `allow-all` is removed (PR0 / C11).
const RUNNING_STATUS = 'in-progress';
const DONE_STATUS = 'done';
// There is no 'failed' session status (the fixed set is todo|in-progress|needs-review|done|cancelled).
// We flag a failed child as 'needs-review' (amber, attention needed); the board's 'failed' run-state
// is derived from the run-log, not from a session status.
const FAILED_STATUS = 'needs-review';

// A malformed verdict (no parseable VERDICT line) is re-asked this many times before we give up and
// fail the run. These re-asks are format-only — they do NOT consume the repair (max_iterations) budget.
const MAX_UNPARSED_REASKS = 2;

const INPUTS_REF_RE = /\$\{\s*inputs\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\}/g;

/** Distributive Omit so the run-log discriminated union keeps its per-variant fields. */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type RunLogEntryInput = DistributiveOmit<RunLogEntry, 't'>;

interface NodeStateEntry {
  state: NodeRunState;
  sessionId?: string;
  attempt: number;
  /** Reason the previous attempt failed, fed back into the retry prompt (failure-aware retry). */
  lastFailure?: string;
  /** Idempotency key of the current attempt (path-lease release + spawn guard). */
  leaseAttemptKey?: string;
  /** Criterion ids marked met on the last structured report (no-progress tracking). */
  previousMetCriteria?: Set<string>;
  /** Consecutive attempts with no newly met criteria (halt at 2). */
  nonProgressingAttempts?: number;
}

// ---------------------------------------------------------------------------
// ActiveRun — a single run's state machine
// ---------------------------------------------------------------------------

class ActiveRun {
  private readonly state = new Map<string, NodeStateEntry>();
  private readonly sessionToNode = new Map<string, string>();
  private readonly outputs: Record<string, NodeOutput> = {};
  private readonly edges: Map<string, Set<string>>;
  private readonly maxParallel: number;
  private inFlight = 0;
  private tokensUsed = 0;
  /** Last observed cumulative (input+output) tokens per child session — for delta accounting. */
  private readonly sessionTokens = new Map<string, number>();
  private runStatus: RunStatus = 'running';
  private unsubscribe?: () => void;
  /** Detaches the one-shot orchestrator-verdict listener while a run is `verifying`. */
  private verdictOff?: () => void;
  /** FAIL verdicts that have triggered a repair pass (bounded by `maxRepairs`). */
  private repairsUsed = 0;
  /** Malformed-verdict re-asks issued (bounded by MAX_UNPARSED_REASKS); not a repair. */
  private unparsedReAsks = 0;
  /** Resolved repair cap = min(spec.max_iterations ?? DEFAULT, CAP). */
  private readonly maxRepairs: number;
  /** Inverted edges: node id → set of nodes that (directly) depend on it. Built lazily for the frontier. */
  private dependents?: Map<string, Set<string>>;
  private settled = false;
  private settleResolvers: ((s: RunSnapshot) => void)[] = [];
  /** Attempt keys that have been spawned (chargeable work started) — never silently re-dispatch. */
  private readonly spawnedAttemptKeys = new Set<string>();
  /** Nodes blocked in reconcile (cannot silently re-run). */
  private readonly reconcileBlocked = new Set<string>();
  /** In-process writer leases for nodes that declare `write_paths` (one ActiveRun = one manager). */
  private readonly pathLeases = new PathLeaseManager();
  /**
   * Aggregate met criterion ids across the last verification/repair frontier pass.
   * Used with shouldHaltForNoProgress so two non-progressing repairs stop the loop (C10).
   */
  private repairPreviousMet = new Set<string>();
  private repairNonProgressingAttempts = 0;

  constructor(
    private readonly spec: TaskSpec,
    private readonly slug: string,
    private readonly runId: string,
    private readonly opts: Required<Pick<RunOptions, 'verifyOnComplete'>> & RunOptions,
    private readonly deps: TaskRunnerDeps,
  ) {
    this.edges = materializeDeps(spec);
    this.maxParallel = spec.max_parallel ?? deps.defaultMaxParallel ?? DEFAULT_MAX_PARALLEL;
    // Runner-side clamp (belt-and-suspenders: the schema already caps `max_iterations` at the same
    // bound, so a parsed spec can't exceed it — but a programmatically built spec might).
    this.maxRepairs = Math.min(spec.max_iterations ?? DEFAULT_REPAIR_ATTEMPTS, MAX_REPAIR_ATTEMPTS_CAP);
    for (const node of spec.nodes) this.state.set(node.id, { state: 'pending', attempt: 0 });
  }

  // --- lifecycle ---

  start(): void {
    this.unsubscribe = this.deps.host.onSessionComplete((evt) => this.onSessionComplete(evt));
    // Snapshot the spec for this run so the Results view labels nodes by run-time titles even after
    // the live task.yaml is edited. Best-effort: a snapshot failure must not abort the run.
    try {
      writeRunSpecSnapshot(this.deps.workspaceRoot, this.slug, this.runId, this.spec);
    } catch {
      // ignore — Results falls back to run-log node ids when no snapshot exists
    }
    this.log({ kind: 'run-started', taskId: this.spec.id, runId: this.runId, orchestratorSessionId: this.opts.orchestratorSessionId, params: this.opts.params, verifyOnComplete: this.opts.verifyOnComplete });
    this.logOrganizationDecision();
    this.runStatus = 'running';
    // Move the task tile to the in-progress column for the duration of the run.
    if (this.opts.orchestratorSessionId) {
      void this.deps.host.setKanbanColumn(this.opts.orchestratorSessionId, 'in-progress');
      void this.deps.host.setSessionStatus(this.opts.orchestratorSessionId, RUNNING_STATUS);
      // Publish the full node count up front so the board's subtask progress denominator is stable,
      // rather than growing as children are spawned lazily at dispatch.
      void this.deps.host.setTaskNodeCount(this.opts.orchestratorSessionId, this.spec.nodes.length);
    }
    this.scheduleReady();
  }

  /**
   * When the DAG has ≥2 independent root nodes, record a deterministic organization note
   * (bounded-parallel vs serial-isolated). Never blocks the run — pure observability.
   */
  private logOrganizationDecision(): void {
    const roots = this.spec.nodes.filter((n) => (n.depends_on?.length ?? 0) === 0);
    if (roots.length < 2) return;
    const writePaths = roots.flatMap((n) => n.write_paths ?? []);
    let overlappingWritePaths = false;
    for (let i = 0; i < writePaths.length && !overlappingWritePaths; i++) {
      for (let j = i + 1; j < writePaths.length; j++) {
        if (pathOverlaps(writePaths[i]!, writePaths[j]!)) {
          overlappingWritePaths = true;
          break;
        }
      }
    }
    const decision = chooseOrganization({
      sequentialDependence: false,
      highSharedContext: false,
      smallTask: false,
      verificationOnly: false,
      independentWorkUnits: roots.length,
      overlappingWritePaths,
      highVerificationRisk: !!this.spec.acceptance_criteria,
    });
    this.log({
      kind: 'organization-decision',
      mode: decision.mode,
      reasons: decision.reasons,
      shouldDelegate: decision.shouldDelegate,
      independentWorkUnits: roots.length,
    });
  }

  pause(): void {
    if (this.runStatus !== 'running') return;
    this.runStatus = 'paused';
    this.log({ kind: 'run-paused' });
    // In-flight children keep running; their completions still record output but won't schedule.
  }

  resume(): void {
    if (this.runStatus !== 'paused') return;
    // Cancelled nodes return to pending so they re-dispatch. Nodes that exhausted their `retry`
    // budget stay 'failed' — automatic retry happens in failNode within the run, not on resume.
    for (const [, st] of this.state) if (st.state === 'cancelled') st.state = 'pending';
    this.runStatus = 'running';
    this.log({ kind: 'run-resumed' });
    // A resume cannot lower the spend: token_budget is a hard cap, so resuming an over-budget
    // run fails it outright rather than bouncing straight back into pauseForBudget.
    if (this.isOverBudget() && this.hasPendingNodes()) {
      this.log({ kind: 'budget-breach', metric: 'tokens', value: this.tokensUsed, limit: this.spec.token_budget! });
      this.finish('failed');
      return;
    }
    this.scheduleReady();
  }

  /**
   * Rebuild run state from a persisted run-log (cross-restart resume). Done nodes reuse their
   * recorded output and are NOT re-run. In-flight nodes are reconciled against the runtime
   * adapter when available: still-running sessions are re-attached; completed sessions settle
   * from final text; spawned-but-unknown sessions block silent re-dispatch (chargeable work
   * must not be repeated without proof it did not run).
   */
  hydrate(log: RunLogEntry[], loadOutput: (nodeId: string) => NodeOutput | null): void {
    const spawnedSessions = new Map<string, string>(); // nodeId → sessionId

    for (const e of log) {
      if (e.kind === 'node-spawned') {
        const st = this.state.get(e.nodeId);
        if (st) {
          st.sessionId = e.sessionId;
          // Spawn without a later node-finished means the attempt was in-flight at shutdown.
          if (st.state === 'pending') st.state = 'running';
          this.sessionToNode.set(e.sessionId, e.nodeId);
        }
        spawnedSessions.set(e.nodeId, e.sessionId);
        if (e.idempotencyKey) this.spawnedAttemptKeys.add(e.idempotencyKey);
      } else if (e.kind === 'node-scheduled') {
        const st = this.state.get(e.nodeId);
        if (st) st.attempt += 1;
      } else if (e.kind === 'node-finished') {
        const st = this.state.get(e.nodeId);
        if (st) st.state = e.state;
        // Replay the cumulative token counter so token_budget stays enforced across a restart
        // (entries record the run total at write time; the last one wins).
        if (typeof e.tokensUsed === 'number') this.tokensUsed = Math.max(this.tokensUsed, e.tokensUsed);
      } else if (e.kind === 'verdict') {
        // Reconstruct the durable repair counters so a cross-restart resume honors the cap rather
        // than restarting the budget from zero (the in-memory counters reset on a fresh process).
        if (e.result === 'fail') this.repairsUsed += 1;
        else if (e.result === 'unparsed') this.unparsedReAsks += 1;
        else if (e.result === 'pass') this.unparsedReAsks = 0;
      }
    }

    this.inFlight = 0;
    for (const [nodeId, st] of this.state) {
      if (st.state === 'done') {
        const out = loadOutput(nodeId);
        if (out) this.outputs[nodeId] = out;
        else st.state = 'pending'; // recorded output missing → must re-run
        continue;
      }

      if (st.state === 'cancelled') {
        // Stop already cancelled the child — safe to re-queue on resume.
        st.state = 'pending';
        st.sessionId = undefined;
        continue;
      }
      if (st.state !== 'running') continue;

      const sessionId = st.sessionId ?? spawnedSessions.get(nodeId);
      const runtime = sessionId && this.deps.host.getSessionRuntimeState
        ? this.deps.host.getSessionRuntimeState(sessionId)
        : undefined;

      if (sessionId && runtime?.exists && runtime.isProcessing) {
        // Re-attach: do not create a second child session.
        st.state = 'running';
        st.sessionId = sessionId;
        this.sessionToNode.set(sessionId, nodeId);
        this.inFlight += 1;
        workspaceInFlightAdd(this.deps.workspaceId, 1);
        continue;
      }

      if (sessionId && runtime?.exists && !runtime.isProcessing) {
        const text = runtime.finalText ?? this.deps.host.getSessionFinalText(sessionId) ?? '';
        if (text.trim()) {
          const output: NodeOutput = { text };
          this.outputs[nodeId] = output;
          st.state = 'done';
          st.sessionId = sessionId;
          writeNodeOutput(this.deps.workspaceRoot, this.slug, this.runId, nodeId, output);
          this.log({
            kind: 'node-finished',
            nodeId,
            sessionId,
            state: 'done',
            tokensUsed: this.tokensUsed,
          });
          continue;
        }
        st.state = 'failed';
        this.log({
          kind: 'node-finished',
          nodeId,
          sessionId,
          state: 'failed',
          reason: 'reconcile: session idle without output after restart',
        });
        continue;
      }

      if (sessionId && runtime && !runtime.exists) {
        this.reconcileBlocked.add(nodeId);
        st.state = 'failed';
        this.log({
          kind: 'reconcile-blocked',
          nodeId,
          sessionId,
          reason: 'spawned session missing after restart; refusing silent re-dispatch',
        });
        this.log({
          kind: 'node-finished',
          nodeId,
          sessionId,
          state: 'failed',
          reason: 'reconcile-blocked: missing session',
        });
        continue;
      }

      if (sessionId && !runtime) {
        // Host cannot answer: re-attach without creating a second session.
        st.state = 'running';
        st.sessionId = sessionId;
        this.sessionToNode.set(sessionId, nodeId);
        this.inFlight += 1;
        workspaceInFlightAdd(this.deps.workspaceId, 1);
        this.log({
          kind: 'reconcile-blocked',
          nodeId,
          sessionId,
          reason: 'no runtime adapter query; re-attached without re-dispatch',
        });
        continue;
      }

      // No session yet (work-intent only or cancelled before spawn) → safe to re-queue.
      st.state = 'pending';
      st.sessionId = undefined;
    }
  }

  /** Resume a hydrated run: subscribe, log, and schedule the ready set (finished nodes are skipped). */
  resumeFromHydrated(): void {
    if (this.unsubscribe) return;
    this.runStatus = 'running';
    this.unsubscribe = this.deps.host.onSessionComplete((evt) => this.onSessionComplete(evt));
    this.log({ kind: 'run-resumed' });
    // Same hard-cap rule as resume(): an over-budget run fails instead of re-pausing forever.
    if (this.isOverBudget() && this.hasPendingNodes()) {
      this.log({ kind: 'budget-breach', metric: 'tokens', value: this.tokensUsed, limit: this.spec.token_budget! });
      this.finish('failed');
      return;
    }
    this.scheduleReady();
  }

  async stop(): Promise<void> {
    if (this.isTerminal()) return;
    this.runStatus = 'stopped';
    this.log({ kind: 'run-stopped' });
    for (const [nodeId, st] of this.state) {
      if (st.state === 'running') {
        st.state = 'cancelled';
        this.releaseNodeLeases(nodeId);
        this.releaseInFlightSlot();
        this.log({ kind: 'node-finished', nodeId, sessionId: st.sessionId ?? '', state: 'cancelled', reason: 'stopped' });
        if (st.sessionId) {
          void this.deps.host.cancelProcessing(st.sessionId, true);
          void this.deps.host.setKanbanColumn(st.sessionId, 'todo');
        }
      }
    }
    this.inFlight = 0;
    this.finalize();
  }

  waitUntilSettled(): Promise<RunSnapshot> {
    if (this.settled) return Promise.resolve(this.snapshot());
    return new Promise((resolve) => this.settleResolvers.push(resolve));
  }

  snapshot(): RunSnapshot {
    return {
      slug: this.slug,
      runId: this.runId,
      taskId: this.spec.id,
      status: this.runStatus,
      orchestratorSessionId: this.opts.orchestratorSessionId,
      tokensUsed: this.tokensUsed,
      nodes: this.spec.nodes.map((n) => {
        const st = this.state.get(n.id)!;
        return { id: n.id, state: st.state, sessionId: st.sessionId, attempt: st.attempt };
      }),
    };
  }

  // --- scheduling ---

  private scheduleReady(): void {
    if (this.runStatus !== 'running') return;
    const workspaceCap = this.deps.workspaceMaxParallel ?? GLOBAL_MAX_PARALLEL_CHILDREN;
    for (const node of this.spec.nodes) {
      // Three capacity tiers: run max_parallel · workspace · global process default.
      if (this.inFlight >= this.maxParallel) break;
      if (workspaceInFlightCount(this.deps.workspaceId) >= workspaceCap) break;
      if (!this.isReady(node)) continue;
      if (this.isOverBudget()) {
        this.pauseForBudget();
        return;
      }
      this.markRunning(node);
      void this.dispatch(node);
    }
    this.maybeFinish();
  }

  private isReady(node: TaskNode): boolean {
    if (this.state.get(node.id)!.state !== 'pending') return false;
    for (const dep of this.edges.get(node.id) ?? []) {
      if (this.state.get(dep)?.state !== 'done') return false;
    }
    return true;
  }

  private markRunning(node: TaskNode): void {
    const st = this.state.get(node.id)!;
    // Drop the previous attempt's session mapping before dispatching a new one — a late
    // completion from the old session must never settle the new attempt.
    if (st.sessionId) {
      this.sessionToNode.delete(st.sessionId);
      st.sessionId = undefined;
    }
    st.state = 'running';
    st.attempt += 1;
    this.inFlight += 1;
    workspaceInFlightAdd(this.deps.workspaceId, 1);
    this.log({ kind: 'node-scheduled', nodeId: node.id });
  }

  private releaseInFlightSlot(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
    workspaceInFlightAdd(this.deps.workspaceId, -1);
  }

  private resolveNodePermission(node: TaskNode): {
    ok: true;
    mode: PermissionMode;
  } | {
    ok: false;
    reason: string;
    parentMode?: PermissionMode;
    requestedMode?: PermissionMode;
  } {
    const parentMode =
      (this.opts.orchestratorSessionId && this.deps.host.getSessionPermissionMode
        ? this.deps.host.getSessionPermissionMode(this.opts.orchestratorSessionId)
        : undefined) ?? undefined;
    const requested = (node.permissionMode ?? undefined) as PermissionMode | undefined;
    const taskDefault = (this.spec.defaults?.permissionMode ?? undefined) as PermissionMode | undefined;
    const resolved = resolveChildPermission({
      parent: parentMode,
      requested,
      taskDefault,
      unattended: true,
      approvalAvailable: false,
    });
    if (!resolved.ok) {
      return {
        ok: false,
        reason: resolved.message,
        parentMode: parentMode,
        requestedMode: requested ?? taskDefault,
      };
    }
    return { ok: true, mode: resolved.mode };
  }

  private async dispatch(node: TaskNode): Promise<void> {
    try {
      const st = this.state.get(node.id)!;
      if (this.reconcileBlocked.has(node.id)) {
        this.failNode(node.id, 'reconcile-blocked: refusing re-dispatch');
        return;
      }

      const perm = this.resolveNodePermission(node);
      if (!perm.ok) {
        this.log({
          kind: 'permission-denied',
          nodeId: node.id,
          reason: perm.reason,
          parentMode: perm.parentMode,
          requestedMode: perm.requestedMode,
        });
        this.failNode(node.id, `permission denied: ${perm.reason}`);
        return;
      }

      const taskPath = `${this.slug}/${node.id}`;
      const idempotencyKey = attemptIdempotencyKey({
        contractVersion: this.spec.id,
        taskPath,
        attempt: st.attempt,
      });
      // If this exact attempt already spawned a child (restart/reconcile), never create another.
      if (this.spawnedAttemptKeys.has(idempotencyKey)) {
        this.log({
          kind: 'reconcile-blocked',
          nodeId: node.id,
          reason: `attempt already spawned: ${idempotencyKey}`,
        });
        this.failNode(node.id, `duplicate spawn blocked for ${idempotencyKey}`);
        return;
      }

      // Path leases (sync, before any await): exclusive writers for declared write_paths.
      // Nodes without write_paths take no lease so shared-cwd parallel still works.
      if (!this.tryAcquireWriteLeases(node, idempotencyKey)) {
        return;
      }
      st.leaseAttemptKey = idempotencyKey;

      // Persist work intent BEFORE createSession (AionUi: durable then deliver).
      this.log({
        kind: 'work-intent',
        nodeId: node.id,
        attempt: st.attempt,
        idempotencyKey,
        contractVersion: this.spec.id,
      });

      // Task-level skills ride as [skill:slug] mentions on every child prompt — the agent
      // pipeline resolves each SKILL.md and blocks tools until it is read (skills-as-context).
      const prompt = skillsPreamble(this.spec.skills) + (await this.buildPrompt(node));
      // Children run where the parent runs: inherit the orchestrator's resolved working directory,
      // falling back to the spec's declared `cwd`. Without this they default to the workspace cwd
      // rather than the parent session's (project) directory.
      const cwd =
        (this.opts.orchestratorSessionId
          ? this.deps.host.getSessionWorkingDirectory(this.opts.orchestratorSessionId)
          : undefined) ?? this.spec.cwd;

      const options: CreateSessionOptions = {
        parentSessionId: this.opts.orchestratorSessionId,
        // Link the child back to the task / run / node so the manual subtask composer can
        // tell Conductor-owned children apart from hand-authored subtasks (it skips the former).
        taskSlug: this.slug,
        taskRunId: this.runId,
        taskNodeId: node.id,
        name: nodeTitle(node),
        model: node.model ?? this.spec.defaults?.model,
        // Required for non-default (e.g. pi/*) models to resolve a backend — without it the
        // child session completes instantly with no output.
        llmConnection: node.llmConnection ?? this.spec.defaults?.llmConnection,
        // Monotonic intersection: parent ∩ node/task request — never implicit allow-all.
        permissionMode: perm.mode,
        labels: node.labels,
        // Inherit the orchestrator's task number (task::N) so the whole run filters as one task.
        applyTaskLabel: true,
        // Task-level sources become the child's enabled-sources set (spec omitted → workspace default).
        ...(this.spec.sources?.length ? { enabledSourceSlugs: this.spec.sources } : {}),
        projectId: this.spec.project,
        ...(cwd ? { workingDirectory: cwd } : {}),
        sessionStatus: RUNNING_STATUS,
      };
      // createSession announces the child to the renderer by default, so it nests under the task
      // tile with its real title instead of a fabricated "New Chat" (or never appearing).
      const child = await this.deps.host.createSession(this.deps.workspaceId, options);
      // stop() may have landed mid-dispatch: the node is no longer running and the run is
      // terminal, so sending the prompt would spawn an orphaned child. Tear down instead.
      if (st.state !== 'running' || this.isTerminal()) {
        this.releaseNodeLeases(node.id);
        void this.deps.host.cancelProcessing(child.id, true);
        return;
      }
      st.sessionId = child.id;
      this.sessionToNode.set(child.id, node.id);
      this.spawnedAttemptKeys.add(idempotencyKey);
      this.log({
        kind: 'node-spawned',
        nodeId: node.id,
        sessionId: child.id,
        attempt: st.attempt,
        idempotencyKey,
      });
      await this.deps.host.setKanbanColumn(child.id, 'in-progress');
      if (st.state !== 'running' || this.isTerminal()) {
        this.releaseNodeLeases(node.id);
        void this.deps.host.cancelProcessing(child.id, true);
        return;
      }
      await this.deps.host.sendMessage(child.id, prompt);
    } catch (err) {
      this.failNode(node.id, `dispatch failed: ${(err as Error).message}`);
    }
  }

  /**
   * Acquire exclusive writer leases for every path in `node.write_paths`.
   * On conflict, fails the node with a clear message and returns false.
   */
  private tryAcquireWriteLeases(node: TaskNode, attemptKey: string): boolean {
    const paths = node.write_paths ?? [];
    if (paths.length === 0) return true;
    const now = this.deps.now ? this.deps.now() : new Date().toISOString();
    for (const path of paths) {
      const acq = this.pathLeases.tryAcquire({
        path,
        holderId: node.id,
        role: 'writer',
        attemptKey,
        now,
      });
      if (!acq.ok) {
        this.pathLeases.release(attemptKey);
        this.log({
          kind: 'path-lease-denied',
          nodeId: node.id,
          path: acq.denial.path,
          reason: acq.denial.message,
          holderId: acq.denial.existing?.holderId,
        });
        this.failNode(node.id, `path lease conflict: ${acq.denial.message}`);
        return false;
      }
    }
    return true;
  }

  private releaseNodeLeases(nodeId: string): void {
    const st = this.state.get(nodeId);
    if (!st?.leaseAttemptKey) return;
    this.pathLeases.release(st.leaseAttemptKey);
    st.leaseAttemptKey = undefined;
  }

  /**
   * Resolve a node's prompt: declared inputs (+ optional summarize) then ${…} interpolation.
   * Nodes that require structured RunReports receive a TaskBrief envelope (C3).
   * Intermediate plain-text nodes keep the raw interpolated prompt for graph plumbing.
   */
  private async buildPrompt(node: TaskNode): Promise<string> {
    const inputValues: Record<string, unknown> = {};
    for (const [name, ref] of Object.entries(node.inputs ?? {})) {
      const fromExpr = typeof ref === 'string' ? ref : ref.from;
      const summarize = typeof ref === 'string' ? false : !!ref.summarize;
      let resolved = interpolateRefs(fromExpr, { nodeOutputs: this.outputs, params: this.opts.params });
      if (summarize && this.deps.summarize) resolved = await this.deps.summarize(resolved);
      inputValues[name] = resolved;
    }
    let text = interpolateRefs(node.prompt ?? '', { nodeOutputs: this.outputs, params: this.opts.params });
    text = text.replace(INPUTS_REF_RE, (raw, name: string) => (name in inputValues ? String(inputValues[name]) : raw));

    // Failure-aware retry: prepend the prior failure so a retried session knows what went wrong
    // instead of blindly repeating a deterministic failure.
    const st = this.state.get(node.id)!;
    if (st.attempt > 1 && st.lastFailure) {
      text = `${st.lastFailure}\n\n${text}`;
    }

    if (requiresStructuredReport(node)) {
      const acceptance = acceptanceLines(this.spec, node);
      const brief: TaskBrief = {
        goal: text.trim() || nodeTitle(node),
        acceptance,
        deliverable: 'RunReport with criterion outcomes and evidence refs (not a transcript)',
        scopePaths: node.write_paths ?? [],
        reservedPaths: [],
        knownFacts: Object.entries(inputValues).map(([k, v]) => `${k}: ${String(v).slice(0, 500)}`),
        references: [],
        constraints: [
          `Task path: ${this.slug}/${node.id}`,
          `Run: ${this.runId}`,
          'Do not dump the full transcript; return a structured RunReport JSON block.',
        ],
        budget: this.spec.token_budget ? { maxTokens: this.spec.token_budget } : {},
        contextFork: 'none',
        permissionMode: node.permissionMode ?? this.spec.defaults?.permissionMode,
        taskPath: `${this.slug}/${node.id}`,
        model: node.model ?? this.spec.defaults?.model,
        llmConnection: node.llmConnection ?? this.spec.defaults?.llmConnection,
      };
      text = formatTaskBriefMessage(brief);
    }

    return text;
  }

  // --- completion ---

  private onSessionComplete(evt: SessionCompletionEvent): void {
    const nodeId = this.sessionToNode.get(evt.sessionId);
    if (!nodeId) return; // not one of our child nodes
    const st = this.state.get(nodeId);
    if (!st || st.state !== 'running') return; // already settled/cancelled
    if (st.sessionId !== evt.sessionId) {
      // Stale mapping from a prior attempt (markRunning clears it on re-dispatch, but defend
      // here too): a late completion from the old session must not settle the new attempt.
      this.sessionToNode.delete(evt.sessionId);
      return;
    }

    if (evt.tokenUsage) {
      // `tokenUsage` is cumulative-per-session; add only the delta since this session's last
      // observed total so a node that ever runs >1 turn (future retry/loop) can't double-count.
      const cumulative = (evt.tokenUsage.inputTokens ?? 0) + (evt.tokenUsage.outputTokens ?? 0);
      const prev = this.sessionTokens.get(evt.sessionId) ?? 0;
      this.tokensUsed += Math.max(0, cumulative - prev);
      this.sessionTokens.set(evt.sessionId, cumulative);
    }

    // Completion-time budget check: pause immediately on breach (not only at schedule-time), but
    // only while pending work remains — never block a run that is about to finish.
    if (this.isOverBudget() && this.runStatus === 'running' && this.hasPendingNodes()) {
      this.pauseForBudget();
    }

    if (evt.reason === 'complete') {
      const text = evt.finalText ?? this.deps.host.getSessionFinalText(evt.sessionId) ?? '';
      const node = this.spec.nodes.find((n) => n.id === nodeId);
      const requiresStructured = requiresStructuredReport(node);

      // A clean turn-completion is not proof of success: a node that declared `outputs` but
      // produced no text delivered nothing. Treat that as a failure (retry/needs-review) instead
      // of silently marking it done. Nodes with no declared outputs keep the lenient behavior.
      if ((node?.outputs?.length ?? 0) > 0 && text.trim() === '') {
        this.failNode(nodeId, 'completed without producing declared output', evt.sessionId);
        return;
      }

      const settled = this.settleNodeOutput(nodeId, text, requiresStructured);
      if (!settled.ok) {
        this.failNode(nodeId, settled.reason, evt.sessionId);
        return;
      }

      this.outputs[nodeId] = settled.output;
      st.state = 'done';
      this.releaseInFlightSlot();
      this.releaseNodeLeases(nodeId);
      writeNodeOutput(this.deps.workspaceRoot, this.slug, this.runId, nodeId, settled.output);
      this.log({ kind: 'node-finished', nodeId, sessionId: evt.sessionId, state: 'done', tokensUsed: this.tokensUsed });
      void this.deps.host.setSessionStatus(evt.sessionId, DONE_STATUS);
      void this.deps.host.setKanbanColumn(evt.sessionId, 'done');
      this.scheduleReady();
    } else if (evt.reason === 'interrupted') {
      // Externally aborted while running → cancelled (re-dispatched on resume). We do not
      // auto-retry here to avoid a stop/retry loop.
      st.state = 'cancelled';
      this.releaseInFlightSlot();
      this.releaseNodeLeases(nodeId);
      this.log({ kind: 'node-finished', nodeId, sessionId: evt.sessionId, state: 'cancelled', reason: 'interrupted', tokensUsed: this.tokensUsed });
      void this.deps.host.setKanbanColumn(evt.sessionId, 'todo');
      this.scheduleReady();
    } else {
      // 'error' | 'timeout'
      this.failNode(nodeId, evt.reason, evt.sessionId);
    }
  }

  /**
   * Parse optional RunReport, validate when a contract applies, and enforce hard structured
   * acceptance for nodes that declared outputs (soft parse for intermediate plain-text nodes).
   */
  private settleNodeOutput(
    nodeId: string,
    text: string,
    requiresStructured: boolean,
  ): { ok: true; output: NodeOutput } | { ok: false; reason: string } {
    const st = this.state.get(nodeId)!;
    const { report, structured } = parseRunReportFromText(text);
    const contract = this.contractForNode(nodeId);

    let validation: NodeOutput['validation'];
    if (contract && (structured || requiresStructured)) {
      const result = validateRunReport({
        contract,
        text,
        report: report ?? undefined,
      });
      validation = {
        ok: result.ok,
        suggestedVerdict: result.suggestedVerdict,
        issues: result.issues.map((i) => i.message),
      };

      if (requiresStructured && !result.structured) {
        return {
          ok: false,
          reason:
            'completed with natural language only; structured RunReport required because ' +
            'this node declares outputs (or acceptance criteria demand a report)',
        };
      }
      if (requiresStructured && !result.ok) {
        // Still record report/validation on failure path via failNode lastFailure only —
        // progress tracking uses criteria when present.
        this.trackNodeProgress(st, result.report);
        return {
          ok: false,
          reason:
            `RunReport validation failed: ${(validation.issues ?? []).join('; ') || result.suggestedVerdict}`,
        };
      }
    } else if (requiresStructured && !structured) {
      return {
        ok: false,
        reason:
          'completed with natural language only; structured RunReport required because ' +
          'this node declares outputs',
      };
    }

    if (report) this.trackNodeProgress(st, report);

    const output: NodeOutput = { text };
    if (report) output.report = report as NodeOutput['report'];
    if (validation) output.validation = validation;
    return { ok: true, output };
  }

  /** Build a TaskContract for validation when the node requires structured acceptance. */
  private contractForNode(nodeId: string): TaskContract | null {
    const node = this.spec.nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    if (!requiresStructuredReport(node)) return null;

    const acceptance = acceptanceLines(this.spec, node);
    if (acceptance.length === 0) return null;

    const brief: TaskBrief = {
      goal: this.spec.goal,
      acceptance,
      deliverable: 'RunReport with criterion outcomes and evidence refs (not a transcript)',
      scopePaths: node.write_paths ?? [],
      reservedPaths: [],
      knownFacts: [],
      references: [],
      constraints: [],
      budget: {},
      contextFork: 'none',
    };
    return contractFromBrief(brief, {
      taskId: this.spec.id,
      taskPath: `${this.slug}/${nodeId}`,
      version: this.spec.id,
    });
  }

  private trackNodeProgress(st: NodeStateEntry, report: RunReport | null): void {
    if (!report) return;
    const currentMet = new Set(
      report.criteria.filter((c) => c.status === 'met').map((c) => c.id),
    );
    const progress = shouldHaltForNoProgress({
      previousMet: st.previousMetCriteria ?? new Set(),
      currentMet,
      nonProgressingAttempts: st.nonProgressingAttempts ?? 0,
    });
    st.previousMetCriteria = currentMet;
    st.nonProgressingAttempts = progress.nonProgressingAttempts;
  }

  private failNode(nodeId: string, reason: string, sessionId?: string): void {
    const st = this.state.get(nodeId)!;
    const wasRunning = st.state === 'running';
    if (wasRunning) this.releaseInFlightSlot();
    this.releaseNodeLeases(nodeId);

    // Bounded, failure-aware retry: re-dispatch the node when its `retry` policy still
    // has budget and matches this failure class. error/timeout/dispatch failures all map
    // to the `error` retry trigger. Two non-progressing structured attempts halt retries (C10).
    const node = this.spec.nodes.find((n) => n.id === nodeId);
    const retry = node?.retry;
    const haltNoProgress = (st.nonProgressingAttempts ?? 0) >= 2;
    if (
      !haltNoProgress &&
      retry &&
      st.attempt <= retry.limit &&
      retryMatches(retry.when, 'error')
    ) {
      st.lastFailure = `Previous attempt failed: ${reason}. Address the cause before retrying.`;
      st.state = 'pending';
      const sid = sessionId ?? st.sessionId;
      if (sid) void this.deps.host.setKanbanColumn(sid, 'todo');
      this.log({ kind: 'node-retry', nodeId, attempt: st.attempt, reason });
      this.scheduleReady();
      return;
    }

    const finalReason = haltNoProgress
      ? `no-progress halt after ${st.nonProgressingAttempts} non-progressing attempts: ${reason}`
      : reason;
    st.state = 'failed';
    const sid = sessionId ?? st.sessionId;
    this.log({
      kind: 'node-finished',
      nodeId,
      sessionId: sid ?? '',
      state: 'failed',
      reason: finalReason,
      tokensUsed: this.tokensUsed,
    });
    if (sid) void this.deps.host.setSessionStatus(sid, FAILED_STATUS);
    this.scheduleReady();
  }

  private maybeFinish(): void {
    if (this.runStatus !== 'running') return;
    if (this.inFlight > 0) return;
    if (this.spec.nodes.some((n) => this.isReady(n))) return; // more to dispatch
    const allGood = this.spec.nodes.every((n) => {
      const s = this.state.get(n.id)!.state;
      return s === 'done' || s === 'skipped';
    });
    if (!allGood) {
      // A cancelled node (externally interrupted) is not a terminal failure: it re-dispatches
      // on resume. Pause the run so it stays resumable instead of settling it as failed.
      const hasCancelled = this.spec.nodes.some((n) => this.state.get(n.id)!.state === 'cancelled');
      if (hasCancelled) {
        this.pause();
        return;
      }
      this.finish('failed');
      return;
    }
    // All nodes succeeded. Gate the terminal status on the orchestrator's verdict when there is one
    // to ask; with no orchestrator there is nothing to verify against, so complete directly.
    if (this.opts.verifyOnComplete && this.opts.orchestratorSessionId) {
      this.enterVerifying();
    } else {
      this.finish('completed');
    }
  }

  /** Enter the non-terminal `verifying` state and ask the orchestrator for a verdict. Does NOT finalize. */
  private enterVerifying(): void {
    this.runStatus = 'verifying';
    this.log({ kind: 'run-verifying' });
    void this.sendVerification();
  }

  private finish(status: RunStatus): void {
    this.runStatus = status;
    this.log({ kind: status === 'completed' ? 'run-completed' : 'run-failed' });
    // Settle the task tile: completed → done, failed → needs-review (the fixed status set has no
    // 'failed'). The in-progress column was set at start().
    const orchestrator = this.opts.orchestratorSessionId;
    if (orchestrator) {
      if (status === 'completed') {
        void this.deps.host.setKanbanColumn(orchestrator, 'done');
        void this.deps.host.setSessionStatus(orchestrator, DONE_STATUS);
      } else {
        void this.deps.host.setSessionStatus(orchestrator, FAILED_STATUS);
      }
    }
    this.finalize();
  }

  private finalize(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.verdictOff?.();
    this.verdictOff = undefined;
    if (this.settled) return;
    this.settled = true;
    const snap = this.snapshot();
    for (const resolve of this.settleResolvers) resolve(snap);
    this.settleResolvers = [];
  }

  private async sendVerification(): Promise<void> {
    const orchestrator = this.opts.orchestratorSessionId;
    if (!orchestrator) {
      this.finish('completed');
      return;
    }
    this.attachVerdictListener(orchestrator);
    const sections = this.spec.nodes.map((n) => {
      const out = this.outputs[n.id];
      return `### ${nodeTitle(n)} (${n.id})\n${out ? out.text : '(no output)'}`;
    });
    const rubric = this.spec.acceptance_criteria
      ? `Acceptance criteria:\n${this.spec.acceptance_criteria}`
      : `Goal: ${this.spec.goal}`;
    const message = [
      `The task "${this.spec.title}" has finished running.`,
      '',
      rubric,
      '',
      'Node outputs:',
      ...sections,
      '',
      'Verify the final result against the criteria above and summarize the outcome.',
      'End your reply with a verdict line, on its own line, in exactly one of these forms:',
      'VERDICT: PASS',
      'VERDICT: FAIL — <one-line reason>',
      'If only some subtasks need redoing, name them so only those (and their dependents) re-run:',
      'VERDICT: FAIL — nodes=<id>,<id> — <one-line reason>',
    ].join('\n');
    await this.sendToOrchestrator(orchestrator, message);
  }

  /**
   * Attach the one-shot orchestrator-verdict listener (separate from the run's main subscription).
   * It catches the orchestrator's next completion, detaches itself, and routes the text to handleVerdict.
   */
  private attachVerdictListener(orchestrator: string): void {
    this.verdictOff?.();
    this.verdictOff = this.deps.host.onSessionComplete((evt) => {
      if (evt.sessionId !== orchestrator) return;
      this.verdictOff?.();
      this.verdictOff = undefined;
      const text = evt.finalText ?? this.deps.host.getSessionFinalText(orchestrator) ?? '';
      this.handleVerdict(text);
    });
  }

  /** Send to the orchestrator, failing the run (rather than hanging in `verifying`) if the send rejects. */
  private async sendToOrchestrator(orchestrator: string, message: string): Promise<void> {
    try {
      await this.deps.host.sendMessage(orchestrator, message);
    } catch {
      // The verdict will never arrive — detach the listener and settle as failed instead of hanging.
      this.verdictOff?.();
      this.verdictOff = undefined;
      this.finish('failed');
    }
  }

  /**
   * Apply the orchestrator's parsed verdict:
   *   PASS      → completed.
   *   unparsed  → re-ask for a well-formed verdict (bounded; not a repair); exhausted → failed.
   *   FAIL      → repair the frontier if budget remains, else failed (iterations/token budget breach).
   */
  private handleVerdict(text: string): void {
    if (this.runStatus !== 'verifying') return; // stopped/finalized while awaiting the verdict
    writeNodeOutput(this.deps.workspaceRoot, this.slug, this.runId, '__verdict__', { text });
    const verdict = parseVerdict(text);
    this.log({ kind: 'verdict', result: verdict.result, reason: verdict.reason, nodes: verdict.nodes });

    if (verdict.result === 'pass') {
      this.unparsedReAsks = 0;
      this.finish('completed');
      return;
    }

    if (verdict.result === 'unparsed') {
      if (this.unparsedReAsks < MAX_UNPARSED_REASKS) {
        this.unparsedReAsks += 1;
        void this.reAskVerdict();
        return;
      }
      // Repeatedly malformed → don't hang the run forever.
      this.finish('failed');
      return;
    }

    // FAIL — repair the frontier if there is budget for it.
    if (this.repairsUsed >= this.maxRepairs) {
      this.log({ kind: 'budget-breach', metric: 'iterations', value: this.repairsUsed, limit: this.maxRepairs });
      this.finish('failed');
      return;
    }
    if (this.isOverBudget()) {
      this.log({ kind: 'budget-breach', metric: 'tokens', value: this.tokensUsed, limit: this.spec.token_budget! });
      this.finish('failed');
      return;
    }
    this.repairsUsed += 1;
    this.repairForVerdict(verdict.reason, verdict.nodes);
  }

  /** Re-ask the orchestrator for a parseable verdict line (format-only; does not consume repair budget). */
  private async reAskVerdict(): Promise<void> {
    const orchestrator = this.opts.orchestratorSessionId;
    if (!orchestrator) {
      this.finish('completed');
      return;
    }
    this.attachVerdictListener(orchestrator);
    const message = [
      'Your previous reply did not include a parseable verdict line.',
      'Reply with the verdict line only, on its own line, in exactly one of these forms:',
      'VERDICT: PASS',
      'VERDICT: FAIL — <one-line reason>',
      'VERDICT: FAIL — nodes=<id>,<id> — <one-line reason>',
    ].join('\n');
    await this.sendToOrchestrator(orchestrator, message);
  }

  /**
   * On a FAIL verdict, re-run the repair frontier with the rejection reason as failure context.
   * The frontier is the orchestrator-named nodes ∪ their transitive dependents (so a re-run upstream
   * node forces everything that consumes its output to re-run too). With no usable names it is the
   * whole DAG. Only `done` nodes are reset; scheduleReady re-dispatches from the satisfied sources.
   */
  private repairForVerdict(reason: string | undefined, named?: string[]): void {
    const detail = reason ?? 'the result did not meet the acceptance criteria';
    const frontier = this.computeFrontier(named);

    // No-progress halt (C10): when structured reports exist on the frontier, two consecutive
    // repair passes with no newly met criteria stop further repairs.
    if (this.shouldHaltRepairForNoProgress(frontier)) {
      this.log({
        kind: 'budget-breach',
        metric: 'iterations',
        value: this.repairNonProgressingAttempts,
        limit: 2,
      });
      this.finish('failed');
      return;
    }

    let reset = 0;
    for (const id of frontier) {
      const st = this.state.get(id);
      if (!st || st.state !== 'done') continue;
      st.state = 'pending';
      st.lastFailure = `The previous result was rejected on verification: ${detail}. Revise your output to meet the acceptance criteria.`;
      this.log({ kind: 'node-retry', nodeId: id, attempt: st.attempt, reason: `verdict-fail: ${detail}` });
      reset += 1;
    }
    if (reset === 0) {
      // No `done` node in the frontier to re-run → don't hang the run.
      this.finish('failed');
      return;
    }
    this.runStatus = 'running';
    this.scheduleReady();
  }

  /**
   * Aggregate met criterion ids from structured node reports on the frontier and decide
   * whether another repair would be a third non-progressing attempt.
   */
  private shouldHaltRepairForNoProgress(frontier: Set<string>): boolean {
    let hasStructured = false;
    const currentMet = new Set<string>();
    for (const id of frontier) {
      const report = this.outputs[id]?.report;
      if (!report?.criteria) continue;
      hasStructured = true;
      for (const c of report.criteria) {
        if (c.status === 'met') currentMet.add(`${id}:${c.id}`);
      }
    }
    if (!hasStructured && this.repairPreviousMet.size === 0) return false;
    const progress = shouldHaltForNoProgress({
      previousMet: this.repairPreviousMet,
      currentMet,
      nonProgressingAttempts: this.repairNonProgressingAttempts,
    });
    this.repairPreviousMet = currentMet;
    this.repairNonProgressingAttempts = progress.nonProgressingAttempts;
    return progress.halt;
  }

  /**
   * The set of nodes a repair pass re-runs: the orchestrator-named nodes plus everything that
   * (transitively) depends on them. Unknown/empty names degrade to the whole DAG.
   */
  private computeFrontier(named?: string[]): Set<string> {
    const valid = (named ?? []).filter((id) => this.state.has(id));
    if (valid.length === 0) return new Set(this.spec.nodes.map((n) => n.id));
    const dependents = this.dependentsMap();
    const frontier = new Set<string>();
    const queue = [...valid];
    while (queue.length) {
      const id = queue.shift()!;
      if (frontier.has(id)) continue;
      frontier.add(id);
      for (const d of dependents.get(id) ?? []) if (!frontier.has(d)) queue.push(d);
    }
    return frontier;
  }

  /** Inverted `edges`: node id → set of nodes that directly depend on it (memoized). */
  private dependentsMap(): Map<string, Set<string>> {
    if (this.dependents) return this.dependents;
    const map = new Map<string, Set<string>>();
    for (const n of this.spec.nodes) map.set(n.id, new Set());
    for (const [node, upstreams] of this.edges) {
      for (const u of upstreams) map.get(u)?.add(node);
    }
    this.dependents = map;
    return map;
  }

  // --- budget ---

  private isOverBudget(): boolean {
    return this.spec.token_budget !== undefined && this.tokensUsed >= this.spec.token_budget;
  }

  private pauseForBudget(): void {
    this.log({ kind: 'budget-breach', metric: 'tokens', value: this.tokensUsed, limit: this.spec.token_budget! });
    this.pause();
  }

  /** True if any node is still waiting to be dispatched (used to avoid pausing a finishable run). */
  private hasPendingNodes(): boolean {
    for (const st of this.state.values()) if (st.state === 'pending') return true;
    return false;
  }

  // --- helpers ---

  private isTerminal(): boolean {
    return this.runStatus === 'completed' || this.runStatus === 'failed' || this.runStatus === 'stopped';
  }

  private log(entry: RunLogEntryInput): void {
    const t = this.deps.now ? this.deps.now() : new Date().toISOString();
    appendRunLog(this.deps.workspaceRoot, this.slug, this.runId, { ...entry, t } as RunLogEntry);
  }
}

// ---------------------------------------------------------------------------
// TaskRunner — registry/service over active runs
// ---------------------------------------------------------------------------

/**
 * Prefix for dispatched child prompts carrying the task's skill list as [skill:slug]
 * mentions. The agent pipeline (base-agent) parses these from any message, resolves each
 * skill's SKILL.md, and blocks tool use until the files are read — so task-level skills
 * act as mandatory context for every subtask. Empty/absent skills → empty prefix.
 */
function skillsPreamble(skills: string[] | undefined): string {
  if (!skills?.length) return '';
  return `Apply these skills: ${skills.map((s) => `[skill:${s}]`).join(' ')}\n\n`;
}

/**
 * Whether a node's `retry.when` trigger covers a given failure class. An absent `when`
 * defaults to retrying on `error` (the common "transient failure" case); `empty`/`invalid`
 * triggers are opt-in and not yet produced by the runner, so they never match here.
 */
function retryMatches(when: 'error' | 'empty' | 'invalid' | undefined, failure: 'error'): boolean {
  return (when ?? 'error') === failure;
}

/**
 * Hard structured-report gate: nodes that declare `outputs` must return a parseable
 * RunReport (NL-only is not acceptance). Intermediate nodes without outputs stay lenient.
 */
function requiresStructuredReport(node: TaskNode | undefined): boolean {
  return (node?.outputs?.length ?? 0) > 0;
}

/** Acceptance lines used to lock a TaskContract for RunReport validation. */
function acceptanceLines(spec: TaskSpec, node: TaskNode): string[] {
  if (spec.acceptance_criteria?.trim()) {
    const lines = spec.acceptance_criteria
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length) return lines;
  }
  if (node.outputs?.length) {
    return node.outputs.map((o) => `Produce declared output "${o.name}"`);
  }
  return ['Produce a structured RunReport for the node goal'];
}

/**
 * Parse the orchestrator's machine-readable verdict line. Tolerant of surrounding prose: the last
 * `VERDICT: PASS|FAIL [— [nodes=a,b — ]reason]` occurrence wins. A missing/garbled line is `unparsed`
 * — the caller re-asks (bounded) rather than hanging the run on a malformed reply.
 *
 * The optional `nodes=<id>,<id>` prefix names the subtasks to re-run on a FAIL (scoped repair). Node
 * ids are slugs (may contain single hyphens), so the prefix is split from the reason on an em-dash or
 * colon only — never on the hyphen that legitimately appears inside a slug.
 */
function parseVerdict(text: string): { result: 'pass' | 'fail' | 'unparsed'; reason?: string; nodes?: string[] } {
  const matches = [...text.matchAll(/VERDICT:\s*(PASS|FAIL)\b[ \t]*(?:[—:-]+[ \t]*([^\n]*))?/gi)];
  const last = matches.at(-1);
  if (!last) return { result: 'unparsed' };
  const result = last[1]!.toUpperCase() === 'PASS' ? 'pass' : 'fail';
  let rest = last[2]?.trim() || undefined;
  let nodes: string[] | undefined;
  if (rest) {
    const m = rest.match(/^nodes=([a-z0-9,\- ]+?)\s*(?:[—:]+\s*(.*))?$/i);
    if (m) {
      nodes = m[1]!.split(',').map((s) => s.trim()).filter(Boolean);
      rest = m[2]?.trim() || undefined;
    }
  }
  const out: { result: 'pass' | 'fail' | 'unparsed'; reason?: string; nodes?: string[] } = { result };
  if (rest) out.reason = rest;
  if (nodes && nodes.length) out.nodes = nodes;
  return out;
}

/** A run is terminal (no further work) once completed/failed/stopped. running/paused/verifying are active. */
function isTerminalRunStatus(status: RunStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'stopped';
}

function resolveParams(spec: TaskSpec, provided?: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const p of spec.params ?? []) if (p.default !== undefined) out[p.name] = p.default;
  return { ...out, ...(provided ?? {}) };
}

export class TaskRunner {
  private readonly runs = new Map<string, ActiveRun>();
  /** Bounded cache of terminal snapshots: getRunState still answers after a run is evicted,
   *  without retaining the whole ActiveRun (spec, outputs, session maps) forever. */
  private readonly settledRuns = new Map<string, RunSnapshot>();
  private static readonly MAX_SETTLED_SNAPSHOTS = 50;

  constructor(private readonly deps: TaskRunnerDeps) {}

  private key(slug: string, runId: string): string {
    return `${slug}:${runId}`;
  }

  /** Load + validate a task's yaml and start a run. Throws if the task is missing or invalid. */
  run(slug: string, opts: RunOptions = {}): RunSnapshot {
    const loaded = loadTaskSpec(this.deps.workspaceRoot, slug);
    if (!loaded?.spec) throw new Error(`Task "${slug}" not found or has no valid task.yaml`);
    if (!loaded.valid) {
      throw new Error(`Refusing to run invalid task "${slug}": ${loaded.errors.map((e) => e.message).join('; ')}`);
    }
    // One active run per orchestrator: a second concurrent run would race the same parent session's
    // verdict listener (two runs attaching onSessionComplete on the same orchestrator would cross
    // their verifications). Block it. NOTE: this does not guard against a human typing into the
    // orchestrator mid-`verifying` — that race is a known, bounded v1 limitation.
    const orchestrator = opts.orchestratorSessionId;
    if (orchestrator) {
      for (const existing of this.runs.values()) {
        const snap = existing.snapshot();
        if (snap.orchestratorSessionId === orchestrator && !isTerminalRunStatus(snap.status)) {
          throw new Error(
            `Task "${slug}" already has an active run (${snap.runId}) on this orchestrator; stop it before starting another.`,
          );
        }
      }
    }
    const runId = opts.runId ?? (this.deps.genRunId ? this.deps.genRunId() : `run-${Date.now()}`);
    const run = new ActiveRun(
      loaded.spec,
      slug,
      runId,
      { ...opts, params: resolveParams(loaded.spec, opts.params), verifyOnComplete: opts.verifyOnComplete ?? true },
      this.deps,
    );
    this.runs.set(this.key(slug, runId), run);
    this.evictOnSettled(slug, runId, run);
    run.start();
    return run.snapshot();
  }

  /**
   * Drop terminal runs from the registry once settle consumers have their snapshot — the map
   * holds ActiveRuns, not history (terminal state lives in the run-log / GET_RESULTS path).
   */
  private evictOnSettled(slug: string, runId: string, run: ActiveRun): void {
    const key = this.key(slug, runId);
    void run.waitUntilSettled().then((snap) => {
      if (this.runs.get(key) === run) this.runs.delete(key);
      this.settledRuns.set(key, snap);
      if (this.settledRuns.size > TaskRunner.MAX_SETTLED_SNAPSHOTS) {
        const oldest = this.settledRuns.keys().next().value;
        if (oldest !== undefined) this.settledRuns.delete(oldest);
      }
    });
  }

  pause(slug: string, runId: string): void {
    this.runs.get(this.key(slug, runId))?.pause();
  }

  resume(slug: string, runId: string): void {
    const existing = this.runs.get(this.key(slug, runId));
    if (existing) {
      existing.resume();
      return;
    }
    // Terminal runs are evicted from the active registry and are not resumable.
    if (this.settledRuns.has(this.key(slug, runId))) return;
    // Not in memory (e.g. after an app restart): reconstruct from the persisted run-log.
    this.rehydrate(slug, runId);
  }

  /** Reconstruct an in-memory run from its persisted run-log + node outputs, then resume it. */
  private rehydrate(slug: string, runId: string): RunSnapshot {
    const loaded = loadTaskSpec(this.deps.workspaceRoot, slug);
    if (!loaded?.spec || !loaded.valid) {
      throw new Error(`Cannot resume "${slug}:${runId}": task.yaml is missing or invalid`);
    }
    const log = readRunLog(this.deps.workspaceRoot, slug, runId);
    if (log.length === 0) throw new Error(`Cannot resume "${slug}:${runId}": no run-log found`);
    const started = log.find((e) => e.kind === 'run-started');
    const startedEntry = started && started.kind === 'run-started' ? started : undefined;
    const orchestratorSessionId = startedEntry?.orchestratorSessionId;
    const run = new ActiveRun(
      loaded.spec,
      slug,
      runId,
      // Replay the original run's options (persisted on run-started) so a cross-restart resume
      // honors the caller's params and verifyOnComplete instead of resetting to defaults.
      {
        orchestratorSessionId,
        params: resolveParams(loaded.spec, startedEntry?.params),
        verifyOnComplete: startedEntry?.verifyOnComplete ?? true,
      },
      this.deps,
    );
    run.hydrate(log, (nodeId) => readNodeOutput(this.deps.workspaceRoot, slug, runId, nodeId));
    this.runs.set(this.key(slug, runId), run);
    this.evictOnSettled(slug, runId, run);
    run.resumeFromHydrated();
    return run.snapshot();
  }

  async stop(slug: string, runId: string): Promise<void> {
    await this.runs.get(this.key(slug, runId))?.stop();
  }

  getRunState(slug: string, runId: string): RunSnapshot | null {
    const key = this.key(slug, runId);
    return this.runs.get(key)?.snapshot() ?? this.settledRuns.get(key) ?? null;
  }

  /** Await a run reaching a terminal state (completed/failed/stopped). */
  waitUntilSettled(slug: string, runId: string): Promise<RunSnapshot> {
    const run = this.runs.get(this.key(slug, runId));
    if (!run) return Promise.reject(new Error(`No active run ${slug}:${runId}`));
    return run.waitUntilSettled();
  }
}
