# 02 — Decisions

> The promoted product/architecture decisions that still hold. First place to check whether a design
> question is already answered.
>
> **Write rule:** add an entry only when a durable direction is decided, with a date. When a
> decision changes, edit the entry in place and note the change — do not keep a diary of dead
> states. A current owner request always outranks any entry here.

### Promotion rule for durable decisions

An owner conversation may be recorded as product intent with an owner and date. It becomes an
**implementation-bearing** decision only when the entry names all of the following: owner intent;
the invariant it protects; the existing authority it reuses or the smallest justified new seam; at
least one real writer and consumer; persisted identity and scope; denied/failed/removed recovery;
acceptance evidence; and any license/platform or owner checkpoint. If one is unknown, the
implementation-bearing entry remains a proposal or evidence note and cannot create a roadmap
dependency, capability status, or implementation permission. A field in a type, a test that never
reaches a production caller, a reference README, or a screenshot is not a writer/consumer and cannot
promote the decision.

When a later owner decision changes the contract, edit the promoted entry in place, record the
superseded boundary and update the linked spec/capability row in the same change. Do not preserve
two live meanings under different names. The compact implementation record is:

```text
intent → invariant → authority → writer/consumer → persisted scope
       → failure/recovery/removal → acceptance evidence → status
```

This rule keeps the whitepaper as vision, this file as the decision ledger, and active specs as the
only place where a bounded implementation may begin.
>
> **2026-09-10:** [`PRODUCT.md`](PRODUCT.md) outranks this file. Entries that assume (a) Craft's
> `AppShell` is the product window, (b) the canvas is a session-graph projection, (c) general
> external-application control, or (d) 3D scene / panorama / shot-grid authoring, are superseded.
> **2026-09-11 implementation reset:** the Craft v0.13.3 rebase discarded the old
> ExpertKit-as-label, delegation, memory, artifact-history, CLI-adapter and workbench modules. H1–H27
> remain rationale only where they state a durable invariant. Their old `Contract:` paths and
> `landed` wording are historical, not current implementation status. H15 as revised and
> [`PRODUCT.md`](PRODUCT.md) require an independent identity/loadout authority; no later entry may
> recreate `LabelConfig.expertKit`. The later v0.13.4 rebuild also removed the former Assistant
> store, Component helpers, remote grants and layout model; these paths are snapshot evidence only.

## A. Product shape

- **P1 — Fleet is an AI work platform, not a chat tool.** Human owns the top ~10% of judgment and
  the bottom ~10% of common-sense guardrails; agents execute the middle ~80%. (2026-07-08)
- **P2 — One `app/` tree; Craft is the look and runtime base, not the product.** Current
  implementation and rolling reference are **v0.13.4**. The 2026-09-21 rebuild (`5a510cf1d`,
  corrected by `bc7eb0eb7`) supersedes the September 20 uptake plan. The complete earlier Fleet
  tree is preserved at `snapshot/pre-rebuild-2026-09-21`; it is candidate evidence, not an
  implementation to restore wholesale. Steering/mid-stream queueing, context-window usage and
  composer viewport handling now exist in upstream code; inspect those callers before extending
  them. Each difference is declared in `UPSTREAM-DELTA.tsv` as L0 (defect fix), L1 (visual values),
  L2 (product behavior) or LOC (local measurement state). Removed controls need a named replacement
  or explicit retirement decision. R0 remains ACTIVE with fresh verification; no baseline tag is
  a prerequisite imposed by this contract. Preserve Craft's visual language and the existing
  authorities; do not reintroduce a discarded shell or import Qoder/TRAE product concepts.
  (2026-07-08; implementation observation reconciled 2026-09-21.)
- **P3 — Craft look, Cindy *features*.** Spacing, type, colour and motion stay Craft's. Cindy
  decides how a capability is built and how the surface talks to the backend — plugins, skills,
  remote connection, assistants. Rearranging chrome is not Cindy work. (2026-07-09; revised
  2026-09-10, 2026-09-11)
- **P4 — Fleet is open/free local software.** No Fleet account, login, or subscription. (2026-07-08)
  > **Clarified 2026-09-21 — P4 forbids Fleet *issuing* identity, not the user *using* theirs.**
  > The owner asked how to build an account system given OpenChamber appears to need only a GitHub
  > login. The answer is that Fleet does not build one: **borrow identity, never issue it.**
  > P4 bans a Fleet account, a Fleet login and a Fleet subscription — a Fleet-owned user database.
  > It has never banned the user signing in to a third party, and the tree already does this:
  > `packages/shared/src/sources/` carries `SourceMcpAuthType = 'oauth'` and `ApiOAuthProvider`.
  > Reading P4 as "no login of any kind" would forbid capability Fleet already ships.
  >
  > The model, measured from `源码参考/software/openchamber` @ `MIT`
  > (`packages/web/src/api/github.ts`, `packages/ui/src/lib/api/types.ts:1131`):
  > - **GitHub Device Flow.** `authStart()` returns `{deviceCode, userCode, verificationUri,
  >   expiresIn, interval}`; the user types the code at GitHub; `authComplete(deviceCode)` polls.
  >   **No client secret and no callback server**, so no Fleet infrastructure exists to operate,
  >   and P8 is untouched.
  > - **The local `gh` CLI is a first-class credential source**, not a fallback:
  >   `ghCli {available, disabled, active, user}` is detectable, disableable and shows whose
  >   identity it is. A user who already ran `gh auth login` signs in to nothing.
  > - **Multiple accounts, one active.** `accounts[]` entries carry `source: 'oauth' | 'gh-cli'`
  >   and `current`; `authActivate(accountId)` switches. This is the answer to the owner's earlier
  >   question about a second machine having different accounts.
  > - **Identity is per-instance, not global.** OpenChamber scopes it to the connected runtime —
  >   "the login lives on the connected instance". That is the same rule as ZCode's
  >   `buildRemoteEnvironmentKey`: environment-level credential state must not be keyed by
  >   workspace or session. Under P7, a remote Project uses the **remote machine's** identity.
  > - **Revocable from both ends.** `authDisconnect()` deletes locally; the user revokes the grant
  >   at GitHub. Fleet holds nothing that a user cannot destroy without asking us.
  >
  > **Rules this sets.** Sign-in is never required: the local core works signed-out, and a login
  > only unlocks what inherently needs that third party (PRs, private team catalogs). Fleet has no operator-run user identity database; locally stored connection identities and
  > verification of provider responses remain necessary. Fleet never treats a third-party identity as a
  > Fleet entitlement — there is nothing to gate, because there is no paid tier. A team is not a
  > Fleet concept: **a team is a GitHub org or a repository's collaborators**, so team access
  > control is GitHub's and Fleet only reads it.
  >
  > **Honest limitation.** The device flow needs a registered OAuth App `client_id`. It is public
  > and safe to ship, but it is a Fleet-controlled identifier: if it were revoked, that path
  > breaks. This is a dependency on GitHub, not on Fleet-operated infrastructure. The `gh` CLI
  > path and a pasted personal access token both work with no Fleet `client_id` at all and must
  > stay supported for exactly that reason. (owner question 2026-09-21)
- **P5 — Craft look is tokens and interaction style, not “restore the v0.10.5 page host”.** Compare
  pins for the better look. Current base is v0.13.4. Do not restore an older AppShell as the
  product. Board has a separate navigation entry and projects the existing Session/Task
  authorities; it never creates another Project, task or conversation store and does not restore a
  list/Board view toggle. (2026-07-08; revised 2026-07-21, 2026-07-28, 2026-09-10, 2026-09-11)
- **P6 — Workspaces contain Projects and Conversations.** Owner revision, 2026-09-22:
  keep Workspace as a visible, independently configurable environment. Each Workspace owns its
  Conversations, Project memberships, Sources/MCPs, Skills and component/plugin overrides. A Project
  is a Workspace-scoped record referencing a working folder; the same folder may be opened in
  multiple Workspaces. Those memberships share filesystem bytes, not transcripts, credentials,
  permissions or tool activation. Choosing a Project never switches Workspace implicitly. Preserve
  Craft's existing Workspace/Project/Session records; no collapse migration and no parallel global
  Project store. A folderless Conversation stays in the selected Workspace. See
  [`specs/R1-one-boundary-language.md`](specs/R1-one-boundary-language.md).
- **P7 — Remote Projects connect directly to another Fleet instance; no Fleet account or central
  coordinator.** The current connection interaction is P9-rev below: host access link, client name
  + link. The earlier exposed URL/token form is not the target UI. A remote access grant is
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
  connectors; otherwise honestly disabled. The inherited upstream sharing path uploaded sessions to
  Craft's viewer API; the earlier Fleet removal did not survive the rebuild. Never present it as
  Fleet-native. **Upstream intake stays open:** track
  official tags/release notes/source to port fixes selectively; but Fleet's binary updater must use
  a Fleet-controlled/user-configured channel (installing an official Craft binary over Fleet would
  erase the fork) or disable cleanly. Spec: [`specs/R2-independence.md`](specs/R2-independence.md).
  (owner direction, amended 2026-07-12)

### P8-rev (2026-07-26): Online sharing removed

**Decision**: Remove online sharing/viewer functionality entirely (ChatPage share button, session-menu share item, new shareToViewer/updateShare publication, session_shared events, apps/viewer. Retain bounded revoke/unpublish cleanup for existing remote copies until resolved).

**Rationale**: Default-visible controls with no actual behavior violate 03-NON-NEGOTIABLES.md §2. Owner decision 2026-07-26.

**Current implementation**: original hosted publication was restored. Fleet removal is `not implemented`; review the concrete R2 slice before changing UI or backend.

### P8-rev-2 (2026-09-11): Share control becomes local Markdown export

**Decision**: Craft v0.13.3 reintroduced online conversation sharing. Replace that path with a local export of the current chat as Markdown (header Download action, session menu, `exportMarkdown` session command). Do not upload to a viewer.

**Rationale**: Owner request 2026-09-11. Local-first: the conversation leaves the machine only as a file the user chose to save.

**Current implementation**: the Fleet exportMarkdown command/helper and UI path were withdrawn. This replacement is `not implemented`; Session JSONL remains the source to consume in the approved R2 slice.

### P9-rev (2026-09-11): Remote connection is a thin client; code delivery is GitHub

**Decision**: 远程连接 is one product name. The host publishes an access link; the client pastes name + link. Sessions, tools and workspace files execute on the host. The local window is UI + RPC.

The access link is one pasteable blob. The host packs **every usable address on this machine** (public, overlay, LAN) and the client tries them in order. The user does not pick a network mode and does not type a VPN/tunnel hostname. Fleet does not run a relay cloud. SSH host management and Cindy remote-desktop are not this surface.

Durable code handoff is GitHub (OpenChamber's authority, EXEC-13): commit/PR on the host; the controller uses the same repo. Do not invent a second file-sync over the pairing socket.

**Rationale**: Owner 2026-09-11: install, a few clicks, then it should work at home, on a VPS, or across different networks. Do not ship a special “VPN mode”. Screen control and SSH install are different products.

**Target**: Settings owns the remote connection flow; creation reuses it rather than adding a
second setup UI. EXEC-09 extends Craft transport and EXEC-13 owns GitHub delivery. The Fleet link
and grant flow is `not implemented` in the current tree.

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

- **P10 — One left work list; independent Board; contextual right panel.** Owner revision, 2026-09-22:
  remove the separate left navigator column. The single sidebar groups existing Conversations by
  Project and keeps folderless Conversations reachable. Search, archive, status and labels remain
  predicates/actions on the same Session store. Board gets its own navigation entry, never a toggle
  in All Conversations. Resource lists/details live inside their tool surface; existing deep links
  remain valid. Move new-session-panel and browser actions into a contextual right panel. The panel
  follows Cindy's `RightSidebarShell`/`TabBar`/registry shape: Session-scoped tabs, a `+` tab menu,
  close/reorder actions, and tab persistence added to the existing panel/layout owner. Craft does
  not already have that Session tab host; new native docking/window behavior remains under R18.
  It is not a vertical shortcut rail or a second list authority. This does not migrate or redesign
  unrelated resource/settings pages. New Conversation uses one Craft composer, with ZCode's responsive centered empty
  layout and context header pattern; do not import a second editor, runtime, permission system or
  decorative brand artwork.
- **P11 — A Plugin is distribution packaging, not another authority.** A Component is Fleet's
  bounded installable capability; a Plugin bundle packages Components, Skills and Sources. Import
  compatibility must map into their existing or explicitly introduced native owners, not add
  parallel installers, settings, connections, Skills or permission stores. Current Craft Skill and
  Source stores exist; the Fleet Component store, `ComponentManifest` and bundle adapter do not.

  The owner requires freely selected Components, global or Workspace activation, consistent Craft
  interaction, and locally usable capabilities without a required Fleet account. Installed
  capabilities must work when a catalog is unavailable; source failures stay isolated; install
  trust is computed locally; source identity, not a reusable display name, controls update ownership.
  Cross-machine copying is explicit and user-selected, never an automatic merge of host settings.

  Build order after the baseline exit is **Component host → adapter/local install → catalog and
  distribution safety**. An offline seed plus optional remote catalog is a candidate mechanism for
  useful first-run discovery. Claude/Codex/Cursor compatibility and a neutral publishing format are
  technical candidates, not already implemented contracts or owner-selected schema versions.
  Validate exact formats, discovery, provenance and permission behavior against real packages when
  R15 activates; do not freeze a manifest because a reference uses it.

  The source review, candidate mechanisms and detailed package-safety findings belong in
  [`design-library/12-capability---skill---plugin-system.md`](design-library/12-capability---skill---plugin-system.md)
  §16 and [`references/marketplaces/00-MARKPLACE-BENCHMARK.md`](references/marketplaces/00-MARKETPLACE-BENCHMARK.md).
  Those records are evidence, not proof that their suggested adapter exists in the current tree.

## B. The spine (agent-native execution)

- **S1 — Human UI, agent tools, and (later) workflow steps share one canonical invocation model:**
  action definition, caller-aware policy evaluation, executor, state authority, attributed evidence.
  `PreToolUse` remains the Agent adapter; UI callers do not simulate an Agent SDK lifecycle;
  different caller identities may receive different policy decisions. (amended 2026-07-11)
- **S2 — Human and Agent editing are first-class paths to the same artifact.** Both use the
  owning domain's validation, mutation, permission and recovery path (S1). A manual edit must not
  become an untracked side channel, and a preview is not a substitute for an editable surface.
  PRODUCT's native-production rule supersedes the former “escape hatch” wording.
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
  session's effective identity comes from its worn Assistant and its Project/Workspace scope. No
  identity has a backdoor, and no identity bypasses the permission path. **Amended 2026-08-15:**
  the original entry described "a global low-context **Manager Agent** and per-project Agents" as
  two identity layers. That layer is retired — **H28 (2026-07-30) establishes that there is no
  manager agent and no captain role**, so the only surviving content of this decision is the
  no-backdoor / no-permission-bypass invariant, which binds unchanged. Delegation is a
  relationship any session enters by calling `spawn_session`, not a configured identity class.
  (2026-07-08; manager-agent layer superseded by H28, amended in place 2026-08-15)
- **C2 — Fleet coordinates existing Sessions and Tasks; a CLI owns one runtime execution.**
  Runtime adapters report execution facts through the existing Session/Task authority. Parent/child
  relationships, TaskBrief/RunReport and bounded messages carry coordination; no TeamRun store,
  privileged captain identity or independent AgentSeat authority is introduced. A runtime bridge
  exposes only authorized operations and cannot grant permission (H28).
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
- **E5 — The production board hosts editing and projects relationships; native owners keep domain truth.**
  People and Agents generate, edit and arrange on the same board. `spatial`, `reference`, execution
  `input`, immutable `derived-from` provenance, parent/child `delegation`, and
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
  the applied provider-native value; otherwise the control is hidden. Current Craft v0.13.4
  `agent/backend/pi/constants.ts` passes `max` through and delegates per-model clamping to Pi;
  the former `THINKING_TO_PI.max → xhigh` mapping is historical. Neither compatibility behavior
  establishes a supported UI tier: model discovery must prevent a false `max` choice.
  (owner, 2026-07-11; corrected 2026-07-30; adapter observation 2026-09-21)
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
  onboarding experience. The 2026-09-22 owner clarification selects **ZCode for composer placement
  and separate model/reasoning controls, Cindy for the model popup** (search, category rail,
  grouped rows and configure footer). [R1](specs/R1-one-boundary-language.md) owns that contract.
  OpenCode remains comparison evidence for provider configuration, discovery, context usage and
  review; it does not override the two named composer references.
  Existing Fleet composition is not grandfathered; redundant menus, nested pickers, and weak
  information architecture should be removed rather than cosmetically preserved. Admission still
  re-skins the workflow with Fleet/Craft primitives and keeps Fleet's backend stores as the only
  authorities.

  Reference admission never copies another state architecture or visual language.
  Live provider/CLI discovery outranks the OpenCode catalog; the catalog may enrich or
  backfill missing metadata but never override a live denial. Low-risk selection and connection
  editing stay inline or in a menu on the current page. OAuth handoff, the operating-system folder
  picker, destructive confirmation, credential recovery and any flow too large to remain
  understandable may use the existing dialog/drawer/system surface. There is no per-connection
  “default model”; one app/Project new-task default may exist outside the connection editor, and an
  explicit Session choice always wins. A speed mode is never duplicated as another model ID.
  (owner clarification, 2026-07-29; boundary review 2026-07-30)
- **E10 — Labels are work metadata; display language is not identity.** Built-in labels/statuses
  keep stable IDs and localized display text; user-authored names remain unchanged. Labels never
  carry Skills, Sources, permission requests or Assistant identity/loadout. H15/H32/H33 supersede
  the earlier identity-label design; legacy fields are read only as migration input.
- **E11 — A native design surface uses inspectable, transactional design data; it is not the spatial
  canvas model.** When Fleet gains a real design editor: schema-validated objects, one mutation path
  committing ordered change batches (may carry inverse changes, selection metadata, grouping,
  attribution; recovery still follows S5 and the owning Timeline). Tokens are references with stable
  identity; components keep explicit main/instance identity. Agents, human UI, and built-in
  extensions invoke the same governed mutation boundary. Not a Figma/Penpot clone; no second
  authority. (Penpot source intake, 2026-07-15)

- **E12 — Token economy is a first-class capability: intelligence per token, never saving for
  saving's sake.** Owner-set product bet: vendors won't reduce user token spend; Fleet does.
  Design authority: `modules/suites/SYS-03-context-economy.md` — a layered pipeline (structural
  L0 → cache alignment L1 → deterministic input compression L2 → agent-directed compaction L3 →
  gated model-assisted compression L4 → opt-in output economy L5 → reviewed cross-session
  injection L6). Integration is three-tier: core-fused mechanisms at Fleet seams; optional
  connectors (repomix/context7/codegraph-class via Sources/MCP; optional local binaries with
  passthrough, like Craft's optional adapter to a separately installed RTK binary); rejected-as-product (relay proxies, universal semantic
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


- **E14 — Fleet does not become a Cordis kernel or wholesale "everything is a plugin" runtime.**
  **Superseded in the bounded Component-host layer by H41/H43 (2026-09-15):** the rejection below
  still applies to Cordis, the package split and live self-modification, while the scoped
  composition, declaration, health and disposal mechanisms are now explicitly admitted for Fleet's
  Component Host. DeepSeek Harness (`dsh`, MIT, `47f943859bef`) is the strongest
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
     boundary, one evidence timeline, artifact lineage, permissioned recovery (`PRODUCT.md`).
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

  **What is admitted (mechanism reference, no code import):** TypeScript fits the current stack,
  but F3 still requires license, approved-source and product-fit checks before copying code.

  - **The capability-seam role split**, as vocabulary and a boundary rule rather than a framework:
    a swappable capability has a **Service Definition** (the contract and its vocabulary), one or
    more **Service Providers** (implementations), and one or more **Consumers** (what the model and
    other callers program against) — so replacing a local executor with a sandboxed one never
    churns the model-facing schema. The current provider lanes behind EXEC-05 are the starting point; the former
    terminal capability helper, artifact history and workbench examples were discarded. Naming the roles is free; splitting packages
    preemptively is not
    — their own rule is that a capability with one conceivable provider and one Consumer stays one
    package until a second appears. Recorded in `14-MODULE-ARCHITECTURE.md` §2.
  - **Four per-session-composition invariants** that Fleet's Assistant/loadout design does not
    yet state and needs: the composition a session was **created** with is a durable session fact
    and a resume rebuilds *that* composition, never today's default; a running turn cannot change
    composition, while an explicit selection may take effect at the next turn boundary and is
    recorded as a new snapshot event; a per-session composition may not publish a process-global
    service; and **authoring** a composition is a privileged operation while listing and selecting
    are ordinary, because a composition names the capabilities a session runs — reading one is
    reconnaissance and writing one is arbitrary capability.
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
  C7 forbids an executing agent rewriting its own harness, and `PRODUCT.md`'s entire claim is that
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
  approval policy stays outside the adapter.** EXEC-05 has been carrying "one adapter contract:
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
  8. **Adapters transport decisions; they do not grant approval.** AionCore defaults
     `request_external_permission` to `Denied`; omnigent translates every harness's native hook
     payload into one `EvaluationRequest` against a single policy authority and **fails closed** on
     an unreachable or malformed response. Six vendors, one permission path. That is independent
     confirmation of 03 §1 and Decision S1 at a scale Fleet has not reached, and it means EXEC-05's
     verb list must distinguish policy evaluation from delivering a correlated allow/deny response
     to the runtime. The adapter may transport that response; it may never decide or broaden it.

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
  Approval or availability is not proof of superiority: frontend and backend mechanisms must each
  improve the same task over the current path, a small local fix and the owning software's native
  facilities, after integration cost. Keep existing behavior when evidence is insufficient; take only
  the part that wins. See `PRODUCT.md` and the reference registry's promotion record.
  (2026-07-08; owner clarification 2026-09-21)

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
- **G3 — Agents own verification below final look-and-feel acceptance.** Follow `09-QUALITY.md`:
  static checks, relevant tests, real data paths and bounded non-destructive rendered checks when
  needed. Owner acceptance decides the final visual experience. Local verification does not grant
  permission for paid, public, destructive or unrelated interactive operations.
- **G4 — Documentation architecture v2.** The authoritative set is the numbered documents indexed
  by `PRODUCT.md`, OWNER-GUIDE, UI baseline, feature registry, `specs/`, `modules/` and
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
  encouraged ahead of backend work. The current baseline-first order applies to previews too:
  no new page build starts before the R0 baseline exit. After that exit, early page builds are allowed when: the page spec exists
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
  projects is an ordinary Conversations-scoped task whose Assistant requests those sources. UI copy,
  menu labels and the seven locale files converge on this noun; entity/code names (Session)
  stay unchanged — this is product vocabulary, not a data-model rename. (2026-07-26)
- **G9 — Mark All Read returns in the session-list header menu.** The v0.10.5 capability lost its
  UI entry when All Sessions was removed (RPC survived). Owner decision 2026-07-26: its home is
  the Session-list header dropdown, acting on the current filtered view; the dormant SidebarMenu
  branch stays gated. Restores the capability per the 简化不等于删除 rule — simplification never
  deletes capability, it relocates the entry with a named surviving path. (2026-07-26)
- **H1 — Artifact history follows the native kind; Git is one optional backend.** Text changes may
  use Git objects without moving the user's HEAD, index or refs; media versions retain immutable
  bytes; native documents may use validated operations plus recoverable snapshots. These are
  routes over native owners, not three mandatory new stores. Classify from the owning adapter and
  verified media type, with a conservative opaque-file fallback for unknown types; an unfamiliar
  extension is not evidence of text. Git can delta-compress binary data and JSON can have small
  textual diffs, but neither establishes semantic media/document undo. Git LFS is not a mandatory
  dependency; any proposed use needs a concrete storage/transfer comparison. The former
  `artifacts/history-backend.ts` is absent; this router is `not implemented`.
- **H2 — Attribution is explicit and independent of the history backend.** Record caller kind,
  actor/Session identity when applicable, operation correlation and time on each semantic change.
  Missing `agentId` does not prove a human acted: system, workflow, replay and unknown callers
  must remain distinguishable. Review/restore may filter attribution, but permission and expected
  version checks still apply. The shared target is H44, not a separate attribution store.
- **H3 — Concurrent writes require coordination after permission.** A lease never grants access.
  Reuse the mutation owner for finite path leases and expected-version checks; expiration alone
  does not prove a still-running writer has stopped. Native document batches may commute only
  where the domain validator proves that property. Disjoint node IDs alone do not prove it:
  parents, ordering, references and shared constraints can still conflict.
- **H4 — Worktree isolation includes runtime resource ownership.** Worktrees isolate checkout
  files, not ports, databases, caches, scratch space or environment. Declare and scope the required
  resources per run. Reserve ports by actually binding them, handle collisions, and record the
  resolved endpoint with run identity; checking a free port and binding later races. A preferred
  deterministic port is optional and cannot replace reservation or collision recovery.
- **H5 — Session activity is derived; `sessionStatus` stays manual.** Use live processing,
  approval and child-run facts for activity. Pending approval takes precedence over running and
  child blockers roll up without rewriting a manual label. Presentation returns a semantic tone.
  Craft processing state exists; the former Fleet `deriveSessionActivity` helper is absent and
  its complete projection is `not implemented`.
- **H6 — CLI adapters use supported protocols, with ACP where offered.** Retain Craft's native
  Claude/Pi lanes. An external CLI may use ACP or its documented long-lived protocol; do not wrap
  a working native session merely to force ACP. Discovery/configuration/health and turn transport
  are separate responsibilities. Do not parse human help output or private account/model caches
  as an authoritative capability API. Missing discovery yields an explicit unknown/unavailable
  state. The former general CLI connection layer is absent and `not implemented`.
- **H7 — Detection and configuration are separate layers.** Persist what the user selected;
  attach separately observed installation, connection and model facts with provenance and time.
  A failed handshake does not erase configuration or silently select a different runtime.
  Explain `not-detected`, `agent-unavailable` and `model-missing`. AionUi's historical evidence is
  `ManagedAgent`, not the previously misquoted `DetectedAgent`; its optimistic `Observed` value
  is not universally a runtime echo (see the current reference registry).
- **H8 — Record the resolved CLI binary path.** An explicit configured path wins; otherwise
  inspect inherited PATH, a bounded login-shell environment and known installation locations.
  Validate the executable and report how it was resolved. Cache observations with refresh and
  invalidation on configuration/version change; TTLs require runtime evidence. These are target
  adapter requirements, not a claim that the removed Fleet probes still exist.
- **H9 — Execution surfaces state their actual limits.** Current Craft Bash/background execution
  is the baseline. Streaming, cancellation, interactive PTY and persistent shell state must be
  reported per supported path; refuse unsupported operations with a reason. Preserve bounded
  output and a retrievable full result when available. The discarded 30-second/1.5-MB runner is
  historical, not today's terminal contract. R18 adds PTY only for a demonstrated caller gap.
- **H10 — Routing follows requirements and measured accepted outcomes.** User-selected routes,
  permission, capabilities and budgets constrain candidates first. Compare latency, reliability
  and known cost on the same task; do not assume cheapest-first plus retries is cheapest overall.
  A bounded retry/escalation needs a named failure and a demonstrably relevant alternative, not a
  strict increase in price. Quality failures need independent evidence. Automatic routing remains
  `not implemented` and gated by R6/R17 measurements; C5 governs whether delegation is useful.
- **H11 — Delegates are visible inline and remain existing child Sessions.** Show the bounded
  assignment, lifecycle, blocker and result in the parent conversation, with an authorized link to
  the real child transcript. No duplicate transcript or permanent Team page is required. Attempts
  of one delegated task remain associated; unknown/deleted/unauthorized children show honest
  unavailable states. The former DelegationStrip was removed and is `not implemented`.
- **H12 — Pricing is versioned data, not a hand-assigned tier.** Retain separate fresh input,
  cache-read, cache-write, output and any context-tier rates with provider/model, source and
  effective date. Subscription allowance and an API-equivalent estimate are not an actual bill.
  Unknown prices never imply free use or a cheaper route. Craft usage events survive, but the
  former `config/model-pricing.ts` and Fleet ledger are absent; extend UsageTracker when active.
- **H13 — Attention budgets apply to active context, not catalog size.** H19–H21 supersede the
  earlier hard tool-count thresholds and forced role splitting. Measure serialized schema/context
  size and task quality per model; preserve discovery and missing-tool recovery. Do not cap
  installed capability, trim requirements or spawn extra agents simply to meet a numeric budget.
  Runtime enforcement is `not implemented`.
- **H14 — Requested loadout never widens permission.** Resolve an Assistant's requested Skills,
  Sources and Components against installed availability, Workspace policy and live grants through
  one resolver. Missing entries have named reasons; no fallback silently changes identity or scope.
  Labels are not inputs to loadout or permission. H19–H21 govern active context; C5 governs any
  delegation decision, without automatic splitting.
- **H15 — An Assistant is a wearable identity, separate from labels and runtimes.** It declares
  persona, model/prompt and requested loadout/permission, usable by a Session or an authorized
  delegate. Changing specialty does not itself require spawning a delegate. C3/C5/H28 and the
  user's instruction govern delegation; composition changes occur at the next turn boundary.
  The former `packages/shared/src/assistants/` store was removed; this remains `not implemented`.
- **H16 — Delegates return findings; curated memory has one writer.** A delegate returns scoped,
  attributable evidence. The parent may record working notes; the consolidation pass alone
  promotes curated profile, long-term and domain entries. Human curation may pin/correct/delete.
  This is autonomous under D5, not a per-entry approval queue. Refusals explain missing sources,
  sensitivity or scope. The former memory-scope implementation was discarded; the store, index
  and consolidation remain `not implemented`.
- **H17 — A delegate's memory read is scoped by its Assistant, for the same reason its tools are.**
  Handing a specialist the whole memory is the same attention tax as handing it every tool (H13). A
  delegate reads its Assistant's domain files and the `tool` partition and nothing else: it was given one
  bounded job, and the user profile or another domain's long-term memory is context it cannot act on
  but must still pay attention for. `sensitive-quarantine` and `archive` appear in no scope at all —
  quarantine is never injected (D5 floor 1) and an archived entry reaching a prompt would undo the
  consolidation that archived it. (2026-07-30)
- **H18 — Tool memory records supported facts, not raw calls.** Keep tool output in Session
  evidence and promote a scoped fact only with sufficient source evidence and uncertainty.
  Repetition is evidence, not an automatic truth threshold. Invalidate or revalidate against
  changed tool/version/convention facts; age may trigger review but cannot by itself prove a
  stable fact false. H26 must not silently delete or override pinned facts by age.
- **H19 — An Assistant's catalog is not its active loadout; attention governs the active set.** H13
  originally fixed the tool budget to the whole declared catalog, which calls every substantial
  Assistant over-budget and tells
  the author to split. Real workflows are long — a design kit spanning problem framing, research, IA,
  flows, visual direction, motion, accessibility and engineering handoff is twenty-plus steps — and
  splitting one into three identities makes the user choose *before* they know which step they are
  on. Reference kits in the wild ship well past the threshold and are right to. The mistake was
  conflating two counts: **catalog** (everything a kit can do; large is fine) and **active** (what is
  in the window this turn; this is what costs attention). A kit is a catalog you route within, not a
  bundle you carry, so twenty-eight skills can cost less attention than a loadout of twelve. This is
  the retrieval-based selection the measurements favour — choosing a subset before the model reads
  anything roughly tripled tool-selection accuracy while halving prompt tokens. The earlier
  `assessExpertKit` and `labels/skill-routing.ts` implementation was discarded; Assistant routing is
  `not implemented`. (2026-07-30; implementation status corrected 2026-09-11)
- **H20 — Routing happens before the model reads, and exclusions are first-class.** Two refinements
  over the catalog designs this borrows from. **Route mechanically, not by asking the model to choose.**
  An Assistant that relies on the model picking from twenty-eight skill descriptions reintroduces the
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
  A future catalog audit must report ambiguous triggers, dangling successors and unreachable skills,
  since the symptom is otherwise indistinguishable from the model choosing badly. The earlier
  example-kit and routing files were discarded. (2026-07-30; status corrected 2026-09-11)
- **H21 — An Assistant's catalog is unbounded; the budget never caps capability.** H19 measures the
  active set instead of the catalog. Capability is the product; token cost is an implementation
  detail, and a catalog trimmed to satisfy a threshold is simply worse — the user
  came for the twenty-eight-step workflow, not for twelve of its steps. So the catalog has no limit
  and never earns a warning. The only finding that matters is **architectural**: a kit with no
  routing loads all of itself, which `add-skill-routing` fixes at zero cost to the kit. A routed kit
  whose active set is still large reports `consider-splitting` as *information* — splitting
  distributes the same capability across agents that can each hold their share, and trimming, the one
  option that actually loses something, is never suggested. (2026-07-30)
- **H22 — A future Assistant/catalog browser must say what activation costs.** An installable
  package is only useful if it can be found, so the catalog needs browsing: role- and
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
  is the user's call. Unknown adoption sorts last rather than as zero, so a local package does not
  silently outrank a marketplace one that has no count yet. The old `labels/kit-gallery.ts`
  implementation was discarded; this surface is `not implemented`.
  (2026-07-30; status corrected 2026-09-11)
- **H23 — Legacy `kind: 'identity'` labels remain readable but are not Assistants.** Stored label
  catalogs may contain the old value. Do not rewrite them merely by reading; a future migration must
  use one explicit path rather than scattered direct comparisons. **They must not be upgraded into
  Assistants or used as an identity store.** The old normalizer was discarded. (2026-07-30; revised
  2026-09-11)
- **H24 — Data sources are requested by an Assistant, not injected globally.** A globally-connected source
  is either always in scope — attention spent on data the current role cannot use — or toggled per
  session, which is a step nobody performs reliably. Once Assistants define roles the binding belongs to
  the Assistant, alongside its skills and tools, and it carries the two things a global connection cannot
  express: whether the Assistant *needs* it, and how sensitive the contents are. Missing **required**
  sources refuse activation; missing optional ones degrade and say so, because a curator that quietly
  ran over two of its five archives produces a plausible result, and nobody re-runs a result that
  looks fine. A binding declared read-write but not granted write is refused rather than downgraded
  to read: silently downgrading leaves the Assistant failing later at a write it was told it could perform,
  which reads as the Assistant being broken. The old `labels/kit-sources.ts` implementation was
  discarded; binding enforcement is `not implemented`. (2026-07-30; status corrected 2026-09-11)
- **H25 — Foreign archives remain searchable evidence.** Explicitly imported chat history keeps
  origin and scope; it does not become a prompt instruction, permission grant, user preference or
  curated memory. Paraphrasing or repeated occurrences do not remove this boundary. A separately
  authorized retention/consolidation flow must validate sources, sensitivity and applicability;
  search permission alone is not permission to promote foreign claims.
- **H26 — Consolidation has one writer and measured defaults.** The future curator consumes
  evidence under D5/H16–H18, logs promotions/conflicts/archives, preserves pins and supports user
  deletion. Hermes/OpenClaw are mechanism candidates, not authority for universal age, trigger or
  confidence constants. Model-backed background work respects configured consent and budget;
  once enabled, ordinary eligible consolidation is autonomous rather than a per-entry approval
  queue. The previous memory-curator kit/store is absent and `not implemented`.
- **H27 — Foreign history and native curated memory remain distinct.** H25 governs imports.
  Preserve source-product identity and an explicitly authorized read scope; no imported record can
  write native memory or policy. Any later derived claim needs its own validated evidence and
  authorized retention scope. Neither three occurrences nor rewritten wording establishes truth
  or permission. Sensitive foreign material is excluded from automatic injection. The former
  `memory/foreign-memory.ts` is absent and `not implemented`.
- **H28 — There is no manager agent and no captain role. Delegation is a relationship, not a class.**
  Earlier planning assumed a "管理 Agent" — a Conversations-scoped session configured to coordinate
  others — and a captain/delegate distinction the user would choose between. Assistants, requested
  sources, capability-and-cost routing and scoped memory remove the need for both. **Any session
  may delegate through the existing Session/Task path**, and the same session may be a delegate to whatever spawned
  it; the relationship lasts exactly as long as one delegation. There is no mode to enter, nothing to
  configure, and the UI must not offer either — a session that delegates is an ordinary conversation
  whose turn happened to request child work. Naming these as user-facing roles would recreate
  precisely what Assistants avoid: a role decision the user should not have to make up front.
  “Parent” and “delegate” are positions in one run relationship, not identity classes. Supersedes the
  management-agent direction recorded under
  G8. (2026-07-30)
- **H29 — Unknown cost is not zero; explicit zero is still a valid reported value.** A provider
  receipt may report zero (for example a free operation); retain its provenance instead of rejecting
  it merely because tokens are nonzero. SDK defaults with no billing/rate evidence remain unknown.
  Token×rate calculations are estimates with a dated rate source, never invented invoice amounts.
  The complete Fleet cost projection is `not implemented`.
- **H30 — Cost totals expose coverage.** Distinguish known reported charges, priced estimates and
  unpriced usage. Measure token-rate coverage over applicable billable token categories; also list
  unpriced media/other units separately. A mixed subtotal is not an exact total or a guaranteed
  lower bound on the eventual bill. Do not infer coverage from Session counts.
- **H31 — Endpoint pricing has one settings owner and visible provenance.** Prefer verified
  provider/model rates where applicable; custom endpoints can supply explicit user overrides with
  units and effective date. An unknown-price notice links to that same setting. User entries do
  not retroactively become provider receipts; cache/context-tier rates remain separate (H12).
- **H32 — Labels and Assistants are separate authorities with separate meanings.** Labels remain
  metadata over work. Assistants own identity and requested loadout as the target. The earlier
  `packages/shared/src/assistants/` implementation was removed; status is `not implemented`. A settings surface may navigate to both, but it must never expose
  two editors over one store or place Assistant payloads in `labels/config.json`. Supersedes the
  ExpertKit-as-label ruling. (2026-07-31; revised 2026-09-11)
- **H33 — Legacy identity-label values are migration input only.** Existing label files may still be
  read without mutation, but new Assistant writes use only the Assistant authority. Compatibility
  must not turn an old label into a second spelling of Assistant. The old ExpertKit normalizer and
  write path were discarded. (2026-07-31; revised 2026-09-11)
- **H34 — Verify UI values against actual Craft before rendered changes.** The Fleet
  `lint:ui-contract` script and its fixture were removed by the owner-requested original-source
  restoration. Report that missing check honestly. Any restoration belongs to an approved
  correction slice; the comparison of shared primitives, motion and required states remains
  necessary and cannot be certified by a token guard alone.
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

- **H36 — A declared capability without a live writer, resolver and runtime consumer is `not
  implemented`.** This finding exposed the old ExpertKit-as-label design: its fields described skills,
  sources, tools and permission, but no complete production path enforced them. That implementation
  was discarded. The same honesty rule now applies to Assistant loadouts and marketplace metadata:
  never render a measured or active state that the runtime cannot obtain. (2026-09-10; revised
  2026-09-11)
- **H37 — Capability comes from a live binding.** A field or manifest alone is not runtime
  support. Component contributes native UI/domain behavior; Plugin packages Skill/Source/Component
  contents without a fourth authority (P11). A live writer, resolver and production consumer are
  required before claiming the corresponding capability is wired.
- **H38 — An Assistant selects over installed Skills; it never declares a parallel Skill store.**
  Fleet already loads Skills from disk across its supported scopes. Assistant loadout resolution is
  therefore `REUSE/EXTEND`: declared IDs resolve against that installed set, unresolved IDs are named
  rather than dropped, and routing uses explicit triggers/exclusions rather than descriptions. The
  old `labels/kit-resolve.ts` implementation was discarded; current Assistant-to-runtime resolution
  remains `not implemented`. (2026-09-10; revised 2026-09-11)
- **H39 — Skill scope is an explicit user choice over one Skill authority.** Global installation
  and Workspace activation/overrides remain distinct; moving or generating a Skill cannot grant
  permission or affect other Workspaces implicitly. Preserve vendor metadata and unknown fields
  on import, while stating which activation semantics Fleet actually supports. The former Fleet
  `skills/scope.ts` and `manage_skill` extensions are absent; their prior tests are not current
  acceptance. R15 derives the schema and migration from real callers.
- **H40 — Components are additive workspace capability bundles, not identities or alternate shells.**
  The owner chose a component model on 2026-09-14: an installable Component may bundle a left-tool-rail
  entry, right-workbench panels, native domain commands/data, Skills, MCP declarations, knowledge
  defaults and recommended Assistant settings. Components must use Fleet's Craft-derived design
  tokens and shared primitives, and may not take over the conversation implementation, patch
  `AppShell`, or create a second navigator/settings/permission authority. Left/right are default
  contribution placements: the owner subsequently requested resizing, movement, reordering and
  floating of conversation/tool views through the one host. A Workspace may enable any
  number of Components; the product imposes no artificial count limit. Enablement is either global
  (default for all Workspaces) or explicitly overridden per Workspace. Vendor manifests remain
  immutable; user/workspace preferences, extra MCPs, knowledge sources and habits are stored as
  overrides in existing user/Workspace settings; effective Composition is derived, not a duplicate
  settings store. Resolver order is official default → user
  default → workspace override → session one-off. Workspace overrides remain in existing Workspace
  settings; the resolved per-turn snapshot is owned by the existing Session/SessionEvent authority
  (one immutable snapshot per turn, with an explicit boundary event for a later change), not by a
  second composition store. DeepSeek Harness supplies slot/lifecycle vocabulary; Cindy supplies
  capability ownership/install-target and permission-request rules;
  OpenChatCut supplies the official video bundle reference. OpenChatCut is AGPL-3.0 and is therefore
  source/product evidence unless an explicit license checkpoint approves direct reuse. The early
  host starts after the R0 baseline exit, using mounted Files and a real consumer of the surviving
  Notes RPC. It does not wait for that video choice, R6 delegation, R9 memory or a marketplace; `specs/R18-right-workbench.md` owns its foundation-first acceptance. (owner,
  binding, 2026-09-14; placement and execution-order clarification 2026-09-15)
- **H41 — Fleet adopts DeepSeek Harness composition principles without adopting its kernel.**
  Owner direction 2026-09-14 confirms that the Fleet Component system should follow the reference's
  "everything is a plugin" model at the capability/slot layer: components declare contributions,
  dependencies and scope; the host composes them, loads heavy dependencies on demand, and disposes
  them with their owning scope. Fleet keeps Craft's shell and existing Workspace/Session/Task/
  Permission/Settings authorities as the host. Cordis, a wholesale micro-package split, or live
  self-modifying runtime are not imported. This supersedes the narrower E14 wording that treated
  plugin-first composition only as evidence; the new boundary is Component composition, not a
  second runtime kernel. (owner, binding, 2026-09-14)
- **H42 — Craft supplies visual language; Cindy supplies information architecture; OpenChamber
  supplies selective context-panel mechanics.** The owner wants Craft Agents' typography, colour,
  spacing, motion and shared primitives, but not Craft's unexamined page hierarchy or repeated
  conversation entries. Fleet's target is one Conversation surface/list: Project, label, status,
  pinned and archive are predicates or chips, while Project resources and component tools open in
  the existing workbench. Cindy's single-surface settings/market panels and right-sidebar registry
  are the primary structural references; OpenChamber's chat-first `MainLayout` + `ContextPanelRail`
  is evidence for keeping detail tools beside the conversation. Neither reference may introduce a
  second Session/Task/Permission authority. (owner, binding, 2026-09-14)
- **H43 — DeepSeek's implementation contract is Fiber + declaration + proof, not package count.**
  Source review on 2026-09-15 found four load-bearing mechanisms: (1) a scoped owner Fiber for
  services, events, stores and disposal; (2) a declaration table that is the render/load
  authorization and validates duplicate cells/child ownership; (3) a loader that waits for nested
  rows, reports aggregate failures, preserves disabled entries and rolls back failed subtrees; and
  (4) a mount audit that rejects inactive rows and process-global service leaks before publication.
  Presets are immutable inputs; user copies are authored only under a user root with overwrite/path
  guards, while session composition changes are logged so resume rebuilds the actual later-turn
  composition. Fleet adopts these as a smaller **Manifest → Plan → Activate → Health → Publish →
  Dispose** contract over Craft/Fleet Workspace, Session, Permission and Settings. It does not adopt
  Cordis as a second kernel, property injection, a 167-package split, or live self-modification.
  (source review, binding implementation direction, 2026-09-15)
- **H44 — Work trajectory is one event-sourced projection, not a log per Component.** The owner
  wants every Agent turn, human panel action, Component/MCP call, Job and produced artifact to be
  traceable so a later instruction can target an exact prior step. DeepSeek Harness source review
  supplies the mechanism: its append-only `SessionEvent` log is the source of truth; `turn/start`,
  `step/start`, `tool/call`, `tool/result`, `tool/code-dispatch` parent/child edges, durable source
  references, and `traceEvent`/`traceSession` queries derive the visible history and lineage. Its
  surface fold explicitly distinguishes `current`, `shadowed` and `log-only` events, so replacing a
  displayed message never erases the original evidence. Workflow runs add paired `run-start` /
  `agent-start` / `agent-end` / `run-end` events in the parent Session, while human commands pair
  `command/run` / `command/done`; these are recoverable facts, not renderer state. Fleet adopts that shape over its
  existing Session/SessionEvent, governed Action, Job and ArtifactRef authorities. A Component may
  emit declared semantic action events, but may not create a private trajectory store or hide outputs
  outside its native owner.

  Every consequential operation carries a stable `operationId`, `attemptId`, caller kind, Session /
  Workspace / Component identity, optional turn/step and parent operation, exact input ArtifactRef
  versions, output ArtifactRef versions, Job id, status, evidence/recovery and source/derived event
  sequence references. Canvas nodes and edges project these facts; position or a visual connector
  never becomes provenance. “Modify step”
  resolves an explicit operation, artifact version or canvas-node target. It creates a new branch or
  version from that base, leaves the old outputs intact, marks dependent descendants stale or
  awaiting recompute, and never silently rewrites later history. (owner direction and source review,
  2026-09-15)
