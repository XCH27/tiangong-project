# Fleet — what this software is

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
[`reference registry`](references/REFERENCE-REGISTRY.md#required-promotion-record), not a new plan.

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
foundation. The executable contract is [`specs/R18-right-workbench.md`](specs/R18-right-workbench.md).

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
  [SYS-02](modules/suites/SYS-02-remote-office.md#local-app-computer-use-contract) owns its execution
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

Current owner instructions set the task. This document owns product scope; `02-DECISIONS.md` owns
durable choices, `03-NON-NEGOTIABLES.md` invariants and `10-GLOSSARY.md` terms. `05-ROADMAP.md` owns
development order; `WORK-ORDER.md` is its short current projection. The applicable spec owns the
bounded acceptance criteria. Capability/page/code maps describe observed implementation, never
turn a proposal into shipped behavior. Design notes and reference audits supply evidence, not a
competing execution order.

Absorb useful requirements, mechanisms and evidence into their canonical home, update incoming
links, then delete superseded project documents and files. Do not retain a duplicate just by
labeling it historical or moving it to an in-tree archive. Git history retains tracked evidence;
untracked material needs a verified recovery copy before destructive removal. Retain a source note
only while it has unique, still-relevant value. User data, license notices and external reference
checkouts are separate from obsolete project documentation and keep their own retention rules.
