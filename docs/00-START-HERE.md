# Start Here

> This is the single entry point for the Fleet project. Read this file first, in full.
> It is short on purpose. Everything an executing agent needs is reachable from here in one hop.

## What Fleet is

Fleet is a **local-first desktop workbench** where a human and AI agents work on the same project
through the same sessions, files, permissions, and timeline. It is built by **simplifying and
extending upstream Craft Agents v0.11** — not by building a new app beside it.

The product bet, stated once:

> The human owns intent and final judgment. Agents do the middle execution. Every action an agent
> takes is **inspectable, permissioned, and reversible**, and connected to real project artifacts.

Fleet is **not** a chat client, an IDE clone, a terminal skin, a Figma clone, or a pile of
disconnected AI utilities.

## The one rule that governs everything

**This is a product fork of Craft Agents v0.11. Reuse what Craft already
has. Never build a second one.**

Upstream Craft already ships the session store, the permission manager, the timeline event stream,
the tool registry, two agent backends, built-in tools, background shell execution, a terminal UI, MCP
integration, sources/skills/credentials, projects/tasks, automations, a scheduler, the settings store,
and the full BrowserPane. Fleet's job is to *route new capabilities through those*, not to reinvent
them. If you find yourself about to create a second session store, a second permission path, or a
second timeline, stop — you are doing it wrong.

**Before writing code for any capability, read [`08-CRAFT-CAPABILITY-MAP.md`](08-CRAFT-CAPABILITY-MAP.md)**
and find whether Craft already has it (`REUSE`), partly has it (`EXTEND`), or genuinely lacks it
(`NEW`). This step is mandatory — ignoring Craft's existing capability is the single mistake that has
hurt this project most. See also [`03-NON-NEGOTIABLES.md`](03-NON-NEGOTIABLES.md).

## How the work is organized (so features don't collide)

**Stable shared contracts → small vertical slices → one integration owner.** Shared contracts are
versioned only when a real caller needs them; they are not frozen speculatively. A large feature uses a
short-lived branch and a bounded set of existing monorepo paths, then merges promptly. It does not need
a parallel `modules/<feature>/` architecture. The main agent owns cross-package integration and resolves
overlap. Big in-flight work registers only its boundaries in
[`FEATURE-REGISTRY.md`](FEATURE-REGISTRY.md). Full rules:
[`04-MILESTONES.md`](04-MILESTONES.md) and [`07-AGENT-RULES.md`](07-AGENT-RULES.md).

## Current honest state (read this before you assume anything)

- **Code:** the runnable application is Craft v0.11.1-derived. The baseline was separated into
  auditable commits on 2026-07-11 (`616eff59e` upstream alignment — including the E9 thinking-level
  saturation fix that restored `typecheck:shared` to green; `7aff1c7da` speculative protocol-staging
  removal; then the document reset). **Remaining before the baseline counts as verified:** run
  `bun run validate:dev` and an Electron smoke check on the development machine — see the checklist in
  [`04-MILESTONES.md`](04-MILESTONES.md).
- **Fleet capability:** no Fleet-specific user-visible loop is currently implemented. Do not assume a
  Fleet module, invocation contract, ArtifactRef contract, or other "frozen contract" exists in code.
- **This document set:** a **fresh rewrite** (2026-07-11) that replaced ~100 legacy planning
  documents. The old corpus was deleted from the tree and is recoverable from pre-reset Git history
  (e.g. `git show 616eff59e:docs/<file>`); the pre-reset audit that motivated the reset is archived at
  [`design-library/PROJECT-REVIEW-2026-07-11.md`](design-library/PROJECT-REVIEW-2026-07-11.md).

The gap between "elaborate plan" and "zero implementation" was the reason for the reset. First make
the baseline auditable and verified; after that, **the next action is code, not more planning.**

## The document set (this is all of it)

Nine numbered plan documents (stable — the "how/what/why", meant to be read), plus two short helper
files (an owner-facing checkpoint list and a live feature-registry), plus a `design-library/` of
recovered detailed designs used as source material when a branch starts:

| # | File | Read when |
|---|---|---|
| 00 | `00-START-HERE.md` (this file) | Always, first |
| 01 | [`01-PRODUCT.md`](01-PRODUCT.md) | To understand what we are building and the layer model |
| 02 | [`02-DECISIONS.md`](02-DECISIONS.md) | To check whether a design question is already decided |
| 03 | [`03-NON-NEGOTIABLES.md`](03-NON-NEGOTIABLES.md) | Before any architectural or safety-relevant change |
| 04 | [`04-MILESTONES.md`](04-MILESTONES.md) | To know what to build next and in what order |
| 05 | [`05-MILESTONE-1-ACTION-SPINE.md`](05-MILESTONE-1-ACTION-SPINE.md) | The exact spec for the first code you write — Milestone 1: caller-aware action invocation (the action spine) |
| 06 | [`06-CODE-MAP.md`](06-CODE-MAP.md) | To locate the real Craft code you will extend |
| 07 | [`07-AGENT-RULES.md`](07-AGENT-RULES.md) | How to execute, validate, and report — the working contract |
| 08 | [`08-CRAFT-CAPABILITY-MAP.md`](08-CRAFT-CAPABILITY-MAP.md) | **Before building anything:** what Craft already provides, and REUSE/EXTEND/NEW per capability |
| — | [`OWNER-CHECKPOINTS.md`](OWNER-CHECKPOINTS.md) (owner-facing) | The moments an agent **must stop and ask the owner** (money, irreversible/public effects, production runtime commitments, new authorities/safety boundaries, product forks) |
| — | [`FEATURE-REGISTRY.md`](FEATURE-REGISTRY.md) (live state, not a plan) | Before starting a **big feature**: read it to avoid duplicating one already in progress, and register your own |
| — | [`design-library/`](design-library/README.md) (source material, not a plan) | Historical M00–M19 design material, the recovered verbatim owner-voice signals, and the archived pre-reset audit; use designs only to write a short current delta when justified, never copy wholesale |

There are no other required reads. There is no Wave system, no packet system, no readiness gate, no
maturity label, no status block. If an **active** document (the numbered set, the two helper files,
`README.md`, `AGENTS.md`) references those, it is stale — ignore it and tell the owner. The
`design-library/` files are the known exception: they are quarantined historical material and still
contain retired vocabulary (Waves, `W0.1`, `L0–L3`, "Lead") by design; read them only through the
corrections in [`design-library/README.md`](design-library/README.md), and do not report their stale
wording as a defect.

## How to start any task

1. Read this file and [`07-AGENT-RULES.md`](07-AGENT-RULES.md).
2. **Check Craft first (mandatory):** open [`08-CRAFT-CAPABILITY-MAP.md`](08-CRAFT-CAPABILITY-MAP.md),
   find the capability you're about to touch, read the Craft code/doc it points to, and decide
   REUSE / EXTEND / NEW. Do not reinvent what Craft already has.
3. Find the real code via [`06-CODE-MAP.md`](06-CODE-MAP.md), then confirm with `rg`.
4. Read **one** other document only if the task actually touches it (a decision, a non-negotiable,
   or the milestone-1 spec).
5. Make the smallest coherent change that delivers real, verifiable behavior. Verify it in the real
   Electron app. Report honestly.

That is the whole method.
