# Source Reference Playbook

Use this process to select, inspect, absorb and remove open-source references on demand. It is not a
product plan and does not create a standing research queue.

## Admission gates

Discovery is not admission. A README, website, screenshot, demo, star count, benchmark name, test
name or model summary may identify a candidate but cannot admit it. A formal reference passes every
gate below:

1. **Product relevance:** maps to a registered Fleet capability and user-visible loop.
2. **Real gap:** `rg` and the call chain show that Craft/Fleet lacks the behavior or is materially weaker.
3. **Source implementation:** a fixed commit exposes the entry, core symbol, callers, state/data path,
   error, cancellation, recovery and relevant tests.
4. **Material advantage:** the candidate beats Craft/Fleet on the same task and acceptance contract.
5. **Alternative comparison:** at least one credible alternative from the capability map was checked;
   otherwise the verdict is `INSUFFICIENT_COMPARISON`.
6. **Local-surpass test:** if a bounded change at the existing Craft seam can match or beat the
   candidate, classify it `LOCAL_IMPROVEMENT` and do not retain the product shell.
7. **Design ceiling:** Fleet's single-authority, local-first, replaceable and recoverable design wins
   over an external architecture. A candidate may contribute only evidence or a local mechanism.
8. **Integration fit:** name the existing seam, caller, fallback and every authority touched.
9. **License and maintenance:** verify repository/file license, NOTICE, dependencies, activity,
   tests, upgrade cost and target distribution.

## Verdicts

- `FORMAL_REFERENCE` — several deep mechanisms repeatedly justify retaining the whole project.
- `MODULE_REFERENCE` — only a bounded subtree, protocol or symbol set passed.
- `LOCAL_IMPROVEMENT` — a small Fleet change can match or exceed the candidate.
- `EVIDENCE_ONLY` — mechanism/product evidence; no standing dependency or code import.
- `REJECT` — no gap, weaker result, authority conflict, unacceptable license/dependency, or no source implementation.

`FORMAL_REFERENCE` and `MODULE_REFERENCE` must pass the deletion test: if deleting the checkout
would not repeatedly remove source knowledge that cannot be expressed concisely, downgrade it.

## Use inside the development order

1. Find the current capability in `docs/08-CRAFT-CAPABILITY-MAP.md` and confirm the Craft path with `rg`.
2. Confirm the ACTIVE R0–R18 row. Research may prepare evidence, but implementation requires the
   ACTIVE release or an explicit owner Goal; there is no near/mid/far reference queue.
3. Open `CAPABILITY-REFERENCE-MAP.md`. Stop if no real gap exists.
4. If the same HEAD is recorded in `REVIEWED-HEADS.tsv`, reopen only the exact symbols needed now.
5. After one coherent product loop lands, update code reality, `docs/08` and the necessary reference boundary.

## New candidate checkout

Before cloning, answer: which `docs/08` row, what Craft gap, why current references are insufficient,
which alternatives exist, and why a local improvement cannot already win. If those questions are
unanswered, do not clone.

When source evidence is necessary, inspect one repository:

1. Clone shallow/sparse into `software/_tmp-*` or `plugins/_tmp-*`.
2. Verify license and follow entry → caller → state/data → failure/cancel/recovery → test.
3. Compare the same user task against Craft and registered alternatives.
4. Classify `CRAFT_REUSE | CRAFT_EXTEND | FLEET_NEW | NO_GAP`, then assign an admission verdict.
5. Merge useful facts into the existing capability map. Only references that pass the deletion test
   enter `RETENTION.md` and `clone_repos.sh`.
6. After integration review, run `compare_with_grok.sh mark <path>`. This records review of the fixed
   HEAD; it does not grant admission.
7. Remove a checkout without retention value. Do not create a report, backup or “maybe later” folder.

`REVIEWED-HEADS.tsv` includes the review-contract version. Legacy reviews without a call chain or
file validation return to pending under a newer contract.

## Grok responsibilities

- `compare_with_grok.sh run <path>` performs read-only source inspection and must compare Craft/Fleet.
- A repository-level report cannot grant formal status. Missing alternative evidence yields
  `INSUFFICIENT_COMPARISON`.
- `implement_with_grok.sh <path> <docs/specs/brief.md>` executes only an accepted Fleet brief. The
  reference never defines implementation scope.
- The integration agent verifies admission gates, cross-candidate comparison and acceptance.
- Reports are not outcomes. The task ends only when code/canonical facts change or `NO_GAP/REJECT`
  is proved.
- Do not chain agents into report-only loops. Every assignment has one owner, deliverable and stop condition.

## Refresh and removal

- `clone_repos.sh` materializes only `RETENTION.md` keepers.
- `update_repos.sh` refreshes only retained independent checkouts and skips `_tmp-*`/unknown paths.
- Refresh discards local checkout modifications; no stash, patch, backup or old directory is created.
- A changed upstream HEAD becomes pending and is re-reviewed only when its capability is active.
- Before removing a retained checkout, remove its primary-reference pointer and synchronize
  `RETENTION.md`, the clone script and `REVIEWED-HEADS.tsv`.

## Git boundary

- The main repository tracks only this README, `craft-docs/`, `meta/` and `scripts/` under the source-reference tree.
- Reference checkouts and local visual samples are not product build inputs or Git submodules.
- Never commit Fleet changes inside a reference checkout.
- Rebase, filter-repo, force-push and remote-history deletion require separate explicit owner authority.
