# M17 — Composable Workflows

> **Capability status:** `not implemented`  
> **Execution gate:** Locked  
> **Spec maturity:** contract draft  
> **Wave:** W3A  
> **Owner:** Lead for workflow protocol; M17 Worker after W0.1/W2 gates  
> **Depends on:** M00, M03, M05, M08 job core, M12 capability core, M16 view host

## 1. Purpose

Let a human or Agent build, validate, run, inspect, repair, and reuse a typed workflow made from
registered capabilities. M17 provides orchestration and correlation; it does not create a new
action executor, permission model, task system, job queue, or artifact store.

The first closed loop is: text input -> real image-generation operation -> durable job -> image
ArtifactRef -> visible canvas result, with one approval pause and restart recovery.

## 2. Scope

### In Scope

- versioned DAG definitions with typed ports and bindings;
- discovery from the caller's effective M12 capability manifest;
- structural, semantic, permission, budget, and resource validation;
- manual human or Agent start;
- step scheduling, dependency release, approval pause, cancellation, retry, and reconciliation;
- run/step correlation over M03 invocations, M04 tasks when needed, and M08 jobs;
- Agent-authored drafts and versioned repairs;
- canvas projection and workbench inspector integration.

### Out of Scope

- arbitrary cycles, embedded scripts, cron/scheduled automation, distributed workflow services,
  a second TeamRun, or automatic plugin installation;
- provider SDK calls, file writes, native document edits, or permissions outside owning modules.

## 3. Single-Authority Boundary

| Concern | Authority | M17 role |
|---|---|---|
| action/schema/executor | M03 | validate reference and invoke |
| identity/approval/timeline | M00 | request and correlate |
| files and ArtifactRef | M05 | bind references only |
| Agent team tasks | M04 | request bounded task when operation requires it |
| asynchronous jobs | M08 | submit/observe/cancel through registered actions |
| cost/routing | M11 when available | consume estimate/actual result |
| capability availability | M12 | consume effective manifest |
| spatial view | M07 | project definition/run state |
| panels/layout | M16 | open editor/inspector/jobs/timeline |

WorkflowRun is a durable correlation record, not an alternate executor or generic task table.

## 4. Workflow Definition

M17 consumes the proposed `WorkflowDefinition`, `WorkflowNode`, `WorkflowBinding`, and
`WorkflowEdge` contracts. A definition pins capability and operation versions, declares finite
resource limits, and has a deterministic hash.

v1 rules:

- graph must be acyclic;
- every step maps to one composable registered operation; its canonical ActionDefinition is
  resolved from the pinned operation rather than copied into the workflow;
- all required inputs are bound before `ready`;
- fan-out is allowed; fan-in requires compatible cardinality;
- conditional behaviour uses explicit predicate/gate operations;
- retries are finite and allowed only by the operation policy;
- running definitions are immutable;
- secrets are referenced through a protected configuration authority, never embedded.

## 5. Validation Pipeline

```text
draft
-> structural schema validation
-> capability/version availability
-> port and ArtifactRef compatibility
-> graph acyclicity and output reachability
-> effective permission/pre-authorization analysis
-> finite budget/resource analysis
-> semantic validation
-> ready | invalid(with exact issues)
```

Validation does not execute actions or reserve long-lived leases. Unknown provider price is shown
as unknown and may require an explicit budget decision; it is never treated as zero.

## 6. Run State

```text
queued -> validating -> waiting_approval? -> running
running -> paused | succeeded | partially_failed | failed | cancel_requested
cancel_requested -> cancelled | reconciling
```

Each NodeRun independently records ready/blocked/waiting/running/final state, invocation or job
references, attempt count, ArtifactRefs, evidence, and error.

`partially_failed` means some immutable outputs exist but at least one required output failed. It
does not pretend the operation rolled back. The user can keep outputs, retry a safe step, or fork
a repaired definition version.

## 7. Execution Algorithm

1. Load the exact frozen definition version and verify its hash.
2. Create one WorkflowRun with initiator, policy snapshot, and finite budget.
3. Mark nodes with no unmet dependencies `ready`.
4. For each ready node, build the same canonical ActionInvocation used by UI and Agents.
5. Let M03 validate and M00 authorize; pause only the affected step when approval is required.
6. For synchronous work, persist the ActionOutcome correlation.
7. For asynchronous work, store the returned M08 `jobId` and observe its durable state.
8. Register output files/artifacts through M05 and release downstream nodes only after typed
   outputs are committed.
9. On failure, apply only the finite declared retry policy; otherwise stop affected downstream
   nodes and enter `failed` or `partially_failed`.
10. On restart, reconcile every non-final invocation/job before scheduling new work.

## 8. Agent Authoring

An Agent receives only operations in its effective manifest. It may create a draft, bind inputs,
validate, and show it to the user. Creating a graph does not grant permission to run it.

When a run fails, the Agent may propose:

- corrected configuration;
- an alternate available capability with compatible ports;
- a narrowed input or output;
- a resume from committed outputs.

Accepted repairs create a new WorkflowDefinition version. A run may reference already committed
outputs, but a previous step is never falsely marked undone.

## 9. Human and Canvas Editing

M07 renders one definition as step cards and typed edges in Workflow mode. Creating, deleting,
or connecting workflow steps invokes M17 actions; the executable graph is never inferred from
freeform canvas connectors. M07 stores the step positions only.

M16 provides:

- capability palette;
- selected-step inspector;
- run/approval/error inspector;
- jobs and timeline reveal;
- native output editor opening.

## 10. Candidate Actions — Not Frozen

| Candidate | Purpose | Policy intent |
|---|---|---|
| `workflow.create` | create an empty versioned definition | L1 snapshot undo |
| `workflow.node_add` / `workflow.node_remove` | edit one step | L1 snapshot undo |
| `workflow.edge_connect` / `workflow.edge_disconnect` | edit typed data flow | L1 snapshot undo |
| `workflow.validate` | return validation issues and estimates | L0 read/compute |
| `workflow.run_start` | start an immutable definition version | dynamic policy from contained steps and budget |
| `workflow.run_cancel` | request cancellation/reconciliation | L1 best effort |
| `workflow.run_resume` | resume only after reconciliation | dynamic policy |
| `workflow.version_fork` | fork definition or repair version | L1 snapshot undo |

`workflow.run_start` cannot be assigned one simplistic static risk tier. Preflight returns the
highest required approval and the set of steps that need per-operation evaluation.

## 11. Persistence and Recovery

- WorkflowDefinition is a versioned project document referenced through M05.
- WorkflowRun correlation is persisted through the canonical M00 execution/event store.
- M17 does not create a hidden `workflows.db` or independent queue.
- Definition writes use `baseRevision`, `idempotencyKey`, and explicit conflicts.
- Startup reconciliation queries M03 invocation outcomes and M08 jobs before issuing work.
- A missing capability version leaves the definition readable but invalid for new runs.

## 12. Error Handling

| Condition | Result | Recovery |
|---|---|---|
| incompatible ports | definition invalid; no run created | insert a registered converter or change binding |
| capability/version missing | affected node invalid | reinstall/upgrade or fork to available version |
| permission denied | step remains unexecuted | narrow scope or obtain allowed approval |
| approval expires | step returns to waiting/failed per policy | request again or cancel |
| provider state unknown | run enters reconciling | M08 polls/reconciles idempotently |
| stale definition edit | explicit revision conflict | reload and apply a new patch |
| budget exhausted | unscheduled steps pause | approve a finite increase or stop |
| output schema mismatch | step fails semantic validation | inspect evidence and repair capability/config |

## 13. First Usable Loop

1. Human creates text input and image-output cards in the spatial canvas.
2. Agent discovers the real image-generation capability and creates the two-step workflow.
3. Human inspects and changes one prompt field; definition validates and persists.
4. Start the run. An external upload/paid operation reaches a visible L2 approval pause.
5. Approval resumes the same run; M08 tracks the job.
6. Output is written through M05 and appears as a versioned image ArtifactRef on the canvas.
7. Timeline entries share run/node/invocation correlation without exposing secret prompt fields.
8. Restart during the job; the run reconciles without duplicate submission or billing.
9. Repeat the same operation directly from UI and from an Agent; both use the same action and
   executor as the workflow step.

Only this real loop may promote the slice to `usable`; mock-provider success is insufficient.

## 14. Verification Beyond the First Loop

- fan-out one image version to M18, M09, and M19 without duplicating source bytes;
- reject a cycle and an incompatible media-type edge;
- cancel a queued job and reconcile a running best-effort cancellation;
- remove a capability and reopen the definition in readable-invalid state;
- attempt an L3 step and prove it never runs without explicit confirmation;
- exhaust budget and prove downstream steps do not start.

## 15. Open Gates

- Promote workflow/caller/correlation contracts during W0.1.
- Define which TaskRun concepts M17 reuses from M04 without creating a second task authority.
- Freeze M08 ExternalJob states and idempotency.
- Freeze ArtifactRef and secret-reference handling.
- Produce a W3A packet only after M00/M03/M05/M08-core/M12-core/M16a are ready.

## 16. Non-Goals and Prohibitions

- No hidden Agent plan as the workflow truth.
- No workflow-specific permission grants.
- No arbitrary code node in v1.
- No unbounded retry, cost, fan-out, or concurrency.
- No timeline event replay as a substitute for a complete durable run contract.
