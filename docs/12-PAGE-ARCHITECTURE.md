# 12 — Page Architecture (full frontend inventory + frontend track)

> The complete page/surface inventory of the target product, the state standard every surface must
> meet, and the rules that let frontend work run **ahead of** backend behavior without repeating the
> display-only catastrophe. Companion breadth index: [`11-PRODUCT-MATRIX.md`](11-PRODUCT-MATRIX.md).
> Visual/component rules stay in [`UI-SPEC.md`](UI-SPEC.md); owner UI
> philosophy (“do not add entities without necessity”; simplify Craft, do not invent) binds everything here.

## 1. Shell regions

**Current implementation, checked 2026-09-21:** `5a510cf1d` replaced `app/` with Craft
**v0.13.4**; the previous Fleet tree is preserved at `7a8f6d5fa`. Paths and mounted behavior below
refer to the current tree. Earlier acceptance and test counts do not transfer across this reset.
The target inventory and owner decisions remain requirements, not evidence of implemented UI.

The current window uses Craft `AppShell` + `PanelStackContainer`.
`app/packages/shared/src/layout` is absent after the reset; its earlier model is archived, not
an available implementation dependency.

`AppShell.tsx` + `MainContentPanel.tsx` are Craft's current host, but Fleet's target navigation is
panel-first: a list stays visible while details, configuration, previews and component tools open in
the existing workbench/dialog layer. A route may remain as a deep-link and accessibility anchor,
but it must not create a second persistent list or force a page drill-in when a panel is sufficient.
Settings is one settings surface with a category navigator and content panels; its categories are
not separate product homes. Archive management remains a settings projection over the Session
authority, not a second conversation home.

**Do not add an unrelated capability by adding an `isXNavigation` branch or a new sidebar row.**

The table distinguishes current code from target pane names; there is no mounted generic pane registry.

| Region | Current code / target seam | Notes |
| --- | --- | --- |
| Layout engine | `components/app-shell/PanelStackContainer.tsx` | Current horizontal stack; the registered layout-tree target is `not implemented` |
| Nav sidebar | target pane `nav-sidebar` | chrome, not a destination |
| Navigator | target pane `navigator` | The single Conversation/entity list when the sidebar is unavailable; filters and scopes are predicates, not sibling list homes |
| Main | target pane `main` | conversation is one pane |
| Workbench | target pane `workbench` | plugin and tool surfaces |
| Production surfaces | target pane kinds (`surface:canvas`, documents, browser, timeline) | Fleet's own; open as panes, never as sidebar rows |
| Dialog layer | shared dialog/drawer components | pickers, confirmations |
| Session files | `components/right-sidebar/SessionFilesSection.tsx`, mounted by `SessionInfoPopover.tsx` | The file list survives in the session popover/drawer. `RightSidebar.tsx` and its Component registry are absent; the general right workbench is `not implemented`. |

What still runs today is Craft **v0.13.4** `AppShell` + `PanelStackContainer`. That is the current
host. Cindy work is capabilities (plugins, skills, remote, assistants), not a new overlay chrome.

### User-owned panel layout — foundation contract

The owner requested resize, drag/reposition, reordering, floating and restore for conversation and
tool panels. Left tool entries/right panels are defaults, not permanent locks. Those in-window
behaviors execute only after the R0 baseline exit, with the early host foundation in
[`specs/R18-right-workbench.md`](specs/R18-right-workbench.md), using mounted Files and a real Notes RPC consumer
before new domain Components. Files survives through the session popover; the former Notes
host is absent and must not be treated as mounted. R15 distribution, R9 memory and advanced/native-window R18
closure are not prerequisites. The current horizontal stack wires sizing; the prior pure layout
tree, Component resolver and right-workbench host were removed by the reset. Their target behavior
is `not implemented`.

The host keeps stable panel ids, Workspace/Session binding, drafts and native resource ownership
while moving views. Keyboard move/resize, local-window geometry, missing-component recovery and
reset-to-default are required. Do not equate installed `@dnd-kit` or a layout type with working
docking, and do not replace Craft's visual tokens to obtain these behaviors.

### No-duplicate navigation rule

The product-facing work list is one left sidebar with Project groups and folderless Conversations.
Workspace remains the visible configuration/routing boundary. Project selection changes context within
that Workspace; it does not select another Workspace. Board has a separate entry over existing records.
Conversation activity is a derived running/attention/idle projection, not Board's manual categories.
Tool and resource lists/details occupy the contextual right panel or existing content panels reached
through context menus. The panel is a future Cindy-style `RightSidebarShell`/`TabBar` host with a
registered tab-kind seam; it is not a vertical shortcut rail. The later Component registry remains a
separate gated capability.

> **Settled, not open.** The owner rejected building the infinite canvas now ("你不应该现在做无限
> 画布，而且你现在做的无限画布根本都是错误的"), and `FleetLayout` was reverted to
> `PanelStackContainer` because it ignored sashes, board and chrome. On 2026-09-11 the residue of
> that revert — `renderer/layout/{FleetLayout,LayoutRoot,LayoutBridge,registry,ledger,builtinPanels}`
> and `renderer/surfaces/canvas/CanvasPane.tsx`, all with zero production callers, plus three
> orphaned `canvas.*` i18n keys — was removed from that working tree. The shared layout model
> survived that earlier removal, but the 2026-09-21 reset removed it too; retrieve historical
> evidence from `7a8f6d5fa`, never describe that path as present today.
>
> The current host remains Craft `AppShell` + `PanelStackContainer`. Board is again a
> `sessions` view mode; Pages has its own navigator. Both replace the content panel. The pane
> sentences above describe the **R7/R18 target shape**, not today's structure. After the R0 baseline exit, the owner-directed foundation brings the minimum registered host and
> in-window movement before domain Components; R7 reuses it. R18's later gate covers additional
> native-window/advanced behavior, not the minimum host itself.

## 1b. Workspace/Project boundary and current callers

[R1](specs/R1-one-boundary-language.md) owns the 2026-09-22 authorized implementation: AppShell's
single sidebar, the contextual right-panel host, and the existing Project/Session commands. No
`WorkspaceToolRail`, `WorkspaceFooter`, `WorkspaceResourceHome` or `DraftProjectPicker` exists in the
restored baseline; those names are retired. ProjectInfoPage contains resources/settings, not a second
Conversation list. The new empty layout reuses Craft's ChatDisplay/InputContainer seam. This is an
extension of the restored Craft v0.13.4 baseline; earlier Fleet ProjectHomePage and layout engines remain absent.

## 2. Page inventory — current mounted surfaces

| Page / surface | Status | Current evidence and limits |
| --- | --- | --- |
| ChatPage | `wired but not visually checked` | Mounted conversation and existing Session path; prior Fleet footer/revert acceptance does not transfer |
| ProjectInfoPage · SkillInfoPage · SourceInfoPage | `wired but not visually checked` | Original mounted detail pages; Fleet ProjectHomePage was withdrawn; one-boundary consolidation not implemented |
| ShortcutsPage | `wired but not visually checked` | Existing shortcut surface |
| AutomationInfoPage | `wired but not visually checked` | Mounted from `components/automations/` by `MainContentPanel` |
| Board (kanban) | `wired but not visually checked` | `sessions` navigation with `viewMode: 'board'`; the owner-requested independent Board navigator is `not implemented` |
| Pages | `wired but not visually checked` | Upstream mini-app surface; hosted publication is present and still conflicts with Fleet's local-first contract |
| Settings: AI · App · Appearance · Input · Labels · Messaging · Permissions · Preferences · Server · Shortcuts · Workspace | `wired but not visually checked` | Upstream Settings pages; Server exposes URL/token configuration. Fleet's one-code per-device pairing flow is `not implemented` |
| Composer — Fleet execution-target selector | `not implemented` | `ComposerLeadingChips` / `NewSessionRunTarget` are absent after reset; existing remote Workspace routing is not this interaction |
| Design-system playground window | `display-only` | Debug preview host; no Fleet canvas preview currently exists |
| Browser empty-state page | `wired but not visually checked` | Auxiliary BrowserPane window; the earlier in-shell embedding is absent |
| Onboarding · Reauth · WorkspacePicker | `wired but not visually checked` | Existing startup/recovery callers; no new visual acceptance claimed |

These are the mounted Craft **v0.13.4** surfaces. Fleet's product exclusions still apply: upstream
telemetry, hosted sharing, update endpoints and cloud documentation have not been admitted merely
because the reset restored them. Look rules remain in [`UI-SPEC.md`](UI-SPEC.md).

**Every change to one of these starts from the matching upstream component** —
`源码参考/software/craft-agents-oss/` at the same path. Diff it, then justify each delta. This line
was deleted on 2026-09-11 and both of this repo's UI regressions followed within two days: an agent
invented button sizes and a hand-rolled menu, and another produced a redesign image and treated it
as the spec. Restored, and now also stated as Step 0 in root `AGENTS.md`.

**"Keep Craft's style" is not "keep every old function."** The visual system and the proven
interactions are what carry over. Which functions live, merge, move or die is the owner's call, made
per surface — so when a page is retired, migrate what the owner kept and drop what they did not,
rather than relocating every old button on the assumption that preservation is safety.

## 3. Page inventory — target (the full product)

Status is per capability vocabulary; every target surface obeys **one primary home per
capability**. This inventory is the design-coverage list — building any item still requires its
domain spec (or an owner request) and the frontend-track rules in §5.

| #   | Surface                                          | Surface IDs                  | Domain (matrix row)             | What it shows / does                                                                                                                                                             | Primary home                                                                                                        | Status                                   |
| --- | ------------------------------------------------ | ---------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| T1  | Project resources (Workspace-scoped)                | P-03                         | Project/Workspace               | files, assets, deliverables and settings of one Project; one switcher; no Session-list copy                                                                                      | existing sidebar + pages, re-worded                                                                                 | `not implemented` as Fleet Project home; original nested ProjectInfoPage remains |
| T2  | Deliverables view (`deliverables/` + provenance) | —                            | Files/ArtifactRef               | accepted outputs of a Project                                                                                                                                                    | ProjectInfoPage extension                                                                                           | `not implemented`; the former deliverable convention helper is absent |
| T3  | Library view                                     | P-12                         | ArtifactRef & Library           | selected, indexed, provenance-tracked assets; exact versions                                                                                                                     | R5 page/extension decision                                                                                          | `not implemented`                        |
| T4  | Jobs / generations panel                         | P-36, P-49                   | AIGC jobs                       | running/queued/failed generation jobs, placeholders→results                                                                                                                      | R11 surface decision                                                                                                | `not implemented`                        |
| T5  | Canvas                                           | P-34                         | Canvas                          | spatial command surface per [`13-ORCHESTRATION.md`](13-ORCHESTRATION.md) §4 (cards, edges, Space/Workflow dual modes)                                                            | new page inside shell (R7; DOM family committed per E5a — React Flow default, custom DOM+SVG fallback, spike picks) | `not implemented`                        |
| T6  | Workflow editor/run view                         | P-46, P-47                   | Workflows                       | finite DAG definition + run status                                                                                                                                               | new page (R8)                                                                                                       | `not implemented`                        |
| T7  | Delegation / team view                           | P-20                         | Multi-agent                     | child runs, budgets, RunReports — projections of Session tree                                                                                                                    | Inline `DelegationStrip` on parent ChatDisplay first (no Team page); deeper inspector remains R6                   | `not implemented`; prior `DelegationStrip` and Fleet brief/report gates are absent |
| T8  | Cost, usage & context view                       | P-29, P-30                   | Model routing/cost/context      | per-session/project usage, cache/prefix breaks, prompt/tool/context component inventory, source scope and grants                                                                 | TE1/R3 existing session info first; R17 closes any remaining surface gap                                            | `not implemented`                        |
| T9  | Memory browser & curation                        | P-31                         | Memory & experience             | layered memory files, consolidation log, injected-share display, pin/correct/delete                                                                                              | new page (R9)                                                                                                       | `not implemented`                        |
| T10 | Video editor                                     | P-35                         | Video                           | timeline NLE over project media                                                                                                                                                  | R12 native page decision                                                                                            | `not implemented`                        |
| T11 | Design editor                                    | P-39                         | Design surface                  | schema-backed design docs (E11)                                                                                                                                                  | R10 native page decision                                                                                            | `not implemented`                        |
| T12 | Deck/motion editor                               | P-41, P-42                   | Deck/motion                     | native deck doc + honest export                                                                                                                                                  | R13 native page decision                                                                                            | `not implemented`                        |
| T13 | Web artifact preview+iterate                     | P-40                         | Web artifacts                   | generated site preview, versions                                                                                                                                                 | R10 existing preview extension first                                                                                | `not implemented`                        |
| T14 | Remote targets manager                           | P-25                         | Remote/cloud                    | user-owned instances, grants, health, disconnect truth                                                                                                                           | R14 WorkspaceSettings extension (P7)                                                                                | `not implemented`                        |
| T15 | Capability loadout manager                       | P-32, P-56, P-57, P-58, P-59 | Capabilities/Skills/Marketplace | install / loadout / runtime separation (E2), package trust and rollback                                                                                                          | R15 existing Skills/Sources pages extension plus P-56..P-59                                                         | `not implemented`                        |
| T16 | Evidence/browser capture review                  | P-15, P-16                   | Browser & evidence              | captures, annotations, links to sessions/artifacts                                                                                                                               | R3/R5 BrowserPane + timeline extension                                                                              | `not implemented`                        |
| T17 | Task changes review                              | P-54, P-60                   | Git delivery (EXEC-13)          | per-task diff of project files; verbs 查看改动/应用/放弃/创建 PR per C4 ladder (read-only diff first; apply/discard with R6 worktrees; PR with R14); branches never user-managed | ChatPage/task drawer extension                                                                                      | `not implemented`                        |

New-page justification rule stays binding: a new surface only when the capability genuinely must be
visible and no existing Craft surface can host it (P5). Extensions-of-existing-pages are always the
first choice (T2, T7, T8, T13, T14, T15, T16 are deliberately extensions, not new pages).

## 3A. Canonical surface registry (pages, panels, drawers and command surfaces)

The sixteen target pages above are product-level destinations, not the whole UI. Every registry
capability must map to a surface below before it can be called frontend-covered. A surface can be a
route, panel, drawer, dialog or command view; its host is an existing shell region unless a module
packet explicitly proves a new host is necessary. These IDs are the cross-document join keys used by
[`modules/PACKET-INDEX.md`](modules/PACKET-INDEX.md).

| ID   | Surface                                                                                                                                | Host / primary home                        | Registry rows                               | State                                                                                                                                                                                                                                         |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-01 | App shell and navigation; global search command surface                                                                                | Global shell                               | CORE-01, CORE-10                            | Craft shell/navigation and Session search `wired but not visually checked`; Fleet cross-domain global search `not implemented` |
| P-02 | Session work/conversation, progressive composer and stream inspector; global/Project New Task triggers share one Session path (P10)    | Conversation                               | CORE-03                                     | Craft conversation, steering and mid-stream queue `wired but not visually checked`; prior Fleet turn metadata, changes summary and transcript/file revert surface `not implemented` |
| P-03 | Project resources and draft context picker (revised P6/R1)                                                               | Main content                               | CORE-02                                     | Inherited Workspace switcher and old-record routes `wired but not visually checked`; R1 Project context picker and resource-home changes `not implemented` after rollback |
| P-04 | Structured task detail/activity and later task-center projection; Kanban is not the default product surface                            | Task inspector                             | CORE-04                                     | Craft Task store/TaskRunner `wired but not visually checked`; Fleet task-center surface `not implemented` |
| P-05 | Settings navigator and preference forms                                                                                                | Settings                                   | CORE-05, CORE-10                            | upstream Settings forms `wired but not visually checked`; Assistant identity/loadout UI `not implemented`; no ExpertKit-as-label implementation is admitted |
| P-06 | Search and label filters over the one work list; archive management in Settings; global Session/Project-file/Settings/route projection | Sidebar / Settings / command view          | CORE-06, INFO-06                            | Craft Session search and label/project filters `wired but not visually checked`; Fleet archive-in-Settings and cross-domain command projection `not implemented` |
| P-07 | First-run and model connection setup                                                                                                   | First run / Settings → Model               | CORE-07                                     | Craft first-run/model connections `wired but not visually checked`; complete §3B interaction contract `not implemented` |
| P-08 | Help, local docs and support links                                                                                                     | external doc-links + Settings/Shortcuts    | CORE-08                                     | upstream hosted doc links `wired but not visually checked`; Fleet local user-facing documentation routing `not implemented` |
| P-09 | Update channel, release notes and recovery                                                                                             | Settings / dialog                          | CORE-09                                     | Craft update/release-note path `wired but not visually checked`; independent Fleet update channel `not implemented` |
| P-10 | User-controlled resize, move, reorder, in-window float/re-dock and layout restore | Existing shell extended by registered panel host | CORE-11 | fixed-column sizing wired but not visually checked; generic registration, user movement and layout restore not implemented; early R15/R18 foundation before domain Components |
| P-11 | Workspace file browser and file actions                                                                                                | Project home / drawer                      | INFO-01                                     | SessionFilesSection and ProjectHomePage directory/search/preview paths `wired but not visually checked`; advanced file history/actions remain R5 |
| P-12 | Library, versions and asset inspector                                                                                                  | Library route                              | INFO-02                                     | not implemented                                                                                                                                                                                                                               |
| P-13 | Source ingestion and conversion progress                                                                                               | Sources / Jobs                             | INFO-04                                     | Craft source ingestion/conversion `wired but not visually checked`; Fleet provenance extension `not implemented` |
| P-14 | Document editor, preview and co-edit controls                                                                                          | FileViewer overlay / future editor host    | INFO-05, CREATE-16                          | Craft file preview `wired but not visually checked`; native document editing/co-edit `not implemented`; TipTap has a playground caller only |
| P-15 | Browser tabs, navigation and capture controls                                                                                          | BrowserPane / right workbench projection   | INFO-03                                     | separate BrowserPane window/navigation `wired but not visually checked`; Fleet in-shell embedding and evidence capture `not implemented` |
| P-16 | Evidence, citation and provenance review                                                                                               | Inspector / timeline                       | INFO-03, INFO-07                            | not implemented                                                                                                                                                                                                                               |
| P-17 | Import, export and migration wizard                                                                                                    | Dialog / settings                          | INFO-08                                     | not implemented                                                                                                                                                                                                                               |
| P-18 | Permission prompt, approval history and policy explanation                                                                             | Dialog / inbox                             | EXEC-01, EXEC-02                            | Craft permission prompt `wired but not visually checked`; caller-aware policy explanation/approval history `not implemented` |
| P-19 | Terminal session, output and cancellation                                                                                              | Session panel / right workbench projection | EXEC-03                                     | Craft Bash/background execution `wired but not visually checked`; Fleet command-runner panel and persistent interactive PTY `not implemented` |
| P-20 | Delegation tree, brief and run report                                                                                                  | Chat / task inspector extension            | EXEC-04                                     | Craft child Sessions/TaskRunner `wired but not visually checked`; Fleet DelegationStrip, TaskBrief and RunReport inspectors `not implemented` |
| P-21 | CLI runtime connection and capability health                                                                                           | Settings → Terminal                        | EXEC-05                                     | general CLI discovery/handshake and executable CLI Session adapters `not implemented`; upstream SDK/provider lanes remain separate from this target |
| P-23 | Worktree occupancy and cleanup                                                                                                         | Task inspector                             | EXEC-07                                     | not implemented                                                                                                                                                                                                                               |
| P-24 | Inherited execution isolation, limits and denial explanation | Existing settings / approval path | EXEC-08 | inherited mechanisms `wired but not visually checked`; R0/R2 verifies actual boundaries; a second sandbox/profile authority is excluded |
| P-25 | Remote target, grant and disconnect state                                                                                              | Workspace settings                         | EXEC-09                                     | Craft remote Workspace URL/token routing `wired but not visually checked`; Fleet target identity, per-device grants and unified pairing `not implemented` |
| P-26 | Automation schedule and run history                                                                                                    | Task / settings extension                  | EXEC-10                                     | Craft automation schedules/history `wired but not visually checked` |
| P-27 | Messaging channels, delivery and reconnect                                                                                             | Settings / inbox                           | EXEC-11                                     | `not implemented`                                                                                                                                                                                                                             |
| P-29 | Context preview, compaction and token budget                                                                                           | Session / cost inspector                   | INTEL-01, INTEL-02                          | v0.13.4 composer context indicator and existing compaction `wired but not visually checked`; Fleet TE1 ledger/breakdown inspector and exact attribution `not implemented` |
| P-30 | Model capability, routing and cost ledger                                                                                              | Session / Settings → Model                 | INTEL-03, INTEL-04                          | upstream model/thinking selection `wired but not visually checked`; Fleet provider inventory, generic runtime controls, subscription allowances and routing ledger `not implemented` |
| P-31 | Memory layers, consolidation log and curation (pin/correct/delete)                                                                     | Memory route                               | INTEL-05                                    | not implemented                                                                                                                                                                                                                               |
| P-32 | Skill/capability install, loadout and runtime view                                                                                     | Skills/Sources extension                   | INTEL-06                                    | not implemented                                                                                                                                                                                                                               |
| P-33 | Evaluation run, regression evidence and comparison                                                                                     | Diagnostics / Jobs                         | INTEL-07                                    | not implemented                                                                                                                                                                                                                               |
| P-34 | Spatial canvas and node inspector                                                                                                      | Canvas route / right workbench entry       | CREATE-01                                   | `not implemented`; prior canvas preview/workbench entry is absent |
| P-35 | Video sequence, media bin and timeline                                                                                                 | Video route                                | CREATE-02                                   | not implemented                                                                                                                                                                                                                               |
| P-36 | Image generation/editing and result review                                                                                             | Jobs / media route                         | CREATE-03                        | not implemented                                                                                                                                                                                                                               |
| P-37 | Audio, voice and music tracks                                                                                                          | Media / video route                        | CREATE-04                                   | not implemented                                                                                                                                                                                                                               |
| P-38 | Transcript, captions and translation editor                                                                                            | Video route                                | CREATE-05                                   | not implemented                                                                                                                                                                                                                               |
| P-39 | Native design document and object inspector                                                                                            | Design route                               | CREATE-06                                   | not implemented                                                                                                                                                                                                                               |
| P-40 | Web artifact preview and iterate                                                                                                       | Preview route                              | CREATE-07                                   | not implemented                                                                                                                                                                                                                               |
| P-41 | Deck document and slide inspector                                                                                                      | Deck route                                 | CREATE-08                                   | not implemented                                                                                                                                                                                                                               |
| P-42 | Motion composition and render preview                                                                                                  | Deck / media route                         | CREATE-09                                   | not implemented                                                                                                                                                                                                                               |
| P-43 | Storyboard, shots and plan-to-media links                                                                                              | Media route                                | CREATE-10             | not implemented                                                                                                                                                                                                                               |
| P-44 | Templates, brand kits and reusable asset picker                                                                                        | Library / editor drawer                    | CREATE-11                                   | not implemented                                                                                                                                                                                                                               |
| P-45 | Export profile, render progress and delivery receipt                                                                                   | Jobs / deliverables                        | CREATE-12                                   | not implemented                                                                                                                                                                                                                               |
| P-46 | Workflow definition editor and validation                                                                                              | Workflow route                             | ORCH-01                                     | not implemented                                                                                                                                                                                                                               |
| P-47 | Workflow run, inputs, outputs and history                                                                                              | Workflow / task extension                  | ORCH-02                                     | not implemented                                                                                                                                                                                                                               |
| P-48 | Plugin, tool registry, MCP and loadout permissions                                                                                     | Skills/Sources / settings                  | ORCH-03, ORCH-04                            | `not implemented`                                                                                                                                                                                                                             |
| P-49 | Job queue, resource limits, retry and cancellation                                                                                     | Jobs panel                                 | ORCH-05                                     | not implemented                                                                                                                                                                                                                               |
| P-50 | Activity timeline and event detail                                                                                                     | Session / project timeline                 | ORCH-06, EXEC-02                            | Craft SessionEvents timeline `wired but not visually checked`; Fleet caller-aware evidence detail `not implemented` |
| P-51 | Notifications, approvals and inbox                                                                                                     | Inbox drawer                               | ORCH-07                                     | `not implemented`                                                                                                                                                                                                                             |
| P-52 | Diagnostics, health checks and recovery actions                                                                                        | Help / settings                            | ORCH-08                                     | not implemented                                                                                                                                                                                                                               |
| P-54 | Git repository, branch, diff and PR review                                                                                             | Delivery / task extension                  | EXEC-13                                     | not implemented                                                                                                                                                                                                                               |
| P-55 | Effective prompt/tool profile, policy source and agent identity inspector                                                              | Settings / session inspector               | EXEC-14                                     | not implemented                                                                                                                                                                                                                               |
| P-56 | Marketplace hub, catalog filters and trust status                                                                                      | Skills / Sources / settings                | ORCH-03, ORCH-04, ORCH-10, ORCH-11, ORCH-12 | not implemented                                                                                                                                                                                                                               |
| P-57 | Skill detail, compatibility, examples and loadout install                                                                              | Marketplace detail                         | ORCH-10                                     | not implemented                                                                                                                                                                                                                               |
| P-58 | Plugin bundle contents, permissions, dependencies and lifecycle                                                                        | Marketplace detail                         | ORCH-11                                     | not implemented                                                                                                                                                                                                                               |
| P-59 | MCP server tools, resources, auth scope, health and revoke                                                                             | Marketplace detail                         | ORCH-12                                     | not implemented                                                                                                                                                                                                                               |
| P-60 | Task changes diff, apply/discard and PR verbs (C4 ladder; branches agent-managed)                                                      | ChatPage / task drawer                     | EXEC-13                                     | not implemented                                                                                                                                                                                                                               |

Every P-ID must have a page contract in the activating spec: data adapter, permission, all §4
states, keyboard/focus behavior, empty-state next step, error recovery truth and owner visual
checkpoint. A row with no active spec is a design surface only; it is not an instruction to build a
mock page in the default product.

## 3B. Binding model, runtime, usage and message-review contract

This section is the target handoff and review contract for P-02, P-07, P-21, P-29 and P-30.
The reset did not implement it; current coverage is recorded in §3A and the gap table below.
[R1](specs/R1-one-boundary-language.md) selects ZCode's composer and independent model/reasoning
controls, and Cindy's searchable, filtered, grouped model popup. OpenCode remains comparison
evidence for provider setup, discovery, context usage and review. Craft/Fleet remains the rendering
and state authority. A reviewer tests the clauses rather than accepting a resemblance as evidence.

### Surface ownership

| Concern | Canonical home and behavior | Wrong when |
|---|---|---|
| API keys and provider subscriptions | **Settings → Model**; connected and available models share one page and one connection store | the page is named Provider; API and subscription credentials are split into another settings authority |
| CLI runtimes | **Settings → Terminal**; handshake before first use records runtime version, health, models, modalities, context, reasoning efforts and typed runtime modes | the first model call performs discovery; a CLI gains its own composer or model-picker design |
| Model choice | the same provider/connection-grouped searchable picker in Settings and composer; a CLI group uses the connection name while detail still exposes the actual runtime/provider | a flat duplicate list, a transport prefix such as `pi/`, or a separate fast/normal model ID is shown |
| Defaults | one app/Project new-task default outside a connection editor; an explicit Session selection wins | a connection card carries a “default model” badge or silently overrides a Session choice |
| Project location | visible Workspace switcher plus a Project/folderless picker for the new Conversation; host follows the Workspace route | Project selection silently changes Workspace; folder, remote machine, worktree and cloud are mixed into one location type |

### Settings and composer interaction

1. Add and edit stay expanded on the current Settings page. Provider selection is a searchable menu.
   Credential fields use progressive disclosure, with endpoint presets filled from the selected
   provider and editable only where the adapter permits it.
2. The model multi-select is one tokenized combobox: selected model chips live inside the same field;
   the same text searches known models and offers an explicit custom-ID action. There is no second
   search box or chip row. Custom IDs preserve their provider-native value and support keyboard
   removal without exposing an internal transport prefix.
3. The composer popup follows Cindy's search, category rail, grouped model rows and fixed configure
   footer as specified in R1. Row hierarchy is model name first, genuine description/account source
   second, with known capability summary and selection at the right. Input/context detail may use
   secondary disclosure; do not expand every row into a five-field form. Reasoning is edited by its
   own composer control. Unknown values render `—` or remain absent; they never become `0`,
   “unsupported”, or a guessed capability. API price and subscription quota stay distinct.
4. The reasoning control lists only exact model-advertised effort values, translated for display.
   Binary reasoning stays binary; if a model advertises six or seven official values, all six or
   seven remain independently selectable rather than being collapsed to a global list.
   Speed/service/runtime controls retain separate state and request mappings even when the compact
   menu places a fast toggle below reasoning choices. Unsupported controls disappear. A generic
   provider mode is not accepted until discovery classifies its semantics and the adapter can prove
   the emitted body/header.
5. Low-risk setup uses inline/menu interaction, not a navigation detour or modal form. This is not a
   blanket ban on overlays: OAuth handoff, OS folder choice, destructive confirmation, credential
   recovery and complex conflict review use the existing dialog/drawer/system surface when needed.

### Capability and data precedence

```text
live provider or CLI protocol
        ↓ exact positive/negative capability evidence
installed SDK/adapter contract
        ↓
OpenCode model catalog enrichment
        ↓
static Fleet fallback
```

A lower source fills only an unknown field; it never overrides a higher source's explicit denial.
Every value retains source and observation time. Provider catalog presence alone is `display-only`
until authentication, validation and a request adapter work. More logos are not more supported
providers.

### Context, quota and message evidence

1. The composer has one context indicator and the detail has one primary context-usage bar.
   Subscription quota windows appear only for the active subscription connection, after an
   authenticated provider/runtime response. Show the returned windows and native units, with a
   compact summary and overflow detail rather than a fixed two-window limit. API-key connections
   show no invented subscription allowance. Missing or undocumented quota data stays unavailable
   rather than being scraped, estimated or shown as zero. Acquisition, identity and freshness follow
   [SYS-03](modules/suites/SYS-03-context-economy.md#subscription-allowance-acquisition-and-display).
2. The one usage ledger owns total/input/output/reasoning/cache-read/cache-write tokens, cost,
   message counts, context limit, created/last-active times and breakdown. Provider events outrank
   estimates. Estimated visible-message composition is labelled estimated and never presented as
   exact prompt attribution. Breakdown percentages state their denominator and sum from the same
   token population.
3. Counts and percentages that describe one category share one row where width permits. Long values
   truncate before controls disappear. Numeric values use locale formatting and tabular figures.
4. Completed user and assistant turns reveal their compact footer on hover, keyboard focus and
   explicit tap/coarse-pointer interaction. User turns show work mode, model and elapsed time plus
   transcript revert and copy. Assistant turns show copy, mode, model, elapsed time and real
   changed-file/addition/deletion evidence when known.
5. Elapsed time spans the user message creation timestamp through the last completed child response.
   Transcript revert removes later conversation/provider context and restores text to the composer;
   it does **not** restore workspace files. A file-restoring verb is forbidden until a snapshot/VCS
   authority can preview conflicts and prove recovery.

### Current known gaps (handoff, not a defer bucket)

| Gap | Status | Closure evidence |
|---|---|---|
| CLI discovery, typed variants and executable Session adapters | `not implemented` | protocol-backed capability snapshot and a real run through the existing Session timeline; old handshake code is absent |
| Generic runtime modes beyond upstream thinking/fast controls | `not implemented` | classified model modes, Session persistence and verified request body/header mapping; old Fleet mode helpers are absent |
| Claude/Codex subscription allowance windows | `not implemented` | authenticated response, unavailable/error states and owner visual review; old parser/RPC claims belong to the archived tree |
| TE1 breakdown and exact prompt-section attribution | `not implemented` | provider/prompt-assembly evidence with one denominator; preserve the upstream context indicator and unknown values |
| Completed-turn metadata and transcript/file restoration | `not implemented` | request-time mode/model/time evidence; transcript restore distinguished from previewable file recovery |
| Compact/touch message action acceptance | `wired but not visually checked` | recheck upstream Copy/Branch actions with keyboard and coarse pointer; old Fleet footer tests do not transfer |
| Separate model and reasoning controls per the target contract | `not implemented` | admitted per-model reasoning control with unsupported levels hidden; old `ModelPickerList.tsx` is absent |
| Independent execution-target and Project/folder interaction | `not implemented` | target selection, remote folder/model data and Session binding verified together; old `execution-context-options.ts` is absent |
| Owner-requested composer picker expansion | `not implemented` | R1 specifies a Project/context header, unified add popup, independent permission/Plan and model/reasoning controls, and Cindy model popup; current Craft callbacks do not establish that behavior |

## 4. Page state standard (every surface, no exceptions)

Every page/dialog/panel ships all applicable states, or explicitly notes non-applicability in its
spec:

- **loading** · **empty** (with a plain-language next step) · **error** (what happened + what to do,
  no stack dumps) · **denied** (permission truth, not a blank) · **offline/unavailable** (honest
  service class per P8) · **recovery** (what can actually be recovered — never imply undo that
  doesn't exist, S5) · **narrow width** (truncation before action loss) · **zh-Hans + en** parity.

**Use the shared components; do not hand-roll a state.** Until 2026-07-24 only `empty` had a home,
so each caller invented its own error surface:

| State                               | Component                                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| empty                               | `components/ui/empty`, `entity-list-empty` (`EntityListEmptyScreen`)                         |
| error · denied · offline · recovery | Existing per-surface Craft states; the old Fleet `components/ui/surface-state` wrapper is absent after reset |
| loading                             | existing skeleton / `LoadingIndicator`                                                       |

The former **Feedback → SurfaceState** playground entry is also absent. Its old acceptance is
archived; each active page slice must use current shared primitives and expose its actual states.
Values and copy rules remain in [`UI-SPEC.md`](UI-SPEC.md) §10.

Acceptance for any page slice includes walking these states
([`09-QUALITY.md`](09-QUALITY.md) CHECK THIS).

## 5. The frontend track (build pages ahead of behavior, honestly — Decision G6)

After the R0 baseline exit, frontend work may run ahead of its backend behavior under these rules.
The current baseline-first instruction also applies to preview/mock implementations:

1. **Spec first.** A page batch needs its page spec (a section in the domain spec or a short page
   spec) covering: purpose, primary
   home, information architecture, states (§4), and the data contract it consumes.
2. **Visual anchor before code.** The Goal names the exact existing shell/page/component and
   playground state that define the visual language, plus one intentional delta. A new page still
   inherits shell chrome, spacing, typography, tokens, menus and interaction patterns; “new page”
   is not permission for a new design system. This does not freeze weak information architecture:
   an admitted reference workflow may add, remove, or regroup controls while the resulting surface
   continues to use the existing Fleet/Craft rendering primitives and one backend authority.
3. **Typed adapter seam.** Pages consume a typed data contract (the owning release's candidate RPC shape), implemented
   first by a mock adapter. **Mock data lives behind the adapter, never inside components.** Wiring
   the real authority later replaces the adapter implementation, not the page.
4. **Preview-gated and renderable.** Unwired pages are reachable only behind the developer/preview
   toggle, and their important states are selectable in the existing playground/preview surface — the
   default surface never shows a control without real behavior (03 §2 stays true for users).
5. **Status honesty.** An unwired page is `display-only` and is reported as such — always. Wiring
   promotes it through `wired but not visually checked` → `usable` normally.
6. **Owner activates batches.** The owner may activate any page batch (for example, “build the
   T3/T4/T5 surfaces first”) without waiting for backend releases; the matrix/roadmap record the unresolved wiring
   edges.
7. **No dead-end investment.** A page whose domain has an unmet gate (e.g. canvas before the E5a
   benchmark) may still be designed and mocked, but its renderer-dependent parts stay throwaway-thin
   until the gate decision.

This track gives the owner an early view of the complete product shape, keeps agents able to build frontend
in parallel, and still forbids the failure that killed the first attempt: mocked panels presented
as finished product.

## 6. Frontend data contracts

- The contract of record for existing behavior is the real RPC/handler shape
  ([`06-CODE-MAP.md`](06-CODE-MAP.md): renderer → atom/hook → RPC → server handler).
- A mock adapter for a target page proposes the _smallest_ contract the page truly needs; the
  domain's backend slice later either implements it or renegotiates it explicitly in the spec —
  silent drift between mock contract and real handler is a contract change (C7 applies).
- Shared contract files live with the code, are versioned with their first real caller, and never
  fork per-page copies.

## 7. Dialog / drawer / settings inventory rule

Dialogs, drawers, and settings sections follow the same rules as pages (§3 justification, §4
states, §5 track). Settings additions specifically: settings are for credentials, security/privacy,
retention, connections, and rare preferences — daily actions stay next to the work
([`UI-SPEC.md`](UI-SPEC.md)). Before adding a settings section, prove the
existing eleven pages cannot host it.
