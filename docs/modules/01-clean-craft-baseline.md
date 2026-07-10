# M01 — Clean Craft Agents v0.11 Baseline

> **Capability status:** `not implemented` for the target baseline
> **Execution gate:** W0.1 Lead-only; Worker implementation Locked
> **Spec maturity:** contract draft; migration ledger incomplete
> **Wave:** W0.1 migration gate
> **Owner:** Lead
> **Depends on:** verified upstream `v0.11.0` in `UPSTREAM-BASELINE.md`

## 1. Purpose

Establish one clean, verifiable Craft Agents v0.11 base and selectively adapt valuable Fleet
behaviour without merging unrelated histories, copying an old shell, or deleting evidence before
it is absorbed.

The closed baseline loop is: launch clean v0.11 -> open/create project -> use upstream task/session
workbench -> send a normal session turn -> open settings and BrowserPane -> restart and recover the
same state. This is validated before any Fleet feature is ported.

## 2. Scope

### In Scope

- clean tagged upstream checkout and exact commit record;
- path/behaviour migration ledger for current `app/` differences and useful `fleet-old` behaviour;
- retain/adapt/drop/defer classification;
- upstream Projects, Tasks, Kanban, background tasks, panel/layout, sessions, CLI, BrowserPane, and
  settings mapping;
- one reviewed migration branch and baseline real-behaviour evidence;
- selective Fleet adapters only after the clean loop is usable.

### Out of Scope

- merging unrelated histories, directory replacement over the current tree, porting all old code,
  feature work, shell redesign, or deletion of review/legacy evidence as a shortcut.

## 3. Migration Ledger

Every considered behaviour/path records:

| Field | Meaning |
|---|---|
| source | current app, `fleet-old`, or upstream v0.11 |
| source revision/path | exact evidence location |
| target v0.11 extension point | exact target path/symbol after inspection |
| behaviour | user-visible/data contract being preserved |
| classification | retain / adapt / drop / defer |
| reason | product direction, duplication, incompatibility, or evidence gap |
| state authority impact | session/permission/task/panel/file/job/etc. |
| license/attribution | required source boundary |
| contract impact | W0.1 change required or none |
| owner/wave | exact future module/slice |
| verification | real check required after port |

No row is “retain because code exists.” No row is “drop” without confirming its valuable behaviour
has been preserved elsewhere or explicitly rejected.

## 4. Classification Rules

- **retain:** upstream v0.11 behaviour used unchanged.
- **adapt:** valuable Fleet/old behaviour reimplemented at a verified v0.11 extension point and
  routed through the current spine.
- **drop:** duplicated, unsafe, incompatible, display-only, or superseded behaviour with recorded
  rationale and no unabsorbed value.
- **defer:** useful idea lacking contract/evidence; remains documented and unimplemented.

`fleet-old` is an internal behaviour reference, never the merge base. Reference projects remain
subject to `REFERENCE-PROJECT-POLICY.md`.

## 5. Required Upstream Decisions

Before M16/M17/M04 contracts or paths freeze, classify upstream:

- project/workspace authority;
- task and background-task models;
- session/Agent relationships;
- panel stack, main content routing, and layout/preferences;
- CLI/server lifecycle;
- BrowserPane/WebContentsView;
- settings, secrets, sources/skills, permission UI, and timeline/evidence behaviour.

The goal is to reuse compatible upstream capability, not create a second Projects/Tasks/Kanban/
panel system under Fleet names.

## 6. Deletion Safety

- Do not delete another model's review folder.
- Do not delete legacy/reference documentation until valuable decisions are migrated and an archive
  record identifies the replacement.
- Do not delete code based only on filename or visual inactivity; record imports/runtime entry and
  behaviour evidence during the later code migration pass.
- Deletion candidates remain reversible on a reviewed branch until the clean baseline and adapted
  replacement are verified.

## 7. Contract Boundary

The clean upstream baseline is validated before Fleet contract additions. W0.1 then ports one
canonical protocol/action implementation and re-freezes parity. M01 does not add a second session,
task, settings, permission, panel, or browser authority to preserve an old feature.

## 8. Baseline Verification

On the migration branch:

1. record upstream tag and resolved commit;
2. install/build using the commands documented by that exact v0.11 baseline;
3. launch the real desktop application;
4. create/open a project and task/session;
5. send one normal turn and exercise permission UI;
6. open BrowserPane and settings;
7. restart and verify persisted state;
8. record actual paths/commands/results in the ledger;
9. only then port the first approved Fleet adapter and repeat the affected loop.

Typecheck alone does not establish baseline usability.

## 9. Error and Recovery

| Condition | Result | Recovery |
|---|---|---|
| unrelated-history merge fails | no forced merge | use clean base plus path ledger/adaptation |
| current tree dirty | migration/sync stops | isolate/clean reviewed worktree without destroying user changes |
| upstream behaviour unknown | ledger row `defer`/evidence gap | inspect/verify before decision |
| port breaks baseline loop | port not accepted | revise/revert isolated adapter |
| value not yet absorbed | deletion blocked | retain or archive with replacement reference |

## 10. Exit Criteria

- clean v0.11 loop is `usable` on a recorded environment;
- migration ledger covers every current app difference and selected `fleet-old` behaviour;
- upstream project/task/panel/background/session/browser/settings reuse decisions are recorded;
- W0.1 canonical contract parity is recorded on the target baseline;
- no valuable evidence/review folder was deleted prematurely;
- Wave Map explicitly changes W1 gate, or it remains Locked.

## 11. Non-Goals and Prohibitions

- No dirty sync, unrelated-history force merge, old-shell wholesale copy, or deletion-as-migration.
