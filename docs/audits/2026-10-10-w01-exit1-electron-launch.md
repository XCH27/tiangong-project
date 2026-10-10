# W0.1 Exit 1 — Electron launch and relaunch

> **SUPERSEDED 2026-10-10 (D56):** Historical only. Not a product gate. ZCode-first supersedes this note.
>
> Product baseline is `.fleet/zcode` (ZCode). This Exit / Craft v0.11 pin / W0.1 Craft-migration material stays in git as reference-only historical audit. Do not treat these W0.1 Exit items as open product gates. Craft Agents remains interaction reference only. This banner does not delete the record below, does not mark `usable` or Ready, and does not invent a typecheck pass.


> **Date:** 2026-10-10
> **Role:** Fleet Lead evidence note.
> **Spine:** `2ee3ec0e4beff2d42b1eed9d71278b208b7c6bf6` (`work/fresh-base-spine` after merged PR #52). Confirmed with `git rev-parse` on `origin/work/fresh-base-spine`.
> **Ledger:** D51 amendment in `docs/DECISIONS-LEDGER.md`. No new decision id. D52 is unchanged.
> **Authority:** the Mac path below. This cloud workspace does not contain that checkout. Craft claims below are from the two attached `electron:dev` logs and the install note. This note does not reconstruct lines those files do not contain.
> **Correction (2026-10-10):** the first draft of this note treated a System Events window titled `Fleet` as Craft. That was wrong. On the Mac, `ps` shows pid `4855` command is `Fleet 项目审查`, a separate local app. The AX title and the `Cmd+,` sent at that process are retracted. They are not Craft window evidence.
> **Capability:** `not implemented` for the clean v0.11 baseline. Nothing in this note is `usable`.
> **Gates:** W0.1 stays In Progress. W1 stays Locked. No wave is Ready.
> **Exit item 1:** stays open. Launch and relaunch do not close it. `typecheck:all` remains the #52 failure. At this launch record the migration branch was still absent. The later route note records the branch open and does not close item 1.
> **Binding exit list:** `docs/WAVE-MODULE-MAP.md` §3. This note does not check item 1 off.
> **Earlier source-tree note:** `docs/audits/2026-10-10-w01-exit1-mac-checkout.md`.
> **Later RPC note:** `docs/audits/2026-10-10-w01-exit1-rpc-loop.md`. That pass does not close Exit item 1.
> **Later route note:** `docs/audits/2026-10-10-w01-exit1-routes-migration.md`. That pass records `route=board` and `route=settings` restores and branch `fleet/migration-from-v0.11.0`. It does not close Exit item 1.

## Follow-up after #54 (`20a8d2fd`)

The later route record is `docs/audits/2026-10-10-w01-exit1-routes-migration.md`. `bun run electron:dev` restored window-state `route=board` (log `Restoring window ... route=board`; AX title `Craft Agents`; sessions board navigator `routes.view.board()` → `board`) and later `route=settings` (log `Restoring window ... route=settings`; window title stayed `Craft Agents`). Those are route restores. They are not an AX click on Kanban chrome and not `tasks:list`. `Cmd+,` and Craft Agents → 设置... were not verified: the frontmost menu bar stayed on pid `4855` `Fleet 项目审查` (also Electron, `com.github.Electron`). Branch `fleet/migration-from-v0.11.0` is open on the pin. Adapt row ports are not started. Fleet `app/` stays `0.10.5`. `typecheck:all` remains the #52 failure. Exit item 1 stays open.

The checklist below stays the launch record. The #54 note supersedes the "Kanban board UI not verified", "Settings panel UI not verified", and "migration branch still absent" rows only in the sense that note records.

## Follow-up after #53 (`9824a1a3`)

The later RPC pass is `docs/audits/2026-10-10-w01-exit1-rpc-loop.md`. It was taken against the live `bun run electron:dev` Craft Electron, pid `71904`. AX listed that window as `Craft Agents`. That pid is not pid `4855` (`Fleet 项目审查`).

The checklist and the "still required" list below are the #53 launch record. They stay as that record. The RPC note supersedes three of those open rows, and only as WebSocket results: a new project slug on disk, one `sessions:sendMessage` on `260912-misty-tiger` with assistant content `pong`, and `browser-pane:create` returning `browser-1`. Kanban board UI, Settings panel UI, `typecheck:all`, and the migration branch stay open. Exit item 1 stays open.

## Authority path

Unchanged from #51 and #52.

| Fact | Report |
|---|---|
| Path | `/Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-ai-agents--craft-agents-oss--f4e172bf372f` |
| HEAD | `f4e172bf372f4ccc7389a189be1e0b0541f96282` |
| Tag on that HEAD | exact `v0.11.0` |
| `package.json` version | `0.11.0` |
| Evidence summary clock | `2026-10-10T06:49:06-07:00` PT |
| `electron --version` after the dist repair | `v39.2.7` |

## First `electron:dev` failed, then the dist was repaired

The evidence summary's install note records this. The attached first log does not contain the failed spawn. It is the launch after the repair.

Recorded failure: `extract-zip` on the AIGC volume left an incomplete Electron dist, only `version` and `LICENSES.chromium.html`, with no `Electron.app`.

Recorded fix: unzip the cached `electron-v39.2.7-darwin-arm64.zip` into `node_modules/electron/dist`, and write `path.txt` with no trailing newline. That fixed the spawn. `electron --version` then printed `v39.2.7`.

This note does not invent a different repair, and it does not claim the incomplete dist was a typecheck result.

## First successful launch

The evidence checklist names `electron:dev`. Both attached logs open with `$ bun run scripts/electron-dev.ts`.

The first log reaches `App initialized successfully` at `2026-10-10T13:48:20.709Z`. Build warnings in that log, and again on relaunch, are:

`Cannot find base config file "../../tsconfig.base.json"`

from `packages/session-mcp-server/tsconfig.json` and `packages/session-tools-core/tsconfig.json`. That is the same missing-file pin gap #52 recorded as `TS5083`. The launch continued. This note does not record a fix for `tsconfig.base.json`.

Recorded from that first successful Craft log:

- `Craft Agent server listening on ws://0.0.0.0:9100` at `2026-10-10T13:48:20.544Z`.
- `Loaded 3 sessions from disk (metadata only)` at the same second.
- `[WindowState] Loaded window state: 1 windows`, then restored workspace `1a476d9e-0038-60b4-4bfd-879b42697013`. ConfigWatcher names that workspace `my-workspace` at `/Users/lullwen/.craft-agent/workspaces/my-workspace`.
- Restored URL route: `allSessions/session/260912-misty-tiger`.
- `[window] Created window for workspace 1a476d9e-0038-60b4-4bfd-879b42697013 (focused: false)` at `2026-10-10T13:48:20.701Z`.
- `[main] Restored 1 window(s) from saved state`.
- Renderer `ws-rpc-server` client connected (`clientId` `ded61c04-2242-4448-9403-01d2084d506f`), disconnected during a Vite dependency reload, then connected again (`82fd9515-8aff-4eaa-9a59-18d2f3d75ca1`).

The first log's Node deprecation names pid `67470`. The evidence header at `06:49:06` PT records parent pid `67450`, `parent running: no`, and an empty Electron pid list. The first log itself has no shutdown section. The same evidence file later records `killing parent 67450`.

## Retracted: System Events title `Fleet` was not Craft

The evidence summary printed `Electron windows=Fleet`, `pid=4855 before=Fleet afterCmdComma=Fleet`, and, after relaunch, `Fleet window present pid=4855`. The first draft of this note treated that title as Craft's window and treated `Cmd+,` as a Craft settings attempt.

That attribution is wrong. On the Mac, `ps` shows pid `4855` command is `Fleet 项目审查`, a separate local app. System Events did not show Craft's window titled `Fleet`. `Cmd+,` was not sent to Craft's window. The Settings panel was not checked on Craft.

A System Events lookup by unix id `67475` failed (`无效的索引`, `-1719`). That failed lookup is not a sighting of a Craft window. `screencapture` did not produce `/tmp/craft-v011-electron-window.png`. There is no screenshot of the Craft window.

Craft window evidence that remains is the log line `Created window for workspace …` on launch and again on relaunch. This note does not claim a visible title for that window.

## Quit and relaunch

Pre-restart snapshot clock: `2026-10-10T06:49:34-07:00`.

The evidence file records `killing parent 67450`, then `QUIT_OK`, then `RELAUNCH_OK at 1*8s`.

An earlier status line in that file says `full Kanban/session-turn/BrowserPane/restart NOT completed`. The quit and relaunch section comes after that line. The final checklist in the same file marks quit and relaunch PASS. This note follows the final checklist plus the relaunch log.

The relaunch log also opens with `$ bun run scripts/electron-dev.ts` and the same `tsconfig.base.json` warnings. It records:

- `[session] Loaded 3 sessions from disk (metadata only)` at `2026-10-10T13:49:41.582Z`.
- `Craft Agent server listening on ws://0.0.0.0:9100` at the same timestamp.
- Window created for workspace `1a476d9e-0038-60b4-4bfd-879b42697013` at `2026-10-10T13:49:41.656Z` (`focused: false`).
- `Restored 1 window(s) from saved state`.
- `[main] App initialized successfully` at `2026-10-10T13:49:41.660Z`.
- Renderer client connected (`58dc7b9d-6999-4c57-8c43-dc4b4fa50033`), disconnected on the Vite reload, then connected again (`b2d029b1-8328-4826-a751-d1afd1459ce9`).
- `sessions:get` returned three ids: `260912-misty-tiger`, `260909-ruby-bear`, `260909-fit-tide`.
- The relaunch log later shuts down (`reason` `user-quit`, window state saved, `Cleanup complete`). The evidence file ends `CLEAN_SHUTDOWN`.

Stale lock lines from the Craft logs, quoted only as process identity: the first launch overwrote lock PID `22167`. The relaunch overwrote lock PID `67475`. Those pids are not pid `4855`.

## Persistence across that restart

`projects/project/` was already on disk. It was not created in this pass. Before and after relaunch the evidence file lists `projects/project/config.json` (375 bytes, dated Sep 12 12:42) and an `assets/` directory.

`session.jsonl` SHA-256 values are the same before and after relaunch:

| Session | Bytes | SHA-256 |
|---|---|---|
| `260909-fit-tide` | 1311 | `860d5d372b7d9c3a2aed878753f96399478c72c618d6d3efe162dad6ddc01f89` |
| `260909-ruby-bear` | 102978 | `b5fc085699618b3009ae15222574e9b70b748a4b54182299265400de09b95de2` |
| `260912-misty-tiger` | 1825 | `9369837db90c815632a527a19cf0815d86c91a8e9341d1b02891625650c36dc2` |

`ls` of `/Users/lullwen/.craft-agent/workspaces/my-workspace/tasks` reported `No such file or directory`. This note records that absence. It does not turn it into a created task.

## Corrected checklist

Log-backed rows stay. The evidence file's own checklist marked "window title Fleet" and a `Cmd+,` attempt as Craft. Those two rows are retracted.

| Check | Result in this pass |
|---|---|
| `electron:dev` launch | PASS in the Craft logs (repaired first success, and relaunch). `App initialized successfully` both times |
| Renderer `ws-rpc-server` client | PASS in the Craft logs |
| System Events window title `Fleet` | RETRACTED. pid `4855` is `Fleet 项目审查`, not Craft |
| `Cmd+,` | RETRACTED as a Craft check. That targeting used pid `4855` |
| Existing workspace `my-workspace` | PASS in the Craft logs (restored) |
| Existing `projects/project` | PRESENT. Not newly created this run |
| Kanban board | NOT verified |
| Ordinary session turn | NOT run |
| Settings panel on Craft | NOT verified |
| BrowserPane | NOT opened |
| Quit and relaunch | PASS in the evidence file (`QUIT_OK`, `RELAUNCH_OK`) and in the relaunch log |
| `session.jsonl` and `projects/project/config.json` after relaunch | PASS. Hashes unchanged |
| `typecheck:all` | Still FAIL, as #52. Exit 2. This note does not invent a pass |
| Migration branch | Still ABSENT |
| `app/` | Not replaced |
| Exit item 1 | Still OPEN |
| Screenshot of Craft | Not captured |

## What is still required before Exit item 1 can close

The list below is what this launch record still required. The RPC follow-up records items 1, 3, and 5 as WebSocket results, not as AX clicks or screenshots. `docs/audits/2026-10-10-w01-exit1-routes-migration.md` later records item 2 as a `route=board` restore and item 4 as a `route=settings` restore, and records item 7 as branch `fleet/migration-from-v0.11.0` open with adapt ports not started. Those restores are not an AX click and not a menu click. Item 6 stays the #52 failure. Exit item 1 stays open. Detail: `docs/audits/2026-10-10-w01-exit1-rpc-loop.md` and `docs/audits/2026-10-10-w01-exit1-routes-migration.md`.

On the same Mac path:

1. Create a new project in the running app. The existing `projects/project` directory does not count as that create.
2. Open the Kanban board.
3. Send one ordinary session turn. Restoring `260912-misty-tiger` is not that turn.
4. Open Settings on the Craft window and verify the panel. The earlier `Cmd+,` was sent at pid `4855` (`Fleet 项目审查`), not at Craft.
5. Open BrowserPane.
6. Keep `typecheck:all` honest. It is still the #52 failure until a later log records otherwise.
7. Only then open a migration branch whose base is this checkout. That branch is still absent. `app/` stays `0.10.5` on the Fleet tree.

`bun run electron:start` was not the command in these logs.

## What this note does not do

- It does not close Exit item 1.
- It does not close Exit item 2. Fleet-old rows and the file-by-file `app/` diff stay deferred (D52).
- It does not mark W0.1 or W1 Ready.
- It does not promote M01, or any other module, to `usable`.
- It does not add an action id or bump `CONTRACT_VERSION`.
- It does not copy the Mac tree into this repository.
- It does not invent a `typecheck:all` pass, a restored `tsconfig.base.json`, a numeric exit code for `electron:dev`, or a visible Craft window title.
- It does not claim System Events saw Craft's window titled `Fleet`. That misattribution is corrected above.
