# W0.1 Exit item 4 — contract version-gate

> **Date:** 2026-10-10
> **Role:** Fleet Lead. This note is the Exit item 4 version-gate. It is not a freeze.
> **Base:** `bd761f083f45d358b52061136b6949167b24b632` (`work/fresh-base-spine` after #56).
> **Ledger:** D53 in `docs/DECISIONS-LEDGER.md`.
> **Capability:** documentation only. Nothing in this note is `usable`.
> **Gates:** W0.1 stays In Progress. W1 stays Locked. Exit item 4 stays open. Exit items 1 and 3 stay open. `CONTRACT_VERSION` stays `1.3.0`. No action id is added.
>
> **What this does not do:** It does not freeze a type, copy a peer schema, bump `CONTRACT_VERSION`, add an action id, mark a module Ready, or close W0.1. The proposed TypeScript in `docs/contracts/composable-workspace-contracts.md` and the ExternalJob draft in `docs/modules/08-aigc-jobs-surface.md` stay proposals.

## Choice

Version-gate. Do not freeze.

`CONTRACT_VERSION` in `app/packages/shared/src/protocol/internal-action.ts` is `1.3.0`. That constant covers the frozen action-id table (D47–D49). It does not include ArtifactRef, a capability manifest, ExternalJob, a workflow document, a spatial document, or a view contribution. The extension rule on that file bumps the constant when an action id or a required payload shape changes. Absorbing these drafts would be that bump. No evidence forces it.

Exit item 4 stays open. The contracts remain unfrozen. The gate below is the rule a later packet must meet before it can consume them. A later Lead freeze, in one canonical protocol change, is what closes the item. This note does not name the future version.

Exit item 3 stays the parity record in `docs/audits/2026-10-10-w01-exit3-canonical-parity.md`. `InvocationContext`, envelope idempotency, `baseRevision` / `committedRevision`, and `ActionEventPayloadVNext` in the proposal are that item. They are not frozen here.

## Shared gate

These six drafts are outside `CONTRACT_VERSION` `1.3.0` and outside the historical v1.2 stubs in `docs/contracts/protocol-stubs.md`. A module named in the table may not implement, persist, or generate callers from the draft. A later wave that depends on that module waits on the same freeze. W1, W2, W3A, and W3B stay Locked. D40, D41, D42, and D44 stay product rules. They do not make the field lists canonical.

The pattern reused here is a stable version that refuses unfinished surfaces, not a new Fleet schema:

- VS Code keeps unstable API in `vscode.proposed.<name>.d.ts`, separate from stable `vscode.d.ts`. An extension lists the proposal in `enabledApiProposals` and still must not publish that extension to the Marketplace. The proposal can move into the stable API later. [Using Proposed API](https://code.visualstudio.com/api/advanced-topics/using-proposed-api)
- The in-repo ACP client sends `protocolVersion: 1` and sets `clientCapabilities` filesystem read/write and `terminal` to false (`app/packages/shared/src/protocol/cli-executors/acp-client.ts`). `session/resume` runs only when the peer reports `protocolVersion >= 2`. Otherwise `loadSession` selects `session/load`. Otherwise the client throws `peer_resume_unsupported`. An unknown method returns `-32601` `acp_client_method_locked`. `ACP_CAPABILITIES.status` is `display-only` (`capabilities.ts`). Electron and `SessionManager` do not construct that client. A declared capability is not a running contract, and protocol version 1 does not grow to hold it.
- Claude Code `enabledPlugins` is an explicit opt-in. A plugin directory does not grant itself. That comparison is already recorded in `docs/audits/2026-10-10-w01-lead-decisions-oss.md`. This note does not add a second enable file.
- VS Code `contributes.views` and `contributes.commands` are host contribution points once they are in the extension manifest. D50 already took the contribution-id lesson and refused a `contributes` object beside the M12 manifest (`docs/audits/2026-10-10-blk002-namespace-oss.md`). This note does not copy that object.

## Contracts

| Contract | Current path and status | Decision | May not consume until a later freeze |
|---|---|---|---|
| ArtifactRef | `docs/contracts/composable-workspace-contracts.md` §2, proposed v0.1. Glossary defines the word. M05 §9 says implement the proposal after promotion. M05 §8 `LibraryAsset` is a different draft. | version-gate | W2 M05, then M06, M08, M09, M15, M17, M18, M19 |
| Capability manifest | Same file §3 (`CapabilityManifest`, `CapabilityOperation`, `PortDefinition`, `ActionDefinition`). M12 §4. D50 strings are not this schema. | version-gate | W1 M12 core, then the W2 catalog and W4 distribution |
| ExternalJob | Not a full type in the proposal. Draft: `docs/modules/08-aigc-jobs-surface.md` §3. The proposal only names `executionMode: 'external_job'` and `externalJobId`. | version-gate | W2 M08 job core, then W3A M17 and M08 providers |
| Workflow | Same proposal §5 `WorkflowDefinition` and §6 `WorkflowRun` / `NodeRun`. M17 §4. D41 is the DAG rule, not the field list. | version-gate | W3A M17 |
| Spatial | Same proposal §7 `SpatialDocument`. Historical `CanvasDocument` in `docs/contracts/protocol-stubs.md` is a different v1.2 stub. M07 §5 says that stub is not the final contract. | version-gate | W3A M07 |
| View | Same proposal §8 `ViewContribution`, `ViewInstance`, `LayoutSnapshot`. M16 §4. D50 says the contribution table is not frozen. `workbench.sidebar_focus` is a frozen action id, not this schema. | version-gate | W2 M16 host slice, then the W3A composition slice |

Dependency stop rules 4, 5, and 6 in `docs/WAVE-MODULE-MAP.md` still require a freeze before M17, M07, and M09/M18/M19 start. D53 does not meet those rules.

### ArtifactRef

`ArtifactRef` in the proposal and `LibraryAsset` in M05 §8 do not match. The proposal carries `storageRef`, `provenanceRef`, and `parentRefs`. The module draft carries `workspaceId`, a sha256 `contentHash`, a license object, and `usageRefs`. Freezing either shape would pick one without a workspace-store decision. D44 already says handoff is a versioned envelope and M05 keeps content authority. That rule stands. The fields do not.

W2 M05 is the first consumer. Its packet may not implement or persist either draft. M06, M08, M09, M15, M17, M18, and M19 may not bind the proposal as if it were canonical. Stop rule 4 still blocks M17 until an ArtifactRef freeze exists.

VS Code leaves an unstable type in a proposal file and does not publish extensions against it. ACP `initialize` keeps `protocolVersion` at 1 and turns unimplemented client capabilities off instead of adding fields. `ACP_CAPABILITIES` stays `display-only`. The same split applies: 1.3.0 stays the action table, and ArtifactRef stays proposed.

### Capability manifest

The proposal's `CapabilityManifest` is one schema with operations, ports, execution mode, and view-contribution ids. D40 says human UI, Agent tools, and workflow steps share one action. D50 records namespace strings and says the contribution table is not frozen. Settings → Plugins calls frozen `plugin.loadout_mutate` and is `wired` (D49). That caller writes the Craft catalog. It does not read this manifest.

W1's exit text asks for an M12 capability-core contract freeze. That freeze is a W1 exit, not a W0.1 one. W1 M12 may not implement the proposed manifest. The W2 catalog and the W4 distribution slice may not either. W1 stays Locked.

Claude Code `enabledPlugins` opts a plugin in. Presence of the directory is not the grant. VS Code contribution points are stable only after they are in the extension manifest, and D50 already refused copying `contributes` next to M12. The in-repo ACP client reads `agentCapabilities.loadSession` from the peer and rejects methods it does not implement. `capabilities.ts` can name Codex and ACP while Electron does not spawn them. A manifest draft is that kind of declaration. It is not 1.3.0.

### ExternalJob

The only full `ExternalJob` type is the M08 spec draft. The proposal does not contain it. `aigc-job.ts` `idempotencyKey` is the Exit 3 job-key slice, not this state machine. D52 defers live AIGC providers. Exact concurrency defaults in the M08 spec still require provider evidence.

W2 M08 is the first consumer. Its packet may not persist the draft. W3A M17 may not start on it. Stop rule 4 still requires the durable job-core contract to be frozen first.

ACP does not fold resume into protocol version 1. `session/resume` waits for `protocolVersion >= 2`, `session/load` waits for `loadSession`, and anything else is `peer_resume_unsupported`. Craft marks command execution and PTY `Locked` on a capability whose status is `display-only`. ExternalJob stays a draft beside 1.3.0 the same way.

### Workflow

`WorkflowDefinition` and `WorkflowRun` in the proposal depend on capability versions, port bindings, and `ArtifactRef`. Those inputs are themselves unfrozen. D41 still requires a finite DAG, one M03 call per step, and immutable running definitions. Freezing the proposal's `retryPolicy`, `resourceBudget`, and status unions would invent the field list those product rules do not fix.

W3A M17 is the first consumer. M17 may not implement or store the draft. W2 may not add a workflow store ahead of that freeze. W3A stays Locked.

VS Code keeps a proposal out of stable `vscode.d.ts` until it is finalized. A host can already know that workflows are documents (D41) while the proposal file stays unshippable. ACP `initialize` does not carry a workflow document. Unknown methods stay locked. This note does not add workflow fields to protocol version 1.3.0.

### Spatial

`SpatialDocument` in the proposal and `CanvasDocument` in the v1.2 stub are different types. The stub uses a fixed `NodeType` union. The proposal uses `EntityRef` bindings and visual connectors only. M07 §5 already says the stub is not the final contract. BLK-003 has no spatial-renderer result. `docs/REFERENCE-PROJECT-POLICY.md` lists `@xyflow/react` as a candidate and does not promote it. D43 refuses an OpenPencil implementation from the retired assumption.

W3A M07 is the first consumer. M07 may not implement `SpatialDocument` and may not implement `CanvasDocument` as the spatial contract. Stop rule 5 still requires the renderer spike plus accepted M17, M12, and M16 contracts. W3A stays Locked.

Shipping the historical stub as the new spatial contract would treat a proposal-era type as stable API. VS Code does the opposite: proposed declarations stay out of `vscode.d.ts` until they are finalized, and published extensions cannot depend on them. tldraw and OpenPencil stay black-box references. No type is copied from them.

### View

`ViewContribution`, `ViewInstance`, and `LayoutSnapshot` are proposed. D42 says M16 is the one registration host inside the Craft shell and that it does not own domain documents. D50 records `fleet:<token>` and `<plugin-name>:<token>` and says the contribution table is not frozen. Frozen `workbench.sidebar_focus` focuses one sidebar slot. It is `wired` for the human MCP Apps pane. It is not a layout snapshot.

W2 M16 host is the first consumer. That slice may not implement the proposed view types. The W3A M16 composition slice waits on the same freeze. W2 stays Locked.

VS Code `contributes.views` is a host-owned contribution point. D50 already used that lesson for the id prefix and rejected a second `contributes` object. Unfinished API still sits in `vscode.proposed.<name>.d.ts` behind `enabledApiProposals` and is not a Marketplace contract. Claude Code `enabledPlugins` is an opt-in bit, not a dock layout. The view draft stays proposed beside 1.3.0.

## What stays open

Exit item 4 stays open. Exit item 1 stays open. Exit item 3 stays open. BLK-001 and BLK-003 stay open. W1 stays Locked. Settings install, enable, and disable stay `wired` in D49 and are not `usable`.

Still required before item 4 can close:

1. A later Lead freeze that accepts or rejects each draft and writes the accepted shape into the canonical protocol, with the version change in that same change. This note does not do that.
2. That freeze has to land before the first consumer packet named above. Recording the gate is not the packet.
3. The spatial row also waits on the BLK-003 renderer spike. This note does not record a spike result.
