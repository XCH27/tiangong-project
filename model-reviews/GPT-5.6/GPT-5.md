# GPT-5 — 项目、文档与参考项目独立审查报告

**审查日期：** 2026-07-09  
**审查方式：** 只读；未改动 `app/`、`docs/` 或任何现有项目文件。  
**结论标签：** 产品方向 `可保留`；技术路线 `需收口`；多人并行开发 `暂不具备开工条件`。

---

## 1. 执行结论

Fleet / Craft Agents（二开补强）的核心方向是好的：保留 Craft 的桌面工作台，用一个共享的会话、权限、时间线、证据、文件和资产脊柱，将终端、浏览器、画布、生成、视频等作为**原生专业面**接入，而不是再造多个相互隔离的产品。

问题不在于“Electron、Bun、CLI、Canvas、Agent Team 这些技术能否存在”，而在于当前文档把许多尚未核实、甚至相互冲突的假设提前冻结成了合同。若现在开工，特别是让多个 Agent 并行，最可能发生的是：每个模块各自实现一套权限、动作、持久化或运行时边界，最后只能靠大规模返工整合。

**建议的总决策：先完成一次文档与现有 Craft 基座的对账；对账通过后，先顺序验证一条极窄的终端/CLI 闭环；最后才启用并行开发。**

---

## 2. 审查范围与证据边界

### 已完整阅读和交叉检查

- 当前 `docs/` 下的现行方向、决策、模块、协议、Wave、ownership、packet、board 文档。
- 根目录和 `app/` 的 README、package/workspace 配置、Electron 资源说明。
- 现有核心路径：CLI RPC、SessionManager、权限模式、BrowserPaneManager、内部 Action 合同、持久化路径与 Electron 主进程边界。
- 参考目录的 Git 完整性、remote、HEAD、工作区状态和许可证文件；对当前路线直接相关的参考项目做了深入阅读。

### 未作出的虚假声称

- 主工程约有 **1,425** 个非生成 TypeScript/TSX 文件、约 **326,922** 行；参考源码目录约有 **93,399** 个代码文件。没有逐行阅读所有第三方源码。
- 归档语料被明确标记为历史材料；仅用于发现遗留冲突，不覆盖现行决策。
- 未进行 Electron 真实 UI 启动、真实外部 API 调用、真实 PTY、浏览器或视频导出测试。因此本报告不把“类型检查成功”误写为产品已可用。

### 已验证的工程事实

- `./scripts/craft.sh run typecheck:all`：**成功**。
- 当前工程相对于本地 `craft-agents-oss` 参考基座，在排除 `node_modules`/构建产物后只有 **18** 个文件差异；关键差异是 Browser Settings、设置注册、菜单/i18n 和新增 `internal-action.ts`。
- 当前已有真实 CLI WebSocket 客户端、Headless Server、SessionManager、BrowserPaneManager/远端 BrowserPane 代理；并非需要从零建立这些基础能力。

---

## 3. 值得保留的方向

| 判断 | 原因 | 保留条件 |
|---|---|---|
| 保留 Craft + Electron 壳 | 现有基座已具备 session、权限模式、浏览器、RPC、CLI 和本地/远端 server 路径；重写壳会浪费最稀缺的整合时间。 | 新能力优先通过适配层接入，不复制另一套 shell。 |
| “共享脊柱 + 原生专业模型” | 代码、浏览器、设计、视频确实不应共用一个伪万能 Patch 格式。 | 共享的是 actor、权限、事件、证据、撤销引用；不是所有文档内部结构。 |
| Files 与 Library 分层 | 原始文件、可复用资产、生成结果、外部证据具有不同权限和 provenance。 | Library 升级必须显式授权并有来源/许可证/哈希。 |
| CLI/API/TeamRun 分层 | CLI 是单一 runtime run，团队归属和跨 Agent 审计应由主产品持有。 | 先用一个 CLI run 验证，不先造 TeamRun 平台。 |
| 明确合规红线 | 禁止 stealth、额度绕过、cookie/token 抽取、外站 DOM 写入，是正确的产品边界。 | 这些边界必须落到 executor 和权限检查中，不仅写在 policy。 |

---

## 4. P0：开工前必须修复的合同与治理问题

### P0-01 — “冻结合同”与源码不一致，W0 不能视为通过

**证据**

- 文档 Action Registry 声称 `FROZEN v1.2.0`，但源码 `internal-action.ts` 的 `CONTRACT_VERSION` 为 `1.0.0`。
- 文档表列出 `file.move`、多项 canvas action 和 AIGC action；源码实际 `InternalActionId` 只包含很小的子集。
- 文档协议桩的权限等级只有 L0–L2，源码已有 L3。
- 文档中的 `ActionInvocation`（有 `actorRef`、`seq`）与源码版本（有 `callerKind`、`targets`、无 `seq`）不是同一合同。

**影响**

任何 Worker 都可能严格实现“冻结文档”却与实际可编译代码不兼容；或者直接改共享协议而破坏其他 Worker。W0 的价值正是避免这种情况，因此此问题阻断后续所有 Wave。

**修改建议**

1. 先选定**源码合同为唯一可执行事实**，从源码生成/校验 Markdown 表，不再手工维护两份可漂移定义。
2. 所有合同表都补 `source path`、`source symbol`、`contract version`、`status: stub | implemented`、`last verified SHA`。
3. 只有 `AgentSeat`、`RuntimeLane`、`TeamRun`、Bridge 事件、ActionInvocation、SessionEvent、L0–L3 都有可编译的最小定义，才重开 W0 gate。
4. 增加 CI parity check：文档 action ID、权限级别和源码导出的常量必须一一对应。

### P0-02 — 身份标签的“权限并集”模型会产生越权

**证据**

现有矩阵规定所有 tag 权限做 union；但 `role:worker` 含 scoped write，`trust:external` 却只是“public read”。若纯并集，加入 `trust:external` 并不会移除原来的写能力。

**影响**

`trust:` 名义上是数据边界，实际成为无效标签；“default deny”无法保证组合后的最小权限。

**修改建议**

使用两阶段权限求值：

```text
effective_grants = union(role grants, domain grants, explicit task grants)
effective_ceiling = intersection(trust restrictions, workspace restrictions, lease restrictions)
effective_scope = effective_grants ∩ effective_ceiling
explicit_deny always wins
```

并将每次 Seat 创建的“最终 manifest + 推导理由”作为可审计产物保存。`trust:external` 必须能真实禁止私有文件、跨项目 memory、写入和高危工具，而不是只在说明文字里存在。

### P0-03 — Action ID 命名规范自相矛盾

**证据**

冻结表采用 `file.create`、`canvas.node_create`；M12 却规定核心 action 必须为 `fleet.<surface>.<verb>`，且插件 ID “必须恰好两个点”。

**影响**

插件注册、核心 action 保留字、迁移规则、manifest 校验会在第一批扩展时冲突。

**修改建议**

在开工前二选一并写入 ADR：

- 统一为 `core.<surface>.<verb>` 与 `plugin.<plugin-id>.<verb>`；或
- 保持核心两段 ID，插件使用与核心不冲突、无需点号计数的 URI 风格 namespace，例如 `plugin:<plugin-id>/<domain>.<verb>`。

不要以字符串点号数量承载安全边界；注册表必须维护 `ownerKind`、`ownerId`、`public`、`version` 结构化字段。

### P0-04 — Wave、packet、board 与 ownership 不能作为同一个控制面

**证据**

- Wave Map 把 M11 放在 W4，Wave 2 packet 又要求实现 M11。
- M14 模块文件是 Messaging，Wave Map/Ownership 却标为 Onboarding/Empty States。
- Board 的 W0 仍是“not implemented”，Wave Map 同时宣布 W0 已完成。
- W1 packet 给两个 Worker 同一目标分支，违反“一个 Worker 一个分支”。
- Board 既说只有 Lead 更新，又说 Worker 应追加卡片。

**影响**

平行开发会在正确文件和正确波次上都没有唯一答案；卡片和完成报告无法反映真实状态。

**修改建议**

1. `WAVE-MODULE-MAP.md` 成为唯一排期事实；packet/board 仅引用其 module ID 和 slice ID。
2. 为每一模块定义唯一 `moduleId`、`canonicalSpecPath`、`wave`、`owner`；M14 必须在“Messaging”与“Onboarding”之间选择一个，另一个另建模块。
3. 新增“控制面一致性检查表”，每次开 wave 前手工/自动比对四份文档。
4. Board 只允许 Lead 汇总；Worker 改 packet 中自己的 card，或反过来。二者只能留一个写入位置。

### P0-05 — 浏览器存在两条相互冲突的路线

**证据**

- 产品方向要求复用现有 BrowserPane。
- M06 规定新建 `<webview>` Browser surface。
- 当前基座已存在 `BrowserPaneManager`、BrowserView、IPC/远端桥接、截图与 owner 授权。

Electron 官方明确提醒 `<webview>` 因架构变化影响稳定性，并建议考虑其他方案；当前 Electron 也将 BrowserView 标为 deprecated，长期迁移目标应是 `WebContentsView`，不是再叠一层 `<webview>`。

**影响**

新 `<webview>` 会复制 browser lifecycle、cookie/profile、权限、截图和审计路径，直接违反“一个浏览器真相”。

**修改建议**

- W3 只扩展现有 BrowserPane：selection overlay、annotation、evidence bundle、settings 映射。
- 单独建立 BrowserPane Lifecycle ADR：实例 owner、workspace/session 隔离、数据清除、popup/download policy、CDP 许可、关闭与崩溃恢复。
- 把 `BrowserView → WebContentsView` 定为未来、可独立验证的迁移；绝不与第一条浏览器功能环混做。
- 远程外站默认只允许 read/select/screenshot/annotate；禁止 `type`、副作用 `click` 与 arbitrary `eval`。本地开发预览或用户拥有的 artifact 才可通过真实文档模型写入。

### P0-06 — CLI 默认 `allow-all` 与项目的 L0–L3 审批理念冲突

**证据**

当前 `craft-cli run` 创建 session 时默认 `permissionMode: args.mode || 'allow-all'`，帮助文本也说明默认 allow-all。

**影响**

这是最优先要收紧的真实风险：你的产品文档承诺“CLI、Git、文件、命令都通过权限与 replayable evidence”，而 CLI 默认直接跳过审批。即使后续 M02 做得完美，现有入口仍可绕开预期路径。

**修改建议**

- 新产品路径把 CLI 默认改为 `ask`；非交互自动化必须显式 `--yes --mode allow-all`，并同时写入 `automationReason`/`origin`/`policySnapshot`。
- 区分“用户直接在真实终端输入的命令”与“Agent 代表用户发起的命令”；后者永远走 Action/Permission/Evidence。
- 在 M02 的第一条验收中加入：默认 CLI 拒绝/请求审批、显式授权后执行、审计可复现、取消可见。

---

## 5. P1：技术路线与产品范围优化

### 5.1 不要现在把 Bun Headless Server 定义为常驻核心

已有 server/CLI RPC 基础说明它是可行选项；但“Electron 与 CLI 都是平等客户端、连接同一个常驻 Bun Server”仍缺少生命周期合同：单实例锁、拉起者、认证、SQLite/文件唯一写者、Electron 退出后的语义、崩溃恢复、端口占用、版本升级与多 workspace 隔离。

同时 D22 又将 daemon 定为条件项。这不是技术选择错误，而是**结论过早**。

建议：先写 App Server Lifecycle ADR。第一阶段沿用现有 server-spawn / Electron in-process 路径，只在真实需要“脱离 UI 的连续工作”时升级为常驻 daemon。

### 5.2 持久化必须先收口，不能在 `.fleet/*.json` 与 SQLite 之间摇摆

现有 Craft 主体主要使用 `~/.craft-agent/` 下的文件型配置与 session 数据；工程依赖中没有已被选定的 SQLite 运行时。M04、M08、M10、M07 的文档却分别引入 TeamRun journal、job queue、memory、canvas snapshot 等不同存储设想。

建议先定义 `LocalStateMap`：

| 数据 | 权威存储 | 可导出格式 | 并发/恢复规则 |
|---|---|---|---|
| Session/timeline | 复用 Craft 现有 session storage | JSON export | 保留既有兼容性 |
| Action journal / leases / jobs | 一个版本化 SQLite DB 或同一现有 store | JSONL evidence | WAL/事务/恢复策略 |
| Canvas document | 专业引擎文件格式 | PNG/SVG/JSON export | 引擎历史为真相 |
| Library metadata | 与 Files 不同的 asset registry | manifest | hash/provenance 不可伪造 |

在此之前，禁止每个模块自行在 `.fleet/` 下新建 JSON 文件。

### 5.3 Memory 过早且自相矛盾

Decision Ledger 要求七分区、四个时间层和 L3 删除；M10 实际定义五层，并在 `memory.json` 与 SQLite/FTS5 间摇摆。它还提前固化“10 次成功、70% 重复就自动生成 Skill”等不可靠阈值。

建议：

- 先保留**本地、可查、可删、项目隔离**四项不可变目标。
- 先做 Session evidence → 人工确认的 Project Memory，一律不跨项目注入。
- Tool Memory、自动蒸馏、SkillProposal、向量检索和批处理全部放到实验阶段，必须有 precision/recall、泄漏、误注入与删除验证指标后才能升级。

### 5.4 Batch、缓存、路由应做 provider adapter，不要写成通用常数

OpenAI 和 Anthropic 的原生 Batch 都适合离线任务，且都提供约 50% 的 API 成本优势；但它们有各自的异步生命周期、结果保留期、模型/输入限制和失败语义。不能用一个统一的“120 秒 running 即 failed”覆盖 Batch。

建议的统一模型至少包含：

```text
provider, model, executionMode, idempotencyKey,
providerRequestId | providerBatchId,
submittedAt, providerState, nextPollAt,
resultRetentionUntil, itemResults[], billedUsageSource
```

同时，prefix cache 不是跨 Provider 的保证；每个 provider 要以实际 usage 回执标注 `confirmed | estimated | unknown`，不能根据本地 hash 假定命中或在订阅额度中虚构“节省金额”。

### 5.5 视频首版不要承诺专业 NLE

首版应是“播放 + clip 定义 + 导出队列 + provenance”，不是多轨专业剪辑器。

- HTML5 `currentTime` 不应承诺“±1 frame”级精确预览；导出精度由解码和 FFmpeg 路径决定。
- FFmpeg 打包需要单独的许可证、构建 flags、源代码对应、codec/patent 风险和平台分发 ADR。
- 本地 render concurrency=1 是合理起点，但应放到统一 External Job Scheduler，而不是让 M09 自己维护另一套队列。

### 5.6 Canvas 规格必须先选定“哪一个 OpenPencil”

参考目录中有两个不同项目：

| 候选 | 主要取向 | 对 Fleet 的含义 |
|---|---|---|
| `open-pencil/open-pencil` | Figma/.pen 兼容、Vue SDK、headless CLI、MCP、WebRTC 协作 | 更接近可编程设计文档引擎，但嵌入面是 Vue，不是现有 React。 |
| `ZSeven-W/openpencil` | AI 设计到代码、React SDK、并行 Agent、`.op` 文件 | 更接近 Agent-native UI 工作流，但其 Agent/runtime 不能成为 Fleet 的第二脊柱。 |

文档写的是 `openpencil`，但没有指定 remote、SHA、package、嵌入方式或文档格式。必须在实施前冻结选择。建议只做 **one-week adapter spike**：打开一个文件、读取一节点、执行一个受控 mutate、撤销、把事件映射到 Craft Timeline。未通过前，不承诺“直接集成”。

---

## 6. 主工程审查发现

### 6.1 基座很强，但应避免继续塞进巨型类

`SessionManager.ts` 约 8,090 行、`browser-pane-manager.ts` 约 3,613 行、`AppShell.tsx` 约 3,565 行。它们已同时承担多种职责。

建议新能力以 feature service / adapter / executor 加入，避免继续在这些文件直接加 branch：

```text
UI → typed command → Action executor → feature service → native engine/runtime
                              ↓
                   permission + evidence + session event
```

先为现有 SessionManager、BrowserPaneManager 建 characterization tests，保护已经可用的 session/browser 行为。不要为了“统一脊柱”重构整个基座。

### 6.2 现有 BrowserPane 是可复用资产，不是待替换的遗留物

当前 BrowserPaneManager 已有页面、工具栏、overlay、CDP/JavaScript 执行、截图和远端调用能力；其浏览器 guest 也已使用 `nodeIntegration: false`、`contextIsolation: true`、`sandbox: true`。这支持“扩展而非重建”的决定。

不过主窗口 `sandbox: false`、任意页面 evaluate、以及多条 `child_process` 路径都应纳入后续 threat model。它们不自动等于漏洞，但任何新 Bridge/Action 都不得绕过当前的 permission manager。

### 6.3 文档、README 与当前代码存在明显漂移

Electron README 的目录和“无 distribution config”等陈述已落后于实际 package scripts 与文件结构；参考目录 README 仍链接到已经进入 legacy 的 `docs/14/26/27` 中文文档。

建议把 README 分成：

- `README.md`：产品入口和真实运行命令；
- `ARCHITECTURE.md`：从源码自动校验的 package/transport 图；
- `docs/`：产品决策和未来合同；
- `docs/legacy/`：仅历史。

任何说明“当前已实现”的内容必须能链接到源码和最小行为验证；任何未来计划必须标 `not implemented`。

### 6.4 现有 Action Registry 是正确的试验点，但尚不是产品脊柱

新增 `internal-action.ts` 是很好的方向：有 Action definition、Zod payload/output、权限等级、undo、blocked/error/supervision 结构。但它目前没有与文档一致的 ID 表、actor/sequence 模型和实际 executor 注册闭环。

建议第一条 Action 不要选 canvas/AIGC，而选**低风险、可撤销、现有能力真实存在**的动作（例如 session rename 或 file rename），用它验证：Human UI 与 Agent 走同一个 executor、同一权限判定、同一 timeline event、同一 undo handle。

---

## 7. 参考项目审查与吸收建议

### 7.1 建议深入参考的项目

| 项目 | 许可证/状态核查 | 建议吸收 | 严禁吸收或需隔离 |
|---|---|---|---|
| Craft Agents OSS | Apache-2.0；本项目当前基座 | session、权限、BrowserPane、RPC、CLI/Server 已有能力 | 不为了新方向推翻其壳与已有存储。 |
| AionUi | Apache-2.0 | runtime catalog、CLI 探测、进程生命周期、运行状态呈现 | 不引入其 team/config/store，避免第二平台。 |
| Open Design | Apache-2.0 | artifact handoff、设计 workflow、插件/sidecar 的边界思想 | 其 daemon、router、商业服务和巨大产品面不能直接成为 Fleet 架构。 |
| CodeGraph | MIT | 本地 SQLite/FTS5、staleness 提示、读取范围缩小 | 仅 opt-in MCP/sidecar；它的 daemon、自动写 agent instructions、全局安装不可默默执行。 |
| RTK | Apache-2.0 | 终端输出压缩的可观测性、节省测量方法 | 只能处理非结构化 stdout/stderr；不得改写 JSON、diff、Action result。 |
| DeepSeek Reasonix | MIT | cache-stable prompt 装配、CLI runtime 的配置化思想 | 不复制 DeepSeek 专属假设、其 planner/runtime 或把 cache 策略强加给所有 provider。 |
| DeepCode CLI | MIT | skills 路径兼容、MCP 状态/发现体验 | 仅做 adapter；不复制其用户目录、模型/配置约定为 Fleet 真相。 |
| `open-pencil/open-pencil` | MIT | 可编程设计文件、headless/MCP、结构化设计工具表面 | 先确认 Vue SDK 与 React/Electron 的隔离方式；不可把它的 MCP 当绕过 Fleet permission 的后门。 |
| `ZSeven-W/openpencil` | MIT | Agent-native design workflow、React SDK 候选 | 需要同前者做明确选择；不可同时把两套 engine 写入产品。 |
| OpenCut Classic | 许可证文本近似 MIT，但仓库明确为 archived/no longer maintained | clip/timeline 数据模型与本地编辑边界 | 仅借鉴稳定模型；不将归档项目作为长期核心依赖或来源于未审子依赖的打包依据。 |

### 7.2 参考项目治理问题

- `源码参考/README.md` 仍指向已归档的旧文档，应改为现行 `REFERENCE-PROJECT-POLICY.md` 与一个新的 manifest。
- 参考目录同时有 `open-pencil` 与 `openpencil`，却没有指明哪一个是“approved OpenPencil”。这会导致误拷贝。
- 多个源码/资源目录不是标准开源依赖或没有明显 LICENSE（例如 Cowart、cockpit-tools、逆向/设计资产包）。它们应默认视为**黑盒或禁止来源**，尤其不能直接复制 icons、UI kits、styles、prompt、配置或反编译结果。
- 盘点中发现 `penpot` 参考 checkout 非干净；参考 README 自己要求新项目记录状态，当前却没有可审计 manifest。

建议新增 `docs/reference-manifest.yaml`（未来修改，不是本轮操作），每个参考项目至少记录：

```yaml
id: open-pencil-open-pencil
local_path: 源码参考/software/open-pencil
remote: https://github.com/open-pencil/open-pencil.git
commit: 1750199...
license: MIT
classification: green-light | black-box | prohibited
allowed_capabilities: [design-document, headless-sdk]
forbidden: [permission-system, team-runtime]
last_license_reviewed: 2026-07-09
working_tree: clean
attribution_required: true
```

---

## 8. 建议的新执行顺序

### 阶段 A：文档收口（不写产品功能）

1. 重新执行 W0：合同从源码对账并验证，而不是只在 Markdown 写“frozen”。
2. 修复 P0-01 至 P0-06；合并重复/错误的 Wave、packet、board、ownership 口径。
3. 冻结四份 ADR：Action namespace、Permission algebra、Browser lifecycle、App Server lifecycle。
4. 冻结 Reference Manifest，尤其写清两个 OpenPencil 的选择与 OpenCut Classic 的维护风险。
5. 为每个 module spec 补齐 status、scope、error path、open questions、手工验证步骤和唯一 owner。

### 阶段 B：单 Agent、单垂直闭环

只实现并真实验证：

```text
选择已检测的本地 CLI runtime
→ 用户明确授权
→ 受控 PTY 启动一个无害命令
→ 输出流入现有 session timeline
→ 停止 / 失败 / 超时对用户可见
→ Agent 调用同一个 executor 并得到同样证据
```

**明确不做：** TeamRun、文件租约、模型自动路由、memory distillation、plugin marketplace、浏览器重建、Canvas、AIGC、视频。

### 阶段 C：并行资格

只有以下条件全部满足后才允许多 Agent：

- 合同 parity CI 通过；
- 权限标签按 ceiling/deny 模型实现并有负向测试；
- 第一条 CLI Action 已证明 human/agent parity；
- Action event、timeline、undo/evidence 已跨重启可读；
- 一个 module 一个 canonical spec、一个 slice 一个 owner、一个 worker 一个 branch；
- 外部/参考项目 manifest 完整，且来源许可证已明确。

---

## 9. 建议的文档修改清单（供后续批准后执行）

| 优先级 | 文件/新增物 | 修改目的 |
|---|---|---|
| P0 | `docs/contracts/action-ids.md` + `app/.../internal-action.ts` | 一次性对齐 ID、版本、权限等级和源代码链接。 |
| P0 | `docs/contracts/protocol-stubs.md` | 补齐 AgentSeat、RuntimeLane、TeamRun、Bridge 事件；删除与源码冲突的伪定义。 |
| P0 | `docs/contracts/identity-tags-permission-matrix.md` + ADR | 从 union-only 改为 grants/ceilings/explicit denies。 |
| P0 | `docs/WAVE-MODULE-MAP.md`、`OWNERSHIP-MATRIX.md`、packets、board | 统一 module ID、wave、M14 定义、branch/card 写入规则。 |
| P0 | `docs/modules/06-browser-artifact-surface/SPEC.md` | 放弃 `<webview>` 新路线，明确复用 BrowserPane 的能力边界。 |
| P0 | `docs/modules/02-terminal-cli-runtime/SPEC.md` | 将默认 CLI safety、明确授权与审计闭环写成第一验收。 |
| P1 | `docs/modules/10-memory-context-review.md` | 统一 memory 分区、生命周期、SQLite/JSON 决策，延后自动技能生成。 |
| P1 | `docs/modules/07-*`、`09-video-surface.md` | 冻结具体 engine/repo/SHA，建立 adapter spike 和 media distribution ADR。 |
| P1 | `docs/REFERENCE-PROJECT-POLICY.md` + `docs/reference-manifest.yaml` | 固化来源、许可证、SHA、允许/禁止能力和归因责任。 |
| P1 | 根 README、Electron README、`源码参考/README.md` | 删除已过期路径和实现状态，改为真实入口。 |

---

## 10. 最终 Go / No-Go 判定

| 事项 | 判定 | 原因 |
|---|---|---|
| 继续保留 Craft/Electron 基座 | **Go** | 现有能力与产品方向高度匹配。 |
| 现在启动功能开发 | **No-Go** | 共享合同、权限模型、wave 控制面存在阻断性冲突。 |
| 现在启动多 Agent 并行开发 | **No-Go** | 文件/协议/波次/分支权威不唯一，返工风险极高。 |
| 做文档与基座对账 | **Go** | 风险低、收益高，是正确下一步。 |
| 做单一 CLI 垂直闭环 | **Go（完成 P0 后）** | 可用最小成本验证产品承重墙。 |
| 同时上 Canvas/AIGC/Video/Memory/Plugin | **No-Go** | 尚未验证共享脊柱，且关键 engine/source 选择未冻结。 |

本报告的核心建议不是缩小你的长期愿景，而是把愿景从“所有能力同时预设计”变成“每次只证明一个承重假设”。这样保留了 Fleet 的扩展空间，也避免把未来的可能性提前变成今日必须维护的复杂度。
