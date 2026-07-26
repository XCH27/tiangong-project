# 12 — Page Architecture (full frontend inventory + frontend track)

> The complete page/surface inventory of the target product, the state standard every surface must
> meet, and the rules that let frontend work run **ahead of** backend behavior without repeating the
> display-only catastrophe. Companion breadth index: [`11-PRODUCT-MATRIX.md`](11-PRODUCT-MATRIX.md).
> Visual/component rules stay in [`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md); owner UI
> philosophy (“do not add entities without necessity”; simplify Craft, do not invent) binds everything here.

## 1. Shell regions (exists today, Craft)

| Region | Code | Notes |
|---|---|---|
| Global shell | `AppShell.tsx` | hosts everything below |
| Left sidebar | `LeftSidebar.tsx` + `SessionList.tsx` | one Session-list implementation with Project and Conversations scopes, plus search/filter/archive states |
| Main content | `MainContentPanel.tsx` | routes pages |
| Conversation | `ChatDisplay.tsx` / `ChatPage.tsx` | timeline, composer, permission prompts |
| BrowserPane | Electron browser surface | governed browser/evidence |
| Dialog layer | shared dialog/drawer components | pickers, confirmations, "send to…" |

Target deltas bound by P6/P10 and delivered in R1: restore v0.10.5 shell behavior, keep one
Session list with sibling Project and Conversations scopes, expose the same New Task flow globally
and per Project, preserve Session actions, and converge workspace/folder/project controls on one
switcher. Search, labels and archive are list states; Project home does not repeat Sessions.

## 2. Page inventory — current (real code, `app/apps/electron/src/renderer/pages/`)

| Page | Status | Notes |
|---|---|---|
| ChatPage | `usable` | session conversation |
| Project settings · SkillInfoPage · SourceInfoPage | `usable` | entity info; Project settings target the selected Workspace-as-Project |
| Nested v0.11 ProjectInfoPage | `display-only` | compatibility route only; not the canonical Project authority |
| ShortcutsPage | `usable` | |
| Board (kanban, in app-shell) | `not implemented` | dormant v0.11 compatibility code; no R1 product entry |
| Settings: Ai · App · Appearance · Input · Labels · Messaging · Permissions · Preferences · Server · Shortcuts · Workspace (+ navigator) | `usable` | zh-Hans pass in R0-audited tree |

Every change to these starts from the matching upstream component (UI baseline rule).

## 3. Page inventory — target (the full product)

Status is per capability vocabulary; every target surface obeys **one primary home per
capability**. This inventory is the design-coverage list — building any item still requires its
domain spec (or an owner request) and the frontend-track rules in §5.

| # | Surface | Surface IDs | Domain (matrix row) | What it shows / does | Primary home | Status |
|---|---|---|---|---|---|---|
| T1 | Project home (P6 single boundary) | P-03 | Project/Workspace | files, assets, deliverables and settings of one Project; one switcher; no Session-list copy | existing sidebar + pages, re-worded | `not implemented` |
| T2 | Deliverables view (`deliverables/` + provenance) | — | Files/ArtifactRef | accepted outputs of a Project | ProjectInfoPage extension | `not implemented` (R3 minimal → R5 real) |
| T3 | Library view | P-12 | ArtifactRef & Library | selected, indexed, provenance-tracked assets; exact versions | R5 page/extension decision | `not implemented` |
| T4 | Jobs / generations panel | P-36, P-49 | AIGC jobs | running/queued/failed generation jobs, placeholders→results | R11 surface decision | `not implemented` |
| T5 | Canvas | P-34 | Canvas | spatial command surface per [`13-ORCHESTRATION.md`](13-ORCHESTRATION.md) §4 (cards, edges, Space/Workflow dual modes) | new page inside shell (R7; DOM family committed per E5a — React Flow default, custom DOM+SVG fallback, spike picks) | `not implemented` |
| T6 | Workflow editor/run view | P-46, P-47 | Workflows | finite DAG definition + run status | new page (R8) | `not implemented` |
| T7 | Delegation / team view | P-20 | Multi-agent | child runs, budgets, RunReports — projections of Session tree | ChatPage/task inspector extension first (R6) | `not implemented` |
| T8 | Cost, usage & context view | P-29, P-30 | Model routing/cost/context | per-session/project usage, cache/prefix breaks, prompt/tool/context component inventory, source scope and grants | TE1/R3 existing session info first; R17 closes any remaining surface gap | `not implemented` |
| T9 | Memory browser & curation | P-31 | Memory & experience | layered memory files, consolidation log, injected-share display, pin/correct/delete | new page (R9) | `not implemented` |
| T10 | Video editor | P-35 | Video | timeline NLE over project media | R12 native page decision | `not implemented` |
| T11 | Design editor | P-39 | Design surface | schema-backed design docs (E11) | R10 native page decision | `not implemented` |
| T12 | Deck/motion editor | P-41, P-42 | Deck/motion | native deck doc + honest export | R13 native page decision | `not implemented` |
| T13 | Web artifact preview+iterate | P-40 | Web artifacts | generated site preview, versions | R10 existing preview extension first | `not implemented` |
| T14 | Remote targets manager | P-25 | Remote/cloud | user-owned instances, grants, health, disconnect truth | R14 WorkspaceSettings extension (P7) | `not implemented` |
| T15 | Capability loadout manager | P-32, P-56, P-57, P-58, P-59 | Capabilities/Skills/Marketplace | install / loadout / runtime separation (E2), package trust and rollback | R15 existing Skills/Sources pages extension plus P-56..P-59 | `not implemented` |
| T16 | Evidence/browser capture review | P-15, P-16 | Browser & evidence | captures, annotations, links to sessions/artifacts | R3/R5 BrowserPane + timeline extension | `not implemented` |
| T17 | Task changes review | P-54, P-60 | Git delivery (EXEC-13) | per-task diff of project files; verbs 查看改动/应用/放弃/创建 PR per C4 ladder (read-only diff first; apply/discard with R6 worktrees; PR with R14); branches never user-managed | ChatPage/task drawer extension | `not implemented` |

New-page justification rule stays binding: a new surface only when the capability genuinely must be
visible and no existing Craft surface can host it (P5). Extensions-of-existing-pages are always the
first choice (T2, T7, T8, T13, T14, T15, T16 are deliberately extensions, not new pages).

## 3A. Canonical surface registry (pages, panels, drawers and command surfaces)

The sixteen target pages above are product-level destinations, not the whole UI. Every registry
capability must map to a surface below before it can be called frontend-covered. A surface can be a
route, panel, drawer, dialog or command view; its host is an existing shell region unless a module
packet explicitly proves a new host is necessary. These IDs are the cross-document join keys used by
[`modules/PACKET-INDEX.md`](modules/PACKET-INDEX.md).

| ID | Surface | Host / primary home | Registry rows | State |
|---|---|---|---|---|
| P-01 | App shell, navigation and command palette | Global shell | CORE-01, CORE-10 | usable |
| P-02 | Session work/conversation, progressive composer and stream inspector; global/Project New Task triggers share one Session path (P10) | Conversation | CORE-03 | wired but not visually checked |
| P-03 | Project home and switcher (converging on one Project switcher per P6/R1) | Main content | CORE-02 | usable |
| P-04 | Structured task detail/activity and later task-center projection; Kanban is not the default product surface | Task inspector | CORE-04 | not implemented |
| P-05 | Settings navigator and preference forms | Settings | CORE-05, CORE-10 | usable |
| P-06 | Search, label and archive filters over the one work list | Sidebar / command view | CORE-06, INFO-06 | wired but not visually checked |
| P-07 | First-run and provider setup | Onboarding route/dialog | CORE-07 | usable |
| P-08 | Help, local docs and support links | Help route/drawer | CORE-08 | usable |
| P-09 | Update channel, release notes and recovery | Settings / dialog | CORE-09 | wired but not visually checked |
| P-10 | Docking, split, resize and layout restore | Workbench host | CORE-11 | wired but not visually checked |
| P-11 | Workspace file browser and file actions | Project home / drawer | INFO-01 | usable |
| P-12 | Library, versions and asset inspector | Library route | INFO-02 | not implemented |
| P-13 | Source ingestion and conversion progress | Sources / Jobs | INFO-04 | usable |
| P-14 | Document editor, preview and co-edit controls | Document route | INFO-05, CREATE-16 | usable |
| P-15 | Browser tabs, navigation and capture controls | BrowserPane | INFO-03 | not implemented |
| P-16 | Evidence, citation and provenance review | Inspector / timeline | INFO-03, INFO-07 | not implemented |
| P-17 | Import, export and migration wizard | Dialog / settings | INFO-08 | not implemented |
| P-18 | Permission prompt, approval history and policy explanation | Dialog / inbox | EXEC-01, EXEC-02 | `not implemented` |
| P-19 | Terminal session, output and cancellation | Session panel | EXEC-03 | usable |
| P-20 | Delegation tree, brief and run report | Chat / task inspector extension | EXEC-04 | not implemented |
| P-21 | Runtime/provider connection and capability health | Settings / dialog | EXEC-05 | `not implemented` |
| P-22 | Organization/router explanation and override | Task inspector | EXEC-06 | not implemented |
| P-23 | Worktree occupancy and cleanup | Task inspector | EXEC-07 | not implemented |
| P-24 | Sandbox profile, limits and denied action | Settings / approval dialog | EXEC-08 | not implemented |
| P-25 | Remote target, grant and disconnect state | Workspace settings | EXEC-09 | not implemented |
| P-26 | Automation schedule and run history | Task / settings extension | EXEC-10 | usable |
| P-27 | Messaging channels, delivery and reconnect | Settings / inbox | EXEC-11 | `not implemented` |
| P-28 | Sharing, invite and revoke dialog | Project settings | EXEC-12 | not implemented |
| P-29 | Context preview, compaction and token budget | Session / cost inspector | INTEL-01, INTEL-02 | `not implemented` |
| P-30 | Model capability, routing and cost ledger | Session / settings | INTEL-03, INTEL-04 | not implemented |
| P-31 | Memory layers, consolidation log and curation (pin/correct/delete) | Memory route | INTEL-05 | not implemented |
| P-32 | Skill/capability install, loadout and runtime view | Skills/Sources extension | INTEL-06 | not implemented |
| P-33 | Evaluation run, regression evidence and comparison | Diagnostics / Jobs | INTEL-07 | not implemented |
| P-34 | Spatial canvas and node inspector | Canvas route | CREATE-01 | not implemented |
| P-35 | Video sequence, media bin and timeline | Video route | CREATE-02 | not implemented |
| P-36 | Image generation/editing and result review | Jobs / media route | CREATE-03, CREATE-14 | not implemented |
| P-37 | Audio, voice and music tracks | Media / video route | CREATE-04 | not implemented |
| P-38 | Transcript, captions and translation editor | Video route | CREATE-05 | not implemented |
| P-39 | Native design document and object inspector | Design route | CREATE-06 | not implemented |
| P-40 | Web artifact preview and iterate | Preview route | CREATE-07 | not implemented |
| P-41 | Deck document and slide inspector | Deck route | CREATE-08 | not implemented |
| P-42 | Motion composition and render preview | Deck / media route | CREATE-09 | not implemented |
| P-43 | Storyboard, shots and plan-to-media links | Media route | CREATE-10, CREATE-13, CREATE-15 | not implemented |
| P-44 | Templates, brand kits and reusable asset picker | Library / editor drawer | CREATE-11 | not implemented |
| P-45 | Export profile, render progress and delivery receipt | Jobs / deliverables | CREATE-12 | not implemented |
| P-46 | Workflow definition editor and validation | Workflow route | ORCH-01 | not implemented |
| P-47 | Workflow run, inputs, outputs and history | Workflow / task extension | ORCH-02 | not implemented |
| P-48 | Plugin, tool registry, MCP and loadout permissions | Skills/Sources / settings | ORCH-03, ORCH-04 | `not implemented` |
| P-49 | Job queue, resource limits, retry and cancellation | Jobs panel | ORCH-05 | not implemented |
| P-50 | Activity timeline and event detail | Session / project timeline | ORCH-06 | usable |
| P-51 | Notifications, approvals and inbox | Inbox drawer | ORCH-07 | `not implemented` |
| P-52 | Diagnostics, health checks and recovery actions | Help / settings | ORCH-08 | not implemented |
| P-53 | Telemetry, privacy and redaction controls | Settings | ORCH-09 | not implemented |
| P-54 | Git repository, branch, diff and PR review | Delivery / task extension | EXEC-13 | not implemented |
| P-55 | Effective prompt/tool profile, policy source and agent identity inspector | Settings / session inspector | EXEC-14 | not implemented |
| P-56 | Marketplace hub, catalog filters and trust status | Skills / Sources / settings | ORCH-03, ORCH-04, ORCH-10, ORCH-11, ORCH-12 | not implemented |
| P-57 | Skill detail, compatibility, examples and loadout install | Marketplace detail | ORCH-10 | not implemented |
| P-58 | Plugin bundle contents, permissions, dependencies and lifecycle | Marketplace detail | ORCH-11 | not implemented |
| P-59 | MCP server tools, resources, auth scope, health and revoke | Marketplace detail | ORCH-12 | not implemented |
| P-60 | Task changes diff, apply/discard and PR verbs (C4 ladder; branches agent-managed) | ChatPage / task drawer | EXEC-13 | not implemented |

Every P-ID must have a page contract in the activating spec: data adapter, permission, all §4
states, keyboard/focus behavior, empty-state next step, error recovery truth and owner visual
checkpoint. A row with no active spec is a design surface only; it is not an instruction to build a
mock page in the default product.

## 4. Page state standard (every surface, no exceptions)

Every page/dialog/panel ships all applicable states, or explicitly notes non-applicability in its
spec:

- **loading** · **empty** (with a plain-language next step) · **error** (what happened + what to do,
  no stack dumps) · **denied** (permission truth, not a blank) · **offline/unavailable** (honest
  service class per P8) · **recovery** (what can actually be recovered — never imply undo that
  doesn't exist, S5) · **narrow width** (truncation before action loss) · **zh-Hans + en** parity.

**Use the shared components; do not hand-roll a state.** Until 2026-07-24 only `empty` had a home,
so each caller invented its own error surface:

| State | Component |
|---|---|
| empty | `components/ui/empty`, `entity-list-empty` (`EntityListEmptyScreen`) |
| error · denied · offline · recovery | `components/ui/surface-state` (`ErrorState`, `DeniedState`, `OfflineState`, `RecoveryState`) |
| loading | existing skeleton / `LoadingIndicator` |

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
   is not permission for a new design system.
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
- A mock adapter for a target page proposes the *smallest* contract the page truly needs; the
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
