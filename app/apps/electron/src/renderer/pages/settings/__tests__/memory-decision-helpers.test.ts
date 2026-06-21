import { describe, expect, it } from 'bun:test'
import {
  needsConfirmForDelete,
  needsConfirmForRuleDelete,
  parseValueInput,
  formatAgentLabel,
  ALL_PARTITIONS,
  createEmptyDecisionRuleForm,
  decisionRuleFormToUpsert,
  validateDecisionRuleForm,
  formatDecisionRuleSummary,
} from '../memory-decision-helpers'

describe('memory-decision-helpers', () => {
  it('needsConfirmForDelete returns true only for medium/high', () => {
    expect(needsConfirmForDelete('low')).toBe(false)
    expect(needsConfirmForDelete('medium')).toBe(true)
    expect(needsConfirmForDelete('high')).toBe(true)
    expect(needsConfirmForDelete(undefined)).toBe(false)
  })

  it('needsConfirmForRuleDelete requires non-empty id', () => {
    expect(needsConfirmForRuleDelete('rule-1')).toBe(true)
    expect(needsConfirmForRuleDelete('')).toBe(false)
    expect(needsConfirmForRuleDelete('   ')).toBe(false)
  })

  it('parseValueInput handles json and plain', () => {
    expect(parseValueInput('{"a":1}')).toEqual({ a: 1 })
    expect(parseValueInput('plain')).toBe('plain')
    expect(parseValueInput('')).toBe('')
  })

  it('formatAgentLabel produces readable string', () => {
    const label = formatAgentLabel({ displayName: 'Mgr', kind: 'manager', status: 'running' })
    expect(label).toContain('Mgr')
    expect(label).toContain('manager')
  })

  it('ALL_PARTITIONS covers 7 partitions', () => {
    expect(ALL_PARTITIONS.length).toBe(7)
  })

  it('decision rule form helpers validate and map upsert input', () => {
    const form = createEmptyDecisionRuleForm()
    expect(form.id).toMatch(/^rule-/)
    expect(validateDecisionRuleForm({ ...form, action: '' })).toBe('Action is required')

    const upsert = decisionRuleFormToUpsert({
      ...form,
      action: 'write-file',
      target: '  ',
      reason: '  test  ',
    })
    expect(upsert.action).toBe('write-file')
    expect(upsert.target).toBeUndefined()
    expect(upsert.reason).toBe('test')
  })

  it('formatDecisionRuleSummary includes level and outcome', () => {
    const summary = formatDecisionRuleSummary({
      id: 'r1',
      level: 'L2',
      action: 'execute',
      allow: false,
      scope: 'local',
    })
    expect(summary).toContain('L2')
    expect(summary).toContain('deny')
  })
})
