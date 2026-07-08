# Ownership Matrix

This matrix prevents parallel agents from claiming the same shared packages.

It is not a detailed file list for every task. It is the control plane that says which module owns which package areas and where contract changes must go through the Lead.

## Package Map

| Area | Path | Primary Purpose | Contract Owner |
|---|---|---|---|
| Electron shell | `app/apps/electron/src/main`, `preload`, `transport` | Desktop window, IPC, local OS bridge | Lead |
| Renderer shell | `app/apps/electron/src/renderer/components/app-shell` | Craft workbench shell, panel stack, input, session views | Lead for layout; module agents for owned components |
| Settings UI | `app/apps/electron/src/renderer/pages/settings` | User settings, runtime settings, capability/loadout settings | Lead defines IA; module agents fill assigned pages |
| Shared protocols | `app/packages/shared/src/protocol` | DTOs, events, channels, action contracts | Lead only |
| Server core services | `app/packages/server-core/src/services` | Local services, runtime adapters, actions, memory, quota, files | Module owner per service |
| Server RPC handlers | `app/packages/server-core/src/handlers/rpc` | Local RPC entrypoints | Lead registers; module agents fill assigned handlers |
| Sessions | `app/packages/server-core/src/sessions` | SessionManager, persistence, timeline dispatch | Lead for core; module agents only through explicit packet |
| Session tools | `app/packages/session-tools-core/src` | Agent-callable tool handlers | Module owner, with Lead-owned schema changes |
| Session MCP server | `app/packages/session-mcp-server/src` | Fleet Bridge MCP tools | TeamRun/RuntimeLane module owner |
| Core package | `app/packages/core/src` | Shared app domain logic | Lead unless packet assigns focused change |
| UI package | `app/packages/ui/src` | Shared UI primitives/design tokens | Lead/design-system owner |
| Messaging | `app/packages/messaging-*` | Messaging gateways | Messaging module owner |

## Module By Package Matrix

| Module | Shared Protocol | Server Core | Renderer | Session Tools / MCP | Notes |
|---|---|---|---|---|---|
| Platform Spine | Lead | Lead | Lead | Lead | Owns session, permission, timeline, actor/runtime metadata. |
| Clean Craft Baseline | Lead | Lead | Lead | Lead | Upstream sync, shell simplification, no product feature expansion. |
| Terminal / CLI Runtime | Lead freezes `cli-runtime`, `team-run` hooks | `cli-runtime-*`, runtime launcher, PTY services | terminal surface, runtime settings | runtime tools and bridge injection | Must not turn chat into CLI picker again. |
| Internal Action Registry | Lead freezes `internal-action` | registry, executor, file/action services | action-backed UI entries | `list_internal_actions`, `invoke_internal_action` | Human and agent use same action id. |
| Runtime Lanes / TeamRun | Lead freezes `team-run` | coordinator, leases, launcher integration | team cards, member drawer, lane badges | Fleet Bridge MCP tools | Highest conflict risk. |
| Files / Library / Leases | Lead freezes file/lease events | file services, Library index, lease persistence | Files panel, Library views | file actions | Raw files and Library remain distinct. |
| Browser / Artifact Workflow | Lead freezes selection/action contracts | browser evidence, artifact handoff | BrowserPane selection UI, annotation, artifact studio | browser/artifact actions | Remote pages are read/annotate only. |
| Canvas / Design Surface | Lead freezes `canvas` before work | canvas bridge/action services | canvas surface/components | canvas actions | Native engine, not iframe DOM mutation. |
| AIGC / External Jobs | Lead freezes `external-job`, `usage` | job services/providers | job views/result assets | external-job actions | Providers require permission and cost attribution. |
| Video Surface | Lead freezes video action contracts | video timeline bridge/render jobs | video editor surface | video actions | OpenCut Classic source boundary applies. |
| Memory / Context / Review | Lead freezes `memory`, `usage` | memory, project pack, review, context services | context/review UI | memory/review actions | Real/estimated/unknown must stay separated. |
| Model Routing / Cost Ledger | Lead freezes `routing`, `subscription`, `usage` | routing, cache, quota adapters | token ring, model settings | routing read tools | API lanes only; CLI bypasses. |
| Capability / Skill / Plugin | Lead freezes `capability` | catalog, loadout, resolver | capability settings/marketplace | loadout/skill actions | Install, loadout, runtime are separate. |
| Settings / Shell UX | Lead | focused services only | settings IA, shell placement | none unless assigned | UI placement is Lead-owned. |
| Messaging | Lead if protocol changes | gateway services | messaging settings | messaging tools if any | Retained by D28, not silently removed. |

## Shared Contract Rule

If a task needs a new event, RPC namespace, DTO field, i18n key, session persistence field, permission level, or action surface, the Lead updates the contract first and then hands implementation to the module agent.

## Deletion Rule

Non-Lead agents cannot delete:

- shared protocol files
- registered action ids
- license or attribution files
- tests/fixtures used by another module
- settings registry sections
- session persistence fields

Deprecated code must be marked, migrated, and proven unused before deletion.
