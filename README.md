# Fleet / AI Work Workbench

The current mainline is **Fleet / AI Work Workbench**: a second-stage build on top of the
clean craft-agents-oss base, with verified assets extracted from the existing `app/`.

## Active Entry Points

| File | Purpose |
|---|---|
| `AGENTS.md` | Forced-read execution summary for all agents |
| `docs/START-HERE.md` | Read order and working status labels |
| `docs/PROJECT-DIRECTION.md` | Product direction, non-goals, and development spine |
| `docs/DECISIONS-LEDGER.md` | Promoted decisions and reversals |
| `docs/DEVELOPMENT-PROCESS.md` | How work moves from direction to agent execution |
| `docs/CLOUD-LOCAL-WORKFLOW.md` | GitHub/local sync rules and documentation-agent prompts |
| `docs/BOARD-SYNC.md` | Parallel-wave card format and sync points |
| `docs/README.md` | Full documentation index |

> **Product thesis:** Fleet is a local-first AI work creation platform. Humans own the top
> 10% of creative judgment and the bottom 10% of common-sense guardrails; agents execute the
> middle 80% of concrete production work. All professional surfaces share one project,
> Library, agents, permissions, session timeline, and cost ledger.

## Restart Route

1. Keep the current Craft base installable, typecheckable, and launchable; do not restore old forked UI.
2. Complete actor-identity extension, team state/routing, and Manager Agent boundary first.
3. Complete Files / Library to establish the shared local-asset foundation for all four professional surfaces.
4. Infinite canvas, AIGC, web/document, and video each use a native engine; human and agent share structured tools.
5. New UI grows only from Craft's existing mount points; only professional surfaces may add new pages.

## Markdown Scope

This repository contains a large volume of third-party Markdown that is **not** current
execution material:

- **Active execution:** `AGENTS.md`, `docs/START-HERE.md`, `docs/README.md`,
  `docs/PROJECT-DIRECTION.md`, `docs/DECISIONS-LEDGER.md`,
  `docs/CLOUD-LOCAL-WORKFLOW.md`, `docs/BOARD-SYNC.md`.
- **Own active docs:** files under `docs/` that are not in `docs/legacy/`.
- **Third-party / reference:** Craft-bundled docs inside `app/`, `源码参考/`, and
  `node_modules/` are read as index references only and do not override current decisions.

## Recommended Commands

```bash
./scripts/craft.sh install
./scripts/craft.sh run typecheck:all
./scripts/craft.sh run electron:dev
./scripts/fleet-verify.sh          # project verification entry point; report failures as blockers
```
