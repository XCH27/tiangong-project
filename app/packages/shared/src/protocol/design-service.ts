/**
 * Fleet 工作台动作引擎接口（承重墙 · 冻结的服务契约）
 * =====================================================================
 *
 * 这是"引擎层"的唯一目标接口。任何动作引擎实现都必须实现 `DesignEngine`，不允许
 * 各起一套。人类 UI 和 AI 工具产出的 `DesignAction` 都走 `proposeAction` —— 这是
 * "没有第二条写入路径"在工程上的强制点。
 *
 * 规则（实现必须满足）：
 * 1. `proposeAction` → 生成 `DesignPatch`（status: 'preview' 或 'pending'）。
 * 2. 写入前走 craft permission；不绕 permission。人(origin:'human_ui')默认预授权，
 *    Agent(origin:'agent_tool') 的写动作默认 'pending'，授权后才 commit。
 * 3. `commitPatch` 落库并置 'committed'，**必须保留 `inverse`** 供回滚。
 * 4. 每一步都发一个 `SessionEvent`（带 `actor`），进同一条 timeline；**不另起第二套 store/timeline**。
 * 5. 人和 AI 的 action 走**同一个** `proposeAction`。
 *
 * 边界（docs/30/31）：本契约**不依赖治理簇**（decision/memory）。分级自动决策若启用，
 * 由上层把 `decision` 上下文传进来作为"记录依据"，但它不替代、不绕过 permission 闸门。
 *
 * RPC 名见 `channels.ts` 的 `RPC_CHANNELS.design`。类型见 `design.ts`。
 */

import type { ActorRef, DesignSelection, DesignAction, DesignPatch } from './design'

export type DesignPermissionLevel = 'L0' | 'L1' | 'L2' | 'L3'

export interface DesignActionPermission {
  /** 是否需要在 commit 前获得授权（agent 写动作 = true）。 */
  required: boolean
  level: DesignPermissionLevel
  reason: string
  actor: ActorRef
  /** 高敏动作（L3）需要用户明确确认，不能被预授权代答。 */
  requiresExplicitConfirm?: boolean
  /** 可选记录依据（引用哪条规则/记忆/偏好）。仅作 audit，不作为闸门真相。 */
  ruleRef?: string
  timestamp?: number
}

export interface DesignActionDecisionContext {
  /** 上层（如自动决策）声明已预授权；不适用于 L3。 */
  hasPreAuth?: boolean
  /** 自动决策引用的记忆提示，仅记录依据。 */
  memoryHints?: Array<{ partition: string; id?: string; key?: string }>
  /** 标记本动作必须用户明确确认（L3）。 */
  requiresExplicitConfirm?: boolean
}

export interface SetSelectionInput {
  sessionId: string
  selection: DesignSelection
}

export interface ProposeActionInput {
  sessionId: string
  action: DesignAction
  /** 可选自动决策上下文。不绕过 permission，只记录依据。 */
  decision?: DesignActionDecisionContext
}

export interface ProposeActionResult {
  /** 预览补丁：status 'preview'（人/已授权）或 'pending'（agent 待授权）。 */
  patch: DesignPatch
  /** 若动作触发权限请求，这里带回 requestId（与 craft permission_request 对齐）。 */
  permissionRequestId?: string
  /** 本动作的权限判定。v1 只做后端闸门；UI permission 卡片后续接入。 */
  permission?: DesignActionPermission
}

export interface CommitPatchInput {
  sessionId: string
  patchId: string
  /** 临时授权标记：后续由 craft permission_request result 替代，不作为第二套权限系统。 */
  permissionGranted?: boolean
  permissionRequestId?: string
}

export interface CommitPatchResult {
  /** 落库后的补丁：status 'committed'，含 inverse。 */
  patch: DesignPatch
}

export interface RollbackPatchInput {
  sessionId: string
  patchId: string
}

export interface RollbackPatchResult {
  /** 回滚后的补丁：status 'rolled_back'。 */
  patch: DesignPatch
}

/**
 * 动作引擎服务接口。server-core 实现唯一一个；渲染端经 `RPC_CHANNELS.design` 调用同一套。
 */
export interface DesignEngine {
  setSelection(input: SetSelectionInput): Promise<void>
  getSelection(sessionId: string): Promise<DesignSelection | null>
  proposeAction(input: ProposeActionInput): Promise<ProposeActionResult>
  commitPatch(input: CommitPatchInput): Promise<CommitPatchResult>
  rollbackPatch(input: RollbackPatchInput): Promise<RollbackPatchResult>
}
