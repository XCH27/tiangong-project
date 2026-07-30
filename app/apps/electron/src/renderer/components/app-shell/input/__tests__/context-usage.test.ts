import { describe, expect, it } from 'bun:test'
import {
  hasKnownContextUsage,
  projectContextUsage,
  resolveContextWindow,
} from '../context-usage'

describe('context usage projection', () => {
  it('uses current provider input against the model limit', () => {
    expect(projectContextUsage(25_000, 100_000)).toEqual({
      currentInputTokens: 25_000,
      contextWindow: 100_000,
      percent: 25,
      remainingTokens: 75_000,
    })
  })

  it('keeps an unknown model limit unknown', () => {
    expect(projectContextUsage(25_000)).toEqual({
      currentInputTokens: 25_000,
      contextWindow: null,
      percent: null,
      remainingTokens: null,
    })
  })

  it('keeps the context indicator visible at zero tokens when the model limit is known', () => {
    const usage = projectContextUsage(0, 100_000)

    expect(usage.percent).toBe(0)
    expect(hasKnownContextUsage(usage)).toBe(true)
  })

  it('hides the context indicator only when the model limit is unknown', () => {
    expect(hasKnownContextUsage(projectContextUsage(0))).toBe(false)
  })

  it('clamps exhausted context without fabricating extra capacity', () => {
    expect(projectContextUsage(120_000, 100_000).percent).toBe(100)
    expect(projectContextUsage(120_000, 100_000).remainingTokens).toBe(0)
  })

  it('uses connection-discovered limits for dynamic Pi models', () => {
    expect(resolveContextWindow(
      undefined,
      'deepseek-v4-pro',
      [{
        id: 'pi/deepseek-v4-pro',
        contextWindow: 128_000,
      }],
    )).toBe(128_000)
  })

  it('keeps provider-reported limits authoritative', () => {
    expect(resolveContextWindow(
      200_000,
      'deepseek-v4-pro',
      [{ id: 'deepseek-v4-pro', contextWindow: 128_000 }],
      64_000,
    )).toBe(200_000)
  })
})
