# GUI 终端 / Fleet

当前主线是 **Fleet / AI 工作创作台**：从干净 craft-agents-oss 基座二开，并从现有 `app/` 提取已验证资产。

## 当前入口

- 执行铁律：`AGENTS.md`
- 单一产品决策（做什么）：`docs/04-产品决策记录.md`
- 路线主干（怎么排序 · 做什么/不做/先后）：`docs/01-产品主干与落地序列.md`
- 产品定义与交互模型（是什么 · 怎么交互）：`docs/02-统一创作台与交互模型.md`
- 目标态界面：`docs/18-统一界面信息架构与人机协作总设计.md`
- 文档索引：`docs/README.md`
- 当前资产来源：`app/`
- 新主工程：干净 craft-agents-oss 基座

> 产品定位：**AI 工作创作台**——人类主导、AI 辅助，在一个软件里完成软件开发 / 内容创作 / AIGC 的真实生产流程。三场景不是三个 app，是同一工作台（项目/画布/时间线/属性面板/素材库/版本/导出/统一输入/Agent/记忆/权限/token 账本）的不同配置；把生产收进软件结构化操作，不接管外部桌面。
> 主线一句话：CLI 接入（已就绪）→ 动作引擎（在建）→ 浏览器/Artifact 两块画布 → 管理 Agent + 项目 Agent + 分层记忆 + 上下文效率/审查中心，全部跑在 craft 的同一条 session / permission / timeline 上。

## 当前重启路线

当前路线：

1. 重新克隆干净 craft-agents-oss，并确认原版能 install、typecheck、启动。
2. 从现有 `app/` 只迁移 `docs/19-重启二开与可复用资产清单.md` 列出的少量资产。
3. 第一批迁移 CLI Runtime / ACP，因为它有单测、typecheck 和 opt-in smoke 记录。
4. 设计工作流重做为 BrowserPane docked Stage + `DesignAction -> DesignPatch -> SessionEvent`。
5. 新界面从 `WorkbenchShell` 开始做 Conversation / Stage / Inspector / Context。

## Markdown 范围

全仓库有大量第三方 Markdown，不能都当成当前执行依据：

- 当前执行入口：`AGENTS.md`、`docs/README.md`、`docs/00-执行总纲-AGENT-HANDOFF.md`、`docs/19-重启二开与可复用资产清单.md`。
- 当前自有文档：`docs/` 下的 active 文档。
- 第三方/参考：`app/` 的 craft 自带文档、`源码参考/`、`node_modules/` 只按索引说明阅读，不直接覆盖当前决策。

## 推荐命令

```bash
./scripts/craft.sh install
./scripts/craft.sh run typecheck:all
./scripts/craft.sh run electron:dev
```
