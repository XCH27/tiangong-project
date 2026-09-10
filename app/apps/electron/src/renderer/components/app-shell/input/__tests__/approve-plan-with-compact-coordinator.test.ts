import { describe, expect, mock, test } from 'bun:test'
import { createApprovePlanWithCompactCoordinator } from '../approve-plan-with-compact-coordinator'

type Listener = (event: { detail?: Record<string, unknown> }) => void

class FakeEventPort {
  private listeners = new Map<string, Set<Listener>>()

  addEventListener(type: string, listener: Listener) {
    const listeners = this.listeners.get(type) ?? new Set<Listener>()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener)
  }

  dispatch(type: string, detail: Record<string, unknown>) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener({ detail })
    }
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function createHarness(overrides?: {
  setPending?: () => Promise<void>
}) {
  const events = new FakeEventPort()
  const calls: string[] = []
  const coordinator = createApprovePlanWithCompactCoordinator({
    events,
    getSessionId: () => 'session-1',
    consumeDraftInput: () => 'current draft',
    setPending: async () => {
      calls.push('set-pending')
      await overrides?.setPending?.()
    },
    markDispatched: async () => {
      calls.push('mark-dispatched')
    },
    clearPending: async () => {
      calls.push('clear-pending')
    },
    submit: (message) => {
      calls.push(`submit:${message}`)
    },
    buildExecutionMessage: ({ planPath, draftInput }) =>
      `execute:${planPath}:${draftInput}`,
    scheduleTimeout: () => 1,
    cancelTimeout: () => {},
    timeoutMs: 300_000,
  })
  coordinator.start()
  return { calls, coordinator, events }
}

describe('Accept & Compact coordinator', () => {
  test('treats approvals as single-flight before persistence resolves', async () => {
    let resolvePersist!: () => void
    const persist = new Promise<void>((resolve) => {
      resolvePersist = resolve
    })
    const { calls, events } = createHarness({ setPending: () => persist })

    events.dispatch('craft:approve-plan-with-compact', {
      sessionId: 'session-1',
      planPath: '/first.md',
    })
    events.dispatch('craft:approve-plan-with-compact', {
      sessionId: 'session-1',
      planPath: '/second.md',
    })
    resolvePersist()
    await flush()

    expect(calls).toEqual(['set-pending', 'submit:/compact'])
  })

  test('attaches completion listener before submitting compact', async () => {
    const { calls, events, coordinator } = createHarness()
    coordinator.dispose()
    const immediate = createApprovePlanWithCompactCoordinator({
      events,
      getSessionId: () => 'session-1',
      consumeDraftInput: () => 'draft',
      setPending: async () => {
        calls.push('set-pending')
      },
      markDispatched: async () => {
        calls.push('mark-dispatched')
      },
      clearPending: async () => {
        calls.push('clear-pending')
      },
      submit: (message) => {
        calls.push(`submit:${message}`)
        if (message === '/compact') {
          events.dispatch('craft:compaction-complete', { sessionId: 'session-1' })
        }
      },
      buildExecutionMessage: () => 'execute-plan',
      scheduleTimeout: () => 1,
      cancelTimeout: () => {},
      timeoutMs: 300_000,
    })
    immediate.start()

    events.dispatch('craft:approve-plan-with-compact', {
      sessionId: 'session-1',
      planPath: '/plan.md',
    })
    await flush()
    await flush()

    expect(calls).toEqual([
      'set-pending',
      'submit:/compact',
      'mark-dispatched',
      'submit:execute-plan',
      'clear-pending',
    ])
  })

  test('marks execution dispatched before sending and ignores duplicate completion', async () => {
    const { calls, events } = createHarness()

    events.dispatch('craft:approve-plan-with-compact', {
      sessionId: 'session-1',
      planPath: '/plan.md',
    })
    await flush()
    events.dispatch('craft:compaction-complete', { sessionId: 'session-1' })
    events.dispatch('craft:compaction-complete', { sessionId: 'session-1' })
    await flush()

    expect(calls).toEqual([
      'set-pending',
      'submit:/compact',
      'mark-dispatched',
      'submit:execute:/plan.md:current draft',
      'clear-pending',
    ])
  })
})
