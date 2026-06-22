# 00 · 当前执行总纲

> 状态日期：2026-06-22
> 当前分支：`work/fresh-base-spine`
> 口径：只把当前分支已经存在并可验证的代码算作完成。其它 worktree、旧分支和 Agent 汇报只算候选资产。

## 1 · 当前代码事实

当前 `app/` 是干净的 craft-agents-oss 二开基座。已经落在当前分支的 Fleet 主干能力包括：

- `DesignAction`、`DesignPatch`、`ActorRef` 等共享协议。
- `DesignEngine` 的基础服务接口与实现。
- 团队编排核心：team rules、TeamCoordinator、团队事件持久化、投递/运行分离、收件箱注入、Agent session 工具、会话列表顶部最小团队群聊入口。
- craft 原有的 session、permission、timeline、BrowserPane/CDP、文件工具和标注能力。

以下能力即使曾在其它工作树完成，也**尚未算当前分支完成**：CLI Runtime 产品化、完整管理 Agent 自动代理、分层记忆、全部文件/Library、无限画布、AIGC、网页/文档工作面、视频剪辑、上下文效率 UI、外部审查 UI。迁入前必须逐项核对 diff、许可证、测试和当前架构。

## 2 · 当前最高优先级

先补齐团队编排剩余前端与管理 Agent 自动代理，使后续多 Agent 能安全并行：

1. 把 `@` 改为人/Agent/会话/身份提及，把 Skill/命令/模板迁到 `/`，不保留旧 `@Skill` 双入口。
2. 会话列表继续升级为 Agent 名册：模型/Runtime 图标、身份标签、团队状态、待审队列详情。
3. 接常驻管理 Agent 的可运行代理能力，但所有写入、外发、删除和发布仍走 permission 与 L0-L3 决策。
4. 保持团队群聊复用 craft session，不建第二套消息库。

完成这条脊柱后，按 `docs/32` 分派“全部文件/Library、创作工作面、外部任务桥”等互不冲突的任务。

## 3 · 产品主线

Fleet 是人类与 AI 共用的工作创作台。默认工作台与四个专业工作面共享同一套：

- 项目与本地文件；
- Library 素材层；
- Agent、身份、记忆和权限；
- session timeline、成本账本和导出记录；
- 结构化工具入口。

四个专业工作面是无限画布、AIGC 生成、网页/文档、视频剪辑。它们使用各自适合的原生文档模型和编辑引擎，不用一个万能 DOM patch 统一实现；真正统一的是 session、permission、actor、事件、工具动词和资产交接。

## 4 · 必读顺序

1. `AGENTS.md`
2. `docs/04-产品决策记录.md`
3. `docs/01-产品主干与落地序列.md`
4. `docs/30-架构重审与最优落地判断.md`
5. `docs/33-T-TEAM-SPINE-团队编排脊柱协议.md`
6. `docs/32-并行开发状态看板与工作令.md`
7. 与任务对应的专题文档和 craft 源码

## 5 · 完成与验收规则

- 文档中的 `✅` 只能表示当前分支已有代码或正式决策，不能表示旧工作树完成。
- Agent 交付必须提供 worktree、branch、commit、实际 diff、测试和未完成边界。
- 合入后再把 `docs/32` 状态改为完成。
- 前端页面、按钮、输入语法或工具变化必须同步 `AGENTS.md`、相关 `docs`、bundled docs、session tools 和 MCP Agent 说明。
- 不创建过程快照；使用 Git 分支和提交作为恢复点。

## 6 · 基础验证

```bash
./scripts/craft.sh run typecheck:all
git diff --check
```

功能任务还必须运行对应的目标测试；涉及 Electron 原生窗口、BrowserPane、文件权限或真实 CLI 的功能必须补本机手工验收。
