# Decisions, constraints and the owner's words

Durable product and engineering choices (sections A–F), hard constraints, and the owner's exact
words with the decision that now carries each. Edit a decision in place when it changes and date the
change; the narrative of how it changed belongs in [`CHANGELOG.md`](../CHANGELOG.md).

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
> **2026-09-10:** [`product.md`](product.md) outranks this file. Entries that assume (a) Craft's
> `AppShell` is the product window, (b) the canvas is a session-graph projection, (c) general
> external-application control, or (d) 3D scene / panorama / shot-grid authoring, are superseded.
> **2026-09-11 implementation reset:** the Craft v0.13.3 rebase discarded the old
> ExpertKit-as-label, delegation, memory, artifact-history, CLI-adapter and workbench modules. H1–H27
> remain rationale only where they state a durable invariant. Their old `Contract:` paths and
> `landed` wording are historical, not current implementation status. H15 as revised and
> [`product.md`](product.md) require an independent identity/loadout authority; no later entry may
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
- **P6 — Workspace/Project target is reopened; preserve the current records.** Craft v0.13.4 still
  scopes Projects, Conversations, Sources and Skills under visible Workspaces. The owner first asked
  to retain that layer, then proposed removing its visible UI and selecting capability suites per
  Conversation. The second request supersedes the visible-Workspace target, but does not authorize
  a data migration or replacement store. The candidate Host → optional Project/folder → Conversation
  mapping and its unresolved migration proof are in [`modules/shell.md`](modules/shell.md). Until a
  reviewed slice replaces it, the current Workspace/Project/Session authority and remote routes
  remain intact. Same-folder access never implies shared transcripts or grants.
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
  erase the fork) or disable cleanly. Spec: [`modules/services.md`](modules/services.md).
  (owner direction, amended 2026-07-12)

### P8-rev (2026-07-26): Online sharing removed

**Decision**: Remove online sharing/viewer functionality entirely (ChatPage share button, session-menu share item, new shareToViewer/updateShare publication, session_shared events, apps/viewer. Retain bounded revoke/unpublish cleanup for existing remote copies until resolved).

**Rationale**: Default-visible controls with no actual behavior violate decisions.md §2. Owner decision 2026-07-26.

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

- **P10 — One left work list; independent Board; contextual right panel (paused target).** Owner revision, 2026-09-22:
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
  decorative brand artwork. The owner subsequently paused Conversation/Project changes and asked
  for small, reviewed corrections after the original-app walkthrough. None of this UI is currently
  Fleet implementation; the old R1 delivery order is withdrawn.
- **P11 — A Plugin is distribution packaging, not another authority.** A Component is Fleet's
  bounded installable capability; a Plugin bundle packages Components, Skills and Sources. Import
  compatibility must map into their existing or explicitly introduced native owners, not add
  parallel installers, settings, connections, Skills or permission stores. Current Craft Skill and
  Source stores exist; the Fleet Component store, `ComponentManifest` and bundle adapter do not.

  The owner requires freely selected Components, consistent Craft
  interaction, and locally usable capabilities without a required Fleet account. Installed
  capabilities must work when a catalog is unavailable; source failures stay isolated; install
  trust is computed locally; source identity, not a reusable display name, controls update ownership.
  Cross-machine copying is explicit and user-selected, never an automatic merge of host settings.
  The former Workspace-activation default is reopened under P6; per-Conversation suite selection is
  the current design candidate, not an implemented resolver.

  Build order after the baseline exit is **Component host → adapter/local install → catalog and
  distribution safety**. An offline seed plus optional remote catalog is a candidate mechanism for
  useful first-run discovery. Claude/Codex/Cursor compatibility and a neutral publishing format are
  technical candidates, not already implemented contracts or owner-selected schema versions.
  Validate exact formats, discovery, provenance and permission behavior against real packages when
  R15 activates; do not freeze a manifest because a reference uses it.

  The source review, candidate mechanisms and detailed package-safety findings belong in
  [`marketplace.md`](modules/marketplace.md#plugin-skill-and-marketplace-design)
  §16 and [`marketplace.md`](modules/marketplace.md#marketplace-benchmark).
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
  [`decisions.md`](#hard-constraints) §4. (2026-07-09)
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
  [`canvas.md`](modules/canvas.md#canvas-vision).
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
  defined 2026-07-17 — see `architecture.md` §4.5)
- **E6 — The BrowserPane is a governed evidence input, not a stealth browser or editable-doc
  surface.** Explicit control model (enablement, open-target, data clearing, screenshot policy,
  approval policy, site overrides, separate high-risk full-CDP developer toggle). Remote pages are
  evidence-only. (2026-07-08)
- **E7 — Exports are honest.** Motion/deck surfaces use native documents; PPTX/HTML/video are
  explicit exports with visible fidelity limits. (2026-07-09)
- **E8 — Local resource limits are product behavior, not exceptional failure.** Under saturation the
  product visibly queues, suspends, degrades, or hands off — it does not freeze or silently drop
  work. Exact thresholds are benchmark outputs. (owner concern; see
  [`decisions.md`](#the-owners-words) OV-002; 2026-07-11)
- **E9 — Reasoning and runtime modes adapt per model; unsupported distinctions stay hidden.** The
  owner requires automatic per-model adaptation and honest handling of models that expose no
  gradable reasoning control (exact quote: `decisions.md` OV-006). Discovery records the exact
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
  grouped rows and configure footer). [R1](modules/shell.md) retains the comparison; implementation
  is paused pending the original-app walkthrough.
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
  understandable may use the existing dialog/drawer/system surface. A connection retains its
  inherited backend model fallback, without a repeated Settings picker; an explicit Session choice
  always wins. The later owner correction (2026-09-24)
  also rejects Workspace-level model routing and repeated task-model entrances: new Conversations
  start from the selected connection fallback and save their effective Session model/connection;
  the existing composer owns subsequent selection and effort. A speed mode is never duplicated as
  another model ID. (owner clarification, 2026-07-29; boundary review 2026-07-30)
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
  Design authority: `modules/context.md` — a layered pipeline (structural
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
     boundary, one evidence timeline, artifact lineage, permissioned recovery (`product.md`).
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
    package until a second appears. Recorded in `engineering.md` §2.
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
  C7 forbids an executing agent rewriting its own harness, and `product.md`'s entire claim is that
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
  (`AGENTS.md`); this entry is the agent's technical recommendation against it, recorded so
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
  the other. Evidence and exact symbols: `references/references.md`. (2026-08-15)

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
  the part that wins. See `product.md` and the reference registry's promotion record.
  (2026-07-08; owner clarification 2026-09-21)

## G. Process

- **G1 — Owner gives concept and intent; the agent chooses the technical route — and owes honest
  dissent.** Do not ask the owner for engineering opinions. Extract design intent, pick the
  implementation, document assumptions, escalate only genuine conflicts. **Duty to dissent:** when
  an owner suggestion is technically suboptimal, the agent must say so before executing — one plain
  paragraph: the better route, why, and the cost of each. Product intent always remains the owner's
  call; silent compliance with a bad technical idea is a failure, not obedience. (2026-07-08;
  dissent duty added at owner request 2026-07-17)
- **G2 — Value-first integration order.** Integration follows [`TODO.md`](../TODO.md#release-ladder):
  exactly one release is ACTIVE (a WIP limit, never a time phase — no NOW/NEXT/LATER,
  near/far, or calendar language); user-visible value ships before shared infrastructure; shared
  contracts (action seam, ArtifactRef, TaskBrief/RunReport) are **extracted from at least two real
  implemented callers**, never built speculatively first. Dependency edges describe required
  integration, not a permission system — the owner may request any capability early, and its status
  then reports the unresolved edges honestly. (2026-07-16; time-flavored labels removed 2026-07-17)
- **G3 — Agents own verification below final look-and-feel acceptance.** Follow `engineering.md`:
  static checks, relevant tests, real data paths and bounded non-destructive rendered checks when
  needed. Owner acceptance decides the final visual experience. Local verification does not grant
  permission for paid, public, destructive or unrelated interactive operations.
- **G4 — Documentation architecture v2.** The authoritative set is the numbered documents indexed
  by `product.md`, OWNER-GUIDE, UI baseline, feature registry, `modules/`, `modules/` and
  `references/`. Each rule lives in exactly one canonical document. Superseded planning corpora are
  deleted after unique active facts migrate; they are not archived in-tree. Durable design assets
  remain in `design-library/` or module packets because they guide their ordered product rows,
  not because they commemorate prior process. (2026-07-16; clarified 2026-07-17)
- **G5 — Coverage and sequencing are separate.** Every product domain (canvas, video, browser,
  memory, tokens, sandbox, messaging, workflows, design, deck, jobs, remote…) stays registered and
  described at breadth level in [`capabilities.md`](capabilities.md#product-matrix) and
  [`capabilities.md`](capabilities.md#page-structure) at all times, with its reference projects
  and gates named. Integration order never deletes a domain from design; matrix/page rows update in
  the same slice that changes their facts; depth (full specs) is written when a domain activates or
  the owner requests it. (2026-07-17)
- **G6 — Frontend track: pages may run ahead of behavior, honestly.** Complete page specs are
  encouraged ahead of backend work. The current baseline-first order applies to previews too:
  no new page build starts before the R0 baseline exit. After that exit, early page builds are allowed when: the page spec exists
  ([`capabilities.md`](capabilities.md#page-structure) §5); data flows through a typed adapter
  with mocks behind the adapter (never in components); unwired pages are reachable only behind the
  developer/preview toggle; status is reported `display-only` until actual behavior is connected.
  The default user surface
  never ships a control without real behavior. (2026-07-17)
- **G7 — Sidebar trailing-meta at-rest visibility: hover-reveal, owner-confirmed.** History of
  record: an always-visible decision was claimed in a commit message on 2026-07-26 (d25b763f6,
  "second walkthrough round"); the same day, fa5ee7460 reverted it with no recorded rationale.
  Resolution: the owner confirmed **hover-reveal** on 2026-07-26 (owner reply: "维持 hover 显现" —
  keep hover-reveal). One at-rest visibility language per sidebar level
  ([`DESIGN.md`](../DESIGN.md) §8); switching any element to always-visible reopens this decision
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
  [`DESIGN.md`](../DESIGN.md#motion) adds the frequency test that decides
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
  Notes RPC. It does not wait for that video choice, R6 delegation, R9 memory or a marketplace; `modules/components.md` owns its foundation-first acceptance. (owner,
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

## Hard constraints

> Durable architectural and safety boundaries. Each one is a specific way this product can be
> ruined, learned the hard way. Before any architectural or safety-relevant change, confirm you are
> not crossing one. If an existing authority is genuinely insufficient, say so explicitly and get
> owner sign-off *before* building a parallel one.

### 1. Never create a second authority

Do not create a second:

- session/chat store beside Craft sessions;
- permission or approval path for UI, agents, or workflows;
- memory database or silent shadow memory;
- job, cost, or usage ledger for the same work;
- artifact/file byte store duplicating native owners;
- project/task/workspace authority;
- audit timeline for the same events;
- application shell, workbench, browser stack, or settings home.
- agent harness, prompt/loadout authority, or provider-specific capability policy beside the
  existing Craft/Fleet provider and permission paths.

**Extend the existing authority, or demonstrate why it is insufficient, before replacing it.**
Violating this is how the product fragments into disconnected utilities.

### 2. UI and product

- **Do not change a surface Craft already has without first diffing the upstream component** at the
  same path under `源码参考/software/craft-agents-oss/`, and justifying each delta. An unjustified
  difference is an invention, and it reads as a second UI language beside the first. Step 0 in root
  [`AGENTS.md`](../AGENTS.md).
- **Do not produce a concept mockup, redesign image or "structure draft" as input to an
  implementation.** The reference is the upstream component and the cloned products read as source.
  The owner has rejected drawn proposals explicitly: 「你生成的这张图就非常大的问题，你就不应该有这种操作」.
- **Do not dispatch a subagent to decide design, layout or architecture.** It arrives without the
  routing table, the design library and the owner's history, and it invents. 「不要乱派子智能体他很多
  想法都跑偏了」. Read the sources yourself; delegate only bounded, already-specified work.
- **Do not read "keep Craft's style" as "keep every old function."** The visual system and proven
  interactions carry over; which functions live, merge, move or die is the owner's call per surface.
  Relocating every old button is not preservation, it is refusing to make the decision.
- Do not build a greenfield shell or restore rejected skins when Craft can be simplified/extended.
- Do not add empty docks, panels, settings, routes, dashboards, or placeholder modules to the
  **default surface**. Ahead-of-behavior pages exist only inside the preview-gated frontend track
  (Decision G6): spec'd, mock-behind-adapter, reported `display-only`. Nothing unwired ships
  default-visible.
- Do not make a canvas/panel the authoritative job or native-document store.
- Keep one Markdown editor authority; compare Craft's TipTap implementation before extending or
  selecting the editor path.
  `TiptapMarkdownEditor` currently has a playground caller only; it is a reuse candidate, not a
  mounted production editor or proof of direct document editing.
- Do not flatten browser, design, video, deck, and code into one universal editable document model.
- Do not treat external web pages as editable native documents via silent DOM mutation.
- Do not present display-only, mocked, or stub behavior as `usable`.
- Do not ship a UI-only and an agent-only implementation of the same action — converge per
  Decision S1.
- Do not expose backend plumbing as a setting just because a flag exists.
- Do not require, silently call, or visually imply a required Craft-operated account, server, relay,
  viewer, updater, docs site, or MCP endpoint (Decision P8).
- Do not model "cloud" as a Fleet-owned control plane (Decision P9).
- **Remote admission must be default-deny.** A channel may be reachable from another machine only
  through explicit remote eligibility, never merely `!isLocalOnly(...)`. A negative local-only
  check can expose an unclassified new channel. Admission must be checked twice — caller before
  sending, host before dispatch — with the host authoritative. **Current gap:** v0.13.4 exposes
  `isLocalOnly` and `isRemoteEligible`, but the required double-ended admission boundary is
  `not implemented`; the former `isRemoteAllowed` / `remoteRefusalFor` helpers are absent. A
  classification table alone does not prove enforcement. Never admitted: window/UI control, native
  dialogs, shell side effects, credential reads or writes, the updater, writes to the host's own global
  settings, and raw store writes that bypass a business handler.
- **A remote credential is per device, hashed, scoped and revocable (Decision P7).** Never
  hand a remote client this machine's own server token, and never put a standing credential
  in an access link — the link carries a single-use, expiring invite, and redeeming it mints
  that device its own grant. One device revoked must not affect any other.
- Do not treat a component library or another product's screenshot as license to replace Craft's
  navigation, settings architecture, or product identity wholesale.

### 3. Architecture

- No workflow runner with its own permission/runtime/job systems beside the existing ones.
- No Pi-light, OpenHands, Hermes, OpenClaw or other profile/reference promoted into a second kernel;
  extend one model-facing effective projection and keep every real call on the canonical
  permission/evidence path (E13).
- No Tool Search before static scoped profiles and catalog/recovery measurements prove it necessary;
  discovery never grants or executes.
- No long-lived daemon as an early prerequisite when the Electron main process can own the behavior.
- No independent `jobs.json` / `memory.json` / `clips.json` authority without a demonstrated gap and
  a deliberate migration.
- No silent last-write-wins for concurrent document mutation.
- No format claim based only on a preview. Every import/export path declares a tested fidelity class,
  preserves the original source ArtifactRef, records an adapter revision and reports unsupported
  features. “Opens” is not the same as “editable” or “round-trips”.
- No destructive in-place migration. Import, conversion, restore and export create a recoverable
  version/lineage and leave the previous artifact head intact until validation and evidence commit.
- No external plugin distribution path before built-in capability loading and permissions are real.
- Components are additive only: a manifest contributes tool entries and workbench panels. Left/right
  are default placements; user-owned resize, movement, reordering and floating preserve panel identity
  through the one host. Components may not take over the conversation implementation, patch
  `AppShell`, or create a second navigator, settings home, Session/Task store or permission path.
- Component dependencies are explicit, versioned and inspectable. Heavy dependencies are lazy and
  scope-owned; installing or enabling a component does not load unused renderers, workers, MCP
  processes or external runtimes at startup. Missing optional dependencies degrade visibly; missing
  required dependencies refuse only the affected feature with a named reason.
- No wholesale copy from the preserved upstream checkout over the working app.
- No visual canvas connector treated as an executable workflow edge, and no connector/card
  position/renderer edge overwriting recorded provenance (Decision E5).
- No Agent, plugin, or workflow mutating renderer state directly — everything goes through the
  shared caller-aware action path; the canvas receives projection updates.
- Every consequential mutation records its caller provenance: `human`, `agent`, `automation`,
  `replay`, or `system`, plus Session/Component/Action correlation and before/after version evidence. A replay
  or learned Skill may use a human demonstration only after the user explicitly selects the range
  and approves the generated reusable procedure.
- No Component, MCP server or renderer may create a private trajectory/history authority. Current
  evidence uses Craft Sessions and SessionEvents. Governed Action, Job and ArtifactRef integration
  are targets at their owning release rows, not an existing unified path. Those additions must
  extend the current evidence authority; the visible trace remains a projection.
  Actor identity is recorded separately from operation form (`human`/`agent`/`replay` is not inferred
  from which UI route happened to emit the event).
- Never resolve a revision target from a name, path, thumbnail or adjacency alone. A prior operation,
  exact ArtifactRef version or selected canvas node must resolve to one target; otherwise ask or show
  candidates. Revising creates a new lineage branch and preserves the old output.
- Human demonstrations are not raw authority. Do not turn screenshots, coordinates, passwords,
  selected text, cookies, tokens or arbitrary window events into a Skill. Prefer the semantic Action
  and Component command that the human operation invoked; coordinate/computer fallback stays an
  explicit last resort with environment identity and fresh observation checks.
- No spatial renderer promoted from screenshots, marketing claims, or a synthetic empty-node demo
  (Decision E5a).
- No timeline ordering used as a document conflict-resolution algorithm.
- No universal patch format pretending to natively edit DOM, code, design, video, and deck.
- No arbitrary cyclic/general-programming workflow model in the first finite workflow version.
- No promise of full-fidelity animated PowerPoint export the export path cannot prove.
- No executing agent silently rewriting its task, acceptance criteria, evaluator, tests, or harness
  (Decision C7); no verifier editing the implementation it judges (C9); no optional-evidence failure
  promoted into product/infrastructure work (C8); no incidental finding replacing the active
  objective (C10).

### 4. Persistence discipline (the SQLite trigger)

Near-term persistence retains the current Craft-derived filesystem stores under one logical authority (Decision
D2). Introduce SQLite or a control-plane database only when a **concrete, observable engineering
signal** appears — e.g. the first real bug where file-based lease-restart reconciliation or job
idempotency cannot be made atomic on the filesystem. Record the trigger, migration path, and owning
authority in `decisions.md`, then migrate. "It would be cleaner" is not a trigger.

#### Artifact history (Decisions H1–H4)

- **A snapshot writes git objects and never moves HEAD, the index, a ref, a branch, a tag, or a
  stash.** Loose objects are invisible to `git status`, `git log`, and every UI the user has open,
  and `gc` collects them if abandoned. Anything touching a ref is visible history, and an agent
  silently committing or stashing under a user is the most destructive thing this capability can do
  — which is exactly what "just stash it" produces. The snapshot helper named by the original H
  decision was discarded in the rebase; this remains a boundary for any future implementation, not
  a claim that the helper exists.
- **Do not put media in a git tree, and do not put a canvas there either.** History is routed by
  artifact kind (H1). Reaching for git because it is already there is how a repository becomes
  unusable one video at a time.
- **Do not build the snapshot tree through the repository's own index.** Borrowing it drops the
  user's staged work the moment a snapshot runs; use `GIT_INDEX_FILE` pointed at a scratch path.
- **Do not merge concurrent agent writes to the same file.** Admit one writer, make the second wait,
  and route that decision through the existing permission path (H3). There is no commit to merge and
  no human watching conflict markers.
- **Do not give a parallel agent a worktree and call it isolated.** Ports, databases, caches,
  scratch space and environment are shared until declared otherwise (H4).
- **Do not ask a human to maintain a status the system can observe.** Derived activity and the
  manual `sessionStatus` label are separate fields with separate owners (H5); only one of them is
  the machine's job to keep true.

#### Current state authorities

Confirm each row against current code before changing it; extend the authority rather than creating
a neighbor.

| State | Current authority | Fleet rule |
|---|---|---|
| sessions and tasks | Craft SessionManager and task stores | reuse |
| user-facing projects | Workspace configuration/routing plus Workspace-scoped Project memberships (revised P6) | keep both existing authorities; directory sharing never merges conversations/configuration |
| permission modes and Agent gating | Craft mode-manager, PreToolUse, SessionManager approval flow | extend caller-aware policy; no second engine |
| session evidence | Craft SessionEvent stream | extend attribution only when a real caller requires it |
| session-scoped Agent tools | `SESSION_TOOL_DEFS` and handlers | tool registry, not the complete cross-caller invocation layer |
| project/workspace bytes and permissions | Craft Workspace filesystem paths and `permissions.json` | preserve; no second permission tree |
| settings, credentials, sources, skills | existing Craft stores and managers | reuse |
| R5/R8/R11 artifacts, workflows and jobs | no Fleet authority exists yet | define the smallest authority at its ordered row when an implemented real loop needs it |
| Assistant identity and requested loadout | The former `packages/shared/src/assistants/` catalog and Session `assistantId` binding are absent after the rebuild; independent identity/loadout remains a target, `not implemented` | never store an Assistant in `labels/config.json`; no new `wearing.json` writes; unresolved loadouts refuse activation; permission requests only narrow the existing Session permission |
| R6 delegation | Craft child Sessions/Tasks are the only current authority; Fleet TaskBrief/RunReport policy and projection are not implemented | extend Session/TaskRunner when R4/R5 provide real callers; no captain/manager store |
| R9 memory | no Fleet store, index or consolidation pass exists; H16–H18/H27 retain design principles only | extract the smallest store from repeated real chains; one consolidation writer, no delegate-written shadow memory |

### 5. Safety and compliance (hard)

- No quota bypass, stealth/anti-detection automation, credential/cookie extraction, unauthorized
  account automation, or terms-of-service evasion.
- Preserve user data; require explicit authority for destructive changes and external side effects.
- Keep credentials in established credential pathways.
- Do not copy restricted/unapproved source merely because a related repository is open source.

### 6. Engineering and documentation

- No forced/destructive Git operations, and no overwriting dirty work, without explicit owner
  authorization.
- Do not delete a folder, report, reference checkout, or artifact from its name, age, size, or
  apparent duplication alone. Inspect contents and history, migrate unique active facts, then remove
  only when it has no continuing authority or function.
- Do not edit dependencies/configuration to make validation pass.
- Do not use tests/typechecks as a substitute for real observable behavior.
- Do not promote a vision, field, Component or adapter from a type, mock, screenshot or isolated
  test alone. A binding contract must name its owner intent, invariant, authority, production
  writer/consumer, persisted scope, failure/recovery/removal path, acceptance evidence and
  license/platform checkpoints; otherwise keep it a proposal or breadth packet and mark the
  capability `not implemented`.
- Do not let two documents carry different live meanings for the same decision. When an owner
  decision changes, edit the canonical entry, bump the contract/spec version where applicable,
  update its capability row and reject stale writes/reports; historical rationale is evidence, not
  a second contract.
- Do not dump full repository/transcript context into a supporting agent when a bounded brief
  suffices (Decision C3).
- Do not use a PR graph or a second review shell as the product's task/session authority.
- Do not coordinate concurrent local writes through Git alone when paths overlap.
- **Do not resurrect retired planning machinery** — Waves, readiness gates, ownership forms,
  process packets, boards, mandatory status blocks. Migrate any unique active fact, then delete the
  superseded document; do not create an in-tree archive or memorial folder. **Precise boundary:**
  the *design dossiers* under `modules/` ("module/suite packets") are content, not process — they
  carry breadth/depth design and compatibility records. They are permitted only while (a) their
  depth labels remain documentation states, never work permissions or schedule gates
  (`engineering.md` §2), (b) they own no capability status, progress %, assignment, or
  approval, and (c) no document requires reading them before ordinary bounded work. The moment one
  becomes a work-permission gate or a second status system, it is the banned machinery again.
- Do not let documentation claim more than implementation. When plan and code diverge, correct the
  status immediately.

## The owner's words

These owner statements remain active product intent. Quote them verbatim when exact wording matters;
do not turn this file into an archive or infer implementation status from it. Current scope and
interface rules are owned by [PRODUCT](product.md#how-the-interface-behaves).

### OV-001 — Software must keep growing without becoming a mess (2026-07-08)

> 「以后随着AI的发展我还会往这个软件里加入更多的功能，比如无线画布增加组件，增强浏览器功能，或者
> 增加工具面板之类的，现在的整个方案选择在面对这些情况的时候能应对么」

**English gloss:** As AI evolves, the product will gain canvas components, stronger browser capabilities,
and tool panels; the architecture must absorb that growth without losing control.

**Now carried by:** Decision E1 (register, don't rewire) and E2 (install/loadout/runtime separation).

### OV-002 — High concurrency must not freeze the machine or the canvas (2026-07-08)

> 「在多代理并行的时候，智能体同时进行节点创建编码工作程序测试，生图生视频，或者视频剪辑等等，
> 高并发的时候，软件和本地电脑能抗住吗，还有无限画布要承担这么多功能，他能抗的住么，会不会延迟
> 很高还卡顿」

**English gloss:** Concurrent agents may create nodes, code, test, generate media, and edit video; Fleet and
the local machine must remain responsive, including the infinite canvas.

**Now carried by:** Decision E8 (resource limits are product behavior), the canvas
[media policy](modules/canvas.md#8-media-and-4k-policy) and
[representative Electron benchmark](modules/canvas.md#10-representative-electron-decision-gate).

### OV-003 — Owner speaks in concepts; agents choose the technical route (2026-07-08)

> 「我说话可能东一句西一句，描述顺序还是乱的，然后方便工作局做印证，而且我说的一般都不是工程用语，
> 因为我不是专业的程序员，我说的往往都是理念，需要工作局自己选择最佳的技术路线」

**English gloss:** Owner input expresses product intent rather than engineering vocabulary; agents must
reconstruct the intent, verify it against evidence, and choose the best technical route.

**Now carried by:** Decision G1 and the plain-language rule in `../AGENTS.md`.

### OV-004 — Universal spatial work system must remain modular (2026-07-09)

> 「我选3，但是所有功能都是一个个的模块化组件，这样可以文字生成到生图，生的图片还可以选择做网页/
> 视频/动态PPT等等，然后间距模组又能链接各种素材进行剪辑，你想想要怎么样才是能实现这个。」

**English gloss:** The system should be modular: text can lead to images, and the same artifact can continue
into web, video, dynamic presentations, or editing workflows.

**Now carried by:** `architecture.md` §1 (native surfaces on one spine) and
`architecture.md` §3, Decisions E4/E5, D4 (one artifact version consumed by several later
surfaces), and [SYS-05](modules/canvas.md)'s shared production board.
People and Agents edit the same artifacts on that board; native document/sequence owners retain
their models. A relationship graph alone does not satisfy this intent.

### OV-005 — Agents call modules and create workflows (2026-07-09)

> 「Agent也能调用每个模块的能力完成工作，还能根据情况创建工作流。」

**English gloss:** Agents can invoke module capabilities and compose workflows when the task requires them.

**Now carried by:** Decision S1 (one caller-aware invocation model) and E5's finite versioned DAG
workflow rule; dependent on the action spine (see `architecture.md` and `modules/agent-core.md`).

### OV-006 — Thinking intensity adapts per model; some models cannot be graded (2026-07-11)

> 「我们软件应该要能根据不同的模型自动适配不同的思考强度分级策略，有些模型思考强大不能分级」

**English gloss:** Thinking intensity should adapt to each model; models without graded controls must be
represented honestly rather than forced into a false scale.

**Now carried by:** Decision E9 (discover provider-native choices per model; translate only exact
equivalents; show on/off or hide controls when graded reasoning is unavailable). A backend's
compatibility fallback does not authorize a misleading UI tier. The former Pi 0.80.6 `max → xhigh`
mapping is not the current adapter or the product contract.

### OV-007 — Every plan is a Craft Agents second-development plan (2026-07-20)

> 「而且你是要对Craft Agents进行二开，所有规划都应该在他的基础上整改或优化」

**English gloss:** Fleet is a Craft Agents fork; every plan must begin by reusing, extending, or deliberately
replacing a proven Craft capability rather than designing an unrelated product.

**Now carried by:** Decision P2, root `AGENTS.md` rule 1, the mandatory
[`capabilities.md`](capabilities.md#craft-capability-map) REUSE/EXTEND/NEW classification,
and the module compatibility gate. Pi, OpenHands, Hermes, OpenClaw and every other repository are
evidence or replaceable adapters only; none becomes Fleet's shell, kernel or authority.

### OV-008 — Collapse Craft's redundant surfaces; task-first creation (2026-07-20)

> 「我觉得Craft Agents原版的很多设计都是多余，跟主流的Claude，codeX，Cursor桌面版都存在差别，很多
> 按钮重复功能重叠，比如我的工作区和本地文件夹还有项目，这三者的关系就高度重叠，然后新建对话应该
> 改成新建项目或者任务，还有很多设计都不合理」

**English gloss:** Much of upstream Craft's chrome is redundant compared to mainstream agent
desktops (Claude, Codex, Cursor, TRAE): duplicated buttons and overlapping concepts. Workspace,
local folder and project must collapse into one Project concept, and "new chat" must become "new
project / new task". The owner also supplied a TRAE desktop screenshot (task-first sidebar; local /
worktree / cloud execution presets in the composer) as presentation evidence.

Amendment (2026-07-20, same conversation): 「工作树的设计应该交给Agent管理，选择有本地和云端就
行」 — worktree isolation is agent-managed, never a user preset; user-facing location choices are
local and cloud only.

**Superseded by later owner directions:** OV-013 briefly retained the visible Workspace layer;
OV-020 reopened that choice. P6 now records the current Craft authority and candidate without an
approved migration. Task-first creation and local/cloud execution remain separate design inputs.

### OV-009 — Branch UX follows Claude/Codex desktop; upstream basics land first (2026-07-20)

> 「关于分支，参考Cloud和CodeX桌面版的设计」「我觉得有些设计是不是应该先落地，对于原版软件的一些
> 基础功能的设计」「特别是功能合并、精简或者删除的那些设计」

**English gloss:** Branch handling should follow the Claude / Codex desktop pattern — the user
reviews diffs and chooses apply/discard/PR; branch and worktree mechanics stay agent-managed.
And the basic-feature redesigns of the upstream software — especially the merge / simplify /
delete decisions — must land before differentiating features.

**Now carried by:** Decision C4 presentation rule + landing ladder; Decision P9 (agent-managed
worktrees); R1 slice order (dedup/merge slices first) in
[`modules/shell.md`](modules/shell.md); and the
[baseline-first development order](../TODO.md#release-ladder).

### OV-010 — Test conversations are not product requirements (2026-09-15)

> 「项目中的股票交易是我跟agent进行聊天和功能测试产生的，你们都理解错误了」

**English gloss:** The stock-trading material in the project came from conversations and feature
tests. It is not a requirement to build a trading product or name the application's default Project.

**Now carried by:** `product.md` (test-data interpretation), root `AGENTS.md`, and the data-safe
P6 preparation in `modules/shell.md`. Preserve the user's records; resolve real
record conflicts only when a migration is requested, not as a global foundation gate.

Amendment (2026-09-15): the owner clarified that a trading system was an earlier product idea and
may become an optional Trading/Market Analysis Component. Existing stock-trading messages remain
test content; the proposed Component is future, Workspace-scoped and not a Core authority. Live
orders require a separate safety/approval contract.

### OV-011 — Composer controls follow ZCode; model popup follows Cindy (2026-09-22)

> 「思考强度和模型选择也要按照他的设计进行选择对的拆分，但是在选择模型也弹窗页面应该按照Cindy的设计来」

**English gloss:** Separate model and reasoning selection following the ZCode composer reference;
use Cindy's design for the model popup. The attached model/account/price/usage values are examples,
not product defaults or evidence that those integrations already work.

**Now carried by:** Decision E9a and [R1](modules/shell.md), including exact
source paths, same-composer layout, independent Plan/permission, model option validation and
acceptance. Craft remains the visual and backend-authority baseline.

### OV-012 — Three desktop platforms and a phone connector (2026-09-22)

> 「对于平台，我打算适配win，mac，Linux，后面还会做手机端连接器像Orca那样，项目文档和各种准备工作完成后你
> 就打开软件我们对Craft Agents进行全面的整改删除所有错误的和多余的前后端设计，你可以想跟我说你想要如何整改」

**English gloss:** Windows, macOS and Linux desktop; later an Orca-like phone connector. After the
documentation and preparation, open the app and rectify Craft together, removing wrong and redundant
frontend and backend designs; the agent proposes how.

**Now carried by:** `product.md` *Platform scope*, `engineering.md`, roadmap R14.

### OV-013 — Keep Workspaces; one sidebar; Board separate; right function panel (2026-09-22)

> 「前端展示的看板先跟对话做拆开，不要放所有对话里，然后对所有对话和项目的左侧侧栏进行整改，并且删除左侧
> 二级页改成Cindy那样，我觉得工作区的设计可以保留，每个工作区可以自行配置不同的功能组件，插件Skill，MCP
> 等，然后每个工作区的对话和项目是独立的，但是也可以在另一个工作区打开同一个项目，背后的底框可以改成右侧
> 功能栏，截图里这些功能可以做移入右侧功能栏里，很多设计你都可以看看Cindy的前后端的相关设计，并且看看
> codeX和claude这种主流软件是怎么做的，找到最优解想清楚就动手」

**English gloss:** Split Board from the conversation list. Rectify the left sidebar for conversations
and Projects and remove the left second-level pages, as Cindy does. Keep Workspaces: each configures
its own components, plugins, Skills and MCPs, and has independent conversations and Projects, while
the same Project may be opened in another Workspace. Turn the bottom frame into a right function
panel. Study Cindy's frontend and backend, and how Codex and Claude do it.

**Superseded in part by OV-020:** the visible-Workspace and Workspace-wide suite choices are no
longer settled. P10 still records the sidebar/Board/right-panel intent; R1 implementation is paused.

### OV-014 — New conversation and sidebar follow ZCode and Craft (2026-09-22)

> 「新建对话的页面排版也要重新设计参考ZCode的前端设计」
>
> 「左侧的很多设计也要根据ZCode和Craft做整改，比如左下角放github的帐号信息，还有移动端远程控制和设置，还有
> 项目和任务（有些会用对话其实功能都是一样的，很多地方都是不同软件用词不同，你要主动联想）的各种按钮，并且
> 两个软件都是没有二级页的他们的设计就是我们想要的，他们还有很多移入时按钮等，都可以学习借鉴」

**English gloss:** The new-conversation layout follows ZCode. The left sidebar follows ZCode and
Craft: GitHub account bottom-left, phone remote control and settings, Project and task buttons
(products name the same thing "conversation", "task" or "session" — map them). Neither has
second-level pages; that is the target. Learn from their hover-revealed buttons.

**Now carried by:** R1 contract items 3, 6 and 10.

### OV-015 — Conversation status: running, error/paused, none (2026-09-22)

> 「而且我觉得原版软件对于对话状态的表现也不合适，积压待办等等的表情应该是给看板功能使用的，但是对于每个
> 对话的实时状态应该有另一套自动化的表现形式，只需要分正在进行，报错暂停，无状态就行，你可以看看他们的设计，
> 所有对话和项目的下拉框展示的展示的内容排版样式，功能入口还有一些相关的功能实现，交互逻辑等都要按照ZCode和
> Cindy进行整改」

**English gloss:** Craft's backlog/todo status icons belong to the Board. Each conversation's live
status is derived automatically and has only three values: running, error/paused, none. The content,
layout, entry points and interaction of every conversation and Project dropdown follow ZCode and
Cindy.

**Now carried by:** R1 contract item 9.

### OV-016 — Port the references; change only the named modules (2026-09-22)

> 「你的很多修改是完全错误的，我只让你修改所有对话和项目等模块，你却随意修改了其他部份，而且你的UI设计没有
> 遵循原版的配色艰巨设计风格，交互逻辑和排版方案也没使用两个参考项目的，完全自己随意创建了一套」
>
> 「右侧的功能面板和新建对话页面的设计也是完全没有按照两个参考项目进行整改，你做的所有前后端设计都要仔细
> 排查避免跑偏」

**English gloss:** A first R1 implementation was rejected: it changed areas outside the conversation
and Project modules, did not follow Craft's colour and spacing ("艰巨" is a slip for 间距, spacing), and
did not use the two references' interaction and layout — it invented its own. The right panel and
new-conversation page likewise ignored the references. Check every frontend and backend design for
drift.

**Now carried by:** `AGENTS.md` rules 1–2 and *Current boundary*; `engineering.md`.

### OV-017 — Rectify the project, not the documents; no casual sub-agents (2026-09-22)

> 「我是要你整改项目而不是堆砌文档」
>
> 「不要乱派子智能体」

**English gloss:** The goal is a rectified product, not more documentation. Do not dispatch
sub-agents casually.

**Now carried by:** `AGENTS.md` rule 11 and *Learned owner preferences*.

### OV-018 — Sidebar entries, What's New, and one desktop Help home (2026-09-22)

> 「还有对于左侧栏的很多设计可以直接按照ZCode的进行整改只要把分组按钮改成对话就行」
>
> 「最新动态可以放进调试里，右上角的帮助按钮跟左侧的帮助做整合」
>
> 「我想了一下之前的帮助还是放回右上角比较好，撤回相关修改」
>
> 「有些重复的按钮是可以删除的」
>
> 「比如设置就是，弹窗里有，外面也有，弹窗里的很多按钮都是重复的，你排查清楚它们是否有必要留着，是不是删了就会无法使用快捷键，还是怎么样，为什么弹窗里有那么多外面已有功能的入口」
>
> 「还有里面的帮助和文档是不是和右上角帮助里的查看所有文档跳转是一样的，是的话应该直接删除，还有可以键盘快捷键的入口也没必要在这里吗体现也可以直接删除」
>
> 「还有我觉得可以不要有二级页了，并且检测更新和安装更新也完全是重复设计，你可以仔细排查整个软件还有哪些地方有类似的错误设计」
>
> 「最新动态移到设置页面的关于下面，并且应该改成更新说明才更贴合里面的内容」
>
> 「版本和更新说明可以放一排，XXX版本   更新说明」

**English gloss:** Port much of ZCode's left sidebar directly; the only change is that its 分组
(grouped) segment becomes 对话 (conversations). The later correction keeps Help in the upper-right
desktop slot and preserves the original desktop Help submenu with its distinct topic routes. Release
Notes sits beside the version in Settings → App → About instead of in the Craft popup. The popup's simultaneous Check/Install entries are
redundant with Settings → App's stateful update controls. Inspect each duplicate action's route and
independent shortcut before removing it; compact/mobile Help must remain reachable. The owner's
request to avoid second-level pages also informs a separate sidebar audit, without authorizing
unreviewed Project/Conversation data changes.

**Now carried by:** P10 and [`modules/shell.md`](modules/shell.md#active-entry-slice); the bounded
entry correction is active, while the broader sidebar redesign remains paused.

**Later Settings correction:** the owner asked for ZCode-informed direct category navigation,
then rejected replacing the entire left sidebar when Settings opens: 「点一下设置左边一整块都变了排版和样式这是很不合理的」,
「和外部的左边栏很割裂」. Keep the Craft global sidebar mounted and place Settings categories and
forms together in its content panel. The repeated visible page title and per-page ellipsis are
retired. The owner explicitly rejected the newly added 「了解更多 · 外观」 row in upper-right Help;
that menu retains its original items. Translate the Workspace, messaging and model/connection
labels without creating another settings store. This correction is carried by
[`modules/shell.md`](modules/shell.md#active-entry-slice). **Superseded by OV-022 below:** the later
instruction clarifies that Settings should replace the existing sidebar *contents* in the same
slot, with Back to Workspace in its first row, and Help should be local.

### OV-019 — Port ZCode's sidebar, but merge Craft's own design into it (2026-09-22)

> 「左侧栏的很多设计都可以参照ZCode做整改，但是也要注意我们原有的一些设计怎么跟他做优化整改」

**English gloss:** Much of the left sidebar can follow ZCode, but Craft's existing design — the
filter popover (status, labels, grouping, search) and the conversation menu — must be merged into
it deliberately, not dropped.

**Now carried by:** [`modules/shell.md`](modules/shell.md) as reference evidence, not a port order.

### OV-020 — Reconsider the visible Workspace layer (2026-09-22)

> 「工作区觉得还是可以删除的，而功能套件等设计可以直接做成让每个对话可以加载不同的套件，或者你看看怎么设计是最佳方案」
>
> 「工作文件夹远程服务器等相关设计都会受到影响，但是你直接按照Cindy，OpenChamber，ZCode的前后端设计梳理出最佳方案进行整改就行」

**English gloss:** Reconsider the visible Workspace tier; a Conversation may choose its own suite.
Folder, Project and remote-host identity must be designed together using source evidence from Cindy,
OpenChamber and ZCode. This is a changed design direction, not permission to discard existing data.

**Now carried by:** P6 and [`modules/shell.md`](modules/shell.md#resume-criteria).

### OV-021 — Pause Conversation/Project implementation and clear the app delta (2026-09-22)

> 「而且你现在的很多修改并不合理你没考虑到各种相关的设计，你之前的很多修改也不合理，感觉还是先从一些简单的相关的设计慢慢改回更好，比如先调整按钮位置，各种入口等」
>
> 「不要你先做别的调整，先不做对话和项目相关的整改」
>
> 「先把项目的修改都清除好，并且梳理好文档」

**English gloss:** Withdraw the current app edits. Pause Conversation and Project changes, reconcile
the documents, then review the original Craft interface before any small, bounded correction.

**Now carried by:** `AGENTS.md` *Current boundary*, [`TODO.md`](../TODO.md) and
[`modules/baseline.md`](modules/baseline.md#preparation-and-joint-review).

### OV-022 — Settings slot, local Help and IM channel comparison (2026-09-22)

> 「点击设置的时候，左侧边栏变成设置页面的，新建🎨变成返回工作区按钮就行」
>
> 「把原版的帮助功能完全本地化」
>
> 「帮助文档要在我们项目做完或者某个功能确定改好了没问题的时候做更新，而且帮助文档也要做多语言适配」
>
> 「消息连接的页面排版页面宽度等跟其他页面不一致，并且参考应该参考Cindy的IM 机器人功能的前后端设计和ZCode的Bot Channel的前后端和相关设计，增加我们对其他平台的适配和各种设计优化」

**English gloss:** The Settings category list takes over the existing left sidebar slot; its top
action returns to the workspace. Local Help belongs in Settings and the upper-right trigger keeps
its position. Feature questions or requests use the installed guide as context for the existing
Agent path. Translate UI Help metadata now; publish translated operational detail only after the
feature is verified. Align Messaging Settings width with sibling pages and study real channel
adapters before adding a platform, so an icon or Connect row never overstates capability.

**Now carried by:** [`modules/shell.md`](modules/shell.md#active-entry-slice) and
[`modules/remote.md`](modules/remote.md#messaging-boundary-r14--exec-11).

### Rules for this file

Add a signal here only when the owner actually said it (with date) and it is not already carried
verbatim in an active document. When a signal's substance is promoted into a decision, note the
decision ID rather than rewriting the quote.
