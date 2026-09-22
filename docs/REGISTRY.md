# Registry — components, plugins and Skills

How components, plugins and Skills are packaged, validated and distributed. The product rules for
Components are in [`PROJECT-SPEC.md`](PROJECT-SPEC.md); the build rules in
[`COMPONENT-GUIDELINES.md`](COMPONENT-GUIDELINES.md). Decisions P4 and P11 in
[`DECISIONS.md`](DECISIONS.md) fix identity and distribution.

Product scope and terms live in `../PROJECT-SPEC.md` and P11 in `../DECISIONS.md`; host and
installation contracts live in SYS-09, SYS-08 and the active spec. This note preserves unique
source observations only. The superseded M12/Wave contract and duplicate adapter plan have been
absorbed into those homes and removed; Git history retains the original text.

## 16. Package compatibility candidates

The marketplace comparison is recorded in
[`../references/marketplaces/00-MARKETPLACE-BENCHMARK.md`](#marketplace-benchmark).
It is evidence for a future adapter, not current Fleet implementation. Current Craft Skill and
Source stores survive; `packages/shared/src/components/`, `ComponentManifest`, the resolver and
bundle adapter do not. No schema-superset, signed-package or four-format compatibility claim is
established by this note.

Useful candidate rules are: inspect actual package contents, merge declared and conventional paths,
preserve unknown metadata and source provenance, and route installation through one permission
and ownership path. Exact manifests and publishing versions must be checked with real packages
when R15 activates. The required order is the baseline exit → local Component host → adapter and
local install → catalog/distribution; this source note cannot override it.

### 16.6 Measured: inherited activation metadata loss in the collected sample

**Current correction:** the loader now keeps `rawFrontmatter` and names `unsupportedMetadataKeys`.
`SkillInfoPage` exposes the inactive-field reason. Foreign triggers remain unimplemented and inert;
loading the instructions is not activation compatibility. The test is
`app/packages/shared/src/skills/__tests__/metadata-honesty.test.ts` (from the repository root).

The measurements below are dated source evidence, not a current installed-package count or proof
of implemented import behavior. Reproduce them against the selected checkout before changing activation.

**398 real `SKILL.md` files across the reference set were parsed on 2026-09-21.** Frontmatter keys,
by frequency:

| Key | Files | Fleet reads it? |
|---|---|---|
| `description` | 397 | yes |
| `name` | 396 | yes |
| `triggers` | **220** | **no** |
| `od:` (vendor namespace block) | 245 nested keys | **no** |
| `tags` | 61 | **no** |
| `zh_name` / `en_name` / `zh_description` / `en_description` | 61–65 | **no** |
| `emoji` | 24 | **no** (Fleet has `icon`) |
| `version` | present in bundle-published skills | **no** |
| `globs`, `alwaysAllow`, `requiredSources`, `icon` | Fleet-specific | yes |

At that measurement, `packages/shared/src/skills/storage.ts:82-88` built `SkillMetadata` from an **explicit six-key
whitelist**. Other fields were omitted from the runtime metadata without a warning; this parser does not delete
them from the source SKILL.md. The skill still loads — `name` and
`description` are present — so nothing appears broken, while **activation metadata used by 55% of this collected sample is absent from the parsed runtime record**. Fleet's `globs` is a file-pattern trigger; `triggers` is a
natural-language phrase list. They are not substitutes.

Vendor keys are not a universal Skill standard; unknown fields must not become executable
activation rules or permission grants without a validated adapter. Three requirements follow:

1. **Preserve unknown frontmatter instead of whitelisting it.** Keep the parsed record and expose
   the unrecognized remainder. `od:` shows the vendor-namespace pattern already exists in
   frontmatter, mirroring `extensions` in the neutral JSON schema; dropping it discards the exact
   data a foreign client needs to keep working after a round trip through Fleet.
2. **Read `triggers` as a first-class activation input** alongside `globs`, or state in the UI that
   an imported skill's triggers are not honored. Silently ignoring it is the failure mode this
   project has a non-negotiable against: a boundary reported by failing quietly.
3. **Preserve locale metadata for a validated adapter.** Fleet ships `zh-Hans`; the sample contains
   `zh_name`/`zh_description`. Display fallback and field validation still need a bounded contract;
   neither localized names nor unknown vendor keys change stable identity or permission.

The earlier draft claimed `bundle-adapter.ts`, `ComponentContribution`, `vendor`,
`componentSourceKey` and `integrity` were implemented. They are absent after the reset. The useful
requirements are to preserve unsupported activation metadata without pretending to execute it,
and verify immutable source/content provenance without requiring a Fleet signing service. Their
actual fields and code belong to the future adapter contract, not this historical note.

### 16.7 Cindy — what a real store looks like, and the attack it documents

Read 2026-09-21 at `源码参考/software/cindy` @ `00a5ad1a5`:
`apps/desktop/src/shared/{pluginMarket,skillhubCatalog,skillhubIdentityPolicy}.ts`.

Cindy runs a **server-backed hub**: `skillhubIdentityPolicy.ts` requires sign-in
(`readOnlyReason: 'signed-out'`), distinguishes `personal` from `org` membership, and gates
visibility to `PUBLIC` / `DEPARTMENT_SCOPED` / `PRIVATE`, with a comment stating that authorization
and org policy "remain server-owned". Catalog scopes are `market` and `team`.

**Fleet cannot copy that layer — P4 forbids the account — and must not pretend otherwise.** What is
transferable is everything built *around* it:

| Mechanism | Why it transfers |
|---|---|
| `PluginMarketItemSource = 'server' \| 'git-market' \| 'local-market'` and `PluginMarketScope = 'public' \| 'organization' \| 'personal'` | Multiple catalogs coexist in **one** list. a candidate Fleet catalog could project local/default/Git sources without a separate UI per source; its schema is not implemented |
| `PluginMarketSnapshot { items, unavailableReason, customSourceNames, unavailableCustomSourceNames }` | Degradation is **in the data model**, not an error path. When discovery fails the renderer keeps local plugins and shows a non-blocking notice, and a failing source is named without taking down the others |
| `installState: 'not-installed' \| 'installed' \| 'update-available' \| 'conflict'` | `conflict` is a first-class state, not an exception |
| `expectedReleaseId`, `expectedManifest`, `expectedInstalledApproval` | Optimistic-concurrency guards: the main process **re-verifies before downloading and before packing**, and rejects if install state changed between the user's read and the write |
| `allowSourceReplacement`, true only on an explicit "replace" click | **Updates and bulk updates may never switch a plugin's source.** This is the supply-chain guard that makes automatic updates safe |
| `customIconKey`, carrying "no local path or bytes" | The renderer never receives filesystem paths for third-party assets |

**The source-identity attack documented in the inspected Cindy code:**

> A catalog's name comes from its own `marketplace.json` and is **self-declared and reusable**.
> Remove source A, add a different source B that calls itself the same name, and the synthesized
> plugin IDs are identical — so an unrelated or hostile repository can "update" the plugins A
> installed. The install ledger must therefore record a **source fingerprint** as well, and
> ownership checks must match both.

With a second requirement that is easy to get wrong:

> The fingerprint must serialize **unambiguously**. Separator joining produces constructable
> collisions — `sparsePaths: ['a,b','c']` and `['a','b,c']` collide under `join(',')`; `ref:'x'`
> with `['p']` and `ref:'x:p'` with `[]` collide under `#ref:sparse`. Two different sources are then
> judged identical and the ownership check is defeated. JSON array serialization delimits every
> element and has no such ambiguity.

An unambiguous candidate fingerprint is `JSON.stringify(['local', path])` or
`JSON.stringify(['git', url, ref ?? null, sparsePaths])`, and the same dimensions
(type + location + ref + sparse paths) must be used everywhere a source is compared.

### 16.8 ZCode — the cross-machine half that P11 was missing

Read 2026-09-21 at `源码参考/software/ZCode` @ `872ad96`:
`packages/shared/src/{plugin-marketplaces,plugin-sync,skill-sync,skill-scan-policy}.ts`.

ZCode supplies an inspected example addressing the question P7 forces on us: **when the agent runs on
another machine, whose skills and plugins apply?** Its answer is that they are the remote machine's,
and moving them is an explicit user act with a real protocol:

1. **List local candidates** — `PluginSyncCandidate` carries `sizeBytes`, `enabled`, and
   `componentTypes: 'skills' | 'commands' | 'hooks' | 'mcp'`, a package-content decomposition to compare with
   the future Fleet adapter, alongside `maxArchiveBytes`.
2. **Query remote status first** — `PluginSyncRemoteStatus { exists, path?, reason?: 'samePluginId' | 'targetExists' }`.
   The user is told *why* an item will be skipped **before** anything is sent.
3. **Export an archive**, then **import with per-item outcomes** — `'synced' | 'skipped' | 'failed'`
   plus a per-item `error`. A multi-item transfer can report partial completion; each accepted
   package still needs atomic activation.
4. **Marketplace *sources* sync too**, not just artifacts, so the remote machine gets the catalog
   rather than a pile of orphaned installs.

Size limits are enforced at **three phases** — `selected-content`, `archive`, `extracted-content` —
under one error code. Checking only the compressed archive would let a decompression bomb through.

Its default catalog is `cdn-zcode.z.ai/.../marketplace.json`, but the design note that matters is
the merge: **"local seed shards and CDN shards are merged inside Agent storage."** That is how a
store is populated on first run without becoming a hard network dependency — the correction applied
to the package compatibility boundary and P11.

`skill-scan-policy.ts` is small and every line of it is a scar worth inheriting:

- Skipping only dot-directories is **not enough**. Recursing into `node_modules` and friends blew a
  single `skills.list` out to a measured **69–256 seconds on Windows**. The excluded set is
  `node_modules, dist, build, out, target, vendor, coverage, .cache, .next, .turbo, .venv, __pycache__`.
- `MAX_SKILL_SCAN_DEPTH = 8`, as a brake on symlink/junction-formed deep chains. Real layouts are
  `root/<name>/SKILL.md` or `root/<group>/<name>/SKILL.md`.
- Dot-directories are skipped by default **so vendored `.agents` / `.cursor` copies and symlink
  mirrors are not listed twice** — the exact hazard Fleet has, since `源码参考/` is a symlink.
- The policy is **pure, I/O-free, and shared** between the desktop's recursive scan and the agent
  CLI's single-level scan, "so the two ends never disagree about which directories to enter".
  Fleet has the same split — Electron main and the remote/CLI harness — and needs the same shared
  policy or the two will report different skill sets for one machine.

## Where the retained findings apply

P11 and [SYS-08](features/SYS-08-marketplaces.md) own package/catalog delivery;
[SYS-09](features/SYS-09-workspace-compositions.md) owns host activation. The source
comparisons above do not freeze a four-format adapter, `ComponentManifest` schema, remote sync
protocol or catalog rollout. No Fleet marketplace or seeded catalog is implemented in this tree.
An offline seed is a candidate under P11, not a second first-slice commitment in this note.

## Marketplace benchmark

Audit date: 2026-07-17. These are product and governance observations, not code-admission records.
The implementation must still pass the source/license/same-task/deletion tests in
[`../REFERENCES.md`](REFERENCES.md).

### Observed patterns

| Product | Evidence | Mechanisms worth absorbing | What Fleet must improve or reject |
|---|---|---|---|
| Codex Plugins | [OpenAI Plugins in Codex](https://help.openai.com/en/articles/20001256-plugins-in-codex/) | plugin bundles skills and approved apps; required/optional dependencies; role-based availability; action/data controls; refresh from origin; low-risk test before publish | use one Fleet manifest and one PermissionDecision; add exact version, rollback, provenance and offline behavior instead of a thin enable/disable toggle |
| Cursor Marketplace | [Marketplace](https://cursor.com/marketplace), [plugin announcement](https://cursor.com/blog/marketplace) | one plugin can bundle skills, subagents, MCP servers, hooks and rules; curated/featured discovery; install in editor; team marketplaces; automations built from installed plugins | do not treat a bundle as an authority; expose each primitive's permissions, caller, data scope and failure path; separate public, private and local catalogs |
| Claude Code / Claude Cowork | [MCP integrations](https://docs.anthropic.com/en/docs/claude-code/mcp), [agent templates](https://www.anthropic.com/news/finance-agents) | connectors provide governed data access; plugins/templates combine skills, connectors and subagents; CLI installation and explicit tool permissions; admin-managed marketplaces | preserve the transparent approval boundary; do not copy vendor-specific distribution or imply a hosted marketplace is required for local-first use |

### Fleet decisions

1. **Three catalogs, one package model.** Skill, Plugin and MCP catalogs have distinct detail and
   risk views, but share `MarketplacePackage`, `Manifest`, `CapabilityGrant`, `InstallReceipt`,
   `UpdatePlan` and `UninstallReceipt` contracts.
2. **Bundle is a projection.** A plugin may contain skills, subagents, MCP servers, hooks and rules,
   but every contained primitive is separately inspectable, permissioned, versioned and removable.
3. **Trust before discovery.** Catalog ranking never outranks signature/provenance/license,
   compatibility, permissions, network/data scope, maintainer history and security review.
4. **Local-first source choices.** Built-in, local-folder, Git repository, signed archive and
   remote catalog are explicit origins. A remote catalog is optional and cannot be the only way to
   install or recover a package.
5. **Install is a transaction.** Resolve dependencies → show capabilities and risk → approve grant
   → stage in an isolated location → validate health → activate loadout → write InstallReceipt.
   Failed activation rolls back the staged package and leaves the old version active.
6. **Updates are not silent.** A changed permission, tool list, prompt, hook, network domain or
   credential requirement creates a new review event even when the semantic version is unchanged.
7. **Marketplace quality is measurable.** Each listing exposes compatibility, last verification,
   test fixture, permissions, data handling, update cadence, maintainer, provenance, license and
   uninstall behavior. Reviews cannot override failed verification.

### Top-tier open-source implementation evidence

| Source at fixed revision | Exact mechanism | Fleet use |
|---|---|---|
| Agent Skills `38a2ff82958a` | `docs/specification.mdx` and client guidance define `SKILL.md`, optional resources and staged progressive disclosure | reuse the open format and on-demand loading; apply Fleet policy and receipts around executable resources |
| MCP Registry `29e32c39dcb5` | typed server metadata, namespace/auth verification, version transactions, validation and integration tests | catalog/publication adapter only; do not equate registry presence with installation trust |

These two supply the format/registry mechanisms evaluated here. Vendor marketplaces above remain product behavior
evidence, not source architecture. Other references keep their owner-controlled retention; intake still needs a concrete gap and a
comparison with a small Craft extension.

### Verified on-disk interop contract (2026-09-21)

The 2026-07-17 rows above were read from vendor **documentation**. This section was read from a
**working multi-ecosystem implementation**: `源码参考/software/openclaw` @ `f7dae76bee9`,
`src/plugins/bundle-manifest.ts` (542 lines) and `src/plugins/marketplace.ts` (1295 lines). It
replaces guesswork about what a "Codex plugin" or "Cursor plugin" physically is.

#### One normalized manifest, four adapters

OpenClaw reads four bundle layouts and normalizes every one into a single internal shape
`{id, name, description, version, skills[], settingsFiles[], hooks[], bundleFormat, activation, capabilities[]}`:

| `bundleFormat` | Manifest path | How capabilities are discovered |
|---|---|---|
| `agent` | `plugin.json` at root | **Neutral open standard.** Rejected unless `$schema` is exactly `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`. Skills = `skills/` dir; MCP = `mcp.json` presence. Client behavior rides in `extensions["<reverse.domain>"]` |
| `claude` | `.claude-plugin/plugin.json` | Richest set: `skills`, `commands`, `agents`, `outputStyles`, `hooks` (default `hooks/hooks.json`), `mcpServers` (default `.mcp.json`), `lspServers` (default `.lsp.json`), `settings.json`. Declared paths merge with existing defaults |
| `codex` | `.codex-plugin/plugin.json` | `skills` (default `skills/`), `hooks` (default `hooks/`), `mcpServers` (default `.mcp.json`), `apps` (default `.app.json`) |
| `cursor` | `.cursor-plugin/plugin.json` | `skills` (+ `.cursor/commands`), `subagents`/`agents` (+ `.cursor/agents`), `hooks` (+ `.cursor/hooks.json`), `rules` (+ `.cursor/rules`), `mcpServers` (+ `.mcp.json`) |

Three properties of this design matter more than the table:

1. **Declared-or-conventional.** Every resolver takes the manifest's declared paths *merged with*
   directory conventions that exist on disk. A plugin that declares nothing still works if it uses
   the conventional layout — which is why most real plugins install without per-vendor metadata.
2. **`capabilities[]` is derived, never declared.** The installer computes which primitives a bundle
   actually contains by looking at the filesystem, so a manifest cannot claim a capability it does
   not ship, and cannot hide one it does.
3. **The neutral standard carries identity, not capability.** The live `agent-plugins.org` 1.0.0
   schema (fetched 2026-09-21) requires only `$schema` and `name`, permits
   `version`/`description`/`author`/`homepage`/`repository`/`license`/`keywords`/`extensions`, and
   sets `additionalProperties: false`. It states that it "assigns no semantics to namespace object
   contents". **Portable identity comes from the schema; portable capability comes from the
   directory conventions above.** Any design that expects the neutral manifest to describe tools,
   permissions or hooks is misreading it.

#### A marketplace can use an existing Git repository

`marketplace.json` (or `.claude-plugin/marketplace.json`) is a catalog listing
`{name, version?, description?, source}`, where `source` is one of
`path` · `github` · `git` · `git-subdir` · `url`. This catalog shape needs no Fleet-operated server/account; remote Git hosting may still require
its own authorized credentials. OpenClaw additionally reads the user's existing `~/.claude/plugins/known_marketplaces.json`,
so a user's Claude catalogs carry over without re-entry.

**This is one local-first shape P8 permits.** A Fleet marketplace needs no Fleet-operated service to exist; a
catalog is a repo the user or a team already controls. Guardrails observed in the same file, worth
copying rather than re-deriving: a 256 MB archive ceiling, a 16 MB catalog-manifest ceiling, a
256 KB neutral-manifest ceiling, hardlink rejection on manifest reads, immutable-commit-ref checks
for Git sources, an install transaction, a security scan and an explicit artifact-consent handler.

#### What this means for Fleet's existing code

Checked against the current tree on 2026-09-21:

- `app/packages/shared/src/skills/` already implements `SKILL.md` + YAML frontmatter
  (`name`, `description`, `globs?`, `alwaysAllow?`, `icon?`, `requiredSources?`) across three scopes
  (`~/.agents/skills`, workspace, `{project}/.agents/skills`). **Skills are REUSE/EXTEND, not NEW** —
  and `.agents/` is already the cross-product convention, shared with ZCode.
- The former `app/packages/shared/src/components/types.ts` and `ComponentManifest` were removed
  by the v0.13.4 rebuild. They do not establish a current loader or package adapter. P11/R18 own
  the target and must derive the contract through real consumers after baseline exit.
- `app/packages/shared/src/sources/` already models `mcp` | `api` | `local` connections with OAuth.
  A bundle's `mcpServers` should install as Sources, not as a second connection authority.

### Minimum package schemas

| Field | Required for all | Additional by type |
|---|---|---|
| Identity | package ID, publisher, version, source, digest, license, manifest schema | — |
| Compatibility | Fleet version range, OS/runtime range, dependencies, conflicts | MCP transport; plugin host; skill model/context requirements |
| Trust | signature/provenance, verification date, audit status, maintainer history | security review for executable/plugin/MCP packages |
| Capability | contained primitives, actions/tools, read/write effects, network/domains, files/secrets | skill invocation triggers; MCP tool schemas; plugin hooks/subagents |
| Lifecycle | staged install, health check, enable/disable, update, rollback, uninstall receipt | migration and retained-data cleanup rules |
| Governance | required role, approval level, grant scope, audit events, privacy/data retention | per-tool MCP grants and per-hook plugin policy |

### Acceptance scenarios

- Search returns a compatible package and explains why it is trusted or blocked.
- A package with a new write tool cannot silently update an existing grant.
- A dependency conflict leaves the current loadout untouched and explains the resolution.
- A failed install/update restores the previous package and emits a recovery event.
- Uninstall removes runtime availability, revokes package-owned grants/credentials while preserving shared connections and historical evidence.
- An offline local package can be installed from a verified file or Git checkout without a catalog.
- A plugin detail view expands into independent skill, MCP, subagent, hook and rule permissions.
