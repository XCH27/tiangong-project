# Project specification — positioning, goals and scope

> **The single authority on what Fleet is and is not.** Read it before designing anything.
> Where any other document disagrees with this one, this one wins and the other is wrong.
>
> Owner definition, 2026-09-10. Everything below is either the owner's stated intent or a
> consequence of it that is named as such.

## One sentence

**A workbench a person and their agents operate together, where the work itself lives inside the
software** — not a chat window that drives other applications from the outside.

## Platform scope

Owner direction, 2026-09-22: desktop Fleet targets **Windows, macOS and Linux**. Design shared
Session/Task/file/permission contracts for all three; native capabilities declare and verify their
platform-specific implementations. The current Mac is a development environment, not a product
scope restriction. Minimum OS versions, architectures, Linux display environments and packaging
targets require evidence before support is advertised.

A later **phone connector, with Orca as a comparison**, belongs to the existing remote-connection
scope (R14 / EXEC-09). Its proposed role is to connect to a user-owned desktop runtime, view work,
send follow-ups and handle permitted task actions. Phone-native execution, the mobile framework,
push delivery and cross-network transport are not selected by this statement. Inspect Orca's
pairing, revocation and mixed-version protocol before selecting mechanisms; its relay is not
implicitly admitted as a required Fleet-operated service.

The current owner order is **documentation and preparation → joint walkthrough of original Craft
→ approval of concrete rectification slices → implementation and acceptance → added capabilities**.
The app reset withdrew the prior Fleet implementation. A surviving draft or passing historical
check is neither current implementation nor permission to resume those patches.

## Workspace and navigation boundary

Owner revision, 2026-09-22, superseding the earlier Project = Workspace collapse:

- Keep the visible Workspace switcher. Workspaces own independent Conversations, Project
  memberships, Sources/MCPs, Skills, and enabled Component/Plugin overrides.
- A Project references a folder in its owning Workspace. The same folder may be added to another
  Workspace without copying it or sharing conversation history and tool grants. Files changed through
  either membership are the same files; Workspace separation is not filesystem isolation.
- Use one left sidebar with Project-grouped and folderless Conversations. Remove the separate left
  navigator column. Board is a separate entry over existing Session/Task data.
- Put existing browser and new-session-panel actions, plus tool entries, in a contextual right
  panel. The panel is a Cindy-style tabbed host (`RightSidebarShell` + `TabBar` + a registered
  tab-kind registry) scoped to the active Session; it is not a vertical icon rail and it is not a
  second navigation authority. Tool lists and details belong inside the selected tab surface, not a
  second left column.
- New Conversation follows ZCode's same-composer empty layout, Project/context header above the
  editor, unified add popup, and separate model/reasoning controls. Plan is independent of the
  three action permissions (Confirm changes, Auto edit, Full access). Model popup structure follows
  Cindy: search, category rail, grouped rows and configure footer. Extend Craft's input, Session,
  model and permission owners; keep Craft visual tokens. No duplicate editor or permission engine.

This is explicit authorization to implement the bounded R1 navigation/context slice after source
comparison. Other baseline corrections and new Component engines retain their existing gates.
The concrete contract and verification are in [R1](specs/R1-one-boundary-language.md).

## The four sources, and what each one is for

Fleet is assembled deliberately, not blended. Each reference answers one question and is not
consulted on the others.

| Source | What it decides | What it does **not** decide |
|---|---|---|
| **Craft Agents** (Apache-2.0; current `app/` tracks **v0.13.4**) | The **look** and the **agent/runtime base** we fork. Spacing, type, colour, motion, tokens, session/agent SDK, connections, and Craft's own capabilities (including Pages). Not Fleet's product concepts | Product concepts, capability ownership, pane vs page |
| **Cindy** (Apache-2.0) | **Feature implementation and front/back interaction logic** — how a capability is actually built and how the surface talks to the backend | Visual style |
| **OpenChamber** (MIT) | **Git and GitHub**: which PR belongs to a branch, review, and the browser-control seam | Everything else |
| **Fleet's own** | The product boundary and integration of the **built-in production surfaces**: infinite canvas, document editing, video and animation. Reference projects may supply bounded mechanisms | — |

**QoderWork CN and TRAE SOLO CN are interface reference only.** Their layout and interaction
patterns may be read; their product concepts may not be imported. Taking Qoder's plugin model and
grafting it onto Craft's label store is exactly the mistake this line exists to prevent.

**Absorb only a demonstrated improvement, in both frontend and backend work.** The named references
provide starting points and responsibilities, not a presumption that their implementation is better.
Start with a concrete Fleet need and compare the current path, a small local correction, the target
software's own facilities, and a relevant alternative. Reuse a bounded mechanism only when the
benefit survives its integration and maintenance cost. A better interface does not qualify its backend,
and a better backend does not qualify its interface. Keep the existing implementation on a tie or
insufficient evidence; partial superiority warrants partial reuse, not a product transplant.

Before adding an editor, bridge, plugin or agent wrapper, check what the design software or engine
already provides: native editing, document state, undo, save/export and supported APIs. Extend that
owner where it meets the task instead of recreating the same capability. This does not replace the
required in-workbench production surfaces with remote-only tools or mandatory hosted services.
GitHub discovery starts from a gap; reference count and feature count are not success measures.
The comparison evidence belongs in the existing
[`reference registry`](REFERENCES.md#required-promotion-record), not a new plan.

**Implementation boundary:** the 2026-09-21 rebuild replaced `app/` with the v0.13.4 base.
The earlier Fleet extensions are preserved at `snapshot/pre-rebuild-2026-09-21`, not running in
this tree. Product requirements below survive; their presence in this document does not establish
implementation. R0 must also account for inherited hosted services before any Fleet release.

### Components, assistants and workspace compositions

Fleet's installable unit is a **Component**: a bounded capability bundle that may contain a native
panel or surface, domain commands and storage, Skills, MCP server/tool declarations, default
knowledge sources, and suggested Assistant settings. Components add tool entries and workbench
panels; left tools and right workbench are the default placement, not permanent position locks.
The user may resize, move, reorder and float supported panels through the one host, including the
conversation view. A component cannot take over the shell or create a new navigation authority.
Every component uses Fleet's Craft-derived tokens,
typography, spacing, motion and shared primitives. A Component is not an Assistant and never owns
Workspace, Session, Task, Permission, Timeline, Settings, or file ownership.

A Component may be intentionally thin. Its panel can declare optional capability packages, such as
a renderer, transcription provider, media codec, Skill pack, MCP server, or knowledge connector;
those dependencies are installed and activated only when a user invokes the corresponding feature.
Fleet's local core therefore stays small and provides the host, permission path, session/task
lifecycle, file boundary and component loader, while heavy domain implementations remain lazy,
replaceable component dependencies. A component must expose a useful basic state when an optional
dependency is absent and explain the missing capability with an actionable install/configure path.

An **Assistant** is the identity that performs work (persona, model, prompt, requested loadout and
permission request). A **Workspace Composition** is the workspace-scoped selection and override
record: enabled Components, component settings, extra MCPs, extra knowledge sources, personal
habits, and panel preferences. A component may also be enabled globally, which supplies the default
for every Workspace; a workspace can disable or override that default. There is no artificial limit
on the number of enabled components. Defaults come from the installed Component; user and workspace
values are explicit overrides, not mutations of the vendor package. Removing a Component leaves
core data and artifacts intact and records an unavailable capability until restored.

The composition resolver is deterministic: official defaults < user profile defaults < workspace
overrides < session one-off choices. A session one-off is snapshotted at a turn boundary: a running
turn cannot change its tool/panel composition, and an accepted change is recorded so resume rebuilds
the same later-turn composition. Components may request capabilities; the existing permission path
decides whether they are granted. Components contribute through declared additive tool-entry
and workbench-panel slots. They may declare their own panel state and native domain data,
but cannot replace the main shell or create a second navigator. The host preserves a fallback entry
when a component is unavailable. This is the approved direction for per-workspace interfaces; it does not
authorize components to patch `AppShell` or create a second settings/permission authority. Fleet's
integration code may extend the existing host seam after the required Craft source comparison.

**Correct the inherited baseline before adding capabilities.** The owner's current order is:
classify and correct Craft's existing capabilities and services → verify and accept the corrected
baseline → build the Component/panel host → add domain Components → close external distribution.
The baseline exit is defined once in [`specs/R0-baseline-audit.md`](specs/R0-baseline-audit.md).
Passing tests or upstream equivalence alone does not authorize feature expansion. This supersedes
the earlier permission to build the host while baseline corrections remained open.

**Build the host before distributing components.** After baseline exit, the foundation slice connects
the mounted Files surface and surviving Notes RPC (with a real Notes consumer) to a registry,
scoped activation and user-controlled layout
before new domain components. It does not depend on R6 delegation, R9 memory or a public catalog.
R15 closes distribution and update safety; R18 closes advanced/multi-window layout beyond the
foundation. The executable contract is [`features/SYS-09-workspace-compositions.md`](features/SYS-09-workspace-compositions.md#release-contract--r18-component-and-panel-foundation).

**Test content is not product intent, but an explicit Component proposal is.** Stock-trading content
already present in Sessions came from chat and feature testing; it is not a required default Project
name and must not be renamed or deleted as framework cleanup. Separately, the owner has proposed a
future **Trading/Market Analysis Component**: an optional Workspace capability that may provide
market data, research, simulation/backtesting, strategy notes and (only after a separate safety
contract) broker actions. It is not part of Fleet Core and is `not implemented`. P6 must work for
arbitrary folders and names; this clarification is not permission to change live/test records.

## The rule that decides scope

> **Build it in when the person and the agent need to touch the same artifact in the same place.
> Leave it outside when the tool owns a deep domain with its own project format, and the agent only
> needs to drive it occasionally.**

This is one rule, not a checklist, and it settles the cases by itself.

**Inside** — a person edits it, an agent edits it, and it is the same file:

- **The infinite canvas.** Images, video, websites and decks are generated, edited and laid out
  here. This is *one surface*, not four capabilities. A person drags and types on it; an agent
  produces and revises on it; both see the same board.
- **Document editing.** Word, Excel, PowerPoint, PDF, Markdown and HTML — opened by the person,
  edited by either, saved back in the real format. **The person must be able to edit them directly**,
  not only ask the agent to.
- **The browser.** Automated for the agent, watchable and annotatable by the person.
- **Video and animation editing.** A timeline on the canvas, not a separate application.

**Outside** — the agent drives it:

- **Blender, Godot** and their kind. They own a deep domain, carry their own project formats and
  years of interface. Rebuilding them is impossible and embedding them is worse than driving them.

**Neither** — libraries are an implementation choice inside a surface, never a capability of their
own. Three.js, PixiJS and React Three Fiber are answers to "what renders this canvas", decided when
the canvas needs them, not before.

## What Fleet does not do

Named so nobody designs them again:

- **A universal external-computer controller in Core.** The owner's later request adds an optional
  **Component for specified local applications, serving interface development and office work**.
  R16/EXEC-15 owns that bounded addition after R0 and the Component host: selected app/window,
  host-governed action grants, fresh observation, visible Stop/Take over and an on-demand native
  adapter. Prefer the application's supported API or the existing browser before GUI input.
  [SYS-02](features/SYS-02-remote-office.md#local-app-computer-use-contract) owns its execution
  contract. This does not add a universal Core controller, another agent loop, unattended broad
  desktop access or a second OS sandbox. Source/helper comparison is executable preparation;
  a production binary/signing dependency still requires the existing admission checkpoint.
- **3D scene authoring, panorama relighting, multi-camera shot grids.** Modelling belongs to
  Blender, outside.
- **A second OS sandbox.** Fleet's permission path and process boundary already do what the
  candidates enforce on the platform it ships on.
- **Online sharing, collaboration invites, hosted accounts.** Local-first: nothing that requires an
  operator-run service to work.
- **Telemetry.** Same reason.
- **Speculative model routing and capability negotiation** with no real caller asking for it.

## The shape of a capability

Borrowed from Cindy, because Fleet has no answer of its own and needs one:

- **Core** carries only what the host must provide for everyone — the shell, agent and model
  connections, session and task lifecycle, the runtime and permission path that everything else runs
  inside, multi-device continuity, and the mechanics of installing things.
- **A Skill** describes *how work is done*. Natural language, scripts, or orchestration of existing
  tools. It needs no interface of its own.
- **A Component** carries a bounded capability, including any rich interaction surface and native
  domain state that the person and agent both operate. A **Plugin** is distribution packaging for
  Components, Skills and Sources, not another runtime or state authority (Decision P11).
- **An agent** provides the intelligence. Fleet connects it; Fleet does not reimplement it.

**Core stays pure.** No personal, team or industry-specific workflow enters it. When the boundary is
unclear, prove the capability as a Skill or a Component first.

Three consequences:

1. **An assistant is an identity, not a label and not a Qoder “expert kit”.** The person creates one
   by hand, or the agent creates one. Either way it is the same record: its own system prompt,
   commands, model, permission request, skills, MCP servers and plugins. The *effect* to match is
   AionUi's assistant (`源码参考/software/AionUi`, Apache-2.0). The *runtime* to steal from is Cindy's
   (approved snapshot, install/loadout, permission is a request never a grant). Storage is its own
   authority — never `labels/config.json`. The kit-as-label store was dropped in the 2026-09-10
   rebase; do not rebuild it.

   **Who wears it is not the identity.** AionUi binds an assistant to a CLI engine. Fleet does not.
   The same record can be worn by this conversation, by a delegate, or optionally wrapped around a
   CLI — and wrapping a CLI is a choice, never a requirement. Mid-conversation change is allowed;
   casual costume-change is not. If this conversation already has an identity and the next need is a
   different specialty (research while implementing, review while writing), the default is to
   **delegate** that identity as a sub-agent, not to swap who *this* conversation is. Switching the
   session's own identity is a confirmed action for when the job of this conversation actually
   changed. Any session may delegate (H28); there is no captain mode.
2. **Determinism belongs in code.** Branching, validation, state machines, permission control, error
   handling and retry are written; the prompt carries only what genuinely needs language.
3. **Do not patch Craft's `AppShell` to express a new surface.** A surface belongs to the one
   registered pane host required by R18. The former `packages/shared/src/layout` model is absent;
   extend the current host seam with real consumers rather than assuming that model is mounted.
   Adding an unrelated `isXNavigation` branch, sidebar row or second-level page is the discarded
   window model.

## How the interface behaves

- **Say the outcome, not the mechanism.** The person never needs to see `kind`, `valueType`,
  `.mcp.json`, or a storage schema's field names. Internal vocabulary stays internal.
- **Buttons name the action, not the state.** "Install", never "not installed".
- **No second-level pages where a panel will do** — and when a page is retired, its links keep
  resolving to whatever replaced it. Simplifying is not deleting.
- **Structured results beat prose.** Anything better shown as a table, a diff, a timeline or a
  canvas is not flattened into text.
- **Every refusal names its reason** so the surface can explain itself.

## Document authority and retirement

Current owner instructions set the task. Each question has one home:

| Question | Home |
|---|---|
| What Fleet is, scope, capabilities, terms | this document |
| Durable choices, hard constraints, the owner's exact words | [`DECISIONS.md`](DECISIONS.md) |
| Development order and current slice | [`TODO.md`](../TODO.md) |
| Bounded acceptance for an active slice | [`specs/`](specs/) |
| One closed feature loop and its execution contracts | [`features/`](features/) |
| Architecture and code entry points | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Visual values, layout and motion | [`DESIGN.md`](../DESIGN.md) |
| Pages and surfaces | [`PAGE-STRUCTURE.md`](PAGE-STRUCTURE.md) |
| Reference projects | [`REFERENCES.md`](REFERENCES.md) |
| History of how any of this changed | [`CHANGELOG.md`](../CHANGELOG.md) |

Maps of pages, code and capabilities describe observed implementation; they never turn a proposal
into shipped behaviour. Research notes supply evidence, not a competing execution order.

Absorb useful requirements, mechanisms and evidence into their canonical home, update incoming
links, then delete superseded project documents and files. Do not retain a duplicate just by
labeling it historical or moving it to an in-tree archive. Git history retains tracked evidence;
untracked material needs a verified recovery copy before destructive removal. Retain a source note
only while it has unique, still-relevant value. User data, license notices and external reference
checkouts are separate from obsolete project documentation and keep their own retention rules.

## Capability register

Every product capability, whether or not it exists yet. **Inclusion is not a claim of
implementation.** After the 2026-09-21 rebuild and the 2026-09-22 original-source reset, Fleet's
Component host, Assistant store, layout model, remote pairing and cache-economy helpers are absent;
`wired but not visually checked` marks surviving Craft paths, not owner acceptance.

How to read a row:

- **Class** is relative to the current `app/`: REUSE, EXTEND or NEW (Craft lacks the domain model or
  adapter; never a licence for a new shell, kernel, store, permission path or settings home).
- **Status** uses the fixed vocabulary in `AGENTS.md`.
- **Loop** is the one feature document holding the row's `Execution <ID>` section: next bounded step,
  source paths, data owner, failure handling, proof and reference route. `—` means no packet yet;
  such a row must not be implemented from its one-line summary.
- **Surfaces** are [page IDs](PAGE-STRUCTURE.md). **Release** is the anchor in the
  [`TODO.md`](../TODO.md) ladder, followed by the minimum gate in *Acceptance gates* below.
- **State** is packet depth: `BREADTH_ONLY` (named and placed, no grounded packet), `PACKET_DRAFT`
  (packet exists; evidence, seams or acceptance incomplete), `READY_FOR_SPEC` (first slice fully
  specified — not whole-capability completion). A `PROVE` next step stays `PACKET_DRAFT`.

Rules: add a row before building a large capability; removing a row needs an owner decision in
[`DECISIONS.md`](DECISIONS.md) — "not now" is not removal; every row keeps a release anchor.

### Core and work surfaces

| ID | Capability | Context / kind | Class | Status | Loop | Surfaces | Release / acceptance | State | Compatibility anchor |
|---|---|---|---|---|---|---|---|---|---|
| CORE-01 | App shell and runtime | Work Core / core | REUSE | wired but not visually checked | features/SYS-01-agent-os.md | P-01 | R0 / CORE-01-A | READY_FOR_SPEC | Craft AppShell + PanelStackContainer; compare and correct the current shell; never restore a discarded renderer |
| CORE-02 | Project/Workspace boundary | Work Core / core | EXTEND | wired but not visually checked | features/SYS-01-agent-os.md | P-03 | R1 / CORE-02-A | READY_FOR_SPEC | R1 retains Workspace/Project scopes and extends shell, draft context and live activity |
| CORE-03 | Session and chat | Work Core / core | REUSE/EXTEND | wired but not visually checked | features/SYS-01-agent-os.md | P-02 | R3,R4 / CORE-03-A | READY_FOR_SPEC | SessionManager + SessionEvents; v0.13.4 steering and mid-stream queue |
| CORE-04 | Structured tasks, scheduling and task-center projection | Work Core / core | EXTEND | backend wired but not visually checked; default task-center surface not implemented | features/SYS-01-agent-os.md | P-04 | R4,R6 / CORE-04-A | READY_FOR_SPEC | Craft Task store + TaskRunner; one Session authority |
| CORE-05 | Settings and preferences | Work Core / core | EXTEND | wired but not visually checked | features/SYS-01-agent-os.md | P-05 | R1,R2 / CORE-05-A | READY_FOR_SPEC | upstream Settings home; Fleet target model/runtime flow not implemented |
| CORE-06 | Search, filters and saved views | Work Core / surface | EXTEND | wired but not visually checked | features/SYS-01-agent-os.md | P-06 | R0 / CORE-06-A | READY_FOR_SPEC | Craft Session search/filter/view projections; Fleet cross-domain command search not implemented |
| CORE-07 | Onboarding and first-run | Work Core / surface | EXTEND | wired but not visually checked | features/SYS-01-agent-os.md | P-07 | R2 / CORE-07-A | READY_FOR_SPEC | Craft first-run flow; Fleet service-independence acceptance must be re-established |
| CORE-08 | Help, docs and support | Work Core / surface | EXTEND | not implemented | features/SYS-01-agent-os.md | P-08 | R2 / CORE-08-A | READY_FOR_SPEC | Original bundled files and hosted guidance coexist; Fleet local-help correction is withdrawn |
| CORE-09 | Updates, packaging and distribution | Integrations / adapter | EXTEND | not implemented | features/SYS-01-agent-os.md | P-09 | R2 / CORE-09-A | READY_FOR_SPEC | Original Craft updater/download/quit-install remains; no Fleet distribution channel or implemented Fleet boundary |
| CORE-10 | Internationalization and identity | Work Core / capability | EXTEND | wired but not visually checked | features/SYS-01-agent-os.md | P-01,P-05 | R1 / CORE-10-A | READY_FOR_SPEC | Craft i18n + IDs; Fleet terminology/identity convergence not implemented |
| CORE-11 | Panels, docking and layout | Composition / surface | EXTEND | fixed-column sizing wired but not visually checked; registered/movable host not implemented | features/SYS-09-workspace-compositions.md | P-10 | Early R15/R18 foundation (`specs/R18-right-workbench.md`), then R18 native-window closure / CORE-11-A,WB-001..003 | PACKET_DRAFT | after the R0 baseline exit, early R15/R18 foundation reuses current surfaces; shared layout model and old right workbench are absent |

### Files, evidence and information

| ID | Capability | Context / kind | Class | Status | Loop | Surfaces | Release / acceptance | State | Compatibility anchor |
|---|---|---|---|---|---|---|---|---|---|
| INFO-01 | Workspace files and file tools | Information / core | REUSE/EXTEND | wired but not visually checked | features/SYS-04-browser-evidence.md | P-11 | R0,R3 / INFO-01-A | READY_FOR_SPEC | Craft filesystem/permission path; SessionFilesSection mounted through SessionInfoPopover |
| INFO-02 | Library and ArtifactRef | Information / product | NEW | not implemented | features/SYS-04-browser-evidence.md | P-12 | R5 / INFO-02-A | READY_FOR_SPEC | one version/provenance authority |
| INFO-03 | Browser evidence and capture | Information / product | EXTEND | BrowserPane wired but not visually checked; Fleet capture/evidence not implemented | features/SYS-04-browser-evidence.md | P-15,P-16 | R3,R5 / BRW-001..004 | READY_FOR_SPEC | separate BrowserPane window survives; prior in-shell workbench embedding absent |
| INFO-04 | Document ingestion and conversion | Information / capability | EXTEND | wired but not visually checked | features/SYS-04-browser-evidence.md | P-13 | R3 / INFO-04-A | READY_FOR_SPEC | Craft Sources/conversion tools; Fleet provenance extension not implemented |
| INFO-05 | Document editing and preview | Creative Media / product | EXTEND | preview wired but not visually checked; native document editing not implemented | features/SYS-05-design-spatial.md | P-14 | R3 preview-only; R10 native documents; R13 advanced deck/motion / INFO-05-A | PACKET_DRAFT | TipTap editor exists with a playground caller only; preview is not editable Word/Excel/PowerPoint/PDF |
| INFO-06 | Search indexing and retrieval | Information / surface | EXTEND | wired but not visually checked | features/SYS-04-browser-evidence.md | P-06 | R0,R3 / INFO-06-A | READY_FOR_SPEC | Craft search/view projection; no claim of Fleet cross-domain index |
| INFO-07 | Provenance and citation | Information / capability | NEW | not implemented | features/SYS-04-browser-evidence.md | P-16 | R5 / INFO-07-A | READY_FOR_SPEC | ArtifactRef + timeline evidence |
| INFO-08 | Import/export and migration | Information / capability | EXTEND | not implemented | features/SYS-04-browser-evidence.md | P-17 | R2,R5 / INFO-08-A | READY_FOR_SPEC | Fleet local export was withdrawn; format import/export and migration need native-owner fidelity proof |

### Agent, execution and collaboration

| ID | Capability | Context / kind | Class | Status | Loop | Surfaces | Release / acceptance | State | Compatibility anchor |
|---|---|---|---|---|---|---|---|---|---|
| EXEC-01 | Permissions, approvals and safety | Governed Execution / core | EXTEND | wired but not visually checked | features/SYS-01-agent-os.md | P-18 | R2,R4 / EXEC-01-A | READY_FOR_SPEC | Craft mode-manager + PreToolUse; prior Fleet child-permission narrowing requires revalidation |
| EXEC-02 | Actions and caller-aware action seam | Governed Execution / core | NEW/EXTEND | not implemented | features/SYS-01-agent-os.md | P-18,P-50 | R4 / EXEC-02-A | READY_FOR_SPEC | one executor/policy/evidence path |
| EXEC-03 | Terminal and local execution | Governed Execution / core | EXTEND | wired but not visually checked | features/SYS-01-agent-os.md | P-19 | R0,R4,R18 / EXEC-03-A | PACKET_DRAFT | Craft Bash/background execution; Fleet command-runner panel and persistent PTY not implemented |
| EXEC-04 | Multi-agent delegation | Governed Execution / product | EXTEND | Craft child Sessions/TaskRunner wired but not visually checked; Fleet delegation gates not implemented | features/SYS-01-agent-os.md | P-20 | R6 / EXEC-04-A | READY_FOR_SPEC | one Session/Task authority; TaskBrief, RunReport and DelegationStrip paths absent |
| EXEC-05 | Runtime/provider adapters | Governed Execution / adapter | EXTEND | Craft Claude/Pi lanes wired but not visually checked; general CLI adapters not implemented | features/SYS-01-agent-os.md | P-21 | R0,R6 / EXEC-05-A | PACKET_DRAFT | provider SDK lanes are not the removed general CLI discovery/handshake layer |
| EXEC-07 | Worktree isolation | Governed Execution / capability | NEW | not implemented | features/SYS-02-remote-office.md | P-23 | R6 / EXEC-07-A | READY_FOR_SPEC | Git/process lifecycle |
| EXEC-08 | Inherited execution isolation | Governed Execution / capability | REUSE/EXTEND | wired but not visually checked | features/SYS-01-agent-os.md | P-18,P-24 | R0,R2 inherited-boundary verification; second sandbox excluded / EXEC-08-A | READY_FOR_SPEC | existing permission, filesystem/network/env and script-isolation paths; validate and correct under R0/R2. A second OS/container sandbox is excluded, not queued for R18 |
| EXEC-09 | Remote, cloud execution and later phone connector | Governed Execution / adapter | EXTEND | Craft remote routing wired but not visually checked; Fleet pairing not implemented | features/SYS-02-remote-office.md | P-25 | R14 / EXEC-09-A | READY_FOR_SPEC | Original URL/token Workspace route only; Fleet device grants, Orca-like phone connector and target interaction not implemented; Windows/macOS/Linux host targets |
| EXEC-10 | Automations and scheduler | Integrations / capability | EXTEND | wired but not visually checked | features/SYS-01-agent-os.md | P-26 | R4 / EXEC-10-A | READY_FOR_SPEC | Craft automation scheduler/history; Fleet extensions require current evidence |
| EXEC-11 | Messaging and channel adapters | Integrations / adapter | EXTEND | not implemented | features/SYS-02-remote-office.md | P-27 | R14 / EXEC-11-A | PACKET_DRAFT | Workspace-scoped gateway |
| EXEC-13 | Git repository, branch and PR review delivery | Integrations / product | EXTEND/NEW | not implemented | features/SYS-02-remote-office.md | P-54, P-60 | R14 / EXEC-13-A (diff ladder starts R3-era per C4) | READY_FOR_SPEC | governed Git/PR adapter; never a task authority |
| EXEC-14 | System prompt, effective execution profile and agent identity configuration | Governed Execution / capability | EXTEND | not implemented | features/SYS-03-context-economy.md | P-55 | TE1,R3 / EXEC-14-A | READY_FOR_SPEC | one prompt/tool projection over provider + permission seams |
| EXEC-15 | Specified local-app Computer Use Component | Governed Execution / Component | EXTEND/NEW | not implemented | features/SYS-02-remote-office.md | P-18,P-56 | R16 after R0 + Component foundation / EXEC-15-A | PACKET_DRAFT | R16 after R0 and Component foundation; SYS-02 helper/permission/target proof. Browser/process routes remain existing mechanisms; no general Core controller or second sandbox |

### Intelligence economics and memory

| ID | Capability | Context / kind | Class | Status | Loop | Surfaces | Release / acceptance | State | Compatibility anchor |
|---|---|---|---|---|---|---|---|---|---|
| INTEL-01 | Context/effective capability projection and compaction | Intelligence / capability | EXTEND | Craft context indicator/compaction wired but not visually checked; full effective projection not implemented | features/SYS-03-context-economy.md | P-29 | TE1,R3,R9 / INTEL-01-A | READY_FOR_SPEC | v0.13.4 context-usage events and composer context-display; removed TE1 inspector is not upstream coverage |
| INTEL-02 | Token optimization and cache strategy | Intelligence / capability | EXTEND | not implemented | features/SYS-03-context-economy.md | P-29 | TE1,R3 / INTEL-02-A | PACKET_DRAFT | extend current prompt/tool assembly and UsageTracker; prior Fleet TE1 normalization/attribution is absent |
| INTEL-03 | Model routing and capability negotiation | Intelligence / adapter | NEW/EXTEND | Craft thinking-level mapping wired but not visually checked; routing not implemented | features/SYS-03-context-economy.md | P-30 | R17 / INTEL-03-A | PACKET_DRAFT | provider adapters remain; speculative routing stays out of scope until a real caller needs it |
| INTEL-04 | Cost and usage ledger | Intelligence / core | NEW/EXTEND | not implemented | features/SYS-03-context-economy.md | P-30 | TE1,R3,R17 / INTEL-04-A | READY_FOR_SPEC | Craft usage events remain; Fleet ledger/rollups absent; real/estimated/unknown stay distinct |
| INTEL-05 | Layered agent-maintained memory | Intelligence / product | NEW | not implemented | features/SYS-03-context-economy.md | P-31 | R9 / MEM-001..005,INTEL-05-A | READY_FOR_SPEC | autonomous accumulation + logged consolidation; curation optional; D5 floors |
| INTEL-06 | Prompt, skill and context loadouts | Intelligence / capability | EXTEND | not implemented | features/SYS-03-context-economy.md | P-32 | R15 / INTEL-06-A | READY_FOR_SPEC | install/loadout/runtime separated; feeds one effective projection |
| INTEL-07 | Evaluation and regression evidence | Intelligence / capability | NEW | not implemented | features/SYS-03-context-economy.md | P-33 | R3,R17 / INTEL-07-A | READY_FOR_SPEC | verifier separate from executor |

### Creative and media surfaces

| ID | Capability | Context / kind | Class | Status | Loop | Surfaces | Release / acceptance | State | Compatibility anchor |
|---|---|---|---|---|---|---|---|---|---|
| CREATE-01 | Spatial canvas and orchestration | Composition / surface | NEW | not implemented | features/SYS-05-design-spatial.md | P-34 | R7 / CAN-001..005 | PACKET_DRAFT | production board hosts generation/editing/layout; native document/sequence owners keep domain truth; prior preview absent |
| CREATE-02 | Video and media editing | Creative Media / product | NEW | not implemented | features/SYS-06-media-production.md | P-35 | R12 / VID-001..004 | PACKET_DRAFT | sequence + Job + ArtifactRef |
| CREATE-03 | Image generation and editing | Creative Media / product | NEW | not implemented | features/SYS-06-media-production.md | P-36 | R11 / CREATE-03-A | READY_FOR_SPEC | generation Job + provenance |
| CREATE-04 | Audio, voice and music | Creative Media / product | NEW | not implemented | features/SYS-06-media-production.md | P-37 | R12 / CREATE-04-A | READY_FOR_SPEC | media Job + track provenance |
| CREATE-05 | Captions, transcript and translation | Creative Media / capability | NEW/EXTEND | not implemented | features/SYS-06-media-production.md | P-38 | R12 / CREATE-05-A | READY_FOR_SPEC | word ranges map to clips |
| CREATE-06 | Design editor | Creative Media / product | NEW | not implemented | features/SYS-05-design-spatial.md | P-39 | R10 / DSN-001..004 | PACKET_DRAFT | transactional native schema |
| CREATE-07 | Web artifact editor/preview | Creative Media / product | NEW | not implemented | features/SYS-05-design-spatial.md | P-40 | R10 / CREATE-07-A | READY_FOR_SPEC | isolated preview + ArtifactRef |
| CREATE-08 | Deck and presentation | Creative Media / product | NEW | not implemented | features/SYS-06-media-production.md | P-41 | R13 / DECK-001..004 | PACKET_DRAFT | native document + exporters |
| CREATE-09 | Motion graphics and animation | Creative Media / capability | NEW | not implemented | features/SYS-06-media-production.md | P-42 | R13 / CREATE-09-A | PACKET_DRAFT | composition/renderer adapter |
| CREATE-10 | Storyboard and shot planning | Creative Media / product | NEW | not implemented | features/SYS-06-media-production.md | P-43 | R12 / CREATE-10-A | READY_FOR_SPEC | plans link to media/artifacts |
| CREATE-11 | Templates, brand kits and reusable assets | Creative Media / capability | NEW | not implemented | features/SYS-05-design-spatial.md | P-44 | R10,R13 / CREATE-11-A | READY_FOR_SPEC | Library assets + provenance |
| CREATE-12 | Export, render and delivery profiles | Integrations / capability | NEW | not implemented | features/SYS-06-media-production.md | P-45 | R5,R8,R10-R14 / CREATE-12-A | READY_FOR_SPEC | Job output + fidelity declaration |
| CREATE-16 | Long-form narrative and content generation | Creative Media / product | NEW | not implemented | features/SYS-05-design-spatial.md | P-14 | R10 / CREATE-16-A | READY_FOR_SPEC | native document authority + governed generation actions |

### Orchestration and extensibility

| ID | Capability | Context / kind | Class | Status | Loop | Surfaces | Release / acceptance | State | Compatibility anchor |
|---|---|---|---|---|---|---|---|---|---|
| ORCH-01 | Workflow definition editor | Composition / product | NEW | not implemented | features/SYS-07-workflow-delivery.md | P-46 | R8 / WF-001..004 | READY_FOR_SPEC | finite typed DAG |
| ORCH-02 | Workflow execution and run history | Governed Execution / surface | NEW | not implemented | features/SYS-07-workflow-delivery.md | P-47 | R8 / ORCH-02-A | READY_FOR_SPEC | TaskRunner projection |
| ORCH-03 | Component manager and workspace compositions | Intelligence / product | EXTEND | not implemented | features/SYS-09-workspace-compositions.md | P-48,P-56 | Early R15/R18 foundation (`specs/R18-right-workbench.md`), before domain components / ORCH-03-A | READY_FOR_SPEC | early R15/R18 host + scoped settings proof before domain components; no R6/R9 prerequisite; prior shared Component resolver is absent |
| ORCH-04 | Agent tool registry and MCP | Governed Execution / adapter | EXTEND | not implemented | features/SYS-08-marketplaces.md | P-48,P-56 | R4,R6 / ORCH-04-A | READY_FOR_SPEC | one action/tool policy path |
| ORCH-05 | Jobs, queues and resource scheduling | Integrations / core | NEW | not implemented | features/SYS-06-media-production.md | P-49 | R11-R13 / JOB-001..004 | READY_FOR_SPEC | one cancellable Job authority |
| ORCH-06 | Event stream and activity history | Work Core / core | EXTEND | wired but not visually checked | features/SYS-01-agent-os.md | P-50 | R3,R4 / ORCH-06-A | READY_FOR_SPEC | Craft SessionEvents/timeline; prior Fleet evidence extensions require revalidation |
| ORCH-07 | Notifications, approvals and inbox | Composition / surface | EXTEND | not implemented | features/SYS-01-agent-os.md | P-51 | R4,R6 / ORCH-07-A | READY_FOR_SPEC | permission/session evidence |
| ORCH-08 | Diagnostics, health and recovery | Integrations / capability | NEW | not implemented | features/SYS-01-agent-os.md | P-52 | R0,R2,R18 / ORCH-08-A | READY_FOR_SPEC | failure classification |
| ORCH-10 | Skill marketplace and loadout distribution | Intelligence / product | NEW/EXTEND | not implemented | features/SYS-08-marketplaces.md | P-56,P-57 | R15 / ORCH-10-A | READY_FOR_SPEC | origin/integrity-verified skill manifest, compatibility and one loadout authority |
| ORCH-11 | Component marketplace and lifecycle | Governed Execution / product | NEW/EXTEND | not implemented | features/SYS-08-marketplaces.md | P-56,P-58 | R15 / ORCH-11-A | READY_FOR_SPEC | trust, permissions, install/update/rollback, runtime isolation, and workspace enable/override records |
| ORCH-12 | MCP server marketplace and connector registry | Governed Execution / adapter | NEW/EXTEND | not implemented | features/SYS-08-marketplaces.md | P-56,P-59 | R15 / ORCH-12-A | READY_FOR_SPEC | server manifest, tool capabilities, credential scope and health |

## Acceptance gates

This index prevents page and registry rows from carrying empty acceptance anchors. The `-A` IDs
below are breadth gates: they become executable only when copied into an active module/release spec
with a concrete code path, evidence command and status. They are intentionally not marked done.

| ID | Observable criterion (minimum) | Evidence required |
|---|---|---|
| CORE-01-A | Shell launches and routes to every usable baseline surface without a duplicate host | dev launch + route smoke |
| CORE-02-A | A Project boundary resolves one workspace root and rejects an out-of-bound path | boundary test + trace |
| CORE-03-A | Session stream, cancellation and event history use one Session authority | RPC/data-path trace |
| CORE-04-A | Structured task mutations round-trip through the existing task store; any task-center view remains a projection and ordinary R1 Sessions need no duplicate Task record | task-store test + projection/data-path audit |
| CORE-05-A | Settings changes persist and are read from one settings home | settings test |
| CORE-06-A | Search/filter/view state is a projection and survives reload without copying domain data | view test |
| CORE-07-A | First-run creates or selects a workspace and reports missing provider setup honestly | onboarding smoke |
| CORE-08-A | Help links identify local, user-configured and unavailable sources | state walkthrough |
| CORE-09-A | Update check/install failure is visible and never points to a Craft-owned channel | packaging smoke |
| CORE-10-A | zh-Hans/en labels and stable identity IDs remain consistent across shell and settings | i18n check |
| CORE-11-A | Opening two native surfaces preserves layout while domain state remains in its owner | layout smoke |
| INFO-01-A | File actions enforce workspace containment and report conflict/denial explicitly | path + permission test |
| INFO-02-A | A produced artifact has an exact version and a single provenance owner | artifact data-path trace |
| INFO-03-A | A permitted browser capture links session, URL/time and artifact provenance | browser capture trace |
| INFO-04-A | Ingestion produces a readable source plus conversion provenance or an explicit failure | ingestion fixture |
| INFO-05-A | A production editor opens, edits, saves and reopens each claimed real format through its native owner; preserve originals, report unsupported constructs, and prove human/Agent edits plus dirty/conflict/save recovery. Preview acceptance alone does not satisfy editing | per-format fixtures + save/reopen and failure traces; R3 proves only preview |
| INFO-06-A | Search results can be refreshed/rebuilt without becoming a source-of-truth copy | index rebuild test |
| INFO-07-A | Citation points to immutable evidence and shows unavailable/deleted source truth | provenance fixture |
| INFO-08-A | Import/export preserves source separately and declares unsupported fidelity | migration fixture |
| EXEC-01-A | A denied or approval-required action is blocked by the shared policy path | PreToolUse test |
| EXEC-02-A | Human and Agent callers invoke the same action contract with attributed evidence | dual-caller trace |
| EXEC-03-A | Terminal output, cancel, restart and failure states are observable and scoped to a session | terminal smoke |
| EXEC-04-A | Delegation creates a child in the existing Session/Task tree and returns a validated report | delegation trace |
| EXEC-05-A | A runtime adapter reports supported/unsupported capabilities without guessing | adapter contract test |
| EXEC-07-A | Worktree occupancy and cleanup are idempotent and never confused with a location path | lifecycle test |
| EXEC-08-A | Retained execution enforces its declared filesystem/network/process limits through core policy; denied/unsupported cases fail visibly and cancel/restart cleans owned resources. No new container lifecycle is implied | inherited-path boundary and cleanup fixtures under R0/R2 |
| EXEC-09-A | Remote disconnect and grant revocation prevent further execution with honest status | transport test |
| EXEC-10-A | An automation invokes governed actions and records schedule/run outcome in existing history | scheduler smoke |
| EXEC-11-A | Channel failure/reconnect is isolated from local core and scoped to a workspace | adapter test |
| EXEC-13-A | Git/branch/PR actions are attributed, permissioned, reviewable and cannot replace the Task/Session authority | Git fixture + permission trace |
| EXEC-14-A | One Craft-owned effective prompt/tool projection is versioned, scoped and attributable; profile changes cannot silently weaken policy or create a second harness | prompt/profile fixture + policy regression |
| EXEC-15-A | Optional local-app Component observes/acts/verifies only the selected app/window through host permission and fresh target identity; Stop/revoke prevents queued input, unknown delivered effects reconcile; no general Core controller or second sandbox | SYS-02 helper comparison and disposable-app/office-app observe-act-verify-stop fixtures, including denial, stale targets and crash |
| INTEL-01-A | Context projection lists included/excluded evidence and can be compared before sending | projection fixture |
| INTEL-02-A | Token/cache optimization lowers cost per accepted outcome on a sealed model×harness×task comparison, preserves quality and a switch-off path | usage + acceptance benchmark |
| INTEL-03-A | Model capability negotiation rejects unsupported parameters before execution | adapter test |
| INTEL-04-A | Cost ledger distinguishes real, estimated and unknown usage and never treats unknown as zero | ledger fixture |
| INTEL-05-A | Authorized autonomous memory consolidation records sources and scope, respects pins and excludes secrets; user curation/deletion removes retained content and derived indexes without rewriting raw history | MEM-001..005 under the single consolidation writer |
| INTEL-06-A | Install, loadout and runtime states are distinct and permissioned | loadout test |
| INTEL-07-A | Evaluation result names the tested input, verifier and artifact evidence independently of executor | regression fixture |
| CREATE-01-A | Canvas projects native records, invokes one governed action and persists no domain duplicate | Electron canvas smoke |
| CREATE-02-A | Video imports media, applies a shared edit command and produces a cancellable real render | media fixture + render job |
| CREATE-03-A | Image generation/editing returns a provenance-bearing artifact through the shared Job path | job fixture |
| CREATE-04-A | Audio/voice/music tracks retain source, timing and generation provenance | media fixture |
| CREATE-05-A | Transcript ranges map deterministically to captions/clips and expose translation failure | mapping fixture |
| CREATE-06-A | Design mutations are schema-valid ordered batches with attribution and inverse/recovery scope | mutation test |
| CREATE-07-A | Web preview is isolated, versioned and cannot silently mutate the source artifact | preview smoke |
| CREATE-08-A | A deck has a native source model and export output with declared fidelity limits | export fixture |
| CREATE-09-A | Motion composition renders through a replaceable adapter and reports missing assets | renderer test |
| CREATE-10-A | Storyboard shots link to media/artifacts and survive reordering without losing identity | storyboard fixture |
| CREATE-11-A | Template/brand assets have provenance, scope and safe reuse boundaries | library fixture |
| CREATE-12-A | Export profile creates one Job output receipt and preserves source/output separately | delivery smoke |
| CREATE-16-A | Long-form generation applies governed document actions, preserves human edits and records prompt/model/source provenance | document generation fixture |
| ORCH-01-A | Workflow definition validates a typed finite DAG and rejects cycles/stale versions | schema test |
| ORCH-02-A | Workflow run projects TaskRunner status and never creates a second run authority | run trace |
| ORCH-03-A | Component registration and scoped activation reuse existing Settings/Skill/Source owners; show requested versus granted capability, support disable/unload and preserve native data | FND-01..08 host and resolver/lifecycle fixtures |
| ORCH-04-A | Tool/MCP registration uses the shared action/policy path and records capability scope | registry test |
| ORCH-05-A | Job queue supports progress, cancel, retry and resource limits through one authority | queue test |
| ORCH-06-A | Activity history correlates events to the owning Session/Task/Artifact without duplication | event trace |
| ORCH-07-A | Inbox approval/notification resolves to a real permission or session event | inbox smoke |
| ORCH-08-A | Diagnostics classifies failure and offers only a recovery action that actually exists | failure fixture |
| ORCH-10-A | Skill marketplace discovers origin/integrity-verified manifests, requiring signatures where the distribution contract specifies them, shows compatibility/permissions, installs into a scoped loadout, and supports disable/update/rollback | marketplace fixture |
| ORCH-11-A | Component marketplace verifies provenance and license, previews requested capabilities, requires permission approval, isolates runtime, and recovers from failed update/uninstall | plugin lifecycle test |
| ORCH-12-A | MCP marketplace registers server capabilities and health, scopes credentials per grant, exposes tool risk before install, and removes/revokes a server without stale tools | MCP registry test |

### Promotion rule

When a row enters an active spec, replace the minimum criterion with the release-specific Given /
When / Then, add exact files/symbols and run commands, and set the status in both the packet index
and registry. A page is not `usable` merely because this index has an ID.

### Packet subcriteria namespace

Starter packets use short subcriteria names (`VID-001`, `CAN-001`, `BRW-001`, `MEM-001`, `JOB-001`,
`DSN-001`, `DECK-001`, `WF-001`, and `WB-001`) for readability. They are not a second acceptance
authority: each resolves to one canonical registry criterion below, and an active spec must carry
the exact Given/When/Then and evidence path.

| Packet prefix | Canonical registry criterion |
|---|---|
| VID | CREATE-02-A |
| CAN | CREATE-01-A |
| BRW | INFO-03-A |
| MEM | INTEL-05-A |
| JOB | ORCH-05-A |
| DSN | CREATE-06-A |
| DECK | CREATE-08-A |
| WF | ORCH-01-A |
| WB | CORE-11-A |
| FND (foundation spec FND-01..08) | CORE-11-A + ORCH-03-A; detailed current acceptance lives in `features/SYS-09-workspace-compositions.md` |

## Product matrix

> **Every product domain, always.** The module registry is the anti-omission breadth authority;
> this matrix maps those capabilities to product behavior, authorities and acceptance. No domain is
> ever deleted from design because of integration ordering (Decision G5). Durable module depth lives
> in `modules/`; an implementation slice gets a full spec in `specs/` when it becomes ACTIVE, and its pages live in
> [`PAGE-STRUCTURE.md`](PAGE-STRUCTURE.md). Rows must stay honest: update a row in the
> same slice that changes its facts. Current implementation is the Craft v0.13.4 baseline restored
> on 2026-09-21; prior Fleet extensions remain at `snapshot/pre-rebuild-2026-09-21`. Inherited
> runtime paths without fresh complete acceptance are `wired but not visually checked`; neither
> snapshot acceptance nor passing component tests establishes a usable product loop.
>
> Reference admission grades come from the **single admission authority**
> [`references/REFERENCES.md`](REFERENCES.md)
> (`FORMAL_REFERENCE | MODULE_REFERENCE | LOCAL_IMPROVEMENT | EVIDENCE_ONLY | REJECT`; unaudited =
> *candidate*). A named project is never license to copy its shell (Decision F3). Unfinished
> admission work belongs to that registry and the consuming suite's execution/proof contract.

### How to read a row

| Column | Meaning |
|---|---|
| Status | capability vocabulary for the domain's *core loop* today |
| Gap | the biggest missing piece between today and the vision |
| Reference to audit | first external source to inspect, with admission state; this is not a selected dependency |
| Backend authority | the one Craft/Fleet authority that owns the state (never duplicated) |
| Acceptance anchor | where its criteria live or will live |

### A. Work core

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Sessions & work list | CORE-03, ORCH-06 | session lifecycle, streaming, queueing, steering, event stream/activity timeline, one list | `wired but not visually checked` | Craft Board is a Sessions view mode; P5 permits a separate navigator only as the same Session/Task projection | Craft v0.13.4 | SessionManager + SessionEvents | [`PROJECT-SPEC.md`](PROJECT-SPEC.md) |
| Project / Workspace | CORE-02 | visible Workspaces, scoped Project memberships, folder references and remote routing | `wired but not visually checked` for the R1 shell/context changes | Revised P6 retains both Workspace and Project. R1 owns the single sidebar, Board entry, right tools, empty composer and derived activity; no record migration. | Craft v0.13.4 | Workspace stores | [`PROJECT-SPEC.md`](PROJECT-SPEC.md) |
| Tasks, scheduling & later task center | CORE-04 | optional structured tasks, statuses, scheduler; Kanban as its own navigator | `wired but not visually checked` inherited Task/Session mechanisms; Fleet Board separation `not implemented` | current `board` route resolves to Sessions `viewMode: board`; P5 permits a separate navigator; it does not require a second store or duplicate Conversation list | Craft v0.13.4 | Task stores + Session | `/board` vs `sessions` |
| Permissions & safety | EXEC-01 | modes, PreToolUse gate, approvals, command validation | `wired but not visually checked` (Craft) | caller-aware policy identity across Ask (R4); explainable command rules (S3) | Craft; `software/codex` EVIDENCE_ONLY (rule shape) | mode-manager + PreToolUse + SessionManager | R4 spec |
| Terminal & local execution | EXEC-03 | Bash + background shell, output/cancel/restart truth | `wired but not visually checked` (Craft baseline) | Fleet-wide target contract; interactive PTY = CONDITIONAL (real caller gate) | Craft | Bash/background path in SessionManager | R18 implement-or-`NO_GAP` closure |
| Settings | CORE-05 | one settings home: AI, appearance, permissions, labels, server, messaging… | `wired but not visually checked` (inherited Craft settings and zh-Hans) | honest service classes per P8 | Craft | settings stores | [`specs/R2-independence.md`](specs/R2-independence.md) |
| Search, labels, archive & views | CORE-06, INFO-06 | search indexing/retrieval, dynamic views, filters, archive/recovery | `wired but not visually checked` | Original search/filter/archive remain; Fleet navigation and shared full/compact scope corrections were withdrawn. Cross-domain search is owned by R5 / INFO-06. | Craft | search/views + labels + Session commands | R1 |
| Automations | EXEC-10 | schedules, automation handlers | `wired but not visually checked` (Craft) | route through governed actions once R4 exists | Craft | automations + scheduler | R4 follow-up |
| Onboarding | CORE-07 | first-run, workspace creation, provider setup | `wired but not visually checked` (Craft) | plain-language pass; no Craft-service implication (P8) | Craft | Electron onboarding flow | R2 spec |

### B. Files, artifacts and evidence

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Workspace files | INFO-01 | file tools, containment, permissioned mutation | `wired but not visually checked` (Craft) | version/precondition conflict rules; generic file history is `not implemented`. Recovery is `none` unless a verified snapshot/commit covers the exact version. R5 defines measured lease/renewal/reconciliation and atomic-write recovery; expiry alone is not proof that a writer stopped | Craft | Workspace filesystem + file tools | R5 |
| Storyboard and shot planning | CREATE-10 | shot identity, ordering and regeneration for the video timeline | `not implemented` | source-to-shot links and deterministic grid manifest | storyboard/video candidate pool; no formal reference | sequence/storyboard + ArtifactRef | R13 / CREATE-10-A |
| ArtifactRef & Library | INFO-02, INFO-07, CREATE-11 | exact versions, provenance, cross-surface handoff, Library view, templates/brand kits as reusable Library assets | `not implemented` | first producer→consumer pair; minimal envelope seed (D6, adopted from review): `{ id, version, kind, nativeOwner, workspaceId }` — no speculative fields (no `consumers[]`) | `plugins/markitdown` MODULE_REFERENCE-candidate (ingestion only) | none yet — smallest new authority at R5 | R5 |
| Browser & evidence | INFO-03 | BrowserPane, capture, annotate, governed CDP | `wired but not visually checked` (Craft BrowserPane baseline); capture/evidence `not implemented` | evidence-capture policy surface (E6); artifact links | Craft; external browser MCPs = optional executors only (REJECT as replacement) | BrowserPane + browser_tool | R3 exercises it |
| Document ingestion | INFO-04, INFO-08 | PDF/Office/… source ingestion and previews through source-backed adapters | `wired but not visually checked` (ingestion/previews) | editable round-trip is `not implemented`; adapter revision, source ArtifactRef and fidelity report; no parser reimplementation by default | GenOffice engines; `plugins/markitdown` ingestion; Univer comparison with Pro boundary | Sources + Component format adapters | — |

### C. Orchestration and runtimes

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Multi-agent delegation | EXEC-04 | TaskBrief/RunReport, child sessions, budgets-that-halt, mailbox/wait | `not implemented` (Craft has child sessions + TaskRunner) | bounded protocol + report validation (C3/C11) | `software/opencode` (pending re-audit), `software/codex`, `software/grok-build` | Session/Task tree (no new store) | R6 |
| Runtime adapters | EXEC-05 | detect/auth/health/capability negotiation per runtime | `wired but not visually checked` for Claude+Pi; generic adapter `not implemented` | one adapter contract; honesty about unsupported features | first candidate `software/AionUi` (admission pending); comparison `software/codex` (admission pending) | backend seam + SessionManager | R6+ |
| Worktree isolation | EXEC-07 | per-task checkout isolation, occupancy, cleanup | `not implemented` | lifecycle + occupancy rules (P9: location ≠ isolation) | first candidate `software/orca` (admission pending); comparison `software/grok-build` (admission pending) | Git/process integration | R6+ |
| Inherited execution isolation | EXEC-08 | filesystem/network/env and script isolation over existing permission | `wired but not visually checked` | verify actual platform limits; second OS/container sandbox is excluded | current Craft paths; external mechanisms only for a reproduced defect | existing isolation + permission owners | R0/R2 / EXEC-08-A |
| Specified local-app Computer Use | EXEC-15 | optional Component for selected local app/window; structured API first | not implemented | scope, freshness, helper lifecycle and takeover proof precede office actions | Orca/Peekaboo native target/input mechanisms; UI-TARS fallback; official Codex/Claude product behavior | existing host permission/Session evidence + bounded native adapter | R16 after R0 + foundation / EXEC-15-A |
| Remote / cloud execution | EXEC-09 | direct connect to user-owned Fleet instance; grants; standby | Craft token/Workspace transport `wired but not visually checked`; Fleet device pairing, scoped grants and run-target UI `not implemented` | P7 grant scoping + honest disconnect; no control plane | Craft transport; P9-rev 2026-09-11 | server transport + Workspace routing | R14 |
| Git repository / branch / PR delivery | EXEC-13 | task-changes diff, apply/discard, PR — branches agent-managed, never a user surface (C4) | `not implemented` | C4 ladder: read-only diff (R3-era) → apply/discard with R6 worktrees → PR/remote with R14; Git operations remain governed delivery actions, never a Task/Session authority | Craft file/process seams; GitHub connector is an optional executor only | Git/process adapter + existing Task/Session/permission | EXEC-13-A |
| Governed action seam | EXEC-02 | ActionEnvelope, caller-aware policy identity, one executor/policy/evidence path | `not implemented` | extract the envelope from the first two real callers (R4); no handler-only wrapper before that | Craft handler paths | existing permission path + handlers — no second executor | R4 spec |
| Prompt / policy profile / agent identity | EXEC-14 | scoped system prompt, model/profile identity inspection, centralized effective prompt/tool projection | `not implemented` (Claude/Pi full lanes exist) | E13: measure actual serialized requests; Pi-light is a profile, not a kernel; effective view = task need ∩ installed ∩ available ∩ policy ∩ live grant; loadout remains separate from Action seam | Craft/Pi baseline; OpenHands/Hermes/OpenClaw = mechanism evidence only | existing backend/prompt/tool assembly + permission authority; no second loadout | post-TE1 bounded slice + EXEC-14-A |

### D. Intelligence economics

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Context & token optimization | INTEL-01, INTEL-02 | **layered token economy (E12/E13)**: effective projection + ArtifactRef/TaskBrief structural savings · L1 prefix/cache alignment · L2 deterministic data reduction (optional external RTK Bash/output adapter exists) · L3 agent-directed compaction · L4 gated model-assisted trim · L5 output profiles · L6 reviewed cross-session injection; ROI ledger | Optional RTK binary adapter + usage events + existing compaction `wired but not visually checked` (Craft); RTK requires the enabled preference and a detected compatible binary, otherwise commands pass through unchanged; Fleet TE1 accounting utility absent; visible cache measurement and Fleet profile optimization `not implemented`; L3+ gated | TE1 observes only; after R0 baseline, prompt diet/tool projection/Pi-light require a separate bounded slice; R3 is the cross-domain trace; R5/R6 supply ArtifactRef/TaskBrief | [`references/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md`](research/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md); owner inventory; Databricks/Pi/OpenHands/Hermes/OpenClaw mechanism evidence; RTK is an external binary adapter; its historical source checkout is absent; LLMLingua-2 gated | UsageTracker + existing prompt/tool/compaction paths — one ledger, no second memory or harness | TE1 + SYS-03 first proof + `features/SYS-03-context-economy.md` §6 |
| Model routing & cost | INTEL-03, INTEL-04 | one ledger (real/estimated/unknown), routing default-off, API lanes only | `not implemented` beyond usage events and the `wired but not visually checked` per-model thinking-level mapping (Thinking levels row) | E3 ledger fields; batch endpoints | — (E3 rules) | UsageTracker extension | R17 implement-or-`NO_GAP` closure |
| Memory & experience | INTEL-05 | layered agent-maintained files (working notes → curated layers), logged consolidation, scoped retrieval, optional curation | `not implemented` | needs completed traceable chains (R3+) | REJECT: universal memory engines | Workspace files + Session evidence | R9 |
| Evaluation & regression evidence | INTEL-07 | verifier runs separate from the executor, regression fixtures, accepted-outcome evidence | `not implemented` | needs completed traceable chains to grade (R3+); the verifier never shares state with the executor it grades | — | Session evidence + repository tests | R17 implement-or-`NO_GAP` closure |
| Reasoning and runtime modes | EXEC-05, INTEL-03 | exact per-model reasoning choices plus separate speed/service/runtime modes | `wired but not visually checked` for advertised Pi/API reasoning choices and the first-party fast toggle; complete multi-runtime projection `not implemented` | OpenCode CLI variants still need typed classification; Fleet generic runtime-mode storage/projection is absent; re-measure model support against current v0.13.4 mappings before porting prior fixes | — (E9/E9a) | backend adapters + existing settings authority | per-adapter capability tests plus P-30 owner acceptance |

### E. Creation surfaces

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Document editing | INFO-05 | direct editing of Markdown/HTML, Office and bounded PDF capabilities with real save/reopen | `not implemented`; inherited previews `wired but not visually checked` | one native owner per format/document; parser, preview and editor are distinct | existing TipTap for Markdown; GenOffice and bounded format engines are candidates, not selected winners | Workspace files + native document adapter; no competing copy of the same document | R3 preview; R10 documents; R13 advanced deck/motion |
| Canvas | CREATE-01 | one production surface: generate, edit and lay out images, video, websites and decks | `not implemented` | not this slice; not an empty default pane | **Cowart** (`源码参考/software/Cowart`; current source observation in the reference registry) supplies bounded interaction evidence, not an adopted engine or store: AI image holder, annotate-to-revise, AI HTML, AI Slides on one board. Canvasight remains collab/conflict EVIDENCE_ONLY. tldraw is license-gated | Fleet canvas (NEW). Craft Pages is a different surface | R7 |
| Design surface | CREATE-06 | schema-validated objects, transactional change batches, tokens/components | `not implemented` | E11 boundaries; adapter study | `software/penpot` (patterns; MPL care), `software/openpencil` (AI edit), `software/open-design` | native schema attached to Craft shell/actions/artifacts | R10 |
| Web artifacts | CREATE-07 | generate/preview/iterate web outputs, honest export | `not implemented` (HTML preview exists) | producer→consumer via ArtifactRef | `software/grok-build` EVIDENCE_ONLY | Craft files/previews + R4/R5 | R10 |
| Video | CREATE-02, CREATE-05 | timeline/NLE surface, media pipeline, export | `not implemented` | native module boundary (E4); resource limits (E8) | `software/opencut-classic` bounded timeline/export candidate; OpenChatCut interaction evidence with AGPL source checkpoint; unmounted historical candidates are not current source evidence | native sequence over R11 Job/R5 Artifact | R12 |
| Deck / motion | CREATE-08, CREATE-09 | native deck doc, honest PPTX/HTML export (E7) | `not implemented` | native schema + export fidelity proof | `software/openpencil` (structured design→presentation) | native document over R10/R11/R12 seams | R13 |
| Image / AIGC jobs | CREATE-03, ORCH-05 | generation jobs, placeholders→result, provenance | `not implemented` | one Job lifecycle extracted from the first image producer/consumer; no speculative second queue | MiniMax Hub analysis EVIDENCE_ONLY | Craft Task/Session/permission + R5 Artifact + UsageTracker | R11 |
| Audio / voice / music | CREATE-04 | audio and music generation jobs, voice tracks, track provenance | `not implemented` | rides the shared media Job lifecycle from R11/R12; no separate audio queue | media candidates pending admission | media Job + ArtifactRef | R12 |
| Export & delivery profiles | CREATE-12 | render/export pipelines, delivery profiles, fidelity declarations (E7) | `not implemented` | one exporter contract over Job outputs with visible fidelity limits; no per-surface export forks | — | Job output + ArtifactRef | R13 |
| Long-form narrative/content generation | CREATE-16 | outline, chapters, document generation and human revision | `not implemented` | governed document actions, prompt/model/source provenance | Craft TipTap + SYS-03 context economy; product references require same-task test | native document owner + governed action | R10 / CREATE-16-A |

### F. Platform

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| App shell & runtime | CORE-01 | Electron main/renderer shell, Bun workspace processes, React app frame | `wired but not visually checked` (Craft v0.13.4) | do not rearrange chrome as Cindy work; admit Craft capabilities (Pages) | Craft v0.13.4 | Electron main + renderer bootstrap | [`PROJECT-SPEC.md`](PROJECT-SPEC.md) |
| Capabilities / Skills / plugins | ORCH-03, INTEL-06 | install / loadout / runtime separation; provenance; global/Workspace Component activation | Craft Skills/Sources `wired but not visually checked`; registered Component host/runtime `not implemented`; Fleet types/resolver are absent | after R0 baseline exit, host before domain Components; additive entries/panels with user-owned placement; no count cap or blanket R6/R9 prerequisite | Cindy capability ownership/install targets; DeepSeek Harness scoped slots/disposal | existing user/Workspace settings + Skills/Sources/tool registries; derived composition | early R15/R18 foundation (`features/SYS-09-workspace-compositions.md`), then R15 distribution |
| Skill marketplace | ORCH-10 | discover, inspect, compatibility, examples, verified-origin install, scoped loadout, update/rollback | `not implemented` | ORCH-10 manifest, trust and transaction gates | Codex/Cursor/Claude marketplace patterns; local-first improvement required | SYS-08 catalog + SYS-03 loadout | ORCH-10-A |
| Component marketplace | ORCH-11 | installable bundles of panels, domain commands, Skills, MCPs, knowledge defaults and assistant suggestions; global/workspace enablement | `not implemented` | bundle transparency, runtime isolation, changed-capability review, unified Craft design language, additive host slots, global/workspace overrides | Cindy SkillHub/install targets; DeepSeek Harness UI slots; OpenChatCut official video-component evidence; Qoder/TRAE discoverability only | SYS-08 package lifecycle + SYS-01 grants + workspace composition | ORCH-11-A |
| MCP marketplace | ORCH-04, ORCH-12 | server/tool/resource registry, auth scope, health, risk, revoke and offline/local source | `not implemented` | ORCH-12 per-tool grant, credential and transport gates | Claude MCP catalog, Cursor MCP plugins, Codex custom MCP review | SYS-08 registry + SYS-01 policy | ORCH-12-A |
| Messaging | EXEC-11 | IM gateways, routing, reconnect, approval routing | `not implemented` for Fleet's Workspace-scoped adapter (Craft messaging + WhatsApp worker are `wired but not visually checked`) | Workspace-scoped adapter contract; honest platform absence | first candidate `software/hermes-agent` (admission pending); comparison `software/openclaw` (admission pending) | messaging gateway + settings | R14 |
| Notifications & approvals inbox | ORCH-07 | notification routing, approval inbox surfaces over permission/session evidence | `not implemented` | inbox stays a projection of the existing permission path; no second approval authority | — | permission path + SessionEvents | R14 |
| Diagnostics & recovery | ORCH-08 | health checks, failure classification, recovery guidance | `not implemented` | classify runtime/connectivity failures honestly before any automated recovery | — | logger + health-check paths | R18 implement-or-`NO_GAP` closure |
| Panels & layout | CORE-11 | user resize/move/reorder, in-window float/re-dock and scoped restore | fixed-column sizing `wired but not visually checked`; registered/movable host `not implemented` | reuse the Files popover and Notes RPC; mount a Notes consumer, preserve drafts/context; Fleet right sidebar and pure layout tree are absent | existing Craft stack and Cindy mechanics first; compare installed drag utilities/tree with Dockview/FlexLayout only against this contract; no dependency selected | one renderer layout representation + existing Workspace/window preferences | early R15/R18 foundation; R18 later closes native multi-window behavior |
| Workflows | ORCH-01, ORCH-02 | finite versioned DAG over governed actions | `not implemented` | R4+R5 first; E5 edge-class rules | FlowGram EVIDENCE_ONLY (editor pattern only) | definition projected onto Craft TaskRunner | R8 |
| Updates & distribution | CORE-09 | Fleet-controlled/user-configured channel; never Craft binary | `not implemented` for Fleet distribution. The current update boundary is `wired but not visually checked`: no installer import, download or pending-update quit hook; no Fleet channel is configured | owner acceptance of the R2 updater slice; Fleet release channel remains an owner checkpoint | — | auto-update + builder config | [`specs/R2-independence.md`](specs/R2-independence.md) |
| Help & docs | CORE-08 | bundled docs, docs MCP, visible-external links | `wired but not visually checked`: desktop/WebUI help uses the shared bundled Markdown overlay, native Help opens the profile-local index and Agent prompts use the same local guides | owner acceptance of the R2 docs-links slice | — | docs modules + session-mcp-server | R2 spec |
| i18n & identity honesty | CORE-10 | zh-Hans coverage, service-class labeling | inherited seven-locale registry, zh-Hans and persisted language selection `wired but not visually checked`; Fleet branding/service labeling `not implemented` | R1/R2 acceptance | — | i18n catalogs + branding | R1 spec |

### G. Technology routes (per module, judged — not all deferred)

The per-module technology stance (not capability status). **decided** = the boundary/route is
binding, but code still requires an ACTIVE spec; **proposed** = the recommended route, confirmed
inside the module's spec at activation; **gated** = choice waits for a named gate. Rationale beyond one line lives in
[`ARCHITECTURE.md`](ARCHITECTURE.md#orchestration) and the reference map.
Any route that names an external mechanism is still subject to the admission-v2 record in
[`references/REFERENCES.md`](REFERENCES.md); a route can be useful
research direction without authorizing code import or claiming that the reference is superior.

| Module | Route | State | Why (one line) |
|---|---|---|---|
| App shell / runtime | Electron + Bun monorepo + React (inherited Craft stack) | decided | Working, verified; replacing it is a rewrite with no user value |
| Persistence | Craft filesystem stores; SQLite only on the D2 trigger | decided | Honest lesson: no control-plane DB without a concrete atomicity failure |
| Chat/session UX | Craft surfaces, simplified per P5 | decided | The baseline is the product |
| Document editing | **TipTap for supported Markdown/rich-text paths; format-specific native engines for Office/PDF** | existing base; additional engines unselected | One owner per document and one operation/undo/save path. A Markdown editor is not an OOXML/PDF engine; require edit/save/reopen fidelity fixtures |
| Orchestration kernel | Own thin layer over Craft TaskRunner/Sessions (TaskContract/Brief/Report envelopes); opencode mechanisms mapped in, its gaps fixed | decided (boundary) | Persistence/event mapping still requires R4/R6 seam evidence; no external orchestrator owns Fleet state |
| Runtime adapters | One adapter contract over backend seam; AionUi patterns; ACP where offered | decided (contract) | Per-runtime order remains proposed; capability negotiation beats per-CLI special cases |
| Canvas renderer | **DOM family committed (E5a)**: React Flow v12 default first implementation; custom DOM+`translate3d`+SVG the named in-family fallback (Mayi Canvas-proven: `references/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md`); custom edge overlay + visible-node virtualization + thumbnail workers + object pools; GPU (Pixi/CanvasKit) only ever a media layer; tldraw comparison-only (license checkpoint) | decided (family) · spike picks in-family (runnable from R5) | Four DOM-family shipping proofs; anti-oscillation clause in E5a |
| Workflow engine | Own finite typed DAG over governed actions + TaskRunner; FlowGram editor UX patterns only | decided (boundary) | Schema is confirmed at activation from promoted real chains; executor/permission must stay Fleet's |
| Design surface | Own schema authority + Penpot-style ordered change batches w/ inverses; open-pencil engine boundary (model independent of renderer); MPL = pattern-study default (admission pending) | proposed | Candidate mechanism evidence only; E11 and license review still required |
| Video | opencut-classic timeline/track/snapping patterns + ffmpeg jobs in Electron main process; exact mechanism admission still required; HTML5/WebCodecs preview | proposed | Native module boundary (E4); main-process jobs respect E8 limits |
| Deck/motion | Native JSON doc model + explicit exporters (PPTX/HTML) with visible fidelity limits (E7) | proposed | Export honesty is the constraint that picks the architecture |
| Image/AIGC jobs | Single owner-approved job authority (placeholder→job→result), provider adapters on E3 lanes, native batch endpoints | proposed | MiniMax-pattern UX; one ledger, no per-provider job stores |
| 3D / panorama / multi-camera shot grids | Outside Fleet native scope under PRODUCT; specific external-tool jobs may use existing execution paths | excluded | Catalogue coverage does not reopen a product exclusion |
| Long-form content generation | format-specific native document authority plus governed patch/generation actions; SYS-03 ContextPack/UsageRecord | proposed | Human edits and source/model provenance must survive generation; no second editor |
| Web artifacts | Existing preview + iframe/webview isolation (never inside the canvas graph layer); versions via ArtifactRef | proposed | TRAEWork lesson: live web preview ≠ spatial canvas |
| Token/context | Layered pipeline per `features/SYS-03-context-economy.md`: three-zone prefix stability + ledger cache fields (new work after R0 and the TE1 baseline), optional external RTK rewriting, CAT-pattern compaction tool (on measured pressure), LLMLingua-2-style trim (gated); connectors (repomix/context7/codegraph) via Sources/MCP | decided (framework, E12) · per-layer gates | Leaner context measurably raises capability (context rot); every optimizer measured, switchable, honest (`unknown` ≠ 0) |
| Messaging | hermes-agent adapter patterns (admission pending) behind one Workspace-scoped contract | proposed | Channel failure must never block local core |
| Execution isolation | Validate and correct current Craft isolation through its existing permission path | decided | R0/R2 boundary checks; no second OS/container sandbox or R18 sandbox lifecycle |
| Multi-panel layout | candidate docking libraries (no library selected) | gated | R18 foundation owns the first real panel caller; compare the existing layout model and candidates before adopting a dependency |
| Remote/cloud | Craft transport + P7 scoped grants; no relay, no control plane | decided | Owner-set product identity (P7/P8/P9) |

### Update rules

1. A slice that changes any fact in a row updates the row **in the same slice**.
2. A domain becoming ACTIVE gets its full spec in `specs/` (template §References consumed wires the
   reference column in).
3. New references enter via `源码参考/meta/` admission — never directly here.
4. Adding a domain requires an owner request or a real discovered capability; deleting one requires
   an owner decision recorded in [`DECISIONS.md`](DECISIONS.md).
5. **Every row in sections A–F declares its `Registry IDs`.** `—` is allowed and means no registry
   row covers the domain — an honest gap, not a formatting choice. `scripts/validate-doc-contracts.py`
   fails on a missing or unknown ID and runs from `scripts/fleet-verify.sh`. Section G (technology
   routes) is exempt: it records stance per module, not capability coverage.

#### Coverage check

Run `python3 scripts/validate-doc-contracts.py` for current capability/page/acceptance joins.
Historical July join counts and retired collaboration/telemetry IDs are not current scope.
EXEC-15 carries R16's bounded local-app Component; general Core control and a second sandbox stay excluded.
A valid join proves coverage, not semantic agreement or an implemented feature.

## Vision

Status: product vision and decision synthesis. [`PROJECT-SPEC.md`](PROJECT-SPEC.md) is the authority on what
Fleet is and is not; [`DECISIONS.md`](DECISIONS.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md)
own binding decisions and invariants; active specs and the capability map own executable scope and
status. This document explains what Fleet is trying to become so an Agent can choose the best
engineering route for a new request instead of reacting to one isolated feature description at a
time.

### 1. The product bet

Most agent products are chat-first shells. They provide a conversation, a browser and a generic MCP
bridge, then ask the Agent to look at an external application and operate it through screenshots,
coordinate actions or a large collection of tools and instructions. That works for simple coding
tasks, but becomes slow, fragile and context-heavy for design, documents, media, research and other
structured work.

Fleet is a different kind of Harness: **the work surface and the Agent operate on the same native
artifact inside the same product**. When a domain is important enough to deserve a structured model,
undoable commands, human editing and Agent editing, Fleet provides that surface as a first-class
Component instead of asking an Agent to remote-control an unrelated application.

The result is not a collection of mini-apps glued beside a chat. It is one workbench with one shared
spine and many selectively activated production capabilities.

### 2. What Fleet changes about Agent work

Fleet reduces avoidable work for both the person and the model:

- a video Agent edits a real sequence through the same commands a person uses on the timeline;
- a document Agent edits the real `.docx`, `.xlsx`, `.pptx`, PDF, Markdown or HTML artifact while the
  person can inspect and continue editing it;
- a design Agent writes inspectable design data and previews it in the design surface;
- a canvas Agent places, revises and connects artifacts on the same board the person sees;
- a browser Agent uses a governed BrowserPane, while the person can observe and annotate it;
- a Git Agent reads and proposes repository changes through the existing Session, permission and
  Git/PR authorities.

GenOffice is the concrete document reference for this rule: its engine packages parse real Office
formats, apply narrow patches and repack untouched archive entries; its desktop hosts track dirty
state, external changes and autosave recovery; its Slides surface exposes operation registries,
history batches and AI snapshots through the same IPC boundary. Fleet should adapt that “real file +
shared human/Agent command + recoverable save” pattern, not embed another office shell.

The same model allows a future Trading/Market Analysis Component: market data, research, watchlists,
paper trading, backtests and strategy notes can live in one optional Workspace capability. Existing
stock-trading conversations are test data, not the default Project. Live broker actions are not
implied by installation or MCP configuration; they require a separate high-risk approval contract.

The model is not given every Skill, MCP schema, component manual and connector description on every
turn. A catalog may be large; the active task context must be small. Fleet resolves the minimum
authorized capability set for the current task, loads heavy implementations only when needed, and
keeps the full raw evidence recoverable.

### 3. One shared spine, many native surfaces

The product has one authority for each cross-cutting concern:

```text
Craft shell and visual system
        │
        ├── Workspace / Project boundary
        ├── Session and conversation history
        ├── Task and Job lifecycle
        ├── Permission / trust / approval path
        ├── Timeline and attributed evidence
        ├── Files and ArtifactRef provenance
        ├── Settings / credentials / Sources / Skills
        └── Agent + provider runtime adapters
                │
                └── active Component composition
                        ├── conversation tools
                        ├── document surface
                        ├── design surface
                        ├── canvas surface
                        ├── video/media surface
                        └── browser/evidence surface
```

Native surfaces own their domain model, not a second Session, Task, Permission, Settings, timeline
or file-byte store. A surface's human commands and Agent tools converge on one governed executor so
the two callers cannot silently diverge.

### 4. Everything is composable, not everything is global

Fleet adopts the implementation principles proven in DeepSeek Harness, Cindy and Open Design:

- Components declare their contributions, dependencies, scopes and requested effects.
- The host validates the declaration before rendering or executing it.
- A Component activation owns its listeners, workers, services, tools and panels.
- Deactivation disposes the entire owned subtree, including asynchronous cleanup.
- A failed or denied Component remains visibly unavailable; it does not half-register.
- Vendor manifests are immutable. User and Workspace preferences are overrides.
- A Session may receive a snapshot of the effective composition, and that composition change is
  evidence in the Session history when it changes what the Agent can see or do.

This does **not** mean Fleet imports Cordis as a second kernel or splits itself into hundreds of
packages. Fleet keeps Craft's shell, SessionManager, permission path, settings and runtime seams.
The plugin principle is applied at the Component Host boundary.

### 6. Progressive disclosure and context economy

Fleet treats context as a product resource, but does not shrink the capability catalog to save
tokens. The system separates:

1. **Catalog:** every installed and discoverable Component, Skill, MCP and connector.
2. **Active composition:** what the current Workspace and task are allowed to use.
3. **Effective projection:** the small prompt/tool/context slice actually sent to the model.
4. **Native surface state:** the structured artifact and panel state the person operates.

The default host stays light. A thin Component can expose its basic panel without optional
dependencies. A video renderer, OCR model, transcription engine or heavy document converter loads
only when its feature is invoked or explicitly preloaded. Failed optional dependencies degrade one
feature with a named recovery action; they do not brick the host.

Strong models should not be burdened with a giant “super Skill” that repeats generic reasoning they
already perform. Weaker models may benefit from more prescriptive Skills, checklists and staged
workflows. Therefore the same Component can expose progressive loadouts: concise defaults, optional
guided procedures, and explicit workflow Skills for difficult or repeatable processes. The model's
strength changes the projection policy, not the Component authority or permission path.

### 7. Human and Agent iteration

Fleet is built for iterative work, not one-shot generation:

```text
intent → inspect artifact → propose structured change → preview/diff
      → human or policy approval → apply shared command → undo/revise
      → validate → export/deliver with provenance
```

Every domain decides its own native representation, but the loop is shared. A video edit, document
patch, design change and canvas insertion must remain inspectable, attributable and recoverable.
An Agent may suggest the next iteration; it cannot silently widen permissions, rewrite the task or
replace the user's acceptance criteria.

#### Human demonstrations become reviewed procedures

When a person and Agent use the same panel, both callers emit semantic operation events with caller
kind, Session/Workspace/Component identity, base/result versions, permission decision and evidence.
This makes it possible to show “what the person did” and “what the Agent did” without guessing from
the final pixels.

Fleet's Record & Replay flow is therefore a local, opt-in learning path:

```text
human starts capture → semantic actions are recorded
→ user selects a stable interval and names variables
→ Agent extracts a procedure + preconditions + verification + recovery
→ user reviews/redacts and chooses scope
→ Skill is versioned and replayed through the same Action/Permission path
→ successful runs add quality evidence; failures stop and remain inspectable
```

Raw coordinates, screenshots, secrets, cookies and personal data are not the default Skill input.
If a semantic Component command exists, replay uses it; coordinate actions are a declared fallback inside built-in browsing or a specifically authorized
local-app Component job (R16/EXEC-15), with fresh observation; no universal Core controller is introduced. A human demonstration can teach a Skill, but cannot
silently modify the runtime, grant permission, or become a global rule without review.

#### Work trajectory is a first-class projection

The trajectory of work is one join over SessionEvents, governed actions, Jobs and ArtifactRef
lineage. Components contribute semantic operation records; they do not create private histories.
Each record points to exact input/output versions and carries caller, Component, turn/step, attempt,
parent-operation, evidence and recovery identity. Chat, the canvas and a Component panel therefore
show different views of the same trace. Selecting a step or artifact gives the Agent an explicit
target; revising it creates a new branch and marks dependent results stale until explicit recompute.
The poster example “generate → vectorize text → remove raster text → composite” is four operations
with four immutable result identities, not one overwritten image and not an ambiguous prompt
transcript.

### 8. Interface direction

Craft Agents supplies Fleet's visual language: typography, colours, spacing, elevation, motion,
icons and shared primitives. Cindy supplies the information architecture and feature implementation
patterns. OpenChamber supplies Git/GitHub and browser-control mechanisms.

The interface is panel-first rather than page-first:

- one Conversation surface and one Session list;
- Project, label, status and archive are predicates or context, not duplicate conversation homes;
- Project resources open in the workbench and never repeat the Session list;
- installed Components add discoverable tool entries or panels without replacing the shell;
- the person may resize, move, reorder, float and restore supported conversation/tool panels through
  one host;
- a panel's position is user state, while its domain data remains owned by its Component/native
  authority.

The MiniMax Design pattern is useful **future canvas evidence** for this direction: a persistent
project rail, a conversation/production-surface split, a reversible conversation position, a canvas
toolbar, minimap, asset access and explicit “conversation only / canvas only / both” layout modes.
Fleet must rebuild that interaction through Craft tokens and Fleet authorities, not copy a product
shell. The current Component/panel foundation promises only the generic in-window host contract;
canvas-specific modes wait for the R7 production surface.

### 9. Reproducibility, migration and real-format compatibility

An Agent-native surface is not complete if it can generate an artifact once but cannot reopen,
inspect, revise, revert or move it to another tool. Every production Component therefore declares
its format adapters and fidelity honestly:

```text
format adapter → inspect/parse → ImportReceipt + original ArtifactRef
                 → native editable representation
                 → governed edits + immutable versions
                 → fidelity report → export adapter → Delivery ArtifactRef
```

The original file is preserved as the source artifact. Import creates a derived native document or
canvas projection and records the adapter version, source hash, unsupported features, fonts/assets,
coordinate transforms and fidelity class. An import never silently overwrites the source.

Fidelity classes are explicit:

- **lossless round-trip:** the native format and all supported semantics survive export/import;
- **structured with limits:** layers/objects/data remain editable, but named features may change;
- **visual reference:** appearance is preserved as an image/PDF/reference layer, not falsely claimed
  to be fully editable;
- **unsupported:** the Component refuses with a named alternative or conversion path.

For the common design formats in scope:

- Figma `.fig` is not assumed to be a portable open format. The first adapters should use approved
  Figma export/API/plugin paths (SVG, PDF, PNG and a structured exchange representation where
  available), with a fidelity report; direct `.fig` editing is not promised without a verified
  parser and license path.
- Photoshop PSD/PSB and Illustrator AI are adapter targets. Layer/text/mask/vector preservation is
  claimed only per tested feature subset. A flattened image is a visual fallback. PDF/SVG may retain an editable subset when an adapter
  proves it; the extension alone does not decide fidelity.
- Documents use the real format owner and a narrow-patch/save-back path. A preview or conversion is
  not an editing claim.

Reproducibility is first-class: every generation, import, edit, render and export carries a stable
input version, Component/adapter revision, Action sequence and output version. Restore creates a new
lineage head or applies an inverse transaction; it never silently rewrites history. Failed exports
are quarantined, resumable work is reconciled, and retries cannot duplicate a file, charge or
provenance record.

Format support is a Component capability, not a promise made by Fleet Core. Fleet should not
reimplement every parser or exporter from zero. The reference pool exists to find an already-tested
engine or adapter, compare its real source path and tests, then wrap the smallest useful part behind
Fleet's Component/Artifact/Permission seams. A Component manifest must declare `formatsIn`,
`formatsOut`, fidelity classes, platform/runtime dependencies and recovery behavior. Users can
install a better adapter later without replacing the native artifact authority.

Reference-source reuse follows the license boundary: permissive MIT/Apache/BSD code may be ported
with notices and dependency review; MPL code needs file-level obligations; AGPL or proprietary code
requires an explicit adapter/process or owner license checkpoint. A product README never overrides a
subdirectory or bundled dependency license. Heavy format engines run in a lazy worker or controlled
process so the core remains light and a parser failure cannot damage the host.

### 10. Trust, permissions and failure radius

Component installation and activation are transactions:

```text
discover → inspect manifest/dependencies/license → trust decision
→ permission decision → stage → activate → health audit → publish
```

Updates create a new revision and reopen review when tools, MCPs, dependencies or requested effects
change. Failed activation rolls back the Component runtime while preserving core records and native
artifacts. Uninstall revokes runtime availability and package-owned grants/credentials before removing staged
files; shared connections remain while referenced.

Failure recovery stays at or below the radius of the failure: one panel failure does not tear down
the Session; one Component failure does not disable the Workspace; a Workspace transport failure
does not corrupt local history. Every refusal names its reason and recovery path.

## Glossary

> Project vocabulary with exact meanings, subordinate to [`PROJECT-SPEC.md`](PROJECT-SPEC.md). These
> definitions clarify other documents; they never override the product authority or establish
> implementation. Current capability status belongs in `ARCHITECTURE.md`.

### Terminology rules

- Use one English term for one concept. Do not add a Chinese alias in headings, table labels or
  prose merely for emphasis.
- Preserve established code/product terms (`Session`, `TaskRunner`, `BrowserPane`, `Workspace`,
  `ArtifactRef`, `TaskBrief`, `RunReport`) exactly; do not translate identifiers.
- Use **module** for a coherent interface plus implementation, **interface** for everything callers
  must know, **seam** for the extension location, and **adapter** for an implementation at a seam.
  Use **bounded context** only for domain ownership, not as a synonym for seam.
- Use **authority** only for the single owner of durable truth, and **projection** only for a derived
  non-authoritative view.
- Use **provider backend** for Craft's Claude/Pi model integration, **agent lane** for a selected
  provider/runtime route, and **harness** for the model-facing prompt/tool/context/call loop. These
  are not interchangeable.
- Preserve third-party names and license identifiers exactly. On first mention, an untranslated
  proper name may carry one English gloss in parentheses.

| Term | Meaning here |
|---|---|
| **Authority** | The single component/store that owns a state class (sessions, permissions, tasks…). "Never create a second authority" = never a competing owner for the same state. |
| **Seam** | An existing code boundary where behavior can be extended without duplicating the authority behind it (e.g. `PreToolUse` is the Agent permission seam). |
| **Interface** | Everything a caller must know to use a module correctly: operations, invariants, ordering, errors, configuration and relevant performance behavior. It is broader than a type signature. |
| **Adapter** | A concrete implementation at a seam, especially for an external runtime, transport or renderer. An adapter never becomes the authority behind the interface. |
| **Spine** | The shared set of authorities every surface routes through: session + permission + identity + caller-aware action interface + timeline + files/artifacts + cost. |
| **Action seam / governed action** | The target contract where human UI and Agent tool calls converge on one validator, policy evaluation, executor, state authority, and evidence trail ([`features/SYS-01-agent-os.md`](features/SYS-01-agent-os.md#release-contract--r4-action-seam)). |
| **Caller-aware** | Policy and evidence know *who* invoked (human UI / agent / workflow) and may decide differently per caller — while sharing one executor. |
| **Closed loop** | A capability whose entry → behavior → state → evidence → error/recovery → caller-visible result all exist and were verified together. The completion contract is [`ARCHITECTURE.md`](ARCHITECTURE.md) §5. |
| **System suite** | A large independently deliverable closed loop that combines multiple registry rows and bounded contexts behind shared contracts; it groups delivery ownership but never creates a new state authority (`PROJECT-SPEC.md`). |
| **Slice** | The smallest coherent implementation block delivering one observable outcome across all affected layers (UI + logic + state + recovery + docs). |
| **Release (R0…R18)** | A bounded, spec'd, acceptance-tested unit of the complete development order in [`TODO.md`](../TODO.md#release-ladder). Exactly one is ACTIVE (a WIP limit, not a time phase); others are READY, DEP (dependency-blocked), or GATED (named non-time gate). R16 owns the bounded optional local-app Component; R17/R18 resolve their remaining conditional rows by implementation or evidence-backed `NO_GAP`. |
| **Product Matrix** | The breadth authority: every product domain's capabilities, status, gaps, reference projects, backend authority, and acceptance anchor — never trimmed by sequencing ([`PROJECT-SPEC.md`](#product-matrix), Decision G5). |
| **Component** | An installable bounded capability bundle: UI/panels, domain commands, Skills, MCP declarations, defaults, and optional knowledge resources. It consumes Fleet authorities and owns only its native domain. |
| **Plugin** | Distribution packaging that bundles existing Skill/Source capabilities and the planned Component capability. Compatibility adapters map package contents to those authorities; a Plugin is never a fourth authority or a separate permission, connection or skill store (P11). The former Fleet `ComponentManifest` implementation is absent after the rebuild. |
| **Assistant** | The identity that performs work: persona, model, prompt, requested loadout and permission request. It is distinct from a Component or Session; requests never grant permission. Fleet's independent Assistant store and Session binding are targets, `not implemented` ([`PROJECT-SPEC.md`](PROJECT-SPEC.md)). |
| **Session** | The existing Craft conversation and execution record owned by SessionManager, with its transcript, context, permissions and events. Child Sessions may link through `parentSessionId`; an Assistant identity is not another conversation store. |
| **Task** | A unit of work. The user-facing **New Task** action starts work through the Session authority and does not require a duplicate structured Task record (P10). Craft's explicit structured Task is separately represented by a TaskSpec DAG and run log, executed through child Sessions by TaskRunner. |
| **Workspace Composition** | The workspace-scoped enabled-component set plus explicit configuration overrides, extra MCPs/knowledge sources, personal habits, and layout preferences. It is not a second capability or permission store. |
| **Component default** | A vendor-provided value shipped by a Component. It is immutable package input; user and workspace changes are stored as overrides. |
| **Frontend track** | Pages may be spec'd, mocked behind typed adapters and built preview-gated ahead of their backend behavior, reported `display-only` until wired ([`PAGE-STRUCTURE.md`](PAGE-STRUCTURE.md) §5, Decision G6). New feature work remains subject to the baseline exit in `TODO.md`; preview gating does not bypass it. |
| **Preview gate** | The developer/preview toggle behind which unwired pages live; the default user surface never shows controls without real behavior. |
| **Admission grade** | The verdict a reference earns in the single admission ledger [`references/REFERENCES.md`](REFERENCES.md): `FORMAL_REFERENCE` · `MODULE_REFERENCE` · `LOCAL_IMPROVEMENT` · `EVIDENCE_ONLY` · `REJECT` (`candidate` until audited). Checkout mechanics stay in `源码参考/meta/`. |
| **Reference intake** | The bounded step before designing EXTEND/NEW work: read the matrix row's named reference files/symbols, extract a mechanism list, map each mechanism to its Craft seam (`../AGENTS.md` method step 2). |
| **Orchestration planes** | Execution (who runs work), composition (how capabilities/artifacts chain), command (how the human directs) — one kernel under all three ([`ARCHITECTURE.md`](ARCHITECTURE.md#orchestration)). |
| **Staging** | Placing an artifact/evidence reference into an agent's pending brief/composer via canvas gesture — visible, removable, and inert until explicitly sent (never run-by-arrangement). |
| **Workflow promotion** | Explicitly converting a completed chain of reference/input edges into a versioned finite DAG definition — history is never rewritten to pretend it was a workflow ([`ARCHITECTURE.md`](ARCHITECTURE.md#orchestration) §4.3). |
| **Duty to dissent** | G1's second half: an agent must state the better technical route, its reasons, and both costs before executing an owner suggestion it believes suboptimal. |
| **Token ROI** | The token-economy metric: cost per *accepted* outcome — never raw tokens per request (`features/SYS-03-context-economy.md` §5, Decision E12). |
| **Context rot** | The measured non-uniform accuracy drop (often 30–50%) as input context grows, with mid-context information under-attended ("lost in the middle"). The scientific reason leaner context raises capability. |
| **Prefix stability** | Engineering the prompt so system + tool definitions stay byte-identical across turns (three-zone layout), maximizing provider prompt-cache hits — pure cost/latency win (`features/SYS-03-context-economy.md` L1). |
| **Harness / execution profile** | Harness is the model-facing prompt, tools, context assembly and call loop around a runtime. An execution profile is one measured configuration of that harness (for example Pi-light); it never owns Session, permission, task or cost state (E13). |
| **Effective projection** | The smallest prompt/tool/Skill/Source/environment view for one model call, computed from task need ∩ installed capability ∩ runtime availability ∩ caller policy ∩ live grant. It is a derived view, not an authority (E13). |
| **Spec** | The executable specification for a release: outcome, scope, acceptance criteria with stable IDs, non-goals, verification plan (`specs/`). |
| **Packet state** | Documentation readiness only: `BREADTH_ONLY` · `PACKET_DRAFT` · `READY_FOR_SPEC`. Spec lifecycle and roadmap ACTIVE/READY/DEP/GATED are separate facts ([`PROJECT-SPEC.md`](#capability-register)). |
| **REUSE / EXTEND / NEW / CONDITIONAL** | The mandatory classification against Craft's existing capability before building ([`ARCHITECTURE.md`](ARCHITECTURE.md#craft-capability-map)). |
| **Status vocabulary** | `usable` · `wired but not visually checked` · `display-only` · `not implemented` — the only permitted capability statuses (`../AGENTS.md`). |
| **Evidence** | Attributable records of what actually happened: SessionEvents, command output, test results, file versions. Distinct from claims. |
| **Projection** | A derived, non-authoritative view of authoritative state (a Board column, a canvas card, a ProjectDigest). Editing a projection must route through the owning authority. |
| **Artifact / ArtifactRef** | A produced output with identity; ArtifactRef is the smallest versioned reference + provenance envelope over native bytes (Decision D6; roadmap R5). |
| **Provenance** | The recorded chain of what produced/consumed an artifact version, for which purpose. Never inferred from visual arrangement (Decision E5). |
| **WorkTrace** | A disposable projection joining SessionEvents, governed Actions, Jobs and ArtifactRef lineage. It can show `current`, `shadowed`, `log-only`, `partial` and `interrupted` records; it is never a second timeline authority. |
| **Operation / attempt** | An attributed semantic mutation or invocation (`operationId`) and one execution try (`attemptId`). An operation may have multiple attempts; each attempt has exact input versions, output versions or an explicit failure. |
| **Lineage branch** | A new immutable output path created from an earlier operation or ArtifactRef version. Revising a step creates a branch and may mark dependent descendants stale; it never overwrites the old branch. |
| **TaskContract** | The locked, versioned projection of a task for one execution attempt: criteria IDs, allowed/reserved paths, non-goals, budgets (Decision C7). |
| **ContractChangeRequest** | The explicit act of revising a locked contract — ends/pauses the attempt, creates a new version (Decision C7). |
| **TaskBrief / RunReport** | The target bounded delegation envelope in and result envelope out for supporting agents (Decision C3; roadmap R6). These Fleet runtime contracts are `not implemented`; no template or type alone establishes the delegation path. |
| **Owner checkpoint** | A decision class the agent must never take alone: money, irreversible/public effects, production dependencies, new/replaced authorities, product forks ([`AGENTS.md`](../AGENTS.md#owner-protocol)). |
| **Owner** | The human product owner. States intent in plain language; owns final acceptance and checkpoints. Agents choose technical routes (Decision G1). |
| **Workspace / Project** | Workspace: visible, independent configuration/routing and conversation boundary. Project: a Workspace-scoped membership referencing a working directory; the same directory can belong to multiple Workspaces without sharing their transcripts or configuration (revised P6). New Task globally or on a Project row enters the same Session-backed create flow (P10). |
| **BrowserPane** | Craft's in-app governed browser surface; in Fleet, an evidence-capture input, never a stealth browser (Decision E6). |
| **Native surface / module** | A production surface owning its own document/job model (Markdown editor, video editor…), registering capabilities on the spine instead of becoming a separate app (Decision E4). |
| **Loadout** | The scoped set of capabilities/tools enabled for a given agent/task, narrower than what is installed (Decision E2). It contributes to effective projection but does not replace permission or the governed Action seam. |
| **Agent lane** | A provider/runtime route used by Fleet (local CLI, API, subscription-backed or remote); lanes consume context projections but do not own shared memory or project context. |
| **Upstream intake** | Reviewing official Craft tags/release notes/source to selectively port changes — never merging the upstream tree wholesale (Decision P8). |
| **Design library** | Owner-intent source notes under `docs/design-library/` — input material for slices, never implementation authorization. |
| **Design asset** | A source note in `design-library/` with durable product-design value. It may guide a module but cannot set current scope, order, implementation status or acceptance; reconcile it against code and canonical documents before use. |
| **Vibe Coding** | The owner-directed, agent-executed development mode this project runs on. Its known failure modes and countermeasures are [`ARCHITECTURE.md`](ARCHITECTURE.md) §4. |
