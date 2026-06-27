# 35 · 任务进度 Progress 方案（团队 / 非团队）

> 状态日期：2026-06-22
> 效力：本文是 Fleet「任务进度（Progress）」功能的设计单一真相。落地必须遵守 `docs/00A` 红线与 `AGENTS.md` 规则（不建第二套 store、agent-native、进 timeline）。
> 一句话：做一个像 Claude Cowork 的「当前工作清单 + 进度」——把当前这轮工作拆成有状态的小步骤，人和 Agent 共用、实时显示、可回放。

---

## 1 · 先厘清：Progress 不是已有的哪几样（避免重复造）

craft 已有四个相邻概念，Progress 与它们互补、不重叠：

| 已有 | 是什么 | 与 Progress 的关系 |
|---|---|---|
| `set_session_status`（todo/needs-review/done…） | 会话**整体所在泳道**，单选 | Progress 是会话**内部的步骤清单**；一个「进行中」会话可有 3/5 进度 |
| `SubmitPlan`（plan.md + 审批） | 一次性**计划提案**，需用户批准 | 计划被接受后可**播种**成初始 Progress 清单；Progress 负责执行期实时跟踪 |
| `ActiveTasksBar`（agent/shell 后台进程） | 正在跑的**子进程**（带耗时/kill） | Progress 是**逻辑步骤**，不是进程；两者可同时存在 |
| 团队任务 `assignTeamTask` | 派给某成员的**工作项**（跨会话） | 团队任务是「做什么」；成员在自己会话里执行它时产生的步骤清单就是 Progress（「做到哪了」） |

**结论：Progress = 每个 craft session 内一条有序、有状态的步骤清单。** 它是会话级元数据，和 `labels`/`status` 同层，复用同一套 SessionEvent + 持久化，不新建 store。

---

## 2 · 数据模型（复用 SessionEvent，不双写）

```ts
// packages/shared/src/protocol/progress.ts（新）
export type ProgressTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface ProgressTask {
  id: string
  title: string
  status: ProgressTaskStatus
  /** 谁建/改的（人或 Agent），用于团队归因与回放。 */
  actor?: ActorRef
  /** 可选一句话备注/活动态文案（如 “正在跑测试”）。 */
  note?: string
}

/** 会话级进度（整条清单 = 会话当前真相，replace-all 语义，和 labels 一致）。 */
export interface SessionProgress {
  tasks: ProgressTask[]
  updatedAt: number
}
```

事件（加进 `dto.ts` 的 `SessionEvent` 联合，紧挨 `labels_changed`）：

```ts
| { type: 'progress_updated'; sessionId: string; tasks: ProgressTask[] }
```

- **存储**：挂在 `ManagedSession.progress`，随 `session.jsonl` 持久化，和 `setSessionLabels` 完全同机制（`managed.progress = …` → `sendEvent('progress_updated')` → `persistSession` → `flushSession`）。零新增 store、零第二套真相。
- **replace-all**：和 `set_session_labels` 一样整条替换，避免增量合并的并发歧义；增量操作（勾掉一项、加一项）由工具/UI 在本地构造新数组后整条提交。

---

## 3 · agent-native：人和 Agent 共用一套动作（D7/D14）

一个结构化工具，人和 AI 同一条路径，全部进 timeline：

```ts
// session-tools-core：set_session_progress
set_session_progress({ tasks: ProgressTask[] })   // 整条替换；safeMode: allow（低风险，像 status/labels）
```

- Agent：把当前工作拆成步骤、随推进改 `status`（pending→in_progress→completed）。
- 人：在 UI 勾选/重排/增删，走同一个 `sessions:command { type:'setProgress', tasks }` → SessionManager → 同一条 timeline。
- 权限：进度更新是 **L0/L1**（会话内元数据，像 labels），默认不弹权限，保持 Cowork 那种顺滑；清空/批量删可定 L1。
- 回放：每次 `progress_updated` 进 timeline，可回放、可撤销；活动态文案（note）只作显示投影。
- 计划衔接：`SubmitPlan` 被接受后，后端可用计划条目播种一份初始 `tasks`（可选，二期）。

---

## 4 · 非团队模式 UI（只挂 craft 现有挂点）

| 想显示 | 挂点（改现有，不新建壳） |
|---|---|
| 当前工作清单 + 进度条（主显示，像 Cowork 卡片） | `renderer/components/app-shell/ChatDisplay.tsx` 的消息流里，当会话 `progress.tasks` 非空时渲染一张**进度卡**（复用现有卡片/`EntityRow` 风格）：每项 ✓/spinner/○ + “N/M 完成” + 进度条 |
| 会话行快速扫一眼的进度 | `SessionItem.tsx` 的 `titleTrailing`/`badges` 槽加一个小药丸 “3/5”（复用现有 `EntityListBadge`），不新建组件 |
| 输入区上方“正在做哪一步” | 复用 `ActiveTasksBar` 同一带状区域，显示当前 `in_progress` 项标题（可选，二期） |

- 不新建 Progress 页、不新建 Progress store、不做悬浮控制台。进度卡就在原聊天流里，和计划卡/工具卡同层。
- 人勾选/重排通过卡片上的交互回调 → `sessions:command setProgress` → 后端，不在 renderer 存私有状态。

---

## 5 · 团队模式 UI（派生 rollup，复用团队投影 + 群聊）

团队进度 = 各成员会话进度的**派生聚合**，不是新存储（和我刚落地的 `TeamProjection` 一致）。

### 5.1 两层
1. **成员自身进度**：每个成员 session 仍用 §2/§3 的同一套进度（团队模式不另起一套）。
2. **团队级 rollup（派生）**：在 `TeamProjection` 上加派生字段，从各成员 `progress` + 会话 status + 团队任务/待审事件算出来：

```ts
// 加到 TeamMemberProjection（派生，不写回 rules）
progress?: { done: number; total: number; activeTitle?: string }

// 加到 TeamProjection（团队 rollup，派生）
progressRollup?: { active: number; awaitingReview: number; done: number; totalTasks: number }
```

### 5.2 显示位置（都在团队群聊，docs/33 §1.1）
- **团队群聊顶部一行 rollup**：例如「团队进度：3 进行中 · 1 待审 · 2 完成」，让人一眼看清“整体到哪了”。
- **成员消息/汇报卡**前缀已有头像/模型/序号/身份（docs/33 §1.1 §5），再补一个 “4/6” 小进度，点开跳成员会话看完整清单。
- **待审卡**：成员进 `awaitingReview` 时群聊插待审简报卡（已设计），其进度此刻一般是 total/total。
- 群聊只放**短 rollup 和引用**，完整步骤清单留在成员会话（符合 docs/33 §4 摘要边界）。

### 5.3 与团队任务的关系
- 队长用 `assignTeamTask` 派“做什么”；成员在自己会话用 `set_session_progress` 拆“怎么做、做到哪”。
- 团队 rollup 同时反映：会话 status（泳道）+ 成员 progress（步骤完成度）+ 待审队列。三者都是已有/派生，无第二套真相。

---

## 6 · 落地顺序（按红线增量，分批 typecheck）

1. **后端协议 + 脊柱** 🟡 候选/待合入（已实现 + typecheck 通过：shared/session-tools-core/server-core/electron；`progress.test.ts` + `progress-cli-runtime-persistence.test.ts` 已跑 6 pass；**未提交主线**）。
   - **已接通**：`protocol/progress.ts`（类型 + `summarizeProgress`/`normalizeProgressTasks`）；`dto.ts` 的 `progress_updated` 事件与 `setProgress` 命令；agent-native 工具 `set_session_progress`（handler + 绑定到 session-scoped callbacks）；`SessionManager.setSessionProgress`（内存写 + 发 `progress_updated` 事件，镜像 `setSessionLabels`）；`sessions:command setProgress`。
   - **持久化已补齐为候选实现**：`StoredSession` / `SessionHeader` / `SESSION_PERSISTENT_FIELDS` 已显式加入 `progress`，`session.jsonl` header 读写会保留进度；新增 `progress-cli-runtime-persistence.test.ts` 覆盖 `pickSessionFields` 与 JSONL round-trip。
2. **非团队 UI**：ChatDisplay 进度卡 + SessionItem 进度药丸。需在本机视觉验收。
3. **团队 rollup**：`TeamProjection` 派生进度 + 团队群聊顶部 rollup 行 + 成员卡进度前缀。
4. **二期**：计划播种进度、输入区当前步骤、活动态文案动效。

## 7 · 禁止（沿用 docs/00A）

- 不新建 Progress store / 第二套 session 字段真相；只用 `ManagedSession.progress` + SessionEvent。
- 不做假进度：未真正驱动的步骤不显示为 in_progress/completed。
- 团队 rollup 只能派生，不把成员完整清单复制进群聊 transcript 或 team rules。
- 人能做的勾选/重排，Agent 有等价 `set_session_progress`；都过同一条 timeline。
