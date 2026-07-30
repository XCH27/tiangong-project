# 06 — Code Map

> Where the real code is. Use this to find the entry point, then **confirm with `rg` before
> editing** — the tree changes and these paths are orientation, not a contract. All paths are under
> `app/`.
>
> **Last path verification:** 2026-07-26 against the R0-landed tree (project audit sweep). Entry
> points below were spot-checked with `ls`/`rg`; one stale path corrected (`contexts/` →
> `context/`). Re-run the existence check and update this line after the next large landing.

## Baseline facts

- **App root:** `app/` — a Bun monorepo. `app/package.json` = `0.11.1` (upstream Craft v0.11 line).
- **Implementation reality:** current `app/` is Craft v0.11.1-derived; intentional/convergence
  deltas are listed in [`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md).
- **Product/interaction baseline:** `源码参考/software/craft-agents-oss-v0.10.5/` at official tag
  `v0.10.5` / commit `c9d9a26f`.
- **Selective-update reference:** `源码参考/software/craft-agents-oss/` at official tag `v0.11.2` /
  commit `a60ebc1a5a7c`; compare independent fixes/backend mechanisms, never merge wholesale.

## Reference roots (do not mix their authority)

| Reference | Location | Use |
|---|---|---|
| Fleet product authority | `docs/` numbered set + `specs/` | Decisions, boundaries, route, code entries |
| Product/interaction baseline | `源码参考/software/craft-agents-oss-v0.10.5/` | Exact Craft v0.10.5 behavior for shell, navigation, composer, menus and Session actions |
| Selective-update implementation | `源码参考/software/craft-agents-oss/` | Exact Craft v0.11.2 behavior; admit only bounded fixes/backend mechanisms, never its product model wholesale |
| Current official hosted docs mirror | `源码参考/craft-docs/online-current/` | Later/current upstream behavior clues; may not match v0.11.2 |
| Mirror index and provenance | `源码参考/craft-docs/README.md`, `SYNC-MANIFEST.txt` | Locate source docs, verify downloaded bytes, known Craft-operated service list |
| Owner design notes | `docs/design-library/` | Owner intent; open the relevant note after checking code |
| UI component kits | local `UI参考/` | Optional untracked samples for human study; not build input |

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

Measured 2026-07-24 on `work/fresh-base-spine`: **54 files exceed 900 lines.** The largest are

| File | Lines | Consequence |
|---|---|---|
| `packages/server-core/src/sessions/SessionManager.ts` | 8,920 | the session authority is one file |
| `apps/electron/src/renderer/components/app-shell/AppShell.tsx` | 3,926 | **every** shell change lands here |
| `apps/electron/src/main/browser-pane-manager.ts` | 3,613 | |
| `packages/ui/src/components/chat/TurnCard.tsx` | 3,279 | |
| `packages/shared/src/agent/claude-agent.ts` | 3,168 | |
| `apps/electron/src/renderer/.../input/FreeFormInput.tsx` | 2,512 | composer changes land here |
| `apps/electron/src/renderer/.../ChatDisplay.tsx` | 2,383 | |
| `apps/electron/src/renderer/App.tsx` | 2,269 | |

This is inherited from upstream, not caused by Fleet, and it is not a cleanup backlog — most of these
files are stable and untouched. It is recorded here because of one specific failure it causes:

> **A file an agent cannot read is a file an agent will drift in.** `AppShell.tsx` is the declared
> visual anchor for shell work, and it is 3,926 lines. Agents that cannot hold it in context invent
> structure and values instead of matching it. This is the mechanism behind the reverted 2026-07-24
> frontend drift.

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
| Agent permission policy | `packages/shared/src/agent/mode-manager.ts`, `core/pre-tool-use.ts`, `core/permission-manager.ts`, `SessionManager` | Policy and enforcement are distributed across these seams; `PermissionManager` alone is not the global gate |
| Permission modes | `packages/shared/src/agent/mode-manager.ts`, `mode-types.ts` | Canonical explore/ask/execute map to **stored** enum `safe` / `ask` / `allow-all` (`PERMISSION_MODE_TO_CANONICAL`). `rg` the stored values when tracing `shouldAllowToolInMode` |
| **Permission enforcement** | `packages/shared/src/agent/core/pre-tool-use.ts`, `SessionManager` | The real gate + approval prompt. The SDK runs `bypassPermissions`; the PreToolUse hook decides allow/deny and emits `permission_request`. `PermissionManager.evaluateToolCall` **defaults to allow** for unrecognized tools — not a gate on its own |
| Built-in tools (not the registry) | `pre-tool-use.ts` (`BUILT_IN_TOOLS`, `FILE_PATH_TOOLS`); `claude-agent.ts` (`preset: 'claude_code'`) | The agent's `Bash`/`Read`/`Write`/`Edit` are SDK built-ins, separate from `SESSION_TOOL_DEFS`. File mutations currently go through these |
| System prompt assembly | `packages/shared/src/prompts/system.ts`, `agent/core/prompt-builder.ts`, `agent/{claude-agent,pi-agent}.ts` | Current full/mini prompt paths; E13 profile work must extend this route, not create a second builder |
| Session tool projection | `packages/session-tools-core/src/tool-defs.ts` (`getSessionToolDefs`), `packages/shared/src/agent/session-scoped-tools.ts` | Current filtering is narrow; the post-TE1/R0 bounded profile slice centralizes any effective projection here and shares it across provider lanes |
| Usage/cache accounting | `packages/shared/src/agent/core/{usage-tracker,cache-economy}.ts`, provider event adapters | One ledger; TE1 observes current calls before any prompt/tool behavior change |
| **Timeline events** | `packages/shared/src/protocol/dto.ts` (`SessionEvent` union) | Has `tool_start`, `tool_result`, `permission_request`, `permission_mode_changed` |
| Event broadcast channels | `packages/shared/src/protocol/events.ts`, `channels.ts` (`RPC_CHANNELS.sessions.EVENT`) | Server→client push |
| Session authority | `packages/server-core/src/sessions/`, `packages/shared/src/sessions/` | The one session store |
| Agent label action | `packages/session-tools-core/src/handlers/set-session-labels.ts`; `packages/shared/src/agent/session-self-management-bindings.ts` | Agent adapter → PreToolUse → SessionManager callbacks |
| Human label action | renderer `AppShell.tsx` → `sessionCommand(setLabels)` → `handlers/rpc/sessions.ts` | UI path → `SessionManager.setSessionLabels`; no generic governed cross-caller seam yet |

## Desktop shell and navigation

| Concern | Start here |
|---|---|
| Global shell | `app/apps/electron/src/renderer/components/app-shell/AppShell.tsx` |
| Sidebar / navigation | `app/apps/electron/src/renderer/components/app-shell/LeftSidebar.tsx` |
| Session list | `app/apps/electron/src/renderer/components/app-shell/SessionList.tsx` |
| Main content routing | `app/apps/electron/src/renderer/components/app-shell/MainContentPanel.tsx` |
| Conversation surface | `app/apps/electron/src/renderer/components/app-shell/ChatDisplay.tsx` |
| Navigation state | `app/apps/electron/src/renderer/context/NavigationContext.tsx` |

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
  [`17-TOKEN-ECONOMY.md`](17-TOKEN-ECONOMY.md); extend one effective projection before provider
  schema adaptation. Do not couple it to R4 or treat a provider lane as a loadout authority.

## Artifact history and attribution (Decisions H1–H5)

New domain layer. Pure modules — no git commands, no I/O — so the rules are testable without a
repository and the executor's only job is to refuse anything the plan did not authorize.

| Concern | Real code | Note |
|---|---|---|
| Which mechanism owns an artifact's history | `packages/shared/src/artifacts/history-backend.ts` | `text → git-tree`, `media → content-store`, `document-graph → operation-log`. Routing by extension denylist, not size |
| Change attribution | same file (`ChangeAttribution`, `groupByAuthor`) | `agentId` absent = the human acted directly |
| Concurrent write admission | same file (`admitWrite`, `WriteLease`) | One writer per path; `document-graph` exempt because record ops commute |
| Parallel-agent isolation | same file (`AgentIsolation`, `agentPortOffset`) | Worktree **plus** ports/scratch/env; ports by index so they reproduce |
| Git snapshot safety boundary | `packages/shared/src/git/snapshot-plan.ts` | Explicit allow-list; scratch `GIT_INDEX_FILE`; capability degrades rather than fails |
| Message revert (file-level) | `packages/shared/src/sessions/revert-model.ts` | Distinct from `branchFromMessageId`, which forks the *conversation* and leaves files alone |
| Derived session activity | `packages/shared/src/sessions/session-activity.ts` | Live; `sessionStatus` stays the manual label |
| CLI agent connection (ACP + catalog + binary resolution) | `packages/shared/src/cli-agents/cli-agent-connection.ts` | Replaces three hand-written probes; `legacy-probe` marks what has not migrated |
| Terminal capability and command admission | `packages/shared/src/terminal/terminal-capability.ts` | Classifies before running so `vim` is refused instead of hanging for 30s |
| Model pricing (cache tiers, context tiers, subscription) | `packages/shared/src/config/model-pricing.ts` | models.dev shape; unknown pricing sorts last so it cannot become the silent default |
| Expert kits and the attention budget | `packages/shared/src/labels/expert-kit.ts` | Budget governs the **active** set, not the catalog; union takes the *narrowest* permission request |
| Skill routing inside a kit | `packages/shared/src/labels/skill-routing.ts` | Triggers + decisive exclusions + offered successors; `auditCatalog` catches what makes routing feel broken |
| Expert-kit gallery (browse, cards, install admission) | `packages/shared/src/labels/kit-gallery.ts` | Catalog size never warns; missing connectors refuse, missing routing warns |
| Legacy `kind: 'identity'` normalization | `packages/shared/src/labels/kind-normalize.ts` | **Expert kits are the old identity labels.** Never compare `kind` directly |
| Kit-declared data sources | `packages/shared/src/labels/kit-sources.ts` | Local archives are forced `sensitive` and `search-only`; missing required sources refuse |
| Memory-curator kit (worked example) | `packages/shared/src/labels/memory-curator-kit.ts` | Idle-triggered, prune-always/consolidate-opt-in, never deletes, cheap-model requirement |
| Example kits (data, not advice) | `packages/shared/src/labels/example-kits.ts` | One small kit, one 18-step kit that only works routed |
| Memory scope, promotion and tool facts | `packages/shared/src/memory/memory-scope.ts` | Delegates return findings and write nothing; curated layers are consolidation-only |
| Delegation routing and cost escalation | `packages/shared/src/agent/delegation-routing.ts` | Cheapest candidate that satisfies the requirement; escalate on mechanical failure only |
| Review diff normalization | `apps/electron/src/renderer/components/app-shell/workbench/review/review-diff-model.ts` | Unifies working-tree and session-snapshot sources; directory rollup; lazy patch predicate |

Not yet built, in order: the git executor behind `snapshot-plan`, the per-turn capture hook in
`SessionManager`, the content store, the operation log, and the two surfaces (review file tree,
revert dock). `SessionStatusIcon` and the session row still read the manual label.

## Craft-operated service boundaries (R2 scope)

Inherited entry points, each handled as its own coherent slice per Decision P8 and
[`specs/R2-independence.md`](specs/R2-independence.md). Do not remove a URL without tracing
UI → handler → persistence → recovery.

| Concern | Current code entry | Fleet direction |
|---|---|---|
| Session export | `app/packages/server-core/src/sessions/SessionManager.ts`; `app/apps/electron/src/renderer/pages/ChatPage.tsx` | **REUSE:** local export only; the online sharing/viewer path was removed by owner decision |
| Upstream version awareness | `packages/shared/src/version/manifest.ts`; official tags/release notes | **REUSE:** detect and review upstream releases for selective porting |
| Fleet binary updater | `app/apps/electron/src/main/auto-update.ts`; `app/apps/electron/electron-builder.yml` | **EXTEND/REPLACE:** Fleet-controlled or user-configured signed channel; disable install honestly until it exists |
| Help and Docs MCP | `packages/shared/src/docs/`; `packages/session-mcp-server/src/index.ts`; Electron menu/help links | **EXTEND:** bundled/local mirror first; online Craft links only when visibly external |
| WebUI OAuth relay | `packages/shared/src/auth/oauth-relay.ts`; `packages/server-core/src/webui/` | **EXTEND:** configurable self-hosted relay; preserve the desktop local callback |
| Slack OAuth relay | `packages/shared/src/auth/slack-oauth.ts` | **EXTEND:** user-configured app/callback or explicitly unavailable |
| Craft sources/connectors | `packages/shared/src/sources/`; `packages/shared/src/mcp/`; builtin source definitions | **REUSE as optional connector:** never required for startup or core local data |
| Branding/support/co-author text | `packages/shared/src/branding.ts`; package metadata; `packages/shared/src/prompts/system.ts`; Electron menus | **REPLACE deliberately:** rename with compatibility and license/trademark review, not global search-and-replace |

## Verification commands

| What | Command (from `app/`) |
|---|---|
| Typecheck shared | `bun run typecheck:shared` |
| Typecheck electron | `bun run typecheck:electron` |
| Typecheck everything | `bun run typecheck:all` |
| Targeted shared tests | `bun run test:shared:all` (3 files — a smoke check, **not** a gate) |
| Whole suite (703 files, isolated) | `bun run test` |
| Only tests affected by your changes | `bun run test:changed` |
| Iteration gate (typecheck:all + changed tests) | `bun run validate:quick` |
| Dev gate (ui-contract + typecheck:all + **whole suite** + doc-tools) | `bun run validate:dev` |
| CI gate (dev + i18n parity/sorted/coverage) | `bun run validate:ci` |

> **Corrected 2026-07-30.** `validate:dev` previously ran `test:shared:all` — 3 of the repository's
> 703 test files (0.4%). The whole suite existed (`scripts/test-all.sh`, already correctly using
> `--isolate` plus a per-process pass for `*.isolated.ts`) but was bound only to `bun run test` and
> was in no gate. Separately, `typecheck:all` could not pass at all: `packages/ui/tsconfig.json`
> declared `rootDir: ./src` while its `paths` resolved `@craft-agent/core` into `../core/src`,
> making every such import a TS6059 error — in a package that is never built by tsc (its
> `main`/`types`/`exports` all point at raw `src/`). Both are fixed; all 13 workspaces typecheck
> clean. Bun is pinned to `1.3.14` via `packageManager`/`engines` and in CI, because `--isolate`
> and `--changed` require 1.3.13+.
| Launch real app (dev) | `bun run electron:dev` |
| Build + start | `bun run electron:start` |

Verification policy (what to run when): [`09-QUALITY.md`](09-QUALITY.md). A passing typecheck is
evidence, never a capability status.

## Keeping this file honest

Update it only when an important entry point or authority actually moves. It is a map to the few
things that matter, kept short so it stays true.
