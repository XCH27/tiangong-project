/**
 * Production boundary for background-task stop/dismiss.
 * The hook delegates here so tests can exercise the same path without mounting React.
 */

import {
  applyKillBackgroundTaskResult,
  dismissBackgroundTask,
  type BackgroundTask,
  type KillBackgroundTaskResult,
} from '@/atoms/sessions'

export type KillShellFn = (
  sessionId: string,
  shellId: string,
) => Promise<{ success: boolean; error?: string } | void>

export async function killBackgroundTask(args: {
  sessionId: string
  taskId: string
  type: 'agent' | 'shell' | 'workflow'
  tasks: BackgroundTask[]
  killShell: KillShellFn
}): Promise<{ result: KillBackgroundTaskResult; nextTasks: BackgroundTask[] }> {
  const task = args.tasks.find((t) => t.id === args.taskId)
  if (!task) {
    return {
      result: { ok: false, reason: 'Task not found', reasonKey: 'chat.taskNotFound' },
      nextTasks: args.tasks,
    }
  }

  if (task.status !== 'running' && task.status !== 'stale') {
    const result: KillBackgroundTaskResult = { ok: true, removed: true }
    return {
      result,
      nextTasks: applyKillBackgroundTaskResult(args.tasks, args.taskId, result),
    }
  }

  if (args.type === 'shell') {
    try {
      const response = await args.killShell(args.sessionId, args.taskId)
      if (response && response.success === false) {
        const result: KillBackgroundTaskResult = {
          ok: false,
          reason: response.error || 'Kill shell refused',
          reasonKey: 'chat.taskKillFailed',
        }
        return { result, nextTasks: args.tasks }
      }
      const result: KillBackgroundTaskResult = {
        ok: true,
        removed: false,
        status: 'stopped',
      }
      return {
        result,
        nextTasks: applyKillBackgroundTaskResult(args.tasks, args.taskId, result),
      }
    } catch (error) {
      const result: KillBackgroundTaskResult = {
        ok: false,
        reason: error instanceof Error ? error.message : String(error),
        reasonKey: 'chat.taskKillFailed',
      }
      return { result, nextTasks: args.tasks }
    }
  }

  // Agent / workflow: no authoritative cancel path.
  const result: KillBackgroundTaskResult = {
    ok: false,
    reason: 'Stopping agent background tasks is not implemented',
    reasonKey: 'chat.taskKillNotImplemented',
  }
  return { result, nextTasks: args.tasks }
}

export function dismissBackgroundTaskChip(
  tasks: BackgroundTask[],
  taskId: string,
): BackgroundTask[] {
  return dismissBackgroundTask(tasks, taskId)
}
