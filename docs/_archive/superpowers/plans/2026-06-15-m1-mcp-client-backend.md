# M1 MCP Client Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first real MCP SDK integration by implementing a `ToolBackend` backed by an MCP `Client`.

**Architecture:** Keep the default runtime on `LocalToolBackend` for now. Add `McpClientToolBackend` as a parallel backend implementation that can list tools and call tools over MCP. Use SDK `InMemoryTransport` in tests to verify client/server behavior without opening sockets.

**Tech Stack:** `@modelcontextprotocol/sdk@1.29.0`, TypeScript, Vitest, zod.

---

## Execution Status

Completed on 2026-06-15:

- Installed `@modelcontextprotocol/sdk@1.29.0`.
- Added `app/src/main/tools/mcp-tool-backend.ts`.
- Added `McpClientToolBackend`, implementing `ToolBackend` through MCP `Client.listTools()` and `Client.callTool()`.
- Added `refreshTools()` to cache MCP tool metadata for synchronous `wireSpecs()` and `getSpec()` calls.
- Mapped MCP `readOnlyHint` annotations to Fleet `safe` risk; all other MCP tools default to `approval`.
- Added SDK-level in-memory tests using `McpServer`, `Client`, and `InMemoryTransport`.

Targeted verification:

```bash
cd app
npm test -- tests/unit/mcp-tool-backend.test.ts
npm run typecheck
```

Result: exit 0; 1 test file and 2 tests passed; typecheck passed.

Full verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && npm run pack && npm audit --json
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: normal verification exit 0; `npm test` reported 22 test files and 55 tests passing; protocol tests reported 2 files and 4 tests passing; normal smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

---

## Scope

This slice proves Fleet can use the real MCP SDK behind `ToolBackend`. It does not make MCP the default runtime backend, open a socket server, or expose remote MCP configuration in the UI.

## File Structure

- Modify `app/package.json` and `app/package-lock.json`: add `@modelcontextprotocol/sdk`.
- Create `app/src/main/tools/mcp-tool-backend.ts`: MCP client-backed ToolBackend.
- Create `app/tests/unit/mcp-tool-backend.test.ts`: in-memory MCP server/client coverage.

---

### Task 1: SDK Probe And Dependency

- [x] **Step 1: Inspect SDK package metadata**

Verified latest npm version as `1.29.0` and inspected local type exports after install.

- [x] **Step 2: Install SDK**

```bash
cd app
npm install @modelcontextprotocol/sdk@1.29.0
```

Result: dependency installed; npm audit reported 0 vulnerabilities.

### Task 2: MCP Client Backend

- [x] **Step 1: Write failing in-memory MCP backend tests**

Use SDK `McpServer`, `Client`, and `InMemoryTransport` to register and call a tool.

- [x] **Step 2: Run tests to verify failure**

```bash
cd app
npm test -- tests/unit/mcp-tool-backend.test.ts
```

Expected: FAIL because `mcp-tool-backend.ts` does not exist.

- [x] **Step 3: Implement `McpClientToolBackend`**

Add `refreshTools`, `wireSpecs`, `getSpec`, and `run`.

- [x] **Step 4: Run targeted verification**

```bash
cd app
npm test -- tests/unit/mcp-tool-backend.test.ts
npm run typecheck
```

Expected: PASS.

## Self-Review

- The runtime default remains local and stable.
- The implementation uses the real SDK, not a fake MCP shape.
- The next slice should decide how to instantiate MCP clients/servers in the desktop runtime.
