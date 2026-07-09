# Wave Module Map

> **Lead-owned.** Updated each time a wave gate is declared open or a module is promoted.
> Workers read this file; they do not modify it.

This file maps every module to its wave, its gate conditions, and its current status.

---

## Wave Schedule

| Wave | Gate Condition | Status |
|---|---|---|
| **W0 — Contract Freeze** | Lead commits frozen `action-ids.md` + `protocol-stubs.md` | ✅ Done (2026-07-09) |
| **W1 — Spine** | W0 gate passed | 🔓 Open |
| **W2 — Runtime Core** | M00 backbone merged; `SessionEvent` types live | 🔒 Locked |
| **W3 — Surfaces** | M03 executor + registry merged | 🔒 Locked |
| **W4 — Intelligence** | M05 lease model stable | 🔒 Locked |
| **W5 — Polish** | All W1–W4 modules at `usable` | 🔒 Locked |

---

## Module Table

| Module | Slug | Wave | Depends On | Spec File | Status |
|---|---|---|---|---|---|
| M00 | platform-spine | W1 | W0 contracts | `modules/00-platform-spine.md` | 🔒 not started |
| M01 | clean-craft-baseline | W2 | M00 | `modules/01-clean-craft-baseline.md` | 🔒 not started |
| M02 | terminal-cli-runtime | W2 | M00 | `modules/02-terminal-cli-runtime.md` | 🔒 not started |
| M03 | internal-action-registry | W1 | W0 contracts | `modules/03-internal-action-registry.md` | 🔒 not started |
| M04 | runtime-lanes-teamrun | W2 | M00, M03 | `modules/04-runtime-lanes-teamrun.md` | 🔒 not started |
| M05 | files-library-leases | W2 | M00, M03 | `modules/05-files-library-leases.md` | 🔒 not started |
| M06 | browser-artifact-surface | W3 | M03, M05 | `modules/06-browser-artifact-surface.md` | 🔒 not started |
| M07 | canvas-design-surface | W3 | M03, M05 | `modules/07-canvas-design-surface.md` | 🔒 not started |
| M08 | aigc-jobs-surface | W3 | M03, M05 | `modules/08-aigc-jobs-surface.md` | 🔒 not started |
| M09 | video-surface | W3 | M03, M05 | `modules/09-video-surface.md` | 🔒 not started |
| M10 | memory-context | W4 | M00, M05 | `modules/10-memory-context.md` | 🔒 not started |
| M11 | model-routing-cost-ledger | W4 | M00, M03 | `modules/11-model-routing-cost-ledger.md` | 🔒 not started |
| M12 | skill-library | W4 | M05, M11 | `modules/12-skill-library.md` | 🔒 not started |
| M13 | settings-preferences | W5 | M00 | `modules/13-settings-preferences.md` | 🔒 not started |
| M14 | onboarding-empty-states | W5 | M00 | `modules/14-onboarding-empty-states.md` | 🔒 not started |

---

## Status Legend

| Symbol | Meaning |
|---|---|
| 🔒 not started | Wave gate not yet open or no worker assigned |
| 🟡 in progress | Worker claimed; branch active |
| 🟠 blocked | Worker stopped; waiting for Lead decision |
| ✅ usable | Module passed all validation ladder steps; merged to spine |
| 📺 display-only | UI present but agent/timeline path incomplete |

---

## Cross-Module Dependency Notes

- **M06, M07, M08, M09** all depend on M03 (action registry executor) and M05 (Library lease write path). Do not start W3 modules until both M03 and M05 reach `usable`.
- **M07 canvas** additionally needs the `protocol/canvas.ts` stub promoted before F-Track A can begin. Lead creates this stub at W0→W1 transition.
- **M08 AIGC** additionally needs M05's `LibraryAsset` write path stable before job completion can save outputs.
- **M09 video** additionally needs FFmpeg bundled in the Electron app (Lead responsibility at W1) before `video.export_clip` can be tested.
- **M10, M11, M12** are W4 and must not be started until M05 lease model is declared stable by the Lead.
