# 37 · 右侧 Tool Dock 与 Codex 能力接入计划

> 状态日期：2026-06-27（§0/§6 增补 Craft 原生 UI 栈与 Workbench 布局契约）
> 目标：把默认工作台右侧停靠区改成 Claude Code 风格的独立模块区。Progress、Files、Review、Record & Replay 等右侧模块各自独立运动；当前 Terminal 仍是 `Cmd+J` 中间内容区下方卡片，D19 目标态再迁到一等 terminal surface；Browser 沿用现有入口。所有新增能力必须真实接后端、权限和 timeline 后才能点亮。
> 主线约束：本页只定义右侧模块和终端面板的放置/迁移，不改变 `docs/38-内部结构化能力与Agent-native优化主线.md` 的方向，也不替代 `docs/38-API-CLI分离与跨Runtime团队编排.md`（即原 docs/38-API-CLI分离与跨Runtime团队编排.md，已合并）的混合 Runtime 协议。Fleet 不做“多 CLI Agent 管理器”；Review 的只读状态/差异查看可先走本地 Git RPC，任何 stage/commit/checkout/push/create PR 等写操作必须先有 Internal Action Registry、permission、timeline 和可回放/可撤销边界。Record & Replay 等能力点亮前也必须先有真实后端，不能只加 UI 卡片。
> **动手前**：Workbench 壳层/UI 改造必须先读 **§0 设计规范** 与 **§6 布局契约**；挂点速查见 `docs/00A` §4「Workbench 布局 / Tool Dock」行。

---

## 0 · Craft 原生 UI 栈与设计规范（Fleet 二开必须沿用）

Fleet 默认工作台 **不重做壳层**，只在 craft-agents-oss 现有组件栈上扩展挂点。以下是与布局/模块 chrome 相关的**单一真相**；与 `WorkbenchModuleFrame` 等 Fleet 临时平行栈冲突时，以本节为准。

### 0.1 技术栈

| 层 | 路径 / 包 | 用途 |
|---|---|---|
| 基础组件 | `renderer/components/ui/*` | shadcn 模式：Radix + CVA + Tailwind v4 |
| 共享 UI | `@craft-agent/ui` | 跨端复用 primitive |
| 图标 | `lucide-react` | 全应用统一 |
| 动画 | `motion/react` | 侧栏/导航/面板宽度过渡 |
| 状态 | Jotai | `panel-stack`、focused panel 等 |
| 横向分屏 | `components/ui/resizable.tsx` | `react-resizable-panels` 封装 |
| 横向 seam | `PanelResizeSash` + `gradient-resize-handle` | 内容面板之间、侧栏/content 之间 |
| 布局常量 | `app-shell/panel-constants.ts` | **唯一** gap/inset/radius/sash 几何来源 |

**禁止**在 `app-shell/` 再引入第二套 gap/radius/sash 常量文件；Fleet 专用行为放进 `workbench-layout.ts`（网格规格、Tool Dock overlay 策略），不重复定义 `PANEL_GAP` 等。

### 0.2 面板 chrome 分层（两种合法壳，不可混用第三套）

| 场景 | 壳组件 | Header | 典型节点 |
|---|---|---|---|
| 会话/设置等内容面板 | `PanelSlot` → `MainContentPanel` → `Panel` + **`PanelHeader`（50px）** | 标题、Token 环、关闭 | `shadow-middle` / `shadow-panel-focused` 在 **PanelSlot 外层** |
| 左侧 Navigator | `motion.div` + 内嵌 Session 列表 | Session 列表自带行 chrome | 同节点：`overflow-hidden` + `shadow-middle` + `RADIUS_*` |
| 右侧 Tool Dock 模块、中间 Terminal 卡片 | **`CraftModulePanel`** | **`h-10`（40px）** 紧凑标题栏 + icon/title/关闭 | **四角统一 `RADIUS_INNER`（10px）**，独立卡片叠放；`shadow-middle` + `border` 同节点 |

- **内容聊天区**必须用 `PanelHeader`，不得把 Tool Dock 的 `h-10` header 套进 `ChatPage`。
- **Tool Dock / Terminal** 必须用 `CraftModulePanel`，不得再扩 `WorkbenchModuleFrame` 平行 API。
- **不得**为对齐高度另写 `WorkbenchModuleFrame` 式「模块窗口 chrome」挂到 Navigator 或 PanelSlot 上。

### 0.3 布局与阴影 token（`panel-constants.ts`）

| 常量 | 值 / 含义 |
|---|---|
| `PANEL_GAP` | 相邻面板水平/网格间距（6px） |
| `PANEL_EDGE_INSET` | 窗口左/右/底外缘 inset（6px） |
| `RADIUS_EDGE` / `RADIUS_INNER` | 贴窗角 / 面板间内角（macOS 14/10，其它平台 8/10） |
| `PANEL_STACK_VERTICAL_OVERFLOW` | 为 `shadow-middle` 预留的上下 breathing room（8px）；**只**在 `PanelStackContainer` 的 `scrollRef` 上通过 padding/margin 对消 |
| `PANEL_MIN_WIDTH` | 所有内容面板统一最小宽度（300px）；`getAdaptivePanelMinWidth()` 恒返回此值 |
| `PANEL_SASH_*` | 所有 resize seam 命中区与 flex gap 补偿 |

阴影类名（Tailwind / CSS 变量）：`shadow-middle`（默认面板）、`shadow-panel-focused`（多面板时聚焦列）。**Craft 基线**：阴影与 `overflow-hidden`、圆角在**同一 DOM 节点**（Navigator、`PanelSlot`、Tool Dock 模块）。布局修复时**不得**为「修裁剪」把 shadow 拆到父级 wrapper——上一轮把 gutter 挪到 AppShell 或 shadow/overflow 拆层曾同时破坏 Navigator 与内容列。

### 0.4 终端升级为一等面板（D19 · 2026-06-27）

> **Fleet owns the team, CLI owns a run.** 终端从底部卡片迁移到一等面板，详见 `docs/38-API-CLI分离与跨Runtime团队编排.md`、`docs/23 Surface 分离目标`。

**当前事实**：
- 终端是 `Cmd+J` 底部卡片（`AppShell.isBottomTerminalVisible`），不是一等面板。
- 终端卡片 chrome 当前用 `WorkbenchModuleFrame`（**不是** `CraftModulePanel`）；L1 步骤会迁移。
- `surface = 'terminal'` 会话标识、一等面板 grid 并排均**未实现**，是 D19 目标态。

**D19 目标态**：
- 终端面板：可多开、进多面板 grid、与 API 队员对话并排显示。`surface = 'terminal'` 的会话绑定 CLI runtime。
- CLI runtime 选择只在终端面板内：普通对话框（`surface = 'chat'`）不出现 CLI runtime picker。
- 跨 lane 并排：用户可在多面板 grid 里同时排 CLI 队长终端和 API 队员对话，实现"队长 CLI 编码 + 同时看到 API 队员对话"的跨 lane 体验。
- 现有底部终端卡片保留兼容：`Cmd+J` 当前仍打开底部终端卡片；迁移到一等面板后，底部卡片改为面板入口或默认 terminal panel。
- 终端面板目标态用 `CraftModulePanel` chrome（§0.2 契约），当前底部卡片仍用 `WorkbenchModuleFrame`，L1 步骤迁移。

### 0.5 垂直/网格分屏（Tool Dock 多模块）

- Tool Dock 多模块：锁在 **单一 `aside` 网格盒**内（`tool-dock-layout.getToolDockGridSpec`），`grid-template-*: minmax(0,1fr)` + `gap: PANEL_GAP`；关闭模块后网格重算，剩余卡片 **自动填满**。
- 1 模块：1×1；2 模块：上下两行；3 模块：上二下一（与内容区 3 面板同构）。**禁止**模块浮在盒外或只占内容高度。
- 重排：标题栏 / 顶部胶囊 **pointer 拖拽**，`reorderModules(from,to)` 持久化 `activeModules` 顺序；落点由 `data-tool-dock-cell` 命中。
- 比例调整（可选后续）：网格 track 比例持久化；当前默认等分 `1fr`。

### 0.6 TopBar / 模块入口

- 右侧模块：`TopBar` ← `toolDockControls` ← `AppShell` + `TOOL_DEFINITIONS`。
- Terminal 当前态：`TopBar` 终端按钮 / `Cmd+J` → **仅**切换中间内容列下方 Terminal 卡片，**不**进入 Tool Dock 列表。D19 目标态迁到一等 terminal panel。
- Browser：现有 Globe / Browser panel，**不**进入 Tool Dock。

---

## 1. UI 决策

- 右侧不做三栏换位，不再给左侧导航/中间内容/右侧栏加左右移动按钮。
- 右侧不是一个叫“工具”的父组件，不显示父级标题/父级卡片；它只是模块停靠区。
- 右上角 `TopBar` 全局功能按钮负责点亮/关闭右侧模块；右侧区域内部只显示已点亮模块本身。
- 单个模块开启时，模块占满右侧停靠区。
- 多个模块开启时，按内容友好比例上下分屏；每个模块可以通过标题栏或顶部胶囊拖动改变顺序，模块之间的分隔热区可调整相邻模块比例，双击恢复自动分屏。
- 顶部胶囊是交互提示，不是常驻装饰：只有鼠标进入模块顶部透明热区时才淡入显示。
- 右侧栏整体仍沿用现有显示/隐藏、宽度拖拽、空间不足自动 overlay 的 AppShell 逻辑。
- Browser：已经有右上角 Globe / Browser panel 入口，继续走现有 BrowserPane/CDP，不进入右侧模块列表。
- 本机终端/CLI Runtime：当前保留 Codex 风格 `TopBar` 终端 toggle（`Cmd+J`），终端实际打开中间内容区对话框下面的独立卡片；它不属于右侧 Tool Dock、`ChatPage`、`ChatDisplay`、输入框、`PanelSlot` 或 `AppShell` 独立底部 dock。当前会话输入区 CLI Runtime 链路继续用于 Agent runtime 选择；D19 目标态会迁到 `surface='terminal'` 的一等终端面板，普通对话只保留 API。
- 终端卡片必须复用 Craft 模块卡片语言：同样的圆角、边框、阴影、`h-10` header、icon/title/关闭按钮排布；不要把终端做成独立应用窗口 chrome、右侧工具模块或聊天框内部附件。终端标题栏可拖动，把终端切换到对话模块上方或下方；顶部胶囊仍用于高度调整。后续同一中间面板可参考 Cursor 扩展为 tab 容器，兼容终端、浏览器、文件等工作区能力。
- 多内容面板布局只影响工作区内部：新建内容面板时默认重新等分可用空间；2 个内容面板默认折叠右侧 Tool Dock，但右上角模块按钮仍可把它作为 overlay 重开；3 个及以上自动折叠最左侧全局 sidebar，保留“所有会话”navigator 并切网格，左上侧栏按钮必须能把自动折叠的全局 sidebar 重新打开。3 面板用上二下一，默认上下 50/50、上排左右 50/50；4 面板用 2×2，默认 50/50 行列等分；3/4 面板中线可拖拽调整；5 用上三下二，6 用上三下三，最多 6 个。任何侧栏/模块展开都必须让中间工作区按 flex/grid 自动缩放，不得覆盖或挤坏其他模块。
- 中间对话面板也是模块：顶部胶囊可拖动改变同级对话面板顺序。所有模块拖动都必须保持非重叠布局（重排/换位/调整比例），不得做遮挡内容的自由悬浮层。
- 侧边聊天：不需要，删除该规划项。

## 2. 当前可用状态

- `Files`：usable。复用现有 `FilesListPanel` 和只读文件 RPC。
- `Progress`：usable。复用现有 `SessionProgressCard` 和 `session.progress` 数据。
- `Review`：usable/read-only。右侧模块显示当前 Git 仓库状态、分支、GitHub CLI 登录态、remote、变更文件和选中文件 diff；点击“预览”复用原文件预览。它不是完整 Git 客户端，暂不提供 stage/unstage/commit/checkout/push/create PR。
- `Record & Replay`：not implemented。真实 Recorder 后端接好前不显示可用入口。
- `Browser`：usable through existing top-right Browser button / BrowserPane, not a right-side module.
- `Terminal`：wired but not visually checked. `TopBar` terminal toggle / `Cmd+J` opens an independent terminal card below the conversation content area, backed by current-window Electron IPC, Python stdlib PTY host, local login shell, xterm rendering, resize forwarding, and cwd-based workspace restart. It is not inside the right Tool Dock, ChatPage, ChatDisplay, the conversation/input module, PanelSlot, AppShell bottom dock, or the CLI Runtime selector/settings page.
- `CLI Runtime`：usable through the existing session input runtime picker/settings path; this is the migration-period implementation. D19 target moves CLI runtime selection into terminal surface.

## 3. 当前代码对照

| 能力 | 当前代码事实 | 文档/配置事实 |
|---|---|---|
| 右上角模块按钮 | `TopBar.tsx` 接收 `toolDockControls`；`AppShell.tsx` 用 `TOOL_DEFINITIONS` 渲染右侧模块按钮。`TopBar` 的终端按钮和 `Cmd+J` 只切换中间内容区下方的 terminal card。 | Browser 不进入右侧模块列表；Terminal 也不进入右侧模块列表。 |
| 右侧模块区 | `WorkspaceContextSidebar.tsx` 渲染 `progress/files/review`；多模块时用 **flex-col + `ModuleResizeSash`**（**不是** `ResizablePanelGroup`）；各模块 chrome 当前仍用 **`WorkbenchModuleFrame`**（目标态迁 `CraftModulePanel`，L1 步骤）。`review` → `GitReviewPanel` + `git:getReview` / `git:getFileDiff`；`recordReplay` 不渲染占位。 | `Files`、`Progress` 标 `usable`；`Review` 标 `usable/read-only`；`Record & Replay` 当前不显示。 |
| 本地审查 RPC | `protocol/git.ts` 定义 `GitReviewState` / `GitFileStatus` / `GitFileDiffResult`；`system.ts` 注册 `git:getReview` 和 `git:getFileDiff`；`GitReviewService` 只用 `execFile` 调 `git`/`gh`，不拼 shell 字符串，并把路径限制在工作区/仓库内。 | LOCAL_ONLY/工作区文件系统读能力。写操作不得复用这些只读 RPC 偷跑，必须升级成 code/internal action。 |
| 文件预览 | Tool Dock `Files` 模块内联文稿预览（`ToolDockFilesModule` + `ToolDockDocumentPreview`）：Markdown 用 `Markdown mode=full`，代码/JSON/文本用 `ShikiCodeViewer`，图片用 data URL；PDF/不可预览类型提示并用全屏 overlay（`onOpenFile`）打开。 | 不做 MarkItDown/OCR/转写/依赖图等重功能人类按钮；这些交给 Agent 动作或后续后端。 |
| GitHub 设置 | `Settings → GitHub` 只显示本机 `gh auth status`、当前工作区 GitHub remote 和连接说明；不存 Fleet 自己的 GitHub token。 | 不做假的一键连接/PR 侧栏；PR/Push/Create PR 需真实 GitHub/permission/timeline 后再点亮。 |
| 模块顺序与比例 | `useWorkspaceToolDock` 持久化 active ids + ratios；flex+`ModuleResizeSash` 拖动比例；双击 sash → `resetRatios`。内容面板 `equalizeProportions` 等分；3 面板上二下一、4 面板 2×2（`workbench-layout.ts`）。**内容面板胶囊重排（`reorderPanelsAtom`）not implemented**。终端高度 AppShell 指针拖拽 + `bottomTerminalHeight` 持久化。 | 文档必须写清“胶囊只在 hover 顶部热区时出现”；拖动是非重叠重排，不是悬浮遮挡。 |
| 终端面板 | `TopBar` / `Cmd+J` → `AppShell.isBottomTerminalVisible`（**不是** `isTerminalPanelVisible`）；**仅当终端打开时** `PanelStackContainer` 才包一层 content 列（上：内容面板，下：`BottomTerminalPanel`）；终端关闭时内容面板与 Navigator **同级** `h-full` flex peer（craft 基线）。Terminal 当前用 **`WorkbenchModuleFrame`**（目标态 `CraftModulePanel`，L1 未做）+ xterm；PTY 见 `interactive-terminal-ipc.ts`。 | `wired but not visually checked`；不属于 Tool Dock / ChatPage / PanelSlot 子树。**`workspaceTerminalPanelPlacement` / `terminalPlacement` 不存在，终端上下换位 not implemented**。 |
| i18n | 当前只保留实际使用的 `bottomPanel.toggle` 和 `toolDock.*` 键；旧 CLI 状态卡片相关 `bottomPanel.*` 键已删除。 | 文档不得再引用 `currentRuntime/currentModel/openCliSettings` 这类旧卡片字段。 |
| UI 样式 | 终端卡片复用 Craft 模块卡片视觉；顶部入口按钮复用 `TopBarButton`。 | 不允许在终端里另写独立应用窗口式 chrome；不允许把终端移进右侧 Tool Dock。 |

## 4. 后续点亮顺序

1. `Review` 写操作：把 stage/unstage/commit/branch checkout/create/push/create PR 逐项登记为 `code` surface internal actions，接 permission + timeline 后再点亮。
2. `Record & Replay`：按 `docs/39` 和 `docs/38-内部结构化能力与Agent-native优化主线.md` 先录 Fleet 内部语义动作 / internal actions，生成声明 allowedInternalActions 的 Skill 包；Codex 官方实现只能黑盒参考。

## 5. 验收口径

- 模块交互：`usable`，必须能显示/隐藏、单模块占满、多模块分屏、拖动比例、双击恢复。**拖动模块顺序（`usePointerDragReorder`）已接入 `WorkspaceContextSidebar`，需目视验证**。
- **内容面板胶囊重排（`reorderPanelsAtom`）：not implemented，标 Phase 2。**
- 未接工具：`display-only` 或 `not implemented`，不得显示成可用。
- 终端面板上下换位（`terminalPlacement`）：not implemented，标 Phase 2。
- UI 改动必须同步 `docs/00A`，后端点亮时还要同步 tool schema/permission/timeline 文档。

---

## 6 · Workbench 布局契约与改造步骤（2026-06-27）

> 对照基线：Fleet 布局 **`362d02b1`**；craft 原版（无 Tool Dock / 无 content 列 terminal）**`2e930d55`**。改造目标：**保留 Fleet 功能挂点，收回 craft 高度模型**。

### 6.1 桌面 Workbench 行结构（唯一合法拓扑）

```
AppShell shellRef (flex row, gap: PANEL_GAP)
├── PanelStackContainer.scrollRef          ← PANEL_STACK_VERTICAL_OVERFLOW 只在这里
│   └── motion.div.flex.h-full
│       ├── sidebar slot
│       ├── navigator slot                 ← h-full peer，勿改 shadow/overflow 拆层
│       └── content area
│           ├── [无 terminal] 直接 flex/grid + PanelSlot（与 navigator 同级高度模型）
│           └── [有 terminal] flex-col：上 PanelSlot 区，下 BottomTerminalPanel（固定/AppShell 拖拽高度）
├── WorkspaceContextSidebar（docked 时 shell 兄弟，非 scrollRef 内）
│   └── 与 scrollRef 相同：`paddingBlock/marginBlock: ±PANEL_STACK_VERTICAL_OVERFLOW`
└── workspace-context 横向 sash（AppShell 绝对定位，几何来自 panel-constants）
```

**禁止**

1. 在 AppShell `shellRef` 外再包 `PANEL_WORKBENCH_ROW_GUTTER` 或第二套 vertical overflow wrapper。
2. 无 terminal 时使用 `flex-col` + 内层 `overflow-auto` 包裹内容面板（会导致与 Navigator 高度不一致、阴影被裁）。
3. 为 Tool Dock 对齐而修改 Navigator 的圆角/overflow/shadow 节点结构。
4. 用 flush 的 `ResizablePanelGroup` 堆叠 Tool Dock 模块（阴影/间距必须用 `PANEL_GAP` seam）。
5. Terminal 打开时给 bottom slot 额外 `pt-1` / `height + 4` 魔法数。

### 6.2 改造顺序（Lead 单次 Wave，避免并行改壳）

| 步 | 动作 | 文件 |
|---|---|---|
| L0 | 文档冻结 §0/§6（本页）+ `00A` 挂点行 | `docs/37`、`docs/00A` |
| L1 | 引入 `CraftModulePanel`，替换 `WorkbenchModuleFrame` | `CraftModulePanel.tsx`，`BottomTerminalPanel.tsx` |
| L2 | Tool Dock 多模块：`flex-col` + `ModuleResizeSash`（`PANEL_GAP`）+ `CraftModulePanel` | `WorkspaceContextSidebar.tsx` |
| L3 | `PanelStackContainer`：terminal 关闭 → craft 直接 flex peer；terminal 打开 → content 列 split | `PanelStackContainer.tsx` |
| L4 | 删除 `WorkbenchModuleFrame.tsx`（已由 `CraftModulePanel` 替代） | 仅当无引用 |
| L5 | 手测 + `./scripts/fleet-verify.sh` | — |

**保留不动（除非 bug）**：`TopBar`/`WorkspaceSwitcher` 工作区 pill、横向 workspace-context sash。

### 6.4 多面板自适应（2026-06-27）

- **左右侧栏不因内容面板数量自动收缩**：左侧 sidebar / 右侧 Tool Dock 保持用户可见状态；多面板时由 `PanelStackContainer` 内容区横向滚动（`overflow-x: auto`）自适应，而非 ≥2 隐藏 Tool Dock、≥3 折叠 sidebar。
- **Tool Dock 浮层**：仅当 shell 宽度不足以同时满足「固定列 + Tool Dock + 内容区最小宽度」时自动切 overlay（`canDockWorkspaceContextSidebar`）；与面板个数无关。

### 6.3 手测清单

- [ ] 单内容面板、终端关闭：Navigator / Chat / Tool Dock 底边对齐，Navigator 阴影完整（与改前「所有会话」一致）。
- [ ] `Cmd+J` 打开终端：内容区与 terminal split，无多余 4px 缝；关闭 terminal 后恢复 craft 直接 flex。
- [ ] Tool Dock 开 2+ 模块：拖拽重排、关闭后自动填满网格。
- [ ] ≥2 内容面板：左右侧栏保持可见，内容区横向滚动自适应；窗口极窄时 Tool Dock 才自动 overlay。
- [ ] `./scripts/fleet-verify.sh` 通过。

---

## 7 · 问题汇总、一次性修复方案与验收标准（2026-06-27）

> **目的**：把本轮 Workbench 改造中已暴露的问题、文档/代码漂移、未闭环能力收口成**一条 Lead Wave**，避免「修 A 坏 B、文档写一套代码另一套、拖动写了但从不生效」的重复返工。
>
> **对照基线**：布局 **`362d02b1`**；craft 无 Tool Dock/terminal **`2e930d55`**。未提交 diff 以本机 `git status` 为准，**不得**把 Agent 口头「已完成」当事实。

### 7.1 问题清单（按严重度）

| ID | 严重度 | 现象 | 根因（代码事实） | 相关文件 |
|---|---|---|---|---|
| **L1** | P0 | 多功能同开：内容区与 Tool Dock / 终端 / 多面板 **重叠、裁切、高度不齐** | ① 内容 grid 写死 `minHeight = rows×280+gap`，终端打开后可用高度不足仍强制最小高度 → 纵向溢出；② `canDockWorkspaceContextSidebar` 失败时 Tool Dock 走 **absolute overlay**，不预留宽度，压在内容上；③ shell / content 列 `min-h-0` 链不完整时 flex 子项撑破父级 | `PanelStackContainer.tsx`、`AppShell.tsx`、`workbench-layout.ts` |
| **L2** | P0 | 逐项 **关闭** 模块/面板后：空白滚动区、圆角错误、Tool Dock  dock/overlay 抖动 | ① 面板数减少后 `scrollRef.scrollLeft` 未 clamp；② overlay↔docked 切换时 `isAtRightEdge` 仍按 docked 算；③ 无统一的 layout transition 状态机 | 同上 |
| **L3** | P0 | Tool Dock **拖拽重排从未生效** | ~~header-only pointer~~ → **`usePointerDragReorder` document 级**（W2 已修） | `WorkspaceContextSidebar.tsx` |
| **L4** | P1 | Tool Dock **比例调整**（2 模块） | ~~grid 等分~~ → **2 模块 flex + ModuleResizeSash + ratios**（W3 已修）；3 模块仍等分 grid | 同上 |
| **L5** | P1 | 内容面板顶部胶囊换位 | ~~未实现~~ → **`reorderPanelsAtom` + PanelSlot 胶囊**（W4 已修） | `panel-stack.ts`、`PanelSlot.tsx` |
| **L6** | P1 | 终端「拖到对话上方/下方」未实现 | 仅 `BottomTerminalPanel` 有 `resize-y` 胶囊调高度，无 **上下换位** 状态 | `AppShell.tsx`、`PanelStackContainer.tsx`、`BottomTerminalPanel.tsx` |
| **L7** | P2 | Files **文稿预览**半落地 | `ToolDockFilesModule`/`ToolDockDocumentPreview` 已加但未纳入门禁；i18n 曾缺 `sort-locales` | 新文件 + `AppShell` onFileClick 分支 |
| **D1** | P0 | ~~文档与代码不一致~~ **已修**（2026-06-27） | §3 表已改为当前代码事实：flex-col + `ModuleResizeSash`（不是 `ResizablePanelGroup`）；模块 chrome 当前 `WorkbenchModuleFrame`（目标 `CraftModulePanel`） | `docs/37` §3/§6 |
| **D2** | P1 | 改造中途 **未提交 diff** 叠加 NavigationContext 等并行改动 | 难以 bisect；界面「非常错乱」难定位是布局还是导航回归 | 全量 `git diff` |
| **R1** | — | **同一错误反复犯** | 用 padding/overlay/自动 hide 侧栏「腾空间」而非让内容区 scroll；shadow/overflow 拆层；第二套 shell wrapper；写了 drag handler 但未 document capture | `AGENTS.md` 规则 9/24、`docs/00A` |

### 7.2 设计原则（修复时不得违反）

1. **三道闸**（见 `docs/00A`）：改 UI 前读挂点地图；挂槽三问；一条主干不并行堆按钮。
2. **唯一布局常量**：`panel-constants.ts` + `workbench-layout.ts`（网格规格 only），禁止新 magic number。
3. **唯一 chrome**：内容 `PanelHeader`；Tool Dock/Terminal `CraftModulePanel`；禁止复活 `WorkbenchModuleFrame` 第三套。
4. **侧栏策略**：不因面板 **个数** 自动折叠 sidebar / 隐藏 Tool Dock（§6.4 已拍板）；空间不足时 **只** 让 `PanelStackContainer` 内容区滚动，或 Tool Dock 在 **宽度真不够** 时 overlay——overlay 必须 **不遮挡可交互内容**（reserve padding 或半透明 scrim + 明确关闭）。
5. **拖动协议**：凡拖拽 resize/reorder，一律 **pointerdown 起 + document/window pointermove/up + cleanup**；与 `PanelResizeSash`/`ModuleResizeSash` 同模式，禁止只在 React 子节点上绑 move/up。
6. **开/关成对验收**：每个 UI 开关必须有「全开矩阵」与「逐项关闭」两条路径的手测，不能只测打开。

### 7.3 修复波次（Lead 单次 Wave，禁止并行改壳）

| 步 | 目标 | 动作 | 文件（所有权） |
|---|---|---|---|
| **W0** | 冻结契约 | ① 更新 §3/§6 与代码一致；② 下文验收表进 CI 前 checklist；③ `bun run sort-locales` + `fleet-verify` 绿 | `docs/37`、`docs/00A` |
| **W1** | 布局不重叠 | ① 终端打开时 grid 行轨改为 `minmax(0,1fr)`，去掉与终端争高的 `minHeight`；② content+terminal 列保证 `min-h-0 flex-1 overflow-hidden`，必要时内容区 **仅** 在 grid 容器上 `overflow:auto`；③ overlay 时给 `PanelStackContainer` 或 shell 加 `paddingRight = toolDockWidth` **或** 废弃 overlay 改为始终 docked + 水平 scroll（二选一，**推荐后者** 与 §6.4 一致）；④ 面板/侧栏关闭时 clamp `scrollLeft` | `PanelStackContainer.tsx`、`AppShell.tsx`、`workbench-layout.ts` |
| **W2** | Tool Dock 拖动可用 | ① 抽 `usePointerDragReorder`（document 级）；② header + 顶部胶囊共用；③ drag 期间 `user-select:none`；④ 单测保留 `reorderToolDockModules` + 可选 RTL 模拟 | `WorkspaceContextSidebar.tsx`、`CraftModulePanel.tsx`、新 hook |
| **W3** | Tool Dock 比例（2 模块） | ① 2 模块：**flex-col + ModuleResizeSash + ratios**（与 §0.4 一致）；② 3 模块：保持 grid 等分，比例调整标 **Phase 2** 或 grid track 绑定 ratios；③ 双击 sash → `resetRatios` | `WorkspaceContextSidebar.tsx`、`useWorkspaceToolDock.ts` |
| **W4** | 内容面板重排 | ① 新增 `reorderPanelsAtom(from,to)`；② `PanelSlot`/`PanelHeader` 顶部胶囊（仅 multi-panel）接 W2 同款 hook；③ grid 模式按 index 重排 stack，比例 `equalizeProportions` | `panel-stack.ts`、`PanelSlot.tsx`、`PanelStackContainer.tsx` |
| **W5** | 文稿预览闭环 | ① 可预览文件内联、不可预览走 `onOpenFile`；② 全屏按钮走 overlay；③ i18n 七语 | 已有 ToolDock* + `AppShell` |
| **W6** | 终端上下换位（可选） | `terminalPlacement: 'below' \| 'above'` 持久化 + `PanelStackContainer` 子节点顺序对调；**W1–W4 绿后再做** | `AppShell.tsx`、`PanelStackContainer.tsx` |

**禁止**：W1–W4 未绿前改 `NavigationContext`、WorkspaceSwitcher 等与布局无关文件。

### 7.4 检查表（实施人自检，逐项打勾）

#### A. 自动化门禁

- [ ] `./scripts/fleet-verify.sh` 全绿（含 `sort-locales`）
- [ ] `tool-dock-layout.test.ts` 通过
- [ ] `workbench-layout.test.ts` 通过
- [ ] 新增：`panel-stack` reorder atom 单测（W4 后）

#### B. 布局 — 打开路径（「全开矩阵」）

在 **桌面宽度 ≥1440px** 窗口，依次叠加，每步目视 + 截图：

| 步骤 | 操作 | 必须通过 |
|---|---|---|
| B1 | 默认：1 会话 + 左栏 + Navigator + Tool Dock 1 模块 | 底边对齐；Navigator 阴影完整；无横向滚动条（除非窗口故意缩窄） |
| B2 | Tool Dock 开满 progress/files/review（3 模块） | 三格填满右列高度；`PANEL_GAP` 缝可见；无模块浮在盒外 |
| B3 | 再开 2 个会话面板（共 3 内容面板，上二下一 grid） | 左/右栏 **仍可见**；内容区出现横向滚动；**无** panel 与 Tool Dock 重叠 |
| B4 | `Cmd+J` 开终端 | 终端在内容列下方；chat 阴影不被裁；grid 行 **不** 把终端挤出视口（无纵向叠压） |
| B5 | Files 点选 `.md` | 列表+文稿预览同格；不全屏 overlay |
| B6 | 缩窗至 ~1200px | Tool Dock 仍 docked **或** overlay 但不挡输入框/关闭按钮；无不可点区域 |

#### C. 布局 — 关闭路径（与 B 对称，顺序相反）

| 步骤 | 操作 | 必须通过 |
|---|---|---|
| C1 | 关终端 | 内容 grid 恢复满高；无残留空白条 |
| C2 | 关 2 个会话面板 → 剩 1 面板 | 横向 scroll 回弹（`scrollLeft` clamp）；圆角 `isAtRightEdge` 正确 |
| C3 | Tool Dock 关 2 模块 → 剩 1 模块 | 单模块 **撑满** 右列；无 1/3 高度空白 |
| C4 | 隐藏 Tool Dock（TopBar toggle） | 内容区扩宽；再打开恢复宽度与模块状态 |
| C5 | 隐藏左 sidebar | 仅左栏收起；Navigator/内容/Tool Dock 不断链 |

#### D. 拖动与比例

| 步骤 | 操作 | 必须通过 |
|---|---|---|
| D1 | Tool Dock：拖 review 到 progress 上 | 顺序持久化（刷新后保持）；drag 时目标格 **高亮** |
| D2 | Tool Dock：2 模块垂直 sash 拖 | 比例变化；双击 sash 等分 |
| D3 | 内容区：2 面板 horizontal sash | 仍可用（回归） |
| D4 | 内容区：拖 panel 胶囊换位 | **not implemented**（`reorderPanelsAtom` 未实现）；标 Phase 2 |

#### E. 文档同步（W0/W6 末）

- [ ] `docs/37` §3 表与 §6.2 步骤描述 == 实际实现
- [ ] `docs/00A` Workbench 行与 §6.4 一致
- [ ] 未实现项（终端上下换位、3 模块比例）标 **⏳ Phase 2**，不得写 `usable`

### 7.5 验收标准（Definition of Done）

**总标准**：在 B+C+D 全套手测通过 + A 自动化绿 + E 文档一致之前，**不得**宣称 Workbench 布局/Tool Dock 交互「已完成」。

| 能力 | 验收标准 |
|---|---|
| 多面板自适应 | ≥3 内容面板 + 3 Tool Dock 模块 + 终端同开：无 z-index 叠压；侧栏不自动消失；关闭任一项后无空白 scroll、无永久 overlay |
| Tool Dock 重排 | 标题栏或顶部胶囊拖动，**离开 header 仍跟手**；刷新/workspace 切换后顺序保持 |
| Tool Dock 比例 | 2 模块：sash 可调 + 双击复位；3 模块：等分填满（或文档写明 Phase 2） |
| 文稿预览 | md/code/图片内联；pdf/二进制提示全屏；不抢全局 overlay |
| 回归 | 单面板 + 无终端 与 craft 基线 `2e930d55` 视觉同级（Navigator 阴影、圆角、高度） |

### 7.6 返工禁令（犯过一次的不要再犯）

| 禁止 | 应做 |
|---|---|
| ≥2 面板就 `setIsSidebarVisible(false)` 或 hide Tool Dock | 内容区 `overflow-x:auto` + `getRequiredContentSize` 只用于 scroll 宽度计算 |
| Tool Dock overlay 盖在输入框上且无 padding | 始终 docked，或 overlay + `paddingRight` / 可-dismiss scrim |
| grid 写死 `PANEL_MIN_HEIGHT` 且终端同开 | 终端同开时行轨 `minmax(0,1fr)`，最小高度降到 0 或 `min(280, 可用高×比例)` |
| 只在 header 上绑 `onPointerMove` | document 级 drag，与 `ModuleResizeSash` 一致 |
| 文档写 ModuleResizeSash 代码用 grid 不接线 | W0 改文档或 W3 改代码，**只留一种真相** |
| 未跑 `fleet-verify` 就交付 | 每 Wave 结束必须绿 |
| 布局 Wave 顺手改 NavigationContext | 分 commit / 分 PR；布局 Wave 只碰 §7.3 文件清单 |

### 7.7 建议提交切分（便于 bisect）

1. `fix(workbench): layout overflow and scroll clamp` — W1
2. `feat(tool-dock): pointer drag reorder + 2-module resize` — W2+W3
3. `feat(panels): reorder content panels via header grip` — W4
4. `feat(tool-dock): inline document preview` — W5
5. `docs: sync workbench acceptance with code` — W0/E

每 commit 对应 §7.4 中一个子集的手测通过后再合下一 commit。
