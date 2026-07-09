# Parallel Agent Operating Model

This document defines how multiple agents can develop the project without corrupting shared contracts, duplicating UI, or creating second-truth systems.

---

## Core Rule

Parallelism begins **after** the Lead freezes contracts and file ownership.

No Worker may independently modify shared protocol files, handler registration, channel maps, global i18n files, session storage contracts, or cross-module DTOs.

---

## Roles

| Role | Responsibility |
|---|---|
| **Lead** | Reads direction and decisions; freezes contracts; owns shared files; writes module specs and agent packets; reviews diffs; resolves conflict arbitration; is the only agent who may declare wave gates open and promote modules to `usable`. |
| **Module Agent** | Implements a bounded module slice from an agent packet. |
| **UI Agent** | Implements UI only after Lead has fixed placement, interaction, and ownership. |
| **Backend Agent** | Implements services/handlers only inside its assigned file domain. |
| **Verification Agent** | Runs targeted checks and real-behavior validation without changing product code unless assigned. |

---

## Wave Schedule

Work is organised into sequential **waves**. Each wave has a gate condition. No Worker may start work in wave N+1 until the Lead declares the gate passed.

| Wave | Gate Condition | Typical Work |
|---|---|---|
| **W0 — Contract Freeze** | Lead commits `docs/contracts/protocol-stubs.md`, frozen `action-ids.md`, and frozen `identity-tags-permission-matrix.md`; all three marked frozen in header | Lead only — zero Workers |
| **W1 — Spine** | W0 gate passed | M00 Platform Spine skeleton + M03 Action Registry skeleton (parallel); see W1 Execution Checkpoints below |
| **W2 — Runtime Core** | M00 backbone merged, M03 executor at `usable`, `SessionEvent` types live | M01, M02, M04, M05 in parallel |
| **W3 — Surfaces** | M03 at `usable` and M05 Library write path at `usable` | M06, M08, M09 in parallel |
| **F Track — Foundation** | M00 backbone merged | M07 Canvas foundation + M09 Video core (parallel track; syncs with W3 surfaces) |
| **W4 — Intelligence** | M05 lease model stable | M10, M11, M12 in parallel |
| **W5 — Polish** | All prior modules at `usable` | M13, M14; cross-module integration; Verification Agent sweep |

Workers declare their wave in the agent packet header. Starting work before the wave gate is a blocking violation.

---

## W1 Execution Checkpoints

To resolve parallel development dependency issues between M00 and M03:

1. **Checkpoint 1 (Skeleton Parallelism)**: M00 skeleton (TS type exports) and M03 skeleton (Action Registry schemas, action ID enum definition) can start in parallel immediately after W0 gate.
2. **Checkpoint 2 (M00 backbone-merged)**: The Lead explicitly declares `M00 backbone-merged` (session store, permission model, event bus are implemented and stable). M03 executor implementation MUST wait for this checkpoint.
3. **Checkpoint 3 (M03 executor usable)**: M03 executor completes implementation and is verified, unblocking the Wave 2 gate.

---

## Pre-Flight Gate

Before any agent edits files it must answer **all** of the following:

1. Which module spec owns this work?
2. Which wave packet assigns this work?
3. Which files may I edit?
4. Which files are **forbidden**?
5. Which shared contracts do I depend on? Are they frozen?
6. Does the work create another session, permission, timeline, memory, skill, or UI truth?
7. Which Internal Action or Agent callable path makes the UI agent-native?
8. What exact behaviour proves the slice is `usable`?
9. Is the wave gate open for my wave?

If any answer is missing or the gate is not yet open, the agent **stops and returns to the Lead**.

---

## Frozen Contract Files

The following are Lead-owned. Workers can read; they cannot modify:

- `app/packages/shared/src/protocol/*.ts`
- `app/packages/shared/src/protocol/index.ts`
- `app/packages/shared/src/protocol/dto.ts`
- `app/packages/shared/src/protocol/channels.ts`
- Electron channel maps and preload transport files
- RPC handler registries
- Global i18n locale JSON files
- Session persistence fields
- Permission profile schema
- Shared settings registry structure
- `docs/contracts/action-ids.md` (extend only via the Extension Process)
- `docs/contracts/protocol-stubs.md`
- `docs/contracts/identity-tags-permission-matrix.md`

---

## Fleet Bridge Interface

Fleet Bridge is the narrow IPC boundary through which a CLI run reports progress and receives team context from the Fleet session.

**Boundary rule:** Fleet owns the team state, member roster, and session timeline. A CLI run owns exactly one `RuntimeLane` entry. The CLI runtime does not call Fleet API methods directly; it sends lane events to Fleet Bridge, which translates them into `SessionEvent` entries on the Fleet side.

**Minimal interface (frozen at W0):**

```
FleetBridge.reportLaneEvent(laneId: string, event: RuntimeLaneEvent): void
FleetBridge.requestTeamContext(laneId: string): Promise<TeamContextSnapshot>
FleetBridge.closeLane(laneId: string, outcome: LaneOutcome): void
```

- `RuntimeLaneEvent`, `TeamContextSnapshot`, and `LaneOutcome` are defined in `docs/contracts/protocol-stubs.md`.
- A CLI run must not call any Fleet method not listed here. If a new method is needed, the Worker files a contract change request with the Lead before proceeding.
- Fleet Bridge does not own tools, does not hold session state, and does not proxy permission decisions. It is a one-way event pipe with one context-pull call.

**Concrete ownership boundary:**

| Owned by Fleet | Owned by CLI Runtime |
|---|---|
| Team roster, role assignments | Process lifecycle, stdin/stdout |
| Session timeline, replay log | Local model invocation |
| Permission decisions | Lane-local tool calls |
| Cost ledger entries | Lane-local file writes (reported back via event) |
| Cross-agent message routing | None — routing requests go through Fleet Bridge |

---

## Worktree Rule

Each parallel agent works in an **isolated branch or worktree**.

**Naming convention:** `agent/<wave>/<module-slug>/<short-description>`

Examples:
- `agent/w2/m01-clean-craft/remove-legacy-sidebar`
- `agent/w3/m07-canvas/viewport-manager`

**No two Workers may write to the same branch.** The Lead is the only agent who merges to `work/fresh-base-spine`.

---

## Completion Report (Required for Every PR)

Every PR description must include the following report template verbatim. PRs without it are rejected without review.

```
## Completion Report

- **Module:** M__
- **Wave:** W_
- **Worktree / branch:** agent/w_/m__-<slug>/<desc>
- **Commit:** <sha>
- **Files changed:** (list)
- **Forbidden files touched:** none  <!-- or list with justification -->
- **Frozen contracts depended on:** (list — version at time of work)
- **Validation commands run:**
  - [ ] `pnpm typecheck`
  - [ ] `pnpm test --filter <package>`
  - [ ] Manual smoke: (describe what you did)
- **Real behaviour evidence:**
  - (screenshot path / test run log excerpt / description)
- **Final status label:** `usable` | `display-only` | `blocked`
- **If blocked — what is needed:** (or "n/a")
```

---

## Conflict Arbitration

When two Workers produce contradictory implementations of the same contract field:

1. **Both Workers stop touching the conflicting file.** Continuing is a blocking violation.
2. Each Worker opens a short conflict report comment on the PR, stating:
   - The exact field or type that conflicts.
   - Their implementation choice and rationale.
   - Which spec statement they were following.
3. **The Lead resolves** by updating the relevant contract file and declaring which implementation wins.
4. The losing Worker rebases and adapts. The winning Worker is responsible for helping the other rebase if needed.

The Lead's word is final. Workers do not negotiate contracts between themselves.

---

## Task Packet Shape

Every `docs/agent-packets/*.md` file must include:

1. Scope and module sections covered.
2. Wave assignment.
3. Allowed files.
4. Forbidden files.
5. Frozen contracts used (with version).
6. Interfaces consumed.
7. Interfaces produced.
8. UI placement if any (Lead-defined).
9. Permission / timeline requirements.
10. Validation ladder.
11. Completion report template (pre-filled where possible).
12. Board Cards tracking section using `docs/BOARD-SYNC.md`.

---

## Board Sync Rule

The board is a lightweight synchronisation layer, not a second project-management truth. It tracks claim, blocker, handoff, and Lead-close facts for a slice already defined by a module spec and wave packet.

Before claiming work, a Worker must read `docs/BOARD-SYNC.md` and append or update exactly one card in the relevant packet's `## Board Cards` section using the exact fields from that document.

The Lead reviews board cards against `docs/OWNERSHIP-MATRIX.md` and `docs/WAVE-MODULE-MAP.md`. If the card conflicts with either document, the packet and ownership docs win.

---

## UI Rule

Parallel agents do **not** decide where new UI goes.

The Lead defines UI placement and interaction before backend work is split. This prevents every backend feature from adding its own settings page, toolbar, or panel.

---

## Agent-Native Rule

A writable feature is incomplete unless **both** paths exist:

- Human UI path.
- Agent / internal action path.

Both must reach the same backend behaviour, permission decision, timeline event, and rollback / evidence model.

---

## Failure Rule

If an implementation discovers the module spec is wrong, the Worker does **not** improvise a new architecture. It reports:

- The conflicting spec statement.
- The code fact.
- The smallest contract change needed.
- Whether the current slice is blocked or can continue within existing contracts.

---

## Common Failure Modes (Anti-Patterns)

The following patterns have caused coordination failures in past parallel builds. Every Worker must read this section before starting.

| Pattern | Why It Fails | Correct Action |
|---|---|---|
| Worker silently adds a field to a shared protocol file | Breaks other Workers who didn't expect the field; causes merge conflicts at integration | Stop. File a contract change request with the Lead. |
| Worker creates a second session or timeline store | Produces two sources of truth for the same data | Read M00 §16 risk register. Use the existing store. |
| Worker adds a new left-nav entry without Lead approval | UI ownership conflict | Read UI Rule above. Ask Lead for placement decision. |
| Worker starts W3 work before W2 gate is declared open | Depends on unstable contracts; guarantees rework | Check wave schedule. Wait for Lead's gate declaration. |
| Worker fixes a spec ambiguity by choosing the most convenient interpretation | May contradict another Worker's equally valid interpretation | Report ambiguity to Lead before any implementation. |
| Worker's PR has no Completion Report | Unanswerable at review time | Fill the Completion Report template. No exceptions. |
| Worker calls a Fleet API method not in the Fleet Bridge interface | Violates lane ownership boundary; creates hidden coupling | Use only the three FleetBridge methods. File a change request for anything else. |
| Worker self-promotes a slice to `usable` without Lead review | Status inflation; gate conditions may be silently broken | Propose promotion in PR. Lead confirms after review. |

---

## Lead Response SLA

To prevent asynchronous Worker processes from entering infinite waits during coordination delays or spec ambiguities:

1. **Response Time Limit**: The Lead should respond to blocker/status reports within **4 hours** during active development sessions.
2. **Park & Pivot Protocol**: If the Lead does not respond within the SLA limit:
   - The Worker commits its current progress in a draft PR.
   - The Worker marks the packet card status as `blocked/parked` in `BOARD-SYNC.md`.
   - The Worker pivots to non-blocking tasks or other assigned branches.
3. **No-Constraint Progression**: The Worker is allowed to write temporary stub code to progress past blockers, provided:
   - Stubs do not modify any shared contract file.
   - Stubs are clearly annotated with `// TODO: Waiting for Lead Decision`.
   - Stubbed work is marked `wired but not visually checked` and never self-promoted to `usable`.

---

## Verification Agent Boundaries

The Verification Agent serves as an automated/semi-automated test sweep role and is governed by strict boundaries:

1. **No Product Code Edits**: The Verification Agent must never edit product code in `app/`. It is restricted to editing `tests/`, `docs/`, and `Completion Report` fields.
2. **Read-Only Inspection**: It performs static validation, typechecks, and behavior validation.
3. **No Self-Usability Declarations**: The Verification Agent cannot self-promote a module to `usable`. It compiles validation results and logs an `Evidence Package` (e.g. CLI run scripts, logs, test outputs) for the Lead to review and make the promotion.
4. **Lead Assignment**: The Verification Agent only triggers checks based on direct assignments in wave packets or Lead instructions.

