# 05 — Milestone 1: Caller-Aware Action Invocation

> The first Fleet implementation slice after the working tree becomes a clean, re-verified baseline.
> It extends existing Craft authorities; it does not create a new action registry, permission engine,
> timeline, or session store.

## 1. Why this milestone exists

Fleet's central product property is not "every caller enters through the same hook." It is:

> Human UI, Agent, and later workflow callers share one action definition, caller-aware policy
> evaluation, executor, state authority, and attributed evidence outcome.

Craft already provides most of the mechanism:

- `SESSION_TOOL_DEFS` defines session-scoped Agent tools and `safeMode` metadata.
- `set_session_labels` already has a schema and handler.
- the handler reaches `SessionManager.setSessionLabels` through `SessionToolContext` callbacks.
- the human UI already changes labels through `sessionCommand(..., { type: 'setLabels' })`.
- Craft already owns session persistence, permission modes, approval UI, and SessionEvents.

The missing seam is a canonical invocation boundary that records **who** requested a consequential
action, evaluates the correct policy for that caller, reaches the existing state authority once, and
emits attributable evidence. `PreToolUse` is the Agent-side adapter into that boundary. A human UI
click does not simulate an Agent SDK tool lifecycle.

## 2. Why the first action is `set_session_labels`

Use the existing `set_session_labels` action. Do not use `files_rename` in this milestone.

Labels are the smallest real mutation that already has:

- an Agent tool definition and handler;
- an existing human UI;
- one durable state authority in `SessionManager`;
- semantic validation against configured labels;
- visible project/session behavior;
- a safe conditional restore based on the previous label snapshot.

File rename would prematurely require path containment, symlink handling, collision rules, write
coordination, and conditional file recovery. Those belong to Milestone 3.

Do not substitute `set_session_status` for the first proof. Its existing behavior intentionally lets a
human close a task while preventing an Agent from choosing a closed status, which adds product policy
that would obscure the invocation proof. Status can adopt the same seam after labels work.

## 3. Goal

A human and an Agent both change one session's labels through one canonical invocation boundary:

```text
Human UI ───────────────┐
                       ├─► canonical session action invocation
Agent via PreToolUse ───┘              │
                                      ▼
                         caller-aware policy decision
                                      │
                    allow ────────────┼──────────── ask / deny
                      │                               │
                      ▼                               ▼
           one labels executor/state authority   no mutation
                      │                               │
                      └───────────────┬───────────────┘
                                      ▼
                         attributed SessionEvent evidence
```

The paths share behavior and evidence semantics, not necessarily the same policy result:

- a local human UI action is explicit user intent and may be allowed directly;
- an Agent action is delegated and remains subject to Craft's `safe / ask / allow-all` modes and
  `safeMode: 'block'` classification;
- a future workflow caller inherits its initiating actor's scope and is out of scope for this slice.

## 4. Craft classification

### REUSE

- `SESSION_TOOL_DEFS`, `SetSessionLabelsSchema`, and `handleSetSessionLabels`;
- `SessionManager.setSessionLabels` and existing session persistence;
- renderer label controls and `sessionCommand` transport;
- Craft permission modes, PreToolUse, approval prompt, and existing SessionEvent transport;
- existing label resolver and configured-label authority.

### EXTEND

- add one canonical invocation seam inside the existing session/action authority;
- route the existing UI label mutation and Agent label callback through it;
- add the minimum attribution/correlation fields needed to existing session evidence;
- add conditional recovery metadata for this operation.

### NEW

No new product authority. The invocation record is correlation/evidence around the existing operation,
not a second action registry or event store.

## 5. Minimal invocation contract

The implementation may adapt names to existing TypeScript conventions, but the information below is
required. Do not add ArtifactRef, workflow, job, lease, or plugin fields in Milestone 1.

```ts
type SessionActionCaller = {
  kind: 'human_ui' | 'agent'
  actorId?: string
}

type SessionActionInvocation = {
  invocationId: string
  correlationId: string
  workspaceId: string
  sessionId: string
  actionName: 'set_session_labels'
  caller: SessionActionCaller
  input: { labels: string[]; expectedCurrentLabels?: string[] }
  createdAt: string
}

type SessionActionPolicyDecision = {
  result: 'allow' | 'ask' | 'deny'
  reason?: string
}

type SessionActionOutcome = {
  invocationId: string
  status: 'completed' | 'denied' | 'conflict' | 'failed'
  previousLabels?: string[]
  committedLabels?: string[]
  error?: { code: string; message: string }
}
```

`owner_checkpoint` remains a product/process decision for high-impact operations and is not needed by
this label action. It must not become a fourth Craft permission mode.

Contract semantics that the implementation must pin down (decided here so callers agree):

- **Labels in `input`, `previousLabels`, and `committedLabels` are resolved label IDs**, not display
  names. Display-name resolution (the existing resolver) happens before the invocation record is
  created; unknown labels fail before any record of a mutation attempt.
- **`expectedCurrentLabels` compares as a set** (order-insensitive, exact membership). A mismatch is a
  `conflict`.
- **`invocationId` identifies one invocation attempt and never changes** — an `ask` that is later
  approved resumes the *same* `invocationId`. **`correlationId` groups related invocations** (e.g. an
  original action and its later conditional restore, or a user retry after `conflict`); for a fresh
  standalone invocation it may equal `invocationId`. The caller-facing seam generates both.

## 6. Execution and policy rules

1. Validate the input structurally using the existing Zod schema.
2. Resolve configured label IDs using the existing resolver. Unknown labels fail before mutation.
3. Evaluate policy with caller identity:
   - `human_ui`: **in this milestone, always `allow`.** "Unless a product rule denies the target" is a
     future hook — do not build a human-side rule engine, rule store, or deny path for it now; the seam
     just records that the decision point exists;
   - `agent`: continue through Craft's PreToolUse/mode path. Because the existing tool is
     `safeMode: 'block'`, Safe denies it, Ask requests approval, and Allow All permits it.
4. If policy returns ask, wait without mutating state. Approval resumes the same invocation identity;
   denial settles it as denied.
5. Immediately before mutation, read current labels. If `expectedCurrentLabels` is present and does
   not match, return conflict without mutation.
6. Commit through `SessionManager.setSessionLabels` once.
7. Emit one attributed outcome linked to the invocation and policy result through the existing session
   event/timeline authority.

Do not call the handler once for policy and again for execution. Do not persist a separate invocation
database in Milestone 1. Correlation data belongs in the canonical session evidence path.

## 7. Evidence rules

Reuse the existing SessionEvent stream and renderer. Add optional attribution/correlation fields to
existing action/tool evidence if that is the smallest compatible route; do not create a second audit
log.

For each completed, denied, conflicted, or failed invocation, the user-visible evidence must answer:

- what action was requested;
- whether the caller was the human UI or an Agent;
- which session was targeted;
- whether policy allowed, asked, or denied;
- whether labels changed;
- what the user can do after a denial, conflict, or failure.

Do not expose internal stack traces, secret data, or unrestricted local paths. Existing consumers of
`tool_start` / `tool_result` must remain compatible if those event variants are extended.

## 8. Conditional recovery

Do not claim generic undo. A successful outcome records `previousLabels` and `committedLabels`. A
restore request invokes `set_session_labels` again with:

```ts
{
  labels: previousLabels,
  expectedCurrentLabels: committedLabels,
}
```

If another caller changed labels after the original action, the restore returns `conflict` and leaves
the newer labels untouched. The user can inspect the current value and decide again.

This is `conditional_restore`, not an unconditional inverse and not a product-wide undo stack.

## 9. Errors and visible recovery

| Condition | Outcome | Visible recovery |
|---|---|---|
| unknown label | failed, no mutation | show valid labels; correct input |
| Agent blocked in Safe | denied, no mutation | explain mode/scope; user may choose Ask/Allow All |
| Ask request denied | denied, no mutation | narrow the request or leave unchanged |
| expected labels stale | conflict, no mutation | refresh current labels; retry intentionally |
| session missing/inaccessible | failed, no mutation | reopen/select a valid session |
| persistence failure | failed; never report completed | retry after the store recovers |

## 10. Scope

### In scope

- one action: `set_session_labels`;
- two callers: human UI and Agent;
- caller-aware policy decision;
- one existing executor/state authority;
- attributed evidence and correlation;
- conditional restore;
- real Electron verification.

### Out of scope

- `files_rename`, file leases, Library, or ArtifactRef;
- workflows or a `workflow_runtime` implementation;
- a generic plugin/capability system;
- a new permission mode or `L0–L3` enum;
- a new event store, action registry package, or invocation database;
- a universal undo stack;
- UI panels, dashboards, docks, or settings pages.

## 11. Files to inspect before implementation

Confirm every path with `rg` against the clean baseline:

- `app/packages/session-tools-core/src/tool-defs.ts`
- `app/packages/session-tools-core/src/handlers/set-session-labels.ts`
- `app/packages/session-tools-core/src/context.ts`
- `app/packages/shared/src/agent/core/pre-tool-use.ts`
- `app/packages/shared/src/agent/session-self-management-bindings.ts`
- `app/packages/shared/src/agent/session-scoped-tool-callback-registry.ts`
- `app/packages/shared/src/protocol/dto.ts`
- `app/packages/server-core/src/sessions/SessionManager.ts`
- `app/packages/server-core/src/handlers/rpc/sessions.ts`
- `app/apps/electron/src/renderer/components/app-shell/AppShell.tsx`
- `app/apps/electron/src/renderer/event-processor/handlers/tool.ts`

## 12. Definition of done

1. Both existing callers reach one canonical invocation boundary and one
   `SessionManager.setSessionLabels` mutation path.
2. Evidence identifies caller kind, invocation/correlation identity, policy result, and outcome.
3. Human UI mutation succeeds without simulating PreToolUse.
4. Agent behavior is verified in Safe (denied), Ask (approval/denial), and Allow All (allowed), using
   Craft's existing modes and the existing `safeMode: 'block'` metadata.
5. Unknown labels and stale conditional restore both leave state unchanged with readable errors.
6. A successful action persists across app restart.
7. Conditional restore succeeds only when the committed labels are still current.
8. Existing session-tool and timeline consumers remain compatible.
9. No second registry, permission engine, session store, or timeline is introduced.
10. The real Electron UI and on-disk session state were observed; only then may the slice be called
    `usable`.

## 13. Verification ladder

After the complete slice is implemented:

1. Run typecheck and targeted tests for session-tools-core, shared protocol/policy, SessionManager RPC,
   and the renderer event path touched by the change.
2. Because this slice changes a shared invocation/evidence contract, run `bun run validate:dev` from
   `app/` at the integration gate.
3. Launch Electron and exercise the human, Agent allow, Agent deny/ask, failure, restart, and
   conditional-restore paths.
4. Review the diff for duplicate state/permission/event authorities and unrelated working-tree edits.

## 14. After Milestone 1

Record the verified behavior in `04-MILESTONES.md`, reduce this file to a short completed reference,
and write the single detailed Milestone-2 spec from the code that now exists. Do not expand this file
into a status diary.
