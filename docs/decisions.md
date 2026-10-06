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
- **P2 — One selected product direction with preserved comparison trees.** OV-027 selects ZCode;
  `.fleet/zcode` is the active candidate. `app/` retains Craft v0.13.4 and declared corrections,
  and `snapshot/pre-rebuild-2026-09-21` retains earlier code for recovery. Those are separate
  implementation scopes, not parallel production authorities. Craft changes use
  `UPSTREAM-DELTA.tsv`; candidate changes use the ordered patch recipe. Neither base selection,
  source refresh nor a test suite approves a user-data or runtime migration. Current work order
  belongs only in `TODO.md`. (Earlier Craft-only scope superseded by OV-025/027.)
- **P3 — Shared Fleet design language; reference roles are revised by OV-025/OV-026.** Preserve
  Craft's contextual Agent assistance, conversation interactions and useful Board/Pages mechanisms;
  Craft-derived visual tokens remain reusable. ZCode supplies conversation-shell interaction.
  Cindy's feature implementations are evidence, not a mandatory host or private extension protocol.
  Earlier “Craft runtime, Cindy features” wording describes the prior branch, not the reopened choice.
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
- **P5 — Preserve a coherent design language and valuable interactions.** Craft look pins
  document their own measured values; ZCode is the active product reconstruction reference.
  Use the scoped rules in `DESIGN.md` and the current component's own primitives. Do not restore
  an older AppShell or create a second navigation owner. OV-026 permits a Board plugin with its
  own issue domain; it must reference host Sessions rather than create another execution store.
- **P6 — Project is the folder (OV-024).** It may be local or remote, and conversations may be
  folderless. Project suite selection replaces the older per-Conversation composition proposal.
  Craft Workspace records remain compatibility data until explicit access/migration proof;
  hiding a selector does not migrate records. Same-folder access never implies shared transcripts
  or grants. The current shell contract is in [Shell](modules/shell.md).
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
- **P11 — Plugin is the user-facing name for an installable capability (OV-026).** Component is
  its existing engineering term, not a second package category. It may include domain UI/storage,
  tools, Skills and Sources without duplicating host state. Import
  compatibility must map into their existing or explicitly introduced native owners, not add
  parallel installers, settings, connections, Skills or permission stores. Current Craft Skill and
  Source stores exist; the Fleet Component store, `ComponentManifest` and bundle adapter do not.

  The owner requires freely selected Components, consistent Craft
  interaction, and locally usable capabilities without a required Fleet account. Installed
  capabilities must work when a catalog is unavailable; source failures stay isolated; install
  trust is computed locally; source identity, not a reusable display name, controls update ownership.
  Cross-machine copying is explicit and user-selected, never an automatic merge of host settings.
  OV-023/OV-024 select Project-folder suites; the earlier per-Conversation proposal is superseded.
  Optional-plugin defaults outside a Project remain open; the resolver is not implemented.

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
  A verifier is read-only by default; repair is a new bounded task. Protected acceptance fixtures
  and grading criteria cannot be weakened by the executor. Adding or correcting implementation
  regression tests inside an authorized fix is normal work, not a new approval checkpoint. (2026-07-16)
- **C10 — Progress must be monotonic; incidental findings stay incidental.** Every state-changing
  action maps to an unmet criterion or declared recovery edge. After two non-progressing
  state-changing attempts, stop that approach, preserve evidence and resolve the actual blocker;
  merely renaming the tool/hypothesis does not reset the count. An
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
- **D2 — On the retained Craft branch, persistence retains its filesystem authorities** unless a measured requirement
  changes the implementation. No product-wide SQLite control plane; no independent `jobs.json` /
  `memory.json` / `clips.json`. SQLite requires a written decision with a concrete trigger — see
  [`decisions.md`](#hard-constraints) §4. Under OV-025/OV-026 this does not require replacing a
  candidate's database or a plugin's native domain store with JSON. (2026-07-09; scope reconciled.)
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
- **E5a — React Flow is the canvas implementation under OV-066; domain records remain
  renderer-independent.** This closes the former React Flow/custom-DOM selection exercise.
  Cards remain live React components; GPU rendering may serve bounded media content, never the
  product's domain authority. Verify the actual rich-card/media workload, concurrent Agent updates,
  viewport culling and memory recovery before accepting it. Reopen selection only for a reproduced
  unmet contract, preserving the same fixture and resource budget. The original DOM-family source
  observations and admission requirements remain in [canvas](modules/canvas.md#canvas-vision).
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
  selected Fleet Host.** Benchmark `model × harness/profile × task` on the same sealed task and
  effort; never generalize a Pi win into “Pi always wins” or treat use of the Pi SDK as proof that
  Fleet preserves upstream Pi's minimal harness. OV-027/066/069 supersede the historical Craft
  owner with the selected ZCode Host. A Pi-light path is an execution profile over
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

OV-025 reopens the implementation, not the rule against competing owners of the same entity.
Plugin issues, editor documents/undo and host Sessions are different entities. Do not create a second:

- session/chat store beside the selected host's sessions (Craft in the retained branch);
- permission or approval path for UI, agents, or workflows;
- memory database or silent shadow memory;
- job, cost, or usage ledger for the same work;
- artifact/file byte store duplicating native owners;
- project/task/workspace authority;
- audit timeline for the same events;
- application shell, workbench, browser stack, or settings home.
- a competing prompt/loadout or provider policy owner for the same Fleet run. OV-036 permits
  selectable complete executors with their own bound native continuation; each admitted run has
  one active executor and all Fleet domain operations retain their existing owners.

**Extend the existing authority, or demonstrate why it is insufficient, before replacing it.**
Violating this is how the product fragments into disconnected utilities.

### 2. UI and product

- **Diff a changed surface against its own pinned original** (ZCode candidate against ZCode;
  retained `app/` against Craft), and justify each delta. An unjustified
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
- Do not rebuild a working selected-host surface or restore a rejected skin without a demonstrated gap.
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
  dialogs, raw credential access, the updater, writes to the host's own global settings, and raw
  store writes. Authorized remote shell/file work goes through the selected runtime and its
  governed business handler; this rule does not ban the remote execution required by P7.
- **A remote credential is per device, hashed, scoped and revocable (Decision P7).** Never
  hand a remote client this machine's own server token, and never put a standing credential
  in an access link — the link carries a single-use, expiring invite, and redeeming it mints
  that device its own grant. One device revoked must not affect any other.
- Do not treat a component library or another product's screenshot as license to replace Craft's
  navigation, settings architecture, or product identity wholesale.

### 3. Architecture

- No workflow runner with its own permission/runtime/job systems beside the existing ones.
- A profile/reference is not permission to install another competing Fleet Host. Selectable
  executors under OV-036 retain their native loops; Fleet operations still use the canonical
  scope, permission and evidence path. Do not wrap a complete native Agent in another tool loop.
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
- No Component, MCP server or renderer may duplicate the host work-trajectory authority. Native
  editor undo and domain version history remain with their editor; they are not duplicate chat logs. Current
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

On the retained branch, persistence retains the Craft-derived filesystem stores under one logical authority (Decision
D2). Introduce SQLite or a control-plane database only when a **concrete, observable engineering
signal** appears — e.g. the first real bug where file-based lease-restart reconciliation or job
idempotency cannot be made atomic on the filesystem. Record the trigger, migration path, and owning
authority in `decisions.md`, then migrate. "It would be cleaner" is not a trigger.
This is a migration rule, not a ban on a selected baseline's existing database, a Board issue store,
or an editor's native format/history. Do not rewrite mature domain persistence solely to satisfy
an obsolete Craft-specific mechanism; ownership, export, backup and migration still need proof.

#### Artifact history (Decisions H1–H4)

- **A snapshot writes git objects and never moves HEAD, the index, a ref, a branch, a tag, or a
  stash.** Loose objects are invisible to `git status`, `git log`, and every UI the user has open,
  and `gc` collects them if abandoned. Anything touching a ref is visible history, and an agent
  silently committing or stashing under a user is the most destructive thing this capability can do
  — which is exactly what "just stash it" produces. The snapshot helper named by the original H
  decision was discarded in the rebase; this remains a boundary for any future implementation, not
  a claim that the helper exists. Unreferenced objects in the user repository alone cannot
  guarantee durable recovery through Git garbage collection. A future implementation must retain
  recoverable bytes in an owned snapshot store/pack without moving the user's refs or index.
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

These rows describe the retained Craft implementation, not mandatory future owners. Confirm them
against code; preserve records when replacing an owner under OV-025 rather than creating a neighbor.

| State | Current authority | Fleet rule |
|---|---|---|
| sessions and tasks | Craft SessionManager and task stores | reuse |
| user-facing projects | Legacy Workspace configuration/routing plus scoped Project memberships | compatibility data only; OV-024 selects one Project folder, with explicit record reconciliation rather than two permanent user concepts |
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
  approval, and (c) relevant contract reading does not become a second permission process for
  already authorized bounded work. The moment one
  becomes a work-permission gate or a second status system, it is the banned machinery again.
- Do not let documentation claim more than implementation. When plan and code diverge, correct the
  status immediately.

## The owner's words

These quotations preserve owner intent and changes of direction. A later applicable decision
supersedes an earlier conflicting one; quotations are not all simultaneously active. Quote them
verbatim when exact wording matters;
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
>
> 「改成软件更新」

**English gloss:** Port much of ZCode's left sidebar directly; the only change is that its 分组
(grouped) segment becomes 对话 (conversations). The later correction keeps Help in the upper-right
desktop slot and preserves the original desktop Help submenu with its distinct topic routes. Release
Notes sits beside the version in Settings → App → About instead of in the Craft popup. The following row is consistently labelled Software Updates, with its action reflecting update state. The popup's simultaneous Check/Install entries are
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

### OV-023 — General Agent foundation; restructure boldly, not in place (2026-09-25)

> 「我想做的是一个通用的agent软件底座，然后把不同的工作内置到我们软件里做成一个个套件，每个项目都能按需加载使用不同的套件和右侧工具栏」
>
> 「这次的修改几乎是让你删除掉Craft Agents的前后端进行重做，你不要总是小范围修改」
>
> 「我希望你能把每个大的能力和模块都拆分出来，把几个开源项目的前后端设计都放一起做对比，谁好就用谁的」

**English gloss:** Fleet is a general Agent foundation; work kinds are built in as suites, and each
Project loads the suites and right-side tools it needs. Compare reference projects module by
module and take the better frontend and backend; do not keep patching Craft's structure in place.

**Now carried by:** [`product.md`](product.md#conversation-project-and-workspace-boundary).

### OV-024 — Keep Craft's look and its Agent-operable pages; one thing called a project (2026-09-26)

**Partially superseded:** the historical Craft-base choice was reopened by OV-025 and replaced
by OV-027. The folder-backed Project boundary and contextual Agent-operation requirements remain
current. Use Product and TODO for the active implementation, not the historical base gloss below.

> 「我想你在维持Craft Agents的前端设计和一些功能的情况下吸收其他项目的优点，对我们的项目进行深度的整改，Craft Agents的很多页面或者功能，都是能让agent和人类都能调整修改，这点是别的软件不具备的」
>
> 「这是要实现任何agent的工作台非常必要的，要让agent自己就能操控我们软件的各种功能等」
>
> 「Craft Agents差的地方是新建会话，新建工作区，新建项目，把这几个东西进行了分层，但是这几个东西其实都是一个东西」；「而且现状主流软件也不是这样设计的」
>
> 「项目文件夹本身就是工作区，然后对话会放里面，没有选工作区那就是正常的对话或任务」
>
> 「应该按照几个参考项目对相关功能进行全面的整改，不要总是跟我做无意义的汇报」

**English gloss:** Craft stays the base: its visual design, chat page, document preview and the
pages both people and Agents can change. Every feature must also be operable by the Agent itself.
Conversation, Workspace and Project are one thing: a project is a folder, conversations live in
it, and a conversation without a folder is an ordinary conversation. Rectify each area fully
against the references. This supersedes the 2026-09-25 proposal to switch the base to ZCode
(withdrawn the same day; the Craft-era state is preserved at `craft-base-final`).

**Now carried by:** [`product.md`](product.md#conversation-project-and-workspace-boundary),
[`modules/shell.md`](modules/shell.md).

### OV-025 — Reopen the whole baseline and development method (2026-09-26)

> 「我觉得经过你的修改整改项目发生了巨大的问题，现状整改项目根本不可用，而且完全不如直接使用项目中的任何一个，我觉得你需要梳理清楚我的需求和想达成的效果重新选定正确的开源项目作为基线，并且想清楚正确的开发模式」
>
> 「我觉得你确认清楚我的需要也要对各种类似的软件进行研究」

**English gloss:** The owner rejects the accumulated reconstruction and reopens complete-base
selection. Clarify the intended general Agent workbench and study comparable software before
resuming implementation. Keeping Craft's valuable visual/Agent-operable surfaces does not lock
Fleet to Craft's runtime. OV-024's historical “Craft stays the base” interpretation and prior
implementation queues no longer decide this question. Preserve existing work/data while comparing
alternatives. The current source-backed recommendation to verify Cindy first is the executing
agent's recommendation, **not an owner-selected baseline**.

**Now carried by:** [Product](product.md#baseline-reassessment),
[comparison](references.md#whole-product-baseline-comparison),
[development method](engineering.md#baseline-selection-and-development-method) and `TODO.md`.

### OV-026 — Application plugins and the Craft interactions worth retaining (2026-09-26)

> 「Craft我想要的不是他的前端，而是他在跟agent交互上的一些设计，他的很多地方的功能都可以直接唤起agent让agent帮忙设置或者做配置，然后就是他的在对话气泡上的一些设计，还有他的看板功能」
>
> 「https://github.com/chuspeeism/dashi-taskboard 我希望和这个看板结合做成一个我们项目的看板插件」
>
> 「能直接安装一个插件直接在界面或者设计页面右侧工具栏，多出一个入口来或者界面来，让agent可以自由的为软件创建插件，并且些新增的界面也能符合我们软件的设计语言和各种要求这个非常重要」
>
> 「Cindy就把OpenDesign改造成了Cindy的一个插件，这样让人们可以直接在Cindy里使用Open Design这个原本是个独立软件的开源项目」

**English gloss:** Preserve Craft's contextual Agent-assisted configuration, conversation-bubble
interactions and Board value; its frontend is not the desired mandatory base. Combine the Board
with dashi-taskboard as an installable Fleet plugin. Plugins must be capable of adding genuine
pages/tool entries, including design-page right tools, and Agents must be able to author them while
following the shared design language. Cindy's OpenDesign port is the concrete application-level
example: suites can adapt substantial independent software, not only Skills or small tool panels.
This supersedes earlier blanket rejection of Dashi's board/domain storage. It does not authorize
duplicate Session/permission ownership or claim the full original OpenDesign product is embedded.

**Implementation advice, not an owner-selected schema/base:** inspect and exercise Cindy's existing
port, then prove the native-plugin seam with the requested Board; use shared operations, host
capabilities and a versioned UI contract. The whole baseline decision remains open under OV-025.

**Now carried by:** [Product](product.md#baseline-reassessment),
[plugin and Board contracts](modules/components.md#agent-authored-native-plugins),
[authoring lifecycle](modules/marketplace.md#agent-authoring-and-application-packages),
[source evidence](references.md#cindy-opendesign-application-plugin) and
[UI contract](../DESIGN.md#plugin-ui-contract).

### OV-027 — ZCode product baseline; kernel target reviewed separately (2026-09-26)

> 「我想在ZCode基础上做整改去除ZCode品牌化的设计，对他的模型设置方面还有模型方面做整改优化，我们是像Cindy和Cindy一样用pi作为内核，还有有什么更好的方案么」

**English gloss:** Use ZCode as the product reconstruction direction, remove its branding and
improve model settings and model behaviour. Evaluate using Pi as kernel and whether a better
approach exists. This supersedes Cindy-first feasibility under OV-025; it does not instruct a
continued Craft shell transplant. Preserve OV-026's application plugins and Craft interactions.

**Current implementation:** the isolated candidate still runs ZCode's `AgentRuntime` and retains
its Session/permission owner; installed `pi-ai` is a model transport. OV-036's best-first review
now recommends a different long-term Fleet-owned kernel. Product-base selection does not approve
that authority migration. Cindy's Pi RPC bridge remains comparison evidence, and current
app/data/reference pins remain preserved.

**Now carried by:** [Product](product.md#baseline-reassessment),
[source comparison and options](references.md#zcode-baseline-and-pi-integration) and
[current work](../TODO.md#current-work--zcode-baseline-and-model-boundary-ov-027).

### OV-028 — Compare vendor harness optimizations with Pi (2026-09-26)

> 「你可以拿几个模型尝试的驾驭工程跟pi做对比，看看怎么样的实现方式是最好的，能够适配不同的模型尝试，让各方都能在我们的软件里拥有用官方驾驭功能一下的优化效果」

**English gloss:** Compare several model vendors' harnesses with Pi and identify an implementation
that preserves provider-specific optimization inside Fleet. This requests source-backed evaluation,
not an assumption that a single generic protocol or replacing the whole kernel yields official parity.

**Evidence and recommendation:** the [comparison](references.md#official-harnesses-versus-pi)
records native request/history/cache/tool mechanisms and six Pi routes exercised offline. Prefer
one host authority with provider/protocol adapters and bounded model-specific policies; compare
existing ZCode and Pi adapters before changing the Agent loop. That is engineering advice, not
approval of a new runtime, dependency or storage boundary. Live cache/quality parity remains unproven.
The [first proof](modules/context.md#first-proof) fixes comparison controls and scope.

### OV-029 — Learn Hermes/OpenClaw/CC Switch mechanisms and start landing (2026-09-26)

> 「Hermes和OpenClaw是怎么处理相关问题的CC Switch能很好的适配各种厂商并且注入到各个驾驭工程，他的设计有没有我们可以学习的，想清楚就直接动手梳理好项目文档，然后开始落地」

**English gloss:** Investigate the actual provider/harness integration mechanisms of Hermes,
OpenClaw and CC Switch, organize the canonical contracts and begin implementation. This advances
OV-027/028 beyond a documentation-only comparison; it does not choose a different product base,
authorize paid requests or replace Session/permission/credential ownership.

**Landing:** an isolated full ZCode checkout plus a reproducible patch against its reviewed pin.
The first correction keeps user-owned API-key requests at their configured endpoint instead of
implicitly routing them through ZCode's platform. Its subscription account path stays separate.
The [source comparison](references.md#hermes-openclaw-and-cc-switch) distinguishes native config
projection, protocol adaptation, scoped credentials and cache policies; Pi kernel migration,
external CLI takeover and performance parity remain unimplemented.

### OV-030 — Local startup, no ZCode commerce; optional GitHub identity (2026-09-26)

> 「软件开启时的有些提问弹窗或者一些要依赖或会连接ZCode官方服务器，或者是他官方用于收集用户数据之类的东西应该删除，原本的账号登录之类的应该改成GitHub登录」
> 「开始的引导页也要去除右侧ZCode官方的标识和一些设计」
> 「还有升级套餐等商业化的设计也要去除」

The candidate must start without a mandatory ZCode account or questionnaire. Retire original product
collection and purchase/upgrade routes, retaining user-owned model APIs as optional connections.
GitHub authorization is optional repository identity, independent of Copilot model authorization.
The owner subsequently asks about official GitHub plugins; [marketplace](modules/marketplace.md#github-package-and-official-implementations)
records official MCP/CLI reuse; OV-031 corrects the existing GitHub package and account boundary.
No authorization of a real GitHub account, hosted service deployment or user-data migration follows.

### OV-031 — Local Agent help and direct GitHub account authorization (2026-09-26)

> 「右上角的帮助也应该做一些整改像产品文档应该改成Craft Agents之前那样的本地化文档，而且也都应该是给Agent使用的」
> 「ZCode原版插件商城里既有GitHub插件」
> 「还有你对于GitHub账号链接方面也做的很失败，而且我感觉不应该靠GitHubCLI来链接」
> 「而且应该使用GitHub头像而不是分支图标」
> 「头像之类的你应该直接用原版软件的大小图标之类的」
> 「Craft Agents是可以在不同的功能的页面有按钮可以直接唤起Agent，并且会发相关的文档之类的给Agent作为上下文，让Agent更好处理用户需求」
> 「而且无论是在二开Craft Agents还是现在的ZCode你修改的时候总是忽略修改相关功能或者总是错误理解我想要的东西和效果，也不多主动的提问」
> 「还有你的本地指南设计也有问题」

Use packaged, source-backed operational documents through existing preview/plugin owners. Retire
vendor-only Help entries. The generic Help → configure draft was an implementation misunderstanding,
not contextual editing. The owner confirms Craft-style small conversations, prioritizing what the
Agent needs (target, documentation, supported operations and refresh), and asks whether each ZCode
feature actually needs them. Help has exactly documentation, Resource Manager and Check for Updates.
The summary guide is not accepted as complete operational documentation.

The direct GitHub profile-login attempt was not completed and is superseded by OV-032. Its fixture
tests did not establish usable login. Existing ZCode GitHub workflow plugins have a separate tool
authorization path; no real account consent, registration or credential migration was performed.

### OV-032 — Local profile replaces the account entry (2026-09-26)

> 「还有你设计的左下角GitHub根本无法使用，还写一堆乱七八糟的小字」
> 「我感觉你对原版ZCode的很多修改都有问题，就像让你改Craft Agents时一样，各种乱搞」
> 「或者左下角去除什么账号登录之类的做成Cherry Studio那样让用户可以自己命名和替换头像的设计」
> 「还有对于ZCode原版的插件商城里的插件我们又要怎么处理，我们点击下载都是从ZCode官方下载吗」
> 「头像各个方面你也应该改回原本的，然后有些地方也被你错误的修改或者删除了整改软件」
> 「还有token环等」
> 「默认头像不对」

Replace lower-left account controls with an editable local name/avatar using Cherry's interaction
and the existing ZCode components/settings owner. Remove the newly added GitHub login path and its
configuration captions. Do not delete saved credentials or modify repository/plugin/Copilot access.
Existing preference actions retain their Settings/native menu homes. No new login service or profile
authority follows. Marketplace-source findings and proposed intake belong to the marketplace module;
asking where downloads originate does not authorize bulk mirroring or external publication.

### OV-033 — Model services and bounded credential switching (2026-09-26)

> 「你还可以看看Cherry Studio在模型服务页面是怎么设计的」
> 「API地址应该在上面，密匙和订阅账号都应该可以在下面添加多个，而且可以设计一个自动切换的开关」
> 「同服务商、同模型切换（推荐）」
> 「他的前后端交互还有各种设计你都可以看看，他的模型页面有很多不错的设计，而且还能适配Antigravity 订阅你看他是怎么实现的」

Inspect installed NewMax and Cherry's model-service implementation before landing. Keep address
and supported protocol above credentials. Multiple keys/accounts and an opt-in switch belong to
the existing Provider and credential owners. Automatic recovery stays within the same configured
service, endpoint/protocol and exact model; the answer does not authorize model-priority fallback,
cross-provider routing or mixing API billing with subscription allowance. Default off is the
recommended initial setting. Reference findings, limitations and the Antigravity integration
boundary are recorded in [the comparison](references.md#model-service-and-credential-comparison).
No real account authorization or credential migration was performed by this investigation.

### OV-034 — Vendor-first, in-place connection choices (2026-09-26)

> 「按供应商分是对的但是你的交互设计还是有很大的问题」
> 「可以想想怎么在不弹窗，不实用下拉框的情况下能让用户配置选择到想要的链接方式」

Keep the explicitly grouped vendor catalog. Selecting a vendor must reveal its service/plan,
region and protocol choices directly in the existing settings content, without a dialog or
connection-choice dropdown. NewMax's in-place connection setup and segmented formats supply the
interaction reference; reuse ZCode's existing visual primitives and credential owners. Selection
is a local draft, not creation of an empty saved Provider. Explicit Add/Connect owns persistence
and authorization. This does not approve another credential authority, new OAuth provider,
automatic paid testing or merging existing connections. Appearance remains pending acceptance.

### OV-035 — Provider-native defaults with explicit custom protocol settings (2026-09-26)

> 「对于API的格式是固定某一种，并且对另外两种做兼容好还，还是只适配一种好，有没有必要让用户手动的去择采用哪种API格式不同的API格式或者输出效果或者哪些方面有产生影响吗？」
> 「你可以看看其他的项目和软件，他们是怎么做的理出最佳方案，然后动手整改」
> 「还有对于获取最新的模型列表，没必要专门做一个按钮，又做一个弹窗」

The owner authorizes source-backed implementation following the recommendation: one internal model
contract with provider-native adapters; presets choose declared formats, while custom endpoints
retain explicit overrides. The owner's later correction, 「API格式可以直接做成这样的选择按钮」,
requires always-visible, full-width format segments, taking NewMax's interaction with ZCode's
existing controls. Selecting a documented preset route updates its format and endpoint together;
custom addresses remain user-owned. Defaults remain selected without requiring a choice.
Keep the in-place interaction under OV-034. Do not silently convert all models to Chat Completions,
probe protocols, change account/model/billing on failure, migrate existing overrides or replace the
Session/credential/runtime authority. Source comparison and concrete limits live in references and
context; this authorization is not proof of new provider support or live inference quality.
Model catalogs load within the existing model list after connection settings are committed. Remove
the separate fetch button/dialog; keep search, selection, refresh and recovery inline, without
running inference. The later owner correction automatically registers discovered models in the existing owner, preserves prior edits and disabled states, and reserves manual Add for undiscovered IDs; see the current model contract.

### OV-036 — Source-backed subscription and kernel selection (2026-09-27)

> 「还有别的订阅会员也要处理，我之前说的很多东西，你都没解决」
> 「你先看清楚各个开源项目有哪些接入方式再选择最佳方案，而不是问我」
> 「内核本身也要纳入研究范围，想清楚要实现后面的种种设计，用什么样的内核最合适」
> 「对于内核的选择应该早做决定不应该一直拖着，全面对比所有内核设计」

> 「重点是想要更好的实现我们的后续开发的各种功能和设计使用谁的内核最合适，或者我们直接自研，不要在意工作量，我只在意最好」
> 「而且你应该先更新所有项目到最新版」
> 「我希望你进行更仔细深入的研究和测试，确认清楚到底有什么样的配合还是最好的，还是说像有些像风一样，让用户可以自己切换，同时兼容多个」
> 「而且你也可以想想，当我们选择某个内核之后，对后续开发都会有哪些变化和影响」

**Historical recommendation, superseded for implementation by OV-066:** use **one Fleet Host
with a default embedded executor and selectable complete native executors**. Fleet owns Project
operations, logical conversations, input admission and usage attribution; each run has one active
executor. Pi durable/Chord remains an execution-durability candidate for the proposed default lane,
with `pi-ai` model transport, but the prior categorical claim of an established best kernel was
stronger than the evidence. Offline recovery tests do not rank task quality, cache savings or
provider latency. Preserve ZCode as the current candidate and benchmark. Its journaled dynamic
workflow already supports replay and is not an empty capability to rebuild. Choosing the Host
architecture does not require committing every conversation to one vendor or copying several
applications' stores, settings and permission systems. A production replacement remains gated.

**Why this target:** refreshed Pi `2532a0bef7f7` supports atomic transcript/task/document
commits, durable tool intent, safe-versus-unsafe replay and child foreground/background ownership.
Chord offers typed cross-process services, replicated state and reverse-disposed facets. The
source marks Pi durable experimental, and its media reader, Fleet permission policy and native
page contribution do not exist. New direct tests show that changing its model during tool work
changes the next request of the same user input, and queued inputs do not capture their route.
Fleet must bind the whole input explicitly. An internal Fleet fork could stabilize those contracts while
preserving MIT notices. Extending ZCode indefinitely keeps a single current path, but its V4
handlers call `record.app.runtime` directly and still lack the needed domain-page/plugin host.
Full Pi CLI brings its own JSONL Session and process-permission extensions; DeepSeek Cordis,
OpenCode, AionCore, Deep Agents JS, OpenAI Agents JS and the vendor CLIs each contribute useful
mechanisms but no complete ready-made Fleet host. The later official MiniMax Code V2 source is a
stronger whole-host comparator: it owns SQLite Session/history/queue, a permission gate and
supervised MiniApp publication over a vendored Pi loop. Its published source excludes the desktop
app, while inspected writers are Session/queue-specific; it does not yet prove Fleet's common
Project document/Job or native panel contract. Goose supplies the missing open desktop/CLI/ACP
comparison and correctly delegates a complete external ACP Agent; its standalone MCP App starts
a distinct ACP Session and likewise lacks the inspected common Project document/Job transaction.
A blank-sheet kernel would discard tested commit/recovery code without a demonstrated benefit.
Original ZCode's completed effects replay safely, but interrupted `world.run` nodes may run again;
neither it nor Pi supplies a remote provider's exactly-once effect guarantee. The exact
[source call chains, alternatives and limitations](references.md#kernel-choice-against-fleets-complete-product)
carry this conclusion, not ecosystem popularity.

**Authority and path:** one Fleet Host admits a versioned Project/Session command. Each existing
owner commits its own records; native files and remote effects report receipts and explicit partial
outcomes. No transaction spans all stores. Publish committed state, and reconcile an effect whose
receipt was not persisted before retrying it. A person and an Agent invoke the same resource operation; the Fleet
policy owner checks the current Project grant and resource revision at the effect boundary even
after approval. An Agent's ordinary model loop uses `pi-ai`; an official CLI/app-server/ACP Agent
runs as one capability-negotiated complete executor and reports events back to the same Host,
without an outer tool loop. Chord composes backend/renderer/remote plugin services but does not
own a second database or grant OS privileges from a manifest. Project folders, folderless
conversations, artifact references, attempt IDs and native continuation bindings need one
versioned migration map in the isolated proof; no existing user data is rewritten yet. The
[switching contract](modules/agent-core.md#kernel-target-under-ov-036) pins each admitted input,
stages choices until a safe send boundary, validates parked native state and commits a durable
handoff receipt. Switching back is native resume only when the old binding remains compatible;
otherwise it is a visible new handoff/branch. Tool, image, permission, usage and rewind capability
remain adapter-specific. The [development impact table](architecture.md#executor-choice-and-feature-development)
governs downstream feature design so the same domain operation is not implemented per engine.

**Failure and evidence:** cancellation is requested and observed separately; an interrupted
unsafe paid/destructive tool is reconciled, never blindly replayed. Removal revokes both tool and
UI registrations while keeping user documents. Existing ZCode records remain readable until a
verified copy/replay and rollback path is accepted. The offline
[`fleet-kernel-shared-operation.mjs`](../scripts/probes/fleet-kernel-shared-operation.mjs)
probe validates a shared human/Agent edit, stale version rejection, authorization revoked *after*
the model reply, Project isolation, a reconciled fake media Job and backend facet disposal across
SQLite reopen with zero network calls. The refreshed Pi
source passes 125 focused ownership/recovery cases; seven document/tool/SQLite/facet suites pass
189 cases, with overlap. The probe persists one Boolean grant; Fleet's full permission policy,
native UI plugin mounting, real media output, native executor mapping, Windows/Linux packaging and full ZCode data migration are
**not implemented** in Fleet. The current ZCode candidate remains `wired but not visually checked`.
Further executed evidence includes AionCore's 609 adapter/reducer cases, 70 original Cindy handoff
cases plus 3 boundary cases, 3 Pi model/queue switching observations and 3 original ZCode replay
observations. A real SIGKILL/reopen probe preserves a fake media receipt and leaves unqueryable
outcomes unresolved without another effect. These validate control/recovery mechanisms only;
native CLI version drift and real-account inference remain explicit limits in the source record.

**Owner checkpoint before large implementation:** this replaces a Session/permission/security
boundary and introduces maintained source. Present the isolated schema, one Project document plus
one media Job, plugin revocation, native-executor fake and read-only ZCode replay for review; only
then cut over an isolated profile with the old database intact. The user must approve that concrete
migration before production authority replacement. This entry does not authorize a paid request,
reference removal, data deletion or remote merge. HarnessRouter remains an optional external
executor-protocol comparison, not a second Fleet state owner.

> 「你确认这个是最佳方案么，别的软件的设计你都看了核对了么，有价值的项目就源码克隆下来，之前源码克隆的也记得要更新到最新版」
> 「还有这个项目有结合进来的价值么」 — [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI)

The owner authorizes refreshing reference sources and cloning valuable comparisons. Preserve local
edits and the two deliberate Craft pins; use separate latest companions where needed. Current HEAD,
source review and executable verification remain separate records. Include CLIProxyAPI's provider,
quota and credential mechanisms in the comparison; this does not authorize a second built-in gateway
or constitute approval of every upstream subscription route.

### OV-037 — Finish the model workflow and share its UI foundation (2026-09-27)

> 「我觉得添加供应商页面是不是把，订阅会员和API分开比较好，同厂商也分订阅和API」
> 「而且不需要搜索框，然后ZCode原版的每个供应商按钮太大了，和版面不协调，并且供应商图标应该加上底板统一视觉」
> 「还有在模型配置页面之外增加默认模型的选择，让用户可以自由配置常用的模型，还有默认的 生图生视频生音频的模型」
> 「还有很多我之前交代过的工作随着上下文压缩你忘记或者忽略了」

The latest intake separates subscription and API before choosing a vendor, superseding OV-034's
cross-mode vendor-first ordering while retaining in-place configuration. Coding Plans with API keys
remain subscription products. Remove vendor search, compact the cards, and use consistent icon
plates. Saved keys need independent pause/resume; model/key addition shares the same inline row
behavior, with manual model Add below the list. The owner requests CC Switch API import and a
separate default/favorite-model setting; this supersedes E10's earlier rejection of an app-wide
default picker for this candidate, using the existing default selection owner. Media defaults still
require real execution paths, not renamed chat rows. Contextual Agent configuration, subscription
reliability, quota caching, media handling and the original useful interactions remain outstanding
until their own acceptance paths close.

The owner supplied `TraeWork.zip` and requested an open-source icon/component comparison to keep
future pages consistent. Inspect it as reference data; its bundled instructions do not replace the
repository contract. [The current checklist](../TODO.md#current-work--zcode-baseline-and-model-boundary-ov-027)
records purpose, priority and closure for all these requests. This does not authorize importing an
unverified design package, adding a new production UI dependency or replacing host state ownership.

### OV-038 — Reference by function; delegate and submit complete workflows (2026-09-27)

> 「各个设计动手前都去看看结果源码参考的项目他们的类似功能是怎么设计的，很多时候名字可能不一样，但是要实现的功能是一样的」
> 「你可以先想清楚再派子Agent分头完成，并且提交的时候按最大的功能实现闭环，避免打地鼠，方便后期维护和问题发现等」
> 「ZCode是否有提供二开文档之类的也要去看看，还有插件商城的改造之类的」

Map equivalent user operations across reference controllers, persistence and execution rather than
matching component names or screenshots. The owner now explicitly permits deliberate delegation
after that mapping; this supersedes the earlier blanket avoidance of sub-agents. The primary agent
still owns design, contracts and integration. Each worker receives the relevant current contract,
file ownership and acceptance/failure cases. Organize changes around independently verifiable user
workflows, with their UI, backend and recovery together; neither one giant unrelated commit nor
unclosed cosmetic patches satisfy this. Read ZCode's actual development/extension documents and
marketplace lifecycle before choosing its adaptation. Earlier model, media and contextual-Agent
requests remain in the single current TODO, not displaced by marketplace or library research.

### OV-039 — Necessary explanations and model-foundation acceptance (2026-09-27)

> 「原版这里的小字被你错误的删除」
> 「上游格式等等一些功能的后面是否需要加一些小的感叹号注释一下每个选择会产生的影响，原版ZCode是否有地方有类似的设计可以按他的版式来」
> 「记得每个修改都要仔细排查确定清楚，避免后期带病开发，模型相关的设计是整个项目的地基」

Restore necessary introductory/prerequisite copy and use source-equivalent ZCode help/connection
card patterns. Explain the real effects of upstream formats and provider-specific subscription
steps; do not infer every Responses tool or membership entitlement from a format/login entry.
Audit saved, editing, disabled and multi-credential row states together; empty action columns are
not a useful affordance. Model metadata, execution options, context/media projection and defaults
must remain consistent across Settings, conversation, Agent tools and future capability consumers.
This strengthens the existing closed-workflow acceptance under OV-038; it does not retire earlier
subscription, media, contextual-Agent or marketplace requirements.

### OV-040 — Restore the profile menu and preserve account quota semantics (2026-09-27)

> 「原软件点击是有功能弹窗的，但是你现在改成了智能设置头像和名称的弹窗，把原本的功能弹窗去掉了」
> 「原版的Token环在没有首次对话的时候好像不显示」
> 「总不能让用户频繁的切换到设置页面查看吧」
> 「有时候用户可能订阅了20X和1X等不同档位的会员」

Restore the original avatar preference menu and put the local profile editor inside it. OV-032
changes identity/authentication, not the availability of language, theme, interface mode, zoom or
usage shortcuts. Retired ZCode commerce/authentication actions do not return. The owner requests
source-backed context/quota semantics and conversation access; account-count percentages and plan
multipliers are suggestions to evaluate, not approval to misrepresent mixed-plan capacity.

### OV-041 — Software-update shortcut and source-backed usage accounting (2026-09-27)

> 「原本的升级可以改成软件升级，用于快捷更新软件」
> 「除了之前的Token环使用统计也要考虑到，你可以看看CC Switch的使用统计是怎么实现的」
> 「GitHub上面还有很多专门监控订阅额度和CLI额度的项目你可以源码克隆有价值的做研究」
> 「getagentseal/codeburn」

Add Software update to the restored avatar menu using the existing update owner, separate from
vendor-plan upgrades. The owner names CodexBar, AIUsage, one-api, CPA-Manager-Plus and CodeBurn
as research inputs. Inspect and retain valuable source; compare accounting, quota, identity,
refresh and display, then choose mechanisms suitable for Fleet's current owners. A repository
link authorizes source study, not importing credentials, running a proxy, publishing a release or
presenting API-equivalent estimates as subscription bills. Earlier model/context/media tasks remain.

### OV-042 — Explain protocol choice plainly and restore useful token details (2026-09-27)

> 「想清楚就动手做完你之前没做完的设计」
> 「你在模型设置页面乱加的注释太多了，而且很多我看了都不知道你在说什么」
> 「看完你的解释我依旧不知道API格式选谁的有什么区别」
> 「之前的token环点击会显示详细的消耗信息，为什么现状没有了，是上游修改导致的吗」
> 「我觉得有详细的上下消耗信息会好一些」

Remove redundant explanations; retain one plain format-choice aid containing only available
options and the provider's documented interface names. Selecting a format is not selecting the
model brand. Keep actionable prerequisites, failures, quota impact and actual authorization scope.
The inspected upstream still has a character-composition breakdown and cache hit rate. The candidate
had kept an empty pre-measurement ring with only an unmeasured explanation. Restore useful click
inspection, distinguish measured per-request counters from estimated composition, and finish the
existing context/account-allowance workflow rather than treating copy edits as model-foundation
completion. Earlier statistics, capabilities, subscription, media and Agent-operation work remains.

### OV-043 — Personally verify account correctness and simplify allowance details (2026-09-27)

> 「打开授权页后又连回原账号」
> 「我登陆了第二账号，根本没用还是只显示一个」
> 「我看你现状好像连一个账号都会出问题了，不要乱派子智能体，自己排查确认清楚」
> 「额度信息不对，而且你看看每个账号的下拉框排版能不能做精简优化」
> 「而且应该显示会员订阅剩余天数」
> 「你的token环设计非常不合理」
> 「我觉得你的设计不如官方原版直观」
> 「Cockpit Tools都能识别到订阅的是什么级别的会员什么时候到期,而且还可以在他软件里使用重置卡」

The primary agent personally owns the current regression investigation and verification; no
further worker dispatch. Preserve every saved account and the original default while inspecting
authorization, identity, save receipts, account refresh, catalog replacement, quota and inference
as one workflow. A second saved account hidden behind a stale UI revision is not a failed login.
Account disclosure shows compact native quota windows and meaningful freshness. Display remaining
allowance clearly, with used percentages available as detail. Membership days require an actual
account-matched subscription term; quota resets and OAuth token expiry cannot supply it. When the
current authorization does not expose billing dates, say so without fabricating a renewal date or
silently importing browser credentials. The primary must inspect Cockpit's actual account-entitlement and subscription queries before concluding dates are unavailable. The owner rejects the added tabs and ledger-first hierarchy. Restore the original capacity → visible composition → compact allowance order; keep request consumption behind a secondary disclosure. Earlier backlog items remain open.

### OV-044 — Conversation switching and real fast-mode support (2026-09-27)

> 「是否考虑过在对话过程中切换账号，切换模型等情况发生时怎么处理」
> 「原版的软件怎么设计的，其他项目怎么设计的，你觉得最佳的落地方案是怎么样的，想清楚就动手」
> 「现状很多厂商的有些模型都有快速没收，你并没有做相应的开关」

Treat the last phrase as fast mode. Personally compare the current ZCode submission/active-model
boundary with Cindy, OpenCode and native provider contracts before implementation. Account,
model, effort and speed must reach the real request without cross-account continuation leakage,
mid-stream mutation, lost history or retry loops. Preserve a running turn and make the point of
change explicit. Speed is distinct from reasoning effort, model aliases and higher-capacity account
plans; surface it only for a supported model/connection/adapter combination, with its real allowance
or billing impact. Keep one Session, credential and selection authority. No live premium inference
is authorized merely by adding the switch. The original-layout token-popup correction and prior
account/model/media/plugin backlog remain active; no further subagent dispatch.

The owner subsequently rejected the compound Fast control: 「你把快速的按钮做的太复杂了」.
OV-047 then moved Fast into the existing effort menu: it remains an independent speed choice,
shown only when the selected model/account advertises it. Explain the allowance multiplier there,
without a second toolbar switch, slider or dialog.

### OV-045 — Remove extra model-preference surfaces and supply automatic effort (2026-09-27)

> 「不需要常用模型的设计，在每个模型都有开关不用可以关」
> 「别的软件选择了模型就能直接用，但是你的还一定要用户再选思考等级」
> 「别人好像都有自动的默认最佳等级还是怎么样，你去仔细了解清楚」
> 「你乱增加的默认模型也该删除」
> 「还有生图生视频等，还有很多我之前提到过的东西你没完善好」

Remove the added Default models page/sidebar entry, favorite-model UI and duplicate picker group;
model enablement and the existing conversation picker own visibility and selection. This supersedes
OV-037's separate default/favorite surface. Preserve existing stored preferences for compatibility
rather than silently deleting data. Selecting a model must be executable without a mandatory second
reasoning choice. Prefer a valid provider-declared default; otherwise let the provider select its
native default without inventing a universal best/highest level. Preserve valid explicit choices.
Trace normalization, submission freezing, runtime validation and final wire omission/value together.
The former required manual reasoning after incomplete restoration is superseded. A legacy
subscription auto-discovery snapshot that saved only a synthetic `off` level may yield to a newer
account catalog only when its other observed fields still match; disabled, manually fixed and
materially edited rules remain. An empty upstream effort list never establishes Off. The actual
saved selection, menu and request must agree. Media remains an
unfinished input → invocation → progress/cancel → saved artifact/preview workflow. All other backlog
items and OV-044 switching/fast-mode work remain active; this is not a cancellation of those tasks.

### OV-046 — Audit custom changes against upstream and study Pi packages (2026-09-27)

> 「整个项目的很多修改都要跟原版软件做仔细对比」
> 「确保你的修改都是在优化项目，而不是过度工程胡乱堆砌代码和防御性工程等」
> 「pi有大量的优质插件，你可以看看有些哪些是我们项目所需要的，比z code做的更好的，或者他没有但我们需要的等等」

Compare existing deltas by complete workflow with pinned upstream and named references; identify
measurable benefit, required behavior, duplicated state/guards and needless surfaces before further
layering. Study https://pi.dev/packages with source, license, dependency and real-host compatibility
evidence. Prefer packages addressing established media, document, context and plugin gaps. Catalog
claims/downloads alone do not prove quality. The current pi-ai transport is not a Pi Agent extension
host; this instruction does not authorize replacing the runtime, importing another permission/store
system, installing every package, or opening a new external service. Earlier tasks remain active.

### OV-047 — Original context UI and subscription cost accounting (2026-09-27)

> 「请求明细完全是无用的多余设计」
> 「使用统计增加每个模型的缓存命中率」
> 「用官方价格结合模型用量来算大概的花费」
> 「填我绑定的各家会员的每月真实花费」
> 「快速模式的开关可以做进思考等级里」
> 「统计也要记有没有开快速模式，算价格的时候」
> 「原本zcode的设计……Token环相关的设计没什么问题不要乱改」
> 「写ChatGPT就好了」
> 「订阅账号……在他的基础上做小的修改」
> 「每个档位用不一样的颜色」
> 「输入框选择模型后只要显示模型名称就行」

Remove the added request-detail disclosure from the context popup. Original context/allowance
structure remains the UI baseline; usage analytics owns cache hit rates and costs. Move speed into
the effort menu without treating it as effort; show sourced provider-specific multiplier information.
User-facing subscription branding is ChatGPT; protocol identity and existing credentials stay intact.
Subscription account UI reuses original plan-card structure with tier badges and bounded multi-account
operations. Composer trigger shows model name only; menu retains provider grouping.

The owner explicitly approved extending/migrating the existing statistics ledger: 「批准，按此方案实现」.
Record account, billing period, currency and actual paid fee; allocate only measured Fleet usage by
native credit weight when available, otherwise sourced API-value weight. Label allocations and
API-equivalent costs as estimates, never provider bills. Preserve unknown legacy identity, price,
speed and missing counters; no reconstruction by current defaults. Other applications are outside
measured coverage. Retention must not silently erase a paid period. New production dependencies,
external service activation and paid acceptance calls are not implied. Earlier work stays in TODO.

### OV-048 — Check new ZCode releases and synchronize applicable changes (2026-09-27)

> 「新版本的ZCode有些功能更新你可以同步更新一下」

Check public releases and source before integrating; preserve Fleet's approved changes and current
uncommitted work. At this check, remote HEAD/main remains `29628c9acdb81b703bbd4080c207a0e7ce5e276e`
and GitHub's latest public release is v3.14.3, the candidate pin. No newer public source was found;
do not invent an upgrade or replace the reference pin. Verify named missing features against that
baseline when evidence becomes available. Binary product rollout can differ from public source.

### OV-049 — Original-style statistics and simpler model management (2026-09-28)

> 「你新增的模块排版又丑……也没有图表化……写了一堆小字」
> 「模型设置里的模型都有开关了，不应该再做删除按钮吧」
> 「添加模型的设计和作用和交互还是得仔细考虑」
> 「你可以看看ccswitch等其他软件的相关设计」

Compare original ZCode and CC Switch source before refining the new surfaces. Retain ZCode's
summary/heatmap/trend/model-chart hierarchy and native visual primitives. Cache hits and estimated
cost become metrics in the original model chart; remove the added report table and permanent
methodology prose. Keep meaningful unknown/partial states visible with concise focused explanations.
Graph account-period payment allocation through the same chart pattern; retain the approved ledger
and payment ownership. This is a presentation correction, not approval to change accounting facts.
Model rows use enablement and editing; retire the duplicate deletion control without deleting data.
Native subscriptions obtain model membership from their authenticated catalog; manual ID entry is
reserved for API connections. Preserve duplicate prevention, explicit draft confirmation, cancellation
and failure recovery. Earlier backlog remains active; visual acceptance of the replaced layout is open.

### OV-050 — Reuse public price directories and validate DeepSeek intake (2026-09-28)

> 「所有模型的官方收费标准都是公开的，为什么你没有获取到别人怎么就能获取到？」
> 「有些东西你可以不用自己去获取吧，你看看别的软件有没有有相关的价格列表啊之类的」
> 「deepseek……对于第三种应该怎么添加上去？你可以用这个真实的案例来测试」

Reuse established public pricing data rather than a small hand-maintained model list. Extend the
existing price calculator with a validated bundled models.dev snapshot and a reproducible refresh
command, preserving directory provenance and verified official overrides. Price availability is
separate from missing request facts. Match provider/region and exact or unambiguous case-equivalent
model ID; no arbitrary suffix stripping, cheapest-provider substitution or zero for missing data.
Do not alter frozen historical amounts or reconstruct unknown account/speed/counters from current
configuration. The latest request does not authorize paid inference or an additional runtime service.

Validate DeepSeek with its actual authenticated catalog, then the existing manual add/save/reopen
path in an isolated configuration. Its currently published legacy Flash names are aliases, not extra
independent models; do not inflate the automatic catalog merely to match an expected count.
The test must preserve the owner's actual model list, credentials and default selection.

### OV-051 — Connect estimates, paid costs and project attribution (2026-09-28)

> 「模型费用预估啊，和下面订阅费用……他们现在还是独立的东西」
> 「每个模型的官方定价，公开定价那些也要连起来」
> 「每个项目的项目花费……让它可以在面板里独立的看到」
> 「不要乱派子整体」

The enduring outcome is to relate sourced API-equivalent usage, subscription value and Project
attribution in one understandable experience. The original exact account-period payment allocation
method was superseded by the owner's later simplification in OV-057; do not restore its editor or
paid-per-model chart from this older entry. Preserve recorded usage/account/model/speed identity,
Other attribution and the later standalone Project view through existing owners. The primary
retains integration responsibility; incomplete workflows remain active.

### OV-052 — Correct CC Switch adaptation and make statistics personalizable (2026-09-28)

> 「模型设置页面从ccswitch导入也有问题……没适配到我们的软件的设置里」
> 「你没有做到去重，有些API可能我已经绑定了」
> 「CCSwitch里也有订阅会员……导入还是让用户自己登录更安全，像Claude你就还没做」
> 「会员订阅费……能自动获取到的，不应该依赖用户手填」
> 「没有登记进项目的消耗就归其他，还有项目外的对话消耗」
> 「使用统计页面我只是想你增加一些能让Agent编辑的地方……个性化的修改」

Correct source-client URL/model semantics and map imported connections into existing provider
settings, including restart/reimport repair, logos, model visibility and membership-key fee choices.
The import remains source-read-only and uses existing ProviderSettings commands; never copy OAuth
cookies, execute foreign scripts, silently change defaults or perform paid inference.

Automatically obtain subscription billing facts where the authorized provider exposes them. Preserve
provider-reported plan/period/currency/discount provenance; a public plan price or discount amount is
not evidence of the actual paid invoice. User correction of a displayed subscription-price basis remains an outcome, while OV-057 retires
the complex fee/allocation interface. Projectless and unregistered usage belongs to Other;
no exact payment-allocation denominator is required by the simplified current design. Keep the original statistics structure;
expose bounded user/Agent customization through the existing Session, permission and settings/domain
commands, not a replacement dashboard or a second ledger. These clarifications do not cancel the
import correction or the earlier backlog. The primary agent continues personally.

### OV-053 — Reuse charts and monitor for Agent decisions (2026-09-28)

> 「使用统计新增的板块设计的就很差……GitHub上看有没有现成的好的方案或者模块」
> 「哪个工具，哪个技能使用了多少次」
> 「这些监控对于让Agent控制成本，或者决定哪些插件SKill的调整和去留都很有帮助」
> 「并不是只是为了好看……从我们整个项目的高度来思考哪些信息是应该监控留存的」
> 「看原版软件是否已经有类似功能避免重复」

Compare source before adding counters or UI. Reuse original tool/model/turn usage and existing Skill
event identity, retaining missing durable fields in the same ledger. Installation is not execution;
frequency alone is not value or permission to remove a component. Preserve outcome, duration,
retry/permission/size facts and session/turn lineage for later cost-quality and configuration-change
comparisons. Do not invent per-tool token bills from shared model requests or equate a completed
handler with an accepted task outcome. Versioned provenance and Agent access must be proven before
claiming autonomous optimization. Existing permission and user correction paths remain authoritative.

Study the owner-named EvilCharts and starc007/ui-components sources/licenses. Reuse a focused chart
pattern within ZCode's existing primitives; do not replace the design system or add a dashboard
runtime. Shared statistics retain the same time scope, clear currency units, missing-data gaps and
Other for non-project usage. Source-segmented cost bars reuse the original context meter palette;
model focus scopes the existing tool/Skill aggregate only where a turn has one known model. Earlier
CC Switch, subscription, media and Agent-editing work remains.

### OV-054 — Imported connection health and actionable failures (2026-09-28)

The owner reports unusable CC Switch imports shown as green and an English authentication error that opens model settings. Reuse the existing Provider and network-diagnostic owners: import/catalog success does not establish inference access; configured connections are neutral until explicitly probed. Preserve the original inline failure feedback, localize classified causes, and never open metadata editing because authentication, allowance or transport failed. Only explicit upstream evidence may establish subscription expiry. The recorded Kimi Code response is `access_terminated_error` (current subscription has no Kimi Code access); its successful model catalog read does not contradict that failure. Changes remain within the existing import/connection correction.

### OV-055 — Original feedback placement and product-specific subscription identity (2026-09-28)

The owner asks whether error feedback reused upstream design and positioning, and requires consumer
subscription products to keep their own public names/logos separately from the same company's API
(for example Grok versus xAI). Membership tiers belong to each account, not duplicated login routes.
Source comparison verifies ProviderDetailFeedback and its SectionLayout mount are unchanged from
ZCode 29628c9acdb8; classified/localized failure content and manual dismissal are the declared deltas.
Use existing vendor/service/region catalog fields, the existing icon library and original plan-card
badge. Retrieve Grok's tier from official RemoteSettings as Grok Build does; a tier does not establish
model access, paid amount, expiry or a complete native-client integration. Preserve user aliases.

### OV-056 — Verify wire formats per service and return to original credential controls (2026-09-28)

The owner rejects showing OpenAI Responses for a service merely because Fleet implements the
transport, requests an audit of each provider's API and subscription boundary, and restores ZCode's
simple key form: no confirm icon, and no single-credential delete/switch controls. Preset formats
need explicit service/region/auth routes and a compatible model set. OpenCode Go/Zen publish mixed
per-model protocols, so new connection choices change template/model membership; saved connections
cannot swap a protocol while carrying a different variant's model list. Custom URLs retain explicit
user-declared format choice with no promise of upstream support. One API key saves on Enter/blur;
clearing the last remains a removal path. A sole subscription account can disconnect from its
expanded row. Claude subscription must use an unmodified official client path with Fleet Session,
permission and usage mapping; Anthropic API keys and CC Switch rows do not imply that support.

### OV-057 — Separate subscription allowance from API-equivalent cost (2026-09-28)

> 「我只是想让我能更直观的看到订阅会员和API原价之间的差别，不太需要精确的算账之类的」
> 「想让你能手动修改订阅费的价格，也只是为了防止你把月费算错」
> 「感觉算上订阅费的月费会十分混乱……重点不是看他们用什么字段来表示，而是看他们对这些费用信息的获取、处理等等各个方面的实现」

The owner later retired the public plan-reference-price row and its correction form as obsolete.
An account card shows the reported tier, quota windows, term and reset-card count; when a card is
available, that count opens the details and a confirmation before account-bound redemption. The
refresh hint uses the original title/secondary-copy tooltip pattern and carries the last fetched
time, rather than repeating it inside the card. Usage Stats prices only Fleet-recorded requests at
public API rates with explicit coverage and model/project attribution. One panel joins cost-source
bars to activity facts; bars use the original context meter's tone progression and only recorded
requests. Hover or keyboard focus scopes activity to one model; no focus means all. It does not
assign a tool call a share of a whole model request or divide estimates by subscription fees.
This supersedes OV-051's visible billing-period editor and the retired plan-price row, not the
existing usage ledger or saved historical payment records. The original goal—an intuitive
subscription-value versus API-price comparison, with a correction when a displayed plan price is
wrong—remains open. Retiring the old row/form does not retire that goal. Public list price, a
user-entered correction and a verified invoice have different provenance; a compact future
comparison must disclose coverage and cannot claim exact per-model subscription billing. Its
replacement presentation is not implemented and must fit the existing connection/usage pages.

### OV-058 — Cost bars and composer usage stay local (2026-09-28)

> 「对于没有产生费用的模型，就不应该显示……上面已经显示过命中缓存了，在这里也不用显示……工具和技能的切换按钮也应该显示在右边……对于花费的蓝条也应该参考Token条用，并且搭配左下角来显示，按颜色分层来显示哪些钱花在哪些地方等」
> 「对于输入框的Token管理，没有必要有其他页面的跳转入口」

The API-equivalent cost panel lists only models/projects with a positive priced amount; unpriced
requests still count toward the visible coverage, and genuine zero is not renamed unknown. Its
recorded request-source segments reuse the original Token meter colors, with a compact amount/share
legend below the bars. The original model chart remains the home for cache-hit metrics; Activity
keeps conversation, request, tool, error and Fast facts, with the Tool/Skill switch right-aligned.
The composer context/allowance popup keeps in-place account inspection, refresh and reset actions
but has no navigation to Settings or Usage Stats. Those pages retain their independent sidebar
entries; this decision does not change the model picker's separate Manage Models action.

### OV-059 — Keep account actions right and distinguish saved rows from drafts (2026-09-28)

> 「对于订阅账号的设为默认和展开订阅额度的按钮应该靠右边，并且你的设计不太符合软件的风格。然后还有对于API页面添加API和添加模型的交互逻辑按钮啊，各个方面也设计的有些问题。仔细看看原版软件和其他软件，这些东西都是怎么做，讲清楚，怎么样设计才是最好」

The account card keeps identity and reported tier on the left, with default selection, allowance
expansion and (only for multiple accounts) removal in one right-aligned action group. This follows
ZCode's information/action card structure and CC Switch's account action placement without
adopting another theme or account store. An API connection with one saved key keeps one full-width
input; adding a second opens a cancellable draft, not a second saved credential. Default/delete/
switch controls for saved keys appear only when more than one actual saved key exists. Key entry
continues to save on Enter/blur through the existing owner without an extra confirmation button.
The model list auto-loads from the committed connection; its inline Add action allows one explicit
ID draft at a time, with duplicate blocking, confirm/cancel, preserved input on save failure and
localized feedback. It does not run a paid connectivity test or infer capabilities from the ID.

### OV-060 — Finish the product base before expanding plugins (2026-09-28)

> 「你不应该先做插件，我们项目的底座和各种基本的功能都还没整改优化好」
> 「仔细查看项目文档和聊天记录项目现状等，定位清楚整个项目存在的问题和需要完善优化的地方……然后统一进行整改优化」

The installed ZCode plugin inventory remains a read-only source reference. The unfinished
portable-plugin implementation was removed before admission. Work now follows the existing P0
connection, Session/model, context, usage/project-identity and subscription/media workflows in
`TODO.md`; native plugin host and document-suite expansion resume only after their required base
contracts are verified. A passing catalog or plugin test cannot promote an incomplete product path.

### OV-061 — Token-ring quota follows the executing account (2026-09-28)

> 「Token环里的账号信息也有问题，应该显示当前对话正在使用的模型所归属的账号而不是让用户手动点，然后就是开启账号自动切换的话你看是自动同步当前切换到的账号好，还是全部账号叠在一起百分比变成相应基础会员用量倍数的百分比（根据账号会员决定倍数，一般官方都会写每个档位是基础会员的多少倍额度）」
> 「我记得ZCode原版就是这种设计，很多时候你都应该对比清楚你自己修改跟原版确保你不是在把软件越改越差」

The composer uses the selected model's last persisted request account receipt, not a manually
selected inspection account. Before a receipt it identifies the configured default as provisional;
if the served account was removed, it shows no other account's quota. Automatic failover updates
after the next request receipt. The original ZCode context ring remains the structural baseline.
OpenAI's 5x/20x examples are estimates with independent five-hour/weekly windows and variable
model/task consumption; Cockpit's summed percentages lack a common denominator. Therefore the
Token ring stays account-specific, and no weighted pool percentage is fabricated.

### OV-062 — Contextual Agent operation is product-base parity (2026-09-28)

> 「像我之前提到的要做Craft Agents那样的右键可以让Agent在任何功能页面唤起Agent帮对话窗我们操作的还有一些相关的设计你就还没做，好像也没落到文档里」
> 「还有就是我们的软件跟普通agent软件专注于code不同，我们还需要让agent能很好的操控我们软件本身的各种功能和页面啊之类的」

Craft's targeted `EditPopover` remains in `app/`; the selected ZCode candidate lacks a
feature-bound equivalent. Promote the existing contextual-assistance contract from a later
enhancement to a product-base exit gate. Each feature page supplies an exact target and its
supported operations to one anchored compact conversation using the existing Session, permission
and domain-write owners. Preserve native context menus and a keyboard/touch entry. Model Settings
is the first full proof; a help-only popup or an unscoped new chat does not satisfy this direction.
The follow-up reiterates OV-024/026 and the product's original native-workbench definition; it is
not a new feature request or a scope change. Kernel research must consume that existing contract.
The prior coding-harness and synthetic recovery tests do not establish shared live-document
editing, native save/undo, installed page contributions or feature-local Agent operation. Prove
the current ZCode page/service loop first and compare executors through that same operation path;
do not delay the authorized baseline correction behind an unproven replacement framework.

### OV-063 — Model tool aptitude, vision bridge and prewritten follow-ups (2026-09-28)

> 「工具调用方面也会受模型影响也要纳入考虑，有些模型就偏工具，像Cindy和OpenCham ber等各种Agent软件还有很多不错的，我们缺少并且很需要的功能，比如“视觉桥 让纯文本模型获得看图能力”等，然后现在很多的Agent软件还能做到在输入框里预输入回复Agent的提示词等这种功能是怎么实现，我们要怎么做到」

Tool-call support is a model/route capability with explicit unknown, not a proxy for task quality.
Keep user corrections in the Provider owner and retain model-specific call, validation, error and
turn outcomes in the existing usage/Session ledger before comparing tool aptitude. The vision
bridge is a separate, explicit input operation that describes an attached image through a selected
eligible model before the text Agent request, preserving the source image, derived-text provenance,
permission, cancellation and both models' usage. Neither a model name nor an image-input badge
authorizes a hidden paid fallback. For typed-ahead instructions, keep ZCode's composer draft and
Session-owned `queue`/`guide` admission; OpenChamber's server queue and Pi's steering/follow-up
are comparison evidence, not another accepted queue. A draft is not a sent reply to a future
question. The source comparison is in [references](references.md#tool-capability-vision-bridge-and-busy-input-comparison).

### OV-064 — Reconcile documentation before the next kernel decision (2026-09-29)

> 「有没有发现我们的项目文档和规划中存在的问题？哪一更好方案哪些地方可能无法实现等哪些规则或者说说明文档容易让别的意见的产生产误解或者说明都不够详细啊，那些文档没有必要带过，重复啰唆了等确认排查清楚，然后对文档进行全面的梳理和整改，然后再动手法内核等各个方面进行全面的整改。」
> 「你看判断内和梳理文档，哪一个先进性比较好？」

The owner authorizes a comprehensive documentation/planning audit and rectification, followed by
kernel and product work. First reconcile the decision-bearing scope, code roots, authority,
acceptance and feasibility statements. Then decide the Host/executor combination on those existing
workflows; align the remaining implementation details from that result. Do not freeze every later
schema before the evidence or reinterpret product requirements to fit a chosen framework.

The audit may consolidate and retire obsolete project documents after preserving unique evidence
and links. It does not delete user records or reference projects, waive runtime/data/security
cutover requirements, change accepted outcome criteria, or turn a passed document gate into
implemented functionality. `TODO.md` owns the active sequence. This supersedes the retired
Craft-only work queue while preserving its source and recovery evidence.

### OV-065 — Audit prior implementation, not only its documentation (2026-09-29)

> 「如果连项目文档中都有那么多问题，那还有可能在之前的项目开发中出现了很多错误和问题，也需要你进行仔细的排查确认，然后统一进行全面的整改」

The audit includes earlier frontend/backend changes and actual runtime behavior against original
requirements and source references. A coherent document or passing pre-existing test is not proof
of a correct implementation. Follow complete workflows, reproduce defects, preserve unrelated
work/data, retire superseded uncalled mechanisms and repair verified regressions. This extends
OV-064's preparation into code verification; it neither settles the kernel choice nor waives the
existing authority/data-migration checkpoint. The active workflow list remains in TODO.

### OV-066 — Close foundation choices and deliver in dependency order (2026-09-29)

> 「还有很多重要的部分，应该赶紧做好决定，而不是让那些东西始终停留在备选待办等，想清楚整个项目的开发应该从哪些地方先入手」

**Working route; page-first order superseded by OV-067:** evolve the selected
ZCode implementation into Fleet's application Host. Keep its existing AgentRuntime as the default
executor and pi-ai as model transport. This is the development baseline, not a holding pattern
pending a whole-product bake-off. It supersedes OV-036's proposed Pi durable/Chord replacement;
that source remains mechanism evidence. No live owner, credentials or user data changes here.

| Decision now | Consequence |
|---|---|
| One Fleet Host evolved from ZCode; no blank-sheet or wholesale alternate-Host rewrite | Existing Session, command admission, permissions, Provider owner, artifact store and journal remain the starting writers. Native editor state is not forced into the Host DB. |
| Default AgentRuntime + pi-ai; selectable complete native executors | Claude is the first native adapter, then ChatGPT's native tool/image route. Users choose the connection and model; that route selects the executor, without an independent global kernel picker. Each adapter declares and verifies its exact protocol/features; unknown resume/tool/usage semantics are not normalized by guess. Internal Codex protocol identifiers remain internal; user-facing subscription name is ChatGPT. |
| Shared human/Agent domain operations are the first foundation deliverable | Start with Model Settings explanation and a version-checked model-enable operation. Use the existing Session/permission path and Provider mutation; no second settings store, arbitrary DOM controller or separate assistant engine. |
| Extend the existing plugin installer and lifecycle | Agent Skills and MCP are the initial interoperable contributions. Vendor bundles are imported per contribution. Fleet owns persistent page/right-tool integration; MCP Apps is the interactive tool-result route, not the application/plugin lifecycle. Unsupported executable extensions are explicit. |
| GenOffice open-source native document components are the Office suite source base | DOCX first, then XLSX/PPTX. Exclude enterprise-only code. Preserve each editor's live draft, undo and native save; PDF uses its own declared extraction/annotation/form capabilities. Dependency admission and format/platform fidelity tests remain before shipping. |
| React Flow is the canvas implementation | Reuse the candidate's existing dependency; keep domain records outside the renderer. The rich-card performance exercise is an acceptance test, not another open renderer selection contest. |
| One usage ledger and a simple subscription value comparison | Public API equivalents, sourced plan reference price and observed usage remain distinct. Allow correcting plan price; do not rebuild exact payment allocation or billing-period UI. Authoritative Project membership replaces the capped recent list. |
| Original ZCode interaction primitives govern the candidate UI | Port Craft contextual assistance and useful domain interactions through those primitives. Do not restart a theme redesign or import each reference's chrome. |

**Why this is the selected route:** the source review and executable probes establish existing
ZCode queue/admission/permission and journal mechanisms. Its direct Runtime calls need a bounded
adapter seam, not proof-by-assertion that a new Host is necessary. Pi durable supplies useful
recovery mechanisms, but the tested lock lacks native page/editor parity and needs input-binding
corrections. Its thin coding prompts do not establish a whole-workbench advantage; prompt/tool
projection improvements can be measured on the chosen Host. Native vendor capabilities belong in
complete executor adapters, while every engine shares Fleet's actual feature operations. None of
the inspected alternatives supplies that whole product ready-made.

This selects implementation responsibility and component families; it does not claim they are
implemented, license every dependency, authorize paid calls or approve a Session/security/data
cutover. A whole-runtime replacement is no longer on the active path. Reopen that choice only with
a reproduced unmet Fleet contract or a matched whole-workflow improvement, preserving existing
acceptance criteria. [TODO](../TODO.md#delivery-order) owns the ordered deliverables and exit tests;
[architecture](architecture.md#executor-choice-and-feature-development) owns shared boundaries.

### OV-067 — Implement and verify the kernel before feature pages (2026-09-29)

> 「对于更重要的内核和一些东西，为什么不先做」

Kernel engineering is the first implementation unit. OV-066 prematurely treated the current
runtime baseline as sufficient grounds to put page operations first. Its source/component choices
remain the working route, but neither source selection nor passing isolated probes establishes a
completed Fleet kernel. This priority correction does not, by itself, select another framework.

The kernel includes Host/Session admission, immutable input/run/executor/account/model options,
tool capability and permission enforcement, state commit and replay, cancellation, native executor
continuation and usage/artifact attribution. Establish these production boundaries and verify the
first native adapter before expanding feature pages. Page/domain operations, plugins and media
Jobs must use them rather than introducing private executors. Retain native editor data/undo.

Start on the existing ZCode command and persistence paths with the same source-backed acceptance;
fix inherited defects as well as Fleet regressions. A failed model/effort save must not change the
active selection or publish success. Real SQLite reopen verifies recovery; transient and
execution-scoped routes remain explicit. The main kernel stage must still prove permissions,
queue/stop/restart and native execution; this first persistence repair does not complete it.

[TODO](../TODO.md#delivery-order) owns the new order. OV-066's earlier page-first sequence is
superseded; no UI work is needed to justify starting the kernel. Existing migration/dependency and
external-effect checkpoints remain, reached after concrete isolated preparation.

### OV-068 — Compare full Pi hosting and extend unsupported providers (2026-09-29)

> 「你确定这样是最佳方案么，有没有更好的方案，直接参考Cindy额h Craft Agents使用PI内核会不会更好，pi对于有些我想要的供应商不支持怎么办，」

The owner challenges the prior optimum claim and explicitly requests Cindy/Craft's complete Pi
integration and provider-gap analysis. The existing AgentRuntime + pi-ai remains the running
baseline; it is not proved optimal. Full pi-coding-agent SDK, pi-ai transport and experimental
pi-durable/Chord are separate choices. Native Pi continuation under one Fleet Host does not itself
violate single logical Session ownership. Retire the earlier categorical rejection on that ground.

Source and the new full-SDK probe make Craft-style supervised Pi SDK a recommended default-executor
target for the bounded kernel comparison, using Host-owned permissions/resources/domain operations
and Cindy-style independent connection identities. This is a recommendation, not an approved live
cutover or a claim that Pi always improves model quality/cost. Current production owners and data
remain unchanged. A model-switch persistence counterexample in both tested SDK versions must be
handled in the comparison rather than hidden by a success count.

Unlisted models use verified compatible endpoints; auth/discovery/protocol gaps use Provider
extensions and wire adapters. CLI-only access and media execution are separate capability paths.
No catalog registration or API key establishes subscription entitlement. Exact sources, versioned
probe results and limits live in [references](references.md#full-pi-sdk-and-provider-extensibility-reassessment).

### OV-069 — Execute full Pi integration beneath the existing Host (2026-09-30)

**Implementation boundary:** current code runs Pi AgentSession for loop/dispatch/abort/settlement.
ZCode Host still assembles requests, calls providers, executes tools and owns retry, compaction,
permissions and persistence. Pi default resources and extension autoload are disabled. The heading
records the requested integration direction; it is not evidence of the full default Pi harness.

> 「排查确认清楚然后动手执行，不要总是跟我做无意义的阶段性汇报」

Following the explicit full-Pi proposal under OV-068, the owner directs inspection and execution.
This authorizes the bounded candidate SDK dependency/integration, preserving ZCode product owners,
permissions, credential/model adapters and user data. It does not authorize paid calls, arbitrary
plugins, whole-Host replacement or a live-data migration.

Full Pi AgentSession now drives each admitted input's model/tool continuation inside the existing
supervised CLI process. Host context, protocol, tool scheduling, permissions and canonical SQLite
remain authoritative. Private SDK state is in-memory per input; restart uses committed Host history.
The initial legacy comparison path has since been retired from production; the current loop
selects Pi or an admitted native adapter, without a legacy environment selector.
Model binding is changed in Pi only after Host commit. Preserve lazy persistence for unsent drafts.

[Agent core](modules/agent-core.md#first-proof) owns this boundary; tests and actual binary evidence
are in [Engineering](engineering.md#zcode-candidate). This implementation does not prove superior
model quality/Token cost, native vendor executors, all platform support or whole-kernel completion.

### OV-070 — Complete the foundation before plugin development; keep model calls lean (2026-09-30)

> 「仔细看看整个项目在进入插件开发之前还有哪些问题，哪些地方不完善，哪些工作没做的，群都解决好」
> 「希望我能实现像Pi那样精简，不占用模型的上下文…对模型来说的轻量」

The owner reiterates the existing delivery order and asks for model-facing economy rather than
fewer product capabilities. Fix demonstrated context/loadout defects through existing Host
owners; preserve policy, task evidence, original retrieval and explicit invocation. Full Pi does
not inherit upstream prompt size or prove better reasoning. Measure actual projected inputs and
accepted outcomes before broader profile/selection changes. Existing dependency, native permission
and live-data checkpoints remain; no plugin feature expansion closes an unresolved kernel gap.

### OV-071 — Proceed with native SDK and permission integration (2026-09-30)

> 「去做啊，要我批准什么」

The owner responds to the specific Claude SDK/native permission proposal by directing execution.
Proceed with the official Claude Agent SDK dependency and bounded Claude/Antigravity adapters
through existing Host permissions, Session writers and accounting. Preserve Pi and current data;
do not ask for this same approval again. This does not authorize paid provider tests, publication,
credential copying or migration of the retained branch. Native opaque continuation is its own
entity; it must not replace the editable Fleet conversation or imply unverified compatibility.

### OV-072 — One candidate review instance (2026-10-01)

> 「你现在会同时开启多个Electron，这是非常明显的大问题」

Use one retained candidate review profile and reuse its running window. The agent's parallel
review profiles and automatic app lookup after quit caused the duplicate windows; the original
ZCode single-instance lock already exists. Consolidate development launch paths rather than
replacing production window ownership. Preserve old profile/configuration files and user artifacts;
inspect unsent state before closing a window, and never claim v4 drafts survived restart without proof.

### OV-073 — Replace improved subscription implementations without duplicate paths (2026-10-01)

> 「还有pi新增了对GPT订阅的支持，我们的相关设计也要做优化整改，上面的一起改」
> 「如果更好就应该直接替换，不要留着垃圾」

The owner authorizes the proposed Claude bundled-executable/native-resume correction and the
new Pi ChatGPT subscription integration together. Replace default login and retire duplicate
controls/code; preserve existing user records through necessary compatibility, without guessing
identity across protocols. Use the existing credential and Session authorities, with the vendor
retaining opaque continuation. No paid inference, credential copying or retained-branch migration
is implied. Current implementation contracts belong to Context and Agent core.

### OV-074 — One model and reasoning entry, compact Brain icon (2026-10-01)

> 「合并模型和思考入口，并保留小闪电」
> 「模型的思考强度和模型选择合并在一起」
> 「当窗口缩载到一定程度的时候，可以把模型名称简化成……原本的大脑图标」

Use one composer control for the model name, current evidenced reasoning choice and independent
Fast action. Preserve the existing model/account picker, effort order/default resolver, request
binding and keyboard commands. At insufficient width, the same entry collapses to the original
Brain icon with an accessible tooltip. Reuse ZCode primitives and typography; the owner's Codex
desktop screenshots supply interaction reference, not a new theme or permission to invent effort
levels, slider precision, model names or prices. Page-assistant work remains required and resumes
from its unfinished verification after this input-control correction.

### OV-075 — Compact model-options rows without Settings navigation (2026-10-01)

> 「要么像我截图这样设计，要么做成我之前发给你的图片等他划条的样子，现在这个样式很不对，而且不需要用模型设置的入口」
> 「有些模型是可以选择上下文的这种才要有上下文窗口的，这种才要出现上下文选择」
> 「很多软件都不用首次对话就知道模型上下文限制」

Use the compact-row screenshot for Fast, Effort and Model. Show a Context selector only when the
selected route has explicit, executable context choices; a fixed capacity is not a selector.
The current catalogs expose fixed limits without a wired variant-selection contract, so this
menu omits Context rather than inventing options. Fixed evidenced capacity is available from the
original Token ring before first inference, independently of unknown measured occupancy. Exact
effort/model values remain in submenus; a single provider needs no redundant provider layer.
Remove Manage Models from the composer menu; existing Settings navigation and setup feedback
retain that path. Keep the unified trigger/compact Brain and independent request fields.

### OV-076 — Strengthen the built-in browser and assess Chrome extensions (2026-10-01)

> 「还有对于自带的浏览器也要做全面的增强，现在很多软件都直接内置真实的浏览器，还能直接装谷歌插件等」
> 「你应该先看看你现在在自己所在这个软件里，它的浏览器是怎么实现的？」

Audit and strengthen the candidate's existing Chromium browser together with the unfinished
project correction. Compare real extension hosts and installers, not screenshots or a decorative
Store link. Preserve the original useful guest/profile/Agent path and establish actual extension
compatibility, installation, permissions and lifecycle before advertising it. This request does
not retire earlier model, subscription, cost, media or page-Agent work. Production dependency,
credential/profile migration and security-authority checkpoints retain their stated scope.
The installed Codex desktop is a mandatory implementation comparison before a browser-runtime
replacement recommendation; its CLI source and ordinary Electron documentation are insufficient.

### OV-077 — Scope new-conversation model defaults and simplify selection (2026-10-02)

> 「明明配置了模型新建对话却一定要手动选择是不对的」
> 「已经配置了API或者订阅账号应该有默认模型」
> 「每个项目新建对话……沿用上一次该项目对话选择的模型……会跟新建对话的默认模型不同」
> 「可以自己去使用Cursor看看他是怎么做的……具体的设计你可以去看看几个开源和商业项目」

Correct new-conversation defaults and composer interaction within the existing owners. Ordinary
conversations and each Project/runtime identity keep separate remembered choices. Connected catalogs
provide a valid starting model without a mandatory extra selection; late readiness does not leave
an initialized new composer permanently empty. Explicit draft/history/admitted bindings and actual
unfinished content remain. Compare actual Cursor interaction and source-backed Codex/open-source
defaults, distinguishing observations from uncertain product guesses. Preserve the combined model,
effort and independent Fast controls and the host's visual primitives; no new defaults page,
automatic paid inference, credential authority or unrelated redesign is authorized. Earlier
unfinished subscription, media, browser and page-Agent work remains in its established order.

### OV-078 — Official and ecosystem implementation research per module (2026-10-02)

> 「每个厂商的官方软件或插件生态里怎么处理的，我希望你做每个功能模块前都这样的去研究清楚」
> 「而且很多重要的信息你也没更新进文档」

Before implementing a module, compare the selected original, the relevant official vendor
implementation or public contract, and a concrete ecosystem mechanism. Examine acquisition,
processing, execution and recovery, rather than field names or screenshots. Keep the resulting
contract, capability status, work order and evidence in their existing singular homes. NewMax and
Minara's preserved client reviews are evidence for local mechanisms, not complete remote-server
reverse engineering or permission to copy proprietary code. This requirement accompanies the
unfinished engineering; it does not replace it with another research or documentation phase.

### OV-079 — Primary traces NewMax implementation and model interactions (2026-10-02)

> 「NewMax 的前后端设计都要仔细查看他有很多好设计」
> 「不用派子智能体你亲自去看看人家的前后端源码具体实现，模型配置交互逻辑」

The primary personally inspects the actual renderer, preload, local service/persistence and
execution paths, with model-configuration interactions as the immediate focus. Delegation for
this study is stopped. Preserve the installed 1.1.18 and installer 1.1.19 as distinct inputs;
runtime observations of the installed version do not verify the newer source. Carry useful
mechanisms into their existing Fleet owners after comparison and tests, without copying the
commercial client's implementation or assuming access to its hosted-server internals. Earlier
unfinished rectification remains in scope.

### OV-080 — Parallel rectification judged by complete product outcomes (2026-10-02)

> 「那些可以分支并行开发的就多Agent并行开发，主要的是我要高质量的项目代码而不是一堆屎山」
> 「如果你开发出来的项目既不能实现我的愿景又不能很好的超越参考的项目，那就是完全没意义的事情」

Parallelize independent bounded fixes with explicit file ownership, failure cases and integration
responsibility. Cross-review changes and exercise the combined running product; concurrent worker
completion is not delivery. The primary retains account correction and the personally requested
NewMax study. Judge improvements against the same complete human/Agent workbench task and the
selected original/reference mechanism, not feature count, code volume or passing isolated tests.
Preserve existing owners and replace only demonstrated inferior paths; no new framework is needed
merely to coordinate these workers. Existing unfinished requirements and delivery order remain.

### OV-081 — Application-wide contextual assistants and purpose defaults (2026-10-02)

> 「他应该能软件的页面点击右键就能唤醒，并且默认在不同的页面点击右键，都会唤醒一个全新的助手」
> 「对于新建对话新建助手等等，各个方面默认用什么模型应该有可以设置的地方」
> 「你应该亲自去看这个功能的主要参考项目，它在这个东西相关设计各个方面都是怎么做的？」

Make the contextual entry application-wide, preserving native and domain context-menu actions.
Each user invocation creates a fresh assistant; command retries remain idempotent. Explicit history
selection continues an existing Session without replacing its model or target. Purpose defaults use
the existing model-preference owner, with an independently configurable page-assistant model.
Configured ordinary-chat defaults precede ordinary recent choices; Project recent choices retain
their own priority. Assistant selection must not write ordinary/Project recent-model preferences.
Primary traces Craft's complete interaction and creation/default/permission implementation. Page
availability is distinct from which domain mutations have real scoped operations.

### OV-082 — Capability filters for large model directories (2026-10-02)

> 「当前API或订阅会员的模型数量超过一定数量的时候，是不是应该在搜索框前面新增这样的按钮」
> 「这个按钮最好根据API下所有的模型种类进行自动变化」

Show capability filters before search only for a large unfiltered directory, using evidenced output
types and hiding empty categories. The bounded implementation chooses more than ten models as its
threshold; that number is an implementation choice, not an owner quotation or a reference guarantee.
Unknown models remain visible in All; vision input cannot establish image generation. Audio kinds
must come from real output/endpoint evidence before speech/transcription filters are advertised.
Search and type filters compose; filtering must not reorder only part of the stored catalog.

### Rules for this file

Add a signal here only when the owner actually said it (with date). State its meaning; quote only
where exact wording matters (OV-093). When a signal's substance is promoted into a decision, note
the decision ID rather than restating it.

### OV-083 — Kernel rectification remains first; primary owns this audit (2026-10-03)

> 「重点应该是内核」
> 「不要乱派子智能体」

The current execution/application kernel remains the first deliverable under OV-067. Close
reproduced admission, permission, stop, durable-effect and recovery failures before expanding
feature pages or plugins. Vendor login/model routes are kernel proofs; a functioning account form
is insufficient. Measure the actual model-facing projection separately from private SDK state.
Existing page/default/filter work remains preserved and incomplete until its own gates pass.
Primary performs this kernel source review, implementation and verification directly; this owner
correction restricts earlier bounded parallel authorization for the active work.

### OV-084 — Use Pi Agent Core for the default general-purpose executor (2026-10-03)

> 「重点是选出最佳的内核然后落地，而不是过测试」

The implementation choice is Fleet's existing application Host plus Pi Agent Core (currently pinned at 1.0.1) for
the default generic model/tool loop, with separately selected official native executors for
subscription-specific capabilities. Replace the interim Pi Coding Agent AgentSession wrapper,
empty resource loader and hidden continuation message. Agent Core is already shipped transitively
by the pinned Pi SDK; its direct import makes that existing dependency explicit without a new
package/version or service. The comparison is driven by Fleet's general workbench requirements,
not an assertion that a framework name raises model quality.

Host retains admitted inputs, shared domain operations, permissions, request context projection,
results and usage. Pi owns scheduling and settlement through its public prepare/finish hooks.
Native vendors retain their own continuation/authentication semantics. Model-facing prompts and
optional tool discovery remain narrow, shared projections; editor state is not moved into Pi.
Source mechanisms from MiniMax's PiTurnRunner, Craft's AgentSession proxy and Cindy's Pi RPC are
bounded comparisons. Built-in Coding Agent extension/CLI behavior is not implicitly enabled by
using Agent Core. Source compatibility and execution verification are admission checks after
this product/architecture choice, not the criterion used to select it.

### OV-085 — Reference-backed contextual popup interaction (2026-10-03)

> 「而不是像现在一样，在每个页面加一个让Agent帮忙的按钮」
> 「人家的右键不是直接唤出对话框」
> 「它唤出的对话框也能根据鼠标点击的位置不同而在原位唤出」
> 「你唤出的对话框也不能自由拖动啊等等」
> 「这一项优化优化最好写进规则里」

Right-click retains the menu; its contextual assistant action opens a fresh conversation beside
the captured pointer/selection. Retire repeated page-header substitute buttons. Reuse Craft's
complete menu-to-popup, movement, resizing, focus and context-delivery mechanisms while retaining
ZCode primitives and the existing Session/domain-operation owners. Inspect those mechanisms before
future interaction changes; AGENTS rule 1 carries this source-intake requirement. This corrects
the previous direct-open interpretation of OV-081 and does not authorize arbitrary page mutations.

### OV-086 — Contextual menus, compact helpers and visible purpose defaults (2026-10-03)

> 「重点是当我一直点右键右键弹窗并不会跟我一起换位置」
> 「你胡乱增加了一堆的元素，什么token环，什么权限按钮模型选择」
> 「把我们的一些默认 模型相关的设计可视化可配置化」
> 「我们有子智能体配置的页面，有些我们有的就不要重复造」

Repeated right-clicks must relocate the menu and capture the latest object. Preserve region-specific
operations and reuse their existing callbacks, rather than filling every region with one generic
assistant item. Compact page conversations omit the main composer toolbar; shared approval and
Stop semantics remain. Model Settings owns visible ordinary/page/vision purpose defaults using the
existing Personal preference owner. Child-agent choices retain their existing settings page.
NewMax's two-stage planning/execution fields are reference evidence, not permission to add controls
without actual dispatch behavior. This correction creates no new Session or credential authority.

### OV-087 — Current decision-model sources and optional quantitative suite (2026-10-03)

> 「Craft Agents的最新版增加了对决策模型的支持等」
> 「很多软件也有了新版本记得更新看看哪些是值得吸收的」
> 「我们后期要做量化交易的插件我觉得这么模型可以有大用」

Review fresh, locked relevant source copies without replacing required original pins. Typed
classification and planning/execution chat models are separate operations. Under OV-084 the selected
implementation disposition is existing Host + installed Pi classifier transport, with bounded
validation/admission and optional feature policy; no new execution framework is selected. Existing
Subagents remains the owner of named worker defaults. The quantitative capability stays an optional
suite: semantic screening can support research but supplies neither market-return probabilities nor
order authority. Source/fixture proof does not establish prediction quality or full feature delivery.


### OV-088 — Original settings and explicit default policies (2026-10-03)

> 「你的新页面又不符合软件的原版设计风格和交互逻辑」
> 「又他妈的制造了一个子智能体的重复入口」
> 「一种是沿用之前的新建对话的模型，一种是固定一个默认的对话模型」
> 「你应该仔细去看看原版项目和各种参考项目，它们相关设计是怎么制作的」

Keep scoped defaults in the existing model-settings host with ZCode settings controls. Remove the
repeated Subagents link; the original Subagents page remains its sole settings entry. Distinguish
recent, fixed and automatic ordinary defaults using the Personal writer; reuse the existing scoped
recent owner. Projects retain their own recent preference. Existing drafts and admitted/historical
Sessions are not rewritten by a default change. This corrects the ambiguous automatic label and
repeat entry; it adds no second preference, Session, credential or child-agent authority.

### OV-089 — Correct interaction regressions and remove redundant control copy (2026-10-04)

> 「而且你总是喜欢乱加小字或者是说明在软件里，把软件作成了说明文档」
> 「然后再很多设计上，你改了之后比原版差的很多」

Compare complete original and reference interactions before correcting them. Preserve essential
setting names and the original Help path; controls and hover hints need not repeat full provider,
model, current state and implementation explanations. When a model has no adjustable parameters,
open its original provider/model chooser directly. Fixed Off is not a disabled-model status.
Large catalogs retain search and keyboard access without reintroducing the empty options layer.
The existing merged menu remains for advertised adjustable parameters. Model default policy and
fixed selection are separate controls, and contextual assistance must address their actual surface
and active policy. Subagents retains its sole original entry. These are reversible corrections,
not authorization to remove capabilities, create another authority or redesign the entire UI.

### OV-090 — Compare the complete borrowed feature (2026-10-04)

> 「不仅要对照原软件，你哪一处设计参考了哪个软件的，你就要跟它做对比。」
> 「而且你每次看某个软件的某个设计，你看的都很局部，没有把相关设计都纳入考量范围」

Name the reference for each adopted design and trace its connected views/settings, frontend and
backend, scope/context, permissions, persistence, recovery and lifetime. Compare those relationships
with Fleet's complete path, including interactions deliberately retained or rejected. The original
host establishes regression parity; it does not alone establish a borrowed design's correctness.
Record the mechanism and evidence level in the existing reference ledger. This broadens source
coverage without replacing the authorized engineering task with an unlimited survey.

### OV-091 — Useful entity actions in contextual menus (2026-10-04)

The owner retires plain Open where primary click already performs exactly that action. Regional
menus reuse frequent actions already present in the entity's overflow menu: provider rename/delete
keep the original editor, revision and confirmation. Distinct browser/editor/panel destinations remain
explicit alternatives. Audit all corresponding regions and lifecycle callbacks, not only the page
used as the owner's example. This changes no data or permission authority.

### OV-092 — ChatGPT account mark independent of executor (2026-10-04)

> 「你应该用 ChatGPT 的图标，而不是用 Codex」

Use the ChatGPT account mark for this subscription connection, including its native Codex backend.
The visual choice changes neither executor identity, authentication nor stored connection data.

### OV-093 — Record the owner's meaning, not a verbatim transcript (2026-10-02)

The owner said exact wording need not be preserved; what matters is understanding the request
correctly. New entries state the decision and its intent in plain language. Quote the owner only
where a specific word or UI literal matters. Existing quotations stay as history; no ledger rewrite
is required, but they never outrank a later decision's stated meaning.

### OV-094 — Antigravity follows the existing permission selector (2026-10-05)

The owner points to the composer's existing permission modes instead of a separate yes/no choice.
The Antigravity executor maps them onto `agy`: plan → `--mode plan`; ask before changes → default
(`agy` cannot forward approval prompts over stream-json, so its own risky tools are refused while
Fleet Host tools keep Fleet's approval); auto edit → `--mode accept-edits`; full access →
`--dangerously-skip-permissions`. Like native Codex, real effects should route through Fleet Host
tools so one permission owner applies. Reuse the existing design before proposing new choices.

### OV-095 — Keep the original product name until release (2026-10-05)

Keep the inherited ZCode product name, data directories and menus during development. Rename
once, together with data migration, when the product is complete; repeated interim renames would
confuse the project. This defers the R2 branding rename; it does not change other debranding.


### OV-096 — Only vendor-sanctioned connection routes (2026-10-06)

The owner requires every design to follow the vendors' official rules so users are never banned.
Evidence, checked 2026-10-06:

| Route | Ruling | Source |
|---|---|---|
| Claude Free/Pro/Max driven by Fleet (Agent SDK) | Retired | Anthropic: no claude.ai login or plan credentials in third-party apps, including Agent SDK agents; developers may not collect, store or intermediate Claude credentials (code.claude.com legal-and-compliance, agent-sdk overview) |
| Antigravity driven by Fleet | Retired | Antigravity Additional Terms §6: third-party software accessing the Service is a breach; enforced with suspensions |
| GitHub Copilot via the VS Code extension's OAuth client | Retired | Impersonation; GitHub documents `copilot --acp --stdio` instead |
| Grok via the Grok CLI's OAuth client | Retired | Impersonation, no published permission; `grok agent stdio` is xAI's own ACP mode |
| Legacy ChatGPT grants via the Codex CLI's client | Refused until re-registered | OpenAI's Sign in with ChatGPT for open-source, locally hosted apps uses Fleet's own registration |
| API keys; Sign in with ChatGPT; Codex app-server; documented ACP modes (Kimi, OpenCode, Cursor, CodeBuddy, Qwen, Hermes, OpenClaw, Copilot CLI, Grok Build) | Permitted | Vendor docs |

Retired routes keep their saved data, cannot run, are hidden from new connections and explain the
permitted alternative (one owner: `packages/provider/src/route-policy.ts`). Fleet never copies,
reads or writes another product's credentials (Cockpit Tools' account switch does; Anthropic forbids
it). Claude subscriptions are used in Claude Code itself; Fleet uses Claude through an API key or a
cloud provider. Claude multi-account and auto-switch are removed; ChatGPT keeps OpenAI's documented
multi-account registrations, auto-switch default off.
