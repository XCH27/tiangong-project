# 08 AIGC Jobs Surface

## 1. Mission

Provide a structured job queue for AI-generated content (image generation, audio synthesis, video generation, and future modalities) — where both humans and agents can submit jobs, track progress, and consume outputs — with full action, permission, timeline, and rollback coverage.

---

## 2. User-Visible Loop

1. User or agent submits an AIGC job via `aigc.job_submit` (image generation, audio, video clip, etc.).
2. The job enters a local job queue and shows a spinner in the surface panel and in any canvas `aigc_placeholder` node that references it.
3. When the job completes, the output file is saved to the Library (M05) with full provenance.
4. The spinner resolves to a thumbnail in the canvas placeholder or a list item in the Jobs surface.
5. The user can view, download, or re-use the output. Agents can read the output via Library asset path.

---

## 3. Job Types

| Job type | Description | Output format |
|---|---|---|
| `image_gen` | Generate an image from a text prompt | PNG / WebP |
| `image_edit` | Edit an existing image with a prompt | PNG / WebP |
| `audio_gen` | Generate audio / music from a prompt | MP3 / WAV |
| `video_gen` | Generate a short video clip from a prompt | MP4 |
| `caption_gen` | Generate a caption or alt-text for an image | Text |
| `embedding` | Generate a text embedding vector | JSON |

Additional job types can be added via the Extension Process in `action-ids.md` without a major version bump if the payload shape is backward-compatible.

---

## 4. Job Lifecycle

```
pending → running → completed
                 ↘ failed
                 ↘ cancelled
```

| State | Description |
|---|---|
| `pending` | Submitted; waiting for a model slot |
| `running` | Model inference in progress; progress % available if the provider supports it |
| `completed` | Output file saved to Library; Timeline event recorded |
| `failed` | Error from model provider; error message recorded in Timeline |
| `cancelled` | Cancelled by user or agent before completion; no output |

---

## 5. Job Queue Model

- Jobs are persisted to `<workspace>/.fleet/aigc/jobs.json`.
- The queue is FIFO by default; an optional `priority` field (1–5, default 3) allows higher-priority jobs to skip ahead.
- Concurrent execution limit: configurable per workspace (default 2).
- A job that has been `running` for more than its timeout (default 120 s) is automatically moved to `failed`.

---

## 6. Provider Abstraction

AIGC Jobs uses a thin provider interface so different model APIs can be swapped without changing the surface or queue logic.

```ts
// Provider interface — Lead-owned, defined in
// app/packages/shared/src/protocol/aigc-provider.ts

interface AigcProvider {
  id: string;
  displayName: string;
  supportedJobTypes: JobType[];
  submit(job: AigcJob): Promise<{ providerJobId: string }>;
  poll(providerJobId: string): Promise<AigcJobStatus>;
  cancel(providerJobId: string): Promise<void>;
}
```

Concrete providers (OpenAI, Replicate, local Ollama, etc.) implement this interface. The queue worker calls the interface, not any provider SDK directly.

---

## 7. Library Integration (M05)

When a job reaches `completed`:

1. The output file is saved to `<workspace>/.fleet/library/aigc/<job-id>.<ext>`.
2. A `LibraryAsset` entry is created with `provenance.jobId` set.
3. The `aigc_placeholder` canvas node (if any) is updated with the Library asset path via `canvas.node_update`.
4. The Timeline receives a `action_completed` event with `evidenceRefs` pointing to the Library asset.

---

## 8. Agent-Native Actions

| Action id | Description | Permission | Undo |
|---|---|---|---|
| `aigc.job_submit` | Submit a new AIGC job | L1_reversible | not_supported |
| `aigc.job_cancel` | Cancel a pending or running job | L1_reversible | not_supported |

`aigc.job_submit` is already in the frozen `action-ids.md` table.
`aigc.job_cancel` is under discussion — not yet frozen.

---

## 9. UI Placement

AIGC Jobs is an **auxiliary panel** — not a primary surface. It is accessible from:

- The Fleet left sidebar (jobs icon, shows a badge count for running jobs).
- A floating job status bar above the canvas when a job is running for a `aigc_placeholder` node.

The panel is a list view: each row shows job type, prompt preview, status, progress bar (if running), and output thumbnail (if completed).

---

## 10. Session / Permission / Rollback

- `aigc.job_submit` is `L1_reversible`; the undo handle is an `aigc.job_cancel` invocation (valid only while job is `pending`).
- Once a job is `running`, cancellation is best-effort and may incur provider costs.
- Completed job outputs are immutable; a new job must be submitted to regenerate.
- The Timeline records the full job submission payload (excluding API keys) for auditability.

---

## 11. Validation Ladder

1. `pnpm typecheck` — zero errors.
2. Unit test: job lifecycle state machine transitions (`pending → running → completed`, `pending → cancelled`).
3. Unit test: provider interface mock — verify submit / poll / cancel called correctly.
4. Smoke: submit a mock image_gen job; verify it appears in the queue panel with `pending` status.
5. Smoke: mock job completion; verify output file saved to Library and canvas placeholder updates.
6. Agent action smoke: call `aigc.job_submit` via action registry; verify Timeline event appears.

---

## 12. Done / Not Done

**`usable`**: human and agent can each submit a job; job progresses through its lifecycle; completed output appears in Library with provenance; Timeline has evidence for the full lifecycle.

**`display-only`**: job list renders but no real provider, no Library write, no Timeline.

**`blocked`**: `aigc.job_cancel` action id not yet frozen; or Library lease model (M05) not stable.
