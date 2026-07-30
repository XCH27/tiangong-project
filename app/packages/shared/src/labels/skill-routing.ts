/**
 * Skill routing inside an expert kit.
 *
 * `expert-kit.ts` treats a kit's declared skills as its loadout and reports
 * anything past fifteen as over-budget, to be split. Real kits break that rule
 * immediately and are right to: a design workflow covering problem framing,
 * research, IA, flows, visual specs, motion, accessibility audit and engineering
 * handoff is twenty-eight steps, and splitting it into three kits makes the user
 * pick a kit before they know which step they are on.
 *
 * The mistake was conflating two different counts:
 *
 *     catalog  — everything the kit can do.        Large is fine.
 *     active   — what is in the window this turn.  This is what costs attention.
 *
 * A kit is a catalog you route *within*, not a bundle you carry. Only the
 * matched skill and its declared successors enter the window, so twenty-eight
 * skills can cost less attention than a loadout of twelve.
 *
 * This is the retrieval-based tool selection the measurements favour: selecting
 * a subset before the model sees anything roughly tripled tool-selection
 * accuracy while halving prompt tokens. The budget in `expert-kit.ts` still
 * applies — to the active set.
 *
 * Two refinements over the reference designs this borrows from:
 *
 *   - **Route before the model reads, not after.** Kits that rely on the model
 *     picking from twenty-eight descriptions reintroduce the problem they were
 *     meant to solve: the descriptions themselves are long, and reading all of
 *     them to choose one is exactly the attention cost being avoided. Matching
 *     happens on declared triggers, and only the winner's full text is loaded.
 *
 *   - **Exclusions are first-class.** A skill saying what it is *not* for is
 *     what stops a designer's "write the PRD" landing in the design kit when the
 *     product-management kit owns it. Without them the largest kit wins every
 *     ambiguous request simply by having more surface to match against.
 */

export interface ExpertSkill {
  id: string
  name: string
  /** Full instruction text. Loaded only when the skill is active. */
  body: string
  /**
   * Phrases that select this skill. Matched case-insensitively as substrings,
   * because users type fragments rather than exact commands.
   */
  triggers: readonly string[]
  /**
   * Phrases that disqualify it even when a trigger matched.
   *
   * Checked first and unconditionally: a skill that knows it is the wrong tool
   * must be able to say so, or the kit with the most triggers absorbs every
   * ambiguous request.
   */
  excludes?: readonly string[]
  /**
   * Skills that normally run after this one.
   *
   * Declared so a workflow can chain without the user restating context at every
   * step. Successors are *offered*, not auto-loaded — see `resolveChain`.
   */
  downstream?: readonly string[]
  /** Roughly what this skill costs to load, for budgeting. Defaults to 1. */
  weight?: number
}

export interface RoutedSkills {
  /** Skills whose text enters the window this turn. */
  active: readonly ExpertSkill[]
  /** Successors the active skills declare, as names only. */
  offeredNext: readonly string[]
  /** Weighted size of the active set, for the attention budget. */
  activeWeight: number
  /** Catalog size, which is deliberately not the same number. */
  catalogSize: number
}

const MATCH_LIMIT_DEFAULT = 3

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function matchesAny(request: string, phrases: readonly string[]): boolean {
  const haystack = normalize(request)
  return phrases.some((phrase) => {
    const needle = normalize(phrase)
    return needle.length > 0 && haystack.includes(needle)
  })
}

/**
 * Whether a skill applies to this request.
 *
 * Exclusions are evaluated before triggers rather than as a tie-breaker: the
 * point of an exclusion is to be decisive. A skill that both triggers and
 * excludes on the same request is declaring a boundary, not a preference.
 */
export function skillApplies(skill: ExpertSkill, request: string): boolean {
  if (skill.excludes && matchesAny(request, skill.excludes)) return false
  return matchesAny(request, skill.triggers)
}

export function routeSkills(input: {
  catalog: readonly ExpertSkill[]
  request: string
  /** How many skills may be active at once. */
  limit?: number
}): RoutedSkills {
  const limit = input.limit ?? MATCH_LIMIT_DEFAULT
  const matched = input.catalog.filter((skill) => skillApplies(skill, input.request))

  // More specific skills win. A skill with many triggers is a catch-all, and a
  // catch-all beating a precise match is how the wrong step gets loaded.
  const ranked = [...matched].sort((a, b) =>
    a.triggers.length - b.triggers.length || a.name.localeCompare(b.name))

  const active = ranked.slice(0, limit)
  const activeIds = new Set(active.map((skill) => skill.id))

  const offeredNext = [...new Set(
    active.flatMap((skill) => skill.downstream ?? []).filter((id) => !activeIds.has(id)),
  )]

  return {
    active,
    offeredNext,
    activeWeight: active.reduce((total, skill) => total + (skill.weight ?? 1), 0),
    catalogSize: input.catalog.length,
  }
}

/**
 * Resolve a chain the user asked to follow.
 *
 * Successors are offered rather than loaded because a chain is a *suggestion
 * about what usually comes next*, and auto-loading it turns a twenty-eight-step
 * workflow into a twenty-eight-skill prompt one step at a time. The user or the
 * captain advances the chain; the kit only says where it leads.
 *
 * Cycles are tolerated rather than rejected: a workflow that loops back to
 * review is legitimate, and the visited set is what keeps it finite.
 */
export function resolveChain(input: {
  catalog: readonly ExpertSkill[]
  fromId: string
  /** How far ahead to look. Beyond a couple of steps this is speculation. */
  depth?: number
}): readonly ExpertSkill[] {
  const byId = new Map(input.catalog.map((skill) => [skill.id, skill]))
  const visited = new Set<string>([input.fromId])
  const chain: ExpertSkill[] = []

  let frontier = byId.get(input.fromId)?.downstream ?? []
  for (let step = 0; step < (input.depth ?? 1); step += 1) {
    const next: string[] = []
    for (const id of frontier) {
      if (visited.has(id)) continue
      visited.add(id)
      const skill = byId.get(id)
      if (!skill) continue
      chain.push(skill)
      next.push(...(skill.downstream ?? []))
    }
    if (next.length === 0) break
    frontier = next
  }
  return chain
}

// ── Catalog health ──────────────────────────────────────────────────────────

export type CatalogProblem =
  /** Two skills claim the same trigger, so which one loads is arbitrary. */
  | 'ambiguous-trigger'
  /** A skill nothing can reach, because it has no triggers and no predecessor. */
  | 'unreachable'
  /** A declared successor that is not in the catalog. */
  | 'dangling-downstream'
  /** A skill with no triggers, reachable only through a chain. */
  | 'chain-only'

export interface CatalogFinding {
  problem: CatalogProblem
  skillId: string
  detail?: string
}

/**
 * Check a catalog for the failures that make routing feel broken.
 *
 * A large catalog is fine; an *ambiguous* one is not, and the symptom is
 * indistinguishable from the model choosing badly — which is why it has to be
 * caught here rather than diagnosed from a bad answer later.
 */
export function auditCatalog(catalog: readonly ExpertSkill[]): readonly CatalogFinding[] {
  const findings: CatalogFinding[] = []
  const ids = new Set(catalog.map((skill) => skill.id))
  const reachableByChain = new Set(catalog.flatMap((skill) => skill.downstream ?? []))
  const triggerOwners = new Map<string, string[]>()

  for (const skill of catalog) {
    for (const trigger of skill.triggers) {
      const key = normalize(trigger)
      const owners = triggerOwners.get(key)
      if (owners) owners.push(skill.id)
      else triggerOwners.set(key, [skill.id])
    }

    for (const successor of skill.downstream ?? []) {
      if (!ids.has(successor)) {
        findings.push({ problem: 'dangling-downstream', skillId: skill.id, detail: successor })
      }
    }

    if (skill.triggers.length === 0) {
      // Not automatically wrong: a step that only ever follows another step is a
      // legitimate design, and saying so is different from being unreachable.
      findings.push({
        problem: reachableByChain.has(skill.id) ? 'chain-only' : 'unreachable',
        skillId: skill.id,
      })
    }
  }

  for (const [trigger, owners] of triggerOwners) {
    if (owners.length > 1) {
      for (const owner of owners) {
        findings.push({ problem: 'ambiguous-trigger', skillId: owner, detail: trigger })
      }
    }
  }

  return findings
}

/**
 * Problems worth blocking a kit on.
 *
 * `chain-only` is a design choice and never blocks. `unreachable` and
 * `dangling-downstream` are dead references the author can fix; ambiguity is
 * reported but not blocking, because two skills sharing a broad word like
 * "design" is common and the specificity ranking already resolves it.
 */
export function isBlockingProblem(problem: CatalogProblem): boolean {
  return problem === 'unreachable' || problem === 'dangling-downstream'
}
