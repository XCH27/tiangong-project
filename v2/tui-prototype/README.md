# OmniVerse Vision · V2 终端原型（Ink）

> 状态：**PROTOTYPE**，轻量 Ink TUI，先验证视觉语言。mock 数据 + 预留 REST/SSE 接入点。
> 实现 `docs/V2_TUI_REDESIGN.md` 四态主线的前三态：**输入 → 计划 → 运行**（+ 失败 fallback / 完成）。
> 隔离：独立 worktree `agent/v2-ui-prototype`，不碰 backend/mcp/v1/QUEUE 与 Codex G2。

## 启动

```bash
cd v2/tui-prototype
npm install
npm run dev          # 直接在终端里跑（tsx，无需先 build）
```

构建/类型检查：`npm run build`（→ dist/，已验证）、`npm run typecheck`（0 error）。

> 需要在**真实终端**里跑（要 TTY 才能接收键盘）。在管道/非 TTY 环境只渲染不收键。

## 操作

- **输入态**：直接打字即输入框；贴链接会即时识别平台并预判路线；`Tab` 切换 Skill；回车 → 进入计划态。
  - 试失败分支：链接后加 `#blocked` / `#ratelimit` / `#oom`。
- **计划态**：看 AnalysisPlan 卡（平台/字幕/深度/耗时/成本/磁盘/风险/降级/警告）；`回车`确认运行，`Esc`取消。
- **运行态**：实时 7 步管线，当前步高亮，跳过/降级有语义色；完成进 done。
- 全局：`2` 切四季主题（热切不重启）；`Esc` 返回/退出；`q` 退出。

## 复刻的 V1 视觉

固定英文大标题 `OmniVerse Vision` + 副标题、四季 token（`src/theme/themes.json` 单一真相源）、`┃` accent 竖条、Mimi 表情（`•ω•`/`·ω·`/`•‿•`/`×﹏×`）、语义色（进度/计划/成本/降级/fallback 不复用 accent）。用 Ink 重新实现，不照搬 Textual workaround。

## 哪些是 mock，后面接哪个 API

UI 只跟 `src/transport/client.ts` 的 `Transport` 接口对话。现在是 `MockTransport`（脚本化 SSE + 假数据）。

| 界面 | mock | 真实 API（docs/BACKEND.md） | Gate |
|---|---|---|---|
| 平台预判/元数据 | mockMetadata | `GET /api/v1/probe` | G1 |
| 计划卡 | mockPlan | `POST /api/v1/plan` → AnalysisPlan | G1.5 |
| 运行进度 | 脚本 SSE | `POST /analyze` + `GET /tasks/{id}/events` | G1 |
| 失败 fallback | 脚本 error | SSE error + core/errors.py | G2 |
| Doctor/硬件 | mockDoctor | `GET /api/v1/doctor` | G1.5 |

切真实后端：实现 `RestTransport`（接口已在 client.ts 定义），`OE_LIVE=1` 启用，UI 零改动。

## 目录

```
v2/tui-prototype/
├── package.json · tsconfig.json
└── src/
    ├── main.tsx                # render(<App/>)
    ├── types/contracts.ts      # 镜像后端 REST/SSE/schema（与 web-prototype 同源）
    ├── theme/themes.json       # 四季 token 单一真相源
    ├── theme/theme.ts
    ├── transport/client.ts     # Transport 接口（REST/SSE 接入点）
    ├── mock/{data,MockTransport}.ts
    └── ui/{App,Input,Plan,Run,Bits}.tsx
```

## 边界

不嵌后端、不改接口、不发明后端能力；资产态（态④）待 G3 真数据再做；只走 REST/SSE。未 commit。
