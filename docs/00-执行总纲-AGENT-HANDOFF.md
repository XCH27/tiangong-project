# 00 · 当前执行总纲（Craft Base Handoff）

> 当前状态：Fleet 已切换为 **直接基于 craft-agents-oss 二次开发**。旧自研 M0 Electron/Pi 工程已经删除，不再作为执行基线。

## 1 · 当前目标

把 craft-agents-oss 改造成 Fleet：一个面向新手的桌面 Agent 控制台，主体验像 Codex/Claude Desktop/OpenCode 那样低摩擦，但补齐：

- Agent 编排 / 群聊 / @ 提及
- Skill 管理与运行注入
- MCP/source 管理
- Git / worktree / diff / PR
- 浏览器预览和网页点评
- Agentic terminal
- Agent 自主操作软件
- 中文默认体验和低配置启动

> **当前首攻（D3）= 终端 / 本机 CLI Runtime Host**，先做 P0-B CLI 探测，见 `docs/Fleet-功能缺口与技术路线.md` §4.1/§5/§7。浏览器 + 选元素/标注/截图顺延到下一阶段，方案见 `docs/06-浏览器与网页标注方案.md`。完整决策（Fusion 设置项 D5、分级记忆 D2、合法账号切换 D4、手动编辑 D1）见 `docs/04-产品决策记录.md`，**冲突以它为准**。

## 2 · 当前基座

| 项 | 当前值 |
|---|---|
| 主工程 | `app/` |
| 来源 | `源码参考/craft-agents-oss` |
| 许可证 | Apache-2.0 |
| 补充来源 | `源码参考/AionUi`，Apache-2.0 |
| 命令入口 | `./scripts/craft.sh ...` |

## 3 · 执行铁律

1. **不重建壳。** 直接修改 craft 的现有 Electron/React/server-core/session-tools 结构。
2. **只复制绿灯源码。** 直接复制源码只允许来自 craft-agents-oss 和 AionUi。
3. **红灯/黄灯只黑盒参考。** Kun、Cherry Studio、Zed、LobeHub、Warp、OpenCode、cmux、golutra、multica、hermes-agent 等未逐项核准前不能复制源码。
4. **先查 craft 模块。** 改窗口看 `app/apps/electron/src/main/*`；改 UI 看 `app/apps/electron/src/renderer/*`；改工具/session 看 `app/packages/*`。
5. **用户逐步指导。** 不做无指令的大规模重构；每次按用户指定模块推进。
6. **缺口以审计文档为准。** 功能缺口和优先级见 `docs/Fleet-Craft-功能缺口审计.md`。
7. **当前阶段不改 craft UI。** 先做文档、底层协议、server-core/service 能力；第一屏和视觉重排进入用户确认后的 P2。
8. **重要模块先审查后执行。** 先产出可审查方案，再让多智能体按架构、产品、许可证/来源、测试风险纠正，确认后才拆并行任务。
9. **AionUi 不迁第二套 session。** 只能把 ACP/Team/Skill 能力适配进 craft `SessionManager`、`SessionEvent`、permission 和 RPC。
10. **本机能力默认 local-only。** CLI Runtime、PTY、本机文件、BrowserView 等必须先标注 RPC locality，远端 workspace 行为单独定义。

## 4 · 当前已验证

已通过：

```bash
./scripts/craft.sh run typecheck:all
./scripts/craft.sh run electron:build
./scripts/craft.sh run test:shared:all
```

本环境没有全局 Bun；使用 `scripts/craft.sh` 通过 `npm exec --yes bun -- ...` 运行。

## 5 · 阅读顺序

1. `AGENTS.md`（铁律 + 产品决策）
2. `docs/04-产品决策记录.md`（**用户已拍板，单一真相**）
3. `docs/README.md`（文档索引）
4. `docs/10-当前项目接手梳理.md`（当前真实状态、运行坑、未提交改动、下一步拆分）
5. `docs/craft-base-prep.md`（基座准备）
6. `docs/Fleet-Craft-功能缺口审计.md` + `docs/Fleet-功能缺口与技术路线.md`（当前 D3：终端 / CLI Runtime Host，P0-B 探测先行）
7. `docs/06-浏览器与网页标注方案.md`（下一阶段：内置浏览器 + 网页标注）
8. `docs/Fleet-多智能体审查与并行执行协议.md`（协作协议）
9. `docs/源码参考使用规则与索引.md`（来源规则）
10. 具体要改的 craft 模块源码

旧自研 M0 路线、OmniVerse 旧产品线、`superpowers/plans/*` 等已移入 `docs/_archive/`，仅历史背景，**不作为实现指令**。
