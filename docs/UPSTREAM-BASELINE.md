# Upstream Baseline and Migration Gate

> **Status:** blocking implementation migration  
> **Owner:** Lead  
> **Verified:** 2026-07-09; pin re-checked 2026-10-10 (D51); Mac source tree recorded 2026-10-10; non-frozen install finished and `typecheck:all` failed (exit 2) after #51; Electron launch and relaunch recorded 2026-10-10; RPC project create, session turn, and `browser-pane:create` recorded 2026-10-10; `route=board` and `route=settings` restores recorded 2026-10-10; migration branch `fleet/migration-from-v0.11.0` open 2026-10-10; adapt ports not started; `typecheck:all` still the #52 failure; Exit 3 parity note recorded 2026-10-10 and item 3 still open

## Canonical Upstream

Fleet's upstream base is Craft Agents OSS [`v0.11.0`](https://github.com/craft-ai-agents/craft-agents-oss/releases/tag/v0.11.0), published 2026-07-07. The tag ref object type is `commit` (a lightweight tag). It resolves to `f4e172bf372f4ccc7389a189be1e0b0541f96282`. The parent commit `c9d9a26fbefa3a5165ee9aa50cb30c25466afd81` is the `v0.10.5` commit. Public `v0.14.1` (2026-10-06) is a later release and is not this pin.

The current `app/package.json` declares `0.10.5`. The v0.11 projects, tasks, and Kanban directories are absent from `app/`. The current repository and Craft Agents upstream have unrelated Git histories, so a normal merge is unsafe and was correctly refused in an isolated worktree.

## Inspection on 2026-10-10

The pin was read through the public GitHub API. This cloud workspace does not contain a populated Craft checkout. `源码参考/software/craft-agents-oss` is an empty directory whose gitlink is the v0.10.5 parent, not `f4e172bf`. `源码参考/latest`, `源码参考/software/fleet-old`, and any AIGC reference checkout are absent. Peer gitlinks for AionUi, open-design, and rtk are also empty directories.

The behaviour ledger, the gaps, and the Mac acceptance checks are `docs/audits/2026-10-10-w01-v011-baseline-blk001.md` (D51, D52). That note does not close W0.1 and does not replace `app/`.

The Mac source tree at the same pin is `docs/audits/2026-10-10-w01-exit1-mac-checkout.md`. That path is the authority for the populated checkout. This cloud workspace still does not have it. Exit item 1 stays open.

Paths confirmed at `f4e172bf` from source comments and file presence. The project and task bullets are runtime layouts, not top-level directories of the source tree:

- projects at `{workspaceRootPath}/projects/{slug}/` with `assets/` and `MEMORY.md`
- tasks at `{workspaceRoot}/tasks/<slug>/task.yaml` plus `runs/<runId>/run-log.jsonl`
- sessions at `{workspaceRootPath}/sessions/{id}/session.jsonl`
- `CONFIG_DIR` at `~/.craft-agent/` unless `CRAFT_CONFIG_DIR` is set
- `apps/electron/src/main/browser-pane-manager.ts` and `apps/cli/package.json` exist
- upstream `packages/shared/src/protocol/` contains `channels.ts`, `dto.ts`, `events.ts`, `index.ts`, `routing.ts`, `types.ts`, and `__tests__`

A file-by-file diff against `app/` is still required before this gate opens. The Mac source tree does not supply that diff. `bun install --frozen-lockfile` failed on that tree because the lockfile had changes. After #51, non-frozen `bun install` finished and `node_modules` is present. That install mutated `bun.lock`; `git checkout -- bun.lock` restored the pin. Frozen install still fails. `bun run typecheck:all` failed with exit 2. The first hard error is `TS5083` for a missing `tsconfig.base.json`, and that file is absent from HEAD at this pin. No fix is recorded. After #52, `electron:dev` launch and relaunch are recorded in `docs/audits/2026-10-10-w01-exit1-electron-launch.md` from the Craft Electron logs only: the repaired launch initialized, created a window, the renderer client connected, quit (`QUIT_OK`), and relaunch initialized again. Corrected 2026-10-10: a System Events window titled `Fleet` was misattributed to Craft. Mac `ps` shows pid `4855` command is `Fleet 项目审查`, a separate local app. That AX title and the `Cmd+,` sent at that process are retracted. At that launch record, Kanban, a new project, an ordinary session turn, the Settings panel, and BrowserPane were not verified. After #53, `docs/audits/2026-10-10-w01-exit1-rpc-loop.md` records an authenticated WebSocket RPC on the live Craft Electron (pid `71904`, AX title `Craft Agents`, distinct from pid `4855`): `projects:create` wrote slug `exit1-loop-evidence-2026-10-10t14-07-27`, `sessions:sendMessage` on `260912-misty-tiger` returned assistant content `pong`, and `browser-pane:create` returned `browser-1`. `tasks:list` returned `0` and is not a Kanban board UI open. `settings:getServerStatus` reported `running: true` and `settings:getServerConfig` reported enabled and a port. The settings responses included a token; the token is not written here. `menu:openSettings` returned no handler, so the Settings panel UI was not verified in that RPC pass. After #54, `docs/audits/2026-10-10-w01-exit1-routes-migration.md` records two later `electron:dev` window-state restores on the same pin: `route=board` (log `Restoring window ... route=board`; AX title `Craft Agents`; sessions board navigator `routes.view.board()` → `board`) and `route=settings` (log `Restoring window ... route=settings`; window title stayed `Craft Agents`). Those are route restores. They are not an AX click on Kanban chrome and not `tasks:list`. `Cmd+,` and Craft Agents → 设置... were not verified because the frontmost menu bar stayed on pid `4855` `Fleet 项目审查` (also Electron, `com.github.Electron`). Migration branch `fleet/migration-from-v0.11.0` is open at `/Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-agents-oss--migration-from-v0.11.0`, HEAD `f4e172bf372f4ccc7389a189be1e0b0541f96282`, exact tag `v0.11.0`. The pin worktree is intact. Adapt row ports are not started. Fleet `app/` on the spine stays `0.10.5`. `typecheck:all` remains the #52 failure. That record does not open this gate.

## Required Migration Route

1. Treat a clean checkout of upstream `v0.11.0` as the next base, not as a patch to apply over the current tree.
2. Produce a path-by-path migration ledger for Fleet-only behaviour currently in `app/` and `源码参考/software/fleet-old`.
3. Port each accepted capability as an adapter or isolated feature on the clean base; do not copy an old shell wholesale.
4. Validate the complete baseline launch/typecheck before porting the first Fleet loop.
5. Only then replace the current `app/` baseline through a reviewed migration branch.

## Why This Gate Exists

The v0.11.0 difference includes upstream Projects, Tasks, Kanban, background-task surfaces, session/CLI changes, and dependency updates. The current tree also contains Fleet-specific protocol and Browser settings additions. A blind directory replacement would lose one side; a Git merge cannot provide conflict guidance because the histories are unrelated.

D52 classifies the inspected upstream Projects, Tasks, Kanban, background-task, and shell
panel surfaces as retain, and it refuses a second system under Fleet names. M16/M17 path freezes
still wait on a Docs judgment of the remaining UI and migration bullets, on adapt row ports, and on a `typecheck:all` result other than the #52 failure. `route=board` and `route=settings` restores and branch `fleet/migration-from-v0.11.0` are recorded in `docs/audits/2026-10-10-w01-exit1-routes-migration.md`. The Mac source tree, the recorded Electron launch, the RPC project create, session turn, and `browser-pane:create`, those route restores, and the opened branch do
not freeze those paths. Conductor-as-TeamRun stays deferred.

## Old Project Use

`源码参考/software/fleet-old` is described by earlier docs as an older Craft/Fleet-derived checkout (a v0.10.3-era upstream sync and a v0.10.4 manifest). The 2026-10-10 cloud tree has neither that directory nor a gitlink, so those version claims were not re-read from source. It remains a green-light **reference for selective Fleet behaviour only**, never a base to merge or copy wholesale. Each accepted migration must record source path, source commit, target v0.11.0 path, adaptation owner, license/attribution, and validation evidence. Until that checkout is inspected, fleet-old behaviour rows stay deferred (D52).

## W0.1 Exit Evidence

- 2026-10-10: the Mac source tree at the D51 pin is recorded. After #51, non-frozen `bun install` finished and `bun run typecheck:all` failed (exit 2). Detail: `docs/audits/2026-10-10-w01-exit1-mac-checkout.md`.
- 2026-10-10: Electron `electron:dev` launch and relaunch are recorded on that Mac path from the Craft logs only. The first attempt failed on an incomplete Electron dist. After the recorded unzip repair, the app initialized, quit, and relaunched. Existing `session.jsonl` hashes and `projects/project/config.json` were unchanged. Corrected the same day: the System Events title `Fleet` was pid `4855`, command `Fleet 项目审查`, not Craft. That title and the `Cmd+,` aimed at it are retracted. At that launch record, Kanban, a new project, an ordinary session turn, the Settings panel, and BrowserPane were not verified. `typecheck:all` remains the failed run (exit 2). At that launch record the migration branch was still absent. Exit item 1 stays open. The pin, the install, the failed typecheck, and this launch do not close it. Detail: `docs/audits/2026-10-10-w01-exit1-electron-launch.md`.
- 2026-10-10: an authenticated WebSocket RPC to the live `electron:dev` Craft Electron (pid `71904`, AX title `Craft Agents`) recorded `projects:create`, `sessions:sendMessage` (assistant content `pong`), and `browser-pane:create` (`browser-1`). `tasks:list` returned `0` and is not a Kanban board UI open. `settings:getServerStatus` reported `running: true`; `settings:getServerConfig` reported enabled and a port. The settings token is not written here. `menu:openSettings` returned no handler. Settings panel UI is not verified in that RPC pass. Screencapture did not produce an image. `typecheck:all` remains the #52 failure. At that RPC record the migration branch was still absent. `app/` is not replaced. Exit item 1 stays open. This RPC pass does not close it and does not mark `usable` or open W1. Detail: `docs/audits/2026-10-10-w01-exit1-rpc-loop.md`.
- 2026-10-10: after #54, `bun run electron:dev` restored window-state `route=board` (log `Restoring window ... route=board`; AX title `Craft Agents`; sessions board navigator `routes.view.board()` → `board`) and later `route=settings` (log `Restoring window ... route=settings`; window title stayed `Craft Agents`). Those are route restores. They are not an AX click on Kanban chrome and not `tasks:list`. `Cmd+,` and Craft Agents → 设置... were not verified: the frontmost menu bar stayed on pid `4855` `Fleet 项目审查` (also Electron, `com.github.Electron`). Branch `fleet/migration-from-v0.11.0` is open at `/Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-agents-oss--migration-from-v0.11.0`, HEAD `f4e172bf372f4ccc7389a189be1e0b0541f96282`, exact tag `v0.11.0`. The pin worktree is intact. Adapt row ports are not started. Fleet `app/` on the spine stays `0.10.5`. `typecheck:all` remains the #52 failure. Exit item 1 stays open. Docs decides whether the route restores and this branch open meet the remaining UI and migration bullets. This bullet does not mark `usable` or open W1. Detail: `docs/audits/2026-10-10-w01-exit1-routes-migration.md`.
- 2026-10-10: Exit item 3 parity is recorded in `docs/audits/2026-10-10-w01-exit3-canonical-parity.md`. Action ids and the v1.3.0 policy table are frozen (D47–D49). AgentSeat projection, caller provenance, idempotency, revisions, typed event payloads, and HostTurnKernel admission on the v0.11 tree are partial. `CONTRACT_VERSION` stays `1.3.0`. No action id is added. Exit item 3 stays open. Exit item 1 stays open. This bullet does not mark `usable` or open W1.
- Clean baseline validation on that branch is still required: a `typecheck:all` result other than the #52 failure, adapt row ports, and a reviewed replacement of `app/`.
- A Fleet migration ledger classifies every current `app/` difference as retain/adapt/drop/defer.
- The same ledger records which upstream project/task/background/panel behaviours are reused by
  M04/M16/M17 and which are intentionally excluded.
- The contract re-freeze records the version implemented on that new baseline. The Exit 3 note records today's gaps and does not supply that version. `CONTRACT_VERSION` stays `1.3.0`.
- Only then may W1 implementation packets be issued.
