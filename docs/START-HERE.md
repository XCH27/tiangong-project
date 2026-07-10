# Start Here

This document is the entry point for any agent or human beginning work in this repository.

---

## What Is This Project?

Fleet is a local-first modular spatial work platform built on the Craft Agents base.
The core product concept is in `docs/PROJECT-DIRECTION.md`; the approved composition boundary is
in `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md`.

---

## Where to Start (Delivery Loops)

**Open [`docs/loops/README.md`](loops/README.md) first for delivery order.**

Work is organized as numbered **closed loops** (not a pile of modules):

| Start order | Loop | Meaning now |
|---|---|---|
| **1st** | [L00 Control plane](loops/L00-control-plane/) | **Only active work** — W0.1 migration + contracts |
| 2nd | [L01 Platform & actions](loops/L01-platform-action/) | Locked until L00 exits |
| 3rd | [L02 Local workbench](loops/L02-local-workbench/) | Terminal / files / jobs / panel host |
| 4th | [L03A Creative proof](loops/L03A-composable-creative/) | D45 text→image→ArtifactRef→canvas |
| 5th | [L03B Fan-out](loops/L03B-creative-fanout/) | Web / deck / media |
| 6th | [L04 Intelligence](loops/L04-intelligence/) | Memory / routing / plugins |
| 7th | [L05 Polish](loops/L05-polish/) | Settings / onboarding / messaging |

Numbering = **dependency order** (what must exist before the next loop is real).
Importance and difficulty are tagged inside each loop folder.
**Gates still come only from** [`WAVE-MODULE-MAP.md`](WAVE-MODULE-MAP.md).

---

## Current Delivery Spine

Inside the loop map, the first **product** capability spine is L01 then L02 (M00 → M03 → M02).
It is locked until L00 finishes.

---

## Do Not Start Yet (Locked Waves)

Work has not yet commenced on Worker implementation waves. W1 through W5, including W3A/W3B, are
Locked until the Lead closes W0.1. Parallel Workers must not create branches or write stubs for
Locked modules. Superseded packets live under `docs/legacy/agent-packets/` and authorize nothing.

---

## Document Reading Order

To orient yourself, read documents in this sequence:
1. **[loops/README.md](loops/README.md)** — numbered closed-loop map (where to start).
2. **Your current loop folder** under `docs/loops/Lxx-*/` (today: L00).
3. **[WAVE-MODULE-MAP.md](WAVE-MODULE-MAP.md)** — the only execution-gate/module map (current locks).
4. **[DOCUMENT-READINESS.md](DOCUMENT-READINESS.md)** — spec maturity and evidence gaps.
5. **[PROJECT-DIRECTION.md](PROJECT-DIRECTION.md)** — product thesis and delivery phases.
6. **[COMPOSABLE-WORKSPACE-ARCHITECTURE.md](COMPOSABLE-WORKSPACE-ARCHITECTURE.md)** — spatial,
   capability, workflow, view, and native-document boundaries.
7. **[FORBIDDEN-ANTIPATTERNS.md](FORBIDDEN-ANTIPATTERNS.md)** — hard non-goals checklist.
8. **[DECISIONS-LEDGER.md](DECISIONS-LEDGER.md)** — binding promoted decisions and amendments.
9. **Assigned Module Specification** under `docs/modules/` (linked from the loop card).
10. **Assigned Agent Packet** under `docs/agent-packets/`; if missing or superseded, stop.

---

## Entry Paths

### If you are the Lead

1. Read `docs/loops/README.md` — confirm the lowest unfinished loop (today: L00).
2. Read `docs/WAVE-MODULE-MAP.md` and `docs/DOCUMENT-READINESS.md` for current locks.
3. Read `docs/DOCUMENT-REGISTRY.md` for the full active-doc map and authority class of each file.
4. Read `docs/PROJECT-DIRECTION.md`, composable-workspace architecture, and Decision Ledger.
5. Read `docs/FORBIDDEN-ANTIPATTERNS.md` and `docs/UPSTREAM-BASELINE.md` before topology choices.
6. Read `docs/BOARD-SYNC.md` only for human/Lead status reporting; it does not override the map.
7. Only then: update contracts, write/revise module specs, issue packets, or merge work.
8. Do not issue Worker implementation packets until W0.1 exit checklist is complete and the
   exact slice is Ready + execution-ready.

### If you are a Worker Agent

1. Read `AGENTS.md` top-to-bottom — it is the forced-read execution summary (three status axes).
2. Follow the Read First list in `AGENTS.md` in order (includes WAVE-MAP + READINESS).
3. Confirm `implementation_authorized: no` while W0.1 is open and your slice is Locked.
4. Read your assigned agent packet in `docs/agent-packets/` only if Lead issued an active packet.
   - If the packet is incomplete, missing, or under `docs/legacy/`, **do not begin work**.
5. Answer all Pre-Flight Gate questions in `docs/PARALLEL-AGENT-OPERATING-MODEL.md` and have the
   Lead check current claims/ownership conflicts.
6. Only then: begin implementation in your isolated branch.

---

## Current Wave Status

See `docs/WAVE-MODULE-MAP.md` for the live wave and module status table.

- **W0** ✅ Recorded frozen baseline (2026-07-09).
- **W0.1** In Progress — clean-tag install + typecheck (shared/electron) green; GUI launch + `app/` replace still open.
  See `docs/migration/v0.11-BASELINE-VALIDATION.md` and `docs/contracts/w0.1-freeze-record.md`.
- **W1–W5**, including W3A/W3B: Locked (no W1 Ready declaration).

---

## Where Things Live

| Need | File |
|---|---|
| **Where to start (numbered loops)** | `docs/loops/README.md` |
| What Fleet is and is not | `docs/PROJECT-DIRECTION.md` |
| Modular spatial/workflow architecture | `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md` |
| Hard non-goals / second-system bans | `docs/FORBIDDEN-ANTIPATTERNS.md` |
| Verified upstream base and migration gate | `docs/UPSTREAM-BASELINE.md` |
| Persistence/state authority | `docs/PERSISTENCE-AUTHORITY-MAP.md` |
| Documentation maturity | `docs/DOCUMENT-READINESS.md` |
| Final product decisions | `docs/DECISIONS-LEDGER.md` |
| Who owns what file | `docs/OWNERSHIP-MATRIX.md` |
| Wave and module status | `docs/WAVE-MODULE-MAP.md` |
| Live board cards | `docs/BOARD-SYNC.md` |
| Parallel work rules | `docs/PARALLEL-AGENT-OPERATING-MODEL.md` |
| Module behavior specs | `docs/modules/README.md` |
| Active worker packets only | `docs/agent-packets/` (currently W0.1 Lead-only) |
| Superseded packets | `docs/legacy/agent-packets/` |
| Frozen shared contracts | `docs/contracts/*.md` |
| W0.1 composable contract proposal (not frozen) | `docs/contracts/composable-workspace-contracts.md` |
| Historical research and archived drafts | `docs/legacy/` (read-only; never execution authority) |
