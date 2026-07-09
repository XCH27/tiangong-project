# Fleet 技术架构与设计审查报告 (Gemini 3.5 Flash)

本独立审计报告对 **Fleet** 项目的主体文档控制面（`docs/` 目录下的系统规范与合同契约）进行了深度审查。本报告严格遵循“不看代码、仅看项目文档、独立在对应文件夹输出”的原则，评估各重要设计方案的合理性、自洽性和可执行性，并按严重程度列出发现的问题与优化建议。

---

## 1. 方案评估概要

| 方案 / 决策模块 | 合理性 | 自洽性 | 可执行性 | 综合判定 |
|---|---|---|---|---|
| **S1: 产品定位与人机边界 (D13)** | 高 | 自洽 | 中 | **通过**。定位清晰（非聊天皮、非订阅产品、非 IDE 克隆）。 |
| **S2: 统一共享 Spine 层 (D14/D21)** | 高 | 有条件自洽 | 高 | **有条件通过**。避免了万用 patch，Spine 边界清晰。 |
| **S3: W0 契约合同冻结 (action-ids/stubs)** | 高 | **存在冲突** | **存在缺陷** | **不通过**。AgentSeat 结构与矩阵 tag 定义存在自相矛盾。 |
| **S4: 波次门禁与依赖图谱** | 高 | **存在冲突** | 低 | **不通过**。交付状态与模块编号存在多处漂移。 |
| **S5: App Server 运行拓扑 (Bun+Electron+CLI)** | 高 | 有条件自洽 | 中 | **有条件通过**。但需补充进程生命周期管理。 |
| **S6: Action Registry 扩展机制** | 高 | **存在冲突** | 中 | **有条件通过**。插件命名空间规则与核心 Action ID 冲突。 |
| **S7: 标签权限矩阵与工具过滤** | 高 | 有条件自洽 | **存在缺陷** | **不通过**。工具与 Action 的命名体系脱节。 |
| **S8: 协同与 Bridge 接口** | 高 | 有条件自洽 | 中 | **有条件通过**。stubs 中缺少 M04 已用的部分类型。 |
| **S9: 浏览器只读合规设计 (M06/D30)** | 高 | 自洽 | 高 | **通过**。安全红线贯彻透彻。 |
| **S10: 模块闭环模板规范** | 高 | **存在冲突** | 中 | **不通过**。规格书模板出现双重标准并存。 |

---

## 2. P0 级严重问题 — 阻碍并行实现与违反红线的语义冲突

### P0-1 AgentSeat 席位定义双重标准 (E1 冲突)
*   **现象：** 
    *   在 [protocol-stubs.md](file:///Users/lullwen/Documents/天工/docs/contracts/protocol-stubs.md) 中，`AgentSeat` 被定义为包含 `role: 'lead' | 'worker' | 'reviewer'`、`domainTags` 和 `trustLevel` 结构化字段的 TypeScript 接口。
    *   但在 [identity-tags-permission-matrix.md](file:///Users/lullwen/Documents/天工/docs/contracts/identity-tags-permission-matrix.md) 中，席位被声明为携带扁平字符串数组 `identity_tags: string[]`，通过 `role:`、`domain:`、`trust:` 前缀来解析。
*   **影响：** Worker 在实现 `AgentSession.create()` 的校验器时无所适从，这直接导致 Zod 静态校验与矩阵权限求交规则在类型层面上无法对接。
*   **建议：** 必须二选一：
    *   **(A)** 将 stubs 中的 `AgentSeat` 修改为 `identityTags: string[]` 以适配矩阵；
    *   **(B)** 将矩阵和验证逻辑重构为基于结构化字段的匹配逻辑，废除前缀字符串解析。推荐方案 **(A)**。

### P0-2 工具与动作（Tools vs Actions）命名体系分裂 (E2 缺口)
*   **现象：**
    *   `action-ids.md` 冻结的 Action ID 采用 `<domain>.<verb>` 格式（例如 `file.create`, `session.rename`）。
    *   但在 `identity-tags-permission-matrix.md` 中，声明的工具权限大量使用了 `tool.run_shell`、`tool.read_file`、`file.write.scoped` 等非标命名。
    *   在精简版的模块 spec 中，又出现了类似 `actions:listRegistered`、`terminal:executeCommand` 等 Agent 接口。
*   **影响：** 权限校验器（PreInvoke Hook）无法统一解析 manifest。Worker 无法判断工具清单里的字符串究竟对应哪些注册 Action，导致安全过滤机制失效。
*   **建议：** 指定 [action-ids.md](file:///Users/lullwen/Documents/天工/docs/contracts/action-ids.md) 为唯一命名真源。明确解释：`tool.*` 和 `host.*` 属于底座暴露的低级 MCP 工具；而 `file.*` 等高阶操作必须通过通配符映射到冻结的 Action ID 列表（例如 `file.*` 映射到 `file.create` 等 5 个 Action）。

### P0-3 插件命名空间规则与核心 Action ID 硬冲突 (E1 冲突)
*   **现象：** 
    *   在 [12-capability-skill-plugin-system.md](file:///Users/lullwen/Documents/天工/docs/modules/12-capability-skill-plugin-system.md) 中，插件 Action ID 被要求必须且仅包含两个 `.`（形如 `<surface>.<plugin-id>.<verb>`），且核心指令要求使用 `fleet.` 前缀。
    *   但在 `action-ids.md` 中，冻结的核心动作（如 `file.create`, `canvas.node_create`）均只有一个 `.` 且无 `fleet.` 前缀。
*   **影响：** 按照 M12 的命名规则，目前冻结的 21 个核心 Action 将全部被判定为“非法命名”而拒绝注册。
*   **建议：** 统一规范：核心 Action 遵循 `<domain>.<verb>` 规则；三段式命名 `<surface>.<plugin-id>.<verb>` 或 `plugin.<id>.<domain>.<verb>` 专属用于第三方/重度插件，废除对核心 Action 强加 `fleet.` 前缀的逻辑。

### P0-4 Wave 1 Packet 派单分支设计违反并行模型 (E1 冲突)
*   **现象：**
    *   [wave-1-platform-action.md](file:///Users/lullwen/Documents/天工/docs/agent-packets/wave-1-platform-action.md) 将 Worker Seat 1 (M00) 和 Worker Seat 2 (M03) 的目标分支同时指定为同一个分支：`worker/wave-1-spine`。
*   **影响：** 这直接违反了 [PARALLEL-AGENT-OPERATING-MODEL.md](file:///Users/lullwen/Documents/天工/docs/PARALLEL-AGENT-OPERATING-MODEL.md) 中“严禁两个 Worker 共享同一个工作分支以防止 Git 冲突”的铁律。
*   **建议：** 必须为两个 Seat 拆分独立的分支：`worker/wave-1-spine-m00` 和 `worker/wave-1-spine-m03`，在各自验证完毕后通过 Lead 发起 PR 合并至集成分支。

### P0-5 消息网关模块 (Messaging) 编号漂移 (E1 冲突)
*   **现象：**
    *   `DECISIONS-LEDGER.md` 中的 `D28` 仍指代 `modules/14-messaging.md`。
    *   但在 `WAVE-MODULE-MAP.md` 和实际磁盘文件上，`M14` 已变更为 onboarding（[14-onboarding.md](file:///Users/lullwen/Documents/天工/docs/modules/14-onboarding.md)），而 messaging 模块则漂移为了 `M15`（对应 [15-messaging.md](file:///Users/lullwen/Documents/天工/docs/modules/15-messaging.md)）。同时，`15-messaging.md` 的文件内一级标题仍写着 `# 14 Messaging Specification`。
*   **影响：** 导致模块树索引混乱，工单派发的目标文件发生冲突。
*   **建议：** 统一将消息网关模块编号声明为 **M15**，更正 D28 的受影响模块字段，并将 [15-messaging.md](file:///Users/lullwen/Documents/天工/docs/modules/15-messaging.md) 内的标题修正为 `# 15 Messaging`。

---

## 3. P1 级重要问题 — 影响 W1/W2 正常开工的局部设计缺陷

### P1-1 D32 离线异步 Batch 调度对实时运行的阻塞隐患 (E2 缺口)
*   **现象：** 决策 `D32` 引入 Batch API 离线批处理机制以减少 API 费用，而 M04 的 `TeamRun` 编排流程尚未定义如何处理 Batch API 带来的 24 小时超长延迟。如果本地工作流（如编译修复、临时终端指令）被强制送入 Batch 队列，UI 将长时间无响应。
*   **建议：** 在 `TeamRun` 控制字段中引入 `dispatchMode: 'real_time' | 'offline_batch'`。涉及本地工作区修改、代码单元测试和即时交互的步骤强制走 `real_time` 通道，离线 Batch 仅用于长周期的代码审计或重度素材离线渲染。

### P1-2 L0–L3 符号的多重二义性冲突 (E1 冲突)
*   **现象：** 
    *   D12 中表示“决策自动化等级”；
    *   `ActionPermissionLevel` 中表示“执行安全限制等级”；
    *   M10 记忆规格中表示“记忆时间层结构”。
*   **影响：** 同一个缩写 `L0-L3` 代表三种截然不同的系统概念，易造成 Worker 理解混乱。
*   **建议：** 仅保留 ActionPermission 使用 `L0-L3`。记忆分层重构为 `MemT0-T3`（或 `session/project/tool/user`）；决策自动等级命名为 `AutoGrade 0-3`。

### P1-3 模块规格规范的“双重模板”并存冲突 (E1 冲突)
*   **现象：**
    *   [DEVELOPMENT-PROCESS.md](file:///Users/lullwen/Documents/天工/docs/DEVELOPMENT-PROCESS.md) 规定模块 Spec 必须采用包含 Payload 定义、错误路径、可用性手测步骤的“闭环格式”。
    *   但实际绝大多数模块（如 M00, M03, M05, M06, M07）仅保留了 10 节精简模板（Purpose, Non-Goals, Inputs, Outputs, State Model, Dependencies, Acceptance, Failure, Observability, Hooks），导致具体的 payload 结构和错误代码完全缺失，不可执行。
*   **建议：** 统一规范。建议将 10 节精简模板升格为官方唯一标准，但必须在精简模板的 Outputs 或 State Model 中强制补齐“错误代码定义（ErrorCode）”和“usable 测试验证步骤”，杜绝双模板打架。

### P1-4 D36 对 M07/M09 删去章节的悬空引用 (E1 冲突)
*   **现象：** 
    *   `DECISIONS-LEDGER.md` 中的 `D36` 指导本地资源限制时，明确指向 `M09 §17` 和 `M07 §18`。
    *   但 M07 和 M09 规格书已经被重构为精简版，根本不存在第 17 或 18 章节。
*   **建议：** 将 D36 中的限制细节（如“画布并发写入帧合并”、“视频并发渲染上限为 1”）直接补充进 D36 描述文本中，去除对规格书具体章节号的悬空链接。

---

## 4. P2 级优化建议

### P2-1 protocol-stubs.md 缺少 M04 声明的部分类型
*   **发现：** M04 spec 中频繁提到 `RunReport`、`AttributionChain` 和 `TaskRun`，但在 [protocol-stubs.md](file:///Users/lullwen/Documents/天工/docs/contracts/protocol-stubs.md) 中这些类型并未被声明，属于未冻结状态。
*   **建议：** 在 stubs 中为这些类型补充基础的草稿 interface 声明，或在 M04 中将其明确标注为“W2 动态扩展类型，不属于 W0 冻结集”。

### P2-2 绝对 `file:///` 链接影响文档便携性
*   **建议：** 全局清理文档中诸如 `file:///Users/lullwen/...` 的绝对路径链接，替换为标准的 Markdown 相对路径链接（如 `[action-ids.md](contracts/action-ids.md)`），以便在不同开发机上阅读。

---

*报告由 Gemini 3.5 Flash 于 2026-07-09 独立审查并输出。*
