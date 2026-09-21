import { describe, expect, it } from 'bun:test'
import { confirmSessionSwitch, proposeWear } from '../wear.ts'

describe('who wears an assistant', () => {
  it('puts the first identity on this conversation', () => {
    const d = proposeWear({
      currentAssistantId: null,
      requestedAssistantId: 'implementer',
      asked: 'apply',
    })
    expect(d).toMatchObject({ wearer: 'session', applied: true, needsConfirmation: false })
  })

  it('does not re-apply the identity already worn', () => {
    const d = proposeWear({
      currentAssistantId: 'implementer',
      requestedAssistantId: 'implementer',
      asked: 'apply',
    })
    expect(d.applied).toBe(false)
  })

  it('turns a mid-task specialty into a delegate, even if the ask was apply', () => {
    const d = proposeWear({
      currentAssistantId: 'implementer',
      requestedAssistantId: 'researcher',
      asked: 'apply',
    })
    expect(d).toMatchObject({ wearer: 'delegate', applied: true, needsConfirmation: false })
    expect(d.reason).toMatch(/delegat/i)
  })

  it('honours an explicit specialist ask as a delegate', () => {
    const d = proposeWear({
      currentAssistantId: 'implementer',
      requestedAssistantId: 'researcher',
      asked: 'specialist',
    })
    expect(d.wearer).toBe('delegate')
  })

  it('never infers a CLI wrap', () => {
    const inferred = proposeWear({
      currentAssistantId: null,
      requestedAssistantId: 'coder',
      asked: 'apply',
    })
    expect(inferred.wearer).not.toBe('cli')
    const explicit = proposeWear({
      currentAssistantId: null,
      requestedAssistantId: 'coder',
      asked: 'cli',
    })
    expect(explicit.wearer).toBe('cli')
  })

  it('switches this conversation only after confirmSessionSwitch', () => {
    const blocked = proposeWear({
      currentAssistantId: 'implementer',
      requestedAssistantId: 'researcher',
      asked: 'apply',
    })
    expect(blocked.wearer).toBe('delegate')
    const confirmed = confirmSessionSwitch({
      currentAssistantId: 'implementer',
      requestedAssistantId: 'researcher',
    })
    expect(confirmed).toMatchObject({ wearer: 'session', applied: true })
  })
})
