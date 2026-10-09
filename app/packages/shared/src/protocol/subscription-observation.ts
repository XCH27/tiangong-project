/**
 * Subscription and usage observation shared by the human settings reader
 * and the agent-readable DTO.
 *
 * Missing tier, quota, and remaining stay unknown. They are not stored as
 * zero. An explicit zero from the provider stays a known zero. Credential
 * fields on the raw payload are not copied.
 */

export type ObservedField<T> =
  | { state: 'known'; value: T }
  | { state: 'unknown' }

export interface SubscriptionObservation {
  providerId?: string
  tier: ObservedField<string>
  quota: ObservedField<number>
  remaining: ObservedField<number>
  source: 'provider_response' | 'none'
}

export interface SubscriptionReading {
  tier: string
  quota: string
  remaining: string
  observation: SubscriptionObservation
}

function unknownObservation(providerId?: string): SubscriptionObservation {
  return {
    ...(providerId ? { providerId } : {}),
    tier: { state: 'unknown' },
    quota: { state: 'unknown' },
    remaining: { state: 'unknown' },
    source: 'none',
  }
}

function knownText(value: unknown): ObservedField<string> {
  if (typeof value !== 'string') return { state: 'unknown' }
  const trimmed = value.trim()
  if (trimmed.length === 0) return { state: 'unknown' }
  return { state: 'known', value: trimmed }
}

function knownNumber(value: unknown): ObservedField<number> {
  if (typeof value !== 'number' || !Number.isFinite(value)) return { state: 'unknown' }
  return { state: 'known', value }
}

function firstText(record: Record<string, unknown>, keys: string[]): ObservedField<string> {
  for (const key of keys) {
    if (!(key in record)) continue
    return knownText(record[key])
  }
  return { state: 'unknown' }
}

function firstNumber(record: Record<string, unknown>, keys: string[]): ObservedField<number> {
  for (const key of keys) {
    if (!(key in record)) continue
    return knownNumber(record[key])
  }
  return { state: 'unknown' }
}

function fieldKnown(field: ObservedField<string> | ObservedField<number>): boolean {
  switch (field.state) {
    case 'known':
      return true
    case 'unknown':
      return false
    default: {
      const unexpected: never = field
      throw new Error(`Unhandled observation state: ${String(unexpected)}`)
    }
  }
}

export function observeSubscription(raw: unknown): SubscriptionObservation {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return unknownObservation()
  const record = raw as Record<string, unknown>
  const providerId = knownText(record.providerId ?? record.provider)
  const tier = firstText(record, ['tier', 'plan', 'subscription_tier'])
  const quota = firstNumber(record, ['quota', 'limit'])
  const remaining = firstNumber(record, ['remaining'])
  const anyKnown = fieldKnown(tier) || fieldKnown(quota) || fieldKnown(remaining) || fieldKnown(providerId)
  return {
    ...(providerId.state === 'known' ? { providerId: providerId.value } : {}),
    tier,
    quota,
    remaining,
    source: anyKnown ? 'provider_response' : 'none',
  }
}

function displayField(field: ObservedField<string> | ObservedField<number>): string {
  switch (field.state) {
    case 'known':
      return String(field.value)
    case 'unknown':
      return 'unknown'
    default: {
      const unexpected: never = field
      throw new Error(`Unhandled observation state: ${String(unexpected)}`)
    }
  }
}

export function readSubscription(observation: SubscriptionObservation): SubscriptionReading {
  return {
    tier: displayField(observation.tier),
    quota: displayField(observation.quota),
    remaining: displayField(observation.remaining),
    observation,
  }
}

/** Agent-readable DTO. Missing fields stay unknown. */
export function readSubscriptionForAgent(raw: unknown): SubscriptionObservation {
  return observeSubscription(raw)
}

/** Human settings reader. Uses the same observation as the agent DTO. */
export function readSubscriptionForHuman(raw: unknown): SubscriptionReading {
  const observation = observeSubscription(raw)
  return readSubscription(observation)
}
