# M09 — Media Composition and Video Surface

> **Capability status:** `not implemented`
> **Execution gate:** Locked
> **Spec maturity:** contract draft; media/render adapter requires spike
> **Wave:** W3B
> **Owner:** Lead for media protocol; M09 Worker after packet approval
> **Depends on:** M00, M03, M05, M08 job core, M12 core, M16, M17

## 1. Purpose

Compose images, video, audio, text, captions, rendered web/deck segments, and generated media in
one native timeline project. Humans and Agents use the same structured edit operations; rendering
runs through M08 and outputs return as versioned ArtifactRefs.

The first closed loop is: bind one image, one video, and one audio asset -> arrange them on a
finite timeline -> add text/caption -> preview -> render a real MP4 -> register provenance and
show the result on the canvas.

## 2. Scope

### In Scope

- native `MediaProject -> Track -> Clip` document;
- image, video, audio, text, caption, colour, and nested rendered-segment clips;
- add, trim, split, move, reorder, enable/disable, transition, and bounded transform/keyframe
  edits;
- human and Agent editing through M03;
- preview with explicit best-effort versus render-accurate wording;
- durable render jobs through M08;
- ArtifactRef inputs/outputs and provenance through M05;
- M07 cards and M16 surface/inspector/timeline contributions.

### Out of Scope

- a full professional NLE in the first slice;
- unbounded effect/plugin graphs, live multi-user editing, a separate render queue, or using the
  canvas as the media-project store;
- claiming frame-accurate browser preview where the decoder cannot guarantee it.

## 3. Native Document Model

```ts
type MediaProject = {
  schemaVersion: 1
  projectId: string
  workspaceId: string
  revision: number
  frameRate: { numerator: number; denominator: number }
  canvas: { width: number; height: number; background: string }
  durationFrames: number
  tracks: MediaTrack[]
  markers: Array<{ markerId: string; frame: number; label: string }>
  createdAt: string
  updatedAt: string
}

type MediaTrack = {
  trackId: string
  kind: 'video' | 'image' | 'audio' | 'text' | 'caption'
  order: number
  muted: boolean
  locked: boolean
  clips: MediaClip[]
}

type MediaClip = {
  clipId: string
  sourceRef?: ArtifactRef
  kind: MediaTrack['kind']
  timelineStartFrame: number
  timelineDurationFrames: number
  sourceInFrame?: number
  sourceDurationFrames?: number
  transform?: { x: number; y: number; scaleX: number; scaleY: number; rotation: number; opacity: number }
  text?: { content: string; styleRef?: string }
  transitionIn?: TransitionRef
  transitionOut?: TransitionRef
  keyframes: Keyframe[]
}
```

Exact protocol types are not frozen by this document. They must be promoted into the canonical
contract after the adapter spike. Time is stored as integer frames plus rational frame rate;
floating seconds are view/transport values only.

## 4. Artifact Inputs

| Artifact kind | Timeline use |
|---|---|
| image | still clip with bounded duration and transforms |
| video | source range clip with audio optionally linked/separated |
| audio | audio clip with gain/fade and waveform cache |
| text | title/caption content or text clip |
| web project | rendered video/image segment only, not live Chromium in renderer |
| presentation | rendered slide/segment or exported media |
| design document | exported image/sequence with exact source version |

All clips bind exact ArtifactRef versions. Replacing an upstream asset creates an explicit rebind
or new project version; it never silently changes a finished edit.

## 5. Human and Agent Editing

The timeline UI and Agent tools invoke the same atomic operations. Gestures may preview locally,
but the final edit commits once with `baseRevision` and an undo snapshot/inverse.

Agent edits must be expressed in frames and stable IDs. Agents do not drag pixels by coordinate
automation and do not call FFmpeg directly.

## 6. Candidate Actions — Not Frozen

| Candidate | Purpose | Policy/undo intent |
|---|---|---|
| `media.project_create` | create native project from settings/assets | L1 snapshot undo |
| `media.track_add` / `media.track_remove` | edit track structure | L1 snapshot undo |
| `media.clip_add` | bind ArtifactRef at a frame | L1 inverse |
| `media.clip_update` | move/trim/transform/text/keyframe patch | L1 inverse old values |
| `media.clip_split` | atomically replace one clip with two | L1 snapshot undo |
| `media.clip_remove` | remove project reference, not source artifact | L1 snapshot undo |
| `media.preview_seek` | change local playhead | L0 view state |
| `media.render_submit` | submit render job | dynamic L1/L2 based on output/compute/overwrite |
| `media.frame_capture` | render frame in memory or write through M05 | split read/render from file write |

The v1.2 `video.*` candidate IDs should not be implemented in parallel with these names. W0.1
must choose one namespace and migrate/deprecate explicitly.

## 7. Revision and Undo

- Every document mutation has `idempotencyKey`, `baseRevision`, and `committedRevision`.
- Edits serialize per project; stale writes return explicit conflict.
- Multi-clip edits commit atomically.
- L1 edit undo restores project-document state only; it never deletes immutable source/output
  artifacts.
- Render submission cancellation is separate from undo and follows M08 semantics.
- Removing a clip is ordinarily reversible. Deleting source files remains an M05 high-risk action.

## 8. Preview Semantics

- Browser/Electron preview is best effort and may not be frame accurate.
- UI shows actual project frame/time and whether preview is approximate.
- Waveforms, thumbnails, proxies, and decoded frames are derived caches and rebuildable.
- Unsupported media shows a transcode/proxy action, not a blank player.
- Live preview quality may degrade under resource pressure; project state does not change.

## 9. Render Pipeline

M09 compiles one immutable MediaProject revision into a render request; M08 executes/reconciles it.

```text
validate project revision and assets
-> estimate resource/cost and permission
-> freeze render manifest
-> M08 local/external render job
-> validate output
-> M05 atomic write + ArtifactRef/provenance
-> M09/M17/M07 projection update
```

Two trim/export modes may exist:

- **fast copy:** keyframe-aligned, may shift actual boundaries and must record them;
- **precise render:** decode/re-encode to requested frames, slower and resource-intensive.

No document may promise “stream copy plus exact frame boundaries.”

FFmpeg or another renderer requires a separate build/license/platform decision. If FFmpeg is
chosen, the bundled build, codecs, notices, source obligations, and platform matrix must be
recorded before distribution. M09 never shells through an ungoverned generic command path.

## 10. View Contributions

- main surface: program preview and asset/project controls;
- bottom panel: multi-track timeline, playhead, clips, markers, waveforms;
- right inspector: selected clip/track/project properties;
- canvas renderer: poster, duration, render state, version, and open action;
- M17 node renderer/ports: ArtifactRef list in, media-project/render artifact out.

The live video editor is not embedded in every canvas node.

## 11. Resource Policy

- Local final render concurrency starts at one until a recorded benchmark permits otherwise.
- Preview decode, waveform, proxy, and final render use distinct concurrency classes.
- Jobs queue instead of competing with canvas rendering.
- Proxies/caches have bounded storage and visible cleanup.
- Off-screen or hidden preview suspends while M08 render continues.
- A missing accelerator degrades to slower/limited modes with explicit wording.

## 12. Error Handling

| Condition | Result | Recovery |
|---|---|---|
| missing/stale asset version | clip shows missing source; render blocked | relink exact version or intentionally rebind |
| unsupported codec | source readable-invalid for preview/render | create approved proxy/transcode |
| revision conflict | edit rejected; no lost change | reload and reapply explicit patch |
| approximate seek | UI labels preview accuracy | inspect rendered frame or proxy |
| render process/provider unknown | M08 reconciling | observe/reconcile; no duplicate render |
| output commit fails | job not completed | repair storage and commit once |
| resource saturation | render queued; preview quality may reduce | wait/change profile/close heavy preview |
| partial asset license problem | export blocked with exact asset | replace or resolve license metadata |

## 13. First Usable Verification

1. Create a project with real image, video, audio, and text/caption ArtifactRefs.
2. Perform add, move, trim, split, and remove once through UI and once through Agent actions.
3. Verify revisions, conflicts, and undo without changing source artifacts.
4. Restart and reopen exact project state; derived caches may rebuild.
5. Submit a real precise render; verify M08 queue/reconciliation and M05 output provenance.
6. Kill the app during render and reconcile without duplicate work.
7. Open the result from M07 and as an M17 output.
8. Compare a requested boundary with rendered output and record actual accuracy.
9. Exercise unsupported codec/missing asset/resource saturation paths visibly.

## 14. Later Slices

- bounded transitions and transform/keyframe presets;
- narration/caption generation via M08 capabilities;
- rendered M18 web segments and M19 slide ranges;
- project templates and composed workflow capability;
- proxy/background analysis after resource measurements.

## 15. Open Gates

- Freeze media document/action contracts and ArtifactRef semantics.
- Select and verify media project/render engine under reference policy.
- Freeze local render concurrency and degraded-state wording.
- Complete FFmpeg/codec/license/platform ADR if applicable.
- Produce a narrow packet; do not combine renderer, editor, actions, and all codecs in one slice.

## 16. Non-Goals and Prohibitions

- No single-source clip editor passed off as multi-asset composition.
- No direct source-file mutation.
- No second render queue or job store.
- No raw FFmpeg command access from UI/Agent/workflow.
- No frame-accuracy claim from browser preview alone.
