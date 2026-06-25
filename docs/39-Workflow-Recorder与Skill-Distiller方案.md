# 39 · Workflow Recorder 与 Skill Distiller 方案

> 状态日期：2026-06-24
> 决策来源：用户明确希望 Fleet 具备类似 Codex Record & Replay 的能力，但利用 Fleet 自身“所有功能统一在一个软件里、人类和 Agent 共用同一工作台”的优势，从底层语义事件创建更强、更省 token、更稳定、更泛用的流程化 Skill。
> 参考边界：OpenAI Codex Record & Replay 为 proprietary bundled plugin，只能黑盒参考产品边界；本机审计清单见 `源码参考/plugins/record-and-replay-openai-bundled-blackbox/README.md`。不得复制其二进制、MCP 实现、Skill 原文、图标、资源或目录结构。

## 1 · 一句话定位

Fleet 要做的是 **Workflow Recorder / Skill Distiller**：

用户或 Agent 在 Fleet 中完成一次真实流程，系统记录语义动作、证据和结果，再由管理 Agent 或项目 Agent 蒸馏成可验证、可回放、可复用、可注入的 Skill 包。

它不是传统 RPA，也不是“录屏转脚本”。录屏和截图只是证据；真正的主干是 Fleet 内部已经存在或将要补齐的 `SessionEvent`、Internal Action Registry、permission、timeline、workspace 对象、browser/tool/file/artifact/video 原生动作。详见 `docs/38-内部结构化能力与Agent-native优化主线.md`。

## 2 · 为什么 Fleet 能比 Codex Record & Replay 更强

Codex Record & Replay 主要从 Mac OS 层观察用户：鼠标点击、文本输入、窗口内容和事件流。它能学会用户演示，但对外部 App 的稳定性依赖 Accessibility、窗口状态和视觉目标。

Fleet 的优势是很多动作天然发生在自己的工作台内：

| 动作来源 | Fleet 能记录的稳定语义 |
|---|---|
| 聊天与会话 | 用户消息、Agent 回复、工具调用、权限请求、runtime、模型、token/cost |
| 浏览器 / 网页标注 | URL、AX ref、selector、selection、截图、DOM/可访问性摘要、批注 |
| 终端 / CLI Runtime | cwd、命令块、stdout/stderr、exit code、runtimeId、permission |
| 文件 / Git | path、diff、patch、commit、branch、rollback |
| Artifact / 设计画布 | nodeId、selection、DesignAction、DesignPatch、asset/hash、rollback |
| AIGC / 外部审查 | External Job、输入资产、模型、成本、输出、报告 |
| 管理 Agent / 团队 | actor、agentId、role、任务分派、待审报告、自动决策依据 |

因此 Fleet 的 Recorder 不应先从“全 Mac 录屏”开始，而应先记录自己内部的语义动作。Mac 全局 Computer Use 式观察只作为外部 App 兜底。

## 3 · 核心原则

1. **显式录制，不做被动监控**
   用户必须主动开始录制。录制中有清晰状态、可暂停、可停止、可取消。取消后丢弃未确认产物。

2. **语义事件优先，屏幕证据兜底**
   内部动作记录 actionId、payload、actor、target、permission、result、rollback。截图/视频只辅助理解和验证。

3. **人类按钮和 Agent 工具同源**
   人类能点的业务按钮，Agent 应能调用同一个结构化动作。禁止只存在 renderer 暗状态的关键动作。

4. **Skill 是流程包，不只是 `SKILL.md`**
   `SKILL.md` 负责触发条件和高层指导；结构化流程、证据、验证、失败处理放在 lazy-load 文件里。Skill 必须声明能调用哪些 internal actions、需要哪些 MCP/CLI/API、上下文摘要和权限边界。

5. **管理 Agent 可看摘要，深读要权限**
   管理 Agent 默认读取软件状态、事件摘要、Skill 目录和待审报告。深读完整录制、跨项目记录、敏感窗口内容必须走 permission。

6. **不复制 Codex proprietary 实现**
   只学习“event stream -> inspect -> skill”的产品边界。实现基于 craft/Fleet 的 session、permission、timeline 和自研 Internal Action Registry。

## 4 · 与现有主干的挂槽三问

| 问题 | 答案 |
|---|---|
| 挂哪个 Surface 的哪个槽 | 默认工作台的 Skill / 管理 Agent 能力层；录制入口放在当前 session 输入区附近和 Skill 面板，不另建孤岛 App。各专业工作面可在工具栏暴露“录制此流程”。 |
| 操作什么原生对象 | 录 `SessionEvent`、Internal Action command、Browser selection、Terminal command block、File patch、DesignAction、External Job、Team event。 |
| 怎么进 timeline 和回滚 | Recorder 自身是 `LOCAL_ONLY` workflow。开始/停止/蒸馏/注册 Skill 都写入 owning session timeline；可写动作继续走原 permission；Skill 包写入 Skill Registry，有版本、来源、撤销和删除。 |

## 5 · 分层架构

### 5.1 Internal Action Registry / Command Bus

这是前置承重墙。每个有业务意义的按钮和 Agent 可执行动作都注册成同一个结构化 command。

> **类型定义不在本文重复**（旧 `FleetActionDefinition` 草案已删，避免接手 Agent 复制过时片段）。`InternalActionDefinition`（含 `contractVersion`/版本迁移）、`ActionSurface` 闭合词表、`ActionTargetRef`/`ActionInvocation`、权限接线一律见 `docs/40 §2–§5`。Recorder 旁路监听的就是这套 action 的调用事件。

人类 UI 点击按钮时调用 action；Agent 工具也调用 action；Recorder 在 action bus 旁路监听结构化事件。这样 Agent 不需要真的移动鼠标去“按按钮”，而是调用按钮背后的业务动作。

Fleet 内部功能不得通过截图、DOM、鼠标坐标或终端命令操作 Fleet 自己。MCP / CLI / API 只用于外部工具和外部服务。

### 5.2 Recorder Session

一次录制对应一个 Recorder Session，绑定：

- workspaceId
- owner sessionId
- actor：user / agent / manager
- allowed surfaces
- allowed apps/windows
- redaction policy
- retention policy
- recording status：idle / recording / stopped / cancelled / distilled / registered

Recorder Session 支持一次一个活动录制。多录制并发后续可做，但第一版必须避免事件混流。

### 5.3 Event Tap

Event Tap 只读订阅以下事件源：

| 事件源 | 第一版状态 |
|---|---|
| `SessionEvent` | 已有主干，可直接作为核心来源 |
| Internal Action Registry events | 需要新增 |
| RPC command envelope | 需要新增轻量拦截层，只记录 action metadata，不记录 secrets |
| BrowserPane events | 复用 craft browser/tool，补人类 selection / annotation |
| Terminal / CLI Runtime events | 跟随 CLI Runtime Host 落地 |
| File/Git patch events | 跟随文件/Git 面板落地 |
| DesignAction / DesignPatch | 已有协议方向，继续扩 |
| External App / Mac OS events | 后置，显式授权兜底 |

### 5.4 Evidence Vault

证据不直接塞进 prompt。证据保存为本地可索引资产：

- screenshot / region screenshot
- short clip pointer
- DOM / AX snapshot excerpt
- terminal output tail
- file diff
- artifact preview
- external job result
- success screenshot
- hashes and source paths

每条证据都有 `evidenceId`、source、timestamp、hash、redaction state、retention policy。Skill 只引用证据 ID 和摘要，执行时按需读取。

### 5.5 Workflow Trace

Recorder 把事件流收敛成结构化 trace：

```json
{
  "workflowId": "wf_...",
  "title": "File Expense",
  "goal": "Submit an expense report with required receipts",
  "inputs": [
    { "name": "receiptFile", "type": "file", "required": true },
    { "name": "amount", "type": "money", "required": true }
  ],
  "steps": [
    {
      "stepId": "open-expense-page",
      "actionId": "browser.open",
      "target": { "urlPattern": "https://..." },
      "evidence": ["ev_..."],
      "successCheck": { "type": "visibleText", "value": "New expense" },
      "fallback": "Ask user to confirm login state"
    }
  ]
}
```

Trace 不是最终 Skill，但它是 Skill Distiller 的主要输入。

### 5.6 Skill Distiller

Skill Distiller 由管理 Agent 或当前项目 Agent 调用，流程：

1. 读取 trace summary。
2. 聚类重复/无关操作，去掉鼠标抖动、页面停留、纯导航噪音。
3. 识别目标、输入变量、成功标准、失败分支。
4. 判断是否有更稳定的工具/connector/API 可替代 UI 操作。
5. 脱敏敏感内容。
6. 生成 Skill 包。
7. 做静态校验和一次可选 dry-run replay。
8. 写入 Skill Registry，记录来源、版本、适用范围和 token 成本。

### 5.7 Skill Package

Skill 包不是提示词文件。**这是 `FleetSkillManifest` 的唯一定义**（`docs/38 §6` 的重复草案以此为准，见 `docs/41` P4）。第一版 manifest 至少包含：

```ts
interface FleetSkillManifest {
  id: string
  name: string
  version: string
  description: string
  allowedInternalActions: string[]   // 回放主路径：按 docs/40 注册表的 action id 引用
  requiredMcp?: string[]
  requiredCli?: string[]
  requiredApi?: string[]
  requiredExternalJobs?: string[]     // 外发 Job 依赖（docs/31 §5）
  contextSummary: {
    needsFiles?: string[]
    needsSurfaces?: string[]
    maxContextPolicy: 'summary-only' | 'selected-objects' | 'full-with-permission'
  }
  permissionBoundary: {
    maxDefaultLevel: 'L0' | 'L1' | 'L2' | 'L3'
    requiresExplicitApprovalFor: string[]
  }
  replay: {
    preferred: 'internal-actions'
    fragileFallbacks?: Array<'screen-coordinates' | 'browser-dom' | 'computer-use'>
  }
}
```

`allowedInternalActions` 是回放主路径；`requiredMcp` / `requiredCli` / `requiredApi` 只声明外部依赖。坐标、DOM、Computer Use 只能标为 fragile fallback。

Fleet 生成的流程 Skill 推荐结构：

```text
workflow-name/
  SKILL.md
  workflow.json
  evidence-manifest.json
  replay-policy.json
  references/
    stable-targets.md
    failure-handling.md
  assets/
    previews/
  agents/
    openai.yaml
```

`SKILL.md` 保持短，便于 Codex/Fleet 渐进加载：

- 什么时候触发
- 需要哪些输入
- 不应该什么时候触发
- 高层步骤
- 必须遵守的权限/隐私边界
- 需要读取哪些 lazy-load 文件

`workflow.json` 保存结构化步骤和参数化 action。`evidence-manifest.json` 保存证据引用，不保存秘密原文。

## 6 · 管理 Agent 能看到什么

管理 Agent 应看到三层信息：

| 层级 | 默认可见性 | 内容 |
|---|---|---|
| L0 摘要 | 默认可见 | workflow title、状态、所属 workspace、创建者、步骤数、风险等级、最后一次验证结果 |
| L1 结构 | 用户开启或当前 workspace 内可见 | action list、工具依赖、参数 schema、成功标准、失败原因摘要 |
| L2/L3 深读 | 需要权限 | 完整 events、窗口内容、截图、外部 App 内容、敏感字段附近上下文 |

这样既能让管理 Agent 管 Skill、记忆和跨项目自动化，又不会默认吞掉全部用户屏幕内容。

## 7 · Token 节省机制

Workflow Recorder 省 token 的方式不是“少看事实”，而是把事实做成可渐进加载的稳定结构：

1. **Skill 摘要稳定**：只把 `name/description/SKILL.md` 前半部分放入常规上下文。
2. **流程节点按需加载**：执行到某一步才读取 `workflow.json` 对应节点。
3. **证据按需加载**：默认只读 evidence summary，不把截图/DOM/日志全塞进 prompt。
4. **成功标准结构化**：减少每次让模型重新判断“做到哪算成功”。
5. **失败分支沉淀**：把用户示范中的偏好和修复动作变成 reusable handling。
6. **稳定前缀缓存友好**：Skill、工具 schema、动作定义保持稳定顺序和 hash。

## 8 · 稳定性机制

Replay 不能靠坐标。优先级：

1. Fleet 原生 actionId + objectId。
2. 文件 path + patch / symbol / git ref。
3. Browser AX ref / role / name / selector / text pattern。
4. Artifact nodeId / layer path / component key。
5. Terminal cwd + command block + success check。
6. External App Accessibility role/name/label。
7. 坐标和截图匹配只做最后兜底，且必须标为 fragile。

每个 replay step 都要有 success check，否则不能标为可自动执行。

## 9 · 隐私与安全

- 录制开始必须有显式确认。
- 录制状态必须持续可见。
- 支持按 surface / app / window allowlist。
- 默认不记录密码框、OTP、API key、支付卡、证件号、医疗/法律/HR 等敏感内容。
- 证据库本地优先，默认 `LOCAL_ONLY`。
- 删除录制、删除 Skill、删除证据走 L3。
- 外发给外部 AI 审查或模型蒸馏前必须显示内容摘要、风险和成本。
- 管理 Agent 自动决策不能自动同意 L3。

## 10 · 与 Codex Record & Replay 的取舍

| Codex 可见能力 | Fleet 取法 |
|---|---|
| Event-stream MCP | 自研 Event Tap + Workflow Trace；不复制协议实现 |
| macOS Computer Use app | 后置外部 App fallback；不复制二进制或 helper |
| 录制后读 metadata/events 文件 | Fleet 使用 Recorder Session + `workflow-trace.jsonl` |
| `events.jsonl` 是主要证据 | Fleet 也以语义事件为主要证据，截图只是辅助 |
| 录制后默认生成 Skill | Fleet 也默认生成真实可发现 Skill 包 |
| 优先 connector/tool，Computer Use 兜底 | Fleet 优先 Internal Action Registry / tool / connector，OS 观察兜底 |
| 敏感信息脱敏 | Fleet 必须内建 redaction + retention policy |

## 11 · 落地顺序

### W0 · 文档与边界

- 登记 Codex Record & Replay 为 proprietary 黑盒参考。
- 写入 D19 产品决策。
- 明确不复制 OpenAI bundled plugin。

### W1 · Internal Action Registry / Command Bus

- 为现有关键按钮建立 action envelope。
- 覆盖发送消息、切换 runtime、启动浏览器、选择/注释、创建 Skill、运行命令、文件 patch。
- 人类 UI 和 Agent 工具共用同一 handler。

### W2 · Internal Semantic Recorder

- 新增 Recorder Session store。
- 订阅 `SessionEvent` 和 Internal Action Registry events。
- 录制 Fleet 内部 workflow，不碰 Mac 全局屏幕。
- 生成 `workflow-trace.jsonl` 和 evidence manifest。

### W3 · Skill Distiller v1

- 从 trace 生成 Skill 包。
- 接现有 Skill Registry。
- 校验 `SKILL.md` frontmatter、触发描述、依赖工具、敏感信息。
- 支持用户手动编辑后保存。

### W4 · Replay v1

- 只支持 Fleet 内部 semantic action replay。
- 每步有 success check。
- 不确定步骤降级为询问用户或打开对应工作面让用户确认。

### W5 · External App Capture

- 增加 Mac Accessibility / Screen Recording 类能力，但只做显式授权 fallback。
- 只记录 app/window allowlist 内内容。
- 不把坐标回放标为稳定能力。

### W6 · Evaluation

- 建立录制成功率、Skill 生成成功率、Replay 成功率、token before/after、人工修正次数。
- 每个 Skill 保存最近验证结果。

## 12 · 第一版验收

第一版只承诺 Fleet 内部录制：

- 用户能在一个 session 开始/停止/取消录制。
- 发消息、Agent 工具调用、权限请求、浏览器选择/注释、命令块、文件 patch 至少能进入 trace。
- 停止后生成 Skill 包，而不是只给总结。
- Skill 包能在 Skill 列表被发现。
- Replay 只执行已有语义动作；缺少稳定目标时要求用户确认。
- 证据本地保存，敏感内容脱敏。
- 管理 Agent 能看到摘要，深读完整 evidence 需要 permission。

## 13 · 反模式

- 把 Recorder 做成后台无感监控。
- 只保存屏幕视频，不保存语义事件。
- 用坐标脚本冒充稳定 replay。
- 给每个工作面各做一套 recorder。
- 让管理 Agent 默认读取所有原始录制和截图。
- 把生成物只写成 runbook，不注册成 Skill。
- 复制 OpenAI proprietary plugin 或其 Skill 原文。
- 绕过 craft permission / timeline / session persistence。

## 14 · 当前状态标注

- Codex Record & Replay 黑盒审计：`usable as reference`
- Fleet 内部 SessionEvent 主干：`usable`
- 全量 UI Internal Action Registry：`not implemented`
- Internal Semantic Recorder：`not implemented`
- Skill Distiller：`not implemented`
- Semantic Replay：`not implemented`
- Mac 全局外部 App fallback：`not implemented`
