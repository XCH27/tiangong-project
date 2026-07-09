# 10 Memory Context Review

## 1. Mission

统一本地记忆、上下文效率、ProjectPack、外部 AI 审查和报告，纳入一个有治理能力的中心。

**核心设计哲学：记忆系统的目标不是"记住更多"，而是"记得更准、隔离更好、成长更快"。**  
好的记忆系统应该减少踩坑、提高输出效率、节省 token，而不是对工程开发造成负担。

---

## 2. User-Visible Loop

用户打包项目或选定范围，查看文件 / token / 密钥风险，可选提交授权审查，收到带证据和成本标签的报告。

---

## 3. Current App Reuse

复用 memory protocol/service、usage ledger、BrowserPane、External Job、session timeline、settings，以及现有 file/conversion 工具。

---

## 4. Reference Projects

RTK/codegraph 是绿灯优化源。Repomix/MarkItDown/Headroom/Zvec 是候选/旁车参考，除非晋升为正式依赖。

---

## 5. UI Placement

Context/review 归属于单一中心或面板，而非为每个工具单独设置按钮。治理 UI 应保持紧凑。

---

## 6. Backend / RPC / Locality

ProjectPack、文件转换、密钥扫描、记忆检索和本地索引均为 `LOCAL_ONLY`。外部审查需要明确的上传权限。

---

## 7. Session / Timeline / Permission / Rollback

Bundle 记录哈希、文件列表、密钥扫描、目标平台、prompt 哈希、原始输出、报告，以及真实/估算/未知成本。

---

## 8. Data Model

记忆分区、ProjectPack、ReviewBundle、ReviewReport、用量样本、上下文片段、证据引用、外部平台记录。

### 8.1 Memory Distillation as Batch-Eligible Operation

Session 结束时，将工具调用历史（Track A）蒸馏为结构化 Fact 条目（Track B）是后台、非交互操作。这是 Fleet 内部 `async-native` 批处理模式的典型用例：

```
Session closes
  → Collect N SessionEvents from Track A (tool calls, diffs, exit codes)
  → Build batch JSONL: one item per event, each asks model to extract Fact
  → Submit as ExternalJob { type: 'memory-distill', batchMode: 'async-native' }
  → Result maps back to DistilledToolMemory entries by event ID
  → Write to memory.json partitions (project / agent / task)
```

规则：
- 蒸馏不得阻塞用户开启新 session。
- 条目必须分块以保持在 provider 批处理大小限制内。
- 失败的单个条目跳过并记录日志，不中止整个批次。
- 敏感条目（`scope: 'sensitive' | 'raw_path'`）在写入前必须标记 `blockedTargets: ['cross_project']`。

### 8.2 DistilledToolMemory Schema（应用 Module 03 §8.1–8.5）

```ts
interface DistilledToolMemory {
  // 身份字段 — 硬要求，模型不能填错
  id: string
  sourceEventId: string
  tool: 'grep' | 'read' | 'write' | 'shell' | 'browser' | 'mcp' | string
  timestamp: string

  // 语义判断字段 — 可选 + 'uncertain' 逃生口
  scope?: 'global_preference' | 'transferable' | 'project_specific'
        | 'tool_pattern' | 'sensitive' | 'raw_path' | 'uncertain'
  scopeConfidence?: 'high' | 'medium' | 'low'
  outcome?: 'success' | 'failure' | 'retry-fixed' | 'blocked' | 'uncertain'
  risk?: 'low' | 'medium' | 'high' | 'uncertain'

  // 核心内容 — 必填但自由格式
  content: string

  // 证据 — 追溯性必填，空数组合法
  evidenceRefs: Array<{ conversationNo: string; eventId?: string; fileHash?: string }>

  // 安全边界字段 — 可选，缺省时使用最严格默认值
  allowedTargets?: string[]   // 默认: ['same_project_only']
  blockedTargets?: string[]   // 默认: ['cross_project']

  // 可选语义细节字段
  errorSignature?: string
  expectedUseCases?: string[]
  expiresAt?: string

  // 逃生口 — 模型说"我对 X 不确定"而非猜测
  notes?: string
}
```

**语义后验证规则**（Zod 结构检查后运行）：
- `scope === 'sensitive'` → `blockedTargets` 必须包含 `'cross_project'`；缺失则自动添加。
- `evidenceRefs.length === 0` → `scopeConfidence` 必须为 `'low'`；否则降级。
- `errorSignature` 匹配通用模式（如 `'Error: undefined'`、`'null'`）→ 标记人工审查。
- `risk === 'uncertain'` → 在所有下游访问检查中视为 `'high'`。

---

## 9. Agent-Native Actions

检查记忆、检索有治理的上下文、构建包预览、提交审查、保存报告、创建后续任务。

---

## 10. Files To Inspect First

- `app/packages/shared/src/protocol/memory.ts`
- `app/packages/shared/src/protocol/usage.ts`
- external review/job services
- memory transfer eval scripts

---

## 11. Files Likely Touched

Memory services、project pack services、review services、context UI、report UI。

---

## 12. Parallel Work Packages

Memory governance、ProjectPack、review UI、sidecar adapters、report normalizer 可在共享 usage/report 类型冻结后拆分并行。

---

## 13. File Ownership

Memory/usage/review protocol 变更由 Lead 拥有。

---

## 14. Validation Ladder

记忆泄漏测试、project pack 试运行、密钥扫描 fixture、review report 保存冒烟测试、UI 来源标签检查。

---

## 15. Done / Not Done

`usable`：用户可以看到包风险并保存带证据的审查/报告。`display-only`：无真实 bundle 的 token/review dashboard。

---

## 16. Risks And Blocked Decisions

风险：将外部 AI 网站调用视为"免费"。成本来源必须保持真实/估算/未知。

---

## 17. Token & Context Optimisation Architecture

本节定义 Fleet 如何在完整请求生命周期内减少 token 消耗。  
本节取代所有关于 RTK、Repomix、Headroom 或 Reasonix 集成的非正式注释。

### 17.1 Five-Layer Model

每层只负责一个关注点。任何层都不得对另一层的输出进行压缩或重排。

| Layer | Name | Core concern | Primary reference | Owner module |
|---|---|---|---|---|
| 0 | Memory | 避免重复注入历史 | Mem0 (dedup/conflict ideas), Letta (3-tier model) | M10 |
| 1 | Retrieval Assembly | 只发送相关上下文 | codegraph (Green-Light MCP), Zvec (FTS5+vector interface), Tree-sitter AST outline (self-impl) | M10 |
| 2 | Prompt Assembly | 固定片段顺序以命中缓存 | DeepSeek-Reasonix (Green-Light stable-prefix) | **M11** |
| 3 | Transport / Cache | 请求级 token 缓存 | Headroom (interface reference, self-impl backend) | M11 |
| 4 | Execution Output | 防止终端/文件输出爆炸 | RTK (Green-Light, direct integration), Context-mode (ELv2 — fold criteria reference only) | M10 + UI |

### 17.2 Layer Rules (Hard)

1. **No stacked compression.** RTK（Layer 4）语义压缩工具返回值后，其他层在传给模型前不得进一步截断或改写。
2. **Prompt Assembly（Layer 2）是唯一组装者。** 没有模块直接构造最终 Prompt 字符串；模块提交类型化 `ContextSegment` 对象给 M11 的组装器，由其拥有拼接顺序。
3. **RTK 只处理非结构化流。** RTK 压缩仅适用于终端 `stderr`/`stdout` 日志流，不得用于 JSON payload、AST 结构或任何随后被代码解析的字段。
4. **Context-mode（ELv2）代码绝对禁止。** 大输出折叠标准可研究并独立重实现于 Fleet UI 层，但 Context-mode 的任何源码、类型定义或配置不得进入仓库。

### 17.3 Per-Tool Integration Decisions

#### RTK（Layer 4 — Execution Output）
- **操作**：直接集成，绿灯。
- **范围**：Opt-in，沙箱化。仅拦截终端执行日志流。
- **不得触碰**：任何结构化返回值（JSON、diff hunks、AST）。

#### codegraph + Zvec（Layer 1 — Retrieval Assembly）
- **操作**：独立 MCP Server。模型调用 `query_code_graph` 和 `query_vector_index` 工具。Fleet 不引入其内部实现。
- **升级路径**：MCP 协议意味着引擎升级不需要修改 Fleet。

#### AST Structural Outline — 替代 Repomix 副本（Layer 1）
- **策略说明**：`Repomix` 是候选参考，其策略条目明确禁止复制 AST 解析器、行计数器或忽略文件读取器。提取其 Tree-sitter 算法并"二次开发"为 Fleet 包是**策略违规**。
- **正确方式**：使用官方 `tree-sitter` Node.js 绑定和语法包实现轻量级 `@fleet/ast-outline` 包。Repomix 仅作为行为参考。
- **`read_file` handler 触发规则**：文件行数 > 500 时，默认响应降级为 AST 骨架（顶层声明、导出符号）；完整内容需显式调用 `read_file({ fullContent: true })`。

#### Headroom（Layer 3 — Transport / Cache）
- **策略说明**：不得复制压缩层、MCP 代理服务器或本地驱动。
- **正确方式**：参考其可逆哈希缓存接口规范，在 Fleet 现有 Cost Ledger（M11）内实现缓存后端。哈希键为 Layer 2 生成的稳定 Prompt 前缀哈希。

#### Mem0 + Letta（Layer 0 — Memory）
- **策略说明**：不得复制后端存储包装器或 Qdrant/Milvus 接口。
- **正确方式**：在接口层采用三层记忆模型（Core / Recall / Archival）。存储后端为 Fleet 原生 SQLite + FTS5（利用 Zvec 的索引模式）。§8.2 的 `DistilledToolMemory` schema 是"Recall"层的具体实现。

#### Context-mode（Layer 4 UI — Big Output Fold）
- **策略说明**：ELv2 — 严格禁止代码复制和二进制打包。
- **正确方式**：研究折叠标准（最小输出长度阈值、diff hunk 检测、代码块检测），在 `app/packages/ui/src/components` 从头重实现折叠逻辑。

#### DeepSeek-Reasonix（Layer 2 — Prompt Assembly）
- **策略说明**：绿灯 MIT。可直接参考稳定前缀缓存和 planner/executor 模式。
- **正确方式**：在 M11 的 Prompt Assembly 层（§18）实现稳定前缀 Prompt 排序。**这不是 TeamRun 的关注点**。

### 17.4 Anti-Patterns (Forbidden)

| Anti-pattern | Why forbidden |
|---|---|
| 将 JSON 工具结果传给模型前先运行 RTK | 破坏模型需要解析的结构化数据 |
| 在稳定前缀组装完成后向中间插入记忆片段 | 破坏前缀缓存，浪费约 50% 成本节省 |
| 复制 Repomix 源码用于 AST outline | 策略违规：AST 解析器复制明确禁止 |
| 任何形式的 Context-mode 代码进入仓库 | ELv2 高风险许可证 |
| TeamRun 构建最终 Prompt 字符串 | Prompt Assembly 由 M11 拥有；TeamRun 只提交 ContextSegments |
| 复制 Headroom MCP 代理或压缩层 | 策略：只可参考接口规范 |

---

## 18. Memory Scope Isolation — 项目隔离与乱召回防护

> **核心问题**：乱召回（cross-project memory contamination）是现有 Agent 记忆系统最常见的工程故障。其根因不是"记忆不够强"，而是缺少严格的 scope 边界和门控逻辑。

### 18.1 记忆五层分区

每一层有独立的生命周期、读写权限和跨项目访问策略：

| 层级 | 名称 | 生命周期 | 跨项目共享 | 典型内容 |
|---|---|---|---|---|
| L0 | **Session Memory** | 当前 session，关闭即销毁 | ❌ 禁止 | 当前任务临时状态、对话上下文 |
| L1 | **Project Memory** | 项目存续期 | ❌ 禁止 | 项目决策、架构模式、踩坑记录 |
| L2 | **Tool Memory** | 持久，按工具 ID 分组 | ⚠️ 只读，需显式引用 | 工具使用经验、失败模式、参数模板 |
| L3 | **User Memory** | 持久，用户级 | ✅ 允许 | 个人稳定偏好、语言习惯、风格偏好 |
| L4 | **Policy Memory** | 持久，系统级 | ✅ 只读 | 安全规则、许可证约束、禁用模式 |

**写入规则**：
- L0 由 session runtime 自动管理，不经过蒸馏流程。
- L1 只能由同项目内的 session 写入；蒸馏时 `scope === 'project_specific'` 的条目写入 L1。
- L2 由工具调用蒸馏自动写入；`scope === 'tool_pattern'` 的条目写入 L2。
- L3 需人工确认或置信度 `high` 的 `scope === 'global_preference'` 条目触发写入提案。
- L4 由系统管理员或 Lead 写入，Agent 只读。

### 18.2 检索门控（Retrieval Gate）

**检索不能只看语义相似度，必须先通过 scope 门控再计算相似度。**

```
召回请求
  → Step 1: 确定当前 projectId + sessionId + agentRole
  → Step 2: 按层级过滤候选池
      - L0: 仅当前 sessionId
      - L1: 仅当前 projectId
      - L2: 任意项目，但标记来源项目
      - L3/L4: 全局
  → Step 3: 在过滤后的候选池内计算语义相似度
  → Step 4: 对跨项目 L2 条目附加 [来源项目] 标签，注入上下文时明确标注
  → Step 5: 返回结果，附带每条记忆的 scope、来源、置信度
```

**禁止行为**：
- 在全局池上先做相似度检索，再做 scope 过滤（顺序颠倒会导致跨项目污染）。
- 注入记忆时不标注来源（模型无法区分当前项目事实与外部项目经验）。

### 18.3 冲突检测与覆盖规则

当新蒸馏条目与已有条目在内容上冲突时：

```
新条目 vs 已有条目
  → 同 scope + 同 projectId：新覆盖旧，旧条目移至 archive（保留 30 天）
  → 同 scope + 不同 projectId：并存，检索时按 projectId 区分
  → scope 降级（high → low 置信度）：保留两版本，标记 conflict=true，不自动覆盖
  → errorSignature 重复出现：聚合为一条，incrementCount++，不重复写入
```

### 18.4 失效与清理策略

| 触发条件 | 操作 |
|---|---|
| `expiresAt` 到期 | 自动移至 archive，不立即删除 |
| `outcome === 'failure'` 且 30 天内未被 `retry-fixed` 关联 | 标记为 stale，检索时降低权重 |
| 项目被关闭/归档 | L1 条目整体迁移至 archive partition，不跨项目共享 |
| 用户显式删除 | 硬删除，同步写入 audit log |
| `errorSignature` 被标记为误报 | 从 L2 中移除该签名，更新匹配黑名单 |

**Archive 保留期**：默认 90 天，可在 Settings 调整。

---

## 19. Tool Memory Growth Flywheel — 工具调用成长飞轮

> **设计哲学**：受《国富论》分工理论启发——工业社会的进步源于分工带来的专业积累。好的分工不只是"分配工作"，而是在不断工作中**积累经验、创造新技能或新工具**，实现正向循环的飞轮效应。
>
> Agent 的成长逻辑应当相同：每次工具调用都是一次"工作经历"，系统应当从这些经历中自动提取可复用的知识，沉淀为 Tool Memory，并在未来同类任务中降低试错成本、提高首次成功率。

### 19.1 飞轮结构

```
工具调用（Tool Invocation）
       ↓
  执行 + 结果观察
       ↓
  Session 结束 → 蒸馏（Distillation）
       ↓
  写入 Tool Memory（L2）
       ↓
  下次同类调用 → 检索门控命中 L2
       ↓
  注入上下文（带来源标签）
       ↓
  模型用更少 token、更少试错完成任务
       ↓
  新的成功经验再次蒸馏 → L2 更新
       ↑
  ← ← ← ← ← ← ← 飞轮闭合 ← ← ← ← ← ←
```

### 19.2 Tool Memory 的结构化内容

L2 Tool Memory 条目不只是"这次工具调用成功了"，而是结构化地记录**可复用的操作知识**：

```ts
interface ToolMemoryEntry extends DistilledToolMemory {
  scope: 'tool_pattern'  // 固定为 tool_pattern

  // 工具特定字段
  toolId: string                        // e.g. 'shell', 'mcp:github', 'read_file'
  parameterPattern?: string             // 成功的参数模式摘要
  preconditions?: string[]              // 调用此工具前需满足的条件
  postconditions?: string[]             // 调用后的预期状态
  antiPatterns?: string[]               // 已知会失败的用法
  tokenCost?: { input: number; output: number }  // 历史平均成本参考

  // 成长计数
  successCount: number
  failureCount: number
  lastUsed: string
}
```

### 19.3 身份标签 × 工具调用 × 记忆 的三角联动

Fleet 中每个 Agent 有身份标签（AgentRole / AgentSeat），这个身份应当与 Tool Memory 形成绑定：

| 身份标签维度 | 对 Tool Memory 的影响 |
|---|---|
| `agentRole: 'lead'` | 可写入 L4 Policy Memory；L2 写入自动附加高可信标签 |
| `agentRole: 'worker'` | 只读 L4；L2 写入经过 Lead 审核后才提升为 `scopeConfidence: 'high'` |
| `toolAffinity: ['shell', 'grep']` | 检索时优先返回与该 Agent 工具亲和性匹配的 L2 条目 |
| `projectId` | 决定 L1 写入归属；检索时 L1 严格隔离 |

**关键规则**：Tool Memory 的成长是**角色分工的产物**。Lead 积累的是架构决策和边界判断；Worker 积累的是具体工具操作经验。两者共同构成系统的知识资产，但访问权限严格分层。

### 19.4 新技能涌现机制（Skill Emergence）

当 L2 中某个 `toolId` 的 `successCount` 达到阈值，且 `parameterPattern` 具有足够高的复现率时，系统可以提议将其**提升为 M12 Capability**：

```
L2 Tool Memory 条目
  successCount >= 10
  AND parameterPattern 复现率 >= 70%
  AND 来自 >= 2 个不同 projectId
       ↓
  生成 SkillProposal { toolId, parameterPattern, suggestedCapabilityName }
       ↓
  提交人工审核（Lead 确认）
       ↓
  写入 M12 Capability Registry 作为新的可组合技能
       ↓
  后续调用直接从 Capability 层复用，不再重复蒸馏
```

这是系统**自动从经验中创造新技能**的核心路径，对应《国富论》中"工人在反复操作中发明工具"的逻辑。

### 19.5 成长飞轮的 Token 节省效应

飞轮成熟后的可量化收益：

| 阶段 | 机制 | 节省来源 |
|---|---|---|
| 早期 | 无 Tool Memory | 每次调用需从头试错，token 消耗最高 |
| 成长期 | L2 命中，注入参数模板 | 减少重试轮次，节省 20–40% |
| 成熟期 | M12 Capability 复用 | 直接复用经过验证的调用序列，节省 50–70% |
| 飞轮稳定 | 跨项目 L2 共享工具经验 | 新项目冷启动成本大幅降低 |

---

## 20. Memory Quality Gates — 记忆质量门控

> 写入记忆的质量比数量更重要。噪声记忆会降低整个系统的信噪比，最终导致比无记忆更差的决策质量。

### 20.1 写入前检查（Pre-Write Gates）

所有蒸馏条目在写入任何分区前必须通过：

1. **Zod 结构校验**：字段类型和必填项。
2. **语义后验证**（§8.2 规则）：scope/risk/evidenceRefs 一致性。
3. **重复检测**：内容相似度 > 85% 且同 scope 的条目视为重复，不写入，改为增加 `successCount`。
4. **敏感信息扫描**：与 M10 密钥扫描流程集成，检测到高风险内容自动标记 `scope: 'sensitive'`。
5. **来源可信度评估**：来自 `outcome: 'failure'` 的蒸馏条目初始 `scopeConfidence` 强制降为 `'low'`。

### 20.2 读取时质量过滤（Read-Time Filters）

检索返回前，自动过滤：
- `expiresAt` 已过期的条目（移至候选但降权，不作为主要上下文）
- `scopeConfidence: 'low'` 的条目在 token 预算紧张时优先丢弃
- `conflict: true` 的条目附加警告标签，不直接作为事实注入

### 20.3 人工审核队列

以下情况触发人工审核提案（非阻断，异步通知）：
- `errorSignature` 匹配通用模式
- `risk: 'high'` + `scopeConfidence: 'low'` 同时出现
- SkillProposal 生成（§19.4）
- 跨项目 L2 条目被高频引用（可能应该提升为 L3/L4）

---

## 21. Implementation Checklist

- [ ] `memory.ts` protocol 冻结：五层分区类型定义
- [ ] 检索门控实现：scope 过滤先于相似度计算
- [ ] 蒸馏 batch job：session 关闭触发，异步非阻断
- [ ] DistilledToolMemory Zod schema + 语义后验证
- [ ] ToolMemoryEntry schema + successCount/failureCount 追踪
- [ ] SkillProposal 生成逻辑 + M12 接口对接
- [ ] Archive 分区 + 90 天保留清理 cron
- [ ] 冲突检测与覆盖规则实现
- [ ] Pre-Write Gates 全部实现
- [ ] 人工审核队列 UI（M13 Settings Shell 中的紧凑视图）
- [ ] 记忆泄漏测试：跨项目召回的负向测试用例
- [ ] Tool Memory 成本节省追踪（接入 M11 Cost Ledger）
