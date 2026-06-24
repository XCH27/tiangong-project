# 23 · CLI Runtime 重做规格

> 状态日期：2026-06-24
> 当前 `app/` 已重置为干净 craft-agents-oss 基座。本文只保留上一轮验证出的产品规格和实现边界，不再把旧代码视为当前实现。
> **2026-06-23 进度：后端基座 + 输入框三按钮选择器 ✅ 已落主线**。
> **2026-06-24 更新**：刷新会扫描常见本机 Agent CLI（Goose/Claude Code/Codex/Grok/Hermes/OpenCode/Antigravity/Qwen/Pi/Cursor Agent/OpenClaw），并自动测试。`protocol='acp'`（Goose/Hermes/OpenCode/Custom ACP）走 stdio ACP；Codex/Claude Code/Grok/Antigravity(`agy`) 走官方 one-shot CLI adapter，进入聊天 runtime picker 并可发送；Qwen/Pi/Cursor Agent/OpenClaw 等未接发送 adapter 的 runtime 才标记 `needs_adapter`。Gemini CLI 不再作为内置本机 runtime 探测项；Google 路线以后按 Antigravity `agy`。
> **已完成**：catalog/health/RPC/协议（同上批）+ **ACP 发送链路**：`services/acp/`（`AcpConnection` JSON-RPC ndjson、`AcpRuntimeSession` initialize/new/prompt/stream/permission/cancel、stdio transport、`CliRuntimeHost` 进程复用与清理，均有 mock-transport 单测）+ 会话级 runtime/model 选择（`cliRuntimeId`、`cliRuntimeModelId`、`setCliRuntime`、`setCliRuntimeModel`、`cli_runtime_changed`、`cli_runtime_models_changed`）+ `sendMessage` 路由（`runCliRuntimeTurn` 复用 craft text_delta/text_complete/complete）+ 附件硬拒绝 + 进程清理（cancel/delete/cleanup）+ 输入框三按钮（CLI / 模型 / Token 环）+ 设置页本机 CLI 列表/自动测试 + **Custom runtime 新增/编辑/删除表单**。
> **未完成（下一步）**：Qwen/Pi/Cursor Agent/OpenClaw 等 native/subscription adapter、Custom runtime 高级校验、usage/额度采样适配器；Codex/Claude/Grok/Antigravity 当前是 one-shot adapter，尚未做完整会话恢复/逐工具权限细分。验收以 `docs/24 §0` 为准。

## 目标

CLI Runtime Host 是新基座的第一批重做能力：让用户在同一个 craft session 里选择本机 CLI/ACP runtime 发送消息，并把输出、权限、错误、停止、诊断全部写回现有 timeline。

它不是第二套聊天系统，也不是独立终端页。它必须接 craft 现有 `SessionManager`、permission、RPC、renderer event flow 和配置系统。

## 第一版必须支持

- **Custom ACP runtime**：用户可配置 `command/args/env`，用于接入任意本机 ACP stdio runtime。
- **Detected scan**：刷新扫描常见本机 Agent CLI，且只在本机 PATH 上检测到命令后出现在设置页。
  - ACP：Goose `goose acp`、Hermes `hermes acp`、OpenCode `opencode acp`、Custom ACP runtime。可直接进入聊天 runtime picker。
  - Native/subscription one-shot：Codex `codex exec`、Claude Code `claude -p`、Grok `grok --single`、Antigravity `agy --print`。可进入聊天 runtime picker，发送前走 craft permission，输出写回 timeline。
  - 未接 adapter：Qwen、Pi、Cursor Agent、OpenClaw。只显示“已检测，待 adapter”，不显示启用开关，不进入聊天 runtime picker。
- **模型信息**：ACP 模型以 runtime 握手为准；native/subscription 可显示已知静态模型提示（如 Codex/Grok），但不代表已可发送。
- **健康测试分级**：`available`、`fail_cli`、`fail_acp`、`needs_adapter`、`disabled`，并保留阶段、原因、stdout/stderr tail。
- **设置页边界**：
  - managed runtime 不可删除、禁用或改启动参数。
  - detected runtime 不可改 command/args/env，但可测试、禁用、删除。
  - custom runtime 可完整编辑。
- **发送契约**：
  - 未选择 CLI 时继续走 API 模型路径。
  - 已选择 CLI 时，ACP 走 stdio adapter；已支持的 native/subscription 走 one-shot adapter。
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
- AionUi（绿灯）：采用 `agent kind/protocol + ACP model info` 的分层做法；能读到模型就展示，不能读到不伪造。
- Multica（黑盒参考）：采用 daemon/PATH 扫描多 CLI 的方向；Fleet 吸收“刷新即扫描全部本机 Agent CLI”，但不迁第二套 daemon/session。
- Hermes（黑盒参考）：Codex/Grok/provider 走 runtime switch / provider plugin / gateway 思路；Fleet 当前已接 Hermes/OpenCode ACP 和 Codex/Claude/Grok/Antigravity one-shot adapter，后续补完整 session/native 协议。
- Goose / Hermes / OpenCode / Custom ACP：按 stdio ACP 做 opt-in 实机验证；Codex/Claude/Grok/Antigravity 走 one-shot native/subscription adapter；Qwen/Pi 等继续待 adapter。
- Provider 图标：`ConnectionIcon`/`provider-icons.ts` 已统一覆盖 Antigravity、Grok Build、xAI、Hermes、OpenCode、DeepSeek 等静态 SVG；Groq 暂无绿灯静态资产，继续 favicon fallback。LobeHub Icons 的 npm 包为 MIT，覆盖大量 AI/LLM 品牌；后续新增优先用 `@lobehub/icons-static-svg` 接现有 `<img src>` 管线，React 包 `@lobehub/icons` 需先做适配层，UIED SVG 作为补充来源。

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
- detected scan 只在本机 PATH 存在时进入设置页，不能把静态候选误报为“已安装”。
- protocol='acp' 或 `hasCliRuntimeSendAdapter(runtime)` 为 true 才进入聊天 runtime picker；其余 native/subscription 显示 needs_adapter。
- fail_cli/fail_acp/needs_adapter 分级。
- model/effort 透传。
- 附件硬拒绝。
- 进程 dispose。

真实 Goose / Hermes / OpenCode / Custom ACP 只能做 opt-in smoke，不进入默认 CI。Codex/Claude/Grok/Antigravity 的 one-shot adapter 可做本机手动验收；Qwen/Pi/Cursor Agent/OpenClaw 等未接 native/subscription adapter 前只能检测和展示，不能承诺已可发送。
