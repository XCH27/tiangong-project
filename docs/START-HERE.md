# Start Here

This document is the entry point for any agent or human beginning work in this repository.

---

## What Is This Project?

Fleet is a local-first modular spatial work platform built on the Craft Agents base.
The core product concept is in `docs/PROJECT-DIRECTION.md`; the approved composition boundary is
in `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md`.

---

## Current Delivery Spine

Fleet's first delivery spine is the core backend and terminal interaction loop. It is currently
locked while W0.1 migrates to the clean v0.11 baseline and reconciles the complete contract. The
first modules remain:
- **[M00 (Platform Spine)](modules/00-platform-spine.md)**
- **[M03 (Internal Action Registry)](modules/03-internal-action-registry.md)**
- **[M02 (Terminal CLI Runtime)](modules/02-terminal-cli-runtime/SPEC.md)**

---

## Do Not Start Yet (Locked Waves)

Work has not yet commenced on downstream waves. W1 through W5, including W3A/W3B, are Locked until
the Lead closes W0.1. Parallel Workers must not create branches or write stubs for Locked modules.

---

## Document Reading Order

To orient yourself, read documents in this sequence:
1. **[PROJECT-DIRECTION.md](PROJECT-DIRECTION.md)** — product thesis and delivery phases.
2. **[COMPOSABLE-WORKSPACE-ARCHITECTURE.md](COMPOSABLE-WORKSPACE-ARCHITECTURE.md)** — spatial,
   capability, workflow, view, and native-document boundaries.
3. **[DECISIONS-LEDGER.md](DECISIONS-LEDGER.md)** — binding promoted decisions and amendments.
4. **[WAVE-MODULE-MAP.md](WAVE-MODULE-MAP.md)** — the only execution-gate/module map.
5. **[DOCUMENT-READINESS.md](DOCUMENT-READINESS.md)** — spec maturity and evidence gaps.
6. **Assigned Module Specification** under `docs/modules/`.
7. **Assigned Agent Packet** under `docs/agent-packets/`; if missing or superseded, stop.

---

## Entry Paths

### If you are the Lead

1. Read `docs/PROJECT-DIRECTION.md` to confirm product direction.
2. Read the composable-workspace architecture and Decision Ledger.
3. Read the Wave Map and Documentation Readiness register.
4. Read `docs/BOARD-SYNC.md` only for human/Lead status reporting; it does not override the map.
5. Only then: update contracts, write/revise module specs, issue packets, or merge work.

### If you are a Worker Agent

1. Read `AGENTS.md` top-to-bottom — it is the forced-read execution summary.
2. Follow the Read First list in `AGENTS.md` in order.
3. Read your assigned agent packet in `docs/agent-packets/`.
   - If the packet is incomplete or missing, **do not begin work**. Report to Lead.
4. Answer all Pre-Flight Gate questions in `docs/PARALLEL-AGENT-OPERATING-MODEL.md` and have the
   Lead check current claims/ownership conflicts.
5. Only then: begin implementation in your isolated branch.

---

## Current Wave Status

See `docs/WAVE-MODULE-MAP.md` for the live wave and module status table.

- **W0** ✅ Recorded frozen baseline (2026-07-09).
- **W0.1** In Progress — Lead-only v0.11 migration and contract/document parity re-freeze.
- **W1–W5**, including W3A/W3B: Locked.

---

## Where Things Live

| Need | File |
|---|---|
| What Fleet is and is not | `docs/PROJECT-DIRECTION.md` |
| Modular spatial/workflow architecture | `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md` |
| Verified upstream base and migration gate | `docs/UPSTREAM-BASELINE.md` |
| Persistence/state authority | `docs/PERSISTENCE-AUTHORITY-MAP.md` |
| Documentation maturity | `docs/DOCUMENT-READINESS.md` |
| Final product decisions | `docs/DECISIONS-LEDGER.md` |
| Who owns what file | `docs/OWNERSHIP-MATRIX.md` |
| Wave and module status | `docs/WAVE-MODULE-MAP.md` |
| Live board cards | `docs/BOARD-SYNC.md` |
| Parallel work rules | `docs/PARALLEL-AGENT-OPERATING-MODEL.md` |
| Module behavior specs | `docs/modules/README.md` |
| Worker execution packets | `docs/agent-packets/*.md` |
| Frozen shared contracts | `docs/contracts/*.md` |
| W0.1 composable contract proposal (not frozen) | `docs/contracts/composable-workspace-contracts.md` |
| Historical decisions | `docs/legacy/` (read-only reference) |
