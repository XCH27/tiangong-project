import { describe, expect, it } from 'bun:test'
import {
  getThinkingLevelsForModel,
  modelSupportsFastMode,
  type ModelDefinition,
} from '../models.ts'
import {
  connectionSupportsFastMode,
  getMiniModel,
  getSummarizationModel,
  resolveConnectionModelDefinition,
} from '../llm-connections.ts'
import { piModelToDefinition } from '../models-pi.ts'
import type { Api, Model } from '@earendil-works/pi-ai'

const model = (patch: Partial<ModelDefinition> = {}): ModelDefinition => ({
  id: 'test-model',
  name: 'Test',
  shortName: 'Test',
  description: '',
  provider: 'pi',
  contextWindow: 128_000,
  ...patch,
})

describe('model capability resolution', () => {
  it('hides effort when a provider explicitly denies it, even if stale values are present', () => {
    expect(getThinkingLevelsForModel(model({
      supportsThinking: false,
      supportedReasoningEfforts: ['low', 'high'],
    }))).toEqual([])
  })

  it('uses provider-advertised effort values instead of the global six-tier list', () => {
    expect(getThinkingLevelsForModel(model({
      supportedReasoningEfforts: ['low', 'high', 'default', 'unknown'],
    })).map(level => level.id)).toEqual(['low', 'medium', 'high'])
  })

  it('does not invent an effort vocabulary from a generic reasoning flag', () => {
    expect(getThinkingLevelsForModel(model({ supportsThinking: true }))).toEqual([])
  })

  it('does not guess reasoning support when capability metadata is absent', () => {
    expect(getThinkingLevelsForModel(model())).toEqual([])
  })

  it('does not guess capabilities for a bare custom-endpoint model id', () => {
    expect(getThinkingLevelsForModel('custom-model')).toEqual([])
  })

  it('only exposes fast mode when the model explicitly advertises it', () => {
    expect(modelSupportsFastMode(model())).toBe(false)
    expect(modelSupportsFastMode(model({ supportsFastMode: true }))).toBe(true)
    expect(modelSupportsFastMode('custom-model')).toBe(false)
  })

  it('matches the current first-party Anthropic fast-mode model', () => {
    expect(modelSupportsFastMode(resolveConnectionModelDefinition({
      providerType: 'anthropic',
      models: [],
    }, 'claude-opus-4-8'))).toBe(true)
    expect(modelSupportsFastMode(resolveConnectionModelDefinition({
      providerType: 'anthropic',
      models: [],
    }, 'claude-opus-4-7'))).toBe(false)
  })

  it('requires the first-party Anthropic transport for fast mode', () => {
    expect(connectionSupportsFastMode({
      providerType: 'anthropic',
      models: [],
    }, 'claude-opus-4-8')).toBe(true)
    expect(connectionSupportsFastMode({
      providerType: 'pi',
      piAuthProvider: 'amazon-bedrock',
      models: [],
    }, 'claude-opus-4-8')).toBe(false)
    expect(connectionSupportsFastMode({
      providerType: 'pi_compat',
      models: ['claude-opus-4-8'],
    }, 'claude-opus-4-8')).toBe(false)
  })

  it('does not borrow built-in capabilities for compatible endpoints', () => {
    expect(resolveConnectionModelDefinition({
      providerType: 'pi_compat',
      models: [],
    }, 'claude-opus-4-8')).toBeUndefined()
  })

  it('does not expose an effort control for a reasoning model whose provider rejects it', () => {
    const definition = piModelToDefinition({
      id: 'grok-4.5',
      name: 'Grok 4.5',
      api: 'openai-completions',
      provider: 'xai',
      baseUrl: 'https://api.x.ai/v1',
      reasoning: true,
      input: ['text'],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 256_000,
      maxTokens: 32_000,
      compat: { supportsReasoningEffort: false },
    } as Model<Api>)

    expect(definition.supportsThinking).toBe(false)
    expect(getThinkingLevelsForModel(definition)).toEqual([])
  })

  it('uses Pi standard defaults but requires explicit opt-in for xhigh and max', () => {
    const definition = piModelToDefinition({
      id: 'adaptive-model',
      name: 'Adaptive model',
      api: 'anthropic-messages',
      provider: 'anthropic',
      baseUrl: 'https://api.anthropic.com',
      reasoning: true,
      thinkingLevelMap: { off: null, max: 'max' },
      input: ['text'],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 200_000,
      maxTokens: 32_000,
    } as Model<Api>)

    expect(getThinkingLevelsForModel(definition).map(level => level.id))
      .toEqual(['minimal', 'low', 'medium', 'high', 'max'])
  })
})

describe('utility model resolution', () => {
  const connection = {
    providerType: 'pi' as const,
    piAuthProvider: 'openai',
    models: [
      model({ id: 'large-model', name: 'Large' }),
      model({ id: 'fast-mini', name: 'Fast Mini' }),
    ],
  }

  it('uses one explicit utility override for mini and summarization work', () => {
    const configured = { ...connection, utilityModel: 'large-model' }
    expect(getMiniModel(configured)).toBe('large-model')
    expect(getSummarizationModel(configured)).toBe('large-model')
  })

  it('falls back to provider-aware automatic selection when the override is empty', () => {
    const configured = { ...connection, utilityModel: '' }
    expect(getMiniModel(configured)).toBe('fast-mini')
    expect(getSummarizationModel(configured)).toBe('fast-mini')
  })
})

describe('connection model capability authority', () => {
  it('prefers runtime-discovered connection metadata over the static registry', () => {
    const discovered = model({
      id: 'pi/runtime-model',
      supportedReasoningEfforts: ['low', 'high'],
      supportsThinking: true,
    })
    expect(resolveConnectionModelDefinition({
      providerType: 'pi',
      piAuthProvider: 'openai',
      models: [discovered],
    }, 'runtime-model')).toBe(discovered)
  })

  it('does not invent capabilities for a string-only custom endpoint model', () => {
    expect(resolveConnectionModelDefinition({
      providerType: 'pi_compat',
      models: ['private-model'],
    }, 'private-model')).toBeUndefined()
  })
})
