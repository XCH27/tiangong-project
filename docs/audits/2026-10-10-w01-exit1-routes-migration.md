# W0.1 Exit 1 — board and settings route restores, migration branch open

> **Date:** 2026-10-10 PT. Attached record timestamp `2026-10-10T07:18:03-07:00`.
> **Role:** Fleet Lead evidence note.
> **Spine:** `20a8d2fd0f7debcadbeb129747750d2f1a356a55` (`work/fresh-base-spine` after merged PR #54). Confirmed with `git rev-parse` on `origin/work/fresh-base-spine`.
> **Ledger:** D51 amendment in `docs/DECISIONS-LEDGER.md`. No new decision id. D52 is unchanged.
> **Authority:** the Mac pin path below is unchanged. This cloud workspace does not contain that checkout or the migration worktree. Claims below are from the attached route and branch record. This note does not reconstruct results that record does not contain.
> **Capability:** `not implemented` for the clean v0.11 baseline. Nothing in this note is `usable`.
> **Gates:** W0.1 stays In Progress. W1 stays Locked. No wave is Ready.
> **Exit item 1:** stays open. This note does not check it off. `docs/WAVE-MODULE-MAP.md` §3 item 1 asks for a recorded clean v0.11.0 baseline and migration branch. The route restores and the opened branch are recorded here. Adapt row ports are not started. Fleet `app/` is not replaced. `typecheck:all` remains the #52 failure. Whether those route restores and this branch open are enough for the remaining UI and migration bullets is a Docs judgment. This note does not make that close.
> **Binding exit list:** `docs/WAVE-MODULE-MAP.md` §3.
> **Earlier notes:** `docs/audits/2026-10-10-w01-exit1-mac-checkout.md`, `docs/audits/2026-10-10-w01-exit1-electron-launch.md`, and `docs/audits/2026-10-10-w01-exit1-rpc-loop.md`. Rows in those notes that say the Kanban board UI and the Settings panel UI are unverified, and that the migration branch is absent, describe the record as of merged #54. This note is the later record for the two route restores and for the branch open.

## Authority path

The pin worktree is left intact.

| Fact | Report |
|---|---|
| Pin path | `/Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-ai-agents--craft-agents-oss--f4e172bf372f` |
| Pin HEAD | `f4e172bf372f4ccc7389a189be1e0b0541f96282` |
| Tag on that HEAD | exact `v0.11.0` |
| Pin `package.json` version | `0.11.0` |
| Fleet spine `app/` | still package `0.10.5`. This note does not replace it |

The attached record names the Craft window by AX title `Craft Agents`. It does not give a new process id for this restore. This note does not assign pid `71904` to this pass. Pid `4855` remains the separate app `Fleet 项目审查`.

## Board route restore

`bun run electron:dev` restored a window whose window-state route was `board`.

The log line is: Restoring window ... `route=board`.

The AX window title for the Craft window was `Craft Agents`.

This restore lands in the sessions board navigator. The navigator call is `routes.view.board()`. The restored route value is `board`.

This pass records that route restore. It does not record an AX click on Kanban chrome. The earlier `tasks:list` result (returned `0` in `docs/audits/2026-10-10-w01-exit1-rpc-loop.md`) is a separate RPC call. It is not this restore.

## Settings route restore

A later restore of the same `bun run electron:dev` window used window-state route `settings`.

The log line is: Restoring window ... `route=settings`.

The window title stayed `Craft Agents`.

The attached record does not verify `Cmd+,` and does not verify a Craft Agents → 设置... menu click. The macOS frontmost menu bar stayed on pid `4855`, command `Fleet 项目审查`. That process is also Electron (`com.github.Electron`). This note claims the `route=settings` restore only.

## Migration branch

A migration branch is open on the Craft pin. It does not replace Fleet `app/` on the spine. Adapt row ports are not started.

| Fact | Report |
|---|---|
| Branch | `fleet/migration-from-v0.11.0` |
| Worktree | `/Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-agents-oss--migration-from-v0.11.0` |
| HEAD | `f4e172bf372f4ccc7389a189be1e0b0541f96282` |
| Tag on that HEAD | exact `v0.11.0` |
| Pin worktree | left intact at `craft-ai-agents--craft-agents-oss--f4e172bf372f` |
| Adapt row ports | not started |
| Fleet `app/` on the spine | still `0.10.5` |

## Typecheck

`bun run typecheck:all` remains the #52 failure (exit 2). The first hard error in that log is `TS5083` for a missing `tsconfig.base.json`. This note does not invent a pass and does not record a fix.

## What this pass records, and what it leaves open

| Check | Result in this pass |
|---|---|
| Board UI path | Route restore. Log `route=board`. Sessions board navigator `routes.view.board()` → `board`. AX title `Craft Agents` |
| Settings UI path | Route restore. Log `route=settings`. Window title stayed `Craft Agents` |
| `Cmd+,` / 设置... menu click | Not verified. Frontmost menu bar stayed on pid `4855` `Fleet 项目审查` |
| AX click on Kanban chrome | Not in this record |
| `tasks:list` | Not this pass. The #53 RPC result stays `0` |
| Migration branch | Open. `fleet/migration-from-v0.11.0` at the worktree above. HEAD is the v0.11.0 pin |
| Adapt row ports | Not started |
| Fleet `app/` | Still `0.10.5` on the spine. Not replaced |
| `typecheck:all` | Still the #52 failure. Exit 2 |
| Exit item 1 | Still open. Docs judges the remaining UI and migration bullets |
| W1 | Still Locked |
| Clean v0.11 baseline | Still `not implemented` |

## What this note does not do

- It does not close Exit item 1.
- It does not close Exit item 2. Fleet-old rows and the file-by-file `app/` diff stay deferred (D52).
- It does not mark W0.1 or W1 Ready.
- It does not promote M01, or any other module, to `usable`.
- It does not add an action id or bump `CONTRACT_VERSION`.
- It does not copy the Mac tree or the migration worktree into this repository.
- It does not invent a `typecheck:all` pass or a restored `tsconfig.base.json`.
- It does not claim an AX click on Kanban chrome, and it does not treat `tasks:list` as this board path.
- It does not claim a `Cmd+,` accelerator or a 设置... menu click.
- It does not claim adapt row ports have started, or that Fleet `app/` was replaced.
- It does not treat pid `4855` (`Fleet 项目审查`) as Craft.
