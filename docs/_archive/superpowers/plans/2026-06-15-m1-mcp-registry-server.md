# M1 MCP Registry Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the existing internal `ToolRegistry` as an MCP server and prove the `ToolBus` backend path can be served through real MCP protocol objects.

**Architecture:** Use the SDK low-level `Server` API because Fleet tools already use TypeBox JSON Schema, while high-level `McpServer.registerTool` requires zod schemas. The server handles `tools/list` and `tools/call`, returns Fleet `ToolResult` as structured content, and is verified through SDK `Client` + `InMemoryTransport` + `McpClientToolBackend`.

**Tech Stack:** `@modelcontextprotocol/sdk@1.29.0`, TypeScript, Vitest, TypeBox.

---

## Execution Status

Completed on 2026-06-15:

- Added `app/src/main/tools/mcp-registry-server.ts`.
- Added `createToolRegistryMcpServer()` using SDK `Server`, `ListToolsRequestSchema`, and `CallToolRequestSchema`.
- Preserved TypeBox schemas in MCP `tools/list` responses.
- Mapped Fleet `safe` risk to MCP `readOnlyHint`; approval tools are exposed as non-readonly/destructive/open-world.
- Updated `McpClientToolBackend` to unwrap Fleet `ToolResult` from MCP `structuredContent`.
- Added `app/tests/unit/mcp-registry-server.test.ts` to prove `ToolSpec -> MCP server -> MCP client -> McpClientToolBackend -> ToolResult` works.

Targeted verification:

```bash
cd app
npm test -- tests/unit/mcp-registry-server.test.ts tests/unit/mcp-tool-backend.test.ts
npm run typecheck
```

Result: exit 0; 2 test files and 4 tests passed; typecheck passed.

Full verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && npm run pack && npm audit --json
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: normal verification exit 0; `npm test` reported 23 test files and 57 tests passing; protocol tests reported 2 files and 4 tests passing; normal smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

---

## Scope

This slice does not switch the production runtime to MCP by default and does not open sockets. It proves the registry can be served through real MCP request/response schemas.

## File Structure

- Create `app/src/main/tools/mcp-registry-server.ts`: low-level MCP server factory for the internal registry.
- Modify `app/src/main/tools/mcp-tool-backend.ts`: unwrap Fleet `ToolResult` structured content.
- Create `app/tests/unit/mcp-registry-server.test.ts`: in-memory registry MCP closure.

---

### Task 1: Registry MCP Server

- [x] **Step 1: Verify SDK schema constraints**

Confirmed high-level `McpServer.registerTool` rejects TypeBox JSON schema, so the implementation uses low-level request handlers.

- [x] **Step 2: Write failing in-memory closure tests**

Tests cover safe tool listing, registry tool execution, Fleet `ToolResult` preservation, and approval risk mapping.

- [x] **Step 3: Run tests to verify failure**

```bash
cd app
npm test -- tests/unit/mcp-registry-server.test.ts
```

Expected: FAIL because `mcp-registry-server.ts` does not exist.

- [x] **Step 4: Implement server factory**

Add `tools/list` and `tools/call` handlers using SDK schemas.

- [x] **Step 5: Run targeted verification**

```bash
cd app
npm test -- tests/unit/mcp-registry-server.test.ts tests/unit/mcp-tool-backend.test.ts
npm run typecheck
```

Expected: PASS.

## Self-Review

- Uses real MCP SDK server/client/transport classes.
- Keeps TypeBox schema compatibility by avoiding the high-level zod-only tool registration API.
- Does not widen renderer authority or change agent subprocess protocol.
