# 给执行 Agent 的交接词（整段复制粘贴）

> 用法：把下面 `---` 之间的整段交给其它智能体。当前重点不是 `/`、`@` 菜单，而是 **CLI Runtime Host 按 AionUi 路线收口**。

---

你是 **Fleet** 项目的执行 agent。本仓库以 `app/`（craft-agents-oss 完整副本，Apache-2.0）为二次开发基座，目标是做中文桌面 Agent 工作台。

**先读这些，别跳：**
1. `AGENTS.md`
2. `docs/04-产品决策记录.md`
3. `docs/00-执行总纲-AGENT-HANDOFF.md`
4. `docs/10-当前项目接手梳理.md`
5. `docs/Fleet-功能缺口与技术路线.md`
6. `docs/09-底层完成度与待加UI清单.md`
7. `docs/源码参考使用规则与索引.md`
8. `docs/AionUi-CLI-ACP-Skill-迁移要点.md`
9. 需要动 CLI/ACP/Skill 细节时，再读 `源码参考/AionUi` 对应模块；cc-switch 只能黑盒参考。

**硬规则：**
- 直接改 `app/` 的 craft 结构，不重建壳。
- 只有 craft 和 AionUi 是绿灯源码；cc-switch、OpenCode、Hermes、Cherry、Kun 等未核准前只能黑盒参考，不能复制源码、类型、测试、样式、配置。
- 本机 CLI/PTY/BrowserView 等 RPC 默认 `LOCAL_ONLY`。
- 不得引入第二套 session/config。Runtime、Skill、权限、日志必须接 craft `SessionManager`、`SessionEvent`、permission、preferences/settings。
- 启动 CLI、写文件、运行命令、Git mutate、桌面软件控制必须进 craft permission + session timeline + 证据链。
- CLI 自动检测不放 onboarding 首页；完整状态在独立 `CLI / 终端` 设置页，聊天区只放紧凑状态入口。

**当前已做：**
- P0-B CLI Runtime 探测 local-only RPC。
- 固定探测 claude、codex、qwen、opencode、cursor、Antigravity 的 `agy`、hermes、openclaw、Grok Build 的 `grok`；并按 AionUi catalog 补齐 Aion CLI、Goose、CodeBuddy、Kimi、Factory Droid、Augment Code、GitHub Copilot、Qoder、Mistral Vibe、Nanobot、Snow；Gemini CLI 已从内置探测列表删除。
- 入口存在但版本命令超时/失败时，仍显示为可用 runtime，并把 `timeout/version_failed` 作为健康状态；不要再把 Hermes/Grok 这类 CLI 误判为未安装。
- 应用启动自动探测并缓存；独立 CLI/终端设置页显示完整状态；聊天输入区是紧凑 popover；onboarding 首页不展示 CLI。
- `/` 命令和 `@` Skill 中文说明已有本地化引擎与菜单接线基础。

**你现在优先做：P0-C Runtime Catalog / P0-D Runtime Adapter 方案与实现。**

AionUi 是第一参考：
- custom agent：`command + args + env + native_skills_dirs + behavior_policy + description`
- 健康测试：区分 CLI 可执行、ACP 可用、配置错误
- 进程生命周期：注册、health check、SIGTERM -> SIGKILL、Windows taskkill、崩溃诊断
- ACP/Team/Skill：接入 craft session/timeline，不迁第二套会话系统

cc-switch 只参考产品模型：
- Skill SSOT
- symlink/copy fallback
- per-app enable
- Claude/Codex/OpenCode/OpenClaw/Hermes/Grok 的资源目录经验

**交付时给：**
- 改动文件
- 是否直接迁移 AionUi 源码；若有，补 `docs/源码迁移清单.md`
- 测试命令和结果
- 未解决风险

---
