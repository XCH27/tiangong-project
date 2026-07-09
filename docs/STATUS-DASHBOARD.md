# Project Status Dashboard

> **Owner:** Lead only. Update after every wave completion or significant state change.
> **Purpose:** Single-pane view of Phase completion, Module status, and current wave progress.
> **Audience:** Lead, Workers (read-only), human stakeholders.
> Last updated: 2026-07-09

---

## Current Wave: W1 (In Progress)

| Module | Wave | Owner | Status | Branch | Notes |
|---|---|---|---|---|---|
| M00 platform-spine | W1 | Lead | 🔵 in-progress | `worker/M00-platform-spine` | Interfaces must be exported before M01/M02/M03 start |
| M03 internal-action-registry | W1 | TBD | 🔲 not-started | — | Depends on M00 interface exports |
| M01 terminal-runtime-lane | W1 | TBD | 🔲 not-started | — | Depends on M00 + M03 action path |
| M02 cli-runtime-lane | W1 | TBD | 🔲 not-started | — | Depends on M00 + M03 action path |
| M04 files-library | W1 | TBD | 🔲 not-started | — | Depends on M00 + M03 |

**Status legend:**
- ✅ usable
- 🟡 wired but not visually checked
- 🔵 in-progress
- 🔲 not-started
- ❌ blocked

---

## Phase Completion Overview

| Phase | Name | Target Wave | Status | Exit Criteria Met? |
|---|---|---|---|---|
| Phase 0 | Clean Craft Baseline | W0 + U Track | ✅ Complete | Craft runs, repo baseline known |
| Phase 1 | Terminal and CLI Runtime Loop | W1 | 🔵 In Progress | — |
| Phase 2 | Internal Action Spine | W0→W1 | 🔵 In Progress | — |
| Phase 3 | Runtime Lanes and TeamRun | W0→W2 | 🔲 Not Started | — |
| Phase 4 | Files and Library | W1 | 🔲 Not Started | — |
| Phase 5 | Browser and Artifact Workflow | W3 | 🔲 Not Started | — |
| Phase 6 | Canvas, AIGC, and Video | F Track+W3 | 🔲 Not Started | — |

---

## W0 Contracts — Frozen ✅

| Contract | SHA | Frozen Date |
|---|---|---|
| `docs/contracts/action-ids.md` | _(Lead to backfill)_ | 2026-07-09 |
| `docs/contracts/protocol-stubs.md` | _(Lead to backfill)_ | 2026-07-09 |
| `docs/contracts/identity-tags-permission-matrix.md` | _(Lead to backfill)_ | 2026-07-09 |

---

## Active Blockers

| ID | Blocker | Owner | Since |
|---|---|---|---|
| BLK-001 | Contract SHAs not backfilled in W0 verification record | Lead | 2026-07-09 |
| BLK-002 | M00 interface exports not yet Lead-committed; M01/M02/M03 cannot start | Lead | 2026-07-09 |

---

## Wave Unlock Conditions

| Wave | Unlocks When | Current State |
|---|---|---|
| W2 | M00 + M03 executor merged and usable | 🔲 Not ready |
| W3 | W2 + M05 LeaseProvenance merged | 🔲 Not ready |
| F Track | W0 contracts frozen (parallel) | ✅ Unblocked in principle |
