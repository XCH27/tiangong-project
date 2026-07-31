/**
 * Usage rolled up across sessions.
 *
 * The app already tracks tokens per session and shows them one session at a
 * time in `SessionInfoPopover`. What no surface answers is the question people
 * actually have — *where is it all going* — which is only visible in aggregate:
 * which model, which project, and whether today is unusual.
 *
 * Two things this deliberately does not do.
 *
 * It does not sum costs of mixed provenance into one headline number. A total
 * built from three reported figures, nine derived ones and forty unknowns is
 * not a spend figure, it is a lower bound wearing a spend figure's clothes, and
 * it is *systematically* low — the unpriced sessions are exactly the custom
 * endpoints someone is most likely to be over-spending on. So coverage travels
 * with every total, and the UI is expected to say so.
 *
 * It does not weight anything by session count. Ten trivial sessions against
 * one long refactor is not a ratio anybody wants; tokens are the unit of both
 * cost and attention, so tokens are what rank.
 */

import {
  costAmount,
  isCharge,
  resolveSessionCost,
  totalTokens,
  type SessionCost,
  type UsageLike,
} from './session-cost.ts'
import type { ModelPricing } from './model-pricing.ts'

/** The fields a rollup needs from a session, so callers can pass their own DTO. */
export interface UsageSession {
  id: string
  name?: string
  model?: string
  projectId?: string
  /** Epoch ms used for day bucketing. */
  lastUsedAt: number
  tokenUsage?: UsageLike
}

/**
 * How much of a total rests on a real number.
 *
 * Counted in tokens rather than sessions: one unpriced session that moved two
 * million tokens matters more than thirty priced ones that moved a thousand
 * each, and a session-count ratio would report the opposite.
 */
export interface CostCoverage {
  /** Tokens whose cost is reported or derived. */
  pricedTokens: number
  /** Tokens with no rates and no report. */
  unpricedTokens: number
}

export function coverageRatio(coverage: CostCoverage): number {
  const total = coverage.pricedTokens + coverage.unpricedTokens
  return total === 0 ? 1 : coverage.pricedTokens / total
}

/** True when enough is unpriced that the total should not be read as a spend. */
export function coverageIsPartial(coverage: CostCoverage): boolean {
  return coverage.unpricedTokens > 0
}

export interface UsageTotals {
  sessions: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  totalTokens: number
  /** Metered spend only. Subscription draw is not money and is summed apart. */
  chargedUsd: number
  /** Metered-equivalent value of usage covered by a plan. */
  subscriptionUsd: number
  coverage: CostCoverage
}

export function emptyTotals(): UsageTotals {
  return {
    sessions: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    totalTokens: 0,
    chargedUsd: 0,
    subscriptionUsd: 0,
    coverage: { pricedTokens: 0, unpricedTokens: 0 },
  }
}

function accumulate(into: UsageTotals, session: UsageSession, cost: SessionCost): UsageTotals {
  const usage = session.tokenUsage
  const moved = usage ? totalTokens(usage) : 0

  into.sessions += 1
  into.inputTokens += usage?.inputTokens ?? 0
  into.outputTokens += usage?.outputTokens ?? 0
  into.cacheReadTokens += usage?.cacheReadTokens ?? 0
  into.totalTokens += moved

  if (cost.provenance === 'subscription') into.subscriptionUsd += costAmount(cost)
  else if (isCharge(cost)) into.chargedUsd += costAmount(cost)

  if (cost.provenance === 'unknown') into.coverage.unpricedTokens += moved
  else into.coverage.pricedTokens += moved

  return into
}

/** Resolves the rates for a session's model. Returns undefined when unknown. */
export type PricingLookup = (modelId: string | undefined) => ModelPricing | undefined

export interface UsageGroup {
  key: string
  totals: UsageTotals
}

export interface UsageRollup {
  totals: UsageTotals
  /** Descending by tokens. */
  byModel: readonly UsageGroup[]
  /** Descending by tokens. Sessions with no project group under `''`. */
  byProject: readonly UsageGroup[]
  /** Ascending by day, one entry per day present in the window — gaps included. */
  byDay: readonly UsageGroup[]
  /** Descending by tokens, so the expensive sessions surface without sorting. */
  sessions: readonly ScoredSession[]
}

export interface ScoredSession {
  session: UsageSession
  cost: SessionCost
  tokens: number
}

/**
 * Local calendar day, not UTC.
 *
 * A usage chart is read against the reader's own day — "yesterday evening" has
 * to land in yesterday's bar or the chart is answering a question nobody asked.
 * UTC bucketing puts late-evening work in tomorrow for most of the Americas and
 * early-morning work in yesterday across Asia.
 */
export function dayKey(epochMs: number): string {
  const date = new Date(epochMs)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function groupBy(
  scored: readonly ScoredSession[],
  keyOf: (entry: ScoredSession) => string,
): Map<string, UsageTotals> {
  const groups = new Map<string, UsageTotals>()
  for (const entry of scored) {
    const key = keyOf(entry)
    const totals = groups.get(key) ?? emptyTotals()
    accumulate(totals, entry.session, entry.cost)
    groups.set(key, totals)
  }
  return groups
}

function descendingByTokens(groups: Map<string, UsageTotals>): UsageGroup[] {
  return [...groups.entries()]
    .map(([key, totals]) => ({ key, totals }))
    .sort((a, b) => b.totals.totalTokens - a.totals.totalTokens)
}

/**
 * Fill every day between the first and last, so a quiet day reads as a gap in
 * the chart rather than being closed up. Compressing empty days makes a week
 * off look like continuous work at a lower rate.
 */
function dailySeries(groups: Map<string, UsageTotals>): UsageGroup[] {
  const keys = [...groups.keys()].sort()
  const first = keys[0]
  const last = keys[keys.length - 1]
  if (!first || !last) return []

  const series: UsageGroup[] = []
  const cursor = new Date(`${first}T00:00:00`)
  const end = new Date(`${last}T00:00:00`)

  while (cursor <= end) {
    const key = dayKey(cursor.getTime())
    series.push({ key, totals: groups.get(key) ?? emptyTotals() })
    cursor.setDate(cursor.getDate() + 1)
    if (series.length > 400) break // A pathological clock should not hang the render.
  }
  return series
}

/**
 * Roll a set of sessions up.
 *
 * `since` filters on `lastUsedAt` rather than `createdAt`: a session started
 * last month and worked on today spent today's tokens, and dating it to its
 * creation would attribute the spend to a window the user is not looking at.
 */
export function rollUpUsage(
  sessions: readonly UsageSession[],
  pricingFor: PricingLookup,
  options?: { since?: number },
): UsageRollup {
  const since = options?.since
  const inWindow = since === undefined
    ? sessions
    : sessions.filter((session) => session.lastUsedAt >= since)

  const scored: ScoredSession[] = inWindow.map((session) => ({
    session,
    cost: resolveSessionCost(session.tokenUsage, pricingFor(session.model)),
    tokens: session.tokenUsage ? totalTokens(session.tokenUsage) : 0,
  }))

  const totals = emptyTotals()
  for (const entry of scored) accumulate(totals, entry.session, entry.cost)

  return {
    totals,
    byModel: descendingByTokens(groupBy(scored, (entry) => entry.session.model ?? '')),
    byProject: descendingByTokens(groupBy(scored, (entry) => entry.session.projectId ?? '')),
    byDay: dailySeries(groupBy(scored, (entry) => dayKey(entry.session.lastUsedAt))),
    sessions: [...scored].sort((a, b) => b.tokens - a.tokens),
  }
}

/** Compact token count. Exact figures below 1000 — rounding 4 tokens to "0k" is absurd. */
export function formatTokens(count: number): string {
  if (count < 1_000) return `${count}`
  if (count < 1_000_000) return `${(count / 1_000).toFixed(count < 10_000 ? 1 : 0)}k`
  return `${(count / 1_000_000).toFixed(count < 10_000_000 ? 1 : 0)}M`
}
