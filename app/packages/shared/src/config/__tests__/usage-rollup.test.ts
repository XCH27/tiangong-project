import { describe, expect, it } from 'bun:test'
import {
  coverageIsPartial,
  coverageRatio,
  dayKey,
  formatTokens,
  rollUpUsage,
  type UsageSession,
} from '../usage-rollup.ts'
import type { ModelPricing } from '../model-pricing.ts'

const METERED: ModelPricing = {
  currency: 'USD',
  base: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
}

const DAY = 24 * 60 * 60_000
const T0 = new Date(2026, 6, 20, 12, 0, 0).getTime()

function session(over: Partial<UsageSession> & { id: string }): UsageSession {
  return { lastUsedAt: T0, ...over }
}

const pricedOnly = (id: string | undefined) => (id === 'priced' ? METERED : undefined)

describe('rollUpUsage', () => {
  it('sums tokens and charges across sessions', () => {
    const rollup = rollUpUsage(
      [
        session({ id: 'a', model: 'priced', tokenUsage: { inputTokens: 1_000_000, outputTokens: 0 } }),
        session({ id: 'b', model: 'priced', tokenUsage: { inputTokens: 0, outputTokens: 1_000_000 } }),
      ],
      pricedOnly,
    )
    expect(rollup.totals.sessions).toBe(2)
    expect(rollup.totals.totalTokens).toBe(2_000_000)
    expect(rollup.totals.chargedUsd).toBeCloseTo(18, 6)
    expect(coverageIsPartial(rollup.totals.coverage)).toBe(false)
  })

  it('measures coverage in tokens, not in sessions', () => {
    // One huge unpriced session against thirty tiny priced ones. A session-count
    // ratio would call this 97% covered; it is 2%.
    const sessions: UsageSession[] = [
      session({ id: 'big', model: 'mystery', tokenUsage: { inputTokens: 1_000_000, outputTokens: 0 } }),
    ]
    for (let i = 0; i < 30; i++) {
      sessions.push(session({
        id: `small-${i}`,
        model: 'priced',
        tokenUsage: { inputTokens: 700, outputTokens: 0 },
      }))
    }
    const rollup = rollUpUsage(sessions, pricedOnly)
    expect(coverageRatio(rollup.totals.coverage)).toBeLessThan(0.03)
    expect(coverageIsPartial(rollup.totals.coverage)).toBe(true)
  })

  it('never folds an unpriced session into the charged total', () => {
    const rollup = rollUpUsage(
      [session({ id: 'x', model: 'mystery', tokenUsage: { inputTokens: 5_000_000, outputTokens: 0 } })],
      pricedOnly,
    )
    expect(rollup.totals.chargedUsd).toBe(0)
    expect(rollup.totals.coverage.unpricedTokens).toBe(5_000_000)
  })

  it('groups by model, heaviest first', () => {
    const rollup = rollUpUsage(
      [
        session({ id: 'a', model: 'small', tokenUsage: { inputTokens: 10, outputTokens: 0 } }),
        session({ id: 'b', model: 'large', tokenUsage: { inputTokens: 9_000, outputTokens: 0 } }),
      ],
      pricedOnly,
    )
    expect(rollup.byModel.map((group) => group.key)).toEqual(['large', 'small'])
  })

  it('keeps quiet days as gaps instead of closing them up', () => {
    // Compressing empty days makes a week off look like steady lower usage.
    const rollup = rollUpUsage(
      [
        session({ id: 'a', lastUsedAt: T0, tokenUsage: { inputTokens: 100, outputTokens: 0 } }),
        session({ id: 'b', lastUsedAt: T0 + 3 * DAY, tokenUsage: { inputTokens: 100, outputTokens: 0 } }),
      ],
      pricedOnly,
    )
    expect(rollup.byDay).toHaveLength(4)
    expect(rollup.byDay[1]?.totals.totalTokens).toBe(0)
    expect(rollup.byDay[2]?.totals.totalTokens).toBe(0)
  })

  it('filters the window on last use, not creation', () => {
    const rollup = rollUpUsage(
      [
        session({ id: 'old', lastUsedAt: T0 - 30 * DAY, tokenUsage: { inputTokens: 999, outputTokens: 0 } }),
        session({ id: 'new', lastUsedAt: T0, tokenUsage: { inputTokens: 1, outputTokens: 0 } }),
      ],
      pricedOnly,
      { since: T0 - DAY },
    )
    expect(rollup.totals.sessions).toBe(1)
    expect(rollup.sessions[0]?.session.id).toBe('new')
  })

  it('ranks sessions by tokens so the expensive ones surface', () => {
    const rollup = rollUpUsage(
      [
        session({ id: 'cheap', tokenUsage: { inputTokens: 5, outputTokens: 0 } }),
        session({ id: 'dear', tokenUsage: { inputTokens: 500_000, outputTokens: 0 } }),
      ],
      pricedOnly,
    )
    expect(rollup.sessions[0]?.session.id).toBe('dear')
  })

  it('survives sessions with no usage recorded at all', () => {
    const rollup = rollUpUsage([session({ id: 'empty' })], pricedOnly)
    expect(rollup.totals.totalTokens).toBe(0)
    expect(rollup.totals.chargedUsd).toBe(0)
  })
})

describe('dayKey', () => {
  it('buckets by the reader’s local day', () => {
    // Late-evening local work must not land in tomorrow's bar.
    const lateEvening = new Date(2026, 6, 20, 23, 30, 0).getTime()
    expect(dayKey(lateEvening)).toBe('2026-07-20')
  })
})

describe('formatTokens', () => {
  it('keeps small counts exact', () => {
    expect(formatTokens(4)).toBe('4')
    expect(formatTokens(999)).toBe('999')
  })

  it('compacts larger ones', () => {
    expect(formatTokens(1_500)).toBe('1.5k')
    expect(formatTokens(150_000)).toBe('150k')
    expect(formatTokens(2_400_000)).toBe('2.4M')
  })
})
