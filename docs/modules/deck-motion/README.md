# Deck and motion module

Design state: `breadth`; implementation status: `not implemented`; development order: R13. A native deck document owns
content; PPTX, HTML, PDF and video are explicit exports with visible fidelity limits. Acceptance:
`DECK-001` creates a native document; `DECK-002` edits through governed actions; `DECK-003`
exports a real format with fidelity limits; `DECK-004` preserves source and output separately.

Craft starting point: reuse the Electron shell, Workspace files, existing preview/document
surfaces, Session permission/timeline paths and R5/R11 ArtifactRef/Job seams. Only the native
deck document and honest exporters are NEW.

## Reality and activation sequence

No native deck or motion document/exporter exists (`rg -n "deck|slide|pptx|composition|Remotion"
app/packages app/apps`). Activation is: define the source model, select/licence an exporter, add a
fixture deck with fidelity assertions, route edits through the governed action seam, then expose
P-41/P-42. An HTML mock is not a deck capability.
