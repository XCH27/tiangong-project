# ADR 0032: Identity Tags, Permissions, and Skill Loading

**Status:** Accepted
**Date:** 2026-07-09

## Context

As the multi-agent framework expands, we need a robust, scalable way to manage agent permissions, tool access, and skill loading. Hardcoding roles or permissions leads to combinatorial explosion and security risks. We need a flexible identity system that cleanly determines what an agent can and cannot do.

## Decision

We introduce a Three-Layer Identity Tag system:

1. **Role (`role:`)**: Defines orchestration authority (`lead`, `worker`, `reviewer`).
2. **Domain (`domain:`)**: Defines knowledge/tool specialization (`media`, `code`, `ui`, `data`).
3. **Trust (`trust:`)**: Defines data-access boundary (`internal`, `host`, `external`).

Permissions and tools are granted through a strict union of these tags (default deny). 
Skills are loaded statically at Seat creation time.
Heavy plugins are hidden from the Worker LLM and mounted automatically by the CapabilityPlanner based on cost constraints.

## Consequences

- **Positive:** Clear, auditable permission boundaries. Eliminates hallucination risks of workers trying to use expensive or unauthorized tools. Clean separation of concerns.
- **Negative:** Slightly more overhead when defining new Agent Seats.

*Note: For the full technical matrix and constraints, see the W0 frozen contract at `docs/contracts/identity-tags-permission-matrix.md`.*
