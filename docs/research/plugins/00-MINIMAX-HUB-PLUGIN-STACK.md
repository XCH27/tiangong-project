# MiniMax Hub 1.1.1 Official Plugin Stack

> **Status:** `EVIDENCE_ONLY`. Evidence root: `extracted/minimax-hub-1.1.1/official-plugins/`, plus the
> reconstructed SDK shim and host symbols. Conclusions come from manifests, HTML, and bundle fingerprints.
> Official plugin bundles are not approved for redistribution or direct code reuse.

## 1. Host model

All six observed plugins are static web applications loaded in isolated iframes. Each supplies a manifest,
an HTML entry that loads `/__hub-sdk__.js`, and bundled assets. The injected protocol-v2 SDK exposes
`window.hub`; `postMessage` RPC reaches the host, which performs gateway mutations and returns permanent
canvas node IDs.

```text
plugin iframe
  → protocol-v2 handshake
  → window.hub canvas/storage/config/ui/dag/files calls
  → host policy and mutation transaction
  → BlobRef upload when binary data is involved
  → permanent node/group IDs on the canvas
```

Generation plugins insert placeholders, submit a DAG job, then replace or fail/clean the placeholder. The
plugin node is primarily a UI container; durable outputs are ordinary canvas nodes.

## 2. Observed plugins

| Plugin | Main technique | Host integration | Durable output |
|---|---|---|---|
| `panorama-viewer` | Native WebGL panorama viewport | incoming resources, asset picker, screenshot upload | image or image group |
| `relight` | React + Three.js preview + cloud DAG | placeholder, DAG, CDN upload | relit image |
| `watermark-tool` | Native DOM + Canvas 2D | asset input, storage, repeated insert | image or video |
| `n-storyboard` | React + Tailwind + cloud DAG | placeholder, DAG, optional super-resolution | storyboard images |
| `multi-shot` | React + cloud DAG | placeholder, DAG, config/storage | multi-angle images |
| `3d-director-stage` | React + Three.js/GLTF local editor | asset picker, config/storage, `onRun` | camera/scene screenshot |

Three implementation patterns emerge:

1. local viewport/editor plus canvas insert (`panorama-viewer`, `watermark-tool`);
2. React UI plus cloud DAG, placeholder, and insert (`relight`, `n-storyboard`, `multi-shot`);
3. local 3D editor plus screenshot insert (`3d-director-stage`).

## 3. Protocol surface

Observed SDK families include:

- `canvas`: current node, incoming resources, node lookup, asset picking, image/video/audio/text/file insert,
  groups, node updates, super-resolution, placeholders, incoming-change events;
- `storage` and `config`: node-scoped key/value state and plugin configuration;
- `ui`: notifications and fullscreen;
- `dag`: submit, query, and completion events;
- `files`: CDN upload and plugin-directory writes;
- optional `python`, `chat`, `skill`, and host `onRun` integration.

The reconstructed shim shows protocol version 2, handshake/RPC/event messages, a default RPC timeout, and
upload-to-BlobRef before binary mutations.

## 4. Transferable mechanisms

- iframe isolation with an explicitly versioned protocol;
- a narrow host SDK instead of direct access to canvas internals;
- placeholder → asynchronous job → typed success/failure/cleanup;
- binary transfer by BlobRef rather than embedding bytes in messages or model context;
- host-owned mutations returning permanent IDs;
- optional local-only plugins that do not require the cloud DAG;
- host design tokens and fallback file input when the host is absent.

For Fleet, these mechanisms must extend the existing Craft/Fleet action, permission, artifact, task, and
timeline authorities. Plugin discovery cannot imply permission, and `window.hub` must not become a second
mutation registry.

## 5. Minimum host requirements for a future admitted plugin surface

1. versioned static-plugin loading and isolation;
2. authenticated, origin-checked message transport;
3. capability declaration plus pre-call policy projection;
4. governed mutation transactions with permanent IDs and evidence;
5. upload-to-ArtifactRef/BlobRef with size, type, provenance, and lifetime rules;
6. task/job lifecycle with placeholder, cancellation, failure, retry, and cleanup;
7. asset picker and scoped storage/configuration;
8. accessible host tokens and explicit degraded behavior;
9. uninstall/revocation behavior that preserves durable user artifacts.

A cloud DAG is optional and must not be treated as a prerequisite for the plugin contract.

## 6. Evidence limits and disposition

The cloud model and DAG workers are closed; plugin code reveals only submit/completion contracts. Bundle
fingerprints do not establish a reusable license, security posture, or operational reliability.

**Use:** protocol shape, iframe boundary, placeholder lifecycle, by-reference binary flow, and permanent-ID
mutation semantics as comparison evidence.

**Do not use:** official plugin bundles, copied UI/assets, an ungoverned host bridge, or a new plugin state,
permission, artifact, or job authority.

Evidence paths:

```text
extracted/minimax-hub-1.1.1/official-plugins/*
reconstruction/minimax-hub-1.1.1/vendor/hub-sdk-shim.js
domain-plugin-agent/src/{plugin-host,sdk-v2-methods,protocol-v2}.ts
src/renderer/plugins/plugin-panel.tsx
```
