# L02 — Local Workbench Runtime

| Field | Value |
|---|---|
| **Loop ID** | L02 |
| **Wave** | W2 |
| **Importance** | Critical — first serious local product loops |
| **Difficulty** | Medium–Hard (PTY/process, files, jobs, shell host) |
| **Gate** | Locked |
| **Start when** | L01 exit (M00/M03 usable); W2 Ready; exact slice packets |
| **Exit when** | M02 terminal loop, M05 file/ArtifactRef loop, M16 host slice, M08 durable job core `usable`; M04 bounded run core plus parent/child task inspection verified |

## Closed loops in this folder (several slices, one wave)

### Loop A — Terminal / CLI

```text
user selects runtime → host starts process/PTY → streamed output
  → SessionEvent / timeline → stop/error/report visible
```

### Loop B — Files & ArtifactRef

```text
workspace file → permissioned action → Library/ArtifactRef metadata
  → versioned handoff ref (no second content store)
```

### Loop C — Durable job core

```text
long work request → ExternalJob record → provider/local execution
  → restart-safe status → output ref (providers may wait for L03A)
```

### Loop D — Panel host

```text
module registers view → M16 layout/instance → open/close without owning domain state
```

### Loop E — TeamRun core and task visibility (bounded)

```text
leader lane → Fleet Bridge → child TaskRuns → compact preview / task tree
  → authorized child conversation + compressed report → timeline
```

## Modules in this loop

| Module / slice | Spec | Role |
|---|---|---|
| M02 | [`modules/02-terminal-cli-runtime/SPEC.md`](../../modules/02-terminal-cli-runtime/SPEC.md) | Terminal surface + CLI runtime host |
| M04 core | [`modules/04-runtime-lanes-teamrun.md`](../../modules/04-runtime-lanes-teamrun.md) | RuntimeLane / TeamRun core |
| M05 | [`modules/05-files-library-leases.md`](../../modules/05-files-library-leases.md) | Files, Library, ArtifactRef, leases |
| M08 job core | [`modules/08-aigc-jobs-surface.md`](../../modules/08-aigc-jobs-surface.md) | Durable ExternalJob core (not full generative UX) |
| **M11A** usage/cost core | [`modules/11-model-routing-cost-ledger.md`](../../modules/11-model-routing-cost-ledger.md) §2 | Budget preflight + UsageObservation/CostRecord (required before paid W3A jobs) |
| M16 host | [`modules/16-workbench-panel-platform.md`](../../modules/16-workbench-panel-platform.md) | View registry / layout host inside Craft shell |
| M12 catalog (if scheduled) | [`modules/12-capability-skill-plugin-system.md`](../../modules/12-capability-skill-plugin-system.md) | Catalog projection after core contract |

## Why after L01

Terminal UI, file writes, and jobs must share M00/M03. M02 UI also depends on M16 host — do not invent a second terminal shell.

## Cross-cutting docs

- D3, D15, D19, D21, D29, D42
- Fleet Bridge shape in `PARALLEL-AGENT-OPERATING-MODEL.md` (implement only re-frozen version)

## Active packet

None while Locked.

## Reading order inside L02

1. This README
2. M16 host → M02 → M05 → **M11A** → M08 core → M04
3. Exact active packet for **one** slice only (no multi-slice Worker)

## Next loop

→ [L03A-composable-creative](../L03A-composable-creative/) after L02 exit.
