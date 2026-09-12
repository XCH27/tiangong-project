# SPEC — R1 Upstream baseline convergence + one Session list + language

> Spec status: **superseded as a “restore v0.10.5 AppShell” program.** Keep only the one-list /
> Project=folder clauses if they still match [`PRODUCT.md`](../PRODUCT.md).
> Pre-landed 2026-07-26: the slice-1 source inventory
> (`aaa09b094`, satisfies R1-C1 — see the inventory section below) and the clause 1–3 boundary
> shell (`2d08364f7`), both `wired but not visually checked`. Trailing-meta visibility was
> trialed and reverted twice on 2026-07-26 (`7762c8bc4`→`2136b1ea9`, `d25b763f6`→`fa5ee7460`)
> and then **decided by the owner: hover-reveal stays** ([`02-DECISIONS.md`](../02-DECISIONS.md)
> G7, 2026-07-26). Do not re-attempt always-visible without the owner reopening G7.
> The R1 execution map is
> [`../design-library/21-entry-overlap-framework-audit.md`](../design-library/21-entry-overlap-framework-audit.md);
> G8 fixes the create noun as New Task/新建任务 and G9 restores Mark All Read in the current
> Session-list header menu.
> Owner acceptance date: —

## Outcome

Fleet restores Craft v0.10.5 as its product and interaction baseline while keeping the current
`app/` tree as the only implementation tree. The default shell exposes one Project boundary, one
Session-list implementation, one New Task flow and one home for each supporting capability.
Folder-bound Sessions appear under Project rows; folder-less Sessions appear in a sibling
Conversations section. Useful v0.11.1 fixes or backend mechanisms survive only when a code
comparison proves they do not restore the later Projects/Kanban product model.

The user can create folder-less work globally or folder-bound work within a Project, find each
Session once, assign labels, archive and recover it, and open Project documents/assets/settings
without seeing duplicate Session lists. The same surfaces are complete in zh-Hans and English.

## Source and authority policy

| Source | Role in R1 | May decide |
|---|---|---|
| `源码参考/software/craft-agents-oss-v0.10.5/` @ `c9d9a26fbefa` | product/interaction baseline | shell hierarchy, navigation, composer, menus and preserved Session actions |
| current `app/` tree | implementation reality | existing authorities, data compatibility and code that must be migrated or removed |
| `源码参考/software/craft-agents-oss/` @ `a60ebc1a5a7c` (v0.11.2) | selective-update reference | independent fixes and bounded backend mechanisms only; per-file intake is recorded in `docs/references/REFERENCE-REGISTRY.md` |
| owner-supplied screenshots and products | behavior evidence | clarity goals and interaction comparisons, never code or shell authority |

Every v0.11-derived delta receives one verdict before implementation:

- **KEEP:** independent fix or backend mechanism with an existing Fleet caller;
- **RESHAPE:** useful capability, but presented through the v0.10.5 shell and Fleet's one-list rule;
- **REMOVE:** Kanban/Project UI, duplicate navigation or a mechanism with no current caller;
- **LATER:** potentially useful backend idea whose real caller belongs to a later release.

## Binding interaction contract

> **How to read this section.** Each clause is a decidable test, not a direction of travel. The
> ✅/❌ pairs are normative. When a clause and its examples appear to disagree, the examples win and
> the prose is corrected.
>
> **The distinction the whole contract rests on:** a **filtered state** re-renders the same Session
> list implementation with a predicate. A **second home** is a separate list with its own
> persistence, ordering, or
> selection. Removing filtered states does not satisfy "one work list" — it removes function while
> leaving the actual duplication untouched.

1. **One Session list, two honest scopes.** A folder-bound Session appears once under its Project;
   a folder-less Session appears once under the sibling Conversations section. Project pages,
   labels, search and archive never create additional default conversation lists.
   - ✅ Projects and Conversations render the **same** Session-list component with different scope
     predicates; status, Flagged, Archived and label selection add another predicate to it.
   - ✅ There is no permanent All Sessions entry. Projects is the folder-bound overview and
     Conversations is the folder-less overview, so a third aggregate entry would only repeat rows.
   - ✅ Project home shows documents/assets/settings and links into the sidebar tree for its work.
   - ❌ Deleting status, Flagged, Archived or label filtering. They are states of the one list
     implementation, and removing them is scope loss, not deduplication.
   - ❌ A Project page rendering its own scrollable Session list beside the sidebar tree.
2. **One create flow.** Global New Task and the Project-row plus button open the same composer with
   context supplied by the trigger. R1 creates work through SessionManager; it does not require a
   parallel Task record merely to start a conversation.
   - ✅ The global trigger creates a folder-less Session under Conversations unless a folder is
     explicitly selected; the Project-row trigger prefills that Project folder.
   - ✅ Both triggers call one handler that creates a Session and opens the existing composer.
   - ❌ Either trigger navigating to the Board, opening the Kanban `TaskEditor`, or creating a Task
     record. That is clause 9's forbidden case reached through the create flow.
3. **One Project meaning.** Project = one folder over the existing Workspace backend. Exactly one
   switcher selects that boundary; Workspace remains an implementation term. The nested v0.11
   Project record is not a second folder level.
   - ✅ A local Project row filters the current list to that folder without switching Sources,
     Skills or settings context.
   - ✅ The Project-section add button opens the operating-system directory picker directly and
     creates the existing Workspace authority from the chosen path.
   - ✅ Existing cloud/remote connection remains available as the user-owned remote execution
     location from P7/P9; it reuses Workspace routing and does not create another Project authority.
   - ❌ Presenting worktree isolation as a user location preset. Worktree isolation is agent-managed.
4. **Project home is not a list.** Selecting a Project opens its documents, assets, memory summary
   when one is real, and settings. Its Sessions remain only in the sidebar work list.
   - ✅ Removing the Sessions tab from `ProjectInfoPage`, leaving Assets and Settings.
   - ❌ Removing Project home's own content, or making the Project row navigate somewhere other than
     Project home.
5. **Labels have one home.** Settings creates, renames, colors and deletes label definitions.
   Session menus assign/remove labels; label selection filters the same Session list.
   - ✅ Label **definitions** (create/rename/color/delete) reachable only from Settings.
   - ✅ Labels remain selectable from the list filter and assignable from the Session menu.
   - ❌ A permanent label tree that repeats the same Sessions as another sidebar home.
6. **Archive is a state, not a disappearance.** Session menus expose Archive; the work-list filter
   exposes archived Sessions and Restore. Recovery uses the existing Session command path.
   - ✅ Archived reachable as a filter state; Restore returns the Session to its normal position.
   - ❌ Archive that hides a Session with no reachable view listing it.
7. **Preserve mature actions.** Rename, label, status/flag where still supported, archive/recover,
   project binding and destructive actions remain reachable from one shared Session menu definition.
8. **Progressive composer.** The first panel asks for the goal and shows optional Project context.
   Choosing a folder opens the operating-system picker directly. Existing
   model, permission, source, skill, folder and acceptance options remain available on demand; R1
   does not replace them with a decorative hero or a second editor.
   - ✅ The existing composer, with advanced controls collapsed but one interaction away.
   - ❌ A centered oversized title, a decorative icon badge, or a marketing-style introduction. See
     [`../UI-SPEC.md`](../UI-SPEC.md) §9 — "no hero" is a measurable rule, not a matter of taste.
9. **No default Kanban.** The v0.11 Board and Project→Task coupling are outside R1's target product
   shape. Backend Task schema/runner/memory/assets may remain only under KEEP/LATER verdicts and
   must not generate navigation by their mere presence.
   - ✅ Board code remains dormant and is not a default navigation destination.
   - ❌ Board as a top-level sidebar entry, as the New Task destination, or as the most prominent
     surface in the shell. All three occurred in the reverted 2026-07-24 implementation.
10. **Future task center stays one projection.** A later Claude/Codex-style task center may combine
    selected Session, Task and Job state through existing authorities. It is not a Trello-style
    board and never becomes another conversation store.
11. **Global search is one projection, not another home.** The top-bar search command and
    `Cmd/Ctrl+K` project existing Session metadata/content, Project folders/files, Settings and
    shell destinations into one transient result list.
    - ✅ Session content uses the existing Session search path; Project files use the existing
      filesystem search path; Settings and navigation results resolve to canonical routes.
    - ✅ Selecting a Session, route or file opens the existing destination or file preview.
    - ❌ A persisted search index, second Session store, duplicate Settings registry or search-only
      content authority.

## Slice order

0. **R0 entry gate:** typecheck and documentation contracts must be green. Repair compile or
   contract defects as R0 fixes; do not disguise them as R1 architecture.
1. **Code comparison:** map v0.10.5 → v0.11.1 → current `app/` for shell, Session list/menu,
   composer, Projects/Board, labels, archive and search. Record KEEP/RESHAPE/REMOVE/LATER next to
   the affected code in the implementation handoff, not in a new report document.
2. **Restore preserved behavior:** recover missing Session actions and the v0.10.5 navigation/
   composer behavior before introducing Fleet wording changes.
3. **Converge navigation:** implement Projects + Conversations as sibling scopes over one list
   component; remove the permanent All Sessions entry and duplicate Project-page list while
   preserving status/Flagged/Archived/label filters.
4. **Converge creation:** global and Project-row triggers call one Session creation path; Project
   add opens the directory picker directly.
5. **Apply remaining Fleet deltas:** Project=folder vocabulary, Project home, localization and
   built-in-label presentation.
6. **Verify:** component/data-path tests, i18n checks, non-interactive smoke, then owner visual
   acceptance. Do not claim `usable` before the final checkpoint.

## Slice-1 source inventory (v0.10.5 `c9d9a26fbefa` ↔ tree `fe2333cf9`, 2026-07-26)

File-level verdicts for every diverging path in `apps/electron/src`, `packages/shared/src` and
`packages/server-core/src` (222 paths total; full machine lists reproducible with
`diff -rq` against the pinned checkout). Verdicts use this spec's vocabulary; clusters share one
rationale. This inventory satisfies R1-C1's diff-inventory requirement.

| Verdict | Cluster (paths) | Rationale |
|---|---|---|
| KEEP | R1 boundary core: `AppShell/LeftSidebar/SessionList/TopBar/SessionItem/SessionMenu*/SidebarMenu/Compact*` + `App.tsx`, `session-filter-menu`, `r1-product-gates`, `WorkingDirectorySelector`, `ProjectsListPanel`, `SessionProjectColorWrapper`, `projects/` components, `ProjectInfoPage`, navigation (`context/NavigationContext` + history/reconcile), routes/route-parser/types + tests, `event-processor/*`, `nav-helpers`, `local-storage`, session-list-collapse + search/menu hooks, `AppShellContext/SessionListContext`, workspace/label display-name utils + tests | The clause 1–3 implementation over one Session list; landed R0 groups; tests updated in-slice |
| KEEP | Fleet mechanisms with callers: `atoms/{background-finished,projects,workspace-avatar-colors}`, `BackgroundFinishedChip`, `workspace-avatar`, `color-picker`/`inline-color-picker-row`, `SkillSelectorPopover`, label family (`labels/{filter,system-labels}` + crud/types deltas, label-menu UI, `LabelsDataTable`), `session-status-*` (E10), settings pages zh-Hans passes, i18n catalogs + i18n/independence tests, `mcp/{env,validation,client}` (+tests), `persistent-input`, Pi backend deltas + `cache-economy` (TE1 core), prompts/system, protocol/*, sessions storage/types, `SessionManager` + rpc handlers + session tests, transport `session-workspace` targets, `main/{index,handlers/workspace,deep-link}` + shared prefixes, `channel-map`, `SettingsIcons` (R0 compile repair), css/main.tsx boot deltas, app-menu + mobile pages, playground additions (dev harness), browser pane/toolbar/tab-strip deltas, `AuthRequestCard`, automations UI/handlers | Independent fixes and Fleet features audited into the R0 landing; each carried its targeted tests |
| KEEP | R2 independence gates: `auto-update` (+`useUpdateChecker`, isolated test), `branding`, `doc-links`, `oauth-relay`/`slack-oauth`/`credential-manager` (+tests) | Landed R2 service rows (capability map "Landed 2026-07-26" rows) |
| RESHAPE | `SendToWorkspaceDialog` / `SendResourceToWorkspaceDialog` / `WorkspacePicker` / `CompactWorkspaceSwitcher` variant set | Works today; the dedup table's "one switcher, no parallel Workspace picker" still owes a variant merge — tracked by this spec, not silently deleted |
| RESHAPE | `ThemeContext` delta | Per donor decision: per-workspace theme removed from product surface; IPC/override API kept compatibility-only |
| REMOVE (executed) | `WorkspaceSwitcher.tsx`, `renderer/contexts/` | Switcher lifted into the sidebar project list (owner 2026-07-25); context home unified — deletions landed with replacements in the same change |
| LATER | Kanban/Task set: `app-shell/kanban/`, `atoms/kanban`, `useKanbanColumnColors`, kanban/task-editor playground entries, `shared/src/{projects,tasks}`, `server-core/src/tasks` + `rpc/{projects,tasks}`, `TaskActionMenu`/`ActiveTasksBar` deltas, task-related SessionManager tests | Clause 9: dormant v0.11 backend/UI behind `r1-product-gates`; no default navigation; `projectId`/`kanbanColumn` stay compatibility data |

## Executor handoff

Land the work as the following independently revertible groups. A later group must not compensate
for a failing earlier group.

| Group | Primary code boundary | Required result |
|---|---|---|
| R0 gate | `SettingsIcons.tsx`; documentation matrix/validator only when its current output identifies a real gap | Electron typecheck passes; documentation validator passes. Do not install a new Git hook or require zero informational notes as part of R1 |
| Source restore | v0.10.5/current comparisons for `AppShell.tsx`, `LeftSidebar.tsx`, `SessionList.tsx`, shared Session menus and composer | every changed path gets KEEP/RESHAPE/REMOVE/LATER; archive, labels, rename, destructive actions and advanced composer controls remain reachable |
| Navigation convergence | `AppShell.tsx`, `LeftSidebar.tsx`, `SessionList.tsx`, `sidebar-nav-model.ts`, `session-filter-menu.tsx`, navigation context/routes, search and collapse helpers | Projects and Conversations are sibling scopes; no permanent All Sessions; status/Flagged/Archived/labels filter the same list implementation; Project home has no Session copy |
| Creation convergence | `AppShell.tsx`, `WorkspaceCreationScreen.tsx`, route DTOs and the existing Session create RPC | global New Task explicitly requests no working directory; Project-row New Task supplies that Workspace folder; local Project add opens the directory picker directly; no Board/Task record and no nested `projectId` write are introduced |
| Project/supporting homes | Project settings, label settings and shared Session action menu | the selected Workspace-as-Project settings stay reachable; nested v0.11 documents/assets remain dormant; label definitions stay in Settings; assignment, Archive and Restore stay on the Session path |
| Language and verification | seven locale catalogs, affected component/data-path tests and launch smoke | parity/sorted/coverage/string checks pass; owner receives zh-Hans and English walkthrough only after non-visual checks pass |

Implementation notes that prevent current-code traps:

- `SessionManager.createSession()` treats an omitted working directory as the Workspace default.
  Folder-less creation must therefore pass the existing explicit `none` value; omission is wrong.
- A local Project is implemented by the existing Workspace root. Do not create another Project
  store or promote a nested v0.11 Project record to a folder.
- Existing `projectId` and `kanbanColumn` values are compatibility data in R1. Do not delete,
  rewrite, or convert them to labels in this release.
- Local Project add opens the OS folder picker. Cloud/remote create reuses the existing
  `WorkspaceCreationScreen` connection path so R14 can harden it in place; R14 still owns remote
  grants, disconnect honesty and worktree isolation. GitHub remains an optional Project connector,
  not a location preset.

## Scope

- **In:** shell/sidebar navigation; Projects + Conversations scopes; Session list and shared Session
  menu; composer entry; direct local-folder picker; Project
  switcher/home; existing cloud/remote connection entry; label settings and assignment; archive/recovery; search/filter projections;
  zh-Hans/English catalogs; removal or hiding of v0.11 Board/Project duplication.
- **Out:** new persistence authorities; automatic creation of a Task for every Session; a new
  task-center implementation; nested-Project data migration or deletion; R14 grant/remote hardening;
  `kanbanColumn` migration; Prompt/cache or tool-loadout changes; TaskRunner
  no-progress behavior; R4 action envelopes; Skill/Source/permission label binding; memory/vector
  search; canvas/video/web surfaces.
- **Reserved:** Session/Workspace/Task persisted formats, permission path, timeline and settings
  authority. A required schema migration stops this slice for an owner checkpoint.

## Pages touched

| Surface ID | R1 treatment | Existing authority | Owner checkpoint |
|---|---|---|---|
| P-01 | restore/simplify shell, Projects + Conversations over one list, context-bound create, global search command | navigation + Session state + existing search/filesystem paths | sidebar and global search in both languages, wide/narrow |
| P-02 | one progressive New Task composer and preserved Session actions | SessionManager + existing composer/menu | new/open/running/error/archive flows |
| P-03 | one Project switcher; documents/assets/settings home without Session copy | Workspace RPC | empty/populated/offline Project |
| P-05 | label definitions remain in Settings | settings + label store | create/rename/delete label |
| P-06 | search/label/archive filter the one list; global search projects Sessions, Projects/files, Settings and routes | search/filesystem/labels/Session commands | empty/result/partial-error/archived/restore |

P-04 Board is not an R1 acceptance surface. Existing Board code is classified by the source review
and may remain dormant for later backend reuse, but its presence is not a usable product claim.

## Dedup decisions

| Capability | Canonical home | Other appearances |
|---|---|---|
| Folder-bound Sessions | Project rows in the sidebar | search/status/label/archive are filtered states |
| Folder-less Sessions | Conversations section in the sidebar | search/status/label/archive are filtered states |
| Create work | one New Task composer | global trigger creates folder-less work; Project-row trigger binds its folder |
| Project selection | one switcher | pick/create-folder actions feed it; no parallel Workspace picker |
| Project documents/assets/settings | Project home | never repeat the work list |
| Label definitions | Settings | Session menu only assigns/removes |
| Archive/recovery | Session menu + archived list state | no separate conversation authority |
| Session actions | one shared action definition | compact/full renderers may differ visually but use the same commands |
| Global search | top-bar command + `Cmd/Ctrl+K` | results project existing Session, Project/filesystem, Settings and route authorities |

## Acceptance criteria

| ID | Criterion | Verified by |
|---|---|---|
| R1-C1 | A source comparison assigns KEEP/RESHAPE/REMOVE/LATER to every changed shell/list/menu/composer/Project/Board path | diff inventory against both pinned snapshots |
| R1-C2 | Each Session has one default row in exactly one scope: its Project or Conversations; Project home and filtered states do not create permanent duplicate lists | component route/state tests |
| R1-C3 | Global and Project-row New Task triggers call the same composer and Session creation path; global is folder-less by default and Project-row binds its folder | component test + Session RPC fixture |
| R1-C4 | R1 does not require or create a parallel Task record for an ordinary new Session | data-path test + Task-store call audit |
| R1-C5 | Project=folder uses one switcher and direct local-folder picker while Workspace persistence/routing remains unchanged | component test + persistence diff audit |
| R1-C6 | Project home exposes its non-conversation resources without listing its Sessions again | component test |
| R1-C7 | Label definitions have one Settings home; assignment/filtering work without changing stored user names | label utility/store tests |
| R1-C8 | Archive and Restore are reachable and operate through the existing Session command path | component + RPC test |
| R1-C9 | Rename, label, archive/recovery and destructive actions share one command definition across compact/full renderers | caller audit + targeted tests |
| R1-C10 | Composer preserves existing advanced controls on demand and introduces no second editor authority | component test |
| R1-C11 | i18n parity/sorted/coverage/string checks and scoped typechecks pass | repository commands |
| R1-C12 | Owner accepts zh-Hans/English shell, Projects/Conversations scopes, Project home, composer, labels and archive flows | owner walkthrough |
| R1-C13 | Top-bar search and `Cmd/Ctrl+K` find and open existing Sessions, Project files/folders, Settings and shell destinations without adding persistence | targeted model tests + real Electron smoke |
| R1-C14 | The existing composer mode entry supports Auto or a manual Explore/Plan/Execute phase; the default privileged-action approval policy is configured in the existing Permissions settings for new Sessions; both project through the single permission gate, persist on the Session, and plan approval never grants bypass implicitly | shared work-mode tests + Session persistence test + Electron typecheck |

## Explicit donor and later-work decisions

| Finding | Verified disposition |
|---|---|
| Missing `Folder` icon import in Settings | R0 compile repair, not an architectural change |
| Registry-to-matrix coverage gaps | R0 documentation coverage work; use the validator's current output, never a copied count |
| v0.11 `kanbanColumn` persistence | LATER compatibility cleanup; hide Board UI in R1 but do not delete or convert legacy values to labels |
| Per-workspace color theme UI | REMOVE from product surface; theme is app-wide. Keep IPC/ThemeContext override API for compatibility only |
| Nested `projectId` session-menu write | UI gated off in R1 (`r1-product-gates.ts`); values remain on disk; no migration in R1 |
| Nested projects navigator list | Not the Project home; sidebar folder-Projects + Project home are canonical |
| Soft-focus vs settings/Sources/Skills | Soft-focus filters the list only (P6); settings stay shell-active until a later release explicitly changes that |
| Cloud/remote Project create entry | RESHAPE: preserve the existing user-owned remote connection path; R14 hardens grants, health and disconnect truth |
| Prompt context ordering | TE1 measurement only; the Pi path already separates stable and volatile context, and R1 makes no cache-hit promise |
| Full tool-schema projection | Post-TE1 measured profile work; do not filter by permission mode or promise an unmeasured byte target |
| TaskRunner repeated-failure halt | R6 contract-gate work; current retries are explicit and bounded, not a default five-attempt loop |
| `set-session-labels` action envelope | R4 candidate only after two real callers exist; do not add a handler-only wrapper |

UI product gates for the above live in
`app/apps/electron/src/renderer/lib/r1-product-gates.ts` so later releases can re-enable surfaces
without reverse-engineering deletes.

## Dependencies, risk and rollback

R1 consumes the R0 branch but does not require the rejected R0 visual delta to be accepted. The
source comparison decides whether each candidate hunk is kept, reshaped or removed. Legacy nested
Project data remains a separate migration slice with recovery evidence.

Rollback is commit-group based: source convergence, one-list/navigation, preserved actions,
Project home and localization land separately. No group changes a persisted format. If a useful
v0.11 backend capability cannot be separated from its Board/Project UI safely, classify it LATER
instead of forcing it into R1.

## Verification plan

Run the cheapest sufficient ladder: static caller/route audit → targeted component and data-path
tests → i18n checks and typechecks → non-interactive launch smoke. The owner performs the final
visual/interaction walkthrough; passing tests alone leaves the surfaces `wired but not visually
checked`.

## Canonical updates on completion

Update only this spec, the R1 row in `05-ROADMAP.md`, affected rows in
`08-CRAFT-CAPABILITY-MAP.md`, `11-PRODUCT-MATRIX.md`, `12-PAGE-ARCHITECTURE.md` and the intentional
delta list in `../UI-SPEC.md`. Do not create a completion report or another master plan.
