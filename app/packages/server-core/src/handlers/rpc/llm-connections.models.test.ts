import { describe, expect, it } from 'bun:test'
import { getModels } from '@earendil-works/pi-ai/compat'
import { setOAuthTokenFetcher } from '@craft-agent/shared/auth'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { HandlerDeps } from '../handler-deps'
import type { HandlerFn, RequestContext, RpcServer } from '@craft-agent/server-core/transport'
import { registerLlmConnectionsHandlers } from './llm-connections'

const ctx: RequestContext = { clientId: 'test', workspaceId: null, webContentsId: 0 }

function providerModelsHandler(): HandlerFn {
  const handlers = new Map<string, HandlerFn>()
  const server = { handle: (channel: string, handler: HandlerFn) => { handlers.set(channel, handler) } } as RpcServer
  const deps = {
    sessionManager: {} as HandlerDeps['sessionManager'],
    oauthFlowStore: {} as HandlerDeps['oauthFlowStore'],
    platform: {
      appRootPath: '/', resourcesPath: '/', isPackaged: false,
      appVersion: '0.0.0-test', isDebugMode: true,
      logger: { info() {}, warn() {}, error() {}, debug() {} },
      imageProcessor: { async getMetadata() { return null }, async process() { return Buffer.from('') } },
    },
  } as HandlerDeps
  registerLlmConnectionsHandlers(server, deps)
  const handler = handlers.get(RPC_CHANNELS.pi.GET_PROVIDER_MODELS)
  if (!handler) throw new Error('GET_PROVIDER_MODELS handler not registered')
  return handler
}

describe('pre-save account model discovery', () => {
  it('returns custom endpoint IDs as candidate rows without inferred capability metadata', async () => {
    const calls: Array<{ url: string; authorization: string | null }> = []
    setOAuthTokenFetcher(async (url, init) => {
      calls.push({ url, authorization: new Headers(init.headers).get('authorization') })
      return new Response(JSON.stringify({ data: [{ id: 'model-a' }, { id: 'model-b' }] }))
    })
    try {
      const result = await providerModelsHandler()(
        ctx, 'custom', 'test-key', undefined, 'https://gateway.example/v1', 'openai-responses',
      ) as { source: string; models: Array<{ id: string; name: string; contextWindow: number; reasoning: boolean }> }
      expect(calls).toEqual([{ url: 'https://gateway.example/v1/models', authorization: 'Bearer test-key' }])
      expect(result.source).toBe('provider')
      expect(result.models).toEqual([
        { id: 'pi/model-a', name: 'model-a', contextWindow: 0, reasoning: false },
        { id: 'pi/model-b', name: 'model-b', contextWindow: 0, reasoning: false },
      ])
    } finally {
      setOAuthTokenFetcher(null)
    }
  })

  it('returns OpenAI API media membership beside, but outside, Pi chat models', async () => {
    const chat = getModels('openai').find(model => model.id === 'gpt-5.6-sol')!
    const calls: string[] = []
    setOAuthTokenFetcher(async (url) => {
      calls.push(url)
      return new Response(JSON.stringify({ data: [
        { id: chat.id, object: 'model' },
        { id: 'gpt-image-2', object: 'model' },
        { id: 'sora-2', object: 'model' },
        { id: 'gpt-4o-mini-tts', object: 'model' },
      ] }))
    })
    try {
      const result = await providerModelsHandler()(ctx, 'openai', 'test-key', undefined,
        'https://api.openai.com/v1') as {
          source: string; models: Array<{ id: string }>;
          mediaModels: Array<{ id: string; kind: string }>; mediaCatalogStatus: string;
        }
      expect(calls).toEqual(['https://api.openai.com/v1/models'])
      expect(result.source).toBe('provider')
      expect(result.models.map(model => model.id)).toEqual([`pi/${chat.id}`])
      expect(result.mediaCatalogStatus).toBe('available')
      expect(result.mediaModels.map(model => [model.id, model.kind])).toEqual([
        ['gpt-image-2', 'image'], ['sora-2', 'video'], ['gpt-4o-mini-tts', 'audio'],
      ])
    } finally {
      setOAuthTokenFetcher(null)
    }
  })

  it('uses a transient Google key with the native catalog and rejects a changed host', async () => {
    const calls: string[] = []
    setOAuthTokenFetcher(async (url, init) => {
      calls.push(url)
      expect(new Headers(init.headers).get('x-goog-api-key')).toBe('test-key')
      return new Response(JSON.stringify({ models: [{ name: 'models/gemini-2.5-flash',
        supportedGenerationMethods: ['generateContent'], inputTokenLimit: 1_048_576 }] }))
    })
    try {
      const handler = providerModelsHandler()
      const result = await handler(ctx, 'google', 'test-key', undefined,
        'https://generativelanguage.googleapis.com/v1beta') as { source: string; models: Array<{ id: string }> }
      expect(result.source).toBe('provider')
      expect(result.models.map(model => model.id)).toContain('pi/gemini-2.5-flash')
      const edited = await handler(ctx, 'google', 'test-key', undefined,
        'https://gateway.example/v1beta') as { source: string }
      expect(edited.source).toBe('sdk')
      expect(calls).toEqual(['https://generativelanguage.googleapis.com/v1beta/models?pageSize=100'])
    } finally {
      setOAuthTokenFetcher(null)
    }
  })

  it('uses the entered key and official Mistral catalog through the existing Pi driver', async () => {
    const model = getModels('mistral')[0]!
    const calls: Array<{ url: string; authorization: string | null }> = []
    setOAuthTokenFetcher(async (url, init) => {
      calls.push({ url, authorization: new Headers(init.headers).get('authorization') })
      return new Response(JSON.stringify({ data: [{ id: model.id, object: 'model',
        capabilities: { completion_chat: true }, max_context_length: 200_000 }] }))
    })
    try {
      const result = await providerModelsHandler()(
        ctx, 'mistral', 'test-key', undefined, 'https://api.mistral.ai/v1',
      ) as { source: string; models: Array<{ id: string; contextWindow: number }> }
      expect(calls).toEqual([{ url: 'https://api.mistral.ai/v1/models', authorization: 'Bearer test-key' }])
      expect(result.source).toBe('provider')
      expect(result.models).toContainEqual(expect.objectContaining({ id: `pi/${model.id}`, contextWindow: 200_000 }))
    } finally {
      setOAuthTokenFetcher(null)
    }
  })

  it('does not send the entered key to a provider catalog after the endpoint is edited', async () => {
    setOAuthTokenFetcher(async () => { throw new Error('account catalog must not be queried') })
    try {
      const result = await providerModelsHandler()(
        ctx, 'mistral', 'test-key', undefined, 'https://gateway.example/v1',
      ) as { source: string; models: Array<{ id: string }> }
      expect(result.source).toBe('sdk')
      expect(result.models.length).toBeGreaterThan(0)
    } finally {
      setOAuthTokenFetcher(null)
    }
  })

  it('reports an invalid account key without presenting the bundled list as entitlement', async () => {
    setOAuthTokenFetcher(async () => new Response('{}', { status: 401 }))
    try {
      const result = await providerModelsHandler()(
        ctx, 'deepseek', 'invalid-key', undefined, 'https://api.deepseek.com',
      ) as { source: string; models: Array<{ id: string }>; error?: string }
      expect(result.models).toEqual([])
      expect(result.error).toContain('HTTP 401')
    } finally {
      setOAuthTokenFetcher(null)
    }
  })
})
