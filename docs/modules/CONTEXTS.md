# Canonical bounded contexts

The registry has many rows for coverage, but implementation must converge on these eight contexts.
Rows are sub-capabilities, surfaces, adapters or connectors unless they have their own domain
invariants and independently testable seam.
Bounded contexts describe authority ownership; the larger independent delivery systems that combine
several contexts are defined separately in [`../16-SYSTEM-SUITES.md`](../16-SYSTEM-SUITES.md). A
suite may consume several contexts, but it may not merge their state authorities.

| Context | Canonical authority | Owns | Does not own |
|---|---|---|---|
| Work Core | Workspace/Session/Task/Settings/SessionEvents | project identity, sessions, tasks, settings, event history | media, browser, memory or workflow copies |
| Governed Execution | Action/Permission/TaskRunner/Runtime | policy, invocation, local execution, delegation, isolation, remote transport | product documents or external provider state |
| Information & Evidence | Files/Library/ArtifactRef/Sources | files, versions, provenance, evidence and ingestion | session lifecycle or renderer layout |
| Intelligence | UsageTracker/provider adapters/Memory review | context, token/cost, model capability, memory proposals and review | raw timeline or execution authority |
| Creative Media | native media/design/deck documents | video, image, audio, captions, design, web and deck domain models | permissions, jobs, project identity or canvas layout |
| Composition | Canvas/Workflow definition/Workbench | spatial projection, composition and panel layout | the state of projected objects or execution facts |
| Integrations & Delivery | Job/Automation/Messaging/Update/Telemetry adapters | external delivery, queues, connectors and opt-in telemetry | Fleet core authorities |
| Capability Distribution | MarketplacePackage/Manifest/Catalog/InstallReceipt | skill, plugin and MCP discovery, trust, compatibility and lifecycle transactions | runtime permissions, Session/Task state or provider credentials |

## Merge decisions applied to the registry

- Canvas, Board, Search and Inspector are surfaces, not data modules.
- FFmpeg, Remotion, runtime providers and messaging gateways are adapters, not product authorities.
- Captions, transcript, export profiles, model routing and token pruning are capabilities within a
  parent context, not independent persistence systems.
- Jobs and queues are one execution/delivery authority; image, audio and video generation do not
  create provider-specific job stores.
- Workflow definition is a Composition concern; workflow execution is a Governed Execution
  projection over TaskRunner, not a second run history.
