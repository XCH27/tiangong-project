import { describe, expect, it } from 'bun:test'
import {
  PRICING_STALE_AFTER_MS,
  comparePricing,
  computeTurnCost,
  formatCost,
  isPricingStale,
  ratesFor,
  type ModelPricing,
} from '../model-pricing'

const flat: ModelPricing = {
  currency: 'USD',
  base: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
}

const tiered: ModelPricing = {
  ...flat,
  tiers: [{
    minContextTokens: 200_000,
    rates: { input: 6, output: 22.5, cacheRead: 0.6, cacheWrite: 7.5 },
  }],
}

const usage = (patch: Partial<Record<'input' | 'output' | 'cacheRead' | 'cacheWrite', number>> = {}) => ({
  input: 0, output: 0, cacheRead: 0, cacheWrite: 0, ...patch,
})

describe('cache is priced separately', () => {
  // Collapsing cache into "input" makes a cache-heavy agent look expensive and a
  // cache-cold one look cheap — backwards for deciding what to delegate.
  it('charges reads and writes at their own rates', () => {
    const cost = computeTurnCost(usage({ cacheRead: 1_000, cacheWrite: 1_000 }), flat)
    expect(cost.cacheRead).toBeCloseTo(0.0003, 10)
    expect(cost.cacheWrite).toBeCloseTo(0.00375, 10)
  })

  it('reflects that a write costs more than fresh input and a read far less', () => {
    expect(flat.base.cacheWrite).toBeGreaterThan(flat.base.input)
    expect(flat.base.cacheRead).toBeLessThan(flat.base.input)
  })
})

describe('context tiers', () => {
  it('applies the higher rate above the threshold', () => {
    const long = computeTurnCost(usage({ input: 250_000 }), tiered)
    const short = computeTurnCost(usage({ input: 250_000 }), flat)
    expect(long.input).toBeGreaterThan(short.input)
  })

  // Output does not retroactively change the input rate.
  it('selects the tier from input-side context only', () => {
    expect(ratesFor(tiered, 250_000).input).toBe(6)
    expect(ratesFor(tiered, 100_000).input).toBe(3)
  })

  // A catalog assembled from several providers has no reason to arrive ordered,
  // and picking the wrong tier is a silent pricing error.
  it('picks the highest applicable tier regardless of declaration order', () => {
    const unordered: ModelPricing = {
      ...flat,
      tiers: [
        { minContextTokens: 400_000, rates: { input: 9, output: 0, cacheRead: 0, cacheWrite: 0 } },
        { minContextTokens: 200_000, rates: { input: 6, output: 0, cacheRead: 0, cacheWrite: 0 } },
      ],
    }
    expect(ratesFor(unordered, 250_000).input).toBe(6)
    expect(ratesFor(unordered, 450_000).input).toBe(9)
  })
})

describe('unknown and subscription pricing', () => {
  it('reports unknown pricing as estimated rather than free', () => {
    const cost = computeTurnCost(usage({ input: 1_000_000, output: 1_000_000 }), undefined)
    expect(cost.estimated).toBe(true)
    expect(cost.total).toBe(0)
  })

  // Real usage against a paid allowance is not a charge, but it is not free.
  it('computes the equivalent cost of a subscription turn and flags it', () => {
    const cost = computeTurnCost(usage({ input: 1_000_000 }), { ...flat, subscription: true })
    expect(cost.subscription).toBe(true)
    expect(cost.total).toBeGreaterThan(0)
  })
})

describe('comparison for routing', () => {
  const shape = usage({ input: 1_000_000, output: 1_000_000 })

  // An allowance left unused is money already spent.
  it('sorts a subscription ahead of a cheap metered model', () => {
    expect(comparePricing(
      { pricing: { ...flat, subscription: true } },
      { pricing: { currency: 'USD', base: { input: 0.1, output: 0.1, cacheRead: 0, cacheWrite: 0 } } },
      shape,
    )).toBeLessThan(0)
  })

  // Guessing in its favour is how an expensive model becomes the silent default.
  it('sorts unknown pricing last', () => {
    expect(comparePricing({ pricing: flat }, {}, shape)).toBeLessThan(0)
  })

  // Comparing input rates alone ranks models wrongly on generation work.
  it('reverses the ranking when the task is output-heavy', () => {
    const cheapInput = { pricing: { currency: 'USD' as const, base: { input: 1, output: 60, cacheRead: 0, cacheWrite: 0 } } }
    const evenRates = { pricing: { currency: 'USD' as const, base: { input: 5, output: 5, cacheRead: 0, cacheWrite: 0 } } }
    expect(comparePricing(cheapInput, evenRates, usage({ input: 1_000, output: 1_000_000 })))
      .toBeGreaterThan(0)
  })
})

describe('staleness and display', () => {
  it('treats undated pricing as stale', () => {
    expect(isPricingStale(flat, 0)).toBe(true)
    expect(isPricingStale({ ...flat, updatedAt: 0 }, PRICING_STALE_AFTER_MS - 1)).toBe(false)
    expect(isPricingStale({ ...flat, updatedAt: 0 }, PRICING_STALE_AFTER_MS + 1)).toBe(true)
  })

  it('gives sub-cent amounts the precision a currency formatter drops', () => {
    expect(formatCost(0)).toBe('$0.00')
    expect(formatCost(0.0004)).toBe('$0.0004')
  })
})
