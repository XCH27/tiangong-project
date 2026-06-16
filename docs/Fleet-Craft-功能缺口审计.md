# Fleet × Craft 功能缺口审计

> 目的：判断直接使用 craft-agents-oss 作为基座后，还缺哪些你想要的 Fleet 能力。结论：craft 是很好的底座，但不是最终产品形态；它缺的主要是 Agent 编排、低摩擦桌面工作台、Git/终端一等面板、全局 Skill 管理和中文新手体验。

> **2026-06-16 修订**：按用户最新确认与 `docs/04-产品决策记录.md` 的 **D3**，当前首攻恢复为 **终端 / CLI Runtime Host**，先做 **P0-B CLI Runtime Host 探测**。内置浏览器 + 网页标注顺延到下一阶段（方案仍见 `docs/06-浏览器与网页标注方案.md`）。其余缺口分析仍有效。

## 1 · 当前 craft 已有能力

| 能力 | craft 已有程度 | 主要路径 |
|---|---|---|
| Electron 桌面壳 | 已有 | `app/apps/electron/src/main/*`、`window-manager.ts` |
| React 多面板工作台 | 已有 | `app/apps/electron/src/renderer/components/app-shell/*`、`atoms/panel-stack.ts` |
| 会话列表 / inbox / session 持久化 | 已有 | `app/packages/server-core/src/sessions/*`、`renderer/atoms/sessions.ts` |
| 聊天输入 / 消息渲染 / 附件 | 已有 | `ChatPage.tsx`、`ChatDisplay.tsx`、`input/*` |
| 权限模式 / 审批 | 已有 | `resources/docs/permissions.md`、`session-tools-core/src/runtime/*` |
| Sources：MCP/API/local | 已有 | `resources/docs/sources.md`、`handlers/rpc/sources.ts` |
| Session MCP server | 已有 | `packages/session-mcp-server/src/index.ts` |
| Browser pane / browser_tool | 已有 | `browser-pane-manager.ts`、`browser-cdp.ts`、`resources/docs/browser-tools.md` |
| Skill 基础 | 已有 | `resources/docs/skills.md`、`SkillsListPanel.tsx`、`skill-validate.ts` |
| 自动化 / 定时任务 | 已有 | `resources/docs/automations.md`、`handlers/rpc/automations.ts` |
| 状态 / 标签 / 主题 | 已有 | `resources/docs/statuses.md`、`themes.md`、`labels.md` |
| 多模型连接 | 已有一定基础 | `packages/shared/src/config/*`、`server-core/src/model-fetchers/*` |
| 文件预览 / Markdown / PDF / Mermaid | 已有 | `resources/docs/*preview.md`、renderer overlays |
| Diff / 文件变更展示 | 部分已有 | app shell 文件变更、session branch 相关测试 |
| 消息网关 / 远程入口 | 部分已有 | `packages/messaging-gateway`、`messaging-whatsapp-worker` |

## 2 · 和你目标相比的关键缺口

### P0 · 必须先做

| 缺口 | craft 现状 | Fleet 需要 |
|---|---|---|
| 产品去 Craft 化 | 名称、路径、协议、文案仍是 Craft Agent / `~/.craft-agent` / `craftagents://` | Fleet 品牌、中文默认、自己的数据目录、协议、图标和首启文案 |
| 第一屏不够像 Codex/Claude/OpenCode | craft 是 workspace/session/source 产品，配置和 sources 概念偏重 | 第一屏直接任务输入，左会话/项目，中心聊天，右侧进度/文件/浏览器/上下文 |
| Agent 编排 / 群聊 | 有 subagent，但没有 AionUi 式团队群聊、Agent 名册、并发 Agent 任务流 | 从 AionUi 迁团队/Agent/@mention 交互，让多个 Agent 像群聊一样工作 |
| 外部 CLI/ACP 托管 | craft 重点是 Claude/Pi/Copilot 连接，不是 Codex/Claude Code/Qwen/Grok 等 CLI 统一托管 | AionUi ACP + CLI adapter：检测、启动、会话、权限、输出回放 |
| Skill 全局管理 | craft 是 workspace skill + slash command | 全局 SSOT、安装/卸载/更新、来源标注、启用范围、备份恢复、运行时注入 |

### P1 · 工作台核心补齐

| 缺口 | craft 现状 | Fleet 需要 |
|---|---|---|
| Git 一等面板 | 有 diff/branch cleanup/git-bash，但不是完整 Git 工作台 | 状态、分支、worktree、diff、commit、PR、脏工作区保护、Agent 修改回放 |
| 浏览器预览/网页点评入口 | 有 browser pane 和 browser_tool，但不是第一屏右侧常驻点评能力 | 右侧浏览器预览、URL 点评、截图/DOM 证据、Agent 操作回放 |
| Agentic terminal | 有 shell 工具和后台任务，但不是 Warp 式终端 | PTY 面板、命令块、历史、搜索、命令修正、用户接管 |
| MCP 管理面 | source 系统很强，但对新手偏配置化 | MCP server 状态、工具列表、默认发现、错误诊断、权限可视化 |
| 软件操作统一层 | 浏览器/source/local 工具分散 | 统一“观察状态、执行动作、审批、日志回放、失败恢复、接管”模型 |

### P2 · 产品化增强

| 缺口 | craft 现状 | Fleet 需要 |
|---|---|---|
| 中文新手体验 | 英文为主，配置项多 | 默认中文、模板化 Provider/Source/Skill、自动发现 |
| Provider 简化 | craft 能力强，但概念多 | DeepSeek/智谱/Qwen/Ollama/OpenAI/Anthropic 的低摩擦入口 |
| 知识库/记忆 | sources 和 session 有基础 | 个人记忆、项目知识库、跨会话检索、上下文自动压缩 |
| 手机/IM | 有 messaging gateway/WhatsApp worker | 企业微信/飞书/Telegram/手机触发，中文配置向导 |
| 打包发布 | craft 有 electron-builder 配置 | Fleet 名称、签名、公证、更新通道、安装包资产 |

## 3 · 你提到的功能逐项状态

| 你想要的功能 | craft 现在是否满足 | 结论 |
|---|---|---|
| “直接用别人好看的桌面板” | 部分满足 | craft AppShell 比旧自研壳强，可以作为基座；还要改成 Codex/Claude 桌面布局 |
| OpenCode 简单但功能全 | 部分满足 | craft 功能更全，但入口更复杂；需要降配置感 |
| 智能体编排 | 不满足 | 需要 AionUi team/agent 体系 |
| Skill 管理 | 部分满足 | 有 Skill，但缺全局管理、安装更新、按应用启用 |
| 浏览器预览/网页点评 | 部分满足 | 有 browser tool/pane，缺右侧点评工作流 |
| Git 管理 | 部分满足 | 有 diff/branch 辅助，缺完整 Git panel |
| MCP 管理 | 部分满足 | 有 sources/MCP，但缺新手友好的一等管理面 |
| Agent 自主操作软件 | 部分满足 | 有工具基础，缺统一可视化操作层和桌面软件控制 |
| Warp 式终端 | 不满足 | 需要终端/PTY/命令块 |
| Codex/Claude Desktop 右侧进度/上下文/文件 | 部分满足 | craft 有 panels/sidebars，但要重排信息架构 |
| 不做 Cherry Studio 那种手动配置产品 | craft 有风险 | source/provider 配置较多，必须自动发现和渐进披露 |

## 4 · 建议改造顺序

### 0. 文档和基座锁定

- 保持 `app/` 为 craft 原结构。
- 只从 AionUi 迁绿灯代码。
- 旧 M0 文档归档，不再执行。

### 1. 去 Craft 化

- `package.json`、Electron product name、协议、图标、窗口标题。
- `~/.craft-agent` 是否迁为 `~/.fleet` 或保留兼容层。
- 英文主文案替换为中文。

### 2. 第一屏改造

- 保留 craft AppShell/PanelStack。
- 左侧：项目/会话/Agent。
- 中央：任务输入 + session timeline。
- 右侧：进度、文件变化、浏览器、上下文、Skill/MCP 状态。

### 3. Agent 编排

- AionUi Agent 名册、团队生命周期、@ 提及。
- Codex/Claude/Qwen/Grok 等外部 CLI 作为 Agent 类型。
- 并发 Agent 输出进入同一 session timeline。

### 4. Skill 管理

- craft workspace skill 保留为运行基础。
- 新增 Fleet 全局 Skill 库：发现、导入、安装、更新、启用范围。
- AionUi 式首条消息索引注入和选中 Skill 全量注入。

### 5. 三个一等工作面板

- Git panel。
- Browser preview / webpage review panel。
- Agentic terminal panel。

## 5 · 当前不能做的事

- 不要再恢复旧 `app/src` 自研工程。
- 不要从 Cherry Studio/Kun/Zed 等项目复制源码。
- 不要把所有新能力藏在 Settings。
- 不要先做营销页或装饰性 UI。
- 不要在没有真实 browser/Git/terminal 证据链时假装功能完成。

## 6 · 下一步最合理任务

当前用户明确要求“先不要改 craft UI，在它上面增加功能”，并已纠正：CLI 自动检测不应出现在 onboarding 首页，应该进入独立 CLI/终端设置页和聊天区紧凑入口。因此下一步不是继续做首页卡片，而是从 **P0-B 探测收口 + P0-C Runtime Catalog** 开始。

原因：

1. CLI Runtime Host 是“连接电脑上的 Codex/Claude/Qwen/OpenCode/Cursor/Antigravity/Hermes/OpenClaw/Grok Build 及 AionUi catalog 里的本机 Agent CLI”的底座；Gemini CLI 不再列入当前内置探测。
2. AionUi 对 CLI/ACP/custom agent/进程生命周期适配最完整，P0-C/P0-D 必须优先学习 AionUi，而不是闭门自造路径输入框。
3. 当前探测只能证明 local-only RPC、PATH/环境获取、失败分类可行；还没有完成 runtime 固化、启动/停止、权限、timeline 和 Skill 注入。
4. 第一屏改造仍是产品目标，但放到用户确认后的 P2 阶段，避免现在又做出一套失败 UI。

P0-B 完成后，再按 `docs/Fleet-功能缺口与技术路线.md` 和 `docs/Fleet-多智能体审查与并行执行协议.md` 拆分并行实现。
