# W0.1 exit checklist — session chrome after PRs #28–#33

> **Date:** 2026-10-10
> **Base inspected:** `4f12779d` (`work/fresh-base-spine` after merged PR #33)
> **What this file is:** a review note for the Lead. It inventories the session-chrome host-admit chain and the items that still block closing W0.1. It does not promote a decision, mark a wave Ready, add an action id, or change capability status.
> **Binding exit list:** `docs/WAVE-MODULE-MAP.md` §3. This note does not replace that list and does not check any item off.
> **Earlier review:** `docs/audits/2026-10-10-spine-honesty-audit.md` still describes base `89b2e8a6`. That body is not rewritten.

## Gate status (unchanged)

W0.1 stays Locked for worker implementation. `docs/WAVE-MODULE-MAP.md` still records the Lead reconciliation row as In Progress and blocking all Workers. This note does not close that row and does not mark W0.1 or W1 Ready.

`docs/modules/00-platform-spine.md` header stays capability `not implemented` and execution gate Locked pending the W0.1 contract re-freeze. Nothing in PRs #28–#33 is `usable`. Settings plugin writes stay Locked. `docs/contracts/action-ids.md` stays frozen v1.2.0. Those PRs add no action id and do not bump `CONTRACT_VERSION`.

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
| Agent rename | No agent tool calls `session.rename`. | `not implemented` |
| Unflag (`unflagSession`) | No frozen id. The command clears the flag and does not call `admitHostTurn`. | `not implemented` |

`session.flag` does not publish a permission card. The three L1 chrome ids auto-admit because the frozen rows already carry an undo contract, so those turns also do not publish a card.

## What still blocks the Lead from closing W0.1

The map's nine exit items stay open. BLK-001 (migration ledger and contract parity), BLK-002 (product/internal namespace), and BLK-003 (adapter spikes) are still the named blockers. `docs/UPSTREAM-BASELINE.md` still records `app/` short of the clean v0.11.0 baseline and still requires a retain/adapt/drop/defer ledger before W1 packets. Session chrome does not supply that evidence.

These slices stay blocked inside that exit. A worker must not implement them from this note.

1. **Unflag.** Admission stays `not implemented` until the Lead freezes an id in `docs/contracts/action-ids.md` under the extension process, in the same commit as any `CONTRACT_VERSION` bump. This note does not invent `session.unflag`. That string is not in the frozen table and is not in the under-discussion list.

2. **Permission-card publish and approve.** §13 keeps both rows `test-only`. The shell chrome that landed is L0 or L1-with-undo, so it never takes the `approval_required` branch. No L2 or L3 shell caller publishes or approves a host card. `workspace.rename` (L2) and `file.delete` / `canvas.node_delete` (L3) are not that caller.

3. **Settings plugin writes.** Install, enable, and disable on Settings → Plugins stay Locked. The page does not write `.claude-plugin/loadout.json`. `SessionManager.applySessionPluginMutation` and `resolveSessionPluginGrant` stay `test-only`: they build a `file.update` loadout request, admission refuses that verb, and no shell or IPC caller uses them. This note does not unlock Settings.

4. **Agent `session.rename`.** The agent tools that admit are status and labels only. Rename from an agent stays `not implemented`. Title generation borrows the desktop user and is not an agent rename tool.

5. **Action-id owner mismatch.** `action-owner-policy.ts` refuses a plugin loadout, an MCP Apps sidebar focus, a DOM evidence snapshot, or a page-target write when the caller uses `file.update`, `file.create`, or `canvas.node_select`. That check is a payload heuristic on frozen v1.2.0. It is not the W0.1 re-freeze. The re-freeze still has to split risk, approval, undo, cancellation, retry, and evidence onto ids whose owners match the operation. Until that table exists, these refusals stay a guard, not a new contract.

6. **D46 PPTX.** D46 in `docs/DECISIONS-LEDGER.md` is still Final: the native document is a MotionDeck, and PPTX, HTML, and video are explicit exports. The shell PPTX overlay is a first-slide text viewer (`wired` preview). Create, edit, undo, save, and reopen through the document host stay `test-only`. Office edit and save in the shell stay Locked. MotionDeck, animation, and a full slide editor stay Locked. M19's header stays Locked. Treating the first-slide viewer as M19 would leave D46 unmet. This note does not edit the ledger.

7. **Office edit and save, and W1–W5.** DOCX, XLSX, and PPTX edit and save in the shell stay Locked. `createDocumentSuiteHost` stays `test-only`. W1–W5 stay Locked. Absence of a Lead Ready declaration on W1 means Locked.

## What this chain does not close

- No new action id. Unflag, browser screenshot, workbench view open, and the other under-discussion names stay unfrozen.
- No Settings unlock, no plugin marketplace, no standing loadout grant.
- No `usable` row. Only the Lead promotes `usable`.
- No change to `DECISIONS-LEDGER.md`, `WAVE-MODULE-MAP.md`, or `OWNERSHIP-MATRIX.md`.
