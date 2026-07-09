# Wave 2 TeamRun Routing

## Wave

Wave 2. Runs after Wave 1 backbone loops are stable enough to depend on.

## Module Sections Covered

- `04-runtime-lanes-teamrun`
- routing sections of `11-model-routing-cost-ledger`
- Bridge-facing pieces of `02-terminal-cli-runtime`

## Goal

Prove the core D19 loop: Fleet owns the team, CLI owns one run, API members execute bounded TeamRuns, and reports come back through Fleet.

## Allowed Files

Assigned domains:

- TeamRun coordinator implementation files
- session-mcp-server Bridge tools
- runtime launcher Bridge injection files
- team UI cards/member drawer assigned by Lead
- routing decision services assigned by Lead

## Forbidden Files

- `team-run.ts` and shared protocols unless Lead updates first
- broad session manager refactors
- shell layout
- unassigned i18n files

## Frozen Contracts Consumed

- `team-run.ts`
- `team.ts`
- `cli-runtime.ts`
- `subscription.ts`
- `internal-action.ts`

## Interfaces Produced

- Bridge start/report loop
- TeamRun status transitions
- compressed RunReport
- structured failure codes
- lane recommendation basis

## UI Placement

TeamRun appears as cards in existing team/session timeline. Member details go to one member drawer. No new team dashboard.

## Permission / Timeline Requirements

Attribution chain must be visible. L2/L3 actions do not execute through Bridge without permission. Lease conflicts become blocked statuses, not silent retries.

## Validation Ladder

1. coordinator tests
2. session-mcp-server tool tests
3. one Bridge smoke with fake or controlled runtime
4. UI card smoke when assigned

## Completion Report Template

```text
Wave 2 report:
- Worker:
- Worktree / branch / commit:
- TeamRun path proven:
- Files changed:
- Forbidden files not touched:
- Validation:
- Runtime used for smoke:
- Final status:
- Remaining blockers:
```

## Board Cards

Use the card format defined in `docs/BOARD-SYNC.md`. Append one card per claimed slice below
this section as work is claimed.
