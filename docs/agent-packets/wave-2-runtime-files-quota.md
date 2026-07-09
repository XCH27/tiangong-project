# Wave 2 Runtime Files Quota Packet

> This packet defines the Wave 2 task assignments: M01, M02, M04, M05, and M11 (quota/usage ledger components).
> Workers claim seats and work on their assigned branches in parallel once the Wave 2 gate is declared open.

---

## Packet Metadata

| Field | Value |
|---|---|
| Packet ID | `packet-W2-runtime-files-quota-v1` |
| Wave | Wave 2 (Runtime Core) |
| Target Branch | `worker/wave-2-core` |
| Lead-assigned Date | 2026-07-09 |

---

## Worker Seat Assignments

### Worker Seat 1: M01 Terminal UI & M02 CLI Runtime
- **Role**: `role:worker`
- **Domain**: `domain:code` / `domain:ui`
- **Allowed Files**: `app/apps/electron/src/renderer/components/terminal/*`, `app/packages/server-core/src/runtime/cli-launcher.ts`
- **Goal**: Implement the local terminal interactive surface and PTY process execution bridge. Output logs must stream back to M00 session timeline.
- **Tasks**:
  - [ ] Wire UI terminal panel to the local runtime launcher.
  - [ ] Implement streamed stdout/stderr log output pipe.
  - [ ] Write the verification procedure in `docs/modules/02-terminal-cli-runtime/SPEC.md`.

### Worker Seat 2: M04 TeamRun & M05 Files Library
- **Role**: `role:worker`
- **Domain**: `domain:code`
- **Allowed Files**: `app/packages/server-core/src/files/library.ts`, `app/packages/shared/src/protocol/team-run.ts`
- **Goal**: Implement workspace files lease conflict control and register the first file/action spine loop.
- **Tasks**:
  - [ ] Implement lease creation and expiration cron.
  - [ ] Wire file change operations through the internal action path.
  - [ ] Write the verification procedure in `docs/modules/05-files-library-leases.md`.

### Worker Seat 3: M11 Quota & Usage Ledger
- **Role**: `role:worker`
- **Domain**: `domain:data`
- **Allowed Files**: `app/packages/server-core/src/quota/*`, `app/packages/shared/src/protocol/usage.ts`
- **Goal**: Integrate token/context UI details and write cost-calculation stubs.
- **Tasks**:
  - [ ] Implement quota snapshot adapter.
  - [ ] Wire usage ledger updates on action invocation.
  - [ ] Write the verification procedure in `docs/modules/11-model-routing-cost-ledger.md`.

---

## Scope: What Workers Must NOT Touch

- `docs/contracts/action-ids.md` — frozen, owned by Lead
- `docs/contracts/protocol-stubs.md` — frozen, owned by Lead
- `docs/contracts/identity-tags-permission-matrix.md` — frozen, owned by Lead

---

## Entry Points

1. `docs/modules/02-terminal-cli-runtime/SPEC.md`
2. `docs/modules/05-files-library-leases.md`
3. `docs/modules/11-model-routing-cost-ledger.md`

---

## Contracts Consumed (Read-Only)

- `docs/contracts/action-ids.md` @ `0dda5fada3bb562d9451836a753a6b6afd6c7d11`
- `docs/contracts/protocol-stubs.md` @ `21113dc36bc94e83e5ce381c52180a9bc7c03eb4`
- `docs/contracts/identity-tags-permission-matrix.md` @ `e3a7c3b6b6d3f034a30f7ad3e108737aed1364c6`

---

## Interfaces Produced

- `@fleet/terminal-pty` execution stream exports
- `@fleet/library-leases` lock verification handlers
- `@fleet/quota-ledger` usage adapter

---

## UI Placement

- Terminal UI: Docked in bottom workbench panel.
- Files UI: Left explorer sidebar.
- Quota: Settings quota details overlay.

---

## Permission / Timeline Requirements

All PTY spawns and file writes require permission hooks. Timeline events must log all execution outputs and file lock updates.

---

## Validation Ladder

1. targeted typecheck for touched packages.
2. PTY execution launches locally and updates terminal logs (Smoke Test).
3. Conflict locked file raises `PERMISSION_DENIED` and logs to timeline (Smoke Test).
4. Run `fleet-verify.sh`.

---

## Handoff Checklist

Workers must complete ALL items before submitting handoff:
- [ ] No stubs remain in critical execution paths.
- [ ] Spec files updated with verification procedures.
- [ ] Unpermitted files are not modified.
- [ ] All tests passing locally.

---

## Handoff Report Template

```text
HANDOFF REPORT — Packet packet-W2-runtime-files-quota-v1
Worker seat: [Seat 1 / Seat 2 / Seat 3]
Branch: worker/wave-2-core
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

### W2-M02 (Terminal CLI Runtime)
- Card status: `not started`
- Assignee: TBD
- Evidence: —

### W2-M05 (Files Library Leases)
- Card status: `not started`
- Assignee: TBD
- Evidence: —

### W2-M11 (Model Routing Cost Ledger)
- Card status: `not started`
- Assignee: TBD
- Evidence: —
