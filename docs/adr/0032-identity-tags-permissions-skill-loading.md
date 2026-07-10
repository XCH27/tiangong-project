# ADR 0032: Identity Tags, Permissions, and Skill Loading

**Status:** Amended 2026-07-09; canonical shape still pending W0.1 re-freeze
**Date:** 2026-07-09

## Context

As the multi-agent framework expands, we need a robust, scalable way to manage agent permissions, tool access, and skill loading. Hardcoding roles or permissions leads to combinatorial explosion and security risks. We need a flexible identity system that cleanly determines what an agent can and cannot do.

## Decision

We introduce a Three-Layer Identity Tag system:

1. **Role (`role:`)**: Defines orchestration authority (`lead`, `worker`, `reviewer`).
2. **Domain (`domain:`)**: Defines knowledge/tool specialization (`media`, `code`, `ui`, `data`).
3. **Trust (`trust:`)**: Defines data-access boundary (`internal`, `host`, `external`).

Role/domain grants are unioned, then intersected with trust, workspace, sensitivity, and explicit
task ceilings; explicit deny wins. Trust never grants authority. The resulting Seat authority is
canonical and identity tags are a deterministic projection, not separately mutable permission
state.

Installed capabilities, effective loadout, and runtime instances are distinct. M12 derives an
effective manifest from the canonical Seat plus workspace/task/runtime constraints. Heavy
capabilities are not mounted solely because a planner predicts usefulness or cost; the effective
permission/loadout contract must allow them.

## Consequences

- **Positive:** Clear, auditable permission boundaries. Eliminates hallucination risks of workers trying to use expensive or unauthorized tools. Clean separation of concerns.
- **Negative:** Slightly more overhead when defining new Agent Seats.

*Note: The v1.2 matrix is a recorded baseline, not current implementation authorization. W0.1 must
re-freeze one AgentSeat/tag/loadout contract consistent with M00/M12 and
`docs/contracts/composable-workspace-contracts.md`.*
