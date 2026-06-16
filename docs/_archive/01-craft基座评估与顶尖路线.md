# 01 · craft-agents-oss 基座评估 & 通往「世界顶尖」的路线

> 背景：技术路线已改为**在 craft-agents-oss 上修改**。本文给出诚实评估 + 差距清单。
> 依据：对 `源码参考/craft-agents-oss`（v0.10.3，1408 个 TS/TSX 文件，craft.do/lukilabs 出品）的源码实测。

---

## 1 · 结论先行

**这个转向是对的，而且是聪明的。** craft 不是玩具——它是 craft.do 这家成熟产品公司在用的生产级工具，**Apache-2.0 许可（可自由商用、改名、再分发）**，并且**已经实现了你愿景里一大半的东西**。从零搭那套 M0，本质是在重造 craft 已经做好的轮子。

但要清醒：你买到的是"加速"，不是"免费"。你接手的是一套 1400 文件、双 Agent SDK（Claude Agent SDK + Pi）、有强烈设计主张的别家代码。**你的护城河从此只能来自你往里加的东西**，而不是基座本身。

---

## 2 · craft 已经白送给你什么（别再重造）

实测确认，下面这些 craft **已经有**，直接用：

| 能力 | craft 现状（实测） |
|---|---|
| 多会话收件箱（文档卡片流）| ✅ 你点名要的 Multi-Session Inbox，正是 craft 的核心 UX |
| 多模型 + 国产 | ✅ openai-compat(119 处)、**deepseek/qwen/ollama** 都支持，多 provider、按工作区设默认 |
| MCP + Sources | ✅ 本地 stdio MCP、远程 MCP、REST API、"跟 agent 说一句就接入 Linear/Slack" |
| 权限模式 | ✅ 三级（Explore / Ask to Edit / Auto）+ 自定义规则 |
| 上下文压缩 | ✅ 重度实现（309 处 compact/condense + conversation-summary）——**你的 context 文档因此降级为"未来参考"是对的** |
| 子智能体 | ✅ 75 处 subagent/delegate（走 Claude Agent SDK + Pi） |
| 检查点/版本 | ✅ 98 处 worktree/checkpoint/undo |
| 技能 Skills | ✅ 可描述生成、可从 Claude Code 导入 |
| 浏览器工具 | ✅ browser-tools + runtime + 权限（agent 可驱动浏览器，非空白） |
| IM 网关 | ✅ **Lark飞书 + Telegram + Slack + WhatsApp**，干净的 adapter 范式 |
| 多端 | ✅ 桌面(Electron) + CLI + Web viewer + webui |
| **完整多语言（含简体中文）** | ✅ `locales/zh-Hans.json`（85KB 完整翻译）+ 日/德/西/匈/波 6 语 + `languages.ts` 注册 + **locale-parity 测试**强制同步 |
| 后台任务 / 会话分享 / 部分语音 / otel 雏形 | ✅ 都有 |

> 一句话：craft ≈ 一个更完整、更专业、许可更友好的「我们之前在规格化的产品」。

---

## 3 · 诚实的代价与风险（别只看好的一面）

1. **上手成本真实存在。** 双 SDK 集成、压缩、权限、gateway 都是别人的抽象；改 agent 核心前你得真读懂，否则会引入难查的 bug。
2. **上游分叉痛苦。** craft.do 还在更新（0.10.3、有 next.md）。你一旦重改核心，将来 merge 上游会很疼。**对策：软分叉**——增量放独立 package，尽量不动 craft 核心。
3. **基因冲突。** craft 是**文档中心 + power-user + 英文**；你要的是**群聊编排 + 新手 + 中文**。有些地方会逆着它的纹理走。
4. **差异化全靠你加的部分。** 基座是别人的，你不在 §5/§6 上做出东西，就只是个换皮的 craft。
5. **沉没成本要认。** 我之前搭的 `app/` from-scratch M0 降级为**参考**（架构思想、model-resolve 的"openai-completions Model 字面量"洞见、安全边界仍有价值），不再是实现主线。这部分分析成本相对建整套很低，认了就好。

---

## 4 · 填平「你的愿景」差距（craft 缺的中国/新手部分）

这些 craft 没有，但**扩展点干净**，是你近期就该做的：

| 差距 | 怎么填（利用 craft 扩展点） | 难度 |
|---|---|---|
| **汉化** | ✅ **已自带完整简体中文**（`locales/zh-Hans.json` 85KB + locale-parity 测试）→ 只需：设中文为默认、按新手口吻微调术语；新增功能的新串照 parity 测试补译即可 | 很低 |
| **企业微信 / 钉钉 / 微信** | `messaging-gateway/src/adapters/` 已有 **lark / telegram** 干净范式 → 照着写新 adapter（企业微信有官方 API；个人微信高风险，见旧文档） | 中 |
| **国产默认 + Ollama 一键 + 新手向导** | 模型层已支持 → 做"默认 DeepSeek/检测 Ollama 一键 + 中文 onboarding" | 低 |
| **群聊式"队长→小队"UX** | craft 有 subagent 原语但 UX 是文档收件箱 → 在其上加 @提及群聊 + 队长派活界面 | 中高 |
| **内置可见浏览器（cmux 式）** | craft 有 browser-tools（自动化）→ 加可见标签页面板 | 中 |
| **托管外部 CLI（Claude Code/Codex/Gemini CLI）** | craft 走 **SDK 集成**而非 PTY 托管 CLI。**建议接受 craft 的做法**——SDK 比 PTY 包 CLI 更稳；除非你确有"原样跑用户本机 CLI"的硬需求，否则这条可以放弃 | —— |

---

## 5 · 通往「世界顶尖」还缺什么（按优先级）

顶尖 Agent 工具拼的不是功能多，是**可靠、可信、可观测、会编排**。下面 P0 是 craft 也缺、且决定上限的。

### P0 · 不做就进不了第一梯队（craft 也缺）
- **评测与回归体系（最大护城河）。** craft 只有 2 个 evaluator（标签/视图用），**没有 agent 级评测**。要建：任务成功率指标、回归任务集、每次改动跑评测、CI 门禁。顶尖工具靠"可度量的成功率"碾压对手——这是你能弯道超车的点。
- **深度可观测。** craft 有 otel 雏形（25 处），要做深：**步级 trace + 回放 + 成本/延迟仪表盘 + 失败聚类**。出问题能复盘，才敢让普通人放手用。

### P1 · 顶尖体验的核心
- **多智能体编排深度 + 你的群聊 UX。** 不只"能 spawn 子 agent"，而是 **planner / executor / verifier 角色 + 并行 + 验证 agent 复查产出**。把它做成你的"队长→小队"差异化界面。
- **上下文工程做到顶。** craft 压缩已强；再叠 **向量记忆/检索 + 子智能体上下文隔离 + 工具输出 offload**（context-mode 思路，现为未来项）。
- **计算机使用 / 浏览器自动化做强。** 从 browser-tools 升级到可靠 **computer-use（截屏/点击/视觉）+ 可见浏览器**，前沿工具都在抢这块。

### P2 · 拉开差距
- **沙箱深度**：容器 / microVM 跑不可信代码 + 细粒度出网/密钥控制（craft 有 runtime 隔离 + 权限模式打底）。
- **语音 + 多模态**：视觉输入、语音进出（craft 有部分语音）。
- **自我改进闭环**：从反馈学习、技能自动生成（craft 已有 skill 自动创建雏形，往深做）。
- **生态/市场**：skills / sources / MCP 的市场（craft 有 Sources + Skills + MCP 基础）。

### 横切（决定天花板）
- **可靠性**（长任务 checkpoint/resume——craft 有）+ 性能 + 打磨。
- **你的护城河 = 新手友好 + 群聊编排 UX + 扎根中国生态。** craft 虽自带中文翻译，但它定位是**英文、文档中心、power-user**——它不会去做"中文新手开箱体验 + 企业微信/钉钉 + 群聊式队长编排"。把这条做到极致——做**华语世界最好用、最像群聊、最让新手敢用的 Agent 工作台**——本身就是世界级定位，而非再造一个全能 craft。

---

## 6 · 建议打法

1. **软分叉 + 跟踪上游。** 你的增量放**独立 packages**（如 `channels-cn`、`orchestrator-captain`、`onboarding-zh`、`evals`、`observability`），尽量不改 craft 核心，便于 merge 上游更新。
2. **绝不重写 craft 已做好的**：agent loop、压缩、MCP/Sources、权限、收件箱、checkpoint、gateway 框架。
3. **先做护城河 demo，再补底座。** 先把"中文 + 新手 onboarding + 群聊队长编排"跑通一个惊艳 demo（最快见效、最差异化）；同时**尽早搭 P0 的评测 + 可观测**，否则规模一大就失控。
4. **守住 Apache-2.0 义务**：保留 NOTICE/署名即可，商用无碍。

---

## 7 · 对既有文档的处置

- `00-执行总纲`、`M0-实施规范`、`技术选型与架构`、`app/` 脚手架 → **降级为"from-scratch 参考"**（架构思想、安全边界、model-resolve 洞见仍可借鉴），不再是实现主线。
- `上下文管理方案` → 已由你标为"未来参考"；craft 的压缩已覆盖大部分，记忆/检索/offload 留作 P1 增强。
- **本文（01）成为新的路线锚点**：基座=craft，差异化看 §4/§5，打法看 §6。
