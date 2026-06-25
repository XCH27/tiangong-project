/**
 * Internal Action Registry 契约（承重墙 · 单一真相 · 代码即契约）
 * =====================================================================
 *
 * Fleet 不做“多 CLI Agent 管理器”。内部生产能力必须登记成结构化 action：
 * 人点鼠标和 Agent 调工具走**同一条 action id**，进 permission → SessionEvent →
 * timeline → undo。CLI/ACP/MCP/API 只是外部桥，不用来操作 Fleet 自己的 UI。
 *
 * 本文件是 `docs/40-Internal-Action-Registry-规格与样板闭环.md` 的代码落点：
 * 文档负责“为什么这样设计 + 样板闭环 + 验收”，本文件是**类型唯一真相**。
 * 两者冲突时以本文件为准（文档随之更新）。
 *
 * 与 `design.ts` 信封的关系：
 *   - 本文件 = 静态注册目录（一条 action 是什么：schema/权限/撤销/版本）。
 *   - `DesignAction`（design.ts）= 一次动态调用的信封。
 *   两者是同一动作的两面，不是两套结构。`ActionInvocation` 是调用的语义视图，
 *   运行时落到 `DesignAction.actionDefinitionId` + `contractVersion`。
 *   注意：`DesignAction.actionId` 已是一次调用/patch 关联 id，不能复用为注册表 id。
 *
 * 注意：与 renderer 的快捷键注册表 `renderer/actions/registry.tsx` 是**不同概念**，
 * 不要混用或合并。
 */

import type { ActorRef } from './design'
import type { WorkbenchSurface } from './design'

export type JsonSchema =
  | boolean
  | {
      type?: string | string[]
      title?: string
      description?: string
      properties?: Record<string, JsonSchema>
      required?: string[]
      items?: JsonSchema
      enum?: unknown[]
      additionalProperties?: boolean | JsonSchema
      [key: string]: unknown
    }

// ---------------------------------------------------------------------------
// ActionSurface —— 能力归属面。闭合词表（不开 `(string & {})` 任意字符串逃逸位）。
// 新增 surface 必须经 EXTENSION_SURFACES 受控注册，不能随便拼字符串，
// 否则“唯一 surface 词表 / 稳定过滤 / 权限矩阵 / Skill 校验”都做不实。
// ---------------------------------------------------------------------------

export type ActionSurface =
  // 脊柱 / 横切
  | 'session'
  | 'files'
  | 'library'
  | 'team'
  | 'manager'
  | 'skill'
  | 'settings'
  | 'external-job'
  // 四个专业工作面
  | 'canvas'
  | 'aigc'
  | 'web-doc'
  | 'video'
  // 代码
  | 'code'

/** 扩展 surface 的受控登记项（带 owner + 引入版本，校验后才生效）。 */
export interface SurfaceExtension {
  id: string
  owner: string
  addedInVersion: number
  description: string
}

/** 扩展 surface 注册表。新增面在这里登记，而不是写任意字符串。 */
export const EXTENSION_SURFACES: ReadonlyArray<SurfaceExtension> = []

/** `WorkbenchSurface`（design.ts 的 Stage 对象位置）→ `ActionSurface`（能力归属）映射。
 *  区分：前者是“被选中的视觉对象长在哪个 Stage 面”，后者是“action 属于哪类能力”。 */
export const WORKBENCH_SURFACE_TO_ACTION_SURFACE: Record<string, ActionSurface> = {
  browser: 'web-doc',
  document: 'web-doc',
  artifact: 'canvas',
  board: 'canvas',
  timeline: 'video',
  code: 'code',
}

// ---------------------------------------------------------------------------
// 基础枚举
// ---------------------------------------------------------------------------

/** 六动词：跨面统一形状（read=inspect / mutate=edit / undo / ...）。 */
export type ActionVerb = 'read' | 'select' | 'mutate' | 'intent' | 'undo' | 'explain'

/** 权限等级，语义对齐 D12 / AGENTS 26。**注册表是某 action 权限等级的唯一来源。** */
export type ActionPermissionLevel = 'L0' | 'L1' | 'L2' | 'L3'

/** RPC locality，对齐 AGENTS 规则 14：本机 OS 能力默认 LOCAL_ONLY。 */
export type ActionLocality = 'LOCAL_ONLY' | 'REMOTE_ELIGIBLE'

/** 回放策略，供 Recorder / Skill 用（docs/39）。 */
export type ActionReplayPolicy = 'semantic' | 'requiresHuman' | 'visualFallback'

/** 撤销句柄。写操作必须给出 type；none 必须写明原因。 */
export interface ActionUndoHandle {
  type: 'native-history' | 'inverse-patch' | 'snapshot' | 'none'
  /** type==='none' 时必填，说明为什么不可撤销。 */
  noneReason?: string
  schema?: unknown
}

/** 旧契约 payload → 新契约 payload 的迁移声明（“界面变、动作用迁移函数跟着变”）。 */
export interface ActionPayloadMigration {
  fromVersion: number
  toVersion: number
  /** 迁移函数引用（注册在 action-migrations 里），不在类型里内联实现。 */
  migrate: string
}

/** 上下文与 token 提示，服务“少即是多 / 低 token”（docs/38 §8）。 */
export interface ActionContextSummary {
  reads: string[]
  writes: string[]
  tokenHint: 'tiny' | 'small' | 'medium' | 'large'
}

// ---------------------------------------------------------------------------
// InternalActionDefinition —— 静态注册项（一条 action = 一条记录）。
// ---------------------------------------------------------------------------

export interface InternalActionDefinition {
  /** 全局唯一稳定 id，命名 `surface.verb[_qualifier]`，如 `files.move_entry`。 */
  id: string

  /** 契约版本（schema + 行为语义的版本）。变更必须升版本，旧版本走 payloadMigrations。 */
  contractVersion: number

  surface: ActionSurface
  verb: ActionVerb

  title: string
  description: string

  /** 入参/出参 schema。统一使用 JSON Schema 形状，便于直接暴露给 Agent。 */
  inputSchema: JsonSchema
  outputSchema?: JsonSchema

  /** **这是该 action 权限等级的唯一来源**，必须真实进入 permission 判定，不得只写文档。 */
  permissionLevel: ActionPermissionLevel

  /** 写操作发出的 SessionEvent type；只读 action 用统一的 `internal_action_invoked`。 */
  timelineEvent: string

  undoHandle: ActionUndoHandle

  /** 人类入口（精确到组件/挂点），证明“人能做一次”。 */
  humanEntryPoints: string[]
  /** Agent 是否可用同一 id 调用。 */
  agentCallable: boolean

  locality: ActionLocality
  replayPolicy: ActionReplayPolicy
  /** 哪些 input/output 字段在证据/录制里必须脱敏。 */
  redactionPolicy?: string[]

  /** 外部依赖声明。内部 action 原则上为空；非空表示内部会派发外部 Job/桥。 */
  requiredCapabilities?: Array<'mcp' | 'cli' | 'api' | 'browser' | 'external-job'>

  contextSummary: ActionContextSummary

  // —— 版本演进（界面变、动作不报废）——
  /** 本 action 取代了哪些旧 id。 */
  deprecates?: string[]
  /** 本 action 已被哪个新 id 取代（弃用时填）。 */
  replacedBy?: string
  /** 旧契约 payload 迁移到本契约的声明。 */
  payloadMigrations?: ActionPayloadMigration[]
}

// ---------------------------------------------------------------------------
// ActionTargetRef —— 注册表的通用目标引用（与 Stage 选区 WorkbenchObjectRef 区分）。
// 非视觉面（files/session/team/...）用本类型，不复用闭合 Stage 枚举。
// ---------------------------------------------------------------------------

export interface ActionTargetRef {
  surface: ActionSurface
  /** 该面下的对象种类：'file'|'dir'|'session'|'doc_block'|'design_node'|'clip'... */
  kind: string
  /** 对 spine 不透明的稳定定位锚（文件=path、文档=blockId、设计=nodeId...）。 */
  locator: Record<string, unknown>
  /** 目标版本/hash/mtime，用于前置条件与回放。 */
  revision?: string
  preview?: { text?: string; screenshot?: string }
}

// ---------------------------------------------------------------------------
// ActionInvocation —— 一次调用的信封（含契约版本 / 前置条件 / 幂等 / 失败策略）。
// ---------------------------------------------------------------------------

export interface ActionPrecondition {
  /** 期望的目标 revision；执行瞬间不一致则按 failurePolicy 处理。 */
  targetRevision?: string
  /** 人类可读断言描述（如 'toPath must not exist'）。 */
  assert: string
}

export interface ActionInvocation {
  /** 注册表里的稳定 action id，如 `files.move_entry`。 */
  actionDefinitionId: string
  /** 调用方按哪个契约版本发起；不匹配则走迁移或拒绝。 */
  contractVersion: number
  actor: ActorRef
  /** 按注册项 inputSchema 校验。 */
  input: unknown
  target?: ActionTargetRef
  /** 同 key 重试不重复执行。 */
  idempotencyKey?: string
  /** 目标仍处于预期状态才执行；否则按 failurePolicy。 */
  preconditions?: ActionPrecondition[]
  failurePolicy?: 'abort' | 'rollback' | 'ask-user'
}

// ---------------------------------------------------------------------------
// 运行时注册表接口（实现放 server-core/services/internal-action-registry.ts）。
// 这里只声明形状，便于 renderer / session-tools / server-core 共用同一契约。
// ---------------------------------------------------------------------------

export interface InternalActionRegistry {
  /** 登记一条 action（重复 id+version 视为冲突）。 */
  register(def: InternalActionDefinition): void
  /** 取某条 action（可指定契约版本；省略取最新）。 */
  get(id: string, contractVersion?: number): InternalActionDefinition | undefined
  /** 枚举（供 Agent 的 list_internal_actions 工具）。 */
  list(filter?: { surface?: ActionSurface; verb?: ActionVerb }): InternalActionDefinition[]
}

/** 只读摘要：list_internal_actions 返回给 Agent 的最小字段（低 token）。 */
export interface InternalActionSummary {
  id: string
  contractVersion: number
  surface: ActionSurface
  verb: ActionVerb
  title: string
  permissionLevel: ActionPermissionLevel
  inputSchema: JsonSchema
}
