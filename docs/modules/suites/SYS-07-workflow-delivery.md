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
