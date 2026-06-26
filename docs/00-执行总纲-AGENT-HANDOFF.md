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
- 管理 Agent 分级自动决策 L0-L3 ✅ 已落主线：`decideAuto` 引擎 + 两个接入点（`TeamCoordinator.enforcePermission` + 中央 `requestWorkflowPermission`）+ `managerDecision` RPC + **设置页（模型配置：跟随工作区或固定 API 连接/模型/推理强度；自动决策开关/L2 规则增删；记忆查看/增删，真接 RPC）**。右下角入口可发消息：首次发送创建 hidden craft session，按管理 Agent 模型配置填入 `llmConnection/model/thinkingLevel`，仍走原 `onSendMessage`/permission/timeline。见 `docs/17 §4`。剩余：专用 manager system prompt/tool 注入、记忆作决策依据注入、全局专栏完整对话 UI。
- 分层记忆 ✅ 已落主线（后端 + 设置页）：7 分区/4 层 + scopeId 隔离 + `memory` RPC + 管理 Agent 设置页内查看/增删。见 `docs/05`。剩余：全局共享分区、语义检索、衰减/归档。
- 前端剩余（最小 UI，需本机视觉验收，**挂点见 `docs/00A` + 下表**）：① 团队群聊置顶特殊会话项 ② Token 环点击的中文额度/上下文详情弹层（需先补 usage 后端）③ Progress 进度卡。管理 Agent 右下角悬浮入口已落 `ManagerAgentLauncher.tsx`，可用 hidden session 发消息；完整全局专栏/退出行为仍待做。
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

---

## 7 · 文档收束：闭环套件结构与迁移地图（进行中）

> 背景：当前文档横向堆叠（决策一份、路线一份、模块一份、审计一份），"唯一/单一真相"出现 30+ 次，模型为确认权威来源反复读多文件，增 token、易选错依据，也不利于多模型并行。收束原则（用户定）：**按"前后端功能套件的闭环"分文档**——每篇 = 一个能独立实现并前后端同步验证的闭环。

### 7.0 · 文档编号策略（稳定 ID + 墓碑，非连续序号）

> 决策：**文档编号是永久稳定 ID，不是连续序号**。删除/合并后的号**永不回收、永不平移**，空号即"墓碑"。
> 原因：全仓有 744+ 处 `docs/NN` 引用 + 83 处反引号号引用 + 大量 `NN §`/`DNN` 引用，且 `app/` 代码注释也引用文档号。物理重排序号要正确改写约 900 处引用，易静默损坏，且套件收束后还要再重排——收益为负。业界 ADR/RFC/PEP 同理：号是稳定标识，删了留洞不复用。
> 因此"序号不连续"是**有意为之、已登记**，不是缺陷。最终导航不靠连续号，而靠 **白皮书(WHY) + README 索引 + 追溯表 + 套件 ID（S1–S13 / 4 核心 / R1）**。

**墓碑表（已退役号 → 内容去向）**：

| 退役号 | 原标题 | 处置 |
|---|---|---|
| `08` | 本地化显示层与输入建议 | 汉化引擎/商城同步并入 `43 §6.2/6.3`；输入建议并入 `05 §6.1`；已删 |
| `09` | craft 基座 prep（过程性） | 过程快照，直接删除 |
| `10` | Fleet-Craft 功能缺口审计（过程性） | 过程快照，直接删除 |
| `13` | Markdown 文档审计与维护规则 | 维护规则并入 `README`，已删 |
| `34` | 多 Agent 并行执行手册与提示词 | 并行纪律并入本文 `§7.3` + `docs/32`，已删 |

新增文档优先复用墓碑空号（08/09/10/13/34）；**不得平移既有号。**

### 7.1 · 目标结构

**北极星 + 4 个全局核心**（横切，不属于单一闭环）：白皮书(WHY)、README 索引、产品总纲(01+02+18+30+00A)、决策日志(04+AGENTS.md)、执行队列(本文 00 + 32 状态 + 42 路线)。

**闭环套件**（每篇一个可验证闭环；状态来自当前分支代码核对）：S1–S13 + R1 源码参考。

### 7.2 · 执行顺序

1. **S1 先行** ✅ 已落主线（commit `9b95344a`）：注册表 + executor + permission 改造 + files 第一样板 + dto 事件类型修复。
2. **Wave 1 并行**（S1 已落，6 路可同时开）：S8/S3/S6/S7/S5/S10。
3. **Wave 2**（S1 验收后）：S2/S13。
4. **Wave 3**（S13 后）：S12。
5. **S9/S11** 等许可证绿灯（`docs/30 §12`）。

> **套件级"哪些能并行、按什么波次、谁拥有哪些文件"的完整计划见 `docs/32 §7`**。

### 7.3 · 收束执行纪律

- **逐套件迁移，仓库始终自洽**：每次只合并一个套件/全局核心，迁完内容→更新引用→**删除被吸收的旧文档**（git 留历史）。
- **删除即更新引用**：删任一文档前先 `rg -l "docs/<id>"` 全量改指，杜绝悬空链接。
- **删前必读**：候选文档多数携带独有规格内容，不可按"零散"误删；可删的只是内容已被吸收的旁路文档与过程性快照。删前必须先读、确认无独有内容、再迁移。
- 状态唯一真相在合并完成前仍是 `docs/32`。
