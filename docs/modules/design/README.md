# Native design surface module

Design state: `breadth`; implementation status: `not implemented`; development order: R10. Design data is native,
transactional and inspectable; the spatial canvas is only its projection. Acceptance: `DSN-001`
commits schema-valid mutation batches; `DSN-002` preserves attribution; `DSN-003` shares one
document model between canvas and native editor; `DSN-004` passes license/renderer review.

Craft starting point: reuse the Electron shell, Workspace files, existing editor/preview hosting,
Session permission/timeline and R4/R5 Action/ArtifactRef seams. Only the native structured
design document and its transactional editor are NEW.

## Reality and activation sequence

No native design document/editor authority is present (`rg -n "design.*document|Penpot|design editor"
app/packages app/apps`). Activation is: choose an audited mechanism and license, define the schema
and transaction batch, add attribution/inverse fixtures, then connect the canvas projection and
P-39 editor. Until a real document round-trip exists, this remains `not implemented`.
