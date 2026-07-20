# 08 — Craft Capability Map

> Use this as an index, not a reading assignment. Find the row for the active capability, inspect
> the listed code, then confirm with `rg`. Third-party comparisons live in
> [`源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](../源码参考/meta/CAPABILITY-REFERENCE-MAP.md).

## Classification

- **REUSE** — call or improve the existing Craft authority.
- **EXTEND** — add behavior to the existing authority and migrate every caller coherently.
- **NEW** — Craft has no authority for it; still connect it to existing Session, permission,
  timeline, Workspace, and Task boundaries.
- **CONDITIONAL** — do not build until a real caller or measured failure proves the need.

If a capability is absent, inspect current code before adding one concise row. Never add a second
session, permission path, timeline, task/job store, settings home, browser stack, or shell.

Paths are relative to `app/`.

## How to execute a map row

A row is a locator and boundary, not a complete specification. For a REUSE fix, inspect the listed
authority and its callers. For EXTEND / NEW, follow the route:

```text
current Craft authority → binding decision/spec → exact missing edge
→ first real producer + consumer → observable failure/recovery proof → promoted shared contract
```

A technical detail is binding only when present in current code, the numbered documents, an active
spec, or the current owner request. Deleted historical documents are never an implicit
specification; the retained failure lessons live in [`04-ARCHITECTURE.md`](04-ARCHITECTURE.md) §3.

## Core authority map

| Capability | Current authority / code entry | Class | Fleet boundary |
|---|---|---|---|
| Session lifecycle and persistence | `packages/server-core/src/sessions/SessionManager.ts`; `packages/shared/src/sessions/` | REUSE | One Session authority. |
| Session evidence | `packages/shared/src/protocol/dto.ts` `SessionEvent`; protocol events/channels | REUSE/EXTEND | Extend events only when a real consumer needs durable or attributed evidence. |
| Permission modes and Agent gate | `packages/shared/src/agent/mode-manager.ts`; `core/pre-tool-use.ts`; SessionManager approval flow | REUSE | `safe` / `ask` / `allow-all` remain authoritative; no parallel policy engine. |
| Agent session tools | `packages/session-tools-core/src/tool-defs.ts`, `handlers/`, `context.ts` | EXTEND | Registry covers Agent tools, not human RPC or SDK built-ins. |
| Human/Agent shared actions | UI RPC + Agent tool/PreToolUse + owning service | EXTEND | **`not implemented` as a generic seam.** Route: [`specs/R4-action-seam.md`](specs/R4-action-seam.md). |
| Usage and context accounting | `packages/shared/src/agent/core/usage-tracker.ts`; usage events | EXTEND | Add real/estimated/unknown cost to the existing path; no second ledger. |
| Prompt queue and mid-turn steering | `SessionManager.messageQueue`, `sendMessage`, `processNextQueuedMessage`; backend `redirect` | EXTEND | Preserve disk-before-ack and restart replay. |
| Project/Workspace | Workspace config/root plus current nested Project compatibility | REUSE/EXTEND | Target model Project = Workspace = one folder, single switcher, task-first entry (P6/P10); migrate explicitly via [`specs/R1-one-boundary-language.md`](specs/R1-one-boundary-language.md). |
| Tasks, Board and scheduling | `packages/shared/src/tasks/`; `server-core/src/tasks/`; Session status/labels; scheduler | REUSE/EXTEND | No second task, issue, or job authority. |
| Task execution integrity / drift control | Task store + TaskRunner + SessionEvents + PreToolUse + UsageTracker | EXTEND | TaskContract projection, preflight classification, criterion/path gate, no-progress halt, independent verdict (roadmap R6). `not implemented`. |
| Settings, credentials, Sources and Skills | existing shared stores/managers and Electron settings | REUSE/EXTEND | One settings home; one effective capability provenance path. |
| Identity labels and statuses | `packages/shared/src/labels/`; status configuration | REUSE/EXTEND | Decision E10. Skill/Source/permission binding: `not implemented`. |
| Search and dynamic views | `packages/shared/src/search/`; `views/` | REUSE/EXTEND | Views are projections, never state authorities. |
| Automations | `packages/shared/src/automations/`; server automation handlers; scheduler | REUSE/EXTEND | Extend existing scheduler/Session/Task paths. |

## Runtime and execution map

| Capability | Current authority / code entry | Class | Fleet boundary |
|---|---|---|---|
| Claude/Pi backends | `packages/shared/src/agent/claude-agent.ts`, `pi-agent.ts`, shared tool context | REUSE | Provider differences stay behind existing backend seams. |
| Additional CLI/API/ACP runtimes | backend seam + SessionManager adapters | EXTEND | One adapter contract: start/attach/send/cancel/approve/health/stop; all events map into Fleet authorities. |
| Built-in Read/Write/Edit/Bash | SDK built-ins plus `core/pre-tool-use.ts` | REUSE | Permission checks stay in PreToolUse. |
| Command validation | shared Bash/PowerShell validation and permissions config | REUSE/EXTEND | Extend command-aware validation; never trust names or external `readOnlyHint` alone. |
| Background shell | Bash background path; shell/task events in SessionManager | EXTEND | Reuse existing execution registry and events. |
| Interactive PTY | no complete authority | NEW, CONDITIONAL | R18 implement-or-`NO_GAP`: only for a real interactive caller; reuses Session permission/evidence/cancellation. |
| OS isolation | `packages/session-tools-core/src/runtime/{filesystem-isolation,network-isolation,sandbox-env}.ts`; `handlers/script-sandbox.ts` | REUSE/EXTEND, CONDITIONAL | A baseline isolation path exists and is tested; R18 adds a dedicated OS sandbox only when a real risk profile exceeds current permission and process boundaries, otherwise closes `NO_GAP`. |
| Checkout/worktree isolation | Git/process integration | NEW | Execution location, checkout isolation, and provider choice stay independent (P9). |
| Multi-Agent execution | child Sessions, `parentSessionId`, TaskRunner DAG, background-task registry | REUSE/EXTEND | Add stable task paths, bounded context, mailbox/wait, runtime adapter — no new stores (roadmap R6). |
| Adaptive organization | orchestration policy over existing Task/Session authorities | EXTEND | R17: route by measured risk/cost (C5–C6) using R6+ accepted-outcome evidence, or close `NO_GAP`. |
| Model routing/fusion | backend seam + UsageTracker | EXTEND/NEW, CONDITIONAL | R17 implement-or-`NO_GAP`; default off and API/OAuth lanes only (E3). |
| Context projection / token economy | existing compaction, large-response paths, `core/rtk-rewrite.ts`, UsageTracker; provider prompt/tool assembly | EXTEND, CONDITIONAL | E12/E13. Reuse the one ledger and existing provider lanes. TE1 is observation-only; after R0 + baseline, extend one centralized effective projection for prompt/tools and test Pi-light as a profile, never a second kernel. ArtifactRef/TaskBrief remain R5/R6; typed compression and Tool Search require measured gates. Raw evidence stays recoverable. |
| External computer/environment control | BrowserPane/CDP, file/shell tools, script isolation, remote Workspace transport, existing permission path | EXTEND, CONDITIONAL | R16 implement-or-`NO_GAP`. Prefer native/structured Craft routes; Computer Use is a fallback only after a real task proves those insufficient. Require environment/display identity, capability/availability, expiring grant and stale-observation rejection; no generic Environment adapter before a second implementation. Hermes/OpenClaw are evidence only. |

## Files, artifacts and production surfaces

| Capability | Current authority / code entry | Class | Fleet boundary |
|---|---|---|---|
| Workspace files | Workspace filesystem and existing file tools | REUSE/EXTEND | Governed file actions enforce containment, permissions, visible errors, recovery. |
| Concurrent file leases | none | NEW | Only for the first real multi-writer loop; filesystem bytes remain native authority. |
| ArtifactRef and Library | none | NEW | Versioned reference/provenance envelope over native bytes (roadmap R5); never a second byte store. |
| Document ingestion | Sources + preview/tool conversion paths | EXTEND | Preserve native file reference and conversion provenance. |
| Code intelligence | MCP/Sources | REUSE, CONDITIONAL | Optional provider; degrades cleanly. |
| BrowserPane and CDP | Electron BrowserPane/CDP and `browser_tool` | REUSE/EXTEND | One in-app browser authority (E6). |
| Markdown/HTML/PDF/image/diagram previews | existing renderer preview components and TipTap | REUSE | No second Markdown editor. |
| Workbench panels | `views/` + settings/preferences | EXTEND | Register inside the Craft shell; panels are projections. R18 closes any docking gap from a real R10/R12 surface. |
| Spatial canvas | views + Session/Workspace/file projections | EXTEND/NEW | Renderer adapter-bound and benchmark-gated (E5a; roadmap R7). |
| Native design documents | no Fleet schema authority | NEW | Decision E11; Penpot is reference evidence only. |
| Finite workflows | no complete workflow authority | NEW | DAG invokes governed actions and existing Task/runtime/permission paths (roadmap R8). |
| Creative modules | existing files/previews plus R4 action, R5 ArtifactRef and R11 Job seams | NEW | R10–R13: each module owns only its native schema (E4) and extends the Craft shell/authorities. |
| Built-in extensions | tool/Sources/Skills/views/permission authorities | EXTEND | Built-in loading and permission parity before any external distribution. |
| Governed experience | Session evidence + Workspace knowledge | NEW | Layered agent-maintained memory files + logged consolidation (roadmap R9, D5 floors); curation optional; no hidden second store. |

## External services and distribution

| Capability | Current authority / code entry | Class | Fleet boundary |
|---|---|---|---|
| MCP and external providers | `packages/shared/src/mcp/`; Sources | REUSE/EXTEND | Optional connector; absence must not break startup. |
| CLI client | `apps/cli/` and server transport | REUSE/EXTEND | Reuse commands and transport; no second local daemon by default. |
| Remote/self-hosted execution | server transport, Workspace routing, WebUI | REUSE/EXTEND | User-owned target (P7/P9); identity, capability, disconnect states explicit. |
| Messaging | messaging gateway/workers and settings/handlers | REUSE/EXTEND | One Workspace-scoped adapter contract; platform absence honest. |
| Desktop OAuth | existing local callback path | REUSE | Independent of Craft cloud. |
| WebUI/Slack OAuth relays | shared auth relay modules | EXTEND | User-configurable/self-hosted or explicitly unavailable (R2). |
| Online sharing | branding, SessionManager share path, viewer | EXTEND/REPLACE | Local export or explicit configured target (R2); never silent upload. |
| Application updates | auto-update and Electron builder config | EXTEND/REPLACE | Fleet-controlled/user-configured signed channel or honestly disabled (R2). |
| Help/docs | bundled docs and docs MCP | REUSE/EXTEND | Local/bundled first; hosted Craft docs visibly external (R2). |
| Upstream intake | pinned Craft reference, tags, release notes | REUSE | Selectively port reviewed changes; never merge wholesale. |

## Reference routing

Open-source checkouts are disposable evidence caches, not Fleet modules. For a capability
comparison, use [`源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](../源码参考/meta/CAPABILITY-REFERENCE-MAP.md).
Open a checkout only when current code leaves a concrete question unanswered. A listed project is
only a candidate until source-level implementation, same-task superiority, credible alternatives,
the bounded local-improvement test, authority fit, licensing, and retention value all pass the
admission rules in [`源码参考/meta/PLAYBOOK.md`](../源码参考/meta/PLAYBOOK.md).

## Summary

Craft already provides the product spine: Session, permission, evidence events, backends and tools,
background execution, MCP, Sources, Skills, credentials, Tasks, views, automations, scheduler,
settings, browser, previews. Fleet's genuinely new work is limited to proven gaps — the action
seam, file coordination, ArtifactRef/Library, bounded delegation, finite workflows, native creative
documents, governed experience — each attached to the existing spine through one real vertical
behavior loop, in roadmap order.
