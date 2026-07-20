# Source References

Read-only, reproducible open-source **code evidence**. This directory is not Fleet product code.

- UI component and visual samples → local `UI参考/`
- Owner-intent design notes → [`../docs/design-library/`](../docs/design-library/README.md)

## Layout

| Path | Contents |
|---|---|
| `software/` | Large product/runtime/design/media reference checkouts |
| `plugins/` | Focused token, layout, ingestion and tooling checkouts |
| `meta/` | Capability map, retention policy, reviewed HEADs and operating rules |
| `scripts/` | Clone, refresh and review helpers |
| `craft-docs/` | Craft official-document mirror; comparison evidence, not Fleet authority |

## Development lookup order

1. [`../docs/08-CRAFT-CAPABILITY-MAP.md`](../docs/08-CRAFT-CAPABILITY-MAP.md) — classify REUSE / EXTEND / NEW.
2. [`../docs/05-ROADMAP.md`](../docs/05-ROADMAP.md) — confirm the current development-order row.
3. [`meta/CAPABILITY-REFERENCE-MAP.md`](meta/CAPABILITY-REFERENCE-MAP.md) — map the gap to bounded references.
4. [`meta/RETENTION.md`](meta/RETENTION.md) — understand FULL / SPARSE / TEMP cache policy.
5. [`meta/REVIEWED-HEADS.tsv`](meta/REVIEWED-HEADS.tsv) — check machine-review state.
6. Inspect only the required files under `software/` or `plugins/`; delete `_tmp-*` after intake.

Rules: [`meta/PLAYBOOK.md`](meta/PLAYBOOK.md). Only top-tier implementations or official open
standards for a proven narrow seam receive standing retention. Do not retain star rankings,
candidate dumps, single-repository reports or completion memorials.

## Boundaries

- Never develop, commit or stash Fleet changes inside a reference checkout.
- Never introduce a second Session, Permission, Timeline, Task, Memory or Job authority.
- Default to no clone when no `docs/08` capability row and real Craft gap exist.
- External source answers one concrete Craft capability question. It never supplies Fleet's shell,
  roadmap or product authority.

## Commands

```bash
./源码参考/scripts/compare_with_grok.sh list
./源码参考/scripts/compare_with_grok.sh mark plugins/hyperframes
./源码参考/scripts/clone_repos.sh
./源码参考/scripts/update_repos.sh
```
