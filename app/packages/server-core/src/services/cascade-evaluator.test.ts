import { describe, it, expect } from 'bun:test'
import { evaluateCascade, extractConfidenceSignals, type CascadeSignal } from './cascade-evaluator.ts'
import type { RoutingDecision, ModelRoutingPrefs } from './fusion-types.ts'
import { DEFAULT_MODEL_ROUTING_PREFS } from './fusion-types.ts'

function makeDecision(overrides: Partial<RoutingDecision> = {}): RoutingDecision {
  return {
    taskType: 'code-tools',
    complexity: 2,
    tier: 'fast',
    fusionMode: 'none',
    cascadeEligible: true,
    basis: 'test',
    ...overrides,
  }
}

describe('cascade-evaluator', () => {
  describe('evaluateCascade', () => {
    it('无信号不升级', () => {
      const r = evaluateCascade(makeDecision(), [], DEFAULT_MODEL_ROUTING_PREFS)
      expect(r.upgraded).toBe(false)
    })

    it('一般信号 fast→balanced', () => {
      const r = evaluateCascade(makeDecision({ tier: 'fast' }), [{ kind: 'low-confidence', detail: '不确定' }], DEFAULT_MODEL_ROUTING_PREFS)
      expect(r.upgraded).toBe(true)
      expect(r.newTier).toBe('balanced')
    })

    it('严重信号 fast→best', () => {
      const r = evaluateCascade(makeDecision({ tier: 'fast' }), [{ kind: 'schema-failure', detail: 'schema 校验失败' }], DEFAULT_MODEL_ROUTING_PREFS)
      expect(r.upgraded).toBe(true)
      expect(r.newTier).toBe('best')
    })

    it('best + 严重 + Fusion 开 → 触发 Fusion', () => {
      const prefs: ModelRoutingPrefs = { ...DEFAULT_MODEL_ROUTING_PREFS, fusion: { ...DEFAULT_MODEL_ROUTING_PREFS.fusion, enabled: 'on' } }
      const r = evaluateCascade(makeDecision({ tier: 'best', complexity: 3 }), [{ kind: 'test-failure', detail: '测试失败' }], prefs)
      expect(r.upgraded).toBe(true)
      expect(r.newFusionMode).toBe('plan') // code-tools → plan
    })

    it('C4 不级联', () => {
      const r = evaluateCascade(makeDecision({ complexity: 4, tier: 'best' }), [{ kind: 'test-failure', detail: '测试失败' }], DEFAULT_MODEL_ROUTING_PREFS)
      expect(r.upgraded).toBe(false)
    })

    it('不可级联的请求不升级', () => {
      const r = evaluateCascade(makeDecision({ cascadeEligible: false }), [{ kind: 'low-confidence', detail: '不确定' }], DEFAULT_MODEL_ROUTING_PREFS)
      expect(r.upgraded).toBe(false)
    })
  })

  describe('extractConfidenceSignals', () => {
    it('检测不确定措辞', () => {
      expect(extractConfidenceSignals('我不确定这个方案是否正确').length).toBeGreaterThan(0)
    })

    it('正常输出无信号', () => {
      expect(extractConfidenceSignals('已修复 bug，测试通过。')).toHaveLength(0)
    })
  })
})
