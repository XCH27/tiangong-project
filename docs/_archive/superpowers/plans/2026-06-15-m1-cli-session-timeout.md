# M1 CLI Session Timeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent external CLI sessions from hanging forever by adding bounded timeout handling, a persisted `timed_out` session state, and user-visible timeout errors in both Settings output and main-chat @CLI routing.

**Architecture:** Extend `CliSessionManager` with an optional `timeoutMs` per session and a default session timeout. On timeout, kill the child process, mark the session `timed_out`, and emit an `exited` event with `timedOut: true`. Keep the current output streaming model and let higher layers decide how to render timeout events.

**Tech Stack:** Node child process, Electron IPC shared schemas, TypeScript, Vitest.

---

## 参考实现对照

- `源码参考/AionUi/docs/prds/conversations/acp/reliability.md`：采用“连接/回复超时后必须自动取消等待并明确提示，用户可继续发送”的可靠性要求。本切片采用 timeout 后释放会话和显示明确错误；不实现自动重试，因为 Fleet 当前 one-shot CLI 会话还没有完整 ACP backend 生命周期。
- `源码参考/AionUi/tests/e2e/features/conversations/acp/send-error-surfacing.e2e.ts`：采用“显示后端原始错误，不用泛化失败文案”的思路。本切片会让 CLI timeout 以结构化 `timedOut` 传递，上层显示明确 timeout 文案。
- `源码参考/opencode/packages/core/test/pty/pty-session.test.ts`：采用“会话 exited 后状态仍可查询，附件收到 exit code”的状态保留思路。本切片让 `CliSessionManager.list()` 在 timeout 后保留 `timed_out` 状态和 `exitCode:null`。

未采用原因：opencode 的 PTY attach/replay/cursor 机制比 Fleet 当前 one-shot CLI 需求更大；AionUi 的 ACP 自动重试和 busy/cron 调度需要完整 conversation runtime。后续做持久外部 CLI 会话时必须重新对照这些参考实现。

## Scope

This slice only handles timeout lifecycle for the existing managed CLI child process. It does not add PTY input, output replay cursors, automatic retry, busy queueing, or persistent conversation runtime.

## File Structure

- Modify `app/src/main/cli/cli-session-manager.ts`: add `timed_out` status, timeout timer, and `timedOut` event flag.
- Modify `app/src/shared/ipc-contract.ts`: expose `timed_out` status and `timedOut` event field.
- Modify `app/src/main/agent/cli-chat-router.ts`: map timed-out CLI sessions to `agent.failed` with a timeout-specific message.
- Modify `app/src/renderer/components/Settings/Settings.tsx`: append timeout text in CLI session output.
- Modify tests:
  - `app/tests/unit/cli-session-manager.test.ts`
  - `app/tests/unit/cli-ipc-contract.test.ts`
  - `app/tests/unit/cli-chat-router.test.ts`

---

## Execution Status

Completed on 2026-06-15:

- Added `timeoutMs` support to `CliSessionManager.start()`.
- Added `timed_out` session status.
- Added `timedOut` to `CliSessionEvent` exited events.
- Updated IPC schemas to expose `timed_out` and default `timedOut:false` for older exited event shapes.
- Updated `CliChatRouter` so timed-out CLI chat runs emit `agent.failed` with `cli_timeout`.
- Updated Settings CLI session output to show `已超时`.

Red verification:

```bash
cd app
npm test -- tests/unit/cli-session-manager.test.ts
npm test -- tests/unit/cli-ipc-contract.test.ts tests/unit/cli-chat-router.test.ts
```

Result: manager red timed out because no timeout logic killed the child; contract red failed because `timedOut` was not defaulted and `timed_out` was not accepted; router red failed because timed-out exits were still reported as generic `cli_failed`.

Targeted verification:

```bash
cd app
npm test -- tests/unit/cli-session-manager.test.ts tests/unit/cli-ipc-contract.test.ts tests/unit/cli-chat-router.test.ts
npm run typecheck
npm run build
npm run smoke
```

Result: exit 0; targeted unit tests reported 3 files and 14 tests passing; typecheck passed; build passed; smoke reported 5 passed and 1 skipped.

Full verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=mcp-inmemory npm run smoke && npm run pack && npm audit --json && FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: exit 0; typecheck passed; lint passed; `npm test` reported 27 test files and 71 tests passing; protocol tests reported 2 files and 4 tests passing; build passed; default smoke reported 5 passed and 1 skipped; MCP-backend smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities across 698 dependencies; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

### Task 1: Manager Timeout

- [x] **Step 1: Write failing session manager test**

Add a test to `app/tests/unit/cli-session-manager.test.ts`:

```ts
test("marks sessions timed out and kills the child process", async () => {
  const events: CliSessionEvent[] = [];
  const manager = new CliSessionManager((event) => events.push(event));

  const { sessionId } = manager.start({
    id: "codex",
    label: "Codex",
    commandPath: process.execPath,
    args: ["-e", "setTimeout(() => {}, 5000)"],
    timeoutMs: 50
  });

  await waitForExit(events, sessionId);

  expect(events).toContainEqual(expect.objectContaining({ sessionId, type: "exited", exitCode: null, cancelled: false, timedOut: true }));
  expect(manager.list().find((session) => session.sessionId === sessionId)).toMatchObject({ status: "timed_out", exitCode: null });
});
```

- [x] **Step 2: Run red**

Run:

```bash
cd app
npm test -- tests/unit/cli-session-manager.test.ts
```

Expected: FAIL because `timeoutMs`, `timedOut`, and `timed_out` are not implemented.

- [x] **Step 3: Implement timeout state**

Add `timeoutMs?: number`, a timer cleared on close, `timedOut` on the record, and `status: "timed_out"` when the timeout kills the process.

### Task 2: Shared Contract and Chat Rendering

- [x] **Step 1: Write failing contract/router assertions**

Update `cli-ipc-contract.test.ts` so `CliManagedSessionSchema` accepts `status:"timed_out"` and `CliSessionEventSchema` requires `timedOut` on exited events.

Update `cli-chat-router.test.ts` so a timeout exited event emits `agent.failed` with `code:"cli_timeout"` and message `外部 CLI 响应超时`.

- [x] **Step 2: Run red**

Run:

```bash
cd app
npm test -- tests/unit/cli-ipc-contract.test.ts tests/unit/cli-chat-router.test.ts
```

Expected: FAIL before schema/router updates.

- [x] **Step 3: Implement contract/router/UI handling**

Add schema fields, timeout-specific failure in router, and Settings output text for timed-out sessions.

### Task 3: Verification

- [x] **Step 1: Target verification**

Run:

```bash
cd app
npm test -- tests/unit/cli-session-manager.test.ts tests/unit/cli-ipc-contract.test.ts tests/unit/cli-chat-router.test.ts
npm run typecheck
npm run build
npm run smoke
```

Expected: PASS.

- [x] **Step 2: Full verification**

Run:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=mcp-inmemory npm run smoke && npm run pack && npm audit --json
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Expected: PASS.

## Self-Review

- A timed-out CLI session cannot leave the main chat run stuck.
- The session remains listable after timeout, matching the state-retention pattern from opencode PTY tests.
- Timeout is structured data, not string parsing.
