# 33 · T-TEAM-SPINE 团队编排脊柱协议

> 状态：共享协议、团队规则服务、TeamCoordinator、SessionManager 收件箱注入、Agent session 工具、会话列表顶部最小团队群聊入口和团队设置页已落地；常驻管理 Agent 已有 `manager:global` 身份和 workspace 内部投影锚点，团队设置页已可配置长期偏好/跨项目记录注入策略，但尚未接“所有会话”全局专栏和自动代理；`@`/`/` 输入迁移、模型图标、完整队列视图仍未完成。
> 目的：固定“会话即 Agent、队长、团队群聊、身份标签、状态、`@`/`/`、管理 Agent”的共同契约，让后端和 UI 可以并行开发而不产生第二套 session/team/permission。
> 参考：AionUi 可按绿灯范围迁 Team/进程生命周期；Warp 只黑盒学习 task/run、Agent 间消息、长任务 block 和失败信息。

## 0 · 复审修正（2026-06-22 · 权威，冲突处以本节为准）

对照 AionUi 团队机制与 Warp 任务运行态复审后，原设计基础正确（单一 session/timeline/permission 真相、规则文件不双写、`hidden` 会话承载团队群聊），但有 8 处会让 TeamCoordinator 返工的缺口，已修正并写入契约：

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
8. **成员对账：** 收到 `session_deleted`/归档时，Coordinator 从 `memberSessionIds`/`identityAssignments` 移除该会话；若是队长则清空 `leaderSessionId` 并发 `team_leader_changed`。

权限分级矩阵（Coordinator 必须按此判，详见 §8）：promoteTeamLeader=L1；sendTeamMessage/不 run 的 assignTeamTask/changeTeamIdentityTag/submitTeamReport=L1；autoRun dispatch / updateTeamRules(结构/规范)=L2；删除团队/清空队长成员=L3。管理 Agent 自动代答只限 L0/L1，永不自动 L2（无规则）/L3。

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
- `app/apps/electron/src/renderer/components/app-shell/TeamConversationBar.tsx`
- `app/apps/electron/src/renderer/components/app-shell/team-chat-helpers.ts`
- `app/apps/electron/src/renderer/pages/settings/TeamSettingsPage.tsx`
- `app/apps/electron/src/renderer/pages/settings/team-settings-helpers.ts`

新增上下文隔离字段已落到 `TeamRulesV1.managerContextPolicy`。默认值：长期偏好只注入队长、跨项目记录不注入、管理 Agent 深读成员上下文必须经过权限。管理 Agent 的消息入口仍需后续落到“所有会话”全局专栏，不能继续做成单个 workspace 的普通会话。

当前已冻结类型、事件、命令和默认状态映射，并提供 rules 文件读取、严格校验、原子写入、最后有效版本回退及读取/预校验 RPC。团队命令已通过 `sessions:command → TeamCoordinator` 写入 permission/timeline；渲染端没有直接写 rules 文件 RPC。

## 1 · 唯一真相与存储

- **会话与消息真相**：craft `SessionManager`、session persistence、`SessionEvent`。
- **权限真相**：craft permission；队长和管理 Agent 都不能绕过。
- **团队策略文件**：`<workspace>/.fleet/team.rules.json`。它只保存团队规则和稳定引用，不保存模型图标、运行状态、消息队列或完整成员副本。
- **团队群聊**：使用一个 `hidden: true` 的 craft session（`teamConversationSessionId`）。它仍在原 session store 中，不是第二套聊天系统；UI 只把它渲染成“所有会话”顶部的团队群聊框。
- **管理 Agent 全局专栏**：常驻管理 Agent 的用户对话位于“所有会话”层的专门栏，跨 Workspace 存在；workspace hidden 投影只做内部锚点，不展示为普通会话，不承载用户对话。
- **成员运行态**：由成员 session metadata + Agent registry 派生。模型、Runtime、displayName、在线状态不能复制进规则文件形成双写。

## 2 · TeamRulesV1

```ts
interface TeamRulesV1 {
  version: 1
  teamId: string
  teamConversationSessionId: string
  leaderSessionId: string | null
  memberSessionIds: string[]
  identityTags: Array<{
    id: string
    displayName: string
    systemPromptPreset?: string
    color?: string
  }>
  identityAssignments: Record<string, string[]> // sessionId -> tag ids
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
- 身份标签保存角色规则和可选系统提示词。应用标签时记录 preset id/version/hash；真正提示词在 session 构建时注入，修改必须进 timeline。
- `modelIcon`、`runtime`、`displayName` 不进入 TeamRules，避免与 session/registry 双写。

## 4 · 团队事件

先在 `app/packages/shared/src/protocol/team.ts` 定义公共类型，再让 `dto.ts` 的 `SessionEvent` 引用。所有事件必须有 `sessionId`、`teamId`、`conversationId`、`actor: ActorRef`、`timestamp`；适用时带 `taskId`/`runId`。

| 事件 | 用途 |
|---|---|
| `team_rules_changed` | 规则、成员引用、身份分配或项目规范改变 |
| `team_leader_changed` | 提升/更换/清除队长 |
| `team_identity_changed` | 会话身份标签变化 |
| `team_message` | 广播或私聊；用 `visibility` + `audienceSessionIds` 表达，不再另建 `team_private_message` |
| `team_task_assigned` | 队长/管理 Agent/人类创建或重新分派任务 |
| `team_report_submitted` | 队员提交结构化工作汇报 |
| `team_review_queued` | 报告进入队长或管理 Agent 的待审队列 |
| `team_rules_validation_failed` | 规则文件非法并回退到最后有效版本 |

`ActorRef` 当前只有 `user | agent`，因此自动排队使用稳定的管理 Agent actor（`agentId: manager:global`，并附当前 workspace 投影 session），不要凭空写 `kind: 'system'`。

## 5 · 团队消息与隐私

- 团队群聊内容存入 `teamConversationSessionId` 对应的 craft session。
- 不带 `@`：`visibility='broadcast'`，服务端把消息投递到全部有效成员的 Agent mailbox。
- `@某Agent/会话/身份`：服务端解析为 `audienceSessionIds`，只把内容加入目标 Agent 上下文；其他项目 Agent 不得收到。
- 人类与常驻管理 Agent可按权限审计团队消息；“私聊”表示对其他项目 Agent 不可见，不承诺操作系统级加密。
- fanout 只保存消息引用/投递状态，不在每个成员 session 复制完整消息形成多份真相。

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
4. 有队长时排给队长；无队长时排给管理 Agent/人类入口。
5. 只有人类、管理 Agent 或队长能把 `awaitingReview` 改为 `done`。队员不能绕过审查直接完成。
6. 取消、删除团队或覆盖规则仍按 permission 分级；L3 永远明确确认。

## 7 · `@` 与 `/` 一次迁移

| 入口 | 只允许 |
|---|---|
| `@` | 人、Agent、会话、身份标签 |
| `/` | Skill、命令、模板、工具动作、Source 动作 |
| 附件/全部文件 | 文件、文件夹、素材 |

- 删除用户可见的 `@Skill`、`@Source`、`@File` 分支，不保留兼容开关。
- 内部存储标记如 `[skill:slug]` 可以继续作为执行格式，但只能由 `/` 菜单生成，不能被 `@` 菜单触发。
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
- 设置页只负责规则配置：队长、成员身份、身份标签、状态映射、团队规范。团队群聊继续放在“所有会话”顶部，不在设置页复制聊天框。
- 设置页必须展示常驻管理 Agent 状态，并提供“长期偏好注入 / 跨项目记录注入 / 深读是否需要授权”的配置；写入同样走 `sessions:command updateTeamRules`。
- 管理 Agent 的用户消息入口不在设置页，也不在单个 workspace 会话里；设置页只展示内部投影锚点和注入策略。
- 写动作只走 `sessions:command` 的团队命令；设置页不得直接写 `.fleet/team.rules.json`，不得使用 localStorage 或 renderer 私有 store 作为团队真相。
- 新增/删除页面、按钮、输入语法后，同步本文件、`AGENTS.md`、相关 docs、session tool schema/handler 和 MCP/Agent 说明。

### A. T-TEAM-PROTOCOL（已完成，主线独占）

- 改：`shared/protocol/team.ts`、`dto.ts`、`index.ts` 和纯类型测试。
- 不改：renderer、SessionManager 行为。
- 验收：类型与默认 statusMap 测试通过；每个事件字段一致。

### B. 协议冻结后并行

| 工作令 | 文件所有权 | 交付 |
|---|---|---|
| T-TEAM-RULES（已完成） | server-core `team-rules-*`、RPC、测试 | 已有校验/原子写/最后有效版本/读取与预校验 RPC |
| T-AT-SLASH | renderer input/mentions、shared mentions、resources/tool docs、测试 | `@` 仅身份，`/` 调 Skill/命令，文件走附件/全部文件 |
| T-TEAM-UI（设置页已完成） | 会话列表、状态/i18n、团队群聊组件、设置页 | 已有顶部团队群聊、@序号/@队长解析、设为队长；设置页已支持队长、成员身份、身份标签、状态映射、团队规范、管理 Agent 投影状态和上下文注入策略。剩模型图标、状态中文重命名、完整队列视图和“所有会话”管理 Agent 全局专栏 |

### C. B 合入后串行

| 工作令 | 文件所有权 | 交付 |
|---|---|---|
| T-TEAM-ROUTER（已完成核心） | SessionManager + TeamCoordinator + tests | hidden team session、broadcast/private audience、task/report/review queue、收件箱注入 |
| T-MANAGER-AGENT | Agent registry、管理 Agent 工具/提示词、permission 接线 | 跨文件夹管理入口的后端能力；不先做新治理面板 |

并行 Agent 不得改 `docs/33` 协议；发现缺口必须回主线提出，不能自行加字段。每个任务按 `docs/32` 的汇报格式交付。
