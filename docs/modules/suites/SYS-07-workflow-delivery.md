# SYS-07 — Workflow and delivery composition

**Rows:** ORCH-01, ORCH-02, ORCH-05, ORCH-06, ORCH-07, CREATE-12, EXEC-10, EXEC-13. **Owner:** typed
workflow definitions and projections. **Depends on:** real SYS-01 actions and SYS-02/SYS-06 adapters.
**Authority:** definition versions only; TaskRunner, SessionEvents, JobRef and DeliveryReceipt remain
execution authorities.
**Development order:** R8 definition/run; R14 delivery adapter consumption.

## Closed loop

Completed action chain → typed finite DAG → validation → TaskRunner execution → outputs/events →
delivery receipt. Scheduling always routes through SYS-01 policy.

## First proof

Record one completed chain, express it as a finite versioned DAG, reject cycles and unsupported
capabilities, run twice, cancel once, and emit one delivery receipt.

## Acceptance and references

Use `WF-001..004`, `JOB-001..004`, `ORCH-01-A`, `ORCH-02-A`, `ORCH-05-A`, `ORCH-06-A`, `ORCH-07-A`,
`CREATE-12-A`, `EXEC-10-A` and `EXEC-13-A`. Craft TaskRunner is authority and FlowGram is the
standing editor/runtime-separation reference. Delivery consumes the proven SYS-02/SYS-06 adapters;
it does not add editor, Agent-kernel or media-render references here.

## Stop conditions

Stop on an independent executor, hidden side effect, stale definition execution, duplicate job,
missing fidelity metadata or delivery without permission/evidence.

---

## Module boundary — Composable workflows module


First-slice readiness: see PACKET-INDEX and the execution contracts below. implementation status: `not implemented`; development order: R8. Workflows are versioned DAG
definitions that invoke governed actions; they do not become a second execution or permission store.
Acceptance: `WF-001` saves a typed version; `WF-002` invokes existing actions; `WF-003` projects
TaskRunner status; `WF-004` rejects stale definitions without a second run authority.

FlowGram is the standing editor reference for document, command, plugin, variable and runtime
separation. Fleet may absorb editor mechanisms only: its typed definition invokes existing governed
actions and Craft TaskRunner remains execution authority.

#### Reality and activation sequence

`app/packages/server-core/src/tasks/TaskRunner.ts` is the Craft task runner, not a Fleet workflow
definition/run store; `app/scripts/test-workflow-local.sh` is a helper only. Activation is: define
typed DAG/version fixtures, validate cycles and stale versions, invoke one existing governed action,
project the run into TaskRunner, and test restart/failure. Until then no workflow editor or run view
may be labelled wired.

## Definition and recovery details

Definitions pin operation versions and exact inputs, validate type/cardinality, acyclicity and
output reachability, and declare finite fan-out/retries/resources. Validation neither executes an
operation nor grants permission; secrets are opaque references. R8's first chain uses already
available actions, so it cannot require R11 image generation as an entry gate.

Run through TaskRunner and the owning action/job paths. Release dependent steps only after real
outputs commit; after restart reconcile non-final effects before scheduling. Partial success retains
its immutable outputs and marks blocked descendants. Repair creates a new definition version and
may explicitly reuse committed inputs/results; it never rewrites history or silently repeats an
unknown charge. Missing pinned capability versions leave a readable but non-runnable definition.

## Execution contracts

These sections own the next step for the listed capability IDs. Read the
[common execution contract](../../14-MODULE-ARCHITECTURE.md#executable-next-step-contract)
and the release/spec anchor in [PACKET-INDEX](../PACKET-INDEX.md). Gates do not open merely
because this packet has instructions. Planned regression targets below do not exist yet unless
implementation has added them; extend a matching existing behavioral test instead of duplicating it.

### Execution ORCH-01

**Workflow definition editor**

- **Next:** `IMPLEMENT` — R8 after completed R3 chain and R4/R5.
- **Sources:** [`packages/server-core/src/tasks/TaskRunner.ts`](../../../app/packages/server-core/src/tasks/TaskRunner.ts); [`packages/session-tools-core/src/tool-defs.ts`](../../../app/packages/session-tools-core/src/tool-defs.ts); [`packages/shared/src/resources/resource-bundle.ts`](../../../app/packages/shared/src/resources/resource-bundle.ts).
- **Deliver:** Promote one completed real action chain into a finite versioned typed DAG; add minimal editor controls only for those native operations.
- **Data:** Definition owns node/edge IDs, typed input/output bindings, pinned capability revisions, constants/secret references and bounded fan-out/retry. Execution remains TaskRunner.
- **Failure:** Cycle, missing pinned capability, type/cardinality mismatch or stale definition rejects before side effects. Save a new version for repair; preserve old definitions.
- **Proof:** ORCH-01-A — Valid chain plus cycle, invalid binding, missing version and stale-edit fixtures; round-trip definition, invoke actual action and show exact output provenance. Planned regression/probe target relative to `app/`: `packages/server-core/src/tasks/__tests__/fleet-orch-01.test.ts`. After adding the target, run from `app/`: `bun test packages/server-core/src/tasks/__tests__/fleet-orch-01.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** FlowGram document/command/history separation; do not import its workflow executor or dependency container. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution ORCH-02

**Workflow execution and run history**

- **Next:** `IMPLEMENT` — R8 with ORCH-01 and existing TaskRunner.
- **Sources:** [`packages/server-core/src/tasks/TaskRunner.ts`](../../../app/packages/server-core/src/tasks/TaskRunner.ts); [`packages/shared/src/tasks/storage.ts`](../../../app/packages/shared/src/tasks/storage.ts); [`packages/shared/src/protocol/dto.ts`](../../../app/packages/shared/src/protocol/dto.ts).
- **Deliver:** Execute a validated frozen workflow definition on existing TaskRunner and project status/history into its surface.
- **Data:** Run identity references definition version and native Task/node operation IDs; only committed outputs release descendants. Existing Session/Task evidence owns attempts.
- **Failure:** Partial success preserves outputs and blocks descendants; restart reconciles non-final effects. Retry explicit failed/reconciled nodes, never blindly replay unknown effects.
- **Proof:** ORCH-02-A — Run chain twice, cancel one, crash after output commit and repair a definition; history identifies exact inputs/attempts and no duplicate executor or Job. Planned regression/probe target relative to `app/`: `packages/server-core/src/tasks/__tests__/fleet-orch-02.test.ts`. After adding the target, run from `app/`: `bun test packages/server-core/src/tasks/__tests__/fleet-orch-02.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft TaskRunner first; FlowGram is editor evidence only. Shared Job and delivery adapters retain their own contracts. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).
