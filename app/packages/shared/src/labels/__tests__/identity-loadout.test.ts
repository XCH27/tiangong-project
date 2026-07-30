import { describe, expect, it } from 'bun:test'
import {
  TOOL_BUDGET,
  assessLoadout,
  describeSpecialist,
  rankSpecialists,
  resolveLoadout,
  toolBudgetVerdict,
  unionLoadouts,
  type IdentityLoadout,
} from '../identity-loadout'

const loadout = (labelId: string, patch: Partial<IdentityLoadout> = {}): IdentityLoadout => ({
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
    expect(assessLoadout(loadout('a', { skills: names('s', 12), tools: names('t', 4) })).toolCount)
      .toBe(16)
  })

  // Trimming loses capability; splitting keeps all of it.
  it('suggests splitting rather than trimming when over budget', () => {
    expect(assessLoadout(loadout('a', { tools: names('t', 21) })).suggestion)
      .toBe('split-into-specialists')
    expect(assessLoadout(loadout('a', { tools: ['t1'] })).suggestion).toBeUndefined()
  })
})

describe('resolution against real registries', () => {
  // A loadout naming a removed skill must not quietly become a weaker role.
  it('reports what no longer resolves instead of degrading silently', () => {
    const resolved = resolveLoadout(
      loadout('a', { skills: ['ok', 'gone'], tools: ['t1'] }),
      { skills: new Set(['ok']), sources: new Set(), tools: new Set(['t1']) },
    )
    expect(resolved.skills).toEqual(['ok'])
    expect(resolved.missing.skills).toEqual(['gone'])
    expect(resolved.tools).toEqual(['t1'])
  })
})

describe('multiple identities on one session', () => {
  it('unions what the agent sees', () => {
    const union = unionLoadouts([
      loadout('a', { skills: ['s1'], tools: ['t1'] }),
      loadout('b', { skills: ['s2'], tools: ['t1', 't2'] }),
    ])
    expect([...union.skills].sort()).toEqual(['s1', 's2'])
    expect([...union.tools].sort()).toEqual(['t1', 't2'])
    expect(union.labelIds).toEqual(['a', 'b'])
  })

  // Combining roles must never accumulate permission neither role was given.
  it('takes the narrowest requested permission, not the widest', () => {
    expect(unionLoadouts([
      loadout('a', { requestedPermissionMode: 'allow-all' }),
      loadout('b', { requestedPermissionMode: 'safe' }),
    ]).requestedPermissionMode).toBe('safe')

    expect(unionLoadouts([
      loadout('a', { requestedPermissionMode: 'ask' }),
      loadout('b'),
    ]).requestedPermissionMode).toBe('ask')
  })

  // This is how a session quietly ends up over budget without anyone choosing it.
  it('is the union that gets assessed, not each label', () => {
    const union = unionLoadouts([
      loadout('a', { tools: names('t', 9) }),
      loadout('b', { tools: names('u', 9) }),
    ])
    expect(assessLoadout({ labelId: 'union', ...union }).verdict).toBe('over-budget')
  })
})

describe('specialist offers', () => {
  it('describes a specialist by what it carries', () => {
    const offer = describeSpecialist(loadout('reviewer', { skills: ['diff'] }), 'Reviewer')
    expect(offer).toMatchObject({ labelId: 'reviewer', name: 'Reviewer', verdict: 'focused' })
    expect(offer.skills).toEqual(['diff'])
  })

  // Otherwise delegation reproduces the overload it exists to avoid.
  it('offers focused specialists before crowded ones', () => {
    expect(rankSpecialists([
      { labelId: 'x', name: 'x', skills: [], sources: [], verdict: 'over-budget' },
      { labelId: 'y', name: 'y', skills: [], sources: [], verdict: 'focused' },
      { labelId: 'z', name: 'z', skills: [], sources: [], verdict: 'crowded' },
    ]).map((offer) => offer.name)).toEqual(['y', 'z', 'x'])
  })
})
