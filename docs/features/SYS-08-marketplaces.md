# SYS-08 — Skill, plugin and MCP marketplaces

**Rows:** ORCH-03, ORCH-04, ORCH-10, ORCH-11, ORCH-12. **Owner:** catalog, manifest, trust and
install lifecycle. **Depends on:** SYS-01 ActorRef/PermissionDecision/ActionEnvelope and SYS-03
loadout/context measurement. **Authority:** package identity, catalog metadata, staged transactions
and receipts; it does not own runtime permissions or Session/Task state.
**Development order:** complete the R0 baseline exit first, then local host/activation in
[`../../features/SYS-09-workspace-compositions.md`](SYS-09-workspace-compositions.md#release-contract--r18-component-and-panel-foundation), then R15 external
distribution. Existing permission/settings paths support the first built-in consumers; R6/R9 are
not blanket prerequisites. A particular component waits only for the capabilities it consumes.
**Craft base:** existing Skills, Sources, MCP client/server, credentials, settings and tool
registries. The marketplace adds inspected package/catalog transactions over them; it never replaces
their runtime or permission paths.

The installable product bundle is a **Component**, as defined in
[`SYS-09-workspace-compositions.md`](SYS-09-workspace-compositions.md). The historical "plugin"
view remains a catalog category for compatibility, but a user-facing Component may additionally
contribute a left tool-rail entry or right-workbench panel and native domain commands. Global versus
Workspace enablement and user overrides extend the existing user/Workspace settings; the effective
Composition is derived from them, not copied into the catalog or Assistant record. Left/right are
default contribution placements; the host owns user movement and restore.

Registration ownership is explicit; a name or namespace prefix is not authorization. Reject
colliding IDs without claiming another package's installed resources. A saved workflow pins the
capabilities it consumed: removal keeps it readable but blocks a new run with a named missing-version
reason until the dependency is restored or explicitly migrated. This does not freeze another
manifest schema or workflow executor.

## Closed loop

Discover → inspect contents/dependencies/risk → verify source, license, integrity/provenance and compatibility
→ approve scoped grants → stage/install → health check → activate → observe → update/rollback/
uninstall.

## Three catalog views

- **Skill market:** reusable instructions, prompts, examples, triggers, model/context requirements
  and quality fixtures; no executable side effect by itself.
- **Component market:** a transparent bundle of panels, native commands, skills, subagents, MCP
  servers, knowledge defaults, hooks and rules; every primitive remains independently inspectable
  and removable. Components use Fleet's design system and additive left/right host slots.
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
transaction; uninstall revokes the package's runtime grants and package-owned credentials before removing staged files; shared connections are retained while referenced.

Local authoring does not require a Fleet signing service: verify the selected local origin/digest
and record explicit trust. Remote signatures, when required by the distribution contract, bind
the approved bytes; a valid signature alone never grants tool permission.

Catalog identity is not a Fleet account. An optional private Git catalog uses the connected host's
explicitly configured third-party credentials; the host verifies source identity, scope and trust
before install/update. Successful cloning is not a runtime permission grant. Provider revocation
blocks future authenticated access but does not erase a local clone or revoke installed-package
grants; those lifecycles remain explicit. Public metadata still needs integrity/provenance checks.
Signed-out, denied, offline and source-error states stay distinct, while installed local capability
remains accessible. Cross-machine copying is user-selected, with remote preflight, bounded archive
and extracted sizes, per-item results and atomic activation per accepted package. An offline seed
is a candidate under P11; no remote catalog service or seeded marketplace is already implemented.

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
remove runtime availability, package grants and exclusively owned credentials while preserving
historical receipts and shared connections. Repeat offline.

## Acceptance and references

Use `ORCH-03-A`, `ORCH-04-A`, `ORCH-10-A`, `ORCH-11-A`, `ORCH-12-A`. Audit the Codex, Cursor and
Claude patterns in [`references/marketplaces/00-MARKETPLACE-BENCHMARK.md`](../REGISTRY.md#marketplace-benchmark);
source admission remains separate from product observation.

## Stop conditions

Stop on unverifiable package activation or source changes outside its approved trust record, hidden dependency, changed capability without
review, credential leakage, non-rollbackable update, catalog-only recovery, or a bundle that hides
its contained tools and hooks.

## Refreshed package-development evidence

The [current intake](../REFERENCES.md#current-checkouts-and-development-document-intake)
links each upstream authoring guide without duplicating its manual. ORCH-11 keeps portable Skill
instructions distinct from the host's versioned Component manifest, as Open Design's handoff does.
Manifest/API version, requested permissions, provenance and a real output fixture must be checked
before activation. Omnigent reserves some activation fields without executing them: Fleet must
reject or clearly mark unsupported behavior, never treat accepted metadata as an active trigger.

OpenChamber's built-in guide usefully keeps public SDK access, immutable provenance and staged
validation common to built-in and third-party packages; it is secondary mechanism evidence, not a
new product authority. Reject its automatic built-in grant derivation. Official status does not
bypass Fleet authorization. Disable removes effective registrations and stops owned resources
while retaining artifacts and core records. Packaging/collision and cleanup checks apply equally
to built-in, user and Workspace-scoped bundles. No untrusted ESM receives a general renderer/main
RPC object merely to make a plugin tutorial work.

## Execution contracts

These sections own the next step for the listed capability IDs. Read the
[common execution contract](../COMPONENT-GUIDELINES.md#executable-next-step-contract)
and the release/spec anchor in [capability register](../PROJECT-SPEC.md#capability-register). Gates do not open merely
because this packet has instructions. Planned regression targets below do not exist yet unless
implementation has added them; extend a matching existing behavioral test instead of duplicating it.

### Execution ORCH-04

**Agent tool registry and MCP**

- **Next:** `IMPLEMENT` — R4/R6 real tool consumers; current Sources retained.
- **Sources:** [`packages/session-tools-core/src/tool-defs.ts`](../../app/packages/session-tools-core/src/tool-defs.ts); [`packages/shared/src/mcp/client.ts`](../../app/packages/shared/src/mcp/client.ts); [`packages/shared/src/sources/storage.ts`](../../app/packages/shared/src/sources/storage.ts); [`packages/shared/src/agent/core/pre-tool-use.ts`](../../app/packages/shared/src/agent/core/pre-tool-use.ts).
- **Deliver:** Keep a single tool registration/projection path; register one MCP Source and route each tool through existing caller policy and attributable results.
- **Data:** Source/server identity, tool schema/version/effect and connection/grant scope own availability. Registration/discovery cannot execute, install or grant.
- **Failure:** Collision, stale schema, unavailable transport and revoked grant reject clearly. Disconnect removes live tools without deleting user-owned Source configuration.
- **Proof:** ORCH-04-A — Read/write tool pair, name collision, schema update, dropped connection and revocation while queued; denied tool never reaches server dispatch. Planned regression/probe target relative to `app/`: `packages/session-tools-core/src/__tests__/fleet-orch-04.test.ts`. After adding the target, run from `app/`: `bun test packages/session-tools-core/src/__tests__/fleet-orch-04.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft SESSION_TOOL_DEFS/MCP client; official MCP Registry metadata and Cindy capability ownership, not a new registry service. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution ORCH-10

**Skill marketplace and loadout distribution**

- **Next:** `IMPLEMENT` — R15 after local host/loadout proof.
- **Sources:** [`packages/shared/src/skills/storage.ts`](../../app/packages/shared/src/skills/storage.ts); [`packages/shared/src/sources/storage.ts`](../../app/packages/shared/src/sources/storage.ts); [`packages/shared/src/config/storage.ts`](../../app/packages/shared/src/config/storage.ts).
- **Deliver:** Add Skill catalogue projection and verified staged install/update over existing Skill storage, including compatibility diagnostics and scoped activation.
- **Data:** Package receipt records origin, immutable revision/digest, license, file manifest and validation. Loadout is separate from installation; script capability requires the existing policy path.
- **Failure:** Traversal/symlink/archive-size or unsupported metadata rejects before activation. Changed permissions reopen review; failed update restores prior revision and user overrides.
- **Proof:** ORCH-10-A — Install local fixture offline, invalid archive, triggers metadata, update/rollback/disable and missing dependency; active turn snapshot remains stable. Planned regression/probe target relative to `app/`: `packages/shared/src/skills/__tests__/fleet-orch-10.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/skills/__tests__/fleet-orch-10.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Agent Skills format and provenance; Craft Skill storage; Cindy staging/loadout mechanisms. No hidden install scripts or arbitrary catalogue execution. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution ORCH-11

**Component marketplace and lifecycle**

- **Next:** `IMPLEMENT` — R15 distribution after foundation.
- **Sources:** [`packages/shared/src/config/storage.ts`](../../app/packages/shared/src/config/storage.ts); [`packages/shared/src/workspaces/storage.ts`](../../app/packages/shared/src/workspaces/storage.ts); [`packages/shared/src/skills/storage.ts`](../../app/packages/shared/src/skills/storage.ts); [`packages/shared/src/sources/storage.ts`](../../app/packages/shared/src/sources/storage.ts).
- **Deliver:** Extend the local Component proof with inspectable manifest, dependency closure, staged update/rollback and uninstall; inspect contents before activation.
- **Data:** Package owns immutable vendor revision and installed resources; existing settings own scope overrides and permission broker owns grants. Receipt records exact approved bytes/dependencies.
- **Failure:** Changed code/capability invalidates approval. Failed health check restores prior activation; uninstall revokes owned availability and exclusive credentials but preserves shared connections/data.
- **Proof:** ORCH-11-A — Two versions with changed write capability, failed activation, offline rollback, partial uninstall and active job lease; no code executes before trust/grant checks. Planned regression/probe target relative to `app/`: `packages/shared/src/config/__tests__/fleet-orch-11.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/config/__tests__/fleet-orch-11.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Cindy plugin registry/snapshot lifecycle and DeepSeek failed-scope disposal. Official/third-party packages use the same authority and no UI shadowing. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution ORCH-12

**MCP server marketplace and connector registry**

- **Next:** `IMPLEMENT` — R15 with Sources/MCP lifecycle.
- **Sources:** [`packages/shared/src/sources/storage.ts`](../../app/packages/shared/src/sources/storage.ts); [`packages/shared/src/sources/token-refresh-manager.ts`](../../app/packages/shared/src/sources/token-refresh-manager.ts); [`packages/shared/src/mcp/client.ts`](../../app/packages/shared/src/mcp/client.ts).
- **Deliver:** Expose verified server metadata in the existing catalogue, inspect transports/tools/auth and register through the existing Source path.
- **Data:** Server manifest pins namespace/version, transport, tool capabilities, credential scope and health. Catalogue identity is not runtime trust or a Fleet account.
- **Failure:** Namespace/source change, auth expiry, missing binary and schema drift are explicit. Uninstall/revoke removes tools and stops owned process without erasing shared credential records.
- **Proof:** ORCH-12-A — Local stdio fixture and configured HTTP fixture, forged namespace, changed tool effect, expired auth, crash and revoke; existing MCP callers observe truthful unavailable state. Planned regression/probe target relative to `app/`: `packages/shared/src/sources/__tests__/fleet-orch-12.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/sources/__tests__/fleet-orch-12.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Official MCP Registry publish/version mechanics and Craft Source/MCP client. Do not deploy a Fleet-hosted registry as prerequisite. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).
