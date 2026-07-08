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
