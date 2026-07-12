# AGENTS.md

This file is a pointer. The real execution contract for agents is
**[docs/07-AGENT-RULES.md](docs/07-AGENT-RULES.md)**, and orientation starts at
**[docs/00-START-HERE.md](docs/00-START-HERE.md)**.

## Start here

1. Read [`docs/00-START-HERE.md`](docs/00-START-HERE.md) — what Fleet is, the current honest state,
   and the nine numbered documents (00–08).
2. Read [`docs/07-AGENT-RULES.md`](docs/07-AGENT-RULES.md) — authority order, the working method, risk
   calibration, validation ladder, capability-reporting vocabulary, multi-agent rules, and Git/delivery
   rules.
3. Find real code via [`docs/06-CODE-MAP.md`](docs/06-CODE-MAP.md), then confirm with `rg`.
4. Read one more document only if the task actually touches it (a decision in
   [`docs/02-DECISIONS.md`](docs/02-DECISIONS.md), a boundary in
   [`docs/03-NON-NEGOTIABLES.md`](docs/03-NON-NEGOTIABLES.md), or the current milestone spec).

## The three rules that matter most

- **This is a product fork of Craft v0.11 — check Craft first.** Before writing code for any capability, read
  [`docs/08-CRAFT-CAPABILITY-MAP.md`](docs/08-CRAFT-CAPABILITY-MAP.md) and classify your work as
  REUSE / EXTEND / NEW. Most of what you need already exists in Craft. Rebuilding it is the mistake that
  has hurt this project most.
- **Reuse the existing Craft authority; never build a second session/permission/timeline/job/store.**
  See `docs/03-NON-NEGOTIABLES.md`.
- **Do not grow documentation faster than implementation.** This project was reset on 2026-07-11
  because the plan outran the code. The next action is almost always code. There is no Wave, packet,
  readiness gate, or mandatory status block — if you see one referenced anywhere, it is stale.
