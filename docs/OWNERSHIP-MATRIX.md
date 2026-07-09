# Ownership Matrix

> **Lead-owned.** Workers read this file. They do not modify it.
>
> Every file domain in the repo is assigned to exactly one owner. "Lead" means no Worker
> may touch the file without an explicit Lead instruction. "Module M__" means only the assigned
> Worker(s) for that module may touch the file during their wave.

---

## Frozen Contract Files (Lead Only — Always)

| Path | Owner | Notes |
|---|---|---|
| `app/packages/shared/src/protocol/*.ts` | Lead | All protocol type files |
| `app/packages/shared/src/protocol/index.ts` | Lead | Protocol barrel export |
| `docs/contracts/action-ids.md` | Lead | Frozen action id table |
| `docs/contracts/protocol-stubs.md` | Lead | Type stubs |
| `docs/OWNERSHIP-MATRIX.md` | Lead | This file |
| `docs/WAVE-MODULE-MAP.md` | Lead | Wave status |
| `docs/PARALLEL-AGENT-OPERATING-MODEL.md` | Lead | Operating rules |
| `docs/BOARD-SYNC.md` | Lead | Board card schema |
| `docs/DECISIONS-LEDGER.md` | Lead | Decision log |
| `AGENTS.md` | Lead | Agent root instructions |

---

## Module File Domains

### M00 — Platform Spine (W1)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/main/` | M00 Lead |
| `app/apps/electron/src/preload/` | M00 Lead |
| `app/apps/electron/src/renderer/shell/` | M00 Lead |
| `app/packages/shared/src/session/` | M00 Lead |
| `app/packages/shared/src/workspace/` | M00 Lead |
| `app/packages/shared/src/permission/` | M00 Lead |
| `app/packages/shared/src/timeline/` | M00 Lead |

### M01 — Clean Craft Baseline (W2)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/renderer/craft/` | M01 Worker |

### M02 — Terminal CLI Runtime (W2)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/renderer/terminal/` | M02 Worker |
| `app/apps/electron/src/main/terminal-host.ts` | M02 Worker |

### M03 — Internal Action Registry (W1)

| Path pattern | Owner |
|---|---|
| `app/packages/shared/src/action-registry/` | M03 Worker |
| `app/apps/electron/src/main/action-executor/` | M03 Worker |

### M04 — Runtime Lanes / TeamRun (W2)

| Path pattern | Owner |
|---|---|
| `app/packages/shared/src/runtime-lanes/` | M04 Worker |
| `app/packages/shared/src/teamrun/` | M04 Worker |

### M05 — Files Library Leases (W2)

| Path pattern | Owner |
|---|---|
| `app/packages/shared/src/library/` | M05 Worker |
| `app/packages/shared/src/lease/` | M05 Worker |

### M06 — Browser Artifact Surface (W3)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/renderer/surfaces/browser/` | M06 Worker |
| `app/apps/electron/src/main/browser-webview-host.ts` | M06 Worker |
| `app/packages/shared/src/action-executors/browser.ts` | M06 Worker |

### M07 — Canvas Design Surface (W3)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/renderer/surfaces/canvas/` | M07 F-Tracks |
| `app/packages/shared/src/action-executors/canvas.ts` | M07 F-Track C |
| `app/packages/shared/src/canvas/adapter.ts` | M07 F-Track A |

### M08 — AIGC Jobs Surface (W3)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/renderer/surfaces/aigc/` | M08 Worker |
| `app/packages/shared/src/aigc/` | M08 Worker |
| `app/packages/shared/src/action-executors/aigc.ts` | M08 Worker |

### M09 — Video Surface (W3)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/renderer/surfaces/video/` | M09 Worker |
| `app/packages/shared/src/video/` | M09 Worker |
| `app/packages/shared/src/action-executors/video.ts` | M09 Worker |

### M10 — Memory Context (W4)

| Path pattern | Owner |
|---|---|
| `app/packages/shared/src/memory/` | M10 Worker |

### M11 — Model Routing / Cost Ledger (W4)

| Path pattern | Owner |
|---|---|
| `app/packages/shared/src/model-routing/` | M11 Worker |
| `app/packages/shared/src/cost-ledger/` | M11 Worker |

### M12 — Skill Library (W4)

| Path pattern | Owner |
|---|---|
| `app/packages/shared/src/skills/` | M12 Worker |

### M13 — Settings Preferences (W5)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/renderer/surfaces/settings/` | M13 Worker |

### M14 — Onboarding / Empty States (W5)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/renderer/onboarding/` | M14 Worker |

---

## Cross-Module Shared Utilities

| Path pattern | Owner | Rule |
|---|---|---|
| `app/packages/shared/src/utils/` | Lead | Workers may add pure utility functions; no side effects; no protocol imports |
| `app/packages/shared/src/types/` | Lead | Workers may add non-protocol types; Lead reviews before merge |
| `app/apps/electron/src/renderer/components/` | Lead | Shared UI components; Workers propose additions; Lead merges |

---

## Violation Handling

If a Worker touches a file outside its domain:

1. The PR is rejected without review.
2. The Worker must revert the change and re-open with a corrected diff.
3. If the Worker needed to modify a Lead-owned file, it must file a contract change request before touching any code.
