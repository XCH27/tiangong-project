import { describe, expect, it } from 'bun:test'
import {
  TOOL_BUDGET,
  assessExpertKit,
  describeExpertKit,
  rankExpertKits,
  resolveExpertKit,
  toolBudgetVerdict,
  unionExpertKits,
  type ExpertKit,
} from '../expert-kit'

const kit = (labelId: string, patch: Partial<ExpertKit> = {}): ExpertKit => ({
  labelId, skills: [], sources: [], tools: [], ...patch,
})

const names = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, index) => `${prefix}${index}`)

describe('tool budget', () => {
  // Measured accuracy degrades past ~10–15; published guidance caps around 20.
  it('uses the measured thresholds', () => {
    expect(toolBudgetVerdict(TOOL_BUDGET.focused)).toBe('focused')
    expect(toolBudgetVerdict(TOOL_BUDGET.warn)).toBe('crowded')
    expect(toolBudgetVerdict(TOOL_BUDGET.warn + 1)).toBe('over-budget')
  })

  // Skills and sources arrive in the same window and compete for the same
  // attention; counting only tool schemas under-reports the real load.
  it('counts skills and sources against the same budget', () => {
    expect(assessExpertKit(kit('a', { skills: names('s', 12), tools: names('t', 4) })).activeCount)
      .toBe(16)
  })

  // A large catalog is not the problem; loading all of it is. Splitting a long
  // workflow into three kits makes the user choose a kit before they know which
  // step they are on.
  it('tells an unrouted kit to route rather than to split', () => {
    expect(assessExpertKit(kit('a', { skills: names('s', 18) })).suggestion)
      .toBe('add-skill-routing')
  })

  it('measures a routing kit on what routing selected', () => {
    const assessment = assessExpertKit(kit('a', { skills: names('s', 18) }), { activeSkillCount: 3 })
    expect(assessment).toMatchObject({ verdict: 'focused', activeCount: 3, catalogCount: 18 })
  })

  // Offered as information, never as an instruction to cut capability: the
  // alternative to splitting is trimming, and trimming is the only option that
  // actually loses something.
  it('mentions splitting only once routing is already in place', () => {
    expect(assessExpertKit(kit('a', { skills: names('s', 30) }), { activeSkillCount: 16 }).suggestion)
      .toBe('consider-splitting')
    expect(assessExpertKit(kit('a', { tools: ['t1'] })).suggestion).toBeUndefined()
  })
})

describe('resolution against real registries', () => {
  // A kit naming a removed skill must not quietly become a weaker role.
  it('reports what no longer resolves instead of degrading silently', () => {
    const resolved = resolveExpertKit(
      kit('a', { skills: ['ok', 'gone'], tools: ['t1'] }),
      { skills: new Set(['ok']), sources: new Set(), tools: new Set(['t1']) },
    )
    expect(resolved.skills).toEqual(['ok'])
    expect(resolved.missing.skills).toEqual(['gone'])
    expect(resolved.tools).toEqual(['t1'])
  })
})

describe('multiple identities on one session', () => {
  it('unions what the agent sees', () => {
    const union = unionExpertKits([
      kit('a', { skills: ['s1'], tools: ['t1'] }),
      kit('b', { skills: ['s2'], tools: ['t1', 't2'] }),
    ])
    expect([...union.skills].sort()).toEqual(['s1', 's2'])
    expect([...union.tools].sort()).toEqual(['t1', 't2'])
    expect(union.labelIds).toEqual(['a', 'b'])
  })

  // Combining roles must never accumulate permission neither role was given.
  it('takes the narrowest requested permission, not the widest', () => {
    expect(unionExpertKits([
      kit('a', { requestedPermissionMode: 'allow-all' }),
      kit('b', { requestedPermissionMode: 'safe' }),
    ]).requestedPermissionMode).toBe('safe')

    expect(unionExpertKits([
      kit('a', { requestedPermissionMode: 'ask' }),
      kit('b'),
    ]).requestedPermissionMode).toBe('ask')
  })

  // This is how a session quietly ends up over budget without anyone choosing it.
  it('is the union that gets assessed, not each label', () => {
    const union = unionExpertKits([
      kit('a', { tools: names('t', 9) }),
      kit('b', { tools: names('u', 9) }),
    ])
    expect(assessExpertKit({ labelId: 'union', ...union }).verdict).toBe('over-budget')
  })
})

describe('specialist offers', () => {
  it('describes a specialist by what it carries', () => {
    const offer = describeExpertKit(kit('reviewer', { skills: ['diff'] }), 'Reviewer')
    expect(offer).toMatchObject({ labelId: 'reviewer', name: 'Reviewer', verdict: 'focused' })
    expect(offer.skills).toEqual(['diff'])
  })

  // Otherwise delegation reproduces the overload it exists to avoid.
  it('offers focused specialists before crowded ones', () => {
    expect(rankExpertKits([
      { labelId: 'x', name: 'x', skills: [], sources: [], verdict: 'over-budget' },
      { labelId: 'y', name: 'y', skills: [], sources: [], verdict: 'focused' },
      { labelId: 'z', name: 'z', skills: [], sources: [], verdict: 'crowded' },
    ]).map((offer) => offer.name)).toEqual(['y', 'z', 'x'])
  })
})
