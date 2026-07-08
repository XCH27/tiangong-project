# GUI 终端 / Fleet

当前主线是 **Fleet / AI 工作创作台**：从干净 craft-agents-oss 基座二开，并从现有 `app/` 提取已验证资产。

## 当前入口

- 执行铁律：`AGENTS.md`
- 项目方向与非目标：`docs/PROJECT-DIRECTION.md`
- 决策台账：`docs/DECISIONS-LEDGER.md`
- 工作面架构：`docs/PROJECT-DIRECTION.md`
- 设置与壳层目标态：`docs/modules/13-settings-shell-ux.md`
- 并行看板同步：`docs/BOARD-SYNC.md`
- 文档索引：`docs/README.md`
- 当前资产来源：`app/`
- 新主工程：干净 craft-agents-oss 基座

> 产品定位：**AI 工作创作台**——人类主导、AI 辅助，在一个软件里完成真实生产流程。默认工作台保留 Craft 原结构，无限画布、AIGC、网页/文档、视频剪辑使用适合各自的专业布局和原生引擎；它们共用工作区、本地素材/Library、Agent、记忆、permission、session timeline、成本账本和导出。
> 主线一句话：先收敛团队脊柱 → 全部文件/Library → 四个专业工作面逐个跑通；全部复用 Craft 的 session / permission / timeline，不重建默认界面壳。

## 当前重启路线

当前路线：

1. 保持当前 Craft 基座可安装、可 typecheck、可启动，不恢复旧二开 UI。
2. 先完成原标签身份扩展、团队状态/路由和管理 Agent 边界。
3. 再完成“全部文件 / Library”，建立四个专业工作面共享的本地素材底座。
4. 无限画布、AIGC、网页/文档、视频剪辑分别使用原生引擎跑通，人和 Agent 共用结构化工具。
5. 新界面只从 Craft 原挂点增量修改；只有专业工作面可以新建独立页面。

## Markdown 范围

全仓库有大量第三方 Markdown，不能都当成当前执行依据：

- 当前执行入口：`AGENTS.md`、`docs/START-HERE.md`、`docs/README.md`、`docs/PROJECT-DIRECTION.md`、`docs/DECISIONS-LEDGER.md`、`docs/BOARD-SYNC.md`。
- 当前自有文档：`docs/` 下的 active 文档。
- 第三方/参考：`app/` 的 craft 自带文档、`源码参考/`、`node_modules/` 只按索引说明阅读，不直接覆盖当前决策。

## 推荐命令

```bash
./scripts/craft.sh install
./scripts/craft.sh run typecheck:all
./scripts/craft.sh run electron:dev
```
