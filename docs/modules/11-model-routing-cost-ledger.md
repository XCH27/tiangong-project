# 11 Model Routing Cost Ledger

## 1. Mission

Route API tasks intelligently while keeping usage, quota, cache, and cost honest and separate from CLI lanes.

## 2. User-Visible Loop

User sends API task or creates TeamRun, Fleet records routing decision, usage/cost/cache data, and displays context/quota/cost without mixing unknowns into zeros.

## 3. Current App Reuse

Reuse routing protocol, model settings, token ring, session usage, subscription/quota protocol, and TeamRun cost source.

## 4. Reference Projects

LobeHub is black-box product reference for service models/system tools. RTK/Reasonix/codegraph inform optimization. Do not copy unapproved code.

## 5. UI Placement

Token/context view stays near model/input area and settings. No separate finance dashboard for active route.

## 6. Backend / RPC / Locality

API routing uses provider/OAuth paths. CLI runtime bypasses. Quota adapters are read-only and local/provider-authorized.

## 7. Session / Timeline / Permission / Rollback

Every route decision writes timeline. Costs split by `LOCAL_COMPUTE`, `SUBSCRIPTION_QUOTA`, `BYOK_API`, `FLEET_CLOUD`, `EXTERNAL_JOB`, `UNKNOWN`.

## 8. Data Model

Routing decision, task type, complexity tier, fusion mode, cache ledger, usage sample, quota snapshot, cost source.

## 9. Agent-Native Actions

Read usage, read quota, explain routing decision, propose lane choice for TeamRun. Agents do not auto-switch active lane without permission/rules.

## 10. Files To Inspect First

- `app/packages/shared/src/protocol/routing.ts`
- `app/packages/shared/src/protocol/subscription.ts`
- `app/packages/shared/src/protocol/usage.ts`
- routing/cache/quota services

## 11. Files Likely Touched

Routing services, quota adapters, usage ledger, token ring UI, model/runtime settings.

## 12. Parallel Work Packages

Quota adapters, token view, routing decision logging, cache ledger can split after protocol freeze.

## 13. File Ownership

Routing/subscription/usage protocols and cost source enum are Lead-owned.

## 14. Validation Ladder

Routing unit tests, quota fixture tests, UI unknown/estimated/real display check, API send smoke.

## 15. Done / Not Done

`usable`: a real API turn records route and usage/cost source. `not implemented`: quota UI with no adapter/source.

## 16. Risks And Blocked Decisions

Risk: treating CLI subscriptions as API model choices. CLI/API choice is task-level lane selection.

## 17. Batch API Core Specifications

### 17.1 Tier Boundaries
1. **Prompt-level Batching**: Sending multiple tasks in a single large prompt block. This does not save token costs and is only suitable for minor temporary tasks.
2. **Engineering-level Batch API (Native Batch)**: Connecting to model providers' native Batch endpoints (e.g. OpenAI/Anthropic Batch). This executes asynchronously, saves ~50% of API token cost, and belongs to the model routing layer.

### 17.2 Engineering Implementation Schemes
1. **Synchronous Batching (Small Batch, Fast Response)**:
   * Used when task batch sizes are small and quick to execute.
   * Logic: Receive input array -> resolve concurrently -> await all -> return mapped array.
   * Input format: `items: Array<{ id: string; content: any }>`
2. **Asynchronous Batching (Production-Scale, Native Batch)**:
   * Used for large-scale offline runs or heavy cost-saving batches.
   * Logic:
     1. Submit Batch: Receive items, generate batch request file, submit to native Batch API, get `batchId`, return immediately.
     2. Status Polling: Poll batch execution status (processing/completed) using `batchId`.
     3. Fetch & Map: Download results, map output elements back to original task IDs, and notify requester.
   * Storage: Batch status, file references, and mapped results must be persisted locally in SQLite/db.

### 17.3 Mandatory Design Guardrails
1. **Error Isolation**: Individual item failures inside a batch must not fail the entire batch. Successful items return results, failed items return error details.
2. **Idempotency**: Use `batchId` to prevent duplicate submissions on retries.
3. **Chunking & Flow Control**: Large batches must be sliced to respect model context size and rate limits.
4. **ID Mapping**: All outputs must be mapped back to the input task IDs.

### 17.4 BatchJobExecutor Ownership

Module 11 is the **sole owner** of the Batch execution engine. Other modules declare batch
eligibility; they do not implement batch submission, polling, or result mapping.

| Module | Role | Does NOT implement |
|---|---|---|
| 04 (TeamRun) | Declares `batchEligible: true` on TaskRun; stores `batchId` in Journal | Submit JSONL, poll status |
| 08 (AIGC/ExternalJob) | Carries `batchMode` field on `ExternalJob` schema | Build batch file, download results |
| 10 (Memory/Context) | Marks `DistilledToolMemory` entries `batchMode: 'async-native'` | Call Batch API |
| **11 (this module)** | **Implements `BatchJobExecutor`** | — |

`BatchJobExecutor` responsibilities:

1. Accept `ExternalJob[]` from any module via a typed `submitBatch(jobs: ExternalJob[])` call.
2. Build JSONL input file from job payloads.
3. Submit to provider Batch API; store `batchId` in TeamRun Journal (`TaskRun.batchId`).
4. Poll status; on completion download results and map back to job IDs.
5. Write results into `ExternalJob.batchResultFile`; emit `BatchJobCompleted` event.
6. **Idempotency guard**: if `batchId` already exists in the journal for this job set, skip
   re-submission.

Dependency direction: Modules 04, 08, 10 depend on `ExternalJob` schema (owned by Module 08).
`BatchJobExecutor` (Module 11) consumes `ExternalJob`. No circular dependency.
