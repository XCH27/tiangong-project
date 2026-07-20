# Admission-v2 evidence audit (2026-07-17)

This is the current source-level audit for the routes that are most likely to constrain Fleet's
architecture. It is deliberately an **evidence ledger**, not a recommendation list. A checkout is
not promoted by this file: promotion still requires the seven-field admission record in
[`REFERENCE-REGISTRY.md`](REFERENCE-REGISTRY.md), a same-task comparison, and the deletion test.

## What was actually inspected

| ID | Capability / checkout | Fixed commit / license | Source mechanism found | Craft/Fleet comparison | Safe conclusion now |
|---|---|---|---|---|---|
| AV-VID-01 | `software/opencut-classic` | `cf5e79e91914` / MIT text at `LICENSE` | `apps/web/src/timeline/timeline-store.ts`, `timeline/update-pipeline.ts`, `commands/timeline/element/split-elements.ts`, `services/renderer/scene-exporter.ts`; `apps/web/src/timeline/__tests__/update-pipeline.test.ts` proves one update path | Fleet has no media sequence authority or NLE acceptance path; however no Fleet benchmark, cancellation chain, or export recovery comparison exists | `INSUFFICIENT_COMPARISON`; timeline mechanism candidate only, not a product or dependency decision |
| AV-VID-02 | `plugins/react-timeline-editor` | `4148f4a837dd` / MIT text at `LICENSE` | `packages/engine/src/core/engine.ts` (`TimelineEngine`), `packages/engine/src/interface/{action,effect}.ts`, React `timeline.tsx` and edit-area drag/cancel paths | Smaller generic timeline primitive than OpenCut; no media persistence, renderer/export, or Electron resource behavior shown | `INSUFFICIENT_COMPARISON`; comparison candidate only |
| AV-VID-03 | ChatCut product page (commercial, no source) | product observation only; no repository/license | The observed editor separates Agent/transcript, player, media, timeline and menu surfaces; transcript selections can target an exact time range and the timeline remains editable | This is useful UX behavior to test against Fleet's shared sequence/action/Job authority, but product UI cannot prove the implementation, export correctness, permissions or recovery | `PRODUCT_REFERENCE` candidate only; never a code/dependency reference |
| AV-CAN-01 | `plugins/xyflow` | `dd308ab401d4` / MIT text at `LICENSE` | `packages/react/src/container/NodeRenderer/index.tsx` uses `useVisibleNodeIds`; `components/NodeWrapper/index.tsx`; `additional-components/NodeToolbar/NodeToolbar.tsx`; Zustand store in `packages/react/src/store/index.ts` | Fleet needs live rich cards and projection-only state; no Electron workload, concurrent-update, or media-proxy benchmark has been run; tldraw is not cleared for production licensing | `INSUFFICIENT_COMPARISON`; renderer leading candidate only, not “default” |
| AV-CAN-02 | `software/tldraw` | `c26735e45258` / `LICENSE.md` has production restrictions | Local checkout exists, but the current audit did not establish a Fleet-compatible distribution and collaboration seam | No same-task benchmark or license counsel record | `EVIDENCE_ONLY`; never a dependency until the production license gate is explicitly passed |
| AV-CTX-01 | `plugins/headroom` | `eac49656a1cd` / Apache-2.0 plus `NOTICE` | Rust `headroom-core` contains tokenizer, relevance, compression policy, transforms, CCR and proxy response compression; tokenizer and live-zone tests exist | Fleet already has real usage tracking/compaction paths at `app/packages/shared/src/agent/core/usage-tracker.ts`; semantic-preservation and cost savings on Fleet traces are unmeasured | `INSUFFICIENT_COMPARISON`; isolate tokenizer/measurement experiments only; no transparent proxy adoption |
| AV-CTX-02 | `plugins/rtk`, `plugins/repomix`, `plugins/codegraph` | `5d32d0736f68`, `a5577d5718b1`, `3460accda828` / MIT or Apache-2.0 text verified | RTK parser `src/parser/{mod,formatter}.rs` has Full/Degraded/Passthrough tiers; Repomix `src/core/packager.ts`, `src/core/packager/produceOutput.ts`, `src/core/packager/writeOutputToDisk.ts`, `src/cli/cliTokenBudget.ts`; CodeGraph `src/extraction/{parse-pool,parse-worker,index}.ts` has worker recycle, abort/error and size limits | These are three different problems (output shaping, packaging, graph extraction), not a memory authority or a substitute for Fleet's usage ledger; no Fleet trace benchmark | `EVIDENCE_ONLY` until a narrow active spec defines one measurable seam |
| AV-HARNESS-01 | Craft Pi lane + `software/pi-mono` | Craft `@earendil-works/pi-*` 0.80.6; Pi `13437ca82889` / MIT | Pi `packages/coding-agent/src/core/{system-prompt,agent-session,resource-loader}.ts`, extension loader/runner and prompt/tool tests expose the same Earendil lineage embedded by Fleet | Fleet already uses Pi as a provider runtime but wraps it with its own prompt, near-full session tools, web tools and Sources; using Pi does not prove a minimal harness, and Pi's coding task payload is not Fleet's cross-domain KPI | `CRAFT_EXTEND` at TE1/R3: compare bounded profiles inside the existing backend; Pi remains `EVIDENCE_ONLY`, never a second kernel |
| AV-BRW-01 | Craft BrowserPane/Fleet browser path | Craft baseline / inherited | `app/apps/electron/src/main/browser-pane-manager.ts`, preload IPC, `app/packages/shared/src/agent/browser-tools.ts`, server `BrowserPaneManager` interfaces and tests | This is already the authority. External browser automation projects may only be optional executors and evidence producers | `CRAFT_REUSE/EXTEND`; do not replace with a browser framework |
| AV-SBX-01 | Fleet sandbox baseline | Fleet code, not a reference | `app/packages/session-tools-core/src/runtime/{filesystem-isolation,network-isolation,sandbox-env}.ts` and `handlers/script-sandbox.ts`, with tests | A real current permission/isolation path exists; the docs' “sandbox not implemented” wording is too broad if it means all isolation | `CRAFT_EXTEND` for current sandbox seams; OpenHands/Omnigent remain gated comparison evidence, not a route decision |
| AV-ORCH-01 | Craft `TaskRunner` + `software/opencode` | Fleet `app/packages/server-core/src/tasks/TaskRunner.ts`; OpenCode `c69abee0c732` / MIT | Fleet has restart/cancel/child-session state and tests; OpenCode has `BackgroundJob` (`packages/core/src/background-job.ts`), parent session schema and SessionTodo | Fleet's existing TaskRunner is the authority. OpenCode proves useful semantics but not a replacement; the old report's “TaskTool” claims are not retained without file-level proof | `CRAFT_EXTEND`; OpenCode `EVIDENCE_ONLY` until current symbols are mapped to R6 acceptance |
| AV-SBX-02 | `software/OpenHands` / `software/omnigent` | `613406ca2bca`, `42177d0e3940` / MIT and Apache-2.0 text | OpenHands `openhands/app_server/sandbox/sandbox_service.py`, `docker_sandbox_service.py`, `process_sandbox_service.py` and sandbox tests expose replaceable services/status/recovery; Omnigent `omnigent/inner/executor.py`, `bwrap_sandbox.py`, `seatbelt_sandbox.py`, `runtime/policies/engine.py` and cancellation events expose adapter/policy seams | Neither has been compared against Fleet's macOS/Electron permission model, resource limits, recovery and user-visible evidence | `GATED`; no sandbox dependency or “best” claim |
| AV-EDT-01 | Fleet TipTap and LobeHub candidate | Fleet actual files under `app/packages/ui/src/components/markdown/`; LobeHub source checkout absent | Fleet has `TiptapMarkdownEditor`, slash menu, image/block extensions and tests; no fixed LobeHub source was inspected in this worktree | A product-flow screenshot cannot prove a superior editor core. TipTap is the existing authority and must get a same-task extension test first | `CRAFT_EXTEND`; LobeHub `PRODUCT_REFERENCE` candidate only |

## Required evidence before a route can be promoted

For each non-Craft row above, the next record must include: a fixed checkout and license/NOTICE;
the exact caller and test; one Fleet trace with baseline measurements; one same-task alternative;
failure/cancel/restart behavior; a small local-improvement attempt; and an owner-visible decision
ID. A README, product demo, stale report or “primary reference” label does not satisfy any of
these requirements.

## Immediate corrections to the technology matrix

- “Leading candidate” means only “first renderer/adapter to benchmark”, never “selected”.
- “Proposed” means an implementation hypothesis; it is not permission to add a dependency.
- Existing Craft/Fleet paths are `REUSE/EXTEND` even when a later-in-sequence module is not implemented.
- For memory, Token and sandbox, the first implementation slice must measure the existing Fleet
  path before importing an external mechanism.

## Grok CLI audit record

On 2026-07-17, `./源码参考/scripts/compare_with_grok.sh run plugins/xyflow` completed with
schema `fleet-reference-admission-v2`. The validator accepted eight capability records, each with
source entry/caller/state/failure/test/Fleet-counterpart evidence. Grok's disposition was
`INSUFFICIENT_COMPARISON`, `formal_reference_allowed: false`, and
`market_position: NO_COMPARISON_EVIDENCE`. Required gates were the E5a Electron rich-card,
concurrent-update and media-proxy benchmark; a projection sample keeping Fleet authorities outside
the xyflow store; a same-task tldraw comparison under its license gate; and pinned dependency and
degrade-path evidence. This updates source-audit evidence only: it does not select React Flow or
promote xyflow.
