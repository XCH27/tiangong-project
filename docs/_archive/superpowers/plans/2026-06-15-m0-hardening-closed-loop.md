# M0 Hardening And Closed Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current M0 Electron scaffold from "launches and compiles" into a verified local agent loop with pre-execution safety checks, runtime IPC validation, cancellation evidence, and a fuller smoke path.

**Architecture:** Keep the M0 architecture from `docs/M0-实施规范.md`: renderer projects EventStream, main owns fs/shell/config/secrets, and the Pi child process only requests tools over JSONL. This plan does not introduce MCP, browser automation, external CLI hosting, IM, git worktrees, or multi-agent orchestration.

**Tech Stack:** Electron, electron-vite, React, Zustand, TypeScript, zod, Vitest, Playwright Electron, pi-agent-core/pi-ai.

---

## Execution Status

Completed on 2026-06-15:

- Shell deny policy now exposes an explanatory decision API and `AgentManager` rejects denied `shell.run` calls before approval.
- IPC request contracts now have zod schemas and main handlers parse renderer input at runtime.
- `AgentManager.cancel` now emits `agent.failed{cancelled:true}` evidence from main.
- Smoke launches with a temporary user data directory, verifies the preload bridge, and no longer depends on generic `Electron` app state.
- Electron app name is set to `Fleet` before stores initialize.

Fresh verification after these changes:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke
```

Result: exit 0; `npm test` reported 9 test files and 25 tests passing; smoke reported 1 Playwright test passing.

Completed in the next execution slice:

- Onboarding now supports manual workspace path entry, which is useful for smoke automation and for users who prefer pasting a path.
- The agent subprocess supports `FLEET_FAUX_TOOL=1`, a test-only faux path that still requests `shell.run` through the real main-process tool/approval pipeline.
- Main now resolves `agent.js` relative to the built main bundle directory instead of composing `app.getAppPath()/out/main/agent.js`, fixing direct `out/main/index.js` launches.
- `AgentManager` now emits a visible `spawn_error` failure if the child process cannot start or exits abnormally before a terminal event.
- Smoke now verifies the closed loop: onboarding configuration -> chat send -> approval dialog -> approve -> `tool.completed` card -> assistant completion message.

Fresh verification after this second slice:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke
```

Result: exit 0; `npm test` reported 9 test files and 25 tests passing; smoke reported 2 Playwright tests passing.

Completed in the local-model execution slice:

- Added Ollama model discovery through `ollama:models`, backed by a tested parser for Ollama `/api/tags`.
- Onboarding now supports direct model ID editing and auto-fills the first discovered local Ollama model when available.
- Added an opt-in real Ollama Playwright smoke (`tests/smoke/ollama-real.spec.ts`) that is skipped by default and enabled with `FLEET_REAL_OLLAMA=1`.
- Verified this machine's real local Ollama path using `gemma4:12b` through the desktop UI.

Fresh verification after this third slice:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: normal verification exit 0; `npm test` reported 10 test files and 27 tests passing; normal smoke reported 2 passed and 1 skipped; real Ollama smoke reported 1 passed.

Completed in the reliability execution slice:

- Retry now reuses the previous prompt instead of relying on the emptied composer input.
- Added `FLEET_FAUX_FAIL=1` to produce a deterministic model failure for failure-banner and retry smoke coverage.
- Added `FLEET_FAUX_SLOW=1` to hold a run open long enough for deterministic cancel smoke coverage.
- Added smoke coverage for failure retry, run cancellation, and disabling tool-call logging from Settings.
- Added unit coverage for tool logging, including secret redaction and disabled logging.

Fresh verification after this fourth slice:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: normal verification exit 0; `npm test` reported 11 test files and 29 tests passing; normal smoke reported 5 passed and 1 skipped; real Ollama smoke reported 1 passed.

Completed in the packaging and audit execution slice:

- Added package metadata and Electron Builder configuration for local packaged builds: product name, app id, release output directory, asar packaging, and unpacking for the agent subprocess entrypoint.
- Added contract coverage for packaging metadata so future changes do not silently remove `pack`, `dist`, `asarUnpack`, or packaged app file inclusion.
- Added a renderer CSP meta tag that keeps the local UI self-contained while allowing Ollama discovery on `localhost:11434` and `127.0.0.1:11434`.
- Added a tested `resolveAgentPath` helper so dev builds load `out/main/agent.js` and packaged builds load the unpacked agent entrypoint from `process.resourcesPath`.
- Upgraded the Electron/Vite/Vitest toolchain and added an `esbuild` override to clear the dependency audit.
- Verified `npm run pack` builds `release/mac-arm64/Fleet.app`. The current unsigned development package still uses Electron Builder's default icon and skips macOS code signing because no Developer ID certificate is configured.

Fresh verification after this fifth slice:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && npm run pack
npm audit --json
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: normal verification exit 0; `npm test` reported 14 test files and 34 tests passing; normal smoke reported 5 passed and 1 skipped; `npm run pack` completed and produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities; real Ollama smoke reported 1 passed.

## Scope

This plan advances M0 only. It deliberately avoids M1/M2/M3 features and focuses on gaps already visible in current code and docs:

- Denied shell commands must be rejected before approval UI.
- Main-side IPC handlers must parse untrusted renderer input at runtime.
- Cancellation must have testable `agent.failed{cancelled:true}` evidence.
- Smoke coverage must verify more than the onboarding heading.
- Electron app identity and smoke state must be isolated from the generic `Electron` app data directory.

## File Structure

- Modify `app/src/shared/ipc-contract.ts`: add zod request schemas next to existing TypeScript interfaces.
- Modify `app/src/main/ipc/handlers.ts`: parse every IPC request using the shared schemas before calling main services.
- Modify `app/src/main/security/shell-policy.ts`: expose a policy result that can explain why a command is denied.
- Modify `app/src/main/agent/agent-manager.ts`: reject denied `shell.run` before approval and emit cancellation failure when main cancels a run.
- Modify `app/src/main/index.ts`: set application name before `ConfigStore` initializes.
- Modify `app/tests/unit/shell-policy.test.ts`: cover the explanatory deny API.
- Create `app/tests/unit/ipc-contract.test.ts`: prove IPC schemas reject malformed requests.
- Modify `app/tests/protocol/agent-faux.test.ts`: add cancellation evidence if test harness can drive it directly.
- Modify `app/tests/smoke/launch.spec.ts`: launch with a temporary user data directory and verify onboarding plus bridge availability.

---

### Task 1: Pre-Approval Shell Deny Policy

**Files:**
- Modify: `app/src/main/security/shell-policy.ts`
- Modify: `app/src/main/agent/agent-manager.ts`
- Modify: `app/tests/unit/shell-policy.test.ts`

- [ ] **Step 1: Write the failing policy test**

Add this test case to `app/tests/unit/shell-policy.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { explainDeniedCommand, isDenied, shellNeedsApproval } from "../../src/main/security/shell-policy.js";

describe("shell policy", () => {
  test("explains denied commands before approval", () => {
    expect(explainDeniedCommand("sudo rm -rf /")).toEqual({
      denied: true,
      code: "tool_error",
      message: "命令命中安全 denylist，已拒绝执行"
    });
  });

  test("allows non-denied commands to continue to approval", () => {
    expect(explainDeniedCommand("pwd")).toEqual({ denied: false });
    expect(isDenied("pwd")).toBe(false);
    expect(shellNeedsApproval()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd app
npm test -- tests/unit/shell-policy.test.ts
```

Expected: FAIL because `explainDeniedCommand` is not exported.

- [ ] **Step 3: Implement the minimal policy API**

In `app/src/main/security/shell-policy.ts`, keep `isDenied` and add:

```ts
export type ShellPolicyDecision =
  | { denied: true; code: "tool_error"; message: string }
  | { denied: false };

export function explainDeniedCommand(command: string): ShellPolicyDecision {
  if (!isDenied(command)) return { denied: false };
  return { denied: true, code: "tool_error", message: "命令命中安全 denylist，已拒绝执行" };
}
```

- [ ] **Step 4: Reject denied shell.run before approval**

In `app/src/main/agent/agent-manager.ts`, import `explainDeniedCommand` and insert this branch immediately after `spec` is found and before `approvals.request(...)`:

```ts
if (name === "shell.run" && args && typeof args === "object" && "command" in args) {
  const policy = explainDeniedCommand(String((args as { command: unknown }).command));
  if (policy.denied) {
    const error = { code: policy.code, message: policy.message };
    send({ v: 1, type: "tool.result", toolCallId, ok: false, error });
    this.emit({ ...this.base(sessionId), type: "tool.completed", toolCallId, ok: false, error, durationMs: 0 });
    return;
  }
}
```

This branch must not emit `tool.approved` or `tool.rejected`, because no approval decision was requested.

- [ ] **Step 5: Run targeted and full verification**

Run:

```bash
cd app
npm test -- tests/unit/shell-policy.test.ts
npm run typecheck
```

Expected: PASS.

---

### Task 2: Runtime IPC Request Validation

**Files:**
- Modify: `app/src/shared/ipc-contract.ts`
- Modify: `app/src/main/ipc/handlers.ts`
- Create: `app/tests/unit/ipc-contract.test.ts`

- [ ] **Step 1: Write the failing schema test**

Create `app/tests/unit/ipc-contract.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import {
  AgentCancelReqSchema,
  ApprovalRespondReqSchema,
  ChatSendReqSchema,
  ConfigSetReqSchema,
  SessionEventsReqSchema
} from "../../src/shared/ipc-contract.js";

describe("ipc contract schemas", () => {
  test("accepts valid chat requests", () => {
    expect(ChatSendReqSchema.parse({ text: "hello" })).toEqual({ text: "hello" });
    expect(ChatSendReqSchema.parse({ sessionId: "s_1", text: "hello" })).toEqual({ sessionId: "s_1", text: "hello" });
  });

  test("rejects malformed chat requests", () => {
    expect(() => ChatSendReqSchema.parse({ text: "" })).toThrow();
    expect(() => ChatSendReqSchema.parse({ text: 1 })).toThrow();
  });

  test("validates control request shapes", () => {
    expect(AgentCancelReqSchema.parse({ runId: "run_1" })).toEqual({ runId: "run_1" });
    expect(ApprovalRespondReqSchema.parse({ toolCallId: "tool_1", decision: "approve" })).toEqual({ toolCallId: "tool_1", decision: "approve" });
    expect(SessionEventsReqSchema.parse({ sessionId: "s_1" })).toEqual({ sessionId: "s_1" });
    expect(() => ApprovalRespondReqSchema.parse({ toolCallId: "tool_1", decision: "maybe" })).toThrow();
  });

  test("accepts config patches without api key leaks in schema", () => {
    const parsed = ConfigSetReqSchema.parse({
      settings: { onboarded: true },
      model: { providerKind: "ollama", piProvider: "ollama", model: "qwen2.5" }
    });
    expect(parsed.settings?.onboarded).toBe(true);
    expect(parsed.model?.providerKind).toBe("ollama");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd app
npm test -- tests/unit/ipc-contract.test.ts
```

Expected: FAIL because schema exports do not exist.

- [ ] **Step 3: Add request schemas**

In `app/src/shared/ipc-contract.ts`, import zod and config schemas:

```ts
import { z } from "zod";
import { ModelConfig, Settings } from "./config.js";
```

Add these exports:

```ts
export const ChatSendReqSchema = z.object({
  sessionId: z.string().min(1).optional(),
  text: z.string().min(1)
});
export const AgentCancelReqSchema = z.object({ runId: z.string().min(1) });
export const ApprovalRespondReqSchema = z.object({
  toolCallId: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  remember: z.boolean().optional()
});
export const ConfigSetReqSchema = z.object({
  model: ModelConfig.omit({ apiKeyRef: true }).partial().extend({ apiKey: z.string().optional() }).optional(),
  settings: Settings.partial().optional()
});
export const SessionEventsReqSchema = z.object({ sessionId: z.string().min(1) });
```

Then define the TypeScript request interfaces from schemas:

```ts
export type ChatSendReq = z.infer<typeof ChatSendReqSchema>;
export type AgentCancelReq = z.infer<typeof AgentCancelReqSchema>;
export type ApprovalRespondReq = z.infer<typeof ApprovalRespondReqSchema>;
export type ConfigSetReq = z.infer<typeof ConfigSetReqSchema>;
export type SessionEventsReq = z.infer<typeof SessionEventsReqSchema>;
```

- [ ] **Step 4: Parse all IPC inputs in main**

In `app/src/main/ipc/handlers.ts`, import the schemas and parse request objects:

```ts
ipcMain.handle(CH.chatSend, (_e, req) => {
  const parsed = ChatSendReqSchema.parse(req);
  return d.agent.run(parsed.sessionId, parsed.text);
});
```

Apply the same pattern for `agent:cancel`, `approval:respond`, `config:set`, and `session:events`.

- [ ] **Step 5: Run targeted and full verification**

Run:

```bash
cd app
npm test -- tests/unit/ipc-contract.test.ts
npm run typecheck
```

Expected: PASS.

---

### Task 3: Cancellation Evidence

**Files:**
- Modify: `app/src/main/agent/agent-manager.ts`
- Create: `app/tests/unit/agent-cancel.test.ts`

- [ ] **Step 1: Write the failing cancellation test**

Create `app/tests/unit/agent-cancel.test.ts` with a focused unit test around `AgentManager.cancel`:

```ts
import { EventEmitter } from "node:events";
import { describe, expect, test } from "vitest";
import { AgentManager } from "../../src/main/agent/agent-manager.js";
import type { FleetEvent } from "../../src/shared/events.js";

class FakeChild extends EventEmitter {
  killed = false;
  stdin = { write: (_s: string) => true };
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  kill() { this.killed = true; return true; }
}

describe("AgentManager cancellation", () => {
  test("emits cancelled agent.failed when cancelling an active run", () => {
    const events: FleetEvent[] = [];
    const manager = new AgentManager({
      store: {} as never,
      events: { append: (e: FleetEvent) => events.push(e) } as never,
      registry: {} as never,
      approvals: {} as never,
      pushToken: () => undefined,
      agentPath: "unused"
    });
    (manager as unknown as { active: unknown }).active = {
      runId: "run_1",
      sessionId: "s_1",
      child: new FakeChild(),
      abort: new AbortController()
    };

    expect(manager.cancel("run_1")).toEqual({ ok: true });

    expect(events).toContainEqual(expect.objectContaining({
      type: "agent.failed",
      runId: "run_1",
      sessionId: "s_1",
      cancelled: true,
      error: { code: "cancelled", message: "用户取消了运行" }
    }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd app
npm test -- tests/unit/agent-cancel.test.ts
```

Expected: FAIL because `cancel` currently does not append the cancellation event.

- [ ] **Step 3: Emit cancellation event in main**

In `app/src/main/agent/agent-manager.ts`, update `cancel` after `abort.abort()`:

```ts
this.emit({
  ...this.base(this.active.sessionId),
  type: "agent.failed",
  runId,
  error: { code: "cancelled", message: "用户取消了运行" },
  cancelled: true
});
this.active = null;
```

Keep the delayed kill fallback. Guard duplicate events by checking `this.active?.runId` before emitting.

- [ ] **Step 4: Run targeted and full verification**

Run:

```bash
cd app
npm test -- tests/unit/agent-cancel.test.ts
npm run typecheck
```

Expected: PASS.

---

### Task 4: Electron App Identity And Smoke Isolation

**Files:**
- Modify: `app/src/main/index.ts`
- Modify: `app/tests/smoke/launch.spec.ts`

- [ ] **Step 1: Write the failing smoke isolation assertion**

Modify `app/tests/smoke/launch.spec.ts` to launch with a temporary user data directory:

```ts
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
```

Inside the test:

```ts
const userData = await mkdtemp(join(tmpdir(), "fleet-smoke-"));
const app = await electron.launch({ args: ["out/main/index.js", `--user-data-dir=${userData}`] });
```

Also verify the bridge:

```ts
await expect.poll(() => win.evaluate(() => typeof window.fleet?.getConfig)).toBe("function");
```

- [ ] **Step 2: Run smoke to verify current launch still works**

Run:

```bash
cd app
npm run build
npm run smoke
```

Expected: PASS after the temp user-data change. If it fails, inspect console/page errors before changing production code.

- [ ] **Step 3: Set app identity before stores initialize**

In `app/src/main/index.ts`, before `app.whenReady()`:

```ts
app.setName("Fleet");
```

This keeps app data under the product name instead of the generic `Electron` app identity.

- [ ] **Step 4: Run smoke again**

Run:

```bash
cd app
npm run build
npm run smoke
```

Expected: PASS.

---

### Task 5: Full Verification Gate

**Files:**
- Read-only verification across `app/`.

- [ ] **Step 1: Run the full M0 verification command set**

Run:

```bash
cd app
npm run typecheck
npm run lint
npm test
npm run test:protocol
npm run build
npm run smoke
```

Expected:

- `typecheck`: exit 0.
- `lint`: exit 0.
- `npm test`: all unit/protocol tests pass.
- `test:protocol`: all protocol tests pass.
- `build`: emits `out/main/index.js`, `out/main/agent.js`, `out/preload/index.mjs`, and renderer assets.
- `smoke`: Electron launches and the onboarding screen plus bridge are visible.

- [ ] **Step 2: Record remaining non-M0-complete items**

After verification, update the implementation status in the final response. Do not claim the whole project is complete. Remaining M0 work after this plan is expected to include a richer fake-model chat/tool approval smoke and a real Ollama or DeepSeek chain test.

## Self-Review

- Spec coverage: This plan covers the M0 correctness gaps identified after reading `docs/M0-实施规范.md`: shell deny before approval, runtime IPC validation, cancellation evidence, smoke isolation, and product identity. It does not cover M1/M2/M3 because those are explicit non-goals.
- Placeholder scan: No `TBD`, `TODO`, "similar to", or unspecified test commands are required to execute these tasks.
- Type consistency: Request schema names match the imports used in the task snippets. Event names match `app/src/shared/events.ts`. Error code `"cancelled"` matches `FleetError` and existing shell cancellation behavior.
