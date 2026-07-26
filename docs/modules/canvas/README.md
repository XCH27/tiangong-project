# Canvas and spatial orchestration module

Design state: `breadth`; implementation status: `not implemented`; development order: R7.

The canvas is a projection and command surface. It owns layout, viewport and grouping; native
authorities own tasks, sessions, artifacts, media projects, jobs, permissions and workflows.
Its Craft starting point is the existing Electron shell plus Session/optional Task/timeline
projections; it is a new surface inside that shell, never a replacement workbench or runtime.

Compatibility gates:

- renderer-independent projection model before renderer commitment;
- xyflow and FlowGram source evidence plus license-gated tldraw comparison recorded under `docs/references/`;
- rich-card, concurrent-update and media-proxy benchmark in the real Electron shell;
- no canvas-local task, permission, file, job or timeline store;
- native editors open as focused surfaces rather than being embedded in every node.

The inspected xyflow symbols and the unapproved tldraw license boundary are recorded as `AV-CAN-01`
and `AV-CAN-02` in [`../../references/ADMISSION-V2-AUDIT.md`](../../references/ADMISSION-V2-AUDIT.md).
Both are evidence/candidate status only. The renderer is not selected until the Electron rich-card,
concurrent-update and media-proxy benchmark passes and the business-state projection remains
renderer-independent.

FlowGram is retained for its editor/document/command/plugin separation, not as Fleet's workflow
runtime. Canvas and workflow state continue to project Fleet's native authorities.

Activation acceptance: `CAN-001` projects real Session/Task/Artifact records without a canvas store;
`CAN-002` pan/zoom/select/group without timeline noise; `CAN-003` invokes one governed action;
`CAN-004` passes the rich-card/concurrent-update/media benchmark before renderer commitment.

## Reality and activation sequence

No canvas route or persisted projection exists (`rg -n "ReactFlow|tldraw|canvas" app/apps/electron/src
app/packages`). Activation is: (1) define projection records and a fixture from existing Session/
Task events; (2) benchmark candidate renderers in the real Electron shell; (3) route one governed
action without a canvas store; (4) exercise concurrent update, empty/offline/denied and restart
states. A renderer demo alone cannot promote this module.
