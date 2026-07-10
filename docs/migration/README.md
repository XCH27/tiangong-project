# Migration documentation (L00)

> **Start here for migration agents.**  
> UI from fleet-old / old Fleet experimental screens: **do not port** (D50).  
> Backend ports: value filter → conflict audit → ledger → freeze → clean base.

## Agent reading order

1. [ENGINEERING-STANDARDS.md](ENGINEERING-STANDARDS.md) — folders, naming, gates C1–C15, traceability  
2. [BACKEND-VALUE-PORT.md](BACKEND-VALUE-PORT.md) — D50 what is worth taking  
3. [BACKEND-CONFLICT-AUDIT.md](BACKEND-CONFLICT-AUDIT.md) — shape conflicts vs spine  
4. [DEAD-CODE-SIDE-EFFECTS.md](DEAD-CODE-SIDE-EFFECTS.md) — orphans, garbage tests, S1–S10  
5. [MODULE-REACTION-MAP.md](MODULE-REACTION-MAP.md) — which modules react / blast radius  
6. [v0.11-MIGRATION-LEDGER.md](v0.11-MIGRATION-LEDGER.md) — classifications  
7. [v0.11-PORT-CHECKLIST.md](v0.11-PORT-CHECKLIST.md) — port sequence  
8. [ADAPT-RECORD-TEMPLATE.md](ADAPT-RECORD-TEMPLATE.md) + [audits/](audits/) — per-unit records  
9. [staging-protocol/](staging-protocol/) — Lead TS freezes (not live imports)  
10. [v0.11-BASELINE-VALIDATION.md](v0.11-BASELINE-VALIDATION.md) + [evidence/](evidence/)  

## Index

| File | Purpose |
|---|---|
| [ENGINEERING-STANDARDS.md](ENGINEERING-STANDARDS.md) | Engineering norms, folders, C1–C10, PR trace fields |
| [BACKEND-VALUE-PORT.md](BACKEND-VALUE-PORT.md) | D50: no old UI; backend-value only |
| [BACKEND-CONFLICT-AUDIT.md](BACKEND-CONFLICT-AUDIT.md) | Living audit of stub conflicts vs spine |
| [DEAD-CODE-SIDE-EFFECTS.md](DEAD-CODE-SIDE-EFFECTS.md) | Dead/orphan code, tests, side effects |
| [MODULE-REACTION-MAP.md](MODULE-REACTION-MAP.md) | Cross-module reactions / blast radius |
| [v0.11-MIGRATION-LEDGER.md](v0.11-MIGRATION-LEDGER.md) | retain/adapt/drop/defer + baselines |
| [v0.11-BASELINE-VALIDATION.md](v0.11-BASELINE-VALIDATION.md) | install/typecheck evidence |
| [v0.11-PORT-CHECKLIST.md](v0.11-PORT-CHECKLIST.md) | Port sequence + forbidden |
| [ADAPT-RECORD-TEMPLATE.md](ADAPT-RECORD-TEMPLATE.md) | Copy per adapt unit |
| [audits/](audits/) | Filled adapt records + index |
| [evidence/](evidence/) | Raw command logs (append-only) |
| [staging-protocol/](staging-protocol/) | Lead-only TS freezes for port |
| [scripts/validate-clean-v011.sh](scripts/validate-clean-v011.sh) | Re-run clean-tag checks |

Related freezes: `docs/contracts/w0.1-freeze-record.md`, `docs/contracts/m11a-usage-cost-core.md`, ADR-0034/0035.

## Hard stop

If conflict audit **FAIL** → do not merge into clean base.  
If work needs old UI files → **drop** (D50).  
If W1 packet appears while WAVE says Locked → stop and report Lead.
