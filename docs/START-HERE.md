# Start Here

This repository should now be treated as a fresh second-stage build on top of Craft Agents, not as a continuation of the old Fleet experiment.

The old documents were moved under `docs/legacy/`. They are historical evidence only. Do not use them as the active roadmap unless a new English document explicitly promotes a decision back into the current plan.

## Read Order

> **Authority note:** The read order below is the expanded onboarding version of
> `AGENTS.md § Read First`. If you encounter any conflict between the two, follow
> `AGENTS.md` and report the discrepancy to the Lead so the active doc can be updated.

1. `docs/START-HERE.md` ← you are here
2. `docs/PROJECT-DIRECTION.md`
3. `docs/DECISIONS-LEDGER.md`
4. `docs/DEVELOPMENT-PROCESS.md`
5. `docs/CLOUD-LOCAL-WORKFLOW.md`
6. `docs/PARALLEL-AGENT-OPERATING-MODEL.md`
7. `docs/OWNERSHIP-MATRIX.md`
8. `docs/WAVE-MODULE-MAP.md`
9. `docs/REFERENCE-PROJECT-POLICY.md`
10. The module spec under `docs/modules/` for the work you are doing
11. The wave packet under `docs/agent-packets/` if you are a parallel worker
12. `AGENTS.md` as the forced-read execution summary
13. The current `app/` code, starting from the Craft Agents modules you are about to modify
14. `docs/legacy/` only when you need to recover historical rationale or verify a prior decision

## Working Rule

Project direction comes first. Before deciding what to keep from the current `app/`, decide what the product is supposed to become and where the next user-visible loop lives.

Do not start a parallel implementation task from a legacy document. Legacy documents are evidence. Active English docs are the execution surface.

During documentation cleanup, use `docs/CLOUD-LOCAL-WORKFLOW.md` for branch, pull request,
and cloud/local responsibility rules.

Use these status labels only:

- `usable`
- `wired but not visually checked`
- `display-only`
- `not implemented`

Do not use passing tests as a substitute for a real product loop.
