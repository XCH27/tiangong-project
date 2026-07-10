# ADR-0033 — Composable Spatial Workspace Boundary

> **Status:** Accepted product boundary; contract details pending W0.1 re-freeze  
> **Date:** 2026-07-09  
> **Decision source:** Owner selection of the modular universal-space route

## Context

The earlier plan treated M07 primarily as a native design canvas with a fixed list of node
types. The owner instead requires a universal spatial workspace where every function is a
modular component, humans and Agents can call the same capabilities, Agents can create
workflows, and one generated artifact can feed web, video, presentation, and editing modules.

A universal embedded-app canvas would make the renderer, workflow scheduler, and every native
document compete for authority. A design-first fixed node model would be simpler but would not
meet the extensibility requirement.

## Decision

Adopt **spatial orchestration plus native editors**.

- M07 owns spatial layout and visual projection.
- M16 owns view registration, panel/surface instances, and layout projection.
- M17 owns versioned workflow definitions and run correlation.
- M12 owns capability descriptors; M03 owns invocation and dispatch.
- M05 owns artifact-reference metadata; native modules own document contents.
- M08 owns asynchronous job state.
- M00 remains the only identity, permission, approval, and timeline authority.

Human UI, Agent tools, and workflow steps are generated from and invoke the same registered
operation definition. No caller receives an alternate executor or permission path.

## Consequences

- The fixed M07 node union is replaced by module-contributed entity renderers and references.
- Visual connectors and executable workflow edges are distinct.
- OpenPencil may back a professional design module but is not presumed to be the universal
  spatial host.
- Capability-manifest and workflow contracts move ahead of downstream creative surfaces.
- M16 and M17 are separate modules because view layout and execution orchestration have
  different state, failure, and ownership boundaries.
- Workflows are DAGs in v1; cycles and a general scripting language are deferred.

## Rejected Alternatives

1. Full live-app embedding on the canvas.
2. A fixed design-node canvas that directly owns browser, AIGC, video, and presentation state.
3. A separate workflow permission/runtime platform beside M00/M03/M04/M08.

## Reversibility

The exact canvas renderer, panel library, and native design engine remain replaceable behind
their adapters. The responsibility boundaries and single-authority rules are not optional.

