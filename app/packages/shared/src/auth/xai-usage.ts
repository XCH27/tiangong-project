/** Read-only Grok subscription usage adapter, following OpenClaw's xAI adapter. */
import { getValidXaiSubscriptionToken } from './xai-subscription.ts';
import { fetchOAuthToken } from './oauth-token-fetch.ts';

export interface XaiSubscriptionUsage {
  plan?: string;
  window?: {
    label: 'weekly' | 'monthly' | 'usage';
    usedPercent: number;
    resetAt?: number;
  };
  prepaidBalanceUsd?: number;
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function cents(value: unknown): number | undefined {
  const raw = object(value)?.val;
  const number = typeof raw === 'number' ? raw
    : typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : undefined;
  return number !== undefined && Number.isSafeInteger(number) && number >= 0 ? number : undefined;
}

export function parseXaiSubscriptionUsage(payload: unknown): XaiSubscriptionUsage {
  const body = object(payload);
  const config = object(body?.config);
  if (!config) throw new Error('Grok subscription usage response is invalid');
  const period = object(config.currentPeriod ?? config.current_period);
  const explicit = config.creditUsagePercent ?? config.credit_usage_percent;
  const used = cents(config.used);
  const monthly = cents(config.monthlyLimit ?? config.monthly_limit);
  const rawPercent = typeof explicit === 'number' && Number.isFinite(explicit) && explicit >= 0
    ? explicit : used !== undefined && monthly !== undefined && monthly > 0
      ? used / monthly * 100 : undefined;
  const periodType = typeof period?.type === 'string' ? period.type : '';
  const label = periodType.endsWith('WEEKLY') ? 'weekly'
    : periodType.endsWith('MONTHLY') || monthly !== undefined || config.billingPeriodEnd || config.billing_period_end
      ? 'monthly' : 'usage';
  const resetRaw = period?.end ?? config.billingPeriodEnd ?? config.billing_period_end;
  const resetTime = typeof resetRaw === 'string' ? Date.parse(resetRaw) : NaN;
  const planRaw = body?.subscription_tier ?? body?.subscriptionTier;
  const plan = typeof planRaw === 'string' && planRaw.length > 0 && planRaw.length <= 128 && !/[\x00-\x1f]/.test(planRaw)
    ? planRaw : undefined;
  const balance = cents(config.prepaidBalance ?? config.prepaid_balance);
  if (rawPercent === undefined && balance === undefined) throw new Error('Grok subscription usage is unavailable');
  return {
    ...(plan ? { plan } : {}),
    ...(rawPercent !== undefined ? { window: {
      label,
      usedPercent: Math.min(100, Math.max(0, rawPercent)),
      ...(Number.isFinite(resetTime) ? { resetAt: resetTime } : {}),
    } } : {}),
    ...(balance !== undefined ? { prepaidBalanceUsd: balance / 100 } : {}),
  };
}

export async function fetchXaiSubscriptionUsage(
  connectionSlug: string,
  fetcher: (url: string, init: RequestInit) => Promise<Response> = fetchOAuthToken,
): Promise<XaiSubscriptionUsage> {
  const token = await getValidXaiSubscriptionToken(connectionSlug);
  const response = await fetcher('https://cli-chat-proxy.grok.com/v1/billing?format=credits', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'x-grok-client-mode': 'cli',
      'x-grok-client-version': '1.0.4',
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error(`Grok subscription usage failed (HTTP ${response.status})`);
  }
  return parseXaiSubscriptionUsage(await response.json());
}
