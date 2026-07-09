# AGENTS.md

This file is the forced-read execution summary for agents working in this repository.
It is not an independent roadmap and must not define a second source of truth.

Active project documentation is English-only.

## Read First (Context-Budget Oriented)

Read these files first in this exact order to understand the entry orientation and current state:
1. `docs/START-HERE.md` — Orientation & sequence entry points.
2. `docs/DECISIONS-LEDGER.md` — Active binding decisions & logic restrictions.
3. **Your Assigned spec** in `docs/modules/` — Behavior specification for your task.
4. **Your Assigned wave packet** in `docs/agent-packets/` — Bounded work limits.

## Non-Negotiable Rules

-   **Build on Fleet Base**: Build on the clean Fleet desktop base in `app/`; keep the shell and simplify it.
-   **Complete Loops**: Every deliverable must cover user interface, core backend, state persistence, timelines, and permissions.
-   **No Second Systems**: Do not create a second session store, permission model, or memory database.
-   **Status Transparency**: Status must be reported strictly as `usable`, `wired`, `display-only`, or `Locked`.
-   **Grades & Audit**: CLI terminal, git operations, and local writes must route through the L0-L3 permission validator and log timeline evidence.

For detailed parallel branch rules, see `docs/PARALLEL-AGENT-OPERATING-MODEL.md`.
