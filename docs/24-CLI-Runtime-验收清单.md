# 24 · CLI Runtime 验收清单

> 状态日期：2026-06-20
> 用途：CLI Runtime 在干净 craft 基座上重做完成后，用本文做验收。

## 默认验证

从仓库根目录执行：

```bash
./scripts/craft.sh run typecheck:electron
./scripts/craft.sh run --filter @craft-agent/server-core typecheck
git diff --check
```

如果已补测试，还应执行对应单测：

- server-core CLI runtime service / adapter / catalog / RPC 测试。
- renderer settings/helper 测试。
- shared DTO/config 测试。

## 手工验收矩阵

| 场景 | 预期 |
|---|---|
| 未选择 CLI | 新 session 直接发送纯文本，继续走 API 模型路径，不启动本机 CLI |
| Grok Build | 选择 Grok Build 后发送纯文本，使用 `grok agent stdio` |
| Hermes | 选择 Hermes 后发送纯文本，使用 `hermes acp` |
| OpenCode | 选择 OpenCode 后发送纯文本，使用 `opencode acp` |
| Custom ACP | 新增 custom runtime，测试通过后发送纯文本，command/args/env 由 catalog 透传 |
| fail_cli | command 不存在或不可执行，设置页和聊天错误显示“CLI 启动失败” |
| fail_acp | command 可启动但不是 ACP 协议，显示“ACP 握手失败” |
| disabled runtime | 禁用后聊天选择器不可直接选择 |
| unsupported detected | Codex/Claude/Qwen 等未接入 runtime 不假执行，返回中文可操作错误 |
| 附件 | 选择 CLI Runtime 且存在附件时拒绝发送 |
| model/effort | `auto` 不下发；具体 modelId 和白名单 effort 透传 |
| 停止/关闭 | 停止发送、关闭窗口或 session 结束后子进程被清理 |

## Opt-in Smoke

真实 CLI 依赖用户本机登录态和安装路径，只能手动开启。

```bash
FLEET_GROK_SMOKE=1 GROK_BIN=/path/to/grok ./scripts/craft.sh test packages/server-core/src/services/cli-runtime-grok-smoke.test.ts
FLEET_HERMES_SMOKE=1 HERMES_BIN=/path/to/hermes ./scripts/craft.sh test packages/server-core/src/services/cli-runtime-hermes-smoke.test.ts
FLEET_OPENCODE_SMOKE=1 OPENCODE_BIN=/path/to/opencode ./scripts/craft.sh test packages/server-core/src/services/cli-runtime-opencode-smoke.test.ts
```

smoke 默认必须 skip，不能因为用户未安装真实 CLI 阻塞普通 CI。
