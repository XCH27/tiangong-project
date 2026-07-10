# Ownership Matrix

> **Lead-owned.** Workers read this file. They do not modify it.
>
> Every file domain in the repo is assigned to exactly one owner. "Lead" means no Worker
> may touch the file without an explicit Lead instruction. "Module M__" means only the assigned
> Worker(s) for that module may touch the file during their wave.
>
> **Precedence:** a narrow explicit path assignment overrides a broader parent-directory
> assignment. If two entries are equally specific, or the current v0.11 path is not recorded,
> ownership is unresolved and the Lead must update this matrix before issuing a packet. Workers
> must not infer ownership from a broad parent glob.
>
> **Migration notice:** existing `app/` paths below are provisional historical mappings until the
> M01 v0.11 migration ledger verifies them. They do not authorize a packet on the current tree.

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
| `docs/contracts/composable-workspace-contracts.md` | Lead | W0.1 proposal; not Worker-consumable until promoted |
| `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md` | Lead | Product architecture boundary |
| `docs/PERSISTENCE-AUTHORITY-MAP.md` | Lead | State authority map |
| `docs/DOCUMENT-READINESS.md` | Lead | Spec maturity register |
| `AGENTS.md` | Lead | Agent root instructions |

---

## Module File Domains

### M00 — Platform Spine (W1)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/main/` | M00 Lead |
| `app/apps/electron/src/preload/` | M00 Lead |
| `app/apps/electron/src/renderer/shell/` | M00 Lead |
| `app/packages/shared/src/sessions/` | M00 Lead |
| `app/packages/shared/src/workspaces/` | M00 Lead |
| `app/packages/shared/src/sessions/ (permissions namespace)` | M00 Lead |
| `app/packages/shared/src/sessions/ (timeline namespace)` | M00 Lead |

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
| `app/apps/electron/src/main/action-executor/` | M03 Worker |

> The canonical protocol files remain Lead-owned. M03 Workers consume the frozen action
> contract and implement only the executor domain; any action-schema change is a Lead request.

### M04 — Runtime Lanes / TeamRun (W2)

| Path pattern | Owner |
|---|---|
| `app/packages/shared/src/sessions/ (runtime lanes namespace)` | M04 Worker |
| `app/packages/shared/src/sessions/ (teamrun namespace)` | M04 Worker |

### M05 — Files Library Leases (W2)

| Path pattern | Owner |
|---|---|
| `app/packages/shared/src/workspaces/ (library namespace)` | M05 Worker |
| `app/packages/shared/src/workspaces/ (lease namespace)` | M05 Worker |

### M06 — Browser Artifact Surface (W3)

| Path pattern | Owner |
|---|---|
| BrowserPane selection/evidence overlay paths on clean v0.11 baseline (currently unassigned) | Lead until exact paths enter a packet |
| Browser action executor path on clean v0.11 baseline (currently unassigned) | Lead until exact paths enter a packet |

### M07 — Spatial Canvas (W3A)

| Path pattern | Owner |
|---|---|
| Spatial renderer/adapter paths on clean v0.11 baseline (currently unassigned) | Lead until exact paths enter a packet |
| Canvas action executor path on clean v0.11 baseline (currently unassigned) | Lead until exact paths enter a packet |

> The former F Track assignments are superseded. No M07 implementation path is authorized until
> the renderer spike and exact v0.11 mapping are recorded.

### M08 — External Jobs and Generative Operations (W2/W3A)

| Path pattern | Owner |
|---|---|
| ExternalJob/provider/projection paths on clean v0.11 baseline (currently unassigned) | Lead until exact paths enter a packet |

### M09 — Media Composition Surface (W3B)

| Path pattern | Owner |
|---|---|
| Media project/editor/render adapter paths on clean v0.11 baseline (currently unassigned) | Lead until exact paths enter a packet |

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

### M15 — Messaging Gateway (W5)

| Path pattern | Owner |
|---|---|
| `app/packages/messaging-gateway/` | M15 Worker |
| `app/apps/electron/src/renderer/surfaces/settings/ (messaging content only)` | M15 Worker |

### M16 — Workbench Panel Platform (W2/W3A)

| Path pattern | Owner |
|---|---|
| View registry/layout paths on clean v0.11 baseline (currently unassigned) | Lead until exact paths enter a packet |
| Shared shell primitives and route contracts | Lead |

### M17 — Composable Workflows (W3A)

| Path pattern | Owner |
|---|---|
| Workflow definition/run projection paths on clean v0.11 baseline (currently unassigned) | Lead until exact paths enter a packet |
| Workflow protocol/action IDs | Lead |

### M18 — Web Artifact Surface (W3B)

| Path pattern | Owner |
|---|---|
| Web-project capability/surface paths on clean v0.11 baseline (currently unassigned) | Lead until exact paths enter a packet |

### M19 — Presentation and Motion Surface (W3B)

| Path pattern | Owner |
|---|---|
| MotionDeck capability/surface paths on clean v0.11 baseline (currently unassigned) | Lead until exact paths enter a packet |

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
