# OmniVerse Vision · 客户端与 Agent 适配（非当前桌面主线）

> 说明：本文是 OmniVerse/backend 客户端适配材料，不是当前 Fleet craft 桌面基座的执行入口。当前桌面执行入口见 `docs/README.md`。

> 状态：**CURRENT + TARGET**。所有客户端都是后端薄消费者；当前真实接口见 `docs/BACKEND.md`。客户端不得反向 import 后端内部模块，不得维护第二套平台/下载/错误/缓存逻辑。

## 0 · 共同调用模型

```text
Host detects user media intent
  -> /api/v1/agent/preflight for REST/SDK hosts
     or /api/v1/agent/intake + /api/v1/plan / MCP analyze_media(action="plan")
  -> submit task through REST/SSE or MCP adapter
  -> retrieve AssetRef/EvidencePack/search/frame/status
  -> caller LLM answers
```

REST/SSE 是完整控制面；MCP 是 Agent 工具适配层。Skill 只表达用户意图与资产需求，路线选择由 backend planner 做。

Token / latency policy:
- Prefer MCP for warm short tools: `get_capabilities(brief=true, topic=...)`, `analyze_media(action="plan")`, `inspect_image(brief=true)`, and `query_knowledge` with `fields/max_chars/max_items`. Warm MCP avoids repeated CLI process startup and can reuse OCR/VLM state.
- Prefer REST/SSE for long jobs, progress, cancellation, history, and browser evidence ingest. MCP should return TaskRef instead of blocking stdio.
- Use CLI bridge only when MCP is unavailable or unstable. Agent-facing CLI output must be `--brief-json` or bounded JSON; direct file reads must be locally filtered before reaching the model.
- Host adapters that control tool mounting should implement Tool RAG: retrieve the current task's relevant schema set and expose only 1-2 tools. Hosts that globally mount all MCP tools must compensate with `brief`, `fields`, `max_chars`, `max_items`, `max_runs`, and AssetRef pagination.

Host adapter is mandatory. Do not rely on a language model to decide that it lacks vision/audio/video capability. If a user message contains media intent, the host must run preflight or intake/plan before final LLM answering. The executable requirement is tracked in [REQUIREMENTS.md](REQUIREMENTS.md).

For UI design tasks, host adapters must also handle screenshot capture. A text-only model cannot verify layout, color, spacing, clipping, or overlap from source code alone. Browser pages should use Backend Browser Agent or host capture to post screenshots to `/api/v1/ingest/ui-capture`; terminal/desktop captures should be saved under `workspace/ui_captures/`; then the host calls MCP `capture_ui`. `ov capture webpage` is the no-plugin headless fallback for URL/local HTML multi-viewport captures. For Fellou-like dynamic pages, call `ov capture dynamic-page` first to get a bounded plan with memory/cost limits, including optional full-page scrolling screenshot sliced into 16:9 evidence pages, then execute it through Browser Agent/Playwright when available. If capture is unavailable, the host must expose the missing evidence instead of letting the model self-certify visual quality.

## 1 · Client Matrix

| Client / host | Preferred path | Required behavior |
|---|---|---|
| Claude Desktop | MCP first | Use `get_capabilities`, then `analyze_media(action="plan")`; long tasks must not block stdio |
| Claude Code | MCP first, REST fallback | If MCP is unavailable, host calls REST/SSE and injects assets into prompt |
| Codex | MCP or REST depending environment | Must run intake before answering media-content questions |
| OpenCode / OpenClaw / Hermes | MCP if supported, REST fallback | Declare `ModelCapability`; do not assume model can inspect media |
| pi / V2 / web panel | REST/SSE first | Use progress, cancellation, recent tasks, export endpoints |
| VS plugin | REST/SSE first, optional MCP | Manage background jobs and asset views in plugin state |
| Backend Browser Agent | REST first | No-UI browser sensor for authenticated page/video evidence, cookie metadata, subtitle tracks, chapters, comments/danmaku, screenshots, and download candidates; no reasoning |
| Plain script / SDK | REST first | Use `/agent/preflight`, `/analyze`, `/tasks`, `/search`, `/frame`, `/export` |

## 2 · Model Matrix

| Model ability | Host declaration | Planner result |
|---|---|---|
| Pure text, tool calling | `kind=text_only`, `tool_calling=true` | OmniVerse perception required; inject EvidencePack only |
| Pure text, no tool calling | `kind=text_only`, `tool_calling=false` | Host pre-runs OmniVerse and injects assets; model never chooses tools |
| Image input only | `image_input=true`, `video_input=false` | OmniVerse extracts/selects frames; optional selected image pass-through |
| Short video input | `video_input=true`, `max_video_seconds=N` | Direct media only if policy allows and duration <= N; otherwise asset path |
| Audio input | `audio_input=true` | Direct audio only if policy allows; transcript remains citation source |
| Multimodal but privacy constrained | `policy.offline=true` or cloud disabled | Planner forbids cloud perception and degrades/request upload/local models |

All model claims are host-declared, not inferred by LLM. A model saying “I can watch video” in natural language is not a capability contract.

## 3 · Current Implemented Client Contracts

Implemented:
- `POST /api/v1/agent/intake`
- `POST /api/v1/agent/preflight`
- `POST /api/v1/plan` with optional `capability_profile`
- `GET /api/v1/tools` with `agent_intake` and `capability_negotiation`
- MCP `get_capabilities` with `agent_intake` and `capability_negotiation`
- MCP `get_capabilities.ui_visual_review` and `capture_ui` for host-captured UI screenshot review
- CLI `ov capture dynamic-page` for bounded dynamic UI capture planning before Browser Agent/Playwright execution
- MCP `analyze_media(action="plan", options.capability_profile=...)`
- `POST /api/v1/analyze` async queue path
- `GET /api/v1/tasks/{task_id}/events` real-time SSE, replay still partial

Not complete:
- Real host-in-the-loop agent matrix tests. Deterministic backend matrix evals exist for MCP, REST fallback, no-tool, image, video-limit, and audio-capable declarations.
- EvidencePack-first chat/query default.

MCP-Skill companion material:
- `MCP-Skill/AGENT_ONBOARDING.md` is the first-read guide for new host agents: startup handshake, route selection, browser extension split, asset lifecycle, evidence injection, and failure rules.
- `MCP-Skill/omniverse-media-agent/SKILL.md` is the host-facing Skill for MCP-capable agents.
- `MCP-Skill/host-integration/` contains copy-pasteable host rules/config snippets for Claude Desktop, Claude Code, Codex, OpenCode, OpenClaw, Hermes, and plain REST hosts.

## 4 · V1 / V2 / Backend Browser Agent

V1 Textual:
- Current user-facing transitional shell.
- Maintenance frozen: bugfix, compatibility, and reference UI only.
- Must call backend through the facade / REST path, not backend internals.

V2 / pi:
- Target thin client.
- Should use REST/SSE first because UI needs progress, history, cancellation, and export.
- It must not ship a second backend.

Backend Browser Agent:
- Build with `cd clipper && npm run build` or `npm run build:backend-agent`; Chrome load path is `clipper/dist-backend-agent/`.
- It has no user action, visible assistant UI, or product-side interaction. It exists to serve the backend.
- It submits `/api/v1/browser-agent/evidence`; raw cookie values are disabled/redacted by default and must not become normal product flow.
- It should provide page Markdown, page screenshots, code blocks, media metadata, subtitle tracks, chapters/view points, visible comments/danmaku, and download candidates. Backend remains responsible for actual media download, ASR/OCR/VLM/RAG, cache, and manifest.

Developer install contract for the current backend product:
- Build with `cd clipper && npm run build`, load `clipper/dist-backend-agent/` in Chrome, confirm the extension card name is `OmniVerse Vision Backend Agent`, click the extension refresh button after every rebuild, then reload already-open pages so Chrome re-runs the static content script.
- If any OmniVerse visible interaction appears on the page, Chrome is not loading this repository's Backend Agent.

Setup contract for ordinary users:
- First-run human clients should ask where to store records/assets before creating large files. The backend default is `~/.omnisee_every`; real-link tests in this repository use `tmp/`. Backend Browser Agent itself does not own durable records; it only submits browser evidence for the backend workspace/asset manifest to store.
- The setup copy must present the backend as a local perception runtime: it provides local models, Ollama integration, OCR/VLM, ASR, RAG, video analysis, manifests, cache reuse, and recovery.
- If the backend is not installed or not reachable, clients must keep local records usable and show unavailable backend actions as disabled/error states, not silently discard chats or attachments.

## 5 · Compatibility Acceptance

No client compatibility claim until all are tested:
- Claude Desktop MCP text-only model flow.
- CLI Agent flow with MCP unavailable and REST fallback.
- REST/SSE UI flow with task progress and cancellation.
- UI screenshot review flow for terminal/browser hosts using `capture_ui`.
- Dynamic webpage plan/execution/inspection loop for complex animated pages; plan exists, real host execution is not yet release-grade.
- No-tool-calling model with host-side pre-run injection.
- Image-capable model receiving selected frames while citations remain in EvidencePack.
- Video-capable model over limit falling back to OmniVerse assets.

## 6 · Export

Current export is local Markdown/Obsidian-oriented, with Notion/Feishu still not release-grade parity. Export providers must consume existing assets and must not trigger duplicate perception work.


---
