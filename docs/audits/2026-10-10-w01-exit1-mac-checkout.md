# W0.1 Exit 1 — Mac populated source tree

> **Date:** 2026-10-10
> **Role:** Fleet Lead evidence note.
> **Spine:** `8cd1365d` (`work/fresh-base-spine` after merged PR #51). The #51 body was written against `b9b60dfa`. The Electron follow-up below is written against `2ee3ec0e4beff2d42b1eed9d71278b208b7c6bf6` (after merged PR #52).
> **Ledger:** D51 follow-up in `docs/DECISIONS-LEDGER.md`. D52 is unchanged.
> **Authority:** the Mac path below. This cloud workspace does not contain that checkout. A public listing of the same SHA is corroboration of directory names only.
> **Capability:** `not implemented` for the clean v0.11 baseline. Nothing in this note is `usable`.
> **Gates:** W0.1 stays In Progress and Locked for workers. W1 stays Locked. No wave is Ready.
> **Exit item 1:** stays open. The D51 pin does not close it. The source tree does not close it. A finished non-frozen install does not close it. A failed typecheck does not close it. Electron launch and relaunch are recorded in `docs/audits/2026-10-10-w01-exit1-electron-launch.md` and do not close it. An authenticated RPC pass is recorded in `docs/audits/2026-10-10-w01-exit1-rpc-loop.md` and does not close it. Kanban board UI and the Settings panel UI are still not verified.
> **Binding exit list:** `docs/WAVE-MODULE-MAP.md` §3. This note does not check item 1 off.

## Follow-up after #53 (`9824a1a3`)

Authenticated WebSocket RPC against the live `bun run electron:dev` Craft Electron is `docs/audits/2026-10-10-w01-exit1-rpc-loop.md`. Pid `71904`. AX window title `Craft Agents`. That pid is not pid `4855` (`Fleet 项目审查`). The client used `ws://127.0.0.1:9100` with `protocolVersion` `1.0`. This was not an AX click for Kanban or Settings, and not a screencapture.

`projects:create` wrote slug `exit1-loop-evidence-2026-10-10t14-07-27` under `~/.craft-agent/workspaces/my-workspace/projects/`. The existing `projects/project` directory is not that create. `sessions:sendMessage` on `260912-misty-tiger` accepted; user message `msg-1791641248077-usni4x` persisted; assistant reply `msg-1791641251704-leme9f` content `pong`. `browser-pane:create` returned `browser-1`. `tasks:list` returned `0` (empty board data, not a Kanban UI open). `settings:getServerStatus` reported `running: true`. `settings:getServerConfig` reported enabled and a port. Those settings responses included a token; the token is not written here. `menu:openSettings` returned no handler. Settings panel UI is not verified.

`typecheck:all` stays the #52 failure. The migration branch is still absent. `app/` is not replaced. Exit item 1 stays open. W0.1 stays In Progress. W1 stays Locked. The clean v0.11 baseline stays `not implemented`.

Rows below that say a new project, a session turn, and BrowserPane were not done describe #51 and #52, and the launch record before this RPC. They are superseded for those three RPC results only.

## Follow-up after #52 (`2ee3ec0e`)

Electron `electron:dev` was run on the same Mac path. The detail is `docs/audits/2026-10-10-w01-exit1-electron-launch.md`. Rows below that say Electron launch is not yet run describe #51 and #52. They are superseded for the launch and the relaunch only.

The first `electron:dev` failed. `extract-zip` left an incomplete Electron dist (`version` and `LICENSES.chromium.html` only, no `Electron.app`). The recorded fix unzipped cached `electron-v39.2.7-darwin-arm64.zip` into `node_modules/electron/dist` and wrote `path.txt` with no trailing newline. `electron --version` then printed `v39.2.7`. The attached first log is the launch after that repair, not a transcript of the failed spawn.

That launch initialized the app, bound `ws://0.0.0.0:9100`, restored workspace `my-workspace`, and the renderer `ws-rpc-server` client connected. Those are Craft log lines. Build warnings named the missing `../../tsconfig.base.json`. That is the same pin gap as the #52 `TS5083` failure. No typecheck fix is recorded. `typecheck:all` stays failed.

Corrected 2026-10-10: the first draft of this follow-up said System Events saw window title `Fleet` and that `Cmd+,` left that title. That window was pid `4855`. Mac `ps` shows its command is `Fleet 项目审查`, a separate local app, not Craft. Those two claims are retracted. Craft evidence for this launch is the Electron logs only.

Quit of parent pid `67450` is recorded as `QUIT_OK`. Relaunch is recorded as `RELAUNCH_OK`. The relaunch log shows `Loaded 3 sessions from disk (metadata only)` and `App initialized successfully` again. SHA-256 of `session.jsonl` for `260909-fit-tide`, `260909-ruby-bear`, and `260912-misty-tiger` was unchanged. `projects/project/config.json` was still present. That project directory was not created in this pass.

At this #52 launch record, still not done were: create a new project, open Kanban, send an ordinary session turn, verify the Settings panel on the Craft window, open BrowserPane. The RPC follow-up after #53 records the project create, the session turn, and `browser-pane:create`. Kanban board UI and Settings panel UI stay unverified. The migration branch is still absent. `app/` is not replaced. Exit item 1 stays open. W0.1 stays In Progress. W1 stays Locked. The clean v0.11 baseline stays `not implemented`.

## Follow-up after #51 (`8cd1365d`)

The authority path is unchanged. HEAD, the tag, and the package version are unchanged.

| Fact | Report |
|---|---|
| Path | `/Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-ai-agents--craft-agents-oss--f4e172bf372f` |
| HEAD | `f4e172bf372f4ccc7389a189be1e0b0541f96282` |
| Tag on that HEAD | exact `v0.11.0` |
| `package.json` version | `0.11.0` |
| `bun install` (not frozen) | Finished. `node_modules` is present. |
| Lockfile | That install mutated `bun.lock`. `git checkout -- bun.lock` restored it. The reference worktree stays pin-clean. |
| `bun install --frozen-lockfile` | Still failed, as #51 recorded. This follow-up does not add an exit code or stderr. |
| `bun run typecheck:all` | Failed. Exit 2. |
| First hard error | `TS5083: Cannot read file '.../tsconfig.base.json'`. |
| `tsconfig.base.json` at this pin | Absent from HEAD. `git ls-tree` and `git show` are fatal for that path. |
| Later errors in the same log | `@types/cacheable-request` / `keyv` Store and ResponseLike issues, and `packages/core` source errors (regex flags, Set iteration, `validation.ts`). |
| Fix | None recorded. This note does not invent one. |
| Electron launch | Not run at this #52 record. The follow-up after #52 records launch and relaunch. |
| Project, Kanban, session turn, settings, BrowserPane, restart | Not run at this #52 record. Restart of the existing workspace is recorded in the follow-up after #52. The RPC follow-up after #53 records project create, the session turn, and `browser-pane:create`. Kanban board UI and Settings panel UI stay unverified. |
| Migration branch | Still absent. `app/` is not replaced. |

The ellipsis in the `TS5083` message is the report as given. This note does not reconstruct the absolute path and does not claim a repair for the missing `tsconfig.base.json`.

A finished install and a failed typecheck are evidence. They do not pass the baseline typecheck gate. W0.1 stays In Progress. W1 stays Locked. The clean v0.11 baseline stays `not implemented`.

## What #51 recorded from the Mac

Populated worktree on Vella's Mac. The install-finish and typecheck rows in the follow-up above supersede the two "not confirmed" / "not yet run" cells that #51 wrote.

| Fact | Report at #51 |
|---|---|
| Path | `/Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-ai-agents--craft-agents-oss--f4e172bf372f` |
| HEAD | `f4e172bf372f4ccc7389a189be1e0b0541f96282` |
| Tag on that HEAD | exact `v0.11.0` |
| `package.json` version | `0.11.0` |
| Top-level `apps/` | `cli`, `electron`, `viewer`, `webui` |
| Top-level `packages/` | `core`, `messaging-gateway`, `messaging-whatsapp-worker`, `pi-agent-server`, `server`, `server-core`, `session-mcp-server`, `session-tools-core`, `shared`, `ui` |
| Top-level `projects/` | absent from the source tree |
| Top-level `tasks/` | absent from the source tree |
| Config layout | README documents `~/.craft-agent/` (lines ~492+) |
| `bun install --frozen-lockfile` | failed: the lockfile had changes under frozen mode |
| `bun install` (not frozen) | started; finish was not confirmed at #51. The follow-up records that it finished. |
| Typecheck | not yet run at #51. The follow-up records exit 2. |
| Electron launch | not yet run at #51. The follow-up after #52 records launch and relaunch. |
| Project, task, session turn, settings, BrowserPane, restart | not yet run at #51. Restart of the existing workspace is recorded after #52. The RPC follow-up after #53 records project create, the session turn, and `browser-pane:create`. Kanban board UI and Settings panel UI stay unverified. |

Exit code and stderr for the frozen install were not supplied. This note does not invent them.

HEAD matches D51. The package version matches the pin. The source tree is populated.

## What the README block actually lists

At tag `v0.11.0` (`f4e172bf`), README line 492 is the configuration heading. The block through line 509 stores configuration at `~/.craft-agent/` and names `config.json`, `credentials.enc`, `preferences.json`, `theme.json`, and `workspaces/{id}/` with `config.json`, `theme.json`, `automations.json`, `sessions/`, `sources/`, `skills/`, and `statuses/`.

That block does not print `projects/` or `tasks/`. The Mac report identifies project and task directories as runtime data under `~/.craft-agent/`, and identifies them as absent from the source tree. This note records that report. At #51 and #52 this note did not claim those runtime folders were listed, because the desktop app had not been launched. The Electron follow-up after #52 lists them: under `~/.craft-agent/workspaces/my-workspace/`, `projects/project/config.json` and three `session.jsonl` files were present, and `tasks/` was absent.

The storage paths already recorded in `docs/UPSTREAM-BASELINE.md` (`{workspaceRootPath}/projects/{slug}/`, `{workspaceRoot}/tasks/<slug>/`) come from source comments in `storage.ts`. They are not top-level directories of this checkout.

The README architecture diagram (about lines 350–360) draws `apps/cli`, `apps/electron`, `packages/core`, and `packages/shared` only. The Mac listing above is the fuller source-tree inventory.

## Cloud versus Mac

This cloud workspace still has no copy of the path above. `源码参考/software/craft-agents-oss` on the Fleet tree remains the empty gitlink at the v0.10.5 parent. `app/package.json` remains `0.10.5`.

A public directory listing of `craft-ai-agents/craft-agents-oss` at `f4e172bf372f4ccc7389a189be1e0b0541f96282` shows the same `apps/` and `packages/` names, the same `package.json` version `0.11.0`, and no top-level `projects/` or `tasks/`. That listing agrees with the Mac report. It is not a populated checkout on this machine. The Mac path is the authority for HEAD, the exact tag on that worktree, the finished non-frozen install, the typecheck failure, the Electron launch and relaunch, and the later RPC pass.

## Install and typecheck state

| Command | State |
|---|---|
| `bun install --frozen-lockfile` | Failed. The lockfile had changes under frozen mode. Still failed after #51. Exit code and stderr were not supplied. |
| `bun install` | Finished. `node_modules` is present. The command mutated `bun.lock`. `git checkout -- bun.lock` restored the lockfile, so the reference worktree matches the pin. Restoring the lockfile does not make frozen install succeed. |
| `bun run typecheck:all` | Failed. Exit 2. First hard error: `TS5083: Cannot read file '.../tsconfig.base.json'`. `tsconfig.base.json` is not in HEAD at this pin. |

Frozen mode is not the command that closes the install step. The documented install in that tag's README ("Build from Source") is `bun install`. That command finished. The documented typecheck command is `bun run typecheck:all`. That command failed. `bun run typecheck` on this tag runs only `typecheck:shared` and was not the command reported.

## Commands that still have to be recorded

Install and `typecheck:all` are recorded. Typecheck failed, so it does not satisfy the baseline typecheck gate, and this note does not prescribe a repair.

`bun run electron:dev` is recorded in `docs/audits/2026-10-10-w01-exit1-electron-launch.md`. The first attempt failed on an incomplete Electron dist. After the recorded unzip repair, launch and relaunch both reached `App initialized successfully`. `bun run electron:start` was not the command in those logs.

The acceptance already written in `docs/audits/2026-10-10-w01-v011-baseline-blk001.md` is only partly recorded:

1. Open existing workspace `my-workspace`: done by restore in the Craft log. Create a new project: done later by RPC `projects:create` (slug `exit1-loop-evidence-2026-10-10t14-07-27`). `projects/project/` was already present and does not count as that create. Open the Kanban board UI: not verified. `tasks:list` later returned `0` and is not that UI. Send one ordinary session turn: done later by RPC `sessions:sendMessage` on `260912-misty-tiger` (assistant content `pong`). Settings panel on Craft: not verified. The earlier `Cmd+,` targeted pid `4855` (`Fleet 项目审查`), not Craft, and is retracted. `menu:openSettings` later returned no handler. Open BrowserPane: `browser-pane:create` later returned `browser-1` (RPC, not an AX click or a screenshot). Quit and relaunch: done (`QUIT_OK`, `RELAUNCH_OK`). `session.jsonl` hashes and `projects/project/config.json` at the #53 relaunch: still present and unchanged. This note does not supply a post-turn hash.
2. A migration branch whose base is that checkout: still absent.

Until Kanban board UI, Settings panel UI, a recorded `typecheck:all` result other than the #52 failure, and the migration branch are written down, Exit item 1 stays open. A recorded install, a failed typecheck, the launch, and this RPC pass still leave Exit item 1 open. `app/` is not replaced.

## What this note does not do

- It does not close Exit item 1.
- It does not close Exit item 2. Fleet-old rows and the file-by-file `app/` diff stay deferred (D52).
- It does not mark W0.1 or W1 Ready.
- It does not promote M01, or any other module, to `usable`.
- It does not add an action id or bump `CONTRACT_VERSION`.
- It does not copy the Mac tree into this repository.
- It does not invent a typecheck fix or a restored `tsconfig.base.json`. At #52 this list also refused to invent an Electron launch. The later launch note records the logs that were captured. It does not invent a `typecheck:all` pass.
