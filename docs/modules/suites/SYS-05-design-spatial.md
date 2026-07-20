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
