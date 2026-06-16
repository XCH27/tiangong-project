# M1 Tool Bus Facade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a local tool bus facade so agent protocol handling no longer owns registry lookup, approval decisions, denylist enforcement, tool execution, and tool logging directly.

**Architecture:** Keep M1 on the internal registry, but place a `ToolBus` facade between `AgentManager` and the registry. The facade exposes MCP-shaped wire specs and a single call path that emits EventStream lifecycle events. Later M1 work can swap this facade's backend to an MCP client/server without changing agent subprocess protocol handling.

**Tech Stack:** TypeScript, Vitest, Electron main process.

---

## Execution Status

Completed on 2026-06-15:

- Added `app/src/main/tools/tool-bus.ts`.
- `ToolBus` now owns tool requested/approved/rejected/completed events, denylist pre-checks, approval requests, execution, and tool-call logging.
- `AgentManager` now depends on `ToolBus` instead of `ToolRegistry` and `ApprovalManager`.
- Main process now wires `ToolRegistry + ApprovalManager + EventStore + ConfigStore` into `ToolBus`.
- Updated AgentManager unit tests to verify protocol forwarding through the bus.
- Added `app/tests/unit/tool-bus.test.ts`.

Targeted verification:

```bash
cd app
npm test -- tests/unit/tool-bus.test.ts tests/unit/agent-tool-policy.test.ts tests/unit/agent-cancel.test.ts
npm run typecheck
```

Result: exit 0; 3 test files and 5 tests passed; typecheck passed.

Full verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && npm run pack && npm audit --json
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: normal verification exit 0; `npm test` reported 20 test files and 52 tests passing; protocol tests reported 2 files and 4 tests passing; normal smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

---

## Scope

This slice does not introduce the MCP SDK or a socket server. It creates the internal interface that can later be backed by MCP.

## File Structure

- Create `app/src/main/tools/tool-bus.ts`: local tool bus facade.
- Modify `app/src/main/agent/agent-manager.ts`: call the bus instead of handling tool policy directly.
- Modify `app/src/main/index.ts`: instantiate and inject the bus.
- Modify `app/tests/unit/agent-tool-policy.test.ts`: update expectations around AgentManager's responsibility.
- Modify `app/tests/unit/agent-cancel.test.ts`: update constructor deps.
- Create `app/tests/unit/tool-bus.test.ts`: verify list/call/denylist behavior.

---

### Task 1: ToolBus Unit Coverage

- [x] **Step 1: Write failing tests**

Cover wire specs, safe-tool auto approval, and pre-approval denylist rejection.

- [x] **Step 2: Run tests to verify failure**

```bash
cd app
npm test -- tests/unit/tool-bus.test.ts
```

Expected: FAIL because `tool-bus.ts` does not exist.

- [x] **Step 3: Implement ToolBus**

Add a local facade around `ToolRegistry`, `ApprovalManager`, event append, and tool logging.

- [x] **Step 4: Run targeted tests**

```bash
cd app
npm test -- tests/unit/tool-bus.test.ts
npm run typecheck
```

Expected: PASS.

### Task 2: AgentManager Integration

- [x] **Step 1: Replace direct registry usage**

`AgentManager` uses `toolBus.wireSpecs()` for agent startup and `toolBus.call()` for tool calls.

- [x] **Step 2: Wire ToolBus in main**

Main process creates `ToolBus` after `ToolRegistry`, `ApprovalManager`, and `EventStore`.

- [x] **Step 3: Update unit tests**

AgentManager tests mock `toolBus` instead of registry/approvals.

- [x] **Step 4: Run targeted verification**

```bash
cd app
npm test -- tests/unit/tool-bus.test.ts tests/unit/agent-tool-policy.test.ts tests/unit/agent-cancel.test.ts
npm run typecheck
```

Expected: PASS.

## Self-Review

- Agent subprocess protocol did not change.
- Renderer authority did not widen.
- Tool policy became easier to replace with MCP later because the caller now depends on one facade.
