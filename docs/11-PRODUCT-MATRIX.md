# 11 — Product Matrix (full coverage index)

> **Every product domain, always.** The module registry is the anti-omission breadth authority;
> this matrix maps those capabilities to product behavior, authorities and acceptance. No domain is
> ever deleted from design because of integration ordering (Decision G5). Durable module depth lives
> in `modules/`; an implementation slice gets a full spec in `specs/` when it becomes ACTIVE, and its pages live in
> [`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md). Rows must stay honest: update a row in the
> same slice that changes its facts. Current implementation is the Craft v0.13.4 baseline restored
> on 2026-09-21; prior Fleet extensions remain at `snapshot/pre-rebuild-2026-09-21`. Inherited
> runtime paths without fresh complete acceptance are `wired but not visually checked`; neither
> snapshot acceptance nor passing component tests establishes a usable product loop.
>
> Reference admission grades come from the **single admission authority**
> [`references/REFERENCE-REGISTRY.md`](references/REFERENCE-REGISTRY.md)
> (`FORMAL_REFERENCE | MODULE_REFERENCE | LOCAL_IMPROVEMENT | EVIDENCE_ONLY | REJECT`; unaudited =
> *candidate*). A named project is never license to copy its shell (Decision F3). Unfinished
> admission work belongs to that registry and the consuming suite's execution/proof contract.

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
| Sessions & work list | CORE-03, ORCH-06 | session lifecycle, streaming, queueing, steering, event stream/activity timeline, one list | `wired but not visually checked` | Craft Board is a Sessions view mode; P5 permits a separate navigator only as the same Session/Task projection | Craft v0.13.4 | SessionManager + SessionEvents | [`PRODUCT.md`](PRODUCT.md) |
| Project / Workspace | CORE-02 | visible Workspaces, scoped Project memberships, folder references and remote routing | `wired but not visually checked` for the R1 shell/context changes | Revised P6 retains both Workspace and Project. R1 owns the single sidebar, Board entry, right tools, empty composer and derived activity; no record migration. | Craft v0.13.4 | Workspace stores | [`PRODUCT.md`](PRODUCT.md) |
| Tasks, scheduling & later task center | CORE-04 | optional structured tasks, statuses, scheduler; Kanban as its own navigator | `wired but not visually checked` inherited Task/Session mechanisms; Fleet Board separation `not implemented` | current `board` route resolves to Sessions `viewMode: board`; P5 permits a separate navigator; it does not require a second store or duplicate Conversation list | Craft v0.13.4 | Task stores + Session | `/board` vs `sessions` |
| Permissions & safety | EXEC-01 | modes, PreToolUse gate, approvals, command validation | `wired but not visually checked` (Craft) | caller-aware policy identity across Ask (R4); explainable command rules (S3) | Craft; `software/codex` EVIDENCE_ONLY (rule shape) | mode-manager + PreToolUse + SessionManager | R4 spec |
| Terminal & local execution | EXEC-03 | Bash + background shell, output/cancel/restart truth | `wired but not visually checked` (Craft baseline) | Fleet-wide target contract; interactive PTY = CONDITIONAL (real caller gate) | Craft | Bash/background path in SessionManager | R18 implement-or-`NO_GAP` closure |
| Settings | CORE-05 | one settings home: AI, appearance, permissions, labels, server, messaging… | `wired but not visually checked` (inherited Craft settings and zh-Hans) | honest service classes per P8 | Craft | settings stores | [`specs/R2-independence.md`](specs/R2-independence.md) |
| Search, labels, archive & views | CORE-06, INFO-06 | search indexing/retrieval, dynamic views, filters, archive/recovery | `wired but not visually checked` | Original search/filter/archive remain; Fleet navigation and shared full/compact scope corrections were withdrawn. Cross-domain search is owned by R5 / INFO-06. | Craft | search/views + labels + Session commands | R1 |
| Automations | EXEC-10 | schedules, automation handlers | `wired but not visually checked` (Craft) | route through governed actions once R4 exists | Craft | automations + scheduler | R4 follow-up |
| Onboarding | CORE-07 | first-run, workspace creation, provider setup | `wired but not visually checked` (Craft) | plain-language pass; no Craft-service implication (P8) | Craft | Electron onboarding flow | R2 spec |

## B. Files, artifacts and evidence

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Workspace files | INFO-01 | file tools, containment, permissioned mutation | `wired but not visually checked` (Craft) | version/precondition conflict rules; generic file history is `not implemented`. Recovery is `none` unless a verified snapshot/commit covers the exact version. R5 defines measured lease/renewal/reconciliation and atomic-write recovery; expiry alone is not proof that a writer stopped | Craft | Workspace filesystem + file tools | R5 |
| Storyboard and shot planning | CREATE-10 | shot identity, ordering and regeneration for the video timeline | `not implemented` | source-to-shot links and deterministic grid manifest | storyboard/video candidate pool; no formal reference | sequence/storyboard + ArtifactRef | R13 / CREATE-10-A |
| ArtifactRef & Library | INFO-02, INFO-07, CREATE-11 | exact versions, provenance, cross-surface handoff, Library view, templates/brand kits as reusable Library assets | `not implemented` | first producer→consumer pair; minimal envelope seed (D6, adopted from review): `{ id, version, kind, nativeOwner, workspaceId }` — no speculative fields (no `consumers[]`) | `plugins/markitdown` MODULE_REFERENCE-candidate (ingestion only) | none yet — smallest new authority at R5 | R5 |
| Browser & evidence | INFO-03 | BrowserPane, capture, annotate, governed CDP | `wired but not visually checked` (Craft BrowserPane baseline); capture/evidence `not implemented` | evidence-capture policy surface (E6); artifact links | Craft; external browser MCPs = optional executors only (REJECT as replacement) | BrowserPane + browser_tool | R3 exercises it |
| Document ingestion | INFO-04, INFO-08 | PDF/Office/… source ingestion and previews through source-backed adapters | `wired but not visually checked` (ingestion/previews) | editable round-trip is `not implemented`; adapter revision, source ArtifactRef and fidelity report; no parser reimplementation by default | GenOffice engines; `plugins/markitdown` ingestion; Univer comparison with Pro boundary | Sources + Component format adapters | — |

## C. Orchestration and runtimes

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Multi-agent delegation | EXEC-04 | TaskBrief/RunReport, child sessions, budgets-that-halt, mailbox/wait | `not implemented` (Craft has child sessions + TaskRunner) | bounded protocol + report validation (C3/C11) | `software/opencode` (pending re-audit), `software/codex`, `software/grok-build` | Session/Task tree (no new store) | R6 |
| Runtime adapters | EXEC-05 | detect/auth/health/capability negotiation per runtime | `wired but not visually checked` for Claude+Pi; generic adapter `not implemented` | one adapter contract; honesty about unsupported features | first candidate `software/AionUi` (admission pending); comparison `software/codex` (admission pending) | backend seam + SessionManager | R6+ |
| Worktree isolation | EXEC-07 | per-task checkout isolation, occupancy, cleanup | `not implemented` | lifecycle + occupancy rules (P9: location ≠ isolation) | first candidate `software/orca` (admission pending); comparison `software/grok-build` (admission pending) | Git/process integration | R6+ |
| Inherited execution isolation | EXEC-08 | filesystem/network/env and script isolation over existing permission | `wired but not visually checked` | verify actual platform limits; second OS/container sandbox is excluded | current Craft paths; external mechanisms only for a reproduced defect | existing isolation + permission owners | R0/R2 / EXEC-08-A |
| Specified local-app Computer Use | EXEC-15 | optional Component for selected local app/window; structured API first | not implemented | scope, freshness, helper lifecycle and takeover proof precede office actions | Orca/Peekaboo native target/input mechanisms; UI-TARS fallback; official Codex/Claude product behavior | existing host permission/Session evidence + bounded native adapter | R16 after R0 + foundation / EXEC-15-A |
| Remote / cloud execution | EXEC-09 | direct connect to user-owned Fleet instance; grants; standby | Craft token/Workspace transport `wired but not visually checked`; Fleet device pairing, scoped grants and run-target UI `not implemented` | P7 grant scoping + honest disconnect; no control plane | Craft transport; P9-rev 2026-09-11 | server transport + Workspace routing | R14 |
| Git repository / branch / PR delivery | EXEC-13 | task-changes diff, apply/discard, PR — branches agent-managed, never a user surface (C4) | `not implemented` | C4 ladder: read-only diff (R3-era) → apply/discard with R6 worktrees → PR/remote with R14; Git operations remain governed delivery actions, never a Task/Session authority | Craft file/process seams; GitHub connector is an optional executor only | Git/process adapter + existing Task/Session/permission | EXEC-13-A |
| Governed action seam | EXEC-02 | ActionEnvelope, caller-aware policy identity, one executor/policy/evidence path | `not implemented` | extract the envelope from the first two real callers (R4); no handler-only wrapper before that | Craft handler paths | existing permission path + handlers — no second executor | R4 spec |
| Prompt / policy profile / agent identity | EXEC-14 | scoped system prompt, model/profile identity inspection, centralized effective prompt/tool projection | `not implemented` (Claude/Pi full lanes exist) | E13: measure actual serialized requests; Pi-light is a profile, not a kernel; effective view = task need ∩ installed ∩ available ∩ policy ∩ live grant; loadout remains separate from Action seam | Craft/Pi baseline; OpenHands/Hermes/OpenClaw = mechanism evidence only | existing backend/prompt/tool assembly + permission authority; no second loadout | post-TE1 bounded slice + EXEC-14-A |

## D. Intelligence economics

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Context & token optimization | INTEL-01, INTEL-02 | **layered token economy (E12/E13)**: effective projection + ArtifactRef/TaskBrief structural savings · L1 prefix/cache alignment · L2 deterministic data reduction (optional external RTK Bash/output adapter exists) · L3 agent-directed compaction · L4 gated model-assisted trim · L5 output profiles · L6 reviewed cross-session injection; ROI ledger | Optional RTK binary adapter + usage events + existing compaction `wired but not visually checked` (Craft); RTK requires the enabled preference and a detected compatible binary, otherwise commands pass through unchanged; Fleet TE1 accounting utility absent; visible cache measurement and Fleet profile optimization `not implemented`; L3+ gated | TE1 observes only; after R0 baseline, prompt diet/tool projection/Pi-light require a separate bounded slice; R3 is the cross-domain trace; R5/R6 supply ArtifactRef/TaskBrief | [`references/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md`](references/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md); owner inventory; Databricks/Pi/OpenHands/Hermes/OpenClaw mechanism evidence; RTK is an external binary adapter; its historical source checkout is absent; LLMLingua-2 gated | UsageTracker + existing prompt/tool/compaction paths — one ledger, no second memory or harness | TE1 + SYS-03 first proof + `modules/suites/SYS-03-context-economy.md` §6 |
| Model routing & cost | INTEL-03, INTEL-04 | one ledger (real/estimated/unknown), routing default-off, API lanes only | `not implemented` beyond usage events and the `wired but not visually checked` per-model thinking-level mapping (Thinking levels row) | E3 ledger fields; batch endpoints | — (E3 rules) | UsageTracker extension | R17 implement-or-`NO_GAP` closure |
| Memory & experience | INTEL-05 | layered agent-maintained files (working notes → curated layers), logged consolidation, scoped retrieval, optional curation | `not implemented` | needs completed traceable chains (R3+) | REJECT: universal memory engines | Workspace files + Session evidence | R9 |
| Evaluation & regression evidence | INTEL-07 | verifier runs separate from the executor, regression fixtures, accepted-outcome evidence | `not implemented` | needs completed traceable chains to grade (R3+); the verifier never shares state with the executor it grades | — | Session evidence + repository tests | R17 implement-or-`NO_GAP` closure |
| Reasoning and runtime modes | EXEC-05, INTEL-03 | exact per-model reasoning choices plus separate speed/service/runtime modes | `wired but not visually checked` for advertised Pi/API reasoning choices and the first-party fast toggle; complete multi-runtime projection `not implemented` | OpenCode CLI variants still need typed classification; Fleet generic runtime-mode storage/projection is absent; re-measure model support against current v0.13.4 mappings before porting prior fixes | — (E9/E9a) | backend adapters + existing settings authority | per-adapter capability tests plus P-30 owner acceptance |

## E. Creation surfaces

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Document editing | INFO-05 | direct editing of Markdown/HTML, Office and bounded PDF capabilities with real save/reopen | `not implemented`; inherited previews `wired but not visually checked` | one native owner per format/document; parser, preview and editor are distinct | existing TipTap for Markdown; GenOffice and bounded format engines are candidates, not selected winners | Workspace files + native document adapter; no competing copy of the same document | R3 preview; R10 documents; R13 advanced deck/motion |
| Canvas | CREATE-01 | one production surface: generate, edit and lay out images, video, websites and decks | `not implemented` | not this slice; not an empty default pane | **Cowart** (`源码参考/software/Cowart`; current source observation in the reference registry) supplies bounded interaction evidence, not an adopted engine or store: AI image holder, annotate-to-revise, AI HTML, AI Slides on one board. Canvasight remains collab/conflict EVIDENCE_ONLY. tldraw is license-gated | Fleet canvas (NEW). Craft Pages is a different surface | R7 |
| Design surface | CREATE-06 | schema-validated objects, transactional change batches, tokens/components | `not implemented` | E11 boundaries; adapter study | `software/penpot` (patterns; MPL care), `software/openpencil` (AI edit), `software/open-design` | native schema attached to Craft shell/actions/artifacts | R10 |
| Web artifacts | CREATE-07 | generate/preview/iterate web outputs, honest export | `not implemented` (HTML preview exists) | producer→consumer via ArtifactRef | `software/grok-build` EVIDENCE_ONLY | Craft files/previews + R4/R5 | R10 |
| Video | CREATE-02, CREATE-05 | timeline/NLE surface, media pipeline, export | `not implemented` | native module boundary (E4); resource limits (E8) | `software/opencut-classic` bounded timeline/export candidate; OpenChatCut interaction evidence with AGPL source checkpoint; unmounted historical candidates are not current source evidence | native sequence over R11 Job/R5 Artifact | R12 |
| Deck / motion | CREATE-08, CREATE-09 | native deck doc, honest PPTX/HTML export (E7) | `not implemented` | native schema + export fidelity proof | `software/openpencil` (structured design→presentation) | native document over R10/R11/R12 seams | R13 |
| Image / AIGC jobs | CREATE-03, ORCH-05 | generation jobs, placeholders→result, provenance | `not implemented` | one Job lifecycle extracted from the first image producer/consumer; no speculative second queue | MiniMax Hub analysis EVIDENCE_ONLY | Craft Task/Session/permission + R5 Artifact + UsageTracker | R11 |
| Audio / voice / music | CREATE-04 | audio and music generation jobs, voice tracks, track provenance | `not implemented` | rides the shared media Job lifecycle from R11/R12; no separate audio queue | media candidates pending admission | media Job + ArtifactRef | R12 |
| Export & delivery profiles | CREATE-12 | render/export pipelines, delivery profiles, fidelity declarations (E7) | `not implemented` | one exporter contract over Job outputs with visible fidelity limits; no per-surface export forks | — | Job output + ArtifactRef | R13 |
| Long-form narrative/content generation | CREATE-16 | outline, chapters, document generation and human revision | `not implemented` | governed document actions, prompt/model/source provenance | Craft TipTap + SYS-03 context economy; product references require same-task test | native document owner + governed action | R10 / CREATE-16-A |

## F. Platform

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| App shell & runtime | CORE-01 | Electron main/renderer shell, Bun workspace processes, React app frame | `wired but not visually checked` (Craft v0.13.4) | do not rearrange chrome as Cindy work; admit Craft capabilities (Pages) | Craft v0.13.4 | Electron main + renderer bootstrap | [`PRODUCT.md`](PRODUCT.md) |
| Capabilities / Skills / plugins | ORCH-03, INTEL-06 | install / loadout / runtime separation; provenance; global/Workspace Component activation | Craft Skills/Sources `wired but not visually checked`; registered Component host/runtime `not implemented`; Fleet types/resolver are absent | after R0 baseline exit, host before domain Components; additive entries/panels with user-owned placement; no count cap or blanket R6/R9 prerequisite | Cindy capability ownership/install targets; DeepSeek Harness scoped slots/disposal | existing user/Workspace settings + Skills/Sources/tool registries; derived composition | early R15/R18 foundation (`specs/R18-right-workbench.md`), then R15 distribution |
| Skill marketplace | ORCH-10 | discover, inspect, compatibility, examples, verified-origin install, scoped loadout, update/rollback | `not implemented` | ORCH-10 manifest, trust and transaction gates | Codex/Cursor/Claude marketplace patterns; local-first improvement required | SYS-08 catalog + SYS-03 loadout | ORCH-10-A |
| Component marketplace | ORCH-11 | installable bundles of panels, domain commands, Skills, MCPs, knowledge defaults and assistant suggestions; global/workspace enablement | `not implemented` | bundle transparency, runtime isolation, changed-capability review, unified Craft design language, additive host slots, global/workspace overrides | Cindy SkillHub/install targets; DeepSeek Harness UI slots; OpenChatCut official video-component evidence; Qoder/TRAE discoverability only | SYS-08 package lifecycle + SYS-01 grants + workspace composition | ORCH-11-A |
| MCP marketplace | ORCH-04, ORCH-12 | server/tool/resource registry, auth scope, health, risk, revoke and offline/local source | `not implemented` | ORCH-12 per-tool grant, credential and transport gates | Claude MCP catalog, Cursor MCP plugins, Codex custom MCP review | SYS-08 registry + SYS-01 policy | ORCH-12-A |
| Messaging | EXEC-11 | IM gateways, routing, reconnect, approval routing | `not implemented` for Fleet's Workspace-scoped adapter (Craft messaging + WhatsApp worker are `wired but not visually checked`) | Workspace-scoped adapter contract; honest platform absence | first candidate `software/hermes-agent` (admission pending); comparison `software/openclaw` (admission pending) | messaging gateway + settings | R14 |
| Notifications & approvals inbox | ORCH-07 | notification routing, approval inbox surfaces over permission/session evidence | `not implemented` | inbox stays a projection of the existing permission path; no second approval authority | — | permission path + SessionEvents | R14 |
| Diagnostics & recovery | ORCH-08 | health checks, failure classification, recovery guidance | `not implemented` | classify runtime/connectivity failures honestly before any automated recovery | — | logger + health-check paths | R18 implement-or-`NO_GAP` closure |
| Panels & layout | CORE-11 | user resize/move/reorder, in-window float/re-dock and scoped restore | fixed-column sizing `wired but not visually checked`; registered/movable host `not implemented` | reuse the Files popover and Notes RPC; mount a Notes consumer, preserve drafts/context; Fleet right sidebar and pure layout tree are absent | existing Craft stack and Cindy mechanics first; compare installed drag utilities/tree with Dockview/FlexLayout only against this contract; no dependency selected | one renderer layout representation + existing Workspace/window preferences | early R15/R18 foundation; R18 later closes native multi-window behavior |
| Workflows | ORCH-01, ORCH-02 | finite versioned DAG over governed actions | `not implemented` | R4+R5 first; E5 edge-class rules | FlowGram EVIDENCE_ONLY (editor pattern only) | definition projected onto Craft TaskRunner | R8 |
| Updates & distribution | CORE-09 | Fleet-controlled/user-configured channel; never Craft binary | `not implemented` for Fleet distribution. The current update boundary is `wired but not visually checked`: no installer import, download or pending-update quit hook; no Fleet channel is configured | owner acceptance of the R2 updater slice; Fleet release channel remains an owner checkpoint | — | auto-update + builder config | [`specs/R2-independence.md`](specs/R2-independence.md) |
| Help & docs | CORE-08 | bundled docs, docs MCP, visible-external links | `wired but not visually checked`: desktop/WebUI help uses the shared bundled Markdown overlay, native Help opens the profile-local index and Agent prompts use the same local guides | owner acceptance of the R2 docs-links slice | — | docs modules + session-mcp-server | R2 spec |
| i18n & identity honesty | CORE-10 | zh-Hans coverage, service-class labeling | inherited seven-locale registry, zh-Hans and persisted language selection `wired but not visually checked`; Fleet branding/service labeling `not implemented` | R1/R2 acceptance | — | i18n catalogs + branding | R1 spec |

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
| Document editing | **TipTap for supported Markdown/rich-text paths; format-specific native engines for Office/PDF** | existing base; additional engines unselected | One owner per document and one operation/undo/save path. A Markdown editor is not an OOXML/PDF engine; require edit/save/reopen fidelity fixtures |
| Orchestration kernel | Own thin layer over Craft TaskRunner/Sessions (TaskContract/Brief/Report envelopes); opencode mechanisms mapped in, its gaps fixed | decided (boundary) | Persistence/event mapping still requires R4/R6 seam evidence; no external orchestrator owns Fleet state |
| Runtime adapters | One adapter contract over backend seam; AionUi patterns; ACP where offered | decided (contract) | Per-runtime order remains proposed; capability negotiation beats per-CLI special cases |
| Canvas renderer | **DOM family committed (E5a)**: React Flow v12 default first implementation; custom DOM+`translate3d`+SVG the named in-family fallback (Mayi Canvas-proven: `references/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md`); custom edge overlay + visible-node virtualization + thumbnail workers + object pools; GPU (Pixi/CanvasKit) only ever a media layer; tldraw comparison-only (license checkpoint) | decided (family) · spike picks in-family (runnable from R5) | Four DOM-family shipping proofs; anti-oscillation clause in E5a |
| Workflow engine | Own finite typed DAG over governed actions + TaskRunner; FlowGram editor UX patterns only | decided (boundary) | Schema is confirmed at activation from promoted real chains; executor/permission must stay Fleet's |
| Design surface | Own schema authority + Penpot-style ordered change batches w/ inverses; open-pencil engine boundary (model independent of renderer); MPL = pattern-study default (admission pending) | proposed | Candidate mechanism evidence only; E11 and license review still required |
| Video | opencut-classic timeline/track/snapping patterns + ffmpeg jobs in Electron main process; exact mechanism admission still required; HTML5/WebCodecs preview | proposed | Native module boundary (E4); main-process jobs respect E8 limits |
| Deck/motion | Native JSON doc model + explicit exporters (PPTX/HTML) with visible fidelity limits (E7) | proposed | Export honesty is the constraint that picks the architecture |
| Image/AIGC jobs | Single owner-approved job authority (placeholder→job→result), provider adapters on E3 lanes, native batch endpoints | proposed | MiniMax-pattern UX; one ledger, no per-provider job stores |
| 3D / panorama / multi-camera shot grids | Outside Fleet native scope under PRODUCT; specific external-tool jobs may use existing execution paths | excluded | Catalogue coverage does not reopen a product exclusion |
| Long-form content generation | format-specific native document authority plus governed patch/generation actions; SYS-03 ContextPack/UsageRecord | proposed | Human edits and source/model provenance must survive generation; no second editor |
| Web artifacts | Existing preview + iframe/webview isolation (never inside the canvas graph layer); versions via ArtifactRef | proposed | TRAEWork lesson: live web preview ≠ spatial canvas |
| Token/context | Layered pipeline per `modules/suites/SYS-03-context-economy.md`: three-zone prefix stability + ledger cache fields (new work after R0 and the TE1 baseline), optional external RTK rewriting, CAT-pattern compaction tool (on measured pressure), LLMLingua-2-style trim (gated); connectors (repomix/context7/codegraph) via Sources/MCP | decided (framework, E12) · per-layer gates | Leaner context measurably raises capability (context rot); every optimizer measured, switchable, honest (`unknown` ≠ 0) |
| Messaging | hermes-agent adapter patterns (admission pending) behind one Workspace-scoped contract | proposed | Channel failure must never block local core |
| Execution isolation | Validate and correct current Craft isolation through its existing permission path | decided | R0/R2 boundary checks; no second OS/container sandbox or R18 sandbox lifecycle |
| Multi-panel layout | candidate docking libraries (no library selected) | gated | R18 foundation owns the first real panel caller; compare the existing layout model and candidates before adopting a dependency |
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

### Coverage check

Run `python3 scripts/validate-doc-contracts.py` for current capability/page/acceptance joins.
Historical July join counts and retired collaboration/telemetry IDs are not current scope.
EXEC-15 carries R16's bounded local-app Component; general Core control and a second sandbox stay excluded.
A valid join proves coverage, not semantic agreement or an implemented feature.
