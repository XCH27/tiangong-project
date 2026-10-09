/**
 * Usage and cost attribution for one admitted host turn.
 *
 * Missing provider cache or price fields stay unknown. They are not coerced
 * to zero and they are not reported as a confirmed miss or a free turn.
 */

export type ValueConfidence = 'confirmed' | 'estimated' | 'unknown'

export type UsageSource =
  | 'provider_response'
  | 'provider_invoice'
  | 'local_measurement'
  | 'estimate'
  | 'none'

export type CacheAttributionStatus =
  | 'confirmed_hit'
  | 'confirmed_miss'
  | 'not_supported'
  | 'unknown'

export interface TurnUsageInput {
  providerId?: string
  modelId?: string
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
  /** True only when the provider payload actually contained a cache field. */
  cacheFieldPresent?: boolean
  /** True when the provider states this model has no prompt cache. */
  cacheSupported?: boolean
  source: UsageSource
  amount?: number
  currency?: string
  pricingRef?: string
}

export interface UsageAttribution {
  providerId?: string
  modelId?: string
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
  cache: {
    status: CacheAttributionStatus
    source: 'provider_response' | 'provider_invoice' | 'none'
  }
  cost: {
    confidence: ValueConfidence
    amount?: number
    currency?: string
    pricingRef?: string
  }
}

function unknownAttribution(partial?: Pick<TurnUsageInput, 'providerId' | 'modelId' | 'inputTokens' | 'outputTokens'>): UsageAttribution {
  return {
    providerId: partial?.providerId,
    modelId: partial?.modelId,
    inputTokens: partial?.inputTokens,
    outputTokens: partial?.outputTokens,
    cache: { status: 'unknown', source: 'none' },
    cost: { confidence: 'unknown' },
  }
}

function isProviderSource(source: UsageSource): source is 'provider_response' | 'provider_invoice' {
  return source === 'provider_response' || source === 'provider_invoice'
}

export function attributeTurnUsage(input?: TurnUsageInput): UsageAttribution {
  if (!input || input.source === 'none') {
    return unknownAttribution(input)
  }

  const attribution = unknownAttribution(input)
  if (isProviderSource(input.source) && input.cacheSupported === false) {
    attribution.cache = { status: 'not_supported', source: input.source }
  } else if (isProviderSource(input.source) && input.cacheFieldPresent === true) {
    const cached = input.cachedInputTokens ?? 0
    attribution.cachedInputTokens = cached
    attribution.cache = {
      status: cached > 0 ? 'confirmed_hit' : 'confirmed_miss',
      source: input.source,
    }
  }

  const hasPriceProof = typeof input.amount === 'number'
    && typeof input.currency === 'string'
    && input.currency.length > 0
    && typeof input.pricingRef === 'string'
    && input.pricingRef.length > 0

  if (isProviderSource(input.source) && hasPriceProof) {
    attribution.cost = {
      confidence: 'confirmed',
      amount: input.amount,
      currency: input.currency,
      pricingRef: input.pricingRef,
    }
  } else if (input.source === 'estimate' && typeof input.amount === 'number') {
    attribution.cost = {
      confidence: 'estimated',
      amount: input.amount,
      currency: input.currency,
      pricingRef: input.pricingRef,
    }
  }

  return attribution
}
