# SYS-09 — Components and workspace compositions

First-slice readiness is recorded per capability in PACKET-INDEX; complete Component host/runtime `not implemented`. Development anchor:
owner-directed **early R15/R18 foundation** in
[`../../specs/R18-right-workbench.md`](../../specs/R18-right-workbench.md), then R15 distribution
and R18 advanced/native-window closure. This host starts only after the baseline exit in
`../../specs/R0-baseline-audit.md`; R6/R9 remain unnecessary as blanket host prerequisites.
This packet defines the relationship between bundles, Assistant identity and Workspace configuration;
it is not a second roadmap or an assertion that the data types are already connected to the UI.

## Current code boundary

The v0.13.4 rebuild removed `shared/src/components/`, `shared/src/layout/` and the Fleet
`right-sidebar/` host. The resolver, bundle adapter, contribution registry and their tests survive
only at `snapshot/pre-rebuild-2026-09-21`. Their earlier convergence and test results do not prove
current activation. Component host/runtime and user-controlled move/reorder/float are
`not implemented`.

Craft `AppShell` and `PanelStackContainer` remain the production host. Files is mounted through
`SessionInfoPopover`/`SessionFilesSection`; session Notes RPC remains, but has no renderer caller.
The foundation must trace these surviving owners and supply a real Notes consumer before claiming
a two-panel loop. It may selectively reuse reviewed snapshot mechanisms after comparing current
Craft; it must not restore the discarded shell.

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

## DeepSeek Harness mechanisms to adapt after proof

The local DeepSeek source review is a bounded implementation reference for this packet. Its useful unit
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

No production caller exists for this pipeline yet. The archived data-only resolver is not this
pipeline and must not be reported as one.

## Component manifest minimum

These are target manifest responsibilities, not fields already validated by a current TypeScript
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
| Craft Agents v0.13.4 | Apache-2.0 | visual language, host shell, Session/Workspace/Settings/runtime seams | current implementation and visual authority |
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
10. **Later multi-step integration, not the FND-01..08 host entry gate:** a Component flow records one inspectable operation lineage over Session evidence and the Action/Job/Artifact authorities when their owning releases implement
    those contracts. Selecting an earlier operation targets its exact input
    or output version, creates a new branch, preserves old results and marks only dependent results
    stale until explicit recompute; the Component does not create a private trace store.

---

## Module boundary — Workbench and panel host module

First-slice readiness: see PACKET-INDEX and the execution contracts below. Development order: the owner-directed early R15/R18 foundation in
[`../../specs/R18-right-workbench.md`](../../specs/R18-right-workbench.md), after the R0 baseline exit and before domain components;
R18 later closes native multi-window/advanced layout. A complete registered host is
`not implemented`. Craft fixed-column resizing is `wired but not visually checked`; the former
Fleet Files/Browser/Notes/History rail and History placeholder are absent.

#### Reality and activation sequence

The current Craft `AppShell` + `PanelStackContainer` owns the horizontal stack. Current code
boundaries are listed above; neither the archived registry nor layout model is mounted or present
in `app/`. R18 owns the production consumer and lifecycle proof.

After baseline exit, reuse mounted Files and wire a real Notes consumer to the surviving RPC. Preserve one
Workspace/Session binding and one layout representation; do not add another Session or settings
store. Global/workspace Component activation does not wait for a marketplace, delegation or memory.
The executable spec owns the ordered steps, denial/unload/recovery behavior and rollback boundary.

#### Layout scope

Left tools/right workbench are defaults, not immovable regions. Required foundation behavior is
user-controlled resize, move, reorder, in-window float/re-dock and Workspace/window-scoped restore,
including conversation views. Layout stores ids/geometry only; drafts and domain state remain in
their native owners. Keyboard controls and viewport-clamped restore are required. Moving panels
must not recreate live jobs or eagerly load unused component implementations.

Acceptances WB-001..003 / CORE-11-A require two real production consumers: reuse Files and
wire Notes to its existing RPC before claiming the two-panel proof. Placeholder panels do not count. FND-01..08 in the foundation spec make the current scope testable. Native
multi-window detach/re-dock needs additional Electron protocol, security and lifecycle evidence;
it is not proven by a browser-library demo. New production dependencies remain an owner checkpoint.

## View identity and restoration details

Contribution ID identifies the provider; instance ID identifies one opened view. Validate route
state and migration through the provider, reject duplicate registrations, and isolate view faults.
Layout persists references/geometry only. Failed migration opens a safe default while preserving a
recoverable rejected snapshot; reset never deletes domain work. Closing an editor preserves or
resolves its dirty draft. Hiding a view may suspend rendering, but live work remains owned outside
React. Agent reveal is an ephemeral, permission-checked request and cannot persistently steal focus
or rearrange layout. These requirements share FND/WB acceptance; no second host spec is retained.

## Host selection proof

Use the same two existing production consumers (Files and surviving Notes RPC) for both the
extended Craft stack and bounded Dockview comparison. Keep their native data owners and include
a conversation draft. Exercise twenty move/resize/float/re-dock cycles, keyboard equivalents,
ten close/reopen cycles, a failed Notes save, a narrower viewport and restart. Count mounted
consumers/listeners and owned resources before and after: no duplicate subscription, Session,
draft or native view is allowed. An unopened consumer must have no loaded implementation.
Round-trip the layout with an unknown provider/version while preserving the rejected snapshot.

Selection requires FND-01..08 plus demonstrably simpler complete lifecycle/integration than the
local extension. Resizing support alone is not sufficient. If neither meets identity/draft/
recovery, keep the current host and fix the smallest failed mechanism; do not start a replacement
shell. Native Electron popout/reparent is outside this first comparison and keeps its later R18
protocol/security/packaging proof. No library dependency is admitted merely by this specification.

## Development-reference constraints

Use the [current checkout/document intake](../../references/REFERENCE-REGISTRY.md#current-checkouts-and-development-document-intake)
separately from old source locks. Cindy's `LayoutStore.setLayout` distinguishes an applied layout
from successful persistence; preserve that distinction in CORE-11. Its read fallback overwrites a
corrupt archive, so Fleet must retain original bytes and expose a recovery reason before writing a
replacement. Unknown component IDs retain their saved positions. Do not copy Cindy's global-only
layout or fixed conversation geometry over Fleet's Workspace/device contract.

ORCH-03 uses one scoped contribution registry and host-owned disposers. Hermes' Desktop SDK offers
a useful public UI-kit/contribution contract, but its documented full-authority renderer plugins are
not isolated and their runtime implementation is absent from this checkout. Omnigent's manifest
version/collision rules and OpenCode's awaited registrations are comparison inputs, not libraries
selected for Fleet. OpenHands' extension example has a mock backend; a passing demo cannot satisfy
install/disable/restart proof. Codex documents saved plugin-selection preferences that do not yet
filter capabilities: Fleet's proof must separately check the effective tool set after disable and
on the next turn/resume, including late activation results and cleanup of prior subscriptions.

## Execution contracts

These sections own the next step for the listed capability IDs. Read the
[common execution contract](../../14-MODULE-ARCHITECTURE.md#executable-next-step-contract)
and the release/spec anchor in [PACKET-INDEX](../PACKET-INDEX.md). Gates do not open merely
because this packet has instructions. Planned regression targets below do not exist yet unless
implementation has added them; extend a matching existing behavioral test instead of duplicating it.

### Execution CORE-11

**Panels, docking and layout**

- **Next:** `PROVE` — foundation immediately after R0 exit; FND-01..08.
- **Sources:** [`apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx`](../../../app/apps/electron/src/renderer/components/app-shell/PanelStackContainer.tsx); [`apps/electron/src/renderer/contexts/NavigationContext.tsx`](../../../app/apps/electron/src/renderer/contexts/NavigationContext.tsx); [`apps/electron/src/renderer/components/right-sidebar/SessionFilesSection.tsx`](../../../app/apps/electron/src/renderer/components/right-sidebar/SessionFilesSection.tsx); [`packages/server-core/src/handlers/rpc/sessions.ts`](../../../app/packages/server-core/src/handlers/rpc/sessions.ts).
- **Deliver:** Compare extending current panel stack with bounded Dockview integration using Files and real Notes RPC consumers; choose one layout owner before adding user move/reorder/float/restore.
- **Data:** Stable contribution ID and view instance ID bind Workspace/Session and native consumer. One layout persists IDs/geometry only; notes, drafts and file/job data remain with their owners.
- **Failure:** Rejected layout migration is preserved with safe fallback; missing provider renders unavailable. Moving/hiding cannot restart work or lose drafts; native popout is later R18 closure.
- **Proof:** CORE-11-A — FND-01..08 using real Files/Notes, drag and keyboard move/resize/float/re-dock, narrow-window restore, provider removal, failed save and restart. Compare same workload and state preservation. Planned regression/probe target relative to `app/`: `scripts/probes/core-11.ts`. After adding the target, run from `app/`: `bun run scripts/probes/core-11.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft PanelStackContainer first; Cindy right-sidebar registry; Dockview serialization/disposal and react-resizable-panels size constraints. No library selected before proof/checkpoint. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).

### Execution ORCH-03

**Component manager and workspace compositions**

- **Next:** `IMPLEMENT` — foundation after R0; follows CORE-11 chosen owner.
- **Sources:** [`apps/electron/src/shared/settings-registry.ts`](../../../app/apps/electron/src/shared/settings-registry.ts); [`packages/shared/src/config/storage.ts`](../../../app/packages/shared/src/config/storage.ts); [`packages/shared/src/workspaces/storage.ts`](../../../app/packages/shared/src/workspaces/storage.ts); [`packages/shared/src/skills/storage.ts`](../../../app/packages/shared/src/skills/storage.ts); [`packages/shared/src/sources/storage.ts`](../../../app/packages/shared/src/sources/storage.ts).
- **Deliver:** Register Files/Notes contributions and resolve global/workspace/session Component overrides through existing owners; connect real activation/disposal before adding domain bundles.
- **Data:** Immutable manifest defines contribution/dependency IDs and requested capability. Effective composition resolves vendor < user < Workspace < turn snapshot; it is derived, not another settings database.
- **Failure:** Cycles/version conflicts fail before activation; optional missing dependency degrades only its feature. Disable preserves native data/drafts and revokes availability after owned resources settle.
- **Proof:** ORCH-03-A — Two Workspaces, reset-to-inherit, active-turn change, lazy-load assertion, denied tool, failed activation and remove/reinstall; FND-05..08 and stable view identity. Planned regression/probe target relative to `app/`: `apps/electron/src/shared/__tests__/fleet-orch-03.test.ts`. After adding the target, run from `app/`: `bun test apps/electron/src/shared/__tests__/fleet-orch-03.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Cindy install/loadout/approved snapshot, DeepSeek slot lifecycle and Craft settings. Components may not shadow the shell or become Assistant identity. Source locks and limits: [reference registry](../../references/REFERENCE-REGISTRY.md#bounded-source-review--2026-09-21).
