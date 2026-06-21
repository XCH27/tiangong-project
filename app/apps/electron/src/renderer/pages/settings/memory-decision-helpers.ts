/**
 * Pure helpers for Memory & Decision UI.
 * Extracted so they can be unit tested without DOM.
 */

import type { MemoryPartition, DecisionLevel, DecisionRuleUpsertInput } from '@craft-agent/shared/protocol'

export const ALL_PARTITIONS: MemoryPartition[] = ['user', 'app', 'project', 'agent', 'task', 'design', 'review']

export const DECISION_LEVELS: DecisionLevel[] = ['L0', 'L1', 'L2', 'L3']

export type DecisionScope = 'local' | 'external'

export interface DecisionRuleFormState {
  id: string
  action: string
  target: string
  scope: DecisionScope
  level: DecisionLevel
  allow: boolean
  reason: string
}

export function needsConfirmForDelete(risk?: string): boolean {
  return risk === 'medium' || risk === 'high'
}

export function needsConfirmForRuleDelete(ruleId: string): boolean {
  return ruleId.trim().length > 0
}

export function createEmptyDecisionRuleForm(): DecisionRuleFormState {
  const suffix = globalThis.crypto?.randomUUID?.()?.slice(0, 8) ?? String(Date.now())
  return {
    id: `rule-${suffix}`,
    action: '',
    target: '',
    scope: 'local',
    level: 'L2',
    allow: true,
    reason: '',
  }
}

export function decisionRuleFormToUpsert(form: DecisionRuleFormState): DecisionRuleUpsertInput {
  return {
    id: form.id.trim(),
    action: form.action.trim(),
    target: form.target.trim() || undefined,
    scope: form.scope,
    level: form.level,
    allow: form.allow,
    reason: form.reason.trim() || undefined,
  }
}

export function validateDecisionRuleForm(form: DecisionRuleFormState): string | null {
  if (!form.id.trim()) return 'Rule id is required'
  if (!form.action.trim()) return 'Action is required'
  return null
}

export function formatDecisionRuleSummary(rule: {
  id: string
  level: DecisionLevel
  action: string
  allow: boolean
  scope?: DecisionScope
}): string {
  const outcome = rule.allow ? 'allow' : 'deny'
  const scope = rule.scope ?? 'local'
  return `${rule.level} · ${rule.action} · ${scope} · ${outcome}`
}

export function parseValueInput(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return raw
    }
  }
  return raw
}

export function formatAgentLabel(a: { displayName: string; kind: string; status: string; runtime?: string }): string {
  return `${a.displayName} (${a.kind}) — ${a.status}${a.runtime ? ' · ' + a.runtime : ''}`
}
