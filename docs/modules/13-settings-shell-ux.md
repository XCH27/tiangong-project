# 13 Settings Shell UX

## 1. Mission

Keep Fleet's shell and settings understandable by assigning every function one home and one representation.

## 2. User-Visible Loop

User opens settings or workbench, finds the relevant area once, changes a setting, sees immediate or explicit save behavior, and no duplicate UI controls fight each other.

## 3. Current App Reuse

Reuse Craft shell, settings registry, Radix/Tailwind UI primitives, app-shell panel stack, and existing themes/tokens.

## 4. Reference Projects

TRAE-style structure is visual/interaction reference only. Codex browser settings are the reference for the Browser settings page structure: global enablement, general controls, permissions, site overrides, and high-risk developer mode. Craft UI stack remains implementation base.

## 5. UI Placement

Default workbench remains Craft shell. Settings are grouped by user intent: usage, models/runtime, memory, capabilities/plugins, browser, appearance, about, plus explicitly retained messaging where assigned.

The Browser settings page should be a compact Codex-style settings surface:

- a top enable/disable row for built-in browser control
- General rows for local URL target, browser data clearing, and screenshot inclusion
- Permission rows for default approval behavior and website-specific overrides
- Developer mode rows for high-risk full CDP access

Do not scatter browser switches across BrowserPane, capability settings, and developer settings.

## 6. Backend / RPC / Locality

Settings write Craft preferences/config. No second settings store. Runtime/system tool checks are `LOCAL_ONLY`.

## 7. Session / Timeline / Permission / Rollback

Ordinary display settings are low risk. Settings that affect permissions, external accounts, paths, install/update, deletion, or L3 memory require permission/timeline.

## 8. Data Model

Settings section, setting item, preference key, i18n key, runtime/system tool status, visibility/feature state, browser permission policy, site override, browser data clearing scope.

## 9. Agent-Native Actions

Read settings, update safe preference, propose risky setting change, inspect system tools, inspect browser settings, propose browser permission/site override change.

## 10. Files To Inspect First

- `app/apps/electron/src/renderer/pages/settings`
- settings registry files
- `app/packages/shared/src/config`
- UI tokens in `app/packages/ui/src/styles`

## 11. Files Likely Touched

Settings pages, registry, i18n, system tools UI, app shell components.

## 12. Parallel Work Packages

Lead defines IA. Module agents fill assigned settings page only.

## 13. File Ownership

Settings grouping and shell layout are Lead-owned. Individual settings content belongs to module owners.

## 14. Validation Ladder

i18n parity/sorted checks, settings navigation smoke, browser settings smoke, visual overlap check, preference persistence check.

## 15. Done / Not Done

`usable`: setting appears in one place, persists, and affects real behavior. `display-only`: setting toggles UI state only.

## 16. Risks And Blocked Decisions

Risk: every backend module adds a settings page. Lead must place UI before implementation packets.
