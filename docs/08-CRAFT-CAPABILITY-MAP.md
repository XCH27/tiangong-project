# 08 — Craft Capability Map (READ BEFORE YOU BUILD)

> **This is a product fork of Craft Agents v0.11.** The most common way
> to fail here — and the specific mistake that has happened repeatedly before — is to **rebuild
> something Craft already has** instead of reusing or extending it.
>
> **Mandatory rule:** before you write code for any capability, find it in the table below. If it says
> `REUSE` or `EXTEND`, you **must** read the linked Craft code (and its bundled doc) and build on it. A
> `NEW` classification is the *only* case where you start from scratch — and even then you reuse the
> spine (session/permission/timeline). If a capability you need is not in this map, add it here (with
> its real code path) as part of your change; do not silently invent a parallel system.

## How to use this map

1. Identify the capability your task touches.
2. Read its **Craft code entry** (confirm with `rg`) and its **bundled doc** if one exists.
3. Apply the classification:
   - **`REUSE`** — Craft already does this well. Call it / configure it / improve it in place. Do **not**
     wrap it in a new abstraction or duplicate it.
   - **`EXTEND`** — Craft has the foundation but not the whole thing Fleet needs. Add to the *existing*
     module, types, and authority. Not a new store, not a parallel path.
   - **`NEW`** — Craft genuinely lacks this. Build it, but still route through the shared spine
     (session, permission, timeline) per `03-NON-NEGOTIABLES.md`.
4. If unsure between `EXTEND` and `NEW`, treat it as `EXTEND` and prove Craft's foundation is
   insufficient before going `NEW` (this is the safe default and matches non-negotiable #1).

## Craft's own Agent-readable docs (use these first)

Craft ships **17 capability docs** in `app/apps/electron/resources/docs/`, synced to
`~/.craft-agent/docs/` on every launch (they are the live reference an agent reads at runtime). When a
row below names a bundled doc, read it — it is Craft's own explanation of that feature's config and
behavior. Craft also ships `app/apps/electron/resources/AGENTS.md` (how bundled assets sync),
`app/packages/core/CLAUDE.md`, and `app/packages/shared/CLAUDE.md`.

Bundled docs: `automations`, `browser-tools`, `craft-cli`, `data-tables`, `html-preview`,
`image-preview`, `labels`, `llm-tool`, `markdown-preview`, `mermaid`, `pdf-preview`, `permissions`,
`skills`, `sources`, `statuses`, `themes`, `tool-icons`.

---

## The capability map

Paths are under `app/`. Classifications are **for Fleet's planned work against each capability** — i.e.
"when Fleet touches this, is it reuse / extend / new?"

### Spine — session, permission, timeline, actions (the foundation Milestone 1 builds on)

| Capability | Craft code entry | Bundled doc | Fleet class | Note |
|---|---|---|---|---|
| Session store & lifecycle | `packages/server-core/src/sessions/SessionManager.ts`, `packages/shared/src/sessions/` | — | **REUSE** | The one session authority. Never create a second (non-negotiable #1). |
| Timeline / SessionEvents | `packages/shared/src/protocol/dto.ts` (`SessionEvent`), `protocol/events.ts`, `channels.ts` | — | **REUSE** | Already has `tool_start`/`tool_result`/`permission_request`. Add no new event kinds for M1. |
| Permission modes | `packages/shared/src/agent/mode-manager.ts`, `mode-types.ts` (`safe`/`ask`/`allow-all`) | `permissions` | **REUSE** | Map Fleet risk onto these modes; do not invent an L0–L3 engine. |
| Permission enforcement gate | `packages/shared/src/agent/core/pre-tool-use.ts` + `SessionManager` | `permissions` | **REUSE** | The real gate + approval prompt. `evaluateToolCall` defaults to allow for unknown tools. |
| Session-scoped Agent tool registry | `packages/session-tools-core/src/tool-defs.ts` (`SESSION_TOOL_DEFS`), `handlers/`, `context.ts` | — | **EXTEND** | Source of truth for Agent session-tool schemas/handlers/metadata. It does **not** unify human RPC, caller identity, policy attribution, or all SDK built-ins. M1 adds a thin caller-aware invocation seam around existing `set_session_labels`; it does not create another registry. |
| Cross-caller action invocation | UI `sessionCommand`; Agent session tools/PreToolUse; `SessionManager` | — | **EXTEND** | Existing callers already converge on some state authorities but lack one attributed invocation/policy/evidence contract. `PreToolUse` remains Agent-only. |
| Usage / token tracking | `packages/shared/src/agent/core/usage-tracker.ts` (`usage_update`) | — | **EXTEND** | Real per-message + cumulative token usage. Fleet's real/estimated/unknown *cost* fields extend this — **not** a second ledger (Decision E3). |

### Agent execution & runtimes

| Capability | Craft code entry | Bundled doc | Fleet class | Note |
|---|---|---|---|---|
| Agent backends (Claude/Pi) | `packages/shared/src/agent/claude-agent.ts`, `pi-agent.ts`, `agent/backend/` | — | **REUSE** | Two backends already share one tool/permission context. |
| Built-in tools (Bash/Read/Write/Edit) | `packages/shared/src/agent/core/pre-tool-use.ts` (`BUILT_IN_TOOLS`, `FILE_PATH_TOOLS`) | — | **REUSE** | Agent file/shell ops go through these SDK built-ins today — *not* the session registry. Key fact for M1. |
| Bash/PowerShell validation | `packages/shared/src/agent/bash-validator.ts`, `powershell-validator.ts` | `permissions` | **REUSE** | Read-only/dangerous-command gating already exists. |
| Background shell execution | `SessionManager` + `shell_backgrounded`/`shell_killed` events (`protocol/dto.ts`) | — | **EXTEND** | Craft runs background shells via the Bash tool. **No `node-pty`.** |
| Terminal output UI | `packages/ui/src/components/terminal/TerminalOutput.tsx` (ANSI, bash/grep/glob) | — | **EXTEND** | A terminal *display* exists. M2's interactive terminal builds on it. |
| Interactive PTY lane / CLI runtime | — (no `node-pty`; no runtime-lane concept) | `craft-cli` (CLI client) | **NEW** | A first-class interactive PTY + selectable runtime lane would be Fleet's addition — but it is **conditional**: Milestone 2 starts with the existing non-interactive Bash/background-shell path, and `node-pty` is added only if that real loop proves an interactive PTY necessary (see `04-MILESTONES.md` M2; adding it is an owner checkpoint as a shipped runtime dependency). Reuse spine + terminal UI + shell validation. |
| MCP client / external providers | `packages/shared/src/mcp/` (`client.ts`, `mcp-pool.ts`, `pool-server.ts`) | `sources` | **REUSE** | Craft already integrates MCP servers as capability providers. Fleet "external software = replaceable adapter" builds on this. |
| CLI client | `apps/cli/`, `app/docs/cli.md`, bundled `craft-cli` doc | `craft-cli` | **REUSE/EXTEND** | A CLI over WebSocket exists. Fleet's "CLI as a runtime method" extends it. |

### Files, sources, skills, capabilities

| Capability | Craft code entry | Bundled doc | Fleet class | Note |
|---|---|---|---|---|
| Workspace file authority/storage | `packages/shared/src/workspaces/storage.ts`, `types.ts`; `apps/electron/src/main/handlers/workspace.ts` | — | **REUSE** | Workspace roots and storage exist. This does **not** imply a complete user-facing file browser or governed cross-caller file-action surface. |
| Governed file UI/actions | SDK built-in Read/Write/Edit/Bash plus existing preview/file affordances | — | **EXTEND** | Agent file tools exist, but human/Agent parity, leases, provenance, and a complete file-management surface do not. Milestone 3 owns the proven gap. |
| File leases (concurrent-write) | — | — | **NEW** | Lease/reservation for concurrent agent edits is Fleet's addition (Milestone 3). Build on workspace storage + permission. |
| Library assets & ArtifactRef | — | — | **NEW** | Versioned handoff is Fleet-owned, but the envelope is derived from a real producer/consumer and versioned before M3 cross-surface use—not frozen in M1. It identifies the native bytes/version and provenance so one result can be referenced by several later Agents/surfaces without copying. It is not a second byte store. Library management remains later. |
| Sources (external data/creds) | `packages/shared/src/sources/`; `apps/electron/.../SourcesListPanel.tsx` | `sources` | **REUSE** | OAuth/credential/source system exists — reuse, don't rebuild auth. |
| Skills | `packages/shared/src/skills/`; `SkillsListPanel.tsx` | `skills` | **REUSE** | Skill loading/config exists. Fleet capability-loadout ideas extend this. |
| Credentials | `packages/shared/src/credentials/`, `agent/core/` credential prompt | `permissions` | **REUSE** | Keep credentials in this pathway (non-negotiable #5). Never build a side channel. |

### Projects, tasks, views, automations, settings

| Capability | Craft code entry | Bundled doc | Fleet class | Note |
|---|---|---|---|---|
| Projects & tasks & Kanban | `packages/shared/src/projects/`, `tasks/`; `server-core/src/tasks/` | `statuses`, `labels` | **REUSE** | Project/task/Kanban authority exists (upstream v0.11). Don't create a second task system. |
| Views (dynamic filters) | `packages/shared/src/views/` (Filtrex, `views.json`) | — | **REUSE/EXTEND** | Runtime session filters exist. Fleet workbench view/layout host extends this + Craft preferences. |
| Automations | `packages/shared/src/automations/`; `server-core` automation handlers | `automations` | **REUSE** | Rule/automation engine exists. |
| Scheduler | `packages/shared/src/scheduler/scheduler-service.ts` | — | **REUSE** | Scheduling exists — reuse for any timed behavior. |
| Search | `packages/shared/src/search/` (fuzzy) | — | **REUSE** | — |
| Settings / preferences | `apps/electron/src/renderer/pages/settings/`; settings handlers | `themes`, `tool-icons` | **REUSE** | One settings home. Do not add a parallel settings surface (Decision P5). |
| Labels / statuses | `packages/shared/src/labels/`, `statuses/` | `labels`, `statuses` | **REUSE** | — |

### Browser, previews, LLM tool, diagrams

| Capability | Craft code entry | Bundled doc | Fleet class | Note |
|---|---|---|---|---|
| BrowserPane + CDP | `apps/electron/src/main/browser-pane-manager.ts`, `browser-cdp.ts`; `agent/browser-tools.ts` | `browser-tools` | **REUSE/EXTEND** | Browser stack + tools exist. Fleet governed evidence capture extends it; no stealth browser (Decision E6). |
| Preview surfaces (md/html/pdf/image/mermaid/data-tables) | Craft renderer preview components; TipTap markdown | `*-preview`, `mermaid`, `data-tables` | **REUSE** | Rich preview + Markdown editing exist. **Do not add a second Markdown editor** (non-negotiable #2). |
| LLM tool (`call_llm`) | `packages/shared/src/agent/llm-tool.ts` | `llm-tool` | **REUSE** | In-agent LLM calls exist. |
| Model routing / fusion / cache | — | — | **NEW** | Auto-routing/fusion/batch is Fleet's (Decision E3), API/OAuth lanes only, default-off. Deferred. |

### Composable / creative (all deferred — see `04-MILESTONES.md`)

| Capability | Craft code entry | Fleet class | Note |
|---|---|---|---|
| Workbench panel/layout host | builds on `views/` + settings/preferences | **EXTEND** | Register views/panels inside the Craft shell; never a second shell (Decisions P3, E1). |
| Spatial canvas projection/layout | builds on Craft sessions, SessionEvent, `views/`, preferences, workspace files, and preview components | **EXTEND/NEW** | New projection/layout surface inside the Craft shell; reuse the existing entity authorities and previews. The renderer is adapter-bound and selected by a real Electron spike. Not a document/job/artifact store. Deferred. |
| Agent/human canvas actions | builds on the caller-aware action spine and existing permission/timeline paths | **EXTEND** | Agent never writes renderer state. Read/search/select/place/group/reference/focus operations converge with human UI at the governed action/state seam and emit attributed evidence where consequential. Deferred until the action spine is real. |
| Composable workflows | — | **NEW** | Finite DAGs invoking the shared action path. A workflow edge is distinct from spatial/reference/provenance relations. Deferred. |
| Creative modules (image/video/web/deck) | — | **NEW** | Each registers capabilities/views on the spine. Deferred. |
| Governable experience distillation | builds on memory + validation | **NEW** | Milestone 6. Propose→review→retain. Deferred until a complete single-Agent chain and real delegation are proven. |
| Cross-agent TeamRun / seats / lanes | — (background tasks exist as a base) | **EXTEND/NEW** | Bounded team-runs + Fleet Bridge. Reuse session/background-task base; the orchestration spine is new (Decision C2). |

---

## The one-paragraph summary an agent must internalize

Craft v0.11 **already gives you**: sessions, the timeline, the permission modes + Agent enforcement
gate, a session-scoped Agent tool registry, two agent backends with shared tool context, built-in Bash/file tools with validation,
background shell execution, a terminal output UI, MCP external-provider integration, a CLI, workspace
file storage, sources/credentials/skills, projects/tasks/Kanban, dynamic views, automations, a
scheduler, search, settings, and the full BrowserPane+CDP+preview stack — most with a bundled
Agent-readable doc. **Fleet's genuinely new parts are few**: file leases, Library/ArtifactRef, an
interactive PTY runtime lane, model routing, the spatial canvas, composable workflows, creative
modules, cross-agent orchestration, and governable experience. **Everything else is REUSE or EXTEND.**
The most important gap near-term is not another registry: it is caller-aware invocation and attributed
evidence across existing UI and Agent adapters. When in doubt, assume Craft has a foundation, inspect
the real caller path, and classify the **remaining gap** rather than the feature name.
