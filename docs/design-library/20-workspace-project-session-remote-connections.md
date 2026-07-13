# Project = Workspace 与远程项目连接设计增量

> **当前设计素材（2026-07-11，2026-07-12 校正状态）**。本文件基于 Craft Agents v0.11.1
> 真实源码、Codex 的项目侧栏组织方式和业主明确的 Project=Workspace 决策形成。只有“一层工作
> 边界、复用 Workspace 后端权威”是已决定方向；本文的具体侧栏、列表/看板合并、迁移和远程连接
> 页面均未在当前 HEAD 实现，也不是整包改造授权。实施时一次提取一个纵向切片，并以当前 Craft
> 组件、现有五个 Board/菜单小提交和当次业主要求重新核对。

## 1. 业主决定

业主原话：

- 「Workspace和全部项目做整和」
- 「项目就是工作区的意思」
- 「Workspace其实就是项目，但是多做了很多没必要的设计」
- 「我在UI上的很多设计都会选择在原版Craft Agents的基础上做简化或者做优化，而不是凭空增加。」

**固定结论：用户层只保留一个概念——项目。Project 就是 Workspace。**

代码里的 Workspace 继续作为磁盘、配置、会话隔离和远程 RPC 路由边界，但 UI、文案和用户操作
不再把它呈现为比 Project 更高的一层。Craft 的嵌套 Project 是需要折叠的上游冗余，不再作为
Fleet 的长期产品实体。

## 2. 为什么合并

Craft 当前层级是：

```text
Workspace
├── Sources / Skills / Labels / Statuses / Automations
├── Sessions
└── Projects
    └── Project
        ├── workingDirectory
        ├── details
        ├── assets
        ├── MEMORY.md
        └── bound Sessions
```

对 Fleet 用户而言，这两层都在描述同一件事：一个代码仓库、产品、客户工作或长期任务的完整工作
环境。双层结构带来的成本已经出现在真实代码中：

- 顶部 Workspace 选择器和侧栏 Projects 同时承担“切换工作上下文”；
- 同一 Project 在侧栏点击时跳到会话筛选，在“所有项目”列表点击时却打开详情；
- Session 同时保存 `workspace` 与可选 `projectId`；
- Project 会话没有正式后端查询，只能在 Renderer 再筛一次；
- Project 继承 Workspace 的 Sources / Skills，但用户仍要理解两个配置范围；
- 远程 Workspace 又被包装成一个本地 Workspace，使层级更加难解释。

合并后，一项工作只有一个根：

```text
Project（后台实现仍叫 Workspace）
├── Sessions
├── Sources / Skills
├── Labels / Statuses / Automations
├── working directory
├── assets
├── MEMORY.md
└── settings
```

## 3. Codex 设计中采用的部分

Codex 的价值不在视觉照抄，而在信息架构：

- “项目”是左侧栏一级分组，不是全局 Workspace 下的二级管理页；
- 项目分组只显示项目文件夹，不在这里重复显示会话；
- 当前项目清晰高亮；
- 点击项目后，统一在“所有项目”的列表/看板内容区查看该项目工作；
- 新建工作默认发生在当前项目；
- 工作目录是项目本身的重要属性，不需要再包一层 Workspace。

Fleet 保留自己的状态、标签、看板、Sources、Skills 和自动化能力，但这些全部属于当前项目。

### 3.1 其他本地参考项目给出的同一结论

- Craft 自己的 CLI 文档已经把项目目录直接当 Workspace：
  `craft-cli run --workspace-dir ./my-project ...`；Workspace 根下已经存放 sessions、sources、
  skills、statuses 和 automations。嵌套 Project 是后加的一层，不是运行主干的必需条件。
- AionUI 的 Workspace 模块把一个 `workspace` 路径直接作为会话文件树和文件操作根，没有再要求
  用户先进入全局环境、再创建二级 Project。
- Hermes 的项目上下文同样围绕工作目录、AGENTS/MEMORY 等上下文文件组织，而不是让同一工作
  目录同时隶属于两个用户可见容器。

这些参考共同支持一层模型：**项目文件夹本身就是 Agent 的权限、文件和上下文边界。** Fleet
复用 Craft 已经稳定的 Workspace 实现来承载它，而不是保留 Craft 的双层 UI。

## 4. 最终界面结构

### 4.1 删除的结构

- 删除顶部 `My Workspace` 下拉选择器；
- 删除独立“所有会话”和独立“看板”两个重复入口；
- 合并为一个“所有项目”工作入口，列表/看板只是同一数据的两种视图；
- 不再显示“Workspace 项目”这种双层文案；
- 不再让用户先添加 Workspace、再进入其中创建 Project。

### 4.2 项目侧栏

```text
新建会话

所有项目                         [列表 | 看板]
标签
数据源
技能
自动化

项目                                      +
  天工
  Omniverse Vision_Codex

设置
```

行为：

- 点击项目行：切换后台 active Workspace，并在“所有项目”的列表视图打开该项目全部会话；
- 项目行不展开会话；会话只出现在统一工作内容区，避免同一会话同时出现在两个导航位置；
- `+`：创建项目，底层调用 Workspace 创建/打开文件夹能力；
- 项目菜单：重命名、设置、在新窗口打开、移除；
- 远程项目与本地项目使用同一列表；连接存在时才显示“本地项目 / 远程项目”分组。

### 4.3 所有项目

“所有项目”工作入口展示**当前项目的全部会话/任务**，不跨服务器假装聚合。切换项目后，状态计数、标签、看板、
归档和搜索全部随项目切换。

页面头部保留列表/看板切换；看板头部保留项目选择器。项目选择器切换 active Workspace，而不是
在 Renderer 中混合多个互不相干的 Session store。

跨项目找会话使用全局搜索；不把“所有会话”变成同时连接多个本地/远程服务器的聚合数据库。

### 4.4 项目主页

点击当前项目名称进入项目主页。主页不再是 Craft 的 `All Projects → Project detail` 三栏路径，
而是当前项目的一张直接页面：

- 概览：项目名称、描述、工作目录、最近会话；
- 资源：项目 assets 和可引用文件；
- 记忆：项目 `MEMORY.md`（可查看，写入仍遵循记忆治理）；
- 设置：名称、描述、颜色、详细说明、工作目录、移除项目。

日常切换和打开会话不要求经过项目主页。

## 5. 后端唯一权威与权限事实

合并不意味着新建 `ProjectStore`。保留 Craft Workspace 作为唯一项目权威：

| 用户概念 | 后台权威 |
|---|---|
| Project | Workspace config + rootPath |
| Project sessions | `SessionManager.getSessions(workspaceId)` |
| Project sources / skills | 当前 Workspace 的 sources / skills |
| Project labels / statuses / automations | 当前 Workspace 配置 |
| Project files | Workspace root / configured working directory |
| Project assets | Workspace 级 assets 目录 |
| Project memory | Workspace 级 `MEMORY.md` |
| Current Project | active Workspace / window Workspace mapping |

Craft `packages/shared/src/projects/` 在迁移完成后不再是活动产品权威。看板和任务继续绑定 Session，
Project 筛选等价于 Workspace 范围，不再依赖 `session.projectId`。

真实代码已经证明，权限不需要从 Project “搬运”一套新引擎：

- Workspace 根已有 `permissions.json`，由 `agent/permissions-config.ts` 加载并参与工具权限计算；
- WorkspaceConfig 已有默认 `permissionMode`、可循环权限模式和 `workingDirectory`；
- Sources 还有 Workspace 下的独立权限覆盖；
- Craft Project 本身没有独立的 permission store 或 permission evaluator。

因此“把项目文件夹权限提高到 My Workspace 层级”的正确实现是：**让用户选择的项目文件夹直接
成为 Workspace 根，并继续使用现有 Workspace 权限链；不复制、不提升、也不新增第二套权限文件。**
需要提升的只是 Project 独有的上下文能力（说明、颜色、assets、MEMORY、看板列）。

## 6. 数据模型调整

WorkspaceConfig 已经拥有 `defaults.workingDirectory`、模型、权限、Sources 和主题默认值，不重复
定义这些字段。只吸收当前 ProjectConfig 真正独有且仍有价值的字段：

```ts
interface WorkspaceProjectMetadata {
  description?: string
  details?: string
  color?: string
  archivedAt?: number
  kanbanColumns?: KanbanColumnDef[]
}
```

这些字段直接并入现有 Workspace config，不创建独立 JSON 数据库。`colorTheme` 继续复用
`WorkspaceConfig.defaults.colorTheme`，项目文件夹就是 Workspace `rootPath`，默认工作目录继续复用
`WorkspaceConfig.defaults.workingDirectory`。

Session 的项目归属由 `session.workspace.id` 唯一确定：

- 新 Session 不再需要 `CreateSessionOptions.projectId`；
- `Session.projectId` 进入兼容读取期，迁移后停止写入；
- `setSessionProjectId` UI 和 RPC 入口删除；
- 移动会话到另一项目是显式的跨 Workspace 转移，不是改一个可选字段。

## 7. 现有数据迁移

迁移必须保留用户会话和文件：

### 7.1 Workspace 没有嵌套 Project

原 Workspace 原地成为 Project，无需移动 Session。

### 7.2 Workspace 只有一个嵌套 Project

- 将 Project 名称、描述、颜色、details、workingDirectory、kanbanColumns 合并到 Workspace 配置；
- 将 `assets/` 与 `MEMORY.md` 提升为 Workspace 级；
- 清除该 Workspace Session 上匹配的 `projectId`，会话仍留在原 Workspace；
- 校验迁移结果后归档旧 `projects/<slug>`，不得先删除。

### 7.3 Workspace 有多个嵌套 Project

不自动拆分、不静默复制 Sources / Skills，也不在主启动路径搬移 Session。首轮只做：

- 继续兼容读取这些旧 Project 和其绑定会话；
- 在迁移预览中列出每个旧 Project 的会话、assets、MEMORY 和工作目录；
- 用户逐个选择“提升为新项目”时，复用现有 Workspace 创建和 Session 导出/导入路径；
- 未选择的旧 Project 保持只读兼容，绝不删除。

这避免为了极少数旧多 Project 数据，把日常 Project = Workspace 路径重新复杂化。

## 8. 新建项目

`+ 项目` 只提供三个清晰选项：

1. **打开文件夹**：所选文件夹直接成为 Project/Workspace；
2. **新建项目**：创建受管理文件夹并成为 Project/Workspace；
3. **连接远程服务器**：跳转“设置 → 远程连接”。连接表单只有服务器地址和访问令牌两个必填参数。

## 9. 远程连接：设置中的双角色能力

远程连接不是日常导航目的地，因此不占主页侧栏。它只出现在“设置 → 远程连接”；项目 `+` 菜单的
“连接远程服务器”也跳到同一个设置入口，不复制第二套表单。

两台设备只分两个角色：

- **连接到另一台电脑（控制端）**：输入地址和令牌，选择远程项目；成功后远程项目进入普通项目列表；
- **允许其他电脑连接这台电脑（被连接端）**：显式开启监听、生成项目范围令牌、选择开机启动；
- 端口、TLS 证书属于高级网络设置，不与两参数连接表单混排。

控制端只有两个必填参数：

```text
服务器地址  wss://host.example.com:9100
连接令牌    fleet_v1_...
```

成功后服务器返回 Workspace 列表；由于 `Project = Workspace`，这些条目直接显示为“可添加的远程
项目”。单个项目可直接添加，多个项目由用户勾选，不要求手填 Remote Workspace ID。

远程项目加入左侧“项目”列表后，与本地项目具有相同的会话、看板、Sources、Skills 和设置入口；
请求由现有 RoutedClient 路由到拥有该项目的服务器。

### 9.1 Multica 源码审查

参考：Multica 官方
[`How Multica works`](https://multica.ai/docs/how-multica-works)、
[`Authentication and tokens`](https://multica.ai/docs/auth-tokens)、
[`Self-host quickstart`](https://multica.ai/docs/self-host-quickstart) 和
[`multica-ai/multica`](https://github.com/multica-ai/multica) 当前源码（2026-07-11 审查）。

Multica 不是两台桌面应用直接互控，而是三层：

```text
Web / Desktop 控制端
        ↕ HTTP + WebSocket
Multica Server（PostgreSQL、Workspace、任务队列、事件 Hub）
        ↕ HTTPS 轮询 + 心跳
Daemon（用户机器、实际启动 Agent CLI）
```

它的关键做法：

- Server 拥有 Workspace、任务和协作数据；Daemon 不拥有业务真值；
- Daemon 启动后注册 runtime，每 3 秒领取任务，每 15 秒发送心跳；
- WebSocket 以 Workspace 为 room 隔离事件；
- 用户 PAT 可访问用户范围，Daemon Token 固定绑定一个 Workspace，跨 Workspace 请求被拒绝；
- Token 在服务端按 hash 查找，可撤销、过期并清理缓存；
- 跨机器自托管要求 TLS 反向代理，官方栈默认只绑定 localhost。

两张参考界面背后的源码行为比界面本身更重要：

- `packages/views/settings/components/tokens-tab.tsx` 允许命名 Token、选择有效期、仅在创建时展示
  完整值、复制登录命令、查看前缀/创建时间/最后使用时间/过期时间并撤销；
- `packages/views/runtimes/components/connect-remote-dialog.tsx` 默认只展示安装与启动两条可复制命令，
  复杂的手动 Token 配置和诊断命令折叠在“无法打开浏览器？”之后；
- 添加电脑弹窗不是反复轮询页面状态，而是监听 `daemon:register` WebSocket 事件；新 runtime
  注册后自动进入成功态。

这些是值得采用的产品模式，但 Multica 当前通用 PAT 是用户级凭据；其源码虽已有 Workspace-scoped
`mdt_` Daemon Token、hash 存储与跨 Workspace 拒绝，测试注释也明确指出实际 daemon 流量仍主要
使用 `mul_` PAT，`mdt_` 的签发尚未完全接通。Fleet 不复制这个过渡状态，第一版远程访问授权就必须
真正限制到所选 Project/Workspace。

### 9.2 采用与拒绝

| Multica 设计 | Fleet 决定 | 原因 |
|---|---|---|
| Workspace 范围的 Daemon Token | **采用其作用域原则** | Fleet 的远程令牌必须限制到明确允许的 Project/Workspace |
| runtime 注册、心跳、last seen | **采用连接状态语义** | 页面需要真实在线、断线和最后连接时间 |
| WebSocket Workspace room | **复用现有实现** | Craft 已有 `ctx.workspaceId` 和 Workspace 定向 push |
| Token hash、撤销、过期 | **采用** | 不能继续只用一个永久全服务器明文 Token |
| 中心 Server + PostgreSQL | **拒绝** | Fleet 已是本地优先，SessionManager 和文件存储是权威 |
| 独立长期 Daemon | **拒绝当前引入** | Electron/无头 Fleet 服务端已经能实际运行 Agent；再加 Daemon 会形成第二执行生命周期 |
| 每 3 秒任务轮询 | **拒绝** | Fleet 已有持续双向 RPC 和事件流，不需要轮询 |
| 邮箱登录、JWT Cookie、用户 PAT | **拒绝** | Fleet 不建立账号系统；两参数连接已经足够 |

### 9.3 必要性审查：现有 Craft 已经具备什么

Craft 现有代码已经覆盖远程执行的主体，不需要再建一个 Multica Daemon：

- Electron 主进程已经启动同一个 `server-core` WebSocket RPC 服务端；开启 embedded server mode
  时可监听 `0.0.0.0`、使用固定端口和 TLS；
- `server-core` 已有 headless bootstrap，发行脚本已经能生成 `craft-server` 和 systemd 服务；
- 控制端已有 URL + Token 连接探测、远端 Workspace 发现、远程 Workspace 映射和 `RoutedClient`；
- WS 服务端已经拥有握手、心跳、断线和重连生命周期；
- 远端同一 Fleet 实例直接拥有 SessionManager、Agent 后端、本机文件和权限，不需要再由一个轮询
  Daemon 领取任务。

现有“会话运行时防止屏幕关闭”只能部分复用，不能把它当作远程待机已经完成：

- `apps/electron/src/main/power-manager.ts` 仅在用户启用该设置且 `activeSessionCount > 0` 时启动
  `prevent-display-sleep`；空闲等待远程连接时不会生效；
- `prevent-display-sleep` 同时保持系统和屏幕常亮，适合用户原有选择；远程主机待机应使用独立的
  `prevent-app-suspension`，保持系统运行但允许屏幕关闭；
- macOS 关掉所有窗口后主进程仍在，但 Windows/Linux 当前会退出；开启远程访问后必须改为后台
  存活，并提供明确的“退出并停止远程访问”；
- VPS/headless 不调用 Electron 电源 API，由现有 systemd 服务负责进程重启；主机休眠、合盖、断电
  等系统策略不能虚假承诺由 Fleet 克服。

因此不增加 `Daemon` 导航、第二个后台可执行程序或第二套 runtime 注册表。只扩展现有 Electron
主进程/无头服务端生命周期：远程访问开启时后台运行、可选登录时启动，并为“会话运行”和“远程待机”
分别持有可组合的 power blocker。

### 9.4 Fleet 最终远程拓扑

```text
控制端 Fleet
  └── WSS 长连接（URL + Project-scoped Access Token）
        └── 远端 Fleet 实例
              ├── Workspace/Project 权威
              ├── SessionManager
              ├── Agent 后端
              └── 本机文件与权限
```

没有 Fleet 官方中心服务器，没有 PostgreSQL 控制面，也没有第二个 Daemon。远端安装的同一款 Fleet
软件同时承担 Multica 中 Server 与 Daemon 的职责，这是 Craft 现有嵌入式服务器最适合复用的方式。

### 9.5 两参数不变，但令牌升级为访问授权

服务端页面默认对“当前项目”生成一个访问令牌，也允许高级用户勾选多个项目。令牌记录：

```ts
interface RemoteAccessGrant {
  id: string
  tokenHash: string
  label: string
  workspaceIds: string[]
  createdAt: number
  expiresAt?: number
  lastUsedAt?: number
  revokedAt?: number
}
```

- 完整 Token 只在创建时显示一次；服务器只保存 hash；
- 控制端仍然只粘贴 URL + Token；
- 探测接口只返回 Token 允许访问的 Workspace/Project；
- Token 不能调用其他 Workspace 的 RPC，即使知道其 ID；
- 服务端页面可查看授权名称、允许的项目、最后使用时间并立即撤销；
- WebSocket ping/pong 与连接生命周期提供在线状态，不增加轮询 Daemon。

### 9.6 设置中的远程连接页

页面放在设置中，提供两个明确但不对称的角色，不使用 Server/Daemon 术语：

1. **连接另一台设备**：粘贴服务器地址和连接令牌，探测后选择允许访问的远程项目；
2. **允许其他设备连接这台设备**：选择可访问项目、有效期和授权名称，生成一次性展示的连接令牌，
   同时展示可复制的服务器地址。

“允许其他设备连接”区域还必须真实显示：服务是否运行、外部地址是否可达、已连接设备、最后连接时间、
授权前缀/范围/过期时间，并支持立即撤销。生成令牌后的完整值只出现一次，必须提供“复制令牌”和“复制
完整连接信息”，关闭前要求用户确认已经保存。

VPS/无头安装属于折叠的高级入口：参考 Multica 的添加电脑弹窗，只展示一条安装命令和一条带服务器
配置的启动命令；页面监听现有 WS 连接事件并自动进入“设备已上线”，不增加轮询。普通的两台桌面电脑
都已安装 Fleet 时，不要求运行任何命令。

## 10. 网络边界

Fleet 只负责使用 URL + 连接令牌连接一个可达服务：

- 安装在 VPS：直接使用 VPS 的 `wss://` 地址；
- 同一局域网：使用局域网地址；
- 家庭电脑跨公网：用户可自行使用端口映射、WireGuard/Tailscale 或 frp 得到可达 URL。

frp 不内置、不强制、不进入 Workspace/Project/Session 数据模型；对 Fleet 来说它只是 URL 的
来源之一。

## 11. 远程安全底线

- 公网地址默认要求 `wss://`；
- 删除当前远程连接的全局 `tlsRejectUnauthorized: false`；
- 自签名证书必须显式首次信任并固定指纹；
- Token 不写日志、不出现在错误和遥测中；
- 本地嵌入式服务器的内部 Token 与远程访问令牌分离；内部 Token 永不展示给远端用户；
- 远程访问令牌保存 hash、绑定允许的 Workspace、可过期和撤销；
- 后续可把同一个两参数流程升级为一次性设备交换凭据，不改变 UI；
- 连接失败不能创建半成品远程项目；
- 移除远程项目只删除本地映射，不删除远端数据。

## 12. 实施顺序

### Slice A — Project = Workspace

1. Workspace 配置吸收 Project 元数据；
2. 左侧 Projects 直接渲染 Workspaces；
3. 删除顶部 Workspace 选择器和旧的嵌套 Project 面板；
4. 项目分组只显示文件夹，Session 统一在“所有项目”的列表/看板中显示；
5. 状态、标签、看板跟随当前 Project/Workspace；
6. Project 页面改为 Workspace 项目主页；
7. 增加旧嵌套 Project 兼容读取与迁移预览。

### Slice B — Remote Projects

1. 在设置中增加“远程连接”页面，项目 `+` 仅跳转到该页；
2. 服务端区域复用嵌入式服务器，但分离内部 Token 与可撤销、Workspace-scoped 的远程授权；
3. 控制端只输入 URL + 连接令牌；
4. 发现接口只返回令牌允许的 Workspace，并直接添加为远程 Project；
5. 修复 TLS、跨 Workspace 拒绝、错误分类、移除和重连；
6. 增加远程授权的命名、有效期、一次性展示、前缀/最后使用时间和撤销；
7. 复用 Electron 主进程实现远程待机：屏幕可关闭、进程后台存活、可选登录时启动；
8. VPS 复用 headless + systemd，并用现有 WebSocket 生命周期显示真实在线状态，不增加 Multica
   式轮询 Daemon。

远程连接必须建立在 Slice A 的单层 Project 模型上，不能继续扩展旧的 Workspace + Project 双层 UI。

## 13. 验收标准

### `usable`

- UI 中 Project 与 Workspace 不再是两个实体；
- 顶部 `My Workspace` 和旧嵌套 Project 面板消失；
- 左侧项目列表来自真实 Workspaces；
- 项目分组不重复渲染会话，点击项目后统一工作区来自该 Workspace 的 SessionManager 查询；
- 列表/看板、标签和配置跟随当前项目；
- 旧单 Project Workspace 可以无损迁移；
- 设置中的远程连接只需 URL + 连接令牌即可发现并添加远程项目；
- 开启远程访问的桌面端空闲时允许屏幕关闭但保持服务可达，明确退出后立即停止；
- VPS 使用现有 headless 服务，不依赖 Electron 或另装 Daemon；
- 本地和远程项目共用同一侧栏与页面语义。

### `wired but not visually checked`

前后端、迁移和持久化已接通并通过针对性检查，但尚未由业主在真实 Electron 界面操作确认。
Agent 最终只负责启动软件并交给业主验证。
