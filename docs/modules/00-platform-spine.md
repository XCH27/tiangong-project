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
| 2026-10-09 | draft v1.1 | Canvas cards bind an admitted DOCX and an admitted aigc artifact. Hide, stop, and delete keep the owner state. |
| 2026-10-09 | draft v1.1 | Built-in Chromium guest find, loading stop, and a DOM snapshot admitted as file.create. Screenshot evidence and Chrome Store stay Locked. |
| 2026-10-09 | draft v1.1 | Settings Plugins page has five views and local market filters. Loadout writes admit file.update. MCP Registry, third-party hook approval, MCP Apps, and Agent Plugins 1.0.0 stay Locked. |
| 2026-10-10 | draft v1.1 | MCP Registry and skill-repository catalog reads feed the Market filters. A failed read lists nothing. Install still admits file.update. Hook approval, MCP Apps, and Agent Plugins 1.0.0 stay Locked. |
| 2026-10-10 | draft v1.1 | Third-party hook and MCP enable waits for the existing permission card. The grant is stored on the loadout. MCP Apps and Agent Plugins 1.0.0 stay Locked. |
| 2026-10-10 | draft v1.1 | MCP Apps side pane lists enabled tools and resources and admits open and focus. The sandboxed app view, live tool list, and Agent Plugins 1.0.0 stay Locked. |
| 2026-10-10 | draft v1.1 | A local Agent Plugins 1.0.0 package projects skills and MCP servers into Market. Credential-shaped and unsafe fields add nothing. A remote store stays Locked. |
| 2026-10-09 | draft v1.1 | Third-party notices fail closed when an admitted license is missing. The update-feed dry run stays local. A signed production feed stays Locked. |

## 13. Host And Pi Execution Boundary

Pi Agent Core sequences a default model turn. It does not own admission, L0-L3 permission, the durable timeline, stop/recovery, or native tool execution.

The retained Craft subprocess in `app/packages/shared/src/agent/pi-agent.ts` still uses `@earendil-works/pi-coding-agent` as the provider turn client. That client is the upstream chat backend. A connection probe that is not Anthropic-compatible falls through to one host mini-completion; that probe is one sequenced turn.

Fleet host admission for the frozen action table is the process-local loop in `app/packages/shared/src/protocol/turn-admission.ts`. It appends canonical `SessionEvent` kinds through a journal port. `MemoryTurnJournal` is a test and process-local stand-in. It is not a second session database.

`FileKernelSnapshotStore` writes `host-kernel-snapshot.json` in the existing session directory, beside `session.jsonl`, using the same write-to-temp-then-rename replace. It round-trips `KernelSnapshot` version 1 only. A different version throws `unsupported_snapshot_version` and leaves the previous file in place. `save`, `load`, and `HostTurnKernel.snapshot` pass through `sealHostRecord` before that JSON is written or returned. The gate removes credential-shaped keys and token strings, remaps raw Claude and ChatGPT/Pi usage, and omits cache or price numbers that were not observed. An explicit provider cache read of zero stays a confirmed miss. A price of zero stays confirmed only when a pricing reference is present. This file is the host execution projection of that session. It does not rewrite `session.jsonl` and it is not a new database. The broader M00 session adapter is still unresolved.

`NativeEffectRegistry` is the executor behind `HostTurnKernel.run` when the caller does not pass an explicit executor. It runs only after admission. `applyAtomicJsonEffect` uses the same atomic replace as `session.jsonl`. A stop before `commit()` leaves the file unwritten. A throw after `commit()` restores as `reconciling` and does not run the effect again. Pi Agent Core is not the permission authority.

Host approval uses the existing Craft permission card. `SessionManager.admitHostTurn` admits on the kernel attached for that session. When the outcome is `approval_required`, that admit calls `publishHostApproval` and emits the same `permission_request` event the card already renders. Callers do not make a second publish call. Allow and Deny call `sessions:respondToPermission`. When the request id is `host:{invocationId}`, `SessionManager.respondToPermission` calls `HostTurnKernel.approve` or `reject` for the desktop human. Always Allow resolves that one invocation and does not store a standing grant. L3 and an L1 action with no undo contract share that card. A direct `approve()` call remains valid. This does not draw a new dialog and it does not make Pi the permission authority. Pi tool calls are not admitted through this path.

Page-local edits keep the `EDIT_CONFIGS` list. `set-model` is the existing popover model control, now through `selectPageModel`. `update-target` is the added closed loop: `applyEditPageFromHuman` and `applyEditPageFromAgent` both call `executePageLocalOp`, which admits `file.update` and writes with the native effect. Credential-shaped documents are denied before the write.

`CliExecutorHost` in `app/packages/shared/src/protocol/cli-executors/` is the Codex app-server and ACP executor boundary. `HostTurnKernel.run` opens a plugin transport only after admit or approve. Codex speaks `codex app-server --stdio` JSON-RPC, including `thread/start`, `thread/resume`, `turn/start`, `turn/interrupt`, and reverse `item/*/requestApproval` results. ACP speaks newline-delimited JSON-RPC, including `initialize`, `session/new`, `session/prompt`, `session/cancel`, and `session/request_permission`. Resume uses `session/load` or `session/resume` when the peer advertises it, and fails closed with `peer_resume_unsupported` otherwise. Reverse tool requests are admitted on the same kernel. The adapters never call `approve` or `reject`. File edits, deletes, and moves map onto the frozen file actions. Command execution, dynamic client tools, client filesystem writes, and any PTY stay `Locked`. A permissions grant is turn-scoped and includes only the admitted file write. Gemini, Qwen, and Kimi launch strings are `display-only` presets. Claude remains the native SDK channel in `claude-agent.ts`. Pi Agent Core is not the permission authority.

`aigc.job_submit` still requires human approval before `run`. The native effect then calls the injected provider. A fake provider covers tests. The prompt is not written into the snapshot. Stop before submit does not call the provider. After the provider id is stored, recovery inspects that id and does not submit again. The artifact is previewed by the existing activity overlay when its kind is `aigc_artifact`.

`observeSubscription` is the usage reading for quota, tier, and remaining. The AI settings section and `readSubscriptionForAgent` both use it. A missing field stays unknown. An explicit zero stays zero. Live billing fetch is not part of this slice.

The document suite host is one built-in package, not a marketplace. `applyDocumentFromHuman` and `applyDocumentFromAgent` both call `executeDocumentOp`. Open and reopen read a DOCX package. Edit, undo, and a dirty save admit `file.update` and write the package with the same atomic replace as `session.jsonl`. The undo handle stores the previous bytes. The preview overlay shows those paragraphs in the existing preview chrome. Its Edit and Undo buttons apply the same paragraph replace to the bytes that overlay loaded and emit `DocumentPreviewCommand`. They do not admit a disk write. A parent that admits calls `applyDocumentFromHuman`. XLSX and PPTX return `Locked` and do not write. Library registration, file leases, and a plugin catalog stay out of this slice.

`createCanvasCardHost` places those same objects on the existing `CanvasDocument`. A DOCX card edit calls `applyDocumentFromHuman` or `applyDocumentFromAgent`. An image or video card reads the `aigc_artifact` on the job turn. Hide and stop are view state. `canvas.node_delete` removes the binding after human approval. The DOCX bytes, the job file, and the owner kernel turns stay. `@xyflow/react` is not installed. Card positions are the `CanvasNode` frame. The renderer spike stays `Locked`.

The built-in browser keeps the Craft `persist:browser-pane` profile and the session or manual owner on `BrowserPaneManager`. `runGuestActionFromHuman` and `runGuestActionFromAgent` share page find, loading stop, back, forward, and reload. `captureDomFromHuman` and `captureDomFromAgent` both admit `file.create` and write a DOM snapshot only after that admission. An agent that does not own the guest does not read the page. Screenshot evidence and Chrome Store advertising stay `Locked`. `browser.screenshot` is still not a frozen action id.

Settings → Plugins is one page on the existing settings navigator. The five views are Installed, Market, Skills, MCP, and Hooks. Market content filters are All, Skills, MCP, Hooks, and Commands. They read workspace skills, MCP sources, catalog entries from the MCP Registry and skill repositories, and a local Agent Plugins 1.0.0 package. `readAgentPluginPackage` accepts `plugin.json` at the package root. It lists a skill from `skills/*/SKILL.md` and an MCP server from `mcp.json` only when that component maps onto the existing loadout. A manifest with no such component adds no entries. Credential-shaped text, an unsafe name, a path that leaves the package, and a plugin marketplace document add nothing. Hooks, commands, inline Claude fields, and client extension files are not entries. The reader does not fetch a schema or a remote package. Catalog source filters follow the Sources navigator type filter. `readCatalogSource` accepts a recorded document in tests. Live fetch is optional, limited to the public registry list or an https skill index, and a failure returns no entries. `applyPluginMutationFromHuman` and `applyPluginMutationFromAgent` both call `executePluginMutation`. Install, enable, and disable admit `file.update` and write `.claude-plugin/loadout.json` with the same atomic replace as `session.jsonl`. Install does not enable. Enabling a third-party hook or MCP server sets `requireHumanApproval` on that `file.update` turn, so the existing permission card must Allow it before the loadout changes. An agent cannot approve the card. Deny leaves the plugin disabled and stores `decision: denied` on the loadout. Allow stores `decision: approved` and enables that plugin once. A later enable of the same plugin uses the stored grant. A different plugin still waits. The Hooks view renders that same card.

The MCP Apps side pane reads that same loadout. `projectEnabledMcpApps` lists enabled MCP tools and resources from a local inventory. `openMcpAppsFromHuman` and `openMcpAppsFromAgent` share `executeMcpAppsOp`, as do focus and close. Those calls admit `canvas.node_select`, the frozen L0 select, and change the existing right-sidebar slot. They do not write a file and they do not add an action id. `workbench.view_open` stays unfrozen. The sandboxed `ui://` app view, live `tools/list`, and tool invocation stay `Locked`. This page is not a remote store and it is not a plugin marketplace.

Release independence reads the admitted workspace packages and the bundled runtimes named by the existing packaging scripts. `readReleaseDispositionForHuman` and `readReleaseDispositionForAgent` return the same report. The About section shows that report. `renderThirdPartyNotices` writes no partial file when a license is missing. The checked-in `app/THIRD-PARTY-NOTICES.txt` is the persistent record. This check does not append a session journal and does not admit a turn. `checkUpdateFeed` accepts only a local dry-run document with relative artifact names. A signed document, a production disposition, or an absolute update URL stays `Locked`. The retained Craft updater in `app/apps/electron/src/main/auto-update.ts` is unchanged and is not a Fleet production feed. Packaging requirements are in `docs/release/PACKAGING-REQUIREMENTS.md`. `docs/engineering.md` is not in this checkout.

| Slice | Status |
|---|---|
| Process-local admit / approve / run / stop / recover / usage confidence | `wired` |
| Session-directory KernelSnapshot v1 file, including usage and credential sealing | `wired` |
| In-process native effect after admission, including atomic file replace | `wired` |
| Existing permission card approves or rejects an awaiting host turn | `wired` |
| Awaiting host admit on the session kernel publishes that permission card | `wired` |
| Page-local set-model plus shared update-target for human and agent callers | `wired` |
| Codex app-server stdio JSON-RPC executor after host admission | `wired` |
| ACP stdio JSON-RPC executor after host admission | `wired` |
| CLI command execution, dynamic client tools, client file writes, and PTY fallback | `Locked` |
| Gemini, Qwen, and Kimi process launch presets | `display-only` |
| `aigc.job_submit` after host approval: fake provider, artifact file, stop, and recover by provider id | `wired` |
| Subscription observation shared by the settings reader and the agent DTO | `wired` |
| DOCX open, human edit, agent edit, undo, save, and reopen through `file.update` | `wired` |
| DOCX paragraph preview in the existing overlay | `wired` |
| Canvas card for an admitted DOCX, sharing the document suite edit | `wired` |
| Canvas card for an admitted image or video `aigc_artifact` | `wired` |
| Hide, stop, and delete of a canvas card, leaving the admitted file and job | `wired` |
| XLSX and PPTX document suites | `Locked` |
| `@xyflow/react` spatial renderer | `Locked` |
| Built-in Chromium page find, loading stop, and native guest back, forward, and reload | `wired` |
| Governed DOM snapshot admitted as `file.create` for the human and the owning agent | `wired` |
| Screenshot evidence bundle and Chrome Store advertising | `Locked` |
| Settings Plugins page with five views and local market content filters | `wired` |
| Install, enable, and disable of the local plugin loadout through `file.update` | `wired` |
| MCP Registry and skill-repository catalog sources, with Market content filters | `wired` |
| Per-plugin approval for a third-party hook or MCP server, with the grant stored on the loadout | `wired` |
| MCP Apps side pane listing enabled tools and resources, with open and focus on the existing right sidebar | `wired` |
| Sandboxed MCP App view, live tools/list, and tool invocation from the pane | `Locked` |
| Local Agent Plugins 1.0.0 skills and MCP servers projected into Market | `wired` |
| Remote plugin store, Chrome Store, and a plugin marketplace | `Locked` |
| Third-party notices for admitted dependencies, failing closed when a license is missing | `wired` |
| Update-feed dry run with relative artifact names and no network fetch | `wired` |
| Signed production update feed and a signed Fleet release | `Locked` |
| Live paid image/video providers and a quota ledger | `Locked` |
| Automatic Pi tool admission into the permission card, and the rest of the M00 session adapter | `Locked` |
| Plugin marketplace and a full Pi SDK host | `Locked` |
| Local `.fleet/zcode` apply | not in this checkout; see `patches/zcode/README.md` |

This note does not open W1 and does not change the module capability header above. Product surfaces stay `Locked` until the W0.1 re-freeze.
