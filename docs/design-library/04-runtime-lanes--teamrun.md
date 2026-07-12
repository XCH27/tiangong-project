# M04 — Runtime Lanes and TeamRun

> **Recovered design material (2026-07-11).** Extracted from the previous project's module spec.
> The stale Wave/Gate/Loop/packet wrapper and dead cross-links were removed; the **design substance**
> below is kept as *source material* for a future branch's `DESIGN.md`, not as an active plan. Re-ground
> it in the code that exists when that branch starts, and strip anything no longer true.


## 1. Mission

Let Fleet own team identity and coordination while API, CLI, and terminal runtimes execute bounded lanes.

## 2. User-Visible Loop

Leader requests a member run, Fleet creates TeamRun, target member receives a scoped TaskBrief,
and the leader sees a compact task preview while it runs. Opening that preview reveals the parent /
child task tree, each Agent's current assignment and last meaningful activity; opening a child
reveals its authorized session transcript, TaskBrief, tool/action evidence, artifacts, approval
pause, and final RunReport. The child returns a compressed report to the parent, but the full
trace remains inspectable on demand rather than being copied into the parent chat.

## 3. Current App Reuse

Reuse Craft sessions as agents, labels for identity, team timeline, TeamRun protocol, permission cards, and session-mcp-server Bridge.

## 4. Reference Projects and Interaction Evidence

- Codex public material establishes the **durable goal / long-running task** direction, but does
  not document the private implementation or every trigger of the task preview card. The visual
  reference is therefore the owner-supplied Codex screenshot, not a claim about private code.
- GitHub Issues demonstrates that a parent item can own a browsable hierarchy of sub-items rather
  than a flat checklist. Fleet adopts hierarchy and explicit dependencies, not GitHub UI or code.
- LangGraph demonstrates the value of durable subgraph/run state and inspectable child state. Fleet
  uses its own M00/M04 state and does not adopt LangGraph's runtime.
- AionUi remains a reference for team/runtime patterns. Omnigent native-hook pattern is black-box
  behavior reference only.

Sources: [Codex durable goals](https://developers.openai.com/codex/use-cases),
[GitHub sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues),
and [LangGraph subgraph persistence](https://docs.langchain.com/oss/python/langgraph/use-subgraphs).

## 5. UI Placement

Team state appears inside the retained Craft shell, never in a second product shell:

1. **Task preview card** — an anchored, transient card over an existing task/run entry in the
   session or project list. It shows title, one status/summary line, up to three evidence/file
   chips, and `+N` overflow. It is a focusable Popover, not a permanent chat message or a new
   persistent panel.
2. **Contextual TeamRun board** — one M16 panel, available only when a TeamRun exists. It renders
   a collapsible parent/child tree with Agent identity, assigned task, lifecycle state, last
   meaningful event, blocker/approval marker, and finite child completion count when known.
3. **TaskRun inspector** — the existing contextual inspector opens for one selected row. It has
   `Overview`, `Activity`, `Conversation`, and `Artifacts` tabs. `Conversation` routes to the
   existing authorized child session/transcript; it never copies a second transcript into M04.

The visual target is Codex-like information density: a quiet white/neutral card, one-line title,
two-line summary maximum, small reference chips, and a lightweight shadow. Fleet uses its own
Craft-derived tokens, icons, typography, and labels; no Codex/ChatGPT branding or private assets
are copied. The card must open on mouse hover **and** keyboard focus, remain open while its
controls have focus, and close on Escape, focus exit, or selection change.

## 6. Backend / RPC / Locality

TeamRun coordinator, Bridge MCP callbacks, launcher adapter, and workspace leases are local orchestration. External CLI tools receive scoped Bridge only when available.

## 7. Session / Timeline / Permission / Rollback

Attribution chain must show user -> leader/lane -> Fleet Bridge -> member/lane -> action. L2/L3 never bypass permission.

## 8. Data Model

`AgentSeat`, `RuntimeLane`, `TeamRun`, `TaskRun`, `TaskBrief`, `RunReport`, `AttributionChain`,
`WorkspaceFileLease`, and structured error codes. The following fields are W2 contract-draft
requirements, not a new task store:

```ts
type TaskRun = {
  taskRunId: string
  teamRunId: string
  parentTaskRunId?: string
  assigneeSeatId: string
  taskBriefRef: string
  childSessionId?: string
  status: 'queued' | 'running' | 'waiting_for_approval' | 'suspended' |
    'completed' | 'failed' | 'cancelled'
  lastActivityEventId?: string
  artifactRefs: string[]
  runReportRef?: string
}

type TaskPreview = {
  taskRunId: string
  title: string
  status: TaskRun['status']
  summary?: string
  referenceIds: string[]
  childCounts?: { completed: number; total: number }
}
```

`TaskPreview` is derived from TaskRun plus M00 SessionEvents and ArtifactRefs. It is never a
second persisted truth, does not carry raw tool output, and does not manufacture a percentage for
open-ended work. A finite `completed / total` count is allowed only for already-created children.

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

Candidate M03 actions, all contract-draft until W0.1/first W2 packet:

| Action | Caller | Result | Boundary |
|---|---|---|---|
| `teamrun.task_list` | human UI, Agent | permission-filtered TaskRun tree | L0 read; no transcript payload |
| `teamrun.task_reveal` | human UI, Agent | opens M16 board/inspector for one permitted TaskRun | L0 view state only |
| `teamrun.task_open_conversation` | human UI, Agent | routes to the authorized child session | L0 read; M00 checks access |
| `teamrun.task_cancel` | human UI, Agent | requests cancellation through the owning runtime | policy-controlled; never marks completed |

An Agent can create a child run only through the existing bounded `propose/start member run` path
with a TaskBrief. It may reveal its own or an authorized child task, but cannot silently read a
different Agent's transcript or persistently rearrange a human's workbench.

### 9.1 TaskBrief / RunReport (context handoff)

Member runs and subagent spawns **must** follow
`docs/contracts/subagent-context-handoff.md` (now: 02-DECISIONS.md C3):

| Rule | Meaning |
|---|---|
| No bare spawn | Reject `propose_member_run` / spawn without a valid **TaskBrief** |
| Auto inject | Platform attaches workspace id, scope, knownFacts, optional M10 segments, lease paths—not the full parent transcript |
| Return shape | Child completes with a **RunReport** (summary + artifacts + evidence); lead does not ingest full child tool dumps |
| Scope sandbox | Tools prefer `scopePaths`; whole-monorepo explore requires explicit budgeted map mode |
| Parallel code | Disjoint scopes + M05 leases; prefer branch/worktree isolation |

Rationale (owner + industry): amnesiac children re-scan entire projects and burn tokens; isolation is
correct, **missing briefs are not**. See also M10 Context Pack (bounded retrieval, not chat dump).

### 9.2 Git / PR delivery (not orchestration)

Landing code on remote mains is **not** TeamRun’s job description, but member code tasks often end
in git/PR actions via M02/M03. Protocol:
`docs/contracts/git-pr-delivery.md` (now: 02-DECISIONS.md C4).

- Orchestration stays TeamRun/M17.
- PR is an **Agent-first delivery envelope**, not a human PR review product shell (D51/D52).

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

Risk: spawning many member runs without TaskBrief → N× full-repo reads and token blowups; treat as a
spec violation of §9.1, not “expected multi-agent cost.”

Risk: using GitHub PR UI or PR graphs as a substitute TeamRun board; forbidden by
`git-pr-delivery.md`.

## 17. TeamRun Journal (Crash Recovery)

### 17.1 Why

TeamRun lifetime currently equals Electron app lifetime. If the Bridge disconnects or the app
crashes, all in-progress TaskRun state is lost and RunReport cannot be resumed. This section
mandates a local persistence layer so TeamRuns survive restarts without introducing a daemon.

### 17.2 Logical Schema

```
TeamRun         { id, status, leaderId, createdAt, updatedAt }
TaskRun         { id, teamRunId, parentTaskRunId?, assignee, taskBriefRef, childSessionId?,
                  status, lastActivityEventId?, outputRef, runReportRef?, errorLog, batchId? }
AttributionChain { id, taskRunId, events: JSON }
RunRecoveryRecord { teamRunId, shutdownState, lastCommittedAt }
```

`status` values for TaskRun: `queued | running | waiting_for_approval | suspended | completed |
failed | cancelled`. The status is authoritative only after its corresponding M00 event is durable.

### 17.3 Lifecycle Rules

1. Every `TaskRun` status change is committed through M00's canonical run/event authority before
   a completed state is exposed. The physical store is selected by W0.1; M04 does not create an
   independent SQLite journal.
2. `WorkspaceFileLease` for a TaskRun is released when the TaskRun enters `completed`, `failed`,
   `cancelled`, or `suspended`. The lease release is written to the journal atomically with the
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

### 17.6 Task Preview and Team Board Projection Rules

1. The preview card and board read TaskRun, M00 events, TaskBrief/RunReport references, and M05
   artifacts; they do not own a parallel task, chat, or progress database.
2. Each visible child row has an `assigneeSeatId`, task title from TaskBrief, exact lifecycle
   state, and last meaningful event. “Thinking”, token counts, or inferred percentage progress are
   not shown as objective run state.
3. The inspector's Activity tab renders permission-filtered, redacted M00 events in causal order.
   Its Conversation tab is a route to `childSessionId`, not an embedded copy of private messages.
4. A missing, deleted, or unauthorized child session produces an explicit unavailable state; the
   board must not leak its title, raw prompt, artifact path, or error text.
5. Human, Agent, and workflow-created TeamRuns use the same projection. M17 may link a workflow
   node to a TaskRun, but WorkflowRun remains a different authority and the board labels that link
   rather than merging the two trees.

## 18. First Usable Verification — Task Visibility

1. Start one TeamRun with two children from an authorized leader; verify the board shows the exact
   parent/child relation and assignee for each without creating a second chat or task store.
2. Hover and keyboard-focus one task entry; verify the compact preview title, status, summary,
   three references plus overflow, Escape close, and open-inspector path.
3. Put one child at `waiting_for_approval`, one at `running`, and one at `completed`; verify the
   board shows truthful states and only finite child counts.
4. Open a permitted child Conversation tab; verify it routes to the original session and its
   ordered/redacted evidence. Deny another seat and verify no title, transcript, or artifact
   metadata leaks.
5. Restart during a running TeamRun; verify dirty runs become `suspended`, the board reports that
   state, and resume/cancel uses the owning runtime rather than a UI-only mutation.

## 19. Non-Goals & Prohibitions

- **No Direct Coupling:** A CLI runtime must not directly call tools or own settings of an API runtime teammate. All orchestration must route through the Fleet Bridge.
- **No Permission Bypass:** Under-the-hood teammate runs must not bypass the L0-L3 graded permissions or timeline evidence logging.
- **No Fake Codex Claim:** This is a Fleet implementation informed by an owner-supplied Codex
  screenshot and public durable-goal direction. It must not claim to reproduce Codex private
  implementation details.
