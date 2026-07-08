## Handoff Report (Multi-Agent Parallel Workflow)

> **Agent Read First**: Complete this coherent user-visible loop report. Follow the strict rules outlined in `AGENTS.md`. Do not bypass permission boundaries. 

### 1. Context & Packet
- **Wave / Packet ID**: [e.g., Wave-1-runtime-files]
- **Target Module**: [e.g., Internal Action Registry]
- **Worktree / Branch**: `branch-name`
- **Related Issue**: Fixes #

### 2. Files Changed (Ownership Matrix Compliance)
> Verify that you only modified files you currently own or requested lead approval for shared contracts.

- [ ] I have read the latest `docs/OWNERSHIP-MATRIX.md`.
- [ ] No `docs/legacy/` files were mutated.
- [ ] No forbidden/read-only files were touched.

**Key Changes:**
- `app/path/to/modified.ts` - Brief reason
- `app/path/to/new.ts` - Brief reason

### 3. Validation Rhythm
> Do not micro-test after every small edit. Finish a coherent feature block and run cheapest checks.

- [ ] `bun run typecheck:all` (or static analysis) passed.
- [ ] `./scripts/fleet-verify.sh` passed.
- [ ] (If applicable) Real behavior checks for user-facing flows performed via manual validation or E2E tests.

### 4. Implementation Status
*Status must be reported as one of the following:*

- [ ] `usable`: Complete and functional.
- [ ] `wired but not visually checked`: Logic connected, but UI/visuals need human verification.
- [ ] `display-only`: Mocked or static display, logic not connected.

**Remaining `not implemented` items:**
1. [List any skipped logic, mocked behaviors, or out-of-scope work]
2. ...

---
**For Manager Agent / Human Reviewer:**
- [ ] Review Timeline evidence for permission overrides.
- [ ] Review Local memory / Context packaging limits.
