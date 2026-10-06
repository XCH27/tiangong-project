# Capabilities — register, acceptance, surfaces and Craft classification

The machine-checked registries: every product capability and its status, the minimum acceptance gate for each, the domain matrix, every page and surface, and how each Craft capability is classified. `scripts/validate-doc-contracts.py` joins these tables; edit a row, not a narrative.

## Capability register

A status naming Craft describes the retained `app/` branch. Candidate-specific evidence names
ZCode explicitly. Unqualified inherited rows are retained-branch observations, not candidate
acceptance. Current implementation order is in TODO; packet depth labels never grant execution.

Every product capability, whether or not it exists yet. **Inclusion is not a claim of
implementation.** After the 2026-09-21 rebuild and the 2026-09-22 original-source reset, Fleet's
Component host, Assistant store, layout model, remote pairing and cache-economy helpers are absent;
`wired but not visually checked` marks surviving Craft paths, not owner acceptance.

How to read a row:

- **Class** is relative to the current `app/`: REUSE, EXTEND or NEW (Craft lacks the domain model or
  adapter; never a licence for a new shell, kernel, store, permission path or settings home).
- **Status** uses the fixed vocabulary in `AGENTS.md`.
- **Loop** is the one feature document holding the row's `Execution <ID>` section: next bounded step,
  source paths, data owner, failure handling, proof and reference route. `—` means no packet yet;
  such a row must not be implemented from its one-line summary.
- **Surfaces** are [page IDs](#page-structure). **Release** is the anchor in the
  [`TODO.md`](../TODO.md) ladder, followed by the minimum gate in *Acceptance gates* below.
- **State** is packet depth: `BREADTH_ONLY` (named and placed, no grounded packet), `PACKET_DRAFT`
  (packet exists; evidence, seams or acceptance incomplete), `READY_FOR_SPEC` (first slice fully
  specified — not whole-capability completion). A `PROVE` next step stays `PACKET_DRAFT`.

Rules: add a row before building a large capability; removing a row needs an owner decision in
[`decisions.md`](decisions.md) — "not now" is not removal; every row keeps a release anchor.

### Core and work surfaces

| ID | Capability | Context / kind | Class | Status | Loop | Surfaces | Release / acceptance | State | Compatibility anchor |
|---|---|---|---|---|---|---|---|---|---|
| CORE-01 | App shell and runtime | Work Core / core | REUSE | wired but not visually checked | modules/agent-core.md | P-01 | R0 / CORE-01-A | READY_FOR_SPEC | Active candidate: ZCode desktop shell and supervised CLI Host; Pi Agent Core public loop schedules Host-owned requests/tools/persistence. Retained Craft AppShell is comparison only; complete platform/kernel acceptance remains open. |
| CORE-02 | Project/Workspace boundary | Work Core / core | EXTEND | wired but not visually checked | modules/agent-core.md | P-03 | R1 / CORE-02-A | PACKET_DRAFT | Active candidate: folder-backed Project, ordinary conversation backing directory (`workspacePurpose: conversation`), project grouping exclusion and Work outside Project/detach are wired. Retained Craft shell changes are separate. Remote, legacy-record and owner acceptance remain open; no new project store. |
| CORE-03 | Session and chat | Work Core / core | REUSE/EXTEND | wired but not visually checked | modules/agent-core.md | P-02 | R3,R4 / CORE-03-A | READY_FOR_SPEC | Active candidate: ZCode V4 Session/row protocol and Host store, queued input/Guide and shared attachment viewers; ordinary generated-output projection is under rectification. Retained Craft SessionManager is comparison, not the candidate writer. |
| CORE-04 | Structured tasks, scheduling and task-center projection | Work Core / core | EXTEND | backend wired but not visually checked; default task-center surface not implemented | modules/agent-core.md | P-04 | R4,R6 / CORE-04-A | READY_FOR_SPEC | Candidate retains original ZCode task/session and journaled workflow mechanisms; Fleet task-contract/task-center extension remains open. Retained Craft TaskRunner is reference only, never another candidate scheduler. |
| CORE-05 | Settings and preferences | Work Core / core | EXTEND | wired but not visually checked | modules/agent-core.md | P-05 | R1,R2 / CORE-05-A | READY_FOR_SPEC | Candidate settings retain readable category/service names at narrow widths and zoom, using original navigation and writers; built desktop self-check complete, owner visual acceptance pending. Broader Fleet settings work remains open. |
| CORE-06 | Search, filters and saved views | Work Core / surface | EXTEND | wired but not visually checked | modules/agent-core.md | P-06 | R0 / CORE-06-A | READY_FOR_SPEC | Candidate retains original task, command and file search; Fleet cross-domain search is not implemented. Craft Session search/filter/view projections are retained comparison only. |
| CORE-07 | Onboarding and first-run | Work Core / surface | EXTEND | wired but not visually checked | modules/agent-core.md | P-07 | R2 / CORE-07-A | READY_FOR_SPEC | Candidate removes hosted sign-in/startup questionnaire/purchase dependencies and uses local setup; complete first-connection and release-independence acceptance remains open. Craft first-run flow is retained comparison. |
| CORE-08 | Help, docs and support | Work Core / surface | EXTEND | not implemented | modules/agent-core.md | P-08 | R2 / CORE-08-A | READY_FOR_SPEC | Active candidate: packaged en/zh Help, enabled Guide Skill and restricted on-demand topic read share source. Topic/content completeness, Help Settings-draft/duplicate-tab recovery and owner experience remain open; retained Craft docs are comparison only. |
| CORE-09 | Updates, packaging and distribution | Integrations / adapter | EXTEND | not implemented | modules/agent-core.md | P-09 | R2 / CORE-09-A | READY_FOR_SPEC | Active candidate updater is disabled before normal startup/manual network dispatch; no Fleet feed or signed distribution closure. Retained Craft updater/download/quit-install risk applies to app/ only. |
| CORE-10 | Internationalization and identity | Work Core / capability | EXTEND | wired but not visually checked | modules/agent-core.md | P-01,P-05 | R1 / CORE-10-A | READY_FOR_SPEC | Active candidate uses ZCode locale/identity primitives with en/zh Fleet strings; remaining inherited names, accessibility literals, appId/profile/signing and platform convergence need acceptance. Craft i18n remains retained comparison. |
| CORE-11 | Panels, docking and layout | Composition / surface | EXTEND | fixed-column sizing wired but not visually checked; registered/movable host not implemented | modules/components.md | P-10 | Early R15/R18 foundation (`specs/R18-right-workbench.md`), then R18 native-window closure / CORE-11-A,WB-001..003 | PACKET_DRAFT | after the R0 baseline exit, early R15/R18 foundation reuses current surfaces; shared layout model and old right workbench are absent |

### Files, evidence and information

| ID | Capability | Context / kind | Class | Status | Loop | Surfaces | Release / acceptance | State | Compatibility anchor |
|---|---|---|---|---|---|---|---|---|---|
| INFO-01 | Workspace files and file tools | Information / core | REUSE/EXTEND | wired but not visually checked | modules/browser.md | P-11 | R0,R3 / INFO-01-A | READY_FOR_SPEC | Active candidate FileService/Agent native file tools are real; atomic-save failure preservation and concurrent expected-revision publication are open integrity defects. Retained Craft filesystem is comparison only. |
| INFO-02 | Library and ArtifactRef | Information / product | NEW | not implemented | modules/browser.md | P-12 | R5 / INFO-02-A | READY_FOR_SPEC | one version/provenance authority |
| INFO-03 | Browser evidence and capture | Information / product | EXTEND | Candidate browser wired but not visually checked; Fleet capture/evidence not implemented | modules/browser.md | P-15,P-16 | R3,R5 / BRW-001..004 | READY_FOR_SPEC | candidate has stable in-shell Chromium guests, real find/stop and native menus; extension lifecycle and governed evidence remain open; retained Craft auxiliary browser preserved |
| INFO-04 | Document ingestion and conversion | Information / capability | EXTEND | wired but not visually checked | modules/browser.md | P-13 | R3 / INFO-04-A | READY_FOR_SPEC | Candidate format-specific preview/extraction and attachment reads exist; complete native ingestion/conversion provenance and fidelity remain open. Retained Craft Sources are comparison only. |
| INFO-05 | Document editing and preview | Creative Media / product | EXTEND | preview wired but not visually checked; native document editing not implemented | modules/canvas.md | P-14 | R3 preview-only; R10 native documents; R13 advanced deck/motion / INFO-05-A | PACKET_DRAFT | TipTap editor exists with a playground caller only; preview is not editable Word/Excel/PowerPoint/PDF |
| INFO-06 | Search indexing and retrieval | Information / surface | EXTEND | wired but not visually checked | modules/browser.md | P-06 | R0,R3 / INFO-06-A | READY_FOR_SPEC | Craft search/view projection; no claim of Fleet cross-domain index |
| INFO-07 | Provenance and citation | Information / capability | NEW | not implemented | modules/browser.md | P-16 | R5 / INFO-07-A | READY_FOR_SPEC | ArtifactRef + timeline evidence |
| INFO-08 | Import/export and migration | Information / capability | EXTEND | not implemented | modules/browser.md | P-17 | R2,R5 / INFO-08-A | READY_FOR_SPEC | Fleet local export was withdrawn; format import/export and migration need native-owner fidelity proof |

### Agent, execution and collaboration

| ID | Capability | Context / kind | Class | Status | Loop | Surfaces | Release / acceptance | State | Compatibility anchor |
|---|---|---|---|---|---|---|---|---|---|
| EXEC-01 | Permissions, approvals and safety | Governed Execution / core | EXTEND | wired but not visually checked | modules/agent-core.md | P-18 | R2,R4 / EXEC-01-A | READY_FOR_SPEC | Craft mode-manager + PreToolUse; prior Fleet child-permission narrowing requires revalidation |
| EXEC-02 | Actions and caller-aware action seam | Governed Execution / core | NEW/EXTEND | Model Settings and General operations wired but not visually checked; broader domain operations not implemented | modules/agent-core.md | P-05,P-18,P-50 | R4 / EXEC-02-A | READY_FOR_SPEC | OV-062: page-local contextual Agent operation is a product-base exit gate; reuse one Session, permission and domain-write path |
| EXEC-03 | Terminal and local execution | Governed Execution / core | EXTEND | wired but not visually checked | modules/agent-core.md | P-19 | R0,R4,R18 / EXEC-03-A | PACKET_DRAFT | Candidate has native shell execution, background tasks and Node-PTY terminal service; complete Fleet command-runner/remote/platform/Stop evidence remains open. Retained Craft Bash is comparison only. |
| EXEC-04 | Multi-agent delegation | Governed Execution / product | EXTEND | Craft child Sessions/TaskRunner wired but not visually checked; Fleet delegation gates not implemented | modules/agent-core.md | P-20 | R6 / EXEC-04-A | READY_FOR_SPEC | Candidate child runtime/background registry uses the existing Host Session/tools/permission path; Stop-after-I/O defect and Fleet TaskBrief/RunReport/delegation gates remain open. Retained Craft TaskRunner is reference only. |
| EXEC-05 | Runtime/provider adapters | Governed Execution / adapter | EXTEND | candidate Pi, Claude/Codex native and retained Craft lanes wired but not visually checked; native governed execution and general CLI adapters not implemented | modules/agent-core.md | P-21 | R0,R6 / EXEC-05-A | PACKET_DRAFT | candidate Pi and Claude/Codex SDKs use Host permissions/receipts/usage; native resume is locally proved; native Guide and governed HTTP-attempt admission remain absent; Antigravity runs as a native executor (live two-turn resume verified); Cursor/Kimi/OpenCode run through one ACP executor whose permission requests use the Host approval card (fake-agent UI proof; live plans inactive); vendor tools are not yet Host receipts |
| EXEC-07 | Worktree isolation | Governed Execution / capability | NEW | not implemented | modules/remote.md | P-23 | R6 / EXEC-07-A | READY_FOR_SPEC | Git/process lifecycle |
| EXEC-08 | Inherited execution isolation | Governed Execution / capability | REUSE/EXTEND | wired but not visually checked | modules/agent-core.md | P-18,P-24 | R0,R2 inherited-boundary verification; second sandbox excluded / EXEC-08-A | READY_FOR_SPEC | existing permission, filesystem/network/env and script-isolation paths; validate and correct under R0/R2. A second OS/container sandbox is excluded, not queued for R18 |
| EXEC-09 | Remote, cloud execution and later phone connector | Governed Execution / adapter | EXTEND | Craft remote routing wired but not visually checked; Fleet pairing not implemented | modules/remote.md | P-25 | R14 / EXEC-09-A | READY_FOR_SPEC | Candidate retains SSH/WSL/Docker stdio deployment/routing and cleanup; SSH server trust and real patched-runtime/platform equivalence remain open. Fleet device pairing/scoped grants/phone connector are not implemented; retained Craft routing is reference. |
| EXEC-10 | Automations and scheduler | Integrations / capability | EXTEND | wired but not visually checked | modules/agent-core.md | P-26 | R4 / EXEC-10-A | READY_FOR_SPEC | Candidate automation repository, scheduling/history and dispatch are real; partial-settlement/reclaim history reconciliation and complete runtime/platform acceptance remain open. Retained Craft scheduler is comparison only. |
| EXEC-11 | Messaging and channel adapters | Integrations / adapter | EXTEND | not implemented | modules/remote.md | P-27 | R14 / EXEC-11-A | PACKET_DRAFT | Candidate contains Telegram/Feishu/Weixin runtime, bind-code/sender/workspace checks and permission reply bridge; complete governed channel delivery/retry/revoke/platform proof remains open. Retained Craft gateway is comparison, not the candidate owner. |
| EXEC-13 | Git repository, branch and PR review delivery | Integrations / product | EXTEND/NEW | not implemented | modules/remote.md | P-54, P-60 | R14 / EXEC-13-A (diff ladder starts R3-era per C4) | READY_FOR_SPEC | Candidate Git status/diff/branch/stage/commit/push/checkpoint and gh workflow Skill exist. Complete scoped worktree/PR/DeliveryReceipt/reconnect acceptance remains open; Git is not another task authority. |
| EXEC-14 | System prompt, effective execution profile and agent identity configuration | Governed Execution / capability | EXTEND | not implemented | modules/context.md | P-55 | TE1,R3 / EXEC-14-A | READY_FOR_SPEC | one prompt/tool projection over provider + permission seams |
| EXEC-15 | Specified local-app Computer Use Component | Governed Execution / Component | EXTEND/NEW | not implemented | modules/remote.md | P-18,P-56 | R16 after R0 + Component foundation / EXEC-15-A | PACKET_DRAFT | R16 after R0 and Component foundation; SYS-02 helper/permission/target proof. Browser/process routes remain existing mechanisms; no general Core controller or second sandbox |

### Intelligence economics and memory

| ID | Capability | Context / kind | Class | Status | Loop | Surfaces | Release / acceptance | State | Compatibility anchor |
|---|---|---|---|---|---|---|---|---|---|
| INTEL-01 | Context/effective capability projection and compaction | Intelligence / capability | EXTEND | Craft context indicator/compaction wired but not visually checked; full effective projection not implemented | modules/memory.md | P-29 | TE1,R3,R9 / INTEL-01-A | READY_FOR_SPEC | Candidate prompt/tool/Skill projection, deferred search, compaction and model-bound ring exist; final declaration budgeting and complete effective-loadout/revocation proof remain open. Retained Craft context is comparison only. |
| INTEL-02 | Token optimization and cache strategy | Intelligence / capability | EXTEND | not implemented | modules/memory.md | P-29 | TE1,R3 / INTEL-02-A | PACKET_DRAFT | Candidate prefix/cache scope, sparse context facts and projected tools are real mechanisms; accepted-outcome/token-efficiency evidence and full physical-call accounting remain open, not inferred from short prompts or SDK choice. |
| INTEL-03 | Model routing and capability negotiation | Intelligence / adapter | NEW/EXTEND | candidate API/native model evidence and endpoint/credential binding wired but not visually checked; optional Host classifier wired but not visually checked; full automatic routing not implemented | modules/models.md | P-30 | R17 / INTEL-03-A | PACKET_DRAFT | ZCode candidate extends existing provider/account owners for explicit endpoints, account-native catalogs with checked Codex refresh, platform-specific API catalogue and completion/signature contracts, persistent manual corrections, model evidence, queue-time subscription binding, CC Switch conversion, localized diagnostics and sourced Fast settings. Public ChatGPT registration/routing and Claude native resume are locally proved; complete vendor coverage and live/visual acceptance remain open. Scoped ordinary/page/vision defaults are active under OV-086/088; favorites and duplicate child-agent entries remain retired. Optional classifier configuration and deferred Decide now use the existing Provider, permission, request, artifact and usage owners, with local transport/SQLite/renderer proof; automatic consumers, quantitative plugins and live/owner acceptance remain open. See the model-connection and model-decisions contracts for exact paths and evidence. |
| INTEL-04 | Cost and usage ledger | Intelligence / core | NEW/EXTEND | ZCode API-equivalent model/project view wired but not visually checked; full economics not implemented | modules/context.md | P-30 | TE1,R3,R17 / INTEL-04-A | READY_FOR_SPEC | ZCode model_usage owns request/account/model/source facts, public API estimates and coverage; old payment data is compatibility-only. Native tool/Skill facts share that ledger. Project panel, Agent customization, complete unit/history coverage and a simple subscription-value comparison with correctable sourced plan price remain open. Complex billing-period allocation and the obsolete account price row stay retired (OV-057). |
| INTEL-05 | Layered agent-maintained memory | Intelligence / product | NEW | not implemented | modules/memory.md | P-31 | R9 / MEM-001..005,INTEL-05-A | READY_FOR_SPEC | Candidate has opt-in project-memory extraction and CLI-specific defaults; its missing physical usage is an audit defect. Fleet autonomous D5 floors/reviewed-memory/curation target remains not implemented. |
| INTEL-06 | Prompt, skill and context loadouts | Intelligence / capability | EXTEND | not implemented | modules/memory.md | P-32 | R15 / INTEL-06-A | READY_FOR_SPEC | Candidate scoped Skill/Agent/MCP discovery/loading exists with Host tool fences; unsupported semantic metadata diagnosis, future-turn withdrawal and Project-suite composition are open. |
| INTEL-07 | Evaluation and regression evidence | Intelligence / capability | NEW | not implemented | modules/context.md | P-33 | R3,R17 / INTEL-07-A | READY_FOR_SPEC | verifier separate from executor |

### Creative and media surfaces

| ID | Capability | Context / kind | Class | Status | Loop | Surfaces | Release / acceptance | State | Compatibility anchor |
|---|---|---|---|---|---|---|---|---|---|
| CREATE-01 | Spatial canvas and orchestration | Composition / surface | NEW | not implemented | modules/canvas.md | P-34 | R7 / CAN-001..005 | PACKET_DRAFT | production board hosts generation/editing/layout; native document/sequence owners keep domain truth; prior preview absent |
| CREATE-02 | Video and media editing | Creative Media / product | NEW | not implemented | modules/media.md | P-35 | R12 / VID-001..004 | PACKET_DRAFT | candidate xAI video generation/retrieval has local transport, Host/permission, binary artifact and restart fixtures; native sequence/editing remains absent and is not promoted by generated MP4 output |
| CREATE-03 | Image generation and editing | Creative Media / product | NEW | xAI/OpenAI API image generation/editing wired but not visually checked; subscription media and full Job path not implemented | modules/media.md | P-36 | R11 / CREATE-03-A | READY_FOR_SPEC | existing Provider, Session permission, binary artifact and ledger owners; exact catalog/model checks, reference inputs and unknown-submission receipts have local fixtures; no paid provider or owner visual acceptance |
| CREATE-04 | Audio, voice and music | Creative Media / product | NEW | not implemented | modules/media.md | P-37 | R12 / CREATE-04-A | READY_FOR_SPEC | media Job + track provenance |
| CREATE-05 | Captions, transcript and translation | Creative Media / capability | NEW/EXTEND | not implemented | modules/media.md | P-38 | R12 / CREATE-05-A | READY_FOR_SPEC | word ranges map to clips |
| CREATE-06 | Design editor | Creative Media / product | NEW | not implemented | modules/canvas.md | P-39 | R10 / DSN-001..004 | PACKET_DRAFT | transactional native schema |
| CREATE-07 | Web artifact editor/preview | Creative Media / product | NEW | not implemented | modules/canvas.md | P-40 | R10 / CREATE-07-A | READY_FOR_SPEC | isolated preview + ArtifactRef |
| CREATE-08 | Deck and presentation | Creative Media / product | NEW | not implemented | modules/media.md | P-41 | R13 / DECK-001..004 | PACKET_DRAFT | native document + exporters |
| CREATE-09 | Motion graphics and animation | Creative Media / capability | NEW | not implemented | modules/media.md | P-42 | R13 / CREATE-09-A | PACKET_DRAFT | composition/renderer adapter |
| CREATE-10 | Storyboard and shot planning | Creative Media / product | NEW | not implemented | modules/media.md | P-43 | R12 / CREATE-10-A | READY_FOR_SPEC | plans link to media/artifacts |
| CREATE-11 | Templates, brand kits and reusable assets | Creative Media / capability | NEW | not implemented | modules/canvas.md | P-44 | R10,R13 / CREATE-11-A | READY_FOR_SPEC | Library assets + provenance |
| CREATE-12 | Export, render and delivery profiles | Integrations / capability | NEW | not implemented | modules/media.md | P-45 | R5,R8,R10-R14 / CREATE-12-A | READY_FOR_SPEC | Job output + fidelity declaration |
| CREATE-16 | Long-form narrative and content generation | Creative Media / product | NEW | not implemented | modules/canvas.md | P-14 | R10 / CREATE-16-A | READY_FOR_SPEC | native document authority + governed generation actions |

### Orchestration and extensibility

| ID | Capability | Context / kind | Class | Status | Loop | Surfaces | Release / acceptance | State | Compatibility anchor |
|---|---|---|---|---|---|---|---|---|---|
| ORCH-01 | Workflow definition editor | Composition / product | NEW | not implemented | modules/workflow.md | P-46 | R8 / WF-001..004 | READY_FOR_SPEC | finite typed DAG |
| ORCH-02 | Workflow execution and run history | Governed Execution / surface | NEW | not implemented | modules/workflow.md | P-47 | R8 / ORCH-02-A | READY_FOR_SPEC | Candidate journaled dynamic workflow executor/CLI tools exist separately from future Fleet workflow UI; interrupted world-run effect replay and full run-history/acceptance remain open. Retained Craft TaskRunner is comparison only. |
| ORCH-03 | Component manager and Project suites | Intelligence / product | EXTEND | not implemented | modules/components.md | P-48,P-56 | Project-scoped right-tool foundation (`specs/R18-right-workbench.md`), before domain components / ORCH-03-A | READY_FOR_SPEC | OV-023/OV-024: Project folder selects suites and right tools; preserve Session/permission owners; prior shared Component resolver is absent |
| ORCH-04 | Agent tool registry and MCP | Governed Execution / adapter | EXTEND | not implemented | modules/marketplace.md | P-48,P-56 | R4,R6 / ORCH-04-A | READY_FOR_SPEC | Candidate one ToolRegistry/Host executor and MCP adapters/pool exist; Project executable trust, unique plugin namespaces, future-turn withdrawal and complete caller-aware domain operation gate remain open. |
| ORCH-05 | Jobs, queues and resource scheduling | Integrations / core | NEW | candidate media receipt/retrieval wired but not visually checked; general queues and resource scheduling not implemented | modules/media.md | P-49 | R11-R13 / JOB-001..004 | READY_FOR_SPEC | native Session artifacts retain intent/request/terminal receipts and stable video output; local stop/reopen, unknown outcome, original credential, missing-file and ledger-repair fixtures; no second Job database or complete queue/platform claim |
| ORCH-06 | Event stream and activity history | Work Core / core | EXTEND | wired but not visually checked | modules/orchestration.md | P-50 | R3,R4 / ORCH-06-A | READY_FOR_SPEC | Candidate V4 rows/Session journal, model/tool/usage receipts and event projections are real; received-result publication ordering and auxiliary-call coverage remain open. Retained Craft timeline is comparison only. |
| ORCH-07 | Notifications, approvals and inbox | Composition / surface | EXTEND | not implemented | modules/orchestration.md | P-51 | R4,R6 / ORCH-07-A | READY_FOR_SPEC | permission/session evidence |
| ORCH-08 | Diagnostics, health and recovery | Integrations / capability | NEW | not implemented | modules/agent-core.md | P-52 | R0,R2,R18 / ORCH-08-A | READY_FOR_SPEC | failure classification |
| ORCH-10 | Skill marketplace and loadout distribution | Intelligence / product | NEW/EXTEND | not implemented | modules/marketplace.md | P-56,P-57 | R15 / ORCH-10-A | READY_FOR_SPEC | Candidate installer and scoped Skill discovery support real packages; semantic compatibility, provenance/integrity, Project composition and withdrawal acceptance remain open. |
| ORCH-11 | Component marketplace and lifecycle | Governed Execution / product | NEW/EXTEND | not implemented | modules/marketplace.md | P-56,P-58 | R15 / ORCH-11-A | READY_FOR_SPEC | trust, permissions, install/update/rollback, runtime isolation, and workspace enable/override records |
| ORCH-12 | MCP server marketplace and connector registry | Governed Execution / adapter | NEW/EXTEND | not implemented | modules/marketplace.md | P-56,P-59 | R15 / ORCH-12-A | READY_FOR_SPEC | Candidate scoped MCP definitions/discovery/connections are real; catalog trust, namespaced identity, credentials/health/revocation and full connector-marketplace acceptance remain open. |

## Acceptance gates

This index prevents page and registry rows from carrying empty acceptance anchors. The `-A` IDs
below are breadth gates: they become executable only when copied into an active module/release spec
with a concrete code path, evidence command and status. They are intentionally not marked done.

| ID | Observable criterion (minimum) | Evidence required |
|---|---|---|
| CORE-01-A | Shell launches and routes to every usable baseline surface without a duplicate host | dev launch + route smoke |
| CORE-02-A | A Project boundary resolves one workspace root and rejects an out-of-bound path | boundary test + trace |
| CORE-03-A | Session stream, cancellation and event history use one Session authority | RPC/data-path trace |
| CORE-04-A | Structured task mutations round-trip through the existing task store; any task-center view remains a projection and ordinary R1 Sessions need no duplicate Task record | task-store test + projection/data-path audit |
| CORE-05-A | Settings changes persist and are read from one settings home | settings test |
| CORE-06-A | Search/filter/view state is a projection and survives reload without copying domain data | view test |
| CORE-07-A | First-run creates or selects a workspace and reports missing provider setup honestly | onboarding smoke |
| CORE-08-A | Help links identify local, user-configured and unavailable sources | state walkthrough |
| CORE-09-A | Update check/install failure is visible and never points to a Craft-owned channel | packaging smoke |
| CORE-10-A | zh-Hans/en labels and stable identity IDs remain consistent across shell and settings | i18n check |
| CORE-11-A | Opening two native surfaces preserves layout while domain state remains in its owner | layout smoke |
| INFO-01-A | File actions enforce workspace containment and report conflict/denial explicitly | path + permission test |
| INFO-02-A | A produced artifact has an exact version and a single provenance owner | artifact data-path trace |
| INFO-03-A | A permitted browser capture links session, URL/time and artifact provenance | browser capture trace |
| INFO-04-A | Ingestion produces a readable source plus conversion provenance or an explicit failure | ingestion fixture |
| INFO-05-A | A production editor opens, edits, saves and reopens each claimed real format through its native owner; preserve originals, report unsupported constructs, and prove human/Agent edits plus dirty/conflict/save recovery. Preview acceptance alone does not satisfy editing | per-format fixtures + save/reopen and failure traces; R3 proves only preview |
| INFO-06-A | Search results can be refreshed/rebuilt without becoming a source-of-truth copy | index rebuild test |
| INFO-07-A | Citation points to immutable evidence and shows unavailable/deleted source truth | provenance fixture |
| INFO-08-A | Import/export preserves source separately and declares unsupported fidelity | migration fixture |
| EXEC-01-A | A denied or approval-required action is blocked by the shared policy path | PreToolUse test |
| EXEC-02-A | A feature page opens a target-bound compact Agent conversation from right-click and keyboard/touch action; human and Agent invoke the same version-checked domain command through one Session/permission path, and the page refreshes committed state | page-local explanation/edit/denial/restart/conflict trace |
| EXEC-03-A | Terminal output, cancel, restart and failure states are observable and scoped to a session | terminal smoke |
| EXEC-04-A | Delegation creates a child in the existing Session/Task tree and returns a validated report | delegation trace |
| EXEC-05-A | A runtime adapter reports supported/unsupported capabilities without guessing | adapter contract test |
| EXEC-07-A | Worktree occupancy and cleanup are idempotent and never confused with a location path | lifecycle test |
| EXEC-08-A | Retained execution enforces its declared filesystem/network/process limits through core policy; denied/unsupported cases fail visibly and cancel/restart cleans owned resources. No new container lifecycle is implied | inherited-path boundary and cleanup fixtures under R0/R2 |
| EXEC-09-A | Remote disconnect and grant revocation prevent further execution with honest status | transport test |
| EXEC-10-A | An automation invokes governed actions and records schedule/run outcome in existing history | scheduler smoke |
| EXEC-11-A | Channel failure/reconnect is isolated from local core and scoped to a workspace | adapter test |
| EXEC-13-A | Git/branch/PR actions are attributed, permissioned, reviewable and cannot replace the Task/Session authority | Git fixture + permission trace |
| EXEC-14-A | One Craft-owned effective prompt/tool projection is versioned, scoped and attributable; profile changes cannot silently weaken policy or create a second harness | prompt/profile fixture + policy regression |
| EXEC-15-A | Optional local-app Component observes/acts/verifies only the selected app/window through host permission and fresh target identity; Stop/revoke prevents queued input, unknown delivered effects reconcile; no general Core controller or second sandbox | SYS-02 helper comparison and disposable-app/office-app observe-act-verify-stop fixtures, including denial, stale targets and crash |
| INTEL-01-A | Context projection lists included/excluded evidence and can be compared before sending | projection fixture |
| INTEL-02-A | Token/cache optimization lowers cost per accepted outcome on a sealed model×harness×task comparison, preserves quality and a switch-off path | usage + acceptance benchmark |
| INTEL-03-A | Model capability negotiation rejects unsupported parameters before execution | adapter test |
| INTEL-04-A | Cost ledger distinguishes real, estimated and unknown usage and never treats unknown as zero | ledger fixture |
| INTEL-05-A | Authorized autonomous memory consolidation records sources and scope, respects pins and excludes secrets; user curation/deletion removes retained content and derived indexes without rewriting raw history | MEM-001..005 under the single consolidation writer |
| INTEL-06-A | Install, loadout and runtime states are distinct and permissioned | loadout test |
| INTEL-07-A | Evaluation result names the tested input, verifier and artifact evidence independently of executor | regression fixture |
| CREATE-01-A | Canvas projects native records, invokes one governed action and persists no domain duplicate | Electron canvas smoke |
| CREATE-02-A | Video imports media, applies a shared edit command and produces a cancellable real render | media fixture + render job |
| CREATE-03-A | Image generation/editing returns a provenance-bearing artifact through the shared Job path | job fixture |
| CREATE-04-A | Audio/voice/music tracks retain source, timing and generation provenance | media fixture |
| CREATE-05-A | Transcript ranges map deterministically to captions/clips and expose translation failure | mapping fixture |
| CREATE-06-A | Design mutations are schema-valid ordered batches with attribution and inverse/recovery scope | mutation test |
| CREATE-07-A | Web preview is isolated, versioned and cannot silently mutate the source artifact | preview smoke |
| CREATE-08-A | A deck has a native source model and export output with declared fidelity limits | export fixture |
| CREATE-09-A | Motion composition renders through a replaceable adapter and reports missing assets | renderer test |
| CREATE-10-A | Storyboard shots link to media/artifacts and survive reordering without losing identity | storyboard fixture |
| CREATE-11-A | Template/brand assets have provenance, scope and safe reuse boundaries | library fixture |
| CREATE-12-A | Export profile creates one Job output receipt and preserves source/output separately | delivery smoke |
| CREATE-16-A | Long-form generation applies governed document actions, preserves human edits and records prompt/model/source provenance | document generation fixture |
| ORCH-01-A | Workflow definition validates a typed finite DAG and rejects cycles/stale versions | schema test |
| ORCH-02-A | Workflow run projects TaskRunner status and never creates a second run authority | run trace |
| ORCH-03-A | Component registration and scoped activation reuse existing Settings/Skill/Source owners; show requested versus granted capability, support disable/unload and preserve native data | FND-01..08 host and resolver/lifecycle fixtures |
| ORCH-04-A | Tool/MCP registration uses the shared action/policy path and records capability scope | registry test |
| ORCH-05-A | Job queue supports progress, cancel, retry and resource limits through one authority | queue test |
| ORCH-06-A | Activity history correlates events to the owning Session/Task/Artifact without duplication | event trace |
| ORCH-07-A | Inbox approval/notification resolves to a real permission or session event | inbox smoke |
| ORCH-08-A | Diagnostics classifies failure and offers only a recovery action that actually exists | failure fixture |
| ORCH-10-A | Skill marketplace discovers origin/integrity-verified manifests, requiring signatures where the distribution contract specifies them, shows compatibility/permissions, installs into a scoped loadout, and supports disable/update/rollback | marketplace fixture |
| ORCH-11-A | Component marketplace verifies provenance and license, previews requested capabilities, requires permission approval, isolates runtime, and recovers from failed update/uninstall | plugin lifecycle test |
| ORCH-12-A | MCP marketplace registers server capabilities and health, scopes credentials per grant, exposes tool risk before install, and removes/revokes a server without stale tools | MCP registry test |

### Promotion rule

When a row enters an active spec, replace the minimum criterion with the release-specific Given /
When / Then, add exact files/symbols and run commands, and set the status in both the packet index
and registry. A page is not `usable` merely because this index has an ID.

### Packet subcriteria namespace

Starter packets use short subcriteria names (`VID-001`, `CAN-001`, `BRW-001`, `MEM-001`, `JOB-001`,
`DSN-001`, `DECK-001`, `WF-001`, and `WB-001`) for readability. They are not a second acceptance
authority: each resolves to one canonical registry criterion below, and an active spec must carry
the exact Given/When/Then and evidence path.

| Packet prefix | Canonical registry criterion |
|---|---|
| VID | CREATE-02-A |
| CAN | CREATE-01-A |
| BRW | INFO-03-A |
| MEM | INTEL-05-A |
| JOB | ORCH-05-A |
| DSN | CREATE-06-A |
| DECK | CREATE-08-A |
| WF | ORCH-01-A |
| WB | CORE-11-A |
| FND (foundation spec FND-01..08) | CORE-11-A + ORCH-03-A; detailed current acceptance lives in `modules/components.md` |

## Product matrix

> **Every product domain, always.** The module registry is the anti-omission breadth authority;
> this matrix maps those capabilities to product behavior, authorities and acceptance. No domain is
> ever deleted from design because of integration ordering (Decision G5). Durable module depth lives
> in `modules/`; an implementation slice gets a full spec in `modules/` when it becomes ACTIVE, and its pages live in
> [`capabilities.md`](#page-structure). Rows must stay honest: update a row in the
> same slice that changes its facts. Current implementation is the Craft v0.13.4 baseline restored
> on 2026-09-21; prior Fleet extensions remain at `snapshot/pre-rebuild-2026-09-21`. Inherited
> runtime paths without fresh complete acceptance are `wired but not visually checked`; neither
> snapshot acceptance nor passing component tests establishes a usable product loop.
>
> Reference admission grades come from the **single admission authority**
> [`references/references.md`](references.md)
> (`FORMAL_REFERENCE | MODULE_REFERENCE | LOCAL_IMPROVEMENT | EVIDENCE_ONLY | REJECT`; unaudited =
> *candidate*). A named project is never license to copy its shell (Decision F3). Unfinished
> admission work belongs to that registry and the consuming suite's execution/proof contract.

### How to read a row

| Column | Meaning |
|---|---|
| Status | capability vocabulary for the domain's *core loop* today |
| Gap | the biggest missing piece between today and the vision |
| Reference to audit | first external source to inspect, with admission state; this is not a selected dependency |
| Backend authority | the one Craft/Fleet authority that owns the state (never duplicated) |
| Acceptance anchor | where its criteria live or will live |

### A. Work core

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Sessions & work list | CORE-03, ORCH-06 | session lifecycle, streaming, queueing, steering, event stream/activity timeline, one list | `wired but not visually checked` | Craft Board is a Sessions view mode; P5 permits a separate navigator only as the same Session/Task projection | Craft v0.13.4 | SessionManager + SessionEvents | [`product.md`](product.md) |
| Project / execution workspace | CORE-02 | one folder-backed Project; ordinary conversations have a private backing directory; scoped local/remote identity | `wired but not visually checked` for candidate paths | OV-024/027 select the folder boundary. Project suites, remote/legacy verification and owner acceptance remain open; internal execution workspace identity is not another user-facing Project layer. | Active ZCode candidate; retained Craft comparison | existing candidate file/workspace service and TaskIndex | [`product.md`](product.md) |
| Tasks, scheduling & later task center | CORE-04 | optional structured tasks, statuses, scheduler; Kanban as its own navigator | `wired but not visually checked` inherited Task/Session mechanisms; Fleet Board separation `not implemented` | current `board` route resolves to Sessions `viewMode: board`; P5 permits a separate navigator; it does not require a second store or duplicate Conversation list | Craft v0.13.4 | Task stores + Session | `/board` vs `sessions` |
| Permissions & safety | EXEC-01 | modes, PreToolUse gate, approvals, command validation | `wired but not visually checked` (Craft) | caller-aware policy identity across Ask (R4); explainable command rules (S3) | Craft; `software/codex` EVIDENCE_ONLY (rule shape) | mode-manager + PreToolUse + SessionManager | R4 spec |
| Terminal & local execution | EXEC-03 | Bash + background shell, output/cancel/restart truth | `wired but not visually checked` (Craft baseline) | Fleet-wide target contract; interactive PTY = CONDITIONAL (real caller gate) | Craft | Bash/background path in SessionManager | R18 implement-or-`NO_GAP` closure |
| Settings | CORE-05 | Candidate Settings navigator, original preference writers and scoped page entry | `wired but not visually checked`; broader domain edits remain absent | Candidate and retained Craft are distinct implementations; no second preference store | Active ZCode candidate; Craft interaction comparison | SettingService, Provider writer and renderer preference owner | [`modules/services.md`](modules/services.md) |
| Search, labels, archive & views | CORE-06, INFO-06 | search indexing/retrieval, dynamic views, filters, archive/recovery | `wired but not visually checked` | Original search/filter/archive remain; Fleet navigation and shared full/compact scope corrections were withdrawn. Cross-domain search is owned by R5 / INFO-06. | Craft | search/views + labels + Session commands | R1 |
| Automations | EXEC-10 | schedules, automation handlers | `wired but not visually checked` (Craft) | route through governed actions once R4 exists | Craft | automations + scheduler | R4 follow-up |
| Onboarding | CORE-07 | first-run, workspace creation, provider setup | `wired but not visually checked` (Craft) | plain-language pass; no Craft-service implication (P8) | Craft | Electron onboarding flow | R2 spec |

### B. Files, artifacts and evidence

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Workspace files | INFO-01 | file tools, containment, permissioned mutation | `wired but not visually checked` (Craft) | version/precondition conflict rules; generic file history is `not implemented`. Recovery is `none` unless a verified snapshot/commit covers the exact version. R5 defines measured lease/renewal/reconciliation and atomic-write recovery; expiry alone is not proof that a writer stopped | Craft | Workspace filesystem + file tools | R5 |
| Storyboard and shot planning | CREATE-10 | shot identity, ordering and regeneration for the video timeline | `not implemented` | source-to-shot links and deterministic grid manifest | storyboard/video candidate pool; no formal reference | sequence/storyboard + ArtifactRef | R13 / CREATE-10-A |
| ArtifactRef & Library | INFO-02, INFO-07, CREATE-11 | exact versions, provenance, cross-surface handoff, Library view, templates/brand kits as reusable Library assets | `not implemented` | first producer→consumer pair; minimal envelope seed (D6, adopted from review): `{ id, version, kind, nativeOwner, workspaceId }` — no speculative fields (no `consumers[]`) | `plugins/markitdown` MODULE_REFERENCE-candidate (ingestion only) | none yet — smallest new authority at R5 | R5 |
| Browser & evidence | INFO-03 | Browser guests, capture, annotate, governed CDP | `wired but not visually checked` (candidate Chromium guest and retained Craft baseline); extension lifecycle and capture/evidence `not implemented` | evidence-capture policy surface (E6); artifact links | ZCode owner; Craft/Cindy/OpenChamber mechanisms; extension-host comparison under OV-076 | BrowserGuestManager + browser tools; retained BrowserPane | R3 exercises evidence |
| Document ingestion | INFO-04, INFO-08 | PDF/Office/… source ingestion and previews through source-backed adapters | `wired but not visually checked` (ingestion/previews) | editable round-trip is `not implemented`; adapter revision, source ArtifactRef and fidelity report; no parser reimplementation by default | GenOffice engines; `plugins/markitdown` ingestion; Univer comparison with Pro boundary | Sources + Component format adapters | — |

### C. Orchestration and runtimes

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

### D. Intelligence economics

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| Context & token optimization | INTEL-01, INTEL-02 | **layered token economy (E12/E13)**: effective projection + ArtifactRef/TaskBrief structural savings · L1 prefix/cache alignment · L2 deterministic data reduction (optional external RTK Bash/output adapter exists) · L3 agent-directed compaction · L4 gated model-assisted trim · L5 output profiles · L6 reviewed cross-session injection; ROI ledger | Optional RTK binary adapter + usage events + existing compaction `wired but not visually checked` (Craft); RTK requires the enabled preference and a detected compatible binary, otherwise commands pass through unchanged; Fleet TE1 accounting utility absent; visible cache measurement and Fleet profile optimization `not implemented`; L3+ gated | TE1 observes only; after R0 baseline, prompt diet/tool projection/Pi-light require a separate bounded slice; R3 is the cross-domain trace; R5/R6 supply ArtifactRef/TaskBrief | [context-economy evidence](references.md#retained-context-economy-observations); owner inventory; Databricks/Pi/OpenHands/Hermes/OpenClaw mechanism evidence; RTK is an external binary adapter; its historical source checkout is absent; LLMLingua-2 gated | UsageTracker + existing prompt/tool/compaction paths — one ledger, no second memory or harness | TE1 + SYS-03 first proof + `modules/context.md` §6 |
| Model routing & cost | INTEL-03, INTEL-04 | one ledger (real/estimated/unknown), routing default-off, API lanes only | usage/thinking and isolated ZCode endpoint binding `wired but not visually checked`; full routing/ledger `not implemented` | E3 ledger fields; OV-029 keeps user API endpoints outside platform-account gateway routing | [provider mechanisms](references.md#hermes-openclaw-and-cc-switch) | existing model binding and UsageTracker owners | R17 implement-or-`NO_GAP` closure |
| Memory & experience | INTEL-05 | layered agent-maintained files (working notes → curated layers), logged consolidation, scoped retrieval, optional curation | `not implemented` | needs completed traceable chains (R3+) | REJECT: universal memory engines | Workspace files + Session evidence | R9 |
| Evaluation & regression evidence | INTEL-07 | verifier runs separate from the executor, regression fixtures, accepted-outcome evidence | `not implemented` | needs completed traceable chains to grade (R3+); the verifier never shares state with the executor it grades | — | Session evidence + repository tests | R17 implement-or-`NO_GAP` closure |
| Reasoning and runtime modes | EXEC-05, INTEL-03 | exact per-model reasoning choices plus separate speed/service/runtime modes | `wired but not visually checked` for advertised Pi/API reasoning choices and the first-party fast toggle; complete multi-runtime projection `not implemented` | OpenCode CLI variants still need typed classification; Fleet generic runtime-mode storage/projection is absent; re-measure model support against current v0.13.4 mappings before porting prior fixes | — (E9/E9a) | backend adapters + existing settings authority | per-adapter capability tests plus P-30 owner acceptance |

### E. Creation surfaces

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

### F. Platform

| Domain | Registry IDs | Key capabilities | Status | Gap | Reference to audit | Backend authority | Acceptance anchor |
|---|---|---|---|---|---|---|---|
| App shell & runtime | CORE-01 | Electron main/renderer shell, Bun workspace processes, React app frame | `wired but not visually checked` (Craft v0.13.4) | do not rearrange chrome as Cindy work; admit Craft capabilities (Pages) | Craft v0.13.4 | Electron main + renderer bootstrap | [`product.md`](product.md) |
| Capabilities / Skills / plugins | ORCH-03, INTEL-06 | install / loadout / runtime separation; provenance; global/Workspace Component activation | Craft Skills/Sources `wired but not visually checked`; registered Component host/runtime `not implemented`; Fleet types/resolver are absent | after R0 baseline exit, host before domain Components; additive entries/panels with user-owned placement; no count cap or blanket R6/R9 prerequisite | Cindy capability ownership/install targets; DeepSeek Harness scoped slots/disposal | existing user/Workspace settings + Skills/Sources/tool registries; derived composition | early R15/R18 foundation (`modules/components.md`), then R15 distribution |
| Skill marketplace | ORCH-10 | discover, inspect, compatibility, examples, verified-origin install, scoped loadout, update/rollback | `not implemented` | ORCH-10 manifest, trust and transaction gates | Codex/Cursor/Claude marketplace patterns; local-first improvement required | SYS-08 catalog + SYS-03 loadout | ORCH-10-A |
| Component marketplace | ORCH-11 | installable bundles of panels, domain commands, Skills, MCPs, knowledge defaults and assistant suggestions; global/workspace enablement | `not implemented` | bundle transparency, runtime isolation, changed-capability review, unified Craft design language, additive host slots, global/workspace overrides | Cindy SkillHub/install targets; DeepSeek Harness UI slots; OpenChatCut official video-component evidence; Qoder/TRAE discoverability only | SYS-08 package lifecycle + SYS-01 grants + workspace composition | ORCH-11-A |
| MCP marketplace | ORCH-04, ORCH-12 | server/tool/resource registry, auth scope, health, risk, revoke and offline/local source | `not implemented` | ORCH-12 per-tool grant, credential and transport gates | Claude MCP catalog, Cursor MCP plugins, Codex custom MCP review | SYS-08 registry + SYS-01 policy | ORCH-12-A |
| Messaging | EXEC-11 | IM gateways, routing, reconnect, approval routing | `not implemented` for Fleet's Workspace-scoped adapter (Craft messaging + WhatsApp worker are `wired but not visually checked`) | Workspace-scoped adapter contract; honest platform absence | first candidate `software/hermes-agent` (admission pending); comparison `software/openclaw` (admission pending) | messaging gateway + settings | R14 |
| Notifications & approvals inbox | ORCH-07 | notification routing, approval inbox surfaces over permission/session evidence | `not implemented` | inbox stays a projection of the existing permission path; no second approval authority | — | permission path + SessionEvents | R14 |
| Diagnostics & recovery | ORCH-08 | health checks, failure classification, recovery guidance | `not implemented` | classify runtime/connectivity failures honestly before any automated recovery | — | logger + health-check paths | R18 implement-or-`NO_GAP` closure |
| Panels & layout | CORE-11 | user resize/move/reorder, in-window float/re-dock and scoped restore | fixed-column sizing `wired but not visually checked`; registered/movable host `not implemented` | reuse the Files popover and Notes RPC; mount a Notes consumer, preserve drafts/context; Fleet right sidebar and pure layout tree are absent | existing Craft stack and Cindy mechanics first; compare installed drag utilities/tree with Dockview/FlexLayout only against this contract; no dependency selected | one renderer layout representation + existing Workspace/window preferences | early R15/R18 foundation; R18 later closes native multi-window behavior |
| Workflows | ORCH-01, ORCH-02 | finite versioned DAG over governed actions | `not implemented` | R4+R5 first; E5 edge-class rules | FlowGram EVIDENCE_ONLY (editor pattern only) | definition projected onto Craft TaskRunner | R8 |
| Updates & distribution | CORE-09 | Fleet-controlled/user-configured channel; never Craft binary | `not implemented` for Fleet distribution. The current update boundary is `wired but not visually checked`: no installer import, download or pending-update quit hook; no Fleet channel is configured | owner acceptance of the R2 updater slice; Fleet release channel remains an owner checkpoint | — | auto-update + builder config | [`modules/services.md`](modules/services.md) |
| Help & docs | CORE-08 | bundled docs, docs MCP, visible-external links | local Settings Help path `wired but not visually checked`; full version-matched multilingual guidance `not implemented` | owner acceptance of the R2 docs-links slice | — | docs modules + session-mcp-server | R2 spec |
| i18n & identity honesty | CORE-10 | zh-Hans coverage, service-class labeling | inherited seven-locale registry, zh-Hans and persisted language selection `wired but not visually checked`; Fleet branding/service labeling `not implemented` | R1/R2 acceptance | — | i18n catalogs + branding | R1 spec |

### G. Technology routes (per module, judged — not all deferred)

The per-module technology stance (not capability status). **decided** = the boundary/route is
binding, but code still requires an ACTIVE spec; **proposed** = the recommended route, confirmed
inside the module's spec at activation; **gated** = choice waits for a named gate. Rationale beyond one line lives in
[`agent-core.md`](modules/agent-core.md#orchestration) and the reference map.
Any route that names an external mechanism is still subject to the admission-v2 record in
[`references/references.md`](references.md); a route can be useful
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
| Token/context | Layered pipeline per `modules/context.md`: three-zone prefix stability + ledger cache fields (new work after R0 and the TE1 baseline), optional external RTK rewriting, CAT-pattern compaction tool (on measured pressure), LLMLingua-2-style trim (gated); connectors (repomix/context7/codegraph) via Sources/MCP | decided (framework, E12) · per-layer gates | Leaner context measurably raises capability (context rot); every optimizer measured, switchable, honest (`unknown` ≠ 0) |
| Messaging | hermes-agent adapter patterns (admission pending) behind one Workspace-scoped contract | proposed | Channel failure must never block local core |
| Execution isolation | Validate and correct current Craft isolation through its existing permission path | decided | R0/R2 boundary checks; no second OS/container sandbox or R18 sandbox lifecycle |
| Multi-panel layout | candidate docking libraries (no library selected) | gated | R18 foundation owns the first real panel caller; compare the existing layout model and candidates before adopting a dependency |
| Remote/cloud | Craft transport + P7 scoped grants; no relay, no control plane | decided | Owner-set product identity (P7/P8/P9) |

### Update rules

1. A slice that changes any fact in a row updates the row **in the same slice**.
2. A domain becoming ACTIVE gets its full spec in `modules/` (template §References consumed wires the
   reference column in).
3. New references enter via `源码参考/meta/` admission — never directly here.
4. Adding a domain requires an owner request or a real discovered capability; deleting one requires
   an owner decision recorded in [`decisions.md`](decisions.md).
5. **Every row in sections A–F declares its `Registry IDs`.** `—` is allowed and means no registry
   row covers the domain — an honest gap, not a formatting choice. `scripts/validate-doc-contracts.py`
   fails on a missing or unknown ID and runs from `scripts/fleet-verify.sh`. Section G (technology
   routes) is exempt: it records stance per module, not capability coverage.

#### Coverage check

Run `python3 scripts/validate-doc-contracts.py` for current capability/page/acceptance joins.
Historical July join counts and retired collaboration/telemetry IDs are not current scope.
EXEC-15 carries R16's bounded local-app Component; general Core control and a second sandbox stay excluded.
A valid join proves coverage, not semantic agreement or an implemented feature.

## Craft capability map

> Use this as an index, not a reading assignment. Find the row for the active capability, inspect
> the listed code, then confirm with `rg`. Third-party comparisons live in
> [`源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](../源码参考/meta/CAPABILITY-REFERENCE-MAP.md).
> Product behavior is [`product.md`](product.md). Current `app/` is the Craft **v0.13.4** baseline restored on 2026-09-21.
> Fleet extensions from the prior tree are preserved at `snapshot/pre-rebuild-2026-09-21`;
> their previous status does not carry into this baseline.
> v0.10.5 is a *look* comparison, not a shell to restore. Cindy decides feature implementation,
> not chrome rearrangement. Do not overlay new surfaces onto `AppShell.tsx`.

### Classification

- **REUSE** — call or improve the existing Craft authority.
- **EXTEND** — add behavior to the existing authority and migrate every caller coherently.
- **NEW** — Craft has no authority for it; still connect it to existing Session, permission,
  timeline, Workspace, and Task boundaries.
- **CONDITIONAL** — do not build until a real caller or measured failure proves the need.

If a capability is absent, inspect current code before adding one concise row. Never add a second
session, permission path, timeline, task/job store, settings home, browser stack, or shell.

Paths are relative to `app/`.

### How to execute a map row

A row is a locator and boundary, not a complete specification. For a REUSE fix, inspect the listed
authority and its callers. For EXTEND / NEW, follow the route:

```text
current Craft authority → binding decision/spec → exact missing edge
→ first real producer + consumer → observable failure/recovery proof → promoted shared contract
```

A technical detail is binding only when present in current code, the numbered documents, an active
spec, or the current owner request. Deleted historical documents are never an implicit
specification; the retained failure lessons live in [`architecture.md`](architecture.md) §3.

### Core authority map

| Capability                                  | Current authority / code entry                                                                                          | Class        | Fleet boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session lifecycle and persistence           | `packages/server-core/src/sessions/SessionManager.ts`; `packages/shared/src/sessions/`                                  | REUSE        | One Session authority.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Session evidence                            | `packages/shared/src/protocol/dto.ts` `SessionEvent`; protocol events/channels                                          | REUSE/EXTEND | Extend events only when a real consumer needs durable or attributed evidence. The future WorkTrace projection uses source/derived event references and current/shadowed/log-only folding; it is not a second timeline.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Work modes, permission modes and Agent gate | `packages/shared/src/agent/{mode-manager,mode-types}.ts`; `packages/shared/src/agent/core/pre-tool-use.ts`; SessionManager approval flow | EXTEND | Craft permission modes and `SubmitPlan` are inherited. Fleet automatic work phases and `EnterPlan` are `not implemented`; `work-mode.ts` is absent. Independent Plan plus action permission remains an owner design input, outside the current entry slice. The legacy automatic-phase/Settings-only proposal is superseded; the new policy is `not implemented`. |
| Agent session tools | `packages/session-tools-core/src/tool-defs.ts`, `packages/session-tools-core/src/handlers/`, `packages/session-tools-core/src/context.ts` | EXTEND | Registry covers Agent tools, not human RPC or SDK built-ins. Inherited `SubmitPlan` pauses for review; Fleet `EnterPlan` is absent. |
| Human/Agent shared actions                  | UI RPC + Agent tool/PreToolUse + owning service                                                                         | EXTEND       | **`not implemented` as a generic seam.** Route: [`modules/agent-core.md`](modules/agent-core.md#release-contract--r4-action-seam). The future seam carries caller provenance, operation/attempt correlation, exact input/output ArtifactRef versions and structured conflict/replan results; WorkTrace is projected from Session/Action/Job/Artifact events. Record & Replay extracts user-selected semantic Action sequences into reviewed Skills rather than replaying raw coordinates. |
| Usage and context accounting | `packages/shared/src/agent/core/usage-tracker.ts`; provider usage events | EXTEND | One inherited usage path. Fleet TE1 `CacheEconomySummary` and `cache-economy.ts` are absent after the reset; normalized cache-economy projection and visible cache columns are `not implemented`. Real/estimated/unknown cost must extend this path, never a second ledger. |
| Prompt queue and mid-turn steering          | `SessionManager.messageQueue`, `sendMessage`, `processNextQueuedMessage`; backend `redirect`; composer queue projection | EXTEND       | Preserve disk-before-ack and restart replay. Queued prompts render from the Session-owned FIFO above the composer; edit/remove updates that same queue and persisted transcript rather than a renderer-only list.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Project/Workspace | Workspace config/root plus current nested Project compatibility | REUSE/EXTEND | A Project is bound to its folder and grouped in the conversation sidebar; New Conversation's picker creates/reuses it. Legacy Workspace selection and remote reconnect remain for old records. Project-scoped suites/right tools and storage migration are `not implemented`. |
| Sessions, tasks, Board and scheduling       | SessionManager/SessionEvents; `packages/shared/src/tasks/`; `packages/server-core/src/tasks/`; Session status/labels; scheduler  | REUSE/EXTEND | The separate Board sidebar entry now opens Craft's existing `board` route and Sessions/Task projection; the old list/Board toggles are removed. The isolated desktop UI shows both entries, but owner look-and-feel acceptance is pending. There is no second task/job store or Conversations list. Dashi Taskboard is evidence for optimistic task transitions only; its SQLite issue store and Codex injection are not imported. |
| Task execution integrity / drift control    | Task store + TaskRunner + SessionEvents + PreToolUse + UsageTracker                                                     | EXTEND       | Craft TaskRunner and child Sessions are the starting mechanisms. The earlier Fleet delegation kernel, leases, TaskBrief/RunReport validation, inline strip and verifier were discarded; R6 remains `not implemented`. |
| Settings, credentials, Sources and Skills | shared stores/managers; `apps/electron/src/renderer/pages/settings/AiSettingsPage.tsx`; `apps/electron/src/shared/settings-registry.ts` | REUSE/EXTEND | Inherited Craft AI settings, connection defaults, credentials, Sources and Skills remain. `config/paths.ts` owns the selected profile root; credentials and startup/default Workspace/server state must honor `CRAFT_CONFIG_DIR` without falling back to another profile's data. Fleet unified model presentation and classified runtime modes remain bounded; Grok subscription device login, account model discovery, and Grok/Codex read-only allowance projection are `wired but not visually checked`, while other subscription allowance adapters remain `not implemented`. The approved model interaction contract remains Page Architecture §3B; one settings/connection authority. |
| Identity labels and statuses                | `packages/shared/src/labels/`; status configuration                                                                     | REUSE/EXTEND | Labels are metadata over work. Definitions have one Settings home; Session menus assign them; label results are projections. Labels never store Assistant identity or loadout. |
| Assistant identity and requested loadout | no Fleet Assistant store, RPC or selector in the current tree | EXTEND | `not implemented`. `packages/shared/src/assistants/` and the prior catalog/create/wear backend are absent after the reset. The approved identity authority remains independent of labels; permission is a request evaluated by the existing permission path. |
| Search, archive and dynamic views | `packages/shared/src/search/`; `packages/shared/src/views/`; Session archive commands | REUSE/EXTEND | Original search/views and archive commands remain. Fleet shared full/compact scope and navigation corrections were withdrawn. Preserve useful predicates; cross-domain search is owned by R5 / INFO-06. |
| Automations                                 | `packages/shared/src/automations/`; server automation handlers; scheduler                                               | REUSE/EXTEND | Extend existing scheduler/Session/Task paths.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### Runtime and execution map

| Capability                            | Current authority / code entry                                                                                                  | Class                     | Fleet boundary                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude/Pi backends                    | `packages/shared/src/agent/claude-agent.ts`, `pi-agent.ts`, shared tool context                                                 | REUSE                     | Provider differences stay behind existing backend seams.                                                                                                                                                                                                                                                                                                        |
| Additional CLI/API/ACP runtimes       | backend seam + SessionManager adapters                                                                                          | EXTEND                    | One adapter contract: start/attach/send/cancel/approve/health/stop; all events map into Fleet authorities. CLIProxyAPI is an external Go proxy reference only, not a second Fleet model gateway. |
| Built-in Read/Write/Edit/Bash         | SDK built-ins plus `packages/shared/src/agent/core/pre-tool-use.ts`                                                                                       | REUSE                     | Permission checks stay in PreToolUse.                                                                                                                                                                                                                                                                                                                           |
| Command validation                    | shared Bash/PowerShell validation and permissions config                                                                        | REUSE/EXTEND              | Extend command-aware validation; never trust names or external `readOnlyHint` alone.                                                                                                                                                                                                                                                                            |
| Background shell                      | Bash background path; shell/task events in SessionManager                                                                       | EXTEND                    | Reuse existing execution registry and events.                                                                                                                                                                                                                                                                                                                   |
| Interactive PTY                       | no complete authority                                                                                                           | NEW, CONDITIONAL          | R18 implement-or-`NO_GAP`: only for a real interactive caller; reuses Session permission/evidence/cancellation.                                                                                                                                                                                                                                                 |
| OS isolation                          | `packages/session-tools-core/src/runtime/{filesystem-isolation,network-isolation,sandbox-env}.ts`; `packages/session-tools-core/src/handlers/script-sandbox.ts` | REUSE                     | Preserve and harden the existing permission/process/filesystem/network boundary. A second OS/container sandbox is closed `NO_GAP` by `product.md`; R18 does not reopen it. |
| Checkout/worktree isolation           | Git/process integration                                                                                                         | NEW                       | Execution location, checkout isolation, and provider choice stay independent (P9).                                                                                                                                                                                                                                                                              |
| Multi-Agent execution                 | child Sessions, `parentSessionId`, TaskRunner DAG, background-task registry                                                     | REUSE/EXTEND              | Existing child-Session/TaskRunner mechanisms remain one authority. Fleet permission intersection, TaskBrief/RunReport gates, leases, verifier and inline delegation projection were discarded and are `not implemented` until R6. No Team/Leader product or second store. |
| Adaptive organization                 | orchestration policy over existing Task/Session authorities                                                                     | EXTEND                    | R17: route by measured risk/cost (C5–C6) using R6+ accepted-outcome evidence, or close `NO_GAP`.                                                                                                                                                                                                                                                                |
| Model routing/fusion                  | backend seam + UsageTracker                                                                                                     | EXTEND/NEW, CONDITIONAL   | R17 implement-or-`NO_GAP`; default off and API/OAuth lanes only (E3).                                                                                                                                                                                                                                                                                           |
| Context projection / token economy    | existing compaction, large-response paths, `packages/shared/src/agent/core/rtk-rewrite.ts`, UsageTracker; provider prompt/tool assembly                   | EXTEND, CONDITIONAL       | E12/E13. RTK is an optional external-binary adapter, not an in-repo compression engine: disabled, missing/incompatible or failed rewrites pass through unchanged. Reuse the one ledger and existing provider lanes. TE1 is observation-only; after R0 + baseline, extend one centralized effective projection for prompt/tools and test Pi-light as a profile, never a second kernel. ArtifactRef/TaskBrief remain R5/R6; typed compression and Tool Search require measured gates. Raw evidence stays recoverable.      |
| Specified local-app Computer Use | Existing broker, Session evidence and Component host; native app observation/input is absent | EXTEND/NEW | `not implemented`; bounded R16 Component after R0 + host. [SYS-02](modules/remote.md#local-app-computer-use-contract) owns helper comparison, scoped app/window grants and takeover. No general Core controller or second sandbox. |

### Files, artifacts and production surfaces

| Capability                               | Current authority / code entry                                           | Class              | Fleet boundary                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace files | Workspace filesystem and existing file tools | REUSE/EXTEND | Containment, permissions, errors and recovery stay on the native filesystem path. Fleet `acceptDeliverable` is absent after the reset; the R3 acceptance-copy helper is `not implemented`. No second byte store. |
| Concurrent file leases                   | none                                                                     | NEW                | Only for the first real multi-writer loop; filesystem bytes remain native authority.                                                                                                                                                                                                                                                                  |
| ArtifactRef and Library                  | none                                                                     | NEW                | Versioned reference/provenance envelope over native bytes (roadmap R5); never a second byte store.                                                                                                                                                                                                                                                    |
| Document ingestion                       | Sources + preview/tool conversion paths; Component format adapters       | EXTEND             | Prefer source-backed open-source parsers/converters over Fleet reimplementation. Preserve original ArtifactRef, adapter revision, bundled license boundary and conversion provenance; unsupported features remain explicit.                                                                                                                                                                                                                             |
| Code intelligence                        | MCP/Sources                                                              | REUSE, CONDITIONAL | Optional provider; degrades cleanly.                                                                                                                                                                                                                                                                                                                  |
| BrowserPane and CDP                      | Electron BrowserPane/CDP and `browser_tool`                              | REUSE/EXTEND       | One browser authority (E6); current auxiliary windows and commands are `wired but not visually checked`. Phone simulation, durable history search, immediate user takeover and Fleet evidence capture are `not implemented`; see SYS-04 for exact observed limits. Browser Harness is a reference for CDP/MCP helper separation, not a general external-computer control surface. |
| Pages local mini-apps | `packages/shared/src/pages/`; server Pages handlers; renderer PageView | REUSE/EXTEND | Original local Pages and default-enabled hosted publication remain. Local Pages is not the production canvas; R2 publication removal is not implemented. |
| Markdown/HTML/PDF/image/diagram previews | existing renderer preview components                                      | REUSE              | Mounted preview paths are `wired but not visually checked`. Direct document editing is not implemented; the TipTap component currently has only a playground caller and does not prove file round-trip. No second Markdown editor. |
| Workbench panels | `apps/electron/src/renderer/components/app-shell/{AppShell,PanelStackContainer,PanelResizeSash,SessionInfoPopover}.tsx`; `apps/electron/src/renderer/atoms/panel-stack.ts` | EXTEND | Inherited side-by-side sizing and Files popover are `wired but not visually checked`. Notes RPC exists without a renderer caller; the Fleet right sidebar and layout tree are absent. Generic registration and user move/reorder/float are `not implemented`. Early host contract: `modules/components.md`. |
| Spatial canvas | no production canvas pane in the current tree | NEW | Production surface per `product.md`: generate/edit/layout on one board. `not implemented`. A future `surface:canvas` route is a contract, not an existing authority. |
| Native design documents                  | no Fleet schema authority                                                | NEW                | Decision E11; Penpot/GenOffice/Open Design are source evidence and possible adapter/component inputs, not a second design authority.                                                                                                                                                                                                                                                                                                      |
| Finite workflows                         | no complete workflow authority                                           | NEW                | DAG invokes governed actions and existing Task/runtime/permission paths (roadmap R8).                                                                                                                                                                                                                                                                 |
| Creative modules                         | existing files/previews plus R4 action, R5 ArtifactRef and R11 Job seams | NEW                | R10–R13: each module owns only its native schema (E4), selects source-backed format/render adapters where useful, and extends the Craft shell/authorities.                                                                                                                                                                                                                                                        |
| Built-in extensions | existing tool/Sources/Skills/permission/settings authorities | EXTEND | Registered Component activation is `not implemented`; `shared/src/components/` types and resolver are absent after the reset. Early R15/R18 foundation connects real surfaces, scoped overrides and lazy activation before domain components. Left/right are additive-entry defaults; placement belongs to one host. No blanket R6/R9 gate. |
| Governed experience                      | Session evidence + Workspace knowledge                                   | NEW                | Layered agent-maintained memory files + logged consolidation (roadmap R9, D5 floors); curation optional; no hidden second store.                                                                                                                                                                                                                      |

### External services and distribution

The owner restored original Craft source. Fleet updater, publication, telemetry, help and relay
corrections were withdrawn and are not implemented. R0 currently prepares the joint review; the
original observed service paths and proposed R2 outcomes must remain distinct.


| Capability                   | Current authority / code entry                  | Class                  | Fleet boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------- | ----------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP and external providers   | `packages/shared/src/mcp/`; Sources             | REUSE/EXTEND           | Optional connector; absence must not break startup.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| CLI client                   | `apps/cli/` and server transport                | REUSE/EXTEND           | Reuse commands and transport; no second local daemon by default.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Configuration CLI | bundled `craft-agent` wrappers and command reference | EXTEND | Implementation packages are absent; the earlier Fleet unavailable guard was removed. Audit the original wrapper/caller before proposing its removal or correction. |
| Remote/self-hosted execution | `packages/server-core/src/{bootstrap/headless-start,transport/server}.ts`; `apps/electron/src/renderer/pages/settings/ServerSettingsPage.tsx`; Workspace routing | EXTEND | Inherited Craft server/token settings and remote Workspace transport are `wired but not visually checked`. Listener auth validates the shared server token; Fleet per-device grants, one-time invites, endpoint racing/reachability, host grouping and composer run-target selection are `not implemented` after the reset. `shared/src/remote/`, `main/server-mode.ts` and `main/handlers/remote-devices.ts` are absent. P7 scoping/revocation and P9-rev local-first remote connection remain requirements, not delivered security guarantees. No Fleet relay cloud. |
| SSH remote machines | no `packages/remote-ssh/` in the current tree | EXTEND | `not implemented`. The prior Cindy-derived parked library and tests were removed in the reset and remain in the snapshot. P9-rev does not make SSH host management the remote-connection surface; any future bootstrap role needs its own bounded admission. |
| GitHub delivery              | EXEC-13; OpenChamber decides Git/PR | EXTEND | Durable code handoff after remote work. `not implemented` as a Fleet GitHub surface; pairing must not grow a second file-sync. |
| Messaging                    | messaging gateway/workers and settings/handlers | REUSE/EXTEND           | One Workspace-scoped adapter contract; platform absence honest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Desktop OAuth                | existing local callback path                    | REUSE                  | Independent of Craft cloud.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| WebUI/Slack OAuth relays     | shared auth relay modules                       | EXTEND                 | **`not implemented` in the v0.13.4 baseline.** Prior Fleet relay configuration is absent. `FLEET_OAUTH_RELAY_URL` and `FLEET_SLACK_OAUTH_RELAY_URL` do not exist in the tree; `auth/oauth-relay.ts:3` hardcodes the Craft callback with no override, and `auth/slack-oauth.ts` defaults to it.                                                                                                                                                                                                                                                                                                                                                                        |
| Conversation Markdown export | Current Session storage and sharing commands; Fleet export helper absent | EXTEND | not implemented: the Fleet local export command/UI was withdrawn; original hosted sharing remains. R2 owns the proposed local replacement and existing-share cleanup. |
| Application updates | main/auto-update.ts; electron-builder.yml; version/manifest.ts | EXTEND | Original automatic download and quit installation from the Craft feed remain. Fleet channel safety/removal is not implemented; review R2 before patching. |
| Product telemetry | main/renderer/preload entry points and build defines | EXTEND | Original Sentry ingest configuration and machine identity remain. Fleet telemetry removal is not implemented; keep local diagnostics distinct from uploads. |
| Binary install/release | `scripts/install-app.sh`; `.ps1`; existing source build scripts | EXTEND | Original upstream installer scripts remain; Fleet distribution is not implemented. Do not run these as a Fleet install or restore their removed guard without approved scope. |
| Server container | `Dockerfile.server` | EXTEND | `not implemented` as a verified build path: inherited COPY instructions refer to absent `packages/craft-agents-commands/package.json` and `packages/craft-cli/package.json`. Non-root runtime guidance exists; no image-build/smoke evidence is claimed. |
| Help/docs | docs/index.ts; docs/doc-links.ts; prompts/system.ts; renderer/native help consumers | REUSE/EXTEND | Local Help routing and the inherited full-document reader are wired but not visually checked by the owner. English bodies still need feature-by-feature review, and complete translated guide coverage is not implemented. |
| Upstream intake              | pinned Craft reference, tags, release notes     | REUSE                  | Selectively port reviewed changes; never merge wholesale.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Reference routing

Open-source checkouts are owner-controlled evidence caches, not Fleet modules; removal requires
the exact retention decision in AGENTS and the reference registry. For a capability
comparison, use [`源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](../源码参考/meta/CAPABILITY-REFERENCE-MAP.md).
Open a checkout only when current code leaves a concrete question unanswered. A listed project is
only a candidate until source-level implementation, same-task superiority, credible alternatives,
the bounded local-improvement test, authority fit, licensing, and retention value all pass the
admission rules in [`源码参考/meta/PLAYBOOK.md`](../源码参考/meta/PLAYBOOK.md).

### Summary

Craft already provides the product spine: Session, permission, evidence events, backends and tools,
background execution, MCP, Sources, Skills, credentials, Tasks, views, automations, scheduler,
settings, browser, previews. Fleet's genuinely new work is limited to proven gaps — the action
seam, file coordination, ArtifactRef/Library, bounded delegation, finite workflows, native creative
documents, governed experience — each attached to the existing spine through one real vertical
behavior loop, in roadmap order.

## Page structure

> The complete page/surface inventory of the target product, the state standard every surface must
> meet, and the rules that let frontend work run **ahead of** backend behavior without repeating the
> display-only catastrophe. Companion breadth index: [`capabilities.md`](#product-matrix).
> Visual/component rules stay in [`DESIGN.md`](../DESIGN.md); owner UI
> philosophy (“do not add entities without necessity”; simplify Craft, do not invent) binds everything here.

### 1. Shell regions

**Current implementation, checked 2026-09-21:** `5a510cf1d` replaced `app/` with Craft
**v0.13.4**; the previous Fleet tree is preserved at `7a8f6d5fa`. Paths and mounted behavior below
refer to the current tree. Earlier acceptance and test counts do not transfer across this reset.
The target inventory and owner decisions remain requirements, not evidence of implemented UI.

The current window uses Craft `AppShell` + `PanelStackContainer`.
`app/packages/shared/src/layout` is absent after the reset; its earlier model is archived, not
an available implementation dependency.

`AppShell.tsx` + `MainContentPanel.tsx` are Craft's current host, but Fleet's target navigation is
panel-first: a list stays visible while details, configuration, previews and component tools open in
the existing workbench/dialog layer. A route may remain as a deep-link and accessibility anchor,
but it must not create a second persistent list or force a page drill-in when a panel is sufficient.
Settings is one settings surface with a category navigator and content panels; its categories are
not separate product homes. Archive management remains a settings projection over the Session
authority, not a second conversation home.

**Do not add an unrelated capability by adding an `isXNavigation` branch or a new sidebar row.**

The table distinguishes current code from target pane names; there is no mounted generic pane registry.

| Region | Current code / target seam | Notes |
| --- | --- | --- |
| Layout engine | `components/app-shell/PanelStackContainer.tsx` | Current horizontal stack; the registered layout-tree target is `not implemented` |
| Nav sidebar | target pane `nav-sidebar` | chrome, not a destination |
| Navigator | target pane `navigator` | The single Conversation/entity list when the sidebar is unavailable; filters and scopes are predicates, not sibling list homes |
| Main | target pane `main` | conversation is one pane |
| Workbench | target pane `workbench` | plugin and tool surfaces |
| Production surfaces | target pane kinds (`surface:canvas`, documents, browser, timeline) | Fleet's own; open as panes, never as sidebar rows |
| Dialog layer | shared dialog/drawer components | pickers, confirmations |
| Session files | `components/right-sidebar/SessionFilesSection.tsx`, mounted by `SessionInfoPopover.tsx` | The file list survives in the session popover/drawer. `RightSidebar.tsx` and its Component registry are absent; the general right workbench is `not implemented`. |

What still runs today is Craft **v0.13.4** `AppShell` + `PanelStackContainer`. That is the current
host. Cindy work is capabilities (plugins, skills, remote, assistants), not a new overlay chrome.

#### User-owned panel layout — foundation contract

The owner requested resize, drag/reposition, reordering, floating and restore for conversation and
tool panels. Left tool entries/right panels are defaults, not permanent locks. Those in-window
behaviors execute only after the R0 baseline exit, with the early host foundation in
[`modules/components.md`](modules/components.md#release-contract--r18-component-and-panel-foundation), using mounted Files and a real Notes RPC consumer
before new domain Components. Files survives through the session popover; the former Notes
host is absent and must not be treated as mounted. R15 distribution, R9 memory and advanced/native-window R18
closure are not prerequisites. The current horizontal stack wires sizing; the prior pure layout
tree, Component resolver and right-workbench host were removed by the reset. Their target behavior
is `not implemented`.

The host keeps stable panel ids, Workspace/Session binding, drafts and native resource ownership
while moving views. Keyboard move/resize, local-window geometry, missing-component recovery and
reset-to-default are required. Do not equate installed `@dnd-kit` or a layout type with working
docking, and do not replace Craft's visual tokens to obtain these behaviors.

#### No-duplicate navigation rule

The product-facing work list is one left sidebar with Project groups and folderless Conversations.
Workspace remains the visible configuration/routing boundary. Project selection changes context within
that Workspace; it does not select another Workspace. Board has a separate entry over existing records.
Conversation activity is a derived running/attention/idle projection, not Board's manual categories.
Tool and resource lists/details occupy the contextual right panel or existing content panels reached
through context menus. The panel is a future Cindy-style `RightSidebarShell`/`TabBar` host with a
registered tab-kind seam; it is not a vertical shortcut rail. The later Component registry remains a
separate gated capability.

> **Settled, not open.** The owner rejected building the infinite canvas now ("你不应该现在做无限
> 画布，而且你现在做的无限画布根本都是错误的"), and `FleetLayout` was reverted to
> `PanelStackContainer` because it ignored sashes, board and chrome. On 2026-09-11 the residue of
> that revert — `renderer/layout/{FleetLayout,LayoutRoot,LayoutBridge,registry,ledger,builtinPanels}`
> and `renderer/surfaces/canvas/CanvasPane.tsx`, all with zero production callers, plus three
> orphaned `canvas.*` i18n keys — was removed from that working tree. The shared layout model
> survived that earlier removal, but the 2026-09-21 reset removed it too; retrieve historical
> evidence from `7a8f6d5fa`, never describe that path as present today.
>
> The current host remains Craft `AppShell` + `PanelStackContainer`. Board is again a
> `sessions` view mode; Pages has its own navigator. Both replace the content panel. The pane
> sentences above describe the **R7/R18 target shape**, not today's structure. After the R0 baseline exit, the owner-directed foundation brings the minimum registered host and
> in-window movement before domain Components; R7 reuses it. R18's later gate covers additional
> native-window/advanced behavior, not the minimum host itself.

### 1b. Workspace/Project boundary and current callers

[R1](modules/shell.md) owns the 2026-09-22 authorized implementation: AppShell's
single sidebar, the contextual right-panel host, and the existing Project/Session commands. No
`WorkspaceToolRail`, `WorkspaceFooter`, `WorkspaceResourceHome` or `DraftProjectPicker` exists in the
restored baseline; those names are retired. ProjectInfoPage contains resources/settings, not a second
Conversation list. The new empty layout reuses Craft's ChatDisplay/InputContainer seam. This is an
extension of the restored Craft v0.13.4 baseline; earlier Fleet ProjectHomePage and layout engines remain absent.

### 2. Page inventory — current mounted surfaces

| Page / surface | Status | Current evidence and limits |
| --- | --- | --- |
| ChatPage | `wired but not visually checked` | Mounted conversation and existing Session path; prior Fleet footer/revert acceptance does not transfer |
| ProjectInfoPage · SkillInfoPage · SourceInfoPage | `wired but not visually checked` | Original mounted detail pages; Fleet ProjectHomePage was withdrawn; one-boundary consolidation not implemented |
| ShortcutsPage | `wired but not visually checked` | Existing shortcut surface |
| AutomationInfoPage | `wired but not visually checked` | Mounted from `components/automations/` by `MainContentPanel` |
| Board (kanban) | `wired but not visually checked` | `sessions` navigation with `viewMode: 'board'`; the owner-requested independent Board navigator is `not implemented` |
| Pages | `wired but not visually checked` | Upstream mini-app surface; hosted publication is present and still conflicts with Fleet's local-first contract |
| Settings: AI · App · Appearance · Input · Labels · Messaging · Permissions · Preferences · Server · Shortcuts · Workspace | `wired but not visually checked` | Upstream Settings pages; Server exposes URL/token configuration. Fleet's one-code per-device pairing flow is `not implemented` |
| Composer — Fleet execution-target selector | `not implemented` | `ComposerLeadingChips` / `NewSessionRunTarget` are absent after reset; existing remote Workspace routing is not this interaction |
| Design-system playground window | `display-only` | Debug preview host; no Fleet canvas preview currently exists |
| Browser empty-state page | `wired but not visually checked` | Auxiliary BrowserPane window; the earlier in-shell embedding is absent |
| Onboarding · Reauth · WorkspacePicker | `wired but not visually checked` | Existing startup/recovery callers; no new visual acceptance claimed |

These are the mounted Craft **v0.13.4** surfaces. Fleet's product exclusions still apply: upstream
telemetry, hosted sharing, update endpoints and cloud documentation have not been admitted merely
because the reset restored them. Look rules remain in [`DESIGN.md`](../DESIGN.md).

**Every change to one of these starts from the matching upstream component** —
`源码参考/software/craft-agents-oss/` at the same path. Diff it, then justify each delta. This line
was deleted on 2026-09-11 and both of this repo's UI regressions followed within two days: an agent
invented button sizes and a hand-rolled menu, and another produced a redesign image and treated it
as the spec. Restored, and now also stated as Step 0 in root `AGENTS.md`.

**"Keep Craft's style" is not "keep every old function."** The visual system and the proven
interactions are what carry over. Which functions live, merge, move or die is the owner's call, made
per surface — so when a page is retired, migrate what the owner kept and drop what they did not,
rather than relocating every old button on the assumption that preservation is safety.

### 3. Page inventory — target (the full product)

Status is per capability vocabulary; every target surface obeys **one primary home per
capability**. This inventory is the design-coverage list — building any item still requires its
domain spec (or an owner request) and the frontend-track rules in §5.

| #   | Surface                                          | Surface IDs                  | Domain (matrix row)             | What it shows / does                                                                                                                                                             | Primary home                                                                                                        | Status                                   |
| --- | ------------------------------------------------ | ---------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| T1  | Project resources (Workspace-scoped)                | P-03                         | Project/Workspace               | files, assets, deliverables and settings of one Project; one switcher; no Session-list copy                                                                                      | Project group opens retained assets/settings detail                                                                  | `wired but not visually checked` for navigation and inherited assets/settings; Fleet Project suite home `not implemented` |
| T2  | Deliverables view (`deliverables/` + provenance) | —                            | Files/ArtifactRef               | accepted outputs of a Project                                                                                                                                                    | ProjectInfoPage extension                                                                                           | `not implemented`; the former deliverable convention helper is absent |
| T3  | Library view                                     | P-12                         | ArtifactRef & Library           | selected, indexed, provenance-tracked assets; exact versions                                                                                                                     | R5 page/extension decision                                                                                          | `not implemented`                        |
| T4  | Jobs / generations panel                         | P-36, P-49                   | AIGC jobs                       | running/queued/failed generation jobs, placeholders→results                                                                                                                      | R11 surface decision                                                                                                | `not implemented`                        |
| T5  | Canvas                                           | P-34                         | Canvas                          | spatial command surface per [`agent-core.md`](modules/agent-core.md#orchestration) §4 (cards, edges, Space/Workflow dual modes)                                                            | new page inside shell (R7; DOM family committed per E5a — React Flow default, custom DOM+SVG fallback, spike picks) | `not implemented`                        |
| T6  | Workflow editor/run view                         | P-46, P-47                   | Workflows                       | finite DAG definition + run status                                                                                                                                               | new page (R8)                                                                                                       | `not implemented`                        |
| T7  | Delegation / team view                           | P-20                         | Multi-agent                     | child runs, budgets, RunReports — projections of Session tree                                                                                                                    | Inline `DelegationStrip` on parent ChatDisplay first (no Team page); deeper inspector remains R6                   | `not implemented`; prior `DelegationStrip` and Fleet brief/report gates are absent |
| T8  | Cost, usage & context view                       | P-29, P-30                   | Model routing/cost/context      | per-session/project usage, cache/prefix breaks, prompt/tool/context component inventory, source scope and grants                                                                 | TE1/R3 existing session info first; R17 closes any remaining surface gap                                            | `not implemented`                        |
| T9  | Memory browser & curation                        | P-31                         | Memory & experience             | layered memory files, consolidation log, injected-share display, pin/correct/delete                                                                                              | new page (R9)                                                                                                       | `not implemented`                        |
| T10 | Video editor                                     | P-35                         | Video                           | timeline NLE over project media                                                                                                                                                  | R12 native page decision                                                                                            | `not implemented`                        |
| T11 | Design editor                                    | P-39                         | Design surface                  | schema-backed design docs (E11)                                                                                                                                                  | R10 native page decision                                                                                            | `not implemented`                        |
| T12 | Deck/motion editor                               | P-41, P-42                   | Deck/motion                     | native deck doc + honest export                                                                                                                                                  | R13 native page decision                                                                                            | `not implemented`                        |
| T13 | Web artifact preview+iterate                     | P-40                         | Web artifacts                   | generated site preview, versions                                                                                                                                                 | R10 existing preview extension first                                                                                | `not implemented`                        |
| T14 | Remote targets manager                           | P-25                         | Remote/cloud                    | user-owned instances, grants, health, disconnect truth                                                                                                                           | R14 WorkspaceSettings extension (P7)                                                                                | `not implemented`                        |
| T15 | Capability loadout manager                       | P-32, P-56, P-57, P-58, P-59 | Capabilities/Skills/Marketplace | install / loadout / runtime separation (E2), package trust and rollback                                                                                                          | R15 existing Skills/Sources pages extension plus P-56..P-59                                                         | `not implemented`                        |
| T16 | Evidence/browser capture review                  | P-15, P-16                   | Browser & evidence              | captures, annotations, links to sessions/artifacts                                                                                                                               | R3/R5 BrowserPane + timeline extension                                                                              | `not implemented`                        |
| T17 | Task changes review                              | P-54, P-60                   | Git delivery (EXEC-13)          | per-task diff of project files; verbs 查看改动/应用/放弃/创建 PR per C4 ladder (read-only diff first; apply/discard with R6 worktrees; PR with R14); branches never user-managed | ChatPage/task drawer extension                                                                                      | `not implemented`                        |

New-page justification rule stays binding: a new surface only when the capability genuinely must be
visible and no existing Craft surface can host it (P5). Extensions-of-existing-pages are always the
first choice (T2, T7, T8, T13, T14, T15, T16 are deliberately extensions, not new pages).

### 3A. Canonical surface registry (pages, panels, drawers and command surfaces)

The sixteen target pages above are product-level destinations, not the whole UI. Every registry
capability must map to a surface below before it can be called frontend-covered. A surface can be a
route, panel, drawer, dialog or command view; its host is an existing shell region unless a module
packet explicitly proves a new host is necessary. These IDs are the cross-document join keys used by
[`capabilities.md`](#capability-register).

| ID   | Surface                                                                                                                                | Host / primary home                        | Registry rows                               | State                                                                                                                                                                                                                                         |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-01 | App shell and navigation; global search command surface                                                                                | Global shell                               | CORE-01, CORE-10                            | Craft shell/navigation and Session search `wired but not visually checked`; Fleet cross-domain global search `not implemented` |
| P-02 | Session work/conversation, progressive composer and stream inspector; global/Project New Task triggers share one Session path (P10)    | Conversation                               | CORE-03                                     | Craft conversation and the ZCode candidate busy composer, steering and mid-stream queue `wired but not visually checked`; accepted busy-input/restart/remote delivery still needs verification; prior Fleet turn metadata, changes summary and transcript/file revert surface `not implemented` |
| P-03 | Project resources and draft context picker (revised P6/R1)                                                               | Main content                               | CORE-02                                     | Folder-backed picker and grouped sidebar `wired but not visually checked`; inherited Project assets/settings and legacy Workspace selection remain; suite/right-tool home `not implemented` |
| P-04 | Structured task detail/activity and later task-center projection; Kanban is not the default product surface                            | Task inspector                             | CORE-04                                     | Craft Task store/TaskRunner `wired but not visually checked`; Fleet task-center surface `not implemented` |
| P-05 | Settings navigator and preference forms                                                                                                | Settings                                   | CORE-05, CORE-10                            | upstream Settings forms `wired but not visually checked`; ZCode candidate contextual entry `wired but not visually checked`; broader domain operations and Assistant identity/loadout UI `not implemented`; no ExpertKit-as-label implementation is admitted |
| P-06 | Search and label filters over the one work list; archive management in Settings; global Session/Project-file/Settings/route projection | Sidebar / Settings / command view          | CORE-06, INFO-06                            | Craft Session search and label/project filters `wired but not visually checked`; Fleet archive-in-Settings and cross-domain command projection `not implemented` |
| P-07 | First-run and model connection setup                                                                                                   | First run / Settings → Model               | CORE-07                                     | Craft first-run/model connections `wired but not visually checked`; complete §3B interaction contract `not implemented` |
| P-08 | Help, local docs and support links                                                                                                     | Settings Help + bundled docs    | CORE-08                                     | local reading path `wired but not visually checked`; full version-matched multilingual guidance `not implemented` |
| P-09 | Update channel, release notes and recovery                                                                                             | Settings / dialog                          | CORE-09                                     | Craft update/release-note path `wired but not visually checked`; independent Fleet update channel `not implemented` |
| P-10 | User-controlled resize, move, reorder, in-window float/re-dock and layout restore | Existing shell extended by registered panel host | CORE-11 | fixed-column sizing wired but not visually checked; generic registration, user movement and layout restore not implemented; early R15/R18 foundation before domain Components |
| P-11 | Workspace file browser and file actions                                                                                                | Project home / drawer                      | INFO-01                                     | SessionFilesSection and ProjectHomePage directory/search/preview paths `wired but not visually checked`; advanced file history/actions remain R5 |
| P-12 | Library, versions and asset inspector                                                                                                  | Library route                              | INFO-02                                     | not implemented                                                                                                                                                                                                                               |
| P-13 | Source ingestion and conversion progress                                                                                               | Sources / Jobs                             | INFO-04                                     | Craft source ingestion/conversion `wired but not visually checked`; Fleet provenance extension `not implemented` |
| P-14 | Document editor, preview and co-edit controls                                                                                          | FileViewer overlay / future editor host    | INFO-05, CREATE-16                          | Craft file preview `wired but not visually checked`; native document editing/co-edit `not implemented`; TipTap has a playground caller only |
| P-15 | Browser tabs, navigation and capture controls                                                                                          | Candidate browser guests / retained BrowserPane | INFO-03                                 | candidate in-shell Chromium, find/stop/native menus `wired but not visually checked`; extension lifecycle and governed evidence capture `not implemented` |
| P-16 | Evidence, citation and provenance review                                                                                               | Inspector / timeline                       | INFO-03, INFO-07                            | not implemented                                                                                                                                                                                                                               |
| P-17 | Import, export and migration wizard                                                                                                    | Dialog / settings                          | INFO-08                                     | not implemented                                                                                                                                                                                                                               |
| P-18 | Permission prompt, approval history and policy explanation                                                                             | Dialog / inbox                             | EXEC-01, EXEC-02                            | Craft permission prompt `wired but not visually checked`; caller-aware policy explanation/approval history `not implemented` |
| P-19 | Terminal session, output and cancellation                                                                                              | Session panel / right workbench projection | EXEC-03                                     | Craft Bash/background execution `wired but not visually checked`; Fleet command-runner panel and persistent interactive PTY `not implemented` |
| P-20 | Delegation tree, brief and run report                                                                                                  | Chat / task inspector extension            | EXEC-04                                     | Craft child Sessions/TaskRunner `wired but not visually checked`; Fleet DelegationStrip, TaskBrief and RunReport inspectors `not implemented` |
| P-21 | CLI runtime connection and capability health                                                                                           | Settings → Terminal                        | EXEC-05                                     | Claude native SDK execution/settings are `wired but not visually checked`; native resume is locally verified; native Guide and general CLI discovery/handshake remain `not implemented` |
| P-23 | Worktree occupancy and cleanup                                                                                                         | Task inspector                             | EXEC-07                                     | not implemented                                                                                                                                                                                                                               |
| P-24 | Inherited execution isolation, limits and denial explanation | Existing settings / approval path | EXEC-08 | inherited mechanisms `wired but not visually checked`; R0/R2 verifies actual boundaries; a second sandbox/profile authority is excluded |
| P-25 | Remote target, grant and disconnect state                                                                                              | Workspace settings                         | EXEC-09                                     | Craft remote Workspace URL/token routing `wired but not visually checked`; Fleet target identity, per-device grants and unified pairing `not implemented` |
| P-26 | Automation schedule and run history                                                                                                    | Task / settings extension                  | EXEC-10                                     | Craft automation schedules/history `wired but not visually checked` |
| P-27 | Messaging channels, delivery and reconnect                                                                                             | Settings / inbox                           | EXEC-11                                     | `not implemented`                                                                                                                                                                                                                             |
| P-29 | Context preview, compaction and token budget                                                                                           | Session / cost inspector                   | INTEL-01, INTEL-02                          | v0.13.4 composer context indicator and existing compaction `wired but not visually checked`; Fleet TE1 ledger/breakdown inspector and exact attribution `not implemented` |
| P-30 | Model capability, routing and cost ledger                                                                                              | Session / Settings → Model                 | INTEL-03, INTEL-04                          | upstream model/thinking selection and per-connection multi-model picker visibility `wired but not visually checked`; retained Craft xAI/Copilot catalog adapters and candidate public ChatGPT/legacy ChatGPT/Grok catalogs, Copilot SDK catalog and subscription allowance reads (the composer follows the selected-model request account) are `wired but not visually checked`; generic runtime controls, other subscription allowances and routing ledger remain `not implemented` |
| P-31 | Memory layers, consolidation log and curation (pin/correct/delete)                                                                     | Memory route                               | INTEL-05                                    | not implemented                                                                                                                                                                                                                               |
| P-32 | Skill/capability install, loadout and runtime view                                                                                     | Skills/Sources extension                   | INTEL-06                                    | not implemented                                                                                                                                                                                                                               |
| P-33 | Evaluation run, regression evidence and comparison                                                                                     | Diagnostics / Jobs                         | INTEL-07                                    | not implemented                                                                                                                                                                                                                               |
| P-34 | Spatial canvas and node inspector                                                                                                      | Canvas route / right workbench entry       | CREATE-01                                   | `not implemented`; prior canvas preview/workbench entry is absent |
| P-35 | Video sequence, media bin and timeline                                                                                                 | Video route                                | CREATE-02                                   | not implemented                                                                                                                                                                                                                               |
| P-36 | Image generation/editing and result review                                                                                             | Jobs / media route                         | CREATE-03                        | not implemented                                                                                                                                                                                                                               |
| P-37 | Audio, voice and music tracks                                                                                                          | Media / video route                        | CREATE-04                                   | not implemented                                                                                                                                                                                                                               |
| P-38 | Transcript, captions and translation editor                                                                                            | Video route                                | CREATE-05                                   | not implemented                                                                                                                                                                                                                               |
| P-39 | Native design document and object inspector                                                                                            | Design route                               | CREATE-06                                   | not implemented                                                                                                                                                                                                                               |
| P-40 | Web artifact preview and iterate                                                                                                       | Preview route                              | CREATE-07                                   | not implemented                                                                                                                                                                                                                               |
| P-41 | Deck document and slide inspector                                                                                                      | Deck route                                 | CREATE-08                                   | not implemented                                                                                                                                                                                                                               |
| P-42 | Motion composition and render preview                                                                                                  | Deck / media route                         | CREATE-09                                   | not implemented                                                                                                                                                                                                                               |
| P-43 | Storyboard, shots and plan-to-media links                                                                                              | Media route                                | CREATE-10             | not implemented                                                                                                                                                                                                                               |
| P-44 | Templates, brand kits and reusable asset picker                                                                                        | Library / editor drawer                    | CREATE-11                                   | not implemented                                                                                                                                                                                                                               |
| P-45 | Export profile, render progress and delivery receipt                                                                                   | Jobs / deliverables                        | CREATE-12                                   | not implemented                                                                                                                                                                                                                               |
| P-46 | Workflow definition editor and validation                                                                                              | Workflow route                             | ORCH-01                                     | not implemented                                                                                                                                                                                                                               |
| P-47 | Workflow run, inputs, outputs and history                                                                                              | Workflow / task extension                  | ORCH-02                                     | not implemented                                                                                                                                                                                                                               |
| P-48 | Plugin, tool registry, MCP and loadout permissions                                                                                     | Skills/Sources / settings                  | ORCH-03, ORCH-04                            | `not implemented`                                                                                                                                                                                                                             |
| P-49 | Job queue, resource limits, retry and cancellation                                                                                     | Jobs panel                                 | ORCH-05                                     | not implemented                                                                                                                                                                                                                               |
| P-50 | Activity timeline and event detail                                                                                                     | Session / project timeline                 | ORCH-06, EXEC-02                            | Craft SessionEvents timeline `wired but not visually checked`; Fleet caller-aware evidence detail `not implemented` |
| P-51 | Notifications, approvals and inbox                                                                                                     | Inbox drawer                               | ORCH-07                                     | `not implemented`                                                                                                                                                                                                                             |
| P-52 | Diagnostics, health checks and recovery actions                                                                                        | Help / settings                            | ORCH-08                                     | not implemented                                                                                                                                                                                                                               |
| P-54 | Git repository, branch, diff and PR review                                                                                             | Delivery / task extension                  | EXEC-13                                     | not implemented                                                                                                                                                                                                                               |
| P-55 | Effective prompt/tool profile, policy source and agent identity inspector                                                              | Settings / session inspector               | EXEC-14                                     | not implemented                                                                                                                                                                                                                               |
| P-56 | Marketplace hub, catalog filters and trust status                                                                                      | Skills / Sources / settings                | ORCH-03, ORCH-04, ORCH-10, ORCH-11, ORCH-12 | not implemented                                                                                                                                                                                                                               |
| P-57 | Skill detail, compatibility, examples and loadout install                                                                              | Marketplace detail                         | ORCH-10                                     | not implemented                                                                                                                                                                                                                               |
| P-58 | Plugin bundle contents, permissions, dependencies and lifecycle                                                                        | Marketplace detail                         | ORCH-11                                     | not implemented                                                                                                                                                                                                                               |
| P-59 | MCP server tools, resources, auth scope, health and revoke                                                                             | Marketplace detail                         | ORCH-12                                     | not implemented                                                                                                                                                                                                                               |
| P-60 | Task changes diff, apply/discard and PR verbs (C4 ladder; branches agent-managed)                                                      | ChatPage / task drawer                     | EXEC-13                                     | not implemented                                                                                                                                                                                                                               |

Every P-ID must have a page contract in the activating spec: data adapter, permission, all §4
states, keyboard/focus behavior, empty-state next step, error recovery truth and owner visual
checkpoint. A row with no active spec is a design surface only; it is not an instruction to build a
mock page in the default product.

### 3B. Binding model, runtime, usage and message-review contract

This section is the target handoff and review contract for P-02, P-07, P-21, P-29 and P-30.
The reset did not implement it; current coverage is recorded in §3A and the gap table below.
[R1](modules/shell.md) selects ZCode's composer and independent model/reasoning
controls, and Cindy's searchable, filtered, grouped model popup. OpenCode remains comparison
evidence for provider setup, discovery, context usage and review. Craft/Fleet remains the rendering
and state authority. A reviewer tests the clauses rather than accepting a resemblance as evidence.

#### Surface ownership

| Concern | Canonical home and behavior | Wrong when |
|---|---|---|
| API keys and provider subscriptions | **Settings → Model**; connected and available models share one page and one connection store | the page is named Provider; API and subscription credentials are split into another settings authority |
| CLI runtimes | **Settings → Terminal**; handshake before first use records runtime version, health, models, modalities, context, reasoning efforts and typed runtime modes | the first model call performs discovery; a CLI gains its own composer or model-picker design |
| Model choice | the same provider/connection-grouped searchable picker in Settings and composer; a CLI group uses the connection name while detail still exposes the actual runtime/provider | a flat duplicate list, a transport prefix such as `pi/`, or a separate fast/normal model ID is shown |
| Defaults | a new Conversation starts from the selected connection's fallback; its effective model and connection become Session state, and an explicit composer choice wins. Add named task-specific defaults only alongside a real runtime consumer | a provider card, subscription, or Workspace stores “when to use which model”, or an invisible Workspace override steers a new Conversation |
| Project location | visible Workspace switcher plus a Project/folderless picker for the new Conversation; host follows the Workspace route | Project selection silently changes Workspace; folder, remote machine, worktree and cloud are mixed into one location type |

#### Settings and composer interaction

1. Add and edit stay expanded on the current Settings page. Provider selection is a searchable menu.
   Credential fields use progressive disclosure, with endpoint presets filled from the selected
   provider and editable only where the adapter permits it.
2. The model multi-select is one tokenized combobox: selected model chips live inside the same field;
   the same text searches known models and offers an explicit custom-ID action. There is no second
   search box or chip row. Custom IDs preserve their provider-native value and support keyboard
   removal without exposing an internal transport prefix.
3. The composer popup follows Cindy's search, category rail, grouped model rows and fixed configure
   footer as specified in R1. Row hierarchy is model name first, genuine description/account source
   second, with known capability summary and selection at the right. Input/context detail may use
   secondary disclosure; do not expand every row into a five-field form. Reasoning is edited by its
   own composer control. Unknown values render `—` or remain absent; they never become `0`,
   “unsupported”, or a guessed capability. API price and subscription quota stay distinct.
4. The reasoning control lists only exact model-advertised effort values, translated for display.
   Binary reasoning stays binary; if a model advertises six or seven official values, all six or
   seven remain independently selectable rather than being collapsed to a global list.
   Speed/service/runtime controls retain separate state and request mappings even when the compact
   menu places a fast toggle below reasoning choices. Unsupported controls disappear. A generic
   provider mode is not accepted until discovery classifies its semantics and the adapter can prove
   the emitted body/header.
5. Low-risk setup uses inline/menu interaction, not a navigation detour or modal form. This is not a
   blanket ban on overlays: OAuth handoff, OS folder choice, destructive confirmation, credential
   recovery and complex conflict review use the existing dialog/drawer/system surface when needed.

#### Capability and data precedence

```text
live provider or CLI protocol
        ↓ exact positive/negative capability evidence
installed SDK/adapter contract
        ↓
OpenCode model catalog enrichment
        ↓
static Fleet fallback
```

A lower source fills only an unknown field; it never overrides a higher source's explicit denial.
Every value retains source and observation time. Provider catalog presence alone is `display-only`
until authentication, validation and a request adapter work. More logos are not more supported
providers.

#### Context, quota and message evidence

1. The composer has one context indicator and the detail has one primary context-usage bar.
   Subscription quota windows appear only for the active subscription connection, after an
   authenticated provider/runtime response. Show the returned windows and native units, with a
   compact summary and overflow detail rather than a fixed two-window limit. API-key connections
   show no invented subscription allowance. Missing or undocumented quota data stays unavailable
   rather than being scraped, estimated or shown as zero. Acquisition, identity and freshness follow
   [SYS-03](modules/context.md#subscription-allowance-acquisition-and-display).
2. The one usage ledger owns total/input/output/reasoning/cache-read/cache-write tokens, cost,
   message counts, context limit, created/last-active times and breakdown. Provider events outrank
   estimates. Estimated visible-message composition is labelled estimated and never presented as
   exact prompt attribution. Breakdown percentages state their denominator and sum from the same
   token population.
3. Counts and percentages that describe one category share one row where width permits. Long values
   truncate before controls disappear. Numeric values use locale formatting and tabular figures.
4. Completed user and assistant turns reveal their compact footer on hover, keyboard focus and
   explicit tap/coarse-pointer interaction. User turns show work mode, model and elapsed time plus
   transcript revert and copy. Assistant turns show copy, mode, model, elapsed time and real
   changed-file/addition/deletion evidence when known.
5. Elapsed time spans the user message creation timestamp through the last completed child response.
   Transcript revert removes later conversation/provider context and restores text to the composer;
   it does **not** restore workspace files. A file-restoring verb is forbidden until a snapshot/VCS
   authority can preview conflicts and prove recovery.

#### Current known gaps (handoff, not a defer bucket)

| Gap | Status | Closure evidence |
|---|---|---|
| CLI discovery, typed variants and executable Session adapters | `not implemented` | protocol-backed capability snapshot and a real run through the existing Session timeline; old handshake code is absent |
| Generic runtime modes beyond upstream thinking/fast controls | `not implemented` | classified model modes, Session persistence and verified request body/header mapping; old Fleet mode helpers are absent |
| Claude/Codex subscription allowance windows | Claude `not implemented`; Codex `wired but not visually checked` | Codex's selected OAuth connection has a read-only private endpoint adapter with unavailable/error states and bounded bucket parsing; a desktop authenticated allowance read is recorded; owner visual acceptance remains. Claude still needs its runtime-owned adapter. |
| TE1 breakdown and exact prompt-section attribution | `not implemented` | provider/prompt-assembly evidence with one denominator; preserve the upstream context indicator and unknown values |
| Completed-turn metadata and transcript/file restoration | `not implemented` | request-time mode/model/time evidence; transcript restore distinguished from previewable file recovery |
| Compact/touch message action acceptance | `wired but not visually checked` | recheck upstream Copy/Branch actions with keyboard and coarse pointer; old Fleet footer tests do not transfer |
| Separate model and reasoning controls per the target contract | `not implemented` | admitted per-model reasoning control with unsupported levels hidden; old `ModelPickerList.tsx` is absent |
| Independent execution-target and Project/folder interaction | `not implemented` | target selection, remote folder/model data and Session binding verified together; old `execution-context-options.ts` is absent |
| Owner-requested composer picker expansion | `not implemented` | R1 specifies a Project/context header, unified add popup, independent permission/Plan and model/reasoning controls, and Cindy model popup; current Craft callbacks do not establish that behavior |

### 4. Page state standard (applicable states)

Apply states to the behavior a surface actually has. A static control does not need fabricated
loading/offline/recovery UI. Required failures must remain reachable and understandable; avoid
permanent helper text or extra panels solely to enumerate internal mechanisms.

Every page/dialog/panel ships all applicable states, or explicitly notes non-applicability in its
spec:

- **loading** · **empty** (with a plain-language next step) · **error** (what happened + what to do,
  no stack dumps) · **denied** (permission truth, not a blank) · **offline/unavailable** (honest
  service class per P8) · **recovery** (what can actually be recovered — never imply undo that
  doesn't exist, S5) · **narrow width** (truncation before action loss) · **zh-Hans + en** parity.

**Use the shared components; do not hand-roll a state.** Until 2026-07-24 only `empty` had a home,
so each caller invented its own error surface:

| State                               | Component                                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| empty                               | `components/ui/empty`, `entity-list-empty` (`EntityListEmptyScreen`)                         |
| error · denied · offline · recovery | Existing per-surface Craft states; the old Fleet `components/ui/surface-state` wrapper is absent after reset |
| loading                             | existing skeleton / `LoadingIndicator`                                                       |

The former **Feedback → SurfaceState** playground entry is also absent. Its old acceptance is
archived; each active page slice must use current shared primitives and expose its actual states.
Values and copy rules remain in [`DESIGN.md`](../DESIGN.md) §10.

Acceptance for any page slice includes walking these states
([`engineering.md`](engineering.md#quality-verification-and-acceptance) CHECK THIS).

### 5. The frontend track (build pages ahead of behavior, honestly — Decision G6)

After the R0 baseline exit, frontend work may run ahead of its backend behavior under these rules.
The current baseline-first instruction also applies to preview/mock implementations:

1. **Spec first.** A page batch needs its page spec (a section in the domain spec or a short page
   spec) covering: purpose, primary
   home, information architecture, states (§4), and the data contract it consumes.
2. **Visual anchor before code.** The Goal names the exact existing shell/page/component and
   playground state that define the visual language, plus one intentional delta. A new page still
   inherits shell chrome, spacing, typography, tokens, menus and interaction patterns; “new page”
   is not permission for a new design system. This does not freeze weak information architecture:
   an admitted reference workflow may add, remove, or regroup controls while the resulting surface
   continues to use the existing Fleet/Craft rendering primitives and one backend authority.
3. **Typed adapter seam.** Pages consume a typed data contract (the owning release's candidate RPC shape), implemented
   first by a mock adapter. **Mock data lives behind the adapter, never inside components.** Wiring
   the real authority later replaces the adapter implementation, not the page.
4. **Preview-gated and renderable.** Unwired pages are reachable only behind the developer/preview
   toggle, and their important states are selectable in the existing playground/preview surface — the
   default surface never shows a control without real behavior (03 §2 stays true for users).
5. **Status honesty.** An unwired page is `display-only` and is reported as such — always. Wiring
   promotes it through `wired but not visually checked` → `usable` normally.
6. **Owner activates batches.** The owner may activate any page batch (for example, “build the
   T3/T4/T5 surfaces first”) without waiting for backend releases; the matrix/roadmap record the unresolved wiring
   edges.
7. **No dead-end investment.** A page whose domain has an unmet gate (e.g. canvas before the E5a
   benchmark) may still be designed and mocked, but its renderer-dependent parts stay throwaway-thin
   until the gate decision.

This track gives the owner an early view of the complete product shape, keeps agents able to build frontend
in parallel, and still forbids the failure that killed the first attempt: mocked panels presented
as finished product.

### 6. Frontend data contracts

- The contract of record for existing behavior is the real RPC/handler shape
  ([`architecture.md`](architecture.md#code-map): renderer → atom/hook → RPC → server handler).
- A mock adapter for a target page proposes the _smallest_ contract the page truly needs; the
  domain's backend slice later either implements it or renegotiates it explicitly in the spec —
  silent drift between mock contract and real handler is a contract change (C7 applies).
- Shared contract files live with the code, are versioned with their first real caller, and never
  fork per-page copies.

### 7. Dialog / drawer / settings inventory rule

Dialogs, drawers, and settings sections follow the same rules as pages (§3 justification, §4
states, §5 track). Settings additions specifically: settings are for credentials, security/privacy,
retention, connections, and rare preferences — daily actions stay next to the work
([`DESIGN.md`](../DESIGN.md)). Before adding a settings section, prove the
existing eleven pages cannot host it.
