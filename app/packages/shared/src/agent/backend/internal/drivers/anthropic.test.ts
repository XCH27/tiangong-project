import { afterEach, describe, expect, it } from 'bun:test';
import { anthropicDriver } from './anthropic.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('anthropicDriver.fetchModels', () => {
  it('uses the Claude OAuth catalog header only for subscription credentials', async () => {
    const headersSeen: Headers[] = [];
    globalThis.fetch = (async (_input, init) => {
      headersSeen.push(new Headers(init?.headers));
      return new Response(JSON.stringify({
        data: [{ id: 'claude-sonnet-5', display_name: 'Claude Sonnet 5', type: 'model', created_at: '' }],
        has_more: false,
      }), { status: 200 });
    }) as typeof fetch;
    const baseArgs = {
      connection: { slug: 'anthropic', name: 'Anthropic', providerType: 'anthropic', authType: 'oauth', createdAt: 1 } as any,
      hostRuntime: {} as any, resolvedPaths: {} as any, timeoutMs: 30_000,
    };
    await anthropicDriver.fetchModels!({ ...baseArgs, credentials: { oauthAccessToken: 'oauth-test' } });
    await anthropicDriver.fetchModels!({ ...baseArgs, credentials: { apiKey: 'api-test' } });
    expect(headersSeen[0]?.get('anthropic-beta')).toBe('oauth-2025-04-20');
    expect(headersSeen[0]?.get('authorization')).toBe('Bearer oauth-test');
    expect(headersSeen[1]?.get('anthropic-beta')).toBeNull();
    expect(headersSeen[1]?.get('x-api-key')).toBe('api-test');
  });
  it('uses account-advertised limits and exact effort levels without adding unsupported options', async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({
      data: [
        {
          id: 'claude-opus-4-8', display_name: 'Claude Opus 4.8', created_at: '2026-05-01T00:00:00Z', type: 'model',
          max_input_tokens: 800_000, max_tokens: 64_000,
          capabilities: {
            effort: {
              supported: true, low: { supported: true }, medium: { supported: true },
              high: { supported: true }, xhigh: { supported: false }, max: { supported: true },
            },
            thinking: { supported: true, types: { adaptive: { supported: true } } }, image_input: { supported: false },
          },
        },
        {
          id: 'claude-sonnet-4-6', display_name: 'Claude Sonnet 4.6', created_at: '2026-01-01T00:00:00Z', type: 'model',
          max_input_tokens: null, max_tokens: 0,
          capabilities: { effort: { supported: false }, thinking: { supported: false } },
        },
        {
          id: 'claude-opus-5-5', display_name: 'Claude Opus 5.5', created_at: '2026-09-22T00:00:00Z', type: 'model',
          capabilities: {
            effort: { supported: true, low: { supported: true }, medium: { supported: true }, high: { supported: true }, xhigh: { supported: true }, max: { supported: true } },
            thinking: { supported: true, types: { adaptive: { supported: true } } },
          },
        },
      ],
      has_more: false,
    }), { status: 200 })) as unknown as typeof fetch;

    const result = await anthropicDriver.fetchModels!({
      connection: {
        slug: 'anthropic', name: 'Anthropic', providerType: 'anthropic',
        authType: 'api_key', createdAt: Date.now(),
      } as any,
      credentials: { apiKey: 'sk-ant-test' }, hostRuntime: {} as any,
      resolvedPaths: {} as any, timeoutMs: 30_000,
    });

    expect(result.models[0]?.contextWindow).toBe(800_000);
    expect(result.models[0]?.maxOutputTokens).toBe(64_000);
    expect(result.models[0]?.reasoningEfforts).toEqual(['low', 'medium', 'high', 'max']);
    expect(result.models[0]?.supportsThinking).toBe(true);
    expect(result.models[0]?.adaptiveThinkingSupported).toBe(true);
    expect(result.models[0]?.reasoningDisableSupported).toBe(true);
    expect(result.models[0]?.supportsImages).toBe(false);
    expect(result.models[1]?.reasoningEfforts).toEqual([]);
    expect(result.models[1]?.supportsThinking).toBe(false);
    expect(result.models[1]?.maxOutputTokens).toBeUndefined();
    expect(result.models[2]?.reasoningEfforts).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);
    expect(result.models[2]?.contextWindow).toBeUndefined();
    expect(result.models[2]?.reasoningDisableSupported).toBe(false);
    expect(result.models[2]?.adaptiveThinkingSupported).toBe(true);
  });

  it('filters deprecated Opus 4.5 but keeps Opus 4.6, and prefers Opus 4.8 as default', async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({
      data: [
        { id: 'claude-opus-4-6', display_name: 'Claude Opus 4.6', created_at: '2026-01-01T00:00:00Z', type: 'model' },
        { id: 'claude-opus-4-8', display_name: 'Claude Opus 4.8', created_at: '2026-05-01T00:00:00Z', type: 'model' },
        { id: 'claude-opus-4-7', display_name: 'Claude Opus 4.7', created_at: '2026-04-01T00:00:00Z', type: 'model' },
        { id: 'claude-opus-4-5-20251101', display_name: 'Claude Opus 4.5', created_at: '2025-11-01T00:00:00Z', type: 'model' },
        { id: 'claude-sonnet-4-6', display_name: 'Claude Sonnet 4.6', created_at: '2026-01-01T00:00:00Z', type: 'model' },
      ],
      has_more: false,
      first_id: 'claude-opus-4-6',
      last_id: 'claude-sonnet-4-6',
    }), { status: 200 })) as unknown as typeof fetch;

    const result = await anthropicDriver.fetchModels!({
      connection: {
        slug: 'anthropic',
        name: 'Anthropic',
        providerType: 'anthropic',
        authType: 'api_key',
        createdAt: Date.now(),
      } as any,
      credentials: { apiKey: 'sk-ant-test' },
      hostRuntime: {} as any,
      resolvedPaths: {} as any,
      timeoutMs: 30_000,
    });

    expect(result.serverDefault).toBe('claude-opus-4-8');
    expect(result.models.map(m => m.id)).toEqual([
      'claude-opus-4-6',
      'claude-opus-4-8',
      'claude-opus-4-7',
      'claude-sonnet-4-6',
    ]);
    const opus48 = result.models.find(m => m.id === 'claude-opus-4-8')!;
    expect(opus48.name).toBe('Claude Opus 4.8');
    expect(opus48.contextWindow).toBe(1_000_000);
    const opus46 = result.models.find(m => m.id === 'claude-opus-4-6')!;
    expect(opus46.name).toBe('Claude Opus 4.6');
    expect(opus46.contextWindow).toBe(200_000);
  });
});
