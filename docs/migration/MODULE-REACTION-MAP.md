# Module Reaction Map (backend ports)

> **Purpose:** Before adapting any backend unit, name **which modules react** (read, write,  
> block, or break) if this code lands. Prevents silent cross-module damage.  
> **Updated:** 2026-07-10  
> **Related:** ENGINEERING-STANDARDS, BACKEND-CONFLICT-AUDIT, PERSISTENCE-AUTHORITY-MAP  

## 1. How to read this map

| Column | Meaning |
|---|---|
| **Producer** | Module that owns the behaviour/types |
| **Reacts** | Modules that must change, subscribe, or validate |
| **Reaction type** | `consume` types · `enforce` permission · `persist` · `project` UI · `conflict` risk |
| **Wave** | Earliest wave the reaction becomes real |

If a port has **no** producer/react list → **defer** until mapped.

## 2. Spine reaction matrix (target architecture)

```text
                    M00 identity/permission/timeline
                              ▲
                              │ enforce + SessionEvent
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
      M03 action ────────► M05 files/ArtifactRef  M04 TeamRun/Bridge
        │                     │                     │
        │                     ├──── M08 ExternalJob (+ M11A cost)
        │                     ├──── M06 browser evidence
        │                     ├──── M07 spatial projection
        │                     ├──── M17 workflow correlation
        │                     └──── M09/M18/M19 native docs
        │
        └── M12 capability manifests ──► generate tools/UI/workflow ports
```

## 3. Per-candidate reaction tables

### 3.1 ActorRef / identity (`actor.ts`)

| Reacts | Type | Wave | Note |
|---|---|---|---|
| M00 | consume + persist | W1 | Seat/user/system actors |
| M03 | consume | W1 | invocation context |
| M04 | consume | W2 | lane/seat binding |
| M05 | consume | W2 | lease holder |
| M10 | consume | W4 | memory partition keys |
| M16 | project | W2 | display names only |

**Bad reaction if ported wrong:** dual user-id schemes → permission holes.

### 3.2 AgentSeat / RuntimeLane / TeamRun (`agent-session.ts`)

| Reacts | Type | Wave | Note |
|---|---|---|---|
| M00 | enforce identity | W1 | seat creation/validation |
| M04 | own run coordination | W2 | TeamRun authority |
| M02 | consume lane | W2 | terminal/CLI host |
| M03 | consume in context | W1–W2 | who invoked |
| M12 | loadout by seat | W2–W4 | skills scoped to seat |
| M11A | usage attribution | W2 | cost by seat/lane |

**Bad reaction:** seat tags mutated separately from seat → identity matrix violation.

### 3.3 Internal Action registry / invocation

| Reacts | Type | Wave | Note |
|---|---|---|---|
| M00 | enforce L0–L3 | W1 | every mutate |
| M03 | own executor | W1 | single dispatch |
| **All writable modules** | register actions | W1+ | M02/M05/M06/M07/M08/… |
| M12 | derive tools | W1–W2 | same actionId |
| M17 | callerKind workflow | W3A | **requires VNext** |
| M16 | human controls | W2 | buttons → actions |

**Bad reaction if v1.2 as-is:** M17/M08 cannot call honestly; hidden UI-only paths reappear.

### 3.4 WorkspaceFileLease

| Reacts | Type | Wave | Note |
|---|---|---|---|
| M05 | own leases | W2 | grant/expire |
| M00 | persist correlation | W1–W2 | restart |
| M03 | block on conflict | W1–W2 | ActionBlocked |
| M02/M04 | lane file writes | W2 | report via Bridge |
| M18/M09 native editors | consume | W3B | file locks |

**Bad reaction:** dual lease types → some writers ignore locks.

### 3.5 SessionEvent / audit timeline

| Reacts | Type | Wave | Note |
|---|---|---|---|
| M00 | own ordered stream | W1 | seq per session |
| M03 | emit action events | W1 | |
| M04 | team/task correlation | W2 | teamRunId/taskRunId |
| M08 | job lifecycle events | W2–W3A | |
| M10/M11 | evidence for review/cost | W4/W2 | |
| UI timeline | project only | W1+ | Craft shell |

**Bad reaction:** ActionSessionEvent parallel root → two timelines.

### 3.6 ArtifactRef

| Reacts | Type | Wave | Note |
|---|---|---|---|
| M05 | own metadata | W2 | resolve storageRef |
| M08 | outputs | W2–W3A | |
| M06 | evidence bundles | W3A | |
| M07 | cards/bindings | W3A | projection |
| M17 | bindings | W3A | |
| M09/M18/M19 | inputs/outputs | W3B | fan-out |

**Bad reaction:** treating ArtifactRef as blob store → third asset DB.

### 3.7 ExternalJob + M11A

| Reacts | Type | Wave | Note |
|---|---|---|---|
| M08 | own jobs | W2 | |
| M11A | own usage/cost rows | W2 | |
| M00 | correlation/persist | W2 | |
| M03 | submit/cancel actions | W2 | |
| M17 | nodeRun → job | W3A | |
| M07/M16 | project status | W3A/W2 | display only |
| M05 | commit outputs | W2–W3A | |

**Bad reaction:** jobs.json second ledger; cost without M11A; UI owns job state.

### 3.8 canvas.ts (fixed nodes) — **do not port**

| Reacts if wrongly ported | Type | Damage |
|---|---|---|
| M07 | conflict | Fights SpatialDocument / ADR-0033 |
| M03 | pollutes | canvas.* actions before host decision |
| M16 | wrong host | second surface model |
| M08/M09/M18 | wrong | nodes pretend to own media/web docs |

### 3.9 messaging-gateway

| Reacts | Type | Wave | Note |
|---|---|---|---|
| M00 | must enforce permission | W5 | no bypass |
| M15 | own gateway | W5 | |
| M13 | settings IA | W5 | new UI, not old chrome |
| SessionManager | consume | existing Craft | pair carefully on clean base |

**Bad reaction:** gateway becomes second session/permission plane.

## 4. Blast-radius cheat sheet

| If you change… | Highest blast radius modules |
|---|---|
| ActionInvocation shape | **All** action producers + M17 + M12 tools |
| SessionEvent shape | M00 timeline + every emitter |
| Lease shape | M05 + any file writer |
| ArtifactRef shape | Entire creative fan-out W3A/W3B |
| AgentSeat | M00/M04/M12 loadouts |
| ExternalJob | M08/M11A/M17/M07 projections |

## 5. Required in every adapt audit

```text
modules_reacting:
  - id: M0x
    reaction: consume|enforce|persist|project|conflict
    wave: W#
    note: ...
side_effects_if_wrong: <one paragraph>
```
