# SPEC — R4 Governed action seam

> Spec status: `draft` — **not implemented as a generic seam.** Existing Craft actions remain
> authoritative until one real vertical action satisfies this entire contract.
> Trigger: at least two real dual-caller mutations exist (labels; R3's acceptance status/label).
> Owner acceptance date: —

## Outcome

A human, agent, or (later) workflow can request the same consequential operation without separate
executors, permissions, or state paths. Every accepted request has one identity from intent through
permission, mutation, persistence, evidence, and caller-visible result (Decision S1).

```text
caller intent
  → resolve caller + Workspace scope
  → validate canonical input
  → create invocation identity
  → existing permission decision / approval resume
  → compare current state when conflict-sensitive
  → mutate and persist through the owning Craft authority
  → durable attributed evidence
  → visible result and safe recovery
```

Human UI does not fake an Agent tool call. Agent tools continue through Craft `PreToolUse`. Both
are adapters into the same action-specific executor and state authority.

Tool/loadout projection is not part of this seam. It determines which action schemas a model can
see before a request; this seam governs a request after a caller makes it. Both may consume the
same caller, capability and policy facts, but neither owns or configures the other (E13).

## Authorities to reuse (never rebuild)

- `SESSION_TOOL_DEFS` + handlers — Agent schema and adapter.
- `PreToolUse`, mode-manager, SessionManager approval flow — Agent permission authority.
- Existing UI RPC command — human adapter.
- Owning Craft service/store — mutation and persistence authority.
- Existing Session messages/events — evidence transport and durable history.

Do not add a universal action registry, new permission engine, invocation database, audit database,
undo stack, prompt builder or loadout registry to implement this contract.

## Minimum contract (types land beside the first real implementation)

```ts
type ActionCaller = {
  kind: 'human_ui' | 'agent' | 'workflow'
  actorId: string
  workspaceId: string
}

// Adopted from the 2026-07-17 external review: the invocation envelope carries an optimistic
// concurrency base so concurrent agents cannot silently overwrite each other (C11).
// invocationId doubles as the idempotency key across retries.
type ActionRequestMeta = {
  invocationId: string       // stable across retries → idempotent
  baseRevision?: number      // optimistic lock: state revision the caller acted on;
                             // mismatch at commit → status 'conflict', never silent overwrite
}

type ActionOutcome<TRecovery = unknown> = {
  invocationId: string
  correlationId: string
  status: 'approval_required' | 'running' | 'completed' | 'denied' | 'conflict' | 'failed' | 'cancelled' | 'unknown'
  policy: { result: 'allow' | 'ask' | 'deny'; reason?: string }
  recovery?: TRecovery
  error?: { code: string; message: string; retryable: boolean }
}
```

Do not expose fields the runtime cannot truthfully populate. `approval_required` and `running`
are non-final; `unknown` means dispatch/commit may have happened and recovery must inspect the
owning store or provider receipt before retry. `cancelled` requires confirmed non-dispatch or
termination; merely requesting cancellation does not settle an effect.

## Reality anchors and execution order

The first implementation must start at the existing human label path in
`app/apps/electron/src/renderer/components/app-shell/AppShell.tsx`, Agent adapter
`app/packages/session-tools-core/src/handlers/set-session-labels.ts`, policy gate
`app/packages/shared/src/agent/core/pre-tool-use.ts`, and owner mutation in
`app/packages/server-core/src/sessions/SessionManager.ts`. Before adding shared types, record both
caller traces and the persistence/evidence location. Then implement one vertical action, add
dual-caller, Ask/deny/conflict/restart fixtures, run the targeted tests from `app/`, and only then
extract the second action. `rg` output is an entry-point check, not acceptance evidence.

## Non-negotiable semantics

1. **Workspace scope is checked before target access.** A caller acts only on targets reachable
   through its effective Workspace and granted scope.
2. **Validation is shared.** UI, Agent, and workflow inputs reach the same canonical validation;
   an adapter may improve ergonomics but not bypass domain validation.
3. **Permission identity survives Ask.** Invocation identity exists before policy evaluation;
   approval resumes that identity; denial settles it. Never record every executed action as merely
   `allow` after losing how it was allowed.
4. **One mutation authority.** The executor calls the owning service once; no caller writes
   renderer state or a parallel store.
5. **Completion follows durable commit.** No success emitted before persistence is known; if the
   store lacks atomic commit semantics, add a narrow transactional method to that authority or
   choose a safer first action.
6. **Failure is visible.** RPC callers inspect structured failure; Agent callers receive a tool
   error; event consumers must not silently discard actionable failure.
7. **Evidence matches reality.** Durable history identifies action, caller, target, policy result,
   outcome. Live events update UI but do not substitute for durable evidence where restart audit is
   part of the capability.
8. **Recovery is conditional.** A restore compares the state/version produced by the original
   action and refuses to overwrite newer work (Decision S5).
9. **No secret or path leakage** in evidence or errors.

## Selecting the first reference action

Use the smallest existing Craft mutation that can prove the full lifecycle. Confirm in code first:
existing human and Agent callers; one Workspace-scoped target lookup; canonical validation for
every caller; permission correlation before execution; a mutation API reporting durable success;
a durable evidence location and visible error consumer; feasible restart/conflict tests.

`set_session_labels` remains a candidate, not an approved shortcut — its current path lacks shared
Workspace/domain validation, permission identity across Ask, atomic mutation/persistence, durable
attributed evidence, and human-visible structured failure. R3's acceptance status/label mutation is
the second candidate; choose whichever satisfies the checklist with less new surface.

## Acceptance criteria

| ID | Criterion | Verified by |
|---|---|---|
| R4-C1 | Human and Agent callers use one canonical validator/executor and one state authority | code audit + dual-caller test |
| R4-C2 | Cross-Workspace target attempts fail without revealing or mutating the target | targeted test |
| R4-C3 | Safe denial, Ask approval, Ask denial, Allow All produce truthful correlated outcomes | permission-path tests |
| R4-C4 | Invalid input, missing target, conflict, persistence failure are visible; no false-success UI state | induced-failure tests |
| R4-C5 | Restart shows committed state and durable attributed evidence | restart test |
| R4-C6 | Conditional restore succeeds only if no newer mutation occurred | conflict test |
| R4-C7 | All affected protocol callers migrated; targeted checks pass | caller audit |
| R4-C8 | Owner accepts the real UI interaction | owner acceptance |

Until every non-visual criterion is satisfied, status is `not implemented` — not
`wired but not visually checked`.

## References consumed

Primarily Craft-internal extraction (the two real caller paths in
[`../06-CODE-MAP.md`](../06-CODE-MAP.md)). External mechanism evidence: `software/codex`
explainable command-rule shape (justification + positive/negative examples, feeds S3 when rules
become configurable); `software/opencode` permission-inheritance and doom-loop mechanisms
(EVIDENCE_ONLY — its gaps are documented in
[`../../源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](../../源码参考/meta/CAPABILITY-REFERENCE-MAP.md)
and must not weaken Fleet's contract semantics).

## Implementation restraint

Do not create shared protocol types first and hope later actions justify them. Make one vertical
action correct, then extract only the contract the completed paths actually share. **The second
action is the test that the abstraction is genuinely reusable** — migrate it before declaring the
seam generic.

## Pages touched

R4 wires the seam behind existing surfaces; it must not introduce an invocation store or a new
navigation home.

| Surface ID | Create/extend/wire | Adapter/data contract | Permission | States exercised | Owner visual checkpoint |
|---|---|---|---|---|---|
| P-18 | extend approval/policy explanation | `ActionOutcome` + existing permission RPC | PreToolUse/approval | loading/error/denied/recovery | approval prompt + reason |
| P-50 | extend attributed activity detail | SessionEvent evidence | session scope | empty/error/recovery | caller/target/policy/outcome |

## Doc updates on completion

Capability row "Human/Agent shared actions" → real status; `04-ARCHITECTURE.md` §1 note; roadmap;
this spec.
