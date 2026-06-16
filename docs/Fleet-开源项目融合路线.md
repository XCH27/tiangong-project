# Fleet 开源项目融合路线

> 当前路线：**craft-agents-oss 为主基座，AionUi 为第二绿灯来源**。其它项目只做黑盒产品/交互参考，除非许可证单独核准。

## 1 · 产品主线

Fleet = craft 的 agent-native 工作区底座 + AionUi 的 CLI/ACP/Team/Skill 运行体系。

目标不是把所有开源项目拼起来，而是把 craft 改成更接近 Codex/Claude Desktop/OpenCode 的低摩擦桌面 Agent 控制台：

- 第一屏直接开始任务，不先逼用户配置一堆 source/provider。
- Git、浏览器、Skill、MCP、终端围绕当前 session 出现。
- Agent 能操作软件，过程可观察、可审批、可回放。
- AionUi 的 custom agent、ACP、团队/群聊/@提及、Skills Hub 补上 craft 缺少的 Runtime Host 与 Agent 编排。

## 2 · 直接源码来源

| 来源 | 用法 | 原因 |
|---|---|---|
| `app/` / `源码参考/craft-agents-oss` | 主工程，直接改 | Apache-2.0，已有 Electron、session、source/MCP、browser、Skill、权限、自动化 |
| `源码参考/AionUi` | 按模块迁移 | Apache-2.0，适合补 CLI/ACP/custom agent、进程生命周期、群聊、多 Agent、Skill 运行注入 |

说明：MIT/Apache-2.0 不自动等于绿灯。只有被写入本表并注明复制范围、来源版本和归因方式的项目，才允许复制源码。

## 3 · 黑盒参考来源

| 来源 | 只参考什么 | 不做什么 |
|---|---|---|
| cc-switch | Claude/Codex/OpenCode/OpenClaw/Hermes 等跨应用 Skill/Provider/MCP 管理路径、SSOT + symlink/copy 产品模型 | 未核准前不复制源码、测试、类型、配置和样式；不能替代 AionUi 的 Runtime Host 主路线 |
| OpenCode | 低摩擦工作台、简洁任务入口 | 不复制源码 |
| Claude/Codex Desktop | 左侧会话、中心输入、右侧上下文/进度/文件面板 | 不照抄品牌资产 |
| Warp | Agentic terminal、命令块、长任务观察 | 不复制闭源 UI |
| Cherry Studio | Provider/知识库/迁移/E2E 的成熟度 | 不复制 AGPL 源码 |
| Kun | 轻桌面气质 | 不复制非商业源码 |
| Golutra | 终端会话、命令分发、成员化协同 | BSL 1.1，高风险黑盒，不复制源码 |
| Hermes Agent | toolset/browser tools 的组织方式 | MIT 但未纳入绿灯，暂不复制源码 |
| LobeHub/multica/cmux/Zed 等 | Git/diff/browser/多面板/协作思路 | 未核准前不复制源码 |

## 4 · 当前吸收矩阵

| 目标模块 | craft 现状 | Fleet 还要做 |
|---|---|---|
| 主工作台 | 有 AppShell、panel stack、session list、sources/skills 面板 | 改成更像 Codex/Claude 的低摩擦第一屏，弱化 Craft 文档产品感 |
| CLI / ACP Runtime | 有 Claude/Pi/Copilot 连接和 shell/background task，但不是统一本机 CLI Runtime Host | 优先学习 AionUi：custom agent、command/args/env/native skills dirs、CLI/ACP 健康测试、进程生命周期；cc-switch 只补跨应用资源模型 |
| Agent 编排 | 有 subagent 和 session 状态，但不是群聊团队 | 接 AionUi 的 Agent 名册、团队生命周期、@ 指派 |
| Skill | 有 workspace skills、slash command、UI 列表 | 做全局 Skill 管理、安装/更新/启用、AionUi 式运行时注入；cc-switch 的 SSOT/per-app enable 仅黑盒参考 |
| MCP/source | 有 source 系统、MCP/API/local、权限与测试 | 做更直观的一等 MCP 管理面板和默认发现 |
| 浏览器 | 有 browser pane/CDP/browser_tool | 做右侧常驻预览和网页点评入口 |
| Git/diff | 有 diff、分支清理和 git-bash 辅助 | 做完整 Git panel：status、branch、worktree、commit、PR |
| 终端 | 有 shell/tool/background task | 做 Warp 式 Agentic terminal、命令块、PTY、历史、用户接管 |
| 软件操作 | 有 sources/browser/local tools | 统一成“观察状态 + 执行动作 + 审批 + 回放”的软件操作层 |
| 中文新手体验 | craft 主要是英文和 source 配置导向 | 默认中文、自动发现、模板化配置、减少设置页依赖 |

## 5 · 近期顺序

1. **P0 文档和边界锁定**：缺口、技术路线、来源边界、多 Agent 审查协议。
2. **P0-B CLI Runtime 探测收口**：应用启动自动探测，独立 CLI/终端设置页展示完整状态；onboarding 首页不展示 CLI。
3. **P0-C Runtime Catalog**：按 AionUi custom agent 思路固化 runtime，支持 command/args/env/native skills dirs/description/behavior policy/健康测试，写入 craft preferences，不另起第二套配置。
4. **P0-D CLI / ACP Runtime Adapter**：优先 ACP/SDK/MCP，PTY 兜底；启动/停止、输出回放、权限接入、进程生命周期参考 AionUi。
5. **P1 Agent 编排**：从 AionUi 迁 Agent/team/@mention/ACP 能力，但适配进 craft session/timeline。
6. **P1 Skill 管理**：在 craft skills 基础上补全局 SSOT、安装、更新、启用、运行注入；AionUi 为主，cc-switch 补跨应用同步模型。
7. **P1 Git / 浏览器 / 终端三面板底层**：先补 RPC/service/证据链，再接现有 panel。
8. **P2 去 Craft 化和第一屏重排**：用户确认后做 Codex/Claude/OpenCode 式首屏，不和当前“不改 UI”冲突。
