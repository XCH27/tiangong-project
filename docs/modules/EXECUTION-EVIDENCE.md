# Module execution evidence register

This is the reality check behind [`PACKET-INDEX.md`](PACKET-INDEX.md). All 68 registry rows are
covered by the grouped entries below (the group ranges are exhaustive); a registry row is not
executable merely because it has a design sentence or an `-A` acceptance ID. Each row must point
to an existing source path and a runnable verification command, or explicitly state that no
implementation exists. Paths are repository-relative; commands run from `app/`.

An existing path proves only that some code exists; it never promotes a capability to `usable`.
An absence is recorded deliberately so a future agent cannot mistake a design placeholder for a
wired feature.

## Actual implementation anchors

| ID group | Existing entry points | Missing / not implemented boundary | Evidence command |
|---|---|---|---|
| CORE-01..05 | `apps/electron/src/renderer/components/app-shell/`; `packages/server-core/src/sessions/`; `packages/server-core/src/tasks/TaskRunner.ts`; `apps/electron/src/renderer/pages/settings/`; Workspace RPC `packages/server-core/src/handlers/rpc/workspace.ts` | Fleet-specific Project extensions and visual acceptance are not separately proven | `bun run typecheck:electron`; `bun test packages/server-core/src/tasks/TaskRunner.test.ts` |
| CORE-06 | `packages/server-core/src/services/search.ts`; `packages/server-core/src/handlers/rpc/sessions.ts` | saved-view authority and visual route need proof | `rg -n "search|saved.?view" packages/server-core/src apps/electron/src/renderer` |
| CORE-07..10 | onboarding handler `packages/server-core/src/handlers/rpc/onboarding.ts`; i18n `packages/shared/src/i18n/`; labels `packages/shared/src/labels/`; updater `apps/electron/src/main/auto-update.ts` | Fleet update channel and owner visual checks are not proven | `bun run lint:i18n:parity && bun run lint:i18n:sorted && bun run lint:i18n:coverage && bun run lint:i18n:strings`; `bun run typecheck:electron` |
| CORE-11 | shell components under `apps/electron/src/renderer/components/app-shell/` | Fleet Workbench layout authority is not implemented | `rg -n "dock|split|resize|layout" apps/electron/src/renderer/components` |
| INFO-01 | file tools under `packages/session-tools-core/src/handlers/`; Workspace/project storage under `packages/shared/src/workspaces/` and `packages/shared/src/projects/` | — | `rg -n "FILE_PATH_TOOLS|workspace.*root|contain" packages/session-tools-core packages/shared` |
| INFO-02,07,08 | — | no ArtifactRef, immutable citation, or migration authority found | `rg -n "ArtifactRef|provenance|citation|migration" packages apps` (absence is expected) |
| INFO-03 | browser baseline `apps/electron/src/main/browser-pane-manager.ts`; `packages/shared/src/agent/browser-tools.ts` | evidence capture/ArtifactRef module is absent | `bun test apps/electron/src/main/__tests__/browser-pane-manager.test.ts` |
| INFO-04,05,06 | sources `packages/shared/src/sources/`; TipTap `packages/ui/src/components/markdown/TiptapMarkdownEditor.tsx`; search service above | complete provenance and visual acceptance are not proven | `rg -n "source|ingest|TiptapMarkdownEditor|search" packages/shared packages/ui` |
| EXEC-01,03 | PreToolUse/mode manager `packages/shared/src/agent/core/pre-tool-use.ts`; handlers `packages/session-tools-core/src/handlers/`; SessionManager | — for Craft baseline; PTY extension remains absent | `bun test packages/shared/src/agent/__tests__` |
| EXEC-02 | Agent label handler `packages/session-tools-core/src/handlers/set-session-labels.ts`; human path in `apps/electron/src/renderer/components/app-shell/AppShell.tsx` | no shared caller-aware executor/validator/evidence seam | `rg -n "setSessionLabels|set-session-labels" apps packages` |
| EXEC-04,06,07,09,12 | — | child runs, adaptive router, worktree, remote execution and Fleet grants absent | `rg -n "RunReport|worktree|remote.*execution|invite|revoke" packages apps` |
| EXEC-08 | bounded script sandbox `packages/session-tools-core/src/handlers/script-sandbox.ts`; runtime isolation `packages/session-tools-core/src/runtime/filesystem-isolation.ts`, `network-isolation.ts`, `sandbox-env.ts` | Fleet-wide executor/profile UI, resource accounting, and container/VM lifecycle remain gated; this path is not a complete OS sandbox | `bun test packages/session-tools-core/src/handlers/script-sandbox.test.ts packages/session-tools-core/src/runtime/filesystem-isolation.test.ts packages/session-tools-core/src/runtime/sandbox-env.test.ts` |
| EXEC-05 | provider RPC `packages/server-core/src/handlers/rpc/llm-connections.ts` | no capability negotiation contract | `rg -n "capabilit|unsupported" packages/server-core/src packages/shared/src` |
| EXEC-13,14 | existing prompt assembly in `packages/shared/src/prompts/system.ts`, `agent/core/prompt-builder.ts` and provider agents | no Fleet Git/PR adapter or centralized effective prompt/tool profile authority; existing full/mini prompt paths are not E13 implementation | `rg -n "pull.?request|git diff|system prompt|prompt profile|agent identity|getSessionToolDefs" packages apps` |
| EXEC-10,11 | automations `packages/server-core/src/handlers/rpc/automations.ts`; gateway `packages/messaging-gateway/src/` | governed action integration and visual delivery proof absent | `bun test packages/messaging-gateway/src` |
| INTEL-01..05,07 | Craft compaction/large-response paths, rtk rewrite, `UsageTracker`, TE1 `cache-economy.ts` accounting utility | centralized effective projection, visible TE1 session summary, profile benchmark, routing, reviewed memory and evaluator remain absent; do not describe all token/cache work as absent | `rg -n "compaction|rtk-rewrite|UsageTracker|cache-economy|experience|verifier|ContextPack|ContextSegment" packages apps` |
| INTEL-06 | skill/source UI and manifests in `apps/electron/src/renderer/pages/` and `packages/shared/src/` | install/loadout/runtime separation absent | `rg -n "skill|loadout|manifest" apps/electron/src packages/shared/src` |
| CREATE-01..16 | — (no native canvas, sequence, media, design, deck, web-artifact, storyboard, scene, panorama, shot-grid, long-form or export authority) | all creative modules remain `not implemented` | `rg -n "ReactFlow|tldraw|ffmpeg|sequence|caption|Penpot|pptx|storyboard|scene|panorama|relight|shot.?grid|narrative|render.*job" apps/electron/src packages` |
| ORCH-01 | —; `app/scripts/test-workflow-local.sh` is a helper only | no typed workflow-definition store | `rg -n "workflow" packages apps` |
| ORCH-02,06 | Craft `packages/server-core/src/tasks/TaskRunner.ts`; SessionEvent `packages/shared/src/protocol/dto.ts` | no Fleet workflow run store; existing timeline only | `bun test packages/server-core/src/tasks/TaskRunner.test.ts`; `rg -n "SessionEvent|tool_result" packages/shared/src` |
| ORCH-03,04 | tools `packages/session-tools-core/src/tool-defs.ts`; MCP `packages/session-mcp-server/src/` | unified Fleet action registry/loadout permissions absent | `rg -n "SESSION_TOOL_DEFS|MCP|manifest" packages/session-tools-core packages/session-mcp-server` |
| ORCH-05,07,08,09 | — | Job queue, inbox, diagnostics and telemetry authorities absent | `rg -n "Job queue|notification|diagnostic|telemetry|redact" packages apps` |
| ORCH-10..12 | — | Skill, plugin and MCP catalogs, package manifests, trust verification, staged install/update/rollback, per-tool grants and marketplace UI absent | `rg -n "MarketplacePackage|InstallReceipt|UpdatePlan|signature|catalog|registry" packages apps` (absence is expected) |

## Acceptance rule

Before moving a row out of `BREADTH_ONLY` in [`PACKET-INDEX.md`](PACKET-INDEX.md), its packet must
replace the search-only check with exact symbols, a fixture, a command that fails when behavior
regresses, and rollback scope. The generic `-A` entries in [`ACCEPTANCE-INDEX.md`](ACCEPTANCE-INDEX.md)
are minimum gates, not evidence.
