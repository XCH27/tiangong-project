# SYS-03 — Token, memory and skill economy

**Rows:** INTEL-01..07, EXEC-14, ORCH-03, INFO-06. **Craft base:** existing prompt/tool assembly,
UsageTracker, provider adapters, compaction/large-response paths, Skills/Sources and rtk rewrite.
**Development order:** TE1/R3 measurement, R9 experience, R15 loadout, R17 policy closure.
**Conditional SYS-03 ownership:** the centralized effective prompt/tool projection and, only when their
gates fire, ContextPack/ContextSegment and reviewed memory. **Depends on:** SYS-01 policy/profile
facts; the projection and Action seam remain separate.

**Design authority:** [`../../17-TOKEN-ECONOMY.md`](../../17-TOKEN-ECONOMY.md) (Decision E12) — the
layered pipeline (L0–L6), the fuse/connect/reject integration policy, guardrails and landing order.
This packet stays the delivery boundary; 17 owns the cross-cutting design. Owner-curated candidate
inventory: [`../../references/context/02-TOKEN-SAVING-CANDIDATE-INVENTORY.md`](../../references/context/02-TOKEN-SAVING-CANDIDATE-INVENTORY.md).

## Closed loop

Raw source/session/tool output → bounded evidence selection through the effective projection → provider-specific
schema adaptation over one effective prompt/tool projection → Agent call →
real/estimated/unknown usage → quality evaluation →
evidence-backed autonomous memory write/consolidation (logged, D5 floors) → optional human
curation (pin/correct/delete).

The effective projection is a view over existing prompt/profile/policy/tool facts, not a new store.
`ContextPack`/`ContextSegment` are conditional extracted vocabulary only after two real consumers
prove a seam. Reviewed memory is a separate derivative module; it cannot repair an oversized base
prompt or an indiscriminate tool catalog.

## First proof

First complete TE1 as observation-only: normalize provider usage once, report cache/prefix facts and
record the current full-profile baseline without mutating calls. After R0 and a separately accepted
profile slice, replay sealed maintenance/coding tasks through current-full and Pi-light/effective-
projection candidates. Then use R3 as the cross-domain trace. Keep model, effort, repository,
permissions and acceptance fixed; record request-component inventory, usage confidence, latency,
first-pass acceptance, rework, halts, hidden-tool recovery, stale/policy violations and cost per
accepted outcome. Memory review is not part of this first proof.

## Acceptance and references

Use `INTEL-01-A` through `INTEL-07-A`, `EXEC-14-A` and `MEM-001..003`. Harness evidence is
[`../../references/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md`](../../references/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md):
Craft/Pi establish the local runtime/wrapper baseline; Databricks supplies the model×harness
hypothesis; OpenHands, Hermes and OpenClaw supply bounded executor, capability-probe, discovery,
grant and stale-observation mechanisms only. Audit the existing token candidate inventory
independently. Each optimizer must beat the unchanged local profile on a declared trace before
promotion; no external absolute KPI is inherited.

Top-tier implementation evidence is deliberately narrow: Agent Skills specifies progressive
disclosure; Mem0 supplies memory CRUD/evaluation mechanisms; Pi supplies the thin harness comparator.
Context Mode is not retained as a standing reference because its smaller/newer integration and a
reported silent protection failure make it weaker evidence than these sources plus Fleet traces.

## Stop conditions

Stop on quality regression, irreversible pruning, hidden prompt mutation outside the accepted
profile slice, missing-tool recovery failure, permission/stale violation, unscoped retrieval, or a
second harness/loadout/UsageTracker/memory authority.
