# M1 Runtime MCP Backend Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow the actual app runtime to use the internal ToolRegistry through an in-memory MCP server/client backend when `FLEET_TOOL_BACKEND=mcp-inmemory`, while keeping the local backend as the default.

**Architecture:** Add a small backend factory that returns either `LocalToolBackend` or an MCP-backed `ToolBackend`. The MCP path connects `createToolRegistryMcpServer()` to SDK `Client` with `InMemoryTransport`, refreshes tools once, and uses `AsyncLocalStorage<ToolContext>` so each MCP tool call receives the `ToolBus` call context without global mutable state.

**Tech Stack:** TypeScript, Vitest, Electron main process, `@modelcontextprotocol/sdk@1.29.0`, Node `AsyncLocalStorage`.

---

## Scope

This slice only adds an opt-in runtime backend switch. It does not make MCP the default, open network sockets, add external MCP server configuration, or change renderer authority.

## Execution Status

Completed on 2026-06-15:

- Added `app/src/main/tools/tool-backend-factory.ts`.
- Added `createToolBackendRuntime()` with `"local"` and `"mcp-inmemory"` modes.
- Used `AsyncLocalStorage<ToolContext>` to propagate per-call context through the in-memory MCP server.
- Updated `app/src/main/index.ts` so the app defaults to the local backend and switches to MCP only when `FLEET_TOOL_BACKEND=mcp-inmemory`.
- Added `app/tests/unit/tool-backend-factory.test.ts`.

Red verification:

```bash
cd app
npm test -- tests/unit/tool-backend-factory.test.ts
```

Result: exit 1 as expected because `tool-backend-factory.ts` did not exist.

Targeted verification:

```bash
cd app
npm test -- tests/unit/tool-backend-factory.test.ts tests/unit/mcp-registry-server.test.ts tests/unit/mcp-tool-backend.test.ts && npm run typecheck
FLEET_TOOL_BACKEND=mcp-inmemory npm run smoke
```

Result: exit 0; 3 unit test files and 6 tests passed; typecheck passed; MCP-backend smoke reported 5 passed and 1 skipped.

Full verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=mcp-inmemory npm run smoke && npm run pack && npm audit --json && FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: exit 0; typecheck passed; lint passed; `npm test` reported 24 test files and 59 tests passing; protocol tests reported 2 files and 4 tests passing; build passed; default smoke reported 5 passed and 1 skipped; MCP-backend smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities across 698 dependencies; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

## File Structure

- Create `app/src/main/tools/tool-backend-factory.ts`: local/MCP backend factory and lifecycle close hook.
- Modify `app/src/main/index.ts`: select backend mode from `FLEET_TOOL_BACKEND` and close the runtime backend on app quit.
- Create `app/tests/unit/tool-backend-factory.test.ts`: prove local default behavior and MCP in-memory context propagation.

---

### Task 1: Backend Factory

- [x] **Step 1: Write the failing tests**

Create `app/tests/unit/tool-backend-factory.test.ts` with:

```ts
import { describe, expect, test } from "vitest";
import { Type } from "@sinclair/typebox";
import { createToolBackendRuntime } from "../../src/main/tools/tool-backend-factory.js";
import type { ToolContext, ToolSpec, ToolSpecWire } from "../../src/shared/tools.js";

class SingleToolRegistry {
  constructor(private readonly spec: ToolSpec) {}
  get(name: string) { return name === this.spec.name ? this.spec : undefined; }
  wireSpecs(): ToolSpecWire[] {
    return [{ name: this.spec.name, description: this.spec.description, parameters: this.spec.parameters, risk: this.spec.risk }];
  }
}

function ctx(sessionId: string): ToolContext {
  return { workspaceRoot: "/tmp/fleet", sessionId, signal: new AbortController().signal };
}

describe("createToolBackendRuntime", () => {
  test("uses the local backend by default", async () => {
    const tool: ToolSpec<{ value: string }> = {
      name: "demo.echo",
      description: "echo local",
      parameters: Type.Object({ value: Type.String() }),
      risk: "safe",
      async run(args, toolCtx) {
        return { ok: true, result: `${toolCtx.sessionId}:${args.value}` };
      }
    };

    const runtime = await createToolBackendRuntime({ mode: "local", registry: new SingleToolRegistry(tool) });
    try {
      expect(runtime.mode).toBe("local");
      await expect(runtime.backend.run("demo.echo", { value: "ok" }, ctx("s_local"))).resolves.toEqual({ ok: true, result: "s_local:ok" });
    } finally {
      await runtime.close();
    }
  });

  test("routes tools through in-memory MCP and preserves per-call context", async () => {
    const tool: ToolSpec<{ value: string }> = {
      name: "demo.echo",
      description: "echo mcp",
      parameters: Type.Object({ value: Type.String() }),
      risk: "safe",
      async run(args, toolCtx) {
        return { ok: true, result: `${toolCtx.sessionId}:${args.value}` };
      }
    };

    const runtime = await createToolBackendRuntime({ mode: "mcp-inmemory", registry: new SingleToolRegistry(tool) });
    try {
      expect(runtime.mode).toBe("mcp-inmemory");
      expect(runtime.backend.wireSpecs()).toEqual([expect.objectContaining({ name: "demo.echo", risk: "safe" })]);
      await expect(runtime.backend.run("demo.echo", { value: "one" }, ctx("s_one"))).resolves.toEqual({ ok: true, result: "s_one:one" });
      await expect(runtime.backend.run("demo.echo", { value: "two" }, ctx("s_two"))).resolves.toEqual({ ok: true, result: "s_two:two" });
    } finally {
      await runtime.close();
    }
  });
});
```

- [x] **Step 2: Run tests to verify red**

Run:

```bash
cd app
npm test -- tests/unit/tool-backend-factory.test.ts
```

Expected: FAIL because `tool-backend-factory.ts` does not exist.

- [x] **Step 3: Implement minimal factory**

Create `app/src/main/tools/tool-backend-factory.ts` with a `createToolBackendRuntime()` function that supports `"local"` and `"mcp-inmemory"` modes, connects SDK in-memory transports, wraps MCP calls in `AsyncLocalStorage`, and exposes `close()`.

- [x] **Step 4: Run targeted tests**

Run:

```bash
cd app
npm test -- tests/unit/tool-backend-factory.test.ts tests/unit/mcp-registry-server.test.ts tests/unit/mcp-tool-backend.test.ts
npm run typecheck
```

Expected: PASS.

### Task 2: Main Process Wiring

- [x] **Step 1: Modify `app/src/main/index.ts`**

Make `app.whenReady().then()` async, replace direct `new LocalToolBackend(registry)` with:

```ts
const toolBackendRuntime = await createToolBackendRuntime({
  registry,
  mode: process.env.FLEET_TOOL_BACKEND === "mcp-inmemory" ? "mcp-inmemory" : "local"
});
```

Pass `toolBackendRuntime.backend` to `ToolBus`, and close it during `before-quit`.

- [x] **Step 2: Run integration-oriented verification**

Run:

```bash
cd app
npm run typecheck && npm run lint && npm test -- tests/unit/tool-backend-factory.test.ts tests/unit/mcp-registry-server.test.ts tests/unit/mcp-tool-backend.test.ts && npm run smoke
FLEET_TOOL_BACKEND=mcp-inmemory npm run smoke
```

Expected: PASS. The second smoke proves the app path can boot and execute existing smoke flows through the MCP backend.

## Self-Review

- The default runtime remains local.
- The MCP runtime path is opt-in and in-memory only.
- Context propagation is per async call, avoiding shared mutable context.
- Tool approval and denylist logic remain in `ToolBus`.
