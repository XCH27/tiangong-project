# Development Process

Fleet documentation is now treated as a project operating system for parallel development, not as a pile of planning notes.

The process has five layers:

1. **Direction**
   `PROJECT-DIRECTION.md` defines what Fleet is and is not.

2. **Decisions**
   `DECISIONS-LEDGER.md` records final product decisions and reversals.

3. **Control Plane**
   `PARALLEL-AGENT-OPERATING-MODEL.md`, `OWNERSHIP-MATRIX.md`, and `WAVE-MODULE-MAP.md` define who may change what and in what order.

4. **Module Specs**
   `docs/modules/*.md` defines one closed product loop per module.

5. **Agent Packets**
   `docs/agent-packets/*.md` turns one or more module sections into isolated work packages for parallel agents.

## Closed-Loop Requirement

Every module document must cover the whole loop:

1. Mission
2. User-visible loop
3. Current app reuse
4. Reference projects and license boundary
5. UI placement
6. Backend, RPC, and local-only boundary
7. Session, timeline, permission, rollback
8. Data model
9. Agent-native actions
10. Files to inspect first
11. Files likely touched
12. Parallel work packages
13. File ownership and frozen contracts
14. Validation ladder
15. Done / not done states
16. Risks and blocked decisions

For contract-only modules, section 2 becomes: "which other modules this contract enables to become user-visible."

The authoritative current module template is `docs/modules/README.md`. A short interface card is
not a substitute for field-level contracts, error/recovery, dependencies, and an executable real
verification procedure.

## Three-Axis Truth Model

Track three independent facts:

| Axis | Values | Owner |
|---|---|---|
| capability status | `not implemented`, `display-only`, `wired but not visually checked`, `usable` | Lead after evidence |
| execution gate | `Locked`, `Ready`, `In Progress`, `Blocked` | `WAVE-MODULE-MAP.md` / Lead |
| spec maturity | `concept`, `contract draft`, `execution-ready` | `DOCUMENT-READINESS.md` / Lead |

`Blocked` is not a fifth capability status. `Locked` is not a product result. A module may receive
an implementation packet only when its exact slice is Ready and its spec is execution-ready.

## Feature Status

Use only these status labels:

| Status | Meaning |
|---|---|
| `usable` | UI, backend, state, permission/timeline, and real behavior are connected. |
| `wired but not visually checked` | Backend or UI wiring exists, but the real rendered surface or runtime path has not been checked. |
| `display-only` | UI exists but is not backed by real behavior. |
| `not implemented` | The capability is not present. |

Passing typechecks or tests never upgrades a feature status by itself.

## `usable` Promotion Rules

Only the **Lead** may promote a module or slice to `usable`. Workers propose promotion by submitting a Completion Report; the Lead reviews and confirms.

Minimum criteria before Lead may promote to `usable`:

1. The human UI path and the agent/internal action path both reach the same backend, permission, and timeline behavior.
2. At least one real-behavior smoke check has been performed (not just tests passing).
3. Error handling and status wording are verified in the UI.
4. The Completion Report in the PR is fully filled — no `TODO` or empty fields.
5. No frozen contract was modified without a corresponding contract version bump.

If any criterion is missing, the Lead returns the PR with a named gap. The Worker does not self-promote.

## Validation Ladder

Validate a coherent feature slice, not every tiny edit:

1. Static checks for touched areas.
2. Targeted tests for the changed behavior.
3. Real behavior check for UI, runtime, browser, file, permission, or external effects.

If the same validation path fails twice, stop and identify the blocker instead of editing blindly.

## Documentation Flow

1. Promote decisions from legacy into `DECISIONS-LEDGER.md`.
2. Update `OWNERSHIP-MATRIX.md` if a package/file boundary changes.
3. Update `WAVE-MODULE-MAP.md` if execution order changes.
4. Write or revise the relevant module spec.
5. Promote the exact module slice to `execution-ready` in `DOCUMENT-READINESS.md`.
6. Only then write an agent packet and change the Wave Map gate to Ready.
7. Implementation follows the agent packet and reports back using the packet's completion format.

Do not use a legacy document as a work packet.

## DECISIONS-LEDGER Write Authority

- **Only the Lead** may write to `docs/DECISIONS-LEDGER.md`.
- Entries must be added within one working session of the decision being made. Do not backfill.
- Each row must fill the Ledger's canonical columns: date, decision, status, development effect
  (including rationale), affected modules, implementation/spec file, and effective wave. A
  dependency/API/storage decision whose reversibility is not obvious also requires an ADR that
  states reversibility; do not add unmatched columns to one row.
- `docs/HUMAN-FEEDBACK-LOG.md` is the staging area for unresolved feedback. Once the Lead
  acts on a feedback item, the resulting decision is promoted to `DECISIONS-LEDGER.md` and
  the feedback item is marked `→ promoted` with a cross-reference to the ledger entry.
  The feedback log is never the authoritative source; the ledger is.

## `AGENTS.md` Migration Target

`AGENTS.md` currently contains many hard rules from the old Chinese corpus. During the transition it remains active, but the target is:

- `AGENTS.md` becomes a concise forced-read execution summary.
- Product decisions live in `DECISIONS-LEDGER.md`.
- Parallel work rules live in `PARALLEL-AGENT-OPERATING-MODEL.md`.
- File ownership lives in `OWNERSHIP-MATRIX.md`.
- Module behavior lives in `docs/modules/*.md`.

Do not add new product rules only to `AGENTS.md`.

---

## Status Decision Tree (Self-Assessment)

Workers must mechanically walk through the following decision tree to classify their slice status in Completion Reports, eliminating subjective interpretation:

```
Start
  │
  ├─► Is there a real, functional UI path or terminal entry?
  │     ├── NO  ──► Is there a backend service/handler (not a mock/stub)?
  │     │             ├── YES ──► Classify as: "wired but not visually checked"
  │     │             └── NO  ──► Classify as: "not implemented"
  │     │
  │     └── YES ──► Is there a real backend handler/IPC path connected?
  │                   ├── NO  ──► Classify as: "display-only"
  │                   └── YES ──► Are all the following verified?
  │                                 1. State persists across restarts
  │                                 2. Permission blocks unauthorized calls
  │                                 3. Timeline events are emitted properly
  │                                 4. Callable via Agent tool path
  │                                 ├── YES ──► Propose as: "usable" (Lead declares)
  │                                 └── NO  ──► Classify as: "wired but not visually checked"
```
