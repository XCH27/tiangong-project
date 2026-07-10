# Archive Log

This file records when and why documents were moved to `docs/legacy/`. It exists so agents
reading `docs/legacy/` know the context of each archival action without having to reconstruct
it from commit history.

When a document is archived:
1. Move it to `docs/legacy/` (or a subfolder such as `docs/legacy/agent-packets/`).
2. Add a row here with the date, filename, and the reason.
3. If the document contained decisions that are still active, confirm those decisions are
   promoted to `DECISIONS-LEDGER.md` before archiving.
4. Update active indexes (`docs/README.md`, `START-HERE.md`) so no entry path still treats the
   file as binding or executable.

## Archive History

| Date | Original Path | Archived To | Reason |
|---|---|---|---|
| 2026-07-08 | `docs/*.md` (Chinese-language legacy corpus) | `docs/legacy/` | Branch `work/fresh-base-spine` restarted the active documentation in English. The old Chinese documents were historical evidence for decisions D1–D26. All still-active decisions were verified in `DECISIONS-LEDGER.md` before archival. |
| 2026-07-09 | `docs/ARCHITECTURAL-COMPARISON.md` | `docs/legacy/ARCHITECTURAL-COMPARISON.md` | Nonbinding research draft with unverified external product claims and daemon/App-Server topology that conflicted with D38 / PROJECT-DIRECTION binding spine. Must not open waves or select topology. |
| 2026-07-09 | `docs/PROJECT-DIRECTION.md` §§13–17 (historical topology) | `docs/legacy/PROJECT-DIRECTION-HISTORICAL-TOPOLOGY.md` | Superseded Bun/SQLite/daemon draft and historical surface-entry notes. Binding W1/W2 spine remains in active `PROJECT-DIRECTION.md` §13. |
| 2026-07-09 | `docs/agent-packets/wave-0-contract-freeze.md` | `docs/legacy/agent-packets/` | Superseded; predates W0.1; not authorization. |
| 2026-07-09 | `docs/agent-packets/wave-1-platform-action.md` | `docs/legacy/agent-packets/` | Superseded; granted protocol writes; predates W0.1 re-freeze. |
| 2026-07-09 | `docs/agent-packets/wave-2-runtime-files-quota.md` | `docs/legacy/agent-packets/` | Superseded; no Ready/execution-ready slice. |
| 2026-07-09 | `docs/agent-packets/wave-2-teamrun-routing.md` | `docs/legacy/agent-packets/` | Superseded; no Ready/execution-ready slice. |
| 2026-07-09 | `docs/agent-packets/wave-3-browser-capability-review.md` | `docs/legacy/agent-packets/` | Superseded; W3A Locked (historical packet name kept). |
| 2026-07-09 | `docs/agent-packets/f-track-canvas-foundation.md` | `docs/legacy/agent-packets/` | Superseded F Track; M07 path never an alternate gate. |
| 2026-07-09 | (control-plane pass) | n/a — added active docs | Added `loops/`, `FORBIDDEN-ANTIPATTERNS.md`, `DOCUMENT-REGISTRY.md`, `verification/CONTROL-PLANE-VERIFICATION.md`; normalized module Delivery-loop headers and contract RECORDED wording. |

## How to Read Legacy Documents

- Legacy documents are **historical evidence**, not execution instructions.
- If a legacy document appears to contradict an active English document, follow the active
  English document. Report the conflict to the Lead so the active doc can be updated if it
  is incomplete.
- Do not promote a legacy decision back into the active plan without explicit Lead approval
  and a new row in `DECISIONS-LEDGER.md`.
- Do not implement from `docs/legacy/agent-packets/`. Active packets live only in
  `docs/agent-packets/`.
