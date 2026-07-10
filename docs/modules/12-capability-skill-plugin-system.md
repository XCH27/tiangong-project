# M12 — Capability, Skill, and Plugin System

> **Capability status:** `not implemented`
> **Execution gate:** Locked
> **Spec maturity:** capability-core contract draft; plugin distribution concept only
> **Wave:** W1 contract / W2 built-in catalog core; W4 external plugin distribution
> **Owner:** Lead for manifest/namespace; M12 Worker after packet approval
> **Depends on:** M00 identity/permission, M03 registry, M05 artifact metadata

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
`docs/contracts/composable-workspace-contracts.md`. Before M12 Core implementation they must be
promoted into the canonical protocol.

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
