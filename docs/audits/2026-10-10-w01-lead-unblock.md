# W0.1 Lead-unblock packet

> **Date:** 2026-10-10
> **Base inspected:** `7c36bb6dd761fb9c719850cb0b59e61c9c8db248` (`work/fresh-base-spine` after merged PR #37)
> **What this file is:** the Lead decision list written after #37 for unflag, the action-id split, and Settings plugin writes. #39 landed the first two. Settings stays Locked.
> **Inventory:** `docs/audits/2026-10-10-w01-exit-checklist.md` records the chrome chain. This packet does not replace that inventory and does not check any exit item off.
> **Binding exit list:** `docs/WAVE-MODULE-MAP.md` §3. This packet does not edit that map. The nine exit items stay open.
> **Frozen table:** `docs/contracts/action-ids.md` is v1.3.0. `CONTRACT_VERSION` in `app/packages/shared/src/protocol/internal-action.ts` is `1.3.0`.
>
> **Status after #39 (`31b2e1b`):** D47 freezes `session.unflag`. §13 in `docs/modules/00-platform-spine.md` labels the human command `wired`. D48 freezes `plugin.loadout_mutate`, `file.page_target`, `browser.dom_snapshot`, and `workbench.sidebar_focus`. Those four ids have no production caller. D49 keeps Settings plugin writes Locked. The choice record is `docs/audits/2026-10-10-w01-lead-decisions-oss.md`. W0.1 stays Locked. This packet does not mark Ready or `usable`.
>
> **Status after the page-target host:** `update-target` admits `file.page_target` on the page-local host. No shell or IPC caller. §13 stays `test-only`. `file.update` still refuses that payload. Plugin loadout still sends `file.update`. W0.1 stays Locked. This note does not mark Ready or `usable`.
>
> **Status after the sidebar host:** open, focus, and close admit `workbench.sidebar_focus` on the MCP Apps test host. The row is L0, so there is no card. No shell or IPC caller. §13 stays `test-only`. `canvas.node_select` still refuses that payload. Plugin loadout still sends `file.update`. W0.1 stays Locked. This note does not mark Ready or `usable`.

## Gate status (unchanged)

W0.1 stays Locked for worker implementation. The Lead reconciliation row stays In Progress and blocking all Workers. This packet does not mark W0.1 or W1 Ready. It does not promote any row to `usable`. Settings plugin writes stay Locked. M00 stays capability `not implemented` and execution gate Locked. W1–W5, including W3A/W3B, stay Locked.

Ready cells in `docs/WAVE-MODULE-MAP.md` stay as they are. D47–D49 are in `docs/DECISIONS-LEDGER.md`.

## Landed worker-safe progress (#28–#37)

These merges are on the spine. They admit existing frozen ids, or they are docs. They add no action id. At that base `CONTRACT_VERSION` was `1.2.0`. #39 set it to `1.3.0`. Those merges do not unlock Settings and do not promote `usable`.

- **Chrome admits.** PRs #28 and #30–#33 and #35 admit frozen session chrome on the one Craft session kernel and journal `fleet_host_session_event` in `session.jsonl`: human flag, rename, status, and labels; agent status, labels, and `rename_session`; title generation; send-time auto-labels. PR #29 only records that `Locked` is an execution gate. §13 in `docs/modules/00-platform-spine.md` is the row source. Those `wired` labels are shell or live tool paths.
- **L2 card.** PR #36 admits frozen `workspace.rename` from Settings → Workspace name. The L2 row publishes the existing permission card. Allow writes the folder name. Deny, a credential-shaped name, and a missing session leave the name unchanged. That is the only production host-card caller. Other card publish and approve stay `test-only`.
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

**Landed in #39 (`31b2e1b`), D48.** v1.3.0 gives each operation below its own frozen id, with the policy columns from "W0.1 Re-freeze Requirements", and sets `CONTRACT_VERSION` to `1.3.0` in that same commit. No v1.2.0 id was renamed. The four ids are `plugin.loadout_mutate` (M12), `file.page_target` (M05), `browser.dom_snapshot` (M06), and `workbench.sidebar_focus` (M16). No production caller uses them. `browser.screenshot` and binding deletion stay unfrozen. The columns do not close the rest of exit item 3.

### Payloads the old verbs still refuse

`action-owner-policy.ts` remains the guard. `file.update`, `file.create`, and `canvas.node_select` still refuse these payloads.

| Operation the payload means | Verb the caller still sends | Refusal reason |
|---|---|---|
| Plugin loadout install, enable, disable, or grant | `file.update` (owner M05, file bytes) | `action_owner_mismatch:plugin_loadout` |
| DOM evidence snapshot | `file.create` (owner M05) | `action_owner_mismatch:dom_evidence` |
| MCP Apps sidebar focus | MCP Apps host sends `workbench.sidebar_focus` and stays `test-only`. `canvas.node_select` is still refused | `action_owner_mismatch:sidebar_focus` on `canvas.node_select` |
| Page-target write | page-local host sends `file.page_target` and stays `test-only`. `file.update` is still refused | `action_owner_mismatch:page_target` on `file.update` |

v1.3.0 also fills side-effect, approval, undo, cancellation, retry, and evidence columns on the frozen rows, including `aigc.job_submit` and `canvas.export_selection`. `browser.screenshot` stays under discussion. Binding deletion has no id. The required columns are listed under "W0.1 Re-freeze Requirements" in `docs/contracts/action-ids.md`.

The bump was minor: ids added, none renamed or removed, in the same commit as the table.

### The guard stays beside the new rows

`app/packages/shared/src/protocol/action-owner-policy.ts` still refuses the four payloads on the old verbs and does not upgrade an L1 id. That guard is the landed behavior from PR #28. v1.3.0 is the frozen table with matching owners and separate policy columns. The Lead kept the guard. Workers do not add further split ids, and they do not delete the guard, from this packet.

### Criteria the #39 commit met

1. Each operation's id is a row in the frozen Action Table, and the Owner Module matches the operation.
2. The row has the separate policy columns from "W0.1 Re-freeze Requirements".
3. `InternalActionId` and `CONTRACT_VERSION` changed in the same commit as that table.
4. No production caller was switched onto the new ids. Settings, the DOM capture, the MCP Apps host, and `update-target` still send the old verbs and still fail closed. That sentence is the #39 result. The page-local host now admits `file.page_target` and stays `test-only`. It does not send `file.update`. The MCP Apps host now admits `workbench.sidebar_focus` and stays `test-only`. It does not send `canvas.node_select`.
5. `action-owner-policy.ts` remains a guard beside the new rows.

Workers do not implement a production caller for these ids from this packet.

## 3. Settings plugin writes

**Settings stays Locked (D49).** #39 froze `plugin.loadout_mutate` and did not add a Settings caller. Install, enable, and disable on Settings → Plugins stay Locked until the acceptance tests in `docs/audits/2026-10-10-w01-lead-decisions-oss.md` pass, including the product/internal namespace (exit item 6 / BLK-002). This packet does not unlock Settings.

Today the page does not write `.claude-plugin/loadout.json`. It does not construct `createPluginSettingsHost` and does not call `applyPluginMutationFromHuman` or `resolvePluginGrant`. `SessionManager.applySessionPluginMutation` and `resolveSessionPluginGrant` build a `file.update` loadout request. Admission refuses that verb. No shell or IPC caller uses those methods, so the API stays `test-only`. §13 keeps "Plugin loadout install, enable, and disable from Settings" at `Locked`.

### D49 criteria still open

- The loadout id is `plugin.loadout_mutate`, owner M12, frozen in §2. A `file.update` request stays an owner mismatch.
- Exit item 6 and BLK-002 stay open: the product/internal namespace is still undecided. A Settings caller does not decide that namespace.
- The production caller, when it exists, is a Settings → Plugins shell control or an IPC/RPC handler that calls `SessionManager` on the existing session kernel. `createPluginSettingsHost` stays off that path so the page does not grow a second host.
- The frozen row publishes the existing permission card. There is no standing loadout grant.

### Acceptance criteria before the write is unlocked

All of these are true on the spine:

1. `plugin.loadout_mutate` is in the frozen table and `CONTRACT_VERSION` is `1.3.0` (met in #39). The product/internal namespace for that identifier is still unrecorded (exit item 6).
2. A production shell or IPC caller on Settings → Plugins invokes `SessionManager.applySessionPluginMutation` for install, enable, or disable with `plugin.loadout_mutate`.
3. That caller settles the card through `SessionManager.resolveSessionPluginGrant` and `sessions:respondToPermission`. Allow is the only path that writes `.claude-plugin/loadout.json`. Deny writes nothing.
4. `createPluginSettingsHost` is still not the production caller.
5. §13 may then label the caller that actually runs. `applySessionPluginMutation` and `resolveSessionPluginGrant` stay `test-only` in any commit that has no shell or IPC caller.

This packet leaves the methods `test-only` and the Settings rows `Locked`. A later unlock is not `usable` and does not close W0.1.

## 4. What still does not unblock W0.1, Ready, or usable

**W0.1 stays Locked.** The Lead has not closed `docs/WAVE-MODULE-MAP.md` §3 and has not changed W1 to Ready. Absence of that declaration means Locked. Only the Lead promotes a gate to Ready or a capability to `usable`. A documentation change does not promote capability.

The unflag freeze and the split-id freeze are on the spine. Settings stays Locked. The nine exit items stay open:

1. A clean Craft Agents OSS v0.11.0 baseline is still unrecorded. `docs/UPSTREAM-BASELINE.md` still requires that baseline before W1 packets.
2. The retain/adapt/drop/defer ledger for Fleet-only behaviour is still unrecorded (BLK-001).
3. Canonical parity for AgentSeat, identity, caller provenance, idempotency, revisions, typed events, and action policy is still open. An action-id bump covers only the action-id slice of this item.
4. ArtifactRef, capability manifest, ExternalJob, workflow, spatial, and view contracts are still unfrozen and not version-gated for their first consumer wave.
5. Physical persistence authority and recovery from `docs/PERSISTENCE-AUTHORITY-MAP.md` are still unrecorded as the W0.1 exit.
6. The product/internal namespace is still unresolved (BLK-002). A Settings plugin caller does not close it.
7. Ownership precedence and non-overlapping domains are still an open exit item.
8. Active packets still have to agree with the map and grant no Worker frozen-protocol writes.
9. W1 Ready is still undeclared. W1–W5, including W3A/W3B, stay Locked.

Also still closed to workers after #39:

- BLK-003 adapter spikes for Browser, Spatial, Media, Panel, Web, and Deck stay unrecorded.
- D46 stays unmet. The first-slide viewer is not a MotionDeck. Office edit and save stay Locked. M19 stays Locked.
- `file.delete` and `canvas.node_delete` still have no production shell or IPC caller. Generic permission-card rows stay `test-only` except Settings `workspace.rename`.
- M00's header stays `not implemented` and Locked. Nothing in PRs #28–#39 is `usable`.

## Worker rule

This file is a Lead decision list. It is not an implementation packet. Workers do not add action ids, do not bump `CONTRACT_VERSION`, do not unlock Settings, and do not edit `docs/DECISIONS-LEDGER.md` or Ready cells in `docs/WAVE-MODULE-MAP.md` from this note. W0.1 stays Locked until the Lead closes §3 of the map.
