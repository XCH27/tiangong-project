# 07 Canvas Design Surface

## 1. Mission

Build a native infinite canvas/design surface connected to Fleet's action, permission, Library, and timeline spine.

## 2. User-Visible Loop

User creates or selects a node, edits it, agent performs equivalent edit, both changes enter timeline and native history supports undo.

## 3. Current App Reuse

Reuse session/timeline/permission, Library assets, Internal Action Registry, and panel/surface navigation.

## 4. Reference Projects

OpenPencil is the approved native design engine reference/source. Open Design informs workflow. Do not use iframe DOM mutation as the design engine.

## 5. UI Placement

Canvas is a professional surface, not the default workbench shell. It can have its own layout while sharing Fleet spine.

## 6. Backend / RPC / Locality

Canvas state is local project state. Agent actions call structured canvas actions, not DOM or screenshot operations.

## 7. Session / Timeline / Permission / Rollback

High-frequency drag/resize is coalesced into meaningful events. Undo uses native canvas history or inverse patch with evidence refs.

## 8. Data Model

Canvas document, node, layer, selection, asset reference, provenance, action id, history entry, edge/relationship.

## 9. Agent-Native Actions

Read canvas, select node(s), create node, move node, update style, group outputs, undo, export/handoff.

## 10. Files To Inspect First

- `app/packages/shared/src/protocol/internal-action.ts`
- future `canvas.ts` protocol once frozen
- renderer surface/panel routes

## 11. Files Likely Touched

Canvas protocol, renderer canvas components, canvas store bridge, action services, Library integration.

## 12. Parallel Work Packages

Canvas contract/store bridge first; node rendering and action handlers after; asset integration after Library path.

## 13. File Ownership

Canvas protocol is Lead-owned. Engine adapter ownership assigned after contract freeze.

## 14. Validation Ladder

Store/action unit tests, canvas render smoke, human+agent same-object edit, undo smoke, screenshot/DOM visual check.

## 15. Done / Not Done

`usable`: human and agent edit one native canvas object with undo. `display-only`: draggable nodes without action/timeline.

## 16. Risks And Blocked Decisions

Risk: building a second asset store. Canvas assets use Library/provenance.

## 17. Engine Integration Decision

### 17.1 Decision: Integrate OpenPencil Directly

Fleet integrates OpenPencil as the canvas renderer via a thin adapter layer.
Self-building a document/command engine is off the table.

Rationale: Fleet's differentiation is not in the renderer — it is in the
human/agent shared path, Hook Pipeline, and Timeline evidence layer. Those
live entirely in Fleet's Internal Action Registry and SessionEvent stream,
not in OpenPencil internals. Letting OpenPencil own pixels while Fleet owns
semantics avoids a 5–10× self-build cost with no user-visible benefit.

### 17.2 F-Track Gate: Mapping Table Before Code

The first deliverable of F-Track is **not** code. It is a mapping table:

> For each OpenPencil store action / command type, what is the corresponding
> Fleet `ActionInvocation` id, payload shape, and `ActionSurface` value?

This table must be reviewed and approved by the Lead before any adapter code
begins. Without it, the adapter seam becomes the hardest maintenance surface
in the codebase.

Required columns:

| OpenPencil command | Fleet action id | ActionSurface | Payload delta | Undo strategy |
|---|---|---|---|---|
| (one row per command type) | | | | |

### 17.3 Adapter Layer Scope

The adapter layer is the **only** place OpenPencil internals are referenced.
All other Fleet code calls Fleet action ids. The adapter is owned by F-Track
lead and must not be touched by other module workers.

The adapter is responsible for:
1. Translating a Fleet `ActionInvocation` into the correct OpenPencil command.
2. Translating OpenPencil history events back into Fleet `SessionEvent` entries.
3. Coalescing high-frequency drag/resize events before they enter the Timeline.

The adapter is **not** responsible for permission checks or timeline writes —
those happen in the Hook Pipeline (Module 03 §9) before and after the adapter
is called.
