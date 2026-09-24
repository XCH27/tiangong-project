import { describe, expect, it } from 'bun:test';
import { piDriver, matchCodexAccountModels, matchApiAccountModels, parseCopilotAccountModels, toCopilotModelDefinitions } from './pi.ts';
import { setOAuthTokenFetcher } from '../../../../auth/oauth-token-fetch.ts';

describe('Copilot account model catalog', () => {
  it('reads the authenticated model list through the installed host transport', async () => {
    const originalFetch = globalThis.fetch;
    const urls: string[] = [];
    const token = 'tid=1;exp=2;proxy-ep=proxy.individual.githubcopilot.com;st=x';
    setOAuthTokenFetcher(async (url) => {
      urls.push(url);
      if (url === 'https://api.github.com/copilot_internal/v2/token') {
        return new Response(JSON.stringify({ token, expires_at: 4_102_444_800 }));
      }
      if (url === 'https://api.individual.githubcopilot.com/models') {
        return new Response(JSON.stringify({ data: [{
          id: 'account-model', name: 'Account Model', vendor: 'anthropic',
          policy: { state: 'enabled' }, capabilities: { type: 'chat', limits: {
            max_context_window_tokens: 200_000, max_output_tokens: 16_000,
          } },
        }] }));
      }
      throw new Error(`Unexpected host request: ${url}`);
    });
    globalThis.fetch = (async () => { throw new Error('direct fetch must not run'); }) as unknown as typeof fetch;
    try {
      const result = await piDriver.fetchModels!({
        connection: { slug: 'github-copilot', providerType: 'pi', piAuthProvider: 'github-copilot', authType: 'oauth' } as any,
        credentials: { oauthRefreshToken: 'github-token' } as any,
        timeoutMs: 1_000,
        hostRuntime: {} as any,
        resolvedPaths: {} as any,
      });
      expect(result.source).toBe('provider');
      expect(result.models.map(model => model.id)).toContain('account-model');
      expect(urls).toEqual([
        'https://api.github.com/copilot_internal/v2/token',
        'https://api.individual.githubcopilot.com/models',
      ]);
    } finally {
      setOAuthTokenFetcher(null);
      globalThis.fetch = originalFetch;
    }
  });

  it('keeps account limits and transport, without assigning a made-up context to unknown models', () => {
    const raw = parseCopilotAccountModels([
      { id: 'fleet-test-new-copilot-model', name: 'New Model', vendor: 'anthropic',
        policy: { state: 'enabled' }, capabilities: { type: 'chat', limits: {
          max_context_window_tokens: 500_000, max_output_tokens: 32_000,
        }, supports: { vision: true, tool_calls: true, streaming: true, reasoning_effort: ['low', 'high'] } } },
      { id: 'missing-limits', policy: { state: 'enabled' }, capabilities: { type: 'chat' } },
      { id: 'embedding', object: 'model', capabilities: { type: 'embedding' } },
    ]);
    expect(raw).toHaveLength(2);
    expect(toCopilotModelDefinitions(raw, [])).toEqual([expect.objectContaining({
      id: 'fleet-test-new-copilot-model',
      contextWindow: 500_000,
      maxOutputTokens: 32_000,
      runtimeApi: 'anthropic-messages',
      supportsImages: true,
      reasoningEfforts: ['low', 'high'],
    })]);
  });

  it('keeps the Pi transport for a known Copilot model when its ID alone is ambiguous', () => {
    const models = toCopilotModelDefinitions([
      { id: 'known', name: 'Known', policy: { state: 'enabled' }, runtimeApi: 'openai-responses' },
    ], [{ id: 'pi/known', name: 'Known', shortName: 'Known', description: '', provider: 'pi',
      contextWindow: 200_000, maxOutputTokens: 16_000, runtimeApi: 'openai-completions' }]);
    expect(models[0]?.runtimeApi).toBe('openai-completions');
  });
});

describe('piDriver.buildRuntime custom endpoint models', () => {
  it('preserves explicit per-model supportsImages values', () => {
    const runtime = piDriver.buildRuntime({
      context: {
        provider: 'pi',
        authType: 'api_key',
        resolvedModel: 'vision-model',
        capabilities: { needsHttpPoolServer: false },
        connection: {
          slug: 'custom-endpoint',
          name: 'Custom Endpoint',
          providerType: 'pi',
          authType: 'api_key',
          baseUrl: 'http://127.0.0.1:11111/v1',
          customEndpoint: { api: 'anthropic-messages', supportsImages: true },
          models: [
            { id: 'vision-model', contextWindow: 262_144, supportsImages: true },
            { id: 'text-only-model', supportsImages: false },
            { id: 'plain-model' },
          ],
          createdAt: Date.now(),
        } as any,
      },
      coreConfig: {} as any,
      hostRuntime: {} as any,
      resolvedPaths: {
        piServerPath: '/tmp/pi-agent-server.js',
        interceptorBundlePath: '/tmp/interceptor.cjs',
        nodeRuntimePath: '/usr/bin/node',
      },
    });

    expect(runtime.customModels).toEqual([
      { id: 'vision-model', contextWindow: 262_144, supportsImages: true },
      { id: 'text-only-model', supportsImages: false },
      'plain-model',
    ]);
  });
});

describe('Official API account catalogs', () => {
  it('intersects account membership with Pi-executable models without inventing capabilities', () => {
    const known = { id: 'pi/gpt-known', name: 'Known', shortName: 'Known', description: '', provider: 'pi' as const,
      contextWindow: 200_000, supportsImages: false, catalogSource: 'sdk' as const };
    const models = matchApiAccountModels({ data: [
      { id: 'image-generator', object: 'model' },
      { id: 'gpt-known', object: 'model' },
      { id: 'gpt-known', object: 'model' },
      { id: 'other-object', object: 'fine_tune' },
    ] }, [known]);
    expect(models).toEqual([known]);
    expect(() => matchApiAccountModels({ models: [] }, [known])).toThrow('invalid model list');
  });

  it('uses the host transport for a DeepSeek key and retains Pi metadata', async () => {
    const urls: string[] = [];
    setOAuthTokenFetcher(async (url, init) => {
      urls.push(url);
      expect(init.headers).toEqual({ Authorization: 'Bearer test-key', Accept: 'application/json' });
      return new Response(JSON.stringify({ object: 'list', data: [
        { id: 'deepseek-v4-pro', object: 'model' },
        { id: 'deepseek-future', object: 'model' },
      ] }));
    });
    try {
      const result = await piDriver.fetchModels!({
        connection: { slug: 'deepseek-api', providerType: 'pi', piAuthProvider: 'deepseek', authType: 'api_key' } as any,
        credentials: { apiKey: 'test-key' }, timeoutMs: 1_000,
        hostRuntime: {} as any, resolvedPaths: {} as any,
      });
      expect(urls).toEqual(['https://api.deepseek.com/models']);
      expect(result.source).toBe('provider');
      expect(result.models.map(model => model.id)).toEqual(['pi/deepseek-v4-pro']);
      expect(result.models[0]?.catalogSource).toBe('sdk');
    } finally {
      setOAuthTokenFetcher(null);
    }
  });

  it('uses the official OpenAI models endpoint for an API key', async () => {
    const urls: string[] = [];
    setOAuthTokenFetcher(async (url, init) => {
      urls.push(url);
      expect(init.headers).toEqual({ Authorization: 'Bearer test-key', Accept: 'application/json' });
      return new Response(JSON.stringify({ data: [
        { id: 'gpt-5.6-sol', object: 'model' },
        { id: 'text-embedding-3-large', object: 'model' },
      ] }));
    });
    try {
      const result = await piDriver.fetchModels!({
        connection: { slug: 'openai-api', providerType: 'pi', piAuthProvider: 'openai', authType: 'api_key',
          baseUrl: 'https://api.openai.com/v1/' } as any,
        credentials: { apiKey: 'test-key' }, timeoutMs: 1_000,
        hostRuntime: {} as any, resolvedPaths: {} as any,
      });
      expect(urls).toEqual(['https://api.openai.com/v1/models']);
      expect(result.source).toBe('provider');
      expect(result.models.map(model => model.id)).toEqual(['pi/gpt-5.6-sol']);
    } finally {
      setOAuthTokenFetcher(null);
    }
  });

  it('reads Groq account models and keeps only active Pi-executable chat routes', async () => {
    const urls: string[] = [];
    setOAuthTokenFetcher(async (url) => {
      urls.push(url);
      return new Response(JSON.stringify({ data: [
        { id: 'llama-3.1-8b-instant', object: 'model', active: true,
          context_window: 131_072, max_completion_tokens: 32_768 },
        { id: 'openai/gpt-oss-120b', object: 'model', active: false },
        { id: 'whisper-large-v3', object: 'model', active: true },
      ] }));
    });
    try {
      const result = await piDriver.fetchModels!({
        connection: { slug: 'groq-api', providerType: 'pi', piAuthProvider: 'groq', authType: 'api_key' } as any,
        credentials: { apiKey: 'test-key' }, timeoutMs: 1_000,
        hostRuntime: {} as any, resolvedPaths: {} as any,
      });
      expect(urls).toEqual(['https://api.groq.com/openai/v1/models']);
      expect(result.models).toEqual([expect.objectContaining({
        id: 'pi/llama-3.1-8b-instant', contextWindow: 131_072,
        maxOutputTokens: 32_768, catalogSource: 'provider',
      })]);
    } finally {
      setOAuthTokenFetcher(null);
    }
  });

  it('reads Mistral account models but excludes non-chat and archived rows', async () => {
    const urls: string[] = [];
    setOAuthTokenFetcher(async (url) => {
      urls.push(url);
      return new Response(JSON.stringify({ data: [
        { id: 'mistral-medium-3.5', object: 'model', max_context_length: 262_144,
          capabilities: { completion_chat: true, vision: true } },
        { id: 'codestral-latest', object: 'model', capabilities: { completion_chat: false } },
        { id: 'mistral-small-latest', object: 'model', archived: true },
      ] }));
    });
    try {
      const result = await piDriver.fetchModels!({
        connection: { slug: 'mistral-api', providerType: 'pi', piAuthProvider: 'mistral', authType: 'api_key' } as any,
        credentials: { apiKey: 'test-key' }, timeoutMs: 1_000,
        hostRuntime: {} as any, resolvedPaths: {} as any,
      });
      expect(urls).toEqual(['https://api.mistral.ai/v1/models']);
      expect(result.models).toEqual([expect.objectContaining({
        id: 'pi/mistral-medium-3.5', contextWindow: 262_144,
        supportsImages: true, catalogSource: 'provider',
      })]);
    } finally {
      setOAuthTokenFetcher(null);
    }
  });

  it('does not send a key to an arbitrary base URL', async () => {
    setOAuthTokenFetcher(async () => { throw new Error('remote discovery must not run'); });
    try {
      const result = await piDriver.fetchModels!({
        connection: { slug: 'other', providerType: 'pi', piAuthProvider: 'openai', authType: 'api_key',
          baseUrl: 'https://other.example/v1' } as any,
        credentials: { apiKey: 'test-key' }, timeoutMs: 1_000,
        hostRuntime: {} as any, resolvedPaths: {} as any,
      });
      expect(result.source).toBe('sdk');
    } finally {
      setOAuthTokenFetcher(null);
    }
  });

  it('rejects an oversized account catalog before parsing it', async () => {
    setOAuthTokenFetcher(async () => new Response('{}', {
      headers: { 'content-length': String(2 * 1024 * 1024 + 1) },
    }));
    try {
      await expect(piDriver.fetchModels!({
        connection: { slug: 'openai-api', providerType: 'pi', piAuthProvider: 'openai', authType: 'api_key' } as any,
        credentials: { apiKey: 'test-key' }, timeoutMs: 1_000,
        hostRuntime: {} as any, resolvedPaths: {} as any,
      })).rejects.toThrow('response limit');
    } finally {
      setOAuthTokenFetcher(null);
    }
  });
});

describe('Codex subscription account catalogs', () => {
  it('merges official account capabilities with Pi metadata and filters unknown slugs', () => {
    const known = {
      id: 'pi/gpt-known', name: 'Bundled Name', shortName: 'Bundled', description: '', provider: 'pi' as const,
      contextWindow: 128_000, maxOutputTokens: 16_000, reasoningEfforts: ['low'] as ('low' | 'medium' | 'high' | 'xhigh' | 'max')[],
    };
    const models = matchCodexAccountModels({ models: [
      { slug: 'gpt-known', display_name: 'Account Name', visibility: 'list', description: 'Account description',
        context_window: 256_000, supported_reasoning_levels: [{ effort: 'low', description: 'Low' }, { effort: 'high', description: 'High' }],
        input_modalities: ['text', 'image'] },
      { slug: 'future-codex', display_name: 'Future', visibility: 'list' },
      { slug: 'hidden', display_name: 'Hidden', visibility: 'hide' },
    ] }, [known]);
    expect(models).toEqual([expect.objectContaining({
      id: 'pi/gpt-known', name: 'Account Name', contextWindow: 256_000,
      reasoningEfforts: ['low', 'high'], supportsThinking: true, supportsImages: true,
      catalogSource: 'provider',
    })]);
  });

  it('does not use the Codex override ceiling as the active context or hide an unselectable effort', () => {
    const known = { id: 'pi/test', name: 'Test', shortName: 'Test', description: '', provider: 'pi' as const,
      contextWindow: 128_000, maxOutputTokens: 16_000 };
    const [model] = matchCodexAccountModels({ models: [{
      slug: 'test', visibility: 'list', max_context_window: 1_000_000,
      supported_reasoning_levels: [{ effort: 'ultra' }],
    }] }, [known]);
    expect(model?.contextWindow).toBe(128_000);
    expect(model?.supportsThinking).toBe(true);
    expect(model?.reasoningEfforts).toEqual([]);
  });

  it('uses the Codex account header and does not expose subscription pricing', async () => {
    const payload = { header: { alg: 'none' }, payload: { 'https://api.openai.com/auth': { chatgpt_account_id: 'acc_test' } } };
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const idToken = `${encode(payload.header)}.${encode(payload.payload)}.signature`;
    const token = `${encode(payload.header)}.${encode({ sub: 'access-token' })}.signature`;
    const urls: string[] = [];
    setOAuthTokenFetcher(async (url, init) => {
      urls.push(url);
      expect(init.headers).toEqual({
        Authorization: `Bearer ${token}`,
        'chatgpt-account-id': 'acc_test',
        originator: 'pi',
        Accept: 'application/json',
      });
      return new Response(JSON.stringify({ models: [{
        slug: 'gpt-6-sol', display_name: 'GPT-6 Sol', visibility: 'list', context_window: 272_000,
        supported_reasoning_levels: [{ effort: 'high', description: 'High' }], input_modalities: ['text', 'image'],
      }] }));
    });
    try {
      const result = await piDriver.fetchModels!({
        connection: { slug: 'chatgpt', providerType: 'pi', piAuthProvider: 'openai-codex', authType: 'oauth' } as any,
        credentials: { oauthAccessToken: token, oauthIdToken: idToken }, timeoutMs: 1_000,
        hostRuntime: {} as any, resolvedPaths: {} as any,
      });
      expect(urls).toEqual(['https://chatgpt.com/backend-api/codex/models?client_version=0.13.4']);
      expect(result.source).toBe('provider');
      expect(result.models[0]).toMatchObject({ id: 'pi/gpt-6-sol', contextWindow: 272_000, supportsImages: true, catalogSource: 'provider' });
      expect(result.models[0]?.pricingPerMillion).toBeUndefined();
    } finally {
      setOAuthTokenFetcher(null);
    }
  });
});
