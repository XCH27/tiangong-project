# Fleet 文档索引

> 当前：`app/` 已重置为干净 craft-agents-oss 主基座。旧二开代码不再作为实现来源；后续按 `docs/19` 重做少量确认有价值的能力。
> **决策"做什么"以 `docs/04-产品决策记录.md` 为唯一真相；路线"按什么顺序做"以 `docs/01-产品主干与落地序列.md` 为唯一真相。** 当前已进入“干净基座重启二开”阶段，迁移边界见 `docs/19-重启二开与可复用资产清单.md`。

## 先读（入口与规则）

| 文档 | 用途 |
|---|---|
| `AGENTS.md` | 执行铁律 + 当前产品决策（D1–D12） |
| `docs/04-产品决策记录.md` | **用户已拍板决策（单一真相 · 做什么）** |
| `docs/01-产品主干与落地序列.md` | **路线主干单一真相（怎么排序 · 做什么/不做/先后）**：一条主干收敛 D1–D13 + M0–M3 + 反堆按钮纪律 + OSS 精简表 |
| `docs/02-统一创作台与交互模型.md` | **产品定义单一真相（是什么 · 怎么交互）**：AI 工作创作台、三场景=同一工作台不同配置、共享基本件、统一输入路由、人类主导渐进自动化、收进软件 vs 接管桌面 |
| `docs/00-执行总纲-AGENT-HANDOFF.md` | **最短接手入口**：当前阶段、验证命令、M0 下一步 |
| `docs/19-重启二开与可复用资产清单.md` | **当前重做边界**：基于干净 craft-agents-oss，只重做少量确认有价值的能力，不迁旧 UI 形态 |
| `docs/09-craft-base-prep.md` | 基座准备记录（复制/修复/验证） |

## 当前要做（规格）

| 文档 | 用途 |
|---|---|
| `docs/20-Fleet-功能缺口与技术路线.md` | 产品路线总览；当前按干净基座重做 |
| `docs/12-最新开源Agent与CLI参考更新.md` | **最新开源 Agent/CLI 参考更新**：Gemini CLI、Qwen Code、Cline、Roo、OpenHands、ACP 等官方状态 |
| `docs/13-Markdown文档审计与维护规则.md` | **全仓库 Markdown 范围与维护规则**：哪些是执行源，哪些是历史/第三方只读 |
| `docs/14-源码参考目录专项审计.md` | **截图中 `源码参考/` 项目专项矩阵**：本地 commit、官方 license、红绿灯和 Fleet 可用边界 |
| `docs/15-设计工作流一体化方案.md` | **Open Design / Figma / Stitch / Typography / Motion 一体化方案**：浏览器标注页升级为设计选择、框选、多选、批量注释；补 `DesignAction` 共用动作契约；Artifact Studio 支持媒体/形状/蒙版/字体/颜色/动画/参数/资源库和 handoff。新实现按 `docs/19` 从干净基座落地。 |
| `docs/16-上下文效率与外部AI审查方案.md` | **上下文效率 / 审查中心（D9 · 一个中心不是七个散功能）**：打包→转换→代码图谱→压缩→用量可视化→外部多平台审查→成本/隐私，合成一条由管理 Agent 驱动的统一管线 |
| `docs/17-Agent协作与管理Agent模型.md` | **D11/D12 · Agent 协作单一真相**：常驻管理 Agent（管软件/记忆/权限/上下文/跨项目自动化）+ 项目 Agent（队长/代码/设计/审查/测试/上下文）身份分离；分级自动决策 L0–L3；多 Agent 进同一 timeline、带身份、不混流；迁 AionUi |
| `docs/18-统一界面信息架构与人机协作总设计.md` | **全愿景目标态 UI 单一真相**：一条共享时间线 + 五个常驻 Surface（Conversation/Stage/Inspector/Context/Action Ticker）+ 人机对等动作模型；浏览器 docked 为第一落点、Artifact Studio 为第二层；含全功能→Surface 映射、人/agent 共编模型、能力门禁、分阶段落地 |
| `docs/28-本地运行环境与系统工具方案.md` | **本机能力地图 / 系统工具层**：自动检测 node/python/bun/pnpm/uv/git/rg/CLI Agent/sidecar/浏览器 helper，诊断 PATH、多版本、项目 lockfile、venv 和工具冲突；给用户修环境，也给 Agent 提供可用能力目录 |
| `docs/29-开源项目参考取舍清单.md` | **开源项目参考取舍**：逐项说明每个参考项目只学哪一招、不要学什么、落到 Fleet 哪个主干能力，避免照搬其它产品路线 |
| `docs/23-CLI-Runtime-重做规格.md` | **CLI Runtime 重做规格**：custom ACP、detected mapping、health、settings、附件硬拒绝 |
| `docs/24-CLI-Runtime-验收清单.md` | CLI Runtime 重做完成后的默认验证、手工验收和 opt-in smoke |
| `docs/25-CLI-Runtime-附件边界方案.md` | 附件边界：第一版硬拒绝，P1 只考虑 capability-gated inline_text |
| `docs/06-浏览器与网页标注方案.md` | **浏览器与网页标注路线**：下一轮在干净基座上接 BrowserPane docked Stage、选择/框选/多选、批量注释、Comment AI 和证据包；不新建孤岛编辑页。 |
| `docs/05-记忆系统方案.md` | **D2：分层记忆**（七分区 + 四层时效 + 管理 Agent 拥有生命周期 + 与权限/timeline/上下文效率打通） |
| `docs/03-Fusion多模型融合方案.md` | D5：多模型融合（设置项，默认关） |
| `docs/10-Fleet-Craft-功能缺口审计.md` | craft 已有 vs 还缺 |
| `docs/07-难点清单与更新韧性.md` | 难点/防跑偏登记 + 少更新的适配层架构 |
| `docs/08-本地化显示层与输入建议.md` | 汉化显示层(插件/CLI/Skill 说明) + 输入记忆建议/快捷用语 |
| `docs/22-AionUi-CLI-ACP-Skill-迁移要点.md` | AionUi 已读源码摘要 + CLI/ACP/Skill 迁移边界 |

## 来源与许可证

| 文档 | 用途 |
|---|---|
| [docs/26-源码参考使用规则与索引.md](file:///Users/lullwen/Documents/GUI%20终端/docs/26-源码参考使用规则与索引.md) | 哪些能拷源码、哪些只能黑盒 |
| [docs/14-源码参考目录专项审计.md](file:///Users/lullwen/Documents/GUI%20终端/docs/14-源码参考目录专项审计.md) | `源码参考/` 每个项目的本地版本、官方状态和红绿灯边界 |
| [docs/11-新增开源项目调研分析.md](file:///Users/lullwen/Documents/GUI%20终端/docs/11-新增开源项目调研分析.md) | AstrBot/Reasonix/cockpit/deepcode 调研特色与合规要求 |
| [docs/27-源码归因清单.md](file:///Users/lullwen/Documents/GUI%20终端/docs/27-源码归因清单.md) | 迁移归因台账 |
| [docs/21-Fleet-开源项目融合路线.md](file:///Users/lullwen/Documents/GUI%20终端/docs/21-Fleet-开源项目融合路线.md) | craft 主 + AionUi 第二绿灯的来源策略 |
| [docs/29-开源项目参考取舍清单.md](file:///Users/lullwen/Documents/GUI%20终端/docs/29-开源项目参考取舍清单.md) | 每个参考项目的“可参考一招 / 不要学什么 / Fleet 落点” |
| [源码参考/README.md](file:///Users/lullwen/Documents/GUI%20终端/源码参考/README.md) | `源码参考/software/` 与 `源码参考/plugins/` 的目录分层说明 |

## craft 自带文档（实现参考）

`app/apps/electron/resources/docs/`：skills / sources / browser-tools / permissions / automations / statuses / themes；以及 `app/apps/electron/README.md`。

## Markdown 范围说明

- `docs/`：Fleet 当前自有文档，接手时优先看。
- `app/` 下 Markdown：craft 基座自带文档，作为实现参考，不覆盖 Fleet 产品决策。
- `源码参考/` 下 Markdown：第三方项目原文；目录按 `software/` 和 `plugins/` 分层，只能按 `docs/26-源码参考使用规则与索引.md` 的红绿灯使用。
- `node_modules/` 下 Markdown：依赖包文档，不纳入项目路线审计。

## 命令

```bash
./scripts/craft.sh run typecheck:all
./scripts/craft.sh run electron:build
./scripts/craft.sh run test:shared:all
./scripts/craft.sh run electron:dev
```
