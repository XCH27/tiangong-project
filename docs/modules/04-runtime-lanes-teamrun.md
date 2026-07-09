# 04 Runtime Lanes TeamRun

## 1. Mission

Let Fleet own team identity and coordination while API, CLI, and terminal runtimes execute bounded lanes.

## 2. User-Visible Loop

Leader requests a member run, Fleet creates TeamRun, target member receives task, reports back, and the leader sees compressed RunReport plus evidence.

## 3. Current App Reuse

Reuse Craft sessions as agents, labels for identity, team timeline, TeamRun protocol, permission cards, and session-mcp-server Bridge.

## 4. Reference Projects

AionUi for team/runtime patterns. Omnigent native-hook pattern is black-box behavior reference only. Do not create a new team platform.

## 5. UI Placement

Team state appears in existing session/team timeline: roster, task card, permission card, report card, member drawer. No separate multi-agent dashboard.

## 6. Backend / RPC / Locality

TeamRun coordinator, Bridge MCP callbacks, launcher adapter, and workspace leases are local orchestration. External CLI tools receive scoped Bridge only when available.

## 7. Session / Timeline / Permission / Rollback

Attribution chain must show user -> leader/lane -> Fleet Bridge -> member/lane -> action. L2/L3 never bypass permission.

## 8. Data Model

`AgentSeat`, `RuntimeLane`, `TeamRun`, `RunReport`, `AttributionChain`, `WorkspaceFileLease`, structured error codes.

### Worker Task Batch Eligibility

Not all TeamRun worker tasks should execute as real-time API calls. Tasks with no interactive dependency may be submitted as `ExternalJob` with `batchMode: 'async-native'` to save ~50% API cost:

| Task Type | Eligible for Batch? | Reason |
|---|---|---|
| Static code analysis, lint audit | ✅ Yes | Offline, output is a file/report |
| Documentation generation | ✅ Yes | No UI blocking |
| Test report summarization | ✅ Yes | Background post-run processing |
| Code writing / iterative editing | ❌ No | Requires real-time loop, file lease |
| Gate 1.5 supervision | ❌ No | Instant interception required |
| User-interactive clarification | ❌ No | Needs response before proceeding |

Batch-eligible worker tasks are submitted as `ExternalJob` (type `'analysis'`). The `RunReport` for that task is assembled when the batch job completes and results are downloaded. The Captain does not block waiting for the result — it registers a completion callback on the `ExternalJob`.

## 9. Agent-Native Actions

Fleet Bridge tools: get team, propose/start member run, get status/report, cancel, send team message, invoke L0/L1 internal action.

## 10. Files To Inspect First

- `app/packages/shared/src/protocol/team-run.ts`
- `app/packages/server-core/src/services/team-run-coordinator.ts`
- `app/packages/session-mcp-server/src`
- `app/packages/shared/src/protocol/team.ts`

## 11. Files Likely Touched

TeamRun service, Bridge server, team UI cards, member drawer, runtime launcher hooks, leases.

## 12. Parallel Work Packages

Bridge smoke, member report aggregation, permission UI, lease UI can split after contract freeze.

## 13. File Ownership

`team-run.ts`, team events, shared DTOs, Bridge tool names are Lead-owned.

## 14. Validation Ladder

Coordinator unit tests, session-tools/MCP tests, UI card smoke, one end-to-end Bridge smoke.

## 15. Done / Not Done

`usable`: real leader lane starts a member task and receives report. `wired but not visually checked`: coordinator exists without real Bridge smoke.

## 16. Risks And Blocked Decisions

Risk: treating API members as synchronous CLI tools. Bridge is synchronous outward, asynchronous inward.

## 17. TeamRun Journal (Crash Recovery)

### 17.1 Why

TeamRun lifetime currently equals Electron app lifetime. If the Bridge disconnects or the app
crashes, all in-progress TaskRun state is lost and RunReport cannot be resumed. This section
mandates a local persistence layer so TeamRuns survive restarts without introducing a daemon.

### 17.2 Schema (SQLite-backed)

```
TeamRun         { id, status, leaderId, createdAt, updatedAt }
TaskRun         { id, teamRunId, assignee, status, inputHash, outputRef, errorLog, batchId? }
AttributionChain { id, taskRunId, events: JSON }
JournalManifest { teamRunId, gracefulShutdown: boolean, lastWrittenAt }
```

`status` values for TaskRun: `queued | running | suspended | completed | failed`

### 17.3 Lifecycle Rules

1. Every `TaskRun` status change is written to the journal **before** the in-memory state
   changes (write-ahead).
2. `WorkspaceFileLease` for a TaskRun is released when the TaskRun enters `completed`,
   `failed`, or `suspended`. The lease release is written to the journal atomically with the
   status change.
3. On graceful app exit, write `gracefulShutdown: true` to `JournalManifest`.
4. On restart, if `gracefulShutdown` is absent for a TeamRun, treat all its `running` TaskRuns
   as `suspended` (dirty state). Prompt the user to resume or cancel each suspended TaskRun
   before proceeding.

### 17.4 Batch TaskRun Integration

Batch-eligible TaskRuns (`batchMode: 'async-native'`) store their `batchId` in the journal's
`TaskRun.batchId` field. Module 11's `BatchJobExecutor` polls and writes results back into
`TaskRun.outputRef`. The Captain registers a journal-watch callback on the TaskRun row instead
of blocking on the Bridge — this decouples TeamRun survival from Bridge lifetime.

### 17.5 No Daemon

This section does not introduce a background daemon. The journal is a write-ahead log read only
at app startup. Decision D22 (no daemon) is honoured.

## 17. Non-Goals & Prohibitions

- **No Direct Coupling:** A CLI runtime must not directly call tools or own settings of an API runtime teammate. All orchestration must route through the Fleet Bridge.
- **No Permission Bypass:** Under-the-hood teammate runs must not bypass the L0-L3 graded permissions or timeline evidence logging.
