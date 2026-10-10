# W0.1 exit checklist — session chrome after PRs #28–#33

> **Date:** 2026-10-10
> **Base inspected:** `4f12779d` (`work/fresh-base-spine` after merged PR #33)
> **Current base:** `9fdb881e` (`work/fresh-base-spine` after merged PR #49)
> **What this file is:** a review note for the Lead. It inventories the session-chrome host-admit chain and the items that still block closing W0.1. It does not promote a decision, mark a wave Ready, add an action id, or change capability status.
> **Binding exit list:** `docs/WAVE-MODULE-MAP.md` §3. This note does not replace that list and does not check any item off.
> **Earlier review:** `docs/audits/2026-10-10-spine-honesty-audit.md` still describes base `89b2e8a6`. That body is not rewritten.
> **Follow-up:** agent `rename_session` is its own §13 `wired` row. That row is no longer `not implemented`. Title generation stays the desktop user. This note does not close W0.1.
>
> **Follow-up (workspace rename):** Settings → Workspace name admits frozen `workspace.rename` (L2) on an existing session kernel. That path publishes the existing permission card and writes the folder name only after Allow. The generic card rows stay `test-only` for every other awaiting turn. `file.delete` and `canvas.node_delete` are still not shell callers. D46 stays unmet: the PPTX shell is a first-slide viewer, and Office edit and save stay Locked. This note does not close W0.1 and does not promote `usable`.
>
> **Follow-up (L3 card search, docs only):** After `25e53895`, Electron, `SessionManager`, and the RPC handlers still have no production caller for frozen `file.delete` or `canvas.node_delete`. `createCanvasCardHost.deleteCard` and `CliExecutorHost` admit those ids only in tests. `sessions:delete`, `skills:delete`, and `sources:delete` are not `file.delete`. No permission card was wired for either id. The D46 footnote in `docs/modules/19-presentation-motion-surface.md` §10 records the same search: the first-slide viewer leaves MotionDeck unmet, and Office edit and save stay Locked. `CONTRACT_VERSION` at that search was 1.2.0. The current constant is 1.3.0, recorded in the #39 follow-up. This note does not close W0.1 and does not promote `usable`.
>
> **Lead-unblock packet:** `docs/audits/2026-10-10-w01-lead-unblock.md` (written at `7c36bb6d`, after merged PR #37). Its status block records what #39 landed and what #41–#43 admit on test hosts.
>
> **Follow-up (Exit item 3, docs only):** `docs/audits/2026-10-10-w01-exit3-canonical-parity.md` names the Fleet file and the Craft v0.11.0 surface for each field. Action ids and the v1.3.0 policy table are frozen (D47–D49). AgentSeat projection, caller provenance, idempotency, revisions, typed event payloads, and HostTurnKernel admission on the v0.11 tree are partial. `CONTRACT_VERSION` stays 1.3.0. No action id is added. Exit item 3 stays open. Exit item 1 stays open. This note does not close W0.1 and does not promote `usable`.
>
> **Lead decisions after #39 (`31b2e1b`):** `docs/audits/2026-10-10-w01-lead-decisions-oss.md` and D47–D49 in `docs/DECISIONS-LEDGER.md`. The freeze is on the spine. `CONTRACT_VERSION` is 1.3.0. `session.unflag` is frozen and §13 labels the human command `wired` (D47). At that commit, `plugin.loadout_mutate`, `file.page_target`, `browser.dom_snapshot`, and `workbench.sidebar_focus` are frozen and have no production caller (D48). Settings plugin writes stay Locked (D49). W0.1 stays Locked. The nine exit items in `docs/WAVE-MODULE-MAP.md` §3 stay open. This note does not mark Ready or `usable`.
>
> **Follow-up (DOM snapshot):** The guest host `captureDomFromHuman` and `captureDomFromAgent` admit frozen `browser.dom_snapshot`. The row is L2. The request does not set `preAuthorizedBy`. An unapproved turn does not read the page. Allow is the only path that reads. Deny and stop read nothing. The host does not publish the Craft session card. No shell or IPC caller, so §13 stays `test-only`. `file.create` still refuses the payload. This note does not close W0.1 and does not promote `usable`.
>
> **Follow-up (page target):** The page-local host `update-target` admits frozen `file.page_target`. The row is L2. The request does not set `preAuthorizedBy`. A missing `baseRevision` is not admitted. Allow is the only path that writes. Deny and stop write nothing. The host does not publish the Craft session card. `file.update` still refuses the payload. `EditPopover` does not call the host, so §13 stays `test-only`. This note does not close W0.1 and does not promote `usable`.
>
> **Follow-up (sidebar focus):** The MCP Apps test host admits frozen `workbench.sidebar_focus` for open, focus, and close. The row is L0, so the turn does not wait for a card and does not publish the Craft session card. The Electron pane does not construct `createMcpAppsHost`, so §13 stays `test-only`. `canvas.node_select` still refuses the payload. This note does not close W0.1 and does not promote `usable`.
>
> **Follow-up after #41–#43 (`92ee3ea5`):** `browser.dom_snapshot`, `file.page_target`, and `workbench.sidebar_focus` admit on their test hosts. §13 labels each `test-only`. None of the three has a shell or IPC caller, and none publishes the Craft session card. `file.create`, `file.update`, and `canvas.node_select` still refuse those payloads. At that commit `plugin.loadout_mutate` has no caller. Settings plugin writes stay Locked. W0.1 stays Locked. Nothing in those admits is `usable`.
>
> **Follow-up (BLK-002, D50):** The product/internal namespace strings are recorded. Exit item 6 is decided. BLK-001, BLK-003, and the other §3 items stay open. At that record Settings stayed Locked. This note does not close W0.1 and does not promote `usable`.
>
> **Follow-up (plugin loadout):** `SessionManager.applySessionPluginMutation` and `resolveSessionPluginGrant` admit frozen `plugin.loadout_mutate`. The row is L2. The request does not set `preAuthorizedBy`. An unapproved call does not write. A later call after a human allow writes the loadout. `op: grant` is `standing_grant_rejected` and writes nothing. `file.update` still refuses the payload. At that host there was no shell or IPC caller, so §13 stayed `test-only` and Settings install, enable, and disable stayed Locked. D50 is unchanged. This note does not close W0.1 and does not promote `usable`.
>
> **Follow-up (sidebar shell):** The MCP Apps pane constructs one `createMcpAppsHost`. Human open, focus, and close admit `workbench.sidebar_focus`. L0 does not wait for a card. The right-sidebar slot changes after the kernel completes. §13 labels that human path `wired`. Agent helpers stay `test-only`. `canvas.node_select` still refuses the payload. Settings plugin writes, DOM capture, and page-target are not this caller. This note does not close W0.1 and does not promote `usable`.
>
> **Follow-up (v0.11 pin and BLK-001 ledger):** `docs/audits/2026-10-10-w01-v011-baseline-blk001.md`, D51, and D52. The pin is tag `v0.11.0` at `f4e172bf`. The behaviour ledger is recorded. Exit items 1 and 2 stay open: there is no populated checkout, no desktop loop, no fleet-old tree, and no file-by-file `app/` diff. Items 3–5 and 7–9 stay open. Item 6 stays D50. BLK-001 stays open. This note does not close W0.1 and does not promote `usable`.
>
> **Follow-up (Settings plugin caller, #49 `9fdb881e`):** Settings install, enable, and disable are `wired`. The page calls `plugins:mutateLoadout`. That handler admits `plugin.loadout_mutate` and publishes the Craft session permission card. Allow and Deny settle through `resolveSessionPluginGrant` and `sessions:respondToPermission`. Allow writes the catalog the agent loads. Deny writes nothing. §13 labels that caller `wired`. `createPluginSettingsHost` stays `test-only`. `file.update` still refuses the payload. `op: grant` stays `standing_grant_rejected`. The caller is not `usable`. W0.1 stays Locked. This note does not mark Ready.
>
> **Follow-up (Exit 1 Mac source tree):** `docs/audits/2026-10-10-w01-exit1-mac-checkout.md`. A populated source tree on Vella's Mac matches the D51 pin. `bun install --frozen-lockfile` failed. After #51 (`8cd1365d`), non-frozen `bun install` finished and the lockfile was restored with `git checkout -- bun.lock`. `bun run typecheck:all` failed (exit 2): the first hard error is `TS5083` for `tsconfig.base.json`, and that file is absent from HEAD at this pin. No typecheck fix is recorded. After #52, Electron launch and relaunch are recorded in `docs/audits/2026-10-10-w01-exit1-electron-launch.md`. After #53, `docs/audits/2026-10-10-w01-exit1-rpc-loop.md` records RPC `projects:create`, `sessions:sendMessage`, and `browser-pane:create` on pid `71904` (AX title `Craft Agents`). At that RPC record, Kanban board UI and Settings panel UI were still not verified. `typecheck:all` remains that failure. The earlier sentence in this header that says there is no populated checkout is superseded for the source tree only. Exit item 1 stays open. The pin, the source tree, the finished install, the failed typecheck, this launch, and this RPC pass do not close it. This note does not close W0.1 and does not promote `usable`.
>
> **Follow-up (Exit 1 route restores and migration branch, #54 `20a8d2fd`):** `docs/audits/2026-10-10-w01-exit1-routes-migration.md`. `bun run electron:dev` restored window-state `route=board` (log `Restoring window ... route=board`; AX title `Craft Agents`; sessions board navigator `routes.view.board()` → `board`) and later `route=settings` (log `Restoring window ... route=settings`; window title stayed `Craft Agents`). Those are route restores. They are not an AX click on Kanban chrome and not `tasks:list`. `Cmd+,` and Craft Agents → 设置... were not verified: the frontmost menu bar stayed on pid `4855` `Fleet 项目审查` (also Electron, `com.github.Electron`). Branch `fleet/migration-from-v0.11.0` is open at `/Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-agents-oss--migration-from-v0.11.0`, HEAD `f4e172bf372f4ccc7389a189be1e0b0541f96282`, exact tag `v0.11.0`. The pin worktree is intact. Adapt row ports are not started. Fleet `app/` stays `0.10.5`. `typecheck:all` remains the #52 failure. Exit item 1 stays open. Docs decides whether the route restores and this branch open meet the remaining UI and migration bullets. This note does not close W0.1, does not mark Ready, and does not promote `usable`.

## Gate status (unchanged)

W0.1 stays Locked for worker implementation. `docs/WAVE-MODULE-MAP.md` still records the Lead reconciliation row as In Progress and blocking all Workers. This note does not close that row and does not mark W0.1 or W1 Ready.

`docs/modules/00-platform-spine.md` header stays capability `not implemented` and execution gate Locked. Nothing in this checklist is `usable`. The Settings plugin caller is `wired` (D49) and is not `usable`. The #39 freeze is CONTRACT 1.3.0, recorded as D47–D49. PRs #28–#33 themselves added no action id. PRs #41–#43 add no action id. DOM capture and page-target stay `test-only`. The MCP Apps pane is the human caller for `workbench.sidebar_focus`.

W1–W5, including W3A/W3B, stay Locked. M00 as a module stays Locked.

## Session-chrome admits that landed

PRs #28 and #30–#33 admit existing frozen ids on the one Craft session kernel and journal `fleet_host_session_event` lines in `session.jsonl`. PR #29 is the docs clarification that `Locked` is an execution gate. It admits nothing.

`docs/modules/00-platform-spine.md` §13 is the row source. Those `wired` labels are shell or live tool paths. They are not a Lead `usable` promotion. The module header stays `not implemented`.

| Caller | Frozen id | §13 label |
|---|---|---|
| Human Flag (`flagSession`) | `session.flag` (L0) | `wired` |
| Human rename (`renameSession`) | `session.rename` (L1, undo contract) | `wired` |
| Human status (`setSessionStatus`) | `session.set_status` (L1, undo contract) | `wired` |
| Human labels (`setSessionLabels`) | `session.set_labels` (L1, undo contract) | `wired` |
| Agent `set_session_status` | `session.set_status`, actor = calling Craft session | `wired` |
| Agent `set_session_labels` | `session.set_labels`, actor = calling Craft session | `wired` |
| Title generation (`generateTitle`, `refreshTitle`, first-message name slice) | `session.rename` as the desktop user. A refused admit leaves the name unchanged. | `wired` |
| Send-time auto-labels (`applySendTimeAutoLabels`) | `session.set_labels`. A human send uses the desktop user. `send_agent_message` and `spawn_session` use the calling Craft session. A refused admit leaves the labels unchanged. | `wired` |
| Mini-session auto-complete | Admits `session.set_status` as the host system actor. The L1 row denies `actor_not_permitted`. Status stays unchanged. | `fail-closed` |
| Agent rename (`rename_session`) | `session.rename`, actor = calling Craft session. A blank or missing caller does not write. | `wired` |
| Unflag (`unflagSession`) | `session.unflag` (L0). See the Lead-decisions follow-up. | `wired` |

`session.flag` does not publish a permission card. The three L1 chrome ids auto-admit because the frozen rows already carry an undo contract, so those turns also do not publish a card.

## What still blocks the Lead from closing W0.1

BLK-001 (migration ledger and contract parity) and BLK-003 (adapter spikes) stay open. BLK-002 is closed as a name decision by D50. The other §3 items stay open. `docs/UPSTREAM-BASELINE.md` still records `app/` short of the clean v0.11.0 baseline and still requires a retain/adapt/drop/defer ledger before W1 packets. Session chrome does not supply that evidence.

These slices stay blocked inside that exit, except agent rename, unflag, and Settings plugin install, enable, and disable. Those three are their own §13 `wired` rows. The Settings row is not `usable`. A worker must not implement the remaining items from this note.

1. **Unflag.** Closed as its own §13 `wired` row by the Lead freeze of `session.unflag` in v1.3.0. A refused admit leaves the flag set. This row does not close W0.1.

2. **Permission-card publish and approve, other than Settings workspace rename and Settings plugin install, enable, and disable.** The generic §13 rows stay `test-only`. Settings workspace rename is one L2 shell caller and has its own `wired` row: Allow writes the folder name, and Deny or a missing session leaves it. Settings plugin install, enable, and disable are the other production card caller: `plugins:mutateLoadout` → `plugin.loadout_mutate`. Allow writes the catalog the agent loads. Deny writes nothing. That row is `wired` and is not `usable`. A search after `25e53895` found no production shell or IPC caller for `file.delete` or `canvas.node_delete`, so neither id publishes a card. Shell `file.delete` is `not implemented` in §13. Canvas delete stays on the `test-only` card host. Session chrome that is L0 or L1-with-undo still does not publish a card.

3. **Settings plugin writes.** Install, enable, and disable on Settings → Plugins are `wired` (D49). The page calls `plugins:mutateLoadout`. That handler calls `applySessionPluginMutation` with `plugin.loadout_mutate` and publishes the Craft session permission card. Allow and Deny settle through `resolveSessionPluginGrant` and `sessions:respondToPermission`. Allow writes the catalog the agent loads. Deny writes nothing. `createPluginSettingsHost` stays `test-only`. `op: grant` is `standing_grant_rejected`. `file.update` still refuses that payload. This row is not `usable` and does not close W0.1.

4. **Agent `session.rename`.** Closed as its own §13 `wired` row by `rename_session`. A blank or missing caller does not write the name. Title generation still uses the desktop user and is not this row. This item no longer blocks W0.1. Unflag and Settings plugin install, enable, and disable are the other closed slices in this list. The Settings row is `wired` and is not `usable`. The remaining items stay open.

5. **Action-id owner mismatch.** v1.3.0 gives `plugin.loadout_mutate`, `file.page_target`, `browser.dom_snapshot`, and `workbench.sidebar_focus` their own rows and policy columns. The old verbs still refuse those payloads. The guest host admits `browser.dom_snapshot` and the page-local host admits `file.page_target`. Those two stay `test-only` in §13: no shell or IPC caller, and no Craft session card. The MCP Apps pane is the human caller for `workbench.sidebar_focus`. Agent helpers stay `test-only`. Settings install, enable, and disable call `plugins:mutateLoadout`, which admits `plugin.loadout_mutate` and publishes the Craft session card. §13 labels that caller `wired`. It is not `usable`. `browser.screenshot` and binding deletion stay unfrozen. The columns do not close the rest of exit item 3.

6. **D46 PPTX.** D46 in `docs/DECISIONS-LEDGER.md` is still Final: the native document is a MotionDeck, and PPTX, HTML, and video are explicit exports. The shell PPTX overlay is a first-slide text viewer (`wired` preview). Create, edit, undo, save, and reopen through the document host stay `test-only`. Office edit and save in the shell stay Locked. MotionDeck, animation, and a full slide editor stay Locked. M19's header stays Locked. The first-slide viewer leaves D46 unmet. The footnote is `docs/modules/19-presentation-motion-surface.md` §10. This note does not edit the ledger.

7. **Office edit and save, and W1–W5.** DOCX, XLSX, and PPTX edit and save in the shell stay Locked. `createDocumentSuiteHost` stays `test-only`. W1–W5 stay Locked. Absence of a Lead Ready declaration on W1 means Locked.

## What this chain does not close

- The v1.3.0 freeze is D47–D49 in `docs/DECISIONS-LEDGER.md` and the Lead-decisions follow-up. `browser.screenshot`, `workbench.view_open`, and the other under-discussion names stay unfrozen. Binding deletion has no id.
- `browser.dom_snapshot` and `file.page_target` admit on their test hosts and stay `test-only`. No shell, IPC, or Craft card caller exists for those two. The MCP Apps pane admits `workbench.sidebar_focus` and §13 labels that human path `wired`. Agent helpers stay `test-only`. The old verbs still refuse the payloads. Settings install, enable, and disable call `plugins:mutateLoadout` → `plugin.loadout_mutate` and the Craft card. §13 labels that caller `wired`. It is not `usable`.
- Settings plugin writes are `wired` under D49. There is no plugin marketplace and no standing loadout grant. The caller is not `usable`.
- No `usable` row. Only the Lead promotes `usable`. W0.1 stays Locked. Exit item 6 is D50. The other §3 exit items stay open.
- This note does not edit `docs/WAVE-MODULE-MAP.md` or `docs/OWNERSHIP-MATRIX.md`. D47–D49 are the ledger rows #39 added for this freeze.
