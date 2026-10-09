/**
 * Map Claude and ChatGPT/Pi provider usage objects onto host attribution.
 *
 * Missing cache and price fields stay absent. Callers must not treat that
 * absence as zero cached tokens or zero cost. Auth tokens on the raw payload
 * are not copied.
 *
 * `sealHostRecord` is the serialization gate for anything that can be written
 * by FileKernelSnapshotStore. It scrubs credentials, remaps raw provider usage,
 * and drops cache or price numbers that were not actually observed.
 */

import { scrubCredentialMaterial } from './credential-boundary'
import {
  attributeTurnUsage,
  type TurnUsageInput,
  type UsageAttribution,
  type UsageSource,
} from './usage-attribution'

export interface ClaudeUsageFields {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

export interface ChatGptUsageFields {
  input?: number
  output?: number
  cacheRead?: number
  cacheWrite?: number
  cost?: { total?: number }
}

export interface ProviderUsageOptions {
  modelId?: string
  pricingRef?: string
  totalCostUsd?: number
}

function numeric(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function withPrice(input: TurnUsageInput, amount: number | undefined, pricingRef: string | undefined): TurnUsageInput {
  if (typeof amount !== 'number' || !pricingRef) return input
  return {
    ...input,
    amount,
    currency: 'USD',
    pricingRef,
  }
}

export function turnUsageFromClaude(
  usage: ClaudeUsageFields | undefined,
  options: ProviderUsageOptions = {},
): TurnUsageInput {
  if (!usage) return { source: 'none', providerId: 'anthropic', modelId: options.modelId }
  const cacheRead = numeric(usage.cache_read_input_tokens)
  return withPrice({
    source: 'provider_response',
    providerId: 'anthropic',
    modelId: options.modelId,
    inputTokens: numeric(usage.input_tokens),
    outputTokens: numeric(usage.output_tokens),
    cacheFieldPresent: cacheRead !== undefined,
    ...(cacheRead !== undefined ? { cachedInputTokens: cacheRead } : {}),
  }, numeric(options.totalCostUsd), options.pricingRef)
}

export function turnUsageFromChatGpt(
  usage: ChatGptUsageFields | undefined,
  options: ProviderUsageOptions = {},
): TurnUsageInput {
  if (!usage) return { source: 'none', providerId: 'openai', modelId: options.modelId }
  const cacheRead = numeric(usage.cacheRead)
  return withPrice({
    source: 'provider_response',
    providerId: 'openai',
    modelId: options.modelId,
    inputTokens: numeric(usage.input),
    outputTokens: numeric(usage.output),
    cacheFieldPresent: cacheRead !== undefined,
    ...(cacheRead !== undefined ? { cachedInputTokens: cacheRead } : {}),
  }, numeric(usage.cost?.total), options.pricingRef)
}

function usageSource(value: unknown): UsageSource {
  switch (value) {
    case 'provider_response':
    case 'provider_invoice':
    case 'local_measurement':
    case 'estimate':
    case 'none':
      return value
    default:
      return 'provider_response'
  }
}

function isHostUsage(record: Record<string, unknown>): record is Record<string, unknown> & UsageAttribution {
  const cache = record.cache
  const cost = record.cost
  if (!cache || typeof cache !== 'object' || !cost || typeof cost !== 'object') return false
  const status = (cache as { status?: unknown }).status
  const confidence = (cost as { confidence?: unknown }).confidence
  const cacheKnown = status === 'confirmed_hit'
    || status === 'confirmed_miss'
    || status === 'not_supported'
    || status === 'unknown'
  const costKnown = confidence === 'confirmed' || confidence === 'estimated' || confidence === 'unknown'
  return cacheKnown && costKnown
}

function stripUnprovenUsage(usage: UsageAttribution): UsageAttribution {
  let cachedInputTokens = usage.cachedInputTokens
  switch (usage.cache.status) {
    case 'unknown':
    case 'not_supported':
      cachedInputTokens = undefined
      break
    case 'confirmed_hit':
    case 'confirmed_miss':
      break
    default: {
      const unexpected: never = usage.cache.status
      throw new Error(`Unhandled cache status: ${String(unexpected)}`)
    }
  }

  let cost = usage.cost
  switch (usage.cost.confidence) {
    case 'unknown':
      cost = { confidence: 'unknown' }
      break
    case 'confirmed':
    case 'estimated':
      break
    default: {
      const unexpected: never = usage.cost.confidence
      throw new Error(`Unhandled cost confidence: ${String(unexpected)}`)
    }
  }

  return {
    ...usage,
    cachedInputTokens,
    cost,
  }
}

function providerOptions(record: Record<string, unknown>): ProviderUsageOptions {
  const pricingRef = typeof record.pricingRef === 'string' && record.pricingRef.length > 0
    ? record.pricingRef
    : undefined
  const modelId = typeof record.modelId === 'string' ? record.modelId : undefined
  const totalCostUsd = numeric(record.total_cost_usd) ?? numeric(record.totalCostUsd)
  return { modelId, pricingRef, totalCostUsd }
}

function looksLikeClaude(record: Record<string, unknown>): boolean {
  return 'input_tokens' in record
    || 'output_tokens' in record
    || 'cache_read_input_tokens' in record
    || 'cache_creation_input_tokens' in record
}

function looksLikeChatGpt(record: Record<string, unknown>): boolean {
  if ('cacheRead' in record || 'cacheWrite' in record) return true
  if (record.cost && typeof record.cost === 'object' && !Array.isArray(record.cost)) return true
  return typeof record.input === 'number'
    && typeof record.output === 'number'
    && !('inputTokens' in record)
}

function fromCraftObservedUsage(record: Record<string, unknown>): UsageAttribution {
  const cacheRead = numeric(record.cacheReadTokens)
  const explicitPresence = record.cacheFieldPresent === true
  const observedPositive = cacheRead !== undefined && cacheRead > 0
  const cacheFieldPresent = (explicitPresence || observedPositive) && cacheRead !== undefined
  const options = providerOptions(record)
  const amount = numeric(record.costUsd) ?? numeric(record.amount)
  const currency = typeof record.currency === 'string' && record.currency.length > 0
    ? record.currency
    : undefined
  return attributeTurnUsage({
    source: usageSource(record.source),
    providerId: typeof record.providerId === 'string' ? record.providerId : undefined,
    modelId: options.modelId,
    inputTokens: numeric(record.inputTokens),
    outputTokens: numeric(record.outputTokens),
    cacheSupported: record.cacheSupported === false ? false : undefined,
    cacheFieldPresent,
    ...(cacheFieldPresent && cacheRead !== undefined ? { cachedInputTokens: cacheRead } : {}),
    ...(options.pricingRef && amount !== undefined
      ? { amount, currency: currency ?? 'USD', pricingRef: options.pricingRef }
      : {}),
  })
}

function looksLikeCraftUsage(record: Record<string, unknown>): boolean {
  return 'inputTokens' in record
    || 'outputTokens' in record
    || 'cacheReadTokens' in record
    || 'cacheCreationTokens' in record
    || 'costUsd' in record
}

/**
 * Turn one usage value into host attribution.
 *
 * A Craft complete-event `cacheReadTokens: 0` is not treated as a confirmed
 * miss. Claude's adapter fills that zero when the provider omitted the field.
 * An explicit provider `cache_read_input_tokens: 0` or Pi `cacheRead: 0` stays
 * a confirmed miss. A price of zero is kept only when a pricing reference is
 * present.
 */
export function normalizeUsageForPersistence(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const record = value as Record<string, unknown>
  if (isHostUsage(record)) return stripUnprovenUsage(record as UsageAttribution)
  if (looksLikeClaude(record)) {
    return attributeTurnUsage(turnUsageFromClaude(record as ClaudeUsageFields, providerOptions(record)))
  }
  if (looksLikeChatGpt(record)) {
    return attributeTurnUsage(turnUsageFromChatGpt(record as ChatGptUsageFields, providerOptions(record)))
  }
  if (looksLikeCraftUsage(record)) return fromCraftObservedUsage(record)
  return value
}

function normalizeUsageFields<T>(value: T, depth: number): T {
  if (depth > 8 || value == null || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    return value.map((item) => normalizeUsageFields(item, depth + 1)) as T
  }
  const next: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    next[key] = key === 'usage'
      ? normalizeUsageForPersistence(child)
      : normalizeUsageFields(child, depth + 1)
  }
  return next as T
}

export function sealHostRecord<T>(value: T): T {
  return normalizeUsageFields(scrubCredentialMaterial(value), 0)
}
