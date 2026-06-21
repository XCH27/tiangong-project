/**
 * Fleet 工作台统一对象 / 动作契约（承重墙 · 单一真相）
 * =====================================================================
 *
 * 这是整个项目最重要的契约。它定义了一条规则：**人点鼠标和 AI 调工具，
 * 产出同一种 `DesignAction`，走同一条 permission → `DesignPatch` → `SessionEvent`
 * → timeline → rollback。** 没有"人类 UI 一套 state、AI 工具另一套"。
 *
 * 为什么放在 `@craft-agent/shared/protocol`：服务端引擎（server-core）和渲染端
 * UI（electron renderer）都从这里 import 同一套类型——这就是"人机共用一个工作台"
 * 在工程上的落点。任何可写编辑都必须能表达成这里的 `DesignAction`，否则不允许进主线。
 *
 * 多场景一套底座：对象类型并集一次定义齐（覆盖软件开发 / 内容创作 / AIGC / 文档 /
 * 知识 等），并且是**可扩展注册表**（末尾的 `(string & {})` 逃生位）——新场景=注册
 * 一种对象类型 + 一种 op，不另起第二套动作模型。详见 docs/01 §2、docs/31 §1。
 *
 * 落地分期：类型 M0 全定义；编辑器按 docs/31 S2→S7 分期接。本文件只是契约，不含实现。
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
// DesignAction —— 一套动作模型。一种总线，多种 op；人和 AI 产出同一种。
// ---------------------------------------------------------------------------

/**
 * 动作 op 联合 —— 改样式 / 调速 / 重排分镜 / 合成 / 改函数 / 编辑文档 / 注释
 * 都是这同一种 action 的不同 op，不是每个场景一套动作总线。末尾 `kind: string`
 * 是注册表扩展位：新场景注册新 op，不改既有。
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
// DesignPatch —— 动作落到对象图上的可回滚结果。不是临时 DOM mutation。
// ---------------------------------------------------------------------------

export type DesignPatchStatus = 'preview' | 'pending' | 'committed' | 'rolled_back'

export interface DesignPatch {
  patchId: string
  actionId: string
  sessionId: string
  /** 正向变更（surface 专属，对主干不透明）。 */
  forward: unknown
  /** 反向变更（回滚点）—— **必须有**，保证每个 committed patch 可逆。 */
  inverse: unknown
  status: DesignPatchStatus
  committedAt?: number
}
