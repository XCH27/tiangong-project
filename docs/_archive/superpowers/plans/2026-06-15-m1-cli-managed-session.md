# M1 CLI Managed Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a managed external CLI session skeleton that can start a bounded known-CLI help session, stream output events to the UI, list active/recent sessions, and cancel running processes.

**Architecture:** Keep child process ownership in Electron main. The renderer can only start a known detected CLI in a fixed `help` mode, so it cannot pass arbitrary commands or executable paths. A `CliSessionManager` tracks process lifecycle and emits typed IPC session events; later Claude/Codex adapters can reuse the same process/session boundary.

**Tech Stack:** Electron main IPC, Node `child_process.spawn`, TypeScript, zod, React, Vitest, Playwright Electron smoke.

---

## Execution Status

Completed on 2026-06-15:

- Added `CliSessionManager` for bounded external CLI process lifecycle management.
- Added typed session events for `started`, `stdout`, `stderr`, and `exited`.
- Added `cli:session:start`, `cli:session:cancel`, `cli:session:list`, and `cli:session:event` IPC contracts.
- Wired Electron main to instantiate the session manager and push session events to renderer.
- Extended preload bridge with `startCliSession`, `cancelCliSession`, `listCliSessions`, and `onCliSessionEvent`.
- Settings can now start a fixed `--help` session for detected CLIs and display streamed output.

Fresh verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && npm run pack && npm audit --json
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: normal verification exit 0; `npm test` reported 18 test files and 47 tests passing; protocol tests reported 2 files and 4 tests passing; normal smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

---

## Scope

This slice implements:

- `CliSessionManager` with start/list/cancel
- stdout/stderr/exited session events
- typed `cli:session:*` IPC contracts
- Settings UI controls to launch a fixed `--help` session for detected CLIs

Out of scope:

- interactive pseudo-terminal rendering
- arbitrary CLI command entry
- CLI prompt adapters
- MCP tool injection into external CLIs
- using external CLI output as chat messages

## File Structure

- Create `app/src/main/cli/cli-session-manager.ts`: session lifecycle manager.
- Modify `app/src/shared/ipc-contract.ts`: add session request/result/event schemas and bridge methods.
- Modify `app/src/main/ipc/handlers.ts`: register start/list/cancel handlers.
- Modify `app/src/main/index.ts`: instantiate `CliSessionManager` and push events to renderer.
- Modify `app/src/preload/index.ts`: expose session methods and event subscription.
- Modify `app/src/renderer/components/Settings/Settings.tsx`: add fixed help session buttons and output area.
- Create `app/tests/unit/cli-session-manager.test.ts`: verify output events and cancellation.
- Modify `app/tests/unit/cli-ipc-contract.test.ts`: verify session schemas.

---

### Task 1: Session Lifecycle Manager

**Files:**
- Create: `app/src/main/cli/cli-session-manager.ts`
- Create: `app/tests/unit/cli-session-manager.test.ts`

- [x] **Step 1: Write failing lifecycle tests**

Create tests that use `process.execPath` as the command. The first test starts a process that prints to stdout/stderr and exits. The second test starts a long-running process and cancels it.

- [x] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd app
npm test -- tests/unit/cli-session-manager.test.ts
```

Expected: FAIL because `cli-session-manager.ts` does not exist.

- [x] **Step 3: Implement `CliSessionManager`**

Implement:

- `start({ id, label, commandPath, args }) -> { sessionId }`
- `list() -> CliManagedSession[]`
- `cancel(sessionId) -> boolean`
- event callback with `started`, `stdout`, `stderr`, `exited`
- output truncation per emitted chunk

- [x] **Step 4: Run targeted verification**

Run:

```bash
cd app
npm test -- tests/unit/cli-session-manager.test.ts
npm run typecheck
```

Expected: PASS.

---

### Task 2: Typed IPC

**Files:**
- Modify: `app/src/shared/ipc-contract.ts`
- Modify: `app/src/main/ipc/handlers.ts`
- Modify: `app/src/main/index.ts`
- Modify: `app/src/preload/index.ts`
- Modify: `app/tests/unit/cli-ipc-contract.test.ts`

- [x] **Step 1: Add failing schema tests**

Add assertions for:

- `CliSessionStartReqSchema.parse({ id: "codex", mode: "help" })`
- `CliSessionStartResultSchema` started/unavailable branches
- `CliSessionEventSchema` stdout/exited events
- unknown ids and unknown modes rejected

- [x] **Step 2: Run the test to verify it fails**

Run:

```bash
cd app
npm test -- tests/unit/cli-ipc-contract.test.ts
```

Expected: FAIL because session schemas do not exist.

- [x] **Step 3: Add shared schemas and bridge methods**

Add `cliSessionStart`, `cliSessionCancel`, `cliSessionList`, and `pushCliSessionEvent` channels and corresponding bridge methods.

- [x] **Step 4: Register main handlers**

Handlers must:

- parse all requests
- detect CLI by id
- return unavailable if missing
- start only fixed `help` mode using `["--help"]`
- cancel/list through `CliSessionManager`

- [x] **Step 5: Run targeted verification**

Run:

```bash
cd app
npm test -- tests/unit/cli-ipc-contract.test.ts
npm run typecheck
```

Expected: PASS.

---

### Task 3: Settings UI

**Files:**
- Modify: `app/src/renderer/components/Settings/Settings.tsx`

- [x] **Step 1: Add help-session controls**

For each detected CLI, render a `帮助` button when available. Clicking calls `startCliSession({ id: tool.id, mode: "help" })`.

- [x] **Step 2: Subscribe to session events**

Settings subscribes to `onCliSessionEvent`, appends stdout/stderr snippets, and shows exit code when the session exits.

- [x] **Step 3: Run full verification**

Run:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke
```

Expected: PASS.

## Self-Review

- This moves toward external CLI hosting without pretending Claude/Codex prompt adapters are complete.
- The renderer still cannot execute arbitrary commands.
- Session lifecycle behavior is tested at the main-process module level before IPC/UI wiring.
