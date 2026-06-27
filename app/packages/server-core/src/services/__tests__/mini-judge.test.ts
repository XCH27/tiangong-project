import { describe, it, expect } from 'bun:test'
import { refineComplexityWithMini, inferLatencySensitive, rebuildDecisionForComplexity } from '../model-orchestrator.ts'
import { DEFAULT_MODEL_ROUTING_PREFS } from '../fusion-types.ts'
import { collectCascadeToolSignal } from '../session-routing-bridge.ts'

describe('refineComplexityWithMini', () => {
  it('非 C2 不调 mini', async () => {
    const result = await refineComplexityWithMini(3, 'hello', 'chat-text', async () => '3')
    expect(result.complexity).toBe(3)
    expect(result.basisSuffix).toBe('')
  })

  it('C2 + mini 返回 3 → 升级复杂度', async () => {
    const result = await refineComplexityWithMini(2, '分析架构', 'code-tools', async () => '3')
    expect(result.complexity).toBe(3)
    expect(result.basisSuffix).toContain('mini-judge=3')
  })

  it('mini 失败保留启发式', async () => {
    const result = await refineComplexityWithMini(2, 'hello', 'chat-text', async () => null)
    expect(result.complexity).toBe(2)
  })
})

describe('inferLatencySensitive', () => {
  it('短闲聊为低延迟敏感', () => {
    expect(inferLatencySensitive('你好', 'chat-text', 1)).toBe(true)
  })

  it('代码任务不敏感', () => {
    expect(inferLatencySensitive('改代码', 'code-tools', 2)).toBe(false)
  })
})

describe('rebuildDecisionForComplexity', () => {
  it('C3 映射 balanced', () => {
    const base = {
      taskType: 'code-tools' as const,
      complexity: 2 as const,
      tier: 'fast' as const,
      fusionMode: 'none' as const,
      cascadeEligible: true,
      basis: 'test',
    }
    const next = rebuildDecisionForComplexity(base, 3, DEFAULT_MODEL_ROUTING_PREFS, false, 'mini-judge=3')
    expect(next.tier).toBe('balanced')
    expect(next.complexity).toBe(3)
  })
})

describe('collectCascadeToolSignal', () => {
  it('工具错误产生 tool-error', () => {
    const signals = collectCascadeToolSignal('Bash', 'Error: failed', true)
    expect(signals.some(s => s.kind === 'tool-error')).toBe(true)
  })

  it('测试失败额外产生 test-failure', () => {
    const signals = collectCascadeToolSignal('jest', 'Test failed: foo', true)
    expect(signals.some(s => s.kind === 'test-failure')).toBe(true)
  })

  it('成功无信号', () => {
    expect(collectCascadeToolSignal('Read', 'ok', false)).toEqual([])
  })
})
