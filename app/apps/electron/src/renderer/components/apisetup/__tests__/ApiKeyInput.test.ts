import { describe, expect, it } from 'bun:test'
import {
  resolveCustomEndpointPayload,
  resolvePiAuthProviderForSubmit,
  resolvePresetStateForBaseUrlChange,
} from '../submit-helpers'
import { resolveModelEntry, toSelectedModelPayload } from '../model-selection'

const MODELS = [
  { id: 'pi/zai-alpha', name: 'Alpha', costInput: 10, costOutput: 20, contextWindow: 200000, reasoning: true },
  { id: 'pi/zai-beta', name: 'Beta', costInput: 5, costOutput: 10, contextWindow: 200000, reasoning: true },
  { id: 'pi/zai-gamma', name: 'Gamma', costInput: 1, costOutput: 2, contextWindow: 128000, reasoning: false },
]

describe('ApiKeyInput model selection payload', () => {
  it('preserves the user-selected order without assigning strength tiers', () => {
    const resolved = toSelectedModelPayload(
      ['pi/zai-gamma', 'pi/zai-alpha'],
      MODELS,
    )
    expect(resolved.map((model) => typeof model === 'string' ? model : model.id))
      .toEqual(['pi/zai-gamma', 'pi/zai-alpha'])
  })

  it('keeps a provider model that is newer than the bundled catalog', () => {
    expect(toSelectedModelPayload(['pi/zai-next'], MODELS))
      .toEqual(['pi/zai-next'])
  })

  it('hydrates an unprefixed provider result with Pi capability metadata', () => {
    const [resolved] = toSelectedModelPayload(
      ['zai-alpha'],
      MODELS,
    )

    expect(typeof resolved === 'string' ? resolved : {
      id: resolved.id,
      contextWindow: resolved.contextWindow,
      supportsThinking: resolved.supportsThinking,
    }).toEqual({
      id: 'pi/zai-alpha',
      contextWindow: 200000,
      supportsThinking: true,
    })
  })
})

describe('unified model entry', () => {
  it('selects an exact provider result from the same search field', () => {
    expect(resolveModelEntry('  pi/zai-alpha ', MODELS.map((model) => model.id), []))
      .toEqual({ kind: 'select', modelId: 'pi/zai-alpha' })
  })

  it('keeps the Pi runtime namespace out of provider-facing model entry', () => {
    expect(resolveModelEntry('zai-alpha', MODELS.map((model) => model.id), []))
      .toEqual({ kind: 'select', modelId: 'pi/zai-alpha' })
  })

  it('adds an unknown model id from the same search field', () => {
    expect(resolveModelEntry('zai-next', MODELS.map((model) => model.id), []))
      .toEqual({ kind: 'custom', modelId: 'zai-next' })
  })

  it('does not duplicate an already selected model', () => {
    expect(resolveModelEntry('pi/zai-alpha', MODELS.map((model) => model.id), ['pi/zai-alpha']))
      .toBeNull()
  })
})

describe('resolvePiAuthProviderForSubmit', () => {
  it('preserves the last non-custom provider when custom endpoint mode is selected', () => {
    expect(resolvePiAuthProviderForSubmit('custom', 'openai')).toBe('openai')
  })

  it('defaults custom endpoint mode to anthropic routing when none was selected yet', () => {
    expect(resolvePiAuthProviderForSubmit('custom', null)).toBe('anthropic')
  })

  it('passes through non-custom presets unchanged', () => {
    expect(resolvePiAuthProviderForSubmit('google', 'anthropic')).toBe('google')
  })
})

describe('resolvePresetStateForBaseUrlChange', () => {
  it('updates the remembered provider when the typed URL matches a known preset', () => {
    expect(resolvePresetStateForBaseUrlChange({
      matchedPreset: 'openrouter',
      activePreset: 'custom',
      activePresetHasEmptyUrl: true,
      lastNonCustomPreset: 'anthropic',
    })).toEqual({
      activePreset: 'openrouter',
      lastNonCustomPreset: 'openrouter',
    })
  })

  it('preserves provider routing when editing a provider with an empty default URL', () => {
    expect(resolvePresetStateForBaseUrlChange({
      matchedPreset: 'custom',
      activePreset: 'azure-openai-responses',
      activePresetHasEmptyUrl: true,
      lastNonCustomPreset: 'azure-openai-responses',
    })).toEqual({
      activePreset: 'azure-openai-responses',
      lastNonCustomPreset: 'azure-openai-responses',
    })
  })

  it('falls back to custom while keeping the most recent matched provider', () => {
    expect(resolvePresetStateForBaseUrlChange({
      matchedPreset: 'custom',
      activePreset: 'openrouter',
      activePresetHasEmptyUrl: false,
      lastNonCustomPreset: 'openrouter',
    })).toEqual({
      activePreset: 'custom',
      lastNonCustomPreset: 'openrouter',
    })
  })
})

describe('resolveCustomEndpointPayload', () => {
  const BRANDED = new Set(['manifest'])

  it('routes branded openai-compat presets through openai-completions regardless of toggle', () => {
    expect(resolveCustomEndpointPayload({
      activePreset: 'manifest',
      baseUrl: 'https://app.manifest.build/v1',
      customApi: 'anthropic-messages',
      brandedOpenAiCompatPresets: BRANDED,
      fallbackPiAuthProvider: undefined,
    })).toEqual({
      customEndpoint: { api: 'openai-completions' },
      piAuthProvider: 'openai',
    })
  })

  it('honors the protocol toggle for the generic custom preset', () => {
    expect(resolveCustomEndpointPayload({
      activePreset: 'custom',
      baseUrl: 'https://my-endpoint.example.com',
      customApi: 'anthropic-messages',
      brandedOpenAiCompatPresets: BRANDED,
      fallbackPiAuthProvider: undefined,
    })).toEqual({
      customEndpoint: { api: 'anthropic-messages' },
      piAuthProvider: 'anthropic',
    })
  })

  it('returns no customEndpoint for a standard preset, passing through the fallback piAuth', () => {
    expect(resolveCustomEndpointPayload({
      activePreset: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      customApi: 'openai-completions',
      brandedOpenAiCompatPresets: BRANDED,
      fallbackPiAuthProvider: 'openrouter',
    })).toEqual({
      customEndpoint: undefined,
      piAuthProvider: 'openrouter',
    })
  })

  it('treats branded preset with empty URL as non-custom (no customEndpoint)', () => {
    expect(resolveCustomEndpointPayload({
      activePreset: 'manifest',
      baseUrl: '',
      customApi: 'openai-completions',
      brandedOpenAiCompatPresets: BRANDED,
      fallbackPiAuthProvider: undefined,
    })).toEqual({
      customEndpoint: undefined,
      piAuthProvider: undefined,
    })
  })
})
