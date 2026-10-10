# W0.1 exit checklist — session chrome after PRs #28–#33

> **Date:** 2026-10-10
> **Base inspected:** `4f12779d` (`work/fresh-base-spine` after merged PR #33)
> **Current base:** `92ee3ea5` (`work/fresh-base-spine` after merged PR #43)
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
> **Lead decisions after #39 (`31b2e1b`):** `docs/audits/2026-10-10-w01-lead-decisions-oss.md` and D47–D49 in `docs/DECISIONS-LEDGER.md`. The freeze is on the spine. `CONTRACT_VERSION` is 1.3.0. `session.unflag` is frozen and §13 labels the human command `wired` (D47). At that commit, `plugin.loadout_mutate`, `file.page_target`, `browser.dom_snapshot`, and `workbench.sidebar_focus` are frozen and have no production caller (D48). Settings plugin writes stay Locked (D49). W0.1 stays Locked. The nine exit items in `docs/WAVE-MODULE-MAP.md` §3 stay open. This note does not mark Ready or `usable`.
>
> **Follow-up (DOM snapshot):** The guest host `captureDomFromHuman` and `captureDomFromAgent` admit frozen `browser.dom_snapshot`. The row is L2. The request does not set `preAuthorizedBy`. An unapproved turn does not read the page. Allow is the only path that reads. Deny and stop read nothing. The host does not publish the Craft session card. No shell or IPC caller, so §13 stays `test-only`. `file.create` still refuses the payload. This note does not close W0.1 and does not promote `usable`.
>
> **Follow-up (page target):** The page-local host `update-target` admits frozen `file.page_target`. The row is L2. The request does not set `preAuthorizedBy`. A missing `baseRevision` is not admitted. Allow is the only path that writes. Deny and stop write nothing. The host does not publish the Craft session card. `file.update` still refuses the payload. `EditPopover` does not call the host, so §13 stays `test-only`. This note does not close W0.1 and does not promote `usable`.
>
> **Follow-up (sidebar focus):** The MCP Apps test host admits frozen `workbench.sidebar_focus` for open, focus, and close. The row is L0, so the turn does not wait for a card and does not publish the Craft session card. The Electron pane does not construct `createMcpAppsHost`, so §13 stays `test-only`. `canvas.node_select` still refuses the payload. This note does not close W0.1 and does not promote `usable`.
>
> **Follow-up after #41–#43 (`92ee3ea5`):** `browser.dom_snapshot`, `file.page_target`, and `workbench.sidebar_focus` admit on their test hosts. §13 labels each `test-only`. None of the three has a shell or IPC caller, and none publishes the Craft session card. `file.create`, `file.update`, and `canvas.node_select` still refuse those payloads. `plugin.loadout_mutate` still has no caller. Settings plugin writes stay Locked. W0.1 stays Locked. Nothing in those admits is `usable`.

## Gate status (unchanged)

W0.1 stays Locked for worker implementation. `docs/WAVE-MODULE-MAP.md` still records the Lead reconciliation row as In Progress and blocking all Workers. This note does not close that row and does not mark W0.1 or W1 Ready.

`docs/modules/00-platform-spine.md` header stays capability `not implemented` and execution gate Locked. Nothing in this checklist is `usable`. Settings plugin writes stay Locked (D49). The #39 freeze is CONTRACT 1.3.0, recorded as D47–D49. PRs #28–#33 themselves added no action id. PRs #41–#43 add no action id. Those three hosts stay `test-only`.

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

The map's nine exit items stay open. BLK-001 (migration ledger and contract parity), BLK-002 (product/internal namespace), and BLK-003 (adapter spikes) are still the named blockers. `docs/UPSTREAM-BASELINE.md` still records `app/` short of the clean v0.11.0 baseline and still requires a retain/adapt/drop/defer ledger before W1 packets. Session chrome does not supply that evidence.

These slices stay blocked inside that exit, except agent rename and unflag, which are their own §13 `wired` rows. A worker must not implement the remaining items from this note.

1. **Unflag.** Closed as its own §13 `wired` row by the Lead freeze of `session.unflag` in v1.3.0. A refused admit leaves the flag set. This row does not close W0.1.

2. **Permission-card publish and approve, other than Settings workspace rename.** The generic §13 rows stay `test-only`. Settings workspace rename is the L2 shell caller and has its own `wired` row: Allow writes the folder name, and Deny or a missing session leaves it. A search after `25e53895` found no production shell or IPC caller for `file.delete` or `canvas.node_delete`, so neither id publishes a card. Shell `file.delete` is `not implemented` in §13. Canvas delete stays on the `test-only` card host. Session chrome that is L0 or L1-with-undo still does not publish a card.

3. **Settings plugin writes.** Install, enable, and disable on Settings → Plugins stay Locked (D49). `plugin.loadout_mutate` is frozen. The page does not call it and does not write `.claude-plugin/loadout.json`. `SessionManager.applySessionPluginMutation` and `resolveSessionPluginGrant` stay `test-only`: they still build a `file.update` loadout request, and admission refuses that verb.

4. **Agent `session.rename`.** Closed as its own §13 `wired` row by `rename_session`. A blank or missing caller does not write the name. Title generation still uses the desktop user and is not this row. This item no longer blocks W0.1. Unflag is the other closed slice in this list. The remaining items stay open.

5. **Action-id owner mismatch.** v1.3.0 gives `plugin.loadout_mutate`, `file.page_target`, `browser.dom_snapshot`, and `workbench.sidebar_focus` their own rows and policy columns. The old verbs still refuse those payloads. The guest host admits `browser.dom_snapshot`, the page-local host admits `file.page_target`, and the MCP Apps host admits `workbench.sidebar_focus`. Each of those three stays `test-only` in §13: no shell or IPC caller, and no Craft session card. `plugin.loadout_mutate` still has no caller. `browser.screenshot` and binding deletion stay unfrozen. The columns do not close the rest of exit item 3.

6. **D46 PPTX.** D46 in `docs/DECISIONS-LEDGER.md` is still Final: the native document is a MotionDeck, and PPTX, HTML, and video are explicit exports. The shell PPTX overlay is a first-slide text viewer (`wired` preview). Create, edit, undo, save, and reopen through the document host stay `test-only`. Office edit and save in the shell stay Locked. MotionDeck, animation, and a full slide editor stay Locked. M19's header stays Locked. The first-slide viewer leaves D46 unmet. The footnote is `docs/modules/19-presentation-motion-surface.md` §10. This note does not edit the ledger.

7. **Office edit and save, and W1–W5.** DOCX, XLSX, and PPTX edit and save in the shell stay Locked. `createDocumentSuiteHost` stays `test-only`. W1–W5 stay Locked. Absence of a Lead Ready declaration on W1 means Locked.

## What this chain does not close

- The v1.3.0 freeze is D47–D49 in `docs/DECISIONS-LEDGER.md` and the Lead-decisions follow-up. `browser.screenshot`, `workbench.view_open`, and the other under-discussion names stay unfrozen. Binding deletion has no id.
- `browser.dom_snapshot`, `file.page_target`, and `workbench.sidebar_focus` admit on their test hosts and stay `test-only`. No shell, IPC, or Craft card caller exists for those three. The old verbs still refuse the payloads. `plugin.loadout_mutate` still has no caller.
- Settings plugin writes stay Locked under D49. There is no plugin marketplace and no standing loadout grant.
- No `usable` row. Only the Lead promotes `usable`. W0.1 stays Locked. The nine §3 exit items stay open.
- This note does not edit `docs/WAVE-MODULE-MAP.md` or `docs/OWNERSHIP-MATRIX.md`. D47–D49 are the ledger rows #39 added for this freeze.
