# SYS-06 — AIGC and media production

**Rows:** CREATE-02..05, CREATE-08..10, CREATE-12, ORCH-05, INFO-02, INFO-04, INFO-07.
**Owner:** native sequence/deck models and media/render Job adapters. **Depends on:** SYS-01 JobRef, actions and permissions.
**Development order:** R11–R13.
**Craft base:** Electron shell, Workspace files, previews, background execution, Session/Task,
permission and timeline evidence; only native media models and bounded render/provider adapters are
new.

## Closed loop

Prompt/source/reference → image/audio/video or deck → analysis/storyboard/captions →
sequence/document → cancellable render Job → ArtifactRef → delivery. Native 3D authoring, panorama
and multi-camera shot grids are excluded by PRODUCT; a research catalogue does not reopen them.

## First proof

Import real media, perform one shared trim/split operation, render a real output with cancellation,
persist source/output provenance and expose failure/retry. Agent and human edits call one operation.

## Acceptance and references

Use `VID-001..004`, `CREATE-02-A` through `CREATE-05-A`, `CREATE-08-A` through `CREATE-10-A`, `JOB-001..004` and `CREATE-12-A`. Audit
OpenCut/opencut-classic, React Video Editor/Cutia/OpenReel, LosslessCut, Shotcut, Remotion,
Hyperframes, FFmpeg adapters, pyvideotrans, baocut, OpenMontage, video-use, Storyboard, Palmier,
Toonflow, waoowaoo and ChatCut; exact candidates are in `references/video/`.

## Stop conditions

Stop on non-cancellable render, missing provenance, provider-owned job state, or a feature bypassing the native media model or reopening a PRODUCT exclusion.

---

## Module boundary — Deck and motion module


First-slice readiness: see the capability register and the execution contracts below. implementation status: `not implemented`; development order: R13. A native deck document owns
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


First-slice readiness: see the capability register and the execution contracts below. implementation status: `not implemented`; development order: R11–R13. Generation, media analysis,
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


First-slice readiness: see the capability register and the execution contracts below. implementation status: `not implemented`; development order: R12.

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
[`../../references/video/00-CANDIDATE-INVENTORY.md`](../research/video/00-CANDIDATE-INVENTORY.md).

The [reference registry](../REFERENCES.md) records source evidence for the
shortlist. ChatCut's transcript-to-time-range interaction remains product behavior only, not
implementation or license evidence. These observations do not select a timeline library or
authorize importing an archived editor. The activation spike must compare the shortlisted seams against Fleet's real Electron shell,
main-process cancellation and ArtifactRef/export recovery before choosing a route.

#### Non-goals

- The canvas may host/open the video surface, but never owns the sequence or render state.
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

## Job, sequence and export details

- Provider submission identity is persisted before dispatch and correlated with its receipt. A
  timeout or restart after submission means unknown/reconciling, not proof of failure. Reconcile
  before retrying paid/unknown work. Cancellation before dispatch differs from best-effort remote
  cancellation; late charged results remain attributable and recoverable.
- Queue admission uses bounded per-provider and local CPU/GPU/decode/render classes with fairness.
  Rate limits defer visibly; hiding a panel does not cancel work. Resource defaults come from the
  supported-hardware benchmark. Native batch is a provider adapter on the same Job path with
  item-level outcomes, not another queue or a Promise.all loop.
- Sequence edits use stable track/clip IDs and explicit time bases. Video frame timing uses a
  rational rate; audio needs a declared sample time base so frame quantization does not lose audio
  precision. Bind exact input versions, use revision checks and atomic multi-clip commands, and keep
  semantic undo separate from render cancellation and source deletion.
- Preview accuracy is explicit. Proxies, thumbnails and waveforms are derived caches; unsupported
  codecs require a named recovery. Stream-copy cuts may follow keyframes; do not promise exact
  boundaries without validating the output. Precise render and preview are separate evidence.
- Freeze a render manifest from one document revision, validate output, commit file/provenance and
  then report completion. Failed delivery preserves the rendered output for redelivery. Encoder
  process failure, cancellation and cleanup are tested through the same Job owner; FFmpeg builds,
  codecs and distribution obligations are reviewed before packaging.
- Decks own structured slides/elements, themes and optional motion tracks. Import/export declares
  a tested subset per adapter. Validate PPTX in the target viewer and compare actual editable
  elements/animation rather than accepting file creation alone. Missing media/fonts degrade the
  affected element; failed export preserves the previous output.

## Media admission fixtures

Keep one small deterministic fixture set: still image with known colors, text with a bundled test
font, constant-rate video with numbered frames, variable-rate phone-style input, stereo impulses
at known sample positions and captions with Unicode. Use synthetic/local assets, not live user
projects. Record engine/build/codec versions and license closure with each output receipt.

For CREATE-02 compare opencut-classic's command/export mechanism with a minimal native sequence
adapter over an already permitted media engine; OpenReel clock/backpressure informs the latter,
not a third editor. Pass requires exact trim/split positions within one output video frame and one
declared audio sample interval after explicit resampling, correct clip ordering, no cumulative A/V
drift beyond one frame over the fixture, and the same operation result from UI and Agent. Preview
and final render use the same frozen revision. Any output outside the supported codec/color range
is diagnosed rather than presented as faithful. Run cancel before dispatch, during render and after
output commit; kill/restart the owned worker and recover staged output without duplicating delivery.

For CREATE-08/09 compare the native document owner's existing export with a Hyperframes-derived
bounded renderer mechanism. Validate selected frame timestamps and object/asset placement against
the fixture; text/font or effect differences are reported. Remotion is an alternative only after
the license/distribution checkpoint, not a silent third candidate. For CREATE-12 test a locked
destination, insufficient space and malformed output with the same staging/receipt path.

Premiere `.prproj`, After Effects `.aep` and proprietary native histories are **not** supported by
calling a generic timeline parser. Use installed-app APIs or named interchange adapters such as
OTIO/FCP XML after the registry's source review; test cuts, source in/out, rate, transitions,
captions and missing media independently. Preserve unsupported effects as reported loss or
unavailable references. Native source projects, interchange documents and rendered outputs remain
distinct artifacts. A successful MP4 export proves neither native project editing nor round-trip
compatibility with Adobe or another NLE.

## Refreshed preview lifecycle requirement

CREATE-09 compares Hyperframes' preview draft/commit separation and composition subscription
teardown using the [new source observations](../REFERENCES.md#refresh-mechanisms-and-counter-evidence).
A replaced composition stops receiving old patches; iframe reload resynchronizes the current model;
failed dispatch restores the draft. Fleet must additionally handle asynchronous save failure and
cancelled/late work, and prove seek-before-hit-test when a time is requested. Native document edits,
preview state and render Job completion remain separate. Same-origin adapter access is not an
acceptable shortcut around untrusted content isolation.

## Execution contracts

These sections own the next step for the listed capability IDs. Read the
[common execution contract](../COMPONENT-GUIDELINES.md#executable-next-step-contract)
and the release/spec anchor in [capability register](../PROJECT-SPEC.md#capability-register). Gates do not open merely
because this packet has instructions. Planned regression targets below do not exist yet unless
implementation has added them; extend a matching existing behavioral test instead of duplicating it.

### Execution ORCH-05

**Jobs, queues and resource scheduling**

- **Next:** `IMPLEMENT` — R11 first real image producer; extend R12/R13.
- **Sources:** [`packages/server-core/src/tasks/TaskRunner.ts`](../../app/packages/server-core/src/tasks/TaskRunner.ts); [`packages/server-core/src/sessions/SessionManager.ts`](../../app/packages/server-core/src/sessions/SessionManager.ts); [`packages/shared/src/protocol/dto.ts`](../../app/packages/shared/src/protocol/dto.ts).
- **Deliver:** Extract a cancellable Job adapter from one real producer through TaskRunner: queue → submit → observe → validate output → commit ArtifactRef. Add resource classes only for actual consumers.
- **Data:** Job identity correlates Task, operation/attempt, pinned inputs/adapter revision and provider receipt. Existing execution owner persists lifecycle; high-rate progress is derived.
- **Failure:** Persist submission identity before dispatch; unknown remote outcome reconciles before retry. Queued cancel differs from remote best-effort cancel; charged late outputs remain attributable.
- **Proof:** ORCH-05-A — Queue fairness, timeout after submit, provider retry/cancel, worker crash and restart; no duplicate charged work, output receipt or terminal result. Planned regression/probe target relative to `app/`: `packages/server-core/src/tasks/__tests__/fleet-orch-05.test.ts`. After adding the target, run from `app/`: `bun test packages/server-core/src/tasks/__tests__/fleet-orch-05.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft TaskRunner first; Hyperframes ArtifactTransaction/cancellation and OpenReel backpressure only. No imported queue/runtime authority. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CREATE-02

**Video and media editing**

- **Next:** `PROVE` — R12 after R11; canvas host from R7.
- **Sources:** [`packages/server-core/src/tasks/TaskRunner.ts`](../../app/packages/server-core/src/tasks/TaskRunner.ts); [`packages/shared/src/resources/resource-bundle.ts`](../../app/packages/shared/src/resources/resource-bundle.ts); [`apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx`](../../app/apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx).
- **Deliver:** Benchmark one shared native sequence operation and preview/export loop in Electron; compare opencut-classic command/export seams and a minimal local engine adapter.
- **Data:** Sequence owns track/clip/marker/effect IDs, rational frame rate, audio sample time, source ranges and schema/revision. Preview is disposable; render pins the exact sequence/input versions.
- **Failure:** Invalid trim/overlap/stale revision rejects atomically; missing codec/assets and render failure preserve edits. Undo changes sequence, not completed external charges or source files.
- **Proof:** CREATE-02-A — Import video/image/audio, trim/split via UI and Agent, undo, preview and export MP4; test frame/audio timing, cancel, restart, variable-rate input and locked output. Planned regression/probe target relative to `app/`: `scripts/probes/create-02.ts`. After adding the target, run from `app/`: `bun run scripts/probes/create-02.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** opencut-classic CommandManager/SceneExporter; OpenReel clock/backpressure; OpenChatCut AGPL is behavior evidence only. Current opencut GPUI timeline is a placeholder. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CREATE-03

**Image generation and editing**

- **Next:** `IMPLEMENT` — R11 after R4/R5 and Job first slice.
- **Sources:** [`packages/server-core/src/tasks/TaskRunner.ts`](../../app/packages/server-core/src/tasks/TaskRunner.ts); [`packages/shared/src/sources/storage.ts`](../../app/packages/shared/src/sources/storage.ts); [`packages/shared/src/resources/resource-bundle.ts`](../../app/packages/shared/src/resources/resource-bundle.ts).
- **Deliver:** Implement one explicitly configured image generation/edit provider via the shared Job path, with prompt/reference/region inputs and result review on the board.
- **Data:** Request pins model/provider, parameters, input image versions and optional mask; output ArtifactRef records dimensions, seed when returned, prompt and actual/unknown cost.
- **Failure:** Uncertain submission/charge reconciles; cancel does not imply refund. Invalid/partial output is not a completed image; preserve originals and prior accepted result.
- **Proof:** CREATE-03-A — Fixture provider success/invalid-image/rate-limit/timeout-after-submit/cancel and deterministic local image edit; a paid live generation needs explicit authorized scope. Planned regression/probe target relative to `app/`: `packages/server-core/src/tasks/__tests__/fleet-create-03.test.ts`. After adding the target, run from `app/`: `bun test packages/server-core/src/tasks/__tests__/fleet-create-03.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft Sources/Jobs; Cowart generation placeholder and replacement interaction; provider-specific APIs before another AIGC framework. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CREATE-04

**Audio, voice and music**

- **Next:** `IMPLEMENT` — R12 after R11 and native sequence.
- **Sources:** [`packages/server-core/src/tasks/TaskRunner.ts`](../../app/packages/server-core/src/tasks/TaskRunner.ts); [`packages/shared/src/resources/resource-bundle.ts`](../../app/packages/shared/src/resources/resource-bundle.ts); [`packages/shared/src/sources/storage.ts`](../../app/packages/shared/src/sources/storage.ts).
- **Deliver:** Add one audio generation/record/import path and native track edits through the same media owner; declare supported voice/music operations per adapter.
- **Data:** Audio artifacts carry sample rate/channels/duration, exact source range and provenance. Sequence audio time is sample-based; waveform is a derived cache.
- **Failure:** Unsupported codec, drift, clipping warning and missing source remain explicit. Cancel/export failure preserves track edits; generated speech cannot silently replace recorded originals.
- **Proof:** CREATE-04-A — Import/generate fixture, trim/align, preview and render; test sample-accurate boundary, resampling, mixed rates, cancel and missing source without A/V drift. Planned regression/probe target relative to `app/`: `packages/server-core/src/tasks/__tests__/fleet-create-04.test.ts`. After adding the target, run from `app/`: `bun test packages/server-core/src/tasks/__tests__/fleet-create-04.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** OpenReel master clock/backpressure and FFmpeg adapter; no separate audio Job or project database. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CREATE-05

**Captions, transcript and translation**

- **Next:** `IMPLEMENT` — R12 after media Job and sequence.
- **Sources:** [`packages/server-core/src/tasks/TaskRunner.ts`](../../app/packages/server-core/src/tasks/TaskRunner.ts); [`packages/shared/src/resources/resource-bundle.ts`](../../app/packages/shared/src/resources/resource-bundle.ts).
- **Deliver:** Transcribe one audio/video version, edit/translate text and map word/cue ranges to the native sequence; render/export captions with explicit timing.
- **Data:** Transcript segment IDs bind source version and source-time ranges; translated text keeps alignment/provenance. Sequence placement maps source time to edited timeline time.
- **Failure:** Split/trim/reorder recalculates mapping deterministically; failed translation preserves original text. Low-confidence/overlapping cues are flagged, never silently dropped.
- **Proof:** CREATE-05-A — Trim/reorder clips, translate with failed segments, edit a word and export/reimport SRT/VTT; validate times, Unicode, overlap handling and no source loss. Planned regression/probe target relative to `app/`: `packages/server-core/src/tasks/__tests__/fleet-create-05.test.ts`. After adding the target, run from `app/`: `bun test packages/server-core/src/tasks/__tests__/fleet-create-05.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Native media owner first; pyvideotrans/baocut are catalogue candidates only until current source and license admission, not automatic dependencies. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CREATE-08

**Deck and presentation**

- **Next:** `PROVE` — R13 after R7/R10/R11; reuse INFO-05's native-format owner. R12 is required only for consumed video operations.
- **Sources:** [`packages/shared/src/resources/resource-bundle.ts`](../../app/packages/shared/src/resources/resource-bundle.ts); [`packages/server-core/src/handlers/rpc/resources.ts`](../../app/packages/server-core/src/handlers/rpc/resources.ts); [`apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx`](../../app/apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx).
- **Deliver:** Extend the single presentation owner selected by INFO-05 with native slide editing and explicit HTML/PDF/PPTX/video export. Do not build a second deck model for animation.
- **Data:** Deck owns stable slide/object IDs, assets, layout/theme, schema/revision and optional motion tracks. A PPTX import receipt records supported objects and untouched parts.
- **Failure:** Missing fonts/assets/unsupported transitions are visible. Failed export keeps source/version and last good output; undo conflicts respect intervening edits.
- **Proof:** CREATE-08-A — Human/Agent edits, reordered slides, charts/images/fonts and animation fixture; save/reopen and export comparisons disclose every unsupported construct. Planned regression/probe target relative to `app/`: `scripts/probes/create-08.ts`. After adding the target, run from `app/`: `bun run scripts/probes/create-08.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** GenOffice PPTX operations for package/document mutation; Hyperframes composition output; Remotion remains license-gated. Flattened PDF/image is not editable PPTX fidelity. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CREATE-09

**Motion graphics and animation**

- **Next:** `PROVE` — R13 with deck/sequence and shared Job.
- **Sources:** [`packages/server-core/src/tasks/TaskRunner.ts`](../../app/packages/server-core/src/tasks/TaskRunner.ts); [`packages/shared/src/resources/resource-bundle.ts`](../../app/packages/shared/src/resources/resource-bundle.ts); [`apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx`](../../app/apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx).
- **Deliver:** Add time-based properties to the existing native media/deck document and compare a bounded composition renderer for one real motion export.
- **Data:** Track binds object/property, time base, keyframes/interpolation and pinned assets. Native document owns edits; renderer consumes a frozen manifest and returns an artifact.
- **Failure:** Unsupported property/renderer/font is explicit; preview/export divergence fails validation. Cancel releases processes and staging, not the source composition.
- **Proof:** CREATE-09-A — Animate position/opacity/text on known frames, compare preview with exported frames and test missing asset, invalid keyframe, cancel and restart. Planned regression/probe target relative to `app/`: `scripts/probes/create-09.ts`. After adding the target, run from `app/`: `bun run scripts/probes/create-09.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Hyperframes direct clock/artifact transaction; Remotion only after current distribution-license review. No imported render Job authority. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CREATE-10

**Storyboard and shot planning**

- **Next:** `IMPLEMENT` — R12 with INFO-02 and media owners.
- **Sources:** [`packages/shared/src/resources/resource-bundle.ts`](../../app/packages/shared/src/resources/resource-bundle.ts); [`packages/server-core/src/handlers/rpc/resources.ts`](../../app/packages/server-core/src/handlers/rpc/resources.ts).
- **Deliver:** Create editable storyboard shots referencing real media, then materialize selected shots as native sequence operations.
- **Data:** Shot owns stable ID, order, duration intent, notes and media/version references; sequence owns actual edit timing. Reorder changes order only, never regenerates identity.
- **Failure:** Missing/changed media is flagged; converting twice with same operation cannot duplicate clips. Failed conversion preserves the plan and existing sequence.
- **Proof:** CREATE-10-A — Reorder, duplicate and delete shot bindings, replace one media version, convert and undo with concurrent sequence edit; provenance remains exact. Planned regression/probe target relative to `app/`: `packages/shared/src/resources/__tests__/fleet-create-10.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/resources/__tests__/fleet-create-10.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Existing Library/sequence owners; OpenMontage checkpoint/export manifest and storyboard catalogue entries are comparison evidence, not an extra project store. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CREATE-12

**Export, render and delivery profiles**

- **Next:** `IMPLEMENT` — R5/R8/R10-R14 per actual exporter.
- **Sources:** [`packages/server-core/src/tasks/TaskRunner.ts`](../../app/packages/server-core/src/tasks/TaskRunner.ts); [`packages/shared/src/resources/resource-bundle.ts`](../../app/packages/shared/src/resources/resource-bundle.ts); [`packages/server-core/src/handlers/rpc/resources.ts`](../../app/packages/server-core/src/handlers/rpc/resources.ts).
- **Deliver:** Define an export profile for the first real native document/media producer and return a validated local delivery receipt; external publishing is a separate action.
- **Data:** Profile pins format/codec/size/fidelity and adapter revision; manifest pins input versions; receipt identifies output bytes/digest and validation result through INFO-02.
- **Failure:** Locked output, disk full, cancel and crash use stage/validate/commit recovery; no success before reopen/probe. Retry preserves originals and reconciles an existing output.
- **Proof:** CREATE-12-A — Export twice with same operation, inject partial write and disk failure, reopen/probe output and verify exact source/output lineage and no unintended publish. Planned regression/probe target relative to `app/`: `packages/server-core/src/tasks/__tests__/fleet-create-12.test.ts`. After adding the target, run from `app/`: `bun test packages/server-core/src/tasks/__tests__/fleet-create-12.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Hyperframes staged artifacts, OpenMontage export bundle and native format engines. Codec/binary terms are separate from a root source license. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).
