import { describe, expect, it } from 'bun:test'
import {
  parseClaudeCachedModels,
  parseOpenCodeVerboseModels,
} from './cli-runtime-handshake'

describe('CLI runtime capability handshake parsers', () => {
  it('projects OpenCode model metadata without running a prompt', () => {
    const models = parseOpenCodeVerboseModels(`opencode/test-model
{
  "name": "Test Model",
  "limit": { "context": 200000 },
  "capabilities": {
    "reasoning": true,
    "input": { "text": true, "image": true, "audio": false }
  },
  "variants": { "low": {}, "high": {} }
}`)
    expect(models).toEqual([{
      id: 'opencode/test-model',
      name: 'Test Model',
      contextWindow: 200000,
      supportedReasoningEfforts: ['low', 'high'],
      inputModalities: ['text', 'image'],
    }])
  })

  it('projects Claude Code cached models and negotiated effort vocabulary', () => {
    expect(parseClaudeCachedModels({
      additionalModelOptionsCache: [{
        value: 'claude-fable-5[1m]',
        label: 'Fable',
        description: 'Fable 5',
      }],
    }, ['low', 'high', 'max'])).toEqual([{
      id: 'claude-fable-5[1m]',
      name: 'Fable',
      description: 'Fable 5',
      supportedReasoningEfforts: ['low', 'high', 'max'],
      inputModalities: ['text', 'image'],
    }])
  })
})
