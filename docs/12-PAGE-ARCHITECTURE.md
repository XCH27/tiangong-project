# 12 — Page Architecture (full frontend inventory + frontend track)

> The complete page/surface inventory of the target product, the state standard every surface must
> meet, and the rules that let frontend work run **ahead of** backend behavior without repeating the
> display-only catastrophe. Companion breadth index: [`11-PRODUCT-MATRIX.md`](11-PRODUCT-MATRIX.md).
> Visual/component rules stay in [`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md); owner UI
> philosophy (“do not add entities without necessity”; simplify Craft, do not invent) binds everything here.

## 1. Shell regions (exists today, Craft)

| Region       | Code                                  | Notes                                                                                                                               |
| ------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Global shell | `AppShell.tsx`                        | hosts everything below                                                                                                              |
| Left sidebar | `LeftSidebar.tsx` | owns global and Session navigation with Project and Conversations scopes; `SessionList` is not mounted as a parallel desktop navigator; saved and archived management stay out of primary navigation |
| Main content | `MainContentPanel.tsx`                | routes pages                                                                                                                        |
| Conversation | `ChatDisplay.tsx` / `ChatPage.tsx`    | timeline, composer, permission prompts                                                                                              |
| BrowserPane  | Electron browser surface              | governed browser/evidence                                                                                                           |
| Dialog layer | shared dialog/drawer components       | pickers, confirmations, "send to…"                                                                                                  |

Target deltas bound by P6/P10 and delivered in R1: restore v0.10.5 shell behavior, keep one
Session list with sibling Project and Conversations scopes, expose the same New Task flow globally
and per Project, preserve Session actions, and converge workspace/folder/project controls on one
switcher. Search, labels and archive are list states; Project home does not repeat Sessions.

## 2. Page inventory — current (real code, `app/apps/electron/src/renderer/pages/`)

| Page                                                                                                                                                    | Status            | Notes                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ChatPage                                                                                                                                                | `usable`          | session conversation                                                                                                                                                                                      |
| Project settings · SkillInfoPage · SourceInfoPage                                                                                                       | `usable`          | entity info; Project settings target the selected Workspace-as-Project                                                                                                                                    |
| Nested v0.11 ProjectInfoPage                                                                                                                            | `display-only`    | compatibility route only; not the canonical Project authority                                                                                                                                             |
| ShortcutsPage                                                                                                                                           | `usable`          |                                                                                                                                                                                                           |
| AutomationInfoPage                                                                                                                                      | `usable`          | routed automation detail/configuration surface in `MainContentPanel`                                                                                                                                      |
| Board (kanban, in app-shell)                                                                                                                            | `not implemented` | dormant v0.11 compatibility code; no R1 product entry                                                                                                                                                     |
| Settings: AI · App · Appearance · Input · Labels · Messaging · Permissions · Preferences · Server · Shortcuts · Workspace (+ navigator) | mixed             | Settings → AI is the single visible provider/model configuration home over one Fleet LLM connection authority; the legacy Models route is a compatibility alias; the remaining inherited Settings pages retain their row status |
| Design-system playground window                                                                                                                         | `display-only`    | debug-only preview host; never a product authority                                                                                                                                                        |
| Browser empty-state page                                                                                                                                | `usable`          | BrowserPane auxiliary window entry                                                                                                                                                                        |
| Onboarding · Reauth · WorkspacePicker startup screens                                                                                                   | `usable`          | pre-shell startup and recovery surfaces                                                                                                                                                                   |

Every change to these starts from the matching upstream component (UI baseline rule).

## 3. Page inventory — target (the full product)

Status is per capability vocabulary; every target surface obeys **one primary home per
capability**. This inventory is the design-coverage list — building any item still requires its
domain spec (or an owner request) and the frontend-track rules in §5.

| #   | Surface                                          | Surface IDs                  | Domain (matrix row)             | What it shows / does                                                                                                                                                             | Primary home                                                                                                        | Status                                   |
| --- | ------------------------------------------------ | ---------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| T1  | Project home (P6 single boundary)                | P-03                         | Project/Workspace               | files, assets, deliverables and settings of one Project; one switcher; no Session-list copy                                                                                      | existing sidebar + pages, re-worded                                                                                 | `not implemented`                        |
| T2  | Deliverables view (`deliverables/` + provenance) | —                            | Files/ArtifactRef               | accepted outputs of a Project                                                                                                                                                    | ProjectInfoPage extension                                                                                           | convention helper `wired but not visually checked`; the view itself is `not implemented` (R3 minimal → R5 real) |
| T3  | Library view                                     | P-12                         | ArtifactRef & Library           | selected, indexed, provenance-tracked assets; exact versions                                                                                                                     | R5 page/extension decision                                                                                          | `not implemented`                        |
| T4  | Jobs / generations panel                         | P-36, P-49                   | AIGC jobs                       | running/queued/failed generation jobs, placeholders→results                                                                                                                      | R11 surface decision                                                                                                | `not implemented`                        |
| T5  | Canvas                                           | P-34                         | Canvas                          | spatial command surface per [`13-ORCHESTRATION.md`](13-ORCHESTRATION.md) §4 (cards, edges, Space/Workflow dual modes)                                                            | new page inside shell (R7; DOM family committed per E5a — React Flow default, custom DOM+SVG fallback, spike picks) | `not implemented`                        |
| T6  | Workflow editor/run view                         | P-46, P-47                   | Workflows                       | finite DAG definition + run status                                                                                                                                               | new page (R8)                                                                                                       | `not implemented`                        |
| T7  | Delegation / team view                           | P-20                         | Multi-agent                     | child runs, budgets, RunReports — projections of Session tree                                                                                                                    | Inline `DelegationStrip` on parent ChatDisplay first (no Team page); deeper inspector remains R6                   | `wired but not visually checked`         |
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
| P-01 | App shell and navigation; global search command surface                                                                                | Global shell                               | CORE-01, CORE-10                            | shell/navigation usable; global search wired but not visually checked                                                                                                                                                                         |
| P-02 | Session work/conversation, progressive composer and stream inspector; global/Project New Task triggers share one Session path (P10)    | Conversation                               | CORE-03                                     | request-time mode/model/time metadata, changed-file summary and the Session-owned follow-up queue are wired but not visually checked; transcript revert is usable, while completed-turn revert with workspace-file restoration is not implemented |
| P-03 | Project home and switcher (converging on one Project switcher per P6/R1)                                                               | Main content                               | CORE-02                                     | switcher/settings wired but not visually checked; full target home not implemented                                                                                                                                                            |
| P-04 | Structured task detail/activity and later task-center projection; Kanban is not the default product surface                            | Task inspector                             | CORE-04                                     | task store/TaskRunner backend usable; the default task-center surface is not implemented (mirrors the CORE-04 registry row) |
| P-05 | Settings navigator and preference forms                                                                                                | Settings                                   | CORE-05, CORE-10                            | navigator and preference forms usable; on the Expert kits page, name/colour/kind/value-type/prompt usable, and the kit payload region (what the kit carries, tool-budget verdict) is `display-only` — it renders an assessment of `expertKit`, which has no writer and no runtime reader (H36) |
| P-06 | Search and label filters over the one work list; archive management in Settings; global Session/Project-file/Settings/route projection | Sidebar / Settings / command view          | CORE-06, INFO-06                            | wired but not visually checked                                                                                                                                                                                                                |
| P-07 | First-run and model connection setup                                                                                                   | First run / Settings → Model               | CORE-07                                     | first-run setup and Settings-owned inline add/edit/validate/reauth path usable; the complete §3B OpenCode-admission interaction contract is not implemented                                                                                    |
| P-08 | Help, local docs and support links                                                                                                     | external doc-links + Settings/Shortcuts    | CORE-08                                     | wired but not visually checked                                                                                                                                                                                                                |
| P-09 | Update channel, release notes and recovery                                                                                             | Settings / dialog                          | CORE-09                                     | wired but not visually checked                                                                                                                                                                                                                |
| P-10 | Docking, split, resize and layout restore                                                                                              | Workbench host                             | CORE-11                                     | modular right workbench tabs and resize wired but not visually checked; persistent tab/layout restore not implemented                                                                                                                         |
| P-11 | Workspace file browser and file actions                                                                                                | Project home / drawer                      | INFO-01                                     | usable                                                                                                                                                                                                                                        |
| P-12 | Library, versions and asset inspector                                                                                                  | Library route                              | INFO-02                                     | not implemented                                                                                                                                                                                                                               |
| P-13 | Source ingestion and conversion progress                                                                                               | Sources / Jobs                             | INFO-04                                     | usable                                                                                                                                                                                                                                        |
| P-14 | Document editor, preview and co-edit controls                                                                                          | FileViewer overlay / future editor host    | INFO-05, CREATE-16                          | file preview usable; document editor/co-edit not implemented                                                                                                                                                                                  |
| P-15 | Browser tabs, navigation and capture controls                                                                                          | BrowserPane / right workbench projection   | INFO-03                                     | tabs/navigation usable; in-shell BrowserPane embedding wired but not visually checked; capture controls not implemented                                                                                                                       |
| P-16 | Evidence, citation and provenance review                                                                                               | Inspector / timeline                       | INFO-03, INFO-07                            | not implemented                                                                                                                                                                                                                               |
| P-17 | Import, export and migration wizard                                                                                                    | Dialog / settings                          | INFO-08                                     | not implemented                                                                                                                                                                                                                               |
| P-18 | Permission prompt, approval history and policy explanation                                                                             | Dialog / inbox                             | EXEC-01, EXEC-02                            | the Craft approval prompt is usable (PreToolUse emits `permission_request`; the conversation renders it); the EXEC-02 caller-aware policy explanation and approval history are not implemented (R4) |
| P-19 | Terminal session, output and cancellation                                                                                              | Session panel / right workbench projection | EXEC-03                                     | bounded project command runner wired but not visually checked; persistent interactive PTY and cancellation not implemented                                                                                                                    |
| P-20 | Delegation tree, brief and run report                                                                                                  | Chat / task inspector extension            | EXEC-04                                     | inline `DelegationStrip` on the parent conversation is wired but not visually checked (`DelegationStrip.tsx`, mounted in `ChatDisplay.tsx`); the delegation tree, TaskBrief and RunReport inspector are not implemented (R6) |
| P-21 | CLI runtime connection and capability health                                                                                           | Settings → Terminal                        | EXEC-05                                     | installed CLI handshake and model/capability health projection usable; OpenCode variant classification and executable Codex/OpenCode/Claude CLI Session adapters not implemented                                                               |
| P-22 | Organization/router explanation and override                                                                                           | Task inspector                             | EXEC-06                                     | not implemented                                                                                                                                                                                                                               |
| P-23 | Worktree occupancy and cleanup                                                                                                         | Task inspector                             | EXEC-07                                     | not implemented                                                                                                                                                                                                                               |
| P-24 | Sandbox profile, limits and denied action                                                                                              | Settings / approval dialog                 | EXEC-08                                     | not implemented                                                                                                                                                                                                                               |
| P-25 | Remote target, grant and disconnect state                                                                                              | Workspace settings                         | EXEC-09                                     | not implemented                                                                                                                                                                                                                               |
| P-26 | Automation schedule and run history                                                                                                    | Task / settings extension                  | EXEC-10                                     | usable                                                                                                                                                                                                                                        |
| P-27 | Messaging channels, delivery and reconnect                                                                                             | Settings / inbox                           | EXEC-11                                     | `not implemented`                                                                                                                                                                                                                             |
| P-28 | Sharing, invite and revoke dialog                                                                                                      | —                                          | EXEC-12                                     | **removed 2026-07-26** — owner decision; online sharing and `apps/viewer` deleted rather than kept as a default-visible control with no working behaviour. Local export remains on the existing session path.                                 |
| P-29 | Context preview, compaction and token budget                                                                                           | Session / cost inspector                   | INTEL-01, INTEL-02                          | one composer context indicator, one primary context bar, provider-ledger inspector and estimated visible-message composition usable; exact prompt-section attribution, optimizer attribution and compaction preview not implemented             |
| P-30 | Model capability, routing and cost ledger                                                                                              | Session / Settings → Model                 | INTEL-03, INTEL-04                          | provider-grouped searchable inventory, discovered icons and advertised reasoning/fast controls usable; generic runtime-mode selection and full CLI execution projection not implemented; Claude/Codex subscription allowance adapters wired but not visually checked with a live subscription; routing ledger not implemented |
| P-31 | Memory layers, consolidation log and curation (pin/correct/delete)                                                                     | Memory route                               | INTEL-05                                    | not implemented                                                                                                                                                                                                                               |
| P-32 | Skill/capability install, loadout and runtime view                                                                                     | Skills/Sources extension                   | INTEL-06                                    | not implemented                                                                                                                                                                                                                               |
| P-33 | Evaluation run, regression evidence and comparison                                                                                     | Diagnostics / Jobs                         | INTEL-07                                    | not implemented                                                                                                                                                                                                                               |
| P-34 | Spatial canvas and node inspector                                                                                                      | Canvas route / right workbench entry       | CREATE-01                                   | not implemented; playground preview and workbench entry are display-only                                                                                                                                                                      |
| P-35 | Video sequence, media bin and timeline                                                                                                 | Video route                                | CREATE-02                                   | not implemented                                                                                                                                                                                                                               |
| P-36 | Image generation/editing and result review                                                                                             | Jobs / media route                         | CREATE-03, CREATE-14                        | not implemented                                                                                                                                                                                                                               |
| P-37 | Audio, voice and music tracks                                                                                                          | Media / video route                        | CREATE-04                                   | not implemented                                                                                                                                                                                                                               |
| P-38 | Transcript, captions and translation editor                                                                                            | Video route                                | CREATE-05                                   | not implemented                                                                                                                                                                                                                               |
| P-39 | Native design document and object inspector                                                                                            | Design route                               | CREATE-06                                   | not implemented                                                                                                                                                                                                                               |
| P-40 | Web artifact preview and iterate                                                                                                       | Preview route                              | CREATE-07                                   | not implemented                                                                                                                                                                                                                               |
| P-41 | Deck document and slide inspector                                                                                                      | Deck route                                 | CREATE-08                                   | not implemented                                                                                                                                                                                                                               |
| P-42 | Motion composition and render preview                                                                                                  | Deck / media route                         | CREATE-09                                   | not implemented                                                                                                                                                                                                                               |
| P-43 | Storyboard, shots and plan-to-media links                                                                                              | Media route                                | CREATE-10, CREATE-13, CREATE-15             | not implemented                                                                                                                                                                                                                               |
| P-44 | Templates, brand kits and reusable asset picker                                                                                        | Library / editor drawer                    | CREATE-11                                   | not implemented                                                                                                                                                                                                                               |
| P-45 | Export profile, render progress and delivery receipt                                                                                   | Jobs / deliverables                        | CREATE-12                                   | not implemented                                                                                                                                                                                                                               |
| P-46 | Workflow definition editor and validation                                                                                              | Workflow route                             | ORCH-01                                     | not implemented                                                                                                                                                                                                                               |
| P-47 | Workflow run, inputs, outputs and history                                                                                              | Workflow / task extension                  | ORCH-02                                     | not implemented                                                                                                                                                                                                                               |
| P-48 | Plugin, tool registry, MCP and loadout permissions                                                                                     | Skills/Sources / settings                  | ORCH-03, ORCH-04                            | `not implemented`                                                                                                                                                                                                                             |
| P-49 | Job queue, resource limits, retry and cancellation                                                                                     | Jobs panel                                 | ORCH-05                                     | not implemented                                                                                                                                                                                                                               |
| P-50 | Activity timeline and event detail                                                                                                     | Session / project timeline                 | ORCH-06, EXEC-02                            | usable (timeline); EXEC-02 evidence detail not implemented                                                                                                                                                                                    |
| P-51 | Notifications, approvals and inbox                                                                                                     | Inbox drawer                               | ORCH-07                                     | `not implemented`                                                                                                                                                                                                                             |
| P-52 | Diagnostics, health checks and recovery actions                                                                                        | Help / settings                            | ORCH-08                                     | not implemented                                                                                                                                                                                                                               |
| P-53 | Telemetry, privacy and redaction controls                                                                                              | Settings                                   | ORCH-09                                     | not implemented                                                                                                                                                                                                                               |
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

This section is the handoff and review contract for P-02, P-07, P-21, P-29 and P-30. OpenCode
Desktop is the primary workflow and information-hierarchy reference; Craft/Fleet remains the
rendering and state authority. A reviewer tests the clauses below rather than accepting “similar to
OpenCode” as evidence.

### Surface ownership

| Concern | Canonical home and behavior | Wrong when |
|---|---|---|
| API keys and provider subscriptions | **Settings → Model**; connected and available models share one page and one connection store | the page is named Provider; API and subscription credentials are split into another settings authority |
| CLI runtimes | **Settings → Terminal**; handshake before first use records runtime version, health, models, modalities, context, reasoning efforts and typed runtime modes | the first model call performs discovery; a CLI gains its own composer or model-picker design |
| Model choice | the same provider/connection-grouped searchable picker in Settings and composer; a CLI group uses the connection name while detail still exposes the actual runtime/provider | a flat duplicate list, a transport prefix such as `pi/`, or a separate fast/normal model ID is shown |
| Defaults | one app/Project new-task default outside a connection editor; an explicit Session selection wins | a connection card carries a “default model” badge or silently overrides a Session choice |
| Project location | one Project/folder selector; execution target (`this device` or a named user-owned remote Fleet target) is a separate choice with the same menu grammar | Workspace is shown as a peer user concept; folder, remote machine, worktree and cloud are mixed into one location type |

### Settings and composer interaction

1. Add and edit stay expanded on the current Settings page. Provider selection is a searchable menu.
   Credential fields use progressive disclosure, with endpoint presets filled from the selected
   provider and editable only where the adapter permits it.
2. The model multi-select is one tokenized combobox: selected model chips live inside the same field;
   the same text searches known models and offers an explicit custom-ID action. There is no second
   search box or chip row. Custom IDs preserve their provider-native value and support keyboard
   removal without exposing an internal transport prefix.
3. The composer picker groups models by connection/provider, uses the admitted provider icon, and
   exposes exactly these compact detail rows when known: **Model · Provider/runtime · Input ·
   Reasoning · Context**. Unknown values render `—`; they never become `0`, “unsupported”, or a
   guessed capability.
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
   authenticated provider/CLI response; one or two bars are valid according to the returned
   windows. API-key connections show no subscription allowance. Missing or undocumented quota data
   stays unavailable rather than being scraped, estimated or shown as zero.
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
| OpenCode CLI `variants` are currently treated as reasoning efforts without proving their semantics | `not implemented` | fixture showing typed effort versus speed/service/tool modes, with no cross-classification |
| Non-fast generic runtime modes are stored but not selectable in the composer | `wired but not visually checked` | per-model menu lists classified non-fast modes (`listGenericRuntimeModes`); `setRuntimeMode` persists on the Session; `resolveSessionRuntimeModePayload` asserts request body/header merge independently of Fast |
| Codex/OpenCode/Claude CLI handshakes do not yet back executable Session adapters | `not implemented` | handshake snapshot selected in the shared picker and executed through the one Session timeline |
| Claude/Codex subscription windows have parser/RPC wiring but no live membership acceptance | `wired but not visually checked` | authenticated live response, unavailable/error states and owner visual review; no claim of a stable public API where none exists |
| Exact prompt-section/context-breakdown attribution | `not implemented` | provider/prompt-assembly evidence with one denominator; unknowns remain unknown |
| Workspace-file restoration after transcript revert | `not implemented` | previewable snapshot/VCS restore with conflict and recovery tests |
| Compact assistant turns intentionally hide Copy/Markdown/Branch actions | `wired but not visually checked` | Copy remains reachable on compact/touch without exposing desktop-only actions or depending on hover |
| Touch reveal is proven only under the compact container, not every coarse-pointer desktop layout | `wired but not visually checked` | hybrid/coarse-pointer interaction test plus owner walkthrough |
| Reasoning level is still rendered inside the same dropdown as model selection (`ModelPickerList.tsx`) | `not implemented` | E9a requires model selection and reasoning selection to be separate controls; closure = a per-model reasoning control outside the model list, with unsupported levels hidden rather than shown disabled |
| Execution target and folder list are coupled: `filterWorkspacesForExecutionTarget` changes which folders exist when local↔cloud switches | `not implemented` | P9 makes execution location and workspace scope independent choices; closure = switching target leaves the folder list unchanged, proven by a targeted test over `execution-context-options.ts` |
| The composer's project/folder pickers are floating `Popover`/`DropdownMenu` surfaces (`FreeFormInput.tsx`, `WorkingDirectorySelector.tsx`) while the context strip itself is in document flow | `not implemented` | owner direction: the picker expands from the composer rather than floating over it; closure = in-flow expansion with the §4 state set, or an owner decision that floating is acceptable here |

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
| error · denied · offline · recovery | `components/ui/surface-state` (`ErrorState`, `DeniedState`, `OfflineState`, `RecoveryState`) |
| loading                             | existing skeleton / `LoadingIndicator`                                                       |

All four `surface-state` kinds are selectable in the playground under **Feedback → SurfaceState**,
which is how a page slice walks them without reproducing the real failure. Values and copy rules are
in [`UI-SPEC.md`](UI-SPEC.md) §10.

Acceptance for any page slice includes walking these states
([`09-QUALITY.md`](09-QUALITY.md) CHECK THIS).

## 5. The frontend track (build pages ahead of behavior, honestly — Decision G6)

Frontend work may run ahead of backend behavior under these rules:

1. **Spec first.** A page batch needs its page spec (a section in the domain spec or a short page
   spec from [`specs/SPEC-TEMPLATE.md`](specs/SPEC-TEMPLATE.md) §Pages) covering: purpose, primary
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
([`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md)). Before adding a settings section, prove the
existing eleven pages cannot host it.
