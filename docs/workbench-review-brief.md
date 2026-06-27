# Workbench 修复审查简报（2026-06-27）

## 背景
Fleet Workbench（Tool Dock + 多面板 + 终端）存在重叠、拖动不生效、关闭后布局错乱。按 `docs/37` §7 实施 W1–W4 修复。

## 变更文件（核心）
- `AppShell.tsx` — 移除 Tool Dock overlay；始终 docked；传 moduleRatios/resize
- `PanelStackContainer.tsx` — 终端同开时 grid 行轨 `minmax(0,1fr)`；scrollLeft clamp；内容面板 reorder hook
- `WorkspaceContextSidebar.tsx` — document 级 drag；2 模块 flex+ModuleResizeSash；3 模块 grid
- `usePointerDragReorder.ts` — 新 hook（document pointermove/up）
- `PanelSlot.tsx` — 顶部胶囊 + data-content-panel-index
- `panel-stack.ts` — `reorderPanelsAtom`
- `CraftModulePanel.tsx` — 胶囊默认 opacity-30

## 验收矩阵（docs/37 §7.4）
- 全开：sidebar + navigator + 3 内容面板 + 3 Tool Dock 模块 + 终端
- 关闭：逐项关闭，无空白 scroll、无 overlay 叠压
- 拖动：Tool Dock 标题/胶囊；2 模块 sash；内容面板胶囊

## 审查请回答
1. 仍存在的 P0/P1 问题（含具体文件/行）
2. 开/关路径是否还有状态机漏洞
3. 与 docs/37 §6/§7 不一致处
4. 建议的下一步（不超过 3 条）
