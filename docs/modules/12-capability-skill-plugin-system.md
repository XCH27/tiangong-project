# 12 Capability Skill Plugin System

## 1. Mission

Separate installed capabilities from loaded capabilities and runtime execution so agents can use the smallest safe toolset per workspace, role, and task.

## 2. User-Visible Loop

User or Manager Agent sees available capabilities, composes or approves a loadout, an agent receives a scoped toolset, and changes are permissioned and reversible.

## 3. Current App Reuse

Reuse Craft skills/sources/MCP, Internal Action Registry, settings framework, session tools, and memory flywheel.

## 4. Reference Projects

AionUi for skill injection boundaries. Open Design for skill/plugin artifacts. Deepcode CLI for skill paths. LobeHub is black-box product reference only.

## 5. UI Placement

Settings gets capability/catalog/loadout pages under the agreed IA. Do not scatter plugin buttons across the shell.

## 6. Backend / RPC / Locality

Catalog and loadout are local control plane services. Installing external tools may require network and explicit permission.

## 7. Session / Timeline / Permission / Rollback

Loadout changes are L2 unless read-only. Plugin install/enable may be L2/L3 depending on network/payment/external side effects. Timeline records basis.

## 8. Data Model

Capability descriptor, catalog item, loadout scope, runtime instance, conflict rule, profile directory, tool namespace, localization cache.

## 9. Agent-Native Actions

List capabilities, resolve loadout, propose loadout, compose loadout, assign team loadout, install/enable plugin with permission.

## 10. Files To Inspect First

- `app/packages/shared/src/protocol/capability.ts`
- `app/packages/shared/src/protocol/internal-action.ts`
- settings and skills sources

## 11. Files Likely Touched

Capability catalog service, loadout service, resolver, settings UI, session tools, localization.

## 12. Parallel Work Packages

Catalog, resolver, settings UI, localization, skill injection can split after `capability.ts` is frozen.

## 13. File Ownership

Capability protocol and i18n keys are Lead-owned.

## 14. Validation Ladder

Catalog unit tests, loadout resolution tests, UI smoke, session tool table size check, permission timeline check.

## 15. Done / Not Done

`usable`: an agent actually receives a scoped loadout. `display-only`: marketplace page lists items but tool table is unchanged.

## 16. Risks And Blocked Decisions

Risk: injecting orchestration skills into autonomous CLI harnesses. CLI passthrough receives only minimal compatible descriptions.

## 17. Plugin Action Namespace Safety

### 17.1 Problem

As Craft Agents (二开补强) grows, multiple plugins and surfaces will register actions into
the Internal Action Registry (M03). Without namespacing, two plugins can
claim the same `actionId` string, causing silent overwrites or
non-deterministic dispatch.

### 17.2 Namespace Contract

Every action id registered by a plugin **must** be prefixed with the
plugin's canonical namespace:

```
<surface>.<plugin-id>.<verb>
```

Examples:
```
canvas.my-plugin.insert-component
video.my-plugin.add-caption
browser.my-plugin.extract-table
```

The Internal Action Registry **must** reject registration of any id that:
- Does not contain exactly two `.` separators.
- Uses a `<surface>` prefix not declared in the plugin's manifest.
- Conflicts with an already-registered id (no silent overwrite).

Core Craft Agents (二开补强) action ids (registered by Lead-owned modules) use the
`fleet.<surface>.<verb>` prefix and are reserved. Plugins may not
register ids under the `fleet.*` namespace.

### 17.3 Sandbox Isolation

Plugins execute in an isolated context with the following constraints:

- A plugin may only **call** actions in its own namespace or actions
  explicitly declared as `public` in the Internal Action Registry.
- A plugin may not directly import or call internal Craft Agents (二开补强) service modules.
  All cross-boundary calls go through the Action Registry dispatch.
- A plugin that throws an unhandled exception is automatically disabled
  for the current session and a `PLUGIN_FAULT` SessionEvent is emitted.
  The user is notified; the rest of the session continues.

### 17.4 Version Compatibility Gate

The plugin manifest must declare:

```json
{
  "fleetApiVersion": "^1.0.0",
  "actionNamespace": "canvas.my-plugin"
}
```

During installation, the catalog service checks `fleetApiVersion` against
the running Craft Agents (二开补强) version. Incompatible plugins are blocked at install time
with a clear user-visible error, not at runtime.

## 17. Non-Goals & Prohibitions

- **No Tag Bypassing:** Workers must not load skills or run tools that violate their assigned `role:` and `domain:` identity tags. Bypassing ADR-0032 invariants throws errors.
