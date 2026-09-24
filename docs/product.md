# Product — what Fleet is and is not

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

## Conversation, Project and Workspace boundary

**Current base:** Craft v0.13.4 has visible Workspaces. Workspace storage owns scoped Projects,
Sessions, Sources and Skills; a Session records its Workspace path and may reference a Project.
The Board is a Sessions view mode. Restoring the official source did not migrate or remove any of
these records.

**Latest owner direction, pending review:** the owner now prefers to remove the *visible* Workspace
layer and select capability suites per Conversation. This supersedes the earlier instruction to
retain the Workspace switcher. The owner subsequently approved only a small navigation/entry move:
separate All Conversations and Board, move the Craft logo menu to the lower-left footer, and put
Release Notes under Settings → App → About. Duplicate update/menu actions are retired; Settings → App
retains stateful update controls. Help stays at the upper right.
No suite, Project, remote-host, composer or
right-panel behavior is approved by that slice.

The leading design candidate is a separate execution Host (local or user-owned remote), an optional
Project bound to a folder on that Host, and a Conversation with its own effective capability loadout.
Installed Components/Skills/MCPs remain in their existing catalog/settings authorities; Project
defaults may seed a Conversation, but the Conversation's accepted choices are snapshotted at a turn
boundary. Permission remains a separate grant path. Craft Workspace records remain readable as a
compatibility layer until all existing Sessions, Projects, Sources, remote routes and permissions
have a verified destination. Sharing a folder never merges transcripts or grants. This candidate
requires a source-based data and remote-routing review before it can replace the current model.

The previously requested single work list, contextual right panel and ZCode/Cindy-informed
composer remain **design inputs**, not running Fleet features or a standing instruction to
implement the old R1 order. [R1](modules/shell.md) records the bounded entry slice, current paths,
reference evidence and remaining review criteria.

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
[`reference registry`](references.md#required-promotion-record), not a new plan.

**Implementation boundary:** the 2026-09-21 rebuild replaced `app/` with the v0.13.4 base.
The earlier Fleet extensions are preserved at `snapshot/pre-rebuild-2026-09-21`, not running in
this tree. Product requirements below survive; their presence in this document does not establish
implementation. R0 must also account for inherited hosted services before any Fleet release.

### Components, assistants and conversation loadouts

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
permission request). The owner is reconsidering the former **Workspace Composition** design in
favor of a per-Conversation loadout. No Workspace-scoped Component resolver exists in the current
app, and the former specification is not an implementation instruction. A sound future resolver
would distinguish installed catalog entries, defaults, a Conversation's explicit choices and live
permissions; a turn would use one accepted snapshot so its tools cannot change mid-execution.
Removing a Component must leave core data and artifacts intact. The exact default precedence and
storage migration remain open until the Conversation/Project boundary is reviewed.

**Correct the inherited baseline before adding capabilities.** The owner's current order is:
classify and correct Craft's existing capabilities and services → verify and accept the corrected
baseline → build the Component/panel host → add domain Components → close external distribution.
The baseline exit is defined once in [`modules/baseline.md`](modules/baseline.md).
Passing tests or upstream equivalence alone does not authorize feature expansion. This supersedes
the earlier permission to build the host while baseline corrections remained open.

**Build the host before distributing components.** After baseline exit, the foundation slice connects
the mounted Files surface and surviving Notes RPC (with a real Notes consumer) to a registry,
scoped activation and user-controlled layout
before new domain components. It does not depend on R6 delegation, R9 memory or a public catalog.
R15 closes distribution and update safety; R18 closes advanced/multi-window layout beyond the
foundation. The executable contract is [`modules/components.md`](modules/components.md#release-contract--r18-component-and-panel-foundation).

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
  [SYS-02](modules/remote.md#local-app-computer-use-contract) owns its execution
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
| What Fleet is, scope, the rules that decide it, terms | this document |
| A capability's status, acceptance gate, surfaces; Craft classification | [`capabilities.md`](capabilities.md) |
| Durable choices, hard constraints, the owner's exact words | [`decisions.md`](decisions.md) |
| One module's contract, code entry points, references, execution rows | [`modules/`](modules/) — one document per module |
| Invariants and authorities that cross modules | [`architecture.md`](architecture.md) |
| How work is built, checked, committed and packaged | [`engineering.md`](engineering.md) |
| Visual values, layout and motion | [`DESIGN.md`](../DESIGN.md) |
| Reference projects | [`references.md`](references.md) |
| Development order and current slice | [`TODO.md`](../TODO.md) |
| History of how any of this changed | [`CHANGELOG.md`](../CHANGELOG.md) |

A fact lives in one home. A module never restates a register row — its card is generated from the
register — and a shared document never carries detail that only one module needs.

Maps of pages, code and capabilities describe observed implementation; they never turn a proposal
into shipped behaviour. Research notes supply evidence, not a competing execution order.

Absorb useful requirements, mechanisms and evidence into their canonical home, update incoming
links, then delete superseded project documents and files. Do not retain a duplicate just by
labeling it historical or moving it to an in-tree archive. Git history retains tracked evidence;
untracked material needs a verified recovery copy before destructive removal. Retain a source note
only while it has unique, still-relevant value. User data, license notices and external reference
checkouts are separate from obsolete project documentation and keep their own retention rules.

## Vision

Status: product vision and decision synthesis. [`product.md`](product.md) is the authority on what
Fleet is and is not; [`decisions.md`](decisions.md) and [`architecture.md`](architecture.md)
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

> Project vocabulary with exact meanings, subordinate to [`product.md`](product.md). These
> definitions clarify other documents; they never override the product authority or establish
> implementation. Current capability status belongs in `architecture.md`.

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
| **Action seam / governed action** | The target contract where human UI and Agent tool calls converge on one validator, policy evaluation, executor, state authority, and evidence trail ([`modules/agent-core.md`](modules/agent-core.md#release-contract--r4-action-seam)). |
| **Caller-aware** | Policy and evidence know *who* invoked (human UI / agent / workflow) and may decide differently per caller — while sharing one executor. |
| **Closed loop** | A capability whose entry → behavior → state → evidence → error/recovery → caller-visible result all exist and were verified together. The completion contract is [`architecture.md`](architecture.md) §5. |
| **System suite** | A large independently deliverable closed loop that combines multiple registry rows and bounded contexts behind shared contracts; it groups delivery ownership but never creates a new state authority. Each suite is one document in [`modules/`](modules/). |
| **Slice** | The smallest coherent implementation block delivering one observable outcome across all affected layers (UI + logic + state + recovery + docs). |
| **Release (R0…R18)** | A bounded, spec'd, acceptance-tested unit of the complete development order in [`TODO.md`](../TODO.md#release-ladder). Exactly one is ACTIVE (a WIP limit, not a time phase); others are READY, DEP (dependency-blocked), or GATED (named non-time gate). R16 owns the bounded optional local-app Component; R17/R18 resolve their remaining conditional rows by implementation or evidence-backed `NO_GAP`. |
| **Product Matrix** | The breadth authority: every product domain's capabilities, status, gaps, reference projects, backend authority, and acceptance anchor — never trimmed by sequencing ([`capabilities.md`](capabilities.md#product-matrix), Decision G5). |
| **Component** | An installable bounded capability bundle: UI/panels, domain commands, Skills, MCP declarations, defaults, and optional knowledge resources. It consumes Fleet authorities and owns only its native domain. |
| **Plugin** | Distribution packaging that bundles existing Skill/Source capabilities and the planned Component capability. Compatibility adapters map package contents to those authorities; a Plugin is never a fourth authority or a separate permission, connection or skill store (P11). The former Fleet `ComponentManifest` implementation is absent after the rebuild. |
| **Assistant** | The identity that performs work: persona, model, prompt, requested loadout and permission request. It is distinct from a Component or Session; requests never grant permission. Fleet's independent Assistant store and Session binding are targets, `not implemented` ([`product.md`](product.md)). |
| **Session** | The existing Craft conversation and execution record owned by SessionManager, with its transcript, context, permissions and events. Child Sessions may link through `parentSessionId`; an Assistant identity is not another conversation store. |
| **Task** | A unit of work. The user-facing **New Task** action starts work through the Session authority and does not require a duplicate structured Task record (P10). Craft's explicit structured Task is separately represented by a TaskSpec DAG and run log, executed through child Sessions by TaskRunner. |
| **Conversation loadout (proposal)** | The Component/Skill/MCP choices accepted for one Conversation, derived from installed availability and defaults; it cannot grant permissions. Storage and migration are not yet selected. |
| **Component default** | A vendor-provided value shipped by a Component. It is immutable package input; user and workspace changes are stored as overrides. |
| **Frontend track** | Pages may be spec'd, mocked behind typed adapters and built preview-gated ahead of their backend behavior, reported `display-only` until wired ([`capabilities.md`](capabilities.md#page-structure) §5, Decision G6). New feature work remains subject to the baseline exit in `TODO.md`; preview gating does not bypass it. |
| **Preview gate** | The developer/preview toggle behind which unwired pages live; the default user surface never shows controls without real behavior. |
| **Admission grade** | The verdict a reference earns in the single admission ledger [`references/references.md`](references.md): `FORMAL_REFERENCE` · `MODULE_REFERENCE` · `LOCAL_IMPROVEMENT` · `EVIDENCE_ONLY` · `REJECT` (`candidate` until audited). Checkout mechanics stay in `源码参考/meta/`. |
| **Reference intake** | The bounded step before designing EXTEND/NEW work: read the matrix row's named reference files/symbols, extract a mechanism list, map each mechanism to its Craft seam (`../AGENTS.md` method step 2). |
| **Orchestration planes** | Execution (who runs work), composition (how capabilities/artifacts chain), command (how the human directs) — one kernel under all three ([`agent-core.md`](modules/agent-core.md#orchestration)). |
| **Staging** | Placing an artifact/evidence reference into an agent's pending brief/composer via canvas gesture — visible, removable, and inert until explicitly sent (never run-by-arrangement). |
| **Workflow promotion** | Explicitly converting a completed chain of reference/input edges into a versioned finite DAG definition — history is never rewritten to pretend it was a workflow ([`agent-core.md`](modules/agent-core.md#orchestration) §4.3). |
| **Duty to dissent** | G1's second half: an agent must state the better technical route, its reasons, and both costs before executing an owner suggestion it believes suboptimal. |
| **Token ROI** | The token-economy metric: cost per *accepted* outcome — never raw tokens per request (`modules/context.md` §5, Decision E12). |
| **Context rot** | The measured non-uniform accuracy drop (often 30–50%) as input context grows, with mid-context information under-attended ("lost in the middle"). The scientific reason leaner context raises capability. |
| **Prefix stability** | Engineering the prompt so system + tool definitions stay byte-identical across turns (three-zone layout), maximizing provider prompt-cache hits — pure cost/latency win (`modules/context.md` L1). |
| **Harness / execution profile** | Harness is the model-facing prompt, tools, context assembly and call loop around a runtime. An execution profile is one measured configuration of that harness (for example Pi-light); it never owns Session, permission, task or cost state (E13). |
| **Effective projection** | The smallest prompt/tool/Skill/Source/environment view for one model call, computed from task need ∩ installed capability ∩ runtime availability ∩ caller policy ∩ live grant. It is a derived view, not an authority (E13). |
| **Spec** | The executable specification for a release: outcome, scope, acceptance criteria with stable IDs, non-goals, verification plan (`modules/`). |
| **Packet state** | Documentation readiness only: `BREADTH_ONLY` · `PACKET_DRAFT` · `READY_FOR_SPEC`. Spec lifecycle and roadmap ACTIVE/READY/DEP/GATED are separate facts ([`capabilities.md`](capabilities.md#capability-register)). |
| **REUSE / EXTEND / NEW / CONDITIONAL** | The mandatory classification against Craft's existing capability before building ([`capabilities.md`](capabilities.md#craft-capability-map)). |
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
| **Workspace / Project** | Current Craft: Workspace scopes Project and Session records. Proposed UI: no visible Workspace tier; Host identifies local/remote execution, Project identifies an optional folder on that Host, and Conversation keeps its own history and loadout. No data migration is approved. |
| **BrowserPane** | Craft's in-app governed browser surface; in Fleet, an evidence-capture input, never a stealth browser (Decision E6). |
| **Native surface / module** | A production surface owning its own document/job model (Markdown editor, video editor…), registering capabilities on the spine instead of becoming a separate app (Decision E4). |
| **Loadout** | The scoped set of capabilities/tools enabled for a given agent/task, narrower than what is installed (Decision E2). It contributes to effective projection but does not replace permission or the governed Action seam. |
| **Agent lane** | A provider/runtime route used by Fleet (local CLI, API, subscription-backed or remote); lanes consume context projections but do not own shared memory or project context. |
| **Upstream intake** | Reviewing official Craft tags/release notes/source to selectively port changes — never merging the upstream tree wholesale (Decision P8). |
| **Vibe Coding** | The owner-directed, agent-executed development mode this project runs on. Its known failure modes and countermeasures are [`architecture.md`](architecture.md) §4. |
