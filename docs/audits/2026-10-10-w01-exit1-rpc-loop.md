# W0.1 Exit 1 — RPC project, session turn, and BrowserPane

> **Date:** 2026-10-10 PT
> **Role:** Fleet Lead evidence note.
> **Spine:** `9824a1a32aa889f0d76827fac5fac237a495ae72` (`work/fresh-base-spine` after merged PR #53). Confirmed with `git rev-parse` on `origin/work/fresh-base-spine`.
> **Ledger:** D51 amendment in `docs/DECISIONS-LEDGER.md`. No new decision id. D52 is unchanged.
> **Authority:** the Mac path below. This cloud workspace does not contain that checkout. Claims below are from the attached RPC record for the live Craft Electron. This note does not reconstruct results that record does not contain.
> **Capability:** `not implemented` for the clean v0.11 baseline. Nothing in this note is `usable`.
> **Gates:** W0.1 stays In Progress. W1 stays Locked. No wave is Ready.
> **Exit item 1:** stays open. The RPC results below do not close it. `typecheck:all` remains the #52 failure. The migration branch is still absent.
> **Binding exit list:** `docs/WAVE-MODULE-MAP.md` §3. This note does not check item 1 off.
> **Earlier notes:** `docs/audits/2026-10-10-w01-exit1-mac-checkout.md` and `docs/audits/2026-10-10-w01-exit1-electron-launch.md`.

## Authority path

Unchanged from #51, #52, and #53.

| Fact | Report |
|---|---|
| Path | `/Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-ai-agents--craft-agents-oss--f4e172bf372f` |
| HEAD | `f4e172bf372f4ccc7389a189be1e0b0541f96282` |
| Tag on that HEAD | exact `v0.11.0` |
| `package.json` version | `0.11.0` |
| Live process | `bun run electron:dev` Craft Electron, pid `71904`, from that checkout's `apps/electron` |
| AX window title for pid `71904` | `Craft Agents` |
| Distinct process | pid `4855` is `Fleet` / app `Fleet 项目审查`. It is not this Craft window |

## Method

Authenticated WebSocket RPC to the running Craft server at `ws://127.0.0.1:9100`, handshake `protocolVersion` `1.0`.

This pass is not AX GUI clicks for the Kanban board or the Settings panel. It is not a screencapture. The attached record says screencapture of the Craft window rect failed (could not create image from rect) and attributes that failure to TCC denial. System Events could not reliably manipulate the Craft window contents (window access `-1728`). CG bounds were available through a Swift helper. Those bounds are not a screenshot and are not a panel verification.

pid `4855` stays the separate Fleet app recorded in the #53 correction. This note does not assign the `Craft Agents` title to that pid.

## What the RPC recorded

| Call | Result in this pass |
|---|---|
| `projects:create` | Slug `exit1-loop-evidence-2026-10-10t14-07-27` on disk under `~/.craft-agent/workspaces/my-workspace/projects/`. This is a new project this pass. The existing `projects/project` directory does not count as this create |
| `sessions:sendMessage` | Accepted on session `260912-misty-tiger`. User message `msg-1791641248077-usni4x` persisted (user line in `session.jsonl`). Assistant reply `msg-1791641251704-leme9f`, content `pong` |
| `browser-pane:create` | Returned `browser-1` |
| `tasks:list` | Returned `0`. The channel is reachable. The board data is empty. This is not a Kanban board UI open |
| `settings:getServerStatus` | Reported `running: true` |
| `settings:getServerConfig` | Reported the server enabled and a port |
| `menu:openSettings` | `No handler for: menu:openSettings` (channel not registered on this server path) |

The settings RPC responses included a token. This note does not write that token.

`sessions:get` on the #53 relaunch already listed `260912-misty-tiger`. Restoring that session was not this turn. This turn is the `sessions:sendMessage` above. This pass does not supply a new SHA-256 for `session.jsonl`. The hashes in the launch note are the pre-turn snapshot.

`browser-pane:create` returning `browser-1` is the RPC result. This note does not add an AX click or a screenshot of the pane.

## What this pass does not verify

| Check | Result in this pass |
|---|---|
| Kanban board UI open | NOT verified. `tasks:list` returned `0` only |
| Settings panel UI | NOT verified. `menu:openSettings` has no handler on this path. No screenshot |
| `typecheck:all` | Still FAIL, as #52. Exit 2. This note does not invent a pass |
| Migration branch | Still ABSENT |
| `app/` | Not replaced |
| Exit item 1 | Still OPEN |
| W1 | Still Locked |
| Clean v0.11 baseline | Still `not implemented` |

## What is still required before Exit item 1 can close

On the same Mac path:

1. Open the Kanban board UI. `tasks:list` returning `0` does not open the board.
2. Verify the Settings panel UI. `settings:getServerStatus` and `settings:getServerConfig` do not open that panel. `menu:openSettings` is unregistered on this path, and there is no screenshot.
3. Keep `typecheck:all` honest. It is still the #52 failure until a later log records otherwise.
4. Only then open a migration branch whose base is this checkout. That branch is still absent. `app/` stays `0.10.5` on the Fleet tree.

## What this note does not do

- It does not close Exit item 1.
- It does not close Exit item 2. Fleet-old rows and the file-by-file `app/` diff stay deferred (D52).
- It does not mark W0.1 or W1 Ready.
- It does not promote M01, or any other module, to `usable`.
- It does not add an action id or bump `CONTRACT_VERSION`.
- It does not copy the Mac tree into this repository.
- It does not invent a `typecheck:all` pass or a restored `tsconfig.base.json`.
- It does not write the settings RPC token.
- It does not claim the Kanban board UI was opened, or that the Settings panel UI was verified.
- It does not treat pid `4855` (`Fleet 项目审查`) as Craft.
