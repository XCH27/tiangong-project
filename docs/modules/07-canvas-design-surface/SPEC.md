# 07 Canvas Design Surface

## 1. Mission

Build a native **infinite canvas** connected to Craft Agents (二开补强)'s action, permission, Library, and timeline spine — where both humans and agents can create, edit, and inspect canvas objects with full undo, evidence, and rollback support.

---

## 2. User-Visible Loop

1. User opens a Canvas surface from the workspace sidebar or via a session action.
2. User sees an infinite, pannable, zoomable canvas with their existing nodes.
3. User creates a node (text frame, image, sticky, code block, connector) by clicking or via command palette.
4. Agent receives a task, calls `canvas.node_create` / `canvas.node_update` via the action registry — the node appears on the canvas in real time.
5. Both human and agent edits enter the Timeline. Native undo (Cmd+Z) reverses either source.
6. User can select multiple nodes, group them, export a selection as an image or handoff spec.

---

## 3. Node Types

| Node type | Description | Agent-writable |
|---|---|---|
| `text_frame` | Rich text block, variable size | ✅ |
| `image_asset` | Image from Library; displays with provenance | ✅ |
| `sticky` | Coloured note card, short text | ✅ |
| `code_block` | Syntax-highlighted code; may embed terminal output | ✅ |
| `browser_embed` | Live browser artifact (M06) — viewport-suspended off-screen | ✅ read; ⚠️ write via M06 action |
| `video_frame` | Thumbnail + play target to M09 Video surface | ✅ read; ⚠️ write via M09 action |
| `aigc_placeholder` | AIGC job output slot (M08) — shows spinner until fulfilled | ✅ |
| `connector` | Arrow / edge between two nodes | ✅ |
| `group` | Container grouping of child nodes | ✅ |

---

## 4. Viewport Model (Infinite Canvas)

The canvas coordinate system is unbounded in all four directions. Craft Agents (二开补强) does not impose a page boundary.

### 4.1 Coordinate Space

- All node positions are stored in **canvas-space** coordinates `(cx, cy)` — floating point, origin at (0, 0), no physical unit.
- The viewport is described by `{ cx, cy, zoom }` where `zoom` is a scale factor (default 1.0, range 0.05 – 32.0).
- Screen-space ↔ canvas-space conversion: `screenX = (cx_node - viewport.cx) * viewport.zoom + screen.centerX`.

### 4.2 Viewport Actions

| Action id | Description |
|---|---|
| `canvas.viewport_set` | Jump to a specific `{ cx, cy, zoom }` — used by agent to bring a node into view |
| `canvas.viewport_fit` | Fit all nodes (or selected nodes) into the current screen |
| `canvas.zoom_to_node` | Centre and zoom to make a specific node fully visible |

Viewport actions are **not** recorded in the Timeline (they are view-state, not document mutations).

### 4.3 Minimap

A minimap overlay (bottom-right corner, togglable) shows all non-empty regions of the canvas with a viewport rectangle. Clicking the minimap teleports the viewport. The minimap is read-only — nodes cannot be manipulated from it.

---

## 5. Keyboard & Pointer Interactions

| Gesture / shortcut | Action |
|---|---|
| Space + drag | Pan canvas |
| Scroll wheel | Zoom in/out (centred on cursor) |
| Pinch (trackpad) | Zoom in/out |
| Cmd+= / Cmd+- | Zoom in/out by step |
| Cmd+0 | Reset zoom to 100 % |
| Cmd+Shift+H | Fit all nodes to viewport |
| Cmd+A | Select all nodes |
| Click | Select node |
| Shift+Click | Add to selection |
| Drag (empty area) | Marquee select |
| Drag (node) | Move node |
| Cmd+Z / Cmd+Shift+Z | Undo / Redo |
| Backspace / Delete | Delete selected nodes |
| Cmd+G | Group selected nodes |
| Cmd+Shift+G | Ungroup |
| Cmd+D | Duplicate selected nodes |
| Cmd+E | Export selection (image / spec) |
| V | Select tool |
| T | Text frame tool |
| N | Sticky tool |
| C | Connector tool |
| Escape | Cancel tool / deselect |

---

## 6. Current App Reuse

Reuse session / timeline / permission, Library assets, Internal Action Registry (M03), and panel / surface navigation from M00.

---

## 7. Reference Projects

**OpenPencil** is the approved native design engine reference / source. Open Design informs workflow. Do **not** use iframe DOM mutation as the design engine. Do **not** self-build a document/command engine.

---

## 8. UI Placement

Canvas is a professional surface, not the default workbench shell. It opens as a full-screen surface routed from the workspace sidebar (surface icon) or from a session action that creates a canvas document. It shares the Craft Agents (二开补强) top-bar spine but replaces the chat/editor main area.

The canvas surface is **not** embedded inside the chat panel. It is a peer surface.

---

## 9. Backend / RPC / Locality

Canvas state is **local project state** — no cloud sync in Wave 3. Agent actions call structured canvas actions via the Internal Action Registry, not DOM or screenshot operations.

Canvas document is persisted as a JSON snapshot in the workspace directory under `<workspace>/.fleet/canvas/<canvas-id>.json`.

---

## 10. Session / Timeline / Permission / Rollback

- High-frequency drag / resize is **coalesced** into meaningful events before entering the Timeline (see §18.1 batching rule).
- Undo uses native OpenPencil history **and** inverse-patch `UndoHandle` entries in the Craft Agents (二开补强) Timeline.
- All canvas mutations require at minimum `L1_reversible` permission (same as file writes).
- `canvas.node_delete` is destructive — requires `L2_irreversible` and a `SupervisionRequest` unless the node has no downstream references.

---

## 11. Data Model

```ts
// Canonical types — defined in protocol-stubs.md and implemented in
// app/packages/shared/src/protocol/canvas.ts (Lead-owned)

type CanvasDocument = {
  id: string;                  // uuid
  workspaceId: string;
  sessionId?: string;          // pinned to a session if created from one
  nodes: Record<string, CanvasNode>;
  edges: Record<string, CanvasEdge>;
  viewport: Viewport;          // last saved viewport for this document
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

type CanvasNode = {
  id: string;
  type: NodeType;              // see § 3 node types
  cx: number;                  // canvas-space x
  cy: number;                  // canvas-space y
  width: number;
  height: number;
  data: Record<string, unknown>; // type-specific payload
  contentType?: 'static' | 'live'; // 'live' nodes obey lazy-render rules
  groupId?: string;
  provenance?: AssetProvenance; // if type === 'image_asset'
  seq: number;                 // last mutation sequence number (from ActionInvocation)
};

type CanvasEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  style?: EdgeStyle;
};

type Viewport = { cx: number; cy: number; zoom: number };
```

---

## 12. Agent-Native Actions

| Action id | Description | Permission | Undo |
|---|---|---|---|
| `canvas.node_create` | Create a new node at given position with given type and data | L1_reversible | supported |
| `canvas.node_update` | Update position, size, or data of an existing node | L1_reversible | supported |
| `canvas.node_delete` | Delete a node (and its edges) | L2_irreversible | not_supported |
| `canvas.node_select` | Change selection state | L0_read_only | n/a |
| `canvas.group_create` | Group a set of node ids | L1_reversible | supported |
| `canvas.group_ungroup` | Dissolve a group | L1_reversible | supported |
| `canvas.edge_create` | Create a connector between two nodes | L1_reversible | supported |
| `canvas.export_selection` | Export selected nodes as image / spec | L0_read_only | n/a |
| `canvas.viewport_set` | Move viewport to given coordinates (view-state only, no timeline) | L0_read_only | n/a |
| `canvas.zoom_to_node` | Bring a node into view | L0_read_only | n/a |

All writable actions above are added to the frozen action-ids table after Lead review.

---

## 13. Files To Inspect First

- `app/packages/shared/src/protocol/internal-action.ts`
- `docs/contracts/action-ids.md`
- `docs/contracts/protocol-stubs.md` (canvas type stubs)
- Future `app/packages/shared/src/protocol/canvas.ts` (Lead creates this at W0)
- Renderer surface / panel routes in `app/apps/electron/src/renderer`

---

## 14. Files Likely Touched

Canvas protocol, renderer canvas components, canvas store / bridge adapter, action executor for canvas ids, Library integration for `image_asset` nodes.

---

## 15. Parallel Work Packages (within W3)

All packages are gated on the canvas contract freeze (Lead creates `protocol/canvas.ts` stub at W0).

| Package | Depends on | Can start |
|---|---|---|
| F-Track A: OpenPencil adapter + store bridge | canvas protocol stub | After W0 |
| F-Track B: Node rendering (text_frame, sticky, image_asset) | F-Track A store bridge | After F-Track A stub is merged |
| F-Track C: Action executors (`node_create`, `node_update`, `node_delete`) | canvas protocol stub + M03 registry | After W0 + M03 skeleton |
| F-Track D: Viewport manager + minimap | F-Track A store bridge | After F-Track A stub |
| F-Track E: Library `image_asset` integration | M05 lease model + F-Track A | After W2 gate |

**F-Track A must produce the OpenPencil ↔ Craft Agents (二开补强) mapping table before any adapter code.** See §17.2.

---

## 16. File Ownership

- Canvas protocol (`protocol/canvas.ts`) — **Lead-owned**.
- OpenPencil adapter layer — **F-Track A lead**, no other Worker touches it.
- Node renderers — F-Track B.
- Action executors — F-Track C.
- Viewport / minimap — F-Track D.
- Library integration — F-Track E.

---

## 17. Validation Ladder

1. `pnpm typecheck` — zero errors.
2. Canvas store unit tests — create / update / delete node; verify seq ordering.
3. Action executor unit tests — every action id in §12 has a passing test.
4. Canvas render smoke — open a canvas with 3 nodes; verify they are visible.
5. Human + agent same-object edit — human moves node A; agent simultaneously updates node A's text; verify no data loss, Timeline has both events.
6. Undo smoke — 5 mutations; 5 undos; verify document returns to original state.
7. Lazy-render smoke — create a `live` node; scroll it off-screen; verify renderer is unmounted; scroll back; verify it resumes.
8. Screenshot / DOM visual check at 100 %, 50 %, and 200 % zoom.

---

## 18. Done / Not Done

**`usable`**: human and agent can each create, move, and delete a native canvas node with undo working for both. Timeline shows evidence for both operations. Selection and viewport work correctly.

**`display-only`**: draggable nodes without action/timeline/agent path.

**`blocked`**: contract freeze not yet issued by Lead.

---

## 19. Risks And Blocked Decisions

| Risk | Mitigation |
|---|---|
| Building a second asset store | Canvas assets use Library / provenance path only (M05) |
| Frame-rate collapse under concurrent agent mutations | §18.1 batching rule — all mutations within one 16 ms frame are batched |
| Lazy-render thrashing during fast zoom | §18.3 zoom threshold (< 25 % → all live nodes go static) |
| Adapter seam becoming unmaintainable | §17.2 mapping table reviewed by Lead before any code |
| Viewport state written to Timeline (noise) | Viewport actions are explicitly excluded from Timeline (see §10) |

---

## 20. Engine Integration Decision

### 20.1 Decision: Integrate OpenPencil Directly

Craft Agents (二开补强) integrates OpenPencil as the canvas renderer via a thin adapter layer. Self-building a document / command engine is off the table.

Rationale: Craft Agents (二开补强)'s differentiation is in the human/agent shared path, Hook Pipeline, and Timeline evidence layer — not in the pixel renderer. Letting OpenPencil own pixels while Craft Agents (二开补强) owns semantics avoids a 5–10× self-build cost.

### 20.2 F-Track Gate: Mapping Table Before Code

The first deliverable of F-Track A is **not** code. It is a mapping table:

> For each OpenPencil store action / command type, what is the corresponding Craft Agents (二开补强) `ActionInvocation` id, payload shape, and `ActionSurface` value?

This table must be reviewed and approved by the Lead before any adapter code begins.

Required columns:

| OpenPencil command | Craft Agents (二开补强) action id | ActionSurface | Payload delta | Undo strategy |
|---|---|---|---|---|
| (one row per command type) | | | | |

### 20.3 Adapter Layer Scope

The adapter layer is the **only** place OpenPencil internals are referenced. All other Craft Agents (二开补强) code calls Craft Agents (二开补强) action ids. The adapter is owned by F-Track A lead and must not be touched by other module Workers.

Adapter responsibilities:
1. Translate a Craft Agents (二开补强) `ActionInvocation` into the correct OpenPencil command.
2. Translate OpenPencil history events back into Craft Agents (二开补强) `SessionEvent` entries.
3. Coalesce high-frequency drag / resize events before they enter the Timeline.

The adapter is **not** responsible for permission checks or timeline writes — those happen in the Hook Pipeline (M03 §9) before and after the adapter is called.

---

## 21. Concurrent Agent Write Safety

### 21.1 Batched Mutation (Required)

When multiple agents issue canvas `mutate` actions within the same render frame, the adapter **must not** trigger a full re-render per action. Instead:

- All `mutate` calls arriving within a single 16 ms render tick are collected into a **mutation batch**.
- The batch is applied to the OpenPencil document store once.
- A single re-render pass is scheduled via `requestAnimationFrame`.

Do **not** use an arbitrary `setTimeout` debounce — use the native render scheduler frame boundary.

### 21.2 Mutation Ordering Within a Batch

Mutations in the same batch are applied in `ActionInvocation.seq` order. If two mutations conflict (e.g. two agents move the same node), the higher-seq mutation wins and the lower-seq mutation is recorded as a `CONFLICT_SUPERSEDED` SessionEvent.

### 21.3 Lazy Render for Live-Content Nodes

Nodes with `contentType: 'live'` (browser embeds, video frames, AIGC placeholders) obey these rules:

1. **Off-viewport → immediately suspend.** When a live node scrolls or zooms out of the visible viewport, its embedded renderer is unmounted. A static placeholder thumbnail (last captured frame) is shown instead.
2. **Re-entry → lazy resume.** When a live node re-enters the viewport, rendering resumes after a 200 ms settle delay (avoids thrashing during fast pan / zoom).
3. **Zoom threshold.** If canvas zoom drops below 25 %, all live nodes are replaced with static thumbnails regardless of viewport position.

The adapter emits viewport-change events to the canvas store so the lazy-render manager can respond.

## 17. Non-Goals & Prohibitions

- **No iframe DOM Mutation:** Do not use iframe DOM mutation or simple browser overlays for design edits. All canvas modifications must compile to the native design document engine.
