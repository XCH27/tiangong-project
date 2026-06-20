/**
 * Fleet 工作台动作引擎接口（承重墙 · 冻结的服务契约）
 * =====================================================================
 *
 * 这是"引擎层"的唯一目标接口。任何 Agent 实现动作引擎（docs/32 工作令 T-ENGINE）
 * 都必须实现 `DesignEngine`，不允许各起一套。人类 UI 和 AI 工具产出的 `DesignAction`
 * 都走 `proposeAction` —— 这是"没有第二条写入路径"在工程上的强制点。
 *
 * 规则（实现必须满足）：
 * 1. `proposeAction` → 生成 `DesignPatch`（status: 'preview' 或 'pending'），**preview 不落库**。
 * 2. 写入前走 craft permission（L0–L3，docs/17）；不绕 permission。
 * 3. `commitPatch` 落库并置 'committed'，**必须保留 `inverse`** 供回滚。
 * 4. 每一步都发一个 `SessionEvent`（带 `actor`），进同一条 timeline；**不另起第二套 store/timeline**。
 * 5. 人（origin:'human_ui'）和 AI（origin:'agent_tool'）的 action 走**同一个** `proposeAction`。
 *
 * RPC 名见 `channels.ts` 的 `RPC_CHANNELS.design`。类型见 `design.ts`。
 */

import type { DesignSelection, DesignAction, DesignPatch } from './design'

export interface SetSelectionInput {
  sessionId: string
  selection: DesignSelection
}

export interface ProposeActionInput {
  sessionId: string
  action: DesignAction
}

export interface ProposeActionResult {
  /** 预览补丁：status 'preview'（未授权）或 'pending'（等待 commit）。 */
  patch: DesignPatch
  /** 若动作触发权限请求，这里带回 requestId（与 craft permission_request 对齐）。 */
  permissionRequestId?: string
}

export interface CommitPatchInput {
  sessionId: string
  patchId: string
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
