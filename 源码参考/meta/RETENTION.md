# Source Reference Retention

Reference checkouts are rebuildable, read-only, local caches excluded from Fleet Git. Retain a
repository only when implementation repeatedly needs source information that cannot be preserved in
a concise capability-map entry.

## Top-tier admission gate

A standing checkout must be a leading implementation or official open standard for its narrow seam,
with active maintenance, a clear license, real tests/recovery behavior and architecture that can be
transferred without importing a second Fleet authority. Stars and README claims are insufficient.
Older broad candidate lists are not restored. Smaller projects may appear in an evidence note only
when they prove a unique failure mode; they do not receive standing checkout or primary-reference
status.

Retention follows source-information density, not near/mid/far-term labels. Product order is solely
R0–R18 in [`../../docs/05-ROADMAP.md`](../../docs/05-ROADMAP.md). This file controls cache presence,
not admission or implementation order.

## Cache grades

| Grade | Use when | Local form | Removal condition |
|---|---|---|---|
| FULL | Several real loops need history, migration or recovery evidence | Full worktree; full history/submodules when evidence requires them | A stronger reference replaces it or no caller remains |
| SPARSE | A monorepo contributes only bounded subtrees | Sparse checkout | The seam disappears or upstream structure invalidates the evidence |
| TEMP | One active comparison | Shallow `_tmp-*` checkout | Remove immediately after facts are integrated |

Cache grade does not grant admission. Canonical admission lives in
[`../../docs/references/REFERENCE-REGISTRY.md`](../../docs/references/REFERENCE-REGISTRY.md).
`LOCAL_IMPROVEMENT` and `EVIDENCE_ONLY` normally do not justify retention; `MODULE_REFERENCE`
normally uses SPARSE. There is no NOTES grade.

## Retained checkouts

| Path | Grade | Primary evidence use |
|---|---|---|
| `software/craft-agents-oss-v0.10.5` | FULL / pinned `c9d9a26fbefa` | Craft product/interaction baseline |
| `software/craft-agents-oss` | FULL / pinned `a60ebc1a5a7c` (v0.11.2) | Selective independent-fix/backend comparison only |
| `software/pi-mono` | FULL / pinned `13437ca82889` | Same-lineage harness/profile comparison for Craft's embedded Earendil Pi; never a second kernel |
| `software/OpenHands` | FULL | Sandbox lifecycle |
| `software/hermes-agent` | FULL | Messaging gateway and capability-probe mechanisms |
| `software/penpot` | FULL | Design document model |
| `software/opencut-classic` | SPARSE | Archived NLE mechanisms; admission pending |
| `software/opencut` | SPARSE | Current rewrite direction only; advertised editor/API/plugin surfaces are not implementation authority |
| `software/flowgram.ai` | SPARSE | Workflow/canvas editor seams; never its workflow runtime authority |
| `software/browser-use` | SPARSE | Browser session, CDP snapshot and recovery executor patterns behind BrowserPane |
| `software/mcp-registry` | SPARSE | Official MCP registry schema, namespace, version and publication mechanisms |
| `software/tldraw` | SPARSE | Spatial-canvas behavior evidence; production license gate |
| `software/codex` | SPARSE | Agent graph, protocols, state and safety policy |
| `software/opencode` | SPARSE | Parent/child Session, task/Todo, background jobs, token/cost and compaction |
| `software/openclaw` | SPARSE | Channels, extensions and security |
| `plugins/repomix` | FULL | Repository context packaging |
| `plugins/markitdown` | FULL | Document ingestion |
| `plugins/xyflow` | FULL | Node graph |
| `plugins/dockview` | FULL | Docking layout |
| `plugins/react-resizable-panels` | FULL | Split-panel layout |
| `plugins/react-rnd` | FULL | Drag/resize primitives |
| `plugins/hyperframes` | SPARSE | Deterministic HTML video composition, render cancellation and failure classification |
| `plugins/mem0` | SPARSE | Explicit memory CRUD and evaluation mechanisms; never a Fleet memory service |
| `plugins/agentskills` | SPARSE | Official Agent Skills format and progressive-disclosure client guidance |
| `plugins/playwright-mcp` | SPARSE | Structured browser snapshots and deterministic action-tool boundary |

`clone_repos.sh` is the machine source of URLs and sparse settings. Adding, upgrading or
downgrading a keeper synchronizes this table, that script, the capability map and
`REVIEWED-HEADS.tsv`.

## Disk and cleanup boundaries

- `software/`, `plugins/` and local visual samples are not Fleet product Git content.
- Checkout modifications are contamination; authorized refresh rebuilds from upstream without backup.
- Cleanup is limited to reference caches, temporary directories and already-integrated reports.
- Never remove Fleet product code, user data, unresolved design assets or main-repository history.
- A repository license never transfers automatically to Fleet; verify target files, NOTICE and
  distribution terms before any second-party development.
