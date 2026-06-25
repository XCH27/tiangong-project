/**
 * DesignEngineService —— Fleet 工作台动作引擎（承重墙 · 瘦桥）
 * =====================================================================
 *
 * 实现 `DesignEngine`（`@craft-agent/shared/protocol`）。这是"没有第二条写入路径"
 * 的强制点：人类 UI 和 AI 工具产出的 `DesignAction` 都走 `proposeAction`，经
 * propose → (permission) → commit/rollback 的状态机，每步发一个 `SessionEvent`
 * （带 actor）进同一条 timeline。
 *
 * 边界（docs/30/31 修正后的瘦桥角色，诚实）：本引擎只负责
 * **事务 / 账本 / 状态机 / 事件 / 权限闸门 / 回放索引**。真正把补丁应用到具体内容
 * （DOM 节点 / 文档块 / 片段 / 设计文档…）并计算 forward/inverse，是各面**原生引擎适配器**
 * （`DesignPatchApplier`）的事。没有适配器时，补丁记录的是动作意图，rollback 为账本级
 * （inverse 标注不可用），不假装改了内容。
 *
 * **不依赖治理簇**（decision/memory）：权限闸门是自包含的简单分级——人(human_ui)默认预授权，
 * Agent(agent_tool) 写动作默认 pending，L3 必须显式确认。自动决策若启用，由上层把
 * `decision` 上下文传进来作为记录依据，不替代闸门。
 *
 * Internal Action Registry 接入后：若 `DesignAction.actionDefinitionId` 存在，权限等级
 * 以注册项 `permissionLevel` 为唯一来源；`DesignAction.actionId` 仍是一条调用/patch id。
 *
 * 持久化：默认开（`FileDesignEnginePersistence`）——承重墙必须可重启恢复，不做易失 Map。
 */

import { randomUUID } from 'node:crypto'
import type {
  SessionEvent,
  DesignEngine,
  DesignSelection,
  DesignAction,
  DesignActionOp,
  DesignPatch,
  DesignActionPermission,
  SetSelectionInput,
  ProposeActionInput,
  ProposeActionResult,
  CommitPatchInput,
  CommitPatchResult,
  RollbackPatchInput,
  RollbackPatchResult,
  InternalActionDefinition,
  InternalActionRegistry,
} from '@craft-agent/shared/protocol'
import type { DesignEnginePersistence, PersistedDesignPatch } from './design-engine-persistence'

/** Surface 适配器：把动作算成可应用/可回滚的补丁内容。由各面原生引擎注册。 */
export interface DesignPatchApplier {
  /** 根据动作算 forward/inverse（surface 专属）。同步或异步。 */
  preview(
    action: DesignAction,
    selection: DesignSelection | null,
  ): Promise<{ forward: unknown; inverse: unknown }> | { forward: unknown; inverse: unknown }
  /** 真正应用已授权的补丁（committed 时调用）。可选——没有则只走账本。 */
  apply?(patch: DesignPatch, action: DesignAction, selection: DesignSelection | null): Promise<void> | void
  /** 回滚已提交补丁。可选。 */
  revert?(patch: DesignPatch, action: DesignAction, selection: DesignSelection | null): Promise<void> | void
}

interface PatchRecord {
  patch: DesignPatch
  action: DesignAction
  permission?: DesignActionPermission
  permissionRequestId?: string
}

export class DesignEngineService implements DesignEngine {
  private readonly selections = new Map<string, DesignSelection>()
  private readonly patches = new Map<string, PatchRecord>()

  /**
   * @param emit  发 SessionEvent 的回调（生产环境接 SessionManager.emitSessionEvent；测试注入收集器）。
   * @param applier  surface 适配器（可选）；没有时补丁为账本级、inverse 标注不可用。
   * @param persistence  落盘（默认在 handler 注入 FileDesignEnginePersistence；测试可省略走内存）。
   */
  constructor(
    private readonly emit: (event: SessionEvent) => void,
    private readonly applier?: DesignPatchApplier,
    private readonly persistence?: DesignEnginePersistence,
    private readonly internalActionRegistry?: InternalActionRegistry,
  ) {}

  async setSelection(input: SetSelectionInput): Promise<void> {
    this.selections.set(input.sessionId, input.selection)
    await this.persistence?.saveSelection(input.selection)
    this.emit({ type: 'selection_changed', sessionId: input.sessionId, selection: input.selection })
  }

  async getSelection(sessionId: string): Promise<DesignSelection | null> {
    const cached = this.selections.get(sessionId)
    if (cached) return cached
    const persisted = await this.persistence?.loadSelection(sessionId)
    if (persisted) this.selections.set(sessionId, persisted)
    return persisted ?? null
  }

  async proposeAction(input: ProposeActionInput): Promise<ProposeActionResult> {
    const { sessionId, action } = input

    let forward: unknown = { op: action.op }
    let inverse: unknown = { kind: 'unavailable', reason: 'no surface adapter; rollback is ledger-only until applier wired' }
    const selection = this.selectionForAction(sessionId, action)
    if (this.applier) {
      const computed = await this.applier.preview(action, selection)
      forward = computed.forward
      inverse = computed.inverse
    }

    const actionDefinition = this.resolveActionDefinition(action)
    const permission = evaluatePermission(action, input.decision, actionDefinition)
    const permissionRequestId = permission.required ? randomUUID() : undefined
    const patch: DesignPatch = {
      patchId: randomUUID(),
      actionId: action.actionId,
      sessionId,
      forward,
      inverse,
      status: permission.required ? 'pending' : 'preview',
    }
    this.patches.set(patch.patchId, { patch, action, permission, permissionRequestId })
    await this.persistence?.savePatch({ patch, action })

    this.emit({ type: 'design_action_proposed', sessionId, action, patchPreview: patch, permissionRequestId, permission })
    return { patch, permissionRequestId, permission }
  }

  async commitPatch(input: CommitPatchInput): Promise<CommitPatchResult> {
    const record = await this.requirePatch(input.sessionId, input.patchId)
    if (record.patch.status === 'committed') {
      return { patch: record.patch }
    }
    if (record.patch.status === 'rolled_back') {
      throw new Error(`Cannot commit rolled-back patch ${input.patchId}`)
    }
    if (record.patch.status === 'pending' && !input.permissionGranted) {
      throw new Error(`Patch ${input.patchId} requires permission before commit`)
    }

    if (this.applier?.apply) {
      await this.applier.apply(record.patch, record.action, this.selectionForAction(input.sessionId, record.action))
    }

    record.patch.status = 'committed'
    record.patch.committedAt = Date.now()
    await this.persistence?.savePatch(record)
    this.emit({
      type: 'design_patch_committed',
      sessionId: input.sessionId,
      patch: record.patch,
      actor: record.action.actor,
    })
    return { patch: record.patch }
  }

  async rollbackPatch(input: RollbackPatchInput): Promise<RollbackPatchResult> {
    const record = await this.requirePatch(input.sessionId, input.patchId)
    if (record.patch.status === 'rolled_back') {
      return { patch: record.patch }
    }

    if (this.applier?.revert) {
      await this.applier.revert(record.patch, record.action, this.selectionForAction(input.sessionId, record.action))
    }

    record.patch.status = 'rolled_back'
    await this.persistence?.savePatch(record)
    this.emit({
      type: 'design_patch_rolled_back',
      sessionId: input.sessionId,
      patchId: input.patchId,
      actor: record.action.actor,
    })
    return { patch: record.patch }
  }

  private async requirePatch(sessionId: string, patchId: string): Promise<PatchRecord> {
    let record = this.patches.get(patchId)
    if (!record && this.persistence) {
      const persisted: PersistedDesignPatch | null = await this.persistence.loadPatch(sessionId, patchId)
      if (persisted) {
        record = persisted
        this.patches.set(patchId, persisted)
      }
    }
    if (!record) {
      throw new Error(`Unknown patch ${patchId}`)
    }
    if (record.patch.sessionId !== sessionId) {
      throw new Error(`Patch ${patchId} does not belong to session ${sessionId}`)
    }
    return record
  }

  private selectionForAction(sessionId: string, action: DesignAction): DesignSelection | null {
    const selection = this.selections.get(sessionId) ?? null
    return selection?.selectionId === action.selectionId ? selection : null
  }

  private resolveActionDefinition(action: DesignAction): InternalActionDefinition | undefined {
    if (!action.actionDefinitionId) return undefined
    if (!this.internalActionRegistry) {
      throw new Error(`Action ${action.actionId} references ${action.actionDefinitionId}, but no Internal Action Registry is configured`)
    }
    const def = this.internalActionRegistry.get(action.actionDefinitionId, action.contractVersion)
    if (!def) {
      const suffix = action.contractVersion === undefined ? '' : `@${action.contractVersion}`
      throw new Error(`Unknown internal action definition ${action.actionDefinitionId}${suffix}`)
    }
    return def
  }
}

/**
 * 自包含权限闸门（不依赖治理簇 decision-service）。
 * - 人(human_ui / kind:'user')：默认预授权（用户亲手点的），required=false。
 * - Agent(agent_tool)：写动作默认 required=true（pending），授权后才 commit。
 * - L3（requiresExplicitConfirm）：无论谁发起都必须显式确认，不能被预授权代答。
 * - 自动决策 hasPreAuth：仅对 Agent 的非 L3 动作生效，allow 但记 ruleRef 依据。
 */
function evaluatePermission(
  action: DesignAction,
  decision: ProposeActionInput['decision'] = {},
  actionDefinition?: InternalActionDefinition,
): DesignActionPermission {
  const actor = action.actor
  const isHuman = actor.kind === 'user' || action.origin === 'human_ui'

  if (actionDefinition) {
    const level = actionDefinition.permissionLevel
    const base = {
      level,
      actor,
      timestamp: Date.now(),
    }

    if (level === 'L3') {
      return {
        ...base,
        required: true,
        reason: `${actionDefinition.id} requires explicit confirmation`,
        requiresExplicitConfirm: true,
      }
    }

    if (level === 'L0') {
      return {
        ...base,
        required: false,
        reason: `${actionDefinition.id} is read-only`,
      }
    }

    if (level === 'L1') {
      const preAuthorized = isHuman || decision?.hasPreAuth === true
      return {
        ...base,
        required: !preAuthorized,
        reason: preAuthorized ? `${actionDefinition.id} is pre-authorized L1` : `${actionDefinition.id} requires L1 permission`,
        ruleRef: decision?.memoryHints?.[0]?.id,
      }
    }

    const hasPreAuth = decision?.hasPreAuth === true
    return {
      ...base,
      required: !hasPreAuth,
      reason: hasPreAuth ? `${actionDefinition.id} pre-authorized by rule` : `${actionDefinition.id} requires L2 permission`,
      ruleRef: decision?.memoryHints?.[0]?.id,
    }
  }

  if (decision?.requiresExplicitConfirm) {
    return {
      required: true,
      level: 'L3',
      reason: 'sensitive action requires explicit confirmation',
      actor,
      requiresExplicitConfirm: true,
      timestamp: Date.now(),
    }
  }

  if (isHuman) {
    return { required: false, level: 'L1', reason: 'human-initiated edit (pre-authorized)', actor, timestamp: Date.now() }
  }

  if (decision?.hasPreAuth) {
    return {
      required: false,
      level: 'L2',
      reason: 'agent write pre-authorized by rule',
      actor,
      ruleRef: decision.memoryHints?.[0]?.id,
      timestamp: Date.now(),
    }
  }

  return {
    required: true,
    level: 'L2',
    reason: `agent write requires permission (${opLabel(action.op)})`,
    actor,
    timestamp: Date.now(),
  }
}

function opLabel(op: DesignActionOp): string {
  return typeof op.kind === 'string' && op.kind.length > 0 ? op.kind : 'unknown'
}
