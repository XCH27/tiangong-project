# M11A Usage / Cost Core — W0.1 Text Freeze

> **Status:** **text-frozen** for W0.1 (2026-07-09) as contract version `w0.1-m11a-1`  
> **Implementation:** TypeScript on clean v0.11 base — **not** yet landed; Workers implement only from an active W2 packet naming this version  
> **Owner:** Lead (contract); M11 Worker (W2 slice); M08 consumes fields only  
> **Wave:** freeze @ W0.1; implement @ W2 / L02; required before W3A paid/unknown jobs  

## 1. Purpose

One vocabulary for usage observations, cost records, and budget preflight so M08 ExternalJob and
later M11B routing share a single cost path. **No second cost ledger.**

## 2. Frozen types

```ts
export type ValueConfidence = 'confirmed' | 'estimated' | 'unknown'

export type UsageObservation = {
  observationId: string
  invocationId: string
  workflowRunId?: string
  externalJobId?: string
  providerId?: string
  modelId?: string
  executionMode: 'realtime' | 'native_batch' | 'local' | 'cli' | 'external'
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
  mediaUnits?: Record<string, number>
  source:
    | 'provider_response'
    | 'provider_invoice'
    | 'local_measurement'
    | 'estimate'
    | 'none'
  confidence: ValueConfidence
  observedAt: string // ISO-8601
}

export type CostRecord = {
  costRecordId: string
  usageObservationId: string
  amount?: number
  currency?: string
  confidence: ValueConfidence
  pricingRef?: string
  reconciles?: string // prior costRecordId
  createdAt: string
}

export type BudgetPreflight = {
  preflightId: string
  invocationId: string
  externalJobId?: string
  estimatedCost?: { amount: number; currency: string; confidence: ValueConfidence }
  mode: 'bounded' | 'unknown_requires_approval' | 'free_or_local'
  maxAmount?: number
  currency?: string
  decision: 'allow' | 'require_approval' | 'deny'
  decidedAt: string
}
```

## 3. Invariants

1. Paid or unknown-cost external work must attach `BudgetPreflight` before submit when
   `mode !== 'free_or_local'`.
2. `ExternalJob.cost.source` must use `ValueConfidence` only (`confirmed` | `estimated` | `unknown`).
3. CLI/runtime lanes may record usage with `executionMode: 'cli' | 'local'` without M11B routing.
4. M11B must not invent alternate usage tables; it writes M11A rows.
5. Unknown stays unknown — never invent token counts to satisfy a schema.

## 4. Authority

| Concern | Owner |
|---|---|
| Type definitions / schema version | Lead (this file + protocol port) |
| Persisted usage/cost rows | M11A using M00 durable correlation |
| Job embedding of cost fields | M08 (reference M11A ids; no fork) |
| UI projections | filtered views only |

## 5. Implementation gate

| Gate | Requirement |
|---|---|
| W0.1 exit item 5 | This file present + freeze record cites `w0.1-m11a-1` |
| W2 Ready for M11A/M08 | Active packet + execution-ready maturity |
| W3A generative providers | M11A usable **or** jobs restricted to free/local with explicit `unknown` cost |

## 6. Non-goals

- Provider model auto-routing (M11B / W4)
- Native Batch queue implementation (M11B)
- Quota bypass or multi-account evasion (D4/D23)
