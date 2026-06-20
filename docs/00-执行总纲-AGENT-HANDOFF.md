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

## 2 · 当前完成标注（2026-06-20）

以下状态以本机实际 worktree / 测试为准，不按 agent 口头汇报判断。

| 工作 | 分支 / 路径 | 状态 | 已验证 | 合并备注 |
|---|---|---|---|---|
| **T-ENGINE + T-EVENT-ACTOR** | `work/integration-prep` · `/Users/lullwen/.config/superpowers/worktrees/GUI 终端/integration-prep` | **已集成**：`a54bc62b` → `f00a0b8b` | DesignEngine / channel-map / ipc / routing：`23 pass / 0 fail`；shared/server-core/electron typecheck 通过；`git diff --check` 通过 | 主线承重墙：`DesignAction/DesignPatch/ActorRef`、`RPC_CHANNELS.design`、`design_*` 事件、`SessionManager.emitSessionEvent`、tool/text actor、底部 `ActionTickerBar` 已落地。 |
| **T-SYSTOOLS** | `work/integration-prep` | **已集成**：`af96e047` + `602f4255` | server-core services：随整组通过；shared/server-core/electron typecheck 通过；`git diff --check` 通过 | 只读系统工具 / 项目环境探测 + 设置页；已修正登录 shell PATH 测试和无效项目路径诊断；`fleet-project-pack` 已作为 app-bundled context capability 注册进统一 registry。 |
| **T-PROJECTPACK** | `work/integration-prep` | **已集成**：`5b7ea955` + `bc1c0096` + `d2279b2e` | ProjectPack 测试随 services 整组通过；routing/channel-map/ipc 通过；shared/server-core/electron typecheck 通过 | 本地打包、secret scan、token 估算、目录越界保护；已挂入上下文效率设置页；新增 dry-run / plan preview service + RPC，不写 bundle、不外发、不上传。 |
| **T-USAGE** | `work/integration-prep` | **已集成**：`a97eb7dd` + UI `d306262f` | usage 测试随 services 整组通过；electron/shared/ui typecheck 通过；`git diff --check` 通过 | 真实 token / 估算 / 未知成本分离；当前会话 Usage Ledger 已挂入上下文效率设置页。 |
| **T-CLI Runtime** | `work/integration-prep` | **已集成**：`ff39566a` + 发送入口 `072ea88a` | CLI Runtime 测试随 services 整组通过；shared/server-core/electron typecheck 通过；`git diff --check` 通过 | Grok/Hermes/OpenCode detected mapping、custom ACP、health、model/effort、附件硬拒绝、SessionManager CLI 发送分支已接；聊天输入选择器/最终产品化仍待接 Stage/Conversation UI。 |
| **Stage / Inspector / Browser 第一闭环** | `work/integration-prep` | **已集成**：`ff120bb0` 至 `8c91a2f8` + `f7e2fc4f` + `02b82633` | route/panel-stack 测试、IPC/routing 测试、BrowserPane dock 与批量选区目标测试、annotation evidence 测试通过；electron/shared/server-core typecheck 通过；`git diff --check` 通过；Electron 实机确认 BrowserView 位于 Stage 且切换模式后释放 | `stage/{mode}` 正式 route、右侧 Inspector、Usage Ledger、ProjectPack 已接；现有 BrowserPane 三个原生 BrowserView 可停靠 Stage，保持登录态/CDP/Agent 工具链；从会话进入 Stage 后可启动网页元素选择并写入统一 DesignSelection；后端已支持矩形/视口批量元素选择；选区→`AnnotationV1` 证据构造器已放入 shared protocol，后续 UI 直接复用 `sessions:command addAnnotation`。批量标注按钮和 Comment AI 仍待接。 |
| **Context Center 后端总览** | `work/integration-prep` | **已集成**：`8f2d5be8` + `f069a383` + `e77bcb6b` | ContextCenter service 测试、IPC/routing/channel-map 测试通过；shared/server-core/electron typecheck 通过 | 只读聚合 Usage、Project Environment、context 类工具、可选 ProjectPack summary；新增 review readiness（ready / blocked / needs_pack / unknown）和 ProjectPack dry-run preview 接入；不写 bundle、不外发；所有字段标真实/估算/未知与本地/外发口径。 |
| **Agent Registry M0** | `work/integration-prep` | **已集成**：`d5e5f03d` + `433a67a4` | AgentRegistry service 测试、IPC/routing/channel-map 测试通过；shared/server-core/electron typecheck 通过 | 增加 `agents:list/get`、内存 registry 和稳定 `project:<sessionId>` actor；普通 API 与 CLI Runtime 工具事件开始带稳定 `agentId/role/displayName/runtime`；补齐 session 查询和 malformed input guard；不建第二套 session/store/process registry。 |

**当前集成线**：`work/integration-prep` 已把 T-ENGINE、T-SYSTOOLS、T-PROJECTPACK、T-USAGE、T-CLI Runtime、Stage / Inspector 第一刀合到同一基线。后续不要再从旧服务 worktree 二次合并同一批改动；继续在集成线或从它分出新工作。

## 3 · 当前推进方式

- 默认由 Codex 单人主线推进，不再默认拆多个智能体互相审查。
- 不反复向用户确认；边界清楚时直接做一个用户可见产品闭环。
- 每次动手前先看绿灯项目或黑盒参考的相关做法，判断是否有更好的实现方式。
- 黑盒项目只能借鉴行为和命令输出，不能复制源码、测试、类型、样式、配置或结构。
- 不再保留过程性快照和流水记录；需要恢复点时用 Git 分支/提交。
- 每轮完成必须同步文档，否则后续接手会按过期口径继续犯错。

## 4 · 必读顺序

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

## 5 · 当前验证入口

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

## 6 · 下一步主线建议

当前主线已经从 R0 进入 M0 承重墙阶段：

1. **已完成并集成**：`DesignAction / DesignPatch / ActorRef` 契约、DesignEngine 状态机、`design_*` SessionEvent、稳定 Agent actor、底部 Action Ticker、System Tools、ProjectPack、Usage Ledger、ContextCenter 只读总览、CLI Runtime 后端与发送分支、Stage route/panel/Inspector 第一刀。
2. **已完成第一闭环**：BrowserPane 原生 docked Stage + 单元素选择 + 后端批量元素选择；复用 craft BrowserPane/CDP，选区写入原会话的 DesignEngine / SessionEvent。
3. **下一刀**：批量标注、Comment AI 与已有 annotation 体系接线；随后接 Artifact selection source 和 surface applier。
4. **仍未完成**：聊天输入里的 CLI Runtime 选择器最终产品化、浏览器批量注释、Artifact applier、permission 化真实 surface 回滚。

M1 起（open-design Artifact Studio、ProjectPack 接审查中心、Agent process registry）和 M2/M3（字体颜色、外部审查、记忆、Fusion、多账号、Figma/Stitch）见 `docs/01`。

## 7 · 当前必须坚持的口径

- 新 session 默认走 API 模型，不自动启用 CLI Runtime。
- 浏览器标注是设计工作流入口，必须支持框选、多选、批量注释，并作为 Open Design / Figma / Stitch 打通的第一块画布。
- Artifact Studio 必须是 agent-native 可共同编辑面，AI 和人类共用 `DesignAction -> DesignPatch -> SessionEvent`。
- 字体、颜色、动画属于网站/APP/PPT/商品页编辑的基础能力，应进入 DesignAction、资源库和 Artifact Studio 早期切片。
- 上下文效率中心要覆盖 ProjectPack、MarkItDown 转换、rtk/codegraph/Reasonix/Headroom 组合优化、外部 AI 网站审查和透明用量报告。
