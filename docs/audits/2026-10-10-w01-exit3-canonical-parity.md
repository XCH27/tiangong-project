# W0.1 Exit item 3 — canonical implementation/text parity

> **SUPERSEDED 2026-10-10 (D56):** Historical only. Not a product gate. ZCode-first supersedes this note.
>
> Product baseline is `.fleet/zcode` (ZCode). This Exit / Craft v0.11 pin / W0.1 Craft-migration material stays in git as reference-only historical audit. Do not treat these W0.1 Exit items as open product gates. Craft Agents remains interaction reference only. This banner does not delete the record below, does not mark `usable` or Ready, and does not invent a typecheck pass.


> **Date:** 2026-10-10
> **Role:** Fleet Lead. This note is the Exit item 3 parity record.
> **Base:** `6d4dd933` (`work/fresh-base-spine` after #55).
> **Pin:** Craft Agents OSS tag `v0.11.0` = `f4e172bf372f4ccc7389a189be1e0b0541f96282` (D51).
> **Capability:** documentation only. Nothing in this note is `usable`.
> **Gates:** W0.1 stays In Progress. W1 stays Locked. Exit item 1 stays open. Exit item 3 stays open. `CONTRACT_VERSION` stays `1.3.0`. No action id is added.
>
> **Exit item 1, unchanged:** Kanban and Settings panel UI stay unverified beyond the route restores in `docs/audits/2026-10-10-w01-exit1-routes-migration.md`. Migration branch `fleet/migration-from-v0.11.0` is open and adapt ports are not started. `typecheck:all` remains the #52 failure (exit 2). This note does not close Exit item 1 and does not invent a typecheck pass.

## What was compared

Fleet files were read on `6d4dd933`. Craft files were read from the public GitHub contents API at `f4e172bf`. The recursive tree at that commit lists 2106 paths and is not truncated. No path is named `AgentSeat`, `turn-admission`, `internal-action`, `idempotency`, or `baseRevision`. The only substring hit is `packages/ui/src/components/annotations/interaction-policy.ts`, an annotation helper. It is not the Fleet action policy.

`docs/contracts/composable-workspace-contracts.md` stays proposed v0.1. This note does not promote it and does not edit a contract file.

Peers are bounded the same way as `docs/audits/2026-10-10-w01-lead-decisions-oss.md`. Craft at the pin is the base. ACP and Codex are the in-repo clients, both `display-only` in `app/packages/shared/src/protocol/cli-executors/capabilities.ts`. Electron and `SessionManager` do not construct those clients. VS Code is the public editor API for document version only. No UI is copied.

## Status

| Field | Status | Fleet implementation on this tree | Craft v0.11.0 surface (`f4e172bf`) |
|---|---|---|---|
| AgentSeat / identity projection | partial | `app/packages/shared/src/protocol/agent-session.ts` (`AgentSeat`). Actor that is not a seat: `actor.ts`, `session-chrome.ts` `agentActorForCallingSession`. | `packages/core/src/types/session.ts` `Session`. Wire session: `packages/shared/src/protocol/dto.ts` `Session`. No seat type. |
| action ids + action policy | frozen | `app/packages/shared/src/protocol/internal-action.ts` `CONTRACT_VERSION` `1.3.0` and `InternalActionId`. `action-policy.ts` `FROZEN_ACTION_POLICY`. Text: `docs/contracts/action-ids.md` v1.3.0. D47–D49. | No action-id table. Shell commands: `dto.ts` `SessionCommand`. Tool permission: `packages/core/src/types/message.ts` `PermissionRequest`. Mode: `packages/shared/src/agent/mode-types.ts` `PermissionMode`. |
| caller provenance | partial | `ActionInvocation.callerKind` in `internal-action.ts`. `TurnRequest.actor` and `preAuthorizedBy` in `turn-admission.ts`. | `dto.ts` `PermissionModeState.changedBy`. `SessionEvent` `tool_start` carries `toolUseId`, `turnId`, `parentToolUseId`. `PermissionRequest.requestId`. RPC correlation: `protocol/types.ts` `MessageEnvelope.id`. |
| idempotency | partial | In-memory replay: `HostTurnKernel` `turns.get(invocationId)` in `turn-admission.ts`. Retry column: `action-policy.ts` `RetryPolicy`. Job key only: `aigc-job.ts` `idempotencyKey`. | RPC id: `MessageEnvelope.id`. Duplicate session: `ErrorCode` `SESSION_ID_CONFLICT`. Duplicate task tile: `dto.ts` `TaskCreateRequest.orchestratorSessionId`. |
| revisions | partial | Page target only: `page-local-ops.ts` `isBaseRevision` on the payload. `ActionInvocation` has no revision field. `TurnOutcome` has no `committedRevision`. | `dto.ts` `PermissionModeState.modeVersion` is a permission-mode counter. No document `baseRevision` path on the pin. |
| typed events | partial | Journal shape: `session-event.ts` `AuditSessionEvent`. Payload is `Record<string, unknown>`. Line name: `app/packages/shared/src/sessions/jsonl.ts` `fleet_host_session_event`. | Typed shell stream: `dto.ts` `SessionEvent`. Channel map: `protocol/events.ts` `BroadcastEventMap`. Agent stream: `packages/core/src/types/message.ts` `AgentEvent`. |
| action policy / HostTurnKernel admission | partial | Gate: `turn-admission.ts` `HostTurnKernel.admit` and `gateFor`, using `policyForAction`. Product journal: `SessionManager.openSessionHostKernel` in `app/packages/server-core/src/sessions/SessionManager.ts` with `session-file-journal.ts`. Card: `host-approval-bridge.ts`. | Tool gate: `packages/shared/src/agent/core/permission-manager.ts` `PermissionManager.evaluateToolCall`. Card event: `dto.ts` `SessionEvent` `permission_request`. Upstream `protocol/` has no `turn-admission.ts`. |

`frozen` means the text and the implementation constant already match at 1.3.0. `partial` means a slice exists and the W0.1 re-freeze for that field is still open. No field in this table is fully missing, and no field except the action-id table is frozen.

## Field notes

### AgentSeat / identity projection — partial

`AgentSeat` in `agent-session.ts` matches the v1.2 stub in `docs/contracts/protocol-stubs.md`: `seatId`, `role`, `domainTags`, `trustLevel`. `docs/contracts/identity-tags-permission-matrix.md` describes `identity_tags: string[]` and a grant/ceiling matrix. `docs/adr/0032-identity-tags-permissions-skill-loading.md` says tags are a projection of one seat and that the canonical shape is still pending. No function in `app/packages/shared/src/protocol/` derives tags from a seat or a seat from tags. `agentActorForCallingSession` documents the calling Craft session as an `ActorRef` and states that it is not an AgentSeat.

Craft's session is the identity. The core `Session` is the conversation scope. The v0.11 wire `Session` adds `permissionMode`, `labels`, `parentSessionId`, `projectId`, `taskSlug`, `taskRunId`, and `taskNodeId`. Those fields are session header and Tasks Conductor binding. They are not role, domain, or trust tags.

ACP `session/prompt` and Codex `thread/start` / `turn/start` in the in-repo clients name a session or a thread. They do not carry a seat. VS Code chat participants are contributions, not a permission seat. The reuse is the Craft session actor already used by session chrome. A seat panel is not part of this record. The projection stays unfrozen. D19 still names `AgentSeat` as a later M04 concept.

### action ids + action policy — frozen

D47–D49 and v1.3.0 already cover this slice. `CONTRACT_VERSION` in `internal-action.ts` is `1.3.0`. `FROZEN_ACTION_POLICY` has one row per `InternalActionId`, including `session.unflag`, `plugin.loadout_mutate`, `file.page_target`, `browser.dom_snapshot`, and `workbench.sidebar_focus`. `docs/contracts/action-ids.md` is the same table. The columns are permission gate, side effect, approval, undo, cancellation, retry, evidence, and callers. `workflow_runtime` is not a caller on any row.

Craft has no matching id list. `SessionCommand` is the shell command union (`flag`, `unflag`, `rename`, `setSessionStatus`, `setLabels`, `setPermissionMode`, and the rest). `PermissionRequestType` is `bash`, `file_write`, `mcp_mutation`, `api_mutation`, `admin_approval`. `PermissionMode` is `safe`, `ask`, `allow-all`, with canonical names `explore`, `ask`, `execute`. That mode is the Craft tool gate. It is not the Fleet L0–L3 table. ACP tool kinds and Codex `item/fileChange/requestApproval`, `item/commandExecution/requestApproval`, and `item/permissions/requestApproval` stay the comparison already recorded in the #39 note. This record does not add an id and does not bump the version. 1.3.0 already states the D47–D49 rows.

### caller provenance — partial

The frozen envelope stores `callerKind` as `agent` or `human_ui`, plus `ActorRef` on `TurnRequest`. `preAuthorizedBy` is the desktop human for an L2 pre-authorization. `HostTurnKernel.malformedReason` rejects a `callerKind` outside those two values and rejects an actor/caller mismatch. A `system` actor is stored with `callerKind: 'agent'` by `session-chrome.ts` `callerKindFor` and is then denied for any row that is not L0 (`actor_not_permitted`). The policy `callers` array is not read by `admit`.

The proposed `InvocationContext` in `docs/contracts/composable-workspace-contracts.md` (delegated actor, `correlationId`, `causationId`, workflow and node run ids, `workflow_runtime`) is not on `ActionInvocationSchema`.

Craft already records who changed a mode (`changedBy`: `user`, `system`, `restore`, `automation`, `unknown`) and which tool call sits inside a turn (`toolUseId`, `turnId`, `parentToolUseId`). The permission card is `PermissionRequest.requestId` on that session. The RPC envelope id correlates one request with its response. ACP `session/request_permission` is answered on the session that owns the turn. Codex approvals are turn-scoped in the in-repo client. Those are the provenance fields to keep on the Craft session. They are not a second caller type on v1.3.0.

### idempotency — partial

`HostTurnKernel.evaluateAdmission` returns the stored outcome when `invocationId` is already in the process-local `turns` map. That replay does not re-run the effect. `docs/modules/00-platform-spine.md` records that a restart reads `fleet_host_session_event` lines and does not rebuild turn phase, so this replay does not survive a process restart. `ActionInvocationSchema` has no `idempotencyKey`. The retry column `idempotent_replay` is a policy label. `aigc-job.ts` `findByIdempotency` is the M08 job record, and it is not the action envelope.

Craft correlates RPC with `MessageEnvelope.id`, rejects a conflicting session id with `SESSION_ID_CONFLICT`, and uses `orchestratorSessionId` so `tasks:create` does not mint a second board tile for an unadopted draft. ACP and Codex use the JSON-RPC id on the same stdio session. None of those is an action-envelope key. A new key stays in the proposed contract. This note does not add one.

### revisions — partial

`page-local-ops.ts` refuses `update-target` when `baseRevision` is missing or not a non-negative integer, before `admit`. The number travels inside the `file.page_target` payload. The frozen `ActionInvocation` type has no `baseRevision` field, and `TurnOutcome` has no `committedRevision`. The page-local host is `test-only` in M00 §13. `EditPopover` does not call it.

Craft `modeVersion` counts permission-mode changes. It is not a file revision. The pin tree has no `baseRevision` path. VS Code's public `TextDocument.version` is a document counter that increases on each change, including undo. That is the later pattern for a real page-target revision. It is not a UI to copy, and it is not implemented here. ACP and Codex turns in the in-repo clients do not carry a document revision.

### typed events — partial

`AuditSessionEvent` matches the v1.2 stub: eight `SessionEventKind` values, `actorRef`, `seq`, and `payload: Record<string, unknown>`. `HostTurnKernel.append` writes that untyped payload. `ActionSessionEvent` in `internal-action.ts` is a separate union (`action_blocked`, `action_error`, `supervision_request`, `supervision_resolution`, `action_completed`). The journal does not use it. `docs/contracts/protocol-stubs.md` still lists typed generic payloads as a required re-freeze delta. The proposed `ActionEventPayloadVNext` is not frozen.

Craft `SessionEvent` and `AgentEvent` are discriminated unions with a payload per variant. `BroadcastEventMap` types each push channel. The Fleet host line in `session.jsonl` is an extra record, `fleet_host_session_event`, which chat reads skip. It is not a variant of the Craft `SessionEvent` union. ACP `session/update` and Codex `item/agentMessage/delta` are the peer streams the in-repo clients already parse. The reuse is to keep the Craft session stream as the shell stream. A second event-name system stays out. The typed generic payload on the Fleet journal stays unfrozen.

### action policy / HostTurnKernel admission — partial

The frozen table and the kernel gate agree on the permission level. `gateFor` allows L0, allows L1 when undo is `supported`, waits on L1 when undo is `not_supported`, waits on L2 unless `preAuthorizedBy` is a human, and waits on L3. That is the column rule in `docs/contracts/action-ids.md`. Side effect, cancellation, retry, evidence, and the caller list are stored on `FrozenActionPolicy` and are not filters inside `admit`.

`SessionManager.openSessionHostKernel` builds one `HostTurnKernel` per Craft session on `SessionFileTurnJournal` and the existing `session.jsonl`. Awaiting turns publish the existing Craft permission card through `host-approval-bridge.ts`. Allow and Deny use `sessions:respondToPermission`. Pi is not the permission authority.

Craft `PermissionManager.evaluateToolCall` is the tool-mode gate (`explore` / `ask` / `execute`) for Claude and Pi tools. The card the renderer already shows is `permission_request`. Upstream `packages/shared/src/protocol/` at the pin is `channels.ts`, `dto.ts`, `events.ts`, `index.ts`, `routing.ts`, `types.ts`, and tests. `turn-admission.ts` is a Fleet file. Behaviour-ledger row A-01 names the port onto the Craft session kernel. That port is not started on `fleet/migration-from-v0.11.0`. Fleet `app/` stays package `0.10.5`.

## What stays open

Exit item 3 stays open. The action-id slice is the frozen part. The other six fields are partial on the current tree, and none of them is re-frozen as one contract version. Exit item 1 stays open on the facts in the header. BLK-001 stays open. W1 stays Locked. Settings install, enable, and disable stay `wired` in D49 and are not `usable`.

Still required before item 3 can close:

1. A later freeze, on the v0.11 tree after adapt row A-01, that either accepts or rejects the proposed caller context, envelope idempotency key, `baseRevision` / `committedRevision`, and typed journal payload. This note does not perform that freeze. 1.3.0 already covers D47–D49, so no version bump is required now.
2. One identity projection, or an explicit rejection of the tag matrix, consistent with the Craft session actor. This note does not add a seat.
3. The migration branch actually containing the host kernel. Naming the 0.10.5 files is not that port.

## Handoff

Changed documents are this note, `docs/DECISIONS-LEDGER.md` (D52 amendment), `docs/WAVE-MODULE-MAP.md`, `docs/UPSTREAM-BASELINE.md`, `docs/audits/2026-10-10-w01-v011-baseline-blk001.md`, `docs/audits/2026-10-10-w01-exit-checklist.md`, `docs/audits/2026-10-10-w01-lead-unblock.md`, `docs/BOARD-SYNC.md`, `docs/DOCUMENT-READINESS.md`, `docs/agent-packets/wave-0.1-control-plane-reconciliation.md`, `docs/modules/00-platform-spine.md`, and `docs/modules/01-clean-craft-baseline.md`.

New contract version: none. W1 gate: Locked.
