# Fleet — AI Work Workbench

A **local-first desktop workbench** where a human and AI agents work on the same projects through
the same sessions, files, permissions, and timeline. Built from Craft Agents (Apache-2.0) with
**v0.10.5 as the product/interaction baseline**, the current `app/` tree as implementation
reality, and v0.11.2 as a selective donor of fixes and backend mechanisms — simplified and
extended, never rebuilt beside it.

> The human owns intent and final judgment. Agents do the middle execution. Every consequential
> agent action is inspectable, permissioned, and honest about recovery, and connects to real project artifacts.

## Where to start

| Who you are | Start at |
|---|---|
| Executing agent | [`AGENTS.md`](AGENTS.md) — the mandatory start card |
| The owner | [`docs/OWNER-GUIDE.md`](docs/OWNER-GUIDE.md) — plain-language checkpoints and acceptance |
| Anyone needing orientation | [`docs/00-START-HERE.md`](docs/00-START-HERE.md) — doc index and current state |
| "What is Fleet ultimately?" | [`docs/01-WHITEPAPER.md`](docs/01-WHITEPAPER.md) — the whitepaper, with the finished-product walkthrough |
| "How is work orchestrated?" | [`docs/13-ORCHESTRATION.md`](docs/13-ORCHESTRATION.md) — the orchestration core (kernel, composition, canvas) |
| "What are the major independent systems?" | [`docs/16-SYSTEM-SUITES.md`](docs/16-SYSTEM-SUITES.md) — suite boundaries, shared contracts and reference sets |
| "What is the exact development order?" | [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md) — the complete R0–R18 dependency order, with one ACTIVE row |
| "Where do I start implementation?" | [`docs/WORK-ORDER.md`](docs/WORK-ORDER.md) — executable suite tasks and handoff format |

## Repository layout

| Path | What it is |
|---|---|
| `app/` | The runnable application (Bun monorepo, Electron). Craft v0.11.1-derived. |
| `docs/` | The complete Fleet authority document set (numbered docs + specs + helpers). |
| `docs/specs/` | Concrete, executable specifications for each release. |
| `源码参考/` | Read-only open-source reference checkouts and the official Craft docs mirror. Not product code. |
| `docs/references/` | Evidence ledger, admission audits, and the preserved legacy candidate map grouped by system suite. |
| `UI参考/` | Optional untracked UI kits and visual material. Not product authority. |

## Current state (honest)

The committed application is a Craft v0.11.1-derived implementation tree pinned to the
**v0.10.5 product/interaction baseline**. Release state has exactly one edit point: the **R0 row
in [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md)** — landing complete 2026-07-26 (test/typecheck/
i18n/doc gates green); remaining, owner-owned: the `fleet-baseline-r0` tag and the owner
walkthrough (R0-C7). Landed since on the same branch (2026-07-26): the R1 Project-is-the-boundary
shell (`2d08364f7`, with follow-up fix/revert churn under the owner walkthrough), R2 independence
slices C2–C5 (updater, sharing, docs links, OAuth/Slack relays — all
`wired but not visually checked`; see [`docs/specs/R2-independence.md`](docs/specs/R2-independence.md)),
and the R7 canvas preview page (`display-only`, G6 frontend track). Fleet's differentiating loops (governed action seam,
artifact handoff, delegation, canvas, experience) are **not implemented**; the roadmap orders their
*integration* behind user-visible value. Every product domain remains registered and described at
breadth in [`docs/11-PRODUCT-MATRIX.md`](docs/11-PRODUCT-MATRIX.md) and
[`docs/12-PAGE-ARCHITECTURE.md`](docs/12-PAGE-ARCHITECTURE.md), but breadth is not a claim that a
module is implementation-ready. Exact per-capability status:
[`docs/08-CRAFT-CAPABILITY-MAP.md`](docs/08-CRAFT-CAPABILITY-MAP.md) ·
[`docs/05-ROADMAP.md`](docs/05-ROADMAP.md).

There are no near/mid/far-term buckets. Every capability maps to R0–R18 through
[`docs/modules/PACKET-INDEX.md`](docs/modules/PACKET-INDEX.md); conditional rows must end in a
small proven Craft extension or `NO_GAP` evidence. External source is consumed only at that row via
[`源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](源码参考/meta/CAPABILITY-REFERENCE-MAP.md), never as a
replacement roadmap or product kernel.
