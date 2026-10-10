# Ownership Matrix

> **SUPERSEDED 2026-10-10 (D56):** Historical only. Not a product gate. ZCode-first supersedes the Craft path rows in this matrix.
>
> Craft path ownership rows below are historical. Product ownership lives in `.fleet/zcode` (Lead). This banner does not invent new Worker grants, reassign a row, open a wave, mark Ready or `usable`, or edit `app/`. Detail: `docs/audits/2026-10-10-zcode-residual-supersede.md`.

> **Lead-owned.** Workers read this file. They do not modify it.
>
> Every file domain in the repo is assigned to exactly one owner. "Lead" means no Worker
> may touch the file without an explicit Lead instruction. "Module M__" means only the assigned
> Worker(s) for that module may touch the file during their wave.
>
> **Precedence:** a narrow explicit path assignment overrides a broader parent-directory
> assignment. If two entries are equally specific, or the current v0.11 path is not recorded,
> ownership is unresolved and the Lead must update this matrix before issuing a packet. Workers
> must not infer ownership from a broad parent glob. A parenthetical label is not a path. It
> does not split a real directory and it does not assign a Worker. A narrower Lead row forbids
> Workers even when a broader parent allows a proposal.
>
> **Migration notice:** historical `app/` patterns that the v0.11.0 pin does not contain are
> Lead holds. They do not authorize a packet. D55 records which patterns were withdrawn.
>
> **Observed v0.11 paths (2026-10-10, D51/D52):** these paths exist on tag `v0.11.0`
> (`f4e172bf`) and are absent from the current `app/` tree. They are Lead-held until a later
> packet. Holding them here does not assign a Worker and does not open W1.
>
> | Path on the v0.11 pin | Owner until a packet |
> |---|---|
> | `app/packages/shared/src/projects/` | Lead |
> | `app/packages/shared/src/tasks/` | Lead |
> | `app/packages/server-core/src/tasks/` | Lead |
> | `app/apps/electron/src/renderer/components/app-shell/kanban/` | Lead |
> | `app/apps/electron/src/renderer/components/app-shell/ProjectsListPanel.tsx` | Lead |
> | `app/apps/electron/src/renderer/pages/ProjectInfoPage.tsx` | Lead |
>
> **Further v0.11 domains (2026-10-10, D55):** exact paths and explicit no-path holds are in
> the sections below and in `docs/audits/2026-10-10-w01-exit7-ownership-domains.md`. New rows
> are Lead. Workers are forbidden. Exit item 7 stays open. This notice does not open W1.
>
> Identifier prefixes are D50. This matrix does not assign those prefixes.

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
| `app/packages/shared/src/sessions/` | M00 Lead |
| `app/packages/shared/src/workspaces/` | M00 Lead |

`app/apps/electron/src/renderer/shell/` is not a v0.11 path. The shell files that exist are the D55 rows (`AppShell.tsx`, `PanelStackContainer.tsx`, `atoms/panel-stack.ts`). Permissions and timeline are not directories under `sessions/`. That directory has one owner, the M00 Lead row above. A narrower Lead file inside `main/` (D55) is the same writer.

### M01 — Clean Craft Baseline (W2)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/renderer/craft/` | Lead hold. Not a v0.11 path. M01 Worker forbidden. |

### M02 — Terminal CLI Runtime (W2)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/renderer/terminal/` | Lead hold. Not a v0.11 path. M02 Worker forbidden. |
| `app/apps/electron/src/main/terminal-host.ts` | Lead hold. Absent from v0.11 `main/`. M02 Worker forbidden. |

The v0.11 CLI package is `app/apps/cli/` in the D55 table. That row is Lead. It does not assign M02.

### M03 — Internal Action Registry (W1)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/main/action-executor/` | Lead hold. Absent from v0.11 `main/`. M03 Worker forbidden. |

> The canonical protocol files remain Lead-owned. The executor directory is the Lead hold
> above. Any action-schema change is a Lead request. This row does not authorize a packet.

### M04 — Runtime Lanes / TeamRun (W2)

No runtime-lane or TeamRun directory exists under `sessions/` at the v0.11 pin. Those parenthetical rows are withdrawn. `sessions/` stays M00 Lead alone. M04 Workers are forbidden until a later packet names a new path that is not `sessions/`. `app/packages/server-core/src/tasks/` stays the existing Lead row and is not TeamRun.

### M05 — Files Library Leases (W2)

No library or lease directory exists under `workspaces/` at the v0.11 pin. Those parenthetical rows are withdrawn. `workspaces/` stays M00 Lead alone. M05 Workers are forbidden until a later packet names a new path that is not `workspaces/`. Host file UI is the D55 `components/files/` row, also Lead.

### M06 — Browser Artifact Surface (W3)

Host BrowserPane files are D55 Lead rows (`browser-pane-manager.ts`, `browser-cdp.ts`, `components/browser/`, the browser toolbar and empty-state pages). The selection/evidence overlay and a browser action executor have no v0.11 directory. Both are Lead holds. M06 Workers are forbidden.

### M07 — Spatial Canvas (W3A)

No spatial renderer or canvas executor directory exists at the pin. Both are Lead holds. M07 Workers are forbidden. `app/apps/viewer/` is a D55 Lead row and is not the spatial renderer.

> The former F Track assignments are superseded. No M07 implementation path is authorized until
> the renderer spike and exact v0.11 mapping are recorded.

### M08 — External Jobs and Generative Operations (W2/W3A)

No ExternalJob, provider, or projection directory exists at the pin. The hold is Lead. M08 Workers are forbidden.

### M09 — Media Composition Surface (W3B)

No media editor or render-adapter directory exists at the pin. The hold is Lead. M09 Workers are forbidden. `components/preview/` is a D55 Lead row and is not this surface.

### M10 — Memory Context (W4)

| Path pattern | Owner |
|---|---|
| `app/packages/shared/src/memory/` | Lead hold. Absent from v0.11 `shared/src`. M10 Worker forbidden. |

### M11 — Model Routing / Cost Ledger (W4)

| Path pattern | Owner |
|---|---|
| `app/packages/shared/src/model-routing/` | Lead hold. Absent from v0.11 `shared/src`. M11 Worker forbidden. |
| `app/packages/shared/src/cost-ledger/` | Lead hold. Absent from v0.11 `shared/src`. M11 Worker forbidden. |

`app/packages/shared/src/config/` is the D55 host config row. It is not an M11 directory.

### M12 — Skill Library (W4)

| Path pattern | Owner |
|---|---|
| `app/packages/shared/src/skills/` | M12 Worker |

This is a real v0.11 directory and the only M12 path. It does not include host RPC, host atoms, or `components/settings/`.

### M13 — Settings Preferences (W5)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/renderer/surfaces/settings/` | Lead hold. Absent at the pin. M13 Worker forbidden. |

The settings UI that exists is `app/apps/electron/src/renderer/components/settings/` (D55, Lead).

### M14 — Onboarding / Empty States (W5)

| Path pattern | Owner |
|---|---|
| `app/apps/electron/src/renderer/onboarding/` | Lead hold. Absent at the pin. M14 Worker forbidden. |

The onboarding paths that exist are `components/onboarding/` and `main/onboarding.ts` (D55, Lead).

### M15 — Messaging Gateway (W5)

| Path pattern | Owner |
|---|---|
| `app/packages/messaging-gateway/` | M15 Worker |

This is a real v0.11 directory and the only M15 path. The old settings-content parenthetical is withdrawn. `components/messaging/`, `packages/messaging-whatsapp-worker/`, and `handlers/rpc/` are D55 Lead rows.

### M16 — Workbench Panel Platform (W2/W3A)

Host view and shell files are D55 Lead rows: `app/packages/shared/src/views/`, `renderer/atoms/`, `AppShell.tsx`, `PanelStackContainer.tsx`, and `components/right-sidebar/`. Shared shell primitives and route contracts stay Lead. M16 Workers are forbidden until a later packet. The view contract stays proposed (D53).

### M17 — Composable Workflows (W3A)

No workflow definition or run-projection directory exists at the pin. The hold is Lead. M17 Workers are forbidden. Workflow protocol and action ids stay Lead. `tasks/`, `server-core/src/tasks/`, and `kanban/` stay the existing Lead rows and are not this surface.

### M18 — Web Artifact Surface (W3B)

No web-project capability directory exists at the pin. The hold is Lead. M18 Workers are forbidden. `app/apps/webui/` and `app/packages/server-core/src/webui/` are D55 Lead rows and are not this surface.

### M19 — Presentation and Motion Surface (W3B)

No MotionDeck directory exists at the pin. The hold is Lead. M19 Workers are forbidden. `components/preview/` is a D55 Lead row and is not this surface.

---

## v0.11 narrow domains (D55)

Detail and the OSS comparison are `docs/audits/2026-10-10-w01-exit7-ownership-domains.md`.
Every row here is Lead. Every Worker is forbidden, including the module that might infer the path.
A narrower row inside `main/` is the same writer as the M00 Lead parent. Exit item 7 stays open.

| Path on the v0.11 pin | Forbidden inference |
|---|---|
| `app/packages/shared/src/config/` | M11, M13 |
| `app/apps/electron/src/main/browser-pane-manager.ts` | M06 |
| `app/apps/electron/src/main/browser-cdp.ts` | M06 |
| `app/apps/electron/src/renderer/components/browser/` | M06 |
| `app/apps/electron/src/renderer/browser-toolbar.html` | M06 |
| `app/apps/electron/src/renderer/browser-toolbar.tsx` | M06 |
| `app/apps/electron/src/renderer/browser-empty-state.html` | M06 |
| `app/apps/electron/src/renderer/browser-empty-state.tsx` | M06 |
| `app/apps/cli/` | M02 |
| `app/packages/session-tools-core/src/handlers/` | M04 |
| `app/apps/electron/src/renderer/components/app-shell/BackgroundFinishedChip.tsx` | M04 |
| `app/apps/electron/src/renderer/components/app-shell/ActiveTasksBar.tsx` | M04, M17 |
| `app/apps/electron/src/renderer/components/app-shell/TaskActionMenu.tsx` | M04, M17 |
| `app/packages/shared/src/views/` | M16 |
| `app/apps/electron/src/renderer/atoms/` | M06, M07, M16, every Worker |
| `app/apps/electron/src/renderer/components/app-shell/AppShell.tsx` | M16 |
| `app/apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx` | M16 |
| `app/apps/electron/src/renderer/components/right-sidebar/` | M16 |
| `app/apps/electron/src/renderer/components/projects/` | Every Worker |
| `app/packages/server-core/src/handlers/rpc/` | Every Worker |
| `app/apps/electron/src/renderer/components/settings/` | M13, M15 |
| `app/apps/electron/src/renderer/components/onboarding/` | M14 |
| `app/apps/electron/src/main/onboarding.ts` | M14 |
| `app/apps/electron/src/renderer/components/messaging/` | M15 |
| `app/packages/messaging-whatsapp-worker/` | M15 |
| `app/packages/pi-agent-server/` | Every Worker |
| `app/apps/webui/` | M18 |
| `app/packages/server-core/src/webui/` | M18 |
| `app/apps/viewer/` | M07 |
| `app/apps/electron/src/renderer/components/files/` | M05 |
| `app/apps/electron/src/renderer/components/preview/` | M09, M19 |
| `app/apps/electron/src/renderer/components/automations/` | M17 |
| `app/apps/electron/src/renderer/components/workspace/` | M05 |

These surfaces have no directory at the pin. The hold is Lead. They are not a second owner of a nearby assigned path.

| Surface with no v0.11 directory | Forbidden inference |
|---|---|
| Browser selection/evidence overlay | M06 |
| Browser action executor | M03, M06 |
| Spatial renderer/adapter | M07 |
| Canvas action executor | M03, M07 |
| ExternalJob / provider / projection | M08 |
| Media project/editor/render adapter | M09 |
| Workflow definition/run projection | M17 |
| Web-project capability/surface | M18 |
| MotionDeck capability/surface | M19 |
| Runtime-lane and TeamRun directories | M04 |
| Library and lease directories | M05 |
| Messaging content inside settings | M15 |

---

## Cross-Module Shared Utilities

| Path pattern | Owner | Rule |
|---|---|---|
| `app/packages/shared/src/utils/` | Lead | Workers may add pure utility functions; no side effects; no protocol imports |
| `app/packages/shared/src/types/` | Lead | Workers may add non-protocol types; Lead reviews before merge |
| `app/apps/electron/src/renderer/components/` | Lead | Shared UI components. A narrower Lead row (the project/task/kanban rows and every D55 path under `components/`) forbids Workers on that path. Elsewhere, Workers propose additions and the Lead merges. |

---

## Violation Handling

If a Worker touches a file outside its domain:

1. The PR is rejected without review.
2. The Worker must revert the change and re-open with a corrected diff.
3. If the Worker needed to modify a Lead-owned file, it must file a contract change request before touching any code.
