# 02 — Decisions

> The promoted product/architecture decisions that still hold. First place to check whether a design
> question is already answered.
>
> **Write rule:** add an entry only when a durable direction is decided, with a date. When a
> decision changes, edit the entry in place and note the change — do not keep a diary of dead
> states. A current owner request always outranks any entry here.

## A. Product shape

- **P1 — Fleet is an AI work platform, not a chat tool.** Human owns the top ~10% of judgment and
  the bottom ~10% of common-sense guardrails; agents execute the middle ~80%. (2026-07-08)
- **P2 — Build on Craft without inheriting every upstream product change.** The committed `app/`
  remains the one implementation tree. Pinned Craft v0.10.5 is the product/interaction baseline;
  pinned v0.11.1 is a selective-update reference. Port an independent fix or backend mechanism only
  after a code comparison proves that it preserves the v0.10.5 work model and Fleet's authorities.
  Never merge either checkout wholesale or create a second app. (2026-07-08; superseded baseline
  policy, owner direction 2026-07-21)
- **P3 — Retain the Craft shell.** The spatial canvas is a first-class *project surface* hosted
  inside the shell, not a replacement shell. (2026-07-09)
- **P4 — Fleet is open/free local software.** No Fleet account, login, or subscription. (2026-07-08)
- **P5 — UI baseline is clean Craft v0.10.5; later upstream UI is comparison evidence only.** Start
  from the older shell, navigation, composer, menus and session actions. Preserve useful controls
  before changing their placement. New surfaces exist only when a capability must be visible and no
  existing surface can host it. v0.11 Projects/Board UI is never the default starting point, though
  a bounded interaction or backend mechanism may pass P2's selective-intake gate. (owner, binding,
  2026-07-10; baseline corrected 2026-07-21)
- **P6 — One user concept: Project = Workspace = one folder.** The user meets exactly one work
  boundary — **Project**, which is a chosen folder on disk. Creating a project is picking or
  creating that folder; opening a folder is opening a project. Workspace remains the invisible
  storage/config/session/remote-routing implementation authority. No default surface may present
  "workspace", "local folder" and "project" as parallel concepts; pickers, switchers and
  "send to…" dialogs converge on the single Project vocabulary and one switcher control. Folder-
  bound Sessions are grouped under Project rows; folder-less Sessions remain legal and appear in a
  sibling **Conversations** section rather than being silently attached to a default Project.
  Selecting a local Project filters the current Session list and does not replace global Sources,
  Skills or settings context. Adding a local Project opens the operating-system folder picker
  directly; it does not route through an intermediate creation screen. The one-boundary model is
  binding;
  navigation, migration, and remote-project presentation are delivered as coherent verified slices
  (spec: [`specs/R1-one-boundary-language.md`](specs/R1-one-boundary-language.md); design source:
  [`design-library/20-workspace-project-session-remote-connections.md`](design-library/20-workspace-project-session-remote-connections.md),
  which is source material, not authorization for a shell rewrite). (owner, binding, 2026-07-11;
  folder collapse + single-switcher rule, owner direction 2026-07-20)
- **P7 — Remote Projects connect directly to another Fleet instance; no Fleet account or central
  coordinator.** Controller supplies only server URL + connection token. A remote access grant is
  hashed, revocable, and scoped to explicit Workspace/Project IDs, separate from the embedded
  server's internal token. Reuse Craft's bidirectional Workspace-routed RPC and connection
  lifecycle — no PostgreSQL control server, polling daemon, or Fleet-hosted relay. Desktop hosting
  extends the Electron main-process server lifecycle; VPS hosting reuses the headless/systemd path.
  Remote standby uses an independent `prevent-app-suspension` reason. Port mapping/frp/private
  networking stay outside Fleet's data model. UI says "user-hosted workspace service / another
  device", never "Craft Agent server". (owner direction 2026-07-11; terminology 2026-07-13)
- **P8 — Fleet's core does not depend on Craft-operated cloud services.** Startup, local
  Projects/Workspaces, sessions, files, permissions, labels/statuses, tasks/boards, automations, and
  direct remote access must work without `agents.craft.do`, `mcp.craft.do`, or any Craft
  account/server. Each inherited cloud hook migrates capability-by-capability: prefer local;
  otherwise user-configured/self-hosted endpoint; retain Craft services only as explicit optional
  connectors; otherwise honestly disabled. Upstream sharing currently uploads full sessions to
  Craft's viewer API — never present it as Fleet-native. **Upstream intake stays open:** track
  official tags/release notes/source to port fixes selectively; but Fleet's binary updater must use
  a Fleet-controlled/user-configured channel (installing an official Craft binary over Fleet would
  erase the fork) or disable cleanly. Spec: [`specs/R2-independence.md`](specs/R2-independence.md).
  (owner direction, amended 2026-07-12)
- **P9 — "Cloud mode" is a user-owned remote execution profile, not a Fleet cloud service.** A cloud
  target is the same Fleet runtime on user/team-controlled hardware, reached via P7 transport.
  Execution location (`this device / self-hosted cloud`) and workspace isolation
  (`current checkout / isolated worktree`) are independent choices. A Git provider is an optional
  connector, never a prerequisite. A session pins to one execution target; the controller receives
  routed events and explicit artifacts, not an invisible full replica. **Presentation rule:** the user
  chooses only the execution location beside the project selector — `本地 local` (this device) ·
  `云端 cloud` (user-owned remote target; a Git provider such as GitHub stays an optional
  connector). **Worktree isolation is never a user preset:** the agent/kernel decides per task when
  an isolated worktree is required (parallel writers, risky changes — C4/C11), creates and cleans
  it automatically, and surfaces it as visible task status/evidence, not as a choice. The cloud
  preset ships only when R14 lands — no disabled placeholder control before that (G6). (owner
  direction 2026-07-13; location presets + agent-managed worktrees, owner direction 2026-07-20)

- **P10 — One work list and one create flow.** The primary action is **New Task** (「新建任务」),
  available globally and on each Project row, but it creates work through the existing Session
  authority; R1 does not require a parallel v0.11 Task record for every conversation. New Task is
  context-bound: a Project-row trigger supplies that folder, while the global trigger may create a
  folder-less Session under Conversations. A Session appears once in exactly one of those sibling
  scopes. There is no permanent **All Sessions** navigation entry: search, status, flagged, labels
  and archive are filtered states over the same Session-list implementation, never additional
  conversation homes. Label definitions live only in Settings; Session menus assign them.
  Selecting a Project opens its documents, assets and settings, not another copy of its Session
  list. A later Claude/Codex-style task center may project selected Session/Task/Job state through
  the existing authorities; it is not the v0.11 Kanban Board and does not justify a second store.
  (owner direction 2026-07-20; corrected after source and interaction review 2026-07-21 and
  boundary review 2026-07-25)

## B. The spine (agent-native execution)

- **S1 — Human UI, agent tools, and (later) workflow steps share one canonical invocation model:**
  action definition, caller-aware policy evaluation, executor, state authority, attributed evidence.
  `PreToolUse` remains the Agent adapter; UI callers do not simulate an Agent SDK lifecycle;
  different caller identities may receive different policy decisions. (amended 2026-07-11)
- **S2 — Manual editing is an escape hatch, not the primary path.** Manual UI edits write through
  the same action + timeline path agents use. (2026-07-08)
- **S3 — Automatic decisions are risk-graded and replayable.** Low risk may be rule-automated;
  medium risk needs a rule or pre-authorization; high risk (destructive, credentials, external side
  effects) always needs explicit confirmation. Reuse Craft's permission modes — no parallel scheme.
  When command rules become configurable, each rule carries a plain-language justification plus
  positive/negative examples checked at load time, extending Craft's Bash/PowerShell validators and
  `PreToolUse`. (2026-07-08; rule shape clarified 2026-07-15)
- **S4 — Structured-output validation is two-stage.** Structural (schema/types) first, then semantic
  (catches structurally-valid-but-wrong outputs). Over-constraining a schema forces models to
  hallucinate compliant values; make judgment fields optional with an explicit `uncertain` value and
  default security fields to most-restrictive. (2026-07-08)
- **S5 — Risk, approval, and recovery are separate dimensions.** Risk describes the side effect;
  approval records `allow / ask / deny / owner_checkpoint`; recovery records
  `inverse / conditional_restore / snapshot_restore / none`. A low-risk label never implies an undo
  path that does not exist. Rolling back conversation history does not revert workspace files; any
  UI offering file recovery must invoke a real inverse/snapshot/VCS path and state its scope.
  (2026-07-11; rollback boundary clarified 2026-07-15)

## C. Identity, teams, and delegation

- **C1 — Two-layer agent identity.** A global low-context Manager Agent and per-project Agents are
  separate identities. No privileged backdoor; the Manager never bypasses permission. (2026-07-08)
- **C2 — Fleet owns the team; a CLI owns one run.** Cross-runtime orchestration uses stable agent
  seats, runtime-specific lanes, and bounded team-run requests. A CLI leader may *request* a member
  run through a narrow authenticated bridge, never directly owning another runtime's tools.
  "Multi-agent" must not mean "multiple chat bubbles." (2026-07-08)
- **C3 — No bare subagent spawn.** Spawning requires a **TaskBrief** (goal, scope paths, known
  facts, constraints, deliverable, budget); the child returns a **RunReport** (summary +
  artifact/evidence refs), not a transcript dump. Large outputs pass as pointers. Unscoped "explore
  the whole repo" is denied by default. **Budgets halt:** crossing a declared budget pauses
  execution and requires explicit confirmation — it never burns on unnoticed. Every child has a
  stable hierarchical task path; spawn explicitly selects no parent history, full history, or last N
  turns. Lifecycle recovers from the existing Session store, not a second team store.
  (2026-07-10; budget circuit-breaker 2026-07-11; context-fork boundary 2026-07-15)
- **C4 — Land code via an agent-first Git/PR protocol; branches are never a user surface.** A PR
  is a *remote delivery protocol*, not the task board and not an IDE. Concurrent local writes are
  protected by leases or branch/worktree isolation, never "git alone." **Presentation rule (owner
  direction 2026-07-20; Claude/Codex desktop pattern as evidence only):** the user never creates,
  names, switches or cleans branches in default surfaces. The agent/kernel manages branch/worktree
  mechanics; the user meets only task-level verbs — **查看改动 (diff) · 应用 (apply) · 放弃
  (discard) · 创建 PR** — plus visible status ("ran in an isolated worktree"). Landing ladder:
  read-only task-changes diff joins the basic surfaces first (R3-era, over plain `git status`/
  diff of the project folder); apply/discard become real with agent-managed worktrees (R6);
  PR/remote verbs land with R14. **Merge to remote main stays high-risk and requires explicit
  confirmation.** (2026-07-10; branch presentation + ladder, 2026-07-20)
- **C5 — Use the lightest sufficient organization.** Direct execution, bounded delegation/parallel,
  independent verification, and measured hierarchy are policies over the same task/Session/
  permission/artifact/evidence authorities — not separate products. The router selects from task
  independence, write overlap, verification risk, context size, runtime capability, budget,
  deadline; the user may override. Added hierarchy requires measured evidence. (2026-07-15)
- **C6 — Deterministic coordination; bounded Agent judgment.** Code owns dependency readiness,
  scheduling, capacity, retries, timeouts, budgets, permissions, leases, cancellation, status
  transitions, report validation. Agents own judgment-bearing work. ProjectDigest and RunReport are
  projections linked to authoritative events/artifacts, not a second history. Members communicate to
  deliver artifacts, request authority/information, report blockers, or resolve declared
  dependencies — not to generate recursive review conversations. Optimize total outcome-adjusted
  cost across all members. (2026-07-15)
- **C7 — Lock a versioned task contract per execution attempt.** Extend the existing Craft
  Task/Session authority with a `TaskContract` projection: stable criterion IDs, primary outcome,
  preconditions, allowed/reserved paths, non-goals, evidence requirements, budgets, contract
  version. An executing Agent cannot silently change the request, acceptance criteria, evaluator,
  tests, or harness; a necessary revision becomes a `ContractChangeRequest` and a new contract
  version. Metadata + SessionEvents on the existing authority — never a second task store.
  (2026-07-16)
- **C8 — Diagnose reality before product code.** Cheapest deterministic checks first (existence,
  installation, process/window, permission, input/path, connectivity, tool availability). Classify
  failures as product / environment / input / authority / evidence. Optional evidence failure never
  blocks the main output or authorizes capture/preview infrastructure work. (2026-07-16)
- **C9 — Execution and acceptance are separate authorities.** The executor cannot certify its own
  success by inventing or weakening acceptance. Verification returns `PASS` /
  `IMPLEMENTATION_FAILURE` / `ENVIRONMENT_FAILURE` / `EVIDENCE_UNAVAILABLE` / `CONTRACT_AMBIGUOUS`.
  A verifier is read-only by default; repair is a new bounded task. Tests/fixtures/harnesses are
  reserved paths unless the task explicitly owns them. (2026-07-16)
- **C10 — Progress must be monotonic; incidental findings stay incidental.** Every state-changing
  action maps to an unmet criterion or declared recovery edge. After two non-progressing
  state-changing attempts, execution halts (tool/hypothesis switches don't reset the count). An
  incidental defect is queued with evidence, never silently replacing the active task. (2026-07-16)
- **C11 — Multi-Agent trust comes from contracts and evidence, not conversation.** One accountable
  owner per criterion; at most one writer per occupied path; one integrator per shared contract.
  Members receive read-only contract projections and return artifact/evidence references; no
  recursive review assignment without a declared disagreement or risk trigger. Budget, cancellation,
  and failure propagate through the existing Task/Session tree. Provider adapters normalize
  capability/permission/lifecycle/usage/failure semantics without owning Fleet state. (2026-07-16)

## D. State and persistence

- **D1 — One logical authority per state class.** File format (JSON/SQLite/native) is an
  implementation detail of that authority, never license for a second product store. (2026-07-08)
- **D2 — Persistence retains the current Craft-derived filesystem authorities** unless a measured requirement
  changes the implementation. No product-wide SQLite control plane; no independent `jobs.json` /
  `memory.json` / `clips.json`. SQLite requires a written decision with a concrete trigger — see
  [`03-NON-NEGOTIABLES.md`](03-NON-NEGOTIABLES.md) §4. (2026-07-09)
- **D3 — No second long-lived background authority without a demonstrated lifecycle requirement.**
  The Electron main process owns the terminal/PTY lifecycle and the local spine. (2026-07-09)
- **D4 — Files and Library are separate layers.** Raw workspace files become Library assets only
  when selected, authorized, indexed, provenance-tracked. Cross-surface handoff uses versioned
  artifact references; native owners keep content authority; fan-out reuses the same version rather
  than silently copying bytes; every actual consumption records purpose and provenance. (2026-07-11)
- **D5 — Memory is layered, agent-maintained, local, partitioned, inspectable, deletable.** Agents
  accumulate memory autonomously as permissioned Workspace files in explicit layers: working/daily
  notes (never injected wholesale; indexed for scoped retrieval), curated long-term memory and a
  user profile (injected under per-file budgets with visible truncation), plus optional per-domain
  files scoped by loadout. Idle-time consolidation on an auxiliary lane promotes working notes into
  curated layers, archives stale entries, and writes a human-readable consolidation log; it never
  rewrites the main session's cached prefix mid-span. Human review is **optional curation**
  (pin / correct / delete at any time), not a retention gate. Hard floors autonomy never crosses:
  credentials/secrets never enter memory files (F2); partition and sensitivity filters precede
  similarity retrieval; Project memory never leaks across Projects — cross-project promotion is an
  explicit origin-marked transfer; durable entries carry source pointers into Session evidence;
  consolidation archives rather than hard-deletes; user deletion is honored end-to-end including
  derived index entries; the raw timeline stays the evidence authority and is never rewritten;
  memory stays under the single Workspace file authority (no memory database before the D2
  trigger); and verbatim transcript dumps are not memory. (amended 2026-07-15; agent-autonomous
  layering per owner direction, 2026-07-20)
- **D6 — ArtifactRef is derived from real handoffs, not frozen speculatively.** Versioned before the
  first cross-feature consumer, after at least one real producer and consumer validate the fields.
  (2026-07-11)

## E. Capabilities, cost, and modules

- **E1 — Continuous extensibility without restructuring the spine.** New capabilities and views
  *register*; they do not rewire the core. (2026-07-09)
- **E2 — Capability management separates install / loadout / runtime.** Agent attention is protected
  by scoped loadouts, not one global always-on tool pile. (2026-07-08)
- **E3 — One usage/cost ledger.** Real / estimated / unknown cost in one ledger; modules embed its
  fields. Auto-routing/cache/fusion apply only to API/OAuth lanes and default off; CLI-runtime lanes
  bypass them. Batch API work uses native batch endpoints. (2026-07-08)
- **E4 — Native engine per surface, one shared spine.** A "design action/patch" is an *envelope* for
  handoff — never a universal internal document model pretending to natively edit DOM, code, design,
  video, and decks at once. (2026-07-08)
- **E5 — The canvas projects the artifact relationship graph; it does not own domain truth.**
  `spatial`, `reference`, execution `input`, immutable `derived-from` provenance, leadership, and
  executable `workflow` are distinct relationship classes with different owners. A visual connector
  is never automatically an executable edge or a provenance fact. v1 workflows are finite DAGs of
  typed steps, stored as immutable versioned project documents when run. Full vision:
  [`design-library/07-canvas-spatial-orchestration-VISION.md`](design-library/07-canvas-spatial-orchestration-VISION.md).
  (amended 2026-07-11)
- **E5a — The canvas commits to the DOM-family rendering approach; React Flow v12 is the default
  first implementation and custom DOM+SVG is the named in-family fallback; the domain model stays
  renderer-independent.** What is **committed now** (product decision, owner-delegated): Fleet
  cards are live React components, so the primary renderer is DOM/React-based — GPU engines
  (Pixi/CanvasKit) may appear only as a *media layer* under the DOM viewport, never as the primary
  scene graph, and no canvas-engine store (tldraw/Fabric/Konva/Leafer) becomes a domain authority.
  Grounds: four independent shipping products with Fleet-shaped workloads are all DOM-family —
  TapNow, MiniMax Hub/Hilo, TRAEWork on React Flow (owner-provided analyses), and Mayi Canvas on fully
  custom DOM + `translate3d` + SVG bezier with rich media/agent nodes
  (`references/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md`). What the **E5a spike decides** (may run
  any time from R5; must pass before deep R7 investment): React Flow vs custom DOM+SVG *within the
  family*, by named criteria — representative rich cards, concurrent agent updates, media proxies,
  ≥500-node viewport culling, memory recovery in the real Electron app. Implementation constraints
  either way: custom edge overlay for the six edge classes; visible-node virtualization + thumbnail
  workers + object pools (Mayi Canvas performance-mode evidence); iframe/webview previews stay outside the graph
  layer; resource budgets per E8. tldraw stays behavior-comparison only (license = owner
  checkpoint); FlowGram is workflow-editor UX reference only. `plugins/xyflow` completes its
  admission record at the spike. **Anti-oscillation clause:** this entry supersedes both prior
  wordings ("committed default" and "leading candidate"); do not re-litigate the renderer without
  new spike evidence or an owner request. (replaced 2026-07-15; family committed + in-family spike
  defined 2026-07-17 — see `13-ORCHESTRATION.md` §4.5)
- **E6 — The BrowserPane is a governed evidence input, not a stealth browser or editable-doc
  surface.** Explicit control model (enablement, open-target, data clearing, screenshot policy,
  approval policy, site overrides, separate high-risk full-CDP developer toggle). Remote pages are
  evidence-only. (2026-07-08)
- **E7 — Exports are honest.** Motion/deck surfaces use native documents; PPTX/HTML/video are
  explicit exports with visible fidelity limits. (2026-07-09)
- **E8 — Local resource limits are product behavior, not exceptional failure.** Under saturation the
  product visibly queues, suspends, degrades, or hands off — it does not freeze or silently drop
  work. Exact thresholds are benchmark outputs. (owner concern; see
  [`design-library/OWNER-VOICE.md`](design-library/OWNER-VOICE.md) OV-002; 2026-07-11)
- **E9 — Thinking-intensity levels adapt per model; ungradable models are handled honestly.** The
  owner requires automatic per-model adaptation and honest handling of models that expose no
  gradable reasoning control (exact quote: `OWNER-VOICE.md` OV-006). One thinking-level vocabulary
  (Craft's `off…max`); each backend/model adapter maps it
  to what the provider actually supports — saturating, collapsing to on/off, or hiding the selector
  — and never claims a level was applied when it wasn't. Never emit a level the installed SDK's type
  does not accept. First application: `THINKING_TO_PI` saturates `max → 'xhigh'` (pi SDK 0.80.6).
  (owner, 2026-07-11)
- **E10 — Identity labels are a built-in product concept; display language is not identity.** The
  existing Craft label store is the single authority. Untouched starter labels localize at
  render/search time; user-created or renamed labels stay verbatim. Future Skill/Source/permission
  bindings use stable persisted identifiers, extend existing stores, and select references — the
  label itself never enforces access. Session startup/resume must expose the effective profile and
  actual instruction/capability source paths. A browser-safe built-in metadata catalog may map
  stable IDs to localization keys; it is not a second label store. Binding/provenance UI:
  `not implemented`. (owner 2026-07-13; boundaries clarified 2026-07-14/15)
- **E11 — A native design surface uses inspectable, transactional design data; it is not the spatial
  canvas model.** When Fleet gains a real design editor: schema-validated objects, one mutation path
  committing ordered change batches (may carry inverse changes, selection metadata, grouping,
  attribution; recovery still follows S5 and the owning Timeline). Tokens are references with stable
  identity; components keep explicit main/instance identity. Agents, human UI, and built-in
  extensions invoke the same governed mutation boundary. Not a Figma/Penpot clone; no second
  authority. (Penpot source intake, 2026-07-15)

- **E12 — Token economy is a first-class capability: intelligence per token, never saving for
  saving's sake.** Owner-set product bet: vendors won't reduce user token spend; Fleet does.
  Design authority: [`17-TOKEN-ECONOMY.md`](17-TOKEN-ECONOMY.md) — a layered pipeline (structural
  L0 → cache alignment L1 → deterministic input compression L2 → agent-directed compaction L3 →
  gated model-assisted compression L4 → opt-in output economy L5 → reviewed cross-session
  injection L6). Integration is three-tier: core-fused mechanisms at Fleet seams; optional
  connectors (repomix/context7/codegraph-class via Sources/MCP; optional local binaries with
  passthrough, like the shipped rtk path); rejected-as-product (relay proxies, universal semantic
  caches, auto-memory, default output-crippling). Hard rules: every optimizer is measured on a
  fixed trace (ROI = cost per accepted outcome), switchable, never silently semantic-changing,
  and pruned content stays recoverable by pointer; one ledger (E3), no second memory (D5).
  Scientific basis: context-rot/lost-in-the-middle degradation means leaner context raises
  capability. (owner direction, 2026-07-18)
- **E13 — Harness efficiency is a model-facing projection problem, not a reason to replace the
  Craft/Fleet kernel.** Benchmark `model × harness/profile × task` on the same sealed task and
  effort; never generalize a Pi win into “Pi always wins” or treat use of the Pi SDK as proof that
  Fleet preserves upstream Pi's minimal harness. Craft remains the product shell and the sole
  Session/permission/timeline/task/settings authority. A Pi-light path is an execution profile over
  those authorities, not a second agent kernel. Before each model call, the visible prompt, tools,
  Skills/Sources and environment capabilities are the smallest effective projection of
  `task need ∩ installed capability ∩ runtime availability ∩ caller policy ∩ live grant`; hidden
  tools grant no authority, and discovery/call must return through the existing permission and
  evidence path. TE1 remains observation-only. Prompt diet, centralized tool projection and a
  Pi-light profile require a separately accepted bounded slice after a trustworthy baseline; they
  are not smuggled into R1/R2 or TE1. OpenHands, Hermes and OpenClaw remain mechanism evidence, not
  replacement runtimes or authorities. (owner-approved documentation direction, 2026-07-20)

## F. Compliance (hard product requirements)

- **F1 — No quota bypass, stealth/anti-detection automation, credential/cookie extraction,
  unauthorized account automation, or terms-of-service evasion. Ever.** Multiple accounts are legal
  profiles only. (2026-07-08)
- **F2 — Preserve user data.** Destructive changes and external side effects require explicit
  authority. Credentials stay in established credential pathways. (2026-07-08)
- **F3 — Source reuse passes both a license gate and a product-fit gate.** A permissive license
  alone is not enough; copy only explicitly approved sources, otherwise adapter or black-box.
  (2026-07-08)

## G. Process

- **G1 — Owner gives concept and intent; the agent chooses the technical route — and owes honest
  dissent.** Do not ask the owner for engineering opinions. Extract design intent, pick the
  implementation, document assumptions, escalate only genuine conflicts. **Duty to dissent:** when
  an owner suggestion is technically suboptimal, the agent must say so before executing — one plain
  paragraph: the better route, why, and the cost of each. Product intent always remains the owner's
  call; silent compliance with a bad technical idea is a failure, not obedience. (2026-07-08;
  dissent duty added at owner request 2026-07-17)
- **G2 — Value-first integration order.** Integration follows [`05-ROADMAP.md`](05-ROADMAP.md):
  exactly one release is ACTIVE (a WIP limit, never a time phase — no NOW/NEXT/LATER,
  near/far, or calendar language); user-visible value ships before shared infrastructure; shared
  contracts (action seam, ArtifactRef, TaskBrief/RunReport) are **extracted from at least two real
  implemented callers**, never built speculatively first. Dependency edges describe required
  integration, not a permission system — the owner may request any capability early, and its status
  then reports the unresolved edges honestly. (2026-07-16; time-flavored labels removed 2026-07-17)
- **G3 — Verification is split: agents own everything below look-and-feel.** Agents run static
  checks, targeted tests, real non-visual data paths, and non-interactive smoke checks
  ([`09-QUALITY.md`](09-QUALITY.md)) without asking. Routine interactive/visual acceptance belongs
  to the owner; agents drive UI automation only on explicit request. (2026-07-16, replaces the
  blanket "no agent UI verification" rule)
- **G4 — Documentation architecture v2.** The authoritative set is the numbered documents indexed
  by `00-START-HERE`, OWNER-GUIDE, UI baseline, feature registry, `specs/`, `modules/` and
  `references/`. Each rule lives in exactly one canonical document. Superseded planning corpora are
  deleted after unique active facts migrate; they are not archived in-tree. Durable design assets
  remain in `design-library/` or module packets because they guide their ordered product rows,
  not because they commemorate prior process. (2026-07-16; clarified 2026-07-17)
- **G5 — Coverage and sequencing are separate.** Every product domain (canvas, video, browser,
  memory, tokens, sandbox, messaging, workflows, design, deck, jobs, remote…) stays registered and
  described at breadth level in [`11-PRODUCT-MATRIX.md`](11-PRODUCT-MATRIX.md) and
  [`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md) at all times, with its reference projects
  and gates named. Integration order never deletes a domain from design; matrix/page rows update in
  the same slice that changes their facts; depth (full specs) is written when a domain activates or
  the owner requests it. (2026-07-17)
- **G6 — Frontend track: pages may run ahead of behavior, honestly.** Complete page specs are
  encouraged ahead of backend work. Early page builds are allowed when: the page spec exists
  ([`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md) §5); data flows through a typed adapter
  with mocks behind the adapter (never in components); unwired pages are reachable only behind the
  developer/preview toggle; status is reported `display-only` until actual behavior is connected.
  The default user surface
  never ships a control without real behavior. (2026-07-17)
- **G7 — Sidebar trailing-meta at-rest visibility: hover-reveal, owner-confirmed.** History of
  record: an always-visible decision was claimed in a commit message on 2026-07-26 (d25b763f6,
  "second walkthrough round"); the same day, fa5ee7460 reverted it with no recorded rationale.
  Resolution: the owner confirmed **hover-reveal** on 2026-07-26 (owner reply: "维持 hover 显现" —
  keep hover-reveal). One at-rest visibility language per sidebar level
  ([`UI-SPEC.md`](UI-SPEC.md) §8); switching any element to always-visible reopens this decision
  as one change applied to the whole level, never a per-control fork. (recorded 2026-07-26;
  status DECIDED 2026-07-26)
