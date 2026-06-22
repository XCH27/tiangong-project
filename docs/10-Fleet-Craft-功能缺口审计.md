# 10 · Fleet × Craft 功能缺口审计

> 目的：判断直接使用 craft-agents-oss 作为基座后，还缺哪些你想要的 Fleet 能力。结论：craft 是很好的底座，但不是最终产品形态；它缺的主要是 Agent 编排、低摩擦桌面工作台、Git/终端一等面板、全局 Skill 管理和中文新手体验。

> **2026-06-20 状态更新**：`app/` 已重置为干净 craft-agents-oss 基座。CLI Runtime 方向保留，但需要按 `docs/23-P0-D-CLI-Runtime-重做规格.md` 重新落地，不再把旧二开代码视为当前实现。

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
| Browser pane / browser_tool | 已有 | `server-core/src/sessions/RemoteBrowserPaneManager.ts`、`handlers/browser-pane-manager-interface.ts`、`packages/shared/src/agent/browser-tools.ts`、`renderer/atoms/browser-pane.ts`、`resources/docs/browser-tools.md` |
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
| “直接用别人好看的桌面板” | 部分满足 | craft AppShell 可以作为基座；还要改成 Codex/Claude 桌面布局 |
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

- 保持 craft 原结构。
- 只从 AionUi 等绿灯项目迁移已核准代码。
- 当前路线以 `AGENTS.md`、`docs/00`、`docs/01`、`docs/19` 为准。

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

- 不要另起一套 Electron/Vite/IPC/renderer 架构。
- 不要从 Cherry Studio/Kun/Zed 等项目复制源码。
- 不要把所有新能力藏在 Settings。
- 不要先做营销页或装饰性 UI。
- 不要在没有真实 browser/Git/terminal 证据链时假装功能完成。

## 6 · 下一步最合理任务

当前 `app/` 已经回到干净 craft 基座。下一步不是补旧实现，而是按顺序重做可复用能力：

1. **CLI Runtime Host**：按 `docs/23-P0-D-CLI-Runtime-重做规格.md` 做 Runtime Catalog、ACP adapter、health、settings 和聊天入口，按 `docs/24-CLI-Runtime-验收清单.md` 验收。
2. **附件边界**：第一版继续硬拒绝；若打开，只做 capability-gated `inline_text`，不传本地路径，不传图片/PDF/Office 原文件。
3. **下一候选 runtime mapping**：基于 `docs/12-最新开源Agent与CLI参考更新.md`，优先验证 Gemini CLI `gemini --acp`，其次确认 Qwen Code 是否有 Fleet 可消费的 stdio ACP 入口。
4. **浏览器人类层**：右侧浏览器预览、点选元素、标注、截图，继续复用 craft browser_tool 和 session timeline。
5. **Agent 编排 / Skill 管理**：按 AionUi 迁移边界推进，但必须进入 craft SessionManager / permission / timeline，不另起第二套会话。
