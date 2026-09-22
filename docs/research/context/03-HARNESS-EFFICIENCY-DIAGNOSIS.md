# 03 — Agent Harness Efficiency Diagnosis

> **Status:** research evidence, not architectural or execution authority. Canonical ownership remains
> with [Decision E13](../../DECISIONS.md), the [roadmap](../../../TODO.md#release-ladder),
> token economy, and the applicable release spec. This record consolidates
> evidence from Databricks, Pi, Craft Agents, OpenHands, Hermes, and OpenClaw. Any change to a release
> contract or authority requires an owner checkpoint and an edit to its canonical document.

Current qualification: provider versions, prompt byte/tool counts and source mechanisms below
are measurements at the recorded review boundary. Current app pins Pi 0.85.1 on Craft v0.13.4;
remeasure before implementation. Current OpenHands is a different Agent Canvas tree, so old
Python-executor evidence cannot describe its current HEAD. A general Core controller and a second sandbox remain
excluded; R16 now has the bounded local-app Component contract in SYS-02; these observations authorize no new runtime or environment capability.

## 1. Verdict

Fleet should not become a larger Pi, a desktop OpenHands, Hermes, or OpenClaw, and it should not create
a third agent runtime. The correct fork direction is:

1. Keep Craft Agents as the product spine and sole authority chain for Session, permission, timeline,
   task, settings, source, and provider lanes.
2. Treat Pi as both an embedded lightweight runtime lineage and an efficiency baseline. The reviewed Fleet snapshot
   used `@earendil-works/pi-*` 0.80.6; its own wrapper makes the effective harness heavier than upstream
   Pi's minimal profile.
3. Build Fleet's differentiation as governed, cross-domain production chains. Domains retain their
   native operation models; only identity, authorization, result, evidence, ArtifactRef, and cost cross
   the narrow waist.
4. Use OpenHands only as evidence for an optional isolated executor. Do not import its runtime, event
   model, or condenser unless a measured remote or container requirement defeats the existing seam.
5. Learn capability probing, effective toolsets, `check_fn`, and Accessibility/SOM-first computer use
   from Hermes. Reject a wide default tool surface, a second memory authority, and double compaction.
6. Learn pre-call policy intersection, expiring grants, capability negotiation, and stale-frame checks
   from OpenClaw. Reject its Gateway, Session database, channel router, and tool registry as replacement
   authorities.
7. Observe first, subtract second, extract abstractions from real callers third, and expand environments
   last.

The design rule is simple: **a complex environment should make the deterministic system hide more from
the model, not make the model see more.** Project only the capabilities that the current task, identity,
authorization, and environment can actually use.

## 2. What the evidence establishes

### Databricks benchmark

Databricks measured materially different quality/cost behavior for the same model under different coding
harnesses. Its reported Opus comparison showed Pi at roughly `$0.74/task` and the native harness at
roughly `$1.94/task`, with similar quality and about one-third of the per-turn context. This supports:

- measure cost per accepted outcome, not nominal token price;
- fixed prompts, tool schemas, replay, and harness behavior can dominate task cost;
- optimize the measured `model × harness × task` combination.

It does **not** establish that Pi is universally superior, nor that a coding result transfers unchanged
to documents, design, browser work, media, or desktop control. Fleet needs its own cross-domain traces.

### Pi and Craft Agents

Fleet's Pi dependency and the pinned `badlogic/pi-mono` checkout are the same Earendil/Pi project lineage,
not unrelated products. The distinction is between the upstream minimal harness and Fleet's heavier
product wrapper: system prompt, subprocess, near-complete session proxy tools, web tools, Sources, and
Skills. A measurable Pi-light projection is therefore an optimization of the Craft fork, not a second
integration.

Craft already supplies Claude/Pi lanes, Session, permission, timeline, task, source, settings, compaction,
large-response handling, cache partitioning, and usage-accounting foundations. The capability decision is:

| Need | Classification | Direction |
|---|---|---|
| Session, permission, timeline, task, settings, source | `REUSE` | Extend the existing authority only |
| Provider lanes, usage, compaction, session tools | `EXTEND` | Add measurement and projection without a third harness |
| Governed cross-domain action, ArtifactRef, environment capability projection | `NEW` | Extract the smallest seam from real callers |
| OpenHands/Hermes/OpenClaw product kernels | `REJECT` | Consume only mechanisms that pass local comparison |

### OpenHands

OpenHands demonstrates replaceable sandbox runtimes, explicit recovery state, and long-running coding
execution. Importing the whole system would add a Python service layer, a second execution state machine,
a second event model, and another summarization policy. If host execution later proves insufficient, add
an OpenHands-inspired adapter behind Fleet's existing execution boundary; Fleet must continue to own
Session, permission, timeline, task, evidence, and artifacts.

### Hermes

Hermes uses toolsets, platform configuration, and `check_fn` to remove tools when binaries, credentials,
or services are unavailable. Its computer-use path combines screen observation with Accessibility/SOM
elements and background control. Tool Search can defer tool schemas and route a discovered call back
through the normal policy path.

Adopt the pattern `capability probe → effective toolset`, Accessibility/SOM before pixel coordinates,
and normal permission/evidence processing after discovery. Do not copy its broad core-tool default or
agent-plus-gateway compaction. Fleet recovery must retain the raw timeline, disclose omission, and allow
retrieval; it must not silently discard history after summarization failure.

### OpenClaw

OpenClaw separates device identity, declared capabilities, commands, permissions, routing, and execution.
Its computer actions add command policy, temporary arming, application controls, OS permissions, and
frame/display identity checks. The transferable rule is:

`effective capability = declared capability ∩ observed availability ∩ policy ∩ live grant`

Tool schemas should be filtered before the model call. Risky grants expire. A visual action carries the
observation/frame/display version and fails stale after relevant state changes. OpenClaw remains boundary
evidence, not Fleet's new control plane; its own prompt/tool surface is not inherently light, Tool Search
is experimental, and its host-access defaults differ from Fleet's requirements.

## 3. Current Fleet diagnosis

The local inventory measured a full prompt of **31,561 characters / 31,713 UTF-8 bytes** and **26 session
tool JSON definitions totaling 27,288 bytes**. These are byte inventories, not provider token counts, and
exclude some SDK built-ins, Sources, and Skills. Re-derive them from
`app/packages/shared/src/prompts/print-system-prompt.ts` and by serializing `SESSION_TOOL_DEFS` in
`app/packages/session-tools-core/src/tool-defs.ts`; TE1 replaces byte counts with provider-observed
token components.

| Severity | Finding | Consequence |
|---|---|---|
| `S0` | R0 does not yet have a trusted clean baseline | Performance changes cannot be attributed reliably |
| `S0` | The production usage ledger is not fully wired | Accepted-outcome cost and cache effectiveness remain unknown |
| `S1` | The fixed harness prefix is large | Small tasks may be dominated by fixed context and attention cost |
| `S1` | The Pi lane lacks a true lightweight profile | Using Pi runtime does not reproduce upstream Pi economics |
| `S1` | Tool visibility is driven mainly by registration | Irrelevant or unavailable schemas remain visible |
| `S1` | Governance risks becoming prompt prose | Policy explanation can become a permanent harness tax |
| `S1` | General computer actions lack a versioned observation contract | Stale screenshots, windows, displays, or grants can be acted on |
| `S2` | Backend behavior is concentrated in very large files | Prompt, tool, provider, and usage changes become tightly coupled |
| `S2` | CI does not yet prove the full product contract | A green subset can be mistaken for full harness verification |
| `S2` | Documentation can itself become context tax | Agents may load duplicated conclusions instead of routed facts |

The primary risk is not a wide product. It is exposing the definition, authorization, and explanation of
that wide product on every model call.

## 4. Three concern areas, not pre-frozen interfaces

### Execution Profile

A future profile may select only lane, prompt projection, tool projection, output profile, and budget. It
must not own Session, task, permission, or cost state. The first meaningful comparison is current-full
versus Pi-light, using the existing Claude and Pi adapters. Do not expose internal helpers merely to test
them; test the final prompt/tool projection and usage result.

### Governed Action

A future action boundary may carry actor, caller, capability, target, expected version, minimal input, and
typed success/failure/denied/stale results with evidence, artifact, and usage references. Permission,
policy, approval, execution, and timeline append remain behind the boundary. R4 must extract this from two
real human/agent mutation callers, not invent a universal action registry.

### Environment Adapter

A future environment boundary may expose identity, capabilities, permission state, observation version,
and expiry. Its execution order is:

1. native Fleet domain action;
2. structured adapter such as CDP, filesystem, CLI/API, or remote node;
3. computer-use fallback, preferring Accessibility/SOM and using pixels last.

High-risk execution requires capability, availability, policy, and a live grant. Environment adapters query
the existing permission authority; they do not own it. A general interface waits for a second real adapter,
although an external trust boundary may be isolated earlier.

## 5. Ordered remediation

This record does not create a parallel roadmap. The only implementation order is the canonical R0–R18
sequence:

1. **R0:** establish the trusted source, dependency, validation, and dirty-tree baseline.
2. **TE1 after baseline exit:** wire observation-only usage, cache, and input-component accounting without
   changing prompt or tool behavior.
3. **Owner-approved post-baseline slice:** inventory and reduce the fixed prompt, centralize tool
   projection, and compare current-full with Pi-light one variable at a time. Tool Search remains gated.
4. **R3:** preserve the first fixed cross-domain production trace as a benchmark.
5. **R4:** extract the governed action seam from dual callers.
6. **R5:** use ArtifactRef instead of copying large payloads through context.
7. **R6:** add bounded delegation only when the trace proves a coordination benefit.
8. **R14/R18:** verify only their named remote/layout requirements. R16 general control is
   CLOSED, and no second sandbox is authorized.

## 6. Adjudication of previous proposals

| Proposal | Decision |
|---|---|
| Wire TE1 usage and cache visibility | Adopt within the existing TE1 contract |
| Put prompt reduction or loadouts into R1/R2 | Reject scope smuggling; use a separately approved post-baseline slice |
| Couple dynamic loadout to `ActionEnvelope` | Separate; projection happens before a model call, action governance after intent |
| Use fixed 60k/100k compaction thresholds | Reject until Fleet context-pressure data exists |
| Use online `marginalReturnPerKToken` | Reject false precision; use offline accepted-outcome, rework, and halt comparisons |
| Use R3 as a benchmark | Adopt, preserving the pre-optimization trace and its Markdown-chain scope |
| Default to one agent and delegate only proven parallel work | Adopt; do not import unsupported numeric thresholds |
| Freeze TaskBrief or summary lengths now | Reject; derive budgets from R3/R5 evidence before R6 |
| Use the Hermes footprint order | Adopt as a review heuristic, not a new plugin/runtime authority |
| Copy reported Hermes tool/token numbers as Fleet targets | Reject; the fixed checkout does not support a transferable target |
| Treat OpenClaw's SDK as the R4 action contract | Analogy only; extract R4 from Fleet callers |
| Add `STATUS.md` or a second WO queue | Reject duplicate authority and progress documents |
| Set external absolute 2.6k/5k prompt or cost KPIs | Reject; establish Fleet-relative baselines first |
| Pass multimodal results through ArtifactRef | Adopt under R5; previews and authorized observations remain available |
| Enable default automatic model routing | Reject until E3 usage and benchmark evidence exists; remain default-off |

## 7. Measurement and acceptance

Every harness comparison should record:

- provider-observed prompt and tool tokens where available;
- input components: system prompt, tool schemas, history, Skills/Sources, media observations, and governance projection;
- cache-read/write behavior and stable-prefix changes;
- cost per accepted outcome;
- first-pass acceptance, rework, halt, and recovery;
- missing-tool discovery and recovery;
- raw-evidence recovery after any compaction or omission;
- zero permission bypasses and zero accepted stale-observation actions.

Cache is an optimization, not permission to keep a large prefix. Stable cached bytes must remain byte-stable;
dynamic task, permission, environment, and usage data belong outside that stable zone.

Before adding a layer, ask:

1. Which observed failure does it remove?
2. Can prompt text, an existing Craft hook, or an existing adapter solve it?
3. Does deletion scatter complexity across at least two real callers?
4. Does it create a second state, permission, task, timeline, or settings authority?
5. Does it improve accepted-outcome cost without lowering safety or acceptance?

Explicit rejects: a third harness, a second memory/compaction authority, a second execution queue, speculative
universal envelopes, benchmark-derived absolute budgets without Fleet traces, and broad tool catalogs sent by
default.

## 8. Code navigation

- Upstream Craft prompt assembly: `源码参考/software/craft-agents-oss/packages/shared/src/prompts/system.ts`
- Upstream Craft session tool definitions: `源码参考/software/craft-agents-oss/packages/session-tools-core/src/tool-defs.ts`
- Fleet prompt assembly and debug print: `app/packages/shared/src/prompts/system.ts`,
  `app/packages/shared/src/prompts/print-system-prompt.ts`
- Fleet Pi lane: `app/packages/shared/src/agent/pi-agent.ts`
- Fleet Claude lane: `app/packages/shared/src/agent/claude-agent.ts`
- Fleet session tool definitions: `app/packages/session-tools-core/src/tool-defs.ts`
- Fleet token accounting and cache economy: `app/packages/shared/src/agent/core/usage-tracker.ts`,
  `app/packages/shared/src/agent/core/cache-economy.ts` (confirm current callers with `rg`)
- Fixed reference heads are recorded in [`源码参考/meta/RETENTION.md`](../../../源码参考/meta/RETENTION.md).

## 9. Sources

- [Databricks: Benchmarking Coding Agents on a Multi-Million-Line Codebase](https://www.databricks.com/blog/benchmarking-coding-agents-databricks-multi-million-line-codebase)
- [Pi mono repository](https://github.com/badlogic/pi-mono)
- [Craft Agents OSS](https://github.com/lukilabs/craft-agents-oss)
- [OpenHands SDK paper](https://arxiv.org/abs/2511.03690)
- [OpenHands condenser documentation](https://docs.openhands.dev/sdk/guides/context-condenser)
- [Hermes Agent documentation](https://hermes-agent.nousresearch.com/)
- [OpenClaw documentation](https://docs.openclaw.ai/)
- [SWE-agent](https://arxiv.org/abs/2405.15793)
- [Agentless](https://arxiv.org/abs/2407.01489)
- [HarnessBench](https://arxiv.org/abs/2605.27922)
- [Don't Break the Cache](https://arxiv.org/abs/2601.06007)

Reviewed fixed checkouts: Craft `4289b1609732`, Pi `13437ca828894f43`, OpenHands `613406ca2bca`, Hermes
`2ea39daeb1f6`, and OpenClaw `9f5609382b54`. These hashes identify the evidence snapshot; they do not make
the upstream projects Fleet authorities.
