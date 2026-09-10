/**
 * useBackgroundTasks - Hook for managing active background tasks
 *
 * Tracks background agents and shells per session.
 * Updated via event handlers for task_backgrounded, shell_backgrounded, task_progress.
 *
 * Cancellation honesty: never remove a task from the UI unless cancellation is
 * confirmed or the task is independently known finished. Agent kill is not
 * implemented on the backend — keep the chip and surface a localized reason.
 * Dismiss is a separate renderer-only action.
 */

import { useAtom } from 'jotai'
import { useCallback } from 'react'
import {
  backgroundTasksAtomFamily,
  type BackgroundTask,
  type KillBackgroundTaskResult,
} from '@/atoms/sessions'
import {
  dismissBackgroundTaskChip,
  killBackgroundTask,
} from './background-task-kill'

export interface UseBackgroundTasksOptions {
  /** Session ID to track tasks for */
  sessionId: string
}

export interface UseBackgroundTasksResult {
  /** Active background tasks for this session */
  tasks: BackgroundTask[]
  /** Add a new background task */
  addTask: (task: Omit<BackgroundTask, 'elapsedSeconds'>) => void
  /** Update elapsed time for a task */
  updateTaskProgress: (toolUseId: string, elapsedSeconds: number) => void
  /** Remove a task (when completed or killed) */
  removeTask: (toolUseId: string) => void
  /** Kill a task (sends kill request via IPC). Returns the outcome for toasting. */
  killTask: (taskId: string, type: 'agent' | 'shell' | 'workflow') => Promise<KillBackgroundTaskResult>
  /** Dismiss the chip only — does not kill the underlying task. */
  dismissTask: (taskId: string) => void
}

/**
 * Hook for managing background tasks in a session
 */
export function useBackgroundTasks({ sessionId }: UseBackgroundTasksOptions): UseBackgroundTasksResult {
  const [tasks, setTasks] = useAtom(backgroundTasksAtomFamily(sessionId))

  const addTask = useCallback((task: Omit<BackgroundTask, 'elapsedSeconds'>) => {
    setTasks(prev => {
      // Check if task already exists (prevent duplicates)
      if (prev.some(t => t.toolUseId === task.toolUseId)) {
        return prev
      }
      // Add new task with 0 elapsed seconds
      return [...prev, { ...task, elapsedSeconds: 0, lastSignalAt: Date.now() }]
    })
  }, [setTasks])

  const updateTaskProgress = useCallback((toolUseId: string, elapsedSeconds: number) => {
    setTasks(prev => prev.map(t =>
      t.toolUseId === toolUseId
        ? { ...t, elapsedSeconds, lastSignalAt: Date.now() }
        : t,
    ))
  }, [setTasks])

  const removeTask = useCallback((toolUseId: string) => {
    setTasks(prev => prev.filter(t => t.toolUseId !== toolUseId))
  }, [setTasks])

  const killTask = useCallback(async (
    taskId: string,
    type: 'agent' | 'shell' | 'workflow',
  ): Promise<KillBackgroundTaskResult> => {
    const { result, nextTasks } = await killBackgroundTask({
      sessionId,
      taskId,
      type,
      tasks,
      killShell: (sid, shellId) => window.electronAPI.killShell(sid, shellId),
    })
    setTasks(nextTasks)
    return result
  }, [sessionId, tasks, setTasks])

  const dismissTask = useCallback((taskId: string) => {
    setTasks(prev => dismissBackgroundTaskChip(prev, taskId))
  }, [setTasks])

  return {
    tasks,
    addTask,
    updateTaskProgress,
    removeTask,
    killTask,
    dismissTask,
  }
}
