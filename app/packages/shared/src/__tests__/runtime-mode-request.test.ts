import { afterEach, describe, expect, test } from 'bun:test'
import { applyRequestRuntimeMode } from '../unified-network-interceptor'

afterEach(() => {
  delete process.env.CRAFT_MODEL_RUNTIME_MODE
})

describe('provider runtime mode request projection', () => {
  test('projects OpenAI priority mode without changing model identity', () => {
    process.env.CRAFT_MODEL_RUNTIME_MODE = JSON.stringify({
      requestBody: { service_tier: 'priority' },
    })
    const result = applyRequestRuntimeMode({}, {
      model: 'gpt-5.6-sol',
      messages: [],
    })

    expect(result.body).toEqual({
      model: 'gpt-5.6-sol',
      messages: [],
      service_tier: 'priority',
    })
  })

  test('deep-merges non-effort provider modes and preserves existing reasoning fields', () => {
    process.env.CRAFT_MODEL_RUNTIME_MODE = JSON.stringify({
      requestBody: { reasoning: { mode: 'pro' } },
    })
    const result = applyRequestRuntimeMode({}, {
      model: 'gpt-5.6-sol',
      reasoning: { effort: 'high' },
    })

    expect(result.body.reasoning).toEqual({ effort: 'high', mode: 'pro' })
  })

  test('appends Anthropic mode beta headers instead of dropping existing betas', () => {
    process.env.CRAFT_MODEL_RUNTIME_MODE = JSON.stringify({
      requestBody: { speed: 'fast' },
      requestHeaders: { 'anthropic-beta': 'fast-mode-2026-02-01' },
    })
    const result = applyRequestRuntimeMode({
      headers: { 'anthropic-beta': 'context-1m-2025-08-07' },
    }, { model: 'claude-opus-4-8' })
    const headers = new Headers(result.init.headers)

    expect(result.body.speed).toBe('fast')
    expect(headers.get('anthropic-beta')).toContain('context-1m-2025-08-07')
    expect(headers.get('anthropic-beta')).toContain('fast-mode-2026-02-01')
  })
})
