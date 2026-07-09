# Fleet Agent Packets

> **This packet is a bounded execution contract, not a roadmap.**

Every worker agent packet under this folder must follow the standardized structure below to ensure precise scopes and eliminate code collisions:

## Standard Work Package Template

### 1. Mission
A short, actionable statement of the specific capability to be built.

### 2. Allowed Files
An explicit list of files and paths the worker is authorized to edit. Edits to files outside this list will trigger `PERMISSION_DENIED`.

### 3. Forbidden Files
Paths that must not be modified under any circumstances (such as shared contracts or database cores).

### 4. Pre-Flight Checks
Standard verification checks that must pass before writing any code.

### 5. Exit Criteria
A concrete validation list proving the feature loop works end-to-end.

### 6. Handoff Format
The exact format for the completion report.

### 7. Blocker Reporting
Steps to report blockers back to the Lead.
