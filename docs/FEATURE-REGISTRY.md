# Feature Registry — who is building which big feature

> **Live state file, not a plan.** The only thing an in-flight feature area shares with the others:
> thin, read-only awareness of **who is building which big feature and which existing path scope
> they occupy** — so two areas don't independently build the same big thing.
>
> Not a task board (Craft's tasks are the task authority), not for small changes, not a source of
> truth about code — it records *claims of territory*; code and observed behavior are the truth.

## How to use it

1. **Before starting a big feature or system suite:** read the table and
   `modules/REGISTRY.md`. If your feature is already `in-progress` or
   `merged`, do not build a duplicate — report to the main agent (join / divide / explicitly
   approved competition per `../AGENTS.md`).
2. **When you start:** add one row (feature, branch/worktree, path scope, integration owner,
   unmerged dependencies, status `in-progress`). One branch = one primary-feature row.
3. **On overlap or path collision:** coordinate one integration owner and one compatible migration.
4. **When merged or dropped:** update the row status. Prune long-dead rows.

Status values: `in-progress` · `merged` · `dropped` · `competing`.

Registry status describes whether a feature area currently owns worktree territory; it does not
override the release sequencing in [`docs/05-ROADMAP.md`](05-ROADMAP.md). A row may therefore be
`in-progress` while its release remains `DEP` or `GATED`; the roadmap still controls when that work
may be activated as a product release.

## Registry

Spine-era AppShell / expert-kits-as-labels / playground canvas were **dropped** by the rebuild to Craft v0.13.4 (the branch name retains v0.12). Do not resume them. Do not rearrange Craft chrome as a stand-in for Cindy capabilities.

| Primary feature | Suite | Branch / worktree | Occupies (scope) | Integration owner | Depends on (unmerged) | Status | Notes |
|---|---|---|---|---|---|---|---|
| R0 inherited Craft baseline rectification | SYS-01 / SYS-09 | `work/craft-0.12-rebase` (historical name; Craft v0.13.4 tree) | rebuilt baseline; verification scripts and canonical status; then Session/Workspace context and current host seams | main integration agent | canonical R0 baseline exit; required R1/R2 evidence | in-progress | Complete inherited baseline correction and owner acceptance first. Only after that exit does early R15/R18 host work follow `specs/R18-right-workbench.md` before domain Components; external distribution stays DEP. Runtime registry/movement remains not implemented; no new identity store, memory prerequisite or replacement shell. |
| Craft Pages (v0.13.4) | SYS-01 | same | `pages` navigator; `packages/shared/src/pages` | Craft-admitted | none | in-progress | Mini-apps. Not Fleet's infinite canvas. |
| Board vs conversation | SYS-01 | same | `sessions` view mode | main integration agent | none | in-progress | Current upstream Board is a Sessions view mode. R0/R1 must reconcile it with P5: a separate navigator is allowed as the same Session/Task projection, never another store or duplicate Conversation list. |
| Discarded layout-shell implementation | SYS-01 | same | pre-rebuild snapshot only | — | — | dropped | Both the old renderer and pure model are absent; the foundation evaluates snapshot mechanisms without blindly restoring them. Only advanced/native-window R18 closure remains gated. |
| Discarded canvas preview implementation | SYS-05 | — | — | — | — | dropped | The old preview attempt is dropped, not the R7 production canvas. R7 remains DEP; production-board requirements come from PRODUCT and SYS-05. Cowart is bounded interaction evidence; Canvasight is task-graph/conflict evidence only. |
| Spine-era renderer / kits-as-labels | SYS-01 | `work/fresh-base-spine` | discarded | — | — | dropped | `16a353120`. |

## Durable integration rules

- Craft *look* is the UI-value authority ([`UI-SPEC.md`](UI-SPEC.md)). Cindy decides **feature
  implementation**, not overlay chrome. One primary home per capability; no duplicate state
  authority; no empty placeholder surfaces.
- Independent primary features use separate branches/worktrees; a registry row is a
  collision/dependency declaration, not permission to reserve unreadable territory.
- Shared contracts have one integration owner; dependent branches consume the merged contract,
  never another worktree's uncommitted files.
- Owner-directed early work on a later-release capability is allowed; its row must record honest
  status and remaining dependency edges.
