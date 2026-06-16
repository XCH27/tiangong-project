# Fleet 功能缺口与技术路线

> 当前决策：`app/` 继续作为 craft-agents-oss 的完整二次开发基座。近期修改先加底层能力和文档，不改 craft 现有 UI；界面重排等用户确认后再做。

> **2026-06-16 修订（以 `docs/04-产品决策记录.md` 为准）**：①**首攻恢复为终端 / CLI Runtime Host（D3）**——本文 §4.1、§5、§7 的 **P0-B CLI Runtime 探测** 是当前第一个落地项；内置浏览器 + 网页标注顺延到下一阶段；②多模型融合做成**设置项、默认关（D5，见 `03-Fusion多模型融合方案.md`）**；③新增**分级记忆（D2，见 `05-记忆系统方案.md`）**与**合法多账号切换（D4）**；④建议尽早纳入**评测 + 可观测**，并明确**分叉策略（建议软分叉）**。本文其余内容（参考项目判断、缺口表、各能力 DoD、来源边界）仍有效。

## 1 · 我们要的产品路线

Fleet 不是 Cherry Studio 式“配置中心”，也不是只包一层 CLI 的轻壳。更合适的路线是：

**低摩擦桌面 Agent 控制台 + 本机 CLI Runtime Host + 多 Agent 编排 + Git/浏览器/终端一等工作台。**

用户第一屏应该像 Codex/Claude Desktop/OpenCode 一样直接输入任务；底层则要能把 Codex CLI、Claude Code、Qwen、OpenCode、Grok Build、MCP、浏览器、Git、PTY 终端都纳入同一套 session timeline、权限审批和证据回放。

## 2 · 参考项目路线判断

| 项目 | 它走的路线 | 优点 | 对 Fleet 的用法 |
|---|---|---|---|
| craft-agents-oss | Electron + React 工作区，session/source/MCP/browser/skills/automations 已成体系 | 工程底座最完整，许可证绿灯，已有右侧文件、browser pane、权限、远程 server | **主基座，直接改 `app/`** |
| AionUi | 把 CLI Agent 变成现代聊天/团队/ACP/WebUI 体验 | 多 Agent、ACP、Skill 注入、团队 E2E、custom agent、进程生命周期、健康检查最接近目标 | **第二绿灯来源；终端/CLI Runtime/ACP/Team/Skill 优先学它，可按模块迁移** |
| cc-switch | CLI 生态配置与 Skill/MCP/Provider 管理工具 | Claude/Codex/OpenCode/Hermes 等跨应用资源管理经验集中，尤其 Skill SSOT + symlink/copy + per-app enable | 只黑盒参考产品模型；若要复制源码，需先把许可证核准写进规则 |
| OpenCode | 低摩擦开发 Agent 核心 + TUI/桌面/SDK | Git、PTY、session、tool event、skill 的开发者体验很强 | 黑盒参考信息架构和事件模型，不复制源码 |
| Golutra | 终端中心、项目成员、聊天和终端编排 | PTY、终端会话、命令分发、成员化交互思路清楚 | BSL 1.1，高风险黑盒参考，不复制源码 |
| Warp | 终端即工作台，命令块和 Agent 操作终端 | 命令可观察、可接管、适合长任务 | 黑盒参考终端交互，不复制闭源实现 |
| Kun | 轻桌面壳 + runtime | 视觉轻、启动路径短 | 许可证非商业，只看产品感觉 |
| Cherry Studio | Provider/知识库/迁移/配置能力很全 | 成熟但配置感重 | AGPL 风险，只黑盒学习能力清单，不走它的产品路线 |
| Hermes Agent | Toolsets / browser tools / agent 能力组织 | 工具集思想可参考 | MIT 但未纳入绿灯，先黑盒参考 toolset 组织 |

## 3 · craft 已有但还不够的部分

| 模块 | craft 已有 | Fleet 缺口 |
|---|---|---|
| 主界面 | AppShell、左侧 session、panel stack、right sidebar、browser pane | 第一屏还偏 workspace/source 产品，不够像 Codex/Claude/OpenCode 的任务入口 |
| 会话 runtime | SessionManager、消息持久化、tool events、权限请求 | 缺多 Agent 同场协作、Agent 身份、并发输出合流 |
| Browser | BrowserView/CDP/browser_tool 已有 | 缺右侧常驻网页点评、截图/DOM/操作证据链 |
| Git | branch/diff/cleanup/git-bash 辅助 | 缺一等 Git panel：status、worktree、diff、commit、PR、回滚保护 |
| Skill | workspace skill、slash command、Skill 列表 | 缺全局 Skill SSOT、外部 Skill 导入、启用范围、运行注入策略 |
| MCP/source | source 系统强 | 对新手偏配置化，缺自动发现和健康诊断 |
| 终端 | shell/background task | 缺 PTY 面板、命令块、历史、搜索、用户接管 |
| 外部 CLI | 有 Claude/Pi/Copilot 等连接，但不是统一托管本机 CLI | 缺 Codex/Claude/Qwen/OpenCode/Grok 等 CLI detection、launch、session、权限、日志 |

## 4 · 推荐技术路线

### 4.0 架构硬约束

- **单一 session/timeline。** AionUi 不能作为第二套 conversation/session 系统迁进来；ACP、Team、Skill 注入都必须适配进 craft `SessionManager`、`SessionEvent`、session persistence、permission 和现有 renderer event flow。
- **RPC locality 先行。** 新增 RPC 必须先归类为 `LOCAL_ONLY` 或 `REMOTE_ELIGIBLE`。CLI Runtime detection/launch、PTY、本机文件选择、BrowserView 等本机 OS 能力默认 `LOCAL_ONLY`。
- **远端 workspace 不默认用本机 CLI 写文件。** 如果当前 workspace 在远端 server，本机 CLI 只能做明确允许的本机探测；写远端路径、运行远端命令必须另建 remote CLI Host 或显式禁用。
- **多 Agent 必须带身份。** `SessionEvent`、permission request、tool event、日志和持久化需要能携带 `agentId/runtimeId/role/displayName`，否则并发输出无法审计。
- **权限和证据链统一。** CLI 启动、命令执行、文件写入、Git mutate、浏览器登录态操作、桌面软件控制都必须走 craft permission，并进入 session timeline。
- **非配置中心原则。** 自动发现优先，默认可用优先，失败时再解释配置；设置页只做修复和高级控制，不把 Provider/MCP/Skill/Git/CLI 全塞进 settings。

### 4.1 本机 CLI Runtime Host

这是最先做的底层能力，因为它直接回答“如何连接电脑上的 CLI 获得更高权限、使用各家的工程能力”。

修正后的实现方式（优先学习 AionUi，cc-switch 只补资源管理视角）：

- 在 `app/packages/server-core` 新增 local-only Runtime Catalog。探测只是填充 catalog，不是最终产品形态。
- Runtime 记录 `runtimeId`、displayName、command、args、env、resolvedPath、version、capabilities、configDirs、health、source、native skill dirs。
- 固定探测 `claude`、`codex`、`qwen`、`opencode`、`cursor agent`、Antigravity 的 `agy`、`hermes`、`openclaw`、Grok Build 的 `grok`；并按 AionUi catalog 补齐 Aion CLI、Goose、CodeBuddy、Kimi、Factory Droid、Augment Code、GitHub Copilot、Qoder、Mistral Vibe、Nanobot、Snow；Gemini CLI 已从内置探测删除；每个 runtime 支持多个候选命令和专属 `versionArgs`，不能假设都是 `command --version`。
- Grok Build 按 xAI 官方规则接入：安装 `curl -fsSL https://x.ai/cli/install.sh | bash`，验证 `grok --version`，交互入口 `grok`，headless 入口 `grok -p ...`，ACP 入口 `grok agent stdio`，用户安装目录优先补扫 `~/.local/bin` 与 `~/.grok/bin`。
- Hermes、Grok 等 CLI 的版本子命令可能包含更新检查或复杂输出；P0-B 的判定必须把“命令入口存在”和“版本可读”分开。入口解析成功即进入可用 runtime，版本超时/失败只作为 `timeout/version_failed` 健康状态，不得显示成未安装。
- 参考 AionUi custom agent：自定义 Runtime 不是“路径输入框”，而是 `command + args + env + native_skills_dirs + behavior_policy + description`，并有 CLI/ACP 两段健康测试。
- 参考 AionUi backend lifecycle：启动后要有进程注册、health check、SIGTERM→SIGKILL 清理、崩溃诊断、Windows taskkill 等跨平台生命周期处理。
- 后续按 adapter 接入：优先 ACP/SDK/MCP，最后才是 PTY fallback。
- 所有启动、写文件、执行命令都必须经过 craft 现有 permission/session event 体系。
- Skill/MCP/Prompt 属于跨 app 资源层，不应该混进 CLI 检测卡；cc-switch 的 SSOT + symlink/copy + per-app enable 只作为产品模型参考。

P0-B 探测边界：

- 可以返回命令名、resolved path、版本、配置目录是否存在、支持协议猜测、失败原因分类。
- 可以运行固定白名单 CLI 的 `--version`，但必须有超时、无 stdin、固定 cwd、受控环境变量和输出截断。
- 不能启动交互式会话。
- 不能读取 token、密钥、登录态文件内容。
- 不能修改 CLI 配置。
- 不能执行用户传入的任意命令。

P0-B 验收：

- 新增 RPC 被标为 `LOCAL_ONLY`。
- 类型、channel map、routing exhaustiveness 通过。
- server-core 有单元测试覆盖 PATH 命中、PATH 未命中、version 超时/失败。
- `typecheck:all` 通过。
- 应用启动自动探测；独立 `CLI` 设置页显示 runtime 健康；聊天输入区只显示紧凑选择入口，已安装 CLI 可被选中；选中 CLI 后右侧模型菜单先只显示 `Auto`，真实模型列表等 CLI/ACP adapter 握手或首次会话后回填；onboarding 首页不展示 CLI。
- 文档记录它只是 Runtime Catalog 的低摩擦自动发现底座，不代表终端会话、Skill 同步或 Provider 切换已经完成。

参考来源：

- AionUi：ACP backend、agent readiness、custom agent editor、`native_skills_dirs`、`testCustomAgent`、进程生命周期和 team backend 测试。
- cc-switch：CLI 生态配置、Provider/MCP/Prompt/Skill 统一管理、Skill SSOT + symlink/copy + per-app enable 模型，当前只黑盒参考。
- OpenCode/Golutra/Warp：PTY、命令块、终端事件体验，当前只黑盒参考。
- 自研判断：在 craft 的 `server-core` 里做统一 Host，比把每个 CLI 直接塞进 UI 或 settings 更稳。

AionUi 需要重点学习的具体落点：

| 能力 | AionUi 路径 | Fleet 吸收方式 |
|---|---|---|
| 支持的 CLI/ACP 范围 | `readme.md`：Claude Code、Codex、Qwen Code、Goose AI、OpenClaw、Augment Code、CodeBuddy、Kimi CLI、OpenCode、Factory Droid、GitHub Copilot、Qoder CLI、Mistral Vibe、Nanobot、Aion CLI、Snow CLI、Hermes Agent、Cursor Agent；声明 `mcpCapabilities.stdio` 的 ACP backend 可自动支持 | Fleet Runtime Catalog 不只写死少数 CLI；但当前内置探测删除 Gemini CLI；每个 runtime 记录 backend/protocol/capabilities，并为未知 ACP backend 留扩展入口 |
| 自定义 Agent 形态 | `packages/desktop/src/renderer/pages/settings/AgentSettings/InlineAgentEditor.tsx` | 自定义 runtime 用 `command + args + env + advanced`，不是单路径输入框 |
| Advanced 字段 | `packages/desktop/src/common/types/platform/acpTypes.ts` | P0-C 支持 `native_skills_dirs`、`behavior_policy`、`description`，后续按需扩展 |
| 健康测试 | `ipcBridge.ts` 的 `/api/agents/custom/try-connect`，返回 `success / fail_cli / fail_acp` | Fleet 的 runtime health 必须区分“命令不可执行”和“ACP 初始化失败” |
| 管理 API | `ipcBridge.ts` 的 `getAvailableAgents / getManagedAgents / refreshCustomAgents / createCustomAgent / updateCustomAgent / setAgentEnabled` | Fleet 不直接把探测结果丢给 UI；要有可刷新、可禁用、可编辑的 Runtime Catalog |
| 进程注册清理 | `packages/web-host/src/agent-process-registry.ts` | 启动外部 runtime 后登记 pid/process_group_id/conversation/runtime，退出时 SIGTERM -> SIGKILL，Windows 用 taskkill |
| 后端生命周期 | `packages/web-host/src/backend-launcher.ts` | 学 health polling、启动阶段错误分类、stdout/stderr tail、早退/超时/崩溃诊断 |
| Skill 注入 | `ipcBridge.ts` 的 `listAvailableSkills / materializeSkillsForAgent / detectExternal / importSkillWithSymlink` | Skill Registry 后续要支持 materialize 到 agent native skill dirs，不混进 CLI 探测卡 |

### 4.2 Agent 编排层

实现方式：

- 保留 craft `SessionManager` 作为 session timeline 主干。
- 新增 Agent Registry：每个 Agent 有 runtime、capabilities、workspace scope、permission profile。
- AionUi team/@mention/ACP conversation 迁移为 Fleet 的团队协作能力。
- 多 Agent 输出统一变成 craft 的 `SessionEvent`，避免另建一套消息系统。
- Agent 编排进入实现前，先定义 `agentId/runtimeId/role/displayName` 在 `SessionEvent`、permission、tool event、持久化中的字段映射。

参考来源：

- 直接迁移：AionUi team、agent、ACP、@ 提及相关模块。
- 保留：craft session persistence、permission request、tool event。
- 自研：Agent 输出合流到 craft timeline 的映射层。

执行协议见 `docs/Fleet-多智能体审查与并行执行协议.md`。

### 4.3 Skill 全局管理

实现方式：

- craft workspace skill 继续作为运行基础。
- 新增全局 Skill registry，记录来源、版本、启用范围、导入方式、是否自动注入。
- 优先学习 AionUi：Skills Hub、外部路径、内置自动 skill、extension skill、`materializeSkillsForAgent`、`native_skills_dirs`。
- 支持外部路径导入、内置 skill、项目 skill、会话临时 skill。
- 注入时区分“索引摘要注入”“选中 skill 全量注入”“Agent native skills dirs”，避免上下文爆炸。
- cc-switch 的 SSOT、symlink/copy、备份恢复、per-app enable 作为跨应用同步模型参考，不能直接复制未核准源码。

参考来源：

- AionUi：Skills Hub、外部路径、自动内置 skill、extension skill、会话注入、`native_skills_dirs`。
- cc-switch：统一管理 Claude/Codex/OpenCode/Hermes 等 skill 的产品路径、SSOT、per-app enable、symlink/copy 同步、备份恢复，当前只黑盒参考。
- craft：现有 `SkillsListPanel`、`skill-validate`、workspace skills。

### 4.4 Git / 浏览器 / 终端三面板

实现方式：

- 不先改 UI 外观，只先补齐数据和 RPC 能力。
- Git：新增 status/worktree/diff/commit 的 server-core 服务，接 craft permission。
- 浏览器：复用 craft browser pane/CDP，增加 webpage review 任务模型。
- 终端：新增 PTY session service，把命令输入、输出、exit code、cwd、环境变更写入 timeline。

参考来源：

- craft：browser pane、right sidebar、session files、permission。
- OpenCode：Git/PTY/tool event 形态，黑盒参考。
- Golutra/Warp：终端工作台和命令块体验，黑盒参考。
- 自研：三面板不做独立应用，而是围绕当前 session 和 workspace 出现。

## 5 · 分阶段执行

| 阶段 | 目标 | 是否改 UI | 主要文件区 |
|---|---|---|---|
| P0-A 文档锁定 | 缺口、路线、参考来源、复制边界清楚 | 否 | `docs/*`、`AGENTS.md` |
| P0-B CLI Runtime 探测 | Electron/craft 能知道本机有哪些 CLI，并有最小可见入口 | 最小入口，不重排 | `packages/shared/protocol`、`packages/server-core`、`apps/electron/src/transport`、`renderer/components/cli-runtime` |
| P0-C Runtime Catalog | 固化自动发现结果、自定义 runtime、command/args/env/native skill dirs、健康测试 | 独立设置页，不重排 | `server-core/services`、preferences/settings RPC、AionUi custom agent 模式 |
| P0-D CLI Runtime Adapter | 启动/停止一个 CLI/ACP 会话并记录输出 | 否或仅调试入口 | `server-core/services`、`sessions`、permission、AionUi process lifecycle |
| P1-A Agent Registry | Agent 名册、能力、运行时、启用范围 | 少量入口，先不重排 | `shared/protocol`、`server-core`、AionUi 迁移模块 |
| P1-B Skill Registry | 全局 Skill 管理和注入 | 先复用 craft panel | `skills`、`sources`、AionUi Skills Hub |
| P1-C 三面板底层 | Git/browser review/PTY 能力完整 | 先接现有 panel | `server-core/services`、browser pane、right sidebar |
| P2 第一屏重排 | Codex/Claude/OpenCode 式首屏 | 是，用户确认后做 | `renderer/components/app-shell/*` |

阶段顺序说明：

- 当前阶段是 P0-A/P0-B/P0-C：先把底层能力和边界打稳；UI 只加最小入口，不做整体重排。
- 去 Craft 化和第一屏重排仍是产品目标，但放到用户确认后的 P2，不和当前“不改 UI”的约束冲突。
- P0 的结果必须能被 P2 复用；不能做成隐藏在 Settings 里的配置工具。

## 6 · 核心能力 DoD

| 能力 | 用户能看到什么 | 系统必须记录什么 | 失败处理 |
|---|---|---|---|
| CLI Runtime 探测 | 应用自动发现；独立 CLI 设置页看到本机已安装 Codex/Claude/Qwen/OpenCode/Cursor/Antigravity(agy)/Hermes/OpenClaw/Grok Build，以及 AionUi catalog 中的 Aion CLI、Goose、CodeBuddy、Kimi、Factory Droid、Augment Code、GitHub Copilot、Qoder、Mistral Vibe、Nanobot、Snow；聊天区只显示紧凑选择入口，未选 CLI 时继续用原 API 模型，选中 CLI 后右侧模型菜单先统一为 `Auto` | path、短版本号、capability、失败原因、检测时间、候选命令；自定义 CLI 下一阶段写入 preferences；聊天选择状态当前仅为 UI/runtime intent，不代表消息已路由到 CLI adapter；真实模型列表不能前端硬编码，等 CLI/ACP adapter 握手或首次会话后回填 | 未安装、坏软链接、版本超时、版本异常都分类返回；入口存在但版本失败仍保留为可用 runtime；没有检测到时提示安装/手动路径 |
| Runtime Catalog | 可编辑每个 CLI/Agent 的 command、args、env、native skill dirs、启用状态、健康测试 | runtimeId、source、capabilities、health、lastCheckedAt、configDirs、workspace scope | CLI 能找到但 ACP 失败时区分 fail_cli/fail_acp；坏配置不影响其他 runtime |
| Agent 编排 | Leader/Worker/Reviewer、多 Agent 输出和权限按 Agent 区分 | `agentId`、runtime、role、任务范围、事件流 | 可停止单 Agent，可汇总失败原因 |
| Skill 注入 | 可选择全局/项目/会话 Skill，并可作为 Agent native skills dirs 注入 | 来源、版本、启用范围、注入方式、token 成本、materialized path | 注入失败降级为摘要或禁用；跨 app 同步失败给诊断 |
| MCP 健康 | 默认发现，异常时给修复入口 | server、tools、权限、连通性、错误日志 | 失败不阻塞主会话，给诊断和重试 |
| Git panel | status/diff/worktree/commit/PR/回滚入口 | Agent 归属、diff、命令、结果、测试 | 脏工作区保护、冲突提示、回滚方案 |
| Browser review | URL、截图、DOM/console/network、点评建议、前后对比 | 操作步骤、截图、DOM 摘要、日志 | 页面加载失败、权限失败、登录态风险提示 |
| Agentic terminal | 命令块、历史、搜索、用户接管 | cwd、env、stdout/stderr、exit code、耗时 | 可中断、可重跑、可标记危险命令 |

## 7 · 近期我会怎么动手

在用户要求“先加入口，但不重排 craft UI”的前提下，最合理的第一步是：

1. 继续保留 craft 当前界面。
2. 新增 CLI Runtime Host 的探测 RPC。
3. 应用启动自动探测；独立 CLI 设置页显示 runtime 健康；聊天输入区只保留紧凑选择入口；未选 CLI 时保持原 API 模型选择，选中 CLI 后右侧模型菜单先统一为 `Auto`；onboarding 不展示 CLI。
4. 更新文档标注这是 Fleet Runtime Catalog 的发现底座，尚未完成 Runtime Catalog 固化、Skill 同步、CLI 消息路由或 P0-D 会话接管。
5. 跑 `typecheck:all` 和相关测试。

这一步先解决“用户看得到、点得到、知道缺什么”的问题；后面接 Codex/Claude/Qwen/Grok 等 CLI、Agent 编排、Skill 注入、PTY 终端时必须继续复用同一条 local-only + permission + session timeline 链路。
