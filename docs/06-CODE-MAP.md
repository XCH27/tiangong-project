# 06 — Code Map

> Where the real code is. Use this to find the entry point, then **confirm with `rg` before editing** —
> the tree changes and these paths are orientation, not a contract. All paths are under `app/`.

## Baseline facts

- **App root:** `app/` — a Bun monorepo. `app/package.json` = `0.11.1` (upstream Craft v0.11 line).
- **Historical replacement commit:** `48bbed08` (Craft v0.11 base plus speculative Fleet staging).
- **Baseline commits (2026-07-11, branch `work/fresh-base-spine`):** `616eff59e` v0.11.1 alignment
  (incl. the E9 thinking-level saturation fix; `typecheck:shared` green), `7aff1c7da` protocol-staging
  removal, the document-reset commit, and `c7fd6dea0` restoring the upstream-required
  `tsconfig.base.json` and updating the source reference. **Verified on the development machine:**
  `bun run validate:dev` passed; an Electron model-backed turn, Settings/version check, and
  restart-persistence check were observed.
- **Preserved reference (do not merge/copy wholesale):** `源码参考/software/craft-agents-oss/`
  at Craft tag `v0.11.1` / commit `4289b160`; behavior/design reference only.
- **Last application-source delta:** `cdc387e1d`. Commits after it through `e46ee07e2` remove an
  unrelated agent toolkit or change audits/documentation/reference material; they do not add a Fleet
  product capability.
- **Pre-redesign recovery point:** `refs/snapshots/pre-final-ui-20260712-191011` (`20e32a2f8`) and
  `/Users/lullwen/Documents/天工-snapshots/pre-final-ui-20260712-191011.bundle`.

## Reference roots (do not mix their authority)

| Reference | Location | Use |
|---|---|---|
| Fleet product authority | `docs/00-START-HERE.md` through `docs/08-CRAFT-CAPABILITY-MAP.md` | Current decisions, boundaries, milestone and code entry points. |
| Pinned upstream implementation | `源码参考/software/craft-agents-oss/` | Exact Craft v0.11.1 behavior and versioned documentation. Compare files; never merge the tree wholesale. |
| Current official hosted docs mirror | `源码参考/documentation/craft-agents-official/online-current/` | Later/current upstream behavior, deployment and configuration clues. It may not match v0.11.1. |
| Official mirror index and provenance | `源码参考/documentation/craft-agents-official/README.md`, `SYNC-MANIFEST.txt`, `source-v0.11.1-document-files.txt` | Locate source docs, verify downloaded bytes, and see known Craft-operated service dependencies. |
| Historical Fleet design material | `docs/design-library/` | Ideas and owner intent only; extract a small current delta after checking code. |
| Unlicensed UI reference kits | `源码参考/ui-kits/` | Study hierarchy/state coverage only; do not copy assets or code into production. |

Refresh the hosted mirror with `scripts/sync-craft-official-docs.sh`, then review its diff. A mirror
refresh is upstream intake, not a Fleet feature and not permission to change application behavior.

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
| Web UI / viewer | `app/apps/webui/`, `app/apps/viewer/` |

## The spine primitives that already exist (Milestone 1 builds on these)

| Concern | Real code | Note |
|---|---|---|
| Session-scoped Agent tool registry | `packages/session-tools-core/src/tool-defs.ts` (`SESSION_TOOL_DEFS`) | Source of truth for session Agent tool schemas/handlers/metadata; **not** a complete cross-caller Action Registry. |
| Tool handlers | `packages/session-tools-core/src/handlers/` | One handler per tool. |
| Shared tool context | `packages/session-tools-core/src/context.ts` (`SessionToolContext`) | Exists so handlers run for **both** Claude and Codex. |
| Tool result type | `packages/session-tools-core/src/types.ts` (`ToolResult`) | `{ content, structuredContent?, isError? }`. |
| Agent permission policy | `packages/shared/src/agent/mode-manager.ts`, `core/pre-tool-use.ts`, `core/permission-manager.ts`, `SessionManager` | Policy and enforcement are distributed across these existing seams; `PermissionManager` alone is not the global gate. |
| Permission modes | `packages/shared/src/agent/mode-manager.ts`, `mode-types.ts` | Canonical names explore / ask / execute map to the **stored** enum `safe` / `ask` / `allow-all` (see `PERMISSION_MODE_TO_CANONICAL`). `rg` for the stored values, not the aliases, when tracing `shouldAllowToolInMode`. |
| **Permission enforcement** | `packages/shared/src/agent/core/pre-tool-use.ts`, `SessionManager` | The real gate + approval prompt. The SDK runs `bypassPermissions`; the PreToolUse hook decides allow/deny and emits `permission_request`. `PermissionManager.evaluateToolCall` exists but **defaults to allow** for unrecognized tools — it is not the gate on its own. |
| Built-in tools (not the registry) | `pre-tool-use.ts` (`BUILT_IN_TOOLS`, `FILE_PATH_TOOLS`); `claude-agent.ts` (`preset: 'claude_code'`) | The agent's `Bash`/`Read`/`Write`/`Edit` are SDK built-ins, **separate** from `SESSION_TOOL_DEFS`. File mutations currently go through these, not the registry. |
| **Timeline events** | `packages/shared/src/protocol/dto.ts` (`SessionEvent` union) | Has `tool_start`, `tool_result`, `permission_request`, `permission_mode_changed`. |
| Event broadcast channels | `packages/shared/src/protocol/events.ts`, `channels.ts` (`RPC_CHANNELS.sessions.EVENT`) | Server→client push. |
| Session authority | `packages/server-core/src/sessions/`, `packages/shared/src/sessions/` | The one session store. |
| Agent label action | `packages/session-tools-core/src/handlers/set-session-labels.ts`; `session-self-management-bindings.ts` | Existing Agent adapter reaches SessionManager through callbacks. |
| Human label action | renderer `AppShell.tsx` → `sessionCommand(setLabels)` → `handlers/rpc/sessions.ts` | Existing UI path reaches the same state authority but not the Agent PreToolUse lifecycle. M1 converges them at a caller-aware invocation seam. |

## Desktop shell and navigation (for the human UI path)

| Concern | Start here |
|---|---|
| Global shell | `apps/electron/src/renderer/components/app-shell/AppShell.tsx` |
| Sidebar / navigation | `apps/electron/src/renderer/components/app-shell/LeftSidebar.tsx` |
| Session list | `apps/electron/src/renderer/components/app-shell/SessionList.tsx` |
| Main content routing | `apps/electron/src/renderer/components/app-shell/MainContentPanel.tsx` |
| Conversation surface | `apps/electron/src/renderer/components/app-shell/ChatDisplay.tsx` |
| Navigation state | `apps/electron/src/renderer/contexts/NavigationContext.tsx` |

> Milestone 1 reuses the existing label controls. It does not add a file surface, panel, or route.

## Common change routes

- **Add an Agent session tool:** define schema + description + handler + one `SESSION_TOOL_DEFS` entry;
  then trace mode-manager → PreToolUse → SessionManager approval and event adapters. Do not assume the
  registry entry alone supplies permission or evidence.
- **Converge a human and Agent action:** identify both existing adapters, then route them into one
  caller-aware invocation/policy/executor/evidence seam. UI does not simulate PreToolUse.
- **Feature behavior generally:** renderer → atom/hook → RPC → server handler → existing Craft
  store/service. Search all callers before touching a shared type.

## Craft-operated service boundaries

These are inherited entry points, not all Fleet-approved capabilities. Decision P8 requires each to
be handled as its own coherent slice; do not remove a URL without tracing UI → handler → persistence →
recovery and do not replace several services in one patch.

| Concern | Current code entry | Fleet direction |
|---|---|---|
| Session sharing/viewer upload | `packages/shared/src/branding.ts`; `packages/server-core/src/sessions/SessionManager.ts`; `apps/electron/src/renderer/pages/ChatPage.tsx`; `apps/viewer/` | **EXTEND/REPLACE:** local export plus optional configurable/self-hosted viewer; never silently upload as a Fleet-native path. |
| Upstream version awareness | `packages/shared/src/version/manifest.ts`; official tags/release notes/docs | **REUSE:** detect and review upstream Craft releases for selective porting. |
| Fleet binary updater | `apps/electron/src/main/auto-update.ts`; `apps/electron/electron-builder.yml` | **EXTEND/REPLACE:** Fleet-controlled or user-configured signed channel; disable install honestly until it exists. Never install Craft binaries over Fleet. |
| Help and Docs MCP | `packages/shared/src/docs/`; `packages/session-mcp-server/src/index.ts`; Electron menu/top-bar help links | **EXTEND:** bundled/local mirror first; an online Craft link may remain only when visibly external. |
| WebUI OAuth relay | `packages/shared/src/auth/oauth-relay.ts`; `packages/server-core/src/webui/` | **EXTEND:** configurable self-hosted relay for remote WebUI; preserve the existing desktop local callback. |
| Slack OAuth relay | `packages/shared/src/auth/slack-oauth.ts` | **EXTEND:** user-configured app/callback or explicitly unavailable without configuration. |
| Craft sources/connectors | `packages/shared/src/sources/`; `packages/shared/src/mcp/`; builtin source definitions | **REUSE as optional connector:** never required for startup or core local data. |
| Branding/support/co-author text | `packages/shared/src/branding.ts`; package metadata; `packages/shared/src/prompts/system.ts`; Electron menus | **REPLACE deliberately:** rename with compatibility and license/trademark review, not global search-and-replace. |

## Verification commands

| What | Command (from `app/`) |
|---|---|
| Typecheck shared | `bun run typecheck:shared` |
| Typecheck electron | `bun run typecheck:electron` |
| Typecheck everything | `bun run typecheck:all` |
| Targeted shared tests | `bun run test:shared:all` |
| Launch real app (dev) | `bun run electron:dev` |
| Build + start | `bun run electron:start` |

**Real-behavior check is mandatory for user-visible work.** A passing typecheck is evidence, never a
capability status (see `07-AGENT-RULES.md`).

## Keeping this file honest

Update it only when an important entry point or authority actually moves. Do not turn it into a full
file listing — it is a map to the few things that matter, kept short so it stays true.
