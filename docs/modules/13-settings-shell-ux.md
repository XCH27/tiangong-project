# M13 — Settings and Preferences UX

> **Capability status:** `not implemented`
> **Execution gate:** Locked
> **Spec maturity:** concept; exact IA/preference keys require v0.11 mapping
> **Wave:** W5
> **Depends on:** M00 preference authority, M16 view/layout contract, owning module schemas

## 1. Mission

Keep Fleet's settings understandable by assigning every preference one home and one representation.
M13 does not own the workbench panel registry or layout engine; M16 does.

## 2. User-Visible Loop

User opens settings or workbench, finds the relevant area once, changes a setting, sees immediate or explicit save behavior, and no duplicate UI controls fight each other.

## 3. Current App Reuse

Reuse Craft shell, settings registry, Radix/Tailwind UI primitives, app-shell panel stack, and existing themes/tokens.

## 4. Reference Projects

TRAE-style structure is visual/interaction reference only. Codex browser settings are the reference for the Browser settings page structure: global enablement, general controls, permissions, site overrides, and high-risk developer mode. Craft UI stack remains implementation base.

## 5. UI Placement

Default workbench remains the Craft shell. Settings are grouped by user intent:

| Section | Owning contract |
|---|---|
| General / workspace | M00/M05 |
| Runtime and terminal | M02/M04 |
| Models, providers, and usage | M11 plus protected secrets authority |
| Memory/context | M10 |
| Capabilities/loadouts/plugins | M12 |
| Browser control | M06 |
| Workbench layout and Agent reveal policy | M16 |
| Appearance/accessibility | retained shell/M13 |
| Messaging integrations | M15 |
| About, licenses, diagnostics | M01/M13 |

The Browser settings page should be a compact Codex-style settings surface:

- a top enable/disable row for built-in browser control
- General rows for local URL target, browser data clearing, and screenshot inclusion
- Permission rows for default approval behavior and website-specific overrides
- Developer mode rows for high-risk full CDP access

Do not scatter browser switches across BrowserPane, capability settings, and developer settings.

M16's settings include only preference projections such as default layout, reset, and whether an
Agent may reveal/focus views. M13 must not duplicate live panel registration or layout state.

## 6. Backend / RPC / Locality

Settings write Craft preferences/config. No second settings store. Runtime/system tool checks are `LOCAL_ONLY`.

## 7. Session / Timeline / Permission / Rollback

Ordinary display settings are low risk. Settings that affect permissions, external accounts, paths, install/update, deletion, or L3 memory require permission/timeline.

## 8. Data Model

Settings section, setting item, canonical preference key, schema/version, default, sensitivity,
risk/approval policy, i18n key, restart requirement, owning module, and optional migration. Browser
permission policy, site override, data clearing scope, and M16 layout/reveal policy are typed owner
subschemas.

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

IA/schema validation, duplicate-key check, migration/persistence check, human/Agent permission
check, real settings navigation and visual verification, and proof that the setting changes owner
behaviour rather than renderer-only state.

## 15. Done / Not Done

`usable`: setting appears in one place, persists, and affects real behavior. `display-only`: setting toggles UI state only.

## 16. Risks And Blocked Decisions

Risk: every backend module adds a settings page. Lead must place UI before implementation packets.

## 17. Non-Goals & Prohibitions

- **No Subscriptions or Accounts:** Do not build or display subscription/upgrade prompts, user account login, or payment gateways. The software remains local and free.
