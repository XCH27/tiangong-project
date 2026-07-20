# Legacy candidate map

This is the preserved intake map for the previously collected GitHub list. It is deliberately
separate from `REFERENCE-REGISTRY.md`: an intake name is not evidence, a dependency, or a product
decision. The original list is retained outside the active product tree; this map prevents its
loss while making the next audit bounded and module-owned.

## Intake rules

Every candidate starts as `UNTRIAGED`. It can move only to `EVIDENCE_ONLY`, `LOCAL_IMPROVEMENT`,
`MODULE_REFERENCE`, `FORMAL_REFERENCE`, or `REJECT` after the seven-field admission record in
[`REFERENCE-REGISTRY.md`](REFERENCE-REGISTRY.md) is complete. Candidates with no local checkout
have no source evidence, regardless of how familiar the project name is.

## Module queues

| Queue | Representative candidates from the preserved intake | First owner | Current safe use |
|---|---|---|---|
| Agent operating system / harness | Aider, Codex, Craft Agents, OpenCode, Grok Build, AionUi, AstrBot, Letta Code, Hermes Agent, ECC, Superpowers, agents.md | SYS-01 | compare identity, action envelopes, delegation, review and harness behavior; never import a second authority |
| Remote engineering office | GitHub CLI/gh-dash, cloud/remote workspace candidates, OpenHands, Orca, OpenClaw | SYS-02 | compare connection, grant, worktree and PR evidence; keep transport behind Fleet adapters |
| Token, memory and skills | Headroom, RTK, Repomix, CodeGraph, claude-mem, mem0, EverOS, agentmemory, context-mode, skills-manager, ponytail | SYS-03 | measure reduction and quality against one ContextPack/UsageRecord authority |
| Browser and evidence | agent-browser, browser-use/browser-harness, Chrome DevTools MCP, crawl4ai, Firecrawl CLI, Agent-Reach, Obsidian Clipper, FluentRead | SYS-04 | compare navigation, capture, annotation, download and permission boundaries; evidence remains an ArtifactRef |
| Design, web and spatial | Penpot, Open Pencil/OpenPencil, Open Design, Lobe UI, Assistant UI, Magic UI, Cult UI, Figma-related adapters, Canvasight, Cowart | SYS-05 | compare schemas, transaction batches, rich cards and preview; canvas is a projection, never an authority |
| AIGC and media production | OpenCut, opencut-classic, OpenReel Video, Shotcut, LosslessCut, React Video Editor, Palmier Pro, Hyperframes, Remotion, pyvideotrans, Storyboard, OpenMontage, video-use, ComfyUI, Blockbench MCP | SYS-06 | compare timeline, render, captions, shot planning, 3D and agent control; see the video packet for exact evidence targets |
| Workflow and delivery | FlowGram, MCP-UI, InsForge, LiteLLM, LLMRouter, Continue, MiroFish, OpenMAIC | SYS-07 | compare finite DAG/editor patterns and delivery UX only; no imported executor until the same-task/deletion tests pass |
| Knowledge, docs and support | MarkItDown, Obsidian Copilot, LLM Wiki, Note-gen, LibreChat, Open WebUI, writing-helper, Bilibili subtitle/clipper tools | SYS-03 / SYS-04 / SYS-06 | use for ingestion, retrieval, caption and writing comparisons; native document and evidence authorities stay Fleet-owned |
| Desktop and system utilities | Ghostty, WezTerm, Yazi, ShareX, Flameshot, PasteBar, Loop, Espanso, Squirrel, Lan Mouse | SYS-01 / SYS-02 | optional UX evidence only; out of product scope until a registered capability requires it |

## Deliberate exclusions from active scope

Proxy/VPN clients, unrelated scientific/ML projects, generic OS utilities, model-training
repositories, and product-specific extensions with no Fleet capability gap remain preserved as
`REJECT` or `UNTRIAGED` intake material. They must not inflate the 68-capability registry or be
used to justify architecture. Its matching R0–R18 module may reopen one only by adding a capability row and
an owner checkpoint.

## Audit order

1. SYS-01 audits the operating-system/harness queue first because every other suite depends on
   identity, permissions, actions, jobs, prompts and delivery evidence.
2. SYS-03 and SYS-04 audit context economy and browser evidence next; both can produce measurable
   adapters without changing creative authorities.
3. SYS-05 and SYS-06 audit design/media candidates in parallel, but only against the shared
   ArtifactRef, JobRef, RenderProfile and provenance contracts.
4. SYS-02 and SYS-07 audit remote and workflow candidates after their shared action/delivery seams
   are executable. Their previews may be built earlier, but cannot be called `usable`.

The active registry, not this intake map, controls scope. The admission ledger, not this intake
map, controls reference status.
