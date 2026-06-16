# M1 Chat @Mention CLI Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the main chat input route `@codex`, `@claude`, `@gemini`, and `@qwen` messages to the corresponding detected external CLI prompt session instead of always invoking the built-in Pi agent.

**Architecture:** Add a main-process router in front of `AgentManager.run()`. The router parses a leading `@agent` mention, emits normal EventStream chat/run lifecycle events, starts an existing `CliSessionManager` prompt session with adapter-owned argv, and converts bounded CLI stdout/stderr chunks into assistant chat messages. If no leading external CLI mention is present, the current built-in agent path is unchanged.

**Tech Stack:** TypeScript, Electron main IPC, existing EventStream, existing `CliSessionManager`, Vitest, Playwright smoke.

---

## Scope

This slice implements one-shot @mention routing for detected external CLIs. It does not add persistent multi-turn CLI conversations, PTY input, automatic agent selection, simultaneous fan-out to multiple agents, MCP injection into external CLIs, or a polished @ autocomplete menu.

## 参考实现对照

- `源码参考/craft-agents-oss/packages/pi-agent-server`：采用“外部执行单元独立进程 + 主进程桥接事件”的模式。本切片只复用了进程隔离和事件桥接思路；尚未移植 craft 的完整 session MCP server、工具挂载和会话级隔离。
- `源码参考/cmux`：采用“任务/会话驱动 UI、工具与浏览器能力经本地控制面暴露”的大方向。本切片只把 `@mention` 作为入口路由到外部 CLI；尚未实现 cmux 级的任务状态机、pane/worker 生命周期、diff 评论和浏览器工具面板。
- `源码参考/opencode/specs/v2/session.md` 与 `源码参考/opencode/specs/v2/tools.md`：参考其 session/tool 边界意识。本切片没有移植 opencode 的完整 session schema、权限策略和持久化协议，只用现有 `FleetEvent` 做最小闭环。

取舍：为避免继续堆大模块，本切片先把“主聊天能路由到外部 CLI”打通，并把缺口写清。后续做真正多 Agent 编排时，必须重新对照上述参考实现补齐：CLI PTY/stdio 状态机、会话持久化、工具注入、取消/重试策略、并发 worker 生命周期、UI agent 列表与任务卡片。

## File Structure

- Create `app/src/main/agent/mention-router.ts`: parse leading external CLI mentions and return the cleaned prompt.
- Create `app/src/main/agent/cli-chat-router.ts`: EventStream bridge from chat request to `CliSessionManager` prompt session.
- Modify `app/src/main/ipc/handlers.ts`: call `CliChatRouter.run()` before falling back to `AgentManager.run()`.
- Modify `app/src/main/index.ts`: instantiate `CliChatRouter` and feed it CLI session events.
- Modify `app/src/renderer/components/Chat/ChatView.tsx`: placeholder hints that `@codex` style routing is available.
- Add tests:
  - `app/tests/unit/mention-router.test.ts`
  - `app/tests/unit/cli-chat-router.test.ts`
  - update `app/tests/smoke/launch.spec.ts`

---

## Execution Status

Completed on 2026-06-15:

- Added `app/src/main/agent/mention-router.ts`.
- Added `app/src/main/agent/cli-chat-router.ts`.
- Wired `cli:session` events into `CliChatRouter`.
- Updated chat IPC so leading external CLI mentions route to the CLI prompt session path before falling back to the built-in Pi agent.
- Updated cancel IPC so CLI chat runs can be cancelled by returned run id.
- Updated chat placeholder and smoke selectors to expose `@codex / @claude / @gemini / @qwen`.
- Added `app/tests/unit/mention-router.test.ts` and `app/tests/unit/cli-chat-router.test.ts`.

Red verification:

```bash
cd app
npm test -- tests/unit/mention-router.test.ts
npm test -- tests/unit/cli-chat-router.test.ts
```

Result: parser red failed because `mention-router.ts` did not exist; router red failed because `cli-chat-router.ts` did not exist; cancellation red failed because `router.cancel()` did not exist.

Targeted verification:

```bash
cd app
npm test -- tests/unit/mention-router.test.ts tests/unit/cli-chat-router.test.ts tests/unit/cli-adapters.test.ts tests/unit/cli-ipc-contract.test.ts
npm run typecheck
npm run build
npm run smoke
```

Result: exit 0; targeted unit tests reported 4 files and 15 tests passing; typecheck passed; build passed; smoke reported 5 passed and 1 skipped.

Full verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=mcp-inmemory npm run smoke && npm run pack && npm audit --json && FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: exit 0; typecheck passed; lint passed; `npm test` reported 26 test files and 67 tests passing; protocol tests reported 2 files and 4 tests passing; build passed; default smoke reported 5 passed and 1 skipped; MCP-backend smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities across 698 dependencies; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

### Task 1: Mention Parser

- [x] **Step 1: Write failing parser tests**

Create `app/tests/unit/mention-router.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { parseExternalCliMention } from "../../src/main/agent/mention-router.js";

describe("parseExternalCliMention", () => {
  test("parses leading supported CLI mentions and strips the mention", () => {
    expect(parseExternalCliMention("@codex explain this")).toEqual({ id: "codex", prompt: "explain this" });
    expect(parseExternalCliMention("@claude-code fix it")).toEqual({ id: "claude", prompt: "fix it" });
    expect(parseExternalCliMention("@Gemini  看一下")).toEqual({ id: "gemini", prompt: "看一下" });
  });

  test("ignores non-leading and empty mentions", () => {
    expect(parseExternalCliMention("ask @codex later")).toBeUndefined();
    expect(parseExternalCliMention("@codex")).toBeUndefined();
    expect(parseExternalCliMention("@unknown hello")).toBeUndefined();
  });
});
```

- [x] **Step 2: Run red**

Run:

```bash
cd app
npm test -- tests/unit/mention-router.test.ts
```

Expected: FAIL because `mention-router.ts` does not exist.

- [x] **Step 3: Implement parser**

Create a small pure parser that supports aliases:

- `claude`, `claude-code`
- `codex`
- `gemini`
- `qwen`, `qwen-code`

### Task 2: CLI Chat Router

- [x] **Step 1: Write failing router tests**

Create `app/tests/unit/cli-chat-router.test.ts` covering:

- no mention returns `undefined`
- unavailable CLI emits `message.added` for user and `agent.failed`
- available CLI emits `session.created`, `message.added`, `agent.started`, starts `CliSessionManager` prompt mode args, converts stdout to assistant `message.added`, and emits `agent.completed` on exit.

- [x] **Step 2: Run red**

Run:

```bash
cd app
npm test -- tests/unit/cli-chat-router.test.ts
```

Expected: FAIL because `cli-chat-router.ts` does not exist.

- [x] **Step 3: Implement router**

Use injected `detectCliTools`, `getCliAdapter`, `CliSessionManager`, `EventStore`-like append, and workspace settings. Keep the router independent from renderer and IPC.

### Task 3: Main/UI Wiring

- [x] **Step 1: Wire main process**

In `app/src/main/index.ts`, instantiate the router and pass CLI session events into it from the existing `CliSessionManager` emitter.

In `app/src/main/ipc/handlers.ts`, if `cliChatRouter.run(sessionId, text)` returns a result, return it; otherwise call `agent.run()`.

- [x] **Step 2: Add UI hint**

Change the chat input placeholder to mention supported aliases, without changing layout.

- [x] **Step 3: Target verification**

Run:

```bash
cd app
npm test -- tests/unit/mention-router.test.ts tests/unit/cli-chat-router.test.ts tests/unit/cli-adapters.test.ts tests/unit/cli-ipc-contract.test.ts
npm run typecheck
npm run build
```

Expected: PASS.

### Task 4: Full Verification

- [x] **Step 1: Smoke coverage**

Update smoke to assert the chat input placeholder mentions `@codex`.

- [x] **Step 2: Full verification**

Run:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=mcp-inmemory npm run smoke && npm run pack && npm audit --json
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Expected: PASS.

## Self-Review

- The built-in agent path remains the default when no leading mention exists.
- Renderer still cannot choose executable paths or argv.
- CLI output is bounded by `CliSessionManager` before becoming chat messages.
- This is an incremental @mention slice, not the full multi-agent orchestrator.
