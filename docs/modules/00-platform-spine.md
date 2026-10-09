# M00 — Platform Spine

> **Capability status:** `not implemented`
> **Execution gate:** Locked pending W0.1 contract re-freeze
> **Wave:** W1
> **Owner:** Lead
> **Spec version:** draft v1.1 — 2026-07-09
> **Spec maturity:** contract draft; physical storage adapter unresolved on v0.11 baseline
> **Depends on:** W0.1 re-frozen action, event, and identity contracts.

## 1. Purpose

Provide the one local authority for Fleet sessions, actor identity, permission decisions, timeline evidence, and durable state. M00 does not introduce a physical daemon in W1/W2; it enables later user-visible modules to write one auditable timeline through one permission authority.

## 2. Scope

### In Scope

- Session creation/lookup, actor references, AgentSeat validation, permission decisions, and ordered SessionEvents.
- One canonical local persistence authority for sessions, events, approval records, invocation
  correlation, and lease metadata. The physical adapter is selected only after the v0.11 migration
  inspection and persistence ADR.
- A process-local spine exposed to the Electron main process and bounded Fleet Bridge consumers.

### Out of Scope

- A separately installed or long-lived daemon, remote account service, memory engine, terminal renderer, or Action Registry executor.
- A second session, permission, or timeline store.

## 3. Enabling Loop

```
human or agent request → M03 permission query → M00 evaluates identity and policy
→ one durable SessionEvent → caller receives allow / deny / approval-required
```

Failure path:

```
unrecognized actor, invalid seat, unavailable store, or denied policy
→ typed refusal / recovery state → action is not executed → failure evidence is appended when a session exists
```

## 4. Contract Surface

M00 consumes the frozen `SessionEvent`, `ActorRef`, `AgentSeat`, and permission vocabulary. It must not invent event kinds. Contract changes are Lead-owned and require W0.1 re-freeze before Worker implementation.

| Capability | Result | Timeline rule |
|---|---|---|
| check permission | allow, deny, or approval-required decision | decision basis is auditable; a mutation is not implied |
| append event | ordered `SessionEvent` | `seq` is monotonic per session |
| create seat | validated AgentSeat or `SeatCreationError` | creation/denial evidence is retained |
| read timeline | ordered, permission-filtered events | read-only; no new event required |

## 5. State and Persistence

- The retained/selected M00 store is authoritative for SessionEvent order, approvals, and execution
  metadata. No module assumes SQLite or creates a parallel database before W0.1 decides the adapter.
- In-memory caches are derived only and may be rebuilt from the canonical store.
- A state-changing transaction either commits its corresponding evidence or reports failure; no caller may claim success before both are durable.
- Restart recovery reopens the same local store and marks interrupted work for its owning module to reconcile; it never creates a replacement session database.
- `docs/PERSISTENCE-AUTHORITY-MAP.md` is the binding cross-module ownership map.

## 6. Permission and Identity Rules

- The canonical seat shape and its identity-tag projection are defined by the re-frozen identity contract.
- Every L2/L3 request returns an explicit decision or supervision request; no runtime lane, Manager Agent, or Bridge bypasses it.
- Denials are default-safe: a missing grant, malformed identity, or unavailable policy evaluation does not allow a mutation.

## 7. UI and Agent Surface

M00 adds no independent shell surface. Its visible outputs are reused by existing session timeline, approval, error, and status surfaces. Agent consumers may request `sessions:listEvents` and `sessions:checkPermission`; their transport names are not additional Action IDs.

## 8. Error Handling

| Condition | Visible result | Recovery |
|---|---|---|
| invalid seat identity | request refused with audit reference | Lead corrects the seat assignment; retry creates a new request |
| permission denied | no mutation; reason shown by caller | user changes approval or request scope |
| store unavailable | action remains unexecuted | retry after local storage recovery; never write a shadow store |
| interrupted transaction | no success status emitted | reconcile from the last committed transaction/event |

## 9. Forbidden Patterns

- Do not expose M00 as a general remote API or physical daemon in W1/W2.
- Do not persist identity tags separately from the canonical AgentSeat model.
- Do not let UI, Bridge, or a Worker append unvalidated timeline records directly.

## 10. Verification Procedure

1. Start the approved local application runtime.
2. Create a valid seat through the Lead-owned creation boundary; expected: one canonical identity and an auditable creation result.
3. Request an allowed L1 action through M03; expected: one permission decision and ordered SessionEvents persisted across restart.
4. Request an L3 action; expected: no mutation before explicit human resolution and a supervision event is visible.
5. Submit an invalid/under-granted seat; expected: no mutation, typed denial, and no second store.

## 11. Open Questions

| Question | Owner | Required before |
|---|---|---|
| Exact AgentSeat fields and tag projection | Lead | W0.1 re-freeze |
| Event payload schemas and action-version policy | Lead | W0.1 re-freeze |
| Canonical implementation parity evidence | Lead | W1 opening |
| Physical persistence adapter and migration/recovery contract | Lead | W1 opening |

## 12. Change Log

| Date | Version | Summary |
|---|---|---|
| 2026-07-09 | draft v1.1 | Rewritten as a closed spine contract; removes daemon ambiguity. |
| 2026-10-09 | draft v1.1 | Recorded the host/Pi execution boundary and the process-local admission slice. |
| 2026-10-09 | draft v1.1 | Added the session-directory KernelSnapshot v1 file adapter. |
| 2026-10-09 | draft v1.1 | Admitted turns can run an in-process native effect after host admission. |
| 2026-10-09 | draft v1.1 | Snapshot serialization drops unproven cache and price zeros and strips credentials. |

## 13. Host And Pi Execution Boundary

Pi Agent Core sequences a default model turn. It does not own admission, L0-L3 permission, the durable timeline, stop/recovery, or native tool execution.

The retained Craft subprocess in `app/packages/shared/src/agent/pi-agent.ts` still uses `@earendil-works/pi-coding-agent` as the provider turn client. That client is the upstream chat backend. A connection probe that is not Anthropic-compatible falls through to one host mini-completion; that probe is one sequenced turn.

Fleet host admission for the frozen action table is the process-local loop in `app/packages/shared/src/protocol/turn-admission.ts`. It appends canonical `SessionEvent` kinds through a journal port. `MemoryTurnJournal` is a test and process-local stand-in. It is not a second session database.

`FileKernelSnapshotStore` writes `host-kernel-snapshot.json` in the existing session directory, beside `session.jsonl`, using the same write-to-temp-then-rename replace. It round-trips `KernelSnapshot` version 1 only. A different version throws `unsupported_snapshot_version` and leaves the previous file in place. `save`, `load`, and `HostTurnKernel.snapshot` pass through `sealHostRecord` before that JSON is written or returned. The gate removes credential-shaped keys and token strings, remaps raw Claude and ChatGPT/Pi usage, and omits cache or price numbers that were not observed. An explicit provider cache read of zero stays a confirmed miss. A price of zero stays confirmed only when a pricing reference is present. This file is the host execution projection of that session. It does not rewrite `session.jsonl` and it is not a new database. The broader M00 session adapter is still unresolved.

`NativeEffectRegistry` is the executor behind `HostTurnKernel.run` when the caller does not pass an explicit executor. It runs only after admission. `applyAtomicJsonEffect` uses the same atomic replace as `session.jsonl`. A stop before `commit()` leaves the file unwritten. A throw after `commit()` restores as `reconciling` and does not run the effect again. Pi Agent Core is not the permission authority. Approval remains a direct `approve()` call. There is no new approval UI.

| Slice | Status |
|---|---|
| Process-local admit / approve / run / stop / recover / usage confidence | `wired` |
| Session-directory KernelSnapshot v1 file, including usage and credential sealing | `wired` |
| In-process native effect after admission, including atomic file replace | `wired` |
| Electron approval UI and the rest of the M00 session adapter | `Locked` |
| Local `.fleet/zcode` apply | not in this checkout; see `patches/zcode/README.md` |

This note does not open W1 and does not change the module capability header above. Product surfaces stay `Locked` until the W0.1 re-freeze.
