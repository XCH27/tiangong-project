# Design Review — recovered M00–M19 material

> Current review after the 2026-07-11 document reset. This file records actionable conflicts between
> recovered designs, current Craft code, and the numbered execution documents. It is not a roadmap.

## Overall conclusion

The library's problem is not insufficient detail. It carries an older architecture that assumed new
Fleet platform layers and frozen future contracts before the current Craft application had been fully
inspected. Use it as design history only.

Do not deepen deferred designs before Milestones 1–3 produce real implementation evidence.

## P0 — resolve before implementation

### 1. Establish an auditable baseline

The working tree currently combines v0.11.1 alignment, speculative Fleet protocol removal, document
replacement, and untracked replacement/archive files. Separate and verify that baseline before M1.
No recovered design is validated against the current tree until this is done.

### 2. Replace the old Milestone-1 model

The old M1 assumed Human UI and Agent callers could share a handler, both pass through PreToolUse, and
naturally emit identical tool events. PreToolUse is an Agent SDK lifecycle hook; a UI RPC does not
enter it automatically.

Current M1 instead uses:

```text
Human UI / Agent
        ↓
caller-aware canonical invocation
        ↓
shared policy evaluator + one executor/state authority
        ↓
attributed evidence outcome
```

PreToolUse is the Agent adapter. Human UI represents explicit user intent and may receive a different
policy decision.

### 3. Use `set_session_labels`, not `files_rename`

Labels already have an Agent tool, human UI, semantic resolver, persistence, and SessionManager state
authority. File rename would prematurely introduce path containment, collision, concurrent writes,
future leases, and unsafe "rename back" semantics. See the current M1 spec.

### 4. M00/M03 extend Craft; they do not build a new spine

Craft already owns sessions, permission modes, Agent gating, SessionEvents, session tools, settings,
projects/tasks, sources, and credentials. The current gap is cross-caller invocation, policy
attribution, and evidence—not a replacement platform.

## Cross-cutting corrections

### Permission model

Historical `L0–L3` language is descriptive only. Current implementation dimensions are independent:

```text
caller: human_ui | agent | later workflow
risk: read | mutate | external_side_effect | irreversible
policy: allow | ask | deny | owner_checkpoint
recovery: inverse | conditional_restore | snapshot_restore | none
tool safe-mode: allow | block
```

Craft's stored permission modes remain `safe / ask / allow-all`. Do not introduce an `L0–L3` enum or
second permission engine.

### Naming

Session tool names use snake_case and Agent routing uses `mcp__session__<tool_name>`. Dotted IDs in
recovered designs are not current tool names. If a later workflow/audit action ID needs a different
stable namespace, define and version an explicit mapping then.

### Deferred dependencies

M12 capability manifests, M16 view host, M17 workflows, and deleted planning-era contracts are future
integration points. Near-term work must not block on them.

### ArtifactRef timing

Do not freeze the former complete ArtifactRef draft in M1. M2 may expose a candidate for real runtime
output. Before M3's first cross-surface handoff, version the smallest envelope validated by a producer
and consumer. Native owners retain content authority.

### Cancellation truth

Cancellation does not prove the side effect stopped. Future designs distinguish:

- invocation: requested / running / cancel_requested / settled;
- executor: unknown / running / stopped / may_have_completed;
- artifact: not_created / partial / committed / unknown;
- evidence: complete / partial / missing / reconciling.

Implement only the states needed by the current real executor.

### Approval and leases

File mutations use:

```text
intent → policy decision → short execution lease → revalidate → mutate → evidence
```

Never hold a lease while awaiting approval. Approval is tied to a resource/version summary and does
not bypass execution-time revalidation.

## Near-term recovered designs

| Design | Current disposition |
|---|---|
| M00 Platform Spine | Adopt Craft authorities; add only the missing caller-aware seam. Defer Manager Agent/Fleet Bridge identity work. |
| M03 Action Registry | Keep validation/idempotency/error ideas; reject a parallel registry and old UI-through-PreToolUse model. |
| M02 Terminal/CLI | Start with existing non-interactive shell. Specify command policy, output redaction/retention, and stop/error truth. `node-pty` is conditional and owner-approved. |
| M05 Files/Library/ArtifactRef/leases | Split Library later. Validate lease/snapshot numbers in runtime. Use conditional recovery and execution-time preconditions. |
| M04 Runtime Lanes/TeamRun | Move after the first single-Agent complete work chain. Freeze TaskBrief/RunReport only when a real delegation is implemented. |

## Deferred designs

For M06–M19, retain only:

- product purpose and non-goals;
- known existing Craft authority to reuse;
- expected real prerequisites;
- stale vocabulary/dependency warnings.

Do not refine internal state machines, provider APIs, document formats, or UI routes until the area is
the next milestone. In particular, canvas/view/workflow designs must later settle their shared boundary
from current code rather than revive the old M07/M16/M17 contract set.

## How a future branch uses this review

1. Inspect current code and the Craft capability map.
2. Read the relevant recovered design and this review.
3. Write a short delta—not a copied specification—listing adopted/rejected assumptions and exact path
   scope.
4. Implement one coherent real loop through existing authorities.
5. Version only the shared contract required by a real second consumer.
6. Verify targeted behavior and the real application surface.

The code and observed behavior are the final authority.
