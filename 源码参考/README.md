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
- `software/*` 与 `plugins/*` 是本机参考源码 checkout，按根 `.gitignore` 忽略；Fleet 仓库只跟踪本 README 与 `clone_repos.sh` / `update_repos.sh` 等索引脚本，不再把第三方目录作为 gitlink/submodule 跟踪。更新参考源码不得污染 Fleet 主仓 `git status`。

## 自动同步

- `reference-repos.tsv` 记录 Fleet 主仓当前跟踪的参考项目 gitlink、upstream URL 和同步 ref。
- `.github/workflows/sync-reference-repos.yml` 每周一运行，也可手动触发。它不会克隆参考源码，只用 `git ls-remote` 查询 upstream HEAD，并更新 Fleet 仓库里的 gitlink commit 指针。
- 自动同步只开 PR，不直接合入主线。合并前仍需按许可红绿灯和架构边界判断是否应该读取或使用更新后的参考源码。
- 本地预检查可运行 `DRY_RUN=1 bash scripts/sync-reference-gitlinks.sh`。

当前分类：

## software

- `AionUi`
- `agents-cli`
- `AstrBot`
- `CowAgent`
- `CoreCoder`
- `DeepSeek-Reasonix`
- `Kun`
- `OpenHands`
- `OpenMontage`
- `cc-switch`
- `cherry-studio`
- `cline`
- `cmux`
- `cockpit-tools`
- `craft-agents-oss`
- `golutra`
- `hermes-agent`
- `kdenlive`
- `lobehub`
- `multica`
- `nezha`
- `omnigent`
- `open-pencil`
- `opencut`
- `opencut-classic`
- `openpencil`
- `orca`
- `palmier-pro`
- `penpot`
- `tldraw`
- `warp`
- `zed`

## plugins

- `awesome-design-md`
- `codegraph`
- `context-mode`
- `Cowart`
- `deepcode-cli`
- `dockview`
- `doubao-ui-assets` (unzipped from Desktop, containing 700+ icons and dashboard ui kits)
- `headroom`
- `hyperframes`
- `letta-code`
- `markitdown`
- `mem0`
- `memanto`
- `mempalace`
- `moveable`
- `open-design`
- `openui`
- `react-moveable` (see `moveable`)
- `react-resizable-panels`
- `react-rnd`
- `react-timeline-editor`
- `remotion`
- `repomix`
- `rtk`
- `stitch-sdk`
- `stitch-skills`
- `supermemory`
- `tapnow-reverse-config` (unzipped from Desktop, containing reverse engineered Electron client codebase & contracts)
- `trae-ui-kits` (unzipped from Desktop, containing Trae dashboard and dev-explorer UI designs)
- `trae-work-kits` (unzipped from Desktop, containing settings, landing, pricing, and keyframe designs)
- `zvec`

## assets (静态资产)

- `assets/ui-screenshots/` (包含从用户上传的原始图片中归档的 UI 参考截图，涵盖 TapNow, Lovart, Stitch 及当前工作台原型)

`clone_repos.sh` 暂留在根目录；后续如果继续批量克隆，应让脚本按 `software/` 和 `plugins/` 自动落位。



## 完整性警告

- `software/opencode/` 当前为空且没有独立 `.git`，不算已克隆源码；从父仓库读到的 HEAD 不能作为它的版本。
- 新增参考必须同时核对：独立 Git remote/HEAD、工作区状态、LICENSE、关键源码目录和 README 所描述功能是否真实存在。
