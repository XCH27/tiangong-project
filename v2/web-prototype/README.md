# OmniVerse Vision · V2 Web GUI Prototype

> 状态：**PROTOTYPE**（mock data，可运行，预留 REST/SSE 接入点）。
> 落地 `docs/V2.md` §7「顺带拿到的 Web 端」+ `docs/CLIENT_DESIGN.md` 四态主线，面向**普通用户**的点击式体验。
> 与 Codex 的 G2 后端工作**完全隔离**：独立 worktree（`agent/v2-ui-prototype`），不碰 `backend/`、`mcp/`、`v1/`、`.agent_handoffs/`。

## 为什么是 Web GUI 而不是 pi-tui

`docs/V2.md` 主线把 V2 定为终端 pi-tui（120×30、键盘优先、终端放不了真图）。但你的产品目标是「像手机端一样点击+描述、普通用户能用、美观、可扩展自动化桌面端」——这是 GUI。`docs/V2.md` §7 + §5 明确允许 **`pi-web-ui` 同源 Web 端**作为同一套 token、同一套后端契约的第二端。本原型就是这个 Web 端的可运行落地，**不替代也不阻塞** pi-tui 主线，两者共享 `themes.json` token 与 REST/SSE 契约。

## 启动

```bash
cd v2/web-prototype
npm install
npm run dev          # → http://localhost:5273   （默认 mock 数据）
```

- 构建：`npm run build`（已验证通过）
- 类型检查：`npm run typecheck`（已验证 0 error）

## 四态主线（docs/CLIENT_DESIGN §2）

1. **输入**：大 logo + 单输入框（链接/文件/截图），下方常驻状态行（模型·VLM·隐私层·硬件档）。输入链接即时识别平台并预判路线。
2. **计划**：`probe` + `plan` 后弹 AnalysisPlan 卡（平台/字幕/深度/预计耗时·成本·磁盘/风险/降级路线/警告）→ 用户「确认运行 / 取消 / 改配方」。
3. **运行**：SSE 实时管线（probe→字幕→分段→抽帧→VLM→生成→导出），当前步高亮，完成/跳过/降级各有语义色，可取消。
4. **资产**：左=带可点时间戳与帧引用的图文笔记；右=证据片段 + RAG 问答（答案带出处时间戳）+ 导出 Obsidian。

**失败 fallback**：链接后加 `#blocked` / `#ratelimit` / `#oom` 触发 `DOWNLOAD_BLOCKED` / `RATE_LIMITED` / `OOM_VRAM` 降级，验证「每个状态都有明确下一步」。

## Mock ↔ 真实后端：一行切换

UI 只跟 `Transport` 接口对话（`src/transport/client.ts`）。

| 现在（mock） | 切真实后端 |
|---|---|
| `MockTransport`（`src/mock/`，脚本化 SSE + 假数据） | URL 加 `?live` → 启用 `RestTransport`，经 Vite proxy 打到 `http://127.0.0.1:8000` |

**UI 代码零改动。** 真实后端先 `uv run oe serve --port 8000`。

## 哪些是 mock，后面接哪个后端 API

| 界面区域 | mock 来源 | 真实 API（docs/BACKEND.md） | 后端状态 |
|---|---|---|---|
| 平台识别/元数据 | `mockMetadata` | `GET /api/v1/probe` + metadata.json | PARTIAL |
| AnalysisPlan 卡 | `mockPlan` | `POST /api/v1/plan` → AnalysisPlan | G1.5 |
| 运行进度 | 脚本化 SSE | `POST /api/v1/analyze` → `GET /tasks/{id}/events` | PARTIAL/G1 |
| 资产笔记/片段/帧 | `mockRunResult` | run 资产（scene_markdown / segments / shots） | G3 TARGET |
| RAG 问答 | `mockChat` | `POST /api/v1/chat`（带 citations） | PARTIAL |
| Doctor/硬件 | `mockDoctor` | `GET /api/v1/doctor` + HardwareProfile | G1.5 |
| 最近任务 | `mockRecentTasks` | `GET /api/v1/tasks/recent` | IMPLEMENTED |
| Skill 列表 | `MOCK_SKILLS`（17 个） | `GET /api/v1/skills` | IMPLEMENTED |
| 失败/降级 | 脚本化 error 事件 | SSE `error` + `core/errors.py` 错误码 | TARGET |

所有错误码（`DOWNLOAD_BLOCKED` / `RATE_LIMITED` / `OOM_VRAM` …）取自 `docs/BACKEND.md` 的 errors 契约目标，**未发明新后端能力**。

## 视觉

`src/theme/themes.json` = 四季×日夜的 role token 单一真相源（对齐 `docs/CLIENT_DESIGN §4`）。每主题一个 accent + 一个 laser，语义色（plan/progress/cost/degrade/fallback）独立保留。改色一处生效，可与 V1（Textual CSS 变量）/未来 pi-tui 同源。设置页可热切主题。

## 目录

```
v2/web-prototype/
├── index.html
├── package.json · tsconfig.json · vite.config.ts
└── src/
    ├── main.tsx
    ├── types/contracts.ts      # 镜像后端 REST/SSE/Asset schema
    ├── theme/themes.json       # token 单一真相源
    ├── theme/theme.ts          # applyTheme(CSS 变量)
    ├── transport/client.ts     # Transport 接口 + RestTransport（真实接入点）
    ├── mock/data.ts            # 诚实结构的假数据
    ├── mock/MockTransport.ts   # 脚本化 SSE + 失败分支
    └── ui/
        ├── App.tsx             # 四态状态机
        ├── styles.css          # 全部走 token，响应式
        ├── components/bits.tsx
        └── states/{Plan,Run,Asset,Settings}.tsx
```

## 边界声明

不嵌后端业务；不改任何接口；不碰 `backend/`、`mcp/`、`v1/`、`.agent_handoffs/QUEUE.md` 与当前 G2 任务卡；未 commit（先给你看效果）。
