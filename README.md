# Fleet

A local-first desktop workbench where a person and their Agents operate the same native
artifacts. Fleet targets Windows, macOS and Linux; a later phone connector uses a user-owned
desktop runtime.

## Status

**ZCode is the product base (OV-027).** The development candidate is `.fleet/zcode`: ZCode
`29628c9` (v3.14.3) plus the ordered patches in [`patches/zcode/`](patches/zcode/README.md).
The ZCode Host owns requests, tools, permissions and storage; Pi Agent Core sits beneath it and only
decides whether another model round runs (OV-084).

Fleet is an independent, general Agent workbench with ZCode as its engine: the Agent does the
backend work, the person gets a clear visual front end. Fleet adds a stronger Agent on the person's
own models and CLIs, a plugin-composed workbench, and first-party suites built from mature open
source — creative canvas, trading and quantitative research, Board
([P12](docs/decisions.md#a-product-shape), [position](docs/product.md#position-against-upstream-zcode)).
The next step moves the candidate onto the current upstream release ([TODO](TODO.md#delivery-order)).

No capability is owner-accepted as `usable` yet; see the [capability register](docs/capabilities.md).
`app/` on this branch is an older Craft 0.10.5 tree kept for comparison; the retained Craft v0.13.4
branch is `park/craft-app-dirty-2026-10-10`.

## Working on the project

Read [AGENTS.md](AGENTS.md) first; it routes every task to its document. Then:

```bash
python3 scripts/check-zcode-candidate.py
bash scripts/fleet-verify.sh
```

No signed Fleet release or production updater feed exists. Packaging requirements are in
[packaging](docs/packaging.md).
