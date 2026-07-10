# GPT-5.6 — 整改变更索引

**日期：** 2026-07-09  
**说明：** 本索引只列文档整改，不表示产品实现完成。

## 新增正典/提案

- `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md`
- `docs/PERSISTENCE-AUTHORITY-MAP.md`
- `docs/DOCUMENT-READINESS.md`
- `docs/adr/0033-composable-workspace-boundary.md`
- `docs/contracts/composable-workspace-contracts.md`（未冻结）
- `docs/modules/16-workbench-panel-platform.md`
- `docs/modules/17-composable-workflows.md`
- `docs/modules/18-web-artifact-surface.md`
- `docs/modules/19-presentation-motion-surface.md`

## 主要重写

- M01：改为 Craft Agents v0.11 迁移/分类闭环。
- M03：统一 UI/Agent/Workflow Action Pipeline。
- M05：增加 ArtifactRef、Library schema、Lease/Undo/输出原子提交。
- M06：补选择锚点、证据包、外站/本地预览边界。
- M07：改为模块化 Spatial Canvas/Workflow Projection。
- M08：改为共享 ExternalJob + Generative Operations。
- M09：从单视频 Clip 升级为多素材 MediaProject/Track/Clip。
- M10：删除五层/七分区冲突，统一为七分区 × 四生命周期 × 敏感度。
- M11：拆 Usage Core 与 Routing/Cache/Batch，取消跨 Provider 固定假设。
- M12：把 Capability Core 前移，插件分发留 W4。
- M14：补首跑、空态、Template、Reset、失败路径。
- M15：补凭据、入站路由、出站审批、附件、去重和恢复。

## 控制面同步

- `PROJECT-DIRECTION.md`
- `DECISIONS-LEDGER.md`（新增/修订 D6、D18、D27、D35、D36、D39-D46）
- `WAVE-MODULE-MAP.md`
- `OWNERSHIP-MATRIX.md`
- `modules/README.md`
- `START-HERE.md` / `README.md`
- `DEVELOPMENT-PROCESS.md`
- `PARALLEL-AGENT-OPERATING-MODEL.md`
- `GLOSSARY.md`
- `REFERENCE-PROJECT-POLICY.md`
- W0.1 Packet / Board / Integration Plan / Upstream Baseline
- Action IDs / Protocol Stubs（仅增加重冻结说明，未伪造冻结版本）
- Human Feedback / Owner Voice / ADR-0032

## 保留并降级为非绑定

- 所有其他模型报告目录：已恢复并保留。
- `ARCHITECTURAL-COMPARISON.md`：增加未经一手资料核验警告。
- 历史 Packet/F Track：保留证据，但不授权实现。
- `legacy/`：继续作为历史语料，不能覆盖正典。

## 未做

- 未读/改产品代码。
- 未创建实现 Packet。
- 未冻结新 Action/Protocol 版本。
- 未选择或引入依赖。
- 未提交 Git Commit。

