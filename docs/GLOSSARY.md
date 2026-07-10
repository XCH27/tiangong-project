# Fleet Project Glossary

This document establishes the official terminology and schemas for all active systems across Fleet. All module specifications, code symbols, and database fields must use these terms strictly to prevent semantic drift.

---

## 1. Core Terminology

### Session
A continuous state workspace context containing files, histories, and event lists. A session is the atomic scope of execution.

### SessionEvent
A structured event emitted to the database timeline representing any state change, user interaction, or agent execution.

### RuntimeLane
An execution pipeline assigned to a specific seat, defining its boundary (API runtime, CLI runtime, desktop shell).

### TeamRun
A multi-agent, cross-lane execution task coordinated by the Fleet Bridge, grouping work across teammates.

### PermissionDecision
The formal output of the L0-L3 authorization evaluator, deciding if an action invocation is allowed, blocked, or paused.

### Evidence
A verified snapshot, file log, or process stdout hash attached to a SessionEvent, serving as auditable proof of work.

### LibraryAsset
A file, template, or design system snapshot that has been selected, hashed, licensed, and indexed under the Library database.

### ArtifactRef
A versioned, typed handoff envelope pointing to a real file, Library asset, evidence bundle, or
native document version. It carries provenance/sensitivity/parents but does not own duplicate
content.

### AssetLease
A lock token held by a specific seat on a workspace file, preventing write conflicts during execution.

### DesignAction
A native design-module operation envelope. It is not the universal spatial, workflow, file, web,
presentation, or media patch format.

### ExternalJob
A durable asynchronous operation such as generation, render, export, or provider batch work.
Priority is explicit; the job is reconciled across restart and does not imply a separate queue per
module.

### CapabilityManifest
A versioned declaration of a module's operations, typed ports, execution modes, policies,
dependencies, resources, and optional view contributions. Installation does not grant permission.

### CapabilityOperation
One canonical composable operation mapped to an ActionDefinition/action ID. Human controls, Agent
tools, and workflow steps are projections of the same operation.

### SpatialDocument
M07's versioned document containing entity bindings, positions, presentation data, and visual
reference connectors. It does not own executable workflow edges or native document contents.

### WorkflowDefinition
An inspectable, immutable-version DAG of capability operations, typed bindings, finite policy, and
resource budget owned by M17.

### WorkflowRun
M17's durable correlation record over M03 invocations, M04 tasks when used, and M08 jobs. It is not
a second action executor, TeamRun, session, or job queue.

### ViewContribution
A module-provided panel, surface, or inspector definition validated and hosted by M16.

### ViewInstance
One open occurrence of a ViewContribution with typed route state. Closing the instance does not
delete or cancel the domain object it displays.

### LayoutSnapshot
A versioned M16 projection of view instances and dock geometry stored through canonical
preferences. It contains no domain business state.

### NativeDocument
A module-owned editable document such as a media project, web project, MotionDeck, or design file.
The canvas and panels show references/projections; the native owner controls schema and recovery.

### Manager Agent
The global, persistent agent coordinating software context, settings, and team orchestrations.

### Project Agent
A specialized agent seat spawned to execute tasks on a specific project workspace under strict role/domain restrictions.


### Captain
The interactive user approval interface in the desktop shell UI where L3 destructive commands and DestructiveHints are suspended awaiting human resolution.

### Spec Maturity
Documentation quality independent of capability status: `concept`, `contract draft`, or
`execution-ready`. See `docs/DOCUMENT-READINESS.md`.
