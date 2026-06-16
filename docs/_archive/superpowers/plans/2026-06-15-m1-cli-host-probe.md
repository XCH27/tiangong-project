# M1 CLI Host Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first external CLI hosting primitive: run a bounded version probe for a detected CLI from Electron main, return stdout/stderr/exit status to the UI, and enforce timeout/truncation.

**Architecture:** Keep process execution in Electron main. Reuse `cli-detect` to resolve a known tool id to an executable path, then run a short child process probe through a dedicated `cli-session` module. Expose only a typed `cli:probe` IPC method; renderer can request a probe but cannot provide arbitrary shell commands or paths.

**Tech Stack:** Electron main IPC, Node `child_process.spawn`, TypeScript, zod, React, Vitest.

---

## Execution Status

Completed on 2026-06-15:

- Added `runCliProbe`, a bounded main-process child runner for external CLI version probes.
- Added timeout kill behavior, stdout/stderr capture, exit-code reporting, duration reporting, and output truncation.
- Added typed `cli:probe` IPC so renderer can probe only known CLI ids, not arbitrary commands or paths.
- Added Settings UI controls to run a version probe for detected external CLIs.
- Added unit coverage for probe execution, timeout behavior, and probe IPC schemas.

Fresh verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && npm run pack && npm audit --json
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: normal verification exit 0; `npm test` reported 17 test files and 43 tests passing; protocol tests reported 2 files and 4 tests passing; normal smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

---

## Scope

This slice implements:

- a reusable bounded child-process runner for CLI probes
- `cli:probe` IPC for known tool ids only
- Settings UI buttons for checking detected CLI versions
- tests for output capture, timeout kill, and IPC schemas

Out of scope:

- interactive pseudo-terminal hosting
- `node-pty`
- streaming terminal panes
- Claude/Codex-specific prompt protocols
- MCP tool injection
- using external CLI output as agent messages

## File Structure

- Create `app/src/main/cli/cli-session.ts`: bounded child-process runner with timeout and output truncation.
- Modify `app/src/shared/ipc-contract.ts`: add `cli:probe` request/result schemas and bridge method type.
- Modify `app/src/main/ipc/handlers.ts`: resolve known CLI id and run the version probe.
- Modify `app/src/preload/index.ts`: expose `probeCliTool`.
- Modify `app/src/renderer/components/Settings/Settings.tsx`: add version probe buttons and status text.
- Create `app/tests/unit/cli-session.test.ts`: verify output capture and timeout behavior.
- Modify `app/tests/unit/cli-ipc-contract.test.ts`: verify probe request/result schemas.

---

### Task 1: Bounded CLI Probe Runner

**Files:**
- Create: `app/src/main/cli/cli-session.ts`
- Create: `app/tests/unit/cli-session.test.ts`

- [x] **Step 1: Write failing tests**

Create tests that run `process.execPath` with short `-e` scripts:

```ts
import { describe, expect, test } from "vitest";
import { runCliProbe } from "../../src/main/cli/cli-session.js";

describe("runCliProbe", () => {
  test("captures stdout, stderr, exit code, and duration", async () => {
    const result = await runCliProbe({
      commandPath: process.execPath,
      args: ["-e", "console.log('fleet-out'); console.error('fleet-err')"],
      timeoutMs: 2000
    });

    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
    expect(result.stdout).toContain("fleet-out");
    expect(result.stderr).toContain("fleet-err");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  test("kills probes that exceed timeout", async () => {
    const result = await runCliProbe({
      commandPath: process.execPath,
      args: ["-e", "setTimeout(() => {}, 5000)"],
      timeoutMs: 50
    });

    expect(result.timedOut).toBe(true);
    expect(result.exitCode).toBeNull();
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run:

```bash
cd app
npm test -- tests/unit/cli-session.test.ts
```

Expected: FAIL because `cli-session.ts` does not exist.

- [x] **Step 3: Implement `runCliProbe`**

Implement a non-shell `spawn(commandPath, args)` runner. It must:

- default `timeoutMs` to 3000
- default output limit to 16384 characters
- collect stdout/stderr
- kill on timeout
- resolve once with `{ exitCode, stdout, stderr, timedOut, durationMs }`

- [x] **Step 4: Run targeted verification**

Run:

```bash
cd app
npm test -- tests/unit/cli-session.test.ts
npm run typecheck
```

Expected: PASS.

---

### Task 2: Typed Probe IPC

**Files:**
- Modify: `app/src/shared/ipc-contract.ts`
- Modify: `app/src/main/ipc/handlers.ts`
- Modify: `app/src/preload/index.ts`
- Modify: `app/tests/unit/cli-ipc-contract.test.ts`

- [x] **Step 1: Add failing schema tests**

Extend `cli-ipc-contract.test.ts` to assert:

```ts
CliProbeReqSchema.parse({ id: "codex" })
CliProbeResultSchema.parse({ available: true, exitCode: 0, stdout: "x", stderr: "", timedOut: false, durationMs: 1 })
CliProbeResultSchema.parse({ available: false, message: "未检测到 Codex" })
```

and reject unknown ids.

- [x] **Step 2: Run the test to verify it fails**

Run:

```bash
cd app
npm test -- tests/unit/cli-ipc-contract.test.ts
```

Expected: FAIL because probe schemas do not exist.

- [x] **Step 3: Add schemas and bridge method**

Add:

```ts
cliProbe: "cli:probe"
CliProbeReqSchema = z.object({ id: CliToolIdSchema })
CliProbeResultSchema = z.discriminatedUnion("available", [...])
probeCliTool(req: CliProbeReq): Promise<CliProbeResult>
```

- [x] **Step 4: Register handler and preload**

`handlers.ts` must:

- parse `CliProbeReqSchema`
- call `detectCliTools()`
- reject unavailable tools with `{ available:false, message }`
- call `runCliProbe({ commandPath: tool.path, args:["--version"] })`

`preload/index.ts` must expose `probeCliTool`.

- [x] **Step 5: Run targeted verification**

Run:

```bash
cd app
npm test -- tests/unit/cli-ipc-contract.test.ts
npm run typecheck
```

Expected: PASS.

---

### Task 3: Settings Probe UI

**Files:**
- Modify: `app/src/renderer/components/Settings/Settings.tsx`

- [x] **Step 1: Render probe controls**

For each CLI row, render a `版本` button when available. Clicking calls `window.fleet.probeCliTool({ id: tool.id })` and stores per-tool result text.

- [x] **Step 2: Handle unavailable state**

For unavailable tools, do not render a probe button. Keep the existing `未检测到` status.

- [x] **Step 3: Run full verification**

Run:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke
```

Expected: PASS.

## Self-Review

- This is aligned with M1 because it begins external CLI hosting but does not claim interactive adapter completion.
- The renderer cannot execute arbitrary commands; it can only probe known detected tool ids.
- Timeout and output limits are required because external CLIs are untrusted from the app's perspective.
