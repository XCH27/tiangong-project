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
- `app/packages/shared/src/protocol/canvas-cards.ts`
- `app/packages/shared/src/protocol/canvas-card-view.ts`

`app/` stays where it is. Do not delete or relocate it.

## Execution boundary

Pi Agent Core sequences a default model turn only after the Fleet host admits that turn. It is not the permission authority, the durable journal, or the native executor.

The retained `app/packages/shared/src/agent/pi-agent.ts` subprocess still uses `@earendil-works/pi-coding-agent` as the Craft provider client. Keep that client. Do not describe it as the Fleet host.

`TODO.md`, `docs/product.md`, `docs/engineering.md`, `docs/references.md`, `docs/modules/agent-core.md`, and `docs/modules/models.md` are not in this checkout. Delivery order remains `docs/PROJECT-DIRECTION.md` and `docs/WAVE-MODULE-MAP.md`: kernel admission before feature pages. This change does not open a plugin or page wave.

## Local apply

When `.fleet/zcode` is available on a machine that has the candidate:

1. Port the protocol modules listed above into the host admission path.
2. Persist with `FileKernelSnapshotStore` at `hostKernelSnapshotPath(workspaceRoot, sessionId)`. That file is `sessions/{id}/host-kernel-snapshot.json`, beside the existing `session.jsonl`. Do not open another session or cost database, and do not rewrite `session.jsonl` from this adapter.
3. Call `admit`, `approve` or `reject`, `run`, `stop`, `snapshot`, `save`, `load`, and `HostTurnKernel.restore` around any Pi default-turn sequencer. Pass a `NativeEffectRegistry` as `nativeEffects` so `run(invocationId)` executes the admitted effect. Call `commit()` only after the native write. Pi does not grant permission.
4. Map Claude and ChatGPT/Pi usage through `turnUsageFromClaude` and `turnUsageFromChatGpt` before `attributeTurnUsage`. Persist only through `HostTurnKernel.snapshot` and `FileKernelSnapshotStore`, which call `sealHostRecord`. That gate drops cache and price numbers that were not observed, including a Craft `cacheReadTokens: 0` that the Claude adapter fills when the field was missing. An explicit provider cache read of zero stays a confirmed miss. Do not copy auth tokens into the snapshot.
5. Keep the plugin marketplace unchanged. The DOCX suite is the one built-in document host from step 7. Publish an awaiting turn with `publishHostApproval` so the existing Craft permission card can Allow or Deny it. That response calls `HostTurnKernel.approve` or `reject`. Do not add a second approval dialog.
6. Pass a `CliExecutorHost` as `nativeEffects` when a turn payload selects `executorId` `codex-app-server` or `acp`. The host opens pipe stdio only after `run`. Reverse tool requests admit frozen file actions on the same kernel. The adapter does not approve them and does not fall back to a PTY. Command execution stays `Locked`.
7. DOCX edits use `createDocumentSuiteHost`. `applyDocumentFromHuman` and `applyDocumentFromAgent` both call `executeDocumentOp`. A write admits `file.update` and commits only after the byte replace. Leave XLSX and PPTX Locked. Do not add a plugin marketplace.
8. Canvas cards use `createCanvasCardHost` with that document host and `createAigcHost`. Place admits `canvas.node_create`. Delete admits `canvas.node_delete` and waits for human approval. Hide and stop stay view state. Do not stop the job kernel when a card stops. `@xyflow/react` stays uninstalled until the renderer spike is promoted.

Snapshot version `1` is the only readable version. A different version throws `unsupported_snapshot_version` and does not migrate data.

## Status

| Slice | Status |
|---|---|
| Process-local admission, permission gate, stop/recovery, usage confidence | `wired` |
| Session-directory KernelSnapshot v1 file and Claude/ChatGPT usage sealing | `wired` |
| In-process native effect after admission | `wired` |
| Existing permission card approves or rejects a published host turn | `wired` |
| Page-local set-model and shared update-target | `wired` |
| Codex app-server and ACP stdio JSON-RPC executors after admission | `wired` |
| CLI command execution, dynamic client tools, and PTY fallback | `Locked` |
| Gemini, Qwen, and Kimi launch presets | `display-only` |
| Approval-gated AIGC submit, artifact, stop, and recover | `wired` |
| Subscription observation for the settings reader and the agent DTO | `wired` |
| DOCX open, edit, undo, save, and reopen through file.update | `wired` |
| Canvas cards for an admitted DOCX and an admitted aigc artifact | `wired` |
| Hide, stop, and delete of a canvas card, with the file and job retained | `wired` |
| XLSX and PPTX suites | `Locked` |
| `@xyflow/react` spatial renderer | `Locked` |
| `.fleet/zcode` integration | not applied in this checkout |
| Live paid providers, quota ledger, automatic Pi tool admission, plugin marketplace, full Pi SDK host | `Locked` |
