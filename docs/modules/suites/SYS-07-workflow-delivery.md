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

> Merged here from `docs/modules/workflows/README.md` on 2026-09-21. That directory held a
> 18-line compatibility record referenced by exactly one document
> (`14-MODULE-ARCHITECTURE.md`) and by neither `PACKET-INDEX.md` nor this suite, so working on this
> loop meant reading two files that never linked to each other. One loop, one document.

Design state: `breadth`; implementation status: `not implemented`; development order: R8. Workflows are versioned DAG
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

