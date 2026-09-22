# Architecture

> The system as it must ultimately work: authorities, dependency structure, technical invariants,
> and the failure models the controller must prevent. **Sequencing and current status live in
> [`TODO.md`](../TODO.md#release-ladder)** — this file is not a progress diary.

The large independent delivery systems and their cross-suite conflict gate are defined in
`PROJECT-SPEC.md`. This file remains the invariant and failure authority;
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

Development order is owned by [`TODO.md`](../TODO.md#release-ladder), not this diagram. The owner
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
  consumer that need them ([`features/SYS-01-agent-os.md`](features/SYS-01-agent-os.md#release-contract--r4-action-seam), Decisions D6, G2).
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
  (`PROJECT-SPEC.md`). The built-in BrowserPane and specific outside-tool jobs use the narrowest existing
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

## Core authorities

This folder is a navigation index. Each topic keeps one canonical document, linked below.

### Core authorities

- [Product boundary](PROJECT-SPEC.md)
- [Product explanation](PROJECT-SPEC.md#vision)
- [Decision ledger](DECISIONS.md)
- [Non-negotiables](DECISIONS.md#hard-constraints)
- [Architecture](ARCHITECTURE.md)
- [Roadmap](../TODO.md#release-ladder)
- [Code map](#code-map)
- [Craft capability map](#craft-capability-map)
- [Quality](DEVELOPMENT.md#quality-verification-and-acceptance)
- [Glossary](PROJECT-SPEC.md#glossary)
- [Product matrix](PROJECT-SPEC.md#product-matrix)
- [Page architecture](PAGE-STRUCTURE.md)
- [Orchestration](#orchestration)
- [Module architecture and compatibility](COMPONENT-GUIDELINES.md#module-compatibility-gates)
- [Independent system suites](PROJECT-SPEC.md#capability-register)
- [Token economy and harness efficiency](features/SYS-03-context-economy.md)

### Core authority rule

This index is navigation only. A core document has one canonical location; a module must consume
the core authority through an explicit seam and must not copy its state or decision logic.

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
| Fleet product authority | `docs/` numbered set + `specs/` | Decisions, boundaries, route, code entries |
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
  ([`features/SYS-01-agent-os.md`](features/SYS-01-agent-os.md#release-contract--r4-action-seam)). UI does not simulate PreToolUse.
- **Feature behavior generally:** renderer → atom/hook → RPC → server handler → existing Craft
  store/service. Search all callers before touching a shared type.
- **Change prompt/tool visibility:** inventory the serialized prompt and schemas; follow E13 and
  `features/SYS-03-context-economy.md`; extend one effective projection before provider
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
foundation remains `not implemented`; see [`features/SYS-09-workspace-compositions.md`](features/SYS-09-workspace-compositions.md#release-contract--r18-component-and-panel-foundation).

### Localization

`packages/shared/src/i18n/registry.ts` registers seven inherited locales, including `zh-Hans`.
`renderer/main.tsx` restores browser language and synchronizes Electron; `main/index.ts` persists
`uiLanguage`; `AppearanceSettingsPage.tsx` exposes selection. These are v0.13.4 mechanisms, not
restored Fleet work. Fleet branding and service-label changes remain separate acceptance work.

### Craft-operated service boundaries (R2 scope)

Inherited entry points, each handled as its own coherent slice per Decision P8 and
[`specs/R2-independence.md`](specs/R2-independence.md). Do not remove a URL without tracing
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
[`DEVELOPMENT.md`](DEVELOPMENT.md#quality-verification-and-acceptance). Passing checks are evidence, never a capability status.

### Keeping this file honest

Update it only when an important entry point or authority actually moves. It is a map to the few
things that matter, kept short so it stays true.

## Craft capability map

> Use this as an index, not a reading assignment. Find the row for the active capability, inspect
> the listed code, then confirm with `rg`. Third-party comparisons live in
> [`源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](../源码参考/meta/CAPABILITY-REFERENCE-MAP.md).
> Product behavior is [`PROJECT-SPEC.md`](PROJECT-SPEC.md). Current `app/` is the Craft **v0.13.4** baseline restored on 2026-09-21.
> Fleet extensions from the prior tree are preserved at `snapshot/pre-rebuild-2026-09-21`;
> their previous status does not carry into this baseline.
> v0.10.5 is a *look* comparison, not a shell to restore. Cindy decides feature implementation,
> not chrome rearrangement. Do not overlay new surfaces onto `AppShell.tsx`.

### Classification

- **REUSE** — call or improve the existing Craft authority.
- **EXTEND** — add behavior to the existing authority and migrate every caller coherently.
- **NEW** — Craft has no authority for it; still connect it to existing Session, permission,
  timeline, Workspace, and Task boundaries.
- **CONDITIONAL** — do not build until a real caller or measured failure proves the need.

If a capability is absent, inspect current code before adding one concise row. Never add a second
session, permission path, timeline, task/job store, settings home, browser stack, or shell.

Paths are relative to `app/`.

### How to execute a map row

A row is a locator and boundary, not a complete specification. For a REUSE fix, inspect the listed
authority and its callers. For EXTEND / NEW, follow the route:

```text
current Craft authority → binding decision/spec → exact missing edge
→ first real producer + consumer → observable failure/recovery proof → promoted shared contract
```

A technical detail is binding only when present in current code, the numbered documents, an active
spec, or the current owner request. Deleted historical documents are never an implicit
specification; the retained failure lessons live in [`ARCHITECTURE.md`](ARCHITECTURE.md) §3.

### Core authority map

| Capability                                  | Current authority / code entry                                                                                          | Class        | Fleet boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session lifecycle and persistence           | `packages/server-core/src/sessions/SessionManager.ts`; `packages/shared/src/sessions/`                                  | REUSE        | One Session authority.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Session evidence                            | `packages/shared/src/protocol/dto.ts` `SessionEvent`; protocol events/channels                                          | REUSE/EXTEND | Extend events only when a real consumer needs durable or attributed evidence. The future WorkTrace projection uses source/derived event references and current/shadowed/log-only folding; it is not a second timeline.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Work modes, permission modes and Agent gate | `packages/shared/src/agent/{mode-manager,mode-types}.ts`; `packages/shared/src/agent/core/pre-tool-use.ts`; SessionManager approval flow | EXTEND | Craft permission modes and `SubmitPlan` are inherited. Fleet automatic work phases and `EnterPlan` are `not implemented`; `work-mode.ts` is absent. R1 now owns independent Plan plus Confirm changes / Auto edit / Full access in the composer. The legacy automatic-phase/Settings-only proposal is superseded; the new policy is `not implemented`. |
| Agent session tools | `packages/session-tools-core/src/tool-defs.ts`, `packages/session-tools-core/src/handlers/`, `packages/session-tools-core/src/context.ts` | EXTEND | Registry covers Agent tools, not human RPC or SDK built-ins. Inherited `SubmitPlan` pauses for review; Fleet `EnterPlan` is absent. |
| Human/Agent shared actions                  | UI RPC + Agent tool/PreToolUse + owning service                                                                         | EXTEND       | **`not implemented` as a generic seam.** Route: [`features/SYS-01-agent-os.md`](features/SYS-01-agent-os.md#release-contract--r4-action-seam). The future seam carries caller provenance, operation/attempt correlation, exact input/output ArtifactRef versions and structured conflict/replan results; WorkTrace is projected from Session/Action/Job/Artifact events. Record & Replay extracts user-selected semantic Action sequences into reviewed Skills rather than replaying raw coordinates. |
| Usage and context accounting | `packages/shared/src/agent/core/usage-tracker.ts`; provider usage events | EXTEND | One inherited usage path. Fleet TE1 `CacheEconomySummary` and `cache-economy.ts` are absent after the reset; normalized cache-economy projection and visible cache columns are `not implemented`. Real/estimated/unknown cost must extend this path, never a second ledger. |
| Prompt queue and mid-turn steering          | `SessionManager.messageQueue`, `sendMessage`, `processNextQueuedMessage`; backend `redirect`; composer queue projection | EXTEND       | Preserve disk-before-ack and restart replay. Queued prompts render from the Session-owned FIFO above the composer; edit/remove updates that same queue and persisted transcript rather than a renderer-only list.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Project/Workspace | Workspace config/root plus current nested Project compatibility | REUSE/EXTEND | R1 extends the existing Workspace/Project stores: single grouped sidebar, independent Board, right tools, draft Project/folderless selection and derived activity. Inherited Workspace/Project stores are `wired but not visually checked`; the R1 sidebar, context picker, right panel and activity changes are `not implemented` after rollback. |
| Sessions, tasks, Board and scheduling       | SessionManager/SessionEvents; `packages/shared/src/tasks/`; `packages/server-core/src/tasks/`; Session status/labels; scheduler  | REUSE/EXTEND | Current Craft `board` route resolves to the Sessions navigator with `viewMode: board`. The Fleet separate navigator is `not implemented` after the reset; the approved owner direction remains a projection/editor over the existing Session/Task authorities, without a list/Board toggle, duplicate Conversations or another task/job store. Dashi Taskboard is evidence for optimistic task transitions only; its SQLite issue store and Codex injection are not imported. |
| Task execution integrity / drift control    | Task store + TaskRunner + SessionEvents + PreToolUse + UsageTracker                                                     | EXTEND       | Craft TaskRunner and child Sessions are the starting mechanisms. The earlier Fleet delegation kernel, leases, TaskBrief/RunReport validation, inline strip and verifier were discarded; R6 remains `not implemented`. |
| Settings, credentials, Sources and Skills | shared stores/managers; `apps/electron/src/renderer/pages/settings/AiSettingsPage.tsx`; `apps/electron/src/shared/settings-registry.ts` | REUSE/EXTEND | Inherited Craft AI settings, connection defaults, credentials, Sources and Skills remain. `config/paths.ts` owns the selected profile root; credentials and startup/default Workspace/server state must honor `CRAFT_CONFIG_DIR` without falling back to another profile's data. Fleet unified model presentation, subscription allowance adapters and classified runtime modes were removed in the reset and are `not implemented`. The approved model interaction contract remains Page Architecture §3B; one settings/connection authority. |
| Identity labels and statuses                | `packages/shared/src/labels/`; status configuration                                                                     | REUSE/EXTEND | Labels are metadata over work. Definitions have one Settings home; Session menus assign them; label results are projections. Labels never store Assistant identity or loadout. |
| Assistant identity and requested loadout | no Fleet Assistant store, RPC or selector in the current tree | EXTEND | `not implemented`. `packages/shared/src/assistants/` and the prior catalog/create/wear backend are absent after the reset. The approved identity authority remains independent of labels; permission is a request evaluated by the existing permission path. |
| Search, archive and dynamic views | `packages/shared/src/search/`; `packages/shared/src/views/`; Session archive commands | REUSE/EXTEND | Original search/views and archive commands remain. Fleet shared full/compact scope and navigation corrections were withdrawn. Preserve useful predicates; cross-domain search is owned by R5 / INFO-06. |
| Automations                                 | `packages/shared/src/automations/`; server automation handlers; scheduler                                               | REUSE/EXTEND | Extend existing scheduler/Session/Task paths.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### Runtime and execution map

| Capability                            | Current authority / code entry                                                                                                  | Class                     | Fleet boundary                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude/Pi backends                    | `packages/shared/src/agent/claude-agent.ts`, `pi-agent.ts`, shared tool context                                                 | REUSE                     | Provider differences stay behind existing backend seams.                                                                                                                                                                                                                                                                                                        |
| Additional CLI/API/ACP runtimes       | backend seam + SessionManager adapters                                                                                          | EXTEND                    | One adapter contract: start/attach/send/cancel/approve/health/stop; all events map into Fleet authorities. CLIProxyAPI is an external Go proxy reference only, not a second Fleet model gateway. |
| Built-in Read/Write/Edit/Bash         | SDK built-ins plus `packages/shared/src/agent/core/pre-tool-use.ts`                                                                                       | REUSE                     | Permission checks stay in PreToolUse.                                                                                                                                                                                                                                                                                                                           |
| Command validation                    | shared Bash/PowerShell validation and permissions config                                                                        | REUSE/EXTEND              | Extend command-aware validation; never trust names or external `readOnlyHint` alone.                                                                                                                                                                                                                                                                            |
| Background shell                      | Bash background path; shell/task events in SessionManager                                                                       | EXTEND                    | Reuse existing execution registry and events.                                                                                                                                                                                                                                                                                                                   |
| Interactive PTY                       | no complete authority                                                                                                           | NEW, CONDITIONAL          | R18 implement-or-`NO_GAP`: only for a real interactive caller; reuses Session permission/evidence/cancellation.                                                                                                                                                                                                                                                 |
| OS isolation                          | `packages/session-tools-core/src/runtime/{filesystem-isolation,network-isolation,sandbox-env}.ts`; `packages/session-tools-core/src/handlers/script-sandbox.ts` | REUSE                     | Preserve and harden the existing permission/process/filesystem/network boundary. A second OS/container sandbox is closed `NO_GAP` by `PROJECT-SPEC.md`; R18 does not reopen it. |
| Checkout/worktree isolation           | Git/process integration                                                                                                         | NEW                       | Execution location, checkout isolation, and provider choice stay independent (P9).                                                                                                                                                                                                                                                                              |
| Multi-Agent execution                 | child Sessions, `parentSessionId`, TaskRunner DAG, background-task registry                                                     | REUSE/EXTEND              | Existing child-Session/TaskRunner mechanisms remain one authority. Fleet permission intersection, TaskBrief/RunReport gates, leases, verifier and inline delegation projection were discarded and are `not implemented` until R6. No Team/Leader product or second store. |
| Adaptive organization                 | orchestration policy over existing Task/Session authorities                                                                     | EXTEND                    | R17: route by measured risk/cost (C5–C6) using R6+ accepted-outcome evidence, or close `NO_GAP`.                                                                                                                                                                                                                                                                |
| Model routing/fusion                  | backend seam + UsageTracker                                                                                                     | EXTEND/NEW, CONDITIONAL   | R17 implement-or-`NO_GAP`; default off and API/OAuth lanes only (E3).                                                                                                                                                                                                                                                                                           |
| Context projection / token economy    | existing compaction, large-response paths, `packages/shared/src/agent/core/rtk-rewrite.ts`, UsageTracker; provider prompt/tool assembly                   | EXTEND, CONDITIONAL       | E12/E13. RTK is an optional external-binary adapter, not an in-repo compression engine: disabled, missing/incompatible or failed rewrites pass through unchanged. Reuse the one ledger and existing provider lanes. TE1 is observation-only; after R0 + baseline, extend one centralized effective projection for prompt/tools and test Pi-light as a profile, never a second kernel. ArtifactRef/TaskBrief remain R5/R6; typed compression and Tool Search require measured gates. Raw evidence stays recoverable.      |
| Specified local-app Computer Use | Existing broker, Session evidence and Component host; native app observation/input is absent | EXTEND/NEW | `not implemented`; bounded R16 Component after R0 + host. [SYS-02](features/SYS-02-remote-office.md#local-app-computer-use-contract) owns helper comparison, scoped app/window grants and takeover. No general Core controller or second sandbox. |

### Files, artifacts and production surfaces

| Capability                               | Current authority / code entry                                           | Class              | Fleet boundary                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace files | Workspace filesystem and existing file tools | REUSE/EXTEND | Containment, permissions, errors and recovery stay on the native filesystem path. Fleet `acceptDeliverable` is absent after the reset; the R3 acceptance-copy helper is `not implemented`. No second byte store. |
| Concurrent file leases                   | none                                                                     | NEW                | Only for the first real multi-writer loop; filesystem bytes remain native authority.                                                                                                                                                                                                                                                                  |
| ArtifactRef and Library                  | none                                                                     | NEW                | Versioned reference/provenance envelope over native bytes (roadmap R5); never a second byte store.                                                                                                                                                                                                                                                    |
| Document ingestion                       | Sources + preview/tool conversion paths; Component format adapters       | EXTEND             | Prefer source-backed open-source parsers/converters over Fleet reimplementation. Preserve original ArtifactRef, adapter revision, bundled license boundary and conversion provenance; unsupported features remain explicit.                                                                                                                                                                                                                             |
| Code intelligence                        | MCP/Sources                                                              | REUSE, CONDITIONAL | Optional provider; degrades cleanly.                                                                                                                                                                                                                                                                                                                  |
| BrowserPane and CDP                      | Electron BrowserPane/CDP and `browser_tool`                              | REUSE/EXTEND       | One browser authority (E6); current auxiliary windows and commands are `wired but not visually checked`. Phone simulation, durable history search, immediate user takeover and Fleet evidence capture are `not implemented`; see SYS-04 for exact observed limits. Browser Harness is a reference for CDP/MCP helper separation, not a general external-computer control surface. |
| Pages local mini-apps | `packages/shared/src/pages/`; server Pages handlers; renderer PageView | REUSE/EXTEND | Original local Pages and default-enabled hosted publication remain. Local Pages is not the production canvas; R2 publication removal is not implemented. |
| Markdown/HTML/PDF/image/diagram previews | existing renderer preview components                                      | REUSE              | Mounted preview paths are `wired but not visually checked`. Direct document editing is not implemented; the TipTap component currently has only a playground caller and does not prove file round-trip. No second Markdown editor. |
| Workbench panels | `apps/electron/src/renderer/components/app-shell/{AppShell,PanelStackContainer,PanelResizeSash,SessionInfoPopover}.tsx`; `apps/electron/src/renderer/atoms/panel-stack.ts` | EXTEND | Inherited side-by-side sizing and Files popover are `wired but not visually checked`. Notes RPC exists without a renderer caller; the Fleet right sidebar and layout tree are absent. Generic registration and user move/reorder/float are `not implemented`. Early host contract: `features/SYS-09-workspace-compositions.md`. |
| Spatial canvas | no production canvas pane in the current tree | NEW | Production surface per `PROJECT-SPEC.md`: generate/edit/layout on one board. `not implemented`. A future `surface:canvas` route is a contract, not an existing authority. |
| Native design documents                  | no Fleet schema authority                                                | NEW                | Decision E11; Penpot/GenOffice/Open Design are source evidence and possible adapter/component inputs, not a second design authority.                                                                                                                                                                                                                                                                                                      |
| Finite workflows                         | no complete workflow authority                                           | NEW                | DAG invokes governed actions and existing Task/runtime/permission paths (roadmap R8).                                                                                                                                                                                                                                                                 |
| Creative modules                         | existing files/previews plus R4 action, R5 ArtifactRef and R11 Job seams | NEW                | R10–R13: each module owns only its native schema (E4), selects source-backed format/render adapters where useful, and extends the Craft shell/authorities.                                                                                                                                                                                                                                                        |
| Built-in extensions | existing tool/Sources/Skills/permission/settings authorities | EXTEND | Registered Component activation is `not implemented`; `shared/src/components/` types and resolver are absent after the reset. Early R15/R18 foundation connects real surfaces, scoped overrides and lazy activation before domain components. Left/right are additive-entry defaults; placement belongs to one host. No blanket R6/R9 gate. |
| Governed experience                      | Session evidence + Workspace knowledge                                   | NEW                | Layered agent-maintained memory files + logged consolidation (roadmap R9, D5 floors); curation optional; no hidden second store.                                                                                                                                                                                                                      |

### External services and distribution

The owner restored original Craft source. Fleet updater, publication, telemetry, help and relay
corrections were withdrawn and are not implemented. R0 currently prepares the joint review; the
original observed service paths and proposed R2 outcomes must remain distinct.


| Capability                   | Current authority / code entry                  | Class                  | Fleet boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------- | ----------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP and external providers   | `packages/shared/src/mcp/`; Sources             | REUSE/EXTEND           | Optional connector; absence must not break startup.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| CLI client                   | `apps/cli/` and server transport                | REUSE/EXTEND           | Reuse commands and transport; no second local daemon by default.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Configuration CLI | bundled `craft-agent` wrappers and command reference | EXTEND | Implementation packages are absent; the earlier Fleet unavailable guard was removed. Audit the original wrapper/caller before proposing its removal or correction. |
| Remote/self-hosted execution | `packages/server-core/src/{bootstrap/headless-start,transport/server}.ts`; `apps/electron/src/renderer/pages/settings/ServerSettingsPage.tsx`; Workspace routing | EXTEND | Inherited Craft server/token settings and remote Workspace transport are `wired but not visually checked`. Listener auth validates the shared server token; Fleet per-device grants, one-time invites, endpoint racing/reachability, host grouping and composer run-target selection are `not implemented` after the reset. `shared/src/remote/`, `main/server-mode.ts` and `main/handlers/remote-devices.ts` are absent. P7 scoping/revocation and P9-rev local-first remote connection remain requirements, not delivered security guarantees. No Fleet relay cloud. |
| SSH remote machines | no `packages/remote-ssh/` in the current tree | EXTEND | `not implemented`. The prior Cindy-derived parked library and tests were removed in the reset and remain in the snapshot. P9-rev does not make SSH host management the remote-connection surface; any future bootstrap role needs its own bounded admission. |
| GitHub delivery              | EXEC-13; OpenChamber decides Git/PR | EXTEND | Durable code handoff after remote work. `not implemented` as a Fleet GitHub surface; pairing must not grow a second file-sync. |
| Messaging                    | messaging gateway/workers and settings/handlers | REUSE/EXTEND           | One Workspace-scoped adapter contract; platform absence honest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Desktop OAuth                | existing local callback path                    | REUSE                  | Independent of Craft cloud.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| WebUI/Slack OAuth relays     | shared auth relay modules                       | EXTEND                 | **`not implemented` in the v0.13.4 baseline.** Prior Fleet relay configuration is absent. `FLEET_OAUTH_RELAY_URL` and `FLEET_SLACK_OAUTH_RELAY_URL` do not exist in the tree; `auth/oauth-relay.ts:3` hardcodes the Craft callback with no override, and `auth/slack-oauth.ts` defaults to it.                                                                                                                                                                                                                                                                                                                                                                        |
| Conversation Markdown export | Current Session storage and sharing commands; Fleet export helper absent | EXTEND | not implemented: the Fleet local export command/UI was withdrawn; original hosted sharing remains. R2 owns the proposed local replacement and existing-share cleanup. |
| Application updates | main/auto-update.ts; electron-builder.yml; version/manifest.ts | EXTEND | Original automatic download and quit installation from the Craft feed remain. Fleet channel safety/removal is not implemented; review R2 before patching. |
| Product telemetry | main/renderer/preload entry points and build defines | EXTEND | Original Sentry ingest configuration and machine identity remain. Fleet telemetry removal is not implemented; keep local diagnostics distinct from uploads. |
| Binary install/release | `scripts/install-app.sh`; `.ps1`; existing source build scripts | EXTEND | Original upstream installer scripts remain; Fleet distribution is not implemented. Do not run these as a Fleet install or restore their removed guard without approved scope. |
| Server container | `Dockerfile.server` | EXTEND | `not implemented` as a verified build path: inherited COPY instructions refer to absent `packages/craft-agents-commands/package.json` and `packages/craft-cli/package.json`. Non-root runtime guidance exists; no image-build/smoke evidence is claimed. |
| Help/docs | docs/index.ts; docs/doc-links.ts; prompts/system.ts; renderer/native help consumers | REUSE/EXTEND | Original bundled files coexist with hosted guidance. Fleet unified local help/profile routing and DocumentationOverlay patches were withdrawn; correction is not implemented. |
| Upstream intake              | pinned Craft reference, tags, release notes     | REUSE                  | Selectively port reviewed changes; never merge wholesale.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Reference routing

Open-source checkouts are owner-controlled evidence caches, not Fleet modules; removal requires
the exact retention decision in AGENTS and the reference registry. For a capability
comparison, use [`源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](../源码参考/meta/CAPABILITY-REFERENCE-MAP.md).
Open a checkout only when current code leaves a concrete question unanswered. A listed project is
only a candidate until source-level implementation, same-task superiority, credible alternatives,
the bounded local-improvement test, authority fit, licensing, and retention value all pass the
admission rules in [`源码参考/meta/PLAYBOOK.md`](../源码参考/meta/PLAYBOOK.md).

### Summary

Craft already provides the product spine: Session, permission, evidence events, backends and tools,
background execution, MCP, Sources, Skills, credentials, Tasks, views, automations, scheduler,
settings, browser, previews. Fleet's genuinely new work is limited to proven gaps — the action
seam, file coordination, ArtifactRef/Library, bounded delegation, finite workflows, native creative
documents, governed experience — each attached to the existing spine through one real vertical
behavior loop, in roadmap order.

## Orchestration

> How Fleet directs work: how agents are organized, how capabilities compose, and how the infinite
> canvas becomes a command surface for both. This design is subordinate to `PROJECT-SPEC.md`.
> Decisions it operationalizes: C1–C11 (delegation/integrity), E1–E5a (capabilities/canvas),
> S1–S5 (actions), G2/G5/G6 (order/coverage/frontend). Sections marked **[decided]** bind as target
> requirements, not as claims that the runtime exists;
> **[at activation]** binds when the owning release activates; **[evidence-gated]** waits for a
> named gate.

### Current implementation boundary

The v0.13.4 baseline has a Craft Session tree linked by `parentSessionId`, plus a separate
structured TaskSpec DAG and append-only task run log (`app/packages/shared/src/tasks/schema.ts` and
`app/packages/shared/src/tasks/storage.ts`). `app/packages/server-core/src/tasks/TaskRunner.ts` schedules that DAG through child
Sessions. These existing stores have different responsibilities; a Session tree is not the Task
specification or its run log, and neither is the planned Fleet orchestration contract.

Fleet TaskContract, TaskBrief/RunReport validation, the dispatch-generation identity below and
ProjectDigest are `not implemented`. R4 governed actions, R5 ArtifactRef and the Fleet Job/WorkTrace
integration are also targets. Current evidence is the Craft Session/SessionEvent path and Task run
records. Preserve those owners when the ordered slices add contracts; do not infer implementation
from **[decided]**, a diagram, or a target field list. New feature work also remains subject to the
baseline exit in `TODO.md`.

### 0. The one-sentence model

**Code owns execution state; any Session may delegate; surfaces operate on the same authorities.**
Code owns scheduling, budgets, permissions and validation; agents exercise judgment inside bounded
contracts. Chat and Board project execution state. The production canvas also hosts direct editing
of images, video, websites and decks through their native owners; projection does not mean read-only.

### 1. Three planes of orchestration

| Plane | Question it answers | Current owners and target extensions |
|---|---|---|
| **Execution** | Which agent/runtime does which task, under what budget and permission | Current Session tree + TaskSpec/run log + TaskRunner; target R6 TaskContract/TaskBrief/RunReport and runtime-adapter contract |
| **Composition** | How capabilities and artifacts chain into larger work | Governed actions (R4), ArtifactRef (R5), finite workflow DAG (R8), capability registry (E1/E2) |
| **Command** | How the human sees and directs everything | Chat (primary today), Board, **canvas (primary spatial surface, R7)** |

The planes share one rule: **a surface never owns orchestration state.** A canvas card, Board
column, or chat bubble is a projection; commands route through the same governed action path
regardless of which surface issued them (S1).

### 2. The execution kernel **[decided]**

#### 2.1 Objects

- **Session tree and structured Task** — child Sessions use `parentSessionId`; TaskSpec owns the
  structured DAG and its run log records execution through TaskRunner. Extend these existing
  owners; do not collapse them into a new universal task tree or add a second store.
- **TaskContract** — locked per attempt: criteria IDs, allowed/reserved paths, non-goals, budgets,
  contract version (C7). Read-only during the attempt; revision = new version.
- **Run attempt identity** — `taskId + contractVersion + attemptId + dispatchGeneration + sessionId`
  accompanies every command, heartbeat and result. Only the current generation may refresh liveness
  or land output; one Session accepts one in-flight input until its semantic turn is flushed.
- **TaskBrief / RunReport** — the only envelopes across a delegation boundary (C3). Briefs are
  bounded projections of the contract; reports return criterion outcomes + artifact/evidence refs,
  never transcripts.
- **Budgets that halt** — token/tool/edit/retry/delegation ceilings; crossing one pauses execution
  for a deliberate decision (C3). A delegation budget aggregates over the actual Session/Task
  relationship, not a canvas region or a privileged team role.
- **Runtime adapter** — normalizes start/attach/send/cancel/approve/health/stop + usage/failure
  semantics per provider (Claude SDK, Pi SDK, external CLIs). Declared capabilities only — nothing
  invented from a name.

#### 2.2 Run lifecycle (state machine)

```text
draft → briefed → running ⇄ waiting(approval|mailbox|budget-halt)
      → reporting → validated → accepted | failed | cancelled
```

- Transitions are kernel code, not agent conversation. `validated` means the RunReport passed
  structural + semantic checks against the contract version (S4); acceptance is a separate
  authority (C9).
- Cancellation/failure/contract-revision cascade down the tree; stale results cannot land (C11).
- Heartbeat and streaming output prove liveness, not acceptance progress. Only new evidence against
  a stable criterion advances the no-progress breaker; changing tool, model or hypothesis does not.
- After unclean shutdown, non-final runs become `reconciling` until the adapter proves real state —
  never silently re-run chargeable work (04 §3).

#### 2.3 Organization router (C5) **[evidence-gated: needs R6 measurements]**

Inputs: task independence, shared-write overlap, verification risk, context size, runtime
capability, budget, deadline. Output: Direct → Delegated/parallel → Independent-verification →
Hierarchical — always the lightest structure expected to improve the outcome, with the choice and
reason recorded. Falls back to Direct when measured outcome-adjusted cost loses. The user can
always override.

#### 2.4 Communication rules **[decided]**

Members talk to deliver artifacts, request missing authority/information, declare
dependencies/blockers — never open-ended mutual review (C11). Normal progress must be event-derived,
pulled on demand and traceable to source events. `ProjectDigest` names the target projection; it is
not present in the current runtime.

#### 2.5 Model-facing projection **[decided; implementation gated by E13]**

The execution kernel is intentionally richer than the context shown to any one model call. Before
dispatch, one centralized projection selects the stable prompt prefix, task-tail context, tool
schemas and Skill/Source references that are both needed and currently authorized. Provider lanes
may translate schema syntax, but cannot maintain independent loadout policy. A Pi-light path is a
profile through this projection, not another kernel.

Static task profiles come first. Tool Search is considered only after catalog measurements prove
that static profiles cannot keep schemas narrow without harming recovery. Search/describe is not an
executor; the eventual call returns through the same kernel permission, approval, usage and evidence
path. The governed Action seam remains separate: projection controls visibility before a request,
while the Action seam governs the request after it exists.

### 3. The composition plane **[decided as design; lands R4→R5→R8]**

Capabilities compose through three mechanisms, in increasing formality:

1. **Artifact flow** — the connective tissue (D4). One exact artifact version fans out to many
   consumers (owner vision OV-004: generated image → web asset / video first frame / document illustration / review evidence), each
   consumption recording purpose + provenance. No byte copying between surfaces.
2. **Governed actions** — every module registers its operations on the shared seam (R4); agents
   call modules the same way humans do (OV-005: agents can invoke every module capability). A module
   that only has buttons is incomplete; a module tool that bypasses evidence is incomplete.
3. **Workflow DAG** — a repeatable chain, promoted explicitly from real work (see §4.5), stored as
   an immutable versioned definition per run; steps invoke the same governed actions and runtimes
   (E5, 04 §3). Finite, typed, no general programming in v1.

Module registration contract (E1/E2): a native module (video, design, deck, web, image) registers
**capabilities** (actions + artifact types it produces/consumes) and **views**; it owns its native
document schema; it never owns sessions, permissions, tasks, or a second timeline. Loadouts scope
which capabilities an agent sees per task — attention is a budget too.

#### 3.1 Work trajectory: one trace, many projections **[decided as design; fields freeze R4/R5]**

The target trajectory joins the existing Session/SessionEvent log with future governed
Action results, native Job records and ArtifactRef lineage. This unified projection is not
implemented. It must not become a new `trace.json`, and a
Component, MCP server or renderer may not keep a private history that the host cannot query. The
trajectory records semantic boundaries rather than making raw model tokens or screenshots the only
explanation of what happened.

Each consequential operation contributes a correlation record with this target shape:

```text
traceId · sessionId · workspaceId · componentId?
turnId? · stepId? · operationId · attemptId · parentOperationId?
callerKind · actionType · exact input ArtifactRef versions
Job id? · exact output ArtifactRef versions · status
evidence/recovery refs · canvas projection ids?
sourceEventSeqs[] · derivedEventSeqs[]
```

DeepSeek Harness provides the source-level pattern Fleet admits: append-only events with explicit
turn/step boundaries, tool-call parent/child edges, opaque producer sources, and query functions that
trace one event's replacement/derived descendants or a Session's parent/child lineage. Fleet keeps
those facts in the existing authorities and derives a `WorkTrace` projection for chat, canvas,
workbench and inspection; the projection is disposable and never becomes a second authority.

The projection uses stable node keys plus an anchor event/sequence, so it can append a live tail,
prepend older pages or replace a stale window without changing the source log. It exposes the folded
state (`current`, `shadowed`, `log-only`, `partial` or `interrupted`) and a read-only inspector for
inputs, outputs, raw operation data, source/derived links, schema/options, usage, timing and diffs.
Progress updates update the projection node; they do not create a second progress authority. A
Component-specific node definition may add a useful view, but unknown future event kinds remain
opaque and visible rather than being dropped.

Recovery is explicit. If a cold load finds an open turn, the persistence owner may append legal
interruption closers for an unstarted or unknown tool outcome and then close the step/turn; a live
open turn is not silently repaired. The original call and any replaced result remain addressable
through `sourceEventSeqs`, so the trace can distinguish a current output, a shadowed historical
output and an interrupted/unknown output.

The operation graph uses only a small set of immutable relationships:

| Relationship | Meaning | Mutable? |
|---|---|---|
| `input` | this operation consumed this exact ArtifactRef version | immutable fact |
| `derived-from` | an output was produced from exact input versions | immutable fact |
| `projects-to` | a native artifact/job/operation is shown by a canvas/workbench node | projection only |
| `retry-of` | same semantic operation and base, another attempt | immutable fact |
| `branch-of` | a revision starts from an earlier operation or version with changed intent/inputs | immutable fact |
| `recovery-of` | a recovery or reconciliation action addresses a failed/unknown attempt | immutable fact |

Canvas position, visual connectors and thumbnail similarity are never provenance. A Component emits
these records through the governed Action/Job/Artifact seams; it does not mint a second timeline.

##### Targeting and revision semantics

“Modify that step” is translated into an explicit target token: `operationId`, exact
`ArtifactRef(id, version)`, or a selected `canvasNodeId` resolved to one of those. A phrase such as
“this image” is accepted only when the current selection/context resolves to one exact version;
otherwise Fleet presents candidates or asks. Names, paths and thumbnails alone are not stable
identity.

The Agent-facing inspection path follows the same rule: a future `operation_trace`/`operation_read`
tool accepts an explicit target Session plus `operationId` or exact ArtifactRef and an expected
version/hash, authorizes Workspace scope first, and returns the bounded source/derived lineage. It
does not treat the current UI selection as authority, and it cannot inspect a different Workspace or
silently select “the latest” result.

Revision never edits an old result in place. The kernel creates a new branch/version from the chosen
base, records `branch-of` (or `retry-of` for an unchanged operation), preserves the old outputs, and
marks dependent descendants `stale`/`awaiting-recompute`. Recompute is an explicit action with its
own new Job and evidence, so the user can compare branches, keep the old result, or continue from
the new lineage head.

Replay also distinguishes **exact** (reuse a committed ArtifactRef without rerunning side effects)
from **re-execute** (rebuild the recorded operation manifest under current permission/runtime). The
latter needs a fresh attempt id, expected-base-version validation and confirmation when the model is
non-deterministic or chargeable.

##### Example: poster → vector text → clean background → composite

| Step | Actual record | Result the user can target later |
|---|---|---|
| 1. Generate poster | `operationId=o1`, Component `image`, Job `j1`, prompt/style inputs | `ArtifactRef poster@v1`, projected to canvas node `n1` |
| 2. Extract/layout text | `operationId=o2`, input `poster@v1`, OCR/style evidence, Component `design` | `ArtifactRef vector-text@v1`, node `n2`, `derived-from o1` |
| 3. Remove raster text | `operationId=o3`, input `poster@v1`, mask/negative prompt, Job `j2` | `ArtifactRef clean-background@v1`, node `n3`, `derived-from o1` |
| 4. Compose final | `operationId=o4`, inputs `clean-background@v1 + vector-text@v1` | `ArtifactRef poster-final@v1`, node `n4`, `derived-from o2,o3` |

If the user selects `o2` and asks for a different font, Fleet starts `o2b` from the same
`poster@v1`, leaves `vector-text@v1` and `poster-final@v1` intact, and marks only the dependent
composite stale. If the user selects `n1` and changes the image prompt, the new poster branch does
not silently replace the original; the system offers explicit recomputation of o2–o4 against the new
base. The chat, canvas and component panels all show the same ids and versions, so an Agent can
distinguish “change the text layout” from “regenerate the source image”.

### 4. Canvas orchestration **[design decided; lands R7, preview work follows the baseline exit]**

The canvas is Fleet's **production board**: people and Agents generate, edit and arrange images,
video, websites and decks in the same place. Native document/sequence owners keep domain data and
undo/save/export; the board hosts their editing affordances and shows exact inputs, outputs and
operation history. Session/Task relationships are supporting projections, not the first product to
build in place of that board. This section owns orchestration boundaries; SYS-05 owns its delivery.

#### 4.1 Node taxonomy (projections, each owned elsewhere)

| Card | Projects | Live content | Command affordances |
|---|---|---|---|
| **Agent/session card** | a Session | status, last exchange summary, cost, budget bar, permission prompts | open chat · send instruction · pause/cancel · delegate · adjust budget |
| **Task card** | a Task/contract | criteria met/unmet, owner, state | open · reassign · split (new brief) |
| **Artifact card** | an ArtifactRef exact version and its native editing owner | preview or focused editor, version, provenance count | edit on the board through the native owner · stage as input · promote version · export |
| **Evidence card** | a capture/quote/result | source, timestamp, session link | open source · attach to brief |
| **Job/placeholder card** | a running generation/export | progress, cost estimate | cancel · (on completion, becomes artifact card) |
| **Workflow node** | a step in a versioned DAG | step state, last run | run · open definition |
| **Group/region** | board arrangement and selection | title, selected objects; any linked runs remain explicit | arrange · select · stage references; run controls target named existing Sessions/Tasks |

#### 4.2 Edge taxonomy (E5's classes, made visual and behavioral)

| Edge | Meaning | Created by | Mutable? | Visual |
|---|---|---|---|---|
| spatial | "arranged together" | user drag | free | none (proximity/region) |
| reference | "I intend this as input/context" | user connects artifact→agent/task | user-editable | dashed |
| **input** | "this run actually consumed it" | kernel, at execution | immutable fact | solid |
| **derived-from** | provenance: output ← inputs | kernel, at production | immutable fact | solid, arrowed |
| delegation | parent→child relationship for a particular run | Session/Task owner | follows recorded relationship | distinct from artifact and workflow edges |
| workflow | executable step order | explicit promotion (§4.5) | versioned | bold, typed ports |

The non-negotiables hold: drawing/moving never executes anything; a visual connector is never
automatically an executable edge or a provenance fact; renderer state is never written by agents —
the canvas re-renders from authority events (03 §3).

#### 4.3 Orchestration gestures (the interaction design)

1. **Stage inputs by connection or drop.** Dragging an artifact/evidence card onto an Agent card —
   or drawing a reference edge — *stages* it: it appears in that agent's composer/brief as a
   pending reference. Nothing runs until the human (or a governed action) sends it. Staging is
   visible and removable.
2. **Delegate from context.** "Delegate" on an Agent/task card opens a TaskBrief prefilled from
   explicit selected references. A region may suggest candidates, but cannot set permission,
   execution scope, identity or budget. The brief remains visible and editable before sending.
3. **Run affordances, not run-by-arrangement.** Cards carry explicit run/pause/cancel/approve
   controls that route through governed actions with normal permission prompts rendered in place.
4. **Placeholder → job → result.** Launching generation/export drops a placeholder card immediately
   (with cost estimate when known); the kernel resolves it to an artifact card on completion, or a
   visible failed state — never a vanishing job (E8: saturation queues visibly).
5. **Delegation is traceable.** Parent/child edges show who requested each run and where its result
   returns. Any Session may delegate; no group has a captain or manager identity. Usage/budget
   totals follow the existing run relationship, never spatial membership. Budget halts expose the
   affected run and its permitted recovery actions (C3).
6. **Promote a chain to a workflow.** Select a connected chain of reference/input edges →
   “Promote to workflow” → Fleet derives a typed DAG draft (steps = the governed actions that actually ran,
   ports = artifact types), the user reviews, and it becomes a versioned workflow definition. This
   is the path from *did it once* to *repeatable* — history is never rewritten to pretend it was a
   workflow all along.
7. **Broken sources stay visible.** A missing artifact renders a broken-reference card; it never
   cascade-deletes downstream cards or history (04 §3).

#### 4.4 What the canvas must never become **[decided]**

The board owns arrangement, not a second copy of native document, sequence, Session or Task data.
It hosts domain editors, including the video timeline, without inventing a universal internal
document schema. Workflows run through the existing execution owners; permission prompts reuse
the same components and decisions as chat. Neither an agent organization chart nor a preview-only
graph satisfies the production-board requirement.

#### 4.5 Canvas technology **[DOM family committed; in-family choice at the E5a spike]**

Per Decision E5a: the **DOM-family rendering approach is committed** — Fleet cards are live React
components (native editing affordances, media previews, controls). The retained comparison samples
include TapNow, MiniMax Hub/Hilo and TRAEWork on **React Flow v12**
(owner-provided analyses), and Mayi Canvas on **fully custom DOM + `translate3d` + SVG bezier**
([`references/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md`](research/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md):
rich media/agent/3D nodes, >50-node perf mode, thumbnail/visibility workers, object pools — evidence
for a bounded comparison, not proof of Fleet's editing workload). **React Flow is the default first
implementation; custom DOM+SVG is the named in-family fallback** if the spike shows the library
fighting Fleet's card/edge model; GPU (Pixi/CanvasKit) may only ever be a *media layer* under the
DOM viewport. The E5a spike (runnable any time from R5; required before deep R7 investment) decides
within the family by named criteria: representative rich cards, concurrent agent updates, media
proxies, ≥500-node viewport culling, memory recovery in the real Electron app. Implementation
constraints either way: custom edge overlay for the §4.2 classes; visible-node virtualization +
thumbnail workers + object pools; iframe/webview previews stay out of the graph layer; resource
budgets per E8. tldraw remains behavior comparison only (license = owner checkpoint). The domain
model stays renderer-independent regardless (§4.1–4.2 are defined over authorities, not renderer
types).

#### 4.6 Interaction modes: Space vs Workflow **[decided — adopted from external review 2026-07-17]**

The six edge classes coexist in the data model, but their *creation interactions* are mutually
exclusive, so the canvas has two explicit edit modes (industrial precedent: Coze/FlowGram):

- **Space mode (default):** free arrangement. Drawing a connection creates only a `reference`
  (dashed intent) edge; ports are not typed; nothing validates or executes. Staging (§4.3 gesture
  1) lives here.
- **Workflow mode:** typed In/Out ports become visible; drawing a connection compiles a candidate
  `workflow` edge with port-type checking and cycle detection (Kahn) at draw time in the frontend
  **and again at definition submit in the kernel** — dual validation, never frontend-only.
  Promotion (§4.3 gesture 6) drops the user into this mode with the derived draft.
- Authority-owned edges (`input`, `derived-from`, `delegation`) are never drawable in either mode —
  they render as facts.
- The mode toggle changes **edge interaction semantics only**; it never hides or rewrites existing
  edges, and switching modes is not an action on the graph.

**Spatial context boundary (Stitch-pattern, constrained):** proximity/region may *suggest* staging
candidates when prefilling a brief (§4.3 gesture 2 may list "cards in this region"), but every
suggested item is shown, individually removable, and inert until explicitly sent. Physical
proximity **never** silently enters a prompt or records an `input` fact — auto-assembled ambient
context would violate E5 and the staging contract, and is rejected as a design direction.

### 5. Command-plane parity **[decided]**

Chat, Board, and canvas are peers over the same kernel: anything the canvas can command, chat can
command in words and Board can reflect in status — and vice versa. New orchestration capability
lands kernel-first (governed action), then surfaces render it. This is why the canvas can arrive at
R7 without being a prerequisite for orchestration itself (R6 delegation works from chat/Board
alone).

### 6. What is decided vs. what awaits evidence

| Item | State |
|---|---|
| Deterministic kernel / reasoning members split; envelopes; budgets-that-halt; communication rules | **decided** (C3/C5–C11) |
| One model-facing effective projection; Pi-light is a profile; projection remains separate from Action seam | **decided** (E13); implementation waits for R0 + TE1 baseline and a bounded slice |
| Run lifecycle state machine | **decided** as design; mechanized in R6 |
| Node/edge taxonomy; gesture set; never-execute-by-arrangement | **decided** as design; lands R7 (G6 preview work remains subject to the baseline exit) |
| Canvas rendering | **DOM family decided** (E5a); React Flow default vs custom DOM+SVG fallback chosen at the spike (runnable from R5); GPU only as media layer |
| Space/Workflow dual edit modes; dual Kahn validation | **decided** (§4.6); lands with R7/R8 |
| Organization router thresholds | **evidence-gated**: needs R6 direct-vs-delegated measurements |
| Workflow DAG schema | **at activation** (R8), derived from promoted real chains (D6 logic) |
| Memory/consolidation hooks (layered agent memory, D5) | **at activation** (R9) |

### 7. References consumed (how this design was grounded)

Kernel envelopes and lifecycle: `software/opencode` task lifecycle (parentID/resume/depth/deny
inheritance — candidate mechanisms pending admission-v2, with proposed gaps to verify including no criteria IDs, no reserved
paths, no team budget), `software/codex` agent-graph/mailbox patterns, `software/grok-build`
queue/handoff, `software/DeepSeek-Reasonix` plan/execute split. Canvas: `plugins/xyflow` (default
in-family implementation, admission completes at the spike), Mayi Canvas product reverse-analysis
([`references/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md`](research/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md)
— custom DOM+SVG proof, perf-mode/worker/object-pool constraints, and the local-HTTP agent bridge
with self-describing capabilities + whitelisted/batch actions that independently validates this
document's governed-action and C2 narrow-bridge design), TapNow/MiniMax/TRAEWork public-bundle
evidence (via
[`design-library/07-canvas-spatial-orchestration-VISION.md`](features/SYS-05-design-spatial.md#canvas-vision)),
`software/tldraw` (comparison only). Module/plugin composition: MiniMax Hub six-plugin stack
([`references/plugins/00-MINIMAX-HUB-PLUGIN-STACK.md`](research/plugins/00-MINIMAX-HUB-PLUGIN-STACK.md)
— iframe sandbox + postMessage RPC + self-describing SDK + placeholder→job→result + permanent-ID
transactional insert: the blueprint evidence for §3's module registration and E1/E2). Dual-mode
canvas and dual Kahn validation adopted from the owner-collected external review (2026-07-17).
Full admission states: [`references/REFERENCES.md`](REFERENCES.md).
