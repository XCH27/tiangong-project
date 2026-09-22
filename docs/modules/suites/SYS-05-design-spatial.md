# SYS-05 — Design, web and spatial workspace

**Rows:** CREATE-01, CREATE-06, CREATE-07, CREATE-09, CREATE-11, CREATE-16, CORE-11, INFO-02, INFO-05.
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
within the DOM-family decision E5a before admitting a dependency; FlowGram informs editor seams, not the renderer decision.

## Acceptance and references

Use `CAN-001..005`, `DSN-001..004`, `CREATE-01-A`, `CREATE-06-A`, `CREATE-07-A`, `CREATE-09-A`,
`CREATE-11-A`, `CREATE-16-A`, `INFO-02-A`, `INFO-05-A`. xyflow, FlowGram and Penpot are comparison starting points,
not selected winners; tldraw remains license-gated interaction evidence. For each concrete task,
compare the current path, the design software's native editor/API and a relevant alternative.
Take only demonstrated frontend/backend improvements under `PRODUCT.md`; a shared document owner
must not be duplicated just to add agent access. Current source/official-API evidence lives in
[`../../references/REFERENCE-REGISTRY.md`](../../references/REFERENCE-REGISTRY.md).

## Stop conditions

Stop on renderer-owned business state, iframe source mutation, unversioned export, license failure,
or a canvas action bypassing SYS-01.

---

## Module boundary — Canvas and spatial orchestration module


First-slice readiness: see PACKET-INDEX and the execution contracts below. implementation status: `not implemented`; development order: R7.

The canvas is the shared production board: people and Agents generate, edit and arrange media,
websites and decks here. It hosts native editors and projects their state; it owns layout, viewport
and grouping while native authorities own document/sequence/task/job/permission truth. Projection
is a state-ownership boundary, never a ban on direct editing.
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

The inspected xyflow symbols and the unapproved tldraw license boundary are recorded in the
[reference registry](../../references/REFERENCE-REGISTRY.md).
Both are evidence/candidate status only. The DOM family is decided; library admission waits until the Electron rich-card,
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


First-slice readiness: see PACKET-INDEX and the execution contracts below. implementation status: `not implemented`; development order: R10. Design data is native,
transactional and inspectable; the spatial canvas is only its projection. Acceptance: `DSN-001`
commits schema-valid mutation batches; `DSN-002` preserves attribution; `DSN-003` shares one
document model between canvas and native editor; `DSN-004` passes license/renderer review.

Craft starting point: reuse the Electron shell, Workspace files, existing editor/preview hosting,
Session permission/timeline and R4/R5 Action/ArtifactRef seams. Only the native structured
design document and its transactional editor are NEW.

Format migration is part of the design Component contract. Figma/PSD/PSB/AI adapters must retain
the original source, produce an ImportReceipt and state whether the result is lossless, structured
with limits, visual-reference only or unsupported. SVG/PDF conversion may preserve a tested editable subset; flattened output is visual-reference
only. Report actual retained structure, not fidelity inferred from the extension. Export and restore create new lineage versions and use the same
transactional Action path as human and Agent edits.

#### Reality and activation sequence

No native design document/editor authority is present (`rg -n "design.*document|Penpot|design editor"
app/packages app/apps`). Activation is: choose an audited mechanism and license, define the schema
and transaction batch, add attribution/inverse fixtures, then connect the canvas projection and
P-39 editor. Until a real document round-trip exists, this remains `not implemented`.

## Native document editing (INFO-05 / CREATE-16, R10)

R3 exercises existing Markdown preview and file tools only. R10 owns direct document editing;
R13 adds advanced deck/motion behavior. Each format gets a real open → human edit → Agent edit →
save → reopen proof against a native owner. Do not force DOCX, XLSX, PPTX or PDF through TipTap.
Reuse TipTap for its supported Markdown/text domain; compare GenOffice and format-specific engines
for the other domains. A parser, converter, generic PDF viewer or common framework is not selection
proof. Source evidence is in the reference registry; no editor dependency is admitted yet.

Separate preview, extraction, annotations/forms, structural edits, formula/chart preservation and
native save-back in the format capability declaration. An import preserves the original and records
adapter revision, retained/unsupported constructs, missing fonts/assets and recovery. A claimed
lossless round trip is limited to its tested feature set and application versions. The user can
inspect/revise a real file; a flattened image or PDF is not Office editing. Generation applies
validated document changes and preserves intervening human edits. Handle dirty drafts, external
file changes, save failure, unsupported migration and crash recovery without silent overwrite.

## Spatial and web details

Canvas card deletion removes a binding, not the referenced artifact. Gesture previews commit one
revisioned mutation on gesture end; multi-move/group is atomic or explicitly rejected. Restore
keeps unknown renderer/entity IDs as safe placeholders. Domain jobs survive hidden/unmounted
views. Agents may reveal authorized content without persistently rearranging the user's layout or
stealing focus. The edge classes, staging and workflow modes are owned by `../../13-ORCHESTRATION.md`.

A web artifact is normal workspace source plus only the metadata its real preview/build consumer
needs. Preview is isolated through the existing browser/preview owner; no canvas-owned HTML blob
or external-site mutation. Failed builds preserve the last successful output; missing assets and
stale source versions expose recovery. Deployment is a separate explicitly authorized operation.

## Format proof matrix

This matrix specifies adapter admission tests, not current format support. Run each candidate on
the same versioned corpus and preserve originals. Record engine/application version, retained
object counts/properties, unsupported features, warnings and save/reopen results. The receipt's
fidelity class is `lossless-within-tested-subset`, `structured-with-limits`, `visual-reference` or
`unsupported`; no extension alone earns a class. Every declared supported construct must survive
the corpus; a single silent loss fails the claimed class. Compare untouched package entries where
the adapter promises preservation. Human and Agent must invoke the same native operation owner.

| Format / first task | Candidate comparison and native owner | Minimum fixed corpus / failure case | Selection boundary |
|---|---|---|---|
| Markdown/text | Current Craft TipTap/Markdown path versus a narrow local consumer correction | headings, table, image, code fence, Unicode; external edit while dirty | Preserve tested Markdown structures and warn on unsupported round trips; no Office claim. |
| DOCX | GenOffice's currently inspected document facilities versus the existing bundled DOCX tool plus a native editor candidate only after its source/closure review | styles, numbering, sections, header/footer, table, image, tracked changes; missing font, locked file | Bundled generation/extraction is baseline evidence, not human editing. If neither supplies native editing, retain unsupported state and issue the exact missing-editor requirement. |
| XLSX | GenOffice workbook/package gateway versus current bundled XLSX operation path | formulas/references, dates/number formats, merged cells, chart, hidden sheet, named range; invalid formula and external change | Check formulas and preserved package parts, not cached displayed values alone. Calculation engine/version must be explicit. |
| PPTX | GenOffice PPTX operations versus current bundled PPTX path; reuse that owner for R13 | masters/theme, text box, image, table/chart, grouped shape, notes; missing font and invalid batch | Check native editable objects, ordering and unchanged parts; raster slides fail editable support. |
| PDF | Current bundled PDF tools versus EmbedPDF only after its runtime/save-path source audit | text page, scanned page, form, annotation, rotated page; password and malformed input | Declare page operations, annotation/forms and text-content editing separately. A viewer or overlay does not pass content edit/save-back. |
| SVG / native design | OpenPencil transaction owner versus bounded SVG-Edit, using native Penpot API as outside-tool control | nested groups/transforms, text/font, vector paths, gradients, image; invalid batch, stale revision | Select only after shared human/Agent edits and inverse/save recovery; do not import a second project authority. |
| PSD/PSB | Checked OpenShop path versus installed Krita/GIMP conversion/API route | layers, masks, blend modes, text and linked asset; unsupported adjustment/smart object | Preserve originals and feature-level loss; restricted runtime/license or no proven save-back leaves conversion/external editing only. |
| AI / FIG | Verified parser/export/native-app API path against the original application | editable paths/text, components, font and embedded assets | No verified universal native write-back. Use declared SVG/PDF/structured conversion or native-app operation; never relabel conversion as lossless native editing. |
| WPS/ET/DPS | Standard Office export through installed WPS or explicitly authorized official conversion, then the Office adapter | formula/chart/layout and missing-font examples plus converter failure | No verified independent native writer. Explicit conversion or outside-tool operation only; hosted conversion never becomes a local-core prerequisite. |

The current source locks and exact format limits are in the registry's
[format candidates](../../references/REFERENCE-REGISTRY.md#format-editor-candidates-checked-against-the-compatibility-question)
and [native software comparison](../../references/REFERENCE-REGISTRY.md#native-design-software-and-targeted-github-checks).
Uninspected candidate save paths are the bounded proof's first source-review step; their presence
in this table does not assert a working editor. External software operation belongs to the existing
outside-tool route or R16 Component and cannot substitute for the required in-workbench editor.

## Renderer proof budget

Use the canvas note's fixed scene in real Electron on the same declared hardware, viewport, DPR
and build mode for both candidates. The following are initial acceptance targets, **not measured
results**: 10-minute interaction/update run; p95 frame interval at most 32 ms during pan/drag;
no interaction freeze exceeding 200 ms caused by a normal insertion batch; no lost approval/error/
terminal event. After three heavy-scene enter/leave cycles and an idle collection period, retained
process memory must plateau within 10% of the first stabilized cycle; separately record GPU/decoder
memory where available. No hidden video continues decoding after its documented release boundary.
One focused original-quality video is the test, not twenty simultaneous 4K decoders.

Compare React Flow with the custom DOM/SVG projection using the same real card bodies and media
policy. Do not change fixtures/budgets for one candidate. A failed threshold gets a bounded fix or
an explicit contract revision with evidence; it cannot be silently downgraded to pass. The lower-end
Windows/GPU path is required before broad release; a local Apple Silicon result proves only that
platform. Persist no renderer-owned domain state to meet a performance target.

## Refreshed editor and format evidence

[Refresh mechanisms](../../references/REFERENCE-REGISTRY.md#refresh-mechanisms-and-counter-evidence)
identify exact current source paths and their limits. GenOffice's Sheets architecture describes a
partial snapshot/journal PoC; its newer sidecar exposes archive and recalculation methods. Neither
that old gap list nor the existence of those methods proves editable XLSX fidelity. INFO-05 must
exercise the existing format matrix: preserve the original, compare untouched package entries,
validate an output staged outside the source, then publish through the native document owner's
atomic save. The inspected Rust `save_archive` creates its destination directly and therefore
cannot itself prove atomic replacement. Close may cancel pure queued reads, never abandon a queued
save or required cleanup. HTML-to-DOCX decoration rasterization must be reported as loss of native
editability for those objects.

OpenPencil's `packages/op-web-sdk/README.md` explicitly describes a read-only `.op` viewer. CREATE-06
must use a reviewed editing owner and prove human/Agent mutation; embedding that SDK is only a
viewer. Penpot's refreshed token-change schema uses UUID theme/set identities, so native-change
version/migration checks cannot rely on older payloads.

For CREATE-07, Hyperframes' draft/commit and subscription disposal are bounded comparison mechanisms.
Its adapter requires same-origin access, ignores a requested hit-test time, and can return from
commit without a dispatch callback. Preserve Fleet's isolated preview boundary, exact captured
revision and coordinate space. Save success requires the document owner's durable receipt; a
visual drag or annotation is not one. Open Design's development handoff adds a useful real-output
fixture: a skipped or 404 preview bake is a failure even if an enclosing job exits successfully.

## Execution contracts

These sections own the next step for the listed capability IDs. Read the
[common execution contract](../../14-MODULE-ARCHITECTURE.md#executable-next-step-contract)
and the release/spec anchor in [PACKET-INDEX](../PACKET-INDEX.md). Gates do not open merely
because this packet has instructions. Planned regression targets below do not exist yet unless
implementation has added them; extend a matching existing behavioral test instead of duplicating it.

### Execution INFO-05

**Document editing and preview**

- **Next:** `PROVE` — R10 after R4/R5/R7; R3 preview only.
- **Sources:** [`packages/server-core/src/handlers/rpc/resources.ts`](../../../app/packages/server-core/src/handlers/rpc/resources.ts); [`packages/shared/src/resources/resource-bundle.ts`](../../../app/packages/shared/src/resources/resource-bundle.ts); [`apps/electron/src/renderer/components/right-sidebar/SessionFilesSection.tsx`](../../../app/apps/electron/src/renderer/components/right-sidebar/SessionFilesSection.tsx).
- **Deliver:** Run the format matrix below for direct human editing and the same Agent operation. Start with existing Markdown/text capability, then admit one native Office/PDF adapter at a time.
- **Data:** One native document owner per format holds document ID/schema/revision/draft and source ArtifactRef. Save-back produces an acknowledged format-native revision; extracted text is not the editable owner.
- **Failure:** Dirty draft, external modification, unsupported construct, locked file and crash preserve source and recovery copy. Lossless is limited to the tested features/application versions.
- **Proof:** INFO-05-A — Open → human edit → Agent edit → save → reopen plus undo/conflict/crash on each claimed format; compare retained objects/formulas/fonts/layout, not just a screenshot. Planned regression/probe target relative to `app/`: `scripts/probes/info-05.ts`. After adding the target, run from `app/`: `bun run scripts/probes/info-05.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft TipTap/bundled tools for supported text; GenOffice PPTX transactions/XLSX package save; format-specific engines from the compatibility registry. No blanket Office editor selection. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution CREATE-01

**Spatial canvas and orchestration**

- **Next:** `PROVE` — R7 after R4/R5 and minimum registered host.
- **Sources:** [`apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx`](../../../app/apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx); [`packages/shared/src/resources/resource-bundle.ts`](../../../app/packages/shared/src/resources/resource-bundle.ts); [`packages/shared/src/protocol/dto.ts`](../../../app/packages/shared/src/protocol/dto.ts).
- **Deliver:** Define a renderer-independent board projection and benchmark React Flow against the named custom DOM/SVG fallback; prove one editable artifact and governed insertion before dependency admission.
- **Data:** Canvas owns card/binding ID, layout, viewport and grouping. Native Artifact/Session/Task/Job/document IDs and versions are references; the same domain editor serves person and Agent.
- **Failure:** Offscreen media releases resources; unknown entities restore as placeholders. Gesture commits are atomic/versioned; Agent insertion is idempotent and never steals persistent layout.
- **Proof:** CREATE-01-A — CAN-001..005 and the 2,000-card/media workload: measure interaction/memory, edit/save/restore one real artifact, concurrent insertion and renderer failure, preserving all source versions. Planned regression/probe target relative to `app/`: `scripts/probes/create-01.ts`. After adding the target, run from `app/`: `bun run scripts/probes/create-01.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** xyflow immutable changes/observer cleanup; Cowart placeholder/result and annotation interactions; tldraw SDK remains license-gated, FlowGram only workflow-editor evidence. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution CREATE-06

**Design editor**

- **Next:** `PROVE` — R10 after R4/R5/R7.
- **Sources:** [`packages/shared/src/resources/resource-bundle.ts`](../../../app/packages/shared/src/resources/resource-bundle.ts); [`packages/server-core/src/handlers/rpc/resources.ts`](../../../app/packages/server-core/src/handlers/rpc/resources.ts); [`apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx`](../../../app/apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx).
- **Deliver:** Prove a small native design document with selection, text/vector/image objects and transactional human/Agent edits; compare native software APIs and admitted editor mechanisms before choosing an engine.
- **Data:** Design document owns stable object IDs, schema/revision, geometry/style/assets and operation history. Canvas projects it; FIG/PSD/AI import is an adapter, not the native authority.
- **Failure:** Batch prevalidation and expected revision prevent half-edits/stale overwrites. Missing assets/fonts, unsupported import and failed save remain recoverable with original retained.
- **Proof:** CREATE-06-A — Same batch from UI/Agent, invalid mid-batch operation, undo after concurrent edit, crash/save/reopen and one external-format import with feature-level receipt. Planned regression/probe target relative to `app/`: `scripts/probes/create-06.ts`. After adding the target, run from `app/`: `bun run scripts/probes/create-06.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** OpenPencil EditorState/save acknowledgement, Penpot validated changes and Open Design lineage; vendor/prebuilt/MPL/AGPL boundaries stay explicit in reference admission. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution CREATE-07

**Web artifact editor/preview**

- **Next:** `IMPLEMENT` — R10 after R4/R5/R7.
- **Sources:** [`apps/electron/src/main/browser-pane-manager.ts`](../../../app/apps/electron/src/main/browser-pane-manager.ts); [`packages/shared/src/resources/resource-bundle.ts`](../../../app/packages/shared/src/resources/resource-bundle.ts); [`packages/server-core/src/handlers/rpc/resources.ts`](../../../app/packages/server-core/src/handlers/rpc/resources.ts).
- **Deliver:** Use workspace HTML/CSS/source files as the web artifact; wire edit → isolated local preview → source diff → versioned save/export through the current host.
- **Data:** Workspace files own source; build manifest pins source/assets/tool revision and output. Annotation is a request against a captured version, not a saved mutation.
- **Failure:** Preview cannot access privileged preload/credentials. Build failure retains last successful output; HMR/navigation invalidates stale annotation. Deployment requires its own explicit authorization.
- **Proof:** CREATE-07-A — Edit a local page, annotate at zoom/scroll, change source while feedback is pending, trigger build error and reopen prior version. Verify preview isolation and source/output distinction. Planned regression/probe target relative to `app/`: `apps/electron/src/main/__tests__/fleet-create-07.test.ts`. After adding the target, run from `app/`: `bun test apps/electron/src/main/__tests__/fleet-create-07.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft BrowserPane first; Cindy selection/capture, OpenChamber composer attachment, Open Design source/history; reject same-origin script preview or CDN injection. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution CREATE-11

**Templates, brand kits and reusable assets**

- **Next:** `IMPLEMENT` — R10/R13 with INFO-02 and real document consumers.
- **Sources:** [`packages/shared/src/resources/resource-bundle.ts`](../../../app/packages/shared/src/resources/resource-bundle.ts); [`packages/shared/src/sources/storage.ts`](../../../app/packages/shared/src/sources/storage.ts); [`packages/server-core/src/handlers/rpc/resources.ts`](../../../app/packages/server-core/src/handlers/rpc/resources.ts).
- **Deliver:** Add reusable template/brand assets as Library projections; apply to one native document through the same operation path as manual edits.
- **Data:** Asset/template pins ArtifactRef version, schema compatibility, source/license, tokens and required assets/fonts. Application creates derived document lineage, never mutates vendor originals.
- **Failure:** Incompatible version/missing asset or denied source prevents partial application; rollback restores document revision conditionally and keeps imported user assets.
- **Proof:** CREATE-11-A — Apply then revise a template with missing font/image and intervening human edit; prove exact origin/version and no overwrite of original or unrelated document data. Planned regression/probe target relative to `app/`: `packages/shared/src/resources/__tests__/fleet-create-11.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/resources/__tests__/fleet-create-11.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft resources; Open Design template/source evidence and native document engine. A remote template catalogue cannot execute code or grant permissions. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution CREATE-16

**Long-form narrative and content generation**

- **Next:** `IMPLEMENT` — R10 native document first.
- **Sources:** [`packages/shared/src/resources/resource-bundle.ts`](../../../app/packages/shared/src/resources/resource-bundle.ts); [`packages/server-core/src/sessions/SessionManager.ts`](../../../app/packages/server-core/src/sessions/SessionManager.ts); [`packages/shared/src/agent/core/pre-tool-use.ts`](../../../app/packages/shared/src/agent/core/pre-tool-use.ts).
- **Deliver:** Generate/outline/revise long-form content as versioned proposed document operations, then apply through the native document owner with human-edit conflict detection.
- **Data:** Generation binds source document revision, selection/ranges, prompt/model and evidence references; output is a diff/operation set and derived version, not replacement chat text.
- **Failure:** Streaming remains draft until validated commit. Cancel, stale selection, partial generation and unsupported schema preserve human edits and previous versions.
- **Proof:** CREATE-16-A — Human edits during generation, canceled stream, missing citation and save failure; apply valid changes only, with inspectable provenance and conditional undo. Planned regression/probe target relative to `app/`: `packages/shared/src/resources/__tests__/fleet-create-16.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/resources/__tests__/fleet-create-16.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft Session/file operations; native document engine from INFO-05. Do not introduce a second narrative editor or history store. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).
