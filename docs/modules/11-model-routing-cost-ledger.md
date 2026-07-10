# M11 — Model Routing, Usage, and Cost Ledger

> **Capability status:** `not implemented`
> **Execution gate:** Locked
> **Spec maturity:** contract draft; provider facts/adapters require current primary-source checks
> **Wave:** usage/cost core contract in W1/W2; routing/cache/native-batch adapters in W4
> **Depends on:** M00, M03, M08, M10 context segments, provider settings/secrets

## 1. Purpose

Keep model/provider routing, token/usage observations, cache attribution, quota snapshots, and cost
honest while keeping CLI/runtime lanes outside API routing. Unknown values remain unknown.

The first closed loop is: one real API turn records why a provider/model was selected, the exact
usage observation source, confirmed/estimated/unknown cost, and visible error/recovery without
claiming unobserved cache or quota savings.

## 2. Scope Split

### M11A Usage/Cost Core — needed before downstream paid jobs

- cost-source and confidence vocabulary;
- usage observation and provider receipt correlation;
- estimate versus confirmed reconciliation;
- finite budget preflight/actual accounting;
- filtered UI/report projections.

### M11B Routing/Cache/Batch — W4

- API/OAuth provider/model selection and explanation;
- provider-specific prompt/request assembly and cache observations;
- provider-native Batch adapter as an M08 ExternalJob execution mode;
- quota snapshots only through authorized official provider paths.

M11B does not block the first M08 real-time single-request image job if it records cost as unknown
or provider-confirmed through the M11A vocabulary.

## 3. Lane Boundary

- API/OAuth operations may use M11 routing, request assembly, cache, usage, and native Batch.
- CLI, PTY, local tool, and external application lanes keep their selected runtime; M11 records
  reported usage/cost source but does not swap their model or intercept their transport.
- Workflow creation does not authorize a provider/model; each step uses its effective capability
  and routing policy.

## 4. Data Contracts

```ts
type ValueConfidence = 'confirmed' | 'estimated' | 'unknown'

type UsageObservation = {
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
  source: 'provider_response' | 'provider_invoice' | 'local_measurement' | 'estimate' | 'none'
  confidence: ValueConfidence
  observedAt: string
}

type CostRecord = {
  costRecordId: string
  usageObservationId: string
  amount?: number
  currency?: string
  confidence: ValueConfidence
  pricingRef?: string
  reconciles?: string
  createdAt: string
}

type RoutingDecision = {
  decisionId: string
  invocationId: string
  eligibleRoutes: string[]
  selectedRoute: string
  reasonCodes: string[]
  policySnapshotRef: string
  estimate?: { amount?: number; currency?: string; confidence: ValueConfidence }
  decidedAt: string
}
```

Exact types must be promoted into canonical protocol. Pricing is versioned/effective-dated; local
hashes or marketing claims never substitute for provider usage/price evidence.

## 5. Routing

Routing considers only routes already permitted and configured for the operation:

- capability/model compatibility;
- data/sensitivity and region/provider policy;
- latency and execution mode requirement;
- finite budget and known/unknown estimate;
- reliability/availability observations;
- explicit user route or pinned workflow version;
- provider limits and M08 queue pressure.

The result includes reason codes. “Cheapest” is not claimed when prices/usage are unknown. Fusion
or multi-model execution remains default off and requires a separately budgeted operation.

## 6. Prompt/Request Assembly

M10 provides typed ContextSegments with origin, sensitivity, and token estimates. The selected
provider adapter assembles the final request according to that provider/model's current contract.

Rules:

- system/tool/user/native-media structures remain typed where the provider supports them;
- no universal fixed string order is assumed across all providers;
- stable-prefix strategies are provider/model/version specific and measured;
- structured data is never passed through unstructured output compression;
- request hashes exclude secrets and are diagnostic, not proof of provider cache use;
- a cache hit/saving is confirmed only from provider response/billing fields.

## 7. Cache Attribution

```ts
type CacheObservation = {
  providerId: string
  modelId: string
  requestPrefixHash?: string
  status: 'confirmed_hit' | 'confirmed_miss' | 'not_supported' | 'unknown'
  cachedInputTokens?: number
  source: 'provider_response' | 'provider_invoice' | 'none'
}
```

No cross-provider savings percentage is frozen. If a provider returns no cache fields, the status
is unknown/not-supported rather than inferred from a matching local hash.

## 8. Native Batch

Native Batch is a later provider-specific adapter used by M08 ExternalJob. It is not prompt-level
grouping or local concurrent `Promise.all`.

M08 owns durable job/item lifecycle and reconciliation. M11 owns provider request formatting,
submission/inspection/result parsing, usage/cost observation, and current provider constraints.

Required before enabling one provider:

- current official endpoint/model/size/retention/deadline/cancellation documentation;
- batch and item idempotency/mapping;
- partial failure and result retention;
- protected input/output files and deletion policy;
- confirmed pricing/cost-source handling;
- restart reconciliation through M08;
- no automatic resubmission while provider state is unknown.

Interactive chat, approval interception, PTY, and real-time workflow gates are never native Batch.

## 9. Quota and Subscription Honesty

- Use only official, authorized provider APIs/receipts/settings.
- Do not inspect cookies/tokens, automate account rotation, or infer hidden quotas.
- A subscription allowance is not equivalent to zero cost.
- Quota snapshots include source/time/confidence and may be stale/unknown.
- Profiles are legal user configurations, not evasion/routing pools.

## 10. Budget Behaviour

- A workflow/job declares a finite budget or explicitly unknown-cost approval policy.
- Estimated spend reserves budget; confirmed observations reconcile it.
- Overshoot risk pauses unscheduled work rather than silently continuing.
- Costs from cancelled/failed/late outputs remain recorded when charged.
- No module writes an independent cost ledger; it submits observations to M11.

## 11. UI Contributions

- compact usage/context/budget status near the active model/job;
- M13 provider/model/budget settings and current source labels;
- M16 inspector for routing reason, estimate, actual, cache observation, and reconciliation;
- M17 preflight/step cost status;
- no finance dashboard unless a later real need is approved.

## 12. Candidate Actions — Not Frozen

| Candidate | Purpose | Policy intent |
|---|---|---|
| `usage.read` | filtered usage/cost records | L0 |
| `routing.explain` | show decision/reason/policy snapshot | L0 |
| `routing.preview` | estimate eligible routes without executing | L0, unknown allowed |
| `routing.policy_update` | change provider/budget policy | L2 |
| `batch.submit` | submit provider-native batch via M08 | dynamic L2 data/cost |
| `batch.cancel` | best-effort provider cancellation | L1/L2 by side effect |

## 13. Error Handling

| Condition | Result | Recovery |
|---|---|---|
| no eligible route | no provider call | configure/permit a compatible route |
| price/usage unknown | labelled unknown, not zero | explicit approval or wait for receipt |
| provider response lacks usage | retain unknown observation | reconcile invoice/official receipt later |
| budget exhausted | unscheduled work paused | finite increase or cancel |
| provider batch unknown | M08 reconciling | inspect provider before retry |
| stale quota snapshot | warning/source/time shown | refresh official source |
| cache fields absent | unknown/not supported | no savings claim |

## 14. Verification

### M11A

1. Record one real API/provider usage response and one unknown-cost operation.
2. Show confirmed/estimated/unknown distinctly in UI and report.
3. Reconcile an estimate with a later confirmed record without rewriting history.
4. Fail/cancel one charged operation and retain truthful cost.
5. Verify CLI lane bypasses routing while still allowing an honest source label.

### M11B

1. Preview and execute one real routing decision with reason codes.
2. Verify sensitive/provider-incompatible routes are absent.
3. Confirm cache status only from real provider fields.
4. Run one approved native Batch with partial failure and restart reconciliation through M08.
5. Attempt unknown-state retry and verify duplicate submission is blocked.

## 15. Open Gates

- Freeze usage/cost/routing/budget contracts and one physical ledger authority.
- Verify each provider adapter against current official primary documentation.
- Resolve protected request files and retention through M05/M08.
- Split M11A/M11B packets and waves explicitly.

## 16. Non-Goals and Prohibitions

- No CLI model routing, cookie/token scraping, account rotation, invented cache savings, unknown-as-
  zero cost, or second Batch/job/cost store.
