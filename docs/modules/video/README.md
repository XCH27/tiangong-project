# Video and media editing module

Design state: `breadth`; implementation status: `not implemented`; development order: R12.

This module is a native Fleet media surface, not a second task, file, permission, timeline, or
artifact authority. It combines a human-editable multi-track timeline with governed Agent edit
commands, media analysis, captions, generation jobs, preview and honest export.

## Compatibility record

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

## Non-goals

- The canvas does not become the video editor.
- Agent prompts do not directly mutate files or invoke raw FFmpeg commands.
- A generated preview is not accepted delivery until a real render and ArtifactRef exist.

Activation acceptance: `VID-001` imports real video/image/audio; `VID-002` UI and Agent use the
same trim/split command; `VID-003` exports a real MP4 through a cancellable Job; `VID-004` records
the output ArtifactRef and failure evidence.

## Reality and activation sequence

No native sequence, timeline, FFmpeg adapter or video route exists under `app/` today (`rg -n
"sequence|ffmpeg|video" app/apps/electron/src app/packages` is the absence check). Activation is
therefore: (1) write the sequence schema and adapter packet; (2) add a fixture media file and a
main-process cancellable render job; (3) wire one UI command and the Agent command to the same
executor; (4) run the fixture render, cancellation and restart checks. Until all four steps have
paths and evidence, status stays `not implemented`.
