# Grok Build Harness Research: Planning, Execution, and Governed Mode Selection

> **Status:** source evidence, not implementation authority. Audited local checkout:
> `源码参考/software/grok-build/` at commit
> `b41c75a578f98bddbd326ab02cd53618451d97ee` (Apache-2.0). The checkout is a
> mechanism donor only. Craft v0.10.5 is the look pin; current Fleet implementation tracks Craft v0.13.4, and Fleet's
> existing Session, permission, timeline, task, settings, source, and provider paths remain the sole
> authorities.

Current contract qualification: this is historical Grok source evidence. Fleet's Plan entry is
opt-in (R1 independent Plan contract and the mode-selection comparison), so Grok's silent automatic entry is not a Fleet
requirement. Priority labels below classify research findings; they do not bypass R0 or activate
the absent Fleet work-mode implementation.

## 1. Executive answer

Grok Build does not contain a deterministic classifier that decides whether a user request should
enter planning or execution. Its default is the normal Agent path. It exposes `enter_plan_mode` to
the model with a semantic description saying to call it when the approach is ambiguous or the user
asks for a plan. The model's tool choice is the automatic decision:

- the tool identifies itself as the **agent-initiated** entry path
  (`crates/codegen/xai-grok-tools/src/implementations/grok_build/enter_plan_mode/mod.rs:1-10`);
- its description is the decision rule
  (`enter_plan_mode/mod.rs:45-60`, symbol `EnterPlanModeTool::description_template`);
- the agent builder guarantees the entry, exit, and clarification tools are present
  (`crates/codegen/xai-grok-agent/src/builder.rs:138-163`, symbol
  `ensure_plan_mode_tools`);
- calling the tool emits `PlanModeEntered` and changes the session/turn prompt modes to `Plan`
  (`crates/codegen/xai-grok-shell/src/tools/notification_bridge.rs:605-621`).

This is separate from **Auto permission mode**. Auto permission mode decides whether an already
selected tool call may execute; it does not decide whether the task should be planned. Its classifier
is installed and supplied with transcript/project context through permission commands
(`crates/codegen/xai-grok-workspace/src/permission/types.rs:252-263`). Planning tools are explicitly
fast-path allowlisted, so Auto's classifier normally does not even classify them
(`crates/codegen/xai-grok-workspace/src/permission/auto_mode.rs:1108-1159`, especially
`enter_plan_mode` at lines 1129-1132).

Therefore the transferable idea is not “copy Grok's plan classifier.” It is:

```text
model proposes a phase change
        ↓ typed tool/event
one Session-owned state machine
        ↓
mutation gate + review/approval + persisted recovery
        ↓
same task continues in execution mode
```

For Fleet this is an `EXTEND`, not a new agent runtime or task authority.

## 2. Exact call chain

| Stage | Grok Build mechanism | Source evidence |
|---|---|---|
| Default execution | `PromptMode::Agent` is the default; `Ask` and `Plan` are explicit read-only prompt modes | `crates/codegen/xai-grok-shell/src/session/plan_mode.rs:459-490`, symbols `PromptMode`, `PromptMode::is_read_only` |
| Automatic choice | The model sees `enter_plan_mode`; the description says to use it for ambiguity or an explicit plan request | `crates/codegen/xai-grok-tools/src/implementations/grok_build/enter_plan_mode/mod.rs:30-36,45-60` |
| Dependency closure | Entry requires exit to be registered, preventing a plan-only dead end; the builder also ensures `ask_user_question` | `enter_plan_mode/mod.rs:62-72`; `crates/codegen/xai-grok-agent/src/builder.rs:138-163` |
| Agent entry | `EnterPlanModeTool::run` emits `PlanModeEntered`, resolves client-facing tool names, and seeds a missing plan without truncating an existing file | `enter_plan_mode/mod.rs:102-170,174-213` |
| State transition | The notification bridge calls `activate_from_tool`, updates both session and current-turn modes, persists the snapshot, and emits a typed client mode update | `crates/codegen/xai-grok-shell/src/tools/notification_bridge.rs:605-621`; `crates/codegen/xai-grok-shell/src/session/plan_mode.rs:261-272` |
| Planning constraint | A pre-permission edit gate blocks edits outside the plan file in every permission mode | `crates/codegen/xai-grok-shell/src/session/acp_session_impl/tool_calls.rs:133-180,907-923` |
| Plan handoff | `exit_plan_mode` is intercepted; the client may approve, request changes/cancel, or abandon | `tool_calls.rs:1239-1331` |
| Execution | Approval allows the exit tool to run; exit notification returns both prompt modes to Agent and persists the state | `tool_calls.rs:1328-1330`; `notification_bridge.rs:623-651` |

The user can override the model:

- `/plan` or Shift+Tab enters Plan; `/plan <description>` also starts a turn
  (`crates/codegen/xai-grok-pager/docs/user-guide/19-plan-mode.md:40-47`);
- the state machine represents a user toggle as `Pending` until the first prompt, unlike an agent tool
  call that moves directly from `Inactive` to `Active`
  (`crates/codegen/xai-grok-shell/src/session/plan_mode.rs:17-43,198-228,261-272`);
- toggling off during a turn uses `ExitPending`, avoiding a mid-turn semantic discontinuity
  (`plan_mode.rs:291-324`).

## 3. Planning state is orthogonal to permission state

This is Grok's most important architectural lesson. Plan mode controls **what phase the task is in and
which mutations are legal**. Permission mode controls **whether a legal action needs approval**.
The plan gate runs before normal permission and hook handling
(`crates/codegen/xai-grok-shell/src/session/acp_session_impl/tool_calls.rs:907-989`), while exact plan-file
edits receive a narrow auto-approval
(`tool_calls.rs:990-1007`; `crates/codegen/xai-grok-shell/src/session/plan_mode.rs:179-184`).

Fleet should preserve the same separation:

- `ExecutionPhase`: `executing | planning | awaiting_plan_approval`;
- existing permission mode: safe/ask/allow policy, unchanged in authority;
- explicit user override: `auto | force-plan | force-execute`;
- one canonical pre-action policy intersection decides the final legal action.

Do not add plan values to the permission-mode enum and do not let permission approval silently change
the task phase.

## 4. State, persistence, approval recovery, and audit

Grok's `PlanModeTracker` is a small, session-owned, pure state machine
(`crates/codegen/xai-grok-shell/src/session/plan_mode.rs:1-16,44-80`). It records:

- four lifecycle states: `Inactive`, `Pending`, `Active`, `ExitPending`
  (`plan_mode.rs:17-43`);
- previous activation and full/sparse reminder counters;
- deferred exits, pending mid-turn activation, and outstanding plan approval;
- the single permitted plan path (`plan_mode.rs:52-80`).

Its persisted snapshot includes the outstanding approval bit. On restore it recomputes the plan path
and collapses transient `Pending`/`ExitPending` states to safe inactive states
(`plan_mode.rs:90-147`). Approval requests persist `awaiting_plan_approval`, register a typed pending
interaction, and default malformed responses to `cancelled`
(`crates/codegen/xai-grok-shell/src/session/acp_session_impl/tool_calls.rs:1393-1459`). Resume re-parks
the real approval rather than fabricating an approved transition
(`tool_calls.rs:1474-1509`).

Audit evidence is emitted as a typed `tool.decision` with `source = "plan_mode"` when the phase gate
rejects an edit (`tool_calls.rs:907-918`). Session and turn prompt modes are stored separately so an
agent's mid-turn phase change is distinguishable from a client setting that applies to the next turn
(`crates/codegen/xai-grok-shell/src/tools/notification_bridge.rs:40-51`).

Fleet should `EXTEND` its canonical Session events and TaskContract with these facts. It should not
create `plan_mode.json`, a second plan store, or a second approval ledger. A rendered plan file may be
an export/projection, but the approved plan version and decision must be canonical Session/Task events.

## 5. What is genuinely worth reusing

| Priority | Classification | Mechanism to absorb | Fleet boundary |
|---|---|---|---|
| P0 | `EXTEND` | Model may **propose** plan entry through one typed, reversible action | Add a governed phase transition to the existing Session/Task path; do not add a second orchestrator |
| P0 | `EXTEND` | One phase gate runs before ordinary permission checks | Apply through Fleet's canonical pre-action path to every mutation-capable executor |
| P0 | `EXTEND` | Persisted pending approval and reconnect recovery | Reuse the existing approval/timeline authority; malformed or disconnected responses remain unapproved |
| P1 | `REUSE/EXTEND` | User override plus mid-turn-safe transitions | Reuse existing mode controls and session state; expose `auto`, forced planning, and forced execution without duplicating settings |
| P1 | `EXTEND` | Tool dependency closure and registry-resolved tool names | Extend the current effective-tool projection; do not hard-code provider-specific names or create a second registry |
| P1 | `EXTEND` | Full/sparse reminders and compaction recovery | Project the canonical phase into compacted context; do not make prompt text the authority |
| P1 | `EXTEND` | Plan approval with approve/revise/abandon outcomes | Reuse the current conversation/task review surface and Session events |
| P1 | `EXTEND` | Phase-transition and gate tests at state, tool, recovery, and UI-routing layers | Add acceptance fixtures for clear tasks, ambiguous tasks, explicit overrides, denied mutation, approval, disconnect, and resume |
| P2 | `REUSE/EXTEND` | Turn-boundary checkpoints and typed rewind | Reuse Fleet's existing branch/rollback path; Grok's bundled FS/hunk checkpoint is evidence, not a second history authority (`crates/codegen/xai-grok-workspace/src/session/checkpoint.rs:1-8,83-100,192-226,364-376`) |
| P2 | `REUSE/EXTEND` | Server-authoritative queued prompt wire metadata (`id`, `version`, `owner`, `last_editor`, position, running prompt) | Extend the one Session timeline/mailbox only; do not add a parallel queue store (`crates/codegen/xai-grok-shell/src/session/prompt_queue.rs:1-13,19-81`) |

No `NEW` authority is justified by this research. The only new product behavior is an extension of the
already-required task-execution-integrity capability.

## 6. Known defects and mechanisms Fleet must not copy

### 6.1 The “read-only” gate is incomplete

The implementation explicitly gates edit-class tools but lets Bash, MCP, web, and other non-edit tools
continue to the normal permission path
(`crates/codegen/xai-grok-shell/src/session/acp_session_impl/tool_calls.rs:141-165`). The official guide
confirms two holes:

1. Bash commands are not inspected for file writes.
2. Subagents start with an inactive plan tracker and do not inherit the parent's plan restriction.

See `crates/codegen/xai-grok-pager/docs/user-guide/19-plan-mode.md:127-136`. These are P0 blockers to
copying Grok's enforcement. Fleet's phase gate must apply at the canonical action boundary to file
tools, shell redirection, MCP mutations, browser/desktop mutations, and delegated agents. A child can
receive a stricter capability projection, never a wider phase policy than its parent.

### 6.2 Agent-entry approval documentation and code disagree

The tool comment and guide say agent-initiated entry requires user approval
(`enter_plan_mode/mod.rs:12-16`; `19-plan-mode.md:20-25`). At this audited commit, unhandled tool inputs
fall through to `AccessKind::Read(None)`
(`crates/codegen/xai-grok-workspace/src/permission/types.rs:268-304`), reads are normally auto-allowed
(`crates/codegen/xai-grok-workspace/src/permission/manager.rs:1933-1943`), and Auto permission mode
explicitly allowlists `enter_plan_mode` (`auto_mode.rs:1117-1147`). No dedicated entry-approval
interceptor was found. In practice, model-initiated plan entry is normally silent.

Fleet must decide this contract explicitly and test it. Recommended policy: entering planning is a safe,
reversible model proposal and may occur silently in `auto`; leaving planning to mutate requires an
approved plan or an explicit user force-execute action. The UI should still show the phase transition in
the existing timeline.

### 6.3 Headless exit can bypass approval

If no interactive client is wired, Grok logs the condition and executes the exit tool; a real disconnect
keeps planning active (`tool_calls.rs:1332-1347`). Fleet should fail closed whenever the TaskContract
requires approval. A caller may declare a non-interactive policy up front, but transport absence must not
silently weaken it.

### 6.4 Model choice is not a verified classifier

The user guide gives examples of ambiguous and straightforward tasks
(`19-plan-mode.md:26-38,147-160`), but the source has no semantic-classification test proving the model
will choose correctly. The tests cover the deterministic machinery after a choice: state transitions,
edit gates, approval routing, malformed responses, disconnect/resume, and client display. A PTY
Shift+Tab cycle exists but is ignored
(`crates/codegen/xai-grok-pager/tests/pty_e2e/shift_tab_in_session_cycles_mode.rs:7-51`).

Fleet should not advertise deterministic automatic routing based only on prompt wording. Add replayable
acceptance fixtures and deterministic risk signals: explicit user override, unresolved architectural
choices, mutation breadth, irreversible/public effects, and required owner checkpoints. These signals
may require planning or advise the model, but one Session-owned transition remains the authority.

## 7. Recommended Fleet landing order

1. **P0 — `EXTEND`: phase contract.** Add a Session/Task execution-phase field and typed
   propose/enter/approve/revise/abandon/force-execute events. Keep the existing task and timeline stores.
2. **P0 — `EXTEND`: complete enforcement.** Intersect phase policy with the existing permission path
   for all mutations, including Bash, MCP, browser/desktop, automation, and subagents. Add inheritance
   tests before enabling model-initiated planning.
3. **P0 — `EXTEND`: durable review.** Persist the exact plan version and pending decision in the
   canonical Session/Task stream; reconnect restores the pending review and never assumes approval.
4. **P1 — `REUSE/EXTEND`: automatic proposal.** Expose a typed `enter planning` action to the current
   agent tool projection. Its description can use ambiguity/risk guidance, but deterministic owner
   checkpoints override the model.
5. **P1 — `REUSE/EXTEND`: user control.** Reuse the existing mode/settings surface for
   `auto | force-plan | force-execute`; show the effective phase in the current conversation/task UI.
6. **P1 — `EXTEND`: evaluation.** Run a fixed corpus containing obvious edits, ambiguous architecture,
   research-only work, risky mutations, explicit plan requests, explicit execute requests, resume, and
   delegation. Measure wrong-plan, wrong-execute, blocked-mutation, approval-loss, and rework rates.
7. **P2 — conditional mechanisms.** Only after the phase path is usable, consider Grok-inspired prompt
   queue metadata and bundled rewind checkpoints through Fleet's existing timeline and rollback seams.

## 8. Admission decision

`EVIDENCE_ONLY` at this stage. The useful contribution is a typed, recoverable phase-transition
mechanism with a pre-permission mutation gate. Grok's model-facing tool description is a promising
automatic proposal mechanism, not proof of a reliable classifier. Its plan file, separate tracker
artifacts, incomplete Bash/subagent enforcement, and headless approval bypass must not be imported as
Fleet authorities or defaults.
