import { describe, expect, it } from 'bun:test';
import { fetchXaiApiMediaModels, fetchXaiApiModels, fetchXaiSubscriptionModels, parseXaiApiModels, parseXaiMediaModels, parseXaiSubscriptionModels, setXaiCatalogFetcher } from './xai-models.ts';

const language = {
  models: [
    {
      id: 'grok-4.7',
      input_modalities: ['text', 'image'],
      output_modalities: ['text'],
      prompt_text_token_price: 20_000,
      completion_text_token_price: 60_000,
      cached_prompt_text_token_price: 5_000,
      prompt_text_token_price_long_context: 40_000,
      completion_text_token_price_long_context: 120_000,
      cached_prompt_text_token_price_long_context: 10_000,
      long_context_threshold: 200_000,
      capabilities: { reasoning_effort: ['xhigh', 'low', 'high', 'medium'] },
    },
    { id: 'grok-imagine-image', input_modalities: ['text'], output_modalities: ['image'] },
    { id: 'unknown-without-context', input_modalities: ['text'], output_modalities: ['text'] },
  ],
};
const models = { data: [{ id: 'grok-4.7', context_length: 500_000 }] };

describe('xAI account model discovery', () => {
  it('keeps authenticated image and video models outside the chat catalog', async () => {
    const image = { models: [
      { id: 'grok-imagine', name: 'Grok Imagine', input_modalities: ['text', 'image'], output_modalities: ['image'] },
      { id: 'grok-imagine', output_modalities: ['image'] },
      { id: 'wrong-route', input_modalities: ['text'], output_modalities: ['text'] },
      { id: 'output-only-wrong-route', output_modalities: ['text'] },
    ] };
    const video = { models: [{ id: 'grok-video', input_modalities: ['text', 'image'], output_modalities: ['video'] }] };
    expect(parseXaiMediaModels(image, 'image').map(model => model.id)).toEqual(['grok-imagine']);
    const requests: Array<{ url: string; auth: string | null }> = [];
    const fetcher = async (url: string, init: RequestInit) => {
      requests.push({ url, auth: new Headers(init.headers).get('Authorization') });
      return Response.json(url.endsWith('/image-generation-models') ? image : video);
    };
    const catalog = await fetchXaiApiMediaModels('api-key', 1_000, fetcher);
    expect(catalog.status).toBe('available');
    expect(catalog.models.map(model => [model.kind, model.id])).toEqual([
      ['image', 'grok-imagine'], ['video', 'grok-video'],
    ]);
    expect(requests.map(request => request.url)).toEqual([
      'https://api.x.ai/v1/image-generation-models',
      'https://api.x.ai/v1/video-generation-models',
    ]);
    expect(requests.every(request => request.auth === 'Bearer api-key')).toBe(true);
    expect(parseXaiApiModels(language, models).map(model => model.id)).toEqual(['pi/grok-4.7']);
  });

  it('reports partial or unavailable media directories without inventing account models', async () => {
    const partial = await fetchXaiApiMediaModels('api-key', 1_000, async url =>
      url.endsWith('/image-generation-models')
        ? Response.json({ models: [{ id: 'image-1' }] })
        : new Response(null, { status: 403 }));
    expect(partial).toMatchObject({ status: 'partial', models: [{ id: 'image-1', kind: 'image' }] });
    const unavailable = await fetchXaiApiMediaModels('api-key', 1_000, async () => new Response(null, { status: 403 }));
    expect(unavailable).toEqual({ models: [], status: 'unavailable' });
  });
  it('keeps subscription model membership separate from the Console API catalog', async () => {
    const requests: Array<{ url: string; auth: string | null }> = [];
    const fetcher = (async (url: string, init: RequestInit) => {
      requests.push({ url, auth: new Headers(init.headers).get('Authorization') });
      return Response.json({ data: [
        { id: 'grok-4.7', api_backend: 'responses', input_modalities: ['text', 'image'], output_modalities: ['text'] },
        { id: 'grok-imagine-image', api_backend: 'responses', context_window: 100_000, max_completion_tokens: 1, input_modalities: ['text'], output_modalities: ['image'] },
        { id: 'grok-imagine-video', api_backend: 'responses', mode: 'video', context_window: 100_000, max_completion_tokens: 1, input_modalities: ['text'], output_modalities: ['text'] },
        { id: 'grok-voice-transcription', api_backend: 'responses', mode: 'audio_transcription', context_window: 100_000, max_completion_tokens: 1, input_modalities: ['text'], output_modalities: ['text'] },
        { id: 'opaque-responses-model', api_backend: 'responses', context_window: 100_000, max_completion_tokens: 10_000 },
        { id: 'unverified-model', api_backend: 'responses' },
      ] });
    });
    const catalog = await fetchXaiSubscriptionModels('subscription-token', 1_000, fetcher);
    expect(requests).toEqual([{ url: 'https://cli-chat-proxy.grok.com/v1/models', auth: 'Bearer subscription-token' }]);
    expect(catalog.map(model => model.id)).toEqual(['pi/grok-4.7']);
    expect(catalog[0]?.modalities).toEqual({ input: ['text', 'image'], output: ['text'] });
    expect(catalog[0]?.pricingPerMillion).toBeUndefined();
    expect(() => parseXaiSubscriptionModels({ data: [{ id: 'unverified-model', api_backend: 'responses' }] })).toThrow('no runnable');
  });
  it('accepts a known SDK chat model without invented account modalities', () => {
    const catalog = parseXaiSubscriptionModels({ data: [{ id: 'grok-4.7', api_backend: 'responses' }] });
    expect(catalog.map(model => model.id)).toEqual(['pi/grok-4.7']);
    expect(catalog[0]?.modalities).toBeUndefined();
  });
  it('joins account membership, real context, and native efforts without using price as speed', () => {
    const discovered = parseXaiApiModels(language, models);
    expect(discovered).toHaveLength(1);
    expect(discovered[0]).toMatchObject({
      id: 'pi/grok-4.7',
      contextWindow: 500_000,
      catalogSource: 'provider',
      supportsThinking: true,
      supportsImages: true,
      modalities: { input: ['text', 'image'], output: ['text'] },
      reasoningEfforts: ['low', 'medium', 'high', 'xhigh'],
      pricingPerMillion: {
        input: 2,
        output: 6,
        cacheRead: 0.5,
        longContext: { inputTokensAtOrAbove: 200_000, input: 4, output: 12, cacheRead: 1 },
      },
    });
    expect(discovered[0]?.maxOutputTokens).toBe(500_000);
  });

  it('rejects malformed catalogs instead of presenting static data as live', () => {
    expect(() => parseXaiApiModels({ models: [] }, { data: [] })).toThrow('no runnable');
    expect(() => parseXaiApiModels({}, { data: [] })).toThrow('invalid');
  });

  it('preserves provider-advertised zero prices in the long-context tier', () => {
    const discovered = parseXaiApiModels({ models: [{
      id: 'free-preview',
      input_modalities: ['text'],
      output_modalities: ['text'],
      prompt_text_token_price: 10_000,
      completion_text_token_price: 20_000,
      prompt_text_token_price_long_context: 0,
      completion_text_token_price_long_context: 0,
      long_context_threshold: 100_000,
    }] }, { data: [{ id: 'free-preview', context_length: 200_000 }] });
    expect(discovered[0]?.pricingPerMillion?.longContext).toMatchObject({
      inputTokensAtOrAbove: 100_000,
      input: 0,
      output: 0,
    });
  });

  it('hides unknown models with incomplete runtime metadata', () => {
    const incomplete = {
      models: [
        { id: 'unknown-free', input_modalities: ['text'], output_modalities: ['text'] },
        language.models[0],
      ],
    };
    const catalog = { data: [{ id: 'unknown-free', context_length: 100_000 }, ...models.data] };
    expect(parseXaiApiModels(incomplete, catalog).map(model => model.id)).toEqual(['pi/grok-4.7']);
  });

  it('reads only the official xAI catalog with the supplied API key', async () => {
    const requests: Array<{ url: string; auth: string | null }> = [];
    const mockFetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      const url = String(input);
      requests.push({ url, auth: new Headers(init?.headers).get('Authorization') });
      return new Response(JSON.stringify(url.endsWith('/language-models') ? language : models), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;
    const discovered = await fetchXaiApiModels('test-key', 1_000, mockFetch);
    expect(discovered[0]?.id).toBe('pi/grok-4.7');
    expect(requests.map(request => request.url)).toEqual([
      'https://api.x.ai/v1/language-models',
      'https://api.x.ai/v1/models',
    ]);
    expect(requests.every(request => request.auth === 'Bearer test-key')).toBe(true);
  });

  it('uses the installed host transport when a desktop proxy is required', async () => {
    const requests: string[] = [];
    const hostFetch = (async (input: Parameters<typeof fetch>[0]) => {
      requests.push(String(input));
      return new Response(JSON.stringify(String(input).endsWith('/language-models') ? language : models), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;
    setXaiCatalogFetcher(hostFetch);
    try {
      expect((await fetchXaiApiModels('test-key', 1_000))[0]?.id).toBe('pi/grok-4.7');
      expect(requests).toHaveLength(2);
    } finally {
      setXaiCatalogFetcher(null);
    }
  });
});
