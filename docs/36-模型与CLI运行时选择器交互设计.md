# 36 · 模型 / CLI 运行时选择器交互设计（单一真相）

> 状态日期：2026-06-23
> 起因：commit `2756b7dc` 把 CLI Runtime 同时塞进顶部栏和输入框模型选择器，且把"运行方式"和"模型"两条正交轴拍平成一个列表，导致截图里 `本机 CLI / API 模型 / Opus 4.8` 双勾混乱。本文是这个选择器的**唯一交互真相**，实现以本文为准；冲突处以 `docs/00A` 红线兜底。
> 适用文件：`renderer/components/app-shell/input/FreeFormInput.tsx`、`CompactModelSelector.tsx`、`cli-runtime-model-picker.ts`、`components/app-shell/TopBar.tsx`。

---

## 1 · 核心：两条正交轴，绝不拍平成一个列表

一次发送的"用什么跑"其实是一条路径：**运行方式 → 模型（→ 推理强度）**。

| 轴 | 含义 | 取值 |
|---|---|---|
| **运行方式 Runtime** | 谁来执行 | `API（当前连接）` 或本机已检测到的 AionUi ACP 候选（Claude Code / Codex / Goose）/ Custom ACP runtime |
| **模型 Model** | 在该运行方式下用哪个模型 | API：Opus 4.8 / Sonnet 4.6 / Haiku 4.5 / Fable 5…；CLI：该 CLI 动态暴露的模型，或"模型由 CLI 管理" |
| **推理强度 Effort** | 推理深度 | 仅对支持的运行方式显示（如 API 的"最大/扩展推理深度"） |

**错误现状**：`[API 模型, CLI runtime]` 和 `[Opus, Sonnet, Haiku…]` 和 `[最大]` 被放进同一个扁平菜单 → `API 模型`(运行方式) 和 `Opus 4.8`(模型) 同时打勾，用户分不清在选什么。

---

## 2 · 输入框底部三个独立按钮：CLI | 模型 | Token 环（2026-06-23 用户拍板）

输入框右下角放**三个各管一件事的独立按钮**，不再合并：

| 按钮 | 管什么 | 点开 |
|---|---|---|
| **CLI** | 运行方式（API / 已检测到的 Goose / Custom ACP runtime；Claude Code、Codex 需 native adapter） | 运行方式列表 + "管理本机 CLI…"跳设置页。选 API → `cliRuntimeId=null`；选 CLI → 写 `cliRuntimeId` |
| **模型** | 当前运行方式下的模型（如 `API · Opus 4.8`） | API 模型列表 + 推理强度；CLI 则是其动态模型或"模型由 CLI 管理"（禁用） |
| **Token 环** | 只读：上下文占用 % | 上下文/额度详情弹层（`electronAPI.getSessionUsage`），context 与 plan 分开 |

- **删除 `TopBar` 里的 `TopBarCliRuntimeSelector`**（顶部重复入口）；运行方式只在输入框的 CLI 按钮里选。
- **CLI 按钮和模型按钮分开**：CLI 选"谁执行"，模型选"用哪个模型"，互不嵌套、不出现双勾。
- "管理本机 CLI（增删 custom / 启停 / 测试）"只在**设置页**，CLI 按钮下拉只放快速切换 + 一个"管理…"入口。

---

## 3 · 三个按钮各自的下拉

**CLI 按钮**（chip 文案：`API` 或 CLI 名如 `Codex`）：
```
┌─ 运行方式 ──────────┐
│ ● API（当前连接） ✓ │   ← 选它 → cliRuntimeId=null
│ ○ Claude Code       │   ← 仅本机 PATH 检测到 claude 时显示
│ ○ Codex             │   ← 仅本机 PATH 检测到 codex 时显示
│ ○ Goose             │   ← 仅本机 PATH 检测到 goose 时显示
│ ⚙ 管理本机 CLI…     │   ← 跳设置页
└─────────────────────┘
```

**模型按钮**（chip 文案：`Opus 4.8` 或 `模型由 CLI 管理`）：随当前运行方式变。
```
〔运行方式=API〕 Opus 4.8✓ / Sonnet 4.6 / Haiku 4.5… + 推理强度
〔运行方式=CLI 且暴露模型〕 该 CLI 的 availableModels（一个勾）
〔运行方式=CLI 不暴露模型〕 "模型由 CLI 管理"（整按钮禁用）
```

**Token 环**：只读环显示 `context.percentFull`；点开弹层（`getSessionUsage`），上半"上下文占用"（N/window，CLI 时"由 CLI 管理"），下半"套餐额度"（默认"不可用"，不编造）。**两者分开画，不画进同一个环**。

要点：每个按钮只有一个职责、各自最多一个勾；CLI 按钮和模型按钮**不互相嵌套**（这是修 `2756b7dc` 双勾的关键）。

---

## 4 · 切换行为（交互逻辑）

| 操作 | 效果 |
|---|---|
| 选「API（当前连接）」 | `cliRuntimeId=null`，回 API 模型路径；模型段显示 API 模型 + 推理强度 |
| 选某个本机 CLI | 写会话 `cliRuntimeId`；后台 `prepare` 读该 CLI 的 `CliRuntimeModelState`；模型段显示其 `availableModels` 或"模型由 CLI 管理" |
| 在 CLI 下选模型 | 写 `cliRuntimeModelId`；仅当 `canSwitch=true` 才可选，否则该段禁用 |
| 选 API 模型 / 推理强度 | 走原 craft 模型/effort 逻辑，不动 `cliRuntimeId` |
| 有附件时选了 CLI | 发送按钮禁用 + 中文提示（`CLI_RUNTIME_ATTACHMENT_REJECTION`，后端已硬拒绝） |
| 选了 CLI 但本机没装 | 发送时 ACP 启动失败 → 错误进 timeline（不是假装在跑） |

不变量：任何时刻"运行方式"恰好一个、"模型"恰好一个；UI 不出现两个语义冲突的勾。

---

## 5 · 实现边界（避免再次跑偏）

- 只改上面四个文件的**渲染分组与状态**，不新建第二个选择器组件、不在 renderer 存运行时暗状态。
- `cli-runtime-model-picker.ts` 负责把 `CliRuntimeModelState` 归一成"可选模型列表 / 模型由 CLI 管理"，渲染层只读它。
- 顶部 `TopBarCliRuntimeSelector` 删除或降级为只读状态字；删除后注意清掉 `TopBar` 相关 props 透传与 `ChatPage`/`AppShell` 的接线。
- 改完必须在**本机起 Electron 视觉验收**：① 顶部没有重复的运行方式选择器；② 下拉两段、各一个勾；③ 选 CLI 后模型段正确切换；④ 底部 chip 显示完整路径。typecheck 不能替代视觉验收。
