# 14 — Module architecture and compatibility gates

> This document prevents the core framework from making later-in-sequence large modules impossible to add.
> A module may be outside the active release and still requires a durable design boundary. “Not
> implemented” is a delivery status, not a deletion rule.

## 1. Four document layers

| Layer | Location | Authority | Purpose |
|---|---|---|---|
| Core | `docs/core/` index + one canonical numbered document per topic | Core architecture/decisions | Stable Craft/Fleet authorities, invariants, shared seams, quality, roadmap |
| Module | `docs/modules/<module>/` | Module design | Long-lived product, data, UI, runtime, failure and compatibility design for a large capability |
| Suite composition | `modules/REGISTRY.md` | Delivery grouping | Closed loops, shared-contract ownership, reference sets and conflict gates; never a state authority |
| Spec | `docs/specs/` | Active implementation contract | One bounded slice that is currently being built and accepted |
| Reference | `docs/references/<domain>/` | Reference audit | Source/product evidence, licenses, mechanisms absorbed, rejected alternatives |

Core navigation is indexed at [`core/README.md`](core/README.md). The eight implementation
contexts and legacy migration map are indexed at `modules/CONTEXTS.md` and
`modules/MIGRATION-MAP.md`.
The eight large closed-loop suites, their shared contract ownership and permitted parallel work are
defined in `modules/REGISTRY.md`; this document supplies the packet gates
inside those suites.

Do not delete module design because its implementation is gated. Do not promote a reference into a
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
10. If the module touches an external computer/environment, which existing Craft native or
    structured route is used first, how are live grant and observation freshness enforced, and what
    second real adapter would justify any proposed generic environment interface?

The minimum output is a **Module boundary** section inside that loop's suite packet at `docs/modules/suites/SYS-NN-*.md` — one loop, one document — and a reference
record in `docs/references/<domain>/` before an implementation spec is written for the module.
The labels in [`modules/PACKET-INDEX.md`](modules/PACKET-INDEX.md) (`BREADTH_ONLY` /
`PACKET_DRAFT` / `READY_FOR_SPEC`) describe **documentation depth only** — they are never work
permissions, readiness gates, or schedule states. A current owner request outranks them
(AGENTS authority order); acting on it simply means writing the missing depth first, in the
same effort.

## 3. Required module packet

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

The required executable packet format is `modules/MODULE-PACKET-TEMPLATE.md`.
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

The registry is intentionally flat for omission checking, not as a 68-way dependency graph. Before
implementation, classify each row using `modules/MODULE-TAXONOMY.md`
as core system, product module, surface, adapter/connector or capability.

The following modules remain in product coverage even when their implementation is gated. Their
table status is implementation status; packet readiness is recorded in each suite packet under `docs/modules/suites/`.

| Module | Design home | Current implementation status | Development order / compatibility gate |
|---|---|---|---|
| Canvas/spatial orchestration | `modules/canvas/` | not implemented | R7; renderer benchmark; projection must not own domain truth |
| Video/media editing | `modules/video/` | not implemented | R12; timeline model, media jobs, renderer/export and ArtifactRef seam |
| Browser automation/evidence | `modules/browser/` | Craft BrowserPane baseline `usable`; Fleet capture/evidence `not implemented` | R3/R5 evidence; R16 computer fallback; permission and download boundaries |
| Token/context economy | `modules/suites/SYS-03-context-economy.md` | not implemented | TE1/R3 measurement; R15 loadout; R17 policy closure; no projection store before two consumers |
| Reviewed memory | `modules/memory/` | not implemented | R9 proposal/review/retrieval/deletion; raw Session history remains evidence authority |
| AIGC jobs/rendering | `modules/jobs/` | not implemented | R11–R13; cancellation, resource limits and provider adapters |
| Design surface | `modules/design/` | not implemented | R10; transactional native design model and license gate |
| Deck/motion | `modules/deck-motion/` | not implemented | R13; native document authority and honest export fidelity |
| Workflow composition | `modules/workflows/` | not implemented | R8; governed actions, immutable DAG and run projection |
| Workbench/panels | `modules/workbench/` | fixed sizing `wired but not visually checked`; registered/movable host `not implemented` | early R15/R18 foundation with existing Files/Notes; R18 advanced/native-window closure follows |
| Component host/composition and distribution | `modules/suites/SYS-09-workspace-compositions.md` + `SYS-08-marketplaces.md` | not implemented | early local/scoped host before domain Components; R15 distribution follows trust/permission proof; no blanket R6/R9 prerequisite |

## 6. Relationship to the roadmap

`docs/05-ROADMAP.md` controls integration order only. It must not be used to delete or shrink a
module packet. A packet can be `READY_FOR_SPEC` while its implementation is `not implemented` or
dependency-blocked; when its R0–R18 row becomes ACTIVE, a focused file in `docs/specs/` activates
only that bounded slice.
