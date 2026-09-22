# 06 — Code Map

> Where the real code is. Use this to find the entry point, then **confirm with `rg` before
> editing** — the tree changes and these paths are orientation, not a contract. Implementation paths are relative to `app/` unless already prefixed with `app/`;
> `docs/`, `scripts/` and reference paths are relative to the repository root.
>
> **Current implementation checked 2026-09-21 after the v0.13.4 reset.** Current entry points
> below are separated from removed Fleet modules. Historical implementation remains at
> `snapshot/pre-rebuild-2026-09-21`; a path in that snapshot is not a current capability.

## Baseline facts

- **App root:** `app/` — a Bun monorepo; `app/package.json` is `0.13.4`.
- **Implementation reality:** the committed reset restored Craft **v0.13.4**. Compare current
  bytes with the rolling reference and declare every later delta; prior Fleet extensions are not
  implicitly restored.
- **Look pin:** `源码参考/software/craft-agents-oss-v0.10.5/` at tag `v0.10.5` — tokens and
  interaction style, not a product shell to restore.
- **Rolling reference:** `源码参考/software/craft-agents-oss/` at tag `v0.13.4`, under
  `/Volumes/AIGC/天工参考/源码参考/`. Later intake remains bounded source comparison.

## Remote connection

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

## Reference roots (do not mix their authority)

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

## Monorepo layout

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

## File size: a navigability constraint, not a style preference

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

## Spine primitives that already exist

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

## Desktop shell and navigation

| Concern | Start here |
|---|---|
| Global shell | `app/apps/electron/src/renderer/components/app-shell/AppShell.tsx` |
| Sidebar / navigation | `app/apps/electron/src/renderer/components/app-shell/LeftSidebar.tsx` |
| Session list | `app/apps/electron/src/renderer/components/app-shell/SessionList.tsx` |
| Main content routing | `app/apps/electron/src/renderer/components/app-shell/MainContentPanel.tsx` |
| Conversation surface | `app/apps/electron/src/renderer/components/app-shell/ChatDisplay.tsx` |
| Navigation state | `app/apps/electron/src/renderer/contexts/NavigationContext.tsx` |
| Inherited Board route | `app/apps/electron/src/shared/route-parser.ts`; `MainContentPanel.tsx` — Sessions navigator with `viewMode: board`, not the former Fleet navigator |

## Common change routes

- **Add an Agent session tool:** schema + description + handler + one `SESSION_TOOL_DEFS` entry;
  then trace mode-manager → PreToolUse → SessionManager approval and event adapters. The registry
  entry alone supplies neither permission nor evidence.
- **Converge a human and Agent action:** identify both existing adapters, then route them into one
  caller-aware invocation/policy/executor/evidence seam
  ([`specs/R4-action-seam.md`](specs/R4-action-seam.md)). UI does not simulate PreToolUse.
- **Feature behavior generally:** renderer → atom/hook → RPC → server handler → existing Craft
  store/service. Search all callers before touching a shared type.
- **Change prompt/tool visibility:** inventory the serialized prompt and schemas; follow E13 and
  `modules/suites/SYS-03-context-economy.md`; extend one effective projection before provider
  schema adaptation. Do not couple it to R4 or treat a provider lane as a loadout authority.

## Removed Fleet modules and surviving contracts

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
foundation remains `not implemented`; see [`specs/R18-right-workbench.md`](specs/R18-right-workbench.md).

## Localization

`packages/shared/src/i18n/registry.ts` registers seven inherited locales, including `zh-Hans`.
`renderer/main.tsx` restores browser language and synchronizes Electron; `main/index.ts` persists
`uiLanguage`; `AppearanceSettingsPage.tsx` exposes selection. These are v0.13.4 mechanisms, not
restored Fleet work. Fleet branding and service-label changes remain separate acceptance work.

## Craft-operated service boundaries (R2 scope)

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

## Verification commands

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
[`09-QUALITY.md`](09-QUALITY.md). Passing checks are evidence, never a capability status.

## Keeping this file honest

Update it only when an important entry point or authority actually moves. It is a map to the few
things that matter, kept short so it stays true.
