import type { MemoryRecord } from '@craft-agent/shared/protocol'
import { FileDecisionPersistence, getDecisionDataDir } from './decision-persistence'
import type { DecisionRule } from './decision-persistence'

export type DecisionLevel = 'L0' | 'L1' | 'L2' | 'L3'

export interface DecisionRuleContext {
  action: string
  scope?: 'local' | 'external'
  target?: string
  risk?: 'read-only' | 'reversible' | 'irreversible' | 'sensitive'
  requiresUserConfirm?: boolean
  hasPreAuth?: boolean
  memoryHit?: MemoryRecord | null
  actor?: { agentId?: string; kind?: string; role?: string }
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

export interface DecisionOutcome {
  outcome: 'allow' | 'require_permission' | 'deny'
  level: DecisionLevel
  reason: string
  ruleRef: string
  auditId: string
  timestamp: number
  requiresExplicitConfirm: boolean
}

function nowTs() { return Date.now() }
function makeId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}` }

export class DecisionService {
  private audits: DecisionAudit[] = []
  private persistence: FileDecisionPersistence
  private rules: DecisionRule[] = []

  constructor(dataDir?: string) {
    this.persistence = new FileDecisionPersistence(dataDir || getDecisionDataDir())
    this.persistence.loadRules().then(r => { this.rules = r || [] }).catch(() => {})
  }

  private matchRule(ctx: DecisionRuleContext): DecisionRule | undefined {
    return this.rules.find(r =>
      r.action === ctx.action &&
      (!r.target || r.target === ctx.target) &&
      (!r.scope || r.scope === ctx.scope)
    )
  }

  decide(ctx: DecisionRuleContext): DecisionAudit {
    const ts = nowTs()

    // L3 always explicit
    const l3Keywords = ['delete', 'publish', 'pay', 'login', 'sensitive']
    if (l3Keywords.some(k => ctx.action.includes(k)) || ctx.risk === 'irreversible' || ctx.risk === 'sensitive' || ctx.requiresUserConfirm) {
      const a: DecisionAudit = { id: makeId(), level: 'L3', allowed: false, reason: 'L3 action requires explicit user confirmation', ruleRef: 'L3-EXPLICIT', timestamp: ts, context: ctx }
      this.audits.push(a); return a
    }

    // user rule first
    const rule = this.matchRule(ctx)
    if (rule) {
      const a: DecisionAudit = { id: makeId(), level: rule.level, allowed: rule.allow, reason: rule.reason, ruleRef: `RULE:${rule.id}`, timestamp: ts, context: ctx }
      this.audits.push(a); return a
    }

    // L0
    if (ctx.scope === 'local' && ctx.risk === 'read-only') {
      const a: DecisionAudit = { id: makeId(), level: 'L0', allowed: true, reason: 'L0 read-only', ruleRef: 'L0-READ-ONLY', timestamp: ts, context: ctx }
      this.audits.push(a); return a
    }

    // L2
    if (ctx.action.includes('write') || ctx.action.includes('execute') || ctx.scope === 'external' || ctx.action.includes('submit')) {
      const allowed = !!ctx.hasPreAuth || !!ctx.memoryHit
      const a: DecisionAudit = { id: makeId(), level: 'L2', allowed, reason: allowed ? 'L2 preauth/memory' : 'L2 requires rule/preauth', ruleRef: allowed ? 'L2-PREAUTH' : 'L2-NO-AUTH', timestamp: ts, context: ctx }
      this.audits.push(a); return a
    }

    // L1
    if (ctx.scope === 'local' && (ctx.risk === 'reversible' || ctx.risk === 'read-only')) {
      const allowed = !!ctx.hasPreAuth || !!ctx.memoryHit
      const a: DecisionAudit = { id: makeId(), level: 'L1', allowed, reason: allowed ? 'L1 low-risk per pref' : 'L1 no rule', ruleRef: allowed ? 'L1-PREF' : 'L1-NO-RULE', timestamp: ts, context: ctx }
      this.audits.push(a); return a
    }

    const a: DecisionAudit = { id: makeId(), level: 'L2', allowed: false, reason: 'default deny', ruleRef: 'DEFAULT-DENY', timestamp: ts, context: ctx }
    this.audits.push(a); return a
  }

  evaluate(ctx: DecisionRuleContext): DecisionOutcome {
    const a = this.decide(ctx)
    const outcome: DecisionOutcome['outcome'] = a.level === 'L3' ? 'require_permission' : (a.allowed ? 'allow' : 'deny')
    return { outcome, level: a.level, reason: a.reason, ruleRef: a.ruleRef, auditId: a.id, timestamp: a.timestamp, requiresExplicitConfirm: a.level === 'L3' || !!ctx.requiresUserConfirm }
  }

  async saveRule(rule: DecisionRule) { await this.persistence.saveRule(rule); this.rules = await this.persistence.loadRules() }
  async loadRules(): Promise<DecisionRule[]> { return this.persistence.loadRules() }
  async deleteRule(id: string): Promise<boolean> { const deleted = await this.persistence.deleteRule(id); this.rules = await this.persistence.loadRules(); return deleted }

  listAudits(): DecisionAudit[] { return [...this.audits] }
  clearAudits() { this.audits = [] }
}

export const decisionService = new DecisionService()
