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

- **M00 must reach `backbone-merged` status** (session store, permission model, timeline event bus live) before M03's executor implementation begins, because M03's executor depends on the timeline event bus from M00.
- M03's **skeleton** (action ID enum, registry interface, manifest builder) may be built in parallel with M00 immediately after W0 gate.
- The Lead declares `M00 backbone-merged` explicitly. Workers must not self-declare this transition.

---

## Module Table

| Module | Slug | Wave | Depends On | Spec File | Status |
|---|---|---|---|---|---|
| M00 | platform-spine | W1 | W0 contracts | `modules/00-platform-spine.md` | 🔒 not started |
| M01 | clean-craft-baseline | W2 | M00 | `modules/01-clean-craft-baseline.md` | 🔒 not started |
| M02 | terminal-cli-runtime | W2 | M00 | `modules/02-terminal-cli-runtime.md` | 🔒 not started |
| M03 | internal-action-registry | W1 | W0 contracts; M00 backbone for executor | `modules/03-internal-action-registry.md` | 🔒 not started |
| M04 | runtime-lanes-teamrun | W2 | M00, M03 | `modules/04-runtime-lanes-teamrun.md` | 🔒 not started |
| M05 | files-library-leases | W2 | M00, M03 | `modules/05-files-library-leases.md` | 🔒 not started |
| M06 | browser-artifact-surface | W3 | M03 usable, M05 usable | `modules/06-browser-artifact-surface.md` | 🔒 not started |
| M07 | canvas-design-surface | W3 | M03 usable, M05 usable | `modules/07-canvas-design-surface.md` | 🔒 not started |
| M08 | aigc-jobs-surface | W3 | M03 usable, M05 usable | `modules/08-aigc-jobs-surface.md` | 🔒 not started |
| M09 | video-surface | W3 | M03 usable, M05 usable | `modules/09-video-surface.md` | 🔒 not started |
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
| 🔵 wired but not visually checked | Backend and UI paths connected; real rendered surface or runtime path not yet verified end-to-end |
| 📺 display-only | UI present but agent/timeline path incomplete |
| ✅ usable | Module passed all validation ladder steps; merged to spine |

---

## Cross-Module Dependency Notes

- **M00 and M03** are W1 parallel, but M03 executor depends on M00's timeline event bus. See W1 Execution Order above.
- **M06, M07, M08, M09** all depend on M03 at `usable` and M05 Library lease write path at `usable`. Do not start W3 modules until both reach `usable`.
- **M07 canvas** additionally needs the `protocol/canvas.ts` stub promoted before F-Track A can begin. Lead creates this stub at W0→W1 transition.
- **M08 AIGC** additionally needs M05's `LibraryAsset` write path stable before job completion can save outputs.
- **M09 video** additionally needs FFmpeg bundled in the Electron app (Lead responsibility at W1) before `video.export_clip` can be tested.
- **M10, M11, M12** are W4 and must not be started until M05 lease model is declared stable by the Lead.
- **W2 gate** requires both M00 backbone-merged **and** M03 executor at `usable`. A module that passes typechecks but has not been validated as real behavior does not satisfy the gate.
