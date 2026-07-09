# 07 Canvas Design Surface Specification

## 1. Purpose
Integrate the React canvas design SDK (`ZSeven-W/openpencil`) to render infinite whiteboard surfaces and enable agent-human co-editing.

## 2. Non-Goals
-   Do not use the Vue version (`open-pencil/open-pencil`).
-   Do not create a secondary session database.

## 3. Inputs
-   `DesignAction` coordinate and property payloads.

## 4. Outputs
-   Timeline events containing canvas changes.
-   Canvas document JSON/PNG file exports.

## 5. State Model
-   Canvas document structures (`CanvasNode`, `CanvasEdge`, Viewport).

## 6. Dependencies
-   OpenPencil React engine.

## 7. Acceptance Criteria
-   `usable`: Modifying nodes via human gestures and agent RPC actions logs identically to the timeline database.

## 8. Failure & Rollback
-   Node editing errors trigger inverse patches to reverse the Canvas state.

## 9. Observability
-   Frame writes and edits log evidence to the DB timeline.

## 10. Agent Hooks
-   `canvas:createNode`
-   `canvas:updateNode`
-   `canvas:deleteNode`
