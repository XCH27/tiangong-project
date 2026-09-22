# Canvas — retained source evidence and workload gate

This note retains unique comparison evidence from the 2026-07-11 study. It does not define a
second product, renderer decision or development order. [PRODUCT](../PRODUCT.md) owns the board: a
person and Agent generate, edit and arrange images, video, websites and decks in the same surface.
Native document/sequence owners keep their models and operations; hosting their editors inside the
canvas does not duplicate those owners. “Projection” describes state ownership, not a read-only UI.

[SYS-05](../modules/suites/SYS-05-design-spatial.md) owns delivery,
[Orchestration](../13-ORCHESTRATION.md) owns relationship/action boundaries and Decision E5a owns
the DOM family. R7 begins after the baseline and its actual prerequisites, not after a mandatory
TeamRun or read-only agent graph. Canvasight is task-graph/conflict evidence; Cowart supplies
bounded production-board interaction evidence. Neither supplies Fleet's product authority.

The observations below are dated source/product evidence, not newly verified upstream facts.
Current checkout names, revisions and licenses live only in the
[reference registry](../references/REFERENCE-REGISTRY.md); no old directory inventory is retained here.

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
and recorded with the benchmark. Use E5a's DOM-family decision: compare React Flow with the named custom DOM/SVG fallback.
A licensed tldraw study may supply interaction evidence; it is not an automatic renderer fallback.
GPU media acceleration requires a reproduced gap and does not replace the host family.

---
