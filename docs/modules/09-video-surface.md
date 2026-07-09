# 09 Video Surface

## 1. Mission

Provide a native video timeline surface that shares Fleet assets, actions, permissions, and timeline.

## 2. User-Visible Loop

User imports/selects media, trims or moves a clip, agent performs equivalent timeline edit, preview updates, action enters timeline, undo works.

## 3. Current App Reuse

Reuse Library assets, External Jobs, Internal Action Registry, session/timeline/permission, and renderer surface shell.

## 4. Reference Projects

OpenCut Classic is approved source/reference for timeline/store/render concepts. Kdenlive/Remotion/SVGator/HyperFrames are black-box or candidate references unless promoted.

## 5. UI Placement

Video is a professional surface with preview, tracks, timeline, properties, and asset drawer. It is not a Tool Dock widget.

## 6. Backend / RPC / Locality

Timeline edits are local actions. Rendering may be local or external job with cost/provenance.

## 7. Session / Timeline / Permission / Rollback

Timeline edits emit semantic events and use native command/history. Export/render jobs require permission and evidence.

## 8. Data Model

Media asset, track, clip, time range, keyframe, transition/effect, render job, timeline history.

## 9. Agent-Native Actions

Read timeline, select clip/time range, trim, split, move, add media, add caption/effect, undo, render/export.

## 10. Files To Inspect First

- `app/packages/shared/src/protocol/internal-action.ts`
- Library/external job protocols
- future video protocol once frozen

## 11. Files Likely Touched

Video protocol, renderer video surface, timeline store bridge, render job adapter, Library integration.

## 12. Parallel Work Packages

Timeline contract/store, renderer surface, action handlers, render/export path after Library and job contracts.

## 13. File Ownership

Video protocol and action ids are Lead-owned.

## 14. Validation Ladder

Timeline unit tests, preview render smoke, human+agent same clip edit, undo, export dry run.

## 15. Done / Not Done

`usable`: one real clip edit is visible, action-backed, and undoable. `display-only`: timeline UI with no native command path.

## 16. Risks And Blocked Decisions

Risk: GPL/commercial code leakage. Only OpenCut Classic is approved for source migration.

## 17. Local Render Task Queue

### 17.1 Problem

Local video rendering (FFmpeg, WebCodecs) is CPU/GPU-intensive. If multiple
agents submit render jobs concurrently, the host machine saturates and all
jobs slow down together. A task queue is required.

### 17.2 Queue Design

All render jobs — whether triggered by a human action or an agent action —
are submitted to a **single local render queue** managed by the Video
Surface service layer.

Rules:

- **Max concurrent local renders: 1.** Only one FFmpeg/WebCodecs render
  process runs at a time on the local machine. This is a hard cap, not
  a soft limit.
- **Queue discipline: FIFO with priority override.** Jobs submitted by a
  human manual action carry `priority: 'user'` and skip ahead of
  `priority: 'agent'` jobs already in the queue.
- **Queue depth limit: 8.** If the queue holds 8 pending jobs, new
  submissions are rejected with a `RENDER_QUEUE_FULL` error that the
  agent must surface to the user for a decision (wait, cancel, or
  delegate to external job).

### 17.3 External Job Escape Hatch

If the local render queue is full or the user opts out of local rendering,
the job is handed off to M08 AIGC External Jobs as an external render job
with cost and provenance recorded. This handoff must be explicit and
permissioned (L2 minimum).

### 17.4 Queue State in Timeline

The render queue state (pending, running, failed, completed) is surfaced
as `SessionEvent` entries so the Timeline reflects all render activity
regardless of which agent submitted the job.
