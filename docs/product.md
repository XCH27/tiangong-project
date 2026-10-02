# Product — what Fleet is and is not

This is the authority on product meaning and scope. Current owner instructions take precedence.
Implementation status is in [Capabilities](capabilities.md), work order in [TODO](../TODO.md),
contracts in the owning [module](modules/), and historical choices in [Decisions](decisions.md).

## One sentence

**A workbench a person and their Agents operate together, where the work itself lives inside the
software.** Native documents, design, canvas, browser evidence and media are first-class work.

## Baseline reassessment

OV-027 selects ZCode as the reconstruction direction. The active candidate is `.fleet/zcode`,
using ZCode `AgentRuntime` as Host with a Pi AgentSession loop (OV-069). `app/` preserves the Craft branch
and its uncommitted work. Neither has completed all Fleet requirements; choosing the product base
does not approve replacing runtime, credentials or user data.

OV-066 selects one Fleet Host evolved from the existing ZCode owners. OV-069 integrates Pi AgentSession
as its default loop executor; supported native vendor routes remain separate adapters. Pi durable/Chord is
retained mechanism evidence, not a planned whole-runtime replacement. Shared page operations,
native editing and plugin lifecycle drive requirements; OV-067 first verifies their kernel
boundaries, then acceptance tests prove those operations
on the selected implementation. [Decision](decisions.md#ov-066--close-foundation-choices-and-deliver-in-dependency-order-2026-09-29),
[source evidence](references.md#kernel-choice-against-fleets-complete-product).

The requirements that survive every implementation choice are:

- Human controls and Agent tools operate the same native object through its domain operations.
- Every functional page offers contextual Agent assistance, with exact target and state.
- Projects choose installed suites; plugins can add genuine work surfaces and Agent operations.
- Native files, editor undo/drafts and domain data keep their own owners; one authority does not
  mean one database or a universal document format.
- The model receives the useful, permitted context for the task rather than the entire catalogue.
- Local work has no mandatory Fleet/vendor account; declared platform, format and provider support
  must be verified on its real path.

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

## Conversation, Project and Workspace boundary

**Owner decision (OV-024, 2026-09-26): they are one thing.** A **Project is a folder** — local, or
on a user-owned remote host. The project folder is the workspace; its conversations live in it. A
conversation with no folder is an ordinary conversation. There is one creation entry, New
Conversation, whose project picker offers recent projects, Open folder (the folder becomes its
project on first use), remote connection and Work outside a project. There is no separate New
Project form and no New Workspace wizard; mainstream agent desktops (ZCode, Codex, Claude Code,
Cursor) and Cindy/OpenChamber all bind work to a folder the same way.

Implementation status and migration gaps belong in the [register](capabilities.md) and
[current workflow](../TODO.md), not in product definitions. Existing records remain recoverable.

**Suites (OV-023):** Fleet is a general Agent foundation. Each Project chooses the suites it needs —
Skills, Sources/MCP and right-side tools — from the installed catalog, stored in the project's own
files so a person or an Agent can change them.

**Agent-operable by construction (OV-024):** every feature's operations are defined once and
reached by buttons, the Agent's built-in tools and config-as-files alike, under the one
permission path; every functional page must provide Craft-style contextual Agent assistance for its own target.
This is the required product contract; delivery status belongs to the capability register.

## Reference roles and current implementation

Reference roles guide comparisons, not ownership of separate pieces of the running application.
One selected baseline must own the coherent task lifecycle. The historical Craft-first assignment
below is revised under OV-025; consulting a better mechanism does not admit its whole runtime.

| Source | What it decides | What it does **not** decide |
|---|---|---|
| **Craft Agents** (Apache-2.0; current `app/` tracks **v0.13.4**) | Contextual Agent-assisted editing/configuration, conversation bubbles and conversation-linked Board; preserve useful Pages/document mechanisms | Mandatory retention of its frontend/runtime, Project hierarchy or blanket permission defaults |
| **Cindy** (Apache-2.0) | Application-plugin lifecycle, human/Agent operations and Pi host integration reference | A second host/runtime, mandatory cloud services or its visual style |
| **ZCode** (Apache-2.0) | Selected complete-product reconstruction direction (OV-027); current candidate's AgentRuntime and conversation shell are preserved through kernel proof | Mandatory coding-only scope, vendor accounts, or automatic approval of a storage/security migration |
| **OpenChamber** (MIT) | Git/GitHub reference and complete-host challenger; compare its extension SDK and browser-control seam | Automatic adoption of OpenCode's product shape or a second Agent runtime |
| **Fleet's own** | The product boundary and integration of the **built-in production surfaces**: infinite canvas, document editing, video and animation. Reference projects may supply bounded mechanisms | — |

**QoderWork CN and TRAE SOLO CN are interface reference only.** Their layout and interaction
patterns may be read; their product concepts may not be imported. Taking Qoder's plugin model and
grafting it onto Craft's label store is exactly the mistake this line exists to prevent.

**Absorb only a demonstrated improvement, in both frontend and backend work.** The named references
provide starting points and responsibilities, not a presumption that their implementation is better.
Start with a concrete Fleet need and compare the current path, a small local correction, the target
software's own facilities, and a relevant alternative. Whole-baseline selection also compares
complete end-to-end paths without presuming the current base wins. Reuse a bounded mechanism only when the
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

### Components, assistants and conversation loadouts

A **Component** is an installable capability bundle: native views, domain operations/data, Skills,
MCP declarations, optional dependencies and suggested Assistant settings. The user-facing term is
**plugin**. A **Skill** describes a procedure; an **Assistant** is the identity/model/requested
loadout performing work. These are different roles, not interchangeable configuration stores.

Installed packages are global; a Project selects its suite. Vendor defaults remain immutable and
user/Project settings are overrides. The effective set is fixed at an admitted turn boundary;
changing a suite does not change a running request or grant permissions. A folderless conversation
uses explicitly supported defaults without inventing a Project. That default policy remains open.

Plugins can add main views and right-tool entries without editing host source. People can resize,
move and restore supported panels; layout stores positions, not native documents. One Fleet visual
language covers host chrome and common controls while a professional editor retains its domain
operations. Agents may author and maintain packages through the same installation path as people.

Keep Core limited to shared host/runtime, identity, permission, lifecycle, file and installation
mechanisms. Load heavy editors/codecs/workers only when used. Missing optional dependencies degrade
the affected feature with a recovery path. Closing a view does not cancel its accepted work;
disable/uninstall preserves user artifacts and revokes availability through the owning lifecycle.

[Components](modules/components.md) owns activation and shared-operation details;
[Marketplace](modules/marketplace.md) owns packaging/compatibility/distribution. A package format's
recognition does not imply its executable extensions or UI are compatible.

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
- **An additional sandbox platform without a demonstrated need.** Permission checks and subprocess
  separation do not establish OS isolation. Verify the selected host's actual boundary before
  admitting executable plugins; the old exclusion is not evidence that isolation is already adequate.
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
3. **New surfaces register through the chosen host.** Reuse a concrete host contribution path;
   do not add a second navigation or Session owner to mount a plugin.

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

The work surface is part of the Agent's working environment. A person and an Agent can inspect,
revise and continue the same work. The native surface owns its semantics; the host coordinates
identity, permission, work evidence and handoffs. A coding harness is one execution mechanism.

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

### Native formats and reproducibility

Opening, generating or previewing a file does not establish direct editing or save-back. Native
owners must demonstrate open → human edit → Agent edit → save → reopen, including conflicts,
undo, unsupported features and recovery. Preserve originals; export creates a versioned result
with an honest fidelity report. The [format matrix](modules/canvas.md#format-proof-matrix) owns
feature-specific claims for Office/PDF/SVG/FIG/PSD/AI and named conversion paths. Proprietary
formats may remain unsupported or use approved external-app/export routes.

The [media contract](modules/media.md) owns frame/sample accuracy, preview/render differences,
provider receipts, cancellation and unknown outcomes. Without provider idempotency or queryable
receipts, the host cannot promise exactly-once external effects: stop and reconcile rather than
blindly retry. Native generated bytes, editable projects and previews remain distinct.

The original [scope rule](#the-rule-that-decides-scope) governs what belongs inside Fleet.
An optional Trading/Market Analysis Component may provide research, paper trading and backtests;
live broker actions require a separate explicit contract. Existing test conversations are data,
not default Projects or product requirements.

## Glossary

> Project vocabulary with exact meanings, subordinate to [`product.md`](product.md). These
> definitions clarify other documents; they never override the product authority or establish
> implementation. Current capability status belongs in `capabilities.md`.

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
| **Session** | The logical conversation/run record owned by the selected host. Current ZCode and retained Craft implementations have different owners; private native executor continuation is a bound implementation detail. |
| **Task** | A unit of work. The user-facing **New Task** action starts work through the Session authority and does not require a duplicate structured Task record (P10). Craft's explicit structured Task is separately represented by a TaskSpec DAG and run log, executed through child Sessions by TaskRunner. |
| **Effective turn loadout** | The Component/Skill/MCP projection derived from the Project suite or permitted folderless defaults and bound to one admitted turn. OV-023/024 supersede a separate persistent per-Conversation composition; selection cannot grant permissions. |
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
| **Context degradation** | Task- and model-dependent loss of useful information or accuracy as context grows. A shorter prompt is not inherently better; measure accepted outcomes and evidence retention. |
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
| **Workspace / Project** | Project is a folder on a local or remote host (OV-024). Craft Workspace remains a legacy compatibility container. A conversation can be folderless; no automatic migration of older records is implied. |
| **BrowserPane** | Craft's in-app governed browser surface; in Fleet, an evidence-capture input, never a stealth browser (Decision E6). |
| **Native surface / module** | A production surface owning its own document/job model (Markdown editor, video editor…), registering capabilities on the spine instead of becoming a separate app (Decision E4). |
| **Loadout** | The scoped set of capabilities/tools enabled for a given agent/task, narrower than what is installed (Decision E2). It contributes to effective projection but does not replace permission or the governed Action seam. |
| **Agent lane** | A provider/runtime route used by Fleet (local CLI, API, subscription-backed or remote); lanes consume context projections but do not own shared memory or project context. |
| **Upstream intake** | Reviewing official Craft tags/release notes/source to selectively port changes — never merging the upstream tree wholesale (Decision P8). |
| **Vibe Coding** | The owner-directed, agent-executed development mode this project runs on. Its known failure modes and countermeasures are [`architecture.md`](architecture.md) §4. |
