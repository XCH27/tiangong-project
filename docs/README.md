# Fleet Documentation

Start with [START-HERE.md](START-HERE.md), then the numbered delivery map:

**[loops/README.md](loops/README.md)** — closed loops L00→L05 (where to start).

Full inventory of active documents and authority classes:
**[DOCUMENT-REGISTRY.md](DOCUMENT-REGISTRY.md)**.

Verification of the control-plane cleanup (what improved, what is still open):
**[verification/CONTROL-PLANE-VERIFICATION.md](verification/CONTROL-PLANE-VERIFICATION.md)**.

No module implementation is currently authorized; only **L00 / W0.1** Lead work is active while
the clean Craft Agents v0.11 baseline and canonical contracts are reconciled.

## Delivery Loops (numbered)

| Loop | Folder | Now |
|---|---|---|
| L00 | [loops/L00-control-plane/](loops/L00-control-plane/) | **Active (Lead-only)** |
| L01 | [loops/L01-platform-action/](loops/L01-platform-action/) | Locked |
| L02 | [loops/L02-local-workbench/](loops/L02-local-workbench/) | Locked |
| L03A | [loops/L03A-composable-creative/](loops/L03A-composable-creative/) | Locked |
| L03B | [loops/L03B-creative-fanout/](loops/L03B-creative-fanout/) | Locked |
| L04 | [loops/L04-intelligence/](loops/L04-intelligence/) | Locked |
| L05 | [loops/L05-polish/](loops/L05-polish/) | Locked |

## Binding Orientation

- [PROJECT-DIRECTION.md](PROJECT-DIRECTION.md) — product thesis and phases.
- [COMPOSABLE-WORKSPACE-ARCHITECTURE.md](COMPOSABLE-WORKSPACE-ARCHITECTURE.md) — approved modular
  spatial/workflow/native-editor boundary.
- [FORBIDDEN-ANTIPATTERNS.md](FORBIDDEN-ANTIPATTERNS.md) — hard non-goals and second-system bans.
- [DECISIONS-LEDGER.md](DECISIONS-LEDGER.md) — promoted decisions.
- [WAVE-MODULE-MAP.md](WAVE-MODULE-MAP.md) — only execution-gate/module placement source.
- [DOCUMENT-READINESS.md](DOCUMENT-READINESS.md) — spec maturity and blockers.
- [PERSISTENCE-AUTHORITY-MAP.md](PERSISTENCE-AUTHORITY-MAP.md) — one state authority per class.
- [UPSTREAM-BASELINE.md](UPSTREAM-BASELINE.md) — required v0.11 migration gate.

## Execution Material

- `modules/` — product-loop specifications.
- `contracts/` — recorded frozen contracts and clearly labelled W0.1 proposals.
- `agent-packets/` — **active** packets only (currently Lead-only W0.1).
- `OWNERSHIP-MATRIX.md` — file/domain ownership.
- `PARALLEL-AGENT-OPERATING-MODEL.md` — coordination rules.

## Evidence and History

- `model-reviews/` at repository root contains independent model reviews. Do not delete or edit
  another model's folder while consolidating conclusions.
- `legacy/` is historical evidence and **cannot** override active decisions/specs/gates.
- Superseded worker packets: `legacy/agent-packets/`.
- Archived research comparison: `legacy/ARCHITECTURAL-COMPARISON.md` (nonbinding; never open a wave from it).
- Archived topology drafts: `legacy/PROJECT-DIRECTION-HISTORICAL-TOPOLOGY.md`.
