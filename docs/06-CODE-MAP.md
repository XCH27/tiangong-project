# 06 — Code Map

> Where the real code is. Use this to find the entry point, then **confirm with `rg` before
> editing** — the tree changes and these paths are orientation, not a contract. All paths are under
> `app/`.
>
> **Last path verification:** 2026-08-15 against the working tree at `f8a340021` + 385 uncommitted
> paths. Every entry point below was re-confirmed with `ls`/`rg`; the delegation, R3-acceptance,
> runtime-mode and shell-layout modules that landed between 2026-07-31 and 2026-08-15 were missing
> from this map entirely and are now listed. Re-run the existence check and update this line after
> the next large landing.

## Baseline facts

- **App root:** `app/` — a Bun monorepo. `app/package.json` = `0.13.3`, matching the rolling Craft
  pin. (Until 2026-09-11 this section said `0.11.1`, `v0.11.1-derived` and `v0.11.2` alongside
  `v0.13.3`; three of those were stale.)
- **Implementation reality:** current `app/` is Craft **v0.13.3**-derived; intentional/convergence
  deltas are listed in [`UI-SPEC.md`](UI-SPEC.md).
- **Look pin:** `源码参考/software/craft-agents-oss-v0.10.5/` at tag `v0.10.5` — tokens and
  interaction *style*, not a product shell to restore.
- **Selective-update reference:** `源码参考/software/craft-agents-oss/` (stored in
  `/Volumes/AIGC/天工参考/源码参考/`, symlinked locally) at official tag **`v0.13.3`**; compare
  independent fixes/backend mechanisms, never merge wholesale.

## Remote connection (远程连接)

| Concern | Where |
|---|---|
| Device grants, invites, scope, revocation | `packages/shared/src/remote/devices.ts` |
| Persistence (`~/.craft-agent/remote-access.json`, 0600) + this machine's stable id | `packages/shared/src/remote/store.ts` |
| What the listener accepts: a device token, or a one-time invite | `packages/shared/src/remote/authenticate.ts` |
| One-shot hand-back of a freshly minted grant | `packages/shared/src/remote/mint-ledger.ts` |
| Access link v3 (invite, not credential) + legacy v1/v2 parsing | `packages/shared/src/remote/invite-link.ts` |
| What the published addresses actually reach | `packages/shared/src/remote/reachability.ts` |
| Concurrent candidate racing, last-good preference | `packages/shared/src/remote/endpoint-race.ts` |
| Workspaces projected into the computers you can run on | `packages/shared/src/remote/run-targets.ts` |
| Public listener — the single writer of the LAN socket | `apps/electron/src/main/server-mode.ts` |
| Invite / device-list / revoke handlers (LOCAL_ONLY) | `apps/electron/src/main/handlers/remote-devices.ts` |
| Settings → 远程连接, two blocks | `apps/electron/src/renderer/pages/settings/ServerSettingsPage.tsx` |
| "Which computer does this run on" chip | `.../app-shell/input/{ComposerLeadingChips,NewSessionRunTarget,use-run-targets}` |
| SSH library, parked (no IPC registered) | `packages/remote-ssh/` |

## Reference roots (do not mix their authority)

> **External Reference Root:** `/Volumes/AIGC/天工参考/` contains all complete source repositories (`源码参考/`) and reverse-engineered UI design kits (`UI参考/`). Local workspace directories are symlinks to this external drive.

| Reference | Location | Use |
|---|---|---|
| Fleet product authority | `docs/` numbered set + `specs/` | Decisions, boundaries, route, code entries |
| Look pin | `源码参考/software/craft-agents-oss-v0.10.5/` | Tokens, type, motion — not a shell to restore |
| Rolling Craft base | `源码参考/software/craft-agents-oss/` @ `v0.13.3` | Current `app/` donor |
| Selective-update implementation | `源码参考/software/craft-agents-oss/` (`/Volumes/AIGC/天工参考/源码参考/software/craft-agents-oss/`) | Exact Craft v0.13.3 behavior; admit only bounded fixes/backend mechanisms, never its product model wholesale |
| Current official hosted docs mirror | `源码参考/craft-docs/online-current/` | Later/current upstream behavior clues; may not match v0.13.3 |
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

Re-measured 2026-08-15 on the current working tree (2026-07-24 values in brackets):

| File | Lines | Consequence |
|---|---|---|
| `packages/server-core/src/sessions/SessionManager.ts` | **9,394** [8,920] | the session authority is one file |
| `apps/electron/src/renderer/components/app-shell/AppShell.tsx` | **4,166** [3,926] | **every** shell change lands here |
| `apps/electron/src/main/browser-pane-manager.ts` | 3,613 | |
| `packages/ui/src/components/chat/TurnCard.tsx` | 3,279 | |
| `packages/shared/src/agent/claude-agent.ts` | 3,168 | |
| `apps/electron/src/renderer/.../input/FreeFormInput.tsx` | 2,512 | composer changes land here |
| `apps/electron/src/renderer/.../ChatDisplay.tsx` | **2,626** [2,383] | |
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

> **The rule is currently in violation, recorded 2026-08-15.** `AppShell.tsx` gained +240 net lines
> and `ChatDisplay.tsx` +243 since the 2026-07-24 measurement, with no extraction and no named
> exemption. A whole-project code-health pass on 2026-07-28 measured `AppShellContent` at
> **cyclomatic complexity 498, nest depth 12, 31 `useState` · 31 `useEffect` · 72 `useCallback` ·
> 25 `useMemo` · 16 `useRef`**, alongside `FreeFormInput` (300 / d12) and `NavigationProvider`
> (234), plus **756 cross-file duplicated 8-line blocks** and ~1,450 type escape hatches
> (`as T` 1,250 · `as any` 153 · `as unknown as` 51). The same pass disproved the standing
> hypothesis that the growth was defensive padding: guard density exceeds 12% of lines in exactly
> **one** file out of 1,537, and the test-to-source ratio is 0.27. The growth is god components and
> copy-paste. **A function at complexity 498 cannot be edited safely at any level of review
> quality** — that is the mechanism behind the 2026-07-24 frontend drift and the
> `d25b763f6`→`fa5ee7460` / `7762c8bc4`→`2136b1ea9` revert churn. Repay this by extraction, not by
> amending the rule.

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
  `modules/suites/SYS-03-context-economy.md`; extend one effective projection before provider
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
| Cost of a session, with provenance | `packages/shared/src/config/session-cost.ts` | `reported` / `derived` / `subscription` / **`unknown`** — unknown is not a number, so `$0.00` can never stand in for "nobody told us" |
| Usage rolled up by model, project, day | `packages/shared/src/config/usage-rollup.ts` | Coverage is measured in **tokens, not sessions**; quiet days stay as gaps |
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

## Bounded delegation (Decisions C3/C5/C7/C9/C11 — R6 domain layer, landed early)

Landed ahead of R4/R5 by owner direction (roadmap change log, 2026-08-15). **These types are
`candidate`, not frozen** (`modules/REGISTRY.md` rule 2): R4 and R5 may change their shape without a
deprecation cycle. Do not build a suite against them as if they were promoted contracts.

| Concern | Real code | Note |
|---|---|---|
| Delegation envelopes | `packages/shared/src/agent/delegation-contract.ts` | `TaskContract` locked per attempt; `TaskBrief` in, `RunReport` out; transcripts never cross the boundary. Zod-validated |
| Organization policy | `packages/shared/src/agent/delegation-policy.ts` | `direct` / `single-verifier` / `bounded-parallel` / `serial-isolated`, with a human-readable reason every time. Learned routing is R17 and deliberately absent |
| Inline delegation projection | `packages/shared/src/agent/delegation-projection.ts` | Pure projection of child Session state for `DelegationStrip` (H11); a surface never owns orchestration state |
| Requirement/cost routing | `packages/shared/src/agent/delegation-routing.ts` | Cheapest candidate that satisfies the requirement; escalate on mechanical failure only (H10) |
| Path write leases | `packages/shared/src/agent/path-lease.ts` | One writer per path; reserved paths need the integrator role; leases expire so a crashed agent cannot hold a file |
| Permission intersection | `packages/shared/src/agent/permission-intersection.ts` | `effective = parent ∩ requested ∩ workspacePolicy ∩ runtimeCapability`. Privilege never expands past the parent; unattended work that resolves to `ask` waits, it does not escalate |
| RunReport validation | `packages/shared/src/agent/run-report-validate.ts` | Deterministic schema/criterion/evidence/path/budget checks against the locked contract (C9). The executor cannot self-certify |
| Kernel integration | `packages/server-core/src/tasks/TaskRunner.ts`, `packages/shared/src/agent/base-agent.ts`, `agent/index.ts` | Where the envelopes are actually consumed |
| Inline surface | `apps/electron/src/renderer/components/app-shell/DelegationStrip.tsx` (mounted in `ChatDisplay.tsx`) | The strip is real; the tree/brief/report inspector is `not implemented` (P-20) |

Not yet built behind this layer: PreToolUse `TaskContract` gates, the independent read-only
verifier, and worktree apply/discard. Those are R6's own acceptance and remain `not implemented`.

## R3 acceptance convention (fixture, not R3)

| Concern | Real code | Note |
|---|---|---|
| Deliverable acceptance helper | `packages/shared/src/workspaces/deliverable-acceptance.ts` | Copies the accepted file into `deliverables/` with a parseable provenance header (session, source, SHA-256, evidence, recovery). Refuses path escape, missing source, and overwrite of a different file. **Not ArtifactRef** — bytes stay in the Project folder |
| Agent-facing tool | `packages/session-tools-core/src/handlers/accept-deliverable.ts`, registered in `tool-defs.ts` as `accept_deliverable` | May set `needs-review`; never sets `done` or `cancelled` — closing a Session is the owner's decision |

`specs/R3-first-production-chain.md` R3-C1..C8 still require a real owner-run chain. This fixture is
not a stand-in for them.

## Shell layout, composer and session-option modules (landed 2026-08)

| Concern | Real code |
|---|---|
| Shell layout + sidebar visibility model | `renderer/components/app-shell/{shell-layout,sidebar-visibility}.ts`, `SidebarPanelSlot.tsx` |
| Plan approval with compaction | `renderer/components/app-shell/input/{approve-plan-with-compact-coordinator,use-approve-plan-with-compact}.ts` |
| Session option sync / optimistic commands | `renderer/hooks/session-options-sync.ts`, `renderer/lib/optimistic-session-command.ts`, `lib/session-connection-normalize.ts` |
| Background task cancellation | `renderer/hooks/background-task-kill.ts` |
| Product-surface classification | `renderer/lib/product-surface.ts` |
| Browser action model / automation batch ops | `renderer/components/browser/browser-action.ts`, `renderer/components/automations/batch-operation.ts` |
| Markdown sanitize schema | `packages/ui/src/components/markdown/sanitize-schema.ts` |
| Classified provider runtime modes | `packages/shared/src/config/runtime-modes.ts` (Page Architecture §3B; reasoning effort and Fast stay separate axes) |
| Messaging gateway atomic write | `packages/messaging-gateway/src/atomic-write.ts` |

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
