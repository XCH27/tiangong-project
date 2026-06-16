# M1 Tool Backend Runtime Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the tool backend runtime observable so M1 MCP bus work has a stable status surface before adding stdio/socket transports. Settings should show whether the app is using local tools or MCP in-memory tools, whether the backend is connected, how many tools are registered, and the last connection error if one exists.

**Architecture:** Extend `ToolBackendRuntime` with a `getStatus()` method. Keep `ToolBackend` execution unchanged. The runtime owns connection state, tool count, close state, and errors, following the reference-project pattern where connection lifecycle belongs to the pool/runtime instead of the UI or agent manager.

**Tech Stack:** Electron IPC, TypeScript, Zod IPC contract, React Settings UI, Vitest.

---

## 参考实现对照

- `源码参考/craft-agents-oss/packages/shared/src/mcp/mcp-pool.ts`：采用集中连接池/运行时拥有连接状态、工具缓存、断开清理、失败记录的思路。本切片不复制完整 pool，只把 Fleet 当前 `ToolBackendRuntime` 扩展为可观测生命周期对象。
- `源码参考/craft-agents-oss/packages/shared/src/mcp/client.ts`：采用官方 MCP SDK client 管理 connect/listTools/callTool/close 的边界。本切片沿用当前 `McpClientToolBackend`，只补状态接口；stdio env 脱敏等内容留到外部 MCP server slice。
- `源码参考/craft-agents-oss/packages/session-mcp-server/src/index.ts`：采用 MCP server 明确启动参数、信号关闭、错误回传的生命周期边界。本切片只吸收“运行时状态可解释”的要求，不引入 session-scoped server。
- `源码参考/cmux/skills/cmux-socket-policy/SKILL.md`：采用 socket/后台命令不抢焦点、非 UI 操作不影响当前界面的原则。本切片只做 Settings 只读状态，不触发焦点或会话切换。

未采用原因：craft-agents 的 OAuth 刷新、远程 HTTP/SSE、API source、大响应落盘和 proxy tool namespace 是完整多源 MCP pool 能力；Fleet 当前只有本地工具注册表和 `mcp-inmemory` 试运行后端，直接照搬会增加尚未使用的复杂度。后续实现 stdio/socket MCP pool 时必须重新对照这些文件。

## Scope

This slice adds observability only. It does not add external MCP server config, stdio transport, socket command protocol, OAuth refresh, proxy tool names, or dynamic source sync.

## File Structure

- Modify `app/src/main/tools/tool-backend-factory.ts`: add `ToolBackendRuntimeStatus`, status tracking, idempotent close, and error state.
- Modify `app/src/shared/ipc-contract.ts`: add `toolBackendStatus` channel and schema/type.
- Modify `app/src/main/ipc/handlers.ts`: expose `toolBackendStatus`.
- Modify `app/src/main/index.ts`: pass `toolBackendRuntime` to IPC registration.
- Modify `app/src/preload/index.ts`: expose `getToolBackendStatus()`.
- Modify `app/src/renderer/components/Settings/Settings.tsx`: display backend mode/status/tool count/last error.
- Modify tests:
  - `app/tests/unit/tool-backend-factory.test.ts`
  - `app/tests/unit/cli-ipc-contract.test.ts`

---

## Tasks

## Execution Status

Completed on 2026-06-15:

- Added `ToolBackendRuntimeStatus` and `getStatus()` to tool backend runtimes.
- Local runtime now reports connected status and registered tool count.
- MCP in-memory runtime now tracks connected/closed state, registered tool count, last close error, and idempotent close.
- Added `tool-backend:status` IPC channel and `FleetBridge.getToolBackendStatus()`.
- Settings now shows tool backend mode, connection state, tool count, and last error.

Red verification:

```bash
cd app
npm test -- tests/unit/tool-backend-factory.test.ts
npm test -- tests/unit/cli-ipc-contract.test.ts
```

Result: runtime test failed because `runtime.getStatus` did not exist; IPC contract test failed because `ToolBackendStatusSchema` was not exported.

Targeted verification:

```bash
cd app
npm test -- tests/unit/tool-backend-factory.test.ts tests/unit/cli-ipc-contract.test.ts
npm run typecheck
npm run build
npm run smoke
```

Result: exit 0; targeted unit tests reported 2 files and 9 tests passing; typecheck passed; build passed; smoke reported 5 passed and 1 skipped.

Full verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=mcp-inmemory npm run smoke && npm run pack && npm audit --json && FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: exit 0; typecheck passed; lint passed; `npm test` reported 27 test files and 72 tests passing; protocol tests reported 2 files and 4 tests passing; build passed; default smoke reported 5 passed and 1 skipped; MCP-backend smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities across 698 dependencies; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

### Task 1: Runtime Status Contract

- [x] **Step 1: Write failing runtime status test**

Update `tool-backend-factory.test.ts` to assert:

- local runtime status is `{ mode:"local", connected:true, toolCount:1 }`
- MCP runtime status is `{ mode:"mcp-inmemory", connected:true, toolCount:1 }`
- closing MCP runtime twice is safe and then reports `connected:false`

- [x] **Step 2: Run red**

Run:

```bash
cd app
npm test -- tests/unit/tool-backend-factory.test.ts
```

Expected: FAIL because `getStatus()` is not implemented.

- [x] **Step 3: Implement runtime status**

Add status state and idempotent close in `tool-backend-factory.ts`.

### Task 2: IPC and Settings Surface

- [x] **Step 1: Write failing IPC contract assertion**

Update `cli-ipc-contract.test.ts` to parse a `ToolBackendStatusSchema` with `mode`, `connected`, `toolCount`, and optional `lastError`.

- [x] **Step 2: Run red**

Run:

```bash
cd app
npm test -- tests/unit/cli-ipc-contract.test.ts
```

Expected: FAIL because the schema/channel does not exist.

- [x] **Step 3: Implement IPC and UI**

Expose `CH.toolBackendStatus`, `FleetBridge.getToolBackendStatus()`, IPC handler, and Settings display.

### Task 3: Verification

- [x] **Step 1: Target verification**

Run:

```bash
cd app
npm test -- tests/unit/tool-backend-factory.test.ts tests/unit/cli-ipc-contract.test.ts
npm run typecheck
npm run build
npm run smoke
```

Expected: PASS.

- [x] **Step 2: Full verification**

Run:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=mcp-inmemory npm run smoke && npm run pack && npm audit --json && FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Expected: PASS.

## Self-Review

- Status is structured data, not inferred from labels.
- Close is idempotent for MCP runtime.
- Settings reads status without mutating tool backend lifecycle.
