# L03B — Creative Fan-out (Native Outputs)

| Field | Value |
|---|---|
| **Loop ID** | L03B |
| **Wave** | W3B |
| **Importance** | High — multi-surface production from one artifact version |
| **Difficulty** | Hard (native editors, codecs, export fidelity) |
| **Gate** | Locked |
| **Start when** | L03A contracts/core available; per-surface packet; ArtifactRef stable |
| **Exit when** | At least one real path each for M18 web, M19 deck, M09 multi-asset media (may promote independently) |

## Closed loop (what “done” means)

```text
one versioned image/artifact (ArtifactRef)
  → fan-out without silent byte copy
  → M18 web project  and/or  M19 motion deck  and/or  M09 media project
  → native edit + export/render via M08 where needed
  → new ArtifactRefs + provenance back to input + workflow run
```

## Modules in this loop

| Module | Spec | Role |
|---|---|---|
| M09 | [`modules/09-video-surface.md`](../../modules/09-video-surface.md) | Multi-asset media composition / render |
| M18 | [`modules/18-web-artifact-surface.md`](../../modules/18-web-artifact-surface.md) | Editable local web project |
| M19 | [`modules/19-presentation-motion-surface.md`](../../modules/19-presentation-motion-surface.md) | Motion deck + honest PPTX/HTML/video export |

Shared dependencies (not re-owned here): M05, M08, M12, M16, M17 from earlier loops.

## Architecture anchors

- COMPOSABLE §11 Slice C–D
- D8, D14, D44, D46

## Active packet

None while Locked.

## Reading order inside L03B

1. This README
2. M05 ArtifactRef rules
3. One surface only (M18 **or** M19 **or** M09) per Worker packet
4. Fidelity/export non-goals in FORBIDDEN + module spec

## Next loop

→ [L04-intelligence](../L04-intelligence/) when intelligence slices are Ready (may overlap L03B only with disjoint files and usable deps).
