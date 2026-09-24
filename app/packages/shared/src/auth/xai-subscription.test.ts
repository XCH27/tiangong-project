import { describe, expect, it } from 'bun:test';
import { loginXaiSubscription, refreshXaiSubscription } from './xai-subscription.ts';

function reply(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('Grok subscription device flow', () => {
  it('uses the supplied host transport for device authorization and token polling', async () => {
    const requests: Array<{ url: string; form: URLSearchParams }> = [];
    const fetcher = async (url: string, init: RequestInit): Promise<Response> => {
      requests.push({ url, form: new URLSearchParams(init.body as URLSearchParams) });
      return requests.length === 1
        ? reply({ device_code: 'device', user_code: 'ABC-123', verification_uri: 'https://auth.x.ai/activate',
          verification_uri_complete: 'https://auth.x.ai/activate?user_code=ABC-123', interval: 0.001, expires_in: 30 })
        : reply({ access_token: 'access', refresh_token: 'refresh', expires_in: 3600 });
    };
    const shown: Array<{ userCode: string; verificationUri: string }> = [];
    const tokens = await loginXaiSubscription({
      signal: new AbortController().signal,
      onDeviceCode: code => shown.push(code),
      fetcher,
    });
    expect(requests.map(request => request.url)).toEqual([
      'https://auth.x.ai/oauth2/device/code', 'https://auth.x.ai/oauth2/token',
    ]);
    expect(requests[0]?.form.get('scope')).toContain('grok-cli:access');
    expect(requests[1]?.form.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:device_code');
    expect(shown).toEqual([{ userCode: 'ABC-123', verificationUri: 'https://auth.x.ai/activate?user_code=ABC-123' }]);
    expect(tokens).toMatchObject({ accessToken: 'access', refreshToken: 'refresh' });
    expect(tokens.expiresAt).toBeGreaterThan(Date.now() + 3_000_000);
  });

  it('keeps an unrotated refresh token and rejects an unsafe verification URI', async () => {
    const renewed = await refreshXaiSubscription(
      { accessToken: 'old', refreshToken: 'previous-refresh', expiresAt: 0 },
      new AbortController().signal,
      async (url, init) => {
        expect(url).toBe('https://auth.x.ai/oauth2/token');
        expect(new URLSearchParams(init.body as URLSearchParams).get('refresh_token')).toBe('previous-refresh');
        return reply({ access_token: 'new', expires_in: 3600 });
      },
    );
    expect(renewed.refreshToken).toBe('previous-refresh');

    await expect(loginXaiSubscription({
      signal: new AbortController().signal,
      onDeviceCode: () => { throw new Error('should not show an unsafe URL'); },
      fetcher: async () => reply({ device_code: 'device', user_code: 'ABC-123',
        verification_uri: 'javascript:alert(1)', expires_in: 30 }),
    })).rejects.toThrow('Untrusted verification URI');
  });
});
