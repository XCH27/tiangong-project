# 06 — Code Map

> Where the real code is. Use this to find the entry point, then **confirm with `rg` before editing** —
> the tree changes and these paths are orientation, not a contract. All paths are under `app/`.

## Baseline facts

- **App root:** `app/` — a Bun monorepo. `app/package.json` = `0.11.1` (upstream Craft v0.11 line).
- **Historical replacement commit:** `48bbed08` (Craft v0.11 base plus speculative Fleet staging).
- **Baseline commits (2026-07-11, branch `work/fresh-base-spine`):** `616eff59e` v0.11.1 alignment
  (incl. the E9 thinking-level saturation fix; `typecheck:shared` green), `7aff1c7da` protocol-staging
  removal, plus the document-reset commit. **Machine verification still pending:** `bun run
  validate:dev` + an Electron smoke check must pass on the development machine before this baseline is
  recorded as verified (see `04-MILESTONES.md`).
- **Preserved reference (do not merge/copy wholesale):** `源码参考/software/craft-agents-oss/`
  (Craft v0.10.5), behavior/design reference only.

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
