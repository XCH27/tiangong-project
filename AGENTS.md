# AGENTS.md

This file is the forced-read execution summary for agents working in this repository.
It is not an independent roadmap and must not define a second source of truth.

Active project documentation is English-primary. Bilingual comments and technical explanations are fully allowed to clarify technical selections, preventing deadlocks.

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
-   **Status Transparency**: Report capability status as `not implemented`, `display-only`, `wired but not visually checked`, or `usable`. `Locked` is an execution gate (`Locked`, `Ready`, `In Progress`, `Blocked` on `docs/WAVE-MODULE-MAP.md`), not a capability result. Do not start work while the assigned gate is Locked. Only the Lead promotes `usable`.
-   **Grades & Audit**: CLI terminal, git operations, and local writes must route through the L0-L3 permission validator and log timeline evidence.
-   **Pi boundary**: Pi Agent Core only sequences a default model turn after Fleet host admission. Do not describe or implement that path as a complete Pi execution host. The local candidate `.fleet/zcode` is gitignored; tracked host notes live in `patches/zcode/`, and `app/` changes are listed in `docs/UPSTREAM-DELTA.tsv`. Do not delete `app/`.

For detailed parallel branch rules, see `docs/PARALLEL-AGENT-OPERATING-MODEL.md`.
