# System-suite TaskBrief template

Use this template when assigning one of the suites in [`../16-SYSTEM-SUITES.md`](../16-SYSTEM-SUITES.md)
to an Agent. A suite assignment is not permission to change shared contracts or declare the whole
suite complete. The integrator approves contract changes and merges the evidence.

## Identity and boundary

- Suite ID / name:
- Closed loop (trigger → user-visible outcome):
- Registry IDs owned or consumed:
- P-IDs owned or consumed:
- Bounded contexts:
- Integration owner:
- Development-order anchor(s) (R0–R18):
- Agent branch/worktree:
- Out of this slice / owning release-order row:

## Interface and authority

- External interface (small, typed, caller-visible):
- Shared contracts consumed (version/owner):
- Native state authority owned by this suite:
- State that must remain in another suite:
- Adapters and external side effects:
- Permission, identity and attribution path:
- Cancellation, restart, idempotency and resource limits:

## Reality baseline

| Claim | Exact repository path/symbol | Status vocabulary | Command/test evidence |
|---|---|---|---|
| Existing behavior |  |  |  |
| Missing seam |  | `not implemented` | absence or failing fixture |
| Preview-only surface |  | `display-only` | preview route/screenshot |

## References consumed

For every reference, record fixed checkout/commit, license, exact files/symbols, mechanism, Fleet
seam, same-task alternative, local-surpass test, failure/recovery implications and admission status.
Product-only references must be marked as such. A name without source evidence is not a reference
decision.

## Execution slices

| Slice | Registry/P-ID/acceptance IDs | Hard dependencies | Soft dependencies | Files/paths | Verification command | Rollback |
|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |

## Conflict gate

Before integration, review the relevant rows in the suite conflict matrix: authority collision,
caller/policy path, ArtifactRef version, JobRef lifecycle, token/quality effect, offline/denied/
recovery states, license/dependency and deletion test. A suite may continue isolated research while
an integration edge is blocked, but it may not add a bypass store or adapter.

## Acceptance and handoff

- Canonical acceptance IDs:
- Given/When/Then criteria in active spec:
- Twice-run procedure and evidence paths:
- Owner visual checkpoint:
- Current status (`usable` · `wired but not visually checked` · `display-only` · `not implemented`):
- Docs updated: registry, packet index, matrix, pages, references, active spec, user-facing docs:
