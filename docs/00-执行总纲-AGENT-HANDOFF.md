# 00 · 当前执行总纲（Agent Handoff）

> 状态日期：2026-06-20
> 当前基线：`app/` 已重置为干净 craft-agents-oss 基座；旧二开代码不再作为实现来源。后续按 `docs/19-重启二开与可复用资产清单.md` 重做少量确认有价值的能力。

## 1 · 当前主线

Fleet 当前不再以旧 `app/` 的实现状态作为基线。第一批仍优先重做 **终端 / 本机 CLI Runtime Host**，但必须在干净 craft 基座上重新接入：

- CLI 探测和 Runtime Catalog。
- ACP stdio client / adapter / process registry。
- permission、timeline、错误诊断和停止/清理。
- 聊天区选择、运行态、model/effort、附件边界和设置页管理。

当前可执行 runtime：

- Grok Build：`grok agent stdio`
- Hermes：`hermes acp`
- OpenCode：`opencode acp`
- Custom catalog runtime：用户配置 `command/args/env`

继续 unsupported：

- Codex：当前只确认 `codex mcp-server`，MCP 不等于 ACP。
- Claude：无稳定 ACP/stdio 入口。
- Qwen：未确认 Fleet 当前可消费的 stdio ACP；公开 `qwen serve` / ACP 生态需要进一步 adapter 设计。

CLI Runtime 之外，设计工作流要在新基座重新落地：`WorkbenchShell`、`DesignAction/Patch`、BrowserPane docked Stage、Inspector/Context、Action Ticker 和 Usage/Context Report。旧 UI 形态不迁移；只保留能力边界和测试思路。整条路线见 **`docs/01-产品主干与落地序列.md`**；重做边界见 **`docs/19-重启二开与可复用资产清单.md`**。

贯穿全程的 craft 原始哲学：这个软件本身也是给 AI 操作和编辑的。人类 UI 与 AI 工具必须提交同一套 `DesignAction`，经 `DesignPatch` 写入同一个 session timeline、permission、diff、rollback。接手者动代码前先看 craft 的 `SessionManager`、session tools、`browser_tool`、annotation、permission、file diff/config 写入模式。

## 2 · 当前推进方式

- 默认由 Codex 单人主线推进，不再默认拆多个智能体互相审查。
- 不反复向用户确认；边界清楚时直接做一个用户可见产品闭环。
- 每次动手前先看绿灯项目或黑盒参考的相关做法，判断是否有更好的实现方式。
- 黑盒项目只能借鉴行为和命令输出，不能复制源码、测试、类型、样式、配置或结构。
- 不再保留过程性快照和流水记录；需要恢复点时用 Git 分支/提交。
- 每轮完成必须同步文档，否则后续接手会按过期口径继续犯错。

## 3 · 必读顺序

1. `AGENTS.md`（铁律）
2. `docs/04-产品决策记录.md`（决策真相）
3. `docs/01-产品主干与落地序列.md`（**路线主干 + M0–M3 排序，先懂主线再看专题**）
4. `docs/02-统一创作台与交互模型.md`（**产品定义 + 统一交互模型：是什么、三场景怎么共用一套 UI**）
5. `docs/19-重启二开与可复用资产清单.md`（**当前最关键：迁移资产与新基座重做项**）
6. `docs/24-CLI-Runtime-验收清单.md`
7. `docs/17-Agent协作与管理Agent模型.md`（管理 Agent / 项目 Agent / 自动决策）
8. `docs/18-统一界面信息架构与人机协作总设计.md`（目标态 UI）
9. `docs/16-上下文效率与外部AI审查方案.md`（审查中心）+ `docs/05-记忆系统方案.md`（分层记忆）
10. `docs/15-设计工作流一体化方案.md` + `docs/06-浏览器与网页标注方案.md`
11. `docs/26-源码参考使用规则与索引.md` + `docs/14-源码参考目录专项审计.md`（红绿灯）
12. 具体要改的 craft 模块源码

## 4 · 当前验证入口

默认验证不依赖真实 CLI 登录态：

```bash
./scripts/craft.sh test packages/shared/src/config/__tests__/session-drafts.test.ts
./scripts/craft.sh test apps/electron/src/renderer/components/cli-runtime/__tests__/cli-runtime-form-helpers.test.ts
./scripts/craft.sh test packages/server-core/src/services/cli-runtime-detected-acp-mappings.test.ts packages/server-core/src/services/cli-runtime-catalog.test.ts packages/server-core/src/handlers/rpc/cli-runtime.test.ts
./scripts/craft.sh test packages/server-core/src/services/cli-runtime-grok-smoke.test.ts packages/server-core/src/services/cli-runtime-hermes-smoke.test.ts packages/server-core/src/services/cli-runtime-opencode-smoke.test.ts
./scripts/craft.sh run typecheck:electron
./scripts/craft.sh run --filter @craft-agent/server-core typecheck
git diff --check
```

真实 CLI smoke 只能 opt-in：

- `FLEET_GROK_SMOKE=1`
- `FLEET_HERMES_SMOKE=1`
- `FLEET_OPENCODE_SMOKE=1`

## 5 · 下一步主线建议

当前阶段先做 **R0 · 干净基座重启**，再回到 `docs/01` 的 M0：

1. 确认干净 craft 基座能安装、typecheck、Electron dev。
2. 第一批重做 CLI Runtime/ACP：shared DTO/channel、server-core services、RPC handler、输入框/设置页必要接线和测试。
3. 第二批重做设计基础契约：`DesignAction` 类型/纯函数、selection overlay/helper。
4. 新界面从干净基座实现 `WorkbenchShell`：Conversation / Stage / Inspector / Context / Action Ticker。

R0 完成后再进入 M0：DesignAction/Patch 引擎、BrowserPane docked Stage、Usage/Context Report v1。M1 起（open-design Artifact Studio、ProjectPack、管理/项目 Agent registry）和 M2/M3（字体颜色、外部审查、记忆、Fusion、多账号、Figma/Stitch）见 `docs/01`。

## 6 · 当前必须坚持的口径

- 新 session 默认走 API 模型，不自动启用 CLI Runtime。
- 浏览器标注是设计工作流入口，必须支持框选、多选、批量注释，并作为 Open Design / Figma / Stitch 打通的第一块画布。
- Artifact Studio 必须是 agent-native 可共同编辑面，AI 和人类共用 `DesignAction -> DesignPatch -> SessionEvent`。
- 字体、颜色、动画属于网站/APP/PPT/商品页编辑的基础能力，应进入 DesignAction、资源库和 Artifact Studio 早期切片。
- 上下文效率中心要覆盖 ProjectPack、MarkItDown 转换、rtk/codegraph/Reasonix/Headroom 组合优化、外部 AI 网站审查和透明用量报告。
