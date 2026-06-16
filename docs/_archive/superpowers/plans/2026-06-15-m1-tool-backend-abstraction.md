# M1 Tool Backend Abstraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split ToolBus policy/lifecycle handling from the concrete local registry backend so a future MCP backend can be introduced behind the same interface.

**Architecture:** `ToolBus` keeps approval, denylist, logging, and EventStream lifecycle ownership. A new `ToolBackend` interface owns tool discovery, spec lookup, and raw execution. `LocalToolBackend` adapts the current internal `ToolRegistry`; a later MCP backend can implement the same interface.

**Tech Stack:** TypeScript, Vitest, Electron main process.

---

## Execution Status

Completed on 2026-06-15:

- Added `app/src/main/tools/tool-backend.ts`.
- Added `ToolBackend` interface with `wireSpecs`, `getSpec`, and `run`.
- Added `LocalToolBackend` wrapper for the current `ToolRegistry`.
- Updated `ToolBus` to depend on `ToolBackend` instead of the registry directly.
- Updated main-process composition to create `LocalToolBackend` and inject it into `ToolBus`.
- Added `app/tests/unit/tool-backend.test.ts`.

Targeted verification:

```bash
cd app
npm test -- tests/unit/tool-backend.test.ts tests/unit/tool-bus.test.ts tests/unit/agent-tool-policy.test.ts tests/unit/agent-cancel.test.ts
npm run typecheck
```

Result: exit 0; 4 test files and 6 tests passed; typecheck passed.

Full verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && npm run pack && npm audit --json
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: normal verification exit 0; `npm test` reported 21 test files and 53 tests passing; protocol tests reported 2 files and 4 tests passing; normal smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

---

## Scope

This slice does not add the MCP SDK, sockets, or remote tool servers. It creates the backend seam needed for that work.

## File Structure

- Create `app/src/main/tools/tool-backend.ts`: backend interface and local registry adapter.
- Modify `app/src/main/tools/tool-bus.ts`: depend on `ToolBackend`.
- Modify `app/src/main/index.ts`: wire `LocalToolBackend`.
- Modify `app/tests/unit/tool-bus.test.ts`: mock backend instead of registry.
- Create `app/tests/unit/tool-backend.test.ts`: verify local backend behavior.

---

### Task 1: Backend Interface

- [x] **Step 1: Write failing backend tests**

Cover wire specs, spec lookup, successful run, and missing-tool error.

- [x] **Step 2: Run tests to verify failure**

```bash
cd app
npm test -- tests/unit/tool-backend.test.ts
```

Expected: FAIL because `tool-backend.ts` does not exist.

- [x] **Step 3: Implement `ToolBackend` and `LocalToolBackend`**

`LocalToolBackend` adapts the existing registry without changing tool behavior.

- [x] **Step 4: Run targeted verification**

```bash
cd app
npm test -- tests/unit/tool-backend.test.ts
npm run typecheck
```

Expected: PASS.

### Task 2: ToolBus Integration

- [x] **Step 1: Replace ToolBus registry dependency**

`ToolBus` now calls `backend.wireSpecs`, `backend.getSpec`, and `backend.run`.

- [x] **Step 2: Wire local backend in main**

Main process creates `new LocalToolBackend(registry)` and passes it to `ToolBus`.

- [x] **Step 3: Update unit tests**

ToolBus tests mock the backend interface.

- [x] **Step 4: Run targeted verification**

```bash
cd app
npm test -- tests/unit/tool-backend.test.ts tests/unit/tool-bus.test.ts tests/unit/agent-tool-policy.test.ts tests/unit/agent-cancel.test.ts
npm run typecheck
```

Expected: PASS.

## Self-Review

- No renderer authority changed.
- No agent protocol changed.
- The new backend seam is intentionally small and matches the minimum required for MCP replacement later.
