import type { MemoryRecord } from './memory-service'

export type DecisionLevel = 'L0' | 'L1' | 'L2' | 'L3'

export interface DecisionRuleContext {
  action: string // e.g. 'read', 'write', 'delete', 'execute', 'submit-external', 'login', 'publish'
  scope: 'local' | 'external'
  target?: string // 'file' | 'memory' | 'command' | 'review' | 'git-push' etc.
  risk?: 'read-only' | 'reversible' | 'irreversible' | 'sensitive'
  requiresUserConfirm?: boolean
  hasPreAuth?: boolean // user pre-authorized for this class
  memoryHit?: MemoryRecord | null // optional reference for L1/L2
}

export interface DecisionAudit {
  id: string
  level: DecisionLevel
  allowed: boolean
  reason: string
  ruleRef: string
  timestamp: number
  context: DecisionRuleContext
}

function nowTs() {
  return Date.now()
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export class DecisionService {
  private audits: DecisionAudit[] = []

  decide(ctx: DecisionRuleContext): DecisionAudit {
    const { action, scope, risk, requiresUserConfirm, hasPreAuth } = ctx

    // L3 hard rules
    const l3Keywords = ['delete', 'publish', 'pay', 'login', 'sensitive']
    if (l3Keywords.some((k) => action.includes(k)) || risk === 'irreversible' || risk === 'sensitive' || requiresUserConfirm) {
      const audit: DecisionAudit = {
        id: makeId(),
        level: 'L3',
        allowed: false,
        reason: 'L3 action requires explicit user confirmation',
        ruleRef: 'L3-EXPLICIT',
        timestamp: nowTs(),
        context: ctx,
      }
      this.audits.push(audit)
      return audit
    }

    // L0: read-only suggestions always auto (pure local read-only)
    if (scope === 'local' && risk === 'read-only') {
      const audit: DecisionAudit = {
        id: makeId(),
        level: 'L0',
        allowed: true,
        reason: 'L0 read-only suggestion',
        ruleRef: 'L0-READ-ONLY',
        timestamp: nowTs(),
        context: ctx,
      }
      this.audits.push(audit)
      return audit
    }

    // L2: write / execute / external submit need rule or preauth
    if (action.includes('write') || action.includes('execute') || scope === 'external' || action.includes('submit')) {
      const allowed = !!hasPreAuth || (ctx.memoryHit != null)
      const audit: DecisionAudit = {
        id: makeId(),
        level: 'L2',
        allowed,
        reason: allowed ? 'L2 authorized by preauth or memory rule' : 'L2 requires rule/preauth',
        ruleRef: allowed ? 'L2-PREAUTH-OR-MEMORY' : 'L2-NO-AUTH',
        timestamp: nowTs(),
        context: ctx,
      }
      this.audits.push(audit)
      return audit
    }

    // L1: low risk local reversible with preference/memory
    if (scope === 'local' && (risk === 'reversible' || risk === 'read-only')) {
      const allowed = !!hasPreAuth || (ctx.memoryHit != null)
      const audit: DecisionAudit = {
        id: makeId(),
        level: 'L1',
        allowed,
        reason: allowed ? 'L1 low-risk local per memory/preference' : 'L1 no matching rule',
        ruleRef: allowed ? 'L1-LOCAL-PREF' : 'L1-NO-RULE',
        timestamp: nowTs(),
        context: ctx,
      }
      this.audits.push(audit)
      return audit
    }

    // default conservative deny with L2 classification if ambiguous
    const audit: DecisionAudit = {
      id: makeId(),
      level: 'L2',
      allowed: false,
      reason: 'unknown action; default deny pending rule',
      ruleRef: 'DEFAULT-DENY',
      timestamp: nowTs(),
      context: ctx,
    }
    this.audits.push(audit)
    return audit
  }

  listAudits(): DecisionAudit[] {
    return [...this.audits]
  }

  clearAudits() {
    this.audits = []
  }
}

export const decisionService = new DecisionService()
