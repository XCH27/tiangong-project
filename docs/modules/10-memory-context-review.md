# 10 Memory Context Review

## 1. Mission

Unify local memory, context efficiency, ProjectPack, external AI review, and reports into one governed center.

## 2. User-Visible Loop

User packages a project or selected scope, sees files/tokens/secret risk, optionally submits to authorized review, and receives a report with evidence and cost/source labels.

## 3. Current App Reuse

Reuse memory protocol/service, usage ledger, BrowserPane, External Job, session timeline, settings, and existing file/conversion tools.

## 4. Reference Projects

RTK/codegraph are green-light optimization sources. Repomix/MarkItDown/Headroom/Zvec are candidates/sidecar references unless promoted.

## 5. UI Placement

Context/review belongs to a single center or panel, not separate buttons for every tool. Governance UI should be compact.

## 6. Backend / RPC / Locality

ProjectPack, file conversion, secret scan, memory retrieval, and local indexes are `LOCAL_ONLY`. External review requires explicit upload permission.

## 7. Session / Timeline / Permission / Rollback

Bundles record hash, file list, secret scan, target platform, prompt hash, raw output, report, and real/estimated/unknown cost.

## 8. Data Model

Memory partitions, ProjectPack, ReviewBundle, ReviewReport, usage sample, context segment, evidence ref, external platform record.

### Memory Distillation as Batch-Eligible Operation

At session end, distilling tool call history (Track A) into structured Fact entries (Track B) is a background, non-interactive operation. It is the canonical use case for `async-native` batch mode inside Fleet:

```
Session closes
  → Collect N SessionEvents from Track A (tool calls, diffs, exit codes)
  → Build batch JSONL: one item per event, each asks model to extract Fact
  → Submit as ExternalJob { type: 'memory-distill', batchMode: 'async-native' }
  → Result maps back to DistilledToolMemory entries by event ID
  → Write to memory.json partitions (project / agent / task)
```

Rules:
- Distillation must not block the user from starting a new session.
- Items must be chunked to stay within provider batch size limits.
- Failed individual items are skipped and logged; they do not abort the batch.
- Sensitive items (`scope: 'sensitive' | 'raw_path'`) must be flagged `blockedTargets: ['cross_project']` before insertion.

### DistilledToolMemory Schema (Applying §8.1–8.5 of Module 03)

```ts
interface DistilledToolMemory {
  // Identity fields — hard required, model cannot be wrong
  id: string
  sourceEventId: string
  tool: 'grep' | 'read' | 'write' | 'shell' | 'browser' | 'mcp' | string
  timestamp: string

  // Semantic judgment fields — optional + 'uncertain' escape
  scope?: 'global_preference' | 'transferable' | 'project_specific'
        | 'tool_pattern' | 'sensitive' | 'raw_path' | 'uncertain'
  scopeConfidence?: 'high' | 'medium' | 'low'
  outcome?: 'success' | 'failure' | 'retry-fixed' | 'blocked' | 'uncertain'
  risk?: 'low' | 'medium' | 'high' | 'uncertain'

  // Core content — required but free-form (model cannot hallucinate a wrong string here)
  content: string

  // Evidence — required for traceability, but empty array is valid
  evidenceRefs: Array<{ conversationNo: string; eventId?: string; fileHash?: string }>

  // Security boundary fields — optional, default to most restrictive if absent
  allowedTargets?: string[]   // default: ['same_project_only']
  blockedTargets?: string[]   // default: ['cross_project']

  // Optional semantic detail fields
  errorSignature?: string
  expectedUseCases?: string[]
  expiresAt?: string

  // Escape hatch — model says "I'm uncertain about X" rather than guessing
  notes?: string
}
```

**Semantic post-validation rules** (run after Zod structural check):
- `scope === 'sensitive'` → `blockedTargets` must include `'cross_project'`; if missing, auto-add it.
- `evidenceRefs.length === 0` → `scopeConfidence` must be `'low'`; if not, downgrade it.
- `errorSignature` matches generic patterns (e.g. `'Error: undefined'`, `'null'`) → flag for human review.
- `risk === 'uncertain'` → treat as `'high'` in all downstream access checks.


## 9. Agent-Native Actions

Inspect memory, retrieve governed context, build pack preview, submit review, save report, create follow-up task.

## 10. Files To Inspect First

- `app/packages/shared/src/protocol/memory.ts`
- `app/packages/shared/src/protocol/usage.ts`
- external review/job services
- memory transfer eval scripts

## 11. Files Likely Touched

Memory services, project pack services, review services, context UI, report UI.

## 12. Parallel Work Packages

Memory governance, ProjectPack, review UI, sidecar adapters, report normalizer can split after shared usage/report types freeze.

## 13. File Ownership

Memory/usage/review protocol changes are Lead-owned.

## 14. Validation Ladder

Memory leakage tests, project pack dry run, secret scan fixture, review report save smoke, UI source-label check.

## 15. Done / Not Done

`usable`: user can see pack risk and save a review/report with evidence. `display-only`: token/review dashboard with no real bundle.

## 16. Risks And Blocked Decisions

Risk: calling external AI websites as "free." Cost source must remain real/estimated/unknown.
