# Complete module registry

This registry is the breadth authority for product capabilities and design coverage. It is not a
list of independent software modules. Inclusion is not a claim of implementation. A capability can
be fully designed while its implementation is `not implemented` (possibly behind a named gate —
gates are recorded in the compatibility-anchor column and the roadmap row, never as a fifth
implementation status); its architectural kind
and parent context are defined by this registry and the linked module packets.

**Coverage is not implementation.** Each row points through
[`PACKET-INDEX.md`](PACKET-INDEX.md) to exactly one executable next-step contract. Readiness is
recorded there only: implementation routes and pending mechanism proofs are distinct. These
contracts name source paths, authority, reference evidence, dependency/rollback and acceptance;
they never claim that an unimplemented capability works.

Every gap class is relative to [`PRODUCT.md`](../PRODUCT.md) and the current `app/` (Craft
**v0.13.4**). v0.10.5 is a look pin, not a shell to restore. `NEW`
means only that Craft lacks the native domain
model or adapter named by that row; it never authorizes a new shell, agent kernel, session/task
system, permission path, timeline, settings home or provider harness. Implementation starts from
the matching row in [`../08-CRAFT-CAPABILITY-MAP.md`](../08-CRAFT-CAPABILITY-MAP.md) and extends
the listed Craft authority.

**Current implementation, checked 2026-09-21:** `5a510cf1d` reset `app/` to Craft v0.13.4.
The previous Fleet tree is preserved at `7a8f6d5fa`; its tests and visual acceptance do not establish
current coverage. The Component resolver/host, Assistant store, shared layout model, Fleet remote
pairing and TE1 inspector are absent. Their contracts remain in the registry. The subsequent owner-requested original-source restoration also removed Fleet local export/help,
service boundaries, Project consolidation and their tests. These corrections are not implemented.
`wired but not visually checked` below identifies surviving runtime paths without
claiming fresh end-to-end or owner visual acceptance.

Feature additions, including the local Component/panel host, follow the baseline exit in
`../specs/R0-baseline-audit.md`. The later host still precedes domain Components and does not require
R6/R9.

Every row must also resolve through [`PACKET-INDEX.md`](PACKET-INDEX.md) to one R0–R18 development-
order anchor. “Gated”, “conditional” and `not implemented` are not permission to omit the row from
the sequence. R16 now owns the bounded local-app Component; remaining R17/R18 conditional rows resolve by
implementing the proven extension or recording `NO_GAP` evidence.

## Core and work surfaces

| ID | Module | Gap class | Execution contract | Implementation status | Compatibility anchor |
|---|---|---|---|---|---|
| CORE-01 | App shell and runtime | REUSE | PACKET-INDEX | wired but not visually checked | Craft AppShell + PanelStackContainer; compare and correct the current shell; never restore a discarded renderer |
| CORE-02 | Project/Workspace boundary | EXTEND | PACKET-INDEX | wired but not visually checked | R1 retains Workspace/Project scopes and extends shell, draft context and live activity |
| CORE-03 | Session and chat | REUSE/EXTEND | PACKET-INDEX | wired but not visually checked | SessionManager + SessionEvents; v0.13.4 steering and mid-stream queue |
| CORE-04 | Structured tasks, scheduling and task-center projection | EXTEND | PACKET-INDEX | backend wired but not visually checked; default task-center surface not implemented | Craft Task store + TaskRunner; one Session authority |
| CORE-05 | Settings and preferences | EXTEND | PACKET-INDEX | wired but not visually checked | upstream Settings home; Fleet target model/runtime flow not implemented |
| CORE-06 | Search, filters and saved views | EXTEND | PACKET-INDEX | wired but not visually checked | Craft Session search/filter/view projections; Fleet cross-domain command search not implemented |
| CORE-07 | Onboarding and first-run | EXTEND | PACKET-INDEX | wired but not visually checked | Craft first-run flow; Fleet service-independence acceptance must be re-established |
| CORE-08 | Help, docs and support | EXTEND | PACKET-INDEX | not implemented | Original bundled files and hosted guidance coexist; Fleet local-help correction is withdrawn |
| CORE-09 | Updates, packaging and distribution | EXTEND | PACKET-INDEX | not implemented | Original Craft updater/download/quit-install remains; no Fleet distribution channel or implemented Fleet boundary |
| CORE-10 | Internationalization and identity | EXTEND | PACKET-INDEX | wired but not visually checked | Craft i18n + IDs; Fleet terminology/identity convergence not implemented |
| CORE-11 | Panels, docking and layout | EXTEND | PACKET-INDEX | fixed-column sizing wired but not visually checked; registered/movable host not implemented | after the R0 baseline exit, early R15/R18 foundation reuses current surfaces; shared layout model and old right workbench are absent |

## Files, evidence and information

| ID | Module | Gap class | Execution contract | Implementation status | Compatibility anchor |
|---|---|---|---|---|---|
| INFO-01 | Workspace files and file tools | REUSE/EXTEND | PACKET-INDEX | wired but not visually checked | Craft filesystem/permission path; SessionFilesSection mounted through SessionInfoPopover |
| INFO-02 | Library and ArtifactRef | NEW | PACKET-INDEX | not implemented | one version/provenance authority |
| INFO-03 | Browser evidence and capture | EXTEND | PACKET-INDEX | BrowserPane wired but not visually checked; Fleet capture/evidence not implemented | separate BrowserPane window survives; prior in-shell workbench embedding absent |
| INFO-04 | Document ingestion and conversion | EXTEND | PACKET-INDEX | wired but not visually checked | Craft Sources/conversion tools; Fleet provenance extension not implemented |
| INFO-05 | Document editing and preview | EXTEND | PACKET-INDEX | preview wired but not visually checked; native document editing not implemented | TipTap editor exists with a playground caller only; preview is not editable Word/Excel/PowerPoint/PDF |
| INFO-06 | Search indexing and retrieval | EXTEND | PACKET-INDEX | wired but not visually checked | Craft search/view projection; no claim of Fleet cross-domain index |
| INFO-07 | Provenance and citation | NEW | PACKET-INDEX | not implemented | ArtifactRef + timeline evidence |
| INFO-08 | Import/export and migration | EXTEND | PACKET-INDEX | not implemented | Fleet local export was withdrawn; format import/export and migration need native-owner fidelity proof |

## Agent, execution and collaboration

| ID | Module | Gap class | Execution contract | Implementation status | Compatibility anchor |
|---|---|---|---|---|---|
| EXEC-01 | Permissions, approvals and safety | EXTEND | PACKET-INDEX | wired but not visually checked | Craft mode-manager + PreToolUse; prior Fleet child-permission narrowing requires revalidation |
| EXEC-02 | Actions and caller-aware action seam | NEW/EXTEND | PACKET-INDEX | not implemented | one executor/policy/evidence path |
| EXEC-03 | Terminal and local execution | EXTEND | PACKET-INDEX | wired but not visually checked | Craft Bash/background execution; Fleet command-runner panel and persistent PTY not implemented |
| EXEC-04 | Multi-agent delegation | EXTEND | PACKET-INDEX | Craft child Sessions/TaskRunner wired but not visually checked; Fleet delegation gates not implemented | one Session/Task authority; TaskBrief, RunReport and DelegationStrip paths absent |
| EXEC-05 | Runtime/provider adapters | EXTEND | PACKET-INDEX | Craft Claude/Pi lanes wired but not visually checked; general CLI adapters not implemented | provider SDK lanes are not the removed general CLI discovery/handshake layer |
| EXEC-07 | Worktree isolation | NEW | PACKET-INDEX | not implemented | Git/process lifecycle |
| EXEC-08 | Inherited execution isolation | REUSE/EXTEND | PACKET-INDEX | wired but not visually checked | existing permission, filesystem/network/env and script-isolation paths; validate and correct under R0/R2. A second OS/container sandbox is excluded, not queued for R18 |
| EXEC-09 | Remote, cloud execution and later phone connector | EXTEND | PACKET-INDEX | Craft remote routing wired but not visually checked; Fleet pairing not implemented | Original URL/token Workspace route only; Fleet device grants, Orca-like phone connector and target interaction not implemented; Windows/macOS/Linux host targets |
| EXEC-10 | Automations and scheduler | EXTEND | PACKET-INDEX | wired but not visually checked | Craft automation scheduler/history; Fleet extensions require current evidence |
| EXEC-11 | Messaging and channel adapters | EXTEND | PACKET-INDEX | not implemented | Workspace-scoped gateway |
| EXEC-13 | Git repository, branch and PR review delivery | EXTEND/NEW | PACKET-INDEX | not implemented | governed Git/PR adapter; never a task authority |
| EXEC-14 | System prompt, effective execution profile and agent identity configuration | EXTEND | PACKET-INDEX | not implemented | one prompt/tool projection over provider + permission seams |
| EXEC-15 | Specified local-app Computer Use Component | EXTEND/NEW | PACKET-INDEX | not implemented | R16 after R0 and Component foundation; SYS-02 helper/permission/target proof. Browser/process routes remain existing mechanisms; no general Core controller or second sandbox |

## Intelligence economics and memory

| ID | Module | Gap class | Execution contract | Implementation status | Compatibility anchor |
|---|---|---|---|---|---|
| INTEL-01 | Context/effective capability projection and compaction | EXTEND | PACKET-INDEX | Craft context indicator/compaction wired but not visually checked; full effective projection not implemented | v0.13.4 context-usage events and composer context-display; removed TE1 inspector is not upstream coverage |
| INTEL-02 | Token optimization and cache strategy | EXTEND | PACKET-INDEX | not implemented | extend current prompt/tool assembly and UsageTracker; prior Fleet TE1 normalization/attribution is absent |
| INTEL-03 | Model routing and capability negotiation | NEW/EXTEND | PACKET-INDEX | Craft thinking-level mapping wired but not visually checked; routing not implemented | provider adapters remain; speculative routing stays out of scope until a real caller needs it |
| INTEL-04 | Cost and usage ledger | NEW/EXTEND | PACKET-INDEX | not implemented | Craft usage events remain; Fleet ledger/rollups absent; real/estimated/unknown stay distinct |
| INTEL-05 | Layered agent-maintained memory | NEW | PACKET-INDEX | not implemented | autonomous accumulation + logged consolidation; curation optional; D5 floors |
| INTEL-06 | Prompt, skill and context loadouts | EXTEND | PACKET-INDEX | not implemented | install/loadout/runtime separated; feeds one effective projection |
| INTEL-07 | Evaluation and regression evidence | NEW | PACKET-INDEX | not implemented | verifier separate from executor |

## Creative and media surfaces

| ID | Module | Gap class | Execution contract | Implementation status | Compatibility anchor |
|---|---|---|---|---|---|
| CREATE-01 | Spatial canvas and orchestration | NEW | PACKET-INDEX | not implemented | production board hosts generation/editing/layout; native document/sequence owners keep domain truth; prior preview absent |
| CREATE-02 | Video and media editing | NEW | PACKET-INDEX | not implemented | sequence + Job + ArtifactRef |
| CREATE-03 | Image generation and editing | NEW | PACKET-INDEX | not implemented | generation Job + provenance |
| CREATE-04 | Audio, voice and music | NEW | PACKET-INDEX | not implemented | media Job + track provenance |
| CREATE-05 | Captions, transcript and translation | NEW/EXTEND | PACKET-INDEX | not implemented | word ranges map to clips |
| CREATE-06 | Design editor | NEW | PACKET-INDEX | not implemented | transactional native schema |
| CREATE-07 | Web artifact editor/preview | NEW | PACKET-INDEX | not implemented | isolated preview + ArtifactRef |
| CREATE-08 | Deck and presentation | NEW | PACKET-INDEX | not implemented | native document + exporters |
| CREATE-09 | Motion graphics and animation | NEW | PACKET-INDEX | not implemented | composition/renderer adapter |
| CREATE-10 | Storyboard and shot planning | NEW | PACKET-INDEX | not implemented | plans link to media/artifacts |
| CREATE-11 | Templates, brand kits and reusable assets | NEW | PACKET-INDEX | not implemented | Library assets + provenance |
| CREATE-12 | Export, render and delivery profiles | NEW | PACKET-INDEX | not implemented | Job output + fidelity declaration |
| CREATE-16 | Long-form narrative and content generation | NEW | PACKET-INDEX | not implemented | native document authority + governed generation actions |

## Orchestration and extensibility

| ID | Module | Gap class | Execution contract | Implementation status | Compatibility anchor |
|---|---|---|---|---|---|
| ORCH-01 | Workflow definition editor | NEW | PACKET-INDEX | not implemented | finite typed DAG |
| ORCH-02 | Workflow execution and run history | NEW | PACKET-INDEX | not implemented | TaskRunner projection |
| ORCH-03 | Component manager and workspace compositions | EXTEND | PACKET-INDEX | not implemented | early R15/R18 host + scoped settings proof before domain components; no R6/R9 prerequisite; prior shared Component resolver is absent |
| ORCH-04 | Agent tool registry and MCP | EXTEND | PACKET-INDEX | not implemented | one action/tool policy path |
| ORCH-05 | Jobs, queues and resource scheduling | NEW | PACKET-INDEX | not implemented | one cancellable Job authority |
| ORCH-06 | Event stream and activity history | EXTEND | PACKET-INDEX | wired but not visually checked | Craft SessionEvents/timeline; prior Fleet evidence extensions require revalidation |
| ORCH-07 | Notifications, approvals and inbox | EXTEND | PACKET-INDEX | not implemented | permission/session evidence |
| ORCH-08 | Diagnostics, health and recovery | NEW | PACKET-INDEX | not implemented | failure classification |
| ORCH-10 | Skill marketplace and loadout distribution | NEW/EXTEND | PACKET-INDEX | not implemented | origin/integrity-verified skill manifest, compatibility and one loadout authority |
| ORCH-11 | Component marketplace and lifecycle | NEW/EXTEND | PACKET-INDEX | not implemented | trust, permissions, install/update/rollback, runtime isolation, and workspace enable/override records |
| ORCH-12 | MCP server marketplace and connector registry | NEW/EXTEND | PACKET-INDEX | not implemented | server manifest, tool capabilities, credential scope and health |

## Registry rules

1. Adding a large capability adds a row before implementation and creates a module home.
2. Removing a row requires an owner decision in `docs/02-DECISIONS.md`; “not now” is not removal.
3. A module cannot become `READY_FOR_SPEC` until its compatibility record and reference audit exist.
4. A module spec activates one slice without claiming the whole module is `usable`.
5. Update only the canonical rows whose contract/status changed; keep the joins valid. Packet
   readiness lives once in PACKET-INDEX, with a unique execution section in its owning suite;
   do not restate a contradictory readiness value in every registry or narrative section.
6. Every row keeps a release-order anchor in `PACKET-INDEX.md`; no near/mid/far-term bucket or blank
   “future” owner is allowed.
