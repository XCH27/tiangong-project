import type { ExpertSkill } from './skill-routing'
import type { KitSourceBinding } from './kit-sources'

/**
 * The memory-curator kit.
 *
 * A worked example of the whole design in one place: sources declared by the kit
 * rather than connected globally, skills routed rather than loaded, and a
 * consolidation loop that earns its keep. It is also the kit that makes every
 * other kit better, because what it produces is the durable material the rest of
 * the system reads.
 *
 * The mechanism follows Hermes' curator, which solves the problem this kit
 * exists for: an agent that saves a skill every time it solves something novel
 * ends up with dozens of narrow near-duplicates that pollute the catalog and
 * waste tokens on every turn. Four of its choices are load-bearing and are kept:
 *
 *   - **Idle-triggered, not scheduled.** Requires both an interval since the
 *     last pass and a stretch of inactivity. A cron pass fires mid-task and
 *     rewrites the prefix the session is running on.
 *   - **Two phases, and the expensive one is off by default.** Deterministic
 *     ageing costs nothing and runs always; the model-driven consolidation makes
 *     broad structural changes and is opt-in.
 *   - **Never deletes.** The worst outcome is archival, which is recoverable.
 *     Pinned entries are untouchable by the pass *and* by the agent.
 *   - **First run defers a full interval.** A user gets one whole cycle to look
 *     at what accumulated and pin or opt out before anything is moved.
 *
 * Two additions Fleet's constraints require. Imported archives are searched, not
 * absorbed (`kit-sources.ts`) — the value of a chat log is the pattern across
 * it, not passages to quote. And the pass runs on a cheap model by declaring the
 * requirement rather than naming one: ageing and dedupe are not reasoning work,
 * and paying premium rates for them is how consolidation gets switched off.
 */

// ── What it reads ───────────────────────────────────────────────────────────

/**
 * Only the workspace binding is required. A curator with no archives still has
 * a job — this session's notes are the bulk of what it consolidates — and
 * demanding an import before the kit runs at all makes it useless on day one.
 */
export const MEMORY_CURATOR_SOURCES: readonly KitSourceBinding[] = [
  {
    id: 'workspace.notes',
    kind: 'workspace-files',
    label: 'Working notes and project records',
    locator: 'memory/notes',
    required: true,
    sensitivity: 'normal',
  },
  {
    id: 'archive.chat-exports',
    kind: 'local-archive',
    label: 'Chat exports from other applications',
    locator: '~/Documents/chat-exports',
    required: false,
    // Sensitivity is forced regardless of what is declared here: this is
    // somebody's correspondence, and the kit author is not that somebody.
  },
  {
    id: 'archive.project-records',
    kind: 'local-archive',
    label: 'Historical project records',
    locator: '~/Documents/project-archive',
    required: false,
  },
  {
    id: 'reference.memory-research',
    kind: 'reference-corpus',
    label: 'Memory and consolidation research',
    locator: 'docs/references/context',
    required: false,
    sensitivity: 'normal',
  },
]

// ── Ageing, which costs nothing ─────────────────────────────────────────────

/**
 * Deterministic lifecycle thresholds.
 *
 * Days rather than access counts: a note read twice in one afternoon and never
 * again is not more durable than one read once a month, and count-based decay
 * rewards whatever happened to be open recently.
 */
export const CURATOR_AGEING = {
  staleAfterDays: 30,
  archiveAfterDays: 90,
  /** Minimum gap between passes. */
  intervalHours: 168,
  /** Required quiet before a pass may start. */
  minIdleHours: 2,
} as const

export type EntryLifecycle = 'active' | 'stale' | 'archived'

export function ageEntry(input: {
  lastUsedAt: number
  now: number
  pinned?: boolean
}): EntryLifecycle {
  // Pinning is a promise, and a promise a background pass can override is not
  // one. This is checked before anything else for that reason.
  if (input.pinned) return 'active'

  const days = (input.now - input.lastUsedAt) / 86_400_000
  if (days >= CURATOR_AGEING.archiveAfterDays) return 'archived'
  if (days >= CURATOR_AGEING.staleAfterDays) return 'stale'
  return 'active'
}

export type CuratorBlockedReason =
  | 'too-soon'
  | 'session-active'
  /** First observation on a fresh install seeds the clock and defers. */
  | 'first-run-deferred'

export type CuratorAdmission =
  | { admitted: true }
  | { admitted: false; reason: CuratorBlockedReason }

/**
 * Whether a pass may run now.
 *
 * Both conditions are required. A cron-style pass that fires while someone is
 * working rewrites the material their current turn is reading; an idle-only
 * trigger runs every time they get coffee.
 */
export function admitCuratorRun(input: {
  lastRunAt?: number
  lastActivityAt: number
  now: number
}): CuratorAdmission {
  if (input.lastRunAt === undefined) {
    // Seeding rather than running gives the user a full cycle to look at what
    // accumulated, pin what matters, or turn the pass off before it moves
    // anything.
    return { admitted: false, reason: 'first-run-deferred' }
  }
  if (input.now - input.lastRunAt < CURATOR_AGEING.intervalHours * 3_600_000) {
    return { admitted: false, reason: 'too-soon' }
  }
  if (input.now - input.lastActivityAt < CURATOR_AGEING.minIdleHours * 3_600_000) {
    return { admitted: false, reason: 'session-active' }
  }
  return { admitted: true }
}

// ── Consolidation, which does not ───────────────────────────────────────────

export type CuratorPhase =
  /** Ageing and exact-duplicate removal. Deterministic, no model. */
  | 'prune'
  /** Merging overlapping entries, proposing new skills. Model-driven. */
  | 'consolidate'

export interface CuratorConfig {
  enabled: boolean
  /**
   * Off by default. It costs model calls on every pass and makes broad
   * structural changes, so it is a choice rather than a default.
   */
  consolidate: boolean
}

export const CURATOR_DEFAULTS: CuratorConfig = { enabled: true, consolidate: false }

export function phasesFor(config: CuratorConfig): readonly CuratorPhase[] {
  if (!config.enabled) return []
  return config.consolidate ? ['prune', 'consolidate'] : ['prune']
}

/**
 * What the consolidation phase needs from a model.
 *
 * Expressed as a requirement rather than a model name so the router picks the
 * cheapest thing that qualifies. Ageing and dedupe are not reasoning work, and
 * paying premium rates for a background pass is the surest way to have it turned
 * off — at which point the near-duplicates come back.
 */
export const CURATOR_MODEL_REQUIREMENTS = {
  tools: true,
  reasoning: false,
  minContextWindow: 32_000,
} as const

// ── What it produces ────────────────────────────────────────────────────────

export type CuratorOutcome =
  | 'promoted'
  | 'merged'
  | 'archived'
  | 'skill-proposed'
  /** Two entries disagree and neither is clearly right. */
  | 'conflict-recorded'

export interface CuratorLogEntry {
  outcome: CuratorOutcome
  /** Entries this touched. */
  entryIds: readonly string[]
  /** One sentence a human can check without opening anything. */
  reason: string
  /** Where the claim came from. Required for anything promoted. */
  sources: readonly string[]
  at: number
}

/**
 * Whether a log line is honest enough to keep.
 *
 * A consolidation log exists so a person can disagree with a pass they were not
 * present for. A line saying only "merged 3 entries" is a receipt, not an
 * explanation, and it makes the pass unauditable in exactly the case where
 * auditing matters.
 */
export function isAuditableLogEntry(entry: CuratorLogEntry): boolean {
  if (entry.entryIds.length === 0) return false
  if (entry.reason.trim().length === 0) return false
  if (entry.outcome === 'promoted' && entry.sources.length === 0) return false
  return true
}

/**
 * Conflicts stay conflicts.
 *
 * When two entries disagree the pass records both and says so rather than
 * picking. Silently resolving a contradiction in favour of the newer entry is
 * how a correction gets overwritten by the mistake it corrected.
 */
export function shouldRecordConflict(input: {
  claims: readonly { text: string; sources: readonly string[]; at: number }[]
}): boolean {
  return input.claims.length > 1
}

// ── The skills ──────────────────────────────────────────────────────────────

/**
 * Nine skills, routed. Loading all of them would put the curator's whole
 * vocabulary in the window for a request that only ever needs one or two.
 */
export const MEMORY_CURATOR_SKILLS: readonly ExpertSkill[] = [
  {
    id: 'memory.search',
    name: 'Search history',
    body: 'Find prior work across notes and archives. Return citations, never bulk text.',
    triggers: ['我们之前', 'did we ever', 'search history', '以前是怎么', 'prior art'],
    downstream: ['memory.extract'],
  },
  {
    id: 'memory.extract',
    name: 'Extract a durable claim',
    body: 'Turn a passage into one sentence that will still be true next month, with sources.',
    triggers: ['记下来', 'remember this', 'note that', '沉淀'],
    downstream: ['memory.dedupe'],
  },
  {
    id: 'memory.dedupe',
    name: 'Check for duplicates',
    body: 'Find entries already claiming this, and whether they agree.',
    triggers: ['duplicate', '重复', 'already know'],
    downstream: ['memory.conflict', 'memory.promote'],
  },
  {
    id: 'memory.conflict',
    name: 'Record a conflict',
    body: 'Two entries disagree: keep both, mark the disagreement, cite each.',
    triggers: ['conflict', '矛盾', 'contradicts'],
  },
  {
    id: 'memory.promote',
    name: 'Promote to long-term',
    body: 'Move a working note into curated memory with its source pointers intact.',
    triggers: ['promote', '提升', 'make permanent'],
  },
  {
    id: 'memory.pattern',
    name: 'Find a pattern across the archive',
    body: 'State what recurs — a convention, a repeated failure — as a new sourced claim.',
    triggers: ['pattern', '规律', 'what usually happens', '总是'],
    // The archive is searched, never quoted; the output is a claim about it.
    downstream: ['memory.extract'],
  },
  {
    id: 'memory.propose-skill',
    name: 'Propose a skill',
    body: 'A procedure repeated three times is a skill. Draft it with triggers and exclusions.',
    triggers: ['make a skill', '做成技能', 'automate this'],
  },
  {
    id: 'memory.review',
    name: 'Review what accumulated',
    body: 'Show what the last pass moved and why, so it can be disagreed with.',
    triggers: ['what did you remember', '记了什么', 'review memory', 'consolidation log'],
  },
  {
    id: 'memory.forget',
    name: 'Forget an entry',
    body: 'Remove an entry and its index derivatives; the raw timeline is untouched.',
    triggers: ['forget', '忘掉', 'delete that memory'],
  },
]

/**
 * A repeated procedure is worth a skill; a repeated *observation* is worth a
 * memory entry. Three is the threshold because two is a coincidence and waiting
 * for four means the user has already automated it themselves.
 */
export const SKILL_PROPOSAL_MIN_OCCURRENCES = 3

export function shouldProposeSkill(input: {
  occurrences: number
  /** A procedure already covered by an installed skill is not a gap. */
  coveredByExistingSkill: boolean
}): boolean {
  if (input.coveredByExistingSkill) return false
  return input.occurrences >= SKILL_PROPOSAL_MIN_OCCURRENCES
}
