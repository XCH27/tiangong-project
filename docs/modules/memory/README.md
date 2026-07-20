# Layered agent memory module

Design state: `PACKET_DRAFT`; implementation status: `not implemented`; development order: R9
(working-note writes need no new authority and may begin alongside R3 chains — Decision D5,
roadmap change log 2026-07-20). This packet owns the layered memory files, consolidation and
curation surface only. Prompt assembly, tool loadout, compaction and cost accounting belong to
[`../../17-TOKEN-ECONOMY.md`](../../17-TOKEN-ECONOMY.md) and SYS-03; calling this module a
"context broker" incorrectly implies a second routing authority.

## Direction (owner, 2026-07-20)

Memory accumulation is **agent-autonomous**. Humans do not gate retention — they curate when they
want to (pin / correct / delete). The system's job is layering, floors, logging and reversibility,
not approval queues. Canonical decision: D5 in [`../../02-DECISIONS.md`](../../02-DECISIONS.md).

## Layered model (files under the Workspace authority — no memory database before the D2 trigger)

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

## Consolidation (the autonomous loop)

Idle-triggered or post-session, on an **auxiliary lane that never rewrites the main session's
cached prefix mid-span** (Hermes curator / OpenClaw dreaming precedent —
[`../../references/context/04-GATEWAY-AGENT-COMPARISON.md`](../../references/context/04-GATEWAY-AGENT-COMPARISON.md)):
dedupe and stage recent notes → promote durable entries (with source pointers) into
`MEMORY.md`/`USER.md`/domain files → mark superseded entries and move stale material to archive →
append one human-readable log entry (what moved, why, source refs). Conflicting entries stay
explicitly conflicting until a logged pass or curation supersedes them (04 §3). Consolidation
archives; it never hard-deletes. Pinned entries are never auto-modified.

## Hard floors (D5 — autonomy never crosses these)

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

## Retrieval and injection

Retrieval is a session tool over the existing search authority (scoped query → references + scores;
never mutates history; never grants permission). Injection of curated layers rides the stable
prefix under per-file budgets with visible truncation; retrieved segments enter the volatile tail,
never the stable zone (17 §3a L6×L1 rule). Each layer's injected share is visible on the context
surface (P-29/P-31; QoderWork's awareness panel — per-file size + percent-of-context — is the
owner-supplied product reference for this display).

## Frontend and backend boundary

- P-31 shows layers, per-file injected share, consolidation log, conflicts, and pin/correct/delete.
- P-29/P-30 display measured context/cost projections; they do not read memory files directly —
  they consume the one SYS-03 effective projection.
- Backend extends existing Workspace file, search and Session-evidence paths. No
  `ExperienceProposal` store; the consolidation pass is a scheduled/idle task on existing
  automation seams.
- Human and Agent edits to memory files go through the same permissioned file path; curation
  actions (pin/correct/delete) are ordinary governed mutations once R4 exists.

## Failure and recovery

Missing source pointer, revoked scope, stale entry, contradictory records, unavailable index and
deletion failure are explicit states. Consolidation failure leaves working notes intact and logs
the failed pass. The safe fallback is the unchanged Craft Session/context path. Disable or
uninstall leaves raw evidence intact and stops injection; files remain user-readable Markdown.

## Evidence and reference boundary

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

## Reality and activation sequence

No memory files, index or consolidation pass exist yet (`rg -n "memory|MEMORY.md|consolidation"
app/packages app/apps`). Activation order: (1) define the file layout + entry tag format and let
agents write working notes/`MEMORY.md` through existing file tools (alongside R3); (2) add the
retrieval session tool over existing search; (3) add injection budgets + visible truncation and the
P-31 share display (with TE1 fields); (4) add the idle consolidation pass with its log; (5) add
curation actions through the R4 seam. Measure token/quality effect on the R3 trace before and
after injection (SYS-03 first proof). A prompt paragraph or a UI list is not an implementation.
