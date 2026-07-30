import type {
  SubscriptionQuotaSnapshot,
  SubscriptionQuotaWindow,
} from '@craft-agent/shared/protocol'
import type { LlmConnection } from '@craft-agent/shared/config'
import { getCredentialManager } from '@craft-agent/shared/credentials'

const REQUEST_TIMEOUT_MS = 15_000

function clampPercent(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return null
  return Math.min(100, Math.max(0, number))
}

function resetAtMilliseconds(value: unknown): number | undefined {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number) || number <= 0) return undefined
  return number < 10_000_000_000 ? number * 1000 : number
}

export function parseClaudeSubscriptionQuota(
  payload: Record<string, unknown>,
): SubscriptionQuotaWindow[] {
  const candidates = [
    ['five_hour', 'short'],
    ['seven_day', 'weekly'],
  ] as const
  return candidates.flatMap(([id, period]) => {
    const value = payload[id]
    if (!value || typeof value !== 'object') return []
    const window = value as Record<string, unknown>
    const usedPercent = clampPercent(
      window.utilization ?? window.used_percent ?? window.percentage,
    )
    if (usedPercent === null) return []
    return [{
      id,
      period,
      usedPercent,
      resetAt: resetAtMilliseconds(
        window.resets_at ?? window.reset_at ?? window.resetAt,
      ),
    }]
  })
}

export function parseCodexSubscriptionQuota(
  payload: Record<string, unknown>,
): SubscriptionQuotaWindow[] {
  const rateLimit =
    payload.rate_limit && typeof payload.rate_limit === 'object'
      ? (payload.rate_limit as Record<string, unknown>)
      : payload
  const candidates = [
    ['primary_window', 'short'],
    ['secondary_window', 'weekly'],
  ] as const
  return candidates.flatMap(([id, fallbackPeriod]) => {
    const value = rateLimit[id]
    if (!value || typeof value !== 'object') return []
    const window = value as Record<string, unknown>
    const usedPercent = clampPercent(
      window.used_percent ?? window.utilization ?? window.percentage,
    )
    if (usedPercent === null) return []
    const seconds = Number(
      window.limit_window_seconds ?? window.window_seconds ?? 0,
    )
    const period =
      seconds >= 25 * 24 * 60 * 60
        ? 'monthly'
        : seconds >= 6 * 24 * 60 * 60
          ? 'weekly'
          : fallbackPeriod
    const absoluteReset = resetAtMilliseconds(
      window.reset_at ?? window.resets_at ?? window.resetAt,
    )
    const resetAfterSeconds = Number(window.reset_after_seconds)
    return [{
      id,
      period,
      usedPercent,
      resetAt:
        absoluteReset ??
        (Number.isFinite(resetAfterSeconds) && resetAfterSeconds > 0
          ? Date.now() + resetAfterSeconds * 1000
          : undefined),
    }]
  })
}

function accountIdFromIdToken(idToken: string | undefined): string | undefined {
  if (!idToken) return undefined
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as Record<string, unknown>
    const auth = payload['https://api.openai.com/auth']
    if (auth && typeof auth === 'object') {
      const accountId = (auth as Record<string, unknown>).chatgpt_account_id
      if (typeof accountId === 'string') return accountId
    }
    return typeof payload.chatgpt_account_id === 'string'
      ? payload.chatgpt_account_id
      : undefined
  } catch {
    return undefined
  }
}

async function requestJson(
  url: string,
  headers: Record<string, string>,
): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`Quota request failed (${response.status})`)
  }
  return (await response.json()) as Record<string, unknown>
}

export async function fetchSubscriptionQuota(
  connection: LlmConnection,
): Promise<SubscriptionQuotaSnapshot> {
  const updatedAt = Date.now()
  if (connection.authType !== 'oauth') {
    return {
      connectionSlug: connection.slug,
      status: 'unsupported',
      windows: [],
      updatedAt,
    }
  }

  const credentials = await getCredentialManager().getLlmOAuth(connection.slug)
  if (!credentials?.accessToken) {
    return {
      connectionSlug: connection.slug,
      status: 'error',
      windows: [],
      updatedAt,
      error: 'Subscription credential is unavailable.',
    }
  }

  try {
    if (
      connection.providerType === 'anthropic' ||
      connection.piAuthProvider === 'anthropic'
    ) {
      const payload = await requestJson(
        'https://api.anthropic.com/api/oauth/usage',
        {
          Authorization: `Bearer ${credentials.accessToken}`,
          'anthropic-beta': 'oauth-2025-04-20',
        },
      )
      return {
        connectionSlug: connection.slug,
        status: 'ready',
        windows: parseClaudeSubscriptionQuota(payload),
        updatedAt,
      }
    }

    if (
      connection.piAuthProvider === 'openai-codex' ||
      connection.piAuthProvider === 'openai'
    ) {
      const accountId = accountIdFromIdToken(credentials.idToken)
      const payload = await requestJson(
        'https://chatgpt.com/backend-api/wham/usage',
        {
          Authorization: `Bearer ${credentials.accessToken}`,
          ...(accountId ? { 'ChatGPT-Account-Id': accountId } : {}),
        },
      )
      return {
        connectionSlug: connection.slug,
        status: 'ready',
        windows: parseCodexSubscriptionQuota(payload),
        updatedAt,
      }
    }

    return {
      connectionSlug: connection.slug,
      status: 'unsupported',
      windows: [],
      updatedAt,
    }
  } catch (error) {
    return {
      connectionSlug: connection.slug,
      status: 'error',
      windows: [],
      updatedAt,
      error: error instanceof Error ? error.message : 'Quota request failed.',
    }
  }
}
