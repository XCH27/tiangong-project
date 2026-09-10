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

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Sessions & work list | CORE-03, ORCH-06 | session lifecycle, streaming, queueing, steering, event stream/activity timeline, one list implementation with Project and Conversations scopes | `usable` backend; R1 presentation `wired but not visually checked` | converge current shell to v0.10.5, preserve actions, remove duplicate homes (P10) | Craft v0.10.5 baseline; v0.11.2 selective reference | SessionManager + SessionEvents | [`specs/R1-one-boundary-language.md`](specs/R1-one-boundary-language.md) |
| Project / Workspace | CORE-02 | one Project=folder boundary, config, roots, remote routing | `usable` for Craft Workspace; Fleet P6 presentation is `wired but not visually checked` | one switcher and a documents/assets/settings home without a second Session list; legacy-data slice | Craft v0.10.5 baseline | Workspace stores | [`specs/R1-one-boundary-language.md`](specs/R1-one-boundary-language.md) |
| Tasks, scheduling & later task center | CORE-04 | optional structured tasks, statuses, scheduler; Kanban task-center projection | backend code present; Kanban Board product surface `wired but not visually checked` | converge Kanban UI to v0.10.5 design language; TaskContract projection + drift gates (R6) | Craft v0.11.2 backend evidence; `software/opencode` pending | Task stores + TaskRunner; Session remains ordinary-work authority in R1 | R1 classification; R6 runtime contract |
| Permissions & safety | EXEC-01 | modes, PreToolUse gate, approvals, command validation | `usable` (Craft) | caller-aware policy identity across Ask (R4); explainable command rules (S3) | Craft; `software/codex` EVIDENCE_ONLY (rule shape) | mode-manager + PreToolUse + SessionManager | R4 spec |
| Terminal & local execution | EXEC-03 | Bash + background shell, output/cancel/restart truth | `usable` (Craft baseline) | Fleet-wide target contract; interactive PTY = CONDITIONAL (real caller gate) | Craft | Bash/background path in SessionManager | R18 implement-or-`NO_GAP` closure |
| Settings | CORE-05 | one settings home: AI, appearance, permissions, labels, server, messaging… | `usable` (Craft; zh-Hans work in R0 tree) | honest service classes per P8 | Craft | settings stores | [`specs/R2-independence.md`](specs/R2-independence.md) |
| Search, labels, archive & views | CORE-06, INFO-06 | search indexing/retrieval, dynamic views, filters, archive/recovery | `usable` backend; R1 presentation `wired but not visually checked` | all results act as states of the one work list; label definitions remain in Settings | Craft | search/views + labels + Session commands | R1 |
| Automations | EXEC-10 | schedules, automation handlers | `usable` (Craft) | route through governed actions once R4 exists | Craft | automations + scheduler | R4 follow-up |
| Onboarding | CORE-07 | first-run, workspace creation, provider setup | `usable` (Craft) | plain-language pass; no Craft-service implication (P8) | Craft | Electron onboarding flow | R2 spec |

## B. Files, artifacts and evidence

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Workspace files | INFO-01 | file tools, containment, permissioned mutation | `usable` (Craft) | version/precondition conflict rules; **no file history/recovery authority exists today** (verified 2026-07-17) — recovery is honest-`none` unless workspace has VCS. R5 proposed defaults (adopted from 2026-07-17 review): FileLease TTL 60s, silent renew every 20s, auto-release on crash; atomic write via `.tmp_` + `fs.rename`; pre-mutation SHA-256 + content snapshot with a bounded undo window whose restore first re-verifies the current hash (S5-honest) | Craft | Workspace filesystem + file tools | R5 |
| ArtifactRef & Library | INFO-02, INFO-07, CREATE-11 | exact versions, provenance, cross-surface handoff, Library view, templates/brand kits as reusable Library assets | `not implemented` | first producer→consumer pair; minimal envelope seed (D6, adopted from review): `{ id, version, kind, nativeOwner, workspaceId }` — no speculative fields (no `consumers[]`) | `plugins/markitdown` MODULE_REFERENCE-candidate (ingestion only) | none yet — smallest new authority at R5 | R5 |
| Browser & evidence | INFO-03 | BrowserPane, capture, annotate, governed CDP | `usable` (Craft BrowserPane baseline); capture/evidence `not implemented` | evidence-capture policy surface (E6); artifact links | Craft; external browser MCPs = optional executors only (REJECT as replacement) | BrowserPane + browser_tool | R3 exercises it |
| Document ingestion | INFO-04, INFO-08 | PDF/Office/… → usable input | `usable` (Sources/previews) | conversion provenance | `plugins/markitdown` | Sources + preview paths | — |

## C. Orchestration and runtimes

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Multi-agent delegation | EXEC-04 | TaskBrief/RunReport, child sessions, budgets-that-halt, mailbox/wait | `not implemented` (Craft has child sessions + TaskRunner) | bounded protocol + report validation (C3/C11) | `software/opencode` (pending re-audit), `software/codex`, `software/grok-build` | Session/Task tree (no new store) | R6 |
| Runtime adapters | EXEC-05 | detect/auth/health/capability negotiation per runtime | `usable` for Claude+Pi; generic adapter `not implemented` | one adapter contract; honesty about unsupported features | first candidate `software/AionUi` (admission pending); comparison `software/codex` (admission pending) | backend seam + SessionManager | R6+ |
| Adaptive organization | EXEC-06 | direct/parallel/verify/hierarchy routing by measured cost | `not implemented` | needs R6+ accepted-outcome evidence (C5/C6) | `software/DeepSeek-Reasonix` (plan/execute split), Google scaling study | policy over Task/Session | R17 implement-or-`NO_GAP` closure |
| Worktree isolation | EXEC-07 | per-task checkout isolation, occupancy, cleanup | `not implemented` | lifecycle + occupancy rules (P9: location ≠ isolation) | first candidate `software/orca` (admission pending); comparison `software/grok-build` (admission pending) | Git/process integration | R6+ |
| Sandbox / OS isolation | EXEC-08 | current filesystem/network/env script isolation plus an R18 conditional replaceable OS/container executor | `wired but not visually checked` | full OS/container isolation, resource accounting and recovery require a real risk gap; current script sandbox is not a VM/container boundary | `software/OpenHands` primary comparison, `software/omnigent` secondary | `app/packages/session-tools-core/src/handlers/script-sandbox.ts` + existing permission path | R18 implement-or-`NO_GAP` closure |
| External computer/environment control | EXEC-15 | native Fleet actions; BrowserPane/CDP, filesystem/shell/API and remote Fleet structured adapters; accessibility/semantic then pixel fallback | Browser structured path `usable` in its current Craft scope; general Computer Use `not implemented` | CONDITIONAL: only when an approved real task cannot use a native/structured route; bind environment/display identity, live expiring grant and observation version; two adapters before a generic interface | Hermes accessibility/SOM and OpenClaw node/grant/frame mechanisms = `EVIDENCE_ONLY` | existing BrowserPane/runtime/permission paths; any fallback owns no Fleet state | R16 implement-or-`NO_GAP` closure |
| Remote / cloud execution | EXEC-09 | direct connect to user-owned Fleet instance; grants; standby | `not implemented` for the Fleet target model (Craft transport is `usable`) | P7 grant scoping + honest disconnect; no control plane | Craft transport; design note [`design-library/20-…`](design-library/20-workspace-project-session-remote-connections.md) (external product paths are reference-only) | server transport + Workspace routing | R14 |
| Git repository / branch / PR delivery | EXEC-13 | task-changes diff, apply/discard, PR — branches agent-managed, never a user surface (C4) | `not implemented` | C4 ladder: read-only diff (R3-era) → apply/discard with R6 worktrees → PR/remote with R14; Git operations remain governed delivery actions, never a Task/Session authority | Craft file/process seams; GitHub connector is an optional executor only | Git/process adapter + existing Task/Session/permission | EXEC-13-A |
| Governed action seam | EXEC-02 | ActionEnvelope, caller-aware policy identity, one executor/policy/evidence path | `not implemented` | extract the envelope from the first two real callers (R4); no handler-only wrapper before that | Craft handler paths | existing permission path + handlers — no second executor | R4 spec |
| Prompt / policy profile / agent identity | EXEC-14 | scoped system prompt, model/profile identity inspection, centralized effective prompt/tool projection | `not implemented` (Claude/Pi full lanes exist) | E13: measure actual serialized requests; Pi-light is a profile, not a kernel; effective view = task need ∩ installed ∩ available ∩ policy ∩ live grant; loadout remains separate from Action seam | Craft/Pi baseline; OpenHands/Hermes/OpenClaw = mechanism evidence only | existing backend/prompt/tool assembly + permission authority; no second loadout | post-TE1 bounded slice + EXEC-14-A |

## D. Intelligence economics

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Context & token optimization | INTEL-01, INTEL-02 | **layered token economy (E12/E13)**: effective projection + ArtifactRef/TaskBrief structural savings · L1 prefix/cache alignment · L2 deterministic input compression (rtk rewrite **shipped**) · L3 agent-directed compaction · L4 gated model-assisted trim · L5 output profiles · L6 reviewed cross-session injection; ROI ledger | rtk rewrite + usage events + existing compaction `usable` (Craft); TE1 accounting utility `usable`; visible cache measurement and Fleet profile optimization `not implemented`; L3+ gated | TE1 observes only; after R0 baseline, prompt diet/tool projection/Pi-light require a separate bounded slice; R3 is the cross-domain trace; R5/R6 supply ArtifactRef/TaskBrief | [`references/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md`](references/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md); owner inventory; Databricks/Pi/OpenHands/Hermes/OpenClaw mechanism evidence; `plugins/rtk` fused; LLMLingua-2 gated | UsageTracker + existing prompt/tool/compaction paths — one ledger, no second memory or harness | TE1 + SYS-03 first proof + [`17-TOKEN-ECONOMY.md`](17-TOKEN-ECONOMY.md) §6 |
| Model routing & cost | INTEL-03, INTEL-04 | one ledger (real/estimated/unknown), routing default-off, API lanes only | `not implemented` beyond usage events and the `usable` per-model thinking-level mapping (Thinking levels row) | E3 ledger fields; batch endpoints | — (E3 rules) | UsageTracker extension | R17 implement-or-`NO_GAP` closure |
| Memory & experience | INTEL-05 | layered agent-maintained files (working notes → curated layers), logged consolidation, scoped retrieval, optional curation | `not implemented` | needs completed traceable chains (R3+) | REJECT: universal memory engines | Workspace files + Session evidence | R9 |
| Evaluation & regression evidence | INTEL-07 | verifier runs separate from the executor, regression fixtures, accepted-outcome evidence | `not implemented` | needs completed traceable chains to grade (R3+); the verifier never shares state with the executor it grades | — | Session evidence + repository tests | R17 implement-or-`NO_GAP` closure |
| Reasoning and runtime modes | EXEC-05, INTEL-03 | exact per-model reasoning choices plus separate speed/service/runtime modes | `usable` for advertised Pi/API reasoning choices and the first-party fast toggle; complete multi-runtime projection `not implemented` | OpenCode CLI variants still need typed classification; generic non-reasoning modes are stored but not selectable; the legacy Pi `max→xhigh` request fallback must not appear as a supported `max` tier | — (E9/E9a) | backend adapters + existing settings authority | per-adapter capability tests plus P-30 owner acceptance |

## E. Creation surfaces

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Document editing | INFO-05 | TipTap editing, preview, agent co-editing | `usable` editor (Craft TipTap) | agent patch flow + doc-tree UX; **no second editor** | LobeHub product-flow PRODUCT_REFERENCE-candidate; `lobehub/lobe-editor` MODULE_REFERENCE-candidate; TipTap LOCAL_IMPROVEMENT default | TipTap path | R3 exercises it; editing spec at activation |
| Canvas | CREATE-01 | spatial projection of entities/artifacts, governed invocation | `not implemented`; G6 playground preview page `display-only`, landed 2026-07-26 (0e6c33a25, b70fba9ff) | E5a benchmark gate; projection model | `plugins/xyflow` leading candidate (`INSUFFICIENT_COMPARISON`), `software/tldraw` comparison-only (production license gate); vision: [`design-library/07-…`](design-library/07-canvas-spatial-orchestration-VISION.md) | projections over native authorities | R7 |
| Design surface | CREATE-06 | schema-validated objects, transactional change batches, tokens/components | `not implemented` | E11 boundaries; adapter study | `software/penpot` (patterns; MPL care), `software/open-pencil` (AI edit), `plugins/open-design` | native schema attached to Craft shell/actions/artifacts | R10 |
| Web artifacts | CREATE-07 | generate/preview/iterate web outputs, honest export | `not implemented` (HTML preview exists) | producer→consumer via ArtifactRef | `software/grok-build` EVIDENCE_ONLY | Craft files/previews + R4/R5 | R10 |
| Video | CREATE-02, CREATE-05 | timeline/NLE surface, media pipeline, export | `not implemented` | native module boundary (E4); resource limits (E8) | `software/opencut-classic` timeline candidate (archived; admission pending), `plugins/react-timeline-editor` comparison candidate; `software/vibeframe` AI-generation evidence candidate | native sequence over R11 Job/R5 Artifact | R12 |
| Deck / motion | CREATE-08, CREATE-09 | native deck doc, honest PPTX/HTML export (E7) | `not implemented` | native schema + export fidelity proof | `software/open-pencil` (structured design→presentation) | native document over R10/R11/R12 seams | R13 |
| Image / AIGC jobs | CREATE-03, ORCH-05 | generation jobs, placeholders→result, provenance | `not implemented` | one Job lifecycle extracted from the first image producer/consumer; no speculative second queue | MiniMax Hub analysis EVIDENCE_ONLY | Craft Task/Session/permission + R5 Artifact + UsageTracker | R11 |
| Audio / voice / music | CREATE-04 | audio and music generation jobs, voice tracks, track provenance | `not implemented` | rides the shared media Job lifecycle from R11/R12; no separate audio queue | media candidates pending admission | media Job + ArtifactRef | R12 |
| Export & delivery profiles | CREATE-12 | render/export pipelines, delivery profiles, fidelity declarations (E7) | `not implemented` | one exporter contract over Job outputs with visible fidelity limits; no per-surface export forks | — | Job output + ArtifactRef | R13 |
| 3D scene / director stage | CREATE-13 | scene/shot planning, object identity, camera and lighting intent | `not implemented` | native scene/shot model and renderer adapter | Open Pencil/Open Design/Penpot patterns only; no admitted 3D reference yet | Creative Media scene adapter + ArtifactRef | R13 / CREATE-13-A |
| Panorama / environment / relighting | CREATE-14 | 360/environment preview, relight transforms and provenance | `not implemented` | media model/provider support, cost and failure states | candidate product evidence only until fixed source and same-task comparison | media Job + ArtifactRef | R13 / CREATE-14-A |
| Multi-angle / multi-grid shots | CREATE-10, CREATE-15 | stable shot identity, regeneration, ordering and partial failure | `not implemented` | source-to-shot links and deterministic grid manifest | storyboard/video candidate pool; no formal reference | sequence/storyboard + ArtifactRef | R13 / CREATE-15-A |
| Long-form narrative/content generation | CREATE-16 | outline, chapters, document generation and human revision | `not implemented` | governed document actions, prompt/model/source provenance | Craft TipTap + SYS-03 context economy; product references require same-task test | TipTap document authority + ActionEnvelope | R10 / CREATE-16-A |

## F. Platform

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| App shell & runtime | CORE-01 | Electron main/renderer shell, Bun workspace processes, React app frame, window/session bootstrap | `usable` (Craft) | stay converged with the v0.10.5 baseline while R1 reshapes presentation; no shell rewrite | Craft v0.10.5 baseline | Electron main + renderer bootstrap | R0 baseline; §G app-shell route |
| Capabilities / Skills / plugins | ORCH-03, INTEL-06 | install / loadout / runtime separation; provenance | Craft Skills/Sources `usable`; unified manifest `not implemented` | E2 loadouts; built-in loading before external distribution | `plugins/ponytail` (minimal skills), REJECT Superpowers-style gates | Skills/Sources/tool registries | R15 |
| Skill marketplace | ORCH-10 | discover, inspect, compatibility, examples, signed install, scoped loadout, update/rollback | `not implemented` | ORCH-10 manifest, trust and transaction gates | Codex/Cursor/Claude marketplace patterns; local-first improvement required | SYS-08 catalog + SYS-03 loadout | ORCH-10-A |
| Plugin marketplace | ORCH-11 | bundle skills/subagents/MCP/hooks/rules with independent permissions and lifecycle | `not implemented` | ORCH-11 bundle transparency, runtime isolation and changed-capability review | Cursor Marketplace and Codex Plugins product references | SYS-08 package lifecycle + SYS-01 grants | ORCH-11-A |
| MCP marketplace | ORCH-04, ORCH-12 | server/tool/resource registry, auth scope, health, risk, revoke and offline/local source | `not implemented` | ORCH-12 per-tool grant, credential and transport gates | Claude MCP catalog, Cursor MCP plugins, Codex custom MCP review | SYS-08 registry + SYS-01 policy | ORCH-12-A |
| Messaging | EXEC-11 | IM gateways, routing, reconnect, approval routing | `not implemented` for Fleet's Workspace-scoped adapter (Craft messaging + WhatsApp worker are `usable`) | Workspace-scoped adapter contract; honest platform absence | first candidate `software/hermes-agent` (admission pending); comparison `software/openclaw` (admission pending) | messaging gateway + settings | R14 |
| Collaboration & sharing | EXEC-12 | invites and collaborative access with explicit grants and visible side effects | online share links/viewer **removed 2026-07-26** by owner decision; OAuth/Slack relays remain user-operated; invites/collaborative grants `not implemented` | explicit grants model and a new owner contract before any replacement sharing surface | — | server transport grants + settings | R14 |
| Notifications & approvals inbox | ORCH-07 | notification routing, approval inbox surfaces over permission/session evidence | `not implemented` | inbox stays a projection of the existing permission path; no second approval authority | — | permission path + SessionEvents | R14 |
| Diagnostics & recovery | ORCH-08 | health checks, failure classification, recovery guidance | `not implemented` | classify runtime/connectivity failures honestly before any automated recovery | — | logger + health-check paths | R18 implement-or-`NO_GAP` closure |
| Telemetry & privacy | ORCH-09 | local-first telemetry, redaction, privacy controls | `not implemented` | local-first defaults and redaction before any emission (P8) | — | settings + logging paths | [`specs/R2-independence.md`](specs/R2-independence.md) |
| Panels & layout | CORE-11 | docking/split/resize primitives, layout persistence | fixed shell/resize `wired but not visually checked` (R0-audited tree, owner walkthrough pending); docking/split primitives `not implemented` | only if a real surface needs docking — CONDITIONAL | first candidate `plugins/dockview` (admission pending); comparison candidates `react-resizable-panels`, `react-rnd` (admission pending) | renderer layout + settings | R18 implement-or-`NO_GAP` closure |
| Workflows | ORCH-01, ORCH-02 | finite versioned DAG over governed actions | `not implemented` | R4+R5 first; E5 edge-class rules | FlowGram EVIDENCE_ONLY (editor pattern only) | definition projected onto Craft TaskRunner | R8 |
| Updates & distribution | CORE-09 | Fleet-controlled/user-configured channel; never Craft binary | inherited updater honestly disabled by default; user-configured channel via `FLEET_UPDATE_FEED_URL` landed 2026-07-26 `wired but not visually checked` (445e11b92, 09c59e7f7); Fleet release channel `not implemented` | owner acceptance of the R2 updater slice; Fleet release channel remains an owner checkpoint | — | auto-update + builder config | [`specs/R2-independence.md`](specs/R2-independence.md) |
| Help & docs | CORE-08 | bundled docs, docs MCP, visible-external links | local-first docs-links slice landed 2026-07-26 `wired but not visually checked` (3ddbe59fe, 58a033d51): bundled summaries local-first, docs-site links visibly external, `FLEET_DOCS_BASE_URL` override | owner acceptance of the R2 docs-links slice | — | docs modules + session-mcp-server | R2 spec |
| i18n & identity honesty | CORE-10 | zh-Hans coverage, service-class labeling | `wired but not visually checked` in the R0-audited tree | R1 acceptance | — | i18n catalogs + branding | R1 spec |

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
5. **Every row in sections A–F declares its `Registry IDs`.** `—` is allowed and means no registry
   row covers the domain — an honest gap, not a formatting choice. `scripts/validate-doc-contracts.py`
   fails on a missing or unknown ID and runs from `scripts/fleet-verify.sh`. Section G (technology
   routes) is exempt: it records stance per module, not capability coverage.

### Known join gaps (2026-07-24)

The join column was added on 2026-07-24; before that this matrix was keyed only by prose domain
names and sat outside every cross-document check. Adding it immediately exposed two classes of gap.
Neither is fixed here — recording them is the point, so they stop being invisible.

**Domains with no registry row (`—`):** none. `External computer/environment control` was the last
one — **resolved 2026-08-15**: it now joins as `EXEC-15`, with a `PACKET-INDEX.md` row anchored to
R16 and an `EXEC-15-A` criterion in the acceptance index, so it is reachable from every
cross-document check instead of carrying an R16 anchor no join could see.

**Registry rows with no A–F domain** — resolved 2026-07-26. The twelve IDs the validator reported
(CORE-01, CREATE-04, CREATE-11, CREATE-12, EXEC-02, EXEC-12, INFO-06, INTEL-07, ORCH-06, ORCH-07,
ORCH-08, ORCH-09) now join sections A–F: INFO-06, ORCH-06 and CREATE-11 folded into the existing
search, Sessions and ArtifactRef/Library rows; the rest received their own domain rows (EXEC-02
governed action seam, INTEL-07 evaluation evidence, CREATE-04 audio, CREATE-12 export profiles,
CORE-01 app shell, EXEC-12 collaboration, ORCH-07 notifications, ORCH-08 diagnostics, ORCH-09
telemetry). The validator's note list is the regression check for this section.
