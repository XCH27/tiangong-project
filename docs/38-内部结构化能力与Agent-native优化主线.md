# 38 · 内部结构化能力与 Agent-native 优化主线

> 状态日期：2026-06-25
> 用途：给后续智能体做项目深度优化时使用的单一收口文档。目标不是继续堆 UI、堆 CLI、堆插件，而是把 Fleet 收敛成“Agent 低 token、高安全、可回放地操控软件内部生产能力”的工作台。
> 结论：**Fleet 不要做成“多 CLI Agent 管理器”。CLI / ACP / MCP 只是入口和外部桥。Fleet 的差异化是把生产能力收进软件内部，让 Agent 操作结构化对象，而不是操作屏幕。**

## 1 · 一句话主线

别人主要让 Agent 操作外部世界：网页、桌面、终端、各种 CLI、各种 SaaS。

Fleet 要反过来做：把开发、设计、文档、AIGC、素材、视频、审查和交付能力收进一个稳定软件环境里，把每个能力暴露成结构化 internal action。Agent 不靠截图、DOM、鼠标坐标猜 UI，而是调用本地 action bus / RPC 操作内部对象。这样更省 token、更安全、更稳定、更容易回放，也更不怕外部网页和软件频繁改版。

## 2 · 不是多 CLI Agent 管理器

Fleet 可以接 CLI、ACP、MCP、API、浏览器和外部 App，但这些都是边界层：

| 能力 | Fleet 里的定位 | 不做 |
|---|---|---|
| CLI | 外部工具入口、代码执行、已有 Agent runtime 接入 | 不把产品核心做成“启动很多 CLI 的壳” |
| ACP | 标准化外部 Agent 会话桥 | 不把 ACP 当内部功能真相 |
| MCP | 外部服务/工具适配 | 不用 MCP 调自己内部 UI |
| Browser / Computer Use | 外部网页和外部 App 的兜底 | 不让 Agent 靠截图、DOM、鼠标点击操作 Fleet 内部功能 |
| 内置终端 | 人类和 Agent 的本机执行面之一 | 不把终端当所有功能的通用替代品 |

内部功能必须优先走 `Internal Action Registry -> Action Bus / local RPC -> SessionEvent -> permission -> undo`。

## 3 · 为什么内部结构化能力是护城河

用户现在的痛点是：Agent 散落在各种软件、网页端和 CLI 里。使用者要切换多个端口，把文件导来导去，还要适应不同网站、不同桌面软件、不同 CLI 参数的变化。外部环境一变，Agent 的 UI 操作路径、DOM selector、截图理解和提示词都要跟着变。

Fleet 的优势是环境固定、对象可建模、动作可版本化：

- 软件内部按钮背后可以绑定稳定 action，不需要 Agent 看图找按钮。
- 工作面对象是结构化文档、节点、文件、素材、轨道、任务和 job，不是像素。
- UI 优化时，只要 action schema 不变，Agent 调用方式不变；必要时可以用函数、公式、迁移器或 adapter 让旧 action 跟着新 UI 演进。
- 用户做一次、Agent 做一次、Recorder 录一次，都走同一条 action 和 timeline。

## 4 · Internal Action Registry

> **类型唯一真相已收口到 `docs/40 §2`（`InternalActionDefinition`）+ surface 词表 `docs/40 §3`。** 下面是方向示意；字段名、surface 取值、与 `design.ts` 信封的关系一律以 `docs/40` 为准（本草案与 `docs/39` 旧草案字段不一致，已在 `docs/41` 登记为 P1，并由 `docs/40` 收口）。

每个内部能力都必须登记到 Internal Action Registry。**类型定义不在本文重复**（避免接手 Agent 复制旧片段）——`InternalActionDefinition` 的字段、`ActionSurface` 闭合词表、`ActionTargetRef`/`ActionInvocation`、版本迁移（`contractVersion`/`payloadMigrations`）全部见 `docs/40 §2–§4`。本文只保留方向硬约束：

硬约束：

- `surface + action + schema + permissionLevel + timelineEvent + undoHandle` 是最低标准。
- 人类按钮和 Agent 工具调用必须使用同一 action；不能做 UI-only 暗状态。
- 写操作必须过 permission，写入 `SessionEvent`，并给出撤销或明确 `undoHandle.type='none'` 的原因。
- 不能让 Agent 通过截图、DOM、鼠标坐标来操作 Fleet 内部 UI；这些只能作为外部 App 兜底。

## 5 · 四个工作面的 Agent-native 最小闭环

每个工作面都要先做一个样板闭环，不要继续堆 UI。

验收句式固定为：

> 人能做一次，Agent 用同一 action 做一次，进 timeline，可撤销，有权限。

| 工作面 | 最小对象 | inspect | select | edit | undo |
|---|---|---|---|---|---|
| 无限画布 | 节点 / 图层 / 组件 | 读节点树、布局、选区 | 按 id / 坐标 / 类型选节点 | 移动、改尺寸、改样式、插入节点 | 原生 history 或 inverse patch |
| AIGC | 生成任务 / 输入资产 / 输出资产 | 读任务、模型、成本、输入引用 | 选任务或资产 | 创建/取消/重试 job，保存结果到 Library | 取消 job 或移除输出引用 |
| 网页/文档 | BrowserPane 选择 / 文档块 / Artifact | 读页面证据、文档块、文件 diff | 选 DOM 证据或文档块 | 标注、修改块、保存 artifact | 文档 history / patch inverse |
| 视频剪辑 | 媒体 / 轨道 / 片段 / 关键帧 | 读轨道和片段表 | 选片段或时间区间 | 裁剪、移动、分割、加字幕 | 时间线 history |

先选一个 surface 做完整样板，再推广。推荐第一个样板：

```text
surface: files 或 web-doc
actions:
  inspect_current_workspace
  select_file_or_block
  edit_file_or_block
  undo_last_edit
要求:
  同一操作必须同时有 UI entry 和 agent tool entry
  每次写入必须产生 SessionEvent
  undo 必须能恢复前一状态或至少恢复引用关系
```

## 6 · Skill 不是提示词

Fleet 的 Skill 必须是能力包，不是单纯提示词。**`FleetSkillManifest` 的唯一定义见 `docs/39 §5.7`（含 `requiredExternalJobs`）**，下面是字段示意。一个流程化 Skill 至少声明：

```ts
interface FleetSkillManifest {
  id: string
  name: string
  version: string
  description: string
  allowedInternalActions: string[]
  requiredMcp?: string[]
  requiredCli?: string[]
  requiredApi?: string[]
  requiredExternalJobs?: string[]
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

Record & Replay / Skill Distiller 的方向也要按这个模型执行：先录内部语义 action，再蒸馏成可回放 Skill。截图、坐标、DOM 和全局录屏只能当证据或 fragile fallback。

## 7 · MCP / CLI / API 的边界

内部能力走本地 action bus / RPC。外部能力才走 MCP / CLI / API。

| 场景 | 正确路径 |
|---|---|
| 改 Fleet 内部画布节点 | Internal action |
| 移动视频片段 | Internal action |
| 修改文档块 | Internal action |
| 浏览当前工作区文件 | Internal action / local RPC |
| 调用 Git / 测试 / 构建 | CLI，经 permission 和 timeline |
| 调外部设计/部署/模型服务 | API / MCP / External Job，经 permission 和成本记录 |
| 控制外部网页 | Browser/CDP/Computer Use，经证据包和权限 |
| 控制 Fleet 自己的按钮 | 禁止截图/DOM/鼠标，必须 internal action |

这样做的收益：

- token 更少：Agent 读 schema 和对象摘要，不读截图和长 DOM。
- 安全更高：每个 action 有 permissionLevel 和明确写入范围。
- 稳定性更强：UI 改版不影响 action schema。
- 可回放：timeline 记录 action、输入、输出、undo handle。

## 8 · UI 设计原则：少即是多

各页面功能设计必须采用“少即是多”：

- 少按钮、少模式、少隐藏状态。
- 一个功能只保留一个主入口；高级选项进入渐进披露。
- 页面文字只解释必要状态，不写教程式说明。
- 重复操作抽成 action，不靠多个相似按钮堆功能。
- Agent 能读懂页面状态：关键对象、选区、任务、权限、成本要有结构化摘要。
- 人类 UI 越简单，Agent 操控难度越低，token 越少，速度越快，输出质量越稳定。

## 9 · 参考产品吸收方式

| 参考 | 吸收什么 | 边界 |
|---|---|---|
| AionUi | CLI / ACP / Skill / team 生命周期、进程管理、多 Agent 协作 | 适配进 craft session/timeline/permission，不迁第二套会话 |
| Hermes | Custom ACP 参考 | 不变成内置真相，不替代 Fleet action bus |
| OpenClaw | browser/gateway/profile 隔离 | 不当普通 CLI；不做 stealth/反检测 |
| Multica / Warp / Zed | runtime、terminal、Agent 组织方式 | 只学组织边界，不把 Fleet 做成终端壳 |
| Craft Pi | built-in managed runtime | 保留为内置 managed runtime，和 external CLI runtime 分层 |
| Codex Record & Replay | 用户录制到 Skill 的产品方向 | proprietary 黑盒参考；Fleet 只录内部 action，不能复制实现或资源 |
| Codex 官方插件 | 能力目录、Skill/工具桥的产品方向 | 不能冒充官方；迁任何源码先过许可证闸 |

## 10 · 后续智能体优化任务

下一轮深度优化不要先做新 UI。按这个顺序做：

1. **盘点当前内部能力**：列出现有按钮、菜单、工具、RPC、session command，对应是否有 internal action。
2. **补 Internal Action Registry 文档和类型**：已收口到 `docs/40`（唯一 `InternalActionDefinition` + `ActionSurface` + `files` 样板）；按它落地，不再另写类型草案。
3. **做一个样板闭环**：推荐 `files` 或 `web-doc`，实现 `inspect/select/edit/undo`。
4. **把样板接到 timeline 和 permission**：不能只跑本地函数。
5. **给 Agent 暴露同一 action**：不是新 MCP，不是截图，不是 DOM。
6. **更新 Skill manifest 草案**：声明 allowedInternalActions、外部依赖、上下文摘要和权限边界。
7. **回查 UI**：删掉或灰掉没有真实 action 的按钮，减少页面状态和重复入口。

## 11 · 完成标准

一个优化 PR 只有满足以下条件，才能标为 `usable`：

- 至少一个 surface 有完整 `inspect/select/edit/undo` action 闭环。
- 人类 UI 和 Agent 调用同一 action。
- 写操作经过 permission，写入 timeline。
- Skill / Recorder / Plugin 文档知道如何引用这些 action。
- 未接通能力标为 `display-only` 或 `not implemented`，不做假按钮。
- 没把 Fleet 继续推向多 CLI 管理器。

如果只写了 UI、只接了 CLI、只新增了 MCP、只跑了截图自动化，状态都只能是 `display-only` 或 `wired but not visually checked`，不能算完成。
