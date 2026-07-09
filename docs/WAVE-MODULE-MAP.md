# Wave Module Map

> **Lead-owned.** Updated each time a wave gate is declared open or a module is promoted.
> Workers read this file; they do not modify it.

This file maps every module to its wave, its gate conditions, and its current status.

---

## Wave Schedule

| Wave | Gate Condition | Status |
|---|---|---|
| **W0 — Contract Freeze** | Lead commits frozen `action-ids.md` + `protocol-stubs.md` + `identity-tags-permission-matrix.md`; all three files marked frozen in their header | ✅ Done (2026-07-09) |
| **W1 — Spine** | W0 gate passed | 🔓 Open |
| **W2 — Runtime Core** | M00 backbone merged **and** M03 executor at `usable`; `SessionEvent` types live | 🔒 Locked |
| **W3 — Surfaces** | M03 executor + registry at `usable` **and** M05 Library write path verified | 🔒 Locked |
| **W4 — Intelligence** | M05 lease model declared stable by Lead | 🔒 Locked |
| **W5 — Polish** | All W1–W4 modules at `usable` | 🔒 Locked |

---

## Wave Stop Criteria

No worker agent may proceed past these checkpoints without Lead sign-off:
-   **W1 Stop Criteria**: The Platform Spine (`M00`) must be fully `backbone-merged` (events and DB live) and the Action Registry (`M03`) must be `usable` before starting implementation on any W2 executors.
-   **W2 Stop Criteria**: Terminal CLI Runtime (`M02`) must be fully `usable` and Files Library (`M05`) must be verified. Work on downstream surface editors (Browser/Canvas/Video) is strictly prohibited before this.
-   **W3 Stop Criteria**: All three primary surfaces (Browser `M06`, Canvas `M07`, Video `M09`) must be confirmed `usable`. Work on cost logging or memory packaging (`M10/M11`) must not start before this.

---

## Phase Completion Overview

| Phase | Name | Target Wave | Status | Exit Criteria Met? |
|---|---|---|---|---|
| Phase 0 | Clean Craft Baseline | W0 + U Track | ✅ Complete | Craft runs, repo baseline known |
| Phase 1 | Terminal and CLI Runtime Loop | W2 | 🔵 In Progress | — |
| Phase 2 | Internal Action Spine | W1 | 🔵 In Progress | — |
| Phase 3 | Runtime Lanes and TeamRun | W2 | 🔲 Not Started | — |
| Phase 4 | Files and Library | W2 | 🔲 Not Started | — |
| Phase 5 | Browser and Artifact Workflow | W3 | 🔲 Not Started | — |
| Phase 6 | Canvas, AIGC, and Video | F Track+W3 | 🔲 Not Started | — |

---

## Active Blockers

| ID | Blocker | Owner | Since |
|---|---|---|---|
| BLK-001 | M00 interface exports not yet Lead-committed; M01/M02/M03 cannot start | Lead | 2026-07-09 |

---

## W0 Gate Verification Record

All three required files exist and are marked frozen. W0 gate confirmed passed on 2026-07-09 by Lead.

| File | SHA | Frozen Header Present |
|---|---|---|
| `docs/contracts/action-ids.md` | 0dda5fada3bb562d9451836a753a6b6afd6c7d11 | ✅ `FROZEN v1.2.0` |
| `docs/contracts/protocol-stubs.md` | 21113dc36bc94e83e5ce381c52180a9bc7c03eb4 | ✅ confirmed |
| `docs/contracts/identity-tags-permission-matrix.md` | e3a7c3b6b6d3f034a30f7ad3e108737aed1364c6 | ✅ confirmed |

---

## W1 Execution Order

M00 and M03 are both W1 modules and depend only on W0 contracts. They may be worked in parallel **with the following constraint**:

-   **M03 仅允许并行编写骨架 (Skeleton)，严禁在 M00 达到 `backbone-merged` 前开始执行器 (Executor) 实装**：M03 的 Skeleton（包括 Action ID 枚举、Registry 接口声明、Manifest Builder 结构）可在 W0 门禁通过后与 M00 同时启动；但任何 Executor 的逻辑实现因依赖 M00 的 Timeline 事件总线，必须等到 M00 完成平台骨架开发被 Lead 显式宣告为 `backbone-merged` 后方可启动。
-   **M00 backbone-merged 状态必须由 Lead 显式声明**：Worker Agent 严禁自行判定或在提交中自行转变此状态。

---

## Module Table

| Module | Slug | Wave | Depends On | Spec File | Status |
|---|---|---|---|---|---|
| M00 | platform-spine | W1 | W0 contracts | `modules/00-platform-spine.md` | 🔓 Ready |
| M01 | clean-craft-baseline | W2 | M00 | `modules/01-clean-craft-baseline.md` | 🔒 Locked |
| M02 | terminal-cli-runtime | W2 | M00 | `modules/02-terminal-cli-runtime/SPEC.md` | 🔒 Locked |
| M03 | internal-action-registry | W1 | W0 contracts; M00 backbone for executor | `modules/03-internal-action-registry.md` | 🔓 Ready (Skeleton Only) |
| M04 | runtime-lanes-teamrun | W2 | M00, M03 | `modules/04-runtime-lanes-teamrun.md` | 🔒 Locked |
| M05 | files-library-leases | W2 | M00, M03 | `modules/05-files-library-leases.md` | 🔒 Locked |
| M06 | browser-artifact-surface | W3 | M03 usable, M05 usable | `modules/06-browser-artifact-surface/SPEC.md` | 🔒 Locked |
| M07 | canvas-design-surface | W3 | M03 usable, M05 usable | `modules/07-canvas-design-surface/SPEC.md` | 🔒 Locked |
| M08 | aigc-jobs-surface | W3 | M03 usable, M05 usable | `modules/08-aigc-jobs-surface.md` | 🔒 Locked |
| M09 | video-surface | W3 | M03 usable, M05 usable | `modules/09-video-surface.md` | 🔒 Locked |
| M10 | memory-context | W4 | M00, M05 | `modules/10-memory-context-review.md` | 🔒 Locked |
| M11 | model-routing-cost-ledger | W4 | M00, M03 | `modules/11-model-routing-cost-ledger.md` | 🔒 Locked |
| M12 | skill-library | W4 | M05, M11 | `modules/12-capability-skill-plugin-system.md` | 🔒 Locked |
| M13 | settings-preferences | W5 | M00 | `modules/13-settings-shell-ux.md` | 🔒 Locked |
| M14 | onboarding-empty-states | W5 | M00 | `modules/14-messaging.md` | 🔒 Locked |

---

## Status Legend

| Symbol | Meaning |
|---|---|
| 🔒 Locked | Wave gate not open; worker branch prohibited |
| 🔓 Ready | Wave gate open; ready for worker checkout |
| 🔓 Ready (Skeleton Only) | Only skeleton interface declarations allowed; executor logic locked |
| 🟡 In Progress | Worker claimed; branch active |
| 🟠 Blocked | Worker stopped; waiting for Lead decision |
| 🔵 Wired | Backend and UI paths connected; real rendered surface or runtime path not yet verified end-to-end |
| 📺 Display-Only | UI present but agent/timeline path incomplete |
| ✅ Usable | Module passed all validation ladder steps; merged to spine |

---

## Cross-Module Dependency Notes

-   **M00 and M03** are W1 parallel, but M03 executor depends on M00's timeline event bus. See W1 Execution Order above.
-   **M06, M07, M08, M09** all depend on M03 at `usable` and M05 Library lease write path at `usable`. Do not start W3 modules until both reach `usable`.
-   **M07 canvas** additionally needs the `protocol/canvas.ts` stub promoted before F-Track A can begin. Lead creates this stub at W0→W1 transition.
-   **M08 AIGC** additionally needs M05's `LibraryAsset` write path stable before job completion can save outputs.
-   **M09 video** additionally needs FFmpeg bundled in the Electron app (Lead responsibility at W1) before `video.export_clip` can be tested.
-   **M10, M11, M12** are W4 and must not be started until M05 lease model is declared stable by the Lead.
-   **W2 gate** requires both M00 backbone-merged **and** M03 executor at `usable`. A module that passes typechecks but has not been validated as real behavior does not satisfy the gate.
