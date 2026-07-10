# Reference Project Policy

Reference projects are evidence and source material. They are **not** the roadmap.

**UI baseline (D52):** Craft Agents original chrome — simplify/optimize, do not greenfield.  
**Old Fleet UI (D50):** not a design reference. Backend-value only via migration ledger.

## Green-Light Sources

The following projects may be copied or adapted within the stated boundary, with license and
attribution preserved:

| Source | License Boundary | Allowed Use |
|---|---|---|
| `craft-agents-oss` | Apache-2.0 | Main application base. Target **v0.11.0**; see `docs/UPSTREAM-BASELINE.md`. |
| `AionUi` | Apache-2.0 | CLI runtime catalog, custom agents, ACP, process lifecycle, team/skill patterns. Must adapt into Craft session/permission/timeline. |
| `open-design` | Apache-2.0 | Runtime definitions, prompt transport, artifact/eval/design workflow patterns. Check subdirectory licenses before copying assets/templates. |
| `rtk` | Apache-2.0 | Output compression, savings discovery, hook matrix ideas. Do not auto-install global hooks without permission. |
| `fleet-old` | Internal Reference | Selective **backend** Fleet behaviour only via migration ledger (D50). Never merge or copy old shell/UI. |
| `codegraph` | MIT | Local code graph, indexing, structured queries, MCP installer experience. |
| `DeepSeek-Reasonix` | MIT | ACP/stdio, stable prefix cache, planner/executor, permission/sandbox ideas. |
| `deepcode-cli` | MIT | Skill paths, MCP, reasoning intensity, CLI/session management. |
| `opencut-classic` | MIT, approved 2026-07-01 | Native video timeline/store/rendering patterns (M09). Do not mix with incomplete `opencut` rewrite. |

## Black-Box Or Candidate Sources

Projects not listed as green-light are black-box unless explicitly promoted (D20).

**Black-box allows:** public behaviour study, boundary comparison, command-output observation,
independent reimplementation of ideas.

**Black-box forbids:** copying source, tests, types, configs, styles, assets, prompts, folder
layout as implementation, private/branded resources.

### Active candidate / black-box catalog (keep short)

Only projects with a **clear Fleet module hook** remain listed. Others were retired (see § Retired).

| Reference | License | Fleet hook | Allowed study | Forbidden |
|---|---|---|---|---|
| `Hermes Agent` | MIT | M12 packaging | Toolset packaging, dynamic skill templates, multi-step RPC ideas | Copy Python runtime/UI |
| `OpenClaw` | MIT | M06/M15 | Profile segmentation, gateway loopback, ax-tree selection ideas | Copy browser routing, telemetry, automation scripts |
| `browser-harness` | MIT | M06 | CDP websocket fallback, replay ideas | Copy loaders/tests/types |
| `Omnigent` | Apache-2.0 | M04 | Supervisor routing specs, multi-agent YAML, attach/fork session ideas | Copy compiler/orchestrator packages |
| `Letta-code` / `MemGPT` | BSD-3-Clause | M10 | Memory tiering, background agent lifecycle, compression ideas | Copy memory managers/DB configs |
| `mem0` | Apache-2.0 | M10 | Dedup/conflict/profile fact ideas | Copy storage wrappers / vector DB APIs |
| `Supermemory` | MIT | M10 | Entity graph / pruning / hybrid search **ideas** only | Copy indexers/scrapers/connectors |
| `Context-mode` | ELv2 | M10 | FTS/context-health **ideas** only | **ELv2 high-risk** — no copy/bundle |
| `Dockview` | MIT | M16 | Layout serialization / restore **ideas** (prefer Craft panels first, D52) | Copy Dockview wrappers into shell |
| `React-resizable-panels` / `React-rnd` | MIT | M16/M07 | Panel proportion / drag **ideas** | Copy calc/mouse trackers wholesale |
| `React-timeline-editor` | MIT | M09 | Timeline/clip layout **ideas** | Copy decoder/render hooks |
| [`xyflow/xyflow`](https://github.com/xyflow/xyflow) | MIT | **M07 preferred spike** | Custom nodes/edges, pan/zoom, minimap | Not frozen dependency until spike + Lead promotion |
| [`tldraw/tldraw`](https://github.com/tldraw/tldraw) | tldraw SDK license | M07 behaviour only | Custom shapes, viewport/culling, agent-canvas interaction **ideas** | Do not bundle production SDK as if MIT |
| [`ZSeven-W/openpencil`](https://github.com/ZSeven-W/openpencil) | MIT + audit | Design module (not M07 host) | `.op` artifacts, CLI/MCP, read-only viewer (D43) | Not React universal canvas host; no Agent runtime import |
| [`open-pencil/open-pencil`](https://github.com/open-pencil/open-pencil) | MIT + audit | Design module candidate | Editable design docs / headless tools | Not promoted; needs adapter spike |
| `OpenHands` | BSD-3-Clause | Later sandbox | Remote workspace / sandbox boundary **ideas** | Copy Docker orchestrators (daemon is D22 conditional) |
| `Repomix` | MIT | M10/M05 context | Repo-to-markdown / outline / secret-scan **ideas** | Copy parsers wholesale |
| `MarkItDown` | MIT | M05 file ingest | Multi-format → markdown **ideas** | Copy parser libs wholesale |
| `orca` | MIT | Parallel agents | Worktree isolation / multi-worker **ideas** | Copy desktop shell/telemetry |
| `Cline` / `Roo Code` | Apache-2.0 | M12 modes | Multi-role / scheduled automation / mode presets **ideas** | Copy IDE extension packages |
| `penpot` | MPL/local FOSS | Design product behaviour | FOSS design-app behaviour (black-box) | Not M07 host; do not replace Craft shell |
| **`LobeHub` / `lobe-chat`** | **LobeHub Community License** (Apache-2.0 **plus** commercial/derivative restrictions) | **文稿 / document editing UX** (primary); secondary: notebook/document tools IA | **Black-box only:** how “文稿模式” structures long-form edit, outline, AI-assist around a document, density of chrome, and progressive tools. Use to **inform optimize Craft TipTap/doc surfaces** (D52), not to replace Craft. Optional public docs of `@lobehub/*` component **ideas** (spacing, composition) without copying packages. | **Do not copy** LobeChat/LobeHub app source, package layout, styles, assets, or component library code into Fleet without a **separate commercial/derivative license + green-light promotion** (license §1b). **Do not** adopt LobeHub as product shell or second workbench (D50/D51/D52). **Do not** re-license Fleet as a LobeChat derivative. |

### Product behaviour only (no source)

| Product | Allowed | Forbidden |
|---|---|---|
| Codex browser settings | Browser control IA, permission vocabulary, data/screenshot/CDP categories (D30) | Source, branding, pixel UI copy |

### Explicitly not reference material for Fleet canvas/product shells

Do **not** treat as stack candidates or clone into `源码参考` for implementation:

| Project | Why not |
|---|---|
| `11cafe/jaaz` | Full AI-canvas **product shell**; not Craft surface; license needs audit; conflicts D39/D52 |
| `basketikun/infinite-canvas` | Full canvas workbench; **AGPL-3.0** high risk; not Craft-hosted |
| `hero8152/Infinite-Canvas` | Comfy/API wrapper product; not spatial OS in Craft |

Black-box browser demos only if needed; **no monorepo clone required** for stack choice (xyflow spike is the path).

## High-Risk Prohibitions

Never build Fleet into:

- a stealth browser / bot-detection bypass / captcha evasion product  
- automatic account rotation or quota evasion  
- cookie/token harvesting for account state  
- a second agent/session platform beside Craft  

**Retired from any “study antidetect parameters” list:** CloakBrowser and similar closed anti-detect stacks — **zero positive product value** under D23.

## Retired — no active reference value (do not clone / remove local checkouts)

These were removed from the active catalog because they add noise, wrong product gravity, license
dead-ends, or compliance risk without a clear Fleet module hook.

| Retired | Reason |
|---|---|
| `CloakBrowser` | Closed anti-detect; only enables forbidden product (D23) |
| `OpenUI` | Generic generative UI templates; not Craft simplify/optimize path |
| `Stitch-sdk` / `Stitch-skills` | External design-tool packaging; not Fleet spine |
| `Memanto` / `mempalace` | Memory-palace canvas metaphor ≠ M07 work canvas (ADR-0033) |
| `Remotion` | Bespoke license blocks commercial bundling; M19 uses native deck + honest export, not Remotion app |
| `Headroom` | Overlaps green-light `rtk` compression themes; no unique Fleet need |
| `Zvec` | Premature vector/SQLite stack vs ADR-0034 W1/W2 filesystem spine |
| `nezha` (三头六臂 concurrency kit) | Unrelated concurrency framework; no module hook |
| `kdenlive` | Full NLE app; video direction is `opencut-classic` patterns only |
| `warp` / `zed` | Commercial/product UX only; no adapt path into Craft Electron (D52) |
| `cherry-studio` | Competing AI desktop shell; UI not a baseline (D50/D52) |
| `cc-switch` | Multi-provider account switcher surface → quota/account-evasion product risk (D23) |
| `ego-lite` | Separate “agent browser” product; browser path is Craft BrowserPane (D10) |
| `cmux` / `cockpit-tools` / `oh-my-pi` / `OpenCLI` / `golutra` / `mercury-agent` / `palmier-pro` / `OpenMontage` / `multica` / `Kun` / `AstrBat` / `CowAgent` / `CoreCoder` / `OpenCLI` | Competing agent/video/terminal products or toys without a unique green-light hook; prefer listed green/black-box set |

Re-add only via Promotion Process below.

## Local checkout policy (`源码参考/`)

| Keep locally (examples) | Do not keep |
|---|---|
| Green-light: craft-agents-oss, AionUi, fleet-old, DeepSeek-Reasonix, open-design, rtk, codegraph, deepcode-cli, opencut-classic | Retired table rows |
| Thin black-box: hermes-agent, orca, OpenHands, omnigent, openpencil, tldraw, cline, penpot | Full clones of warp/zed/cherry-studio/kdenlive/nezha/… |
| `software/lobehub` | **Allowed again** as black-box for **文稿/document edit UX only** (see catalog). Not green-light; no source copy. |

`源码参考` is **gitignored** local material; Fleet repo tracks policy + scripts, not third-party trees.

## Promotion Process

To promote a candidate to green-light:

1. Verify license and subdirectory licenses.  
2. Verify the exact capability needed and module owner.  
3. Explicit user approval if not already approved.  
4. Update `DECISIONS-LEDGER.md`.  
5. Update this file.  
6. Attribution before any code copy.  

MIT or Apache-2.0 alone does not promote a project.
