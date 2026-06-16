# Fleet 桌面开源项目优势调研

> 当前状态：参考资料。现在桌面主基座已经是 craft-agents-oss，本文中涉及 Kun/Cherry/Zed 等项目的内容只能黑盒参考，不能直接复制源码，除非许可证单独核准。

> 目的：桌面端不只等于 Electron 壳。Fleet 后续要长期稳定承载 Agent、终端、工具、浏览器和文件工作区，所以桌面层必须先吸收成熟项目的窗口生命周期、托盘、菜单、协议、打包、更新、诊断和资源分发经验，再结合 Fleet 裁剪实现。

## 1 · 总结路线

Fleet 桌面端继续保持 **Electron + React + TypeScript**。不切 Tauri、Swift/AppKit、Rust/GPUI 或 Rust/warpui 主栈。

桌面能力吸收路线：

| 能力 | 主参考 | 吸收重点 |
|---|---|---|
| 窗口生命周期 / 多窗口 | `源码参考/cherry-studio` | WindowManager、窗口类型注册、singleton/default/pooled 生命周期、窗口预热、创建事件时序、Dock 可见性 |
| 轻桌面壳 / 图标 / 发布纪律 | `源码参考/Kun` | 图标路径解析、asar 图标加载、托盘 fallback、appId 稳定性、签名/公证 gating、更新通道和 artifact 命名 |
| 工具型桌面资源分发 | `源码参考/craft-agents-oss` | bundled tools、resources/bin、SDK/native binary、ripgrep、平台过滤、窗口状态、深链恢复、失败重载 |
| 托盘 / bridge / 设置联动 | `源码参考/AionUi` | 主窗口引用绑定、托盘动态菜单、close-to-tray、deep link、update diagnostics、zoom/theme/system bridge |
| 专项交互参考 | `cmux`、`golutra`、`opencode`、`warp`、`zed`、`multica` | 面板、终端、原生焦点、透明窗口、跨端 UI、编辑器级体验；只吸收专项，不改变主栈 |

## 2 · 项目优势对照

### Cherry Studio

必看路径：

- `源码参考/cherry-studio/docs/references/window-manager/*`
- `源码参考/cherry-studio/docs/references/lifecycle/*`
- `源码参考/cherry-studio/src/main/core/window/WindowManager.ts`
- `源码参考/cherry-studio/src/main/core/window/windowRegistry.ts`
- `源码参考/cherry-studio/src/main/core/lifecycle/*`
- `源码参考/cherry-studio/src/main/services/protocol/ProtocolService.ts`
- `源码参考/cherry-studio/src/main/core/diagnostics.ts`
- `源码参考/cherry-studio/src/main/core/logger/LoggerService.ts`

优势：

- WindowManager 是服务化能力，不是散落的 `new BrowserWindow()`。窗口类型通过 registry 描述，支持 `default`、`singleton`、`pooled` 三类生命周期。
- 对高频窗口有预热池、回收上限、惰性/主动 warmup、GC 和 suspend/resume 语义，适合 Fleet 未来的选择助手、悬浮工具、截图/OCR、小窗任务。
- 文档明确窗口创建时序：创建原生窗口、挂内部监听、注册映射、触发 domain hook、再加载内容。这个顺序能避免 ready-to-show、IPC 和复用窗口监听错位。
- lifecycle 系统把 `BeforeReady`、`Background`、`WhenReady` 分开，能减少冷启动阻塞，并保证协议监听在 macOS cold-start open-url 之前注册。
- ProtocolService 处理 macOS `open-url`、Windows/Linux `second-instance`、cold-start argv、Linux AppImage `.desktop` deep link，边界完整。
- 诊断和 logger 体系适合 Fleet 后续把“桌面运行状态”暴露到设置页或诊断面板。

Fleet 采用：

- P1 引入轻量版 `WindowManager`：先做 main/settings/tool 三类窗口的 singleton/default 管理、窗口状态持久化、创建/销毁事件。
- P2 扩展 deep link/protocol/open-file 路由，避免散落在入口文件。
- P4 再考虑 pooled 小窗和窗口预热，不在 M0/M1 过早增加复杂度。

不采用：

- 暂不完整移植 IoC/lifecycle 装饰器体系。Fleet 当前规模还不需要全量服务容器，先保留清晰模块边界，必要时再升级。

### Kun

必看路径：

- `源码参考/Kun/src/main/app-icon.ts`
- `源码参考/Kun/electron-builder.config.cjs`
- `源码参考/Kun/src/main/gui-updater.ts`
- `源码参考/Kun/src/main/settings-store.ts`
- `源码参考/Kun/scripts/mac-notarize.cjs`
- `源码参考/Kun/scripts/verify-apple-signing.cjs`

优势：

- 桌面壳克制，适合 Fleet 的“新手友好本地助手”气质。
- `app-icon.ts` 对 Vite/Rollup asset URL、asar 内资源、Windows 绝对路径误判、托盘专用图 fallback 有明确处理。
- builder 配置非常重视发布连续性：appId 不随品牌变化、Windows NSIS 升级语义、macOS 签名/公证按 env gating、update channel 校验、artifactName 稳定。
- 把 signing/notarization 状态写入 build hints，适合 Fleet 后续在诊断页展示“当前包是否可分发”。

Fleet 采用：

- 已经吸收图标资源方向；后续继续按 Kun 的路径解析和 buffer 加载方式补强托盘/窗口图标。
- 打包发布以 Kun 为主参考，特别是 appId 稳定、更新通道、macOS hardened runtime、公证脚本、Windows installer 语义。

不采用：

- 不吸收品牌化桌面装饰/陪伴组件作为核心功能。Fleet 的桌面个性可以轻，但核心仍是 Agent 控制台。

### craft-agents

必看路径：

- `源码参考/craft-agents-oss/apps/electron/electron-builder.yml`
- `源码参考/craft-agents-oss/apps/electron/src/main/window-manager.ts`
- `源码参考/craft-agents-oss/apps/electron/src/main/window-state.ts`
- `源码参考/craft-agents-oss/apps/electron/src/main/auto-update.ts`
- `源码参考/craft-agents-oss/apps/electron/src/main/menu.ts`
- `源码参考/craft-agents-oss/apps/electron/src/main/thumbnail-protocol.ts`
- `源码参考/craft-agents-oss/apps/electron/resources/*`

优势：

- 资源分发非常贴近 Fleet：MCP server、session server、CLI tools、Python scripts、SDK native binary、ripgrep、Bun/uv 这类工具都被当作桌面资源体系管理。
- `electron-builder.yml` 对 mac/win/linux 平台资源过滤、extraResources、native binary、artifact 命名、DMG 背景、NSIS 权限限制都有明确策略。
- WindowManager 处理 workspace 窗口、focused mode、窗口标题策略、renderer 加载失败重试、deep link 初始导航、系统主题变化、Cmd/Ctrl+W close source、IPC fallback timeout。
- URL safety 分类清楚，外链、内部 deep link、危险协议不混在一起。

Fleet 采用：

- 工具资源打包按 craft 方案推进：`resources/bin`、平台目录、extraResources、工具 wrapper、native binary resolver。
- 窗口状态、加载失败重试、close source 元数据、外链安全分类可以直接进入 Fleet P1/P2。

不采用：

- 不照搬 Craft 文档工作区/OAuth/企业协作定位。Fleet 只吸收工具工作区和桌面工程能力。

### AionUi

必看路径：

- `源码参考/AionUi/packages/desktop/src/process/utils/mainWindowLifecycle.ts`
- `源码参考/AionUi/packages/desktop/src/process/utils/tray.ts`
- `源码参考/AionUi/packages/desktop/src/process/utils/deepLink.ts`
- `源码参考/AionUi/packages/desktop/src/process/utils/windowBounds.ts`
- `源码参考/AionUi/packages/desktop/src/process/utils/zoom.ts`
- `源码参考/AionUi/packages/desktop/src/process/services/autoUpdaterService.ts`
- `源码参考/AionUi/packages/desktop/src/process/services/autoUpdateDiagnostics.ts`
- `源码参考/AionUi/packages/desktop/src/process/bridge/*`
- `源码参考/AionUi/packages/desktop/src/renderer/components/WindowControls.tsx`

优势：

- `bindMainWindowReferences` 把主窗口绑定给 tray、deep link、application bridge，入口关系清晰。
- 托盘菜单是动态的：最近会话、运行任务数、新聊天、暂停任务、检查更新、关于、重启、退出，接近 Fleet 未来需要的“后台任务控制台”。
- close-to-tray、dock show/hide、主窗口恢复聚焦、托盘菜单刷新、语言刷新都有现成边界。
- bridge 层覆盖 application、dialog、notification、system settings、theme、update、window controls，适合 Fleet 把 Electron 能力安全暴露给 renderer。
- update diagnostics 和设置页联动值得吸收，避免更新失败只留在日志里。

Fleet 采用：

- P1 做托盘最小闭环：显示/隐藏主窗口、新任务、运行任务数、退出。
- P2 做 bridge 分层：窗口控制、主题、通知、更新检查、系统设置入口。
- P3 做 update diagnostics 到设置页。

不采用：

- 不把复杂频道、桌面装饰/陪伴组件、移动端能力提前塞进桌面壳。它们属于后续 M3+。

### 专项项目

| 项目 | 桌面优势 | Fleet 取舍 |
|---|---|---|
| `源码参考/cmux` | macOS 原生多面板、焦点控制、socket policy、浏览器/预览 pane、任务卡片 | 参考面板和焦点策略，不切 Swift/AppKit |
| `源码参考/golutra` | Tauri 透明窗口、自定义 chrome、xterm 集成 | 参考轻量透明窗口和终端边界，不切 Tauri |
| `源码参考/opencode` | CLI/TUI 会话、PTY 状态机、权限和恢复 | 参考终端与会话严谨性，不把 TUI 做主界面 |
| `源码参考/warp` | Agentic Terminal、块状输出、命令历史、终端质感 | 参考交互和视觉，不切 Rust/warpui |
| `源码参考/zed` | 编辑器级命令面板、低延迟输入、侧栏密度、Agent panel | 参考 UX 密度和命令体系，不做 Rust/GPUI 编辑器 |
| `源码参考/multica` | Electron/Next/Expo/shared UI 多端组织、shadcn/lucide/tailwind 风格 | 参考跨端 UI 组织，不把 Fleet 做成 SaaS 后台 |

## 3 · Fleet 桌面端优先级

### P1：可靠桌面壳

- 建立 `WindowManager`：主窗口、设置窗口、工具窗口统一创建/查询/关闭。
- 加窗口状态持久化：大小、位置、最大化、显示器变动兜底。
- 加托盘最小闭环：显示/隐藏、新建任务、运行任务数、退出。
- 设置页显示桌面诊断：版本、资源路径、工具 backend、签名/更新状态占位。

参考：Cherry Studio WindowManager、AionUi tray、craft window-state、Kun app-icon。

### P2：原生入口和安全边界

- deep link/protocol/open-file 统一路由。
- 外链安全分类：内部协议、外部 URL、危险 scheme 分开处理。
- native menu 和快捷键：新任务、设置、开发者工具、复制粘贴、窗口控制。
- renderer bridge 分层，禁止 renderer 直接碰 Node 能力。

参考：Cherry Studio ProtocolService、craft URL safety、AionUi bridge。

### P3：发布和更新工程

- electron-builder 配置补齐 mac/win/linux 策略。
- appId、artifactName、update channel 固定。
- macOS signing/notarization gating 和 diagnostics。
- resources/bin、native tools、平台过滤、extraResources 明确化。

参考：Kun builder/signing、craft resources/extraResources。

### P4：高级桌面能力

- pooled 小窗：选择助手、截图/OCR、悬浮工具、快速命令。
- multi-window：任务窗口、浏览器 pane、设置窗口、知识库窗口。
- window pinning、透明/紧凑模式、全局快捷键、OCR/selection assistant。

参考：Cherry Studio pooled windows、Cherry selection/OCR、cmux panes、golutra transparent shell。

## 4 · 验收边界

桌面模块验收时必须检查：

- 窗口：重复打开是否复用、关闭是否清理、关闭来源是否区分、显示器变化是否兜底。
- 托盘：macOS Dock 语义、Windows 托盘图标、退出和 close-to-tray 是否分开。
- 协议：cold start/hot start/second-instance/deep link/open file 是否都能路由。
- 资源：dev/prod/asar/extraResources 路径是否一致，缺资源是否有诊断。
- 更新：未签名本地包不应假装可更新；签名/公证缺失要可见。
- 安全：外部 URL、内部 deep link、危险 scheme 不得混用。
- 测试：至少覆盖 window manager 纯逻辑、图标路径解析、builder 配置、smoke 打开设置页和主窗口。

## 5 · 执行规则

1. 桌面相关功能开工前，先查本文件对应路径。
2. 新增桌面模块计划必须包含“参考实现对照”，写清采用和未采用。
3. 可以移植模式和状态机，不复制品牌资产、logo、文案和商业身份。
4. 先做 Fleet 需要的窄实现，再按 P1-P4 迭代；不要一次性搬完整框架。
