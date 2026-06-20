# 23 · CLI Runtime 重做规格

> 状态日期：2026-06-20
> 当前 `app/` 已重置为干净 craft-agents-oss 基座。本文只保留上一轮验证出的产品规格和实现边界，不再把旧代码视为当前实现。

## 目标

CLI Runtime Host 是新基座的第一批重做能力：让用户在同一个 craft session 里选择本机 CLI/ACP runtime 发送消息，并把输出、权限、错误、停止、诊断全部写回现有 timeline。

它不是第二套聊天系统，也不是独立终端页。它必须接 craft 现有 `SessionManager`、permission、RPC、renderer event flow 和配置系统。

## 第一版必须支持

- **Custom ACP runtime**：用户可配置 `command/args/env`，用于接入任意本机 ACP stdio runtime。
- **Detected mapping**：只给已确认稳定 ACP/stdio 入口的工具做一键映射。
  - Grok Build：`grok agent stdio`
  - Hermes：`hermes acp`
  - OpenCode：`opencode acp`
  - Gemini CLI：候选为 `gemini --acp`，接入前必须重新确认官方入口和本机行为。
- **Unsupported detected**：Codex/Claude/Qwen 等未确认 ACP 入口时不能假执行，只能返回中文可操作错误。
- **健康测试分级**：`available`、`fail_cli`、`fail_acp`、`disabled`，并保留阶段、原因、stdout/stderr tail。
- **设置页边界**：
  - managed runtime 不可删除、禁用或改启动参数。
  - detected runtime 不可改 command/args/env，但可测试、禁用、删除。
  - custom runtime 可完整编辑。
- **发送契约**：
  - 未选择 CLI 时继续走 API 模型路径。
  - 已选择 CLI 时走本机 ACP adapter。
  - `modelId=auto` 不下发；具体 `modelId` 才下发。
  - `reasoningEffort` 只允许白名单值。
- **附件第一版硬拒绝**：选择 CLI Runtime 后，任何附件都拒绝，提示移除附件或切回 API 模型。
- **进程清理**：停止、错误、窗口关闭、session 结束都要清理子进程。

## 参考实现边界

优先看这些来源，但不要直接照搬旧 app 代码：

- craft-agents-oss：session、permission、RPC、renderer event flow。
- AionUi（绿灯）：ACP/custom agent、进程生命周期、team/skill 注入模式。
- open-design（绿灯）：runtime definitions、prompt transport、stream parser 思路。
- Grok/Hermes/OpenCode/Gemini：只黑盒验证命令入口，不复制源码。

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
- detected mapping 成功解析。
- unsupported detected 返回中文错误。
- fail_cli/fail_acp 分级。
- model/effort 透传。
- 附件硬拒绝。
- 进程 dispose。

真实 Grok/Hermes/OpenCode/Gemini 只能做 opt-in smoke，不进入默认 CI。
