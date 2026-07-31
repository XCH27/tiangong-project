/**
 * What a session cost, and how much that number can be trusted.
 *
 * `SessionTokenUsage.costUsd` is a single number with three different meanings
 * behind it, and nothing downstream can currently tell them apart:
 *
 *   - Claude and Pi backends report a real figure from the provider.
 *   - `sessions/storage.ts` initialises it to `0` for every new session.
 *   - Every OpenAI-compatible endpoint — which is all seven CN providers, all
 *     custom base URLs, and every discovered model — leaves it at that `0`,
 *     because the OpenAI response body has no cost field to copy.
 *
 * So the majority of sessions in a mixed setup report `$0.00`, and a usage
 * screen that renders `costUsd` directly tells the user their spend is zero
 * while their provider bill says otherwise. That is worse than showing nothing:
 * a wrong number is acted on, a missing one is investigated.
 *
 * Every figure here therefore travels with its provenance, and the caller is
 * forced to handle the unknown case because it is not a number:
 *
 *   reported     the provider said so
 *   derived      tokens × published rates, ours to compute
 *   subscription real usage against an allowance, not a charge
 *   unknown      no rates and no report — render as unknown, never as zero
 *
 * `derived` is deliberately not called "estimated". The arithmetic is exact;
 * what is uncertain is whether the published rate is the rate this account is
 * actually billed at, and calling it an estimate would imply the tokens were
 * approximate too.
 */

import { computeTurnCost, type ModelPricing, type TokenUsageBreakdown } from './model-pricing.ts'

export type CostProvenance = 'reported' | 'derived' | 'subscription' | 'unknown'

export type SessionCost =
  | {
      provenance: 'reported' | 'derived' | 'subscription'
      /** USD. For `subscription`, the metered-equivalent value of the usage. */
      amount: number
    }
  | { provenance: 'unknown' }

/** The token fields a session carries, narrowed to what pricing needs. */
export interface UsageLike {
  inputTokens?: number
  outputTokens?: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
  costUsd?: number
}

/**
 * Fresh input tokens, separated from cached ones.
 *
 * Anthropic's `input_tokens` already excludes cache reads and creations, but
 * `SessionTokenUsage.inputTokens` is documented as *including* them, and the
 * two adapters disagree in practice. Subtracting and clamping at zero is the
 * only reading that is safe under both: if the field turns out to have been
 * exclusive already, the clamp keeps it exclusive instead of going negative and
 * silently crediting the user for tokens they paid for.
 */
export function splitUsage(usage: UsageLike): TokenUsageBreakdown {
  const cacheRead = usage.cacheReadTokens ?? 0
  const cacheWrite = usage.cacheCreationTokens ?? 0
  const total = usage.inputTokens ?? 0
  return {
    input: Math.max(0, total - cacheRead - cacheWrite),
    output: usage.outputTokens ?? 0,
    cacheRead,
    cacheWrite,
  }
}

/** Tokens the session moved, regardless of whether anyone priced them. */
export function totalTokens(usage: UsageLike): number {
  return (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
}

/**
 * Resolve one session's cost.
 *
 * A reported figure wins over a derived one even when rates are known: the
 * provider is billing from its own meter, and preferring our arithmetic would
 * introduce a discrepancy against the invoice for no gain.
 *
 * A reported `0` is only believed when the session moved no tokens. Otherwise it
 * is the storage default showing through, and we fall back to deriving — or to
 * `unknown` if there is nothing to derive from.
 */
export function resolveSessionCost(
  usage: UsageLike | undefined,
  pricing: ModelPricing | undefined,
): SessionCost {
  if (!usage) return { provenance: 'unknown' }

  const moved = totalTokens(usage)
  const reported = usage.costUsd ?? 0

  if (reported > 0) return { provenance: 'reported', amount: reported }
  if (moved === 0) return { provenance: 'reported', amount: 0 }

  if (!pricing) return { provenance: 'unknown' }

  const turn = computeTurnCost(splitUsage(usage), pricing)
  return turn.subscription
    ? { provenance: 'subscription', amount: turn.total }
    : { provenance: 'derived', amount: turn.total }
}

// ── Where a model's rates come from ─────────────────────────────────────────

/**
 * Anything carrying user-stated rates. Structural rather than importing
 * `LlmConnection`, which would pull the whole connection module — and its
 * dependency on `models.ts` — into the pricing path for one field.
 *
 * A map beside the model list, rather than a `pricing` field on each entry,
 * because `models` holds bare strings as well as full definitions: pricing a
 * string entry would mean synthesising a whole `ModelDefinition` around it, and
 * a half-invented definition is a worse thing to persist than a separate map.
 */
export interface ModelCarrier {
  modelPricing?: Readonly<Record<string, ModelPricing>>
}

/**
 * Rates for a model, connection-defined first.
 *
 * A rate the user typed against their own endpoint always beats the bundled
 * registry, because for a custom endpoint the registry is guessing and the user
 * is reading their contract. This is the only route by which the CN providers
 * and any self-hosted endpoint can report a cost at all: their API responses
 * carry no price field, so if nobody states the rate there is nothing to derive
 * from.
 */
export function resolveModelPricing(
  modelId: string | undefined,
  carriers: readonly ModelCarrier[],
  fromRegistry?: (id: string) => { pricing?: ModelPricing } | undefined,
): ModelPricing | undefined {
  if (!modelId) return undefined

  for (const carrier of carriers) {
    const stated = carrier.modelPricing?.[modelId]
    if (stated) return stated
  }

  return fromRegistry?.(modelId)?.pricing
}

/** Amount if there is one, else zero — for arithmetic only, never for display. */
export function costAmount(cost: SessionCost): number {
  return cost.provenance === 'unknown' ? 0 : cost.amount
}

/**
 * Does this figure represent money leaving the account?
 *
 * Subscription usage does not, which is why it is summed separately: adding an
 * allowance draw to a metered charge produces a total that matches no bill.
 */
export function isCharge(cost: SessionCost): boolean {
  return cost.provenance === 'reported' || cost.provenance === 'derived'
}
