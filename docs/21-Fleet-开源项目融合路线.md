# 21 · Fleet 开源项目融合路线

> 当前路线：**craft-agents-oss 为主基座，AionUi / open-design 为 CLI 与 Agentic 工作流的主要绿灯来源**。其它宽松许可证项目按限定范围纳入，红灯/黄灯项目只做黑盒产品/交互参考。

## 1 · 产品主线

Fleet = craft 的 agent-native 工作区底座 + AionUi 的 CLI/ACP/Team/Skill 运行体系 + open-design 的 runtime definition / Skill-Plugin-DESIGN.md / artifact-eval 体系 + Figma/Stitch 的官方互通工作流 + 字体/颜色/动画/视频创意编辑层 + 上下文效率与外部 AI 审查层。设计工作流和审查工作流都必须保持 craft 的核心哲学：软件本身可被 AI 编辑，人类 UI 与 AI 工具调用共用 `DesignAction -> DesignPatch -> SessionEvent` / `ReviewAction -> ReviewReport -> SessionEvent`。

目标不是把所有开源项目拼起来，而是把 craft 改成更接近 Codex/Claude Desktop/OpenCode 的低摩擦桌面 Agent 控制台：

- 第一屏直接开始任务，不先逼用户配置一堆 source/provider。
- Git、浏览器、Skill、MCP、终端围绕当前 session 出现。
- Agent 能操作软件，过程可观察、可审批、可回放。
- AionUi 的 custom agent、ACP、团队/群聊/@提及、Skills Hub 补上 craft 缺少的 Runtime Host 与 Agent 编排。
- open-design 的 runtime definitions、模型探测、prompt transport、Skill/Plugin manifest、DESIGN.md、artifact preview/eval 补上 Fleet 缺少的 CLI catalog 和设计工作流骨架。
- 浏览器标注页升级为设计工作流入口：单选、框选、多选、批量注释、Comment AI；AI 生成 artifact 进入 Artifact Studio，支持图片/视频/形状、字体/文字、颜色/品牌色板、AI 文字特效、动画 preset/keyframe/timeline、蒙版/裁切、位置/尺寸/旋转/圆角/模糊参数、自建库和语义拖动/重排。
- Figma 通过官方 MCP/Plugin/REST 读写 native design；Stitch 作为 prompt/image-to-UI/code/Figma handoff 的外部互通 lane。
- 上下文效率层把 Repomix 式项目打包、MarkItDown 式文档转 Markdown、Headroom/rtk/Reasonix/codegraph/context-mode 式压缩/检索/缓存友好组织、Context Usage 成本面板和外部 AI 网站多平台审查打通。

## 2 · 直接源码来源

| 来源 | 用法 | 原因 |
|---|---|---|
| `app/` / `源码参考/software/craft-agents-oss` | 主工程，直接改 | Apache-2.0，已有 Electron、session、source/MCP、browser、Skill、权限、自动化 |
| `源码参考/software/AionUi` | 按模块迁移 | Apache-2.0，适合补 CLI/ACP/custom agent、进程生命周期、群聊、多 Agent、Skill 运行注入 |
| `源码参考/plugins/open-design` | 按模块迁移 | Apache-2.0，适合补 CLI runtime definitions、模型探测、prompt transport、stream parsers、Skill/Plugin/DESIGN.md、artifact preview/export/eval |
| `源码参考/plugins/rtk` | 按模块迁移 | Apache-2.0，适合补命令输出压缩、gain/discover 统计、hook 矩阵；安装 hook 必须用户确认 |
| `源码参考/plugins/codegraph` | 按模块迁移 | MIT，适合补代码图谱、预索引、结构化查询、MCP installer；必须有本地数据删除/重建边界 |
| `源码参考/software/DeepSeek-Reasonix` | 按模块迁移 | MIT，适合补 ACP/stdio、稳定前缀缓存、planner/executor 分层、权限/沙箱/配置 |
| `源码参考/plugins/deepcode-cli` | 按模块迁移 | MIT，适合补跨客户端 Skill 路径、推理强度、MCP、CLI/session 管理 |

说明：MIT/Apache-2.0 不自动等于绿灯。只有被写入本表并注明复制范围、来源版本和归因方式的项目，才允许复制源码。复制 open-design 的模板/设计系统/技能/插件前还要逐目录检查额外 LICENSE。

## 3 · 黑盒参考来源

| 来源 | 只参考什么 | 不做什么 |
|---|---|---|
| Gemini CLI | `gemini --acp` stdio ACP、MCP forwarding、file proxy、debug/telemetry 入口 | 未写入绿灯表前不复制源码；不自动恢复生产 mapping，先做 opt-in smoke |
| Qwen Code | `qwen` / `qwen -p` / `qwen serve`、Auto-Memory/Auto-Skills/SubAgents、ACP/Claw 生态 | 未确认 stdio ACP 前不加入 production mapping；未写入绿灯表前不复制源码 |
| Cline / Roo Code | CLI/SDK、Mode、Custom Modes、团队化产品形态 | 未写入绿灯表前不复制源码、插件结构、UI |
| OpenHands / Agent Canvas | local/remote/cloud agent backend、Agent Canvas、automation、sandbox 风险提示、多 backend 切换 | 主体 MIT 但 enterprise PolyForm；不作为单个 stdio runtime，不复制 enterprise，不替代 craft session |
| Figma 官方 MCP / Plugin / REST | 读取设计上下文、组件、变量、layout；创建/修改 frames、components、variables、auto layout；Dev Mode 互通 | 只走官方 API/权限；不复制 Figma UI/品牌资产，不用鼠标自动化绕过结构化接口 |
| Google Stitch | prompt/image/wireframe 生成 UI/code，快速变体，Figma/code handoff | 只做 prompt/export/import lane；不抓取私有状态，不绕过账号权限 |
| Claude Artifacts / Claude Design 类体验 | 聊天旁 artifact 窗口、持续修改和分享体验 | 只学产品形态；不复制闭源新编辑功能、UI、文案、品牌 |
| Repomix | 仓库打包、token counting、ignore、secret 检查、AI-friendly output | MIT 候选；未绿灯前不复制源码，可做 optional sidecar 或自研接口 |
| MarkItDown | PDF/Office/HTML/图片/音频等多格式转 Markdown | MIT 候选；未绿灯前不复制源码，转换不可信输入必须最小权限 |
| Headroom | 本地上下文压缩、可逆检索、MCP/proxy、output shaping、stats | Apache-2.0 候选；未绿灯前不复制源码，节省必须可观测 |
| Adobe Firefly / Express | AI 文字特效、生成式填充、模板化创意编辑、品牌资产工作流 | 只按官方 API/产品行为参考；不复制闭源 UI、素材、模板或品牌资产 |
| SVGator | SVG 动画模板库、preset 分类、导出目标和动效参数形态 | 外部服务参考；不抓取模板库或私有状态，不复制素材 |
| HyperFrames | HTML-native、agent-friendly、deterministic video/render、Catalog/Studio/Frame.md | Apache-2.0 强候选，但未写入绿灯前不复制源码；可先黑盒学习架构边界 |
| Remotion | React 程序化视频、composition/render pipeline、云渲染思路 | 特殊许可证；不默认作为依赖，不复制源码，商用边界需单独评估 |
| Kdenlive | 时间线、轨道、剪辑、转场、音视频效果等 NLE 产品概念 | GPL-3.0；只能黑盒学习，不复制源码、测试、QML/C++ 结构或资源 |
| cc-switch | Claude/Codex/OpenCode/OpenClaw/Hermes 等跨应用 Skill/Provider/MCP 管理路径、SSOT + symlink/copy 产品模型 | 未核准前不复制源码、测试、类型、配置和样式；不能替代 AionUi 的 Runtime Host 主路线 |
| OpenCode | 低摩擦工作台、简洁任务入口 | 不复制源码 |
| LobeHub | Chief Agent Operator、Agent Builder/Groups、Project/Workspace/Schedule、白盒记忆、Skill/MCP 市场、上下文管线、服务模型分配、系统工具健康面板、文件/网页转 Markdown、IM 网关、工作报告 | LobeHub Community License 高风险；不复制源码、类型、测试、配置、组件、UI 结构、文案或资源；只把产品能力落回 craft session/permission/timeline + AionUi/open-design/rtk/codegraph 等绿灯来源 |
| Claude/Codex Desktop | 左侧会话、中心输入、右侧上下文/进度/文件面板 | 不照抄品牌资产 |
| Warp | Agentic terminal、命令块、长任务观察 | 不复制闭源 UI |
| Cherry Studio | Provider/知识库/迁移/E2E 的成熟度 | 不复制 AGPL 源码 |
| Kun | 轻桌面气质 | 不复制非商业源码 |
| Golutra | 终端会话、命令分发、成员化协同 | BSL 1.1，高风险黑盒，不复制源码 |
| Hermes Agent | toolset/browser tools 的组织方式 | MIT 但未纳入绿灯，暂不复制源码 |
| multica/cmux/Zed 等 | Git/diff/browser/多面板/协作思路 | 未核准前不复制源码 |

## 4 · 当前吸收矩阵

| 目标模块 | craft 现状 | Fleet 还要做 |
|---|---|---|
| 主工作台 | 有 AppShell、panel stack、session list、sources/skills 面板 | 改成更像 Codex/Claude 的低摩擦第一屏，弱化 Craft 文档产品感 |
| CLI / ACP Runtime | 有 Claude/Pi/Copilot 连接和 shell/background task，但不是统一本机 CLI Runtime Host | 优先学习 AionUi：custom agent、command/args/env/native skills dirs、CLI/ACP 健康测试、进程生命周期；cc-switch 只补跨应用资源模型 |
| CLI Runtime Definition | 当前在干净基座上重做 | 迁移 open-design runtime def 字段与实现：model probe、auth probe、promptViaStdin/promptViaFile、stream parser、reasoning options、MCP injection；适配进 craft/Fleet |
| 服务模型路由 | craft 有 provider/source 与部分 token usage，但没有按内部服务分配模型 | 参考 LobeHub 的服务模型页，做 Fleet `Model Assignment`：主聊天/管理 Agent/记忆分析/记忆写入/标题命名/翻译/历史压缩/档案生成/审查总结分别配置模型、effort、成本和 fallback；不能只有一个全局模型 |
| 系统工具健康面板 | craft 有本机 shell/tool/background task，但缺一页显示所有运行环境 | 参考 LobeHub 的系统工具页，做 Fleet `System Tools`：CLI Runtime、node/python/bun/pnpm/uv、ProjectPack/MarkItDown/codegraph/rtk、browser helper、设计/视频导出依赖都显示版本、路径、可用性、修复建议和权限边界 |
| Agent 编排 | 有 subagent 和 session 状态，但不是群聊团队 | 接 AionUi 的 Agent 名册、团队生命周期、@ 指派 |
| 管理 Agent / Agent Operator | craft 没有软件级常驻管理 Agent；LobeHub 已把 Agent 作为工作单元并提供 operator/agent groups/schedule/project/workspace 产品形态 | 产品形态参考 LobeHub；实现必须基于 craft `SessionManager`、`SessionEvent`、permission、timeline 和 AionUi team/process/skill 绿灯源码，不复制 LobeHub |
| Skill | 有 workspace skills、slash command、UI 列表 | 做全局 Skill 管理、安装/更新/启用、AionUi 式运行时注入；cc-switch 的 SSOT/per-app enable 仅黑盒参考 |
| Artifact / 设计工作流 | craft 有 artifacts、browser pane、message annotation；Open Design 有 manual edit/live artifact/eval/export | 先把原浏览器标注页升级为设计选择画布：单选、框选、多选、批量注释、Comment AI；再迁并扩展 Open Design artifact 编辑为 Artifact Studio：媒体/形状/字体/颜色/动画/蒙版/参数/资源库/export/eval |
| Typography / Color | craft 还没有面向 artifact 的字体库、文字编辑、品牌色板和颜色 token 管理 | 建本机/项目/网络字体引用、字体授权 metadata、文字样式 patch、色板/渐变/吸管/品牌 token；所有变更走 `DesignAction` |
| Motion / Animation / Video | craft 还没有网页动效编辑、动画模板库、时间线/关键帧和视频导出链路 | 先做网页动效 DTO 与 CSS/WAAPI/SVG/Lottie 输出，再研究 HyperFrames/Remotion 式 HTML-native 视频导出；Kdenlive 只提供时间线概念参考 |
| Context / Token Efficiency | craft 有 compaction、tokenUsage 字段、部分 cache_control 逻辑，但没有完整产品面 | 做 Usage Report、ProjectPack、MarkItDown sidecar、rtk/codegraph/Reasonix 组合优化、Headroom sidecar 候选和外部 AI 网站审查报告 |
| Context Pipeline / 多格式输入 | craft 有基础文件与工具上下文，但缺统一的文件/网页/知识库文档化管线 | LobeHub 的 context-engine/file-loaders/web-crawler 只作产品参考；Fleet 统一走 ProjectPack + MarkItDown sidecar + codegraph + ReviewBundle，不复制 LobeHub 实现 |
| MCP/source | 有 source 系统、MCP/API/local、权限与测试 | 做更直观的一等 MCP 管理面板和默认发现 |
| 浏览器 | 有 browser pane/CDP/browser_tool | 做右侧常驻预览、网页点评、设计选择、多选框选、证据包入口 |
| Git/diff | 有 diff、分支清理和 git-bash 辅助 | 做完整 Git panel：status、branch、worktree、commit、PR |
| 终端 | 有 shell/tool/background task | 做 Warp 式 Agentic terminal、命令块、PTY、历史、用户接管 |
| 软件操作 | 有 sources/browser/local tools | 统一成“观察状态 + 执行动作 + 审批 + 回放”的软件操作层 |
| 中文新手体验 | craft 主要是英文和 source 配置导向 | 默认中文、自动发现、模板化配置、减少设置页依赖 |

## 5 · 近期顺序

1. **CLI Runtime 重做验收**：按 `docs/24-CLI-Runtime-验收清单.md` 跑 Electron 手工矩阵，确认 CLI Runtime 从设置页到聊天区真的可用。
2. **P1 附件边界**：当前继续硬拒绝；若打开，只做 capability-gated `inline_text`，不传本地路径、图片、PDF、Office 原文件。
3. **下一候选 runtime mapping**：优先验证 Gemini CLI `gemini --acp`；其次确认 Qwen Code 是否有 stdio ACP 或需要 daemon adapter。
4. **服务模型路由 + 系统工具面板**：先把内部后台任务的模型分配和本机运行环境可用性做成明确设置页；它们是后续记忆、压缩、审查、设计导出能否稳定运行的前置。
5. **评测骨架 + 缓存命中统计**：读取 craft `TokenUsage.cacheReadTokens/cacheCreationTokens`、输入/输出 token、费用、runtime/model/effort；优先迁移 open-design eval/diagnostics 边界，rtk/codegraph/Reasonix 作为上下文效率实现来源。
6. **P1 Agent 编排**：从 AionUi 迁 Agent/team/@mention/ACP 能力，但适配进 craft session/timeline；所有效果都要能被评测骨架记录。
7. **P1 管理 Agent 产品面**：参考 LobeHub 的 Chief Agent Operator / Agent Groups / Project / Workspace / Schedule 形态，把 Fleet 的常驻管理 Agent 做成软件管家和调度入口；实现仍基于 craft session/timeline + AionUi team/process，不复制 LobeHub。
8. **P1 Skill 管理**：在 craft skills 基础上补全局 SSOT、安装、更新、启用、运行注入；AionUi 为主，cc-switch 和 LobeHub 只补产品目录/市场/维护体验。
9. **P1 设计工作流 DWF-1/DWF-3**：先在原浏览器标注页接设计选择模式、单选、框选、多选、批量注释、Comment AI 证据包，不另建孤岛页面。
10. **P1 DesignAction 契约**：先定义人类 UI 与 AI 工具共用的结构化动作，覆盖选择、注释、插入、裁切、调参、建库、导出，写入 craft permission、timeline、diff、rollback。
11. **P1 Typography / Color v1**：先做字体来源 metadata、文字编辑、font family/weight/size/line-height/letter-spacing/variable axes、色板/渐变/吸管/品牌 token；不默认打包未授权字体。
12. **P1 Artifact Studio v1**：参考 Open Design manual edit/live artifact/export/eval 边界，扩展为媒体插入、视频、形状、蒙版/裁切、transform/effect 参数、资源库，先接 craft browser pane + artifacts + session timeline，不复制模板或 UI；所有写操作走 DesignAction。
13. **P1 Motion / Animation v1**：先做网页动效 preset、keyframe、easing、duration、trigger、loop、scroll/hover；视频导出后续再接 HyperFrames/Remotion 式 pipeline。
14. **P1 Usage / Context Report**：把真实 token、cache、cost、package token、compression before/after、外部审查节省估算做成透明面板，真实/估算/未知分开显示。
15. **P1 ProjectPack / External Review**：Repomix/MarkItDown 式打包与转换，用户确认后提交外部 AI 网站审查，回收并合并报告；不绕过平台限制。
16. **P1 Figma / Stitch bridge**：Figma 先 read context，后 write native canvas；Stitch 先 prompt/export/import lane。
17. **P1 Git / 浏览器 / 终端三面板底层**：先补 RPC/service/证据链，再接现有 panel。
18. **P2 去 Craft 化和第一屏重排**：用户确认后做 Codex/Claude/OpenCode 式首屏，不和当前“不改 UI”冲突。

## 6 · 评测与上下文效率前置

CLI Runtime 重做完成前不要让上下文效率模块抢占主线；CLI Runtime 稳定后、Agent 编排前，先做最小评测骨架，避免多 Agent、Fusion、Skill 注入后无法判断是否真的省 token 或提升成功率。`rtk`、`codegraph`、`DeepSeek-Reasonix` 已是绿灯，可按限定范围迁移实现；`context-mode` 仍因 ELv2 只能黑盒参考。

最小范围：

- **指标**：input tokens、output tokens、cache read tokens、cache creation tokens、估算费用、runtime、model、effort、任务成功/失败、人工重试次数。
- **来源**：优先读取 craft 现有 session/token usage；没有真实 provider 字段时使用 fixture，不在 UI 里伪造真实缓存命中。
- **任务集**：先放 3 类小任务：代码定位、日志压缩、跨文件改动说明。
- **对照组**：原始 craft 路径、CLI runtime 路径、后续 context/graph/压缩策略路径。
- **输出**：保存到 Fleet 数据目录，文档只记录结论和命令。

绿灯/黑盒项目在这里的允许用法：

- Reasonix：可迁移稳定前缀/易变上下文分层、ACP、planner/executor 的实现片段。
- rtk：可迁移输出压缩和 gain 统计的实现；安装 hook 必须用户确认。
- context-mode：只学习 `ctx-stats`/statusline 表达和上下文节省可观测。
- codegraph：可迁移结构化查询减少 Read/Grep 的实现；索引必须可删除/重建。
