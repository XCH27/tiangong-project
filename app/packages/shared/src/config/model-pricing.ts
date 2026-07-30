/**
 * Model pricing.
 *
 * `delegation-routing` sorts candidates by a hand-assigned `CostTier`, which is
 * a guess standing in for a number that providers publish. `ModelDefinition`
 * carries context window, modalities, reasoning efforts and runtime modes — and
 * no price at all, so nothing in the system can answer "what did that turn
 * cost" or "which of these two is cheaper for this shape of work".
 *
 * The shape here follows models.dev, which is what OpenCode normalizes against,
 * because two parts of real pricing are easy to model wrongly:
 *
 *   - **Cache reads and writes are priced separately, and not proportionally.**
 *     A cache write typically costs *more* than a fresh input token and a cache
 *     read costs a fraction of one. Collapsing them into "input" makes a
 *     cache-heavy agent look expensive and a cache-cold one look cheap — the
 *     opposite of the truth, and precisely backwards for deciding what to
 *     delegate.
 *   - **Price changes with context length.** Several providers charge a higher
 *     rate above 200k tokens. A flat rate silently under-reports exactly the
 *     long-context turns that cost the most.
 *
 * Prices are per million tokens, which is how providers quote them; converting
 * at the source avoids a scale error appearing in one call site out of ten.
 */

export interface TokenRates {
  /** Per million fresh input tokens. */
  input: number
  /** Per million output tokens. */
  output: number
  /** Per million tokens read from cache. Usually far below `input`. */
  cacheRead: number
  /** Per million tokens written to cache. Usually above `input`. */
  cacheWrite: number
}

/**
 * A rate that applies above a context threshold.
 *
 * Modelled as a floor rather than a range because providers publish it that way
 * and ranges invite an off-by-one at the boundary.
 */
export interface ContextTier {
  /** Applies when the request's total context is at or above this. */
  minContextTokens: number
  rates: TokenRates
}

export interface ModelPricing {
  /** Currency the rates are quoted in. */
  currency: 'USD'
  base: TokenRates
  /** Higher-context tiers, ascending. Empty for flat pricing. */
  tiers?: readonly ContextTier[]
  /**
   * True when usage is covered by a subscription rather than metered.
   *
   * Not the same as zero cost: the turn consumes an allowance the user paid for,
   * so it must not be reported as free, and it must not be compared against
   * metered prices as though it were.
   */
  subscription?: boolean
  /** When these numbers were captured, so stale pricing can be flagged. */
  updatedAt?: number
}

export const FREE_PRICING: ModelPricing = {
  currency: 'USD',
  base: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
}

// ── Rate selection ──────────────────────────────────────────────────────────

/**
 * Highest tier whose floor the request reaches; base rates otherwise.
 *
 * Tiers are sorted here rather than trusted, because a catalog assembled from
 * several providers has no reason to arrive ordered and picking the wrong tier
 * is a silent pricing error rather than a crash.
 */
export function ratesFor(pricing: ModelPricing, contextTokens: number): TokenRates {
  const applicable = [...(pricing.tiers ?? [])]
    .filter((tier) => contextTokens >= tier.minContextTokens)
    .sort((a, b) => b.minContextTokens - a.minContextTokens)
  return applicable[0]?.rates ?? pricing.base
}

// ── Cost of a turn ──────────────────────────────────────────────────────────

export interface TokenUsageBreakdown {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

export interface TurnCost {
  total: number
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  /** Rates were unknown, so this is not a real number. */
  estimated: boolean
  /** Covered by a subscription: real usage, but not a charge. */
  subscription: boolean
}

const PER_MILLION = 1_000_000

/**
 * Cost of one turn.
 *
 * Context tier is chosen from *input* tokens (fresh plus cached), because that
 * is what the provider is holding in the window when it prices the request;
 * output does not retroactively change the input rate.
 *
 * Subscription turns compute the equivalent metered cost and flag it, so a usage
 * view can show what the plan is worth without claiming money was spent.
 */
export function computeTurnCost(
  usage: TokenUsageBreakdown,
  pricing: ModelPricing | undefined,
): TurnCost {
  if (!pricing) {
    return {
      total: 0,
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      estimated: true,
      subscription: false,
    }
  }

  const contextTokens = usage.input + usage.cacheRead + usage.cacheWrite
  const rates = ratesFor(pricing, contextTokens)

  const input = (usage.input / PER_MILLION) * rates.input
  const output = (usage.output / PER_MILLION) * rates.output
  const cacheRead = (usage.cacheRead / PER_MILLION) * rates.cacheRead
  const cacheWrite = (usage.cacheWrite / PER_MILLION) * rates.cacheWrite

  return {
    total: input + output + cacheRead + cacheWrite,
    input,
    output,
    cacheRead,
    cacheWrite,
    estimated: false,
    subscription: pricing.subscription === true,
  }
}

// ── Comparison for routing ──────────────────────────────────────────────────

/**
 * Expected cost of a task shape, for choosing between candidates.
 *
 * Comparing published input rates alone ranks models wrongly whenever the work
 * is output-heavy or cache-heavy. A cheap-input model with expensive output can
 * lose badly on a generation task, and a model with cheap cache reads wins on
 * anything iterative — which is most agent work.
 */
export function estimateTaskCost(
  shape: TokenUsageBreakdown,
  pricing: ModelPricing | undefined,
): number {
  return computeTurnCost(shape, pricing).total
}

/**
 * A subscription model sorts ahead of every metered one at equal capability:
 * its marginal cost is zero even though its usage is not free, and an allowance
 * left unused is money already spent.
 */
export function comparePricing(
  a: { pricing?: ModelPricing },
  b: { pricing?: ModelPricing },
  shape: TokenUsageBreakdown,
): number {
  const aSubscription = a.pricing?.subscription === true
  const bSubscription = b.pricing?.subscription === true
  if (aSubscription !== bSubscription) return aSubscription ? -1 : 1

  // Unknown pricing sorts last: it cannot be shown to be cheap, and guessing in
  // its favour is how an expensive model becomes the silent default.
  const aKnown = a.pricing !== undefined
  const bKnown = b.pricing !== undefined
  if (aKnown !== bKnown) return aKnown ? -1 : 1

  return estimateTaskCost(shape, a.pricing) - estimateTaskCost(shape, b.pricing)
}

// ── Staleness ───────────────────────────────────────────────────────────────

/**
 * Published prices move. A figure old enough to be wrong should be shown as
 * uncertain rather than presented with the same confidence as a fresh one.
 */
export const PRICING_STALE_AFTER_MS = 90 * 24 * 60 * 60_000

export function isPricingStale(pricing: ModelPricing, now: number): boolean {
  if (pricing.updatedAt === undefined) return true
  return now - pricing.updatedAt > PRICING_STALE_AFTER_MS
}

/** Display helper: sub-cent costs need more precision than a currency formatter gives. */
export function formatCost(amount: number, locale?: string): string {
  if (amount === 0) return '$0.00'
  if (amount < 0.01) return `$${amount.toFixed(4)}`
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}
