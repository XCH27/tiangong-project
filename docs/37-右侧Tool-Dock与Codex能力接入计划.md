# 37 · 右侧 Tool Dock 与 Codex 能力接入计划

> 状态日期：2026-06-25
> 目标：把默认工作台右侧停靠区改成 Claude Code 风格的独立模块区。Progress、Files、Review、Record & Replay 等右侧模块各自独立运动；Terminal 走 Cursor/Claude/Codex 式中间内容区下方面板，Browser 沿用现有入口，CLI Runtime 保留会话输入区入口。所有新增能力必须真实接后端、权限和 timeline 后才能点亮。
> 主线约束：本页只定义右侧模块的放置和交互，不改变 `docs/38` 的方向。Fleet 不做“多 CLI Agent 管理器”；Review 的只读状态/差异查看可先走本地 Git RPC，任何 stage/commit/checkout/push/create PR 等写操作必须先有 Internal Action Registry、permission、timeline 和可回放/可撤销边界。Record & Replay 等能力点亮前也必须先有真实后端，不能只加 UI 卡片。

## 1. UI 决策

- 右侧不做三栏换位，不再给左侧导航/中间内容/右侧栏加左右移动按钮。
- 右侧不是一个叫“工具”的父组件，不显示父级标题/父级卡片；它只是模块停靠区。
- 右上角 `TopBar` 全局功能按钮负责点亮/关闭右侧模块；右侧区域内部只显示已点亮模块本身。
- 单个模块开启时，模块占满右侧停靠区。
- 多个模块开启时，按内容友好比例上下分屏；每个模块可以通过标题栏或顶部胶囊拖动改变顺序，模块之间的分隔热区可调整相邻模块比例，双击恢复自动分屏。
- 顶部胶囊是交互提示，不是常驻装饰：只有鼠标进入模块顶部透明热区时才淡入显示。
- 右侧栏整体仍沿用现有显示/隐藏、宽度拖拽、空间不足自动 overlay 的 AppShell 逻辑。
- Browser：已经有右上角 Globe / Browser panel 入口，继续走现有 BrowserPane/CDP，不进入右侧模块列表。
- 本机终端/CLI Runtime：保留 Codex 风格 `TopBar` 终端 toggle（`Cmd+J`），但终端实际打开中间内容区对话框下面的独立卡片；它不属于右侧 Tool Dock、`ChatPage`、`ChatDisplay`、输入框、`PanelSlot` 或 `AppShell` 独立底部 dock。会话输入区 CLI Runtime 链路继续用于 Agent runtime 选择，二者职责分开。
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
- `CLI Runtime`：usable through the existing session input runtime picker/settings path; it remains separate from the terminal module.

## 3. 当前代码对照

| 能力 | 当前代码事实 | 文档/配置事实 |
|---|---|---|
| 右上角模块按钮 | `TopBar.tsx` 接收 `toolDockControls`；`AppShell.tsx` 用 `TOOL_DEFINITIONS` 渲染右侧模块按钮。`TopBar` 的终端按钮和 `Cmd+J` 只切换中间内容区下方的 terminal card。 | Browser 不进入右侧模块列表；Terminal 也不进入右侧模块列表。 |
| 右侧模块区 | `WorkspaceContextSidebar.tsx` 当前渲染 `progress/files/review`；`progress/files/review` 统一由 `WorkbenchModuleFrame` 提供 Craft 风格标题栏、圆角、边框、阴影和关闭按钮，模块内容只负责自身数据展示。`review` 内容由 `GitReviewPanel` 读 `git:getReview` / `git:getFileDiff`；`recordReplay` 不渲染占位入口，等真实 Recorder 后端接好后再加入。 | `Files`、`Progress` 标 `usable`；`Review` 标 `usable/read-only`；`Record & Replay` 当前不显示。 |
| 本地审查 RPC | `protocol/git.ts` 定义 `GitReviewState` / `GitFileStatus` / `GitFileDiffResult`；`system.ts` 注册 `git:getReview` 和 `git:getFileDiff`；`GitReviewService` 只用 `execFile` 调 `git`/`gh`，不拼 shell 字符串，并把路径限制在工作区/仓库内。 | LOCAL_ONLY/工作区文件系统读能力。写操作不得复用这些只读 RPC 偷跑，必须升级成 code/internal action。 |
| 文件预览 | `FileViewer` 继续作为唯一人类文件预览面板：文本/代码读内容，图片和 PDF 用 data URL 轻预览，Office/音视频/字体/未知二进制只显示“无内联预览”并提供打开/定位。 | 不做 MarkItDown/OCR/转写/依赖图等重功能人类按钮；这些交给 Agent 动作或后续后端。 |
| GitHub 设置 | `Settings → GitHub` 只显示本机 `gh auth status`、当前工作区 GitHub remote 和连接说明；不存 Fleet 自己的 GitHub token。 | 不做假的一键连接/PR 侧栏；PR/Push/Create PR 需真实 GitHub/permission/timeline 后再点亮。 |
| 模块顺序与比例 | `workspaceToolDockLayout` 持久化右侧模块 active ids 和 ratios；标题栏/顶部 hover 胶囊拖动顺序，模块间分隔热区调比例，双击清 ratios。中间对话面板通过 `reorderPanelAtom` 重排；新建内容面板时重置为等分，3 面板默认上二下一，4 面板默认 2×2，二者都从 50/50 行列开始并可拖拽中线调整；终端位置通过 `workspaceTerminalPanelPlacement` 在对话模块上方/下方持久化。 | 文档必须写清“胶囊只在 hover 顶部热区时出现”，不得写成常驻装饰；拖动是非重叠重排，不是悬浮遮挡。 |
| 终端面板 | `TopBar` 的终端按钮和 `Cmd+J` 切换 `AppShell` 的 `isTerminalPanelVisible`；`PanelStackContainer` 在中间内容列渲染 `BottomTerminalPanel`，默认在对话模块下方，标题栏可拖动到上方/下方，顶部胶囊调高度；主进程 `interactive-terminal-ipc.ts` 启动 `resources/scripts/terminal_pty_host.py`，通过 OS PTY 运行当前工作区登录 shell；renderer 使用 xterm 写入/显示/resize。显示时启动干净 PTY，隐藏/热更新时杀掉旧 PTY；cwd 优先当前 session workingDirectory，否则当前 workspace root。 | 状态是 `wired but not visually checked`；不是右侧 Tool Dock；不是 `ChatPage`/输入框/`PanelSlot` 子组件；不是 AppShell 独立底部 dock；不是旧 CLI 状态卡片，也不承担模型/Runtime 检测。 |
| i18n | 当前只保留实际使用的 `bottomPanel.toggle` 和 `toolDock.*` 键；旧 CLI 状态卡片相关 `bottomPanel.*` 键已删除。 | 文档不得再引用 `currentRuntime/currentModel/openCliSettings` 这类旧卡片字段。 |
| UI 样式 | 终端卡片复用 Craft 模块卡片视觉；顶部入口按钮复用 `TopBarButton`。 | 不允许在终端里另写独立应用窗口式 chrome；不允许把终端移进右侧 Tool Dock。 |

## 4. 后续点亮顺序

1. `Review` 写操作：把 stage/unstage/commit/branch checkout/create/push/create PR 逐项登记为 `code` surface internal actions，接 permission + timeline 后再点亮。
2. `Record & Replay`：按 `docs/39` 和 `docs/38` 先录 Fleet 内部语义动作 / internal actions，生成声明 allowedInternalActions 的 Skill 包；Codex 官方实现只能黑盒参考。

## 5. 验收口径

- 模块交互：`usable`，必须能显示/隐藏、单模块占满、多模块分屏、拖动模块顺序、拖动比例、双击恢复。
- 未接工具：`display-only` 或 `not implemented`，不得显示成可用。
- UI 改动必须同步 `docs/00A`，后端点亮时还要同步 tool schema/permission/timeline 文档。
