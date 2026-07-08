# Parallel Agent Operating Model

This document defines how multiple agents can develop Fleet without corrupting shared contracts, duplicating UI, or creating second truth systems.

## Core Rule

Parallelism begins after the Lead freezes contracts and file ownership.

GitHub is the integration source of truth. Each agent works on a dedicated branch and opens
a pull request into `work/fresh-base-spine`. Agents do not push directly to `main` or
`work/fresh-base-spine`.

No worker agent may independently modify shared protocol files, handler registration, channel maps, global i18n files, session storage contracts, or cross-module DTOs.

## Roles

| Role | Responsibility |
|---|---|
| Lead | Reads direction and decisions, freezes contracts, owns shared files, writes module specs and agent packets, reviews diffs. |
| Module Agent | Implements a bounded module slice from an agent packet. |
| UI Agent | Implements UI only after the Lead has fixed placement, interaction, and ownership. |
| Backend Agent | Implements services/handlers only inside its assigned file domain. |
| Verification Agent | Runs targeted checks and real behavior validation without changing product code unless assigned. |

## Pre-Flight Gate

Before any agent edits files, it must answer:

1. Which module spec owns this work?
2. Which wave packet assigns this work?
3. Which files may I edit?
4. Which files are forbidden?
5. Which shared contracts do I depend on?
6. Does the work create another session, permission, timeline, memory, skill, or UI truth?
7. Which Internal Action or Agent callable path makes the UI agent-native?
8. What exact behavior proves the slice is `usable`?

If any answer is missing, the agent stops and returns to the Lead.

## Frozen Contract Files

The following are Lead-owned unless a packet explicitly says otherwise:

- `app/packages/shared/src/protocol/*.ts`
- `app/packages/shared/src/protocol/index.ts`
- `app/packages/shared/src/protocol/dto.ts`
- `app/packages/shared/src/protocol/channels.ts`
- Electron channel maps and preload transport files
- RPC handler registries
- global i18n locale JSON files
- session persistence fields
- permission profile schema
- shared settings registry structure

Workers can read these files. They cannot modify them.

## Worktree Rule

Each parallel agent works in an isolated branch or worktree. The final report must include:

- worktree path
- branch
- commit
- files changed
- forbidden files not touched
- validation commands
- real behavior evidence or reason it remains unverified
- final status label

No report without these fields counts as complete.

## Task Packet Shape

Every `docs/agent-packets/*.md` file must include:

1. Scope and module sections covered.
2. Allowed files.
3. Forbidden files.
4. Frozen contracts used.
5. Interfaces consumed.
6. Interfaces produced.
7. UI placement if any.
8. Permission/timeline requirements.
9. Validation ladder.
10. Completion report template.
11. Board Cards tracking section using `docs/BOARD-SYNC.md`.

## Board Sync Rule

The board is a lightweight synchronization layer, not a second project-management truth.
It tracks claim, blocker, handoff, and Lead close facts for a slice already defined by a module
spec and wave packet.

Before claiming work, a worker must read `docs/BOARD-SYNC.md` and append or update exactly one
card in the relevant packet's `## Board Cards` section. The card must use the exact fields from
that document. Missing fields, renamed fields, or a card claiming an entire module that spans
multiple waves are invalid.

The Lead reviews board cards against `docs/OWNERSHIP-MATRIX.md` and
`docs/WAVE-MODULE-MAP.md`. If the card conflicts with either document, the packet and ownership
docs win.

## UI Rule

Parallel agents do not decide where new UI goes.

The Lead defines UI placement and interaction before backend work is split. This prevents every backend feature from adding its own settings page, toolbar, or panel.

## Agent-Native Rule

A writable feature is incomplete unless both paths exist:

- Human UI path.
- Agent/internal action path.

Both must reach the same backend behavior, permission decision, timeline event, and rollback/evidence model.

## Failure Rule

If an implementation discovers the module spec is wrong, the worker does not improvise a new architecture. It reports:

- the conflicting spec statement
- the code fact
- the smallest contract change needed
- whether the current slice is blocked or can continue within existing contracts
