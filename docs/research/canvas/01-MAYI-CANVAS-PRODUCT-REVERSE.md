# Mayi Canvas Product Reverse-Engineering Record

> **Status:** `EVIDENCE_ONLY`. Version observed: 3.4.4, July 2026. Evidence came from an extracted ASAR,
> formatted bundles, Electron main/preload code, restored reference source, package metadata, and related
> analysis files. The product source has no established reusable code license in this packet: do not copy or
> redistribute implementation. Use observations only to test Fleet designs against Craft's canvas and action
> seams.

## 1. Product and architecture

Mayi Canvas is an Electron/React infinite-canvas application for node-based AI media production. It combines
visual node graphs, rich media nodes, provider-backed generation, and agent-driven canvas actions.

Observed stack:

| Layer | Observed implementation |
|---|---|
| Shell | Electron, with a Tauri-compatible preload shim |
| UI/build | React 18, TypeScript, Vite |
| Canvas | Custom DOM nodes, CSS `translate3d`, SVG grid and Bezier connections |
| 3D | Three.js in specific director nodes |
| State | React hooks, a global viewport store, event callbacks, debounced history |
| Persistence | local state plus JSZip project containers and asset directories |
| Generation | provider adapters behind local HTTP proxies, polling, and SSE |
| Performance | visibility and thumbnail workers, object pooling, low-zoom simplification |

The runtime does not use Leafer, Fabric, Konva, or Pixi as its primary canvas. Rich HTML node contents make
DOM/SVG a deliberate tradeoff: native forms, chat, video, and editors are easy, while visibility, connection,
and transform performance must be managed explicitly.

## 2. Canvas mechanics

```text
Viewport
└── World layer: translate3d(x, y, 0) scale(zoom)
    ├── SVG grid
    ├── SVG connection paths: hit area, background, main, animated flow/glow
    └── absolute DOM node wrappers
        └── React node content, ports, header, resize handles
```

Nodes share a wrapper for drag, selection, resize, chrome, and typed input/output ports. Connections use DOM
port locations and layered SVG Bezier paths. World/screen conversion lives in viewport helpers. The observed
performance path activates simplification around larger graphs, uses `translate3d`, workers for visibility and
thumbnails, and object reuse.

Fleet implication: this is evidence that a DOM/SVG graph can host rich production nodes. It is not evidence
that Fleet should replace or bypass the accepted Craft/canvas base. Compare the concrete node, edge, viewport,
accessibility, and evidence requirements before selecting a renderer.

## 3. Agent control boundary

The product exposes both an in-canvas chat node and an external local HTTP bridge. The bridge was observed at
`127.0.0.1:47328/agent`, with health, capability, state, connect, and action endpoints; bearer-token validation;
a self-describing capabilities document; and an action allowlist including create/update/connect/select/run,
undo, batch, multi-reference connection, and a higher-level image-series action.

Typical path:

```text
external agent
  → capability discovery and minimal state
  → authenticated allowlisted action
  → Electron main-process validation
  → renderer/domain mutation
  → node IDs, state, and evidence returned
```

Transferable ideas:

- discover capabilities instead of hard-coding every node schema;
- expose high-level atomic actions for common multi-step operations;
- return stable node/artifact identifiers;
- keep a local authentication boundary and a strict action allowlist.

Required Fleet corrections:

- route all actions through the one Craft-derived permission, timeline, and action authority;
- scope and expire grants rather than treating a bearer token as sufficient policy;
- include caller, target, expected state/observation version, typed failure, and evidence;
- do not create a second renderer-owned mutation authority or a generic local control plane.

## 4. Node and production patterns

Observed node families include image/video input, rich text, storyboard/table, image/video/music/speech
generation, preview/compare/local-save, inpaint, doodle, 3D direction, motion control, video analysis,
upscaling, and ComfyUI/RunningHub integration.

All share ports and node chrome; generation nodes collect local settings and upstream references, choose a
provider adapter, submit through a local proxy, poll or stream completion, update the node, and propagate a
result. Specialized editors keep domain-native state: layered masks for inpainting, stroke vectors for doodle,
camera/scene data for 3D, and structured shot data for storyboards.

Fleet implication: preserve domain-native models and pass large media by ArtifactRef. A universal node payload
or universal agent action would erase useful semantics and increase context/tool cost.

## 5. Desktop services and extensions

The Electron main process starts multiple localhost proxy/receiver services for provider authentication,
CORS, uploads, callbacks, local save, and the agent bridge. It also supplies dialogs, clipboard, tray, and
filesystem operations. Additional integrations include a browser extension, ComfyUI/RunningHub, cloud object
storage, and Adobe CEP panels that poll a local directory/manifest and import files through ExtendScript.

These are product observations, not recommended topology. Fleet should consolidate service ownership behind
existing Craft adapters and avoid a new port/service per provider. File polling is a fallback integration
pattern, not the default when a structured authenticated adapter exists.

## 6. Project format and assets

Observed persistence supports a ZIP container with project JSON, manifest, and media directories; a lighter
JSON form; a directory form; and selected-node workflow fragments. Assets receive identifiers, local caching,
optional object-storage upload, and worker-generated thumbnails.

Fleet may use this evidence when evaluating portable project/export packages, but ArtifactRef and Workspace
remain Fleet-owned concepts. Do not adopt Mayi's archive schema without an accepted import/export contract,
path safety, versioning, provenance, and recovery tests.

## 7. Evidence limits and disposition

- Bundle observation can establish behavior and implementation fingerprints, not complete intent or safety.
- Closed provider gateways hide model/DAG worker behavior.
- Local bridge behavior does not prove Fleet-grade authorization or stale-state safety.
- Product names, assets, extracted bundles, and implementation code are not redistributable reference assets
  without a verified license.

**Adopt as evidence:** DOM/SVG rich-node viability, typed ports, atomic high-level canvas actions, capability
discovery, stable IDs, worker-assisted visibility, and portable asset packaging concerns.

**Reject as direct implementation:** copied source, a parallel local action server, bearer-token-only policy,
provider-specific proxy sprawl, or a new canvas authority outside Craft/Fleet.

Evidence navigation is retained under the Mayi Canvas source packet and its extracted/restored analysis files;
consult the source reference registry before any symbol-level use.
