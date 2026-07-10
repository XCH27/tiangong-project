# Fleet Agent Packets

> **This packet is a bounded execution contract, not a roadmap.**

## Current Packet Status

Only `wave-0.1-control-plane-reconciliation.md` is active, and it is Lead-only documentation/
migration work. All historical W1/W2/W3/F-Track packets in this directory are marked superseded
and authorize no implementation. They are retained until a later archive pass because deleting
evidence before replacement packets exist is prohibited.

A new Worker packet may be issued only when the exact slice is `execution-ready` in
`DOCUMENT-READINESS.md` and Ready in `WAVE-MODULE-MAP.md`.

Every Worker packet must include all twelve fields required by
`PARALLEL-AGENT-OPERATING-MODEL.md`; the seven headings below are organisational groups, not a
smaller competing template.

## Standard Work Package Template

### 1. Mission
A short, actionable statement of the specific capability to be built.

### 2. Allowed Files
An explicit list of files and paths the worker is authorized to edit. Edits to files outside this list will trigger `PERMISSION_DENIED`.

The list is generated from the exact clean-v0.11 paths in `OWNERSHIP-MATRIX.md`; no `TBD` path may
appear in an executable packet.

### 3. Forbidden Files
Paths that must not be modified under any circumstances (such as shared contracts or database cores).

### 4. Pre-Flight Checks
Standard verification checks that must pass before writing any code.

Include wave Ready, spec execution-ready, frozen contract versions, interfaces consumed/produced,
one Worker/worktree/branch, and file/scope overlap checks.

### 5. Exit Criteria
A concrete validation list proving the feature loop works end-to-end.

### 6. Handoff Format
The exact format for the completion report.

### 7. Blocker Reporting
Steps to report blockers back to the Lead.
