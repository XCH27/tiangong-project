# Wave 0 Contract Freeze

## Wave

Wave 0. Lead-only.

## Module Sections Covered

- `00-platform-spine`
- `01-clean-craft-baseline`
- contract sections of all downstream modules

## Goal

Freeze shared contracts, clean the active doc surface, and classify current code before any parallel worker starts implementation.

## Allowed Files

Lead may modify:

- `docs/*.md`
- `docs/modules/*.md`
- `docs/agent-packets/*.md`
- `app/packages/shared/src/protocol/*.ts`
- handler registration files
- transport/channel maps
- settings registry structure
- i18n locale files

## Forbidden Files

Parallel workers have no write rights in this wave. Lead must not mix unrelated product implementation with contract freeze.

## Frozen Contracts Consumed

None. This wave creates or confirms them.

## Interfaces Produced

- module specs
- ownership matrix
- wave map
- final shared protocol shape for the next wave
- handler shells when needed

## UI Placement

Only document UI placement. Do not implement new UI.

## Permission / Timeline Requirements

No runtime product behavior should be added here. If a shared protocol includes permission/timeline fields, document the intended source of truth.

## Validation Ladder

1. `git diff --check -- docs app/packages/shared/src/protocol`
2. targeted shared typecheck if protocol files change
3. `rg` for stale active-doc references to legacy roadmap paths

## Completion Report Template

```text
Wave 0 report:
- Contracts frozen:
- Docs created/updated:
- Shared files touched:
- Handler shells created:
- Forbidden implementation avoided:
- Validation:
- Remaining blockers:
```

## Board Cards

Use the card format defined in `docs/BOARD-SYNC.md`. Append one card per claimed slice below
this section as work is claimed.
