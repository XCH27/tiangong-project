# 22 · AionUi CLI / ACP / Skill 迁移要点

> 用途：避免后续 Agent 反复重读 AionUi 同一批源码。AionUi 是 Apache-2.0 绿灯来源，但迁移到 Fleet 时必须接入 craft 的 session、permission、preferences 和 timeline，不能搬第二套会话或配置。

## 1. 已读源码入口

| AionUi 文件 | 可吸收内容 | Fleet 落点 |
|---|---|---|
| `源码参考/software/AionUi/readme.md` | 支持 Claude Code、Codex、Qwen Code、Goose AI、OpenClaw、Augment Code、CodeBuddy、Kimi CLI、OpenCode、Factory Droid、GitHub Copilot、Qoder CLI、Mistral Vibe、Nanobot、Aion CLI、Snow CLI、Hermes Agent、Cursor Agent；其它具备 `mcpCapabilities.stdio` 的 ACP 后端可扩展；自动检测本机 CLI；并行会话与团队协作；模型平台包含 xAI | Runtime Catalog 的支持范围与能力模型 |
| `packages/desktop/src/renderer/pages/settings/AgentSettings/InlineAgentEditor.tsx` | custom agent 表单：`name/icon/command/enabled/args/env/advanced`；测试连接区分 CLI 与 ACP | Fleet CLI/终端设置页的“自定义 Runtime”表单 |
| `packages/desktop/src/renderer/pages/settings/AgentSettings/LocalAgents.tsx` | detected/custom agent 分区、刷新、启停、编辑、删除、测试连接 | Fleet Runtime Catalog UI 的信息架构 |
| `packages/desktop/src/common/types/platform/acpTypes.ts` | `native_skills_dirs`、`behavior_policy`、`description`、ACP 会话与权限类型 | Fleet Runtime metadata 与 Skill 注入字段 |
| `packages/desktop/src/common/adapter/ipcBridge.ts` | `getAvailableAgents`、`getManagedAgents`、`refreshCustomAgents`、`testCustomAgent`、`create/update/delete/setEnabled`；Skill list/materialize/import/symlink API | craft local-only RPC 设计参考 |
| `packages/web-host/src/agent-process-registry.ts` | pid/process group 注册、runtime json、SIGTERM -> SIGKILL、Windows `taskkill /T`、原子写入 | Fleet Runtime process registry |
| `packages/web-host/src/backend-launcher.ts` | health polling、启动超时、早退分类、stdout/stderr tail、崩溃诊断、优雅停止 | Fleet Runtime Adapter 启动/停止/诊断 |
| `tests/e2e/specs/agent-settings-detection.e2e.ts` | 设置页渲染、检测结果、刷新按钮、known backend 展示 | Fleet CLI 设置页 E2E 目标 |
| `tests/e2e/specs/acp-agent.e2e.ts` | agent pill、known backends、选择 agent、MCP tools 入口 | Fleet chat runtime 选择和 MCP 入口 E2E 目标 |

## 2. 直接吸收的产品模型

- **Detected + Custom 分层**：自动检测到的 runtime 不要求用户配置；检测不到或别名不同的 CLI 进入 custom runtime。
- **AionUi catalog 范围**：Fleet 重新落地 CLI Runtime 时，可按 AionUi catalog 补齐 Aion CLI、Goose、CodeBuddy、Kimi、Factory Droid、Augment Code、GitHub Copilot、Qoder、Mistral Vibe、Nanobot、Snow 等 detected runtime；detected 入口不等于 ACP/session 可启动。
- **Grok Build 接入**：按 xAI 官方规则，安装脚本为 `curl -fsSL https://x.ai/cli/install.sh | bash`，本机入口为 `grok`，默认目录为 `~/.grok/bin` 和 `~/.grok`；验证用 `grok --version`，交互用 `grok`，headless 用 `grok -p ...`，ACP 用 `grok agent stdio`。
- **Gemini CLI 取舍**：AionUi 参考资料中出现 Gemini；Fleet 后续如接入，应先确认稳定 ACP/stdio 入口，再作为普通 custom runtime 或 detected mapping 进入 Runtime Catalog。
- **入口可用与版本可读分离**：Hermes/Grok 等 CLI 的版本命令可能慢或包含更新检查。Fleet 只要解析到可执行入口就保留为候选 runtime；`timeout/version_failed` 是健康状态，不再把入口存在的 CLI 显示成“未安装”。
- **自定义 Runtime 字段**：`displayName`、`icon`、`command`、`args`、`env`、`enabled`、`nativeSkillsDirs`、`behaviorPolicy`、`description`。
- **健康测试分级**：至少区分 `available`、`not_found`、`broken_link`、`version_failed`、`fail_cli`、`fail_acp`、`disabled`。入口探测只证明 CLI 存在，ACP health 才证明 session 可启动。
- **进程生命周期**：启动后必须登记 pid/process group、命令摘要、runtime id、session id；停止时先温和终止，再强杀；异常退出要保留 stdout/stderr tail。
- **Skill 注入**：runtime metadata 中保留 `nativeSkillsDirs`，后续由 Skill 管理层 materialize/import/symlink，不把 Skill 同步逻辑塞进 CLI 探测卡片。

## 3. Fleet 实现边界

- 新增本机能力 RPC 默认 `LOCAL_ONLY`。
- Runtime 配置写入 craft 现有 preferences/settings，不新增第二套 config store。
- Runtime 启动、停止、命令执行、文件写入必须接 craft permission、session timeline、证据链。
- CLI 探测可静默自动执行；交互式启动和副作用命令必须可审批、可停止、可回放。
- AionUi 的 UI 组件不能原样塞进 craft；可以迁移 Apache-2.0 逻辑或按模式重写为 craft 现有视觉。

## 4. 下一阶段任务拆分

1. **Runtime Catalog schema**：补 `CliRuntimeDefinition` / `ManagedCliRuntime`，覆盖 detected/custom、args/env、advanced、enabled、lastHealth。
2. **Preferences 持久化**：把自定义 Runtime 写入 craft preferences，并和自动探测结果合并显示。
3. **Health test RPC**：新增 `cliRuntime:testCustom`，返回 `success/fail_cli/fail_acp` 和诊断信息。
4. **Process Registry**：迁移或改写 AionUi registry 模式，记录 pid/process group/session/runtime。
5. **Runtime Adapter**：先做 ACP/stdio 启动与停止；PTY 只作为 P1-C 交互终端兜底。
6. **Chat 使用入口**：聊天页只放紧凑 runtime 选择/状态入口；完整管理留在设置页。
7. **E2E / 单测**：覆盖支持列表、自动检测缓存、自定义 runtime 增删改启停、health test 失败分类、进程清理。

## 4.1 一次性吸收 AionUi 的合理批次

不要每做一个小功能就重新读 AionUi。后续按下面 5 个批次吸收，批次之间通过 craft 现有 session/preferences/RPC 边界连接。

| 批次 | 从 AionUi 学什么 | Fleet 应落到哪里 | 验收口径 |
|---|---|---|---|
| A. Runtime Catalog | `LocalAgents` / `InlineAgentEditor` 的 detected + custom 分层、`command/args/env/nativeSkillsDirs/behaviorPolicy/description` 字段、启用/禁用/测试连接 | craft preferences + `cliRuntime:*` local-only RPC，不新增配置库 | 设置页能看到自动检测 runtime、自定义 runtime，并能保存、启停、测试 |
| B. Process Registry | `agent-process-registry.ts` 的 pid/process group 注册、SIGTERM -> SIGKILL、Windows `taskkill /T`、原子写入 | `server-core` 新 runtime process registry，记录 `sessionId/runtimeId/agentId/commandPreview` | 应用退出或会话停止后，托管 CLI 子进程可被清理 |
| C. ACP Runtime Adapter | ACP init/session/prompt/permission/model/config 类型和 fake ACP CLI 测试方式 | `server-core` runtime adapter 层，优先 ACP/stdio，PTY 延后 | 选中支持 ACP 的 CLI 后，消息能进入同一个 craft session timeline |
| D. Team / @ 指派 | team create/member messaging/leader preset/team lifecycle 的产品模型和测试 | craft subagent/session 上补 `teamId/agentId/role/displayName` 元数据 | 一个会话里能区分队长、队员、被 @ 指派的 runtime 输出 |
| E. Skill 运行注入 | native skills dirs、Skills Hub、Skill materialize/import/symlink 的边界 | 复用 craft Skills，runtime metadata 只保存技能目录和启用范围 | Skill 文件仍是单一来源，注入进 runtime 时可追踪来源 |

这 5 批中，A/B/C 是当前 CLI Runtime Adapter 的前置；D/E 不应抢在 A/B/C 之前写大 UI。

## 4.1.1 AionUi 只读审查任务输出格式

真正迁移 AionUi 源码前，必须先做一次只读审查。审查 agent 不改 `app/`，只输出清单和风险。

> 状态：当前 `app/` 已重置为干净 craft 基座。AionUi 仍是绿灯来源，但真正复制/改写源码前必须按批次写入 `docs/27-源码归因清单.md`，并接 craft 现有 session、preferences、permission 和 timeline。

审查范围先限定为：

- `源码参考/software/AionUi/packages/desktop/src/renderer/pages/settings/AgentSettings/InlineAgentEditor.tsx`
- `源码参考/software/AionUi/packages/desktop/src/renderer/pages/settings/AgentSettings/LocalAgents.tsx`
- `源码参考/software/AionUi/packages/desktop/src/common/types/platform/acpTypes.ts`
- `源码参考/software/AionUi/packages/web-host/src/agent-process-registry.ts`
- `源码参考/software/AionUi/packages/web-host/src/backend-launcher.ts`
- `源码参考/software/AionUi/tests/fixtures/fake-acp-cli/`
- `源码参考/software/AionUi/tests/e2e/cases/teams/`

审查输出必须包含：

| 字段 | 要求 |
|---|---|
| 可迁移文件 | 原路径、功能点、是否含版权/SPDX 头 |
| 迁移方式 | 原样复制 / 局部复制 / 改写 / 只学模式 |
| Fleet 落点 | 目标文件或待新增模块，必须接 craft preferences/session/timeline/RPC |
| 归因草稿 | 写入 `docs/27-源码归因清单.md` 的条目草稿 |
| 风险点 | 是否可能形成第二套 session/config、是否需要 permission/local-only、是否影响 UI |
| 验收测试 | 单测/E2E 命令和预期结果 |

只有审查清单通过后，才允许按小批次迁移 AionUi 源码。

## 4.1.2 用户确认清单

进入 CLI Runtime 实施前，需要确认：

1. 第一版首选 **ACP/stdio**，PTY/xterm 交互终端延后。
2. AionUi 迁移必须逐项写入 `docs/27-源码归因清单.md`，保留 Apache-2.0/SPDX/NOTICE 归因。
3. 内置 Fleet CLI 先作为 `runtimeId = fleet` 的 managed runtime，不先发布全局命令。
4. Team 能力进入 P1 前，必须先给出 craft `SessionEvent` 映射方案，不建立第二套 team/session store。
5. CLI Runtime 稳定后，再做评测骨架和缓存命中统计接口。

## 4.2 内置 Fleet CLI 的边界

用户需要一个像 Aion CLI 一样的内置入口，用来配置自己的系统提示词、默认工具、Skill 目录和运行策略。它不是另一个产品，也不能绕过 craft：

- 名称先按 **Fleet CLI / 内置 Agent** 处理，后续再定最终命令名。
- 它作为 `runtimeId = fleet` 的 managed runtime 进入 Runtime Catalog，和 Claude Code、Codex、Grok 等外部 CLI 平级显示。
- 配置写入 craft preferences：`systemPromptPreset`、`behaviorPolicy`、`nativeSkillsDirs`、默认模型/Provider、启用状态。
- 执行仍走 craft `SessionManager`、permission、timeline 和工具系统；不新建第二套聊天存储。
- CLI 命令行入口只是同一 runtime 的外壳，不能成为独立 truth。终端里调用时也要能回放到对应 session 或生成可导入记录。

第一阶段只做 managed runtime schema 和设置页入口；不要急着发布真正的全局命令。等 Runtime Adapter 能跑通后，再把命令行入口接上。

## 4.3 Warp 只学习终端交互，不迁代码

Warp 对 Fleet 的价值是 Agentic terminal 产品模型：命令块、长任务观察、可接管输入、命令历史、失败诊断和可视化回放。由于 Warp 不在绿灯源码表，不能复制源码、样式、资源或结构性实现。

Fleet 的落法：

- 第一版先用 ACP/stdio 接 CLI 会话，不引入 PTY。
- P1-C 再做 PTY 终端面板，参考 Warp 的交互目标：命令块、运行态、停止/重试、输出折叠、用户接管。
- 终端输出必须进入 craft session timeline，不能只存在 xterm buffer。
- 命令执行、Git mutate、文件写入必须接 craft permission。

## 4.4 当前 CLI 模型列表真实状态

Grok Build 已经可以在探测阶段用官方 `grok models` 获取模型列表，设置页或聊天区重新检测后应显示 `Auto` 加真实模型。其它 CLI 只有在对应 runtime adapter 能提供模型能力时才显示真实列表。

当前干净基座尚未实现 CLI Runtime 消息路由。下一步必须做 Runtime Adapter 和发送链路，而不是继续调 popover。

## 5. 反模式

- 只做一个“路径输入框”，不做 Runtime Catalog。
- 把检测到的 CLI 当作一次性 UI 状态，不固化到缓存/偏好。
- 先引入 PTY 再考虑 ACP；第一版不需要 PTY。
- 绕过 craft permission 或 timeline 单独建 WebSocket/日志库。
- 复制 cc-switch/OpenCode/Hermes 等未核准源码。它们当前只能黑盒参考产品模型。
