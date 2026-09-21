# 13 — Orchestration (the core)

> How Fleet directs work: how agents are organized, how capabilities compose, and how the infinite
> canvas becomes a command surface for both. This is the design authority for orchestration.
> Decisions it operationalizes: C1–C11 (delegation/integrity), E1–E5a (capabilities/canvas),
> S1–S5 (actions), G2/G5/G6 (order/coverage/frontend). Sections marked **[decided]** bind now;
> **[at activation]** binds when the owning release activates; **[evidence-gated]** waits for a
> named gate.

## 0. The one-sentence model

**Deterministic kernel, reasoning members, projected surfaces.** Code owns scheduling, budgets,
permissions, validation, and state truth; agents own judgment inside bounded contracts; every
surface (chat, Board, canvas) is a projection of the same authorities and commands them only
through governed actions.

## 1. Three planes of orchestration

| Plane | Question it answers | Owning authorities |
|---|---|---|
| **Execution** | Which agent/runtime does which task, under what budget and permission | Session tree, TaskRunner, TaskContract/TaskBrief/RunReport, runtime adapters |
| **Composition** | How capabilities and artifacts chain into larger work | Governed actions (R4), ArtifactRef (R5), finite workflow DAG (R8), capability registry (E1/E2) |
| **Command** | How the human sees and directs everything | Chat (primary today), Board, **canvas (primary spatial surface, R7)** |

The planes share one rule: **a surface never owns orchestration state.** A canvas card, Board
column, or chat bubble is a projection; commands route through the same governed action path
regardless of which surface issued them (S1).

## 2. The execution kernel **[decided]**

### 2.1 Objects

- **Task tree** — Craft Task/Session tree (`parentSessionId`); every run is a node. No second store.
- **TaskContract** — locked per attempt: criteria IDs, allowed/reserved paths, non-goals, budgets,
  contract version (C7). Read-only during the attempt; revision = new version.
- **Run attempt identity** — `taskId + contractVersion + attemptId + dispatchGeneration + sessionId`
  accompanies every command, heartbeat and result. Only the current generation may refresh liveness
  or land output; one Session accepts one in-flight input until its semantic turn is flushed.
- **TaskBrief / RunReport** — the only envelopes across a delegation boundary (C3). Briefs are
  bounded projections of the contract; reports return criterion outcomes + artifact/evidence refs,
  never transcripts.
- **Budgets that halt** — token/tool/edit/retry/delegation ceilings; crossing one pauses execution
  for a deliberate decision (C3). Team budget aggregates over the tree (opencode gap we fix: no
  per-member-only accounting).
- **Runtime adapter** — normalizes start/attach/send/cancel/approve/health/stop + usage/failure
  semantics per provider (Claude SDK, Pi SDK, external CLIs). Declared capabilities only — nothing
  invented from a name.

### 2.2 Run lifecycle (state machine)

```text
draft → briefed → running ⇄ waiting(approval|mailbox|budget-halt)
      → reporting → validated → accepted | failed | cancelled
```

- Transitions are kernel code, not agent conversation. `validated` means the RunReport passed
  structural + semantic checks against the contract version (S4); acceptance is a separate
  authority (C9).
- Cancellation/failure/contract-revision cascade down the tree; stale results cannot land (C11).
- Heartbeat and streaming output prove liveness, not acceptance progress. Only new evidence against
  a stable criterion advances the no-progress breaker; changing tool, model or hypothesis does not.
- After unclean shutdown, non-final runs become `reconciling` until the adapter proves real state —
  never silently re-run chargeable work (04 §3).

### 2.3 Organization router (C5) **[evidence-gated: needs R6 measurements]**

Inputs: task independence, shared-write overlap, verification risk, context size, runtime
capability, budget, deadline. Output: Direct → Delegated/parallel → Independent-verification →
Hierarchical — always the lightest structure expected to improve the outcome, with the choice and
reason recorded. Falls back to Direct when measured outcome-adjusted cost loses. The user can
always override.

### 2.4 Communication rules **[decided]**

Members talk to deliver artifacts, request missing authority/information, declare
dependencies/blockers — never open-ended mutual review (C11). Normal progress is event-derived
(`ProjectDigest` projection), pulled on demand, drill-down to source events.

### 2.5 Model-facing projection **[decided; implementation gated by E13]**

The execution kernel is intentionally richer than the context shown to any one model call. Before
dispatch, one centralized projection selects the stable prompt prefix, task-tail context, tool
schemas and Skill/Source references that are both needed and currently authorized. Provider lanes
may translate schema syntax, but cannot maintain independent loadout policy. A Pi-light path is a
profile through this projection, not another kernel.

Static task profiles come first. Tool Search is considered only after catalog measurements prove
that static profiles cannot keep schemas narrow without harming recovery. Search/describe is not an
executor; the eventual call returns through the same kernel permission, approval, usage and evidence
path. The governed Action seam remains separate: projection controls visibility before a request,
while the Action seam governs the request after it exists.

## 3. The composition plane **[decided as design; lands R4→R5→R8]**

Capabilities compose through three mechanisms, in increasing formality:

1. **Artifact flow** — the connective tissue (D4). One exact artifact version fans out to many
   consumers (owner vision OV-004: generated image → web asset / video first frame / document illustration / review evidence), each
   consumption recording purpose + provenance. No byte copying between surfaces.
2. **Governed actions** — every module registers its operations on the shared seam (R4); agents
   call modules the same way humans do (OV-005: agents can invoke every module capability). A module
   that only has buttons is incomplete; a module tool that bypasses evidence is incomplete.
3. **Workflow DAG** — a repeatable chain, promoted explicitly from real work (see §4.5), stored as
   an immutable versioned definition per run; steps invoke the same governed actions and runtimes
   (E5, 04 §3). Finite, typed, no general programming in v1.

Module registration contract (E1/E2): a native module (video, design, deck, web, image) registers
**capabilities** (actions + artifact types it produces/consumes) and **views**; it owns its native
document schema; it never owns sessions, permissions, tasks, or a second timeline. Loadouts scope
which capabilities an agent sees per task — attention is a budget too.

### 3.1 Work trajectory: one trace, many projections **[decided as design; fields freeze R4/R5]**

The trajectory of a piece of work is the join of the existing Session/SessionEvent log, governed
Action results, native Job records and ArtifactRef lineage. It is not a new `trace.json`, and a
Component, MCP server or renderer may not keep a private history that the host cannot query. The
trajectory records semantic boundaries rather than making raw model tokens or screenshots the only
explanation of what happened.

Each consequential operation contributes a correlation record with this target shape:

```text
traceId · sessionId · workspaceId · componentId?
turnId? · stepId? · operationId · attemptId · parentOperationId?
callerKind · actionType · exact input ArtifactRef versions
Job id? · exact output ArtifactRef versions · status
evidence/recovery refs · canvas projection ids?
sourceEventSeqs[] · derivedEventSeqs[]
```

DeepSeek Harness provides the source-level pattern Fleet admits: append-only events with explicit
turn/step boundaries, tool-call parent/child edges, opaque producer sources, and query functions that
trace one event's replacement/derived descendants or a Session's parent/child lineage. Fleet keeps
those facts in the existing authorities and derives a `WorkTrace` projection for chat, canvas,
workbench and inspection; the projection is disposable and never becomes a second authority.

The projection uses stable node keys plus an anchor event/sequence, so it can append a live tail,
prepend older pages or replace a stale window without changing the source log. It exposes the folded
state (`current`, `shadowed`, `log-only`, `partial` or `interrupted`) and a read-only inspector for
inputs, outputs, raw operation data, source/derived links, schema/options, usage, timing and diffs.
Progress updates update the projection node; they do not create a second progress authority. A
Component-specific node definition may add a useful view, but unknown future event kinds remain
opaque and visible rather than being dropped.

Recovery is explicit. If a cold load finds an open turn, the persistence owner may append legal
interruption closers for an unstarted or unknown tool outcome and then close the step/turn; a live
open turn is not silently repaired. The original call and any replaced result remain addressable
through `sourceEventSeqs`, so the trace can distinguish a current output, a shadowed historical
output and an interrupted/unknown output.

The operation graph uses only a small set of immutable relationships:

| Relationship | Meaning | Mutable? |
|---|---|---|
| `input` | this operation consumed this exact ArtifactRef version | immutable fact |
| `derived-from` | an output was produced from exact input versions | immutable fact |
| `projects-to` | a native artifact/job/operation is shown by a canvas/workbench node | projection only |
| `retry-of` | same semantic operation and base, another attempt | immutable fact |
| `branch-of` | a revision starts from an earlier operation or version with changed intent/inputs | immutable fact |
| `recovery-of` | a recovery or reconciliation action addresses a failed/unknown attempt | immutable fact |

Canvas position, visual connectors and thumbnail similarity are never provenance. A Component emits
these records through the governed Action/Job/Artifact seams; it does not mint a second timeline.

#### Targeting and revision semantics

“Modify that step” is translated into an explicit target token: `operationId`, exact
`ArtifactRef(id, version)`, or a selected `canvasNodeId` resolved to one of those. A phrase such as
“this image” is accepted only when the current selection/context resolves to one exact version;
otherwise Fleet presents candidates or asks. Names, paths and thumbnails alone are not stable
identity.

The Agent-facing inspection path follows the same rule: a future `operation_trace`/`operation_read`
tool accepts an explicit target Session plus `operationId` or exact ArtifactRef and an expected
version/hash, authorizes Workspace scope first, and returns the bounded source/derived lineage. It
does not treat the current UI selection as authority, and it cannot inspect a different Workspace or
silently select “the latest” result.

Revision never edits an old result in place. The kernel creates a new branch/version from the chosen
base, records `branch-of` (or `retry-of` for an unchanged operation), preserves the old outputs, and
marks dependent descendants `stale`/`awaiting-recompute`. Recompute is an explicit action with its
own new Job and evidence, so the user can compare branches, keep the old result, or continue from
the new lineage head.

Replay also distinguishes **exact** (reuse a committed ArtifactRef without rerunning side effects)
from **re-execute** (rebuild the recorded operation manifest under current permission/runtime). The
latter needs a fresh attempt id, expected-base-version validation and confirmation when the model is
non-deterministic or chargeable.

#### Example: poster → vector text → clean background → composite

| Step | Actual record | Result the user can target later |
|---|---|---|
| 1. Generate poster | `operationId=o1`, Component `image`, Job `j1`, prompt/style inputs | `ArtifactRef poster@v1`, projected to canvas node `n1` |
| 2. Extract/layout text | `operationId=o2`, input `poster@v1`, OCR/style evidence, Component `design` | `ArtifactRef vector-text@v1`, node `n2`, `derived-from o1` |
| 3. Remove raster text | `operationId=o3`, input `poster@v1`, mask/negative prompt, Job `j2` | `ArtifactRef clean-background@v1`, node `n3`, `derived-from o1` |
| 4. Compose final | `operationId=o4`, inputs `clean-background@v1 + vector-text@v1` | `ArtifactRef poster-final@v1`, node `n4`, `derived-from o2,o3` |

If the user selects `o2` and asks for a different font, Fleet starts `o2b` from the same
`poster@v1`, leaves `vector-text@v1` and `poster-final@v1` intact, and marks only the dependent
composite stale. If the user selects `n1` and changes the image prompt, the new poster branch does
not silently replace the original; the system offers explicit recomputation of o2–o4 against the new
base. The chat, canvas and component panels all show the same ids and versions, so an Agent can
distinguish “change the text layout” from “regenerate the source image”.

## 4. Canvas orchestration **[design decided; lands R7, pages may mock earlier via G6]**

The canvas is Fleet's **spatial command surface**: the place where you *see* the whole work chain —
which agent leads what, what was produced, which exact output fed which later work — and *command*
it through explicit affordances. It is a projection + invocation surface, never a state owner (E5).

### 4.1 Node taxonomy (projections, each owned elsewhere)

| Card | Projects | Live content | Command affordances |
|---|---|---|---|
| **Agent/session card** | a Session | status, last exchange summary, cost, budget bar, permission prompts | open chat · send instruction · pause/cancel · delegate · adjust budget |
| **Task card** | a Task/contract | criteria met/unmet, owner, state | open · reassign · split (new brief) |
| **Artifact card** | an ArtifactRef exact version | preview/thumbnail, version, provenance count | open native surface · stage as input · promote version · export |
| **Evidence card** | a capture/quote/result | source, timestamp, session link | open source · attach to brief |
| **Job/placeholder card** | a running generation/export | progress, cost estimate | cancel · (on completion, becomes artifact card) |
| **Workflow node** | a step in a versioned DAG | step state, last run | run · open definition |
| **Group/region** | a spatial team scope | leader, member count, shared budget | brief the leader · pause region |

### 4.2 Edge taxonomy (E5's classes, made visual and behavioral)

| Edge | Meaning | Created by | Mutable? | Visual |
|---|---|---|---|---|
| spatial | "arranged together" | user drag | free | none (proximity/region) |
| reference | "I intend this as input/context" | user connects artifact→agent/task | user-editable | dashed |
| **input** | "this run actually consumed it" | kernel, at execution | immutable fact | solid |
| **derived-from** | provenance: output ← inputs | kernel, at production | immutable fact | solid, arrowed |
| leadership | parent→child delegation | kernel, from Session tree | follows tree | subtle tinted |
| workflow | executable step order | explicit promotion (§4.5) | versioned | bold, typed ports |

The non-negotiables hold: drawing/moving never executes anything; a visual connector is never
automatically an executable edge or a provenance fact; renderer state is never written by agents —
the canvas re-renders from authority events (03 §3).

### 4.3 Orchestration gestures (the interaction design)

1. **Stage inputs by connection or drop.** Dragging an artifact/evidence card onto an Agent card —
   or drawing a reference edge — *stages* it: it appears in that agent's composer/brief as a
   pending reference. Nothing runs until the human (or a governed action) sends it. Staging is
   visible and removable.
2. **Delegate from context.** "Delegate" on an Agent/task card opens a TaskBrief prefilled from
   spatial context: selected cards → KNOWN FACTS / staged references; region → default scope. The
   brief is still explicit; the canvas just eliminates re-typing context.
3. **Run affordances, not run-by-arrangement.** Cards carry explicit run/pause/cancel/approve
   controls that route through governed actions with normal permission prompts rendered in place.
4. **Placeholder → job → result.** Launching generation/export drops a placeholder card immediately
   (with cost estimate when known); the kernel resolves it to an artifact card on completion, or a
   visible failed state — never a vanishing job (E8: saturation queues visibly).
5. **Leadership is visible.** The Session tree renders as leadership edges from leader to members;
   each member card shows its budget bar; a region's shared budget aggregates. Budget halts render
   on the card, where you can continue/narrow/absorb (C3).
6. **Promote a chain to a workflow.** Select a connected chain of reference/input edges →
   “Promote to workflow” → Fleet derives a typed DAG draft (steps = the governed actions that actually ran,
   ports = artifact types), the user reviews, and it becomes a versioned workflow definition. This
   is the path from *did it once* to *repeatable* — history is never rewritten to pretend it was a
   workflow all along.
7. **Broken sources stay visible.** A missing artifact renders a broken-reference card; it never
   cascade-deletes downstream cards or history (04 §3).

### 4.4 What the canvas must never become **[decided]**

Not the database of anything; not a universal editor (native modules open their own surfaces); not
a workflow runner (the kernel runs workflows; canvas projects them); not a second permission UI
(prompts are the same components chat uses).

### 4.5 Canvas technology **[DOM family committed; in-family choice at the E5a spike]**

Per Decision E5a: the **DOM-family rendering approach is committed** — Fleet cards are live React
components (session summaries, media previews, controls), and every shipping product with a
Fleet-shaped workload is DOM-family: TapNow, MiniMax Hub/Hilo, TRAEWork on **React Flow v12**
(owner-provided analyses), and Mayi Canvas on **fully custom DOM + `translate3d` + SVG bezier**
([`references/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md`](references/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md):
rich media/agent/3D nodes, >50-node perf mode, thumbnail/visibility workers, object pools — proof
that the family carries Fleet's workload even without a library). **React Flow is the default first
implementation; custom DOM+SVG is the named in-family fallback** if the spike shows the library
fighting Fleet's card/edge model; GPU (Pixi/CanvasKit) may only ever be a *media layer* under the
DOM viewport. The E5a spike (runnable any time from R5; required before deep R7 investment) decides
within the family by named criteria: representative rich cards, concurrent agent updates, media
proxies, ≥500-node viewport culling, memory recovery in the real Electron app. Implementation
constraints either way: custom edge overlay for the §4.2 classes; visible-node virtualization +
thumbnail workers + object pools; iframe/webview previews stay out of the graph layer; resource
budgets per E8. tldraw remains behavior comparison only (license = owner checkpoint). The domain
model stays renderer-independent regardless (§4.1–4.2 are defined over authorities, not renderer
types).

### 4.6 Interaction modes: Space vs Workflow **[decided — adopted from external review 2026-07-17]**

The six edge classes coexist in the data model, but their *creation interactions* are mutually
exclusive, so the canvas has two explicit edit modes (industrial precedent: Coze/FlowGram):

- **Space mode (default):** free arrangement. Drawing a connection creates only a `reference`
  (dashed intent) edge; ports are not typed; nothing validates or executes. Staging (§4.3 gesture
  1) lives here.
- **Workflow mode:** typed In/Out ports become visible; drawing a connection compiles a candidate
  `workflow` edge with port-type checking and cycle detection (Kahn) at draw time in the frontend
  **and again at definition submit in the kernel** — dual validation, never frontend-only.
  Promotion (§4.3 gesture 6) drops the user into this mode with the derived draft.
- Kernel-owned edges (`input`, `derived-from`, `leadership`) are never drawable in either mode —
  they render as facts.
- The mode toggle changes **edge interaction semantics only**; it never hides or rewrites existing
  edges, and switching modes is not an action on the graph.

**Spatial context boundary (Stitch-pattern, constrained):** proximity/region may *suggest* staging
candidates when prefilling a brief (§4.3 gesture 2 may list "cards in this region"), but every
suggested item is shown, individually removable, and inert until explicitly sent. Physical
proximity **never** silently enters a prompt or records an `input` fact — auto-assembled ambient
context would violate E5 and the staging contract, and is rejected as a design direction.

## 5. Command-plane parity **[decided]**

Chat, Board, and canvas are peers over the same kernel: anything the canvas can command, chat can
command in words and Board can reflect in status — and vice versa. New orchestration capability
lands kernel-first (governed action), then surfaces render it. This is why the canvas can arrive at
R7 without being a prerequisite for orchestration itself (R6 delegation works from chat/Board
alone).

## 6. What is decided vs. what awaits evidence

| Item | State |
|---|---|
| Deterministic kernel / reasoning members split; envelopes; budgets-that-halt; communication rules | **decided** (C3/C5–C11) |
| One model-facing effective projection; Pi-light is a profile; projection remains separate from Action seam | **decided** (E13); implementation waits for R0 + TE1 baseline and a bounded slice |
| Run lifecycle state machine | **decided** as design; mechanized in R6 |
| Node/edge taxonomy; gesture set; never-execute-by-arrangement | **decided** as design; lands R7 (pages may mock earlier, G6) |
| Canvas rendering | **DOM family decided** (E5a); React Flow default vs custom DOM+SVG fallback chosen at the spike (runnable from R5); GPU only as media layer |
| Space/Workflow dual edit modes; dual Kahn validation | **decided** (§4.6); lands with R7/R8 |
| Organization router thresholds | **evidence-gated**: needs R6 direct-vs-delegated measurements |
| Workflow DAG schema | **at activation** (R8), derived from promoted real chains (D6 logic) |
| Memory/consolidation hooks (layered agent memory, D5) | **at activation** (R9) |

## 7. References consumed (how this design was grounded)

Kernel envelopes and lifecycle: `software/opencode` task lifecycle (parentID/resume/depth/deny
inheritance — candidate mechanisms pending admission-v2, with proposed gaps to verify including no criteria IDs, no reserved
paths, no team budget), `software/codex` agent-graph/mailbox patterns, `software/grok-build`
queue/handoff, `software/DeepSeek-Reasonix` plan/execute split. Canvas: `plugins/xyflow` (default
in-family implementation, admission completes at the spike), Mayi Canvas product reverse-analysis
([`references/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md`](references/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md)
— custom DOM+SVG proof, perf-mode/worker/object-pool constraints, and the local-HTTP agent bridge
with self-describing capabilities + whitelisted/batch actions that independently validates this
document's governed-action and C2 narrow-bridge design), TapNow/MiniMax/TRAEWork public-bundle
evidence (via
[`design-library/07-canvas-spatial-orchestration-VISION.md`](design-library/07-canvas-spatial-orchestration-VISION.md)),
`software/tldraw` (comparison only). Module/plugin composition: MiniMax Hub six-plugin stack
([`references/plugins/00-MINIMAX-HUB-PLUGIN-STACK.md`](references/plugins/00-MINIMAX-HUB-PLUGIN-STACK.md)
— iframe sandbox + postMessage RPC + self-describing SDK + placeholder→job→result + permanent-ID
transactional insert: the blueprint evidence for §3's module registration and E1/E2). Dual-mode
canvas and dual Kahn validation adopted from the owner-collected external review (2026-07-17).
Full admission states: [`references/REFERENCE-REGISTRY.md`](references/REFERENCE-REGISTRY.md).
