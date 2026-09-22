# TODO — development plan and current progress

The development order and what is being done now. Owner direction can reorder anything; record the
change here and in [`docs/decisions.md`](docs/decisions.md).

## Where the project is

- `app/` = unmodified official Craft Agents v0.13.4 (zero upstream delta).
- Owner order: documentation and preparation → joint walkthrough of original Craft → approved
  rectification slices → implementation and acceptance → added capabilities.
- **R0 (baseline stabilization) is the single ACTIVE release.** Inside it, the owner has authorized
  one slice ahead of the walkthrough: **R1 shell and context rectification.**

## Active slice — R1 shell and context rectification

Contract: [`docs/modules/shell.md`](docs/modules/shell.md).
Status of every item: `not implemented` (the 2026-09-22 attempt was reverted).

Ten deliverables in a fixed order (sidebar and Board → Workspace boundary → composer → right panel
→ activity → footer), each with the reference component to port and its acceptance ID:
[delivery order](docs/modules/shell.md#delivery-order). Each step is diffed against Craft and the
reference, declared in `docs/UPSTREAM-DELTA.tsv`, typechecked, run, and shown to the owner before the
next one starts.

## Next inside R0

These come from the R0 walkthrough groups and R2. Each needs owner approval as its own slice.

- **Updater — do before any packaged build is handed out.** Packaged Craft sets
  `autoDownload = true` and `autoInstallOnAppQuit = true` against
  `https://thecraftagents.com/electron/latest`; dismissing a version only hides the notice
  (`auto-update.ts:502`). See [`docs/engineering.md`](docs/engineering.md#building-and-packaging) and [R2](docs/modules/services.md).
- **Other Craft-operated services (R2):** Pages hosted publication default, Sentry build-time ingest,
  hosted help guidance in the Agent prompt, OAuth relays, Craft branding in packaging
  ([services](docs/modules/services.md)).
- **Credential recovery:** `credentials/backends/secure-storage.ts:handleCorruptedFile` deletes
  corrupt bytes; preserve them and report instead ([agent-core](docs/modules/agent-core.md)).
- **Browser tool permissions:** `browser_tool` is allowed whole in Explore/Safe; classify per action
  ([browser](docs/modules/browser.md)).
- **Skill metadata:** the parser keeps a six-key subset and drops `triggers` (220 of 398 real skills)
  ([marketplace](docs/modules/marketplace.md)).
- **Three-platform build verification:** Windows NSIS x64, Linux AppImage x64 and macOS dmg/zip each
  built and launched on their own platform. A Mac run certifies only the Mac.
- **Restore the UI-contract guard** removed with the original-source reset. Its implementation and
  test are recoverable from `snapshot/pre-rebuild-2026-09-21` (`app/scripts/check-ui-contract.ts`).
- **Upstream test defects (L0), 33 tests in 6 files plus one timing-flaky test** — recorded with
  causes in `scripts/known-upstream-test-failures.txt`: a stale RPC channel list (v0.13.4 added
  `pages:getShareDataScan`), a millisecond timestamp that makes a prompt test nondeterministic,
  browser test mocks without `webContents`, a connection test that only passes against a real user
  profile, and two isolated tests whose module mocks predate v0.13.4 imports
  (`defaultMidStreamBehavior`, `getBrowserToolEnabled`).
- **CLI launcher (upstream defect, L0):** `app/apps/electron/resources/bin/craft-agent` runs Bun on a
  missing entry file and exits 0. `scripts/tests/test_cli_wrapper.py` holds the expected behaviour as
  an expected failure until the fix is approved.

Joint walkthrough groups and the corrected-baseline exit: [R0](docs/modules/baseline.md).

## After R0

1. Component and panel host foundation — Files and Notes through one registry, scoped activation,
   user-controlled layout ([SYS-09](docs/modules/components.md)).
2. Domain features in release order (ladder below).
3. External component distribution ([`docs/modules/marketplace.md`](docs/modules/marketplace.md#plugin-skill-and-marketplace-design)).

Plan corrections made in the 2026-09-22 restructure: the R1 row no longer says "Project = folder"
(superseded by the Workspace revision); the updater is scheduled before any packaged distribution;
the far releases R5–R18 stay in the ladder; their `Execution` sections in `docs/modules/` name
the next step after their gate opens and are never current work.

## Release ladder

> **This document answers "what integrates next?" — and only that.** It is a dependency-ordered
> integration queue, not a calendar and not a scope cut: **design coverage is never sequenced**
> (Decision G5 — every product domain stays registered and described at breadth in
> [`capabilities.md`](docs/capabilities.md#product-matrix) and
> [`capabilities.md`](docs/capabilities.md#page-structure) regardless of order here). Dependency logic:
> [`architecture.md`](docs/architecture.md) §2. The owner may reorder or activate anything at any
> time (G2); record the change in the log below.

Large capabilities remain designed in [`engineering.md`](docs/engineering.md#module-compatibility-gates) and
`modules/` even when their implementation is `GATED` or `not implemented`. This queue controls
integration order only; it never authorizes deleting a module packet or its reference audit.
The larger closed-loop ownership map is `product.md`. It is an
architecture/parallelism map, not a second roadmap: SYS-01 is the first integration owner because it
**owns integration of** the shared action, identity, permission, prompt, runtime, Git/PR, artifact
and job seams — contracts are extracted with their first real callers, never pre-frozen (G2/D6);
after baseline exit, other suites may build typed preview adapters in disjoint paths, but cannot ship a
competing authority before SYS-01's contract is real.

This is the complete default **development order**, not a near/mid/far-term forecast. Every
registered product domain must resolve to one row below. A conditional row is still executed when
its turn arrives: it either lands the smallest proven Craft extension or records `NO_GAP` with the
task evidence that makes implementation unnecessary. It cannot be left as an unowned “someday”.

### Status vocabulary for releases

- **ACTIVE** — the single release currently being integrated (a WIP limit, not a time phase).
  Exactly one release is ACTIVE at a time.
- **READY** — dependencies met; can be activated by finishing the ACTIVE one or by owner request.
- **DEP** — waiting on a named dependency edge (listed in its row).
- **GATED** — waiting on a named non-time gate (a benchmark, a real caller, a measured failure).
- **CLOSED** — the release contract was completed, replaced, or closed as `NO_GAP`; it is not in the
  executable queue. The row states which case applies.

These standing tracks support the queue. During baseline rectification they permit read-only
research, documentation reconciliation and measurement only; they do not authorize new rendered
features, preview implementations or capability scaffolding before the R0 baseline exit:

- **Frontend track (Decision G6):** any page batch from
  [`capabilities.md`](docs/capabilities.md#page-structure) §3 may be spec'd, mocked behind a typed
  adapter, and built preview-gated after baseline exit, reported honestly as `display-only` until wired.
- **Coverage track (Decision G5):** matrix and page-architecture rows are updated continuously;
  source research may continue during R0; implementation follows its baseline exit unless a later
  explicit owner instruction revises that order.
- **Token-economy track (Decisions E12/E13):** TE1 may run beside R0 only as observation work
  ([`modules/context.md`](docs/modules/context.md#release-contract--te1-cache-alignment); the former accounting core is absent after the
  v0.13.4 rebuild). After R0 + TE1 establish a trustworthy current-profile baseline, prompt diet,
  centralized effective tool projection and Pi-light may enter only as one owner-accepted bounded
  slice that changes model-call behavior. R3 then becomes the fixed cross-domain trace. ArtifactRef
  and TaskBrief savings still land with R5/R6; L3+ remain measured gates
  (`modules/context.md` §6).

### Baseline first, then the Component/panel foundation

The owner's current order is **finish documentation/preparation → jointly inspect original Craft
→ approve concrete corrections → correct and accept the baseline → build the Component/panel host
→ add domain Components**. R0 is currently in its preparation substep; it does not authorize app
patches before the joint review. Desktop scope is Windows/macOS/Linux; the later phone connector
extends R14/EXEC-09, with transport and mobile implementation still subject to source/proof review.
This supersedes the earlier exception permitting
host implementation after only scoped baseline checks. The single baseline exit, including
inherited-capability dispositions and required R1/R2 corrections, is in
[`modules/baseline.md`](docs/modules/baseline.md). R0 remains ACTIVE until that exit is met.
Neither upstream equivalence, green tests nor a partial bootstrap opens the feature gate.

After that exit, [`modules/components.md`](docs/modules/components.md#release-contract--r18-component-and-panel-foundation) owns the early
R15/R18 host slice: mounted Files + a real Notes consumer → registry → in-window
resize/move/reorder/float/restore → global/Workspace local Component activation → domain Components.
It still needs no blanket R4/R5/R6/R9 prerequisite. R15 distribution and R18 native multi-window
closure follow with their own evidence. The host remains `not implemented` until its real
consumers and lifecycle are connected.

The v0.13.4 rebuild is current reality; `snapshot/pre-rebuild-2026-09-21` is selective reference and
recovery evidence, not a restore program. A test Project name never selects the baseline or
justifies changing live user records.

### The integration queue

| # | Release | Outcome (one line) | State | Dependency / gate |
|---|---|---|---|---|
| R0 | **Craft v0.13.4 baseline stabilization** | Classify inherited Craft capabilities, complete agreed R1/R2 corrections, remove absorbed obsolete material and accept a verified baseline before feature additions. | **ACTIVE** — current code, gate coverage and product independence require fresh evidence; upstream equivalence is not Fleet acceptance. | — |
| R1 | **Workspaces, one sidebar, contextual tools and composer** | Visible Workspaces with Project memberships; one Session authority and one create flow; zh-Hans. Board is its own entry over the same Session/Task data, never a second store. | **Owner-authorized slice** — R1 single sidebar, separate Board, contextual right panel, ZCode composer/Plan-permission controls and Cindy model popup have a source-backed contract; implementation status is `not implemented` after rollback. Workspaces and scoped Projects stay distinct. | Required corrections execute inside R0; additive R1 capabilities remain after baseline exit |
| R2 | **Independence** | No silent Craft-operated service dependencies (P8): updater, hosted sharing, docs links, OAuth relays, branding — local / user-configured / honestly disabled. | **DEP** — original hosted defaults were restored; Fleet export/help/relay/update/publication/telemetry corrections are not implemented. Prepare and jointly review each service slice before changes. No Fleet release before this boundary closes. | Required independence corrections execute inside R0; closure evidence is shared, never circular |
| R3 | **First production chain** | One real chain in one Project: intent → research/evidence → Markdown deliverable → review → accepted output → delivery. Existing Craft capability + minimal glue. | **DEP** | R0 + R2 |
| R4 | **Action seam** | Caller-aware governed action contract extracted from ≥2 real dual-caller mutations (labels + R3 acceptance). | DEP | R3 (supplies the second caller) |
| R5 | **Artifact handoff** | ArtifactRef v1: exact version + provenance; one real producer→consumer pair; stale-writer rejection. | DEP | R3 (supplies the real artifact + friction list) |
| R6 | **Bounded delegation + contract gates** | TaskBrief → child run → validated RunReport over Craft TaskRunner; budget circuit-breaker; first mechanized TaskContract gates in PreToolUse. | **DEP** — the earlier candidate kernel and `DelegationStrip` were discarded in the rebase; current child-Session/TaskRunner mechanisms are only a starting point. | R4 + R5 |
| R7 | **Infinite canvas (production surface)** | One surface: generate, edit and lay out images, video, websites and decks. A person and an agent edit the same board. This is not a Session-graph projection or playground page. | **DEP** — the slice owns the minimum registered-pane host seam it needs; it does not wait for generalized docking. | R4 + R5 |
| R8 | **Workflow extraction** | Promote the completed R3 chain into one finite versioned DAG over governed Craft actions and TaskRunner state. | DEP | R4 + R5 |
| R9 | **Layered agent memory** | Working notes → autonomous distillation into curated layers with a logged consolidation pass; optional human curation (pin/correct/delete); hard secrecy/scope floors (D5). | **GATED** — design principles remain; the earlier memory contract files were discarded and no store, index or consolidation pass exists. | gate: repeated completed R3 chains exist |
| R10 | **Documents, design + web authoring** | Direct native-format document editing/save/reopen plus native design and versioned web edit/preview/export through one owner per artifact. R3 preview does not satisfy document editing; advanced deck/motion stays R13. | DEP | R4 + R5 + R7 |
| R11 | **Job spine + image generation** | Extract one cancellable Job lifecycle from a real image-generation producer→consumer loop; record provenance and cost in existing authorities. | DEP | R4 + R5 |
| R12 | **Video + audio production** | Import media, edit a sequence, maintain captions/audio provenance, render with cancel/retry, and deliver an exact output version. | DEP | R11 |
| R13 | **Deck and motion (on the canvas)** | Decks and motion live on the R7 canvas. **3D scene authoring, panorama relighting and multi-camera shot grids are out of product** ([`product.md`](docs/product.md)) — close those as `NO_GAP`, do not design them. | DEP | R7 + R10 native document owner + R11 render Job; R12 only for consumed video operations. |
| R14 | **Remote office, phone connector + messaging** | User-owned remote target, later Orca-like phone client, worktree/Git/PR delivery, scoped grants and Workspace-scoped message routing with honest disconnect/recovery. | DEP | R6 |
| R15 | **Component distribution and lifecycle closure** | Local-first catalogs, provenance/permission review, staged install, update/rollback and revoke over the early scoped Component host. | **DEP** for external distribution; minimum registry, scoped activation and layout execute first under the owner-directed foundation contract above. | Foundation host + relevant R2 independence + supply-chain/permission evidence. R6/R9 apply only to components that consume delegation/memory. |
| R16 | **Specified local-app Computer Use Component** | Optional control of selected app/window for interface development and office work; structured API first, fresh observation, scoped host permission and user takeover. General Core control and a second sandbox remain excluded. | **DEP** — execute SYS-02 / EXEC-15 helper comparison first; production binary/signing admission remains required. | R0 exit + Component foundation; no blanket memory/remote-service prerequisite. |
| R17 | **Adaptive model/organization policy** | Use accumulated accepted-outcome traces to either add explainable overrideable routing/organization on Craft Task/Session/provider seams or close `NO_GAP`. | DEP | R6 + R9 + R12 |
| R18 | **Advanced and native multi-window layout closure** | Verify popout/re-dock, cross-window identity/security and additional layout needs beyond the early in-window foundation. | **GATED** for this later closure; requested in-window resize/move/reorder/float/restore is in the foundation, not blocked here. Current production host remains `PanelStackContainer`. | Foundation with real existing panels + explicit packaged-window/protocol and recovery evidence. No dependency back from the minimum host. |

#### R0 acceptance summary

R0 closes only at the canonical baseline exit in
[`modules/baseline.md`](docs/modules/baseline.md): inherited capabilities have dispositions,
agreed corrections and independence boundaries are verified, obsolete material is absorbed and
removed, the integrated gate and required smokes pass, and changed visible baseline surfaces have
owner acceptance. A tag or clean tree is not an acceptance criterion. Remaining additive R1 work
must not be mistaken for required baseline rectification.

Specs: [`modules/baseline.md`](docs/modules/baseline.md) ·
[`modules/shell.md`](docs/modules/shell.md) ·
[`modules/services.md`](docs/modules/services.md) ·
[`modules/workflow.md`](docs/modules/workflow.md#release-contract--r3-first-production-chain) ·
[`modules/agent-core.md`](docs/modules/agent-core.md#release-contract--r4-action-seam). A DEP/GATED release gets its full spec when
its dependency/gate is close (writing frozen detail earlier repeats the plans-outrun-code failure —
D6/G2); its *breadth* design already lives in the matrix and page architecture now.

Conditional capabilities such as interactive PTY, model routing, context projection and generalized
docking remain behind their named real-caller gates. A second OS sandbox and general external-
computer control are explicitly out of product and remain closed `NO_GAP`.

### Why this order (once)

- **R0 evidence starts from v0.13.4:** the September 21 rebuild replaced the mixed Fleet tree.
  The old uptake-before-tag discussion is superseded by that committed state. Source comparison,
  declared deltas and fresh full-gate evidence are required; no historical passing count applies.
  Upstream steering, context usage and composer viewport handling already exist and must not be
  hand-built again. The pre-rebuild snapshot is for selective review, not automatic restoration.
- **R0/R2 safety work cannot wait on itself:** R0-C2 retains its fail-closed acceptance bar.
  An inherited hosted default that blocks it is fixed as R0 work using the R2 independence
  contract; R2's DEP label governs release closure, not permission to postpone that fix. R2 then
  verifies the complete independence surface. Neither release can be claimed complete from the
  old branch's evidence.
- **R3 before R4 (this reverses the old loop order):** the seam contract itself requires extraction
  from real callers; R3 creates the second real caller while proving the product story end-to-end
  with capabilities Craft already ships.
- **Harness work does not reorder the product:** TE1 can observe during R0; a post-baseline
  Prompt/tool-profile slice is separately accepted because it changes model calls. It must finish or
  be explicitly waived before its profile is used for the R3 benchmark, but it does not become a new
  release or pull R4/R5/R6 forward.
- **R4→R5→R6:** the Fleet-differentiating spine, each step consuming a verified real input from the
  previous one.
- **R7 owns its minimum host seam:** a production canvas cannot depend on a generalized layout
  release whose need can only be proven by real surfaces. Reuse the owner-directed foundation
  rather than constructing another host; R18 closes advanced/native-window behavior later.
- **R16 has a bounded revised scope:** the owner's specified-local-app plugin request is carried
  by [SYS-02](docs/modules/remote.md#local-app-computer-use-contract) and EXEC-15.
  It starts with a helper/target/permission proof after the baseline and host. Its old whole-release
  `NO_GAP` label is superseded; the universal controller and second sandbox exclusions survive.

### Suite-level parallelism

The release queue and suite map intersect at explicit seams. Build permissions in this table apply
after the baseline exit; during R0 only its corrections, audits and measurements execute:

| Suite | First usable integration point | Can research/build in parallel | Must wait before shipping |
|---|---|---|---|
| SYS-01 Agent operating system/governance | R1/R2 → R4/R6 action and run contracts | — (integration owner) | all shared contract changes are reviewed here |
| SYS-02 Remote engineering office | R14 remote/Git/message loop | reference audits and isolated-target fixtures | R6 run contract |
| SYS-03 Token/memory/skill economy | TE1/R3 measurement → R9 memory → R17 policy closure | baseline measurements and optimizer experiments | the current Craft prompt/permission/UsageTracker seams; ContextPack only if its gate lands |
| SYS-04 Browser/evidence | R3 browser evidence path | capture fixtures and denied/offline tests after baseline exit | existing permission/file/evidence paths for R3; R5 only for the later ArtifactRef handoff |
| SYS-05 Design/web/spatial | R7 canvas → R10 documents/design/web → R13 deck/motion → R18 layout closure | preview-gated component experiments and renderer spikes | R4 action + R5 ArtifactRef; minimum pane seam lands with first real surface |
| SYS-06 AIGC/media | R11 image Job → R12 video/audio → R13 deck/spatial media | media fixtures and reference audits | R4 action + R5 ArtifactRef |
| SYS-07 Workflow/delivery | R4/R5 real chains → R8 | schema experiments only | real promoted chain and SYS-01 TaskRunner projection |
| SYS-08 Marketplaces | early R15/R18 foundation → R15 distribution | scoped local host proof and manifest/reference audits | verified host + existing permission/trust + R2 independence for distribution; R6/R9 only for specific dependent components |
| SYS-09 Workspace compositions | early R15/R18 foundation | mounted Files + Notes RPC consumer and scoped settings proof | completed R0 baseline exit, one effective resolver, lifecycle and in-window layout recovery |

### How to change this roadmap

An owner request can reorder or activate anything: update the table, add one line to the log,
adjust the affected spec's status header. Agents propose reorders with evidence at an owner
checkpoint; they do not reorder on their own.

Current order revision: 2026-09-21 — the owner requires inherited Craft rectification before
feature additions and deletion of obsolete project material after absorption. Earlier release
reorders and discarded execution programs are recoverable in Git; current product decisions live
in `decisions.md`, not a second historical queue here.

## Slice procedure

[`TODO.md`](#release-ladder) owns development order. This file names the current owner-authorized
slice, not another roadmap or progress archive.

### Active contract

**R1 shell/context rectification, explicitly authorized by the owner on 2026-09-22.** This bounded
slice overrides the previous preparation-only stop; R0 remains the overall baseline release gate.

- **Objective:** one left Conversation/Project sidebar, independent Board, contextual right panel,
  ZCode-informed composer/layout and Plan/permission interaction, separate model/reasoning controls
  with Cindy's model popup, preserved Workspace boundaries.
- **Sources:** current Craft v0.13.4 and matching pin; Cindy sidebar, `RightSidebarShell`, `TabBar`,
  registry/store and draft creation; ZCode `ConversationTimeline`/`SessionPane`/`ConversationComposer`;
  ZCode mode/toolbar/submission and permission-service paths; Cindy unified model-panel components.
  R1 records exact revisions, admitted behavior and current Craft gaps.
- **Constraints:** reuse Session/Project/Workspace/Permission owners and pinned dependencies;
  preserve records and files, do not import another shell/runtime or add unwired plugin controls.
- **Proof:** typecheck/build, route and Workspace/Project isolation regressions, then isolated
  desktop walkthrough of empty/normal/narrow layouts, tool navigation, project/model selection,
  and provider-parameter/Plan-permission/queue/restart regressions.
- **Next:** implement [R1](docs/modules/shell.md) and report actual verification limits.

### Preparation exit and joint walkthrough

The preparation exit in [R0](docs/modules/baseline.md#preparation-and-joint-review) requires current
facts, coherent contracts, concrete comparison evidence, a disposition for obsolete material and a
reproducible original-app launch plan. It is not the later implementation acceptance exit.

For slices outside the explicitly approved R1 scope, build and open original Craft for the requested joint
walkthrough after preparation. For R1, validate the changed application against the compared sources. First establish a review environment that cannot modify existing user credentials,
Sessions, files or installations; setting one profile variable is not isolation proof. Use original
source/build commands and their pinned dependencies, and inspect profile/network/update behavior
before launch. Explain any unexecutable platform or check; do not patch the app to disguise it.

Review startup, Project/context, Conversation/create, models/permissions, files/Pages, browser,
Skills/Sources, Tasks/automations, settings/remote and quit/recovery as complete flows. For each,
show current behavior → demonstrated defect/overlap → recommended change → retained capability
and data → affected backend → acceptance. Record the owner's decision in the canonical contract.
An available button, duplicate-looking list or old filename alone does not establish redundancy.

### After the approved correction slice

Implement only the approved slice across UI, RPC, state, failure/recovery, localization and cleanup.
Preserve exact user records; remove retired callers, handlers and dependencies only after proving
remaining consumers and recovery. Run appropriate checks and show the changed flow for acceptance.
Then proceed to the next approved slice. Do not use R0 or IMPLEMENT labels as blanket permission.

The later R0 baseline exit still precedes the Component/panel foundation and new domain features.
The existing [host contract](docs/modules/components.md#release-contract--r18-component-and-panel-foundation) retains Files/Notes consumers, scoped
activation and layout proof; its open engine/schema choices remain proposals. External distribution,
mobile connection and advanced native windows keep their own evidence and review boundaries.

### Obsolete material

Absorb unique current requirements/evidence, update incoming links and delete superseded project
files. Do not create dated reports, duplicate plans or replacement archive copies. Exact Git refs,
external source checkouts, generated reference guides and user records keep their distinct
retention decisions in R0 and the reference registry; a general cleanup is not blanket deletion.
