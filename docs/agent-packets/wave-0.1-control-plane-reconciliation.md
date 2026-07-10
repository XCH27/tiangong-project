# W0.1 Control-Plane Reconciliation

> **Delivery loop:** [L00 — Control plane](../loops/L00-control-plane/)
> **Wave:** W0.1 — Lead only.
> **Execution gate:** `In Progress` (Lead); Worker `Locked`
> **blocked_by:** `BLK-001`
> **Capability status:** `not implemented` until the Lead records canonical protocol implementation parity.
> **Purpose:** Make the documentation and frozen implementation contract one coherent baseline before W1 worker implementation.

## Required Outcomes

1. Complete the clean Craft Agents v0.11.0 migration branch and retain/adapt/drop/defer ledger.
2. Resolve the W1/W2 process topology and physical persistence authority according to D22/D38
   and `PERSISTENCE-AUTHORITY-MAP.md`.
3. Reconcile canonical `AgentSeat`, deterministic identity tags, permission derivation, and skill fields.
4. Decide and freeze ActionInvocation caller/version/idempotency/correlation/revision, typed generic
   event payloads, and orthogonal risk/approval/undo/cancel/retry/evidence policy.
5. Promote or reject the proposed ArtifactRef, capability, ExternalJob, workflow, spatial, and view
   contracts needed by the first consumer waves.
6. Freeze **M11A** minimum `UsageObservation` / `CostRecord` / budget-preflight vocabulary (or
   explicitly version-gate it) so W2 job-core and W3A paid/unknown jobs share one cost path.
7. Decide the product/internal namespace before freezing plugin/storage API identifiers.
8. Align canonical implementation with the approved contract text; record version/evidence in the
   Wave Map.
9. Generate replacement packets with one Worker per worktree and no Lead-owned protocol writes.

## Allowed Files

- `docs/contracts/*.md`
- `docs/DECISIONS-LEDGER.md`
- `docs/WAVE-MODULE-MAP.md`
- `docs/OWNERSHIP-MATRIX.md`
- `docs/PARALLEL-AGENT-OPERATING-MODEL.md`
- `docs/BOARD-SYNC.md`
- `docs/modules/*.md`
- `docs/modules/*/*.md`
- `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md`
- `docs/PERSISTENCE-AUTHORITY-MAP.md`
- `docs/DOCUMENT-READINESS.md`
- `docs/UPSTREAM-BASELINE.md`
- `docs/FORBIDDEN-ANTIPATTERNS.md`
- `docs/loops/**`
- `docs/DOCUMENT-REGISTRY.md`
- `docs/verification/**`
- `docs/migration/**`
- `docs/adr/0034-physical-persistence-w1-w2.md`
- `docs/adr/0035-product-internal-namespace.md`
- `docs/contracts/w0.1-freeze-record.md`
- `docs/contracts/m11a-usage-cost-core.md`
- `docs/PROJECT-DIRECTION.md`
- `docs/START-HERE.md`
- `docs/README.md`
- `docs/ARCHIVE-LOG.md`
- `docs/agent-packets/*` (active only; do not resurrect superseded packets without Lead rewrite)
- `AGENTS.md`
- canonical protocol implementation files, Lead-owned only

## Forbidden Work

- No Worker implementation, feature UI, terminal runtime, surface binding, or downstream packet assignment.
- No unversioned contract edit.

## Exit Criteria

- The clean v0.11 baseline, migration ledger, and retained extension points are recorded.
- One current contract version is marked frozen in documentation and canonical implementation.
- Every W1/W2 consumed state class has one recorded authority and persistence/recovery path.
- No active packet grants a Worker access to frozen protocol files.
- Wave Map, Board, Ownership Matrix, module index, readiness register, and packets agree on module
  placement and status axes.
- The Lead records whether W1 is open; absent this declaration, W1 remains Locked.

## Handoff

Record changed documents, v0.11 migration evidence, canonical implementation parity, unresolved
decisions, new contract version, and the explicit W1 gate decision.
