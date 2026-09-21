# Fleet 本地文档 / Local docs

人和 Agent 共用这份目录（`~/.craft-agent/docs/`）。运行时**不会**访问 Craft 官方网站。

This folder is the offline library for both people and agents. Craft cloud URLs are not used at runtime.

## 给日常使用 Agent 时读的功能说明 / Feature guides (read these in-session)

These files sit next to this index (also copied from the running app):

| File | 内容 |
|---|---|
| `sources.md` | 数据源 / Sources |
| `skills.md` | 技能 / Skills |
| `permissions.md` | 权限 / Permissions |
| `pages.md` | Pages（Craft v0.13.3 迷你应用，不是无限画布） |
| `automations.md` | 自动化 |
| `browser-tools.md` | 内置浏览器工具 |
| `labels.md` · `statuses.md` · `themes.md` | 标签、状态、主题 |
| `craft-cli.md` | CLI |
| `mermaid.md` · `data-tables.md` · `html-preview.md` · `pdf-preview.md` · `image-preview.md` · `markdown-preview.md` | 对话里的富输出 |
| `llm-tool.md` | LLM 工具 |

## 官方文档本地副本 / Official product docs (offline)

`guide/` 来自 Craft 公开文档镜像（2026-07 同步）和 OSS 仓库 v0.13.3。带 Fleet 页眉：云分享、官方更新等能力已关闭。

- `guide/getting-started/` 入门
- `guide/core-concepts/` 会话、权限、项目、工作目录
- `guide/go-further/` 看板、任务、工作区、文档工具、富输出（`sharing.md` 仅作对照，Fleet 不用 Craft 云分享）
- `guide/sources/` · `guide/skills/` · `guide/automations/` · `guide/labels/` · `guide/messaging/`
- `guide/reference/` 配置、CLI、凭证、LLM 连接、远程服务器
- `guide/server/` 无头 / CLI 服务（对应设置里的「远程连接」）
- `guide/contributing.md` OSS 二次开发 / 贡献指南
- `guide/electron-agents.md` Electron 资源里的 Agent 说明
- `guide/security.md` · `guide/code-of-conduct.md`

Agent：需要说明某个功能时，先读本目录对应文件，不要打开 `thecraftagents.com` 或 `agents.craft.do`。
