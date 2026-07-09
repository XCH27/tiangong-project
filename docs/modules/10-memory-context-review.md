# 10 Memory Context Review

## 1. Mission

Unify local memory, context efficiency, ProjectPack, external AI reviews, and reports under a single governed center.

**Core Design Philosophy: The goal of the memory system is not to "remember more", but to "remember more accurately, isolate better, and grow faster."**  
A good memory system should reduce pitfalls, increase output efficiency, and save tokens, rather than imposing a burden on engineering development.

---

## 2. User-Visible Loop

1. The user packages a project or selects a scope to view file, token, and secret risks.
2. The user optionally submits the pack for authorized review.
3. The user receives a report complete with evidence refs and cost labels.

---

## 3. Current App Reuse

Reuse memory protocol/service, usage ledger, BrowserPane, External Job, session timeline, settings, and existing file/conversion tools.

---

## 4. Reference Projects

RTK/codegraph are green-light optimization sources. Repomix/MarkItDown/Headroom/Zvec are candidates/sidecars unless promoted to formal dependencies.

---

## 5. UI Placement

Context/review belongs to a single center or panel, rather than having individual buttons for each tool. Governance UI should remain compact.

---

## 6. Backend / RPC / Locality

ProjectPack, file conversion, secret scanning, memory retrieval, and local indexing are `LOCAL_ONLY`. External reviews require explicit upload permissions.

---

## 7. Session / Timeline / Permission / Rollback

Bundle records hash, file list, secret scan, target platform, prompt hash, raw output, report, and real/estimated/unknown costs.

---

## 8. Data Model

Memory partitions, ProjectPack, ReviewBundle, ReviewReport, usage sample, context segment, evidence reference, and external platform records.

### 8.1 Memory Distillation as Batch-Eligible Operation

At session end, distilling tool invocation history (Track A) into structured Fact entries (Track B) is a background, non-interactive operation. This is a classic use case for Fleet's internal `async-native` batch mode:

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
- Entries must be batched to stay within the provider's batch size limits.
- A failed single entry should be skipped and logged without aborting the entire batch.
- Sensitive entries (`scope: 'sensitive' | 'raw_path'`) must be marked with `blockedTargets: ['cross_project']` before writing.

### 8.2 DistilledToolMemory Schema (aligned with Module 03 §8.1–8.5)

```ts
interface DistilledToolMemory {
  // Identity fields — hard requirement, model must not misfill
  id: string
  sourceEventId: string
  tool: 'grep' | 'read' | 'write' | 'shell' | 'browser' | 'mcp' | string
  timestamp: string

  // Semantic evaluation fields — optional + 'uncertain' escape hatch
  scope?: 'global_preference' | 'transferable' | 'project_specific'
        | 'tool_pattern' | 'sensitive' | 'raw_path' | 'uncertain'
  scopeConfidence?: 'high' | 'medium' | 'low'
  outcome?: 'success' | 'failure' | 'retry-fixed' | 'blocked' | 'uncertain'
  risk?: 'low' | 'medium' | 'high' | 'uncertain'

  // Core content — required but free format
  content: string

  // Evidence — retroactively required, empty array is legal
  evidenceRefs: Array<{ conversationNo: string; eventId?: string; fileHash?: string }>

  // Security boundary fields — optional, defaults to strictest values if omitted
  allowedTargets?: string[]   // Default: ['same_project_only']
  blockedTargets?: string[]   // Default: ['cross_project']

  // Optional semantic detail fields
  errorSignature?: string
  expectedUseCases?: string[]
  expiresAt?: string

  // Escape hatch — model says "I'm uncertain about X" instead of guessing
  notes?: string
}
```

**Semantic Post-Validation Rules** (running after Zod structure validation):
- If `scope === 'sensitive'`, `blockedTargets` must contain `'cross_project'`; added automatically if missing.
- If `evidenceRefs.length === 0`, `scopeConfidence` must be `'low'`; downgraded otherwise.
- If `errorSignature` matches common patterns (e.g. `'Error: undefined'`, `'null'`), flag for manual review.
- If `risk === 'uncertain'`, treat as `'high'` in all downstream access checks.

---

## 9. Agent-Native Actions

Check memory, retrieve governed context, build pack preview, submit review, save report, and create follow-up tasks.

---

## 10. Files To Inspect First

- `app/packages/shared/src/protocol/memory.ts`
- `app/packages/shared/src/protocol/usage.ts`
- External review/job services
- Memory transfer evaluation scripts

---

## 11. Files Likely Touched

Memory services, project pack services, review services, context UI, and report UI.

---

## 12. Parallel Work Packages

Memory governance, ProjectPack, review UI, sidecar adapters, and report normalizer can split after shared usage/report types freeze.

---

## 13. File Ownership

Memory/usage/review protocol changes are owned by the Lead.

---

## 14. Validation Ladder

Memory leak tests, project pack dry run, secret scan fixtures, review report persistence smoke test, and UI origin tag checking.

---

## 15. Done / Not Done

**`usable`**: User can see packet risks and save reviews/reports with evidence.

**`display-only`**: Token/review dashboard with no real bundle.

---

## 16. Risks And Blocked Decisions

**Risk**: Treating external AI website calls as "free". Cost sources must remain real/estimated/unknown.

---

## 17. Token & Context Optimisation Architecture

This section defines how Fleet reduces token consumption across the request lifecycle.  
It replaces all informal comments regarding RTK, Repomix, Headroom, or Reasonix integration.

### 17.1 Five-Layer Model

Each layer is responsible for exactly one concern. No layer may compress or reorder the output of another layer.

| Layer | Name | Core concern | Primary reference | Owner module |
|---|---|---|---|---|
| 0 | Memory | Avoid redundant history injection | Mem0 (dedup/conflict ideas), Letta (3-tier model) | M10 |
| 1 | Retrieval Assembly | Send only relevant context | codegraph (Green-Light MCP), Zvec (FTS5+vector interface), Tree-sitter AST outline (self-impl) | M10 |
| 2 | Prompt Assembly | Fixed snippet ordering to hit cache | DeepSeek-Reasonix (Green-Light stable-prefix) | **M11** |
| 3 | Transport / Cache | Request-level token caching | Headroom (interface reference, self-impl backend) | M11 |
| 4 | Execution Output | Prevent terminal/file output bloat | RTK (Green-Light, direct integration), Context-mode (ELv2 — fold criteria reference only) | M10 + UI |

### 17.2 Layer Rules (Hard)

1. **No stacked compression.** After RTK (Layer 4) semantically compresses tool return values, other layers must not further truncate or rewrite them before sending to the model.
2. **Prompt Assembly (Layer 2) is the sole assembler.** No module constructs final Prompt strings directly; modules submit typed `ContextSegment` objects to M11's assembler, which owns the ordering.
3. **RTK only processes unstructured streams.** RTK compression is only applicable to terminal `stderr`/`stdout` log streams and must not be used for JSON payloads, AST structures, or any field subsequently parsed by code.
4. **Context-mode (ELv2) code is strictly forbidden.** Output folding criteria can be researched and independently re-implemented in the Fleet UI layer, but no source code, type definitions, or configuration from Context-mode may enter the repository.

### 17.3 Per-Tool Integration Decisions

#### RTK (Layer 4 — Execution Output)
- **Action**: Direct integration, green-light.
- **Scope**: Opt-in, sandboxed. Only intercepts terminal execution log streams.
- **Must Not Touch**: Any structured return value (JSON, diff hunks, AST).

#### codegraph + Zvec (Layer 1 — Retrieval Assembly)
- **Action**: Independent MCP Server. Model calls `query_code_graph` and `query_vector_index` tools. Fleet does not introduce their internal implementations.
- **Upgrade Path**: The MCP protocol ensures engine upgrades do not require Fleet modifications.

#### AST Structural Outline — Replacing Repomix Copies (Layer 1)
- **Strategy**: `Repomix` is a candidate reference, and its policy rules explicitly prohibit copying AST parsers, line counters, or ignore-file readers. Extracting its Tree-sitter algorithm to develop a proprietary package for Fleet is a **policy violation**.
- **Correct Way**: Use the official `tree-sitter` Node.js bindings and grammar packages to implement a lightweight `@fleet/ast-outline` package. Repomix serves as a behavioral reference only.
- **`read_file` handler trigger rule**: When a file exceeds 500 lines, the default response downgrades to an AST outline (top-level declarations, exported symbols). The full content must be requested explicitly via `read_file({ fullContent: true })`.

#### Headroom (Layer 3 — Transport / Cache)
- **Strategy**: Do not copy compression layers, MCP proxy servers, or local drivers.
- **Correct Way**: Reference its reversible hash cache interface spec to implement a cache backend inside Fleet's existing Cost Ledger (M11). The hash key is a stable prompt prefix hash generated by Layer 2.

#### Mem0 + Letta (Layer 0 — Memory)
- **Strategy**: Do not copy backend storage wrappers or Qdrant/Milvus interfaces.
- **Correct Way**: Adopt a three-tier memory model (Core / Recall / Archival) at the interface layer. The storage backend is Fleet's native SQLite + FTS5 (utilizing Zvec's indexing patterns). The `DistilledToolMemory` schema in §8.2 is a concrete implementation of the "Recall" tier.

#### Context-mode (Layer 4 UI — Big Output Fold)
- **Strategy**: ELv2 — strictly prohibit code copying and binary packaging.
- **Correct Way**: Research folding standards (minimum output length thresholds, diff hunk detection, code block detection) and implement the folding logic from scratch in `app/packages/ui/src/components`.

#### DeepSeek-Reasonix (Layer 2 — Prompt Assembly)
- **Strategy**: Green-light MIT. Directly reference the stable prefix caching and planner/executor patterns.
- **Correct Way**: Implement stable prefix prompt ordering in the M11 Prompt Assembly layer (§18). **This is not TeamRun's concern**.

### 17.4 Anti-Patterns (Forbidden)

| Anti-pattern | Why forbidden |
|---|---|
| Running RTK on JSON tool results before passing to model | Destroys structured data that the model needs to parse |
| Inserting memory snippets in the middle of a stable prefix assembly | Breaks prefix cache, wasting ~50% cost savings |
| Copying Repomix source code for AST outlines | Policy violation: AST parser duplication is explicitly forbidden |
| Any Context-mode code entering the repository | ELv2 high-risk license |
| TeamRun building the final Prompt string | Prompt Assembly is owned by M11; TeamRun only submits ContextSegments |
| Copying Headroom MCP proxy or compression layer | Strategy: only reference interface specifications |

---

## 18. Memory Scope Isolation — Project Isolation and Recall Protection

> **Core Issue**: Recall contamination (cross-project memory contamination) is the most common engineering failure of agent memory systems. Its root cause is not "weak memory" but the lack of strict scope boundaries and gating logic.

### 18.1 Five-Tier Memory Partition

Each layer has an independent lifecycle, read/write permissions, and cross-project access policy:

| Layer | Name | Lifecycle | Cross-Project Sharing | Typical Content |
|---|---|---|---|---|
| L0 | **Session Memory** | Current session, destroyed on close | ❌ Forbidden | Current task temporary state, conversation context |
| L1 | **Project Memory** | Project duration | ❌ Forbidden | Project decisions, architectural patterns, pitfalls |
| L2 | **Tool Memory** | Persistent, grouped by Tool ID | ⚠️ Read-only, explicit ref | Tool experience, failure modes, param templates |
| L3 | **User Memory** | Persistent, user-level | ✅ Allowed | Personal preferences, language habits, styling |
| L4 | **Policy Memory** | Persistent, system-level | ✅ Read-only | Safety rules, license constraints, forbidden patterns |

**Write Rules**:
- L0 is managed automatically by the session runtime and does not go through distillation.
- L1 can only be written to by sessions within the same project; entries with `scope === 'project_specific'` during distillation write to L1.
- L2 is automatically populated by tool invocation distillation; entries with `scope === 'tool_pattern'` write to L2.
- L3 requires manual confirmation or is triggered by entries with high confidence and `scope === 'global_preference'`.
- L4 is written by system administrators or the Lead and is read-only for agents.

### 18.2 Retrieval Gate

**Retrieval must not rely solely on semantic similarity; it must pass through a scope gate before similarity calculation.**

```
Recall Request
  → Step 1: Identify current projectId + sessionId + agentRole
  → Step 2: Filter candidate pool by layer
      - L0: Current sessionId only
      - L1: Current projectId only
      - L2: Any project, but flag origin project
      - L3/L4: Global
  → Step 3: Compute semantic similarity within the filtered candidate pool
  → Step 4: Attach [Origin Project] tag to cross-project L2 entries and explicitly label them when injecting into context
  → Step 5: Return results complete with scope, origin, and confidence for each memory entry
```

**Forbidden Actions**:
- Performing similarity search on the global pool first, then filtering by scope (reversing the order leads to cross-project pollution).
- Injecting memory without labeling the source (the model cannot distinguish current project facts from external experience).

### 18.3 Conflict Detection and Override Rules

When a newly distilled entry conflicts with an existing entry:

```
New Entry vs Existing Entry
  → Same scope + Same projectId: New overrides old, old entry moved to archive (retained for 30 days)
  → Same scope + Different projectId: Coexist, differentiated by projectId during retrieval
  → Scope downgrade (high → low confidence): Retain both versions, mark conflict=true, do not auto-override
  → Repeating errorSignature: Aggregate into one, incrementCount++, do not write duplicate entries
```

### 18.4 Expiration and Cleanup Policies

| Trigger | Action |
|---|---|
| `expiresAt` reached | Move to archive automatically, do not delete immediately |
| `outcome === 'failure'` and not linked by `retry-fixed` within 30 days | Mark as stale, demote weight during retrieval |
| Project closed/archived | Move L1 entries to archive partition, do not share across projects |
| User explicit delete | Hard delete, write to audit log synchronously |
| `errorSignature` marked as false positive | Remove signature from L2, update matching blacklist |

**Archive Retention Period**: Default 90 days, adjustable in Settings.

---

## 19. Tool Memory Growth Flywheel — Tool Invocation Growth Flywheel

> **Design Philosophy**: Inspired by Adam Smith's division of labor theory—industrial progress stems from specialization. Effective division of labor is not just "distributing tasks", but **accumulating experience and creating new skills or tools** during execution, closing a positive feedback loop.
>
> The agent growth logic should be identical: every tool invocation is "work experience." The system should automatically extract reusable knowledge, deposit it into Tool Memory, and lower future trial-and-error costs while improving first-pass success rates.

### 19.1 Flywheel Structure

```
Tool Invocation
       ↓
  Execution + Outcome Observation
       ↓
  Session Closes → Distillation
       ↓
  Write to Tool Memory (L2)
       ↓
  Next Similar Invocation → Retrieval Gate hits L2
       ↓
  Inject Context (with origin tags)
       ↓
  Model completes task with fewer tokens & less trial-and-error
       ↓
  New success experiences distilled → L2 updated
       ↑
  ← ← ← ← ← ← ← Flywheel Closes ← ← ← ← ← ←
```

### 19.2 Tool Memory Structured Content

L2 Tool Memory entries do not just record "this tool call succeeded," but structure **reusable operational knowledge**:

```ts
interface ToolMemoryEntry extends DistilledToolMemory {
  scope: 'tool_pattern'  // Fixed as tool_pattern

  // Tool-specific fields
  toolId: string                        // e.g. 'shell', 'mcp:github', 'read_file'
  parameterPattern?: string             // Summary of successful parameter patterns
  preconditions?: string[]              // Conditions that must be met before calling this tool
  postconditions?: string[]             // Expected state after invocation
  antiPatterns?: string[]               // Known usage patterns that fail
  tokenCost?: { input: number; output: number }  // Historical average cost reference

  // Growth counters
  successCount: number
  failureCount: number
  lastUsed: string
}
```

### 19.3 Identity Tags × Tool Invocation × Memory Triangle

In Fleet, every agent seat carries identity tags (AgentRole / AgentSeat), which bind with Tool Memory:

| Identity Tag Dimension | Impact on Tool Memory |
|---|---|
| `agentRole: 'lead'` | Can write to L4 Policy Memory; L2 writes automatically receive high-confidence flags |
| `agentRole: 'worker'` | Read-only L4; L2 writes require Lead approval to promote to `scopeConfidence: 'high'` |
| `toolAffinity: ['shell', 'grep']` | Retrieval prioritizes L2 entries matching the agent's tool affinity |
| `projectId` | Governs L1 write placement; L1 is strictly isolated during retrieval |

**Key Rule**: Tool Memory growth is a **byproduct of role specialization**. The Lead accumulates architectural decisions and boundary judgments; Workers accumulate specific tool usage experience. Both form the system's knowledge assets, but access is strictly stratified.

### 19.4 Skill Emergence Mechanism

When the `successCount` of a certain `toolId` in L2 reaches a threshold, and the `parameterPattern` has a high repetition rate, the system can propose to **promote it to an M12 Capability**:

```
L2 Tool Memory Entry
  successCount >= 10
  AND parameterPattern repetition rate >= 70%
  AND from >= 2 different projectIds
       ↓
  Generate SkillProposal { toolId, parameterPattern, suggestedCapabilityName }
       ↓
  Submit for human audit (Lead confirmation)
       ↓
  Write to M12 Capability Registry as a new composable skill
       ↓
  Subsequent invocations reuse directly from Capability layer, bypassing distillation
```

This is the system's path to **automatically creating new skills from experience**, matching the logic of "workers inventing tools through repetitive operation" from the division of labor.

### 19.5 Flywheel Token Saving Effect

Quantifiable benefits of a mature flywheel:

| Phase | Mechanism | Savings Source |
|---|---|---|
| Early | No Tool Memory | Trial-and-error required, highest token consumption |
| Growth | L2 hits, parameter template injected | Reduced retries, saving 20–40% |
| Mature | M12 Capability reuse | Reuses verified invocation sequences, saving 50–70% |
| Stable | Cross-project L2 tool sharing | Dramatically lowers cold-start costs for new projects |

---

## 20. Memory Quality Gates

> The quality of memory written is far more important than quantity. Noisy memory degrades the system's signal-to-noise ratio, leading to worse decisions than having no memory at all.

### 20.1 Pre-Write Gates

All distilled entries must pass the following gates before writing to any partition:

1. **Zod Schema Validation**: Field types and required items.
2. **Semantic Post-Validation** (§8.2 rules): Alignment of scope/risk/evidenceRefs.
3. **Deduplication Check**: Content similarity > 85% with an existing entry in the same scope is treated as duplicate. The write is skipped, and the existing entry's `successCount` is incremented.
4. **Sensitive Information Scan**: Integrated with the M10 secret scanning pipeline; high-risk content automatically forces `scope: 'sensitive'`.
5. **Origin Credibility Assessment**: Distilled entries from `outcome: 'failure'` start with `scopeConfidence` forced to `'low'`.

### 20.2 Read-Time Filters

Retrieved memory is filtered before return:
- Entries that are past `expiresAt` (demoted in weight and moved to backup candidate).
- `scopeConfidence: 'low'` entries are discarded first if the token budget is tight.
- Entries marked with `conflict: true` receive warning tags and are not injected as absolute facts.

### 20.3 Manual Review Queue

The following cases trigger manual review proposals (asynchronous, non-blocking):
- `errorSignature` matching common patterns.
- `risk: 'high'` + `scopeConfidence: 'low'` occurring simultaneously.
- SkillProposal generation (§19.4).
- High-frequency references to cross-project L2 entries (candidates for L3/L4 promotion).

---

## 21. Implementation Checklist

- [ ] `memory.ts` protocol freeze: Five-tier partition type definitions
- [ ] Retrieval gating: Scope filtering precedes similarity calculation
- [ ] Distilled batch job: Triggered on session close, asynchronous and non-blocking
- [ ] DistilledToolMemory Zod schema + semantic post-validation
- [ ] ToolMemoryEntry schema + successCount/failureCount tracking
- [ ] SkillProposal generation logic + M12 integration
- [ ] Archive partition + 90-day retention cleanup cron
- [ ] Conflict detection and override rules implementation
- [ ] All Pre-Write Gates implemented
- [ ] Manual review queue UI (compact view in M13 Settings Shell)
- [ ] Memory leak tests: Negative test cases for cross-project recall
- [ ] Tool Memory cost tracking (integration with M11 Cost Ledger)
