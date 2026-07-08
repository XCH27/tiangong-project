# Legacy Lessons & Architectural Guidelines

This document extracts the truly valuable engineering lessons, design choices, and integration insights from the legacy Chinese project documentation (`docs/legacy/`). These lessons are promoted here to serve as active guidelines for the current project rewrite on top of **Craft Agents**.

---

## 1. Action-Centric Core (Unifying UI and Agent Tools)

### The Principle
High-fidelity visual simulation (like mouse dragging or raw coordinate clicks) and unstructured DOM parsing are unstable fallbacks. Every interaction and capability in Fleet must be registered as a **structured, type-safe Action**.

### Guidelines
1. **Single Truth Action Registry**: UI buttons and Agent toolsets must invoke the *exact same* Action definition (with matching name, description, Zod input validation, and output schema). Never build duplicate invocation rails.
2. **MCP Safety Marks**: Action definitions must support the standard 4-factor metadata attributes:
   * `readOnlyHint?: boolean` (safe read-only operations)
   * `destructiveHint?: boolean` (deletion, overwriting files, clearing state)
   * `idempotentHint?: boolean` (safe to replay)
   * `openWorldHint?: boolean` (web requests, opening connections, webview rendering)
3. **Worst-Case Safety Fallback**: If an Action definition omits these flags, the registry runtime must automatically treat it as the most restrictive configuration: `destructiveHint: true, idempotentHint: false, openWorldHint: true`, prompting explicit human confirmation.
4. **Structured Action Results**: Actions must return a structured response envelope rather than raw nulls or values:
   ```typescript
   interface ActionResult<T> {
     ok: boolean;
     data?: T;
     error?: "timeout" | "upstream_failure" | "validation_failed" | "lock_conflict" | "security_violation";
     detail?: string;
   }
   ```

---

## 2. Built-in Browser Control (CDP & ax-tree Targeting)

### The Principle
Instead of treating the built-in browser as a black box or a raw web crawler, it should behave as the core canvas for artifact handoffs, design reviews, and local development previews.

### Guidelines
1. **Targeting via Accessibility Tree (`ax-tree`)**: Agents should locate and interact with elements using the semantic browser Accessibility Tree hierarchy. This is significantly more resilient than standard CSS query selectors (which break during CSS refactors) or absolute coordinates.
2. **Explicit User Controls**: The browser settings page must strictly expose:
   * Clear toggle to enable/disable agent browser control.
   * Open-target behavior (local workspace URLs open in-app vs system default browser).
   * One-click action to clear all browsing data (cookies, storage, history).
   * Screenshot capturing permissions (with clear choices to always/never include user-added overlay annotations).
   * Site-specific permission overrides (whitelist/blacklist rules).
   * A separate, high-risk developer toggle for full CDP (Chrome DevTools Protocol) automation access (e.g., listening to raw websocket streams or extracting source maps).

---

## 3. Async Actions & SQLite Hydration

### The Principle
Long-running asynchronous jobs (like local asset generation or remote deployments) should not block the main process or hold active connections open.

### Guidelines
1. **Placeholder Mode**: When an async Action is invoked, the backend immediately inserts a placeholder node into the client store (and local SQLite) with `status: "running"`, returning a unique `placeholderId` to the caller.
2. **SQLite Hydration on Restart**: If the main process crashes, restarts, or loses network connection while a long job is active:
   * Upon cold start, the client scans local SQLite for any unresolved `running` placeholders.
   * It initiates a status synchronization check (Hydration) with the active runner queue to restore, update, or gracefully fail the status, preventing frozen UI elements.

---

## 4. Compiler Loop Autocorrection

### The Principle
When running compiler, build, or test commands, raw terminal output is hard for agents to consume directly.

### Guidelines
1. **Structured Diagnostics Capture**: Intercept PTY terminal output, parse linter warnings or compiler error traces, compress the stack traces, and format them into structured JSON reports.
2. **Self-Healing Loop**: Feed the structured compiler/test errors back to the executor agent, enabling it to invoke localized file patch edits to resolve compile errors in a closed verification loop.

---

## 5. Conflict Prevention (Wave-Lead Management)

### The Principle
Avoid complex file conflict merges after parallel execution. Instead, manage conflicts before they happen.

### Guidelines
1. **File Lease Locking**: Before starting a wave execution, individual agents lock files in their active directory scope.
2. **Workspace Isolation**: Run separate agent sub-tasks in isolated worktrees (shadow directories) using structured workspace leases, allowing independent test/build cycles without workspace pollution.

---

## 6. Two-Axis Model Routing & Layered Caching

### The Principle
Rather than relying on human selection or naive defaults, Fleet optimizes runtime cost and latency via intelligent routing and cache layering.

### Guidelines
1. **Two-Axis Routing (Task Type × Complexity)**: 
   * **Task Types**: Segment intent into `chat-text`, `code-tools`, `review-analysis`, `design-canvas`, `animation`, `video-edit`, `prompt-opt`, `automation`, or `memory-op`.
   * **Complexity**: Assess task difficulty (scale 1 to 4) using lightweight heuristics (input size, presence of code, presence of specific tool tags, session depth).
2. **CLI Runtime Exclusion**: Bypass all model routing, caching, and Fusion mechanisms for local CLI/TUI executions (`cliRuntimeId != null`).
3. **Three-Layer Cache Stack**:
   * **L1 Cache (Provider Prefix Cache)**: Align and order prompts to maximize prefix matching (e.g. Anthropic prompt caching) for massive code trees.
   * **L2 Cache (Exact Match Cache)**: Hash the exact conversation context + current inputs. If matched, return the cached result instantly with zero API overhead.
   * **L3 Cache (Sub-Task/Panel Cache)**: Cache outcomes of individual panels/agents in multi-model pipelines, avoiding redundant re-runs when only a fraction of a complex workspace changes.

---

## 7. Divided Memory System & Dual-Track Tool Memory

### The Principle
Memory must be strictly partitioned to prevent context pollution, token bloat, and cross-project/privacy leaks.

### Guidelines
1. **Seven-Partition Memory**: Isolate memory structures into explicit namespaces:
   * *User Long-term*: Profiles, preferred tech stack, and goals.
   * *Software State*: Current projects, phases, settings, and loaded plugins.
   * *Project*: Goals, rules, Decisions Ledger (strictly scoped/isolated per `scopeId`).
   * *Agent*: Roles, conventions, and histories.
   * *Task*: Sub-tasks, current progress, and task checklist.
   * *Design Asset*: Palette, fonts, node constraints, and license tags.
   * *External Review*: Uploaded package hashes, target platforms, cost, and raw results (high sensitivity).
2. **Dual-Track Tool Memory**:
   * **Track A (Evidence Timeline)**: Store raw tool stdout/stderr, diff files, exit codes, and permissions under `SessionEvent` for debugging, verification, and rollbacks.
   * **Track B (Distilled Memory)**: Summarize key facts, failure signatures, recovery scripts, and conditions. Store these in local memory storage (`memory.json`/SQLite) for low-overhead prompt injection.

---

## 8. Unified Context and External Review Center

### The Principle
Formatting inputs, local code graph query, prompt caching, token usage indicators, and external reviews are steps in a single pipeline, managed by the Manager Agent.

### Guidelines
1. **Unified Pipeline**: Move tasks through: Input Formatting (Repomix/MarkItDown) -> Context shaping (Reasonix pre-ordering) -> Cache optimization (L1/L2) -> Verification (local linter/compiler auto-corrections) -> External Review Submission.
2. **Consent & Verification Gate**: Before submitting data to external platforms, display:
   * A clear summary of the file package and size.
   * An automated secrets scanner warning.
   * Estimated token usage/cost.
   * A list of target platforms.
3. **Normalized Reports**: Multi-platform review outputs must be compiled into a normalized `ReviewReport` containing structural keys: `findings`, `severity`, `file_refs`, `evidence`, and `recommended_fixes`.

---

## 9. Structured Output Schema Design (Anti-Hallucination)

### The Principle
Schema is not just a format constraint — it directly influences model behavior. Fields that are too rigid cause models to hallucinate compliant-looking values. JSON Schema validates structure, not semantic correctness. These two failure modes require separate countermeasures.

### Guidelines

1. **Classify Field Hardness Before Deciding Required vs Optional**:
   * *Identity fields* (id, timestamp, tool): hard required. Model cannot be wrong here.
   * *Semantic judgment fields* (scope, risk, outcome): optional. Always add `'uncertain'` to the enum so the model can be honest.
   * *Security boundary fields* (allowedTargets, blockedTargets): optional in schema, but the system auto-applies the most restrictive default if absent.
   * *Escape hatch fields* (`notes?: string`): always present. Lets the model express uncertainty rather than pick a wrong enum value.

2. **Add Confidence Scores to Judgment Fields**:
   * Pair every judgment field with a `confidence: 'high' | 'medium' | 'low'` signal.
   * Downstream logic: `confidence: 'low'` → mark for human review, do not auto-inject; `risk: 'uncertain'` → treat as `'high'`, never relax security.

3. **Run Two Validation Layers in Sequence**:
   * *Layer 1 — Structural (Zod/JSON Schema)*: field presence, types, enum membership. Failure → discard the item.
   * *Layer 2 — Semantic (business logic)*: check cross-field consistency (e.g. `scope === 'sensitive'` requires `blockedTargets` to include `'cross_project'`). Failure → downgrade, do not inject.

4. **Security Fields Default to Most Restrictive**:
   * If `allowedTargets` or `blockedTargets` is absent or `uncertain`, apply `['same_project_only']` / `['cross_project']` automatically. Never default to permissive.

5. **Few-Shot Anchoring Beats Rigid Schemas**:
   * 2–3 correct examples in the system prompt reduce hallucination more effectively than maximally rigid schemas. Use schema to reject bad output; use examples to show what good looks like.


