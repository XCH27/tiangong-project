# 07 — Execution Playbook

> How to execute, delegate, deliver, and report. Ordinary bounded tasks need root
> [`AGENTS.md`](../AGENTS.md) plus the relevant capability row — open this file for high-risk,
> multi-agent, Git/delivery, or documentation work, and for the templates at the end.

## Authority order (when instructions conflict)

The document-scope order is defined once in [`00-START-HERE.md`](00-START-HERE.md). For execution,
apply it as follows: owner intent → safety/invariants → binding decisions → ACTIVE spec → code
reality/status → breadth → suite composition → reference notes. A code mismatch is evidence of an implementation
gap, not permission to change a decision, acceptance criterion, or authority silently. This file
defines the execution method only; it is not a second decision ledger.

A direct owner request authorizes ordinary reversible work inside its stated scope. The agent stops
only at the hard checkpoints in [`OWNER-GUIDE.md`](OWNER-GUIDE.md): meaningful new cost,
irreversible/public effects, production runtime commitments, new/replaced authorities or safety
boundaries, product forks.

## The method (every task)

1. **Orient minimally.** Root `AGENTS.md` → explicit owner Goal, or roadmap ACTIVE release → its
   spec (or the standing frontend/coverage track and its matrix/page rows). Add one decision,
   non-negotiable, or baseline document only when the slice touches it. Goal progress stays in the
   Goal/thread state, never a new planning file.
2. **Check Craft first, then check references.** Capability row in
   [`08-CRAFT-CAPABILITY-MAP.md`](08-CRAFT-CAPABILITY-MAP.md), inspect the code path, classify
   **REUSE / EXTEND / NEW**. Compare pinned v0.10.5 first for product/interaction behavior; inspect
   v0.11.1 only for selective fixes/backend mechanisms. Use the hosted-doc mirror only when later
   upstream behavior genuinely matters; hosted docs never override observed code. **For EXTEND/NEW
   work, run a bounded reference intake before designing:** open the domain's reference column in
   [`11-PRODUCT-MATRIX.md`](11-PRODUCT-MATRIX.md), read the named checkout's *specific relevant
   files/symbols* (not the whole repo), extract a mechanism list, and map each mechanism to the
   Craft seam it lands on. References exist to cut design and implementation time — designing an
   admitted domain from scratch without consulting its reference is a review finding. Admission
   authority: [`references/REFERENCE-REGISTRY.md`](references/REFERENCE-REGISTRY.md); checkout
   mechanics stay in [`源码参考/meta/`](../源码参考/README.md). Absorption limits (F3): mechanism
   reference / compatible adapter / licensed local rework — never product-shell copying.
   **Language-dependency rule:** only TypeScript/JavaScript references are eligible for licensed
   local rework into Fleet; non-TS stacks (Penpot = Clojure, OpenHands = Python, codex core = Rust)
   are mechanism/pattern reference only — never line-ported. A native binary runtime (e.g. ffmpeg)
   is a shipped production dependency = owner checkpoint.
3. **Find the real code** via [`06-CODE-MAP.md`](06-CODE-MAP.md); confirm with `rg`. For UI work,
   apply [`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md).
4. **Lock the block before editing** (internal checklist, not an approval form):

   ```text
   Outcome: the concrete user/system behavior this slice delivers
   Criteria: the spec acceptance criteria this slice moves (IDs)
   Classification: REUSE | EXTEND | NEW  (which Craft authority)
   Frontend: entry, visual anchor + intentional delta, interaction, visible states/view matrix
   Backend: authority, request → handler → persistence → caller-visible result
   Unchanged: adjacent behavior explicitly kept
   Reserved: spec/acceptance/tests/harness stay fixed for this attempt
   Docs after: exact user-facing/bundled doc + spec/capability row to update
   ```

5. **Check reality first** (Decision C8): existence, installation, running process, permission,
   input path, connectivity, tool availability — before diagnosing product code. Optional evidence
   failure (screenshot/preview/tool) is classified, not fixed.
6. **Build the smallest coherent change** that delivers real behavior and leaves the app working.
   Related UI, logic, state, recovery, and docs belong in one block; split unrelated outcomes.
7. **Verify per [`09-QUALITY.md`](09-QUALITY.md)** — cheapest sufficient ladder; stop rules apply.
8. **Update docs that changed, then report** with the capability vocabulary. If you touched a
   capability with no map row, add the row with its real code path.

## Risk calibration

| Risk | Examples | Required evidence |
|---|---|---|
| Low | copy/style tweak, local pure helper | static check; owner visually accepts visible changes |
| Medium | component behavior, route, RPC handler, persisted preference | static check + targeted test + non-visual data path; owner accepts UI interaction |
| High | shared protocol, migration, permission, credentials, destructive data, external side effects, **merge to remote main** | caller audit + targeted tests + end-to-end/restart/recovery evidence + independent review pass |

High risk means **stronger evidence**, not more ceremony.

## Capability reporting (use these words, honestly)

- `usable` — the requested loop is connected and real behavior confirmed; user-visible surfaces
  also have owner visual/interaction acceptance (or an explicit owner request for agent-driven
  review).
- `wired but not visually checked` — implementation and non-visual checks complete; owner has not
  yet accepted the rendered result.
- `display-only` — presentation exists without real behavior.
- `not implemented` — absent.

Before writing `usable`: the human path reaches real behavior (not a mock); human/Agent callers
share the canonical executor/state/evidence where applicable; at least one non-visual behavior
check ran; shared-contract changes handled all callers. **"Tests pass" is never a capability
status.**

## Engineering guardrails (reuse Craft's stack)

Guardrails are a stack, not a prompt. Craft already ships it — use it, never rebuild or bypass it:
typecheck (`typecheck:all` / scoped), tests near your change (`bun test`), lint + i18n lints,
one-command gates (`validate:dev`, `validate:ci`), husky pre-commit hooks, GitHub Actions. Details
and when-to-run policy: [`09-QUALITY.md`](09-QUALITY.md). On top:

1. **Keep `main` always-runnable.** Risky work on short-lived branches; a broken direct-to-main
   change is fixed or reverted before anything else.
2. **Every change is a reviewable diff**, reviewed file-by-file before landing. Surface the diff to
   the owner for anything in the checkpoint list.
3. **Dangerous commands go through Craft's permission gate** and stop for the owner
   (`rm -rf`, `DROP TABLE`, `git push --force`, data deletion, external side effects). Read-only
   commands, tests, and builds auto-run.
4. **High-risk changes get an independent review pass** — another agent or a fresh caller/diff
   audit; the requirement is independent scrutiny, not ceremony.
5. **Know the rollback before a risky change** (git revert, inverse action, feature toggle). No
   clean rollback = owner checkpoint.

## Multi-agent work (only when it genuinely helps)

Use a supporting agent only for truly independent work (separate read-only audits, disjoint areas,
verification that doesn't edit the same files). Do not parallelize a small linear change. Rules
(operationalizing Decisions C3, C5–C6, C11):

- **The main agent owns** scope, direction, integration, conflict resolution, final verification.
- **No bare spawn.** Every child gets a TaskBrief (template below); default scope as narrow as
  possible; unscoped "explore the whole repo" is denied.
- **Budgets halt.** A child crossing its budget stops; the parent deliberately continues, narrows,
  or absorbs the work.
- **No transcript dumps** in; **no transcript dumps** out — a bounded RunReport with references.
- **Every child returns** an implementation artifact, a requested decision, or a blocking fact.
  Review-only work needs an explicit risk trigger; no recursive review assignment.
- **Shared contracts have one integrator** who inspects all callers and lands one migration.
- Resolve conflicts by comparing behavior/intent/state authority and choosing one solution — never
  by adding a second store/adapter/path.

## Bounded feature development

1. **One primary feature per branch/worktree.** Unrelated features in separate short-lived
   branches. Register only big features in [`FEATURE-REGISTRY.md`](FEATURE-REGISTRY.md).
2. **Bound by existing paths** — a slice may cross renderer/RPC/server/shared layers for one
   coherent outcome; no `modules/<feature>/` parallel architecture.
3. **Keep branches short-lived**; start from the verified baseline; integrate promptly. (The
   sprawling uncommitted tree that triggered R0 is the cautionary example.)
4. **Cross-branch dependencies are explicit:** land the shared contract via its integration owner,
   then dependent branches rebase. No branch relies on another worktree's uncommitted state.
5. **Parallel writers require isolation** — disjoint paths or separate worktrees; one agent owns
   final integration.
6. **Merge coherent loops in dependency order**; never merge a display-only shell and call the
   feature complete.
7. **Deliberate competition is exceptional** and requires an explicit decision for a
   high-uncertainty choice, ending with one selected implementation.

### Design notes are deltas, not copied specifications

A high-risk, cross-package, persisted, or externally observable feature keeps a short design delta
at a natural repo location: purpose/non-goals/allowed paths; REUSE/EXTEND/NEW findings; the exact
extension point; adopted and rejected assumptions; interfaces/policy/failure/recovery; shared-
contract migration. Link the relevant source note; do not copy it. Code remains the truth.

## Git and delivery

- Preserve user data and unrelated working-tree changes. No forced/destructive Git operations
  without explicit owner authorization.
- A PR is a remote delivery protocol, not the task board. Agents run `git`/`gh` under permission.
- Push branch / open PR: ordinary permissioned work. **Merge to remote main: high-risk, explicit
  confirmation.**

## Documentation discipline

- Write target design as behavior loops with completion evidence — never "short/medium/long term"
  calendar phases. Current truth lives in `00-START-HERE.md`, the roadmap, `FEATURE-REGISTRY.md`,
  and capability rows.
- Every capability must resolve through `modules/PACKET-INDEX.md` to R0–R18. At R16–R18, a
  conditional capability is completed by the smallest proven Craft extension or by reproducible
  `NO_GAP` evidence; an Agent may not leave it as “future work”.
- A behavior-changing slice updates its spec, capability row, and user-facing/bundled docs in the
  same slice. A code-path move updates `06-CODE-MAP.md`. Amend decisions in place with a date.
- Never update usage documentation from a proposal — implement and verify first.
- Do not grow documentation faster than implementation; do not create planning documents for
  ordinary implementation details; do not keep superseded reports ("no memorial garbage": migrate
  the surviving fact, delete the artifact — subject to the destructive-action rules in 03 §6).

---

## Templates

### TaskBrief (delegating to a supporting agent)

```text
GOAL: <one sentence, the deliverable>
ACCEPTANCE: <2-5 checkable criteria, stable IDs if from a spec>
SCOPE PATHS: <exact allowed paths>   RESERVED: <paths it must not touch>
KNOWN FACTS: <3-15 facts you already paid to learn — entry points, gotchas, decisions>
REFERENCES: <exact reference files/symbols to consult (from the matrix row), or "none">
CONSTRAINTS: <tests to run, "do not push/merge", risk ceiling, relevant decision IDs>
DELIVERABLE: <artifact form: diff, report file, decision + evidence>
BUDGET: <max tool turns / soft token cap — a circuit breaker, not a label>
CONTEXT FORK: <none | last N turns | full history — choose deliberately>
```

### RunReport (returning from a supporting agent)

```text
OUTCOME: <one sentence: what this run delivered and what remains>
CRITERIA: <each acceptance criterion → met / unmet + evidence ref>
CHANGED: <paths changed or produced>
EVIDENCE: <commands run + results, test names, file refs — pointers, not dumps>
DECISIONS: <choices made that the parent must know>
OPEN: <blockers, risks, incidental findings (queued, not fixed)>
STATUS: usable | wired but not visually checked | display-only | not implemented
```

### Slice handoff report (to the owner)

```text
WHAT CHANGED: <plain language, one short paragraph>
STATUS: <capability vocabulary, per surface>
CHECK THIS: <the 1-5 surfaces/clicks the owner should look at>
NOT CHANGED: <adjacent things deliberately kept>
DOCS UPDATED: <spec/row/user-doc paths>
```

### Worked example (bounded, realistic)

```text
GOAL: Localize the four built-in session status names in the Board header (zh-Hans).
ACCEPTANCE: [R1-C4] untouched starter statuses render localized in Board header and
  status menu; [R1-C5] a user-renamed status renders verbatim; i18n parity lint passes.
SCOPE PATHS: app/apps/electron/src/renderer/components/app-shell/kanban/,
  app/apps/electron/src/renderer/config/session-status-config.tsx, app/packages/shared i18n catalogs
RESERVED: docs/specs/R1-one-boundary-language.md, existing tests
KNOWN FACTS: status IDs persist in the label store and must stay stable (Decision E10);
  render-time localization only; catalog keys live beside existing label keys;
  KanbanBoardHeader has an existing test to extend, not replace.
REFERENCES: none (Craft-internal REUSE/EXTEND; matrix row lists no external reference).
CONSTRAINTS: bun run typecheck:electron; targeted kanban tests; no new store; no new setting.
DELIVERABLE: diff + slice handoff report.
BUDGET: 25 tool turns.
CONTEXT FORK: none.
```

A matching good RunReport ends: `STATUS: wired but not visually checked — owner should check the
Board header and status menu in zh-Hans and English.`
