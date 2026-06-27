# 09 · Craft Base Prep

Fleet now uses `app/` as a direct copy of `源码参考/software/craft-agents-oss`.

## Baseline

- Source: `https://github.com/craft-ai-agents/craft-agents-oss`
- Copied commit: `a512da7`
- License: Apache-2.0
- Required attribution files kept in `app/`: `LICENSE`, `NOTICE`

## Local Tooling

- Node: `v22.22.2`
- npm: `10.9.7`
- Bun is not installed globally in this environment.
- Bun is currently invoked through `npm exec --yes bun -- ...`.

## Prepared State

- Old custom Fleet `app/` implementation was removed.
- `app/` is now the craft monorepo.
- Dependencies were installed with:

```bash
npm exec --yes bun -- install
```

- Local placeholder env file created at `app/.env`; it contains no secrets.
- Added `app/tsconfig.base.json` because several craft packages extend it.
- Fixed three `packages/pi-agent-server` strict-null checks required by `noUncheckedIndexedAccess`.
- Added `scripts/craft.sh` so this machine can run craft commands without globally installing Bun.

## Verification

Passed:

```bash
./scripts/craft.sh run typecheck:all
./scripts/craft.sh run electron:build
```

Known environment note:

- `bun` is still not installed globally; use `./scripts/craft.sh ...` or install Bun globally later.

## Upstream Sync (oss:sync)

Fleet keeps a **soft fork** of craft-agents-oss in `app/`. Upstream changes are merged with three-way merge; Fleet-only changes (team spine, terminal PTY, memory, etc.) are preserved.

State file: `app/.oss-sync-state.json` (tracks `baselineCommit` + `lastSyncedCommit`).

Upstream source (local mirror): `../源码参考/software/craft-agents-oss`

```bash
# Preview pending upstream changes
./scripts/craft.sh run oss:sync -- --status

# Semantic impact report before merging
./scripts/craft.sh run oss:sync -- --review

# Sync to upstream HEAD (or a tag/commit)
./scripts/craft.sh run oss:sync -- --fetch
./scripts/craft.sh run oss:sync

# After resolving merge conflicts manually
./scripts/craft.sh run oss:sync -- --finalize --target <commit-or-tag>

# Dry-run file list only
./scripts/craft.sh run oss:sync -- --dry-run
```

After sync, run `./scripts/craft.sh run typecheck:all` and targeted tests.

Current sync state:

- Baseline: `a512da7` (initial Fleet copy)
- Last synced: `556c59a` (craft-agents-oss v0.10.4 — Pi SDK 0.79.9 / GLM-5 / config backup / title language fix)

See `docs/07-难点清单与更新韧性.md` Part 2 for the architecture rationale (adapter layer + soft fork).

## Fleet 自动化验证（validate:fleet）

一键跑当前主线可机器验收项（类型、i18n、脊柱单测、oss-sync 状态、Internal Action 注册表、publish 配置）：

```bash
./scripts/fleet-verify.sh
# 或
./scripts/craft.sh run validate:fleet
# 快速（跳过 test:shared + spine 单测）
./scripts/craft.sh run validate:fleet:fast
```

**不替代**：A2 视觉验收、A3 真实 CLI smoke、Phase C/D 创作面（见 `docs/32 §8.2` / `§8.4`）。

## Fleet 发行与自动更新（B6）

- 配置：`packages/shared/src/fleet-publish.ts`（`FLEET_ELECTRON_UPDATE_URL`）
- 打包：

```bash
export FLEET_ELECTRON_UPDATE_URL=https://your-cdn.example.com/fleet/electron/latest
./scripts/craft.sh run electron:dist:mac:fleet
```

未设置 `FLEET_ELECTRON_UPDATE_URL` 时仍用 craft 官方源（开发对照）；**给用户推 Fleet 版必须设自有 URL**。

