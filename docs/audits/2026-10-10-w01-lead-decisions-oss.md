# W0.1 Lead decisions — OSS comparison

> **Date:** 2026-10-10
> **Role:** Fleet Lead. Vella authorized the Lead to choose. This note is the choice.
> **Base:** `6887f1ec` (`work/fresh-base-spine` after #38), then this freeze.
> **Contract:** `docs/contracts/action-ids.md` v1.3.0 and `CONTRACT_VERSION` `1.3.0` in `app/packages/shared/src/protocol/internal-action.ts`, same change.
> **What this does not do:** It does not mark W0.1 or W1 Ready. It does not promote any capability to `usable`. It does not edit Ready cells in `docs/WAVE-MODULE-MAP.md`. Settings plugin writes stay Locked.
>
> **Amendment (2026-10-10, D50):** Criterion 2 below is met. The product and internal strings are `docs/audits/2026-10-10-blk002-namespace-oss.md`. Criteria 3, 4, and 5 are not met. Settings stays Locked. W0.1 stays Locked. The body of this note is otherwise unchanged.

## How the comparison was bounded

`docs/REFERENCE-PROJECT-POLICY.md` is the license gate. Green-light sources may be adapted. Candidates are behavior references. This note does not copy source, tests, types, or manifests.

`docs/ARCHITECTURAL-COMPARISON.md` says its versions and architecture claims are not verified and must not choose a route. It was not used as evidence.

`docs/UPSTREAM-BASELINE.md` still requires a clean Craft Agents OSS v0.11.0 checkout and a retain/adapt/drop/defer ledger. This freeze does not record that baseline. `docs/UPSTREAM-DELTA.tsv` gains rows only for the `app/` files this change touches.

The cloud checkout has `源码参考/README.md` and `源码参考/clone_repos.sh`. It does not have `源码参考/latest` or `docs/references.md`. Peers below are cited from public docs and from the in-repo Craft session kernel, ACP client, and Codex app-server adapter. Unverified inventory names are not treated as winners.

Directions stay separate:

| Decision | Module | Not this decision |
|---|---|---|
| 1. Unflag | M00 session chrome | Not a permission-card prompt, not a plugin install |
| 2. Action-id columns | M03 registry, owners M12 / M05 / M06 / M16 | Not a Settings unlock |
| 3. Settings loadout | M12 enablement, M13 page | Not session flag, not a second permission journal |

## 1. Unflag — `session.unflag` (M00)

**Choice.** Freeze `session.unflag`. Owner M00. Surface `human_ui`. Permission gate L0, so the existing kernel does not publish a card. Side effect `local_header` (it writes `isFlagged`). Approval `none`. Undo `supported` (snapshot `{ isFlagged }` labeled `Restore session flag`). Cancellation `before_commit`. Retry `idempotent_replay`. Evidence `session_journal`. Caller: the desktop human, the same actor as Flag.

`unflagSession` admits that id on the Craft session kernel and journals `fleet_host_session_event` in `session.jsonl`. A refused admit leaves the flag set. The shell restores the optimistic clear when the result is refused. §13 labels that caller `wired`. The module header stays `not implemented`. This row is not `usable`.

### Peers (session chrome and who may clear a mark)

| Peer | What was compared | Result |
|---|---|---|
| Craft session header | In-repo `flagSession` / `isFlagged`. Flag and Unflag are one header bit. The human command does not open the permission card. | **Winner for the gesture.** Unflag matches Flag. |
| ACP `session/request_permission` | Tool kinds are `read`, `edit`, `delete`, `execute`, and the rest. The client answers the session that owns the turn. Cancel returns `cancelled`. `allow_always` remembers a tool choice. [Tool calls](https://agentclientprotocol.com/protocol/v1/tool-calls) | **Winner for a distinct name.** **Loser as the unflag prompt.** A human clearing their own flag is not an agent tool call, and `allow_always` is not how Flag works. |
| Codex app-server | In-repo methods are separate: `item/fileChange/requestApproval`, `item/commandExecution/requestApproval`, `item/permissions/requestApproval`. Locked methods decline. Scope is the turn. | **Winner for a distinct method.** **Loser as the unflag prompt.** Unflag is not an item approval. |
| Cline | Tool approval is per tool (`write_to_file` and the rest). The ACP CLI can set `auto_approve` for the session. [Cline ACP](https://github.com/cline/cline/blob/7348ba18/apps/cli/src/acp/auto-approve.ts) | **Winner:** the command has its own name. **Loser:** session-wide auto-approve, and treating Unflag as `write_to_file`. |
| OpenCode | Permission keys are `read`, `edit`, `bash`, `skill`, and so on, each `allow` / `ask` / `deny`. [Permissions](https://opencode.ai/docs/permissions/) | **Loser for unflag.** A session mark is not an `edit`. |
| goose | Tool permission is Always Allow / Ask Before / Never Allow, per tool, separate from extension `enabled`. [Tool permissions](https://github.com/block/goose/blob/58f3cc9e/documentation/docs/guides/managing-tools/tool-permissions.md) | **Loser for unflag.** Confirming a tool is not clearing a session mark. |
| OpenHands | `FileEditAction`, `FileReadAction`, and `CmdRunAction` are different types. Confirmation follows risk, inside the conversation. [Security](https://docs.openhands.dev/sdk/arch/security) | **Loser for unflag.** A bookmark is not `FileEditAction`. |
| AionUi | One Cowork window shows the ACP agent's own permission prompt. Each conversation keeps that agent's tools. [ACP setup](https://github.com/iOfficeAI/AionUi/wiki/ACP-Setup) | **Loser if copied as a second panel store.** The prompt stays on the Craft session. Unflag does not go through it. |
| DeepSeek-Reasonix | `tool_approval` presets (`read-only`, `workspace-write`, `danger-full-access`) and a separate sandbox write grant. [ACP editor integration](https://cdn.jsdelivr.net/gh/esengine/deepseek-reasonix@main-v2/docs/ACP.md) | **Loser for unflag.** A flag bit is not a write-access grant. |
| Pi (`oh-my-pi` in the clone index) | `--auto-approve` / yolo would skip the host. | **Loser.** `AGENTS.md` keeps Pi off admission. Unflag does not call Pi. |
| Hermes | Skills and toolsets. | Not a session-chrome peer. Cited under decision 3. |
| Omnigent | Black-box supervisor and attach/fork. Policy forbids copying the engine. | **Loser as a second journal.** Unflag writes the Craft session file only. |

### Names that lost

- `session.flag` plus `{ flagged: false }`. That is the payload sniff the re-freeze exists to stop. ACP kinds, Codex methods, Cline tool names, and OpenCode keys are all distinct.
- An L2 card. Craft does not confirm Flag. ACP and Codex cards are for agent-initiated effects. A card on Unflag would ask the human to approve a click they just made.
- An agent `unflag_session` tool. No shell tool exists. None of the peers treat the user's bookmark as a model tool. This freeze does not add one.

## 2. Action-id columns and the four split ids (M03)

**Choice.** Keep every v1.2.0 id string. Add independent columns on every frozen row. Add four ids so the owner matches the operation. Bump is minor: `1.2.0` → `1.3.0`.

| ID | Owner | Gate | Why this id |
|---|---|---|---|
| `plugin.loadout_mutate` | M12 | L2, undo supported, card unless this invocation is pre-authorized by the desktop human | Install, enable, and disable are one capability change. `grant` is rejected. |
| `file.page_target` | M05 | L2, undo supported, same card rule | The EditPopover key writes workspace bytes, including permission pages. `baseRevision` is required before a future caller is admitted. |
| `browser.dom_snapshot` | M06 | L2, undo not required, card | Page text can carry secrets (D23). It is not a file create and it is not a screenshot bundle. |
| `workbench.sidebar_focus` | M16 | L0, undo not required, no card | One sidebar slot. No domain write. `workbench.view_open` stays a draft. |

`action-owner-policy.ts` stays a guard for the old verbs. `file.update`, `file.create`, and `canvas.node_select` still refuse those payloads. The new ids do not. No production caller was switched onto the new ids. Settings, the DOM capture, the MCP Apps host, and `update-target` still use the old verbs and still fail closed. §13 does not call those callers `wired`. That paragraph is the #39 result.

After #41–#43 (`92ee3ea5`), the guest host admits `browser.dom_snapshot`, the page-local host admits `file.page_target`, and the MCP Apps host admits `workbench.sidebar_focus`. Each stays `test-only` in §13. None publishes the Craft session card. None has a shell or IPC caller. The old verbs still refuse those payloads. `plugin.loadout_mutate` still has no caller. Settings stays Locked (D49). W0.1 stays Locked. Nothing in those admits is `usable`.

`aigc.job_submit` keeps its L1 gate and `undo: not_supported`, so admission is still the human card (`undo_contract_missing`). The new columns say side effect `external_job`, approval `human_card`, cancellation `before_external_submit`, retry `reconcile_no_repeat`. That records the split without changing the gate.

`canvas.export_selection` keeps L0. Its side effect column says `export_artifact`. This freeze does not start charging a card for export.

`browser.screenshot` stays under discussion and Locked. Binding deletion has no id. `file.delete` and `canvas.node_delete` are not given a shell caller.

### Peers (capability name versus a file verb)

| Peer | What was compared | Result |
|---|---|---|
| ACP tool kinds | `read` / `edit` / `delete` / `execute` are the risk class. Permission is a separate request. Cancel is `session/cancel`. | **Winner for separate columns.** Kind is not approval, and approval is not undo. |
| Codex methods plus sandbox | One method per effect. `approvalPolicy: on-request`. Sandbox `workspaceWrite` is a different axis from the approval method. In-repo adapter declines command execution. | **Winner.** Do not sniff a file payload to discover a command. |
| Craft permission modes | `safe` / `ask` / `allow-all` and `respondToPermission` are one approver. The action id is still the thing being approved. | **Winner for one approver.** **Loser if the mode replaces the id.** |
| OpenHands | Action classes are the capability. `ConfirmRisky` is the approval policy. The sandbox is the boundary. Risk and confirmation are configured apart. [Security](https://docs.openhands.dev/sdk/arch/security) | **Winner for the column split.** **Loser as an executor.** The Docker runtime is not copied (policy black-box rule). |
| goose | Extension `enabled` is not the same field as tool Always Allow / Ask / Never. Smart approval is a risk gate on top of the tool name. | **Winner.** Enablement (decision 3) stays off this table's caller wiring. |
| OpenCode | `edit` covers write and patch. `bash` is not `edit`. `ask` is not `deny`. | **Winner against `file.update` as a universal verb.** |
| Cline | Each tool has a policy. `auto_approve` is a session switch, not an id. | **Loser if used to skip the card** on `plugin.loadout_mutate` or `browser.dom_snapshot`. |
| DeepSeek-Reasonix | `tool_approval` updates the gate in place. Sandbox write grants are a second layer, with once / session / project scopes. | **Winner for two layers.** **Loser for a persisted project grant** on these ids. Fleet's host Always Allow still does not store a grant. |

### Names that lost

- Leaving the four operations on `file.update`, `file.create`, and `canvas.node_select` and sniffing the payload. That is the v1.2.0 guard. The guard remains only as a refusal of the wrong id.
- Three ids `plugin.install` / `plugin.enable` / `plugin.disable`. They share owner, risk, approval, and undo. One id, three ops. `grant` is not an op.
- Freezing `browser.screenshot` as the DOM path. OpenHands keeps browse and file read apart. The screenshot bundle is still Locked (D30).
- Freezing `workbench.view_open` for a sidebar slot. M16's draft is a wider view-host contract. Using it here would overload it the way `canvas.node_select` was overloaded.
- An M13 id for the page target. M13 is the settings shell. The bytes are M05 (D15). The L2 gate is because those pages include permission documents (M13's own rule that permission settings need a timeline).

## 3. Settings plugin unlock — criteria only (M12 / M13)

**Choice.** Do not unlock Settings → Plugins. `plugin.loadout_mutate` is frozen so a later caller has an id. At this choice, `SessionManager.applySessionPluginMutation` still sent `file.update` and was still refused. `PluginsSettingsPage` still does not call it and still does not construct `createPluginSettingsHost`. §13 stays `Locked` for install, enable, and disable.

Follow-up: `SessionManager.applySessionPluginMutation` and `resolveSessionPluginGrant` now build `plugin.loadout_mutate` and stay `test-only`. `file.update` still refuses that payload. `op: grant` is `standing_grant_rejected`. This note still does not unlock Settings.

The shell path does not meet the #38 criteria. Wiring a button would invent the write. The product/internal namespace is D50, recorded after this note. A Settings caller still does not decide it, and this section still does not unlock the page.

### When a later change may write the loadout

All of these are true on the spine:

1. `plugin.loadout_mutate` is in the frozen table and `CONTRACT_VERSION` is `1.3.0` in that same commit. This change meets this item only.
2. The product/internal namespace is a ledger decision (exit item 6 / BLK-002), including plugin API keys and storage prefixes. A Settings caller does not invent it. **Met by D50 (2026-10-10).** The strings are recorded. This criterion alone does not unlock the page.
3. One production caller, a Settings → Plugins control or an IPC/RPC handler, calls `SessionManager.applySessionPluginMutation` for install, enable, or disable with `plugin.loadout_mutate`. `createPluginSettingsHost` is not that caller.
4. The L2 row publishes the existing permission card. Allow and Deny go through `resolveSessionPluginGrant` and `sessions:respondToPermission`. Allow is the only path that writes. Deny writes nothing. Always Allow resolves that invocation and does not store `decision: 'approved'`.
5. The catalog is the Craft skills and sources the agent already loads. `.claude-plugin/loadout.json` is not a second authority. There is no renderer-local kernel.

### Acceptance tests that must pass before §13 leaves Locked

- The Settings page or the RPC handler source contains the production call. `session-plugin-admission` today asserts the page and `sessions.ts` do not. That assertion stays until the caller is real.
- A human install, enable, and disable each admit `plugin.loadout_mutate`. The same payload on `file.update` is still `action_owner_mismatch:plugin_loadout`.
- Allow writes the catalog the agent loads. Deny leaves it unchanged. A missing session writes nothing. A credential-shaped id writes nothing.
- A second enable of the same plugin publishes another card. `op: grant` is `standing_grant_rejected` and writes nothing.
- `PluginsSettingsPage` does not contain `createPluginSettingsHost`.

Those tests are the gate. They are not implemented here, because the caller is not real. Implementing them against a fake button would be a false unlock.

### Peers (plugin packaging and enablement)

| Peer | What was compared | Result |
|---|---|---|
| Claude Code | Plugins are directories of skills, agents, hooks, and MCP servers. `enabledPlugins` in settings turns one plugin on or off. Skills are `SKILL.md` files. `defaultEnabled: false` means the user opts in. [Plugins reference](https://code.claude.com/docs/en/plugins-reference) | **Winner for an explicit enable bit.** **Loser:** a second `.claude-plugin/loadout.json` that is not the skills the agent loads. |
| VS Code | `contributes.commands` and `contributes.views` are contribution points. Enablement is one extension state in the extension host, not a webview file write. | **Winner for one host and one enablement state.** **Loser:** a renderer kernel per settings page. |
| Agent Skills | `SKILL.md` plus a description. Hermes and Stitch both say they follow that shape. [Hermes skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills) | **Winner for one skill document.** **Loser:** a private loadout schema with `decision: approved`. |
| MiniMax Code Plugins | `plugin.json`, `README`, `LICENSE`, and `skills/<name>/SKILL.md` or an MCP server. Hooks, custom agents, and TUI extensions are outside the current contract. [MiniMax-Code-Plugins](https://github.com/MiniMax-AI/MiniMax-Code-Plugins) | **Winner for a narrow package.** **Loser for this wave:** marketplace install. M12 distribution stays W4. |
| cindy-official-plugins | `ghost.json` plus a skill slot that links `SKILL.md` while enabled and unlinks it when disabled. A confirm slot is a separate dialog. The skill slot runs with the user's full permissions. [Plugin authoring](https://github.com/makecindy/cindy/blob/0aad640b/docs/dev-rules/plugin-security-and-authoring.md) | **Loser.** A global symlink catalog and a renderer confirm dialog are a second store and a second approver. Full-permission skills fight D25. |
| Stitch skills | Skill folders grouped as plugins (`stitch-design`, `stitch-build`, `stitch-utilities`) for the Stitch MCP server. [stitch-skills](https://github.com/google-labs-code/stitch-skills) | **Winner for packaging skills beside MCP.** **Loser:** treating a skill `allowed-tools` list as a Fleet standing grant. Policy forbids copying the SDK. |
| MCP registry and ext-apps | Tools have their own names from `tools/list`. ext-apps is a sandboxed `ui://` view with a host bridge. The honesty audit already records this. | **Winner for a tool name.** **Loser:** the current side pane, which is a list. `workbench.sidebar_focus` does not open `ui://`. That view stays Locked. |
| Hermes MCP packaging | Discovered tools are registered as `mcp_{server}_{tool}`. Skills can require a toolset. The same docs also inject discovered tools into every platform toolset. | **Winner for a prefixed tool name.** **Loser:** the always-on injection. D25 forbids a global tool pile. |

ACP `allow_always`, OpenCode session `always`, Cline `auto_approve`, goose Always Allow, and Reasonix project-scoped write grants are permission-memory features. They are not the plugin catalog. They lost as the Settings grant model. Host Always Allow on the Craft card stays one invocation.

## Remaining Lead exit work

W0.1 stays Locked. These exit items in `docs/WAVE-MODULE-MAP.md` §3 remain, and item 6 is the only one decided:

1. Clean Craft Agents OSS v0.11.0 baseline.
2. Retain/adapt/drop/defer ledger (BLK-001).
3. Canonical parity for AgentSeat, identity, caller provenance, idempotency, revisions, typed events, and the rest of action policy. This note covers the action-id slice only.
4. ArtifactRef, capability manifest, ExternalJob, workflow, spatial, and view contracts.
5. Physical persistence authority.
6. Product/internal namespace (BLK-002). **Closed as a name decision by D50.** The other items in this list stay open.
7. Ownership precedence.
8. Active packets matching the map.
9. W1 Ready, which is not declared.

Also still closed: BLK-003 adapter spikes, D46 MotionDeck, Office edit and save, and any production `file.delete` or `canvas.node_delete` caller. Nothing in this change is `usable`.
