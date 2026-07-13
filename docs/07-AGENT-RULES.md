# 07 — Agent Rules

> The working contract for any AI agent executing on this project. Read this and `00-START-HERE.md`
> before touching anything. It is written to keep execution **verifiable and on-course** — that is the
> whole point of this project's reset.

## Authority order (when instructions conflict)

1. The current owner request.
2. Safety and user-data protection (`03-NON-NEGOTIABLES.md` §5).
3. Current code facts (what the code actually does — confirmed by reading it, not assuming).
4. This document set (00–08).
5. Nothing else. There is no other rule system. Retired Waves/packets/gates do not exist anymore.

A direct owner request authorizes inspection and other ordinary in-scope preparation. **Before every
new or modified product feature, however, the owner requires one explicit slice confirmation covering
the frontend and backend together.** This is a short product-alignment checkpoint, not permission to
split the feature into two implementations. Additional questions are needed only when a missing
decision would materially change the product or cause an external / high-risk / irreversible effect —
the exact list of those moments is [`OWNER-CHECKPOINTS.md`](OWNER-CHECKPOINTS.md)
(money, irreversible actions, production runtime dependencies, new state/security authorities,
public effects, and product forks). The owner is
not a programmer, so when you stop at a checkpoint, present the decision in plain language: what, why,
the cost/risk, and 2–3 options with a recommendation.

## The method (every task)

1. **Orient minimally.** Read `00-START-HERE.md` and this execution contract. Read the mandatory
   capability map in step 2, then only the capability-specific source/docs it points to. Add one
   decision, non-negotiable, milestone spec, or UI baseline only when the slice touches it. Do **not**
   preload the whole corpus or design library.
2. **Check Craft first — MANDATORY.** This is a product fork of Craft Agents v0.11. Before writing
   any code, open `08-CRAFT-CAPABILITY-MAP.md`, find the capability, and compare three things: the
   pinned v0.11.1 implementation under `源码参考/software/craft-agents-oss/`; its bundled/versioned
   documentation; and the matching current hosted-document mirror under
   `源码参考/documentation/craft-agents-official/`. Classify the remaining Fleet gap as **REUSE /
   EXTEND / NEW**. Hosted docs may be newer than the pinned code and never override observed code.
   You are **forbidden** from building a parallel version of anything Craft already has. Most of what
   you need already exists — the recurring failure on this project has been ignoring that.
3. **Find the real code.** Use `06-CODE-MAP.md` and `08-CRAFT-CAPABILITY-MAP.md`, then confirm with
   `rg`. Never trust a path or a capability claim without reading the code.
   For any UI change, also read `CRAFT-UI-BASELINE.md` and compare the exact upstream v0.11.1
   component before editing. Craft components and tokens are the visual authority; screenshots and
   unrelated design systems are secondary references only.
4. **Define and confirm one coherent slice** before editing: the concrete user/system outcome; **the existing Craft
   code path and authority you will reuse or extend** (state the REUSE/EXTEND/NEW classification
   explicitly); the smallest set of UI + logic + state + recovery changes; what must stay unchanged; the
   observable evidence that will prove it; and the user-facing/bundled documentation that will be
   updated after implementation. Present this briefly to the owner as:

   ```text
   Frontend: entry, interaction, visible states
   Backend: authority, request → handler → persistence/state → caller-visible result
   Unchanged: adjacent behavior explicitly kept
   Docs after implementation: exact user-facing/bundled doc
   Classification: REUSE | EXTEND | NEW
   ```

   Wait for confirmation. One confirmation covers one coherent feature slice only; do not combine
   unrelated pages, data migrations, or service boundaries.
5. **Build the smallest coherent change** that delivers real, verifiable behavior and leaves the app
   working. Reuse existing Craft primitives and authorities. Preserve unrelated dirty changes and user
   data.
6. **Verify in reality.** Run the cheapest sufficient ladder (below). For user-visible work, launch the
   real Electron app and observe it.
7. **Update documentation after the behavior is real, then report honestly** (capability vocabulary
   below). Update only the docs that actually changed — and
   if you touched a capability not yet in `08-CRAFT-CAPABILITY-MAP.md`, add it there with its real code
   path. When user-visible behavior or configuration changes, update the matching bundled/user-facing
   Craft-derived documentation in the same slice; do not leave code and help text describing different
   products.

## A coherent slice normally covers

Entry point & interaction · core behavior & data flow · state/persistence (when applicable) ·
permission/credentials/privacy/destructive boundaries · loading/empty/disabled/error/retry/recovery ·
user-facing wording & status truth · targeted verification + a real rendered/runtime check.

Not every change needs every layer. When a layer doesn't apply, **say so** — do not create a
placeholder to "cover" it.

## Risk calibration

| Risk | Examples | Required evidence |
|---|---|---|
| Low | copy/style tweak, local pure helper | static check; rendered check if visible |
| Medium | component behavior, route, RPC handler, persisted preference | static check + targeted test + real path |
| High | shared protocol, migration, permission, credentials, destructive data, external side effects, **merge to remote main** | caller audit + targeted tests + end-to-end / restart / recovery evidence |

High risk means **stronger evidence**, not more ceremony.

## Validation ladder (cheapest that proves it)

1. Static analysis / typecheck for touched areas.
2. Targeted tests for the changed behavior.
3. Real behavior: rendered UI, request-to-persistence path, restart recovery, or external result.

Do not run the full suite unless requested or a shared contract changed. **If the same build/validation
route fails twice, stop editing blindly** — report the exact blocker and the smallest next decision.

## Engineering guardrails (reuse Craft's — do not invent your own)

Top AI-coding practice in 2026 is that **guardrails are a stack, not a prompt.** A rule written in prose
("never break permissions") is useful guidance but not a guarantee — the guarantee comes from
automated checks and human approval at the dangerous moment. Craft **already ships that stack**; your
job is to use it, not rebuild it. Reuse these (confirm exact scripts in `app/package.json`):

- **Typecheck** — `bun run typecheck:all` (covers core, shared, server-core, server, session-tools-core,
  pi-agent-server, electron, ui). For a quick pass use `typecheck:shared` / `typecheck:electron`; the
  package you edit must be covered.
- **Tests** — Craft has **~360 test files** and `bun test`. Run the tests near your change; add tests
  for changed behavior (typed code + tests are the signal that tells the next agent your change is
  correct).
- **Lint** — `bun run lint` (ipc-sends, tool-name-checks, electron, shared, ui) and the i18n lints.
- **One-command gates** — `bun run validate:dev` (= typecheck:all + shared tests + doc-tools tests) and
  `bun run validate:ci` (= validate:dev + i18n parity/sorted/coverage). Run targeted checks while
  developing. Run `validate:dev` at the integration gate when shared packages/contracts changed;
  CI owns `validate:ci` unless the change needs a local CI-equivalent check.
- **Pre-commit + CI** — Craft uses husky git hooks (`prepare: husky`) and GitHub Actions
  (`.github/workflows/validate.yml`, `validate-server.yml`). Do not disable, weaken, or route around
  them to make things pass (non-negotiable: no editing config just to go green).

On top of Craft's stack, these working habits are mandatory (they are cheap and prevent the classic
"AI code looks right but is subtly wrong" failure):

1. **Keep `main` always-runnable.** Large or risky feature work happens on a short-lived branch off
   the current verified baseline (see "Bounded feature development"). A small, low-risk, verified fix
   may land directly on `main`; anything that could leave `main` broken, half-migrated, or unverified
   may not. If a direct-to-`main` change fails validation, fix or revert it before anything else.
2. **Every change is a reviewable diff.** Produce the diff and review it file-by-file before it lands.
   AI output can look correct while being wrong; the faster the agent moves, the more the diff review
   matters. Surface the diff to the owner for anything in the owner-checkpoint list
   ([`OWNER-CHECKPOINTS.md`](OWNER-CHECKPOINTS.md)).
3. **Dangerous commands require approval — reuse Craft's permission gate.** `rm -rf`, `DROP TABLE`,
   `git push --force`, deleting data, external side effects: these go through Craft's PreToolUse
   permission path and, per `OWNER-CHECKPOINTS.md`, stop for the owner. Do not auto-run them. (Read-only
   commands, tests, and builds can auto-run.)
4. **High-risk changes get an independent review pass.** For shared-contract / permission / migration /
   destructive changes, run a **separate** review — ideally a supporting agent with a read-only brief
   (see multi-agent rules) that reads the diff and returns issues — before merge. This is the
   equivalent of a dedicated "find issues" review; do not self-certify high-risk work.
5. **Know the rollback before you make a risky change.** For anything high-risk, state up front how it
   is undone (git revert of the branch, the inverse action, a feature toggle). If it cannot be cleanly
   rolled back, that itself is an owner checkpoint.

## Capability reporting (use these words, honestly)

- `usable` — the requested loop is connected and **real behavior was observed**.
- `wired but not visually checked` — wiring exists; the observable surface/path was not confirmed.
- `display-only` — presentation exists without real behavior.
- `not implemented` — absent.

Before you write `usable` for a user-visible slice, confirm: the human path reaches real behavior (not
a mock); human/Agent callers share the canonical invocation, caller-aware policy, executor, state
authority, and evidence model where applicable; at least one
real-behavior check was done; error/recovery/wording were checked on the real surface; shared-contract
changes handle their callers. If any applicable item is missing, use the lower status and name the
missing evidence. **"Tests pass" is never a capability status.**

## Multi-agent / supporting agents (only when it genuinely helps)

Use a supporting agent when two or more tasks are truly independent (separate read-only audits, disjoint
areas, verification that doesn't edit the same files). Do not parallelize a small linear change to look
busy.

- **The main agent owns** scope, technical direction, integration, conflict resolution, and final
  verification.
- **No bare spawn.** Every supporting agent gets a **TaskBrief**: goal + acceptance, allowed/reserved
  paths (default scope = as narrow as possible), 3–15 known facts you already paid for, constraints
  (tests, "do not push/merge", risk ceiling), expected deliverable, and a budget (max tool turns / soft
  token cap). Unscoped "explore the whole repo" is denied by default. **A budget is a circuit breaker,
  not a label:** when a child crosses it, stop the child and decide deliberately (continue with a new
  budget, narrow the task, or absorb the work) — never let it silently keep burning (Decision C3).
- **Do not dump the parent transcript** into a child. Inject the brief, not the history.
- **The child returns a RunReport:** short summary + changed/produced paths + evidence refs + open
  questions. Large outputs are pointers (paths / refs / URLs), never re-embedded files.
- **Shared contracts have one owner.** Before changing a shared protocol/schema/registry, the main
  agent inspects all callers and decides one migration path. Children may gather caller evidence; one
  integrated change owns the contract.
- Resolve conflicts by comparing behavior, intent, and state authority and choosing/rewriting one
  solution — **never** by adding a second store/adapter/shell/duplicate path.

## Bounded feature development

Use isolation to protect attention and integration, not to impose a parallel architecture.

1. **Bound by existing paths.** A TaskBrief lists the exact renderer, RPC, server, shared, or package
   paths the coherent slice may modify. A vertical feature may cross those layers. Do not create
   `modules/<feature>/` merely to satisfy a process rule.
2. **Keep large branches short-lived.** Start from the current verified baseline, integrate promptly,
   and avoid long-running divergence. Small ordinary fixes do not need their own branch ceremony.
3. **Register only big in-flight work.** Use `FEATURE-REGISTRY.md` to share feature name, branch, and
   occupied path boundaries. It is not a task board and does not prevent reading already-merged code.
4. **One owner integrates shared contracts.** Before changing a protocol, persisted schema, registry,
   or authority used by multiple callers, inspect those callers and land one compatible migration.
   Contracts are versioned and tested; they are not speculatively frozen forever.
5. **No independent feature silos.** A feature may consume merged capabilities and public interfaces.
   It must not depend on another unmerged feature or create a local copy of a shared authority.
6. **Deliberate competition is exceptional.** Competing implementations require an explicit decision
   for a high-uncertainty choice and end with one selected implementation, not two permanent paths.

### Design notes are deltas, not copied specifications

A small or well-understood slice does not need a DESIGN file. A high-risk, cross-package, persisted,
or externally observable feature keeps a short design delta at a location natural to the existing
repository. It records:

- purpose, non-goals, and allowed paths;
- Craft REUSE / EXTEND / NEW findings;
- the existing state authority and exact extension point;
- adopted and rejected recovered-design assumptions;
- interfaces/data flow, policy, failure/recovery, and real verification;
- any shared-contract change and its caller migration.

Do not copy a recovered design wholesale. Link to it as historical source material and record only the
current, code-grounded delta. The code and observed behavior remain the truth.

## Git and delivery

- Preserve user data and unrelated working-tree changes. **No forced/ destructive Git operations
  without explicit owner authorization.**
- A PR is a remote delivery protocol, not the task board and not an IDE. Agents may run `git`/`gh`
  under permission. Concurrent local writes are protected by leases or isolated worktrees, not by "git
  alone."
- **Push branch / open PR:** ordinary permissioned work. **Merge to remote main: high-risk, explicit
  confirmation by default.**

## Documentation discipline

- Keep `00-START-HERE.md`'s "current honest state" accurate after meaningful handoffs. Replace stale
  facts; do not append a diary.
- Update `06-CODE-MAP.md` only when an entry point or authority moves.
- Amend a decision in `02-DECISIONS.md` in place when a durable direction changes; note the date.
- Treat the three documentation layers separately: numbered Fleet authority; pinned upstream source
  and bundled docs; mutable hosted-doc mirror. Copy neither upstream wording nor historical designs
  into Fleet authority without reconciling it with current code.
- Refresh the hosted mirror only when upstream intake or an external-service/configuration slice needs
  current evidence. Review the diff and manifest; a refresh alone changes no Fleet capability.
- A behavior-changing slice updates its actual user-facing/bundled documentation and capability-map
  row before handoff. A code-path move updates `06-CODE-MAP.md`. Ordinary implementation details do
  not earn a new planning document.
- Do not update usage documentation from a proposal. First confirm the frontend/backend slice with the
  owner, implement and verify it, then change instructions/status wording to match observed behavior.
  A rejected or unimplemented proposal remains absent from user documentation.
- Collapse a finished milestone to one "done" line and promote the next.
- **Do not grow documentation faster than implementation.** This project was reset because the plan
  outran the code. If you are about to write a new architecture document instead of code, stop and ask
  whether the code should come first. It almost always should.
- Do not recreate retired planning artifacts under any name.
