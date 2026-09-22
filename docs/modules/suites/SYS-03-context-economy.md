# SYS-03 — Token, memory and skill economy

**Rows:** INTEL-01..07, EXEC-14, INFO-06. **Craft base:** existing prompt/tool assembly,
UsageTracker, provider adapters, compaction/large-response paths, Skills/Sources and an optional external RTK adapter.
**Development order:** after R0: TE1/R3 measurement, R9 experience, R15 loadout, R17 policy closure.
**Conditional SYS-03 ownership:** the centralized effective prompt/tool projection and, only when their
gates fire, ContextPack/ContextSegment and reviewed memory. **Depends on:** SYS-01 policy/profile
facts; the projection and Action seam remain separate.

**Design authority:** `SYS-03-context-economy.md` (Decision E12) — the
layered pipeline (L0–L6), the fuse/connect/reject integration policy, guardrails and landing order.
This packet owns both the delivery boundary and the context pipeline; no retired module 17 is an authority. Owner-curated candidate
inventory: [`../../references/context/02-TOKEN-SAVING-CANDIDATE-INVENTORY.md`](../../references/context/02-TOKEN-SAVING-CANDIDATE-INVENTORY.md).

RTK implementation reality: `agent/core/pre-tool-use.ts` calls `rtk-rewrite.ts` only with an enabled
preference and detected compatible binary. The adapter invokes `rtk rewrite <command>`; absent,
incompatible, failed or unsupported rewrites retain the original command. This is an adapter to
terminal-output shaping, not Fleet's own compression engine, installed-binary evidence or a measured
saving. The old reference checkout is absent; preserve that distinction in L2 status and benchmarks.

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

After the R0 baseline exit, complete TE1 as observation-only: normalize provider usage once, report cache/prefix facts and
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
Context Mode has no code admission. Retention is a separate owner-controlled decision; a reported
protection failure is a regression case to verify, not permission to remove a checkout.

## Stop conditions

Stop on quality regression, irreversible pruning, hidden prompt mutation outside the accepted
profile slice, missing-tool recovery failure, permission/stale violation, unscoped retrieval, or a
second harness/loadout/UsageTracker/memory authority.

---

## Module boundary — Layered agent memory module


First-slice readiness: see PACKET-INDEX and the execution contracts below. implementation status: `not implemented`; development order: R9
(after R0; ordinary working-note file writes may accompany R3 under D5). This packet owns the layered memory files, consolidation and
curation surface only. Prompt assembly, tool loadout, compaction and cost accounting belong to
`../suites/SYS-03-context-economy.md` and SYS-03; calling this module a
"context broker" incorrectly implies a second routing authority.

#### Direction (owner, 2026-07-20)

Memory accumulation is **agent-autonomous**. Humans do not gate retention — they curate when they
want to (pin / correct / delete). The system's job is layering, floors, logging and reversibility,
not approval queues. Canonical decision: D5 in [`../../02-DECISIONS.md`](../../02-DECISIONS.md).

#### Layered model (files under the Workspace authority — no memory database before the D2 trigger)

| Layer | File(s) | Written by | Injected? |
|---|---|---|---|
| Working manual (rules/conventions) | existing workspace instructions (`AGENTS.md`-class context files) | human-editable; agent proposes edits as diffs | through the existing instruction path; actual limits are adapter-specific and must be measured |
| User profile | `memory/USER.md` | consolidation writer; human curation | always, small budget, visible truncation |
| Long-term memory | `memory/MEMORY.md` | consolidation writer; human curation | session start, per-file budget, visible truncation |
| Working notes | `memory/notes/YYYY-MM-DD[-slug].md` | agent, freely during/after work | **never wholesale** — indexed for scoped retrieval |
| Domain memory (optional) | `memory/domains/<domain>.md` | consolidation writer; human curation | only when the loadout includes the domain |
| Consolidation log | `memory/CONSOLIDATION.md` | consolidation pass only | never; human-readable audit |
| Archive | `memory/archive/…` | consolidation pass | never; excluded from default recall |

Entry metadata carries these dimensions:
**partition** (session/project/tool/user-preference/policy/sensitive-quarantine/archive),
**lifecycle** (`transient → active → retained → archived`), **sensitivity**
(`normal | sensitive | raw_path | uncertain`, unknown defaults `uncertain` = most restrictive).
Partition + sensitivity filtering always precedes similarity scoring. In the file form, metadata is
carried as entry front-matter/inline tags, not a parallel store.

#### Consolidation (the autonomous loop)

Idle-triggered or post-session, on an **auxiliary lane that never rewrites the main session's
cached prefix mid-span** (Hermes curator / OpenClaw dreaming precedent —
[`../../references/context/04-GATEWAY-AGENT-COMPARISON.md`](../../references/context/04-GATEWAY-AGENT-COMPARISON.md)):
dedupe and stage recent notes → promote durable entries (with source pointers) into
`MEMORY.md`/`USER.md`/domain files → mark superseded entries and move stale material to archive →
append one human-readable log entry (what moved, why, source refs). Conflicting entries stay
explicitly conflicting until a logged pass or curation supersedes them (04 §3). Consolidation
archives; it never hard-deletes. Pinned entries are never auto-modified.

#### Hard floors (D5 — autonomy never crosses these)

1. No credentials/secrets/tokens in any memory file (F2); suspected secret-bearing candidates are excluded. Record only a redacted refusal and safe source
   pointer in quarantine; never store the raw secret there.
2. Project partition never leaks across Projects; cross-project promotion is an explicit
   origin-marked transfer into the user/tool partition.
3. Every retained entry carries source pointers into Session evidence; verbatim transcript dumps
   are not memory.
4. User deletion is honored end-to-end, including derived index entries; until index cleanup
   completes the entry is `reconciling`, not retrievable (04 §3).
5. Memory writes never change policy, permission classes, or authority-bearing Skills by
   themselves.
6. Raw timeline remains the evidence authority and is never rewritten.

#### Retrieval and injection

Retrieval is a session tool over the existing search authority (scoped query → references + scores;
never mutates history; never grants permission). Injection of curated layers rides the stable
prefix under per-file budgets with visible truncation; retrieved segments enter the volatile tail,
never the stable zone (L6×L1 rule below). Each layer's injected share is visible on the context
surface (P-29/P-31; QoderWork's awareness panel — per-file size + percent-of-context — is the
owner-supplied product reference for this display).

#### Frontend and backend boundary

- P-31 shows layers, per-file injected share, consolidation log, conflicts, and pin/correct/delete.
- P-29/P-30 display measured context/cost projections; they do not read memory files directly —
  they consume the one SYS-03 effective projection.
- Backend extends existing Workspace file, search and Session-evidence paths. No
  `ExperienceProposal` store; the consolidation pass is a scheduled/idle task on existing
  automation seams.
- Human and Agent edits to memory files go through the same permissioned file path; curation
  actions (pin/correct/delete) are ordinary governed mutations once R4 exists.

#### Failure and recovery

Missing source pointer, revoked scope, stale entry, contradictory records, unavailable index and
deletion failure are explicit states. Consolidation failure leaves working notes intact and logs
the failed pass. The safe fallback is the unchanged Craft Session/context path. Disable or
uninstall leaves raw evidence intact and stops injection; files remain user-readable Markdown.

#### Evidence and reference boundary

QoderWork awareness surface (owner screenshot, 2026-07-20): layer taxonomy (manual/profile/
long-term/daily/domain), per-file context share, rebuildable index, export/import — product
reference for the P-31 surface. OpenClaw (MIT/TS): MEMORY.md + daily notes + `memory_search`,
injection budgets with visible truncation, opt-in dreaming consolidation with human-readable
diary — licensed local-rework candidate after symbol-level admission. Hermes (MIT/Python):
curator-on-auxiliary-lane, archive-never-delete, pinning, FTS5 session search — pattern reference
only. Mem0 stays an Apache-2.0 mechanism reference for explicit add/search/update/delete and its
evaluation harness. LongMemEval-V2, MemoryAgentBench and Mem2ActBench supply evaluation dimensions,
including harmful-memory behavior. Letta and other full memory-agent platforms remain rejected as
standing dependencies. Admission still goes through
[`../../references/REFERENCE-REGISTRY.md`](../../references/REFERENCE-REGISTRY.md).

Acceptance (reworded for autonomy): `MEM-001` an agent records a working note and the consolidation writer promotes a distilled
long-term entry with source pointers, without per-entry human approval; `MEM-002` a logged consolidation
pass promotes/archives entries, the log explains each move, and pinned entries are untouched;
`MEM-003` user deletion removes an entry and its index derivatives without rewriting raw Session
history; `MEM-004` a secret-bearing candidate is excluded, with only a redacted refusal retained and nothing injected; `MEM-005`
project-partition entries are not retrievable from another Project.

#### Reality and activation sequence

The former `memory-scope.ts`, `foreign-memory.ts` and label-based curator kit were removed by
the rebuild. Their old typechecks do not establish a current contract implementation. Use D5 and
H16–H18/H25–H27 for the surviving rules; never restore curator identity in a label.

After R0, ordinary file tools can record scoped working notes during R3. R9 introduces the measured
file metadata/retrieval path, single consolidation writer, injection budgets and curation consumers
through existing Workspace/Session/permission authorities. Configuring autonomous consolidation
establishes scope and cost limits; each promotion is logged, not sent through a human approval queue.
Delegates return findings instead of writing curated memory. Imported foreign histories remain
searchable evidence with origin/trust/scope; they are not automatically true memory.

## Context pipeline and admission gates (L0–L6)

These are responsibilities in the existing context path, not seven new services or mandatory
dependencies. Introduce a layer only when an accepted trace proves the gap.

| Layer | Responsibility | Gate / retained evidence |
|---|---|---|
| L0 | Handoff of task intent, exact inputs and relevant findings | Preserve source/scope and unfinished work; no second delegation store |
| L1 | Provider-specific cache alignment and measured prefix stability | TE1 observes first; normalize cache reads/writes and uncached input once |
| L2 | Deterministic selection/formatting of redundant data | Preserve identifiers, paths, code, numbers and tool/schema structure; retain retrievable original |
| L3 | Extend current compaction | One compaction owner; recover task/permission/unfinished work and compare accepted outcomes |
| L4 | Optional lossy semantic compression | Separate measured gate; fidelity/quality regression rejects it; never compress policy or grant evidence into weaker rules |
| L5 | Bounded tool/result output | Match consumer needs, explicit truncation and scoped original retrieval; no generic hidden rewrite proxy |
| L6 | Scoped curated memory | D5 floors, single writer, origin/freshness and deletion; newly retrieved data enters the volatile tail |

L6×L1: freeze the applicable curated prefix for the request/span; consolidation publishes a new
version for a later boundary, never silently rewrites a running span. Similarity alone never proves
freshness, authorization or equivalence for an effectful action. A ContextPack is a derived view
with source/version/scope and confidence, not another memory database or a bundle of raw secrets.

**Integration choices:** fuse a small deterministic mechanism into its existing owner; connect an
optional engine behind a typed seam when its measured benefit pays for lifecycle/maintenance;
reject a duplicate owner or unproved optimizer. Measure accepted-outcome cost and rework, not only
tokens removed. Public reduction percentages are hypotheses, never Fleet acceptance targets.

**Cost contract:** use one usage ledger with dated provider/user rate provenance. Separate uncached
input, cache read, cache write, output, context tiers and non-token units. Preserve known zero,
unknown and estimates distinctly. Subscription allowance and estimated API-equivalent cost do not
become a provider bill. Report subtotal plus priced/unpriced coverage; repeated retries and failed
jobs still consume usage. A budget warning, authorized execution limit and provider charge receipt
are distinct events. Cancel means requested until the owning runtime confirms it; reconcile uncertain
paid submissions before retrying. No optimizer may switch model, effort or acceptance criteria
inside the comparison or discard capability merely to meet a token cap.

Provider request assembly preserves system/tool/user/media structure and follows each provider's
contract; local prefix hashes are diagnostics, never proof of a cache hit. API routing may select
only configured, permitted routes and must explain overrides. A CLI/PTY runtime keeps its selected
engine; usage attribution never authorizes an automatic engine swap.

Provider-native Batch is a conditional Job adapter, not ordinary parallel tool calls. Its admitted
provider must document limits, retention, cancellation and pricing; preserve item IDs, partial
results, protected input/output files and restart reconciliation. Unknown provider state prevents
automatic duplicate submission. The one Job owner owns lifecycle and the one usage ledger owns
accounting. R11/R17 decide activation; this paragraph creates no earlier implementation gate.

## Subscription allowance acquisition and display

**Status:** `not implemented`. Extend the existing connection/runtime and usage projection; do not
add an account store or infer remaining membership capacity from Session token counts. The current
SDK exposes useful data that Fleet does not consume. The source comparison is recorded in the
[reference registry](../../references/REFERENCE-REGISTRY.md#subscription-allowance-comparison).
Acquisition/display stays in the existing P-30 / INTEL-04 queue with R17 closure; TE1/R3 measurement
does not authorize a new quota surface or adapter. Adaptive routing remains a separate real-caller
gate. An allowance reader never switches accounts, redeems credits or enables paid overage.

| Connection | Recommended acquisition | Limits and fallback |
|---|---|---|
| Claude subscription | Consume `rate_limit_event` from the existing Claude runtime. Installed and lockfile-pinned Agent SDK **0.3.258** also exposes `usage_EXPERIMENTAL_MAY_CHANGE_DO_NOT_RELY_ON_THIS_API_YET()` sending `get_usage`. | The query is explicitly unstable: isolate behind a version/capability-checked adapter and prove a fixture before enabling. Events may expose only one window and do not guarantee a complete idle-account snapshot. Unsupported/missing data stays unavailable; do not start paid inference just to refresh a meter. |
| Codex subscription | Use the selected runtime's authenticated `account/rateLimits/read` and `account/rateLimits/updated`; prefer the returned per-limit map over the legacy single bucket. | Bind results to runtime, connection, account and provider workspace. Read returned durations rather than assuming two fixed windows. A missing protocol capability is unavailable, not permission to read another account's cache. |
| Cursor subscription | The official Spending dashboard is the reliable user-facing fallback. Its Admin API is a separate team-scoped integration when the owner supplies the applicable credentials. | This review did not establish an official personal-plan quota API. Do not treat a team spend endpoint as personal remaining capacity or copy browser cookies/private application state. |
| Other providers/API keys | A provider adapter uses a documented authenticated quota/balance endpoint when present. cc-switch's native balance adapters are a comparison candidate, separate from its custom-script executor. | Preserve native units and scope: balance, key budget, request limit, token limit and plan allowance are different measurements. Check required credential scope per endpoint: OpenRouter `/api/v1/key` describes the current key; account-wide `/api/v1/credits` requires a management key. Ordinary API connections have no invented subscription window. |

The installed Claude SDK's `SDKControlGetUsageResponse` distinguishes subscription type,
`rate_limits_available`, nullable window percentages and reset timestamps. Current
`agent/backend/claude/event-adapter.ts:adapt` has no `rate_limit_event` case; a declaration in the
SDK is not a wired Fleet feature. Event utilization units must be established separately from the
query's documented 0–100 percentages. Runtime-owned credentials and refresh remain with that
runtime; a display adapter must not rotate its refresh token independently.

Recommended normalized snapshot: connection/runtime/account/provider-workspace identity,
provider-native bucket ID/label, unit and optional used/limit/remaining values, window duration,
reset time, observation time, data source, freshness and classified availability. Keep known zero,
unknown, stale, unsupported, auth-required and rate-limited distinct. Validate ranges/units before
projection; never replace invalid data with zero. Avoid summing shared account limits across
Sessions or provider keys. Record credential/configuration revision in the request identity; an
app/provider name or a mutable `default` account alias is insufficient. Keep last successful sample
time, latest attempt time and error time separate. Validate that a success actually contains a
recognized measurement; valid JSON with missing fields is not a zero-balance result.

Codex's refreshed `AccountRateLimitsUpdatedNotification` is a sparse update, not a complete
replacement snapshot. Merge only fields whose protocol semantics allow it into a matching identity,
or reread the runtime snapshot. Null account metadata must not erase previously observed fields;
`spend_control_reached: null` remains unavailable, not false/unlimited. Record per-field freshness
when values come from different observations. INTEL-04 proof includes a sparse model-window event,
missing spend-control state, an account switch while refresh is pending and authentication failure
with an old successful sample. This extends the
[current protocol evidence](../../references/REFERENCE-REGISTRY.md#refresh-mechanisms-and-counter-evidence),
not the authorization or credential owner.

Keep the existing context indicator. Its detail can place **Session context** and **Account plan
allowance** in separately labelled sections. The active connection gets a compact summary; the
existing Model settings page supplies account/source/last-update details. Display the windows
actually returned, with overflow details if necessary. One consistent used/remaining convention,
the same rounding for text/bar, reset time and stale label prevent ambiguous meters. Other exhausted
buckets may block a run, but must not overwrite a still-available bucket's reported percentage.
API-equivalent estimated cost stays separately labelled and is never a subscription bill.

Unknown but structurally valid buckets remain visible using the provider label and duration; an
i18n name table is not an admission filter. Compact mode prioritizes buckets applicable to the
selected model and reveals all others in detail; it must not silently hide an exhausted model
limit. No progress bar is invented for a balance without a meaningful total or for an absent window.
Use Craft's existing connection/detail primitives and tokens, not either reference's account-card
layout or palette. A refresh error remains visible alongside the last known reading.

Refresh from runtime events, on opening the relevant detail and on explicit refresh. Coalesce
requests per identity, bound timeout/retry, honor rate limiting and back off while hidden/offline.
Retain the last success as visibly stale on failure; an account/workspace change invalidates its
publication generation so late results cannot populate the new account. Reaching a displayed reset
time triggers a refresh, not an invented 0% reading. Remove connection-scoped cached metadata when
the connection is removed, without deleting historical Session usage.

Cockpit Tools supplies a useful bounded, per-account queue with manual priority; cc-switch supplies
shared backend-to-view cache publication and a bounded last-good policy; OpenChamber supplies
runtime-generation rejection and per-provider error preservation. These are mechanism comparisons,
not permission to import their account stores. Implement one scheduler and one canonical snapshot
projection over the existing connection owner. Publication must carry identity/revision and sample
time so a tray, connection detail and task summary cannot disagree or refresh each other's age.
Authorization/schema failures invalidate active readings immediately; transient failures retain the
sample with its real age and reason. Any expiration timer is owned by the shared projection, not
only by a child component's relative-time rerender. Respect Retry-After and bounded backoff.

For supported provider endpoints, prefer small typed adapters and exact parsed origin matching.
The reviewed cc-switch script facility has QuickJS execution bounds, but custom templates relax
HTTPS/origin checks and accept configurable HTTP methods. A generic credential-bearing JavaScript
executor is not needed for the first Fleet allowance path. A future custom provider uses the
existing Source/permission boundary with declared origin, credential scope and operation semantics;
querying a meter cannot gain configuration-write or account-switch effects.

Acceptance covers real zero/null/malformed values, one/many/per-model buckets, seconds versus ISO
timestamps, a failed refresh retaining its true age, account switch during fetch, expired auth,
429/offline and a reset boundary. Add unknown bucket labels, absent windows, same-provider account
switch, changed credentials during fetch, an expired sample with polling disabled, shared-view
publication and distinct key-budget/account-balance credentials. In particular, a reported 75%
short-window remainder plus an exhausted weekly window must retain 75% and show the weekly block
separately. Orca/CodexBar and the [Cockpit Tools / cc-switch source review](../../references/REFERENCE-REGISTRY.md#cockpit-tools-and-cc-switch-acquisition-to-display-review)
supply comparison cases; complete account/proxy/private-cache systems are not admitted.

## Execution contracts

These sections own the next step for the listed capability IDs. Read the
[common execution contract](../../14-MODULE-ARCHITECTURE.md#executable-next-step-contract)
and the release/spec anchor in [PACKET-INDEX](../PACKET-INDEX.md). Gates do not open merely
because this packet has instructions. Planned regression targets below do not exist yet unless
implementation has added them; extend a matching existing behavioral test instead of duplicating it.

### Execution EXEC-14

**System prompt, effective execution profile and agent identity configuration**

- **Next:** `IMPLEMENT` — TE1 then accepted profile slice; Assistant at R6/R15.
- **Sources:** [`packages/shared/src/agent/core/prompt-builder.ts`](../../../app/packages/shared/src/agent/core/prompt-builder.ts); [`packages/session-tools-core/src/tool-defs.ts`](../../../app/packages/session-tools-core/src/tool-defs.ts); [`packages/server-core/src/handlers/rpc/llm-connections.ts`](../../../app/packages/server-core/src/handlers/rpc/llm-connections.ts).
- **Deliver:** Normalize one effective prompt/tool projection before provider adaptation. Keep identity/loadout independent from labels; add Assistant persistence only with a real create/select/delegate consumer.
- **Data:** Projection is derived from existing connection, scope, grants, selected loadout and turn snapshot. Assistant owns persona/model/requested loadout; requested permissions never grant them.
- **Failure:** Profile changes apply at turn boundaries; hidden tool discovery must recover required tools without widening permission. Missing runtime/loadout reports unavailable, not silently reduced capability.
- **Proof:** EXEC-14-A — Sealed full-versus-scoped profile tasks with request inventory; include hidden-tool recovery, model switch, turn resume and denied capability. Same accepted outcome and selectable old profile are required. Planned regression/probe target relative to `app/`: `packages/shared/src/agent/core/__tests__/fleet-exec-14.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/agent/core/__tests__/fleet-exec-14.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft prompt-builder first; Pi thin harness, Cindy snapshots, AionUi independent Assistant. No copied label kit or new agent loop. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution INTEL-01

**Context/effective capability projection and compaction**

- **Next:** `IMPLEMENT` — TE1/R3 observation before behavior changes.
- **Sources:** [`packages/shared/src/agent/core/prompt-builder.ts`](../../../app/packages/shared/src/agent/core/prompt-builder.ts); [`packages/shared/src/agent/core/usage-tracker.ts`](../../../app/packages/shared/src/agent/core/usage-tracker.ts); [`packages/session-tools-core/src/tool-defs.ts`](../../../app/packages/session-tools-core/src/tool-defs.ts).
- **Deliver:** Expose included/excluded request components and existing compaction truth; add selection changes only through the accepted profile contract.
- **Data:** One effective projection enumerates source IDs/versions, token confidence and inclusion reason. Raw history remains in Session; a context view cannot become a history store.
- **Failure:** Missing token data is unknown. Truncation/compaction is visible and preserves source retrieval; context selection never lifts scope or memory secrecy rules.
- **Proof:** INTEL-01-A — Compare serialized provider request with inspector inventory; test missing usage, large output, compaction, hidden-tool recovery and restart without raw-history loss. Planned regression/probe target relative to `app/`: `packages/shared/src/agent/core/__tests__/fleet-intel-01.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/agent/core/__tests__/fleet-intel-01.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft context/UsageTracker; Pi and Agent Skills progressive disclosure. Context Mode is not admitted. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution INTEL-02

**Token optimization and cache strategy**

- **Next:** `PROVE` — TE1 baseline then R3 sealed trace.
- **Sources:** [`packages/shared/src/agent/core/usage-tracker.ts`](../../../app/packages/shared/src/agent/core/usage-tracker.ts); [`packages/shared/src/agent/backend/claude/event-adapter.ts`](../../../app/packages/shared/src/agent/backend/claude/event-adapter.ts); [`packages/shared/src/agent/backend/pi/event-adapter.ts`](../../../app/packages/shared/src/agent/backend/pi/event-adapter.ts); [`packages/shared/src/agent/core/pre-tool-use.ts`](../../../app/packages/shared/src/agent/core/pre-tool-use.ts).
- **Deliver:** Run TE1 normalization without changing requests; compare one named optimization against the unchanged profile on the same accepted-outcome fixture before promotion.
- **Data:** Provider usage retains input/output/cache-read/cache-write/reasoning and model/context-tier attribution with real/estimated/unknown confidence. External RTK absence is passthrough, not zero cost.
- **Failure:** Semantic/policy regression rejects the optimization. Restore the prior profile; original tool output stays retrievable. Do not cache effectful turns or silently drop capability.
- **Proof:** INTEL-02-A — Same model/effort/task/permissions and acceptance with optimizer off/on; measure cost per accepted outcome, latency/rework and cache semantics, including null/malformed counters. Planned regression/probe target relative to `app/`: `scripts/probes/intel-02.ts`. After adding the target, run from `app/`: `bun run scripts/probes/intel-02.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft usage adapters; Pi baseline, Repomix packaging, LLMLingua protected-span experiments are separate candidates; only a demonstrated improvement is retained. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution INTEL-03

**Model routing and capability negotiation**

- **Next:** `PROVE` — R17 with repeated accepted-outcome traces.
- **Sources:** [`packages/server-core/src/handlers/rpc/llm-connections.ts`](../../../app/packages/server-core/src/handlers/rpc/llm-connections.ts); [`packages/shared/src/agent/core/prompt-builder.ts`](../../../app/packages/shared/src/agent/core/prompt-builder.ts); [`packages/shared/src/agent/backend/pi/event-adapter.ts`](../../../app/packages/shared/src/agent/backend/pi/event-adapter.ts).
- **Deliver:** Discover exact model/runtime options before rendering controls; first reject unsupported effort/speed/tool parameters, then evaluate routing only for a demonstrated caller need.
- **Data:** Connection owns runtime/model capability snapshot and revision. Effort, speed/service tier and permission are separate fields; selected/applied values are attributable.
- **Failure:** Unknown option is unavailable, not silently max-to-lower saturation. Stale discovery is rechecked; failure retains explicit manual selection.
- **Proof:** INTEL-03-A — Models with graded, toggle-only and absent reasoning; account/runtime switch during discovery; unsupported parameter rejected before inference. Routing must beat manual baseline without quality loss or close NO_GAP. Planned regression/probe target relative to `app/`: `scripts/probes/intel-03.ts`. After adding the target, run from `app/`: `bun run scripts/probes/intel-03.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft installed Pi catalog; AionUi config options, ZCode runtime capability validation and cc-switch profile mapping; provider variants are not automatically reasoning. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution INTEL-04

**Cost and usage ledger**

- **Next:** `IMPLEMENT` — TE1/R3 Session accounting; R17 plan-allowance closure.
- **Sources:** [`packages/shared/src/agent/core/usage-tracker.ts`](../../../app/packages/shared/src/agent/core/usage-tracker.ts); [`packages/shared/src/agent/backend/claude/event-adapter.ts`](../../../app/packages/shared/src/agent/backend/claude/event-adapter.ts); [`packages/shared/src/agent/backend/pi/event-adapter.ts`](../../../app/packages/shared/src/agent/backend/pi/event-adapter.ts); [`packages/server-core/src/handlers/rpc/llm-connections.ts`](../../../app/packages/server-core/src/handlers/rpc/llm-connections.ts).
- **Deliver:** Normalize Session accounting once; add subscription allowance as a separate identity-bound adapter/projection only at its queued slice, following the provider table below.
- **Data:** Token/cost facts belong to existing Session usage; allowance snapshot belongs to the existing connection/runtime account and config revision. Windows carry native ID/unit, nullable values and successful sample time.
- **Failure:** Account switch rejects late publication; auth/schema failure invalidates readings, transient failure retains visibly stale sample. Unknown is not zero; no account switching/credit redemption/overage effect.
- **Proof:** INTEL-04-A — Zero/null/invalid values, cache tiers, multiple buckets, 75%-short plus exhausted-week, reset, polling-disabled expiry and same-provider account switch; fixture plus supported runtime read proves acquisition. Planned regression/probe target relative to `app/`: `packages/shared/src/agent/core/__tests__/fleet-intel-04.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/agent/core/__tests__/fleet-intel-04.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Installed Claude SDK and Codex runtime first; Cockpit scheduler, cc-switch adapters/cache, OpenChamber generation guard, Orca/CodexBar source labels. Exact files/limits are in the quota registry review. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution INTEL-05

**Layered agent-maintained memory**

- **Next:** `IMPLEMENT` — R9 after repeated completed R3 evidence.
- **Sources:** [`packages/shared/src/workspaces/storage.ts`](../../../app/packages/shared/src/workspaces/storage.ts); [`packages/shared/src/sessions/storage.ts`](../../../app/packages/shared/src/sessions/storage.ts); [`packages/shared/src/sources/storage.ts`](../../../app/packages/shared/src/sources/storage.ts).
- **Deliver:** Add the file-based memory layers below and one scoped consolidation writer; support pin/correct/delete and derived-index rebuild without importing foreign history as truth.
- **Data:** Entries carry ID, scope, source/version, sensitivity, lifecycle and revision. Workspace files own curated memory; Session history is immutable evidence; indexes are disposable.
- **Failure:** Secrets are excluded before persistence; unknown sensitivity is restrictive. Pinned/concurrently edited entries are not overwritten. Failed consolidation preserves original files and an explicit unresolved transaction.
- **Proof:** INTEL-05-A — Conflicting sources, secret canary, cross-Workspace query, pinned entry, concurrent curation, crash and delete/index rebuild; one writer and full source attribution must hold. Planned regression/probe target relative to `app/`: `packages/shared/src/workspaces/__tests__/fleet-intel-05.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/workspaces/__tests__/fleet-intel-05.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Hermes/OpenClaw consolidation evidence, agentmemory scope filters, Mem0 evaluation; no vector/database dependency before the D2 trigger. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution INTEL-06

**Prompt, skill and context loadouts**

- **Next:** `IMPLEMENT` — R15; R0 first fixes silent Skill metadata loss.
- **Sources:** [`packages/shared/src/skills/storage.ts`](../../../app/packages/shared/src/skills/storage.ts); [`packages/shared/src/sources/storage.ts`](../../../app/packages/shared/src/sources/storage.ts); [`packages/shared/src/agent/core/prompt-builder.ts`](../../../app/packages/shared/src/agent/core/prompt-builder.ts).
- **Deliver:** Separate installed catalog, selected loadout and active turn projection. R0 preserves/reports unsupported Skill metadata; later activation resolves triggers explicitly without hidden permission.
- **Data:** Skill origin/revision, supported metadata and validation diagnostics stay in existing Skill storage; active loadout is an immutable turn snapshot derived from composition/Assistant requests.
- **Failure:** Unknown semantic metadata cannot be silently dropped while showing fully loaded. Disabled/missing source reports a named exclusion; unloading does not erase package content or grants owned elsewhere.
- **Proof:** INTEL-06-A — Fixtures with triggers/zh_name/unknown metadata, required source missing, conflicting overrides and mid-turn change; verify diagnostics and next-turn-only activation. Planned regression/probe target relative to `app/`: `packages/shared/src/skills/__tests__/fleet-intel-06.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/skills/__tests__/fleet-intel-06.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Agent Skills format and Craft parseSkillFile; Cindy install/loadout/runtime split. Reference packs are compatibility fixtures, not automatic activation rules. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution INTEL-07

**Evaluation and regression evidence**

- **Next:** `IMPLEMENT` — R3 verifier baseline; R17 routing evidence.
- **Sources:** [`packages/server-core/src/tasks/TaskRunner.ts`](../../../app/packages/server-core/src/tasks/TaskRunner.ts); [`packages/shared/src/sessions/storage.ts`](../../../app/packages/shared/src/sessions/storage.ts); [`packages/shared/src/agent/core/usage-tracker.ts`](../../../app/packages/shared/src/agent/core/usage-tracker.ts).
- **Deliver:** Record acceptance independently of executor claims; replay sealed tasks with unchanged inputs and compare evidence-backed outcomes before admitting optimization/routing.
- **Data:** Evaluation records fixture/input version, model/harness revision, verifier, criteria, output references and usage confidence in existing task/test evidence; no success inferred from fluent text.
- **Failure:** Missing/contaminated evidence makes result inconclusive. Retry cannot replace a failed sample silently; no test/fixture edits to manufacture improvement.
- **Proof:** INTEL-07-A — One correct, incorrect and unverifiable output; verifier distinguishes them and retains all attempts. Sealed comparison is repeatable without live user data. Planned regression/probe target relative to `app/`: `packages/server-core/src/tasks/__tests__/fleet-intel-07.test.ts`. After adding the target, run from `app/`: `bun test packages/server-core/src/tasks/__tests__/fleet-intel-07.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft tests/data paths; SuperClaude failure heuristics and source research are evidence only, not a second evaluator service. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).
