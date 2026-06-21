# 00 · 当前执行总纲（Agent Handoff）

> 状态日期：2026-06-21
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

## 2 · 当前完成标注（2026-06-21）

以下状态以本机实际 worktree / 测试为准，不按 agent 口头汇报判断。

| 工作 | 分支 / 路径 | 状态 | 已验证 | 合并备注 |
|---|---|---|---|---|
| **T-ENGINE + T-EVENT-ACTOR** | `work/integration-prep` · `/Users/lullwen/.config/superpowers/worktrees/GUI 终端/integration-prep` | **已集成**：至 `85e615fa`；DOM writer 分流后续补入 | DesignEngine / persistence / annotation / DOM / workbench applier / BrowserPane DOM writer / Artifact writer 目标测试通过；shared/server-core/electron typecheck 已通过；`git diff --check` 通过 | 主线承重墙：`DesignAction/DesignPatch/ActorRef`、`RPC_CHANNELS.design`、`design_*` 事件、`SessionManager.emitSessionEvent`、tool/text actor、底部 `ActionTickerBar` 已落地；选区和 patch 已落盘；Agent 发起写动作默认 `pending`，未授权不能 commit；`annotate` action 复用 craft 现有 `AnnotationV1` 写入/回滚；`set_style` / `set_transform` / 文本替换已能生成可回滚 DOM/Artifact patch，并由 Workbench applier 路由；BrowserPane DOM writer 已接入现有 BrowserPane `evaluate`，可对带 `browserPaneId` 的选区实际 apply/revert；Artifact DOM writer 和 surface 分流已就绪，等待 renderer editable preview evaluator 接入。 |
| **T-SYSTOOLS** | `work/integration-prep` | **已集成**：`af96e047` + `602f4255` | server-core services：随整组通过；shared/server-core/electron typecheck 通过；`git diff --check` 通过 | 只读系统工具 / 项目环境探测 + 设置页；已修正登录 shell PATH 测试和无效项目路径诊断；`fleet-project-pack` 已作为 app-bundled context capability 注册进统一 registry。 |
| **T-PROJECTPACK / 外部审查数据层** | `work/integration-prep` | **已集成** | ProjectPack、review prompt、external review report 目标测试通过；routing/channel-map/ipc 通过；shared/server-core/electron typecheck 通过 | 本地打包、secret scan、token 估算、dry-run、审查提示词 RPC 已完成；外部审查原始输出、结构化 findings、bundle hash、平台和独立成本口径可本地归档并通过 LOCAL_ONLY RPC 读写。仍不自动登录、不自动外发。 |
| **T-USAGE** | `work/integration-prep` | **已集成**：`a97eb7dd` + UI `d306262f` | usage 测试随 services 整组通过；electron/shared/ui typecheck 通过；`git diff --check` 通过 | 真实 token / 估算 / 未知成本分离；当前会话 Usage Ledger 已挂入上下文效率设置页。 |
| **T-CLI Runtime** | `work/integration-prep` | **已集成**：`ff39566a` + 发送入口 `072ea88a`；productize 补丁后续补入 | CLI Runtime 测试随 services 整组通过；shared/server-core/electron typecheck 通过；`git diff --check` 通过 | Grok/Hermes/OpenCode detected mapping、custom ACP、health、model/effort、unsupported detected 状态、可操作错误文案、SessionManager CLI 发送分支已接；附件策略为小文本允许、二进制/图片/PDF/office/audio/base64 拒绝；聊天输入选择器/最终产品化仍待接 Stage/Conversation UI。 |
| **Stage / Inspector / Browser 第一闭环** | `work/integration-prep` | **已集成**：`ff120bb0` 至 `8c91a2f8` + `f7e2fc4f` + `02b82633` | route/panel-stack 测试、IPC/routing 测试、BrowserPane dock 与批量选区目标测试、annotation evidence 测试通过；electron/shared/server-core typecheck 通过；`git diff --check` 通过；Electron 实机确认 BrowserView 位于 Stage 且切换模式后释放 | `stage/{mode}` 正式 route、右侧 Inspector、Usage Ledger、ProjectPack 已接；现有 BrowserPane 三个原生 BrowserView 可停靠 Stage，保持登录态/CDP/Agent 工具链；从会话进入 Stage 后可启动网页元素选择并写入统一 DesignSelection；后端已支持矩形/视口批量元素选择；选区→`AnnotationV1` 证据构造器已放入 shared protocol，后续 UI 直接复用 `sessions:command addAnnotation`。批量标注按钮和 Comment AI 仍待接。 |
| **Context Center / Review Center** | `work/integration-prep` | **已集成**：`5dc1b9a3` + `1246a571` + `c4e2c119` + `097412f2`；手动审查闭环已合入 | context/service/RPC/UI 目标测试通过；renderer helper、routing/ipc/channel-map 测试通过；shared/server-core/electron typecheck 通过；`git diff --check` 通过 | 后端：rtk/codegraph adapter、ProjectPack delta planner、外部审查 job 状态机、job 完成时本地保存 report 并回填 `reportId`、CLI Runtime 文本附件 policy + LOCAL_ONLY RPC。UI：`ContextEfficiencyPanel` 四段式工作流（Overview / Pack / Optimize / Review），`ExternalReviewCenterPanel` 支持 bundle → 生成 prompt → 手动复制 → 粘贴保存 report → 同 bundleId 多平台归档；三口径分开展示（Fleet token 真实=0 / 外部成本未知 / ProjectPack token 估算）；仍不自动登录、不自动上传、不读 cookies、不绕平台限制。 |
| **Agent Registry M0** | `work/integration-prep` | **已集成**：`d5e5f03d` + `433a67a4` + `08f5edc3` | AgentRegistry service 测试、IPC/routing/channel-map 测试通过；shared/server-core/electron typecheck 通过 | 增加 `agents:list/get`、内存 registry、稳定 `manager:<workspaceId>` 与 `project:<sessionId>` actor；普通 API 与 CLI Runtime 工具事件开始带稳定 `agentId/role/displayName/runtime`；manager agent 支持稳定 upsert、空 workspace 归一化和 `lastActiveAt`；补齐 session 查询和 malformed input guard；不建第二套 session/store/process registry。 |
| **Agent Lifecycle / Memory / Decision** | `work/integration-prep` | **已集成**：service + RPC + 本地持久化；DesignAction 决策事件已接 | agent-lifecycle / memory-service / decision-service 目标测试通过；routing/ipc/channel-map 测试通过；shared/server-core/electron typecheck 通过 | 增加 Agent 生命周期状态机、七分区本地 MemoryService、L0-L3 DecisionService + audit；已接 LOCAL_ONLY RPC 和本地持久化。DesignAction 提案会发 `decision_evaluated` 事件并进入 ActionTicker，记录 level/outcome/ruleRef/auditId。仍未接 UI 和 permission 自动代答；不替代 craft session/permission。 |

**当前集成线**：`work/integration-prep` 已把 T-ENGINE、T-SYSTOOLS、T-PROJECTPACK、T-USAGE、T-CLI Runtime、Stage / Inspector 第一刀合到同一基线。后续不要再从旧服务 worktree 二次合并同一批改动；继续在集成线或从它分出新工作。

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

1. **已完成并集成**：`DesignAction / DesignPatch / ActorRef` 契约、DesignEngine 状态机、`design_*` SessionEvent、`decision_evaluated` 决策事件、稳定 Agent actor、底部 Action Ticker、System Tools、ProjectPack、Usage Ledger、ContextCenter 只读总览、CLI Runtime 后端与发送分支、Stage route/panel/Inspector 第一刀、Agent 生命周期/记忆/自动决策 service + RPC + 本地持久化 MVP。
2. **已完成第一闭环**：BrowserPane 原生 docked Stage + 单元素选择 + 后端批量元素选择；复用 craft BrowserPane/CDP，选区写入原会话的 DesignEngine / SessionEvent。
3. **已完成 action 后端接线**：`annotate` 可提交到 `DesignAnnotationApplier`，复用 `AnnotationV1` 写入和回滚；`set_style` / `set_transform` / 文本替换已能通过 DOM/Artifact patch applier 生成 forward/inverse 并由 Workbench applier 路由；BrowserPane DOM writer 已接现有 BrowserPane `evaluate`，带 `browserPaneId` 的选区可实际写入和回滚；Artifact writer 接口和 surface 分流已就绪，缺 renderer editable preview evaluator；Agent 写动作先进入 `pending`，没有授权标记不能 commit。
4. **下一刀**：浏览器 toolbar 的批量标注 / Comment AI / 保存证据入口接真实 action；随后把 renderer editable preview evaluator 接到 Artifact writer。
5. **仍未完成**：聊天输入里的 CLI Runtime 选择器最终产品化、Artifact 真实 writer、permission UI 卡片、外部审查浏览器提交/自动回收（本地 job 状态、报告归一化、存储和 job→report 完成闭环已完成）。

M1 起（open-design Artifact Studio、ProjectPack 接审查中心、Agent process registry）和 M2/M3（字体颜色、外部审查、记忆、Fusion、多账号、Figma/Stitch）见 `docs/01`。

## 7 · 当前必须坚持的口径

- 新 session 默认走 API 模型，不自动启用 CLI Runtime。
- 浏览器标注是设计工作流入口，必须支持框选、多选、批量注释，并作为 Open Design / Figma / Stitch 打通的第一块画布。
- Artifact Studio 必须是 agent-native 可共同编辑面，AI 和人类共用 `DesignAction -> DesignPatch -> SessionEvent`。
- 字体、颜色、动画属于网站/APP/PPT/商品页编辑的基础能力，应进入 DesignAction、资源库和 Artifact Studio 早期切片。
- 上下文效率中心要覆盖 ProjectPack、MarkItDown 转换、rtk/codegraph/Reasonix/Headroom 组合优化、外部 AI 网站审查和透明用量报告。
