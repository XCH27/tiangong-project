# grok-4.5-06 — P0–P2 Documentation Patch Plan

**Model:** Grok 4.5  
**Date:** 2026-07-09  
**Audience:** Lead (only writer of control-plane docs)  
**Constraint:** Owner asked not to implement product code yet; this is the recommended doc-only sequence.

---

## 0. Ground Rules for the Patch Series

1. One concern per PR/commit when possible.  
2. Do not expand scope into canvas/video implementation details.  
3. Prefer **deleting false precision** over adding new vision.  
4. After multi-model review, merge **intersection of P0** first.  
5. No worker implementation branches until Patch Series A completes.

---

## Series A — P0 (Blocking)

### A1. Naming Decision Ledger Entry

**Files:**

- `docs/DECISIONS-LEDGER.md` (new Dn)  
- `docs/PROJECT-DIRECTION.md` (replace Fleet-or-not)  
- touch list of path strings later in A7  

**Content:**

- Display name  
- Technical slug for paths/enums/packages  
- Explicit non-use of other slugs  

**Exit:** One technical slug documented.

---

### A2. Protocol Stubs Truth Pass

**Files:**

- `docs/contracts/protocol-stubs.md`  
- `docs/PARALLEL-AGENT-OPERATING-MODEL.md` (Bridge)  

**Content options (pick one):**

**Option Thin-Complete (recommended):**

Add minimal types:

- `AgentSeat`, `RuntimeLane`, `TeamRun`, `TaskRun`  
- Bridge DTOs  
- `SeatCreationError`  
- Note on relationship to Craft existing SessionEvent (extend vs alias)

**Option Honest-Defer:**

Table of deferred types with owner + wave; remove false “defined in stubs” claims.

**Also:** Mark `CanvasDocument` as `draft-for-W3`, not W0-critical.

**Exit:** No dangling type references from W0/W1 docs.

---

### A3. Action Contract Sync

**Files:**

- `docs/contracts/action-ids.md`  
- `app/packages/shared/src/protocol/internal-action.ts` (Lead-only)  

**Steps:**

1. Define W1 minimal frozen set (recommend: file.* needed, session.*, workspace.rename; canvas/aigc out of freeze or clearly later).  
2. Align versions.  
3. Move non-minimal IDs to “Under Discussion”.  
4. Add note that version bump rules apply.

**Exit:** `diff(docs_ids, code_ids) == empty` for frozen set.

---

### A4. Permission Unification

**Files:**

- `docs/contracts/protocol-stubs.md` or new `docs/contracts/permission-levels.md`  
- `docs/DECISIONS-LEDGER.md` amend D12 if needed  
- `docs/contracts/identity-tags-permission-matrix.md`  

**Content:**

- Single ladder L0–L3  
- Map to ActionPermissionLevel  
- Map destructive column  
- Replace identity tool free-text with InternalActionId patterns  

**Exit:** One ladder; matrix uses action ids.

---

### A5. Browser Policy Correction

**Files:**

- `docs/modules/06-browser-artifact-surface/SPEC.md`  
- `docs/contracts/action-ids.md` (under discussion table)  
- `docs/legacy/LEGACY-LESSONS.md` (superseded note only)  
- optionally `AGENTS.md` one clarifying sentence  

**Content:**

- External: read/annotate/evidence only  
- Remove click/type/eval from default candidate tools  
- Dev CDP separate  

**Exit:** Zero active recommendations for external DOM mutation.

---

### A6. Ownership Matrix Rewrite

**Files:**

- `docs/OWNERSHIP-MATRIX.md`  

**Content:**

Map to real packages:

| Module | Primary paths (illustrative) |
|---|---|
| M00 Lead | `server-core/src/sessions`, `shared/src/protocol`, `shared/src/sessions`, RPC handlers |
| M03 | `shared/src/protocol/internal-action.ts` (Lead for IDs), new executor under `server-core/src/services/` |
| M02 | electron terminal UI + server-core process services (to-create marked) |
| M04 | team-run service (to-create), session-mcp-server bridge |
| M05 | library/lease services (to-create) |
| M14 | `messaging-gateway`, `messaging-whatsapp-worker` |

**Exit:** Every path exists or is `to-create` under an existing package.

---

### A7. Namespace Sweep

**Files:** all active docs with `.fleet`, `fleet.*`, `@fleet`, `FLEET_CLOUD`, Fleet prose  

**Depends on:** A1  

**Exit:** grep clean for discarded slugs (except historical legacy).

---

### A8. Wave Map Honesty + M14 Fix + Packet Rights

**Files:**

- `docs/WAVE-MODULE-MAP.md`  
- `docs/START-HERE.md`  
- `docs/modules/README.md`  
- `docs/agent-packets/wave-1-platform-action.md`  
- `docs/PARALLEL-AGENT-OPERATING-MODEL.md` (if needed)  

**Content:**

- Phase statuses → not started / not complete unless true  
- M14 = messaging  
- W1 packet: remove rights to mint action IDs; remove `@fleet/*` invented packages; use real package names  
- Clarify BLK-001 vs skeleton  

**Exit:** Control plane tells one story.

---

### A9. Plugin Namespace Fix

**Files:**

- `docs/modules/12-capability-skill-plugin-system.md`  

**Exit:** Core IDs valid under rule.

---

### Series A Acceptance Checklist

- [ ] One technical namespace  
- [ ] W0 types complete or explicitly deferred  
- [ ] Action IDs synced  
- [ ] Permission ladder unique  
- [ ] Browser policy consistent  
- [ ] Ownership paths real  
- [ ] Wave status honest  
- [ ] M14 fixed  
- [ ] W1 packet safe  
- [ ] Plugin namespace valid  

**Only then open workers for W1 skeleton.**

---

## Series B — P1 (Before Executor / W2)

### B1. D3 + Phase narrative rewrite

`DECISIONS-LEDGER.md`, `PROJECT-DIRECTION.md` phase table.

### B2. M00 + M03 closed-loop upgrade

Follow `modules/README.md` template; real verify steps; real bun commands.

### B3. M04 thin MVP

Strip batch/M11 hard deps; journal optional.

### B4. Manager Agent section

New short contract or M00 section: identity + whitelist.

### B5. Cross-module interface registry

New `docs/contracts/module-interfaces.md` (Lead-owned).

### B6. 源码参考 README retarget

Policy links only; danger labels.

### B7. SessionEvent naming decision

Extend Craft vs new TimelineEvent — ledger entry.

### B8. Captain naming

Runtime role rename proposal.

---

## Series C — P2 (Quality)

1. Split UX drafts from contracts in M06/M07/M09  
2. Research banner on ARCHITECTURAL-COMPARISON  
3. English consistency  
4. Relative links  
5. Code reality sections per module  
6. Contract drift script under `scripts/`  
7. THIRD_PARTY attribution template  

---

## Parallelism During Doc Patches

| Track | Owner | Parallel? |
|---|---|---|
| Series A | Lead only | Sequential A1→A9 preferred |
| Multi-model reviews | Multiple models | Parallel (this package class) |
| Workers product code | — | **Blocked** until Series A exit |

---

## Estimated Effort (order of magnitude)

| Series | Effort |
|---|---|
| A | 0.5–2 Lead days if focused |
| B | 1–3 Lead days |
| C | ongoing |

This is far cheaper than debugging multi-worker forks later.

---

## What Not to Schedule Before Series A

- Implementing TeamRun  
- Copying OpenPencil/OpenCut  
- Freezing more action IDs  
- Opening W2/W3 in WAVE map  
- Building plugin marketplace UI  
