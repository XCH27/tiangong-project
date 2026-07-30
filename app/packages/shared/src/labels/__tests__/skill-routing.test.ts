import { describe, expect, it } from 'bun:test'
import {
  auditCatalog,
  isBlockingProblem,
  resolveChain,
  routeSkills,
  skillApplies,
  type ExpertSkill,
} from '../skill-routing'
import { EXAMPLE_PRODUCT_DESIGN_KIT, EXAMPLE_CODE_REVIEW_KIT } from '../example-kits'

const skill = (patch: Partial<ExpertSkill> & { id: string }): ExpertSkill => ({
  name: patch.id, body: '', triggers: [], ...patch,
})

const catalog: ExpertSkill[] = [
  skill({ id: 'a', name: 'A', triggers: ['review', 'diff'], downstream: ['b'] }),
  skill({ id: 'b', name: 'B', triggers: ['risk'] }),
  skill({ id: 'c', name: 'C', triggers: ['write prd'], excludes: ['design'] }),
  skill({ id: 'wide', name: 'Wide', triggers: ['review', 'x', 'y', 'z', 'w'] }),
]

describe('matching', () => {
  it('selects on a declared trigger', () => {
    expect(skillApplies(catalog[0]!, 'please review this')).toBe(true)
  })

  // An exclusion is a boundary, not a preference: a skill that knows it is the
  // wrong tool must be able to say so decisively.
  it('lets an exclusion override a matching trigger', () => {
    expect(skillApplies(catalog[2]!, 'write prd for the design')).toBe(false)
  })
})

describe('routing', () => {
  // A catch-all beating a precise match is how the wrong step gets loaded.
  it('prefers the more specific skill over the broad one', () => {
    expect(routeSkills({ catalog, request: 'review' }).active[0]?.id).toBe('a')
  })

  it('honours the active limit', () => {
    expect(routeSkills({ catalog, request: 'review', limit: 1 }).active).toHaveLength(1)
  })

  // Auto-loading successors turns a long workflow into a long prompt one step at
  // a time; the kit says where it leads, the caller advances it.
  it('offers successors without loading them', () => {
    const routed = routeSkills({ catalog, request: 'diff' })
    expect(routed.offeredNext).toContain('b')
    expect(routed.active.some((entry) => entry.id === 'b')).toBe(false)
  })

  it('does not offer something already active', () => {
    expect(routeSkills({ catalog, request: 'review risk' }).offeredNext).not.toContain('b')
  })

  // The two numbers are the whole point: a catalog is not a loadout.
  it('reports catalog size separately from the active set', () => {
    const routed = routeSkills({ catalog, request: 'review', limit: 1 })
    expect(routed.catalogSize).toBe(4)
    expect(routed.active).toHaveLength(1)
  })

  it('returns nothing when no trigger matches', () => {
    expect(routeSkills({ catalog, request: 'entirely unrelated' }).active).toEqual([])
  })
})

describe('chains', () => {
  it('resolves one step ahead by default', () => {
    expect(resolveChain({ catalog, fromId: 'a' }).map((entry) => entry.id)).toEqual(['b'])
  })

  // A workflow that loops back to review is legitimate; the visited set keeps it
  // finite rather than rejecting it.
  it('tolerates a cycle instead of looping forever', () => {
    const cyclic = [
      skill({ id: 'p', downstream: ['q'] }),
      skill({ id: 'q', downstream: ['p'] }),
    ]
    expect(resolveChain({ catalog: cyclic, fromId: 'p', depth: 9 })).toHaveLength(1)
  })
})

describe('catalog audit', () => {
  it('reports a successor that does not exist', () => {
    expect(auditCatalog([skill({ id: 'a', triggers: ['t'], downstream: ['nope'] })]))
      .toContainEqual({ problem: 'dangling-downstream', skillId: 'a', detail: 'nope' })
  })

  // A step that only ever follows another step is a legitimate design.
  it('separates chain-only from unreachable', () => {
    const chainOnly = auditCatalog([
      skill({ id: 'a', triggers: ['t'], downstream: ['b'] }),
      skill({ id: 'b' }),
    ])
    expect(chainOnly.some((finding) => finding.problem === 'chain-only')).toBe(true)
    expect(chainOnly.filter((finding) => isBlockingProblem(finding.problem))).toEqual([])

    expect(auditCatalog([skill({ id: 'lonely' })]))
      .toContainEqual({ problem: 'unreachable', skillId: 'lonely' })
  })

  // Two skills sharing a broad word is common, and the specificity ranking
  // already resolves it — worth reporting, not worth blocking.
  it('reports ambiguity without blocking on it', () => {
    const findings = auditCatalog([
      skill({ id: 'a', triggers: ['same'] }),
      skill({ id: 'b', triggers: ['same'] }),
    ])
    expect(findings.some((finding) => finding.problem === 'ambiguous-trigger')).toBe(true)
    expect(isBlockingProblem('ambiguous-trigger')).toBe(false)
  })
})

describe('the shipped examples', () => {
  it('have no blocking problems', () => {
    for (const kit of [EXAMPLE_CODE_REVIEW_KIT, EXAMPLE_PRODUCT_DESIGN_KIT]) {
      expect(auditCatalog(kit).filter((finding) => isBlockingProblem(finding.problem))).toEqual([])
    }
  })

  // The large kit is the case routing exists for: eighteen steps, of which a
  // request touches a couple.
  it('routes the large kit down to a handful', () => {
    const routed = routeSkills({
      catalog: EXAMPLE_PRODUCT_DESIGN_KIT,
      request: '帮我做无障碍审计',
    })
    expect(routed.catalogSize).toBe(18)
    expect(routed.active.length).toBeLessThanOrEqual(3)
    expect(routed.active.some((entry) => entry.id === 'design.a11y')).toBe(true)
  })

  // Without the exclusion this lands in the design kit, which mentions
  // requirements more often than the product-management kit does.
  it('keeps PRD authoring out of the design kit', () => {
    const routed = routeSkills({ catalog: EXAMPLE_PRODUCT_DESIGN_KIT, request: '帮我写 PRD' })
    expect(routed.active.some((entry) => entry.id === 'design.frame')).toBe(false)
  })
})
