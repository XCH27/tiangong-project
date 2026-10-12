# ZC-COMPLETE — existing product completion packets

1. **Scope/spec:** `docs/modules/zcode-product-completion.md`, D56/D59. Sustained existing-owner
   rectification and real acceptance; correct code/data retained.
2. **Wave:** ZC-COMPLETE/Q,C,P,D,W. W follows the exact selected native loop in the spec.
3. **Allowed paths, relative to ZCode:** independent worktrees/branches from `8c347cb02f4dc9e52c77f71084a9a82f21ef1a97`.
   Q/R: `apps/zcode-cli/packages/contracts/src/{interfaces/session-store.port.ts,interfaces/browser-control.port.ts,model/,workflow/,events/event-reducer.ts}`
   plus same-owner extracted leaves, contract tests; then existing telemetry/debug oversized files
   and same-owner leaves/tests. Preserve public signatures/schema/exports; Lead explicitly delegates
   declaration extraction only, no semantic contract changes. C/C: `packages/ui/src/store/savedWorkflowStore.ts`,
   same-owner helpers and focused workflow tests. P,D/S: bootstrap `src/app/plugin-facade.ts`,
   `src/create-app.ts` decision factory only, same-owner helpers and focused real App tests.
   D also includes Core `src/runtime/methods/turn-model.ts` accepted automatic selection and
   the original selection-completion dependency/port wiring only, plus focused actual App/Core
   tests. Shared public DTO/schema changes remain Lead-only: propose the exact consumed field
   first. Keep strict provider factories and existing auxiliary-registry completion policy.
   Lead approved existing Core `AgentRuntimeDeps.resolveEffectiveModelSelection` wiring in
   `runtime/agent-runtime.ts` and `runtime/internal.ts`; no new DTO/port/signature. C additionally
   owns narrow current saved-workflow ProjectGroup/GlobalGroup error/empty guards and renderer tests.
   Lead: root docs/recipe/hooks/release/shared registries/test lists/build; whiteboard seam design.
   W/Lead owns shared native JSON/protocol/service contracts, original Core tool registrations,
   new native document tool/command leaves, UI pane/draft/close wiring and tests. C additionally
   owns the concrete FS read/write optional boundary/expected-absence checks after its FS extraction,
   same adapter instance/lock/atomic publication and focused real filesystem tests. Root owns the
   public FileSystemPort additive fields. No simultaneous writes of original R/S facades.
4. **Forbidden:** `app/`, live profiles/data/credentials, other workers' paths, dependencies/lockfiles,
   policy waivers/baselines, schema/ABI changes without Lead, public effects/new authorities.
5. **Contracts:** current implemented ZCode exports/ports; original provider reasoning policy,
   plugin scopes/grants and workflow stores. Historical Craft 1.3.0 not imported. Extracted declarations
   preserve exact symbol surfaces and evaluation identity, not new interfaces.
6. **Consumed:** original App/service/protocol/registry/config readers, UI stores, existing test fixtures.
7. **Produced:** corrected current projection/factory and same-owner source boundaries. New DTO/owner
   requires exact consumer and Lead decision first.
8. **UI:** original locations; no added sidebar/shell. W remains original WhiteboardPane until selected.
9. **Permission/timeline:** existing grades/admission/evidence paths remain mandatory; extraction
   adds no grants. Tests use authored fixtures/local endpoint/model ports, no paid/provider effects.
10. **Validation:** real red counterexample → public consumer green → sibling/scope/failure/restart
    regression → target types/lint/architecture → Lead staged build/current renderer/full strict gates
    and source reconstruction. Coordinate CPU-heavy checks. No broad unrelated tests without reason.
11. **Handoff:** exact commits/paths, preserved contracts/owners, red/green logs, remaining gaps and
    proof limits. `wired but not visually checked` until Lead accepts exact path. After two stalled
    attempts report concrete blocker and continue independent assigned work, no self scope expansion.
12. **Board Cards:** Lead tracks Q,C,P,D here and in Wave Map; no board service. Pre-flight required.
    Workers are GPT-6.1 Sol. Separate worktrees under `/Volumes/AIGC/.fleet-tmp/fleet-completion/`.

Sustained work: a completed handoff does not end the project. Lead assigns the next dependency-ordered
slice after integration. Subsequent source partitions receive explicit disjoint path additions here.

## Q source-responsibility continuation — exact disjoint claims

After behavioral corrections, Lead delegates the exact remaining original oversized files below
plus same-owner leaves and focused regression tests. These are behavior-preserving extraction
only: no thresholds/waivers/minification, no new state owner/public ABI, no D57/D58 regressions.
Source recipes/test lists/shared schema stay Lead. Worker branches remain isolated.

### S/Core worker

- `apps/zcode-cli/packages/core/src/runtime/methods/compact.ts`
- `apps/zcode-cli/packages/core/src/runtime/methods/compact-active.ts`
- `apps/zcode-cli/packages/core/src/runtime/methods/session-fork.ts`
- `apps/zcode-cli/packages/core/src/runtime/agent-runtime.ts`
- `apps/zcode-cli/packages/core/src/permission/service.ts`
- `apps/zcode-cli/packages/core/src/agent/session-history-hydrator.ts`
- `apps/zcode-cli/packages/core/src/tool/handlers/media-generation.ts`
- `apps/zcode-cli/packages/core/src/runtime/internal-turn-methods.ts`
- `apps/zcode-cli/packages/core/src/runtime/methods/usage-observability.ts`
- `apps/zcode-cli/packages/core/src/runtime/methods/compact-persistence.ts`
- `apps/zcode-cli/packages/core/src/tool/handlers/read-session-context.ts`
- `apps/zcode-cli/packages/core/src/runtime/methods/model.ts`
- `apps/zcode-cli/packages/core/src/runtime/methods/turn.ts`
- `apps/zcode-cli/packages/core/src/tool/executor/call-runner.ts`
- `apps/zcode-cli/packages/core/src/tool/handlers/bash.ts`
- `apps/zcode-cli/packages/core/src/tool/handlers/read.ts`
- `apps/zcode-cli/packages/core/src/runtime/methods/turn-tools.ts`
- `apps/zcode-cli/packages/core/src/workflow/lifecycle.ts`
- `apps/zcode-cli/packages/core/src/tool/executor/background-tasks.ts`
- `apps/zcode-cli/packages/core/src/mcp/index.ts`
- `apps/zcode-cli/packages/core/src/runtime/helpers/attachment-media-resolver.ts`
- `apps/zcode-cli/packages/core/src/runtime/methods/steering.ts`
- `apps/zcode-cli/packages/core/src/runtime/methods/runtime-command-queue.ts`
- `apps/zcode-cli/packages/core/src/runtime/methods/resume.ts`
- `apps/zcode-cli/packages/core/src/runtime/methods/file-rewind.ts`
- `apps/zcode-cli/packages/core/src/runtime/methods/events.ts`
- `apps/zcode-cli/packages/core/src/runtime/methods/turn-model-step.ts`
- `apps/zcode-cli/packages/core/src/agent/message-history.ts`
- `apps/zcode-cli/packages/core/src/hooks/runner.ts`

### C/adapter worker

- `apps/zcode-cli/packages/adapters/src/model/failure-classifier.ts`
- `apps/zcode-cli/packages/adapters/src/model/runner-stream.ts`
- `apps/zcode-cli/packages/adapters/src/storage/index.ts`
- `apps/zcode-cli/packages/adapters/src/fs/index.ts`
- `apps/zcode-cli/packages/adapters/src/model/runner-diagnostics.ts`
- `apps/zcode-cli/packages/adapters/src/model/runner-debug.ts`
- `apps/zcode-cli/packages/adapters/src/plugins/zip-source.ts`
- `apps/zcode-cli/packages/adapters/src/storage/session-store/sqlite-session-store.ts`
- `apps/zcode-cli/packages/adapters/src/skills/index.ts`
- `apps/zcode-cli/packages/adapters/src/model/pi-subscription.ts`
- `apps/zcode-cli/packages/adapters/src/model/runner-generate.ts`
- `apps/zcode-cli/packages/adapters/src/storage/session-store/repositories/usage.ts`
- `apps/zcode-cli/packages/adapters/src/storage/session-store/migrations.ts`
- `apps/zcode-cli/packages/adapters/src/browser/index.ts`
- `apps/zcode-cli/packages/adapters/src/config/index.ts`
- `apps/zcode-cli/packages/adapters/src/config/file-config.adapter.ts`
- `apps/zcode-cli/packages/adapters/src/plugins/mcp.ts`
- `apps/zcode-cli/packages/adapters/src/plugins/index.ts`
- `apps/zcode-cli/packages/adapters/src/mcp/pool.ts`
- `apps/zcode-cli/packages/adapters/src/mcp/official-auth.ts`
- `apps/zcode-cli/packages/adapters/src/storage/workspace-hook-trust-store.ts`
- `apps/zcode-cli/packages/adapters/src/plugins/marketplace.ts`
- `apps/zcode-cli/packages/adapters/src/storage/session-target.ts`
- `apps/zcode-cli/packages/adapters/src/mcp/oauth-interactive.ts`
- `apps/zcode-cli/packages/adapters/src/mcp/index.ts`


### R/bootstrap and CLI continuation

After contracts/telemetry/debug integration, R starts a NEW worktree from the integrated candidate
including P/D/C fixes. Exact original files plus same-owner leaves/tests follow. Root owns new
whiteboard tool/schema files and defers shared server/App registration until the relevant R cluster
is integrated. No simultaneous edits of original facades. Public signatures/current semantics kept.

- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol/plugins.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol/interaction-broker.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol/session-mapper.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol/server.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol/subagent-session-query.ts`
- `apps/zcode-cli/packages/bootstrap/src/app/session-facade.ts`
- `apps/zcode-cli/packages/bootstrap/src/plugins.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol/v4-bridge.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol-v4/product-projection.ts`
- `apps/zcode-cli/packages/bootstrap/src/app/api-media-generation-port.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol-v4/conversation-topic-publisher.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol-v4/conversation-telemetry-facts.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol-v4/cold-event-merge.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol-v4/transcript-hydration.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol-v4/commands/handlers/goal-compact.ts`
- `apps/zcode-cli/packages/bootstrap/src/app/create-app.ts`
- `apps/zcode-cli/packages/bootstrap/src/app/workspace-hook-review-controller.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol-v4/event-normalizer.ts`
- `apps/zcode-cli/packages/bootstrap/src/app/types.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol-v4/command-inbox.ts`
- `apps/zcode-cli/packages/bootstrap/src/app/bundled-plugins.ts`
- `apps/zcode-cli/packages/bootstrap/src/zcode-protocol-v4/v4-gateway.ts`
- `apps/zcode-cli/packages/cli/src/run.ts`
- `apps/zcode-cli/packages/cli/src/prompt-command.ts`

## Q/Desktop — next disjoint continuation

Root found that the canonical type gate excluded Main, preload, renderer and scheduler. Preload
and renderer now use the actual exposed runtime bridge as their type source; required existing
public types are exported, and Main's include/rootDir respects existing shared/scheduler inputs.
Lead owns those declarations/configs, final canonical gate/test lists and new Native close wiring.
Do not weaken checks or cast unknown values through any/never to hide errors.

After current Q/Bootstrap is complete, R takes a NEW integrated worktree and exact current errors
in `packages/desktop/src/main/{applicationIcons.ts,chromeLocalStorageManager.ts,
cuaAccessibilitySettings.ts,desktopCrashCapture.ts,desktopPrintToPdf.ts,desktopRemoteSessions.ts,
desktopSaveFile.ts,desktopWindowLifecycle.ts,manifestUpdateProvider.ts,taskRealtimeBus.ts,
windowsChromeAppBoundKey.ts}`. Existing owner/IPC/frame/state semantics remain; resolve concrete
nullable/union/binary/port consumers and add meaningful failure guards only where needed.

After W UI is reviewable, S may take the browser consumer partition in another NEW integrated
worktree: `main/browserView/{browserGuestManager.ts,browserPlaywrightExecutor.ts,
browserPlaywrightLocatorExecutor.ts,browserScreenshotSurfaceContracts.ts,
electronBrowserWebmRecorder.ts}`. Source paths are relative to `packages/desktop/src/`.
Original Browser manager, Playwright/CDP and native recorder own state; no second browser/profile.
Any shared schema/permission or meaningful behavior change requires exact Lead acknowledgement.
Root issues the exact starting SHA before either continuation; unopened claims are read-only.

## W UI continuation — S worker

Lead delegates these existing UI paths after the coherent integrated native backend commit:
`packages/ui/src/WhiteboardPane.tsx`, `store/whiteboardStore.ts`,
`store/whiteboardNativeProjection.ts`, `lib/nativeWhiteboardControl.ts`, native whiteboard
UI hooks/leaves/tests under the same UI owner, the narrow whiteboard props/entry/close changes in
`app-shell/AnimatedSidePanePanel.tsx`, `app-shell/WorkspaceShellLayout.tsx`,
`hooks/useAppPanels.ts`, plus whiteboard English/Chinese locale entries. Use a NEW isolated
worktree from the Lead-issued SHA; no Desktop Main/preload/shared protocol/Backend edits.
The existing `app-shell/types.ts` may change only `handleOpenWhiteboard` to accept optional
`{boardId:string; title:string}` for validated saved-board discovery; no-argument creation stays.

## W backend cross-review — C worker

C continues from the integrated native backend in a NEW isolated worktree. Initial claims are
focused Core native-whiteboard/Host/permission/recovery tests and read-only production tracing.
Lead acknowledged an actual synchronous reverse-RPC settlement timer leak and additionally
delegates `bootstrap/src/zcode-protocol/server-client-requests.ts` plus synchronous response,
reject/disconnect/reannounce tests. Empty original `pending.requestKeys` is settlement evidence;
do not introduce an active-state clone, unref or forced test exit. Actual Host restart tests must
exit naturally. Further concrete fixes require Lead path confirmation before edits; UI/Desktop/
shared contracts remain outside C claims. Preserve real profiles and original state authorities.

The original ConfirmDialogStore/Host may add optional `dismissLabel` for three visible actions;
only native-draft close supplies it. Save=confirm, Discard=cancel, Cancel/X/Esc=dismiss and keeps
the document open. Other confirmation behavior stays unchanged. This is the existing dialog
owner, not a second dialog state machine. Root owns the desktop close handshake. S supplies one
renderer draft-close controller invoked by that handshake and by original pane close callbacks.

Use the existing native service and original V4 workspace connection/Session creation. No model
turn/title generation to save/read/list. Retain correct file data and RAM drafts until actual ACK;
reuse pending request/stable mutation identities, preserve later drawing, and fence service/Host,
workspace/remoteSession/board A→B→A responses. Activate the original remote service at action time;
do not dispatch through a stale keep-warm proxy after reconnect. Flush any active pen gesture
before saving/closing; an incoming file read cannot erase an active gesture. Failed/denied/Stopped/
oversized/corrupt saves keep the draft with export/retry. Exact uncertain retries reconcile through
the original native mutation. Expose saved-board discovery/read, saved/unsaved/conflict states,
explicit reconciliation of both versions, native JSON/PNG export and existing add-to-chat. Agent
file changes refresh the same document through bounded reads. No localStorage/DB/session/file
writer authority is added.

Native Save/Discard/Cancel is required for close-one/others/all and app close, including dirty
boards hidden by workspace or task navigation. Captured close generations cannot close a new
owner after an async save. Renderer publishes only draft-close facts/callbacks to Root's handshake;
no arbitrary Main command, directory or permission override. Show actual approval on the owning
original Session using existing navigation/interaction owners, even from another product surface.
Standalone whiteboard actions may establish an ordinary original empty V4 Session through the
existing owner; no separate board-Session store or prewarm takeover.

Headless renderer fixtures with `show:false`, authored data and isolated profile/workspace may
execute locally against the actual styled pane/confirmation host. Root alone controls visible/
native GUI through CUA and accepts final real Host/file/close/restart evidence. Run appropriate
source/service/draft race tests, types/lint/architecture and real renderer cases; no live provider
effects, credentials or data changes. Continue until this loop is reviewable, then Lead integrates
and assigns the next exposed product gap. No capability promotion by a worker.
