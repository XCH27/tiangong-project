/**
 * Fusion pipeline faux 单测（docs/03 §15.9 — 零网络）
 *
 * 用固定假回答断言：
 * - Panel 部分失败仍出终答
 * - Judge 结构化输出解析
 * - Writer 综合被调用
 * - 全失败降级
 * - L3 Panel 缓存命中
 */

import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { runFusion } from './fusion-pipeline.ts'
import { clearAll } from './fusion-cache.ts'
import type { QueryLlmAdapter } from './fusion-pipeline.ts'
import type { RoutingDecision, FusionConfig, PanelMember } from './fusion-types.ts'

function makeDecision(fusionMode: 'synthesis' | 'plan' = 'synthesis'): RoutingDecision {
  return {
    taskType: 'review-analysis',
    complexity: 4,
    tier: 'best',
    fusionMode,
    cascadeEligible: false,
    basis: 'test',
  }
}

function makeConfig(): FusionConfig {
  return {
    panel: [
      { connectionSlug: 'conn-a', modelId: 'model-a', role: 'logic', timeoutMs: 5000 },
      { connectionSlug: 'conn-b', modelId: 'model-b', role: 'code', timeoutMs: 5000 },
      { connectionSlug: 'conn-c', modelId: 'model-c', role: 'language', timeoutMs: 5000 },
    ],
    judgeModel: { connectionSlug: 'conn-j', modelId: 'judge-model' },
    writerModel: { connectionSlug: 'conn-w', modelId: 'writer-model' },
    fusionDepth: 0,
    budgetCap: { maxTokens: 50000, maxPanelists: 3 },
    verification: { enabled: false },
  }
}

function makeFauxQueryLlm(responses: Map<string, string>): QueryLlmAdapter {
  return mock(async (_conn: string, modelId: string, _prompt: string) => {
    const text = responses.get(modelId)
    if (!text) throw new Error(`no faux response for ${modelId}`)
    return { text, usage: { inputTokens: 100, outputTokens: 50 } }
  }) as QueryLlmAdapter
}

describe('fusion-pipeline (faux)', () => {
  beforeEach(() => {
    clearAll()
  })

  it('正常 Synthesis Fusion：Panel → Judge → Writer', async () => {
    const responses = new Map<string, string>([
      ['model-a', '答案是 42'],
      ['model-b', '计算结果是 42'],
      ['model-c', '经过分析得到 42'],
      ['judge-model', JSON.stringify({
        consensus: ['答案是 42'],
        contradictions: [],
        partialCoverage: [],
        uniqueInsights: [],
        blindSpots: [],
        shouldFuse: true,
      })],
      ['writer-model', '综合三个模型的分析，最终答案是 42。'],
    ])

    const result = await runFusion(
      makeDecision('synthesis'),
      '宇宙的终极答案是什么？',
      'system',
      makeConfig(),
      makeFauxQueryLlm(responses),
      'prefix-hash',
    )

    expect(result.finalAnswer).toContain('42')
    expect(result.panelResults).toHaveLength(3)
    expect(result.judgeAnalysis.shouldFuse).toBe(true)
    expect(result.panelResults.every(r => !r.error)).toBe(true)
  })

  it('Panel 部分失败仍出终答', async () => {
    const responses = new Map<string, string>([
      ['model-a', '答案是 42'],
      // model-b 无响应 → 失败
      ['model-c', '经过分析得到 42'],
      ['judge-model', JSON.stringify({
        consensus: ['答案是 42'],
        contradictions: [],
        partialCoverage: [],
        uniqueInsights: [],
        blindSpots: [],
        shouldFuse: false, // 只剩 2 个，judge 说不用综合
      })],
      ['writer-model', '最终答案：42'],
    ])

    const fauxLlm = mock(async (_conn: string, modelId: string) => {
      if (modelId === 'model-b') throw new Error('模拟超时')
      const text = responses.get(modelId)
      if (!text) throw new Error(`no faux response for ${modelId}`)
      return { text, usage: { inputTokens: 100, outputTokens: 50 } }
    }) as QueryLlmAdapter

    const result = await runFusion(
      makeDecision('synthesis'),
      '宇宙的终极答案是什么？',
      'system',
      makeConfig(),
      fauxLlm,
      'prefix-hash',
    )

    expect(result.panelResults).toHaveLength(3)
    const failed = result.panelResults.find(r => r.member.modelId === 'model-b')
    expect(failed?.error).toBeDefined()
    // 仍有终答
    expect(result.finalAnswer).toBeDefined()
    expect(result.finalAnswer.length).toBeGreaterThan(0)
  })

  it('全失败降级单模型直答', async () => {
    const fauxLlm = mock(async (_conn: string, modelId: string) => {
      if (modelId !== 'writer-model') throw new Error('模拟全失败')
      return { text: '降级回答：无法完成 Fusion，这是单模型直答。', usage: { inputTokens: 50, outputTokens: 30 } }
    }) as QueryLlmAdapter

    const result = await runFusion(
      makeDecision('synthesis'),
      '问题',
      'system',
      makeConfig(),
      fauxLlm,
      'prefix-hash',
    )

    expect(result.finalAnswer).toContain('降级')
    expect(result.judgeAnalysis.shouldFuse).toBe(false)
  })

  it('Judge 说不综合 → 取 panel 回答', async () => {
    const responses = new Map<string, string>([
      ['model-a', '42'],
      ['model-b', '42'],
      ['model-c', '42'],
      ['judge-model', JSON.stringify({
        consensus: ['42'],
        contradictions: [],
        partialCoverage: [],
        uniqueInsights: [],
        blindSpots: [],
        shouldFuse: false,
      })],
    ])

    const result = await runFusion(
      makeDecision('synthesis'),
      '问题',
      'system',
      makeConfig(),
      makeFauxQueryLlm(responses),
      'prefix-hash',
    )

    // shouldFuse=false → Writer 不综合，取第一个成功回答
    expect(result.finalAnswer).toBe('42')
  })

  it('L3 Panel 缓存命中：第二次相同请求跳过 API', async () => {
    let callCount = 0
    const responses = new Map<string, string>([
      ['model-a', '答案 A'],
      ['model-b', '答案 B'],
      ['model-c', '答案 C'],
      ['judge-model', JSON.stringify({
        consensus: ['答案'],
        contradictions: [],
        partialCoverage: [],
        uniqueInsights: [],
        blindSpots: [],
        shouldFuse: true,
      })],
      ['writer-model', '综合答案'],
    ])

    const fauxLlm = mock(async (_conn: string, modelId: string) => {
      callCount++
      const text = responses.get(modelId)
      if (!text) throw new Error(`no faux response for ${modelId}`)
      return { text, usage: { inputTokens: 100, outputTokens: 50 } }
    }) as QueryLlmAdapter

    // 第一次：全量调用
    const cacheConfig = { ...makeConfig(), panelCacheEnabled: true }
    await runFusion(makeDecision('synthesis'), '问题', 'system', cacheConfig, fauxLlm, 'prefix-hash')
    const firstCallCount = callCount

    // 第二次：panel 应命中缓存
    callCount = 0
    await runFusion(makeDecision('synthesis'), '问题', 'system', cacheConfig, fauxLlm, 'prefix-hash')

    // panel 应被缓存，只有 judge + writer 被调用
    expect(callCount).toBeLessThan(firstCallCount)
  })
})
