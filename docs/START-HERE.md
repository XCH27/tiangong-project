# Start Here

This repository should now be treated as a fresh second-stage build on top of Craft Agents, not as a continuation of the old Fleet experiment.

The old documents were moved under `docs/legacy/`. They are historical evidence only. Do not use them as the active roadmap unless a new English document explicitly promotes a decision back into the current plan.

## Read Order

1. `docs/PROJECT-DIRECTION.md`
2. `docs/DECISIONS-LEDGER.md`
3. `docs/DEVELOPMENT-PROCESS.md`
4. `docs/PARALLEL-AGENT-OPERATING-MODEL.md`
5. `docs/OWNERSHIP-MATRIX.md`
6. `docs/WAVE-MODULE-MAP.md`
7. `docs/REFERENCE-PROJECT-POLICY.md`
8. `docs/BOARD-SYNC.md` if you are claiming, handing off, closing, or reassigning parallel work
9. The module spec under `docs/modules/` for the work you are doing
10. The wave packet under `docs/agent-packets/` if you are a parallel worker
11. `AGENTS.md` as the forced-read execution summary
12. The current `app/` code, starting from the Craft Agents modules you are about to modify
13. `docs/legacy/` only when you need to recover historical rationale or verify a prior decision

## Working Rule

Project direction comes first. Before deciding what to keep from the current `app/`, decide what the product is supposed to become and where the next user-visible loop lives.

Do not start a parallel implementation task from a legacy document. Legacy documents are evidence. Active English docs are the execution surface.

Use these status labels only:

- `usable`
- `wired but not visually checked`
- `display-only`
- `not implemented`

Do not use passing tests as a substitute for a real product loop.
