# OmniVerse Vision · V2 终端界面（pi-tui）重设计方案

> 状态：**PROPOSAL / 方案**（仅设计，先对齐方向，确认后再做可运行原型）
> 角色：V2 Product/UI Architect
> 隔离：独立 worktree `agent/v2-ui-prototype`；不碰 `backend/`、`mcp/`、`v1/`、`.agent_handoffs/QUEUE.md`、Codex 的 G2 任务卡
> 日期：2026-05-31
> 依据：`docs/VISION.md`、`ARCHITECTURE.md`、`ORCHESTRATION.md`、`CLIENT_DESIGN.md`、`V2.md`、`MEDIA_PROFILES.md`、`SKILLS.md`、`COMPETITOR_PARITY.md`、`ROADMAP.md`、`V1.md` + V1 实际 TUI 代码

---

## 0 · 我之前做错了什么（先纠偏）

1. 我先做了网页 GUI，但你已验收的 V1 终端更美 —— 方向错。**应当先把终端做到极致**，网页只是 `V2.md §7` 的同源副产物。
2. 我把产品理解成"字幕→笔记"，太浅。读完全部 `docs/` 后，真正的产品是：

> **一个本地优先的「视频/图像 → 结构化语义资产」引擎，第一身份是 MCP/REST 工具，让只懂文字的大模型"看见"视频。**

终端 V2 不是"又一个总结器的界面"，而是这台引擎的**人类驾驶舱**：它要把「大脑↔工具」「感知/推理分离」「弱锚点±Δ」「按需懒看 VLM」「配方路由」「证据可追溯」这些内核理念，变成普通人看一眼就懂、点几下就能用的终端体验。

---

## 1 · 设计目标（V2 终端要同时成立的五件事）

1. **比 V1 更美、更稳**：复刻 V1 已验收的视觉语言（见 §3），但用 `pi-tui` 的差分渲染解决 V1 Textual 的实测坑（浅色黑块、光标残留、气泡折叠、execv 重启切主题）。
2. **诚实可见**：跑之前必给 AnalysisPlan 卡（平台/字幕/硬件档/预计时间·成本·磁盘/降级路线），跑之中给实时管线，隐私/离线/出网状态常驻。这是 `CLIENT_DESIGN §1.2` 的灵魂。
3. **资产优先，不是聊天优先**：主线是「丢输入 → 看计划 → 跑 → 拿图文资产 → 问/导出」，问答活在资产之上（`CLIENT_DESIGN §1.1`）。
4. **承载完整产品**：时间戳精准问答、AIGC 反推、图文对齐、配方选择、证据追溯、多端导出 —— 不只是笔记。
5. **薄消费者**：只走 REST/SSE，UI 崩不拖垮后端任务（`ARCHITECTURE §2`、ADR-0015）。

---

## 2 · 终端硬约束（设计必须服从 · CLIENT_DESIGN §1.5）

| 约束 | 设计后果 |
|---|---|
| 画布 **120×30**（列×行），30 行极紧 | 不做长滚动并列；**四态同屏分态演进**，底部输入栏常驻，主体随阶段切换 |
| 终端放不了真图 | 关键帧 = **可打开的引用** `▣ 02:14 [打开]`；仅 sixel/kitty/iterm 探测到才渲半块缩略图，否则降级为引用 |
| 中文 2 格宽 | 所有布局用 `string-width`，禁 `len()`（V1.md 已记此坑） |
| 键盘优先，鼠标可选 | F 键主功能；truecolor |
| 资产态信息多 | 「笔记 ｜ 问答/证据」用 **70/46 分栏** 或 F 键开关右侧 dock，不强行三栏并列 |

---

## 3 · 复刻 V1 的视觉语言（已验收资产，逐条保留）

这些是用户在 V1 真实验收过的视觉/交互决策，V2 用 pi-tui 重新实现（不照搬 Textual workaround）：

| V1 资产 | V2 处理 |
|---|---|
| 品牌：固定英文大标题 `OmniVerse Vision` + 随语言副标题「视界无限，洞析万象」 | 保留，Home 居中大 Logo（`BeamLogo` 点击脉冲动画用 pi-tui 差分渲染复刻） |
| 四季 × 日夜主题（水墨宣纸），每主题一个 accent + 一个 laser，绝不混色 | 抽成 `themes.json` token 单一真相源，V1/V2/web 同 import；pi-tui 差分渲染**热切主题不重启**（解决 V1 execv） |
| Mimi mascot 随状态变表情（work/done/error） | 保留，置于输入行右侧；状态与管线进度联动（解决 V1 SF-1「容易被忽略」） |
| 输入框左侧 heavy accent 竖条 | 保留 |
| 块状光标（非透明下划线，IME 稳定） | 保留（pi-tui 原生块状光标，规避 V1 残留 `_` 坑） |
| ✓/✗ 成对操作（✓复制 / ✗撤回，撤回连同上一条 prompt 回填输入框） | 保留 |
| `+` 上传按钮在 ctx-row 左侧 | 保留 |
| 语义色专用（进度/计划/成本/降级各有固定色，不复用 accent） | 保留并强化（见 §6） |

---

## 4 · 信息架构：四态主线 + 三个常驻面

V2 不是「Home/Chat/Setup 三个独立屏」（那是 V1 的旧结构），而是**一条主线四个态 + 随时可召出的三个浮层**。

```
┌─ 顶栏（常驻 1 行）─────────────────────────────────────────────┐
│ ◈ OmniVerse Vision ·        [模式A/B] [Layer A·VLM] [⛰ accelerated] [❄玄墨] │
├─ 主体（随态切换，~26 行）──────────────────────────────────────┤
│                                                               │
│   态①输入  /  态②计划  /  态③运行  /  态④资产                  │
│                                                               │
├─ 输入栏（常驻 2-3 行）────────────────────────────────────────┤
│ [+] > 贴链接/文件/截图，或直接问…           skill:video-note 🐾 │
│ context ━━━╌╌ 23%   F1 配置 · F2 主题 · F4 证据 · F10 退出      │
└───────────────────────────────────────────────────────────────┘

常驻浮层（F 键召出，不切走主线）：
  F1  Setup/Doctor 浮层    F2  主题切换    F3  最近任务/资产库    F4  资产态右侧证据 dock
```

四态之间是**演进**关系，不是页面跳转：输入 →（probe+plan）→ 计划 →（确认）→ 运行 →（done）→ 资产；任何态按 `Esc` 或「＋新分析」回到输入态。

---

## 5 · 四态详细界面（120×30 草图）

### 态① 输入（Home）

```
◈ OmniVerse Vision ·                      [模式B] [Layer A] [⛰accelerated] [❄玄墨·夜]

                         ██████  OmniVerse Vision
                              视界无限，洞析万象

         ┃ > https://www.bilibili.com/video/BV1xx 这视频讲了啥▌
         ▸ 识别到 B站视频 · 将走「官方字幕优先 → 跳过 ASR」

         video-note  summary  chapters  reverse-prompt  shot-breakdown  …(F→全部)

  对话模型 deepseek-chat   ·   眼睛 MiniCPM-V(Layer A)   ·   隐私 云端可用   ·   硬件 accelerated
─────────────────────────────────────────────────────────────────────────────
 [+]  贴链接 / 拖文件 / 截图，或直接问视频里的事…                  skill:video-note  🐾•ω•
 context ╌╌╌╌╌ 0%        F1 配置 · F2 主题 · F3 历史 · F10 退出
```

要点：
- **一个输入框吃一切**（链接/文件/截图/问题）—— 零学习成本（`CLIENT_DESIGN §1.4`）。
- 贴链接即时识别平台并预判路线（复用后端 `probe` 的 platform 线索；输入态先用本地启发式，回车后才真 probe）。
- Skill 是**可见的横排 chip**（不是 V1 那种隐藏的 `/skill`），F 键展开全部 17 个（带 depth 角标）。这解决了 V1 的 IA-2。
- 截图/音频/视频走**不同模态路由**：贴截图只走 VLM 描述（跳过下载/ASR/抽帧），UI 在预判行直接说明（落地 `ARCHITECTURE §3`）。

### 态② 计划（AnalysisPlan 卡 · 跑之前的「诚实可见」）

```
◈ OmniVerse Vision ·                      [模式B] [Layer A] [⛰accelerated] [❄玄墨·夜]

 ◌ 分析计划 · 确认后再运行                                        来源 POST /api/v1/plan
 ┃ 【机器学习】30 分钟搞懂 Transformer 注意力机制
 ┃ B站 · 30:34 · 有官方字幕(zh-Hans,en)
 ┃
 ┃ 深度 text_only    预计耗时 快    成本 [免费]    磁盘 [低]    风险 [低风险]
 ┃ 路线  probe › 字幕(跳过ASR) › 分段 › 生成笔记 › marker › 导出
 ┃ 降级  无需降级 · 命中官方字幕，0 下载、0 ASR
 ┃
 ┃ ⚠ 诚实可见：检测到官方字幕 → 跳过 ASR 转写，速度更快、成本为零。
─────────────────────────────────────────────────────────────────────────────
 [确认运行 ↵]   [改配方 F5]   [取消 Esc]                          🐾•ω•
 context ╌╌╌╌╌ 0%
```

要点：
- 字段直接映射后端 `AnalysisPlan`（chosen_depth/planned_steps/skipped_steps/degraded_steps/expected_fallback_path/estimated_*_bucket/user_visible_warnings）。
- 成本/磁盘/风险用**专用语义色徽章**，不复用 accent。
- 「改配方」对应 `route-select`/Profile（`SKILLS §5`、`MEDIA_PROFILES`）：先显式 `profile=`，后 LLM 建议（按 `MEDIA_PROFILES §8` 的实施顺序，不一上来就自动路由）。
- 这一态是产品与 BiliNote/BibiGPT 的关键差异点：**别人直接跑，我们先让你放心**。

### 态③ 运行（实时管线 · SSE）

```
◈ OmniVerse Vision ·                      [模式B] [Layer A] [⛰accelerated] [❄玄墨·夜]

 正在分析  ███████▒╌╌╌╌ 62%                                  SSE /tasks/{id}/events
 ┃ ✓ probe              已完成 0.4s
 ┃ ✓ acquire_subtitle   官方字幕命中，跳过 ASR
 ┃ ⏭ transcribe         已跳过（使用官方字幕）
 ┃ ▸ segment            进行中…  叙事分段
 ┃ · extract_frames     等待（本任务 text_only，不抽帧）
 ┃ · vlm_describe       等待
 ┃ · generate           等待
 ┃ · export             等待
─────────────────────────────────────────────────────────────────────────────
 取消 Esc（级联 kill 子进程）                                     🐾·ω·  分析中
 context ━━╌╌╌╌ 18%
```

要点：
- 7 步对应后端 SSE 事件流（queued/probing/subtitle_check/segmenting/extracting_frames/vlm_describing/generating/exporting/done）。
- 当前步 `▸ accent bold` 高亮，完成 `✓ success`，跳过 `⏭ dim`，降级 `▽ degrade色` + 原因（如「本地 VRAM 不足 → 降级云端 VLM」）。降级必须可见（`ARCHITECTURE §7`）。
- Mimi 表情随状态：work `·ω·` / done `•‿•` / error `×﹏×`。
- 取消 = 级联 kill（`ARCHITECTURE §7` 孤儿进程纪律），UI 只发 `DELETE /tasks/{id}`。
- 支持 `Last-Event-ID` 重连提示（断点续跑是产品承诺）。

### 态④ 资产（70/46 分栏：图文笔记 ｜ 证据/问答）

```
◈ OmniVerse Vision ·                      [模式B] [Layer A] [⛰accelerated] [❄玄墨·夜]

 ◈ 图文笔记                                  │ ◌ 证据 / 片段           F4 收起▕
 # 30 分钟搞懂 Transformer                    │ ▣ 06:21 关键帧 (VLM 72%)
 > B站·示例UP·30:34·官方字幕(已跳过ASR)        │   白板上写着 softmax(QKᵀ/√d)V
                                             │   [打开帧] visual_reference
 ## 一、为什么需要注意力 [~00:42±1s]          │ ────────────────────────
 传统 RNN 串行处理，长依赖会衰减…              │ [00:42] 传统RNN串行处理…
                                             │ [04:18] QKV 的直觉…
 ## 二、QKV 是什么 [~04:18±1s]                │ [11:05] 多头注意力…
 - Query：当前 token 想问什么                 │ ────────────────────────
 - Key / Value …                            │ 问视频(答案带出处):
 讲者白板写出公式 ▣ 06:21 [打开]              │ > QKV 分别是什么？▌
                                             │ ◈ Query=想问什么…[04:18][11:05]
─────────────────────────────────────────────────────────────────────────────
 [导出 Obsidian ⌃E]  [Markdown]  [Notion*]   ＋新分析 Esc            🐾•‿•
 context ━━━━━╌ 47%
```

要点：
- **左栏 = 图文对齐 markdown**：时间戳是**弱锚点** `[~MM:SS±Δt]`，按来源分置信度分色；`[打开]` 可跳原片/召出帧缩略图（终端支持时）。这正是 `VISION §3 目标4`「图片插入位置与时间戳对齐」。
- **右栏 = 证据 + 问答（EvidencePack 落地）**：问答答案**必带出处时间戳**，VLM 证据标 `visual_reference(hypothesis)` 并降权；证据不足明确说「画面/资料不足」不编造（`ORCHESTRATION §3.2`，防 V1「一本正经胡说」）。
- 问答走「大脑↔工具」：模式 B 内核 DeepSeek 作答；问到画面且无缓存描述时**按需懒看**（On-demand VLM，`ORCHESTRATION §3.3`）。
- 导出覆盖 BiliNote 生态（Obsidian 现有 / Notion·飞书 目标，`COMPETITOR_PARITY §5`）；封面 Banner、原片跳转、多版本历史。

---

## 6 · 语义色系统（诚实可见的视觉锚 · 强化版）

每个主题：**一个 accent + 一个 laser**，绝不混用。状态语义色**独立保留**，不复用 accent，让进度/计划/成本/降级永远读得出强弱：

| 语义 | 用途 | 取色策略 |
|---|---|---|
| `plan` | AnalysisPlan 卡、证据 dock 边 | 蓝紫 |
| `progress` | 运行进度条、当前步 | 青绿 |
| `cost` | 成本/磁盘徽章、熔断警告 | 琥珀 |
| `degrade` | 降级步骤与原因 | 橙棕 |
| `fallback` | 失败/需 Clipper-上传 | 朱红 |
| `success/warning/error` | ✓/⚠/✗ 通用 | 主题内固定 |

可读性门槛（`CLIENT_DESIGN §4`）：正文/面板对比度 ≥7，meta/底 ≥4.5，accent/底 ≥3；浅色禁纯白底，深色禁纯黑底。

---

## 7 · 失败 / fallback（每个状态都有明确下一步 · ARCHITECTURE §7）

终端必须把后端结构化错误码（`core/errors.py` 目标契约）渲染成「原因 / 提示 / 下一步动作」三段，绝不一行红字了事：

```
 ✗ 未能完成 · 有明确下一步                                  DOWNLOAD_BLOCKED · acquire
 ┃ 平台风控，cookie 失效，无法直接下载。
 ┃ 建议：用浏览器 Clipper 注入字幕，或手动上传本地视频/字幕文件。
─────────────────────────────────────────────────────────────────────────────
 [浏览器 Clipper 注字幕]  [上传本地文件]  [重试 ↵]  [返回 Esc]      🐾×﹏×
```

覆盖：`DOWNLOAD_BLOCKED` / `SUBTITLE_NOT_FOUND` / `RATE_LIMITED` / `OOM_VRAM`(降级) / `COST_EXCEEDED`(熔断等确认) / `STEP_STUCK`。这呼应弱机/高风控平台是常态的判断（ROADMAP G1.5/G2）。

---

## 8 · 三个常驻浮层

- **F1 Setup/Doctor**：`oe doctor` 数据（ffmpeg/硬件档 tiny|standard|accelerated|offline_power/对话模型可达性/VLM provider+Layer/离线开关）。补 Setup Step 4-6（代理/VLM/ASR，`CLIENT_DESIGN §3`）。
- **F2 主题**：四季×日夜热切，pi-tui 差分渲染不重启。
- **F3 历史/资产库**：复用 `GET /api/v1/tasks/recent`，可回看任一 run 的资产态（跨视频检索是 G3 能力，先列任务）。

---

## 9 · 与「大脑↔工具」「模式 A/B」的界面落地

顶栏常驻 `[模式A]` / `[模式B]` 徽章，让用户随时知道**谁在作答**：

- **模式 B（默认人类用 TUI）**：内核配置的对话 LLM（DeepSeek）作答；问答态走内核 Question Router + Evidence Assembler。
- **模式 A（TUI 接到外部 Agent / MCP 宿主）**：外部模型作答，内核只给证据；TUI 退化为「监看 + 取证据」视图。这为你的**自动化愿景**留口子：手机经微信/OpenClaw/Hermes 发链接 → 桌面 MCP 宿主自动 probe→plan→analyze→出笔记/反推 prompt（ADR-0015 已命名这条路）。

VLM 永远不直接作答，输出标 `visual_reference`——界面在证据 dock 明确标注「画面推测·非事实」。

---

## 10 · 不做 / 边界（守住纪律）

1. ❌ 不嵌后端、不发明后端能力、不改任何接口；只按 `BACKEND.md` 消费 REST/SSE。
2. ❌ 不碰 `backend/`、`mcp/`、`v1/`、`.agent_handoffs/QUEUE.md`、Codex G2 任务卡。
3. ❌ 不在 G1/G2 前把没有后端数据的态做成「假产品」——没有真数据的态用 mock 但**明确标 mock**，并预留真实接入点。
4. ❌ 不做复杂 GUI 时间轴剪辑、多租户、移动端原生（`VISION §6`）。
5. ❌ 不逐像素硬复刻 V1 当阻塞条件（`V2.md §10`）——功能+视觉参考即可。
6. ✅ 时间戳一律弱锚点 ±Δ + 置信度分色；VLM 一律 hypothesis；证据不足说不知道。

---

## 11 · 与 Gate 的数据接入对应（随后端成熟逐态接真）

| 态/面 | mock 现在 | 接真来源 | Gate |
|---|---|---|---|
| 输入平台预判 | 本地启发式 | `GET /probe` 的 platform 线索 | G1 |
| 计划态 | mockPlan | `POST /plan` → AnalysisPlan | G1.5 |
| 运行态 | 脚本 SSE | `POST /analyze` + SSE | G1（字幕闭环已 PARTIAL） |
| 资产态笔记/帧 | mockRun | run 资产 + marker_resolve | G1/G3 |
| 证据/问答 | mockChat | EvidencePack + `/chat` | G3 |
| 失败 fallback | 脚本 error | SSE error + errors.py | G2 |
| 历史 | mockRecent | `/tasks/recent` | 已 IMPLEMENTED |

界面**先于后端做好结构**，后端每过一个 Gate 就把对应态从 mock 切真，UI 零改动（靠 §12 的 transport 接口）。

---

## 12 · 技术落地建议（确认方向后再写代码）

- 栈：`pi-tui`（差分渲染）+ `pi-agent-core`（agent 循环/工具编排）+ `pi-ai`（统一多家 LLM），按 `V2.md §3` 锁定。
- **Transport seam**：UI 只跟一个 `Transport` 接口对话，`MockTransport`（脚本 SSE+假数据）↔ `RestTransport`（真实 REST/SSE）一行切换。我在 web-prototype 已验证这个模式，可直接迁移接口定义。
- **themes.json**：抽成 token 单一真相源，V1/V2/web 同 import。web-prototype 里那份 `themes.json` 可作起点。
- 文件落 `v2/`（pi-tui 主线，不与 web-prototype 冲突）。

---

## 13 · 需要你拍板的三件事

1. **方向对不对**：V2 终端按「四态主线 + 三浮层 + 复刻 V1 视觉 + 承载完整产品（大脑↔工具/弱锚点/懒看/配方/证据）」来做，是否符合你心里的样子？
2. **先做哪一态的可运行原型**：建议先做 **态①输入 + 态②计划 + 态③运行** 的真实可跑闭环（最能验证"诚实可见"和美观度），态④资产随后。
3. **栈确认**：是否就用 `pi-tui`（你 `V2.md` 已锁定）？还是你想先看一版用更轻的 TS TUI 库（如 Ink）做的快速原型验证视觉？

确认后我在独立 worktree 里做出能在终端跑起来的版本给你看，先 mock 数据、预留 REST/SSE 接入点，不阻塞 Codex 的 G2。
