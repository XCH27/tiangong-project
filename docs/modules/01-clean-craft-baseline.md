# 01 Clean Craft Baseline

## 1. Mission

Keep Craft Agents as the working base while removing or quarantining Fleet experiments that fight the direction.

## 2. User-Visible Loop

User can open the default workbench, create/select sessions, send normal API chat, use existing BrowserPane/settings, and see no broken Fleet shell remnants.

## 3. Current App Reuse

Keep the monorepo, Electron app, renderer shell, session list, chat input, permissions, sources, BrowserPane, settings framework, and upstream sync path.

## 4. Reference Projects

Craft is direct source. UI references are behavior-only unless already part of Craft or approved.

## 5. UI Placement

Default workbench remains Craft shell. Simplify and dedupe; do not create `WorkbenchShell` or a marketing/console page.

## 6. Backend / RPC / Locality

No new backend unless needed to keep the baseline running. Upstream sync is a maintenance operation, not product behavior.

## 7. Session / Timeline / Permission / Rollback

Baseline must preserve existing session/permission behavior. Any removal must keep timeline readable.

## 8. Data Model

Use existing Craft session/settings/source schemas; add compatibility only when required.

## 9. Agent-Native Actions

No new action required. The goal is not to add features.

## 10. Files To Inspect First

- `app/package.json`
- `app/apps/electron/src/renderer/components/app-shell`
- `app/packages/server-core/src/sessions`
- `app/scripts/oss-sync.ts`

## 11. Files Likely Touched

App shell cleanup, settings labels, docs, brand/config when assigned.

## 12. Parallel Work Packages

Lead-only for shell architecture. Workers can handle isolated cleanup after file ownership is explicit.

## 13. File Ownership

Lead owns shell layout and upstream sync. No worker changes core shell placement without packet.

## 14. Validation Ladder

`git diff --check`, targeted typechecks, Electron launch, default chat smoke, settings open smoke.

## 15. Done / Not Done

`usable`: default Craft workflow works. `display-only`: visual shell exists but sessions/settings break.

## 16. Risks And Blocked Decisions

Risk: cleaning by deleting active hooks. Deletions require `rg` proof and Lead approval.
