# W0.1 Exit 1 — Electron launch and relaunch

> **Date:** 2026-10-10
> **Role:** Fleet Lead evidence note.
> **Spine:** `2ee3ec0e4beff2d42b1eed9d71278b208b7c6bf6` (`work/fresh-base-spine` after merged PR #52). Confirmed with `git rev-parse` on `origin/work/fresh-base-spine`.
> **Ledger:** D51 amendment in `docs/DECISIONS-LEDGER.md`. No new decision id. D52 is unchanged.
> **Authority:** the Mac path below. This cloud workspace does not contain that checkout. Quotes below are from the 2026-10-10 evidence summary and the two attached `electron:dev` logs. This note does not reconstruct lines those files do not contain.
> **Capability:** `not implemented` for the clean v0.11 baseline. Nothing in this note is `usable`.
> **Gates:** W0.1 stays In Progress. W1 stays Locked. No wave is Ready.
> **Exit item 1:** stays open. Launch and relaunch do not close it. `typecheck:all` remains the #52 failure. The migration branch is still absent.
> **Binding exit list:** `docs/WAVE-MODULE-MAP.md` §3. This note does not check item 1 off.
> **Earlier source-tree note:** `docs/audits/2026-10-10-w01-exit1-mac-checkout.md`.

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

Recorded from that first successful log and the evidence summary:

- `Craft Agent server listening on ws://0.0.0.0:9100` at `2026-10-10T13:48:20.544Z`.
- `Loaded 3 sessions from disk (metadata only)` at the same second.
- `[WindowState] Loaded window state: 1 windows`, then restored workspace `1a476d9e-0038-60b4-4bfd-879b42697013`. ConfigWatcher names that workspace `my-workspace` at `/Users/lullwen/.craft-agent/workspaces/my-workspace`.
- Restored URL route: `allSessions/session/260912-misty-tiger`.
- `[window] Created window for workspace 1a476d9e-0038-60b4-4bfd-879b42697013 (focused: false)` at `2026-10-10T13:48:20.701Z`.
- `[main] Restored 1 window(s) from saved state`.
- Renderer websocket client connected (`clientId` `ded61c04-2242-4448-9403-01d2084d506f`), disconnected during a Vite dependency reload, then connected again (`82fd9515-8aff-4eaa-9a59-18d2f3d75ca1`).
- System Events saw window title `Fleet` (`Electron windows=Fleet`). A later lookup by unix id `67475` failed: `不能获得“process 1 whose unix id = 67475”。无效的索引。 (-1719)`. The same error is printed twice.
- `screencapture` failed. `/tmp/craft-v011-electron-window.png` is absent. The evidence file calls this a display failure.
- `Cmd+,` was attempted. Evidence line: `pid=4855 before=Fleet afterCmdComma=Fleet`. The window title stayed `Fleet`. The Settings panel was not verified.

`pid=4855` is quoted as printed. The first log's Node deprecation names pid `67470`. This note does not treat `4855` as that Node pid.

The evidence header at `06:49:06` PT records parent pid `67450`, `parent running: no`, and an empty Electron pid list. The first log itself has no shutdown section. The same evidence file later records `killing parent 67450`.

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
- After relaunch the evidence file records `Fleet window present pid=4855`.

Stale lock lines, quoted only as process identity: the first launch overwrote lock PID `22167`. The relaunch overwrote lock PID `67475`, the same unix id System Events could not find.

## Persistence across that restart

`projects/project/` was already on disk. It was not created in this pass. Before and after relaunch the evidence file lists `projects/project/config.json` (375 bytes, dated Sep 12 12:42) and an `assets/` directory.

`session.jsonl` SHA-256 values are the same before and after relaunch:

| Session | Bytes | SHA-256 |
|---|---|---|
| `260909-fit-tide` | 1311 | `860d5d372b7d9c3a2aed878753f96399478c72c618d6d3efe162dad6ddc01f89` |
| `260909-ruby-bear` | 102978 | `b5fc085699618b3009ae15222574e9b70b748a4b54182299265400de09b95de2` |
| `260912-misty-tiger` | 1825 | `9369837db90c815632a527a19cf0815d86c91a8e9341d1b02891625650c36dc2` |

`ls` of `/Users/lullwen/.craft-agent/workspaces/my-workspace/tasks` reported `No such file or directory`. This note records that absence. It does not turn it into a created task.

## Honest checklist from the evidence file

| Check | Result in this pass |
|---|---|
| `electron:dev` launch | PASS (repaired first success, and relaunch) |
| Window title `Fleet` and renderer websocket client | PASS |
| Existing workspace `my-workspace` | PASS (restored) |
| Existing `projects/project` | PRESENT. Not newly created this run |
| Kanban board | NOT verified |
| Ordinary session turn | NOT run |
| Settings UI | `Cmd+,` attempted. Title stayed `Fleet`. Panel not verified |
| BrowserPane | NOT opened |
| Quit and relaunch | PASS |
| `session.jsonl` and `projects/project/config.json` after relaunch | PASS. Hashes unchanged |
| `typecheck:all` | Still FAIL, as #52. Exit 2. This note does not invent a pass |
| Migration branch | Still ABSENT |
| `app/` | Not replaced |
| Exit item 1 | Still OPEN |
| Screenshot | Not captured. `screencapture` failed |

## What is still required before Exit item 1 can close

On the same Mac path:

1. Create a new project in the running app. The existing `projects/project` directory does not count as that create.
2. Open the Kanban board.
3. Send one ordinary session turn. Restoring `260912-misty-tiger` is not that turn.
4. Open Settings and verify the panel. `Cmd+,` left the title `Fleet`.
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
- It does not invent a `typecheck:all` pass, a restored `tsconfig.base.json`, or a numeric exit code for `electron:dev`.
