# Action ID Registry — FROZEN v1.2.0

> **Lead-owned.** No Worker may add, rename, or remove rows without bumping
> `CONTRACT_VERSION` in `shared/src/protocol/internal-action.ts` and updating
> this table in the **same commit**.

## Versioning Rules

| Change type | Version bump | Example |
|---|---|---|
| Add a new action id | minor (1.0.0 → 1.1.0) | Adding `file.move` |
| Rename an existing id | major (1.x.x → 2.0.0) | `file.update` → `file.write` |
| Remove an existing id | major | — |
| Add an optional payload field | minor | — |
| Change a required payload field | major | — |

## Action Table (Frozen)

| ID | Display Name | Surface | Permission | Destructive | Undo | Owner Module |
|---|---|---|---|---|---|---|
| `file.create` | Create File | both | L1_reversible | false | supported | M05 |
| `file.update` | Update File | both | L1_reversible | false | supported | M05 |
| `file.delete` | Delete File | both | L2_irreversible | **true** | not_supported | M05 |
| `file.rename` | Rename File | both | L1_reversible | false | supported | M05 |
| `file.move` | Move File | both | L1_reversible | false | supported | M05 |
| `session.rename` | Rename Session | both | L1_reversible | false | supported | M00 |
| `session.flag` | Flag Session | both | L0_read_only | false | supported | M00 |
| `session.set_status` | Set Session Status | both | L1_reversible | false | supported | M00 |
| `session.set_labels` | Set Session Labels | both | L1_reversible | false | supported | M00 |
| `canvas.node_create` | Create Canvas Node | both | L1_reversible | false | supported | M07 |
| `canvas.node_update` | Update Canvas Node | both | L1_reversible | false | supported | M07 |
| `canvas.node_delete` | Delete Canvas Node | both | L2_irreversible | **true** | not_supported | M07 |
| `canvas.node_select` | Select Canvas Node(s) | both | L0_read_only | false | n/a | M07 |
| `canvas.group_create` | Group Canvas Nodes | both | L1_reversible | false | supported | M07 |
| `canvas.group_ungroup` | Ungroup Canvas Nodes | both | L1_reversible | false | supported | M07 |
| `canvas.edge_create` | Create Canvas Connector | both | L1_reversible | false | supported | M07 |
| `canvas.export_selection` | Export Canvas Selection | both | L0_read_only | false | n/a | M07 |
| `canvas.viewport_set` | Set Canvas Viewport | both | L0_read_only | false | n/a | M07 |
| `canvas.zoom_to_node` | Zoom Canvas to Node | both | L0_read_only | false | n/a | M07 |
| `aigc.job_submit` | Submit AIGC Job | both | L1_reversible | false | not_supported | M08 |
| `workspace.rename` | Rename Workspace | both | L2_irreversible | false | supported | M00 |

## Column Definitions

- **Surface** — `human_ui` | `agent` | `both`
- **Permission** — minimum `ActionPermissionLevel` declared in the registry entry
- **Destructive** — when `true`, the PreInvoke Hook emits a `SupervisionRequest` and pauses execution until the Captain resolves it
- **Undo** — whether the executor is required to return an `UndoHandle`
- **Owner Module** — module that owns the executor implementation

## Extension Process

1. Agree on the new action id (naming: `<domain>.<verb>[.<qualifier>]`)
2. Add a row to this table
3. Add the constant to `InternalActionId` enum in `internal-action.ts`
4. Bump `CONTRACT_VERSION` appropriately
5. Open a PR — Lead reviews before merge

## Actions Under Discussion (Not Yet Frozen)

These ids **must not** be used by Workers until they appear in the frozen table above.

| Candidate ID | Proposed Owner | Status |
|---|---|---|
| `canvas.edge_delete` | M07 | Under discussion |
| `video.clip_create` | M09 | Under discussion |
| `video.clip_trim` | M09 | Under discussion |
| `browser.navigate` | M06 | Under discussion |
| `browser.screenshot` | M06 | Under discussion |
