# SPEC — R0 Baseline audit

> Spec status: `active`
> Owner acceptance date: —
>
> **State 2026-09-09 (per the roadmap R0 row, the single release-state edit point): the working
> tree is landed; R0-C7 is the only criterion left.** The 2026-08-15 measurement (385 porcelain
> entries, `app/` at 247 files) was re-taken fresh at execution time and came to **395 entries**.
> Every one is now in a landed commit: 17 groups, no `G-unknown`, 18 revertable commits on
> `work/fresh-base-spine` beginning at `c487815ec`. `backup/pre-r0-audit-2026-09-09` snapshots the
> dirty tree as it stood before the first landing commit (`backup/pre-r0-audit` is from 2026-07-20
> and never covered this tree; keep both until the owner accepts R0).
>
> Two blockers were found in the gate itself, not in the code under it, and both are fixed:
> the test suite read the developer's `~/.craft-agent` for `config-defaults.json`, so 9 tests failed
> on CI and on any fresh checkout; and `bun install --frozen-lockfile` failed on a drifted
> `@types/bun`, which fails CI before a single check runs. `validate:dev`, the three `validate:ci`
> i18n checks, the doc-contract validator and `bun install --frozen-lockfile` are all green, and
> the headless server boots with no fatal errors.
>
> The reference-mirror entry is **closed and its recorded cause was wrong**: `源码参考/` became a
> symlink on 2026-08-08 while 73 regular-file entries stayed in the git index, and git does not
> traverse a symlink — the deletions were reported whether or not `/Volumes/AIGC` was mounted, so
> "mount the volume" could never have fixed them. Index entries dropped in `c487815ec`; no file on
> disk was touched.
>
> Status by criterion: R0-C1 met (`git status --porcelain` empty) · R0-C2 met (17 separately
> revertable group commits) · R0-C3 met with one stated limit — each group ran scoped typecheck via
> the pre-commit gate and its own targeted tests, but the groups were verified as a set against the
> complete tree; no intermediate commit is claimed to build in isolation · R0-C4 met · R0-C5 met for
> the headless server; the Electron dev launch rides with the owner walkthrough · R0-C6 met by this
> sync · **R0-C7 open — owner walkthrough, then the tag.**
>
> **Execution boundary:** this release contains Git-history and destructive operations. It is run
> by one agent working with the owner present at the marked checkpoints — it is not a fire-and-forget
> task. Deleting anything follows [`../03-NON-NEGOTIABLES.md`](../03-NON-NEGOTIABLES.md) §6.

## Goal execution boundary

R0 may be the persistent Goal, but it is not one autonomous edit slice. Each continuation selects
one inventory/app/doc group and one acceptance criterion, then finishes that reversible slice before
moving on. Read-only inventory, classification, scoped fixes, tests, and diff preparation may run
without interruption; backup branches, commits, tags, destructive drops, and owner visual acceptance
remain checkpoints. Resume from the Goal/thread state plus fresh `git status`/`git log` evidence —
do not append progress logs to this spec or reread the entire documentation corpus.

## Outcome

The uncommitted working tree on `work/fresh-base-spine` (a mixed set of app code, doc rewrites,
deletions, and new tooling — **count it fresh at execution time**; it drifts) is audited and
resolved **group by group**: each coherent group is landed (verified, committed, documented), fixed
then landed, or dropped (deleted with its unique facts recorded). At the end, the branch is green
(`validate:dev`), runnable, tagged, and the docs describe the actual state.

## Walkthrough (system)

1. **Check Git health (owner checkpoint only if blocked).** Run `git status` first. If
   `.git/index.lock` blocks Git, do **not** delete it blindly: close other sessions using this
   folder, confirm no Git process owns it, then remove the stale lock with the owner present and
   rerun `git status`. If Git is healthy, proceed without manufacturing a checkpoint.
2. **Fresh inventory.** Run `git status --porcelain`, group every entry into coherent groups. The
   expected groups (verify against the actual diff, do not assume):
   - **G-docs:** the 2026-07-16/17 documentation restructure (new/rewritten `docs/`, root
     `AGENTS.md`/`README.md`) — one commit of its own.
   - **G-design-asset-migration:** design-library notes retain only durable product-design value.
     Confirm their content is mapped through `docs/modules/MIGRATION-MAP.md`; superseded milestone,
     process and duplicate-owner documents are deleted after unique facts migrate. Do not create a
     retired/archive directory in the product tree.
   - **G-app-\<feature\>:** app code groups (zh-Hans i18n + lints; Project=Workspace presentation;
     identity labels/system-labels; settings pages; service-independence tests; scripts/tooling;
     husky). One group = one commit, landed only after its ladder passes.
   - **G-unknown:** anything that fits no group → owner decision.
3. **Per app group, smallest first:** classify (REUSE/EXTEND/NEW) → ladder levels 1–3
   ([`../09-QUALITY.md`](../09-QUALITY.md)) → land as one commit with its docs, **or drop** the
   hunks, recording any unique surviving fact. A group that cannot reach
   `wired but not visually checked` within the stop
   rules is dropped or returned to `G-unknown` for an owner decision, not force-landed or silently deferred.
4. **Integrate:** `validate:dev`, non-interactive dev-launch smoke, tag `fleet-baseline-r0`.
5. **Sync docs:** update `../PRODUCT.md` (current state), `../UI-SPEC.md` (delta list),
   `FEATURE-REGISTRY.md`, matrix rows whose status changed, roadmap (R0 done → next ACTIVE), this
   spec.

## Scope

- **In:** everything dirty/untracked in the repo; branch state; the step-5 docs.
- **Out (non-goals):** new features; refactors beyond landing needs; upstream version bump;
  branding rename.
- **Reserved paths:** this spec; test harness configuration (except lints the landed groups
  themselves add).

## Pages touched

R0 audits existing implementation only; no new route is created. These visible baselines must be
rechecked after each landing group:

| Surface ID | Create/extend/wire | Adapter/data contract | Permission | States exercised | Owner visual checkpoint |
|---|---|---|---|---|---|
| P-01 | audit shell/navigation | existing navigation state | existing workspace/session policy | empty/error/narrow/i18n | shell + sidebar |
| P-02 | audit chat | existing Session RPC/events | existing permission prompt | loading/empty/error/denied/offline | conversation + composer |
| P-04 | audit v0.11-derived Board candidate without accepting it as baseline | existing Task store/RPC | existing task policy | loading/empty/error/narrow/i18n | classify for R1 KEEP/LATER/REMOVE |
| P-05 | audit settings | existing settings RPC | existing settings policy | loading/empty/error/narrow/i18n | settings navigator/forms |

## Acceptance criteria

| ID | Criterion | Verified by |
|---|---|---|
| R0-C1 | Every working-tree entry from the fresh inventory is in a landed commit or an explicit drop note; `git status --porcelain` is empty (ignored files aside) | command output |
| R0-C2 | Core doc changes, historical-material recovery/drop decisions and app code groups are separate revertable commits | `git log` shape + recovery/drop ledger |
| R0-C3 | Each landed group passed scoped typecheck + its targeted tests, with an honest status line | commit messages + evidence |
| R0-C4 | `bun run validate:dev` passes on the integrated result | command output |
| R0-C5 | Dev launch shows no new fatal errors | smoke log |
| R0-C6 | Step-5 docs match observed state | doc diff review |
| R0-C7 | Tag exists; owner has accepted the changed visible surfaces (zh-Hans pages, Board, settings) | `git tag` + owner acceptance |

## References consumed

- Craft v0.10.5 is the product/interaction baseline; v0.11.1 and the current repository tree are
  implementation/selective-update comparisons. No external project is admitted or copied by R0.
- The exact code roots and verification commands are listed in [`../06-CODE-MAP.md`](../06-CODE-MAP.md)
  and [`../09-QUALITY.md`](../09-QUALITY.md).

## Dependencies and unresolved edges

None upstream. Produces the trustworthy base every later release consumes.

## Risks and rollback

- **Half-working group landed** → per-group ladder + drop-by-default under stop rules.
- **Deleting unique value** → 03 §6: inspect, migrate the surviving fact, then drop.
- **Rollback:** create `backup/pre-r0-audit` from the dirty tree **before the first landing commit**
  (owner checkpoint: this snapshot is the safety net); delete it only after the owner accepts R0.
- **Git operations** (lock removal, commits, tag, backup-branch deletion) happen at owner-present
  checkpoints; no force operations.

## Verification plan

Ladder 1–3 per group; one smoke at the end; `validate:dev` at integration. Owner CHECK THIS:
zh-Hans settings/workspace surfaces and label menus in both languages. The Board is classified for
R1 and is not a required acceptance surface.

## Doc updates on completion

`../PRODUCT.md`, `../UI-SPEC.md`, `FEATURE-REGISTRY.md`,
[`../11-PRODUCT-MATRIX.md`](../11-PRODUCT-MATRIX.md) rows, `05-ROADMAP.md`, this spec.
