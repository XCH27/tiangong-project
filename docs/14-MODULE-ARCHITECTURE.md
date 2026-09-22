# 14 — Module architecture and compatibility gates

> This document prevents the core framework from making later-in-sequence large modules impossible to add.
> A module may be outside the active release and still requires a durable design boundary. “Not
> implemented” is a delivery status, not a deletion rule.

## 1. Document layers

| Layer | Location | Authority | Purpose |
|---|---|---|---|
| Core | `docs/core/` index + one canonical numbered document per topic | Core architecture/decisions | Stable Craft/Fleet authorities, invariants, shared seams, quality, roadmap |
| Module | `docs/modules/suites/` | Module design | Long-lived product, data, UI, runtime, failure and compatibility design for a large capability |
| Suite composition | `modules/REGISTRY.md` | Delivery grouping | Closed loops, shared-contract ownership, reference sets and conflict gates; never a state authority |
| Spec | `docs/specs/` | Active implementation contract | One bounded slice that is currently being built and accepted |
| Reference | `docs/references/<domain>/` | Reference audit | Source/product evidence, licenses, mechanisms absorbed, rejected alternatives |

Core navigation is indexed at [`core/README.md`](core/README.md). The nine closed-loop suites,
registry rows and release/acceptance anchors are linked by `modules/REGISTRY.md` and
`modules/PACKET-INDEX.md`; this document defines their compatibility requirements.

Do not delete a unique requirement merely because implementation is gated. Absorb it into its
canonical suite, then delete replaced or duplicate files; do not retain a second design home. Do not promote a reference into a
dependency merely because it appears in a module document. The core owns cross-module invariants;
the module owns its native domain model; the reference folder owns evidence about outsiders.

`NEW` never means a greenfield app or alternate platform. It names only the smallest native domain
state or adapter that Craft genuinely lacks after the capability map and current code are checked.
Every NEW module still enters through the Craft Electron shell, Workspace/Session/Task,
permission, timeline, files, settings, Sources/Skills and provider/runtime seams it needs. If a
proposal cannot name that Craft starting path, it is not ready even as a module packet.
Every module also has one explicit R0–R18 anchor in `modules/PACKET-INDEX.md`; module design depth
does not create a separate time horizon or permission to skip that ordered row.

## 2. Compatibility is a design gate, not a late integration task

Before a large module receives an implementation spec, its design must pass a compatibility review.
The review answers, with code paths and interfaces rather than slogans:

1. Which Craft/Fleet authority does the module reuse or extend?
2. Which state remains native to the module, and which state must remain in the core authority?
3. Which shared seams does it consume (Action, ArtifactRef, Job, Panel, Permission, Timeline)?
4. What happens when the module is absent, disabled, offline, denied, busy, or upgraded?
5. Can the module be added without changing the identity of Project/Workspace, Session, Task,
   Permission, Timeline, Settings, or file ownership?
6. Can it be removed without corrupting core data or leaving an orphaned authority?
7. What is the adapter and what is the implementation? Can the seam be tested with a mock?
8. What resource, licensing, platform, and performance constraints could block the core?
9. What is visible to the model for this task, and can the module contribute capability through the
   one effective projection without injecting its full manual/schema or creating a private loadout?
10. For built-in browsing or a specific outside-tool job, which existing structured route and
    permission boundary apply, and how is observation freshness checked? General external-computer
    control remains excluded by PRODUCT; adapter count does not reopen it.

The minimum output is a **Module boundary** section inside that loop's suite packet at `docs/modules/suites/SYS-NN-*.md` — one loop, one document — and a reference
record in `docs/references/<domain>/` before an implementation spec is written for the module.
The labels in [`modules/PACKET-INDEX.md`](modules/PACKET-INDEX.md) (`BREADTH_ONLY` /
`PACKET_DRAFT` / `READY_FOR_SPEC`) describe **documentation depth only** — they do not activate a
release or replace its acceptance criteria. The compatibility review above still applies before
implementation. A current owner request sets the scope (AGENTS authority order); acting on it
includes completing the necessary packet fields in the same effort, not waiting for a separate
documentation project or treating a depth label as permission to skip preparation.

## 3. Required module packet

### Executable next-step contract

Every registered capability has exactly one `### Execution <ID>` section in the packet linked by
`modules/PACKET-INDEX.md`. Read that section together with this common contract and the linked
release spec. Other suites may consume the capability but may not define a second execution owner.
The section contains these fields:

| Field | Required meaning |
|---|---|
| Next | `IMPLEMENT`, `PROVE`, or `CLOSED`; names the exact entry gate. These are next actions, not capability statuses. |
| Sources | Existing repository files to open first. Paths are checked by the documentation gate; proposed modules/tests must not masquerade as existing files. |
| Deliver | Ordered first vertical slice and its visible result; one scope, no new backlog. |
| Data | Inputs, outputs, identity/version and the sole persistence owner. New native domain data is distinguished from existing core truth. |
| Failure | Denial, conflict, cancellation, restart and removal/rollback behavior specific to that capability. |
| Proof | Observable passing and failing scenarios, the owning acceptance ID and a named future regression target. |
| Reference | Concrete comparison route; the registry separates current checkout/document intake from historical mechanism-review revisions, licenses, inspected symbols and import limitations. Resolve both before extraction; an updated HEAD does not revalidate an older finding. |

`IMPLEMENT` means the requirements support the named bounded slice once its gate opens; it does
not activate it now. `PROVE` means the next deliverable is an executable comparison/compatibility
fixture with a selection result, not an editor, placeholder page or dependency installation.
`CLOSED` requires a reason and preserves the valid retained path. No route means “ask the owner to
design it” or “research indefinitely.” Production dependency, authority and public-effect
checkpoints still apply after the safe preparation is concrete and reviewable.

For a `PROVE` route, use the named current path and at most two named alternatives. Freeze the
same input fixtures, supported platform and acceptance before comparison. Measure fidelity,
failure/recovery, resource behavior, integration surface and license/distribution obligations.
Pass means all hard criteria hold and at least one relevant improvement is demonstrated without
another hard regression; a tie keeps the existing path. Record the source lock, measured result
and selected/rejected mechanism in the existing reference record. If both fail, preserve the
fixture and name the smallest unmet requirement; do not invent a production dependency or keep
cycling through repositories. A restricted-license mechanism may inform a fresh implementation;
it is never a fallback code donor by default.

### Common implementation and verification contract

1. Resolve the capability's release row and dependencies, then the current spec. Existing R0/R1/R2
   correction specs apply immediately within R0; other routes wait for its exit. A missing later
   spec is filled from the execution section as the first task in that release, in its existing
   suite until a persisted/shared interface or behavior warrants a bounded spec. Do not pre-create
   eighteen empty release documents or resurrect removed contracts.
2. Trace renderer/tool → RPC → policy → owning service → persistence → event/result for both real
   callers. `Sources` are entry points, not permission to rewrite entire files. Diff both Craft
   pins for inherited behavior. Newly named records below are design fields until a real caller
   requires the shared type; do not scaffold all domain stores at once.
3. Identity is the existing Workspace/Session plus the native record ID. A consequential request
   has one stable operation ID and an attempt ID, an expected revision where concurrent writes are
   possible, and an explicit target. Retries retain operation identity; semantic revisions create
   new versions. Check permission and target freshness immediately before dispatch/commit.
4. UI and Agent adapters invoke the same domain operation. A renderer projects authoritative
   state and may keep a disposable draft; it cannot declare success before the owner acknowledges
   persistence. Async acknowledgements distinguish accepted/running/completed; a missing receipt
   is unknown/reconciling, never permission to repeat an external effect.
5. Every mounted surface uses existing Craft host/primitives and UI-SPEC. Cover empty, loading,
   ready, denied, unsupported, offline, stale/conflict, failed and recovery states that apply.
   Keyboard/focus, zh-Hans/en, narrow width and high-DPI behavior belong to the same slice. Restore
   the restored UI-contract guard before accepting rendered-value edits. No new navigation authority.
6. Persist through the native owner with validation, expected-version checks and its atomic write
   mechanism. Preserve unreadable bytes and unknown newer schema versions. Stage migrations with
   a recoverable original; on failure keep the prior reader and data. Disabling/uninstalling a
   feature removes availability and owned resources, not user artifacts or historical evidence.
7. Add the named behavior regression beside the implementation. New test targets are planned,
   not evidence that a test already exists. Run from `app/` with `bun test <relative-test-path>`;
   config-mutating tests get a disposable `CRAFT_CONFIG_DIR` before process startup as required by
   `09-QUALITY.md`. Native/binary/UI probes additionally execute the real process, save/reopen or
   renderer loop: passing parser tests cannot replace that evidence. Run relevant package types,
   i18n/UI gates, then the repository gate at integration. Do not run billable provider calls or
   external publishing as an unannounced test.
8. Record actual commands/results in the task or commit, update the existing contract/status,
   and remove absorbed draft sections. Stop when the bounded acceptance passes. Roll back only
   this slice's edits/activation; preserve later user changes and every source artifact. No new
   status diary, archive copy or “optimization” loop.

These fields make the **next step executable**. They do not certify an unrun benchmark, a complete
module, or a license admission. `READY_FOR_SPEC` may describe a fully specified implementation
slice; a pending mechanism comparison remains `PACKET_DRAFT` even when its proof is ready to run.

Every large module keeps these sections, even while `not implemented`:

- product scope and non-goals;
- user workflows and page/surface inventory;
- native domain model and invariants;
- core authorities consumed and never duplicated;
- UI/renderer boundary and panel behavior;
- Agent actions and human actions using the same governed seam;
- artifact, job, permission, timeline, recovery and provenance behavior;
- reference projects, exact mechanisms, license status and rejected alternatives;
- compatibility matrix and dependency gates;
- resource/performance/accessibility/offline constraints;
- acceptance scenarios and honest implementation status.

The required packet fields are listed above; the compatibility record below is the reusable format.
Until a packet contains actual code paths, reference files/commits and observable acceptance IDs,
its packet state must remain `BREADTH_ONLY` or `PACKET_DRAFT`; `covered` is retired terminology.

## 4. Compatibility record template

```text
Module:
Owner authority:
Craft capability row: REUSE | EXTEND | NEW
Core authorities consumed:
Native module authority:
Adapter seam:
Persisted identifiers:
Failure/offline/denied behavior:
Removal and migration behavior:
Performance/resource budget:
License/platform constraints:
References consumed:
Rejected alternatives:
Packet state: `BREADTH_ONLY` | `PACKET_DRAFT` | `READY_FOR_SPEC`
Spec/release anchor and lifecycle: <link; owned by spec + roadmap, not packet state>
Implementation status: `usable` | `wired but not visually checked` | `display-only` | `not implemented`
```

Packet state describes the completeness of a module packet; it is not a user-facing capability
status. `usable`/`wired but not visually checked`/
`display-only`/`not implemented` are the only implementation statuses (see `../AGENTS.md`
and [`10-GLOSSARY.md`](10-GLOSSARY.md)). `ACTIVE`, `READY`, `DEP`, and `GATED` belong only to
roadmap releases. A packet may be `READY_FOR_SPEC` while its implementation remains `not implemented`.

## 5. Initial deep-packet registry

The complete breadth list is [`modules/REGISTRY.md`](modules/REGISTRY.md). The smaller list below
identifies modules that already have a starter deep packet in `modules/`; it is not a complete
product list.

The registry is intentionally flat for omission checking, not as a dependency graph between every inventory row. Before
implementation, use its context/kind in `modules/PACKET-INDEX.md`: core system, product module,
surface, adapter/connector or capability.

The following modules remain in product coverage even when their implementation is gated. Their
table status is implementation status; packet readiness is recorded in each suite packet under `docs/modules/suites/`.

| Module | Design home | Current implementation status | Development order / compatibility gate |
|---|---|---|---|
| Canvas/spatial orchestration | `modules/suites/SYS-05-design-spatial.md` | not implemented | R7; renderer benchmark; projection must not own domain truth |
| Video/media editing | `modules/suites/SYS-06-media-production.md` | not implemented | R12; timeline model, media jobs, renderer/export and ArtifactRef seam |
| Browser automation/evidence | `modules/suites/SYS-04-browser-evidence.md` | Craft BrowserPane baseline `wired but not visually checked`; Fleet capture/evidence `not implemented` | R3 existing evidence; R5 versioned handoff; permission and download boundaries; no R16 general-control layer |
| Token/context economy | `modules/suites/SYS-03-context-economy.md` | not implemented | TE1/R3 measurement; R15 loadout; R17 policy closure; no projection store before two consumers |
| Reviewed memory | `modules/suites/SYS-03-context-economy.md` | not implemented | R9 proposal/review/retrieval/deletion; raw Session history remains evidence authority |
| AIGC jobs/rendering | `modules/suites/SYS-06-media-production.md` | not implemented | R11–R13; cancellation, resource limits and provider adapters |
| Design surface | `modules/suites/SYS-05-design-spatial.md` | not implemented | R10; transactional native design model and license gate |
| Deck/motion | `modules/suites/SYS-06-media-production.md` | not implemented | R13; native document authority and honest export fidelity |
| Workflow composition | `modules/suites/SYS-07-workflow-delivery.md` | not implemented | R8; governed actions, immutable DAG and run projection |
| Workbench/panels | `modules/suites/SYS-09-workspace-compositions.md` | fixed sizing `wired but not visually checked`; registered/movable host `not implemented` | after R0 baseline exit: early R15/R18 foundation with mounted Files + Notes RPC/consumer; R18 advanced/native-window closure follows |
| Component host/composition and distribution | `modules/suites/SYS-09-workspace-compositions.md` + `SYS-08-marketplaces.md` | not implemented | after R0 baseline exit: local/scoped host before domain Components; R15 distribution follows trust/permission proof; no blanket R6/R9 prerequisite |

## 6. Relationship to the roadmap

`docs/05-ROADMAP.md` controls integration order only. It does not justify losing a unique product requirement. Superseded or duplicate packets must
be absorbed and deleted under PRODUCT's document-retirement rule. A packet can be `READY_FOR_SPEC` while its implementation is `not implemented` or
dependency-blocked; when its R0–R18 row becomes ACTIVE, a focused file in `docs/specs/` activates
only that bounded slice.
