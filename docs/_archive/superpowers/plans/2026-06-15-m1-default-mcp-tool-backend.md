# M1 Default MCP Tool Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app runtime use the MCP-backed tool backend by default, while preserving `FLEET_TOOL_BACKEND=local` as an explicit fallback. This moves Fleet from “MCP opt-in experiment” to “MCP is the normal tool path” without introducing external stdio/socket MCP servers yet.

**Architecture:** Add a small mode resolver in `tool-backend-factory.ts`. `main/index.ts` should call it instead of hard-coding `local` as the default. Existing `ToolBus`, approval, logging, and tool execution APIs stay unchanged.

**Tech Stack:** TypeScript, Electron main runtime, Vitest, Playwright smoke.

---

## 参考实现对照

- `源码参考/craft-agents-oss/packages/shared/src/mcp/mcp-pool.ts`：采用“一条 MCP code path 给所有 backend 使用”的架构方向。本切片把 Fleet 默认工具路径切到 MCP-backed runtime，保留 local fallback 便于排障。
- `源码参考/craft-agents-oss/packages/shared/src/mcp/client.ts`：采用官方 MCP SDK client 作为工具调用边界。本切片继续使用已接入的 `McpClientToolBackend`，不新增自定义协议。
- `源码参考/craft-agents-oss/packages/session-mcp-server/src/index.ts`：采用 session MCP server 作为外部 agent 的工具挂载方式。本切片还不开放 stdio server，只先让内置 Pi 的工具路径默认经过 MCP client/server。
- `源码参考/cmux/skills/cmux-socket-policy/SKILL.md`：采用后台控制面不抢焦点原则。本切片只改变 main 进程默认工具后端，不新增 socket command 或 UI 焦点行为。

未采用原因：完整 MCP pool 的多源同步、proxy tool namespace、远程 HTTP/SSE、stdio 外部 server、OAuth 刷新和 socket command policy 属于后续切片。当前先完成默认路径迁移，并用全量 smoke 验证审批、shell、日志和 Ollama 链路不受影响。

## Scope

This slice only changes runtime backend selection. It does not add external MCP configuration, socket transport, stdio transport, remote MCP sources, or tool namespace proxying.

## File Structure

- Modify `app/src/main/tools/tool-backend-factory.ts`: add `resolveToolBackendMode()`.
- Modify `app/src/main/index.ts`: use `resolveToolBackendMode(process.env)`.
- Modify `app/tests/unit/tool-backend-factory.test.ts`: assert MCP is default and local is explicit fallback.
- Optional: update smoke expectations only if the Settings text requires it.

---

## Tasks

## Execution Status

Completed on 2026-06-15:

- Added `resolveToolBackendMode()`.
- Changed app runtime startup to default to `mcp-inmemory`.
- Preserved `FLEET_TOOL_BACKEND=local` as an explicit fallback.
- Updated unit coverage for default, explicit MCP, explicit local, and unknown env values.
- Added smoke coverage in Settings so default runs assert `mcp-inmemory` and fallback runs assert `local`.

Red verification:

```bash
cd app
npm test -- tests/unit/tool-backend-factory.test.ts
```

Result: failed because `resolveToolBackendMode` did not exist.

Implementation note: the first implementation used a too-narrow `Pick<NodeJS.ProcessEnv, "FLEET_TOOL_BACKEND">` input type. `npm run typecheck` caught that `process.env` does not guarantee the key exists, so the resolver now accepts `{ FLEET_TOOL_BACKEND?: string }`.

Targeted verification:

```bash
cd app
npm test -- tests/unit/tool-backend-factory.test.ts
npm run typecheck
npm run build
npm run smoke
FLEET_TOOL_BACKEND=local npm run smoke
```

Result: exit 0; targeted unit test reported 1 file and 3 tests passing; typecheck passed; build passed; default MCP smoke reported 5 passed and 1 skipped; local fallback smoke reported 5 passed and 1 skipped.

Full verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=local npm run smoke && npm run pack && npm audit --json && FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: exit 0; typecheck passed; lint passed; `npm test` reported 27 test files and 73 tests passing; protocol tests reported 2 files and 4 tests passing; build passed; default MCP smoke reported 5 passed and 1 skipped; local fallback smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities across 698 dependencies; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

Latest post-icon verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=local npm run smoke && npm run pack && npm audit --json && FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: exit 0; typecheck passed; lint passed; `npm test` reported 27 test files and 74 tests passing; protocol tests reported 2 files and 4 tests passing; build passed; default MCP smoke reported 5 passed and 1 skipped; local fallback smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities across 698 dependencies; real Ollama smoke reported 1 passed. The previous default Electron icon warning is gone; macOS signing still waits on Developer ID credentials.

### Task 1: Backend Mode Resolver

- [x] **Step 1: Write failing resolver tests**

Update `tool-backend-factory.test.ts` to assert:

- empty env resolves to `mcp-inmemory`
- `FLEET_TOOL_BACKEND=mcp-inmemory` resolves to `mcp-inmemory`
- `FLEET_TOOL_BACKEND=local` resolves to `local`
- unknown values resolve to `mcp-inmemory`

- [x] **Step 2: Run red**

Run:

```bash
cd app
npm test -- tests/unit/tool-backend-factory.test.ts
```

Expected: FAIL because `resolveToolBackendMode()` is not implemented.

- [x] **Step 3: Implement resolver and main wiring**

Export the resolver from `tool-backend-factory.ts` and use it in `main/index.ts`.

### Task 2: Verification

- [x] **Step 1: Target verification**

Run:

```bash
cd app
npm test -- tests/unit/tool-backend-factory.test.ts
npm run typecheck
npm run build
npm run smoke
FLEET_TOOL_BACKEND=local npm run smoke
```

Expected: PASS.

- [x] **Step 2: Full verification**

Run:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=local npm run smoke && npm run pack && npm audit --json && FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Expected: PASS.

## Self-Review

- MCP is default but local fallback remains one env var away.
- Approval/logging semantics remain owned by `ToolBus`.
- This does not claim external MCP server support.
