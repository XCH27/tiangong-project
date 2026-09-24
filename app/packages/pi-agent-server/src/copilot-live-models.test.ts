import { describe, expect, it } from 'bun:test';
import { InMemoryCredentialStore, InMemoryModelsStore } from '@earendil-works/pi-ai';
import { ModelRegistry, ModelRuntime } from '@earendil-works/pi-coding-agent';
import { registerCopilotLiveModels } from './copilot-live-models.ts';

describe('Copilot live models in Pi runtime', () => {
  it('registers a new account model with its advertised transport and limits', async () => {
    const runtime = await ModelRuntime.create({
      credentials: new InMemoryCredentialStore(),
      modelsPath: null,
      modelsStore: new InMemoryModelsStore(),
      refreshOnCreate: false,
    });
    const registry = new ModelRegistry(runtime);
    expect(registry.find('github-copilot', 'fleet-test-new-copilot-model')).toBeUndefined();

    const count = registerCopilotLiveModels(registry, [
      { id: 'pi/fleet-test-new-copilot-model', contextWindow: 500_000, maxOutputTokens: 32_000,
        runtimeApi: 'anthropic-messages', supportsImages: true, reasoningEfforts: ['low', 'high'] },
      { id: 'pi/unbounded-copilot', runtimeApi: 'openai-responses' },
    ]);

    expect(count).toBe(1);
    expect(registry.find('github-copilot', 'fleet-test-new-copilot-model')).toMatchObject({
      provider: 'github-copilot',
      api: 'anthropic-messages',
      contextWindow: 500_000,
      maxTokens: 32_000,
      input: ['text', 'image'],
      cost: { input: 0, output: 0 },
      thinkingLevelMap: { off: null, low: 'low', medium: null, high: 'high' },
    });
    expect(registry.find('github-copilot', 'unbounded-copilot')).toBeUndefined();
    expect(registry.getProvider('github-copilot')?.auth.oauth).toBeDefined();
  });
});
