# 17 · Agent 协作与管理 Agent 模型

> 状态日期：2026-06-22
> 对应决策：**D11 双层 Agent 架构**、**D12 分级自动决策**（见 `docs/04-产品决策记录.md`）。
> 定位：定义 Fleet 的多 Agent 架构——一个常驻"管理 Agent"管软件本身，一套"项目 Agent"管具体执行；两者身份分离、共用一条 timeline、全程可授权可回放。它是 `docs/01` 主干第 4 块的展开。
> 边界：不新建第二套 session/记忆/权限真相。所有 Agent 编排都适配进 craft `SessionManager`、`SessionEvent`、permission、tool event；多 Agent 源码与模式优先迁 **AionUi**（Apache-2.0 绿灯，team/@提及/进程生命周期），按 `docs/22-AionUi-CLI-ACP-Skill-迁移要点.md` §4.1 的 A–E 批次。
> 当前分支状态：团队协议、TeamCoordinator、团队事件持久化、收件箱注入、Agent session 工具、会话列表顶部最小团队群聊入口和团队设置页已落入当前分支。管理 Agent 已有固定身份 `manager:global` 与每个 Workspace 的 hidden 投影锚点，并在团队设置页可见；它的用户对话入口尚未迁到“所有会话”全局专栏。lifecycle/memory/decision RPC、管理 Agent 自动代答和完整团队 UI 尚未落入当前分支。团队协议以 `docs/33` 为准；旧工作树实现只算候选资产。

---

## 1 · 为什么要分两层

craft-agents-oss 目前有 subagent，但没有成熟的"多 Agent 同场协作"。如果直接把多 Agent 做成"多个聊天气泡 / 多个并行 worker"，会立刻出现三个问题：状态分裂、上下文爆炸、谁做了什么说不清。

正确的结构是**两层身份分离**：

| 层 | 是谁 | 管什么 | 上下文足迹 |
|---|---|---|---|
| **管理 Agent**（常驻 · 软件管家） | 软件本身的管家，单一常驻身份 | 软件状态、记忆、设置、工作区、权限、上下文、任务入口、跨项目自动化 | **默认低**：只知道有哪些项目、各自阶段、用户长期偏好、可用能力；不读每个项目全部代码 |
| **项目 Agent**（按职责） | 队长 / 代码 / 设计 / 审查 / 测试 / 上下文 Agent | 具体项目的执行 | 按任务深入对应项目上下文 |

**关键纪律：管理 Agent 不和项目 Agent 混成一个身份。** 管理 Agent 可以调度、提供背景/记忆/偏好/权限判断，但它不是"每个任务都深度参与的 coding agent"。它平时不应无缘无故消耗大量上下文；只有用户明确要求，或某个项目 Agent 需要它提供背景时，它才进入更深的项目上下文。

管理 Agent 的用户对话也不属于单个工作区。它应该在“所有会话”层拥有自己的常驻专栏；每个 Workspace 的 hidden 投影只用于挂 timeline、权限证据和待审路由，不作为人类与管理 Agent 聊天的位置。

## 1.1 · LobeHub 给这一层的启发

LobeHub 不能作为源码来源，但它证明了一个产品判断：Agent 不应该只表现为"聊天里的模型"，而应该表现为**可管理的工作单元**。它的 Chief Agent Operator、Agent Builder、Agent Groups、Project、Workspace、Schedule、Pages、Personal Memory 和工作报告形态，和 Fleet 的双层 Agent 模型高度一致。

Fleet 吸收的是这些产品边界：

- **软件级管理者**：常驻管理 Agent 类似一个首席运营者，负责知道有哪些项目、哪些 Agent、哪些记忆、哪些工具和哪些权限策略。
- **任务组而不是聊天堆叠**：项目 Agent 要能组成 team，有队长、队员、审查、测试、上下文角色，而不是多个窗口各说各话。
- **项目 / 工作区 / 日程 / 页面**：项目是执行容器，工作区是组织边界，日程是自动化触发，页面是共享产物；这些概念应落到 craft workspace、session、timeline 和 artifact，不另建第二套真相。
- **白盒记忆**：管理 Agent 维护的长期记忆必须可见、可改、可删，不能变成黑箱。
- **报告和交付检查**：多 Agent 工作结果要变成可追踪报告，而不是只看最后一句"完成了"。

Fleet 不吸收的是 LobeHub 的代码、目录结构、组件、文案和样式。实现路线仍是：craft `SessionManager` / `SessionEvent` / permission / timeline + AionUi 的 team、process lifecycle、Skill 注入能力。

## 2 · 管理 Agent 的职责

管理 Agent 是"软件级"的，不是"项目级"的：

1. **软件状态与能力目录**：当前有哪些项目、每个项目大概阶段、有哪些可用 Agent / Runtime / 工具 / Skill / 记忆分区。
2. **记忆生命周期**：维护分层记忆的索引与生命周期（保留 / 归档 / 删除 / 提取成项目上下文）。详见 `docs/05`。管理 Agent 是记忆的**所有者**，项目 Agent 是**按需读取者**。
3. **设置与偏好**：用户长期偏好、重要判断、项目规则、权限策略——这些是它做自动决策的依据。
4. **任务入口与调度**：接收用户任务，判断该交给哪类项目 Agent，或是否需要先打包/审查/整理上下文。
5. **跨项目 / 跨平台自动化**：尤其是调用"上下文效率 / 审查中心"（`docs/16`）——见第 5 节。
6. **权限与上下文守门**：在自动决策模式下，按规则代答低风险请求、拒绝违规操作、提醒不要复制黑盒源码、把任务转给更合适的 Agent。

它**不做**：不替项目 Agent 写代码、不深读每个项目全部源码、不在没有触发时主动消耗大上下文、不成为绕过 craft permission 的特权身份。

## 2.1 · 信息隔离与上下文注入

管理 Agent 的默认原则是：**附庸的附庸不是我的附庸**。它负责软件级协调，但不能因为自己是最高层，就默认读取所有队员的完整会话。

具体规则：

- **有队长时**：管理 Agent 只读取队长摘要、队长请求、队长交付给管理 Agent 的报告；不默认读取队员完整消息。
- **无队长时**：管理 Agent 才读取普通 Agent 的摘要和待审报告，用来临时代理队长入口。
- **从下往上隔离**：队员看不到队长和管理 Agent 的内部协调记录；队长也看不到管理 Agent 的长期记忆、跨项目记录和用户全局偏好原文。
- **长期偏好 / 跨项目记录**：只能由管理 Agent 选择性注入项目上下文。人类可在团队设置页配置注入范围：关闭、只给队长、长期偏好给全体成员。
- **深读权限**：管理 Agent 要查看队员完整会话、文件细节或执行过程时，必须先走 permission，并把理由写入 timeline。

这样可以把“用户长期偏好”和“跨项目经验”变成可控的背景注入，而不是让每个项目 Agent 都直接读取全局记忆，避免上下文膨胀和信息越权。

## 3 · 项目 Agent 体系

真正做项目的是另一套 Agent，每个有独立 runtime、scope、permission profile、workspace/worktree：

| 角色 | 负责 | 典型 runtime |
|---|---|---|
| 队长（Leader） | 任务拆分、子任务分派、集成、确认门 | 强模型 / 内置 Fleet runtime |
| 代码 Agent | 实现、重构、修 bug | Claude/Codex/Grok 等 CLI 或 API |
| 设计 Agent | 浏览器标注、Artifact 编辑、DesignAction | 支持设计工具的 runtime |
| 审查 Agent | 代码审查、安全、回归、合并外部审查报告 | 审查向 runtime |
| 测试 Agent | 跑测试、验收、回归门禁 | — |
| 上下文 Agent | 打包、转换、压缩、检索、整理上下文 | 接审查中心 |

队长可以调度队员，但队长仍是"项目级"身份，与"软件级"的管理 Agent 分开。管理 Agent → 队长 → 队员，是三段不同身份，不是一个长链。

## 4 · 分级自动决策（D12）

默认情况下，涉及**权限、文件写入、运行命令、提交外部平台、删除记忆、修改项目方向**等关键动作，仍然问用户确认。当用户**主动开启自动决策**后，管理 Agent 可在低风险场景按记忆/偏好/规则/权限策略代替用户回复项目 Agent。

自动决策**必须分级**，不能变成"自动同意一切"：

| 等级 | 范围 | 默认 | 例子 |
|---|---|---|---|
| L0 只读建议 | 不改任何状态 | 自动可 | 整理上下文、给建议、归档记忆草稿、把外部审查结果转给项目负责人 |
| L1 低风险本地 | 本地、可回滚、符合用户偏好 | 开启自动决策后按偏好自动 | 同意已允许过的验证命令、选更符合偏好的技术路线、整理/归档记忆 |
| L2 写入/执行/外发 | 写文件、运行命令、发起外部审查 | 需**规则授权**或用户**预授权** | 按项目规则允许的 build/test 写入、已授权平台的审查提交 |
| L3 不可逆/敏感 | 删除、发布、付款、登录、提交敏感内容、改项目方向 | **必须明确确认** | 删记忆分区、git push、外发含密文件、切换账号登录 |

**对每个自动判断的硬要求**：有依据（引用哪条记忆/偏好/规则）、有记录（写 timeline）、可回放、可撤销、能说明为什么这么判断。拒绝类自动判断（如"拒绝违反绿灯规则的源码复制"）同样要留依据和记录。

自动决策**不能**：自动同意 L3、绕过 craft permission、在无依据时凭空代答、把"用户开了自动决策"理解成"无限授权"。

## 5 · 管理 Agent 驱动审查中心（跨项目自动化范例）

项目需要外部 AI 审查时，**不应让每个项目 Agent 自己处理浏览器、登录态、打包、上传、等待、整理**。应由管理 Agent 调用"上下文效率 / 审查中心"（`docs/16`）：

```
项目 Agent 请求审查
        │
        ▼
管理 Agent 调审查中心:
  1. 按规则打包项目(repomix式) + secret scan + 文件清单 + bundle hash
  2. 外发前权限卡: 目标平台·包大小·secret·成本·隐私 → (L2/L3 视内容定级)
  3. 提交到用户授权的多个外部 AI 网页/API
  4. 记录: 平台·时间·bundle hash·提交内容·成本·隐私风险·原始返回
  5. 归一化成结构化 ReviewReport
        │
        ▼
交回项目队长 Agent / 审查 Agent 继续处理
```

这样浏览器、登录态、打包、隐私守门只在管理 Agent 一处实现，项目 Agent 只管"提出需求"和"消费报告"。

## 6 · 怎么接进 craft（不另起第二套）

| Fleet 概念 | craft 落点 | 约束 |
|---|---|---|
| Agent 身份 | `SessionEvent` / permission request / tool event / 持久化都带 `agentId / runtime / role / displayName` | AGENTS 规则 15 |
| 管理 Agent ↔ 项目 Agent | 同一 `SessionManager`，用身份元数据与 surface 区分，不建第二套 conversation store | AGENTS 规则 13 |
| 任务分派 / team / @提及 | 迁 AionUi team/@提及模式，映射成 craft session + 身份元数据 | `docs/AionUi-*` §4.1 D 批次 |
| 进程生命周期 | 迁 AionUi `agent-process-registry` / `backend-launcher`（pid/process group、SIGTERM→SIGKILL、健康轮询、崩溃诊断） | `docs/AionUi-*` §4.1 B 批次 |
| 权限分组 | 按 Agent 分组展示：允许/拒绝/始终允许/停止该 Agent/停止全部 | 复用 craft permission，新增 agentId/role 分组 |
| 自动决策依据 | 读分层记忆（`docs/05`）+ preferences 中的规则/偏好/权限策略 | 写依据进 timeline |
| 记忆所有权 | 管理 Agent 维护索引/生命周期，写 craft session/config 真相 | `docs/05` |

本机能力（管理 Agent 的软件状态/记忆/跨项目自动化 RPC）默认 `LOCAL_ONLY`（AGENTS 规则 14）。

## 7 · 界面怎么展示多 Agent（不混流）

目标态布局见 `docs/18`。多 Agent 的可见性要求：

- **所有会话全局专栏**：管理 Agent（常驻，跨 Workspace）在所有会话层有自己的专栏；项目切换时仍是同一个软件管家。
- **NAV Rail "在工作的智能体"**：当前项目 Agent 名册；管理 Agent 可置顶显示状态，但不混成项目成员。
- **Actor 徽章**：每条动作/选区/消息标 `管理Agent` / `队长` / `代码Agent(runtime)`，多 Agent 用不同配色。
- **Action Ticker**：实时动作流按 actor 分流，点动作可跳转/回放；并发输出不混成单流。
- **权限卡**：高风险动作进 Conversation 审批，按 Agent 分组；自动决策代答的也要在 Ticker 显示"管理 Agent 已按规则 X 自动同意"。
- **视角切换**：Take control / Follow / Hand off —— 人可暂停某 Agent、让镜头跟随某 Agent、把当前 Stage 交给某 Agent 继续。

## 8 · 落地序列（挂在 `docs/01` 主干上）

多 Agent **不抢在主干前面**。顺序：

1. **M0 · 身份与团队协议**：先按 `docs/33` 建 team rules、actor、队长、成员、任务、消息和待审队列，再迁 AionUi 的进程生命周期 / Team / Skill 注入；不能引入第二套 session。
2. **M1–M2 · 队长 → 队员分派**：team/@提及映射成 craft session（AionUi D 批次），权限按 Agent 分组，输出带身份不混流。
3. **M2 · 管理 Agent 软件管家能力**：软件状态目录 + 记忆生命周期（接 `docs/05`）+ 驱动审查中心（接 `docs/16`）。
4. **M2 · 分级自动决策**：先做 L0/L1，依据来自记忆/偏好；L2 接规则授权；L3 永远明确确认。每步都要可回放。

**反模式**：多个 Agent 未审查就同时改同一批文件；把审查 Agent 当 worker；把黑盒源码交给 worker 迁移；管理 Agent 变成绕过 permission 的特权身份；自动决策无依据/无记录/不可撤销。

## 9 · 与现有文档的关系

- 当前默认仍是 **Codex 单人主线**（`AGENTS.md` 规则 10）；本文是**重新启用多 Agent 时的目标架构**，不改变"现在单人推进"的默认。
- 本文是产品内 Agent 模型的当前依据；工程执行入口以 `docs/00` 与 `docs/19` 为准。
- 主干排序见 `docs/01` 第 4 节与第 7 节。
