# 项目落地方案审查报告

> 审查对象：Fleet / AI Work Workbench 的整体落地方案（PROJECT-DIRECTION、DECISIONS-LEDGER、
> FORBIDDEN-ANTIPATTERNS、契约、20 个模块、并行 Agent 模型、持久化权威）。
> 审查基线：仓库 HEAD `48bbed089`；`app/package.json` = 0.11.1。
> 日期：2026-07-11。
> 审查方法：通读核心文档 + 抽读契约/模块 + 用 git/文件系统核对文档与代码的真实一致性。

---

## 0. 总体判断（先看这一段）

这套方案的**思想质量非常高**：架构边界清晰、反模式清单成体系、决策有可追溯的 ID 与反转记录、
契约（子代理交接、Git/PR 交付、持久化权威）写得比多数商业项目都扎实。产品定位（"人拥有顶部 10%
判断力和底部 10% 常识护栏，Agent 执行中间 80%"）是一个真正能指导取舍的判断标准，而不是口号。

但审查发现**一个决定性的结构性问题**，以及若干需要修正的地方。按严重程度排序如下。

**一句话结论**：这是一个"文档深度 104 篇、代码深度约等于零"的项目。计划的成熟度远远领先于实现，
两者的差距本身已经成了最大的落地风险。当前最该做的不是继续完善文档，而是让第一个真实回路跑起来。

---

## 1. 严重问题（P0：会直接影响落地成败）

### 1.1 计划与代码严重脱节，几乎没有任何 Fleet 代码存在

**事实（已核对）：**

- `git log` 显示 `app/` 被触及 147 次，但决定性的那一次是 `48bbed089`
  "replace monorepo app with Craft v0.11.0 and port protocol freezes"——它**把整个 app 重置回了上游
  Craft v0.11 原版**（该 commit：241 文件变更，+20562/−3472，且改动集中在上游文件与 docs）。
- 更早的 commit `f2ee2076a` 曾经加入过 Fleet 协议类型桩（`actor.ts`、`agent-session.ts`、
  `canvas.ts`、`lease.ts`、`session-event.ts`）。**这些文件在当前 HEAD 中已全部消失。**
- 当前 `app/packages/shared/src/protocol/` 只剩上游文件（`channels.ts`、`dto.ts`、`events.ts`、
  `routing.ts`、`types.ts`），`grep` 其中的 `AgentSeat / TeamRun / RuntimeLane / ArtifactRef /
  WorkspaceFileLease / ActorRef` **零命中**。
- 全仓 1497 个 `.ts/.tsx`（除 node_modules）中，Fleet 概念的唯一命中是一个构建产物里的
  `.js.map`——即完全没有实现代码。

**含义：**

- 20 个模块（M00–M19）全部是 `not implemented`。连 M00 平台脊柱、M03 内部动作注册这样的**地基**
  都还没有一行真实代码。
- `CURRENT.md` 说的"W0.1 协议冻结"在实现层面**已被回滚**，只剩文档里的文字冻结。文档给人的印象
  （"protocol types retained""再冻结完成"）与代码现实（纯上游 Craft）之间存在偏差。
- 这意味着：**目前所有 104 篇文档描述的是一个尚不存在的系统。** 风险不是"方案不对"，而是"方案还
  没开始验证"——而未经代码验证的架构，其中的错误无法被暴露。

**更好的方案：**

1. **立刻把重心从"写计划"切到"跑通第一个回路"。** 按方案自己定的 Phase 顺序，第一个该落地的其实
   不是 Terminal（Phase 1），而是 **Phase 2 内部动作脊柱（M03/M00）的最小可用切片**：一个人类动作
   和一个 Agent 动作，通过同一条 registry 路径，产生一条带权限的 timeline 事件。方案里已经把这个
   定义得很清楚（PROJECT-DIRECTION §6 Phase 2 退出标准），照做即可。
2. **在 `CURRENT.md` 里诚实标注实现状态**：明确写"当前 app = 纯上游 Craft v0.11，Fleet 协议桩已随
   `48bbed089` 回滚，尚无模块实现"。现在的 `CURRENT.md` 读起来像是已有 Fleet 协议保留，容易误导
   接手的 Agent。
3. **给文档与代码的比例设一个软约束**：在下一个真实回路落地之前，冻结新增架构文档。方案自己的
   反模式清单第 5 条已经说"不要用 typecheck 冒充能力真相"——同理，不要用文档深度冒充落地进度。

> 这是本次审查最重要的一条。其余问题都是在这条之下的优化。

---

## 2. 需要修正的地方（P1：结构或一致性缺陷）

### 2.1 "去官僚化"只做了一半——模块头部仍带着已废弃的 Wave/Gate/Lock 机制

**矛盾点（已核对）：**

- 顶层文档（`AGENTS.md`、`START-HERE.md`、`DOCUMENT-REGISTRY.md`）明确宣布：Wave、packet、
  readiness gate、mandatory status block 全部**退役**，`loops/`、`WAVE-MODULE-MAP.md`、
  `agent-packets/` 只是历史。
- 但 `docs/modules/00-platform-spine.md` 的头部仍写着：
  `Execution gate: Locked pending W0.1 contract re-freeze`、`Wave: W1`、
  `Delivery loop: L01 — docs/loops/L01-platform-action/`、`Spec maturity: contract draft`。
- 也就是说，一个接手 M00 的 Agent 读顶层会以为"没有门禁"，读模块头会以为"被 Lock 住、要等 W0.1
  再冻结"。**同一件事两套互相矛盾的授权信号。**

**含义：** 这正是方案自己在反模式清单里禁止的"第二套指令系统"。退役动作清理了目录层，却没有下沉
到 20 个模块的头部，留下了自相矛盾的治理残留。

**更好的方案：**

- 对 20 个模块做一次**头部规范化**：删除 `Execution gate / Wave / Delivery loop / Spec maturity /
  Locked` 这些字段，只保留 `Capability status`（如 `not implemented`）和 `Depends on`（真实技术
  依赖，而非 Wave 依赖）。这与 DOCUMENT-REGISTRY 里"用 Git 历史保存旧流程状态"的原则一致。
- 把仍然**技术上成立**的依赖（例如 M03 依赖 M00 的持久化）保留为一句自然语言，而不是 L01/L02 标签。

### 2.2 阶段编号与执行顺序不一致，是已知的认知负担来源

- PROJECT-DIRECTION §6 的叙述顺序是 Phase 0 → 1(Terminal) → 2(Action Spine) → …，但紧接着的
  Phase→Wave 表又说**Phase 2 要在 Phase 1 之前执行**（W1/L01 先于 W2/L02）。文档自己加了注释解释，
  但"叙述顺序 ≠ 执行顺序"这件事本身就是每个新读者都要踩一次的坑。
- 建议：既然 Wave 已退役，干脆**按真实执行顺序重排 Phase 编号**（Action Spine 就叫 Phase 1），
  彻底删掉 Phase↔Wave 映射表。少一层间接，就少一层出错。

### 2.3 版本号漂移

- `app/package.json` = **0.11.1**，但 `UPSTREAM-BASELINE.md` 与 `CURRENT.md` 都写 **0.11.0**，
  上游 tag 也是 v0.11.0。这是小事，但正是这种小漂移会让"基线到底是什么"变得不可信。
- 建议：核对 0.11.1 是上游的 patch 版本还是本地改动，并在 `UPSTREAM-BASELINE.md` 里写清楚
  "0.11.0 tag + 本地 patch 到 0.11.1（原因：…）"。

### 2.4 反模式清单虽好，但缺少"正向验收样例"

- `FORBIDDEN-ANTIPATTERNS.md` 把"不要做什么"列得很全，但一个新 Agent 读完仍不知道"一个合格的
  M03 动作长什么样"。方案高度依赖"禁止清单 + 质量标准"，却没有一个**参考实现或黄金样例**。
- 建议：等第一个 M03 动作落地后，把它固化为 `docs/modules/EXAMPLE-golden-action.md`，作为所有
  后续模块的可复制模板。这比再写十条禁令更能防止跑偏。

---

## 3. 有更好方案的地方（P2：设计层面的可选优化）

### 3.1 持久化：filesystem-first 的赌注需要一个明确的"迁移触发条件"

- 现状（ADR-0034 / D48）：W1/W2 坚持用 Craft v0.11 的文件系统存储（sessions JSONL、
  `~/.craft-agent` workspaces、views.json），**明确拒绝** SQLite 控制面，改用 SQLite 需要新的
  superseding ADR。这个"先别过度设计"的克制是对的。
- 但风险在于：**动作幂等/undo 关联、lease 的重启对账、ExternalJob 的 provider 对账**这三件事，本质
  上是需要事务性和索引查询的。纯 JSONL/文件在并发写和崩溃恢复下，很容易在这三处踩坑——而这恰恰是
  M03/M05/M08 的核心。
- 更好的方案：不是现在就上 SQLite，而是**预先在 PERSISTENCE-AUTHORITY-MAP 里写死一个客观的迁移
  触发条件**（例如："当 lease 重启对账或 job 幂等出现第一个文件系统无法原子保证的真实 bug 时，
  自动触发 SQLite ADR"）。把"何时该换"变成可观测的工程信号，而不是等到踩坑后再争论。

### 3.2 多代理成本控制：TaskBrief 契约很好，但缺一个"熔断"机制

- `subagent-context-handoff.md` 把"禁止裸 spawn、禁止灌 transcript、必须带 TaskBrief、大输出用
  指针"写得非常到位，也正确引用了"多代理可能是单代理 15× 成本"这一事实。
- 但契约止于"成本可见"（usage 可归因），没有"成本可**阻断**"。一个失控的 spawn 模式会烧完预算才被
  发现。
- 更好的方案：在 TaskBrief 的 `budget` 字段之外，增加一个**平台级硬熔断**——当一次 TeamRun 的
  累计 token/工具调用越过阈值时，自动暂停并要求 L2 确认再继续。这与 D36"本地资源上限是产品行为
  而非异常"的思路完全一致，只是把它从"本机资源"扩展到"token 预算"。

### 3.3 Agent-first 的 Git/PR 交付：合并权限的默认档位偏激进

- `git-pr-delivery.md` 主张 Agent 直接跑 `git`/`gh`，合并"通常是 L2"。方向（不做人类 PR review
  工作台）是对的、也符合业主意图。
- 但"Agent 自动 merge 到 remote main、只要 L2"对一个**本地优先、单人**的产品来说，风险收益比不划算：
  一次错误的自动合并的破坏力，远大于它节省的那一次人工点击。
- 更好的方案：把**"push 分支 + 开 PR"设为 L1/L2（放手让 Agent 做），但"merge 到 main"默认 L3
  （显式确认）**。这不违背"Agent-first"——Agent 仍然完成 99% 的工作，人只在唯一不可逆的那一步点
  一下头。可以对已配置 CI 且绿灯的仓库提供一个可选的降档开关。

### 3.4 "五层架构 + 20 模块"的范围，对当前的实现能力是过载的

- 方案描绘的是一个完整的"空间化工作操作系统"（终端、文件、浏览器证据、无限画布、AIGC、视频、
  网页、演示、设计九大原生模块）。这个愿景本身自洽。
- 但结合 §1.1 的现实（零实现），20 模块的范围会持续诱导"再多写一篇模块文档"而非"再落地一个回路"。
- 更好的方案：**显式冻结 M06–M19 的规格演进**，在文档里标注"deferred until first creative loop
  (Phase 6A) 真正跑通"。只保留 M00/M03/M02/M04/M05 五个脊柱模块为"活跃"。方案的 Phase 6A 已经把
  第一个创意回路收敛成"text → 一次真实图像 job → ArtifactRef → 画布"，这是对的——那就让更下游的
  模块彻底进入休眠，直到脊柱被验证。

---

## 4. 做得好、建议保留的地方（避免"改过头"）

- **决策台账（DECISIONS-LEDGER）**：53 条决策，带 ID、日期、反转记录（D6/D18/D22/D27-R 都有
  Amended）、影响模块和实现文件。这是整套方案最有价值的资产，**不要动它的结构**。
- **反模式清单**：把"第二套 session/权限/记忆/job/artifact/shell 权威"作为硬红线，是防止这类
  雄心项目失控的正确护栏。
- **业主原声隔离机制（D37/OWNER-VOICE/D51/D52 逐字引用）**：把"业主给概念、Agent 选技术路线、
  禁止向业主问工程意见"制度化，非常成熟，能防止需求在传话中变形。
- **子代理交接与 Git/PR 契约**：即使方向上我在 §3.2/§3.3 提了优化，这两份契约的完成度已经超过
  多数团队，值得作为模板保留。
- **craft-first 的克制**：不另起 shell、在原版 Craft 上做简化、拒绝过早上 daemon/SQLite——这些
  "少即是多"的取舍是对的，请顶住"凭空增加"的诱惑继续保持。

---

## 5. 建议的优先级顺序

| 优先级 | 行动 | 依据 |
|---|---|---|
| **P0** | 落地第一个真实回路：M03/M00 最小动作切片（人+Agent 同路径、带权限的 timeline 事件） | §1.1 |
| **P0** | 在 `CURRENT.md` 诚实标注"当前 = 纯上游 Craft，无 Fleet 实现，协议桩已回滚" | §1.1 |
| **P0** | 第一个回路落地前，冻结新增架构文档 | §1.1 |
| **P1** | 规范化 20 个模块头部，删除已退役的 Wave/Gate/Lock 字段 | §2.1 |
| **P1** | 按真实执行顺序重排 Phase 编号，删除 Phase↔Wave 映射表 | §2.2 |
| **P1** | 修正版本号漂移（0.11.0 vs 0.11.1） | §2.3 |
| **P2** | 冻结 M06–M19 规格演进，只保留五个脊柱模块为活跃 | §3.4 |
| **P2** | 把持久化迁移触发条件写成可观测的工程信号 | §3.1 |
| **P2** | 增加多代理 token 硬熔断；把 merge-to-main 默认降到 L3 | §3.2 / §3.3 |
| **P2** | 第一个 M03 动作固化为黄金样例文档 | §2.4 |

---

## 附：审查依据（可复核）

- `git log --oneline` + `git show --stat 48bbed089` / `f2ee2076a`：确认 app 被重置回上游、Fleet
  协议桩已消失。
- `grep -rn` protocol 目录：确认零 Fleet 类型命中。
- `find app -name "*.ts*" | wc -l` = 1497；Fleet 概念命中仅一个 `.js.map` 构建产物。
- `app/package.json` version = 0.11.1，与 UPSTREAM-BASELINE/CURRENT 的 0.11.0 不一致。
- `docs/modules/00-platform-spine.md` 头部仍含 `Execution gate: Locked` / `Wave: W1` / `L01`，与
  顶层"Wave 已退役"矛盾。
- CODE-MAP 中声称的 AppShell/LeftSidebar/MainContentPanel/NavigationContext 路径均真实存在。
