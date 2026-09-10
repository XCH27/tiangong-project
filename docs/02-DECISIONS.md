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
  remains the one implementation tree. Pinned Craft releases and hosted docs are comparison
  candidates: admit the better interaction, fix, or backend mechanism only after code comparison
  proves it preserves Fleet's one Project boundary and existing authorities. Never merge a checkout
  wholesale or create a second app. (2026-07-08; revised by owner direction 2026-07-21 and
  2026-07-28)
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
  connectors; otherwise honestly disabled. Upstream sharing previously uploaded (removed 2026-07-26) full sessions to
  Craft's viewer API — never present it as Fleet-native. **Upstream intake stays open:** track
  official tags/release notes/source to port fixes selectively; but Fleet's binary updater must use
  a Fleet-controlled/user-configured channel (installing an official Craft binary over Fleet would
  erase the fork) or disable cleanly. Spec: [`specs/R2-independence.md`](specs/R2-independence.md).
  (owner direction, amended 2026-07-12)

### P8-rev (2026-07-26): Online sharing removed

**Decision**: Remove online sharing/viewer functionality entirely (ChatPage share button, session-menu share item, shareToViewer/updateShare/revokeShare, session_shared/session_unshared events, apps/viewer).

**Rationale**: Default-visible controls with no actual behavior violate 03-NON-NEGOTIABLES.md §2. Owner decision 2026-07-26.

**Impact**: EXEC-12 implementation status updated; P-28 surface removed; viewer boundary retained as forward guard in 03-NON-NEGOTIABLES.md.

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

- **C1 — Agent identity is per session and per project; no identity class is privileged.** A
  session's effective identity comes from its expert kit and its Project/Workspace scope. No
  identity has a backdoor, and no identity bypasses the permission path. **Amended 2026-08-15:**
  the original entry described "a global low-context **Manager Agent** and per-project Agents" as
  two identity layers. That layer is retired — **H28 (2026-07-30) establishes that there is no
  manager agent and no captain role**, so the only surviving content of this decision is the
  no-backdoor / no-permission-bypass invariant, which binds unchanged. Delegation is a
  relationship any session enters by calling `spawn_session`, not a configured identity class.
  (2026-07-08; manager-agent layer superseded by H28, amended in place 2026-08-15)
- **C2 — Fleet owns the team; a CLI owns one run.** Cross-runtime orchestration uses stable agent
  seats, runtime-specific lanes, and bounded team-run requests. A **delegating session** may
  *request* a member run through a narrow authenticated bridge, never directly owning another
  runtime's tools. "Multi-agent" must not mean "multiple chat bubbles." (2026-07-08; "a CLI leader"
  reworded to "a delegating session" 2026-08-15 — relationship semantics per H28, no leader class
  exists. The bridge constraint itself is unchanged and still binding.)
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
- **E9 — Reasoning and runtime modes adapt per model; unsupported distinctions stay hidden.** The
  owner requires automatic per-model adaptation and honest handling of models that expose no
  gradable reasoning control (exact quote: `OWNER-VOICE.md` OV-006). Discovery records the exact
  provider- or CLI-advertised values for each model. Fleet may translate their labels for display
  and normalize an exact equivalent into its persisted vocabulary, but it must not invent a tier,
  silently saturate `max` to a lower value, or treat every provider `variant` as reasoning effort.
  Toggle-only reasoning becomes an honest on/off control. Speed, service tier, tool profile and
  other provider modes remain separate runtime-mode data even when the compact UI places them in
  the same menu. An adapter emits only a value accepted by the installed SDK/protocol and records
  the applied provider-native value; otherwise the control is hidden. The old Pi
  `THINKING_TO_PI.max → xhigh` mapping is legacy request compatibility, not a display capability and
  must never expose a false `max` choice. (owner, 2026-07-11; corrected 2026-07-30)
- **E9a — “One authority / one design language” constrains implementation, not the size of a UI
  correction.** Provider, subscription, model, reasoning, speed, and quota configuration may be
  regrouped, added, or removed inside the existing Settings home when that makes the real workflow
  shorter. The result must reuse Fleet/Craft settings primitives and the existing connection,
  credential, model-capability, and usage authorities; it must not preserve a weak screen merely to
  avoid visual change, and it must not introduce a parallel provider catalog, model preference
  store, credential path, or styling vocabulary. Model selection and reasoning selection remain
  separate controls. Reasoning choices and speed controls are projected from the selected model's
  actual capabilities and are hidden when unsupported. Provider setup and reauthentication should
  complete in Settings with progressive disclosure rather than navigating through the first-run
  onboarding experience. OpenCode Desktop is the primary workflow reference for the provider,
  model, reasoning, context-usage, and review surfaces: admit its flatter searchable inventories,
  in-place configuration, and capability-driven controls where they shorten Fleet's workflow.
  Existing Fleet composition is not grandfathered; redundant menus, nested pickers, and weak
  information architecture should be removed rather than cosmetically preserved. Admission still
  re-skins the workflow with Fleet/Craft primitives and keeps Fleet's backend stores as the only
  authorities.

  “Follow OpenCode” is a best-of admission rule, not permission to copy its state architecture or
  every pixel. Live provider/CLI discovery outranks the OpenCode catalog; the catalog may enrich or
  backfill missing metadata but never override a live denial. Low-risk selection and connection
  editing stay inline or in a menu on the current page. OAuth handoff, the operating-system folder
  picker, destructive confirmation, credential recovery and any flow too large to remain
  understandable may use the existing dialog/drawer/system surface. There is no per-connection
  “default model”; one app/Project new-task default may exist outside the connection editor, and an
  explicit Session choice always wins. A speed mode is never duplicated as another model ID.
  (owner clarification, 2026-07-29; boundary review 2026-07-30)
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


- **E14 — Fleet does not become "everything is a plugin"; it adopts the capability-seam discipline
  without the microkernel.** DeepSeek Harness (`dsh`, MIT, `47f943859bef`) is the strongest
  available implementation of the plugin-first agent runtime: Cordis dependency injection,
  **167 packages across 39 groups**, a Service Definition / Service Provider / Consumer role split
  per capability, per-session composition mounted from a preset `cordis.yml`, and a `dsh-tool-cordis`
  toolset with which the agent inspects and mounts plugins in its own live runtime. The owner asked
  whether Fleet should be rebuilt in that shape. **It should not**, for four reasons that are about
  Fleet specifically rather than about plugin architecture in general:

  1. **It is the second kernel this project already refused.** 03 §1 forbids a second agent harness
     or provider capability policy beside the existing Craft/Fleet paths, and E13 refuses promoting
     any profile or reference into a second kernel. A Cordis rewrite is not a variation on that
     question — it is the largest possible instance of it. P2 forbids a second app.
  2. **Different product, different unit of value.** `dsh` is a harness: the runtime *is* the
     product and third-party plugins are its surface (`dsh-plugin` GitHub topic, published npm
     scope). Fleet is a local-first workbench whose value is the *environment* — one Project
     boundary, one evidence timeline, artifact lineage, permissioned recovery (01-WHITEPAPER §1).
     Fleet's users are the owner and their agents, not plugin authors composing an agent. Adopting
     the architecture would import the other product's identity along with it.
  3. **The tax is paid in the currency Fleet is currently short of.** Once every surface is a
     plugin, nothing guarantees a surface still exists: `dsh` needs a generated cordis catalog, an
     *independent* AST walk over every `declare module 'cordis'` merge, fail-closed
     `SERVICE_WALK_EXEMPTIONS` / `EVENT_WALK_EXEMPTIONS` maps, per-package `./invariant` manifests,
     HMR disposal tests, and real-composition boot tests — because a plugin that silently fails to
     register looks identical to one that was never written (their 2026-08-09 note found 25
     surfaces documented nowhere). Fleet's own 2026-07-28 audit found the same failure class
     already present *without* a microkernel: ten fields dropped between wire and renderer while
     `tsc` stayed green. Adding indirection to a codebase whose gates were measuring nothing
     multiplies that class rather than removing it.
  4. **Measured runtime cost, from their own note.** Per-session composition costs ~1.31 MB and
     ~135 ms per agent on their standard preset; the object graph does not leak but *the lifecycle
     does* — nothing disposes an agent, so a web host retains every session it has touched. Fleet
     inherits Electron's memory profile already and has an explicit resource-honesty decision (E8).

  **What is admitted (mechanism reference, no code import — MIT permits rework, F3 language rule
  satisfied since it is TypeScript):**

  - **The capability-seam role split**, as vocabulary and a boundary rule rather than a framework:
    a swappable capability has a **Service Definition** (the contract and its vocabulary), one or
    more **Service Providers** (implementations), and one or more **Consumers** (what the model and
    other callers program against) — so replacing a local executor with a sandboxed one never
    churns the model-facing schema. Fleet already has this shape unnamed in
    `artifacts/history-backend.ts` (one routing definition, three backends), in
    `terminal/terminal-capability.ts` versus the R18 bounded runner and the gated PTY, and in the
    provider lanes behind EXEC-05. Naming the roles is free; splitting packages preemptively is not
    — their own rule is that a capability with one conceivable provider and one Consumer stays one
    package until a second appears. Recorded in `14-MODULE-ARCHITECTURE.md` §2.
  - **Four per-session-composition invariants** that Fleet's expert-kit design (H13–H23) does not
    yet state and needs: the composition a session was **created** with is a durable session fact
    and a resume rebuilds *that* composition, never today's default; switching is refused once a
    turn has run, because logged tool calls would be stranded by a different toolset; a per-session
    composition may not publish a process-global service; and **authoring** a composition is a
    privileged operation while listing and selecting are ordinary, because a composition names the
    capabilities a session runs — reading one is reconnaissance and writing one is arbitrary
    capability.
  - **Three enforcement rules** stated more sharply than Fleet states them today, each of which
    names a defect Fleet has already shipped: *enforce a decision in the operation that makes it*
    (schema omission, prompt filtering, facades and listener order are not enforcement when a
    direct caller can bypass them — precisely the shape of `PermissionManager.evaluateToolCall`
    defaulting to allow); *publish state only at its commit point*; and *represent one asynchronous
    operation with one lifecycle controller*.

  **What is rejected outright:** Cordis or any DI microkernel as Fleet's composition root; the
  167-package split; `ctx.<name>` property-proxy injection; and — most firmly — the
  self-modification toolset that lets the agent mount and unmount plugins in its own live runtime.
  That last one is a genuinely impressive capability and a direct contradiction of this product:
  C7 forbids an executing agent rewriting its own harness, and 01-WHITEPAPER's entire claim is that
  every consequential action is inspectable, permissioned and recoverable. An agent that can
  re-compose the runtime enforcing those properties has no such guarantee left to offer.

  **Anti-oscillation clause:** re-open this only with new evidence of a *specific* Fleet failure
  that the existing Craft registration seams (`SESSION_TOOL_DEFS`, Skills, Sources, MCP, views —
  E1/E2 already say capabilities register rather than rewire the core) provably cannot carry, or
  with an owner request. "It would be cleaner" and "DeepSeek does it" are not triggers. Note the
  diagnosis this decision rests on: Fleet's problem is not that it lacks a plugin architecture —
  it is that its existing registration seams are underused while a complexity-498 shell component
  bypasses them. A rewrite would relocate that problem, not solve it. Adopting the plugin
  architecture would be a product fork and therefore an owner checkpoint regardless
  (`OWNER-GUIDE.md`); this entry is the agent's technical recommendation against it, recorded so
  the question is not re-litigated from a README. (2026-08-15)


- **E15 — The runtime adapter contract is capability-gated, capability facts carry an origin, and
  approval never becomes an adapter verb.** EXEC-05 has been carrying "one adapter contract:
  start/attach/send/cancel/approve/health/stop" as a sentence with no implementation behind it. A
  source-level pass on 2026-08-15 over four independent implementations — AionCore (Rust,
  Apache-2.0), omnigent (Python, Apache-2.0, Databricks), cindy (TypeScript, Apache-2.0) and waku
  (Rust, GPL-3.0, already recorded) — converged on a shape sharper than that sentence, and each
  correction below names a defect the sentence permits:

  1. **Two contracts, not one.** A *connection/factory* (`open_session(spec, config)`,
     `close_session`, `capabilities()`) is distinct from a *per-session actor*
     (`dispatch(command)`, `events()`, `terminate()`, `pending_permission_requests()`). Folding
     them makes session lifetime and process lifetime the same thing, which they are not.
  2. **Dispatch is capability-gated and fails loudly.** An unsupported verb returns a typed
     `CommandNotSupported`, never a silent no-op. A capability's absence is checked *twice* —
     against the declared capability record, then against the optional method's presence — because
     a declaration can drift from the implementation. cindy's `NotSupportedError(capability,
     status)` carries `reason: 'sdk-missing' | 'not-implemented' | 'platform-limited'`, which is
     what lets a surface grey a control out with a tooltip instead of hiding it.
  3. **`unknown` is not `unsupported`.** omnigent's capability record uses `None` to mean *no
     claim*, reported as `UNKNOWN` and distinct from a declared `false`. This is the same rule
     Fleet already applies to cost (H29): absence of information is not a value.
  4. **A declared capability is a claim that gets tested.** omnigent runs a bench that live-probes
     interrupt/streaming/tool-calling and flags drift from the declaration. Fleet's adapters must
     not be allowed to declare what they cannot do.
  5. **Capability facts carry an origin, and declaration beats stale discovery.** AionCore's
     `CapabilityOrigin { DirectDescriptor, InternalDescriptor }` and
     `effective_agent_capabilities(backend, persisted)` overlay constructed truth onto persisted
     ACP-discovered JSON, with the rule that a constructed `false` is authoritative *so stale
     discovery cannot re-enable a transport*. This generalises H7 from agents to capabilities.
  6. **Never advertise a verb nothing routes.** AionCore keeps `accepts_proactive_input` separate
     from `supported_commands.steer` precisely because advertising an unrouted verb produces a dead
     button.
  7. **Pin a verified runtime version and report drift as a notice, not a failure.**
     `VERIFIED_CLAUDE_VERSION` / `VERIFIED_CODEX_VERSION` with a
     `{Verified, Older, Newer, Unknown}` verdict. Note that AionCore *removed* CLI bundling on
     purpose: bundled-versus-user-installed divergence proved worse than drift.
  8. **`approve` is not an adapter verb.** This is the strongest finding and it is unanimous:
     none of the four implementations puts approval on the adapter. AionCore defaults
     `request_external_permission` to `Denied`; omnigent translates every harness's native hook
     payload into one `EvaluationRequest` against a single policy authority and **fails closed** on
     an unreachable or malformed response. Six vendors, one permission path. That is independent
     confirmation of 03 §1 and Decision S1 at a scale Fleet has not reached, and it means EXEC-05's
     verb list should drop `approve` rather than implement it per-lane.

  **Model routing stays out of the adapter.** cindy proves the boundary is package-enforceable:
  `@cindy/maker-core` (harness orchestration) and `@cindy/model-providers` (catalog + routing)
  do not import each other at all — the host is the only place they meet, `Provider` fans out over
  harnesses as `models[agent]` / `routing[agent]`, and `resolveRoute` is a pure function that reads
  no storage. Fleet already separates these by accident; E15 makes it a rule. Consequence for R6
  and the delegation kernel: an adapter declares and executes, a router chooses, and neither owns
  the other. Evidence and exact symbols: `references/REFERENCE-REGISTRY.md`. (2026-08-15)

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
- **G8 — The create verb is "New Task" (新建任务), and folder choice routes the result.** Owner
  decision 2026-07-26 resolving the four-noun divergence (New Task/Session/Chat/Conversation
  across triggers): every create trigger uses one noun, **Task/任务** — "应该统一成新建任务，
  只有任务才可以方便在对话和项目之间通用" (only "task" travels between Conversations and
  Projects). Routing semantics: a task created **without** choosing a local/cloud folder lands in
  对话 (Conversations); choosing a folder routes it into 项目 (Projects). Recorded owner
  direction for later releases (not an R1 work item): ~~管理Agent (management agents) will be
  Conversations-scoped tasks — no project binding, so they may read across projects.~~
  **Superseded by H28 (2026-07-30): there is no management agent.** Delegation is a relationship any
  session enters by calling `spawn_session`, not a configured class; a session needing to read across
  projects is an ordinary Conversations-scoped task whose expert kit declares those sources. UI copy,
  menu labels and the seven locale files converge on this noun; entity/code names (Session)
  stay unchanged — this is product vocabulary, not a data-model rename. (2026-07-26)
- **G9 — Mark All Read returns in the session-list header menu.** The v0.10.5 capability lost its
  UI entry when All Sessions was removed (RPC survived). Owner decision 2026-07-26: its home is
  the Session-list header dropdown, acting on the current filtered view; the dormant SidebarMenu
  branch stays gated. Restores the capability per the 简化不等于删除 rule — simplification never
  deletes capability, it relocates the entry with a named surviving path. (2026-07-26)
- **H1 — Artifact history is routed by kind; git is one backend, not the store.** The first
  snapshot design hardcoded git. That is right for code and wrong for everything this product is
  heading toward, in ways that are not recoverable later. Git stores each version of a compressed
  file whole — delta compression does nothing on media, so a repository grows by the full file size
  per edit and `git diff` on it is meaningless; this is exactly the problem git-lfs exists to solve,
  and it solves it by keeping *pointers* in git and the bytes in a separate content-addressed store.
  A canvas is one JSON document, so a file diff of "moved one node" is a whole-file rewrite; history
  has to be record-level to carry meaning, which is the shape tldraw's store already uses
  (`{added, updated: [from, to], removed}`, with a reversible diff and no snapshot required for
  undo). Decision: three backends behind one routing function —
  `text → git-tree`, `media → content-store`, `document-graph → operation-log`. A canvas and a video
  timeline are the same problem (references plus operations), so this is two new mechanisms, not
  three. Routing is by extension denylist rather than a size heuristic: a threshold would put a small
  PNG in git and a large generated `.ts` in the content store. Unknown extensions default to text,
  because misfiling a text file costs storage while misfiling a binary costs a diff nobody can read.
  The "never touch a ref" rule from the original design is scoped to the **git backend**; a content
  store has no refs to protect. Contract: `packages/shared/src/artifacts/history-backend.ts`.
  Rejected: git-lfs — it requires a server, which Decision P8 forbids as a startup dependency.
  (2026-07-30)
- **H2 — Attribution is orthogonal to history and required by all three backends.** Every change
  carries `ChangeAttribution { sessionId, agentId?, messageId?, at }`. With one agent this reads as
  bookkeeping; with several it is the difference between a review that can be read and a pile of
  interleaved edits, and between reverting your own work and reverting a colleague's. `agentId`
  absent means the human acted directly, which must stay distinguishable from an agent acting on
  their behalf. tldraw carries the same field (`source: 'user' | 'remote'`) for the same reason and
  simply needs fewer values. `planRevert` and `filterReviewDiffs` take an optional `agentId` scope;
  unscoped remains the default so single-agent sessions are unchanged. (2026-07-30)
- **H3 — Concurrent writes are admitted, not merged.** Two agents editing one file cannot be
  reconciled by git in a live session: there is no commit to merge and no human watching conflict
  markers. One writer at a time per path, second waits. This is a permission decision and belongs on
  the existing permission path (03 §1), not in a new lock manager. Leases expire so a crashed agent
  does not hold a file forever, and a holder may re-enter its own lease. `document-graph` is exempt:
  record-level operations on disjoint nodes genuinely commute, which is the only reason that format
  can be collaborative when source files cannot. (2026-07-30)
- **H4 — Worktree isolation is necessary and insufficient; runtime facets are declared with it.**
  Git worktrees are the established isolation primitive for parallel coding agents and are what
  Claude Code, Codex and Cursor all use. They stop one agent overwriting another's *files* and do
  nothing about the ports, databases, caches, scratch space and environment they share — two agents
  running the same dev server race for one port, and the failure presents as a flaky test rather
  than a collision. `AgentIsolation` therefore declares worktree **and** runtime facets together, so
  adding a facet is one edit instead of a bug found in production. Ports are assigned by agent index
  rather than found free: a found-free port changes every run, which makes a failure impossible to
  reproduce and a log impossible to read. (2026-07-30)
- **H5 — Session activity is derived; `sessionStatus` stays manual.** The session-row icon read
  `sessionStatus`, a Kanban label written only by a context menu, a URL parameter or a board drag —
  nothing set it automatically, so it answered "what did someone file this as", never "what is this
  doing". There were already two manual status fields (`sessionStatus`, `kanbanColumn`) and no
  derived one. `deriveSessionActivity` adds the derived one and replaces neither. Ordering is by
  urgency, not likelihood: a pending approval outranks running, because the first needs a human and
  the second does not, and with several agents in flight the only thing worth seeing at a glance is
  which ones are stuck. Child activity rolls up so a collapsed parent cannot read as calm while
  something underneath it is blocked. Presentation returns a *tone*, not a colour — themes own the
  palette — and only `idle` is muted and drawn without an indicator, because a column of identical
  grey dots hides the two rows that matter. (2026-07-30)
- **H6 — CLI agents connect over ACP; the three hand-written probes are debt, not design.**
  `cli-runtime-handshake.ts` reverse-engineers three tools three ways: OpenCode's model list is
  parsed out of human-readable `--verbose` text by counting braces; Codex gets a hand-rolled
  JSON-RPC conversation with hardcoded request ids against `codex app-server --stdio`; Claude Code
  is read by regexing `claude --help` for `--effort <level>` and by opening `~/.claude.json`'s
  `modelAccessCache` — another program's private state file, empty until that tool has been run and
  free to change shape without notice. Each of these breaks silently and reports the result as "no
  models" rather than "we could not read this", and a fourth agent means a fourth hack. The Agent
  Client Protocol is the standard for exactly this: JSON-RPC 2.0 over stdio, LSP's idea applied to
  coding agents, created by Zed in August 2025, joined by JetBrains, and by 2026 implemented by 25+
  agents with a shared registry. Gemini CLI speaks it natively (`--acp`); Claude Code and Codex have
  adapters (`claude-agent-acp`, `codex-acp`). Decision: one ACP client replaces the probes, the
  catalog is declarative, and `transport: 'legacy-probe'` marks what has not migrated yet so the
  debt is visible in the type rather than buried in a service file. Contract:
  `packages/shared/src/cli-agents/cli-agent-connection.ts`. (2026-07-30)
- **H7 — Detection and configuration are separate layers.** Borrowed from AionUi. **Provenance
  corrected 2026-08-15:** a source-level pass over the pinned AionUi checkout found **no symbol
  `DetectedAgent`**. What the checkout actually carries is `ManagedAgent`
  (`tests/unit/settings/agentFilters.test.ts`, consumed by `filterAgentsByAvailability`), whose
  fields separate discovered facts (`installed`, `status: 'online'|'offline'|'missing'`) from
  chosen configuration (`enabled`) — so the *idea* is confirmed and the *name* was wrong. The
  decision below is unchanged; only its citation is. The type Fleet's design was described against
  states it outright: what is installed on this machine is a fact to discover;
  what the user chose is a configuration that *references* those facts. The settings page currently
  renders probe results directly as the configuration, so a transient handshake failure silently
  drops the user's configured agent and there is no way to express "I want Claude Code" on a machine
  where it is not installed yet. `resolveSelection` therefore reports *why* a saved choice is
  unusable (`not-detected` / `agent-unavailable` / `model-missing`) instead of falling back to
  something else. (2026-07-30)
- **H8 — A resolved binary path is recorded, and bare command names are not trusted.** The probes
  call `execFile('claude', …)` with a bare name. A desktop app launched from Finder or the Dock does
  not inherit the shell PATH, so anyone who installed through nvm, fnm, mise, asdf, volta or
  Homebrew-on-ARM is told the tool is not installed while it sits in their terminal. Resolution
  order is `configured → inherited PATH → login shell → well-known paths`: a configured path is an
  instruction rather than a hint, and the login shell outranks guessed locations because it reflects
  the version manager's current selection while a well-known path may be a shim for a removed
  version. Detection results are cached (5 min on success, 1 min on failure) because every settings
  visit currently spawns three processes, one of which is an app-server. (2026-07-30)
- **H9 — The command runner states its boundary instead of letting the user discover it.** The
  terminal is `execFile` with a 30-second timeout and a 1.5 MB buffer: no PTY, no streaming, no
  cancellation, no persistent `cd`. Those limits are defensible for the bounded runner R18 scoped;
  discovering them by waiting thirty seconds for `vim` to hang is not. Commands are classified
  before they run — `bounded` / `interactive` / `long-running` — and one the backend cannot host is
  refused with the reason. Output truncation keeps the *tail*, because `maxBuffer` currently kills
  the process and discards everything including the error at the end, which is the only part anyone
  wanted. Adding a PTY backend later means declaring a second capability, not rewriting callers.
  Related: the settings page titled "Terminal" contained no terminal — it is the CLI agent page and
  is now named so. (2026-07-30)
- **H10 — Delegation routes by requirement, then by cost, and escalates on mechanical failure.**
  `spawn_session` lets a captain pick a model and `help=true` lists what exists, but nothing says
  what any of them are *good for* or what they cost — so the choice is made from a model id, and the
  predictable outcome is that everything runs on whatever the parent was already using, usually the
  most expensive option, including tasks that are three lines of text manipulation. "Cheap for
  simple, expensive for complex" cannot be implemented, because complexity is not observable before
  the work starts. What *is* observable is what a task requires. So: discard candidates that cannot
  do the work, take the cheapest that can, and escalate only when the cheap one mechanically fails
  (`tool-loop-exhausted` / `context-overflow` / `repeated-error` / explicit request). Escalating on a
  *wrong answer* is out of scope — that needs a judge, and without one the rule would degrade into
  "escalate when someone is unhappy". The savings come from step three: guessing the tier up front is
  wrong in both directions and expensive in one of them, while trying cheap and escalating pays the
  premium price only for the tasks that needed it. An escalation must strictly increase cost or
  context, otherwise it is a retry wearing a different name. The escalation path is computed at
  routing time so the captain can show its plan before spending anything. Contract:
  `packages/shared/src/agent/delegation-routing.ts`. (2026-07-30)
- **H11 — Sub-agents appear inline in the conversation; the session list stays clean.** Sub-agents
  are real sessions, and the code already excludes them from the left list (`!s.parentSessionId` in
  `AppShell`) while the board groups them under their parent. Both are right and neither is enough:
  five sub-agents per task would make the session list unusable, and a delegation visible only on a
  board is invisible while reading the conversation that caused it. Decision: the conversation
  carries a compact delegation strip — who was called, for what, how it ended — with the full
  sub-session one click away. Day to day the strip is the entire answer, which is the assumption the
  parent activity rollup (H5) already encodes. Escalations render as one row with its attempts
  attached, not as sibling delegations, because an escalation is one decision with two attempts.
  What the captain is *offered* is capabilities and a cost tier rather than a model list: a captain
  given ids picks by name recognition, and the cheap tier is only ever chosen when it is described
  by what it is good at rather than by what it lacks. (2026-07-30)
- **H12 — Model pricing is real data, not a hand-assigned tier.** `delegation-routing` sorted by a
  `CostTier` someone typed in, while `ModelDefinition` carries context window, modalities, reasoning
  efforts and runtime modes — and no price, so nothing could answer "what did that turn cost". The
  shape follows models.dev (which is what OpenCode normalizes against) because two parts of real
  pricing are easy to model wrongly. **Cache reads and writes are priced separately and not
  proportionally**: a write typically costs more than fresh input and a read a fraction of one, so
  collapsing them into "input" makes a cache-heavy agent look expensive and a cache-cold one cheap —
  exactly backwards for deciding what to delegate. **Price changes with context length**: several
  providers charge more above 200k, and a flat rate silently under-reports the long-context turns
  that cost the most. Subscription usage computes its equivalent metered cost and is flagged rather
  than reported as free — it consumes an allowance the user already paid for — and it sorts ahead of
  metered options at equal capability, because an unused allowance is money already spent. Unknown
  pricing sorts *last*: it cannot be shown to be cheap, and guessing in its favour is how an
  expensive model becomes the silent default. Contract:
  `packages/shared/src/config/model-pricing.ts`. (2026-07-30)
- **H13 — An identity label is a loadout, and attention is the budget it spends.** `LabelConfig`
  already has `kind: 'identity'` and carries one thing — a `systemPromptPreset` — with its own
  comment recording the gap: *"Skill/Source/permission bindings are not implemented"*. So an identity
  is a paragraph of text and every session sees the same tools whatever role it is playing. That is
  wrong for a measurable reason: agent accuracy degrades once tool counts pass roughly 10–15 and
  tool-selection accuracy collapses toward 13% on large tool sets, because functions blur together
  in attention and irrelevant parameter descriptions occupy working memory that should be spent on
  the request. OpenAI's guidance is under 20 tools per turn; Anthropic documents degradation past
  30–50. Giving every session every tool is therefore not generosity, it is an accuracy tax paid
  every turn. The published remedy is specialisation — the 2026 HTAA framing is an orchestrator plus
  specialists carrying 5–10 focused tools each — which is exactly what an identity label describes.
  Thresholds are recorded as `TOOL_BUDGET` (focused ≤10, crowded ≤15, over-budget >15) and skills and
  sources count against the same budget, because they arrive in the same window and compete for the
  same attention. An over-budget role is told to **split**, not trim: trimming loses capability while
  splitting keeps it and hands the parts to agents that can each hold their share. Contract:
  `packages/shared/src/labels/identity-loadout.ts`. (2026-07-30)
- **H14 — A loadout narrows what an agent sees; it never widens what it may do.** Grants stay on the
  permission path (`03-NON-NEGOTIABLES.md` §1). `requestedPermissionMode` is a *request* the
  permission path may answer more narrowly, and a session carrying several identity labels takes the
  **narrowest** requested mode, not the widest — combining roles must never be a way to accumulate
  permission that neither role was given. Loadouts resolve against the live registries and report
  what no longer exists rather than silently becoming a weaker role. This is what closes the loop:
  identity defines the specialist, the tool budget says when a role must split, delegation reaches
  the specialist instead of growing the current one, and permission decides what any of them may
  actually do. (2026-07-30)
- **H15 — Identity labels become expert kits; the field carries the kit.** Renaming follows the
  substance: an identity was a paragraph of text, an expert is a specialist definition. `LabelConfig`
  gains `expertKit { skills, sources, tools, requestedPermissionMode }` and `kind: 'expert'`;
  `kind: 'identity'` stays readable so stored catalogs keep working, and new writes use `expert`.
  Types renamed accordingly (`ExpertKit`, `assessExpertKit`, `unionExpertKits`,
  `describeExpertKit`, `rankExpertKits`); contract moves to
  `packages/shared/src/labels/expert-kit.ts`. (2026-07-30)
- **H16 — Delegates return findings; only the captain's session promotes memory.** D5 and the memory
  packet settle layers, floors and retrieval, and neither mentions delegation — the packet was
  written for one agent per session and the phrase "sub-agent" does not appear in it. The gap has two
  failure modes pulling opposite ways. If every sub-agent writes memory, working notes become the
  transcript dump D5 forbids: five specialists on one task produce five accounts of the same events,
  contradicting each other with no way to adjudicate, and the captain later reads its own delegates'
  notes as independent corroboration — an echo chamber with source pointers attached. If no sub-agent
  records anything, every finding dies with the sub-session and the next run rediscovers it at full
  price, which is the cost delegation exists to avoid. So the rule is asymmetric: **a delegate reads
  a narrow slice and returns a `DelegateFinding`; only the captain's session promotes anything
  durable, and only the consolidation pass writes curated layers.** A report is evidence; memory is a
  claim about what is true. Keeping delegates on the evidence side leaves one writer per task and one
  place a contradiction must be resolved. Delegates are refused *every* layer rather than given a
  private scratch: a scratch nothing reads wastes disk and attention, and one something reads is the
  echo chamber again. Promotion refusals are explicit (`no-source-pointer`, `low-confidence`,
  `sensitive`, `cross-project`) because each names something the captain could go and fix.
  Contract: `packages/shared/src/memory/memory-scope.ts`. (2026-07-30)
- **H17 — A delegate's memory read is scoped by its expert kit, for the same reason its tools are.**
  Handing a specialist the whole memory is the same attention tax as handing it every tool (H13). A
  delegate reads its kit's domain files and the `tool` partition and nothing else: it was given one
  bounded job, and the user profile or another domain's long-term memory is context it cannot act on
  but must still pay attention for. `sensitive-quarantine` and `archive` appear in no scope at all —
  quarantine is never injected (D5 floor 1) and an archived entry reaching a prompt would undo the
  consolidation that archived it. (2026-07-30)
- **H18 — Tool memory records the fact a call revealed, not the call.** The output is already in the
  timeline, which stays the evidence authority. What pays for itself is the durable fact: this
  repository installs with pnpm, that endpoint rate-limits above ten requests a second, this test is
  flaky on CI and not locally. Those apply to every future turn and rediscovering each one costs a
  full tool round-trip. Durability requires **repetition, not eloquence** — a single failure is as
  likely a transient as a rule, and writing it down teaches the agent to avoid something that works,
  so two independent observations is the threshold. Invalidation is by the tool disappearing or the
  convention changing, never by age: time-based expiry drops a correct fact about a stable repository
  while keeping a wrong one about a moving API. (2026-07-30)
- **H19 — A kit's catalog is not its loadout; the attention budget governs the active set.** H13 fixed
  the tool budget to the whole declared kit, which calls every substantial kit over-budget and tells
  the author to split. Real workflows are long — a design kit spanning problem framing, research, IA,
  flows, visual direction, motion, accessibility and engineering handoff is twenty-plus steps — and
  splitting one into three kits makes the user choose a kit *before* they know which step they are
  on. Reference kits in the wild ship well past the threshold and are right to. The mistake was
  conflating two counts: **catalog** (everything a kit can do; large is fine) and **active** (what is
  in the window this turn; this is what costs attention). A kit is a catalog you route within, not a
  bundle you carry, so twenty-eight skills can cost less attention than a loadout of twelve. This is
  the retrieval-based selection the measurements favour — choosing a subset before the model reads
  anything roughly tripled tool-selection accuracy while halving prompt tokens. `assessExpertKit`
  now measures the active set and distinguishes the two remedies: an unrouted kit is told to
  `add-skill-routing`, which loses no step; only a kit still over budget *after* routing is told to
  `split-into-specialists`. Contract: `packages/shared/src/labels/skill-routing.ts`. (2026-07-30)
- **H20 — Routing happens before the model reads, and exclusions are first-class.** Two refinements
  over the kit designs this borrows from. **Route mechanically, not by asking the model to choose.**
  A kit that relies on the model picking from twenty-eight skill descriptions reintroduces the
  problem it was built to solve: those descriptions are long, and reading all of them to select one
  is exactly the attention cost being avoided. Matching runs on declared triggers and only the
  winner's full text is loaded. **A skill must be able to say what it is *not* for.** Without
  exclusions the largest catalog absorbs every ambiguous request purely by having more surface to
  match against — a designer's "write the PRD" lands in the design kit because that kit mentions
  requirements more often than the product-management kit does. Exclusions are therefore evaluated
  before triggers and are decisive, not a tie-break. Successors are *offered* rather than loaded: a
  chain is a suggestion about what usually comes next, and auto-loading it turns a twenty-eight-step
  workflow into a twenty-eight-skill prompt one step at a time. Ranking prefers the skill with fewer
  triggers, because a catch-all beating a precise match is how the wrong step gets loaded.
  `auditCatalog` reports the failures that make routing feel broken — ambiguous triggers, dangling
  successors, unreachable skills — since the symptom is otherwise indistinguishable from the model
  simply choosing badly. Two example kits ship as data (`labels/example-kits.ts`): one small enough
  to load whole, one large enough that routing is the only thing that makes it usable. (2026-07-30)
- **H21 — A kit's catalog is unbounded; the budget never caps capability.** H19 measured the active
  set instead of the catalog, but its vocabulary still read as rationing — an author was told to
  "split" a kit for being large. That is the wrong trade. Capability is the product; token cost is an
  implementation detail, and a kit trimmed to satisfy a threshold is simply a worse kit — the user
  came for the twenty-eight-step workflow, not for twelve of its steps. So the catalog has no limit
  and never earns a warning. The only finding that matters is **architectural**: a kit with no
  routing loads all of itself, which `add-skill-routing` fixes at zero cost to the kit. A routed kit
  whose active set is still large reports `consider-splitting` as *information* — splitting
  distributes the same capability across agents that can each hold their share, and trimming, the one
  option that actually loses something, is never suggested. (2026-07-30)
- **H22 — The expert-kit gallery is a first-class surface, and a card says what installing costs.**
  A kit is only worth defining if it can be found, so the catalog needs browsing: role- and
  industry-shaped categories (people look for "the thing for my job", not "the thing that reads
  files"), an installed/available split, popular/newest ordering, and search. Installed kits sort
  first in either order — someone scanning is usually looking for something they already have, and
  burying it makes the installed tab the only usable view, which defeats having one list. A card
  carries skill count, connector count and **whether the kit routes**, because a reader cannot tell a
  routed twenty-skill kit from an unrouted one by size alone and the two behave nothing alike; that
  is how someone installs eight kits and wonders why the agent got worse. Missing connectors *refuse*
  installation rather than warn — a kit whose skills all fail on first use is worse than one never
  installed, because the failure presents as the agent being bad at the job. An unrouted kit is
  admitted with a warning: it works, it simply costs more attention than its size suggests, and that
  is the user's call. Unknown adoption sorts last rather than as zero, so a local kit does not
  silently outrank a marketplace one that has no count yet. Contract:
  `packages/shared/src/labels/kit-gallery.ts`. (2026-07-30)
- **H23 — `kind: 'identity'` is deprecated, readable forever, and normalized in one place.** Expert
  kits grew out of the identity-label design, so stored catalogs still contain the old value. It is
  never rewritten on read — rewriting a user's label store during a read is how a bug in the reader
  becomes a bug in their data — and it drains out through ordinary editing via
  `withNormalizedKind()`. New code must not write it, must not compare `kind` directly, and asks
  `isExpertLabel()` / `normalizeLabelKind()` instead: scattered `kind === 'identity'` checks are how
  half a codebase keeps accepting a value the other half has forgotten. **For any agent picking this
  up later: expert kits *are* the old identity labels, renamed and given a real payload.** That is
  the whole of the history worth carrying. Contract:
  `packages/shared/src/labels/kind-normalize.ts`. (2026-07-30)
- **H24 — Data sources are declared by a kit, not connected globally.** A globally-connected source
  is either always in scope — attention spent on data the current role cannot use — or toggled per
  session, which is a step nobody performs reliably. Once kits define roles the binding belongs to
  the kit, alongside its skills and tools, and it carries the two things a global connection cannot
  express: whether the kit *needs* it, and how sensitive the contents are. Missing **required**
  sources refuse activation; missing optional ones degrade and say so, because a curator that quietly
  ran over two of its five archives produces a plausible result, and nobody re-runs a result that
  looks fine. A binding declared read-write but not granted write is refused rather than downgraded
  to read: silently downgrading leaves the kit failing later at a write it was told it could perform,
  which reads as the kit being broken. Contract: `packages/shared/src/labels/kit-sources.ts`.
  (2026-07-30)
- **H25 — An imported archive is searched, never absorbed.** A chat export from another application
  is somebody's correspondence. It is exactly the material a memory curator wants and exactly the
  material that must never be injected wholesale or promoted into durable memory — treating it as
  "just another source" is how a private conversation ends up in `MEMORY.md` with a source pointer
  attached. So `local-archive` is forced to `sensitive` **regardless of what the binding declares**:
  the kit author is not the person whose correspondence it points at, and their judgement is not the
  one that should decide. Its disposition is `search-only`, and nothing derived from it is promotable
  automatically. This is not a restriction on usefulness — the value of an archive is the *pattern*
  across it (this team always ships behind a flag; this API is the one that keeps breaking), and a
  pattern is a new claim the curator states and sources, not a passage it lifts. (2026-07-30)
- **H26 — The memory-curator kit, and why its defaults are Hermes'.** A worked example of the whole
  design: kit-declared sources, routed skills, and a consolidation loop that earns its keep. It is
  the kit that makes every other kit better, because what it produces is what the rest of the system
  reads. Four choices are taken from Hermes' curator, which solves the same problem — an agent that
  saves a skill whenever it solves something novel accumulates dozens of narrow near-duplicates that
  pollute the catalog and cost tokens every turn. **Idle-triggered, not scheduled**: a pass needs
  both an interval since the last one and a stretch of inactivity, because a cron pass fires mid-task
  and rewrites the prefix the session is reading. **Two phases, expensive one off by default**:
  deterministic ageing (30-day stale, 90-day archive) costs nothing and always runs; model-driven
  consolidation makes broad structural changes and is opt-in. **Never deletes** — the worst outcome
  is recoverable archival, and pinned entries are untouchable by the pass *and* by the agent, because
  a promise a background job can override is not one. **First run defers a full interval**, so a user
  gets a whole cycle to look at what accumulated and pin or opt out before anything moves. Two
  additions Fleet needs: the consolidation pass declares a *requirement* (tools, no reasoning, modest
  context) rather than naming a model, so the router picks the cheapest qualifying option — ageing
  and dedupe are not reasoning work, and paying premium rates for a background pass is the surest way
  to have it switched off, at which point the duplicates return. And conflicts stay conflicts: when
  two entries disagree the pass records both, because silently resolving in favour of the newer one
  is how a correction gets overwritten by the mistake it corrected. A log line naming no entries, or
  promoting with no sources, is rejected — a consolidation log exists so a person can disagree with a
  pass they were not present for, and "merged 3 entries" is a receipt rather than an explanation.
  Contract: `packages/shared/src/labels/memory-curator-kit.ts`. (2026-07-30)
- **H27 — Foreign memory is never imported as memory; foreign history is imported as an archive.**
  Every competing product ships "import your Claude / Cursor / Coze memories". It is the wrong
  feature here, and not because it is hard. Another product's curated memory is a set of claims *it*
  judged durable, distilled for *its* retrieval, phrased for *its* prompt, under assumptions about
  what its agent could see and do. Three consequences make adoption unsafe. They **encode a different
  tool surface** — "prefers the terminal for file edits" is a fact about an agent that had a terminal
  and no file tools; it is a workaround, not a preference, and here it is simply wrong. They **carry
  no evidence pointer this system can follow**, so they violate D5's requirement that every retained
  entry point back into session evidence and can never be checked, corrected or argued with. And they
  are **already lossy** — someone else's summariser discarded the context needed to decide whether
  the claim still holds. What is valuable is the raw history underneath: conversations, project
  records, decisions actually taken. That is evidence, and the curator can derive Fleet-shaped claims
  from it with real pointers. So: `conversation-history` and `project-records` import as a searchable
  archive to mine; `curated-memory` and `agent-instructions` import as read-only documents, quotable
  with attribution and never adopted as fact. `mayAdoptAsMemory()` returns `false` unconditionally and
  exists so the next person to ask finds the decision rather than the gap. A mined claim needs three
  independent occurrences **and must not appear verbatim in its source** — lifting a good sentence out
  of somebody's chat log and storing it as memory is the exact failure the module prevents, and it is
  easy to commit by accident when the original phrasing is already good. Mined claims carry their
  `archiveId`, so dropping an import drops what was derived from it and a revocable import stays
  revocable. Contract: `packages/shared/src/memory/foreign-memory.ts`. (2026-07-30)
- **H28 — There is no manager agent and no captain role. Delegation is a relationship, not a class.**
  Earlier planning assumed a "管理 Agent" — a Conversations-scoped session configured to coordinate
  others — and a captain/delegate distinction the user would choose between. Expert kits, kit-declared
  sources, capability-and-cost routing and scoped memory remove the need for both. **Any session
  becomes a captain the moment it delegates**, and the same session is a delegate to whatever spawned
  it; the relationship lasts exactly as long as one delegation. There is no mode to enter, nothing to
  configure, and the UI must not offer either — a session that delegates is an ordinary conversation
  whose turn happened to call `spawn_session`. Naming these as user-facing roles would recreate
  precisely what kits removed: a decision the user has to make up front about a capability that was
  always available. `MemoryWriteRole`'s `captain` / `delegate` values are positions in a delegation
  and are documented as such at the type. Supersedes the management-agent direction recorded under
  G8. (2026-07-30)
- **H29 — A cost with no rate behind it is reported as unknown, never as zero.** `SessionTokenUsage.costUsd`
  carries three different meanings behind one number: Claude and Pi backends write a real figure from the
  provider; `sessions/storage.ts` initialises it to `0`; and every OpenAI-compatible endpoint leaves it at
  that `0`, because the OpenAI response body has no cost field to copy. That last case is not an edge —
  it is all seven CN providers, every custom base URL and every discovered model, so in a mixed setup the
  *majority* of sessions report `$0.00`. Summing that field gives a total that is confident, wrong, and
  **systematically low**, and it is low in precisely the place a user most needs the truth: the unpriced
  sessions are the custom endpoints where spend is least visible. So every figure travels with its
  provenance — `reported` | `derived` | `subscription` | `unknown` — and `unknown` is *not a number*, which
  forces the caller to render it as unknown. A reported `0` is believed only when the session moved no
  tokens; otherwise it is the storage default showing through and we derive instead. `derived` is
  deliberately not called "estimated": the arithmetic is exact, what is uncertain is whether the published
  rate is the rate this account is billed at. Subscription usage is valued but summed apart, because adding
  an allowance draw to a metered charge produces a total that matches no bill. Contracts:
  `packages/shared/src/config/session-cost.ts`, `usage-rollup.ts`. (2026-07-31)
- **H30 — Rate coverage is measured in tokens, never in sessions.** A usage total assembled from a few
  priced sessions and many unpriced ones needs to say how much of itself is real. Counting that as a
  fraction of *sessions* inverts the answer whenever size and pricing correlate — one unpriced session that
  moved two million tokens against thirty priced ones that moved a thousand each reads as 97% covered and is
  actually 2%. Tokens are the unit of both cost and attention, so tokens are what rank and what measure.
  The Usage page states coverage whenever any of it is unpriced, and prefixes the spend figure with
  "at least". (2026-07-31)
- **H31 — Users state rates for their own endpoints; the fix lives where the gap is noticed.** Since an
  OpenAI-compatible endpoint reports no cost, the only route to a real number is the user saying what they
  pay. Rates are stored as `LlmConnection.modelPricing`, a map keyed by model ID **beside** `models` rather
  than a field inside it, because that array holds bare strings as well as full definitions and pricing a
  string entry would mean synthesising a whole `ModelDefinition` around it — a half-invented definition is a
  worse thing to persist than a separate map. A stated rate always beats the bundled registry: for a custom
  endpoint the registry is guessing and the user is reading a contract. Only a connection that actually
  lists the model may hold its rate, or a stray entry would misprice a model that connection never served.
  The editor is on the Usage page next to the "no rate" it fixes, not in AI settings; four fields, because
  collapsing cache into input is the standard way a self-built cost display goes wrong, and agent work is
  overwhelmingly cache-heavy. (2026-07-31)
- **H32 — There is one settings page over the label store, and it is Expert kits.** The rename to
  expert kits (H21) changed the type and the vocabulary and then stopped: a separate read-only
  "Expert kits" page was added beside the existing "Labels" page, over the same
  `labels/config.json`. Two categories for one store is the [`UI-SPEC.md`](UI-SPEC.md) §11.6
  violation stated exactly — a settings category added where an existing surface could host it — and
  it did something worse than duplicate: it left the retired word in navigation, so from the outside
  the rename looked like it had never happened. The CRUD page absorbed the kit view; the `labels`
  category is gone; the `settings.labels.*` key namespace is gone; the `/labels` deep link resolves
  to the surviving page so existing bookmarks do not break. **A functional label and an expert kit
  are the same record** — one carries a payload — so they are edited in one place rather than behind
  a decision the user has to make before they have seen either. (2026-07-31)
- **H33 — Write paths accept `expert`; only reads still understand `identity`.** H21 widened
  `LabelConfig.kind` to include `expert` and left `CreateLabelInput` / `UpdateLabelInput` at
  `'functional' | 'identity'`. The new kind was therefore readable and **unwritable** — every UI
  control that appeared to set it was typed against an input that rejected it, and `crud.ts` still
  wrote `identity` unconditionally. A rename that only lands on the read side is not a rename; it is
  a second spelling with extra steps. `NormalizedLabelKind` is now declared in `labels/types.ts`
  (where the data lives, so the input types can reference it without importing their own normalizer)
  and re-exported from `kind-normalize.ts` so callers keep one import site. `identity` stays readable
  forever — config on disk contains it, and rewriting a user's store on read is how a reader bug
  becomes a data bug. (2026-07-31)
- **H34 — The UI guard now rejects raw palette colours, because that is what it missed.**
  `check-ui-contract.ts` enforced opacity, radius, type, elevation and stroke width, and said nothing
  about colour — so `bg-amber-500`, `bg-emerald-500`, `bg-blue-500`, `text-amber-600` and `bg-primary`
  all shipped through it green, in production surfaces, against a spec (§1, §11.1) that names six
  colours and forbids a seventh. A palette literal is worse than a wrong shade: it does not
  participate in theming at all, so it looks right in whichever theme it was written in and wrong in
  every other, including the light/dark pair. `primary` is a special case worth naming — it is not a
  token in this theme, it is the shadcn default every model reaches for, and `bg-primary` renders as
  a fallback rather than failing, so it survives review while responding to nothing. The playground
  is exempt from the colour rules only, because its swatch demos render palette colours *as content*
  and failing those would push someone toward disabling the rule rather than fixing a real surface.
  (2026-07-31)
- **H35 — Motion has values now, not one sentence.** UI-SPEC §9 gave two durations and no curve,
  which is not enough to decide anything with, so each surface needing a third case invented one.
  [`design-library/22-motion.md`](design-library/22-motion.md) adds the frequency test that decides
  *whether* to animate (an action taken a hundred times a day gets no animation, ever — which is why
  nothing on a session row transitions), `ease-out` with `cubic-bezier(0.22, 1, 0.36, 1)` for enter
  and exit and never `ease-in`, per-surface durations under a 300 ms ceiling, and the rules that are
  not about timing: never `transition-all`, only `transform`/`opacity`, never enter from `scale(0)`,
  origin-aware popovers, `active:scale-[0.97]` on pressables, transitions rather than keyframes for
  anything retriggerable. Derived from Emil Kowalski's design-engineering skill, transitions.dev's
  motion tokens and Impeccable's detectors — and §6 of that file records where Fleet **overrules**
  them (no springs, no stagger, no bounce), because those references are written for product apps in
  general and this is a workbench. (2026-07-31)

- **H36 — The expert kit declares what nothing hosts, so it carries one paragraph of text.** H13
  defines a kit as a label with a real payload — skills, sources, tools, a requested permission
  mode — and `LabelConfig.expertKit` declares exactly that. Measured 2026-09-10: `CreateLabelInput`
  and `UpdateLabelInput` carry only `kind` and `systemPromptPreset`, so **the payload has no writer
  in the tree**; and outside `ExpertKitsSettingsPage.tsx` nothing reads `label.expertKit`, so it has
  **no reader**. Every exported symbol of `skill-routing.ts` (`routeSkills`, `resolveChain`,
  `auditCatalog`, `skillApplies`, `isBlockingProblem`), `kit-gallery.ts` (`browseKits`,
  `admitInstall`, and six more), `example-kits.ts` and `kit-sources.ts` has zero consumers outside
  `packages/shared/src/labels/` itself; skill routing is never called from `prompts/`, `agent/` or
  `server-core/`. The only part of a kit that survives to runtime is `systemPromptPreset`, injected
  through `prompt-builder.ts` — which is precisely the state `expert-kit.ts`'s own header calls the
  wrong shape: *"an identity is a paragraph of text, and every session sees the same tools
  regardless of the role it is playing."*
  Two consequences are decided here, not deferred. **(a)** This is the same defect H33 fixed one
  field over: H33 widened `kind` because a rename landing only on the read side is not a rename, and
  left `expertKit` readable-and-unwritable. **(b)** The settings page runs `assessExpertKit` over
  `label.expertKit?.skills ?? []`, which cannot be anything but empty, and renders a tool-budget
  verdict and a "this kit loads everything" warning as statements about it — so the surface reports
  a measurement of an unreachable value. Under the status vocabulary the kit payload is
  `not implemented`; only name, colour, kind, value type and prompt are `usable`. The page's own
  agent-edit context compounds it by instructing the model *"Do not invent skill/source/permission
  binding fields"*, closing the one path by which a payload could have been authored.
  H19 and H21's catalog-versus-active distinction is unobservable for the same reason: it needs
  routing to exist, so the two counts always coincide and the only suggestion the assessment can
  emit is `add-skill-routing` for a kit with no skills. (2026-09-10)
- **H37 — Capability comes from a live binding, never from a field that says so. Which layer owns a
  capability is an OPEN owner ruling.** Three reference products state the same rule in unrelated
  domains (`references/REFERENCE-REGISTRY.md`, 2026-09-10 intake). OpenChamber's browser broker:
  *"Capability belongs to the connection, not to configuration"* — a client declares it can drive a
  page by opening its event stream with `browser=1`, which only a Chromium host does, so the flag
  lives and dies with that connection and there is no setting to enable. Cindy's skill slot: what
  the approval dialog showed must be byte-identical to what the agent later reads, enforced by one
  checker shared by both ends, with the link pointing at an approved snapshot rather than a mutable
  directory. Orca's accounts: an account is a directory with an ownership marker and "active" is a
  pointer, so a switch never overwrites a credential. In each case the declaration is backed by
  something that exists. H36 is what happens without that.
  **What Fleet is missing is upstream of the kit.** `03-NON-NEGOTIABLES.md` forbids a second
  authority and `05-ROADMAP.md` fixes integration order, but no document answers *which layer owns
  this capability*. So capability lands wherever it is written — a settings-tree label record trying
  to bind skills, sources, tools and permission — and R15 marketplaces and R10 authoring will hit
  the same wall for the same reason. Cindy's `core-product-principles.md` §§5–6 is a working answer
  under a compatible licence: **Core** carries only what the host must provide for everyone; a
  **Skill** describes how work is done; a **plugin** carries rich interaction; and 「Core 永远保持
  纯粹」 bars personal, team or industry workflow from Core behind four conjunctive conditions, with
  an unclear boundary defaulting to "prove it as a Skill or plugin first". Its companion rule is
  that determinism belongs in code — branching, validation, state machines, orchestration,
  permission control, error handling, retry and fallback — with prompt carrying only what needs
  language; a kit whose whole payload collapsed into a prompt string is the counter-example.
  **Owner ruling required (G1: this is a product boundary, not an engineering route).** Adopt a
  Fleet layer-ownership rule of that shape, then decide what an expert kit is. Option A — build the
  host: widen the write inputs, add a skill resolver that turns a slug into something a harness
  reads, project the tool subset (Craft v0.12's `proxy-tool-name.ts` is the prerequisite), and route
  the requested permission mode through the existing permission path. Option B — shrink to the
  truth: drop `expertKit` from the record and the budget assessment from the page, and let a kit be
  the named role with a prompt preset it demonstrably is. Both are smaller than the present state.
  Not an option: leaving a surface that measures a value it cannot obtain. (2026-09-10)
