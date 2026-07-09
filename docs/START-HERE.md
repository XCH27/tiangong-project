# Start Here

This document is the entry point for any agent or human beginning work in this repository.

---

## What Is This Project?

Fleet is a local-first AI work creation platform built on the Craft Agents base.
The core product concept is in `docs/PROJECT-DIRECTION.md`.

---

## Current Delivery Spine

Fleet is currently delivering the core backend and terminal interaction loop. The active delivery modules are:
- **[M00 (Platform Spine)](file:///Users/lullwen/Documents/天工/docs/modules/00-platform-spine.md)**
- **[M03 (Internal Action Registry)](file:///Users/lullwen/Documents/天工/docs/modules/03-internal-action-registry.md)**
- **[M02 (Terminal CLI Runtime)](file:///Users/lullwen/Documents/天工/docs/modules/02-terminal-cli-runtime/SPEC.md)**

---

## Do Not Start Yet (Locked Waves)

Work has not yet commenced on downstream waves. All modules in Wave 3 (Canvas, Browser, AIGC, Video), Wave 4 (Memory, Routing, Skills), and Wave 5 (Settings, Onboarding) are strictly locked. Parallel workers must not create branches or write stubs for locked modules.

---

## Document Reading Order

To orient yourself, read documents in this sequence:
1. **[PROJECT-DIRECTION.md](file:///Users/lullwen/Documents/天工/docs/PROJECT-DIRECTION.md)** — Core product vision, scopes, and target limits.
2. **[DECISIONS-LEDGER.md](file:///Users/lullwen/Documents/天工/docs/DECISIONS-LEDGER.md)** — Architectural decisions mapping.
3. **[WAVE-MODULE-MAP.md](file:///Users/lullwen/Documents/天工/docs/WAVE-MODULE-MAP.md)** — Status, gates, and stop criteria.
4. **Assigned Module Specification** (under `docs/modules/`).
5. **Assigned Agent Packet** (under `docs/agent-packets/`).

---

## Entry Paths

### If you are the Lead

1. Read `docs/PROJECT-DIRECTION.md` to confirm product direction.
2. Read `docs/DECISIONS-LEDGER.md` to see what has been decided.
3. Read `docs/WAVE-MODULE-MAP.md` to see current wave status.
4. Read `docs/BOARD-SYNC.md` to see what Workers have claimed and what is blocked.
5. Only then: update contracts, write or revise module specs, write agent packets, or merge PRs.

### If you are a Worker Agent

1. Read `AGENTS.md` top-to-bottom — it is the forced-read execution summary.
2. Follow the Read First list in `AGENTS.md` in order.
3. Read `docs/BOARD-SYNC.md` before claiming any slice — check for file and scope conflicts.
4. Read your assigned agent packet in `docs/agent-packets/`.
   - If the packet is incomplete or missing, **do not begin work**. Report to Lead.
5. Answer all Pre-Flight Gate questions in `docs/PARALLEL-AGENT-OPERATING-MODEL.md`.
6. Only then: begin implementation in your isolated branch.

---

## Current Wave Status

See `docs/WAVE-MODULE-MAP.md` for the live wave and module status table.

- **W0** ✅ Done (2026-07-09) — all three contract files frozen and verified.
- **W1** 🔓 Open — M00 and M03 skeletons may begin. See W1 Execution Order in `WAVE-MODULE-MAP.md`.
- **W2–W5** 🔒 Locked.

---

## Where Things Live

| Need | File |
|---|---|
| What Fleet is and is not | `docs/PROJECT-DIRECTION.md` |
| Industry tools selection matrix | `docs/ARCHITECTURAL-COMPARISON.md` |
| Final product decisions | `docs/DECISIONS-LEDGER.md` |
| Who owns what file | `docs/OWNERSHIP-MATRIX.md` |
| Wave and module status | `docs/WAVE-MODULE-MAP.md` |
| Live board cards | `docs/BOARD-SYNC.md` |
| Parallel work rules | `docs/PARALLEL-AGENT-OPERATING-MODEL.md` |
| Module behavior specs | `docs/modules/README.md` |
| Worker execution packets | `docs/agent-packets/*.md` |
| Frozen shared contracts | `docs/contracts/*.md` |
| Historical decisions | `docs/legacy/` (read-only reference) |
