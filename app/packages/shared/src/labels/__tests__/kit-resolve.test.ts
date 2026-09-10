import { describe, expect, it } from 'bun:test'
import { resolveKitCatalog, skillToExpertSkill } from '../kit-resolve.ts'
import { routeSkills } from '../skill-routing.ts'
import type { LoadedSkill, SkillMetadata } from '../../skills/types.ts'

function skill(slug: string, metadata: Partial<SkillMetadata> = {}, content = `body of ${slug}`): LoadedSkill {
  return {
    slug,
    metadata: { name: metadata.name ?? slug, description: metadata.description ?? `does ${slug}`, ...metadata },
    content,
    path: `/skills/${slug}`,
    source: 'workspace',
  }
}

describe('skillToExpertSkill', () => {
  it('carries the SKILL.md body as the text routing will load', () => {
    const projected = skillToExpertSkill(skill('compliance-review', {}, '# Compliance\nsteps…'))
    expect(projected.id).toBe('compliance-review')
    expect(projected.body).toBe('# Compliance\nsteps…')
  })

  it('uses declared triggers when the skill declares them', () => {
    const projected = skillToExpertSkill(
      skill('compliance-review', { triggers: ['合规审查', 'GDPR', 'privacy review'] }),
    )
    expect(projected.triggers).toEqual(['合规审查', 'GDPR', 'privacy review'])
  })

  it('falls back to the slug and display name, never the description', () => {
    const projected = skillToExpertSkill(
      skill('draft-contract', { name: 'Draft contract', description: 'write review analyse anything at all' }),
    )
    // The description would match almost every request; a catch-all is exactly
    // what routeSkills ranks last, so it must not become a trigger.
    expect(projected.triggers).toEqual(['draft-contract', 'Draft contract'])
    expect(projected.triggers).not.toContain('write review analyse anything at all')
  })

  it('deduplicates and drops blanks in the fallback', () => {
    const projected = skillToExpertSkill(skill('pdf', { name: 'pdf' }))
    expect(projected.triggers).toEqual(['pdf'])
  })

  it('falls back when the declared trigger list is empty after trimming', () => {
    const projected = skillToExpertSkill(skill('pptx', { name: 'Slides', triggers: ['  ', ''] }))
    expect(projected.triggers).toEqual(['pptx', 'Slides'])
  })

  it('names the skill by its slug when the display name is blank', () => {
    const projected = skillToExpertSkill(skill('xlsx', { name: '' }))
    expect(projected.name).toBe('xlsx')
  })
})

describe('resolveKitCatalog', () => {
  const installed = [skill('draft-contract'), skill('compliance-review'), skill('case-search')]

  it('resolves declared slugs against the installed skills', () => {
    const { catalog, unresolved } = resolveKitCatalog(['compliance-review', 'draft-contract'], installed)
    expect(catalog.map((s) => s.id)).toEqual(['compliance-review', 'draft-contract'])
    expect(unresolved).toEqual([])
  })

  it('reports a slug that names nothing instead of dropping it', () => {
    // Silent dropping reads to the user as "this specialist just cannot do that",
    // which looks like a bad model rather than a missing file.
    const { catalog, unresolved } = resolveKitCatalog(['compliance-review', 'e-signature'], installed)
    expect(catalog.map((s) => s.id)).toEqual(['compliance-review'])
    expect(unresolved).toEqual(['e-signature'])
  })

  it('preserves declaration order so the kit author controls routing tie-breaks', () => {
    const { catalog } = resolveKitCatalog(['case-search', 'compliance-review', 'draft-contract'], installed)
    expect(catalog.map((s) => s.id)).toEqual(['case-search', 'compliance-review', 'draft-contract'])
  })

  it('treats an absent or empty declaration as an empty catalog, not an error', () => {
    expect(resolveKitCatalog(undefined, installed)).toEqual({ catalog: [], unresolved: [] })
    expect(resolveKitCatalog([], installed)).toEqual({ catalog: [], unresolved: [] })
  })

  it('ignores blank and duplicate slugs', () => {
    const { catalog, unresolved } = resolveKitCatalog(
      ['  ', 'draft-contract', 'draft-contract', '  compliance-review  '],
      installed,
    )
    expect(catalog.map((s) => s.id)).toEqual(['draft-contract', 'compliance-review'])
    expect(unresolved).toEqual([])
  })

  it('keeps the first tier that provides a slug, matching loadAllSkills precedence', () => {
    const shadowed: LoadedSkill[] = [
      { ...skill('pdf', { name: 'Project pdf' }), source: 'project' },
      { ...skill('pdf', { name: 'Global pdf' }), source: 'global' },
    ]
    const { catalog } = resolveKitCatalog(['pdf'], shadowed)
    expect(catalog).toHaveLength(1)
    expect(catalog[0]!.name).toBe('Project pdf')
  })

  it('produces a catalog routeSkills can actually route over', () => {
    const kit = [
      skill('compliance-review', { name: '合规审查', triggers: ['合规审查', 'GDPR'] }),
      skill('draft-contract', { name: '合同起草', triggers: ['合同起草', '起草合同'] }),
    ]
    const { catalog } = resolveKitCatalog(['compliance-review', 'draft-contract'], kit)
    const routed = routeSkills({ catalog, request: '帮我做一次 GDPR 合规审查' })
    expect(routed.active.map((s) => s.id)).toEqual(['compliance-review'])
    expect(routed.catalogSize).toBe(2)
  })

  it('routes nothing when no trigger matches, rather than falling back to everything', () => {
    const kit = [skill('compliance-review', { triggers: ['合规审查'] })]
    const { catalog } = resolveKitCatalog(['compliance-review'], kit)
    expect(routeSkills({ catalog, request: 'what is the weather' }).active).toEqual([])
  })
})
