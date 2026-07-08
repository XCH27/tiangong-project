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

## Feature Status

Use only these status labels:

| Status | Meaning |
|---|---|
| `usable` | UI, backend, state, permission/timeline, and real behavior are connected. |
| `wired but not visually checked` | Backend or UI wiring exists, but the real rendered surface or runtime path has not been checked. |
| `display-only` | UI exists but is not backed by real behavior. |
| `not implemented` | The capability is not present. |

Passing typechecks or tests never upgrades a feature status by itself.

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
5. Only then write an agent packet.
6. Implementation follows the agent packet and reports back using the packet's completion format.

Do not use a legacy document as a work packet.

## `AGENTS.md` Migration Target

`AGENTS.md` currently contains many hard rules from the old Chinese corpus. During the transition it remains active, but the target is:

- `AGENTS.md` becomes a concise forced-read execution summary.
- Product decisions live in `DECISIONS-LEDGER.md`.
- Parallel work rules live in `PARALLEL-AGENT-OPERATING-MODEL.md`.
- File ownership lives in `OWNERSHIP-MATRIX.md`.
- Module behavior lives in `docs/modules/*.md`.

Do not add new product rules only to `AGENTS.md`.
