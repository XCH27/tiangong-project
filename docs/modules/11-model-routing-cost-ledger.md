# 11 Model Routing Cost Ledger

## 1. Mission

Route API tasks intelligently while keeping usage, quota, cache, and cost honest and separate from CLI lanes.

## 2. User-Visible Loop

User sends API task or creates TeamRun, Craft Agents (二开补强) records routing decision, usage/cost/cache data, and displays context/quota/cost without mixing unknowns into zeros.

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

## 18. Prompt Assembly Layer (Stable Prefix)

Module 11 is the **sole owner** of Prompt construction. No other module builds the final
Prompt string sent to a model. Modules submit typed `ContextSegment` objects; the assembler
joins them in fixed order.

### 18.1 Why Ownership Matters

Provider-native Prompt Caching (Anthropic, OpenAI, DeepSeek) saves ~50% token cost by
caching a shared prefix. The prefix is only cacheable if its byte sequence is identical
across turns. Any module that inserts content at an arbitrary position breaks the prefix
and eliminates the saving. Centralising assembly in M11 is the only reliable fix.

Reference: DeepSeek-Reasonix (Green-Light MIT) stable-prefix cache and planner/executor
patterns inform this design. Reasonix work belongs here in M11, not in TeamRun.

### 18.2 Fixed Segment Order

The assembler joins segments in this order, frozen after Wave 0 contract freeze:

```
1. system_prompt          — global Craft Agents (二开补强) identity + tool list (never changes within a version)
2. frozen_memory          — Core-tier facts from DistilledToolMemory (global_preference scope)
3. project_outline        — AST skeleton of active project files (Layer 1 Retrieval output)
4. dynamic_context        — Recall-tier memory + ProjectPack excerpts (session-scoped)
5. tool_results_summary   — compressed RTK output (Layer 4), if any
6. user_turn              — current human message (always last)
```

Segments 1–3 form the **stable prefix**. They must be byte-identical across turns within
the same session version. Any change to segments 1–3 invalidates the cache and must be
treated as a new session for billing purposes.

Segment 4 and below are the **dynamic tail**. They change per turn; provider caching does
not apply to them.

### 18.3 ContextSegment Contract

```ts
type SegmentSlot =
  | 'system_prompt'
  | 'frozen_memory'
  | 'project_outline'
  | 'dynamic_context'
  | 'tool_results_summary'
  | 'user_turn'

interface ContextSegment {
  slot: SegmentSlot
  content: string          // plain text or XML-tagged block
  tokenEstimate: number    // caller’s best estimate; assembler may recount
  sourceModule: string     // e.g. 'M10', 'M03', 'terminal'
  immutable: boolean       // true for stable-prefix slots (1–3)
}
```

The assembler **rejects** any segment that:
- Claims slot `system_prompt` / `frozen_memory` / `project_outline` with `immutable: false`.
- Is submitted after the assembler has already serialised the stable prefix for this turn.
- Exceeds the per-slot token budget defined in routing settings.

### 18.4 Prefix Hash & Cache Attribution

After joining segments 1–3, the assembler computes `prefixHash = sha256(prefix_string)`
and writes it to the routing cost ledger alongside the turn’s usage sample. This enables:

- Cache hit detection: if `prefixHash` matches the previous turn’s value, the provider
  should return a `cache_read_input_tokens` discount. If no discount is observed despite
  a matching hash, flag the turn `cacheStatus: 'miss_unexpected'` for diagnostics.
- Cost attribution: `SUBSCRIPTION_QUOTA` turns with a confirmed cache hit are labelled
  `cacheStatus: 'hit'` and their token cost is reduced accordingly in the ledger.

### 18.5 Validation

- Unit test: same `system_prompt` + `frozen_memory` + `project_outline` across two turns
  produces identical `prefixHash`.
- Integration test: a turn that modifies only `dynamic_context` does not change
  `prefixHash`.
- Regression test: any new feature that injects content into a stable-prefix slot must
  pass a `prefixHash` stability check in CI before merge.

## 17. Non-Goals & Prohibitions

- **No CLI Routing:** Do not route local CLI runtime processes through the model routing, cache, or Fusion api pipelines. CLI lanes always use their own runtime model.
