# AGENTS.md

This file is the forced-read execution summary for agents working in this repository.
It is not an independent roadmap and must not define a second source of truth.

Active project documentation is English-only. The old Chinese documents are archived under
`docs/legacy/` and are historical evidence, not execution instructions.

## Read First

Use this order before changing product code or project documentation:

1. `docs/START-HERE.md`
2. `docs/AGENT-ENTRY-MAP.md`
3. `docs/PROJECT-DIRECTION.md`
4. `docs/DECISIONS-LEDGER.md`
5. `docs/DEVELOPMENT-PROCESS.md`
6. `docs/CLOUD-LOCAL-WORKFLOW.md`
7. `docs/PARALLEL-AGENT-OPERATING-MODEL.md`
8. `docs/OWNERSHIP-MATRIX.md`
9. `docs/WAVE-MODULE-MAP.md`
10. `docs/REFERENCE-PROJECT-POLICY.md`
11. The relevant module spec in `docs/modules/`
12. The relevant wave packet in `docs/agent-packets/` when working as a parallel agent
13. The current Craft-based implementation under `app/`

Read `docs/legacy/` only to verify historical rationale or recover a missing decision.
If a legacy document conflicts with an active English document, follow the active English
document and update the active doc if it is incomplete.

## Product Direction

Fleet is a local-first AI work creation platform built on the Craft Agents base.
It is not a chat app, terminal wrapper, IDE clone, Figma clone, or account/subscription product.
Humans own the top 10% of creative judgment and the bottom 10% of common-sense guardrails;
agents execute the middle 80% of concrete production work.

The shared product spine is:

- Craft session, permission, timeline, actor identity, and replay.
- Internal Action Registry for both human UI actions and agent actions.
- RuntimeLane and TeamRun for API, CLI, and cross-agent execution.
- Workspace files, Library assets, leases, provenance, and export records.
- Local memory, context packaging, external review, routing decisions, and cost ledger.

Professional surfaces may use native engines, but they must share this spine.
Do not create a second session store, permission system, memory store, team store,
timeline, Library, or settings truth.

## Non-Negotiable Rules

- Build on the clean Craft Agents base in `app/`; keep Craft's shell and simplify it instead
  of replacing it with a new default shell.
- Complete coherent user-visible loops. Cover interface, core logic, state or persistence,
  permissions, timeline evidence, error handling, and status wording before validating.
- Status must be reported as `usable`, `wired but not visually checked`, `display-only`,
  or `not implemented`. Passing tests is not a feature status.
- Human UI and agent tools must use the same structured action path.
- CLI, terminal, Git, desktop automation, local files, and browser operations must go through
  permission and replayable timeline evidence when they mutate state or launch real work.
- Fleet owns the team; a CLI owns one run. Do not mix terminal UI, CLI Runtime identity,
  Fleet Bridge, and TeamRun into one ambiguous concept.
- Manager Agent and project Agents are separate identities. Manager Agent is not a privileged
  backdoor and does not bypass permission.
- `@` addresses people, agents, sessions, and roles. `/` addresses skills, commands, and templates.
- Browser automation extends the Craft BrowserPane, Electron CDP, and browser tool path.
  Do not add stealth, anti-detection, quota bypass, cookie extraction, or terms-of-service bypass
  behavior.
- External AI review, web profiles, and account handling must use user-authorized normal paths.
- Model routing, cache, and Fusion apply only to API/OAuth lanes. CLI Runtime lanes use the CLI's
  own runtime and model behavior.
- Memory is local, partitioned, inspectable, deletable, and permissioned.
- New source-code copying is allowed only from green-light sources listed in
  `docs/REFERENCE-PROJECT-POLICY.md`. Permissive licenses alone are not approval.

## Parallel Development

Parallel work is Lead-controlled.

- GitHub is the integration source of truth. Agents work on task branches and open PRs into
  `work/fresh-base-spine`; they do not push directly to integration branches.
- Wave 0 freezes shared contracts before worker agents start.
- Shared contract files are owned by the Lead and are read-only for parallel workers after freeze.
- Each file has exactly one owner during a wave.
- Each worker uses an isolated worktree and branch.
- Workers must stay inside their assigned module and packet boundaries.
- New channels, events, DTOs, commands, i18n keys, shared types, and handler registrations go
  through the Lead.
- A worker handoff must report worktree, branch, commit, changed files, forbidden files not touched,
  validation performed, and remaining `not implemented` items.

Use `docs/OWNERSHIP-MATRIX.md`, `docs/WAVE-MODULE-MAP.md`, and the packet under
`docs/agent-packets/` as the binding ownership rules.

## Validation Rhythm

Do not micro-test after every small edit. Finish a coherent feature or documentation block, then run
the cheapest useful checks:

1. Static analysis or format checks for touched areas.
2. Targeted tests for the changed behavior.
3. Real behavior checks for user-facing or externally observable flows.

If the same validation path fails twice, stop blind edits and report the exact blocker, likely cause,
and smallest next decision needed.

## Common Entrypoints

- Electron app: `app/apps/electron`
- Renderer: `app/apps/electron/src/renderer`
- Main process: `app/apps/electron/src/main`
- Shared/session/tool packages: `app/packages/*`
- Build scripts: `app/package.json`

Recommended commands from the repository root:

```bash
./scripts/craft.sh install
./scripts/craft.sh run typecheck:all
./scripts/fleet-verify.sh
./scripts/cli-subagents.sh --help
./scripts/craft.sh run electron:dev
```

If Bun is already installed globally, equivalent `bun run ...` commands may be run inside `app/`.
