/** Read-only ChatGPT/Codex allowance from the private WHAM account endpoint. */
import { getChatGptAccountId } from './chatgpt-oauth.ts';
import { getValidChatGptOAuthToken, type ChatGptTokenResult } from './state.ts';
import { fetchOAuthToken } from './oauth-token-fetch.ts';

const USAGE_URL = 'https://chatgpt.com/backend-api/wham/usage';
const MAX_RESPONSE_BYTES = 256 * 1024;

export interface CodexUsageWindow {
  usedPercent: number;
  windowMinutes?: number;
  resetAt?: number;
}

export interface CodexUsageBucket {
  id: string;
  windows: CodexUsageWindow[];
}

export interface CodexSubscriptionUsage {
  plan?: string;
  buckets: CodexUsageBucket[];
  observedAt: number;
}

export type CodexUsageReadResult =
  | { status: 'available'; usage: CodexSubscriptionUsage }
  | { status: 'auth-required' | 'rate-limited' | 'unavailable' };

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function parseWindow(value: unknown): CodexUsageWindow | null {
  const row = record(value);
  const percent = row?.used_percent;
  if (typeof percent !== 'number' || !Number.isFinite(percent) || percent < 0 || percent > 100) return null;
  const seconds = row?.limit_window_seconds;
  const resetSeconds = row?.reset_at;
  return {
    usedPercent: percent,
    ...(typeof seconds === 'number' && Number.isSafeInteger(seconds) && seconds > 0
      ? { windowMinutes: Math.round(seconds / 60) } : {}),
    ...(typeof resetSeconds === 'number' && Number.isSafeInteger(resetSeconds) && resetSeconds > 0
      ? { resetAt: resetSeconds * 1000 } : {}),
  };
}

function parseBucket(id: string, value: unknown): CodexUsageBucket | null {
  const limit = record(value);
  const windows = [parseWindow(limit?.primary_window), parseWindow(limit?.secondary_window)]
    .filter((window): window is CodexUsageWindow => window !== null);
  return windows.length ? { id, windows } : null;
}

/** Preserve provider bucket names and omit missing windows instead of inventing a 0% reading. */
export function parseCodexSubscriptionUsage(payload: unknown, observedAt = Date.now()): CodexSubscriptionUsage {
  const body = record(payload);
  if (!body) throw new Error('Codex allowance response is invalid');
  const buckets: CodexUsageBucket[] = [];
  const primary = parseBucket('default', body.rate_limit);
  if (primary) buckets.push(primary);
  if (Array.isArray(body.additional_rate_limits)) {
    for (const item of body.additional_rate_limits.slice(0, 32)) {
      const row = record(item);
      const id = row?.limit_name ?? row?.metered_feature;
      if (typeof id !== 'string' || !id || id.length > 128) continue;
      const bucket = parseBucket(id, row?.rate_limit);
      if (bucket && !buckets.some(existing => existing.id === id)) buckets.push(bucket);
    }
  }
  if (!buckets.length) throw new Error('Codex allowance is unavailable');
  const plan = body.plan_type;
  return {
    ...(typeof plan === 'string' && plan.length > 0 && plan.length <= 128 ? { plan } : {}),
    buckets,
    observedAt,
  };
}

/** Uses the selected connection's credential and checks its identity again before publication. */
export async function readCodexSubscriptionUsage(
  connectionSlug: string,
  fetcher: (url: string, init: RequestInit) => Promise<Response> = fetchOAuthToken,
  readToken: (slug: string) => Promise<ChatGptTokenResult> = getValidChatGptOAuthToken,
): Promise<CodexUsageReadResult> {
  try {
    const token = await readToken(connectionSlug);
    const accountId = getChatGptAccountId(token.idToken, token.accessToken ?? undefined);
    if (!token.accessToken || !accountId) return { status: 'auth-required' };
    const response = await fetcher(USAGE_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        'ChatGPT-Account-Id': accountId,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5_000),
    });
    if (response.status === 401 || response.status === 403) return { status: 'auth-required' };
    if (response.status === 429) return { status: 'rate-limited' };
    if (!response.ok) return { status: 'unavailable' };
    const size = Number(response.headers.get('content-length'));
    if (size > MAX_RESPONSE_BYTES) return { status: 'unavailable' };
    const raw = await response.text();
    if (raw.length > MAX_RESPONSE_BYTES) return { status: 'unavailable' };
    const payload: unknown = JSON.parse(raw);
    const responseAccountId = record(payload)?.account_id;
    if (typeof responseAccountId === 'string' && responseAccountId !== accountId) {
      return { status: 'unavailable' };
    }
    const usage = parseCodexSubscriptionUsage(payload);
    const current = await readToken(connectionSlug);
    if (getChatGptAccountId(current.idToken, current.accessToken ?? undefined) !== accountId) {
      return { status: 'unavailable' };
    }
    return { status: 'available', usage };
  } catch {
    return { status: 'unavailable' };
  }
}
