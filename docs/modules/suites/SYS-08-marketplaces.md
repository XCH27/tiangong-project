# SYS-08 — Skill, plugin and MCP marketplaces

**Rows:** ORCH-03, ORCH-04, ORCH-10, ORCH-11, ORCH-12. **Owner:** catalog, manifest, trust and
install lifecycle. **Depends on:** SYS-01 ActorRef/PermissionDecision/ActionEnvelope and SYS-03
loadout/context measurement. **Authority:** package identity, catalog metadata, staged transactions
and receipts; it does not own runtime permissions or Session/Task state.
**Development order:** R15.
**Craft base:** existing Skills, Sources, MCP client/server, credentials, settings and tool
registries. The marketplace adds inspected package/catalog transactions over them; it never replaces
their runtime or permission paths.

## Closed loop

Discover → inspect contents/dependencies/risk → verify source, license, signature and compatibility
→ approve scoped grants → stage/install → health check → activate → observe → update/rollback/
uninstall.

## Three catalog views

- **Skill market:** reusable instructions, prompts, examples, triggers, model/context requirements
  and quality fixtures; no executable side effect by itself.
- **Plugin market:** a transparent bundle of skills, subagents, MCP servers, hooks and rules; every
  primitive remains independently inspectable and removable.
- **MCP market:** server transport, tool/resource/prompt schemas, auth method, data domains, read/write
  effects, health and per-tool grants; removing a server revokes its tools immediately.

## Frontend and backend contract

P-56 is the shared catalog shell; P-57/P-58/P-59 are typed projections for Skill, plugin and MCP
details. The renderer reads catalog/package/transaction state through one adapter and submits staged
commands. It never writes installation directories, credentials or runtime registries directly.

The backend extends Craft Skills, Sources, MCP, credentials and settings. `PackageManifest`,
`InstallTransaction` and `InstallReceipt` are candidate shapes extracted only with the first local
package flow. Catalog adapters may be local, curated or remote, but cannot activate content. Install
is download → verify → inspect → approve → stage → health check → atomic activation. Update is a new
transaction; uninstall revokes runtime availability and credentials before removing staged files.

## Standards and retained source evidence

- Agent Skills is the primary open Skill format: `SKILL.md` metadata plus on-demand instructions and
  optional scripts/references/assets. Fleet reuses the format and progressive-disclosure behavior,
  then adds its existing permission and receipt paths.
- The official MCP Registry is the primary catalog/publication reference: namespace ownership,
  versioned server metadata and registry API. Fleet may consume compatible metadata through an
  adapter; the public registry never becomes Fleet's trust or installation authority.
- Codex/Claude/Cursor marketplace behavior remains product evidence only. A bundle never hides the
  independent risk and grants of its skills, MCP servers, hooks, rules or subagents.

## First proof

Install a verified local package, show its manifest and permissions, stage it, fail a health check,
roll back, then update it with a changed write tool and prove approval is reopened. Uninstall must
remove runtime availability and credentials while preserving historical receipts. Repeat offline.

## Acceptance and references

Use `ORCH-03-A`, `ORCH-04-A`, `ORCH-10-A`, `ORCH-11-A`, `ORCH-12-A`. Audit the Codex, Cursor and
Claude patterns in [`references/marketplaces/00-MARKETPLACE-BENCHMARK.md`](../../references/marketplaces/00-MARKETPLACE-BENCHMARK.md);
source admission remains separate from product observation.

## Stop conditions

Stop on unsigned or unverifiable package activation, hidden dependency, changed capability without
review, credential leakage, non-rollbackable update, catalog-only recovery, or a bundle that hides
its contained tools and hooks.
