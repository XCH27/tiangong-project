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

  // Escape hatch — model says “I’m uncertain about X” rather than guessing
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

Risk: calling external AI websites as “free.” Cost source must remain real/estimated/unknown.

## 17. Token & Context Optimisation Architecture

This section defines how Fleet reduces token consumption across the full request lifecycle.
It supersedes any informal notes on RTK, Repomix, Headroom, or Reasonix integration.

### 17.1 Five-Layer Model

Each layer owns exactly one concern. No layer may apply compression or reordering to
another layer’s output.

| Layer | Name | Core concern | Primary reference | Owner module |
|---|---|---|---|---|
| 0 | Memory | Avoid re-injecting history | Mem0 (dedup/conflict ideas), Letta (3-tier model) | M10 |
| 1 | Retrieval Assembly | Send only relevant context | codegraph (Green-Light MCP), Zvec (FTS5+vector interface), Tree-sitter AST outline (self-impl) | M10 |
| 2 | Prompt Assembly | Fix segment order for cache hit | DeepSeek-Reasonix (Green-Light stable-prefix) | **M11** |
| 3 | Transport / Cache | Request-level token caching | Headroom (interface reference, self-impl backend) | M11 |
| 4 | Execution Output | Prevent terminal/file output explosion | RTK (Green-Light, direct integration), Context-mode (ELv2 — fold criteria reference only) | M10 + UI |

### 17.2 Layer Rules (Hard)

1. **No stacked compression.** Once RTK (Layer 4) has semantically compressed a tool
   return value, no other layer may further truncate or rewrite that string before it
   reaches the model. Doing so produces model-visible garbled output.
2. **Prompt Assembly (Layer 2) is the sole assembler.** No module constructs the final
   Prompt string directly. Modules submit typed `ContextSegment` objects to M11’s
   assembler, which owns the join order. See M11 §18.
3. **RTK only touches unstructured streams.** RTK compression applies exclusively to
   terminal `stderr`/`stdout` log streams. It must never be applied to JSON payloads,
   AST structures, or any field that is subsequently parsed by code.
4. **Context-mode (ELv2) code is absolutely forbidden.** Big-output fold criteria may
   be studied and independently re-implemented in Fleet’s UI layer. No source code,
   type definitions, or configs from Context-mode may enter the repo.

### 17.3 Per-Tool Integration Decisions

#### RTK (Layer 4 — Execution Output)
- **Operation**: Direct integration, Green-Light.
- **Scope**: Opt-in, sandboxed. Intercepts terminal execution log streams only.
- **What it must not touch**: Any structured return value (JSON, diff hunks, AST).

#### codegraph + Zvec (Layer 1 — Retrieval Assembly)
- **Operation**: Independent MCP Server. Model calls `query_code_graph` and
  `query_vector_index` tool calls. Fleet never imports their internals.
- **Upgrade path**: MCP protocol means engine upgrades require no Fleet changes.

#### AST Structural Outline — replaces Repomix copy (Layer 1)
- **Policy note**: `Repomix` is a candidate reference. Its Policy entry explicitly
  forbids copying AST parsers, line counters, or ignore file readers.
  Extracting its Tree-sitter algorithm and “second-developing” it into a Fleet
  package is a **policy violation**.
- **Correct approach**: Implement a lightweight `@fleet/ast-outline` package using
  the official `tree-sitter` Node.js binding and grammar packages directly.
  No Repomix code enters the repo. Repomix is studied only as a behavior reference
  for which node types to surface.
- **Trigger rule in `read_file` handler**: if file line count > 500, default response
  degrades to AST skeleton only (top-level declarations, exported symbols). Full
  content available on explicit `read_file({ fullContent: true })`.

#### Headroom (Layer 3 — Transport / Cache)
- **Policy note**: Cannot copy compression layers, MCP proxy servers, or local drivers.
- **Correct approach**: Reference its reversible hash caching interface specification.
  Implement the cache backend inside Fleet’s existing Cost Ledger (M11). The hash
  key is the stable Prompt prefix hash produced by Layer 2.

#### Mem0 + Letta (Layer 0 — Memory)
- **Policy note**: Cannot copy backend storage wrappers or Qdrant/Milvus interfaces.
- **Correct approach**: Adopt the three-tier memory model concept (Core / Recall /
  Archival) at the interface level. Storage backend is Fleet-native SQLite + FTS5
  (leveraging Zvec’s indexing patterns). `DistilledToolMemory` schema in §8 is
  the concrete implementation of the “Recall” tier.

#### Context-mode (Layer 4 UI — Big Output Fold)
- **Policy note**: ELv2 — strictly no code copy, no binary bundling.
- **Correct approach**: Study fold criteria (minimum output length threshold,
  diff hunk detection, code block detection). Re-implement the fold logic in
  `app/packages/ui/src/components` from scratch. No Context-mode file enters
  the repo even as a reference file on disk.

#### DeepSeek-Reasonix (Layer 2 — Prompt Assembly)
- **Policy note**: Green-Light MIT. May reference stable prefix cache and
  planner/executor patterns directly.
- **Correct approach**: Implement stable-prefix Prompt ordering in M11’s
  Prompt Assembly layer (§18). This is **not** a TeamRun concern. TeamRun
  dispatches tasks; M11 assembles the Prompts sent to models.

### 17.4 Anti-Patterns (Forbidden)

| Anti-pattern | Why forbidden |
|---|---|
| Running RTK on a JSON tool result before passing to model | Corrupts structured data the model needs to parse |
| Inserting a memory snippet mid-Prompt after stable prefix is assembled | Breaks prefix cache, wastes ~50% cost saving |
| Repomix source copy for AST outline | Policy violation: AST parser copy is explicitly forbidden |
| Context-mode code in any form in the repo | ELv2 high-risk licence |
| TeamRun building the final Prompt string | Prompt Assembly is M11-owned; TeamRun only submits ContextSegments |
| Headroom MCP proxy or compression layer copy | Policy: only interface specification may be referenced |
