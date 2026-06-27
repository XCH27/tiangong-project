# 03 · 智能模型路由 + 多模型融合 + 分层缓存

> 状态日期：2026-06-27
> 定位：「让用户不手动选模型、软件按任务类型 + 复杂度自动选最省的跑法，并在值得的地方做多模型融合」的单一真相。对标 **Cursor Auto** + **OpenRouter Fusion**，落在 craft 的 session / permission / timeline 上，覆盖 Fleet 全场景（含视频/设计/动画/提示词/自动化/记忆）。
> 决策依据：`docs/04` **D5**。
> 边界铁律：本主干**只挂 API / OAuth 可控路径**；选了本机 CLI Runtime（`cliRuntimeId != null`）时整条主干跳过（§3）。输入瘦身（rtk/codegraph/Reasonix）**归属 `docs/16`**，本文只调用。

---

## 0 · 一页速览

```
用户消息（API/OAuth 路径）
    │
[Gate] cliRuntimeId? ──是──► CLI 路径，本主干全部跳过
    │否
[杠杆0] 输入瘦身（rtk/codegraph/Reasonix，docs/16）
    │
[缓存] L2 Exact 命中? ──是──► 直接返答（零 API）
    │否
[路由] 任务类型 × 复杂度 → 档位 + 执行面 + Fusion 形态
    ├─ C1–C3 → 单模型 agent（带工具）+ L1 provider cache
    │           └─ 低置信/cascade 信号 → 升级（可选）
    └─ C4 + Fusion 开 → Fusion 流水线
          ├─ Synthesis（文本/审查/分析）
          ├─ Plan（代码重构/自动化/设计/视频）
          └─ 后置 Verification（可选：测试/渲染/diff 交叉核对）
    │
写回缓存(L2/L3) + 成本账本 + 偏好数据采集
```

**降本**：Auto 选档（定单价）→ 输入瘦身（减 token）→ L1/L2/L3 缓存（同前缀低价 / 重复不调 / 摊薄扇出）。  
**提质**：C4 Fusion 综合层（75% 收益在此）+ 级联安全网 + 后置验证。

---

## 1 · 痛点

1. 单选模型体验差：400+ 模型无自动路由层。
2. 成本不可控：没有路由只能全贵或全便宜。
3. Fusion 成本高：Panel→Judge→Writer 每次 4–5 调用，不配缓存失控。
4. 复杂度判断缺失：无量化难度就无法分层触发。
5. 多模态/动作型任务无处安放：视频/设计/自动化不是「文本问答」，纯复杂度路由无法表达执行面。

---

## 2 · 理论依据

| 模块 | 来源 | 结论 |
|---|---|---|
| 级联路由 + 成本感知 | FrugalGPT (2305.05176) | 只在「质量增益 > 成本增加」时升级 |
| 学习型路由器 | RouteLLM (2406.18665) | 偏好数据训练路由器，换模型对仍泛化 |
| Panel 协作 | Mixture-of-Agents (2406.04692) | 互补性 > 数量（2–3 互补优于 5–8 雷同） |
| 裁判机制 | LLM-as-a-Judge (2306.05685) | 输出结构化分析而非直接选赢家 |
| 综合架构 | OpenRouter Fusion 官方 | Panel→Judge(JSON)→Writer；75% 收益在综合层 |
| 回答缓存 | OpenRouter Response Caching | 相同请求零成本返回 |

---

## 3 · 唯一挂点：`SessionManager.sendMessage` 一处分支

```ts
// 伪代码（新增）
if (managed.cliRuntimeId) { await this.runCliRuntimeTurn(...); return }   // CLI 跳过

if (prefs.modelRouting.mode === 'auto' && !managed.manualModelLock) {
  const ctx = await contextShaper.shape(managed, message, attachments)            // 杠杆0
  const hit = await cacheStore.lookupExact(buildCacheKey(managed, ctx))
  if (hit) { await this.renderCached(managed, hit, onAck); return }

  const decision = modelOrchestrator.plan({ managed, ctx, prefs, routingHint })   // 两轴 + 级联
  await this.recordRoutingDecision(managed, decision)                             // timeline + 账本

  if (decision.mode === 'fusion') {
    await this.runFusionTurn(managed, decision, onAck)                            // 内含 L3 panel cache
    return
  }
  managed.resolvedModelOverride = decision.modelId
  managed.resolvedConnectionOverride = decision.connectionSlug
}
// …原有 agent 流程继续
```

编排逻辑放 `services/`，不堆进 SM。

---

## 4 · Part A — Auto 路由

### 4.1 两轴决策（任务类型 × 复杂度）

- **轴 1 · 任务类型**：`chat-text` | `code-tools` | `review-analysis` | `design-canvas` | `animation` | `video-edit` | `prompt-opt` | `automation` | `memory-op` | `media-gen`(→ External Job)。
  - 任务类型隐含能力需求（design→vision+structuredOutput，code→toolCalling），不单独拉能力轴。
  - 少数例外（代码任务偶尔要 vision 看截图）由级联升级兜底（§4.3）。
- **轴 2 · 复杂度 1–4**（FrugalGPT 轴）。

### 4.2 复杂度判定：启发式 + mini 二段

1. **启发式首判（零成本）**：长度、是否含代码、是否「分析/证明/审查」语气、附件、`@文件`、工具意图、会话轮数。
2. **mini 二段判官**：C2/C3 边界模糊时调一次 `runMiniCompletion()` 做二分类（`refineComplexityWithMini`，SessionManager 在 agent 就绪后触发）。

### 4.3 级联升级（cascade，安全网）

启发式可能判错。级联是**可选的安全网**，不是每请求必走：

1. 先用满足能力的最便宜档执行。
2. 出现**低置信信号**才升级：
   - 文本：自报置信度低 / 自一致性差
   - 动作型：`DesignAction`/编辑计划 **schema 校验失败**或工具调用报错
   - 代码：测试/lint 失败
3. 升级条件遵守 FrugalGPT：**仅当「期望质量增益 > 成本增加」**。
4. **按 `latencySensitive` 决定是否启用**：低延迟任务（闲聊）关级联；高价值任务（审查/重构/设计）开。

> 没有级联，复杂度猜错就不可挽回（要么浪费要么质量差）。级联是让 Auto 路由敢于选便宜档的底气。

### 4.4 复用已有「三档」

craft 已有 `tier-models.ts` + `connection.models[0/1/2]` + `getMiniModel()`，`SessionManager` 已支持 `'fast'`/`'default'` 别名。映射：C1→fast，C2→fast/balanced，C3→balanced，C4→best 或 Fusion。

### 4.5 场景路由表

| 场景 | taskType | 默认档位 | Fusion 形态 | 级联 | 依赖 |
|---|---|---|---|---|---|
| 闲聊 / 问答 | chat-text | fast | 无 | 关 | 无 |
| 摘要 / 翻译 | chat-text | fast | 无 | 关 | 无 |
| 代码小改 | code-tools | balanced | 无 | 开 | 无 |
| 跨模块重构 | code-tools | best | **Plan** | 开 | 无 |
| 代码 / 安全审查 | review-analysis | best | **Synthesis** | 开 | 无 |
| 提示词优化 | prompt-opt | 小模型+模板 | **self-fusion** | 关 | 无 |
| 自动化规则 | automation | 创建时预绑 | 默认关 | — | 无 |
| 记忆检索 / 管理 | memory-op | mini/cheap | 无 | 关 | 无 |
| 网页 / 画布设计 | design-canvas | structured+vision | **Plan** + Verification | 开 | 原生引擎(openpencil) |
| 动画 / 时间线 | animation | structured | **Plan** | 开 | 原生引擎 |
| 视频剪辑 | video-edit | tool-reliable | **Plan** + Verification | 开 | 原生引擎 |
| 生图/生视频/图转3D/TTS/部署 | media-gen | — | N/A | — | External Job(`docs/31`) |

> 标注依赖的场景：路由规则和 Fusion pipeline 一并实现，但实际跑通需要对应引擎就绪。pipeline 本身不依赖引擎——代码重构的 Plan Fusion 现在就能跑。

---

## 5 · Part B — Fusion

### 5.1 何时融合

判官先 go/no-go；只有**高复杂度 + 高价值/高风险**才进。默认关（D5）。

### 5.2 Panel：互补优先（MoA / MoAA）

- **2–3 个互补模型**（一个偏逻辑、一个偏代码/工具、一个偏文案），不是 5–8 个雷同。
- 固定 panel 成分（设置里配好）利于 L1/L3 缓存命中。
- 并行 `Promise.allSettled` + 每成员独立超时；≥1 成功才进判官；全失败降级单模型 + 提示。
- `fusionDepth` 标记，panelist 不能再触发融合（递归保护）。

### 5.3 两种 Fusion 形态 + 后置验证

| 形态 | 用于 | Panel 产出 | Judge | Writer | 
|---|---|---|---|---|
| **Synthesis** | 文本/分析/审查/研究/写作 | 各自答案 | 结构化 JSON（consensus/contradictions/partial_coverage/unique_insights/blind_spots），temp=0 | 综合写终答，**关外部工具**，用最强模型 |
| **Plan** | 动作：代码重构/自动化/设计/视频 | 各自**动作方案**（DesignAction 序列 / 编辑 ops / 自动化步骤） | 比对方案：冲突/覆盖/风险/可行性 | 产出**唯一可执行动作序列**，保 structuredOutput，经 permission+timeline 执行 |

**后置 Verification（可选，不单独成形态）**：Fusion 产出后，若任务可验证（代码有测试、渲染有产物），用 1–2 个模型对结果**交叉取证核对**（跑测试/看渲染/diff/lint）。不同模型抓不同问题（一个查逻辑、一个查安全、一个查风格）。通过则采纳，否则回 panel 修订。这是 Synthesis/Plan 的可选后置步骤，不是每个 Fusion 必走。

> Plan Fusion 是 Fleet 的护城河：把「多模型协作」从「合成文本」推进到「协作产出动作」。代码重构的 Plan Fusion 现在就能实现；设计/视频的 Plan Fusion pipeline 一并建好，实际跑通待原生引擎。

### 5.4 预算分档

| 预设 | panel 成分 | 成本 | 质量 |
|---|---|---|---|
| **Quality** | 高端互补模型 | 高 | 上限高 |
| **Budget** | 中价快速模型 | 低（参考 DRACO 约 0.40×） | 接近前沿 |
| **Custom** | 用户自配 | 取决于配置 | 取决于配置 |

### 5.5 OpenRouter 用法

推荐 **本地 MoA + OpenRouter 作 provider**（可控、可缓存、可接记忆），不黑盒调 Fusion API。`openrouter/auto` 可作 fast tier 候选。

---

## 6 · Part C — 分层缓存

| 层 | 是什么 | 省什么 | 现状（2026-06-27） |
|---|---|---|---|
| **杠杆0 输入瘦身** | rtk/codegraph/Reasonix（`docs/16`） | 减少进入请求的 token，并抬 L1 命中 | 🟨 `context-shaper.ts` 占位（no-op） |
| **L1 Provider Prompt Cache** | 模型侧前缀缓存 | 同前缀按 cache-read 低价 | ✅ 已有；`cache_ledger` 经 `emitSessionEvent` 进聊天 timeline |
| **L2 Fleet Exact** | 整段回答/方案复用 | 跳过整次调用 | 🟨 磁盘 `~/.craft-agent/cache/exact/`；Fusion + 单模型 complete 写入；git HEAD 失效 |
| **L2 Semantic** | 语义近似命中（默认关） | 跳过整次调用 | 🟨 内存 + 磁盘 `cache/semantic/`；char-hash 嵌入；重启可加载 |
| **L3 Panel 中间缓存** | panel 各模型答案/方案 | 摊薄 Fusion 扇出 | 🟨 磁盘 `cache/panel/`；Fusion + `panelIntermediate` 开时生效 |

> L3 与 Fusion 同步建——Fusion 不配 panel 缓存 = 太贵用不起。

### 6.1 L1（已有，复用）

stable/volatile 拆分（#862）：稳定块→prefix（system/工具 schema/workspace capabilities），易变块→user tail（时间/session_state/source）。**记忆注入进 user tail，不进 system prefix**。

### 6.2 L2 Exact + Semantic

**Exact（优先，风险低）**：
```
cacheKey = hash(workspaceId, connectionSlug+modelId(或 fusionProfileId), taskType,
  toolSetHash, memoryInjectionHash, permissionMode, normalizedUserMessage, attachmentHashes[])
```
命中条件：TTL 内；项目 git HEAD 未变；无强制刷新。适用：C1–C2 问答 ✅、Fusion 终答/方案 ✅、含 write/bash ❌。

**Semantic（默认关）**：相似度 >0.95 + 同 workspace+toolSet + 无未解决 diff + `cacheConfidence: high` + timeline 可审计；仅 C1 闲聊/格式化；**永不缓存 panel 中间结果**；**动作型任务默认禁用**。

### 6.3 L3 Panel 中间缓存

```
panelKey = hash(panelModelId, stableSystemPrefixHash, normalizedTaskPrompt, webSearchScope?)
```
每个 panelist 先查命中（标 `agentId + cacheHit`），未命中才 `queryLlm`。Plan Fusion 同理缓存「模型→动作方案」。保护：TTL 短于 L2；带 timestamp/source 给 Judge 判新鲜；security/review 类 C4 禁用；允许部分命中。

### 6.4 统一 CacheStore（与 MemoryStore 同级）

```
~/.craft-agent/cache/
  prefix-stats.jsonl   # L1 观测
  exact/{hash}.json    # L2 Exact
  semantic/index.db    # L2 Semantic（默认关）
  panel/{hash}.json    # L3
```
失效统一：TTL / git HEAD 变 / 删记忆 / 改 tool 集 / 改 panel 成分 / 手动清。

---

## 7 · 与三层 Agent 的配合（D11/D12/D17）

> 原则：**谁该是预算守门人，谁就不能同时是预算消费者。**

### 7.1 三层各自的路径权限

| Agent 层 | 默认路径 | Auto | Fusion | CLI | 理由 |
|---|---|---|---|---|---|
| **管理 Agent** | **固定单一 cheap API 连接**（独立，与项目连接分离） | ❌ | ❌ 永不 | ❌ | 守门人必须可预测、可审计；Auto/Fusion 污染 L0–L3 判定一致性 |
| **队长 Agent** | **API**（best/Auto） | ✅ | ✅ 默认触发者 | ⚠️ 可选（丢 Fusion） | Fusion 只能由 API 路径触发；队长是 D5 smart 判官 |
| **执行 Agent** | **hybrid（按任务）** | ✅ | ✅ 按 scope | ✅ 代码用 CLI；设计/视频用 API+DesignAction | 锁任一条都丢价值 |

### 7.2 决策权分层

| 决策 | 谁做 | 定级（D12） |
|---|---|---|
| **策略**：预算上限、Fusion scope、连接白名单、场景覆写、panel 成分 | 管理 Agent（设置页配，用户确认） | L2/L3 |
| **战术**：本子任务走 API 还是 CLI、要不要 Fusion、哪个 panel、复杂度 | 队长派发 `routingHint` | 两轴路由 |
| **执行**：给定路径上实际跑 | 执行 Agent | 遵守 hint + Auto |
| **守门**：超预算 deny、越权 deny、L3 拦截 | 管理 Agent | L2/L3 |

`routingHint` = 队长派发子任务时携带的元数据（`preferredSurface`、`suggestFusion`、`fusionForm`、`tierHint`、`budgetTokens`）。执行 Agent 的 orchestrator 当**软约束**：在 hint 范围内做决策；冲突时可覆写并回注理由进 timeline。

### 7.3 Fusion scope

- **`leader-only`（默认）**：只有队长触发；终答/方案拆解后派给执行。成本集中在队长，易守门。
- **`all-agents`**：执行也可自触发（设计/视频需现场 Plan Fusion 时）；受 `budgetCap` + L2 约束；每次触发写 timeline，管理 Agent 可 deny。
- **管理 Agent 永不 Fusion**。

### 7.4 预算守门与成本归因

- **预算上限**由管理 Agent 配（L2/L3），作用于项目级聚合（按 workspace / 按队长 / 按 Agent）。
- **超预算 deny**：管理 Agent deny 后续 Fusion 触发（不 deny 已在跑的 panel，避免半截浪费），提示队长降级。
- **成本归因**：每条账本带 `agentId/role/layer`；管理 Agent 自身 cheap 连接成本单列，不混进项目预算。
- **CLI 成本**：Token 环显示「由 CLI 管理」；订阅成本按设置里填的「估算月费」分摊，标 `kind: estimated`。

### 7.5 信息隔离

- 管理 Agent 只读队长摘要（`docs/17` §2.1）；Fusion panel 原文**不回灌管理 Agent**，除非队长显式请求（走 permission）。
- 队长不可见管理 Agent 长期记忆原文；偏好注入由管理 Agent 按设置范围选择性下发。
- 执行 Agent 之间不互见 panel 原文；只有队长合成的终答/方案进 timeline。

---

## 8 · 数据驱动持续优化（RouteLLM）

1. **数据采集从第一天建**：每条请求记录路由决策、模型组合、token、延迟、Judge 质量、结果是否被采纳/回滚。用户接受答案、重试、手动换模型、撤销动作/回滚 patch、重渲染——都是偏好信号。写入 `docs/05` 记忆 + 评测集（`docs/16`）。
2. **学习型路由器**：数据积累到一定量后，用 RouteLLM 方法训一个小分类器替换启发式规则，学「什么任务 fast 足够、什么值得 balanced/Fusion」。换模型对仍泛化。
3. **评测闭环**：某类任务长期 Fusion 收益小就自动调低触发权重。

> 这不是"远期"——数据管线与路由器训练框架一并实现；只是训练需要数据积累，这是物理约束不是设计选择。

---

## 9 · 成本账本（真实/估算/未知分开）

每请求写 timeline：

```json
{
  "type": "cache_ledger",
  "routing": { "taskType": "design-canvas", "complexity": 4, "tier": "best",
               "fusionMode": "plan", "cascadeUpgrades": 1 },
  "shaping": { "tool": "rtk", "beforeTokens": 9200, "afterTokens": 1300, "kind": "estimated" },
  "layers": {
    "l1_provider": { "cacheReadTokens": 12000, "cacheCreationTokens": 800, "kind": "actual" },
    "l2_exact": { "hit": false },
    "l3_panel": { "hits": 2, "misses": 1, "savedEstTokens": 8400, "kind": "estimated" }
  },
  "cost": { "actual": 0.042, "estimated": null, "savedByCache": 0.018 }
}
```

Token 环扩展：上下文占用 + provider 缓存命中%（有 `cacheReadTokens` 才显示）+ Fleet 缓存/瘦身节省（估算单列）。无字段显示「未知」。

---

## 10 · 设置项（写进 `preferences`，D1 同一份真相）

```ts
interface ModelRoutingPrefs {
  mode: 'manual' | 'auto'                 // 默认 manual
  cascade: { enabled: boolean; respectLatencySensitive: boolean }
  shaping: { rtk: boolean; codegraph: boolean; reasonixPrefix: boolean }
  taskTypeRouting?: Partial<Record<TaskType, { tier?: ModelTier; fusionMode?: FusionMode }>>
  agentPolicy: {
    manager: { connectionSlug: string; modelId: string }
    leader: { allowAuto: boolean; allowFusion: boolean; allowCli: boolean }
    executor: { allowAuto: boolean; allowCli: boolean; surfaceByTaskType?: Partial<Record<TaskType, 'api'|'cli'>> }
  }
  fusion: {
    enabled: 'off' | 'on' | 'smart'       // 默认 off
    preset: 'quality' | 'budget' | 'custom'
    panelSize: 2 | 3
    panelModels: string[]
    judgeModel: string
    writerModel: string
    formsByTaskType?: Partial<Record<TaskType, 'synthesis' | 'plan'>>
    budgetCap: { maxTokens: number; maxPanelists: number; perWorkspaceDaily?: number }
    scope: 'leader-only' | 'all-agents'
    verification: { enabled: boolean; models?: string[] }
  }
  cache: { exact: boolean; semantic: boolean; panelIntermediate: boolean }
}
```

UI：设置 → AI →「模型路由」+「多模型融合」+「缓存与节省」。输入框模型按钮加 `Auto`（`docs/36`）。

---

## 11 · 前后端功能闭环（AGENTS 规则 38）

| 维度 | 落点 |
|---|---|
| 用户界面 | 输入框 `Auto` 选项；设置 → AI 三区；动作型任务在画布/视频面显示「由 X 模型/Fusion 产出」 |
| 沿用组件 | `CompactModelSelector`、`ApiKeyInput` 三档、`tier-models.ts`、Token 环 |
| 显示字段 | taskType、档位、Fusion 形态、级联次数、缓存命中层、瘦身 before/after、真实/估算成本 |
| 后端服务 | `model-orchestrator.ts`、`fusion-pipeline.ts`、`fusion-cache.ts`、`context-shaper.ts`、`fusion-types.ts` |
| 事件/timeline | `model_routing_decision` + `cache_ledger` 经 **`emitSessionEvent`** 持久化为 `customData.sessionEvent`，`ChatDisplay` 渲染 pill；Plan 动作走 InternalAction/DesignAction |
| Agent 工具 | 管理 Agent/队长可读路由设置与账本；不新增绕 permission 的特权动作 |
| permission/timeline/回滚 | 全进同一 timeline；动作型经 permission；全失败降级 + 提示；可回滚 |
| 设置页/i18n | 新 key 全量 locale，Lead 冻结（规则 36） |

---

## 12 · 文件落点

```
app/packages/server-core/src/services/
  model-orchestrator.ts        # 两轴决策 + 级联升级 + 成本感知
  fusion-pipeline.ts           # Synthesis + Plan + 后置 Verification
  fusion-cache.ts              # CacheStore：L2 exact/semantic + L3 panel
  context-shaper.ts            # 杠杆0：调 docs/16
  fusion-types.ts              # taskType/decision/ledger 类型
  __tests__/fusion-pipeline.test.ts
app/packages/shared/src/config/preferences.ts   # ModelRoutingPrefs
app/packages/shared/src/protocol/dto.ts          # RoutingDecision/CacheLedger 事件（Lead 冻结）
```

生成类 provider 选择逻辑加进现有 `external-job.ts` 体系（`docs/31`），不另建 router 文件。

---

## 13 · executor 必读

1. **部分失败要扛**：每 panelist 独立超时；≥1 成功才进判官；全失败降级 + 提示。
2. **判官结构化**：JSON schema 容错（修复/重试再降级）；temp=0。
3. **Writer 是重点**：Synthesis 关外部工具用最强模型；Plan 保 structuredOutput 产合法可执行动作序列。
4. **级联只在划算时升级**：质量增益 > 成本增加；动作型用 schema 校验失败做天然信号；`latencySensitive` 关级联。
5. **成本/延迟闸**：panel 大小、token、级联深度全可配可封顶；默认关。
6. **递归保护**：`fusionDepth`，panelist 不能再融合；Plan 子动作不得再触发 Fusion。
7. **身份**：panelist/验证 agent 输出带 `agentId`（规则 15），可分辨可单独停。
8. **平面隔离**：生成类走 External Job，不进 LLM 档位路由、不混算成本。
9. **离线测试**：faux 模型断言——Synthesis+Plan 路径 + 级联 + 部分失败 + 缓存命中/未命中 + 瘦身记账 + CLI 跳过 + 生成类不进 LLM 路由，零网络。
10. **DoD**：Plan Fusion 产出可执行且可回滚；一个 panelist 超时仍出终答；成本封顶生效；默认关时零额外开销；L2 命中零 API；瘦身/缓存节省记「估算」。

---

## 14 · 实现计划（按依赖排序，全部实现）

| 序 | 交付 | 依赖 |
|---|---|---|
| 1 | 两轴路由（taskType 识别 + 启发式复杂度 + mini 二段 + 三档映射）+ `model_routing_decision` 进 timeline | 无 |
| 2 | 级联升级（cascade + schema/测试/置信信号 + `latencySensitive` 门控） | 1 |
| 3 | L1 观测进 Token 环 + L2 Exact 缓存 + CacheStore | 1 |
| 4 | 杠杆0 输入瘦身接入（rtk 先行，引用 docs/16） | 1 |
| 5 | Synthesis Fusion（Panel→Judge→Writer，默认关，faux 先行）+ L3 Panel 缓存 | 1,3 |
| 6 | Plan Fusion（代码重构/自动化 + 设计/视频 pipeline）+ 原生引擎动作执行 + 回滚 | 5 + 引擎(设计/视频) |
| 7 | 后置 Verification（测试/渲染/diff 交叉取证） | 6 |
| 8 | 预算分档（Quality/Budget/Custom）+ 预算守门 deny + 三层 Agent 分权 + routingHint | 5 + 团队编排(M1-M2) |
| 9 | L2 Semantic（默认关，仅 C1） | 3 |
| 10 | 数据采集管线 + RouteLLM 训练框架（数据够了就训） | 1 |

> 依赖标注的是"能跑通需要什么"，不是"推迟到什么时候"。序 1–5 无外部依赖，一口气实现；序 6 的设计/视频 Plan Fusion 需要 openpencil 等引擎就绪才能实跑，但 pipeline 代码与代码重构的 Plan Fusion 一并建好。序 8 的 routingHint 需要团队编排协议落地，但分权策略（管理 Agent 固定 cheap API 等）在序 1 就生效。

---

## 15 · 工作区实现状态（2026-06-27，未提交主线）

| 序 | 交付 | 状态 | 备注 |
|---|---|---|---|
| 1 | 两轴路由 + timeline | 🟡 工作区 | `SessionManager` Auto 分支 + `ModelRoutingEvent` |
| 2 | 级联升级 | 🟡 工作区 | 文本/工具错误信号 + `planCascadeRetry`；schema/test 级联仍薄 |
| 3 | L1 观测 + L2 Exact | 🟡 工作区 | git HEAD 失效 + 语义缓存磁盘 |
| 4 | 杠杆0 瘦身 | 🟨 占位 | `context-shaper` 仅空白规范化；rtk/codegraph pending |
| 5 | Synthesis Fusion | 🟡 工作区 | pipeline + L3 panel cache；A3 实跑待验 |
| 6–7 | Plan Fusion + Verification | 🟡 工作区 | hooks 已接；设计/视频引擎未绿灯 |
| 8 | 预算/分权/routingHint | 🟡 工作区 | `budget-gatekeeper` + `agent-routing-policy` |
| 9 | L2 Semantic | 🟡 工作区 | 默认关；磁盘 persist |
| 10 | 偏好 + RouteLLM | 🟡 工作区 | 五类偏好信号 + `~/.craft-agent/cache/routellm-router.json` |

合入前：`./scripts/fleet-verify.sh` + A2/A3 smoke。并行验证见 `docs/32 §8.6`。

---

Sources：FrugalGPT(2305.05176)、RouteLLM(2406.18665)、Mixture-of-Agents(2406.04692)、LLM-as-a-Judge(2306.05685)、OpenRouter Fusion 官方；craft 现有 `tier-models.ts`/`getMiniModel()`/`usage-tracker.ts`/PromptBuilder stable·volatile(#862)/`external-job.ts`。
