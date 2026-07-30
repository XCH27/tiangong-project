/**
 * Delegation routing.
 *
 * `spawn_session` already lets a captain start a sub-agent with a chosen model,
 * and `help=true` tells it which connections and models exist. What it does not
 * tell the captain is what any of them are *good for* or *cost*, so the choice
 * is made from a model id and a guess. The predictable result is that everything
 * runs on whatever the parent happened to be using — usually the strongest and
 * most expensive option — including the tasks that are three lines of text
 * manipulation.
 *
 * Routing is therefore constraint satisfaction, not a vibe. "Cheap for simple,
 * expensive for complex" is unimplementable because complexity is not observable
 * up front. What *is* observable is what a task requires: a tool loop, vision,
 * a large context, a specific runtime. So the rule is:
 *
 *   1. discard candidates that cannot do the work at all;
 *   2. among those that can, take the cheapest;
 *   3. escalate when the cheap one actually fails.
 *
 * Step 3 is where the savings are. Guessing the tier up front is wrong in both
 * directions and expensive in one of them; trying cheap and escalating on
 * failure pays the strong model's price only for the tasks that needed it.
 */

export type CostTier =
  /** Free or near-free: local models, included plan usage. */
  | 'free'
  | 'cheap'
  | 'standard'
  | 'premium'

const COST_ORDER: readonly CostTier[] = ['free', 'cheap', 'standard', 'premium']

export function costRank(tier: CostTier): number {
  return COST_ORDER.indexOf(tier)
}

/**
 * What a task needs, expressed as capabilities rather than as a model name.
 *
 * Naming a model in a task description couples the work to today's catalog; a
 * requirement survives the model being retired.
 */
export interface TaskRequirements {
  /** The agent must be able to call tools and act on the results. */
  tools?: boolean
  /** The task includes images. */
  vision?: boolean
  /** The task needs deliberate reasoning rather than pattern completion. */
  reasoning?: boolean
  /** Minimum context the input actually needs, in tokens. */
  minContextWindow?: number
  /** The task must run through a specific CLI agent, e.g. to reuse its auth. */
  requiresAgentId?: string
}

export interface AgentCapabilities {
  tools: boolean
  vision: boolean
  reasoning: boolean
  contextWindow: number
}

export interface DelegationCandidate {
  id: string
  label: string
  /** A hosted model, or a CLI agent that brings its own model. */
  kind: 'model' | 'cli-agent'
  costTier: CostTier
  capabilities: AgentCapabilities
  /** False while the agent is unreachable; kept in the list so it can be explained. */
  available: boolean
}

export function satisfies(
  candidate: DelegationCandidate,
  requirements: TaskRequirements,
): boolean {
  if (!candidate.available) return false
  if (requirements.requiresAgentId && candidate.id !== requirements.requiresAgentId) return false
  if (requirements.tools && !candidate.capabilities.tools) return false
  if (requirements.vision && !candidate.capabilities.vision) return false
  if (requirements.reasoning && !candidate.capabilities.reasoning) return false
  if (
    requirements.minContextWindow !== undefined
    && candidate.capabilities.contextWindow < requirements.minContextWindow
  ) return false
  return true
}

export type RoutingOutcome =
  | { routed: true; candidate: DelegationCandidate; escalationPath: readonly DelegationCandidate[] }
  | { routed: false; reason: 'no-candidate' | 'none-available' | 'requirements-unmet' }

/**
 * Pick the cheapest candidate that can do the work, and record what to escalate
 * to if it cannot.
 *
 * The escalation path is computed now rather than on failure so the captain can
 * show its plan before spending anything, and so a retry does not have to
 * re-derive the decision from a partial failure.
 */
export function routeDelegation(input: {
  requirements: TaskRequirements
  candidates: readonly DelegationCandidate[]
}): RoutingOutcome {
  if (input.candidates.length === 0) return { routed: false, reason: 'no-candidate' }
  if (!input.candidates.some((candidate) => candidate.available)) {
    return { routed: false, reason: 'none-available' }
  }

  const eligible = input.candidates
    .filter((candidate) => satisfies(candidate, input.requirements))
    // Cheapest first; ties broken by the larger context window, which is free to
    // prefer and occasionally saves a re-run.
    .sort((a, b) =>
      costRank(a.costTier) - costRank(b.costTier)
      || b.capabilities.contextWindow - a.capabilities.contextWindow)

  const [chosen, ...rest] = eligible
  if (!chosen) return { routed: false, reason: 'requirements-unmet' }

  return { routed: true, candidate: chosen, escalationPath: rest }
}

/**
 * Why a cheap attempt is being abandoned.
 *
 * Escalating on a wrong *answer* is not possible without a judge, so only
 * mechanical failures qualify. This keeps the rule honest: the system escalates
 * when the agent could not do the work, not when someone dislikes the result.
 */
export type EscalationTrigger =
  | 'tool-loop-exhausted'
  | 'context-overflow'
  | 'repeated-error'
  | 'explicit-request'

export function nextEscalation(
  outcome: Extract<RoutingOutcome, { routed: true }>,
): DelegationCandidate | undefined {
  return outcome.escalationPath[0]
}

/**
 * Escalation must strictly increase capability or cost, or it is a retry wearing
 * a different name — and a retry loop across same-tier candidates burns budget
 * without changing the outcome.
 */
export function isValidEscalation(
  from: DelegationCandidate,
  to: DelegationCandidate,
): boolean {
  if (costRank(to.costTier) > costRank(from.costTier)) return true
  return to.capabilities.contextWindow > from.capabilities.contextWindow
}

// ── What the captain is told ────────────────────────────────────────────────

/**
 * The advertisement a captain reads before delegating.
 *
 * Deliberately not a model list. A captain given ids picks by name recognition;
 * a captain given capabilities and a cost tier can pick by fit, which is the
 * only way the cheap options ever get used.
 */
export interface DelegationOffer {
  id: string
  label: string
  kind: DelegationCandidate['kind']
  costTier: CostTier
  /** Short, plain description of what this is worth using for. */
  suitedFor: readonly string[]
  available: boolean
  unavailableReason?: string
}

export function describeCandidate(candidate: DelegationCandidate): DelegationOffer {
  const suitedFor: string[] = []
  if (candidate.capabilities.reasoning) suitedFor.push('multi-step reasoning')
  if (candidate.capabilities.tools) suitedFor.push('tool use')
  if (candidate.capabilities.vision) suitedFor.push('images')
  if (!candidate.capabilities.reasoning && costRank(candidate.costTier) <= costRank('cheap')) {
    // Stated positively: this is the tier that should absorb the bulk of the
    // work, and it will not be chosen if it reads only as "weak".
    suitedFor.push('bulk text work, extraction, formatting')
  }
  if (candidate.capabilities.contextWindow >= 200_000) suitedFor.push('large inputs')

  return {
    id: candidate.id,
    label: candidate.label,
    kind: candidate.kind,
    costTier: candidate.costTier,
    suitedFor,
    available: candidate.available,
  }
}

/** Cheapest first, so the offer list itself nudges toward the default that saves money. */
export function buildDelegationOffers(
  candidates: readonly DelegationCandidate[],
): readonly DelegationOffer[] {
  return [...candidates]
    .sort((a, b) =>
      Number(b.available) - Number(a.available)
      || costRank(a.costTier) - costRank(b.costTier))
    .map(describeCandidate)
}

// ── Presentation ────────────────────────────────────────────────────────────

/**
 * A delegation as the conversation shows it.
 *
 * Sub-agents are real sessions, and the left list already excludes them
 * (`!s.parentSessionId`) while the board groups them under their parent. Both
 * are right: five sub-agents per task would make the session list unusable, and
 * a delegation that appears only on a board is invisible while you are reading
 * the conversation that caused it.
 *
 * So the conversation carries a compact strip — who was called, on what, how it
 * ended — and the full sub-session stays one click away. Day to day the strip is
 * the whole answer, which is what the parent activity rollup already assumes.
 */
export interface DelegationSummary {
  sessionId: string
  candidateId: string
  label: string
  costTier: CostTier
  status: 'running' | 'completed' | 'failed' | 'escalated'
  /** Set when this delegation replaced a cheaper attempt. */
  escalatedFrom?: string
  escalationTrigger?: EscalationTrigger
}

/**
 * One line per delegation, in call order, with escalations attached to the
 * attempt they replaced rather than listed as separate peers — an escalation is
 * one decision with two attempts, not two delegations.
 */
export function groupEscalations(
  summaries: readonly DelegationSummary[],
): readonly (DelegationSummary & { attempts: readonly DelegationSummary[] })[] {
  const byId = new Map(summaries.map((summary) => [summary.candidateId, summary]))
  const replaced = new Set(
    summaries.map((summary) => summary.escalatedFrom).filter((id): id is string => !!id),
  )

  return summaries
    .filter((summary) => !replaced.has(summary.candidateId))
    .map((summary) => {
      const attempts: DelegationSummary[] = []
      let cursor: DelegationSummary | undefined = summary
      while (cursor?.escalatedFrom) {
        const previous = byId.get(cursor.escalatedFrom)
        if (!previous) break
        attempts.unshift(previous)
        cursor = previous
      }
      return { ...summary, attempts }
    })
}
