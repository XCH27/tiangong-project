/**
 * Map Claude and ChatGPT/Pi provider usage objects onto host attribution.
 *
 * Missing cache and price fields stay absent. Callers must not treat that
 * absence as zero cached tokens or zero cost. Auth tokens on the raw payload
 * are not copied.
 */

import type { TurnUsageInput } from './usage-attribution'

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
