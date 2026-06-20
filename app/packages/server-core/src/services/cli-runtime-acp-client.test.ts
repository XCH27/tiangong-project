import { describe, expect, it } from 'bun:test'
import { buildPromptParams, CliRuntimeAcpStdioClient } from './cli-runtime-acp-client'

describe('buildPromptParams', () => {
  it('sends text and optional model/effort using ACP prompt parameter names', () => {
    expect(buildPromptParams('hello', { sessionId: 's1', modelId: 'grok-build', effort: 'low' })).toEqual({
      sessionId: 's1',
      prompt: [{ type: 'text', text: 'hello' }],
      modelId: 'grok-build',
      reasoningEffort: 'low',
    })
  })

  it('omits auto model and empty effort', () => {
    expect(buildPromptParams('hello', { sessionId: 's1', modelId: 'auto' })).toEqual({
      sessionId: 's1',
      prompt: [{ type: 'text', text: 'hello' }],
    })
  })
})

describe('CliRuntimeAcpStdioClient', () => {
  it('rejects session/new responses without a sessionId', async () => {
    const client = new CliRuntimeAcpStdioClient({
      runtimeId: 'fake',
      displayName: 'Fake ACP',
      command: 'fake',
      args: [],
    })
    const originalRequest = client.request.bind(client)
    client.request = (async (method: string, params: Record<string, unknown>) => {
      if (method === 'session/new') return {}
      return originalRequest(method, params)
    }) as typeof client.request

    await expect(client.createSession('/tmp')).rejects.toThrow('sessionId')
  })
})
