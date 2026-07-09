# Reference Project Policy

Reference projects are evidence and source material. They are not the roadmap.

## Green-Light Sources

The following projects may be copied or adapted within the stated boundary, with license and attribution preserved:

| Source | License Boundary | Allowed Use |
|---|---|---|
| `craft-agents-oss` | Apache-2.0 | Main application base. |
| `AionUi` | Apache-2.0 | CLI runtime catalog, custom agents, ACP, process lifecycle, team/skill patterns. Must adapt into Craft session/permission/timeline. |
| `open-design` | Apache-2.0 | Runtime definitions, prompt transport, artifact/eval/design workflow patterns. Check subdirectory licenses before copying assets/templates. |
| `rtk` | Apache-2.0 | Output compression, savings discovery, hook matrix ideas. Do not auto-install global hooks without permission. |
| `fleet-old` | Internal Reference | Legacy implementation codebase patterns (M02/M04/M10/M11/M12). Allowed for porting/adapting. |
| `codegraph` | MIT | Local code graph, indexing, structured queries, MCP installer experience. |
| `DeepSeek-Reasonix` | MIT | ACP/stdio, stable prefix cache, planner/executor, permission/sandbox ideas. |
| `deepcode-cli` | MIT | Skill paths, MCP, reasoning intensity, CLI/session management. |
| `openpencil` | MIT, approved 2026-07-01 | Native design canvas engine source/patterns. Do not use it as Fleet permission/timeline. |
| `opencut-classic` | MIT, approved 2026-07-01 | Native video timeline/store/rendering source/patterns. Do not mix with the newer incomplete `opencut` rewrite. |

## Black-Box Or Candidate Sources

Projects not listed above are black-box references unless explicitly promoted. That includes permissively licensed projects if they have not been approved.

Black-box use allows:

- public behavior study
- product boundary comparison
- command output observation
- protocol idea extraction when reimplemented independently

Black-box use forbids copying:

- source code
- tests
- type definitions
- configs
- styles
- assets
- prompts
- folder structure as implementation
- private or branded resources

### Candidate & Black-Box Reference Catalog

| Reference | License | Allowed Use in Fleet | Forbidden/Risk Boundary |
|---|---|---|---|
| `Hermes Agent` | MIT | Study toolset packaging; reference dynamic skill template compilation and non-blocking multi-step RPC model. | Cannot copy Python execution module, codebase, or UI patterns. |
| `OpenClaw` | MIT | Reference managed profile segmentation, gateway loopback routing, and ax-tree element selection logic. | Cannot copy browser routing, telemetry or profile automation scripts. |
| `browser-harness` | MIT | Study low-level CDP websocket channel fallback, execution replay, and self-healing selector registers. | Cannot copy script loaders, browser automation tests, or types. |
| `LobeHub` | LobeHub Community License | Study Chief Agent Operator layout, Personal Memory UI, dynamic capabilities marketplace, and settings health panel. | **LobeHub Community License is high-risk.** Strictly prohibited from copying any codebase, package layout, folder structure, or component styles. |
| `Omnigent` | Apache-2.0 | Study tech-lead supervisor routing specs, multi-agent YAML definitions, and attach/fork co-driving session sync protocols. | Cannot copy compiler, engine orchestrator code, or packages. |
| `Letta-code` / `MemGPT` | BSD-3-Clause | Study core/recall/archival memory tiering, background agent lifecycle, and long-context session compression. | Cannot copy memory managers, system drivers, or database configurations. |
| `mem0` | Apache-2.0 | Reference smart deduplication, conflict resolution, and long-term user profile facts aggregation. | Cannot copy backend storage wrappers or Qdrant/Milvus API interfaces. |
| `Supermemory` | MIT | Study entity relation graphing, graph entity pruning, and semantic hybrid search structures. | Cannot copy indexing algorithms, scrapers, or database connectors. |
| `Memanto` (Palace) | MIT | Reference palace spatial mapping and spatial nodes visual editing. | Cannot copy visual canvas code, layout algorithms, or icons. |
| `Context-mode` | ELv2 | Reference FTS5/BM25 local indexing, context health diagnosis indicators, and big output fold criteria. | **ELv2 is high-risk.** No code copying or direct binary bundling allowed. |
| `Dockview` | MIT | Study layout state serialization, window division actions, and state-restoring layout replay. | Cannot copy Dockview panel wrappers or Electron window managers. |
| `React-resizable-panels` / `React-rnd` | MIT | Reference panel sizing proportions and spatial coordinates state bindings. | Cannot copy layout calculations or drag-and-drop mouse trackers. |
| `React-timeline-editor` | MIT | Reference keyframe tracks configuration and timeline clips layout structures. | Cannot copy time scaling, canvas rendering, or media decoder hooks. |
| `Remotion` | Bespoke | Reference visual movement paths layout and frame-by-frame rendering output validations. | Bespoke license prevents commercial use. No source copy or direct inclusion. |
| `Stitch-sdk` / `Stitch-skills` | Apache-2.0 | Study Stitch capability packaging, hot-plug skill loading, and ACL permissions profiles. | Cannot copy SDK package files, dependency managers, or script runtimes. |
| `OpenUI` | MIT | Reference UI template specifications and streamable incremental UI rendering. | Cannot copy generation templates, parser routines, or styling systems. |
| `Cline` / `Roo Code` | Apache-2.0 | Study multi-role workspaces, scheduled automations, and Custom Modes settings presets. | Cannot copy IDE extension packages or workspace control wrappers. |
| `OpenHands` | BSD-3-Clause | Reference remote workspace container boundaries, security sandbox limits, and multihost environment management. | Cannot copy Docker orchestrators, sandbox script executors, or servers. |
| `Headroom` | Apache-2.0 | Reference symbolic prefix compression, reversible hash caching, and token shaping limits. | Cannot copy compression layers, MCP proxy servers, or local drivers. |
| `Repomix` | MIT | Reference repo-to-markdown packers, tree-sitter AST structural outline extraction, and security/secret scans. | Cannot copy AST parsers, line counters, or ignore file readers. |
| `MarkItDown` | MIT | Study multi-format files (PDF, EPub, docx) parser hooks, and context alignment markdown pipelines. | Cannot copy document readers, image extractors, or parser libs. |
| `Zvec` | Apache-2.0 | Reference SQLite FTS5 + vector dense/sparse local RAG indexing integration. | Do not copy raw vector library or C++ binding files into Electron. |
| `CloakBrowser` | Closed | Study antidetect fingerprint patch parameters and multi-browser profile configurations. | **High Risk.** Prohibited from integrating, bundling, or copying any stealth/captcha evasion systems. |
| `orca` | MIT | Study parallel worker workspace sandbox orchestration, Git worktree isolation lifecycle, and visual agent session timelines. | Prohibited from copying desktop shell code, worktree execution scripts, or agent telemetry wrappers. |

## Product Behavior References

Some products are behavior references only, not source-code sources.

| Product | Allowed Use | Forbidden Use |
|---|---|---|
| Codex browser settings | Browser control IA, permission vocabulary, data/screenshot/CDP setting categories. | Source code, private assets, branding, or copying UI implementation details. |

## High-Risk Prohibitions

Never build Fleet into:

- a stealth browser
- a bot-detection bypass product
- an automatic account rotation or quota evasion tool
- a product that reads cookies/tokens to infer account state
- a second agent/session platform beside Craft

## Promotion Process

To promote a candidate to green-light:

1. Verify license and subdirectory licenses.
2. Verify the exact capability needed.
3. Ask for explicit user approval if not already approved.
4. Update `DECISIONS-LEDGER.md`.
5. Update this file.
6. Update attribution records before copying code.

MIT or Apache-2.0 alone does not promote a project.
