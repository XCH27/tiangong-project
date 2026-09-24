import { describe, expect, it } from 'bun:test'
import {
  resolveCustomEndpointPayload,
  resolvePiAuthProviderForSubmit,
  resolvePresetStateForBaseUrlChange,
} from '../submit-helpers'
import { baseUrlForPiPreset, initialBaseUrlForPreset, resolvePreferredModel } from '../provider-models'

const MODELS = [
  { id: 'pi/zai-best', name: 'Best', costInput: 10, costOutput: 20, contextWindow: 200000, reasoning: true },
  { id: 'pi/zai-balanced', name: 'Balanced', costInput: 5, costOutput: 10, contextWindow: 200000, reasoning: true },
  { id: 'pi/zai-fast', name: 'Fast', costInput: 1, costOutput: 2, contextWindow: 128000, reasoning: false },
]

describe('ApiKeyInput model selection', () => {
  it('preserves an existing default absent from the bundled SDK catalog', () => {
    expect(resolvePreferredModel(MODELS, 'pi/grok-4.7')).toBe('pi/grok-4.7')
    expect(resolvePreferredModel(MODELS)).toBe('')
  })

  it('submits the official xAI preset as a native provider, not a custom endpoint', () => {
    expect(baseUrlForPiPreset('xai', 'https://api.x.ai/v1/')).toBeUndefined()
    expect(baseUrlForPiPreset('xai', 'https://other.example/v1')).toBe('https://other.example/v1')
    expect(baseUrlForPiPreset('mistral', 'https://api.mistral.ai/v1/')).toBeUndefined()
    expect(baseUrlForPiPreset('mistral', 'https://other.example/v1')).toBe('https://other.example/v1')
    expect(baseUrlForPiPreset('openrouter', 'https://openrouter.ai/api')).toBe('https://openrouter.ai/api')
  })

  it('initializes a catalog-selected provider with its own endpoint', () => {
    const presets = [
      { key: 'anthropic', url: 'https://api.anthropic.com' },
      { key: 'deepseek', url: 'https://api.deepseek.com' },
    ]
    expect(initialBaseUrlForPreset('deepseek', presets)).toBe('https://api.deepseek.com')
    expect(initialBaseUrlForPreset('deepseek', presets, 'https://example.com')).toBe('https://example.com')
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
