# Wave 1 Runtime Files Quota

## Wave

Wave 1. Parallel workers allowed after Wave 0.

## Module Sections Covered

- `02-terminal-cli-runtime`
- `05-files-library-leases`
- `11-model-routing-cost-ledger` quota/usage sections

## Goal

Create user-visible backbone loops for terminal/runtime, files/leases, and quota/usage without touching shared contracts directly.

## Allowed Files

Assigned workers may edit their own service/component files named in their task handoff.

Typical domains:

- runtime services and terminal renderer components
- file services and Files/Library components
- quota adapters and token/context UI components

## Forbidden Files

- shared protocol files unless Lead changed them first
- handler registries unless Lead created shell and assigned file
- global i18n files unless packet explicitly owns keys through Lead
- session core unless assigned

## Frozen Contracts Consumed

- `cli-runtime.ts`
- `subscription.ts`
- `usage.ts`
- `internal-action.ts`
- lease fields in TeamRun/internal action contracts

## Interfaces Produced

- runtime launcher diagnostics
- visible terminal transcript path
- lease conflict status path
- quota snapshot adapter output

## UI Placement

Terminal is a content surface. Files remain in workspace files/Library areas. Quota appears in token/context details and settings section assigned by Lead.

## Permission / Timeline Requirements

Runtime launch and file writes require permission by risk. Usage/quota refresh is read-only unless it changes credentials or config.

## Validation Ladder

1. targeted typecheck for touched packages
2. runtime/file/quota unit tests
3. real UI smoke for assigned visible path
4. opt-in CLI smoke only when real CLI is available

## Completion Report Template

```text
Wave 1 report:
- Worker:
- Worktree / branch / commit:
- Module slice:
- Files changed:
- Forbidden files not touched:
- Validation:
- Real behavior checked:
- Final status:
- Remaining blockers:
```

## Board Cards

Use the card format defined in `docs/BOARD-SYNC.md`. Append one card per claimed slice below
this section as work is claimed.
