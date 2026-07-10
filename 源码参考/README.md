# 源码参考目录

本目录只存**本机**第三方参考 checkout，**不是** Fleet 主工程，且被根 `.gitignore` 忽略。  
权威策略：`docs/REFERENCE-PROJECT-POLICY.md`（绿灯 / 黑盒 / **已退役**）。

| 目录 | 用途 |
|---|---|
| `software/` | 完整应用/客户端/Agent 平台等 |
| `plugins/` | 可局部参考的库、CLI、能力模块 |

## 规则

1. **UI：** 以 Craft Agents 原版为基线做简化/优化（D52）；禁止把其它产品壳当 Fleet UI 蓝本（D50/D51）。  
2. **旧 Fleet UI：** 不参考；`fleet-old` 仅后端行为 + 迁移账本。  
3. **许可：** 绿灯才可在边界内改编；黑盒不可拷源码；退役项不要重新克隆。  
4. **更新：** 用 `clone_repos.sh` / `update_repos.sh`；勿把第三方树提交进 Fleet git。  
5. **新增参考：** 先写入 `REFERENCE-PROJECT-POLICY.md` 并说明模块挂钩，再克隆。

## 建议保留（与策略对齐）

### software（示例）

- `craft-agents-oss` — 主基线（请同步 **v0.11.0** 认知，见 UPSTREAM-BASELINE）  
- `AionUi` — CLI/ACP/runtime（绿灯）  
- `fleet-old` — 后端行为参考 only  
- `DeepSeek-Reasonix` — ACP/planner（绿灯）  
- `hermes-agent` / `orca` / `OpenHands` / `omnigent` — 黑盒/候选  
- `openpencil` / `open-pencil` / `tldraw` — 设计/画布行为（非 M07 宿主默认）  
- `opencut-classic`（及必要时 `opencut` 对照）— 视频时间线  
- `cline` — 模式/技能想法（黑盒）  
- `penpot` — FOSS 设计产品行为（黑盒）  
- `agents-cli` — CLI 形态  
- `lobehub`（lobe-chat checkout）— **仅黑盒借鉴「文稿/文档编辑」体验**；LobeHub Community License **禁止**把组件库/源码当绿灯拷进 Fleet；**禁止**当第二壳。详见 `docs/REFERENCE-PROJECT-POLICY.md`。

### plugins（示例）

- `codegraph` / `deepcode-cli` / `open-design` / `rtk` — 绿灯相关  
- `dockview` / `react-resizable-panels` / `react-rnd` / `react-timeline-editor` — 布局/时间线想法  
- `letta-code` / `mem0` / `supermemory` / `context-mode` / `markitdown` / `repomix` — 记忆/上下文想法  

## 已删除的无价值/负价值本机克隆（2026-07-10）

见策略文 **Retired** 表。已从本机移除例如：`nezha`、`kdenlive`、`warp`、`zed`、`cherry-studio`、`cc-switch`、`ego-lite`、以及一批无模块挂钩的竞品壳；plugins 侧移除 `remotion`、`openui`、`stitch-*`、`memanto`/`mempalace`、`headroom`、`zvec`、各类 UI kit 打包等。

**例外恢复：** `software/lobehub`（lobe-chat）— **仅黑盒借鉴文稿/文档编辑体验**；不可拷组件库/源码入 Fleet（LobeHub Community License）；不可当第二壳。

**不要**为 jaaz / basketikun infinite-canvas / hero8152 Infinite-Canvas 建正式参考克隆（策略文已写明）。
