# Fleet

A local-first desktop workbench where a person and their Agents operate the same native
artifacts: documents, design, canvas, browser evidence and media. Fleet targets Windows, macOS
and Linux; a later phone connector uses a user-owned desktop runtime.

## Status

**ZCode is the selected reconstruction direction (OV-027).** The active development candidate is
`.fleet/zcode`. Its default executor is full Pi SDK 0.99.1 beneath the existing ZCode Host
(OV-069). AgentRuntime retains admission, permissions, context and canonical storage; Pi drives
the model/tool continuation. No user-data migration or whole-Host replacement occurred. Kernel
verification precedes feature-page expansion; contextual Agent operations remain a core requirement.

`app/` is the retained Craft Agents v0.13.4 branch with declared corrections. It remains useful
for reference, recovery and comparison; it is not the current candidate. Reference and prototype
tests do not establish complete Fleet feature support. See [capability status](docs/capabilities.md).

## Working on the project

```bash
bash scripts/init.sh
```

Then use [candidate setup and checks](docs/engineering.md#zcode-candidate). Preserve existing dirty
work; do not recreate or reapply patches over an occupied candidate. The retained Craft branch
has a [separate setup](docs/engineering.md#retained-craft-setup) and verification path.

No signed Fleet release or production updater feed is ready. Packaging requirements and
branch-specific limitations live in [Engineering](docs/engineering.md#building-and-packaging).

## Repository layout

| Path | Role |
|---|---|
| `.fleet/zcode/` | Active isolated ZCode candidate; ignored working checkout with its own Git state |
| `patches/zcode/` | Ordered, reviewable reconstruction deltas for that candidate |
| `app/` | Retained Craft implementation; changes declared in `docs/UPSTREAM-DELTA.tsv` |
| `docs/` | Product meaning, decisions, contracts, status and source evidence |
| `scripts/` | Repository checks and explicitly scoped offline research probes |
| `源码参考/`, `UI参考/` | Untracked reference symlinks into `/Volumes/AIGC/天工参考/`; never product authority |

## Documentation

Start with [AGENTS.md](AGENTS.md) for collaboration rules and task routing.

| Question | Canonical home |
|---|---|
| What is Fleet, and what must remain possible? | [Product](docs/product.md) |
| What is being done next? | [TODO](TODO.md) |
| What works, where, and what is the acceptance criterion? | [Capabilities](docs/capabilities.md) |
| What did the owner decide? | [Decisions](docs/decisions.md) |
| What must stay consistent across modules? | [Architecture](docs/architecture.md) |
| How do I build, test, reconstruct and package? | [Engineering](docs/engineering.md) |
| How must it look and interact? | [Design](DESIGN.md) |
| How does a particular module work? | Its routed file in [modules](docs/modules/) |
| What source or experiment supports a choice? | [References](docs/references.md) |
| What changed? | [Changelog](CHANGELOG.md) |

## License

Craft Agents and ZCode source are Apache-2.0; preserve their notices and attribution. Other
references and admitted dependencies retain their own licenses; see [References](docs/references.md).
