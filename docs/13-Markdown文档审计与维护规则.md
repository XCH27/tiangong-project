# 13 · Markdown 文档审计与维护规则

> 状态日期：2026-06-20
> 用途：说明全仓库 Markdown 的范围、可信层级和维护规则，避免后续智能体把第三方文档、node_modules 文档误当成当前执行依据。

## 1 · 本轮盘点结果

命令范围只看当前自有文档：`find docs -type f -name '*.md'`

| 范围 | 数量 | 处理规则 |
|---|---:|---|
| `docs/` active 文档 | 29 | Fleet 当前自有文档，本轮重点维护范围 |
| `app/` 下非 node_modules 文档 | 201 | craft 基座自带文档，只作实现参考，不覆盖 Fleet 决策 |
| `源码参考/` 文档 | 6820 | 第三方原文，按红绿灯规则参考；未核准项目不能复制源码或结构 |

## 2 · 命名与排序规则

- `docs/README.md` 是索引，保持无编号。
- 其它当前有效文档统一使用 `NN-标题.md`，`NN` 为两位数字，从 `00` 连续递增。
- 文件名编号、正文一级标题编号必须一致，例如 `18-统一界面信息架构与人机协作总设计.md` 对应 `# 18 · ...`。
- 新增当前有效文档时，必须放到合适顺序并更新 `docs/README.md`；不要新增无编号散文档。
- 专题文档如果被合并或移除，应同步更新所有引用；不要留下断裂编号。

当前编号区间：

- `00-09`：入口、产品定义、基础方案和基座准备。
- `10-15`：缺口审计、开源参考、文档治理、设计工作流。
- `16-19`：上下文效率、Agent 协作、目标态 UI、新基座迁移边界。
- `20-22`：Fleet 路线、开源融合、AionUi 迁移。
- `23-25`：CLI Runtime 执行清单。
- `26-27`：源码参考规则与迁移归因。

## 3 · 可信层级

1. **最高优先级**：`AGENTS.md`（铁律）、`docs/04-产品决策记录.md`（决策真相 · 做什么）、`docs/01-产品主干与落地序列.md`（路线真相 · 怎么排序/做什么/不做）、`docs/02-统一创作台与交互模型.md`（产品定义真相 · 是什么/怎么交互）、`docs/18`（目标态 UI 真相）。
2. **接手入口**：`docs/00-执行总纲-AGENT-HANDOFF.md`、`docs/19-重启二开与可复用资产清单.md`、`docs/17-Agent协作与管理Agent模型.md`（多 Agent/管理 Agent/自动决策）。
3. **当前执行清单**：`docs/23-CLI-Runtime-重做规格.md`、`docs/24-CLI-Runtime-验收清单.md`、`docs/25-CLI-Runtime-附件边界方案.md`、`docs/15-设计工作流一体化方案.md`、`docs/06-浏览器与网页标注方案.md`。
4. **来源与合规**：`docs/26-源码参考使用规则与索引.md`、`docs/27-源码归因清单.md`、`docs/11-新增开源项目调研分析.md`、`docs/12-最新开源Agent与CLI参考更新.md`。
5. **专题方案**：`docs/03-*` 到 `docs/08-*`、`docs/20-*` 到 `docs/22-*` 等。
6. **第三方原文**：`app/` craft 文档、`源码参考/`、`node_modules/`。

冲突时，按上方顺序判断。任何文档如果和 `AGENTS.md` / `04` / `00` / `19` 冲突，以这些入口为准。

## 4 · 每次文档更新必须做

- 不再创建或维护过程性快照文档；需要恢复点时使用 Git 分支/提交。
- **状态只在一处维护，专题文档引用而非复制**（2026-06-19 主干重构后的去重原则）：路线排序与里程碑的唯一真相是 `docs/01`，当前阶段/下一步的唯一真相是 `docs/00`。专题文档（设计工作流、上下文效率、Agent、记忆）只写自己域的展开 + 一句"挂在 `docs/01` 哪个 M 阶段"，不再各自复述整条路线和全局状态。改路线先改 `docs/01`，改当前状态先改 `docs/00`。
- 如果改变当前阶段、下一步、红绿灯、mapping 状态，必须同步：
  - `docs/00-执行总纲-AGENT-HANDOFF.md`（当前阶段/下一步唯一真相）
  - `docs/01-产品主干与落地序列.md`（路线/里程碑唯一真相）
  - `docs/19-重启二开与可复用资产清单.md`
  - `docs/README.md`
  - 相关专题文档（只引用，不复制全局路线）
- 如果新增开源项目参考，必须同步：
  - `docs/12-最新开源Agent与CLI参考更新.md`
  - `docs/26-源码参考使用规则与索引.md`
  - 必要时同步 `AGENTS.md`
- 如果迁移绿灯源码，必须同步 `docs/27-源码归因清单.md`。
- 只记录当前路线、迁移边界和可执行任务；不保留过程性任务记录。

## 5 · 不要做

- 不要批量改 `源码参考/` 的第三方 Markdown。
- 不要批量改 `node_modules/` 的依赖文档。
- 不要恢复过程性任务派发记录。
- 不要因为某项目是 MIT/Apache 就自动加入绿灯表。
- 不要只新增一份文档而不更新索引和接手入口。

## 6 · 当前下一步文档任务

当前文档已经统一到：

- 当前主线是**干净 craft 基座二开**。下一步先重新克隆干净 craft-agents-oss，确认 install、typecheck、electron dev，再按 `docs/19` 从现有 `app/` 提取已验证资产。
- 第一批必须迁移的是 CLI Runtime / ACP：service、测试、shared DTO/channel/routing、RPC、settings/input 入口，按小步验证迁移。
- 设计工作流重做为 `WorkbenchShell` + BrowserPane docked Stage + `DesignAction -> DesignPatch -> SessionEvent`。
- 新 UI 从 `WorkbenchShell` 开始：Conversation / Stage / Inspector / Context，共用 session timeline、permission、tool、patch、rollback，不做孤岛页面。
- 上下文效率与外部 AI 审查统一成一个中心：Usage/Context Report、ProjectPack、格式转换、代码图谱、上下文压缩、外部多平台审查、成本/隐私提示都进同一套账本和权限流。
- 文档审计必须检查 agent-native 可共同编辑原则：人类 UI 与 AI 工具调用是否落到同一套 session timeline、permission、patch、diff、rollback；若文档只写“手动编辑器/画布 UI”而未写 AI 工具入口，应视为口径缺失。
- 文档审计必须检查资产边界：本机/网络/导入字体、AI 文字特效、色板/渐变、SVG/Lottie/视频模板、动画库都要记录来源和许可证。
- 文档审计必须检查 token/cost 口径：真实 provider usage、估算 token、压缩 before/after、外部网站节省和未知成本要分开写；外部 AI 网站审查必须写用户授权、secret scan、权限确认、原始输出留档和不绕过平台限制。
- 文档审计必须检查浏览器自动化边界：Craft/Fleet 主栈是 BrowserPane/CDP/`browser_tool`/permission/timeline；browser-harness 只能学自修复和 CDP fallback，OpenClaw 只能学 managed profile/gateway，CloakBrowser 类 stealth/anti-detect 来源不能写成默认插件或绕过平台检测能力。

下一次文档更新应只在实际推进功能后追加结果，不再重复“审查审查结果”。
