# W0.1 Exit item 7 — ownership domains

> **Date:** 2026-10-10
> **Role:** Fleet Lead. This note records file-domain ownership. It does not issue a packet.
> **Base:** `da584d568e5aeab4f0ca70a0a09f3d628af98d23` (`work/fresh-base-spine` after #58).
> **Pin:** Craft Agents OSS tag `v0.11.0` = `f4e172bf372f4ccc7389a189be1e0b0541f96282` (D51). Directory listings below are the public GitHub contents API at that tag. This cloud workspace still has no populated checkout.
> **Ledger:** D55 in `docs/DECISIONS-LEDGER.md`. D50 identifier strings and D52 retain rows stay in force. D53 and D54 stay in force and are not reopened.
> **Capability:** documentation only. Nothing in this note is `usable`.
> **Gates:** W0.1 stays In Progress. W1 stays Locked. Exit item 7 stays open. Exit items 1, 3, 4, and 5 stay open. `CONTRACT_VERSION` stays `1.3.0`. No action id is added.
>
> **What this does not do:** It does not edit `app/`, replace the tree, run `typecheck:all`, invent a typecheck pass, close W0.1, or mark a wave Ready.

## Choice

Keep the precedence rule already in `docs/OWNERSHIP-MATRIX.md`: a narrower explicit path wins over a broader parent. A parenthetical label is not a path. Two owners on one real directory are not allowed.

Where the pin has a directory, this note names one owner. New rows are Lead. The two Worker rows that already name a real directory, and do not share that directory with another row, stay: `app/packages/shared/src/skills/` (M12) and `app/packages/messaging-gateway/` (M15).

Where the pin has no directory, the surface stays explicitly unassigned. The owner of that hold is Lead. Every Worker is forbidden until a later packet names a new path. That hold is not a second owner of a nearby directory.

Exit item 7 stays open. The assigned rows do not overlap. The no-path holds are still not domains a packet can enter, and several host packages were seen and not given a new row. The existing rule still blocks a packet on an unrecorded path.

## How the three peers split host, extension, and protocol

`docs/REFERENCE-PROJECT-POLICY.md` allows Craft Agents OSS as the Apache-2.0 base. Claude Code and VS Code are already behavior references in `docs/audits/2026-10-10-blk002-namespace-oss.md` and `docs/audits/2026-10-10-w01-lead-decisions-oss.md`. This note does not copy source, tests, types, or manifests. It reuses the split those notes already recorded.

| Layer | Craft Agents at `f4e172bf` | VS Code, as already cited | Claude Code, as already cited | Fleet file rule (D55) |
|---|---|---|---|---|
| Host | Session files, shell, main process, config directory, panel stack, and the projects/tasks/kanban surfaces D52 retains. One shell (D27-R, D42). | The extension host owns extension state. `contributes.views` and `contributes.commands` are host contribution points. A plugin does not pick a shared disk prefix. Enablement is one host state, not a webview file write. | User settings (`enabledPlugins`) are separate from the plugin package. Plugin data is not the workspace authority. The manifest directory sits inside the package. | A real host directory has one owner. New host rows are Lead. Workers do not write them. |
| Extension | Skills and the messaging gateway are packages beside the shell. They are not a second session store. | The extension id, the built-in `vscode.*` API, and a contribution id are three strings. The extension contributes into a host point. | A plugin `name` namespaces that plugin's components. It does not become the host setting key. | `skills/` stays M12. `messaging-gateway/` stays M15. Neither row extends into host UI, host RPC, or `sessions/`. |
| Protocol | `packages/shared/src/protocol/` is the shared type tree. Fleet's action table stays the frozen v1.3.0 files, which are already Lead-only. | Built-in API calls go through `vscode.*`. Extensions do not own that API. | The manifest schema is not the user settings file. | `app/packages/shared/src/protocol/*.ts` and `protocol/index.ts` stay Lead. This note adds no action id and does not bump `CONTRACT_VERSION`. |

The loser in each column is a second owner of the host directory: an M06 claim on `browser-pane-manager.ts`, an M16 claim on `views/` or `panel-stack.ts`, an M04 claim on `sessions/`, an M17 claim on the Kanban board, an M18 claim on `apps/webui`.

## What was listed at the pin

These names were returned for `packages/shared/src` at `f4e172bf`: `agent`, `auth`, `automations`, `colors`, `config`, `credentials`, `docs`, `i18n`, `icons`, `labels`, `mcp`, `mentions`, `projects`, `prompts`, `protocol`, `release-notes`, `resources`, `scheduler`, `search`, `sessions`, `skills`, `sources`, `statuses`, `tasks`, `tools`, `types`, `utils`, `validation`, `version`, `views`, `workspaces`. There is no `memory`, `model-routing`, `cost-ledger`, `canvas`, `workflow`, `jobs`, or `media` directory.

`sessions/` contains `storage.ts`, `jsonl.ts`, `types.ts`, and sibling files. It has no `permissions`, `timeline`, `teamrun`, or runtime-lane subdirectory.

`workspaces/` contains `storage.ts`, `types.ts`, `index.ts`, and `__tests__`. It has no `library` or `lease` subdirectory.

`apps/electron/src/main/` contains `browser-pane-manager.ts`, `browser-cdp.ts`, and `onboarding.ts`. It has no `terminal-host.ts` and no `action-executor/` directory.

`apps/electron/src/renderer/` has no `shell/`, `craft/`, `terminal/`, `surfaces/`, or `onboarding/` directory. Onboarding UI is `components/onboarding/`. Settings UI is `components/settings/`.

`apps/electron/src/renderer/atoms/overlay.ts` documents a full-screen shell overlay (the comment names workspace creation and an AppShell scale-back). It is not a BrowserPane selection overlay.

`packages/` also contains `core`, `messaging-gateway`, `messaging-whatsapp-worker`, `pi-agent-server`, `server`, `server-core`, `session-mcp-server`, `session-tools-core`, `shared`, and `ui`. `apps/` also contains `cli`, `electron`, `viewer`, and `webui`.

The baseline name `background-task-surface.test.ts` was not in the `session-tools-core/src/handlers/` listing. The listing does contain `list-background-tasks.ts` and `list-background-tasks.test.ts`. This note does not assign the unlisted test name.

## Rows already Lead-held (unchanged)

These six paths stay the D51/D52 rows. D55 does not give them a second owner.

| Path | Owner | Forbidden writers |
|---|---|---|
| `app/packages/shared/src/projects/` | Lead | Every Worker |
| `app/packages/shared/src/tasks/` | Lead | Every Worker, including M17. A workflow document is the no-path hold below, not this directory. |
| `app/packages/server-core/src/tasks/` | Lead | Every Worker, including M04. `TaskRunner.ts` lives here. D52 D-05 still refuses to treat it as TeamRun. |
| `app/apps/electron/src/renderer/components/app-shell/kanban/` | Lead | Every Worker, including M16 and M17 |
| `app/apps/electron/src/renderer/components/app-shell/ProjectsListPanel.tsx` | Lead | Every Worker |
| `app/apps/electron/src/renderer/pages/ProjectInfoPage.tsx` | Lead | Every Worker |

`app/packages/shared/src/sessions/` and `app/packages/shared/src/workspaces/` stay M00 Lead. `app/apps/electron/src/main/` and `app/apps/electron/src/preload/` stay M00 Lead. A narrower Lead row inside `main/` is the same writer. It stops a module Worker from inferring the file out of the parent.

`app/packages/shared/src/skills/` stays M12. `app/packages/messaging-gateway/` stays M15. Those two are the only Worker rows D55 leaves on a directory the pin actually has.

## Newly assigned paths

Owner is Lead. Paths are the pin paths with Fleet's `app/` prefix, matching the matrix. Forbidden writers include every Worker. The module named in the last column is the one that must not infer the path.

| Path on the v0.11 pin | Why this owner | Forbidden inference | OSS rationale |
|---|---|---|---|
| `app/packages/shared/src/config/` | Host `CONFIG_DIR` and preferences (R-04, D50, D54). | M11, M13 | Craft keeps preferences in one config package. VS Code does not let an extension pick the settings prefix. |
| `app/apps/electron/src/main/browser-pane-manager.ts` | Host BrowserPane (R-05). Same writer as M00 `main/`. | M06 | D10 adapts this pane. The pane file is the host, not the evidence overlay. |
| `app/apps/electron/src/main/browser-cdp.ts` | Host CDP beside that pane. Same writer as M00 `main/`. | M06 | Same host split. CDP is not an extension package. |
| `app/apps/electron/src/renderer/components/browser/` | Host browser chrome. | M06 | The component folder is shell UI. |
| `app/apps/electron/src/renderer/browser-toolbar.html` | Host toolbar page. | M06 | Same. |
| `app/apps/electron/src/renderer/browser-toolbar.tsx` | Host toolbar page. | M06 | Same. |
| `app/apps/electron/src/renderer/browser-empty-state.html` | Host empty state. | M06 | Same. |
| `app/apps/electron/src/renderer/browser-empty-state.tsx` | Host empty state. | M06 | Same. |
| `app/apps/cli/` | Craft CLI package (R-06). | M02 | D21 keeps the CLI, the runtime lane, and TeamRun apart. The historical `terminal/` and `terminal-host.ts` paths are not this package. |
| `app/packages/session-tools-core/src/handlers/` | Host tool handlers, including `list-background-tasks.ts` (R-07). | M04 | Background keep-alive stays a Craft session query. It is not TeamRun (D-05). |
| `app/apps/electron/src/renderer/components/app-shell/BackgroundFinishedChip.tsx` | Host chip for that query. | M04 | Same. |
| `app/apps/electron/src/renderer/components/app-shell/ActiveTasksBar.tsx` | Host task chrome beside the board. | M04, M17 | The board directory is already Lead. This file is not a second board and not a workflow document. |
| `app/apps/electron/src/renderer/components/app-shell/TaskActionMenu.tsx` | Host task chrome. | M04, M17 | Same. |
| `app/packages/shared/src/views/` | Host view registry (`defaults.ts`, `storage.ts`, `types.ts`, `evaluator.ts`). | M16 | VS Code `contributes.views` is a host point. D42 gives M16 layout state only after a packet. D53 still leaves the view contract proposed. |
| `app/apps/electron/src/renderer/atoms/` | Host atoms, including `panel-stack.ts`, `overlay.ts`, `browser-pane.ts`, `projects.ts`, `kanban.ts`, `background-finished.ts`, `messaging.ts`, `sessions.ts`. | M06, M07, M16, and every other Worker | One directory, one owner. `overlay.ts` is the shell scale-back atom. |
| `app/apps/electron/src/renderer/components/app-shell/AppShell.tsx` | Host shell (R-08). | M16 | D27-R keeps one shell. |
| `app/apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx` | Host panel stack. | M16 | Same contribution point as `panel-stack.ts`. |
| `app/apps/electron/src/renderer/components/right-sidebar/` | Host sidebar slot (A-06). | M16 | The slot is inside the shell. It is not a second view host. |
| `app/apps/electron/src/renderer/components/projects/` | Project UI beside `ProjectsListPanel.tsx` (R-01). | Every Worker | Same product surface as the six rows above. |
| `app/packages/server-core/src/handlers/rpc/` | Host RPC, including `projects.ts`, `tasks.ts`, `sessions.ts`, `settings.ts`, `onboarding.ts`, `messaging.ts`. | Every Worker | Built-in RPC is the host API. VS Code's `vscode.*` is not owned by an extension. |
| `app/apps/electron/src/renderer/components/settings/` | Settings UI that exists at the pin. | M13, M15 | The historical `renderer/surfaces/settings/` path is absent. Claude Code keeps user settings off the plugin package. |
| `app/apps/electron/src/renderer/components/onboarding/` | Onboarding UI that exists at the pin. | M14 | The historical `renderer/onboarding/` path is absent. |
| `app/apps/electron/src/main/onboarding.ts` | Host onboarding main. Same writer as M00 `main/`. | M14 | Same. |
| `app/apps/electron/src/renderer/components/messaging/` | Host messaging UI. | M15 | M15 keeps `messaging-gateway/` only. The UI is not that package. |
| `app/packages/messaging-whatsapp-worker/` | Separate package from the gateway. | M15 | A second package is not implied by the gateway row. |
| `app/packages/pi-agent-server/` | Upstream Pi package on the pin. | Every Worker | The Pi boundary in `AGENTS.md` stays a host note. This row does not make it a Fleet execution host. |
| `app/apps/webui/` | Craft web UI app. | M18 | A web UI host is not an M18 web-project document. |
| `app/packages/server-core/src/webui/` | Craft web UI server helper. | M18 | Same. |
| `app/apps/viewer/` | Craft viewer app. | M07 | Not the spatial renderer. D43 still requires a spike. |
| `app/apps/electron/src/renderer/components/files/` | Host file UI. | M05 | Not a library or lease store. Workspace bytes stay the Craft tree (D54). |
| `app/apps/electron/src/renderer/components/preview/` | Host preview UI. | M09, M19 | Not a media editor and not a MotionDeck. |
| `app/apps/electron/src/renderer/components/automations/` | Host automations UI. | M17 | Not a workflow document (D41). |
| `app/apps/electron/src/renderer/components/workspace/` | Host workspace UI. | M05 | Not `workspaces/` and not a lease directory. |

The parent row `app/apps/electron/src/renderer/components/` stays Lead. Its older sentence that Workers may propose additions does not apply to a narrower Lead row in the table above. Precedence already prefers the narrow path. D55 states the consequence: the narrow row forbids the proposal.

## Explicitly unassigned holds

No directory at `f4e172bf`. Owner of the hold is Lead. Forbidden writers are every Worker, including the module named. A later packet must name a new path that is not one of the assigned directories above.

| Surface | What the pin showed | Forbidden inference | OSS rationale |
|---|---|---|---|
| Browser selection/evidence overlay | No overlay directory. `atoms/overlay.ts` is the shell scale-back atom and is already in the atoms row. | M06 | The host pane is assigned. The evidence overlay is still an adapter spike (BLK-003), not a second claim on the pane. |
| Browser action executor | No `action-executor/` under `main/`. | M03, M06 | Protocol files stay Lead. An executor directory is not invented here. |
| Spatial renderer/adapter | No canvas or spatial directory under `shared/src` or `renderer/components`. | M07 | D43. The viewer app is a different assigned row. |
| Canvas action executor | No path. | M03, M07 | Same as the browser executor hold. |
| ExternalJob / provider / projection | No jobs directory. | M08 | D53 leaves ExternalJob proposed. Live providers stay deferred (D52 D-07). |
| Media project/editor/render adapter | No media or video directory in the listed trees. | M09 | BLK-003. Preview UI is a different assigned row. |
| Workflow definition/run projection | No workflow directory. `tasks/` and `server-core/src/tasks/` stay the existing Lead rows. | M17 | D41 and D52: a workflow document is not the Kanban board. D53 leaves the workflow contract proposed. |
| Web-project capability/surface | No M18 directory. `apps/webui` and `server-core/src/webui` are the host rows above. | M18 | Host web UI is not the native web-project document. |
| MotionDeck | No deck or motion directory. | M19 | D46 stays unmet. Preview UI is not the deck. |
| Runtime-lane and TeamRun directories | `sessions/` is flat and stays M00 Lead alone. | M04 | One session directory. VS Code does not give an extension the host state directory. Parenthetical labels are withdrawn. |
| Library and lease directories | `workspaces/` is flat and stays M00 Lead alone. | M05 | D15 and D44. Parenthetical labels are withdrawn. File UI is a different assigned row. |
| Messaging content inside settings | Not a path. | M15 | The settings directory is the host row. M15 does not split it. |

## Historical globs that are not v0.11 paths

These matrix rows named a Worker and a path the pin does not have. D55 withdraws the write. The owner of the hold is Lead. They grant nothing until a later packet names a real path.

| Historical pattern | Pin listing | Forbidden |
|---|---|---|
| `app/apps/electron/src/renderer/shell/` | Absent. Shell files that exist are `AppShell.tsx` and the panel-stack rows. | M00 Workers; the path is not a second shell |
| `app/apps/electron/src/renderer/craft/` | Absent. | M01 |
| `app/apps/electron/src/renderer/terminal/` | Absent. CLI package is `app/apps/cli/`. | M02 |
| `app/apps/electron/src/main/terminal-host.ts` | Absent from `main/`. | M02 |
| `app/apps/electron/src/main/action-executor/` | Absent from `main/`. | M03 |
| `app/packages/shared/src/sessions/ (permissions namespace)` | Not a directory. | No second owner of `sessions/` |
| `app/packages/shared/src/sessions/ (timeline namespace)` | Not a directory. | No second owner of `sessions/` |
| `app/packages/shared/src/sessions/ (runtime lanes namespace)` | Not a directory. | M04 |
| `app/packages/shared/src/sessions/ (teamrun namespace)` | Not a directory. | M04 |
| `app/packages/shared/src/workspaces/ (library namespace)` | Not a directory. | M05 |
| `app/packages/shared/src/workspaces/ (lease namespace)` | Not a directory. | M05 |
| `app/packages/shared/src/memory/` | Absent from `shared/src`. | M10 |
| `app/packages/shared/src/model-routing/` | Absent. | M11 |
| `app/packages/shared/src/cost-ledger/` | Absent. | M11 |
| `app/apps/electron/src/renderer/surfaces/settings/` | Absent. Real UI is `components/settings/`. | M13 |
| `app/apps/electron/src/renderer/surfaces/settings/ (messaging content only)` | Not a path. | M15 |
| `app/apps/electron/src/renderer/onboarding/` | Absent. Real UI is `components/onboarding/`. | M14 |

## Seen and not given a new row

The contents API also showed `packages/core`, `packages/server`, `packages/session-mcp-server`, `packages/ui`, `packages/shared/src/agent`, and the electron `runtime/`, `shared/`, and `transport/` directories. This note does not add a Worker for them and does not add a Lead row either. The precedence rule still says an unrecorded v0.11 path is unresolved. A packet cannot start on one. That residual is one reason Exit item 7 stays open.

`app/packages/shared/src/protocol/` stays the frozen Lead row. It is not re-listed as a new assignment.

## Exit item 7

The item stays open.

Assigned rows in the matrix now have one owner each. Narrow Lead rows inside `main/` or `components/` name the same writer as the parent Lead row, and they forbid the module that used to be able to infer the child. The no-path surfaces stay explicit Lead holds. They are not overlapping owners, and they are not domains a Worker may enter.

Checking the item off would say every narrow domain is settled. The holds and the unlisted host packages are not settled. W0.1 stays In Progress. W1 stays Locked.

## Honesty

- Exit items 1, 3, 4, and 5 stay open. D51 through D54 are unchanged in substance.
- No `usable`. No Ready. No `CONTRACT_VERSION` bump. No new action id.
- `typecheck:all` remains the #52 failure recorded on Exit item 1. This note did not run it.
