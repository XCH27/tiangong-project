# 24 · CLI Runtime 验收清单

> 状态日期：2026-06-20（验收矩阵）；进度更新 2026-06-23。
> 用途：CLI Runtime 在干净 craft 基座上重做完成后，用本文做验收。

## 0 · 当前进度（2026-06-23 · ✅ 已落主线）

**已完成（后端基座 + ACP 发送 + 原模型选择器 + 顶部快捷入口）**

- `CliRuntimeCatalog`：detected 映射只保留已确认 stdio ACP 入口（当前默认 Goose），并先做本机 PATH 过滤，避免把静态候选误报为“已识别”；Claude Code / Codex 不再伪装成 ACP，后续需 native adapter；custom CRUD（增/改/启停/删）+ 落盘 `~/.craft-agent/.fleet/cli-runtimes.json` + 编辑边界（managed 不可改删、detected 不可改 command 可禁删、custom 全可编辑）。
- health test：`cli-runtime-health` spawn 探测 + 纯函数 `classifyHealthFromProbe`（available/fail_cli/fail_acp）。
- RPC：`cliRuntimes` list/get/addCustom/updateCustom/setEnabled/delete/test。
- 协议：`protocol/cli-runtime.ts`（含 unsupported 中文错误、附件 none、effort 白名单、归一化流事件 `CliRuntimeStreamEvent`）。
- **ACP 协议层**（`services/acp/`）：`AcpConnection`（JSON-RPC 2.0 over ndjson：request/response 关联、notification、agent 反向 request、跨分片重组、非 JSON 行忽略）；`AcpRuntimeSession`（initialize→session/new→session/prompt→流式 session/update 归一化→stopReason；session/request_permission→craft permission；cancel；dispose）；`acp-stdio-transport`（spawn + 子进程清理）；`CliRuntimeHost`（每 craft session 复用 ACP 进程、换 runtime 重建、dispose）。**有 mock-transport 单测**（`acp.test.ts`/`cli-runtime-host.test.ts`，无需真实 CLI）。
- **会话级 runtime/model 选择**：session `cliRuntimeId` / `cliRuntimeModelId` + `setCliRuntime` / `setCliRuntimeModel` 命令 + RPC + `cli_runtime_changed` / `cli_runtime_models_changed` 事件。
- **动态模型发现与切换**：ACP `session/new` 的 `configOptions` / `models` 归一化为 `CliRuntimeModelState`；切换优先 `session/set_config_option`，兼容 `session/set_model`；不暴露模型时显示“模型由 CLI 管理”。
  - ⚠️ **复审备注（best-effort，非标准 ACP）**：核心 ACP 规范并未标准化模型切换；`session/set_model` 与 `configOptions/session/set_config_option` 是对不同 runtime 的**推测性扩展**。当前实现对不支持的 runtime **安全降级**为“模型由 CLI 管理”（`canSwitch=false`），不会误发命令。真实 ACP runtime 是否暴露模型切换能力，必须 opt-in smoke 实机确认；确认前不要把“可切换模型”当作已支持能力对用户承诺。
- **会话级选择持久化**：`StoredSession` / `SessionHeader` / `SESSION_PERSISTENT_FIELDS` 已显式加入 `cliRuntimeId` / `cliRuntimeModelId`，重启后应保留所选 runtime/model；`progress-cli-runtime-persistence.test.ts` 覆盖 JSONL round-trip。
- **发送路由**：`SessionManager.sendMessage` 在 `cliRuntimeId` 时走 `runCliRuntimeTurn` → ACP，归一化事件复用 craft `text_delta`/`text_complete`/`complete` 管线（不重造）。
- **聊天选择器**：已按 `docs/36` 拆成输入框底部三个独立按钮（CLI / 模型 / Token 环），并删除顶部重复入口。CLI 按钮只选运行方式，模型按钮只选当前运行方式下的模型，避免双勾错乱。
- **设置页入口**：Settings 增加 `本机 CLI` 页面，显示 runtime 列表、启停、测试、命令摘要，并支持 Custom runtime 新增/编辑/删除（displayName/command/args/env）。
- **附件硬拒绝**（docs/25）：选了 runtime + 带附件 → 抛中文可操作错误，不启动进程。
- **进程清理**：cancel（session/cancel 取消当前轮）、deleteSession、cleanup(disposeAll) 都清理子进程。

**未完成（下一步）**

- Custom runtime 高级校验（重复 command/args 提醒、敏感 env 脱敏提示）。
- usage/额度采样适配器：把 CLI/API 的上下文占用、套餐额度、真实/估算/未知写入统一账本。
- 真实 Goose / Custom ACP 的 opt-in smoke（需本机安装 + 登录）；Claude Code / Codex native adapter 另做。

**验证记录（2026-06-23，本环境）**

| 项 | 结果 |
|---|---|
| `typecheck:shared` | ✅ 通过 |
| server-core typecheck | ✅ 通过 |
| session-tools-core typecheck | ✅ 通过 |
| electron typecheck | ✅ 通过 |
| `git diff --check` | ✅ 干净 |
| `acp.test.ts` / `cli-runtime-host.test.ts` | ✅ 已跑，14 pass |
| `cli-runtime-catalog.test.ts` / `progress.test.ts` / `progress-cli-runtime-persistence.test.ts` | ✅ 已跑，16 pass |

> 注：ACP 协议层单测使用 mock transport，不依赖真实 CLI；真实收发仍需 opt-in smoke。

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
| Claude Code | 不作为 ACP detected 出现在选择器；后续 native adapter 应走 `claude --print --output-format stream-json ...` |
| Codex | 不作为 ACP detected 出现在选择器；后续 native adapter 应走 `codex exec ...` |
| Goose | 本机 PATH 上存在 `goose` 时才出现在 CLI 选择器；选择后发送纯文本，使用 `goose acp` |
| Custom ACP | 新增 custom runtime，测试通过后发送纯文本，command/args/env 由 catalog 透传 |
| CLI 动态模型 | runtime 暴露 `configOptions/models` 时，输入框模型菜单显示 CLI 模型，选择后发送前调用 `session/set_config_option` 或 `session/set_model` |
| Runtime 管理模型 | runtime 不暴露模型清单时，输入框显示“模型由 CLI 管理”，不伪造模型列表 |
| 切回 API | 在模型菜单选择 API 模型后，清空 `cliRuntimeId`，后续发送回 API 路径 |
| fail_cli | command 不存在或不可执行，设置页和聊天错误显示“CLI 启动失败” |
| fail_acp | command 可启动但不是 ACP 协议，显示“ACP 握手失败” |
| disabled runtime | 禁用后聊天选择器不可直接选择 |
| unsupported detected | Claude/Codex/Grok/Hermes/OpenCode/Gemini/Qwen 等未确认 Fleet stdio ACP 入口的工具不假识别为 detected；如需 ACP 接入，走 Custom ACP runtime |
| 附件 | 选择 CLI Runtime 且存在附件时拒绝发送 |
| model/effort | 具体 CLI 模型按 runtime 能力切换；effort 只发送白名单值；不支持的运行时返回可操作错误 |
| 停止/关闭 | 停止发送、关闭窗口或 session 结束后子进程被清理 |

## Opt-in Smoke

真实 CLI 依赖用户本机登录态和安装路径，只能手动开启。

```bash
FLEET_GOOSE_SMOKE=1 GOOSE_BIN=/path/to/goose ./scripts/craft.sh test packages/server-core/src/services/cli-runtime-goose-smoke.test.ts
```

smoke 默认必须 skip，不能因为用户未安装真实 CLI 阻塞普通 CI。
