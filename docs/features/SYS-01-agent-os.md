# SYS-01 — Agent operating system and governance

**Rows:** CORE-01..11, EXEC-01..05, EXEC-07..08, EXEC-10..11, EXEC-13..14, ORCH-03..04, ORCH-06..08.
**Development order:** R0–R6 spine; R9/R14–R18 integration. **Owner:** foundation integration.
**Depends on:** current Craft v0.13.4 authorities, the v0.10.5 look comparison, and bounded
best-of admission against current callers. **Consumers:** every other suite.
**Authority:** Craft Session/Task/Permission remain current truth; SYS-01 integrates R4 Action and
R11 Job contracts only after real callers extract them. No parallel stores.

## Closed loop

End state: intent → prompt/profile → ActorRef → PermissionDecision → governed action → Session/Task
execution → RunReport/event evidence → optional Git/PR delivery receipt. This is delivered as
roadmap-ordered Craft extensions, never as one greenfield kernel rewrite.

## First proof

Use two real mutations (labels and the R3 deliverable). Add caller identity and an action envelope
without changing their stores. Prove allow, deny, approval, failure, restart and evidence. Do not
add prompt/profile, delegation or Git/PR work to this proof; those retain their TE1/R6/SYS-02 gates.

## Acceptance and references

Use `EXEC-01-A`, `EXEC-02-A` and R3/R4 specs for the first proof. TE1/R6/R14 release rows may consume
`EXEC-14-A`, `EXEC-04-A` and `EXEC-13-A` respectively, only under their own accepted specs.
Craft remains authority. Compare Pi for harness weight, Codex/OpenCode for bounded protocol and
Session patterns, and the current OpenHands Agent Canvas for host-capability discovery only.
The retired Python sandbox findings do not describe the current checkout. Hermes/OpenClaw are used only for the
owner-requested complex-environment comparison. Absorb mechanisms only after same-task and deletion tests.

## Stop conditions

Stop at a new authority, policy bypass, unbounded delegation, public Git side effect, or shared
contract change. Record the smallest contract revision and use the owner checkpoint.

## Retained execution and setup requirements

These constraints absorb the superseded terminal/action/team/settings/onboarding notes; they do
not create extra prerequisites for R4 or the host foundation.

- Preserve Craft Bash/background execution. A PTY requires a real unsupported interactive caller
  at R18; no mandatory node-pty, daemon or Fleet Bridge protocol is preselected. Record spawn,
  cancellation request, observed exit/interruption and bounded output separately. Hidden views do
  not kill work; restart never fabricates success.
- R6 extends existing child Sessions and TaskSpec/run logs. Inline assignment/result and authorized
  child transcript inspection must not copy transcripts, reveal inaccessible child metadata or
  invent percentages for open-ended work. Reconcile non-final runtime state before restart/retry;
  no TeamRun/AgentSeat/journal authority is restored from the old design.
- R4 owns action extraction. Validate identity/scope before access, structural and domain semantics
  before mutation, and stale version again at commit. Approval precedes leases. Duplicate operation
  identity reuses the recorded outcome; native commit with missing evidence enters reconciliation,
  never blind re-execution. Cancellation and undo are distinct, and partial outcomes stay explicit.
- One settings owner holds schema/default/scope/sensitivity and any restart requirement. Daily
  controls stay in-loop; permission/account/path/retention changes retain their real policy path.
  A setting is accepted only when persistence and the owning runtime consume the value.
- Workspace existence, Session existence, provider readiness and onboarding completion are separate
  facts. Missing providers still allow local setup. Optional steps can be skipped; failed writes
  cannot mark setup complete. Resetting a guide never deletes work or credentials. Templates are
  explicit provenance-bearing file operations and never silently install or enable capabilities.

## Execution contracts

These sections own the next step for the listed capability IDs. Read the
[common execution contract](../COMPONENT-GUIDELINES.md#executable-next-step-contract)
and the release/spec anchor in [capability register](../PROJECT-SPEC.md#capability-register). Gates do not open merely
because this packet has instructions. Planned regression targets below do not exist yet unless
implementation has added them; extend a matching existing behavioral test instead of duplicating it.

### Execution CORE-01

**App shell and runtime**

- **Next:** `IMPLEMENT` — R0; R0-C1/C3/C7.
- **Sources:** [`apps/electron/src/renderer/components/app-shell/AppShell.tsx`](../../app/apps/electron/src/renderer/components/app-shell/AppShell.tsx); [`apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx`](../../app/apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx); [`apps/electron/src/main/index.ts`](../../app/apps/electron/src/main/index.ts).
- **Deliver:** Inventory inherited routes and dirty paths; retain mounted Craft consumers, correct only agreed baseline deltas, then boot the production bundle in an isolated profile.
- **Data:** Navigation references existing Workspace/Session IDs. AppShell and PanelStackContainer remain the only shell/host; no resurrected Fleet renderer.
- **Failure:** Failed route/module load has a recoverable error and preserved Session. Roll back only the changed route; startup may not reset user configuration.
- **Proof:** CORE-01-A — Launch an empty profile and one existing-session fixture; open retained routes, close/reopen and prove content survives. No fatal startup or duplicate host. Planned regression/probe target relative to `app/`: `apps/electron/src/renderer/components/app-shell/__tests__/fleet-core-01.test.ts`. After adding the target, run from `app/`: `bun test apps/electron/src/renderer/components/app-shell/__tests__/fleet-core-01.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft rolling shell/runtime; v0.10.5 visual primitives. Cindy only for a concrete missing lifecycle mechanism. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CORE-02

**Project/Workspace boundary**

- **Next:** `IMPLEMENT` — R0 corrections under R1-A1..A9.
- **Sources:** [`packages/shared/src/workspaces/storage.ts`](../../app/packages/shared/src/workspaces/storage.ts); [`packages/shared/src/projects/storage.ts`](../../app/packages/shared/src/projects/storage.ts); [`packages/shared/src/config/storage.ts`](../../app/packages/shared/src/config/storage.ts).
- **Deliver:** Retain visible Workspaces and scoped Project memberships; implement the owner-approved single sidebar, separate Board, contextual right panel and shared Conversation create/select flow. Preserve IDs and compatibility reads; remove a duplicate entry only after its actions have a working home.
- **Data:** Project selection resolves the existing workspace identity/root. Active context, list filter and Session binding are different fields; changing a filter never changes execution scope.
- **Failure:** Canonicalize/symlink-check actual file access. Conflict or migration failure leaves original records readable; never merge same-named folders or rename live data automatically.
- **Proof:** CORE-02-A — Fixtures with equal names, different roots, a symlink escape and old nested-Project data: create/select/restart retains the right records; denied access reveals no foreign content. Planned regression/probe target relative to `app/`: `packages/shared/src/workspaces/__tests__/fleet-core-02.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/workspaces/__tests__/fleet-core-02.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft Workspace/Project callers first; Cindy context resolution and owner OV-008. UI screenshots do not authorize data-model imports. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CORE-03

**Session and chat**

- **Next:** `IMPLEMENT` — R0 preservation; R3/R4 extensions.
- **Sources:** [`packages/server-core/src/sessions/SessionManager.ts`](../../app/packages/server-core/src/sessions/SessionManager.ts); [`packages/shared/src/sessions/storage.ts`](../../app/packages/shared/src/sessions/storage.ts); [`apps/electron/src/renderer/components/app-shell/input/FreeFormInput.tsx`](../../app/apps/electron/src/renderer/components/app-shell/input/FreeFormInput.tsx).
- **Deliver:** Preserve stream, steering, queue, stop and restart on the same Session. R3 adds deliverable references through existing messages; later action attribution extends the same event path.
- **Data:** SessionManager owns lifecycle and JSONL/history; renderer projects ordered events with existing Session/message/tool-call IDs. A queued input is not a second task record.
- **Failure:** Late events from an old connection/turn cannot update another Session. Stop acknowledges cancellation separately from process exit; restart reconciles pending work.
- **Proof:** CORE-03-A — Stream two Sessions, queue/steer one, switch tabs, stop and restart; verify ordering, no lost accepted input, no cross-Session events and no duplicate terminal result. Planned regression/probe target relative to `app/`: `packages/server-core/src/sessions/__tests__/fleet-core-03.test.ts`. After adding the target, run from `app/`: `bun test packages/server-core/src/sessions/__tests__/fleet-core-03.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft SessionManager/provider adapters; AionCore command receipt versus observed event is mechanism evidence only. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CORE-04

**Structured tasks, scheduling and task-center projection**

- **Next:** `IMPLEMENT` — R4/R6 after their real callers; preserve R0 Tasks.
- **Sources:** [`packages/shared/src/tasks/storage.ts`](../../app/packages/shared/src/tasks/storage.ts); [`packages/server-core/src/tasks/TaskRunner.ts`](../../app/packages/server-core/src/tasks/TaskRunner.ts); [`packages/server-core/src/handlers/rpc/tasks.ts`](../../app/packages/server-core/src/handlers/rpc/tasks.ts).
- **Deliver:** Extend structured tasks only for work that needs them; render Board/task status from Session/Task records and route mutations through current task RPC.
- **Data:** Task identity, dependencies, node output and run state stay in Craft storage/TaskRunner. Ordinary conversations remain Session-backed without synthetic Tasks.
- **Failure:** Concurrent stale mutation fails; interrupted nodes reconcile before retry. Deleting a view never deletes work, and removing a projection leaves Tasks readable.
- **Proof:** CORE-04-A — Create a task with two dependent nodes, cancel/fail/restart and inspect Board/list projections; both resolve the same IDs and committed outputs. Planned regression/probe target relative to `app/`: `packages/shared/src/tasks/__tests__/fleet-core-04.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/tasks/__tests__/fleet-core-04.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft TaskRunner/storage; Multica task identity/trace comparison. Reject Dashi or any second issue/task database. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CORE-05

**Settings and preferences**

- **Next:** `IMPLEMENT` — R0 settings cleanup; R1/R2 criteria.
- **Sources:** [`apps/electron/src/shared/settings-registry.ts`](../../app/apps/electron/src/shared/settings-registry.ts); [`packages/shared/src/config/storage.ts`](../../app/packages/shared/src/config/storage.ts); [`packages/shared/src/credentials/backends/secure-storage.ts`](../../app/packages/shared/src/credentials/backends/secure-storage.ts).
- **Deliver:** Inventory each setting consumer and scope; converge duplicate controls into existing Settings, preserve defaults/overrides, and repair credential/profile isolation before UI regrouping.
- **Data:** Settings registry declares type/default/scope/sensitivity/restart need; config owns values and credential backend owns secrets. An account picker is not a second credential store.
- **Failure:** Invalid input/write failure preserves last good settings; unreadable credentials block overwrites and retain original bytes. Scope reset removes an override, never vendor defaults or credentials.
- **Proof:** CORE-05-A — Change a setting, prove the actual runtime consumes it, restart and reset-to-inherit; corrupt a disposable credential file and verify byte preservation and named recovery. Planned regression/probe target relative to `app/`: `apps/electron/src/shared/__tests__/fleet-core-05.test.ts`. After adding the target, run from `app/`: `bun test apps/electron/src/shared/__tests__/fleet-core-05.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft settings and secure storage; Cindy scoped overrides. Cockpit/cc-switch are bounded acquisition examples, not replacement settings homes. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CORE-06

**Search, filters and saved views**

- **Next:** `IMPLEMENT` — R0 existing views; R5 cross-domain search.
- **Sources:** [`apps/electron/src/renderer/components/app-shell/SessionList.tsx`](../../app/apps/electron/src/renderer/components/app-shell/SessionList.tsx); [`packages/shared/src/views/storage.ts`](../../app/packages/shared/src/views/storage.ts); [`packages/server-core/src/services/search.ts`](../../app/packages/server-core/src/services/search.ts).
- **Deliver:** Retain existing search/filter/saved-view behavior and merge redundant entry points. Cross-domain search starts at R5 and consumes INFO-06.
- **Data:** Saved views persist query/filter configuration and target IDs only. Session status is a manual label; live activity is derived.
- **Failure:** Missing target becomes unavailable; cancel stale searches and reject late results from old query/Workspace. Rollback leaves the source Sessions and view config readable.
- **Proof:** CORE-06-A — Save a filter, switch Workspace while search is running, reopen and remove a matching Session; no stale result leaks or duplicate content store. Planned regression/probe target relative to `app/`: `apps/electron/src/renderer/components/app-shell/__tests__/fleet-core-06.test.ts`. After adding the target, run from `app/`: `bun test apps/electron/src/renderer/components/app-shell/__tests__/fleet-core-06.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft SessionList/views and searchSessions; no imported taskboard. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CORE-07

**Onboarding and first-run**

- **Next:** `IMPLEMENT` — R0 with R2 independence.
- **Sources:** [`packages/server-core/src/handlers/rpc/onboarding.ts`](../../app/packages/server-core/src/handlers/rpc/onboarding.ts); [`packages/shared/src/workspaces/storage.ts`](../../app/packages/shared/src/workspaces/storage.ts); [`packages/server-core/src/handlers/rpc/llm-connections.ts`](../../app/packages/server-core/src/handlers/rpc/llm-connections.ts).
- **Deliver:** Make first run work with local Project setup before provider configuration; preserve explicit third-party login and skip paths, and remove mandatory operator-service dependencies.
- **Data:** Workspace existence, provider readiness and onboarding completion remain distinct existing facts. Completion is written only after the relevant persistent action succeeds.
- **Failure:** Offline/auth-denied/write-failed states have retry or skip when optional. Reset guide state without deleting files, Sessions or credentials.
- **Proof:** CORE-07-A — Network-blocked first run creates/selects a disposable folder; failed provider sign-in does not block local browsing; restart resumes at the truthful step. Planned regression/probe target relative to `app/`: `packages/server-core/src/handlers/rpc/__tests__/fleet-core-07.test.ts`. After adding the target, run from `app/`: `bun test packages/server-core/src/handlers/rpc/__tests__/fleet-core-07.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft onboarding is the first implementation source; follow R2 rather than importing another account system. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CORE-08

**Help, docs and support**

- **Next:** `IMPLEMENT` — R0 with R2-C4/C5/C6.
- **Sources:** [`packages/shared/src/docs/index.ts`](../../app/packages/shared/src/docs/index.ts); [`packages/shared/src/docs/doc-links.ts`](../../app/packages/shared/src/docs/doc-links.ts); [`packages/shared/src/prompts/system.ts`](../../app/packages/shared/src/prompts/system.ts).
- **Deliver:** Trace original bundled docs and hosted help/prompt consumers, then implement the owner-approved local guidance slice. The Fleet DocumentationOverlay and local resolver patches were withdrawn; preserve attribution and report unavailable tools honestly.
- **Data:** One document resolver maps topic to bundled path or explicit external URL. Prompt guidance and Help use the same product source; do not create a second docs cache.
- **Failure:** Missing/version-mismatched local docs produce a named rebuild/recovery path. Offline help must not silently fetch Craft-hosted material.
- **Proof:** CORE-08-A — Run with isolated config and blocked network; resolve help from both UI and prompt/tool path, verify correct profile paths and no required upstream request. Planned regression target relative to `app/`: `packages/shared/src/docs/__tests__/local-links.test.ts`. Run from `app/`: `bun test packages/shared/src/docs/__tests__/local-links.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft bundled docs resolver; hosted Craft docs are comparison evidence, not Fleet product authority. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CORE-09

**Updates, packaging and distribution**

- **Next:** `IMPLEMENT` — R0 with R2-C2; distribution later.
- **Sources:** [`apps/electron/src/main/auto-update.ts`](../../app/apps/electron/src/main/auto-update.ts); [`apps/electron/src/main/index.ts`](../../app/apps/electron/src/main/index.ts).
- **Deliver:** Trace the original automatic download and quit-install path and implement the owner-approved Fleet update boundary. No verified Fleet channel exists; the restored Craft updater is not already disabled. Test startup/manual/cached-payload/quit behavior through the real owning path.
- **Data:** One updater owns channel, version, downloaded artifact and install state. Dismissed notice is not cancellation or permission to install.
- **Failure:** Offline or invalid channel/signature cannot install. No pending downloaded package can install through the retired hooks; rollback must not re-enable Craft replacement.
- **Proof:** CORE-09-A — Packaged-path fixture covers launch, manual check, ignored version, downloaded payload and quit; assert no upstream download/install. Dev-only tests do not satisfy this. Planned regression target relative to `app/`: `apps/electron/src/main/__tests__/update-boundary.isolated.ts`. Run from `app/`: `bun test ./apps/electron/src/main/__tests__/update-boundary.isolated.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft auto-update and electron-builder configuration; no new release server is required to disable an unsafe channel. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution CORE-10

**Internationalization and identity**

- **Next:** `IMPLEMENT` — R0/R1 terminology and identity.
- **Sources:** [`packages/shared/src/i18n/registry.ts`](../../app/packages/shared/src/i18n/registry.ts); [`apps/electron/src/shared/settings-registry.ts`](../../app/apps/electron/src/shared/settings-registry.ts).
- **Deliver:** Use Project, Session-backed task creation, Component and Assistant consistently; change displayed labels through shared locale catalogs while preserving stored enum/record IDs.
- **Data:** Stable IDs remain language-independent. zh-Hans and en share keys and interpolation; translated text never becomes a lookup key.
- **Failure:** Missing translation uses the existing fallback. Migration never keys on translated names; reverting copy does not rename persisted entities.
- **Proof:** CORE-10-A — Run parity/coverage checks and switch locales with an existing Session/Project; routes, settings and IDs remain identical. Planned regression/probe target relative to `app/`: `packages/shared/src/i18n/__tests__/fleet-core-10.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/i18n/__tests__/fleet-core-10.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft locale registry/primitives; PRODUCT and glossary decide terminology. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution EXEC-01

**Permissions, approvals and safety**

- **Next:** `IMPLEMENT` — R0-C2 before new actions; the owner-authorized R1 Plan/permission composer slice extends this same owner.
- **Sources:** [`packages/shared/src/agent/core/pre-tool-use.ts`](../../app/packages/shared/src/agent/core/pre-tool-use.ts); [`packages/shared/src/agent/mode-manager.ts`](../../app/packages/shared/src/agent/mode-manager.ts); [`packages/server-core/src/services/privileged-execution-broker.ts`](../../app/packages/server-core/src/services/privileged-execution-broker.ts).
- **Deliver:** Trace real dispatch for every inherited effect, especially browser_tool and remote RPC. Classify operation effect before approval and enforce it at the existing broker/PreToolUse path. R1 extends this path with independent Plan and three action permissions across Session persistence and both adapters; no UI-only relabeling.
- **Data:** Existing caller, Workspace, target, permission mode and grant own decisions. A tool name or OS permission cannot imply authorization of all its operations.
- **Failure:** Deny/Ask/expired grant blocks dispatch with reason; late approval binds the original request only. Unknown effect fails closed; do not add a separate UI permission engine.
- **Proof:** EXEC-01-A — Read/write/send/download operations under inherited permissions plus R1-A7's Plan on/off × three-permission matrix, legacy read-only state, forged target and revoked remote grant; prove denied cases never reach dispatch and plan acceptance cannot widen permission. Planned regression/probe target relative to `app/`: `packages/shared/src/agent/core/__tests__/fleet-exec-01.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/agent/core/__tests__/fleet-exec-01.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft policy first; Codex/OpenCode explainable scoped rules and Orca typed effects are evidence, not imported policy owners. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution EXEC-02

**Actions and caller-aware action seam**

- **Next:** `IMPLEMENT` — R4 after two dual-caller mutations exist.
- **Sources:** [`packages/session-tools-core/src/handlers/set-session-labels.ts`](../../app/packages/session-tools-core/src/handlers/set-session-labels.ts); [`packages/server-core/src/handlers/rpc/sessions.ts`](../../app/packages/server-core/src/handlers/rpc/sessions.ts); [`packages/shared/src/agent/core/pre-tool-use.ts`](../../app/packages/shared/src/agent/core/pre-tool-use.ts); [`packages/server-core/src/sessions/SessionManager.ts`](../../app/packages/server-core/src/sessions/SessionManager.ts).
- **Deliver:** Execute R4 labels and R3 deliverable acceptance through one validator/executor; extract only the contract shared by those two completed paths.
- **Data:** ActionRequestMeta carries stable invocation identity and expected native revision. Native store commits state; Session evidence records caller, policy and result. No invocation database.
- **Failure:** Ask resumes the same identity. Commit/evidence ambiguity reconciles rather than reruns. Conditional restore refuses newer edits; partial/unknown outcomes cannot be completed.
- **Proof:** EXEC-02-A — R4-C1..C7 dual-caller, cross-Workspace denial, duplicate request, stale revision, write/evidence failure and restart tests; test both actions before calling the seam generic. Planned regression/probe target relative to `app/`: `packages/session-tools-core/src/handlers/__tests__/fleet-exec-02.test.ts`. After adding the target, run from `app/`: `bun test packages/session-tools-core/src/handlers/__tests__/fleet-exec-02.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft label RPC/Agent handler; Cindy caller/snapshot discipline. R4 owns exact contract; external action buses are not admitted. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution EXEC-03

**Terminal and local execution**

- **Next:** `PROVE` — R0 preserves Bash; R18 PTY only with a real interactive gap.
- **Sources:** [`packages/server-core/src/sessions/SessionManager.ts`](../../app/packages/server-core/src/sessions/SessionManager.ts); [`packages/server-core/src/tasks/TaskRunner.ts`](../../app/packages/server-core/src/tasks/TaskRunner.ts); [`packages/shared/src/agent/core/pre-tool-use.ts`](../../app/packages/shared/src/agent/core/pre-tool-use.ts).
- **Deliver:** Prove current foreground/background command execution first. For an unsupported interactive task compare extending the current process owner with one bounded PTY adapter; do not make a terminal daemon a baseline prerequisite.
- **Data:** Command input includes resolved executable, args, cwd, environment scope and Session. Output chunks, observed exit and cancellation belong to the current process/task owner; view holds a cursor only.
- **Failure:** Missing binary/cwd/permission is classified before spawn. Cancellation terminates owned resources; reconnect cannot fabricate continuity for an exited process.
- **Proof:** EXEC-03-A — Long output, Unicode, background completion, cancellation and app restart on a disposable command; PTY proof additionally tests resize, prompt input and cleanup before admission. Planned regression/probe target relative to `app/`: `scripts/probes/exec-03.ts`. After adding the target, run from `app/`: `bun run scripts/probes/exec-03.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft Bash/background path; Waku/ZCode CLI lifecycle as mechanism evidence. PTY library choice follows the measured gap and license checkpoint. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution EXEC-04

**Multi-agent delegation**

- **Next:** `IMPLEMENT` — R6 after R4/R5; no captain mode.
- **Sources:** [`packages/server-core/src/tasks/TaskRunner.ts`](../../app/packages/server-core/src/tasks/TaskRunner.ts); [`packages/server-core/src/sessions/SessionManager.ts`](../../app/packages/server-core/src/sessions/SessionManager.ts); [`packages/session-tools-core/src/tool-defs.ts`](../../app/packages/session-tools-core/src/tool-defs.ts).
- **Deliver:** Add TaskBrief/RunReport validation around existing child Session/Task dispatch; expose inline delegate status/result and authorized transcript inspection.
- **Data:** Brief identifies parent/child, objective, acceptance IDs, allowed paths/actions and input artifact versions. Report names outcome, outputs, evidence and unresolved work; parent remains responsible for acceptance.
- **Failure:** Child grants cannot exceed parent grants; cap depth/fan-out/resources explicitly per run. Parent stop cascades; orphan/restarted child reconciles without duplicate launch.
- **Proof:** EXEC-04-A — Two children with different scopes, denied escalation, invalid report, cancellation and restart; any Session can delegate, and results resolve to the existing child records. Planned regression/probe target relative to `app/`: `packages/server-core/src/tasks/__tests__/fleet-exec-04.test.ts`. After adding the target, run from `app/`: `bun test packages/server-core/src/tasks/__tests__/fleet-exec-04.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft child Sessions/TaskRunner; OpenCode inherited restrictions and Multica output trace, without their alternative stores. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution EXEC-05

**Runtime/provider adapters**

- **Next:** `PROVE` — R0 preserves lanes; R6 explicit CLI gap.
- **Sources:** [`packages/server-core/src/handlers/rpc/llm-connections.ts`](../../app/packages/server-core/src/handlers/rpc/llm-connections.ts); [`packages/shared/src/agent/backend/claude/event-adapter.ts`](../../app/packages/shared/src/agent/backend/claude/event-adapter.ts); [`packages/shared/src/agent/backend/pi/event-adapter.ts`](../../app/packages/shared/src/agent/backend/pi/event-adapter.ts).
- **Deliver:** Keep installed Claude/Pi lanes. For a requested CLI, resolve its installed binary/version and protocol handshake, compare native protocol with ACP only if supported, then implement one adapter.
- **Data:** Detection, user configuration, authenticated connection and runtime availability are separate facts. Persist resolved identity/capabilities under the existing connection; Session owns each run.
- **Failure:** Missing/unsupported protocol is unavailable. Reconnect requires capability/account validation; stderr is diagnostic, not a fake result. Disabling adapter releases its processes only.
- **Proof:** EXEC-05-A — Include a reused branch name in a fresh worktree, a matching historical PR head ancestor and shallow/unavailable ancestry; uncertainty never establishes ownership. Handshake, model/options discovery, one prompt/tool approval/cancel cycle and restart using a protocol fixture plus installed binary. Unsupported parameter must fail before dispatch. Planned regression/probe target relative to `app/`: `scripts/probes/exec-05.ts`. After adding the target, run from `app/`: `bun run scripts/probes/exec-05.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft SDK adapters; Codex app-server, OpenCode and Waku protocol distinctions. Never scrape private client caches or import a harness wholesale. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution EXEC-08

**Inherited execution isolation**

- **Next:** `IMPLEMENT` — R0/R2 inherited-isolation verification.
- **Sources:** [`packages/server-core/src/services/privileged-execution-broker.ts`](../../app/packages/server-core/src/services/privileged-execution-broker.ts); [`packages/shared/src/agent/core/pre-tool-use.ts`](../../app/packages/shared/src/agent/core/pre-tool-use.ts); [`packages/server-core/src/transport/server.ts`](../../app/packages/server-core/src/transport/server.ts).
- **Deliver:** Inventory actual filesystem/network/process restrictions per host and verify enforcement; harden or honestly disable unsafe inherited routes.
- **Data:** Host broker owns allowed root, process environment and operation authorization. Report actual platform capability; no separate VM/container lifecycle.
- **Failure:** Path escape, environment leak and unsupported enforcement fail visibly. Cancel/restart releases owned resources without touching unrelated processes.
- **Proof:** EXEC-08-A — Symlink/path traversal, unauthorized env/network target, missing platform support, cancel and crash fixtures; prove a denied operation does not execute. Planned regression/probe target relative to `app/`: `packages/server-core/src/services/__tests__/fleet-exec-08.test.ts`. After adding the target, run from `app/`: `bun test packages/server-core/src/services/__tests__/fleet-exec-08.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft privileged broker; OpenHands current canvas is not evidence of its former Python sandbox. OpenSandbox is excluded as a second platform. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution EXEC-10

**Automations and scheduler**

- **Next:** `IMPLEMENT` — R4 governed actions; keep existing R0 scheduler.
- **Sources:** [`packages/shared/src/automations/automation-system.ts`](../../app/packages/shared/src/automations/automation-system.ts); [`packages/shared/src/scheduler/scheduler-service.ts`](../../app/packages/shared/src/scheduler/scheduler-service.ts); [`packages/shared/src/automations/history-store.ts`](../../app/packages/shared/src/automations/history-store.ts).
- **Deliver:** Reuse current scheduler/history and route scheduled work through the same action/permission path; add only the trigger needed by the completed workflow.
- **Data:** Existing automation ID, schedule/timezone, trigger occurrence and run identity own scheduling. Session/Task owns execution; history references outcomes.
- **Failure:** Define misfire and overlap policy per automation; duplicate tick/restart cannot repeat an unknown external effect. Disabled/revoked automation stops queued dispatch.
- **Proof:** EXEC-10-A — Timezone/DST, repeated tick, overlap, restart, cancellation and revoked permission against a disposable local action; one occurrence creates at most one execution identity. Planned regression/probe target relative to `app/`: `packages/shared/src/automations/__tests__/fleet-exec-10.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/automations/__tests__/fleet-exec-10.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft automation-system, cron matcher and history store; no imported scheduler service. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution ORCH-06

**Event stream and activity history**

- **Next:** `IMPLEMENT` — R3/R4 event attribution; preserve R0 history.
- **Sources:** [`packages/shared/src/protocol/dto.ts`](../../app/packages/shared/src/protocol/dto.ts); [`packages/shared/src/sessions/storage.ts`](../../app/packages/shared/src/sessions/storage.ts); [`packages/server-core/src/sessions/SessionManager.ts`](../../app/packages/server-core/src/sessions/SessionManager.ts).
- **Deliver:** Add only the evidence required by the active operation to existing Session history and event projection; correlate live and durable outcomes.
- **Data:** Use existing event/message IDs plus operation/attempt and exact native target versions. High-frequency progress is replaceable; commit/error/approval boundaries are durable.
- **Failure:** Deduplicate replay and buffer bounded out-of-order progress without losing terminal results. Corrupt tail is preserved/reported; rebuilding UI cannot rewrite history.
- **Proof:** ORCH-06-A — Duplicate and out-of-order delivery, reconnect, commit-before-broadcast crash and replay produce one coherent history with no false completion. Planned regression/probe target relative to `app/`: `packages/shared/src/protocol/__tests__/fleet-orch-06.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/protocol/__tests__/fleet-orch-06.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft SessionEvent/history; AionCore receipt/event distinction. No global event database. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution ORCH-07

**Notifications, approvals and inbox**

- **Next:** `IMPLEMENT` — R4/R6 with real approval/notification callers.
- **Sources:** [`packages/shared/src/protocol/dto.ts`](../../app/packages/shared/src/protocol/dto.ts); [`packages/server-core/src/sessions/SessionManager.ts`](../../app/packages/server-core/src/sessions/SessionManager.ts); [`apps/electron/src/renderer/components/app-shell/AppShell.tsx`](../../app/apps/electron/src/renderer/components/app-shell/AppShell.tsx).
- **Deliver:** Project unresolved approvals and actionable failures in existing task surfaces; every item opens its real Session/permission target.
- **Data:** Notification/inbox item is derived from the owning permission or Session event. Read/dismiss UI state cannot settle an approval or delete evidence.
- **Failure:** Expired target becomes unavailable; approving a stale/replaced request is rejected. Reconnection cannot duplicate actionable items or replay decisions.
- **Proof:** ORCH-07-A — Two Sessions request approval; navigate, deny one, revoke the other, restart and inspect the inbox. Counts and actions agree with the native permission state. Planned regression/probe target relative to `app/`: `packages/shared/src/protocol/__tests__/fleet-orch-07.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/protocol/__tests__/fleet-orch-07.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft approval/timeline primitives; no independent inbox task store. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution ORCH-08

**Diagnostics, health and recovery**

- **Next:** `IMPLEMENT` — R0/R2 diagnostics; R18 component health later.
- **Sources:** [`apps/electron/src/main/index.ts`](../../app/apps/electron/src/main/index.ts); [`packages/server-core/src/sessions/SessionManager.ts`](../../app/packages/server-core/src/sessions/SessionManager.ts); [`packages/shared/src/resources/resource-bundle.ts`](../../app/packages/shared/src/resources/resource-bundle.ts).
- **Deliver:** Expose classified failures with the actual recovery operation for profile, runtime, browser and resource startup; extend to component activation only after the host exists.
- **Data:** Diagnostic has subsystem, safe code, scope, timestamp and available recovery action. Existing owner supplies health; logs redact secrets and full private payloads.
- **Failure:** Recovery is idempotent, scoped and never deletes unknown data. No available recovery means an explicit limitation rather than a dead button or endless auto-retry.
- **Proof:** ORCH-08-A — Missing resource, corrupt profile, unavailable provider and renderer/native-process crash fixtures; verify reason, real recovery and preserved work. Planned regression/probe target relative to `app/`: `apps/electron/src/main/__tests__/fleet-orch-08.test.ts`. After adding the target, run from `app/`: `bun test apps/electron/src/main/__tests__/fleet-orch-08.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft logger/bootstrap; DeepSeek Harness failed-activation cleanup only, without Cordis runtime. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

## Release contract — R4 action seam

> Spec status: `draft` — **not implemented as a generic seam.** Existing Craft actions remain
> authoritative until one real vertical action satisfies this entire contract.
> Trigger: at least two real dual-caller mutations exist (labels; R3's acceptance status/label).
> Owner acceptance date: —

### Outcome

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

### Authorities to reuse (never rebuild)

- `SESSION_TOOL_DEFS` + handlers — Agent schema and adapter.
- `PreToolUse`, mode-manager, SessionManager approval flow — Agent permission authority.
- Existing UI RPC command — human adapter.
- Owning Craft service/store — mutation and persistence authority.
- Existing Session messages/events — evidence transport and durable history.

Do not add a universal action registry, new permission engine, invocation database, audit database,
undo stack, prompt builder or loadout registry to implement this contract.

### Minimum contract (types land beside the first real implementation)

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

### Reality anchors and execution order

The first implementation must start at the existing human label path in
`app/apps/electron/src/renderer/components/app-shell/AppShell.tsx`, Agent adapter
`app/packages/session-tools-core/src/handlers/set-session-labels.ts`, policy gate
`app/packages/shared/src/agent/core/pre-tool-use.ts`, and owner mutation in
`app/packages/server-core/src/sessions/SessionManager.ts`. Before adding shared types, record both
caller traces and the persistence/evidence location. Then implement one vertical action, add
dual-caller, Ask/deny/conflict/restart fixtures, run the targeted tests from `app/`, and only then
extract the second action. `rg` output is an entry-point check, not acceptance evidence.

### Non-negotiable semantics

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

### Selecting the first reference action

Use the smallest existing Craft mutation that can prove the full lifecycle. Confirm in code first:
existing human and Agent callers; one Workspace-scoped target lookup; canonical validation for
every caller; permission correlation before execution; a mutation API reporting durable success;
a durable evidence location and visible error consumer; feasible restart/conflict tests.

`set_session_labels` remains a candidate, not an approved shortcut — its current path lacks shared
Workspace/domain validation, permission identity across Ask, atomic mutation/persistence, durable
attributed evidence, and human-visible structured failure. R3's acceptance status/label mutation is
the second candidate; choose whichever satisfies the checklist with less new surface.

### Acceptance criteria

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

### References consumed

Primarily Craft-internal extraction (the two real caller paths in
[`../ARCHITECTURE.md`](../ARCHITECTURE.md#code-map)). External mechanism evidence: `software/codex`
explainable command-rule shape (justification + positive/negative examples, feeds S3 when rules
become configurable); `software/opencode` permission-inheritance and doom-loop mechanisms
(EVIDENCE_ONLY — its gaps are documented in
[`../../源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](../../源码参考/meta/CAPABILITY-REFERENCE-MAP.md)
and must not weaken Fleet's contract semantics).

### Implementation restraint

Do not create shared protocol types first and hope later actions justify them. Make one vertical
action correct, then extract only the contract the completed paths actually share. **The second
action is the test that the abstraction is genuinely reusable** — migrate it before declaring the
seam generic.

### Pages touched

R4 wires the seam behind existing surfaces; it must not introduce an invocation store or a new
navigation home.

| Surface ID | Create/extend/wire | Adapter/data contract | Permission | States exercised | Owner visual checkpoint |
|---|---|---|---|---|---|
| P-18 | extend approval/policy explanation | `ActionOutcome` + existing permission RPC | PreToolUse/approval | loading/error/denied/recovery | approval prompt + reason |
| P-50 | extend attributed activity detail | SessionEvent evidence | session scope | empty/error/recovery | caller/target/policy/outcome |

### Doc updates on completion

Capability row "Human/Agent shared actions" → real status; `ARCHITECTURE.md` §1 note; roadmap;
this spec.
