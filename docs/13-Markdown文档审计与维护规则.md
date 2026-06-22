# 13 · Markdown 文档审计与维护规则

> 状态日期：2026-06-22

## 1 · 真相分工

| 内容 | 唯一维护位置 |
|---|---|
| 用户已拍板决策 | `AGENTS.md`、`docs/04` |
| 路线和优先级 | `docs/01` |
| 当前分支完成状态 | `docs/00`、`docs/32` |
| 架构裁决 | `docs/30` |
| 团队协议 | `docs/33` |
| 源码许可证与完整性 | `docs/14`、`docs/26`、`docs/27` |
| 导航 | `docs/README.md` |

专题文档只描述本领域方案并链接上述真相，不复制长状态表、不引用旧 worktree 成果冒充当前实现。

## 2 · 审计范围

- `docs/*.md`：Fleet 自有文档，全部纳入一致性检查。
- 根 `AGENTS.md`、README：纳入。
- `app/apps/electron/resources/docs/*.md`、session tools、MCP 文档：前端和 Agent 能力变更时纳入。
- `源码参考/**`：第三方原文只读，不统一改写；只审计目录、版本、许可证和 Fleet 使用边界。
- `node_modules/**`、构建产物、缓存：不纳入。

## 3 · 状态标注

- `✅ 已落当前分支`：代码存在，依赖接线存在，验证通过。
- `🟨 部分`：只有协议、服务、UI 或旧工作树候选之一。
- `⛔ 未实现`：只有需求或方案。
- `🧊 冻结收口`：不再扩功能，只修 bug 和接线。

“某 Agent 完成”“某 worktree 测试通过”不能直接写成当前完成；合入当前分支并复核后才能改状态。

## 4 · 修改纪律

1. 改产品方向：先改 `docs/04`，再同步 `AGENTS.md` 和 `docs/01`。
2. 改当前状态：只改 `docs/00`、`docs/32`，专题文档写链接。
3. 改页面、按钮、输入语法或 Agent 工具：按 `AGENTS.md` 规则 35 同步 bundled docs、tool schema/handlers 与 MCP 说明。
4. 新增源码参考：核独立 `.git`、remote、HEAD、LICENSE、关键源码完整性，再更新 `源码参考/README.md` 和 `docs/14`。
5. 删除功能后删除失效描述，不保留无用过程记录；重要架构取舍写入决策文档。

## 5 · 最低验证

```bash
git diff --check
rg -n "work/integration-prep|M3\+|@技能|@Skill" AGENTS.md docs --glob '*.md'
```

还需检查 Markdown 本地链接存在、编号/标题唯一、当前状态与实际代码一致。
