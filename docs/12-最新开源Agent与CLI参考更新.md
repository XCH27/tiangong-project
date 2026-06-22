# 12 · 最新开源 Agent / CLI 参考更新

> 状态日期：2026-06-19
> 用途：记录本轮基于官方 GitHub / 官方文档核对的最新开源 Agent、CLI、ACP 生态变化。本文是参考更新，不自动改变绿灯表；是否允许复制源码仍以 `AGENTS.md` 和 `docs/26-源码参考使用规则与索引.md` 为准。

## 1 · 结论摘要

当前 Fleet 不应该再只按 2026-06-17 的本地克隆清单判断 CLI 生态。ACP 生态已经明显扩大：

- **Gemini CLI**：官方开源 Apache-2.0，明确支持 `gemini --acp`，是最直接的下一个 stdio ACP mapping 候选。
- **Qwen Code**：官方开源 Apache-2.0，已从 Gemini CLI 分叉后独立发展，提供 `qwen`、`qwen -p`、`qwen serve`，并出现在 ACP agent 列表；但 Fleet 当前 stdio ACP client 不能直接消费 HTTP+SSE daemon，需先确认本机是否有 stdio ACP 或通过 adapter。
- **Cline / Roo Code**：Apache-2.0，已经从 VS Code 插件扩展到 CLI/SDK/多模式团队；适合学习 mode、team、SDK、IDE 插件产品模型，但未写入绿灯表前不能复制源码。
- **OpenHands / Agent Canvas**：适合作为“多 backend、本地/远程/cloud agent 控制台”的参考；它强调 backend 边界和 sandbox 风险，适合 Fleet 未来 managed runtime / remote host 设计。
- **Headroom / Repomix / MarkItDown**：上下文效率路线已经不能只靠对话摘要。Headroom 代表本地压缩/可逆检索/MCP proxy，Repomix 代表仓库 AI-friendly 打包和 token counting，MarkItDown 代表多格式文档转 Markdown；三者适合 Fleet D9 的 ProjectPack、Context Optimizer 和外部审查输入管线。
- **browser-harness / OpenClaw / CloakBrowser**：浏览器自动化路线不能简单接插件。browser-harness 值得吸收薄 CDP、自修复 helper 和 replay 诊断；OpenClaw 值得吸收 managed profile、loopback gateway 和 profile routing；CloakBrowser 是 stealth/anti-detect 高风险来源，只能黑盒研究，不能作为默认能力或规避平台检测。
- **LobeHub**：本地复查后确认它已经实现了很多 Fleet 想要的产品形态：Chief Agent Operator、Agent Builder/Groups、Project/Workspace/Schedule、白盒记忆、Skill/MCP 市场、context pipeline、file-loaders、web-crawler、IM 网关和工作报告。用户补充截图显示，最直接可落地的是两个设置面板：**服务模型**（按内部任务分配模型：新建助理、话题命名、翻译、历史压缩、档案生成、记忆分析/写入等）和**系统工具**（展示 CLI/node/python/npm/bun/pnpm/uv 等运行环境的版本、路径、可用性）。但根许可证是 LobeHub Community License，当前只能黑盒学习产品边界，不能复制源码或 UI。
- **OpenUI**：MIT 的生成式界面框架。它把“可允许生成的组件”定义成模型 prompt，再把紧凑、可流式解析的界面描述渐进渲染出来；适合研究 Artifact、报告、表单等受限生成界面的协议与 token 效率。它不是 Fleet 的工作台壳，也不能替代现有 session、permission、timeline 和 DesignAction 主链；未核准前只作黑盒参考。
- **ACP 本身**：官方协议仓库 Apache-2.0，当前稳定 wire protocol 仍看 `protocolVersion`，schema release 不等于 wire breaking；Fleet 后续 ACP client 应按 negotiated protocol + capabilities 判断能力，不要硬编码 schema 版本。
- **Continue**：Apache-2.0，但官方 GitHub README 已标记不再 actively maintained/read-only；只能作为历史参考，不应作为新实现主线来源。

## 2 · 官方来源核对表

| 项目 | 官方状态 | 许可证/复制边界 | 对 Fleet 的更新 |
|---|---|---|---|
| Gemini CLI | GitHub README 写明是 open-source terminal agent，Apache-2.0；官方文档写明 ACP mode 走 stdio JSON-RPC，启动命令 `gemini --acp` | 候选绿灯；未获用户明确写入绿灯表前只能黑盒参考 | 建议作为下一个 mapping 候选：先本机探测 `gemini --version` + `gemini --acp` 默认 skip smoke，再决定是否恢复内置探测 |
| Qwen Code | GitHub README 写明 open-source terminal coding agent，Apache-2.0；支持 `qwen`、`qwen -p`、`qwen serve`，生态里有 ACP/Claw 说明 | 候选绿灯；未写入绿灯表前只能黑盒参考 | 当前仍 unsupported；后续先确认是否有 stdio ACP 入口，或是否需要 HTTP+SSE/adapter 桥 |
| Cline | GitHub README 写明 IDE + terminal coding agent，Apache-2.0；CLI 可 `npm i -g cline`，有 SDK | 候选绿灯；未写入绿灯表前只能黑盒参考 | 学 mode、SDK、多 agent team、scheduled automation；不优先接 production mapping，先只做产品模型参考 |
| Roo Code | GitHub README 写明 Apache-2.0，强调 Code/Architect/Ask/Debug/Custom Modes | 候选绿灯；未写入绿灯表前只能黑盒参考 | 学 mode/profile 和多角色产品形态；不要复制插件实现 |
| OpenHands | GitHub README 强调 local/remote/cloud backend、Agent Canvas、可用任何 ACP agent；同时警告无 sandbox 模式会有全文件系统访问 | 许可证需继续按具体 repo 文件核对；未写入绿灯表前只能黑盒参考 | 学 backend 边界、sandbox 警告、多 host 切换、automation；对 Fleet managed/remote runtime 有价值 |
| Headroom | GitHub README 定位为 AI agents 的 context compression layer，支持 library/proxy/MCP/wrap、可逆压缩、stats、output shaping；本地 LICENSE 为 Apache-2.0 并有 NOTICE | Apache-2.0 候选；未写入绿灯表前只能黑盒参考或 sidecar smoke | 学本地压缩、可逆检索、输出 token shaping、savings 可观测；适合 Context Optimizer |
| Repomix | GitHub README 定位为把整个仓库打包成 AI-friendly file，支持 token counting、ignore、secretlint、tree-sitter compression；本地 LICENSE 为 MIT | MIT 候选；未写入绿灯表前只能黑盒参考或 optional sidecar | 学 ProjectPack：当前 repo/diff 打包、token count、secret scan、外部审查包 |
| MarkItDown | GitHub README 定位为把 PDF、PowerPoint、Word、Excel、图片、音频、HTML、CSV/JSON/XML、ZIP、YouTube、EPub 等转 Markdown；强调 I/O 权限安全；本地 LICENSE 为 MIT | MIT 候选；未写入绿灯表前只能黑盒参考或 optional sidecar | 学多格式附件/资料转 Markdown；转换不可信输入必须最小权限 |
| browser-harness | GitHub README 定位为把 LLM 直接连到真实浏览器的薄 CDP harness；强调 one websocket to Chrome、agent 在执行中补缺失 helper、自修复 | 候选/黑盒；未写入绿灯表前不能复制源码、测试、类型或配置 | 学自修复 helper registry、低层 CDP fallback、失败诊断、任务 replay；不要替换 craft BrowserPane/`browser_tool` 主栈 |
| OpenClaw | 官方 docs 描述 OpenClaw-managed browser 使用独立 Chrome/Brave/Edge/Chromium profile，通过 loopback Gateway 控制；CLI docs 还区分 managed/user/custom CDP profile | 候选/黑盒；未写入绿灯表前不能复制源码 | 学 managed profile、local gateway、profile routing、安全审计提示；不引入第二套 agent platform |
| CloakBrowser | GitHub/官网定位为 stealth Chromium，强调 source-level stealth、AI agent / Selenium / Playwright drop-in、bot detection bypass / fingerprint patching | 高风险黑盒；即使许可后续可用，也不能默认接入规避检测能力 | 只作风险/兼容性研究；不得作为默认插件、依赖或卖点，不用于绕过验证码、bot detection、风控、登录限制或配额 |
| OpenCode | 官方 GitHub 当前仍 MIT；Fleet 已有 `opencode acp` mapping | 已是黑盒行为参考，未写入绿灯表不复制源码 | 保持 production mapping；只调用本机二进制，不复制源码 |
| LobeHub | 本地 README、package 矩阵和用户补充截图显示其产品覆盖 Chief Agent Operator、Agent Groups、Project/Workspace/Schedule、Personal Memory、Skill/MCP、context-engine、file-loaders、web-crawler、IM gateway、服务模型分配、系统工具健康面板等 | 根 LICENSE 为 LobeHub Community License；高风险黑盒 | 只学产品边界：管理 Agent、项目工作区、白盒记忆、Skill 市场、上下文管线、服务模型路由、系统工具可用性面板和报告形态；实现必须回到 craft/AionUi/绿灯来源 |
| ACP | 官方协议仓库 Apache-2.0；README 明确 ACP 标准化 editor 与 coding agent 通信，wire compatibility 看 `protocolVersion` | 可作为协议参考；如复制 schema/SDK 必须先写入绿灯范围和归因 | Fleet ACP client 后续应加 capabilities 判断，特别是 prompt、cancel、file proxy、MCP forwarding |
| Continue | GitHub README 标记 repo 不再 actively maintained 且 read-only；Apache-2.0 | 历史参考 | 不作为新主线；只学最终 release 的 CLI/IDE 分发形态 |

## 3 · 下一批 mapping 候选排序

1. **Gemini CLI：最高优先级候选**
   - 官方 ACP stdio 入口明确：`gemini --acp`。
   - 与 Fleet 当前 ACP stdio client 形态最接近。
   - 需要先恢复/新增探测定义，并做默认 skip 的 `FLEET_GEMINI_SMOKE=1` opt-in smoke。
   - 风险：认证流、Google 账号/Vertex/API key、MCP/file proxy 能力可能和当前 Fleet fake ACP 契约不同。

2. **Qwen Code：第二候选，但先确认入口**
   - 官方 CLI 能力强，且 Qwen Code 已出现在 ACP agents 列表。
   - 目前公开 README 中最明确的是 `qwen serve` HTTP+SSE daemon；Fleet 当前只实现 stdio ACP。
   - 需要先本机探测 `qwen --help` / `qwen serve --help` / ACP 文档，再决定是 stdio mapping、daemon adapter，还是继续 unsupported。

3. **OpenHands / Agent Canvas：不做 runtime mapping，做架构参考**
   - 它更像多 backend agent control center，不是单个 stdio runtime。
   - 适合 Fleet 后续 remote/local managed runtime、sandbox、automation、agent server 切换。

4. **Cline / Roo Code：先做产品模型参考**
   - 适合 mode/team/SDK/IDE 插件的交互参考。
   - 没有确认 ACP stdio 入口前，不加入 detected mapping。

## 4 · 文档规则更新

- “Gemini CLI 已从内置探测删除”仍是当前生产状态，不代表永久排除。基于最新官方 ACP 文档，它现在是下一个 mapping 候选，但必须先做本机 opt-in smoke。
- “Qwen unsupported”仍成立，但理由从“入口未确认”细化为“当前未确认 stdio ACP；公开 daemon/Claw 能力需要 adapter 设计”。
- “OpenCode 黑盒参考”不影响现有 `opencode acp` production mapping；我们只是调用本机二进制，不复制源码。
- Headroom、Repomix、MarkItDown、OpenHands 已进入 `docs/16-上下文效率与外部AI审查方案.md`，但这不等于绿灯；默认只能做 optional sidecar 或黑盒产品参考。
- 外部 AI 网站审查必须走用户授权浏览器会话和权限确认，不允许把“免费/不消耗 Fleet API token”解释成可以绕过平台用量、登录、验证码或风控。
- LobeHub 的价值要写成“黑盒产品参考”，不能因为它实现了 Agent Operator / memory / Skill / context pipeline 就让 agent 复制它的包结构或组件。
- LobeHub 的**服务模型**和**系统工具**是近期更直接的参考：Fleet 应按内部服务配置模型与 fallback，并用一个健康面板显示本机 CLI/运行时/sidecar 的可用性；这比先做大而全的 Agent Groups 更容易落地。
- 新增候选项目即使是 Apache/MIT，也不能自动进入绿灯表；必须用户明确核准并写入 `AGENTS.md` / `源码参考使用规则与索引.md`。

## 5 · 官方来源

- Gemini CLI GitHub: https://github.com/google-gemini/gemini-cli
- Gemini CLI ACP mode: https://geminicli.com/docs/cli/acp-mode/
- Qwen Code GitHub: https://github.com/QwenLM/qwen-code
- Cline GitHub: https://github.com/Cline/Cline
- Roo Code GitHub: https://github.com/RooCodeInc/Roo-Code
- OpenHands GitHub: https://github.com/OpenHands/openhands
- OpenCode GitHub: https://github.com/anomalyco/opencode
- Headroom GitHub: https://github.com/chopratejas/headroom
- Repomix GitHub: https://github.com/yamadashy/repomix
- MarkItDown GitHub: https://github.com/microsoft/markitdown
- ACP GitHub: https://github.com/agentclientprotocol/agent-client-protocol
- ACP agents list: https://agentclientprotocol.com/get-started/agents
- Zed external agents docs: https://zed.dev/docs/ai/external-agents

## 6 · 设计工作流外部参考更新（2026-06-19）

这些来源不是 Fleet 的源码绿灯表变更，但会影响下一阶段 Open Design / Figma / Stitch 一体化路线：

| 来源 | 最新可用能力 | Fleet 用法 |
|---|---|---|
| Figma MCP server | 官方文档显示 MCP 可读取设计上下文、组件、变量、layout，并可创建/修改 frames、components、variables、auto layout；写 canvas 能力受席位/计划/权限限制 | 先做 read context，再做带权限确认的 write canvas；不要用鼠标自动化绕过官方 API |
| Figma Plugin API / REST | Plugin API 可改节点位置、层级、文本、样式；REST 适合文件、变量、dev resources、webhook | 作为 Figma bridge 的结构化接口，和 Fleet `FigmaLink` / handoff 记录绑定 |
| Google Stitch | 官方定位是快速生成 mobile/web UI，支持 prompt/image/wireframe 到 UI/code/Figma handoff 的 ideation 工作流 | Fleet 只做 prompt/export/import lane，不抓取未授权私有状态 |
| Claude Artifacts | 官方帮助页描述为把想法变成可分享 app/tool/content，并在聊天旁专用窗口继续修改/引用 | 只学习 artifact loop 产品形态；不复制 Claude 闭源 UI、文案、品牌或新编辑功能 |
| Adobe Firefly / Express | 官方能力覆盖生成图片/视频、Generative Fill、AI Assistant、文字特效、模板化编辑、品牌字体/颜色等 | 只按官方 API/产品行为参考；学习“AI 生成后手动精修”的流程，不复制 Adobe UI、品牌、模型或私有资产 |
| SVGator animation templates | 页面声明 animation templates 可在 SVGator 中自定义并导出 SVG、Lottie、GIF 或 video | 参考动画模板库、分类、导出形态；具体模板导入必须核对 SVGator 授权，不抓取私有项目 |
| Kdenlive | GitHub 显示 GPL-3.0，自由开源视频编辑器，基于 MLT/KDE，包含时间线/轨道/剪辑/转场/效果概念 | GPL-3.0，不能复制源码进 Fleet；只黑盒学习时间线和视频编辑产品模型 |
| Remotion | GitHub README 表示用 React 程序化创建视频，并提示有特殊许可证、某些场景需 company license | 只参考 React/programmatic video 和 render pipeline 思路；不默认作为依赖或复制源码 |
| HyperFrames | GitHub README 表示 HTML/CSS/media/seekable animations 到 deterministic MP4，agent-friendly，Apache-2.0，无 per-render fees；有 Catalog/Studio/Frame.md | 与 Fleet agent-native 设计高度契合，是强候选；未写入绿灯表前仍只黑盒参考，不复制源码 |

对 Fleet 的结论：

- 下一阶段设计能力第一落点是现有浏览器标注页，而不是新建孤岛设计器。
- Open Design 是绿灯实现来源，可迁移 manual edit、live artifact、DESIGN.md、eval/export；复制模板/设计系统/技能前继续逐目录查 LICENSE。
- Figma/Stitch/Claude Artifacts 是外部产品/API 参考，不改变源码复制边界。
- 用户明确需要多选/框选后一起编辑或注释，并且对 AI 生成网页/APP/PPT/商品页直接做手动微调；实现顺序应是 selection set -> 批量注释/Comment AI -> `DesignAction` 共用动作契约 -> Typography/Color v1 -> Artifact Studio（媒体/形状/蒙版/裁切/参数/资源库） -> Motion/Animation v1 -> Figma/Stitch bridge。
- 这里不能漏掉 craft 的 agent-native 哲学：软件本身也要能被 AI 编辑。Artifact Studio 的每个手动动作都要有等价 AI 工具入口，并写入同一套 session timeline、permission、patch、diff、rollback。
- 字体/颜色/动画不是独立视频软件路线，而是网站/APP/PPT/商品页编辑基础能力：本机/项目/网络字体、AI 文字特效、色板/渐变、动画 preset/keyframe/timeline 和动画库都必须纳入 `DesignAction`。

## 7 · 浏览器自动化参考更新（2026-06-19）

这些来源和 Fleet 的“内置浏览器 + 网页标注 + 外部 AI 审查”相关，但当前结论不是“装成插件就完事”：

| 来源 | 可吸收点 | Fleet 结论 |
|---|---|---|
| browser-harness | 薄 CDP、LLM 直接操作真实 Chrome、自修复 helper、任务过程可补工具 | 可作为后续 optional lab/sidecar；主线先把这些能力自研进 craft `browser_tool`：失败分类、recovery plan、CDP fallback、replay 证据 |
| OpenClaw | managed browser profile、loopback Gateway、profile routing、browser/canvas/nodes/cron/sessions 产品组合 | 只黑盒学 profile/gateway/安全提示；Fleet 自己实现 `manual` / `session` / `external-review` profile，仍走 craft permission/timeline |
| CloakBrowser | stealth Chromium、fingerprint patch、anti-detect、automation framework drop-in | 不进入默认产品；不作为插件市场推荐；不用于绕过 bot detection、验证码、登录限制、配额或平台风控 |

对 Craft/Fleet 当前做法的判断：

- craft 已有 BrowserPane、Electron CDP、`browser_tool`、截图/区域截图、accessibility snapshot、点击/填写/选择/滚动/evaluate、network/console/downloads，以及 session 所有权和可回放事件。
- 所以短期不要接入第二套 browser platform。真正缺的是人类层、设计选择层、失败恢复层和 external-review profile/权限层。
- 如果未来接 browser-harness，也应是“可关闭的 optional sidecar”，并把所有 helper、外发、文件写入、浏览器控制写回 Fleet timeline；不能让外部 harness 在 Craft 之外静默执行。
- 如果未来接 OpenClaw，也应只接 managed profile/gateway 概念，不迁入其 agent/session 平台。
- CloakBrowser 类 stealth 能力和 D4 合法账号/profile 策略冲突，只能留在风险说明里。

## 8 · 2026-06-22 创作引擎候选补充

- **openpencil**：MIT、Electron/React 同栈，重点研究结构化设计文档、选择、历史、MCP/ACP 与 Agent 工具；是无限画布/设计面重点候选，但未绿灯前不复制。
- **open-pencil**：MIT、Vue/Yjs 路线，生成速度和协作体验有参考价值；技术栈不同，更适合行为与格式兼容研究。
- **OpenCut**：rewrite 仓库不是当前成熟剪辑器，不能只看它判断功能；视频时间线应同时审计 **opencut-classic**。
- **opencut-classic**：MIT，现有 timeline/store/组件更完整，是视频剪辑页重点候选；仍需用户绿灯。
- **Penpot**：MPL-2.0、Clojure 异栈，只学成熟设计模型、变更、组件和协作；MPL 不是“可随意整套照搬”。
- **OpenMontage / Palmier Pro**：AGPL/GPL，只黑盒学习 Agent 视频生产管线、manifest、成本、轨道与任务交互。

最新 commit、许可证和克隆完整性以 `docs/14` 为准。
