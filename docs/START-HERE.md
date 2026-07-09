# Start Here

This document is the entry point for any agent or human beginning work in this repository.

---

## What Is This Project?

Fleet is a local-first AI work creation platform. It is not a chat app, terminal wrapper, or IDE.
The core product concept is in `docs/PROJECT-DIRECTION.md`.

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
| Final product decisions | `docs/DECISIONS-LEDGER.md` |
| Who owns what file | `docs/OWNERSHIP-MATRIX.md` |
| Wave and module status | `docs/WAVE-MODULE-MAP.md` |
| Live board cards | `docs/BOARD-SYNC.md` |
| Parallel work rules | `docs/PARALLEL-AGENT-OPERATING-MODEL.md` |
| Module behavior specs | `docs/modules/*.md` |
| Worker execution packets | `docs/agent-packets/*.md` |
| Frozen shared contracts | `docs/contracts/*.md` |
| Historical decisions | `docs/legacy/` (read-only reference) |
