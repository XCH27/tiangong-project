/**
 * Decision RPC handlers (LOCAL_ONLY).
 * L0/L1/L2/L3 pure rule judgment. L3 must require explicit confirmation.
 */

import {
  RPC_CHANNELS,
  type DecisionEvaluateInput,
  type DecisionEvaluateResult,
  type DecisionRuleActionResult,
  type DecisionRuleDeleteInput,
  type DecisionRuleDeleteResult,
  type DecisionRuleListResult,
  type DecisionRuleUpsertInput,
} from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { DecisionService, decisionService } from '../../services/decision-service'

type DecisionHandlerDeps = HandlerDeps & { decisionService?: DecisionService }

function requireId(id: string | undefined): string {
  if (typeof id !== 'string' || !id.trim()) throw new Error('id is required')
  return id.trim()
}

function requireAction(action: string | undefined): string {
  if (typeof action !== 'string' || !action.trim()) throw new Error('action is required')
  return action.trim()
}

export function registerDecisionHandlers(server: RpcServer, deps: HandlerDeps): void {
  const decisions = (deps as DecisionHandlerDeps).decisionService ?? decisionService

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

    const audit = decisions.decide(ctx as any)

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

  server.handle(RPC_CHANNELS.decision.LIST_RULES, async (): Promise<DecisionRuleListResult> => {
    return { rules: await decisions.loadRules() }
  })

  server.handle(RPC_CHANNELS.decision.UPSERT_RULE, async (_ctx, input: DecisionRuleUpsertInput): Promise<DecisionRuleActionResult> => {
    if (!input || typeof input !== 'object') throw new Error('input required')
    const rule = {
      id: requireId(input.id),
      action: requireAction(input.action),
      target: input.target,
      scope: input.scope,
      level: input.level ?? 'L2',
      allow: !!input.allow,
      reason: input.reason || (input.allow ? 'User configured allow rule' : 'User configured deny rule'),
      updatedAt: Date.now(),
    }
    await decisions.saveRule(rule)
    return { rule }
  })

  server.handle(RPC_CHANNELS.decision.DELETE_RULE, async (_ctx, input: DecisionRuleDeleteInput): Promise<DecisionRuleDeleteResult> => {
    const id = requireId(input?.id)
    const deleted = await decisions.deleteRule(id)
    return { deleted, id }
  })
}
