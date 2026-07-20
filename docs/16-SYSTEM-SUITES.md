# 16 — System suites: independent closed loops

This document groups the registry capability rows into large, independently buildable product systems.
The registry answers *what* exists; this document answers *which capabilities must be built and
verified together*. A suite is not a release phase and does not own a second copy of shared state.
Each suite has one deep external interface, an internal implementation, and explicit adapters at
the seams. Agents may work on different suites in parallel only when they do not edit the same
shared contract; the foundation suite owns integration of those contracts.

Suites are ownership groupings, never time buckets. Their executable order is fixed by R0–R18 in
[`05-ROADMAP.md`](05-ROADMAP.md); every suite row below names those release anchors so no suite can
be left as “later work”.

## Non-negotiable suite rules

1. A suite owns a user-visible closed loop, not a technology pile. “Uses X” is not a boundary.
2. Shared contracts have **one integration owner — the Foundation suite (SYS-01)** — but are
   **extracted, never pre-frozen** (Decisions G2/D6): a contract name in a suite packet (e.g.
   `ActionEnvelope`, `TaskBrief`, `RunReport`, `ArtifactRef`, `JobRef`, `ContextPack`,
   `UsageRecord`, `ExternalTargetRef`, `DeliveryReceipt`) is a *candidate vocabulary entry* until
   its first real producer and consumer land, at which point SYS-01 promotes the smallest proven
   shape. No suite may implement against an unlanded contract or freeze fields speculatively.
3. Native content remains owned by its suite. A canvas projects it; a browser captures it; a media
   editor edits a sequence; none may create a second Session, Task, Permission, Artifact, Job or
   Timeline authority.
4. A suite can be marked `design-ready` only after its packet names code seams, adapters, references,
   failure/recovery, rollback and acceptance evidence. `usable` remains the capability status from
   [`07-PLAYBOOK.md`](07-PLAYBOOK.md), not a suite-planning label.
5. A suite may consume another suite's interface, but cannot reach into its implementation. Cross-
   suite calls are typed actions, artifact references, jobs, events or external-target grants.
6. Every external reference below is a research candidate until it passes the admission record in
   [`references/REFERENCE-REGISTRY.md`](references/REFERENCE-REGISTRY.md). The detailed source audit
   is [`references/ADMISSION-V2-AUDIT.md`](references/ADMISSION-V2-AUDIT.md).

## Suite map

| ID | Closed loop | Capability rows | Primary owner/seam | Development-order anchors |
|---|---|---|---|---|
| SYS-01 | Agent operating system and governance | CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, CORE-07, CORE-08, CORE-09, CORE-10, CORE-11; EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05, EXEC-06, EXEC-07, EXEC-08, EXEC-10, EXEC-11, EXEC-13, EXEC-14; ORCH-03, ORCH-04, ORCH-06, ORCH-07, ORCH-08, ORCH-09 | Session/Task/Permission/Action/Job contracts over Craft | R0–R6 integration spine; R9, R14–R18 consume it |
| SYS-02 | Remote engineering office | EXEC-05, EXEC-07, EXEC-09, EXEC-12, EXEC-13; INFO-01, INFO-08 | Runtime adapter, Git/worktree, external target grant, delivery receipt | R14; R16/R18 conditional closure |
| SYS-03 | Token, memory and skill economy | INTEL-01, INTEL-02, INTEL-03, INTEL-04, INTEL-05, INTEL-06, INTEL-07; EXEC-14; ORCH-03; INFO-06 | Craft UsageTracker/prompt/tool paths; conditional ContextPack/ContextSegment projection; memory review | TE1 + R3 benchmark; R9; R15 loadout; R17 closure |
| SYS-04 | Governed browser and evidence | INFO-03, INFO-07; EXEC-01, EXEC-08; ORCH-07 | BrowserPane, policy, capture/evidence ArtifactRef | R3/R5; R16 closure |
| SYS-05 | Design, web and spatial workspace | CREATE-01, CREATE-06, CREATE-07, CREATE-09, CREATE-11; CORE-11; INFO-02, INFO-05 | Native design schema, canvas projection, preview adapter, asset references | R7, R10, R13; R18 layout closure |
| SYS-06 | AIGC and media production | CREATE-02, CREATE-03, CREATE-04, CREATE-05, CREATE-08, CREATE-10, CREATE-12, CREATE-13, CREATE-14, CREATE-15, CREATE-16; ORCH-05; INFO-02, INFO-04, INFO-07 | Sequence/document owners, media/render Job, ArtifactRef, delivery profile | R11–R13 |
| SYS-07 | Workflow and delivery composition | ORCH-01, ORCH-02, ORCH-05, ORCH-06, ORCH-07; CREATE-12; EXEC-10, EXEC-13 | Typed DAG over governed actions, run projection, delivery receipt | R8; consumes R14 delivery adapters |
| SYS-08 | Skill, plugin and MCP marketplaces | ORCH-03, ORCH-04, ORCH-10, ORCH-11, ORCH-12 | Catalog, manifest, trust, install/update/rollback and package governance | R15 |

## Frontend-to-backend contract check

This table is a consistency projection of the canonical module and page contracts. It does not own
state. A suite is not ready for an implementation spec when any cell would require a second
authority or an untyped renderer-to-provider call.

| Suite | Frontend projection | Backend/native authority | Replaceable seam | Required proof before activation |
|---|---|---|---|---|
| SYS-01 | Craft shell, Session/Task views, permission and evidence UI | Craft Workspace, Session, Task, permission, settings and timeline paths | provider/runtime adapters behind the existing Agent backend | one attributed human/Agent mutation through one policy and evidence path |
| SYS-02 | remote target, worktree, run and delivery states | TaskRunner plus Git/process and user-owned target grants | runtime, Git host and transport adapters | connect, run, deliver, revoke and recover without a remote control-plane authority |
| SYS-03 | usage/profile/loadout views and reviewed-memory inbox | prompt/tool assembly, UsageTracker, Session evidence and reviewed experience records | provider schema, measured optimizer and retrieval adapters | same sealed task, unchanged model/effort/policy, cost and quality compared with optimizer disabled |
| SYS-04 | BrowserPane, evidence inspector and capture/download states | Craft BrowserPane/session correlation, core policy, Library ArtifactRef | structured browser executor and capture adapters | navigate, capture, deny and recover with URL/time/source provenance |
| SYS-05 | design editor, preview and spatial canvas projection | native design/web document; canvas owns viewport/layout only | renderer and preview adapters | native edit survives canvas removal; Electron benchmark passes |
| SYS-06 | media editors, timeline, job and delivery views | native Sequence/document plus shared Job and ArtifactRef contracts | codec, generator, renderer and exporter adapters | import, shared human/Agent edit, cancellable real render and provenance |
| SYS-07 | workflow editor and run projection | typed workflow definition; Task/Job authorities remain upstream | action, schedule and delivery adapters | promote one already-working chain, validate, run, cancel and resume it |
| SYS-08 | catalog, manifest, risk, install and rollback views | package identity, staged transaction and receipt; runtime grants remain SYS-01 | catalog, package transport, signature and health-check adapters | inspect, stage, fail health check, roll back, reopen approval on capability change and uninstall offline |

The rows are deliberately overlapping at interfaces (for example ArtifactRef and JobRef), not at
authority. The overlap means “consumes this contract”; the owner is always the first suite listed
in the contract table below.

## Reference evidence grouped by suite

Standing references are intentionally few. A historical candidate may be opened temporarily only
when the active slice proves that this set and a small Craft extension do not cover its exact gap.

| Suite | Craft/Fleet base | Standing external evidence |
|---|---|---|
| SYS-01 | Craft baseline and AV-ORCH-01 | Pi for thin-harness comparison; Codex/OpenHands for bounded protocol and executor seams; Hermes/OpenClaw only for the requested complex-environment comparison |
| SYS-02 | Craft transport, filesystem, TaskRunner and Git/process seams | OpenHands executor and Codex protocol evidence; specialized lease/worktree sources remain mechanism evidence only |
| SYS-03 | Craft prompt/tool assembly and UsageTracker | Pi, Agent Skills, Mem0 and the named memory/context benchmarks |
| SYS-04 | AV-BRW-01 and Craft BrowserPane | Playwright MCP, Browser Use and OSWorld-family evaluation |
| SYS-05 | AV-CAN-01/02, AV-EDT-01 and Craft TipTap | xyflow, FlowGram and Penpot; tldraw remains license-gated comparison only |
| SYS-06 | AV-VID-01/02/03 and Craft file/session/job seams | OpenCut classic, HyperFrames and FFmpeg; current OpenCut is direction evidence only |
| SYS-07 | Craft TaskRunner and AV-ORCH-01 | FlowGram editor/runtime separation |
| SYS-08 | Craft Skills/Sources/MCP/credentials/settings | Agent Skills and official MCP Registry; vendor marketplaces are behavior evidence only |

“Existing source-level evidence” means files were inspected; it does not mean the candidate passed
same-task comparison or is approved for production. The immutable checkout/license facts and full
candidate list remain in [`references/REFERENCE-REGISTRY.md`](references/REFERENCE-REGISTRY.md).

### Shared-row ownership exceptions

| Registry row | SYS-01 owns | Other suite owns |
|---|---|---|
| EXEC-13 Git/PR | action definition, permission, attribution, review evidence and delivery receipt | SYS-02 owns remote-target/GitHub/worktree adapters and the remote loop |
| EXEC-14 prompt/profile | versioned system-prompt/profile authority, policy ceiling and identity attribution | SYS-03 consumes profiles for context/loadout and measures token/quality effects |
| EXEC-05 runtime adapters | adapter interface, capability negotiation and caller/policy contract | SYS-02 implements remote/cloud target adapters; providers never own Session/Task state |
| EXEC-08 sandbox | permission-facing script isolation contract and safety ceiling | SYS-02/04/06 may supply replaceable executor adapters; full OS/container lifecycle remains gated |
| ORCH-03 plugin/loadout | manifest trust, install/loadout/runtime permission contract | SYS-03 owns token/context effects of a loadout; a skill cannot bypass SYS-01 policy |
| ORCH-05 jobs | `JobRef`, cancellation, budget and lifecycle contract | SYS-06 implements media/render jobs; SYS-07 projects workflow jobs; neither creates a queue authority |
| INFO-02 ArtifactRef | envelope/version/provenance contract | SYS-04/05/06 own their native evidence/design/media content |
| ORCH-10..12 marketplaces | package identity, manifest, trust and lifecycle contracts | SYS-08 owns catalogs and transactions; SYS-01 owns grants/policy; SYS-03 consumes loadouts |

## Shared-contract ownership

| Contract | Owner suite | Consumers | Invariant / conflict test |
|---|---|---|---|
| `ActorRef` + identity labels | SYS-01 | every suite | one stable identity, caller and role; a display label never grants permission |
| `PermissionDecision` | SYS-01 | SYS-02/04/06/07 | deny/approval/allow is evaluated once; adapters cannot bypass it |
| `ActionEnvelope` + evidence event | SYS-01 | all mutations and workflow steps | human, Agent, browser, media and Git callers converge on one executor/evidence path |
| `RunRef`/`TaskBrief`/`RunReport` | SYS-01 | SYS-02/03/06/07 | child runs project Craft Session/Task state; no second run store |
| `ArtifactRef`/`DeliveryReceipt` | SYS-01 contract; native owner remains suite-specific | SYS-04/05/06/07 | exact version/provenance; bytes stay with native owner; missing/deleted is explicit |
| `JobRef`/`ResourceBudget`/`CancelToken` | SYS-01 contract; execution implementation may be SYS-06/07 | SYS-03/05/06/07 | one cancellable lifecycle, restart/retry semantics and resource limit evidence |
| effective prompt/tool projection + conditional `ContextPack`/`ContextSegment` + `UsageRecord` | SYS-03, consuming SYS-01 policy/profile facts | all internal Agent lanes; optional MCP edge adapter | start from Craft prompt/tool/UsageTracker paths; create no projection store until a real second consumer proves it; optimization is switchable and measured; `unknown` cost is never zero |
| `ExternalTargetRef`/`Grant` | SYS-02 | SYS-04/07 | user-owned target, scope, expiry, disconnect and revoke are explicit |
| `Sequence`/`RenderProfile` | SYS-06 | SYS-05/07 | media native model owns timing; canvas and workflow only reference it |
| `TypedWorkflowDefinition` | SYS-07 | SYS-01/02/06 | finite, versioned DAG; definition is not execution authority |

## Suite packets and reference sets

### SYS-01 — Agent operating system and governance

**End-state loop:** intent → system prompt/profile → actor/permission evaluation → CLI/API/tool call
→ Task/Session execution → evidence/report → optional Git/PR delivery. SYS-01 is the first
**integration owner**, not a mandate to build this entire loop before product work. Roadmap slices
start from Craft and extract each shared contract only when R3/R4/R5/R6 supplies its real callers.

**References to audit together:** Craft v0.11.1 remains authority. Pi tests the thin harness; Codex
tests bounded graph/protocol patterns; OpenHands tests executor isolation. Hermes and OpenClaw are
kept only for the owner's explicit complex-computer-environment comparison. Specialized sources may
prove a missing lease, queue or recovery mechanism, but cannot become standing shells.

**One owner, many slices:** system prompts, identity, permissions, loadouts, runtime adapters,
delegation, budgets, terminal and Git/PR may be implemented in separate roadmap slices. They must
not fork their shared Craft authorities or be assigned concurrently across the same paths. “SYS-01
owns integration” is a collision rule, not permission for a giant governance-first rewrite.

**First acceptance gate:** after R3 creates the second caller, one human and one Agent mutate the
same real session property through one attributed Craft-backed action path with allow/ask/deny,
failure and restart evidence. Prompt/profile work stays in the post-TE1 SYS-03 slice; Git/PR stays
in a later SYS-02 delivery slice.

### SYS-02 — Remote engineering office

**Closed loop:** local Project → user-owned GitHub repository/branch → local or cloud computer target
→ isolated worktree/runtime → Agent run → diff/test → PR review → delivery receipt → disconnect/revoke.

**References to audit together:** OpenHands for executor lifecycle, Codex for typed protocol behavior,
and the owner remote-workspace design note. Narrow lease/worktree sources are consulted only if this
pair and Craft do not prove a required failure path. They are compared against Fleet's SessionManager, transport,
filesystem isolation and permission paths; none may introduce a remote control plane or official Fleet
machine pool.

**Compatibility gate:** location, checkout, worktree isolation, runtime provider, Git source and
external grant are separate records. Reconnect, stale branch, revoked grant, dirty worktree, failed
push and rejected PR each have an explicit state and recovery path.

### SYS-03 — Token, memory and skill economy

**Closed loop:** raw session/tool output → evidence selection/context projection → skill/loadout and
system prompt assembly → model call → measured usage/cost → autonomous memory write/consolidation
(logged, D5 floors) → optional human curation (pin/correct/delete). The purpose is lower cost and context load without lower answer
quality; it is not a generic “memory database”.

**References to audit together:** Craft + Pi as the runtime/wrapper baseline; Databricks as
model×harness benchmark evidence; OpenHands for gated executor isolation; Hermes for capability
probes/static toolsets/optional Tool Search; OpenClaw for effective policy filtering, expiring grants
and stale-observation checks; Agent Skills for progressive disclosure; Mem0 and named papers for
memory operations/evaluation. None justifies importing a shell, gateway, second kernel, MCP-first internal bus
or memory authority. Each candidate is tested on the same Fleet trace for token savings, latency,
answer-quality regression, stale-output behavior, disable-switch and privacy.

**First acceptance gate:** TE1 reports a truthful current-profile baseline without changing calls.
Only then may one bounded profile slice compare current full profiles with prompt/tool projection or
Pi-light on the same sealed task. The ledger reports real, estimated and unknown usage; acceptance,
rework, halt, hidden-tool recovery, policy/stale violations and cost per accepted outcome decide the
winner. Memory remains a later reviewed loop and cannot be introduced as compensation for a weak
profile.

### SYS-04 — Governed browser and evidence

**Closed loop:** permitted target → navigation/automation → annotation/capture/download → evidence
ArtifactRef → Agent/Task/Document/Media consumer, with policy, credential and external-side-effect
controls at every consequential action.

**References to audit together:** Craft BrowserPane/browser tools (authority), Playwright MCP for
structured snapshot/actions, Browser Use for session/CDP/recovery, OSWorld for evaluation, and
browser/CDP documentation. The browser never
owns the task store, permission store, library or document authority.

**First acceptance gate:** permitted capture correlates session/URL/time/source; denied credential or
external-effect action is blocked by core policy; offline, blocked, evidence-unavailable and download
failure states are visible and recoverable.

### SYS-05 — Design, web and spatial workspace

**Closed loop:** intent/reference → native design or web artifact → canvas spatial projection →
governed mutation → preview/animation → versioned export/ArtifactRef.

**References to audit together:** xyflow for the React graph, FlowGram for workflow-editor seams and
Penpot for transactional design state. tldraw remains a license-gated interaction comparison.
Owner-provided Figma/Open Design observations are product evidence. TipTap remains the document
authority until a same-task local-improvement test fails.

**Compatibility gate:** canvas owns only layout/viewport/grouping; native design/web/document models
own content; iframe/webview previews stay out of the graph renderer; a renderer benchmark runs in the
real Electron shell before React Flow or a GPU layer is committed.

### SYS-06 — AIGC and media production

**Closed loop:** prompt/source/reference → text/document/image/audio/video/3D/scene asset → analysis,
storyboard, captions, multi-angle/multi-grid/relight or panorama operation → timeline/sequence or
native document → render Job → asset library/ArtifactRef → delivery profile. Agent commands and human
edit commands share the same domain operation.

**References to audit together:** OpenCut classic for implemented timeline/track/snap/export
mechanisms, current OpenCut for direction only, HyperFrames for deterministic programmatic render
and cancellation, and FFmpeg for the media-engine seam. The recovered historical pool is preserved
but is not a research queue in
[`references/video/00-CANDIDATE-INVENTORY.md`](references/video/00-CANDIDATE-INVENTORY.md).

**Compatibility gate:** no native media path currently exists in Fleet; do not call a timeline mock a
video editor. The first real slice must import media, apply one shared trim/split operation, render a
cancellable real output and preserve source/output provenance. 3D, relight, panorama and multi-angle
features remain inside this suite as typed adapters, not unrelated mini-products.

### SYS-07 — Workflow and delivery composition

**Closed loop:** a completed real action chain → typed finite DAG → validated run → TaskRunner/events
projection → outputs/artifacts → delivery receipt, with scheduled or automated execution only through
SYS-01 policy and SYS-02/06 adapters.

**References to audit together:** FlowGram for editor/runtime separation and Craft TaskRunner as
authority. Media delivery consumes the already-proved Job/Artifact seam rather than adding another
workflow reference. A workflow reference cannot define Fleet permissions or persistence.

**Compatibility gate:** promote a workflow only from a completed real chain; reject stale definitions,
cycles and unsupported capabilities; a workflow definition, run history and delivery receipt must not
become a second task/job/session authority.

### SYS-08 — Skill, plugin and MCP marketplaces

**Closed loop:** discover → inspect manifest/dependencies/risk → verify provenance/license/compatibility
→ approve scoped grants → stage/install → health check → activate loadout → use → update/rollback/
uninstall with receipts.

**References to audit together:** Agent Skills supplies the open Skill format and progressive
disclosure; the official MCP Registry supplies publication metadata, namespace and version evidence.
Codex, Cursor and Claude marketplaces remain product-behavior comparisons for bundles and role
controls. The observations and Fleet decisions are recorded in
[`references/marketplaces/00-MARKETPLACE-BENCHMARK.md`](references/marketplaces/00-MARKETPLACE-BENCHMARK.md).

**Compatibility gate:** a bundle is a projection, not an authority. Every contained skill, MCP
server, subagent, hook and rule is independently inspectable, permissioned, versioned and removable.
Install/update is transactional and rollback-safe; any changed tool, prompt, hook, credential or
network scope reopens review.

## Build and parallelism contract

1. **SYS-01 first integration owner:** freeze shared interfaces and prove the first action/run/report
   loop. This is not a ban on research or preview work in other suites; it is a ban on shipping a
   second authority before the foundation seam exists.
2. **Parallel research/preview:** SYS-02 through SYS-08 may produce reference audits, fixtures,
   typed adapters and preview-only pages in disjoint paths. Their status remains `display-only` or
   `not implemented` until the foundation contract is real.
3. **First independent deliveries:** SYS-02 remote Git/PR loop, SYS-03 token/memory loop, SYS-04
   browser evidence loop and SYS-06 media loop each require a real end-to-end acceptance. SYS-05 and
   SYS-07 consume those artifacts/actions rather than inventing new ones. SYS-08 may first deliver
   a local catalog/install transaction without depending on a hosted marketplace.
4. **Integration checkpoints:** before combining suites, run the conflict matrix: authority owner,
   caller/policy, artifact version, job cancellation, resource budget, offline/denied/recovery,
   license/dependency and deletion test. A failed row blocks integration of that edge, not unrelated
   suite research.
5. **Agent assignment:** one Agent owns one suite packet and its fixtures; SYS-01 owns shared
   contracts and final merge. No two Agents edit a shared contract concurrently. Every suite reports
   the same status vocabulary and links its acceptance IDs, code paths and reference evidence. The
   assignment format is [`modules/SUITE-PACKET-TEMPLATE.md`](modules/SUITE-PACKET-TEMPLATE.md).
   The concrete packets are indexed in [`modules/suites/README.md`](modules/suites/README.md).

## Cross-suite conflict matrix

| Pair | Likely collision | Required resolution before integration |
|---|---|---|
| SYS-01 × SYS-02 | local Agent versus cloud Agent identity, Git credentials and branch/worktree ownership | SYS-01 owns ActorRef/PermissionDecision/ActionEnvelope; SYS-02 supplies ExternalTargetRef and Git adapter only |
| SYS-01 × SYS-03 | system prompt, skill loadout, memory and token pruning all trying to rewrite context | SYS-01 owns policy ceiling/profile facts; SYS-03 owns one measured effective projection and UsageRecord over them; neither owns the other's authority or the Action seam |
| SYS-01 × SYS-04 | browser automation bypassing approval or silently turning captures into documents | Browser calls ActionEnvelope; BrowserPane remains the execution surface; captures become ArtifactRefs with evidence class |
| SYS-01 × SYS-05 | canvas node handler mutating a design/document/task store directly | canvas emits governed actions and projects records; native editor/Task authority commits state |
| SYS-01 × SYS-06 | media provider or FFmpeg process becoming its own job, permission or artifact store | media adapters implement JobRef/CancelToken and return ArtifactRef; SYS-01 owns policy and lifecycle |
| SYS-01 × SYS-07 | workflow engine becoming a second executor/run history | workflow definitions are typed DAGs; TaskRunner/SessionEvents remain execution authority |
| SYS-03 × SYS-06 | compression/pruning removing media or prompt provenance to save tokens | ContextPack must preserve source ArtifactRefs and declared quality criteria; media never receives opaque rewritten truth |
| SYS-04 × SYS-05 | web preview/iframe being treated as canvas nodes or editable source | preview is isolated/versioned; canvas stores only a projection reference |
| SYS-05 × SYS-06 | canvas, design editor and media timeline all claiming asset/sequence ownership | Library/ArtifactRef links the objects; native design/media owner keeps content and version |
| SYS-06 × SYS-07 | render/export jobs being scheduled twice or delivered without fidelity metadata | one JobRef and one DeliveryReceipt; workflow only invokes and projects them |
| SYS-01 × SYS-08 | marketplace package or update bypassing grants, policy ceiling or audit | SYS-08 stages and describes packages; SYS-01 approves actions, credentials, network and write scope |
| SYS-03 × SYS-08 | marketplace loadout changing prompts/context or silently adding token-heavy tools | SYS-03 measures ContextPack/UsageRecord effects; SYS-08 only publishes manifest facts and dependency changes |

The matrix is a merge gate, not a suggestion list. A suite Agent may continue isolated research while a
pair is blocked, but may not add a bypass adapter or a second store to “make integration easier”.

## Suite completion gate

A suite is ready for owner acceptance only when its closed loop runs twice from the documented
procedure, every required state is observed, one real reference mechanism has been compared against a
same-task local alternative, the deletion test passes, and the suite's `PACKET-INDEX`, registry,
surface registry, active spec and user-facing docs agree. Until then, this document records scope and
direction, not completion.
