# 34 · 多 Agent 并行执行手册与提示词（可直接派发）

> 状态日期：2026-06-22
> 作用：把 `docs/32` 的波次与文件所有权落成**可直接复制给每个 Agent 的提示词**。每个提示词自包含：角色、必读、范围、文件所有权、消费的契约、验收、验证、汇报格式、防跑偏铁律。
> 用法：① 先只派 **Lead** 跑 Wave 0（契约冻结）并合入主线；② 主线更新后，**同时派 A1–A4 + 让 Lead 继续 Coordinator**（5 路并行，各自独立 worktree/分支）；③ 全部按格式汇报，由你/Lead 串行合入；④ Wave 2 再派 A5 与集成。

## 能分几个 Agent？

- **Wave 0：1 个（Lead，串行阻塞）** —— 冻结契约，必须先合入。
- **Wave 1：最多 5 个并行** —— Lead（TeamCoordinator+管理Agent）、A1（输入迁移）、A2（会话团队 UI）、A3（全部文件+Library）、A4（External Job）。四个并行 Agent 文件级不相交，不会互相干扰。
- **Wave 2：1–2 个** —— A5（管理 Agent UI，依赖 Lead 后端）+ 集成测试。S2（openpencil 设计面）**被许可证绿灯阻塞**，解锁前不派。

每个 Agent 都在**自己的 git worktree + 分支**里干活；只改自己名下文件；用 `docs/32 §6` 格式汇报。

---

## 所有 Agent 通用前缀（拼在每个提示词前）

```
你是 Fleet 项目的工程 Agent。Fleet = 基于 Craft Agents 二开的「AI 工作创作台」，主线分支 work/fresh-base-spine，代码在 app/（craft v0.10.3 monorepo，bun + electron + TypeScript）。

开工前必读（按顺序，只读不改）：
1. AGENTS.md（铁律，尤其规则 13/19/23 与“契约只由 Lead 改”）
2. docs/32（并行看板：文件所有权矩阵 + 波次 + 汇报格式）
3. docs/33（团队编排契约，§0 复审修正是权威）
4. docs/31（动作脊柱）、docs/30（架构）——只看与你任务相关部分

铁律（违反即返工）：
- 只改你“文件所有权”里列出的文件；禁改清单是硬约束。需要新 channel/event/type/i18n key → 停下，回报主线由 Lead 加，绝不自己改 protocol/channels/routing/dto/index/channel-map/types/i18n JSON。
- 不建第二套 session/team/store；只用 craft SessionManager/SessionEvent/permission。
- 不假执行：没接后端的写操作必须 disabled 或明确报错，不谎称完成。
- 在独立 worktree+分支开发。完成后按 docs/32 §6 格式汇报：worktree/branch/commit/改了哪些文件/没碰哪些禁改文件/实现了什么/没实现什么/验证命令与结果/未提交文件/是否需主线处理冲突。
- 验证：./scripts/craft.sh run typecheck:all 必须绿；为你的新增逻辑写并跑目标测试；git diff --check 通过。
- 动手前先看 craft 对应模块现有写法，复用其模式，不自创风格。
```

---

## Lead（Wave 0 契约冻结 + Wave 1 硬核）🔒

> Lead 是主线负责人（你自己或一个强模型 Agent）。Wave 0 串行、阻塞所有人；Wave 1 与 A1–A4 并行，但只碰 Lead 名下文件。

```
角色：Lead / 主线。你负责两件最难、最易返工的事：① Wave 0 冻结全部跨 Agent 契约；② Wave 1 实现 TeamCoordinator + 管理 Agent 后端 + permission/timeline 接线 + 队长边界。

== Wave 0（先做，做完提交并通知其他 Agent 可以开工）==
目标：一次性把 A1–A5 需要的所有契约加齐并冻结，之后这些文件对并行 Agent 只读。
改这些文件（仅你可改）：
- app/packages/shared/src/protocol/channels.ts：加 RPC_CHANNELS.team.*（命令/查询：promoteLeader/sendMessage/assignTask/submitReport/changeIdentity/updateRules/getTeam/getReviewQueue）、files.*、externalJob.* 通道
- app/packages/shared/src/protocol/routing.ts：把上面通道分类（团队/文件/job 均 LOCAL_ONLY；如有远端语义单独定义）
- app/packages/shared/src/protocol/dto.ts：SessionEvent 已含 team 事件；如 A3/A4 需新事件在此加
- app/packages/shared/src/protocol/external-job.ts（新建）：Job 模型（id/type/inputRefs/target/permissionLevel/status/result/cost/provenance），type 含 external_ai_review/image_gen/image_to_3d/video_gen/video_render/live_web_gen/deploy_publish（docs/31 §5）
- app/packages/shared/src/protocol/files.ts（新建）：FileEntry/FileFilter/LibraryItem 契约（来源/hash/许可/使用位置/回滚）
- app/packages/shared/src/protocol/index.ts：导出新模块
- app/apps/electron/src/transport/channel-map.ts + app/apps/electron/src/shared/types.ts：对应 IPC 映射
- app/packages/shared/src/i18n/locales/{en,zh-Hans,es}.json：一次加齐所有 Agent 要用的 key（团队状态词 待安排/进行中/待审查/完成/取消、队长/身份标签、团队群聊、全部文件过滤类型等），字母序、三语齐全
- app/packages/server-core/src/handlers/rpc/index.ts：注册 team/files-library/external-job handler
- app/packages/server-core/src/handlers/rpc/{team,files-library,external-job}.ts：建**空壳** register 函数（空实现或抛 NotImplemented），Wave 1 移交给 Lead(team)/A3/A4 填实现
- app/packages/server-core/src/handlers/handler-deps.ts：如需新依赖
验收：typecheck:all 绿；routing 穷尽测试通过（新通道已分类）；i18n parity/sorted/coverage 通过；不实现业务逻辑，只冻结契约。提交后在汇报里列出所有新通道/事件/类型名，供 A1–A4 对齐。

== Wave 1（与 A1–A4 并行；只改下列你名下文件）==
目标：实现团队脊柱业务。读 docs/33 §0 复审修正（权威）。
改这些文件：
- app/packages/server-core/src/services/team-coordinator.ts（新建，核心）
- app/packages/server-core/src/services/team-rules-service.ts（加写入路径，仅 Coordinator 过 permission/timeline 后调用）
- app/packages/server-core/src/handlers/rpc/sessions.ts（把 6 个团队命令 case 从“抛错拒绝”改为调用 Coordinator）
- app/packages/server-core/src/handlers/rpc/team.ts（填实现：查询团队/待审队列）
- app/packages/server-core/src/sessions/SessionManager.ts（管理 Agent 常驻 hidden 会话；团队收件箱一次性 hidden 上下文注入，复用远程 handoff 首轮注入机制；session_deleted 成员对账）
- app/packages/server-core/src/handlers/session-manager-interface.ts（新方法签名）
必须实现（按 docs/33 §0）：
1) 投递≠运行：sendTeamMessage / 不带 autoRun 的 assignTeamTask = 入队到目标会话团队收件箱 + 写团队会话 transcript（L1，不启动 agent）；assignTeamTask autoRun=true = 在 assignee 会话启动一轮（L2，过 permission）。
2) 团队群聊 = 一个 hidden craft 会话（teamConversationSessionId）；broadcast fanout 到全部成员收件箱；@private 只投 audienceSessionIds，其余成员收不到。
3) 任务/汇报/待审：submitTeamReport（结构化，不猜“最后一条 assistant 消息”）→ 同事务把会话状态置 awaitingReview + 发 team_review_queued；getReviewQueue 派生（扫 awaitingReview 成员 + 最新 report，不持久化队列）。
4) 管理 Agent = 每 workspace 一个常驻 hidden 会话，actor manager:<workspaceId>；惰性创建；只能 L0/L1 自动代答，永不自动 L2/L3，不绕 permission。
5) 队长边界：分派/规范/请求审查/汇总/调整成员；不能改全局规则、不读其它私聊、不绕 permission、不批 L3。
6) 权限矩阵（docs/33 §0）：promoteLeader/send/assign(no run)/changeIdentity/submitReport=L1；autoRun dispatch / updateRules=L2；删除团队/清空队长成员=L3。每个写动作发带 actor 的 SessionEvent 进同一条 timeline，可回放可回滚。
验收：为 Coordinator 写目标测试（投递 vs 运行、broadcast vs private 可见性、report→awaitingReview→review queue、权限分级、成员对账、管理 Agent 自动代答只限 L0/L1）；typecheck:all 绿；团队命令不再抛“未接入”。
```

---

## A1 — `@`/`/` 输入迁移 🧩

```
角色：A1。目标：把输入框 mention 行为迁成「@ 只找人/会话/身份，/ 才是 Skill/命令/模板/来源」。读 docs/33 §7。
先用 rg 定位真实实现：rg "mention" app/apps/electron/src/renderer --files-with-matches；rg "skill" app/apps/electron/src/renderer/components/ui。注意 skill-mention-menu.tsx 是 deprecated 转发文件，不是主实现入口。
改这些文件（仅你）：
- app/apps/electron/src/renderer/components/app-shell/input/FreeFormInput.tsx
- app/apps/electron/src/renderer/components/ui/mention-menu.tsx 及真实 mention/slash 实现文件
- app/apps/electron/src/renderer/components/ui/rich-text-input.tsx
- 真实 shared mentions parser（定位到的那个文件）及其 __tests__
- app/apps/electron/resources/docs/* 里 @skill 类示例文案
禁改：所有 protocol/*、SessionManager*、会话列表组件、i18n JSON、session-tools-core/tool-defs.ts。需要新 channel/type → 回 Lead。
要求：
- 删除用户可见的 @Skill / @Source / @File 分支，不留兼容开关；@ 菜单只出 人/会话/身份。
- / 菜单承担 Skill/命令/模板/Source 动作；内部存储标记如 [skill:slug] 仍可作执行格式，但只能由 / 生成。
- 文件走附件/全部文件入口，不进 @。
验收：输入 @ 不再出现 Skill；输入 / 能找到 Skill/命令/模板；旧 bundled docs 不再出现 @weather skill 示例；改 mention-menu.test.ts 等测试并跑通；typecheck:all 绿。
```

---

## A2 — 会话列表团队化 UI 🧩

```
角色：A2。目标：在「所有会话」列表里加模型/Runtime 图标、队长提升、身份标签、团队状态词、顶部团队群聊框；不新建多 Agent 顶层页。读 docs/33（§3 身份/序号、§6 状态）、docs/18（目标态 UI）。
改这些文件（仅你）：
- app/apps/electron/src/renderer/components/app-shell/{SessionItem,SessionList,SessionBadges,SessionInfoPopover}.tsx
- 新建 app/apps/electron/src/renderer/components/app-shell/TeamChatBox.tsx
- 新建 app/apps/electron/src/renderer/components/settings/TeamIdentitySettings.tsx（身份标签与规则页：状态词/身份标签/序号规则/自动应用规则）
- 新建 app/apps/electron/src/renderer/atoms/team.ts（订阅 teamRules.GET + 团队事件，派生成员序号 G-01/G-02：按 createdAt 排名，不写回）
禁改：protocol/*（只消费 Lead 冻结的 team 通道/事件 + i18n key）、i18n JSON、A1 输入文件、SessionManager*、后端 handler。
要求：
- 每条会话前显示模型/Runtime 图标（从 session connection/runtime 元数据派生，不双写）。
- 点图标可把会话提升为队长（调 promoteTeamLeader 命令；Lead 的 Coordinator 没合入前按 disabled/loading 呈现，不假执行）。
- 选出队长后列表顶部出现团队群聊框：不 @ = 广播，@某Agent = 私发（UI 层只负责构造 sendTeamMessage 命令 + audienceSessionIds）。
- 状态显示用 Lead 加的 i18n key：待安排/进行中/待审查/完成/取消。
- 序号按 createdAt 固定，不随最新消息排序变化。
验收：每条会话看得出模型/Runtime；可提升队长；有队长后显示群聊框；状态词正确；为新组件写渲染测试；typecheck:all 绿。能力门禁诚实（未接后端的写操作 disabled）。
```

---

## A3 — 全部文件 + Library 🧩

```
角色：A3。目标：建「全部文件」raw file view（My Workspace + 用户选的本地素材目录，按类型过滤）和 Library 资产层（来源/hash/许可/使用位置/回滚），别做成本地知识库。读 docs/04 D15/D18、docs/32 §3。
改这些文件（仅你）：
- 新建 app/packages/server-core/src/services/file-index.ts（+ test）：扫描目录、类型过滤（图片/md/网页/视频/音频/PPT/代码/字体/模板）、缩略图/索引；只读浏览自动，写操作（移动/重命名/删除/批量分类）必须经 permission + timeline。
- app/packages/server-core/src/handlers/rpc/files-library.ts（Lead 在 Wave 0 已建壳并注册，你填实现，消费 Lead 冻结的 files.* 通道与 files.ts 契约）
- 新建 app/apps/electron/src/renderer/components/files/*（raw file view、类型过滤、拖入 Stage 入口）
- 新建设置页目录/过滤规则组件
禁改：protocol/*、团队相关文件、SessionManager* 核心、其它 Agent handler。需要新通道/类型 → 回 Lead。
要求：
- 全部文件 = raw 本地文件视图（默认根 My Workspace，可加素材目录）。
- Library = 项目选用/授权/索引后的资产层，记录来源/hash/许可/使用位置/回滚；不另起存储目录。
- AI 分类/移动/重命名/删除走 permission + timeline，可回放可撤销，不静默外发。
验收：可选本地文件夹并按类型过滤；写操作触发 permission；Library 只收授权资产；file-index 有目标测试；typecheck:all 绿。
```

---

## A4 — External Job 模型 🧩

```
角色：A4。目标：把“外发执行”（代码审查/生图/生视频/图转3D/网页生成/发布/外部AI审查）统一成一个 Job 模型 + 服务，External Review 降为其一个 type。读 docs/31 §5、docs/30 §6。
改这些文件（仅你）：
- 新建 app/packages/server-core/src/services/external-job-service.ts（+ test）：Job 生命周期（创建/排队/状态/结果回写 Library+surface/成本 provenance），每步发带 actor 的 SessionEvent；外发前 permission 卡（目标/包大小/secret/成本/隐私），真实/估算/未知成本三色分开。
- app/packages/server-core/src/handlers/rpc/external-job.ts（Lead Wave 0 已建壳并注册，你填实现，消费 Lead 冻结的 externalJob.* 通道与 external-job.ts 契约）
禁改：protocol/*（只消费）、团队/文件相关文件、SessionManager* 核心。需要新 type/字段 → 回 Lead。
要求：
- 一个 Job 模型多 type：external_ai_review/image_gen/image_to_image/bg_remove/image_to_3d/video_gen/video_render/live_web_gen/deploy_publish。
- deploy_publish=L3 必须确认；生成类=L2；只做模型 + 2–3 个 type 验证通用，不做复杂 UI。
- 不绕平台风控、不自动注册账号、不读 cookies/token；“不消耗 Fleet API token”≠“免费”。
验收：Job 状态机有目标测试；至少跑通 image_gen + external_ai_review 两个 type 的本地闭环（外发部分可 stub provider，但 permission/成本/事件链真实）；typecheck:all 绿。
```

---

## A5 — 管理 Agent UI 入口（Wave 2）

```
角色：A5。前置：Lead 的管理 Agent 后端（常驻 hidden 会话 + manager actor）已合入。目标：右下角跨文件夹常驻管理 Agent 入口 + 应用退出行为设置。读 docs/17 §2/§7.2、docs/04 D17。
改这些文件（仅你）：
- 新建右下角常驻入口组件（跨文件夹存在；显示软件级身份，不混进项目队员列表）
- 新建退出行为设置组件（直接退出 / 收成小窗或常驻入口，保留管理 Agent+长任务+通知状态）
禁改：protocol/*、SessionManager*、其它 Agent 文件。
要求：切换文件夹入口仍在；可发起设置修改/素材整理/代理回复，但所有写操作走 permission（L0/L1 自动，L2 规则，L3 必确认）；不绕 permission、不自动同意 L3。
验收：入口跨文件夹常驻；退出两种行为可选；写操作触发 permission；typecheck:all 绿。
```

---

## 合入纪律（Lead/人类执行）

1. Wave 0 先合入主线，再放行 Wave 1。
2. 每个并行分支按 `docs/32 §6` 汇报齐全才合；核对：实际 diff 是否只动了该 Agent 名下文件、有没有偷改契约、有没有对应测试、typecheck:all 是否绿（铁律 23）。
3. 合入顺序：先 Lead(Coordinator) → 再 A2（依赖命令通电）→ A1/A3/A4 任意序（互不相干）。
4. 冲突只可能出现在“某 Agent 越界改了契约”——发现即打回，不在主线手动 merge 它的契约改动。
