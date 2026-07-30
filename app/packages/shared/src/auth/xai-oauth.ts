/**
 * xAI Grok subscription OAuth.
 *
 * Uses xAI's public Grok CLI device-code client. This is deliberately kept
 * separate from xAI API-key authentication while sharing the same Fleet LLM
 * connection and credential authorities.
 */

const XAI_OAUTH_SCOPE = 'openid profile email offline_access grok-cli:access api:access'
const XAI_DEVICE_CODE_URL = 'https://auth.x.ai/oauth2/device/code'
const XAI_TOKEN_URL = 'https://auth.x.ai/oauth2/token'
const DEVICE_CODE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code'

export interface XaiOAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  idToken?: string
}

export interface XaiDeviceCode {
  deviceCode: string
  userCode: string
  verificationUri: string
  verificationUriComplete?: string
  expiresIn: number
  interval: number
}

type OAuthErrorPayload = {
  error?: string
  error_description?: string
}

function parseOAuthError(payload: OAuthErrorPayload, fallback: string): string {
  return payload.error_description || payload.error || fallback
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new Error(`xAI OAuth returned an invalid response (${response.status})`)
  }
}

function requireClientId(clientId: string | undefined): string {
  const value = clientId?.trim()
  if (!value) {
    throw new Error('Grok subscription sign-in is not configured for this Fleet deployment')
  }
  return value
}

export async function requestXaiDeviceCode(clientId: string): Promise<XaiDeviceCode> {
  const resolvedClientId = requireClientId(clientId)
  const response = await fetch(XAI_DEVICE_CODE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: resolvedClientId,
      scope: XAI_OAUTH_SCOPE,
    }).toString(),
  })
  const payload = await readJson(response)
  if (!response.ok) {
    throw new Error(`Unable to start xAI sign-in: ${parseOAuthError(payload, `HTTP ${response.status}`)}`)
  }

  const deviceCode = payload.device_code
  const userCode = payload.user_code
  const verificationUri = payload.verification_uri
  if (typeof deviceCode !== 'string' || typeof userCode !== 'string' || typeof verificationUri !== 'string') {
    throw new Error('xAI OAuth did not return a usable device code')
  }

  return {
    deviceCode,
    userCode,
    verificationUri,
    verificationUriComplete: typeof payload.verification_uri_complete === 'string'
      ? payload.verification_uri_complete
      : undefined,
    expiresIn: typeof payload.expires_in === 'number' ? payload.expires_in : 900,
    interval: typeof payload.interval === 'number' ? Math.max(1, payload.interval) : 5,
  }
}

function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('xAI sign-in was cancelled', 'AbortError'))
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('xAI sign-in was cancelled', 'AbortError'))
    }, { once: true })
  })
}

function toTokens(payload: Record<string, unknown>, previousRefreshToken?: string): XaiOAuthTokens {
  if (typeof payload.access_token !== 'string') {
    throw new Error('xAI OAuth did not return an access token')
  }
  return {
    accessToken: payload.access_token,
    refreshToken: typeof payload.refresh_token === 'string'
      ? payload.refresh_token
      : previousRefreshToken,
    idToken: typeof payload.id_token === 'string' ? payload.id_token : undefined,
    expiresAt: typeof payload.expires_in === 'number'
      ? Date.now() + payload.expires_in * 1000
      : undefined,
  }
}

export async function loginXaiOAuth(options: {
  clientId: string
  onDeviceCode: (code: XaiDeviceCode) => void
  onProgress?: (message: string) => void
  signal?: AbortSignal
}): Promise<XaiOAuthTokens> {
  const clientId = requireClientId(options.clientId)
  const device = await requestXaiDeviceCode(clientId)
  options.onDeviceCode(device)
  options.onProgress?.('Waiting for xAI authorization…')

  const deadline = Date.now() + device.expiresIn * 1000
  let intervalMs = device.interval * 1000

  while (Date.now() < deadline) {
    await abortableDelay(intervalMs, options.signal)
    const response = await fetch(XAI_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: DEVICE_CODE_GRANT,
        client_id: clientId,
        device_code: device.deviceCode,
      }).toString(),
      signal: options.signal,
    })
    const payload = await readJson(response)

    if (response.ok) {
      options.onProgress?.('xAI authorization complete')
      return toTokens(payload)
    }

    const code = typeof payload.error === 'string' ? payload.error : ''
    if (code === 'authorization_pending') continue
    if (code === 'slow_down') {
      intervalMs += 5000
      continue
    }
    if (code === 'expired_token') break
    if (code === 'access_denied') {
      throw new Error('xAI sign-in was denied')
    }
    throw new Error(`xAI sign-in failed: ${parseOAuthError(payload, `HTTP ${response.status}`)}`)
  }

  throw new Error('xAI sign-in expired. Start the connection again.')
}

export async function refreshXaiTokens(
  refreshToken: string,
  clientId = process.env.FLEET_XAI_OAUTH_CLIENT_ID,
): Promise<XaiOAuthTokens> {
  const resolvedClientId = requireClientId(clientId)
  const response = await fetch(XAI_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: resolvedClientId,
      refresh_token: refreshToken,
    }).toString(),
  })
  const payload = await readJson(response)
  if (!response.ok) {
    throw new Error(`xAI token refresh failed: ${parseOAuthError(payload, `HTTP ${response.status}`)}`)
  }
  return toTokens(payload, refreshToken)
}
