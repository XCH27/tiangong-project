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

export interface DecisionRuleDescriptor {
  id: string
  level: DecisionLevel
  action: string
  target?: string
  scope?: 'local' | 'external'
  allow: boolean
  reason: string
  updatedAt: number
}

export interface DecisionRuleUpsertInput {
  id: string
  level?: DecisionLevel
  action: string
  target?: string
  scope?: 'local' | 'external'
  allow: boolean
  reason?: string
}

export interface DecisionRuleListResult {
  rules: DecisionRuleDescriptor[]
}

export interface DecisionRuleActionResult {
  rule: DecisionRuleDescriptor
}

export interface DecisionRuleDeleteInput {
  id: string
}

export interface DecisionRuleDeleteResult {
  deleted: boolean
  id: string
}
