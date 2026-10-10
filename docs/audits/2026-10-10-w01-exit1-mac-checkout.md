# W0.1 Exit 1 — Mac populated source tree

> **Date:** 2026-10-10
> **Role:** Fleet Lead evidence note.
> **Spine:** `8cd1365d` (`work/fresh-base-spine` after merged PR #51). The #51 body was written against `b9b60dfa`.
> **Ledger:** D51 follow-up in `docs/DECISIONS-LEDGER.md`. D52 is unchanged.
> **Authority:** the Mac path below. This cloud workspace does not contain that checkout. A public listing of the same SHA is corroboration of directory names only.
> **Capability:** `not implemented` for the clean v0.11 baseline. Nothing in this note is `usable`.
> **Gates:** W0.1 stays In Progress and Locked for workers. W1 stays Locked. No wave is Ready.
> **Exit item 1:** stays open. The D51 pin does not close it. The source tree does not close it. A finished non-frozen install does not close it. A failed typecheck does not close it. The desktop loop is not yet run.
> **Binding exit list:** `docs/WAVE-MODULE-MAP.md` §3. This note does not check item 1 off.

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
| Electron launch | Not run. |
| Project, Kanban, session turn, settings, BrowserPane, restart | Not run. |
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
| Electron launch | not yet run |
| Project, task, session turn, settings, BrowserPane, restart | not yet run |

Exit code and stderr for the frozen install were not supplied. This note does not invent them.

HEAD matches D51. The package version matches the pin. The source tree is populated.

## What the README block actually lists

At tag `v0.11.0` (`f4e172bf`), README line 492 is the configuration heading. The block through line 509 stores configuration at `~/.craft-agent/` and names `config.json`, `credentials.enc`, `preferences.json`, `theme.json`, and `workspaces/{id}/` with `config.json`, `theme.json`, `automations.json`, `sessions/`, `sources/`, `skills/`, and `statuses/`.

That block does not print `projects/` or `tasks/`. The Mac report identifies project and task directories as runtime data under `~/.craft-agent/`, and identifies them as absent from the source tree. This note records that report. It does not claim those runtime folders were listed on disk, because the desktop app has not been launched.

The storage paths already recorded in `docs/UPSTREAM-BASELINE.md` (`{workspaceRootPath}/projects/{slug}/`, `{workspaceRoot}/tasks/<slug>/`) come from source comments in `storage.ts`. They are not top-level directories of this checkout.

The README architecture diagram (about lines 350–360) draws `apps/cli`, `apps/electron`, `packages/core`, and `packages/shared` only. The Mac listing above is the fuller source-tree inventory.

## Cloud versus Mac

This cloud workspace still has no copy of the path above. `源码参考/software/craft-agents-oss` on the Fleet tree remains the empty gitlink at the v0.10.5 parent. `app/package.json` remains `0.10.5`.

A public directory listing of `craft-ai-agents/craft-agents-oss` at `f4e172bf372f4ccc7389a189be1e0b0541f96282` shows the same `apps/` and `packages/` names, the same `package.json` version `0.11.0`, and no top-level `projects/` or `tasks/`. That listing agrees with the Mac report. It is not a populated checkout on this machine. The Mac path is the authority for HEAD, the exact tag on that worktree, the finished non-frozen install, and the typecheck failure.

## Install and typecheck state

| Command | State |
|---|---|
| `bun install --frozen-lockfile` | Failed. The lockfile had changes under frozen mode. Still failed after #51. Exit code and stderr were not supplied. |
| `bun install` | Finished. `node_modules` is present. The command mutated `bun.lock`. `git checkout -- bun.lock` restored the lockfile, so the reference worktree matches the pin. Restoring the lockfile does not make frozen install succeed. |
| `bun run typecheck:all` | Failed. Exit 2. First hard error: `TS5083: Cannot read file '.../tsconfig.base.json'`. `tsconfig.base.json` is not in HEAD at this pin. |

Frozen mode is not the command that closes the install step. The documented install in that tag's README ("Build from Source") is `bun install`. That command finished. The documented typecheck command is `bun run typecheck:all`. That command failed. `bun run typecheck` on this tag runs only `typecheck:shared` and was not the command reported.

## Commands that still have to be recorded

Install and `typecheck:all` are recorded. Typecheck failed, so it does not satisfy the baseline typecheck gate, and this note does not prescribe a repair.

Run the remaining close commands in the Mac worktree. Record the exit code and the visible result. Until those results are written down, Exit item 1 stays open.

```bash
cd "/Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-ai-agents--craft-agents-oss--f4e172bf372f"
bun run electron:dev
```

`bun run electron:dev` is the README hot-reload launch. `bun run electron:start` is the README build-and-run launch (`electron:build`, then `electron apps/electron`). Either launch counts only after its result is recorded. Neither has been run.

After a recorded launch, the acceptance already written in `docs/audits/2026-10-10-w01-v011-baseline-blk001.md` is still required, and it is not yet run:

1. Create or open a workspace, create a project, open the Kanban board, send one ordinary session turn, open settings and BrowserPane, quit, relaunch, and confirm `sessions/{id}/session.jsonl` and `projects/{slug}/` are still there.
2. Only then open a migration branch whose base is that checkout. Port accepted adapt rows one at a time.

A recorded install, a failed typecheck, and a later launch without that loop still leave Exit item 1 open. The migration branch is still absent. `app/` is not replaced.

## What this note does not do

- It does not close Exit item 1.
- It does not close Exit item 2. Fleet-old rows and the file-by-file `app/` diff stay deferred (D52).
- It does not mark W0.1 or W1 Ready.
- It does not promote M01, or any other module, to `usable`.
- It does not add an action id or bump `CONTRACT_VERSION`.
- It does not copy the Mac tree into this repository.
- It does not invent a typecheck fix, a restored `tsconfig.base.json`, or a successful Electron launch.
