# SPEC — R1 One boundary + language

> Spec status: `draft` (eligible for READY once R0 lands; most code exists in the R0-audited tree)
> Owner acceptance date: —

## Outcome

Fleet presents **one work boundary — Project = one folder** — over the backend Workspace
(Decision P6), makes **New Task** the primary create action with a project-grouped task list
(Decision P10), removes overlapping workspace/folder/session chrome, and localizes the whole
default UI (zh-Hans first) with identity labels behaving per Decision E10. A non-technical user
opening the app in Chinese sees one coherent "项目" concept, creates work with 「新建任务」,
and finds their own names untouched.

## Slice order (owner priority, 2026-07-20)

Merge / simplify / delete work lands **first**: (1) the Dedup-inventory merges, the New Task
create entry and the single Project switcher; (2) the project-grouped task list; (3) localization
and label polish. Do not hold a finished dedup slice hostage to i18n completeness — land and
report each coherently.

## User story / walkthrough

1. The user opens Fleet with display language zh-Hans. Sidebar, settings, Board, menus, dialogs,
   empty/error states read in Chinese — no English fallback in normal surfaces.
2. Where Craft showed nested Workspace → Project, the user now sees a single **Project** boundary
   (wording, navigation, pickers, "send to project" dialogs). Backend Workspace behavior
   (storage/config/sessions/permissions/routing) is unchanged.
3. Built-in starter labels and session statuses render localized; a label/status the user created
   or renamed stays exactly as typed (E10). Search matches both the localized display and stored
   name.
4. Switching to English re-renders built-ins in English; user-created values still verbatim.
5. Nothing in the flow requires or implies a Craft account/server.
6. The primary create action reads 「新建任务」/"New Task" and creates a Task with its Session in
   the current Project; no default surface offers a separate "new chat". The sidebar lists
   Projects with their tasks beneath (Skills and Automations keep their own entries).
7. Exactly one Project switcher exists. Choosing "打开文件夹/新建项目" both resolve to picking a
   folder; no surface shows workspace, local folder and project as parallel concepts.

## Scope

- **In (mostly EXTEND; paths from the R0-landed tree):** renderer app-shell wording/navigation
  (`AppShell`, `LeftSidebar`, workspace pickers/dialogs, Board), the primary create entry
  (New Task creating Task+Session via existing Task store + SessionManager APIs), the sidebar's
  project-grouped task list projection, the §"Dedup inventory" merges below, settings pages,
  shared i18n catalogs + lints, `packages/shared/src/labels/` presentation seam (render-time
  localization catalog — not a second store), display-name utilities and their tests.
- **Out (non-goals):** legacy data *migration* of nested Projects (separate slice with its own
  recovery evidence); remote Projects (P7); the `云端 cloud` execution-location preset
  (P9 presentation rule — lands with R14; worktree isolation is agent-managed, never a user
  preset; R1 ships no placeholder controls, per G6);
  Skill/Source/permission label bindings (`not implemented`, stays so); any new settings surface.
- **Reserved paths:** this spec; `docs/` except completion updates; label store persistence format.

## Reality anchors and execution order

The current implementation is under `app/apps/electron/src/renderer/components/app-shell/`,
`app/apps/electron/src/renderer/pages/settings/`, `app/packages/shared/src/i18n/`,
`app/packages/shared/src/labels/`, and the Workspace RPC handlers under
`app/packages/server-core/src/handlers/rpc/`. Execute in this order: (1) inspect current routes and
stored label/Workspace shapes; (2) change presentation catalogs and components; (3) run
`bun run lint:i18n:parity && bun run lint:i18n:sorted` from `app/`; (4) run
`bun run typecheck:electron`; (5) compare persisted store bytes before/after language switching.
If any path or command is absent, this spec cannot claim `done`.

## Pages touched

| Surface ID | Create/extend/wire | Adapter/data contract | Permission | States exercised | Owner visual checkpoint |
|---|---|---|---|---|---|
| P-01 | extend shell/sidebar wording | existing navigation state | workspace/session policy | empty/error/narrow/i18n | sidebar zh-Hans/en |
| P-03 | extend Project presentation | Workspace RPC | workspace policy | loading/empty/error/offline/i18n | project picker/home |
| P-04 | extend Board labels/statuses | Task store | task policy | empty/error/narrow/i18n | Board + menus |
| P-05 | extend settings catalogs | settings RPC | settings policy | empty/error/narrow/i18n | settings pages |
| P-06 | extend search/label display | search/label RPC | workspace scope | empty/error/offline/i18n | search + label menus |
| P-07 | extend provider setup wording | onboarding RPC | credential policy | loading/error/denied/i18n | first-run/setup |

## Dedup inventory (execute against real code; merge or justify each row)

Audit candidates named from the current tree — the executing agent verifies each against code,
merges to **one primary home per capability**, and records outcome (merged / kept-with-reason) in
the slice report. Candidates:

| Overlap | Files (renderer unless noted) | Expected resolution |
|---|---|---|
| Three switcher/picker variants | `components/app-shell/WorkspaceSwitcher.tsx`, `CompactWorkspaceSwitcher.tsx`, `components/workspace/WorkspacePicker.tsx` | one Project switcher component (+ its compact rendering), Project vocabulary |
| Two "send to…" dialogs | `components/app-shell/SendToWorkspaceDialog.tsx`, `SendResourceToWorkspaceDialog.tsx` | one "send to project" dialog handling both payload kinds |
| Session menu duplication | `components/app-shell/CompactSessionMenu.tsx`, `SessionMenuParts.tsx` | one menu definition, two renderings |
| Create-entry naming | new-chat/new-session affordances across `AppShell`/`LeftSidebar`/command palette | one **New Task** action (P10) |
| Workspace-vs-folder wording | `components/workspace/AddWorkspaceStep_ConnectRemote.tsx`, onboarding, settings labels | Project-folder vocabulary everywhere; remote stays "user-hosted project" (P7 wording) |

A candidate that turns out to be a false duplicate (genuinely different capability) is kept and the
reason recorded; deleting a still-referenced component without migrating callers fails the slice.

## Acceptance criteria

| ID | Criterion | Verified by |
|---|---|---|
| R1-C1 | Default navigation exposes one Project boundary; no user-visible nested Workspace→Project hierarchy remains in default surfaces | owner walkthrough + component tests |
| R1-C2 | Workspace remains the untouched backend authority (config/root/sessions/permissions) — no schema or storage change | `rg` diff audit: no persistence changes |
| R1-C3 | i18n parity/sorted/coverage/string lints pass; no hardcoded user-visible English in changed surfaces | `bun run lint:i18n:parity && bun run lint:i18n:sorted && bun run lint:i18n:coverage && bun run lint:i18n:strings` |
| R1-C4 | Untouched built-in labels/statuses localize at render and in search; stored IDs/names stable | targeted tests (label-display utilities, search) |
| R1-C5 | User-created or renamed labels/statuses render verbatim in every surface | targeted tests + owner check |
| R1-C6 | Language switch re-renders built-ins without touching stored data | data-path check (store file unchanged) |
| R1-C7 | No surface in the changed scope requires/implies a Craft-operated service | `rg` for inherited endpoints in changed surfaces |
| R1-C8 | Owner accepts zh-Hans and English appearance of: sidebar (project-grouped task list), New Task entry, Board, label menus, settings pages, Project switcher | owner acceptance |
| R1-C9 | The primary create action is New Task: it creates one Task with its Session in the current Project through existing Task/Session APIs; no default surface retains a separate "new chat" | component tests + `rg` for retired entries |
| R1-C10 | Exactly one Project switcher remains; every Dedup-inventory row is merged or justified; no default surface names workspace/local-folder/project as parallel concepts | dedup report + i18n string audit |

## References consumed

Craft-internal REUSE/EXTEND. Presentation evidence only: owner-supplied TRAE desktop screenshot
(2026-07-20 — task-first sidebar, project-grouped tasks, composer execution presets) recorded as
OV-008 in [`../design-library/OWNER-VOICE.md`](../design-library/OWNER-VOICE.md); no TRAE code or
shell is imported. Authority for wording/component decisions:
pinned upstream v0.11.1 checkout + [`../CRAFT-UI-BASELINE.md`](../CRAFT-UI-BASELINE.md);
Project=Workspace design source: [`../design-library/20-workspace-project-session-remote-connections.md`](../design-library/20-workspace-project-session-remote-connections.md)
(external product paths there are reference-only).

## Dependencies and unresolved edges

Consumes the R0-verified baseline. If legacy nested-Project data exists in real user workspaces,
its migration is a recorded unresolved edge → separate slice with recovery evidence before P6 can
be reported fully `usable` for old data.

## Risks and rollback

- **Risk:** wording-only change mistaken for the full P6 migration → status must say
  "presentation `usable`; legacy-data migration `not implemented`".
- **Risk:** localizing stored values by accident (breaks E10) → C4/C6 tests guard.
- **Rollback:** revert the feature commits; no persisted format changed (C2 guarantees this).

## Verification plan

Ladder 1–3 (component + utility tests, store-unchanged data check), i18n lints, one smoke boot per
language. Owner CHECK THIS: the R1-C8 list in both languages, light/dark, narrow sidebar.

## Doc updates on completion

Capability rows (Project/Workspace, Identity labels), user-facing bundled docs (labels), roadmap
status, this spec.
