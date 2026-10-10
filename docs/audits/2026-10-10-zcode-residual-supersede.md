# ZCode residual supersede — 2026-10-10

> **Date:** 2026-10-10
> **Role:** Docs residual after #60 (`4af410fb`) and D56.
> **Parent:** `docs/audits/2026-10-10-zcode-baseline-correction.md`.
> **Review:** Docs CLEAR residuals on #60. Non-blocking. This note records them.
> **Capability:** documentation only. Nothing in this note is `usable`. No wave is Ready. `CONTRACT_VERSION` stays `1.3.0`. No action id is added. `typecheck:all` is not claimed. The recorded #52 failure stands.
> **`app/`:** not modified.

## What changed

| File | Residual | What this note does |
|---|---|---|
| `docs/OWNERSHIP-MATRIX.md` | Craft `app/` path rows still read as live product ownership. | SUPERSEDE / ZCode-first banner. Those rows are historical. Product ownership lives in `.fleet/zcode` (Lead). No new Worker grant. |
| `docs/PERSISTENCE-AUTHORITY-MAP.md` | Craft `~/.craft-agent` layouts still read as product authority. | Same banner. Those layouts are reference. ZCode persistence is product authority when present. |
| `docs/WAVE-MODULE-MAP.md` | W1 entry-gate cell said "W0.1 explicitly closed" under Locked. | That phrase stays as historical Craft wording. It is not a live Craft gate. Product path is ZCode. Spine worker waves stay Locked. |

The ownership rows and the persistence table stay in place. This residual does not reassign a path, add a store, decide SQLite, open W1, or invent a Worker grant.

`.fleet/zcode` is gitignored and is not present in this checkout. "When present" means the candidate on a machine that has it. This note does not name a new on-disk layout and does not delete the candidate.
