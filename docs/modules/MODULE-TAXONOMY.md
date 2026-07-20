# Module taxonomy and bounded-context rules

The registry is an anti-omission inventory, not a flat dependency graph. A row must be classified
before it receives a new API, folder, or persistence authority.

## Five kinds of entries

| Kind | Meaning | May own persisted domain state? | Example |
|---|---|---:|---|
| Core system | Durable cross-cutting host or authority | Yes, only for its own state class | Workspace, Session, Permission |
| Product module | Coherent user capability with a native model | Yes, inside its bounded context | Video sequence, Design document |
| Surface | Projection/interaction over other authorities | Usually no | Canvas, Board, Search, Inspector |
| Adapter/connector | Translation boundary to an external runtime/provider/format | No Fleet authority | FFmpeg, runtime, messaging adapter |
| Capability | A bounded operation exposed by a module | No independent store | Captions, export profile, model routing |

The current registry contains all five kinds. They must not become 68 independent products or 68
new stores.

## Bounded contexts

| Context | Owns | Typical registry families |
|---|---|---|
| Work core | Project, Session, Task, Settings, Timeline | CORE; event history |
| Governed execution | Permission, Action, local runtime, delegation, isolation, remote | EXEC |
| Information/evidence | Files, Library, ArtifactRef, ingestion, search, provenance | INFO |
| Intelligence | Context, token/cost, model adapters, memory, skills, evaluation | INTEL |
| Creative media | Video, image, audio, captions, design, web, deck, motion, storyboard | CREATE |
| Composition | Canvas projection, workflows, panels, notifications | Canvas; ORCH-01/02/07; CORE-11 |
| Integrations/delivery | Messaging, automation, jobs, MCP, updates, telemetry | remaining EXEC/ORCH/CORE |
| Capability distribution | package catalogs, manifests, trust and install lifecycle | ORCH-03/04/10/11/12 |

These are architectural boundaries, not release phases. They describe where authority belongs.

## Boundary rules

1. A product module owns one native domain model, never a copy of a core model.
2. A surface may project and invoke; it does not own the objects it displays.
3. A capability is an action/adapter contract, not a reason for a new database or task store.
4. A connector reports observations and translates semantics; it does not own Fleet state.
5. Cross-context writes use the governed Action seam and return ArtifactRef, Job or Event references.
6. If two rows share identity, lifecycle or persistence, merge them before coding.
7. A row becomes a deep module only when it has a distinct domain invariant and an independently
   testable seam; otherwise keep it as a capability or surface.

The 68-row registry remains useful for coverage. The eight system suites above are the delivery architecture.
