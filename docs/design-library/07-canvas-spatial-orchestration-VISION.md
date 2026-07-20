# Canvas — Artifact Graph and Spatial Orchestration (Vision & Architecture)

> **Status:** owner-directed vision and durable architecture boundary, amended 2026-07-11 after
> reviewing public products, owner-provided reverse-engineering reports, and local reference clones.
> **Not an implementation spec.** Canvas is one node in the final capability graph. Concrete persisted
> schemas, RPC names, renderer internals, and numeric resource budgets are
> defined only when a real producer, consumer, and Electron benchmark exist.

---

## 1. The product idea

Fleet's canvas is the spatial view of a complete human-and-Agent work chain. It answers, in one place:

- which Agent is responsible for which part of the work;
- what each Agent or tool produced;
- which exact artifact version was later used as a reference or input;
- what was merely arranged together, what actually happened, and what is configured to run again;
- where work is running, waiting for approval, blocked, or complete.

The important unit is therefore not the visual node. It is the **project entity or artifact being
projected**. A generated image may become a website Agent's visual reference, a video Agent's first
frame, a deck illustration, and evidence in a review. The image is one versioned artifact with several
uses, not several canvas-owned copies.

The canvas is neither a universal editor nor the database of everything. It is a **projection,
composition, and governed invocation surface** over authorities that already exist elsewhere.

---

## 2. What industry evidence actually says

There is no single “best infinite-canvas library.” Leading products separate the document/domain model,
rendering, rich interaction, media handling, collaboration, and execution.

| Product/reference | Verified or high-confidence pattern | What Fleet should learn | What it does not prove |
|---|---|---|---|
| **Figma** | Custom C++ core, Wasm, GPU renderer; WebGL evolving to WebGPU; application UI remains a separate layer | Renderer abstraction, GPU escalation, keep domain model independent of React DOM | That Fleet should build a custom GPU engine now |
| **Lovart** | Public bundle contains tldraw data-format migration and Cloudflare Durable Object sync flags; product is a free-spatial AI design desk | Mature spatial editing can use a renderer/editor store as a derived projection; whole-canvas context is valuable to Agents | That many original-resolution 4K videos can play simultaneously |
| **TapNow** | Public bundle contains React Flow classes/logic, visible-element rendering, thumbnail policies, Fabric.js, WebAV, and other specialized media modules | React Flow can ship a serious AI image/video workflow when media editing and processing are separated | That arbitrary rich Agent cards or unlimited 4K playback have no DOM ceiling |
| **Higgsfield Canvas** | Officially a node-based, multi-model collaborative graph; public app resources expose a dedicated canvas-worker, flow API, and WebSocket connection | Execution/collaboration is a service boundary, not a direct mutation of UI state | Its exact frontend renderer; public evidence is insufficient |
| **TRAEWork** (owner-provided reverse analysis) | Separate iframe/WebView website preview from a React Flow design canvas | Do not flatten live website editing and spatial orchestration into one renderer | The analyzed private bundle is not stored in this repository; do not conflate this product with TRAE IDE |
| **MiniMax Hub / Hilo** (owner-provided reverse analysis) | React Flow v12 for dozens of rich media nodes; custom canvas edge overlay; Agent writes through a gateway; placeholder→job→result; file and asset/provenance layers | Governed Agent canvas actions, async placeholders, batching, dedupe, provenance, and specialized plugin surfaces | Fleet should copy its opencode runtime, gateway, SQLite, DAG, or stores |
| **FlowGram / Coze** | Workflow-focused editor with free/fixed layout plus form and variable engines; Coze uses it for workflow authoring | Useful comparison if Fleet later needs a dedicated workflow-authoring view | It should own Fleet's spatial canvas or duplicate Fleet's executor/policy/runtime |
| **Penpot** | MPL-2.0 source separates schema-backed design changes, client presence, server persistence, plugin capabilities and export/render processes | A native design surface benefits from inspectable change batches and hard process/API boundaries | Its design-document, revision, ACL, Redis, plugin registry or exporter topology should become Fleet's canvas/runtime authorities |

Primary public references:

- Figma rendering: <https://www.figma.com/blog/figma-rendering-powered-by-webgpu/>
- React Flow performance: <https://reactflow.dev/learn/advanced-use/performance>
- tldraw performance and license: <https://tldraw.dev/sdk-features/performance>,
  <https://tldraw.dev/community/license>
- Higgsfield Canvas: <https://higgsfield.ai/canvas-intro>
- Lovart ChatCanvas: <https://www.lovart.ai/features/infinite-chatcanvas-ai-collaboration>
- TapNow documentation: <https://docs.tapnow.ai/en/docs>
- FlowGram: <https://github.com/bytedance/flowgram.ai>
- Coze Studio: <https://github.com/coze-dev/coze-studio>

Public implementation fingerprints used in this review (hashed assets may move in future releases):

- Lovart tldraw migration/sync feature flags:
  <https://web-static3.lovart.ai/lovart_prd/static/_next/static/chunks/1w7pnttthe5q2.js>
- TapNow React Flow classes, visible-node policy, media nodes, and specialized vendor imports:
  <https://fe-assets.tapnow.media/50a0dff75e74f044513005771b3f20eef08722fb/assets/vendor-pkg-canvas-B0ddYf-J.js>

### Local cloned references

The repository's local clones provide code-level comparison, not application bases to merge:

- `源码参考/software/tldraw/`: signals/store, viewport culling, spatial queries, rendering-shape and
  performance managers. This disproves the claim that tldraw's store is automatically a second Fleet
  domain authority; the real question is what that store owns and how it is synchronized.
- `源码参考/software/penpot/` (MPL-2.0; reviewed at `bdc078d5ea0c`): a professional design system whose
  renderer is only one part. Its shared change builder emits ordered redo and reverse-order inverse
  changes; undo groups/transactions add selection and attribution metadata; tokens retain identity and
  references; component instances synchronize by touched attribute groups; plugins use declared
  capabilities and a hardened API; realtime presence is separate from persisted file changes; export
  runs behind a dedicated process boundary. Fleet should adapt those seams for a future native design
  surface, not copy Penpot's server revision/ACL/Redis authorities or treat its document model as the
  spatial canvas. Copying source files also carries MPL file-level obligations, so pattern study is the
  default.
- `源码参考/software/open-pencil/` (the only pencil checkout present; earlier drafts also named a
  nonexistent `openpencil/`): framework-independent document,
  history, viewport, and spatial-index engines above CanvasKit/Skia. This is the strongest local example
  of keeping the model independent from the UI framework and renderer.
- `源码参考/software/opencut-classic/` (the only opencut checkout present; earlier drafts also
  named a nonexistent `opencut/`): a specialized video-editing
  surface and media pipeline. It supports Fleet's “native engine per surface” rule: the canvas hands
  artifacts to a video editor; it does not become the video editor.
- `源码参考/software/craft-agents-oss/`: the only application base. Fleet reuses its session, permission,
  timeline, workspace, preview, browser, task, automation, and settings authorities.

---

## 3. The durable domain boundary: artifact graph first

The renderer must consume a projection of a renderer-independent artifact/entity graph. Do not define
the product as a React Flow node array, tldraw record store, or Pixi scene graph.

Conceptually:

```text
native authority
  ├─ session / Agent / TeamRun
  ├─ workspace file / native document
  ├─ job / invocation / evidence
  ├─ ArtifactRef + exact version
  └─ workflow definition
          │
          ▼
artifact/entity relationships
          │
          ▼
canvas projection + layout
          │
          ▼
renderer adapter
```

`ArtifactRef` remains deliberately unfrozen until a real producer and consumer prove its fields. The
canvas vision requires only these durable properties, not a speculative schema:

- stable identity and exact version;
- native content location/owner rather than duplicated bytes;
- kind and preview capability;
- provenance/source invocation where known;
- enough metadata to negotiate a suitable representation for the next consumer.

When a website Agent receives an image reference, the invocation records the exact image version and
purpose. Context assembly may choose the original file, a preview, a local path, extracted visual
features, or a temporary provider upload according to the target capability. The canvas does not embed
the bytes into its state.

---

## 4. Cards are projections, not new entities

| Card | Projects | Opens or invokes |
|---|---|---|
| **Agent card** | Real Craft session/Agent/TeamRun identity, task, latest summary, status, approval/blocking state | The authorized conversation or a governed Agent action |
| **Artifact card** | Exact image, video, audio, code, website, document, dataset, file, snapshot, or evidence version | Its native preview/editor or “use as reference/input” action |
| **Job/generation card** | Existing invocation/job state and committed outputs | Retry/cancel/reconcile through the owning job/action path |
| **File/evidence card** | Craft workspace file or BrowserPane evidence | Existing preview, browser evidence, or governed file action |
| **Capability-step card** | A typed step in an explicit workflow definition | Workflow editor/run only after the workflow authority exists |
| **Note/group/frame** | Canvas-local annotation and layout | Canvas layout/history only |
| **Placeholder** | A temporary projection of a real pending invocation | Resolves to committed output, failed/retryable state, or cancellation truth |

An Agent card may look like a compact chat box, but it is not another chat store. A video card may show
a poster or proxy player, but it is not the video document. A website card may show a snapshot or live
preview entry, but visual editing remains in the governed BrowserPane/website surface.

---

## 5. Relationship classes must not collapse into one edge type

The earlier “inert line versus promoted workflow” model was directionally safe but too coarse. Fleet
needs at least these semantic classes:

| Relation | Meaning | Authority | Execution effect |
|---|---|---|---|
| **spatial** | Cards are near, grouped, ordered, or framed together | Canvas layout | None |
| **reference** | A human/Agent intends an artifact to guide later work | Future project/artifact relation authority, introduced only with a real producer→consumer loop | None until explicitly attached to an invocation |
| **input** | A specific invocation actually consumed an exact artifact version | Invocation/evidence/provenance | Historical fact; does not rerun |
| **derived-from** | An output was produced from recorded inputs | Artifact provenance | Immutable historical fact |
| **leadership** | One Agent/team run coordinates another | Session/TeamRun authority | Whatever the owning orchestration path permits |
| **workflow** | A versioned typed output feeds a future step | Workflow definition | Executable only through the shared action/policy/executor path |

Visual treatment may share line primitives, but type, owner, mutability, and actions must remain clear.
Moving a card never changes provenance. Deleting a visual line never erases history. Attaching an image
to an Agent for one run does not silently create a permanent automation. A workflow edge is created by an
explicit workflow action, not by drawing an ordinary connector.

---

## 6. Agent and human control path

The strongest lesson from MiniMax Hub is correct: Agents must not manipulate frontend renderer state.
Fleet applies that lesson through Craft's existing authorities rather than copying Hub's gateway.

```text
human UI or authorized Agent tool
            │
            ▼
caller-aware action invocation
            │
     policy / permission
            │
            ▼
native executor or canvas-layout executor
            │
     owning state changes
            │
 timeline/event projection
            │
            ▼
canvas projection patch → renderer adapter
```

Expected canvas capabilities eventually include read/search, inspect selection, place/remove a
projection, group/arrange, create a reference, open/focus, and explain a chain. Their exact schemas wait
for the action spine and a real canvas slice. Consequential changes reuse permission and attributed
evidence; a harmless viewport focus is not inflated into a domain mutation.

For concurrent Agents:

- all layout mutations enter one versioned/idempotent mutation seam;
- domain changes go to the native authority first, then project onto the canvas;
- renderer patches are incremental and may be coalesced per animation frame;
- terminal states, errors, approvals, and permission requests are delivered promptly;
- high-frequency progress/log/token updates are sampled or summarized under backpressure;
- duplicate Agent retries do not create duplicate artifact cards;
- layout conflicts use revisions/preconditions and explicit recovery, not silent last-write-wins;
- the render thread never performs model execution, media transcoding, or heavy layout analysis.

A single global lock around one giant canvas JSON is an acceptable external reference pattern, not a
Fleet decision. It may become a bottleneck and would make layout the accidental authority for unrelated
facts. Canvas chooses the smallest concurrency mechanism that real callers require.

---

## 7. Async production loop

The first valuable writable loop is not “drag nodes.” It is:

```text
human/Agent requests work
  → governed invocation is accepted
  → placeholder projects the real pending invocation
  → job/session/tool performs work outside the renderer
  → success commits ArtifactRef(s), or failure/cancel truth is recorded
  → placeholder resolves/reconciles
  → outputs are placed/grouped once
  → viewport notification is batched, not repeatedly stolen
```

Adopt from the external products:

- honest pending placeholders;
- success/failure/retry/cancel states backed by the real invocation;
- idempotency and dedupe on replay;
- grouping multiple outputs from one turn/run;
- one batched “show new results” affordance instead of repeated forced focus;
- `sourceNodeIds`-style convenience only as a projection of real provenance, never its sole record.

Do not adopt:

- a second Agent runtime beside Craft;
- a second permission, session, job, timeline, or file system;
- a canvas-specific DAG executor before the shared workflow/action path exists;
- a generic plugin SDK before built-in capability loading and permissions are proven.

---

## 8. Media and 4K policy

“Supports 4K” must mean original fidelity is preserved and available where needed. It must not mean all
originals are decoded and rendered everywhere.

A 3840×2160 RGBA frame is about 31.6 MiB before decoder surfaces, queues, textures, and copies. Several
buffered frames across several videos can exhaust memory quickly. Therefore:

- **far zoom:** silhouette, type, status, dominant color, or tiny poster;
- **middle zoom:** thumbnail/poster and compact metadata;
- **near zoom:** richer preview, still constrained by visibility and activity budgets;
- **selected/focused:** interactive React card or dedicated native preview/editor;
- **original 4K:** dedicated viewer, edit, inspection, or export path—not every canvas card;
- images use size-appropriate previews/thumbnail levels;
- videos use poster frames and proxy streams; offscreen videos pause and release decoder/texture state;
- only a bounded number of videos may decode/play simultaneously;
- media byte ownership remains with workspace/native artifact storage; proxy/cache lifecycle is separate
  and recoverable;
- GPU/decoder memory, not just JavaScript heap, is observed in the real Electron test.

The exact thumbnail ladder, decoder count, cache size, and proxy resolutions are benchmark outputs, not
vision-document constants.

---

## 9. Renderer decision

### Durable decision

The projection/layout model and canvas actions are renderer-independent. A renderer adapter may own
ephemeral caches, measurements, selection handles, spatial indexes, and scene objects; those are not
domain authorities.

### Leading first spike: React Flow

React Flow is now the preferred first spike because:

- Agent cards, forms, menus, previews, and focused media remain normal React components;
- Craft is React 18 + Jotai, and the adapter need not replace Jotai or native authorities;
- TapNow, TRAEWork, and MiniMax Hub provide close workload evidence;
- it gives mature selection, handles, keyboard access, pan/zoom, and custom nodes quickly;
- custom edge/canvas overlays and strict visible-node policies provide incremental optimization options.

Its risks are equally explicit: rich DOM nodes, broad array subscriptions, continuous node movement, and
complex effects can become expensive. React Flow is not accepted because a blank 10,000-node demo pans;
it must pass Fleet's rich-card/media/concurrency workload.

### tldraw comparison spike

tldraw is the strongest comparison when free-spatial editing, grouping, drawing behavior, spatial
queries, culling, and LOD dominate. Its signals/store can be a derived renderer/editor store; that alone
does not violate the one-authority rule. Adoption still requires proof of:

- commercial/production license compatibility with Fleet's free/open direction;
- stable projection from Craft/Fleet authorities without dual-write drift;
- rich Agent/media card behavior and accessibility;
- acceptable memory and video behavior.

### GPU escalation

PixiJS may be introduced as a bulk scene/edge/media layer if DOM-node cost fails the benchmark while
rich selected cards still benefit from React overlays. CanvasKit/Skia or a custom WebGPU/Wasm engine is
reserved for a genuine professional native design surface or a proven ceiling that simpler layers cannot
meet. Penpot and OpenPencil show that this route requires its own document engine, text system, caches,
GPU lifecycle, fallback, and visual-regression program; it is not a casual canvas-library swap.

### Not the spatial host: FlowGram

FlowGram remains relevant to a later workflow-authoring spike if its fixed/free layout, forms, and
variable engine solve a demonstrated need. It is not the spatial host and must not introduce a second
runtime, variable authority, permission path, or job executor beside Fleet's shared spine.

---

## 10. Representative Electron decision gate

Before any production renderer dependency is promoted, build the same bounded spike with the leading
candidate and one comparison only. Use real card complexity, not placeholder rectangles.

Representative stress scene:

- 2,000 total projected cards with about 200 visible;
- 500 image artifacts with about 50 visible at mixed zoom levels;
- 20 video artifacts, several visible, and at most one focused original-quality playback;
- 50 Agent/job sources emitting concurrent status/progress events;
- 1,000 visible or nearby relationships;
- live selection, drag, pan, zoom, grouping, open-to-native-surface, and Agent-produced result insertion;
- a sustained run long enough to detect DOM, decoder, texture, and cache leaks;
- Apple Silicon plus at least one lower-end/Windows GPU path before broad release.

Acceptance is behavioral:

- interaction remains responsive under concurrent updates;
- work scales primarily with visible/active objects, not total graph size;
- offscreen media releases expensive resources;
- terminal/approval/error events are not lost under progress backpressure;
- memory returns toward a stable budget after moving away from heavy media;
- renderer or GPU failure has an honest fallback/recovery path;
- Agent insertion is idempotent and does not corrupt layout under concurrent writes.

Exact frame-time, latency, and memory thresholds are set by the canvas branch against supported hardware
and recorded with the benchmark. If React Flow passes, use it. If spatial behavior is the limiting factor,
compare tldraw. If DOM/media throughput is the limiting factor, add a bounded GPU layer. Do not maintain
three permanent renderers speculatively.

---

## 11. Staged product delivery

Canvas remains late because it projects capabilities that must exist first. When active, deliver in
complete slices:

1. **Read-only orchestration projection.** Real Agent/session/TeamRun cards, leadership, status, and
   drill-down to the existing conversation. Proves projection and update backpressure with no new domain
   authority.
2. **Artifact placement and cross-use.** Place exact file/artifact versions, create explicit references,
   and attach one artifact to a later Agent invocation. Proves the first producer→consumer handoff.
3. **Async production cards.** One real image flow first, then video: governed invocation, placeholder,
   output commit, provenance, failure/retry/cancel truth, grouping, and media proxy policy.
4. **Explicit workflow authoring.** Promote selected compatible steps into a finite versioned DAG;
   workflow execution reuses the shared action/policy/executor/evidence path.
5. **Performance escalation only when measured.** Add a GPU edge/media layer or a different renderer
   adapter only for a reproduced failing workload.

Each slice updates the existing current decision/design delta rather than creating a parallel module,
gateway, store, or planning corpus.

---

## 12. Hard boundaries

- The canvas is inside the retained Craft shell, never a replacement app or shell.
- It owns layout/annotation state only; sessions, jobs, files, bytes, artifacts, workflows, permissions,
  and evidence retain their native authorities.
- Agent and plugin calls never mutate renderer state directly.
- Layout, reference intent, execution inputs, provenance, leadership, and workflows are not one edge type.
- The canvas never silently executes because cards were connected or moved.
- Native website, design, video, deck, code, and document editors remain native surfaces.
- Original media fidelity is preserved, but canvas rendering uses bounded representations.
- No renderer, store, gateway, DAG, or plugin runtime is copied from a reference product without proving
  the missing Craft capability and the migration/authority boundary.
- Public-product claims, reverse-engineered reports, and local clones are evidence inputs, not current
  Fleet implementation facts.

The compatibility contract for every dependency node is therefore small: preserve stable
identity, native ownership, version/provenance, caller-aware actions, and attributable events. Those
properties make entities projectable into any competent renderer. Committing to a library before the
real workload exists does not.
