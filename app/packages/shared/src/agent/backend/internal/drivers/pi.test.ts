import { describe, expect, it } from 'bun:test';
import { piDriver, parseCopilotAccountModels, toCopilotModelDefinitions } from './pi.ts';

describe('Copilot account model catalog', () => {
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
