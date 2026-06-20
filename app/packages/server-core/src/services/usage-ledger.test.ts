import { describe, expect, it } from 'bun:test'
import {
  computeUsageLedger,
  ledgerFromTokenUsage,
  describeCost,
  summarizeReal,
  type UsageLedger,
} from './usage-ledger'
import type { TokenUsage } from '@craft-agent/core/types'

describe('usage-ledger (T-USAGE v1)', () => {
  const SESSION = 'sess-usage-1'

  it('exposes only real numbers from tokenUsage; absent cache stays undefined', () => {
    const tu: Partial<TokenUsage> & { contextWindow?: number } = {
      inputTokens: 1234,
      outputTokens: 567,
      totalTokens: 1801,
      contextTokens: 1234,
      costUsd: 0,
      // deliberately no cache* and no contextWindow
    }

    const ledger = computeUsageLedger({ sessionId: SESSION, tokenUsage: tu })

    expect(ledger.real.inputTokens).toBe(1234)
    expect(ledger.real.outputTokens).toBe(567)
    expect(ledger.real.cacheReadTokens).toBeUndefined()
    expect(ledger.real.cacheCreationTokens).toBeUndefined()
    expect(ledger.reportedCostUsd).toBe(0)
    expect(ledger.contextWindow).toBeUndefined()
    expect(ledger.estimatedContextPercent).toBeUndefined()
    // notes should mention absent cache
    expect(ledger.notes.some((n) => n.includes('未报告缓存读写数据'))).toBe(true)
  })

  it('carries real cache values when provider actually reported them (non-zero or zero)', () => {
    const tu = {
      inputTokens: 800,
      outputTokens: 120,
      costUsd: 0.0023,
      cacheReadTokens: 300,
      cacheCreationTokens: 50,
      contextWindow: 128000,
    }

    const ledger = computeUsageLedger({ sessionId: SESSION, tokenUsage: tu })

    expect(ledger.real.cacheReadTokens).toBe(300)
    expect(ledger.real.cacheCreationTokens).toBe(50)
    expect(ledger.reportedCostUsd).toBe(0.0023)
    expect(ledger.costAttribution).toBe('provider-reported')
    expect(ledger.estimatedContextPercent).toBeCloseTo(800 / 128000, 6)
    expect(ledger.notes.some((n) => n.includes('provider'))).toBe(false) // no need
  })

  it('classifies cost as local-no-api-cost for none auth or local-like slugs/models', () => {
    const tu: any = { inputTokens: 100, outputTokens: 10, costUsd: 0 }

    const l1 = computeUsageLedger({
      sessionId: SESSION,
      tokenUsage: tu,
      connection: { authType: 'none', slug: 'ollama-local' },
    })
    expect(l1.costAttribution).toBe('local-no-api-cost')
    expect(describeCost(l1)).toContain('本地运行')

    const l2 = computeUsageLedger({
      sessionId: SESSION,
      tokenUsage: tu,
      connection: { slug: 'my-ollama', baseUrl: 'http://127.0.0.1:11434' },
      model: 'llama3',
    })
    expect(l2.costAttribution).toBe('local-no-api-cost')

    const l3 = computeUsageLedger({
      sessionId: SESSION,
      tokenUsage: tu,
      connection: { slug: 'cli-grok', name: 'Local CLI' },
    })
    expect(l3.costAttribution).toBe('local-no-api-cost')
  })

  it('never treats local/CLI as provider-reported spend even if cost field is 0', () => {
    const tu: any = { inputTokens: 50, outputTokens: 5, costUsd: 0 }

    const ledger = computeUsageLedger({
      sessionId: SESSION,
      tokenUsage: tu,
      connection: { authType: 'none' },
      model: 'qwen-local',
    })

    expect(ledger.costAttribution).not.toBe('provider-reported')
    expect(describeCost(ledger)).not.toMatch(/\$0\./)
    expect(describeCost(ledger).toLowerCase()).toContain('无 api')
  })

  it('provider-reported cost >0 takes precedence over local heuristic', () => {
    const tu: any = { inputTokens: 10, outputTokens: 2, costUsd: 0.0001 }

    const ledger = computeUsageLedger({
      sessionId: SESSION,
      tokenUsage: tu,
      connection: { authType: 'none', slug: 'ollama' }, // even if local shape
    })

    // Positive reported cost is authoritative
    expect(ledger.costAttribution).toBe('provider-reported')
    expect(describeCost(ledger)).toContain('$0.000100')
  })

  it('unknown cost when 0 and no local signals', () => {
    const tu: any = { inputTokens: 200, outputTokens: 30, costUsd: 0 }

    const ledger = computeUsageLedger({
      sessionId: SESSION,
      tokenUsage: tu,
      connection: { slug: 'some-remote', authType: 'api_key' },
    })

    expect(ledger.costAttribution).toBe('unknown')
    expect(describeCost(ledger)).toContain('未知')
  })

  it('does not classify generic client names as local CLI', () => {
    const ledger = computeUsageLedger({
      sessionId: SESSION,
      tokenUsage: { inputTokens: 20, outputTokens: 2, costUsd: 0 },
      connection: { slug: 'acme-client', name: 'Remote Client', authType: 'api_key' },
    })

    expect(ledger.costAttribution).toBe('unknown')
  })

  it('does not estimate context percent when inputTokens is absent', () => {
    const ledger = computeUsageLedger({
      sessionId: SESSION,
      tokenUsage: { outputTokens: 3, costUsd: 0, contextWindow: 128000 },
    })

    expect(ledger.real.inputTokens).toBe(0)
    expect(ledger.contextWindow).toBe(128000)
    expect(ledger.estimatedContextPercent).toBeUndefined()
  })

  it('ledgerFromTokenUsage produces same shape', () => {
    const tu: TokenUsage & { contextWindow?: number } = {
      inputTokens: 42,
      outputTokens: 7,
      totalTokens: 49,
      contextTokens: 42,
      costUsd: 0,
      cacheReadTokens: undefined,
      cacheCreationTokens: undefined,
      contextWindow: 4096,
    }

    const ledger = ledgerFromTokenUsage(SESSION, tu, null, undefined)
    expect(ledger.real.inputTokens).toBe(42)
    expect(ledger.contextWindow).toBe(4096)
    expect(ledger.estimatedContextPercent).toBeCloseTo(42 / 4096)
  })

  it('summarizeReal only reflects present real fields', () => {
    const l = computeUsageLedger({
      sessionId: SESSION,
      tokenUsage: {
        inputTokens: 9,
        outputTokens: 1,
        costUsd: 0,
        cacheReadTokens: 4,
      },
    })
    const s = summarizeReal(l)
    expect(s).toContain('in=9')
    expect(s).toContain('cacheRead=4')
    expect(s).not.toContain('cacheCreate')
  })

  it('a session with zero everything still reports real zeros for input/output', () => {
    const ledger = computeUsageLedger({
      sessionId: SESSION,
      tokenUsage: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
    })
    expect(ledger.real.inputTokens).toBe(0)
    expect(ledger.real.outputTokens).toBe(0)
    expect(ledger.notes.length).toBeGreaterThan(0)
  })
})
