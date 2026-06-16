# Skill Foundation Implementation Record

> **For agentic workers:** This slice is already implemented. Future Skill work must continue from this record and keep the management/runtime split.

**Goal:** Add Fleet's first Skill foundation: scan a local Skill SSOT, expose installed Skill metadata to the UI, and inject a first-message Skill index into the built-in Agent runtime.

**Architecture:** The management surface lives in Electron main and reads `.fleet/skills/<skill>/SKILL.md` under the current workspace. The runtime surface builds a hidden Skill index and passes it through the existing agent `systemPrompt` only for new built-in Agent sessions. Renderer receives only typed IPC results and never reads Skill files directly.

**Tech Stack:** TypeScript, zod, Electron IPC, React Settings UI, Vitest, Playwright smoke.

---

## 参考实现对照

- `源码参考/cc-switch/src/lib/api/skills.ts`: adopted the `InstalledSkill` shape direction: id, name, description, directory, source-style metadata, app enable flags, timestamps, and content hash.
- `源码参考/cc-switch/src-tauri/src/database/dao/skills.rs`: adopted the idea that Skill metadata is a managed record separate from files. This slice does not add SQLite yet; metadata is derived from SSOT scan.
- `源码参考/cc-switch/src-tauri/src/services/skill.rs`: adopted SSOT scanning and `SKILL.md` validation. This slice does not add repo discovery, backup/restore, unmanaged import, ZIP install, or symlink/copy sync.
- `源码参考/AionUi/docs/prds/conversations/acp/skills.md`: adopted first-message Skill index injection and selected Skill full-content injection helper boundaries.
- `源码参考/AionUi/docs/prds/conversations/acp/messaging.md`: adopted hidden first-message injection semantics: the Skill index is not appended as a visible chat message and is not repeated for existing sessions.

## Implemented

- `app/src/shared/skills.ts`: shared Skill schemas and IPC-safe result types.
- `app/src/main/skills/skill-service.ts`: workspace SSOT scanner, frontmatter parser, SHA-256 content hash, runtime index builder, selected Skill full injection loader.
- `app/src/shared/ipc-contract.ts`, `app/src/preload/index.ts`, `app/src/main/ipc/handlers.ts`: `skills:list` and `skills:runtime-index` IPC surfaces.
- `app/src/main/agent/agent-manager.ts`: hidden Skill index injection through `systemPrompt` for new built-in Agent sessions.
- `app/src/renderer/components/Settings/Settings.tsx`: read-only Skill management status in Settings.
- `app/tests/unit/skill-service.test.ts`, `app/tests/unit/ipc-contract.test.ts`, `app/tests/smoke/launch.spec.ts`: red-green coverage for scanning, runtime index, IPC schema, and Settings visibility.

## Known Gaps

- No SQLite Skill metadata store yet.
- No repo discovery, update detection, backup/restore, unmanaged import, ZIP install, or cross-application sync yet.
- No UI for selecting a specific Skill for full-content injection yet; the service helper exists.
- No migration from external app Skill directories yet.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: 28 files, 78 tests passed.
- `npm run test:protocol`: 2 files, 4 tests passed.
- `npm run build`: passed.
- `npm run smoke`: 5 passed, 1 real Ollama test skipped.
- `FLEET_TOOL_BACKEND=local npm run smoke`: 5 passed, 1 real Ollama test skipped.
