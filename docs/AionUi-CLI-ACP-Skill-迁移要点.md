# AionUi CLI / ACP / Skill 迁移要点

> 用途：避免后续 Agent 反复重读 AionUi 同一批源码。AionUi 是 Apache-2.0 绿灯来源，但迁移到 Fleet 时必须接入 craft 的 session、permission、preferences 和 timeline，不能搬第二套会话或配置。

## 1. 已读源码入口

| AionUi 文件 | 可吸收内容 | Fleet 落点 |
|---|---|---|
| `源码参考/AionUi/readme.md` | 支持 Claude Code、Codex、Qwen Code、Goose AI、OpenClaw、Augment Code、CodeBuddy、Kimi CLI、OpenCode、Factory Droid、GitHub Copilot、Qoder CLI、Mistral Vibe、Nanobot、Aion CLI、Snow CLI、Hermes Agent、Cursor Agent；其它具备 `mcpCapabilities.stdio` 的 ACP 后端可扩展；自动检测本机 CLI；并行会话与团队协作；模型平台包含 xAI | Runtime Catalog 的支持范围与能力模型 |
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
- **AionUi catalog 范围**：Fleet P0-B 内置探测已按 AionUi catalog 补齐 Aion CLI、Goose、CodeBuddy、Kimi、Factory Droid、Augment Code、GitHub Copilot、Qoder、Mistral Vibe、Nanobot、Snow；这些只是 detected runtime 入口，不代表 P0-D 的 ACP/session 启动已完成。
- **Grok Build 接入**：按 xAI 官方规则，安装脚本为 `curl -fsSL https://x.ai/cli/install.sh | bash`，本机入口为 `grok`，默认目录为 `~/.grok/bin` 和 `~/.grok`；验证用 `grok --version`，交互用 `grok`，headless 用 `grok -p ...`，ACP 用 `grok agent stdio`；Fleet 先把它作为 detected runtime，后续 P0-D 再接 ACP/session 启动。
- **Gemini CLI 取舍**：AionUi 参考资料中出现 Gemini，但 Fleet 当前内置探测已删除 Gemini CLI；后续如恢复，只能作为普通 custom runtime 进入 Runtime Catalog。
- **入口可用与版本可读分离**：Hermes/Grok 等 CLI 的版本命令可能慢或包含更新检查。Fleet P0-B 只要解析到可执行入口就保留为可用 runtime；`timeout/version_failed` 是健康状态，不再把入口存在的 CLI 显示成“未安装”。
- **自定义 Runtime 字段**：`displayName`、`icon`、`command`、`args`、`env`、`enabled`、`nativeSkillsDirs`、`behaviorPolicy`、`description`。
- **健康测试分级**：至少区分 `available`、`not_found`、`broken_link`、`version_failed`、`fail_cli`、`fail_acp`、`disabled`。P0-B 探测只证明 CLI 入口存在，P0-C/P0-D 才证明 ACP/session 可启动。
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

## 5. 反模式

- 只做一个“路径输入框”，不做 Runtime Catalog。
- 把检测到的 CLI 当作一次性 UI 状态，不固化到缓存/偏好。
- 先引入 PTY 再考虑 ACP；P0-B/P0-C 不需要 PTY。
- 绕过 craft permission 或 timeline 单独建 WebSocket/日志库。
- 复制 cc-switch/OpenCode/Hermes 等未核准源码。它们当前只能黑盒参考产品模型。
