import { afterEach, describe, expect, it } from 'bun:test';
import { setOAuthTokenFetcher } from '../../../../auth/oauth-token-fetch.ts';
import { fetchCustomEndpointModelIds } from './custom-endpoint-models.ts';

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

  it('reads Google pages without treating model-list fields as capabilities', async () => {
    const urls: string[] = [];
    setOAuthTokenFetcher(async (url, init) => {
      urls.push(url);
      expect(new Headers(init.headers).get('x-goog-api-key')).toBe('secret');
      return new Response(JSON.stringify(urls.length === 1
        ? { models: [{ name: 'models/gemini-one', inputTokenLimit: 100000 }], nextPageToken: 'next' }
        : { models: [{ name: 'models/gemini-two' }] }));
    });
    expect(await fetchCustomEndpointModelIds('https://gateway.example/v1beta', 'secret', 'google-generative-ai'))
      .toEqual(['gemini-one', 'gemini-two']);
    expect(urls).toEqual([
      'https://gateway.example/v1beta/models',
      'https://gateway.example/v1beta/models?pageToken=next',
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
