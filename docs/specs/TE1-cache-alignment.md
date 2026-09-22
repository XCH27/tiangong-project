# SPEC — TE1 Cache alignment + cache ledger (token-economy track)

> Spec status: `active` (standing token-economy track — runs beside the release queue, Decision
> E12 / [`../05-ROADMAP.md`](../05-ROADMAP.md) standing tracks)
> Owner acceptance date: —

## Outcome

Every session's cache economics become measurable and visible: normalized cache accounting across
providers, honest savings estimates, and prefix-stability instrumentation that catches the two
silent cache killers (stable-zone mutation, non-append history rewriting). Zero behavior change to
model calls themselves in this spec.

## Current implementation boundary

TE1 is `not implemented` after the v0.13.4 rebuild. `cache-economy.ts`, its tests,
`NormalizedCacheUsage`, and `SessionManager.getCacheEconomySummary` are absent. Their previous
utility and adapter test results belong to `snapshot/pre-rebuild-2026-09-21`, not this tree.
Craft's UsageTracker, provider events and context-window accounting remain the starting path.
During R0, inspect existing evidence only. All new TE1 instrumentation, adapters and UI wait for
the R0 baseline exit; the standing track does not bypass the owner's development order.
Recheck their current semantics before selectively readmitting any accounting helper; retain one
usage ledger and prove single-counting with the actual adapter consumers.

## Remaining slices (each = one bounded task, in order)

| # | Slice | Where (verified entry points) | Acceptance |
|---|---|---|---|
| S1 | Normalize usage first: reconstruct a minimal helper against current event shapes, preserve unknowns and prove Pi single-counting | current Claude/Pi events and UsageTracker; no new store | TE1-C2 |
| S2 | Feed summaries: extend both current event adapters and the existing usage ledger, then expose a per-session summary | `packages/shared/src/agent/backend/claude/event-adapter.ts`, `backend/pi/event-adapter.ts`, `core/usage-tracker.ts`, SessionManager summary projection (to implement) | TE1-C1 |
| S3 | Prefix snapshots: at prompt assembly, capture `{stableZone: [systemPrompt, toolDefsSerialized], logZone: messageIds}` per request; count breaks via `diagnoseCacheBreak`; emit on the existing usage/debug event path (no new store) | `claude-agent.ts` (system prompt + `preset` assembly), `pi-agent.ts` equivalent | TE1-C3 |
| S4 | Surface it: session info/cost display gains cache columns (hit rate, saved fraction, saved USD when price known, prefix breaks) — smallest honest UI per P5, no new page | existing session usage/info surface (find with `rg usage_update` in renderer) | TE1-C4 + owner CHECK |
| S5 | Baseline harness: after R0 and the normalization/adapter slice, replay one recorded label/status trace to prove the measurement path; then record the current Claude-full and Pi-current profiles on a sealed task. R3 later becomes the cross-domain trace. Store machine output or concise numbers, not a new report | script under `app/scripts/`, read-only vs. providers or mocked usage fixtures | TE1-C5 |

## Acceptance criteria

| ID | Criterion | Verified by |
|---|---|---|
| TE1-C1 | A completed session yields one `CacheEconomySummary` with non-invented numbers from real adapter events | targeted test with real-shaped fixtures |
| TE1-C2 | Pi input accounting proven single-counted; regression test locks it | fixture test before/after |
| TE1-C3 | A deliberate mid-session system-prompt change is detected and reported as a stable-zone break; append-only turns report none | targeted test + one real dev-session log |
| TE1-C4 | Owner sees hit rate / savings / breaks on the session surface; wording plain-language | owner acceptance |
| TE1-C5 | Baseline numbers recorded (hit rate, saved fraction, breaks) for the fixed trace | harness output |
| TE1-C6 | No new store, no second ledger, no behavior change to model calls (S1–S3 are read-and-report) | diff review |

## References consumed

The relevant fixed checkouts are already under `源码参考/`. They are evidence only; this spec does
not authorize cloning, importing a runtime, or changing admission status. Current license and
admission facts come only from [`../references/REFERENCE-REGISTRY.md`](../references/REFERENCE-REGISTRY.md)
and `源码参考/meta/`; stale clone instructions do not live in an implementation spec.

## Non-goals

Auto-placing Anthropic breakpoints (needs S3 data first); any compaction change (L3 has its own
gate); model routing; UI settings for cache (no knobs until measurements justify one); deleting or
rewriting prompt content; centralized tool filtering; Pi-light; Tool Search. Those last four change
model-call behavior and require a separate owner-accepted slice after this baseline (E13).

## Risks

- Reading SDK usage wrong → S1/S2 fixtures use captured real shapes, not invented ones.
- Silent behavior change → TE1-C6 diff review; S1–S3 are observation-only.
- Numbers drift (provider pricing) → profiles carry `verifiedAt` + `costConfidence`; update data,
  not call sites.
