# Archive Log

This file records when and why documents were moved to `docs/legacy/`. It exists so agents
reading `docs/legacy/` know the context of each archival action without having to reconstruct
it from commit history.

When a document is archived:
1. Move it to `docs/legacy/`.
2. Add a row here with the date, filename, and the reason.
3. If the document contained decisions that are still active, confirm those decisions are
   promoted to `DECISIONS-LEDGER.md` before archiving.

## Archive History

| Date | Original Path | Archived To | Reason |
|---|---|---|---|
| 2026-07-08 | `docs/*.md` (Chinese-language legacy corpus) | `docs/legacy/` | Branch `work/fresh-base-spine` restarted the active documentation in English. The old Chinese documents were historical evidence for decisions D1–D26. All still-active decisions were verified in `DECISIONS-LEDGER.md` before archival. |

## How to Read Legacy Documents

- Legacy documents are **historical evidence**, not execution instructions.
- If a legacy document appears to contradict an active English document, follow the active
  English document. Report the conflict to the Lead so the active doc can be updated if it
  is incomplete.
- Do not promote a legacy decision back into the active plan without explicit Lead approval
  and a new row in `DECISIONS-LEDGER.md`.
