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
| R1 boundary shell (clause 1–3 contract) | SYS-01 | `work/fresh-base-spine` (direct commits) | app-shell: `AppShell`/`LeftSidebar`/`SessionList`/`TopBar` + navigation | main integration agent | none | in-progress | Spec: [`specs/R1-one-boundary-language.md`](specs/R1-one-boundary-language.md). Shell landed `2d08364f7`; slice-1 inventory `aaa09b094` (R1-C1). Sidebar trailing-meta visibility is an open owner question (trialed and reverted twice 2026-07-26). `wired but not visually checked`. |
| R2 independence slices C2–C5 | SYS-01 | `work/fresh-base-spine` (direct commits) | updater, sharing, doc-links, OAuth/Slack relay paths | main integration agent | none | merged | Spec: [`specs/R2-independence.md`](specs/R2-independence.md). C2 `445e11b92`, C3 `18bf53415`, C4 `3ddbe59fe`, C5 `61045ebb9`+`8678c7501` — all `wired but not visually checked`. C1 (offline smoke), C6, C7 remain open. |
| R7 canvas preview page (G6 frontend track) | SYS-05 | `work/fresh-base-spine` (direct commits) | `playground/registry/canvas.tsx` + Help-menu entry (debug builds) | main integration agent | none | merged | `display-only`, preview-gated (`0e6c33a25`, `b70fba9ff`; the bundled TopBar relocation was reverted in `1936ac527`). The R7 release row itself stays GATED. |

## Durable integration rules

- Craft shell is the default UI authority ([`CRAFT-UI-BASELINE.md`](CRAFT-UI-BASELINE.md)); one
  primary home per capability; no empty future-feature surfaces; no duplicate state authority.
- Independent primary features use separate branches/worktrees; a registry row is a
  collision/dependency declaration, not permission to reserve unreadable territory.
- Shared contracts have one integration owner; dependent branches consume the merged contract,
  never another worktree's uncommitted files.
- Owner-directed early work on a later-release capability is allowed; its row must record honest
  status and remaining dependency edges.
