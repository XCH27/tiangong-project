# Fleet Agent Packets

> **A packet is a bounded execution contract, not a roadmap.**

## Current Packet Status

| Packet | Role | Status |
|---|---|---|
| `wave-0.1-control-plane-reconciliation.md` | Lead-only documentation / migration | **Active** |
| `WORKER-PR-TEMPLATE.md` | Template only | Active template; not a work grant |
| Everything under `docs/legacy/agent-packets/` | Historical | **Superseded** — authorize nothing |

A new Worker packet may be issued only when the exact slice is `execution-ready` in
`DOCUMENT-READINESS.md` and Ready in `WAVE-MODULE-MAP.md`.

Every Worker packet must include all twelve fields required by
`PARALLEL-AGENT-OPERATING-MODEL.md`; the seven headings below are organisational groups, not a
smaller competing template.

Packets must list **exact** allowed files. No `TBD` or `currently unassigned` path may appear in
an executable Worker packet. Paths are taken from the verified clean-v0.11 mapping in
`OWNERSHIP-MATRIX.md` after the migration ledger records them.

## Standard Work Package Template

### 1. Mission
A short, actionable statement of the specific capability to be built.

### 2. Allowed Files
An explicit list of files and paths the worker is authorized to edit. Edits to files outside this list will trigger `PERMISSION_DENIED`.

### 3. Forbidden Files
Paths that must not be modified under any circumstances (such as shared contracts or database cores).

### 4. Pre-Flight Checks
Standard verification checks that must pass before writing any code.

Include wave Ready, spec execution-ready, frozen contract versions, interfaces consumed/produced,
one Worker/worktree/branch, file/scope overlap checks, and a filled three-axis status block from
`AGENTS.md`.

### 5. Exit Criteria
A concrete validation list proving the feature loop works end-to-end.

### 6. Handoff Format
The exact format for the completion report (include three-axis status).

### 7. Blocker Reporting
Steps to report blockers back to the Lead.
