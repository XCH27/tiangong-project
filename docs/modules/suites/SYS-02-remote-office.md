# SYS-02 — Remote engineering office

**Rows:** EXEC-05, EXEC-07, EXEC-09, EXEC-12, EXEC-13, INFO-01, INFO-08. **Owner:** remote target,
runtime, Git/worktree and delivery adapters. **Depends on:** SYS-01 identity, policy, action and
run contracts. **Authority:** ExternalTargetRef, Grant and adapter health.
**Development order:** R14, then R16/R18 conditional closure.
**Craft base:** existing Workspace-routed server transport, Session/Task lifecycle, permission path,
filesystem tools and process execution; this suite adds scoped external-target/worktree adapters,
not a remote control plane.

## Closed loop

Project → repository/branch → user-owned local or cloud computer → isolated worktree/runtime → Agent
run → diff/tests → review/PR → DeliveryReceipt → disconnect/revoke.

## First proof

Connect one target, create one isolated worktree, run one bounded task, collect diff/test evidence,
review without implicit merge, then revoke the grant. Cover stale branch, dirty tree, failed push,
offline target, expired grant and reconnect recovery.

## Acceptance and references

Use `EXEC-07-A`, `EXEC-09-A`, `EXEC-13-A`, `INFO-01-A`, `INFO-08-A`. OpenHands is the standing
executor reference and Codex the protocol comparison; Craft remains the worktree/process starting
point. Historical lease evidence may be reopened temporarily only for a named uncovered failure.
A successful connection alone is not `usable`.

## Stop conditions

Stop on shared worktree mutation, unscoped credentials, hidden remote persistence, implicit merge,
or a second task/run store.
