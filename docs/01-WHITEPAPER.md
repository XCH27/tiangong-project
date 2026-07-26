# 01 — Whitepaper: what Fleet ultimately is

> The definitive statement of the product: the bet, the finished shape, the boundaries, and the
> honest line. Sequencing: [`05-ROADMAP.md`](05-ROADMAP.md). Architecture:
> [`04-ARCHITECTURE.md`](04-ARCHITECTURE.md). Orchestration core:
> [`13-ORCHESTRATION.md`](13-ORCHESTRATION.md).

## 1. The bet

**Traditional products lodge an agent inside a tool; Fleet turns the whole work chain into an
environment agents can understand, execute, compose, and learn from.** A code agent understands
only the code stage, a design agent only design files, an office agent only documents — the moment
work crosses a software boundary, context, artifact relationships, human feedback, and execution
history all break. Fleet fixes the *environment*, not any single tool: Fleet owns the project,
sessions, permissions, execution record, artifact relationships, and context, so one human and many
agents run continuously from intent to delivery. External software still gets used — demoted to
replaceable capability providers behind adapters; it no longer owns Fleet's project context or
collaboration authority.

The division of labor (Decision P1): the human owns the top ~10% (intent, taste, final judgment)
and the bottom ~10% (common-sense guardrails); agents execute the middle ~80%. Every consequential
agent action is **inspectable, permissioned, and honest about recovery**, attached to real project
artifacts. A real inverse, snapshot, or version restore is provided where the capability supports
it; otherwise the product reports `recovery: none` instead of implying an undo.

## 2. The finished product (end-state walkthrough)

This is what Fleet looks like when the architecture is fully real. Every numbered beat maps to a
capability that exists today, is in the integration queue, or is gated — the walkthrough is the
target, not a status claim (§8).

> You need a complete launch package for a new product: website, promotional video and release
> document.
>
> 1. **One Project, one chain.** Open a Fleet Project—one folder boundary (P6)—and state the intent.
>    The same Project holds every Session, file, evidence record and deliverable.
> 2. **Research leaves evidence.** An agent researches competitors and source material in the
>    built-in browser. Captures and citations become provenance-bearing evidence visible on the
>    timeline.
> 3. **The canvas shows the whole system.** Research and writing agents, assets and drafts occupy one
>    spatial view. Running state, cost and blocked approvals are visible at a glance.
> 4. **Orchestration is explicit.** Stage two competitor captures and a brand palette on a design
>    agent card. Nothing runs until delegation is confirmed; Fleet pre-fills a TaskBrief with the
>    objective, references, boundaries and budget.
> 5. **Generation uses Jobs.** Image generation and video rendering appear as placeholder → Job →
>    result. Resource saturation queues or degrades visibly instead of disappearing (E8).
> 6. **One exact version feeds many outputs.** Hero visual v3 can be referenced by the website, video
>    first frame and release-document cover without copying bytes three times (D4).
> 7. **Native modules share one spine.** Web, video and document surfaces own their native models,
>    while actions, permissions, evidence and cost use the same Craft-derived authorities (E4/S1).
>    Agents invoke the same module capabilities as humans (OV-005).
> 8. **Risk stops at a checkpoint.** Publication, new spend and deletion require plain-language
>    owner choice. Reversible scoped work continues autonomously.
> 9. **Acceptance is traceable.** Acceptance records the exact version, evidence links and Session
>    provenance; deliverables remain traceable to intent and each relevant change.
> 10. **A completed chain can become a workflow.** Explicit promotion derives a versioned editable
>     DAG from actions that actually ran; it does not rewrite history.
> 11. **Experience accumulates by itself, inside visible layers.** Agents keep working notes and
>     autonomously distill durable facts and preferences into curated memory files with source
>     pointers; a logged background pass consolidates and archives. You can inspect, pin, correct
>     or delete any entry at any time — curation is optional, secrecy/scope floors are not (D5).

## 3. What Fleet is not

Not a chat client, an IDE clone, a terminal skin, a Figma clone, or a pile of disconnected AI
utilities. Not a cloud service — no Fleet account, login, or subscription (P4); no dependence on
Craft-operated servers (P8); "cloud" means your own machine elsewhere (P9). Not a universal
editor — there is no single patch format that pretends to edit DOM, code, design, video, and decks
at once (E4). Not an autonomous employee — it is a governed workbench where autonomy is earned per
action class through permissions, budgets, and evidence.

## 4. Core design constraints (the shape of every solution)

1. **Agent-native means one system, not twins.** When a consequential mutable capability serves
   both human and Agent callers, they converge on one invocation model, policy evaluation,
   executor, state authority, and evidence schema (S1). Different entry adapters, one truth.
2. **Native authorities per surface, one shared spine underneath.** Session + permission +
   identity + caller-aware actions + timeline + files/artifacts + cost are shared; each creative
   surface owns only the document/job model its medium genuinely needs
   ([`04-ARCHITECTURE.md`](04-ARCHITECTURE.md) §1).
3. **Deterministic kernel, reasoning members.** Code owns scheduling, budgets, permissions,
   validation; agents own judgment inside locked contracts ([`13-ORCHESTRATION.md`](13-ORCHESTRATION.md)).
4. **Projections never own state.** Canvas cards, Board columns, digests are views; commands route
   through governed actions (E5).
5. **Craft-first, selective upstream intake.** Fleet uses Craft v0.10.5 as its product/interaction
   baseline and admits later fixes or backend mechanisms only through the current app authorities —
   never a second app (P2), never a second authority (03 §1).
6. **One user-visible boundary: Project = Workspace** (P6).

### 4.1 Design causality: every mechanism must name the problem it solves

Fleet does not preserve a mechanism merely because an earlier Agent documented it. The durable
object is the **problem + invariant + evidence**; a mechanism is the current best response and may
be replaced when a simpler or better-evidenced response preserves the same boundaries. Every major
architecture proposal and review therefore answers five questions: **what observable failure are
we preventing; why should this mechanism interrupt that failure; which authority enforces it; how
will we know it worked; what is its honest implementation status?** A proposal that names features
without this causal chain is incomplete.

| Observable product/development problem | Fleet response | Why this response addresses it | Detailed authority | Current status |
|---|---|---|---|---|
| Work crosses code, design, browser, media, and document tools; intent, evidence, permissions, and artifact lineage fracture at every boundary | One Project boundary and one shared session/action/evidence/artifact spine; external software stays behind adapters | Keeping coordination state in Fleet lets capability providers change without losing project truth or creating a new authority per tool | P2/P6, S1, D1/D4; [`04-ARCHITECTURE.md`](04-ARCHITECTURE.md) §1 | `not implemented` as a complete end-to-end chain |
| A Coding Agent hits difficulty, follows locally interesting failures, forgets the main objective, or repeatedly edits/tests without moving acceptance forward | A versioned `TaskContract`, stable criterion IDs, allowed/reserved paths, per-attempt intent/evidence, and a two-non-progress circuit breaker in the existing Task/Session execution path | The objective stops being optional prompt context: state-changing actions must map to an unmet criterion, and repeated activity without criterion progress loses authority to continue | C7/C10; [`04-ARCHITECTURE.md`](04-ARCHITECTURE.md) §4; [`13-ORCHESTRATION.md`](13-ORCHESTRATION.md) §2 | `not implemented` — procedural rules exist, runtime gates are planned for R6 |
| The executor optimizes a visible proxy — tests, screenshots, reports, or evaluator output — instead of the user's outcome, and may weaken the harness it later uses to certify itself | Lock acceptance and normally reserve tests/fixtures/harness paths; separate execution from a deterministic or isolated read-only verifier | The actor that benefits from a passing proxy cannot silently rewrite the proxy or issue its own acceptance verdict | C7/C9; [`04-ARCHITECTURE.md`](04-ARCHITECTURE.md) §4; [`09-QUALITY.md`](09-QUALITY.md) | `not implemented` as a general enforced gate |
| Long conversations and context compaction bury the Goal, repeat completed research, or pass raw transcripts between Agents | Project a bounded current contract into `TaskBrief`; return criterion outcomes and evidence/artifact references in `RunReport`; recover from authoritative Session events rather than transcript memory | Stable, small projections keep the active objective salient while source evidence remains recoverable without flooding every model turn | C3/C6/C11; [`13-ORCHESTRATION.md`](13-ORCHESTRATION.md) §2; [`17-TOKEN-ECONOMY.md`](17-TOKEN-ECONOMY.md) | `not implemented` as the full delegation contract |
| Multiple Agents duplicate work, overwrite shared paths, recursively review each other, or let a cancelled/replaced run report into the current task | One criterion owner, one writer per occupied path, bounded delegation, shared team budgets, and an attempt/dispatch identity on every command, heartbeat and result; cancellation or contract revision fences out the old attempt | Deterministic ownership, input serialization and stale-result rejection remain kernel state; Agents contribute bounded judgment instead of inventing a second coordination system through conversation | C3/C5/C6/C11; [`07-PLAYBOOK.md`](07-PLAYBOOK.md); [`13-ORCHESTRATION.md`](13-ORCHESTRATION.md) §2 | `not implemented` as a complete multi-Agent control loop |
| API models expose exact token/cost events, subscription lanes may expose only quotas, and external CLIs may hide internal tool calls; treating them as identical makes budgets and cancellation dishonest | One runtime-adapter contract normalizes declared capability, lifecycle, usage confidence, failure, approval, cancellation, and stop semantics; model-independent limits cover elapsed time, state changes, tool calls, and retries | The execution contract remains provider-neutral while each lane reports what it actually knows; opaque pricing never becomes permission for an unbounded run | C2/C11, E3/E12; [`13-ORCHESTRATION.md`](13-ORCHESTRATION.md) §2; [`17-TOKEN-ECONOMY.md`](17-TOKEN-ECONOMY.md) | `not implemented` across all CLI/API/subscription lanes |
| Frontend Agents infer responsive behavior or visual language from a screenshot, then gradually replace Craft's structure with local guesses | Clean Craft v0.10.5 interaction baseline, explicit visual anchor + intentional delta, canonical components/tokens, page-state matrix, and rendered comparison before visual acceptance | The Agent must explain every deviation from a stable source and verify the rendered result across named states instead of treating one screenshot or passing test as design truth | G6; [`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md); [`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md) | `not implemented` as a fully enforced visual gate |

The anti-drift response deliberately combines **phase control** and **loop detection**. A targeted
fix normally follows reproduce → localize → one coherent change → targeted verification; a declared
systematic audit may first build a bounded coverage matrix and then repair by problem family. Fleet
must not turn “audit everything before testing” into a universal rule, because that response can
itself create scope drift. Repeated tool inputs, repeated failure fingerprints, patch oscillation,
and unchanged criterion evidence are halt signals; changing tools, models, or hypotheses alone is
not progress.

These names do **not** introduce another execution subsystem. They are extensions and projections
of the pinned Craft path already present in Fleet:

- `TaskContract` is the locked run-time projection of the existing Task spec/run snapshot plus
  Session metadata — not a contract store or a second Goal database.
- criterion, attempt, evidence, budget-halt, and contract-version facts extend the existing append-only
  Task run log and `SessionEvent` stream — not an `attempts.json`, progress journal, or telemetry truth.
- scope/reserved-path enforcement extends the shared `PreToolUse` pipeline already used by Claude
  and Pi-backed API/subscription models; it does not create another permission engine.
- scheduling, retry, pause/resume, restart hydration, cancellation, and the no-progress breaker stay
  in the existing `TaskRunner`; R6/R14 CLI or remote adapters report into this lifecycle rather than owning it.
- Board, chat, canvas, and task previews only project the same Task/Session/run state. None may infer
  percentage progress or persist a separate orchestration status.

This is a **Craft EXTEND** design, not NEW. The current Craft Task schema, run log, `TaskRunner`, and
`PreToolUse` implementation remain the starting authority; [`08-CRAFT-CAPABILITY-MAP.md`](08-CRAFT-CAPABILITY-MAP.md)
records the gap and [`05-ROADMAP.md`](05-ROADMAP.md) R6 owns its mechanization. Recovered
`TeamRun`, AutoResearch journals, external workflow stores, and reference-project loop controllers
may provide comparison evidence, but they cannot become parallel Fleet authorities.

When reviewing or replacing any row above, an Agent must preserve the named problem and invariants,
inspect the linked code/status reality, compare at least one plausible alternative, and update this
table only if the product-level causal claim or honest status changed. Implementation detail and
run evidence stay in code, tests, Session events, capability rows, and the owning spec — not in new
whitepaper appendices or dated reports.

## 5. UI philosophy (owner-set, binding)

The owner requires UI work to avoid unnecessary entities and settings, and to simplify or improve
the original Craft Agents interface instead of inventing surfaces from scratch. Exact source quotes
are preserved once in [`design-library/OWNER-VOICE.md`](design-library/OWNER-VOICE.md) as OV-002
and OV-003.

Operationally: the visual and interaction baseline is clean Craft v0.10.5; default UI work restores,
simplifies or optimizes an existing surface, while v0.11 UI remains comparison evidence only. A new
surface must justify itself (P5) and lives inside the shell. The primary create action is **New
Task**, global and per Project, but Sessions remain the R1 work-list authority (P10); the user meets
exactly one boundary concept — Project = folder (P6). **Easy to
start, high ceiling:** progressive disclosure gives newcomers an obvious short path and power users
reachable depth; dangerous actions are confirmed in plain language; errors say what happened and
what to do. "Minimal" never means "shallow." **Identity honesty:** every external connection states
its class — local · self-hosted · user-configured third-party · unavailable (P8). Component rules:
[`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md); full page inventory:
[`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md).

## 6. The intended moat (hypotheses to earn, never claims)

1. Continuous whole-chain project context — intent → research → creation → execution → revision →
   review → delivery, unbroken.
2. One capability system shared by humans and agents.
3. Traceable, versioned artifact flow across surfaces.
4. Composable, reusable workflows promoted from real work.
5. Governable domain and cross-domain experience, accumulated autonomously inside layered floors (§7).
6. Execution scheduling not bound to one model, tool, or platform.
7. Local, inspectable, deletable, reversible governance.

Each becomes a moat only after it is built, verified, and used. Describe them as what Fleet is
trying to earn.

## 7. Experience distillation — precise meaning

Fleet turns a *completed, traceable* work chain into **governable experience carrying source,
scope, confidence, artifact version, and outcome feedback** — what was done and why; which inputs
and tools were used; where a human edited, rejected, or confirmed; which result was adopted; what
failed and how it recovered; what is project-local versus verified cross-project. Accumulation is
**agent-autonomous and layered** (D5): working notes are written freely during work; the agent and
a logged idle-time consolidation pass promote distilled entries with source pointers into curated
layers; retrieval filters partition and sensitivity before similarity. The human is a curator, not
a gate — everything stays inspectable, pinnable, correctable, deletable. What remains wrong and
dangerous is the *unbounded* version: verbatim transcript hoarding, secret-bearing entries,
cross-project leakage, or memory that silently rewrites policy or permissions — those floors are
hard (D5, F2). Dependencies: traceable artifact flow and the shared execution path beneath it.

## 8. The honest line

Everything above §3 is **target value — hypotheses to be earned, not facts already true.** What is
verified today is a Craft v0.11.1-derived implementation tree under active convergence toward the
v0.10.5 product/interaction baseline; the current
per-capability truth lives in [`08-CRAFT-CAPABILITY-MAP.md`](08-CRAFT-CAPABILITY-MAP.md),
[`11-PRODUCT-MATRIX.md`](11-PRODUCT-MATRIX.md), and [`05-ROADMAP.md`](05-ROADMAP.md). This document
set exists precisely because a previous version let the vision outrun the code. State the final
design plainly; always report separately which behavior is real.

## 9. Compliance boundary (applies to the whole vision)

Demoting external services to replaceable adapters is a product strategy — **never** a license for
quota bypass, anti-detection, credential extraction, or terms-of-service evasion
([`02-DECISIONS.md`](02-DECISIONS.md) §F; [`03-NON-NEGOTIABLES.md`](03-NON-NEGOTIABLES.md) §5).
