import { describe, expect, it } from 'bun:test'
import type { LlmConnection, ModelDefinition, ModelFetcherMap } from '@craft-agent/shared/config'
import { ModelRefreshService } from './index'
import { mergeClaudeSdkCapabilities } from './anthropic'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

function model(id: string): ModelDefinition {
  return { id, name: id, shortName: id, description: '', provider: 'pi', contextWindow: 100_000 }
}

describe('model refresh account isolation', () => {
  it('adds custom endpoint discoveries as hidden candidates without replacing manual models', async () => {
    let connection: LlmConnection = {
      slug: 'custom', name: 'Custom', providerType: 'pi_compat', authType: 'api_key_with_endpoint',
      baseUrl: 'https://example.test/v1', customEndpoint: { api: 'openai-completions' },
      createdAt: 1, defaultModel: 'pi/manual',
      models: [model('pi/manual')], manualModelIds: ['pi/manual'],
      manualModelOverrides: { 'pi/manual': { contextWindow: 256_000 } },
    }
    let discovery = [
      { id: 'manual', name: 'Official Manual', contextWindow: 128_000 },
      { id: 'new', name: 'Official New', contextWindow: 200_000, supportsImages: true },
      { id: 'new', name: 'Official New' },
    ]
    const service = new ModelRefreshService({} as ModelFetcherMap, async () => ({ apiKey: 'test' }), {
      getConnection: () => connection,
      getConnections: () => [connection],
      updateConnection: (_slug, updates) => { connection = { ...connection, ...updates }; return true },
      fallbackModels: () => [],
    }, async () => discovery)

    expect((await service.refreshNow('custom')).source).toBe('provider')
    expect(connection.models?.map(entry => typeof entry === 'string' ? entry : entry.id)).toEqual(['pi/manual', 'pi/new'])
    expect(connection.models?.[0]).toMatchObject({ name: 'Official Manual', contextWindow: 256_000 })
    expect(connection.models?.[1]).toMatchObject({ name: 'Official New', contextWindow: 200_000, supportsImages: true })
    expect(connection.hiddenModelIds).toEqual(['pi/new'])
    expect(connection.defaultModel).toBe('pi/manual')
    discovery = [{ id: 'manual', name: 'manual' }, { id: 'new', name: 'new' }]
    expect((await service.refreshNow('custom')).source).toBe('provider')
    expect(connection.models?.[0]).toMatchObject({ name: 'Official Manual', contextWindow: 256_000 })
    expect(connection.models?.[1]).toMatchObject({ name: 'Official New' })
    expect(connection.models?.[1]).not.toHaveProperty('contextWindow')
    expect(connection.models?.[1]).not.toHaveProperty('supportsImages')
  })

  it('does not publish custom candidates after the endpoint or format changes', async () => {
    let connection: LlmConnection = {
      slug: 'custom', name: 'Custom', providerType: 'pi_compat', authType: 'api_key_with_endpoint',
      baseUrl: 'https://first.test/v1', customEndpoint: { api: 'openai-completions' },
      createdAt: 1, defaultModel: 'pi/current', models: [model('pi/current')],
    }
    const pending = deferred<Array<{ id: string; name: string }>>()
    const service = new ModelRefreshService({} as ModelFetcherMap, async () => ({ apiKey: 'test' }), {
      getConnection: () => connection,
      getConnections: () => [connection],
      updateConnection: (_slug, updates) => { connection = { ...connection, ...updates }; return true },
      fallbackModels: () => [],
    }, async () => pending.promise)
    const refresh = service.refreshNow('custom')
    connection = { ...connection, baseUrl: 'https://second.test/v1' }
    pending.resolve([{ id: 'stale', name: 'Stale' }])
    expect((await refresh).source).toBe('superseded')
    expect(connection.models).toEqual([model('pi/current')])
  })

  it('keeps manual model corrections and explicitly added models after catalog refresh', async () => {
    let connection: LlmConnection = {
      slug: 'account', name: 'Account', providerType: 'pi', authType: 'api_key',
      piAuthProvider: 'openai', modelSelectionMode: 'automaticallySyncedFromProvider', createdAt: 1,
      models: [model('pi/current'), model('pi/manual')], manualModelIds: ['pi/manual'],
      manualModelOverrides: { 'pi/current': { contextWindow: 256_000, supportsImages: true } },
    }
    const fetcher = { refreshIntervalMs: 0, fetchModels: async () => ({
      models: [model('pi/current'), model('pi/new')], source: 'provider' as const,
    }) }
    const service = new ModelRefreshService(
      { pi: fetcher, anthropic: fetcher } as ModelFetcherMap,
      async () => ({ apiKey: 'test' }),
      {
        getConnection: () => connection,
        getConnections: () => [connection],
        updateConnection: (_slug, updates) => { connection = { ...connection, ...updates }; return true },
        fallbackModels: () => [],
      },
    )
    expect((await service.refreshConnection('account')).source).toBe('provider')
    expect(connection.models?.map(entry => typeof entry === 'string' ? entry : entry.id)).toEqual(['pi/current', 'pi/new', 'pi/manual'])
    expect(connection.models?.[0]).toMatchObject({ contextWindow: 256_000, supportsImages: true })
  })

  it('drops a response when the OAuth account changes under the same connection slug', async () => {
    let connection: LlmConnection = {
      slug: 'claude', name: 'Claude', providerType: 'anthropic', authType: 'oauth',
      createdAt: 1, oauthAccountUuid: 'first',
    }
    const response = deferred<{ models: ModelDefinition[] }>()
    const fetcher = { refreshIntervalMs: 0, fetchModels: async () => response.promise }
    const service = new ModelRefreshService(
      { anthropic: fetcher, pi: fetcher },
      async () => ({}),
      {
        getConnection: () => connection,
        getConnections: () => [connection],
        updateConnection: (_slug, updates) => {
          connection = { ...connection, ...updates }
          return true
        },
        fallbackModels: () => [],
      },
    )
    const pending = service.refreshConnection('claude')
    connection = { ...connection, oauthAccountUuid: 'second' }
    response.resolve({ models: [model('old-account-model')] })
    expect((await pending).source).toBe('superseded')
    expect(connection.models).toBeUndefined()
  })

  it('does not publish an older account catalog after a credential refresh', async () => {
    let connection: LlmConnection | null = {
      slug: 'xai', name: 'xAI', providerType: 'pi', authType: 'api_key',
      piAuthProvider: 'xai', modelSelectionMode: 'automaticallySyncedFromProvider',
      createdAt: 1,
    }
    let credential = 'old-account'
    const oldResult = deferred<{ models: ModelDefinition[] }>()
    const newResult = deferred<{ models: ModelDefinition[] }>()
    const oldStarted = deferred<void>()
    const newStarted = deferred<void>()
    const published: string[][] = []
    const fetcher = {
      refreshIntervalMs: 0,
      fetchModels: async (_connection: LlmConnection, credentials: { apiKey?: string }) => {
        if (credentials.apiKey === 'old-account') {
          oldStarted.resolve()
          return oldResult.promise
        }
        newStarted.resolve()
        return newResult.promise
      },
    }
    const service = new ModelRefreshService(
      { pi: fetcher, anthropic: fetcher } as ModelFetcherMap,
      async () => ({ apiKey: credential }),
      {
        getConnection: () => connection,
        getConnections: () => connection ? [connection] : [],
        updateConnection: (_slug, updates) => {
          if (!connection) return false
          connection = { ...connection, ...updates }
          published.push((updates.models ?? []).map(entry => typeof entry === 'string' ? entry : entry.id))
          return true
        },
        fallbackModels: () => [],
      },
    )

    const oldRefresh = service.refreshConnection('xai')
    await oldStarted.promise
    credential = 'new-account'
    const newRefresh = service.refreshNow('xai')
    await newStarted.promise
    newResult.resolve({ models: [model('pi/new')] })
    await newRefresh
    oldResult.resolve({ models: [model('pi/old')] })
    await oldRefresh

    expect(published).toEqual([['pi/new']])
    expect(connection?.models).toEqual([model('pi/new')])
  })
})

describe('model refresh provenance', () => {
  it('refreshes a Grok subscription catalog even for an older three-tier connection', async () => {
    let connection: LlmConnection = {
      slug: 'grok', name: 'Grok', providerType: 'pi', authType: 'oauth',
      piAuthProvider: 'xai', modelSelectionMode: 'userDefined3Tier', createdAt: 1,
      defaultModel: 'pi/old', models: [model('pi/old')],
    }
    const fetcher = { refreshIntervalMs: 0, fetchModels: async () => ({
      models: [model('pi/new')], source: 'provider' as const,
    }) }
    const service = new ModelRefreshService(
      { pi: fetcher, anthropic: fetcher } as ModelFetcherMap,
      async () => ({}),
      {
        getConnection: () => connection,
        getConnections: () => [connection],
        updateConnection: (_slug, updates) => { connection = { ...connection, ...updates }; return true },
        fallbackModels: () => [],
      },
    )
    try {
      expect((await service.refreshNow('grok')).source).toBe('provider')
      expect(connection.models).toEqual([model('pi/new')])
      expect(connection.defaultModel).toBe('pi/new')
    } finally {
      service.stopAll()
    }
  })

  it('refreshes an official API catalog even for an older three-tier connection', async () => {
    let connection: LlmConnection = {
      slug: 'openai', name: 'OpenAI', providerType: 'pi', authType: 'api_key',
      piAuthProvider: 'openai', baseUrl: 'https://api.openai.com/v1',
      modelSelectionMode: 'userDefined3Tier', createdAt: 1,
      defaultModel: 'pi/old', models: [model('pi/old')],
    }
    const fetcher = { refreshIntervalMs: 0, fetchModels: async () => ({
      models: [model('pi/account-model')], source: 'provider' as const,
    }) }
    const service = new ModelRefreshService(
      { pi: fetcher, anthropic: fetcher } as ModelFetcherMap,
      async () => ({ apiKey: 'test-key' }),
      {
        getConnection: () => connection,
        getConnections: () => [connection],
        updateConnection: (_slug, updates) => { connection = { ...connection, ...updates }; return true },
        fallbackModels: () => [],
      },
    )
    try {
      expect((await service.refreshNow('openai')).source).toBe('provider')
      expect(connection.models).toEqual([model('pi/account-model')])
      expect(connection.defaultModel).toBe('pi/account-model')
    } finally {
      service.stopAll()
    }
  })

  for (const { provider, baseUrl } of [
    { provider: 'google', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
    { provider: 'groq', baseUrl: 'https://api.groq.com/openai/v1' },
    { provider: 'mistral', baseUrl: 'https://api.mistral.ai' },
    { provider: 'mistral', baseUrl: 'https://api.mistral.ai/v1' },
  ]) {
    it(`replaces a legacy ${provider} tier with its authenticated account list`, async () => {
      let connection: LlmConnection = {
        slug: provider, name: provider, providerType: 'pi', authType: 'api_key',
        piAuthProvider: provider, baseUrl, modelSelectionMode: 'userDefined3Tier', createdAt: 1,
        defaultModel: 'pi/old', models: [model('pi/old')],
      }
      const fetcher = { refreshIntervalMs: 0, fetchModels: async () => ({
        models: [model('pi/account-model')], source: 'provider' as const,
      }) }
      const service = new ModelRefreshService(
        { pi: fetcher, anthropic: fetcher } as ModelFetcherMap,
        async () => ({ apiKey: 'test-key' }),
        {
          getConnection: () => connection,
          getConnections: () => [connection],
          updateConnection: (_slug, updates) => { connection = { ...connection, ...updates }; return true },
          fallbackModels: () => [],
        },
      )
      try {
        expect((await service.refreshNow(provider)).source).toBe('provider')
        expect(connection.models).toEqual([model('pi/account-model')])
      } finally {
        service.stopAll()
      }
    })
  }

  it('refreshes a ChatGPT Codex catalog even for an older three-tier connection', async () => {
    let connection: LlmConnection = {
      slug: 'chatgpt', name: 'ChatGPT', providerType: 'pi', authType: 'oauth',
      piAuthProvider: 'openai-codex', modelSelectionMode: 'userDefined3Tier', createdAt: 1,
      defaultModel: 'pi/old', models: [model('pi/old')],
    }
    const fetcher = { refreshIntervalMs: 0, fetchModels: async () => ({
      models: [model('pi/account-model')], source: 'provider' as const,
    }) }
    const service = new ModelRefreshService(
      { pi: fetcher, anthropic: fetcher } as ModelFetcherMap,
      async () => ({ oauthAccessToken: 'access-token', oauthIdToken: 'id-token' }),
      {
        getConnection: () => connection,
        getConnections: () => [connection],
        updateConnection: (_slug, updates) => { connection = { ...connection, ...updates }; return true },
        fallbackModels: () => [],
      },
    )
    try {
      expect((await service.refreshNow('chatgpt')).source).toBe('provider')
      expect(connection.models).toEqual([model('pi/account-model')])
      expect(connection.defaultModel).toBe('pi/account-model')
    } finally {
      service.stopAll()
    }
  })

  it('distinguishes a live account response from bundled and stale models', async () => {
    let connection: LlmConnection = {
      slug: 'account', name: 'Account', providerType: 'pi', authType: 'oauth',
      piAuthProvider: 'github-copilot', createdAt: 1,
    }
    let result: 'provider' | 'sdk' | 'empty' | 'failure' = 'provider'
    const fetcher = {
      refreshIntervalMs: 0,
      fetchModels: async () => {
        if (result === 'failure') throw new Error('Account catalog unavailable')
        if (result === 'empty') return { models: [], source: 'provider' as const }
        return { models: [model(result)], source: result }
      },
    }
    const service = new ModelRefreshService(
      { pi: fetcher, anthropic: fetcher } as ModelFetcherMap,
      async () => ({}),
      {
        getConnection: () => connection,
        getConnections: () => [connection],
        updateConnection: (_slug, updates) => {
          connection = { ...connection, ...updates }
          return true
        },
        fallbackModels: () => [model('registry')],
      },
    )

    expect((await service.refreshConnection('account')).source).toBe('provider')
    result = 'sdk'
    expect((await service.refreshNow('account')).source).toBe('sdk')
    result = 'failure'
    expect(await service.refreshNow('account')).toMatchObject({
      source: 'saved', error: 'Account catalog unavailable',
    })
    expect(connection.models).toEqual([model('sdk'), model('provider')])
    result = 'empty'
    expect(await service.refreshNow('account')).toMatchObject({
      source: 'saved', error: 'Model catalog was empty',
    })
    expect(connection.models).toEqual([model('sdk'), model('provider')])
  })

  it('keeps a selected model through an older SDK catalog, but accepts a live account replacement', async () => {
    const selected = model('pi/newer-account-model')
    let connection: LlmConnection = {
      slug: 'account', name: 'Account', providerType: 'pi', authType: 'oauth',
      piAuthProvider: 'github-copilot', createdAt: 1,
      defaultModel: selected.id, models: [selected],
    }
    let source: 'sdk' | 'provider' = 'sdk'
    const fetcher = {
      refreshIntervalMs: 0,
      fetchModels: async () => ({ models: [model('pi/older-sdk-model')], source }),
    }
    const service = new ModelRefreshService(
      { pi: fetcher, anthropic: fetcher } as ModelFetcherMap,
      async () => ({}),
      {
        getConnection: () => connection,
        getConnections: () => [connection],
        updateConnection: (_slug, updates) => {
          connection = { ...connection, ...updates }
          return true
        },
        fallbackModels: () => [],
      },
    )

    expect((await service.refreshNow('account')).source).toBe('sdk')
    expect(connection.defaultModel).toBe(selected.id)
    expect(connection.models).toEqual([model('pi/older-sdk-model'), selected])

    source = 'provider'
    expect((await service.refreshNow('account')).source).toBe('provider')
    expect(connection.defaultModel).toBe('pi/older-sdk-model')
    expect(connection.models).toEqual([model('pi/older-sdk-model')])
  })

  it('preserves a user-selected unknown ID without inventing capability metadata', async () => {
    let connection: LlmConnection = {
      slug: 'api', name: 'API', providerType: 'pi', authType: 'api_key',
      piAuthProvider: 'openai', createdAt: 1, defaultModel: 'pi/future-model',
    }
    const fetcher = { refreshIntervalMs: 0, fetchModels: async () => ({ models: [model('pi/old')], source: 'sdk' as const }) }
    const service = new ModelRefreshService(
      { pi: fetcher, anthropic: fetcher } as ModelFetcherMap,
      async () => ({}),
      {
        getConnection: () => connection,
        getConnections: () => [connection],
        updateConnection: (_slug, updates) => {
          connection = { ...connection, ...updates }
          return true
        },
        fallbackModels: () => [],
      },
    )

    await service.refreshNow('api')
    expect(connection.defaultModel).toBe('pi/future-model')
    expect(connection.models).toEqual([model('pi/old'), 'pi/future-model'])
  })
})

describe('Claude SDK capability discovery', () => {
  const claudeModel: ModelDefinition = {
    id: 'claude-opus-5-5', name: 'Opus 5.5', shortName: 'Opus', description: '',
    provider: 'anthropic', contextWindow: 1_000_000,
  }

  it('uses explicit SDK capabilities without inventing rows or replacing context limits', () => {
    const models = mergeClaudeSdkCapabilities([claudeModel], [
      { value: 'opus', resolvedModel: 'claude-opus-5-5', supportsEffort: true,
        supportedEffortLevels: ['low', 'high', 'max'], supportsAdaptiveThinking: true, supportsFastMode: false },
      { value: 'claude-future-9', supportsEffort: true, supportedEffortLevels: ['max'] },
    ])
    expect(models).toHaveLength(1)
    expect(models[0]).toMatchObject({
      id: 'claude-opus-5-5', contextWindow: 1_000_000,
      reasoningEfforts: ['low', 'high', 'max'], adaptiveThinkingSupported: true, supportsFastMode: false,
    })
  })

  it('rejects SDK results from a replaced OAuth account', () => {
    let connection: LlmConnection = {
      slug: 'claude', name: 'Claude', providerType: 'anthropic', authType: 'oauth',
      createdAt: 1, oauthAccountUuid: 'new-account', models: [claudeModel],
    }
    const service = new ModelRefreshService({} as ModelFetcherMap, async () => ({}), {
      getConnection: () => connection,
      getConnections: () => [connection],
      updateConnection: (_slug, updates) => {
        connection = { ...connection, ...updates }
        return true
      },
      fallbackModels: () => [],
    })
    const raw = [{ value: 'claude-opus-5-5', supportedEffortLevels: ['high', 'max'] }]
    expect(service.noteClaudeSdkSupportedModels('claude', { createdAt: 1, uuid: 'old-account' }, raw)).toBe(false)
    expect(connection.models).toEqual([claudeModel])
    expect(service.noteClaudeSdkSupportedModels('claude', { createdAt: 1, uuid: 'new-account' }, raw)).toBe(true)
    expect(connection.models?.[0]).toMatchObject({ reasoningEfforts: ['high', 'max'] })
  })
})
