# SYS-06 — AIGC and media production

**Rows:** CREATE-02..16, ORCH-05, INFO-02, INFO-04, INFO-07. **Owner:** native sequence/document/
scene models and media/render Job adapters. **Depends on:** SYS-01 JobRef, actions and permissions.
**Development order:** R11–R13.
**Craft base:** Electron shell, Workspace files, previews, background execution, Session/Task,
permission and timeline evidence; only native media models and bounded render/provider adapters are
new.

## Closed loop

Prompt/source/reference → text/document/image/audio/video/3D asset → analysis/storyboard/captions/
multi-angle/relight/panorama → sequence/document → cancellable render Job → ArtifactRef → delivery.

## First proof

Import real media, perform one shared trim/split operation, render a real output with cancellation,
persist source/output provenance and expose failure/retry. Agent and human edits call one operation.

## Acceptance and references

Use `VID-001..004`, `CREATE-02-A` through `CREATE-16-A`, `JOB-001..004` and `CREATE-12-A`. Audit
OpenCut/opencut-classic, React Video Editor/Cutia/OpenReel, LosslessCut, Shotcut, Remotion,
Hyperframes, FFmpeg adapters, pyvideotrans, baocut, OpenMontage, video-use, Storyboard, Palmier,
Toonflow, waoowaoo and ChatCut; exact candidates are in `references/video/`.

## Stop conditions

Stop on non-cancellable render, missing provenance, provider-owned job state, or a 3D/panorama/shot
feature bypassing the native media model.

---

## Module boundary — Deck and motion module

> Merged here from `docs/modules/deck-motion/README.md` on 2026-09-21. That directory held a
> 17-line compatibility record referenced by exactly one document
> (`14-MODULE-ARCHITECTURE.md`) and by neither `PACKET-INDEX.md` nor this suite, so working on this
> loop meant reading two files that never linked to each other. One loop, one document.

Design state: `breadth`; implementation status: `not implemented`; development order: R13. A native deck document owns
content; PPTX, HTML, PDF and video are explicit exports with visible fidelity limits. Acceptance:
`DECK-001` creates a native document; `DECK-002` edits through governed actions; `DECK-003`
exports a real format with fidelity limits; `DECK-004` preserves source and output separately.

Craft starting point: reuse the Electron shell, Workspace files, existing preview/document
surfaces, Session permission/timeline paths and R5/R11 ArtifactRef/Job seams. Only the native
deck document and honest exporters are NEW.

#### Reality and activation sequence

No native deck or motion document/exporter exists (`rg -n "deck|slide|pptx|composition|Remotion"
app/packages app/apps`). Activation is: define the source model, select/licence an exporter, add a
fixture deck with fidelity assertions, route edits through the governed action seam, then expose
P-41/P-42. An HTML mock is not a deck capability.

---

## Module boundary — AIGC and rendering jobs module

> Merged here from `docs/modules/jobs/README.md` on 2026-09-21. That directory held a
> 25-line compatibility record referenced by exactly one document
> (`14-MODULE-ARCHITECTURE.md`) and by neither `PACKET-INDEX.md` nor this suite, so working on this
> loop meant reading two files that never linked to each other. One loop, one document.

Design state: `breadth`; implementation status: `not implemented`; development order: R11–R13. Generation, media analysis,
render and export work must use one cancellable, resource-aware Job seam and return ArtifactRefs.
Each Job is correlated to one operation/attempt and exact input/output ArtifactRef versions; component
and provider revisions, caller provenance, recovery state and idempotency evidence are recorded in the
shared Session/Action path. High-frequency progress is a live projection; durable Job boundaries and
terminal results are the recoverable facts.
Acceptance: `JOB-001` shows queue/progress; `JOB-002` supports cancel/retry/failure; `JOB-003`
returns one versioned ArtifactRef; `JOB-004` enforces resource limits without silent loss. These
short IDs are implementation subcriteria for canonical `ORCH-05-A` (the shared Job authority);
export/delivery acceptance is separately canonical `CREATE-12-A` and must not be silently substituted
by a generic job criterion.

#### Reality and activation sequence

No Fleet Job queue or ArtifactRef authority is present (`rg -n "Job|job queue|ArtifactRef|retry"
app/packages app/apps`). Activation is: define the Job adapter over one existing TaskRunner seam,
add a deterministic fixture and resource limits, prove progress/cancel/retry/failure and restart,
then expose P-49/P-45. Placeholder progress cannot be reported as wired.

This is a Fleet seam to extend, not permission to import a reference job system. The first
implementation must bind to `app/packages/server-core/src/tasks/TaskRunner.ts` and the existing
SessionManager cancellation path, then prove restart, resource-limit and ArtifactRef behavior
before any external queue is considered.

---

## Module boundary — Video and media editing module

> Merged here from `docs/modules/video/README.md` on 2026-09-21. That directory held a
> 57-line compatibility record referenced by exactly one document
> (`14-MODULE-ARCHITECTURE.md`) and by neither `PACKET-INDEX.md` nor this suite, so working on this
> loop meant reading two files that never linked to each other. One loop, one document.

Design state: `breadth`; implementation status: `not implemented`; development order: R12.

This module is a native Fleet media surface, not a second task, file, permission, timeline, or
artifact authority. It combines a human-editable multi-track timeline with governed Agent edit
commands, media analysis, captions, generation jobs, preview and honest export.

Media import/export follows the common adapter contract: original media/project inputs remain
referenced by ArtifactRef, edits are versioned, renders are cancellable Jobs, and retries/recovery
must not duplicate outputs. A component may provide codecs, transcription or renderer dependencies
on demand; unsupported project formats receive a named conversion/fidelity result rather than a
false editable claim.

#### Compatibility record

- Craft/Fleet: EXTEND existing sessions, permissions, timeline evidence, files, ArtifactRef, Job and
  Workbench seams; no second media project store outside the module's native sequence document.
- Native authority: `Sequence`, `Track`, `Clip`, `Marker`, `Caption`, `Effect` and keyframe data.
- Core authorities consumed: Project/Workspace, Session, Action, Permission, Timeline, ArtifactRef,
  Job, Cost ledger and Panel host.
- Adapter boundary: `VideoEditCommand`, `MediaProbeAdapter`, `PreviewAdapter`, `RenderAdapter`.
- Compatibility gates: real Electron timeline benchmark; main-process render/cancellation path;
  provenance and stale-writer behavior; license review for every renderer/editor dependency.
- Standing references: OpenCut classic for implemented NLE operations, current OpenCut for direction
  only, HyperFrames for deterministic composition/render cancellation, and FFmpeg for the replaceable
  media engine. ChatCut remains product behavior only; Remotion is license-gated evidence. The
  historical pool is not a default research queue.

The recovered owner-provided candidate pool is recorded in
[`../../references/video/00-CANDIDATE-INVENTORY.md`](../../references/video/00-CANDIDATE-INVENTORY.md).

The source-level evidence and ChatCut product observation are recorded as `AV-VID-01` through
`AV-VID-03` in
[`../../references/ADMISSION-V2-AUDIT.md`](../../references/ADMISSION-V2-AUDIT.md). These rows are
`INSUFFICIENT_COMPARISON`; they do not select a timeline library or authorize importing an
archived editor. The activation spike must compare the shortlisted seams against Fleet's real Electron shell,
main-process cancellation and ArtifactRef/export recovery before choosing a route.

#### Non-goals

- The canvas does not become the video editor.
- Agent prompts do not directly mutate files or invoke raw FFmpeg commands.
- A generated preview is not accepted delivery until a real render and ArtifactRef exist.

Activation acceptance: `VID-001` imports real video/image/audio; `VID-002` UI and Agent use the
same trim/split command; `VID-003` exports a real MP4 through a cancellable Job; `VID-004` records
the output ArtifactRef and failure evidence.

#### Reality and activation sequence

No native sequence, timeline, FFmpeg adapter or video route exists under `app/` today (`rg -n
"sequence|ffmpeg|video" app/apps/electron/src app/packages` is the absence check). Activation is
therefore: (1) write the sequence schema and adapter packet; (2) add a fixture media file and a
main-process cancellable render job; (3) wire one UI command and the Agent command to the same
executor; (4) run the fixture render, cancellation and restart checks. Until all four steps have
paths and evidence, status stays `not implemented`.

