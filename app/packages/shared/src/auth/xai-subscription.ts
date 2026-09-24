/** Pi 0.87.1 xAI device flow, using Craft's proxy-aware OAuth transport. */
import { getCredentialManager } from '../credentials/manager.ts';
import { fetchOAuthToken, type OAuthTokenFetcher } from './oauth-token-fetch.ts';

const CLIENT_ID = 'b1a00492-073a-47ea-816f-4c329264a828';
const SCOPE = 'openid profile email offline_access grok-cli:access api:access';
const DEVICE_URL = 'https://auth.x.ai/oauth2/device/code';
const TOKEN_URL = 'https://auth.x.ai/oauth2/token';
const DEFAULT_INTERVAL_MS = 5_000;
const EXPIRY_SKEW_MS = 5 * 60_000;

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};
}

function requiredString(body: JsonObject, field: string): string {
  const value = body[field];
  if (typeof value !== 'string' || value.length === 0) throw new Error(`Invalid xAI OAuth response field: ${field}`);
  return value;
}

function positiveNumber(body: JsonObject, field: string): number {
  const value = body[field];
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid xAI OAuth response field: ${field}`);
  }
  return value;
}

function verificationUri(raw: string): string {
  let parsed: URL;
  try { parsed = new URL(raw); } catch { throw new Error('Untrusted verification URI in xAI OAuth response'); }
  if (parsed.protocol !== 'https:') throw new Error('Untrusted verification URI in xAI OAuth response');
  return parsed.href;
}

async function postForm(
  url: string, fields: Record<string, string>, signal: AbortSignal, fetcher: OAuthTokenFetcher,
): Promise<{ ok: boolean; status: number; body: JsonObject }> {
  if (signal.aborted) throw new Error('Login cancelled');
  let response: Response;
  try {
    response = await fetcher(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields),
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw new Error('Login cancelled');
    throw error;
  }
  let body: JsonObject;
  try { body = object(await response.json()); } catch {
    if (signal.aborted) throw new Error('Login cancelled');
    throw new Error(`xAI OAuth returned invalid JSON (HTTP ${response.status})`);
  }
  return { ok: response.ok, status: response.status, body };
}

function requestFailure(action: string, response: { status: number; body: JsonObject }): Error {
  const code = typeof response.body.error === 'string' ? response.body.error : undefined;
  const description = typeof response.body.error_description === 'string' ? response.body.error_description : undefined;
  const detail = [code, description].filter(Boolean).join(': ');
  return new Error(`xAI OAuth ${action} failed (HTTP ${response.status})${detail ? `: ${detail}` : ''}`);
}

function fromTokenResponse(body: JsonObject, priorRefresh?: string): XaiSubscriptionTokens {
  const accessToken = requiredString(body, 'access_token');
  const refreshToken = body.refresh_token === undefined && priorRefresh
    ? priorRefresh : requiredString(body, 'refresh_token');
  const lifetime = body.expires_in === undefined ? 3600 : positiveNumber(body, 'expires_in');
  return { accessToken, refreshToken, expiresAt: Date.now() + lifetime * 1000 - EXPIRY_SKEW_MS };
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error('Login cancelled'));
    const onAbort = () => { clearTimeout(timer); reject(new Error('Login cancelled')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve(); }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export interface XaiSubscriptionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export async function loginXaiSubscription(options: {
  signal: AbortSignal;
  onDeviceCode: (code: { userCode: string; verificationUri: string }) => void;
  fetcher?: OAuthTokenFetcher;
}): Promise<XaiSubscriptionTokens> {
  const fetcher = options.fetcher ?? fetchOAuthToken;
  const device = await postForm(DEVICE_URL, {
    client_id: CLIENT_ID, scope: SCOPE, referrer: 'pi',
  }, options.signal, fetcher);
  if (!device.ok) throw requestFailure('device authorization', device);
  const code = requiredString(device.body, 'device_code');
  const userCode = requiredString(device.body, 'user_code');
  const uri = verificationUri(requiredString(device.body, 'verification_uri'));
  const complete = typeof device.body.verification_uri_complete === 'string'
    ? verificationUri(device.body.verification_uri_complete) : undefined;
  const deadline = Date.now() + positiveNumber(device.body, 'expires_in') * 1000;
  const suppliedInterval = device.body.interval;
  let intervalMs = typeof suppliedInterval === 'number' && Number.isFinite(suppliedInterval) && suppliedInterval > 0
    ? Math.max(1_000, Math.floor(suppliedInterval * 1000)) : DEFAULT_INTERVAL_MS;
  options.onDeviceCode({ userCode, verificationUri: complete ?? uri });

  // RFC 8628: wait before the first request, honour slow_down and stop at expiry.
  while (Date.now() < deadline) {
    await sleep(Math.min(intervalMs, deadline - Date.now()), options.signal);
    if (Date.now() >= deadline) break;
    const response = await postForm(TOKEN_URL, {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      client_id: CLIENT_ID, device_code: code,
    }, options.signal, fetcher);
    if (response.ok) return fromTokenResponse(response.body);
    const status = response.body.error;
    if (status === 'authorization_pending') continue;
    if (status === 'slow_down') {
      const serverInterval = response.body.interval;
      intervalMs = typeof serverInterval === 'number' && Number.isFinite(serverInterval) && serverInterval > 0
        ? Math.max(1_000, Math.floor(serverInterval * 1000)) : intervalMs + 5_000;
      continue;
    }
    if (status === 'access_denied' || status === 'authorization_denied') throw new Error('xAI device authorization was denied');
    if (status === 'expired_token') throw new Error('xAI device code expired');
    throw requestFailure('device token polling', response);
  }
  throw new Error('Device flow timed out');
}

export async function refreshXaiSubscription(
  tokens: XaiSubscriptionTokens, signal: AbortSignal, fetcher: OAuthTokenFetcher = fetchOAuthToken,
): Promise<XaiSubscriptionTokens> {
  const response = await postForm(TOKEN_URL, {
    grant_type: 'refresh_token', client_id: CLIENT_ID, refresh_token: tokens.refreshToken,
  }, signal, fetcher);
  if (!response.ok) throw requestFailure('token refresh', response);
  return fromTokenResponse(response.body, tokens.refreshToken);
}

// Discovery, validation, usage and active sessions share one connection-scoped
// credential. Refresh once per account before any of those routes read it.
const refreshes = new Map<string, Promise<string>>();

export async function getValidXaiSubscriptionToken(connectionSlug: string): Promise<string> {
  const pending = refreshes.get(connectionSlug);
  if (pending) return pending;
  const run = (async () => {
    const manager = getCredentialManager();
    const stored = await manager.getLlmOAuth(connectionSlug);
    if (!stored?.accessToken) throw new Error('Grok subscription sign-in is required');
    if (stored.expiresAt && stored.expiresAt > Date.now() + 60_000) return stored.accessToken;
    if (!stored.refreshToken) throw new Error('Grok subscription sign-in has expired');
    const updated = await refreshXaiSubscription({
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken,
      expiresAt: stored.expiresAt ?? 0,
    }, new AbortController().signal);
    await manager.setLlmOAuth(connectionSlug, updated);
    return updated.accessToken;
  })();
  refreshes.set(connectionSlug, run);
  try {
    return await run;
  } finally {
    if (refreshes.get(connectionSlug) === run) refreshes.delete(connectionSlug);
  }
}
