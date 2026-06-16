# AGENTS.md

本项目现在以 `app/` 下的 **craft-agents-oss 完整项目副本** 作为二次开发基座。旧 Fleet M0 自研工程已删除。

## 当前产品决策（用户已拍板，单一真相见 `docs/04-产品决策记录.md`）

- **D1 手动修改**：agent-native 为主 + 关键项加"手动编辑"逃生舱；手动编辑写进 craft 现有 `config`/`preferences`/settings，**不另起第二套真相**。
- **D2 记忆**：全本地**分级记忆**，可查可删（见 `docs/05-记忆系统方案.md`）。
- **D3 首攻**：第一个落地功能 = **终端 / 本机 CLI Runtime Host**，先做 **P0-B CLI 探测**（见 `docs/Fleet-功能缺口与技术路线.md`）。内置浏览器 + 选元素/标注/截图顺延为下一阶段（方案仍见 `docs/06-浏览器与网页标注方案.md`）。
- **D4 账号**：仅做**合法多账号 Profile 干净切换、不丢记录**；**不做**绕用量限制/规避检测的自动轮换。
- **D5 融合**：多模型融合做成**设置项**，**默认关**（见 `docs/03-Fusion多模型融合方案.md`）。
- **待用户拍板**：① 分叉策略（建议软分叉）；② 评测 + 可观测（建议尽早纳入为贯穿工作流）。

与以上决策冲突的旧文档已移入 `docs/_archive/`，**不得**作为执行依据。

## 当前硬规则

1. **直接基于 craft-agents-oss 改。** `app/` 就是主工程，不再重建 Electron/Vite/IPC/renderer 壳；优先理解并修改 craft 现有结构。
2. **AionUi 作为第二绿灯来源。** 需要 CLI Runtime/custom agent、ACP、进程生命周期、群聊、多 Agent、@ 提及、Skill 会话注入、团队交互时，优先从 `源码参考/AionUi` 迁移 Apache-2.0 代码或模式。
3. **只允许直接复制绿灯源码。** 目前可直接迁移源码的项目只包括：
   - `源码参考/craft-agents-oss`（Apache-2.0，主基座）
   - `源码参考/AionUi`（Apache-2.0，补 CLI Runtime/ACP/custom agent/Agent/会话/Skill 交互）
4. **红灯/黄灯项目只能黑盒参考。** Kun、Cherry Studio、Zed、LobeHub、Warp、OpenCode、cmux、golutra、multica、hermes-agent 等在未逐项核准许可证前，不允许复制源码进 `app/`。
5. **保留许可证和 NOTICE。** 迁移 craft/AionUi 源码时必须保留原文件版权、Apache-2.0 标识；craft 的 `NOTICE` 必须随产品保留。
6. **用户逐步指导修改。** 当前阶段不要自行大规模重构 craft；先保持 craft 原项目能跑，再按用户下一步指令改名、裁剪、接 AionUi、接 Fleet 能力。
7. **每次动手前先看 craft 对应模块。** 例如桌面窗口看 `app/apps/electron/src/main/*`，renderer 看 `app/apps/electron/src/renderer/*`，工具/session 看 `app/packages/*`。
8. **当前阶段不改 craft UI。** 除非用户明确要求 UI 重排，否则先在 craft 现有结构上增加底层能力、协议、服务和文档，不改界面布局、视觉风格和第一屏。
9. **先方案审查，再并行执行。** 重要模块动工前先写可审查方案；需要时用多智能体按架构、产品、许可证/来源、测试风险等视角纠正，用户确认最终方案后再拆分并行任务。
10. **不得引入第二套会话系统。** AionUi 的 ACP、Team、Skill 能力只能适配进 craft 的 `SessionManager`、`SessionEvent`、permission、RPC 和现有 renderer event flow，不迁入第二套 conversation/session store。
11. **本机能力必须标注 RPC locality。** CLI Runtime、PTY、本机文件、BrowserView 等本机 OS 能力默认 `LOCAL_ONLY`；新增 RPC 必须先归类到 local-only 或 remote-eligible，远端 workspace 行为必须单独定义。
12. **多 Agent 必须带身份元数据。** Agent 编排相关事件、权限请求、工具调用、日志和持久化都要能追踪 `agentId`、runtime、role/displayName，避免并发输出混成单 Agent 流。
13. **CLI/终端/Git/桌面操作必须走权限和回放。** 探测可以无 UI 执行；启动 CLI、写文件、运行命令、Git mutate、桌面软件控制必须接 craft permission、session timeline、停止/回滚/证据链。
14. **MIT/Apache 不自动等于绿灯。** 未写入绿灯表的项目，即使本地 LICENSE 看起来宽松，也只能黑盒参考，不能复制源码、测试、类型定义、配置、样式、资源或结构性实现。

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
