# M00 — Platform Spine

> **Capability status:** `not implemented`
> **Execution gate:** Locked pending W0.1 contract re-freeze
> **Wave:** W1
> **Owner:** Lead
> **Spec version:** draft v1.1 — 2026-07-09
> **Spec maturity:** contract draft; physical storage adapter unresolved on v0.11 baseline
> **Depends on:** W0.1 re-frozen action, event, and identity contracts.

## 1. Purpose

Provide the one local authority for Fleet sessions, actor identity, permission decisions, timeline evidence, and durable state. M00 does not introduce a physical daemon in W1/W2; it enables later user-visible modules to write one auditable timeline through one permission authority.

## 2. Scope

### In Scope

- Session creation/lookup, actor references, AgentSeat validation, permission decisions, and ordered SessionEvents.
- One canonical local persistence authority for sessions, events, approval records, invocation
  correlation, and lease metadata. The physical adapter is selected only after the v0.11 migration
  inspection and persistence ADR.
- A process-local spine exposed to the Electron main process and bounded Fleet Bridge consumers.

### Out of Scope

- A separately installed or long-lived daemon, remote account service, memory engine, terminal renderer, or Action Registry executor.
- A second session, permission, or timeline store.

## 3. Enabling Loop

```
human or agent request → M03 permission query → M00 evaluates identity and policy
→ one durable SessionEvent → caller receives allow / deny / approval-required
```

Failure path:

```
unrecognized actor, invalid seat, unavailable store, or denied policy
→ typed refusal / recovery state → action is not executed → failure evidence is appended when a session exists
```

## 4. Contract Surface

M00 consumes the frozen `SessionEvent`, `ActorRef`, `AgentSeat`, and permission vocabulary. It must not invent event kinds. Contract changes are Lead-owned and require W0.1 re-freeze before Worker implementation.

| Capability | Result | Timeline rule |
|---|---|---|
| check permission | allow, deny, or approval-required decision | decision basis is auditable; a mutation is not implied |
| append event | ordered `SessionEvent` | `seq` is monotonic per session |
| create seat | validated AgentSeat or `SeatCreationError` | creation/denial evidence is retained |
| read timeline | ordered, permission-filtered events | read-only; no new event required |

## 5. State and Persistence

- The retained/selected M00 store is authoritative for SessionEvent order, approvals, and execution
  metadata. No module assumes SQLite or creates a parallel database before W0.1 decides the adapter.
- In-memory caches are derived only and may be rebuilt from the canonical store.
- A state-changing transaction either commits its corresponding evidence or reports failure; no caller may claim success before both are durable.
- Restart recovery reopens the same local store and marks interrupted work for its owning module to reconcile; it never creates a replacement session database.
- `docs/PERSISTENCE-AUTHORITY-MAP.md` is the binding cross-module ownership map.

## 6. Permission and Identity Rules

- The canonical seat shape and its identity-tag projection are defined by the re-frozen identity contract.
- Every L2/L3 request returns an explicit decision or supervision request; no runtime lane, Manager Agent, or Bridge bypasses it.
- Denials are default-safe: a missing grant, malformed identity, or unavailable policy evaluation does not allow a mutation.

## 7. UI and Agent Surface

M00 adds no independent shell surface. Its visible outputs are reused by existing session timeline, approval, error, and status surfaces. Agent consumers may request `sessions:listEvents` and `sessions:checkPermission`; their transport names are not additional Action IDs.

## 8. Error Handling

| Condition | Visible result | Recovery |
|---|---|---|
| invalid seat identity | request refused with audit reference | Lead corrects the seat assignment; retry creates a new request |
| permission denied | no mutation; reason shown by caller | user changes approval or request scope |
| store unavailable | action remains unexecuted | retry after local storage recovery; never write a shadow store |
| interrupted transaction | no success status emitted | reconcile from the last committed transaction/event |

## 9. Forbidden Patterns

- Do not expose M00 as a general remote API or physical daemon in W1/W2.
- Do not persist identity tags separately from the canonical AgentSeat model.
- Do not let UI, Bridge, or a Worker append unvalidated timeline records directly.

## 10. Verification Procedure

1. Start the approved local application runtime.
2. Create a valid seat through the Lead-owned creation boundary; expected: one canonical identity and an auditable creation result.
3. Request an allowed L1 action through M03; expected: one permission decision and ordered SessionEvents persisted across restart.
4. Request an L3 action; expected: no mutation before explicit human resolution and a supervision event is visible.
5. Submit an invalid/under-granted seat; expected: no mutation, typed denial, and no second store.

## 11. Open Questions

| Question | Owner | Required before |
|---|---|---|
| Exact AgentSeat fields and tag projection | Lead | W0.1 re-freeze |
| Event payload schemas and action-version policy | Lead | W0.1 re-freeze |
| Canonical implementation parity evidence | Lead | W1 opening |
| Physical persistence adapter and migration/recovery contract | Lead | W1 opening |

## 12. Change Log

| Date | Version | Summary |
|---|---|---|
| 2026-07-09 | draft v1.1 | Rewritten as a closed spine contract; removes daemon ambiguity. |
| 2026-10-09 | draft v1.1 | Recorded the host/Pi execution boundary and the process-local admission slice. |
| 2026-10-09 | draft v1.1 | Added the session-directory KernelSnapshot v1 file adapter. |
| 2026-10-09 | draft v1.1 | Admitted turns can run an in-process native effect after host admission. |
| 2026-10-09 | draft v1.1 | Snapshot serialization drops unproven cache and price zeros and strips credentials. |
| 2026-10-09 | draft v1.1 | Existing permission card resolves host approval. Page edit adds update-target beside model switch. |
| 2026-10-09 | draft v1.1 | An awaiting admit on the session kernel publishes the existing permission card. |
| 2026-10-09 | draft v1.1 | Codex app-server and ACP stdio JSON-RPC executors run only after host admission. |
| 2026-10-09 | draft v1.1 | AIGC job submit runs only after host approval. Subscription fields stay unknown when unobserved. |
| 2026-10-09 | draft v1.1 | One DOCX suite opens, edits, undoes, saves, and reopens through file.update. XLSX and PPTX stay Locked. |
| 2026-10-10 | draft v1.1 | XLSX create admits file.create and a first-sheet cell update admits file.update. Formulas, legacy .xls, macro workbooks, and PPTX stay Locked. |
| 2026-10-10 | draft v1.1 | PPTX create admits file.create and a first-slide text update admits file.update. Legacy .ppt, macro decks, animations, and a full slide editor stay Locked. |
| 2026-10-10 | draft v1.1 | XLSX and PPTX canvas cards project the first sheet or first slide and open the existing preview through canvas.node_select. Full editors stay Locked. |
| 2026-10-09 | draft v1.1 | Canvas cards bind an admitted DOCX and an admitted aigc artifact. Hide, stop, and delete keep the owner state. |
| 2026-10-09 | draft v1.1 | Built-in Chromium guest find, loading stop, and a DOM snapshot admitted as file.create. Screenshot evidence and Chrome Store stay Locked. |
| 2026-10-09 | draft v1.1 | Settings Plugins page has five views and local market filters. Loadout writes admit file.update. MCP Registry, third-party hook approval, MCP Apps, and Agent Plugins 1.0.0 stay Locked. |
| 2026-10-10 | draft v1.1 | MCP Registry and skill-repository catalog reads feed the Market filters. A failed read lists nothing. Install still admits file.update. Hook approval, MCP Apps, and Agent Plugins 1.0.0 stay Locked. |
| 2026-10-10 | draft v1.1 | Third-party hook and MCP enable waits for the existing permission card. The grant is stored on the loadout. MCP Apps and Agent Plugins 1.0.0 stay Locked. |
| 2026-10-10 | draft v1.1 | MCP Apps side pane lists enabled tools and resources and admits open and focus. The sandboxed app view, live tool list, and Agent Plugins 1.0.0 stay Locked. |
| 2026-10-10 | draft v1.1 | A local Agent Plugins 1.0.0 package projects skills and MCP servers into Market. Credential-shaped and unsafe fields add nothing. A remote store stays Locked. |
| 2026-10-09 | draft v1.1 | Third-party notices fail closed when an admitted license is missing. The update-feed dry run stays local. A signed production feed stays Locked. |
| 2026-10-10 | draft v1.1 | Unsigned packaging dry run checks version metadata and artifact layout. It does not publish. A signed production feed stays Locked. |
| 2026-10-10 | draft v1.1 | One HostTurnKernel per Craft session in main journals into session.jsonl. Restart reads those events and does not restore turn phase. |
| 2026-10-10 | draft v1.1 | Relabeled §13 from the shell and the tests. Office previews are viewers. The MCP Apps pane is a read projection. Test hosts are not `wired`. |
| 2026-10-10 | draft v1.1 | Settings does not write the plugin loadout. Codex and ACP capability strings are `display-only`. |
| 2026-10-10 | draft v1.1 | SessionManager plugin install and enable admit file.update on the session kernel. That API is `test-only`. Settings writes stay `Locked`. |
| 2026-10-10 | draft v1.1 | Admission refuses a plugin loadout, sidebar focus, DOM snapshot, or page-target write on a frozen id. The human Flag command admits `session.flag` on the session kernel. |
| 2026-10-10 | draft v1.1 | Human rename, status, and labels admit `session.rename`, `session.set_status`, and `session.set_labels` on the session kernel. Those rows are L1 with an undo contract, so they do not publish a permission card. Unflag still does not admit. |
| 2026-10-10 | draft v1.1 | Agent `set_session_status` and `set_session_labels` admit on the target session kernel as the calling Craft session. Mini-session auto-complete admits as system and is denied. No new action id. |
| 2026-10-10 | draft v1.1 | Title generation admits `session.rename` as the desktop user. A refused admit does not write the name. No agent rename tool. Unflag and send-time auto-labels still do not admit. |
| 2026-10-10 | draft v1.1 | Send-time regex label matches admit `session.set_labels` on the session kernel. A human send uses the desktop user. Agent send tools use the calling Craft session. A refused admit does not merge labels. Unflag still does not admit. |
| 2026-10-10 | draft v1.1 | W0.1 exit checklist for the #28–#33 session-chrome admits: `docs/audits/2026-10-10-w01-exit-checklist.md`. No new action id. Unflag still does not admit. The header stays `not implemented`. |
| 2026-10-10 | draft v1.1 | Agent `rename_session` admits `session.rename` on the target session kernel as the calling Craft session. A blank or missing caller does not write the name. Title generation stays the desktop user. No new action id. |
| 2026-10-10 | draft v1.1 | Settings workspace rename admits `workspace.rename` on an existing session kernel. L2 publishes the permission card. Allow writes the folder name. Deny and a missing session leave it. No new action id. |
| 2026-10-10 | draft v1.1 | No production shell or IPC caller deletes through `file.delete` or `canvas.node_delete`. Those ids stay off the session permission card. D46 footnote: the PPTX shell is a first-slide viewer. Office edit and save stay Locked. MotionDeck stays Locked. |
| 2026-10-10 | draft v1.1 | Lead freeze v1.3.0. Human Unflag admits `session.unflag` on the session kernel. `plugin.loadout_mutate`, `file.page_target`, `browser.dom_snapshot`, and `workbench.sidebar_focus` are frozen and have no production caller. Settings plugin writes stay Locked. W0.1 stays Locked. |
| 2026-10-10 | draft v1.1 | Send-time auto-labels stay on `session.set_labels`. Unflag stays the `wired` `session.unflag` row. |
| 2026-10-10 | draft v1.1 | Governed DOM capture admits `browser.dom_snapshot` on the guest host. The row is L2, so an unapproved capture does not read the page. No shell caller. The same payload on `file.create` is still refused. The row stays `test-only`. Page-target, sidebar focus, and plugin loadout are unchanged. |
| 2026-10-10 | draft v1.1 | Page-local `update-target` admits `file.page_target`. The row is L2, so an unapproved write does not change the file. A missing `baseRevision` is not admitted. No shell caller. The same payload on `file.update` is still refused. The row stays `test-only`. Sidebar focus and plugin loadout are unchanged. |
| 2026-10-10 | draft v1.1 | MCP Apps open, focus, and close admit `workbench.sidebar_focus` on the test host. The row is L0, so the turn does not wait for a card. The Electron pane does not construct the host. No shell or IPC caller. The same payload on `canvas.node_select` is still refused. The row stays `test-only`. DOM capture, page-target, and plugin loadout are unchanged. |
| 2026-10-10 | draft v1.1 | SessionManager plugin install, enable, and disable admit `plugin.loadout_mutate` on the session kernel. The row is L2, so an unapproved call does not write. `op: grant` is `standing_grant_rejected`. No shell or IPC caller. The same payload on `file.update` is still refused. The row stays `test-only`. Settings writes stay Locked. |
| 2026-10-10 | draft v1.1 | The MCP Apps pane constructs one host. Human open, focus, and close admit `workbench.sidebar_focus`. L0 does not wait for a card. A refused open closes the slot. Focus and close write the slot after the kernel completes. Agent helpers stay `test-only`. `canvas.node_select` still refuses the payload. Settings plugin writes, DOM capture, and page-target stay unchanged. |
| 2026-10-10 | draft v1.1 | Settings → Plugins install, enable, and disable call `SessionManager.applySessionPluginMutation` through `plugins:mutateLoadout`. Allow and Deny settle through `resolveSessionPluginGrant` and `sessions:respondToPermission`. Allow writes the loadout of the skills and MCP sources the agent loads. Deny writes nothing. `op: grant` stays `standing_grant_rejected`. `file.update` still refuses the payload. The caller is `wired`, not `usable`. W0.1 stays Locked. |

## 13. Host And Pi Execution Boundary

Pi Agent Core sequences a default model turn. It does not own admission, L0-L3 permission, the durable timeline, stop/recovery, or native tool execution.

The retained Craft subprocess in `app/packages/shared/src/agent/pi-agent.ts` still uses `@earendil-works/pi-coding-agent` as the provider turn client. That client is the upstream chat backend. A connection probe that is not Anthropic-compatible falls through to one host mini-completion; that probe is one sequenced turn.

Fleet host admission for the frozen action table is the loop in `app/packages/shared/src/protocol/turn-admission.ts`. `SessionManager.openSessionHostKernel` constructs one `HostTurnKernel` when a Craft session is created, opened, imported, or admitted, and journals that session through `SessionFileTurnJournal` into the existing `session.jsonl`. Chat reads skip `fleet_host_session_event` lines. Session rewrites keep them. `MemoryTurnJournal` stays the unit-test stand-in and is not the product journal. A process restart reads those events. It does not rebuild in-memory turn phase, so an awaiting card is not republished until a new admit. `FileKernelSnapshotStore` and the per-feature `create*Host()` kernels are not this path. Codex and ACP executors are not attached here. Command execution, dynamic client tools, client filesystem writes, PTY, and any new action id stay `Locked`.

`FileKernelSnapshotStore` has no production caller. The snapshot file below is `test-only`. Credential-shaped fields are sealed when `SessionFileTurnJournal.append` runs. The human session flag, rename, status, and labels commands are the shell paths that append. Settings workspace rename appends `workspace.rename` on an existing session in that workspace. Title generation appends `session.rename` as the desktop user. Agent status, labels, and `rename_session` append on the target session with the calling session as the actor. `rename_session` is not the title-generation caller. Send-time regex matches append `session.set_labels` on that same kernel. A human send uses the desktop user. `send_agent_message` and `spawn_session` use the calling Craft session. The snapshot file itself is still written only by tests.

`FileKernelSnapshotStore` writes `host-kernel-snapshot.json` in the existing session directory, beside `session.jsonl`, using the same write-to-temp-then-rename replace. It round-trips `KernelSnapshot` version 1 only. A different version throws `unsupported_snapshot_version` and leaves the previous file in place. `save`, `load`, and `HostTurnKernel.snapshot` pass through `sealHostRecord` before that JSON is written or returned. The gate removes credential-shaped keys and token strings, remaps raw Claude and ChatGPT/Pi usage, and omits cache or price numbers that were not observed. An explicit provider cache read of zero stays a confirmed miss. A price of zero stays confirmed only when a pricing reference is present. This file is the host execution projection of that session. It does not rewrite `session.jsonl` and it is not a new database. The broader M00 session adapter is still unresolved.

Per-feature `create*Host()` kernels construct their own `NativeEffectRegistry`. That effect loop is `test-only` on the session kernel.

`NativeEffectRegistry` is the executor behind `HostTurnKernel.run` when the caller does not pass an explicit executor. It runs only after admission. `applyAtomicJsonEffect` uses the same atomic replace as `session.jsonl`. A stop before `commit()` leaves the file unwritten. A throw after `commit()` restores as `reconciling` and does not run the effect again. Pi Agent Core is not the permission authority.

The human Flag command calls `SessionManager.flagSession`. Rename calls `renameSession`. Status calls `setSessionStatus`. Labels calls `setSessionLabels`. Each calls `admitHostTurn` and `HostTurnKernel.run` on the kernel from `openSessionHostKernel`. The journal lines are `fleet_host_session_event` in `session.jsonl`. `session.flag` is L0, so that turn does not publish a permission card and does not call `approve`. `session.rename`, `session.set_status`, and `session.set_labels` are L1 with an undo contract, so they auto-admit, record the previous header as the undo snapshot, and do not publish a permission card. If an admit is `approval_required`, `admitHostTurn` publishes the existing permission card and the header stays unchanged until Allow or Deny calls `sessions:respondToPermission`. Allow runs that stored effect. Deny does not write. These commands do not call `requireHumanApproval`. Unflag admits `session.unflag` the same way: L0, no card, desktop user. A refused admit leaves the flag set. Opening the kernel does not publish a card. Card publish and approve/reject for awaiting turns other than Settings workspace rename and Settings plugin install, enable, and disable stay `test-only`.

Settings → Workspace name calls `updateWorkspaceSetting('name')`. The `workspaceSettings:update` handler calls `SessionManager.requestWorkspaceRename` and does not write `config.json` on that branch. The method admits `workspace.rename` on an existing Craft session in the workspace: the session the user is viewing, otherwise the latest session. The actor is the desktop user. The request does not set `preAuthorizedBy`, so the L2 row is `approval_required`. `admitHostTurn` publishes the existing permission card. Allow and Deny call `sessions:respondToPermission`. Allow runs the stored rename and records the previous name as the undo snapshot. Deny does not write. A workspace with no Craft session does not rename. A credential-shaped name is denied and does not write. Other workspace settings still save directly. This path does not call `requireHumanApproval`. Unflag admits `session.unflag` and does not publish a card. Plugin install, enable, and disable call `plugins:mutateLoadout`, admit `plugin.loadout_mutate`, and publish the Craft session card. That caller is `wired`, not `usable`. The shell PPTX overlay stays a first-slide viewer. Office edit and save stay Locked. MotionDeck stays Locked. D46 stays unmet.

The agent tools `set_session_status`, `set_session_labels`, and `rename_session` call `setSessionStatusFromAgent`, `setSessionLabelsFromAgent`, and `renameSessionFromAgent`. Those methods admit the same frozen ids on the target session kernel. The actor is the calling Craft session (`kind: agent`, id = that session id, display name = the session name or the id). It is not the desktop user and it is not a new AgentSeat. A blank id is `malformed_actor` and does not write. A missing caller does not write. `rename_session` is the agent rename. These tools do not call `requireHumanApproval`.

`generateTitle`, `refreshTitle`, and the first-message name slice call `applyGeneratedSessionName`. That method admits `session.rename` on the target session kernel and writes the header only after the kernel runs. The actor is the desktop user, the same permitted caller as human rename. `session.rename` is L1, so the host system actor is denied with `actor_not_permitted` and is not the caller. This path does not call `renameSessionFromAgent`. A generated title is not an agent rename. A refused admit, including a credential-shaped title, leaves the name unchanged.

`sendMessage` evaluates auto-label regexes after the user message is stored. When a match would add labels, `applySendTimeAutoLabels` admits `session.set_labels` on that session kernel and writes the merged list only after the kernel runs. A send that does not pass a calling session uses the desktop user. That includes the desktop RPC, the CLI RPC, the messaging gateway, plan accept, automation prompts, and host follow-ups that replay through `sendMessage`. None of those callers has another seat. `send_agent_message` and `spawn_session` pass the calling Craft session, the same actor as the agent labels tool. The host system actor is denied with `actor_not_permitted` and is not the caller. A refused admit, including a credential-shaped label, leaves the labels unchanged. This path does not call `requireHumanApproval`.

Mini-session auto-complete calls `admitMiniSessionAutoComplete`. The actor is the host process (`kind: system`). `session.set_status` is L1, so the kernel denies that actor with `actor_not_permitted` and the status stays unchanged. Borrowing the mini session as an agent, or storing a new seat, would invent authority. The denial is journaled. The header write inside that method runs only after an admit, which this actor does not receive.

Host approval uses the existing Craft permission card. `SessionManager.admitHostTurn` admits on the kernel attached for that session. When the outcome is `approval_required`, that admit calls `publishHostApproval` and emits the same `permission_request` event the card already renders. Callers do not make a second publish call. Allow and Deny call `sessions:respondToPermission`. When the request id is `host:{invocationId}`, `SessionManager.respondToPermission` calls `HostTurnKernel.approve` or `reject` for the desktop human. Always Allow resolves that one invocation and does not store a standing grant. L2 `workspace.rename`, L2 `plugin.loadout_mutate`, L3, and an L1 action with no undo contract share that card. Settings workspace rename and Settings plugin install, enable, and disable are the production callers that reach it. A direct `approve()` call remains valid. This does not draw a new dialog and it does not make Pi the permission authority. Pi tool calls other than `set_session_status`, `set_session_labels`, and `rename_session` are not admitted through this path.

`EditPopover` calls `selectPageModel`. It does not call `applyEditPageFromHuman` or `applyEditPageFromAgent`. `update-target` admits `file.page_target` on the page-local host. The input is the EditPopover key, the next document, and `baseRevision`. A missing `baseRevision` fails before admit and does not write. The row is L2 and the request does not set `preAuthorizedBy`, so the turn is `approval_required` and does not write until a human allows it. Deny and stop do not write. This kernel does not publish the Craft session card. No shell or IPC caller invokes the write, so the helper stays `test-only`. The same payload on `file.update` is still refused.

`selectPageModel` is the popover model control. `update-target` is `test-only`. Credential-shaped documents are denied before a test write. An unapproved turn does not write.

Electron and `SessionManager` do not construct `CliExecutorHost` and do not spawn Codex or ACP. `cli-executors/capabilities.ts` marks both `display-only`. That label is not a running peer. Command execution, dynamic client tools, client filesystem writes, PTY, and any new action id stay `Locked`.

`CliExecutorHost` is a test adapter. Tests drive a fake stdio pair. The adapters admit frozen file actions and never call `approve` or `reject`. Resume fails closed with `peer_resume_unsupported` when the peer does not advertise it. Gemini, Qwen, and Kimi launch strings are `display-only` presets. Claude remains the native SDK channel in `claude-agent.ts`. Pi Agent Core is not the permission authority.

`createAigcHost` is `test-only`. No production caller submits a job. The activity overlay can render an `aigc_artifact`; with no submitter that preview is `display-only`. The test host requires approval before a fake provider runs, does not resubmit after a stored provider id, and does not write the prompt into the snapshot.

`observeSubscription` is the usage reading for quota, tier, and remaining. The AI settings section calls `readSubscriptionForHuman` with no provider payload, so the lines stay unknown. `readSubscriptionForAgent` has no production caller and is `test-only`. A missing field stays unknown. An explicit zero stays zero. Live billing fetch is not part of this slice.

The shell Office readers are viewers. Edit and save on that overlay stay `Locked`. `createDocumentSuiteHost` is `test-only`. The test host reads a DOCX package, the first XLSX sheet, or first-slide PPTX text and admits `file.create` or `file.update` for those edits. The shell overlays do not call that host. Legacy `.xls`, `.xlsm`, `.ppt`, and `.pptm` stay `Locked`.

D46 stays Final. The native document is a MotionDeck. The shell PPTX path is `PptxPreviewOverlay`: first-slide text, with the save-locked notice, and no package rewrite. That preview is `wired`. It leaves D46 unmet. Office edit and save stay `Locked`. MotionDeck stays `Locked`. The footnote is `docs/modules/19-presentation-motion-surface.md` §10. This paragraph does not edit the ledger.

`file.delete` and `canvas.node_delete` have no production shell or IPC caller on the session kernel. Electron, `SessionManager`, and the RPC handlers do not admit either id. `createCanvasCardHost.deleteCard` admits `canvas.node_delete` on a private test kernel, and Electron does not construct that host. `CliExecutorHost` can admit `file.delete` in tests, and Electron and `SessionManager` do not construct that host. `sessions:delete`, `skills:delete`, and `sources:delete` remove their own records and are not `file.delete`. No permission card was added for either id. Settings `workspace.rename` and Settings plugin install, enable, and disable are the production host-card callers. Other card publish stays `test-only`. Unflag admits `session.unflag` with no card. `CONTRACT_VERSION` is 1.3.0. `browser.dom_snapshot` and `file.page_target` still have no shell or IPC caller. Governed DOM capture admits `browser.dom_snapshot` on the guest host and stays `test-only`. Page-target admits `file.page_target` on the page-local host and stays `test-only`. The MCP Apps pane constructs `createMcpAppsHost` and human open, focus, and close admit `workbench.sidebar_focus`. Settings plugin install, enable, and disable admit `plugin.loadout_mutate` on the session kernel. That caller is `wired`.

`ArtifactCanvasBoard` is not mounted by the Electron shell. `createCanvasCardHost` is `test-only`. The test host binds a file path on `CanvasDocument` and does not write sheet cells or slide text. `@xyflow/react` is not installed. A full spreadsheet editor, a full slide editor, and the renderer spike stay `Locked`.

The human toolbar calls `runGuestActionFromHuman` for find, loading stop, back, forward, and reload. That path is `wired`. `captureGovernedDom`, `captureDomFromHuman`, and `captureDomFromAgent` admit `browser.dom_snapshot` on the guest host kernel. That row is L2 and the request does not set `preAuthorizedBy`, so the turn is `approval_required` and does not read or write the page until a human allows it. This kernel does not publish the Craft session card. No shell or IPC caller invokes the capture, so the helpers stay `test-only`. The same payload on `file.create` is still refused. Screenshot evidence and Chrome Store advertising stay `Locked`. `browser.screenshot` is still not a frozen action id.

Settings → Plugins is one page on the existing settings navigator. The five views are Installed, Market, Skills, MCP, and Hooks. Market filters list workspace skills, MCP sources, catalog reads, and a local Agent Plugins 1.0.0 package. A failed catalog read adds no entries. Credential-shaped text and a marketplace document add nothing. The page does not construct the test host, does not call `applyPluginMutationFromHuman` or `resolvePluginGrant`, and does not render the Craft session permission card. Install, enable, and disable on a workspace skill or MCP source call `plugins:mutateLoadout`. That handler calls `SessionManager.requestSettingsPluginMutation`, which calls `applySessionPluginMutation` with the skills and MCP sources `loadAllSkills` and `loadAllSources` already return. The id is `plugin.loadout_mutate`. The row is L2 and the request does not set `preAuthorizedBy`, so an unapproved call does not write. Allow and Deny go through `resolveSessionPluginGrant` and `sessions:respondToPermission`. Allow writes `.claude-plugin/loadout.json` for that catalog. Deny writes nothing. Always Allow resolves that invocation and does not store `decision: approved`. A second enable publishes another card. `op: grant` is `standing_grant_rejected` and writes nothing. The same payload on `file.update` is still refused. A missing session and a credential-shaped id write nothing. `createPluginSettingsHost` remains `test-only`. It is not `SessionManager.respondToPermission`. This caller is `wired`, not `usable`. `requireHumanApproval` is not an admission gate.

The MCP Apps side pane lists enabled MCP tools and resources from the loadout and a local inventory. That list is a read projection and does not call a tool. The pane constructs one `createMcpAppsHost`. Human open, focus, and close call `openMcpAppsFromHuman`, `focusMcpAppFromHuman`, and `closeMcpAppsFromHuman` on that host. Those calls admit `workbench.sidebar_focus`. The row is L0, so the turn does not publish a card and does not call `approve`. Settings and a restored route show the existing right-sidebar slot, which mounts the pane. The pane then admits. A refused open closes the slot. Focus and close write the slot only after the kernel completes. A refused focus keeps the last admitted view. A refused close leaves the slot open. The actor is the desktop user. This kernel's journal is its memory journal. It does not publish the Craft session card and it does not append `session.jsonl`. `openMcpAppsFromAgent`, `focusMcpAppFromAgent`, and `closeMcpAppsFromAgent` have no shell or IPC caller, so those helpers stay `test-only`. The same payload on `canvas.node_select` is still refused. The sandboxed `ui://` app view, live `tools/list`, and tool invocation stay `Locked`. Settings does not construct this host. This page is not a remote store and it is not a plugin marketplace.

Release independence reads the admitted workspace packages and the bundled runtimes named by the existing packaging scripts. `readReleaseDispositionForHuman` and `readReleaseDispositionForAgent` return the same report. The About section shows that report. `renderThirdPartyNotices` writes no partial file when a license is missing. The checked-in `app/THIRD-PARTY-NOTICES.txt` is the persistent record. This check does not append a session journal and does not admit a turn. `checkUpdateFeed` accepts only a local dry-run document with relative artifact names. A signed document, a production disposition, or an absolute update URL stays `Locked`. `checkPackagingDryRun` is the unsigned layout check: admitted package versions must match the feed, and the artifact names must be the ones `packageDarwin`, `packageLinux`, `packageWindows`, and `scripts/install-app.sh` already expect. `publish` stays `never`. Signing-identity discovery stays off. The command is `bun run verify:packaging-dry-run` from `app/`. It does not invoke electron-builder. The retained Craft updater in `app/apps/electron/src/main/auto-update.ts` is unchanged and is not a Fleet production feed. Packaging requirements are in `docs/release/PACKAGING-REQUIREMENTS.md`. `docs/engineering.md` is not in this checkout.

`wired` means a shell path, the live session-tool callback, or a packaging script runs the behavior, and the row matches that caller. A human row does not cover an agent caller. `display-only` means a label or a list renders and the claimed admission does not run. `test-only` means the function and its tests exist and no production caller uses them. `fail-closed` means a production caller admits and the kernel denies the write, so the header stays unchanged. `Locked` is the execution gate in `docs/DEVELOPMENT-PROCESS.md`, not a capability result. Nothing in this table is `usable`.

| Slice | Status |
|---|---|
| One HostTurnKernel per Craft session in main, journaled in `session.jsonl`. Restart reads events and does not restore turn phase. | `wired` |
| Human session flag (`session.flag`) admitted and run on the session kernel, journaled in `session.jsonl` | `wired` |
| Human session rename (`session.rename`) admitted and run on the session kernel, journaled in `session.jsonl` | `wired` |
| Settings workspace rename (`workspace.rename`) on an existing session kernel. L2 publishes the permission card. Allow writes the folder name. Deny, a credential-shaped name, and a missing session leave the name unchanged. | `wired` |
| Human session status (`session.set_status`) admitted and run on the session kernel, journaled in `session.jsonl` | `wired` |
| Human session labels (`session.set_labels`) admitted and run on the session kernel, journaled in `session.jsonl` | `wired` |
| Agent `set_session_status` admitted on the target session kernel as the calling Craft session, journaled in `session.jsonl` | `wired` |
| Agent `set_session_labels` admitted on the target session kernel as the calling Craft session, journaled in `session.jsonl` | `wired` |
| Agent `rename_session` admitted on the target session kernel as the calling Craft session, journaled in `session.jsonl`. A blank or missing caller, or a credential-shaped name, leaves the name unchanged. | `wired` |
| Title generation (`generateTitle`, `refreshTitle`, and the first-message name slice) admits `session.rename` as the desktop user and journals it in `session.jsonl`. A refused admit leaves the name unchanged. | `wired` |
| Mini-session auto-complete. The host admits `session.set_status` as system. The kernel denies the L1 row. Status is not set to done. | `fail-closed` |
| Send-time auto-label rules. A match that would add labels admits `session.set_labels` and journals it. A send with no calling session uses the desktop user. `send_agent_message` and `spawn_session` use the calling Craft session. A refused admit leaves the labels unchanged. | `wired` |
| Human Unflag (`session.unflag`) admitted and run on the session kernel, journaled in `session.jsonl`. A refused admit leaves the flag set. | `wired` |
| Process-local admit / approve / run / stop / recover on that kernel, other than human session flag, unflag, rename, status, labels, title generation, and send-time auto-labels, other than agent session status, labels, and rename, other than mini-session auto-complete, other than Settings workspace rename, and other than Settings plugin install, enable, and disable | `test-only` |
| Session-directory KernelSnapshot v1 file | `test-only` |
| In-process native effect and atomic file replace on the session kernel | `test-only` |
| Existing permission card approves or rejects an awaiting host turn other than Settings `workspace.rename` and Settings `plugin.loadout_mutate` | `test-only` |
| Awaiting host admit publishes that permission card for turns other than Settings `workspace.rename` and Settings `plugin.loadout_mutate` | `test-only` |
| Page-local set-model in the session popover (`selectPageModel`) | `wired` |
| Page-local `update-target` for human and agent callers. `applyEditPageFromHuman` and `applyEditPageFromAgent` admit `file.page_target`. L2 waits for a human allow. A missing `baseRevision` does not admit. No shell or IPC caller. `file.update` still refuses the payload. | `test-only` |
| Codex app-server executor attached after host admission | `display-only` |
| ACP executor attached after host admission | `display-only` |
| CLI command execution, dynamic client tools, client file writes, and PTY | `Locked` |
| Gemini, Qwen, and Kimi process launch presets | `display-only` |
| `aigc.job_submit` with a fake provider, artifact file, stop, and recover | `test-only` |
| Activity overlay rendering an `aigc_artifact` | `display-only` |
| AI settings subscription lines (`readSubscriptionForHuman`; unknown with no payload) | `wired` |
| Agent subscription DTO (`readSubscriptionForAgent`) | `test-only` |
| DOCX, XLSX, and PPTX create, edit, undo, save, and reopen through `file.create` / `file.update` | `test-only` |
| DOCX paragraph preview in the shell | `wired` |
| XLSX first-sheet cell preview in the shell | `wired` |
| PPTX first-slide text preview in the shell. D46 footnote: this viewer leaves MotionDeck unmet. | `wired` |
| Office edit and save in the shell | `Locked` |
| Shell or IPC `file.delete` on the session kernel | `not implemented` |
| XLSX formulas, rich text, charts, extra sheets, and a full spreadsheet editor | `Locked` |
| PPTX animations, a full slide editor, and MotionDeck | `Locked` |
| Legacy `.xls`, `.xlsm`, `.ppt`, and `.pptm` | `Locked` |
| Canvas cards for DOCX, XLSX, PPTX, and image or video artifacts, including hide, stop, and delete | `test-only` |
| Shell or IPC `canvas.node_delete` on the session kernel. `createCanvasCardHost.deleteCard` stays on the test host. | `not implemented` |
| `@xyflow/react` spatial renderer | `Locked` |
| Human Chromium page find, loading stop, back, forward, and reload | `wired` |
| Governed DOM snapshot. `captureDomFromHuman` and `captureDomFromAgent` admit `browser.dom_snapshot` on the guest host. L2 waits for a human allow and does not read the page before that. No shell or IPC caller. `file.create` still refuses the payload. | `test-only` |
| Screenshot evidence bundle and Chrome Store advertising | `Locked` |
| Settings Plugins page with five views and market filters | `wired` |
| Plugin loadout install, enable, and disable from Settings. The page calls `plugins:mutateLoadout`. That handler calls `applySessionPluginMutation` with `plugin.loadout_mutate`. L2 waits. Allow writes the catalog the agent loads. Deny, a missing session, and a credential-shaped id write nothing. A second enable publishes another card. `file.update` still refuses the payload. | `wired` |
| `createPluginSettingsHost` loadout writes. The host admits `plugin.loadout_mutate`. L2 waits. The Settings page does not construct it. | `test-only` |
| Settings approval as the Craft session permission card. Allow and Deny call `resolveSessionPluginGrant` through `sessions:respondToPermission`. Always Allow does not store `decision: approved`. | `wired` |
| SessionManager plugin install, enable, and disable. `applySessionPluginMutation` and `resolveSessionPluginGrant` admit `plugin.loadout_mutate`. L2 waits for a human allow. `op: grant` is `standing_grant_rejected`. The Settings RPC is the caller. `file.update` still refuses the payload. | `wired` |
| MCP Registry and skill-repository catalogs as a trusted marketplace | `display-only` |
| MCP Apps side pane list: read projection of the loadout. No tool call. | `display-only` |
| MCP Apps human open, focus, and close. The pane constructs one `createMcpAppsHost` and calls the human helpers. Those calls admit `workbench.sidebar_focus`. L0 does not wait for a card. A refused open closes the slot. Focus and close write the slot only after the kernel completes. `canvas.node_select` still refuses the payload. | `wired` |
| MCP Apps agent open, focus, and close. The agent helpers have no shell or IPC caller. | `test-only` |
| Sandboxed MCP App view, live tools/list, and tool invocation | `Locked` |
| Local Agent Plugins 1.0.0 package as a plugin runtime | `display-only` |
| Remote plugin store, Chrome Store, and a plugin marketplace | `Locked` |
| Third-party notices for admitted dependencies, failing closed when a license is missing | `wired` |
| Update-feed dry run with relative artifact names and no network fetch | `wired` |
| Unsigned packaging dry run for version metadata and artifact layout | `wired` |
| Signed production update feed, a signed Fleet release, and live auto-update | `Locked` |
| Live paid image/video providers and a quota ledger | `Locked` |
| Automatic Pi tool admission into the permission card, and the rest of the M00 session adapter | `Locked` |
| Plugin marketplace and a full Pi SDK host | `Locked` |
| W1–W5, including this module as an execution gate | `Locked` |
| Local `.fleet/zcode` apply | not in this checkout; see `patches/zcode/README.md` |

This note does not open W1 and does not change the module capability header above. The header stays `not implemented`. The wave stays Locked. The W0.1 exit inventory is `docs/audits/2026-10-10-w01-exit-checklist.md`.
