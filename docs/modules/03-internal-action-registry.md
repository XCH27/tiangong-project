# 03 Internal Action Registry

## 1. Mission

Make Fleet's internal capabilities discoverable, permissioned, versioned, callable by agents, and reusable by human UI.

## 2. User-Visible Loop

Human performs a real write, agent performs the same write with the same action id, both produce permission/timeline evidence, and undo works or is explicitly unavailable.

## 3. Current App Reuse

Reuse current `internal-action.ts`, DesignAction envelope, session events, permission service, and file action sample.

## 4. Reference Projects

OpenPencil and OpenCut Classic inform native command/action layers. Open Design plugin snapshots inform versioned capability contracts.

## 5. UI Placement

Actions sit behind existing UI entries. No action explorer is required for normal users; settings/debug surfaces can list actions later.

## 6. Backend / RPC / Locality

Registry and executor are local service paths. `list_internal_actions` and `invoke_internal_action` are agent-facing constants.

## 7. Session / Timeline / Permission / Rollback

Permission level comes from the registry, not caller input. Writes must define timeline event and undo handle.

## 8. Data Model

`InternalActionDefinition`, `ActionSurface`, `ActionInvocation`, `ActionTargetRef`, contract version, payload migration, undo handle.

### Schema Design Principles (Fleet-Wide)

These rules apply to every Zod schema used across Fleet — action payloads, memory entries, batch results, and structured model outputs.

#### 8.1 Field Hardness Classification

Not all fields need the same rigidity. Classify every field before deciding whether to mark it required:

| Class | Rule | Examples |
|---|---|---|
| **Identity fields** | Hard required. Model cannot be wrong. | `id`, `sourceEventId`, `tool`, `timestamp` |
| **Semantic judgment fields** | Optional. Add `'uncertain'` to every enum. | `scope`, `risk`, `outcome` |
| **Security boundary fields** | Optional in schema, but default to most restrictive if missing. | `allowedTargets`, `blockedTargets` |
| **Escape hatch fields** | Free-text optional. Let the model express uncertainty rather than guess. | `notes?: string` |

A field that is too hard will be hallucinated to satisfy the schema. A field that is too soft is useless. Match hardness to confidence.

#### 8.2 Confidence Scoring

Every field that requires model judgment must carry a companion confidence signal:

```ts
scope: 'global_preference' | 'project_specific' | 'sensitive' | 'uncertain'
scopeConfidence: 'high' | 'medium' | 'low'
```

Downstream rules:
- `confidence: 'low'` → mark entry for human review; do not auto-inject into context.
- `risk: 'uncertain'` → treat as `'high'`; uncertainty never grants leniency on security fields.
- `allowedTargets` missing → default to `['same_project_only']`; never default to permissive.

#### 8.3 Two-Layer Validation: Structure Then Semantics

JSON Schema / Zod guarantees structure only, not correctness. Always run two validation layers in sequence:

```
① Structural validation (Zod)
   Checks: field presence, type, enum membership
   Failure → discard item, log error

② Semantic post-validation (business logic)
   Checks:
   - if scope === 'sensitive' → blockedTargets must include 'cross_project'
   - if evidenceRefs is empty → confidence must be 'low'
   - if errorSignature is generic ('Error: undefined') → flag for human review
   Failure → downgrade entry, do not inject into context
```

Never rely on structure alone to approve a result for use.

#### 8.4 Safe Default for Security-Critical Fields

If a security boundary field (`allowedTargets`, `blockedTargets`, `destructiveHint`) is absent or uncertain, the system must apply the most restrictive default automatically — never the most permissive. It is better to over-block than to leak.

#### 8.5 Few-Shot Anchoring Over Rigid Schema Enforcement

Providing 2–3 concrete correct examples in the model's system prompt reduces hallucination more effectively than enforcing a maximally rigid schema. Use examples to show what "good" looks like. Use schema only to reject structurally invalid output.

## 9. Hook Pipeline

Every `ActionInvocation` passes through a two-stage Hook Pipeline before execution.
This is a deterministic infrastructure guarantee — not a prompt instruction.

### 9.1 PreInvoke Hook

Runs before any action executes. Checks in order:

1. **Permission level gate** — reject if caller permission level is below the action's declared
   `permissionLevel`.
2. **File lease check** — reject if any `ActionTargetRef` points to a file held by another active
   `WorkspaceFileLease`.
3. **Destructive action guard** — if `destructiveHint: true`, emit a `SupervisionRequest`
   SessionEvent and pause execution until the Captain resolves it. The Captain responds to the
   event; it does not poll for it.

On rejection the hook returns a structured `ActionBlockedEvent` (not a thrown exception) so the
Timeline records the blocked attempt as evidence.

### 9.2 PostInvoke Hook

Runs after the action executor returns a result, before the result is emitted to the SessionEvent
stream.

1. **Output normalization** — convert Unix timestamps to ISO 8601, coerce numeric status codes to
   canonical enum strings, strip fields not declared in the action's output contract.
2. **Confidence downgrade** — if a semantic judgment field carries `confidence: 'low'`, mark the
   result event `requiresReview: true` before emitting.
3. **Structured error passthrough** — wrap executor errors into `ActionErrorEvent` with
   `errorCategory` (`transient | validation | business | permission`) and `isRetryable` flag.

### 9.3 Rule Carrier Discipline

| Rule type | Carrier | Guarantee |
|---|---|---|
| Business safety (file write, cross-project read, L2/L3 action) | PreInvoke Hook (code) | Deterministic — 100% |
| Workflow preference (inspect-before-write, summary format) | Agent system prompt | Probabilistic — >90% |

Never move a business safety rule into a system prompt. Never move a workflow preference into the
hook pipeline.

## 10. Agent-Native Actions

Generic list/invoke tools. Do not create one tool per action.

## 11. Files To Inspect First

- `app/packages/shared/src/protocol/internal-action.ts`
- `app/packages/server-core/src/services/internal-action-*`
- `app/packages/session-tools-core/src/handlers`

## 12. Files Likely Touched

Registry service, executor, permission evaluator, first UI-backed action component.

## 13. Parallel Work Packages

Lead freezes contract; one worker can implement registry/executor; one worker can implement a sample surface only after action ids are fixed.

## 14. File Ownership

Protocol and action surface vocabulary are Lead-owned. Surface implementers own their own handlers.

## 15. Validation Ladder

Typecheck shared/server/session-tools, registry unit tests, real human+agent same-action smoke.

## 16. Done / Not Done

`usable`: same action id works for human and agent. `display-only`: button exists without agent-callable path.

## 17. Risks And Blocked Decisions

Risk: action schemas mutate without versioning. All behavior/schema changes require contract version discipline.

Risk: schema over-constraint causes model hallucination. Fields that require model judgment must be optional with `'uncertain'` fallback values, not hard-required enums. See §8.1–8.5.
