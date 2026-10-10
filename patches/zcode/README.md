# ZCode host reconstruction

`.fleet/zcode` is the local candidate host. It is gitignored and is not present in this checkout. This directory records how to apply the tracked host loop onto that tree. It does not vendor a second session store.

## What is tracked

The executable loop lives on the retained Craft tree and is declared in `docs/UPSTREAM-DELTA.tsv`:

- `app/packages/shared/src/protocol/action-policy.ts`
- `app/packages/shared/src/protocol/usage-attribution.ts`
- `app/packages/shared/src/protocol/turn-admission.ts`
- `app/packages/shared/src/protocol/__tests__/turn-admission.test.ts`
- `app/packages/shared/src/protocol/credential-boundary.ts`
- `app/packages/shared/src/protocol/provider-usage.ts`
- `app/packages/shared/src/protocol/kernel-snapshot-store.ts`
- `app/packages/shared/src/protocol/__tests__/kernel-snapshot-store.test.ts`
- `app/packages/shared/src/protocol/native-effect-executor.ts`
- `app/packages/shared/src/protocol/__tests__/native-effect-executor.test.ts`
- `app/packages/shared/src/protocol/host-approval-bridge.ts`
- `app/packages/shared/src/protocol/page-local-ops.ts`
- `app/packages/shared/src/protocol/cli-executors/`
- `app/packages/shared/src/protocol/aigc-job.ts`
- `app/packages/shared/src/protocol/subscription-observation.ts`
- `app/packages/shared/src/protocol/document-suite.ts`
- `app/packages/shared/src/protocol/docx-package.ts`
- `app/packages/shared/src/protocol/docx-xml.ts`
- `app/packages/shared/src/protocol/xlsx-package.ts`
- `app/packages/shared/src/protocol/xlsx-xml.ts`
- `app/packages/shared/src/protocol/pptx-package.ts`
- `app/packages/shared/src/protocol/pptx-xml.ts`
- `app/packages/shared/src/protocol/canvas-cards.ts`
- `app/packages/shared/src/protocol/browser-guest.ts`
- `app/packages/shared/src/protocol/canvas-card-view.ts`
- `app/packages/shared/src/protocol/plugin-settings.ts`
- `app/packages/shared/src/protocol/plugin-settings-host.ts`
- `app/packages/shared/src/protocol/plugin-catalog-sources.ts`
- `app/packages/shared/src/protocol/agent-plugin-manifest.ts`
- `app/packages/shared/src/protocol/mcp-apps-pane.ts`
- `app/packages/shared/src/protocol/mcp-apps-host.ts`
- `app/packages/shared/src/protocol/release-independence.ts`

`app/` stays where it is. Do not delete or relocate it.

## Execution boundary

Pi Agent Core sequences a default model turn only after the Fleet host admits that turn. It is not the permission authority, the durable journal, or the native executor.

The retained `app/packages/shared/src/agent/pi-agent.ts` subprocess still uses `@earendil-works/pi-coding-agent` as the Craft provider client. Keep that client. Do not describe it as the Fleet host.

`TODO.md`, `docs/product.md`, `docs/engineering.md`, `docs/references.md`, `docs/modules/agent-core.md`, and `docs/modules/models.md` are not in this checkout. Delivery order remains `docs/PROJECT-DIRECTION.md` and `docs/WAVE-MODULE-MAP.md`: kernel admission before feature pages. This change does not open a plugin or page wave.

## Local apply

When `.fleet/zcode` is available on a machine that has the candidate:

1. Port the protocol modules listed above into the host admission path.
2. Persist with `FileKernelSnapshotStore` at `hostKernelSnapshotPath(workspaceRoot, sessionId)`. That file is `sessions/{id}/host-kernel-snapshot.json`, beside the existing `session.jsonl`. Do not open another session or cost database, and do not rewrite `session.jsonl` from this adapter. Main opens one `HostTurnKernel` per Craft session through `SessionFileTurnJournal` on that `session.jsonl`. The snapshot file is not that journal.
3. Call `admit`, `approve` or `reject`, `run`, `stop`, `snapshot`, `save`, `load`, and `HostTurnKernel.restore` around any Pi default-turn sequencer. Pass a `NativeEffectRegistry` as `nativeEffects` so `run(invocationId)` executes the admitted effect. Call `commit()` only after the native write. Pi does not grant permission.
4. Map Claude and ChatGPT/Pi usage through `turnUsageFromClaude` and `turnUsageFromChatGpt` before `attributeTurnUsage`. Persist only through `HostTurnKernel.snapshot` and `FileKernelSnapshotStore`, which call `sealHostRecord`. That gate drops cache and price numbers that were not observed, including a Craft `cacheReadTokens: 0` that the Claude adapter fills when the field was missing. An explicit provider cache read of zero stays a confirmed miss. Do not copy auth tokens into the snapshot.
5. Keep the plugin marketplace unchanged. The DOCX suite is the one built-in document host from step 7. Publish an awaiting turn with `publishHostApproval` so the existing Craft permission card can Allow or Deny it. That response calls `HostTurnKernel.approve` or `reject`. Do not add a second approval dialog.
6. Codex and ACP stay `display-only`. Do not spawn them from Electron or `SessionManager`. `CliExecutorHost` is a test adapter: a fake stdio pair, frozen file actions, no `approve`, and no PTY. Command execution stays `Locked`.
7. Document edits use `createDocumentSuiteHost`. `applyDocumentFromHuman` and `applyDocumentFromAgent` both call `executeDocumentOp`. A DOCX write admits `file.update`. An XLSX create admits `file.create` and a first-sheet cell update admits `file.update`. A PPTX create admits `file.create` and a first-slide text update admits `file.update`. Commit only after the byte replace. Leave legacy XLS, legacy PPT, macro workbooks, formulas, animations, and a full slide editor Locked. Do not add a plugin marketplace.
8. Canvas cards use `createCanvasCardHost` with that document host and `createAigcHost`. Place admits `canvas.node_create`. Delete admits `canvas.node_delete` and waits for human approval. An XLSX or PPTX card projects the first sheet or first slide. `openOfficeCardFromHuman` and `openOfficeCardFromAgent` share `canvas.node_select`, as do focus and close, and that select names the file the existing preview overlay already opens. Cell and slide writes stay on `file.create` and `file.update`. A macro part and an unsafe path fail closed. Hide and stop stay view state. Do not stop the job kernel when a card stops. Leave a full spreadsheet editor and a full slide editor Locked. `@xyflow/react` stays uninstalled until the renderer spike is promoted.
9. Browser guest actions use `createBrowserGuestHost` on the retained `persist:browser-pane` profile. `runGuestActionFromHuman` and `runGuestActionFromAgent` share page find, loading stop, back, forward, and reload. `captureDomFromHuman` and `captureDomFromAgent` both admit `browser.dom_snapshot`. The row is L2, so the page is not read until a human allows the turn. Leave screenshot evidence and Chrome Store advertising Locked. Do not add a plugin marketplace.
10. `createPluginSettingsHost` is test-only. The Settings page does not call it and does not render the Craft session permission card. Install, enable, and disable call `plugins:mutateLoadout`, which calls `SessionManager.applySessionPluginMutation` with `plugin.loadout_mutate`. Allow and Deny settle through `resolveSessionPluginGrant` and `sessions:respondToPermission`. Allow writes the skills and MCP sources the agent loads. Deny writes nothing. `applyPluginMutationFromHuman` and `resolvePluginGrant` are not that caller. Market catalog reads use `readCatalogSource`. A local Agent Plugins 1.0.0 package is read by `readAgentPluginPackage` and lists only safe skills and MCP servers. Leave the sandboxed MCP App view and any remote plugin store Locked. Do not treat that loadout as a remote store. The caller is `wired`, not `usable`.
11. Release notices use `readReleaseDispositionForHuman` and `readReleaseDispositionForAgent`. Do not write a session journal for that read. Leave the signed production update feed Locked. Do not point a Fleet updater at a production URL.
12. The MCP Apps pane constructs one `createMcpAppsHost`. Human open, focus, and close admit `workbench.sidebar_focus`. The row is L0, so the turn does not wait for a card. The right-sidebar slot changes after the kernel completes. Agent helpers have no shell caller. The old sidebar verb still refuses a sidebar payload. The list is the enabled MCP rows in the plugin loadout plus a local inventory. Leave the sandboxed `ui://` view, live `tools/list`, and tool invocation Locked. Do not add a marketplace. Settings does not construct this host.
13. Page-local `update-target` uses `applyEditPageFromHuman` and `applyEditPageFromAgent`. Both admit `file.page_target`. Send `baseRevision` or the host does not admit. The row is L2, so the file is not written until a human allows the turn. `EditPopover` calls `selectPageModel` only. Do not add a Settings write. `file.update` still refuses a page-target payload.

Snapshot version `1` is the only readable version. A different version throws `unsupported_snapshot_version` and does not migrate data.

## Status

`Locked` in this table is the execution gate in `docs/WAVE-MODULE-MAP.md`, not a capability result. Nothing in this note is `usable`.

| Slice | Status |
|---|---|
| Process-local admission, permission gate, stop/recovery, usage confidence | `wired` |
| Session-directory KernelSnapshot v1 file and Claude/ChatGPT usage sealing | `wired` |
| In-process native effect after admission | `wired` |
| Existing permission card approves or rejects a published host turn | `wired` |
| Page-local set-model in the edit popover | `wired` |
| Page-local update-target through `file.page_target`. No shell caller. | `test-only` |
| Codex app-server and ACP stdio JSON-RPC executors after admission | `display-only` |
| CLI command execution, dynamic client tools, and PTY fallback | `Locked` |
| Gemini, Qwen, and Kimi launch presets | `display-only` |
| Approval-gated AIGC submit, artifact, stop, and recover | `wired` |
| Subscription observation for the settings reader and the agent DTO | `wired` |
| DOCX open, edit, undo, save, and reopen through file.update | `wired` |
| XLSX create through file.create, and first-sheet cell update through file.update | `wired` |
| PPTX create through file.create, and first-slide text update through file.update | `wired` |
| Canvas cards for an admitted DOCX and an admitted aigc artifact | `wired` |
| Hide, stop, and delete of a canvas card, with the file and job retained | `wired` |
| XLSX formulas, rich text, charts, extra sheets, and a full spreadsheet editor | `Locked` |
| Legacy XLS, macro workbooks, legacy PPT, and macro decks | `Locked` |
| PPTX animations and a full slide editor | `Locked` |
| XLSX and PPTX canvas cards that open the existing preview | `wired` |
| `@xyflow/react` spatial renderer | `Locked` |
| Built-in Chromium page find, loading stop, and native guest actions | `wired` |
| Governed DOM snapshot through browser.dom_snapshot. No shell caller. | `test-only` |
| Screenshot evidence and Chrome Store advertising | `Locked` |
| Settings Plugins page with five views and local market filters | `wired` |
| Plugin loadout install, enable, and disable through file.update | `test-only` |
| MCP Registry and skill-repository catalog sources | `wired` |
| Per-plugin approval for a third-party hook or MCP server | `test-only` |
| MCP Apps side pane list. No tool call. | `display-only` |
| MCP Apps human open, focus, and close through `workbench.sidebar_focus`. The pane constructs the host. | `wired` |
| MCP Apps agent open, focus, and close. No shell caller. | `test-only` |
| Sandboxed MCP App view, live tools/list, and tool invocation | `Locked` |
| Local Agent Plugins 1.0.0 skills and MCP servers projected into Market | `wired` |
| Remote plugin store and a plugin marketplace | `Locked` |
| Third-party notices for admitted dependencies | `wired` |
| Update-feed dry run | `wired` |
| Signed production update feed and a signed Fleet release | `Locked` |
| `.fleet/zcode` integration | not applied in this checkout |
| Live paid providers, quota ledger, automatic Pi tool admission, plugin marketplace, full Pi SDK host | `Locked` |
