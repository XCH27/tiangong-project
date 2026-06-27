# 38 · API/CLI 分离与跨 Runtime 团队编排

> 状态日期：2026-06-27
> 对应决策：D19 API/CLI 分离与跨 Runtime 编排（见 `docs/04-产品决策记录.md`）。
> 定位：定义 Fleet 如何把轻量 API harness、外部 CLI harness、管理 Agent、项目 Agent 和软件内工作面放进同一条可授权、可回放的生产流程。本文是混合 Runtime 编排的目标架构，不替代 `docs/38-内部结构化能力与Agent-native优化主线.md`（两者编号不冲突：本文文件名带后缀 `-API-CLI分离与跨Runtime团队编排`，后者文件名带后缀 `-内部结构化能力与Agent-native优化主线`）。

## 0 · 状态边界

本文件写的是 D19 的目标架构和落地顺序。必须区分当前事实与目标状态：

| 项 | 当前代码事实 | D19 目标 |
|---|---|---|
| 普通对话 CLI picker | 已有输入框 CLI / 模型 / Token 三按钮，见 `docs/36` | 迁移完成后普通对话只走 API；CLI 从 terminal surface 创建 |
| 终端 | 已有 `Cmd+J` 底部终端卡片（`isBottomTerminalVisible`），状态见 `docs/37` | 终端升级为一等面板，可多开、进 grid、与 API 队员并排 |
| TeamRun / Fleet Bridge | 未实现，只是协议目标 | CLI 队长通过 Bridge 发起受控 TeamRun 调 API 队员 |
| RuntimeLauncherAdapter | 未实现，只是协议目标 | 每种外部 CLI 有明确 launcher/bridge 注入策略 |
| WorkspaceFileLeaseManager | 未实现，只是协议目标 | 文件写入先拿租约，冲突进入 blocked，不并发踩文件 |

后续实现或验收时，不得把本文的目标状态写成"已落主线"。状态口径继续用 `usable / wired but not visually checked / display-only / not implemented`。

## 1 · 总路线

> Fleet owns the team, CLI owns a run.

团队、身份、任务、权限、状态、timeline、成本账本和回放永远归 Fleet。CLI 只拥有某一次执行 run 的上下文和 harness。

- **API harness**：默认普通对话、管理 Agent、队长控制 lane、软件内工作面、Internal Action、Auto/Fusion/缓存、成本账本。
- **CLI harness**：高强度编码、repo 理解、命令执行、测试修复、长程 coding loop。Fleet 不自研 Claude Code 克隆，只做 adapter / bridge / permission / timeline / lease / report。
- **统一脊柱**：所有结果回到 craft session、permission、actor、agentId、role、runtime、timeline、成本和回放。

## 2 · 核心概念

| 概念 | 归属 | 作用 |
|---|---|---|
| `AgentSeat` | Fleet | 稳定身份：队长、代码、设计、审查、测试。不是 runtime，不是会话 |
| `RuntimeLane` | Fleet 管理，runtime 执行 | API lane / CLI lane / terminal lane。一个 seat 可绑定多个 lane |
| `TeamRun` | Fleet | 一次跨成员执行任务，含 runId、状态、权限链、租约、成本、报告 |
| `FleetBridge` | Fleet | 暴露给 CLI lane 的受控工具层，不让外部 CLI 直接碰 Fleet 内部真相 |
| `RunReport` | Fleet | 给调用方的压缩报告，引用证据，不回完整成员会话 |
| `RuntimeLauncherAdapter` | Fleet | 每种 CLI 的启动、环境、Bridge/MCP 注入、清理策略 |
| `WorkspaceFileLeaseManager` | Fleet | 写文件/Git 操作的轻量租约和冲突阻断 |

队长不是 CLI。队长是 `AgentSeat`；CLI 只是队长当前用于编码的 harness lane。队长规划、分派、验收优先走 API control lane；队长亲自编码走 CLI harness lane。

## 3 · Surface 分离

目标是 surface 级分离：

- `surface = 'chat'`：普通对话，默认只走 API 路径。
- `surface = 'terminal'`：CLI/PTY/外部 harness 会话，绑定 `cliRuntimeId` / `cliRuntimeModelId`。
- 管理 Agent：固定 cheap API，永不 CLI。

迁移期允许当前聊天 CLI picker 保留，但必须在文档和 UI 上标为"当前实现"。当 terminal surface 和一等终端面板可用后，再把普通对话的 CLI picker 下线或改成"在终端中打开"入口。

## 4 · Fleet Bridge：对内异步，对外同步

外部原装 CLI 多数只理解"调用工具并同步等待返回"。不能假设 Claude Code、Goose、Codex 等黑盒 harness 会主动写轮询循环。因此 Bridge 必须采用：

> 对内异步 TeamRun，对外同步阻塞桥。

### 4.1 固定工具集

不要动态生成 `fleet_invoke_member_G02` 之类成员工具。CLI lane 只看到固定工具集：

| 工具 | 作用 |
|---|---|
| `fleet.get_team` | 返回当前团队花名册、seat、lane、状态、loadout 摘要 |
| `fleet.propose_member_run` | 提议 TeamRun，不立即执行；Fleet 投影建议卡给人或 API 队长确认 |
| `fleet.start_member_run` | 发起受控 TeamRun；Bridge 可同步等待完成或返回 pending report |
| `fleet.get_run_status` | 查询 run 状态，供支持轮询的 CLI 使用 |
| `fleet.get_run_report` | 取压缩 RunReport |
| `fleet.cancel_run` | 取消仍在运行或等待确认的 TeamRun |
| `fleet.send_team_message` | 给成员/团队发消息，复用 `docs/33` 投递语义 |
| `fleet.invoke_internal_action` | 仅限只读或 L0/L1 Internal Action；L2+ 默认必须走 TeamRun 或 permission |

### 4.2 同步阻塞桥

`fleet.start_member_run` 的外部工具调用默认进入 blocking await：

1. Bridge 收到工具调用，创建 `TeamRun`，写 timeline。
2. Core 后台异步调度 API 队员、权限、loadout、租约和执行。
3. Bridge 保持工具调用挂起，默认 `maxBlockMs = 180000`。
4. TeamRun 完成时，Bridge 返回压缩 `RunReport`。
5. 人类拒绝权限时，Bridge 返回 `USER_PERMISSION_DENIED_FINAL`，CLI 必须停止该分支。
6. 超时但任务仍在跑时，Bridge 返回 `RUN_TIMEOUT_PENDING_REPORT`，包含 `runId / status / progress / evidenceRefs`，让 CLI 释放当前 tool call。
7. 如果 CLI 支持轮询，可继续调用 `fleet.get_run_status` / `fleet.get_run_report`；不支持也不会卡死。

这让外部 CLI 以为自己调用了同步工具，但 Fleet 内部仍是异步、可暂停、可授权、可恢复的 TeamRun。

### 4.3 RunReport 边界

API 队员不把完整会话、长 stdout、长 diff、长思考塞回 CLI。只返回：

```json
{
  "runId": "run_123",
  "status": "completed",
  "summary": "完成按钮样式和交互动效调整",
  "changedFiles": ["src/Button.tsx"],
  "diffSummary": "新增 hover 状态和 loading 样式",
  "evidenceRefs": ["timeline_event_9", "screenshot_1"],
  "requiresLeaderAction": "请运行 npm test",
  "cost": { "real": 0, "estimated": 1200, "unknown": 0 }
}
```

完整细节留在成员 session 抽屉；群聊 timeline 只显示任务卡、权限卡、报告卡和证据引用。

## 5 · TeamRun 后端契约

### 5.1 状态机

```text
proposed
  -> approved
  -> queued
  -> running
  -> blocked_waiting_for_permission
  -> blocked_waiting_for_user
  -> blocked_waiting_for_lease
  -> completed
  -> failed
  -> cancelled
  -> timeout_pending_report
```

每个状态变化都写 session event，带 `runId / agentSeatId / runtimeLaneId / attributionChain / evidenceRefs`。

### 5.2 后端日常问题

| 问题 | 处理 |
|---|---|
| 重复工具调用 | `idempotencyKey` 去重；同一 CLI tool call 不创建多个 run |
| 应用重启 | 未完成 run 恢复为 `blocked_waiting_for_user` 或 `failed_recoverable`，不静默继续写 |
| 取消 | 用户、调用者、目标成员都可请求取消；取消写 timeline 并清理子进程/租约 |
| 进程崩溃 | 记录 stderr tail、exit code、runtime、launcher adapter、cwd、环境摘要 |
| 长时间无输出 | 转 `blocked_waiting_for_user` 或 `timeout_pending_report`，前端显式提示 |
| 成本归因 | 分 `LOCAL_COMPUTE`、`BYOK_API`、`FLEET_CLOUD`，真实/估算/未知分开 |

## 6 · 权限与 attributionChain

权限卡必须显示完整链路，而不是只显示目标队员：

```text
user -> G-01 leader / cli:codex -> fleet.start_member_run -> G-02 designer / api -> canvas.edit
```

错误码必须结构化：

| 错误码 | 含义 | 调用方行为 |
|---|---|---|
| `USER_PERMISSION_DENIED_FINAL` | 人拒绝，不可重试 | 停止该分支 |
| `RUN_TIMEOUT_PENDING_REPORT` | Bridge 等待超时但 run 未结束 | 释放 tool call，保留 runId |
| `RUN_BLOCKED_PENDING_USER` | 需要人工输入/确认 | 不重试，等待 UI |
| `MEMBER_BUSY` | 目标成员已有 run | 排队或换队员 |
| `CAPABILITY_NOT_LOADED` | 目标 loadout 缺能力 | 提示装载，不自动安装 |
| `WORKSPACE_WRITE_LOCKED` | 写租约冲突 | 等待、排队或改 shadow worktree |
| `BRIDGE_UNAVAILABLE` | 当前 CLI 未挂 Fleet Bridge | 降级为普通 CLI，不能调团队 |
| `MCP_LAUNCH_FAILED` | Bridge MCP/stdio 启动失败 | 返回诊断，前端提示修复 |

Fleet 对同一 attributionChain 的重复 L2/L3 请求做冷却，防止外部 CLI 自动重试造成弹窗循环。

## 7 · WorkspaceFileLeaseManager

第一版不做全量沙箱，但必须有轻量租约：

| 字段 | 说明 |
|---|---|
| `leaseId` | 租约 ID |
| `ownerRunId` | 持有者 TeamRun 或 CLI run |
| `ownerSeatId` | 持有者 AgentSeat |
| `targets` | 文件路径、目录、glob、`.git` 写锁或 `workspace:*` 粗粒度锁 |
| `mode` | `read` / `write` / `git_write` |
| `ttlMs` | 防止崩溃后永久占用 |
| `reason` | 展示给用户的原因 |

规则：

- API 队员写代码文件前必须声明 `writeTargets`。
- 目标不明的 API 写操作默认拒绝或要求人确认。
- 外部 CLI harness 正在编码且无法精确声明文件时，Fleet 可给它 `workspace:*` 或 repo 粗粒度租约。
- 租约冲突不直接崩溃；目标 run 进入 `blocked_waiting_for_lease`，timeline 显示"G-02 正在等待 G-01 释放 `src/Button.tsx`"。
- Git mutate 统一拿 `.git` 写锁；并发 Git 写操作直接拒绝或排队。
- 后续再做 shadow worktree、自动 merge 和 patch apply；第一版只做租约 + 冲突拒绝。

## 8 · RuntimeLauncherAdapter

"挂 MCP Bridge"不能停留在口号。每种 CLI 的启动方式、配置注入和清理都不一样，Core 必须有 `RuntimeLauncherAdapter`。

### 8.1 Adapter 契约

每个 adapter 至少声明：

| 字段 | 说明 |
|---|---|
| `runtimeId` | `goose` / `codex` / `claude-code` / `agy` / custom |
| `launchMode` | `stdio-acp` / `one-shot` / `pty` / `unsupported` |
| `bridgeInjection` | `mcp-config` / `env` / `args` / `not-supported` |
| `configWriteScope` | `temp-session` / `workspace-local` / `user-global-requires-permission` |
| `cleanup` | 退出时删除临时 config、token、localhost bridge |
| `diagnostics` | 版本、路径、登录态、stderr tail、配置冲突 |

### 8.2 注入原则

- 优先临时 session 配置或 workspace-local 配置。
- 不静默改用户全局 CLI 配置；必须写全局配置时走 L2/L3 permission，并能回滚。
- Fleet Bridge MCP 使用 loopback 地址 + 短期 token，只在当前 workspace/session scope 可用。
- adapter 启动失败时，CLI 仍可作为普通终端使用，但 lane 标 `BRIDGE_UNAVAILABLE`，不能调用团队工具。
- 远端 workspace 默认不启用本机 Bridge；所有 CLI/PTY/MCP 注入都标 `LOCAL_ONLY`。

### 8.3 Adapter 矩阵

| Runtime | 第一版策略 |
|---|---|
| Custom ACP / Goose ACP / OpenCode ACP / Hermes ACP | 走 stdio ACP；若 runtime 支持 MCP 参数或配置，注入临时 Bridge；否则标 `bridge_unavailable` |
| Codex / Claude Code / Grok / Antigravity | 先保持 one-shot/PTY adapter；Bridge 注入按各自官方参数、env 或配置机制单独实现 |
| Qwen / Pi / Cursor Agent / OpenClaw | 检测与诊断可见；未接 adapter 前不能承诺可发送或可挂 Bridge |
| 不支持 Bridge 的 CLI | 可作为普通 terminal/coding lane；不能调 API 队员 |

具体命令行、配置文件路径和版本差异必须由 adapter 探测得出，不在 UI 或文档里硬编码成不可变事实。

## 9 · Skill / MCP / 模型差异

不同 runtime 的 Skill、MCP、模型不强行统一。统一的是 Capability Catalog 和 loadout：

| 能力类型 | 处理 |
|---|---|
| Fleet Internal Action | 最高优先；人和 Agent 共用同一 action id，详见 `docs/40` |
| Fleet Skill | 声明所需 internal action / MCP / CLI / runtime capability |
| CLI native skill | 作为 runtime capability 记录，只在该 CLI lane 可用 |
| MCP server | 按 workspace/session scope 隔离启动；由 RuntimeLauncherAdapter 注入 |
| API tool | 只给 API lane；CLI 通过 FleetBridge 间接调用 |
| 模型 | API lane 走 `docs/03` 模型路由；CLI lane 走 CLI 自带模型，Fleet 不猜模型名 |

## 10 · 前端表达

| 前端问题 | 要求 |
|---|---|
| 会话列表 | 显示 AgentSeat 和 lane badge：`G-01 队长 · API 控制 / Codex CLI 执行中` |
| 普通对话 | 目标态不出现 CLI runtime picker；迁移期明确标注当前实现 |
| 终端 | 当前底部卡片保留；目标升级为一等面板，可多开、进 grid |
| TeamRun 卡片 | 群聊 timeline 显示"谁通过哪个 lane 指派谁做什么" |
| 权限卡 | 展示 attributionChain、风险等级、写目标、成本来源 |
| 成员抽屉 | 展示 API 队员完整执行细节、diff、证据、回滚 |
| PTY 挂起 | 检测 stdin 等待时自动高亮并露出终端，不静默卡死 |
| 错误展示 | 显示结构化错误码、原因、下一步动作；不只显示 generic error |

## 11 · 环境与诊断

所有本机能力统一走 System Tools / Project Environment registry，不允许各模块私自探测 PATH。

必须记录：

- CLI binary 路径、版本、来源、登录态摘要。
- shell、cwd、PATH 差异、项目 override。
- MCP Bridge 端口、token scope、启动日志、关闭状态。
- adapter 选择原因、配置写入范围、清理结果。
- smoke 是否 opt-in；真实 CLI 未安装不得阻塞默认 CI。

安装 CLI、修改 PATH、写配置、改全局 MCP 设置、运行修复命令都必须走 permission + timeline。

## 12 · 工具调用边界

- 结构化 Bridge 是主路径；自然语言解析"让 G-02 做什么"只能作为人工辅助，不作为默认自动执行机制。
- Bridge 工具不可绕过 Fleet permission、loadout、租约和成本账本。
- L2/L3 Internal Action 不直接暴露给 CLI lane；必须通过 TeamRun、permission 或预授权规则。
- 工具调用结果不得把 secret、完整 stdout、完整成员会话原样塞回外部 CLI；用 evidence ref 指向 Fleet 内部证据。

## 13 · 落地顺序

| 阶段 | 目标 | 动作 |
|---|---|---|
| P0 协议冻结 | Lead 冻结共享契约 | `AgentSeat` / `RuntimeLane` / `TeamRun` / `RunReport` / `attributionChain` / 错误码类型定义（`shared/protocol/team-run.ts`）；不接 UI |
| P1 环境与 launcher | RuntimeLauncherAdapter + 诊断 | 不先做 UI 假按钮；先证明 Bridge 可被注入或明确 unavailable |
| P2 Bridge propose | CLI 可 `get_team` + `propose_member_run` | 只出建议卡，不自动执行 |
| P3 Bridge start | 同步阻塞桥 + 异步 TeamRun | API 队员执行并回压缩 RunReport |
| P4 Lease | WorkspaceFileLeaseManager | 文件/Git 写冲突进入 blocked |
| P5 终端一等面板 | surface 迁移 | 普通对话 API-only，CLI 从 terminal surface 创建 |
| P6 增强 | shadow worktree / 自动合并 / 并行 run | P0-P5 绿后再做 |

## 14 · 反模式

| 禁止 | 应做 |
|---|---|
| 终端变成第二套 team/session | CLI run 只是 AgentSeat 的 RuntimeLane，真相回 Fleet Spine |
| 把 API 队员当普通同步 MCP 工具 | 外部同步阻塞，内部异步 TeamRun |
| 要求黑盒 CLI 自己轮询 | Bridge 负责 blocking await + timeout pending report |
| 强行统一 Skill/MCP 世界 | 统一 Capability Catalog + loadout，按 lane 裁剪 |
| 静默改外部 CLI 全局配置 | RuntimeLauncherAdapter + permission + cleanup |
| 无租约并发写文件 | WorkspaceFileLeaseManager 先阻断冲突 |
| 管理 Agent 走 CLI | 管理 Agent 固定 cheap API，永不 CLI |
| 普通对话混 CLI 终端会话 | 目标态 surface 级分离：chat = API，terminal = CLI |

## 15 · 与现有文档的关系

- `docs/04`：D19 产品决策。
- `docs/01`：M0 增加 RuntimeLane / TeamRun 协议冻结。
- `docs/17`：项目 Agent 体系增加 RuntimeLane 与跨 Runtime 编排。
- `docs/23`：CLI Runtime 规格补充 surface 迁移边界。
- `docs/33`：团队脊柱增加 TeamRun 协议摘要（§10 仅放概念表和工具集列表，详细契约见本文）。
- `docs/37`：终端从底部卡片迁移为一等面板的目标状态。
- `docs/38-内部结构化能力与Agent-native优化主线.md`：仍是 Internal Action / agent-native 方向，不被本文替代。
- `docs/40` / `docs/43`：Internal Action 与 Capability Loadout 是本文 Bridge/loadout 的能力基础。