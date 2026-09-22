# Fleet — Agent-native Workbench Whitepaper

Status: product vision and decision synthesis. [`PRODUCT.md`](PRODUCT.md) is the authority on what
Fleet is and is not; [`02-DECISIONS.md`](02-DECISIONS.md) and [`04-ARCHITECTURE.md`](04-ARCHITECTURE.md)
own binding decisions and invariants; active specs and the capability map own executable scope and
status. This document explains what Fleet is trying to become so an Agent can choose the best
engineering route for a new request instead of reacting to one isolated feature description at a
time.

## 1. The product bet

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

## 2. What Fleet changes about Agent work

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

## 3. One shared spine, many native surfaces

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

## 4. Everything is composable, not everything is global

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

## 5. Components and scopes

A Component is an installable capability bundle. It may contain:

- a left tool entry or right workbench panel;
- a native domain model and commands;
- Skills and prompt fragments;
- MCP servers and tool declarations;
- knowledge/source defaults;
- optional renderers, codecs, workers or external runtimes;
- recommended Assistant settings;
- migrations, health checks and recovery handlers.

The same Component can be enabled globally or only in selected Workspaces. A Workspace may enable
any number of Components. User preferences, extra MCPs, knowledge sources and habits override vendor
defaults without mutating the package.

The effective order is:

```text
vendor default → user default → Workspace override → Session one-off choice
```

Permission is never implied by a Component manifest. A Component requests capabilities; the existing
Fleet permission/trust path decides whether they are granted.

## 6. Progressive disclosure and context economy

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

## 7. Human and Agent iteration

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

### Human demonstrations become reviewed procedures

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

### Work trajectory is a first-class projection

The trajectory of work is one join over SessionEvents, governed actions, Jobs and ArtifactRef
lineage. Components contribute semantic operation records; they do not create private histories.
Each record points to exact input/output versions and carries caller, Component, turn/step, attempt,
parent-operation, evidence and recovery identity. Chat, the canvas and a Component panel therefore
show different views of the same trace. Selecting a step or artifact gives the Agent an explicit
target; revising it creates a new branch and marks dependent results stale until explicit recompute.
The poster example “generate → vectorize text → remove raster text → composite” is four operations
with four immutable result identities, not one overwritten image and not an ambiguous prompt
transcript.

## 8. Interface direction

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

## 9. Reproducibility, migration and real-format compatibility

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

## 10. Trust, permissions and failure radius

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

## 11. What Fleet is not

- not a generic remote-control layer for arbitrary desktop applications;
- not a second operating-system sandbox;
- not a chat shell with every task flattened into prose;
- not a marketplace that silently grants permissions;
- not a universal document model for code, design, video and decks;
- not a second Session, Task, Permission, Settings or memory authority;
- not a promise that every external format, renderer or model capability is fully compatible.

## 12. Execution and implementation boundary

Correct and accept the inherited Craft baseline before adding capabilities. Then build the
Component/panel host before domain Components and external distribution. The single exit is in
[`specs/R0-baseline-audit.md`](specs/R0-baseline-audit.md); order belongs to
[`05-ROADMAP.md`](05-ROADMAP.md), current work to [`WORK-ORDER.md`](WORK-ORDER.md), and durable
choices to [`02-DECISIONS.md`](02-DECISIONS.md). This whitepaper supplies product explanation,
not a second queue or decision ledger.

The v0.13.4 rebuild removed the former Fleet Component registry, layout model, Assistant store,
remote-device extensions and cache-economy helpers. They remain snapshot evidence, not current
capabilities. Use the capability map and current callers for implementation status.
