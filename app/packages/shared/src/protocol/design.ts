/**
 * Fleet 工作台对象 / 动作信封契约（承重墙 · 单一真相）
 * =====================================================================
 *
 * 这是工作台脊柱上的动作信封，不是所有工作面的内部文档模型。它定义的规则是：
 * **人点鼠标和 AI 调工具都要产出可审计的同类动作记录**，走同一条 permission →
 * surface-native patch/ref → `SessionEvent` → timeline → rollback/handoff。
 * 没有"人类 UI 一套暗状态、AI 工具另一套暗状态"。
 *
 * 为什么放在 `@craft-agent/shared/protocol`：服务端引擎（server-core）和渲染端
 * UI（electron renderer）都从这里 import 同一套 envelope 类型——这就是"人机共用一个
 * 工作台"在工程上的落点。具体内容怎么变更，由各工作面的原生引擎负责：
 * design=openpencil/open-design 文档模型，browser=CDP/DOM，timeline=视频时间线，
 * document/code=文件/块模型。spine 只管身份、权限、账本、事件和回放索引。
 *
 * 多场景一条脊柱：对象类型并集一次定义齐（覆盖软件开发 / 内容创作 / AIGC /
 * 文档 / 知识等），并且是**可扩展注册表**（末尾的 `(string & {})` 逃生位）——
 * 新场景=注册对象/动作信封 + 原生 surface adapter，不另起第二套 session/permission/timeline。
 * 详见 docs/01、docs/30、docs/31。
 *
 * 落地分期：类型 M0 全定义；编辑器按各工作面原生引擎分期接。本文件只是信封契约，
 * 不含任何内容编辑实现。
 */

// ---------------------------------------------------------------------------
// Actor —— 谁发起的动作（人 or 某个 Agent）。人和 Agent 是对等的 actor。
// ---------------------------------------------------------------------------

export type ActorKind = 'user' | 'agent'

/** Agent 职责。管理 Agent（manager）管软件；其余是项目 Agent。可扩展。 */
export type AgentRole =
  | 'manager'
  | 'leader'
  | 'code'
  | 'design'
  | 'review'
  | 'test'
  | 'context'
  | (string & {})

export interface ActorRef {
  kind: ActorKind
  /** kind==='agent' 时的稳定身份（管理 Agent / 某个项目 Agent）。人类省略。 */
  agentId?: string
  /** 产出该动作的 runtime：'api' 或某个 CLI runtimeId。 */
  runtime?: string
  role?: AgentRole
  displayName?: string
}

/** 人类 actor 的规范值。 */
export const USER_ACTOR: ActorRef = { kind: 'user' }

export const isUserActor = (a: ActorRef): boolean => a.kind === 'user'
export const isAgentActor = (a: ActorRef): boolean => a.kind === 'agent'

// ---------------------------------------------------------------------------
// WorkbenchObject —— 选区指向的对象。类型并集覆盖多场景，且可扩展。
// ---------------------------------------------------------------------------

/**
 * 工作台对象类型 —— 初始并集（M0 定义齐）+ 注册表扩展位。
 * 软件/网页/文档 · 内容创作(视频/动画) · AIGC(分镜/字幕) · 知识/素材。
 */
export type WorkbenchObjectType =
  | 'code_symbol'
  | 'design_node'
  | 'doc_block'
  | 'media_asset'
  | 'clip'
  | 'track'
  | 'keyframe'
  | 'board_cell'
  | 'shot'
  | 'caption'
  | 'audio_track'
  | 'knowledge_card'
  | 'library_item'
  | (string & {})

/** 对象所在的 Stage 面 —— 与 renderer 的 StageMode 对齐，可扩展。 */
export type WorkbenchSurface =
  | 'browser'
  | 'artifact'
  | 'code'
  | 'document'
  | 'timeline'
  | 'board'
  | (string & {})

export interface WorkbenchObjectRef {
  type: WorkbenchObjectType
  surface: WorkbenchSurface
  /**
   * surface 专属定位锚，对主干不透明（spine 不解释其内容，只透传）：
   * DOM selector+box / 文件+符号范围 / clipId+时间区间 / 分镜格 id 等。
   */
  locator: Record<string, unknown>
  /** 轻量预览，给 Inspector / Ticker 用，不作为真相。 */
  preview?: { screenshot?: string; text?: string }
}

// ---------------------------------------------------------------------------
// DesignSelection —— 一套选区模型。多选/框选/跨面都进同一个集合，不分多套。
// ---------------------------------------------------------------------------

export interface DesignSelection {
  selectionId: string
  sessionId: string
  /** 选中的对象集合（可跨对象类型）。 */
  objects: WorkbenchObjectRef[]
  createdBy: ActorRef
  label?: string
  createdAt?: number
}

// ---------------------------------------------------------------------------
// DesignAction —— 动作信封。一种审计总线，多种 op；人和 AI 产出同类记录。
// ---------------------------------------------------------------------------

/**
 * 动作 op 联合 —— 改样式 / 调速 / 重排分镜 / 合成 / 改函数 / 编辑文档 / 注释
 * 都可以进入同一种 action envelope。末尾 `kind: string` 是注册表扩展位：
 * 新场景注册新 op，不改既有。
 *
 * 注（docs/30/31 修正）：带 `payload: unknown` 的 op（timeline_op / board_op /
 * doc_edit / code_patch / set_mask）对 spine **不透明**——spine 只登记/过权限/发事件/
 * 记回放，真正算 forward/inverse + 应用 + 回滚是各面**原生引擎适配器**（`DesignPatchApplier`）的事。
 */
export type DesignActionOp =
  | { kind: 'set_style'; props: Record<string, string | number> }
  | { kind: 'set_layout'; reorder?: string[]; align?: string; gap?: number }
  | { kind: 'set_transform'; x?: number; y?: number; w?: number; h?: number; rotate?: number; radius?: number; opacity?: number }
  | { kind: 'insert_asset'; assetId: string; at?: Record<string, unknown> }
  | { kind: 'set_mask'; mask: unknown }
  | { kind: 'timeline_op'; op: 'trim' | 'speed' | 'reorder' | 'split' | 'caption'; payload: unknown }
  | { kind: 'board_op'; op: 'reorder' | 'regenerate_cell'; payload: unknown }
  | { kind: 'doc_edit'; op: 'replace' | 'insert' | 'annotate'; payload: unknown }
  | { kind: 'code_patch'; payload: unknown }
  | { kind: 'annotate'; messageId: string; annotationId?: string; text: string }
  | { kind: string; payload?: unknown }

/** 动作来源：人打字/点鼠标 vs Agent 调工具。一体两面，进同一条管线。 */
export type DesignActionOrigin = 'human_ui' | 'agent_tool'

export interface DesignAction {
  actionId: string
  sessionId: string
  /** 作用的选区。 */
  selectionId: string
  /** 谁发起的（人 or 某 Agent）。 */
  actor: ActorRef
  op: DesignActionOp
  origin: DesignActionOrigin
  createdAt?: number
}

// ---------------------------------------------------------------------------
// DesignPatch —— 原生工作面返回给脊柱的可审计结果/引用。不是万能内容格式。
// ---------------------------------------------------------------------------

export type DesignPatchStatus = 'preview' | 'pending' | 'committed' | 'rolled_back'

export interface DesignPatch {
  patchId: string
  actionId: string
  sessionId: string
  /** 正向变更或原生 patch/ref（surface 专属，对主干不透明）。 */
  forward: unknown
  /** 反向变更或回滚 ref（surface 专属）。可逆性由原生引擎保证并被 spine 记录。 */
  inverse: unknown
  status: DesignPatchStatus
  committedAt?: number
}
