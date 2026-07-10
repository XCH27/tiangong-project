# Adapt Record Template

> Copy to `docs/migration/audits/YYYY-MM-DD-ml-###-<slug>.md`  
> Fill **before** any code lands on clean base.  
> Status values: `proposed` | `conflict-fail` | `ready-to-port` | `ported` | `regressed`

---

## Header

| Field | Value |
|---|---|
| **ml_row** | ML-### |
| **slug** | |
| **status** | proposed |
| **author** | Lead / agent id |
| **date** | YYYY-MM-DD |
| **freeze_id** | w0.1-doc-freeze-… |
| **source_tree** | current-app \| fleet-old \| staging-protocol \| other |
| **source_path** | |
| **source_revision** | git SHA or “n/a staging” |
| **target_path** | path on clean v0.11 base |
| **owner_module** | M0x |
| **wave** | |

## 1. Behaviour summary

What user-visible or system behaviour this backend enables (2–5 sentences).

## 2. Value gate (D50)

| Question | Yes/No | Note |
|---|---|---|
| Enables a real loop (not cosmetics)? | | |
| Fits spine (session/permission/timeline/action)? | | |
| Single authority named? | | |
| No old UI dependency? | | |
| Green-light / license OK? | | |

**Value verdict:** pass / fail

## 3. Conflict review (ENGINEERING-STANDARDS §5)

| ID | Result | Evidence |
|---|---|---|
| C1 single authority | PASS/FAIL/NA | |
| C2 M00/M03 path | | |
| C3 no dual types | | |
| C4 freeze compatible | | |
| C5 ADR-0034/0035 | | |
| C6 no fixed canvas product | | |
| C7 no old UI | | |
| C8 orthogonal policy | | |
| C9 restart/reconcile | | |
| C10 license | | |

**Conflict verdict:** PASS / FAIL  
If FAIL: set ledger classification to defer/drop; stop.

## 4. Known audit hits

Reference sections in `BACKEND-CONFLICT-AUDIT.md` (e.g. B1, M2) and how this unit avoids them.

## 5. Port plan

- [ ] Types from staging-protocol or rewritten source  
- [ ] Barrel export plan  
- [ ] CONTRACT_VERSION / const bump  
- [ ] Tests to add  
- [ ] Forbidden files list  

## 6. Verification

| Command | Result |
|---|---|
| `bun run typecheck:shared` | |
| other | |

## 7. Trace

| Field | Value |
|---|---|
| PR / commit | |
| follow-ups | |

## 8. Regression (if any)

_Date, symptom, fix, link to new audit._
