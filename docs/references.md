# References — open-source projects and what each is for

Reference projects are evidence, not dependencies. Craft is checked first for every capability; a
project enters a module only after source comparison, a fixed-commit review, a licence review
and a local surpass test. A product-only reference informs behaviour and never authorizes copying
code. Each record carries: repository and commit, licence, exact files and symbols, mechanism
absorbed, Fleet seam, why it cannot be trivially surpassed, rejected alternatives, and a status —
`FORMAL_REFERENCE`, `MODULE_REFERENCE`, `LOCAL_IMPROVEMENT`, `EVIDENCE_ONLY` or `REJECT`.

Raw research notes live in [`research/`](research/) and have these consumers:

| Evidence | Consumer and boundary |
|---|---|
| [Grok planning and execution](research/context/05-GROK-BUILD-HARNESS-RESEARCH.md) | R1 work-mode contract; a reference's automatic plan entry does not override Fleet's opt-in rule |
| [Mode and permission comparison](research/context/06-MODE-SELECTION-COMPARISON.md) | R1 Plan and action permission; ZCode controls and Cindy model popup |
| [xAI authentication](research/context/07-XAI-GROK-AUTHENTICATION.md) | Existing connection authority; client registration must be verified before an OAuth integration |
| [Pi, Hermes and OpenClaw provider architecture](research/context/09-PI-HERMES-OPENCLAW-PROVIDER-ARCHITECTURE.md) | Existing runtime adapter; SDK versions are source locks, not upgrade instructions |
| [Context federation benchmark](research/context/00-UNABYSS-BENCHMARK.md), [multi-agent context research](research/context/01-MULTI-AGENT-CONTEXT-RESEARCH.md), [token-saving inventory](research/context/02-TOKEN-SAVING-CANDIDATE-INVENTORY.md), [harness efficiency diagnosis](research/context/03-HARNESS-EFFICIENCY-DIAGNOSIS.md), [gateway comparison](research/context/04-GATEWAY-AGENT-COMPARISON.md) | [SYS-03](modules/context.md); evidence only |
| [Canvas product reverse analysis](research/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md) | [SYS-05](modules/canvas.md) |
| [Video candidates](research/video/00-CANDIDATE-INVENTORY.md) | [SYS-06](modules/media.md) |
| [MiniMax hub plugin stack](research/plugins/00-MINIMAX-HUB-PLUGIN-STACK.md) | [marketplace](modules/marketplace.md#plugin-skill-and-marketplace-design) |

Per-project `FLEET-ADAPTATION.md` guides inside each reference checkout are generated from the
tables below and the modules' `Execution` sections. After changing either, run
`python3 scripts/reference-guides.py --write`; `--check` validates without fetching. Refreshing a
checkout is not code admission or a baseline update.

Current inventory/source observation: 2026-09-21. Historical findings below retain their original revisions and dates.

Current checkout/document intake and revision-locked mechanism observations are recorded separately below.
This registry owns source evidence and admission gaps; the consuming suite owns the required proof.
Superseded audit, intake and gap documents are removed after their active facts are absorbed here or
in that suite. Original source locks stay attached to retained findings; deleted reports remain in
ordinary Git history, with no archive copy or requirement for new agents to read them.

This is the canonical cross-check between the reference map, the local read-only checkouts and
the product matrix. A row in this file does **not** authorize importing code. Admission status is
independent from cache retention: most `REVIEWED-HEADS.tsv` entries still use the legacy two-column
format; their `pending` labels describe the older admission ledger, not the current review below. `plugins/xyflow`
has now completed a structured Grok source review but remains `INSUFFICIENT_COMPARISON`, not an
admitted reference. The local commit and license facts below were checked directly against the
checkout; they are not claims that the mechanism has passed product comparison.

## Owner-controlled retention

Owner direction, 2026-09-14: inventory existing source clones before looking for replacements, and
discuss exclusions with the owner before acting. A general cleanup request does not authorize
deleting, relocating, archiving, re-pinning or dropping a project from this reference set. Proposals
must name exact paths, local changes, comparative evidence, remaining reference value and recovery.
`REJECT` for code admission is not permission to discard source evidence. Matching HEADs, an old
version, no production import, or a license restriction alone do not establish disposable content.
Historical source-lock hashes must remain attached to the findings actually obtained from them;
new checkout observations do not retroactively revalidate those findings.

## Current on-disk inventory

**Pre-refresh Craft observation, 2026-09-21 takeover:** the rolling checkout is now clean at
`v0.13.4` (`b2d6c8aabdfdc96416eea9debd6756ae6d3c0db9`), origin
`https://github.com/craft-ai-agents/craft-agents-oss`. The look pin remains clean at `v0.10.5`
(`c9d9a26fbefa3a5165ee9aa50cb30c25466afd81`). No reference was moved in that initial observation; the later owner-authorized refresh is recorded below.
The earlier refresh observations below retain their dates and hashes; this observation supersedes
only their statement that the rolling Craft checkout was still on the old pin. Current app
comparison uses v0.13.4; v0.10.5 supplies look measurements, not a product shell to restore.


Read-only inventory rechecked on 2026-09-21: **45 Git checkouts
in `software/`, 22 in `plugins/`**. These are 67 checkouts, not 67 distinct upstream products: the
two Craft pins have different comparison roles.

An earlier owner-directed refresh advanced many checkouts. `meta/REVIEWED-HEADS.tsv` was not
advanced with them: fetching is not reviewing. The bounded review table records evidence
separately; earlier source locks remain historical. That review made no checkout/ref changes; the
subsequent authorized update is described in the current checkout table.
`hyperframes` has 35 pre-existing LFS fixture modifications; preserve them rather than resetting,
stashing or treating a dirty checkout as disposable.

Names below are the actual directory names, grouped only for navigation, not admission or pruning.
The reference root is `/Volumes/AIGC/天工参考/源码参考/` (workspace symlink `源码参考/`).

| Root / subject | Count | Existing directories |
|---|---|---|
| `software/` — agent clients and workbenches | 23 | `AionCore`, `AionUi`, `browser-harness`, `cindy`, `codex`, `craft-agents-oss`, `craft-agents-oss-v0.10.5`, `deepseek-harness`, `grok-build`, `herdr`, `hermes-agent`, `kimi-code`, `Kun`, `multica`, `omnigent`, `openchamber`, `openclaw`, `opencode`, `OpenHands`, `orca`, `pi-mono`, `waku`, `ZCode` |
| `software/` — provider configuration tools | 3 | `CLIProxyAPI`, `cc-switch`, `cockpit-tools` |
| `software/` — canvas, design and documents | 7 | `Cowart`, `genoffice`, `html-anything`, `open-design`, `openpencil`, `penpot`, `tldraw` |
| `software/` — video and media | 6 | `OpenChatCut`, `OpenMontage`, `opencut`, `opencut-classic`, `openreel-video`, `palmier-pro` |
| `software/` — browser, workflow, protocol and engineering | 6 | `browser-use`, `dashi-taskboard`, `flowgram.ai`, `mcp-registry`, `OpenSandbox`, `spec-kit` |
| `plugins/` — layout and interaction | 4 | `dockview`, `react-resizable-panels`, `react-rnd`, `xyflow` |
| `plugins/` — browser, document and media utilities | 4 | `context7`, `hyperframes`, `markitdown`, `playwright-mcp` |
| `plugins/` — skills, context, memory and agent tooling | 14 | `agentmemory`, `agentskills`, `caveman`, `claude-mem`, `claude-task-master`, `claude-token-efficient`, `claw-compactor`, `GPTCache`, `letta`, `LLMLingua`, `mem0`, `planning-with-files`, `repomix`, `SuperClaude_Framework` |

At the source-inventory observation, all 45 software checkouts had no tracked or untracked changes
reported by Git. Of the 22 plugin checkouts, 21 reported none; **`hyperframes` has 35 tracked modifications** (34 test `compiled.html`
outputs and one `sample.mp4`). Their origin was not established and they must be preserved. Git
status does not compare ignored files, unpushed history, or directory contents byte-for-byte.

The later owner-requested documentation pass adds a generated `FLEET-ADAPTATION.md` to each of
those 67 checkout roots. HEAD, origin and pre-existing Git status were compared before/after;
only these guide files were added. They are regenerable local metadata, not upstream code edits,
new source reviews or changed reference-retention decisions.

`UI参考/` contains four non-Git reference collections: `doubao`, `trae-work`, `ui-designs`,
`ui-screenshots`. These are static kits, an existing HTML design and screenshots, not additional
source clones. `craft-docs/`, `meta/` and `scripts/` contain reference documents/metadata/utilities,
not additional top-level Git checkouts. Cowart and GenOffice are already present; their current
revisions are recorded in the review table below. No PanelUI checkout was found in the inventoried roots; it is a user-nominated
candidate, not an installed dependency or a replacement decision.

An earlier turn recorded four moved directories at `/tmp/fleet-old-refs.r97wge/`:
`hermes-agent-latest`, `openclaw-latest`, `pi-mono-latest`, and
`opencode.stale-20260727140104` (a non-Git partial source directory). An earlier observation found the three Git backups matched
the then-canonical HEADs with no tracked/untracked changes. That comparison predates later refreshes
and does not establish current equality, redundant content or redundant history. On this inspection,
that temporary root and the four original paths are absent; the cause and recovery location are
unverified. This pass removed none of them. Canonical checkouts are present in the inventory above.
The earlier retention decision remains unresolved; absence is not approval to exclude a reference.
`/tmp` is temporary storage, not a durable archival policy.

## Current checkouts and development-document intake

Owner-authorized refresh, 2026-09-21: **31 advanced, 35 already current, one fixed look pin**.
For 65 ordinary checkouts, latest means the fetched upstream default-branch HEAD; Craft rolling
means the latest stable release (`v0.13.4`). The separate `v0.10.5` look checkout fetched upstream
but intentionally retained its comparison tag. This does not update `app/` or select dependencies.
Only fast-forward merges were used for ordinary checkouts: no reset, stash, forced checkout,
submodule/dependency installation, upstream scripts or application execution. All 35 pre-existing
Hyperframes fixture modifications retained identical SHA-256 hashes. Their pre-refresh bytes and
manifest remain under `meta/recovery/hyperframes-local-before-refresh/` in the external root.

For a subsequent authorized refresh, inventory origin/default branch/HEAD and local changes first;
preserve changed bytes, fetch the named upstream target, then require a fast-forward. A divergent
branch or overlapping dirty change is a per-repository stop, never a reason to reset it. Keep Craft's
two distinct pin roles. Recheck local byte hashes after the update, record current checkout and
document observations here, and regenerate the guides. The external legacy
`scripts/update_repos.sh` uses forced checkout and hard reset; it is incompatible with this process
and was not executed. An updater script's presence is not authorization to discard local work.

The documentation column names **bounded sections inspected**, not a claim to have read every
upstream document or audited every new implementation. Those tracked files are already available
offline in each updated checkout; do not duplicate the manuals into Fleet. The project guide links
them and the applicable Fleet execution contracts. Upstream instructions are reference data, not
permission to run installers, change Fleet policy, publish, or access credentials.

Keep three facts separate: current checkout SHA below; historical mechanism-review SHA in the
next table; and explicit new source corroboration in [refresh mechanisms](#refresh-mechanisms-and-counter-evidence).
Unchanged named source files do not prove unchanged callers, dependencies or behavior. New source
needs comparison at the consuming capability before implementation. Fetching never promotes admission.

| Checkout | Current SHA / refresh target | Upstream development docs inspected | Fleet intake / limits |
|---|---|---|---|
| `plugins/GPTCache` | `c59fb3a6152a4458b2a070ca183b61c4b614095f` (main; unchanged) | `docs/contributing.md` | Contribution guide exposes cache/embedding/similarity seams. Reject automatic dependency installation and transparent caching of effectful turns; benchmark against Fleet originals. |
| `plugins/LLMLingua` | `5a4c78ae18ab17a98cf997e8259354e546081d64` (main; unchanged) | `README.md` | Usage examples require a compressor model/runtime and emit lossy text. Useful experiment setup only; no semantic-equivalence, token-price or production dependency claim. |
| `plugins/SuperClaude_Framework` | `2d0fda08f2eed9951794dc9c54a6289454961075` (master; unchanged) | `docs/developer-guide/technical-architecture.md` | Architecture describes Markdown context configuration; current source also has execution helpers. Treat document scope as partial, not proof the whole checkout is documentation-only; no second runtime. |
| `plugins/agentmemory` | `b7029ee2141df6772d7ca60b43197ff3607e3237` (main; unchanged) | `AGENTS.md` | Developer guide maps CLI and MCP to one shared core and uses temporary memory directories in tests. Keep shared-handler and scope fixtures; no private memory import or second consolidation writer. |
| `plugins/agentskills` | `69ef37e9424c0a7ea9dd2293b559e43ec8176379` (main; unchanged) | `CONTRIBUTING.md` | Contributor guide locates specification, validator and real compatibility proposals. Use parser fixtures and preserve/explain vendor metadata; instructions inside third-party Skills remain data. |
| `plugins/caveman` | `2fd153c67988e980fb0b2455c90832159a6a5a25` (main; updated) | `docs/technical/architecture.md` | Architecture distinguishes proxy, compression, retrieval and failure behavior. Keep recoverable originals/protected-span tests; BSL engine and telemetry/runtime defaults are not admitted. |
| `plugins/claude-mem` | `4520de9e0f8d6cdc20597520e383d8b51d93137f` (main; updated) | `docs/architecture-overview.md` | Architecture maps hooks to worker/session services and timeouts. Follow actual buffer durability and privacy behavior; hook success is not durable curated memory. |
| `plugins/claude-task-master` | `c0c98d367c55296bfe69e65680625b6db437af02` (main; unchanged) | `apps/extension/docs/extension-development-guide.md` | Development guide separates development dependencies from staged extension package. Compare package validation only; Commons Clause and second task authority remain blockers. |
| `plugins/claude-token-efficient` | `0d30a6db75af983b8ababf585f28faefdfc87895` (main; unchanged) | `CLAUDE.md` | Short contributor instructions supply no new runtime design. Existing controlled benchmark remains the useful reference; no new mechanism admitted merely to fill this table. |
| `plugins/claw-compactor` | `c1b936d40b1145c7a257bd6e34a17994f467495f` (main; unchanged) | `docs/architecture/stages.md` | Stage guide names immutable context, applicability and result metadata. Keep guarded transformations and original retrieval; stage ordering is not semantic preservation proof. |
| `plugins/context7` | `eb27b949fbc95b630bc51eb9e31736ff5895057b` (master; unchanged) | `plugins/codex/context7/README.md` | Plugin README packages Skill plus remote MCP and requires login/new context. Useful distribution separation; remote documentation service is not an offline bundled-doc backend. |
| `plugins/dockview` | `3b519454178f203d41acd49bd2733b5cdcd0f9be` (master; unchanged) | `AGENTS.md` | Developer guide distinguishes consumer React package from internal core and enterprise features. Use actual restore/dispose source and same-fixture comparison; DOM popouts do not prove native Electron integration. |
| `plugins/hyperframes` | `867787b2f935a03e84d485ff7319e01873598c14` (main; updated) | `docs/sdk/guides/canvas-integration.mdx` | Preview adapter separates draft/commit and detaches old composition subscriptions. Source/tests confirm the bounded mechanism; same-origin iframe, ignored hit-test time and missing-dispatch no-op are unsuitable Fleet defaults. |
| `plugins/letta` | `5bcdd177d70fa2b31a754cfcd801e77b2e1ab16a` (main; unchanged) | `CONTRIBUTING.md` | Contributing confirms retired V1 repository and points to letta-code; archive branch is historical. Latest default branch has no runtime to adapt; no silent replacement clone. |
| `plugins/markitdown` | `b8f79c57ebc0044be41323d89b2a45d3fda8460e` (main; updated) | `packages/markitdown-sample-plugin/README.md` | Sample converter declares interface version and explicit register_converters entry point. Useful extraction adapter example; latest Python/optional dependency bounds changed, and Markdown conversion is not Office editing. |
| `plugins/mem0` | `a39a802bbc93e85b820078cd3c4dbaf53af25dbe` (main; unchanged) | `integrations/agent-plugin-core/README.md` | Shared plugin core generates thin per-host adapters with contract/conformance tests. Keep one owner across host adapters; telemetry, hosted memory and independent writers are not imported. |
| `plugins/planning-with-files` | `2bcc24bcc8362ed4ff47f2ee0fc8346bcc1b98e2` (main; unchanged) | `README.md` | Current package is Copilot Markdown agent/knowledge templates. No executable extension mechanism or license-file proof; do not copy its three-file planning workflow. |
| `plugins/playwright-mcp` | `f1257a5a67aff872f947fae274759f7d54853862` (main; unchanged) | `src/README.md` | Source README points implementation to Playwright monorepo; local repo is a wrapper. Do not mistake wrapper documentation/tests for an inspected browser executor or grant. |
| `plugins/react-resizable-panels` | `9a2bb1fda82773585fbdfe540cb91e6d61e6d323` (main; updated) | `CONTRIBUTING.md` | Contribution guide locates pnpm development/tests; no new host architecture follows from it. Compare constrained resize callbacks against Craft, not a docking replacement. |
| `plugins/react-rnd` | `fec7303134ab0f0bbe83fdf975ddc15c340f7e5d` (master; unchanged) | `README.md` | README provides controlled size/position and instance API plus isolated reproductions. Drag geometry alone does not supply docking, persistence, keyboard access or native-window lifecycle. |
| `plugins/repomix` | `4299b5838ef4013cf63b54c93208a6bbfb0f5383` (main; updated) | `website/client/src/en/guide/claude-code-plugins.md` | Plugin guide separates MCP packing, commands and repository exploration. Use bounded selected-source packaging; plugin install is not consent for remote processors or all repository data. |
| `plugins/xyflow` | `0a1f9575b25679f2880175de8d3eae21aedde921` (main; unchanged) | `CONTRIBUTING.md` | Contribution map distinguishes React/Svelte/system and legacy v11. Use current ID-keyed graph change/observer mechanisms; no production-media renderer or workflow executor admission. |
| `software/AionCore` | `37c8869a3ed18d0857ecaf327c20011b0d537dc6` (main; updated) | `ARCHITECTURE.md` | Use repository/error-boundary diagrams to locate adapters. Rust server, JWT and database remain external mechanisms; do not transplant a backend authority. |
| `software/AionUi` | `6744099b279b991c17e31c243f0920477bd31cb6` (main; unchanged) | `docs/contributing/development.md`; `.claude/skills/architecture/references/process.md` | Development requires a separate AionCore binary; Electron source alone is not the complete runtime. Pure logic versus IO separation is useful; revalidate architecture notes against the current split. |
| `software/CLIProxyAPI` | `555662940411a07460e9d24d14477a5f50dffdb5` (main; updated) | `docs/sdk-usage.md` | SDK embeds routing/authentication as a Go service. Management requires a configured secret and separate remote-access setting; do not introduce an account-pool proxy to obtain quota. |
| `software/Cowart` | `43fc8882daf2560c7e36fd34a95fe12c251493ac` (main; unchanged) | `README.en.md` | Portable plugin metadata and project-local canvas assets are useful handoff examples. Web login, GA4 and the tldraw editor license remain separate exclusions/conditions. |
| `software/Kun` | `e67f656bca573d5e6a4970a5094a30f3afd09011` (master; unchanged) | `docs/extensions/architecture.en.md` | Host-derived identity, lifecycle nonce and broker rechecks are design evidence. Noncommercial terms block copying; extension-owned threads cannot become another Fleet Session store. |
| `software/OpenChatCut` | `b49d5cff773570b732fe745e69ca0a0763974a87` (main; updated) | `src/agent/skills/openchatcut-plugin-basics/SKILL.md` | Skill separates project/timeline targeting from tool schemas. Its current tools are direct calls, not MCP; use editing concepts only within the AGPL boundary. |
| `software/OpenHands` | `cf1cc69ff683f1c1a049fc2dd57c6c8cf815b2fc` (main; updated) | `specs/canvas-extensions.md`; `docs/CANVAS_EXTENSIONS_TESTING.md` | Extension contract distinguishes unsupported, unreachable and empty inventory. Testing guide uses MSW memory state and explicitly excludes backend install/persistence/authentication; never report that demo as an end-to-end extension host. |
| `software/OpenMontage` | `08e2151fa02de28a5d6a312b3d575692bf147ad7` (main; unchanged) | `docs/ARCHITECTURE.md` | Architecture documents agent-directed manifests and checkpointed tools, not a Python orchestrator. Keep offline deliverable checks; no imported pipeline authority or paid-provider defaults. |
| `software/OpenSandbox` | `f59755922d92b4e98df805ed7fd4861bc2a38f21` (main; updated) | `docs/architecture/network/egress.md` | Egress document describes Linux DNS/network-namespace enforcement. Useful for diagnosing limits of browser URL checks; no second Fleet/macOS sandbox. |
| `software/ZCode` | `872ad960de7ec172591f7e1952f7849229f94521` (main; unchanged) | `.agents/skills/architecture-governance/SKILL.md` | Bounded module context plus explicit owner, idempotency and stale-result rules aid handoff. Use existing Fleet contracts; do not copy its per-change document-generation policy. |
| `software/browser-harness` | `afbcc381b963040c19627d788e40c7e7663171ee` (main; unchanged) | `CONTRIBUTING.md` | Contributor guide distinguishes checkout launcher from installed command and locates domain skills. Keep private IPC evidence; no new browser ownership or automatic runtime installation. |
| `software/browser-use` | `d8110c5ff87ccba887aaa726cdb780f2f84bef8d` (main; unchanged) | `BETA_AGENT_INTEGRATION_FEATURES.md` | Beta ledger describes an opt-in Rust SDK server while Python Agent stays separate. Protocol compatibility and claimed feature parity require their own proof; no wholesale agent runtime replacement. |
| `software/cc-switch` | `56df6513943062e8ca9eb80d8928eef7cf08a76d` (main; updated) | `docs/user-manual/en/2-providers/2.5-usage-query.md`; `docs/user-manual/en/3-extensions/3.3-skills.md` | Usage guide separates subscription windows from balance/scripts and explains ambiguous provider query modes. Its endpoint descriptions are not proof of a supported public API; Fleet uses runtime-owned credentials and typed identity-scoped samples. |
| `software/cindy` | `64e96e3a351797b1a3e305b52b6627f376dbf2b3` (main; updated) | `docs/dev-rules/architecture-invariants.md`; `docs/dev-rules/electron-security-and-process-boundaries.md` | Read current panelKind/layout ownership and Electron sender validation. Preserve unknown panels and distinguish applied from persisted; reject its corrupt-layout overwrite, fixed conversation width and user-global layout policy as Fleet defaults. |
| `software/cockpit-tools` | `d4f1dbf2a019a2384202bfd5537f81bc6b654473` (main; updated) | `CONTRIBUTING.md`; `docs/CODEX_API_SERVICE_HANDOFF.md` | Contributor guide identifies shared core/GUI/CLI and targeted checks. API Service handoff describes credential/config injection into a local gateway, not a supported quota API; keep the existing quota scheduler comparison and restricted-license boundary. |
| `software/codex` | `639d2478cc2e16d6ca715952d2e726a3aecc024e` (main; updated) | `codex-rs/app-server/README.md`; `codex-rs/ext/extension-api/notes.md` | App-server documents cancellation acknowledgement versus original completion and auth-generation fencing. Saved disabledPluginIds explicitly does not yet filter capabilities. Sparse quota updates are corroborated in protocol/v2/account.rs; extension notes alone are not an SDK contract. |
| `software/craft-agents-oss` | `b2d6c8aabdfdc96416eea9debd6756ae6d3c0db9` (v0.13.4 stable; unchanged) | `CONTRIBUTING.md`; `apps/electron/README.md` | Use Electron build/transport/package entry guidance with current scripts as authority. Do not run upstream secret-sync, publishing or hosted-service setup; v0.13.4 remains the release comparison. |
| `software/craft-agents-oss-v0.10.5` | `c9d9a26fbefa3a5165ee9aa50cb30c25466afd81` (v0.10.5 look pin; fixed) | `apps/electron/README.md` | Fixed visual comparison only. Keep this development guide with its original checkout; current implementation/build claims belong to the rolling release and app tree. |
| `software/dashi-taskboard` | `4097732dd6ebd5493fd7a094e03cfed570b64d41` (main; updated) | `integrations/deepseek-harness/README.md` | Small host bundle locates an already-running runtime through launcher-owned metadata rather than a fixed port. No second Taskboard runtime or task store. |
| `software/deepseek-harness` | `ddefc45fbc7f8e46dd73185e68295696d1297887` (master; unchanged) | `packages/extensions/cordis-host-runner/README.md` | Host guide names scope/disposal and immutable versions; definitions are RAM-only, node:vm is not a security boundary, async work escapes vmTimeoutMs and UI load receipt precedes render. Do not adopt those limitations silently. |
| `software/flowgram.ai` | `ba1a9630f80263a196d31993cd85fd1c873d9ddd` (main; unchanged) | `apps/docs/src/en/guide/advanced/custom-plugin.mdx` | Custom plugin guide gives lifecycle hooks and portable fixed/free-layout registration. Compare disposal concepts only; the IoC/editor container is not a small standalone executor. |
| `software/genoffice` | `42d66bcfc902e550f165fa59a6c0b9f94e81cdc9` (main; updated) | `apps/sheets/docs/architecture.md`; `packages/html2docx/ARCHITECTURE.md` | Sheets guide declares partial PoC state and package-preserving edits; current sidecar already exposes newer archive/recalculation operations, so its production-gap list is not current feature proof. HTML-to-DOCX intentionally rasterizes some decoration; measure editability separately. |
| `software/grok-build` | `4247f661689354b831191f11eeeac8424993fe3d` (main; unchanged) | `crates/codegen/xai-grok-pager/docs/hooks-and-plugins.md` | Hook/plugin guide makes scope, version and error feedback inspectable. Shell hooks are executable effects, not approval grants; keep Fleet permissions and shared UI. |
| `software/herdr` | `8ac9542757292f7a8d42a2d532bc6a8a33c7ffce` (master; updated) | `docs/next/website/src/content/docs/plugins.mdx` | Plugin guide explicitly treats commands as normal local code inheriting user environment and full CLI access. Context/logging are useful; this is not isolation or bounded Fleet authority. |
| `software/hermes-agent` | `ab1f70f4b3410fc8cd5195734f0a1b386e873de4` (main; updated) | `website/docs/developer-guide/desktop-plugin-sdk.md` | Desktop SDK documents one contribution registry, native UI kit and scoped disposers. Its renderer plugins have full app authority and default activation; desktop implementation is not present in this checkout. Documentation evidence only, no security-boundary or code-import claim. |
| `software/html-anything` | `553ed98c283f9c0f489902d035416a972d6a9699` (main; unchanged) | `CONTRIBUTING.md` | Contributor map separates Skills, argv/detection adapters and export adapters. Reuse a small adapter only after comparing Craft; examples do not justify another agent runner or UI language. |
| `software/kimi-code` | `7ad0c46682ec735559a12c6a410c406b9d6cb709` (main; updated) | `docs/en/customization/plugins.md` | Plugin guide separates install/reload and describes macOS Accessibility/Screen Recording versus Windows foreground input. Useful platform acceptance cases; proprietary/distributed Computer Use helper implementation is not established by the guide. |
| `software/mcp-registry` | `d1dcaf3fb36338d45ccdba98b5b8aea915e7d50d` (main; unchanged) | `docs/reference/api/extensions.md` | Namespaced experimental endpoints keep registry core minimal. Namespace/version metadata is useful; no Fleet-hosted registry requirement or execution grant. |
| `software/multica` | `f41fae6b08fb734afcbd13205c0b3203dd0bc9c6` (main; unchanged) | `apps/docs/content/docs/developers/architecture.mdx` | Architecture separates server data from client drafts/layout and explains task versus Run terminology. Keep this separation; hosted database/daemon and scheduler remain outside Fleet ownership. |
| `software/omnigent` | `a7a26104cfb07d08480fe5b8712678ace719efcc` (main; updated) | `docs/extending/extension_manifest.md` | Immutable manifest declares independent API version, publisher-qualified IDs, collision rejection and verified bundle paths. Activation events/when/commands are reserved metadata in V1, not running features. |
| `software/open-design` | `f2e649efb2bebf86e2d047b1d5ff7a404fbda5d1` (main; updated) | `plugins/spec/AGENT-DEVELOPMENT.md` | Agent handoff separates portable SKILL.md from versioned host manifest and requires real preview output. A skipped/404 preview bake fails verification. Keep capability declaration and output fixtures, not another design authority. |
| `software/openchamber` | `336e19248fa0bc0bd9d3bd843e1057d4e2cf62e7` (main; updated) | `packages/extensions/DOCUMENTATION.md` | Built-in ownership guide uses ordinary public SDK, staged validation, host-bound provenance and disable-with-data-retention. Automatic built-in grants are rejected. Git PR source adds ancestry checking for reused branch names; see refresh mechanisms below. |
| `software/openclaw` | `b4f1fec13ae8978d7ec58f86d3738d3414d457d9` (main; updated) | `docs/plugins/architecture.md` | Architecture separates manifest discovery/diagnostics from activation and keeps metadata/provenance in one cache owner. Useful load sequencing; do not import the gateway, global runtime or trust defaults. |
| `software/opencode` | `fe3f3a41f79ad292cc3c7c629567385a20ec5130` (dev; updated) | `packages/plugin/src/v2/promise/README.md` | V2 Promise API documents awaited hook registration/disposal and per-domain reload. Compare lifecycle semantics; in-process transforms may mutate catalogs and are not a Fleet permission boundary. |
| `software/opencut` | `400f097becba5db0fbc305d5a65348cb81c20356` (main; unchanged) | `apps/desktop/README.md` | Desktop README explicitly says the GPUI app is an early window. Latest default branch still does not establish an editable/exportable timeline; retain classic as the mechanism candidate. |
| `software/opencut-classic` | `cf5e79e919144200294fb9fed22a222592a0aeea` (main; unchanged) | `.github/CONTRIBUTING.md` | Contributor guide identifies actual web/editor development and targeted checks. Upstream collaboration policy and Docker services are not Fleet build requirements; compare the existing command/export source. |
| `software/openpencil` | `7c3c04f78e800d34dd860ffe3696b6647fbe5478` (main; updated) | `packages/op-web-sdk/README.md` | Web SDK is explicitly a read-only .op viewer with destroy cleanup. Full app editing is a different path; do not call viewer embedding native editing or Office/FIG fidelity. |
| `software/openreel-video` | `5f3c85e5fc223c86060bf4b12e1b4dec58e9b8a9` (main; unchanged) | `CONTRIBUTING.md`; `creating-views/README.md` | Contributor guide locates core engines versus web bridges. creating-views is an exported design prototype, not a production runtime contract; use the reviewed clock/export paths, not prototype instructions. |
| `software/orca` | `5064469687b59ca5203276ee52db6ce38cac877a` (main; updated) | `docs/audits/plugin-worker-output-retention/README.md` | Worker-output audit traces retained string backing buffers through real parser/log ring and supplies reproduction commands. Bound bytes as well as line counts; audit measurements are upstream evidence, not Fleet measurements. |
| `software/palmier-pro` | `b4b1333f9404a2ca8a9509443955cd1c501de480` (main; unchanged) | `AGENTS.md` | Development notes distinguish packaged/test resource lookup and observable cancellation/failure. Reject its no-migration policy for Fleet data; Swift/macOS/binary license constraints remain. |
| `software/penpot` | `433f8774497a6c651f96cd5976717756fde54bc4` (develop; updated) | `docs/technical-guide/developer/architecture/index.md` | Architecture explains shared frontend/backend data models and exporter boundaries. Use native API/schema mechanisms, not the hosted SPA/JVM database stack; changed token schema requires migration review. |
| `software/pi-mono` | `1a584a7a56eb5e7b4ff8ccbd46430f1533282eed` (main; updated) | `packages/coding-agent/docs/extensions.md` | Extension guide maps trust, lifecycle and session-entry persistence. Extensions execute with full system permissions; example stash checkpoints and arbitrary tool interception are not Fleet policy. |
| `software/spec-kit` | `b9e7389d1414cfefe3964917a7ca48cd99503815` (main; updated) | `extensions/EXTENSION-DEVELOPMENT-GUIDE.md` | Extension guide separates schema version, package metadata, configuration and local tests. Keep requirement coverage ideas; no second planning/approval engine or extra per-task documents. |
| `software/tldraw` | `a8e24125716e76cf25cca6fe4ab62fd13d550780` (main; updated) | `packages/state/ARCHITECTURE.md` | State architecture locates signals, atoms and transactions. Inspect leaf-package terms independently; state documentation does not license or select the editor SDK. |
| `software/waku` | `1135692b29097131fcde3a79168b224b4e93dff1` (main; unchanged) | `CONTRIBUTING.md` | Contributor guide gives GPUI/platform/CLI prerequisites. No independently better extension mechanism established in this doc pass; keep the earlier driver-control evidence and GPL boundary. |

### Refresh mechanisms and counter-evidence

These are narrowly corroborated at the current SHA in the table above. Tests were **read**, not
run against the reference applications. Adopt the stated requirement in the named Fleet contract;
production imports remain subject to the existing comparison and dependency gate.

The owner-authorized R1 source comparison adds these observations at the current revisions above;
historical mechanism observations later in this registry keep their original SHAs. R1 owns the
implementation contract, and these source observations do not establish Fleet implementation.

| Current source | Admitted behavior / Fleet owner | Excluded import |
|---|---|---|
| ZCode `packages/ui/src/v4/ConversationTimeline.tsx`, `SessionPane.tsx`, `ConversationComposer.tsx` | R1: responsive empty layout using the normal composer, with a context header above the editor; supported context actions share the add popup. | Brand art, second editor/controller, unwired Goal/Workflow/Plugin actions. |
| ZCode `packages/ui/src/v4/composer/V4ComposerModeControls.tsx`, `V4ComposerToolbar.tsx`, `composerSubmissionConfig.ts`; `packages/shared/src/execution-state.ts`; `apps/zcode-cli/packages/core/src/permission/service.ts` | R1: independent Plan checkbox and three permission radios; separate model/reasoning; validated submission snapshot; Plan constrains full access. Extend Craft's Session/permission/provider owners. | Automatic phase selection, four exclusive modes, a copied permission engine, silent Plan removal or full-access escalation. |
| Cindy `apps/desktop/src/renderer/components/new-chat/ModelSelector.tsx`, `UnifiedModelPanel.tsx`, `UnifiedModelRail.tsx`, `UnifiedModelRow.tsx`, `ModelSourceDetails.tsx`, `composerModelSelection.ts` | R1: top search, filter rail, grouped rows, configure footer, scoped account/usage display and coherent current/next-turn choice. | Theme values, payment flow, model/credential/usage stores, screenshot sample numbers, local quotas applied to remote accounts. |
| Cindy `apps/desktop/src/renderer/features/right-sidebar/RightSidebarShell.tsx`, `TabBar.tsx`, `registry.ts`, `store.ts`, `types.ts` | R1: Session-scoped tab lifecycle, registered bodies, add menu and unknown-kind recovery, implemented through Craft's existing panel/layout owner. | Global-only layout, fixed widths, Cindy database/RPC, browser engine replacement or new native docking framework. |

| Mechanism / exact source | New observation | Fleet landing / rejecting condition |
|---|---|---|
| OpenChamber `packages/web/server/lib/github/pr-status.js#isHistoricalPrOfCheckout` (refresh diff) | A terminal PR matched by reused branch name is returned only when its head commit is an ancestor of checkout HEAD; failure to establish ancestry returns false. | EXEC-05 Git proof adds reused-name/fresh-worktree and unavailable/shallow-history fixtures. Unknown ancestry cannot mean ownership; active-PR matching still needs repository/fork identity. |
| Cindy `apps/desktop/src/main/layout/LayoutStore.ts#getLayout,setLayout,persist` | Writes return `{layout,persisted}` and validate input before mutation; read fallback immediately writes default layout over a corrupt file. | CORE-11 preserves separate in-memory/save results but must preserve corrupt bytes and explain recovery. Missing/unregistered panel IDs survive layout storage; no import of global-only placement or fixed widths. |
| GenOffice `apps/sheets/src/main/xlsx-sidecar-client.ts#close,recalcCells`; `native/xlsx-engine/src/archive.rs#save_archive` relative to `apps/sheets/` | Close cancels queued reads without dropping close/save effects. Save rejects source-equals-target and raw-copies unmodified ZIP entries, then syncs and reads back a manifest. It creates the destination directly; this function alone is not atomic replacement. Current recalculation method is newer than the architecture gap list. | INFO-05 proves immutable original, byte-preserved untouched entries, stale-base refusal, temporary-output validation and host-owned atomic publish. Formula support requires execution/fidelity fixtures, not a method name or architecture claim. |
| Hyperframes `packages/sdk/src/adapters/iframe.ts#commitPreview,attachSync`; adjacent `iframe.test.ts` and `iframe.sync.test.ts` | Draft commits dispatch one move; synchronous dispatch failure restores draft. Reattach removes previous patch subscription; iframe load resynchronizes overrides; script patches are filtered. Missing dispatch returns without saving; async durability is outside this adapter. | CREATE-07/CREATE-09 use one domain edit owner, explicit durable receipt and teardown tests. Keep untrusted preview isolation; no same-origin shortcut, fabricated time-accurate hit or saved-success on a no-op. |
| Codex `codex-rs/app-server-protocol/src/protocol/v2/account.rs#AccountRateLimitsUpdatedNotification,RateLimitSnapshot` | Rolling updates are sparse; merge supported values into an identity-matched snapshot or reread it. Missing account metadata does not erase known fields. `spend_control_reached: None` is explicitly unavailable, not false. | INTEL-04 preserves per-field presence, sample age and account/config generation. Account switch clears old identity; no zero/default quota or nullable field interpreted as unlimited. |
| Codex `codex-rs/app-server/README.md` — User verification cancellation / Thread plugin settings / Selected workspace routing | Cancel acknowledgement does not establish original operation completion; saved plugin selection explicitly does not yet filter tools; account notifications require current-state reread. These are protocol-document observations, not an end-to-end runtime test. | EXEC-15/ORCH-03 distinguish requested, acknowledged and effective state, discard late results and prove tool gating separately from preference persistence. |
| OpenPencil `packages/op-web-sdk/README.md`; OpenHands `docs/CANVAS_EXTENSIONS_TESTING.md`; Hermes `website/docs/developer-guide/desktop-plugin-sdk.md` | Respectively: read-only viewer; mocked backend; renderer extensions with full app authority. Hermes desktop runtime source was not found in this checkout. | CREATE-06/ORCH-03 cannot promote any of these into an editable document, durable install or isolated plugin claim. Keep documentation-only evidence labeled. |
| Penpot `common/src/app/common/files/changes.cljc` (refresh diff); MarkItDown `packages/markitdown/pyproject.toml` (refresh diff) | Token status changes from path sets to UUID theme/set IDs and adds token-source changes. MarkItDown now bounds Python below 3.15 and changes YouTube optional dependency constraints. | CREATE-06 needs versioned native-change migration; ingestion dependency closure must be rechecked. Historical file/line references remain at their original SHA. |
| Codex `codex-rs/core/src/agent/control.rs` (refresh diff) | Config snapshot now calls inspection and distinguishes Loaded versus Unloaded agents; CLI exec-server code moved into `codex-rs/cli/src/exec_server_command.rs`. | ORCH-07 must re-trace callers before adopting old line references. No claim of full review of the moved CLI or new inspection implementation. |

## Bounded source review — 2026-09-21

All **67 Git checkouts at the listed pre-refresh source locks** below were inspected for repository identity, current revision,
working-tree changes, license boundaries and at least one relevant implementation path where
source exists. The four non-Git UI collections remain visual references, not source audits.
This is **not a whole-repository audit**: unread modules, dependency closure, runtime behavior and
integration tests remain outside this pass. That bounded review did not change, fetch, install or run references. The later refresh did change
checkout HEADs; do not reinterpret the findings below at the new revisions.

`REUSE` is the existing Craft implementation; `LOOK` is the visual comparison pin. `C` means a
bounded code extraction or adaptation **candidate**, not drop-in compatibility,
dependency selection, admission, implementation or test acceptance. `M` means mechanism evidence
only; each row explains its integration or license boundary. Language/runtime fit is evaluated
per mechanism, not a blanket language ban under F3. `X` means the current
snapshot/runtime cannot supply the proposed Fleet capability. None of these marks changes product
capability status. Root licenses never extend automatically to enterprise, vendor or binary code.

Repository links identify observed origins; paths are relative to each checkout and name the
implementation read. SHA prefixes identify the original bounded source observation, not the current refreshed HEAD.
Resolve current HEAD and new documentation evidence through the table above.
Before implementation, compare the exact mechanism with current Craft/Fleet, prove the shared
authority/caller and failure path, and complete the existing admission requirements below.
Baseline R0/R1/R2 corrections remain first; read-only reference research opens no feature gate.

### Product anchors

| Checkout / reviewed SHA / license | Source path or symbol read | Reuse boundary |
|---|---|---|
| [software/craft-agents-oss](https://github.com/craft-ai-agents/craft-agents-oss) · `b2d6c8aabdfd` · Apache-2.0 | `apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx`; `apps/electron/src/transport/routed-client.ts` | **REUSE** — Current Session/Task, provider, permission and panel-stack paths are the baseline. Remote routing is not proof of host-side grants; hosted services still need R0/R2 correction. |
| [software/craft-agents-oss-v0.10.5](https://github.com/craft-ai-agents/craft-agents-oss.git) · `c9d9a26fbefa` · Apache-2.0 | `apps/electron/src/renderer/components/workspace/AddWorkspace_RadioOption.tsx`; `apps/electron/src/renderer/components/app-shell/SessionMenuParts.tsx` | **LOOK** — Shared picker/menu primitives and visual measurements. No restoration of this older product shell or runtime. |
| [software/cindy](https://github.com/makecindy/cindy) · `00a5ad1a503c` · Apache-2.0 | `apps/desktop/src/renderer/features/right-sidebar/registry.ts`; `apps/desktop/src/main/maker-host/plugins/plugin-registry.ts` | **C** — Panel registration, collision checks, hydration/disposal and project-over-global overrides. Unknown plugin enablement defaults open; do not copy that or silent essential-toggle refusal. No second database or settings authority. |
| [software/openchamber](https://github.com/openchamber/openchamber) · `896776d81e13` · MIT | `packages/web/server/lib/github/pr-status.js`; `packages/web/server/lib/github/routes.js` | **C** — PR ownership from repository/source/tracking/fork identity; serialized Git refresh/mutation. Revalidate exact repository and stale authorization cache behavior; do not import the entire server. |
| [software/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) · `ddefc45fbc7f` · MIT first-party | `packages/extensions/cordis-host-runner/src/lifecycle.ts`; `packages/extensions/cordis-host-runner/src/guard.ts` | **M** — Await activation, diagnose missing services and dispose failed scopes. Re-specify over Fleet authorities; no Cordis root. Its slots can shadow shipped UI, which Fleet must prevent; VM is not an OS sandbox. |

### Agent runtimes and configuration

| Checkout / reviewed SHA / license | Source path or symbol read | Reuse boundary |
|---|---|---|
| [software/AionCore](https://github.com/iOfficeAI/AionCore.git) · `d4ce55eb7606` · Apache-2.0 | `crates/aionui-session/src/backend/mod.rs#SessionBackend`; `crates/aionui-session/src/capability.rs` | **M** — Separate command receipt from observed Session event; unsupported capabilities and external permissions fail closed. Rust actors and pending-approval recovery are not a Fleet runtime replacement. |
| [software/AionUi](https://github.com/iOfficeAI/AionUi.git) · `6744099b279b` · Apache-2.0 | `packages/desktop/src/index.ts:1-95`; `packages/desktop/src/renderer/hooks/agent/useAcpConfigOptions.ts:60-110,345-415` | **C** — [Three traced flows](#aionui-and-aioncore): shared creation, configuration evidence and turn cancellation. `Observed` can be an optimistic host value; it does not universally prove CLI echo or preference persistence. |
| [software/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI.git) · `a5ab69521f7b` · MIT | `cmd/server/main.go:1-125`; `sdk/cliproxy/auth/selector.go:1-175,614-671` | **M** — Stable credential identity and retry metadata. Go account-pool gateway is not a Fleet capability or second provider authority. |
| [software/codex](https://github.com/openai/codex) · `ebc05da3bdb7` · Apache-2.0 | `codex-rs/cli/src/main.rs:1171-1235`; `codex-rs/core/src/agent/control.rs:1-205` | **M** — Shared delegation-root budget and permit release on drop. Rust runtime/store stays outside Fleet; cancellation and resumed-tree coverage are not proven here. |
| [software/grok-build](https://github.com/xai-org/grok-build.git) · `4247f6616893` · Apache-2.0; vendored notices separate | `crates/codegen/xai-grok-pager-bin/src/main.rs:2025-2088`; `crates/codegen/xai-grok-workspace/src/permission/gate_preflight.rs:1-205` | **M** — Deny outranks ask, ask outranks allow; explicit ask cannot be waived by classification. Do not adopt another policy authority. |
| [software/herdr](https://github.com/herdrdev/herdr.git) · `5a6491422336` · Apache-2.0 | `src/main.rs:504-568`; `src/api/event_hub.rs:1-127` | **M** — Bounded sequence-numbered event ring reports lost/unavailable resume ranges. Rust supervisor and persistence are separate from Fleet Session state. |
| [software/hermes-agent](https://github.com/NousResearch/hermes-agent) · `db1f3f4564eb` · MIT | `hermes_cli/main.py:1-60,3512-3552`; `agent/interrupt_scope.py:1-73` | **M** — [Three traced flows](#hermes): turn cleanup, final-argument authorization and evidence/curated-memory separation. Automatic approval paths exist; file locks do not establish a single consolidation writer. |
| [software/kimi-code](https://github.com/MoonshotAI/kimi-code.git) · `6a214b85e53e` · MIT | `apps/kimi-code/src/main.ts:1-65`; `packages/acp-server/src/approval.ts:1-163` | **C** — Pure ACP approval mapping rejects unknown responses and distinguishes session scope. Current checkout is TypeScript, not the older Python tree; no second approval store. |
| [software/Kun](https://github.com/KunAgent/Kun.git) · `e67f656bca57` · PolyForm Noncommercial | `src/main/index.ts:1-45`; `kun/src/server/approval-consent.ts:1-92` | **M** — Single-use consent token binds request, expiry and replay checks. Design evidence only under Fleet's license boundary; no code import. |
| [software/multica](https://github.com/multica-ai/multica.git) · `f41fae6b08fb` · Custom Part I + Apache-2.0 Part II | `server/cmd/server/main.go:1-60,308-340`; `server/internal/daemon/reconcile.go:1-129` | **M** — [Three traced flows](#multica): task triggering, cancellation acknowledgement and human environment audit. Custom license conditions apply; default auto-approval and dropped report batches are counter-evidence. |
| [software/omnigent](https://github.com/omnigent-ai/omnigent.git) · `6fdcd17044c2` · Apache-2.0 | `omnigent/__main__.py:1-6`; `omnigent/harness_capabilities.py:1-160` | **M** — Omit permissive override to preserve native harness consent; unresolved ask denies. Python harness and sandbox plumbing are mechanism evidence only. |
| [software/openclaw](https://github.com/openclaw/openclaw.git) · `f7dae76bee98` · MIT | `src/entry.ts:1-75`; `src/infra/exec-approvals-effective.ts:1-125,351-446` | **C** — Effective policy intersects security and ask requirements, retaining provenance. Map into Fleet's existing permission path; do not import the agent runtime. |
| [software/opencode](https://github.com/anomalyco/opencode.git) · `70a24697ea00` · MIT | `packages/opencode/src/index.ts:1-65`; `packages/opencode/src/session/retry.ts:1-209` | **C** — [Three traced flows](#opencode): current core input idempotence, deny precedence and successful-summary projection. Keep legacy CLI evidence separate; pending approvals are not durable. Earlier Retry-After edge case remains uncorrected. |
| [software/OpenHands](https://github.com/OpenHands/OpenHands) · `15e686078812` · MIT | `bin/agent-canvas.mjs:1-105,122-173`; `src/index.ts` | **M** — Current tree is Agent Canvas: distinguish unknown host capability from unsupported and cache by host version. Its lexical prerelease comparison is not complete SemVer, and absent tool lists default available rather than denying permission; older Python-runtime claims do not apply. |
| [software/orca](https://github.com/stablyai/orca.git) · `a91ca8b19e6b` · MIT | `src/main/index.ts:1-60`; `src/shared/usage-percentage-display.ts:1-36` | **C** — [Three traced flows](#orca): runtime-scoped accounts, mutation fencing, durable cursor recovery and file-save receipts. Model options apply next turn; local path checks are not a sandbox. Invalid usage data must not become zero. |
| [software/pi-mono](https://github.com/badlogic/pi-mono) · `c7cdb460aa8a` · MIT | `packages/coding-agent/src/cli.ts:1-6`; `packages/agent/src/harness/compaction/compaction.ts:310-437` | **C** — Compaction cut points avoid orphaned tool results. Preserve the existing provider/SDK seam; do not build a second Session/history store. |
| [software/waku](https://github.com/egoist/waku.git) · `1135692b2909` · GPL-3.0-only | `Cargo.toml:1-45`; `src/main.rs:1-11` | **M** — Driver control distinguishes steering from configuration requiring restart. Rust implementation and unbounded control payload queue are not import candidates. |
| [software/ZCode](https://github.com/zai-org/ZCode.git) · `872ad960de7e` · Apache-2.0 | `apps/zcode-cli/packages/cli/src/main.ts:1-85`; `apps/zcode-cli/packages/adapters/src/plugins/marketplace.ts:1106-1187` | **C** — Staged inventory install/recovery, scoped UI result guards and command reconciliation. [Three traced flows](#zcode) distinguish inventory from activation, acknowledgement from execution, and safe credential recovery from unsafe cipher fallback. No runtime/dependency import. |
| [software/cc-switch](https://github.com/farion1231/cc-switch.git) · `8272707d5e2a` · MIT | `src-tauri/src/main.rs:1-35`; `src/config/piThinkingProfiles.ts:1-175,307-356` | **C** — Reasoning mapping distinguishes absent, null, string and explicit provider defaults. The [quota review](#cockpit-tools-and-cc-switch-acquisition-to-display-review) also inspects native Rust adapters and shared cache publication. Proxy/account rewriting is not admitted; language alone is not an exclusion. |
| [software/cockpit-tools](https://github.com/jlcodes99/cockpit-tools.git) · `dbe56a1edd07` · CC-BY-NC-SA-4.0 in Cargo metadata; no root LICENSE | `src-tauri/Cargo.toml:1-40`; `src-tauri/src/main.rs:1-6` | **M** — Named credential IDs and reference checks before deletion; [quota review](#cockpit-tools-and-cc-switch-acquisition-to-display-review) adds bounded refresh scheduling and display counter-evidence. Restricted license declarations remain; no code import or vendor-account automation. |
| [software/dashi-taskboard](https://github.com/chuspeeism/dashi-taskboard.git) · `1528a8eb3146` · Apache-2.0 | `cli/taskctl.mjs:1-60`; `server/database.mjs:2053-2145,2840-2883` | **M** — Optimistic version check and SQL transaction bind local activity updates. External Jira action precedes the local transaction, so this is not cross-system atomicity; no second Task store. |
| [software/OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) · `796b8fc9086c` · Apache-2.0 | `components/execd/main.go:1-60`; `components/execd/pkg/isolation/isolator.go:1-160` | **X** — Linux bwrap probe/diagnostic vocabulary only. This control plane/runtime does not fill a current Fleet/macOS gap and cannot become a second OS sandbox. |
| [software/spec-kit](https://github.com/github/spec-kit) · `d4229c071c7e` · MIT | `src/specify_cli/__init__.py:1-60,602-617`; `scripts/python/check_prerequisites.py:205-276` | **M** — Read-only requirement-ID coverage and ambiguity checks. Keep existing canonical specs; do not import a multi-document planning or approval engine. |

### Production surfaces and layout

| Checkout / reviewed SHA / license | Source path or symbol read | Reuse boundary |
|---|---|---|
| [software/Cowart](https://github.com/zhongerxin/Cowart.git) · `43fc8882daf2` · MIT app; tldraw dependency separate | `src/canvasSnapshot.js#export function sanitizeCanvasSnapshotForTldraw`; `src/App.jsx#function applyRemoteCanvasSnapshot` | **M** — Snapshot sanitation explains rejected records; local-user and remote changes have different save origins. No native Office round-trip proof; do not import its telemetry or canvas store. |
| [software/genoffice](https://github.com/genspark-ai/genoffice.git) · `84d5b8fb9349` · Apache-2.0 core; ee/ Enterprise excluded | `packages/pptx-ops/src/ops/executor.ts#runTxn`; `packages/xlsx-gateway/src/gateway/xlsx-package-io.ts#saveWorkbookViaSidecar` | **C** — PPTX transaction prevalidation/dry-run/undo and XLSX saves retaining untouched archive entries share real UI/agent callers. Seeded parts escape complete rollback; locked-file fallback is not universally atomic. Rust sidecar is mechanism evidence; no blanket Office-fidelity claim. |
| [software/html-anything](https://github.com/nexu-io/html-anything.git) · `553ed98c283f` · Apache-2.0 | `next/src/lib/export/markdown-roundtrip.ts#export function htmlToMarkdown`; `next/src/lib/history/db.ts#export async function putRun` | **C** — Bounded HTML extraction and IndexedDB version transaction helpers. Conversion is lossy; no native editor or second history authority. Do not copy same-origin script preview or CDN injection. |
| [software/open-design](https://github.com/nexu-io/open-design.git) · `894d55466b4a` · Apache-2.0 inspected code; templates vary | `apps/daemon/src/figma/figma-import.ts#export async function importFigmaFromBytes`; `apps/daemon/src/collab/workspace-resource-mutation.ts#function verifyWorkspaceRequestAuthorityForRequest` | **C** — [Three traced flows](#open-design): HTML edits/version provenance, restore and local authority. Shared storage is not a universal command; parent lineage is not atomic CAS; manual save drops a partial-success warning. No native FIG save claim. |
| [software/openpencil](https://github.com/ZSeven-W/openpencil.git) · `4fbe3a42899f` · MIT inspected Rust; vendor/prebuilt closure missing | `crates/op-figma/src/lib.rs#parse_fig_binary_with_images`; `crates/op-editor-core/src/edit_transaction.rs#rollback_local_edit` | **M** — [Three traced flows](#openpencil): shared EditorState, immutable save/acknowledgement and conflict recovery. Active collaboration rejects AI/MCP writes. Required submodules/prebuilt boundaries prevent drop-in admission. |
| [software/penpot](https://github.com/penpot/penpot) · `56bf0e3ebb1f` · MPL-2.0 | `frontend/src/app/main/data/workspace/undo.cljs#(defn start-undo-transaction`; `common/src/app/common/files/changes.cljc#(defn process-changes` | **M** — Undo transaction attribution and validated change interpreter. Clojure editor/runtime stays separate; source use would need its own license and integration decision. |
| [software/tldraw](https://github.com/tldraw/tldraw) · `2e0a94b508ac` · MIT store leaf; SDK has custom production license | `packages/store/src/lib/Store.ts#mergeRemoteChanges`; `templates/agent/client/agent/managers/AgentUserActionTracker.ts#startRecording` | **C/M** — MIT store has origin-scoped listeners, atomic remote changes and disposal; agent template captures human edit deltas. Leaf license does not cover the editor SDK or its telemetry. |
| [software/OpenChatCut](https://github.com/0xsline/OpenChatCut.git) · `45aa51df304e` · AGPL-3.0 | `src/editor/reducerHistory.ts#export function historyReduce`; `src/editor/storeCommands.ts#batch: (actions:` | **M** — [Three traced flows](#openchatcut): shared operations/drafts, preserved unreadable projects and actual export/delivery recovery. Current saves omit version comparison. AGPL mechanism reference; no direct code admission or second job authority. |
| [software/OpenMontage](https://github.com/calesthio/OpenMontage.git) · `08e2151fa02d` · AGPL-3.0 | `tools/publishers/export_bundle.py#class ExportBundle`; `lib/checkpoint.py#class CheckpointValidationError` | **M** — Offline deliverable manifest and stage-artifact checkpoint validation. Python/AGPL mechanisms only; exporting a bundle does not mean publishing it. |
| [software/opencut](https://github.com/OpenCut-app/OpenCut) · `400f097becba` · MIT | `apps/desktop/src/panels/timeline.rs#impl Render for Timeline`; `apps/desktop/src/shell.rs#pub(crate) fn new` | **X** — Current GPUI Rust timeline renders a placeholder. Stable panel entities are not a working media editor/exporter; inspect opencut-classic for those mechanisms. |
| [software/opencut-classic](https://github.com/opencut-app/opencut-classic) · `cf5e79e91914` · MIT | `apps/web/src/core/managers/commands.ts#CommandManager`; `apps/web/src/services/renderer/scene-exporter.ts#SceneExporter` | **C** — Command/selection-aware undo, track snapshots and frame-time export with cancellation. Integrate into one Fleet editor/job path; no blanket codec/fidelity acceptance. |
| [software/openreel-video](https://github.com/Augani/openreel-video.git) · `5f3c85e5fc22` · MIT source; FFmpeg/package terms separate | `apps/desktop/src/main/sidecar/export-job.ts#ExportJob.writeFrame`; `packages/core/src/playback/master-timeline-clock.ts#MasterTimelineClock` | **C** — Frame-write backpressure, process-error cleanup and AudioContext timeline clock. No new job authority; bundled codecs/binaries require separate validation. |
| [software/palmier-pro](https://github.com/palmier-io/palmier-pro.git) · `b4b1333f9404` · GPL-3.0 source; post-v0.7.6 binaries proprietary | `Sources/PalmierPro/Editor/EditorUndo.swift#func perform<T>`; `Sources/PalmierPro/Editor/RippleEngine.swift#static func computeRippleShiftsForRanges` | **M** — Lazy Swift undo groups and pure ripple range calculation. Mechanisms only; source license does not grant binary redistribution, and platform constraints remain. |
| [plugins/dockview](https://github.com/mathuo/dockview) · `3b519454178f` · MIT core/react; Enterprise commercial | `packages/dockview-core/src/dockview/dockviewComponent.ts#fromJSON`; `packages/dockview-react/src/dockview/dockview.tsx#DockviewReact` | **C** — Validate restored layout before clearing; dispose pending popouts, panels and React subscriptions. Candidate comparison only: DOM popouts do not prove Electron BrowserPane/native-window support. |
| [plugins/react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) · `a2796d7acac1` · MIT | `lib/global/utils/validatePanelGroupLayout.ts#export function validatePanelGroupLayout`; `lib/components/group/Group.tsx#const onLayoutChangeStable` | **C** — Redistribute constrained sizes and distinguish continuous/completed layout callbacks. Current Group/Panel API; resizing alone is not docking or a library selection. |
| [plugins/react-rnd](https://github.com/bokuweb/react-rnd) · `fec7303134ab` · MIT | `src/index.tsx#export class Rnd` | **C** — Controlled drag/resize with scale-aware bounds and stop callbacks. Floating geometry only; docking and keyboard accessibility are not established. |
| [plugins/xyflow](https://github.com/xyflow/xyflow) · `0a1f9575b256` · MIT | `packages/react/src/utils/changes.ts#function applyChanges`; `packages/react/src/container/NodeRenderer/useResizeObserver.ts#export function useResizeObserver` | **C** — Immutable ID-keyed node/edge change application and resize-observer cleanup. Graph view only, not a production-media engine or workflow executor. |
| [plugins/hyperframes](https://github.com/heygen-com/hyperframes.git) · `952e9228b5cd` · Apache-2.0 | `packages/producer/src/services/render/artifactTransaction.ts#ArtifactTransaction`; `packages/player/src/direct-timeline-clock.ts#DirectTimelineClock` | **C** — Stage, validate, back up and commit/rollback render artifacts; cancel timeline rAF cleanly. Preserve 35 existing fixture modifications; Puppeteer/FFmpeg resources and telemetry are not admitted. |
| [plugins/markitdown](https://github.com/microsoft/markitdown) · `945314a45ddb` · MIT | `packages/markitdown/src/markitdown/_markitdown.py#def _convert(`; `packages/markitdown/pyproject.toml#[project.optional-dependencies]` | **M** — Converter dispatch restores stream position and classifies unsupported/failed conversion. Python ingestion reference only; no editable Office fidelity or automatic optional-provider installation. |

### Browser, context and engineering utilities

| Checkout / reviewed SHA / license | Source path or symbol read | Reuse boundary |
|---|---|---|
| [software/browser-harness](https://github.com/browser-use/browser-harness.git) · `afbcc381b963` · MIT | `src/browser_harness/_ipc.py:connect/request/serve/cleanup_endpoint`; `src/browser_harness/daemon.py:get_ws_url/handle` | **M** — Private local IPC, authenticated Windows loopback and explicit permission-blocked browser discovery. Python mechanism only; CDP execution and platform lifecycle remain partly unread. |
| [software/browser-use](https://github.com/browser-use/browser-use) · `d8110c5ff87c` · MIT | `browser_use/browser/watchdogs/security_watchdog.py:SecurityWatchdog/on_NavigateToUrlEvent/on_NavigationCompleteEvent/on_TabCreatedEvent/_is_ip_address/_is_url_allowed` | **M** — Normalize URL/IP policy and handle redirect-created tabs. Python browser guard is not a network sandbox or complete navigation proof. |
| [software/flowgram.ai](https://github.com/bytedance/flowgram.ai) · `ba1a9630f802` · MIT | `packages/common/history/src/history/history-manager.ts:HistoryManager/registerHistoryService/_handleMerge/dispose`; `packages/client/fixed-layout-editor/__tests__/services/history-operation-service/transact.test.ts` | **M** — Group editor undo and dispose document-scoped history. Container-coupled models are not small extractable types; no workflow executor admission. |
| [software/mcp-registry](https://github.com/modelcontextprotocol/registry) · `d1dcaf3fb363` · MIT/Apache-2.0 transition; docs CC-BY-4.0 | `internal/api/handlers/v0/publish.go:RegisterPublishEndpoint`; `internal/service/registry_service.go:CreateServer/createServerInTransaction/recalculateLatest` | **M** — Authenticated publisher namespace and per-name transactional version update. Go registry evidence only; no requirement for a Fleet-hosted registry. |
| [plugins/GPTCache](https://github.com/zilliztech/GPTCache.git) · `c59fb3a6152a` · MIT | `gptcache/adapter/adapter.py:adapt`; `gptcache/core.py` | **M** — Measure semantic cache-hit thresholds. Similarity does not prove permission, freshness or safety for effectful turns; no transparent agent-turn cache. |
| [plugins/LLMLingua](https://github.com/microsoft/LLMLingua.git) · `5a4c78ae18ab` · MIT | `llmlingua/prompt_compressor.py:PromptCompressor/compress_prompt_llmlingua2/get_token_length` | **M** — Evaluate lossy compression with protected spans and retained originals. Python/model runtime is not a default dependency; hardcoded cost estimates and semantic equivalence are unverified. |
| [plugins/SuperClaude_Framework](https://github.com/SuperClaude-Org/SuperClaude_Framework.git) · `2d0fda08f2ee` · MIT | `src/superclaude/execution/self_correction.py:SelfCorrectionEngine/detect_failure/analyze_root_cause/_categorize_failure/FailureEntry.from_dict` | **M** — Explicit failure evidence and regression heuristics. Python framework does not become Fleet execution or memory authority. |
| [plugins/agentmemory](https://github.com/jayzeng/agentmemory.git) · `b7029ee2141d` · MIT | `src/core.ts:redactSecrets/filterMemoryForContext/formatStoredEntry`; `src/mcp-server.ts:memoryContextTool` | **M** — Trust/lifecycle/expiry filtering at entry boundaries and shared CLI/MCP core. Regex redaction is partial and read-modify-write atomicity is unproven; no imported curated truth. |
| [plugins/agentskills](https://github.com/agentskills/agentskills) · `69ef37e9424c` · Apache-2.0 code; CC-BY-4.0 docs | `skills-ref/src/skills_ref/parser.py:find_skill_md/parse_frontmatter/read_properties`; `skills-ref/src/skills_ref/validator.py:ALLOWED_FIELDS/_validate_name/_validate_metadata_fields/validate_metadata` | **M** — Python frontmatter/name validation and fixtures inform Fleet's existing parser. Strict field allowlist must preserve accepted vendor fields; allowed tools never grant permission. |
| [plugins/caveman](https://github.com/JuliusBrussee/caveman.git) · `ae26f3a47755` · MIT adoption surface; BSL engine | `src/mcp-servers/caveman-shrink/compress.js:withProtectedSegments/PROTECTED_PATTERNS`; `LICENSING.md:per-directory scope` | **M** — Protected-span corruption regressions and evaluation design. Do not mistake adoption-layer MIT for compressor-engine permission. |
| [plugins/claude-mem](https://github.com/thedotmack/claude-mem.git) · `4e98d977cc6d` · Apache-2.0 current checkout | `src/services/worker/SessionMessageBuffer.ts:SessionMessageBuffer/enqueue/confirm/resetClaimed/clear`; `src/services/worker/SessionManager.ts:getMessageIterator/confirmClaimedMessages` | **M** — Per-session claim/confirm/reset working buffer. Current buffer is RAM, not the former SQLite/BullMQ queue; transcript replay is not verified, and missing privacy rows must not grant ingestion. |
| [plugins/claude-task-master](https://github.com/eyaltoledano/claude-task-master.git) · `c0c98d367c55` · MIT + Commons Clause | `packages/tm-core/src/modules/storage/adapters/file-storage/file-operations.ts:FileOperations/writeJson/modifyJson`; `scripts/modules/dependency-manager.js:addDependency/isCircularDependency` | **M** — Read-modify-write lock, atomic file replacement and cycle checks. Not plain MIT; no second task database or imported workflow authority. |
| [plugins/claude-token-efficient](https://github.com/drona23/claude-token-efficient.git) · `0d30a6db75af` · MIT | `benchmark/run.py:_invoke/run_one`; `benchmark/eval.py:markers/judge` | **M** — Controlled baseline/treatment prompt measurement. Benchmark scripts are not a runtime optimizer; no login, paid judge or benchmark was executed. |
| [plugins/claw-compactor](https://github.com/open-compress/claw-compactor.git) · `c1b936d40b11` · MIT | `scripts/lib/rewind/store.py:RewindStore/store/retrieve/search`; `scripts/lib/rewind/retriever.py:rewind_tool_def/handle_rewind` | **M** — Hash-indexed original retrieval with bounded LRU and monotonic expiry. Python RAM helper is not durable memory; Fleet must supply scope and permission boundaries. |
| [plugins/context7](https://github.com/upstash/context7.git) · `eb27b949fbc9` · MIT | `packages/sdk/src/client.ts:Context7/searchLibrary/getContext`; `packages/sdk/src/http/index.ts:HttpClient/fetchWithRetry/headersForToken` | **C** — Abort-aware GET retry, rate-limit metadata and typed failures. Compare existing Source HTTP client; service SDK is not an offline documentation backend. |
| [plugins/letta](https://github.com/letta-ai/letta.git) · `5bcdd177d70f` · Apache-2.0 metadata; runtime absent | `README.md` | **X** — Current HEAD has 12 documentation/policy/workflow files and points to letta-code. No current runtime mechanism was available to review; old runtime conclusions cannot be reused at this SHA. |
| [plugins/mem0](https://github.com/mem0ai/mem0) · `a39a802bbc93` · Apache-2.0 | `mem0/memory/main.py:_build_filters_and_metadata/Memory.add/_add_to_vector_store/_create_memory/_update_memory`; `mem0/memory/storage.py:add_history` | **M** — Scope-key anti-smuggling and immutable identity metadata. Vector mutation then SQLite history is not one atomic transaction; Python memory writer is not imported. |
| [plugins/planning-with-files](https://github.com/lincolnwan/Planning-with-files-copilot-agent.git) · `2bcc24bcc836` · README claims MIT; no LICENSE file | `copilot/.github/agents/planning-with-files.agent.md` | **X** — Current tree contains eight Markdown files. Durable evidence is a useful principle, but no executable mechanism; three-file planning and phase approval conflict with this repository's document contract. |
| [plugins/playwright-mcp](https://github.com/microsoft/playwright-mcp) · `f1257a5a67af` · Apache-2.0 | `index.js:createConnection export`; `cli.js:tools.decorateMCPCommand/libCli.decorateProgram` | **M** — Thin MCP wrapper and browser capability fixtures. Actual runtime is delegated to pinned playwright-core and was not inspected here; test-only unsafe tools are not permission grants. |
| [plugins/repomix](https://github.com/yamadashy/repomix) · `5edcc6dec613` · MIT | `src/cli/prompts/remoteConfigTrustStore.ts:sha256/isDirSafe/isStoreDirSafe/isRemoteConfigTrusted/markRemoteConfigTrusted` | **C** — Content-bound local consent cache and hostile temporary-directory checks. Digest omits sibling imports/processors; not a complete dependency trust or permission engine. |

### Selection against actual gaps

Owner clarification, 2026-09-21: absorb a reference only where it does the job better, in frontend
and backend work alike. A source review does not create a need or require an extraction. Compare the
same task against current Fleet/Craft, a small local correction and the owning software's existing
API/editor. Frontend evidence covers the real interaction, error/recovery states and native artifacts;
backend evidence covers actual admission, persistence, concurrency, cancellation and recovery.
Performance/resource claims need measurement, not code size or a demo. Include dependencies,
maintenance and migration cost. A win in one layer never admits the other layer automatically.

| Current need / inspected Fleet path | Comparison outcome | Execution anchor |
|---|---|---|
| Corrupt/unreadable credentials: `app/packages/shared/src/credentials/backends/secure-storage.ts:199` treats read failure as absence and deletes corrupt files | ZCode's preserve-and-report behavior is better on this specific failure. Correct the existing store; importing its credential system or cipher adds no demonstrated benefit. | Existing R0-C2 preservation criterion |
| Reconnect: `app/packages/server-core/src/transport/server.ts:476` replays retained sequence events; renderer `app/apps/electron/src/renderer/App.tsx:1093` refreshes after stale reconnect | Keep this existing path. Orca/OpenCode do not justify a new event store. Stable input identity after a lost acknowledgement is a separate, unverified gap requiring a same-task reproduction before changing admission. | R0 retained Session review |
| Cancel: renderer `app/apps/electron/src/renderer/event-processor/handlers/session.ts:339` clears busy state on interruption; backend termination has separate cleanup | Compare request, acknowledgement and actual termination against Orca. A narrow mismatch is worth verifying; there is no justification for another cancellation system or transplanted chat UI. | R0 retained Session review |
| Component/layout and domain editing | Source traces identify alternatives, not winners. Prove the concrete host/editor task and inspect native software facilities before selecting dependencies; the online comparison below does not authorize a replacement shell or editor. | Existing R18/domain contracts after baseline exit |

These are decisions about the scope of comparison, not another roadmap. Use
[`TODO.md`](../TODO.md#slice-procedure) for execution order. Keeping the current implementation, making a
smaller local fix, or declining an unnecessary wrapper are successful comparison outcomes. No new
runtime or editor dependency has passed a frontend/backend integration comparison in this review.

### Browser and interface development comparison

Checked 2026-09-21 against the current app, both Craft pins and the immutable sources below.
Local references were not changed. Online-only sources were read at fixed commits in temporary
storage, not added to the retained checkout set or installed. These are bounded source reviews,
not end-to-end product trials or dependency admissions. [SYS-04](modules/browser.md)
owns the recommended behavior and acceptance; the seven-field promotion gate still applies.

| Candidate / source lock / license | Inspected mechanism and counter-evidence | Recommendation against Fleet's current path |
|---|---|---|
| Craft v0.13.4 `b2d6c8aabdfdc96416eea9debd6756ae6d3c0db9`; Apache-2.0; retained `software/craft-agents-oss` | `apps/electron/src/main/{browser-pane-manager,browser-cdp}.ts`, renderer `BrowserToolbar`/`BrowserEmptyStateCard`, `packages/shared/src/agent/browser-tools.ts`; look pin v0.10.5 compared separately. Current app has native auxiliary windows and CDP actions, not integrated tabs, durable history or immediate user takeover. | **REUSE/EXTEND.** Keep the one manager. Installed Electron **39.2.7** types and [native API](https://www.electronjs.org/docs/latest/api/web-contents#contentsenabledeviceemulationparameters) already supply capture/inspection/device emulation. Native correction is the first alternative to a new runtime. |
| Cindy `00a5ad1a503c1082a5c86d296a6e67c3344aa575`; Apache-2.0; retained `software/cindy` | `apps/desktop/src/renderer/features/right-sidebar/lib/browserWebviewPool.ts:evictLRU`; `apps/desktop/src/main/rsb-browser-bridge/{registry,ipc}.ts`; `apps/desktop/src/preload/browserCommentPreload.ts:prepareScreenshot/commitPending/cancelPending`; `apps/desktop/src/main/mcp-integrations/browser-backend/rsb-webview-upload-policy.ts:resolveUploadFiles`. Early failure listeners, stale-release guards, pending annotation acknowledgements and realpath upload confinement. Pool capacity still wins over busy pins when all entries are pinned. | Primary lifecycle/annotation mechanism candidate. Adapt invariants to Craft's native views; do not replace them with a DOM webview pool. Upload path checks supplement, never replace, effect authorization; a filename denylist is not complete secret detection. |
| OpenChamber `896776d81e13c061b724be98c32b2df17e030806`; MIT; retained `software/openchamber` | `packages/ui/src/components/browser/BrowserPane.tsx`; `packages/ui/src/lib/browser/{viewport,history,annotationSession,controlClient}.ts`; `packages/ui/src/stores/useBrowserHistoryStore.ts`; `packages/ui/src/components/browser/useAnnotationAttach.ts`; `packages/web/server/lib/browser-control/{broker,provider}.js`. Real CSS viewport plus display scale, capture-to-draft flow and claim-before-execute. History is 50 deduplicated addresses per project/runtime, not visits or downloads. Broker abort settles the server request; the client `run` has no abort signal. Provider user-control lease is on the extension-provider path. | Primary browser UX/hand-off candidate. Keep a smaller local manager correction for single-client execution; do not transplant its SSE broker. Validate navigation/Session races and human takeover separately. Its viewport does not by itself emulate touch/UA/DPR. |
| [Min](https://github.com/minbrowser/min/tree/c92079cde045c38ab844e53501e9c5178d503a45) · Apache-2.0 (`LICENSE.txt`); online only | `js/places/{places,placesService,fullTextSearch}.js` indexes visited URLs/titles and optional text, excludes private pages and supports deletion; `main/download.js` + `js/downloadManager.js` keep live download maps and remove completed items. | Conditional history/search comparison if recent-address suggestions are insufficient. Its download bar does not solve persistent download history. Do not copy its full-text retention, tab/task system, header-rewriting exceptions or browser shell. |
| [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp/tree/d5b4daf511731bacd5e1d1c45254e7fced2c9a34) · Apache-2.0 (`LICENSE`); online only | `src/tools/emulation.ts:emulate`, `src/tools/pages.ts`, `tests/tools/emulation.test.ts`; viewport dimensions/DPR/mobile/touch/UA are distinct tool inputs. | Compare parameter/reset semantics, then implement through existing Electron/CDP. Adding an MCP process solely for emulation has no established benefit. |
| [agent-browser](https://github.com/vercel-labs/agent-browser/tree/b0f3962a131292805fe7c4e276e4bf7a50a4e876) · Apache-2.0 (`LICENSE`); online only | Current runtime is Rust: `cli/src/native/{actions,policy,tab_binding,browser}.rs`. Strict pinned-target recovery and sanitized persisted URLs avoid adopting another tab. `ActionPolicy::load_if_exists` discards load errors; the action path ignores reload errors. An empty allow-list plus default deny does not establish unconditional denial in the inspected checker. | Take target/freshness test ideas into Craft; **do not adopt its policy as Fleet's enforcement boundary**. Current source, not older Node/Playwright descriptions, controls this assessment. No daemon dependency is selected. |
| Browser Use `d8110c5ff87ccba887aaa726cdb780f2f84bef8d` (MIT), Browser Harness `afbcc381b963040c19627d788e40c7e7663171ee` (MIT), Playwright MCP `f1257a5a67aff872f947fae274759f7d54853862` (Apache-2.0); retained | Browser Use `browser_use/browser/watchdogs/security_watchdog.py` checks explicit navigation before dispatch but redirected/new-tab targets after events. Harness `src/browser_harness/{_ipc,daemon}.py` separates local IPC from CDP. Playwright MCP `index.js`/`cli.js` delegate to playwright-core `1.64.0-alpha-1789764292000`; that runtime was not audited. | Optional executor/failure-fixture references. None supplies the missing Fleet human annotation/history/control-ownership surface, and none justifies replacing the working native browser. |
| [BrowserOS](https://github.com/browseros-ai/BrowserOS/tree/510126b9d381a9032d76798ffdc24b999893daa9) · AGPL-3.0 (`LICENSE`); online only | `packages/browseros-agent/packages/browser-mcp/src/tools/history.ts` calls `History.getRecent`; `packages/browseros/chromium_patches/chrome/browser/devtools/protocol/history_handler.cc` implements the added Chromium domain. | Whole-fork route not selected. Its history tool requires its modified browser, not vanilla Electron/CDP. License/distribution and Chromium maintenance are separate admission questions. |
| [Nanobrowser](https://github.com/nanobrowser/nanobrowser/tree/24a14b76e14a9c30fd84878ca7985049d1e7d064) · Apache-2.0 (`LICENSE`); online only | `chrome-extension/src/background/agent/executor.ts` owns planner/navigator loops and checks pause around awaited navigation. That file alone does not prove cancellation inside a dispatched action; it also invokes analytics. | Extension-agent behavior comparison only. A second planner/runtime/history/telemetry stack does not close Fleet's existing manager gaps. |
| [React Grab](https://github.com/aidenybai/react-grab/tree/ea4bbec9e80f4802e8ae19ad18431edb9ddbb670) · MIT (`LICENSE`); online only | `packages/react-grab/src/core/context.ts` uses Bippy source/owner stacks, bounded source fetching, Fiber revision checks and list-item identity; `utils/create-component-name-for-element.ts` discards stale async resolution. | Source-location candidate for permitted development renderers. Compare a small build-time source hint before importing its Solid overlay/Bippy dependencies. Missing instrumentation/maps or a changed React version remains an explicit limitation. |
| [Agentation](https://github.com/benjitaylor/agentation/tree/687e0a73c02318610bffa650f97191d5b86614c8) · **PolyForm Shield**, root and package `LICENSE`; online only | `package/src/utils/{source-location,element-identification}.ts` identifies elements and attempts development Fiber source lookup. The checked license restricts competing uses. | Product-behavior comparison only; do not describe it as an unrestricted open-source dependency or import its code without resolving the distribution boundary. Cindy/OpenChamber plus a small native annotation adapter are the closer permissive alternatives. |

### Codex, Claude and Cursor product evidence

Official pages checked 2026-09-21. They describe supported behavior, not publicly inspectable
desktop internals; neither CLI source nor a published tool interface proves the closed UI's backend.

| Product | Relevant observed documentation | Fleet recommendation |
|---|---|---|
| [Codex browser](https://learn.chatgpt.com/docs/browser) | Shared preview, element/area comments, reversible style feedback, separate browser profile/history, site permissions and separately gated developer access. | Use comment → draft → source change → visual review as the annotation loop. Preserve target/profile identity; full CDP access is not an ordinary site grant. |
| [Codex Computer Use](https://learn.chatgpt.com/docs/computer-use) | An optional plugin; OS capture/accessibility permissions are distinct from per-app approval. macOS supports scoped background work; Windows uses foreground input. | Separate app target and control mode from browser tools, and retain user takeover. Its lock-screen and closed helper implementation are not proposed Fleet dependencies. |
| [Claude Desktop](https://code.claude.com/docs/en/desktop) and [Cowork Computer Use](https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork) | Development preview/element targeting/verification, per-Session context versus shared plan usage; app-specific consent and preference for faster structured integrations. Cowork documents background windows on supported macOS and distinguishes full-screen control. | Reuse an existing integration before GUI input; show target/control state and different quota scopes. No claim that Claude's private helper can be embedded or is open source. |
| [Cursor Design Mode](https://cursor.com/docs/agent/design-mode) | Multi-element selection combines DOM/component/style information with a frozen viewport image; feedback leads to code edits and hot reload. | Combine semantic identity with visual evidence, retaining one current task. Do not copy its parallel-agent behavior, assume production source maps, or infer general desktop control from this web-specific feature. |

### Local-app control comparison

**Later phone-connector scope (owner, 2026-09-22).** Desktop Fleet targets Windows/macOS/Linux;
a later Orca-like phone connector extends R14/EXEC-09. Bounded current Orca observation at
`5064469687b59ca5203276ee52db6ce38cac877a`: `src/preload/api/mobile-api.ts` declares pairing QR/URL,
device/runtime-grant revocation, direct endpoint and relay state;
`docs/reference/remote-wire-compatibility.md` documents capability negotiation and both directions
of host/client version skew. These paths justify the next pairing/revocation/protocol comparison,
not a completed implementation or network-security audit. The relay path means Orca is not evidence
that arbitrary networks work through infrastructure-free direct connection. Mobile framework,
push and transport admission remain unresolved under SYS-02; no external checkout was changed.

These answer the owner's specified-local-app development/office task. The proposed Component and
scope gate live in [SYS-02](modules/remote.md#local-app-computer-use-contract).
No helper was installed/launched and no user's app was controlled for this review.

| Candidate / lock / license | Source evidence | Selection limit |
|---|---|---|
| Orca `a91ca8b19e6b48b88f49c9bcf7e5941aedd2a1df`; MIT; retained `software/orca` | `src/main/computer/{computer-provider-lifecycle,desktop-script-request-queue,macos-native-provider-socket}.ts`; `native/computer-use-macos/Sources/OrcaComputerUseMacOSCore/{AgentSessionOwnership,KeyboardInputSafety,ComputerSnapshotCachePolicy}.swift`; adjacent queue/lifecycle/ownership tests. Native helper lifetime, authenticated connection ownership, bounded queue and focus checks. | Closest Electron/native-provider integration candidate. Queue expiry prevents later dispatch; it does not prove cancellation of an in-flight native effect. Two-minute cache retention is not proof that a target is still fresh. No wholesale port or cross-platform background guarantee. |
| [Peekaboo](https://github.com/openclaw/Peekaboo/tree/94c00517565aa9a9fffb113cc67651a266630b9b) · MIT (`LICENSE`); online only; steipete URL redirects to openclaw | `Core/PeekabooAutomationKit/Sources/PeekabooAutomationKit/Services/Observation/ObservationTargetResolver+WindowSelection.swift`; `Apps/CLI/Sources/PeekabooCLI/Commands/Shared/SnapshotMutationCoordinator.swift` and `Apps/CLI/Tests/CLIAutomationTests/SnapshotMutationCoordinatorTargetTests.swift`. Exact window/process-start identity, ambiguous-target refusal and mutation receipts preserving uncertain delivery. | Stronger bounded target/freshness/retry comparison. Missing snapshot ID bypasses that coordinator's lease, so Fleet's adapter must require observation for observed-element actions. External CLI reuse versus leaf extraction still needs signing/startup/size and same-app tests; do not import its agent runtime. |
| [UI-TARS Desktop](https://github.com/bytedance/UI-TARS-desktop/tree/c2ad42e3eb9b27830db41a3e6f51ca7179d9b168) · Apache-2.0 (`LICENSE`); online only | `multimodal/gui-agent/shared/src/base/operator.ts`, `agent-sdk/src/GUIAgent.ts`, `apps/ui-tars/src/main/agent/operator.ts`: screenshot/action operator abstraction and coordinate normalization; desktop operator uses native input/clipboard. | Useful executor interface comparison. Its inspected operator signature has no explicit cancellation signal; surrounding agent pause does not prove input interruption. Adding its GUI agent loop would duplicate Fleet's runtime. Native input dependency licenses/binaries require separate review. |
| [Cua](https://github.com/trycua/cua/tree/9bbfa7dd3e27ca7f1861ede70aaca390174493f9) · root MIT (`LICENSE.md`); online only | `libs/python/computer/computer/{computer.py,interface/base.py}` separates computer interface and VM providers, with an explicit host-server option; tracing/telemetry wrappers are also present. Review limited to this Python path, not the entire Rust driver/VM stack. | A VM-oriented alternative if isolation later becomes a requirement. Not a prerequisite for specified local apps; no VM service, cloud account or telemetry admission. Subpackage/binary licenses remain unreviewed. |

### Subscription allowance comparison

[SYS-03](modules/context.md#subscription-allowance-acquisition-and-display)
owns the data/display recommendation. No accounts were queried and no private tokens/caches were
read; this is interface/source evidence, not a successful authenticated Fleet integration.

| Source / lock | Mechanism checked | Recommended use / counter-evidence |
|---|---|---|
| Current app + locked Claude Agent SDK **0.3.258** | `app/package.json`, `app/bun.lock`, installed SDK `sdk.d.ts:Query/SDKRateLimitEvent/SDKControlGetUsageResponse` and `sdk.mjs` query body; `app/packages/shared/src/agent/backend/claude/event-adapter.ts:adapt` | **Native path first.** The SDK has events and an explicitly experimental structured usage query; Fleet currently does not adapt the event. Prefer this seam to a new OAuth scraper/PTY. Query support is version-gated and may disappear; no promise of complete idle-account data. |
| Codex retained `software/codex` at `ebc05da3bdb76f25861e7cb418bd06d28cadc609`; Apache-2.0, plus [official app-server protocol](https://learn.chatgpt.com/docs/app-server) | `codex-rs/app-server-protocol/src/protocol/v2/account.rs`; `codex-rs/app-server/tests/suite/v2/rate_limits_identity_tests.rs:identity_is_rechecked_after_backend_response`. Per-limit buckets, optional values, account identity and revalidation after response. | Prefer the owning runtime's read/notification interface. User/workspace switch invalidates publication; token refresh for the same identity need not. Do not hardcode two windows or replace missing fields with zero. |
| Orca `a91ca8b19e6b48b88f49c9bcf7e5941aedd2a1df`; MIT; retained | `src/main/rate-limits/{codex-rpc-rate-limit-probe,codex-rate-limit-window-mapper,claude-usage-refresh-plan,claude-oauth-usage-request}.ts`; `src/shared/usage-percentage-display.ts` | Useful timeout/cleanup, nullable parsing, source classification and consistent rounding. Its Codex probe reads the legacy bucket and its display helper maps nonfinite input to zero; do not copy those limits. Direct Claude OAuth usage calls/impersonated CLI user-agent are not Fleet's recommended acquisition path. |
| [CodexBar](https://github.com/steipete/CodexBar/tree/ab22bbb443372c40c72d51350fe879ba5c7cf861) · MIT (`LICENSE`); online only | `Sources/CodexBarCore/UsageFetcher.swift`, `Providers/Codex/{CodexProviderDescriptor,CodexRateWindowNormalizer}.swift`, `Providers/Claude/ClaudeProviderDescriptor.swift`; `Sources/CodexBar/{LastKnownUsagePresentation,UsageStore+AccountRefreshPolicy}.swift` | Good source/identity/freshness and account-scope comparison; rejects some CLI fallbacks that cannot carry the selected workspace. Do not port all credential discovery or Swift UI. Its Codex visible-window projection can force short-window usage to 100 when weekly is exhausted; Fleet should show the blocking condition separately from reported percentages. |
| [Cursor usage](https://cursor.com/help/models-and-usage/usage-limits) and [Admin API](https://cursor.com/docs/account/teams/admin-api) | Dashboard reports plan pools, remaining allowance and overage; API is organization/admin scoped. | Show provider-native units and account scope. This review did not establish a supported personal-quota endpoint; an official dashboard link is the honest fallback. No private cookie/database scrape or automatic paid-overage activation. |

#### Cockpit Tools and cc-switch acquisition-to-display review

Owner-requested follow-up, checked 2026-09-21. Both already have clean source clones under
`software/`. In this pre-refresh quota review, Cockpit Tools was at `dbe56a1edd07ac9d794c72ea4e6a12d5a3d4eb16`, matching upstream
HEAD at that check. The retained cc-switch was `8272707d5e2a9be0cd487ff2d3658f0c58121548`; a separate
shallow clone at `/tmp/fleet-quota-source.1Lt3cK/cc-switch` obtained upstream
[`37d0476097754636493ce836faf1a60f2121e340`](https://github.com/farion1231/cc-switch/tree/37d0476097754636493ce836faf1a60f2121e340).
The eleven acquisition/cache/view files inspected below are byte-identical between those two
cc-switch revisions. Existing references were not moved or re-pinned; temporary storage is not a
new retained reference. cc-switch has a root MIT `LICENSE`; Cockpit Tools declares CC-BY-NC-SA-4.0
in `src-tauri/Cargo.toml:6` and `README.md:472`, with no root LICENSE. The latter is restricted source
evidence, not an unrestricted code dependency. No production import or account query was made.

| Mechanism / exact source | Finding | Fleet consequence |
|---|---|---|
| Cockpit Tools `src-tauri/src/modules/codex_quota_refresh_scheduler.rs:115,200,302` and adjacent `_tests.rs` | Per-account request joining, bounded waiters/queues, separate manual/background lanes, generation checks, deadline/panic cleanup. Manual requests promote queued work; cancelling queued background work explicitly leaves already-running work alone. | Useful scheduler behavior to specify independently. Extend identity to connection/runtime/account/workspace/config revision; queue generations alone do not establish account-identity validation after a network response. Native input, token rotation and file writes are not undone by timing out a future. |
| Cockpit Tools `src-tauri/src/modules/codex_quota.rs:173,1003`; `src/types/codex.ts:1400,1426,1482`; `src/components/codex/CodexQuotaMiniRows.tsx` | Backend rejects an existing window's missing/out-of-range percentage and records window-presence flags. Frontend nevertheless maps nonfinite values to zero, overwrites the short-window remainder when weekly remainder is zero, and falls back to one primary row when both presence flags are false. Absent backend windows carry placeholder 100 values. Additional model windows and credit data are also available in `raw_data`. | Keep validation, actual window presence, model attribution and compact/detail separation. Reject synthetic readings: `(short=75, weekly=0)` must keep 75 with a separate block reason; two absent windows must not become a 100% bar. A meter and an ability-to-run decision are different projections. |
| Cockpit Tools `src-tauri/src/modules/cursor_account.rs:1187,1423,1642,1788`; `claude_account_desktop_auth.rs:3426,3463` | Cursor's path imports local client credentials and constructs a session Cookie for `/api/usage-summary`; Claude uses direct OAuth usage calls. Cursor preserves `usage_updated_at` on query failure while recording a separate error time; the inspected Claude OAuth branch updates `usage_updated_at` even on failure. | Technical acquisition exists, but this is not evidence of a supported public personal-quota API. Do not import client databases/cookies or independently rotate runtime tokens. Separate sample/attempt/error times consistently; the Cursor timestamp behavior is the better comparison here. |
| cc-switch `src-tauri/src/services/subscription.rs:116,354,411,714,748`; `services/balance.rs:26,287` | Native subscription and balance adapters exist alongside scripts. Subscription acquisition reads CLI credentials or managed OAuth and calls service endpoints. Codex deserialization keeps only `rate_limit`; Claude parsing preserves new top-level windows. Balance dispatch uses URL substring matching; some missing numeric values become zero. | Correct the earlier blanket description of this Rust tree as only a proxy or scraper. Typed native adapters are candidates; Fleet's installed SDK/runtime remains the first acquisition seam. Preserve all supported buckets, parse exact origins, validate missing values and check endpoint credential scope. |
| cc-switch `src/lib/query/{subscription,queries}.ts:useQuotaKeepLastGood/resolveDisplayUsage`; `src-tauri/src/{commands/subscription,services/usage_cache}.rs`; `src/hooks/useUsageCacheBridge.ts` | Shared cache events synchronize tray and React Query; transient failure can retain success for ten minutes, authentication/schema failure invalidates it. Managed OAuth keys carry account IDs, but CLI subscription keys/events/cache carry only app type; a null managed ID uses `default`. Failure classification partly matches error strings. | Good bounded last-good/publication comparison, not a complete Fleet identity contract. Use resolved account/config revision and typed errors; keep true sample age across cache publication. Verify expiry when polling is disabled, rather than assuming a child relative-time timer reevaluates the parent hook. |
| cc-switch `src/components/SubscriptionQuotaFooter.tsx:128,216,249`; `tests/components/SubscriptionQuotaFooter.test.tsx`; `tests/lib/keepLastGoodUsage.test.ts` | Shared compact/detail view includes age and manual refresh, but silently hides credential parse errors, filters unknown tier names out of both views, and hides Sonnet in compact mode. Current tests cover known Fable windows and last-good transitions. | Reuse the information hierarchy through Craft primitives; expose errors, render valid new buckets with fallback labels, and show model-applicable constraints. Existing tests do not prove future-bucket completeness or live account isolation. |
| cc-switch `src-tauri/src/usage_script.rs:40,247,502`; `services/provider/usage.rs:13` | QuickJS has CPU/memory/stack limits; HTTP is performed by Rust after request extraction, then an extractor reads the response. Custom mode relaxes HTTPS/origin checks and methods are configurable. This is more than a page scraper, but execution bounds are not destination/credential authorization. | Compare typed provider adapters first. Do not add this generic executor to Fleet merely to read allowance. Custom integration belongs under existing Source and permission contracts, with a declared destination and effect. |

Same-task alternatives: OpenChamber `896776d81e13c061b724be98c32b2df17e030806` (MIT),
`packages/ui/src/stores/useQuotaStore.ts:fetchProviderQuota/resetForRuntimeSwitch`, its
`useQuotaStore.refresh.test.ts`, and `types/quota.ts` provide explicit runtime-generation rejection,
request joining, nullable dynamic windows, per-provider errors and retained sample timestamps.
That is a closer frontend lifecycle comparison than copying a complete account manager. It remains
evidence, not a new OpenChamber product authority; its Cursor adapter also uses private client state
and service APIs. Orca's runtime protocol adapter and CodexBar's source/last-known presentation remain
the narrower alternatives above; their invalid-number and synthetic-window limitations still apply.

Endpoint scope was checked against primary documentation: [OpenRouter account credits](https://openrouter.ai/docs/api/api-reference/credits/get-remaining-credits)
requires a management key; [current-key information](https://openrouter.ai/docs/api/api-reference/api-keys/get-current-key)
has its own usage/limit/remaining fields. A valid inference key is not proof of account-credit access.
Fleet should show the available key budget and report missing account scope, rather than label a
403 as an empty balance or require broader credentials just to draw a meter.

Current Craft `app/packages/shared/src/agent/core/usage-tracker.ts` measures Session tokens/context,
not account allowance. Recommended correction is therefore a typed read adapter plus identity-bound
snapshot/scheduler projection over the existing connection owner. No second ledger, proxy, account
store or billing-script runtime is justified. The behavior and additional failure cases are in
[SYS-03](modules/context.md#subscription-allowance-acquisition-and-display).
These remain candidates: authenticated integration, renderer verification, Rust scheduler execution
and distribution admission were not established by this source review.

Historical provider-specific evidence retained from the superseded quota note (2026-07-29):

| Source lock / exact path | Unique mechanism or limitation retained |
|---|---|
| Cockpit Tools `923cc6c45b8dbfe743ea2e04be33d2fe4fbf5654`, `src-tauri/src/modules/grok_account.rs` | `pick_best_live_credential` and per-account/process refresh locks compare same-account rotating credentials before retry. `query_quota` composes CLI billing/user and Grok subscription/task responses; `refresh_account_inner` bounds unauthorized recovery to one forced refresh, transport retries to three and concurrent account refreshes to three. This is historical recovery evidence, not permission to read foreign auth files or a claim about today's implementation. |
| cc-switch `30409878bdbdf1c7091c559d6afc367a052da39c`, `src-tauri/src/services/subscription.rs` | Gemini queries internal Cloud Code Assist `loadCodeAssist` / `retrieveUserQuota`, groups buckets using the lowest remaining fraction, and appeared to keep refreshed tokens query-local. Repeated refresh and loss of per-model windows need explicit checks before reuse. |
| Same cc-switch source lock and path | Grok `GetGrokCreditsConfig` uses a schema-free gRPC-web field scan and infers weekly/monthly labels from reset distance. This cannot establish exact quota, native window names or a stable public contract. |

These observations retain their original commits; they were not revalidated by the current
Claude/Codex/Cursor quota review. Prefer the selected runtime's supported interface and consult the
[xAI authentication evidence](research/context/07-XAI-GROK-AUTHENTICATION.md) for token ownership. The
removed quota note's generic recommendations are superseded by SYS-03 and the current comparison
above; its blanket claims about account-scoped cache keys and truthful fallback displays are not
current evidence.

### Native design software and targeted GitHub checks

Online observations checked 2026-09-21, separate from the pinned local inventory. These answer
specific tasks; they are not additions to the installed/reference set or a proposal to build every
integration. Official API availability is evidence of a possible route, not proof that Fleet can
use it correctly or that it is the best in-workbench editor.

| Task | Existing capability / primary evidence | Selection consequence |
|---|---|---|
| Read/change an existing Penpot design | [Official MCP](https://help.penpot.app/mcp/) already edits native pages, layers, components and tokens through the active editor plugin. The [executor at `e4723cb`](https://github.com/penpot/penpot/blob/e4723cb3a81c6eb381331864d0ac20b9acbcf075/mcp/packages/plugin/src/task-handlers/ExecuteCodeTaskHandler.ts#L175) reports code completion without an automatic rollback/durable-save barrier; [history APIs](https://github.com/penpot/penpot/blob/e4723cb3a81c6eb381331864d0ac20b9acbcf075/frontend/src/app/plugins/history.cljs#L23) belong to the existing editor. | A new third-party write bridge has no demonstrated gap for ordinary edits. Test the official path first when that task is requested. An active browser/plugin and Penpot deployment remain required; a local MCP process alone is not an offline editor. Online SHA differs from local `56bf0e3`; neither checkout was updated. |
| Read/change an existing Figma design | [Official remote `use_figma`](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/) edits native objects; it requires appropriate seat/file permission and [client admission](https://developers.figma.com/docs/figma-mcp-server/). The [official interface at `5d718a2`](https://github.com/figma/mcp-server-guide/blob/5d718a28ea21da0b0f75216cdc71be08b6f9b736/skills/figma-use/references/plugin-api-standalone.index.md#L83) excludes undo, version-history saves and clientStorage from `use_figma`. | Do not create a generic writer just because an older MCP was read-only. First compare the official surface against the exact requested operation. A normal Plugin API's capabilities are not automatically available through MCP. This hosted optional route does not satisfy Fleet's local native-editor contract. |
| Embed a whiteboard editor | Excalidraw `97c68dd3` exposes a React editor with scene read/update and [capture into undo history](https://github.com/excalidraw/excalidraw/blob/97c68dd371e13c017a8dcca49f8b3995ba7890a8/packages/excalidraw/components/App.tsx#L5323), plus [native JSON saving](https://github.com/excalidraw/excalidraw/blob/97c68dd371e13c017a8dcca49f8b3995ba7890a8/packages/excalidraw/data/json.ts#L52). | A bounded alternative for a whiteboard task, not proof of arbitrary SVG editing, native Figma fidelity or Fleet's rich media/workflow canvas. No same-task Electron comparison established superiority; no selection or new wrapper follows from this review. |
| Edit an SVG directly | SVG-Edit `c44f061d` has an [embeddable SvgCanvas](https://github.com/SVG-Edit/svgedit/blob/c44f061d2f9a626d2771cc931298af5a45522d87/packages/svgcanvas/demos/canvas.html#L28), `getSvgString` and [source replacement with undo](https://github.com/SVG-Edit/svgedit/blob/c44f061d2f9a626d2771cc931298af5a45522d87/packages/svgcanvas/core/svg-exec.js#L403). | Compare for a real SVG task before inventing vector editing. Its sanitizer removes unsupported content and multi-instance isolation remains unverified. This is not a general design-document replacement; superiority and faithful round trips have not been demonstrated. |
| Drive a named deep-domain tool | Blender already exposes blend-file data and many UI operators through [`bpy.data` / `bpy.ops`](https://github.com/blender/blender/blob/main/doc/python_api/rst/info_api_reference.rst). | For the existing outside-tool scope in `product.md`, use the tool's own API before adding an agent framework. Operator context, save and undo still need task-specific checks; availability does not prove a complete unattended workflow. |

### Format-editor candidates checked against the compatibility question

These are bounded candidates for the requested file formats, not permission to add a second
document or media authority. The comparison is about an actual editable round trip and the cost of
hosting it; a viewer, converter or project-file parser does not qualify as a native editor.

| Format / task | Existing project capability / primary evidence | Selection consequence |
|---|---|---|
| DOCX/XLSX/PPTX editing | [ONLYOFFICE Docs](https://github.com/ONLYOFFICE/DocumentServer) is an AGPLv3 self-hosted server with text, spreadsheet and presentation editors and direct OOXML support. Its [Docs API](https://api.onlyoffice.com/docs) embeds the editor through a document-server integration, so the editor remains a separate service with its own storage/auth contract. | A viable external editor route for Office formats when a server deployment is acceptable. It is not a drop-in Electron package; the AGPL boundary, [Docs API save callbacks](https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/) (WOPI is a separate integration option), conversion behavior and one Fleet document authority require an owner checkpoint before adoption. GenOffice remains the closer local-component candidate because it already has native package patch/save and recovery paths in the checked-out source. |
| DOCX/XLSX/PPTX editing through LibreOffice | [LibreOffice core](https://github.com/LibreOffice/core) exposes the Writer/Calc/Draw document model and UNO SDK; the project is distributed under [MPLv2/LGPLv3+ terms](https://www.libreoffice.org/licenses/). It is a large native desktop suite, not a small embeddable React editor. | Keep as an external delegated editor or conversion fallback candidate. Do not embed or fork the full suite before measuring process, profile, font and save/recovery cost against GenOffice and ONLYOFFICE. |
| DOCX/XLSX/PPTX editing through Collabora | [Collabora Online](https://www.collaboraonline.com/terms/collabora-online-mplv2/) is primarily MPLv2 and its official examples require a separately hosted server plus a WOPI host; the [Kubernetes guide](https://github.com/CollaboraOnline/online/blob/main/kubernetes/helm/collabora-online/README.md) documents that deployment shape. | A credible server-side Office editor, but its WOPI/session topology is a larger integration than the current local Craft shell. Compare it with ONLYOFFICE only for a deliberate remote-editor release; it does not justify a second local document store. |
| Photoshop `.psd` / `.psb` editing | OpenShop is an MIT browser editor built around `ag-psd`; its checked source supports RGB 8/16-bit PSD import and emits an explicit loss report, while text/vector/masks/smart objects can be rasterized or baked on export. Adobe's [Photoshop UXP Document API](https://developer.adobe.com/photoshop/uxp/ps_reference/classes/document/) can save PSD/PSB through the installed application. | OpenShop is a bounded PSD editing candidate only after sample round trips; it is not Photoshop fidelity. For features a fallback cannot preserve, evaluate installed Photoshop through its official API; even that route requires version-specific fixtures. Fleet should preserve the original and report loss for any open-source fallback. |
| Premiere `.prproj` editing | [Kdenlive](https://github.com/KDE/kdenlive) and [Shotcut](https://github.com/mltframework/shotcut) are GPL desktop editors built on MLT. Kdenlive documents its own `.kdenlive` XML/MLT project format in its [file-format specification](https://github.com/KDE/kdenlive/blob/master/dev-docs/fileformat.md); the [MLT XML DTD](https://github.com/mltframework/mlt/blob/master/src/modules/xml/mlt-xml.dtd) is an interchange/rendering model, not a Premiere project writer. | Neither project is a `.prproj` editor. They are useful external-editor or MLT interchange references, not a direct Premiere compatibility layer. For native Premiere project edits, use the installed app's [official UXP Project API](https://developer.adobe.com/premiere-pro/uxp/ppro-reference/classes/project); otherwise support named exchange formats with a fidelity report. |
| WPS `.wps` / `.et` / `.dps` editing | WPS's official conversion endpoints ([WPS→DOCX](https://open.wps.cn/documents/app-integration-dev/docs-center/convert/api-docs/online-convert/to-docx), [ET→XLSX](https://open.wps.cn/documents/app-integration-dev/docs-center/convert/api-docs/online-convert/to-xlsx), [DPS→PPTX](https://open.wps.cn/documents/app-integration-dev/docs-center/convert/api-docs/online-convert/to-pptx)) are authenticated, asynchronous remote conversions. No independent open-source native WPS read/write chain was verified. | Prioritize standard Office formats. Offer WPS conversion or delegation with an explicit conversion receipt; do not promise lossless native WPS editing or mistake Microsoft Works `libwps` support for Kingsoft WPS support. |

### Adobe-Alternatives catalogue review

The [Adobe-Alternatives catalogue](https://github.com/KenneyNL/Adobe-Alternatives) is a discovery index,
not a compatibility or quality ranking. Its ✨ legend includes both open-source and source-available
projects, so that badge proves no redistribution permission. The rows below classify product
categories, not every repository or every feature; only linked primary evidence was checked.
Unmeasured candidates remain candidates, not winners or Adobe-format compatibility claims.

| Adobe area | What the catalogue actually contributes | Fleet decision |
|---|---|---|
| Photoshop / painting | PhotoGIMP is a [GIMP customization patch](https://photogimp.com/what-is-photogimp/), not a separate editor. GIMP has its own XCF format and PSD import/export, with feature gaps still tracked in its [format matrix](https://developer.gimp.org/core/standards/images/). Krita explicitly supports many PSD layer types while warning that PSD cannot be supported 100% because it is a reverse-engineered internal format ([Krita PSD notes](https://docs.krita.org/en/general_concepts/file_formats/file_psd.html)). | Do not absorb PhotoGIMP as product code. Compare GIMP, Krita and the already checked OpenShop only as bounded PSD fallbacks; preserve originals and emit loss reports. Prefer the installed application for unsupported native features, with a version-specific fidelity check. |
| Illustrator / tracing | Inkscape's native format is open SVG and stores editor metadata in SVG ([Inkscape](https://inkscape.org/en/develop/about-svg/)); its current AI route is import-oriented, not native AI write-back. Graphite is dual MIT/Apache but remains alpha, and its own milestone says a stable document format is still being built ([Graphite repository](https://github.com/GraphiteEditor/Graphite), [format milestone](https://github.com/GraphiteEditor/Graphite/issues/3646)). VTracer/SVGcode are tracing utilities, not Illustrator document editors. | SVG is the safe editable interchange. No `.ai` round-trip promise; Graphite is research/evaluation material until its document format and compatibility contract stabilize. |
| Animate / After Effects | OpenToonz/Tahoma2D/Synfig/Glaxnimate and Blender each have their own scene/project models. Natron is an OpenFX compositor with human-editable XML project files ([Natron](https://github.com/NatronGitHub/Natron)); OpenFX is a plug-in boundary, not an `.aep` reader/writer. | Use native project formats inside a future animation/VFX component and exchange rendered media or named interchange formats. Do not label any of these as FLA/AEP compatibility. |
| InDesign / layout | Scribus has an XML-based SLA/SLA.GZ native format and PDF export ([Scribus data sheet](https://wiki.scribus.net/wiki/images/9/93/Scribus-specs-152.pdf)); it is not an INDD editor. Laidout is another layout application with its own document model. | A possible open layout component, not an InDesign file bridge. Import/export must name the fidelity class and keep source files. |
| Substance / materials and meshes | The catalogue names Material Maker, UcuPaint, ArmorPaint, ArmorLab and Meshroom. Their individual source/runtime/format contracts were not audited here. | Native 3D authoring stays outside Fleet under PRODUCT. These may inform a specific external-tool workflow; listing them neither admits an engine nor proves Substance project compatibility. |
| Lightroom / RAW | darktable keeps non-destructive processing history in XMP sidecars and a library database ([sidecar specification](https://darktable-org.github.io/dtdocs/en/overview/sidecar-files/sidecar/)); RawTherapee uses PP3 processing profiles. These are application-specific recipes, not Lightroom catalog or ACR history round trips. | Treat RAW development as an external workflow. Preserve the RAW plus its sidecars; do not claim Lightroom catalog compatibility. |
| XD / interface design | Penpot has an open ZIP+JSON `.penpot` format ([format specification](https://help.penpot.dev/technical-guide/developer/data-model/penpot-file-format/)), but its own migration guidance says Adobe XD files cannot be imported directly and recommends SVG export ([Penpot migration note](https://penpot.app/blog/adobe-xd-export/)). | Use Penpot's native editor/API when the task is Penpot. For XD, support SVG-based migration with an explicit loss boundary, not a direct XD reader. |
| Premiere / timeline editing | Kdenlive and Shotcut use MLT-based projects; OpenShot uses `.osp` and supports partial EDL/Final Cut Pro XML exchange ([OpenShot import/export](https://openshot.org/files/user-guide/import_export.html)); Olive's project XML is versioned but its repository calls the software alpha and highly unstable ([Olive](https://github.com/olive-editor/olive)). | No native `.prproj` editing round trip was verified in the inspected candidates. Use them as external editors or exchange-format references only; native Premiere editing remains an installed-app API path. |
| Acrobat / PDF | PDF Arranger supplies page operations; other candidates model different PDF subsets. [EmbedPDF](https://github.com/embedpdf/embed-pdf-viewer) documents annotation, redaction, search and virtualized viewing; it deserves a bounded in-workbench comparison. The client is Apache-2.0, while `cloudpdf/server` is FCL with a commercial runtime requirement during its FCL term; the PDFium-derived runtime needs its own dependency review. | Separate page operations, content editing, forms and annotations. EmbedPDF was checked at README/license scope only: no source-path audit, save/reopen fixture or dependency admission. A viewer with annotations is not universal PDF content editing. |
| Audition / Media Encoder | Audacity, Tenacity and Ardour use their own audio/session formats; HandBrake is a transcoder, not a project editor. | Keep audio editing and encoding as separate external/job capabilities. No Audition session or Media Encoder project compatibility is implied. |
| Bridge / Dreamweaver / ColdFusion / Mixamo | The catalogue has no open-source Bridge equivalent; its Bridge entries are freeware/commercial. Dreamweaver alternatives are general code editors, BoxLang is a runtime, and Mesh2Motion is a narrow motion tool. | These do not create a Fleet file-format or editor requirement. Do not add them to the production surface merely because they appear in the index. |

## Focused product-flow comparisons

At the owner's request, the nine projects below received three production-flow traces each, covering
callers, state, persistence and failure/recovery at the pre-refresh mechanism-review revisions above. AionUi also required
its AionCore backend. These extend the 67-checkout bounded inventory; they are not whole-repository
or running-product acceptance. Tests were read, not executed; no dependency was installed or reference
changed during those traces. Paths and lines are relative to each named checkout at its review SHA.
The current checkout table separately records later updates. These observations qualify the older
findings below; they do not change historical source locks. Implementation and admission follow the
existing Fleet contracts, and research does not open the R0 feature gate.

### AionUi and AionCore

- **Creation:** `packages/desktop/src/renderer/pages/guid/hooks/useGuidSend.ts:105` reaches AionCore
  `crates/aionui-conversation/src/service.rs:1038`. Human HTTP and the runtime-token agent helper
  share `ConversationService.create`: resolve Assistant snapshot/directory, persist the conversation,
  then bind Project/folder best-effort. The separate writes do not establish an atomic create transaction;
  a Project is not a prerequisite for starting a conversation.
- **Configuration:** `packages/desktop/src/renderer/hooks/agent/useAcpConfigOptions.ts:83` distinguishes
  `observed`, acknowledgement and next-turn pending. However, AionCore
  `crates/aionui-ai-agent/src/session_agent.rs:1129` can return `Observed` from optimistic host overrides,
  without CLI echo. `crates/aionui-conversation/src/service_ops.rs:150` can also succeed after preference
  persistence fails. **This corrects the earlier blanket backend-confirmation claim.**
- **Approval/cancel:** `packages/desktop/src/renderer/pages/conversation/Messages/usePendingConfirmationsRecovery.ts:76`
  rebuilds cards from live pending requests; AionCore `crates/aionui-conversation/src/service.rs:3418`
  carries turn identity through deferred cancellation/watchdog cleanup. A missing agent yields no
  pending cards, so full-process approval recovery is unproven; resetting the UI gate is not a stop receipt.

**Fleet fit:** extend current Session creation, configuration evidence and turn cancellation; do not add
another Conversation/Assistant store. Apache-2.0 code candidates, with backend-specific confirmation
and crash recovery still requiring verification. Real CLI backends, engine internals and asset-license
closure remain outside these traces.

### Open Design

- **Manual/agent editing:** `apps/web/src/components/FileViewer.tsx:13224` applies source patches through
  the file API; agent processes write in their effective directory and
  `apps/daemon/src/run-html-version-snapshots.ts:82` captures HTML versions before completion. They share
  HTML/version storage, but not one universal edit command.
- **Save/restore:** `apps/web/src/components/FileViewer.tsx:13363` preflights source bytes;
  `apps/daemon/src/routes/project/index.ts:6014` checks parent lineage, and `:7762` locks write/version
  capture. These protections do not establish atomic expected-version comparison. A file write
  can succeed while history capture fails; restore UI exposes the typed warning, but
  `apps/web/src/providers/registry.ts:3069` drops it in ordinary manual saves. The version-route tests
  explicitly cover drift, concurrent checkpoints and partial success.
- **Local authority:** `apps/daemon/src/collab/project-request-authority.ts:189` checks persistent bindings
  and frozen/revoked state. Normal local reads/writes do not require a live cloud membership query;
  its authority tests cover offline access and frozen writes.

**Fleet fit:** HTML source patches, provenance and explicit partial-success results belong in the existing
artifact/component path. Apache-2.0 inspected code is a candidate; template licenses remain separate.
FIG import is not native FIG save, and neither multi-file atomic rollback nor every CLI mutation was
proved. Team identity and the large viewer shell are not proposed Fleet dependencies.

### Multica

- **Assignment/run:** GUI and CLI reach `server/internal/handler/issue.go:3783`, then the task queue and
  daemon. Persisted sequenced messages feed the UI cache. `server/internal/daemon/daemon.go:9417` clears
  each outgoing batch before reporting it and only logs report failure: persistence does not guarantee
  disconnected-message delivery. Reassignment or cancelling an issue does not stop an existing run.
- **Approval/cancel:** `server/pkg/agent/claude.go:730` uses `bypassPermissions`;
  `server/pkg/agent/codex.go:2863` automatically accepts supported requests. This is not an interactive
  approval reference. `server/internal/service/task.go:2857` records cancellation intent before the
  daemon observes it, stops execution and acknowledges; intent and physical termination differ.
- **Environment management:** `server/internal/handler/agent_env.go:77` restricts management to humans,
  audits before reveal, and transacts updates with audit records. The inspected `custom_env` path stores
  JSON, not a demonstrated encrypted vault. Task processes retain daemon HOME/XDG access; configuration
  injection and app authorization are not an OS sandbox.

**Fleet fit:** compare queue triggering, cancellation receipts and audit-before-reveal against existing
Task/permission paths. The license includes custom Part I conditions plus Apache-2.0 Part II; this is
a mechanism reference, not unrestricted code admission. Scheduler reclaim, all adapter cleanup and
checkout/finalization safety remain unread. Database test sources were not executed.

### OpenPencil

- **Human/MCP editing:** `crates/op-host-native/src/widget_host/property_dispatch.rs:20` and
  `crates/op-host-services/src/mcp_live/connection.rs:283` converge on EditorState. MCP waits for UI-thread
  apply/repair acknowledgement; some native properties use direct mutators/history capture. A common
  document does not mean all entrances use identical commands. Explicit file-target MCP is a separate route.
- **Open/save:** `crates/op-host-desktop/src/persistence.rs:192` validates before replacing state;
  `crates/op-host-desktop/src/save_session.rs:185` captures immutable snapshots, runs one save plus the
  latest queued save, and fences acknowledgements by document epoch/generation/revision. Its tests cover
  captured revisions and stale acknowledgements. This protects own-format `.op` saves, not FIG/Office fidelity.
- **Collaboration:** `crates/op-collab-host/src/runtime/local_edit.rs:128` reapplies preserved conflicting
  intent; `crates/op-editor-core/src/edit_transaction.rs:166` guards rollback by generation.
  **Active multiplayer collaboration forbids AI/MCP writes** in
  `crates/op-editor-core/src/collab_gate.rs:344`, with an explicit rejection test. Standalone human/MCP
  editing is a different mode; this does not demonstrate AI/MCP writes during a multiplayer session.

**Fleet fit:** document-bound save receipts and conflict recovery are canvas mechanism candidates.
The inspected Rust is MIT, but three required submodules are uninitialized and private auth prebuilt
artifacts have a separate boundary. No build, external-writer compare-and-swap or crash-durability
guarantee was established; local MCP processes are trusted without per-call secrets.

### OpenChatCut

- **Human/agent operations:** `src/editor/storeCommandBuilder.ts:40` serves live editing and private drafts;
  `src/agent/tools/edit-item-batch.ts:70` validates the whole batch before publishing once. Proposals replay
  semantic operations; `src/agent/useAgentRun.ts:129` persists before publication and detects intervening
  UI edits. This is an application workflow, not a universal multi-file transaction.
- **Open/save:** `src/app/AppViews.tsx:35` distinguishes missing from unreadable projects; failed autosave
  retains recovery state. `server/plugins/project-store-project-document.ts:114` **intentionally removes
  expected-revision comparison**, and its verify test accepts stale writes. Owner/epoch/lease checks and
  process serialization remain, but project and ownership use separate SQLite writes with compensation.
  External manual approvals bind exact arguments once; automatic sessions bypass that card.
- **Export/recovery:** `src/export/serverExportOperation.ts:161` reaches the actual Remotion renderer
  (`remotion/render.mjs:200`); preview/render share TimelineComposition. Encoding, target delivery and
  cleanup have separate states. Completed output survives a lost destination grant and can be delivered
  after rebinding without rendering again. Cancellation timeout is explicit, not reported as completed.

**Fleet fit:** shared operations/undo, unreadable-file preservation and export delivery are Video Component
references; keep Fleet's Session/permission/job authorities. AGPL-3.0-or-later means no direct import is
admitted here. Read tests cover draft rollback, stale writes and mocked delivery recovery, not codec,
pixel fidelity, cross-process atomicity or full engine behavior.

### Hermes

- **Turn lifecycle:** `hermes_cli/cli_chat_turn_mixin.py:47` enters
  `agent/turn_facade.py:22`; resumed history follows compression lineage.
  `agent/session_persistence.py:226` advances persistence after writes and filters ephemeral/already
  durable content; finalization releases leases/context state. The lease is conditional on a durable
  session row, not a guarantee for every first turn.
- **Tool approval:** `agent/tool_executor.py:666` authorizes final rewritten arguments;
  `tools/approval.py:1159` and terminal execution distinguish refusal, expiry and remembered grants.
  Automatic/unattended bypasses exist, and cached persistent grants are not reread every turn.
  This is neither a sandbox nor universal manual approval.
- **Memory/evidence:** `tools/session_search_tool.py:355` searches transcript evidence;
  `tools/memory_tool_store.py:157` locks fresh-read/atomic-save memory mutations.
  `agent/background_review.py:981` isolates background review from parent transcript persistence.
  Instance workers/file locks do not enforce Fleet's single consolidation writer. Mem0 sync can skip
  a turn while a previous worker remains busy.

**Fleet fit:** compare cancellation, authorization and evidence/curated-memory separation against existing
authorities. MIT code is a candidate where technically appropriate; importing the Python session runtime
or automatic memory writer is not proposed. Read tests cover batch rejection, search cleanup and review
isolation; gateways, plugins, all model loops and persistent-grant revocation remain outside this review.

### OpenCode

- **Input/events:** current UI `packages/app/src/components/prompt-input/submit.ts:168` routes through
  protocol compatibility to `packages/core/src/session.ts:360`. Stable input identity and payload
  comparison make retries idempotent. `packages/core/src/event.ts:303` commits projections and sequenced
  events before publication. Replay rebuilds pending input without automatically rerunning tools;
  the run coordinator is process-local, not a demonstrated crash/distributed scheduler.
- **Permission/process:** `packages/core/src/permission.ts:155` gives configured deny precedence over
  remembered allow; `packages/server/src/handlers/permission.ts:19` checks the reply's Session.
  Scoped process cleanup reaches actual execution, but pending approvals are in memory and Bash path
  inspection is not an OS sandbox.
- **Context:** `packages/core/src/session/compaction.ts:232` budgets input/tools/output reserve;
  only a successful nonempty summary updates the projection. Full messages remain durable evidence.
  `packages/core/src/session/runner/llm.ts:363` permits one overflow recovery, then preserves the second
  error. Read tests cover duplicate admission, replay without execution, deny priority and overflow.

**Fleet fit:** idempotent admission, permission precedence and context projection are candidates for the
current Session/permission/context paths. The current core/server protocol and legacy CLI/SessionPrompt
coexist; do not splice their evidence into one runtime claim. MIT alone does not justify replacing Craft's
runtime. Full provider, legacy CLI, plugin and crash-restart behavior remain unverified.

### Orca

- **Accounts/options:** `src/main/codex-accounts/service.ts:80` serves desktop IPC and accounts RPC;
  `codex-account-selection.ts:100` scopes selection to host/WSL runtime. Local-path account import is
  local-only. `src/main/codex/codex-structured-session-options.ts:94` validates and persists model
  options for the next turn; this is not current-turn CLI echo or immediate account rebinding.
- **Session recovery:** `src/renderer/src/components/native-chat/use-structured-agent-session-mutate.ts:41`
  sends operation identity/fingerprint and runtime fence. Host admission, durable records and the
  `src/main/native-chat/agent-session-journal/journal-row-writer.ts:20` commit precede cursor publication.
  `src/main/codex/codex-structured-turn-cancellation.ts:88` requires interrupt receipt and actual
  termination before reporting cancellation. Scripted tests do not substitute for real app-server runs.
- **Files:** `src/renderer/src/components/editor/editor-save-queue.ts:85` preserves dirty drafts on
  failure. Local IPC and remote RPC retain host/worktree ownership; local writes share
  `src/main/ipc/filesystem-auth.ts:37` canonical-path checks. Explicit external grants widen roots;
  CLI shell access is outside that app-service check, and atomic protection against path races is unproved.

**Fleet fit:** MIT candidates for scoped account selection, stale-request rejection, event recovery and
save acknowledgements; extend existing credential/Session/file services. Journal, provider history and
session records serve different roles, not a replacement Fleet store. Legacy/TUI orchestration,
SSH/WSL internals and full remote-client permission admission remain outside these traces.

### ZCode

- **Install and configure:** `packages/ui/src/settings/PluginStorePage.tsx` →
  `packages/ui/src/store/pluginManagementStore.ts:252` / `pluginManagementStoreLoading.ts:16` →
  `packages/services/src/plugins/pluginManagementService.ts:32` → CLI protocol server →
  `apps/zcode-cli/packages/bootstrap/src/plugins.ts:707` →
  `apps/zcode-cli/packages/adapters/src/plugins/marketplace.ts:587` and its sibling `atomic-directory.ts:58`.
  One CLI inventory serves the UI. The UI reports diagnostic failures even inside a successful RPC
  envelope and fences late results by Workspace/config scope. Directory transaction IDs, installed
  records and backups determine commit versus recovery. **Installation always targets host user
  inventory and default-enables new IDs globally**; Workspace activation and permission are separate.
- **Send, interrupt and recover:** `packages/ui/src/v4/SessionPane.tsx:1395` records command identity
  before sending through `packages/ui/src/v4/agentConversationTransport.ts` and the host's
  `packages/services/src/zcode-agent/zcodeAgentService.ts:5026`. CLI
  `apps/zcode-cli/packages/bootstrap/src/zcode-protocol-v4/commands/handlers/session-flow.ts:184` uses one Core admission;
  start-now acquires a foreground lease and waits for prior execution to release it. The renderer
  reconciles acknowledged input against authoritative projections, not invented chat rows.
  `packages/ui/src/v4/pendingCommandRegistry.ts:188` silently settles an unknown server result; that is not proof of
  recoverable delivery. Sensitive approval answers are not replayed, but ordinary pending input is
  retained in renderer localStorage for up to 24 hours. Do not import that persistence policy blindly.
- **Provider and credential state:** `packages/ui/src/hooks/useModelProviders.ts:77` consumes the saved provider view;
  host account keys include provider/account identity. `packages/services/src/credential/credentialService.ts#readAll` refuses corrupt
  credential overwrite, and `createCredentialService` locks the whole read/modify/atomic-replace. Explicit remote
  provisioning (`packages/services/src/model-provider/providerProvisioningTarget.ts:52`) has sync-ID idempotence and
  compare-before-rollback per domain, with an explicit rollback-failed result. It is compensating
  recovery, not one atomic transaction. `packages/shared/src/remoteEnvironmentKey.ts` separates host
  Environment identity from Workspace/Session; its SSH/WSL/Docker product is not Fleet's remote model.

**Fleet fit:** staged installation and scoped asynchronous-result guards are R15/R18 candidates;
command acknowledgement/projection separation extends the existing Session event path. Credential
corruption handling exposed an R0 comparison: the reviewed Craft source deleted bytes after
header/decryption failure. Fleet now retains those bytes and propagates a classified recovery error
through its current credential manager; `profile-storage.isolated.ts` supplies the regression
evidence. This correction does not import ZCode's store or cipher.
ZCode's cipher fallback derives a secret from platform/home/username, so do not copy its crypto or
claim OS secret-store protection. First-party Apache-2.0 does not cover every dependency/binary.
`providerConfigMigration.test.ts`, `importedClaudeRecovery.test.ts` and `nonCliAcpRetirement.test.ts`
cover specific migration/retirement contracts; they do not validate these entire three flows.

## Admission vocabulary

`PRODUCT_REFERENCE` in older source notes means `EVIDENCE_ONLY` for observed product behavior,
not a separate admission grade. `C`/`M`/`X` in the current review describe comparison scope, never
capability readiness or dependency approval.

| Status | Meaning |
|---|---|
| `FORMAL_REFERENCE` | Multiple mechanisms are needed repeatedly and all admission gates passed. |
| `MODULE_REFERENCE` | Only a bounded subtree/protocol/symbol passed; never the product shell. |
| `LOCAL_IMPROVEMENT` | A small Fleet change can meet or exceed the candidate; put the change in an active spec. |
| `EVIDENCE_ONLY` | Product or mechanism evidence only; no standing dependency or code import. |
| `candidate` | Not yet admitted; fixed commit, exact symbols, comparison, license and deletion test are incomplete. |
| `REJECT` | No gap, weaker, conflicting authority, or unacceptable license/dependency. |

## Source-review minimum (not README review)

Before a project can influence a Fleet implementation decision, its record must identify, where the
project provides them: (1) the executable entrypoint and control flow; (2) the state/persistence
authority; (3) the human and Agent/API callers of the same operation; (4) permission, trust,
dependency and failure/recovery paths; (5) lifecycle/disposal or update/rollback behavior; (6) the
tests/fixtures that prove the mechanism; and (7) the exact license boundary of the files and runtime
dependencies. A README, screenshot, star count or package name may route an investigation, but
cannot promote a project to `MODULE_REFERENCE`, determine product status, or justify deletion of an
existing checkout. If a project has only partial code evidence, label the verdict `EVIDENCE_ONLY` or
`candidate` and state what remains unread.

Admission also requires a measured same-task comparison against current Craft/Fleet, a bounded
local-improvement attempt, failure/cancel/restart evidence and the consuming capability's proof.
For example, SYS-05 owns the Electron rich-card/concurrent-update/media-proxy benchmark; a
historical xyflow source audit never satisfies it. Candidate names without a current capability
gap do not form a permanent research queue. Removing such a documentary queue does not remove
or authorize deletion of any source checkout.

## Historical source locks and intake records

The following table retains earlier source locks and admission records; it is not a live inventory
and several recorded revisions differ from current disk HEADs. Use the inventory above for presence
and read Git for the actual revision before comparison. `pending` describes the historical admission record, not absence of the current bounded review; even an exact SHA and a readable LICENSE is not a formal reference.

> **Pin integrity, 2026-09-10.** `software/craft-agents-oss-v0.10.5` was found checked out at
> `abdc281a` (v0.12.0) — the same commit as the rolling pin — so the two reference roots were
> byte-identical and the v0.10.5 product/interaction baseline did not exist on disk. It had been in
> that state since 2026-08-17, meaning every "compare against v0.10.5" instruction in `AGENTS.md`
> rule 1, `../DESIGN.md` and `modules/shell.md` R1-C1 silently compared
> against v0.12.0. Restored to `c9d9a26f`. The row below is the assertion to check: a fixed HEAD in
> this table is only true if the checkout is actually on it.

| Checkout | Fixed HEAD | License text at checkout root | Admission-v2 |
|---|---|---|---|
| `plugins/dockview` | `0eef758ef3bc` | MIT (text verified) | `pending` |
| `plugins/markitdown` | `e144e0a2be95` | MIT (text verified) | `pending` |
| `plugins/react-resizable-panels` | `a1eeb7aefdb0` | MIT (text verified) | `pending` |
| `plugins/react-rnd` | `fec7303134ab` | MIT (text verified) | `pending` |
| `plugins/repomix` | `a5577d5718b1` | MIT (text verified) | `pending` |
| `plugins/xyflow` | `dd308ab401d4` | MIT (text verified) | `source-reviewed / INSUFFICIENT_COMPARISON` |
| `plugins/agentskills` | `38a2ff82958a` | Apache-2.0 code; CC-BY-4.0 docs | `source-reviewed / MODULE_REFERENCE candidate` |
| `plugins/hyperframes` | `6ad738b580ad` | Apache-2.0 | `source-reviewed / MODULE_REFERENCE candidate` |
| `plugins/mem0` | `ddaa655edf41` | Apache-2.0 | `source-reviewed / EVIDENCE_ONLY` |
| `plugins/playwright-mcp` | `55679f5f3d4b` | Apache-2.0 | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/OpenHands` | `613406ca2bca` | MIT (text verified) | `pending` |
| `software/codex` | `38b064c31b1f` | Apache-2.0 | `pending` |
| `software/craft-agents-oss-v0.10.5` | `c9d9a26fbefa` | Apache-2.0 | `product/interaction baseline` |
| `software/craft-agents-oss` | `abdc281a7592` | Apache-2.0 | `selective-update reference (v0.12.0; repinned 2026-09-10 from v0.11.2, 97-file delta / +1751 −545, intake below)` |
| `software/hermes-agent` | `2ea39daeb1f6` | MIT (text verified) | `pending` |
| `software/openclaw` | `9f5609382b54` | MIT (text verified) | `pending` |
| `software/opencode` | `40e4d730cac3` (re-cloned 2026-07-27 sparse; prior incomplete snapshot retired) | MIT (text verified) | `pending` / mode evidence in `context/06-MODE-SELECTION-COMPARISON.md` §4.5 |
| `software/opencut-classic` | `cf5e79e91914` | MIT (text verified) | `pending` |
| `software/penpot` | `bdc078d5ea0c` | MPL-2.0 | `pending` |
| `software/pi-mono` | `13437ca82889` | MIT (text verified) | `source-reviewed / EVIDENCE_ONLY` |
| `software/tldraw` | `c26735e45258` | tldraw License (production restrictions) | `pending` |
| `software/browser-use` | `950eb03617e6` | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/browser-harness` | `afbcc381b963` (owner-requested shallow clone, 2026-09-14) | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — CDP browser harness, MCP and editable helper Skills |
| `software/CLIProxyAPI` | `7fa443dc8bf9` (owner-requested shallow clone, 2026-09-14) | MIT (text verified) | `source-reviewed / EVIDENCE_ONLY` — external Go model proxy; not a Fleet model authority |
| `software/dashi-taskboard` | `c346e8e16c9` (owner-requested shallow clone, 2026-09-14) | Apache-2.0 (text verified) | `source-reviewed / EVIDENCE_ONLY` — separate issue store and Codex injection; no Fleet Task import |
| `software/flowgram.ai` | `5afd287a989a` | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/grok-build` | `b41c75a578f9` | Apache-2.0 first-party code; vendored code retains original licenses | `source-reviewed / EVIDENCE_ONLY` |
| `software/mcp-registry` | `29e32c39dcb5` | mixed Apache-2.0/MIT transition; docs CC-BY-4.0 | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/opencut` | `5e0696bc9b92` | MIT (text verified) | `source-reviewed / EVIDENCE_ONLY` |
| `software/waku` | `9500440002b4` (shallow `main`, owner-requested 2026-08-12) | GPL-3.0-only (text verified) | `source-reviewed / EVIDENCE_ONLY` — competing native host; no code import |
| `software/deepseek-harness` | `b150a551b8d4` (existing checkout rechecked 2026-09-14; not cloned in this task) | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — plugin slots, scoped composition and lifecycle |
| `software/OpenChatCut` | `607e0fcc2b75` (owner-requested shallow clone, 2026-09-14) | AGPL-3.0 (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — video component shape; direct code reuse requires AGPL review |
| `software/genoffice` | `d35d77094854` (existing checkout rechecked 2026-09-15) | Apache-2.0 root; `ee/` Enterprise License | `source-reviewed / MODULE_REFERENCE candidate` — native Office/document engines, patch saves, AI editor actions and recovery; direct `ee/` reuse excluded |
| `software/spec-kit` | `bf88c9f9a82f` | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/OpenSandbox` | `f8ed8734ce1f` | Apache-2.0 (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/OpenChamber` | `1636fd2bf` (owner-requested fast-forward to fetched `origin/main`; no product merge) | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — Git/PR and browser-control evidence; updating the reference does not admit its full implementation |
| `software/herdr` | `9166e07b` | Apache-2.0 (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/orca` | `95633a788` (verified 2026-09-10) | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — max-lines ratchet (2026-08-15); subscription usage + managed accounts (2026-09-10) |
| `software/cindy` | `f4422f816` (owner-requested fast-forward to fetched `origin/main`; no product merge) | Apache-2.0 (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — capability ownership, skill slot, right-sidebar registration and project grouping; updating the reference does not admit its full implementation |

The historical source-lock table above retains the revisions actually inspected. Current comparison roles
are the v0.10.5 look pin and v0.13.4 implementation pin stated above. PRODUCT, not either old
checkout, decides product shape; earlier intake findings are rechecked before reuse.

## Retained mechanism observations

These are source observations at their original review boundaries, not a current checkout list or
execution instruction. Every candidate still requires the current seven-field promotion record. PRODUCT controls scope: OpenChamber owns Git/GitHub and
the bounded browser-control seam, not Goals, Fusion, general remote control or Fleet navigation.
Older observations outside that remit remain comparison data only.

| Checkout | Exact inspected evidence | Fleet verdict |
|---|---|---|
| `software/flowgram.ai` | `packages/client/editor`, `packages/canvas-engine/document`, `packages/common/command`, `packages/plugins/*`, `packages/runtime/interface` | workflow/canvas editor seam only; TaskRunner remains execution authority |
| `software/opencut` | `README.md`, `apps/web`, `apps/desktop`, `apps/api` | current rewrite has a real TS/Rust shell but Editor API, plugin-first, MCP and headless items are still roadmap claims; use classic for implemented timeline evidence |
| `plugins/hyperframes` | `packages/core`, `packages/engine/src/services`, `packages/studio-server/src/routes/render.ts`, cancellation/failure tests | primary programmatic-video renderer evidence; absorb deterministic composition and Job adapter behavior, not its Studio or cloud control plane |
| `plugins/mem0` | `mem0/memory/main.py`, `mem0/client/main.py`, tests/evaluation | explicit add/search/update/delete and evaluation mechanisms only; no Fleet service dependency |
| `plugins/agentskills` | `docs/specification.mdx`, `docs/client-implementation/adding-skills-support.mdx`, `docs/skill-creation/best-practices.mdx` | primary Skill format/progressive-disclosure evidence; Fleet adds trust, grants and receipts |
| `software/mcp-registry` | `pkg/api/v0/types.go`, `internal/service/registry_service.go`, `internal/validators`, publication/auth/version tests | primary MCP catalog/publication evidence; registry metadata is never install trust |
| `software/browser-use` | `browser_use/browser/session.py`, `browser_use/dom/enhanced_snapshot.py`, `browser_use/dom/views.py` | BrowserPane executor/recovery evidence only |
| `plugins/playwright-mcp` | `src`, accessibility-snapshot/action tools and tests | deterministic structured action seam; screenshots remain evidence, not selectors |
| `software/waku` | `src/driver/{mod,acp,claude,codex,opencode,pi}.rs`, `src/command_env.rs`, `src/model_catalog.rs`, `src/grok_session.rs` | CLI-host evidence only. Native protocol per vendor (Claude stream-json, Codex app-server, OpenCode HTTP, Pi RPC); ACP only where that *is* the long-lived session (Cursor, Grok). Login-shell PATH + last-good model cache. GPL-3.0-only; direct reuse is not admitted under Fleet's current distribution contract. Do not take GPUI/app shell, persistence, or a second session store. Refines H6: ACP replaces *probes*, not native session transports Fleet already has (Claude SDK / Pi). |
| `software/deepseek-harness` | `README.md` ("everything is a plugin", Cordis); `packages/README.md` (39-group hierarchy, ~167 packages); `packages/AGENTS.md` (plugin export/injection rules); `.agents/notes/implemented/architecture/2026-06-13-capability-seams.md`; `2026-08-03-per-session-agent-presets.md`; `2026-08-09-cordis-event-walk-backstop.md`; `2026-07-29-package-regrouping.md`; `packages/{core,session,subagent,compaction,sandbox,acp,workflow,extensions}` | **Revised by owner direction 2026-09-14:** adopt the plugin-first *composition principles* for Fleet Components, but do not replace Fleet's Craft/Cindy core with Cordis. Admitted: Service Definition / Service Provider / Consumer seams; declared additive UI slots; scoped composition; lazy/optional dependency loading; durable composition snapshots; lifecycle disposal; and "enforce in the operation that decides". Rejected: Cordis as composition root, wholesale 167-package split, property-proxy injection, live self-modification, and any second Session/Task/Permission authority. Cost evidence remains relevant: generated catalogs, independent graph checks and per-package invariants are needed because a failed registration is otherwise indistinguishable from a missing component. |
| `software/deepseek-harness` | `vendor/loader/src/config/{tree,entry,isolate}.ts`; `vendor/include/src/index.ts`; `vendor/cordis/src/{fiber,context,registry}.ts`; `packages/client/ui-slots/src/{index,renderer,store}.ts`; `packages/preset/agent-presets/src/{mount,discovery,authoring,session}.ts`; `packages/extensions/cordis-host-runner/src/{index,inspect-registry}.ts`; associated loader/slot/preset tests | **Code-level admission, 2026-09-15.** The architecture is a coordinated runtime, not a folder convention: `EntryTree` mounts nested rows and awaits every fiber; a failed subtree is reported as an `AggregateError` and disposed; `disabled` keeps a stable entry while unloading its fiber and reactivates dependency-pending rows; `Context.provide`/`ctx.effect` bind service ownership and teardown to a Fiber; `SlotCore.register` validates declarations, scopes, duplicate cells, child-slot ownership and returns an idempotent disposer; `mountPreset` proves every row is usable and rejects services leaked into the root realm before publishing the mount. Preset composition is input-only (`PresetTree.write()` is intentionally a no-op); user authoring copies a whole preset into a user root, tightens modes, refuses overwrite and leaves shipped roots immutable; session preset changes are logged as events so resume reconstructs the composition the later turns actually used. Fleet should implement these invariants as a smaller Manifest → Plan → Activate → Health → Publish → Dispose pipeline over existing Workspace/Session/Permission/Settings, not import Cordis or its process-wide context kernel. |
| `software/OpenChatCut` | `README.md`; `skills/openchatcut/`; `.mcp.json`; `server/`; `src/`; `remotion/`; `shared/` | **Interaction/source evidence for a future Video Editing Component; no engine is selected.** Its implemented shape combines a local editable multitrack project, timeline/editor UI, proposal-based agent edits, undo/redo, MCP, 26 on-demand skills, preview and export. Fleet may independently specify the observed workflow against its own authorities; copying source or source-derived contracts requires AGPL-3.0 obligations, project-format compatibility, and an owner license checkpoint. Its project/media files must remain component-owned artifacts, while permissions, sessions and jobs remain Fleet authorities. |
| `software/genoffice` | `packages/{docx-engine,pptx-engine,pdf2docx,html2docx,file-parse}`; `apps/{docs,sheets,slides,pdf,shell}`; `apps/docs/src/main/{atomic-write,external-change,docs-main}.ts`; `apps/slides/src/main/ops/{registry,executor}.ts`; `apps/slides/src/preload/index.ts` history/snapshot APIs | **Source-level document-component reference.** The engine parses native OOXML/PDF/HTML formats, applies narrow patches and repacks untouched archive entries; the Docs host tracks dirty state, external changes, autosave recovery and Restore/Discard; Slides exposes operation registries, undo/history batches and AI snapshots through the same IPC surface. The UI/Agent share the document's native operation path rather than editing a flattened preview. Root is Apache-2.0, but `ee/` is development/test-only enterprise licensed and third-party engines retain their own notices; no direct `ee/` reuse. |
| `software/spec-kit` | `src/specify_cli`, `.spec-kit/templates`, `presets`, `bundles`, `prompts`, `docs` | Spec-Driven Development (SDD) contract evidence, executable specification generation, constitution/principles, task decomposition templates, and role presets/bundles |
| `software/OpenSandbox` | `modules/`, `server/`, `components/{ingress,egress}`, `sdks/`, `kubernetes/`, `cli/` | General-purpose sandbox platform, unified sandbox lifecycle/execution protocol, Docker/K8s/gVisor runtime adapters, network ingress/egress policy, and credential vault |
| `software/openchamber` | Historical multi-surface checkout observation; current inspected paths appear above | Goals, Fusion and private relay pairing were observed in that product but are outside its Fleet remit. They are not an implementation queue. Retained Git/GitHub and browser-control evidence is recorded in the bounded rows below. |
| `software/herdr` | `src/{app,client,server,ui,config}`, `tests/` | Rust native terminal multiplexer & background supervisor server, working/blocked/idle pane state detection, socket API / CLI orchestration, and persistent detach/reattach |
| `software/cindy` | `apps/{desktop,mobile}`, `packages/{maker-core,maker-cc-manager,maker-pi-manager,model-providers,device-link,browser-control-runtime,lizi-im}` | Multi-harness agent client, mid-task harness switching, device-link remote control, IM bridges (WeChat, Slack, Lizi), and local background automation |

## Source-level intake, 2026-08-15

Read at source level, not from READMEs. Each row names the exact evidence and the Fleet row it
serves. **A licence column that forbids import is not a footnote** — it decides whether the entry is
a port target or a specification input. F3 requires license, approved-source and product-fit
checks; it contains no blanket language ban. The mechanism-only verdicts below describe the
scope and integration fit of those historical comparisons, not a prohibition on other runtimes.

| Checkout | Licence / language | Exact evidence read | Verdict for Fleet |
|---|---|---|---|
| `software/cindy` | Apache-2.0 · TypeScript | `packages/model-providers/src/{types,registry,invocation,effortResolution,classification}.ts`; `packages/maker-core/src/{types/capabilities.ts, agents/base-agent.ts, agents/credential-mode.ts, session.ts}` | **The agent/model split is real and package-enforced**: `maker-core` and `model-providers` never import each other; `Provider.models[agent]` / `routing[agent]` fan one provider over many harnesses; `resolveRoute` is pure and reads no storage. Grounds Decision **E15**. Port candidates: `types/capabilities.ts` + the two-layer `NotSupportedError` guard (~330 lines, no deps); `invocation.ts` (its header records six duplicated implementations and a real security incident from divergent fallbacks — an unsupported permission mode must fall back to the **strictest**, never the scenario default). **Do not take** `session.ts` (84 KB) or `maker.ts` (47 KB): a second session/turn/permission authority with its own lease model; nor `agents/shared/auto-review.ts` (295 KB), a second approval-granting authority |
| `software/AionCore` | Apache-2.0 · **Rust** | `crates/aionui-session/src/backend/{mod,types,descriptor,cli_version}.rs`, `capability.rs` | Specification input for **E15**, not a port. `BackendConnection` + `SessionBackend` two-trait split; `CommandNotSupported`; `request_external_permission` defaults **Denied**; `CapabilityOrigin` + `effective_agent_capabilities` (constructed `false` beats stale ACP discovery); `mode_switch_effect: Immediate|NextTurn`; verified-CLI-version verdicts. **Do not take** the per-vendor connection modules (`claude_conn.rs` 352 KB, `codex_conn.rs` 472 KB) or its reducer/FSM — a second timeline |
| `software/omnigent` | Apache-2.0 · **Python** | `harness_capabilities.py`, `native_policy_hook.py`, `inner/executor.py`, `inner/policies.py`, `inner/sandbox.py`, `harness_plugins.py`, `designs/harness-plugin-interface.md` | Specification input for **E15** and **EXEC-08**. Declared capability with `None` = *no claim*, live-verified by a bench. One `POST /policies/evaluate` authority with per-harness hook translation, **fail-closed** with a bounded retry budget — six vendors, one permission path. Its `SandboxBackend.{resolve, wrap_launcher_argv, post_spawn}` is **daemonless and per-spawn** across bwrap/Seatbelt/JobObject, which disproves the premise that an OS sandbox needs a control plane. Its own Windows backend documents that it isolates nothing |
| `software/OpenSandbox` | Apache-2.0 · **Go + Python** | `components/execd/pkg/isolation/{isolator,bwrap,seccomp_gen,probe}.go`, `pkg/runtime/errors.go`, `pkg/web/router.go`, `configs/isolation.example.toml` | **A second sandbox is outside the product boundary.** The inspected implementation was bwrap-only, Linux-only (`bwrap_stub.go` is a no-op elsewhere); no Seatbelt, no Landlock, no gVisor in-tree — those are delegated to a container runtimeClass. Requires a resident in-sandbox daemon **plus** a FastAPI/Docker/K8s control plane. Useful only as vocabulary: `Capabilities`+`Probe` per-mode probing with a human diagnostic message, and the denial taxonomy in `runtime/errors.go`. **EXEC-08 now tracks inherited isolation under R0/R2.** This observation neither closes that audit nor establishes equivalence to a container sandbox |
| `software/AionUi` | Apache-2.0 · TypeScript | `tests/unit/acpConfigOptions.test.ts`, `tests/unit/settings/agentFilters.test.ts`, `docs/prds/conversations/acp/*.md`, `packages/desktop/src/index.ts` | Corrects **H7**'s citation (`ManagedAgent`, not `DetectedAgent` — see 02-DECISIONS). One portable invariant: a config write commits to UI state only when the backend **echoes** the value (`confirmation: 'observed'`); a bare `command_ack` must not mutate confirmed state. Its ACP PRDs enumerate per-backend behaviour differences as acceptance criteria. **Current qualification:** the deeper [AionUi/AionCore trace](#aionui-and-aioncore) finds host-optimistic `Observed` replies; this historical UI finding is not a universal backend-echo guarantee. **Do not take** `ipcBridge.ts` (89 KB, a second IPC authority) or the `aioncore` subprocess pattern — it moves session state outside the one store |
| `software/Kun` | **PolyForm Noncommercial** · TypeScript | `src/renderer/src/AppShell.tsx`, `components/workbench/*`, `components/workbench-layout*.ts`, `store/chat-store.ts`, `kun/src/contracts/policy.ts`, `kun/src/server/approval-consent.ts` | **No direct reuse is admitted under the current product/distribution contract.** Pattern evidence: a **155-line `AppShell`** that switches one route field over lazy children, a composition-root `Workbench` that owns nothing, ~40 single-purpose `useWorkbench*` controller hooks, layout as a hook with persistence isolated in one file, and a 190-line store that only spreads slice factories. This does not prescribe a replacement Fleet shell or a line-count target. Also: three product approval modes projected onto three raw axes with unknown combinations resolving to the **narrowest** mode, and approvals gated by a single-use HMAC consent token with the audit event written **before** the tool is released |
| `software/orca` | MIT · TypeScript | `config/scripts/check-max-lines-ratchet.mjs`, `config/max-lines-baseline.txt`, `.oxlintrc.json`, `src/renderer/src/store/{index,store-listener-census}.ts`, `AGENTS.md` | **Maintainability mechanism evidence.** A `max-lines` **ratchet**: the linter fails an over-budget file, so the only escape is a disable comment, and the script freezes the set of files holding one in a baseline that may only shrink. Budgets: 300 `.ts` / 400 `.tsx` / 800 tests. Counter-evidence that principles alone fail: Orca's own `App.tsx` is 2,831 lines opening with `/* eslint-disable max-lines */`, and slices reach 248 KB. Fleet has not adopted these limits; compare a ratchet only against an observed maintainability problem |
| `software/openchamber` | MIT · TypeScript | `packages/ui/src/sync/{DOCUMENTATION.md, event-reducer.ts, materialization.ts, session-event-router.ts}`, `stores/permissionStore.ts` | Historical cache-versioning observation: `permissionStore.ts` (207 lines) — a client **cache** of a server-owned policy fenced by `revision` + `generation` + `runtimeKey`, refusing to apply a snapshot older than the last applied. This does not expand OpenChamber's product remit beyond Git/GitHub and the browser seam. **Counter-evidence to itself**: `useUIStore.ts` 103 KB, `useConfigStore.ts` 170 KB, and a second layout host (`VSCodeLayout.tsx`) grown to serve a second surface — precisely Fleet's forbidden second shell, observed in the wild |
| `software/herdr` | Apache-2.0 · **Rust** | `src/app/runtime_mutations.rs`, `src/api/{mod,event_hub}.rs`, `src/events.rs`, `AGENTS.md` | Pattern only. Observed mechanism: **the local UI dispatches the same `Method` enum an external client would** — the TUI has no privileged mutation path — and `request_changes_ui` enumerates in one match everything that can move the UI. Also a bounded, sequence-numbered event ring clients resume from, and agent-state tiers separating an authoritative hook report from a heuristic screen detector from display-only metadata with a TTL |
| `software/open-design` | Apache-2.0 · TypeScript | `packages/contracts/src/api/{files,artifacts,live-artifacts}.ts`, `apps/web/src/edit-mode/{types,source-patches}.ts`, `artifacts/{version-origin,renderer-registry}.ts` | CREATE-07 comparison evidence, with the limitations in the current Open Design flow trace. `ProjectFileVersion` carries `source: 'ai'|'manual'|'restore'`, `contentDigest`, `parentVersionId` and an `ArtifactOrigin` with `entrySurface` — Fleet's provenance need, in a contracts package whose only dependencies are `zod` and its own release helper. Preview isolation is correct: `sandbox="allow-scripts allow-downloads"` with **no** `allow-same-origin`, so the frame is opaque-origin and the host is the sole writer. **Do not take** `FileViewer.tsx` (776 KB) |
| `software/html-anything` | Apache-2.0 · TypeScript | `next/src/components/preview-pane.tsx`, `lib/history/db.ts`, `lib/extract-html.ts`, `lib/security/host-validation.ts` | **Negative finding, recorded so Fleet does not repeat it:** its preview iframe uses `sandbox="allow-scripts allow-same-origin"` on a `srcdoc` frame, which collapses the sandbox — agent-generated script inherits the app origin and can reach the parent window, local storage, the IndexedDB history and the loopback API routes. A Host-header allowlist mitigates DNS rebinding, not same-origin frame access. Fleet's preview must preserve origin isolation; the current Open Design flow trace still limits broader correctness claims. Small port candidates: the IndexedDB version ring and `extractHtml`/`previewHtml` for streamed-LLM HTML recovery (delete its CDN `<script>` injection — local-first) |
| `software/openpencil` | MIT · **Rust** | `crates/op-editor-core/src/{command,command_batch,history,history_snapshot,edit_transaction}.rs` | Pattern only, and **the schema is not in the checkout**: `vendor/jian` is an empty submodule, so `jian_ops_schema::PenDocument` — the canonical `.op` document type — is absent and its licence unknown. Confirms **E11**'s shape (one DTO, one pre-validate-then-mutate apply path, an ordered batch landing as a single undo step, with an exhaustive `batchable()` gate that fails to compile on a new unclassified variant) but **rejects inverse-carrying change records** in favour of structurally-shared snapshots. **Current qualification:** the [production-flow trace](#openpencil) finds native direct-mutator paths and rejects AI/MCP writes during active collaboration; the command-batch finding does not cover every caller |
| `software/flowgram.ai` | MIT · TypeScript | `packages/runtime/{interface,js-core,nodejs}/package.json`, `runtime/interface/src/index.ts`, `canvas-engine/*/package.json`, `common/history/package.json` | **Narrows the existing MODULE_REFERENCE row.** The editor/runtime seam is real *only* for `runtime-interface` (one dependency: `zod`) and `runtime-js` (which keeps the contract as a devDependency and inlines types at build). The **document and history models are not liftable**: `@flowgram.ai/document` and `@flowgram.ai/history` both require `inversify` + `reflect-metadata` + the canvas-engine container. Take the packaging discipline, not the types |
| `software/openreel-video` | MIT · TypeScript (Electron) | `packages/core/src/export/{types,export-engine,encoder-backend,webcodecs-backend}.ts`, `device/export-estimator.ts`, `ai/cloud-job-types.ts` | **R11–R13 export/recovery candidate; stack similarity does not establish superiority.** `ExportEngine.exportVideo` is an `AsyncGenerator<ExportProgress, ExportResult>` polling an `AbortController` inside the frame loop; a closed error union (`CANCELLED | DISK_FULL | MEMORY_EXCEEDED | TIMEOUT | UNSUPPORTED_CODEC`) each carrying `phase` and `recoverable`; on abort the writable stream is discarded so no partial file survives; pre-flight clamping of resolution/frame-rate rather than freezing (**E8**); and an estimator returning `confidence: 'measured'|'estimated'|'rough'`. **Do not take** the bundled **GPL** ffmpeg fetch path — its own `DISTRIBUTION.md` records that as an unfinished legal decision — nor the prebuilt mac-only `.dylib` binaries |
| `software/palmier-pro` | **GPL-3.0** · **Swift**, macOS 26 + Apple Silicon only | `Sources/PalmierPro/Export/{ExportQueue,ExportService,ExportOptions}.swift`, `Models/MediaManifest.swift` | Platform lock confirmed. Historical job-mechanism evidence for **ORCH-05**: an explicit job status machine (`waiting/preparing/exporting/canceling/completed/failed/canceled`), enqueue returning a queue position and **refusing a duplicate destination**, state-aware cancel, and `finish()` always calling `startNext()` so the queue drains rather than stalls. Its staging idiom is a CREATE-12 comparison candidate: write to `.partial`, `defer` its removal, check cancellation, then atomically commit — and refuse to cancel once committed. `MediaManifestEntry` carries `MediaImportInput` **and** `GenerationInput` with references stored as **asset IDs**, making it a real source→operation→output graph |
| `software/OpenMontage` | **AGPL-3.0** · Python | `lib/{delivery_promise,media_profiles,events}.py`, `tools/{base_tool,cost_tracker}.py` | **AGPL; no source import is admitted by this record.** One idea worth re-specifying for CREATE-12: a *delivery promise* that locks what a render claims and refuses a silent downgrade (`still_fallback_allowed: false`, `min_motion_ratio`, and a validator that reports "these are animated slides which do not count as motion"). Also a budget state machine of estimate → reserve → reconcile → refund. It has **no cancellable job**, only stage checkpoints |
| `software/cc-switch` | MIT · TypeScript + **Rust** | `src/config/{piThinkingProfiles,piModelCatalog}.ts`, `src/types.ts` | **E9a** data-semantics candidate: A tri-state reasoning-profile map with the semantics documented in source: **key absent = the model does not support that level; key → `null` = the level exists but sends no wire value; key → string = the wire value; `{}` is reserved for the user's explicit "use provider defaults"**. Plus `CodexChatReasoning { thinkingParam, effortParam, effortValueMode, outputFormat }` declaring *how* reasoning is wired per provider, and `AppConfig { providers, current }` as a single-authority shape. **No wholesale proxy/account rewrite import.** `src-tauri/**` also contains native quota/balance adapters and shared cache services; the current [quota review](#cockpit-tools-and-cc-switch-acquisition-to-display-review) supersedes the earlier blanket exclusion. `UsageScript` constructs HTTP requests and parses responses in bounded QuickJS; it is not selected for Fleet allowance acquisition |
| `software/cockpit-tools` | **CC-BY-NC-SA-4.0** · TypeScript + Rust | `src/services/codexModelProviderService.ts`, `CONTEXT.md`, `src-tauri/Cargo.toml` (licence) | **NonCommercial + ShareAlike; no root LICENSE file** — licence found only in `Cargo.toml` and the README. No direct reuse is admitted while license provenance and the distribution boundary remain unresolved. Two ideas to re-specify independently if wanted: N **named** API keys per connection, and a reference-count check before deleting a connection. **Do not take** its 16-IDE automated check-in/wake-up surface — automating vendor accounts is barred by F1 |
| `software/spec-kit` | MIT · Python + Markdown | `templates/commands/{analyze,converge}.md`, `templates/checklist-template.md`, `templates/spec-template.md`, `scripts/bash/check-prerequisites.sh` | **Process reference only — never a Fleet product capability.** One mechanism Fleet's spec discipline lacks: `analyze.md` is a *strictly read-only* cross-artifact pass that builds a requirements inventory keyed on stable IDs, maps every task to a requirement, and emits a coverage table with counts of ambiguity and critical issues — where a constitution conflict is automatically critical and "requires adjustment of the spec, plan, or tasks — not dilution, reinterpretation, or silent ignoring". Also: checklist markers are a gate the implement step may **read but not write** |

## Source-level intake, 2026-09-10 (owner-directed: product surfaces and capability ownership)

Read at owner direction against the areas Fleet expresses badly. Disjoint from the 2026-08-15
intake above, which covered these same three checkouts on different subtrees — nothing here
restates a row already recorded there. Same rules: a licence that forbids import decides port
target versus specification input. F3 governs license, approved-source and product fit;
TypeScript compatibility alone does not admit code, and another language alone does not reject it.

| Checkout | Licence / language | Exact evidence read | Verdict for Fleet |
|---|---|---|---|
| `software/cindy` | Apache-2.0 · docs | `docs/product-rules/core-product-principles.md` §§1–8; `docs/dev-rules/maker-core-and-agent-behavior.md` §2 | **Source evidence for P11 and PRODUCT's capability boundary.** Describes the division now recorded in Fleet: **Core** carries only what the host must provide for everyone (shell, agent/model connection, session and task lifecycle, Skill/plugin runtime + permission + isolation, multi-device continuity, marketplace mechanism); a **Skill** describes *how work is done*; a **plugin** carries rich interaction. §6 「Core 永远保持纯粹」 bars any personal/team/industry workflow, data connection or interaction surface from Core, behind four conjunctive conditions, and defaults an unclear boundary to "prove it as a Skill or plugin first". §4.1 and §7 forbid replacing structured, operable results with long non-interactive LLM text. `maker-core` §2 requires branching, validation, state machines, orchestration, permission control, error handling, retry and fallback to live in **code**, with prompt carrying only what needs language. The current ruling is P11: Components and Assistant loadouts are distinct; the old expert-kit/label model is superseded |
| `software/cindy` | Apache-2.0 · TypeScript | `apps/desktop/src/main/cindy-brain/skillSlot.ts` (532 lines); `main/maker-host/shared-global-skills.ts` (516) | **Immutable Skill snapshot and reconciliation evidence.** A declared skill reaches the agent as a link in the shared skill root pointing at an **approved snapshot** (`skill-snapshots/<id>/<revision>/<dir>`), never at the mutable install directory, then fanned into the harness's own skill directory. Invariant: 「确认框看到的 = Agent 读到的」 — manifest `skill.items` name/description must be byte-identical to the package's `SKILL.md` frontmatter, and `checkSkillMdConsistency` is the single judge shared by packing and loading, so the two ends cannot drift. Reconciliation is a single idempotent expected-vs-actual pass, so a crash leaves dangling links that self-heal next round; only links whose realpath falls inside one of two managed roots are ever removed. **Candidate invariant, not a port instruction** — it is Node/Electron-specific and assumes Cindy's ghost-plugin model |
| `software/cindy` | Apache-2.0 · TypeScript | `renderer/router.tsx` (170); `components/settings/SettingsView.tsx` (619, 45 `*Section.tsx`); `features/skillhub/` (14,037) | **Navigation discipline, directly answering the owner's "no second-level pages".** Settings is one route with the tab in `?tab=`, composing 45 section components — not 45 detail routes; `billing` is a redirect into it. SkillHub market removed both its full-screen detail page and its separate management page in favour of a floating panel inside the list, and **kept every retired route as a redirect to the list** rather than a 404. That pairing — delete the page, keep the link resolving — is the concrete form of the owner's standing 「简化不等于删除」 rule. Store completeness for comparison: category filter, sort (trending/downloads/latest/created), in-list preview, publish, review verdict, security scan, visibility tiers, team permissions; `components/InstallTargetPicker.tsx` specifies install targets as global (shared by both engines), current project, or chosen directory |
| `software/cindy` | Apache-2.0 · TypeScript | `features/right-sidebar/` (47,609) — `registry.ts`, `RightSidebarShell.tsx`, `plugins/` | **R18 lifecycle comparison evidence; current Craft PanelStack is the implementation starting point.** Tabs render through `getTabKind(kind).TabBody` from an import-side-effect registry; adding a built-in is one line. Tab bodies remain mounted at this layout layer while CSS switches visibility. This does not guarantee browser retention: the bounded browser pool can evict a busy guest; see the current browser comparison above. Third-party plugins register and unregister at runtime as `ghost:<id>` kinds following the installed manifest, with a version-counter subscription so the "+" menu and empty state notice. Nine built-ins: background tasks, file browser, iOS simulator, Orca workers, resource usage, review, subagents, terminal, web browser. The sidebar also detaches into its own window as a route peer to the main layout |
| `software/cindy` | Apache-2.0 · TypeScript | `features/cc-agent/NewMakerDraftRoute.tsx`; `components/new-chat/` (34,448) | **Answers R1's create-flow question.** `/cc-agent/new` is a transient draft with **no backend session** — creation happens on Send. One surface produces both kinds of work: `workingDir=null` **is** the conversation case, folder chosen is the project case, and the route deliberately draws neither a global sidebar nor a project selector. The retired `/new-dialogue` entry redirects here. `lastByVendor` restores each vendor's last model, effort and permission mode across switches; a vendor auth gate runs before send and routes to settings instead of failing at request time; the worktree path creates the session first, then the worktree in background, returning the message to that session's composer draft on failure |
| `software/cindy` | Apache-2.0 · docs | `docs/dev-rules/remote-and-mobile-adaptation.md` | **Failure-isolation evidence for current transport review.** Three remote shapes (SSH workspace via `maker-remote-ssh` + `remote-file-service`; device-link remote control with an IPC allowlist; mobile as a pure control client). Its governing invariant is **failure radius**: failure domains rank as one request / one peer's link / the whole relay connection / relay aggregate backpressure, and a recovery action may not act at a wider radius than the failure, with anything wider requiring a written reason that survives "what happens when one phone sleeps?". Backed by case law — escalating "reliable retry exhausted" into tearing down the whole relay connection passed wire-compat, unit tests and several reviews, then in production one sleeping phone repeatedly knocked every device on the account offline. Records that protocol compatibility, allowlists and unit tests are all immune to this class |
| `software/orca` | MIT · TypeScript | `src/main/rate-limits/` (9,582); `src/main/{claude,codex}-usage/`; `src/shared/{claude-usage-types,usage-percentage-display,status-bar-usage-mode}.ts` | **Usage evidence with distinct acquisition paths.** Some inspected Orca paths read CLI transcripts/credentials or parse a hidden PTY; the current quota comparison separately examines its Codex runtime RPC path. The private-cache/PTY acquisition paths are not Fleet candidates: Fleet must use supported provider/runtime interfaces or explicit user-supplied evidence, never private-cache scraping. Potentially useful display semantics are product-attributed versus account usage, observable scan/error state, nullable estimated cost, cache categories and worktree/run attribution. Invalid provider data must remain unknown, not 100% remaining; choose rounding only after validating units and denominators. No wholesale model or store import is approved. |
| `software/orca` | MIT · TypeScript | `src/main/claude-accounts/{managed-auth-path,runtime-selection}.ts`; `src/main/codex-accounts/` | **Credential-selection mechanism candidate over Fleet's existing credential owner.** Switching an account is selecting a pointer, never overwriting a token. Each account owns `<userData>/claude-accounts/<accountId>/auth/`, proved to be the app's by a marker file containing the account id created `0o600` with an exclusive `wx` flag; every read and write resolves the real path and refuses a symlink, a path outside the managed root, the wrong depth, or a mismatched account id, and writes atomically at `0600`. "Active" is a per-runtime pointer (`activeClaudeManagedAccountIdsByRuntime`: one for host, one per WSL distro). Because inactive accounts keep their own directories, their remaining quota is fetchable — so the user sees which account has headroom **before** switching. Alternative design in `software/cc-switch` (MIT): rewrite the CLI's config plus a local proxy transforming between responses/chat/codex-chat shapes — larger blast radius for that mechanism. This does not exclude reviewing its independent native quota/cache modules, as recorded in the current quota comparison |
| `software/openchamber` | MIT · JavaScript | `packages/web/server/lib/github/{pr-status,auth,device-flow,gh-cli-credential,rate-limit}.js` + its `DOCUMENTATION.md` | **Candidate mechanism within OpenChamber's approved R14 Git/PR remit.** One resolver answers the product question — which PR belongs to this local branch — searching across remotes, forks and upstreams, then enriching with checks, mergeability and permissions; the result is cached once and shared between the session sidebar badge and the full Git view, so both read one entry. Auth is multi-account with an explicit `activateGitHubAuth(accountId)` and an OAuth **device flow** (no client secret in a desktop app); `gh-cli-credential.js` reuses the credentials the user's existing `gh` CLI already holds rather than asking for a pasted token. Storage is `0600` with atomic writes; client id, scopes and account id each have a documented resolution order |
| `software/openchamber` | MIT · JavaScript + TypeScript | `packages/web/server/lib/browser-control/{broker,routes}.js` + its `DOCUMENTATION.md`; `packages/ui/src/lib/browser/` | **Bounded browser-control mechanism evidence.** The server can never act on a page; it publishes one action and waits. Invariants, each naming the failure it prevents: **capability belongs to the connection, not to configuration** — a client declares it can drive a page by opening its event stream with `browser=1`, which only a Chromium host does, so there is no setting to enable and no restart to remember; exactly one client performs a request, claimed over a separate endpoint because deciding by whose result arrives first is too late — by then each has already clicked; nobody listening is answered immediately with a 503 describing the environment, because a blocked wait followed by a timeout cannot be told apart from a hung page; a client that accepted and vanished still times out, because assuming success reports an interaction that never happened. The UI half adds page annotation (overlay, screenshot, prompt, session) so a human can point at the page and hand that to the agent, plus dev-server discovery, dev tunnel and crash recovery |
| `software/OpenChamber` | MIT · TypeScript/React | `packages/ui/src/components/layout/{MainLayout,ContextPanel,ContextPanelRail}.tsx`; `packages/ui/src/components/session/sidebar/{SessionSidebar,sidebar/list/SessionProjectCollection,sidebar/projects/*}` | **Selective layout evidence.** `MainLayout` keeps chat as the primary surface and routes Git, files, terminal, browser and other context tools through one `ContextPanel` + draggable rail; the panel stays mounted while tabs switch, preserving local state. Its session sidebar still contains Recent/Chats and Project-grouped sections, so it is useful evidence for ownership-aware grouping, prefetch and bounded virtualization, but **not** a model to copy for Fleet's navigation: Fleet adopts one Conversation list and treats Project/label/status/archive as predicates, avoiding duplicate conversation homes. OpenChamber supplies Fleet's Git/PR and bounded browser seams; Craft remains the visual authority and Cindy/DeepSeek the component composition references |
| `software/browser-harness` | MIT · Python | `README.md`; `browser-harness`; `agent-workspace/agent_helpers.py`; `docs/MCP.md`; `interaction-skills/` | **Module reference for the browser seam.** The harness exposes one editable CDP websocket, a stdio MCP server and a protected core while domain helpers are authored in the agent workspace; its Skills cover tabs, downloads, uploads, iframes and profiles. Fleet may learn the helper/skill separation and explicit connection failure path, but the built-in BrowserPane remains the user-facing browser authority and this browser seam does not become a universal Core controller. The optional specified-app Component is separately governed by SYS-02/EXEC-15. |
| `software/CLIProxyAPI` | MIT · Go | `README.md`; `docs/sdk-usage.md`; `test/` compatibility and failover tests | **Do not combine into Fleet's core or provider registry.** It is a local Go proxy translating multiple CLI OAuth/account protocols into OpenAI/Gemini/Claude-compatible APIs, with round-robin accounts and a management surface. Fleet already owns provider connections and usage/permission semantics; importing this would create a second model gateway and a subscription-relay product. A user-run proxy can remain an explicit external endpoint through the existing connection adapter, with no Fleet account-token scraping or automatic OAuth reuse. |
| `software/dashi-taskboard` | Apache-2.0 · TypeScript/Rust | `README.md`; `web/`; `src-tauri/`; `skills/manage-taskboard`; `inject/`; `test/` | **Evidence only, not a Fleet board.** It has a real local SQLite issue store, CLI, Skill, optimistic versions, branch/worktree binding and Codex CDP injection. Those are useful tests for agent-visible task transitions and optimistic conflict handling, but its SQLite task authority and implicit injection into another app violate Fleet's one Task authority and explicit selected-app authorization boundary. The R16 local-app Component does not authorize this taskboard to inject or own Sessions. Any retained idea must be implemented as a projection over Fleet Session/Task/Job and Fleet's own panel host. |
| `software/craft-agents-oss` | Apache-2.0 · TypeScript | v0.11.2 → v0.12.0, 97 files / +1751 −545 (bun.lock +560 of it) | **Historical v0.12 observations; these are not a current intake backlog after the v0.13.4 rebuild.** `session-tools-core/handlers/archive-session.ts` + `server-core/sessions/archive-guards.ts` make archive an agent-callable tool with guards rather than a UI-only action (R1 archive/labels). `shared/src/mcp/proxy-tool-name.ts` de-collides tool names across MCP servers — a prerequisite for any kit that projects a tool subset. `app-shell/inherited-filter-params.ts` supplied implicit creation context; current R1 rejects that behavior and uses explicit none/workspace_root context. Filtering existing Sessions must not assign a new Session. `server-core/bootstrap/lock-identity.ts` settles single-instance identity at bootstrap. Plus a startup migration in `shared/src/config/storage.ts`. No new authority in any of them |

## Owner-provided UI captures, 2026-09-10 (QoderWork CN · TRAE SOLO CN) — `EVIDENCE_ONLY`

**Licence status decides what these are.** Both are proprietary commercial desktop applications,
installed on the owner's own machine and captured there at owner direction. There is no licence
permitting reuse of their code or their visual design. They are therefore `EVIDENCE_ONLY` under the
same ceiling as `Kun` and `cockpit-tools`: **information architecture and interaction patterns may
be read and re-specified in Fleet's own terms; markup, styles, assets and visual design may not be
copied, and Fleet must not be made to look like either product.** Nothing in the captures is a port
target.

Captures live at `/Volumes/AIGC/Paper Clone Outputs/app-{qoderwork-cn,trae-work-cn}-2026-09-10T…/`
— renderer DOM over Electron CDP, with recovered stylesheets, an interaction graph, and a
reconstruction. The Qoder capture records 18,285 nodes, 488 localized materials, 4 stylesheets, 87
authored motion rules, 26 hover panels and a causality journal of 14 interactions / 64 reveals.

| Observation | Where | What Fleet does today, and the reading |
|---|---|---|
| **Three-tier token system** — palette (`--color-amber-500`, oklch) → semantic (`--color-bg-{base,layout,container,elevated,highlight,highlight-hover,mask,spotlight}`, `--color-text-{,secondary,tertiary,quaternary}`, `--color-fill-*`, `--color-border-{,secondary,tertiary}`, and a full family per status: `{base,hover,active,bg,bg-hover,border,border-hover,text}`) → component (`--agents-content-area-{bg,gap,radius}`). Four themes ship as alternate values on the semantic layer only | qoder `assets/styles/globals-*.css` (298 KB) | Fleet's `--spacing: .25rem` matches exactly; the structure does not. Fleet has one `--background` with `--card: var(--background)` — **card and page are literally the same value, so there is no elevation** — and expresses depth as `foreground` at an opacity step (UI-SPEC §1/§3). That is a defensible, simpler system and the six-colour rule is enforced by a guard after real violations (H34). The gap worth taking seriously is **surface elevation**: Fleet nests shell → workbench → panel → popover, and with one background token each layer either reads identically or someone reaches for a literal — which is exactly the H34 violation history. Adding elevation is a UI-SPEC authority change and is **not** taken here |
| **Kit cards state the payload as counts** — "8 个技能 · 3 个数据连接 · v1.1.1" in the card footer — and label the **action**, not the state: an installed kit's button reads 「定制此套件」, never "installed" | qoder 专家套件 page | Historical implementation at `fd47db6ae` was removed. The useful requirement is to show resolved payload counts, not a success verdict over an empty array |
| **Market and installed are two counted tabs in one page** — 「套件广场 20 · 已安装 1」 — with horizontal category chips and a `>` overflow scroller, not a dropdown and not a second route | qoder | The former Fleet kit-gallery helpers were removed. Keep the interaction observation as evidence for a future Component catalog, never identity-as-label |
| **The authoring entry sits inside the marketplace banner** — 「+ 让 QoderWork 帮我创建」 — so creating a kit is an offer at the moment of browsing, not a separate flow | qoder | Fleet has no authoring flow. `skills/plugin-creator/SKILL.md` (read 2026-09-10, recorded above) is the conversational contract behind that button |
| **Left nav is flat and the market is one page.** Qoder: 扩展 → {专家套件, 技能, 连接器} as three peers. Trae: 新建任务 / 插件市场 / 模板库 / 自动化 / 办公助理 / 我的文件, no nesting, with a Work / Code / Design mode switcher above it | both | Corroborates the routing discipline already recorded from Cindy's source: settings is one route with `?tab=`, retired detail routes redirect to the list rather than 404 |
| **Trae's market is a conventional app store** — featured carousel, category sections, 3-column compact rows, per-row 「+ 安装」 / 「💬 使用」 | trae | Weaker for Fleet's purpose than Qoder's: it never says what an item carries. Recorded so the comparison is not re-run |

**What this does not license.** Fleet's visual identity, colour count, spacing ladder and motion
rules remain `DESIGN.md` and `DESIGN.md`. Any change to the token structure is an
owner decision against that authority, not something an intake row can settle.

## Video candidate reality check

Revision-locked source symbols and licenses are recorded in the bounded source review above;
current checkout/document observations are recorded separately. OpenCut's present rewrite has a placeholder timeline; opencut-classic has inspectable
command/undo/export mechanisms. OpenReel, Palmier, OpenChatCut and OpenMontage are also present;
older “no checkout” claims no longer apply. These are bounded candidates, not admitted Fleet
editors. The retained discovery pool and remaining gaps are in
[the video inventory](research/video/00-CANDIDATE-INVENTORY.md). Older symbol lists in the July audit require
revalidation against the exact recorded commit, not today's HEAD.

## Named external evidence without a local checkout

These names appear in the product matrix or capability notes but are not present under
`源码参考/software` or `源码参考/plugins`. They can support a product-behavior comparison only;
they have no immutable local source evidence and must not be described as admitted source
references.

| Name | Safe status | Missing before any promotion |
|---|---|---|
| LobeHub product | `PRODUCT_REFERENCE` candidate | dated product-flow capture, same-task comparison, and a clear TipTap local-improvement test |
| `lobehub/lobe-editor` | `MODULE_REFERENCE` candidate | fixed checkout, license/NOTICE, exact editor symbols and TipTap comparison |
| MiniMax Hub / Hilo / TRAEWork analyses | `EVIDENCE_ONLY` | primary source or reproducible capture; public-bundle observations cannot prove source mechanisms |
| ChatCut | `PRODUCT_REFERENCE` candidate | reproducible product capture and explicit separation of observed behavior from vendor claims |
| Remotion | candidate; license gate | fixed checkout and current license terms for target distribution |
| Unabyss | `PRODUCT_REFERENCE` only | product behavior can inform source/structure/grant/freshness decomposition; no public source, no MCP-first internal architecture, and no hosted dependency admission |

## Per-project adaptation routes

This table is the canonical second-development routing map. The bounded source-review row above
owns each repository's origin, historical review revision, inspected paths/symbols, license and
candidate/rejected mechanisms. The current intake table separately owns refreshed SHA, upstream
documentation and new observations. The linked capability section owns Fleet code entry points, data/failure contract,
implementation/proof order and acceptance. A route means **where to evaluate the evidence**, not
that every named source must be copied or added as a dependency.

Each retained Git checkout receives an owner-requested, generated `FLEET-ADAPTATION.md` at its
root. It projects this route, the separate source revisions and documentation intake, linking upstream files and
Fleet contract, and is not an independently maintained plan. Regenerate with
`python3 scripts/reference-guides.py --write`; verify with `python3 scripts/reference-guides.py --check`.
The generator refuses unrecorded HEADs, missing/escaping documentation, occupied non-generated paths
and missing contracts. Do not change a historical source lock to make generation pass: record and
inspect the new checkout separately. Reference
source, refs, existing local changes and license notices remain untouched. Generated guide files
are expected local reference metadata, not upstream source modifications or intake completion.

For C/M/X and restricted-license projects, read the rejection boundary before attempting extraction.
No guide upgrades a mechanism into an approved dependency, a standalone product fork, or permission
to modify this reference checkout's implementation. Any admitted extraction lands in Fleet through
the linked owner; a requested independent product fork needs its own explicit scope.

| Checkout | Fleet execution contracts |
|---|---|
| `software/craft-agents-oss` | [CORE-01](modules/agent-core.md#execution-core-01), [CORE-02](modules/agent-core.md#execution-core-02), [CORE-03](modules/agent-core.md#execution-core-03), [EXEC-01](modules/agent-core.md#execution-exec-01), [INFO-03](modules/browser.md#execution-info-03) |
| `software/craft-agents-oss-v0.10.5` | [CORE-01](modules/agent-core.md#execution-core-01), [CORE-10](modules/agent-core.md#execution-core-10), [CORE-11](modules/components.md#execution-core-11) |
| `software/cindy` | [CORE-11](modules/components.md#execution-core-11), [ORCH-03](modules/components.md#execution-orch-03), [ORCH-11](modules/marketplace.md#execution-orch-11), [INFO-03](modules/browser.md#execution-info-03), [EXEC-14](modules/context.md#execution-exec-14) |
| `software/openchamber` | [EXEC-13](modules/remote.md#execution-exec-13), [EXEC-07](modules/remote.md#execution-exec-07), [INFO-03](modules/browser.md#execution-info-03), [INTEL-04](modules/context.md#execution-intel-04) |
| `software/deepseek-harness` | [ORCH-03](modules/components.md#execution-orch-03), [ORCH-11](modules/marketplace.md#execution-orch-11), [CORE-11](modules/components.md#execution-core-11) |
| `software/AionCore` | [CORE-03](modules/agent-core.md#execution-core-03), [EXEC-05](modules/agent-core.md#execution-exec-05), [ORCH-06](modules/agent-core.md#execution-orch-06) |
| `software/AionUi` | [EXEC-14](modules/context.md#execution-exec-14), [INTEL-03](modules/context.md#execution-intel-03), [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `software/CLIProxyAPI` | [EXEC-05](modules/agent-core.md#execution-exec-05), [INTEL-03](modules/context.md#execution-intel-03) |
| `software/codex` | [EXEC-01](modules/agent-core.md#execution-exec-01), [EXEC-05](modules/agent-core.md#execution-exec-05), [INTEL-04](modules/context.md#execution-intel-04) |
| `software/grok-build` | [EXEC-14](modules/context.md#execution-exec-14), [EXEC-05](modules/agent-core.md#execution-exec-05), [INTEL-03](modules/context.md#execution-intel-03) |
| `software/herdr` | [EXEC-05](modules/agent-core.md#execution-exec-05), [ORCH-06](modules/agent-core.md#execution-orch-06) |
| `software/hermes-agent` | [INTEL-05](modules/context.md#execution-intel-05), [EXEC-11](modules/remote.md#execution-exec-11), [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `software/kimi-code` | [EXEC-05](modules/agent-core.md#execution-exec-05), [INTEL-01](modules/context.md#execution-intel-01) |
| `software/Kun` | [EXEC-05](modules/agent-core.md#execution-exec-05), [ORCH-06](modules/agent-core.md#execution-orch-06) |
| `software/multica` | [CORE-04](modules/agent-core.md#execution-core-04), [EXEC-04](modules/agent-core.md#execution-exec-04), [ORCH-06](modules/agent-core.md#execution-orch-06) |
| `software/omnigent` | [EXEC-05](modules/agent-core.md#execution-exec-05), [EXEC-14](modules/context.md#execution-exec-14) |
| `software/openclaw` | [INTEL-05](modules/context.md#execution-intel-05), [EXEC-11](modules/remote.md#execution-exec-11), [INTEL-01](modules/context.md#execution-intel-01) |
| `software/opencode` | [EXEC-04](modules/agent-core.md#execution-exec-04), [EXEC-01](modules/agent-core.md#execution-exec-01), [INTEL-02](modules/context.md#execution-intel-02) |
| `software/OpenHands` | [CREATE-01](modules/canvas.md#execution-create-01), [ORCH-01](modules/workflow.md#execution-orch-01) |
| `software/orca` | [EXEC-15](modules/remote.md#execution-exec-15), [EXEC-05](modules/agent-core.md#execution-exec-05), [INTEL-04](modules/context.md#execution-intel-04) |
| `software/pi-mono` | [EXEC-05](modules/agent-core.md#execution-exec-05), [INTEL-01](modules/context.md#execution-intel-01), [INTEL-02](modules/context.md#execution-intel-02) |
| `software/waku` | [EXEC-05](modules/agent-core.md#execution-exec-05), [EXEC-03](modules/agent-core.md#execution-exec-03) |
| `software/ZCode` | [CORE-05](modules/agent-core.md#execution-core-05), [ORCH-11](modules/marketplace.md#execution-orch-11), [EXEC-05](modules/agent-core.md#execution-exec-05) |
| `software/cc-switch` | [INTEL-04](modules/context.md#execution-intel-04), [INTEL-03](modules/context.md#execution-intel-03) |
| `software/cockpit-tools` | [INTEL-04](modules/context.md#execution-intel-04), [CORE-05](modules/agent-core.md#execution-core-05) |
| `software/dashi-taskboard` | [CORE-04](modules/agent-core.md#execution-core-04), [EXEC-02](modules/agent-core.md#execution-exec-02) |
| `software/OpenSandbox` | [EXEC-08](modules/agent-core.md#execution-exec-08) |
| `software/spec-kit` | [INTEL-07](modules/context.md#execution-intel-07) |
| `software/Cowart` | [CREATE-01](modules/canvas.md#execution-create-01), [CREATE-03](modules/media.md#execution-create-03), [INFO-03](modules/browser.md#execution-info-03) |
| `software/genoffice` | [INFO-05](modules/canvas.md#execution-info-05), [CREATE-08](modules/media.md#execution-create-08) |
| `software/html-anything` | [INFO-04](modules/browser.md#execution-info-04), [CREATE-07](modules/canvas.md#execution-create-07) |
| `software/open-design` | [CREATE-06](modules/canvas.md#execution-create-06), [CREATE-07](modules/canvas.md#execution-create-07), [INFO-02](modules/browser.md#execution-info-02) |
| `software/openpencil` | [CREATE-06](modules/canvas.md#execution-create-06), [INFO-05](modules/canvas.md#execution-info-05) |
| `software/penpot` | [CREATE-06](modules/canvas.md#execution-create-06) |
| `software/tldraw` | [CREATE-01](modules/canvas.md#execution-create-01), [CREATE-06](modules/canvas.md#execution-create-06) |
| `software/OpenChatCut` | [CREATE-02](modules/media.md#execution-create-02), [ORCH-05](modules/media.md#execution-orch-05), [CREATE-12](modules/media.md#execution-create-12) |
| `software/OpenMontage` | [CREATE-10](modules/media.md#execution-create-10), [CREATE-12](modules/media.md#execution-create-12) |
| `software/opencut` | [CREATE-02](modules/media.md#execution-create-02) |
| `software/opencut-classic` | [CREATE-02](modules/media.md#execution-create-02) |
| `software/openreel-video` | [CREATE-02](modules/media.md#execution-create-02), [CREATE-04](modules/media.md#execution-create-04), [ORCH-05](modules/media.md#execution-orch-05) |
| `software/palmier-pro` | [CREATE-02](modules/media.md#execution-create-02) |
| `plugins/dockview` | [CORE-11](modules/components.md#execution-core-11) |
| `plugins/react-resizable-panels` | [CORE-11](modules/components.md#execution-core-11) |
| `plugins/react-rnd` | [CORE-11](modules/components.md#execution-core-11) |
| `plugins/xyflow` | [CREATE-01](modules/canvas.md#execution-create-01) |
| `plugins/hyperframes` | [CREATE-09](modules/media.md#execution-create-09), [CREATE-12](modules/media.md#execution-create-12), [ORCH-05](modules/media.md#execution-orch-05) |
| `plugins/markitdown` | [INFO-04](modules/browser.md#execution-info-04), [INFO-08](modules/browser.md#execution-info-08) |
| `software/browser-harness` | [INFO-03](modules/browser.md#execution-info-03) |
| `software/browser-use` | [INFO-03](modules/browser.md#execution-info-03), [EXEC-01](modules/agent-core.md#execution-exec-01) |
| `software/flowgram.ai` | [ORCH-01](modules/workflow.md#execution-orch-01), [CREATE-01](modules/canvas.md#execution-create-01) |
| `software/mcp-registry` | [ORCH-12](modules/marketplace.md#execution-orch-12), [ORCH-04](modules/marketplace.md#execution-orch-04) |
| `plugins/GPTCache` | [INTEL-02](modules/context.md#execution-intel-02) |
| `plugins/LLMLingua` | [INTEL-02](modules/context.md#execution-intel-02) |
| `plugins/SuperClaude_Framework` | [INTEL-07](modules/context.md#execution-intel-07) |
| `plugins/agentmemory` | [INTEL-05](modules/context.md#execution-intel-05) |
| `plugins/agentskills` | [INTEL-06](modules/context.md#execution-intel-06), [ORCH-10](modules/marketplace.md#execution-orch-10) |
| `plugins/caveman` | [INTEL-02](modules/context.md#execution-intel-02) |
| `plugins/claude-mem` | [INTEL-05](modules/context.md#execution-intel-05) |
| `plugins/claude-task-master` | [CORE-04](modules/agent-core.md#execution-core-04), [EXEC-04](modules/agent-core.md#execution-exec-04) |
| `plugins/claude-token-efficient` | [INTEL-02](modules/context.md#execution-intel-02) |
| `plugins/claw-compactor` | [INTEL-01](modules/context.md#execution-intel-01), [INTEL-02](modules/context.md#execution-intel-02) |
| `plugins/context7` | [INFO-06](modules/browser.md#execution-info-06), [ORCH-12](modules/marketplace.md#execution-orch-12) |
| `plugins/letta` | [INTEL-05](modules/context.md#execution-intel-05) |
| `plugins/mem0` | [INTEL-05](modules/context.md#execution-intel-05), [INTEL-07](modules/context.md#execution-intel-07) |
| `plugins/planning-with-files` | [EXEC-14](modules/context.md#execution-exec-14) |
| `plugins/playwright-mcp` | [INFO-03](modules/browser.md#execution-info-03), [ORCH-04](modules/marketplace.md#execution-orch-04) |
| `plugins/repomix` | [INFO-06](modules/browser.md#execution-info-06), [INTEL-02](modules/context.md#execution-intel-02), [ORCH-10](modules/marketplace.md#execution-orch-10) |

## Required promotion record

Before any candidate is promoted in the product matrix or a module packet, add a row to the
admission record with all of the following:

1. repository URL, immutable commit and checkout path;
2. exact license/NOTICE and whether the target distribution is permitted;
3. exact files, symbols, caller and tests that prove the mechanism;
4. the concrete Fleet/Craft gap, the owning software's native facilities, a small local correction
   and at least one relevant same-task alternative;
5. the mechanism-to-seam mapping and demonstrated benefit after integration/maintenance cost;
   compare frontend and backend separately and admit only the part that wins;
6. failure, cancellation, recovery and deletion implications;
7. dated same-task evidence (observed interaction or relevant failure/data-path tests; measured
   performance where claimed) and a traceable admission decision; obtain owner approval
   where the existing source, production-dependency or authority checkpoint applies. A particular
   model or CLI is not required to perform the review.

Until all seven are present, use `candidate`, `INSUFFICIENT_COMPARISON` or `EVIDENCE_ONLY` as
appropriate. A row in `CAPABILITY-REFERENCE-MAP.md` or `capabilities.md` is a pointer, not
evidence.

## Owner-provided product reverse-analysis reports (EVIDENCE_ONLY)

These are analysis documents, not local checkouts: no commit, no license to import, no code
copying. They ground product/mechanism decisions only.

| Report | Subject | Status | Grounds consumed by |
|---|---|---|---|
| [`canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md`](research/canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md) | Mayi Canvas v3.4.4 — custom DOM+translate3d+SVG infinite canvas; node/port/connection system; performance mode, workers, object pools; local HTTP agent bridge with self-describing capabilities, allowlisted/batch actions, and token; provider proxy layer; project ZIP format | `EVIDENCE_ONLY` | Decision E5a (DOM-family + in-family fallback), `architecture.md` §§4.5/7, matrix canvas/AIGC rows |
| [`plugins/00-MINIMAX-HUB-PLUGIN-STACK.md`](research/plugins/00-MINIMAX-HUB-PLUGIN-STACK.md) | MiniMax Hub 1.1.1 six official plugins — iframe sandbox, postMessage protocol-v2, `window.hub` SDK, BlobRef upload, placeholder→dag→insert with permanent IDs, three implementation patterns, host requirements | `EVIDENCE_ONLY` | `architecture.md` §§3/7 module registration, matrix plugins/extensions rows, R15 SYS-08 packet |

## Owner-requested six-repo scan (README + licence; two already source-reviewed)

Owner asked whether these six GitHub projects have reference or combination value. Verdicts
follow [`product.md`](product.md): no second kernel, no second task store, no universal
Core computer controller, no second OS sandbox, no telemetry as a product feature. The optional
R16 specified-app Component follows SYS-02/EXEC-15 and does not adopt these products wholesale. The verdicts concern
these products and their integration boundaries, not a language prohibition under F3.

| Repo | Licence / language | What it actually is | Verdict |
|---|---|---|---|
| [Niall-Young/Canvasight](https://github.com/Niall-Young/Canvasight) | MIT · TypeScript · Codex plugin | Task/asset DAG canvas (`Page → Group → Task/Asset`) that a person and Codex edit, then Run into the *current Codex task*. Concurrent merge + conflict-copy pages. Not a production image/video/web/PPT board. | **`EVIDENCE_ONLY` for Fleet's own canvas collab** (same-board edit, graph write, conflict copies, assets as first-class nodes). Do not install it, do not inject Codex, do not make the Fleet canvas a task DAG for an external agent. Production canvas stays Fleet's. |
| [router-for-me/CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) | MIT · **Go** | Local proxy that turns CLI OAuth subscriptions (Claude Code, Codex, Gemini, Grok Build, …) into OpenAI/Claude/Gemini-shaped HTTP APIs, with multi-account round-robin. | **Do not combine as a built-in gateway.** Fleet already has provider OAuth. Building this in would be a second model gateway and a ToS-sensitive “subscription as API” product. A person may point Fleet at a proxy they already run; that is an optional remote connection, not a Fleet capability. |
| [chuspeeism/dashi-taskboard](https://github.com/chuspeeism/dashi-taskboard) | Apache-2.0 · TS + Rust/Tauri | Local-first issue board with SQLite, `taskctl` CLI, a Skill so Codex can move issues, and **CDP injection into ChatGPT.app**. Optional Cloudflare share. | **Reject as a surface.** Second task/issue store (P10 / one Task authority). CDP inject is general external-app control. LAN mode has no auth. Keep only the *shape* of “agent moves an issue through a Skill on the existing store” — implement on Fleet Session/Task, never this board. |
| [opensandbox-group/OpenSandbox](https://github.com/opensandbox-group/OpenSandbox) | Apache-2.0 · Go+Python | Docker/K8s sandbox control plane + in-sandbox daemon. Already source-reviewed at `f8ed8734ce1f`. | **Second-sandbox integration remains excluded.** `product.md` forbids a second OS sandbox. A second sandbox stays excluded; EXEC-08 verifies inherited isolation under R0/R2. If isolation is ever reopened, the reference is omnigent's daemonless per-spawn seam, not this. |
| [trailhq/Graft](https://github.com/trailhq/Graft) | MIT · TypeScript | Local markdown+tree-sitter codebase graph (`graft/`) so coding agents stop re-exploring. Wires Claude Code/Cursor/Codex via hooks/MCP. Opt-out telemetry. | **`EVIDENCE_ONLY` for SYS-03** (durable repo map, blast radius, “onboard once”). Do not take the other-agent hook wiring or telemetry. Do not stand up a second context authority. A later context-economy slice may port the *idea* (files on disk the agent greps) into Fleet's own routing, not install Graft. |
| [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) | MIT · TypeScript | “Everything is a plugin” Cordis microkernel. Already source-reviewed; Decision **E14**. | **Unchanged: do not rebuild Fleet on it.** Admitted only: service definition/provider/consumer vocabulary, per-session composition invariants, “enforce in the operation that decides”. Rejected: Cordis as root, 167-package split, live self-modification. Combining it as the runtime would be a second kernel. |

## Owner-requested Cowart clone (2026-09-11)

Historical observation: `源码参考/software/Cowart` @ `47206ab` (2026-09-09). The current `43fc8882daf2` review appears above; the later SHA does not retroactively validate this observation. Cowart **MIT**; renderer depends on **tldraw ^5.1.1** (production license gate — same as existing tldraw row). Ships GA4 (`G-SJYHV19YZ9`); telemetry is out of product.

| What it is | Verdict |
|---|---|
| Codex-native infinite-canvas **plugin**: tldraw widget + MCP + three skills. Persist under the *user project* `canvas/pages/<id>/`. AI 图片框 (prompt + refs → replace holder), annotation screenshot → clean image beside original, AI HTML 16:9 embed, AI Slides (pages + fullscreen). MCP: `get/save_cowart_canvas_state`, `get_cowart_selection`, `insert_cowart_image`, `insert_cowart_html_draft`, widget render. | **Bounded production-board interaction reference** (one board for image / HTML-site / deck). Closer to [`product.md`](product.md) than Canvasight (task DAG) or Craft Pages (mini-apps). **Do not install, do not weld to Codex, do not import tldraw, do not take GA4.** When R7 is built: compare the *holder → generate → replace*, *annotate → revise beside*, *HTML/Slides as canvas objects*, and *project-local canvas/ storage* into Fleet's pane — person and agent edit the same board. Not this slice. |
