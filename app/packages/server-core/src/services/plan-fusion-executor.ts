/**
 * Plan Fusion Executor — 把 Writer 产出的 actionPlan 转成 DesignAction/InternalAction 并经 permission+timeline 执行
 *
 * 单一真相：docs/03 §5（Plan Fusion 形态）+ AGENTS 规则 15/19
 *
 * 设计要点：
 * - 不直接 import SessionManager（避免循环依赖），用接口注入执行回调。
 * - actionPlan 是 Writer 产出的 JSON，形状非闭合；这里做容错解析 + 转 DesignAction/ActionInvocation。
 * - 每个动作带 agentId/role（规则 15），走 permission + timeline（规则 19）。
 */

import type {
  ActorRef,
  DesignAction,
  DesignActionOp,
  ActionInvocation,
} from '@craft-agent/shared/protocol'
import type { FusionResult } from './fusion-types.ts'

// ---------------------------------------------------------------------------
// actionPlan 形状（Writer 产出的 JSON，容错解析）
// ---------------------------------------------------------------------------

export interface PlanActionStep {
  kind?: string
  surface?: string
  selectionId?: string
  payload?: unknown
  props?: Record<string, string | number>
  reorder?: string[]
  align?: string
  gap?: number
  x?: number
  y?: number
  w?: number
  h?: number
  rotate?: number
  radius?: number
  opacity?: number
  assetId?: string
  at?: Record<string, unknown>
  mask?: unknown
  op?: string
  messageId?: string
  annotationId?: string
  text?: string
  actionDefinitionId?: string
  contractVersion?: number
  input?: unknown
}

export interface PlanActionEnvelope {
  steps?: PlanActionStep[]
  actions?: PlanActionStep[]
}

// ---------------------------------------------------------------------------
// 执行回调接口（由 SessionManager 侧实现注入）
// ---------------------------------------------------------------------------

export interface PlanExecutionDeps {
  sessionId: string
  actor: ActorRef
  emitDesignAction: (action: DesignAction) => Promise<unknown>
  invokeInternalAction: (invocation: ActionInvocation) => Promise<unknown>
}

export interface PlanExecutionResult {
  executedDesignActions: DesignAction[]
  executedInternalActions: ActionInvocation[]
  results: unknown[]
  errors: Array<{ index: number; error: string }>
}

// ---------------------------------------------------------------------------
// actionPlan 解析
// ---------------------------------------------------------------------------

export function parseActionPlan(raw: unknown): PlanActionStep[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(normalizeStep)
  if (typeof raw === 'object') {
    const env = raw as PlanActionEnvelope
    if (Array.isArray(env.steps)) return env.steps.map(normalizeStep)
    if (Array.isArray(env.actions)) return env.actions.map(normalizeStep)
  }
  return []
}

function normalizeStep(step: unknown): PlanActionStep {
  if (!step || typeof step !== 'object') return {}
  return step as PlanActionStep
}

// ---------------------------------------------------------------------------
// 单步 → DesignAction / ActionInvocation 转换
// ---------------------------------------------------------------------------

function toDesignActionOp(step: PlanActionStep): DesignActionOp | null {
  const kind = step.kind ?? ''
  switch (kind) {
    case 'set_style':
      return { kind: 'set_style', props: step.props ?? {} }
    case 'set_layout':
      return { kind: 'set_layout', reorder: step.reorder, align: step.align, gap: step.gap }
    case 'set_transform':
      return {
        kind: 'set_transform',
        x: step.x,
        y: step.y,
        w: step.w,
        h: step.h,
        rotate: step.rotate,
        radius: step.radius,
        opacity: step.opacity,
      }
    case 'insert_asset':
      return { kind: 'insert_asset', assetId: step.assetId ?? '', at: step.at }
    case 'set_mask':
      return { kind: 'set_mask', mask: step.mask ?? null }
    case 'annotate':
      if (!step.messageId || typeof step.text !== 'string') return null
      return { kind: 'annotate', messageId: step.messageId, annotationId: step.annotationId, text: step.text }
    default:
      return null
  }
}

function toDesignAction(
  step: PlanActionStep,
  index: number,
  sessionId: string,
  actor: ActorRef,
): DesignAction | null {
  const op = toDesignActionOp(step)
  if (!op) return null
  return {
    actionId: `plan-fusion-${sessionId}-${index}`,
    actionDefinitionId: step.actionDefinitionId,
    contractVersion: step.contractVersion,
    sessionId,
    selectionId: step.selectionId ?? `plan-fusion-sel-${index}`,
    actor,
    op,
    origin: 'agent_tool',
    createdAt: Date.now(),
  }
}

function toInternalInvocation(
  step: PlanActionStep,
  index: number,
  sessionId: string,
  actor: ActorRef,
): ActionInvocation | null {
  if (!step.actionDefinitionId) return null
  return {
    actionDefinitionId: step.actionDefinitionId,
    contractVersion: step.contractVersion ?? 1,
    actor,
    input: step.input ?? step.payload ?? {},
    idempotencyKey: `plan-fusion-${sessionId}-${index}`,
  }
}

// ---------------------------------------------------------------------------
// 主执行入口
// ---------------------------------------------------------------------------

export async function executePlanFusion(
  fusionResult: FusionResult,
  deps: PlanExecutionDeps,
): Promise<PlanExecutionResult> {
  const steps = parseActionPlan(fusionResult.actionPlan)
  const executedDesignActions: DesignAction[] = []
  const executedInternalActions: ActionInvocation[] = []
  const results: unknown[] = []
  const errors: Array<{ index: number; error: string }> = []

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    try {
      if (step.actionDefinitionId) {
        const invocation = toInternalInvocation(step, i, deps.sessionId, deps.actor)
        if (invocation) {
          executedInternalActions.push(invocation)
          const result = await deps.invokeInternalAction(invocation)
          results.push(result)
          continue
        }
      }
      const designAction = toDesignAction(step, i, deps.sessionId, deps.actor)
      if (designAction) {
        executedDesignActions.push(designAction)
        const result = await deps.emitDesignAction(designAction)
        results.push(result)
        continue
      }
      errors.push({ index: i, error: `unrecognized step kind: ${step.kind ?? '(missing)'}` })
    } catch (err) {
      errors.push({ index: i, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return { executedDesignActions, executedInternalActions, results, errors }
}
