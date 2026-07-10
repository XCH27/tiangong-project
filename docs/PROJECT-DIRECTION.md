# Project Direction

## 1. Product Thesis

Fleet is a local-first modular spatial work platform built on Craft Agents.

It is not a chat client, not a terminal skin, not an IDE clone, not a Figma clone, and not a collection of disconnected AI utilities. The product direction is a single workbench where a human and multiple AI agents work on the same project through the same sessions, files, permissions, runtime lanes, assets, and timeline.

The core product bet is:

> The user owns intent, taste, and final judgment. Agents do the middle execution. Fleet keeps every action inspectable, permissioned, reversible, and connected to real project artifacts.

In practical terms, humans own the top 10% of creative judgment and the bottom 10% of
common-sense guardrails; agents execute the middle 80% of concrete production work. Fleet must
make that split operational through shared surfaces, permissions, evidence, and rollback rather
than through a decorative chat layer.

This means Fleet must optimize for complete production loops, not impressive panels. A feature is
valuable only when it can move real work from intent to output with evidence, permissions, state,
and honest undo/cancellation. The infinite canvas is a spatial orchestration surface; native
editors and modules keep their own document models.

## 2. The Product We Are Actually Building

Fleet should grow from Craft Agents into one composable system with five connected layers:

1. **Retained Craft Workbench and View Host**
   The home shell for sessions, projects, agents, settings, permissions, and runtime selection.
   M16 adds registered panels, inspectors, and native surfaces inside the latest approved Craft
   Agents base. It does not replace the shell.

2. **Terminal and Execution Spine**
   The first serious product loop. Users can run local CLI agents and terminal sessions as first-class runtime lanes. Output, errors, permissions, cost attribution, and reports must flow back into the Craft session timeline.

3. **Files, Browser Evidence, and Artifact Handoff**
   M05 provides versioned ArtifactRefs over real files/native documents. The existing BrowserPane
   selects, annotates, and captures evidence. Ordinary remote pages are read/annotate/evidence
   only; editable outputs use real local/native document models.

4. **Spatial Canvas and Composable Workflows**
   M07 is the infinite spatial workspace; M17 owns executable typed workflows. People and Agents
   arrange artifacts and capability steps together. Visual connectors are not automatically
   executable, and the canvas never becomes a second job/document store.

5. **Native Creative Modules**
   M08 provides asynchronous/generative jobs; M09 owns multi-asset media composition; M18 owns
   editable web projects; M19 owns presentation/motion decks; a design module may use a verified
   OpenPencil adapter. Each registers capabilities and views instead of becoming a separate app.

The key point: these are native authorities and views, but not separate products. They share the
same project, ArtifactRefs, agents, permissions, action path, jobs, timeline, and cost ledger.

## 3. Non-Goals

Do not build:

- a second session system
- a second permission system
- a second memory store
- a separate agent platform beside Craft
- a new UI shell before the Craft shell is stable
- a universal patch format that tries to edit code, design, documents, browser state, and video with one operation model
- a stealth browser, quota bypasser, anti-detection stack, or automatic account-rotation product
- a fake completed feature backed only by display UI, stubs, or hidden renderer state
- copied code from unapproved reference projects

The fastest way to ruin this product is to add broad-looking UI before the spine is real.

## 4. The Correct Unification Layer

Fleet should not unify every work surface through one universal `DesignPatch`.

The shared layer is:

- Craft session and `SessionEvent`
- permission and approval flow
- actor identity: user / agent / manager agent
- runtime identity: API / CLI / terminal / external job
- Internal Action Registry
- project files and Library assets
- versioned ArtifactRef handoffs
- capability manifests and typed operation ports
- versioned workflow/run correlation
- registered view contributions and layout projection
- timeline, evidence, rollback, and reports
- real / estimated / unknown usage and cost ledger

The surface-specific layer remains native:

| Surface | Native model |
|---|---|
| Code | files, diffs, commands, tests, git state |
| Terminal | PTY/runtime lane state |
| Browser | BrowserPane, CDP, screenshots, DOM/AX evidence |
| Documents | document/block model |
| Spatial canvas | entity bindings, layout, visual references, workflow projections |
| Design editor | design document tree, nodes, selection, native history |
| AIGC | job inputs, outputs, provenance, cost |
| Video | media assets, tracks, clips, keyframes, render jobs |

The shared question is “who invoked which capability, was it allowed, where is the evidence, what
can honestly be undone or cancelled?” The module-specific question is “which authority owns this
document/job and how does it edit/recover it?”

## 5. Agent-Native Control Model

Every serious capability must be usable by the human UI and authorized Agents through the same
structured action path. Composable operations may also be invoked by M17, but the workflow caller
inherits the initiator's scope and receives no special permission.

The common verb set is:

- `read`: inspect the native structure
- `select`: create or update a selection
- `mutate`: apply a structured change
- `undo`: revert through the native history/rollback path
- `explain`: summarize what changed
- `handoff`: export or transfer the result to another surface

Examples:

- design: read nodes, select nodes, move/update/insert/delete nodes
- code: read symbols/files, apply diffs, run tests
- browser: select elements, capture screenshots, package evidence
- video: read tracks/clips, trim/split/reorder clips, render
- files: inspect, move, rename, delete with permission and undo

Human controls, Agent tools, and workflow steps are generated from the same capability/action
definition and call the same executor. A button-only feature is incomplete. An Agent/workflow-only
tool that bypasses visible evidence is also incomplete.

## 6. First Development Spine

The first spine is not “build all surfaces.” It is the minimum product backbone that makes later surfaces real.

> **Phase → Wave cross-reference:** The phases below map to execution waves in
> `docs/WAVE-MODULE-MAP.md`. See the table at the end of this section for the full mapping.

### Phase 0: Clean Craft Agents v0.11 Baseline `[W0.1 migration gate]`

Goal: Craft runs cleanly and remains recognizable.

Do:

- start from the verified Craft Agents OSS v0.11.0 clean baseline and classify every local
  difference as retain/adapt/drop/defer
- keep the monorepo, Electron shell, project/task/session flow, settings authority, permissions,
  BrowserPane, and compatible upstream panels after evidence-based inspection
- remove or quarantine old experimental UI that does not support the new direction
- keep upstream sync possible
- verify install, typecheck, and basic Electron launch before feature migration

Do not:

- sync upstream on a dirty tree
- replace the shell
- add new top-level pages for every feature

Exit criteria: the clean v0.11 workbench is usable, the migration ledger is complete, and the
canonical contract implementation is re-frozen against that baseline.

### Phase 1: Terminal and CLI Runtime Loop `[Wave 2]`

Goal: one real local runtime loop works end to end.

A valid loop is:

user intent -> UI selection of runtime -> backend handler -> runtime process/PTY -> streamed output -> session event -> visible timeline/output -> stop/error/report path

This is the first serious product loop because it turns Fleet from a chat surface into a local execution workbench.

Exit criteria: both CLI and UI runtime path integrations are usable; output streams back to session timeline; at least one permission check is executed/logged; stop/error paths have user-visible feedback.

### Phase 2: Internal Action Spine `[Wave 0 → Wave 1]`

Goal: human UI and agents use the same action path for real project operations.

Start with narrow, useful actions:

- inspect files
- select files or objects
- edit/move/rename files with permission
- update progress
- record terminal/runtime events
- create evidence and reports

Exit criteria: a human action and an agent action both produce permissioned timeline events through the same registry path.

### Phase 3: Runtime Lanes and TeamRun `[Wave 0 → Wave 2]`

Goal: Fleet owns the team; a CLI owns one run.

Do not make “multi-agent” mean multiple chat bubbles. Use stable `AgentSeat`, runtime-specific `RuntimeLane`, and bounded `TeamRun` requests. A CLI leader may request a member run through Fleet Bridge, but it must not directly own the API teammate’s tools or bypass permissions.

Exit criteria: one leader runtime can request a bounded member task, receive a compressed report, and leave evidence in the shared timeline.

### Phase 4: Files, Library, and ArtifactRef `[Wave 2]`

Goal: make the user’s workspace real inside Fleet.

There are three related layers:

- **Files**: raw workspace files and folders
- **Library**: selected, indexed, licensed, reusable project assets
- **ArtifactRef**: exact versioned handoff references to files, Library assets, evidence, or native
  documents

Agents may organize files only through permissioned actions. Library assets and ArtifactRefs must
track exact source/version, hash where available, license/provenance, sensitivity, parents, and
where they are used.

Exit criteria: files are visible, selectable, usable by agents, and write operations are permissioned and reversible.

### Phase 5: Browser and Artifact Workflow `[Wave 3]`

Goal: turn BrowserPane into one governed evidence/artifact input for design and review.

Build:

- Codex-style browser control settings
- element selection
- box selection
- multi-select
- annotation
- screenshot/evidence package
- Comment AI
- artifact handoff

Remote websites remain read/annotate/evidence surfaces. Editable artifacts must use a real artifact/design document model, not DOM mutation inside an iframe.

The browser settings model should be explicit and user-readable: browser enablement, local URL
open target, clear browser data, annotated screenshot inclusion, approval behavior, site-specific
permission overrides, and a separate high-risk developer toggle for full CDP access.

Exit criteria: selected web evidence becomes Agent context, timeline evidence, and an ArtifactRef
that can feed M07/M17 or an owned M18 project, while browser permissions/data controls remain
visible in settings.

### Phase 6A: Composable Spatial Loop `[Wave 3A]`

Goal: prove one modular creative loop only after the spine, files, job core, and view host work.

The first loop is text -> one real image operation -> durable ExternalJob -> ArtifactRef -> canvas
result. Human UI, Agent, and workflow callers share the same capability/action path, and restart
reconciliation must not repeat the external job.

Exit criteria: a human and Agent edit the same versioned workflow/spatial projection, an approval
pause is exercised, a real image output is committed through M05, and the complete run is
inspectable/recoverable.

### Phase 6B: Web, Presentation, and Media Fan-out `[Wave 3B]`

Goal: reuse one exact image/artifact version as input to M18 web, M19 motion deck, and M09
multi-asset media composition. Each produces a real editable native project and/or export and
returns versioned ArtifactRefs.

### Phase → Wave Reference Table

| Phase | Name | Wave / Track |
|---|---|---|
| Phase 0 | Clean Craft Agents v0.11 Baseline | W0.1 migration gate |
| Phase 1 | Terminal and CLI Runtime Loop | Wave 2 |
| Phase 2 | Internal Action Spine | Wave 0 → Wave 1 |
| Phase 3 | Runtime Lanes and TeamRun | Wave 0 → Wave 2 |
| Phase 4 | Files, Library, and ArtifactRef | Wave 2 |
| Phase 5 | Browser and Artifact Workflow | Wave 3 |
| Phase 6A | Composable Spatial Loop | Wave 3A |
| Phase 6B | Web, Presentation, and Media Fan-out | Wave 3B |

## 7. External Jobs

External work should be modeled once.

The same job system should cover:

- external AI review
- image generation
- image editing
- video generation
- web animation rendering
- video rendering
- deploy/publish
- artifact export

A job records:

- type
- inputs
- target runtime/provider/site
- permission level
- status
- outputs
- provenance
- cost/usage source
- evidence and rollback point where possible

This prevents “review center,” “generation center,” and “publish center” from becoming separate governance products.

## 8. Reference Project Policy

Reference projects are not the roadmap. They are source material for specific decisions.

Approved direct-source references:

- Craft Agents OSS: base application
- AionUi: ACP, CLI runtime, process lifecycle, team/agent patterns
- Open Design: design workflow, runtime definitions, prompt transport, artifact/eval patterns
- RTK: output compression and savings measurement
- Codegraph: local code graph and structured code query
- DeepSeek Reasonix: ACP/stdio and planner/executor ideas
- Deepcode CLI: skill paths, MCP, CLI/session management
- OpenPencil candidates: professional design-document behaviour only until an exact repository,
  SDK/version, license, and adapter boundary are promoted; not the assumed M07 spatial host
- OpenCut Classic: video timeline/native video editing direction
- xyflow: preferred M07 renderer spike candidate only; not a promoted dependency yet
- tldraw: behaviour reference only under its current production SDK license

Everything else remains black-box reference unless explicitly promoted.

## 9. Current App Reuse Policy

Do not start by asking “what can we keep?”

Start by asking:

1. Does this code support the product thesis?
2. Does it use Craft session, permission, timeline, settings, and renderer flow?
3. Does it complete a real user-visible loop?
4. Can both human UI and agents operate it through the same action path?
5. Can we verify it through real behavior?

Keep it if yes. Rewrite or discard it if no.

Current code should be treated as three categories:

- **baseline**: Craft code that remains the foundation
- **candidate asset**: Fleet additions that may be useful but need re-verification
- **legacy experiment**: display-only, stubbed, duplicated, or directionally wrong code

The next engineering pass should classify code against the development spine, not preserve it for sentimental reasons.

## 10. Quality Bar

A feature is `usable` only when it has:

- a real UI path
- a real backend path
- a real state/persistence path where needed
- permission and timeline behavior
- agent-native action access when it is writable
- error handling that tells the user what happened
- real behavior verification

Anything less is:

- `wired but not visually checked`
- `display-only`
- `not implemented`

“Tests pass” is not a product status.

## 11. Documentation Architecture For Parallel Development

The old corpus cannot remain as active execution material. It contains useful decisions, but it also contains reversals, stale states, parallel route proposals, and historical implementation claims. The active documentation must behave like a control plane for multiple agents.

Use this structure:

1. `COMPOSABLE-WORKSPACE-ARCHITECTURE.md`: approved product/state boundaries.
2. `DECISIONS-LEDGER.md`: final promoted decisions and reversals.
3. `PERSISTENCE-AUTHORITY-MAP.md`: one logical authority per state class.
4. `OWNERSHIP-MATRIX.md`: package and contract ownership.
5. `WAVE-MODULE-MAP.md`: the only execution-gate/module placement source.
6. `DOCUMENT-READINESS.md`: spec maturity independent from product/gate status.
7. `PARALLEL-AGENT-OPERATING-MODEL.md`: how Lead and Workers coordinate.
8. `docs/modules/*.md`: one complete product loop per module.
9. `docs/agent-packets/*.md`: executable work packets only after a slice is execution-ready.

The key change from the old docs is that a module document is not just a plan. It must be a complete frontend/backend/Agent/permission/timeline/validation loop that can be safely divided among agents.

## 12. Immediate Next Move

The next move is W0.1 migration/document/contract reconciliation, not feature implementation:

1. Align the Decision Ledger, architecture boundary, contracts, wave map, ownership, Board, module index, and packets.
2. Resolve AgentSeat/tag authority, ActionInvocation caller/idempotency/revision, orthogonal action
   policy, typed SessionEvent payloads, ArtifactRef, capability, workflow, ExternalJob, and view
   contribution contracts.
3. Have the Lead verify canonical implementation parity and record one new frozen contract version.
4. Only then open W1 skeleton work. Terminal/CLI remains the first execution-spine loop; the first
   creative loop remains D45 and does not start until W3A gates pass.

---

## 13. Historical Architecture Draft (Superseded by §18 and ADR-0033)

> **Sections 13-17 are retained only as historical context. They are not a delivery contract and
> their estimates, SQLite/daemon topology, and F Track references are unverified.**

This historical draft is retained only to explain why Electron-shell reuse was considered. It has no current external-comparison dependency; the binding upstream baseline is `docs/UPSTREAM-BASELINE.md`.

### 13.1 架构路线决策

| 对比项 | 方案 A：从零重写 (Tauri 壳) | **方案 B：原版补强 (Electron 壳) [最终选型]** |
|---|---|---|
| **状态共享** | ❌ 需在 Rust 侧新造 IPC 共享层，CLI/GUI 数据同步极难 | ✅ **天然共享**：CLI 和 GUI 均为平等的 RPC 客户端连入同个 Bun Server |
| **开发工作量** | ❌ 约 16 周（重写 Shell/Session/审批/时间线） | ✅ **约 8 周**：仅针对 CLI、Browser、Canvas 进行增量补强 |
| **CDP 自动化** | ❌ 需在 Tauri 重写无头/可视化窗口控制 | ✅ **直接复用**：已有成熟的 `BrowserPaneManager` 原生操控 |
| **内存/资源开销** | ✅ 极低 (50-100MB) | ⚠️ 稍大 (150-250MB) |
| **选型结论** | ❌ 投入产出比极低，且严重违背全局决策 D27-R | ✅ **最优解：避免重复造轮子，实现核心业务功能快速收敛** |

### 13.2 物理运行拓扑

```text
┌─────────────────────────────────────────────────────────────────┐
│  Bun Headless Server (packages/server) ← 核心状态常驻             │
│  - WebSocket RPC 协议支持 (MessageEnvelope 规范)                 │
│  - SessionManager / SQLite 持久化 / 本地 API 路由                 │
└─────────────────────────────────────────────────────────────────┘
       ▲                          ▲
       │ WebSocket (craft-cli)    │ WebSocket (Electron)
       │                          │
┌───────────────┐        ┌──────────────────────────┐
│  craft-cli    │        │  Electron Desktop App    │
│ 补强 CLI 客户端│        │  复用原版 + 补强 Surface   │
│ (apps/cli/src)│        │  (apps/electron/src)     │
└───────────────┘        └──────────────────────────┘
```

## 14. Historical Delivery Spine

This historical draft limited delivery to the core terminal/CLI interaction loop:
1.  **M00 (Platform Spine)**: one local state/permission/timeline authority; physical storage was
    not yet verified.
2.  **M03 (Internal Action Registry)**: Structured action routing pipeline (PreInvoke / PostInvoke hooks).
3.  **M02 (Terminal CLI Runtime)**: Local CLI `craft-cli` command launcher using the bounded Fleet Bridge/local runtime path defined for the active wave.

All other surfaces (Browser, Canvas, Video, AIGC) are currently marked as non-active downstream waves.

## 15. Historical Wave Non-Goals

The following modules are locked and must not be touched during the current delivery wave:
-   **Canvas/Design Surface (M07)**: No infinite canvas stubs or OpenPencil bindings.
-   **AIGC Jobs Surface (M08)**: No external job executor loops or batch API routing.
-   **Video Surface (M09)**: No FFmpeg rendering, timelines, or clipping components.
-   **Complex Browser Editing (M06)**: No DOM mutation bindings, browser automation scripts, or external crawler hooks.
-   **Secondary Systems**: No secondary session store, permission model, or memory database. All work must build directly on the platform spine.

## 16. Historical Surface Entry Conditions

No worker agent may initiate work on downstream surfaces unless the following prerequisites are met and verified by the Lead:
-   **Browser Surface (M06)**: Requires M00 (Spine), M03 (Registry), and M05 (Files) to be fully `usable`.
-   **Canvas Surface (M07)**: Requires M00 (Spine), M03 (Registry), and M05 (Files Library) to be fully `usable`.
-   **AIGC / Video Surfaces (M08/M09)**: Require M00 (Spine), M03 (Registry), and M05 (Library) to be fully `usable`. Until M11 is usable, any external-job cost must be recorded as `UNKNOWN` in the shared job record; M11 later enriches that record rather than creating a second job ledger.

## 17. Historical Usability Summary

A module or capability is declared `usable` only when the following criteria are verified:
1.  **State Persistence**: Session state and configuration persist through the canonical selected
    authority across application restarts.
2.  **Permission Gating**: Graded L0-L3 authorization checks are enforced; L3 triggers blocking user approvals.
3.  **Timeline Evidence**: Every user UI write and agent command writes a corresponding structured event to the session timeline.
4.  **Agent-Callable**: Capabilities are fully exposed in the action registry and callable via agent RPC tools.
5.  **Rollback / Evidence**: Non-destructive actions provide transactional undo points; destructive actions are explicitly marked.

## 18. W0.1 Architecture Reconciliation — Binding for W1/W2

This section supersedes the duplicated historical topology drafts in §13 for W1/W2 execution.

Fleet keeps and simplifies the existing Electron desktop shell. The shared **logical Platform Spine** is the single in-product owner of session state, permissions, timeline evidence, and local persistence during W1/W2.

| Term | W1/W2 meaning | Not implied |
|---|---|---|
| Logical Platform Spine | The one owner of session, permission, timeline, and canonical local state. Physical storage is selected through W0.1 and `PERSISTENCE-AUTHORITY-MAP.md`. | A separately installed or always-running service, or an assumption that SQLite is already canonical. |
| Terminal host | The Electron main-process boundary that owns PTY lifecycle. | A second session or permission authority. |
| Fleet Bridge | The narrow authenticated boundary through which one runtime lane reports evidence and receives bounded context. | A general Fleet API or permission bypass. |
| Physical daemon | A later conditional deployment choice under D22. | A prerequisite for W1/W2. |

No independently installed or long-lived daemon is part of the W1/W2 delivery contract. A future offline/background need may justify one only through a new Lead-approved ADR covering lifecycle, local authentication, single-instance behaviour, recovery, upgrade, and state-ownership migration.

External architecture comparisons are nonbinding research; the verified upstream baseline and migration gate live in `docs/UPSTREAM-BASELINE.md`.
