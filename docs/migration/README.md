# Migration documentation (L00)

> **Start here for migration agents.**  
> UI from fleet-old / old Fleet experimental screens: **do not port** (D50).  
> Backend ports: value filter → conflict audit → ledger → freeze → clean base.

## Agent reading order

1. [ENGINEERING-STANDARDS.md](ENGINEERING-STANDARDS.md) — folders, naming, gates, traceability  
2. [BACKEND-VALUE-PORT.md](BACKEND-VALUE-PORT.md) — D50 what is worth taking  
3. [BACKEND-CONFLICT-AUDIT.md](BACKEND-CONFLICT-AUDIT.md) — known implementation conflicts  
4. [v0.11-MIGRATION-LEDGER.md](v0.11-MIGRATION-LEDGER.md) — classifications  
5. [v0.11-PORT-CHECKLIST.md](v0.11-PORT-CHECKLIST.md) — port sequence  
6. [ADAPT-RECORD-TEMPLATE.md](ADAPT-RECORD-TEMPLATE.md) + [audits/](audits/) — per-unit records  
7. [staging-protocol/](staging-protocol/) — Lead TS freezes (not live imports)  
8. [v0.11-BASELINE-VALIDATION.md](v0.11-BASELINE-VALIDATION.md) + [evidence/](evidence/)  

## Index

| File | Purpose |
|---|---|
| [ENGINEERING-STANDARDS.md](ENGINEERING-STANDARDS.md) | Engineering norms, folders, C1–C10, PR trace fields |
| [BACKEND-VALUE-PORT.md](BACKEND-VALUE-PORT.md) | D50: no old UI; backend-value only |
| [BACKEND-CONFLICT-AUDIT.md](BACKEND-CONFLICT-AUDIT.md) | Living audit of stub conflicts vs spine |
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
