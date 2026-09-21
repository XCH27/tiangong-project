# 05 — Roadmap: integration order

> **This document answers "what integrates next?" — and only that.** It is a dependency-ordered
> integration queue, not a calendar and not a scope cut: **design coverage is never sequenced**
> (Decision G5 — every product domain stays registered and described at breadth in
> [`11-PRODUCT-MATRIX.md`](11-PRODUCT-MATRIX.md) and
> [`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md) regardless of order here). Dependency logic:
> [`04-ARCHITECTURE.md`](04-ARCHITECTURE.md) §2. The owner may reorder or activate anything at any
> time (G2); record the change in the log below.

Large capabilities remain designed in [`14-MODULE-ARCHITECTURE.md`](14-MODULE-ARCHITECTURE.md) and
`modules/` even when their implementation is `GATED` or `not implemented`. This queue controls
integration order only; it never authorizes deleting a module packet or its reference audit.
The larger closed-loop ownership map is `modules/REGISTRY.md`. It is an
architecture/parallelism map, not a second roadmap: SYS-01 is the first integration owner because it
**owns integration of** the shared action, identity, permission, prompt, runtime, Git/PR, artifact
and job seams — contracts are extracted with their first real callers, never pre-frozen (G2/D6);
the other suites may research or build typed preview adapters in disjoint paths, but cannot ship a
competing authority before SYS-01's contract is real.

This is the complete default **development order**, not a near/mid/far-term forecast. Every
registered product domain must resolve to one row below. A conditional row is still executed when
its turn arrives: it either lands the smallest proven Craft extension or records `NO_GAP` with the
task evidence that makes implementation unnecessary. It cannot be left as an unowned “someday”.

## Status vocabulary for releases

- **ACTIVE** — the single release currently being integrated (a WIP limit, not a time phase).
  Exactly one release is ACTIVE at a time.
- **READY** — dependencies met; can be activated by finishing the ACTIVE one or by owner request.
- **DEP** — waiting on a named dependency edge (listed in its row).
- **GATED** — waiting on a named non-time gate (a benchmark, a real caller, a measured failure).
- **CLOSED** — the release contract was completed, replaced, or closed as `NO_GAP`; it is not in the
  executable queue. The row states which case applies.

Two standing tracks run **beside** the release queue and are never blocked by it:

- **Frontend track (Decision G6):** any page batch from
  [`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md) §3 may be spec'd, mocked behind a typed
  adapter, and built preview-gated at any time, reported honestly as `display-only` until wired.
- **Coverage track (Decision G5):** matrix and page-architecture rows are updated continuously;
  owner-directed early work on any domain is always allowed, recording its unresolved edges.
- **Token-economy track (Decisions E12/E13):** TE1 may run beside R0 only as observation work
  ([`specs/TE1-cache-alignment.md`](specs/TE1-cache-alignment.md); accounting core exists in the
  current R0 tree). After R0 + TE1 establish a trustworthy current-profile baseline, prompt diet,
  centralized effective tool projection and Pi-light may enter only as one owner-accepted bounded
  slice that changes model-call behavior. R3 then becomes the fixed cross-domain trace. ArtifactRef
  and TaskBrief savings still land with R5/R6; L3+ remain measured gates
  (`modules/suites/SYS-03-context-economy.md` §6).

## Owner-directed foundation-first slice

The owner's 2026-09-14 request to build the basic framework before domain Components, including
freely movable/resizable panels, takes precedence over the old blanket R15/R18 gates. The current
execution contract is [`specs/R18-right-workbench.md`](specs/R18-right-workbench.md), revised
2026-09-15. It covers the **early host portion of R15/R18**, not an additional release:

scoped baseline + P6 context isolation → real registry using existing Files/Notes → in-window
resize/move/reorder/float/restore → global/Workspace local Component proof → domain Components.

R0 remains ACTIVE for complete baseline verification. The foundation can proceed through the
scoped checks above without waiting for R6 delegation or R9 memory; its status remains
`not implemented` until the host and runtime are actually connected. R15 distribution and R18
advanced/native multi-window closure remain separate follow-ons. A dependency used by one future
Component is not a prerequisite for every Component. Do not demand new media panels before creating
the minimum host which their existing Files/Notes predecessors already exercise.

The current dirty checkout is an audit candidate, not a keep-all decision. An exact rollback target
and recovery plan still require owner approval; user/test Project names do not select the baseline.

## The integration queue

| # | Release | Outcome (one line) | State | Dependency / gate |
|---|---|---|---|---|
| R0 | **Craft v0.13.3 baseline stabilization** | Audit the current dirty tree, retain/fix/drop each behavior, close security and recovery gaps, calibrate every status, and prove one runnable v0.13.3 baseline. | **ACTIVE** — no clean-tree, tag, green-build or visual-acceptance claim exists until fresh R0 evidence proves it. | — |
| R1 | **One Session list + language** | Preserve one Session authority and one create flow; Project=folder wording and zh-Hans. Board may be a separate navigator only as a projection of existing Session/Task state. | **PARTIAL — do not read this as done.** The restore-v0.10.5-shell program was replaced and those checks moved to R0; that is what closed. **P6's one word and one switcher did not.** Measured 2026-09-13: 62 zh-Hans UI strings still say 工作区 beside 50 saying 项目; the top bar switches Workspace while the sidebar row literally named 项目 only *filters* the session list (`handleJumpToProjectSessions`) — so the control named Project is not the Project boundary. Owner intent is OV-008 and Decision P6. | — |
| R2 | **Independence** | No silent Craft-operated service dependencies (P8): updater, hosted sharing, docs links, OAuth relays, branding — local / user-configured / honestly disabled. | **DEP** — current v0.13.3 inherited-service paths must first be inventoried by R0; prior branch status is not evidence for this tree. | R0 |
| R3 | **First production chain** | One real chain in one Project: intent → research/evidence → Markdown deliverable → review → accepted output → delivery. Existing Craft capability + minimal glue. | **DEP** | R0 + R2 |
| R4 | **Action seam** | Caller-aware governed action contract extracted from ≥2 real dual-caller mutations (labels + R3 acceptance). | DEP | R3 (supplies the second caller) |
| R5 | **Artifact handoff** | ArtifactRef v1: exact version + provenance; one real producer→consumer pair; stale-writer rejection. | DEP | R3 (supplies the real artifact + friction list) |
| R6 | **Bounded delegation + contract gates** | TaskBrief → child run → validated RunReport over Craft TaskRunner; budget circuit-breaker; first mechanized TaskContract gates in PreToolUse. | **DEP** — the earlier candidate kernel and `DelegationStrip` were discarded in the rebase; current child-Session/TaskRunner mechanisms are only a starting point. | R4 + R5 |
| R7 | **Infinite canvas (production surface)** | One surface: generate, edit and lay out images, video, websites and decks. A person and an agent edit the same board. This is not a Session-graph projection or playground page. | **DEP** — the slice owns the minimum registered-pane host seam it needs; it does not wait for generalized docking. | R4 + R5 |
| R8 | **Workflow extraction** | Promote the completed R3 chain into one finite versioned DAG over governed Craft actions and TaskRunner state. | DEP | R4 + R5 |
| R9 | **Layered agent memory** | Working notes → autonomous distillation into curated layers with a logged consolidation pass; optional human curation (pin/correct/delete); hard secrecy/scope floors (D5). | **GATED** — design principles remain; the earlier memory contract files were discarded and no store, index or consolidation pass exists. | gate: repeated completed R3 chains exist |
| R10 | **Design + web authoring** | One native design document and one versioned web artifact edit/preview/export loop, both inside the Craft shell and ArtifactRef path. | DEP | R4 + R5 + R7 |
| R11 | **Job spine + image generation** | Extract one cancellable Job lifecycle from a real image-generation producer→consumer loop; record provenance and cost in existing authorities. | DEP | R4 + R5 |
| R12 | **Video + audio production** | Import media, edit a sequence, maintain captions/audio provenance, render with cancel/retry, and deliver an exact output version. | DEP | R11 |
| R13 | **Deck and motion (on the canvas)** | Decks and motion live on the R7 canvas. **3D scene authoring, panorama relighting and multi-camera shot grids are out of product** ([`PRODUCT.md`](PRODUCT.md)) — close those as `NO_GAP`, do not design them. | DEP | R7 |
| R14 | **Remote office + messaging** | User-owned remote target, worktree/Git/PR delivery, scoped grants and Workspace-scoped message routing with honest disconnect/recovery. | DEP | R6 |
| R15 | **Component distribution and lifecycle closure** | Local-first catalogs, provenance/permission review, staged install, update/rollback and revoke over the early scoped Component host. | **DEP** for external distribution; minimum registry, scoped activation and layout execute first under the owner-directed foundation contract above. | Foundation host + relevant R2 independence + supply-chain/permission evidence. R6/R9 apply only to components that consume delegation/memory. |
| R16 | **External computer environment** | General control of external applications is not a Fleet capability. Driving Blender/Godot for a specific job remains an outside-tool path. | **CLOSED — `NO_GAP`** by [`PRODUCT.md`](PRODUCT.md). It has no implementation queue or downstream dependency. | — |
| R17 | **Adaptive model/organization policy** | Use accumulated accepted-outcome traces to either add explainable overrideable routing/organization on Craft Task/Session/provider seams or close `NO_GAP`. | DEP | R6 + R9 + R12 |
| R18 | **Advanced and native multi-window layout closure** | Verify popout/re-dock, cross-window identity/security and additional layout needs beyond the early in-window foundation. | **GATED** for this later closure; requested in-window resize/move/reorder/float/restore is in the foundation, not blocked here. Current production host remains `PanelStackContainer`. | Foundation with real existing panels + explicit packaged-window/protocol and recovery evidence. No dependency back from the minimum host. |

### R0 acceptance summary

R0 is complete only when every fresh `git status --porcelain` entry is assigned to an explained
keep/fix/drop group; retained behavior has scoped security/recovery checks and honest capability
status; the integrated working tree passes `validate:dev` plus a non-interactive launch smoke; and
visible surfaces are either owner-accepted or remain `wired but not visually checked`. A tag and a
clean tree are not R0 criteria. See [`specs/R0-baseline-audit.md`](specs/R0-baseline-audit.md).

Specs: [`specs/R0-baseline-audit.md`](specs/R0-baseline-audit.md) ·
[`specs/R1-one-boundary-language.md`](specs/R1-one-boundary-language.md) ·
[`specs/R2-independence.md`](specs/R2-independence.md) ·
[`specs/R3-first-production-chain.md`](specs/R3-first-production-chain.md) ·
[`specs/R4-action-seam.md`](specs/R4-action-seam.md). A DEP/GATED release gets its full spec when
its dependency/gate is close (writing frozen detail earlier repeats the plans-outrun-code failure —
D6/G2); its *breadth* design already lives in the matrix and page architecture now.

Conditional capabilities such as interactive PTY, model routing, context projection and generalized
docking remain behind their named real-caller gates. A second OS sandbox and general external-
computer control are explicitly out of product and remain closed `NO_GAP`.

## Why this order (once)

- **R0 baseline discipline still applies:** the v0.13.3 tree is large and mixed; retained behavior
  needs fresh evidence. Scoped foundation work begins with the touched baseline and P6 checks;
  complete R0 verification is still required before a release claim.
- **R0 before the v0.13.4 uptake (2026-09-20):** upstream shipped v0.13.4 while this rebase was in
  flight, and it carries steering/mid-stream, context-window usage and the composer viewport rewrite
  as upstream code — see the P2 note in [`02-DECISIONS.md`](02-DECISIONS.md). Two consequences for
  ordering: (a) **do not hand-build those three**, take upstream's when we take the tag; (b) **do not
  take the tag before `fleet-baseline-r0`** — 41 of its 96 files are already dirty here, so rebasing
  an unproven tree makes every later regression unattributable.
- **R2 next:** the baseline must first expose every inherited hosted-service path. R2 then closes the
  remaining independence gaps rather than relying on results from the discarded branch.
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
- **R16 is not a future implementation choice:** its `NO_GAP` closure prevents general external-
  computer control and a second sandbox from silently returning through another release.

## Suite-level parallelism

The release queue and suite map intersect at explicit seams:

| Suite | First usable integration point | Can research/build in parallel | Must wait before shipping |
|---|---|---|---|
| SYS-01 Agent operating system/governance | R1/R2 → R4/R6 action and run contracts | — (integration owner) | all shared contract changes are reviewed here |
| SYS-02 Remote engineering office | R14 remote/Git/message loop | reference audits and isolated-target fixtures | R6 run contract |
| SYS-03 Token/memory/skill economy | TE1/R3 measurement → R9 memory → R17 policy closure | baseline measurements and optimizer experiments | the current Craft prompt/permission/UsageTracker seams; ContextPack only if its gate lands |
| SYS-04 Browser/evidence | R3 browser evidence path | capture fixtures and denied/offline tests | SYS-01 policy + ArtifactRef contract |
| SYS-05 Design/web/spatial | R7 canvas → R10 design/web → R13 deck/motion → R18 layout closure | preview-gated component experiments and renderer spikes | R4 action + R5 ArtifactRef; minimum pane seam lands with first real surface |
| SYS-06 AIGC/media | R11 image Job → R12 video/audio → R13 deck/spatial media | media fixtures and reference audits | R4 action + R5 ArtifactRef |
| SYS-07 Workflow/delivery | R4/R5 real chains → R8 | schema experiments only | real promoted chain and SYS-01 TaskRunner projection |
| SYS-08 Marketplaces | early R15/R18 foundation → R15 distribution | scoped local host proof and manifest/reference audits | verified host + existing permission/trust + R2 independence for distribution; R6/R9 only for specific dependent components |
| SYS-09 Workspace compositions | early R15/R18 foundation | existing Files/Notes registry and scoped settings proof | affected baseline/P6 isolation, one effective resolver, lifecycle and in-window layout recovery |

## How to change this roadmap

An owner request can reorder or activate anything: update the table, add one line to the log,
adjust the affected spec's status header. Agents propose reorders with evidence at an owner
checkpoint; they do not reorder on their own.

Change log:

- 2026-09-15 — reconcile the owner's foundation-first and panel-movement requests: the minimum
  Component registry, scoped activation and in-window layout execute before domain Components;
  remove R6/R9 as blanket host prerequisites. R0 retains baseline verification; R15 external
  distribution and R18 native/advanced layout remain distinct closures. Revised contract:
  `specs/R18-right-workbench.md`. No rollback or live-data rename is authorized by this ordering.
- 2026-09-11 — owner: stabilize the current Craft **v0.13.3** tree before expanding product scope.
  R0 is ACTIVE under its revised baseline contract; this does not revive the discarded v0.10.5
  restore/tag/Waves program. R15 returns to its dependency row. R14 continues to own remote
  Workspace transport and Git/GitHub delivery; R18 is a real-caller gate, not a shell-restyle task.
- 2026-09-10 — owner direction retained where still current: R7 is one production canvas, not a
  Session-graph projection; R13 keeps decks/motion on that canvas; R16 closes `NO_GAP` for general
  external-application control. The one-day R18/R15 activation was superseded by the stabilization
  decision above.
- 2026-07-16 — route created (replaced the loop-numbered completion order as sequencing authority).
- 2026-07-17 — time-flavored labels (NOW/NEXT/LATER, "parked") removed in favor of
  ACTIVE/READY/DEP/GATED; coverage split from sequencing (G5); frontend track added (G6);
  CONDITIONAL capabilities given explicit matrix rows + gates instead of a "parked" list.
- 2026-07-20 — harness research incorporated as Decision E13: TE1 observation separated from the
  post-baseline Prompt/tool-profile slice; R3→R4→R5→R6 order retained.
- 2026-07-20 — replaced open-ended post-R9/future-module wording with the complete R10–R18
  development order; conditional capabilities now require an implementation-or-`NO_GAP` closure.
- 2026-07-20 — D5 amended (owner direction): memory is agent-autonomous and layered; human
  review becomes optional curation. R9 outcome reworded; daily working notes are ordinary
  permissioned file writes and may begin alongside R3 chains without a new authority.
- 2026-07-20 — owner UI direction (superseded by the 2026-07-21 source/interaction correction): P6
  extended to the folder collapse + single switcher; P10 initially used a project-grouped task list; P9 gains the
  local/cloud location presets with agent-managed worktree isolation (never a user preset). R1
  scope extended accordingly.
- 2026-07-20 — owner priority: upstream-basics redesigns (merge/simplify/delete, task-first entry,
  single switcher) land first — R1 slice order fixed accordingly. C4 gains the branch presentation
  rule + landing ladder (diff read-only → apply/discard with R6 → PR with R14); branches are
  agent-managed, never a user surface. New T17/P-60 task-changes review surface registered.
- 2026-07-21 — owner source/interaction correction: v0.10.5 becomes the product and UI baseline;
  the v0.11.x line is selective update evidence only. P10 is narrowed to one Session-backed work list and
  one create flow; labels/archive/search become states of that list, Project home cannot duplicate
  it. The v0.11 Kanban Board code is retained as a right-panel projection; its product surface is
  `wired but not visually checked` pending owner walkthrough.
- 2026-07-25 — owner boundary review: the R0 landing branch converges Project=Workspace
  presentation on the R1 clause 1–3 contract (Projects and Conversations as sibling scopes over
  one Session list; the switcher lifted into the sidebar project list; the standalone
  `WorkspaceSwitcher` and `project-sidebar-navigation` modules retired). R1 itself stays READY
  until R0 tags a green baseline. `UI-SPEC.md` becomes the mandatory rendered-value authority in
  the AGENTS.md routing table.
- 2026-07-26 — R0 row state updated to landing complete (gates green; remaining: owner tag +
  walkthrough) and the parallel-dispatch frontier added to `WORK-ORDER.md` (`696542bc2`). Logged
  retroactively — the entry was missed in that commit.
- 2026-07-26 — remediation sync after the doc audit: R1/R2 rows annotated with their pre-landed
  slices (R1 shell `2d08364f7` + inventory `aaa09b094`; R2 C2–C5); README, PRODUCT,
  FEATURE-REGISTRY and the R0/R1/R2 spec status headers re-synced to this roadmap's R0 row as the
  single release-state edit point.
- 2026-07-26 — selective donor advanced to v0.11.2: reference mirror and official-docs mirror
  repinned/refreshed, the per-file intake ledger recorded, and bounded fix groups A+B landed in
  `26100e45d`; `create_task` and later product interaction remain excluded.
- 2026-07-26 — owner decisions G8/G9 fix New Task as the single create noun and restore Mark All
  Read in the current Session-list header menu. The 147-entry overlap audit becomes the R1
  execution map; wave 1, the seven-locale noun pass, and the non-visual registry-truth pass landed
  `wired but not visually checked`.
- 2026-08-15 — **R0 recurrence recorded.** A second unaudited working tree (385 paths) accumulated
  between 2026-07-31 and 2026-08-15 while R0 was still ACTIVE and untagged. No order change: R0
  remains ACTIVE and its acceptance is unchanged. The practice-vs-rule question left open in
  `WORK-ORDER.md` is closed in favour of the rule — from the `fleet-baseline-r0` tag onward,
  writers work on `work/<packet-id>` branches and only the integrator merges.
- 2026-08-15 — **owner-directed early slice: the R6 delegation-kernel domain layer.** Bounded
  delegation contracts landed ahead of R4/R5 rather than being extracted from real callers, which
  is the pre-freeze G2 and `04-ARCHITECTURE.md` §2 normally forbid. The code is kept, under two
  conditions recorded in the R6 row: the types remain **candidate** and may change shape without a
  deprecation cycle when R4/R5 land, and nothing in the kernel is reported above
  `wired but not visually checked`. Registered in `FEATURE-REGISTRY.md`.
- 2026-08-15 — **R3 acceptance convention landed ahead of the R3 row** (`acceptDeliverable` +
  `accept_deliverable`, registered in `SESSION_TOOL_DEFS`). It is a fixture, not R3: R3-C1..C8
  still require a real owner-run chain, as `specs/R3-first-production-chain.md` states.
