# 33 · T-TEAM-SPINE 团队编排脊柱协议

> 状态：团队消息、任务、汇报、待审与权限脊柱使用 craft `SessionManager`/timeline；团队 renderer 只改 Craft 原会话列表、聊天面板和输入框，不另建群聊页或消息库。
> **2026-06-24 更新：**身份唯一真相为 `labels/config.json` + session `labels`；队长标签确定队长会话，队长会话直接充当团队群聊锚点。人类输入无 `@` 走原 Craft 发送链路，等同跟队长聊天；`@全体成员` 才广播；`@G-编号` 由后端按当前 projection 定向投递；`team_*` 事件刷新原 transcript，Agent 消息显示只读身份标签栏。验证以当前分支的 `typecheck:electron` 与 `team-coordinator.test.ts` 为准。
> 目的：固定“会话即 Agent、队长、团队群聊、身份标签、状态、`@`/`/`、管理 Agent”的共同契约，让后端和 UI 可以并行开发而不产生第二套 session/team/permission。
> 参考：AionUi 可按绿灯范围迁 Team/进程生命周期；Warp 只黑盒学习 task/run、Agent 间消息、长任务 block 和失败信息。

## 0 · 复审修正（2026-06-22 · 权威，冲突处以本节为准）

对照 AionUi 团队机制与 Warp 任务运行态复审后，原设计基础正确（单一 session/timeline/permission 真相、规则文件不双写、队长会话承载团队群聊），但有 8 处会让 TeamCoordinator 返工的缺口，已修正并写入契约：

1. **投递 ≠ 运行（最核心）。** craft 没有现成的 “Agent mailbox / 给别的会话注入下一轮上下文” 之外的主动驱动。所以拆成两层：
   - **投递**：`sendTeamMessage` / 不带 `autoRun` 的 `assignTeamTask` = 把消息/任务**入队**到目标会话的「团队收件箱」（一次性 hidden 上下文，复用 craft 远程 handoff 的 “首轮注入” 机制）+ 写入团队会话 transcript。**不自动启动 agent**。权限 **L1**。idle 会话以未读角标呈现，等下一轮消费。
   - **运行（dispatch）**：带 `autoRun:true` 的 `assignTeamTask` = **立刻在 assignee 会话启动一轮执行**。启动 agent 运行是 **L2**，过 permission。
   - 契约落点：`assignTeamTask.autoRun?`、`team_message.delivery: 'queued'|'delivered'`（已改 `team.ts`）。
2. **管理 Agent 是软件级单一身份，不是每 workspace 一个不同 Agent。** 使用稳定 `agentId: manager:global`、共享用户/软件记忆和决策规则。它的用户对话入口不属于某个 workspace，而是在“所有会话”层有全局专栏；为了复用 craft 的 workspace-scoped SessionManager，每个 workspace 可有一个 `hidden` 投影锚点只挂 timeline、待审路由和权限证据。投影锚点不是新身份，也不是管理 Agent 的聊天位置。
3. **待审队列 = 派生态，不持久化。** `getReviewQueue(teamId)` 扫描状态= `statusMap.awaitingReview` 的成员会话，关联其最新 `team_report_submitted`，按报告时间排序；`team_review_queued` 仅作通知/回放事件，队列与 position 都是算出来的，不落第二份真相。
4. **v1 一个 workspace 一个团队。** `.fleet/team.rules.json` 单团队。删除 “其它 team 私聊” 多团队语义（移到地平线）。workspace = 项目 = 团队，简化协调与一致性维护。
5. **成员序号派生自 `createdAt`，不写 metadata。** craft `Session` 无自由 metadata 字段；`G-01/G-02` 按成员 `createdAt` 排名实时算（createdAt 不变所以稳定），前缀取文件夹首字母（可配）。不写 label、不双写。
6. **Agent 参与走 session 工具**（`get_team` / `send_team_message` / `assign_team_task` / `submit_team_report`），经同一条 `SessionCommand → permission → timeline`。v1 由 Coordinator 处理命令，工具只是调用它。
7. **事件锚点（为回放）：** 团队级事件（rules/leader/broadcast/validation_failed）落**团队会话** timeline（`conversationId===sessionId`）；成员级事件（task_assigned/report_submitted/identity_changed/review_queued）`sessionId`=成员会话、`conversationId`=团队会话——单条 SessionEvent 同时带两 id，UI 按 `sessionId` 看成员视图、按 `conversationId` 看群聊视图，**不重复发**。
8. **成员对账：** 收到 `session_deleted`/归档时，Coordinator 从成员引用中移除该会话；队长身份由会话原 `labels` 派生，不能在团队规则里再保存一份身份分配。

权限分级矩阵（Coordinator 必须按此判，详见 §8）：设置普通身份=L1；设置/取消队长身份、自动运行任务、修改身份权限配置或团队规范=L2；删除、发布、外发敏感数据=L3。管理 Agent 自动代答只限 L0/L1，永不自动 L2（无规则）/L3。

当前已落代码：

- `app/packages/shared/src/protocol/team.ts`
- `app/packages/shared/src/protocol/dto.ts` 中的 `SessionEvent | TeamSessionEvent` 与 `SessionCommand | TeamSessionCommand`
- `app/packages/shared/src/protocol/__tests__/team.test.ts`
- `app/packages/server-core/src/services/team-rules-service.ts`
- `app/packages/server-core/src/services/team-store.ts`
- `app/packages/server-core/src/services/team-coordinator.ts`
- `app/packages/server-core/src/handlers/rpc/team-rules.ts`
- `app/packages/server-core/src/handlers/rpc/team.ts`
- `app/packages/server-core/src/sessions/SessionManager.ts` 中团队事件持久化、收件箱注入、权限请求接线
- `app/packages/session-tools-core/src/handlers/team.ts`

新增上下文隔离字段已落到 `TeamRulesV1.managerContextPolicy`。默认值：长期偏好只注入队长、跨项目记录不注入、管理 Agent 深读成员上下文必须经过权限。管理 Agent 的消息入口仍需后续落到“所有会话”全局专栏，不能继续做成单个 workspace 的普通会话。

消息、任务、汇报、待审事件和默认状态映射已有实现；身份/队长路径复用原 `setLabels`，团队命令经 `sessions:command → TeamCoordinator` 写入 permission/timeline。渲染端只在原 Craft 会话行、聊天 transcript 和输入框增加派生展示与路由。

## 1 · 唯一真相与存储

- **会话与消息真相**：craft `SessionManager`、session persistence、`SessionEvent`。
- **权限真相**：craft permission；队长和管理 Agent 都不能绕过。
- **团队策略文件**：`<workspace>/.fleet/team.rules.json`。它只保存团队规则和稳定引用，不保存模型图标、运行状态、消息队列或完整成员副本。
- **团队群聊**：有队长时直接复用该队长的 craft session（`teamConversationSessionId === leaderSessionId`）。它仍在原 session store 中，不是第二套聊天系统，也不再在列表里复制一个“团队群聊”入口；无队长时只保留 hidden fallback，不对用户显示。
- **管理 Agent 全局专栏**：常驻管理 Agent 的用户对话位于“所有会话”层的专门栏，跨工作区存在；workspace hidden 投影只做内部锚点，不展示为普通会话，不承载用户对话。
- **成员运行态**：由成员 session metadata + Agent registry 派生。模型、Runtime、displayName、在线状态不能复制进规则文件形成双写。

### 1.1 · 团队 UI 的固定形态

团队能力只能改原 craft 会话界面，不能另加聊天条、悬浮控制台或第二个工作台。

**标签系统本身升级为身份标签，不新增第二套身份标签。** 原 `labels/config.json` 的每个标签增加可选的身份、提示词和权限字段；原 session `labels` 数组就是身份分配。没有“身份标签 + 功能标签”两套菜单，也没有 `team.rules.json.identityTags/identityAssignments`。没有身份能力的标签仍可用于整理、筛选和自动化。

1. **队长出现前**：列表仍是原来的会话列表。模型或 Runtime 图标只负责识别；原“标签”菜单仍是唯一标签入口。`队长`是原标签中的特殊身份，不能新增按钮、子菜单、团队条或控制台。
2. **队长出现后**：队长原会话直接升级为团队群聊；会话行保持 Craft 原样式，不额外插入重复的“团队群聊”项目，也不在列表里再放输入框或发送按钮。
3. **打开队长群聊后**：继续使用 craft 原聊天面板和统一输入框。它像真实团队群，只承载队长安排、成员汇报、成员提出的问题/意见、待审提醒和少量方向性摘要；它不是“所有成员会话全文合集”。
4. **摘要粒度**：群聊消息要短，目标是让人类快速判断“谁在做什么、完成了什么、哪里阻塞、项目方向是否正确”。完整思考过程、工具输出、长代码、长审查报告和成员原始对话都留在成员 session 或报告文件里，群聊只放可跳转引用。
5. **消息投影**：群聊里的每条 Agent 团队消息在正文前显示稳定编号和原身份标签栏；标签来自 session `labels` 的派生 projection，renderer 只读展示、不复制身份真相。
6. **可见性**：不带 `@` 的消息是队长普通聊天，保留原 Craft 发送链路；`@全体成员` 才广播，服务端投递给团队有效成员；`@G-01`/`@G-02` 是定向消息，编号由服务端按当前 projection 解析，不能只靠前端隐藏或由 renderer 保存成员 ID 映射。
7. **待审呈现**：成员进入 `awaitingReview` 时，群聊只插入一条待审简报卡，包含 `taskId/runId`、成员身份、报告摘要、风险/阻塞和源会话入口；不得复制成员完整聊天记录。
8. **状态**：原有会话状态词在团队模式下映射为“待安排 / 进行中 / 待审查 / 完成 / 取消”；列表排序仍以用户选定的原规则为准，稳定序号只按创建时间生成，不随最近消息变动。
9. **设置页**：复用原标签设置页，只为现有标签增加“用途 / 系统提示词 / 权限配置”字段。团队设置只保留状态映射、规范和管理 Agent 边界，不再维护身份定义或身份分配。

前端改动边界：只改现有字段的名称、值和徽章显示。原菜单层级、会话行结构、设置页骨架、聊天布局不变。`Priority` 的产品位置改为“队长”，`Project` 的产品位置改为派生的稳定“序号”；序号不可由用户手填，也不写入标签。

### 1.2 · 原标签扩展契约（新的单一真相）

```ts
interface LabelConfig {
  id: string
  name: string
  color?: EntityColor
  children?: LabelConfig[]
  valueType?: 'string' | 'number' | 'date' | 'link'
  autoRules?: AutoLabelRule[]
  kind?: 'functional' | 'identity'       // 省略时仍是普通功能标签
  systemPromptPreset?: string            // 会话启动/下一轮构建时注入
  permissionProfile?: string             // 引用 craft permission 配置，不内嵌第二套 ACL
}
```

- 身份定义：`labels/config.json`。
- 身份分配：session 原 `labels`。
- 身份提示词：按当前会话已应用的 identity 标签构建，记录标签 id 与配置 hash；不得在 renderer 临时拼接。
- 身份权限：只引用现有 permission profile；标签不能直接授予绕过 permission 的能力。
- 队长唯一性：给一个会话添加 `leader` 标签时，后端通过同一条 `setLabels → permission → timeline` 原子移除旧队长的 `leader` 标签，并把该队长会话设为团队群聊锚点。
- 稳定序号：由工作区前缀 + session `createdAt` 排名派生，仅显示，不存入标签。

## 2 · TeamRulesV1

```ts
interface TeamRulesV1 {
  version: 1
  teamId: string
  teamConversationSessionId: string
  leaderSessionId: string | null
  memberSessionIds: string[]
  statusMap: {
    unassigned: string
    active: string
    awaitingReview: string
    done: string
    cancelled: string
  }
  routing: {
    mentionPrefix: '@'
    commandPrefix: '/'
    defaultVisibility: 'broadcast'
  }
  taskPolicy: {
    requireTaskIdForAssignment: boolean
    requireRunIdForReport: boolean
    queueLatestStructuredReport: boolean
  }
  managerContextPolicy: {
    userPreferenceInjection: 'off' | 'leaderOnly' | 'allMembers'
    crossProjectRecordInjection: 'off' | 'leaderOnly'
    deepMemberContextRequiresPermission: boolean
  }
  norms: string[]
}
```

`leaderSessionId` 在下一次协议收口时也应改为派生字段；在完成迁移前只能作为加速缓存，必须与 session `leader` 标签核对，冲突时以标签为准。

默认 `statusMap` 映射到 craft 已有状态 ID：

| 团队语义 | 默认 status ID | 中文显示 |
|---|---|---|
| `unassigned` | `backlog` | 待安排 |
| `active` | `todo` | 进行中 |
| `awaitingReview` | `needs-review` | 待审查 |
| `done` | `done` | 完成 |
| `cancelled` | `cancelled` | 已取消 |

status ID 仍允许 workspace 自定义，因此后端必须通过 `statusMap` 和现有状态校验解析，不能再创造 `unassigned`/`active` 这一套持久化值。`app/packages/core` 中的下划线类型属于旧/不同层表示，不能据此改写 renderer 的动态 status ID。

规则文件的写入必须走 LOCAL_ONLY RPC、permission 和 timeline。直接手改文件允许，但加载时必须校验；失败时保留最后一次有效配置并发 `team_rules_validation_failed`，不能静默覆盖。

`managerContextPolicy` 控制管理 Agent 如何把软件级记忆注入项目：

| 字段 | 默认 | 含义 |
|---|---|---|
| `userPreferenceInjection` | `leaderOnly` | 用户长期偏好注入范围：关闭 / 只给队长 / 给全体成员 |
| `crossProjectRecordInjection` | `off` | 跨项目经验、风险和参考只能关闭或只给队长，不允许直接给全体成员 |
| `deepMemberContextRequiresPermission` | `true` | 管理 Agent 要看队员完整会话、文件细节或执行过程时必须先过 permission |

设置页必须提供这些开关；后端自动代理实现必须先读这个策略，不得默认把全局记忆塞给所有项目 Agent。

## 3 · 成员身份与稳定序号

- 每个普通 craft session 可成为一个项目 Agent；模型/Runtime 图标从 session connection/runtime 元数据派生。
- 队长是 `leaderSessionId` 指向的现有 session，不复制成新 Agent。
- 项目标识默认取文件夹首字母；也可按文件夹加入顺序分配 A/B/C。
- 成员序号按 `createdAt` 固定派生，例如 `G-01`、`G-02`。不写入 session metadata，不能随最近消息排序变化。
- 身份能力保存在原 `LabelConfig`；应用标签时记录标签 id 与配置 hash，真正提示词在 session 构建时注入，修改必须进 timeline。
- `modelIcon`、`runtime`、`displayName` 不进入 TeamRules，避免与 session/registry 双写。

## 4 · 团队事件

先在 `app/packages/shared/src/protocol/team.ts` 定义公共类型，再让 `dto.ts` 的 `SessionEvent` 引用。所有事件必须有 `sessionId`、`teamId`、`conversationId`、`actor: ActorRef`、`timestamp`；适用时带 `taskId`/`runId`。

| 事件 | 用途 |
|---|---|
| `team_rules_changed` | 规则、成员引用、身份分配或项目规范改变 |
| `team_leader_changed` | 提升/更换/清除队长 |
| `labels_changed` | 原会话标签变化；identity 标签变化也走这一事件 |
| `team_message` | 广播或私聊；用 `visibility` + `audienceSessionIds` 表达，不再另建 `team_private_message` |
| `team_task_assigned` | 队长/管理 Agent/人类创建或重新分派任务 |
| `team_report_submitted` | 队员提交结构化工作汇报 |
| `team_review_queued` | 报告进入队长或管理 Agent 的待审队列 |
| `team_rules_validation_failed` | 规则文件非法并回退到最后有效版本 |

`ActorRef` 当前只有 `user | agent`，因此自动排队使用稳定的管理 Agent actor（`agentId: manager:global`，并附当前 workspace 投影 session），不要凭空写 `kind: 'system'`。

## 5 · 团队消息与隐私

- 团队群聊内容存入 `teamConversationSessionId` 对应的 craft session；有队长时它就是 `leaderSessionId`。不带 `@` 的输入不走团队投递，直接作为队长会话普通消息发送。
- `@全体成员`：`visibility='broadcast'`，服务端把消息投递到全部有效成员的 Agent mailbox。
- `@G-01`：服务端解析为当前成员会话 ID，只把内容加入目标 Agent 上下文；其他项目 Agent 不得收到。
- 人类与常驻管理 Agent可按权限审计团队消息；“私聊”表示对其他项目 Agent 不可见，不承诺操作系统级加密。
- fanout 只保存消息引用/投递状态，不在每个成员 session 复制完整消息形成多份真相。
- 团队群聊 transcript 只存团队层消息和卡片引用；成员执行日志、完整对话和工具输出仍留在成员 session。群聊卡片必须通过 `sourceSessionId`、`taskId`、`runId`、`reportId` 找回来源。
- 后端写入群聊 transcript 前必须做摘要边界检查：任务安排、汇报、问题、意见、阻塞、待审卡可以进入；成员完整原话、长工具输出、长代码 diff、长文件内容默认不得进入，只能作为引用。
- `@` 定向命中成员时，服务端必须把编号解析结果写入事件，不能让 renderer 重新推断；解析为空时返回可操作错误，不降级成广播。
- 队长发布规范使用 `@全体成员` 广播消息 + `team_norms_changed`/`team_rules_changed` 事件；不要再发一份隐藏系统消息给每个成员造成双写。

### 5.1 · 管理 Agent 信息隔离

管理 Agent 的项目观察遵守“附庸的附庸不是我的附庸”：

- 有队长：管理 Agent 默认只看队长摘要、队长请求、队长转交的报告；队员完整会话不进管理 Agent 上下文。
- 无队长：管理 Agent 才读取普通 Agent 摘要和待审报告，作为临时项目入口。
- 队员：不能看到队长和管理 Agent 的内部协调记录。
- 队长：不能看到管理 Agent 的长期记忆、跨项目记录、用户全局偏好原文；只能收到管理 Agent 按 `managerContextPolicy` 注入的摘要。
- 深读：任何越过摘要层的读取都必须有 permission、理由和 timeline 记录。

## 6 · 状态与审查队列

1. 新建且开始工作的 Agent session 映射为 `active`；没有任务的成员映射为 `unassigned`。
2. 队员提交 `team_report_submitted` 时，后端在同一事务中把会话状态改成 `awaitingReview`，并生成 `team_review_queued`。
3. 待审内容必须来自结构化 report；不能默认把“最后一条 assistant 消息”猜成正式工作汇报。
4. 有队长时排给队长，并在团队群聊插入待审简报卡；无队长时排给管理 Agent/人类入口。
5. 只有人类、管理 Agent 或队长能把 `awaitingReview` 改为 `done`。队员不能绕过审查直接完成。
6. 取消、删除团队或覆盖规则仍按 permission 分级；L3 永远明确确认。

## 7 · `@` 与 `/` 一次迁移

| 入口 | 只允许 |
|---|---|
| `@` | 人、Agent、会话、身份标签 |
| `/` | Skill、命令、模板、工具动作、Source 动作 |
| 附件/全部文件 | 文件、文件夹、素材 |

- 删除用户可见的 `@Skill`、`@Source`、`@File` 分支，不保留兼容开关。聊天输入已完成这一收口；团队群聊的 `@全体成员` / `@G-编号` 名册菜单已接入，其他会话不显示该菜单。
- 内部存储标记如 `[skill:slug]` 可以继续作为执行格式；聊天输入已改为只能由 `/` 菜单生成，不能被 `@` 菜单触发。
- 真实改动范围包括 `FreeFormInput.tsx`、实际的 `mention-menu.tsx`/inline mention hook、`rich-text-input.tsx`、shared mentions parser、相关测试、resources docs、tool-defs、handlers 和 session MCP 说明。
- `skill-mention-menu.tsx` 已是 deprecated 转发文件，不应当作为主实现入口。

## 8 · 权限边界

| 身份 | 能做 | 不能做 |
|---|---|---|
| 人类 | 设置规则、提升队长、审查、批准权限 | 无法绕过系统级安全边界 |
| 管理 Agent | 跨项目协调、读规则、维护记忆、代理低风险判断 | 绕过 permission、自动批准 L3、默认深读所有项目 |
| 队长 | 项目内分派、规范、请求审查、汇总、调整成员 | 改全局规则、读取其它 team 私聊、绕过 permission、批准 L3 |
| 队员 | 执行任务、更新 active、提交报告 | 直接标 done、改队长、广播私聊、改全局设置 |

## 9 · 并行实现顺序与文件所有权

### 9.0 · 前端调性约束（团队 UI 必须遵守）

团队设置页必须贴合 craft 原设置页，而不是另做控制台：

- 页面结构沿用 `PanelHeader + ScrollArea + max-w-3xl + SettingsSection + SettingsCard/SettingsRow`。
- 文案短、可操作、中文优先；不要写大段解释。必须说明“修改走会话命令、权限和 timeline”，但不重复讲架构。
- 原标签设置页负责标签用途、提示词和 permission profile；团队设置只负责状态映射、团队规范和管理 Agent 边界。团队群聊继续放在“所有会话”顶部，不复制聊天框。
- 设置页必须展示常驻管理 Agent 状态，并提供“长期偏好注入 / 跨项目记录注入 / 深读是否需要授权”的配置；写入同样走 `sessions:command updateTeamRules`。
- 管理 Agent 的用户消息入口不在设置页，也不在单个 workspace 会话里；设置页只展示内部投影锚点和注入策略。
- 写动作只走 `sessions:command` 的团队命令；设置页不得直接写 `.fleet/team.rules.json`，不得使用 localStorage 或 renderer 私有 store 作为团队真相。
- 新增/删除页面、按钮、输入语法后，同步本文件、`AGENTS.md`、相关 docs、session tool schema/handler 和 MCP/Agent 说明。

### A. T-TEAM-PROTOCOL（候选已落，身份收敛后再验收）

- 改：`shared/protocol/team.ts`、`dto.ts`、`index.ts` 和纯类型测试。
- 不改：renderer、SessionManager 行为。
- 验收：类型与默认 statusMap 测试通过；每个事件字段一致。

### B. 协议冻结后并行

| 工作令 | 文件所有权 | 交付 |
|---|---|---|
| T-TEAM-RULES（候选已落） | server-core `team-rules-*`、RPC、测试 | 校验/原子写/最后有效版本可复用；删除身份双写后再验收 |
| T-AT-SLASH | renderer input/mentions、shared mentions、resources/tool docs、测试 | `@` 仅身份，`/` 调 Skill/命令，文件走附件/全部文件 |
| T-TEAM-UI（未开始） | 原会话列表、原标签徽章、状态显示、团队群聊特殊会话项 | 先恢复 Craft 原界面；只在原字段上显示模型、序号、身份和状态。禁止新建身份菜单、团队条或独立身份设置组件。 |

### C. B 合入后串行

| 工作令 | 文件所有权 | 交付 |
|---|---|---|
| T-TEAM-ROUTER（候选已落） | SessionManager + TeamCoordinator + tests | 消息/任务/报告/待审逻辑可复用；必须改为从 session labels 派生身份并重验 permission/timeline |
| T-MANAGER-AGENT | Agent registry、管理 Agent 工具/提示词、permission 接线 | 跨文件夹管理入口的后端能力；不先做新治理面板 |

并行 Agent 不得改 `docs/33` 协议；发现缺口必须回主线提出，不能自行加字段。每个任务按 `docs/32` 的汇报格式交付。

## 10 · RuntimeLane 与 TeamRun 协议摘要（D19 · 2026-06-27）

> 本节只放团队脊柱里的概念摘要。详细工程契约（状态机、attributionChain、错误码、RuntimeLauncherAdapter、同步阻塞桥、WorkspaceFileLeaseManager、前后端/环境/工具调用边界）见 `docs/38-API-CLI分离与跨Runtime团队编排.md`。共享协议文件必须按 `AGENTS.md` 规则 36 由 Lead 冻结后再改。

### 10.1 · 三个概念

| 概念 | 归属 | 作用 |
|---|---|---|
| **AgentSeat** | Fleet | 稳定身份（队长/代码/设计/审查/测试），不随 runtime 变 |
| **RuntimeLane** | Fleet 管理，runtime 执行 | API lane / CLI lane / terminal lane；一个 AgentSeat 可绑多个 lane |
| **TeamRun** | Fleet | 一次跨成员执行任务，含 runId、状态、权限链、租约、成本、报告 |

队长不是 CLI；CLI 只是队长当前使用的执行 lane。队长可同时拥有 control lane（API）和 harness lane（CLI）。

### 10.2 · Fleet Bridge 工具集

CLI lane 只看到固定工具集（不动态生成成员工具）：

- `fleet.get_team` / `fleet.propose_member_run` / `fleet.start_member_run`
- `fleet.get_run_status` / `fleet.get_run_report` / `fleet.cancel_run`
- `fleet.send_team_message` / `fleet.invoke_internal_action`（仅只读或 L0/L1）

Bridge 对外同步阻塞、对内异步 TeamRun；详见 `docs/38-API-CLI` §4。

### 10.3 · 落点

协议类型落点（P0 冻结目标，不代表当前已实现）：

- `shared/protocol/team-run.ts`：`AgentSeat` / `RuntimeLane` / `TeamRun` / `RunReport` / `AttributionChain` 类型
- `shared/protocol/dto.ts`：新增 `team_run_*` SessionEvent
- `shared/protocol/channels.ts`：新增 `teamRun` RPC namespace
- `server-core/src/services/team-run-coordinator.ts`：TeamRun 调度
- `session-tools-core/src/handlers/fleet-bridge.ts`：CLI lane 注入的 Bridge 工具集
