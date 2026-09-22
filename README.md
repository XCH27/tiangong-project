# Fleet — AI Work Workbench

A **local-first desktop workbench** where a person and their agents operate the same artifacts in
the same place. Fork of Craft Agents (Apache-2.0). What Fleet is and is not:
[`docs/PRODUCT.md`](docs/PRODUCT.md).

Project vision and the Harness architecture are documented in
[`docs/WHITEPAPER.md`](docs/WHITEPAPER.md).

> Craft supplies the look and the agent/runtime **base** (currently **v0.13.4**). Cindy supplies
> how features are implemented and how surfaces talk to the backend — **capabilities, not
> typesetting**. OpenChamber supplies Git/GitHub. Canvas, documents and video are Fleet's own.

## First run on a new machine

```bash
bash scripts/init.sh        # wires the commit gates, checks the toolchain and the Craft pins
bash scripts/fleet-verify.sh   # the full gate
```

`scripts/init.sh` is not optional. The pre-commit gate is wired through `core.hooksPath`, which
lives in `.git/config` and **is not carried by a clone** — until 2026-09-20 a fresh clone silently
ran no typecheck, i18n or doc-contract gate at all.

## Where to start

| Who you are | Start at |
|---|---|
| Executing agent | [`AGENTS.md`](AGENTS.md) |
| The owner | [`docs/OWNER-GUIDE.md`](docs/OWNER-GUIDE.md) |
| What Fleet is | [`docs/PRODUCT.md`](docs/PRODUCT.md) |
| What integrates next | [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md) — one ACTIVE row |
| Capability status | [`docs/08-CRAFT-CAPABILITY-MAP.md`](docs/08-CRAFT-CAPABILITY-MAP.md) |
| Implement a specific capability | [`docs/modules/PACKET-INDEX.md`](docs/modules/PACKET-INDEX.md) → its unique `Execution <ID>` contract |
| Adapt a reference project | [`Per-project adaptation routes`](docs/references/REFERENCE-REGISTRY.md#per-project-adaptation-routes) → source lock/files + Fleet target contract |

## Repository layout

| Path | What it is |
|---|---|
| `app/` | Unmodified official Craft **v0.13.4** source; dependencies/build outputs were removed on restoration. |
| `docs/` | Product authority. [`PRODUCT.md`](docs/PRODUCT.md) wins disagreements. |
| `源码参考/` | Reference source checkouts (`/Volumes/AIGC/天工参考/源码参考/`). Source stays unchanged; generated `FLEET-ADAPTATION.md` files provide owner-requested local guidance. Not product code. |
| `UI参考/` | UI kits only. Not product authority. |

## Current implementation

`app/` and the rolling Craft pin are **v0.13.4**. The 2026-09-21 rebuild (`5a510cf1d`,
corrected by `bc7eb0eb7`) replaced the previous Fleet implementation. Its recoverable source is
`snapshot/pre-rebuild-2026-09-21` (`7a8f6d5fa`). Historical passing tests and feature claims do not
apply to the rebuilt tree. Review individual mechanisms before readmitting them; do not merge the
snapshot over `app/`.

- Craft's Session/Workspace/runtime, Pages, browser, settings, i18n and panel stack are inherited.
- Fleet's Component host, Assistant store, generalized layout, per-device remote grants, run-target
  picker and TE1 cache-economy helpers are **`not implemented`** in
  this tree. The [capability map](docs/08-CRAFT-CAPABILITY-MAP.md) identifies surviving entry points.
- The owner's subsequent restoration removed Fleet code changes. Project consolidation, local
  export/help, relay changes and update/publication/telemetry corrections are **`not implemented`**.
  Prior tests and temporary desktop walkthroughs are withdrawn as current evidence.
- Windows, macOS and Linux are desktop targets; a later Orca-like phone connector extends the remote
  connection scope. Current work is documentation/preparation, then a joint original-Craft review
  before concrete correction slices are approved. See WORK-ORDER; do not launch or patch early.
- R0 is the single ACTIVE release. [WORK-ORDER](docs/WORK-ORDER.md) gives the next bounded slice;
  the local Component/panel foundation still precedes domain Components and does not wait for memory.
- [UPSTREAM-DELTA.tsv](docs/UPSTREAM-DELTA.tsv) declares actual file differences and why they exist.
  The delta and component-reference checks complement tests; the reference heuristic does not prove
  that a component mounts or a feature works.
- `bash scripts/fleet-verify.sh` is the repository integration gate. Upstream `validate:dev` alone
  runs only a selected shared-test subset and must not be reported as full-suite evidence.

## Working line

`work/craft-0.12-rebase` is the current working line; its historical name does not identify the app
version. Use `git status --short` and `git worktree list` for live state. Old branches and snapshots
have explicit [retirement conditions](docs/specs/R0-baseline-audit.md#retirement-of-obsolete-material),
not a standing role in development. New agents follow current contracts without reopening old chats.

`源码参考/` and `UI参考/` are gitignored symlinks. Preflight: [`AGENTS.md`](AGENTS.md).

There are no near/mid/far-term buckets. Every capability maps to R0–R18 through
[`docs/modules/PACKET-INDEX.md`](docs/modules/PACKET-INDEX.md); conditional rows must end in a
small proven Craft extension or `NO_GAP` evidence. External source is consumed only at that row via
[`源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](源码参考/meta/CAPABILITY-REFERENCE-MAP.md), never as a
replacement roadmap or product kernel.
