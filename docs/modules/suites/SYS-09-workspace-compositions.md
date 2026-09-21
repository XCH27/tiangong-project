# SYS-09 — Components and workspace compositions

Status: `PACKET_DRAFT`; complete Component host/runtime `not implemented`. Development anchor:
owner-directed **early R15/R18 foundation** in
[`../../specs/R18-right-workbench.md`](../../specs/R18-right-workbench.md), then R15 distribution
and R18 advanced/native-window closure. R6 delegation and R9 memory are not foundation prerequisites.
This packet defines the relationship between bundles, Assistant identity and Workspace configuration;
it is not a second roadmap or an assertion that the data types are already connected to the UI.

## Current code boundary

`app/packages/shared/src/components/` contains data-only types, exports, a resolver and tests. There
is no production consumer, loader, persisted composition writer or validated permission lifecycle.
Dependency `version` is declared but not enforced by that resolver; optional installed dependencies
are currently traversed too. Its `active` array is not proof of runtime activation. Do not present
these helpers as an installed or working Component system.

`RightSidebar.tsx` still has fixed Files/Browser/Notes/History entries and bodies. No generic
left-tool contribution registry is mounted. `shared/src/layout/tree.ts` is unmounted and its v1
forbids floating panels; it needs a real gesture/state bridge or a deliberately selected host
adapter, not just an import. The foundation specification owns implementation and evidence.

## Scope

A Component is a versioned bundle containing any combination of a Fleet-native left-rail entry or
right-workbench panel, domain commands and migrations, Skills, MCP declarations, default knowledge
sources, and suggested Assistant/loadout values. The bundle is installed once and can be enabled in
many Workspaces. Those two contribution types have default left/right placement. Users may move,
resize, reorder and float their views through the one host; a Component cannot take over the shell,
conversation implementation or navigation authority. Position and capability identity are separate.

The catalog may contain Fleet-official, third-party, and locally authored Components. They use the
same manifest, inspection, permission, health-check, update and rollback contract. "Official" changes
trust and provenance presentation; it does not create a privileged runtime or a second API.

### Thin components and lazy dependencies

Components may be thin presentation or coordination packages. A manifest can declare required and
optional dependencies by stable component id and revision: renderer/codec, transcription, Skill
pack, MCP server, knowledge connector, or external runtime adapter. The host resolves the graph
without loading every package at startup. First use (or an explicit preload) resolves the needed
capability and invokes the existing trust/approval path before any download, install or new effect.
It activates an approved installed revision, pins that revision in the Composition snapshot, and
records the source, license, health and permission result.

The dependency graph is acyclic at activation time; cycles, incompatible revisions and hidden
transitive capabilities are rejected before activation. A required dependency makes the owning
feature unavailable with a named install/configure action. An optional dependency leaves the
component's basic panel usable and shows the missing feature as degraded. Unloading an unused
dependency releases its UI, listeners, workers and external processes. Closing or hiding a panel
does not silently cancel active work: resource leases and native unsaved state are checked first.
No component may keep an otherwise unused process alive merely because it was once opened.

The installation has one immutable vendor manifest and a user-owned scope policy. The user may
enable a component globally or only for selected Workspaces. Each Workspace stores a Composition:
component id + pinned revision, enabled/disabled override, explicit configuration overrides, extra
MCP/source references, personal habits, and panel arrangement. There is no product-imposed limit on
component count; resource and permission failures remain per-component and visible. Sessions
resolve a snapshot of the active composition at the start of each turn; a running turn cannot
change its tool/panel set. An explicit one-off choice may take effect at the next turn boundary,
is recorded in Session evidence for resume, and is never persisted as a Workspace default.

Global defaults belong to existing user settings; Workspace overrides extend existing Workspace
configuration. The resolved per-turn snapshot is owned by the existing Session/SessionEvent
authority: one immutable snapshot is bound to each turn, and a later explicit change is a new
boundary event. It is not another persistent copy of both stores. Credentials remain references
into the existing credential manager. Window geometry is
scoped to Workspace plus local window/device preferences, not shared as screen coordinates between
machines. Resolve and migrate the final schema with the real writer/consumer in the foundation.

## Authorities and invariants

- Workspace, Session, Task, Permission, Timeline, Settings, credentials and files remain Fleet/Craft
  authorities. A Component only owns its declared native domain data.
- Assistant remains an identity record. It can request Components/Skills/MCPs, but a request is not
  a grant; the existing permission path evaluates the effective set.
- Resolver precedence is official default → user profile default → workspace override → session
  choice. Unknown or unavailable components fail visibly with a named reason and never silently
  become a different component.
- Components contribute through additive tool-entry and workbench-panel slots. Left/right are
  defaults, while the user owns placement. No component may patch `AppShell`, replace the
  conversation implementation, create a second settings home, or publish a global service from a
  Workspace scope. Host-managed shared resources still have one lifecycle owner.
- Component dependency declarations are explicit and inspectable. A dependency may add capability,
  but cannot widen the requesting component's permission grant or hide its own MCP/tools behind a
  generic bundle label.
- Uninstall is recoverable: core records and component artifacts remain; composition entries become
  unavailable until the component is restored or explicitly removed.

## DeepSeek Harness mechanisms we actually admit

The local DeepSeek source review is the implementation reference for this packet. Its useful unit
is not a package: it is a scoped composition with an owned lifecycle.

1. **Scope owner:** a composition is mounted beneath an owner Fiber/agent scope. `ctx.provide`,
   `ctx.on` and `ctx.effect` attach services/listeners/cleanup to that owner; child disposal unwinds
   the subtree. Fleet maps this to a ComponentActivation owned by Workspace plus optional Session
   scope, with the existing permission authority still outside the Component.
2. **Declaration table:** `ui-slots` declares slot kind, scope, children, store seat and injected
   business face in one `register` call. Runtime validation rejects undeclared slots, duplicate
   children, duplicate cells, cross-scope shared stores and invalid chain registration. Fleet's
   manifest and host registry need the same single declaration table; a visual menu entry cannot be
   allowed to appear without a body/effect declaration.
3. **Plan/health/rollback:** `EntryTree` recursively mounts rows, waits for fibers, aggregates
   failures and disposes a failed subtree. `mountPreset` then rejects inactive rows and services
   published into the process-global realm before exposing the composition. Fleet must expose a
   named `pending`, `failed`, `denied` or `unavailable` state and never publish half a Component.
4. **Immutable input:** DeepSeek's preset tree overrides `write()` so teardown cannot rewrite the
   vendor composition. User authoring copies a whole preset to a user root, refuses path/id
   collisions, tightens file modes and removes a partial copy on failure. Fleet keeps vendor
   manifests immutable and stores overrides/Composition in existing user/Workspace settings.
5. **Durable truth:** preset selection after creation is an explicit session event; resume uses the
   newest selection rather than only the creation header. Fleet's Component snapshot must likewise
   be recorded with the Session start/selection evidence, or a resumed Session may silently run with
   different tools/prompt/UI than the turn that produced its evidence.

Fleet does **not** import Cordis' process-wide Context kernel, 167-package split, property-proxy
injection or live self-modification. The implementation target is a small host-side pipeline:

```text
read manifest → validate dependencies/scope/license → build activation plan
→ request existing permission/trust → activate scoped entries → health audit
→ publish registry entries → persist observed revision → dispose as one lifecycle
```

No production caller exists for this pipeline yet. The current data-only resolver is not this
pipeline and must not be reported as one.

## Component manifest minimum

These are target manifest responsibilities, not fields already validated by the current TypeScript
interface. Every installable bundle must publish a machine-readable manifest before activation:

```text
id, version, publisher, license, integrity/signature
leftRailContributions[], rightWorkbenchContributions[]
requiredDependencies[], optionalDependencies[]
skills[], mcpServers[], knowledgeSources[]
nativeDataKinds[], migrations[], requestedPermissions[]
resourceEstimates, supportedPlatforms, lifecycle hooks
```

The manifest describes requests and composition, not grants. It must identify every transitive
dependency and every tool/effect exposed by the bundle. Runtime code is loaded only after the
manifest passes schema, license, integrity, compatibility and scope checks. A component update that
changes any declared capability creates a new revision and reopens the relevant permission review;
the old revision remains available for rollback while it is still installed.

Format adapters use this same manifest path. A document/design/media Component may depend on an
existing open-source engine instead of implementing a parser itself, but the manifest identifies the
adapter source, bundled dependency licenses, supported formats, fidelity class and worker/process
boundary. Adapter installation is lazy and reversible; replacing an adapter never replaces the
original ArtifactRef or silently migrates an existing native document.

## Reference projects and admitted mechanisms

| Reference | License | Use | Boundary |
|---|---|---|---|
| DeepSeek Harness | MIT | plugin-scoped services, UI slots, lifecycle disposal, per-agent composition and scoped presets | mechanism reference only; its runtime is not Fleet's agent/session authority |
| Cindy | Apache-2.0 | capability ownership, install/loadout separation, permission requests, approved snapshots and reconciliation | port contracts and invariants, not its Electron host or ghost-plugin store |
| Craft Agents v0.13.3 | Apache-2.0 | visual language, host shell, Session/Workspace/Settings/runtime seams | current implementation and visual authority |
| OpenChatCut | AGPL-3.0 | complete video capability shape: editable timeline domain, UI, Skills, MCP, proposals, undo and export | source/product evidence; direct code reuse requires AGPL compliance and an explicit owner/license checkpoint |
| AionUi | Apache-2.0 | Assistant as independent identity and wearable configuration | identity model only; no second loadout authority |
| QoderWork / TRAE | reference captures | discoverability and component-market browsing patterns | interface evidence only; their product concepts and stores are not imported |

## Example: official Video Editing Component

The official video bundle would provide timeline panels, validated edit commands, preview/export
jobs, video Skills, MCP tool declarations, starter knowledge and recommended Assistant defaults.
OpenChatCut's project format remains an adapter or migration target until compatibility and AGPL
obligations are resolved. A user may add a transcription MCP, private media knowledge source,
custom export preset, or personal editing habit in the Workspace Composition without changing the
official bundle.

## Example: proposed Trading/Market Analysis Component

This is a future Component proposal, not a built-in finance requirement. Its safe first boundary is
read-only market data, research notes, watchlists, paper trading, backtesting and replayable
strategy simulations. Provider credentials and broker integrations remain Workspace-scoped
references through existing Sources/credentials; they are never bundled secrets.

Live order placement is a separate high-risk capability. It requires a dedicated owner-approved
specification, explicit per-order confirmation, stale-price/order validation, broker response
evidence, idempotency and cancellation/recovery semantics. Installing a Trading Component or
enabling an MCP must never imply permission to place an order. The Component can be installed and
used for analysis without any live-trading grant.

## Acceptance scenarios

1. Two Workspaces enable different component sets and render different panels while sharing the one
   Session and Permission authorities.
2. A workspace override survives restart and component update; vendor defaults remain unchanged.
3. A denied MCP request names its permission reason and leaves the panel usable in degraded mode.
4. Removing a component preserves its files, timeline/project data, and session transcript.
5. A component contributes a tool entry or workbench panel through the host registry without
   modifying shell code; an invalid/unavailable contribution is rejected before activation with a
   named recovery state. An opened or restored panel preserves its identity if its provider vanishes.
6. A Workspace can enable an arbitrary number of components; adding a component does not disable an
   already-enabled component merely because both are large or visually rich.
7. Starting Fleet with a component installed but unused does not load its heavy renderer, workers,
   MCP process or external runtime; invoking the feature loads the smallest dependency closure.
8. A missing optional dependency leaves the basic component panel usable and names the exact
   capability and install/configure action that would enable it.
9. User resize, move, reorder, in-window float/re-dock and restart restore preserve panel identity,
   conversation drafts and native data. Keyboard operation and narrower-window recovery work too;
   native multi-window docking remains a separately verified R18 integration.
10. A multi-step Component flow records one inspectable operation lineage over the existing
    Session/Action/Job/Artifact authorities. Selecting an earlier operation targets its exact input
    or output version, creates a new branch, preserves old results and marks only dependent results
    stale until explicit recompute; the Component does not create a private trace store.
