# Fleet 文档索引

> 基座：`app/` = craft-agents-oss 副本（Apache-2.0，补充来源 AionUi）。
> **冲突时以 `docs/04-产品决策记录.md` 为唯一真相。** 历史文档已移入 `docs/_archive/`，勿作执行源。

## 先读（入口与规则）

| 文档 | 用途 |
|---|---|
| `AGENTS.md` | 执行铁律 + 当前产品决策 |
| `docs/00-执行总纲-AGENT-HANDOFF.md` | 当前方向、命令入口、首攻目标 |
| `docs/04-产品决策记录.md` | **用户已拍板决策（单一真相）** |
| `docs/craft-base-prep.md` | 基座准备记录（复制/修复/验证） |

## 当前要做（规格）

| 文档 | 用途 |
|---|---|
| `docs/Fleet-功能缺口与技术路线.md` | **首攻 D3**：终端 / 本机 CLI Runtime Host，P0-B CLI 探测先行 |
| `docs/06-浏览器与网页标注方案.md` | 下一阶段：内置浏览器 + 选元素 / 标注 / 截图 |
| `docs/05-记忆系统方案.md` | D2：分级记忆 |
| `docs/03-Fusion多模型融合方案.md` | D5：多模型融合（设置项，默认关） |
| `docs/Fleet-Craft-功能缺口审计.md` | craft 已有 vs 还缺 |
| `docs/Fleet-多智能体审查与并行执行协议.md` | 先审查后并行的协作协议 |
| `docs/07-难点清单与更新韧性.md` | 难点/防跑偏登记 + 少更新的适配层架构 |
| `docs/08-本地化显示层与输入建议.md` | 汉化显示层(插件/CLI/Skill 说明) + 输入记忆建议/快捷用语 |
| `docs/09-底层完成度与待加UI清单.md` | **底层做没做好 + 待加哪些 UI 入口（接线表，给 UI agent）** |
| `docs/10-当前项目接手梳理.md` | **当前真实状态、运行坑、未提交改动、下一步拆分（给接手 agent）** |
| `docs/AionUi-CLI-ACP-Skill-迁移要点.md` | AionUi 已读源码摘要 + CLI/ACP/Skill 迁移边界 |

## 来源与许可证

| 文档 | 用途 |
|---|---|
| `docs/源码参考使用规则与索引.md` | 哪些能拷源码、哪些只能黑盒 |
| `docs/源码迁移清单.md` | 迁移归因台账 |
| `docs/Fleet-开源项目融合路线.md` | craft 主 + AionUi 第二绿灯的来源策略 |

## craft 自带文档（实现参考）

`app/apps/electron/resources/docs/`：skills / sources / browser-tools / permissions / automations / statuses / themes；以及 `app/apps/electron/README.md`。

## 未来参考 / 归档（**勿作执行源**）

- `docs/上下文管理方案.md` — 记忆 / 上下文压缩的**未来参考**（当前以 craft 自带压缩为主）。
- `docs/_archive/` — 旧自研 M0 路线、OmniVerse 旧产品线、评估/评审等历史文档，仅背景，**不得覆盖当前 craft-first 基线**。

## 命令

```bash
./scripts/craft.sh run typecheck:all
./scripts/craft.sh run electron:build
./scripts/craft.sh run test:shared:all
./scripts/craft.sh run electron:dev
```
