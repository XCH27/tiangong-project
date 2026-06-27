# Workbench 阴影与裁切层级

> 速查：对话框 / 终端 / Tool Dock 底边 `shadow-middle` 被裁掉时，按本文「布局契约」查，不要零散加 wrapper。

## 布局契约（单一真相，禁止打地鼠）

`PanelStackContainer` 桌面内容区只有 **两种模式**，由 `hasBottomModule` 切换：

| 模式 | 结构 | 禁止 |
|---|---|---|
| **A. 无终端（craft 基线）** | `scrollRef` → `motion.div` flex 行 → sidebar / navigator / **PanelSlot 直接 sibling**（grid 时仅多一层 `overflow-visible` grid 壳） | 不要在 PanelSlot 外包 `flex-col` + `overflow-auto` |
| **B. 有终端（Fleet 扩展）** | 上述 flex 行内 **唯一** 的 `flex-1 flex-col`：上 `overflow-visible z-[1]` 面板区 + 下 `z-0` 终端槽，`gap: PANEL_GAP` | 面板区禁止 `overflow-auto` / `overflow-x-auto` |

**阴影 gutter**：仅 `scrollRef`（及 Tool Dock `aside`）持有 `paddingBlock/marginBlock: ±PANEL_STACK_VERTICAL_OVERFLOW`。其它层默认 `overflow-visible`。

**终端叠层**：面板 `isAboveBottomModule` → `z-[1]` + 底内圆角；终端 `z-0`。

## 硬规则

1. **禁止** 在 `shadow-middle` 祖先上使用 `overflow-auto`（含 `overflow-x-auto` + `overflow-y-visible` 组合）。
2. **禁止** 为修阴影/高度再加第三套 wrapper；只能改 A/B 两种模式之一。
3. 终端间距用 `PANEL_GAP`，不用 `pt-1` / `height + 4`。
4. Tool Dock / 终端模块：`WorkbenchModuleFrame` 外壳 `overflow-visible`，内容区 `overflow-hidden`。

## Tool Dock 高度契约

与 `PanelStackContainer` 同一 flex 行时：

| 节点 | 类 / 样式 | 禁止 |
|---|---|---|
| 外层壳 | `self-stretch h-full min-h-0 shrink-0 flex-col` | 单独 `h-full` 在 aside 上 |
| `aside` | `flex-1 min-h-0 flex-col` + ±8px block gutter | `h-full` 代替 flex-1 |
| 每个模块 | `flex-1` + `flex: ratio 1 0px` | 固定 `min-h-[120px]` 组件默认值 |

## 层级（L0–L6）

| 层 | 节点 | overflow | 阴影 |
|---|---|---|---|
| L0 | AppShell shell row | hidden | — |
| L1 | `PanelStackContainer` scrollRef | x:auto, y:hidden + ±8px block | — |
| L2 | 终端模式内容列 | visible | — |
| L3 | 面板区 wrapper（仅模式 B） | visible, z-[1] | — |
| L4 | `PanelSlot` | hidden（内容裁切） | shadow-middle |
| L5 | 终端槽 | visible, z-0 | — |
| L6 | `WorkspaceContextSidebar` aside | visible + ±8px block | 子模块 shadow-middle |

## 验收

1. 单聊天框、不开终端 → 底边阴影与 craft 一致。
2. `Cmd+J` 开终端 → 聊天↔终端之间阴影完整。
3. 终端 / Tool Dock 贴窗口底边阴影完整。
