# M1 CLI Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first M1 shell capability: detect optional external coding CLIs and show their availability in the desktop UI without hosting them yet.

**Architecture:** Keep detection in Electron main because it reads PATH and filesystem state. Expose results through a typed shared IPC contract and preload bridge. Renderer displays the result as read-only capability status; no pseudo-terminal hosting, MCP wiring, or @ routing is introduced in this slice.

**Tech Stack:** Electron main IPC, TypeScript, zod, React, Vitest, Playwright Electron smoke.

---

## Execution Status

Completed on 2026-06-15:

- Added main-process external CLI detection for Claude Code, Codex, Gemini CLI, and Qwen Code.
- Exposed detection through typed shared IPC and the preload bridge as `window.fleet.detectCliTools()`.
- Rendered the detection result in Settings under `外部 CLI`.
- Extended smoke coverage so Settings must render the external CLI section.

Fresh verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && npm run pack && npm audit --json
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: normal verification exit 0; `npm test` reported 16 test files and 39 tests passing; protocol tests reported 2 files and 4 tests passing; normal smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

---

## Scope

This implements only detection for:

- `claude` as Claude Code
- `codex` as Codex
- `gemini` as Gemini CLI
- `qwen` as Qwen Code

Out of scope for this slice:

- spawning or hosting any external CLI
- `node-pty`
- MCP server/client
- @ mention routing
- per-agent configuration
- context-mode integration

## File Structure

- Create `app/src/main/cli/cli-detect.ts`: pure-ish detector that accepts an injectable environment and filesystem adapter for tests.
- Modify `app/src/shared/ipc-contract.ts`: add `cli:detect` channel, schemas, and bridge method types.
- Modify `app/src/main/ipc/handlers.ts`: register `cli:detect` handler.
- Modify `app/src/preload/index.ts`: expose `detectCliTools`.
- Modify `app/src/renderer/components/Settings/Settings.tsx`: show external CLI capability status.
- Create `app/tests/unit/cli-detect.test.ts`: test PATH detection, missing tools, and common install fallback.
- Create `app/tests/unit/cli-ipc-contract.test.ts`: test result schema shape.
- Modify `app/tests/smoke/launch.spec.ts`: assert Settings can render the external CLI section.

---

### Task 1: Main-Side CLI Detector

**Files:**
- Create: `app/src/main/cli/cli-detect.ts`
- Create: `app/tests/unit/cli-detect.test.ts`

- [x] **Step 1: Write the failing detector test**

Create `app/tests/unit/cli-detect.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { detectCliTools } from "../../src/main/cli/cli-detect.js";

describe("detectCliTools", () => {
  test("marks tools available when their executable exists on PATH", async () => {
    const result = await detectCliTools({
      env: { PATH: "/bin:/opt/dev/bin" },
      platform: "darwin",
      access: async (file) => file === "/opt/dev/bin/codex" || file === "/opt/dev/bin/claude"
    });

    expect(result.tools.find((tool) => tool.id === "codex")).toMatchObject({
      id: "codex",
      label: "Codex",
      command: "codex",
      available: true,
      path: "/opt/dev/bin/codex"
    });
    expect(result.tools.find((tool) => tool.id === "claude")).toMatchObject({
      id: "claude",
      label: "Claude Code",
      available: true,
      path: "/opt/dev/bin/claude"
    });
  });

  test("marks tools unavailable when no candidate executable exists", async () => {
    const result = await detectCliTools({
      env: { PATH: "/bin" },
      platform: "darwin",
      access: async () => false
    });

    expect(result.tools).toHaveLength(4);
    expect(result.tools.every((tool) => !tool.available)).toBe(true);
  });

  test("checks common macOS install directories after PATH", async () => {
    const result = await detectCliTools({
      env: { PATH: "/bin" },
      platform: "darwin",
      access: async (file) => file === "/opt/homebrew/bin/gemini"
    });

    expect(result.tools.find((tool) => tool.id === "gemini")).toMatchObject({
      available: true,
      path: "/opt/homebrew/bin/gemini"
    });
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run:

```bash
cd app
npm test -- tests/unit/cli-detect.test.ts
```

Expected: FAIL because `cli-detect.ts` does not exist.

- [x] **Step 3: Implement the detector**

Create `app/src/main/cli/cli-detect.ts`:

```ts
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import * as path from "node:path";

export type CliToolId = "claude" | "codex" | "gemini" | "qwen";

export interface CliToolStatus {
  id: CliToolId;
  label: string;
  command: string;
  available: boolean;
  path?: string;
}

export interface CliDetectionResult {
  tools: CliToolStatus[];
}

export interface CliDetectInput {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  access?: (file: string) => Promise<boolean>;
}

const TOOL_DEFS: Array<{ id: CliToolId; label: string; command: string }> = [
  { id: "claude", label: "Claude Code", command: "claude" },
  { id: "codex", label: "Codex", command: "codex" },
  { id: "gemini", label: "Gemini CLI", command: "gemini" },
  { id: "qwen", label: "Qwen Code", command: "qwen" }
];

function pathEntries(env: NodeJS.ProcessEnv): string[] {
  return (env.PATH ?? "")
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function commonDirs(platform: NodeJS.Platform): string[] {
  if (platform === "win32") {
    return [];
  }
  return ["/opt/homebrew/bin", "/usr/local/bin"];
}

async function defaultAccess(file: string): Promise<boolean> {
  try {
    await access(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function detectCliTools(input: CliDetectInput = {}): Promise<CliDetectionResult> {
  const env = input.env ?? process.env;
  const platform = input.platform ?? process.platform;
  const canAccess = input.access ?? defaultAccess;
  const dirs = [...pathEntries(env), ...commonDirs(platform)];

  const tools = await Promise.all(TOOL_DEFS.map(async (tool): Promise<CliToolStatus> => {
    for (const dir of dirs) {
      const candidate = path.join(dir, platform === "win32" ? `${tool.command}.cmd` : tool.command);
      if (await canAccess(candidate)) {
        return { ...tool, available: true, path: candidate };
      }
    }
    return { ...tool, available: false };
  }));

  return { tools };
}
```

- [x] **Step 4: Run targeted verification**

Run:

```bash
cd app
npm test -- tests/unit/cli-detect.test.ts
npm run typecheck
```

Expected: PASS.

---

### Task 2: Typed IPC And Preload Bridge

**Files:**
- Modify: `app/src/shared/ipc-contract.ts`
- Modify: `app/src/main/ipc/handlers.ts`
- Modify: `app/src/preload/index.ts`
- Create: `app/tests/unit/cli-ipc-contract.test.ts`

- [x] **Step 1: Write the failing contract test**

Create `app/tests/unit/cli-ipc-contract.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { CliDetectionResultSchema } from "../../src/shared/ipc-contract.js";

describe("CLI IPC contract", () => {
  test("validates CLI detection results", () => {
    const parsed = CliDetectionResultSchema.parse({
      tools: [
        { id: "codex", label: "Codex", command: "codex", available: true, path: "/opt/homebrew/bin/codex" },
        { id: "qwen", label: "Qwen Code", command: "qwen", available: false }
      ]
    });

    expect(parsed.tools[0]?.available).toBe(true);
    expect(parsed.tools[1]?.available).toBe(false);
  });

  test("rejects unknown tool ids", () => {
    expect(() => CliDetectionResultSchema.parse({
      tools: [{ id: "unknown", label: "Unknown", command: "unknown", available: false }]
    })).toThrow();
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run:

```bash
cd app
npm test -- tests/unit/cli-ipc-contract.test.ts
```

Expected: FAIL because `CliDetectionResultSchema` is not exported.

- [x] **Step 3: Add the shared IPC contract**

In `app/src/shared/ipc-contract.ts`:

```ts
export const CH = {
  ...
  cliDetect: "cli:detect",
  ...
} as const;

export const CliToolIdSchema = z.enum(["claude", "codex", "gemini", "qwen"]);
export const CliToolStatusSchema = z.object({
  id: CliToolIdSchema,
  label: z.string().min(1),
  command: z.string().min(1),
  available: z.boolean(),
  path: z.string().min(1).optional()
});
export const CliDetectionResultSchema = z.object({
  tools: z.array(CliToolStatusSchema)
});
export type CliDetectionResult = z.infer<typeof CliDetectionResultSchema>;

export interface FleetBridge {
  ...
  detectCliTools(): Promise<CliDetectionResult>;
  ...
}
```

- [x] **Step 4: Register the main handler and preload method**

In `app/src/main/ipc/handlers.ts`, import `detectCliTools` from `../cli/cli-detect.js` and register:

```ts
ipcMain.handle(CH.cliDetect, async () => detectCliTools());
```

In `app/src/preload/index.ts`, add:

```ts
detectCliTools: () => ipcRenderer.invoke(CH.cliDetect),
```

- [x] **Step 5: Run targeted verification**

Run:

```bash
cd app
npm test -- tests/unit/cli-ipc-contract.test.ts
npm run typecheck
```

Expected: PASS.

---

### Task 3: Settings UI Status

**Files:**
- Modify: `app/src/renderer/components/Settings/Settings.tsx`
- Modify: `app/tests/smoke/launch.spec.ts`

- [x] **Step 1: Write the failing smoke assertion**

In `app/tests/smoke/launch.spec.ts`, update the settings smoke test so it opens Settings and asserts that the text `外部 CLI` is visible.

- [x] **Step 2: Run smoke to verify it fails**

Run:

```bash
cd app
npm run build
npm run smoke -- tests/smoke/launch.spec.ts
```

Expected: FAIL because Settings does not render the external CLI section.

- [x] **Step 3: Render external CLI status in Settings**

In `Settings.tsx`, call `window.fleet.detectCliTools()` on mount and render one row per tool:

```tsx
const [cliTools, setCliTools] = useState<CliDetectionResult["tools"]>([]);

useEffect(() => {
  let alive = true;
  void window.fleet.detectCliTools().then((result) => {
    if (alive) setCliTools(result.tools);
  });
  return () => { alive = false; };
}, []);
```

Render:

```tsx
<section style={{ marginTop: 16 }}>
  <h4>外部 CLI</h4>
  {cliTools.map((tool) => (
    <div key={tool.id}>
      {tool.label}：{tool.available ? `已检测到 ${tool.path}` : "未检测到"}
    </div>
  ))}
</section>
```

- [x] **Step 4: Run targeted and full verification**

Run:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke
```

Expected: PASS.

## Self-Review

- Spec coverage: this plan implements only external CLI detection and UI surfacing, matching the first M1 prerequisite from `docs/技术选型与架构.md` §3.
- Placeholder scan: no placeholder implementation steps remain.
- Type consistency: `CliDetectionResult` is defined in the shared IPC contract and reused by renderer state.
