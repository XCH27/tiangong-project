# 00A · UI 改造红线与挂点地图（动手前必读 · 单页）

> 状态日期：2026-06-22
> 效力：这是「改 UI / 加功能前」的唯一速查闸。它把分散在 `AGENTS.md`(规则 9/13/16/18/23/24/35/36)、`docs/18 §7`、`docs/32 §0/§5`、`docs/01 §3` 的反跑偏规则**收口成一页**。冲突时仍以 `AGENTS.md` 和 `docs/18` 原文为准，但**动手前先过这一页**。
> 为什么存在：Agent 反复在 UI 上「胡乱加东西」——新建壳层、造第二套真相、堆散按钮、做假按钮、改共享契约。下面是硬约束，不是建议。

---

## 1 · 动手前的三道闸（挂槽三问，全过才能写代码）

加任何页面 / 按钮 / 输入语法 / 工具前，先用一句话回答：

1. **挂哪个槽？** 它挂在 craft 现有的哪个 Surface 的哪个挂点（具体到 §4 的文件）？如果答案是「我得新建一个壳/页/store」——**停**，回 §3 自查，多半是错的。
2. **用哪套动作？** 人在 UI 的写操作，对应哪个**已存在**的结构化工具/动作信封 + permission？人能点、Agent 不能复现的暗状态 = 违规。
3. **怎么回？** 它怎么进 `SessionEvent`/timeline，怎么撤销/回滚？进不了 timeline 的写操作 = 不做。

三问答不齐 → 不写。答案是「新建」→ 默认错，除非命中 §5 的唯一例外。

---

## 2 · 改 UI 的唯一正确姿势

**默认界面不重做，只在 craft 原挂点改字段、增必要入口。** 保留原工作区、会话列表、聊天面板、标签、设置、BrowserPane 的设计语言与组件。需要新能力时，**先在原组件上加字段/分支**，原结构确实没有合理挂点时才新增——且只能是 §5 的四个专业工作面。

---

## 3 · 七条硬「不要」（命中任意一条就是跑偏）

1. **不新建壳。** 不造 `WorkbenchShell`、三栏 Stage/Inspector/Context、全局底部 Action Ticker、团队控制台。改原 `AppShell` / 原面板。（AGENTS 9，docs/18 §7）
2. **不造第二套真相。** 只用 craft 的 `SessionManager`/`SessionEvent`/permission/timeline；不新建第二套 conversation/session store、team store、身份 store、消息库。手动编辑写进原 `config`/`preferences`/`labels`。（AGENTS 13，docs/18 §7，docs/32 §5）
3. **不做假按钮。** 没接真实后端/原生引擎/会话路由的按钮必须 `disabled` 或明确报错，**不准显示为可用、不准谎称完成**。（AGENTS 23，docs/18 §1.5，docs/32 §5）
4. **不碰共享契约。** `protocol/{channels,routing,dto,index,team}.ts`、`transport/channel-map.ts`、`shared/types.ts`、`handlers/rpc/index.ts`、`handler-deps.ts`、`i18n/locales/*.json` 由 Lead 冻结，对并行 Agent **只读**。需要新 channel/event/type/i18n key → **回 Lead 加**，不自己改。（AGENTS 36，docs/32 §0）
5. **`@` 只找人。** `@` = 人/Agent/会话/身份；`/` = Skill/命令/模板。不保留 `@Skill` 双入口，不加 `@所有人` 语法（不带 `@` 即广播）。（AGENTS 16，docs/32 §5）
6. **身份不双写。** 队长/代码/设计/审查等身份**只在 craft 原标签系统**（`labels/config.json` + session `labels`）表达；不在 team rules、renderer 或第二处再定义一套身份。加/取消「队长」标签就是升/降队长。（docs/18 §3.2，docs/33）
7. **不用万能 patch。** 不用一个通用 Inspector / 通用 `DesignPatch` 强行解释设计、文档、视频、代码的内部结构。各工作面用各自原生引擎。（AGENTS 14，docs/01 §2，docs/18 §7）

---

## 4 · 挂点地图：想做 X → 改这个，**别新建**

> 行=你想加的能力；列=craft 现有挂点（精确到文件）。先 `rg` 定位再改；下列文件的所有权与禁改清单以 `docs/32 §3` 为准。

| 你想做 | 改这里（craft 现有挂点） | 别做 |
|---|---|---|
| 会话列表显示模型/Runtime 图标、稳定序号、身份、团队状态 | `renderer/components/app-shell/{SessionItem,SessionList,SessionBadges,SessionInfoPopover,SessionStatusIcon}.tsx` 加显示字段 | 别新建会话卡/团队会话栏组件（旧 `TeamConversationBar` 不复活） |
| `@` 人/Agent/身份、`/` Skill/命令/模板 | `renderer/components/app-shell/input/FreeFormInput.tsx`、`components/ui/mention-menu.tsx`、`rich-text-input.tsx` + 那一个 mentions parser | 别新建输入框/第二套 mention store |
| 团队群聊 | 原 `ChatDisplay.tsx` + 原聊天面板 + 原会话项样式；群聊是「所有会话」顶部一条**原样式**特殊会话项 | 别建群聊页/群聊库，别在会话列表里加输入框 |
| 管理 Agent 入口 | ✅ 已改成 Multica 式右下角常驻/可最小化入口：`renderer/components/app-shell/ManagerAgentLauncher.tsx`，挂在 `AppShell`。当前动作只打开已接后端的 `ManagerSettingsPage`（`managerDecision`/`memory` RPC）；管理对话输入在真实 manager session/RPC 接入前保持 disabled。**不要占用 SessionList 顶部槽**，那里只给团队群聊。 | 别塞进某个 workspace 的普通会话，别把它做成「团队群聊」，别做特权后门绕 permission，别做未接后端的假发送 |
| 团队状态（待安排/进行中/待审查/完成/取消） | 映射到 craft 现有 session status / `SessionStatusIcon`；身份扩展原 `labels/config.json` + session `labels` | 别在团队规则或 renderer 建第二套身份/状态定义 |
| 设置项 / 手动编辑逃生舱 | `renderer/pages/settings/*`、`components/settings/*`，写进 craft `config`/`preferences` | 别另起第二套设置真相 |
| 浏览器 / 网页标注 / 设计选择 | `renderer/components/browser/*` + BrowserPane/CDP + session timeline | 别建孤岛 Figma 克隆页 |
| CLI Runtime 的会话显示 | Runtime 标识走 `SessionBadges`/`SessionInfoPopover`；顶部工作区后可放同风格 CLI 快捷 pill；具体模型仍走原输入框模型选择器；进程控制走后端 service + permission + timeline | 别在 renderer 存 CLI 进程暗状态、别另起第二套 session，别把顶部按钮做成第二套模型中心 |
| 上下文圆环 / Token 全览 | ✅ 已落（commit `38cb6077`）：Token 环点开是弹层——**上下文用量卡**（Cursor 式：X%满 + ~used/window + 多色分段条 + 每段 token 明细，数据走 `getSessionUsage`→`SessionUsageView.context.segments`，后端 `estimateContextSegments` 估算 system/conversation/other 并归一到真实总数，标 estimated）+ **套餐额度卡**（Claude 式：窗口 label+重置时间+百分比+条，仅 `plan.available` 时显示=连接订阅会员才出现）。CLI 时 window=unknown 显示"由 CLI 管理"。⏳ 待办：tools/skills/mcp/subagents 分段需 agent 装配层埋点才能精确拆（现折进 other）；套餐额度需 provider 暴露订阅额度源才点亮 | 别要求用户输入 `/status`/`/usage`，别另建常驻 Usage 控制台，**别把上下文占用与会员额度画成同一个圆环**（`SessionUsageView.context` 与 `.plan` 分开渲染） |
| 全部文件 / Library | 新建 `renderer/components/files/*`（§5 允许的 raw view 新能力）；后端 `file-index.ts` | 别和「本地知识库」数据源混成一个概念 |
| 管理 Agent 设置（模型/决策/记忆） | ✅ 已落：`pages/settings/ManagerSettingsPage.tsx`（craft 设置骨架），真接 `managerDecision`/`memory` RPC。模型配置写入管理 Agent 设置（跟随工作区默认 / 固定 API 连接+模型+推理强度）；自动决策开关+L2 规则增删；记忆按分区查看/增删，scoped 分区按 scopeId 隔离。CLI Runtime 暂不作为管理 Agent 模型，需 native adapter 后再开放 | 别另做治理控制台；常驻悬浮入口走上面「管理 Agent 入口」行 |
| Progress 进度卡 | ✅ 已落（commit `f1565dc6`）：会话 `progress` 非空时在原 `ChatDisplay` 内容列顶部渲染 `SessionProgressCard`（✓/spinner/○/删除线 + N/M + 进度条 + 活动态）；数据走 `progress_updated` 事件 → `session.progress`（dto.ts + event-processor，重载经 `managedToSession` 仍在）。✅ 会话行 `SessionItem` 的 N/M 小药丸也已落（commit `f36b9340`，`SessionMeta.progress` + `summarizeProgress`） | 别新建 Progress 页/store；未真正驱动的步骤别显示为 in_progress/completed |
| 团队群聊置顶项 | ✅ 已落：有队长后「所有会话」顶部插一条**原样式**特殊会话项（群聊图标+「团队群聊」，commit `ca1b0d21`），点开复用原 `ChatDisplay`；正文来自 `teamConversationSessionId` 的 hidden session。进入群聊会话时顶部显示 `TeamRosterHeader` 花名册（序号+队长冠+身份，commit `f36b9340`） | 别建群聊页/群聊库，别在会话列表里加输入框 |

---

## 5 · 唯一允许「新建独立页面」的情况

只有四个**专业工作面**可以有自己的整页布局和原生引擎，且仍必须接真实 craft session/permission/timeline、共用工作区/全部文件/Library/Agent/记忆/账本：

1. 无限画布　2. AIGC 生成　3. 网页/文档　4. 视频剪辑

除此之外（团队、CLI、管理 Agent、设置、记忆、审查、上下文）**一律在原界面增量改**，不新建壳。

---

## 6 · 提交前自检（缺一条不算完成）

- [ ] 三道闸（§1）都答齐了，且不是靠「新建壳/页/store」。
- [ ] 没命中 §3 任意一条硬「不要」。
- [ ] 改的文件在我名下（`docs/32 §3`），没碰共享契约和别人的禁改清单。
- [ ] 没有假按钮：未接后端的写操作 `disabled` 或明确报错。
- [ ] 人能做的写操作，Agent 有等价结构化工具；都过 permission、进 timeline、可回滚。
- [ ] 页面/按钮/输入语法/工具的变化，已按 AGENTS 规则 35 同步 `AGENTS.md`、相关 docs、bundled docs、tool schema/handlers、MCP 说明。
- [ ] `git diff --check` + `./scripts/craft.sh run typecheck:all` 通过；改了什么按 `docs/32 §6` 格式汇报。
