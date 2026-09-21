# SPEC — R0 Craft v0.13.3 baseline stabilization

> Spec status: **active**
> Owner acceptance date: —
>
> This contract replaces the closed 2026-09-09 audit of `work/fresh-base-spine`. That branch and its
> renderer were discarded by the Craft rebase. Do not resume its visual walkthrough, recreate its
> `fleet-baseline-r0` tag, restore the v0.10.5 `AppShell`, or treat its landed/typechecked claims as
> evidence for the current tree.
>
> **Current reality:** `app/package.json` is Craft **v0.13.3** and the branch name
> `work/craft-0.12-rebase` is historical. The working tree is large, uncommitted and contains both
> useful integration work and half-finished surfaces. Nothing in this spec says that tree is clean,
> green, visually accepted, or ready to release until the corresponding criterion has fresh evidence.

## Outcome

Produce one trustworthy Craft v0.13.3 working baseline: preserve the current Craft runtime and look,
repair security and recovery defects in the modifications already present, remove or disconnect
unreachable/discarded implementation, and make every capability claim match a real caller and data
path. The result is runnable and fully verified; any remaining uncommitted entry is explicitly
accounted for rather than hidden behind an old commit or release claim.

## Current slice

- **Objective:** stabilize the current v0.13.3 implementation and documentation as one coherent
  baseline.
- **Context paths:** the current `app/` diff and new files; root instructions; canonical product,
  roadmap, capability, page and code maps.
- **Constraints:** preserve Craft v0.13.3; no wholesale donor merge; no new authority; no new remote
  target, relay or file-sync product; no general computer-control layer; no replacement UI shell;
  no tag or commit required by this contract.
- **Acceptance evidence:** fresh Git inventory, existence/caller checks, targeted tests, relevant
  typechecks and linters, `validate:dev`, a non-interactive launch smoke, and owner visual acceptance
  for visible changes.
- **Next safe action:** classify the current dirty paths by behavior, then fix or drop one coherent
  group at a time without overwriting unrelated work.

## Scope

The owner's foundation-first request has an explicit, bounded early R15/R18 host contract in
[`R18-right-workbench.md`](R18-right-workbench.md). It starts with the affected baseline/P6 checks
and existing Files/Notes; it neither marks this complete dirty-tree audit finished nor waits for
R6/R9. The prohibition below on a replacement shell refers to discarded/parallel hosts, not a
compared extension of the current host seam. Wholesale rollback still needs an exact owner-approved
target and recovery plan; no test Project name determines that choice.

### In

- Explain every modified or untracked path in the current working tree and identify half-finished,
  unreachable and superseded groups.
- Stabilize modifications already in scope, especially permission/security boundaries, retry and
  recovery, local-only behavior, current Craft capability intake and honest feature gating.
- Preserve one authority for Sessions, tasks, permissions, settings, assistants, Pages and remote
  Workspace transport.
- Remove dead integration residue only after checking for a caller and migrating any unique current
  fact.
- Calibrate capability/page/module documentation against the current tree.

### Out

- Restoring any discarded v0.10.5/v0.11/v0.12 renderer or workbench.
- Building a replacement layout shell, production canvas, document-format editor, marketplace,
  GitHub delivery product, relay service, RemoteTarget abstraction or general computer control.
- Treating Board as a new task/session authority. Its current independent navigator may remain only
  as a projection over the existing Session/Task authorities.
- Public release, tag creation, pushing, or destructive Git history operations.

## Working method

1. Run a fresh `git status --porcelain` and group entries by one user-visible behavior or shared
   authority. File count and group shape are evidence, never a completion percentage.
2. For each group, confirm installation/process/permission/input/connectivity reality first, locate
   its capability row, and classify `REUSE`, `EXTEND` or `NEW` against the two Craft pins.
3. Trace every new exported component, handler and model to a production caller. An unmounted surface
   is `not implemented`; a test or type alone never promotes it.
4. Keep, fix or drop the group. A kept group must include normal and relevant failure/recovery paths.
   Two non-progressing state-changing attempts trigger the repository stop rule.
5. Run the cheapest sufficient targeted checks as groups settle, then the integrated verification
   ladder below. Do not edit dependency or harness configuration merely to make a check pass.
6. Synchronize only canonical facts changed by the baseline. Owner performs final rendered
   look-and-feel acceptance; until then use `wired but not visually checked`.

## Surface truths this baseline must preserve

| Surface | Baseline contract |
|---|---|
| Conversation | Existing Craft Session authority and composer remain the production path. |
| Board | Separate navigator is allowed by the current owner direction, but it projects existing Session/Task state and creates no second store or duplicate Conversations list. |
| Pages | Local mini-app capability may remain; hosted publication is outside Fleet. Existing remote copies retain a reachable cleanup/unpublish path. |
| Assistant | Independent `packages/shared/src/assistants` authority; never `labels/config.json`. A component with no production caller is `not implemented`. |
| Remote connection | Existing Workspace transport only. Listener, pairing and disconnect/recovery must be honest; no relay, RemoteTarget or pairing-socket file sync is added. |
| Documents | File preview may be `usable`; direct real-format editing stays `not implemented` until a production caller and round-trip path exist. |
| Canvas/layout | Production canvas and generalized pane renderer are `not implemented`. Do not revive discarded workbench or use a shell rewrite as a substitute. |

## Acceptance criteria

| ID | Criterion | Verified by |
|---|---|---|
| R0-C1 | Every current modified/untracked path belongs to an explained keep/fix/drop group; no unknown or secretly inherited group remains. A dirty tree is allowed only when every remaining entry is accounted for. | fresh `git status --porcelain`, grouped diff review |
| R0-C2 | Security, permission, external-network and destructive paths in retained groups fail closed and expose recovery; no forbidden hosted default or silent second authority remains. | targeted boundary tests + code-path review |
| R0-C3 | Every retained feature claim has a production caller and real data path. Unmounted, deleted or test-only implementation is documented as `not implemented`; obsolete residue is removed or explicitly disconnected. | `rg` caller/existence audit + targeted tests |
| R0-C4 | All applicable targeted tests, package typechecks, lint checks and `bun run validate:dev` pass on the integrated working tree without weakening the harness. | fresh command output |
| R0-C5 | Electron or the cheapest equivalent production bootstrap completes a non-interactive smoke with no new fatal error; required services shut down cleanly. | smoke log + process/port cleanup check |
| R0-C6 | `PRODUCT.md`, roadmap, capability map, matrix, page architecture, module registry and code map agree with observed code and use the fixed capability-status vocabulary. | doc diff + `scripts/validate-doc-contracts.py` + semantic searches |
| R0-C7 | Owner has inspected changed visible surfaces. Anything not inspected remains `wired but not visually checked`; no agent upgrades it to `usable`. | owner acceptance |

## Verification plan

Run from `app/` unless a command says otherwise:

1. Targeted tests for each retained behavior and its relevant denied/offline/retry/recovery branch.
2. Applicable package and Electron typechecks.
3. `bun run lint:ui-contract` for rendered-value changes and `bun run lint:i18n:coverage` for UI copy.
4. `bun run validate:dev` on the integrated tree.
5. A bounded non-interactive production bootstrap/smoke followed by process and listener cleanup.
6. From the repository root, `python3 scripts/validate-doc-contracts.py` plus existence/caller and
   forbidden-product semantic searches.

Failures are reported as evidence. A passing subset is never described as a passing baseline.

## References consumed

- [`../PRODUCT.md`](../PRODUCT.md) is the product authority.
- Craft v0.10.5 is the look pin; the rolling Craft mirror and current `app/` are v0.13.3 comparison
  and implementation reality. Admit bounded fixes/mechanisms only.
- [`../08-CRAFT-CAPABILITY-MAP.md`](../08-CRAFT-CAPABILITY-MAP.md) supplies per-capability
  `REUSE`/`EXTEND`/`NEW` classification.
- [`../09-QUALITY.md`](../09-QUALITY.md) supplies the verification ladder.

## Risks and recovery

- **Mixed authorship in one dirty tree:** inspect the current diff and callers before editing; never
  overwrite or reset unrelated work. A pre-stabilization recovery copy exists outside the working
  tree; it is recovery evidence, not an implementation source to merge wholesale.
- **Old documentation promotes deleted code:** existence and caller checks override historical
  `landed`, `wired` and typecheck statements.
- **A cleanup removes unique value:** migrate the one still-current fact first; use a recoverable
  deletion when practical and stop at the owner checkpoint for material removal.
- **External/public effects:** prepare locally, but publication, push, release and new production
  dependencies require owner approval.

## Completion update

When R0-C1 through R0-C6 have fresh evidence and R0-C7 is resolved or explicitly left as the owner
visual gate, update the R0 roadmap row and activate exactly one next release. Do not create a dated
progress report, a baseline tag requirement, or another execution queue.
