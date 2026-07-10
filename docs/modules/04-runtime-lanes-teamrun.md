# M04 — Runtime Lanes and TeamRun

> **Capability status:** `not implemented`
> **Execution gate:** Locked
> **Spec maturity:** contract draft; v0.11 task/session mapping unresolved
> **Wave:** W2 core; optional native-batch member execution no earlier than W4
> **Depends on:** M00, M03, M05 leases, M02 runtime host

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

### Deferred Batch Eligibility

W2 TeamRun core does not depend on M08 or M11. A later W4 slice may map an offline TaskRun to an
M08 ExternalJob using a provider-native M11 adapter after those contracts are usable. No fixed
savings percentage is assumed.

| Task Type | Eligible for Batch? | Reason |
|---|---|---|
| Static code analysis, lint audit | ✅ Yes | Offline, output is a file/report |
| Documentation generation | ✅ Yes | No UI blocking |
| Test report summarization | ✅ Yes | Background post-run processing |
| Code writing / iterative editing | ❌ No | Requires real-time loop, file lease |
| Gate 1.5 supervision | ❌ No | Instant interception required |
| User-interactive clarification | ❌ No | Needs response before proceeding |

Until that slice exists, W2 tasks use bounded realtime/local RuntimeLanes only. The TeamRun
coordinator, not the Captain approval UI, observes task completion.

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

### 17.2 Logical Schema

```
TeamRun         { id, status, leaderId, createdAt, updatedAt }
TaskRun         { id, teamRunId, assignee, status, inputHash, outputRef, errorLog, batchId? }
AttributionChain { id, taskRunId, events: JSON }
RunRecoveryRecord { teamRunId, shutdownState, lastCommittedAt }
```

`status` values for TaskRun: `queued | running | suspended | completed | failed`

### 17.3 Lifecycle Rules

1. Every `TaskRun` status change is committed through M00's canonical run/event authority before
   a completed state is exposed. The physical store is selected by W0.1; M04 does not create an
   independent SQLite journal.
2. `WorkspaceFileLease` for a TaskRun is released when the TaskRun enters `completed`,
   `failed`, or `suspended`. The lease release is written to the journal atomically with the
   status change.
3. On graceful app exit, record a clean shutdown marker through the canonical authority.
4. On restart, if a clean marker is absent for a TeamRun, treat all its `running` TaskRuns
   as `suspended` (dirty state). Prompt the user to resume or cancel each suspended TaskRun
   before proceeding.

### 17.4 Deferred Batch TaskRun Integration

When the W4 extension is approved, TaskRun stores an M08 `externalJobId`; M08 remains the job
authority and M11 the provider Batch adapter. M04 observes the result and assembles RunReport. It
does not duplicate job polling/output state.

### 17.5 No Daemon

This section does not introduce a background daemon. The journal is a write-ahead log read only
at app startup. Decision D22 (no daemon) is honoured.

## 18. Non-Goals & Prohibitions

- **No Direct Coupling:** A CLI runtime must not directly call tools or own settings of an API runtime teammate. All orchestration must route through the Fleet Bridge.
- **No Permission Bypass:** Under-the-hood teammate runs must not bypass the L0-L3 graded permissions or timeline evidence logging.
