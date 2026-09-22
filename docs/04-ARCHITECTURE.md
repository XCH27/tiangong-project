# 04 — Target Architecture and Invariants

> The system as it must ultimately work: authorities, dependency structure, technical invariants,
> and the failure models the controller must prevent. **Sequencing and current status live in
> [`05-ROADMAP.md`](05-ROADMAP.md)** — this file is not a progress diary.

The large independent delivery systems and their cross-suite conflict gate are defined in
`modules/REGISTRY.md`. This file remains the invariant and failure authority;
the suite document does not create another architecture ledger.

## 1. The shape of the system

```text
┌─ Craft shell (retained) ─────────────────────────────────────────────┐
│  Sessions · Timeline · Permissions · Tasks/Scheduling · Settings     │
│  Sources/MCP · Skills · Automations · Scheduler · BrowserPane        │
│                                                                      │
│  ┌─ shared spine (one of each) ────────────────────────────────┐     │
│  │ session + permission + identity + caller-aware action        │     │
│  │ interface + timeline evidence + files/artifacts + cost       │     │
│  └──────────────────────────────────────────────────────────────┘     │
│  ┌─ model-facing effective projection ──────────────────────────┐     │
│  │ stable prompt prefix · scoped tool schemas · task context     │     │
│  │ (a view over the spine; never another authority or store)     │     │
│  └───────────────────────────────────────────────────────────────┘     │
│        ▲                ▲                 ▲                ▲          │
│   human UI adapters  Agent tool       workflow steps   canvas        │
│   (RPC commands)     adapters          (finite DAG,     (projection  │
│                      (PreToolUse)      later)           only)        │
│        │                │                 │                           │
│  ┌─ native surfaces (own their document/job model) ─────────────┐    │
│  │ files/Markdown · terminal/CLI runs · browser evidence ·      │    │
│  │ image/video/web/deck modules (later) · design surface (later)│    │
│  └───────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
   runtimes (replaceable adapters): Claude SDK · Pi SDK · other
   CLI/API runtimes · user-hosted remote Fleet instance (P7/P9)
```

Native authorities per surface, one shared spine underneath. Every runtime — built-in model
backend, CLI, API, local process, user-hosted server — is a replaceable adapter behind Fleet's
session, permission, usage, and evidence authorities. An adapter declares its real capabilities
(streaming, cancellation, tool calls, permission callbacks, resume, usage reporting); unsupported
features are explicit, never invented from a name.

The product kernel may be broad; a single model call must be narrow. Deterministic systems retain
policy, lifecycle, capability negotiation, stale-state checks and evidence. The model receives only
the minimum authorized projection needed for the current task. This is the harness "thin waist": it
reduces attention and schema tax without weakening the kernel or duplicating its authorities.

## 2. Dependency order (why the roadmap is ordered the way it is)

Development order is owned by [`05-ROADMAP.md`](05-ROADMAP.md), not this diagram. The owner
requires inherited Craft rectification and acceptance before adding capabilities:

```text
corrected and accepted Craft baseline (R0 with required R1/R2 corrections)
  → Component/panel foundation with real Files + Notes consumers
  → first production chain using existing authorities (R3)
  → action and artifact contracts extracted from that chain (R4/R5)
  → delegation, workflows and native domain loops at their roadmap anchors
```

The foundation follows the baseline exit in `specs/R0-baseline-audit.md` and precedes domain
Components. It adds a real Notes UI over the surviving RPC; it must not claim Notes is already
mounted. It needs no blanket R4–R9, public catalog or memory prerequisite. Later Action,
ArtifactRef and Job contracts are introduced only with their real producers and consumers.

Consequences:

- **Ahead-of-dependency work is allowed when the owner requests it**, but it records the exact
  unresolved edge and cannot be reported `usable` until it connects to verified upstream output.
- **Shared contracts are extracted, not pre-built.** The action seam, `ArtifactRef`,
  `TaskBrief`/`RunReport`, and workflow definitions are promoted from the first real producer and
  consumer that need them ([`specs/R4-action-seam.md`](specs/R4-action-seam.md), Decisions D6, G2).
  If a spec names a missing boundary without an exact schema, that omission is deliberate.

## 3. Technical invariants (retained failure lessons)

These constrain every implementation. They were learned from earlier implementations and reference
products; a short capability-map row cannot safely carry them.

### Runtime and delegation

- Detection, installation, authentication, protocol support, and successful health check are
  different facts. A detected CLI/runtime is never shown as executable until its adapter and health
  path are real.
- Runtime/model capabilities come from a handshake or explicit adapter declaration — never inferred
  from a name. Missing model selection, cancellation, attachments, tool approval, usage, or resume
  is shown as a limitation.
- A provider/runtime owns one process or remote run. Fleet owns Session, Task, permission, budget,
  artifact, evidence, and recovery state. One provider may request another member run only through
  Fleet's bounded delegation boundary.
- State becomes visible as completed only after the owning authority commits it. After an unclean
  shutdown, previously running work becomes suspended/reconciling until the adapter proves real
  state; Fleet never replays a chargeable or destructive request merely because the last response
  was lost.
- Process environment is part of runtime truth: desktop PATH, login-shell PATH, project-local
  tools, executable identity, and version may differ; the exact resolved executable/environment is
  used and diagnosable.
- Runtime SDK and execution profile are different facts. Fleet's Pi lane may reuse the same Pi
  project runtime while still carrying a heavier Fleet prompt/tool projection; profile benchmarks
  therefore compare the serialized request actually sent, not package names or source-file size.
- Prompt and tool projection is centralized across provider lanes. A backend may adapt schema shape
  to provider requirements, but it may not own a private capability/loadout authority. The effective
  catalog is computed before the call from task need, installed capability, runtime availability,
  caller policy and live grants.
- Tool discovery is catalog projection only. Search/describe never executes or grants; a real call
  re-enters the existing policy, approval, evidence and usage path. Static scoped profiles precede
  any Tool Search infrastructure and remain the fallback.
- Governance lives primarily in executable gates and structured outcomes, not repeated prose in
  every prompt. A prompt may state the minimum model-relevant precondition and error semantics; it
  does not duplicate the permission manual or internal orchestration state.
- Loadout projection and the governed Action seam are adjacent but independent. The former decides
  what a call can see; the latter governs a consequential request after it is made. Neither owns the
  other, and R4 still waits for two real callers.
- General external-computer control and a universal environment framework are outside Fleet
  (`PRODUCT.md`). The built-in BrowserPane and specific outside-tool jobs use the narrowest existing
  permissioned route. A real adapter binds its host/window identity, live grant and observation
  version; stale observations require a fresh read. A second adapter is not permission to reopen
  the excluded general product. The optional specified-local-app Component is the bounded R16
  exception owned by SYS-02; it extends this same permission/evidence path, not Core control.

### Human, Agent and Replay provenance

When a person and an Agent operate the same surface, the surface emits one semantic operation
envelope regardless of caller. The envelope records:

```text
actionId, callerKind(human|agent|automation|replay|system), callerId,
sessionId, workspaceId, componentId, sourceEvent/toolCall,
inputSchemaVersion, baseVersion, resultVersion, evidenceRefs,
permissionDecision, timestamp, outcome, recovery
```

The UI may show a compact attribution marker and operation history, but attribution is not inferred
from who happened to click last. Human and Agent actions use the same executor; the caller policy,
approval and evidence path differ. If a human edits while an Agent works from an older version, the
executor rejects the stale base and returns a structured conflict/replan result. Silent last-write-
wins is forbidden.

Record & Replay is a learning boundary, not a second executor. A recording is opt-in and local by
default; the user selects the workflow interval and confirms which values become inputs. The
extractor prefers semantic Action events, Component commands and existing Skills over raw mouse
coordinates or screenshots. The generated Skill is a versioned procedure with preconditions,
variables, verification, failure recovery and provenance links; it is not published or made global
without user review. Secrets, credentials, cookies, personal identifiers and financial data are
redacted or excluded. Replay re-enters the ordinary permission/evidence path and can stop when the
observed UI/artifact version differs from the recorded precondition.

Learning from a demonstration means **procedure extraction and measured refinement**, not silent
model retraining or automatic mutation of the product runtime. A successful replay may update a
Skill's quality evidence; it does not rewrite the Skill or widen its permissions by itself.

### Work trajectory and targeted revision

The visible work trajectory is a projection of the existing append-only Session/SessionEvent log,
governed Action results, native Job records and ArtifactRef lineage. It is not a fourth timeline and
Components do not write private histories. DeepSeek Harness is the source-level precedent: its
durable events have turn/step boundaries, tool-call parent/child edges, opaque producer sources and
queryable event/session lineage; its surface fold distinguishes `current`, `shadowed` and `log-only`
events, while the UI derives a tool-call tree and other nodes from those facts instead of making the
tree the authority. A Component may register a `ConversationNodeDefinition`-style projection with a
stable key and anchor event, but it may not rewrite the raw event window.

The minimum correlation envelope for a consequential operation is:

```text
traceId, sessionId, workspaceId, componentId?
turnId?, stepId?, operationId, attemptId, parentOperationId?
callerKind, actionType, inputSchemaVersion
inputArtifactRefs[{id, version}], outputArtifactRefs[{id, version}]
jobId?, canvasProjectionIds?, status, evidenceRefs, recovery
sourceEventSeqs[], derivedEventSeqs[]
```

This is a target seam; R4/R5 freeze only the fields proven by real dual callers and a real
producer/consumer. The invariants already bind: every input is an exact immutable version, every
output is a new version or an explicit failure, retries identify the attempt, and heavy bytes remain
with the native owner. Persist semantic operation start/result/end and recovery boundaries; high-
frequency token/progress updates use the live event bus and trajectory projection, with raw chunks
retained only under an explicit session/retention policy. An operation manifest may include the
Component/tool revision, model/provider, parameter or prompt hash, seed and environment fingerprint
needed to explain or replay the call. The canvas, workbench and chat may show different projections
of the same operation, but they resolve to the same `operationId`/ArtifactRef rather than copying
data.

Target selection is explicit. A user can select an operation, artifact version or canvas node and
then ask for a change; the UI sends that stable target token with the request. A phrase such as
“这张图” resolves only through the current selection/context when it is unique. If more than one exact
version matches, Fleet asks the user or shows selectable candidates; it never guesses from a name,
path or thumbnail alone.

Revising a prior step is branching, not mutation. The new action records `branchOf`/`retryOf` and its
base version, creates new Job/ArtifactRef results, leaves the old branch readable, and marks later
descendants `stale` or `awaiting-recompute` until the user or an explicit policy chooses to rerun
them. A visual “replace” is therefore a new lineage head, never an overwrite of the historical
poster, mask, vector text or background.

Replay has two explicit modes: **exact replay** reuses a previously committed ArtifactRef and its
evidence without invoking a model or external side effect; **re-execute** reconstructs the recorded
operation manifest and calls the current approved Component/runtime again. Non-deterministic or
chargeable re-execution requires confirmation, an expected-base-version check and a new attempt id.
An interruption may add a settlement/recovery event, but it never fabricates a successful output.

### Files and artifacts

- Exact artifact versions are immutable; an edit creates a new version/lineage. Resolving a
  reference re-evaluates caller scope and sensitivity — possession of an ID/path is not authority.
- A missing source produces a visible broken reference; it never cascade-deletes canvas nodes,
  workflows, history, or downstream evidence.
- Generated output is complete only when native bytes, required metadata/provenance, and attributed
  evidence agree. Safe order: bounded temporary output → validate → version/lease recheck → native
  commit → metadata/evidence commit → success.
- If bytes commit but metadata/evidence fails, the output is quarantined/reconciling; retry must
  detect the prior commit and must not duplicate bytes, billing, or provenance.
- A lease coordinates writers but never grants permission. Approval precedes the lease; execution
  rechecks the resource version after acquiring it; recovery refuses to overwrite newer state.

#### Import/export adapter contract

External formats are adapters, not additional artifact authorities. An import preserves the original
bytes and creates a derived native representation with an `ImportReceipt` containing source hash,
adapter/component revision, format version, extracted assets/fonts, unsupported features, transform
notes and fidelity class (`lossless`, `structured-limited`, `visual-reference`, `unsupported`).
Export produces a new ArtifactRef and a fidelity report; it never overwrites the source implicitly.

Figma `.fig`, Photoshop PSD/PSB, Illustrator AI and other proprietary formats therefore require a
tested adapter or an approved export/API/plugin path. SVG/PDF/PNG or a flattened preview is a valid
fallback only when reported as `visual-reference`, never as editable native support. Native document,
design, media and canvas Components own their derived model; Fleet Core owns the original reference,
provenance, permission and recovery envelope.

Reproducible restore is an immutable version/lineage operation: snapshot or inverse Action → validate
base version → apply through the native owner → commit evidence. A failure quarantines partial output
and leaves the prior head intact. Retry/restart reconciliation must detect an already committed output
before producing another file, charge or provenance event.

### Capabilities and workflows

- Installed, Workspace-enabled, effective-for-this-caller, and currently-running are separate
  states. Explicit deny and trust ceilings only remove authority; task loadout narrows, never
  broadens.
- A missing/incompatible capability stays visibly absent. Fleet never silently substitutes a
  similarly named operation. Effective capability provenance must explain which built-in, Skill,
  Source, connector, permission profile, and runtime contributed behavior.
- A workflow pins a finite immutable definition version per run; editing creates a new version.
- Structural schema validation precedes semantic, permission, budget/resource, and compatibility
  validation. Unknown price/capability is `unknown`, never zero/allowed.
- A workflow step invokes the same governed action/runtime/job owner as direct UI and Agent
  callers. Workflow state is correlation and dependency state — not another executor or queue.
- Cancellation is request/reconciliation when the provider cannot guarantee immediate stop. Partial
  immutable outputs remain visible. Startup reconciles non-final invocations before scheduling new
  work.

### Experience, context, and external review

- Owner/project/session scope, sensitivity, lifecycle, and explicit blocks are filtered **before**
  lexical or semantic similarity. `uncertain` takes the most restrictive route. Similarity never
  grants scope.
- Conflicting experience remains explicitly conflicting until superseded by a logged consolidation
  pass or human curation. Raw transcripts never become memory verbatim: agents write distilled
  entries with source pointers inside partition/sensitivity floors (D5). Memory writes never change
  policy, permission classes, or authority-bearing Skills by themselves.
- Deletion removes authoritative content and every derived search/vector/cache entry; until cleanup
  completes the item is reconciling and not retrievable. Audit tombstones contain no deleted
  content.
- External review sends one immutable, previewed scope with exclusions, destination, secret-scan
  result, and honest real/estimated/unknown cost. A review opinion does not automatically become a
  task, code change, policy, or retained experience.

### Explicitly not restored from history

A long-lived Core Daemon/control plane; a universal Action Registry or document patch model frozen
before real producers/consumers; old draft TeamRun/ArtifactRef/MemoryEntry/CapabilityManifest/
WorkflowDefinition fields; labels directly granting permission; Wave/Gate/packet machinery; any
historical `usable` claim — current tree and current closed-loop evidence alone determine status.

## 4. Execution integrity (the anti-drift system)

The system must prevent an agent from improving its own proxy task while losing the user's actual
outcome. Enforcement extends the existing Task, Session, SessionEvent, PreToolUse, TaskRunner, and
UsageTracker authorities — it is not a new task system. Decisions C7–C11 define the semantics; this
section defines the failure models. **Until the mechanized gates ship (roadmap R6), every agent
applies these rules procedurally — they bind today.**

### Single-agent failure model

| Failure | Observable behavior | Required response |
|---|---|---|
| Reality inversion | Debugging product code before checking the app exists/runs/has permission/connectivity | Run the cheapest relevant precondition checks and classify the failure first (C8) |
| Auxiliary evidence hijack | Screenshot/preview/browser evidence unavailable → agent starts rebuilding capture infrastructure | Record `EVIDENCE_UNAVAILABLE`; continue the primary path when that evidence is optional |
| Self-authored acceptance | Agent invents a test, changes the product to satisfy it, calls it complete | Lock acceptance before execution; the executor cannot issue the verdict (C9) |
| Contract drift | Question, non-goals, test, fixture, or harness changed after difficulty | Deny the write or emit a `ContractChangeRequest`; resume only under a new contract version (C7) |
| Proxy optimization | Tests/screenshots/reports improve while the requested outcome does not | Map each state-changing action and completion claim to a stable criterion and evidence |
| Technical overfitting | Repeated deep changes explore hypotheses without removing a user-facing blocker | Halt after two non-progressing state-changing attempts (C10) |
| Incidental-scope takeover | A discovered defect silently replaces the objective | Queue it with evidence; schedule separately unless it blocks a current criterion |
| Premature self-certification | The same context implements and weakens/interprets acceptance | Fixed deterministic checks, or an isolated read-only verifier when risk justifies one |
| Destructive assumption | Deleting a folder/document because its name suggests garbage | Inspect contents and history first; destructive permission boundary applies (03 §6) |

### Multi-agent failure model

| Failure | Required response |
|---|---|
| Duplicate/overlapping implementation | One accountable owner per criterion; leases or worktrees for occupied paths |
| Report/review theatre | A member must produce a requested artifact, decision, or blocking fact; review-only delegation needs an explicit risk trigger |
| Recursive agent conversation | Communication limited to artifact delivery, missing authority/information, declared dependency, or blocker |
| Repeated distrust/re-validation | Reuse canonical evidence references; repeat a check only for declared disagreement, staleness, or risk |
| Conflicting contract versions | Every run carries one contract version; stale reports and writes are rejected |
| Raw context flooding | Bounded `TaskBrief` in; bounded `RunReport` + references out; never copied transcripts |
| Provider semantic mismatch | Normalize capability/permission/lifecycle/cancellation/usage/failure through the runtime adapter |
| Retry storms, orphaned work, stale direction | Halt/cancel/failure propagate through the Task/Session tree; late results cannot land |
| Coordination cost exceeds work value | Account for the whole team; return the task class to Direct execution (C5/C6) |

### Locked task contract (target mechanism)

At the start of an attempt, the controller derives a read-only `TaskContract` from the existing
Task and Session:

```text
taskId + contractVersion + attemptId + dispatchGeneration
sessionId + parentCriterionId
primaryOutcome + acceptanceCriteria[stable id]
preconditions + allowedPaths + reservedPaths + nonGoals
requiredEvidence + optionalEvidence
token/tool/edit/retry/delegation budgets
contractChangeAuthority
```

`reservedPaths` normally include the request/spec, acceptance criteria, tests, fixtures, and
validation harness. Runtime gates (target: PreToolUse extensions): before a state-changing tool
call, require the current attempt/dispatch identity and a criterion ID, confirm the Session owns
the path lease, confirm the path is allowed and not reserved, and enforce remaining budgets.
Heartbeat proves only liveness; it never resets the criterion-progress breaker. Cancellation,
reassignment or contract revision invalidates the dispatch generation, so late tool results and
reports remain auditable but cannot mutate current state. SessionEvents record criterion, contract
version, attempt, dispatch generation, evidence and outcome. Verification returns
exactly one verdict: `PASS` / `IMPLEMENTATION_FAILURE` / `ENVIRONMENT_FAILURE` /
`EVIDENCE_UNAVAILABLE` / `CONTRACT_AMBIGUOUS`. Only `PASS` against the current contract version
completes the task.

### Decision-to-implementation gate

The same anti-drift rule applies before a product idea becomes a contract. A proposed Component,
surface, adapter or shared field may be documented for breadth, but it cannot enter the active
roadmap or be presented as a capability until the decision record identifies:

| Gate | Required proof |
|---|---|
| Intent and invariant | the owner outcome and the failure the rule prevents |
| Authority | the existing store/service/action path, or an explicit smallest new seam |
| Real loop | a production writer and consumer, with scope and stable identity |
| State truth | what is persisted, how it is versioned, and how resume/reload reconstructs it |
| Boundaries | denied, failed, offline, missing-dependency, uninstall and recovery behavior |
| Evidence | acceptance IDs and the cheapest sufficient verification path |
| Constraints | license, platform, resource and owner checkpoints |

Missing proof leaves the item `not implemented` (or packet `BREADTH_ONLY`/`PACKET_DRAFT`); it may
guide research but may not add a release dependency, a default-visible entry, or a second
authority. A type, isolated unit test, screenshot, source README or mock without a production caller
does not satisfy the real-loop gate. If the owner later changes the intent, the contract version
must change and stale writers/reports must be rejected rather than silently reinterpreted.

## 5. System-wide completion contract

A capability is complete only when all applicable parts form one real loop:

1. user or Agent entry → canonical behavior → authoritative state/persistence → caller-visible
   result;
2. caller-aware permission, cost, secret, and destructive-action boundaries;
3. attributable evidence, failure, cancellation, retry, and recovery truth;
4. real producer and consumer for every shared contract;
5. targeted non-visual verification plus owner acceptance for routine rendered/click behavior;
6. no parallel authority where Craft already owns the state class;
7. the contract version, acceptance criteria, and evaluator were not silently changed during the
   attempt; optional evidence failure did not expand implementation scope;
8. status uses only `usable` · `wired but not visually checked` · `display-only` · `not implemented`.

## 6. External evidence behind this design

- [OpenAI: How OpenAI uses Codex](https://cdn.openai.com/pdf/6a2631dc-783e-479b-b1a4-af0cfbd38630/how-openai-uses-codex.pdf) — well-scoped tasks, issue-like context, environment setup improve agent reliability.
- [Anthropic: Claude Code best practices](https://code.claude.com/docs/en/best-practices) — give agents a real verification method; explore/plan before uncertain implementation; use subagents selectively.
- [Anthropic: parallel agents](https://code.claude.com/docs/en/agents) — parallel sessions multiply token use; overlapping edits require isolation.
- [Google Research: scaling agent systems](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/) — large gains for parallelizable tasks, 39–70% degradation for strictly sequential ones: route by measurement, not fixed organization.
- [OpenAI Agents SDK orchestration](https://openai.github.io/openai-agents-python/multi_agent/) — deterministic flow belongs in code when speed, cost, and predictability matter.

## File mutation and artifact recovery details (R5 target)

The filesystem owns bytes; Library deliberately indexes selected assets; ArtifactRef resolves exact
native versions; leases coordinate writers after permission. Registration is not automatic copying
or indexing of every file. These are target requirements, not current Fleet history support.

Normalize paths against the real authorized root, account for symlinks and host case rules, and
recheck version/hash at commit. Parent/child path overlaps conflict. Acquire leases after approval;
a lease expiry requires owner/liveness reconciliation before reclaim. TTL, renewal interval and
snapshot-size limits are measured implementation settings, not inherited numeric promises.

Write to a controlled sibling and atomically replace where supported. Cross-volume movement needs
copy/verify/commit/delete recovery with an explicit partial state. Protect recovery snapshots like
the source; undo checks current result hash/version and refuses to overwrite intervening work.
Missing artifacts leave broken references rather than deleting consumers. Unknown license remains
unknown; source permission and sensitivity are rechecked when an ArtifactRef is resolved.

Validate generated output before committing it, then correlate native bytes, exact version and
evidence. If bytes commit but metadata/evidence fails, expose reconciliation and preserve the output;
retry must not duplicate a file or provider charge. Caches/previews remain rebuildable. A generic
Git reset/stash/checkout is never a file-undo implementation.
