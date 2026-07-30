import { describe, expect, it } from 'bun:test'
import {
  activityHasIndicator,
  activityIsAnimated,
  activityRank,
  activityTone,
  deriveSessionActivity,
  needsAttention,
  summarizeFleet,
  type SessionActivity,
} from '../session-activity'

describe('derivation', () => {
  it('is idle when nothing is outstanding', () => {
    expect(deriveSessionActivity({})).toBe('idle')
  })

  it('reads running from either processing flag', () => {
    expect(deriveSessionActivity({ isProcessing: true })).toBe('running')
    expect(deriveSessionActivity({ isAsyncOperationOngoing: true })).toBe('running')
  })

  it('reports completion only until the human looks', () => {
    expect(deriveSessionActivity({ hasUnread: true })).toBe('completed')
    expect(deriveSessionActivity({ hasUnread: false })).toBe('idle')
  })

  it('reads failure from the last message role', () => {
    expect(deriveSessionActivity({ lastMessageRole: 'error' })).toBe('failed')
    expect(deriveSessionActivity({ lastMessageRole: 'assistant' })).toBe('idle')
  })

  // Urgency, not likelihood: a blocked session needs a human and a running one
  // does not, so it must not be hidden behind the busier state.
  it('ranks a pending approval above running', () => {
    expect(deriveSessionActivity({ isProcessing: true, hasPendingApproval: true }))
      .toBe('awaiting-input')
  })

  it('ranks failure above running and completion', () => {
    expect(deriveSessionActivity({
      isProcessing: true,
      hasUnread: true,
      lastMessageRole: 'error',
    })).toBe('failed')
  })
})

describe('delegated work', () => {
  // A collapsed parent must not read as calm while something underneath it is
  // stuck — the failure mode that matters once several agents are in flight.
  it('surfaces a blocked child through an idle parent', () => {
    expect(deriveSessionActivity({ children: ['awaiting-input', 'idle'] }))
      .toBe('awaiting-input')
  })

  it('surfaces a failed child', () => {
    expect(deriveSessionActivity({ children: ['running', 'failed'] })).toBe('failed')
  })

  it('reports a parent with working children as running', () => {
    expect(deriveSessionActivity({ children: ['running', 'idle'] })).toBe('running')
  })

  it('stays idle when every child is idle', () => {
    expect(deriveSessionActivity({ children: ['idle', 'idle'] })).toBe('idle')
  })

  it('lets the parent’s own block outrank a merely running child', () => {
    expect(deriveSessionActivity({ hasPendingApproval: true, children: ['running'] }))
      .toBe('awaiting-input')
  })
})

describe('attention', () => {
  // With several agents working, marking every busy row as attention-worthy
  // means none of them are.
  it('covers only states a human can act on', () => {
    expect(needsAttention('awaiting-input')).toBe(true)
    expect(needsAttention('failed')).toBe(true)
    expect(needsAttention('running')).toBe(false)
    expect(needsAttention('completed')).toBe(false)
    expect(needsAttention('idle')).toBe(false)
  })

  it('orders a list by urgency', () => {
    const activities: SessionActivity[] = ['idle', 'running', 'awaiting-input', 'completed', 'failed']
    expect([...activities].sort((a, b) => activityRank(a) - activityRank(b)))
      .toEqual(['awaiting-input', 'failed', 'running', 'completed', 'idle'])
  })
})

describe('presentation', () => {
  // Only idle is muted. Rendering a working session in dim grey makes it
  // indistinguishable from an empty one at a glance.
  it('mutes idle and nothing else', () => {
    expect(activityTone('idle')).toBe('neutral')
    expect(activityTone('running')).toBe('active')
    expect(activityTone('awaiting-input')).toBe('attention')
    expect(activityTone('failed')).toBe('danger')
    expect(activityTone('completed')).toBe('success')
  })

  it('animates only what is still going', () => {
    expect(activityIsAnimated('running')).toBe(true)
    for (const activity of ['idle', 'completed', 'failed', 'awaiting-input'] as const) {
      expect(activityIsAnimated(activity)).toBe(false)
    }
  })

  // A row of identical grey dots is noise that hides the two rows that matter.
  it('draws no indicator for an idle session', () => {
    expect(activityHasIndicator('idle')).toBe(false)
    expect(activityHasIndicator('running')).toBe(true)
  })
})

describe('fleet summary', () => {
  it('counts what a header needs and nothing else', () => {
    expect(summarizeFleet(['running', 'running', 'awaiting-input', 'idle', 'failed']))
      .toEqual({ total: 5, running: 2, awaitingInput: 1, failed: 1, blocked: true })
  })

  it('is unblocked when nothing needs a human', () => {
    expect(summarizeFleet(['running', 'completed', 'idle']))
      .toMatchObject({ blocked: false, running: 1 })
  })

  it('handles an empty fleet', () => {
    expect(summarizeFleet([]))
      .toEqual({ total: 0, running: 0, awaitingInput: 0, failed: 0, blocked: false })
  })
})
