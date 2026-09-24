import { describe, expect, it } from 'bun:test';
import { parseCodexSubscriptionUsage, readCodexSubscriptionUsage } from './chatgpt-usage.ts';

function accountToken(accountId: string): string {
  const claims = { 'https://api.openai.com/auth': { chatgpt_account_id: accountId } };
  return `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
}

function usageResponse(): Response {
  return new Response(JSON.stringify({
    rate_limit: { primary_window: { used_percent: 25 } },
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

describe('ChatGPT/Codex subscription usage', () => {
  it('preserves the main and additional provider buckets with their real windows', () => {
    expect(parseCodexSubscriptionUsage({
      plan_type: 'plus',
      rate_limit: {
        primary_window: { used_percent: 25.5, limit_window_seconds: 18_000, reset_at: 2_000_000_000 },
        secondary_window: { used_percent: 70, limit_window_seconds: 604_800, reset_at: 2_001_000_000 },
      },
      additional_rate_limits: [
        { limit_name: 'code_review', rate_limit: { primary_window: { used_percent: 12 } } },
        { metered_feature: 'image', rate_limit: { secondary_window: { used_percent: 80 } } },
      ],
    }, 1234)).toEqual({
      plan: 'plus',
      observedAt: 1234,
      buckets: [
        {
          id: 'default',
          windows: [
            { usedPercent: 25.5, windowMinutes: 300, resetAt: 2_000_000_000_000 },
            { usedPercent: 70, windowMinutes: 10_080, resetAt: 2_001_000_000_000 },
          ],
        },
        { id: 'code_review', windows: [{ usedPercent: 12 }] },
        { id: 'image', windows: [{ usedPercent: 80 }] },
      ],
    });
  });

  it('does not invent missing plan, window duration, reset time, or usage percentage', () => {
    expect(parseCodexSubscriptionUsage({
      rate_limit: {
        primary_window: { used_percent: 0 },
        secondary_window: { limit_window_seconds: 604_800, reset_at: 2_000_000_000 },
      },
      additional_rate_limits: [
        { limit_name: 'empty', rate_limit: { primary_window: {} } },
      ],
    }, 5678)).toEqual({
      observedAt: 5678,
      buckets: [{ id: 'default', windows: [{ usedPercent: 0 }] }],
    });
    expect(() => parseCodexSubscriptionUsage({ rate_limit: { primary_window: {} } })).toThrow('unavailable');
  });

  it('classifies expired authorization and provider rate limits separately', async () => {
    for (const [httpStatus, status] of [[401, 'auth-required'], [429, 'rate-limited']] as const) {
      const result = await readCodexSubscriptionUsage(
        'selected-connection',
        async () => new Response(null, { status: httpStatus }),
        async () => ({ accessToken: 'selected-access', idToken: accountToken('account-a') }),
      );
      expect(result).toEqual({ status });
    }
  });

  it('uses the selected connection credential and account header for the usage request', async () => {
    const tokenReads: string[] = [];
    let request: { url: string; init: RequestInit } | undefined;
    const result = await readCodexSubscriptionUsage(
      'selected-connection',
      async (url, init) => {
        request = { url, init };
        return usageResponse();
      },
      async (slug) => {
        tokenReads.push(slug);
        return { accessToken: 'selected-access', idToken: accountToken('account-a') };
      },
    );

    expect(tokenReads).toEqual(['selected-connection', 'selected-connection']);
    expect(request?.url).toBe('https://chatgpt.com/backend-api/wham/usage');
    expect(request?.init.method).toBe('GET');
    const headers = new Headers(request?.init.headers);
    expect(headers.get('Authorization')).toBe('Bearer selected-access');
    expect(headers.get('ChatGPT-Account-Id')).toBe('account-a');
    expect(result).toMatchObject({
      status: 'available',
      usage: { buckets: [{ id: 'default', windows: [{ usedPercent: 25 }] }] },
    });
  });

  it('does not publish usage after the selected connection changes account', async () => {
    let tokenReads = 0;
    const result = await readCodexSubscriptionUsage(
      'selected-connection',
      async () => usageResponse(),
      async () => {
        tokenReads++;
        return {
          accessToken: 'selected-access',
          idToken: accountToken(tokenReads === 1 ? 'account-a' : 'account-b'),
        };
      },
    );

    expect(tokenReads).toBe(2);
    expect(result).toEqual({ status: 'unavailable' });
  });

  it('does not publish a response attributed to another account', async () => {
    const result = await readCodexSubscriptionUsage(
      'selected-connection',
      async () => new Response(JSON.stringify({
        account_id: 'account-b',
        rate_limit: { primary_window: { used_percent: 25 } },
      }), { status: 200 }),
      async () => ({ accessToken: 'selected-access', idToken: accountToken('account-a') }),
    );
    expect(result).toEqual({ status: 'unavailable' });
  });

  it('requires an account identity before making a request', async () => {
    let requests = 0;
    const result = await readCodexSubscriptionUsage(
      'selected-connection',
      async () => {
        requests++;
        return usageResponse();
      },
      async () => ({ accessToken: 'selected-access', idToken: 'not-a-jwt' }),
    );

    expect(result).toEqual({ status: 'auth-required' });
    expect(requests).toBe(0);
  });
});
