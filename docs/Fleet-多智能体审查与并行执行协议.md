# Fleet 多智能体审查与并行执行协议

> 目的：让其它智能体先纠正方案，再在最终方案确认后并行执行，避免一个 Agent 想偏后连续犯错。

## 1 · 适用场景

以下任务必须先走多智能体审查：

- 修改 Agent 编排、Skill、MCP、CLI Runtime、Git、浏览器、终端等核心架构。
- 从 AionUi 迁移源码或模式。
- 可能影响 craft `SessionManager`、`SessionEvent`、permission、RPC routing 的改动。
- UI 第一屏、右侧面板、工作台信息架构等用户可见大改。

小修、小测试修复、文案整理可以不走完整流程，但仍要遵守 `AGENTS.md`。

## 2 · 审查流程

1. 主 Agent 先写可审查方案，说明目标、缺口、参考来源、实现方式、风险、验收。
2. 派出独立审查 Agent，不让它们改文件，只要求输出审查意见。
3. 至少覆盖这些视角：
   - 架构：是否符合 craft session/RPC/permission/remote routing。
   - 产品：是否满足用户想要的低摩擦、非配置中心、可观察工作流。
   - 许可证/来源：是否违反绿灯/黑盒边界。
   - 测试/验收：是否可验证，是否有失败回退。
4. 主 Agent 合并审查意见，明确采纳、拒绝或延后原因。
5. 用户确认最终方案后，再进入实现。

## 3 · 并行执行流程

用户确认后才拆分并行任务：

1. 主 Agent 把任务拆成互不冲突的写入范围。
2. 每个 Worker 只负责自己的文件/模块，不改其它人的范围。
3. Worker 必须知道工作区里可能有别人的改动，不得 revert 未归属改动。
4. Worker 完成后返回：
   - 修改文件列表
   - 实现摘要
   - 测试命令和结果
   - 未解决风险
5. 主 Agent 做集成审查，处理冲突，跑总体验证。

## 4 · 多 Agent 产品工作流

Fleet 产品内的多 Agent 工作流也按同一思想设计：

1. 用户提交任务。
2. Leader Agent 产出任务拆分：目标、子任务、候选 Agent、权限、文件范围、风险。
3. 用户确认后并行执行；高风险操作逐项确认。
4. 每个 Agent 有独立 runtime、scope、permission profile、workspace/worktree。
5. 所有 Agent 输出进入同一 session timeline，但必须带 `agentId`、runtime、role/displayName。
6. 权限请求按 Agent 分组展示，支持允许、拒绝、始终允许、停止该 Agent、停止全部。
7. Reviewer 或 Leader 汇总：测试结果、Git diff、浏览器证据、终端日志、冲突和风险。
8. 最终交付前进入确认门：用户看到变更、证据、风险、回滚方式，再决定提交、继续修改或放弃。

## 5 · 证据链要求

多 Agent 工作不能只给结论，必须能回放：

- Git：status、diff、commit/PR、worktree、回滚方式。
- 浏览器：URL、截图、DOM 摘要、console/network、操作步骤、前后对比。
- 终端：命令块、cwd、环境、stdout/stderr、exit code、耗时。
- 文件：变更文件、归属 Agent、修改原因。
- 权限：谁请求、请求什么、用户如何批准或拒绝。

## 6 · 禁止事项

- 禁止未审查就把多个 Agent 同时派去改同一批文件。
- 禁止把审查 Agent 当实现 Worker 使用。
- 禁止把黑盒参考项目的源码、测试、样式、资源交给 Worker 迁移。
- 禁止 Worker 为了合并方便 revert 其它改动。
- 禁止最终只汇报“已完成”，必须附验证结果和残余风险。
