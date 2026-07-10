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
| C11 orphan honesty | | |
| C12 no duplicate types | | |
| C13 garbage tests | | |
| C14 side effects S1–S10 | | |
| C15 reaction map | | |

**Conflict verdict:** PASS / FAIL  
If FAIL: set ledger classification to defer/drop; stop.

## 4. Dead code / tests / side effects

| Field | Value |
|---|---|
| External importers (command + count) | |
| Orphan stub? | yes/no |
| Executor/host exists? | yes/no/path |
| Related tests | paths or “none” |
| Garbage-test risk | none/describe |
| Side effects if wrong (S1–S10) | |

## 5. Module reactions (from MODULE-REACTION-MAP)

| Module | Reaction | Wave | Note |
|---|---|---|---|
| M00 | | | |
| M03 | | | |
| … | | | |

**Blast radius summary:** …

## 6. Known audit hits

Reference `BACKEND-CONFLICT-AUDIT.md` / `DEAD-CODE-SIDE-EFFECTS.md` sections and mitigations.

## 7. Port plan

- [ ] Types from staging-protocol or rewritten source  
- [ ] Barrel export plan  
- [ ] CONTRACT_VERSION / const bump  
- [ ] Tests to add (required if first executor)  
- [ ] Forbidden files list  
- [ ] Explicit “not usable” until executor+timeline wired  

## 8. Verification

| Command | Result |
|---|---|
| importer rg | |
| test rg | |
| `bun run typecheck:shared` | |
| other | |

## 9. Trace

| Field | Value |
|---|---|
| PR / commit | |
| follow-ups | |

## 10. Regression (if any)

_Date, symptom, fix, link to new audit._
