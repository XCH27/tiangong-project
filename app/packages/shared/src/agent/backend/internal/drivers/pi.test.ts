import { afterEach, describe, expect, it, mock } from 'bun:test';
import { piDriver } from './pi.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
})

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

describe('piDriver.testConnection direct API checks', () => {
  it('tests OpenAI-compatible providers through /chat/completions without Pi subprocess', async () => {
    const fetchMock = mock(async () => new Response('{}', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await piDriver.testConnection?.({
      provider: 'pi',
      apiKey: 'sk-test',
      model: 'pi/deepseek-chat',
      baseUrl: 'https://api.deepseek.com',
      connection: { providerType: 'pi', piAuthProvider: 'deepseek' },
      timeoutMs: 1000,
      hostRuntime: {} as any,
      resolvedPaths: {},
    });

    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit?]>;
    expect(calls[0]?.[0]).toBe('https://api.deepseek.com/chat/completions');
  });

  it('tests Google AI Studio providers through generateContent without Pi subprocess', async () => {
    const fetchMock = mock(async () => new Response('{}', { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await piDriver.testConnection?.({
      provider: 'pi',
      apiKey: 'AIza-test',
      model: 'pi/gemini-1.5-flash',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      connection: { providerType: 'pi', piAuthProvider: 'google' },
      timeoutMs: 1000,
      hostRuntime: {} as any,
      resolvedPaths: {},
    });

    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit?]>;
    expect(calls[0]?.[0]).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent');
  });
});
