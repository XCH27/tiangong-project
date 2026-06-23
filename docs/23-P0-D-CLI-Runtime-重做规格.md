# 23 · CLI Runtime 重做规格

> 状态日期：2026-06-20
> 当前 `app/` 已重置为干净 craft-agents-oss 基座。本文只保留上一轮验证出的产品规格和实现边界，不再把旧代码视为当前实现。
> **2026-06-23 进度：后端基座 + 输入框三按钮选择器 ✅ 已落主线**。
> **已完成**：catalog/health/RPC/协议（同上批）+ **ACP 发送链路**：`services/acp/`（`AcpConnection` JSON-RPC ndjson、`AcpRuntimeSession` initialize/new/prompt/stream/permission/cancel、stdio transport、`CliRuntimeHost` 进程复用与清理，均有 mock-transport 单测）+ 会话级 runtime/model 选择（`cliRuntimeId`、`cliRuntimeModelId`、`setCliRuntime`、`setCliRuntimeModel`、`cli_runtime_changed`、`cli_runtime_models_changed`）+ `sendMessage` 路由（`runCliRuntimeTurn` 复用 craft text_delta/text_complete/complete）+ 附件硬拒绝 + 进程清理（cancel/delete/cleanup）+ 输入框三按钮（CLI / 模型 / Token 环）+ 设置页本机 CLI 列表/启停/测试 + **Custom runtime 新增/编辑/删除表单**。Detected 内置清单跟随 AionUi 已验证 ACP smoke：Claude Code / Codex / Goose，且只有本机 PATH 上检测到命令才进入聊天选择器。
> **未完成（下一步）**：Custom runtime 高级校验（重复 command/args 提醒、敏感 env 脱敏提示）、真实 CLI 的 opt-in smoke、usage/额度采样适配器。验收以 `docs/24 §0` 为准。

## 目标

CLI Runtime Host 是新基座的第一批重做能力：让用户在同一个 craft session 里选择本机 CLI/ACP runtime 发送消息，并把输出、权限、错误、停止、诊断全部写回现有 timeline。

它不是第二套聊天系统，也不是独立终端页。它必须接 craft 现有 `SessionManager`、permission、RPC、renderer event flow 和配置系统。

## 第一版必须支持

- **Custom ACP runtime**：用户可配置 `command/args/env`，用于接入任意本机 ACP stdio runtime。
- **Detected mapping**：跟随 AionUi 已验证 ACP smoke 的入口，且只在本机 PATH 上检测到命令后出现在聊天选择器。
  - Claude Code：`claude --acp`
  - Codex：`codex --acp`
  - Goose：`goose acp`
- **Unsupported detected**：Grok/Hermes/OpenCode/Gemini/Qwen 等未在 AionUi ACP smoke 覆盖中确认稳定入口时不能假识别为 detected；如用户明确需要，走 Custom ACP runtime 自配 `command/args/env`。
- **健康测试分级**：`available`、`fail_cli`、`fail_acp`、`disabled`，并保留阶段、原因、stdout/stderr tail。
- **设置页边界**：
  - managed runtime 不可删除、禁用或改启动参数。
  - detected runtime 不可改 command/args/env，但可测试、禁用、删除。
  - custom runtime 可完整编辑。
- **发送契约**：
  - 未选择 CLI 时继续走 API 模型路径。
  - 已选择 CLI 时走本机 ACP adapter。
  - runtime 和 model 分离：`cliRuntimeId` 只表示使用哪个本机 CLI；`cliRuntimeModelId` 表示该 CLI 当前 ACP session 内的模型选择。
  - 模型清单优先来自 ACP `session/new` 返回的 `configOptions` / `models`，Fleet 不按模型名猜测。
  - 切换模型优先用 `session/set_config_option`，兼容降级用 `session/set_model`；runtime 不暴露模型时显示“模型由 CLI 管理”，不伪造列表。
  - `reasoningEffort` 只允许白名单值。
- **聊天入口**：
  - 不新建 CLI 专用聊天页；输入框底部使用三个独立按钮：CLI / 模型 / Token 环（见 `docs/36`）。
  - 不在顶部栏保留第二个 CLI 选择器；运行方式只在输入框 CLI 按钮切换。
  - 选择 API 模型时自动退出 CLI runtime；选择 CLI Runtime 后，本轮和后续发送走该 runtime。
  - UI 必须中文显示：`本机 CLI`、`API 模型`、`CLI 模型`、`模型由 CLI 管理`。
- **附件第一版硬拒绝**：选择 CLI Runtime 后，任何附件都拒绝，提示移除附件或切回 API 模型。
- **进程清理**：停止、错误、窗口关闭、session 结束都要清理子进程。

## 参考实现边界

优先看这些来源，但不要直接照搬旧 app 代码：

- craft-agents-oss：session、permission、RPC、renderer event flow。
- AionUi（绿灯）：ACP/custom agent、进程生命周期、team/skill 注入模式。
- open-design（绿灯）：runtime definitions、prompt transport、stream parser 思路。
- Claude/Codex/Goose：跟随 AionUi ACP smoke 入口做 opt-in 实机验证。
- Grok/Hermes/OpenCode/Gemini/Qwen：当前未进入内置 detected 清单，只能黑盒参考；如用户本机可用，先走 Custom ACP runtime。

## 对标结论（2026-06-23）

- **AionUi / Multica**：更偏“检测并管理外部 agent/CLI”，优点是启动、健康检查和 team 入口清楚；Fleet 吸收其进程生命周期和可观测性，但不迁第二套会话。
- **Warp / Zed / Cursor / Claude / Codex**：更偏自身运行时或编辑器内置 agent，模型和用量展示贴近各自产品；Fleet 不能照搬其 UI 壳，应复用 Craft 原顶部栏、输入框模型选择器、permission 和 timeline。
- **OpenCode**：动态模型/档位适配值得参考；Fleet 的实现原则是 ACP runtime 握手优先，能拿到 runtime 模型清单就显示，拿不到就明确“模型由 CLI 管理”。
- **Fleet 的更优点**：API 与 CLI 是同一个 craft session 的两条发送路由；模型切换、权限、停止、输出、用量和回放不分裂。CLI 只负责本机执行和原生模型能力，Fleet 负责会话级路由、可见性和安全边界。

## 建议文件落点

- `app/packages/server-core/src/services/cli-runtime-*`
- `app/packages/server-core/src/handlers/rpc/cli-runtime.ts`
- `app/packages/shared/src/protocol/dto.ts`
- `app/apps/electron/src/renderer/components/cli-runtime/*`
- `app/apps/electron/src/renderer/pages/settings/*`

命名和目录可以按新基座实际结构微调，但不得另起第二套 session store。

## 验收

实现后至少验证：

```bash
./scripts/craft.sh run typecheck:electron
./scripts/craft.sh run --filter @craft-agent/server-core typecheck
git diff --check
```

补充测试应覆盖：

- custom runtime 成功和失败。
- detected mapping 只在本机 PATH 存在时进入列表，不能把静态候选误报为“已识别”。
- unsupported detected 返回中文错误。
- fail_cli/fail_acp 分级。
- model/effort 透传。
- 附件硬拒绝。
- 进程 dispose。

真实 Claude/Codex/Goose 只能做 opt-in smoke，不进入默认 CI。Grok/Hermes/OpenCode/Gemini/Qwen 未确认前不进内置 detected 清单。
