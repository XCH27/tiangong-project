# Marketplace benchmark and design decisions

Audit date: 2026-07-17. These are product and governance observations, not code-admission records.
The implementation must still pass the source/license/same-task/deletion tests in
[`../REFERENCE-REGISTRY.md`](../REFERENCE-REGISTRY.md).

## Observed patterns

| Product | Evidence | Mechanisms worth absorbing | What Fleet must improve or reject |
|---|---|---|---|
| Codex Plugins | [OpenAI Plugins in Codex](https://help.openai.com/en/articles/20001256-plugins-in-codex/) | plugin bundles skills and approved apps; required/optional dependencies; role-based availability; action/data controls; refresh from origin; low-risk test before publish | use one Fleet manifest and one PermissionDecision; add exact version, rollback, provenance and offline behavior instead of a thin enable/disable toggle |
| Cursor Marketplace | [Marketplace](https://cursor.com/marketplace), [plugin announcement](https://cursor.com/blog/marketplace) | one plugin can bundle skills, subagents, MCP servers, hooks and rules; curated/featured discovery; install in editor; team marketplaces; automations built from installed plugins | do not treat a bundle as an authority; expose each primitive's permissions, caller, data scope and failure path; separate public, private and local catalogs |
| Claude Code / Claude Cowork | [MCP integrations](https://docs.anthropic.com/en/docs/claude-code/mcp), [agent templates](https://www.anthropic.com/news/finance-agents) | connectors provide governed data access; plugins/templates combine skills, connectors and subagents; CLI installation and explicit tool permissions; admin-managed marketplaces | preserve the transparent approval boundary; do not copy vendor-specific distribution or imply a hosted marketplace is required for local-first use |

## Fleet decisions

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

## Top-tier open-source implementation evidence

| Source at fixed revision | Exact mechanism | Fleet use |
|---|---|---|
| Agent Skills `38a2ff82958a` | `docs/specification.mdx` and client guidance define `SKILL.md`, optional resources and staged progressive disclosure | reuse the open format and on-demand loading; apply Fleet policy and receipts around executable resources |
| MCP Registry `29e32c39dcb5` | typed server metadata, namespace/auth verification, version transactions, validation and integration tests | catalog/publication adapter only; do not equate registry presence with installation trust |

These two are the standing open-source references. Vendor marketplaces above remain product behavior
evidence, not source architecture. Community registries and smaller Skill managers are not retained
unless a later concrete gap survives both references and a local Craft extension.

## Verified on-disk interop contract (2026-09-21)

The 2026-07-17 rows above were read from vendor **documentation**. This section was read from a
**working multi-ecosystem implementation**: `源码参考/software/openclaw` @ `f7dae76bee9`,
`src/plugins/bundle-manifest.ts` (542 lines) and `src/plugins/marketplace.ts` (1295 lines). It
replaces guesswork about what a "Codex plugin" or "Cursor plugin" physically is.

### One normalized manifest, four adapters

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

### A marketplace is a Git repository, not a service

`marketplace.json` (or `.claude-plugin/marketplace.json`) is a catalog listing
`{name, version?, description?, source}`, where `source` is one of
`path` · `github` · `git` · `git-subdir` · `url`. There is no central server, no account, and no
API. OpenClaw additionally reads the user's existing `~/.claude/plugins/known_marketplaces.json`,
so a user's Claude catalogs carry over without re-entry.

**This is the shape P8 requires.** A Fleet marketplace needs no Fleet-operated service to exist; a
catalog is a repo the user or a team already controls. Guardrails observed in the same file, worth
copying rather than re-deriving: a 256 MB archive ceiling, a 16 MB catalog-manifest ceiling, a
256 KB neutral-manifest ceiling, hardlink rejection on manifest reads, immutable-commit-ref checks
for Git sources, an install transaction, a security scan and an explicit artifact-consent handler.

### What this means for Fleet's existing code

Checked against the current tree on 2026-09-21:

- `app/packages/shared/src/skills/` already implements `SKILL.md` + YAML frontmatter
  (`name`, `description`, `globs?`, `alwaysAllow?`, `icon?`, `requiredSources?`) across three scopes
  (`~/.agents/skills`, workspace, `{project}/.agents/skills`). **Skills are REUSE/EXTEND, not NEW** —
  and `.agents/` is already the cross-product convention, shared with ZCode.
- `app/packages/shared/src/components/types.ts` `ComponentManifest` already carries `skills[]`,
  `mcpServers[]`, `contributions[]`, `requestedPermissions[]`, `integrity`, `license`, `publisher` —
  a **superset** of all four foreign manifests. The gap is not the model; it is the absence of an
  adapter layer and of `bundleFormat` provenance.
- `app/packages/shared/src/sources/` already models `mcp` | `api` | `local` connections with OAuth.
  A bundle's `mcpServers` should install as Sources, not as a second connection authority.

## Minimum package schemas

| Field | Required for all | Additional by type |
|---|---|---|
| Identity | package ID, publisher, version, source, digest, license, manifest schema | — |
| Compatibility | Fleet version range, OS/runtime range, dependencies, conflicts | MCP transport; plugin host; skill model/context requirements |
| Trust | signature/provenance, verification date, audit status, maintainer history | security review for executable/plugin/MCP packages |
| Capability | contained primitives, actions/tools, read/write effects, network/domains, files/secrets | skill invocation triggers; MCP tool schemas; plugin hooks/subagents |
| Lifecycle | staged install, health check, enable/disable, update, rollback, uninstall receipt | migration and retained-data cleanup rules |
| Governance | required role, approval level, grant scope, audit events, privacy/data retention | per-tool MCP grants and per-hook plugin policy |

## Acceptance scenarios

- Search returns a compatible package and explains why it is trusted or blocked.
- A package with a new write tool cannot silently update an existing grant.
- A dependency conflict leaves the current loadout untouched and explains the resolution.
- A failed install/update restores the previous package and emits a recovery event.
- Uninstall removes runtime availability, revokes credentials and leaves historical evidence intact.
- An offline local package can be installed from a verified file or Git checkout without a catalog.
- A plugin detail view expands into independent skill, MCP, subagent, hook and rule permissions.
