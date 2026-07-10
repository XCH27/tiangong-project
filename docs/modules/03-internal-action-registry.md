# M03 — Internal Action Registry

> **Capability status:** `not implemented`
> **Execution gate:** Locked pending W0.1
> **Spec maturity:** contract draft
> **Wave:** W1 skeleton after re-freeze; executor after M00 backbone
> **Owner:** Lead for contracts; M03 Worker for registry/executor domain
> **Depends on:** M00 and W0.1 canonical action/event/identity/caller contracts

## 1. Purpose

Give human UI, Agent, and workflow runtime one structured path for every governed capability:
discover a permitted action, validate its input, authorize it, invoke one registered executor,
commit outcome/evidence, and return the same semantics to every caller.

M03's first closed loop is one reversible real file action invoked once by a human control and
once by an Agent tool with identical schema/executor/permission/timeline/undo behaviour.

## 2. Scope

### In Scope

- versioned action definitions and structured ownership;
- registry registration/list/get and caller-filtered manifest projection;
- structural and semantic input/output validation;
- idempotent invocation lifecycle;
- M00 permission/approval and M05 lease hooks;
- executor dispatch, cancellation correlation, undo registration, and evidence commit;
- common error taxonomy and recovery semantics;
- UI, Agent, and M17 workflow caller parity.

### Out of Scope

- defining module-native document semantics;
- a second permission/timeline store;
- plugin sandbox/distribution (M12);
- workflow scheduling (M17);
- renderer/direct IPC mutations that bypass the registry.

## 3. Canonical API Surface

Exact TypeScript location is selected on the v0.11 baseline, but the behaviour contract is:

```ts
interface ActionRegistry {
  register(definition: ActionDefinition, executor: ActionExecutor): RegistrationResult
  unregister(owner: ActionOwner, actionId: string): RegistrationResult
  get(actionId: string, version?: string): ActionDefinition | undefined
  list(query: ActionQuery, caller: ActorRef): EffectiveActionDefinition[]
  invoke(invocation: ActionInvocationVNext): Promise<ActionOutcome>
  requestCancel(invocationId: string, caller: ActorRef): Promise<ActionOutcome>
  invokeUndo(undoId: string, caller: ActorRef): Promise<ActionOutcome>
}

type ActionExecutor = (
  context: AuthorizedActionContext,
  input: unknown,
  signal: AbortSignal
) => Promise<ExecutorResult>
```

Registration rejects duplicate action/version ownership, incompatible schema, unsupported policy,
and an executor whose declared owner differs from the action owner. There is no silent override.

## 4. Action Definition

Every action definition includes:

- action ID/version and structured owner metadata;
- input/output schema references;
- allowed caller kinds (`human_ui`, `agent`, `workflow_runtime`, narrowly scoped `system`);
- composability flag and optional typed ports from M12;
- side-effect class and dynamic risk evaluator when required;
- independent approval, undo, cancellation, retry, evidence, and idempotency policies;
- target/resource precondition requirements;
- executor registration key.

Risk and undo are not encoded as one coupled enum. The current v1.2 labels remain a migration
baseline, but W0.1 must resolve contradictions such as L1 submission/export actions without a real
UndoHandle.

## 5. Invocation Pipeline

```text
received
-> contract/action version resolution
-> structural input validation
-> semantic input/target validation
-> idempotency lookup
-> M00 effective manifest and permission decision
-> wait for approval when required
-> acquire required M05 lease/resource admission
-> execute once
-> validate semantic output
-> commit native state and ActionOutcome correlation
-> commit SessionEvent/evidence
-> release lease/resource
-> completed response
```

Rules:

1. Approval wait occurs before a long-lived lease is acquired.
2. An existing idempotency key returns the existing outcome or reconciliation state.
3. No handler executes after validation/permission failure.
4. An executor cannot claim completion before its domain state is durable.
5. M03/M00 append canonical generic SessionEvent kinds with typed payloads; modules do not invent
   parallel event-name systems.
6. If native commit succeeded but evidence/outcome commit did not, invocation enters reconciling;
   retry must not repeat the native/external side effect.

## 6. Caller Parity

Human UI, Agent tools, and M17 workflow steps are projections of the same ActionDefinition. They
may differ only in caller/delegation/correlation context and effective permission.

- Agent tool schemas are generated from the effective M12 manifest.
- Workflow ports/bindings are generated from composable operations.
- UI controls use the same registry invocation rather than direct feature service calls.
- A `workflow_runtime` caller identifies the initiating human/Agent and policy snapshot; it has no
  independent authority.
- Transport hook names are adapters, not separate action identifiers.

## 7. Structural and Semantic Validation

Structural validation checks shape, required identity fields, enums, bounds, and schema version.
Semantic validation checks real meaning: ownership, target revision, resource existence,
cross-field rules, sensitivity, downstream references, and output truth.

Field hardness follows D33:

- identity/security boundaries are required and default restrictive;
- uncertain semantic judgments have an explicit uncertain/unknown representation;
- validation never forces a model to invent evidence or confidence.

Semantic output validation runs before completion. A structurally valid but wrong ArtifactRef,
permission scope, revision, or empty evidence claim fails or degrades visibly.

## 8. Idempotency, Revision, and Conflict

- Every side-effecting invocation has an idempotency key.
- Document actions provide `baseRevision`; outcomes provide `committedRevision`.
- SessionEvent sequence orders evidence only. It does not resolve document conflicts.
- Stale writes return `conflict` with safe latest-revision metadata and no mutation.
- Provider/job invocations reconcile using persisted provider correlation before retry.
- Batch/compound actions are atomic at the domain boundary or return a typed partial/reconciling
  state; they never report a false all-success.

## 9. Error Taxonomy

| Category | Meaning | Default retry |
|---|---|---|
| validation | input/output schema or semantic invalid | no; caller corrects input |
| permission | caller/action/target not authorized | no; approval/scope change |
| conflict | stale revision, active lease, duplicate owner | no automatic overwrite |
| transient | temporary local/network condition before side effect | idempotent policy only |
| provider | external service observation/failure | adapter policy and reconciliation |
| resource | finite CPU/GPU/disk/queue budget unavailable | defer/queue or narrower request |
| business | operation cannot satisfy domain rule | no unless configuration changes |

Errors include code, safe user message, retryable flag, correlation, and redacted details. Secret
or sensitive payloads never enter generic error/timeline text.

## 10. Undo and Cancellation

Undo and cancellation are separate:

- `inverse`: invoke a validated inverse action;
- `snapshot`: restore prior state if revision/preconditions still match;
- `cancel_pending`: cancel before commit only;
- `none`: no honest undo exists.

Cancellation may be unsupported, best effort, or guaranteed before commit. An output that arrives
after best-effort cancellation remains recorded with truthful cost/provenance. Undo never deletes
immutable source/generated artifacts unless a separately approved owner action does so.

## 11. Evidence and Event Rules

Use only frozen generic SessionEvent kinds. Typed payloads contain:

- invocation/action/version and caller/delegation context;
- workflow/job/document correlation when applicable;
- permission decision reference;
- revisions and outcome status;
- evidence ArtifactRefs/hashes;
- redacted summary and error code.

High-frequency gesture previews are not events. One committed action produces meaningful evidence.
Viewport, selection, and similar local view state normally produce no timeline event.

## 12. State and Persistence

- Registry definitions come from the canonical built-in/M12 manifest; dynamic caches are derived.
- Invocation/idempotency/outcome/undo/evidence correlation is durable through M00.
- No renderer-local action history is authoritative.
- `docs/PERSISTENCE-AUTHORITY-MAP.md` defines cross-module ownership.
- Startup reconciles non-final invocations with their domain owner before accepting a duplicate.

## 13. UI Placement

M03 has no standalone product page. Its projections are:

- permission/approval cards;
- action error/recovery messages;
- timeline/evidence entries;
- capability availability explanations;
- undo/cancel controls exposed by the owning surface.

## 14. Verification Procedure

1. Register one real reversible file action with explicit schemas/policy/owner.
2. Invoke through human UI and authorized Agent tool; verify identical executor and outcome shape.
3. Invoke the same operation from a one-step M17 workflow; verify caller/correlation changes only.
4. Submit malformed and semantically wrong input; verify no executor call.
5. Deny permission and require an approval; verify no lease/execution before decision.
6. Repeat an idempotency key; verify no duplicate file/provider effect.
7. Submit a stale document revision; verify explicit conflict.
8. Simulate commit/evidence interruption; restart and reconcile once.
9. Execute undo and cancellation examples and verify their distinct semantics.

## 15. Open Gates

- W0.1 ActionInvocation caller/version/idempotency/revision contract.
- Orthogonal action policy and existing action-table reclassification.
- Typed generic event payload catalog.
- Canonical registry/executor location on the clean v0.11 baseline.
- M00 persistence/transaction adapter.

## 16. Non-Goals and Prohibitions

- No direct UI/Agent/workflow service mutation outside M03.
- No string-only namespace as a security boundary.
- No custom module event kind beside the canonical event catalog.
- No L1 label where no honest undo/compensation contract exists.
- No status promotion from registry unit tests alone.
