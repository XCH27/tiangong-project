# 00 · 当前执行总纲

> 状态日期：2026-06-22
> 当前分支：`work/fresh-base-spine`
> 口径：只把当前分支已经存在并可验证的代码算作完成。其它 worktree、旧分支和 Agent 汇报只算候选资产。

## 1 · 当前代码事实

当前 `app/` 是干净的 craft-agents-oss 二开基座。已经落在当前分支的 Fleet 主干能力包括：

- `DesignAction`、`DesignPatch`、`ActorRef` 等共享协议。
- `DesignEngine` 的基础服务接口与实现。
> **2026-06-23：本轮已提交主线**（`work/fresh-base-spine`）4 个 commit：`94f26416` 后端（团队收敛/Progress/CLI ACP/管理决策/记忆）、`2756b7dc` CLI 最小 UI、`28254ff6` 文档、`144bbefe` 管理 Agent 设置页。以下本轮项已由 🟡 候选升 **✅ 已落主线**；验收口径不变：typecheck 全过（shared/server-core/session-tools-core/electron），bun 单测在本机跑，Electron 视觉/重启手工验收仍待本机。

- 团队编排后端 ✅ 已落主线：team rules、TeamCoordinator、事件持久化、投递/运行分离、收件箱、Agent session 工具；**身份双写已收敛到 craft 原标签系统**（`LabelConfig` 扩展 + session labels 派生 + `setSessionLabels` 队长唯一性，见 `docs/33` §0）。
- 任务进度 Progress ✅ 已落主线（后端）：`protocol/progress.ts` + `set_session_progress` 工具 + `SessionManager.setSessionProgress` + RPC + JSONL 持久化字段 + round-trip 回归，见 `docs/35`。剩余：进度卡 UI、团队 rollup UI。
- CLI Runtime + ACP 发送 ✅ 已落主线（后端）：catalog/health/RPC/协议 + `services/acp/`（JSON-RPC 客户端/runtime session/stdio transport/host，mock-transport 单测）+ 会话级 runtime/model 选择 + JSONL 持久化 + `sendMessage` 路由 + 附件硬拒绝 + 进程清理 + 设置页（CLI 列表/Custom 表单可用）。见 `docs/23`/`docs/24`。
- ⚠️ **CLI / 模型选择器 UI 错乱，需按 `docs/36` 重做（不算已落地）**：commit `2756b7dc` 顶部栏+输入框各放一个运行方式选择器（重复），下拉把"运行方式/模型"两轴拍平成双勾。`docs/36` 给了正确交互。**只能本机起 Electron 视觉验收**。
- 管理 Agent 分级自动决策 L0-L3 ✅ 已落主线：`decideAuto` 引擎 + 两个接入点（`TeamCoordinator.enforcePermission` + 中央 `requestWorkflowPermission`）+ `managerDecision` RPC + **设置页（模型配置：跟随工作区或固定 API 连接/模型/推理强度；自动决策开关/L2 规则增删；记忆查看/增删，真接 RPC）**。见 `docs/17 §4`。剩余：模型配置接入真实管理对话/调度运行链路、记忆作决策依据注入、全局专栏完整对话 UI。
- 分层记忆 ✅ 已落主线（后端 + 设置页）：7 分区/4 层 + scopeId 隔离 + `memory` RPC + 管理 Agent 设置页内查看/增删。见 `docs/05`。剩余：全局共享分区、语义检索、衰减/归档。
- 前端剩余（最小 UI，需本机视觉验收，**挂点见 `docs/00A` + 下表**）：① 团队群聊置顶特殊会话项 ② Token 环点击的中文额度/上下文详情弹层（需先补 usage 后端）③ Progress 进度卡。管理 Agent 右下角悬浮入口已落 `ManagerAgentLauncher.tsx`，当前只打开已接后端的设置/记忆/决策页；真实管理对话后端未接前，输入保持禁用。
- craft 原有的 session、permission、timeline、BrowserPane/CDP、文件工具和标注能力。

- 管理 Agent 分级自动决策 L0-L3 🟡 候选/待合入（**未提交主线**）：`shared/protocol/manager-decision.ts` 纯引擎 `decideAuto` + `manager-decision-service`（设置落盘 + decide + `manager_auto_decision` 事件）+ 单测，typecheck 通过（含 electron），见 `docs/17 §4`。剩余：接 craft permission 的 escalate 调用点、记忆/偏好作依据、设置页与全局专栏 UI。

> 验证口径（2026-06-23）：shared / server-core / session-tools-core / electron typecheck 已通过；`git diff --check` 干净。已补跑并通过的目标 bun 单测包括 `progress.test.ts`、`progress-cli-runtime-persistence.test.ts`、`cli-runtime-catalog.test.ts`、`acp.test.ts`、`cli-runtime-host.test.ts`、`manager-decision*.test.ts`、团队与 session-tools 相关单测（合计 76 pass / 0 fail）。以上 🟡 项**均未提交** `work/fresh-base-spine`。

以下能力即使曾在其它工作树完成，也**尚未算当前分支完成**：CLI Runtime 产品化、完整管理 Agent 自动代理、分层记忆、全部文件/Library、无限画布、AIGC、网页/文档工作面、视频剪辑、上下文效率 UI、外部审查 UI。迁入前必须逐项核对 diff、许可证、测试和当前架构。

## 2 · 当前最高优先级

先补齐团队编排剩余前端与管理 Agent 自动代理，使后续多 Agent 能安全并行：

1. 把 `@` 改为人/Agent/会话/身份提及，把 Skill/命令/模板迁到 `/`，不保留旧 `@Skill` 双入口。
2. 先扩展原标签数据模型，再在原会话列表字段上显示模型/Runtime、稳定序号、身份和团队状态；不得先改布局或新建团队模块。
3. 接常驻管理 Agent 的可运行代理能力，但所有写入、外发、删除和发布仍走 permission 与 L0-L3 决策。
4. 保持团队群聊复用 craft session，不建第二套消息库。

完成这条脊柱后，按 `docs/32` 分派“全部文件/Library、创作工作面、外部任务桥”等互不冲突的任务。

## 3 · 产品主线

Fleet 是人类与 AI 共用的工作创作台。默认工作台与四个专业工作面共享同一套：

- 项目与本地文件；
- Library 素材层；
- Agent、身份、记忆和权限；
- session timeline、成本账本和导出记录；
- 结构化工具入口。

四个专业工作面是无限画布、AIGC 生成、网页/文档、视频剪辑。它们使用各自适合的原生文档模型和编辑引擎，不用一个万能 DOM patch 统一实现；真正统一的是 session、permission、actor、事件、工具动词和资产交接。

## 4 · 必读顺序

0. `docs/00A-UI改造红线与挂点地图.md`（改 UI / 加功能前的单页速查）
1. `AGENTS.md`
2. `docs/04-产品决策记录.md`
3. `docs/01-产品主干与落地序列.md`
4. `docs/30-架构重审与最优落地判断.md`
5. `docs/33-T-TEAM-SPINE-团队编排脊柱协议.md`
6. `docs/32-并行开发状态看板与工作令.md`
7. 与任务对应的专题文档和 craft 源码

## 5 · 完成与验收规则

- 文档中的 `✅` 只能表示当前分支已有代码或正式决策，不能表示旧工作树完成。
- Agent 交付必须提供 worktree、branch、commit、实际 diff、测试和未完成边界。
- 合入后再把 `docs/32` 状态改为完成。
- 前端页面、按钮、输入语法或工具变化必须同步 `AGENTS.md`、相关 `docs`、bundled docs、session tools 和 MCP Agent 说明。
- 不创建过程快照；使用 Git 分支和提交作为恢复点。

## 6 · 基础验证

```bash
./scripts/craft.sh run typecheck:all
git diff --check
```

功能任务还必须运行对应的目标测试；涉及 Electron 原生窗口、BrowserPane、文件权限或真实 CLI 的功能必须补本机手工验收。
