import { describe, expect, it } from 'bun:test'
import { formatOAuthTokenError } from '../oauth-errors.ts'

describe('OAuth token failure diagnostics', () => {
  it('surfaces a nested provider reason instead of [object Object]', () => {
    const body = JSON.stringify({ error: { type: 'permission_error', message: 'This client is not authorized' } })
    expect(formatOAuthTokenError('Token exchange', 403, body))
      .toBe('Token exchange failed (HTTP 403): permission_error: This client is not authorized')
  })

  it('keeps a flat provider error code and description', () => {
    const body = JSON.stringify({ error: 'invalid_grant', error_description: 'The authorization code has expired' })
    expect(formatOAuthTokenError('Token exchange', 400, body))
      .toBe('Token exchange failed (HTTP 400): invalid_grant: The authorization code has expired')
  })

  it('does not expose an unstructured provider response', () => {
    expect(formatOAuthTokenError('Token refresh', 502, '<html>secret-token</html>'))
      .toBe('Token refresh failed (HTTP 502)')
  })
})
