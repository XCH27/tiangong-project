# W0.1 Lead-unblock packet

> **Date:** 2026-10-10
> **Base inspected:** `7c36bb6dd761fb9c719850cb0b59e61c9c8db248` (`work/fresh-base-spine` after merged PR #37)
> **Current base:** `9fdb881e` (`work/fresh-base-spine` after merged PR #49)
> **What this file is:** the Lead decision list written after #37 for unflag, the action-id split, and Settings plugin writes. #39 landed the first two. #41–#43 admit three of the split ids on test hosts and leave them `test-only`. #49 wires Settings install, enable, and disable through `plugins:mutateLoadout` → `plugin.loadout_mutate` and the Craft card. That caller is `wired`, not `usable`. W0.1 stays Locked.
> **Inventory:** `docs/audits/2026-10-10-w01-exit-checklist.md` records the chrome chain. This packet does not replace that inventory and does not check any exit item off.
> **Binding exit list:** `docs/WAVE-MODULE-MAP.md` §3. This packet does not edit that map. Exit item 6 was later decided by D50. The other exit items stay open.
> **Frozen table:** `docs/contracts/action-ids.md` is v1.3.0. `CONTRACT_VERSION` in `app/packages/shared/src/protocol/internal-action.ts` is `1.3.0`.
>
> **Status after #39 (`31b2e1b`):** D47 freezes `session.unflag`. §13 in `docs/modules/00-platform-spine.md` labels the human command `wired`. D48 freezes `plugin.loadout_mutate`, `file.page_target`, `browser.dom_snapshot`, and `workbench.sidebar_focus`. At that commit those four ids have no production caller. D49 keeps Settings plugin writes Locked. The choice record is `docs/audits/2026-10-10-w01-lead-decisions-oss.md`. W0.1 stays Locked. This packet does not mark Ready or `usable`.
>
> **Status after the DOM host:** `captureDomFromHuman` and `captureDomFromAgent` admit `browser.dom_snapshot` on the guest host. The row is L2, so an unapproved turn does not read the page. The host does not publish the Craft session card. No shell or IPC caller. §13 stays `test-only`. `file.create` still refuses that payload. At that host plugin loadout still sent `file.update`. W0.1 stays Locked. This note does not mark Ready or `usable`.
>
> **Status after the page-target host:** `update-target` admits `file.page_target` on the page-local host. The row is L2. The host does not publish the Craft session card. No shell or IPC caller. §13 stays `test-only`. `file.update` still refuses that payload. At that host plugin loadout still sent `file.update`. W0.1 stays Locked. This note does not mark Ready or `usable`.
>
> **Status after the sidebar host:** open, focus, and close admit `workbench.sidebar_focus` on the MCP Apps test host. The row is L0, so there is no card and the host does not publish the Craft session card. No shell or IPC caller. §13 stays `test-only`. `canvas.node_select` still refuses that payload. At that host plugin loadout still sent `file.update`. W0.1 stays Locked. This note does not mark Ready or `usable`.
>
> **Status after #43 (`92ee3ea5`):** `browser.dom_snapshot`, `file.page_target`, and `workbench.sidebar_focus` admit on their test hosts. §13 stays `test-only` for each. None has a shell or IPC caller. None publishes the Craft session card. The old verbs still refuse those payloads. At that commit `plugin.loadout_mutate` has no caller. Settings stays Locked. W0.1 stays Locked. Nothing in #41–#43 is `usable`.
>
> **Status after D50 (2026-10-10):** BLK-002 is closed as a name decision. The strings are `docs/audits/2026-10-10-blk002-namespace-oss.md`. D49 criterion 2 is met. At that record Settings stayed Locked. The other §3 exit items stay open. This packet does not mark Ready or `usable`.
>
> **Status after the loadout host:** `SessionManager.applySessionPluginMutation` and `resolveSessionPluginGrant` admit `plugin.loadout_mutate`. The row is L2, so an unapproved call does not write. `op: grant` is `standing_grant_rejected`. At that host there was no shell or IPC caller, so §13 stayed `test-only`. `file.update` still refuses that payload. Settings stayed Locked. D50 is unchanged. W0.1 stays Locked. This note does not mark Ready or `usable`.
>
> **Status after the sidebar shell:** the MCP Apps pane constructs one host. Human open, focus, and close admit `workbench.sidebar_focus`. §13 labels that path `wired`. Agent helpers stay `test-only`. Settings does not construct the host. DOM capture and page-target stay `test-only`. `canvas.node_select` still refuses the payload. W0.1 stays Locked. This note does not mark Ready or `usable`.
>
> **Status after the v0.11 pin (D51/D52):** the tag pin and the behaviour ledger are `docs/audits/2026-10-10-w01-v011-baseline-blk001.md`. Exit items 1 and 2 stay open. BLK-001 stays open. W0.1 stays Locked. This note does not mark Ready or `usable`.
>
> **Status after the Settings plugin caller (#49 `9fdb881e`):** Settings install, enable, and disable are `wired`. The page calls `plugins:mutateLoadout`. That handler calls `SessionManager.applySessionPluginMutation` with `plugin.loadout_mutate` and publishes the Craft session permission card. Allow and Deny settle through `resolveSessionPluginGrant` and `sessions:respondToPermission`. Allow writes the skills and MCP sources the agent loads. Deny writes nothing. §13 labels that caller `wired`. `createPluginSettingsHost` stays `test-only`. `file.update` still refuses the payload. `op: grant` stays `standing_grant_rejected`. The caller is not `usable`. W0.1 stays Locked. This note does not mark Ready.

## Gate status (unchanged)

W0.1 stays Locked for worker implementation. The Lead reconciliation row stays In Progress and blocking all Workers. This packet does not mark W0.1 or W1 Ready. It does not promote any row to `usable`. The Settings plugin caller is `wired` and is not `usable`. M00 stays capability `not implemented` and execution gate Locked. W1–W5, including W3A/W3B, stay Locked.

Ready cells in `docs/WAVE-MODULE-MAP.md` stay as they are. D47–D49 are in `docs/DECISIONS-LEDGER.md`.

## Landed worker-safe progress (#28–#37)

These merges are on the spine. They admit existing frozen ids, or they are docs. They add no action id. At that base `CONTRACT_VERSION` was `1.2.0`. #39 set it to `1.3.0`. Those merges do not unlock Settings and do not promote `usable`.

- **Chrome admits.** PRs #28 and #30–#33 and #35 admit frozen session chrome on the one Craft session kernel and journal `fleet_host_session_event` in `session.jsonl`: human flag, rename, status, and labels; agent status, labels, and `rename_session`; title generation; send-time auto-labels. PR #29 only records that `Locked` is an execution gate. §13 in `docs/modules/00-platform-spine.md` is the row source. Those `wired` labels are shell or live tool paths.
- **L2 card.** PR #36 admits frozen `workspace.rename` from Settings → Workspace name. The L2 row publishes the existing permission card. Allow writes the folder name. Deny, a credential-shaped name, and a missing session leave the name unchanged. At those merges it was the only production host-card caller. Settings plugin install, enable, and disable are the later Craft-card caller and §13 labels them `wired`. Other card publish and approve stay `test-only`.
- **D46 footnote.** PR #37 records the footnote in `docs/modules/19-presentation-motion-surface.md` §10. The shell PPTX overlay is a first-slide text viewer. D46 stays Final and unmet. Office edit and save stay Locked. MotionDeck stays Locked.
- **No L3 shell delete caller.** After `25e53895`, Electron, `SessionManager`, and the RPC handlers still have no production caller for frozen `file.delete` or `canvas.node_delete`. `sessions:delete`, `skills:delete`, and `sources:delete` are not `file.delete`. No permission card was wired for either id.

## 1. Unflag admission

**Landed in #39 (`31b2e1b`), D47.** `session.unflag` is a row in the frozen Action Table and in `InternalActionId`. `CONTRACT_VERSION` is `1.3.0` in that same commit. The row matches `session.flag`: L0, undo supported, no permission card. `unflagSession` admits that id on the Craft session kernel, journals `fleet_host_session_event` in `session.jsonl`, and a refused admit leaves the flag set. §13 labels the row `wired`. The admit is one chrome row. It does not close W0.1 and it is not `usable`.

### What that commit recorded

- One new row in the frozen Action Table, not only in Actions Under Discussion.
- The same string in `InternalActionId`.
- `CONTRACT_VERSION` bumped in that same commit, a minor bump from `1.2.0` to `1.3.0`. No id was renamed or removed. The table header and the constant match.
- Surface, Permission, Destructive, Undo, and Owner Module are filled. The row matches `session.flag` (L0, undo supported, no card).

### Criteria the #39 commit met

1. The chosen id is a row in the frozen Action Table.
2. `InternalActionId` contains that same string.
3. `CONTRACT_VERSION` and the action-ids version header changed in the same commit as that row.
4. The admit uses that frozen id, journals `fleet_host_session_event` in `session.jsonl`, and follows the frozen permission and undo cells.
5. A refused admit leaves the flag set.

## 2. Action-id re-freeze

**Landed in #39 (`31b2e1b`), D48.** v1.3.0 gives each operation below its own frozen id, with the policy columns from "W0.1 Re-freeze Requirements", and sets `CONTRACT_VERSION` to `1.3.0` in that same commit. No v1.2.0 id was renamed. The four ids are `plugin.loadout_mutate` (M12), `file.page_target` (M05), `browser.dom_snapshot` (M06), and `workbench.sidebar_focus` (M16). #41–#43 admit `browser.dom_snapshot`, `file.page_target`, and `workbench.sidebar_focus` on their test hosts. DOM capture and page-target stay `test-only`: no shell or IPC caller, and no Craft session card. The MCP Apps pane is the human caller for `workbench.sidebar_focus`. Agent helpers stay `test-only`. Settings install, enable, and disable call `plugins:mutateLoadout`, which admits `plugin.loadout_mutate` and publishes the Craft session card. §13 labels that caller `wired`. It is not `usable`. `browser.screenshot` and binding deletion stay unfrozen. The columns do not close the rest of exit item 3.

### Payloads the old verbs still refuse

`action-owner-policy.ts` remains the guard. `file.update`, `file.create`, and `canvas.node_select` still refuse these payloads.

| Operation the payload means | Caller | Refusal reason |
|---|---|---|
| Plugin loadout install, enable, or disable | Settings calls `plugins:mutateLoadout` → `plugin.loadout_mutate` and the Craft card. §13 labels that caller `wired`. `file.update` is still refused. `op: grant` is `standing_grant_rejected` | `action_owner_mismatch:plugin_loadout` on `file.update` |
| DOM evidence snapshot | guest host sends `browser.dom_snapshot` and stays `test-only`. `file.create` is still refused | `action_owner_mismatch:dom_evidence` on `file.create` |
| MCP Apps sidebar focus | The pane constructs the host and admits `workbench.sidebar_focus`. Agent helpers stay `test-only`. `canvas.node_select` is still refused | `action_owner_mismatch:sidebar_focus` on `canvas.node_select` |
| Page-target write | page-local host sends `file.page_target` and stays `test-only`. `file.update` is still refused | `action_owner_mismatch:page_target` on `file.update` |

v1.3.0 also fills side-effect, approval, undo, cancellation, retry, and evidence columns on the frozen rows, including `aigc.job_submit` and `canvas.export_selection`. `browser.screenshot` stays under discussion. Binding deletion has no id. The required columns are listed under "W0.1 Re-freeze Requirements" in `docs/contracts/action-ids.md`.

The bump was minor: ids added, none renamed or removed, in the same commit as the table.

### The guard stays beside the new rows

`app/packages/shared/src/protocol/action-owner-policy.ts` still refuses the four payloads on the old verbs and does not upgrade an L1 id. That guard is the landed behavior from PR #28. v1.3.0 is the frozen table with matching owners and separate policy columns. The Lead kept the guard. Workers do not add further split ids, and they do not delete the guard, from this packet.

### Criteria the #39 commit met

1. Each operation's id is a row in the frozen Action Table, and the Owner Module matches the operation.
2. The row has the separate policy columns from "W0.1 Re-freeze Requirements".
3. `InternalActionId` and `CONTRACT_VERSION` changed in the same commit as that table.
4. No production caller was switched onto the new ids. Settings, the DOM capture, the MCP Apps host, and `update-target` still send the old verbs and still fail closed. That sentence is the #39 result. The guest host now admits `browser.dom_snapshot` and stays `test-only`. It does not send `file.create` and it does not publish the Craft session card. The page-local host now admits `file.page_target` and stays `test-only`. It does not send `file.update` and it does not publish the Craft session card. The MCP Apps pane constructs the host and admits `workbench.sidebar_focus`. It does not send `canvas.node_select` and it does not publish the Craft session card. Agent helpers stay `test-only`. The SessionManager plugin path admits `plugin.loadout_mutate`. Settings → Plugins is the shell and IPC caller and §13 labels it `wired`. It does not send `file.update`. It is not `usable`.
5. `action-owner-policy.ts` remains a guard beside the new rows.

Workers do not add another production caller for these ids from this packet.

## 3. Settings plugin writes

**Settings plugin caller is `wired` (D49).** #39 froze `plugin.loadout_mutate` and did not add a Settings caller. D50 meets the namespace criterion. The acceptance tests in `docs/audits/2026-10-10-w01-lead-decisions-oss.md` now pass. Install, enable, and disable call `plugins:mutateLoadout`. That handler calls `SessionManager.applySessionPluginMutation`. Allow and Deny settle through `resolveSessionPluginGrant` and `sessions:respondToPermission`. Allow writes the catalog the agent loads. Deny writes nothing. The page does not construct `createPluginSettingsHost` and does not call `applyPluginMutationFromHuman` or `resolvePluginGrant`. The row is L2, so an unapproved call does not write. `op: grant` is `standing_grant_rejected`. §13 labels the caller `wired`. It is not `usable`. This packet does not open W0.1.

### D49 criteria the caller met

- The loadout id is `plugin.loadout_mutate`, owner M12, frozen in §2. A `file.update` request stays an owner mismatch.
- Exit item 6 and BLK-002 are closed as a name decision by D50. The Settings caller does not decide that namespace, and D50 does not add one.
- The production caller is Settings → Plugins through `plugins:mutateLoadout`, which calls `SessionManager` on the existing session kernel. `createPluginSettingsHost` stays off that path so the page does not grow a second host.
- The frozen row publishes the existing Craft permission card. There is no standing loadout grant.

### Acceptance criteria the write met

All of these are true on the spine:

1. `plugin.loadout_mutate` is in the frozen table and `CONTRACT_VERSION` is `1.3.0` (met in #39). The product/internal namespace for that identifier is D50 (exit item 6). That record does not by itself add the caller.
2. A production shell or IPC caller on Settings → Plugins invokes `SessionManager.applySessionPluginMutation` for install, enable, or disable with `plugin.loadout_mutate`.
3. That caller settles the card through `SessionManager.resolveSessionPluginGrant` and `sessions:respondToPermission`. Allow is the only path that writes `.claude-plugin/loadout.json`. Deny writes nothing.
4. `createPluginSettingsHost` is still not the production caller.
5. §13 labels the caller `wired`. `applySessionPluginMutation` and `resolveSessionPluginGrant` stay `test-only` only when no shell or IPC caller exists. This spine has that caller.

The Settings caller is `wired`. `createPluginSettingsHost` stays `test-only`. The caller is not `usable` and does not close W0.1.

## 4. What still does not unblock W0.1, Ready, or usable

**W0.1 stays Locked.** The Lead has not closed `docs/WAVE-MODULE-MAP.md` §3 and has not changed W1 to Ready. Absence of that declaration means Locked. Only the Lead promotes a gate to Ready or a capability to `usable`. A documentation change does not promote capability.

The unflag freeze and the split-id freeze are on the spine. `browser.dom_snapshot` and `file.page_target` admit on their test hosts and stay `test-only`. The MCP Apps pane admits `workbench.sidebar_focus` and §13 labels that human path `wired`. Settings → Plugins admits `plugin.loadout_mutate` and §13 labels that caller `wired`. Exit item 6 is D50. The other exit items stay open:

1. The v0.11.0 pin is D51. The Mac source tree is recorded in `docs/audits/2026-10-10-w01-exit1-mac-checkout.md`. After #51, non-frozen `bun install` finished and `typecheck:all` failed (exit 2). No typecheck fix is recorded. After #52, Electron launch and relaunch are recorded in `docs/audits/2026-10-10-w01-exit1-electron-launch.md`. After #53, `docs/audits/2026-10-10-w01-exit1-rpc-loop.md` records RPC `projects:create`, one `sessions:sendMessage` (assistant content `pong`), and `browser-pane:create`. After #54, `docs/audits/2026-10-10-w01-exit1-routes-migration.md` records `route=board` and `route=settings` restores and branch `fleet/migration-from-v0.11.0` open on the pin. Those restores are not an AX click and not a menu click. Adapt ports are not started. Fleet `app/` stays `0.10.5`. `typecheck:all` remains the #52 failure. `docs/UPSTREAM-BASELINE.md` still requires the remaining validation before W1 packets. Exit item 1 stays open. Docs decides whether the route restores and the opened branch meet the remaining UI and migration bullets.
2. The behaviour ledger is D52. `fleet-old` rows, the file-by-file `app/` diff, and contract parity are still open, so BLK-001 stays open.
3. Canonical parity for AgentSeat, identity, caller provenance, idempotency, revisions, typed events, and action policy is still open. `docs/audits/2026-10-10-w01-exit3-canonical-parity.md` records the action-id slice as frozen at 1.3.0 and the other fields as partial. `CONTRACT_VERSION` stays 1.3.0. An action-id bump covers only the action-id slice of this item.
4. ArtifactRef, capability manifest, ExternalJob, workflow, spatial, and view contracts are still unfrozen and not version-gated for their first consumer wave.
5. Physical persistence authority and recovery from `docs/PERSISTENCE-AUTHORITY-MAP.md` are still unrecorded as the W0.1 exit.
6. The product/internal namespace is D50 (BLK-002 closed as a name decision). The Settings plugin caller is `wired` and is not a W0.1 close.
7. Ownership precedence and non-overlapping domains are still an open exit item.
8. Active packets still have to agree with the map and grant no Worker frozen-protocol writes.
9. W1 Ready is still undeclared. W1–W5, including W3A/W3B, stay Locked.

Also still closed to workers after #49:

- BLK-003 adapter spikes for Browser, Spatial, Media, Panel, Web, and Deck stay unrecorded.
- D46 stays unmet. The first-slide viewer is not a MotionDeck. Office edit and save stay Locked. M19 stays Locked.
- `file.delete` and `canvas.node_delete` still have no production shell or IPC caller. Generic permission-card rows stay `test-only` except Settings `workspace.rename` and Settings `plugin.loadout_mutate`. DOM capture, page-target, and the MCP Apps pane do not publish that card.
- M00's header stays `not implemented` and Locked. Nothing in PRs #28–#43 is `usable`. DOM capture and page-target stay `test-only`. The MCP Apps human path is `wired` and is not `usable`. Settings → Plugins calls `applySessionPluginMutation` and is `wired`, not `usable`.

## Worker rule

This file is a Lead decision list. It is not an implementation packet. Workers do not add action ids, do not bump `CONTRACT_VERSION`, do not promote the Settings caller to `usable`, and do not edit `docs/DECISIONS-LEDGER.md` or Ready cells in `docs/WAVE-MODULE-MAP.md` from this note. W0.1 stays Locked until the Lead closes §3 of the map.
