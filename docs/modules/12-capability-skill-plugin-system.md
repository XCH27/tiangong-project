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
