/**
 * verification-runner faux 单测（零网络）
 *
 * 断言：
 * - schema 校验通过/失败信号正确采集
 * - test/lint hooks 信号采集
 * - 模型交叉验证 passed=true/false 路径
 * - 全部信号通过 → report.passed=true
 * - 任一信号失败 → report.passed=false + issues 含该信号
 * - verification disabled → 不跑模型交叉验证
 * - 模型调用失败降级通过
 * - evidenceLedger 诚实标注来源
 */

import { describe, it, expect, mock } from 'bun:test'
import { runVerificationWithSignals } from '../verification-runner.ts'
import type { VerificationHooks, VerificationSignal } from '../verification-runner.ts'
import type { QueryLlmAdapter } from '../fusion-pipeline.ts'
import type { FusionConfig, FusionResult } from '../fusion-types.ts'

function makeConfig(overrides: Partial<FusionConfig> = {}): FusionConfig {
  return {
    panel: [],
    judgeModel: { connectionSlug: 'conn-j', modelId: 'judge-model' },
    writerModel: { connectionSlug: 'conn-w', modelId: 'writer-model' },
    fusionDepth: 0,
    budgetCap: { maxTokens: 50000, maxPanelists: 3 },
    verification: { enabled: true, models: ['verifier-a', 'verifier-b'] },
    ...overrides,
  }
}

function makeFusionResult(actionPlan: unknown = { steps: [{ kind: 'set_style' }] }): FusionResult {
  return {
    finalAnswer: 'final',
    actionPlan,
    panelResults: [],
    judgeAnalysis: { consensus: [], contradictions: [], partialCoverage: [], uniqueInsights: [], blindSpots: [], shouldFuse: true },
    totalTokens: 0,
    totalCostUsd: 0,
    cascadeUpgrades: 0,
  }
}

function makeFauxQueryLlm(responses: Map<string, string>): QueryLlmAdapter {
  return mock(async (_conn: string, modelId: string, _prompt: string) => {
    const text = responses.get(modelId)
    if (!text) throw new Error(`no faux response for ${modelId}`)
    return { text, usage: { inputTokens: 50, outputTokens: 20 } }
  }) as QueryLlmAdapter
}

describe('runVerificationWithSignals', () => {
  it('schema + test + lint 全通过 → passed=true', async () => {
    const hooks: VerificationHooks = {
      validateSchema: () => ({ kind: 'schema', source: 'schema-validator', passed: true, evidence: 'actual' }),
      runTests: () => ({ kind: 'test', source: 'test-runner', passed: true, evidence: 'actual' }),
      runLint: () => ({ kind: 'lint', source: 'lint-runner', passed: true, evidence: 'actual' }),
    }
    const responses = new Map([
      ['verifier-a', JSON.stringify({ passed: true, issues: [], confidence: 0.95 })],
      ['verifier-b', JSON.stringify({ passed: true, issues: [], confidence: 0.9 })],
    ])

    const report = await runVerificationWithSignals(
      makeFusionResult(),
      'task',
      makeConfig(),
      makeFauxQueryLlm(responses),
      hooks,
    )

    expect(report.passed).toBe(true)
    expect(report.signals).toHaveLength(5)
    expect(report.issues).toHaveLength(0)
  })

  it('schema 失败 → passed=false + issues 含 schema', async () => {
    const hooks: VerificationHooks = {
      validateSchema: () => ({ kind: 'schema', source: 'schema-validator', passed: false, detail: '缺少 kind 字段', evidence: 'actual' }),
    }
    const responses = new Map([
      ['verifier-a', JSON.stringify({ passed: true, issues: [] })],
      ['verifier-b', JSON.stringify({ passed: true, issues: [] })],
    ])

    const report = await runVerificationWithSignals(
      makeFusionResult(),
      'task',
      makeConfig(),
      makeFauxQueryLlm(responses),
      hooks,
    )

    expect(report.passed).toBe(false)
    expect(report.issues.some(i => i.startsWith('schema:'))).toBe(true)
  })

  it('test 失败 → passed=false', async () => {
    const hooks: VerificationHooks = {
      runTests: () => ({ kind: 'test', source: 'test-runner', passed: false, detail: '2 tests failed', evidence: 'actual' }),
    }
    const responses = new Map([
      ['verifier-a', JSON.stringify({ passed: true, issues: [] })],
    ])

    const report = await runVerificationWithSignals(
      makeFusionResult(),
      'task',
      makeConfig({ verification: { enabled: true, models: ['verifier-a'] } }),
      makeFauxQueryLlm(responses),
      hooks,
    )

    expect(report.passed).toBe(false)
    expect(report.issues.some(i => i.startsWith('test:'))).toBe(true)
  })

  it('模型交叉验证 passed=false → passed=false', async () => {
    const responses = new Map([
      ['verifier-a', JSON.stringify({ passed: false, issues: ['逻辑不自洽'], confidence: 0.4 })],
      ['verifier-b', JSON.stringify({ passed: true, issues: [], confidence: 0.9 })],
    ])

    const report = await runVerificationWithSignals(
      makeFusionResult(),
      'task',
      makeConfig(),
      makeFauxQueryLlm(responses),
    )

    expect(report.passed).toBe(false)
    expect(report.issues.some(i => i.includes('verifier-a'))).toBe(true)
  })

  it('verification disabled → 不跑模型交叉验证', async () => {
    let called = false
    const fauxLlm = mock(async () => { called = true; return { text: '', usage: undefined } }) as QueryLlmAdapter

    const report = await runVerificationWithSignals(
      makeFusionResult(),
      'task',
      makeConfig({ verification: { enabled: false } }),
      fauxLlm,
    )

    expect(called).toBe(false)
    expect(report.signals).toHaveLength(0)
    expect(report.passed).toBe(true)
  })

  it('模型调用失败 → 降级通过 + evidence=unknown', async () => {
    const fauxLlm = mock(async () => { throw new Error('网络断开') }) as QueryLlmAdapter

    const report = await runVerificationWithSignals(
      makeFusionResult(),
      'task',
      makeConfig({ verification: { enabled: true, models: ['verifier-a'] } }),
      fauxLlm,
    )

    expect(report.passed).toBe(true)
    expect(report.signals).toHaveLength(1)
    expect(report.signals[0].evidence).toBe('unknown')
    expect(report.signals[0].detail).toContain('降级')
  })

  it('模型输出非 JSON → 降级通过 + evidence=unknown', async () => {
    const responses = new Map([
      ['verifier-a', '这不是 JSON，只是一段文字'],
    ])

    const report = await runVerificationWithSignals(
      makeFusionResult(),
      'task',
      makeConfig({ verification: { enabled: true, models: ['verifier-a'] } }),
      makeFauxQueryLlm(responses),
    )

    expect(report.passed).toBe(true)
    expect(report.signals[0].evidence).toBe('unknown')
  })

  it('evidenceLedger 记录每个信号来源', async () => {
    const hooks: VerificationHooks = {
      validateSchema: () => ({ kind: 'schema', source: 'schema-validator', passed: true, evidence: 'actual' }),
      runLint: () => ({ kind: 'lint', source: 'eslint', passed: true, evidence: 'actual' }),
    }
    const responses = new Map([
      ['verifier-a', JSON.stringify({ passed: true, issues: [] })],
    ])

    const report = await runVerificationWithSignals(
      makeFusionResult(),
      'task',
      makeConfig({ verification: { enabled: true, models: ['verifier-a'] } }),
      makeFauxQueryLlm(responses),
      hooks,
    )

    expect(report.evidenceLedger).toHaveLength(3)
    const sources = report.evidenceLedger.map(e => e.source)
    expect(sources).toContain('schema-validator')
    expect(sources).toContain('eslint')
    expect(sources).toContain('verifier-a')
  })

  it('hook 抛异常 → 降级为 failed 信号 + unknown evidence', async () => {
    const hooks: VerificationHooks = {
      runTests: () => { throw new Error('test runner crash') },
    }
    const responses = new Map([
      ['verifier-a', JSON.stringify({ passed: true, issues: [] })],
    ])

    const report = await runVerificationWithSignals(
      makeFusionResult(),
      'task',
      makeConfig({ verification: { enabled: true, models: ['verifier-a'] } }),
      makeFauxQueryLlm(responses),
      hooks,
    )

    expect(report.passed).toBe(false)
    const testSignal = report.signals.find(s => s.kind === 'test')
    expect(testSignal?.evidence).toBe('unknown')
    expect(testSignal?.detail).toContain('test runner crash')
  })

  it('无 hooks 且模型全通过 → passed=true', async () => {
    const responses = new Map([
      ['verifier-a', JSON.stringify({ passed: true, issues: [] })],
      ['verifier-b', JSON.stringify({ passed: true, issues: [] })],
    ])

    const report = await runVerificationWithSignals(
      makeFusionResult(),
      'task',
      makeConfig(),
      makeFauxQueryLlm(responses),
    )

    expect(report.passed).toBe(true)
    expect(report.signals).toHaveLength(2)
  })

  it('无 hooks 且 verification disabled → passed=true 空信号', async () => {
    const fauxLlm = mock(async () => ({ text: '', usage: undefined })) as QueryLlmAdapter

    const report = await runVerificationWithSignals(
      makeFusionResult(),
      'task',
      makeConfig({ verification: { enabled: false } }),
      fauxLlm,
    )

    expect(report.passed).toBe(true)
    expect(report.signals).toHaveLength(0)
    expect(report.issues).toHaveLength(0)
  })

  it('render hook 信号采集', async () => {
    const hooks: VerificationHooks = {
      runRender: (): VerificationSignal => ({ kind: 'render', source: 'render-checker', passed: false, detail: '渲染超时', evidence: 'actual' }),
    }
    const responses = new Map([
      ['verifier-a', JSON.stringify({ passed: true, issues: [] })],
    ])

    const report = await runVerificationWithSignals(
      makeFusionResult(),
      'task',
      makeConfig({ verification: { enabled: true, models: ['verifier-a'] } }),
      makeFauxQueryLlm(responses),
      hooks,
    )

    expect(report.passed).toBe(false)
    expect(report.issues.some(i => i.startsWith('render:'))).toBe(true)
  })
})
