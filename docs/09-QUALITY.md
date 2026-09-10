# 09 — Quality: verification and acceptance

> How work is verified and accepted, and who owns which layer. Policy authority: Decision G3.
> The commands live in [`06-CODE-MAP.md`](06-CODE-MAP.md).

## The split (who verifies what)

| Layer | Owner | Means |
|---|---|---|
| Types, contracts, callers | Agent | typecheck, `rg` caller audit |
| Changed behavior | Agent | targeted tests beside the change |
| Real data path (non-visual) | Agent | request→persistence trace, restart/recovery check, real command output |
| App boots and core surfaces mount | Agent | non-interactive smoke (below) |
| Visual-language consistency | Agent | declared anchor→result comparison in playground/real local surface; relevant theme/width/state/focus matrix |
| Intentional visual direction and final click feel | **Owner** | the slice handoff report's intentional delta + "CHECK THIS" list |
| Product direction, cost, irreversible effects | **Owner** | checkpoints in [`OWNER-GUIDE.md`](OWNER-GUIDE.md) |

Agents run everything in their rows **without asking**. For structural/styling frontend work they
may use the local playground or app for non-destructive rendered comparison. Owner-account actions,
external side effects, and broad interactive journey audits still require explicit scope.

## Validation ladder (cheapest sufficient level — stop when proven)

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
6. **Full gates:** `validate:dev` at the integration point when shared packages/contracts changed;
   `validate:ci` belongs to CI unless a local CI-equivalent check is explicitly needed. Use
   `validate:quick` (typecheck + `bun test --changed`) while iterating — it is a convenience, not a
   substitute for the integration-point gate.

> **A gate only counts what it runs.** Until 2026-07-30 `validate:dev` ran 3 of 703 test files and
> `typecheck:all` could not pass at all, so "gates green" was reported for months against a check
> that measured almost nothing. When you add a test area, wire it into a gate in the same slice; a
> suite that no gate invokes is documentation, not verification.

Do not run the full suite for a bounded change. Do not micro-test every edit — validate after a
coherent slice.

## Stop rules (bind at every level)

- The same build/validation route fails twice → stop, preserve the exact blocker and evidence,
  report the smallest next decision.
- Two state-changing attempts move no acceptance criterion → halt (Decision C10). Switching
  tools/hypotheses does not reset the counter.
- Never edit dependencies, configuration, tests, fixtures, or harnesses to manufacture a pass
  (03 §6; reserved paths, Decision C7).

## Acceptance flow for a user-visible slice

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

## Test map (where verification lives)

| Area | Where tests live | Run with |
|---|---|---|
| Shared domain logic | `packages/shared/src/**/__tests__/` | `bun run test:shared:all` (scoped: `bun test <path>` from the package) |
| Session tools | `packages/session-tools-core/src/**/__tests__/` | `bun test` in package |
| Renderer components | `app/apps/electron/src/renderer/**/__tests__/` | `bun test <path>` |
| i18n parity/coverage | lint scripts | `bun run lint:i18n:*` |
| Incremental UI contract | renderer additions + shared primitive import seam | `bun run lint:ui-contract` |
| Repo/packaging scripts | `app/scripts/*.test.ts` (e.g. `distribution-safety.test.ts`) | `bun run test:repo-scripts`; typed by `typecheck:scripts` |
| Cross-package gates | — | `validate:dev` / `validate:ci` |

Keep this table honest: if a new test area appears (e.g. smoke scripts under `app/scripts/`), add
its row in the same slice.

### Shared-process test hazards (binding)

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
   suite and run per-process by the root `test` script (invoke as `bun test ./path/to/file.isolated.ts`).

A test that fails only in the full suite (or passes only there) is assumed to be one of these two
classes until proven otherwise — bisect with file pairs before touching product code.

### Harness/profile comparison protocol

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

## Definition of done (per slice)

1. Spec acceptance criteria for the slice: met, with evidence refs.
2. Ladder run at the sufficient level; stop rules respected.
3. Behavior-adjacent test added/extended.
4. Structural/styling UI changes have a declared visual anchor/delta and rendered comparison.
5. Canonical docs whose contract/status changed are updated.
6. Honest status reported; user-visible surfaces are handed to the owner with the intentional delta
   and a short CHECK THIS list.

## Known measurement blind spots (2026-07-28 code-health pass, still open)

A whole-project pass on 2026-07-28 found that `typecheck` and `lint` had been green throughout a
period the owner was reporting broken features — *because the codebase disabled the checks that
would have caught them*. Ten fields the server sent were dropped by the renderer, including the
entire work-mode/plan-mode system, `goal` and `thinkingLevel`, and `tsc` stayed silent because a
hand-written duplicate type plus an `as SessionMeta` cast told it to. That single mechanism explains
a large share of the "根本没实现 / 我根本没在前端看到" reports.

Three fixes landed then (`SessionMeta` is now derived from the wire `Session` with no return cast;
`DismissibleLayerRegistration` and `RecoveryAction` collapsed to single authorities), and three more
have landed since (`ListSessionsArgs` aliased to `ListSessionsOptions`; `AgentError extends
TypedError`; `PANEL_TOP_EDGE_INSET === PANEL_EDGE_INSET`). **Still open, verified 2026-08-15:**

| Blind spot | Why it is a verification problem, not a feature request |
|---|---|
| `TokenUsage.contextWindow` drift between `packages/core` and the shared session token shape | the Token ring reads this field; a drifting duplicate makes the ring silently wrong rather than absent |
| `PreviewOverlayProps` / `FullscreenOverlayBaseProps` 75% overlap | two overlay contracts that a typecheck cannot relate |
| four near-identical menu implementations (`mention-menu`, `slash-command-menu`, `label-menu`, `skill-mention-menu`) | every new menu is written by copying the last, so each arrives with a subtly different interaction language and no gate notices |
| message rewind / session checkpoint | no rewind or checkpoint symbol exists in the session layer; a UI verb here would imply an undo that does not exist (Decision S5) |

The rule these produce: **a hand-maintained duplicate of a type that crosses a process boundary is a
verification failure, not a style issue.** Derive it, or re-export it — never re-declare it. When you
find one, collapse it in the same slice.

## What quality is not

- A green typecheck is evidence, never a capability status.
- A screenshot is optional for non-visual work. A structural/styling UI claim needs a rendered
  comparison; if capture is unavailable, report that limitation and do not claim visual consistency.
- A passing full suite does not substitute for the one real data path the slice claims to deliver.
- Coverage numbers are not a goal; a targeted test that would fail if the behavior regressed is.
