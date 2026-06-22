# 源码参考目录

本目录只存第三方参考项目，不是 Fleet 主工程。当前按使用方式分两类：

| 目录 | 类型 | 用法 |
|---|---|---|
| `software/` | 软件型参考 | 完整应用、客户端、Agent 平台、编辑器、桌面软件。主要参考产品形态、交互、架构边界和端到端流程。 |
| `plugins/` | 插件/能力型参考 | 可被 Fleet 吸收成能力模块、sidecar、CLI、库、引擎或协议适配的项目。主要参考局部能力、接口、算法、工具链。 |

分类只解决“去哪看”的问题，不改变许可证红绿灯：

- 绿灯项目仍需按 `docs/26-源码参考使用规则与索引.md` 和 `docs/27-源码迁移清单.md` 记录迁移来源、commit、许可证和归因。
- 红灯/黄灯/候选项目即使放在 `plugins/`，也只能黑盒学习行为，不能复制源码、类型、测试、配置、样式或资源。
- 任何新克隆项目先放入对应分类，再更新 `docs/14-源码参考目录专项审计.md`。

当前分类：

## software

- `AionUi`
- `AstrBot`
- `CowAgent`
- `DeepSeek-Reasonix`
- `Kun`
- `OpenHands`
- `OpenMontage`
- `cc-switch`
- `cherry-studio`
- `cmux`
- `cockpit-tools`
- `craft-agents-oss`
- `golutra`
- `hermes-agent`
- `kdenlive`
- `lobehub`
- `multica`
- `open-pencil`
- `opencut`
- `opencut-classic`
- `openpencil`
- `palmier-pro`
- `penpot`
- `warp`
- `zed`

## plugins

- `codegraph`
- `context-mode`
- `deepcode-cli`
- `headroom`
- `hyperframes`
- `letta-code`
- `markitdown`
- `mem0`
- `mempalace`
- `open-design`
- `openui`
- `remotion`
- `repomix`
- `rtk`
- `supermemory`

`clone_repos.sh` 暂留在根目录；后续如果继续批量克隆，应让脚本按 `software/` 和 `plugins/` 自动落位。

## 完整性警告

- `software/opencode/` 当前为空且没有独立 `.git`，不算已克隆源码；从父仓库读到的 HEAD 不能作为它的版本。
- 新增参考必须同时核对：独立 Git remote/HEAD、工作区状态、LICENSE、关键源码目录和 README 所描述功能是否真实存在。
