export type DecisionLevel = 'L0' | 'L1' | 'L2' | 'L3'

export type DecisionOutcome = 'allow' | 'require_permission' | 'deny'

export interface DecisionActorRef {
  agentId?: string
  kind?: 'user' | 'agent'
  role?: string
  runtime?: string
}

export interface DecisionEvaluateInput {
  action: string
  target?: string
  scope?: 'local' | 'external'
  risk?: 'read-only' | 'reversible' | 'irreversible' | 'sensitive'
  actor?: DecisionActorRef
  memoryHints?: Array<{ partition: string; id?: string; key?: string }>
  hasPreAuth?: boolean
  requiresExplicitConfirm?: boolean
}

export interface DecisionEvaluateResult {
  outcome: DecisionOutcome
  level: DecisionLevel
  reason: string
  ruleRef: string
  auditId: string
  timestamp: number
  requiresExplicitConfirm: boolean
}
