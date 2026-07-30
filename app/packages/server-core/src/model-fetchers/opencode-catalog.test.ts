import { describe, expect, test } from 'bun:test'
import type { LlmConnection, ModelDefinition } from '@craft-agent/shared/config'
import { enrichModelsFromOpenCodeCatalog } from './opencode-catalog'

const connection = {
  providerType: 'pi',
  piAuthProvider: 'openai',
} as Pick<LlmConnection, 'providerType' | 'piAuthProvider'>

const model: ModelDefinition = {
  id: 'pi/gpt-5.6-sol',
  name: 'GPT-5.6 Sol',
  shortName: 'Sol',
  description: '',
  provider: 'pi',
  contextWindow: 1,
  supportsThinking: true,
  supportedReasoningEfforts: ['off', 'low', 'medium', 'high'],
}

describe('OpenCode model catalog enrichment', () => {
  test('keeps one model while projecting official effort values and runtime modes', () => {
    const result = enrichModelsFromOpenCodeCatalog(connection, [model], {
      openai: {
        models: {
          'gpt-5.6-sol': {
            limit: { context: 1_050_000 },
            reasoning: true,
            reasoning_options: [{
              type: 'effort',
              values: ['none', 'low', 'medium', 'high', 'xhigh', 'max'],
            }],
            experimental: {
              modes: {
                fast: { provider: { body: { service_tier: 'priority' } } },
                pro: { provider: { body: { reasoning: { mode: 'pro' } } } },
              },
            },
          },
        },
      },
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.supportedReasoningEfforts)
      .toEqual(['off', 'low', 'medium', 'high', 'xhigh', 'max'])
    expect(result[0]?.runtimeModes?.fast?.requestBody)
      .toEqual({ service_tier: 'priority' })
    expect(result[0]?.runtimeModes?.pro?.requestBody)
      .toEqual({ reasoning: { mode: 'pro' } })
    expect(result[0]?.supportsFastMode).toBe(true)
    expect(result[0]?.contextWindow).toBe(1_050_000)
  })

  test('does not turn runtime modes into duplicate model ids', () => {
    const result = enrichModelsFromOpenCodeCatalog(connection, [model], {
      openai: {
        models: {
          'gpt-5.6-sol': {
            experimental: {
              modes: {
                fast: { provider: { body: { service_tier: 'priority' } } },
              },
            },
          },
        },
      },
    })

    expect(result.map(entry => entry.id)).toEqual(['pi/gpt-5.6-sol'])
  })
})
