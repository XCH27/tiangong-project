# Backend Conflict Audit (Fleet stubs vs target spine)

> **Status:** living audit — update when ports land or freezes change  
> **Updated:** 2026-07-10  
> **Sources inspected:** `app/packages/shared/src/protocol/*` (current 0.10.5 tree),  
> clean v0.11.0 protocol set, W0.1 freezes, D38–D50, ADR-0033/0034/0035  
> **Method:** static review of types + export surface (not runtime fuzzing)

## 1. Summary

Current Fleet “backend” in-tree is mostly **protocol stubs**, not a full executor.  
Several shapes **conflict** with the composable-spine freezes and must **not** be ported as-is.

| Severity | Count (this pass) | Action |
|---|---|---|
| **Blocker** (must rewrite before adapt) | 4 | Use staging-protocol / freeze VNext |
| **Major** (port only after reconcile) | 3 | Merge plan in adapt audit |
| **Minor** / hygiene | 2 | Clean during port |
| **OK to adapt** (with freeze alignment) | 3 | ActorRef, seats (with projection rules), lease *concept* |

## 2. Inventory: what exists today

| Artifact | Kind | External importers (2026-07-10 rg) | Used by runtime? |
|---|---|---|---|
| `actor.ts` | types | **none outside protocol/** | **Orphan stub** |
| `agent-session.ts` | types | **none** | **Orphan stub** |
| `session-event.ts` (`AuditSessionEvent`) | types | **none** | **Orphan stub** |
| `internal-action.ts` | types+zod | **none**; **no action-executor/** | **Orphan stub** + B1–B3 |
| `lease.ts` | types | **none** | **Orphan stub** + duplicate |
| `canvas.ts` fixed nodes | types | **none** | **Orphan + drop** (B4) |
| `channels/dto/events/routing` | upstream-derived | live Craft paths | merge carefully |
| `messaging-gateway` | package | electron + server-core | real; defer M15 |
| protocol tests for Fleet stubs | — | **no tests found** for seats/lease/actions/canvas | no safety net |

See also `DEAD-CODE-SIDE-EFFECTS.md` and `MODULE-REACTION-MAP.md`.

## 3. Blocker conflicts (do not port as-is)

### B1 — ActionInvocation too narrow for spine

**Evidence:** `internal-action.ts` `callerKind: z.enum(['agent', 'human_ui'])` only; no `idempotencyKey`, `correlationId`, `baseRevision`, workflow fields.

**Conflicts with:** D40 (workflow caller), freeze F-01 / `action-invocation-vnext.ts`, M17.

**Resolution:** Port **staging** `ActionInvocationVNext`; treat v1.2 invocation as historical.  
**Ledger:** adapt only after rewrite → target staging module.

### B2 — Dual `WorkspaceFileLease`

**Evidence:** identical interface in `lease.ts` and again inside `internal-action.ts`.

**Conflicts with:** C3 single-definition rule; future import ambiguity.

**Resolution:** single module `lease.ts` (or staging); delete duplicate from internal-action on port.  
**Ledger:** adapt lease once.

### B3 — Dual session event models

**Evidence:** `AuditSessionEvent` in `session-event.ts` vs `ActionSessionEvent` union in `internal-action.ts`.

**Conflicts with:** M00 “one ordered SessionEvent stream”; risk of two event dialects.

**Resolution:** one canonical SessionEvent family (kinds + typed payloads per freeze); action pipeline events become **payloads or kinds**, not a parallel root type.  
**Ledger:** adapt after unify design in freeze record.

### B4 — Fixed canvas node product model

**Evidence:** `canvas.ts` `NodeType` closed union (`text_frame`, `image_asset`, … `aigc_placeholder`) and `CanvasDocument` as node map with `seq`.

**Conflicts with:** ADR-0033 / D39 / D43 (no fixed node-union product; spatial document + native owners; OpenPencil not universal host).  
Also uses `seq` in a way that invites timeline-as-conflict-algorithm (FORBIDDEN).

**Resolution:** **drop** as product model. Spatial shapes live in freeze `SpatialDocument` / M07 after spike. Do not port `canvas.ts` into clean base as authority.  
**Ledger:** **drop** (or defer types only under M07 experimental namespace — default **drop**).

## 4. Major conflicts (reconcile before adapt)

### M1 — Permission enum naming vs orthogonal policy

**Evidence:** `ActionPermissionLevel` = `L0_read_only | L1_reversible | L2_irreversible | L3_destructive` with undo flags separate but incomplete vs freeze `OperationPolicy` (risk/approval/undo/cancel/retry/evidence orthogonal).

**Conflicts with:** D12/D35 freeze orthogonal policy; action-ids W0.1 reclass notice.

**Resolution:** keep L-tiers as **riskTier** only; map undo/approval from freeze policy fields when porting registry.

### M2 — AgentSeat vs identity matrix

**Evidence:** `AgentSeat` embeds `role`, `domainTags`, `trustLevel` directly.

**Conflicts with:** identity matrix “tags are projection of structured seat”; risk of dual mutation paths.

**Resolution:** seat remains structured; tags derived — document projection function on port; no separate tag store.

### M3 — channels/dto/events drift vs clean v0.11

**Evidence:** files exist on both trees but **differ** (diff -q).

**Conflicts with:** blind copy from Fleet 0.10.5 over clean base would lose v0.11 session/project/task protocol.

**Resolution:** **three-way merge**: clean v0.11 base file + Fleet delta review; never wholesale replace from current app.

## 5. Minor / hygiene

| Issue | Detail | Fix on port |
|---|---|---|
| H1 | `WorkspaceFileLease.heldBy: string` not `ActorRef` | Prefer ActorRef or documented id convention |
| H2 | Action ids include canvas/AIGC before surfaces ready | Keep ids recorded; implementation gated by wave; reclass policy before enable |

## 6. Messaging-gateway package

| Check | Finding |
|---|---|
| Value | Real backend for later M15 |
| Conflict risk | Must not become second permission/session authority |
| UI | Old settings chrome **drop** (D50) |
| Port timing | **defer** to M15; when porting, audit C1/C2 explicitly |

## 7. Pass/fail for known ML candidates

| Candidate | Verdict | Condition |
|---|---|---|
| actor.ts | **PASS adapt** | Keep simple; align names with freeze ActorRef |
| agent-session.ts | **PASS adapt with M2** | Document tag projection |
| lease.ts | **PASS adapt** | Delete duplicate in internal-action |
| internal-action.ts (ids + registry shape) | **REWRITE then adapt** | Invocation → VNext; drop nested lease; unify events |
| session-event.ts | **REWRITE then adapt** | Unify with action events |
| canvas.ts | **FAIL drop** | Conflicts ADR-0033 |
| messaging-gateway | **defer** | M15 + permission audit |
| staging-protocol/* | **PASS as target shapes** | Not live until clean base port |

## 8. Required process when adding new backend candidates

1. Run value filter (`BACKEND-VALUE-PORT.md`).  
2. Run this audit’s C1–C10 via `ADAPT-RECORD-TEMPLATE.md`.  
3. If similar to B1–B4, cite this file section and do not port as-is.  
4. Update this file’s tables when a blocker is closed (date + commit).

## 9. Module reactions (summary)

Full tables: `MODULE-REACTION-MAP.md`.

| Port family | Highest-react modules | Do not land without |
|---|---|---|
| Invocation/actions | M00, M03, M12, M17, all writers | VNext caller + idempotency |
| Leases | M05, M03, file writers | Single type definition |
| SessionEvent | M00 + all emitters | One event family |
| ArtifactRef | M05 + W3A/W3B fan-out | M05 authority |
| ExternalJob/M11A | M08, M11A, M17, M00 | No second cost/job store |
| canvas.ts fixed nodes | M07/M16 | **Do not port** |
| messaging-gateway | M00, M15, SessionManager | Permission non-bypass |

## 10. Closed blockers log

| ID | Closed | Commit / note |
|---|---|---|
| — | — | none closed in code yet; staging-protocol is the intended rewrite target |
