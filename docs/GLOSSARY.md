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

### AssetLease
A lock token held by a specific seat on a workspace file, preventing write conflicts during execution.

### DesignAction
A structured Canvas envelope containing coordinate changes, drawing elements, or design system tokens.

### ExternalJob
A low-priority background process (such as video rendering or batch AI calculations) offloaded to sandbox executors.

### Manager Agent
The global, persistent agent coordinating software context, settings, and team orchestrations.

### Project Agent
A specialized agent seat spawned to execute tasks on a specific project workspace under strict role/domain restrictions.


### Captain
The interactive user approval interface in the desktop shell UI where L3 destructive commands and DestructiveHints are suspended awaiting human resolution.
