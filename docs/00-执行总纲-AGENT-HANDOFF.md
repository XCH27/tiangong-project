# 00 · 当前执行总纲

> 状态日期：2026-06-22
> 当前分支：`work/fresh-base-spine`
> 口径：只把当前分支已经存在并可验证的代码算作完成。其它 worktree、旧分支和 Agent 汇报只算候选资产。

## 1 · 当前代码事实

当前 `app/` 是干净的 craft-agents-oss 二开基座。已经落在当前分支的 Fleet 主干能力包括：

- `DesignAction`、`DesignPatch`、`ActorRef` 等共享协议。
- `DesignEngine` 的基础服务接口与实现。
- 团队编排后端：team rules、TeamCoordinator、团队事件持久化、投递/运行分离、收件箱注入和 Agent session 工具。**身份双写已收敛到 craft 原标签系统**（`LabelConfig` 扩展 + session labels 派生 + `setSessionLabels` 队长唯一性，typecheck 通过，见 `docs/33` §0 更新）。剩余：团队前端显示、CLI Runtime、管理 Agent 前端。
- 前端已恢复为干净 Craft 原界面；团队 UI 尚未开始。
- craft 原有的 session、permission、timeline、BrowserPane/CDP、文件工具和标注能力。
- 任务进度 Progress 后端 🟡 候选/待合入（**未提交主线**）：`protocol/progress.ts` + `set_session_progress` agent 工具 + `SessionManager.setSessionProgress` + RPC `setProgress` + `session.jsonl` 持久化字段与 round-trip 回归已补齐，typecheck 通过（含 electron），见 `docs/35`。剩余：进度卡、团队 rollup UI 和 Electron 重启手工验收。
- CLI Runtime 后端 + ACP 发送 + 最小 UI 🟡 候选/待合入（**未提交主线**）：基座（catalog/health/RPC/协议，Gemini 仅候选）+ ACP 链路（`services/acp/` JSON-RPC 客户端/runtime session/stdio transport/host，mock-transport 单测）+ 会话级 runtime/model 选择与 JSONL 持久化（`cliRuntimeId`/`cliRuntimeModelId`）+ `sendMessage` 路由（复用 craft text_delta/text_complete/complete）+ 附件硬拒绝 + 进程清理 + 原模型选择器 CLI 分组 + 顶部工作区后方 CLI 快捷入口 + 设置页“本机 CLI”列表/启停/测试/Custom runtime 表单。typecheck 通过（含 electron），见 `docs/23`/`docs/24`。剩余：Custom runtime 高级校验、usage/额度采样、真实 CLI smoke、reasoning effort 端到端实机确认。

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
