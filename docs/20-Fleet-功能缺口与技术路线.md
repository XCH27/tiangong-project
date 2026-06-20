# 20 · Fleet 功能缺口与技术路线

> 当前决策：`app/` 继续作为 craft-agents-oss 的完整二次开发基座。近期修改先加底层能力和文档，不改 craft 现有 UI；界面重排等用户确认后再做。

> **2026-06-20 状态更新**：`app/` 已重置为干净 craft-agents-oss 基座。旧二开实现不再作为当前代码状态；CLI Runtime、DesignAction、WorkbenchShell 等能力按 `docs/19` 从干净基座重新落地。

> **2026-06-19 设计工作流更新**：用户明确希望把 Open Design、Claude Artifacts 类体验、Figma 和 Google Stitch 能力融合进一个软件。新的下一条产品主线是“设计工作流一体化”，第一落点放在原内置浏览器标注页：单选、框选、多选、批量注释、Comment AI；对 AI 生成网页/APP/PPT/商品页进入 Artifact Studio，支持插入图片/视频/形状、字体/文字编辑、颜色/品牌色板、AI 文字特效、动画生成/编辑、动画库、剪切蒙版、内部裁切、位置/尺寸/旋转/圆角/模糊/清晰感参数、自建媒体/组件/UI 效果/骨架模板库，再接 Open Design artifact、Figma native canvas 和 Stitch prompt/code/Figma handoff。此主线必须继承 craft agent-native 哲学：人类 UI 和 AI 工具共用 `DesignAction -> DesignPatch -> SessionEvent`，软件本身可被 AI 编辑。详见 `docs/15-设计工作流一体化方案.md`。

## 1 · 我们要的产品路线

Fleet 不是 Cherry Studio 式“配置中心”，也不是只包一层 CLI 的轻壳。更合适的路线是：

**低摩擦桌面 Agent 控制台 + 本机 CLI Runtime Host + 多 Agent 编排 + Git/浏览器/终端一等工作台。**

用户第一屏应该像 Codex/Claude Desktop/OpenCode 一样直接输入任务；底层则要能把 Codex CLI、Claude Code、Qwen、OpenCode、Grok Build、MCP、浏览器、Git、PTY 终端都纳入同一套 session timeline、权限审批和证据回放。

设计工作流方向下，Fleet 还要成为一个“从 brief 到设计、手动微调、代码、Figma/handoff、动画/视频导出”的一体化工作台。它不重造完整 Figma，也不先重造完整 Kdenlive/Premiere，而是在浏览器标注/设计选择画布上承接 Open Design artifact loop；对 AI 生成 artifact 提供直接可视化编辑器，让用户自己调大小、位置、圆角、蒙版、素材裁切、字体、颜色和动效，再通过官方 Figma MCP/Plugin/REST 和 Stitch prompt/export/import lane 做互通。这个可视化编辑器不能只服务人类鼠标：AI 也要能通过同一套结构化 action 查询、选择、编辑、建库、导出。

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
| AstrBot | IM bot + 插件市场 + Agent Sandbox | 插件生态、会话锁、权限测试、沙箱边界值得学习 | AGPL，红灯，只黑盒参考 |
| DeepSeek-Reasonix | Go 单二进制终端 coding agent | config 分层、permission/sandbox、checkpoint/evidence、memory、MCP/plugin 思路清楚 | MIT，已纳入绿灯表；可按限定范围迁移 ACP/stdio、稳定前缀缓存、planner/executor、权限/沙箱、配置相关源码；接入必须走 craft 权限与本地数据边界 |
| deepcode-cli | DeepSeek 优化终端 Agent | Skill 搜索路径、推理强度、MCP、权限、会话管理可参考 | MIT，已纳入绿灯表；可按限定范围迁移跨客户端 Skill 路径、推理强度、MCP、CLI/session 管理相关源码 |
| cockpit-tools | AI IDE 账号/实例/配额管理工具 | 多平台状态总览、启动路径自动检测、实例/Profile 概念可参考 | 未核准且账号/配额/切号风险高，不复制源码，不做绕用量限制 |
| RTK | CLI 输出压缩代理 | 命令输出瘦身、`rtk gain` 节省统计、跨 CLI hook 安装矩阵 | Apache-2.0，已纳入绿灯表；可按限定范围迁移输出压缩、`rtk gain`/`discover` 统计、hook 矩阵；未经用户确认不得自动安装全局 hook 或改写 shell/agent 配置 |
| context-mode | MCP 上下文节省和会话连续性 | 沙箱工具、FTS5/BM25 检索、`ctx-stats`/statusline 可观测、只拦截大输出工具 | ELv2，高风险，只黑盒参考 |
| CodeGraph | 本地代码知识图谱 MCP | 预索引、自动同步、结构化查询替代 Read/Grep、多客户端 MCP 配置经验 | MIT，已纳入绿灯表；可按限定范围迁移本地代码图谱、预索引、结构化查询、MCP installer 相关源码；必须走 Fleet/craft 权限与本地数据边界 |
| Figma 官方 MCP / Plugin / REST | 原生设计 canvas、设计系统、变量、组件、Dev Mode 互通 | 官方 MCP 已支持读取设计上下文并创建/修改 frames/components/variables/auto layout；Plugin API/REST 补节点编辑、变量、dev resources | 外部服务/API，只走官方权限和用户授权；不复制 Figma UI/品牌资产，不用鼠标自动化绕过 API |
| Google Stitch | prompt/image/wireframe 到 UI/code/Figma handoff | 学 prompt/image-to-UI、快速变体、Figma/代码交接产品模型 | 外部服务，只做 prompt/export/import lane；不抓取私有生成状态 |

## 3 · craft 已有但还不够的部分

| 模块 | craft 已有 | Fleet 缺口 |
|---|---|---|
| 主界面 | AppShell、左侧 session、panel stack、right sidebar、browser pane | 第一屏还偏 workspace/source 产品，不够像 Codex/Claude/OpenCode 的任务入口 |
| 会话 runtime | SessionManager、消息持久化、tool events、权限请求 | 缺多 Agent 同场协作、Agent 身份、并发输出合流 |
| Browser | BrowserView/CDP/browser_tool 已有 | 缺右侧常驻网页点评、截图/DOM/操作证据链 |
| Design workflow | craft 有 browser pane、artifacts、message annotation；Open Design 有 artifact/manual edit/eval/export | 缺统一的设计选择模式、框选/多选、批量注释、DesignAction、Artifact Studio（媒体/形状/蒙版/字体/颜色/动画/参数/资源库）、Figma/Stitch/Open Design handoff |
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
- Hermes 按黑盒 CLI 入口接入：detected mapping 使用 ACP 入口 `hermes acp`；仅调用本机二进制，不复制 `hermes-agent` 源码。
- OpenCode 按黑盒 CLI 入口接入：detected mapping 使用 ACP 入口 `opencode acp`；仅调用本机二进制，不复制 OpenCode 源码。
- Detected ACP mapping 必须维护在 `cli-runtime-detected-acp-mappings.ts` 这一处；send resolver、adapter registry 和 detected runtime health preflight 只能消费这张表，不能各自硬编码 Grok/Hermes/OpenCode/Codex 等入口。
- Hermes、Grok 等 CLI 的版本子命令可能包含更新检查或复杂输出；探测必须把“命令入口存在”和“版本可读”分开。入口解析成功即进入候选 runtime，版本超时/失败只作为 `timeout/version_failed` 健康状态，不得显示成未安装。
- 参考 AionUi custom agent：自定义 Runtime 不是“路径输入框”，而是 `command + args + env + native_skills_dirs + behavior_policy + description`，并有 CLI/ACP 两段健康测试。
- 参考 AionUi backend lifecycle：启动后要有进程注册、health check、SIGTERM→SIGKILL 清理、崩溃诊断、Windows taskkill 等跨平台生命周期处理。
- 后续按 adapter 接入：优先 ACP/SDK/MCP，最后才是 PTY fallback。
- 所有启动、写文件、执行命令都必须经过 craft 现有 permission/session event 体系。
- Skill/MCP/Prompt 属于跨 app 资源层，不应该混进 CLI 检测卡；cc-switch 的 SSOT + symlink/copy + per-app enable 只作为产品模型参考。

入口探测边界：

- 可以返回命令名、resolved path、版本、配置目录是否存在、支持协议猜测、失败原因分类。
- 可以运行固定白名单 CLI 的 `--version`，但必须有超时、无 stdin、固定 cwd、受控环境变量和输出截断。
- 不能启动交互式会话。
- 不能读取 token、密钥、登录态文件内容。
- 不能修改 CLI 配置。
- 不能执行用户传入的任意命令。
- 不能查询账号额度、调用私有 usage 接口、做自动切号或凭证注入。
- `cliRuntime:testCustom` 只能作为健康测试，输入必须是结构化 payload；custom 模式为 `command + args`，detected mapping 模式可传 `runtimeId/resolvedPath/env` 并由 mapping 表生成 ACP preflight args；后端始终 `shell: false`，不得接受一整段 shell 字符串。

CLI Runtime 重做目标：

- 新增 RPC 被标为 `LOCAL_ONLY`。
- 类型、channel map、routing exhaustiveness 通过。
- server-core 有单元测试覆盖 PATH 命中、PATH 未命中、version 超时/失败。
- `typecheck:all` 通过。
- 应用启动自动探测；独立 `CLI` 设置页显示 runtime 健康；聊天输入区显示紧凑选择入口，已安装且支持 mapping/custom 的 CLI 可进入发送链路；未选 CLI 时继续走 API 模型。
- 聊天区 active options 显示当前 CLI Runtime、运行中状态、停止入口、附件受限恢复入口、model/effort 和错误后的“清除 CLI”恢复动作；onboarding 首页不展示 CLI。
- 文档记录当前已经不是单纯探测底座：Grok/Hermes/OpenCode/custom ACP runtime 可执行，其它 detected runtime 未适配时必须返回中文可操作错误，不假执行。

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
| Advanced 字段 | `packages/desktop/src/common/types/platform/acpTypes.ts` | 第一版支持 `native_skills_dirs`、`behavior_policy`、`description`，后续按需扩展 |
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

产品内 Agent 协作模型见 `docs/17-Agent协作与管理Agent模型.md`。

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

### 4.4.1 浏览器标注升级为设计工作流入口

浏览器人类层不再只是“网页点评”。它是下一阶段设计工作流的第一块画布，具体方案见 `docs/15-设计工作流一体化方案.md`：

- 在现有 browser pane 上加设计选择模式，不另起浏览器栈。
- 单选：点一个元素，记录 ref/selector/box/text/role/name/screenshot。
- 框选：拖矩形框，收集框内候选元素，形成 selection set。
- 多选：Shift/Command 点选或框选增删，selection set 可命名、清空、引用。
- 批量注释：一次对多个元素写批注，进入 session timeline。
- Comment AI：发送消息时自动携带 selection set 的截图、DOM/accessibility 摘要和用户批注。
- Artifact Studio：仅对 Fleet/Open Design artifact 或本地 editable preview 开放手动编辑，支持文本、字体、颜色、样式、token、图片、视频、形状、蒙版、裁切、视觉效果、层级、动画和参数。
- 资源库：媒体库、UI 效果库、组件库、网页/APP/PPT/商品页骨架模板库可侧边栏浏览、搜索、拖入。
- 拖动/重排：只输出 reorder、alignment、gap、grid span、尺寸、旋转等语义 patch，不默认写绝对定位。
- Figma：通过官方 MCP/Plugin/REST 做 read/write bridge，不用鼠标乱拖 Figma UI。
- Stitch：做 prompt/export/import lane，不抓取未授权私有状态。

### 4.5 上下文效率、项目打包与外部 AI 审查

目标不是伪造“省 token”，而是让 Fleet 的真实请求更容易命中模型侧 prompt cache、减少无效上下文、把大项目审查交给用户授权的外部 AI 网站，并让用户看见真实用量和节省。完整方案见 `docs/16-上下文效率与外部AI审查方案.md`。

UI 层：

- Claude 风格用量面板只显示当前 session 已有的真实 `inputTokens`、`outputTokens`、`cacheReadTokens`、`cacheCreationTokens` 和费用估算。
- 没有 cache usage 时不显示“缓存命中/缓存写入”，避免把估算值当事实。
- API 模式显示模型连接与用量；本地模型/CLI Runtime 不显示 API 费用。CLI 的模型列表先保持 `Auto`，真实模型等 adapter 握手或首次会话后回填。
- Repomix / Headroom / rtk / external review 这类节省显示必须区分真实、估算和未知；外部网站只是不消耗 Fleet API token，不等于免费。

项目打包层：

- Repomix 适合做 ProjectPack 产品参考：当前 repo、当前 diff、指定目录、指定文件打包成 AI-friendly Markdown/XML/plain text，并显示文件数、token count、排除项和 secret scan。
- MarkItDown 适合做多格式资料进入 LLM 前的 Markdown 转换：PDF、PPT、Word、Excel、HTML、图片 OCR、音频等；转换不可信文件时必须最小权限。
- 打包结果写入 Fleet 数据目录，带 bundle hash、git commit、dirty diff、file manifest、prompt template 和 license/secret 风险。

请求组织层：

- 学 Reasonix 的“缓存稳定会话”思路，把上下文分为稳定前缀、半稳定项目图谱、易变当前回合三层。
- 稳定前缀包含 system/developer 规则、工具 schema、workspace 固定事实、Skill 摘要，必须保持顺序、序列化格式和内容 hash 稳定。
- 半稳定层来自项目索引、CodeGraph/REASONIX 风格结构摘要、长期记忆摘要；只有索引版本或文件 hash 变化时才更新。
- 易变层只放用户最新意图、最近 diff、必要工具结果和短证据。不要把时间戳、随机排序、整段日志、完整文件和未过滤搜索结果塞进稳定前缀。

工具输出层：

- RTK 适合做命令输出压缩和 `gain` 可观测；在 Fleet 里只能作为用户显式启用的本机优化器，不能默认改写 shell、Claude/Codex/Antigravity 等客户端配置。
- CodeGraph 适合做本地代码结构索引，减少 Read/Grep 和长文件注入；这能间接提升缓存命中，因为易变上下文更小、更稳定。
- context-mode 只能黑盒学习“沙箱工具 + FTS5/BM25 + context stats/statusline”的产品边界；因为 ELv2，不复制源码或配置模板。
- Headroom 适合学习本地 compression layer、可逆检索、MCP/proxy 和 output shaping；Apache-2.0 但未写入绿灯前只做黑盒参考或 optional sidecar，不复制源码。

外部 AI 审查层：

- 用户点击“提交外部审查”后，Fleet 先展示将外发的 bundle 摘要、文件列表、token 估算、secret scan 和目标平台。
- 用户确认后，Agent 使用内置浏览器和用户授权登录态，把 bundle/prompt 提交给 ChatGPT Web、Claude Web、Gemini Web、Grok Web、Perplexity、DeepSeek Web 或自定义网站。
- Agent 回收每个平台输出，保存原文、截图、URL、prompt hash、bundle hash，再归一化成 `ReviewReport`。
- 不自动注册账号、不读 cookies/token、不绕过验证码/额度/风控、不默认外发私有代码。

实现边界：

- 不新增第二套 session 或记忆真相。所有统计进入 craft `SessionManager` / `SessionEvent` / `tokenUsage`。
- RTK、CodeGraph、context-mode、REASONIX、Headroom、Repomix、MarkItDown 相关能力如果落地成本机服务，RPC 默认 `LOCAL_ONLY`。
- 任何安装 hook、修改 agent 配置、启动索引守护进程、写全局配置的动作，都必须有明确用户授权和可回滚记录。
- 第三方工具优先做 optional sidecar：没有安装不影响主功能，升级不破坏 Fleet protocol。

## 5 · 分阶段执行

| 阶段 | 目标 | 是否改 UI | 主要文件区 |
|---|---|---|---|
| M0-Docs 文档锁定 | 缺口、路线、参考来源、复制边界清楚 | 否 | `docs/*`、`AGENTS.md` |
| M0-CLI-Detect CLI Runtime 探测 | Electron/craft 能知道本机有哪些 CLI，并有最小可见入口 | 最小入口，不重排 | `packages/shared/protocol`、`packages/server-core`、`apps/electron/src/transport`、`renderer/components/cli-runtime` |
| M0-CLI-Catalog Runtime Catalog | 固化自动发现结果、自定义 runtime、command/args/env/native skill dirs、健康测试 | 独立设置页，不重排 | `server-core/services`、preferences/settings RPC、AionUi custom agent 模式 |
| M0-CLI-Adapter CLI Runtime Adapter | 启动/停止一个 CLI/ACP 会话并记录输出 | 否或仅调试入口 | `server-core/services`、`sessions`、permission、AionUi process lifecycle；进入本阶段前必须先写会话/权限/进程设计，不允许设置页用假 session 启动 |
| M0-CLI-UX CLI Runtime 产品化 | 聊天区可见当前 CLI、运行态、停止、附件受限恢复、model/effort、错误后清除恢复 | 最小接线，不重排第一屏 | `renderer/components/app-shell/*`、`renderer/components/app-shell/input/*`、CLI Runtime helper/test、验收清单 |
| P1-DWF 浏览器设计选择 | 原浏览器标注页支持单选、框选、多选、批量注释、Comment AI 证据包 | 是，但只在浏览器人类层增加模式/按钮，不重排主界面 | `server-core/src/sessions/RemoteBrowserPaneManager.ts`、`handlers/browser-pane-manager-interface.ts`、`packages/shared/src/agent/browser-tools.ts`、`renderer/atoms/browser-pane.ts`、`packages/ui/src/components/annotations/*`、`shared/protocol/design-*` |
| P1-DesignAction | 人类 UI 和 AI 工具共用选择、注释、编辑、建库、导出动作 | 是，先做动作契约和 service，不先堆 UI-only state | `shared/protocol/design-*`、`server-core/services/design-*`、session tools / browser capability |
| P1-Typography/Color | 本机/项目/网络字体、文字编辑、字体参数、色板/渐变/吸管/品牌 token | 是，网站编辑立即可用 | font discovery/import service、palette/token service、`FontAsset`、`TypographyToken`、`ColorToken` |
| P1-Artifact Studio | 本地 artifact 支持图片/视频/形状插入、蒙版/裁切、x/y/w/h、圆角、透明度、模糊、旋转、层级、文本/字体/颜色/样式/token 和语义重排 | 是，复用浏览器设计模式和 DesignAction | Open Design manual edit/live artifact 迁移并扩展到 `server-core/services/design-*` 与 browser pane |
| P1-Design Library | 媒体库、字体库、色板库、动画库、UI 效果库、组件库、网页/APP/PPT/商品页骨架模板库可侧边栏浏览/拖入/保存当前选区 | 是，侧边资源浏览器 | `DesignLibrary` service + renderer library panel + artifact manifest |
| P1-Motion/Animation | 动画 preset、关键帧、easing、duration、delay、hover/scroll/loop 触发，网页动效可直接用 | 是，但先做网页/HTML artifact，不做完整视频剪辑器 | `AnimationTimeline`、`Keyframe`、`MotionPreset`、CSS/WAAPI/SVG/Lottie export |
| P1-Usage/Context Report | 当前会话上下文占比、token/cost/cache/tool call/package/compression/external review 节省可视化 | 是，右侧或 popover 面板 | `tokenUsage`、`server-core/services/usage-*`、renderer context usage panel |
| P1-ProjectPack/External Review | 当前项目/当前 diff 打包、MarkItDown 转换、secret scan、提交外部 AI 网站审查、归一化报告 | 是，按钮 + 审查报告面板 | `server-core/services/project-pack-*`、browser pane automation、Fleet 数据目录 |
| P1-Figma/Stitch Bridge | Figma read context / later write canvas；Stitch prompt/export/import | 最小入口 | Figma bridge、Stitch bridge、DesignProject manifest |
| P1-A Agent Registry | Agent 名册、能力、运行时、启用范围 | 少量入口，先不重排 | `shared/protocol`、`server-core`、AionUi 迁移模块 |
| P1-B Skill Registry | 全局 Skill 管理和注入 | 先复用 craft panel | `skills`、`sources`、AionUi Skills Hub |
| P1-C 三面板底层 | Git/browser review/PTY 能力完整 | 先接现有 panel | `server-core/services`、browser pane、right sidebar |
| P2 第一屏重排 | Codex/Claude/OpenCode 式首屏 | 是，用户确认后做 | `renderer/components/app-shell/*` |

阶段顺序说明：

- 当前 CLI Runtime 主线回到干净基座重做：按 `docs/23-CLI-Runtime-重做规格.md` 实现，按 `docs/24-CLI-Runtime-验收清单.md` 验收，再进入 P1 附件或下一条产品主线。
- 去 Craft 化和第一屏重排仍是产品目标，但放到用户确认后的 P2，不和当前“不改 UI”的约束冲突。
- P0 的结果必须能被 P2 复用；不能做成隐藏在 Settings 里的配置工具。

## 6 · 核心能力 DoD

| 能力 | 用户能看到什么 | 系统必须记录什么 | 失败处理 |
|---|---|---|---|
| CLI Runtime 探测/发送 | 应用自动发现；独立 CLI 设置页看到本机已安装 Codex/Claude/Qwen/OpenCode/Cursor/Antigravity(agy)/Hermes/OpenClaw/Grok Build，以及 AionUi catalog 中的 Aion CLI、Goose、CodeBuddy、Kimi、Factory Droid、Augment Code、GitHub Copilot、Qoder、Mistral Vibe、Nanobot、Snow；聊天区可选择 runtime，未选 CLI 时继续用原 API 模型；Grok/Hermes/OpenCode/custom 可真实发送 | path、短版本号、capability、失败原因、检测时间、候选命令、session draft 的 runtime/model/effort；不保存 env/token | 未安装、坏软链接、版本超时、版本异常都分类返回；入口存在但版本失败仍保留为可用 runtime；unsupported detected 返回中文可操作错误；附件第一版硬拒绝 |
| Runtime Catalog | 可编辑 custom runtime 的 command、args、env、native skill dirs、启用状态、健康测试；managed 不可删/禁/改启动参数；detected 不可改 command/args/env，但可测试/禁用/删除；detected Grok/Hermes/OpenCode 点“测试”时会携带 runtimeId/resolvedPath 走 mapped ACP preflight，测试结果刷新后仍保留；聊天紧凑选择器会对最近已知失败的 catalog runtime 显示中文预警并禁止选择 | runtimeId、source、capabilities、lastHealth、lastCheckedAt、configDirs、workspace scope | CLI 能找到但 ACP 失败时区分 fail_cli/fail_acp；坏配置不影响其他 runtime；错误展示包含阶段、原因和 stdout/stderr tail |
| Agent 编排 | Leader/Worker/Reviewer、多 Agent 输出和权限按 Agent 区分 | `agentId`、runtime、role、任务范围、事件流 | 可停止单 Agent，可汇总失败原因 |
| Skill 注入 | 可选择全局/项目/会话 Skill，并可作为 Agent native skills dirs 注入 | 来源、版本、启用范围、注入方式、token 成本、materialized path | 注入失败降级为摘要或禁用；跨 app 同步失败给诊断 |
| MCP 健康 | 默认发现，异常时给修复入口 | server、tools、权限、连通性、错误日志 | 失败不阻塞主会话，给诊断和重试 |
| Git panel | status/diff/worktree/commit/PR/回滚入口 | Agent 归属、diff、命令、结果、测试 | 脏工作区保护、冲突提示、回滚方案 |
| Browser review / design selection | URL、截图、DOM/console/network、点评建议、前后对比；用户可点选、框选、多选元素并批量注释 | 操作步骤、selection set、截图、DOM/accessibility 摘要、boxes、viewport/dpr/scroll、日志 | 页面加载失败、权限失败、登录态风险提示；普通网页不能直接编辑源码时降级为注释/Agent 指令 |
| Artifact Studio edit | 对 Fleet/Open Design artifact 做媒体、形状、蒙版、transform、effect、文本、样式、token、语义布局 patch | asset manifest、mask、mediaTransform、effect、patch、selectionId、来源、权限、回滚点、导出记录 | 无 editable metadata 时禁止编辑；普通网页降级为注释；patch 失败可回滚 |
| Agent-native edit action | 人类 UI 或 AI 工具提交同一类编辑动作 | actor、agentId/runtime、surface、operation、payload、permission、rollback、SessionEvent | 禁止 renderer-only state、临时 DOM mutation、不可回放画布私有状态 |
| Typography/Color edit | 字体、文字、颜色、品牌 token、AI 文字特效 | FontAsset、TypographyToken、ColorToken、source/license、contrast result、rollback | 本机字体默认只引用；未知授权字体/色板不得进入公开模板 |
| Motion/Animation edit | 动画 preset、keyframes、timeline、trigger、video scene | AnimationTimeline、Keyframe、MotionPreset、source/license、export record | 普通网页降级为注释；视频导出先不承诺完整 NLE |
| Design Library | 用户保存/复用媒体、字体、色板、动画、组件、效果、骨架模板 | library item、来源、版本、预览图、适用 surface、许可证/可复用范围 | 未知来源/许可证素材不得默认公开分发；缺失文件显示可修复错误 |
| Agentic terminal | 命令块、历史、搜索、用户接管 | cwd、env、stdout/stderr、exit code、耗时 | 可中断、可重跑、可标记危险命令 |

## 7 · 近期怎么动手

当前不要再从“新增 CLI 探测 RPC”开始。那一段已经完成。接手时按这个顺序推进：

1. 继续保留 craft 当前界面，不做第一屏重排。
2. 按 `docs/24-CLI-Runtime-验收清单.md` 启动 Electron，真实走一遍 CLI Runtime 聊天使用、错误恢复、附件硬拒绝和设置页边界。
3. 若验收发现问题，按失败所在层修：设置页、popover、resolver、adapter、timeline，不要同时改四层。
4. 验收通过后进入 P1 附件：只考虑 capability-gated `inline_text`，仍不传本地路径、图片、PDF、Office 原文件。
5. 后续接 Agent 编排、Skill 注入、PTY 终端、浏览器人类层时，继续复用同一条 `LOCAL_ONLY` + permission + session timeline 链路。
6. 设计工作流先做浏览器标注页的 DWF-1/DWF-2/DWF-3：单选、框选、多选、批量注释、Comment AI 证据包。随后先补 DesignAction 契约，再做 Typography/Color v1 和 Artifact Studio v1：字体/文字/颜色、图片/视频/形状、剪切蒙版、内部裁切、transform/effect 参数和资源库；再接 Motion/Animation v1。不要先陷入完整 Figma 复刻、完整视频剪辑器，也不要做只有人类 UI 能触发的编辑器。
