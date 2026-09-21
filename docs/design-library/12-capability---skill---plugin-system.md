# M12 — Capability, Skill, and Plugin System

> **Design asset (source note, not an authority).** The canonical scope, decisions, active specs, and implementation status live in `../PRODUCT.md`, `docs/02-DECISIONS.md`, `docs/05-ROADMAP.md`, and `docs/modules/`. Use this file only for the active module design; reconcile it against current code and canonical documents before implementation.


> **Recovered design material (2026-07-11).** Extracted from the previous project's module spec.
> The stale Wave/Gate/Loop/packet wrapper and dead cross-links were removed; the **design substance**
> below is kept as *source material* only; its development-order owner is the release anchor in `docs/modules/PACKET-INDEX.md`, not this note. Re-ground
> it in the code that exists when that branch starts, and strip anything no longer true.


## 1. Purpose

Define one discoverable capability model from which human controls, Agent tools, workflow ports,
and optional UI contributions are derived. Keep installed capabilities, effective loadouts, and
runtime instances separate so an Agent receives the smallest safe toolset for its task.

M12 is not a marketplace-first feature. Its first closed loop is a built-in capability whose one
operation appears in the human UI, an authorized Agent manifest, and M17's workflow palette and
reaches the same M03 executor in all three cases.

## 2. Scope Split

### M12 Core — required before creative composition

- versioned `CapabilityManifest` and `CapabilityOperation` definitions;
- typed ports and ArtifactRef compatibility;
- canonical action references plus projected risk/undo/evidence/cancellation/retry metadata,
  execution mode, and resource metadata;
- deterministic effective-manifest/loadout resolution;
- built-in capability catalog and conflict handling;
- optional view/canvas renderer contribution references;
- human, Agent, and workflow discovery from one source.

### M12 Distribution — deferred to W4

- install, uninstall, signing/trust, compatibility, network retrieval, updates, sandbox runtime,
  localization bundles, and external plugin UI;
- marketplace browsing or remote catalogs.

External distribution must not block built-in modularity.

## 3. Capability Chain

```text
CapabilityManifest
-> CapabilityOperation
-> canonical ActionDefinition/actionId
-> effective permission/loadout projection
-> human control | Agent tool | M17 workflow step
-> same M03 ActionInvocation and executor
```

There is no manual `AgentHook -> Action ID` mapping table. Transport bindings are generated from
the effective manifest and canonical action schemas.

## 4. Data Contract

M12 consumes the proposed contracts in
`docs/contracts/composable-workspace-contracts.md` *(deleted; recoverable from pre-reset Git history: `git show 616eff59e:docs/contracts/<name>.md`)*. Before M12 Core implementation they must be
re-derived from current code and promoted into the canonical protocol.

Each operation declares:

- stable capability/operation version and a pinned canonical ActionDefinition reference;
- input/output schemas and typed ports;
- accepted/produced ArtifactRef kinds and media types;
- whether it is composable;
- execution mode (`inline_action`, `runtime_lane`, `local_job`, `external_job`);
- execution mode and concurrency/resource class; risk, approval, undo, cancellation, retry, and
  evidence are read from the referenced ActionDefinition rather than duplicated in the manifest;
- optional finite concurrency/resource class;
- optional M16 view and M07 renderer contribution IDs.

Policy metadata describes behaviour; M00 remains the authority that decides a caller's effective
permission.

## 5. Effective Manifest Resolution

Resolution is deterministic and auditable:

```text
installed built-in/approved capabilities
intersect workspace-enabled capabilities
intersect role/domain grants
intersect trust and data-sensitivity ceilings
intersect explicit task/TeamRun scope
intersect runtime compatibility
minus explicit denies/conflicts
= effective capability manifest
```

Priority and safety rules:

1. explicit deny wins;
2. trust ceilings only remove authority;
3. task-assigned capabilities may narrow but never broaden the Seat authority;
4. incompatible versions are absent with a visible explanation;
5. a missing capability is not replaced automatically by a similarly named operation;
6. the resolved manifest and reason hashes are attached to run/session evidence without exposing
   secrets.

## 6. Installed, Loaded, and Running Are Different

| Layer | Meaning | Authority |
|---|---|---|
| installed | package/definition is available locally | M12 catalog |
| workspace enabled | user permits discovery in this workspace | canonical preferences/M12 |
| effective loadout | caller may see/use the operation for this task | M00 identity + M12 resolver |
| runtime instance | operation is currently executing | M03, M04, or M08 owner |

Disabling a capability prevents new invocations. Existing durable jobs/runs reconcile through
their owners; M12 does not delete them.

## 7. Core and Plugin Namespace

The current core two-segment action IDs remain the recorded v1.2 baseline. Future namespace
format is a W0.1 decision and must not rely on counting dots as a security mechanism.

Every registry entry carries structured ownership:

```ts
type ActionOwner = {
  ownerKind: 'core_module' | 'plugin'
  ownerId: string
  namespace: string
  public: boolean
  version: string
}
```

The registry rejects duplicate IDs and unauthorized public exposure. The final product namespace,
manifest API field name, and workspace storage prefix must be decided before external plugins are
frozen.

## 8. UI Contributions

Capabilities may reference contributions owned by M16/M07:

- surface;
- dock panel;
- contextual inspector;
- canvas entity renderer;
- command-palette entry.

M12 validates the contribution declaration and compatibility; M16 owns mounting/layout, and M07
owns spatial rendering. A plugin cannot directly patch the shell.

## 9. Workflow Composition

Only operations with `composable: true` and complete input/output ports appear in M17. A workflow
definition pins their versions. Removing or upgrading a capability leaves old workflows readable
but invalid for new runs until an explicit compatible version is selected.

A saved workflow may itself be published locally as a composed capability after:

- definition validation;
- finite input/output schema declaration;
- permission/budget policy derivation;
- successful real run evidence;
- explicit user approval.

Publishing a workflow does not create a new executor: invocation expands into M17, which invokes
M03 per step.

## 10. Candidate Actions — Not Frozen

| Candidate | Purpose | Policy intent |
|---|---|---|
| `capability.list` | list effective or installed manifests | L0 filtered read |
| `capability.resolve` | explain why an operation is available/absent | L0 filtered read |
| `capability.workspace_enable` | enable a built-in capability | L1/L2 preference depending on side effects |
| `capability.workspace_disable` | block new uses | L1 preference, snapshot undo |
| `capability.loadout_propose` | propose a scoped loadout | L0 proposal only |
| `capability.workflow_publish` | expose validated workflow as local capability | L2 policy change |
| `plugin.install` / `plugin.enable` | deferred distribution actions | L2/L3 after source/trust evaluation |

No Worker may implement these until the W0.1 namespace/schema decision is frozen.

## 11. External Plugin Isolation — W4

- Plugins call only their own operations or explicitly public registry operations.
- Direct imports of internal services are prohibited.
- Secrets are provided by scoped handles, never manifest values.
- Faulting plugin views are isolated by M16; faulting operations return typed M03 errors.
- Plugin disablement affects new work; durable in-flight work follows owner cancellation/reconcile
  policy.
- Compatibility is checked before enablement and again before a pinned workflow run.
- Signing/trust and distribution format require a separate ADR before implementation.

## 12. Error Handling

| Condition | Result | Recovery |
|---|---|---|
| duplicate action/capability ID | registration rejected | correct owner/namespace/version |
| incompatible API version | capability remains installed but disabled | install compatible version |
| missing dependency | operation absent from effective manifest | enable/install dependency |
| trust ceiling removes action | reason visible; no tool generated | change task/Seat policy through M00 |
| schema or port invalid | manifest rejected | fix and revalidate definition |
| running plugin fault | operation/view isolated; generic action failure evidence | retry if allowed or disable plugin |
| pinned workflow capability missing | workflow readable-invalid | restore version or explicit migration |

## 13. First Usable Verification

1. Register one built-in image-generation capability with one operation and typed ports.
2. Resolve it for an authorized internal Agent and deny it for a restricted caller.
3. Invoke from a human control, Agent tool, and M17 step; verify identical action ID/schema/executor
   and only caller/correlation context differs.
4. Disable it for the workspace; verify it disappears from new manifests and workflow palette but
   an in-flight M08 job remains reconcilable.
5. Persist/restart; verify workspace setting and effective resolution restore.
6. Introduce a duplicate ID and invalid port schema; verify visible registration rejection.

`usable` requires the real operation loop. A catalog page or generated tool list alone is
`display-only` or `wired but not visually checked` as appropriate.

## 14. Open Gates

- W0.1 canonical manifest, caller, policy, namespace, and ArtifactRef contracts.
- AgentSeat/tag projection and deterministic loadout algorithm.
- v0.11 baseline mapping for retained skills/sources/MCP behaviour.
- external plugin distribution ADR before W4.

## 15. Non-Goals and Prohibitions

- No always-on global tool pile.
- No capability grant inferred only from installation.
- No plugin shell patching or direct internal-service imports.
- No separate workflow/action registry.
- No external plugin marketplace in the first modular workflow slice.

---

## 16. Concrete design for the current tree (2026-09-21)

Everything above §15 is recovered material from the pre-reset project and speaks in `M00`/`M03`/`M12`
module IDs that no longer exist. This section is grounded in code that exists today and in a working
multi-ecosystem implementation read at
[`../references/marketplaces/00-MARKETPLACE-BENCHMARK.md`](../references/marketplaces/00-MARKETPLACE-BENCHMARK.md)
§*Verified on-disk interop contract*. Where the two disagree, this section wins for implementation
and §1–§15 remain rationale.

### 16.1 Three primitives, already three modules

Fleet does not need a new capability kernel. It has three and they map cleanly:

| Primitive | Authority that already exists | Status | What it is |
|---|---|---|---|
| **Skill** | `packages/shared/src/skills/` | `usable` | `SKILL.md` + frontmatter. Instructions that change how the agent works. No code, no permissions of its own |
| **Source** | `packages/shared/src/sources/` | `usable` | `mcp` \| `api` \| `local` connection with auth. Where capability and data come from |
| **Component** | `packages/shared/src/components/` | `not implemented` — types and resolver exist, no production caller | Manifest + UI contribution into `left-rail` / `right-workbench`. Where a surface comes from |

**A Plugin is not a fourth primitive. A Plugin is a signed, versioned bundle that installs some of
the three.** This is decision 2 in the marketplace benchmark ("bundle is a projection") restated
against real modules: the bundle is the unit of *distribution*, never a unit of *authority*.

### 16.2 The adapter layer is the whole interop answer

`ComponentManifest` is already a superset of the Claude, Codex, Cursor and neutral manifests. So
compatibility is **not** an architecture problem and must not become four marketplaces, four
installers, or a vendor switch in product code. It is one narrow, testable module:

```text
.claude-plugin/plugin.json ─┐
.codex-plugin/plugin.json  ─┤
.cursor-plugin/plugin.json ─┼──> adapter ──> ComponentManifest + bundleFormat ──> one installer
plugin.json (agent-plugins)─┘                (+ derived capabilities[])          one resolver
                                                                                 one permission path
```

Rules the adapter must hold, each taken from behavior observed in a working implementation rather
than invented here:

1. **Declared paths merge with conventional paths.** Never require a plugin to declare what its
   directory layout already states, or most real bundles will fail to install.
2. **`capabilities[]` is derived from the filesystem, never trusted from the manifest.** A bundle
   cannot claim a capability it does not ship, nor hide one it does. This is the property that makes
   the permission prompt honest.
3. **`bundleFormat` is provenance and must survive install.** The user is entitled to know a
   surface came from a Cursor bundle; a later incompatibility must be attributable.
4. **The neutral `agent-plugins.org` manifest is the format Fleet *publishes*, and one of four it
   *reads*.** It is validated strictly (`$schema` exact match, 256 KB ceiling) because it is the
   only one with a published contract. Fleet-specific behavior belongs in
   `extensions["ai.fleet"]`, never in new top-level keys — the schema sets
   `additionalProperties: false` and a non-conforming manifest is not portable.
5. **A bundle's `mcpServers` install as Sources.** Not as a parallel connection store. One
   connection authority, per non-negotiable.
6. **A bundle's skills install into the existing `.agents/skills` scopes.** Not into a plugin-private
   skill store. `.agents/` is already shared with Craft upstream and ZCode; a private store would
   break the one thing that is already portable.

### 16.3 The marketplace needs no Fleet service

A catalog is `marketplace.json` listing `{name, version?, description?, source}` where `source` is
`path` · `github` · `git` · `git-subdir` · `url`. That is the entire distribution backbone, and it
satisfies **P8** (no Craft-operated dependency) and **P9-rev** (no Fleet relay) without an exception:
a marketplace is a Git repository that the user or their team already controls.

Consequences that follow, and that the UI must not contradict:

- **There is no "official Fleet store" to log into**, and no listing can require one. Fleet may ship
  a default catalog *as a repository reference*, removable like any other.
- **Local-first is the default path, not a fallback.** Install from a folder or a Git checkout is a
  first-class origin, because offline install is the only way P8 stays true.
- **Importing the user's existing catalogs is a feature, not a migration.** Reading
  `~/.claude/plugins/known_marketplaces.json` costs nothing and is the difference between an empty
  store and a populated one on first run.
- **Trust is computed locally.** Signature/provenance/license/permission diff are evaluated on this
  machine at install time; a remote catalog supplies candidates, never verdicts.

### 16.4 Sequencing, and what must not be built first

`08-CRAFT-CAPABILITY-MAP.md` records Component activation as `not implemented` with no production
caller, and the roadmap's foundation-first slice puts the minimum registry, scoped activation and
layout ahead of external distribution. That order is right and this section does not reopen it:

1. **Component host first** — a real registry with two production surfaces, per R18. Until a
   Component can be installed, enabled, rendered and revoked *from a local folder*, a marketplace
   only adds ways to fail.
2. **Adapter + local install second** — the four-format reader, derived `capabilities[]`, the
   permission diff, the install transaction with rollback. Verifiable entirely offline against
   fixture bundles; no network, no catalog, no UI store.
3. **Catalog last** — `marketplace.json` reading, Git/GitHub sources, known-marketplace import.

**Prohibited orderings:** building catalog browsing before local install works; adding a second
installer or second permission path per ecosystem; treating a vendor bundle as an authority that may
write directly into the shell; shipping a store page whose listings cannot be installed offline.

### 16.5 What is verified and what is not

Verified on 2026-09-21: the three Fleet modules and their contracts; `ComponentManifest` being a
superset; the four manifest paths and their per-ecosystem resolvers; the marketplace source kinds
and size ceilings; the live `agent-plugins.org` 1.0.0 schema and its `extensions` rule.

### 16.6 Measured: Fleet silently drops the field most real skills route on

This was the open question in the first draft of this section. It is now answered, and the answer
changes what the adapter must do.

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

`packages/shared/src/skills/storage.ts:82-88` builds `SkillMetadata` from an **explicit six-key
whitelist**. Everything else is discarded without a warning. The skill still loads — `name` and
`description` are present — so nothing appears broken, while **the field 55% of real skills use to
declare when they activate is gone**. Fleet's `globs` is a file-pattern trigger; `triggers` is a
natural-language phrase list. They are not substitutes.

Three requirements follow:

1. **Preserve unknown frontmatter instead of whitelisting it.** Keep the parsed record and expose
   the unrecognized remainder. `od:` shows the vendor-namespace pattern already exists in
   frontmatter, mirroring `extensions` in the neutral JSON schema; dropping it discards the exact
   data a foreign client needs to keep working after a round trip through Fleet.
2. **Read `triggers` as a first-class activation input** alongside `globs`, or state in the UI that
   an imported skill's triggers are not honored. Silently ignoring it is the failure mode this
   project has a non-negotiable against: a boundary reported by failing quietly.
3. **The i18n keys are not someone else's problem.** Fleet ships `zh-Hans`; skills in the wild
   already carry `zh_name`/`zh_description`. Reading them is close to free and is the difference
   between a localized store and an English-only one.

**Still not verified, and required before implementation starts:** how `activation` should map
across the four bundle formats, and whether any signing story exists that does not require a
Fleet-operated key service (P8 forbids one).
