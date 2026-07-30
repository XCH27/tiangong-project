import { afterEach, describe, expect, it } from 'bun:test'
import { refreshXaiTokens, requestXaiDeviceCode } from '../xai-oauth'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('xAI OAuth', () => {
  it('refuses to borrow an implicit OAuth client identity', async () => {
    await expect(requestXaiDeviceCode('')).rejects.toThrow(
      'not configured for this Fleet deployment',
    )
  })

  it('parses the standards-based device authorization response', async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({
      device_code: 'device-secret',
      user_code: 'ABCD-EFGH',
      verification_uri: 'https://auth.x.ai/activate',
      verification_uri_complete: 'https://auth.x.ai/activate?code=ABCD-EFGH',
      expires_in: 600,
      interval: 3,
    }), { status: 200 })) as unknown as typeof fetch

    const result = await requestXaiDeviceCode('fleet-client')
    expect(result.userCode).toBe('ABCD-EFGH')
    expect(result.interval).toBe(3)
    expect(result.verificationUriComplete).toContain('ABCD-EFGH')
  })

  it('persists a rotated refresh token from refresh responses', async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
      expires_in: 3600,
    }), { status: 200 })) as unknown as typeof fetch

    const result = await refreshXaiTokens('old-refresh', 'fleet-client')
    expect(result.accessToken).toBe('new-access')
    expect(result.refreshToken).toBe('new-refresh')
    expect(result.expiresAt).toBeGreaterThan(Date.now())
  })
})
