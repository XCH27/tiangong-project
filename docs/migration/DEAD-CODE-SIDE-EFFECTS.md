# Dead Code, Garbage Tests, and Side-Effect Audit

> **Updated:** 2026-07-10  
> **Method:** static import graph under `app/packages` + `app/apps` (excluding `node_modules`  
> and files under `protocol/` itself). Not a full runtime coverage proof.  
> **Policy:** Dead stubs may still be **value candidates** if they match the freeze, but must be  
> labeled **orphaned** and either wired through M00/M03 or **not** presented as usable backend.

## 1. Definitions

| Term | Meaning |
|---|---|
| **Dead surface** | Exported types/modules with **no importers** outside their package folder |
| **Orphan stub** | Types exist for a future module but no executor/host implements them |
| **Garbage test** | Test that only freezes a wrong model, always skips, or asserts display-only lies |
| **Bad side effect** | Port would enable dual authority, silent UI path, or un-permissioned writes |
| **Toxic dependency** | Requires old UI, stealth stack, or unapproved source |

## 2. Findings — Fleet protocol additions (current `app/`)

### 2.1 Dead / orphan surfaces (no external imports found)

| Module file | External importers | Classification |
|---|---|---|
| `protocol/actor.ts` | **none** | Orphan stub — still **adapt candidate** (needed by spine) |
| `protocol/agent-session.ts` | **none** | Orphan stub — adapt with M2 seat rules |
| `protocol/session-event.ts` | **none** | Orphan stub — rewrite then adapt (B3) |
| `protocol/internal-action.ts` | **none** | Orphan stub — **rewrite** (B1/B2/B3); no `action-executor/` tree |
| `protocol/lease.ts` | **none** | Orphan stub — adapt single definition |
| `protocol/canvas.ts` | **none** | Orphan + **toxic model** — **drop** (B4) |

**Interpretation:** These files are not “battle-tested backend.” They are **design stubs**.  
Porting them **as if production-proven** is an engineering error. Port **shapes after rewrite**,  
then implement executors in the correct wave.

### 2.2 Duplicate / dead-duplicate code

| Issue | Evidence | Side effect if ported |
|---|---|---|
| Dual `WorkspaceFileLease` | `lease.ts` + `internal-action.ts` | Writers import different types; leases ignored |
| Dual event roots | `AuditSessionEvent` vs `ActionSessionEvent` | Split timelines; incomplete audit |

Treat duplicates as **dead-by-ambiguity**: delete one path on port.

### 2.3 Tests

| Location | Finding |
|---|---|
| `protocol/__tests__/routing.test.ts` | Only protocol test folder entry observed for routing — **not** covering Fleet stubs |
| Tests importing AgentSeat / Lease / InternalActionId / CanvasDocument under packages | **none found** in this pass |
| Conclusion | **No garbage tests locking the wrong canvas model** found under packages; also **no safety net** — ports need new tests |

**Garbage-test rule for future:** reject tests that:

- snapshot fixed nine-type canvas as product truth;  
- mark L3 actions as auto-approved;  
- assert “usable” without permission/timeline;  
- import fleet-old renderer paths.

### 2.4 messaging-gateway

| Finding | Detail |
|---|---|
| Not dead | Consumed by electron main, server-core SessionManager, workers |
| Side-effect risk | Can become second permission/session plane if ported without M00 |
| Tests | package has own tests — re-audit under M15, not W1 |

## 3. Side-effect classes to always check

| ID | Side effect | Fail port if |
|---|---|---|
| S1 | Dual authority | Second session/permission/job/memory store |
| S2 | Unpermissioned write | Mutate without M03/M00 |
| S3 | Fake completion | Types without executor marked usable |
| S4 | Timeline gap | Mutations without SessionEvent |
| S5 | Restart amnesia | No reconciling/idempotency story |
| S6 | Cost lie | Paid job without M11A fields |
| S7 | UI trap | Requires old Fleet UI (D50) |
| S8 | Import poison | Pulls stealth/anti-detect or unlicensed code |
| S9 | Test lock-in | Tests encode forbidden architecture |
| S10 | Version skew | Overwrites clean v0.11 channels/dto blindly |

## 4. Clean-up actions before/while porting

| Action | When |
|---|---|
| Do not copy dead stubs into clean base **without** freeze alignment | always |
| Prefer `staging-protocol/*` over orphan `internal-action` invocation | W0.1→W1 |
| Delete duplicate lease/event definitions on first port PR | W1 |
| Drop `canvas.ts` product model | W0.1 ledger already **drop** |
| Add unit tests for VNext invocation + lease single type | with first executor |
| Never claim capability `usable` for type-only ports | WAVE/READINESS |

## 5. Commands for Agents (re-run on each candidate)

```bash
# External importers of a protocol module (example: lease)
rg -l "protocol/lease|from '.*/lease'" app/packages app/apps \
  --glob '!**/node_modules/**' --glob '!**/protocol/**'

# Tests referencing a symbol
rg -l 'WorkspaceFileLease|ActionInvocation|CanvasDocument' app \
  --glob '**/*test*' --glob '!**/node_modules/**'

# Toxic imports
rg -n 'fleet-old|stealth|antidetect|puppeteer-extra' app \
  --glob '!**/node_modules/**' | head
```

Record command output under `docs/migration/evidence/` when classification changes.
