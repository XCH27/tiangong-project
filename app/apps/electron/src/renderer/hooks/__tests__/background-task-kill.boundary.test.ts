import { describe, expect, it, mock } from 'bun:test'
import {
  dismissBackgroundTaskChip,
  killBackgroundTask,
} from '../background-task-kill'
import type { BackgroundTask } from '@/atoms/sessions'

function task(
  partial: Partial<BackgroundTask> & Pick<BackgroundTask, 'id' | 'type'>,
): BackgroundTask {
  return {
    toolUseId: `tool-${partial.id}`,
    startTime: 1,
    elapsedSeconds: 0,
    status: 'running',
    ...partial,
  }
}

describe('killBackgroundTask production boundary', () => {
  it('keeps an agent chip when stop is refused (not implemented)', async () => {
    const tasks = [task({ id: 'a1', type: 'agent' })]
    const killShell = mock(async () => ({ success: true }))
    const { result, nextTasks } = await killBackgroundTask({
      sessionId: 's1',
      taskId: 'a1',
      type: 'agent',
      tasks,
      killShell,
    })
    expect(killShell).not.toHaveBeenCalled()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reasonKey).toBe('chat.taskKillNotImplemented')
    }
    expect(nextTasks).toHaveLength(1)
    expect(nextTasks[0]?.status).toBe('running')
  })

  it('keeps a workflow chip when stop is refused', async () => {
    const tasks = [task({ id: 'w1', type: 'workflow' })]
    const { result, nextTasks } = await killBackgroundTask({
      sessionId: 's1',
      taskId: 'w1',
      type: 'workflow',
      tasks,
      killShell: async () => ({ success: true }),
    })
    expect(result.ok).toBe(false)
    expect(nextTasks[0]?.id).toBe('w1')
    expect(nextTasks[0]?.status).toBe('running')
  })

  it('marks shell stopped only after killShell confirms success', async () => {
    const tasks = [task({ id: 'sh1', type: 'shell' })]
    const { result, nextTasks } = await killBackgroundTask({
      sessionId: 's1',
      taskId: 'sh1',
      type: 'shell',
      tasks,
      killShell: async () => ({ success: true }),
    })
    expect(result).toEqual({ ok: true, removed: false, status: 'stopped' })
    expect(nextTasks[0]?.status).toBe('stopped')
  })

  it('does not remove a shell chip when killShell refuses', async () => {
    const tasks = [task({ id: 'sh1', type: 'shell' })]
    const { result, nextTasks } = await killBackgroundTask({
      sessionId: 's1',
      taskId: 'sh1',
      type: 'shell',
      tasks,
      killShell: async () => ({ success: false, error: 'not found' }),
    })
    expect(result.ok).toBe(false)
    expect(nextTasks).toHaveLength(1)
    expect(nextTasks[0]?.status).toBe('running')
  })

  it('dismiss removes the chip without calling kill', async () => {
    const tasks = [
      task({ id: 'a1', type: 'agent' }),
      task({ id: 'sh1', type: 'shell' }),
    ]
    const next = dismissBackgroundTaskChip(tasks, 'a1')
    expect(next.map((t) => t.id)).toEqual(['sh1'])
  })
})
