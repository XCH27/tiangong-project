import { describe, expect, it } from 'bun:test';
import { piDriver, parseCopilotAccountModels, toCopilotModelDefinitions } from './pi.ts';
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
