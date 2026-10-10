# Action ID Registry — FROZEN v1.3.0

> **W0.1 notice (2026-10-10):** v1.3.0 adds ids and independent policy columns.
> It does not rename or remove a v1.2.0 id. W0.1 stays Locked. W1 is not Ready.
> Workers must not begin new implementation from this file alone.

> **Composable-workspace notice (2026-07-09, still open):** v1.2.0 coupled risk
> wording and undo. v1.3.0 splits those columns for every frozen row. It does
> not change the admission gate of a v1.2.0 id. `aigc.job_submit` stays L1 with
> undo `not_supported`, so the gate is still the human card. `canvas.export_selection`
> stays L0. `browser.screenshot` and binding deletion stay unfrozen.

> **Lead-owned.** No Worker may add, rename, or remove rows without bumping
> `CONTRACT_VERSION` in `shared/src/protocol/internal-action.ts` and updating
> this table in the **same commit**.

> **Owner guard (2026-10-10):** a plugin loadout, an MCP Apps sidebar focus, a
> DOM evidence snapshot, or a page-target write is refused when the caller uses
> any id other than the row that owns that operation. `op: grant` on
> `plugin.loadout_mutate` is `standing_grant_rejected`. Approval follows the
> frozen approval column. `requireHumanApproval` is not a policy.

## Versioning Rules

| Change type | Version bump | Example |
|---|---|---|
| Add a new action id | minor (1.2.0 → 1.3.0) | Adding `session.unflag` |
| Rename an existing id | major (1.x.x → 2.0.0) | `file.update` → `file.write` |
| Remove an existing id | major | — |
| Add an optional payload field | minor | — |
| Change a required payload field | major | — |

v1.3.0 is a minor bump: five ids added, none renamed or removed. The new policy
columns describe the existing gate. They are not a second permission model.

`workflow_runtime` has no independent authority and is not an allowed caller on
any v1.3.0 row. The kernel still enforces only the existing actor gate
(a system actor is denied unless the row is L0). The caller column is the
contract for who may be wired. It is not a new filter.

## Action Table (Frozen)

Legacy permission labels remain the admission gate. Side effect, approval, undo,
cancellation, retry, and evidence are independent. Evidence for every row in
this version is the session journal (`fleet_host_session_event` in
`session.jsonl`) when a caller admits. No row in this version claims an
artifact bundle.

| ID | Display Name | Surface | Owner | Since | Permission gate | Destructive | Side effect | Approval | Undo | Cancellation | Retry | Callers |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `file.create` | Create File | both | M05 | 1.2.0 | L1_reversible | false | file_bytes | none | supported | before_commit | idempotent_replay | human_ui, agent |
| `file.update` | Update File | both | M05 | 1.2.0 | L1_reversible | false | file_bytes | none | supported | before_commit | idempotent_replay | human_ui, agent |
| `file.delete` | Delete File | both | M05 | 1.2.0 | L3_destructive | **true** | destructive_delete | human_card | not_supported | before_commit | not_retryable | human_ui, agent |
| `file.rename` | Rename File | both | M05 | 1.2.0 | L1_reversible | false | file_bytes | none | supported | before_commit | idempotent_replay | human_ui, agent |
| `file.move` | Move File | both | M05 | 1.2.0 | L1_reversible | false | file_bytes | none | supported | before_commit | idempotent_replay | human_ui, agent |
| `file.page_target` | Write Page Target | both | M05 | 1.3.0 | L2_irreversible | false | file_bytes | human_card_or_preauthorized | supported | before_commit | idempotent_replay | human_ui, agent |
| `session.rename` | Rename Session | both | M00 | 1.2.0 | L1_reversible | false | local_header | none | supported | before_commit | idempotent_replay | human_ui, agent |
| `session.flag` | Flag Session | both | M00 | 1.2.0 | L0_read_only | false | local_header | none | supported | before_commit | idempotent_replay | human_ui |
| `session.unflag` | Unflag Session | human_ui | M00 | 1.3.0 | L0_read_only | false | local_header | none | supported | before_commit | idempotent_replay | human_ui |
| `session.set_status` | Set Session Status | both | M00 | 1.2.0 | L1_reversible | false | local_header | none | supported | before_commit | idempotent_replay | human_ui, agent |
| `session.set_labels` | Set Session Labels | both | M00 | 1.2.0 | L1_reversible | false | local_header | none | supported | before_commit | idempotent_replay | human_ui, agent |
| `canvas.node_create` | Create Canvas Node | both | M07 | 1.2.0 | L1_reversible | false | view_state | none | supported | before_commit | idempotent_replay | human_ui, agent |
| `canvas.node_update` | Update Canvas Node | both | M07 | 1.2.0 | L1_reversible | false | view_state | none | supported | before_commit | idempotent_replay | human_ui, agent |
| `canvas.node_delete` | Delete Canvas Node | both | M07 | 1.2.0 | L3_destructive | **true** | destructive_delete | human_card | not_supported | before_commit | not_retryable | human_ui, agent |
| `canvas.node_select` | Select Canvas Node(s) | both | M07 | 1.2.0 | L0_read_only | false | view_state | none | not_required | n/a | idempotent_replay | human_ui, agent |
| `canvas.group_create` | Group Canvas Nodes | both | M07 | 1.2.0 | L1_reversible | false | view_state | none | supported | before_commit | idempotent_replay | human_ui, agent |
| `canvas.group_ungroup` | Ungroup Canvas Nodes | both | M07 | 1.2.0 | L1_reversible | false | view_state | none | supported | before_commit | idempotent_replay | human_ui, agent |
| `canvas.edge_create` | Create Canvas Connector | both | M07 | 1.2.0 | L1_reversible | false | view_state | none | supported | before_commit | idempotent_replay | human_ui, agent |
| `canvas.export_selection` | Export Canvas Selection | both | M07 | 1.2.0 | L0_read_only | false | export_artifact | none | not_required | n/a | new_invocation | human_ui, agent |
| `canvas.viewport_set` | Set Canvas Viewport | both | M07 | 1.2.0 | L0_read_only | false | view_state | none | not_required | n/a | idempotent_replay | human_ui, agent |
| `canvas.zoom_to_node` | Zoom Canvas to Node | both | M07 | 1.2.0 | L0_read_only | false | view_state | none | not_required | n/a | idempotent_replay | human_ui, agent |
| `browser.dom_snapshot` | Capture DOM Snapshot | both | M06 | 1.3.0 | L2_irreversible | false | evidence_capture | human_card_or_preauthorized | not_required | before_commit | new_invocation | human_ui, agent |
| `workbench.sidebar_focus` | Focus Sidebar Slot | both | M16 | 1.3.0 | L0_read_only | false | view_state | none | not_required | n/a | idempotent_replay | human_ui, agent |
| `plugin.loadout_mutate` | Change Plugin Loadout | human_ui | M12 | 1.3.0 | L2_irreversible | false | capability_scope | human_card_or_preauthorized | supported | before_commit | idempotent_replay | human_ui |
| `aigc.job_submit` | Submit AIGC Job | both | M08 | 1.2.0 | L1_reversible | false | external_job | human_card | not_supported | before_external_submit | reconcile_no_repeat | human_ui, agent |
| `workspace.rename` | Rename Workspace | human_ui | M00 | 1.2.0 | L2_irreversible | false | workspace_name | human_card_or_preauthorized | supported | before_commit | idempotent_replay | human_ui |

### Column rules

- **Permission gate** is what `HostTurnKernel` already implements. L0 admits with no card. L1 with undo `supported` admits with no card. L1 with undo `not_supported` waits for the card (`undo_contract_missing`). L2 waits unless `preAuthorizedBy` is the desktop human. L3 always waits.
- **Side effect** is not that gate. `session.flag` and `session.unflag` are L0 and still write the session header.
- **Approval `none`** means no card. **`human_card`** means the existing Craft permission card. **`human_card_or_preauthorized`** is the L2 rule. There is no standing grant.
- **Undo `supported`** on an L0 row means the previous header can be recorded. The L0 gate does not fail the turn when the handle is omitted. `session.unflag` records `{ isFlagged }` as `Restore session flag`.
- **`file.page_target`** input is one EditPopover key plus the next document. A later caller must send `baseRevision` before the write is admitted. No caller is admitted in this version.
- **`plugin.loadout_mutate`** ops are `install`, `enable`, and `disable`. `grant` is rejected. No caller is admitted in this version.
- **`browser.dom_snapshot`** is page-text evidence, not a screenshot bundle. No caller is admitted in this version.
- **`workbench.sidebar_focus`** is one sidebar slot. It does not open a sandboxed `ui://` view. The MCP Apps pane is the human caller. Agent helpers have no caller. `plugin.loadout_mutate`, `browser.dom_snapshot`, and `file.page_target` still have no shell caller.

Input and output shapes for v1.2.0 ids are unchanged. New ids use `sinceVersion` 1.3.0. There is no separate schema version constant.

## Actions Under Discussion (Not Yet Frozen)

These ids **must not** be used by Workers until they appear in the frozen table above.

| Candidate ID | Proposed Owner | Status |
|---|---|---|
| `canvas.viewport_fit` | M07 | Under discussion |
| `canvas.edge_delete` | M07 | Under discussion |
| `video.clip_create` | M09 | Under discussion |
| `video.clip_trim` | M09 | Under discussion |
| `browser.navigate` | M06 | Under discussion |
| `browser.screenshot` | M06 | Under discussion. Not `browser.dom_snapshot`. Screenshot evidence stays Locked. |
| `workbench.view_open` | M16 | Contract draft only. Not `workbench.sidebar_focus`. |
| `workbench.entity_reveal` | M16 | Contract draft only |
| `workbench.view_close` | M16 | Contract draft only |
| `workbench.layout_save` | M16 | Contract draft only |
| `workbench.layout_reset` | M16 | Contract draft only |
| `workflow.create` | M17 | Contract draft only |
| `workflow.node_add` | M17 | Contract draft only |
| `workflow.node_remove` | M17 | Contract draft only |
| `workflow.edge_connect` | M17 | Contract draft only |
| `workflow.edge_disconnect` | M17 | Contract draft only |
| `workflow.validate` | M17 | Contract draft only |
| `workflow.run_start` | M17 | Dynamic policy required; contract draft only |
| `workflow.run_cancel` | M17 | Contract draft only |
| `job.inspect` | M08 | Contract draft only |
| `job.cancel` | M08 | Contract draft only |
| `job.retry` | M08 | Contract draft only |
| `media.project_create` | M09 | Contract draft only |
| `media.clip_add` | M09 | Contract draft only |
| `media.clip_update` | M09 | Contract draft only |
| `media.render_submit` | M09 | Dynamic policy required; contract draft only |

Binding deletion has no id. `file.delete` and `canvas.node_delete` are not that operation. No shell caller is added for either delete id.

## W0.1 Re-freeze Requirements

v1.3.0 fills the columns for the frozen rows. It does not close W0.1. Still open:

- product/internal namespace strings are recorded by D50 (`docs/audits/2026-10-10-blk002-namespace-oss.md`). This line does not bump `CONTRACT_VERSION` and does not add a caller;
- a caller for `plugin.loadout_mutate`, `browser.dom_snapshot`, and `file.page_target`. The MCP Apps pane calls `workbench.sidebar_focus`;
- `browser.screenshot` and binding deletion;
- ArtifactRef, capability manifest, ExternalJob, workflow, spatial, and view contracts;
- the retain/adapt/drop/defer ledger and the clean v0.11.0 baseline.

Candidate names above are design vocabulary only. They may be renamed or consolidated during a later freeze. No Worker may consume them beforehand.
