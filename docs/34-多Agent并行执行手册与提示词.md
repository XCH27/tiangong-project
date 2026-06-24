# 34 · 多 Agent 并行执行手册与提示词（可直接派发）

> 状态日期：2026-06-22
> 作用：把 `docs/32` 的波次与文件所有权落成**可直接复制给每个 Agent 的提示词**。每个提示词自包含：角色、必读、范围、文件所有权、消费的契约、验收、验证、汇报格式、防跑偏铁律。
> 当前门禁：团队线暂不允许并行。先由 Lead 完成原 LabelConfig 身份扩展、删除 team rules 身份双写、接通提示词/权限/队长唯一性；验收后才能派 A1/A2。

## 能分几个 Agent？

- **Wave 0：1 个（Lead，串行阻塞）** —— 冻结契约，必须先合入。
- **Wave 1：契约验收后最多 2 路并行** —— A1（输入迁移）与 A2（只改原界面显示字段）。
- **Wave 2：1–2 个** —— A5（管理 Agent 全局专栏，依赖 Lead 后端）+ 集成测试。S2（openpencil 设计面）**被许可证绿灯阻塞**，解锁前不派。

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
- 功能页面必须消费同一份功能文档：UI 放哪里、后端怎么接、Agent 工具怎么调、permission/timeline 怎么走、设置/i18n 怎么同步、验收怎么证明，都应在同一节里。你可以只实现自己拥有的文件，但不能另写一套 UI 或后端假设。
- 不假执行：没接后端的写操作必须 disabled 或明确报错，不谎称完成。
- 在独立 worktree+分支开发。完成后按 docs/32 §6 格式汇报：worktree/branch/commit/改了哪些文件/没碰哪些禁改文件/实现了什么/没实现什么/验证命令与结果/未提交文件/是否需主线处理冲突。
- 验证：./scripts/craft.sh run typecheck:all 必须绿；为你的新增逻辑写并跑目标测试；git diff --check 通过。
- 动手前先看 craft 对应模块现有写法，复用其模式，不自创风格。
```

---

## Lead（当前唯一可执行任务）🔒

> Lead 先修正身份数据模型。此任务完成前不派 A1/A2，也不改前端。

```
角色：Lead / 主线。目标：把身份能力扩展到 Craft 原标签系统，彻底删除团队规则中的第二套身份定义和分配。前端保持干净 Craft 原版，不在本任务修改。

先读：`packages/shared/src/labels/{types,storage,resolve,values}.ts`、`SessionManager.setSessionLabels`、系统提示词构建、permission profile 配置、当前 `team.ts`/`team-coordinator.ts`。

改动范围：
- `app/packages/shared/src/labels/types.ts`：给 `LabelConfig` 增加 `kind?: 'functional'|'identity'`、`systemPromptPreset?`、`permissionProfile?`。
- labels storage/resolve/tests：保存并校验新字段；默认旧标签不自动获得权限。
- `app/packages/shared/src/protocol/team.ts`：删除 `TeamIdentityTag`、`identityTags`、`identityAssignments` 与 `changeTeamIdentityTag`；TeamProjection 的身份从 session labels 派生。
- `app/packages/server-core/src/services/team-rules-service.ts`：删除重复身份校验/存储。
- `app/packages/server-core/src/services/team-coordinator.ts`：从 session labels 和 LabelConfig 读取身份；消息/任务/汇报逻辑保持不变。
- `app/packages/server-core/src/sessions/SessionManager.ts`：在既有 setLabels 路径中实现身份提示词注入、permission profile 引用、leader 唯一性与 timeline；不得另建 API。
- 对应协议、session self-management 和目标测试。

硬规则：
1. 身份定义只在 `labels/config.json`；身份分配只在 session `labels`。
2. `leader` 是普通标签中的特殊身份。给一个会话添加时原子移除旧队长的 leader 标签；不能靠模型图标或独立按钮。
3. `systemPromptPreset` 在后端构建 Agent 上下文时注入，记录标签 id/config hash；renderer 不拼提示词。
4. `permissionProfile` 只引用现有 permission 配置；身份标签绝不能绕过 permission 或自动批准 L3。
5. 稳定序号只派生，不写标签。

验收：LabelConfig 往返测试；setLabels 身份提示词测试；leader 唯一性与团队群聊创建测试；permission profile 不越权测试；旧功能标签仍可筛选/自动化；typecheck:all、目标测试、git diff --check 全绿。完成后更新 docs/32 状态，才允许派 A1/A2。
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
- / 菜单承担 Skill/命令/模板/Source 动作；内部存储标记如 [skill:slug] 仍可作执行格式，聊天输入已改为只能由 / 生成。
- 文件走附件/全部文件入口，不进 @。
验收：输入 @ 不再出现 Skill；输入 / 能找到 Skill/命令/模板；旧 bundled docs 不再出现 @weather skill 示例；改 mention-menu.test.ts 等测试并跑通；typecheck:all 绿。
```

---

## A2 — 会话列表团队化 UI 🧩

```
角色：A2。目标：在完全保留原 Craft 界面结构的前提下，只调整会话列表和原标签的显示字段。身份能力来自扩展后的原 LabelConfig，不得新增第二套身份菜单、身份 store、团队条、悬浮控制台或独立团队页面。
改这些文件（仅你）：
- app/apps/electron/src/renderer/components/app-shell/{SessionItem,SessionList,SessionBadges,SessionInfoPopover}.tsx
- 新建 app/apps/electron/src/renderer/components/app-shell/TeamChatSessionItem.tsx
- 新建 app/apps/electron/src/renderer/atoms/team.ts（订阅 teamRules.GET + 团队事件，派生成员序号 G-01/G-02：按 createdAt 排名，不写回）
禁改：protocol/*（只消费 Lead 冻结的 team 通道/事件 + i18n key）、i18n JSON、A1 输入文件、SessionManager*、后端 handler。
要求：
- 每条会话显示模型/Runtime 图标（只作识别，不可点击）和稳定序号；不改变原会话行布局。
- 原“标签”菜单原位保留；标签字段增加身份、提示词和 permission profile 能力。添加/取消“队长”标签就是队长切换，不新增快捷按钮。
- 选出队长后，列表顶部出现团队群聊这一条普通样式的特殊会话项；它只有群聊图标和标题。点开后沿用 craft 聊天面板与统一输入框，不 @ = 广播，@某 Agent = 私发。不要把输入框、发送按钮塞进会话列表本身。
- 团队群聊的每条消息、任务简报和待审简报必须显示发送者头像、模型/Runtime、稳定序号和身份标签；数据只从 `SessionEvent.actor`、TeamProjection 和团队规则派生，不能在 renderer 另存。
- 状态显示用 Lead 加的 i18n key：待安排/进行中/待审查/完成/取消。
- 序号按 createdAt 固定，不随最新消息排序变化。
验收：与原 Craft 截图对比，布局、间距、菜单层级不变；模型、序号、身份、状态只作为原字段增量显示；原标签可设置队长并触发后端唯一性规则；有队长后只增加一条普通样式的团队群聊会话项；typecheck:all 绿。
```

---

## A3 — 全部文件 + Library（后续独立契约波次，当前只派剩余项）

```
角色：A3。目标：在已落的 raw「全部文件」只读入口上继续做用户选的本地素材目录、类型过滤/缩略图、拖入专业工作面和 Library 资产层（来源/hash/许可/使用位置/回滚），别做成本地知识库。读 docs/04 D15/D18、docs/32 §3。
改这些文件（仅你）：
- 新建 app/packages/server-core/src/services/file-index.ts（+ test）：扫描目录、类型过滤（图片/md/网页/视频/音频/PPT/代码/字体/模板）、缩略图/索引；只读浏览自动，写操作（移动/重命名/删除/批量分类）必须经 permission + timeline。
- app/packages/server-core/src/handlers/rpc/files-library.ts（Lead 在 Wave 0 已建壳并注册，你填实现，消费 Lead 冻结的 files.* 通道与 files.ts 契约）
- 新建 app/apps/electron/src/renderer/components/files/*（raw file view、类型过滤、拖入 Stage 入口）
- 新建设置页目录/过滤规则组件
禁改：protocol/*、团队相关文件、SessionManager* 核心、其它 Agent handler。需要新通道/类型 → 回 Lead。
要求：
- 全部文件 = raw 本地文件视图（默认根“我的工作区”已落，可继续加素材目录/过滤/缩略图）。
- Library = 项目选用/授权/索引后的资产层，记录来源/hash/许可/使用位置/回滚；不另起存储目录。
- AI 分类/移动/重命名/删除走 permission + timeline，可回放可撤销，不静默外发。
验收：可选本地文件夹并按类型过滤；写操作触发 permission；Library 只收授权资产；file-index 有目标测试；typecheck:all 绿。
```

---

## A4 — External Job 模型（后续独立契约波次，当前不要派）

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

## A5 — 管理 Agent 全局专栏（Wave 2）

```
角色：A5。前置：Lead 的管理 Agent 后端（`manager:global` + workspace hidden 投影锚点）已合入。目标：在“所有会话”层做跨文件夹常驻管理 Agent 专栏 + 可选右下角唤起按钮 + 应用退出行为设置。读 docs/17 §2/§7、docs/04 D17。
改这些文件（仅你）：
- 新建“所有会话”层的管理 Agent 专栏（跨文件夹存在；显示软件级身份，不混进项目队员列表；不把消息写进某个 workspace 普通会话）
- 右下角按钮只作为唤起/最小化入口，不能作为主要消息位置
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
