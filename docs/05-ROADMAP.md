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
The larger closed-loop ownership map is [`16-SYSTEM-SUITES.md`](16-SYSTEM-SUITES.md). It is an
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
  ([`17-TOKEN-ECONOMY.md`](17-TOKEN-ECONOMY.md) §6).

## The integration queue

| # | Release | Outcome (one line) | State | Dependency / gate |
|---|---|---|---|---|
| R0 | **Baseline audit** | The dirty working tree is audited feature-by-feature: land, fix, or drop; `main` green, tagged, runnable. | **ACTIVE** | — |
| R1 | **One boundary + task-first entry + language** | Project=folder single concept with one switcher, New-Task-first navigation with project-grouped task list, overlapping-control dedup, zh-Hans localization, identity-label presentation — finished and accepted. | READY (most code exists in the R0 tree) | R0 |
| R2 | **Independence** | No silent Craft-operated service dependencies (P8): updater, sharing, docs links, OAuth relays, branding — local / user-configured / honestly disabled. | READY | R0 |
| R3 | **First production chain** | One real chain in one Project: intent → research/evidence → Markdown deliverable → review → accepted output → delivery. Existing Craft capability + minimal glue. | DEP | R0 (R1/R2 improve it) |
| R4 | **Action seam** | Caller-aware governed action contract extracted from ≥2 real dual-caller mutations (labels + R3 acceptance). | DEP | R3 (supplies the second caller) |
| R5 | **Artifact handoff** | ArtifactRef v1: exact version + provenance; one real producer→consumer pair; stale-writer rejection. | DEP | R3 (supplies the real artifact + friction list) |
| R6 | **Bounded delegation + contract gates** | TaskBrief → child run → validated RunReport over Craft TaskRunner; budget circuit-breaker; first mechanized TaskContract gates in PreToolUse. | DEP | R4 (governed actions), R5 (referenced artifacts) |
| R7 | **Canvas v1 (projection only)** | DOM-family renderer per Decision E5a (React Flow default, custom DOM+SVG in-family fallback — the spike picks within the family, it does not reopen the family); canvas projects the real artifact/session graph per [`13-ORCHESTRATION.md`](13-ORCHESTRATION.md) §4. No executable edges. | GATED | gate: R5 artifact graph exists; E5a in-family spike passes before deep investment |
| R8 | **Workflow extraction** | Promote the completed R3 chain into one finite versioned DAG over governed Craft actions and TaskRunner state. | DEP | R4 + R5 |
| R9 | **Layered agent memory** | Working notes → autonomous distillation into curated layers with a logged consolidation pass; optional human curation (pin/correct/delete); hard secrecy/scope floors (D5). | GATED | gate: repeated completed chains from R3+ exist |
| R10 | **Design + web authoring** | One native design document and one versioned web artifact edit/preview/export loop, both inside the Craft shell and ArtifactRef path. | DEP | R4 + R5 + R7 |
| R11 | **Job spine + image generation** | Extract one cancellable Job lifecycle from a real image-generation producer→consumer loop; record provenance and cost in existing authorities. | DEP | R4 + R5 |
| R12 | **Video + audio production** | Import media, edit a sequence, maintain captions/audio provenance, render with cancel/retry, and deliver an exact output version. | DEP | R11 |
| R13 | **Deck, motion and spatial media** | Native deck/motion export plus 3D scene, panorama/relight and shot-grid manifests over the R11/R12 Job and Artifact seams. | DEP | R10 + R11 + R12 |
| R14 | **Remote office + messaging** | User-owned remote target, worktree/Git/PR delivery, scoped grants and Workspace-scoped message routing with honest disconnect/recovery. | DEP | R6 |
| R15 | **Skill/plugin/MCP marketplaces** | Local-first discovery, trust review, install/loadout/runtime separation, update/rollback and revoke through Craft settings, Skills/Sources and permission paths. | DEP | R6 + R9 |
| R16 | **External computer environment** | On one approved task, exhaust Craft-native BrowserPane/file/shell/API/remote routes; then either add the smallest accessibility/pixel fallback with live grant and stale-frame checks or close `NO_GAP`. | DEP | R14 |
| R17 | **Adaptive model/organization policy** | Use accumulated accepted-outcome traces to either add explainable overrideable routing/organization on Craft Task/Session/provider seams or close `NO_GAP`. | DEP | R6 + R9 + R12 |
| R18 | **Conditional shell/layout closure** | For interactive PTY, stronger OS sandbox and docking, run the named real-caller/risk/UI gates; implement only proven Craft extensions and close every unmet row as `NO_GAP`. | DEP | R10 + R12 + R16 |

### R0 acceptance summary

R0 is complete only when every fresh `git status --porcelain` entry is assigned to a verified
land/fix/drop group; each landed app group has scoped checks and honest capability status; the
integrated branch passes `validate:dev` plus a non-interactive launch smoke; and the owner accepts
the visible surfaces before the baseline tag is created. The full fixed contract and destructive
Git checkpoints remain in [`specs/R0-baseline-audit.md`](specs/R0-baseline-audit.md); this summary
does not replace it.

Specs: [`specs/R0-baseline-audit.md`](specs/R0-baseline-audit.md) ·
[`specs/R1-one-boundary-language.md`](specs/R1-one-boundary-language.md) ·
[`specs/R2-independence.md`](specs/R2-independence.md) ·
[`specs/R3-first-production-chain.md`](specs/R3-first-production-chain.md) ·
[`specs/R4-action-seam.md`](specs/R4-action-seam.md). A DEP/GATED release gets its full spec when
its dependency/gate is close (writing frozen detail earlier repeats the plans-outrun-code failure —
D6/G2); its *breadth* design already lives in the matrix and page architecture now.

CONDITIONAL capabilities (interactive PTY, OS sandbox, model routing/fusion, context projection,
docking layout) are **not** out of the product — each has a matrix row with a named gate; they enter
this queue when their gate fires.

## Why this order (once)

- **R0 first:** nothing is trustworthy while an unaudited dirty tree sits on one branch; every
  later claim depends on a green, tagged baseline.
- **R1/R2 next:** the dirty tree contains substantial candidate code for R1 and inherited service
  paths for R2, but neither percentage nor usability is assumed. R0 must classify each path as
  usable, wired but not visually checked, display-only, or not implemented before it is counted.
  This keeps near-done work valuable without turning file presence into a product claim.
- **R3 before R4 (this reverses the old loop order):** the seam contract itself requires extraction
  from real callers; R3 creates the second real caller while proving the product story end-to-end
  with capabilities Craft already ships.
- **Harness work does not reorder the product:** TE1 can observe during R0; a post-baseline
  Prompt/tool-profile slice is separately accepted because it changes model calls. It must finish or
  be explicitly waived before its profile is used for the R3 benchmark, but it does not become a new
  release or pull R4/R5/R6 forward.
- **R4→R5→R6:** the Fleet-differentiating spine, each step consuming a verified real input from the
  previous one.
- **R7–R18 are ordered, not deferred by time horizon:** their gates are objective (validation spike,
  real artifact graph, completed chains). Their design is already decided in depth where evidence
  allows — orchestration/canvas interaction design and technology choices live now in
  [`13-ORCHESTRATION.md`](13-ORCHESTRATION.md) and the matrix §G tech routes; the frontend track
  may build their preview-gated pages whenever the owner wants. When the queue reaches a conditional
  row, `NO_GAP` with evidence is a valid completion; silence or “later” is not.

## Suite-level parallelism

The release queue and suite map intersect at explicit seams:

| Suite | First usable integration point | Can research/build in parallel | Must wait before shipping |
|---|---|---|---|
| SYS-01 Agent operating system/governance | R1/R2 → R4/R6 action and run contracts | — (integration owner) | all shared contract changes are reviewed here |
| SYS-02 Remote engineering office | R14 remote/Git/message loop | reference audits and isolated-target fixtures | R6 run contract |
| SYS-03 Token/memory/skill economy | TE1/R3 measurement → R9 memory → R17 policy closure | baseline measurements and optimizer experiments | the current Craft prompt/permission/UsageTracker seams; ContextPack only if its gate lands |
| SYS-04 Browser/evidence | R3 browser evidence path | capture fixtures and denied/offline tests | SYS-01 policy + ArtifactRef contract |
| SYS-05 Design/web/spatial | R7 canvas → R10 design/web → R13 spatial media | preview-gated pages and renderer spikes | R4 action + R5 ArtifactRef; E5a benchmark |
| SYS-06 AIGC/media | R11 image Job → R12 video/audio → R13 deck/spatial media | media fixtures and reference audits | R4 action + R5 ArtifactRef |
| SYS-07 Workflow/delivery | R4/R5 real chains → R8 | schema experiments only | real promoted chain and SYS-01 TaskRunner projection |
| SYS-08 Marketplaces | R15 | manifest/reference audits | R6 policy/run + R9 reviewed experience/loadout facts |

## How to change this roadmap

An owner request can reorder or activate anything: update the table, add one line to the log,
adjust the affected spec's status header. Agents propose reorders with evidence at an owner
checkpoint; they do not reorder on their own.

Change log:

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
- 2026-07-20 — owner UI direction: P6 extended to the folder collapse + single switcher; new P10
  task-first command surface (New Task replaces new chat; project-grouped task list); P9 gains the
  local/cloud location presets with agent-managed worktree isolation (never a user preset). R1
  scope extended accordingly.
- 2026-07-20 — owner priority: upstream-basics redesigns (merge/simplify/delete, task-first entry,
  single switcher) land first — R1 slice order fixed accordingly. C4 gains the branch presentation
  rule + landing ladder (diff read-only → apply/discard with R6 → PR with R14); branches are
  agent-managed, never a user surface. New T17/P-60 task-changes review surface registered.
