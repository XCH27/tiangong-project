# Fleet — AI Work Workbench

A **local-first desktop workbench** where a person and their agents operate the same artifacts in
the same place. Fork of Craft Agents (Apache-2.0). What Fleet is and is not:
[`docs/PRODUCT.md`](docs/PRODUCT.md).

> Craft supplies the look and the agent/runtime **base** (currently **v0.13.3**). Cindy supplies
> how features are implemented and how surfaces talk to the backend — **capabilities, not
> typesetting**. OpenChamber supplies Git/GitHub. Canvas, documents and video are Fleet's own.

## Where to start

| Who you are | Start at |
|---|---|
| Executing agent | [`AGENTS.md`](AGENTS.md) |
| The owner | [`docs/OWNER-GUIDE.md`](docs/OWNER-GUIDE.md) |
| What Fleet is | [`docs/PRODUCT.md`](docs/PRODUCT.md) |
| What integrates next | [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md) — one ACTIVE row |
| Capability status | [`docs/08-CRAFT-CAPABILITY-MAP.md`](docs/08-CRAFT-CAPABILITY-MAP.md) |

## Repository layout

| Path | What it is |
|---|---|
| `app/` | Runnable application. Craft **v0.13.3** base plus Fleet work on top. |
| `docs/` | Product authority. [`PRODUCT.md`](docs/PRODUCT.md) wins disagreements. |
| `源码参考/` | Read-only reference checkouts (`/Volumes/AIGC/天工参考/源码参考/`). Not product code. |
| `UI参考/` | UI kits only. Not product authority. |

## Current state (honest)

- **Base:** `app/` tracks Craft Agents OSS **v0.13.3** (rolling pin `源码参考/software/craft-agents-oss` at tag `v0.13.3`). v0.10.5 remains a *look* measurement pin, not a shell to restore.
- **Working branch name** `work/craft-0.12-rebase` is historical; the tree is no longer v0.12.0.
- **Board and conversation are separate navigators.** `/board` is not a session-list view mode.
- **Canvas is `not implemented`.** Do not put an empty pane in the default window. When it is built, the reference is Canvasight's same-board Pages/Tasks/Assets.
- **Assistants** exist as a domain (`packages/shared/src/assistants`) and are **not** on the chrome yet. A kit is not a label.
- **ACTIVE release is R0** (Craft v0.13.3 baseline stabilization) — see
  [`docs/05-ROADMAP.md`](docs/05-ROADMAP.md), which owns release order. R15 is `DEP`, not ACTIVE.
  Whatever R0 retains, it is not rearranging Craft chrome.
- R0 on the discarded `work/fresh-base-spine` renderer is closed. Do not cut `fleet-baseline-r0` on that tree.

`源码参考/` and `UI参考/` are gitignored symlinks. Preflight: [`AGENTS.md`](AGENTS.md).

There are no near/mid/far-term buckets. Every capability maps to R0–R18 through
[`docs/modules/PACKET-INDEX.md`](docs/modules/PACKET-INDEX.md); conditional rows must end in a
small proven Craft extension or `NO_GAP` evidence. External source is consumed only at that row via
[`源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](源码参考/meta/CAPABILITY-REFERENCE-MAP.md), never as a
replacement roadmap or product kernel.
