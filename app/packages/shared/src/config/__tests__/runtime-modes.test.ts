import { describe, expect, test } from 'bun:test'
import { applyRequestRuntimeMode } from '../../unified-network-interceptor'
import {
  isSelectableGenericRuntimeMode,
  listGenericRuntimeModes,
  resolveSessionRuntimeModePayload,
} from '../runtime-modes'

const definition = {
  runtimeModes: {
    fast: { requestBody: { service_tier: 'priority' } },
    pro: { requestBody: { reasoning: { mode: 'pro' } } },
    nameless: {},
  },
}

describe('generic runtime mode projection', () => {
  test('lists only classified non-fast modes with a request proof', () => {
    const listed = listGenericRuntimeModes(definition)
    expect(listed.map((entry) => entry.id)).toEqual(['pro'])
    expect(listed[0]?.mode.requestBody).toEqual({ reasoning: { mode: 'pro' } })
  })

  test('does not treat fast or unproven names as generic menu rows', () => {
    expect(isSelectableGenericRuntimeMode(definition, 'fast')).toBe(false)
    expect(isSelectableGenericRuntimeMode(definition, 'nameless')).toBe(false)
    expect(isSelectableGenericRuntimeMode(definition, 'pro')).toBe(true)
  })

  test('projects pro independently of the fast toggle', () => {
    expect(resolveSessionRuntimeModePayload({
      runtimeMode: 'pro',
      definition,
    })).toEqual({
      requestBody: { reasoning: { mode: 'pro' } },
    })
  })

  test('merges fast speed with a generic mode without changing model identity', () => {
    expect(resolveSessionRuntimeModePayload({
      fastMode: true,
      runtimeMode: 'pro',
      definition,
    })).toEqual({
      requestBody: {
        service_tier: 'priority',
        reasoning: { mode: 'pro' },
      },
    })
  })

  test('ignores a stored id the current model no longer advertises', () => {
    expect(resolveSessionRuntimeModePayload({
      runtimeMode: 'pro',
      definition: { runtimeModes: { fast: { requestBody: { service_tier: 'priority' } } } },
    })).toBeUndefined()
  })
})

describe('generic runtime mode request assertion', () => {
  test('emits the classified pro body and leaves the model id unchanged', () => {
    const payload = resolveSessionRuntimeModePayload({
      runtimeMode: 'pro',
      definition,
    })
    process.env.CRAFT_MODEL_RUNTIME_MODE = JSON.stringify(payload)
    try {
      const result = applyRequestRuntimeMode({}, {
        model: 'gpt-5.6-sol',
        reasoning: { effort: 'high' },
      })
      expect(result.body).toEqual({
        model: 'gpt-5.6-sol',
        reasoning: { effort: 'high', mode: 'pro' },
      })
    } finally {
      delete process.env.CRAFT_MODEL_RUNTIME_MODE
    }
  })

  test('appends advertised mode headers when they are part of the proof', () => {
    const payload = resolveSessionRuntimeModePayload({
      runtimeMode: 'priority',
      definition: {
        runtimeModes: {
          priority: {
            requestBody: { service_tier: 'priority' },
            requestHeaders: { 'anthropic-beta': 'fast-mode-2026-02-01' },
          },
        },
      },
    })
    process.env.CRAFT_MODEL_RUNTIME_MODE = JSON.stringify(payload)
    try {
      const result = applyRequestRuntimeMode({
        headers: { 'anthropic-beta': 'context-1m-2025-08-07' },
      }, { model: 'claude-opus-4-8' })
      const headers = new Headers(result.init.headers)
      expect(result.body.service_tier).toBe('priority')
      expect(headers.get('anthropic-beta')).toContain('context-1m-2025-08-07')
      expect(headers.get('anthropic-beta')).toContain('fast-mode-2026-02-01')
    } finally {
      delete process.env.CRAFT_MODEL_RUNTIME_MODE
    }
  })
})
