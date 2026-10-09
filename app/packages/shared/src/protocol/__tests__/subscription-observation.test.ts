import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import {
  observeSubscription,
  readSubscription,
  readSubscriptionForAgent,
  readSubscriptionForHuman,
} from '../subscription-observation'

describe('subscription observation', () => {
  test('the reader is shared and does not invent zeros', () => {
    const source = readFileSync(new URL('../subscription-observation.ts', import.meta.url), 'utf8')
    expect(source.includes('readSubscriptionForAgent')).toBe(true)
    expect(source.includes('readSubscriptionForHuman')).toBe(true)
    expect(source.includes('observeSubscription')).toBe(true)

    const raw = {
      providerId: 'openai',
      tier: 'pro',
      apiKey: 'sk-test-secret',
      access_token: 'tok-test',
    }
    const agent = readSubscriptionForAgent(raw)
    const human = readSubscriptionForHuman(raw)
    expect(agent).toEqual({
      providerId: 'openai',
      tier: { state: 'known', value: 'pro' },
      quota: { state: 'unknown' },
      remaining: { state: 'unknown' },
      source: 'provider_response',
    })
    expect(human.observation).toEqual(agent)
    expect(human.tier).toBe('pro')
    expect(human.quota).toBe('unknown')
    expect(human.remaining).toBe('unknown')
    expect(JSON.stringify(agent).includes('sk-test-secret')).toBe(false)
    expect(JSON.stringify(agent).includes('tok-test')).toBe(false)
    expect(readSubscription(agent)).toEqual(human)
  })

  test('an explicit zero stays known and a missing payload stays unknown', () => {
    expect(observeSubscription({ remaining: 0, quota: 0, tier: 'free' })).toEqual({
      tier: { state: 'known', value: 'free' },
      quota: { state: 'known', value: 0 },
      remaining: { state: 'known', value: 0 },
      source: 'provider_response',
    })
    expect(readSubscriptionForHuman({ remaining: 0 }).remaining).toBe('0')
    const empty = readSubscriptionForHuman(undefined)
    expect(empty.tier).toBe('unknown')
    expect(empty.quota).toBe('unknown')
    expect(empty.remaining).toBe('unknown')
    expect(empty.observation.source).toBe('none')
    expect(empty.observation.quota).toEqual({ state: 'unknown' })
  })

  test('non-numeric and blank fields stay unknown', () => {
    const observation = observeSubscription({
      tier: '  ',
      quota: '100',
      remaining: Number.NaN,
      plan: 'plus',
    })
    expect(observation.tier).toEqual({ state: 'unknown' })
    expect(observation.quota).toEqual({ state: 'unknown' })
    expect(observation.remaining).toEqual({ state: 'unknown' })
    const aliased = observeSubscription({ plan: 'plus', limit: 40 })
    expect(aliased.tier).toEqual({ state: 'known', value: 'plus' })
    expect(aliased.quota).toEqual({ state: 'known', value: 40 })
    expect(aliased.remaining).toEqual({ state: 'unknown' })
  })
})
