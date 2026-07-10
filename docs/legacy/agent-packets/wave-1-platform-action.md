# Wave 1 Platform Action Packet

> **Superseded 2026-07-09. Do not assign or implement from this packet.** It grants writes
> to Lead-owned protocol files and predates W0.1. A replacement W1 implementation packet is
> created only after the Lead re-freezes the canonical contract baseline.

> This packet consolidates the Wave 1 spine tasks: M00 (Platform Spine) and M03 (Internal Action Registry).
> Parallel worker seats are isolated through distinct assignments within this single packet.

---

## Packet Metadata

| Field | Value |
|---|---|
| Packet ID | `packet-W1-platform-action-v1` |
| Wave | Wave 1 (Spine) |
| Target Branch | `worker/wave-1-spine` |
| Lead-assigned Date | 2026-07-09 |

---

## Worker Seat Assignments

### Worker Seat 1: M00 Platform Spine (Skeleton & Backbone)
- **Role**: `role:worker`
- **Domain**: `domain:code`
- **Allowed Files**: `app/packages/server-core/src/session/*.ts`, `app/packages/shared/src/protocol/session.ts`
- **Goal**: Export TypeScript interfaces for session creation, permission checks, timeline buses, and write the M00 backbone implementation.
- **Tasks**:
  - [ ] Define and export types for `AgentSession`, `AgentSeat`, and `SessionEvent` matching `protocol-stubs.md`.
  - [ ] Implement `AgentSession.create()` throwing `SeatCreationError` on tag validation failure.
  - [ ] Wire the timeline event bus.
  - [ ] Write the verification procedure in `docs/modules/00-platform-spine.md`.

### Worker Seat 2: M03 Internal Action Registry (Skeleton & Executor)
- **Role**: `role:worker`
- **Domain**: `domain:code`
- **Allowed Files**: `app/packages/shared/src/protocol/internal-action.ts`, `app/packages/shared/src/action-executors/*.ts`
- **Goal**: Build registry stubs and action registration path, then wire the action executor against M00's timeline bus.
- **Tasks**:
  - [ ] Define the `InternalActionId` enum and registry handler schemas.
  - [ ] Write the `ActionManifest` builder.
  - [ ] Wait for `M00 backbone-merged` declaration before implementing the action executor.
  - [ ] Write the verification procedure in `docs/modules/03-internal-action-registry.md`.

---

## Scope: What Workers Must NOT Touch

- `docs/contracts/action-ids.md` — frozen, owned by Lead
- `docs/contracts/protocol-stubs.md` — frozen, owned by Lead
- `docs/contracts/identity-tags-permission-matrix.md` — frozen, owned by Lead

---

## Entry Points

1. `docs/modules/00-platform-spine.md` — M00 Spec
2. `docs/modules/03-internal-action-registry.md` — M03 Spec
3. `docs/contracts/protocol-stubs.md` — Frozen stubs

---

## Contracts Consumed (Read-Only)

- `docs/contracts/action-ids.md` @ `0dda5fada3bb562d9451836a753a6b6afd6c7d11`
- `docs/contracts/protocol-stubs.md` @ `21113dc36bc94e83e5ce381c52180a9bc7c03eb4`
- `docs/contracts/identity-tags-permission-matrix.md` @ `e3a7c3b6b6d3f034a30f7ad3e108737aed1364c6`

---

## Interfaces Produced

- `@fleet/session-spine` exported interface types (Session, Seat, Timeline)
- `@fleet/action-registry` action registration interface

---

## UI Placement

**None** — both are spine/backend core modules.

---

## Permission / Timeline Requirements

All seat creation requires permission validations. Executor actions must write `SessionEvent` records to the timeline event bus.

---

## Validation Ladder

1. `typecheck:all` passes on the working branch.
2. `AgentSession.create()` throws `SeatCreationError` when invalid domain/role tags are supplied (Unit Test).
3. Action execution emits correct `SessionEvent` schemas to the bus (Unit Test).
4. Run `fleet-verify.sh` to guarantee baseline compilation.

---

## Handoff Checklist

Workers must complete ALL items before submitting handoff:
- [ ] Stubs/interfaces exported matching the frozen contracts exactly.
- [ ] No forbidden files modified.
- [ ] Verification procedure sections written in the spec files.
- [ ] All tests passing locally.

---

## Handoff Report Template

```text
HANDOFF REPORT — Packet packet-W1-platform-action-v1
Worker seat: [Seat 1 / Seat 2]
Branch: worker/wave-1-spine
Commit: <SHA>

Changed files:
- app/packages/... — [implemented / modified]

Validation status:
- typecheck:all: PASS
- tests: PASS

Remaining not-implemented:
- (none)

Blockers for Lead:
- (none)
```

---

## Board Cards

### W1-M00 (Platform Spine)
- Card status: `not started`
- Assignee: TBD
- Evidence: —

### W1-M03 (Internal Action Registry)
- Card status: `not started`
- Assignee: TBD
- Evidence: —
