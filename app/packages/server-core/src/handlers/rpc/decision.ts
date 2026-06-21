/**
 * Decision RPC handlers (LOCAL_ONLY).
 * L0/L1/L2/L3 pure rule judgment. L3 must require explicit confirmation.
 */

import {
  RPC_CHANNELS,
  type DecisionEvaluateInput,
  type DecisionEvaluateResult,
} from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { decisionService } from '../../services/decision-service'

export function registerDecisionHandlers(server: RpcServer, _deps: HandlerDeps): void {
  server.handle(RPC_CHANNELS.decision.EVALUATE, async (_ctx, input: DecisionEvaluateInput): Promise<DecisionEvaluateResult> => {
    if (!input || typeof input !== 'object' || !input.action) throw new Error('action is required')

    const ctx = {
      action: input.action,
      scope: (input.scope ?? 'local') as 'local' | 'external',
      target: input.target,
      risk: input.risk,
      requiresUserConfirm: input.requiresExplicitConfirm,
      hasPreAuth: input.hasPreAuth,
      memoryHit: input.memoryHints && input.memoryHints.length ? { id: input.memoryHints[0].id || 'hint', partition: (input.memoryHints[0].partition as any) || 'user', value: {}, createdAt: Date.now(), updatedAt: Date.now() } : null,
    }

    const audit = decisionService.decide(ctx as any)

    const outcome: DecisionEvaluateResult['outcome'] =
      audit.level === 'L3' ? 'require_permission' :
      audit.allowed ? 'allow' : 'deny'

    return {
      outcome,
      level: audit.level,
      reason: audit.reason,
      ruleRef: audit.ruleRef,
      auditId: audit.id,
      timestamp: audit.timestamp,
      requiresExplicitConfirm: audit.level === 'L3' || !!audit.context.requiresUserConfirm,
    }
  })
}
