# 33 · T-TEAM-SPINE 团队编排脊柱协议

> 状态：共享协议与团队规则基础服务已落地；命令写入、业务路由、输入迁移和 UI 尚未实现。
> 目的：固定“会话即 Agent、队长、团队群聊、身份标签、状态、`@`/`/`、管理 Agent”的共同契约，让后端和 UI 可以并行开发而不产生第二套 session/team/permission。
> 参考：AionUi 可按绿灯范围迁 Team/进程生命周期；Warp 只黑盒学习 task/run、Agent 间消息、长任务 block 和失败信息。

## 0 · 复审修正（2026-06-22 · 权威，冲突处以本节为准）

对照 AionUi 团队机制与 Warp 任务运行态复审后，原设计基础正确（单一 session/timeline/permission 真相、规则文件不双写、`hidden` 会话承载团队群聊），但有 8 处会让 TeamCoordinator 返工的缺口，已修正并写入契约：

1. **投递 ≠ 运行（最核心）。** craft 没有现成的 “Agent mailbox / 给别的会话注入下一轮上下文” 之外的主动驱动。所以拆成两层：
   - **投递**：`sendTeamMessage` / 不带 `autoRun` 的 `assignTeamTask` = 把消息/任务**入队**到目标会话的「团队收件箱」（一次性 hidden 上下文，复用 craft 远程 handoff 的 “首轮注入” 机制）+ 写入团队会话 transcript。**不自动启动 agent**。权限 **L1**。idle 会话以未读角标呈现，等下一轮消费。
   - **运行（dispatch）**：带 `autoRun:true` 的 `assignTeamTask` = **立刻在 assignee 会话启动一轮执行**。启动 agent 运行是 **L2**，过 permission。
   - 契约落点：`assignTeamTask.autoRun?`、`team_message.delivery: 'queued'|'delivered'`（已改 `team.ts`）。
2. **管理 Agent 是软件级单一身份，不是每 workspace 一个不同 Agent。** 使用稳定 `agentId: manager:global`、共享用户/软件记忆和决策规则；为了复用 craft 的 workspace-scoped SessionManager，每个 workspace 可有一个 `hidden` 投影会话作为消息与 timeline 锚点。投影会话不是新身份，切换文件夹后仍是同一个管理 Agent。
3. **待审队列 = 派生态，不持久化。** `getReviewQueue(teamId)` 扫描状态= `statusMap.awaitingReview` 的成员会话，关联其最新 `team_report_submitted`，按报告时间排序；`team_review_queued` 仅作通知/回放事件，队列与 position 都是算出来的，不落第二份真相。
4. **v1 一个 workspace 一个团队。** `.fleet/team.rules.json` 单团队。删除 “其它 team 私聊” 多团队语义（移到地平线）。workspace = 项目 = 团队，简化协调与一致性维护。
5. **成员序号派生自 `createdAt`，不写 metadata。** craft `Session` 无自由 metadata 字段；`G-01/G-02` 按成员 `createdAt` 排名实时算（createdAt 不变所以稳定），前缀取文件夹首字母（可配）。不写 label、不双写。
6. **Agent 参与走 session 工具**（`submit_team_report` / `send_team_message`），经同一条 `SessionCommand → permission → timeline`。v1 由 Coordinator 处理命令；工具壳是独立工作令 T-TEAM-AGENT-TOOLS（`submitTeamReport` 命令已在契约内，工具只是调用它）。
7. **事件锚点（为回放）：** 团队级事件（rules/leader/broadcast/validation_failed）落**团队会话** timeline（`conversationId===sessionId`）；成员级事件（task_assigned/report_submitted/identity_changed/review_queued）`sessionId`=成员会话、`conversationId`=团队会话——单条 SessionEvent 同时带两 id，UI 按 `sessionId` 看成员视图、按 `conversationId` 看群聊视图，**不重复发**。
8. **成员对账：** 收到 `session_deleted`/归档时，Coordinator 从 `memberSessionIds`/`identityAssignments` 移除该会话；若是队长则清空 `leaderSessionId` 并发 `team_leader_changed`。

权限分级矩阵（Coordinator 必须按此判，详见 §8）：promoteTeamLeader=L1；sendTeamMessage/不 run 的 assignTeamTask/changeTeamIdentityTag/submitTeamReport=L1；autoRun dispatch / updateTeamRules(结构/规范)=L2；删除团队/清空队长成员=L3。管理 Agent 自动代答只限 L0/L1，永不自动 L2（无规则）/L3。

当前已落代码：

- `app/packages/shared/src/protocol/team.ts`
- `app/packages/shared/src/protocol/dto.ts` 中的 `SessionEvent | TeamSessionEvent` 与 `SessionCommand | TeamSessionCommand`
- `app/packages/shared/src/protocol/__tests__/team.test.ts`
- `app/packages/server-core/src/services/team-rules-service.ts`
- `app/packages/server-core/src/handlers/rpc/team-rules.ts`

当前已冻结类型、事件、命令和默认状态映射，并提供 rules 文件读取、严格校验、原子写入、最后有效版本回退及读取/预校验 RPC。写入只能由后续 SessionCommand 在 permission 与 timeline 通过后调用；渲染端没有直接写文件 RPC。

## 1 · 唯一真相与存储

- **会话与消息真相**：craft `SessionManager`、session persistence、`SessionEvent`。
- **权限真相**：craft permission；队长和管理 Agent 都不能绕过。
- **团队策略文件**：`<workspace>/.fleet/team.rules.json`。它只保存团队规则和稳定引用，不保存模型图标、运行状态、消息队列或完整成员副本。
- **团队群聊**：使用一个 `hidden: true` 的 craft session（`teamConversationSessionId`）。它仍在原 session store 中，不是第二套聊天系统；UI 只把它渲染成“所有会话”顶部的团队群聊框。
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

## 3 · 成员身份与稳定序号

- 每个普通 craft session 可成为一个项目 Agent；模型/Runtime 图标从 session connection/runtime 元数据派生。
- 队长是 `leaderSessionId` 指向的现有 session，不复制成新 Agent。
- 项目标识默认取文件夹首字母；也可按文件夹加入顺序分配 A/B/C。
- 成员序号按 `createdAt` 固定生成，例如 `G-01`、`G-02`。生成后写入 session metadata，不能随最近消息排序变化。
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

### A. T-TEAM-PROTOCOL（已完成，主线独占）

- 改：`shared/protocol/team.ts`、`dto.ts`、`index.ts` 和纯类型测试。
- 不改：renderer、SessionManager 行为。
- 验收：类型与默认 statusMap 测试通过；每个事件字段一致。

### B. 协议冻结后并行

| 工作令 | 文件所有权 | 交付 |
|---|---|---|
| T-TEAM-RULES（基础完成） | server-core `team-rules-*`、RPC、测试 | 已有校验/原子写/最后有效版本/读取与预校验 RPC；命令写入由 T-TEAM-ROUTER 接入 permission/timeline |
| T-AT-SLASH | renderer input/mentions、shared mentions、resources/tool docs、测试 | `@` 仅身份，`/` 调 Skill/命令，文件走附件/全部文件 |
| T-TEAM-UI | 会话列表、状态/i18n、团队群聊组件、设置标签页 | 图标、队长、身份、中文状态、群聊入口；不改协议/路由后端 |

### C. B 合入后串行

| 工作令 | 文件所有权 | 交付 |
|---|---|---|
| T-TEAM-ROUTER | SessionManager + TeamCoordinator + tests | group session、broadcast/private audience、task/report/review queue |
| T-MANAGER-AGENT | Agent registry、管理 Agent 工具/提示词、permission 接线 | 跨文件夹管理入口的后端能力；不先做新治理面板 |

并行 Agent 不得改 `docs/33` 协议；发现缺口必须回主线提出，不能自行加字段。每个任务按 `docs/32` 的汇报格式交付。
