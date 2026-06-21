# AGENTS.md

本项目当前进入“干净基座二开”阶段：`app/` 已重置为干净 craft-agents-oss 基座。旧二开代码不再作为实现来源；后续只按 `docs/19-重启二开与可复用资产清单.md` 保留少量可重做的能力边界。

> **路线主干（先读）**：`docs/01-产品主干与落地序列.md` 是路线单一真相。它把下面 D1–D12 收敛成一条主干（CLI 接入 → 动作引擎 → 浏览器/Artifact 画布 → 管理 Agent + 项目 Agent + 分层记忆 + 审查中心）并排序成 M0–M3。**决策"做什么"看本文与 `docs/04`，"按什么顺序做、什么不做"看 `docs/01`。** 加任何功能前先回答 `docs/01` 第 3 节的"挂槽三问"，避免堆按钮。

## 当前产品决策（用户已拍板，单一真相见 `docs/04-产品决策记录.md`）

- **D1 手动修改**：agent-native 为主 + 关键项加"手动编辑"逃生舱；手动编辑写进 craft 现有 `config`/`preferences`/settings，**不另起第二套真相**。
- **D2 记忆**：全本地**分级记忆**，可查可删（见 `docs/05-记忆系统方案.md`）。
- **D3 首攻**：第一个落地功能 = **终端 / 本机 CLI Runtime Host**。当前 `app/` 是干净 craft-agents-oss 基座，CLI Runtime 需按 `docs/23-CLI-Runtime-重做规格.md` 重新落地；旧二开代码不再作为当前实现。浏览器人类层升级为 D6 设计工作流入口，见 `docs/06-浏览器与网页标注方案.md` 与 `docs/15-设计工作流一体化方案.md`。
- **D4 账号**：仅做**合法多账号 Profile 干净切换、不丢记录**；**不做**绕用量限制/规避检测的自动轮换。
- **D5 融合**：多模型融合做成**设置项**，**默认关**（见 `docs/03-Fusion多模型融合方案.md`）。
- **D6 设计工作流一体化**：把 Open Design、Claude Artifacts 类体验、Figma 和 Google Stitch 式 prompt/image-to-UI/code/Figma handoff 融进 Fleet 一个软件。第一落点是原 **内置浏览器 + 网页标注** 页面：单选、框选、多选、批量注释、Comment AI；对 AI 生成网页/APP/PPT/商品页进入 Artifact Studio，支持插入图片/视频/形状、剪切蒙版、内部裁切、位置/尺寸/旋转/圆角/模糊/清晰感参数、自建媒体/组件/UI 效果/骨架模板库，再接 Figma/Stitch bridge（见 `docs/15-设计工作流一体化方案.md`、`docs/06-浏览器与网页标注方案.md`）。
- **D7 Agent-native 可共同编辑**：继承 craft-agents-oss 的核心哲学：这个软件本身也要能被 AI 编辑，且人类和 AI 使用同一个工作台、同一套 session、权限、工具、补丁和回放链路。任何新增手动编辑能力都必须同时设计 AI 可调用的结构化动作；不要做只有鼠标 UI 能触发、AI 无法复现的暗状态。
- **D8 字体/颜色/动画创意编辑**：Artifact Studio 还要覆盖字体库、文字编辑、颜色/品牌色板、AI 文字特效、生成动画、动画模板库、时间线/关键帧编辑和网页动画复用。字体可来自本机、项目文件、合法网络字体服务或用户授权字体包；动画可参考 SVGator 模板形态、HyperFrames 的 HTML-native 视频/动画、Kdenlive 的时间线剪辑概念、Remotion 的程序化视频思路，但源码复制边界必须按许可证单独核准。
- **D9 上下文效率与外部 AI 审查**：把 Repomix 式项目打包、MarkItDown 式多格式转 Markdown、Headroom/rtk/Reasonix/codegraph/context-mode 式上下文节省、Cursor/OpenCode/Claude Context Usage 式用量可视化、OpenHands 式自动化控制台和“内置浏览器提交外部 AI 网站审查”打通。外部网站只走用户授权登录和正常 Web/API，不绕过用量/风控；真实 token、估算节省和外部平台成本必须分开标注（见 `docs/16-上下文效率与外部AI审查方案.md`）。
- **D10 浏览器自动化增强**：保留 craft 内置 BrowserPane/CDP/`browser_tool` 作为主浏览器栈，不用外部浏览器替换核心。browser-harness 只吸收“薄 CDP、自修复 helper、失败诊断”思路；OpenClaw 只吸收“隔离 managed profile + loopback gateway + profile 路由”思路；CloakBrowser/反检测/stealth 浏览器只能高风险黑盒参考，不进默认产品，不用于绕过 bot detection、验证码、平台风控或用量限制（见 `docs/06-浏览器与网页标注方案.md`、`docs/12-最新开源Agent与CLI参考更新.md`）。
- **D11 双层 Agent 架构**：一个常驻**管理 Agent**管软件本身（状态/记忆/设置/权限/上下文/任务入口/跨项目自动化），一套**项目 Agent**（队长/代码/设计/审查/测试/上下文）管具体执行；两者身份分离，管理 Agent 可调度但不混成一个身份。多 Agent 不是多个聊天气泡：所有动作进同一条 timeline，带 `agentId/runtime/role`，权限按 Agent 分组，输出不混流。源码优先迁 AionUi（绿灯），不另起第二套 session/记忆/权限（见 `docs/17-Agent协作与管理Agent模型.md`）。
- **D12 分级自动决策**：默认关键动作问用户；用户主动开启"自动决策"后，管理 Agent 可在低风险场景按记忆/偏好/规则代答，但必须分级——L0 只读自动 / L1 低风险本地按偏好 / L2 写文件·运行命令·外部审查需规则或预授权 / L3 删除·发布·付款·登录·敏感必须明确确认。每个自动判断要有依据、有记录、可回放、可撤销，不得自动同意 L3、不得绕过 permission（见 `docs/17` 第 4 节）。
- **D13 AI 工作创作台统一定位**：Fleet 是"AI 工作创作台"——人类主导、AI 辅助，在一个软件里完成真实生产流程（软件开发/内容创作/AIGC）。把生产场景收进软件做成结构化工作台，不接管外部桌面/浏览器/一堆软件（外部网页只在标注/审查时受控进入）。多场景 = 同一工作台（项目/画布/时间线/属性面板/素材库/版本/导出/统一输入/Agent/记忆/权限/token 账本）的不同配置，用一套统一输入按选区/Stage 模式/项目类型/上下文路由，不为每个场景做一套 UI（见 `docs/02`、`docs/18`）。
- **待用户拍板**：① 分叉策略（建议软分叉）。

与以上决策冲突的内容不得作为执行依据。

## 当前硬规则

1. **基于干净 craft-agents-oss 改。** 下一轮先克隆干净 craft-agents-oss，确认原版能跑，再按 `docs/19` 迁移已验证资产。不重建 Electron/Vite/IPC/renderer 壳，仍优先理解并修改 craft 现有结构。
2. **AionUi 作为第二绿灯来源。** 需要 CLI Runtime/custom agent、ACP、进程生命周期、群聊、多 Agent、@ 提及、Skill 会话注入、团队交互时，优先从 `源码参考/software/AionUi` 迁移 Apache-2.0 代码或模式。
3. **只允许直接复制绿灯源码。** 目前可直接迁移源码的项目包括：
   - `源码参考/software/craft-agents-oss`（Apache-2.0，主基座）
   - `源码参考/software/AionUi`（Apache-2.0，补 CLI Runtime/ACP/custom agent/Agent/会话/Skill 交互）
   - `源码参考/plugins/open-design`（Apache-2.0，补 CLI runtime definitions、模型探测、prompt transport、stream parsers、Skill/Plugin/DESIGN.md/artifact/eval 体系；复制具体模板/设计系统/技能前需检查该子目录是否有额外 LICENSE）
   - `源码参考/plugins/rtk`（Apache-2.0，补命令输出压缩、gain/discover 统计、hook 矩阵；不得未经用户确认自动安装全局 hook 或改写 shell/agent 配置）
   - `源码参考/plugins/codegraph`（MIT，补本地代码图谱、索引、结构化查询、MCP installer 经验；接入必须走 Fleet/craft 权限与本地数据边界）
   - `源码参考/software/DeepSeek-Reasonix`（MIT，补 ACP/stdio、稳定前缀缓存、planner/executor 分层、权限/沙箱/配置思路）
   - `源码参考/plugins/deepcode-cli`（MIT，补跨客户端 Skill 路径、推理强度、MCP、CLI/session 管理）
4. **红灯/黄灯/候选项目只能黑盒参考。** Kun、Cherry Studio、Zed、LobeHub、Warp、OpenCode、Gemini CLI、Qwen Code、Cline、Roo Code、OpenHands、OpenClaw、ACP SDK/schema、browser-harness、CloakBrowser、cmux、golutra、multica、hermes-agent、cc-switch、AstrBot、cockpit-tools、context-mode、headroom、repomix、markitdown、OpenUI、HyperFrames、Kdenlive、Remotion、SVGator、Adobe Firefly/Express 等在未逐项核准许可证并写入绿灯表前，不允许复制源码进 `app/`。最新候选状态见 `docs/12-最新开源Agent与CLI参考更新.md`，`源码参考/` 全量矩阵见 `docs/14-源码参考目录专项审计.md`。
5. **源码参考目录按使用方式分层。** `源码参考/software/` 放完整软件、客户端、Agent 平台和编辑器；`源码参考/plugins/` 放可作为能力模块、sidecar、CLI、库、引擎或协议适配参考的项目。这个分层只解决查找路径，不改变红绿灯；复制源码仍必须按规则 3/4 和 `docs/26`。
6. **保留许可证和 NOTICE。** 迁移绿灯源码时必须保留原文件版权、SPDX/许可证标识；craft 的 `NOTICE` 必须随产品保留；复制带子目录独立 LICENSE 的文件前必须单独核对并记录。
7. **先保基座可跑，再迁能力。** 先保持干净 craft 原项目能跑，再按 `docs/19` 小步迁 CLI Runtime、WorkbenchShell、DesignAction 契约、BrowserPane Stage 等能力。
8. **每次动手前先看 craft 对应模块。** 例如桌面窗口看 `app/apps/electron/src/main/*`，renderer 看 `app/apps/electron/src/renderer/*`，工具/session 看 `app/packages/*`。
9. **UI 改造必须从新基座做。** 用户明确要求重新设计工作台界面。新 UI 从 `WorkbenchShell` 落地，先接真实 craft session/permission/timeline，再加 Stage/Inspector/Context。
10. **单人主线快速推进优先。** 默认由当前 Codex 直接选方向、实现、验证、同步文档。不要反复向用户确认，不要把时间耗在审查交接上；在边界清楚、风险可控时直接做一个用户可见产品闭环，再跑必要验证并记录结果。只有用户明确要求并行或任务天然独立时，才再拆给其他智能体。
11. **动手前先看参考项目做法。** 每次推进主线能力前，先快速查看绿灯项目或黑盒参考的相关交互/错误处理/协议模式，判断是否有更好的实现方式；绿灯可按许可证迁移并归因，黑盒项目只能借鉴行为和命令输出，不能复制源码/测试/类型/结构。
12. **不要再保留过程性快照和流水记录。** 当前目标是干净开发环境；除非用户明确要求，不再创建过程快照目录或过程性任务记录。需要保护大改动时，优先用 Git 分支/提交表达可恢复点。
13. **不得引入第二套会话系统。** AionUi 的 ACP、Team、Skill 能力只能适配进 craft 的 `SessionManager`、`SessionEvent`、permission、RPC 和现有 renderer event flow，不迁入第二套 conversation/session store。
14. **本机能力必须标注 RPC locality。** CLI Runtime、PTY、本机文件、BrowserView 等本机 OS 能力默认 `LOCAL_ONLY`；新增 RPC 必须先归类到 local-only 或 remote-eligible，远端 workspace 行为必须单独定义。
15. **多 Agent 必须带身份元数据。** Agent 编排相关事件、权限请求、工具调用、日志和持久化都要能追踪 `agentId`、runtime、role/displayName，避免并发输出混成单 Agent 流。
16. **CLI/终端/Git/桌面操作必须走权限和回放。** 探测可以无 UI 执行；启动 CLI、写文件、运行命令、Git mutate、桌面软件控制必须接 craft permission、session timeline、停止/回滚/证据链。
17. **MIT/Apache 不自动等于绿灯。** 未写入绿灯表的项目，即使本地 LICENSE 看起来宽松，也只能黑盒参考，不能复制源码、测试、类型定义、配置、样式、资源或结构性实现；一旦用户明确核准并写入绿灯表，才可按限定范围复制并归因。
18. **设计工作流先挂原浏览器标注页。** 不要另建孤岛 Figma 克隆页；优先在 craft browser pane / annotation / session timeline 上做设计选择模式、框选、多选、批量注释和 Comment AI 证据包。普通网页默认只能选择/注释/截图/给 Agent 上下文；只有 Fleet/Open Design artifact 或本地 editable preview 才能进入 Artifact Studio，做图片/视频/形状/蒙版/裁切/效果/参数/组件库/模板库等非破坏性手动编辑。
19. **所有新编辑能力必须 agent-native。** 先看 craft 已有 `SessionManager`、session tools、`browser_tool`、permission、file diff、annotation、preferences/config 写入方式；新增设计/媒体/模板编辑时，UI 操作和 AI 工具调用必须落到同一个 `DesignAction -> DesignPatch -> SessionEvent` 通道，记录 actor（user/agent）、agentId/runtime、selectionId、权限结果、回滚点和导出结果。禁止只在 renderer local state、DOM 临时 mutation 或单独文件里保存不可回放的修改。
20. **字体/颜色/动画资产必须可授权、可回放。** 本机字体扫描、网络字体加载、字体文件导入、Adobe/Firefly 类 AI 生成、SVG/Lottie/视频模板、动画 preset 都必须记录来源、许可证/商业复用范围、hash/version、导出方式和回滚点。Kdenlive（GPL-3.0）只能黑盒学习时间线/剪辑概念；Remotion 有特殊商用许可证，不能默认复制；SVGator 是外部服务/模板参考，不抓取私有状态；HyperFrames 虽是 Apache-2.0，也需用户核准并写入绿灯表后才可复制源码。
21. **上下文节省和外部审查必须诚实可观测。** 打包项目、转换文档、压缩上下文、调用外部 AI 网站、生成审查报告都必须记录 bundle hash、文件清单、secret scan、目标平台、权限确认、原始输出、token before/after、真实/估算/未知成本和回滚点。外部 AI 网站只能用用户授权的登录态和正常交互，不自动注册账号、不读 cookies/token、不绕过验证码/额度/风控；“不消耗 Fleet API token”不能写成“免费”。Repomix、MarkItDown、Headroom、OpenHands 在未绿灯前只能做 optional sidecar/黑盒参考。
22. **浏览器自动化不换主栈、不做规避。** 当前 Craft/Fleet 的浏览器能力以 BrowserPane、Electron CDP、`browser_tool`、permission、session timeline 为主。新增浏览器自动化必须先扩展这条链路：选择/点击/截图/网络/console/下载/回放/权限/证据包。browser-harness 可学自修复 helper、低层 CDP fallback 和失败诊断；OpenClaw 可学 managed profile、loopback gateway 和 profile 路由；CloakBrowser 或任何 stealth/anti-detect 浏览器不得作为默认依赖、插件或产品卖点，不得用于绕过平台检测、验证码、登录限制、配额或服务条款。
23. **外部/多智能体报告必须本机核验。** 不再按 agent 口头“完成/通过/真实闭环”判断项目状态。接收其他 agent 产物前必须核对：实际 worktree/path、`git status --short`、关键 diff、是否污染 `.claude/` 或当前主线文件、是否有对应测试、用户可见 UI 是否真实接线、AI/CLI 实际发送路径是否使用了新增上下文。模型名、连接名和运行时元数据不能当作真实 provider/计费来源证明；必须把声明模型、连接、endpoint/provider、计费来源和验证状态分开标注。
24. **一条主干，不并行铺开。** D1–D12 不是十二条平行线。加任何功能前先回答 `docs/01` 的"挂槽三问"（挂哪个 Surface 的哪个槽 / 用哪套选区动作 / 怎么进 timeline 和回滚），并确认它在 M0–M3 的位置；不要在主干（CLI 接入 → 动作引擎 → 浏览器/Artifact 画布 → 协作记忆审查）尚未就绪时先做下游挂件。同类能力（设计工作流、上下文效率、多 Agent、记忆）必须合成一个完整模块，遵守 `docs/01` 第 3 节五个"唯一"，不堆散按钮。
25. **管理 Agent 与项目 Agent 身份分离。** 管理 Agent 是软件管家（管软件/记忆/权限/上下文/跨项目自动化），默认低上下文足迹，不读每个项目全部代码，不替项目 Agent 写代码，不成为绕过 craft permission 的特权身份；项目 Agent 做具体执行。两者及队长/队员都带 `agentId/role`，进同一条 timeline，不混流。多 Agent 源码优先迁 AionUi，不另起第二套 session（见 `docs/17`、`AGENTS.md` 规则 13/15）。
26. **自动决策必须分级且可回放。** 默认关键动作问用户；开启自动决策后只在 L0/L1 自动，L2 需规则/预授权，L3（删除/发布/付款/登录/敏感）必须明确确认。每个自动判断要引用依据（记忆/偏好/规则）、写 timeline、可撤销。记忆按七分区隔离（用户/软件/项目/Agent/任务/设计资产/外部审查），项目记忆默认不串区，删除走 L3 确认（见 `docs/17` 第 4 节、`docs/05`）。
27. **一套工作台，不为场景另起 UI。** 软件开发/内容创作/AIGC 是同一工作台的不同配置，共用 Project/Stage/Inspector/Library/版本/导出/统一输入/timeline/账本。Stage 是一个画布多种模式（Code/Canvas/Browser/Timeline/Board），不是多个顶层页；统一输入按选区+Stage 模式+项目类型+上下文路由，和 `DesignAction` 是一体两面（人打字和 AI 调工具进同一路由/timeline/权限/回滚）。建造顺序仍以 `docs/01` 为准：底座先行，Timeline/Board/视频编辑是 M3+ 较晚阶段且受视频许可证边界约束，绝不在底座就绪前先做。人类主导、AI 辅助，不默认 Agent 主导，不接管外部桌面（见 `docs/02`、`docs/18`）。
28. **本机运行环境必须统一检测和诊断。** 新增 CLI、sidecar、ProjectPack、MarkItDown、codegraph、浏览器 helper、设计/视频导出依赖时，不允许各模块私自探测 PATH 和版本；必须接统一 System Tools / Project Environment registry，记录版本、路径、来源、`resolvedPathEnv`、项目 override、冲突诊断和修复建议。探测可自动；安装、改 PATH、写配置、运行修复命令必须走 permission + timeline。详见 `docs/28`。

## 常用入口

- Electron app：`app/apps/electron`
- Renderer：`app/apps/electron/src/renderer`
- Main process：`app/apps/electron/src/main`
- Shared/session/tool packages：`app/packages/*`
- 构建与脚本：`app/package.json`

## 推荐命令

优先从仓库根目录执行：

```bash
./scripts/craft.sh install
./scripts/craft.sh run typecheck:all
./scripts/craft.sh run electron:dev
```

如果本机已经全局安装 Bun，也可以在 `app/` 中直接执行 `bun run ...`。
