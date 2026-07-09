# grok-4.5-03 — Modification Recommendations

**Model:** Grok 4.5  
**Date:** 2026-07-09  
**Nature:** Recommendations only — do not treat this file as applied patches.

Each item: **What / Why / Where / How / Acceptance**.

---

## Legend

| Priority | Meaning |
|---|---|
| **P0** | Block parallel implementation if unfixed |
| **P1** | Fix before W1 executor / W2 modules |
| **P2** | Fix before W3 surfaces or during polish |
| **Type** | `doc` · `contract` · `process` · `code-later` · `decision` |

---

## P0 Recommendations

### P0-01 — Freeze a single product codename namespace

| | |
|---|---|
| **Type** | decision + doc |
| **What** | Choose one codename for disk dirs, plugin reserved prefixes, cost enums, package scope |
| **Why** | Fleet / Craft Agents (二开补强) / `.fleet` / `fleet.*` / `@fleet/*` will fork protocols |
| **Where** | `PROJECT-DIRECTION.md`, `DECISIONS-LEDGER.md` (new entry), M07/M08/M09 paths, M11 cost enum, M12 namespace, W1 packet |
| **How** | Pick e.g. brand display “Craft Agents (二开补强)”, technical slug `craft` or `fleet` — but only one technical slug. Replace all path prefixes consistently |
| **Acceptance** | Grep active docs: one technical slug for paths/enums; display name may differ |

### P0-02 — Declare true W0 contract scope

| | |
|---|---|
| **Type** | contract |
| **What** | Either complete missing multi-agent stubs **or** formally mark them `STATUS: deferred-to-W1` and stop claiming full freeze |
| **Why** | Workers depend on types that do not exist |
| **Where** | `docs/contracts/protocol-stubs.md`, `PARALLEL-AGENT-OPERATING-MODEL.md` Bridge section, identity matrix §7 paths |
| **How** | Add stubs for `AgentSeat`, `RuntimeLane`, `TeamRun`, `RunReport`, `RuntimeLaneEvent`, `TeamContextSnapshot`, `LaneOutcome`, `SeatCreationError` **or** explicit deferral table |
| **Acceptance** | Every type referenced by W1 packet exists in stubs or is listed deferred with owner |

### P0-03 — Sync action-ids ↔ internal-action.ts

| | |
|---|---|
| **Type** | contract + code-later (Lead) |
| **What** | Single source of truth for action IDs and CONTRACT_VERSION |
| **Why** | Docs v1.2.0 vs code 1.0.0; different ID sets (`file.move`, canvas suite, `aigc.job_submit` missing in code) |
| **Where** | `docs/contracts/action-ids.md`, `app/packages/shared/src/protocol/internal-action.ts` |
| **How** | Lead chooses: (A) shrink docs table to code set, or (B) promote code to match docs for W1-needed IDs only. Prefer **minimal W1 set** frozen, rest “under discussion” |
| **Acceptance** | Version strings match; set equality checkable by script |

### P0-04 — Unify permission model (one mapping table)

| | |
|---|---|
| **Type** | contract |
| **What** | One table: Decision L0–L3 ↔ ActionPermissionLevel ↔ destructiveHint ↔ Supervision required |
| **Why** | stubs lack L3; code has L3_destructive; D12 has L0–L3; action table uses destructive bool |
| **Where** | New section in `protocol-stubs.md` or `identity-tags-permission-matrix.md` + D12 note |
| **How** | Propose: L0 read; L1 reversible+undo; L2 irreversible/needs allow; L3 always supervision. Map `destructive: true` → at least L2/L3 |
| **Acceptance** | No doc asserts a third incompatible ladder |

### P0-05 — Map identity tools → InternalActionId

| | |
|---|---|
| **Type** | contract |
| **What** | Identity matrix must not invent parallel tool IDs |
| **Why** | `tool.read_file` / `file.write.scoped` vs `file.update` causes dual registries |
| **Where** | `identity-tags-permission-matrix.md` |
| **How** | Replace tool lists with patterns over InternalActionId or explicit mapping table |
| **Acceptance** | Every matrix tool maps 1:1 or 1:pattern to action-ids |

### P0-06 — Fix browser external-site policy vs actions

| | |
|---|---|
| **Type** | doc + contract |
| **What** | Remove or reclassify `browser.click` / `type` / `eval` for external pages |
| **Why** | Violates AGENTS + PROJECT-DIRECTION + M06 Non-Goals |
| **Where** | `modules/06-browser-artifact-surface/SPEC.md`, action-ids under discussion, LEGACY-LESSONS browser section note |
| **How** | Default agent tools: navigate (optional), screenshot, select, annotate, handoff, settings read. Click/type/eval → `forbidden external` or `dev-only CDP` or future `owned-surface` ADR |
| **Acceptance** | No active doc recommends external DOM mutation as normal path |

### P0-07 — Rewrite OWNERSHIP-MATRIX to real packages

| | |
|---|---|
| **Type** | process + doc |
| **What** | Map modules to existing `app/packages/*` and `app/apps/*` paths |
| **Why** | Current matrix invents `shared/src/timeline`, `renderer/shell`, etc. |
| **Where** | `docs/OWNERSHIP-MATRIX.md` |
| **How** | Spine → `server-core/sessions`, `shared/protocol`, `shared/sessions`, `session-tools-core`; actions → protocol + new services under server-core; surfaces → electron renderer paths that actually exist after Lead placement |
| **Acceptance** | Every owned path either exists or is marked `to-create` with parent package |

### P0-08 — Honest WAVE / Phase status

| | |
|---|---|
| **Type** | process + doc |
| **What** | Phase table must not say In Progress when modules not started |
| **Why** | Misleading board for multi-agent |
| **Where** | `WAVE-MODULE-MAP.md`, `START-HERE.md`, `BOARD-SYNC.md` if cards exist |
| **How** | Align Phase 0–6 status with module statuses; clarify BLK-001 vs W1 skeleton allowance |
| **Acceptance** | No contradictory status symbols across control plane |

### P0-09 — Fix M14 identity

| | |
|---|---|
| **Type** | doc |
| **What** | Either M14 = messaging and onboarding gets new id, or rename consistently |
| **Why** | WAVE slug onboarding vs file messaging vs ownership onboarding path |
| **Where** | WAVE-MODULE-MAP, OWNERSHIP, modules README, `14-messaging.md` |
| **How** | Recommend keep M14 messaging (code exists); add M15 onboarding later or fold into M13 |
| **Acceptance** | One name, one path, one mission |

### P0-10 — Fix plugin namespace contract

| | |
|---|---|
| **Type** | doc |
| **What** | Stop requiring exactly two dots and `fleet.*` for core |
| **Why** | Core IDs are `domain.verb`; rule makes all core illegal |
| **Where** | `modules/12-capability-skill-plugin-system.md` §17 |
| **How** | Core: `<domain>.<verb>[.<qual>]`; Plugin: `plugin.<id>.<domain>.<verb>`; reject collisions |
| **Acceptance** | Rule validates current frozen core IDs |

### P0-11 — W1 packet rights vs frozen contracts

| | |
|---|---|
| **Type** | process |
| **What** | Workers must not edit frozen `internal-action.ts` action IDs; Lead owns promotions |
| **Why** | Packet grants edit to frozen protocol file |
| **Where** | `agent-packets/wave-1-platform-action.md`, PARALLEL model |
| **How** | Skeleton may add non-id implementation files; ID changes only via Lead PR |
| **Acceptance** | Packet forbidden list includes action id edits |

### P0-12 — Remove false Bridge type location claims

| | |
|---|---|
| **Type** | contract |
| **What** | Put Bridge DTOs in stubs or stop saying they are there |
| **Why** | PARALLEL model claims types in protocol-stubs; stubs lack them |
| **Where** | PARALLEL model §Bridge, protocol-stubs |
| **Acceptance** | Link resolves to real type block |

---

## P1 Recommendations

### P1-01 — Reconcile D3 with wave order

Rewrite D3 development effect: “first *user-visible execution* loop after spine is terminal/CLI; first *shared write* loop is action registry.”

### P1-02 — Thin TeamRun MVP section in M04

Remove hard dependency on M11 BatchJobExecutor from W2 text; batch becomes optional later callback.

### P1-03 — Demote CanvasDocument from W0 freeze tone

Mark as draft until OpenPencil adapter spike; keep only envelope fields if needed.

### P1-04 — Manager Agent model

Add Actor or Seat rule: global low-context agent; action whitelist; never bypass L2/L3.

### P1-05 — Rewrite M00/M03 to closed-loop template

Payload shapes, errors, verification steps, real file paths, minimal action set for Demo-1.

### P1-06 — Cross-module interface registry

One table: interface name, provider module, consumer modules, earliest wave, stub vs full.

### P1-07 — 源码参考 README fix

Replace pointers to missing `docs/26-…` / `docs/27-…` with `REFERENCE-PROJECT-POLICY.md` + attribution process.

### P1-08 — Captain / Lead / role:lead naming

Pick runtime title (`captain` / `orchestrator`) distinct from repository Lead.

### P1-09 — Cost source enum naming

Align `FLEET_CLOUD` with codename decision; avoid implying product cloud business if D26 holds.

### P1-10 — LEGACY-LESSONS superseded banners

Where legacy encourages external click automation, mark superseded by D10/D23/browser policy.

---

## P2 Recommendations

### P2-01 — Split contracts vs UX drafts for M06/M07/M09

Keyboard maps, minimaps, full node catalogs → `UX-DRAFT` sections.

### P2-02 — ARCHITECTURAL-COMPARISON quarantine

Header: research only; not binding; versions not verified for planning.

### P2-03 — English-only active docs

Move Chinese narrative in PROJECT-DIRECTION §13 into English or archive.

### P2-04 — Relative links only

No `file:///Users/...` in active docs.

### P2-05 — Per-module “Code reality (date)” section

Exists / missing / invent-not-allowed.

### P2-06 — Onboarding module

Empty states / first-run as separate module after messaging settled.

### P2-07 — Script: contract drift check

CI or `scripts/` check: action-ids table == InternalActionId enum; version equality.

### P2-08 — Attribution skeleton

Before any green-light copy: NOTICE/THIRD_PARTY template path decided.

---

## Explicitly Do Not Modify (yet)

| Item | Reason |
|---|---|
| Mass rewrite of all module prose | Wait multi-model intersection |
| Implement TeamRun code | Contracts incomplete |
| Copy OpenPencil/OpenCut into app | Needs P0 + adapter design |
| Delete messaging packages | D28 retain; audit later |
| Open W3 gates on paper | Would amplify false status |

---

## Suggested Lead Commit Series (after owner approval)

1. `docs: P0 namespace + naming decision`  
2. `docs: P0 protocol stubs + bridge types (or deferrals)`  
3. `docs+shared: P0 action id sync`  
4. `docs: P0 permission + identity mapping`  
5. `docs: P0 browser policy + M06 action table`  
6. `docs: P0 ownership matrix real paths`  
7. `docs: P0 wave status + M14 fix + packet rights`  
8. `docs: P1 D3/M00/M03/M04 thin MVP`  

Only then: worker W1 skeleton branches.
