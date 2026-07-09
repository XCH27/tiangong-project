# Board Sync Model

This document defines how parallel agents keep a shared, truthful view of wave and module
progress without creating a second project-management system. It does not replace
`docs/PARALLEL-AGENT-OPERATING-MODEL.md`, `docs/OWNERSHIP-MATRIX.md`, or
`docs/WAVE-MODULE-MAP.md`. It turns their existing rules into one card format every agent
reports against.

## Why This Exists

Multiple agents working in parallel need a shared answer to three questions at any time:

- Who owns this file or slice right now?
- What is the real status of this slice, using the same four labels everywhere?
- Is there a blocker, and what is the smallest decision needed to clear it?

A board that drifts out of sync with `AGENTS.md` status wording or with the ownership rules
in `OWNERSHIP-MATRIX.md` is worse than no board. This file exists to prevent that drift.

## Non-Goals

- This is not a ticketing product and does not get a UI of its own.
- This does not define scope. Scope still comes from `docs/modules/*.md` and the relevant
  `docs/agent-packets/*.md` file.
- This does not replace the worker handoff report required by
  `docs/PARALLEL-AGENT-OPERATING-MODEL.md`. A card is the structured summary of that report,
  not a substitute for it.

## Card Types

| Card | Represents | Source of truth for scope |
|---|---|---|
| Wave card | One execution wave or track, for example Wave 2 or F-track. | `docs/WAVE-MODULE-MAP.md` |
| Slice card | One bounded section of one module implemented inside one wave. | The module spec plus the wave packet's "Module Sections Covered" |
| Handoff record | One completed or blocked delivery from one agent against one slice card. | Worker handoff report |

A slice card never claims an entire module unless the module spec and the wave packet both
confirm the whole module ships in that wave. `docs/WAVE-MODULE-MAP.md` already states that no
packet may claim a whole module if it spans multiple waves; slice cards must follow that rule
exactly.

## Required Fields

Every slice card carries the same fields, in this order. No renamed or invented fields.

| Field | Meaning | Allowed values |
|---|---|---|
| `wave` | Wave or track this card belongs to. | Matches a wave name in `WAVE-MODULE-MAP.md` |
| `module` | Module this card implements a slice of. | Matches a file name in `docs/modules/` |
| `slice` | The exact bounded section covered, not "the whole module." | Free text naming sections or a closed loop |
| `owner` | The single agent currently responsible. | One agent identifier |
| `worktree` | Path to the isolated worktree. | Path |
| `branch` | Branch name for this slice. | Branch name |
| `status` | Feature status using the exact `AGENTS.md` labels. | `not implemented`, `display-only`, `wired but not visually checked`, `usable` |
| `ui_state` | UI-side progress, independent of feature status. | `not started`, `placed by lead`, `implemented`, `verified` |
| `backend_state` | Backend-side progress, independent of feature status. | `not started`, `service wired`, `handler wired`, `verified` |
| `contracts` | Frozen contracts this slice depends on. | Names from "Frozen Contracts Consumed" in the packet |
| `allowed_files` | Files this agent may edit. | Inherited from the packet, not redefined here |
| `forbidden_files` | Files this agent may not touch. | Inherited from the packet, not redefined here |
| `validation` | Checks actually run, cheapest first. | Free text list |
| `remaining_not_implemented` | What is still missing before `usable`. | Free text list, may be empty only if status is `usable` |
| `blocker` | Current blocker, or `none`. | Three-part structure when present: conflicting spec statement, code fact, smallest Lead decision needed |

A card missing any required field is not a valid update. An agent that cannot fill a field
stops and returns to the Lead instead of inventing a value.

## Status Discipline

Status values are exactly the four labels defined in `AGENTS.md`. No fifth informal status
like "almost done" or "mostly working" is valid.

Allowed forward transitions:

1. `not implemented` -> `display-only`: a UI shell or documentation placeholder exists with no
   real behavior behind it.
2. `display-only` -> `wired but not visually checked`: backend and UI paths are connected, but
   real user-facing behavior has not been checked end to end.
3. `wired but not visually checked` -> `usable`: the coherent loop is complete, covering
   interface, core logic, state or persistence, permissions, timeline evidence, error handling,
   and status wording, and it has been checked as real behavior, not just passing tests.

A card may move backward if verification reveals the slice was over-reported. That is a
correction, not a failure to hide. `blocked` is not a fifth status; it is a separate field that
can attach to any status while the underlying work is stalled.

## Sync Points

Cards are updated at four points only. Continuous micro-updates are not required and are
discouraged, matching the validation rhythm in `AGENTS.md`.

1. **Claim** - an agent takes a slice: sets `owner`, `worktree`, `branch`, `wave`, `module`,
   `slice`, starting `status`, and the `allowed_files` / `forbidden_files` inherited from the
   packet.
2. **Blocker** - only when a real blocker appears: scope drift, a missing frozen contract, a
   file ownership conflict, or a spec-versus-code contradiction. Routine progress does not
   trigger a card update.
3. **Handoff** - work is done or paused: updates `status`, `ui_state`, `backend_state`,
   `validation`, `remaining_not_implemented`, and links the full handoff report.
4. **Lead close** - the Lead reviews the handoff and either closes the card, sends it back with
   a named gap, or splits it into a new slice card for the next wave.

## Conflict Checks Before Any Claim

Before an agent claims a slice card, it must confirm both of the following. These checks are
not optional and are not delegated to tooling that does not exist yet; the agent performs them
by reading the current cards and the ownership docs.

- **File overlap check**: no other open card lists any of the same `allowed_files`, and none of
  the requested files appear in a frozen contract list unless the Lead has explicitly reassigned
  ownership for this wave.
- **Scope overlap check**: the requested `slice` maps to a section of a module that
  `docs/WAVE-MODULE-MAP.md` assigns to the current wave. A card cannot claim sections assigned
  to a different wave, and cannot claim "the whole module" when the map splits it across waves.

If either check fails, the agent does not claim the card. It reports the conflict to the Lead
instead of proceeding around it.

## Card Template

Use this exact block inside the relevant wave section below, or inside the packet's own
Board Cards section. Do not create a new file format for this; append the block as Markdown.

```md
### Card: <wave> / <module> / <slice-name>

- Owner: <agent-id>
- Worktree: <path>
- Branch: <branch-name>
- Status: <not implemented | display-only | wired but not visually checked | usable>
- UI State: <not started | placed by lead | implemented | verified>
- Backend State: <not started | service wired | handler wired | verified>
- Contracts: <frozen contract names>
- Allowed Files:
  - <path>
- Forbidden Files:
  - <path>
- Validation:
  - <check performed>
- Remaining Not Implemented:
  - <item, or "none" only if Status is usable>
- Blocker:
  - <conflicting spec statement / code fact / smallest Lead decision needed, or "none">
```

## Relationship to Other Documents

- `docs/WAVE-MODULE-MAP.md` still decides which modules run in which wave. This file does not
  override that mapping.
- `docs/OWNERSHIP-MATRIX.md` still decides which packages and files a module may touch. Cards
  inherit `allowed_files` and `forbidden_files` from the packet, which in turn comes from this
  matrix.
- `docs/PARALLEL-AGENT-OPERATING-MODEL.md` still defines the Pre-Flight Gate, the Frozen
  Contract Files list, and the Failure Rule. A card cannot be claimed if the Pre-Flight Gate
  questions in that document are unanswered.
- `AGENTS.md` still defines the four status labels and the validation rhythm. This file adds no
  new labels and no new validation steps.

---

## Current Board

> This section holds the live card state.
> **WRITE RULE: Each Worker Agent appends cards ONLY inside its own wave subsection below.**
> Do not append to another wave's subsection. Do not add cards outside a wave subsection.
> This partitioning prevents git merge conflicts when multiple Workers commit simultaneously.
> The Lead initializes each wave subsection; Workers claim slices by updating their own card.

---

### Wave 0 — Contract Freeze & Clean Baseline (Lead-only)

<!-- Workers: this wave is Lead-only. Do not append cards here. -->

#### Card: Wave 0 / Platform Spine / Contract freeze and shared DTO scaffold

- Owner: Lead
- Worktree: (root — Lead works in main worktree)
- Branch: work/fresh-base-spine
- Status: not implemented
- UI State: not started
- Backend State: not started
- Contracts: (none yet — this card produces the frozen contracts)
- Allowed Files:
  - `app/packages/shared/`
  - `app/packages/protocol/`
  - `docs/modules/`
  - `docs/agent-packets/`
  - `docs/OWNERSHIP-MATRIX.md`
  - `docs/WAVE-MODULE-MAP.md`
- Forbidden Files:
  - `app/apps/electron/src/renderer/`
  - `app/apps/electron/src/main/`
- Validation:
  - none yet
- Remaining Not Implemented:
  - Zod schema snapshot for SessionEvent, ActorRef, ActionInvocation under `app/packages/shared/src/protocol/`
  - Action-id enum freeze (`docs/contracts/action-ids.md` or equivalent TS file)
  - Actor and runtime metadata types
  - Shared event channel contracts
  - Internal Action Registry interface
  - First module spec (Terminal / CLI Runtime)
  - Wave 0 agent packet
- Blocker:
  - Spec states workers may not start until Wave 0 contracts are frozen / No protocol Zod schema or action-id file exists yet / Lead must commit `app/packages/shared/src/protocol/` stub types and `docs/contracts/action-ids.md` before any Worker branch is opened

#### Card: Wave 0 / Clean Craft Baseline / Upstream sync and shell reset

- Owner: Lead
- Worktree: (root — Lead works in main worktree)
- Branch: work/fresh-base-spine
- Status: not implemented
- UI State: not started
- Backend State: not started
- Contracts: (depends on Platform Spine DTO freeze)
- Allowed Files:
  - `app/` (classification pass only — no feature code until DTO freeze)
  - `docs/DECISIONS-LEDGER.md`
  - `docs/START-HERE.md`
  - `README.md`
  - `AGENTS.md`
- Forbidden Files:
  - `app/packages/shared/`
  - `app/packages/protocol/`
- Validation:
  - `./scripts/craft.sh install`
  - `./scripts/craft.sh run typecheck:all`
  - `./scripts/craft.sh run electron:dev` (smoke launch)
- Remaining Not Implemented:
  - Code classification pass (baseline / candidate / legacy / delete)
  - Quarantine of wrong old UI
  - Upstream sync verification
- Blocker: none

---

### Wave 1 — Runtime, Files, Quota

<!-- Workers assigned to wave-1-runtime-files-quota.md append cards here only. -->
<!-- One card per slice. Do not claim the whole module. -->

---

### Wave 2 — TeamRun, Routing

<!-- Workers assigned to wave-2-teamrun-routing.md append cards here only. -->

---

### Wave 3 — Browser Capability Review

<!-- Workers assigned to wave-3-browser-capability-review.md append cards here only. -->

---

### F-Track — Canvas Foundation

<!-- Workers assigned to f-track-canvas-foundation.md append cards here only. -->

---

### Future Waves

<!-- Lead adds new wave subsections here as waves are initialized. -->
<!-- Workers must not create new wave subsections without Lead approval. -->
