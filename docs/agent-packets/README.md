# Agent Packets

Agent packets are execution documents for parallel workers. They are created after module specs and contract ownership are known.

---

## Detailed Packet Template

Every packet file must contain the following structure. A packet missing any section is incomplete and must be completed by the Lead before a Worker may claim it.

```markdown
# <Packet Name>

## Packet Metadata

| Field | Value |
|---|---|
| Packet ID | `packet-M##-W#-v1` |
| Module | M## — module-name |
| Wave | Wave # |
| Assigned Worker Role | `role:worker` |
| Required Domain Tags | `domain:code` / `domain:ui` (pick one or more) |
| Lead-assigned Date | YYYY-MM-DD |
| Target Branch | `worker/M##-module-name` |
| Worktree Path | `../worktrees/M##-module-name` |

---

## Scope: What This Worker Must Build

_Describe in 3–5 bullet points exactly what this worker is responsible for. Be specific about files, interfaces, and behaviors. Not vague goals._

- [ ] Implement `X` in `app/packages/Y/src/Z.ts`
- [ ] Wire `X` to the session timeline via `SessionEvent.type = 'X_ACTION'`
- [ ] Register action `x.do` in `InternalActionRegistry`
- [ ] Write a `## Verification Procedure` section in `docs/modules/M##-*.md`

---

## Scope: What This Worker Must NOT Touch

- `docs/contracts/action-ids.md` — frozen, owned by Lead
- `docs/contracts/protocol-stubs.md` — frozen, owned by Lead
- Any file in another worker's assigned module boundary

---

## Entry Points

1. `docs/modules/M##-module-name.md` — full module spec
2. `docs/contracts/action-ids.md` — action IDs assigned to this module
3. `docs/contracts/protocol-stubs.md` — type stubs to implement against

---

## Contracts This Worker Consumes (Read-Only)

| Contract | Location | What to use |
|---|---|---|
| SessionEvent stub | `docs/contracts/protocol-stubs.md` | Emit events of these shapes |
| ActionInvocation stub | `docs/contracts/protocol-stubs.md` | Use this shape for action calls |
| Action IDs | `docs/contracts/action-ids.md` | Use only pre-assigned IDs, no new ones |

---

## Contracts This Worker Produces

| Artifact | Location | Consumed By |
|---|---|---|
| _(e.g. M## exported interface)_ | `app/packages/___/src/types.ts` | M01, M02 |

---

## UI Placement
<Lead-defined placement, or "none — backend only">

---

## Permission / Timeline Requirements
<what permission level and timeline events are expected>

---

## Validation Ladder
1. targeted typecheck for touched packages
2. unit tests
3. real UI smoke for assigned visible path

---

## Handoff Checklist

Worker must complete ALL items before submitting handoff:
- [ ] All assigned files implemented (not stubbed unless explicitly noted)
- [ ] `docs/modules/M##-*.md` updated with `## Verification Procedure`
- [ ] Forbidden files not touched (confirmed)
- [ ] `typecheck:all` passes on the worker branch
- [ ] `fleet-verify.sh` passes
- [ ] Remaining `not implemented` items explicitly listed in handoff report
- [ ] Worktree, branch, and latest commit SHA recorded in handoff report

---

## Handoff Report Template

```text
HANDOFF REPORT — Packet packet-M##-W#-v1
Worker branch: worker/M##-module-name
Worktree: ../worktrees/M##-module-name
Last commit: <SHA>

Changed files:
- app/packages/___/src/___.ts — [implemented / stubbed / modified]

Forbidden files confirmed NOT touched:
- docs/contracts/action-ids.md ✓
- docs/contracts/protocol-stubs.md ✓

Validation performed:
- typecheck:all: PASS
- fleet-verify.sh: PASS

Remaining not-implemented items:
- (none) / (list any explicitly deferred items)

Blockers for Lead:
- (none) / (describe any decision needed)
```

---

## Board Cards
[Workers claim slices by appending cards here using the exact card format from docs/BOARD-SYNC.md]
```

---

## Worker Fallback: Incomplete or Missing Packet

If a Worker is assigned a packet that is missing one or more required sections, or if the packet file itself does not exist:

1. **Do not begin implementation.** Do not attempt to fill in missing fields by inference.
2. List the exact missing fields or missing file in a message to the Lead.
3. Wait for the Lead to complete the packet before starting any code or documentation changes.
4. If the Lead is unavailable, mark your assignment as `blocked` with blocker: `packet incomplete — missing: <list>`.

Do not hand a worker a legacy doc. Hand it an agent packet.

---

## Pre-Flight Gate & Example Responses

Before a Worker may run any modifying command, it must write a pre-flight report answering 9 validation questions. If any question is not applicable to the assigned task, the Worker must specify `n/a (reason: ...)` rather than leaving it blank or guessing.

### Example Pre-Flight Response (for M00 platform-spine skeleton)

```
PRE-FLIGHT CHECK — Packet packet-M00-W1-v1
Worker Seat: seat-api-worker-001

1. Is the wave gate open for my wave?
   Yes. Wave 1 gate is open (M00 backbone-merged is pending).

2. Do I have write permission on all allowed files?
   Yes. Allowed files: app/packages/server-core/src/session/*.ts.

3. Are all forbidden files excluded from my modification plan?
   Yes. Verified that no files in docs/contracts/ will be modified.

4. Are all target specifications in my module spec free of Chinese characters?
   Yes. Verified docs/modules/00-platform-spine.md contains only English.

5. Are all action ids in my plan already frozen?
   Yes. Checked docs/contracts/action-ids.md.

6. Are all stubs in my plan matching protocol-stubs.md?
   Yes. All interface shapes will strictly implement protocol-stubs.md types.

7. Which Internal Action or Agent-callable path makes the UI agent-native?
   n/a (reason: M00 skeleton establishes type exports only; UI path is scheduled for Wave 2/Phase 1).

8. Have I read the 5-layer token optimization rules (if touching memory/retrieval)?
   Yes. Handled in M10 context review.

9. Do I have the required seat tags (role, domain, trust)?
   Yes. Assigned seat has role:worker, domain:code, trust:internal.
```

---

## Planned Packets

| File | Purpose |
|---|---|
| `wave-0-contract-freeze.md` | Lead-owned shared contract freeze and dirty-tree cleanup. |
| `wave-1-platform-action.md` | Session, registry skeleton, first file/action spine loop (M00/M03). |
| `wave-2-runtime-files-quota.md` | Terminal/CLI, files/leases, quota/usage loops (M01/M02/M05/M11). |
| `wave-2-teamrun-routing.md` | Craft Agents (二开补强) Bridge smoke, TeamRun report loop, route/cost decision closure. |
| `wave-3-browser-capability-review.md` | Browser/artifact, context/review, capability/loadout, messaging. |
| `f-track-canvas-foundation.md` | Canvas root, store, SessionEvent bridge, first native nodes. |
