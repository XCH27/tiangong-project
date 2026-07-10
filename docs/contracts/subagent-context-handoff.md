# Subagent / Member-Run Context Handoff

> **Class:** behaviour contract (text freeze for implementers; not a WAVE gate alone).  
> **Authority:** Lead. Aligns with M04 TeamRun, M10 Context Pack, M05 leases, M03 actions, D9, D19.  
> **Updated:** 2026-07-10  
> **Problem (owner):** When a lead Agent spawns subagents / member runs, children often lack
> task-local context and re-scan the whole monorepo, burning tokens faster than a single agent.  
> **Industry alignment:** Orchestrator–worker isolation + structured delegation + summary return
> (Anthropic multi-agent research; Claude Code subagents; Magentic-One; ADK context tiers).  
> **Not:** Copying full parent transcripts into every child; building a second chat product.

## 1. Diagnosis (binding product truth)

| Fact | Implication for Fleet |
|---|---|
| Subagents usually start a **fresh context window** | They do **not** inherit full parent chat history by default |
| Isolation is **intentional** (protect lead context from search/log noise) | “No history” is not a bug; **missing TaskBrief is** |
| Full-repo re-read by each child multiplies cost | Multi-agent can be **15×** chat cost if poorly delegated |
| Multi-agent helps **parallel, high-value, decomposable** work | Vague “go fix the project” must **not** spawn N children |

Fleet already names the orchestration spine (**TeamRun / RuntimeLane / Seat**, M04) and the
context centre (**M10 / D9**). This contract freezes the **handoff packet** between them.

## 2. Non-negotiable rules

1. **No bare spawn.** Starting a member run / subagent without a valid **TaskBrief** is forbidden
   (tool/schema reject or coordinator reject).
2. **Do not dump the parent transcript** into the child. Inject **TaskBrief** (+ optional bounded
   Context Pack segments), not full chat.
3. **Child returns a RunReport** (summary + artifacts + evidence refs), not a raw dump of its
   entire tool trace into the parent window.
4. **Large outputs use pointers** (paths, ArtifactRef, PR URL)—not re-embedding full files into
   the lead conversation (artifact / filesystem handoff pattern).
5. **Scope is a sandbox.** Allowed paths / tools are part of the brief; tools should prefer
   scoped read/search. Unscoped “explore whole monorepo” is denied by default for member runs
   unless the brief explicitly authorizes a **read-only map** phase with a hard tool-call budget.
6. **Scale effort to complexity.** Simple tasks → 0–1 worker; parallel only when paths/roles
   do not collide. Prefer one lead over many confused children when boundaries are unclear.
7. **Cost is visible.** Member-run token/tool usage must be attributable (M11 when available)
   so expensive spawn patterns are inspectable.

## 3. TaskBrief (required inject on spawn)

Every `propose_member_run` / subagent start carries a TaskBrief. Field names may freeze later;
**semantics are binding.**

| Field | Required | Purpose |
|---|---|---|
| `goal` | yes | One-sentence outcome + acceptance criteria |
| `scopePaths` | yes | Allow-list of workspace-relative paths (or explicit empty + map-only mode) |
| `forbiddenPaths` | no | Deny-list (secrets, unrelated packages) |
| `knownFacts` | yes | 3–15 short bullets the lead already paid for (architecture, failed attempts, key APIs) |
| `pointers` | no | File:line / symbol / ArtifactRef / prior RunReport ids—not full file bodies |
| `constraints` | yes | Tests to run, style, risk/permission ceiling, “do not push/merge” etc. |
| `deliverable` | yes | What to return: RunReport shape, files touched, open questions |
| `budget` | recommended | Max tool turns and/or token soft cap; explore thoroughness if any |
| `isolation` | recommended | `same_worktree` \| `branch` \| `worktree` (when code mutation) |
| `relatedProjects` | multi-project | Workspace / repo ids this child may touch—default **one** |

### Injection sources (automatic, not only model prose)

When the platform can supply them, attach without waiting for the model to invent them:

| Source | What to inject |
|---|---|
| Lead TaskBrief body | Goal, scope, knownFacts, deliverable |
| Workspace identity | workspaceId, cwd, seat/lane ids |
| M05 | Active/related lease paths; conflict notice if overlapping |
| M10 | Bounded **ContextSegment**s under token budget (project facts, not full history) |
| Optional index | Repo map / outline hits for `scopePaths` only (codegraph-class tools when promoted) |
| Git snapshot | Branch name, dirty summary (not full diff unless requested) |

Explore-only roles may use a **thinner** inject (goal + scope + budget) and skip heavy project
memory, matching industry “fast research subagent” practice.

## 4. RunReport (required on completion)

| Field | Purpose |
|---|---|
| `status` | completed \| failed \| blocked \| cancelled |
| `summary` | Short prose for the lead (order of 0.5–2k tokens, not a novel) |
| `changedPaths` / artifact refs | What changed or was produced |
| `readPaths` (optional sample) | For audit of scope compliance |
| `openQuestions` | Blockers for the lead—not silent re-spawn loops |
| `evidenceRefs` | SessionEvent / logs / PR URL / test output refs |
| `usage` | Tokens/tool calls when available (M11) |

Parent synthesizes from **RunReports**, not by replaying child transcripts.

## 5. When **not** to spawn

| Situation | Prefer |
|---|---|
| Goal or `scopePaths` cannot be stated | Stay on lead; do a single map pass first |
| Task is one continuous edit of the same module | Same session / same lane |
| Only trying to free lead context window | Compact/summarize lead; do not spawn amnesiac children |
| N children would all need the whole monorepo | One lead with index tools, or sequential scoped runs |
| Human interactive clarification required | Do not batch (M04 table); keep interactive lane |

## 6. Parallel multi-agent + multi-project

| Concern | Rule |
|---|---|
| Same repo parallel writers | Disjoint `scopePaths` + M05 leases; better: branch/worktree isolation |
| Cross-project | One child **one** primary project unless brief lists explicit multi-root allow-list |
| Orchestration authority | **TeamRun / M17** remain orchestration; child context is a **packet**, not a new session store |
| Human visibility of children | M04 **TaskPreview** / board / inspector (D53): route to authorized `childSessionId`; never copy a second transcript store |
| Code delivery to remote main | See `docs/contracts/git-pr-delivery.md` (PR protocol, Agent-operated) |

## 7. Relation to M10 Context Pack

| Mechanism | Role |
|---|---|
| **TaskBrief** | Per-spawn job contract (always required for member runs) |
| **Context Pack / ProjectPack** | Bounded, permissioned, secret-scanned retrieval for a purpose (M10B) |
| **Memory partitions** | Long-lived facts; not a dump of chat; never auto-inject quarantine |

Spawning may **request** a small pack preview into the brief’s budget; it must not pull unbounded
project memory.

## 8. Industry reference (black-box absorb, not product clone)

| Source | Absorbed idea |
|---|---|
| Anthropic multi-agent research engineering post | Detailed delegation; effort scaling; summary return; artifact pointers; multi-agent is expensive |
| Claude Code subagents | Isolated windows; delegation message; tool allow-lists; explore vs implement roles; worktree isolation |
| Magentic-One / orchestrator patterns | Lead holds plan/progress; workers specialized |
| Repo map / codebase index products | Prefer graph/outline retrieval over whole-tree reads |

Fleet implements these as **protocol fields and coordinator rules**, not by cloning third-party shells.

## 9. Acceptance checklist (when M04 member runs are usable)

1. Spawn without TaskBrief is rejected.  
2. Child tool policy cannot read outside `scopePaths` without explicit elevation.  
3. Lead receives RunReport summary; parent context does not grow by full child tool dumps.  
4. Two parallel code members with overlapping paths hit lease conflict rather than silent LWW.  
5. Simple single-file task does not spawn a swarm (policy or eval).  
6. Usage for member runs is attributable when M11 is available.

## 10. Absorb record

| Date | Note |
|---|---|
| 2026-07-10 | Owner: subagents re-read whole projects; want auto context inject on task assign. |
| 2026-07-10 | Industry absorb: Anthropic research multi-agent, Claude Code subagents, ADK-style tiers. |
| 2026-07-10 | Bound to M04/M10/M05; no second session store. |
