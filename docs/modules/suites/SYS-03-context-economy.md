# SYS-03 — Token, memory and skill economy

**Rows:** INTEL-01..07, EXEC-14, ORCH-03, INFO-06. **Craft base:** existing prompt/tool assembly,
UsageTracker, provider adapters, compaction/large-response paths, Skills/Sources and rtk rewrite.
**Development order:** TE1/R3 measurement, R9 experience, R15 loadout, R17 policy closure.
**Conditional SYS-03 ownership:** the centralized effective prompt/tool projection and, only when their
gates fire, ContextPack/ContextSegment and reviewed memory. **Depends on:** SYS-01 policy/profile
facts; the projection and Action seam remain separate.

**Design authority:** `SYS-03-context-economy.md` (Decision E12) — the
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

---

## Module boundary — Layered agent memory module

> Merged here from `docs/modules/memory/README.md` on 2026-09-21. That directory held a
> 123-line compatibility record referenced by exactly one document
> (`14-MODULE-ARCHITECTURE.md`) and by neither `PACKET-INDEX.md` nor this suite, so working on this
> loop meant reading two files that never linked to each other. One loop, one document.

Design state: `PACKET_DRAFT`; implementation status: `not implemented`; development order: R9
(working-note writes need no new authority and may begin alongside R3 chains — Decision D5,
roadmap change log 2026-07-20). This packet owns the layered memory files, consolidation and
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
| Working manual (rules/conventions) | existing workspace instructions (`AGENTS.md`-class context files) | human-editable; agent proposes edits as diffs | always, budget-capped (existing context-file path, 10k/file, 30 files) |
| User profile | `memory/USER.md` | agent-maintained | always, small budget, visible truncation |
| Long-term memory | `memory/MEMORY.md` | agent + consolidation pass | session start, per-file budget, visible truncation |
| Working notes | `memory/notes/YYYY-MM-DD[-slug].md` | agent, freely during/after work | **never wholesale** — indexed for scoped retrieval |
| Domain memory (optional) | `memory/domains/<domain>.md` | agent | only when the loadout includes the domain |
| Consolidation log | `memory/CONSOLIDATION.md` | consolidation pass only | never; human-readable audit |
| Archive | `memory/archive/…` | consolidation pass | never; excluded from default recall |

Entry metadata reuses the recovered M10 dimensions
([`../../design-library/10-memory---context---review.md`](../../design-library/10-memory---context---review.md)):
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

1. No credentials/secrets/tokens in any memory file (F2); suspected secrets go to
   sensitive-quarantine and are never injected.
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
never the stable zone (17 §3a L6×L1 rule). Each layer's injected share is visible on the context
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

Acceptance (reworded for autonomy): `MEM-001` an agent writes a working note and a distilled
long-term entry with source pointers, without human involvement; `MEM-002` a logged consolidation
pass promotes/archives entries, the log explains each move, and pinned entries are untouched;
`MEM-003` user deletion removes an entry and its index derivatives without rewriting raw Session
history; `MEM-004` a secret-bearing candidate is quarantined and never injected; `MEM-005`
project-partition entries are not retrievable from another Project.

#### Reality and activation sequence

**Updated 2026-07-30.** The *contract* now exists and is typechecked; no file, index or pass does.
`packages/shared/src/memory/memory-scope.ts` fixes who may write which layer, what a delegate
returns instead of writing, and what each role may read (H16–H18);
`packages/shared/src/memory/foreign-memory.ts` fixes what happens to material imported from other
agent products (H27); `packages/shared/src/labels/memory-curator-kit.ts` is the consolidation loop
as an expert kit, with Hermes' ageing and trigger defaults. This packet's layer model is unchanged
and remains the authority for the file layout; what it did not cover — delegation — is settled in
those modules. Build the store behind them rather than designing a second one. Activation order: (1) define the file layout + entry tag format and let
agents write working notes/`MEMORY.md` through existing file tools (alongside R3); (2) add the
retrieval session tool over existing search; (3) add injection budgets + visible truncation and the
P-31 share display (with TE1 fields); (4) add the idle consolidation pass with its log; (5) add
curation actions through the R4 seam. Measure token/quality effect on the R3 trace before and
after injection (SYS-03 first proof). A prompt paragraph or a UI list is not an implementation.

