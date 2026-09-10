# Feature Registry — who is building which big feature

> **Live state file, not a plan.** The only thing an in-flight feature area shares with the others:
> thin, read-only awareness of **who is building which big feature and which existing path scope
> they occupy** — so two areas don't independently build the same big thing.
>
> Not a task board (Craft's tasks are the task authority), not for small changes, not a source of
> truth about code — it records *claims of territory*; code and observed behavior are the truth.

## How to use it

1. **Before starting a big feature or system suite:** read the table and
   [`16-SYSTEM-SUITES.md`](16-SYSTEM-SUITES.md). If your feature is already `in-progress` or
   `merged`, do not build a duplicate — report to the main agent (join / divide / explicitly
   approved competition per [`07-PLAYBOOK.md`](07-PLAYBOOK.md)).
2. **When you start:** add one row (feature, branch/worktree, path scope, integration owner,
   unmerged dependencies, status `in-progress`). One branch = one primary-feature row.
3. **On overlap or path collision:** coordinate one integration owner and one compatible migration.
4. **When merged or dropped:** update the row status. Prune long-dead rows.

Status values: `in-progress` · `merged` · `dropped` · `competing`.

## Registry

| Primary feature | Suite | Branch / worktree | Occupies (scope) | Integration owner | Depends on (unmerged) | Status | Notes |
|---|---|---|---|---|---|---|---|
| R0 baseline audit of the legacy working tree | SYS-01 | `work/fresh-base-spine` | landed 2026-07-20 as grouped commits (G-docs, G-refs, six app groups + scripts); backup at `backup/pre-r0-audit` | `/root` | none | in-progress | Spec: [`specs/R0-baseline-audit.md`](specs/R0-baseline-audit.md). Release state: the R0 row in [`05-ROADMAP.md`](05-ROADMAP.md) — landing complete 2026-07-26, gates green. Remaining (owner-owned): `fleet-baseline-r0` tag + owner walkthrough (R0-C7). |
| R1 boundary shell (clause 1–3 contract) | SYS-01 | `work/fresh-base-spine` (direct commits) | app-shell: `AppShell`/`LeftSidebar`/`SessionList`/`TopBar` + navigation + global search command surface | main integration agent | none | in-progress | Spec: [`specs/R1-one-boundary-language.md`](specs/R1-one-boundary-language.md); execution map: [`design-library/21-entry-overlap-framework-audit.md`](design-library/21-entry-overlap-framework-audit.md). Shell `2d08364f7`; inventory `aaa09b094`; G7 hover-reveal fixed. Wave 1 (Mark All Read, dead-code review, nested-project filter gate) landed 2026-07-26. Owner-directed current slice: one global search projection over existing Session content, Project folders/files, Settings, and routes; no new search store. `wired but not visually checked`. |
| R2 independence slices C2–C5 | SYS-01 | `work/fresh-base-spine` (direct commits) | updater, sharing, doc-links, OAuth/Slack relay paths | main integration agent | none | merged | Spec: [`specs/R2-independence.md`](specs/R2-independence.md). C2 `445e11b92`, C3 `18bf53415`, C4 `3ddbe59fe`, C5 `61045ebb9`+`8678c7501` — all `wired but not visually checked`. C1 (offline smoke), C6, C7 remain open. |
| v0.11.2 selective intake — fix groups A+B | SYS-01 | `work/fresh-base-spine` (direct commits) | mid-stream queue ordering + Claude task-notification classification | main integration agent | none | merged | Donor repin/intake ledger in `docs/references/REFERENCE-REGISTRY.md`; implementation `26100e45d`. `create_task` and other v0.11.2 product deltas excluded. |
| R1 overlap-audit execution wave 1 | SYS-01 | `work/fresh-base-spine` | list-header Mark All Read, dead-code review, nested-project filter gate | main integration agent | none | merged | Owner decisions G8/G9 plus the four-check dead-code rule. `wired but not visually checked`; owner walkthrough still required for Mark All Read. |
| G8 New Task noun unification | SYS-01 | `work/fresh-base-spine` | create-trigger copy + en/de/es/hu/ja/pl/zh-Hans catalogs | main integration agent | none | merged | Every create trigger says New Task/新建任务; Session stays the code/data entity name. Seven-locale gates passed. |
| R7 canvas preview page (G6 frontend track) | SYS-05 | `work/fresh-base-spine` (direct commits) | `playground/registry/canvas.tsx` + Help-menu entry (debug builds) | main integration agent | none | merged | `display-only`, preview-gated (`0e6c33a25`, `b70fba9ff`; the bundled TopBar relocation was reverted in `1936ac527`). The R7 release row itself stays GATED. |
| R18 modular right workbench (owner-directed early slice) | SYS-01 | `work/fresh-base-spine` (direct commits) | app-shell workbench host; BrowserPane embedding; read-only Git and bounded command core RPC projections | main integration agent | none | in-progress | Spec: [`specs/R18-right-workbench.md`](specs/R18-right-workbench.md). Host, task projection, embedded browser, read-only review, and bounded command runner are `wired but not visually checked`; Canvas is `display-only`; persistent PTY, writable Git, and canvas editing remain `not implemented`. |
| Adaptive work-mode convergence (owner-directed R1 slice) | SYS-01 | `work/fresh-base-spine` (direct commits) | Session work-phase metadata; existing permission gate projection; plan approval; Add/command/Agent plan entry | main integration agent | none | in-progress | Automatic Explore/Execute routing and explicit Plan reuse one Session and one permission authority. Execution approval remains Ask or explicit Bypass in Settings; `awaiting_plan_approval` stays transient. |

| R6 delegation kernel (owner-directed early slice) | SYS-01 | `work/fresh-base-spine` (uncommitted 2026-08) | `packages/shared/src/agent/delegation-{contract,policy,projection}.ts`, `path-lease.ts`, `permission-intersection.ts`, `run-report-validate.ts`; consumed by `TaskRunner.ts`, `base-agent.ts`; inline `DelegationStrip.tsx` | main integration agent | R4 (governed actions), R5 (ArtifactRef) — **both unmerged and unstarted** | in-progress | Landed ahead of R4/R5 (roadmap change log 2026-08-15). Envelope types are **candidate, not frozen** — R4/R5 may reshape them without a deprecation cycle. Kernel + strip `wired but not visually checked`; PreToolUse TaskContract gates, the independent read-only verifier and worktree apply/discard remain `not implemented`. |
| R3 acceptance convention (fixture) | SYS-01 | `work/fresh-base-spine` (uncommitted 2026-08) | `packages/shared/src/workspaces/deliverable-acceptance.ts`; `session-tools-core/handlers/accept-deliverable.ts` + its `SESSION_TOOL_DEFS` entry | main integration agent | none | in-progress | `wired but not visually checked`. Explicitly **not** R3: `specs/R3-first-production-chain.md` C1–C8 still require a real owner-run chain, and this fixture is not a stand-in for them. |
| Settings → Model / OpenCode-admission interaction contract | SYS-01 | `work/fresh-base-spine` (direct commits) | Settings AI/Model page, shared provider-grouped picker, composer model + reasoning + runtime-mode controls, usage/context surfaces | main integration agent | none | in-progress | Owner-directed convergence under Decisions E9/E9a; the binding clauses live in [`12-PAGE-ARCHITECTURE.md`](12-PAGE-ARCHITECTURE.md) §3B. **Registered 2026-08-15** because it had no R-row owner: its open gaps are the §3B "Current known gaps" table, and each closes there rather than being rediscovered as a missing feature. |

## Durable integration rules

- Craft shell is the default UI authority ([`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md)); one
  primary home per capability; no empty future-feature surfaces; no duplicate state authority.
- Independent primary features use separate branches/worktrees; a registry row is a
  collision/dependency declaration, not permission to reserve unreadable territory.
- Shared contracts have one integration owner; dependent branches consume the merged contract,
  never another worktree's uncommitted files.
- Owner-directed early work on a later-release capability is allowed; its row must record honest
  status and remaining dependency edges.
