import { afterEach, describe, expect, it } from 'bun:test';
import { setOAuthTokenFetcher } from '../../../../auth/oauth-token-fetch.ts';
import { fetchCustomEndpointModelIds, fetchCustomEndpointModels } from './custom-endpoint-models.ts';

afterEach(() => setOAuthTokenFetcher(null));

describe('custom endpoint model candidates', () => {
  it('keeps the key on the configured origin and chooses the selected API-format header', async () => {
    const calls: Array<{ url: string; headers: Headers; redirect: RequestInit['redirect'] }> = [];
    setOAuthTokenFetcher(async (url, init) => {
      calls.push({ url, headers: new Headers(init.headers), redirect: init.redirect! });
      return new Response(JSON.stringify({ data: [{ id: 'model-a' }, { id: 'model-b' }] }));
    });
    const ids = await fetchCustomEndpointModelIds('https://gateway.example/api/v1', 'secret', 'anthropic-messages');
    expect(ids).toEqual(['model-a', 'model-b']);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://gateway.example/api/v1/models');
    expect(calls[0]!.headers.get('x-api-key')).toBe('secret');
    expect(calls[0]!.headers.get('authorization')).toBeNull();
    expect(calls[0]!.redirect).toBe('error');
  });

  it('tries only a same-origin v1 route after a 404 and accepts Responses model slugs', async () => {
    const urls: string[] = [];
    setOAuthTokenFetcher(async (url, init) => {
      urls.push(url);
      expect(new Headers(init.headers).get('authorization')).toBe('Bearer secret');
      return urls.length === 1 ? new Response('', { status: 404 })
        : new Response(JSON.stringify({ models: [{ slug: 'response-model' }] }));
    });
    expect(await fetchCustomEndpointModelIds('https://gateway.example/api', 'secret', 'openai-responses'))
      .toEqual(['response-model']);
    expect(urls).toEqual(['https://gateway.example/api/models', 'https://gateway.example/api/v1/models']);
  });

  it('reads Google pages and preserves official display names and limits', async () => {
    const urls: string[] = [];
    setOAuthTokenFetcher(async (url, init) => {
      urls.push(url);
      expect(new Headers(init.headers).get('x-goog-api-key')).toBe('secret');
      return new Response(JSON.stringify(urls.length === 1
        ? { models: [{ name: 'models/gemini-one', displayName: 'Gemini One', inputTokenLimit: 100000 }], nextPageToken: 'next' }
        : { models: [{ name: 'models/gemini-two' }] }));
    });
    expect(await fetchCustomEndpointModels('https://gateway.example/v1beta', 'secret', 'google-generative-ai'))
      .toEqual([{ id: 'gemini-one', name: 'Gemini One', contextWindow: 100000 },
        { id: 'gemini-two', name: 'gemini-two' }]);
    expect(urls).toEqual([
      'https://gateway.example/v1beta/models',
      'https://gateway.example/v1beta/models?pageToken=next',
    ]);
  });

  it('retains explicit official names and capability fields, leaving ID-only metadata unknown', async () => {
    setOAuthTokenFetcher(async () => new Response(JSON.stringify({ data: [
      { id: 'rich', display_name: 'Official Rich', context_window: 256_000, max_output_tokens: 16_000,
        input_modalities: ['text', 'image'], output_modalities: ['text'],
        effort: { supported_levels: ['low', 'high'] }, supports_fast_mode: true },
      { id: 'id-only' },
    ] })));
    expect(await fetchCustomEndpointModels('https://gateway.example/v1', 'secret', 'openai-completions'))
      .toEqual([
        { id: 'rich', name: 'Official Rich', contextWindow: 256_000, maxOutputTokens: 16_000,
          supportsImages: true, modalities: { input: ['text', 'image'], output: ['text'] },
          reasoningEfforts: ['low', 'high'], supportsThinking: true, supportsFastMode: true },
        { id: 'id-only', name: 'id-only' },
      ]);
  });

  it('rejects redirects and malformed destinations instead of sending a key elsewhere', async () => {
    setOAuthTokenFetcher(async () => new Response('', { status: 302 }));
    await expect(fetchCustomEndpointModelIds('https://gateway.example/v1', 'secret', 'openai-completions'))
      .rejects.toThrow('HTTP 302');
    await expect(fetchCustomEndpointModelIds('https://user:pass@gateway.example/v1', 'secret', 'openai-completions'))
      .rejects.toThrow('without credentials');
  });
});
