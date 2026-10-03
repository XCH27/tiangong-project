# Engineering — workflow, gates, components and packaging

How work is done in this repository: setup, gates, verification, commits. Collaboration rules and
owner checkpoints are in [`AGENTS.md`](../AGENTS.md).

## Baseline selection and development method

OV-025/027 make **completed user work** the unit of progress. OV-066 settles development on the
ZCode Host with bounded native executor adapters; OV-069 uses Pi AgentSession as its default loop executor. OV-067 puts production kernel boundaries and
acceptance first; selecting the baseline does not complete them. [TODO](../TODO.md#delivery-order) owns execution order.
1. **Compare the affected original path.** Record source pin, licences and real owner/callers.
   Use isolated data, preserve references and distinguish inherited failures from Fleet regressions.
   Do not rerun unrelated research or reconstruct infrastructure to force a preferred result.
2. **Deliver through existing owners.** Start with kernel admission, state commit, permission
   and native-executor boundaries; page/document/plugin/media flows consume those boundaries. Test permission,
   concurrent edits, account/Project scope, cancellation and restart through those actual callers.
3. **Extract only a consumed boundary.** The native executor adapter, page contribution and Job
   operation must have named production callers. Preserve native editor/continuation state; no
   whole-runtime or universal-store migration is implied. New dependencies or authority replacement
   retain their existing checkpoint, reached after concrete reviewable preparation.
4. **Replace one complete interaction at a time.** Name reference UI/controller, data owner, operation,
   persistence/recovery and retired entry. Reuse the selected host's end-to-end path; introduce shared
   abstractions only for real consumers. Never keep two independent creation or permission paths.
5. **Keep the base releasable.** Lock its version during a slice. Separate upstream upgrades, runtime
   replacement, visual adaptation and new capabilities. One integration owner, reviewable commits;
   no delegated architecture/layout decisions or speculative framework requirements.
6. **Accept before expanding.** Prove request → operation → persistence → restart, including failure.
   Then adapt Craft values/valuable surfaces and complete shell, models/context, Pages/documents,
   Git/GitHub and remote paths as separate slices; domain suites/distribution follow. Provider cache,
   effort and speed optimizations belong to supported adapters; `usable` requires owner acceptance.

## ZCode candidate

The active checkout is `.fleet/zcode`, with its own Git state and source pin
`29628c9acdb81b703bbd4080c207a0e7ce5e276e`. Preserve its existing dirty work. Reconstruct a
fresh candidate only with the [ordered patch recipe](../patches/zcode/README.md); do not apply
that recipe twice or reset an existing checkout. Intermediate designs and test counts are not
current capability status; the register and owning module describe the surviving behavior.

The candidate embeds `pi-coding-agent@0.99.2` and its matching Pi types as the default executor
inside the existing supervised CLI. Host models and subscription services use patched `pi-ai@0.99.2` for
transport/OAuth; the same Pi release now serves execution and providers. The production default is Pi; the retired legacy executor selector no longer changes the loop.
Native vendor routes use their own admitted adapter. No credential store or user-data migration was added.
Resources are explicitly Host-owned; this does not enable arbitrary community extensions or pages.
`pnpm exec tsx scripts/measure-context-projection.mts` measures fixed scripted fixtures without
reading user history or calling a provider. It reports model-facing character lengths separately
from local tool contracts; efficiency claims require vendor counters and accepted task comparisons.

From the candidate root, use its locked package manager and existing scripts:

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm typecheck
pnpm verify:pre-push
pnpm test:usage-hooks
pnpm test:provider-drafts && pnpm test:composer-previews && pnpm test:settings-typography
pnpm test:combined-model-ui && pnpm test:model-settings-tool-ui
pnpm test:draft-model-defaults
pnpm test:pi-executor && pnpm test:native-executor && pnpm test:native-ui && pnpm test:chatgpt-ui
PATH="$PWD/node_modules/.bin:$PATH" node scripts/build-desktop-agent-cli.mjs
pnpm test:pi-bundle && pnpm test:native-bundle
```

The renderer self-check runner refuses a recorded live review of the same candidate before creating
a test profile or starting Electron. Quit the review first and run renderer tests serially.

The usage-hook and provider-draft regressions use the installed Electron renderer with an isolated temporary
profile and blocked HTTP(S); Linux needs a display or the existing CI display wrapper. It adds no
production dependency. Run tests appropriate to changed paths; synthetic OAuth/catalog/permission/usage fixtures do not
prove live login, model access or billing. Build desktop main/host/preload before launching an
isolated preview; stale development ready markers do not prove a newly built runtime is running.
The observed development host uses Node 26.3.0/pnpm 10.33.2; upstream's pinned release toolchain
and all target platforms still require packaging verification. Do not change the lockfile to
match the local machine or silently execute new dependency lifecycle scripts.

Candidate review must isolate Main cold-restore settings as well as all six stores: `ZCODE_DATA_BASE_DIR`, `ZCODE_DESKTOP_USER_DATA_DIR`,
`ZCODE_DESKTOP_HOME_DIR`, `ZCODE_STORAGE_DIR`, `ZCODE_HOME`, and `ZCODE_SESSION_DB`.
For candidate visual review use `bash scripts/review-app.sh --zcode`: it reuses one retained profile and checks running review PIDs before launch. Do not clone more Electron apps or open different profiles concurrently; do not stage review data. Desktop home overrides do not
isolate CLI plugin/cache storage. Confirm the exact app is running before CUA lookup; lookup of a stopped development app can launch bare Electron. Migration tests read a consistent copy of the source SQLite
DB and preserve the original. Record real account actions separately from fixture behavior.

The SDK suite uses real AgentRuntime/SQLite/Host tools with scripted inference. It covers immutable
admission/queue/Guide data, streaming/media, account refresh, permission, stop, output continuation,
repeated upstream tool IDs, request-scoped tool/Skill attribution, manual-only Skill policy/arguments, desktop prompt scope and reopen. The staged macOS ARM64 CLI test uses loopback SSE and a
real Read, verifies admitted Fast on physical requests and retained context selection, manual-only Skill refusal and explicit invocation, renderer events and restart, then checks two receipts for a repeated upstream ID.
The CJS build resolves Pi/Claude SDK ESM locations to the artifact. SDK runtime minimum is Node 22.19.0;
`node22` is a syntax target and does not establish compatibility with older SSH runtimes.
Native tests require the SDK-matched bundled Claude executable and loopback inference; missing/broken binaries fail verification. They prove matching-ID native resume with delta input, changed/missing-cache handoff, checkpoint-save refusal, process-exit-aware Stop and failed admission without an extra request. SDK MCP returns committed Host receipts; actual Provider writer tests cover native account/catalog atomicity. Public ChatGPT tests run real Pi OAuth/serialization with signed local OIDC fixtures, locked refresh, account-bound reauthorization and isolated production/development bundles. Login UI uses fixtures; live consent, entitlement/inference, other platforms and owner acceptance remain separate.
Built desktop IPC rejects an independent writer's stale address, retains its draft and saves after
Esc restoration; checked dark/zh-CN and light/en-US in an isolated profile. Owner visual acceptance remains separate.
Known check limits: root lint excludes CLI; inherited formatting/max-lines failures and complete
license notices remain separate closure items. SDK notices are source-pinned; complete regeneration
is blocked by `proxy-agent-negotiate@1.1.0` lacking complete upstream text. Cross-platform notice
verification also lacks installed optional architecture packages. Do not waive these release gates or call a development build
a signed Fleet release. The product updater stays unavailable until a Fleet feed is configured.
Source reconstruction, user-data migration and release acceptance are three different operations.

### Candidate source protection

The media transport/recovery regressions are part of `pnpm run test:provider-routing`, including
`media-generation-tool.test.ts`, `media-video-recovery.test.ts`, `xai-media-generation.test.ts`
and `media-provider-routes.test.ts` under the CLI packages. They execute real Host/Pi approval,
SQLite/native artifacts and restart with scripted inference/HTTP: denial sends no paid POST,
unknown submissions are not replayed, known videos retain credentials and recover missing files,
and model history remains a lightweight video reference without binary reads on cold hydration.
Actual generated-image Host reopen restores its image bytes for a vision model. Byte-budget tests
ensure evicted unapproved bindings cannot spend. The built desktop's original PNG preview and MP4
player were personally inspected with local FFmpeg test assets; that proves the existing file
viewer, not a live generated result. These checks do not prove paid entitlement,
provider output quality, native subscription media, owner acceptance or queue fairness.

`scripts/check-zcode-candidate.py` replays every consecutively numbered patch in a temporary Git
index, validates the declared reconstruction table and compares that tree with all current
non-ignored source, including untracked additions and removals. It never changes the normal index.
Use `--recipe-only` to inspect the recipe independently; that mode does **not** prove it describes
current work. Candidate pre-push and the root patch commit gate require the full comparison.

`init.sh` installs candidate-specific hooks as well as retained-branch gates. Candidate commit
checks cover desktop/services and all CLI packages directly; the full project verifier selects
the candidate by default, with `--retained-craft` reserved for the preserved implementation.

Source recovery also needs an independent copy. Git tree archives plus history bundles under
`/Volumes/AIGC/天工恢复/` exclude credentials, user profiles and generated dependencies. Their
checksums and extraction into disposable clones were verified against the recorded trees. Refresh
those copies after a completed change; a backup of an earlier tree is not protection for later work.
The candidate source is now recorded in ordinary local commits on `codex/fleet-workbench`:
the reconstructed baseline through patch 101 and the independently verified turn-output workflow
are separate commits. The ordered recipe remains a base-to-current reconstruction proof;
ignored review profiles and retained Craft dirty work are not part of these candidate commits.

Bounded foundation regressions include durable Guide admission across failed/slow saves and
replacement turns, Skill/Agent projection under actual dispatch visibility, and plugin uninstall
data retention with regenerated derived commands. `test:native-executor` also covers prompt-free
Claude usage control and scoped cache/reopen; `test:native-ui` uses the desktop stylesheet for
Chinese/English, light/dark, narrow-card and late-account response cases. Temporary protocol/SQLite
fixtures are distinct from a live subscription read and from owner visual acceptance. The integrated
pre-push gate passed 591 tests with zero architecture violations; both staged CLI restart probes
passed using loopback inference, and the native account UI passed 11 renderer cases.

`test:conversation-outputs` covers four projection cases and nine actual renderer cases using the
desktop stylesheet: Chinese/English, light/dark, narrow cards, exact read targets, hidden-card IO,
missing outputs, retained preview URLs and document-preview versus source-review actions. Eight
bootstrap regressions exercise Host/Pi/SQLite live and cold output reads, reused tool IDs, denied
refs, stop/recovery, late background events, binary Markdown images and success publication only
after completed ToolPart persistence. The built full desktop was personally opened on the local
output fixture: cold replay, media-only status panel, image preview and complete MP4 playback passed;
light/dark and English/Chinese were inspected. The fixture supplies synthetic local media, not a
vendor result. Its minimal injected runtime lacks the file execution adapter, so document Write
failure is retained rather than counted as a generated document; document action routing is
covered by the renderer cases. Paid quality/entitlement and owner acceptance remain separate.

Four bootstrap cases trace known cancelled/error responses through the ledger, V4, compatible
Session counter and cold replay, including missing saved suffixes and no completed-response retry.
Native login cases fence teardown, async launch and late publication; tool/context cases enforce
final visibility and approval-time registry/policy revocation without losing aliases or Skill bodies.
Five AGY hook preflight tests prove only that prototype transport. Inference uses local scripted or
loopback transports; live provider acceptance remains separate.

## Retained Craft setup

```bash
bash scripts/init.sh            # commit gates, toolchain, Craft pins
cd app && bun install
bun run electron:dev
```

`core.hooksPath` is local Git configuration; run `init.sh` after every clone to install the gates.

## Commit gates

`.githooks/pre-commit` runs, in order:

| Check | Catches |
|---|---|
| `scripts/validate-doc-contracts.py` | Broken joins between the capability register, modules, pages and acceptance IDs; stale module cards; documents over the 700-line budget; dead internal links |
| `scripts/check-upstream-delta.py` | Any file in `app/` that differs from the upstream pin without a line in `docs/UPSTREAM-DELTA.tsv`, or a ledger line that no longer matches |
| `scripts/check-orphaned-components.py` | A component upstream mounts and we mount nowhere — a function that lost its home |
| `scripts/staged-checks.sh` | Typecheck of every touched workspace; upstream's i18n sorted/parity/coverage checks |

The two upstream checks exit 2 when the reference mirror is not mounted; the hook then warns and
lets the commit through, because an unplugged volume must not block all work. Exit 1 blocks.

Full gate before handing candidate work over: `bash scripts/fleet-verify.sh` runs the common
documentation/source checks, then the active candidate verification. Candidate staged-binary and
renderer checks remain explicit commands above. The retained Craft full suite uses
`bash scripts/fleet-verify.sh --retained-craft`, including the disposable `CRAFT_CONFIG_DIR`,
isolated tests, document tools and backend smoke. Upstream `validate:dev` is a subset, not
full-suite evidence.

**Upstream ships failing tests.** The 31 deterministic v0.13.4 failures and one timing-flaky case are recorded in `scripts/known-upstream-test-failures.txt`; `scripts/run-bun-tests.py` rejects new failures and stale exceptions. **Use a disposable `CRAFT_CONFIG_DIR`**: upstream tests can read the real profile.

The retained full-suite run on macOS 27/Bun 1.3.14 also stalled entering `mode-manager.test.ts`
after `mcp-pool.test.ts`; it was terminated without a completed test summary. The same mode suite
passes alone (433 pass, 11 skip). Its original-reference run lacks `@craft-agent/session-tools-core`,
so that comparison cannot classify the combined-run stall as upstream or introduced. Resolve this
execution gap before claiming a full retained-branch pass; do not add it to the failure allowlist.

These gates live at the repository root to track `app/` against its upstream pin, while
upstream's OSS `package.json` names staged-check scripts it does not ship.

## Changing `app/`

1. Classify the change REUSE / EXTEND / NEW against the Craft capability map in
   [`capabilities.md`](capabilities.md#craft-capability-map).
2. Diff the upstream component and the reference component before writing
   ([`AGENTS.md`](../AGENTS.md#before-you-write-ui)).
3. Declare each changed file in [`UPSTREAM-DELTA.tsv`](UPSTREAM-DELTA.tsv) with its layer —
   `L0` upstream fix, `L1` re-skin only, `L2` product change naming where any removed function now
   lives. See [`engineering.md`](#component-development).
4. Typecheck, run the targeted tests, run the app and show the change.

## Reviewing the original app without touching user data

```bash
bash scripts/review-app.sh        # KEEP=1 keeps the sandbox, SKIP_BUILD=1 reuses the last build
```

It builds once and launches the compiled app with three separate isolation levers, each verified on
2026-09-22 by fingerprinting 14,143 files of the owner's real data before and after a launch (zero
changed):

| What must move | Lever | Why the others do not cover it |
|---|---|---|
| Craft profile | `CRAFT_CONFIG_DIR` | — |
| Workspace folders | `HOME` | upstream `workspaces/storage.ts` hardcodes `join(homedir(), '.craft-agent')` and ignores `CRAFT_CONFIG_DIR`; the backend smoke left a fixture workspace in the real home this way |
| Electron user data — Local/Session Storage, cookies, caches | `--user-data-dir` | on macOS Electron resolves it through the system, not `HOME`; without the switch a review instance writes UI preferences into the real `~/Library/Application Support/@craft-agent` |

`electron:dev` cannot be isolated this way — `scripts/electron-dev.ts` hardcodes Electron's
arguments — so reviews use the compiled app, which also never runs the auto-updater. A review
instance is a first run; a model connected there is stored in the sandbox.

## Commits and branches

- Working line: `work/craft-0.12-rebase` (historical name; the tree is v0.13.4).
- One independently verifiable user workflow per commit (OV-038), including its UI, backend, persistence, failure/recovery and tests. The primary agent maps source-equivalent flows before bounded delegation; unfinished or unrelated work is not bundled merely to make a large commit.
  The message says the trigger, resulting behavior and verified limits. Cosmetic subpatches alone do not close a workflow.
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
> Commands and implementation scopes live in this document; Architecture supplies the code map.

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

> **A gate only counts what it runs.** Wire new regression suites into a gate in the same slice. Inspect the actual command after every upstream intake; upstream subset checks do not replace the repository wrapper.

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
| Provider request comparison | `scripts/probes/provider-harness-contracts.ts` | `bun scripts/probes/provider-harness-contracts.ts`; installed Pi 0.87.1, synthetic credentials/history, capture-abort before inference plus a fetch guard. Twelve payload captures; no official-CLI, server, cache-hit or task-quality claim. Run explicitly for model-adapter research, not as product acceptance. |
| DeepSeek desktop source mechanisms | `scripts/probes/deepseek-desktop-source.mjs` | `.fleet/zcode/node_modules/.bin/tsx scripts/probes/deepseek-desktop-source.mjs`; four original-code mechanism checks at the locked reference, no Host/provider/user-state writes. |
| Executor switching research | `scripts/probes/executor-switching.mjs`, `cindy-handoff-boundaries.test.ts`, `cindy-handoff.config.mjs`, `zcode-workflow-replay.test.ts` | `node --test scripts/probes/executor-switching.mjs`; `node 源码参考/software/pi-mono-latest/node_modules/vitest/vitest.mjs run --config scripts/probes/cindy-handoff.config.mjs`; `bun test scripts/probes/zcode-workflow-replay.test.ts`. Executes actual pinned source with scripted providers or injected drivers; the ZCode test byte-checks the installed candidate package against the original. No model-quality or live-account claim. |
| Durable process recovery research | `scripts/probes/durable-process-recovery.mjs`, `fleet-kernel-shared-operation.mjs` | Run each with Node. Real SQLite/process SIGKILL and reopen; external service/artifact receipts remain fake. Queryable effects reconcile, unknown outcomes remain unresolved. The probe's adapter supplies this policy; it is not an upstream exactly-once guarantee. |
| Installed native protocol | `scripts/probes/native-protocol-surface.mjs` | `node scripts/probes/native-protocol-surface.mjs`; exports installed Codex schema into a temporary directory and checks thread/provider scope, next-turn model/policy settings, steering precondition and tool/approval correlation. No thread, login or inference. |
| Documentation handoff and reference routes | `scripts/validate-doc-contracts.py`, `doc_execution_contracts.py`, `reference-guides.py` | `python3 scripts/validate-doc-contracts.py` from root checks 1:1 execution owners, required fields, real app source paths and reference routes; `python3 scripts/reference-guides.py --check` additionally requires mounted, unchanged source locks |
| Cross-package gates | repository wrapper + CI workflow | `bash scripts/fleet-verify.sh`; CI also runs the existing i18n checks |

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
   [R0 cleanup contract](modules/baseline.md#retirement-of-obsolete-material); no archive copy is added.
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

## Component development

Rules for building or changing any component, panel or surface in `app/`. Values (colour, type,
spacing, motion) are in [`DESIGN.md`](../DESIGN.md); this file is about *how* a component is
built and admitted.

### Start from what exists

1. **Classify first.** Find the Craft capability in [`architecture.md`](architecture.md) and mark the
   work REUSE (use as is), EXTEND (add to the existing owner) or NEW (Craft has no domain model or
   adapter for it). NEW never licenses a new shell, agent kernel, Session/task store, permission
   path, timeline, settings home or provider harness.
2. **Diff before writing.** Open the upstream Craft component at the same path and the reference
   component named in [`references.md`](references.md). Port their structure, layout and interaction;
   apply Craft's tokens. A difference you cannot name a reason for is an invention.
3. **Reuse shared primitives.** `Popover`, `cmdk`, menus with the shared `MENU_*` constants, dialogs,
   buttons at their standard sizes. Do not hand-roll a control that already exists beside yours.

### Upstream-delta layers

Every file that differs from upstream is declared in [`UPSTREAM-DELTA.tsv`](UPSTREAM-DELTA.tsv):

| Layer | Allowed change | Not allowed |
|---|---|---|
| `L0` | Fix an upstream defect | Anything beyond the fix |
| `L1` | Re-skin only: text, typography, icon, size, radius, shadow, gradient, motion, token, className | Structure, props, exports, behaviour |
| `L2` | Deliberate product change, already classified REUSE/EXTEND/NEW | Removing a function without naming its new home (`removes: <path>; replacement: <destination>`) |
| `LOC` | Local state that is not product code | Product behaviour |

A `MISSING:` path means upstream ships a file we do not. That is the shape that loses features
silently, so it needs a louder reason than an ordinary edit.

### Dependencies

- Prefer what the pinned tree already contains. A new production dependency or external service is
  an owner checkpoint (`AGENTS.md`).
- Reference code may be copied only when its licence allows it and the reference registry records
  the source lock (`references.md`). Product-only references inform behaviour, never code.
- A heavy domain implementation stays a lazy, optional dependency of its component; the core stays
  small.

### Accessibility and states

Every surface ships loading, empty, error and unavailable states; keyboard and pointer reach every
action; hover-revealed row actions also appear on keyboard focus and touch; text survives `zh-Hans`
and English at narrow widths; light and dark themes both work. Required state and focus details
are in `DESIGN.md`.

### Components as installable units

A Component is a bounded capability bundle (panel, commands and storage, Skills, MCP declarations,
knowledge sources). It contributes through declared tool-entry and workbench-panel slots, never by
patching `AppShell` or adding a second navigator. Manifest, activation and distribution:
[`modules/marketplace.md`](modules/marketplace.md#plugin-skill-and-marketplace-design).

### Module compatibility gates

> This document prevents the core framework from making later-in-sequence large modules impossible to add.
> A module may be outside the active release and still requires a durable design boundary. “Not
> implemented” is a delivery status, not a deletion rule.

#### 1. Where a module's design lives

| Layer | Location | Holds |
|---|---|---|
| Cross-module | [`architecture.md`](architecture.md) | Authorities, invariants, shared seams, failure models, code map |
| Module | [`modules/<name>.md`](modules/) | Boundary, native domain model, UI, runtime, failure and compatibility design, execution rows |
| Active slice | [`modules/baseline.md`](modules/baseline.md), [`shell.md`](modules/shell.md), [`services.md`](modules/services.md) | The bounded contract currently being built and accepted |
| Register | [`capabilities.md`](capabilities.md) | Status, release anchor, acceptance ID and surfaces of every capability |
| Evidence | [`references.md`](references.md), [`research/`](research/) | Source and product evidence, licences, mechanisms absorbed and rejected |

Do not delete a unique requirement merely because implementation is gated. Absorb it into its
module, then delete replaced or duplicate files; do not retain a second design home. Do not promote
a reference into a dependency merely because it appears in a module document. Architecture owns
cross-module invariants; the module owns its native domain model; the reference registry owns
evidence about outsiders.

`NEW` never means a greenfield app or alternate platform. It names only the smallest native domain
state or adapter that Craft genuinely lacks after the capability map and current code are checked.
Every NEW module still enters through the Craft Electron shell, Workspace/Session/Task,
permission, timeline, files, settings, Sources/Skills and provider/runtime seams it needs. If a
proposal cannot name that Craft starting path, it is not ready even as a module packet.
Every module also has one explicit R0–R18 anchor in its register rows; module design depth
does not create a separate time horizon or permission to skip that ordered row.

### Source intake before module implementation

OV-078 requires this check for every module, including a correction to an existing feature.
Start with the selected implementation and its pinned original, then the relevant vendor's
official client/SDK or published contract and a named ecosystem implementation. Trace the actual
request, credential audience/account, model eligibility, tool dispatch, saved result, usage and
failure/recovery paths. Inspect only the mechanisms needed for the fixed acceptance; this is not
an instruction to clone every project or restart a repository-wide survey.

Record source revision, inspected symbols, adopted/rejected mechanism and evidence limits in the
existing reference record; reconcile the owning module contract before editing. Resolve a changed
upstream revision against the previous finding without silently re-pinning a reference. A closed
source installer can establish shipped frontend, main-process and local-service behavior, but
cannot establish the remote server's internals, live entitlement or visual acceptance. Where
official source is unavailable, use the published contract and label the missing evidence.
Implementation and its tests continue in the same bounded slice; research completion never
promotes a capability or replaces delivery.

#### 2. Compatibility is a design gate, not a late integration task

Before a large module receives an implementation spec, its design must pass a compatibility review.
The review answers, with code paths and interfaces rather than slogans:

1. Which Craft/Fleet authority does the module reuse or extend?
2. Which state remains native to the module, and which state must remain in the core authority?
3. Which shared seams does it consume (Action, ArtifactRef, Job, Panel, Permission, Timeline)?
4. What happens when the module is absent, disabled, offline, denied, busy, or upgraded?
5. Can the module be added without changing the identity of Project/Workspace, Session, Task,
   Permission, Timeline, Settings, or file ownership?
6. Can it be removed without corrupting core data or leaving an orphaned authority?
7. What is the adapter and what is the implementation? Can the seam be tested with a mock?
8. What resource, licensing, platform, and performance constraints could block the core?
9. What is visible to the model for this task, and can the module contribute capability through the
   one effective projection without injecting its full manual/schema or creating a private loadout?
10. For built-in browsing or a specific outside-tool job, which existing structured route and
    permission boundary apply, and how is observation freshness checked? General external-computer
    control remains excluded by PRODUCT; adapter count does not reopen it.

The minimum output is a **Module boundary** section in that module's document under `docs/modules/`
— one module, one document — and a reference record in [`references.md`](references.md) before an
implementation contract is written for it. The state labels in the
[capability register](capabilities.md#capability-register) (`BREADTH_ONLY` /
`PACKET_DRAFT` / `READY_FOR_SPEC`) describe **documentation depth only** — they do not activate a
release or replace its acceptance criteria. The compatibility review above still applies before
implementation. A current owner request sets the scope (AGENTS authority order); acting on it
includes completing the necessary packet fields in the same effort, not waiting for a separate
documentation project or treating a depth label as permission to skip preparation.

#### 3. Required module packet

##### Executable next-step contract

Every registered capability has exactly one `### Execution <ID>` section in the packet linked by
`product.md`. Read that section together with this common contract and the linked
release spec. Other suites may consume the capability but may not define a second execution owner.
The section contains these fields:

| Field | Required meaning |
|---|---|
| Next | `IMPLEMENT`, `PROVE`, or `CLOSED`; names the exact entry gate. These are next actions, not capability statuses. |
| Sources | Existing repository files to open first. Paths are checked by the documentation gate; proposed modules/tests must not masquerade as existing files. |
| Deliver | Ordered first vertical slice and its visible result; one scope, no new backlog. |
| Data | Inputs, outputs, identity/version and the sole persistence owner. New native domain data is distinguished from existing core truth. |
| Failure | Denial, conflict, cancellation, restart and removal/rollback behavior specific to that capability. |
| Proof | Observable passing and failing scenarios, the owning acceptance ID and a named future regression target. |
| Reference | Concrete comparison route; the registry separates current checkout/document intake from historical mechanism-review revisions, licenses, inspected symbols and import limitations. Resolve both before extraction; an updated HEAD does not revalidate an older finding. |

`IMPLEMENT` means the requirements support the named bounded slice once its gate opens; it does
not activate it now. `PROVE` means the next deliverable is an executable comparison/compatibility
fixture with a selection result, not an editor, placeholder page or dependency installation.
`CLOSED` requires a reason and preserves the valid retained path. No route means “ask the owner to
design it” or “research indefinitely.” Production dependency, authority and public-effect
checkpoints still apply after the safe preparation is concrete and reviewable.

For a `PROVE` route, use the named current path and at most two named alternatives. Freeze the
same input fixtures, supported platform and acceptance before comparison. Measure fidelity,
failure/recovery, resource behavior, integration surface and license/distribution obligations.
Pass means all hard criteria hold and at least one relevant improvement is demonstrated without
another hard regression; a tie keeps the existing path. Record the source lock, measured result
and selected/rejected mechanism in the existing reference record. If both fail, preserve the
fixture and name the smallest unmet requirement; do not invent a production dependency or keep
cycling through repositories. A restricted-license mechanism may inform a fresh implementation;
it is never a fallback code donor by default.

##### Common implementation and verification contract

1. Resolve the current workflow in `TODO.md`, its capability row and owning module. Old retained
   Craft gates apply to that branch; later owner-authorized candidate work follows the current order. A missing later
   spec is filled from the execution section as the first task in that release, in its existing
   suite until a persisted/shared interface or behavior warrants a bounded spec. Do not pre-create
   eighteen empty release documents or resurrect removed contracts.
2. Trace renderer/tool → RPC → policy → owning service → persistence → event/result for both real
   callers. `Sources` are reference entry points, not proof of candidate implementation or permission
   to rewrite entire files. Diff the selected implementation against its own pinned original. Newly named records below are design fields until a real caller
   requires the shared type; do not scaffold all domain stores at once.
3. Identity is the existing Workspace/Session plus the native record ID. A consequential request
   has one stable operation ID and an attempt ID, an expected revision where concurrent writes are
   possible, and an explicit target. Retries retain operation identity; semantic revisions create
   new versions. Check permission and target freshness immediately before dispatch/commit.
4. UI and Agent adapters invoke the same domain operation. A renderer projects authoritative
   state and may keep a disposable draft; it cannot declare success before the owner acknowledges
   persistence. Async acknowledgements distinguish accepted/running/completed; a missing receipt
   is unknown/reconciling, never permission to repeat an external effect.
5. Every mounted surface uses its selected host’s existing primitives and `DESIGN.md`. Cover empty, loading,
   ready, denied, unsupported, offline, stale/conflict, failed and recovery states that apply.
   Keyboard/focus, zh-Hans/en, narrow width and high-DPI behavior belong to the same slice. Restore
   the applicable UI-contract guard before accepting rendered-value edits. No new navigation authority.
6. Persist through the native owner with validation, expected-version checks and its atomic write
   mechanism. Preserve unreadable bytes and unknown newer schema versions. Stage migrations with
   a recoverable original; on failure keep the prior reader and data. Disabling/uninstalling a
   feature removes availability and owned resources, not user artifacts or historical evidence.
7. Add the named behavior regression beside the implementation. New test targets are planned,
   not evidence that a test already exists. Run from `app/` with `bun test <relative-test-path>`;
   config-mutating tests get a disposable `CRAFT_CONFIG_DIR` before process startup as required by
   `engineering.md`. Native/binary/UI probes additionally execute the real process, save/reopen or
   renderer loop: passing parser tests cannot replace that evidence. Run relevant package types,
   i18n/UI gates, then the repository gate at integration. Do not run billable provider calls or
   external publishing as an unannounced test.
8. Record actual commands/results in the task or commit, update the existing contract/status,
   and remove absorbed draft sections. Stop when the bounded acceptance passes. Roll back only
   this slice's edits/activation; preserve later user changes and every source artifact. No new
   status diary, archive copy or “optimization” loop.

These fields make the **next step executable**. They do not certify an unrun benchmark, a complete
module, or a license admission. `READY_FOR_SPEC` may describe a fully specified implementation
slice; a pending mechanism comparison remains `PACKET_DRAFT` even when its proof is ready to run.

Every large module keeps these sections, even while `not implemented`:

- product scope and non-goals;
- user workflows and page/surface inventory;
- native domain model and invariants;
- core authorities consumed and never duplicated;
- UI/renderer boundary and panel behavior;
- Agent actions and human actions using the same governed seam;
- artifact, job, permission, timeline, recovery and provenance behavior;
- reference projects, exact mechanisms, license status and rejected alternatives;
- compatibility matrix and dependency gates;
- resource/performance/accessibility/offline constraints;
- acceptance scenarios and honest implementation status.

The required packet fields are listed above; the compatibility record below is the reusable format.
Until a packet contains actual code paths, reference files/commits and observable acceptance IDs,
its packet state must remain `BREADTH_ONLY` or `PACKET_DRAFT`; `covered` is retired terminology.

#### Compatibility record and module readiness

Use the [single promotion record](references.md#required-promotion-record) for source selection,
license, real caller, rejected alternatives and verification. Module readiness is in the
[capability register](capabilities.md#capability-register); do not maintain another status table.
Current implementation order comes from [TODO](../TODO.md), including later owner-authorized work.

## Building and packaging

[Packaging](packaging.md) owns candidate release requirements and retained Craft build/update evidence.
