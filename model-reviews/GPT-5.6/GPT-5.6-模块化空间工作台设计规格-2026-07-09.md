# GPT-5.6 — 模块化空间工作台设计规格

> **设计状态：** 产品边界已按 Owner 的选择 3 收口；共享合同仍待 W0.1 冻结  
> **实现状态：** `not implemented` / Locked  
> **正典展开：** `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md`、ADR-0033、M07/M16/M17

## 1. 设计目标

一个人和多个 Agent 共用的无限空间：每个功能都是可发现、可调用、可连接、可审计的
模块能力；Agent 能根据目标创建可视工作流；同一产物能向网页、视频、动态演示、剪辑
等多个模块分流。

## 2. 选择的方案

**空间编排 + 原生编辑器。**

- M07 空间层只保存 EntityRef、位置、展示和视觉引用。
- M17 WorkflowDefinition 是执行图唯一事实源。
- M12 CapabilityManifest 是模块能力唯一描述源。
- M16 是 Panel/Surface/Inspector/Layout 唯一宿主。
- M05 ArtifactRef 保留精确版本、来源、父产物和敏感度。
- M08 执行生成/渲染/导出异步任务。
- M09/M18/M19 保留专业媒体、网页、演示文档模型。

## 3. 核心不变量

1. UI、Agent、Workflow 调用同一个 ActionDefinition 和 executor。
2. Workflow runtime 没有独立权限。
3. Canvas 线条默认不可执行，只有 M17 端口边可执行。
4. Canvas 卡片删除不删除底层产物。
5. 画布/面板不拥有 Job、Timeline、MediaProject、WebProject、MotionDeck。
6. 所有外部副作用按真实步骤审批，创建 Workflow 不等于授权。
7. 所有生成/渲染/消息必须幂等并可重启 reconcile。
8. ArtifactRef 传引用和版本，不传裸路径，不隐式复制内容。
9. Running WorkflowDefinition 不可就地修改；修复创建新版本。
10. 任何模块未达到 execution-ready 前不得创建实现 Packet。

## 4. 工作流 v1

- 有限 DAG；禁止任意循环和脚本节点。
- 支持 fan-out、兼容 fan-in、显式 predicate/gate。
- 节点固定 capability/operation/version/action。
- 边连接 typed ports；不兼容时必须插入已注册转换能力。
- 每个节点独立审批、重试、取消、Evidence 和 ArtifactRef 输出。
- Run 可为 queued/waiting approval/running/paused/succeeded/partially failed/failed/
  cancelling/reconciling。

## 5. 面板 v1

- 左：项目、文件、Library。
- 中：Chat/Canvas/Browser/Design/Media/Web/Deck 单一主 Surface。
- 右：上下文 Inspector、Timeline/Evidence、Jobs。
- 下：Terminal 和专业编辑器 Timeline。
- Agent 可临时 reveal/focus，但默认不能永久重排 Layout 或反复抢焦点。

## 6. 首个真实验收

1. Human 创建文字输入，Agent 发现真实生图能力并创建两节点 Workflow。
2. Human 修改 Prompt，M17 验证端口/预算/权限。
3. 外部上传/付费步骤进入 L2 审批。
4. M08 持久化 Job；M07/M16 展示真实状态。
5. M05 原子提交图片并生成 ArtifactRef。
6. 结果回到画布；移动/删除/Undo 只改变空间绑定。
7. App 在 provider 已提交后退出，重启 reconcile，不重复收费/生成。
8. 相同 Capability 分别从 UI、Agent、Workflow 调用，确认同 schema/executor。

## 7. 第二阶段验收

同一 Image ArtifactRef 版本并行进入：

- M18：生成并编辑真实网页文件，预览和 Build；
- M19：生成 MotionDeck，导出 HTML 和经过真实 Viewer 检查的 PPTX；
- M09：与视频、音频、字幕等组成 MediaProject 并真实 Render。

三个输出都必须返回 ArtifactRef 和完整 lineage，不允许只生成展示卡片。

## 8. 设计尚未批准为实现的部分

- M07 最终 React 空间引擎；xyflow 只是首选 Spike 候选。
- 专业设计模块使用哪个 OpenPencil，以及 Vue/React/CLI 适配方式。
- 物理持久化和产品内部 namespace。
- PPTX 支持子集、媒体渲染器和 codec 分发。
- 精确性能阈值和基准机。

这些项必须用证据 Gate 解决，不得让 Worker 自行选择。

