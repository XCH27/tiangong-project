# Agent Packet Template

> This file is the canonical template for all agent work packets.
> Copy this file and fill in all sections before assigning to a Worker.
> Do not assign a packet with any section left blank or marked TODO.

---

## Packet Metadata

| Field | Value |
|---|---|
| Packet ID | `packet-M##-W#-v1` |
| Module | M## — module-name |
| Wave | W# |
| Assigned Worker Role | `role:worker` |
| Required Domain Tags | `domain:code` / `domain:ui` / `domain:data` (pick one or more) |
| Lead-assigned Date | YYYY-MM-DD |
| Target Branch | `worker/M##-module-name` |
| Worktree Path | `../worktrees/M##-module-name` |

---

## Scope: What This Worker Must Build

_Describe in 3–5 bullet points exactly what this worker is responsible for.
Be specific about files, interfaces, and behaviors. Not vague goals._

- [ ] Implement `X` in `app/packages/Y/src/Z.ts`
- [ ] Wire `X` to the session timeline via `SessionEvent.type = 'X_ACTION'`
- [ ] Register action `x.do` in `InternalActionRegistry`
- [ ] Write a `## Verification Procedure` section in `docs/modules/M##-*.md`

---

## Scope: What This Worker Must NOT Touch

_List files and contracts that are frozen or owned by other workers/Lead._

- `docs/contracts/action-ids.md` — frozen, owned by Lead
- `docs/contracts/protocol-stubs.md` — frozen, owned by Lead
- Any file in another worker's assigned module boundary

---

## Entry Points

_Where does the worker start reading?_

1. `docs/modules/M##-module-name.md` — full module spec
2. `docs/contracts/action-ids.md` — action IDs assigned to this module
3. `docs/contracts/protocol-stubs.md` — type stubs to implement against
4. Relevant files in `app/packages/` listed below:
   - `app/packages/___/src/___`

---

## Contracts This Worker Consumes (Read-Only)

| Contract | Location | What to use |
|---|---|---|
| SessionEvent stub | `docs/contracts/protocol-stubs.md` | Emit events of these shapes |
| ActionInvocation stub | `docs/contracts/protocol-stubs.md` | Use this shape for action calls |
| Action IDs | `docs/contracts/action-ids.md` | Use only pre-assigned IDs, no new ones |

---

## Contracts This Worker Produces (Must Be Stable Before Dependents Start)

| Artifact | Location | Consumed By |
|---|---|---|
| _(e.g. M## exported interface)_ | `app/packages/___/src/types.ts` | M01, M02 |

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

```
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
