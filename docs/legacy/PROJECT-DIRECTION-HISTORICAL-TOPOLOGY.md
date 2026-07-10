# PROJECT-DIRECTION Historical Topology (Archived)

> **Status:** historical only — not a delivery contract
> **Archived:** 2026-07-09 from former `PROJECT-DIRECTION.md` §§13–17
> **Do not use** for wave gates, process topology, or SQLite/daemon assumptions.
> Binding W1/W2 spine: `docs/PROJECT-DIRECTION.md` §13 and D38.
> Binding upstream: `docs/UPSTREAM-BASELINE.md`.

## Historical Architecture Draft (Superseded)

Unverified estimates, SQLite/daemon topology, and F Track references. Retained only to explain
why Electron-shell reuse was considered.

### Architecture route comparison (historical)

| 对比项 | 方案 A：从零重写 (Tauri 壳) | **方案 B：原版补强 (Electron 壳) [最终选型]** |
|---|---|---|
| **状态共享** | ❌ 需在 Rust 侧新造 IPC 共享层，CLI/GUI 数据同步极难 | ✅ **天然共享**：CLI 和 GUI 均为平等的 RPC 客户端连入同个 Bun Server |
| **开发工作量** | ❌ 约 16 周（重写 Shell/Session/审批/时间线） | ✅ **约 8 周**：仅针对 CLI、Browser、Canvas 进行增量补强 |
| **CDP 自动化** | ❌ 需在 Tauri 重写无头/可视化窗口控制 | ✅ **直接复用**：已有成熟的 `BrowserPaneManager` 原生操控 |
| **内存/资源开销** | ✅ 极低 (50-100MB) | ⚠️ 稍大 (150-250MB) |
| **选型结论** | ❌ 投入产出比极低，且严重违背全局决策 D27-R | ✅ **最优解：避免重复造轮子，实现核心业务功能快速收敛** |

### Physical runtime topology (historical — not binding)

```text
┌─────────────────────────────────────────────────────────────────┐
│  Bun Headless Server (packages/server) ← 核心状态常驻             │
│  - WebSocket RPC 协议支持 (MessageEnvelope 规范)                 │
│  - SessionManager / SQLite 持久化 / 本地 API 路由                 │
└─────────────────────────────────────────────────────────────────┘
       ▲                          ▲
       │ WebSocket (craft-cli)    │ WebSocket (Electron)
       │                          │
┌───────────────┐        ┌──────────────────────────┐
│  craft-cli    │        │  Electron Desktop App    │
│ 补强 CLI 客户端│        │  复用原版 + 补强 Surface   │
│ (apps/cli/src)│        │  (apps/electron/src)     │
└───────────────┘        └──────────────────────────┘
```

## Historical Delivery Spine

Limited delivery to the core terminal/CLI interaction loop:

1. **M00 (Platform Spine)**: one local state/permission/timeline authority; physical storage was
   not yet verified.
2. **M03 (Internal Action Registry)**: Structured action routing pipeline (PreInvoke / PostInvoke hooks).
3. **M02 (Terminal CLI Runtime)**: Local CLI `craft-cli` command launcher using the bounded Fleet Bridge/local runtime path defined for the active wave.

## Historical Wave Non-Goals

- Canvas/Design Surface (M07): no infinite canvas stubs or OpenPencil bindings.
- AIGC Jobs Surface (M08): no external job executor loops or batch API routing.
- Video Surface (M09): no FFmpeg rendering, timelines, or clipping components.
- Complex Browser Editing (M06): no DOM mutation bindings, browser automation scripts, or external crawler hooks.
- Secondary Systems: no secondary session store, permission model, or memory database.

## Historical Surface Entry Conditions

- Browser (M06): M00, M03, M05 usable.
- Canvas (M07): M00, M03, M05 usable.
- AIGC / Video (M08/M09): M00, M03, M05 usable; cost may be `UNKNOWN` until M11 usable.

## Historical Usability Summary

`usable` required: persistence through canonical authority, L0–L3 permission, timeline evidence,
agent-callable actions, and honest undo/evidence for destructive work.

Live criteria remain in `docs/PROJECT-DIRECTION.md` §10 and `docs/DEVELOPMENT-PROCESS.md`.
