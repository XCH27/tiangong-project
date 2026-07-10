# Module Specifications

Module files define **module** behaviour. Delivery order is **not** the M00–M19 number alone.

**Start with the numbered loop map:** [`docs/loops/README.md`](../loops/README.md).

A module spec is not a vision note, a list of desired components, or proof that implementation may
begin. Read `docs/DOCUMENT-READINESS.md` for documentation maturity and
`docs/WAVE-MODULE-MAP.md` for execution permission.

## 1. Required Metadata

Every active module spec begins with:

```markdown
> **Capability status:** `not implemented` | `display-only` |
> `wired but not visually checked` | `usable`
> **Execution gate:** Locked | Ready | In Progress | Blocked
> **Spec maturity:** concept | contract draft | execution-ready
> **Wave:** W# or explicit sub-wave
> **Owner:** role/module
> **Depends on:** exact modules and required maturity/status
```

These are independent axes. Do not invent informal alternatives such as “almost usable.”

## 2. Minimum Executable Spec Content

An `execution-ready` spec must answer all of the following without requiring a Worker to invent
product behaviour:

1. **Purpose and first closed loop** — real user outcome and complete happy/error path.
2. **Scope/non-goals** — explicit ownership boundary.
3. **State authority** — one owner for durable, native, derived, and view state.
4. **Field-level contracts** — inputs, outputs, IDs, versions, revisions, and schemas.
5. **Actions/callers** — human, Agent, and workflow use the same canonical operations.
6. **Permissions and side effects** — risk, approval, undo, cancellation, retry, evidence.
7. **Persistence/recovery** — restart, migration, idempotency, conflict, partial commit.
8. **UI contribution** — exact M16 surface/panel/inspector/canvas projection.
9. **Dependencies** — exact consumed/produced contracts and gate versions.
10. **Error table** — user-visible result and permitted recovery.
11. **Resource behaviour** — queue/back-pressure/cancellation/degradation where applicable.
12. **Verification** — steps covering UI, backend, state, permission, evidence, Agent parity, error,
    restart, and real rendered/runtime behaviour.
13. **Open gates** — anything unresolved keeps the spec below `execution-ready`.

## 3. Single-Source Rules

- Shared types/actions live in canonical contracts; a module may explain but not fork them.
- `IMPLEMENTATION.md` may record adapter constraints but cannot add product behaviour that is
  absent from `SPEC.md` or the module's canonical file.
- Generic SessionEvent kinds plus typed payloads are used; modules do not create parallel event
  catalogs.
- Capability manifests generate UI/Agent/workflow projections; do not hand-maintain three APIs.
- Panels/canvas cards are views; domain state stays with the owning module.
- Exact file paths enter an execution packet only after the current v0.11 baseline is inspected.

## 4. Modules by Delivery Loop

Stable module IDs (M00–M19) remain the filename keys. **Work order** follows loop IDs.

| Loop | Modules | Spec files |
|---|---|---|
| [L00](../loops/L00-control-plane/) | M01 | `01-clean-craft-baseline.md` |
| [L01](../loops/L01-platform-action/) | M00, M03, M12-core | `00-platform-spine.md`, `03-internal-action-registry.md`, `12-capability-skill-plugin-system.md` |
| [L02](../loops/L02-local-workbench/) | M02, M04, M05, M08-core, **M11A**, M16-host | `02-…`, `04-…`, `05-…`, `08-…`, `11-…` §2, `16-…` |
| [L03A](../loops/L03A-composable-creative/) | M06, M07, M08-providers, M16-composition, M17 | `06-browser-artifact-surface/SPEC.md`, `07-canvas-design-surface/SPEC.md`, `08-…`, `16-…`, `17-composable-workflows.md` |
| [L03B](../loops/L03B-creative-fanout/) | M09, M18, M19 | `09-video-surface.md`, `18-web-artifact-surface.md`, `19-presentation-motion-surface.md` |
| [L04](../loops/L04-intelligence/) | M10, M11B, M12-distribution | `10-memory-context-review.md`, `11-…` (M11B only), `12-…` |
| [L05](../loops/L05-polish/) | M13, M14, M15 | `13-settings-shell-ux.md`, `14-onboarding.md`, `15-messaging.md` |

## 5. Planned Modules (ID index)

| Module | File | Responsibility |
|---|---|---|
| M00 | `00-platform-spine.md` | identity, permission, session, event, durable control authority |
| M01 | `01-clean-craft-baseline.md` | clean Craft Agents v0.11 base and retained shell |
| M02 | `02-terminal-cli-runtime/SPEC.md` | terminal surface and bounded CLI/runtime host |
| M03 | `03-internal-action-registry.md` | canonical action definition/invocation/executor path |
| M04 | `04-runtime-lanes-teamrun.md` | AgentSeat, RuntimeLane, TaskRun/TeamRun coordination |
| M05 | `05-files-library-leases.md` | files, Library, ArtifactRef, leases, provenance |
| M06 | `06-browser-artifact-surface/SPEC.md` | browser selection, annotation, evidence, owned preview boundary |
| M07 | `07-canvas-design-surface/SPEC.md` | infinite spatial canvas and workflow projection |
| M08 | `08-aigc-jobs-surface.md` | ExternalJob core and generative operations |
| M09 | `09-video-surface.md` | multi-asset media project, timeline, render |
| M10 | `10-memory-context-review.md` | local memory/context/review under one model |
| M11 | `11-model-routing-cost-ledger.md` | provider routing, usage, cost, native batch |
| M12 | `12-capability-skill-plugin-system.md` | capability manifests/loadouts and later plugins |
| M13 | `13-settings-shell-ux.md` | settings IA and preferences, not workbench layout host |
| M14 | `14-onboarding.md` | onboarding and empty-state loop |
| M15 | `15-messaging.md` | governed messaging gateway |
| M16 | `16-workbench-panel-platform.md` | view registry, instances, docks, layout recovery |
| M17 | `17-composable-workflows.md` | typed workflow definitions and run orchestration |
| M18 | `18-web-artifact-surface.md` | editable local web project and governed preview/build |
| M19 | `19-presentation-motion-surface.md` | native motion deck and honest export fidelity |

## 6. Promotion Checklist

Before changing `spec maturity` to `execution-ready`, the Lead records:

- canonical contract version and exact dependency status;
- v0.11 implementation extension points;
- selected engine/library version, license, and adapter spike where applicable;
- finite packet with exact allowed/forbidden files;
- no unresolved open gate that changes product behaviour;
- a Reviewer-executable real-behaviour procedure.

Before changing capability status to `usable`, follow `DEVELOPMENT-PROCESS.md`; documentation and
tests alone never establish usability.
