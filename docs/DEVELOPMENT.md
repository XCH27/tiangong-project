# Development — workflow, gates and verification
How work is done in this repository: setup, gates, verification, commits. Collaboration rules and
owner checkpoints are in [`AGENTS.md`](../AGENTS.md).

## Setup

```bash
bash scripts/init.sh            # commit gates, toolchain, Craft pins
cd app && bun install
bun run electron:dev
```

`core.hooksPath` lives in `.git/config` and is not carried by a clone, so `init.sh` must be run on
every new checkout. Without it no commit gate runs.

## Commit gates

`.githooks/pre-commit` runs, in order:

| Check | Catches |
|---|---|
| `scripts/validate-doc-contracts.py` | Broken joins between the capability register, feature loops, pages and acceptance IDs; dead internal links |
| `scripts/check-upstream-delta.py` | Any file in `app/` that differs from the upstream pin without a line in `docs/UPSTREAM-DELTA.tsv`, or a ledger line that no longer matches |
| `scripts/check-orphaned-components.py` | A component upstream mounts and we mount nowhere — a function that lost its home |
| `scripts/staged-checks.sh` | Typecheck of every touched workspace; upstream's i18n sorted/parity/coverage checks |

The two upstream checks exit 2 when the reference mirror is not mounted; the hook then warns and
lets the commit through, because an unplugged volume must not block all work. Exit 1 blocks.

Full gate before handing work over: `bash scripts/fleet-verify.sh` — the above plus Python tool
tests, the whole Bun suite under a disposable `CRAFT_CONFIG_DIR`, isolated tests, document tools and
a backend smoke. Upstream `validate:dev` runs a subset and is not full-suite evidence.

**Upstream ships failing tests.** Unmodified v0.13.4 fails 12 of about 5,300 Bun tests; each is
recorded with its cause in `scripts/known-upstream-test-failures.txt`, and
`scripts/run-bun-tests.py` fails the gate only on a new failure or on a recorded one that now
passes. **Never run the suite without a disposable `CRAFT_CONFIG_DIR`**: at least one upstream test
reads the real user profile and behaves differently against it.

These gates live at the repository root on purpose: `app/` stays identical to upstream, and
upstream's OSS `package.json` names staged-check scripts it does not ship.

## Changing `app/`

1. Classify the change REUSE / EXTEND / NEW against the Craft capability map in
   [`ARCHITECTURE.md`](ARCHITECTURE.md).
2. Diff the upstream component and the reference component before writing
   ([`AGENTS.md`](../AGENTS.md#before-you-write-ui)).
3. Declare each changed file in [`UPSTREAM-DELTA.tsv`](UPSTREAM-DELTA.tsv) with its layer —
   `L0` upstream fix, `L1` re-skin only, `L2` product change naming where any removed function now
   lives. See [`COMPONENT-GUIDELINES.md`](COMPONENT-GUIDELINES.md).
4. Typecheck, run the targeted tests, run the app and show the change.

## Reviewing the original app without touching user data

For walkthroughs, point the app at a disposable profile so the owner's real credentials, Sessions
and files are not modified:

```bash
export CRAFT_CONFIG_DIR="$(mktemp -d)"
cd app && bun run electron:dev
```

This isolates Craft's profile directory only. Code paths that read the home directory directly are
not covered and must be audited before claiming isolation.

## Commits and branches

- Working line: `work/craft-0.12-rebase` (historical name; the tree is v0.13.4).
- One logical change per commit. The message says what changed and why, including anything found
  broken along the way.
- Never merge to remote `main` without the owner (a checkpoint in `AGENTS.md`).
- Integration: one owner per shared contract; a dependent change consumes the merged contract, never
  another worktree's uncommitted files. One primary home per capability, no duplicate state
  authority, no empty placeholder surfaces.

## Scripts upstream does not ship

The OSS `package.json` declares scripts that are absent from the published tree:
`typecheck-staged.sh`, `lint-i18n-staged.sh`, `lint-i18n-strings.sh`, `check-raw-sends.sh`,
`check-task-tool-checks.sh`, `build.ts`, `check-version.ts`, `fresh-start.ts`, `oss-sync.ts`,
`release.ts`, `sync-secrets.sh`, `electron-dev.sh`. Their `bun run` entries fail. The Fleet
equivalents that matter run from `scripts/`; the rest are not needed for development.

## Quality: verification and acceptance

> How work is verified and accepted, and who owns which layer. Policy authority: Decision G3.
> The commands live in [`ARCHITECTURE.md`](ARCHITECTURE.md#code-map).

### The split (who verifies what)

| Layer | Owner | Means |
|---|---|---|
| Types, contracts, callers | Agent | typecheck, `rg` caller audit |
| Changed behavior | Agent | targeted tests beside the change |
| Real data path (non-visual) | Agent | request→persistence trace, restart/recovery check, real command output |
| App boots and core surfaces mount | Agent | non-interactive smoke (below) |
| Visual-language consistency | Agent | declared anchor→result comparison in playground/real local surface; relevant theme/width/state/focus matrix |
| Intentional visual direction and final click feel | **Owner** | the slice handoff report's intentional delta + "CHECK THIS" list |
| Product direction, cost, irreversible effects | **Owner** | checkpoints in [`AGENTS.md`](../AGENTS.md#owner-protocol) |

Agents run everything in their rows **without asking**. For structural/styling frontend work they
may use the local playground or app for non-destructive rendered comparison. Owner-account actions,
external side effects, and broad interactive journey audits still require explicit scope.

### Validation ladder (cheapest sufficient level — stop when proven)

1. **Static:** scoped typecheck (`typecheck:shared` / `typecheck:electron`); lint when touched
   areas have lint rules; i18n lints when catalogs changed.
2. **Targeted tests:** run the tests near your change; **add or extend a test for changed
   behavior** — typed code + a targeted test is the signal that tells the next agent your change is
   intact. A fixed bug gets a regression test in the same slice.
3. **Real non-visual behavior:** the actual data path — an RPC round-trip, a persisted file, a
   restart recovery, a real command execution. This is what separates
   `wired but not visually checked` from `display-only`.
4. **Rendered consistency (frontend structural/styling changes):** render the declared state in the
   playground or real local app, compare it with the visual anchor at the same viewport/theme/state,
   exercise keyboard focus and the affected view variants, and fix every unintended delta.
5. **Non-interactive smoke:** when the slice could plausibly break boot or a core surface, verify
   the app starts and logs no new fatal errors (dev launch, capture output, quit). No clicking.
6. **Full gates:** from the repository root, `bash scripts/fleet-verify.sh` at the integration
   point. It runs the actual test inventory as well as types, documentation and reference checks.
   Upstream `validate:dev`/`validate:ci` run a selected shared-test subset, so neither replaces the
   repository gate. `validate:quick` is absent after the rebuild; use scoped commands while iterating.

> **A gate only counts what it runs.** Until 2026-07-30 `validate:dev` ran 3 of 703 test files and
> `typecheck:all` could not pass at all, so "gates green" was reported for months against a check
> that measured almost nothing. When you add a test area, wire it into a gate in the same slice; a
> suite that no gate invokes is documentation, not verification.
> The v0.13.4 reset reintroduced that same subset-only gate. The repository wrapper now owns
> complete coverage; always inspect what a package command actually runs after an upstream intake.

Do not run the full suite for a bounded change. Do not micro-test every edit — validate after a
coherent slice.

### Stop rules (bind at every level)

- Two state-changing attempts move no acceptance criterion → halt (AGENTS rule 5 / Decision C10),
  preserve the exact blocker and evidence, and report the smallest next decision. Switching
  tools/hypotheses does not reset the counter; a failing run with demonstrated acceptance progress
  is not a non-progressing attempt.
- Never edit dependencies, configuration, tests, fixtures, or harnesses to manufacture a pass
  (03 §6; reserved paths, Decision C7).

### Acceptance flow for a user-visible slice

```text
agent: lock visual anchor/delta → implement → ladder 1-4(5) → fix unintended drift → handoff
        status: wired but not visually checked
owner:  judge the intentional delta and walk the short CHECK THIS list
        → accept → status: usable
        → reject → concrete gap becomes the next bounded fix
```

The owner is never asked to discover spacing/token/responsive regressions that the Agent could have
caught mechanically, nor to verify logic, types, or data paths. The owner judges look-and-feel and
product direction. An agent may propose `usable` directly only for non-visual capabilities where
the full loop was proven by evidence.

Frontend-track pages (Decision G6) have a two-stage acceptance: the owner may accept a
preview-gated page's *design* (layout, states, wording) while its status remains `display-only`;
`usable` still requires real wiring plus the normal flow above.

### Test map (where verification lives)

| Area | Where tests live | Run with |
|---|---|---|
| Shared domain logic | `packages/shared/src/**/__tests__/`, `packages/shared/tests/` | `bun test <path>`; `test:shared:all` is only six selected files |
| Session tools | `packages/session-tools-core/src/**/__tests__/` | `bun test` in package |
| Renderer components | `app/apps/electron/src/renderer/**/__tests__/` | `bun test <path>` |
| i18n parity/coverage | lint scripts | `bun run lint:i18n:*` |
| Incremental UI contract | `app/scripts/check-ui-contract.ts`; `scripts/tests/test_ui_contract.py` | `usable`: staged/unstaged/untracked rejection fixtures; run by `fleet-verify.sh` |
| Repository verification scripts | `scripts/tests/` | Python unittest through `scripts/fleet-verify.sh` |
| Offline production backend | `scripts/smoke-baseline.mjs` | `bun scripts/smoke-baseline.mjs` from the root; also run by `fleet-verify.sh`. Temporary profile, authenticated RPC, real Session/config storage, self-tested outbound API guards, redacted traffic/startup evidence and process/listener cleanup. No provider subprocess or Electron-renderer claim. |
| Documentation handoff and reference routes | `scripts/validate-doc-contracts.py`, `doc_execution_contracts.py`, `reference-guides.py` | `python3 scripts/validate-doc-contracts.py` from root checks 1:1 execution owners, required fields, real app source paths and reference routes; `python3 scripts/reference-guides.py --check` additionally requires mounted, unchanged source locks |
| Cross-package gates | repository wrapper + CI workflow | `bash scripts/fleet-verify.sh`; CI also runs the existing i18n checks |

Keep this table honest: if a new test area appears (e.g. smoke scripts under `app/scripts/`), add
its row in the same slice.

The reference guide check is local/reference work, not a CI requirement to mount the owner's
external disk. CI validates the canonical route data through the normal document gate. On a
mounted reference update, run both checks. Structural checks cannot certify source quality,
runtime behavior, complete module design or a benchmark that has never run.

Config-mutating integration fixtures require a disposable `CRAFT_CONFIG_DIR` supplied before Bun
starts, because the interceptor is preloaded. The repository verifier creates and removes this
directory; targeted runs must do the same. Never point these fixtures at a saved user profile.

#### Shared-process test hazards (binding)

`bun test` runs many files in one process, which makes two failure classes real (both observed
2026-07-26 and fixed at the source):

1. **Global leaks.** Any test that replaces a process global (`globalThis.fetch`, env vars,
   `clearTimeout`, …) must capture and restore it in `afterEach`/`afterAll`. A module-top-level
   replacement without restore broke unrelated real-HTTP tests three packages away.
2. **`mock.module` is first-import-wins.** The module cache keeps the instance created by the
   *first* importer of a path; a later file's `mock.module` for the same path does not replace the
   cached instance, so its assertions may silently run against another file's mock (or the real
   module). A regular `*.test.ts` may therefore use `mock.module` only for modules no earlier suite
   file can have imported. Anything heavier goes in a `*.isolated.ts` file — excluded from the bare
   suite and run per-process by the repository verifier (invoke as `bun test ./path/to/file.isolated.ts`).

A test that fails only in the full suite (or passes only there) is assumed to be one of these two
classes until proven otherwise — bisect with file pairs before touching product code.

#### Harness/profile comparison protocol

A harness optimization is not accepted by unit tests or lower token count alone. Seal the task,
repository revision, model, thinking effort, permissions and acceptance test; then vary only the
profile/harness. Record the serialized request inventory (`system prompt`, tool schemas, history,
Skills/Sources, media observations and governance projection), provider usage with
`real/estimated/unknown` confidence, latency, tool calls, rework, halts and first-pass acceptance.
The primary economic metric is cost per accepted outcome. A result from one task class does not
authorize a global default, automatic model routing or removal of capabilities from other classes.

For prompt/tool projection changes, verification must also prove:

- the required hidden tool can be recovered through the declared discovery path;
- every real call still crosses the canonical permission/evidence path;
- denied, expired-grant and stale-observation cases fail closed;
- the previous profile remains selectable for rollback;
- no second prompt, loadout, ledger or capability authority was introduced.

#### Human/Agent provenance and learned workflows

Any surface that supports both human and Agent mutation must test the same operation through both
callers. The evidence must distinguish `human`, `agent`, `automation`, `replay` and `system`, identify the
Session/Workspace/Component, and record base/result versions. A stale Agent write must be rejected
or reconciled explicitly; a successful test that only checks the final pixels is insufficient.

For Record & Replay or a similar Fleet learning flow, the acceptance fixture must prove: opt-in
capture; user-selected interval; secret/sensitive-data exclusion; semantic Action extraction;
input parameterization; precondition and postcondition checks; replay through the existing
permission/evidence path; failure stop/recovery; user review before publish; and rollback of the
learned Skill. Raw coordinate replay is not a passing implementation when a semantic Component
command exists.

For a multi-step Component workflow, the acceptance fixture must also prove a single inspectable
trajectory over the existing Session/Action/Job/Artifact authorities: every step has a stable
operation/attempt identity, exact input and output versions, caller/component attribution and
failure or recovery state; the canvas and panel projections resolve to the same records; selecting
an earlier operation creates a new branch, preserves the old outputs and marks only dependent
descendants stale until explicit recompute. A final image that looks correct while the Agent cannot
target the producing step is not a passing implementation.

### Admitting a package whose tests are written for Vitest

The repository verifier runs `bun test --isolate` plus separately named isolated files.
The former `app/scripts/test-all.sh` is absent after the rebuild. Cindy, OpenChamber and most other
candidate sources use Vitest. Bun's `vitest` shim covers `vi.fn` / `vi.mock` / `vi.spyOn`
and nothing else, and it fails in ways that read like product bugs — so check these
five before you diagnose the admitted code:

| Vitest feature | Under `bun test` | What to write instead |
|---|---|---|
| `vi.waitFor(fn)` | `undefined` → `TypeError` | a local bounded poll loop |
| `vi.useFakeTimers` + `advanceTimersByTimeAsync` | `undefined` → `TypeError` | make the timeout an injectable dep and run in real time |
| `vi.hoisted(() => x)` | `undefined` → `TypeError` | a plain `const` — bun's `vi.mock` is not hoisted above it |
| `vi.mock(id, (importOriginal) => …)` | `importOriginal` is `undefined`; a dynamic self-import inside the factory **deadlocks** | an explicit stub module listing only the bindings the subject imports |
| `it('…', async ({ skip }) => …)` | bun reads the single parameter as `done` → **5 s timeout, not a skip** | `async () => {}` with an early `return` |
| `vi.mock` module registry | **global for the whole run**, so one file's mock leaks into the next | rename to `*.isolated.ts` — the repository verifier runs those one per process |

Also import `vi` from `bun:test` (it is exported there), not from `'vitest'`: the latter
resolves at runtime but has no types, so the package fails `typecheck:all`.

A file that still cannot be ported is renamed out of both globs with a header naming
the invariants that therefore have **no** coverage — never left red and never deleted.

### Definition of done (per slice)

1. Spec acceptance criteria for the slice: met, with evidence refs.
2. Ladder run at the sufficient level; stop rules respected.
3. Behavior-adjacent test added/extended.
4. Structural/styling UI changes have a declared visual anchor/delta and rendered comparison.
5. Canonical docs whose contract/status changed are updated. Absorbed reports, obsolete plans,
   replaced files and duplicate recovery copies are retired under the
   [R0 cleanup contract](specs/R0-baseline-audit.md#retirement-of-obsolete-material); no archive copy is added.
6. Honest status reported; user-visible surfaces are handed to the owner with the intentional delta
   and a short CHECK THIS list.

### Cross-boundary contract checks

Derive or re-export types that cross a process boundary; a hand-maintained duplicate plus a cast
can hide dropped fields while typechecks pass. Trace relevant fields from producer through transport
to their real consumer. Reuse shared overlay/menu contracts and prove that visible actions reach
an implemented operation. Historical defect lists do not establish defects in the current tree.

### What quality is not

- A green typecheck is evidence, never a capability status.
- A screenshot is optional for non-visual work. A structural/styling UI claim needs a rendered
  comparison; if capture is unavailable, report that limitation and do not claim visual consistency.
- A passing full suite does not substitute for the one real data path the slice claims to deliver.
- Coverage numbers are not a goal; a targeted test that would fail if the behavior regressed is.
