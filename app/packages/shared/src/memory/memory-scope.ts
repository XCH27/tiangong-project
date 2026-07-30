/**
 * Memory scope and consolidation.
 *
 * Decision D5 and `docs/modules/memory/README.md` already settle the layers
 * (manual / user profile / long-term / working notes / domain / consolidation
 * log / archive), the floors, and the retrieval path. What neither addresses is
 * delegation — the packet was written for one agent per session, and the word
 * "sub-agent" does not appear in it. That gap has two failure modes and they
 * pull in opposite directions:
 *
 *   - **If every sub-agent writes memory**, working notes become the transcript
 *     dump D5 explicitly forbids. Five specialists on one task produce five
 *     accounts of the same events, contradicting each other with no way to
 *     adjudicate, and the captain later reads its own delegates' notes as if
 *     they were independent corroboration. That is an echo chamber with source
 *     pointers attached.
 *
 *   - **If no sub-agent writes anything**, every finding dies with the
 *     sub-session and the next run rediscovers it at full price — which is
 *     exactly the cost the delegation router exists to avoid.
 *
 * So the rule is asymmetric, and it mirrors how the rest of the system already
 * works: **a sub-agent reads a narrow slice and returns a report; only the
 * captain's session promotes anything durable.** A report is evidence; memory is
 * a claim about what is true. Keeping delegates on the evidence side means one
 * writer per task and one place where a contradiction has to be resolved.
 *
 * Reading is narrowed for the same reason tools are (Decision H13): handing a
 * specialist the whole memory is the same attention tax as handing it every
 * tool, and the slice it gets is defined by the same expert kit.
 */

/** Layers as defined by D5. Order is injection priority, most durable first. */
export type MemoryLayer =
  | 'manual'
  | 'user-profile'
  | 'long-term'
  | 'domain'
  | 'working-notes'
  | 'archive'

/** Partition from the recovered M10 dimensions; filtering precedes similarity. */
export type MemoryPartition =
  | 'session'
  | 'project'
  | 'tool'
  | 'user-preference'
  | 'policy'
  | 'sensitive-quarantine'
  | 'archive'

export type MemorySensitivity = 'normal' | 'sensitive' | 'raw_path' | 'uncertain'

// ── Who may write ───────────────────────────────────────────────────────────

export type MemoryWriteRole =
  /** The session a human is talking to. Writes working notes freely. */
  | 'captain'
  /** A delegated sub-session. Returns a report; writes no durable memory. */
  | 'delegate'
  /** The idle consolidation pass. The only writer of curated layers. */
  | 'consolidation'

export type WriteRefusal =
  | 'delegate-may-not-write-memory'
  | 'curated-layer-is-consolidation-only'
  | 'archive-is-not-writable-directly'
  | 'quarantined-partition'

export type MemoryWriteAdmission =
  | { admitted: true }
  | { admitted: false; reason: WriteRefusal }

/**
 * Whether this role may write this layer.
 *
 * A delegate is refused everywhere rather than given a private scratch layer:
 * a scratch layer that nothing reads is a leak of disk and attention, and one
 * that something reads is the echo chamber above.
 */
export function admitMemoryWrite(input: {
  role: MemoryWriteRole
  layer: MemoryLayer
  partition: MemoryPartition
}): MemoryWriteAdmission {
  if (input.partition === 'sensitive-quarantine') {
    return { admitted: false, reason: 'quarantined-partition' }
  }
  if (input.layer === 'archive') {
    // Consolidation moves entries into archive; nothing writes there directly,
    // or "archived" stops meaning "superseded by a logged pass".
    return input.role === 'consolidation'
      ? { admitted: true }
      : { admitted: false, reason: 'archive-is-not-writable-directly' }
  }
  if (input.role === 'delegate') {
    return { admitted: false, reason: 'delegate-may-not-write-memory' }
  }
  if (input.layer === 'working-notes') return { admitted: true }

  // Curated layers are written by the consolidation pass, so promotion is always
  // logged and reversible. A captain writing `MEMORY.md` mid-turn would bypass
  // the log and rewrite the cached prefix it is currently running on.
  return input.role === 'consolidation'
    ? { admitted: true }
    : { admitted: false, reason: 'curated-layer-is-consolidation-only' }
}

// ── What a delegate returns instead ─────────────────────────────────────────

/**
 * A finding a sub-agent hands back.
 *
 * Deliberately not a memory entry: it is a claim *with its evidence*, addressed
 * to the captain, which the captain may act on, discard, or nominate for
 * promotion. Keeping the two types distinct is what stops "the delegate said so"
 * from becoming "it is known".
 */
export interface DelegateFinding {
  /** Sub-session that produced it. */
  sessionId: string
  agentId: string
  /** One durable sentence, not a transcript. */
  claim: string
  /** Pointers into session evidence, required by D5 floor 3. */
  sources: readonly string[]
  /** What kind of fact this is, which decides where it could land. */
  partition: MemoryPartition
  /** The delegate's own confidence; low confidence should not silently persist. */
  confidence: 'high' | 'medium' | 'low'
}

export type PromotionRefusal =
  | 'no-source-pointer'
  | 'low-confidence'
  | 'sensitive'
  | 'cross-project'

export type PromotionDecision =
  | { promote: true; layer: MemoryLayer; partition: MemoryPartition }
  | { promote: false; reason: PromotionRefusal }

/**
 * Whether a delegate's finding may become durable memory.
 *
 * Refusals are the point. An unsourced claim cannot be checked later, a
 * low-confidence one becomes a fact by being written down, and a project fact
 * arriving in another project's session is the cross-project leak D5 floor 2
 * forbids. Each is reported rather than silently dropped so the captain can
 * decide whether to go and get better evidence.
 */
export function decidePromotion(input: {
  finding: DelegateFinding
  /** Project the captain's session belongs to, if any. */
  captainProjectId?: string
  /** Project the finding came from, if any. */
  findingProjectId?: string
  sensitivity: MemorySensitivity
}): PromotionDecision {
  if (input.finding.sources.length === 0) {
    return { promote: false, reason: 'no-source-pointer' }
  }
  if (input.sensitivity === 'sensitive' || input.sensitivity === 'uncertain') {
    return { promote: false, reason: 'sensitive' }
  }
  if (input.finding.confidence === 'low') {
    return { promote: false, reason: 'low-confidence' }
  }
  if (
    input.finding.partition === 'project'
    && input.findingProjectId !== undefined
    && input.findingProjectId !== input.captainProjectId
  ) {
    // Promotion across projects is an explicit origin-marked transfer, never an
    // automatic consequence of a delegate having been there.
    return { promote: false, reason: 'cross-project' }
  }

  // A tool fact outlives the project it was learned in — "this repo uses pnpm"
  // is project memory, but "this API returns 429 above 10 rps" is not.
  const layer: MemoryLayer = input.finding.partition === 'tool' ? 'domain' : 'working-notes'
  return { promote: true, layer, partition: input.finding.partition }
}

// ── What a delegate reads ───────────────────────────────────────────────────

export interface MemoryReadScope {
  layers: readonly MemoryLayer[]
  partitions: readonly MemoryPartition[]
  /** Domain files, when the expert kit names domains. */
  domains: readonly string[]
}

/**
 * The slice a role may read.
 *
 * A captain sees the durable layers because it is holding the conversation. A
 * delegate sees its domains and the tool partition and nothing else: it was
 * given one bounded job, and the user profile or another domain's long-term
 * memory is context it cannot act on but must still pay attention for.
 *
 * `sensitive-quarantine` and `archive` appear in no scope. Quarantine is never
 * injected by D5 floor 1, and archive is excluded from default recall — an
 * archived entry reaching a prompt would undo the consolidation that archived
 * it.
 */
export function memoryReadScope(input: {
  role: MemoryWriteRole
  /** Domains from the expert kit, if the session carries one. */
  domains?: readonly string[]
}): MemoryReadScope {
  const domains = input.domains ?? []

  if (input.role === 'delegate') {
    return {
      layers: domains.length > 0 ? ['domain'] : [],
      partitions: ['tool'],
      domains,
    }
  }

  if (input.role === 'consolidation') {
    // Consolidation reads everything it may rewrite, and nothing it may not.
    return {
      layers: ['user-profile', 'long-term', 'domain', 'working-notes'],
      partitions: ['session', 'project', 'tool', 'user-preference', 'policy'],
      domains,
    }
  }

  return {
    layers: ['manual', 'user-profile', 'long-term', ...(domains.length > 0 ? ['domain' as const] : [])],
    partitions: ['session', 'project', 'tool', 'user-preference', 'policy'],
    domains,
  }
}

// ── Tool-call memory ────────────────────────────────────────────────────────

/**
 * What is worth keeping from a tool call.
 *
 * Not the output — that is in the timeline, which stays the evidence authority.
 * What pays is the *durable fact the call revealed*: this repository installs
 * with pnpm, that endpoint rate-limits above ten requests a second, this test is
 * flaky on CI and not locally. Those survive the session, apply to every future
 * turn, and are the single cheapest thing to remember because rediscovering them
 * costs a full tool round-trip every time.
 */
export type ToolFactKind =
  /** How this project is built, run, tested. */
  | 'project-convention'
  /** A limit, quota, or failure mode of an external system. */
  | 'external-constraint'
  /** Something that did not work and why, so it is not retried identically. */
  | 'known-failure'

export interface ToolFact {
  kind: ToolFactKind
  claim: string
  /** Tool that revealed it, for provenance and for invalidation. */
  toolName: string
  sources: readonly string[]
  /** Observations supporting it; one observation is an anecdote. */
  observationCount: number
}

/**
 * Repetition, not eloquence, is what makes a tool fact durable.
 *
 * A single failure is as likely to be a transient as a rule, and writing it down
 * teaches the agent to avoid something that works. Two independent observations
 * is the cheapest threshold that excludes the one-off.
 */
export const TOOL_FACT_MIN_OBSERVATIONS = 2

export function isDurableToolFact(fact: ToolFact): boolean {
  if (fact.sources.length === 0) return false
  return fact.observationCount >= TOOL_FACT_MIN_OBSERVATIONS
}

/**
 * A tool fact is invalidated by the tool disappearing or the convention
 * changing, not by age. Time-based expiry would drop a correct fact about a
 * stable repository while keeping a wrong one about a moving API.
 */
export function isToolFactStale(input: {
  fact: ToolFact
  availableTools: ReadonlySet<string>
}): boolean {
  return !input.availableTools.has(input.fact.toolName)
}
