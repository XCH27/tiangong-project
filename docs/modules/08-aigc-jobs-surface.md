# M08 — External Jobs and Generative Operations

> **Capability status:** `not implemented`
> **Execution gate:** Locked
> **Spec maturity:** contract draft
> **Wave:** W2 job-core contract; W3 providers and generative operations
> **Owner:** Lead for ExternalJob protocol; M08 Worker after packet approval
> **Depends on:** M00, M03, M05; M11 enriches routing/cost later

## 1. Purpose

Provide one durable asynchronous job facility for image/audio/video generation, render/export,
batch review, and other long-running work. Human UI, Agents, and M17 workflows submit the same
registered operation; M08 owns queue/provider reconciliation while M16/M07 only display it.

The first closed loop is a real text-to-image job whose output is written through M05, returned
as an ArtifactRef, shown on the canvas, and safely reconciled after restart.

## 2. Scope

### In Scope

- durable ExternalJob state, idempotent submission, provider request correlation, queueing,
  progress, cancellation, retry policy, restart reconciliation, and output registration;
- local and external providers behind explicit adapters;
- generative capability operations for image generation/editing first;
- job projections for workbench, workflow, timeline, and canvas;
- cost/usage source classification as confirmed, estimated, or unknown.

### Out of Scope

- a separate generation center, workflow scheduler, media editor, provider-account system, or
  cost ledger;
- treating a provider timeout as proof of failure;
- silently resubmitting unknown/paid requests;
- writing completed outputs outside M05.

## 3. ExternalJob Contract

The canonical contract must include:

```ts
type ExternalJobStatus =
  | 'queued'
  | 'submitting'
  | 'submitted'
  | 'running'
  | 'cancel_requested'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'unknown'
  | 'reconciling'

type ExternalJob = {
  jobId: string
  operationRef: { capabilityId: string; operationId: string; version: string }
  providerId: string
  providerJobId?: string
  status: ExternalJobStatus
  idempotencyKey: string
  attempt: number
  priority: number
  inputRefs: ArtifactRef[]
  protectedInputRef?: string
  outputRefs: ArtifactRef[]
  progress?: { completed: number; total?: number; message?: string }
  permissionDecisionRef: string
  workflowRunId?: string
  nodeRunId?: string
  invocationId: string
  cost: { amount?: number; currency?: string; source: 'confirmed' | 'estimated' | 'unknown' }
  reconcileAfter?: string
  error?: ActionOutcome['error']
  createdAt: string
  updatedAt: string
}
```

This proposal must be promoted into canonical protocol state before implementation. There is no
authoritative `jobs.json` beside the M00 execution store.

## 4. Lifecycle and Reconciliation

```text
queued -> submitting -> submitted -> running -> completed
                           |           |       -> failed
                           |           `------> cancel_requested -> cancelled | unknown
                           `------------------> unknown -> reconciling -> running | completed |
                                                              failed | cancelled | unknown
```

Rules:

- submission uses one idempotency key derived before the provider call;
- provider request ID is persisted as soon as it exists;
- process loss after provider submission enters `unknown/reconciling`, not `failed`;
- a paid/unknown request is never automatically submitted again without reconciliation;
- retry creates an explicit attempt under the same logical job only when adapter policy proves it
  safe;
- cancellation before submit is guaranteed; after submit it is best effort and may still incur
  cost/output;
- a late output after cancellation is retained and labelled, not silently deleted.

## 5. Queue and Resource Policy

- Queue admission is per operation/provider concurrency class, not one global magic number.
- Local GPU/CPU classes coordinate with M09/M19 render jobs so the machine is not saturated.
- Provider rate limits produce visible deferred state and next-retry time.
- Priority is bounded and cannot starve older work indefinitely.
- M08 exposes queue pressure to M17 preflight and M07/M16 status projections.
- Exact concurrency defaults require provider and hardware evidence before freeze.

## 6. Provider Adapter

```ts
interface ExternalJobProviderAdapter {
  providerId: string
  supportedOperations(): Array<{ capabilityId: string; operationId: string; version: string }>
  submit(request: ProtectedJobRequest): Promise<{ providerJobId: string }>
  inspect(providerJobId: string): Promise<ProviderJobObservation>
  cancel(providerJobId: string): Promise<ProviderCancelObservation>
  fetchOutputs(providerJobId: string): Promise<ProviderOutput[]>
}
```

Adapters return observations; they do not write files, decide permission, or append timeline
events. M08 translates observations into canonical state and registers outputs through M05.

## 7. Generative Capability Operations

First built-in operations:

| Operation | Inputs | Outputs | Execution |
|---|---|---|---|
| image generate | prompt/config plus optional references | image ArtifactRef(s) | external/local job |
| image edit | image ArtifactRef, mask/crop, prompt/config | new image ArtifactRef(s) | external/local job |
| caption/alt text | ArtifactRef | text ArtifactRef/value | inline or job |

Audio/video generation may follow the same contract only after provider-specific duration,
timeout, cost, cancellation, and output limits are documented. Rendering owned by M09/M18/M19
may use M08 job infrastructure without becoming an AIGC operation.

## 8. Permission, Cost, and Sensitive Inputs

- Local deterministic generation may be L1 if its file output is snapshot/cancellable and its
  resource budget is finite.
- Uploading workspace content, paid provider use, or unknown cost is at least L2 unless a scoped
  pre-authorization exists.
- Destructive overwrite or publishing follows its owning L3/high-risk action.
- The full prompt/input is stored only in a protected artifact/config reference when it may
  contain sensitive data. Timeline records operation, hashes/redacted summary, provider class,
  decision, cost source, and evidence—not secrets or raw credentials.
- API keys are resolved from the canonical secrets/settings authority and never persisted in
  jobs, workflows, canvas cards, or events.

Risk tier and undo are independent. Submitting a job is not honestly “reversible” merely because
a cancel action exists; the action policy records cancellation separately.

## 9. Artifact Output Commit

On provider completion:

1. fetch output to a temporary controlled path;
2. validate declared media type, size, checksum, and provider metadata;
3. write/move through M05's atomic file and lease path;
4. create a new immutable ArtifactRef version with provenance and parent inputs;
5. commit job output references and evidence correlation;
6. notify M17/M07/M16 projections.

M08 never changes a canvas node from one hard-coded type to another. The canvas card binds to the
new ArtifactRef or job result entity through an explicit spatial action.

## 10. UI Contributions

- M16 job panel: queue, provider, operation, state, progress, cost source, output, retry/cancel;
- M07 job/result card: lightweight status and static preview;
- M17 inspector: node/job correlation and downstream readiness;
- timeline reveal: approval, submission, reconciliation, output, and failure evidence.

Closing any projection does not cancel the job.

## 11. Candidate Actions and Existing Correction

| Candidate/existing | Purpose | Contract status |
|---|---|---|
| `aigc.job_submit` | submit a generative operation | frozen v1.2 row is internally inconsistent; reclassify at W0.1 |
| `job.cancel` | request cancellation for any cancellable ExternalJob | proposed generic owner action |
| `job.retry` | explicit safe retry after reconciliation | proposed; policy controlled |
| `job.inspect` | filtered job state/output read | proposed L0 |

Job actions should be generic where behaviour is generic. Capability operations remain specific
and return a job reference when asynchronous.

## 12. Error Handling

| Condition | Result | Recovery |
|---|---|---|
| provider unavailable/rate limited | queued/deferred with next observation | wait or choose approved provider |
| network loss after submit | unknown -> reconciling | inspect provider by persisted ID |
| output validation fails | failed; raw quarantine reference protected | inspect/retry provider fetch |
| output file commit fails | job remains reconciling; no completed claim | repair storage and commit once |
| cancel unsupported/late | cancel_requested then observed final state | keep/ignore output; cost remains honest |
| duplicate submission key | return existing job correlation | observe existing job |
| budget/permission denied | no provider call | adjust finite budget or approval |

## 13. First Usable Verification

1. Submit the same real image operation from UI, Agent, and M17; verify one operation/action path.
2. Exercise external/provider approval and a finite budget.
3. Observe queued, submitted, running, and completed states in the M16 panel and M07 card.
4. Verify the image file and ArtifactRef provenance through M05.
5. Kill the app after provider submission; restart and reconcile without a duplicate provider
   request or charge.
6. Cancel before submission and during running; verify guaranteed versus best-effort semantics.
7. Trigger provider failure and output validation failure; verify visible recovery.
8. Inspect timeline/protected records and confirm secrets/full sensitive prompts are absent.

Mock adapters may support targeted tests but cannot establish `usable`.

## 14. Native Batch Mode

Native provider batch is a later execution mode, not a Promise-all loop and not a second queue.
It must define item-level idempotency, result retention, partial failure, polling cadence, cost
source, and provider-specific limits. Interactive chat, permission interception, PTY I/O, and
real-time workflow gates are never batch work.

## 15. Open Gates

- Freeze ExternalJob, job action, protected-input, and ArtifactRef contracts.
- Verify one real provider/local engine and its current terms/cost/cancellation behaviour.
- Decide canonical settings/secrets keys without reading them into documents.
- Record local CPU/GPU concurrency policy shared with M09/M19.
- Split M08 core from provider slices in the future packet.

## 16. Non-Goals and Prohibitions

- No separate AIGC center or per-module job queue.
- No generic 120-second failure timer.
- No silent retry of paid/unknown work.
- No raw credentials or sensitive prompts in timeline payloads.
- No completed status before file and ArtifactRef commit.
