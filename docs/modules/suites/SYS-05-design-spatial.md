# SYS-05 — Design, web and spatial workspace

**Rows:** CREATE-01, CREATE-06, CREATE-07, CREATE-09, CREATE-11, CORE-11, INFO-02, INFO-05.
**Owner:** native design/web/document schemas and canvas projection. **Depends on:** SYS-01 actions
and ArtifactRef. **Authority:** native content models; canvas owns viewport/layout only.
**Development order:** R7, R10, R13, then R18 layout closure.
**Craft base:** Electron shell, TipTap/preview hosting, Workspace files, Session/Task/timeline and
permission paths; this suite adds native documents/projections without replacing any of them.

## Closed loop

Intent/reference → native artifact → spatial projection → governed mutation → preview/animation →
versioned export/ArtifactRef.

## First proof

Create one native artifact, project it on canvas, issue one governed mutation, preview it in an
isolated frame, save a version and restore the prior version. Benchmark the renderer in Electron
before selecting xyflow or another layer; FlowGram informs editor seams, not the renderer decision.

## Acceptance and references

Use `CAN-001..004`, `DSN-001..004`, `CREATE-01-A`, `CREATE-06-A`, `CREATE-07-A`, `CREATE-09-A`,
`CREATE-11-A`, `INFO-02-A`, `INFO-05-A`. Standing source comparison is xyflow, FlowGram and Penpot.
tldraw is license-gated interaction evidence; owner-provided Figma/Open Design observations remain
product evidence. Open a different source only for a named gap these cannot cover.

## Stop conditions

Stop on renderer-owned business state, iframe source mutation, unversioned export, license failure,
or a canvas action bypassing SYS-01.

---

## Module boundary — Canvas and spatial orchestration module

> Merged here from `docs/modules/canvas/README.md` on 2026-09-21. That directory held a
> 45-line compatibility record referenced by exactly one document
> (`14-MODULE-ARCHITECTURE.md`) and by neither `PACKET-INDEX.md` nor this suite, so working on this
> loop meant reading two files that never linked to each other. One loop, one document.

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
- format adapters preserve original source ArtifactRefs; Figma/PSD/AI and similar proprietary formats
  are supported only through verified export/API/parser adapters with an explicit fidelity class.
- the canvas projects the shared WorkTrace: exact operation/attempt ids, current/shadowed/derived
  results and immutable artifact versions; selecting a node resolves a target, while revising creates
  a new branch and never overwrites the source or downstream history.

The inspected xyflow symbols and the unapproved tldraw license boundary are recorded as `AV-CAN-01`
and `AV-CAN-02` in [`../../references/ADMISSION-V2-AUDIT.md`](../../references/ADMISSION-V2-AUDIT.md).
Both are evidence/candidate status only. The renderer is not selected until the Electron rich-card,
concurrent-update and media-proxy benchmark passes and the business-state projection remains
renderer-independent.

FlowGram is retained for its editor/document/command/plugin separation, not as Fleet's workflow
runtime. Canvas and workflow state continue to project Fleet's native authorities.

Activation acceptance: `CAN-001` projects real Session/Task/Artifact and WorkTrace records without a canvas store;
`CAN-002` pan/zoom/select/group without timeline noise; `CAN-003` invokes one governed action;
`CAN-004` passes the rich-card/concurrent-update/media benchmark before renderer commitment;
`CAN-005` imports one real external design artifact, preserves the original, reports fidelity and
restores a prior derived version without mutating the source; its trace identifies the exact operation
and artifact version and preserves old/downstream branches when a prior step is revised.

#### Reality and activation sequence

No canvas route or persisted projection exists (`rg -n "ReactFlow|tldraw|canvas" app/apps/electron/src
app/packages`). Activation is: (1) define projection records and a fixture from existing Session/
Task events; (2) benchmark candidate renderers in the real Electron shell; (3) route one governed
action without a canvas store; (4) exercise concurrent update, empty/offline/denied and restart
states. A renderer demo alone cannot promote this module.

---

## Module boundary — Native design surface module

> Merged here from `docs/modules/design/README.md` on 2026-09-21. That directory held a
> 23-line compatibility record referenced by exactly one document
> (`14-MODULE-ARCHITECTURE.md`) and by neither `PACKET-INDEX.md` nor this suite, so working on this
> loop meant reading two files that never linked to each other. One loop, one document.

Design state: `breadth`; implementation status: `not implemented`; development order: R10. Design data is native,
transactional and inspectable; the spatial canvas is only its projection. Acceptance: `DSN-001`
commits schema-valid mutation batches; `DSN-002` preserves attribution; `DSN-003` shares one
document model between canvas and native editor; `DSN-004` passes license/renderer review.

Craft starting point: reuse the Electron shell, Workspace files, existing editor/preview hosting,
Session permission/timeline and R4/R5 Action/ArtifactRef seams. Only the native structured
design document and its transactional editor are NEW.

Format migration is part of the design Component contract. Figma/PSD/PSB/AI adapters must retain
the original source, produce an ImportReceipt and state whether the result is lossless, structured
with limits, visual-reference only or unsupported. SVG/PDF/PNG fallback is allowed, but never shown
as native editable support. Export and restore create new lineage versions and use the same
transactional Action path as human and Agent edits.

#### Reality and activation sequence

No native design document/editor authority is present (`rg -n "design.*document|Penpot|design editor"
app/packages app/apps`). Activation is: choose an audited mechanism and license, define the schema
and transaction batch, add attribution/inverse fixtures, then connect the canvas projection and
P-39 editor. Until a real document round-trip exists, this remains `not implemented`.

