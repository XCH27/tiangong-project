# M07 — Spatial Canvas and Workflow Projection

> **Capability status:** `not implemented`
> **Execution gate:** Locked
> **Spec maturity:** contract draft; renderer adapter not selected
> **Wave:** W3A foundation, W3B native-module projections
> **Owner:** Lead for spatial contract; M07 Worker after packet approval
> **Depends on:** M00, M03, M05, M12 capability core, M16 view host, M17 workflow contract

## 1. Purpose

Provide an infinite spatial workspace where humans and Agents arrange project entities, inspect
results, and visually edit executable workflows without making the canvas the owner of every
artifact or native document.

The first complete loop is: an Agent creates a text-to-image workflow in M17, M07 renders it,
the human changes one input and runs it, and the resulting image ArtifactRef appears as a spatial
card with shared permission and timeline evidence.

## 2. Product Boundary

M07 is the **spatial presentation and interaction layer**. It owns:

- infinite pan/zoom, selection, spatial positions, grouping, annotations, and visual reference
  connectors;
- entity cards contributed by capability/native modules;
- workflow-definition and run projections from M17;
- human/Agent reveal, focus, and layout actions;
- static previews and bounded live-preview activation.

M07 does not own:

- workflow graph truth or scheduling;
- provider jobs, media timelines, web files, presentation slides, or design documents;
- permissions, timeline persistence, job queues, files, or Library metadata;
- a universal patch language for native document internals.

## 3. Two Explicit Modes

### 3.1 Space Mode

Users arrange notes, artifacts, jobs, native-document portals, capability shortcuts, and saved
workflows. Connectors are visual references only. They never trigger execution.

### 3.2 Workflow Mode

M07 displays one exact M17 WorkflowDefinition version. Step cards expose typed ports. Adding,
removing, or connecting a step invokes M17; M07 stores only presentation positions. An edge is
executable only after M17 validates and commits it.

The mode is always visible. The UI must not allow a decorative line to look like a valid data
edge or a workflow edge to be silently downgraded to decoration.

## 4. State Authority

| State | Authority | M07 representation |
|---|---|---|
| spatial positions and visual annotations | M07 SpatialDocument | direct editable state |
| workflow steps and executable edges | M17 WorkflowDefinition | versioned projection |
| workflow/job run state | M17/M08 | status projection |
| files and ArtifactRefs | M05 | card reference/preview |
| design document | design adapter | portal and preview |
| media project | M09 | portal and preview |
| web project | M18 | portal and preview |
| motion deck | M19 | portal and preview |
| selection/viewport | local view instance | ephemeral unless explicitly saved as a named view |

Removing a spatial card removes the binding only. Deleting the referenced artifact or document
requires the owning module's separately permissioned action.

## 5. Spatial Data Model

M07 consumes the proposed `SpatialDocument`, `SpatialNodeBinding`, `SpatialConnector`, and
`EntityRef` contracts in `docs/contracts/composable-workspace-contracts.md`.

Required properties:

- `schemaVersion` and monotonically committed document `revision`;
- node frame stored in world coordinates using top-left `(x, y)` plus width/height;
- stable entity reference and owner module;
- renderer ID and versioned presentation payload;
- only `visual_reference` connectors in SpatialDocument;
- workflow-step positions keyed by workflow ID and definition version;
- no raw media bytes, secrets, provider credentials, or hidden native documents.

The existing frozen v1.2 `CanvasDocument` and fixed `NodeType` union do not meet this model and
must not be implemented as the final contract. W0.1 must explicitly amend or supersede them.

## 6. Module-Contributed Cards

M12 capability/native modules may contribute a canvas renderer definition:

```ts
type CanvasRendererContribution = {
  rendererId: string
  ownerModuleId: string
  entityKinds: EntityRef['entityKind'][]
  summarySchemaRef: string
  presentationSchemaRef: string
  defaultSize: { width: number; height: number }
  previewMode: 'static' | 'lazy_live'
  inspectorContributionId?: string
  openSurfaceContributionId?: string
}
```

The renderer receives a permission-filtered summary and references. It cannot call owner service
internals directly. Mutations go through registered actions.

Core v1 renderers:

- note/text;
- ArtifactRef preview;
- capability operation;
- workflow step/definition/run;
- native-document portal;
- missing/unauthorized entity placeholder;
- group/frame.

Browser, image, video, web, and presentation are not hard-coded into the canvas protocol. Their
owners register renderers against the generic entity/artifact types.

## 7. User Interaction

| Interaction | Behaviour |
|---|---|
| pan/zoom | local view state; never timeline spam |
| click / range / marquee | local selection; authorized Agent reveal may set temporary selection |
| drag/resize | one coalesced spatial mutation committed on gesture end |
| group/ungroup | reversible spatial mutation; does not change entity ownership |
| delete card | reversible removal of binding only |
| open | M16 opens owner surface/inspector with typed route state |
| draw reference | creates a non-executable `visual_reference` connector |
| connect typed ports | invokes M17 edge validation/commit in Workflow mode |
| run workflow | invokes M17 after showing validation, approval, and budget state |
| export preview | renders in memory; writing a file is a separate M05 action |

Keyboard shortcuts use `Mod` terminology and must follow the selected renderer's accessible
interaction model. Exact shortcuts are frozen only after the renderer spike.

## 8. Human, Agent, and Workflow Access

Human controls and Agent actions use the same M03 entries. Workflow runtime does not need to
move canvas cards to execute; it updates only run projections after domain state changes.

An Agent may:

- create/remove/move spatial bindings within scope;
- create notes and groups;
- reveal a permitted entity;
- enter Workflow mode and edit M17 through its actions;
- open a relevant M16 view.

An Agent may not silently take persistent viewport control, rearrange a user's layout while they
are actively manipulating it, or infer execution from freeform connectors.

## 9. Candidate Actions and Existing Contract Corrections

| Action | Intended behaviour | Required correction/status |
|---|---|---|
| `canvas.node_create` | add a spatial entity binding | keep name only after new payload schema freezes |
| `canvas.node_update` | update frame/presentation with `baseRevision` | payload/revision contract required |
| `canvas.node_delete` | remove spatial binding | should be L1 snapshot-reversible, not artifact deletion |
| `canvas.node_select` | temporary reveal/selection | view state; no timeline event |
| `canvas.group_create` / `canvas.group_ungroup` | spatial grouping | snapshot-reversible |
| `canvas.edge_create` | visual reference connector only | executable edge belongs to M17 |
| `canvas.edge_delete` | remove visual connector | must freeze before use |
| `canvas.viewport_set` / `canvas.zoom_to_node` | view reveal | no persistent domain mutation |
| `canvas.viewport_fit` | fit all/selection | must freeze before use |
| `canvas.export_selection` | currently ambiguous | replace with in-memory render plus M05 file write |

Do not maintain `canvas:createNode`-style Agent hook names as a second semantic API. Tool/RPC
bindings are generated from canonical action definitions.

## 10. Document Revision, Concurrency, and Undo

- Every mutation includes `idempotencyKey` and `baseRevision`.
- M07 serializes commits per SpatialDocument and returns `committedRevision`.
- A stale revision returns an explicit conflict with the latest revision and affected fields.
- Audit `SessionEvent.seq` records evidence order; it is not used for last-write-wins.
- Drag/resize frames may be previewed locally, but one mutation commits on gesture end.
- Compound operations such as group and multi-move commit atomically or not at all.
- Spatial history is document-level. Undo uses an inverse or snapshot handle through M03.
- Undoing a card removal restores the binding, not an independently deleted artifact.

No silent conflict overwrite is permitted. A later collaboration model may introduce CRDT/OT
only through a separate ADR.

## 11. Persistence and Recovery

- SpatialDocument is a versioned project document referenced through M05.
- Viewport and transient selection are per view instance; a named/saved view is optional future
  state and not part of the initial document contract.
- Saves are atomic and revisioned through the native adapter or M05 write path.
- Timeline evidence cannot be used as a write-ahead log unless its payload is proven complete,
  versioned, and idempotent. The default is native document snapshot/journal recovery.
- Startup migrates supported schema versions automatically. Unsupported migration opens a
  read-only recovery view and preserves the source.

## 12. Preview and Resource Behaviour

- Static preview is the default for every external/native entity.
- `lazy_live` activates only when visible, sufficiently zoomed, and admitted by resource policy.
- Off-screen live views suspend immediately; their domain jobs/runtimes continue with the owner.
- Canvas updates are coalesced per render frame, but document commits remain revisioned actions.
- Visible-node culling and cached previews are required.
- M08/M09 renders and provider jobs never run on the renderer thread.
- When saturated, M07 reduces live previews and auxiliary updates, then shows a visible queued or
  degraded state. It does not freeze silently.

Exact node count, FPS, memory, and activation thresholds require a reproducible benchmark. The
unverified numbers in earlier drafts are not binding.

## 13. Engine Selection Gate

The previous assumption that `ZSeven-W/openpencil` is a React editable canvas engine is no
longer valid. Its current official README describes a Rust/CanvasKit product and a read-only web
viewer SDK. `open-pencil/open-pencil` exposes an editable Vue SDK for design documents, not a
general React workspace host.

M07 therefore requires a bounded adapter spike before selection:

1. render custom React entity cards and typed ports;
2. create/update/remove 1,000 lightweight cards without whole-tree rerenders;
3. support pan, zoom, selection, keyboard accessibility, and view culling;
4. serialize only spatial state and restore it;
5. drive mutations from human and Agent ActionInvocations;
6. isolate a faulting renderer contribution;
7. confirm license compatibility with a free/open local product.

`@xyflow/react` is the preferred candidate for this spike because its official project describes
custom node-based React UIs under MIT. It is not promoted to a green-light dependency until the
reference policy and spike are approved. tldraw is behaviour reference only because current
production SDK use requires a license key. OpenPencil remains a candidate for a separate native
design module.

## 14. Error Handling

| Condition | Visible result | Recovery |
|---|---|---|
| missing/unauthorized entity | typed placeholder, no leaked metadata | request access or remove binding |
| renderer contribution missing | stable unknown-card placeholder | restore module or change renderer |
| stale revision | conflict banner with affected entity | reload/reapply explicit patch |
| spatial save failure | document remains dirty; no success claim | retry/export recovery copy |
| workflow port mismatch | invalid edge preview; no edge committed | choose converter/compatible port |
| workflow run failure | step/result card shows M17 error | inspect, retry allowed step, or fork repair |
| preview fault | static fallback | reopen owner surface or reload preview |
| resource saturation | live previews suspended; queue/degraded notice | wait, close heavy views, or split space |

## 15. First Usable Verification

1. Open M07 through M16 and create a persisted spatial document.
2. Human places/moves a text input card; Agent places an image capability card through the same
   action registry path.
3. Agent creates the two-step workflow in M17; M07 shows typed ports and validated edge.
4. Human edits one input and starts the run; approval, job, and output state update visibly.
5. The real image output is registered by M05 and appears as an ArtifactRef card.
6. Move/remove/undo the result card; verify the artifact remains and spatial binding restores.
7. Attempt concurrent stale updates; verify explicit conflict and no silent lost edit.
8. Restart during a running job and after a dirty spatial change; verify M17/M08 reconciliation
   and M07 document recovery without duplicate generation.
9. Inspect timeline: human, Agent, workflow, job, and artifact correlations are present; viewport
   noise and secret prompt data are absent.
10. Perform a real rendered interaction check at common zooms and during active Agent updates.

## 16. Later Verification

- fan out one image to M18, M09, and M19 and show all outputs as separate versioned cards;
- open each native editor through M16 while the canvas remains responsive;
- unload a renderer module and recover its cards;
- enforce resource degradation with multiple live previews;
- export a selection through in-memory render plus an approved M05 file write.

## 17. Open Gates

- W0.1 contract re-freeze and v0.11 migration gate.
- Spatial renderer/license spike and recorded decision.
- ArtifactRef, capability renderer, workflow, and view contracts frozen.
- Resource benchmark and user-visible degraded-state wording.
- A new M07 packet; the superseded F Track must not be revived.

## 18. Non-Goals and Prohibitions

- No fixed cross-module node union as the long-term extension model.
- No second workflow graph hidden in the canvas.
- No full live Chromium/video/design/deck editor in every node.
- No raw file paths or secret payloads in renderer cards.
- No direct adapter timeline writes or permission checks.
- No claim of `usable` from a mock canvas or unit tests alone.
