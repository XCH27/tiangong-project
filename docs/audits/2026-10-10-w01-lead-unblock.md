# W0.1 Lead-unblock packet

> **Date:** 2026-10-10
> **Base inspected:** `7c36bb6dd761fb9c719850cb0b59e61c9c8db248` (`work/fresh-base-spine` after merged PR #37)
> **What this file is:** the Lead decision list for three slices that workers still cannot start. Each slice says what the Lead must freeze, and the acceptance criteria a later worker commit must meet.
> **Inventory:** `docs/audits/2026-10-10-w01-exit-checklist.md` records the chrome chain. This packet does not replace that inventory and does not check any exit item off.
> **Binding exit list:** `docs/WAVE-MODULE-MAP.md` §3. This packet does not edit that map.
> **Frozen table:** `docs/contracts/action-ids.md` stays v1.2.0. This packet adds no row and does not bump `CONTRACT_VERSION`.

## Gate status (unchanged)

W0.1 stays Locked for worker implementation. The Lead reconciliation row stays In Progress and blocking all Workers. This packet does not mark W0.1 or W1 Ready. It does not promote any row to `usable`. Settings plugin writes stay Locked. M00 stays capability `not implemented` and execution gate Locked. W1–W5, including W3A/W3B, stay Locked.

`docs/DECISIONS-LEDGER.md` and the Ready cells in `docs/WAVE-MODULE-MAP.md` stay as they are.

## Landed worker-safe progress (#28–#37)

These merges are on the spine. They admit existing frozen ids, or they are docs. They add no action id, do not bump `CONTRACT_VERSION` (still `1.2.0` in `app/packages/shared/src/protocol/internal-action.ts`), do not unlock Settings, and do not promote `usable`.

- **Chrome admits.** PRs #28 and #30–#33 and #35 admit frozen session chrome on the one Craft session kernel and journal `fleet_host_session_event` in `session.jsonl`: human flag, rename, status, and labels; agent status, labels, and `rename_session`; title generation; send-time auto-labels. PR #29 only records that `Locked` is an execution gate. §13 in `docs/modules/00-platform-spine.md` is the row source. Those `wired` labels are shell or live tool paths.
- **L2 card.** PR #36 admits frozen `workspace.rename` from Settings → Workspace name. The L2 row publishes the existing permission card. Allow writes the folder name. Deny, a credential-shaped name, and a missing session leave the name unchanged. That is the only production host-card caller. Other card publish and approve stay `test-only`.
- **D46 footnote.** PR #37 records the footnote in `docs/modules/19-presentation-motion-surface.md` §10. The shell PPTX overlay is a first-slide text viewer. D46 stays Final and unmet. Office edit and save stay Locked. MotionDeck stays Locked.
- **No L3 shell delete caller.** After `25e53895`, Electron, `SessionManager`, and the RPC handlers still have no production caller for frozen `file.delete` or `canvas.node_delete`. `sessions:delete`, `skills:delete`, and `sources:delete` are not `file.delete`. No permission card was wired for either id.

## 1. Unflag admission

**Blocked until Lead** freezes one action id for `unflagSession` in the frozen Action Table of `docs/contracts/action-ids.md`, and bumps `CONTRACT_VERSION` in `app/packages/shared/src/protocol/internal-action.ts`, in the **same commit**.

The command today clears `isFlagged` and does not call `admitHostTurn`. §13 labels that row `not implemented`. The string `session.unflag` is a name for this decision. It is not in the frozen table and it is not in the under-discussion list. This packet does not add it to either list. The Lead chooses the id string, including whether that string is `session.unflag`.

### Lead decision in that commit

- One new row in the frozen Action Table, not only in Actions Under Discussion.
- The same string added to `InternalActionId`.
- `CONTRACT_VERSION` bumped in that same commit. A new id with no rename and no removal is a minor bump from `1.2.0` to `1.3.0`. A rename or removal in that commit is a major bump to `2.0.0`. The table header and the constant match.
- The row fills Surface, Permission, Destructive, Undo, and Owner Module. The Lead records whether the row matches `session.flag` (L0, undo supported, no card) or differs. This packet does not fill those cells.

### Acceptance criteria before a worker admits unflag

A worker may change `unflagSession` to admit on the existing session kernel only when all of these are true on the spine:

1. The chosen id is a row in the frozen Action Table.
2. `InternalActionId` contains that same string.
3. `CONTRACT_VERSION` and the action-ids version header changed in the same commit as that row.
4. The admit uses that frozen id, journals `fleet_host_session_event` in `session.jsonl`, and follows the frozen permission and undo cells (card when the row requires approval; auto-admit only when the row already carries an undo contract).
5. A refused admit leaves the flag set.

Until that commit is on the spine, workers leave `unflagSession` off `admitHostTurn`. The admit, once it lands, is one chrome row. It does not close W0.1 and it is not `usable`.

## 2. Action-id re-freeze

**Blocked until Lead** re-freezes `docs/contracts/action-ids.md` so each operation has an id whose owner matches the operation, with the policy columns in that file's "W0.1 Re-freeze Requirements", and bumps `CONTRACT_VERSION` in the **same commit**.

### Overloaded verbs the Lead splits

Frozen v1.2.0 still carries these operations on ids owned by a different module. Admission refuses them. The Lead's re-freeze gives each operation its own frozen id, or explicitly retires it. This packet does not choose the replacement strings.

| Operation the payload means | Frozen id callers use today | Refusal reason |
|---|---|---|
| Plugin loadout install, enable, disable, or grant | `file.update` (owner M05, file bytes) | `action_owner_mismatch:plugin_loadout` |
| DOM evidence snapshot | `file.create` (owner M05) | `action_owner_mismatch:dom_evidence` |
| MCP Apps sidebar focus | `canvas.node_select` (owner M07) | `action_owner_mismatch:sidebar_focus` |
| Page-target write | `file.update` (owner M05) | `action_owner_mismatch:page_target` |

The same re-freeze also separates risk, approval, undo, cancellation, retry, and evidence on the ids the composable-workspace notice already names as coupled: `aigc.job_submit`, exports, screenshots, and binding deletion. Required columns are already listed under "W0.1 Re-freeze Requirements": side-effect/risk class, approval policy, undo policy, cancellation policy, retry/idempotency policy, evidence policy, allowed callers, and input/output schema versions.

Adding ids is a minor bump. Renaming or removing an existing id is a major bump. Both happen in the same commit as the table.

### Owner-mismatch heuristics are not the re-freeze

`app/packages/shared/src/protocol/action-owner-policy.ts` is a payload guard on frozen v1.2.0. It refuses the four payloads above and does not upgrade an L1 id. That guard is the landed behavior from PR #28. The contract re-freeze is a new frozen table with matching owners and separate policy columns. A new refusal reason, or a test that still denies these payloads, does not satisfy the re-freeze. Workers do not add split ids, and they do not delete the guard, from this packet.

### Acceptance criteria before a worker consumes a split id

1. The operation's id is a row in the frozen Action Table, and the Owner Module matches the operation.
2. The row has the separate policy columns from "W0.1 Re-freeze Requirements".
3. `InternalActionId` and `CONTRACT_VERSION` changed in the same commit as that table.
4. The worker admit uses the new id. It does not send the operation as `file.update`, `file.create`, or `canvas.node_select`.
5. The Lead has said whether `action-owner-policy.ts` remains a guard beside the new rows.

Until that commit is on the spine, these refusals stay a guard. Workers do not implement the split operations.

## 3. Settings plugin writes

**Blocked until Lead** unlocks Settings → Plugins install, enable, and disable with a real shell or IPC caller on the Craft session kernel. This packet does not unlock Settings.

Today the page does not write `.claude-plugin/loadout.json`. It does not construct `createPluginSettingsHost` and does not call `applyPluginMutationFromHuman` or `resolvePluginGrant`. `SessionManager.applySessionPluginMutation` and `resolveSessionPluginGrant` build a `file.update` loadout request. Admission refuses that verb. No shell or IPC caller uses those methods, so the API stays `test-only`. §13 keeps "Plugin loadout install, enable, and disable from Settings" at `Locked`.

### Lead decision

- The loadout write uses a frozen id whose owner is the plugin operation. That id comes from the re-freeze in §2. It is not a `file.update` request that the owner-mismatch guard happens to allow.
- Exit item 6 and BLK-002 stay in force: the product/internal namespace is decided before plugin/storage API identifiers freeze. A Settings caller does not decide that namespace.
- The production caller is a Settings → Plugins shell control or an IPC/RPC handler that calls `SessionManager` on the existing session kernel. `createPluginSettingsHost` stays off that path so the page does not grow a second host.
- The frozen permission cell says whether the turn publishes the existing permission card. There is no standing loadout grant unless the Lead's row says so.

### Acceptance criteria before the write is unlocked

All of these are true on the spine:

1. The frozen table contains the Lead-chosen loadout id, `CONTRACT_VERSION` bumped in that same commit, and the namespace decision for that identifier is recorded (exit item 6).
2. A production shell or IPC caller on Settings → Plugins invokes `SessionManager.applySessionPluginMutation` for install, enable, or disable.
3. When the frozen row requires approval, that same caller settles the card through `SessionManager.resolveSessionPluginGrant` and `sessions:respondToPermission`. Allow is the only path that writes `.claude-plugin/loadout.json`. Deny writes nothing.
4. `createPluginSettingsHost` is still not the production caller.
5. §13 may then label the caller that actually runs. `applySessionPluginMutation` and `resolveSessionPluginGrant` stay `test-only` in any commit that has no shell or IPC caller.

This packet leaves the methods `test-only` and the Settings rows `Locked`. A later unlock is not `usable` and does not close W0.1.

## 4. What still does not unblock W0.1, Ready, or usable

**Blocked until Lead** records the W0.1 exit in `docs/WAVE-MODULE-MAP.md` §3 and explicitly changes W1 to Ready. Absence of that declaration means Locked. Only the Lead promotes a gate to Ready or a capability to `usable`. A documentation change does not promote capability.

The three decisions above can all land and still leave W0.1 Locked. They do not satisfy the nine exit items:

1. A clean Craft Agents OSS v0.11.0 baseline is still unrecorded. `docs/UPSTREAM-BASELINE.md` still requires that baseline before W1 packets.
2. The retain/adapt/drop/defer ledger for Fleet-only behaviour is still unrecorded (BLK-001).
3. Canonical parity for AgentSeat, identity, caller provenance, idempotency, revisions, typed events, and action policy is still open. An action-id bump covers only the action-id slice of this item.
4. ArtifactRef, capability manifest, ExternalJob, workflow, spatial, and view contracts are still unfrozen and not version-gated for their first consumer wave.
5. Physical persistence authority and recovery from `docs/PERSISTENCE-AUTHORITY-MAP.md` are still unrecorded as the W0.1 exit.
6. The product/internal namespace is still unresolved (BLK-002). A Settings plugin caller does not close it.
7. Ownership precedence and non-overlapping domains are still an open exit item.
8. Active packets still have to agree with the map and grant no Worker frozen-protocol writes.
9. W1 Ready is still undeclared. W1–W5, including W3A/W3B, stay Locked.

Also still closed to workers after those three Lead actions:

- BLK-003 adapter spikes for Browser, Spatial, Media, Panel, Web, and Deck stay unrecorded.
- D46 stays unmet. The first-slide viewer is not a MotionDeck. Office edit and save stay Locked. M19 stays Locked.
- `file.delete` and `canvas.node_delete` still have no production shell or IPC caller. Generic permission-card rows stay `test-only` except Settings `workspace.rename`.
- M00's header stays `not implemented` and Locked. Nothing in PRs #28–#37 is `usable`.

## Worker rule

This file is a Lead decision list. It is not an implementation packet. Workers do not add action ids, do not bump `CONTRACT_VERSION`, do not unlock Settings, and do not edit `docs/DECISIONS-LEDGER.md` or Ready cells in `docs/WAVE-MODULE-MAP.md` from this note. W0.1 stays Locked until the Lead closes §3 of the map.
