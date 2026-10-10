# W0.1 Control-Plane Reconciliation

> **Wave:** W0.1 — Lead only.  
> **Status:** `not implemented`. The Exit 3 note records partial parity and does not complete it. The Exit 4 note version-gates the six proposed product contracts and does not freeze them. The Exit 5 note records the logical persistence map (D54) and leaves the physical-store gate open.  
> **2026-10-10:** D51 records the v0.11.0 pin and D52 records the behaviour ledger. Both exit items stay open. A Mac source tree at the pin is recorded in `docs/audits/2026-10-10-w01-exit1-mac-checkout.md`. After #51, non-frozen `bun install` finished and `typecheck:all` failed (exit 2). After #52, Electron launch and relaunch are recorded in `docs/audits/2026-10-10-w01-exit1-electron-launch.md`. After #53, RPC project create, session turn, and `browser-pane:create` are recorded in `docs/audits/2026-10-10-w01-exit1-rpc-loop.md`. After #54, `docs/audits/2026-10-10-w01-exit1-routes-migration.md` records `route=board` and `route=settings` restores and an open branch `fleet/migration-from-v0.11.0`. Those restores are not an AX click and not a menu click. Adapt ports are not started. Fleet `app/` stays `0.10.5`. `typecheck:all` remains the #52 failure. Exit item 1 stays open. Exit item 3 is recorded in `docs/audits/2026-10-10-w01-exit3-canonical-parity.md` and stays open: action ids and the v1.3.0 policy table are frozen, and AgentSeat, caller provenance, idempotency, revisions, typed events, and HostTurnKernel admission are partial. Exit item 4 is version-gated by D53 and stays open. Exit item 5 is the logical persistence stance in `docs/audits/2026-10-10-w01-exit5-persistence-authority.md` (D54) and stays open: the Craft file store is retained, SQLite is not decided, and the physical-store gate stays open. `CONTRACT_VERSION` stays `1.3.0`. This packet stays Lead-only and grants no Worker write to frozen protocol files. W1 stays Locked. See `docs/audits/2026-10-10-w01-v011-baseline-blk001.md`.  
> **Purpose:** Make the documentation and frozen implementation contract one coherent baseline before W1 worker implementation.

## Required Outcomes

1. Complete the clean Craft Agents v0.11.0 migration branch and retain/adapt/drop/defer ledger.
2. W1/W2 process topology stays D22/D38. Logical persistence authority is recorded by D54.
   The physical-store gate stays open until Mac-verified recovery. See
   `PERSISTENCE-AUTHORITY-MAP.md` and `docs/audits/2026-10-10-w01-exit5-persistence-authority.md`.
3. Reconcile canonical `AgentSeat`, deterministic identity tags, permission derivation, and skill fields.
4. Decide and freeze ActionInvocation caller/version/idempotency/correlation/revision, typed generic
   event payloads, and orthogonal risk/approval/undo/cancel/retry/evidence policy.
5. ArtifactRef, capability, ExternalJob, workflow, spatial, and view contracts are version-gated
   by D53 and stay proposed. Exit item 4 stays open. This packet does not promote them.
   `CONTRACT_VERSION` stays `1.3.0`. Named consumers may not implement the drafts until a later freeze.
6. Product/internal namespace strings are recorded in D50. This packet still does not authorize implementation.
7. Align canonical implementation with the approved contract text; record version/evidence in the
   Wave Map.
8. Generate replacement packets with one Worker per worktree and no Lead-owned protocol writes.

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
