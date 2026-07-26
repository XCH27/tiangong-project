# 21 — Entry and Overlap Framework Audit (owner review)

> **Status:** synthesis of the six-area entry inventory run on 2026-07-26 against the current tree
> (fa5ee7460, branch `work/fresh-base-spine`), the pinned v0.10.5 snapshot, the R1 binding contract,
> and recorded owner decisions (incl. G7 hover-reveal, 2026-07-26). This is an **owner-review
> proposal, not implementation authorization**: every verdict below is a proposal until the owner
> decides; decisions land in [`../02-DECISIONS.md`](../02-DECISIONS.md), sequencing in the
> [Roadmap](../05-ROADMAP.md), page status in
> [`../12-PAGE-ARCHITECTURE.md`](../12-PAGE-ARCHITECTURE.md). UI numeric values remain governed by
> `docs/UI-SPEC.md` (§12 self-check before any UI commit).
>
> Ground rule for every row: **简化不等于删除** — no MERGE/REMOVE is proposed without a named
> surviving path that covers the whole capability.

Unless noted, code paths are relative to `app/apps/electron/src/`.

## 1. The one-screen skeleton

The destination surface model, as already largely landed in the current tree. This is v0.10.5's
shell with exactly the R1 boundary reshape applied — nothing else moved.

```text
┌ TopBar   sidebar toggle · Craft-logo AppMenu · back/forward ·
│          [compact only: workspace pill → CompactWorkspaceSwitcher] ·
│          browser tabstrip · "+" panel menu · Help (?)
├ Sidebar
│   New Task ······················ THE create trigger (⌘N/⌘T, FAB, menus all alias it)
│   Flagged · Archived ············ filter states of the one Session list (promoted from
│                                   v0.10.5 All-Sessions children when that row was removed)
│   Sources (APIs · MCPs · Local)
│   Skills
│   Automations (Scheduled · Event · Agentic)
│   项目 Projects  [+ hover-reveal, G7]
│     ├ Project row = Workspace ··· THE Project switcher (one row per Workspace-as-Project)
│     │    └ session leaves ······· folder-bound Sessions, each appearing once under its Project
│   对话 Conversations  [+ hover-reveal, G7]
│     └ session leaves ············ folder-less Sessions
│   Settings ······················ 11 registry pages, single home
├ Navigator panel ················· THE Session list (single mount), filter dropdown, search
└ Main content ···················· ChatPage · Source/Skill/Automation info pages · settings pages
```

The invariants that make this a framework rather than a layout:

| # | Invariant | Evidence | Grounding |
|---|---|---|---|
| K1 | **One Session list.** Projects and Conversations are two *scopes* over a single list; flagged/archived/status/label/view/search are predicates, never second homes. | Sole mount `components/app-shell/AppShell.tsx:3487`; predicates `AppShell.tsx:1257–1313`; scopes `AppShell.tsx:1270–1290` | R1 clauses 1, 5, 6; R1-C2 |
| K2 | **One create flow.** Every trigger (10+ global, per-Project `+`, 对话 `+`, empty-state CTA, FAB, deep link, browser prompts) resolves to `routes.action.newSession` → one handler. Context (folder-bound vs folder-less) is supplied by the trigger, with explicit `workdir:'none'` for folder-less. | Handler `context/NavigationContext.tsx:732–832`; `AppShell.tsx:1713` (`handleNewChat`), `:1912` (`handleNewTaskInProject`) | R1 clause 2; R1-C3 |
| K3 | **One Project switcher.** Sidebar Project rows in normal mode (lifted from the removed TopBar `WorkspaceSwitcher`, owner 2026-07-25); `CompactWorkspaceSwitcher` is the compact-mode *renderer* of the same capability, kept only because compact hides the sidebar. | Rows `AppShell.tsx:1974`; removal rationale comment `components/app-shell/TopBar.tsx:204–207` | R1 clause 3 |
| K4 | **One Project-create language.** Local → OS directory picker directly; cloud/remote → `WorkspaceCreationScreen` at the remote step. | `AppShell.tsx:2510–2544`, `:1819–1848`, `:1855` | R1 clause 3 ✅; R14 hardens remote in place |
| K5 | **One menu schema, one hotkey authority.** Native macOS menu, desktop logo dropdown and mobile sheet all render `shared/menu-schema.ts`; shortcuts live only in the action registry (native `registerAccelerator:false`). | `shared/menu-schema.ts:78–222`; `renderer/actions/definitions.ts:3` (byte-identical to v0.10.5); `main/menu.ts:134` | v0.10.5 upstream design |
| K6 | **One settings home.** 11 pages from one registry drive navigator, logo-menu submenu, sidebar row and ⌘,. Label *definitions* live only here (clause 5); Workspace settings page is the Project settings authority (clause 4). | `shared/settings-registry.ts:37–46`; `pages/settings/settings-pages.ts:33–45` | v0.10.5 (registry byte-identical); R1 clauses 4–5 |
| K7 | **Dormant stays dormant.** Board/Kanban/TaskEditor have zero shell entries (typed `board` route only); nested v0.11 projects are compatibility deep links (list mode = redirect hint; `ProjectInfoPage` has no Sessions tab); no permanent All Sessions entry (legacy kind redirects). | `MainContentPanel.tsx:383–388`; `AppShell.tsx:3444–3459`, `:3521–3524`; `pages/ProjectInfoPage.tsx:33` | R1 clauses 1, 4, 9; `lib/r1-product-gates.ts` |
| K8 | **G7:** sidebar trailing row meta and `+` actions stay hover-reveal at rest. No proposal in this document touches that decision. | `AppShell.tsx:2510`, `:1985`, `:2563` | Owner decision 2026-07-26 |

## 2. Overlap clusters — decisions requested

Every duplication/overlap worth an owner decision, ordered by severity of confusion. Verdicts are
proposals. MERGE/REMOVE rows name the surviving path that covers the **whole** capability.

| # | Capability | Current entries (evidence) | Origin | Problem | Proposed verdict | Surviving path (whole capability) |
|---|---|---|---|---|---|---|
| O1 | Mark all sessions read | Dormant renderer `components/app-shell/SidebarMenu.tsx:124–131` (no caller passes `allSessions` anymore); RPC intact `transport/channel-map.ts:23`, `shared/types.ts:231`; v0.10.5 home was the All Sessions context menu (snapshot `AppShell.tsx:2277–2293`) | v0.10.5 | **The only confirmed capability loss in the audit.** The All Sessions row was removed correctly per R1, but this small affordance was silently dropped with it — a direct 简化不等于删除 violation | **RESHAPE (restore)** | None exists today — that is the defect. Proposed home: add Mark All Read to the 项目 header context menu (`SidebarMenu.tsx:239` branch) and/or the list-header filter menu, calling the existing `markAllSessionsRead` channel. Owner picks the home (Q1) |
| O2 | Create a Project/Workspace (local or cloud) | Canonical two-action: `AppShell.tsx:2510–2544` (+ ctx-menu mirror `SidebarMenu.tsx:242–260`); compact Add Workspace runs the full v0.10.5 three-choice flow incl. a name+location step desktop no longer offers `CompactWorkspaceSwitcher.tsx:117, :168`, `AddWorkspaceStep_CreateNew.tsx:118`; thin-client name-only create `components/workspace/WorkspacePicker.tsx:43–53, 103–121` | mixed (fleet canonical; v0.10.5 variants) | Three creation languages for one act; the R1 slice-1 inventory already carries this exact variant set as an owed RESHAPE | **RESHAPE** | Nothing removed. The sidebar two-action language (local → OS picker, cloud → `WorkspaceCreationScreen` remote step) becomes the one language; compact reuses those two actions instead of its own entry; `WorkspaceCreationScreen` survives as the cloud/remote home (R14); boot-time `WorkspacePicker` stays (pre-shell, no substitute) and converges presentationally |
| O3 | Project switcher implementation | Sidebar rows `AppShell.tsx:1974` / `LeftSidebar.tsx:219`; `CompactWorkspaceSwitcher.tsx:43` carries a *private* parallel workspace list, create entry, remove guard and reconnect handling | v0.10.5 (drawer) + fleet (rows) | One switcher per viewport holds, but two implementations of list/create/remove drift independently | **RESHAPE** | Both surfaces stay (compact hides the sidebar — deleting the drawer loses switching outright). One shared workspace-list model + one select/create/remove command set (`handleRemoveProject` `AppShell.tsx:1897`, `openAddProject` `:1876`); drawer becomes a renderer only |
| O4 | Filter the one list by Project | Filter dropdown Projects submenu filters by **nested v0.11 `projectId`** `AppShell.tsx:3053–3100` (applied `:1360–1380`; legacy fallback `handleJumpToProjectSessions` `:516–537`) — while sidebar scope and group-by-project use **`workspaceId`** (`:1270–1277`, `:3545–3550`) | v0.11-added | Two "Project" meanings on one list — the read-side twin of the nested-`projectId` write that `r1-product-gates` already hides | **RESHAPE** | Project narrowing fully survives via workspace scope + group-by-project. The nested-`projectId` submenu is re-pointed at workspace folders **or** gated behind `lib/r1-product-gates.ts`, kept reachable only while residual `projectId` data exists (Q5) |
| O5 | One name for the one create act | Same flow labeled four nouns: 新建任务/New Task (`AppShell.tsx:2323`, `:1985`), 新建聊天/New Chat (`main/menu.ts:108–113`, menus), 新建会话/New Session (`SessionList.tsx:790–825`, `TopBar.tsx:229`), 新建对话 (对话 `+` `AppShell.tsx:2563`); plus orphaned i18n key `projectInfo.newSessionButton` | v0.10.5 + fleet | The framework says "one create flow" but the UI speaks four languages for it | **RESHAPE (wording only)** | Every trigger stays exactly where it is; only i18n catalogs converge on the R1 vocabulary (New Task global/project) across all seven locales in one pass; the dead key is dropped with the pass. Folder-less wording needs the owner's call (Q4) |
| O6 | Session actions on sidebar leaf rows | Leaves render sessions under 项目/对话 (`AppShell.tsx:1954–1972`, `:2016–2035`) but expose **no context menu**; the shared action definition (`SessionMenuParts` + `useSessionMenuActions`) is consumed only by `SessionItem.tsx:144–171`, `MainContentPanel.tsx:392–407`, ChatPage header | fleet-added | Right-clicking a sidebar session silently does nothing — R1-C9 ("one shared action definition wherever a session row renders") doesn't reach this renderer | **RESHAPE** | Both surfaces stay (clause 1 sanctions the tree). Attach the *existing* shared `SessionMenu` definition to leaf rows — or the owner explicitly declares leaves navigation-only (Q2). No new menu is written either way |
| O7 | Move/copy to another workspace | `SendToWorkspaceDialog.tsx:46` (sessions; mounted `AppShell.tsx:3785`) and `SendResourceToWorkspaceDialog.tsx:57` (sources/skills/automations; callers `SourcesListPanel.tsx:152`, `SkillsListPanel.tsx:121`, `AutomationsListPanel.tsx:344`, `MainContentPanel.tsx:224`) each hand-roll the same remote-workspace row list; the latter's header admits "Adapted from SendToWorkspaceDialog" | v0.10.5 | Copy-derived twin picker chrome; the two *jobs* are genuinely distinct and must both survive | **RESHAPE** | Both dialogs remain reachable exactly where they are; extract one shared workspace-target list body (in the spirit of `packages/ui FilterableSelectPopover.tsx:36`) consumed by both shells. Feeds O2/O3's shared list model |
| O8 | Programmatic create-with-prefill helper | `AppShellContext.openNewChat` (`App.tsx:1587–1611`; context `context/AppShellContext.tsx:144`; destructured unused `AppShell.tsx:245`) duplicates the create flow outside the route path — zero callers in current tree **and** in v0.10.5 | v0.10.5 (legacy) | A second create handler beside the one route path is exactly the drift R1 exists to prevent | **MERGE** | `routes.action.newSession({input, name, workdir:'none'})` via `NavigationContext.tsx:732–832` provably covers the full capability (name rename at `:785–787`, input prefill, folder-less). The context member delegates to `navigate(routes.action.newSession(...))` or is dropped once confirmed caller-less |
| O9 | Keyboard-shortcuts reference page | Dead duplicate `pages/ShortcutsPage.tsx:1` — zero importers in current tree and v0.10.5 (`pages/index.ts:19` re-exports only the settings variant; stale comment `lib/navigation-registry.ts:167`) | v0.10.5 (dead there too) | Two full implementations of one page; one is unreachable inherited debt | **REMOVE** | `pages/settings/ShortcutsPage.tsx` — routed (`MainContentPanel.tsx:242`, `settings-pages.ts:43`), reachable via Settings navigator, Help menu and ⌘/ (`main/menu.ts:251–255`), and renders **both** registry-driven and component-specific sections (`:136–161`); nothing in the dead file is unique |
| O10 | Nested-project name prompt | `components/projects/CreateProjectDialog.tsx:28` — zero import sites (rg-verified; v0.11.1 caller wiring dropped when project-add became the direct OS picker) | v0.11-added | True dead code; not reachable even through dormant/gated code | **REMOVE** | Local create = direct picker `AppShell.tsx:1876`; cloud = `WorkspaceCreationScreen` remote `AppShell.tsx:3795`; compact = `CompactWorkspaceSwitcher.tsx:168`; nested deep links keep rendering via `ProjectsListPanel`/`ProjectInfoPage` without this dialog. Git history retains it if nested-Project creation ever re-opens |
| O11 | Board quick task-title composer | `components/app-shell/kanban/NewTaskComposer.tsx:20` — zero callers | v0.11-added | Orphan inside the dormant Board set | **REMOVE** | `KanbanBoardContainer.tsx:317` quick-add + `TaskEditor.tsx:860–869` (sole `createTask` RPC caller) — the complete task-authoring capability survives inside the same dormant set; zero user-visible change |
| O12 | Navigator chrome wrapper | `components/app-shell/NavigatorPanel.tsx:1` — referenced only by a layout comment (`AppShell.tsx:195`); equally dead in the v0.10.5 snapshot | v0.10.5 (dead there too) | Inert weight suggesting a second navigator chrome exists | **REMOVE** | AppShell's inline navigator slot (`AppShell.tsx:2607–3570`, PanelHeader + content) already provides 100% of the described chrome; nothing user-facing is wired to the wrapper |
| O13 | §4 page-state standard (error/denied/offline/recovery) | Shared `components/ui/surface-state.tsx` has **zero production callers** — sole importer is the playground (`playground/registry/surface-states.tsx:11`). Pages hand-roll: `Info_Page.tsx:79–99`, `ProjectInfoPage.tsx:44,63`, `App.tsx:251`; denied/offline absent from every usable info page | fleet-added (standard), v0.10.5 (hand-rolled states) | The mandated standard (12-PAGE-ARCHITECTURE §4: "do not hand-roll a state") is adopted nowhere | **RESHAPE (adoption)** | `surface-state.tsx` stays the single state-component home; existing hand-rolled error surfaces migrate onto it page-by-page, riding each page's owning slice — adoption, not deletion; `Info_Page` can delegate its error branch without API change |
| O14 | Deep-link residue for forbidden surfaces | `board` and legacy `allSessions` prefixes remain parseable (`shared/route-parser.ts:66–68`) and accepted by `main/deep-link.ts:117–149`; a literal `craftagents://board` renders the Board full-width (`MainContentPanel.tsx:383–388`) | v0.10.5 + v0.11 | Shell is clean, but an external link can resurrect a surface R1 forbids as a default destination | **LATER (gate)** | All viewing capability lives in the one Session list scopes. Within the existing LATER verdict on the Kanban set: gate the two prefixes in `lib/r1-product-gates.ts` rather than deleting parser/Board code the future task-center reuses (Q6) |
| O15 | What's New / release notes | Only entry is the Debug submenu (`DesktopAppMenu.tsx:307–315`, `mobile-menu-pages.ts:142–148`), which renders only when `isDebugMode` — packaged builds have **no** entry and the unseen-badge never shows. v0.10.5 had a permanent sidebar row (snapshot `AppShell.tsx:2483`) | v0.10.5, moved by fleet (documented accepted delta) | The move itself is owner-accepted and not re-litigated; the debug-only *reachability* in packaged builds may be unintended | **LATER (owner Q3)** | Wiring is intact (`handleWhatsNewClick` `AppShell.tsx:1577`; overlay `:3758`) — re-exposing a non-debug entry later is a one-line menu addition, not a rebuild |
| O16 | Label "identity details" section | `pages/settings/LabelsSettingsPage.tsx:143` — fleet-added, absent from both snapshots, display-only with an explicit "bindings not implemented" caption | fleet-added | An unwired surface sits inside a usable settings page, against the G6 rule (unwired = preview-gated) | **LATER (preview-gate)** | Keep the capability: move the section behind the component-playground preview gate until a label-identity spec wires real bindings; the Labels page itself is untouched |
| O17 | Add-Project buttons on the demoted nested-projects panel | Header `+` and empty-state Add render on the redirect/hint-only surface (`AppShell.tsx:3396–3403`, `ProjectsListPanel.tsx:74–75`); both call the same `openAddProject` as the sidebar | v0.11-added | A deprecated surface keeps a live create affordance duplicating the canonical entry | **LATER** | Sidebar 项目 `+` → Local folder (`AppShell.tsx:2510–2532`) and its ctx-menu mirror already call the identical handler. The buttons retire together with the panel's own retirement (never move-and-remove in one breath) |
| O18 | Second project-settings editor | Nested `ProjectInfoPage` Settings tab (`pages/ProjectInfoPage.tsx:202`) edits the nested v0.11 Project record beside the canonical `WorkspaceSettingsPage` (`settings-pages.ts:38`) | v0.11-added | Two editable "project settings" surfaces in code (one deep-link-only) | **LATER** | `WorkspaceSettingsPage` is canonical; `ProjectInfoPage` stays a dormant compatibility route until a nested-data migration decision — deletion is out of R1 scope |
| O19 | Kanban appearance prefs; TaskEditor skill picker | `atoms/kanban.ts:40` persists with no reachable writer (UI removed per gate table; v0.11.1 had it at `AppearanceSettingsPage.tsx:496`); `components/ui/SkillSelectorPopover.tsx:27` has its sole caller in dormant `TaskEditor.tsx:308` | v0.11-added | Settings/pickers stranded with the dormant Board | **LATER** | Both stay parked with the Board set (`r1-product-gates.ts` rows) so a task-center decision re-exposes or deletes them together; deleting now breaks the deliberately-dormant TaskEditor |
| O20 | Dormant SidebarMenu branches + stale default | Caller-less `allSessions/status/flagged/labels/views` branches (`SidebarMenu.tsx:121`, `:143–166`); legacy `'nav:labels'` in the collapsed default (`AppShell.tsx:657`) | v0.10.5 | Dead branches shared with the file that must host the O1 restoration | **LATER** | Capabilities already have surviving homes: statuses/views via the filter dropdown (`AppShell.tsx:3017`, `:2939`), label definitions via Settings→Labels, assignment via the session menu. Clean only **after** O1 lands (same file) |
| O21 | Registry rows that misstate code reality | P-01 command palette (never existed — `components/ui/command.tsx:24` unrouted in both trees); P-28 share home says "Project settings" but share/update/revoke lives in ChatPage (`pages/ChatPage.tsx:487–513`); P-14 "Document route" (viewing is a `FileViewer` overlay, no route); P-08 help route (help = external doc-links + settings/shortcuts); P-03 "usable" vs T1 "not implemented" tell two stories; §2 omits routed `AutomationInfoPage` (`MainContentPanel.tsx:338`), the playground window, browser empty-state page, startup screens | doc drift | The coverage authority cannot arbitrate duplication while it overclaims or omits routed pages | **RESHAPE (doc-only)** | Correct the rows to the actual code homes cited here; genuinely missing capabilities (palette, document editor) stay *not-implemented target rows*, never "usable" claims; add the four missing surfaces to §2. No code or capability changes |
| O22 | Second, wrong code registry | `renderer/lib/navigation-registry.ts:107–173` claims to define all navigation but holds placeholders, omits messaging/server settings and the skills/automations/projects navigators; real authorities are `shared/route-parser.ts`, `shared/settings-registry.ts`, the `MainContentPanel` switch | v0.10.5 (equally stale upstream) | A misleading second registry is the exact duplication pattern this audit exists to kill | **RESHAPE** | The three real authorities stay the single truth; `navigation-registry.ts` shrinks to the `DetailsPageMeta` type it actually provides (live importers exist) or is updated to mirror reality — either way no route/page capability changes |

## 3. Healthy structure to keep

These clusters *look* like duplication and must not be "simplified". Recording them is as important
as the decisions above.

| Pattern | Evidence | Why it is correct |
|---|---|---|
| **Many create triggers, one handler.** ~10 global triggers + context-bound `+` buttons + FAB + deep link + browser prompts | All resolve to `routes.action.newSession` → `NavigationContext.tsx:732–832`; verified none creates a Task record or second path | R1 clause 2's target state. Duplication would be a second *handler*; there is none. Do not "deduplicate" honest triggers |
| **One Session list, many predicates.** Scopes, flagged/archived, status/label/view, search, grouping | Single mount `AppShell.tsx:3487`; `useSessionSearch` inside the component; grouping `SessionList.tsx:287–527` | Filters are states, not homes (R1 clauses 1/5/6). Archive keeps Restore on the shared command path |
| **One shared session-action definition.** Desktop dropdown, compact drawer, batch menu, MultiSelectPanel | All consume `SessionMenuParts` + `useSessionMenuActions` (`SessionItem.tsx:144–171`, `MainContentPanel.tsx:392–407`) | R1-C9 verified by caller audit; the only gap is the sidebar leaves (O6) |
| **Compact/full renderer pairs over shared state.** WD selector, model, permission-mode, sources; remove-workspace two renderers | `use-working-directory-state`, `picker-mode.ts:36` truth table, `SourceSelectorPopover.tsx:18`/`CompactSourceSelector.tsx:31`, shared `removeWorkspace` guard (`AppShell.tsx:1897`, `CompactWorkspaceSwitcher.tsx:131`) | R1 dedup table explicitly allows differing renderers over the same commands. This is the model O2/O3/O7 should converge *toward* |
| **One folder-picking mechanism.** Five caller surfaces, one hook, one remote modal | `hooks/useDirectoryPicker.ts:24` + `ServerDirectoryBrowser.tsx:41` (many mounts) | Multiple mounts of one shared modal are a pattern, not duplication |
| **Settings scope hierarchies.** AI defaults/workspace overrides vs session selectors; workspace default sources vs session toggles; permission default/patterns/session mode split across pages | `AiSettingsPage.tsx:980` sole default-thinking writer; composer writes only `SessionOptions`; split identical to v0.10.5 | "One home, in-context assignment elsewhere." No store key is writable in two permanent homes |
| **Trigger-level repeats over one authority.** Update check (About row, native menu, debug menus); theme quick-toggle (⌘⇧A) beside the Appearance control; multiple doc/help entries | One auto-update authority; one `ThemeContext`; all URLs through `doc-links` | All repeats exist identically in v0.10.5; removing any deletes a baseline affordance |
| **Entry-less legacy compat.** `allSessions` kind parses, redirects to Projects overview; nested-projects panel renders only for detail deep links | `AppShell.tsx:3521–3524`; `:3435` | Old links keep working with no permanent third aggregate entry — exactly the contract's shape |
| **Debug-gated playground.** Separate entry point hosting canvas preview, SurfaceState walker, dormant Kanban previews; mobile preview mounts the *production* `SessionList` | `main/menu.ts:243–249`; `SessionListMobilePreview.tsx:2` | The sanctioned G6 preview surface; component reuse means zero implementation drift |
| **`ActiveTasksBar` is not Kanban.** | `ActiveTasksBar.tsx:47` via `ActiveOptionBadges.tsx:159` | Despite the name these are v0.10.5 per-session background tool tasks — must not be swept into Board cleanup |

## 4. Execution order

R1-sized slices; each is one coherent, commit-able unit. 🚶 = needs an owner walkthrough before
merge; ✋ = blocked on an open question in §5.

| Slice | Contents (cluster rows) | Depends on | Flags |
|---|---|---|---|
| **S1 — Restore Mark All Read** | O1 (list-header menu, current filtered view; G9) | Q1 answered | landed `wired but not visually checked`; 🚶 owner should see the restored action |
| **S2 — Dead-code hygiene** | REMOVE O9/O12; MERGE O8; KEEP-LATER O10/O11 after the owner's four-check review | none | landed; zero user-visible change, verified by caller audit + typecheck |
| **S3 — One workspace-create/switch language** | O2 + O3: shared workspace-list model + command set; compact drawer becomes renderer-only and adopts the two-action create language | none | 🚶 (compact mode changes are visible; walk the drawer before/after) |
| **S4 — Shared workspace-target list body** | O7 (+ boot `WorkspacePicker` presentational convergence from O2) | S3 (consumes its shared list body) | — |
| **S5 — Project-identity read-side + deep-link gates** | O4 nested `projectId` filter gated in wave 1; O14 (`board`/`allSessions`) remains owner-gated | Q5 answered by docs-consistent delegation; Q6 open | O4 landed; O14 open; no deletion of Board/parser code |
| **S6 — Create-verb i18n catalog pass** | O5 (all seven locales in one slice; drop `projectInfo.newSessionButton`) | Q4 answered by G8 | landed; i18n gates + UI-SPEC §12 self-check passed |
| **S7 — Sidebar leaf session menus** | O6 (attach existing `SessionMenu` definition, or record navigation-only decision) | Q2 answered | ✋ 🚶 |
| **S8 — Registry truth pass** | O21 page rows corrected + O22 `navigation-registry.ts` reduced to its live metadata type; O16 labels preview gate remains | none | non-visual truth pass landed; O16 remains owner-gated |
| **Standing rule (no slice)** | O13: SurfaceState adoption rides each page's owning release slice — never a big-bang restyle | per page | Record as a review-checklist item |
| **Parked (no action this cycle)** | O15, O17, O18, O19, O20 (LATER set; O20 unlocks only after S1) | as noted | — |

S2 and S8 can start immediately and in parallel. S3→S4 is the only hard code dependency.

## 5. Open questions for the owner

1. **Mark All Read home (O1) — answered (G9):** current Session-list header menu; action follows
   the current filtered view.
2. **Sidebar session leaves (O6):** full shared context menu, or explicitly navigation-only? Today
   right-click silently does nothing — either answer is fine, silence is not.
3. **What's New (O15):** is debug-only reachability in packaged builds the intended end state of the
   accepted move, or should a non-debug entry (one menu line) return?
4. **Create-verb vocabulary (O5) — answered (G8):** every trigger converges on New Task/新建任务;
   folder choice routes the resulting Session to Projects or Conversations.
5. **Nested `projectId` filter (O4) — answered by delegated docs-consistent call:** gate it off;
   Project narrowing survives through the Workspace/folder scope.
6. **Deep-link holes (O14):** close `craftagents://board` and `allSessions` via gate now, or accept
   the residue until the task-center release?
7. **Compact local-create (O2/S3):** should compact's local path also go straight to the OS folder
   picker, dropping the name+location step there too?
8. **Labels identity section (O16):** preview-gate until a spec wires real bindings, or keep it
   visible as an explicitly display-only section?

### Honesty note — where the inventory is thin

The six areas covered: shell navigation, creation flows, session list/filters, settings, switcher/
picker/dialog variants, and the pages-vs-registry join. **Not** inventoried: ChatPage/composer
internals beyond the option pickers, the right sidebar sections, BrowserPane internals, the terminal
surface, and the companion `app/apps/webui` app (only its playground preview was joined). No claim
in this document extends to those surfaces; a later audit slice should cover them before any
framework claim is called complete. All 41 "not implemented" P-rows in the page registry were found
honestly labeled; no registered-usable page lacks code entirely.
