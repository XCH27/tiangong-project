# 08 AIGC External Jobs

## 1. Mission

Unify image/video generation, editing, external review, rendering, and export through one permissioned External Job plane.

## 2. User-Visible Loop

User or agent creates a job from selected inputs, confirms provider/cost/risk, job runs or hands off to browser/API, outputs are saved as assets with provenance.

## 3. Current App Reuse

Reuse existing External Job protocol/service, permission flow, usage/cost ledger, Library, and session timeline.

## 4. Reference Projects

Open Design for artifact jobs; external providers are API/product references. Do not copy Adobe/Stitch/Firefly/closed product UI or assets.

## 5. UI Placement

AIGC is a professional surface and also a job panel invoked from canvas/artifact/video. Do not make separate generation silos.

## 6. Backend / RPC / Locality

External jobs may be local, API, browser-mediated, or unknown. Each job records provider/site, inputs, permission, cost source, output provenance.

## 7. Session / Timeline / Permission / Rollback

Job creation/cancel/retry/export enters timeline. External upload or paid action requires permission. Outputs can be removed from Library/canvas with rollback where possible.

## 8. Data Model

ExternalJob, provider, input asset, output asset, cost source, status, evidence, provenance, license metadata.

### Batch API Extension (Native Provider Batch Mode)

Batch API is not a separate system. It is an execution mode on `ExternalJob`.

```ts
type ExternalJobProvider =
  | 'local'
  | 'api'                  // real-time single-request
  | 'browser-mediated'
  | 'anthropic-batch'      // native Anthropic Message Batches
  | 'openai-batch'         // native OpenAI Batch API

type ExternalJobBatchMode =
  | 'sync-concurrent'      // concurrent Promise.all, no cost discount
  | 'async-native'         // submit to provider Batch endpoint, ~50% cost

interface ExternalJob {
  // existing fields
  id: string
  type: 'review' | 'aigc' | 'memory-distill' | 'analysis' | 'export'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  provider: ExternalJobProvider
  costSource: 'BYOK_API' | 'LOCAL_COMPUTE' | 'EXTERNAL_JOB' | 'UNKNOWN'
  inputAssets: string[]          // asset IDs or file refs
  outputAssets: string[]         // Library asset IDs written on completion
  evidenceRef: string            // SessionEvent reference
  provenance: Record<string, string>
  // batch-specific additions
  batchMode?: ExternalJobBatchMode
  batchId?: string               // provider-issued batch ID
  batchInputFile?: string        // local JSONL file submitted to provider
  batchResultFile?: string       // local JSONL result file after download
  batchItemCount?: number        // total items submitted
  batchItemsCompleted?: number   // items resolved so far
}
```

**Eligible job types for `async-native` batch mode:**

| Job Type | Reason |
|---|---|
| External AI review (multi-platform) | Offline, non-interactive, ~5–30 min latency acceptable |
| Memory distillation (session-end Fact extraction) | Background, no user-blocking |
| AIGC bulk generation | User can wait for batch to land in Library |
| TeamRun non-real-time analysis tasks | Static analysis, doc generation, test report summaries |

**Ineligible job types (must never use `async-native`):**

| Job Type | Reason |
|---|---|
| Interactive chat response | Requires streaming, sub-second latency |
| Gate 1.5 real-time supervision | Needs instant interception before damage |
| Terminal PTY I/O | Real-time millisecond I/O, incompatible |
| Model routing decisions | User-facing, latency-sensitive |

## 9. Agent-Native Actions

Create job, cancel job, retry job, save output to Library, handoff output to canvas/video/artifact.

## 10. Files To Inspect First

- `app/packages/shared/src/protocol/external-job.ts`
- server-core external job services
- renderer external job/settings components

## 11. Files Likely Touched

Job services/providers, AIGC renderer surface, Library registration, usage ledger.

## 12. Parallel Work Packages

Provider adapter, job UI, Library output registration, cost display can split after job schema freeze.

## 13. File Ownership

External job protocol and cost source fields are Lead-owned.

## 14. Validation Ladder

Job service tests, permission dry run, stub-to-real provider smoke, output asset registration check.

For Batch jobs additionally: idempotency test (duplicate batchId submission rejected), error-isolation test (one failed item does not fail the batch), ID mapping test (all outputs correctly mapped to input task IDs).

## 15. Done / Not Done

`usable`: one job produces or records a real output asset with provenance. `display-only`: job card with stub output only.

## 16. Risks And Blocked Decisions

Risk: calling website/API without clear cost and data boundary. Unknown costs remain unknown, not free.

Risk (Batch-specific): misclassifying interactive tasks as `async-native`. If a task requires real-time feedback, it must stay on `api` provider mode. Batch mode gate: task must have no UI blocking dependency before submitting.

Risk (Batch-specific): never auto-retry a failed batch without re-checking `batchId` idempotency guard — double-submission would double billing.
