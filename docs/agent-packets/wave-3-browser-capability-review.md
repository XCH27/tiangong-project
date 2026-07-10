# Wave 3 Browser Capability Review

> **Superseded 2026-07-09. Do not assign or implement from this packet.** Its module/wave
> assignments predate the M14/M15 split and the W3/W4 gates.

## Wave

Wave 3. Runs after the spine, runtime, files, and TeamRun loops are stable.

## Module Sections Covered

- `06-browser-artifact-workflow`
- `10-memory-context-review`
- `12-capability-skill-plugin-system`
- `14-messaging`

## Goal

Build governed work surfaces and capability management without creating separate centers for every tool.

## Allowed Files

Assigned domains:

- BrowserPane selection/annotation components
- evidence/review services
- context/review panels
- capability catalog/loadout services and settings pages
- messaging gateway/settings files when assigned

## Forbidden Files

- shared protocols unless Lead freezes changes first
- shell layout
- unassigned settings IA
- unapproved third-party source code

## Frozen Contracts Consumed

- `internal-action.ts`
- `capability.ts`
- `memory.ts`
- `usage.ts`
- `external-job.ts`
- browser/artifact selection contracts when frozen

## Interfaces Produced

- evidence package
- review report
- capability loadout resolution
- scoped tool table for an agent
- governed messaging route

## UI Placement

Browser work stays on BrowserPane/artifact surfaces. Context/review is one center. Capability/skills live in settings/capability area. Messaging lives under integrations/capabilities.

## Permission / Timeline Requirements

External upload, install/update, plugin enablement, account changes, and messaging sends require permission by risk. Real/estimated/unknown cost labels remain separate.

## Validation Ladder

1. targeted service tests
2. UI smoke for assigned surface
3. evidence/timeline verification
4. sidecar/provider behavior checked with safe fixture or dry run

## Completion Report Template

```text
Wave 3 report:
- Worker:
- Worktree / branch / commit:
- Module slice:
- Files changed:
- Forbidden files not touched:
- Validation:
- Evidence/timeline checked:
- Final status:
- Remaining blockers:
```

## Board Cards

Use the card format defined in `docs/BOARD-SYNC.md`. Append one card per claimed slice below
this section as work is claimed.
