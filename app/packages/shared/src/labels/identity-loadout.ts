/**
 * Identity labels as loadouts.
 *
 * `LabelConfig.kind === 'identity'` exists today and carries exactly one thing:
 * a `systemPromptPreset`. Its own comment records the gap —
 * *"Skill/Source/permission bindings are not implemented"* and *"Does not grant
 * tools or bypass the permission path"* — so an identity is a paragraph of text,
 * and every session sees the same tools regardless of the role it is playing.
 *
 * That is the wrong shape for two reasons that turn out to be the same reason.
 *
 * **Attention is the binding constraint, not context length.** Measured agent
 * accuracy degrades once tool counts pass roughly 10–15; tool-selection accuracy
 * collapses toward 13% on large tool sets. The mechanism is not "the prompt got
 * long" — functions blur together in attention, and irrelevant parameter
 * descriptions occupy working memory that should be spent understanding the
 * request. OpenAI's guidance is under 20 tools per turn; Anthropic documents
 * degradation past 30–50. Giving every session every tool is therefore not
 * generous, it is a measurable accuracy tax paid on every turn.
 *
 * **The published fix is specialisation, which is exactly what an identity is.**
 * The 2026 HTAA framing is an orchestrator plus specialists carrying 5–10
 * tightly-focused tools each, rather than one agent holding fifty. An identity
 * label that binds a loadout *is* that specialist definition, and delegation is
 * how the orchestrator reaches it. So the label system, the delegation router,
 * and the permission path are one mechanism seen from three places:
 *
 *     identity label  →  which skills/sources/tools this role carries
 *     tool budget     →  when a role is overloaded and should be split
 *     delegation      →  how the captain reaches a specialist instead of growing
 *     permission      →  what that role may do, enforced on the existing path
 *
 * The last line is the one that must not drift. A loadout narrows what an agent
 * *sees*; it never widens what it may *do*. Grants stay on the permission path,
 * and a loadout that could grant would be a second authority
 * (`03-NON-NEGOTIABLES.md` §1).
 */

/** Evidence-based thresholds, kept together so the reason survives a refactor. */
export const TOOL_BUDGET = {
  /** Accuracy is measurably intact at or below this. */
  focused: 10,
  /** Degradation becomes measurable past here. */
  warn: 15,
  /** Published upper guidance; beyond this, selection accuracy falls sharply. */
  limit: 20,
} as const

export type ToolBudgetVerdict = 'focused' | 'crowded' | 'over-budget'

export function toolBudgetVerdict(toolCount: number): ToolBudgetVerdict {
  if (toolCount <= TOOL_BUDGET.focused) return 'focused'
  if (toolCount <= TOOL_BUDGET.warn) return 'crowded'
  return 'over-budget'
}

// ── The loadout ─────────────────────────────────────────────────────────────

export interface IdentityLoadout {
  /** Label id this loadout belongs to. */
  labelId: string
  /** Skill slugs this role carries. */
  skills: readonly string[]
  /** Source slugs this role may read. */
  sources: readonly string[]
  /**
   * Session tool ids this role is offered.
   *
   * A projection over the existing registry, never an addition to it: a name
   * that is not already registered is dropped rather than conjured.
   */
  tools: readonly string[]
  /**
   * Permission mode this role *requests*.
   *
   * A request, not a grant. The permission path decides, and it may return
   * something narrower. A loadout that could widen permissions would be a
   * second authority over the same decision.
   */
  requestedPermissionMode?: 'safe' | 'ask' | 'allow-all'
}

export interface LoadoutAssessment {
  verdict: ToolBudgetVerdict
  toolCount: number
  /** Present when the role should be split rather than trimmed. */
  suggestion?: 'split-into-specialists'
}

/**
 * Judge a loadout by what actually costs attention.
 *
 * Skills and sources are counted with tools because they arrive in the same
 * window and compete for the same attention. Counting only tool schemas
 * under-reports a role carrying twelve skills and four tools, which behaves like
 * sixteen.
 */
export function assessLoadout(loadout: IdentityLoadout): LoadoutAssessment {
  const toolCount = loadout.tools.length + loadout.skills.length + loadout.sources.length
  const verdict = toolBudgetVerdict(toolCount)
  return {
    verdict,
    toolCount,
    // Trimming an over-budget role loses capability; splitting keeps all of it
    // and hands the parts to agents that can each hold their share.
    ...(verdict === 'over-budget' ? { suggestion: 'split-into-specialists' as const } : {}),
  }
}

// ── Projection over the real registries ─────────────────────────────────────

/**
 * Resolve a loadout against what actually exists.
 *
 * A loadout naming a removed skill must not silently become a role with a
 * missing capability: it resolves to the intersection, and what fell out is
 * reported so the identity can be repaired rather than quietly degraded.
 */
export interface ResolvedLoadout {
  skills: readonly string[]
  sources: readonly string[]
  tools: readonly string[]
  /** Names that no longer resolve, for the settings surface to show. */
  missing: {
    skills: readonly string[]
    sources: readonly string[]
    tools: readonly string[]
  }
}

export function resolveLoadout(
  loadout: IdentityLoadout,
  available: {
    skills: ReadonlySet<string>
    sources: ReadonlySet<string>
    tools: ReadonlySet<string>
  },
): ResolvedLoadout {
  const partition = (names: readonly string[], pool: ReadonlySet<string>) => ({
    present: names.filter((name) => pool.has(name)),
    missing: names.filter((name) => !pool.has(name)),
  })

  const skills = partition(loadout.skills, available.skills)
  const sources = partition(loadout.sources, available.sources)
  const tools = partition(loadout.tools, available.tools)

  return {
    skills: skills.present,
    sources: sources.present,
    tools: tools.present,
    missing: {
      skills: skills.missing,
      sources: sources.missing,
      tools: tools.missing,
    },
  }
}

/**
 * Combine the loadouts of every identity a session carries.
 *
 * Sessions can hold several identity labels, and the union is what the agent
 * sees — which is exactly how a session quietly ends up over budget without
 * anyone choosing that. The assessment is therefore taken on the union, not on
 * each label, and it is the union that a captain is told to split.
 */
export function unionLoadouts(
  loadouts: readonly IdentityLoadout[],
): Omit<IdentityLoadout, 'labelId'> & { labelIds: readonly string[] } {
  const skills = new Set<string>()
  const sources = new Set<string>()
  const tools = new Set<string>()
  let requested: IdentityLoadout['requestedPermissionMode']

  for (const loadout of loadouts) {
    for (const skill of loadout.skills) skills.add(skill)
    for (const source of loadout.sources) sources.add(source)
    for (const tool of loadout.tools) tools.add(tool)
    // The union takes the *narrowest* request, not the widest. Combining roles
    // must never be a way to accumulate permission that neither role was given.
    requested = narrowerMode(requested, loadout.requestedPermissionMode)
  }

  return {
    labelIds: loadouts.map((loadout) => loadout.labelId),
    skills: [...skills],
    sources: [...sources],
    tools: [...tools],
    ...(requested === undefined ? {} : { requestedPermissionMode: requested }),
  }
}

const MODE_WIDTH: Record<NonNullable<IdentityLoadout['requestedPermissionMode']>, number> = {
  safe: 0,
  ask: 1,
  'allow-all': 2,
}

function narrowerMode(
  a: IdentityLoadout['requestedPermissionMode'],
  b: IdentityLoadout['requestedPermissionMode'],
): IdentityLoadout['requestedPermissionMode'] {
  if (a === undefined) return b
  if (b === undefined) return a
  return MODE_WIDTH[a] <= MODE_WIDTH[b] ? a : b
}

// ── The link to delegation ──────────────────────────────────────────────────

/**
 * What a captain needs to know about a specialist it might call.
 *
 * Deliberately the loadout rather than the prompt: a captain choosing a
 * specialist is asking "who can do this", and the answer is what that role
 * carries. The prompt preset is how the specialist behaves once chosen, which is
 * not the captain's decision to reason about.
 */
export interface SpecialistOffer {
  labelId: string
  name: string
  skills: readonly string[]
  sources: readonly string[]
  verdict: ToolBudgetVerdict
}

export function describeSpecialist(
  loadout: IdentityLoadout,
  name: string,
): SpecialistOffer {
  return {
    labelId: loadout.labelId,
    name,
    skills: loadout.skills,
    sources: loadout.sources,
    verdict: assessLoadout(loadout).verdict,
  }
}

/**
 * Offer focused specialists first.
 *
 * A crowded specialist is still worth offering — it may be the only one that can
 * do the work — but it should not be the first thing a captain reaches for, or
 * delegation reproduces the overload it exists to avoid.
 */
export function rankSpecialists(
  offers: readonly SpecialistOffer[],
): readonly SpecialistOffer[] {
  const rank: Record<ToolBudgetVerdict, number> = {
    focused: 0,
    crowded: 1,
    'over-budget': 2,
  }
  return [...offers].sort((a, b) => rank[a.verdict] - rank[b.verdict] || a.name.localeCompare(b.name))
}
