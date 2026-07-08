# 02 Terminal CLI Runtime

## 1. Mission

Make local CLI and terminal execution a first-class Fleet loop without turning normal chat into a CLI picker.

## 2. User-Visible Loop

User opens terminal surface, selects or detects a runtime, runs/observes a process, sees output in the same Craft session timeline, can stop or inspect failure diagnostics.

## 3. Current App Reuse

Reuse Craft sessions, terminal surface route, RPC, permissions, timeline, settings, and existing CLI runtime protocol.

## 4. Reference Projects

AionUi for runtime catalog, custom runtime form, process lifecycle, ACP patterns. Warp only as terminal interaction reference. Do not copy unapproved CLI projects.

## 5. UI Placement

Terminal is a first-class content panel/surface. Normal `surface='chat'` remains API-only target state. CLI runtime management belongs in settings.

## 6. Backend / RPC / Locality

Runtime detection, launching, PTY, ACP stdio, process registry, and PATH diagnostics are `LOCAL_ONLY`. Bridge injection is explicit and scoped.

## 7. Session / Timeline / Permission / Rollback

Launching CLI, running commands, writing files, Git mutation, and Bridge injection require permission by risk. Output is transcript/evidence, not hidden terminal buffer.

## 8. Data Model

`CliRuntimeDefinition`, detected/custom runtime, launcher diagnostics, `RuntimeLane`, transcript entries, process id/group, `bridgeStatus`.

## 9. Agent-Native Actions

Actions: inspect runtimes, test runtime, start terminal lane, stop runtime, append transcript, request Bridge capability.

## 10. Files To Inspect First

- `app/packages/shared/src/protocol/cli-runtime.ts`
- `app/packages/server-core/src/services/cli-runtime-*`
- `app/packages/server-core/src/services/acp`
- `app/apps/electron/src/renderer`
- `app/packages/session-mcp-server/src`

## 11. Files Likely Touched

Runtime services, launcher adapter, terminal renderer, runtime settings, session tools/MCP bridge.

## 12. Parallel Work Packages

Catalog/settings, launcher/process lifecycle, terminal transcript, ACP bridge smoke can split after protocol freeze.

## 13. File Ownership

Shared `cli-runtime.ts`, `team-run.ts`, transport channels, and i18n are Lead-owned.

## 14. Validation Ladder

Service tests for detection/classification, typecheck server/electron, terminal UI smoke, one opt-in real CLI smoke when available.

## 15. Done / Not Done

`usable`: one real runtime path from UI to process to visible timeline output. `wired but not visually checked`: services exist but terminal UI/runtime smoke not checked.

## 16. Risks And Blocked Decisions

Risk: claiming CLI team leadership before Bridge smoke. Bridge unavailable means CLI single-run only.
