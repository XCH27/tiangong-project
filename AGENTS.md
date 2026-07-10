# AGENTS.md

This file is the forced-read execution summary for agents working in this repository.
It is not an independent roadmap and must not define a second source of truth.

Active project documentation is English-primary. Bilingual comments and technical explanations are fully allowed to clarify technical selections, preventing deadlocks.

## Read First (Context-Budget Oriented)

Read these files first in this exact order:

1. `docs/START-HERE.md` — orientation and current lock state.
2. `docs/loops/README.md` — **numbered closed-loop map** (always enter the lowest unfinished loop).
3. `docs/loops/Lxx-*/README.md` for that loop (today: `L00-control-plane`).
4. `docs/DOCUMENT-REGISTRY.md` — which doc is binding vs execution vs historical (optional if context tight; required for Lead doc work).
5. `docs/WAVE-MODULE-MAP.md` — **only** execution-gate / module placement source.
6. `docs/DOCUMENT-READINESS.md` — spec maturity for your module row (independent of gate).
7. `docs/DECISIONS-LEDGER.md` — binding promoted decisions.
8. **Your assigned module spec** under `docs/modules/` (linked from the loop card).
9. **Your assigned agent packet** under `docs/agent-packets/`.
   - If the packet is missing, incomplete, or marked superseded: **stop**. Report to Lead.
10. `docs/OWNERSHIP-MATRIX.md` — confirm every path you will touch is explicitly assigned.
11. `docs/FORBIDDEN-ANTIPATTERNS.md` — hard non-goals and second-system bans.

Do not start implementation from memory of older packets, `docs/legacy/`, or research drafts.
Do not skip to a higher loop number while a lower loop is not exited.

## Current Global Gate (2026-07-09)

- **Active loop:** **L00** (`docs/loops/L00-control-plane/`) only.
- **W0.1** is In Progress (Lead-only migration / contract reconciliation).
- **W1–W5** (including W3A/W3B) are **Locked** → loops L01–L05 are not startable for Workers.
- **No active module is `execution-ready`.** Implementation packets must not be issued or followed for Worker feature work until Lead closes W0.1 and marks the exact slice Ready + execution-ready.

## Three Independent Status Axes

Never collapse these into one label. Report all three when stating module status.

| Axis | Allowed values | Authority |
|---|---|---|
| **capability status** | `not implemented`, `display-only`, `wired but not visually checked`, `usable` | Lead after real-behaviour evidence |
| **execution gate** | `Locked`, `Ready`, `In Progress`, `Blocked` | `docs/WAVE-MODULE-MAP.md` only |
| **spec maturity** | `concept`, `contract draft`, `execution-ready` | `docs/DOCUMENT-READINESS.md` only |

Rules:

- `Locked` is an **execution gate**, not a capability result.
- `execution-ready` is **spec maturity**, not permission to code by itself.
- Implementation is authorized only when **all** are true:
  1. execution gate for the exact slice is `Ready` (or Lead-declared `In Progress` for that assigned packet);
  2. spec maturity for the exact slice is `execution-ready`;
  3. an **active** (non-superseded) agent packet lists exact allowed files.

## Required Status Block (every handoff / PR / blocker report)

```text
module_or_slice: Mxx / <slice name>
capability_status: not implemented | display-only | wired but not visually checked | usable
execution_gate: Locked | Ready | In Progress | Blocked
spec_maturity: concept | contract draft | execution-ready
gate_authority: docs/WAVE-MODULE-MAP.md
readiness_authority: docs/DOCUMENT-READINESS.md
allowed_files: <exact paths from active packet> | none
implementation_authorized: yes | no
```

`implementation_authorized: yes` requires Ready (or assigned In Progress) **and** execution-ready **and** an active packet. Otherwise always `no`.

## Non-Negotiable Rules

- **Build on Fleet Base**: Prefer the clean Craft Agents v0.11 baseline migration path in `docs/UPSTREAM-BASELINE.md`. Keep and simplify the Craft shell; do not invent a second workbench.
- **Complete Loops**: Every deliverable must cover UI, core backend, state persistence where needed, timeline evidence, and permissions.
- **No Second Systems**: Do not create a second session store, permission model, memory database, job ledger, artifact store, or UI shell. See `docs/FORBIDDEN-ANTIPATTERNS.md`.
- **Status Transparency**: Use the three-axis model above only; do not invent labels such as `almost usable` or report `Locked` as capability status.
- **Grades & Audit**: CLI terminal, git operations, and local writes must route through the L0–L3 permission path and leave timeline evidence.
- **Contracts**: Workers never edit Lead-owned protocol or frozen contract files. Historical recorded v1.2 contract SHAs are evidence, not authorization to implement.

## Parallel Work

For roles, Pre-Flight Gate, worktrees, Completion Report, and Fleet Bridge boundaries, see `docs/PARALLEL-AGENT-OPERATING-MODEL.md`.
