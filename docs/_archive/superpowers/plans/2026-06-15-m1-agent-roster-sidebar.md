# M1 Agent Roster Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a real agent roster in the left sidebar: built-in Pi agent plus Claude/Codex/Gemini/Qwen external CLI agents with availability, @ aliases, and current built-in run status.

**Architecture:** Keep detection in main through existing `detectCliTools()` IPC. Add a shared pure helper that converts current built-in status/model and CLI detection results into display rows. `AgentSidebar` fetches CLI detection on mount, renders the roster as read-only state, and leaves interactive team lifecycle for a later slice.

**Tech Stack:** React, Zustand, existing `cli:detect` IPC, Vitest pure unit tests, Playwright smoke.

---

## 参考实现对照

- `源码参考/AionUi/mobile/src/components/chat/ChatSidebar.tsx`：采用“侧栏显式显示会话/agent 元信息，并支持搜索/选择”的 UX 方向。本切片只采用显式列表与 agent 元信息展示，不移植会话历史分组、重命名、删除和搜索。
- `源码参考/AionUi/mobile/src/components/chat/ModePickerSheet.tsx`：采用“可选 agent/mode 列表 + 当前项标识”的模式。本切片把外部 CLI 作为只读 roster row，显示 @ alias 和可用状态，不做弹层选择器。
- `源码参考/AionUi/tests/e2e/cases/teams/team-agent-lifecycle.e2e.ts`：表明完整团队生命周期需要 leader chat 指令、成员 tab、active badge、MCP confirmation 处理。本切片不声称实现团队生命周期，只把名册可见化，为后续成员 tab/active badge 铺路。

未采用原因：AionUi 的团队创建、成员 tab、ACP 会话和确认弹窗依赖更完整的 agent backend。本项目当前只有内置 Pi agent 与 one-shot CLI prompt routing，直接移植完整团队生命周期会过大且缺少底层状态机。

## Scope

This slice does not implement @ autocomplete, agent switching buttons, team creation/removal, persistent external CLI sessions, or per-agent conversation tabs. It makes the currently available agents visible and explains the @mention entry point.

## File Structure

- Create `app/src/shared/agent-roster.ts`: pure roster builder.
- Create `app/tests/unit/agent-roster.test.ts`: roster behavior tests.
- Modify `app/src/renderer/components/AgentSidebar/AgentSidebar.tsx`: fetch CLI detection and render roster rows.
- Modify `app/tests/smoke/launch.spec.ts`: assert sidebar shows the built-in agent and an external CLI row.

---

## Execution Status

Completed on 2026-06-15:

- Added `app/src/shared/agent-roster.ts` as a pure roster projection helper.
- Added `app/tests/unit/agent-roster.test.ts`.
- Updated `app/src/renderer/components/AgentSidebar/AgentSidebar.tsx` to fetch `detectCliTools()` and render built-in/external agent rows.
- Updated smoke coverage so the main chat sidebar must show `@fleet` and `@codex`.
- Kept the helper in `src/shared` rather than renderer because Node-side unit tests and `tsconfig.node.json` cannot safely import renderer store/component modules.

Red verification:

```bash
cd app
npm test -- tests/unit/agent-roster.test.ts
```

Result: exit 1 as expected because `agent-roster.ts` did not exist.

Targeted verification:

```bash
cd app
npm test -- tests/unit/agent-roster.test.ts
npm run typecheck
npm run build
npm run smoke
```

Result: exit 0 after fixing one smoke selector to match the `Fleet` title exactly; roster unit tests reported 1 file and 2 tests passing; typecheck passed; build passed; smoke reported 5 passed and 1 skipped.

Full verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=mcp-inmemory npm run smoke && npm run pack && npm audit --json && FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: exit 0; typecheck passed; lint passed; `npm test` reported 27 test files and 69 tests passing; protocol tests reported 2 files and 4 tests passing; build passed; default smoke reported 5 passed and 1 skipped; MCP-backend smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities across 698 dependencies; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

### Task 1: Roster Builder

- [x] **Step 1: Write failing pure tests**

Create `app/tests/unit/agent-roster.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { buildAgentRoster } from "../../src/shared/agent-roster.js";

describe("buildAgentRoster", () => {
  test("includes the built-in agent first with current model and status", () => {
    expect(buildAgentRoster({
      builtInStatus: "thinking",
      builtInModel: "gemma4:12b",
      cliTools: []
    })[0]).toEqual({
      id: "builtin",
      label: "内置智能体",
      kind: "builtin",
      statusLabel: "思考中",
      available: true,
      detail: "gemma4:12b",
      mention: "@fleet"
    });
  });

  test("adds external CLI rows with aliases and availability", () => {
    const rows = buildAgentRoster({
      builtInStatus: "idle",
      builtInModel: "",
      cliTools: [
        { id: "codex", label: "Codex", command: "codex", available: true, path: "/usr/local/bin/codex" },
        { id: "qwen", label: "Qwen Code", command: "qwen", available: false }
      ]
    });

    expect(rows.slice(1)).toEqual([
      expect.objectContaining({ id: "codex", kind: "external-cli", mention: "@codex", available: true, statusLabel: "可用", detail: "/usr/local/bin/codex" }),
      expect.objectContaining({ id: "qwen", kind: "external-cli", mention: "@qwen", available: false, statusLabel: "未检测到", detail: "qwen" })
    ]);
  });
});
```

- [x] **Step 2: Run red**

Run:

```bash
cd app
npm test -- tests/unit/agent-roster.test.ts
```

Expected: FAIL because `agent-roster.ts` does not exist.

- [x] **Step 3: Implement roster builder**

Create the pure helper with stable status labels and CLI aliases.

### Task 2: Sidebar Rendering

- [x] **Step 1: Wire sidebar**

Update `AgentSidebar.tsx` to call `window.fleet.detectCliTools()` on mount, build roster rows, and render each row with label, detail, @ alias, and status.

- [x] **Step 2: Smoke assertion**

Update smoke to assert `内置智能体`, `@fleet`, and at least one external alias such as `@codex` appear in the sidebar.

- [x] **Step 3: Target verification**

Run:

```bash
cd app
npm test -- tests/unit/agent-roster.test.ts
npm run typecheck
npm run build
npm run smoke
```

Expected: PASS.

### Task 3: Full Verification

- [x] **Step 1: Full verification**

Run:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=mcp-inmemory npm run smoke && npm run pack && npm audit --json
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Expected: PASS.

## Self-Review

- Uses existing main-process detection; renderer does not inspect PATH.
- Makes @mention affordances visible without claiming full multi-agent lifecycle.
- Keeps status source from existing EventStream/Zustand projection.
