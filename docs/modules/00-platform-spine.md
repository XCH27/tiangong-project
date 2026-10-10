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

## 13. Host And Pi Execution Boundary

Pi Agent Core sequences a default model turn. It does not own admission, L0-L3 permission, the durable timeline, stop/recovery, or native tool execution.

The retained Craft subprocess in `app/packages/shared/src/agent/pi-agent.ts` still uses `@earendil-works/pi-coding-agent` as the provider turn client. That client is the upstream chat backend. A connection probe that is not Anthropic-compatible falls through to one host mini-completion; that probe is one sequenced turn.

Fleet host admission for the frozen action table is the loop in `app/packages/shared/src/protocol/turn-admission.ts`. `SessionManager.openSessionHostKernel` constructs one `HostTurnKernel` when a Craft session is created, opened, imported, or admitted, and journals that session through `SessionFileTurnJournal` into the existing `session.jsonl`. Chat reads skip `fleet_host_session_event` lines. Session rewrites keep them. `MemoryTurnJournal` stays the unit-test stand-in and is not the product journal. A process restart reads those events. It does not rebuild in-memory turn phase, so an awaiting card is not republished until a new admit. `FileKernelSnapshotStore` and the per-feature `create*Host()` kernels are not this path. Codex and ACP executors are not attached here. Command execution, dynamic client tools, client filesystem writes, PTY, and any new action id stay `Locked`.

`FileKernelSnapshotStore` has no production caller. The snapshot file below is `test-only`. Credential-shaped fields are sealed when `SessionFileTurnJournal.append` runs. The human session flag is the shell path that appends. The snapshot file itself is still written only by tests.

`FileKernelSnapshotStore` writes `host-kernel-snapshot.json` in the existing session directory, beside `session.jsonl`, using the same write-to-temp-then-rename replace. It round-trips `KernelSnapshot` version 1 only. A different version throws `unsupported_snapshot_version` and leaves the previous file in place. `save`, `load`, and `HostTurnKernel.snapshot` pass through `sealHostRecord` before that JSON is written or returned. The gate removes credential-shaped keys and token strings, remaps raw Claude and ChatGPT/Pi usage, and omits cache or price numbers that were not observed. An explicit provider cache read of zero stays a confirmed miss. A price of zero stays confirmed only when a pricing reference is present. This file is the host execution projection of that session. It does not rewrite `session.jsonl` and it is not a new database. The broader M00 session adapter is still unresolved.

Per-feature `create*Host()` kernels construct their own `NativeEffectRegistry`. That effect loop is `test-only` on the session kernel.

`NativeEffectRegistry` is the executor behind `HostTurnKernel.run` when the caller does not pass an explicit executor. It runs only after admission. `applyAtomicJsonEffect` uses the same atomic replace as `session.jsonl`. A stop before `commit()` leaves the file unwritten. A throw after `commit()` restores as `reconciling` and does not run the effect again. Pi Agent Core is not the permission authority.

The human Flag command calls `SessionManager.flagSession`. That method calls `admitHostTurn` for `session.flag` and `HostTurnKernel.run` on the kernel from `openSessionHostKernel`. The journal lines are `fleet_host_session_event` in `session.jsonl`. The frozen row is L0, so this turn does not publish a permission card and does not call `approve`. Unflag has no frozen id and does not admit. Rename, status, and labels do not admit. Opening the kernel does not publish a card. Card publish and approve/reject on that kernel stay `test-only`. When a turn is `approval_required`, Allow and Deny still call `sessions:respondToPermission`.

Host approval uses the existing Craft permission card. `SessionManager.admitHostTurn` admits on the kernel attached for that session. When the outcome is `approval_required`, that admit calls `publishHostApproval` and emits the same `permission_request` event the card already renders. Callers do not make a second publish call. Allow and Deny call `sessions:respondToPermission`. When the request id is `host:{invocationId}`, `SessionManager.respondToPermission` calls `HostTurnKernel.approve` or `reject` for the desktop human. Always Allow resolves that one invocation and does not store a standing grant. L3 and an L1 action with no undo contract share that card. A direct `approve()` call remains valid. This does not draw a new dialog and it does not make Pi the permission authority. Pi tool calls are not admitted through this path.

`EditPopover` calls `selectPageModel`. It does not call `applyEditPageFromHuman`. `update-target` asks for `file.update`. Admission refuses that page-target payload. The helper stays `test-only` and does not write.

`selectPageModel` is the popover model control. `update-target` is `test-only`. Credential-shaped documents are denied before a test write.

Electron and `SessionManager` do not construct `CliExecutorHost` and do not spawn Codex or ACP. `cli-executors/capabilities.ts` marks both `display-only`. That label is not a running peer. Command execution, dynamic client tools, client filesystem writes, PTY, and any new action id stay `Locked`.

`CliExecutorHost` is a test adapter. Tests drive a fake stdio pair. The adapters admit frozen file actions and never call `approve` or `reject`. Resume fails closed with `peer_resume_unsupported` when the peer does not advertise it. Gemini, Qwen, and Kimi launch strings are `display-only` presets. Claude remains the native SDK channel in `claude-agent.ts`. Pi Agent Core is not the permission authority.

`createAigcHost` is `test-only`. No production caller submits a job. The activity overlay can render an `aigc_artifact`; with no submitter that preview is `display-only`. The test host requires approval before a fake provider runs, does not resubmit after a stored provider id, and does not write the prompt into the snapshot.

`observeSubscription` is the usage reading for quota, tier, and remaining. The AI settings section calls `readSubscriptionForHuman` with no provider payload, so the lines stay unknown. `readSubscriptionForAgent` has no production caller and is `test-only`. A missing field stays unknown. An explicit zero stays zero. Live billing fetch is not part of this slice.

The shell Office readers are viewers. Edit and save on that overlay stay `Locked`. `createDocumentSuiteHost` is `test-only`. The test host reads a DOCX package, the first XLSX sheet, or first-slide PPTX text and admits `file.create` or `file.update` for those edits. The shell overlays do not call that host. Legacy `.xls`, `.xlsm`, `.ppt`, and `.pptm` stay `Locked`.

`ArtifactCanvasBoard` is not mounted by the Electron shell. `createCanvasCardHost` is `test-only`. The test host binds a file path on `CanvasDocument` and does not write sheet cells or slide text. `@xyflow/react` is not installed. A full spreadsheet editor, a full slide editor, and the renderer spike stay `Locked`.

The human toolbar calls `runGuestActionFromHuman` for find, loading stop, back, forward, and reload. That path is `wired`. `captureGovernedDom`, `captureDomFromHuman`, and `captureDomFromAgent` ask for `file.create` with a DOM snapshot payload. Admission refuses that verb. Those helpers stay `test-only` and do not read or write the page. Screenshot evidence and Chrome Store advertising stay `Locked`. `browser.screenshot` is still not a frozen action id.

Settings → Plugins is one page on the existing settings navigator. The five views are Installed, Market, Skills, MCP, and Hooks. Market filters list workspace skills, MCP sources, catalog reads, and a local Agent Plugins 1.0.0 package. A failed catalog read adds no entries. Credential-shaped text and a marketplace document add nothing. The page does not construct `createPluginSettingsHost`, does not call `applyPluginMutationFromHuman` or `resolvePluginGrant`, and does not write `.claude-plugin/loadout.json`. Install, enable, and disable on that page stay `Locked`. `createPluginSettingsHost` remains `test-only`. It is not `SessionManager.respondToPermission`. `SessionManager.applySessionPluginMutation` and `resolveSessionPluginGrant` still build a `file.update` loadout request on the Craft session kernel. Admission refuses that verb, so the call does not write. No shell or IPC caller uses them, so that API is `test-only`. The page does not render the Craft session permission card. `requireHumanApproval` is not an admission gate. A stored loadout grant is not host-turn Always Allow.

The MCP Apps side pane is a read projection. `projectEnabledMcpApps` lists enabled MCP tools and resources from the loadout and a local inventory. The pane does not construct `createMcpAppsHost`, does not admit focus, and does not call a tool. Closing it updates the existing right-sidebar slot. `openMcpAppsFromHuman` on the test host asks for `canvas.node_select`. Admission refuses that sidebar payload, so focus does not change. The sandboxed `ui://` app view, live `tools/list`, and tool invocation stay `Locked`. This page is not a remote store and it is not a plugin marketplace.

Release independence reads the admitted workspace packages and the bundled runtimes named by the existing packaging scripts. `readReleaseDispositionForHuman` and `readReleaseDispositionForAgent` return the same report. The About section shows that report. `renderThirdPartyNotices` writes no partial file when a license is missing. The checked-in `app/THIRD-PARTY-NOTICES.txt` is the persistent record. This check does not append a session journal and does not admit a turn. `checkUpdateFeed` accepts only a local dry-run document with relative artifact names. A signed document, a production disposition, or an absolute update URL stays `Locked`. `checkPackagingDryRun` is the unsigned layout check: admitted package versions must match the feed, and the artifact names must be the ones `packageDarwin`, `packageLinux`, `packageWindows`, and `scripts/install-app.sh` already expect. `publish` stays `never`. Signing-identity discovery stays off. The command is `bun run verify:packaging-dry-run` from `app/`. It does not invoke electron-builder. The retained Craft updater in `app/apps/electron/src/main/auto-update.ts` is unchanged and is not a Fleet production feed. Packaging requirements are in `docs/release/PACKAGING-REQUIREMENTS.md`. `docs/engineering.md` is not in this checkout.

`wired` means a shell path or a packaging script runs the behavior, and the row matches that path. `display-only` means a label or a list renders and the claimed admission does not run. `test-only` means the function and its tests exist and no production caller uses them. `Locked` is the execution gate in `docs/DEVELOPMENT-PROCESS.md`, not a capability result. Nothing in this table is `usable`.

| Slice | Status |
|---|---|
| One HostTurnKernel per Craft session in main, journaled in `session.jsonl`. Restart reads events and does not restore turn phase. | `wired` |
| Human session flag (`session.flag`) admitted and run on the session kernel, journaled in `session.jsonl` | `wired` |
| Process-local admit / approve / run / stop / recover on that kernel, other than the human session flag | `test-only` |
| Session-directory KernelSnapshot v1 file | `test-only` |
| In-process native effect and atomic file replace on the session kernel | `test-only` |
| Existing permission card approves or rejects an awaiting host turn | `test-only` |
| Awaiting host admit publishes that permission card | `test-only` |
| Page-local set-model in the session popover (`selectPageModel`) | `wired` |
| Page-local `update-target` for human and agent callers. Admission refuses the `file.update` payload. | `test-only` |
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
| PPTX first-slide text preview in the shell | `wired` |
| Office edit and save in the shell | `Locked` |
| XLSX formulas, rich text, charts, extra sheets, and a full spreadsheet editor | `Locked` |
| PPTX animations, a full slide editor, and MotionDeck | `Locked` |
| Legacy `.xls`, `.xlsm`, `.ppt`, and `.pptm` | `Locked` |
| Canvas cards for DOCX, XLSX, PPTX, and image or video artifacts, including hide, stop, and delete | `test-only` |
| `@xyflow/react` spatial renderer | `Locked` |
| Human Chromium page find, loading stop, back, forward, and reload | `wired` |
| Governed DOM snapshot. Admission refuses the `file.create` payload. | `test-only` |
| Screenshot evidence bundle and Chrome Store advertising | `Locked` |
| Settings Plugins page with five views and market filters | `wired` |
| Plugin loadout install, enable, and disable from Settings | `Locked` |
| `createPluginSettingsHost` loadout writes | `test-only` |
| Settings approval as the Craft session permission card | `display-only` |
| SessionManager plugin install and third-party enable. Admission refuses the `file.update` payload. No shell caller. | `test-only` |
| MCP Registry and skill-repository catalogs as a trusted marketplace | `display-only` |
| MCP Apps side pane: read projection of the loadout. No kernel, no focus admit, no tool call. | `display-only` |
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

This note does not open W1 and does not change the module capability header above. The header stays `not implemented`. The wave stays Locked.
