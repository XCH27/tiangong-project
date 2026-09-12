import { describe, expect, it } from 'bun:test'
import { preferLastGood, raceEndpoints } from '../endpoint-race'

const LAN = 'ws://192.168.1.20:9100'
const OVERLAY = 'ws://100.92.3.4:9100'
const DEAD = 'ws://10.9.9.9:9100'

const fast = { staggerMs: 1, preferenceGraceMs: 20, attemptTimeoutMs: 200 }

function connector(behaviour: Record<string, { ok: boolean; delayMs?: number }>) {
  const called: string[] = []
  return {
    called,
    connect: async (endpoint: string) => {
      called.push(endpoint)
      const spec = behaviour[endpoint] ?? { ok: false }
      if (spec.delayMs) await new Promise((r) => setTimeout(r, spec.delayMs))
      if (!spec.ok) throw new Error(`refused ${endpoint}`)
      return endpoint
    },
  }
}

describe('raceEndpoints', () => {
  it('returns nothing for an empty candidate list', async () => {
    const result = await raceEndpoints([], async () => 'x', fast)
    expect(result).toEqual({ endpoint: null, attempts: [] })
  })

  it('takes the only working candidate', async () => {
    const { connect } = connector({ [OVERLAY]: { ok: true } })
    const result = await raceEndpoints([DEAD, OVERLAY], connect, fast)
    expect(result.endpoint).toBe(OVERLAY)
    expect(result.value).toBe(OVERLAY)
  })

  it('prefers the higher-ranked candidate when both work', async () => {
    const { connect } = connector({
      [LAN]: { ok: true, delayMs: 30 },
      [OVERLAY]: { ok: true },
    })
    const result = await raceEndpoints([LAN, OVERLAY], connect, fast)
    expect(result.endpoint).toBe(LAN)
  })

  it('does not wait forever for a better-ranked candidate that never answers', async () => {
    const { connect } = connector({
      [LAN]: { ok: false, delayMs: 5_000 },
      [OVERLAY]: { ok: true },
    })
    const started = Date.now()
    const result = await raceEndpoints([LAN, OVERLAY], connect, fast)
    expect(result.endpoint).toBe(OVERLAY)
    expect(Date.now() - started).toBeLessThan(1_000)
  })

  it('tries candidates concurrently rather than one timeout after another', async () => {
    const { connect, called } = connector({
      [DEAD]: { ok: false, delayMs: 150 },
      [LAN]: { ok: false, delayMs: 150 },
      [OVERLAY]: { ok: true, delayMs: 10 },
    })
    const started = Date.now()
    const result = await raceEndpoints([DEAD, LAN, OVERLAY], connect, fast)
    expect(result.endpoint).toBe(OVERLAY)
    // Serial would be 150 + 150 + 10; overlapping must beat that clearly.
    expect(Date.now() - started).toBeLessThan(250)
    expect(called).toHaveLength(3)
  })

  it('reports every attempt and the highest-ranked failure when all fail', async () => {
    const { connect } = connector({})
    const result = await raceEndpoints([LAN, OVERLAY], connect, fast)
    expect(result.endpoint).toBeNull()
    expect(result.attempts.map((a) => a.ok)).toEqual([false, false])
    expect(result.error).toBe(`refused ${LAN}`)
  })

  it('times a single hanging candidate out instead of hanging the race', async () => {
    const { connect } = connector({ [LAN]: { ok: true, delayMs: 5_000 } })
    const result = await raceEndpoints([LAN], connect, { ...fast, attemptTimeoutMs: 30 })
    expect(result.endpoint).toBeNull()
    expect(result.attempts[0]!.error).toBe('ENDPOINT_TIMEOUT')
  })
})

describe('preferLastGood', () => {
  it('moves the last working endpoint to the front, keeping the rest in order', () => {
    expect(preferLastGood([LAN, OVERLAY, DEAD], OVERLAY)).toEqual([OVERLAY, LAN, DEAD])
  })

  it('leaves the list alone when there is no last-good, or it is gone', () => {
    expect(preferLastGood([LAN, OVERLAY], undefined)).toEqual([LAN, OVERLAY])
    expect(preferLastGood([LAN, OVERLAY], 'ws://nope:1')).toEqual([LAN, OVERLAY])
  })
})
