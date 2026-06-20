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

## Working Rule

Do not rebuild the desktop shell from scratch. Modify craft modules in place, and only bring in AionUi code when a requested feature needs AionUi's Apache-2.0 chat, Agent, ACP, or Skill behavior.
