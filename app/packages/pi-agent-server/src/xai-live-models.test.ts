import { describe, expect, it } from 'bun:test';
import { InMemoryCredentialStore, InMemoryModelsStore } from '@earendil-works/pi-ai';
import { ModelRegistry, ModelRuntime } from '@earendil-works/pi-coding-agent';
import { registerXaiLiveModels } from './xai-live-models.ts';

describe('xAI live models in Pi runtime', () => {
  it('routes subscription models to Grok with proxy-only request headers and no API-key price', async () => {
    const credentials = new InMemoryCredentialStore();
    await credentials.modify('xai', async () => ({ type: 'api_key', key: 'subscription-token' }));
    const runtime = await ModelRuntime.create({
      credentials,
      modelsPath: null,
      modelsStore: new InMemoryModelsStore(),
      refreshOnCreate: false,
    });
    const registry = new ModelRegistry(runtime);
    expect(registerXaiLiveModels(registry, [{ id: 'pi/grok-4.7', contextWindow: 500_000, maxOutputTokens: 64_000 }], 'https://cli-chat-proxy.grok.com/v1')).toBe(1);
    const model = registry.find('xai', 'grok-4.7');
    expect(model).toMatchObject({
      baseUrl: 'https://cli-chat-proxy.grok.com/v1',
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    });
    expect((await registry.getApiKeyAndHeaders(model!))).toMatchObject({
      ok: true,
      headers: {
        'X-XAI-Token-Auth': 'xai-grok-cli',
        'x-grok-client-version': '1.0.4',
        'x-grok-model-override': 'grok-4.7',
      },
    });
  });
  it('makes a newly discovered model resolvable under the existing xAI provider', async () => {
    const runtime = await ModelRuntime.create({
      credentials: new InMemoryCredentialStore(),
      modelsPath: null,
      modelsStore: new InMemoryModelsStore(),
      refreshOnCreate: false,
    });
    const registry = new ModelRegistry(runtime);
    expect(registry.find('xai', 'grok-future-test')).toBeUndefined();

    const count = registerXaiLiveModels(registry, [
      {
        id: 'pi/grok-future-test',
        contextWindow: 500_000,
        supportsImages: true,
        reasoningEfforts: ['low', 'medium', 'high', 'xhigh'],
        pricingPerMillion: {
          input: 2,
          output: 6,
          cacheRead: 0.5,
          longContext: { inputTokensAtOrAbove: 200_000, input: 4, output: 12, cacheRead: 1 },
        },
      },
      { id: 'pi/unpriced-model', contextWindow: 128_000 },
    ]);

    expect(count).toBe(1);
    expect(registry.find('xai', 'grok-future-test')).toMatchObject({
      provider: 'xai',
      api: 'openai-responses',
      baseUrl: 'https://api.x.ai/v1',
      contextWindow: 500_000,
      maxTokens: 8_192,
      reasoning: true,
      thinkingLevelMap: { off: null, xhigh: 'xhigh' },
      cost: {
        input: 2,
        output: 6,
        cacheRead: 0.5,
        tiers: [{ inputTokensAbove: 199_999, input: 4, output: 12, cacheRead: 1, cacheWrite: 0 }],
      },
    });
    expect(registry.find('xai', 'unpriced-model')).toBeUndefined();
  });
});
