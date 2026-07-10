# L00 — Control Plane & Clean Baseline

| Field | Value |
|---|---|
| **Loop ID** | L00 |
| **Wave** | W0.1 (Lead-only) |
| **Importance** | Critical — blocks every other loop |
| **Difficulty** | Hard (unrelated git histories, contract re-freeze, persistence) |
| **Gate** | `In Progress` (W0.1 Lead work) |
| **blocked_by** | `BLK-001` |
| **Worker gate** | `Locked` (no Worker implementation) |
| **Start when** | Always first; no prior loop |
| **Exit when** | WAVE-MODULE-MAP W0.1 exit checklist complete; Lead declares W1 Ready eligible |

## Closed loop (what “done” means)

```text
clean Craft v0.11.0 baseline recorded
  → retain/adapt/drop/defer ledger for Fleet + fleet-old behaviour
  → one canonical contract text/implementation version
  → persistence logical authorities recorded (physical adapter decided or explicitly deferred with ADR gate)
  → ownership paths + packets + wave map agree
  → namespace decision recorded
  → Lead may open L01 (W1)
```

This is a **documentation + migration** loop, not a user-facing product feature.

## Progress (2026-07-09)

| Exit product | Path | Status |
|---|---|---|
| Migration ledger | [`docs/migration/v0.11-MIGRATION-LEDGER.md`](../../migration/v0.11-MIGRATION-LEDGER.md) | **Partial** |
| Baseline validation | [`docs/migration/v0.11-BASELINE-VALIDATION.md`](../../migration/v0.11-BASELINE-VALIDATION.md) | **Partial** (install + typecheck shared/electron **Done**) |
| Port checklist | [`docs/migration/v0.11-PORT-CHECKLIST.md`](../../migration/v0.11-PORT-CHECKLIST.md) | Ready for base replace |
| Contract freeze record | [`docs/contracts/w0.1-freeze-record.md`](../../contracts/w0.1-freeze-record.md) | **Partial** (text) |
| M11A freeze | [`docs/contracts/m11a-usage-cost-core.md`](../../contracts/m11a-usage-cost-core.md) | **Text frozen** |
| Persistence ADR | [`docs/adr/0034-physical-persistence-w1-w2.md`](../../adr/0034-physical-persistence-w1-w2.md) | **Accepted** |
| Namespace ADR | [`docs/adr/0035-product-internal-namespace.md`](../../adr/0035-product-internal-namespace.md) | **Accepted** |
| Clean `app/` replace + GUI launch | ledger §5 | **Open** → W1 stays Locked |

## Why this is #00

Without L00, every path assignment, contract SHA, and “usable” claim is on an unverified base. Difficulty is high on purpose; skipping it creates second systems later.

## Direct module in this loop

| Module | Spec | Role | Gate |
|---|---|---|---|
| M01 Lead slice | [`modules/01-clean-craft-baseline.md`](../../modules/01-clean-craft-baseline.md) | Clean v0.11 baseline + migration ledger | `In Progress` |
| M01 Worker coding | same | Port features into verified base | `Locked` until M01 Lead exit |

## Contract slices frozen by L00 (not Worker-implemented here)

These modules are **not** “L00 implementation work,” but W0.1 must freeze or version-gate their
shared contracts before L01/L02 packets exist. Track exit evidence against WAVE-MODULE-MAP §3.

| Contract slice | Spec / proposal | Exit evidence required |
|---|---|---|
| M00 identity/session/permission/timeline | [`00-platform-spine.md`](../../modules/00-platform-spine.md) | AgentSeat + SessionEvent + permission vocabulary parity |
| M03 action/invocation | [`03-internal-action-registry.md`](../../modules/03-internal-action-registry.md) | ActionInvocation caller/idempotency/revision + policy fields |
| M05 ArtifactRef / files | [`05-files-library-leases.md`](../../modules/05-files-library-leases.md) | ArtifactRef schema or version-gate before first consumer |
| M08 ExternalJob core types | [`08-aigc-jobs-surface.md`](../../modules/08-aigc-jobs-surface.md) | ExternalJob status/idempotency fields or version-gate |
| **M11A** usage/cost vocabulary | [`11-model-routing-cost-ledger.md`](../../modules/11-model-routing-cost-ledger.md) §2 | UsageObservation / CostRecord / budget preflight frozen |
| M12 capability manifest core | [`12-capability-skill-plugin-system.md`](../../modules/12-capability-skill-plugin-system.md) | Manifest/operation descriptor core or version-gate |
| M16 view contribution | [`16-workbench-panel-platform.md`](../../modules/16-workbench-panel-platform.md) | View/layout contribution contract or version-gate |
| M17 workflow definition/run | [`17-composable-workflows.md`](../../modules/17-composable-workflows.md) | Workflow/run correlation types or version-gate |

## Cross-cutting docs (must use)

| Doc | Why |
|---|---|
| [`UPSTREAM-BASELINE.md`](../../UPSTREAM-BASELINE.md) | Canonical upstream tag + migration route |
| [`PERSISTENCE-AUTHORITY-MAP.md`](../../PERSISTENCE-AUTHORITY-MAP.md) | Logical state owners; physical store gate |
| [`WAVE-MODULE-MAP.md`](../../WAVE-MODULE-MAP.md) §3 | W0.1 exit checklist |
| [`DOCUMENT-READINESS.md`](../../DOCUMENT-READINESS.md) | Maturity still contract-draft everywhere |
| [`OWNERSHIP-MATRIX.md`](../../OWNERSHIP-MATRIX.md) | Provisional paths → verified mapping |
| [`FORBIDDEN-ANTIPATTERNS.md`](../../FORBIDDEN-ANTIPATTERNS.md) | No daemon-as-prerequisite, no second stores |
| [`contracts/*`](../../contracts/) | Historical v1.2 + W0.1 proposals |
| [`contracts/composable-workspace-contracts.md`](../../contracts/composable-workspace-contracts.md) | Proposal only until promoted |

## Active packet

- [`agent-packets/wave-0.1-control-plane-reconciliation.md`](../../agent-packets/wave-0.1-control-plane-reconciliation.md) — **Lead only**

## Reading order inside L00

1. This README
2. `UPSTREAM-BASELINE.md`
3. W0.1 packet
4. `PERSISTENCE-AUTHORITY-MAP.md`
5. `WAVE-MODULE-MAP.md` §3 checklist
6. `OWNERSHIP-MATRIX.md` (note unassigned + provisional)
7. Contract proposals under `docs/contracts/`
8. `docs/migration/ENGINEERING-STANDARDS.md` + conflict/dead-code/reaction docs
9. `docs/migration/BACKEND-VALUE-PORT.md` (D50 — no old UI)
10. M01 module file

## Do not

- Issue Worker implementation packets for L01–L05
- Assume SQLite / long-lived daemon is already decided
- Treat historical v1.2 contract SHAs as implementable authorization
- Start terminal/canvas/creative code “to save time”
- Port old Fleet / fleet-old **UI design** (D50) — backend-value only (`docs/migration/BACKEND-VALUE-PORT.md`)

## Next loop

→ [L01-platform-action](../L01-platform-action/) only after L00 exit.
