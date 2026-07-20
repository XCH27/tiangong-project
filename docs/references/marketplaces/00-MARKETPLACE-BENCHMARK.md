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
