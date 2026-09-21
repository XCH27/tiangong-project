# Complete module registry

This registry is the breadth authority for product capabilities and design coverage. It is not a
list of independent software modules. Inclusion is not a claim of implementation. A capability can
be fully designed while its implementation is `not implemented` (possibly behind a named gate —
gates are recorded in the compatibility-anchor column and the roadmap row, never as a fifth
implementation status); its architectural kind
and parent context come from `REGISTRY.md` and `REGISTRY.md`.

**Coverage is not packet completion.** `breadth` means that the capability is named, placed in a
context and given a compatibility anchor. A row may advance beyond `BREADTH_ONLY` only when the
packet index ([`PACKET-INDEX.md`](PACKET-INDEX.md)) points to a repository-grounded packet
containing paths, authority mapping, reference evidence, dependency/rollback steps and acceptance
IDs. Packet readiness is never an implementation claim.

Every gap class is relative to [`PRODUCT.md`](../PRODUCT.md) and the current `app/` (Craft
**v0.13.3**). v0.10.5 is a look pin, not a shell to restore. `NEW`
means only that Craft lacks the native domain
model or adapter named by that row; it never authorizes a new shell, agent kernel, session/task
system, permission path, timeline, settings home or provider harness. Implementation starts from
the matching row in [`../08-CRAFT-CAPABILITY-MAP.md`](../08-CRAFT-CAPABILITY-MAP.md) and extends
the listed Craft authority.

Every row must also resolve through [`PACKET-INDEX.md`](PACKET-INDEX.md) to one R0–R18 development-
order anchor. “Gated”, “conditional” and `not implemented` are not permission to omit the row from
the sequence; R16–R18 close conditional rows by implementing the proven extension or recording
`NO_GAP` evidence.

## Core and work surfaces

| ID | Module | Gap class | Design state | Implementation status | Compatibility anchor |
|---|---|---|---|---|---|
| CORE-01 | App shell and runtime | REUSE | breadth | usable | Electron/Bun/React shell |
| CORE-02 | Project/Workspace boundary | EXTEND | breadth | usable | Workspace authority |
| CORE-03 | Session and chat | REUSE/EXTEND | breadth | usable | SessionManager + SessionEvents |
| CORE-04 | Structured tasks, scheduling and task-center projection | EXTEND | breadth | backend usable; default task-center surface not implemented | Task store + TaskRunner; SessionManager for ordinary R1 work |
| CORE-05 | Settings and preferences | EXTEND | breadth | usable | one settings home |
| CORE-06 | Search, filters and saved views | EXTEND | breadth | usable | views are projections |
| CORE-07 | Onboarding and first-run | EXTEND | breadth | usable | no implied Craft service |
| CORE-08 | Help, docs and support | EXTEND | breadth | wired but not visually checked | local/user-configured links |
| CORE-09 | Updates, packaging and distribution | EXTEND | breadth | wired but not visually checked | Fleet channel |
| CORE-10 | Internationalization and identity | EXTEND | breadth | wired but not visually checked | i18n + stable IDs |
| CORE-11 | Panels, docking and layout | EXTEND | breadth | fixed-column sizing wired but not visually checked; registered/movable host not implemented | early R15/R18 foundation uses existing Files/Notes; R18 native-window closure follows |

## Files, evidence and information

| ID | Module | Gap class | Design state | Implementation status | Compatibility anchor |
|---|---|---|---|---|---|
| INFO-01 | Workspace files and file tools | REUSE/EXTEND | breadth | usable | filesystem + permission |
| INFO-02 | Library and ArtifactRef | NEW | breadth | not implemented | one version/provenance authority |
| INFO-03 | Browser evidence and capture | EXTEND | breadth | BrowserPane baseline usable; capture/evidence not implemented | BrowserPane + evidence ArtifactRef |
| INFO-04 | Document ingestion and conversion | EXTEND | breadth | usable | Sources/preview + provenance |
| INFO-05 | Document editing and preview | EXTEND | breadth | usable | existing TipTap only |
| INFO-06 | Search indexing and retrieval | EXTEND | breadth | usable | search/views projection |
| INFO-07 | Provenance and citation | NEW | breadth | not implemented | ArtifactRef + timeline evidence |
| INFO-08 | Import/export and migration | EXTEND | breadth | not implemented | native owners + honest fidelity |

## Agent, execution and collaboration

| ID | Module | Gap class | Design state | Implementation status | Compatibility anchor |
|---|---|---|---|---|---|
| EXEC-01 | Permissions, approvals and safety | EXTEND | breadth | usable | mode-manager + PreToolUse |
| EXEC-02 | Actions and caller-aware action seam | NEW/EXTEND | breadth | not implemented | one executor/policy/evidence path |
| EXEC-03 | Terminal and local execution | EXTEND | breadth | usable | Bash/background; PTY gated |
| EXEC-04 | Multi-agent delegation | EXTEND | breadth | wired but not visually checked (kernel + spawn TaskBrief + DelegationStrip; R4/R5/R6 close still open) | Session/Task tree + TaskRunner as Delegation Kernel |
| EXEC-05 | Runtime/provider adapters | EXTEND | breadth | Claude+Pi lanes usable; generic adapter contract not implemented | capability negotiation |
| EXEC-07 | Worktree isolation | NEW | breadth | not implemented | Git/process lifecycle |
| EXEC-08 | Sandbox and OS isolation | EXTEND/NEW | breadth | wired but not visually checked | tested Fleet filesystem/network/script isolation; full OS/container executor remains gated — Fleet's filesystem, network and script isolation stays and is `wired but not visually checked`. A **second, deeper OS sandbox is out of scope** (PRODUCT.md): the permission path and process boundary already enforce what the candidates enforce on the platform Fleet ships on |
| EXEC-09 | Remote and cloud execution | EXTEND | breadth | wired but not visually checked | user-owned Fleet transport; access link + advertised URL; no operator relay |
| EXEC-10 | Automations and scheduler | EXTEND | breadth | usable | governed actions |
| EXEC-11 | Messaging and channel adapters | EXTEND | breadth | not implemented | Workspace-scoped gateway |
| EXEC-13 | Git repository, branch and PR review delivery | EXTEND/NEW | breadth | not implemented | governed Git/PR adapter; never a task authority |
| EXEC-14 | System prompt, effective execution profile and agent identity configuration | EXTEND | breadth | not implemented | one prompt/tool projection over provider + permission seams |
| EXEC-15 | External computer/environment control | EXTEND/NEW | breadth | BrowserPane structured path usable in its current Craft scope; general computer control not implemented | narrowest reliable route first (native action → structured adapter → accessibility → pixel); environment/display identity, live expiring grant and observation freshness; never a second permission or session authority — The **built-in browser stays** — it is one of the shared surfaces (PRODUCT.md) and its structured BrowserPane path is `usable`. **General external-computer control is out of scope**: driving a specific tool for a specific job is fine, a remote-control layer contradicts the product's first sentence |

## Intelligence economics and memory

| ID | Module | Gap class | Design state | Implementation status | Compatibility anchor |
|---|---|---|---|---|---|
| INTEL-01 | Context/effective capability projection and compaction | EXTEND | breadth | not implemented | centralized measurable projection; compaction gated |
| INTEL-02 | Token optimization and cache strategy | EXTEND | breadth | not implemented | existing prompt/tool assembly + one UsageTracker |
| INTEL-03 | Model routing and capability negotiation | NEW/EXTEND | breadth | per-model thinking-level mapping usable; routing not implemented | provider adapters — Per-model thinking-level mapping stays and is `usable`. **Speculative routing and capability negotiation are out of scope** until a real caller asks for them (PRODUCT.md) |
| INTEL-04 | Cost and usage ledger | NEW/EXTEND | breadth | not implemented | real/estimated/unknown |
| INTEL-05 | Layered agent-maintained memory | NEW | breadth | not implemented | autonomous accumulation + logged consolidation; curation optional; D5 floors |
| INTEL-06 | Prompt, skill and context loadouts | EXTEND | breadth | not implemented | install/loadout/runtime separated; feeds one effective projection |
| INTEL-07 | Evaluation and regression evidence | NEW | breadth | not implemented | verifier separate from executor |

## Creative and media surfaces

| ID | Module | Gap class | Design state | Implementation status | Compatibility anchor |
|---|---|---|---|---|---|
| CREATE-01 | Spatial canvas and orchestration | NEW | breadth | not implemented; playground preview page display-only | projection only |
| CREATE-02 | Video and media editing | NEW | breadth | not implemented | sequence + Job + ArtifactRef |
| CREATE-03 | Image generation and editing | NEW | breadth | not implemented | generation Job + provenance |
| CREATE-04 | Audio, voice and music | NEW | breadth | not implemented | media Job + track provenance |
| CREATE-05 | Captions, transcript and translation | NEW/EXTEND | breadth | not implemented | word ranges map to clips |
| CREATE-06 | Design editor | NEW | breadth | not implemented | transactional native schema |
| CREATE-07 | Web artifact editor/preview | NEW | breadth | not implemented | isolated preview + ArtifactRef |
| CREATE-08 | Deck and presentation | NEW | breadth | not implemented | native document + exporters |
| CREATE-09 | Motion graphics and animation | NEW | breadth | not implemented | composition/renderer adapter |
| CREATE-10 | Storyboard and shot planning | NEW | breadth | not implemented | plans link to media/artifacts |
| CREATE-11 | Templates, brand kits and reusable assets | NEW | breadth | not implemented | Library assets + provenance |
| CREATE-12 | Export, render and delivery profiles | NEW | breadth | not implemented | Job output + fidelity declaration |
| CREATE-16 | Long-form narrative and content generation | NEW | breadth | not implemented | native document authority + governed generation actions |

## Orchestration and extensibility

| ID | Module | Gap class | Design state | Implementation status | Compatibility anchor |
|---|---|---|---|---|---|
| ORCH-01 | Workflow definition editor | NEW | breadth | not implemented | finite typed DAG |
| ORCH-02 | Workflow execution and run history | NEW | breadth | not implemented | TaskRunner projection |
| ORCH-03 | Component manager and workspace compositions | EXTEND | breadth | not implemented | early R15/R18 host + scoped settings proof before domain components; no R6/R9 prerequisite; pure resolver exists without a production consumer |
| ORCH-04 | Agent tool registry and MCP | EXTEND | breadth | not implemented | one action/tool policy path |
| ORCH-05 | Jobs, queues and resource scheduling | NEW | breadth | not implemented | one cancellable Job authority |
| ORCH-06 | Event stream and activity history | EXTEND | breadth | usable | SessionEvents/timeline |
| ORCH-07 | Notifications, approvals and inbox | EXTEND | breadth | not implemented | permission/session evidence |
| ORCH-08 | Diagnostics, health and recovery | NEW | breadth | not implemented | failure classification |
| ORCH-10 | Skill marketplace and loadout distribution | NEW/EXTEND | breadth | not implemented | signed skill manifest, compatibility and one loadout authority |
| ORCH-11 | Component marketplace and lifecycle | NEW/EXTEND | breadth | not implemented | trust, permissions, install/update/rollback, runtime isolation, and workspace enable/override records |
| ORCH-12 | MCP server marketplace and connector registry | NEW/EXTEND | breadth | not implemented | server manifest, tool capabilities, credential scope and health |

## Registry rules

1. Adding a large capability adds a row before implementation and creates a module home.
2. Removing a row requires an owner decision in `docs/02-DECISIONS.md`; “not now” is not removal.
3. A module cannot become `READY_FOR_SPEC` until its compatibility record and reference audit exist.
4. A module spec activates one slice without claiming the whole module is `usable`.
5. Every implementation slice updates this registry, its module packet, the capability map and the
   affected page architecture in the same change.
6. Every row keeps a release-order anchor in `PACKET-INDEX.md`; no near/mid/far-term bucket or blank
   “future” owner is allowed.
