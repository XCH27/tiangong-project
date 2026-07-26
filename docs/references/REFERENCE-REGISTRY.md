# Reference registry — evidence status, not dependency approval

Audit date: 2026-07-20

The current file-level evidence ledger for the highest-risk routes is
[`ADMISSION-V2-AUDIT.md`](ADMISSION-V2-AUDIT.md). It records what was actually found in source;
the rows below remain pending until the comparison, local-improvement and deletion tests pass.

This is the canonical cross-check between the reference map, the local read-only checkouts and
the product matrix. A row in this file does **not** authorize importing code. Admission status is
independent from cache retention: most `REVIEWED-HEADS.tsv` entries still use the legacy two-column
format; rows still marked `pending` have no structured source review. `plugins/xyflow`
has now completed a structured Grok source review but remains `INSUFFICIENT_COMPARISON`, not an
admitted reference. The local commit and license facts below were checked directly against the
checkout; they are not claims that the mechanism has passed product comparison.

## Admission vocabulary

| Status | Meaning |
|---|---|
| `FORMAL_REFERENCE` | Multiple mechanisms are needed repeatedly and all admission gates passed. |
| `MODULE_REFERENCE` | Only a bounded subtree/protocol/symbol passed; never the product shell. |
| `LOCAL_IMPROVEMENT` | A small Fleet change can meet or exceed the candidate; put the change in an active spec. |
| `EVIDENCE_ONLY` | Product or mechanism evidence only; no standing dependency or code import. |
| `candidate` | Not yet admitted; fixed commit, exact symbols, comparison, license and deletion test are incomplete. |
| `REJECT` | No gap, weaker, conflicting authority, or unacceptable license/dependency. |

## Local checkout cross-check

Every retained checkout path and short SHA in this table was checked against its recorded source;
the Craft tag commits were also verified against the official upstream tags. `pending` means the
new admission-v2 source audit has not been recorded; even an exact SHA and a readable LICENSE is
not a formal reference.

| Checkout | Fixed HEAD | License text at checkout root | Admission-v2 |
|---|---|---|---|
| `plugins/dockview` | `0eef758ef3bc` | MIT (text verified) | `pending` |
| `plugins/markitdown` | `e144e0a2be95` | MIT (text verified) | `pending` |
| `plugins/react-resizable-panels` | `a1eeb7aefdb0` | MIT (text verified) | `pending` |
| `plugins/react-rnd` | `fec7303134ab` | MIT (text verified) | `pending` |
| `plugins/repomix` | `a5577d5718b1` | MIT (text verified) | `pending` |
| `plugins/xyflow` | `dd308ab401d4` | MIT (text verified) | `source-reviewed / INSUFFICIENT_COMPARISON` |
| `plugins/agentskills` | `38a2ff82958a` | Apache-2.0 code; CC-BY-4.0 docs | `source-reviewed / MODULE_REFERENCE candidate` |
| `plugins/hyperframes` | `6ad738b580ad` | Apache-2.0 | `source-reviewed / MODULE_REFERENCE candidate` |
| `plugins/mem0` | `ddaa655edf41` | Apache-2.0 | `source-reviewed / EVIDENCE_ONLY` |
| `plugins/playwright-mcp` | `55679f5f3d4b` | Apache-2.0 | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/OpenHands` | `613406ca2bca` | MIT (text verified) | `pending` |
| `software/codex` | `38b064c31b1f` | Apache-2.0 | `pending` |
| `software/craft-agents-oss-v0.10.5` | `c9d9a26fbefa` | Apache-2.0 | `product/interaction baseline` |
| `software/craft-agents-oss` | `4289b1609732` | Apache-2.0 | `selective-update reference (v0.11.1)` |
| `software/hermes-agent` | `2ea39daeb1f6` | MIT (text verified) | `pending` |
| `software/openclaw` | `9f5609382b54` | MIT (text verified) | `pending` |
| `software/opencode` | `c69abee0c732` | MIT (text verified) | `pending` |
| `software/opencut-classic` | `cf5e79e91914` | MIT (text verified) | `pending` |
| `software/penpot` | `bdc078d5ea0c` | MPL-2.0 | `pending` |
| `software/pi-mono` | `13437ca82889` | MIT (text verified) | `source-reviewed / EVIDENCE_ONLY` |
| `software/tldraw` | `c26735e45258` | tldraw License (production restrictions) | `pending` |
| `software/browser-use` | `950eb03617e6` | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/flowgram.ai` | `5afd287a989a` | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/mcp-registry` | `29e32c39dcb5` | mixed Apache-2.0/MIT transition; docs CC-BY-4.0 | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/opencut` | `5e0696bc9b92` | MIT (text verified) | `source-reviewed / EVIDENCE_ONLY` |

The two Craft snapshots have different roles: v0.10.5 decides R1 product/interaction behavior;
v0.11.1 is inspected only for independent fixes and bounded backend mechanisms. Neither is merged
wholesale. The earlier Aion, Omnigent, Multica, Golutra, Orca, DeepSeek-Reasonix, Grok Build, Open
Pencil, Vibeframe, Headroom, CodeGraph, RTK, Ponytail, Open Design and react-timeline-editor
checkouts were removed from standing retention on 2026-07-20. Their fixed-head findings remain
historical `EVIDENCE_ONLY` in `ADMISSION-V2-AUDIT.md`; no active design may start from them without
a new top-tier gate and temporary source intake.

## Top-tier source intake: exact mechanisms

| Checkout | Exact inspected evidence | Fleet verdict |
|---|---|---|
| `software/flowgram.ai` | `packages/client/editor`, `packages/canvas-engine/document`, `packages/common/command`, `packages/plugins/*`, `packages/runtime/interface` | workflow/canvas editor seam only; TaskRunner remains execution authority |
| `software/opencut` | `README.md`, `apps/web`, `apps/desktop`, `apps/api` | current rewrite has a real TS/Rust shell but Editor API, plugin-first, MCP and headless items are still roadmap claims; use classic for implemented timeline evidence |
| `plugins/hyperframes` | `packages/core`, `packages/engine/src/services`, `packages/studio-server/src/routes/render.ts`, cancellation/failure tests | primary programmatic-video renderer evidence; absorb deterministic composition and Job adapter behavior, not its Studio or cloud control plane |
| `plugins/mem0` | `mem0/memory/main.py`, `mem0/client/main.py`, tests/evaluation | explicit add/search/update/delete and evaluation mechanisms only; no Fleet service dependency |
| `plugins/agentskills` | `docs/specification.mdx`, `docs/client-implementation/adding-skills-support.mdx`, `docs/skill-creation/best-practices.mdx` | primary Skill format/progressive-disclosure evidence; Fleet adds trust, grants and receipts |
| `software/mcp-registry` | `pkg/api/v0/types.go`, `internal/service/registry_service.go`, `internal/validators`, publication/auth/version tests | primary MCP catalog/publication evidence; registry metadata is never install trust |
| `software/browser-use` | `browser_use/browser/session.py`, `browser_use/dom/enhanced_snapshot.py`, `browser_use/dom/views.py` | BrowserPane executor/recovery evidence only |
| `plugins/playwright-mcp` | `src`, accessibility-snapshot/action tools and tests | deterministic structured action seam; screenshots remain evidence, not selectors |

## Video candidate reality check

The owner's recovered list is valuable and remains intact in
[`video/00-CANDIDATE-INVENTORY.md`](video/00-CANDIDATE-INVENTORY.md). `opencut-classic`, current
`opencut` and `hyperframes` now exist as local video checkouts. The other names are **uncloned candidates**: no
commit, source path, license or implementation evidence has been established locally. Their rows
must not be used as “primary reference” claims until a temporary checkout passes the playbook.

| Candidate family | Local evidence | Current safe use |
|---|---|---|
| OpenCut | `software/opencut` @ `5e0696bc9b92`, MIT | architecture direction only; current editor mechanisms are incomplete |
| opencut-classic | `software/opencut-classic` @ `cf5e79e91914`, MIT text present | `MODULE_REFERENCE` candidate for timeline mechanisms; archived status and exact symbols still require admission-v2 |
| React Video Editor, Cutia, OpenReel Video | no checkout | candidate only |
| Shotcut, LosslessCut | no checkout | product/mechanism candidate only |
| Remotion | no checkout | source-available/license-gated product evidence only |
| HyperFrames | `plugins/hyperframes` @ `6ad738b580ad`, Apache-2.0 | `MODULE_REFERENCE` candidate for deterministic programmatic rendering and cancellation |
| Palmier Pro, waooowaoo, Toonflow, Storyboard | no checkout | product behavior candidate only |
| OpenMontage, video-use | no checkout | Agent-operation candidate only |
| claude-real-video, AutoClip, BibiGPT-v1, BiliNote | no checkout | analysis/highlight/knowledge candidate only |
| pyvideotrans, baocut | no checkout | caption/translation candidate only |
| ChatCut | commercial product, no source checkout | `PRODUCT_REFERENCE` only; never a code reference |

### Locally inspectable video mechanisms (not yet admitted)

The following paths are evidence targets, not a completed approval. They are recorded so the
matching R10–R13 review can be reproducible instead of relying on project names:

| Checkout | Exact evidence targets at the pinned HEAD | What remains unproved |
|---|---|---|
| `software/opencut-classic` @ `cf5e79e91914` | `apps/web/src/timeline/timeline-store.ts`, `apps/web/src/timeline/types.ts`, `apps/web/src/timeline/update-pipeline.ts`, `apps/web/src/commands/timeline/element/split-elements.ts`, `apps/web/src/commands/timeline/track/add-track.ts`, `apps/web/src/services/storage/service.ts`, `apps/web/src/services/renderer/scene-exporter.ts` | caller/error/recovery chain, Fleet gap and same-task comparison, and whether the archived architecture can be isolated without importing its project authority |
| `plugins/xyflow` @ `dd308ab401d4` | `packages/react/src/store/index.ts`, `packages/react/src/hooks/useVisibleNodeIds.ts`, `packages/react/src/components/NodeWrapper/index.tsx`, `packages/react/src/additional-components/NodeToolbar/NodeToolbar.tsx` | rich-card Electron benchmark, business-state seam, and admission-v2 review |

## Named external evidence without a local checkout

These names appear in the product matrix or capability notes but are not present under
`源码参考/software` or `源码参考/plugins`. They can support a product-behavior comparison only;
they have no immutable local source evidence and must not be described as admitted source
references.

| Name | Safe status | Missing before any promotion |
|---|---|---|
| LobeHub product | `PRODUCT_REFERENCE` candidate | dated product-flow capture, same-task comparison, and a clear TipTap local-improvement test |
| `lobehub/lobe-editor` | `MODULE_REFERENCE` candidate | fixed checkout, license/NOTICE, exact editor symbols and TipTap comparison |
| FlowGram | `software/flowgram.ai` source-reviewed candidate | editor/executor boundary is inspectable; same-task Electron comparison still required |
| MiniMax Hub / Hilo / TRAEWork analyses | `EVIDENCE_ONLY` | primary source or reproducible capture; public-bundle observations cannot prove source mechanisms |
| ChatCut | `PRODUCT_REFERENCE` candidate | reproducible product capture and explicit separation of observed behavior from vendor claims |
| Remotion | candidate; license gate | fixed checkout and current license terms for target distribution |
| Unabyss | `PRODUCT_REFERENCE` only | product behavior can inform source/structure/grant/freshness decomposition; no public source, no MCP-first internal architecture, and no hosted dependency admission |

## Required promotion record

Before any candidate is promoted in the product matrix or a module packet, add a row to the
admission record with all of the following:

1. repository URL, immutable commit and checkout path;
2. exact license/NOTICE and whether the target distribution is permitted;
3. exact files, symbols, caller and tests that prove the mechanism;
4. Fleet/Craft gap and at least one same-task alternative;
5. the mechanism-to-seam mapping and why a small local change cannot already surpass it;
6. failure, cancellation, recovery and deletion implications;
7. a dated Grok admission-v2 result and an owner-visible decision ID.

Until all seven are present, use `candidate`, `INSUFFICIENT_COMPARISON` or `EVIDENCE_ONLY` as
appropriate. A row in `CAPABILITY-REFERENCE-MAP.md` or `11-PRODUCT-MATRIX.md` is a pointer, not
evidence.

## Owner-provided product reverse-analysis reports (EVIDENCE_ONLY)

These are analysis documents, not local checkouts: no commit, no license to import, no code
copying. They ground product/mechanism decisions only.

| Report | Subject | Status | Grounds consumed by |
|---|---|---|---|
| [`canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md`](canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md) | Mayi Canvas v3.4.4 — custom DOM+translate3d+SVG infinite canvas; node/port/connection system; performance mode, workers, object pools; local HTTP agent bridge with self-describing capabilities, allowlisted/batch actions, and token; provider proxy layer; project ZIP format | `EVIDENCE_ONLY` | Decision E5a (DOM-family + in-family fallback), `13-ORCHESTRATION.md` §§4.5/7, matrix canvas/AIGC rows |
| [`plugins/00-MINIMAX-HUB-PLUGIN-STACK.md`](plugins/00-MINIMAX-HUB-PLUGIN-STACK.md) | MiniMax Hub 1.1.1 six official plugins — iframe sandbox, postMessage protocol-v2, `window.hub` SDK, BlobRef upload, placeholder→dag→insert with permanent IDs, three implementation patterns, host requirements | `EVIDENCE_ONLY` | `13-ORCHESTRATION.md` §§3/7 module registration, matrix plugins/extensions rows, R15 SYS-08 packet |
