import { describe, expect, it } from 'bun:test';
import { getModels, InMemoryCredentialStore, InMemoryModelsStore } from '@earendil-works/pi-ai/compat';
import { ModelRegistry, ModelRuntime } from '@earendil-works/pi-coding-agent';
import { accountMetadataProvider, registerAccountModelMetadata } from './account-model-metadata.ts';
import { resolvePiModel } from './model-resolution.ts';

async function makeRegistry(): Promise<ModelRegistry> {
  const runtime = await ModelRuntime.create({
    credentials: new InMemoryCredentialStore(),
    modelsPath: null,
    modelsStore: new InMemoryModelsStore(),
    refreshOnCreate: false,
  });
  return new ModelRegistry(runtime);
}

describe('authenticated account metadata in Pi runtime', () => {
  it('never applies native overrides to arbitrary or custom endpoints', () => {
    expect(accountMetadataProvider({ provider: 'groq', authType: 'api_key' })).toBe('groq');
    expect(accountMetadataProvider({ provider: 'mistral', authType: 'api_key',
      baseUrl: 'https://api.mistral.ai/' })).toBe('mistral');
    expect(accountMetadataProvider({ provider: 'mistral', authType: 'api_key',
      baseUrl: 'https://api.mistral.ai/v1/' })).toBe('mistral');
    expect(accountMetadataProvider({ provider: 'openai-codex', authType: 'oauth' })).toBe('openai-codex');
    expect(accountMetadataProvider({ provider: 'groq', authType: 'api_key',
      baseUrl: 'https://example.test/openai/v1' })).toBeNull();
    expect(accountMetadataProvider({ provider: 'openai-codex', authType: 'api_key' })).toBeNull();
    expect(accountMetadataProvider({ provider: 'mistral', authType: 'api_key',
      customEndpoint: { api: 'openai-completions' } })).toBeNull();
  });
  for (const provider of ['groq', 'mistral', 'openai-codex'] as const) {
    it(`refines ${provider} limits without changing its native request route`, async () => {
      const registry = await makeRegistry();
      const native = getModels(provider)[0]!;
      const newContext = native.contextWindow + 8_192;
      const newOutput = Math.min(native.maxTokens + 1_024, newContext);
      const count = registerAccountModelMetadata(registry, provider, [
        { id: `pi/${native.id}`, contextWindow: newContext,
          maxOutputTokens: newOutput, supportsImages: false },
        { id: 'pi/unknown-model', contextWindow: 999_999 },
      ]);

      expect(count).toBe(1);
      const selected = resolvePiModel(registry, `pi/${native.id}`, provider);
      expect(selected).toMatchObject({
        provider, id: native.id, api: native.api, baseUrl: native.baseUrl,
        contextWindow: newContext, maxTokens: newOutput, input: ['text'],
        cost: native.cost,
      });
      expect(registry.find(provider, 'unknown-model')).toBeUndefined();
      expect(registry.getProvider(provider)?.auth).toBeDefined();
    });
  }

  it('clamps output to a lower live context and resets stale overrides on refresh', async () => {
    const registry = await makeRegistry();
    const native = getModels('groq')[0]!;
    const lowerContext = Math.max(1, native.maxTokens - 1);
    registerAccountModelMetadata(registry, 'groq', [
      { id: native.id, contextWindow: lowerContext, maxOutputTokens: native.maxTokens + 1 },
    ]);
    expect(registry.find('groq', native.id)?.maxTokens).toBe(lowerContext);

    registerAccountModelMetadata(registry, 'groq', [
      { id: native.id, contextWindow: native.contextWindow, maxOutputTokens: native.maxTokens },
    ]);
    expect(registry.find('groq', native.id)).toMatchObject({
      contextWindow: native.contextWindow, maxTokens: native.maxTokens,
    });
  });
});
