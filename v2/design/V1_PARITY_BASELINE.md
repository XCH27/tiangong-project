# V1 → V2 功能对标基线（V2 不能少，且要超越）

> 从 V1 真实代码提取（`chat.py` / `home.py` / `message.py` / `widgets/*` / `slash_commands.py` / `chat_commands.py` / `attachments`）。
> 我之前的 Ink 原型只做了"四态骨架"，丢了 V1 的对话体验密度。这张表是 V2 的硬基线。
> 日期：2026-05-31

## 核心认知纠正

V1 不是"四个独立屏"，而是**一条对话流**：用户消息、AI 回复、分析计划、管线进度、错误、检索结果 —— **全部是消息流里的气泡**，配一个常驻输入区 + 按钮。我之前把四态做成切换页面，丢了这个本质。**V2 应以「对话流」为骨架，四态是流里的特殊气泡类型。**

## V1 已有功能清单（逐条，V2 必须平齐）

| # | V1 功能 | 代码出处 | V2 状态 |
|---|---|---|---|
| F1 | **对话消息流**（user/assistant/plan/step/error/info 六类气泡） | message.py `_HEADERS` | ❌ 我漏了 → 必补 |
| F2 | **AI 问答**（RAG 检索 + LLM 作答，答案带时间戳出处） | chat.py `_search`/`_search_with_ai` | ❌ 漏 → 必补 |
| F3 | **消息按钮 ✓ 复制 / ✗ 撤回**（撤回连同上一条 prompt 回填输入框并聚焦） | message.py `_on_copy_pressed`/`_on_recall_pressed` | ❌ 漏 → 必补 |
| F4 | **附件**（图片/PDF/文件，pill 占位符，VLM 异步描述图片） | chat.py `_attach_*` + AttachmentState | ❌ 漏 → 必补 |
| F5 | **斜杠命令面板**（/help /paste /setup /clear /skill /list /quit，输入 `/` 弹候选） | slash_commands + `_show_slash_panel` | ❌ 漏 → 必补 |
| F6 | **Skill 切换**（/skill `<name>`，17 个） | chat_commands `handle_skill_command` | 🟡 只做了 Tab 切，无面板 |
| F7 | **智能粘贴**（剪贴板图片/视频链接/文件，Ctrl+V/⌘+V） | chat.py `_handle_paste` | ❌ 漏 |
| F8 | **+ 上传按钮**（ctx-row 左侧，原生文件对话框） | chat.py `_add_btn_pressed` | 🟡 画了没接 |
| F9 | **分析计划卡**（plan 气泡） | video_plan.py | ✅ 有（但独立态，应进流） |
| F10 | **实时管线进度**（7 步，SSE） | chat.py `_pipeline` `cb` | ✅ 有（应进流） |
| F11 | **结果卡 + 文件路径 + 预览** | `_handle_pipeline_result` | ❌ 漏（态④未做） |
| F12 | **任务历史 /list** | `_list_tasks` | ❌ 漏 |
| F13 | **上下文 token 条**（context ━━╌ %） | progress_markup `ctx_bar_markup` | 🟡 提了没做进度 |
| F14 | **顶栏状态徽章**（模型/VLM/主题/MCP） | home/chat top | ✅ 有 |
| F15 | **Mimi mascot 状态表情** | widgets/mascot.py | ✅ 有 |
| F16 | **四季主题热切** | theme_runtime | ✅ 有（`2` 键） |
| F17 | **Setup/配置 Modal**（F1） | setup.py | ❌ 漏 |
| F18 | **键位**（F1 配置/Ctrl+Y 复制最新/Ctrl+End 跳尾/Esc 清空/Ctrl+M Mimi） | BINDINGS | 🟡 部分 |
| F19 | **URL/本地路径自动识别路由** | `_route_handle` | 🟡 只识别没路由 |
| F20 | **视觉问题 MCP-VLM fallback**（无视觉模型时直接调 VLM 看图） | `_check_mcp_vlm_fallback` | ❌ 漏 |

## V2 超越 V1 的方向（对标 COMPETITOR_PARITY）

| 超越点 | 说明 |
|---|---|
| 大脑↔工具显式化 | 顶栏模式 A/B 徽章；问答答案标注"谁作答"，VLM 证据标 `visual_reference` 降权 |
| 弱锚点 ±Δ + 置信度分色 | 时间戳按来源分色（官方/词级/ASR/VLM），不是 V1 的单色 |
| 证据可追溯 dock | 资产态右侧 EvidencePack（证据+出处+limits+unknowns） |
| 诚实可见计划卡 | 比 V1 plan 卡更全：硬件档/成本/磁盘/降级路线/熔断 |
| 按需懒看 VLM | 问到画面才看那一帧，省算力 |
| 配方路由 | route-select 选 profile（V1 没有） |
| 导出多端 | Obsidian（V1 有）+ Notion/飞书（超越） |
| 热切主题不重启 | V1 是 execv 重启，V2 差分渲染热切 |

## V2 信息架构（修正：对话流为骨架）

```
┌ 顶栏：◈ OmniVerse Vision · │ [模式B] [Layer A] [⛰tier] [❄主题] ┐
├ 对话流（可滚动，主体）：                                        │
│   ▸ 你        贴的链接 / 问题            [✓][✗]                │
│   ◌ 分析计划  平台/字幕/成本/降级…       [确认][改配方][取消]   │
│   · 管线      7 步实时进度                                      │
│   ◈ 助手      图文笔记 + 时间戳出处       [✓][✗][导出]         │
│   📎 附件 pill (IMG1×)(PDF1×)                                  │
├ 斜杠面板（输入 / 时浮出）：/help /skill /list …                │
├ 输入区：[+] > 输入/粘贴/问…      [Skill▾ video-note]  context ▮ │
│         F1配置 F2主题 F3历史 ⌘V粘贴 ⌘Y复制 · 🐾Mimi            │
└────────────────────────────────────────────────────────────────┘
```

四态融入流：用户发链接 → 流里出现「计划卡」气泡 → 确认后出现「管线进度」气泡 → 完成出现「结果/资产」气泡。问答 = 普通对话气泡。全程同一条流、同一个输入区，像 V1 也像聊天软件。
