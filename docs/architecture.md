# Architecture — target shape, invariants and code map

> The system as it must ultimately work: authorities, dependency structure, technical invariants,
> and the failure models the controller must prevent. **Sequencing and current status live in
> [`TODO.md`](../TODO.md#release-ladder)** — this file is not a progress diary.

This file holds only what crosses modules: authorities, invariants, failure models and the code
map. Each module's own boundary, orchestration detail and execution rows live in its document under
[`modules/`](modules/); a module never opens a second architecture ledger.

**OV-027 selects ZCode; OV-084 selects Pi Agent Core beneath its existing Host owners.
OV-067 requires kernel implementation and acceptance before feature-page expansion. Pi durable/Chord remains mechanism
reference, not a replacement on the active path.** The Craft-specific map below describes the
retained branch. Preserve single ownership of Session, permissions and domain operations;
see the [source comparison](references.md#zcode-baseline-and-pi-integration).

OV-026 permits application-level plugins to own domain editors, workers and document/issue data.
Single authority means one owner per logical entity, not a ban on domain storage. A Board issue,
design document and Agent Session are different entities linked by stable references; plugins do
not introduce another Session/permission system. See the [plugin contract](modules/components.md#agent-authored-native-plugins).
Native editor undo and unsaved document state remain with that editor; host attribution does not
replace them. Project documents may be referenced by several conversations without being copied
into each Session. The selected-host proof must exercise live edits, stale writes and recovery,
not just two callers writing the same disk path. Portable MCP/UI transport is a comparison option,
not an additional required framework or a substitute for host permissions and plugin lifecycle.

## 1. The shape of the system

```text
┌─ Fleet Host (target evolved from the existing ZCode owners) ────────┐
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
   selected default: Host admission → Pi Agent Core → Host model/tool ports
   optional complete executors: native CLI/ACP/app-server, capability-gated
   user-hosted remote Fleet instance (P7/P9)
```

Native authorities per surface, one shared spine underneath. The Fleet Host owns the logical
Session, admission and Fleet permission/Action path; domain editors retain their native state.
Extend existing services and plugin lifecycle; Chord supplies reference mechanisms only. A model transport is below the
default Agent loop; a complete native executor is a separately admitted Session lane and never
runs beneath that loop. Each adapter declares its real capabilities
(streaming, cancellation, tool calls, permission callbacks, resume, usage reporting); unsupported
features are explicit, never invented from a name.

### Executor choice and feature development

Fleet owns the product contract; the selected connection/model route determines the executor.
Keep this in the existing connection flow, not a separate global kernel picker.
One native continuation store is legitimate private executor state, not a second user-visible
conversation authority. No migration should force editor undo/history into an Agent transcript.
Host fitness is judged against the existing [native workbench loops](product.md#2-what-fleet-changes-about-agent-work),
including shared human/Agent editing, save/reopen and scoped plugin lifecycle. Coding scores and
isolated conversation/SQLite tests establish only part of that evidence.

| Future feature | Shared Fleet responsibility | Effect of a selectable native executor |
|---|---|---|
| Models, accounts and subscriptions | Discovery, connection identity and an immutable per-input route; actual served identity on usage | Use that executor's supported login/catalog and resume scope. API compatibility does not imply subscription or media entitlement. |
| Composer, thinking, Fast, queue and steering | Original controls display observed capability and next-input selection; active input remains bound | Native effort/Fast/cancel/steer semantics differ. Hide unsupported actions; never claim pending configuration is active. |
| Token ring and costs | One ledger keyed by request/attempt/engine/account/project; known usage and unknown coverage remain distinct | Native context/source breakdown may be unavailable. Preserve reported cost/tier and opaque cache state; do not infer omitted values. |
| Right-click Agent assistance | Resource identity/version and the same approved domain operation used by human controls | Expose the operation through a scoped native tool/MCP bridge. An external engine must not mutate UI/store state through a separate settings owner. |
| Images, video and document suites | Host-owned Job/receipt/artifact references; native editors keep their data and undo | Native-generated artifacts and API Jobs both report through the same operation contract. Unknown external outcomes block replay; changing chat engine need not cancel an independent admitted Job. |
| Plugins, Skills and MCP | One package/loadout owner, UI contract, scoped grants and unload lifecycle | Skills/MCP can be projected where supported. Pi executable extensions, vendor hooks and native UI are not universally portable; adapters disclose unsupported contributions. |
| Cross-engine continuation | A visible transition plus bounded context/attachments and a durable receipt; parked native binding per identity/scope | Native resume only within a compatible binding. Crossing a boundary changes fork/rewind/cache behavior and must preserve access to the original transcript. |
| Workflow, schedules and multi-agent | Pin the executor and route per task/child, then aggregate receipts and usage | No automatic engine race or fallback after an accepted effect. Unattended capability must be proven for the selected adapter. |
| Remote and restart | Host task ownership, accepted command sequence, runtime target, cancellation acknowledgement and recovery | Require the adapter on the target machine. EOF/cancel sent is not confirmed completion; old-generation events cannot settle a new run. |
| Releases and migration | Same task fixtures, data-copy/replay comparison and rollback | Test each supported CLI/protocol version. Keep original ZCode workflows until equivalent behavior is proved; engine updates do not automatically migrate Fleet data. |

The product kernel may be broad; a single model call must be narrow. Deterministic systems retain
policy, lifecycle, capability negotiation, stale-state checks and evidence. The model receives only
the useful authorized projection needed for the current task; omission must preserve required evidence. This is the harness "thin waist": it
reduces attention and schema tax without weakening the kernel or duplicating its authorities.

## 2. Dependency order (why the roadmap is ordered the way it is)

### Feasibility boundaries

These qualify implementation promises; they do not remove the corresponding product goal.

| Broad claim to avoid | Executable alternative |
|---|---|
| All plugin formats run unchanged | Import compatible Skill/MCP/data contributions; verify executable hooks, UI and native dependencies per adapter. Unsupported parts remain explicit. |
| Every document format round-trips losslessly | Declare tested features/fidelity per native adapter; preserve the source and use a named conversion or supported native-app route where needed. |
| A login or model name enables every media/subscription capability | Verify account entitlement, modality, protocol and executor separately on the actual route. |
| A retry can always avoid a second charge | Use provider idempotency/receipt lookup when available; unknown accepted effects stop for reconciliation. Local transactions cannot force remote exactly-once behavior. |
| Every prompt source has exact token/cost attribution | Keep provider counters exact at their supplied scope; label source breakdown estimates and missing coverage. Do not turn correlation into a per-tool bill. |
| One Mac build proves three-platform support | Verify each native runtime/worker/format path and package on the declared target platform. |
| An Agent can operate a page because it can describe its screenshot | Bind the target and shared domain operation, then verify committed state and page refresh; GUI fallback is not native operation parity. |

Development order is owned by [`TODO.md`](../TODO.md#current-work--zcode-baseline-and-model-boundary-ov-027).
OV-067 makes kernel engineering the first integration stage. Dependency order is:

```text
kernel ownership/admission/permissions/recovery + native executor → page operations and media
  → Project/cost views → local app-plugin host + native document suite
  → canvas/media/workflow composition → broader adapters and distribution
```

Audit, reference comparison and documentation happen within each delivery. The first shared
operation extends existing Provider writers; the first document package extends the selected
installer and native editor. Extract Action/Job interfaces from those real producers/consumers,
not a universal framework built before them. The retained Craft map is preservation evidence.

Consequences:

- **Ahead-of-dependency work is allowed when the owner requests it**, but it records the exact
  unresolved edge and cannot be reported `usable` until it connects to verified upstream output.
- **Shared contracts are extracted, not pre-built.** The action seam, `ArtifactRef`,
  `TaskBrief`/`RunReport`, and workflow definitions are promoted from the first real producer and
  consumer that need them ([`modules/agent-core.md`](modules/agent-core.md#release-contract--r4-action-seam), Decisions D6, G2).
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
  (`product.md`). The built-in BrowserPane and specific outside-tool jobs use the narrowest existing
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
- If bytes commit but metadata/evidence fails, expose reconciliation and reuse the native receipt.
  Remote effects without idempotency/queryable receipts remain unknown and are not blindly retried.
  One database transaction cannot atomically commit a remote provider and every native file store.
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
outcome. Enforcement extends the selected Host's Session, admission, tool permission, workflow
journal and usage owners — it is not a new task system. Craft TaskRunner remains a retained
comparison, not another candidate authority. Decisions C7–C11 define the semantics; this
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
6. no competing logical authority where the selected host or native domain already owns the state;
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

## Core authorities

[Product](product.md) owns meaning, [Decisions](decisions.md) owns durable choices,
[Capabilities](capabilities.md) owns delivery status and [TODO](../TODO.md) owns active order.
Module contracts consume these authorities; research and code maps do not create another queue.

## Code map

> Where the real code is. Use this to find the entry point, then **confirm with `rg` before
> editing** — the tree changes and these paths are orientation, not a contract. Implementation paths are relative to `app/` unless already prefixed with `app/`;
> `docs/`, `scripts/` and reference paths are relative to the repository root.
>
> **Current implementation checked 2026-09-21 after the v0.13.4 reset.** Current entry points
> below are separated from removed Fleet modules. Historical implementation remains at
> `snapshot/pre-rebuild-2026-09-21`; a path in that snapshot is not a current capability.

### Baseline facts

- **App root:** `app/` — a Bun monorepo; `app/package.json` is `0.13.4`.
- **Implementation reality:** the committed reset restored Craft **v0.13.4**. Compare current
  bytes with the rolling reference and declare every later delta; prior Fleet extensions are not
  implicitly restored.
- **Look pin:** `源码参考/software/craft-agents-oss-v0.10.5/` at tag `v0.10.5` — tokens and
  interaction style, not a product shell to restore.
- **Rolling reference:** `源码参考/software/craft-agents-oss/` at tag `v0.13.4`, under
  `/Volumes/AIGC/天工参考/源码参考/`. Later intake remains bounded source comparison.

### Remote connection

| Concern | Current entry / fact |
|---|---|
| Embedded listener configuration | `apps/electron/src/main/index.ts` reads server config and invokes the shared bootstrap |
| Server bootstrap and token authentication | `packages/server-core/src/bootstrap/headless-start.ts`; `transport/server.ts` — inherited shared-token validation |
| Workspace discovery/status | `packages/server-core/src/handlers/rpc/server.ts` |
| Remote Workspace configuration | `packages/shared/src/config/storage.ts`; `apps/electron/src/main/handlers/workspace.ts` |
| Client routing | `apps/electron/src/transport/routed-client.ts`; `packages/shared/src/protocol/routing.ts` |
| Server settings | `apps/electron/src/renderer/pages/settings/ServerSettingsPage.tsx` — inherited token/port/TLS setup |

Fleet device grants, one-time invites, grant revocation, endpoint racing/reachability, host grouping
and the composer run-target selector are `not implemented`. The prior `shared/src/remote/`,
`main/server-mode.ts`, `main/handlers/remote-devices.ts` and `packages/remote-ssh/` are absent.
P7 security requirements still apply; inherited token auth is not proof of per-device scoping.

### Reference roots (do not mix their authority)

> **External Reference Root:** `/Volumes/AIGC/天工参考/` contains all complete source repositories (`源码参考/`) and reverse-engineered UI design kits (`UI参考/`). Local workspace directories are symlinks to this external drive.

| Reference | Location | Use |
|---|---|---|
| Fleet product authority | `docs/` numbered set + `modules/` | Decisions, boundaries, route, code entries |
| Look pin | `源码参考/software/craft-agents-oss-v0.10.5/` | Tokens, type, motion — not a shell to restore |
| Rolling Craft base | `源码参考/software/craft-agents-oss/` @ `v0.13.4` | Current `app/` donor |
| Selective-update implementation | `源码参考/software/craft-agents-oss/` (`/Volumes/AIGC/天工参考/源码参考/software/craft-agents-oss/`) | Exact Craft v0.13.4 behavior; admit only bounded fixes/backend mechanisms, never its product model wholesale |
| Current official hosted docs mirror | `源码参考/craft-docs/online-current/` | Later/current upstream behavior clues; may not match v0.13.4 |
| Mirror index and provenance | `源码参考/craft-docs/README.md`, `SYNC-MANIFEST.txt` | Locate source docs, verify downloaded bytes, known Craft-operated service list |
| Owner design notes | `docs/design-library/` | Owner intent; open the relevant note after checking code |
| UI component kits & reverse engineering | local `UI参考/` (`/Volumes/AIGC/天工参考/UI参考/`) | UI kits (Doubao, Trae Work, UI designs, screenshots) for human & design study |

Refresh the hosted mirror with `scripts/sync-craft-official-docs.sh`, then review its diff. A mirror
refresh is upstream intake, not permission to change application behavior.

### Monorepo layout

| Area | Location |
|---|---|
| Desktop app (Electron) | `app/apps/electron/` |
| Renderer UI | `app/apps/electron/src/renderer/` |
| Electron main handlers | `app/apps/electron/src/main/` |
| Core server | `app/packages/server-core/src/` |
| Shared domain code | `app/packages/shared/src/` |
| Shared UI package | `app/packages/ui/src/` |
| CLI app | `app/apps/cli/` |
| Web UI | `app/apps/webui/` |

### File size: a navigability constraint, not a style preference

Measured on the current v0.13.4 tree (2026-09-21):

| File | Lines |
|---|---|
| `packages/server-core/src/sessions/SessionManager.ts` | 9,146 |
| `apps/electron/src/renderer/components/app-shell/AppShell.tsx` | 3,932 |
| `apps/electron/src/main/browser-pane-manager.ts` | 3,613 |
| `packages/ui/src/components/chat/TurnCard.tsx` | 3,284 |
| `packages/shared/src/agent/claude-agent.ts` | 3,175 |
| `apps/electron/src/renderer/components/app-shell/input/FreeFormInput.tsx` | 2,466 |
| `apps/electron/src/renderer/components/app-shell/ChatDisplay.tsx` | 2,384 |
| `apps/electron/src/renderer/App.tsx` | 2,269 |

These are inherited baseline measurements, not a new cleanup backlog. Read the affected concern
and its upstream counterpart before editing; older complexity and line-growth figures describe
previous trees and do not establish a current violation.

**Binding rule, renderer only:** a change that adds net lines to a renderer file already above 1,500
must either (a) extract the affected concern into a new module in the same slice, or (b) name in the
Goal why extraction is unsafe. Applies to `apps/electron/src/renderer/`. Backend files above are a
recorded condition, not an open work item; touch them only when a slice already requires it.

### Spine primitives that already exist

| Concern | Real code | Note |
|---|---|---|
| Session-scoped Agent tool registry | `packages/session-tools-core/src/tool-defs.ts` (`SESSION_TOOL_DEFS`) | Source of truth for session Agent tool schemas/handlers; **not** a complete cross-caller action registry |
| Tool handlers | `packages/session-tools-core/src/handlers/` | One handler per tool |
| Shared tool context | `packages/session-tools-core/src/context.ts` (`SessionToolContext`) | Handlers run for **both** Claude and Codex/Pi backends |
| Tool result type | `packages/session-tools-core/src/types.ts` (`ToolResult`) | `{ content, structuredContent?, isError? }` |
| Agent permission policy | `packages/shared/src/agent/mode-manager.ts`, `packages/shared/src/agent/core/pre-tool-use.ts`, `packages/shared/src/agent/core/permission-manager.ts`, `SessionManager` | Policy and enforcement are distributed across these seams; `PermissionManager` alone is not the global gate |
| Permission modes | `packages/shared/src/agent/mode-manager.ts`, `mode-types.ts` | Canonical explore/ask/execute map to **stored** enum `safe` / `ask` / `allow-all` (`PERMISSION_MODE_TO_CANONICAL`). `rg` the stored values when tracing `shouldAllowToolInMode` |
| **Permission enforcement** | `packages/shared/src/agent/core/pre-tool-use.ts`, `SessionManager` | The real gate + approval prompt. The SDK runs `bypassPermissions`; the PreToolUse hook decides allow/deny and emits `permission_request`. `PermissionManager.evaluateToolCall` **defaults to allow** for unrecognized tools — not a gate on its own |
| Built-in tools (not the registry) | `pre-tool-use.ts` (`BUILT_IN_TOOLS`, `FILE_PATH_TOOLS`); `claude-agent.ts` (`preset: 'claude_code'`) | The agent's `Bash`/`Read`/`Write`/`Edit` are SDK built-ins, separate from `SESSION_TOOL_DEFS`. File mutations currently go through these |
| System prompt assembly | `packages/shared/src/prompts/system.ts`, `packages/shared/src/agent/core/prompt-builder.ts`, `agent/{claude-agent,pi-agent}.ts` | Current full/mini prompt paths; E13 profile work must extend this route, not create a second builder |
| Session tool projection | `packages/session-tools-core/src/tool-defs.ts` (`getSessionToolDefs`), `packages/shared/src/agent/session-scoped-tools.ts` | Current filtering is narrow; the post-TE1/R0 bounded profile slice centralizes any effective projection here and shares it across provider lanes |
| Usage/cache accounting | `packages/shared/src/agent/core/usage-tracker.ts`, provider event adapters | Inherited usage ledger; Fleet `cache-economy.ts` and TE1 projection are absent |
| **Timeline events** | `packages/shared/src/protocol/dto.ts` (`SessionEvent` union) | Has `tool_start`, `tool_result`, `permission_request`, `permission_mode_changed` |
| Event broadcast channels | `packages/shared/src/protocol/events.ts`, `channels.ts` (`RPC_CHANNELS.sessions.EVENT`) | Server→client push |
| Session authority | `packages/server-core/src/sessions/`, `packages/shared/src/sessions/` | The one session store |
| Agent label action | `packages/session-tools-core/src/handlers/set-session-labels.ts`; `packages/shared/src/agent/session-self-management-bindings.ts` | Agent adapter → PreToolUse → SessionManager callbacks |
| Human label action | renderer `AppShell.tsx` → `sessionCommand(setLabels)` → `packages/server-core/src/handlers/rpc/sessions.ts` | UI path → `SessionManager.setSessionLabels`; no generic governed cross-caller seam yet |

### Desktop shell and navigation

| Concern | Start here |
|---|---|
| Global shell | `app/apps/electron/src/renderer/components/app-shell/AppShell.tsx` |
| Sidebar / navigation | `app/apps/electron/src/renderer/components/app-shell/LeftSidebar.tsx` |
| Session list | `app/apps/electron/src/renderer/components/app-shell/SessionList.tsx` |
| Main content routing | `app/apps/electron/src/renderer/components/app-shell/MainContentPanel.tsx` |
| Conversation surface | `app/apps/electron/src/renderer/components/app-shell/ChatDisplay.tsx` |
| Navigation state | `app/apps/electron/src/renderer/contexts/NavigationContext.tsx` |
| Inherited Board route | `app/apps/electron/src/shared/route-parser.ts`; `MainContentPanel.tsx` — Sessions navigator with `viewMode: board`, not the former Fleet navigator |

### Common change routes

- **Add an Agent session tool:** schema + description + handler + one `SESSION_TOOL_DEFS` entry;
  then trace mode-manager → PreToolUse → SessionManager approval and event adapters. The registry
  entry alone supplies neither permission nor evidence.
- **Converge a human and Agent action:** identify both existing adapters, then route them into one
  caller-aware invocation/policy/executor/evidence seam
  ([`modules/agent-core.md`](modules/agent-core.md#release-contract--r4-action-seam)). UI does not simulate PreToolUse.
- **Feature behavior generally:** renderer → atom/hook → RPC → server handler → existing Craft
  store/service. Search all callers before touching a shared type.
- **Change prompt/tool visibility:** inventory the serialized prompt and schemas; follow E13 and
  `modules/context.md`; extend one effective projection before provider
  schema adaptation. Do not couple it to R4 or treat a provider lane as a loadout authority.

### Removed Fleet modules and surviving contracts

The v0.13.4 reset does not carry previous implementation status forward. These paths are absent;
consult decisions/specs for the approved behavior and the snapshot only for historical evidence.
Do not recreate old stores merely because a historical implementation exists.

| Area | Absent implementation | Contract that remains |
|---|---|---|
| Assistant | `packages/shared/src/assistants/` and Assistant RPC/selector | Independent identity and requested loadout, never labels; existing permission path grants access |
| Component host | `packages/shared/src/components/` | Scoped activation through one host/settings authority; early R15/R18 foundation |
| Layout tree | `packages/shared/src/layout/` and Fleet `right-sidebar/RightSidebar.tsx` | User-controlled panel placement; inherited panel stack remains the current starting mechanism |
| Artifact history | `packages/shared/src/artifacts/history-backend.ts` | Native text/media/document owners; attribution required; history router `not implemented` |
| Git snapshots/revert | `packages/shared/src/git/snapshot-plan.ts`; `sessions/revert-model.ts` | Never move the user's HEAD/index/refs; conversation branching is not file revert |
| Activity, terminal and cost helpers | `sessions/session-activity.ts`; `terminal/terminal-capability.ts`; `config/{model-pricing,session-cost,usage-rollup}.ts` | Activity is derived; detect interactive commands honestly; unknown cost is never zero |
| CLI catalog/ACP | `packages/shared/src/cli-agents/cli-agent-connection.ts` | Detect separately from configuration; record resolved binaries; never scrape private caches |
| Expert-kit label modules | `packages/shared/src/labels/{expert-kit,skill-routing,kit-gallery,kind-normalize,kit-sources,memory-curator-kit,example-kits}.ts` | Do not restore identity/loadout in labels; catalog size is not an attention limit |
| Curated memory | `packages/shared/src/memory/` | Delegates return evidence; one consolidation writer promotes curated memory |
| Bounded delegation | `agent/{delegation-contract,delegation-policy,delegation-projection,delegation-routing,path-lease,permission-intersection,run-report-validate}.ts`; renderer `DelegationStrip.tsx` | R6 TaskBrief/RunReport gates, permissions, leases and independent verification remain `not implemented`; Craft TaskRunner and child Sessions survive |
| R3 acceptance fixture | `workspaces/deliverable-acceptance.ts`; `handlers/accept-deliverable.ts` | R3-C1..C8 require a real accepted chain; a fixture never substitutes for it |
| Fleet shell/composer helpers | `shell-layout.ts`, `sidebar-visibility.ts`, `SidebarPanelSlot.tsx`, plan-compact coordinator, session-option sync, optimistic command, browser-action and automation-batch helpers | Extend current Craft callers; historical extraction is not current wiring |
| Runtime modes and cache economy | `config/runtime-modes.ts`; `agent/core/cache-economy.ts` | Keep reasoning, speed and runtime modes distinct; measure actual usage before optimization |
| Former utility survivors | `packages/ui/src/components/markdown/sanitize-schema.ts`; `packages/messaging-gateway/src/atomic-write.ts` | Both are now absent too; neither remains a current code locator |

Existing Files UI lives in `SessionInfoPopover.tsx` → `right-sidebar/SessionFilesSection.tsx`.
Notes `GET_NOTES`/`SET_NOTES` survive in `packages/server-core/src/handlers/rpc/sessions.ts` and
Electron's `transport/channel-map.ts`, but no Notes renderer consumer is mounted. The host
foundation remains `not implemented`; see [`modules/components.md`](modules/components.md#release-contract--r18-component-and-panel-foundation).

### Localization

`packages/shared/src/i18n/registry.ts` registers seven inherited locales, including `zh-Hans`.
`renderer/main.tsx` restores browser language and synchronizes Electron; `main/index.ts` persists
`uiLanguage`; `AppearanceSettingsPage.tsx` exposes selection. These are v0.13.4 mechanisms, not
restored Fleet work. Fleet branding and service-label changes remain separate acceptance work.

### Craft-operated service boundaries (R2 scope)

Inherited entry points, each handled as its own coherent slice per Decision P8 and
[`modules/services.md`](modules/services.md). Do not remove a URL without tracing
UI → handler → persistence → recovery.

Paths in this table are relative to `app/`. Observed behavior is **not** the required Fleet result.
The original paths below are restored source observations, not completed R2 corrections.

| Concern | Current entry and observed behavior | Required Fleet result |
|---|---|---|
| Conversation export | Original Session sharing commands and ChatPage/menu consumers; Fleet exportMarkdown helper absent | Proposed local Markdown export over Session data; retain existing-share cleanup; not implemented |
| Upstream version awareness | packages/shared/src/version/manifest.ts retains the Craft-hosted release manifest | Keep developer source intake distinct from the future Fleet install channel |
| Binary updater | apps/electron/src/main/auto-update.ts enables automatic download and quit installation; packaged startup checks the Craft feed; builder publishes to Craft | Approved R2 correction must prevent Craft replacing Fleet; not implemented |
| Pages publication | feature-flags.ts defaults sharing on; publisher.ts defaults to the Craft API | Preserve local Pages; remove new hosted publication and retain needed unpublish cleanup; not implemented |
| Product telemetry | main/index.ts configures Sentry from the build-time ingest URL and machine identity | Remove product uploads while preserving local diagnostics; not implemented |
| Help, Agent docs routing and Docs MCP | Bundled docs/index.ts and hosted doc-links/system prompt coexist; Fleet local help patches absent | Proposed matching bundled human/Agent guidance and explicit external links; not implemented |
| WebUI OAuth relay | Original auth/oauth-relay.ts defaults to the Craft callback; Fleet override absent | Proposed user-configured or honestly unavailable relay, preserving local auth |
| Slack OAuth relay | Original auth/slack-oauth.ts defaults to the Craft relay; Fleet override absent | Explicit optional connector and user-owned relay if needed; no required Fleet service |
| Craft sources/connectors | `packages/shared/src/sources/`; `packages/shared/src/mcp/`; builtin source definitions | Optional connectors only; never required for startup or core local data |
| Branding/support/co-author text | `packages/shared/src/branding.ts`; package metadata; `packages/shared/src/prompts/system.ts`; Electron menus and updater recovery text | Deliberate rename with compatibility and license/trademark review; no global replacement |

### Verification commands

| What | Command / scope |
|---|---|
| Initialize repository gates | From repository root: `bash scripts/init.sh` |
| Fleet gate | From repository root: `bash scripts/fleet-verify.sh` — repository policy and full-suite entry point; inspect the script for its current stages |
| Typecheck shared / Electron / all declared packages | From `app/`: `bun run typecheck:shared`, `bun run typecheck:electron`, `bun run typecheck:all` |
| Targeted tests | From `app/`: `bun test <test-path>` |
| Upstream shared smoke | From `app/`: `bun run test:shared:all` — six files, not the full suite |
| Upstream whole-suite script | From `app/`: `bun run test` — ordinary Bun discovery, then separate processes for `*.isolated.ts`; this script does not pass `--isolate` |
| Upstream dev gate | From `app/`: `bun run validate:dev` — typecheck:all, six shared smoke files and document-tool tests |
| Upstream CI gate | From `app/`: `bun run validate:ci` — dev gate plus i18n parity/sorted/coverage |
| Launch real app (dev) | From `app/`: `bun run electron:dev` |
| Build + start | From `app/`: `bun run electron:start` |

`test:changed`, `validate:quick` and `lint:ui-contract` are absent from the inherited manifest.
It does not pin Bun with `packageManager`/`engines`; `scripts/init.sh` checks the installed toolchain.
Do not describe `validate:dev` as a full-suite or UI-contract gate. Verification policy:
[`engineering.md`](engineering.md#quality-verification-and-acceptance). Passing checks are evidence, never a capability status.

### Keeping this file honest

Update it only when an important entry point or authority actually moves. It is a map to the few
things that matter, kept short so it stays true.
