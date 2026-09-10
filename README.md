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
| Anyone needing orientation | [`docs/PRODUCT.md`](docs/PRODUCT.md) — doc index and current state |
| "What is Fleet ultimately?" | [`docs/PRODUCT.md`](docs/PRODUCT.md) — the whitepaper, with the finished-product walkthrough |
| "How is work orchestrated?" | [`docs/13-ORCHESTRATION.md`](docs/13-ORCHESTRATION.md) — the orchestration core (kernel, composition, canvas) |
| "What are the major independent systems?" | `docs/modules/REGISTRY.md` — suite boundaries, shared contracts and reference sets |
| "What is the exact development order?" | [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md) — the complete R0–R18 dependency order, with one ACTIVE row |
| "Where do I start implementation?" | [`docs/WORK-ORDER.md`](docs/WORK-ORDER.md) — executable suite tasks and handoff format |

## Repository layout

| Path | What it is |
|---|---|
| `app/` | The runnable application (Bun monorepo, Electron). Craft v0.11.1-derived. |
| `docs/` | The complete Fleet authority document set (numbered docs + specs + helpers). |
| `docs/specs/` | Concrete, executable specifications for each release. |
| `源码参考/` | Read-only open-source reference checkouts and the official Craft docs mirror. Stored in `/Volumes/AIGC/天工参考/源码参考/` (linked locally via `源码参考/`). Not product code. |
| `docs/references/` | Evidence ledger, admission audits, and the preserved legacy candidate map grouped by system suite. |
| `UI参考/` | UI kits and reverse-engineered visual material (Doubao, Trae Work, UI designs, screenshots). Stored in `/Volumes/AIGC/天工参考/UI参考/` (linked locally via `UI参考/`). Not product authority. |

## Current state (honest)

The committed application is a Craft v0.11.1-derived implementation tree pinned to the
**v0.10.5 product/interaction baseline**. Release state has exactly one edit point: the **R0 row
in [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md)**.

**As of 2026-09-09 the working tree is landed.** R0 had recurred twice: the 2026-07-26
"landing complete, tree clean, gates green" claim was retracted (the gate was checking 3 of 703 test
files while `typecheck:all` could not pass at all; repaired 2026-07-30), and a second unaudited tree
then accumulated on top and sat for six weeks. It has now been inventoried fresh — 395 paths, 17
groups, no `G-unknown` — and committed as 18 revertable commits, with
`backup/pre-r0-audit-2026-09-09` snapshotting the dirty tree beforehand. Nothing was dropped.

Two defects were in the gate rather than the code, and both are fixed: the test suite read the
developer's `~/.craft-agent/config-defaults.json`, so nine tests failed on CI and on every fresh
checkout, and `bun install --frozen-lockfile` failed on a drifted `@types/bun` — which fails CI
before any check runs. `git status --porcelain` is empty, `scripts/fleet-verify.sh` is green
(doc contracts + `validate:dev`: typecheck across 13 workspaces and scripts, 5,526 tests, UI
contract, doc-tool smokes), the three `validate:ci` i18n checks pass, and the headless server boots
with no fatal errors.

**What is left for R0: the owner walkthrough (R0-C7), then the `fleet-baseline-r0` tag.** Every
Wave 1/2 packet branches from that tag, so it is the one thing gating parallel work.

**A note for anyone mounting this repository:** `源码参考/` and `UI参考/` link into
`/Volumes/AIGC/天工参考/` and neither is tracked any more. Until 2026-09-09 the mirror also produced
73 permanent phantom deletions, blamed in every document on an unmounted volume; the real cause was
that the path became a symlink while its file entries stayed in the git index, and git does not
traverse a symlink. Run the preflight in [`AGENTS.md`](AGENTS.md) before any reference or UI work.

Landed earlier on the same branch (2026-07-26): the R1 Project-is-the-boundary
shell (`2d08364f7`, with follow-up fix/revert churn under the owner walkthrough), R2 independence
slices C2–C5 (updater, sharing, docs links, OAuth/Slack relays — all
`wired but not visually checked`; see [`docs/specs/R2-independence.md`](docs/specs/R2-independence.md)),
and the R7 canvas preview page (`display-only`, G6 frontend track). Fleet's differentiating loops
(governed action seam, artifact handoff, delegation, canvas, experience) are **not implemented**;
the roadmap orders their *integration* behind user-visible value. The R6 delegation kernel's domain
layer is landed as an owner-directed early slice with its envelope types held **candidate, not
frozen**. Every product domain remains registered and described at breadth in
[`docs/11-PRODUCT-MATRIX.md`](docs/11-PRODUCT-MATRIX.md) and
[`docs/12-PAGE-ARCHITECTURE.md`](docs/12-PAGE-ARCHITECTURE.md), but breadth is not a claim that a
module is implementation-ready. Exact per-capability status:
[`docs/08-CRAFT-CAPABILITY-MAP.md`](docs/08-CRAFT-CAPABILITY-MAP.md) ·
[`docs/05-ROADMAP.md`](docs/05-ROADMAP.md).

There are no near/mid/far-term buckets. Every capability maps to R0–R18 through
[`docs/modules/PACKET-INDEX.md`](docs/modules/PACKET-INDEX.md); conditional rows must end in a
small proven Craft extension or `NO_GAP` evidence. External source is consumed only at that row via
[`源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](源码参考/meta/CAPABILITY-REFERENCE-MAP.md), never as a
replacement roadmap or product kernel.
