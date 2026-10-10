# W0.1 Exit 1 — Mac populated source tree

> **Date:** 2026-10-10
> **Role:** Fleet Lead evidence note.
> **Spine:** `b9b60dfa` (`work/fresh-base-spine` after merged PR #50).
> **Ledger:** D51 follow-up in `docs/DECISIONS-LEDGER.md`. D52 is unchanged.
> **Authority:** the Mac path below. This cloud workspace does not contain that checkout. A public listing of the same SHA is corroboration of directory names only.
> **Capability:** `not implemented` for the clean v0.11 baseline. Nothing in this note is `usable`.
> **Gates:** W0.1 stays In Progress and Locked for workers. W1 stays Locked. No wave is Ready.
> **Exit item 1:** stays open. The D51 pin does not close it. This source tree does not close it. The desktop loop is not yet run.
> **Binding exit list:** `docs/WAVE-MODULE-MAP.md` §3. This note does not check item 1 off.

## What was reported from the Mac

Populated worktree on Vella's Mac:

| Fact | Report |
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
| `bun install` (not frozen) | started on the Mac; this note cannot confirm that it finished |
| Typecheck | not yet run |
| Electron launch | not yet run |
| Project, task, session turn, settings, BrowserPane, restart | not yet run |

Exit code and stderr for the frozen install were not supplied. This note does not invent them. This note does not invent a finished non-frozen install.

HEAD matches D51. The package version matches the pin. The source tree is populated. That is the new evidence.

## What the README block actually lists

At tag `v0.11.0` (`f4e172bf`), README line 492 is the configuration heading. The block through line 509 stores configuration at `~/.craft-agent/` and names `config.json`, `credentials.enc`, `preferences.json`, `theme.json`, and `workspaces/{id}/` with `config.json`, `theme.json`, `automations.json`, `sessions/`, `sources/`, `skills/`, and `statuses/`.

That block does not print `projects/` or `tasks/`. The Mac report identifies project and task directories as runtime data under `~/.craft-agent/`, and identifies them as absent from the source tree. This note records that report. It does not claim those runtime folders were listed on disk, because the desktop app has not been launched.

The storage paths already recorded in `docs/UPSTREAM-BASELINE.md` (`{workspaceRootPath}/projects/{slug}/`, `{workspaceRoot}/tasks/<slug>/`) come from source comments in `storage.ts`. They are not top-level directories of this checkout.

The README architecture diagram (about lines 350–360) draws `apps/cli`, `apps/electron`, `packages/core`, and `packages/shared` only. The Mac listing above is the fuller source-tree inventory.

## Cloud versus Mac

This cloud workspace still has no copy of the path above. `源码参考/software/craft-agents-oss` on the Fleet tree remains the empty gitlink at the v0.10.5 parent. `app/package.json` remains `0.10.5`.

A public directory listing of `craft-ai-agents/craft-agents-oss` at `f4e172bf372f4ccc7389a189be1e0b0541f96282` shows the same `apps/` and `packages/` names, the same `package.json` version `0.11.0`, and no top-level `projects/` or `tasks/`. That listing agrees with the Mac report. It is not a populated checkout on this machine. The Mac path is the authority for HEAD, the exact tag on that worktree, and the install attempt.

## Install state

| Command | State |
|---|---|
| `bun install --frozen-lockfile` | Failed. The lockfile had changes under frozen mode. |
| `bun install` | Started. Finish is not confirmed. A running install is not a completed install. |

Frozen mode is not the command that closes the install step. The documented install in that tag's README ("Build from Source") is `bun install`.

## Commands that still have to be recorded

Run these in the Mac worktree. Record the exit code and the visible result. Until those results are written down, Exit item 1 stays open.

```bash
cd "/Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-ai-agents--craft-agents-oss--f4e172bf372f"
bun install
bun run typecheck:all
bun run electron:dev
```

`bun run typecheck` on this tag runs only `typecheck:shared`. The README "Type checking" command is `bun run typecheck:all`.

`bun run electron:dev` is the README hot-reload launch. `bun run electron:start` is the README build-and-run launch (`electron:build`, then `electron apps/electron`). Either launch counts only after its result is recorded. Neither has been run.

If `bun install` is still running, wait for it to exit and record that code before typecheck or Electron.

After a recorded launch, the acceptance already written in `docs/audits/2026-10-10-w01-v011-baseline-blk001.md` is still required, and it is not yet run:

1. Create or open a workspace, create a project, open the Kanban board, send one ordinary session turn, open settings and BrowserPane, quit, relaunch, and confirm `sessions/{id}/session.jsonl` and `projects/{slug}/` are still there.
2. Only then open a migration branch whose base is that checkout. Port accepted adapt rows one at a time.

A recorded install, typecheck, and launch without that loop still leaves Exit item 1 open. The migration branch is still absent. `app/` is not replaced.

## What this note does not do

- It does not close Exit item 1.
- It does not close Exit item 2. Fleet-old rows and the file-by-file `app/` diff stay deferred (D52).
- It does not mark W0.1 or W1 Ready.
- It does not promote M01, or any other module, to `usable`.
- It does not add an action id or bump `CONTRACT_VERSION`.
- It does not copy the Mac tree into this repository.
