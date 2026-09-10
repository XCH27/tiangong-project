import { describe, expect, it } from 'bun:test'
import {
  applyKillBackgroundTaskResult,
  dismissBackgroundTask,
  type BackgroundTask,
} from '../sessions'

function task(partial: Partial<BackgroundTask> & Pick<BackgroundTask, 'id'>): BackgroundTask {
  return {
    type: 'shell',
    toolUseId: `tool-${partial.id}`,
    startTime: 1,
    elapsedSeconds: 0,
    status: 'running',
    ...partial,
  }
}

describe('background task cancellation honesty', () => {
  it('marks a confirmed shell kill as stopped without removing it immediately', () => {
    const tasks = [task({ id: 's1' }), task({ id: 's2' })]
    const next = applyKillBackgroundTaskResult(tasks, 's1', {
      ok: true,
      removed: false,
      status: 'stopped',
    })
    expect(next).toHaveLength(2)
    expect(next.find((t) => t.id === 's1')?.status).toBe('stopped')
    expect(next.find((t) => t.id === 's1')?.completedAt).toBeDefined()
    expect(next.find((t) => t.id === 's2')?.status).toBe('running')
  })

  it('does not remove a task when kill fails', () => {
    const tasks = [task({ id: 's1' })]
    const next = applyKillBackgroundTaskResult(tasks, 's1', {
      ok: false,
      reason: 'Session not found',
    })
    expect(next).toEqual(tasks)
  })

  it('removes only when the kill result explicitly confirms removal', () => {
    const tasks = [task({ id: 's1', status: 'completed', completedAt: 10 })]
    const next = applyKillBackgroundTaskResult(tasks, 's1', { ok: true, removed: true })
    expect(next).toEqual([])
  })

  it('dismiss is distinct from stop — removes the chip without a kill result', () => {
    const tasks = [task({ id: 'a1', type: 'agent' }), task({ id: 's1' })]
    expect(dismissBackgroundTask(tasks, 'a1').map((t) => t.id)).toEqual(['s1'])
  })

  it('keeps an agent task visible when kill is not implemented (caller surfaces reason)', () => {
    const tasks = [task({ id: 'a1', type: 'agent' })]
    // The hook returns ok:false for agent kill and does not call apply with removed.
    // Simulating that path: failed result leaves the list unchanged.
    const next = applyKillBackgroundTaskResult(tasks, 'a1', {
      ok: false,
      reason: 'Stopping agent background tasks is not implemented',
      reasonKey: 'chat.taskKillNotImplemented',
    })
    expect(next[0]?.status).toBe('running')
    expect(next).toHaveLength(1)
  })
})
