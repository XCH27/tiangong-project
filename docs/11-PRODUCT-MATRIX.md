# 11 — Product Matrix (full coverage index)

> **Every product domain, always.** The module registry is the anti-omission breadth authority;
> this matrix maps those capabilities to product behavior, authorities and acceptance. No domain is
> ever deleted from design because of integration ordering (Decision G5). Durable module depth lives
> in `modules/`; an implementation slice gets a full spec in `specs/` when it becomes ACTIVE, and its pages live in
> [`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md). Rows must stay honest: update a row in the
> same slice that changes its facts.
>
> Reference admission grades come from the **single admission authority**
> [`references/REFERENCE-REGISTRY.md`](references/REFERENCE-REGISTRY.md)
> (`FORMAL_REFERENCE | MODULE_REFERENCE | LOCAL_IMPROVEMENT | EVIDENCE_ONLY | REJECT`; unaudited =
> *candidate*). A named project is never license to copy its shell (Decision F3). Unfinished
> admission work is tracked in [`references/REFERENCE-GAPS.md`](references/REFERENCE-GAPS.md).

## How to read a row

| Column | Meaning |
|---|---|
| Status | capability vocabulary for the domain's *core loop* today |
| Gap | the biggest missing piece between today and the vision |
| Reference to audit | first external source to inspect, with admission state; this is not a selected dependency |
| Backend authority | the one Craft/Fleet authority that owns the state (never duplicated) |
| Acceptance anchor | where its criteria live or will live |

## A. Work core

| Domain | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|
| Sessions & chat | session lifecycle, streaming, queueing, steering, timeline | `usable` (Craft) | attributed cross-caller evidence (R4); task-first presentation (P10, R1) | Craft v0.11.1 (pinned) | SessionManager + SessionEvents | [`specs/R4-action-seam.md`](specs/R4-action-seam.md) |
| Project / Workspace | one Project=folder boundary, config, roots, remote routing | `usable` for Craft Workspace; Fleet P6 presentation is `wired but not visually checked` in the R0 tree | P6 folder collapse + single switcher + task-first entry (R1); legacy-data slice | Craft | Workspace stores | [`specs/R1-one-boundary-language.md`](specs/R1-one-boundary-language.md) |
| Tasks & Board | tasks, statuses, labels, Board, scheduler | `usable` (Craft + Board deltas) | TaskContract projection + drift gates (R6) | Craft; `software/opencode` MODULE_REFERENCE-candidate (task lifecycle, session todo) | Task stores + TaskRunner | R6 |
| Permissions & safety | modes, PreToolUse gate, approvals, command validation | `usable` (Craft) | caller-aware policy identity across Ask (R4); explainable command rules (S3) | Craft; `software/codex` EVIDENCE_ONLY (rule shape) | mode-manager + PreToolUse + SessionManager | R4 spec |
| Terminal & local execution | Bash + background shell, output/cancel/restart truth | `usable` (Craft baseline) | Fleet-wide target contract; interactive PTY = CONDITIONAL (real caller gate) | Craft | Bash/background path in SessionManager | R18 implement-or-`NO_GAP` closure |
| Settings | one settings home: AI, appearance, permissions, labels, server, messaging… | `usable` (Craft; zh-Hans work in R0 tree) | honest service classes per P8 | Craft | settings stores | [`specs/R2-independence.md`](specs/R2-independence.md) |
| Search & views | search, dynamic views, filters | `usable` (Craft) | views stay projections as new surfaces land | Craft | search/views modules | — |
| Automations | schedules, automation handlers | `usable` (Craft) | route through governed actions once R4 exists | Craft | automations + scheduler | R4 follow-up |
| Onboarding | first-run, workspace creation, provider setup | `usable` (Craft) | plain-language pass; no Craft-service implication (P8) | Craft | Electron onboarding flow | R2 spec |

## B. Files, artifacts and evidence

| Domain | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|
| Workspace files | file tools, containment, permissioned mutation | `usable` (Craft) | version/precondition conflict rules; **no file history/recovery authority exists today** (verified 2026-07-17) — recovery is honest-`none` unless workspace has VCS. R5 proposed defaults (adopted from 2026-07-17 review): FileLease TTL 60s, silent renew every 20s, auto-release on crash; atomic write via `.tmp_` + `fs.rename`; pre-mutation SHA-256 + content snapshot with a bounded undo window whose restore first re-verifies the current hash (S5-honest) | Craft | Workspace filesystem + file tools | R5 |
| ArtifactRef & Library | exact versions, provenance, cross-surface handoff, Library view | `not implemented` | first producer→consumer pair; minimal envelope seed (D6, adopted from review): `{ id, version, kind, nativeOwner, workspaceId }` — no speculative fields (no `consumers[]`) | `plugins/markitdown` MODULE_REFERENCE-candidate (ingestion only) | none yet — smallest new authority at R5 | R5 |
| Browser & evidence | BrowserPane, capture, annotate, governed CDP | `usable` (Craft BrowserPane) | evidence-capture policy surface (E6); artifact links | Craft; external browser MCPs = optional executors only (REJECT as replacement) | BrowserPane + browser_tool | R3 exercises it |
| Document ingestion | PDF/Office/… → usable input | `usable` (Sources/previews) | conversion provenance | `plugins/markitdown` | Sources + preview paths | — |

## C. Orchestration and runtimes

| Domain | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|
| Multi-agent delegation | TaskBrief/RunReport, child sessions, budgets-that-halt, mailbox/wait | `not implemented` (Craft has child sessions + TaskRunner) | bounded protocol + report validation (C3/C11) | `software/opencode` (pending re-audit), `software/codex`, `software/grok-build` | Session/Task tree (no new store) | R6 |
| Runtime adapters | detect/auth/health/capability negotiation per runtime | `usable` for Claude+Pi; generic adapter `not implemented` | one adapter contract; honesty about unsupported features | first candidate `software/AionUi` (admission pending); comparison `software/codex` (admission pending) | backend seam + SessionManager | R6+ |
| Adaptive organization | direct/parallel/verify/hierarchy routing by measured cost | `not implemented` | needs R6+ accepted-outcome evidence (C5/C6) | `software/DeepSeek-Reasonix` (plan/execute split), Google scaling study | policy over Task/Session | R17 implement-or-`NO_GAP` closure |
| Worktree isolation | per-task checkout isolation, occupancy, cleanup | `not implemented` | lifecycle + occupancy rules (P9: location ≠ isolation) | first candidate `software/orca` (admission pending); comparison `software/grok-build` (admission pending) | Git/process integration | R6+ |
| Sandbox / OS isolation | current filesystem/network/env script isolation plus an R18 conditional replaceable OS/container executor | `wired but not visually checked` | full OS/container isolation, resource accounting and recovery require a real risk gap; current script sandbox is not a VM/container boundary | `software/OpenHands` primary comparison, `software/omnigent` secondary | `app/packages/session-tools-core/src/handlers/script-sandbox.ts` + existing permission path | R18 implement-or-`NO_GAP` closure |
| External computer/environment control | native Fleet actions; BrowserPane/CDP, filesystem/shell/API and remote Fleet structured adapters; accessibility/semantic then pixel fallback | Browser structured path `usable` in its current Craft scope; general Computer Use `not implemented` | CONDITIONAL: only when an approved real task cannot use a native/structured route; bind environment/display identity, live expiring grant and observation version; two adapters before a generic interface | Hermes accessibility/SOM and OpenClaw node/grant/frame mechanisms = `EVIDENCE_ONLY` | existing BrowserPane/runtime/permission paths; any fallback owns no Fleet state | R16 implement-or-`NO_GAP` closure |
| Remote / cloud execution | direct connect to user-owned Fleet instance; grants; standby | `not implemented` for the Fleet target model (Craft transport is `usable`) | P7 grant scoping + honest disconnect; no control plane | Craft transport; design note [`design-library/20-…`](design-library/20-workspace-project-session-remote-connections.md) (external product paths are reference-only) | server transport + Workspace routing | R14 |
| Git repository / branch / PR delivery | task-changes diff, apply/discard, PR — branches agent-managed, never a user surface (C4) | `not implemented` | C4 ladder: read-only diff (R3-era) → apply/discard with R6 worktrees → PR/remote with R14; Git operations remain governed delivery actions, never a Task/Session authority | Craft file/process seams; GitHub connector is an optional executor only | Git/process adapter + existing Task/Session/permission | EXEC-13-A |
| Prompt / policy profile / agent identity | scoped system prompt, model/profile identity inspection, centralized effective prompt/tool projection | `not implemented` (Claude/Pi full lanes exist) | E13: measure actual serialized requests; Pi-light is a profile, not a kernel; effective view = task need ∩ installed ∩ available ∩ policy ∩ live grant; loadout remains separate from Action seam | Craft/Pi baseline; OpenHands/Hermes/OpenClaw = mechanism evidence only | existing backend/prompt/tool assembly + permission authority; no second loadout | post-TE1 bounded slice + EXEC-14-A |

## D. Intelligence economics

| Domain | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|
| Context & token optimization | **layered token economy (E12/E13)**: effective projection + ArtifactRef/TaskBrief structural savings · L1 prefix/cache alignment · L2 deterministic input compression (rtk rewrite **shipped**) · L3 agent-directed compaction · L4 gated model-assisted trim · L5 output profiles · L6 reviewed cross-session injection; ROI ledger | rtk rewrite + usage events + existing compaction `usable` (Craft); TE1 accounting utility `usable`; visible cache measurement and Fleet profile optimization `not implemented`; L3+ gated | TE1 observes only; after R0 baseline, prompt diet/tool projection/Pi-light require a separate bounded slice; R3 is the cross-domain trace; R5/R6 supply ArtifactRef/TaskBrief | [`references/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md`](references/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md); owner inventory; Databricks/Pi/OpenHands/Hermes/OpenClaw mechanism evidence; `plugins/rtk` fused; LLMLingua-2 gated | UsageTracker + existing prompt/tool/compaction paths — one ledger, no second memory or harness | TE1 + SYS-03 first proof + [`17-TOKEN-ECONOMY.md`](17-TOKEN-ECONOMY.md) §6 |
| Model routing & cost | one ledger (real/estimated/unknown), routing default-off, API lanes only | `not implemented` beyond usage events | E3 ledger fields; batch endpoints | — (E3 rules) | UsageTracker extension | R17 implement-or-`NO_GAP` closure |
| Memory & experience | layered agent-maintained files (working notes → curated layers), logged consolidation, scoped retrieval, optional curation | `not implemented` | needs completed traceable chains (R3+) | REJECT: universal memory engines | Workspace files + Session evidence | R9 |
| Thinking levels | one vocabulary, per-model honest adaptation | `usable` (`max→xhigh` Pi mapping) | more backends as they land | — (E9) | backend adapters | done for Pi; per-adapter |

## E. Creation surfaces

| Domain | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|
| Document editing | TipTap editing, preview, agent co-editing | `usable` editor (Craft TipTap) | agent patch flow + doc-tree UX; **no second editor** | LobeHub product-flow PRODUCT_REFERENCE-candidate; `lobehub/lobe-editor` MODULE_REFERENCE-candidate; TipTap LOCAL_IMPROVEMENT default | TipTap path | R3 exercises it; editing spec at activation |
| Canvas | spatial projection of entities/artifacts, governed invocation | `not implemented` | E5a benchmark gate; projection model | `plugins/xyflow` leading candidate (`INSUFFICIENT_COMPARISON`), `software/tldraw` comparison-only (production license gate); vision: [`design-library/07-…`](design-library/07-canvas-spatial-orchestration-VISION.md) | projections over native authorities | R7 |
| Design surface | schema-validated objects, transactional change batches, tokens/components | `not implemented` | E11 boundaries; adapter study | `software/penpot` (patterns; MPL care), `software/open-pencil` (AI edit), `plugins/open-design` | native schema attached to Craft shell/actions/artifacts | R10 |
| Web artifacts | generate/preview/iterate web outputs, honest export | `not implemented` (HTML preview exists) | producer→consumer via ArtifactRef | `software/grok-build` EVIDENCE_ONLY | Craft files/previews + R4/R5 | R10 |
| Video | timeline/NLE surface, media pipeline, export | `not implemented` | native module boundary (E4); resource limits (E8) | `software/opencut-classic` timeline candidate (archived; admission pending), `plugins/react-timeline-editor` comparison candidate; `software/vibeframe` AI-generation evidence candidate | native sequence over R11 Job/R5 Artifact | R12 |
| Deck / motion | native deck doc, honest PPTX/HTML export (E7) | `not implemented` | native schema + export fidelity proof | `software/open-pencil` (structured design→presentation) | native document over R10/R11/R12 seams | R13 |
| Image / AIGC jobs | generation jobs, placeholders→result, provenance | `not implemented` | one Job lifecycle extracted from the first image producer/consumer; no speculative second queue | MiniMax Hub analysis EVIDENCE_ONLY | Craft Task/Session/permission + R5 Artifact + UsageTracker | R11 |
| 3D scene / director stage | scene/shot planning, object identity, camera and lighting intent | `not implemented` | native scene/shot model and renderer adapter | Open Pencil/Open Design/Penpot patterns only; no admitted 3D reference yet | Creative Media scene adapter + ArtifactRef | R13 / CREATE-13-A |
| Panorama / environment / relighting | 360/environment preview, relight transforms and provenance | `not implemented` | media model/provider support, cost and failure states | candidate product evidence only until fixed source and same-task comparison | media Job + ArtifactRef | R13 / CREATE-14-A |
| Multi-angle / multi-grid shots | stable shot identity, regeneration, ordering and partial failure | `not implemented` | source-to-shot links and deterministic grid manifest | storyboard/video candidate pool; no formal reference | sequence/storyboard + ArtifactRef | R13 / CREATE-15-A |
| Long-form narrative/content generation | outline, chapters, document generation and human revision | `not implemented` | governed document actions, prompt/model/source provenance | Craft TipTap + SYS-03 context economy; product references require same-task test | TipTap document authority + ActionEnvelope | R10 / CREATE-16-A |

## F. Platform

| Domain | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|
| Capabilities / Skills / plugins | install / loadout / runtime separation; provenance | Craft Skills/Sources `usable`; unified manifest `not implemented` | E2 loadouts; built-in loading before external distribution | `plugins/ponytail` (minimal skills), REJECT Superpowers-style gates | Skills/Sources/tool registries | R15 |
| Skill marketplace | discover, inspect, compatibility, examples, signed install, scoped loadout, update/rollback | `not implemented` | ORCH-10 manifest, trust and transaction gates | Codex/Cursor/Claude marketplace patterns; local-first improvement required | SYS-08 catalog + SYS-03 loadout | ORCH-10-A |
| Plugin marketplace | bundle skills/subagents/MCP/hooks/rules with independent permissions and lifecycle | `not implemented` | ORCH-11 bundle transparency, runtime isolation and changed-capability review | Cursor Marketplace and Codex Plugins product references | SYS-08 package lifecycle + SYS-01 grants | ORCH-11-A |
| MCP marketplace | server/tool/resource registry, auth scope, health, risk, revoke and offline/local source | `not implemented` | ORCH-12 per-tool grant, credential and transport gates | Claude MCP catalog, Cursor MCP plugins, Codex custom MCP review | SYS-08 registry + SYS-01 policy | ORCH-12-A |
| Messaging | IM gateways, routing, reconnect, approval routing | `not implemented` for Fleet's Workspace-scoped adapter (Craft messaging + WhatsApp worker are `usable`) | Workspace-scoped adapter contract; honest platform absence | first candidate `software/hermes-agent` (admission pending); comparison `software/openclaw` (admission pending) | messaging gateway + settings | R14 |
| Panels & layout | docking/split/resize primitives, layout persistence | `usable` (Craft fixed shell) | only if a real surface needs docking — CONDITIONAL | first candidate `plugins/dockview` (admission pending); comparison candidates `react-resizable-panels`, `react-rnd` (admission pending) | renderer layout + settings | R18 implement-or-`NO_GAP` closure |
| Workflows | finite versioned DAG over governed actions | `not implemented` | R4+R5 first; E5 edge-class rules | FlowGram EVIDENCE_ONLY (editor pattern only) | definition projected onto Craft TaskRunner | R8 |
| Updates & distribution | Fleet-controlled/user-configured channel; never Craft binary | `usable` for the inherited updater path; Fleet's target/channel is `not implemented` | P8 slice | — | auto-update + builder config | [`specs/R2-independence.md`](specs/R2-independence.md) |
| Help & docs | bundled docs, docs MCP, visible-external links | `usable` (Craft, Craft-hosted) | local-first per P8 | — | docs modules + session-mcp-server | R2 spec |
| i18n & identity honesty | zh-Hans coverage, service-class labeling | `wired but not visually checked` in the R0-audited tree | R1 acceptance | — | i18n catalogs + branding | R1 spec |

## G. Technology routes (per module, judged — not all deferred)

The per-module technology stance (not capability status). **decided** = the boundary/route is
binding, but code still requires an ACTIVE spec; **proposed** = the recommended route, confirmed
inside the module's spec at activation; **gated** = choice waits for a named gate. Rationale beyond one line lives in
[`13-ORCHESTRATION.md`](13-ORCHESTRATION.md) and the reference map.
Any route that names an external mechanism is still subject to the admission-v2 record in
[`references/REFERENCE-REGISTRY.md`](references/REFERENCE-REGISTRY.md); a route can be useful
research direction without authorizing code import or claiming that the reference is superior.

| Module | Route | State | Why (one line) |
|---|---|---|---|
| App shell / runtime | Electron + Bun monorepo + React (inherited Craft stack) | decided | Working, verified; replacing it is a rewrite with no user value |
| Persistence | Craft filesystem stores; SQLite only on the D2 trigger | decided | Honest lesson: no control-plane DB without a concrete atomicity failure |
| Chat/session UX | Craft surfaces, simplified per P5 | decided | The baseline is the product |
| Document editing | **TipTap (existing) — extend, never replace**; LobeHub flows as UX reference, `lobe-editor` compared module-by-module before any adoption | decided | Second-editor bans exist because dual editors fork state and shortcuts |
| Orchestration kernel | Own thin layer over Craft TaskRunner/Sessions (TaskContract/Brief/Report envelopes); opencode mechanisms mapped in, its gaps fixed | decided (boundary) | Persistence/event mapping still requires R4/R6 seam evidence; no external orchestrator owns Fleet state |
| Runtime adapters | One adapter contract over backend seam; AionUi patterns; ACP where offered | decided (contract) | Per-runtime order remains proposed; capability negotiation beats per-CLI special cases |
| Canvas renderer | **DOM family committed (E5a)**: React Flow v12 default first implementation; custom DOM+`translate3d`+SVG the named in-family fallback (Mayi Canvas-proven: `references/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md`); custom edge overlay + visible-node virtualization + thumbnail workers + object pools; GPU (Pixi/CanvasKit) only ever a media layer; tldraw comparison-only (license checkpoint) | decided (family) · spike picks in-family (runnable from R5) | Four DOM-family shipping proofs; anti-oscillation clause in E5a |
| Workflow engine | Own finite typed DAG over governed actions + TaskRunner; FlowGram editor UX patterns only | decided (boundary) | Schema is confirmed at activation from promoted real chains; executor/permission must stay Fleet's |
| Design surface | Own schema authority + Penpot-style ordered change batches w/ inverses; open-pencil engine boundary (model independent of renderer); MPL = pattern-study default (admission pending) | proposed | Candidate mechanism evidence only; E11 and license review still required |
| Video | opencut-classic timeline/track/snapping patterns + ffmpeg jobs in Electron main process + `react-timeline-editor` comparison (both admission pending); HTML5/WebCodecs preview | proposed | Native module boundary (E4); main-process jobs respect E8 limits |
| Deck/motion | Native JSON doc model + explicit exporters (PPTX/HTML) with visible fidelity limits (E7) | proposed | Export honesty is the constraint that picks the architecture |
| Image/AIGC jobs | Single owner-approved job authority (placeholder→job→result), provider adapters on E3 lanes, native batch endpoints | proposed | MiniMax-pattern UX; one ledger, no per-provider job stores |
| 3D / panorama / relight / shot-grid | Native scene/shot manifests over the shared Job/ArtifactRef seams; renderer/provider adapters remain replaceable | proposed | No local 3D reference has passed comparison; preserve source/transform/output provenance |
| Long-form content generation | TipTap/native document authority plus governed patch/generation actions; SYS-03 ContextPack/UsageRecord | proposed | Human edits and source/model provenance must survive generation; no second editor |
| Web artifacts | Existing preview + iframe/webview isolation (never inside the canvas graph layer); versions via ArtifactRef | proposed | TRAEWork lesson: live web preview ≠ spatial canvas |
| Token/context | Layered pipeline per [`17-TOKEN-ECONOMY.md`](17-TOKEN-ECONOMY.md): three-zone prefix stability + ledger cache fields (adopt now), rtk-style rewriting extension, CAT-pattern compaction tool (on measured pressure), LLMLingua-2-style trim (gated); connectors (repomix/context7/codegraph) via Sources/MCP | decided (framework, E12) · per-layer gates | Leaner context measurably raises capability (context rot); every optimizer measured, switchable, honest (`unknown` ≠ 0) |
| Messaging | hermes-agent adapter patterns (admission pending) behind one Workspace-scoped contract | proposed | Channel failure must never block local core |
| Sandbox | OpenHands executor-interface pattern (admission pending; create/exec/cancel/reclaim, replaceable) | gated | Gate: a real risk profile beyond current permission boundaries |
| Multi-panel layout | dockview primitives (admission pending) | gated | Gate: first real surface that genuinely needs docking |
| Remote/cloud | Craft transport + P7 scoped grants; no relay, no control plane | decided | Owner-set product identity (P7/P8/P9) |

## Update rules

1. A slice that changes any fact in a row updates the row **in the same slice**.
2. A domain becoming ACTIVE gets its full spec in `specs/` (template §References consumed wires the
   reference column in).
3. New references enter via `源码参考/meta/` admission — never directly here.
4. Adding a domain requires an owner request or a real discovered capability; deleting one requires
   an owner decision recorded in [`02-DECISIONS.md`](02-DECISIONS.md).
