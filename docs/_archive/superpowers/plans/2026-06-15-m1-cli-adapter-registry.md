# M1 CLI Adapter Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize external CLI metadata and launch templates so detection, version probes, and managed sessions all use the same adapter registry.

**Architecture:** Keep the adapter registry in Electron main because it owns external process execution. `cli-detect` consumes adapter metadata for executable discovery, and IPC handlers consume adapter launch templates for `--version` and `--help` actions. Renderer remains unable to pass arbitrary commands or paths.

**Tech Stack:** TypeScript, Vitest, Electron main IPC.

---

## Execution Status

Completed on 2026-06-15:

- Added `app/src/main/cli/cli-adapters.ts` with adapter definitions for Claude Code, Codex, Gemini CLI, and Qwen Code.
- Moved `id`, `label`, `command`, `versionArgs`, and `helpArgs` into the adapter registry.
- Updated CLI detection to use `listCliAdapters()`.
- Updated `cli:probe` and `cli:session:start` handlers to use adapter-provided launch templates.
- Added `app/tests/unit/cli-adapters.test.ts`.

Targeted verification:

```bash
cd app
npm test -- tests/unit/cli-adapters.test.ts tests/unit/cli-detect.test.ts tests/unit/cli-ipc-contract.test.ts tests/unit/cli-session-manager.test.ts
npm run typecheck
```

Result: exit 0; 4 test files and 13 tests passed; typecheck passed.

Full verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && npm run pack && npm audit --json
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: normal verification exit 0; `npm test` reported 19 test files and 49 tests passing; protocol tests reported 2 files and 4 tests passing; normal smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

---

## Scope

This slice only centralizes launch templates. It does not add interactive CLI prompt adapters, MCP injection, or arbitrary command entry.

## File Structure

- Create `app/src/main/cli/cli-adapters.ts`: adapter registry.
- Modify `app/src/main/cli/cli-detect.ts`: read detection metadata from the registry.
- Modify `app/src/main/ipc/handlers.ts`: read probe/session args from the registry.
- Create `app/tests/unit/cli-adapters.test.ts`: prove the supported adapter set and lookup API.

---

### Task 1: Adapter Registry

**Files:**
- Create: `app/src/main/cli/cli-adapters.ts`
- Create: `app/tests/unit/cli-adapters.test.ts`

- [x] **Step 1: Write failing adapter tests**

Validate the four supported adapters and lookup behavior.

- [x] **Step 2: Run tests to verify failure**

```bash
cd app
npm test -- tests/unit/cli-adapters.test.ts
```

Expected: FAIL because the registry file does not exist.

- [x] **Step 3: Implement adapter registry**

Add immutable definitions and defensive-copy accessors.

- [x] **Step 4: Run targeted tests**

```bash
cd app
npm test -- tests/unit/cli-adapters.test.ts
```

Expected: PASS.

### Task 2: Use Registry

**Files:**
- Modify: `app/src/main/cli/cli-detect.ts`
- Modify: `app/src/main/ipc/handlers.ts`

- [x] **Step 1: Replace duplicate CLI definitions in detection**

`detectCliTools()` now maps over `listCliAdapters()`.

- [x] **Step 2: Replace hardcoded launch args in IPC handlers**

`cli:probe` uses `adapter.versionArgs`; `cli:session:start` uses `adapter.helpArgs`.

- [x] **Step 3: Run targeted verification**

```bash
cd app
npm test -- tests/unit/cli-adapters.test.ts tests/unit/cli-detect.test.ts tests/unit/cli-ipc-contract.test.ts tests/unit/cli-session-manager.test.ts
npm run typecheck
```

Expected: PASS.

## Self-Review

- This reduces duplication without widening renderer authority.
- The registry is deliberately small; real prompt adapters and MCP flags will be added in later M1 slices.
