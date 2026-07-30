import { describe, expect, it } from 'bun:test'
import type { ModelDefinition } from '@craft-agent/shared/config'
import { mergeDiscoveredModelCapabilities } from './index'

const model = (
  id: string,
  patch: Partial<ModelDefinition> = {},
): ModelDefinition => ({
  id,
  name: id,
  shortName: id,
  description: '',
  provider: 'pi',
  contextWindow: 128_000,
  ...patch,
})

// The merge deliberately returns `Array<ModelDefinition | string>`: a curated
// list may hold a bare id, and ids with no discovery match are passed through
// untouched. Narrow the same way the implementation does instead of assuming
// every entry is an object.
const idOf = (entry: ModelDefinition | string): string =>
  typeof entry === 'string' ? entry : entry.id

describe('mergeDiscoveredModelCapabilities', () => {
  it('keeps the user-selected model order while hydrating provider capabilities', () => {
    const selected = [
      model('pi/deepseek-v4-pro', {
        supportedReasoningEfforts: undefined,
        supportsThinking: undefined,
      }),
      model('custom/private-model', { name: 'Private model' }),
    ]
    const discovered = [
      model('pi/deepseek-v4-pro', {
        contextWindow: 1_000_000,
        supportsThinking: true,
        supportedReasoningEfforts: ['off', 'high', 'max'],
        supportsFastMode: false,
      }),
      model('pi/deepseek-v4-flash'),
    ]

    const result = mergeDiscoveredModelCapabilities(selected, discovered)

    expect(result.map(idOf)).toEqual([
      'pi/deepseek-v4-pro',
      'custom/private-model',
    ])
    expect(result[0]).toMatchObject({
      contextWindow: 1_000_000,
      supportsThinking: true,
      supportedReasoningEfforts: ['off', 'high', 'max'],
      supportsFastMode: false,
    })
    expect(result[1]).toEqual(selected[1])
  })
})
