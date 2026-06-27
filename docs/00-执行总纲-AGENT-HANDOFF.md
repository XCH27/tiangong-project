# 00 · 当前执行总纲

> 状态日期：2026-06-27
> 当前分支：`work/fresh-base-spine`
> 口径：只把当前分支已经存在并可验证的代码算作完成。其它 worktree、旧分支和 Agent 汇报只算候选资产。
> **状态唯一真相**：模块级完成度见 `docs/32`；本文是事实摘要 + 执行优先级，不维护第二份长状态表。

## 1 · 当前代码事实

当前 `app/` 是干净的 craft-agents-oss 二开基座。已经落在当前分支的 Fleet 主干能力包括：

- `DesignAction`、`DesignPatch`、`ActorRef` 等共享协议。
- `DesignEngine` 的基础服务接口与实现。
> **2026-06-27：Wave 0 + Wave 1 已合入主线**（`work/fresh-base-spine`）：S1 内部动作注册表承重墙、S3 会话列表团队化 UI、S5 管理 Agent 全局专栏、S6 分层记忆增强（含输入建议接线）、S7 CLI native adapter、S8 `@`/`/` 输入迁移、S10 External Job 模型均已逐项核验并提交。验收口径：`typecheck:all` + `fleet-verify` 通过，相关目标单测通过；Electron 视觉/真实 CLI/真实外站仍需本机手工验收。未提交候选能力：oss-sync v0.10.4、人类交互终端 PTY、Git RPC（见 `docs/32 §8.1`）。

- 团队编排后端 ✅ 已落主线：team rules、TeamCoordinator、事件持久化、投递/运行分离、收件箱、Agent session 工具；**身份双写已收敛到 craft 原标签系统**（`LabelConfig` 扩展 + session labels 派生 + `setSessionLabels` 队长唯一性，见 `docs/33` §0）。
- 任务进度 Progress ✅ 已落主线：`protocol/progress.ts` + `set_session_progress` 工具 + `SessionManager.setSessionProgress` + RPC + JSONL 持久化字段 + 会话顶部 Progress 卡 + 会话行 N/M 小药丸。剩余：团队 rollup UI、本机视觉验收。见 `docs/35`。
- CLI Runtime + ACP/native 发送 ✅ 已落主线：catalog/health/RPC/协议 + `services/acp/`（JSON-RPC 客户端/runtime session/stdio transport/host，mock-transport 单测）+ Codex/Claude/Grok/Antigravity one-shot adapter + 会话级 runtime/model 选择 + JSONL 持久化 + `sendMessage` 路由 + 附件硬拒绝 + 进程清理 + 设置页（CLI 列表/Custom 表单可用）。见 `docs/23`/`docs/24`。剩余：usage/额度采样、真实 CLI smoke、Claude 等 CLI 的 reasoning flag 实机确认。
- CLI / 模型选择器 UI ✅ 已按 `docs/36` 收口：输入框底部拆为 CLI / 模型 / Token 三按钮；CLI 模式显示“模型由 CLI 管理”，不伪造模型列表；Token 环 API/CLI 诚实分级。剩余：本机 Electron 视觉验收。
- D19 API/CLI 分离与跨 Runtime 编排是**目标架构**，不是当前已落代码：当前聊天 CLI picker 和底部终端卡片保留；TeamRun、Fleet Bridge、RuntimeLauncherAdapter、WorkspaceFileLeaseManager、terminal surface 一等面板尚未实现。详见 `docs/38-API-CLI分离与跨Runtime团队编排.md`。
- 管理 Agent 分级自动决策 L0-L3 ✅ 已落主线：`decideAuto` 引擎 + 两个接入点（`TeamCoordinator.enforcePermission` + 中央 `requestWorkflowPermission`）+ `managerDecision` RPC + 设置页（模型配置：跟随工作区或固定 API 连接/模型/推理强度；自动决策开关/L2 规则增删）。S5 已补“所有会话”层专栏、右下角 mini 入口和退出行为设置；首次发送创建 hidden craft session，注入管理 Agent 专用系统提示词，仍走原 `onSendMessage`/permission/timeline。见 `docs/17 §4`。剩余：真正跨工作区单一全局 session、更多结构化管理动作。
- 分层记忆 ✅ 已落主线（后端 + 设置页 + 输入建议）：7 分区/4 层 + scopeId 隔离 + `memory` RPC + 独立 `MemorySettingsPage`；S6 已补全局/工作区存储拆分、TF-IDF + 3-gram 语义检索、episodic 时间衰减、turn 事实抽取、管理决策依据注入、snippet/suggestion 服务；`MemoryInputSuggestions`/`useMemoryInputSuggestions` 已在 `FreeFormInput` 接线。见 `docs/05`。剩余：向量库/更稳健抽取、归档 UI、L3 清空/导出确认。
- 前端剩余（最小 UI，需本机视觉验收，**挂点见 `docs/00A` + 下表**）：会话列表团队化 UI、`@`/`/` 输入收口、管理 Agent 专栏、CLI 三按钮、Progress 卡、Token 环、记忆输入建议条均已落主线。仍需本机视觉验收和真实 CLI/外站 smoke。
- craft 原有的 session、permission、timeline、BrowserPane/CDP、文件工具和标注能力。
- 智能模型路由 + Fusion + 分层缓存 ✅ **已落主线**（commit `362d02b1`）：`model-orchestrator`/`fusion-pipeline`/`fusion-cache`/`semantic-cache`/`session-routing-bridge` + `SessionManager.sendMessage` Auto 分支 + 设置页 + 输入框 Auto + timeline 组件（`ModelRoutingEvent`/`CacheLedgerEvent`）。**主线已实现**：mini 二段判官、语义缓存磁盘、RouteLLM 磁盘、Plan Fusion + verification hooks、cascade 文本/工具信号、偏好 accepted/retried/switched/rolled_back、git HEAD 精确缓存失效。**仍缺**：`context-shaper` 实接 rtk/codegraph（骨架已合入，sidecar 调用待接）、A2/A3 Fusion/Auto 实跑 smoke。
> 验证口径（2026-06-27）：`typecheck:all` + `fleet-verify` 在 S3/S5/S6/S7/S8/S10 合入后通过；目标单测覆盖 S1/S6/S7/S8/S10。仍需单独补本机 Electron 视觉验收、真实 CLI 登录 smoke、真实外站审查 smoke。

以下能力即使曾在其它工作树完成，也**尚未算当前分支完成**：全部文件/Library 写操作、无限画布、AIGC UI、网页/文档工作面、视频剪辑、上下文效率 UI、外部审查 UI、能力装载商城（S13）、Git 审查 UI 接线、Fleet 自有发布源。

**已提交主线（2026-06-27，commit `362d02b1`）**——以下能力已合入主线：

| 能力 | 文件 | 状态 |
|---|---|---|
| 上游软分叉同步 v0.10.4 | `app/scripts/oss-sync.ts`、`.oss-sync-state.json` | ✅ 已提交；待 A2 视觉验收 |
| 人类交互终端 PTY | `interactive-terminal-ipc.ts`、`BottomTerminalPanel.tsx`、xterm | ✅ 已提交；待 A2 视觉验收 |
| Git 审查 | ✅ 已落主线 | `git-review-service` + RPC + `GitReviewPanel` + `GitHubSettingsPage`；已提交，待 A2 视觉 smoke |
| 工作面模块壳 / Tool Dock | ✅ 已落主线 | `CraftModulePanel` + `ResizablePanelGroup` + `workbench-layout` + `tool-dock-config`；规范见 `docs/37` §0/§6 |
| 智能模型路由 + Fusion | ✅ 已落主线 | 见 §1 路由条目；已提交 `362d02b1` |
| 本机 CLI 并行子 agent | `scripts/cli-subagents.sh` | ✅ 已提交；Claude `deepseek-v4-pro`、Grok `grok-build`/`grok-composer-2.5-fast`、Antigravity `Gemini 3.5 Flash (High)` |

迁入前必须逐项核对 diff、许可证、测试和当前架构。

## 2 · 当前最高优先级

按 `docs/32 §8` 详细计划执行。摘要：

1. ~~**合入未提交主线能力**（A1）~~ ✅ 已完成（commit `362d02b1`，含 oss-sync v0.10.4 / 终端 PTY / Git RPC / 路由 Fusion / workbench）。
2. **本机视觉验收（A2）**：按 `docs/32 §8.2` 清单逐项；自动化不能替代。
3. **真实 CLI smoke（A3）**：Codex/Claude one-shot 各 1 次 + Auto/Fusion API 路径 smoke。
4. **开 Wave 2（Phase C）**：S2 网页·文档 + S13 能力装载（Lead 先冻 `protocol/capability.ts`）。
5. **发布与更新**：`electron-builder.yml` 换 Fleet 发布源（GitHub Releases 或自建 generic）；保留 craft `electron-updater` 客户端链路。
6. **上游维护**：`源码参考/update_repos.sh` → `oss:sync --review` → `oss:sync` → typecheck；见 `docs/09`。

完成这条脊柱后，按 `docs/32` 继续推进创作工作面与外部任务桥。

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
| `09` | craft 基座 prep（过程性） | **已复活**：上游软分叉同步说明 + baseline 记录，见 `docs/09-craft-base-prep.md` |
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
