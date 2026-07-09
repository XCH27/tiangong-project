# 09 Video Surface

## 1. Mission

Provide a native video player and lightweight clip editor inside Craft Agents (二开补强) — where both humans and agents can play, annotate, trim, and export video clips — with full action, permission, timeline, and rollback coverage.

---

## 2. User-Visible Loop

1. User opens a Video surface from a session or from a `video_frame` canvas node (M07).
2. Craft Agents (二开补强) renders a native video player with timeline scrubber, playback controls, and clip markers.
3. User can set in/out points to define a clip range.
4. Agent can call `video.clip_create` or `video.clip_trim` to programmatically define clips.
5. User or agent exports a clip; the output is saved to Library (M05) with full provenance.
6. Timeline records all clip operations for auditability and undo.

---

## 3. Player Model

| Property | Value |
|---|---|
| Renderer | HTML5 `<video>` element (Electron renderer process) |
| Formats | MP4 (H.264 / H.265), WebM (VP9), MOV; codec support depends on Chromium build |
| Max local file size | No hard limit; files are streamed, not loaded into memory |
| Subtitles / captions | WebVTT sidecar files supported |
| Frame-accurate scrub | Seek to exact frame via `currentTime` with precision ± 1 frame |

---

## 4. Clip Model

A clip is a named in/out range over a source video file.

```ts
// Canonical type — Lead-owned, defined in
// app/packages/shared/src/protocol/video.ts (to be created by Lead)

export type VideoClip = {
  id: string;                 // uuid
  sourceFileRef: string;      // Library asset id or workspace file path
  label: string;
  inPoint: number;            // seconds (float)
  outPoint: number;           // seconds (float)
  notes: string;              // free-form annotation
  createdAt: string;          // ISO 8601
  updatedAt: string;
  seq: number;                // last mutation sequence number
};
```

Multiple clips can exist over the same source file. Clips are stored in `<workspace>/.fleet/video/clips.json`.

---

## 5. Timeline Scrubber

The video surface shows:

- A waveform strip (audio amplitude) if the video has an audio track.
- Clip marker handles (in / out points) on the scrubber.
- A playhead that can be dragged or clicked.
- Named clip ranges rendered as labelled regions on the scrubber.

---

## 6. Canvas Integration (M07)

A `video_frame` canvas node displays:

- A static thumbnail of the video (first frame or poster).
- The clip label and duration.
- A play icon — clicking it opens the full Video surface routed to that clip.

The live video player is **not** rendered inside the canvas.

---

## 7. Agent-Native Actions

These action ids are **under discussion** — not yet frozen. Workers must not implement them until the Lead freezes them in `action-ids.md`.

| Candidate action id | Description | Permission | Undo |
|---|---|---|---|
| `video.clip_create` | Create a new clip (label, in/out points) over a source file | L1_reversible | supported |
| `video.clip_trim` | Update in/out points of an existing clip | L1_reversible | supported |
| `video.clip_delete` | Delete a clip definition (does not delete source file) | L2_irreversible | not_supported |
| `video.export_clip` | Export a clip range to a new file via FFmpeg | L1_reversible | not_supported |
| `video.screenshot_frame` | Capture the current frame as an image to Library | L0_read_only | n/a |
| `video.seek` | Move the playhead to a specific time (view-state, no timeline) | L0_read_only | n/a |

---

## 8. Export Pipeline

`video.export_clip` uses **FFmpeg** (bundled with the Electron app) to cut the clip range without re-encoding (stream copy when possible).

1. Action executor calls FFmpeg via `child_process.execFile`.
2. Output is saved to `<workspace>/.fleet/library/video/<clip-id>.<ext>`.
3. A `LibraryAsset` entry is created with `provenance.clipId` set.
4. The Timeline records a `action_completed` event with `evidenceRefs` pointing to the output file.

FFmpeg must be present at a deterministic path. The main process is responsible for bundling and exposing the FFmpeg binary path via IPC.

---

## 9. Session / Permission / Rollback

- `video.clip_create` and `video.clip_trim` are `L1_reversible`; undo handles store the previous in/out state.
- `video.clip_delete` is `L2_irreversible`; requires a `SupervisionRequest` if the clip has downstream canvas references.
- Exports are one-way; re-export requires a new `video.export_clip` invocation.
- Playhead seek and playback state are **not** recorded in the Timeline.

---

## 10. Validation Ladder

1. `pnpm typecheck` — zero errors.
2. Unit test: clip lifecycle (create, trim, delete) with correct `seq` ordering.
3. Smoke: open a local video file in the Video surface; verify playback controls work.
4. Smoke: set in/out points; verify clip appears in the scrubber.
5. Agent action smoke: call `video.clip_create` via action registry; verify Timeline event.
6. Export smoke: call `video.export_clip`; verify output file saved to Library.
7. Canvas thumbnail smoke: add a `video_frame` node to a Canvas document; verify thumbnail appears.

---

## 11. Files To Inspect First

- `docs/contracts/action-ids.md` — video action ids (under discussion)
- `docs/contracts/protocol-stubs.md` — `SessionEvent`, `ActionInvocation`
- `docs/modules/07-canvas-design-surface/SPEC.md` — canvas `video_frame` node type
- `docs/modules/05-files-library-leases.md` — Library asset write path

---

## 12. Done / Not Done

**`usable`**: human and agent can each create a clip with in/out points; export works; Library asset is created with provenance; Timeline has evidence for create and export.

**`display-only`**: video player renders; clip markers draggable; no action/timeline/export path.

**`blocked`**: video action ids not yet frozen; or FFmpeg binary not bundled; or Library lease model (M05) not stable.

## 17. Non-Goals & Prohibitions

- **No Boundless Rendering:** Do not run concurrent local video render tasks. The local video rendering queue is strictly capped at 1 concurrent job.
