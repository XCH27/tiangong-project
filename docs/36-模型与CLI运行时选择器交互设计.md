# 36 · 模型 / CLI 运行时选择器交互设计（单一真相）

> 状态日期：2026-06-23
> 起因：commit `2756b7dc` 把 CLI Runtime 同时塞进顶部栏和输入框模型选择器，且把"运行方式"和"模型"两条正交轴拍平成一个列表，导致截图里 `本机 CLI / API 模型 / Opus 4.8` 双勾混乱。本文是这个选择器的**唯一交互真相**，实现以本文为准；冲突处以 `docs/00A` 红线兜底。
> 适用文件：`renderer/components/app-shell/input/FreeFormInput.tsx`、`CompactModelSelector.tsx`、`cli-runtime-model-picker.ts`、`components/app-shell/TopBar.tsx`。

---

## 1 · 核心：两条正交轴，绝不拍平成一个列表

一次发送的"用什么跑"其实是一条路径：**运行方式 → 模型（→ 推理强度）**。

| 轴 | 含义 | 取值 |
|---|---|---|
| **运行方式 Runtime** | 谁来执行 | `API（当前连接）` 或某个本机 CLI（Grok Build / Hermes / OpenCode / Gemini 候选） |
| **模型 Model** | 在该运行方式下用哪个模型 | API：Opus 4.8 / Sonnet 4.6 / Haiku 4.5 / Fable 5…；CLI：该 CLI 动态暴露的模型，或"模型由 CLI 管理" |
| **推理强度 Effort** | 推理深度 | 仅对支持的运行方式显示（如 API 的"最大/扩展推理深度"） |

**错误现状**：`[API 模型, Grok, Hermes, OpenCode, Gemini]` 和 `[Opus, Sonnet, Haiku…]` 和 `[最大]` 被放进同一个扁平菜单 → `API 模型`(运行方式) 和 `Opus 4.8`(模型) 同时打勾，用户分不清在选什么。

---

## 2 · 唯一入口：输入框模型选择器（删掉顶部重复入口）

- **每会话的运行方式 + 模型选择只放在输入框右下角的原模型选择器**（craft 原本就只有这一个）。它是单一真相，写会话 `cliRuntimeId` / model。
- **删除 `TopBar` 里的 `TopBarCliRuntimeSelector`**（顶部"API 模型"pill）。它和输入框选择器功能完全重复，是这次错乱的主因之一。顶部最多保留一个**只读状态字**（显示当前运行方式名，点它跳"本机 CLI"设置页），**不承载选择**。`docs/00A` §4 已写明"别把顶部按钮做成第二套模型中心"。
- "管理本机 CLI（增删 custom / 启停 / 测试）"只在**设置页**，不在这个下拉里做。

---

## 3 · 下拉结构（两段式，每段最多一个勾）

```
┌──────────────────────────────┐
│ 运行方式                       │  ← 分段标题
│  ● API（当前连接）        ✓    │  ← 默认运行方式
│  ○ Grok Build                 │
│  ○ Hermes                     │
│  ○ OpenCode                   │
│  ○ Gemini CLI · 候选          │  ← needsConfirmation 标注"候选"
│  ⚙ 管理本机 CLI…              │  ← 跳设置页（不是一个可选运行方式）
├──────────────────────────────┤
│ 模型                          │  ← 分段标题；内容随"运行方式"变
│  〔运行方式=API〕              │
│   ● Opus 4.8              ✓   │
│   ○ Sonnet 4.6 / Haiku 4.5…  │
│   推理强度：最大 / 标准…       │  ← 仅 API 等支持时显示
│  〔运行方式=某 CLI 且暴露模型〕 │
│   ● <CLI 模型1>          ✓   │  ← 来自 CliRuntimeModelState.availableModels
│  〔运行方式=某 CLI 不暴露模型〕 │
│   "模型由 CLI 管理"（禁用态）  │  ← canSwitch=false
└──────────────────────────────┘
```

要点：

1. **两段视觉分隔**，各自最多一个勾。运行方式选 API → 模型段是 API 模型；选 CLI → 模型段是该 CLI 的 `availableModels` 或"模型由 CLI 管理"。
2. **"API 模型"是运行方式段的第一项**，不属于"本机 CLI"分组；本机 CLI 分组只含真正的 CLI。
3. **底部状态 chip**（输入框右下角那颗，截图里"Opus 4.8"）显示当前完整路径，紧凑：`API · Opus 4.8` 或 `Grok Build · 模型由 CLI 管理`。点它打开同一个下拉。

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
