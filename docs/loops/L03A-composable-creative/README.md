# L03A — Composable Creative Proof (D45)

| Field | Value |
|---|---|
| **Loop ID** | L03A |
| **Wave** | W3A |
| **Importance** | High — proves modular creative OS, not chat demos |
| **Difficulty** | Hard (many modules + real provider + restart) |
| **Gate** | Locked |
| **Start when** | L02 cores usable (incl. **M08 job core + M11A**); renderer/workflow/capability contracts frozen; active packet |
| **Exit when** | D45 loop usable: text → real image job → ArtifactRef → canvas result; human/Agent/workflow parity; approval pause; restart without double side-effect |

## Closed loop (what “done” means)

```text
text or brief
  → composable image operation (M12 + M03)
  → durable ExternalJob (M08 provider slice)
  → output file + ArtifactRef (M05)
  → canvas result card / workflow projection (M07 + M17)
  → optional M16 inspector
  → same path for human UI, Agent, and workflow step
```

## Modules in this loop

| Module / slice | Spec | Role |
|---|---|---|
| M06 | [`modules/06-browser-artifact-surface/SPEC.md`](../../modules/06-browser-artifact-surface/SPEC.md) | Evidence input (when packeted); not required for minimal D45 |
| M07 | [`modules/07-canvas-design-surface/SPEC.md`](../../modules/07-canvas-design-surface/SPEC.md) | Spatial canvas projections |
| M08 generative providers | [`modules/08-aigc-jobs-surface.md`](../../modules/08-aigc-jobs-surface.md) | Real image provider path |
| M12 (ops used by loop) | [`modules/12-capability-skill-plugin-system.md`](../../modules/12-capability-skill-plugin-system.md) | Operation descriptors |
| M16 composition | [`modules/16-workbench-panel-platform.md`](../../modules/16-workbench-panel-platform.md) | Surfaces/inspectors for the loop |
| M17 | [`modules/17-composable-workflows.md`](../../modules/17-composable-workflows.md) | Versioned workflow definition/run |

## Architecture anchors

- [`COMPOSABLE-WORKSPACE-ARCHITECTURE.md`](../../COMPOSABLE-WORKSPACE-ARCHITECTURE.md) §11 Slice B
- ADR-0033, D39–D45
- [`FORBIDDEN-ANTIPATTERNS.md`](../../FORBIDDEN-ANTIPATTERNS.md) — canvas not a second store; no fixed node-union product

## Active packet

None while Locked. F Track packet is legacy and is **not** an alternate gate.

## Reading order inside L03A

1. This README
2. COMPOSABLE §11 + D45
3. M17 → M08 providers → M05 → M07 → M16 composition
4. Adapter spike evidence (spatial renderer, image provider) before execution-ready

## Next loop

→ [L03B-creative-fanout](../L03B-creative-fanout/) after D45 proof (modules may promote independently under W3B rules).
