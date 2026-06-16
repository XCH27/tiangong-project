# M1 CLI Prompt Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user run one bounded prompt through a detected external CLI from the desktop UI, with renderer input limited to `{ id, prompt }` and all executable arguments owned by main-process adapters.

**Architecture:** Extend the existing CLI adapter registry with `promptArgs(prompt)` launch templates. Extend `cli:session:start` from fixed `help` mode to a discriminated `help | prompt` request, keep spawning in `CliSessionManager`, and add a minimal Settings UI text input/button for detected CLIs. This is still session output streaming, not full @mention routing or interactive PTY hosting.

**Tech Stack:** TypeScript, Electron IPC, React, Vitest, Playwright smoke.

---

## Source Notes

- Claude Code CLI reference documents `claude -p "query"` for non-interactive query-and-exit mode.
- Codex CLI reference documents `codex exec` as stable non-interactive execution and documents `--ask-for-approval never` for non-interactive runs plus `--sandbox read-only`.
- Gemini CLI headless docs document `--prompt, -p` as non-interactive mode.
- Qwen Code headless/configuration docs document `--prompt, -p` as non-interactive mode and `--output-format, -o` for text/json/stream-json output.

## Scope

This slice does not implement @mention routing, queueing, reusable external CLI conversation state, MCP injection into external CLIs, or pty-backed interactive input. It starts a one-shot child process using known adapter arguments and streams stdout/stderr into the existing Settings session output panel.

## Execution Status

Completed on 2026-06-15:

- Added `promptArgs(prompt)` launch templates to `app/src/main/cli/cli-adapters.ts`.
- Extended `CliSessionStartReqSchema` to accept discriminated `help` and `prompt` modes.
- Updated `cli:session:start` so main process chooses fixed adapter args and uses the workspace root for prompt sessions.
- Added per-CLI prompt inputs and `提问` buttons in Settings.
- Added a smoke assertion for the external CLI prompt affordance.
- Fixed `detectCliTools()` to return IPC-cloneable plain data after `promptArgs` made adapters contain functions.

Red verification:

```bash
cd app
npm test -- tests/unit/cli-adapters.test.ts
npm test -- tests/unit/cli-ipc-contract.test.ts
npm test -- tests/unit/cli-detect.test.ts
```

Result: adapter red failed because `promptArgs` did not exist; IPC red failed because `"prompt"` mode was rejected; cloneability red failed with `DataCloneError` because `detectCliTools()` was returning adapter functions through IPC-facing data.

Targeted verification:

```bash
cd app
npm test -- tests/unit/cli-adapters.test.ts tests/unit/cli-ipc-contract.test.ts tests/unit/cli-session-manager.test.ts
npm run typecheck
npm run build
npm test -- tests/unit/cli-detect.test.ts
npm run build && npm run smoke
```

Result: exit 0; adapter/IPC/session target reported 3 files and 11 tests passing; typecheck passed; build passed; `cli-detect` reported 4 tests passing; smoke reported 5 passed and 1 skipped after rebuilding the Electron bundle.

Full verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=mcp-inmemory npm run smoke && npm run pack && npm audit --json && FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: exit 0; typecheck passed; lint passed; `npm test` reported 24 test files and 61 tests passing; protocol tests reported 2 files and 4 tests passing; build passed; default smoke reported 5 passed and 1 skipped; MCP-backend smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities across 698 dependencies; real Ollama smoke reported 1 passed. Packaging still warns that the default Electron icon is used and macOS signing is skipped because no Developer ID certificate is configured.

## File Structure

- Modify `app/src/main/cli/cli-adapters.ts`: add `promptArgs(prompt)` to adapters.
- Modify `app/src/shared/ipc-contract.ts`: allow `cli:session:start` mode `"prompt"` with bounded prompt text.
- Modify `app/src/main/ipc/handlers.ts`: choose `helpArgs` or `promptArgs(prompt)` in main, and run prompt sessions from the workspace root.
- Modify `app/src/renderer/components/Settings/Settings.tsx`: add per-CLI prompt input and `提问` button.
- Modify tests:
  - `app/tests/unit/cli-adapters.test.ts`
  - `app/tests/unit/cli-ipc-contract.test.ts`
  - `app/tests/smoke/launch.spec.ts`

---

### Task 1: Adapter Prompt Templates

- [x] **Step 1: Write failing adapter assertions**

Update `app/tests/unit/cli-adapters.test.ts` to assert each adapter exposes bounded prompt launch args, especially:

```ts
expect(getCliAdapter("claude")?.promptArgs("hello")).toEqual(["-p", "hello", "--output-format", "text"]);
expect(getCliAdapter("codex")?.promptArgs("hello")).toEqual(["exec", "--sandbox", "read-only", "--ask-for-approval", "never", "hello"]);
expect(getCliAdapter("qwen")?.promptArgs("hello")).toEqual(["-p", "hello", "-o", "text", "--approval-mode", "plan"]);
```

- [x] **Step 2: Run red**

Run:

```bash
cd app
npm test -- tests/unit/cli-adapters.test.ts
```

Expected: FAIL because adapters do not expose `promptArgs`.

- [x] **Step 3: Implement adapter templates**

Add `promptArgs(prompt: string): string[]` to `CliAdapter`, preserving defensive array copies for static args.

### Task 2: IPC Contract

- [x] **Step 1: Write failing contract assertions**

Update `app/tests/unit/cli-ipc-contract.test.ts` so `CliSessionStartReqSchema.parse({ id: "codex", mode: "prompt", prompt: "explain" })` succeeds, while empty and overlong prompts fail.

- [x] **Step 2: Run red**

Run:

```bash
cd app
npm test -- tests/unit/cli-ipc-contract.test.ts
```

Expected: FAIL because `"prompt"` mode is currently rejected.

- [x] **Step 3: Implement discriminated union**

Change `CliSessionStartReqSchema` to `z.discriminatedUnion("mode", [...])` with `prompt` as `z.string().trim().min(1).max(4000)`.

### Task 3: Main/UI Wiring

- [x] **Step 1: Wire handler**

In `app/src/main/ipc/handlers.ts`, choose adapter args by mode:

```ts
const args = parsed.mode === "prompt" ? adapter.promptArgs(parsed.prompt) : adapter.helpArgs;
```

Pass `cwd: d.store.getSettings().workspaceRoot` for prompt sessions.

- [x] **Step 2: Add Settings controls**

In `Settings.tsx`, keep one prompt draft per CLI id and render a compact input plus `提问` button next to `版本` and `帮助`.

- [x] **Step 3: Run targeted verification**

Run:

```bash
cd app
npm test -- tests/unit/cli-adapters.test.ts tests/unit/cli-ipc-contract.test.ts tests/unit/cli-session-manager.test.ts
npm run typecheck
npm run build
```

Expected: PASS.

### Task 4: Smoke and Full Verification

- [x] **Step 1: Extend smoke**

Add an assertion that Settings renders the external CLI prompt input affordance. Do not require real CLI availability in smoke.

- [x] **Step 2: Run full verification**

Run:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=mcp-inmemory npm run smoke && npm run pack && npm audit --json
FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Expected: PASS.

## Self-Review

- Renderer never supplies executable paths or arbitrary CLI flags.
- Prompt text is bounded and passed as a single argv value, not through a shell.
- This keeps true multi-agent @routing for a later slice.
