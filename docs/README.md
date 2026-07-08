# Fleet Documentation

Active documentation is now English-only.

## Active Docs

| File | Purpose |
|---|---|
| `START-HERE.md` | Entry point, read order, and working status labels |
| `PROJECT-DIRECTION.md` | Product direction, non-goals, architecture direction, and development spine |
| `DECISIONS-LEDGER.md` | Final promoted decisions from the legacy corpus |
| `DEVELOPMENT-PROCESS.md` | How project work moves from direction to module specs to agent execution |
| `CLOUD-LOCAL-WORKFLOW.md` | GitHub/local sync rules, branch flow, and documentation-agent prompts |
| `PARALLEL-AGENT-OPERATING-MODEL.md` | Lead/worker rules for conflict-free multi-agent development |
| `OWNERSHIP-MATRIX.md` | Module by package ownership and frozen contract boundaries |
| `WAVE-MODULE-MAP.md` | Which modules are built in which waves and why |
| `REFERENCE-PROJECT-POLICY.md` | Green-light source projects, black-box references, and license boundaries |
| `BOARD-SYNC.md` | Card format and sync points for tracking parallel wave/module progress |

The repository-level `AGENTS.md` is a short forced-read execution summary that points back
to these active documents. It must not grow into a second roadmap.

## Work Package Docs

| Folder | Purpose |
|---|---|
| `docs/modules/` | One closed-loop specification per product module |
| `docs/agent-packets/` | Wave-level execution packets for parallel agents |

## Legacy Docs

To minimize token cost and prevent search/context pollution, all legacy Chinese planning documents, blueprints, and implementation plans have been zipped into `docs/legacy/legacy-corpus.zip`.

| File | Purpose |
|---|---|
| `docs/legacy/LEGACY-INDEX.md` | Full catalog index of all zipped legacy files with original sizes and titles |
| `docs/legacy/LEGACY-LESSONS.md` | Extracted high-value architectural lessons and engineering guidelines from the legacy files |

Legacy docs are historical material. If a legacy decision is still valid, promote it into a small English active document instead of editing the old files.
