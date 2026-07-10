# Migration Engineering Standards

> **Authority:** Lead binding for all migration work (L00 and later ports)  
> **Updated:** 2026-07-10  
> **Audience:** Lead + every Agent that touches migration, protocol, or base replace  
> **Goals:** readable layout, maintainable process, conflict-safe ports, full traceability  

## 1. Principles

1. **Clean Craft v0.11 is the base** — Fleet behaviour is **adapted onto** it, not merged as a second tree.  
2. **No old UI** (D50) — only backend-value candidates; new surfaces on Craft + M16.  
3. **No second authorities** — every port must name its single owner module and store (PERSISTENCE / FORBIDDEN).  
4. **Text freeze before live code** — port from freeze + staging-protocol, not ad-hoc invention.  
5. **Evidence over memory** — every adapt/drop/defer has a ledger row + audit record path.  
6. **Fail closed** — if conflict review fails, classification stays **defer** or **drop**, never silent merge.

## 2. Folder layout (canonical)

```text
docs/migration/
  README.md                      # index for agents
  ENGINEERING-STANDARDS.md       # this file
  BACKEND-VALUE-PORT.md          # D50 value filter
  BACKEND-CONFLICT-AUDIT.md      # living conflict findings vs spine
  v0.11-MIGRATION-LEDGER.md      # retain/adapt/drop/defer rows
  v0.11-BASELINE-VALIDATION.md   # clean-tag install/typecheck evidence
  v0.11-PORT-CHECKLIST.md        # port sequence + gates
  ADAPT-RECORD-TEMPLATE.md       # copy per adapt unit
  audits/                        # filled adapt records (one file per unit)
    YYYY-MM-DD-<slug>.md
  evidence/                      # raw logs, command outputs (immutable once committed)
  staging-protocol/              # Lead-only TS freezes (not live app imports)
  scripts/                       # re-runnable validation helpers
```

**Rules:**

| Path | Who writes | Rule |
|---|---|---|
| `evidence/*` | Lead / CI | Append-only; never rewrite history of a committed log (add a new dated file) |
| `audits/*` | Lead or assigned auditor | One adapt unit per file; link ledger row id |
| `staging-protocol/*` | Lead only | Must match freeze record; smoke-build before merge |
| `app/**` protocol | Lead only | Workers never edit frozen protocol |
| live `app/` UI from fleet-old | nobody | D50 drop |

## 3. Naming conventions

| Kind | Pattern | Example |
|---|---|---|
| Ledger row id | `ML-###` | `ML-014` |
| Audit file | `YYYY-MM-DD-ml-###-<slug>.md` | `2026-07-10-ml-003-internal-action.md` |
| Evidence log | `<topic>-YYYY-MM-DD.log` | `v0.11-baseline-validation-2026-07-10.log` |
| Staging module | `kebab-case.ts` | `action-invocation-vnext.ts` |
| Contract version const | `w0.1-<area>-<n>` | `w0.1-m11a-1` |
| Freeze id | `w0.1-doc-freeze-YYYY-MM-DD` | `w0.1-doc-freeze-2026-07-09` |
| Git branch (migration) | `migration/v0.11-<purpose>` | `migration/v0.11-clean-base` |
| Commit subject | `docs(L00):` / `feat(M0x):` / `fix(protocol):` | see repo style |

## 4. Lifecycle of one backend adapt unit

```text
1. Propose     → ledger row (ML-###) classification=adapt candidate
2. Value gate  → BACKEND-VALUE-PORT.md (must pass §2)
3. Conflict    → fill ADAPT-RECORD-TEMPLATE conflict section
                 must pass BACKEND-CONFLICT-AUDIT checklist
4. Freeze      → types in staging-protocol or freeze record citation
5. Port        → clean base branch only; PR lists ML-### + audit path
6. Verify      → typecheck + real behaviour if surface-affecting
7. Trace       → WAVE/READINESS unchanged unless Lead promotes maturity
```

**Stop rules:** any failed conflict check → set ledger to **defer** or **drop** with reason; open BLK if needed.

## 5. Conflict review checklist (mandatory before adapt)

Copy into each audit file. All must be **PASS** or **N/A with reason**.

| # | Check | Fail if |
|---|---|---|
| C1 | Single state authority named | Second session/permission/timeline/job/memory store |
| C2 | Aligns with M00/M03 path | UI-only or agent-only executor |
| C3 | No dual type definitions | Same type name in two modules with different shapes |
| C4 | Compatible with freeze record | v1.2-only shape blocks workflow/idempotency when freeze requires VNext |
| C5 | Compatible with ADR-0034/0035 | New SQLite control plane; wrong namespace keys |
| C6 | No fixed canvas node product model | Fixed nine-type canvas as product core (ADR-0033) |
| C7 | No old UI dependency | Port requires fleet-old renderer/CSS |
| C8 | Permission/policy orthogonal | Risk conflated into one enum without approval/undo/cancel fields |
| C9 | Restart/reconciling story | Completed claims without durable correlation |
| C10 | License/green-light | Unapproved source copy |

## 6. Traceability matrix (every merge)

Every PR that ports migration code must include:

```text
ml_row: ML-###
audit: docs/migration/audits/<file>.md
freeze_id: w0.1-doc-freeze-...
source_path: ...
source_revision: ...
target_path: ...
classification: adapt
conflict_review: PASS|FAIL
verification: <commands + results>
```

## 7. Maintainability defaults

1. Prefer **small modules** (one concern per file) under `protocol/`.  
2. Prefer **version constants** exported next to types.  
3. Prefer **documented invariants** in 5–15 lines above types.  
4. Do not expand `dto.ts` / `channels.ts` with Fleet domain blobs — new files + barrel export.  
5. Workers implement **executor/host** domains only; protocol remains Lead.  
6. Deprecations: mark `/** @deprecated use X — remove by Wy */` and ledger row.

## 8. Incident / regression trace

If a port causes production bugs:

1. Find commit via `ml_row` in PR/commit body.  
2. Open audit file + evidence log.  
3. Add `## Regression` section to the audit (date, symptom, fix ML or follow-up).  
4. If freeze was wrong, Lead amends freeze record with **Amended** date — never silent edit of evidence logs.

## 9. Agent entry path

1. `docs/loops/L00-control-plane/README.md`  
2. This file  
3. `BACKEND-VALUE-PORT.md` + `BACKEND-CONFLICT-AUDIT.md`  
4. Ledger + port checklist  
5. Only then edit allowed paths from an active packet  

## 10. Out of scope for migration agents

- Redesigning Craft chat chrome “while porting”  
- Opening W1 without Lead Ready  
- Implementing M07/M08 providers from old UI trees  
- “Temporary” second JSON databases  
