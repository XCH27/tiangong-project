import { describe, expect, it } from 'bun:test'
import {
  costAmount,
  isCharge,
  resolveModelPricing,
  resolveSessionCost,
  splitUsage,
  totalTokens,
} from '../session-cost.ts'
import type { ModelPricing } from '../model-pricing.ts'

const METERED: ModelPricing = {
  currency: 'USD',
  base: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
}

const SUBSCRIPTION: ModelPricing = { ...METERED, subscription: true }

describe('splitUsage', () => {
  it('subtracts cache tokens out of the inclusive input total', () => {
    expect(splitUsage({ inputTokens: 1000, cacheReadTokens: 600, cacheCreationTokens: 100 }))
      .toEqual({ input: 300, output: 0, cacheRead: 600, cacheWrite: 100 })
  })

  it('clamps at zero when the adapter already reported input exclusively', () => {
    // Anthropic's own `input_tokens` excludes cache. Going negative here would
    // credit the user for tokens they were billed for.
    const split = splitUsage({ inputTokens: 300, cacheReadTokens: 600, cacheCreationTokens: 100 })
    expect(split.input).toBe(0)
    expect(split.cacheRead).toBe(600)
  })
})

describe('resolveSessionCost', () => {
  it('prefers what the provider reported over what we could derive', () => {
    // The invoice is generated from the provider's meter, so our arithmetic
    // disagreeing with it is a discrepancy with no upside.
    const cost = resolveSessionCost(
      { inputTokens: 1_000_000, outputTokens: 0, costUsd: 2.5 },
      METERED,
    )
    expect(cost).toEqual({ provenance: 'reported', amount: 2.5 })
  })

  it('does not believe a zero cost when tokens moved', () => {
    // This is the storage default showing through, not a free turn.
    const cost = resolveSessionCost(
      { inputTokens: 1_000_000, outputTokens: 1_000_000, costUsd: 0 },
      METERED,
    )
    expect(cost.provenance).toBe('derived')
    expect(costAmount(cost)).toBeCloseTo(18, 6)
  })

  it('believes a zero cost when nothing moved', () => {
    expect(resolveSessionCost({ inputTokens: 0, outputTokens: 0, costUsd: 0 }, METERED))
      .toEqual({ provenance: 'reported', amount: 0 })
  })

  it('reports unknown rather than zero when there are no rates', () => {
    // The whole point: an OpenAI-compatible endpoint reports no cost, and
    // rendering its `0` as "$0.00" tells the user their spend is nothing.
    const cost = resolveSessionCost({ inputTokens: 500_000, outputTokens: 200_000 }, undefined)
    expect(cost).toEqual({ provenance: 'unknown' })
    expect(isCharge(cost)).toBe(false)
  })

  it('separates subscription draw from money spent', () => {
    const cost = resolveSessionCost({ inputTokens: 1_000_000, outputTokens: 0 }, SUBSCRIPTION)
    expect(cost.provenance).toBe('subscription')
    expect(isCharge(cost)).toBe(false)
    // Still valued, because an allowance consumed is not an allowance available.
    expect(costAmount(cost)).toBeGreaterThan(0)
  })

  it('is unknown when there is no usage at all', () => {
    expect(resolveSessionCost(undefined, METERED)).toEqual({ provenance: 'unknown' })
  })
})

describe('resolveModelPricing', () => {
  const REGISTRY: ModelPricing = {
    currency: 'USD',
    base: { input: 99, output: 99, cacheRead: 99, cacheWrite: 99 },
  }
  const fromRegistry = (id: string) => (id === 'known' ? { pricing: REGISTRY } : undefined)

  it('prefers the rate the user stated over the bundled one', () => {
    // For a custom endpoint the registry is guessing and the user is reading a
    // contract, so the user wins even when both exist.
    const pricing = resolveModelPricing(
      'known',
      [{ modelPricing: { known: METERED } }],
      fromRegistry,
    )
    expect(pricing).toBe(METERED)
  })

  it('falls back to the registry when nothing was stated', () => {
    expect(resolveModelPricing('known', [{}], fromRegistry)).toBe(REGISTRY)
  })

  it('is undefined for a model nobody priced', () => {
    // This is what makes the CN providers show "no rate" instead of "$0.00".
    expect(resolveModelPricing('mystery', [{}], fromRegistry)).toBeUndefined()
  })

  it('is undefined when no model was recorded at all', () => {
    expect(resolveModelPricing(undefined, [{ modelPricing: { x: METERED } }])).toBeUndefined()
  })

  it('takes the first connection that states a rate', () => {
    const other: ModelPricing = { ...METERED, base: { ...METERED.base, input: 1 } }
    expect(
      resolveModelPricing('m', [{ modelPricing: { m: METERED } }, { modelPricing: { m: other } }]),
    ).toBe(METERED)
  })
})

describe('totalTokens', () => {
  it('counts input and output, not cache reads twice', () => {
    // cacheReadTokens is already inside inputTokens; adding it double-counts.
    expect(totalTokens({ inputTokens: 1000, outputTokens: 200, cacheReadTokens: 800 }))
      .toBe(1200)
  })
})
