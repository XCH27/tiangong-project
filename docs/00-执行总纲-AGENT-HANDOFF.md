# 00 · 当前执行总纲（Agent Handoff）

> 状态日期：2026-06-20
> 当前基线：`app/` 已重置为干净 craft-agents-oss 基座；旧二开代码不再作为实现来源。后续按 `docs/19-重启二开与可复用资产清单.md` 重做少量确认有价值的能力。

## 1 · 当前主线

Fleet 当前不再以旧 `app/` 的实现状态作为基线。第一批仍优先重做 **终端 / 本机 CLI Runtime Host**，但必须在干净 craft 基座上重新接入：

- CLI 探测和 Runtime Catalog。
- ACP stdio client / adapter / process registry。
- permission、timeline、错误诊断和停止/清理。
- 聊天区选择、运行态、model/effort、附件边界和设置页管理。

当前可执行 runtime：

- Grok Build：`grok agent stdio`
- Hermes：`hermes acp`
- OpenCode：`opencode acp`
- Custom catalog runtime：用户配置 `command/args/env`

继续 unsupported：

- Codex：当前只确认 `codex mcp-server`，MCP 不等于 ACP。
- Claude：无稳定 ACP/stdio 入口。
- Qwen：未确认 Fleet 当前可消费的 stdio ACP；公开 `qwen serve` / ACP 生态需要进一步 adapter 设计。

CLI Runtime 之外，设计工作流要在新基座重新落地：`WorkbenchShell`、`DesignAction/Patch`、BrowserPane docked Stage、Inspector/Context、Action Ticker 和 Usage/Context Report。旧 UI 形态不迁移；只保留能力边界和测试思路。整条路线见 **`docs/01-产品主干与落地序列.md`**；重做边界见 **`docs/19-重启二开与可复用资产清单.md`**。

贯穿全程的 craft 原始哲学：这个软件本身也是给 AI 操作和编辑的。人类 UI 与 AI 工具必须提交同一套 `DesignAction`，经 `DesignPatch` 写入同一个 session timeline、permission、diff、rollback。接手者动代码前先看 craft 的 `SessionManager`、session tools、`browser_tool`、annotation、permission、file diff/config 写入模式。

## 2 · 当前完成标注（2026-06-20）

以下状态以本机实际 worktree / 测试为准，不按 agent 口头汇报判断。

| 工作 | 分支 / 路径 | 状态 | 已验证 | 合并备注 |
|---|---|---|---|---|
| **T-ENGINE + T-EVENT-ACTOR** | `work/t-engine-mainline` · `/Users/lullwen/.config/superpowers/worktrees/GUI 终端/t-engine-mainline` | **已提交** `a54bc62b`；状态文档 `a28d523f` | DesignEngine 测试 + channel-map + ipc-channels + routing：`23 pass / 0 fail`；shared/server-core/electron typecheck 通过；`git diff --check` 通过 | 主线承重墙：`DesignAction/DesignPatch/ActorRef`、`RPC_CHANNELS.design`、`design_*` 事件、`SessionManager.emitSessionEvent`、tool/text actor、底部 `ActionTickerBar` 已落地。 |
| **T-SYSTOOLS** | `work/t-systools` · `/Users/lullwen/.config/superpowers/worktrees/GUI 终端/t-systools` | **已提交** `064dc06c`，待主线统一合并 | 目标测试：`75 pass / 0 fail`；shared/server-core/electron typecheck 通过；`git diff --check` 通过 | 只读系统工具 / 项目环境探测；已修正登录 shell PATH 测试和无效项目路径诊断。 |
| **T-PROJECTPACK** | `T-PROJECTPACK` · `/Users/lullwen/Documents/GUI 终端-T-PROJECTPACK` | **已提交** `c3f910e1`，待主线统一合并 | ProjectPack 测试：`12 pass / 0 fail`；routing/channel-map/ipc：`15 pass / 0 fail`；shared/server-core/electron typecheck 通过；`git diff --check` 通过 | 已清除 `bun.lock` 噪音；已补目录越界保护；不外发、不上传。 |
| **T-USAGE** | `T-USAGE` · `/Users/lullwen/Documents/GUI 终端` | **已提交** `710ae059`，待主线统一合并 | usage 测试：`11 pass / 0 fail`；shared/server-core/electron typecheck 通过；`git diff --check` 通过 | 真实 token / 估算 / 未知成本分离；已修正 `client` 被误判 CLI、本缺失 inputTokens 时误算 0%、缓存 0 与未报告混淆。 |
| **T-CLI Runtime** | `work/t-cli-runtime-codex` · `/Users/lullwen/.config/superpowers/worktrees/GUI 终端/t-cli-runtime-codex` | **已提交** `140f3b76`，待主线统一合并 | CLI Runtime 测试：`25 pass / 0 fail`；shared/server-core/electron typecheck 通过；`git diff --check` 通过 | Grok/Hermes/OpenCode detected mapping、custom ACP、health、model/effort、附件硬拒绝已做；`session/new` 缺 `sessionId` 会明确失败。 |

**合并纪律**：上述服务分支都会碰 `channels.ts`、`routing.ts`、`channel-map.ts`、`types.ts`、`server-core/services/index.ts` 或 RPC registry。不要让各 agent 自己合并；等 `work/t-engine-mainline` 稳定后，由主线统一合并并逐项跑验证。

## 3 · 当前推进方式

- 默认由 Codex 单人主线推进，不再默认拆多个智能体互相审查。
- 不反复向用户确认；边界清楚时直接做一个用户可见产品闭环。
- 每次动手前先看绿灯项目或黑盒参考的相关做法，判断是否有更好的实现方式。
- 黑盒项目只能借鉴行为和命令输出，不能复制源码、测试、类型、样式、配置或结构。
- 不再保留过程性快照和流水记录；需要恢复点时用 Git 分支/提交。
- 每轮完成必须同步文档，否则后续接手会按过期口径继续犯错。

## 4 · 必读顺序

1. `AGENTS.md`（铁律）
2. `docs/04-产品决策记录.md`（决策真相）
3. `docs/01-产品主干与落地序列.md`（**路线主干 + M0–M3 排序，先懂主线再看专题**）
4. `docs/02-统一创作台与交互模型.md`（**产品定义 + 统一交互模型：是什么、三场景怎么共用一套 UI**）
5. `docs/19-重启二开与可复用资产清单.md`（**当前最关键：迁移资产与新基座重做项**）
6. `docs/24-CLI-Runtime-验收清单.md`
7. `docs/17-Agent协作与管理Agent模型.md`（管理 Agent / 项目 Agent / 自动决策）
8. `docs/18-统一界面信息架构与人机协作总设计.md`（目标态 UI）
9. `docs/16-上下文效率与外部AI审查方案.md`（审查中心）+ `docs/05-记忆系统方案.md`（分层记忆）
10. `docs/15-设计工作流一体化方案.md` + `docs/06-浏览器与网页标注方案.md`
11. `docs/26-源码参考使用规则与索引.md` + `docs/14-源码参考目录专项审计.md`（红绿灯）
12. 具体要改的 craft 模块源码

## 5 · 当前验证入口

默认验证不依赖真实 CLI 登录态：

```bash
./scripts/craft.sh test packages/shared/src/config/__tests__/session-drafts.test.ts
./scripts/craft.sh test apps/electron/src/renderer/components/cli-runtime/__tests__/cli-runtime-form-helpers.test.ts
./scripts/craft.sh test packages/server-core/src/services/cli-runtime-detected-acp-mappings.test.ts packages/server-core/src/services/cli-runtime-catalog.test.ts packages/server-core/src/handlers/rpc/cli-runtime.test.ts
./scripts/craft.sh test packages/server-core/src/services/cli-runtime-grok-smoke.test.ts packages/server-core/src/services/cli-runtime-hermes-smoke.test.ts packages/server-core/src/services/cli-runtime-opencode-smoke.test.ts
./scripts/craft.sh run typecheck:electron
./scripts/craft.sh run --filter @craft-agent/server-core typecheck
git diff --check
```

真实 CLI smoke 只能 opt-in：

- `FLEET_GROK_SMOKE=1`
- `FLEET_HERMES_SMOKE=1`
- `FLEET_OPENCODE_SMOKE=1`

## 6 · 下一步主线建议

当前主线已经从 R0 进入 M0 承重墙阶段：

1. **已完成**：`DesignAction / DesignPatch / ActorRef` 契约、DesignEngine 状态机、`design_*` SessionEvent、Agent tool/text actor、底部 Action Ticker 最小可见闭环。
2. **下一刀**：Stage / Inspector 第一刀。按 craft 原结构接 `PanelType`、`routes.view`、`MainContentPanel` 和现有 `RightSidebarPanel`；不要新建 `WorkbenchScaffold` 包住 `ChatPage`。
3. **随后**：BrowserPane docked Stage + 选择/框选/标注/Comment AI；这一步必须复用 craft BrowserPane/CDP/annotation，不换浏览器主栈。
4. **并行待合并**：System Tools、ProjectPack、Usage、CLI Runtime 后端切片，统一由主线合并。

M1 起（open-design Artifact Studio、ProjectPack 接审查中心、管理/项目 Agent registry）和 M2/M3（字体颜色、外部审查、记忆、Fusion、多账号、Figma/Stitch）见 `docs/01`。

## 7 · 当前必须坚持的口径

- 新 session 默认走 API 模型，不自动启用 CLI Runtime。
- 浏览器标注是设计工作流入口，必须支持框选、多选、批量注释，并作为 Open Design / Figma / Stitch 打通的第一块画布。
- Artifact Studio 必须是 agent-native 可共同编辑面，AI 和人类共用 `DesignAction -> DesignPatch -> SessionEvent`。
- 字体、颜色、动画属于网站/APP/PPT/商品页编辑的基础能力，应进入 DesignAction、资源库和 Artifact Studio 早期切片。
- 上下文效率中心要覆盖 ProjectPack、MarkItDown 转换、rtk/codegraph/Reasonix/Headroom 组合优化、外部 AI 网站审查和透明用量报告。
