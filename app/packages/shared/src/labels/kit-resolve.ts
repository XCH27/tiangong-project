/**
 * Kit skill resolution — the binding a kit's declaration was missing.
 *
 * `LabelConfig.expertKit.skills` is a list of slugs. Until now nothing turned
 * one into anything, so the field had no reader and the budget assessment on
 * the settings page measured a value that was structurally always empty (H36).
 *
 * The fix is not a new store. Fleet already loads skills from disk across three
 * tiers — `{workspace}/skills/`, `{project}/.agents/skills/`, `~/.agents/skills/`
 * — and `routeSkills` already selects among `ExpertSkill`s. What was absent is
 * the one function between them. A kit therefore *selects over the skills that
 * exist* rather than declaring a parallel set, which is why this file is a
 * mapping and not a subsystem.
 *
 * Two rules it exists to enforce:
 *
 * 1. **A slug that names no installed skill is reported, never dropped.** A kit
 *    that quietly loses half its catalog is worse than one that says so — the
 *    symptom of silent dropping is a specialist that "just doesn't know how to
 *    do that", which reads as a bad model rather than a missing file.
 * 2. **Triggers are declared or they are the skill's own names.** Deriving them
 *    from `description` would make almost everything match almost everything,
 *    and `routeSkills` ranks a skill with many triggers last precisely because a
 *    catch-all beating a precise match is how the wrong step loads. A skill with
 *    no declared triggers stays reachable by its name and by @mention — exactly
 *    as reachable as it was before a kit referenced it, and no more.
 */

import type { LoadedSkill } from '../skills/types.ts'
import type { ExpertSkill } from './skill-routing.ts'

/** What a kit's declared slugs resolved to against the installed skills. */
export interface ResolvedKitCatalog {
  /** Declaration order preserved, so a kit author controls routing tie-breaks. */
  catalog: readonly ExpertSkill[]
  /** Declared slugs that match no installed skill, in declaration order. */
  unresolved: readonly string[]
}

/**
 * Project one loaded skill into the shape routing consumes.
 *
 * `body` is the SKILL.md content without frontmatter — the text that enters the
 * window when routing selects this skill, and only then.
 */
export function skillToExpertSkill(skill: LoadedSkill): ExpertSkill {
  const clean = (values: readonly (string | undefined)[]): string[] =>
    [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))]

  // Trim before deciding whether a declaration exists. Choosing the declared
  // branch on raw length and *then* trimming turns `triggers: ['  ']` into a
  // skill with no triggers at all — `auditCatalog`'s `unreachable`, reached
  // silently, which is the one outcome this projection must never produce.
  const declared = clean(skill.metadata.triggers ?? [])
  const triggers = declared.length > 0 ? declared : clean([skill.slug, skill.metadata.name])

  return {
    id: skill.slug,
    name: skill.metadata.name || skill.slug,
    body: skill.content,
    triggers,
  }
}

/**
 * Resolve a kit's declared skill slugs against the skills actually installed.
 *
 * `installed` is what `loadAllSkills(workspaceRoot, projectRoot)` returns. When
 * two tiers provide the same slug the first occurrence wins, matching the
 * precedence `loadAllSkills` already applies — this function does not re-decide
 * tier precedence, it only reads the order it was given.
 */
export function resolveKitCatalog(
  declaredSlugs: readonly string[] | undefined,
  installed: readonly LoadedSkill[],
): ResolvedKitCatalog {
  if (!declaredSlugs || declaredSlugs.length === 0) {
    return { catalog: [], unresolved: [] }
  }

  const bySlug = new Map<string, LoadedSkill>()
  for (const skill of installed) {
    if (!bySlug.has(skill.slug)) bySlug.set(skill.slug, skill)
  }

  const catalog: ExpertSkill[] = []
  const unresolved: string[] = []
  const seen = new Set<string>()

  for (const raw of declaredSlugs) {
    const slug = raw.trim()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)

    const skill = bySlug.get(slug)
    if (skill) catalog.push(skillToExpertSkill(skill))
    else unresolved.push(slug)
  }

  return { catalog, unresolved }
}
