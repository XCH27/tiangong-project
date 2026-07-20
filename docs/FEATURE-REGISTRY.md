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
|---|---|---|---|---|---|---|
| R0 baseline audit of the legacy working tree | SYS-01 | `work/fresh-base-spine` | the entire uncommitted diff (app code: shell/workspace/label/status/settings/Board, i18n, scripts; the doc restructure; reference/document tree changes — inventory fresh at execution) | `/root` | none | in-progress | Spec: [`specs/R0-baseline-audit.md`](specs/R0-baseline-audit.md). The former mega-row ("Desktop terminology, navigation and identity-label presentation") is superseded: its surviving features re-register individually as R0 lands them. |

## Durable integration rules

- Craft shell is the default UI authority ([`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md)); one
  primary home per capability; no empty future-feature surfaces; no duplicate state authority.
- Independent primary features use separate branches/worktrees; a registry row is a
  collision/dependency declaration, not permission to reserve unreadable territory.
- Shared contracts have one integration owner; dependent branches consume the merged contract,
  never another worktree's uncommitted files.
- Owner-directed early work on a later-release capability is allowed; its row must record honest
  status and remaining dependency edges.
