# 17 — Token Economy (intelligence per token)

> Design authority for how Fleet spends fewer tokens while keeping — and where possible raising —
> output quality. Suite packet: [`modules/suites/SYS-03-context-economy.md`](modules/suites/SYS-03-context-economy.md).
> Candidate tools: [`references/context/02-TOKEN-SAVING-CANDIDATE-INVENTORY.md`](references/context/02-TOKEN-SAVING-CANDIDATE-INVENTORY.md).
> Harness research and remediation evidence:
> [`references/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md`](references/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md).
> Binding decision: E12. Multi-agent context sharing:
> [`references/context/01-MULTI-AGENT-CONTEXT-RESEARCH.md`](references/context/01-MULTI-AGENT-CONTEXT-RESEARCH.md).

## 0. The product bet (owner-set)

Model vendors and CLI makers have no incentive to reduce your token spend; a local-first workbench
does. Fleet treats token economy as a **first-class product capability**: not "use less AI", but
**more intelligence per token**. The governing rule, owner-stated: never save for saving's sake —
an optimization that degrades output quality or model capability is a regression even when it
saves money.

## 1. Why saving tokens can _raise_ capability (the scientific case)

This is not a hope; it is measured:

- **Context rot.** Across 18 frontier models, accuracy drops non-uniformly — often 30–50% — as
  input grows, well before the context-window limit; mid-context information is systematically
  under-attended (the U-shaped "lost in the middle" effect, replicated across model families).
  A leaner, well-placed context is literally a smarter model.
- **Long-horizon agent research** converges on the same conclusion: explicit context management
  ("Context-as-Tool", arXiv:2512.22087), budget-aware context ("ContextBudget"), and "Less Context,
  Better Agents" (arXiv:2606.10209) all report equal-or-better task success with far smaller
  active contexts.
- **Prompt caching** cuts input cost 41–80% and improves latency 13–31% when the prefix is
  byte-stable — pure savings with zero quality impact, but only if the runtime is engineered for
  cache alignment ("Don't Break the Cache", arXiv:2601.06007).

Therefore Fleet's token economy is **attention engineering first, compression second**: keep the
model's active window small, stable, and relevant; keep everything else recoverable by reference.

Databricks adds a stricter harness lesson: with the same model and effort, agent harnesses can spend
more than twice as much for similar quality, while Pi used roughly one-third the context per turn in
that benchmark. This does **not** prove that Pi always wins or native harnesses always lose. It proves
that Fleet must benchmark `model × harness/profile × task` and inspect the request actually sent.
Fleet already embeds the same Pi project lineage through `@earendil-works/pi-*`, but wraps it with
Craft/Fleet prompt, session tools and Sources; runtime reuse is not a minimal-profile guarantee.

## 2. What Fleet already has (grounded in code and design)

| Asset                                                                                                                                                                        | Where                                                                     | Status                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RTK transparent Bash rewriting (route-A input compression; LLM sees `git status`, runtime executes `rtk git status`, compressed output returns; passthrough when rtk absent) | `packages/shared/src/agent/core/rtk-rewrite.ts`, `rtk-detector.ts`        | `usable` (inherited Craft)                                                                                                                                                                                                                                                                                                                                                                                                       |
| Usage accounting seam                                                                                                                                                        | `core/usage-tracker.ts` + usage events                                    | `usable` core; composer context ring and provider-ledger popover (`current/context limit`, current-request uncached input and cache read/write, session output, cost) are `usable`. Pi and Claude live usage events replace current-request cache accounting and recompute the live total instead of retaining the previous request. The popup has one context-occupancy bar; cache counters remain accounting rows for that same request, not a second occupancy projection. The OpenCode-style visible-message composition is explicitly `estimated` and `usable`; its percentages are shares of current provider input, with message counts integrated into the corresponding row. Exact system/tool/rule/Skill/MCP/subagent attribution remains `not implemented` and must not be inferred in the renderer |
| Session compaction / large-response paths                                                                                                                                    | existing Craft compaction                                                 | `usable` baseline; typed extensions CONDITIONAL                                                                                                                                                                                                                                                                                                                                                                                  |
| Bounded delegation envelopes (structural saving)                                                                                                                             | TaskBrief/RunReport design (C3), ContextPack/ContextSegment design assets | design decided; mechanized R6                                                                                                                                                                                                                                                                                                                                                                                                    |
| Provider prompt caching                                                                                                                                                      | Claude/Pi SDK lanes                                                       | present; **cache alignment not yet engineered or measured**                                                                                                                                                                                                                                                                                                                                                                      |
| Provider-neutral Pi framework prompt                                                                                                                                         | `prompts/system.ts` + `agent/pi-agent.ts`                                 | `wired but not visually checked`; tool/session/source/project authorities stay separate and load detail on demand                                                                                                                                                                                                                                                                                                                |

Current source inventory is a risk signal, not a token benchmark: the full system prompt is about
31.7 KB UTF-8, the Pi framework and mini prompts about 0.8 KB each, and serialization of the 26 registered session-tool
definitions about 27.3 KB in the 2026-07-20 working tree. Provider tokenization, per-request gates,
history, Skills/Sources and media still change the actual request. TE1 and the post-R0 baseline must
measure those requests before Fleet sets a savings KPI or changes a default.

Runtime compatibility does not imply equal observability. All lanes write through the same
`UsageTracker`, but keep their facts separate:

| Lane         | Authoritative when available                                       | Must not fabricate                                                  |
| ------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| API/SDK      | provider usage counters, cache read/write and billed cost          | missing counters or future-call cost                                |
| External CLI | adapter-observed lifecycle plus provider-emitted usage/logs        | hidden internal tool calls, exact tokens or guaranteed cancellation |
| Subscription | quota window, reset time and provider-reported remaining allowance | API-equivalent money as billed cost, or quota as token usage        |

Every measurement carries `source + confidence (exact/estimated/unknown) + attribution scope`.
Token usage, estimated/API-equivalent money and subscription quota are projections of one ledger,
not interchangeable units or separate authorities. The CLI/provider remains credential-refresh
authority; Fleet reads capabilities and quota without taking ownership of vendor credentials.

### 2a. Context-pressure and optimizer projections

The usage inspector must keep two orthogonal questions separate:

1. **What occupies the model window now?** The context ring and primary stacked bar use the
   provider-normalized **effective request sent to the model** divided by the model context limit.
   Its component rows (system prompt, tool definitions, rules, Skills, MCP/dynamic tools,
   subagent definitions, conversation, and an honest unattributed remainder) sum to that effective
   request. A component percentage is always relative to the full context window, never merely to
   the used portion.
2. **What did Fleet avoid sending?** The optimization projection compares the pre-optimization
   candidate context with the effective request. It reports total saved tokens and optional
   per-optimizer increments for RTK, compaction, on-demand tool loading, deduplication, and future
   optimizers. Optimizers are transformations, not context components, so they never appear as
   another color inside the current-context composition.

Every optimizer observation uses one ordered ledger event:
`optimizerId + scope + beforeTokens + afterTokens + source + confidence + evidenceRef`. When
optimizers are chained, each event measures only its incremental input-to-output reduction; Fleet
must not let several optimizers claim the same original tokens. If a provider or external CLI
exposes only a final total, Fleet shows the aggregate delta as unattributed/estimated instead of
fabricating section-level savings. Raw evidence remains recoverable under §5.

The current RTK integration exposes trustworthy aggregate command savings, but not an ordered
per-session transform ledger. Therefore the Models settings page may show RTK's aggregate saved
tokens and command count, while the Session context inspector shows only the effective
provider-normalized request. Per-session RTK/optimizer rows remain `not implemented` until prompt
assembly emits the ordered observations above; the renderer must never subtract aggregate savings
from one Session or draw them as context-window occupancy.

## 3. The layered pipeline (design)

Each layer states its quality effect. Lower layers are always-on candidates; higher layers are
opt-in or gated. Every layer obeys §5 guardrails.

| Layer                                    | Mechanism                                                                                                                                                                                                                                                                                                           | Quality effect                                                                          | Fleet seam                                                       | State                                                                                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **L0 Structural**                        | Centralized effective prompt/tool projection so each call sees only task-needed, installed, available and authorized capability (E13); later bounded TaskBriefs/RunReports instead of transcript dumps and artifact-by-reference instead of bytes (D4)                                                              | **Positive when task-complete** (less interference, fresh attention)                    | post-TE1 profile slice; ArtifactRef (R5); C3/R6 envelopes        | projection changes calls and needs its own post-baseline slice; artifact/delegation land R5/R6                                                                                                                    |
| **L1 Cache alignment**                   | Three-zone prompt layout: byte-stable prefix (system + tool defs, immutable per session config), append-only log, volatile scratch tail; cache-hit rate in the ledger; never reorder/rewrite the stable zone mid-session                                                                                            | **Neutral** (pure cost/latency win)                                                     | backend seams + prompt assembly; UsageTracker fields             | **accounting core implemented** (`app/packages/shared/src/agent/core/cache-economy.ts`, 15 tests + strict tsc green, 2026-07-18); adapter wiring = [`specs/TE1-cache-alignment.md`](specs/TE1-cache-alignment.md) |
| **L2 Deterministic input compression**   | Extend rtk-style rewriting to more tool outputs (ANSI strip, log dedup, test-success folding, diff-noise removal); stale-tool-output pruning: replace superseded large outputs with a one-line summary + evidence pointer (timeline keeps the original)                                                             | **Neutral to positive** (removes distractors; lossless via pointers)                    | tool-result path in `SessionToolContext`; SessionEvents keep raw | extend after L1; measured                                                                                                                                                                                         |
| **L3 Agent-directed context management** | Compaction as an explicit **session tool** (CAT pattern): the agent may summarize milestones into a structured workspace — stable task semantics (TaskContract) · condensed long-term (ContextPack) · high-fidelity recent turns — at its own decision points; summaries always carry pointers back to raw evidence | **Positive when measured** (proactive rot prevention)                                   | `SESSION_TOOL_DEFS` + compaction path; no second store           | CONDITIONAL → activate on measured pressure (existing map row)                                                                                                                                                    |
| **L4 Model-assisted compression**        | LLMLingua-2-style local token-importance trimming — **only** for bulk reference material (long docs, logs) before injection; never for instructions, contracts, code to be edited, or owner text                                                                                                                    | **Bounded risk** — requires per-trace quality check                                     | ingestion/Sources path, local model                              | gated: measured A/B on declared traces                                                                                                                                                                            |
| **L5 Output economy**                    | Per-task output profiles: `terse` for machine-consumed steps (structured, no prose padding), `normal` for human-facing text; reuse-first guidance                                                                                                                                                                   | Terse: neutral only when the consumer contract proves it; reuse-first: **positive**     | prompts/Skills + loadout profile                                 | any prompt change belongs to the post-baseline profile slice; terse stays opt-in                                                                                                                                  |
| **L6 Cross-session injection**           | Layered agent-maintained memory (D5/R9) retrieved as scoped segments into new sessions instead of re-explaining history; curated layers injected under per-file budgets                                                                                                                                             | **Positive when distilled and scoped**; dangerous when transcript-dumped or cross-scope | memory layers (R9) + ContextPack slices                          | gated on R9                                                                                                                                                                                                       |

### 3a. Layer interaction rules (how the layers combine — the hard part)

The layers are not independent; combined naively they fight each other. These rules are binding:

| Interaction                  | Conflict                                                                                                                                         | Rule                                                                                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L3 compaction × L1 cache     | In-place history rewriting **destroys the provider prefix cache** (`diagnoseCacheBreak` zone=`log`) — one compaction can cost more than it saves | Compact only at declared milestones, when projected context-rot cost or window pressure exceeds the re-cache investment (prefix length × write multiplier). The ledger books the post-compaction cache-miss turn as an _investment_, never hides it |
| L2 pruning × L1 cache        | Pruning old tool outputs also mutates the log zone                                                                                               | Two-phase: compress tool outputs **at creation time** (rtk path — append-only, never breaks cache); batch retro-pruning **into the same milestone as compaction**, never mid-span                                                                   |
| L2/L4 compression × quality  | Compressing the wrong thing changes semantics                                                                                                    | Only tool outputs and bulk reference material; instructions, contracts, code-under-edit, owner text are exempt (guardrail 3)                                                                                                                        |
| L0 fresh child contexts × L1 | Every child re-pays a cold prefix                                                                                                                | Per-lane **prefix templates**: children of one lane share an identical stable zone (template identity = `fingerprintZone` equality) so they ride the same warm cache                                                                                |
| L5 output profiles × L1      | Profile text lives in the stable zone; switching mid-session = stable-zone break                                                                 | Set the profile at session/lane start; mid-session change is an explicit new cache span                                                                                                                                                             |
| L6 injection × L1            | Injecting memory into the prefix breaks it every time retrieval changes                                                                          | Injected segments enter the brief/scratch tail, never the stable zone                                                                                                                                                                               |
| Model/lane switching × L1    | Cache never transfers across providers or models                                                                                                 | Any future default-off router (E3) must weigh warm-cache value before mid-session switches; a switch is recorded as a cache-reset event                                                                                                             |
| DeepSeek specifics × L1      | Implicit 64-token-unit matching: a single early byte change re-misses everything after it                                                        | The three-zone rule matters _most_ on implicit-cache providers — there are no breakpoints to save you; `alignedPrefixTokens` reports the actually-hittable span                                                                                     |
| Anthropic specifics × L1     | Writes cost 1.25–2×: caching a once-only prefix **loses money**                                                                                  | Place breakpoints only on spans expected to recur ≥2–3 turns; the write-only-turn test in `cache-economy.test.ts` encodes this                                                                                                                      |

What is **rejected for the core** (mechanisms may still inform design):

- External HTTP relay/proxy products rewriting requests in flight (headroom-as-product): conflicts
  with local-first identity (P8), adds a silent middle layer between Fleet and providers.
- Universal semantic answer caches (GPTCache-as-product): silently returning near-miss cached
  answers changes semantics — the exact failure §5 forbids. Only ever thinkable per-connector,
  opt-in, for deterministic idempotent lookups.
- Wholesale transcript capture as memory (claude-mem-as-product): verbatim-history hoarding without
  partition/sensitivity floors conflicts with D5's distillation rule; also AGPL-3.0 (license gate).
  Fleet's layered agent-maintained memory is the governed replacement.
- Blanket output-crippling as default (caveman-style −65% output grammar): human-facing quality is
  product value; only opt-in terse profiles for machine steps.

## 4. Fuse, connect, or reject (the integration policy)

Answering whether to fuse a mechanism or keep it adapter-compatible — three tiers, decided per mechanism, never
per marketing:

1. **Core-fused (Fleet-owned, because only the platform can do them):** L0 effective projection and later structural handoff, L1 cache
   alignment, L2 tool-output rewriting/pruning, L3 compaction tool, L5 reuse-first guidance, the
   ROI ledger. A plugin cannot guarantee byte-stable prefixes, bounded delegation, or honest
   ledger accounting — these live at Fleet's seams. External projects contribute **mechanisms**
   here under F3 (TS/JS license-cleared rework or clean-room pattern), never as runtime
   dependencies.
2. **Optional connectors (compatibility, default-off or on-demand):** repomix (repo packing),
   context7 (on-demand versioned docs), codegraph (symbol-graph retrieval) via existing
   Sources/MCP; the `rtk` binary itself stays an optional local tool with passthrough degradation
   (the pattern already shipped). Connector absence never breaks core.
3. **Rejected as products** (list above) with reasons and license gates recorded in the candidate
   inventory.

## 5. Guardrails (bind every layer)

1. **Measured or it doesn't ship.** Every optimizer runs the SYS-03 first-proof protocol: replay a
   fixed trace with it off/on; record tokens, latency, cache hits, and quality proxies
   (acceptance/rework/halt counts). It must win on ROI, not just token count.
2. **Switchable.** Per-workspace/per-session off-switch; `unknown` cost stays `unknown`, never 0.
3. **Never silent semantic change.** No optimizer may alter instructions, contracts, code under
   edit, or owner text; compression targets tool outputs, logs, and bulk reference only.
4. **Raw evidence stays recoverable.** Pruned/summarized content keeps a pointer to the untouched
   timeline/file original (04 §3); irreversible pruning is a stop condition.
5. **One ledger, one authority.** All measurements extend UsageTracker/E3; no second cost store,
   no second memory (03 §1); SYS-03 stop conditions apply verbatim.
6. **Token ROI is the metric:** cost per _accepted_ outcome (ties to R3 acceptance and C10
   monotonic progress), not tokens per request.

## 6. Landing order (inside existing releases — no new release needed)

1. **R0 + TE1 observation only:** land/audit the existing accounting group; complete provider
   normalization, prefix-break observation and the existing usage surface without changing prompt
   or tool content. A provisional label/status trace proves the measurement path.
2. **After R0 + TE1 baseline, owner-accepted bounded profile slice:** inventory prompt sections and
   tool schemas; remove duplicate prose; introduce one centralized effective projection shared by
   Claude/Pi/session-MCP paths; compare current-full profiles with Pi-light on sealed maintenance
   and coding tasks. Start with static task profiles. Tool Search is a second-stage gate only if
   catalog/recovery measurements justify it. Keep the previous profile as rollback.
3. **With R3:** run the real research→evidence→Markdown→review→accepted output→delivery chain as the
   fixed cross-domain trace. Do not tune the optimizer during the trace and do not add image/web
   generation to make the benchmark look broader.
4. **With R5/R6:** ArtifactRef and TaskBrief/RunReport complete L0 structural handoff; L2 retro-
   pruning may land only after raw evidence pointers exist.
5. **On measured pressure:** L3 compaction tool fires only when the same trace shows sustained
   context pressure and expected benefit exceeds cache rebuild cost.
6. **Gated:** L4 per-trace A/B; L6 only with R9; automatic model routing remains default-off until a
   model×profile evidence table and separate owner decision exist.

No fixed external target such as “≤5k prompt tokens”, “≥60% cache hits” or “−40% cost” is binding
before the Fleet baseline. Each profile slice declares its statistical tolerance in advance and is
accepted on quality, recovery, safety and cost per accepted outcome together.

## 7. References consumed

Research: Databricks coding-agent harness benchmark; Pi upstream; OpenHands SDK/condenser;
Hermes toolsets/Tool Search/computer use; OpenClaw effective tool policy/device actions; Anthropic effective-context-engineering guidance; Chroma context-rot findings +
lost-in-the-middle (U-shaped position effect); Context-as-Tool (arXiv:2512.22087); Less Context,
Better Agents (arXiv:2606.10209); ContextBudget (arXiv:2604.01664); Don't Break the Cache
(arXiv:2601.06007); LLMLingua-2 (Microsoft, ACL'24). Mechanism evidence: DeepSeek-Reasonix
three-zone prefix stability; opencode stale-output trimming + provider-usage normalization
(admission pending); rtk (shipped in Craft); owner-curated inventory with corrections at
[`references/context/02-TOKEN-SAVING-CANDIDATE-INVENTORY.md`](references/context/02-TOKEN-SAVING-CANDIDATE-INVENTORY.md).
Admission remains governed by [`references/REFERENCE-REGISTRY.md`](references/REFERENCE-REGISTRY.md);
nothing here imports code.
