/**
 * DesignEngineService —— Fleet 工作台动作引擎实现（T-ENGINE · 主线）
 *
 * 实现 `DesignEngine`（`@craft-agent/shared/protocol`）。这是"没有第二条写入路径"
 * 的强制点：人类 UI 和 AI 工具产出的 `DesignAction` 都走 `proposeAction`，经
 * propose → (permission) → commit/rollback 的状态机，每步发一个 `SessionEvent`
 * （带 actor）进同一条 timeline。
 *
 * 边界（诚实）：本引擎负责**事务 / 账本 / 状态机 / 事件**。真正把补丁应用到具体内容
 * （DOM 节点 / 文档块 / 片段…）并计算 forward/inverse，是 surface 适配器的事
 * （`DesignPatchApplier`，由后续 T-BROWSER-SELECT 等工作令注册）。没有适配器时，
 * 补丁记录的是动作意图，rollback 为账本级（标注 inverse 不可用），不假装改了内容。
 *
 * 持久化：v1 为进程内账本（Map）。落盘到 session 目录是后续切片（不改变接口）。
 */

import { randomUUID } from 'node:crypto'
import type {
  SessionEvent,
  DesignEngine,
  DesignSelection,
  DesignAction,
  DesignPatch,
  SetSelectionInput,
  ProposeActionInput,
  ProposeActionResult,
  CommitPatchInput,
  CommitPatchResult,
  RollbackPatchInput,
  RollbackPatchResult,
} from '@craft-agent/shared/protocol'

/** Surface 适配器：把动作算成可应用/可回滚的补丁内容。由具体画布注册。 */
export interface DesignPatchApplier {
  /** 根据动作算 forward/inverse（surface 专属）。同步或异步。 */
  preview(action: DesignAction): Promise<{ forward: unknown; inverse: unknown }> | { forward: unknown; inverse: unknown }
  /** 真正应用已授权的补丁（committed 时调用）。可选——没有则只走账本。 */
  apply?(patch: DesignPatch): Promise<void> | void
  /** 回滚已提交补丁。可选。 */
  revert?(patch: DesignPatch): Promise<void> | void
}

interface PatchRecord {
  patch: DesignPatch
  action: DesignAction
}

export class DesignEngineService implements DesignEngine {
  private readonly selections = new Map<string, DesignSelection>()
  private readonly patches = new Map<string, PatchRecord>()

  /**
   * @param emit  发 SessionEvent 的回调（生产环境接 SessionManager.emitSessionEvent；测试注入收集器）。
   * @param applier  surface 适配器（可选）；没有时补丁为账本级、inverse 标注不可用。
   */
  constructor(
    private readonly emit: (event: SessionEvent) => void,
    private readonly applier?: DesignPatchApplier,
  ) {}

  async setSelection(input: SetSelectionInput): Promise<void> {
    this.selections.set(input.sessionId, input.selection)
    this.emit({ type: 'selection_changed', sessionId: input.sessionId, selection: input.selection })
  }

  async getSelection(sessionId: string): Promise<DesignSelection | null> {
    return this.selections.get(sessionId) ?? null
  }

  async proposeAction(input: ProposeActionInput): Promise<ProposeActionResult> {
    const { sessionId, action } = input

    let forward: unknown = { op: action.op }
    let inverse: unknown = { kind: 'unavailable', reason: 'no surface adapter; rollback is ledger-only until applier wired' }
    if (this.applier) {
      const computed = await this.applier.preview(action)
      forward = computed.forward
      inverse = computed.inverse
    }

    const patch: DesignPatch = {
      patchId: randomUUID(),
      actionId: action.actionId,
      sessionId,
      forward,
      inverse,
      status: 'preview',
    }
    this.patches.set(patch.patchId, { patch, action })

    this.emit({ type: 'design_action_proposed', sessionId, action, patchPreview: patch })
    return { patch }
  }

  async commitPatch(input: CommitPatchInput): Promise<CommitPatchResult> {
    const record = this.requirePatch(input.sessionId, input.patchId)
    if (record.patch.status === 'committed') {
      return { patch: record.patch }
    }
    if (record.patch.status === 'rolled_back') {
      throw new Error(`Cannot commit rolled-back patch ${input.patchId}`)
    }

    if (this.applier?.apply) {
      await this.applier.apply(record.patch)
    }

    record.patch.status = 'committed'
    record.patch.committedAt = Date.now()
    this.emit({
      type: 'design_patch_committed',
      sessionId: input.sessionId,
      patch: record.patch,
      actor: record.action.actor,
    })
    return { patch: record.patch }
  }

  async rollbackPatch(input: RollbackPatchInput): Promise<RollbackPatchResult> {
    const record = this.requirePatch(input.sessionId, input.patchId)
    if (record.patch.status === 'rolled_back') {
      return { patch: record.patch }
    }

    if (this.applier?.revert) {
      await this.applier.revert(record.patch)
    }

    record.patch.status = 'rolled_back'
    this.emit({
      type: 'design_patch_rolled_back',
      sessionId: input.sessionId,
      patchId: input.patchId,
      actor: record.action.actor,
    })
    return { patch: record.patch }
  }

  private requirePatch(sessionId: string, patchId: string): PatchRecord {
    const record = this.patches.get(patchId)
    if (!record) {
      throw new Error(`Unknown patch ${patchId}`)
    }
    if (record.patch.sessionId !== sessionId) {
      throw new Error(`Patch ${patchId} does not belong to session ${sessionId}`)
    }
    return record
  }
}
