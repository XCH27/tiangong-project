/**
 * Session Progress（任务进度，docs/35）
 *
 * 每个 craft session 内一条有序、有状态的步骤清单（像 Claude Cowork 的当前工作清单）。
 * 会话级元数据，和 labels/status 同层，复用 SessionEvent + session 持久化，不建第二套 store。
 *
 * 与已有概念互补、不重叠：
 * - session status：会话整体泳道（单选）；
 * - SubmitPlan：一次性计划提案（需审批）；
 * - 后台任务/ActiveTasksBar：正在跑的子进程；
 * - 团队任务 assignTeamTask：跨会话工作项（团队模式）。
 */

import type { ActorRef } from './design'

export const PROGRESS_TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const
export type ProgressTaskStatus = typeof PROGRESS_TASK_STATUSES[number]

export interface ProgressTask {
  id: string
  title: string
  status: ProgressTaskStatus
  /** 谁建/改的（人或 Agent），用于团队归因与回放。 */
  actor?: ActorRef
  /** 可选一句话备注 / 活动态文案（如“正在跑测试”）。仅显示投影。 */
  note?: string
}

/** 会话级进度：整条清单 = 会话当前真相（replace-all 语义，和 labels 一致）。 */
export interface SessionProgress {
  tasks: ProgressTask[]
  updatedAt: number
}

export function isProgressTaskStatus(value: unknown): value is ProgressTaskStatus {
  return typeof value === 'string' && (PROGRESS_TASK_STATUSES as readonly string[]).includes(value)
}

/** 进度汇总（派生）：done = completed 数，total = 非 cancelled 数。 */
export function summarizeProgress(tasks: readonly ProgressTask[]): { done: number; total: number; activeTitle?: string } {
  let done = 0
  let total = 0
  let activeTitle: string | undefined
  for (const task of tasks) {
    if (task.status === 'cancelled') continue
    total += 1
    if (task.status === 'completed') done += 1
    if (task.status === 'in_progress' && activeTitle === undefined) activeTitle = task.title
  }
  return { done, total, activeTitle }
}

/** 校验并规范化一条进度清单（用于工具/命令入口，挡住脏数据）。 */
export function normalizeProgressTasks(value: unknown): ProgressTask[] {
  if (!Array.isArray(value)) return []
  const out: ProgressTask[] = []
  for (const raw of value) {
    if (typeof raw !== 'object' || raw === null) continue
    const candidate = raw as Record<string, unknown>
    const id = typeof candidate.id === 'string' && candidate.id.trim().length > 0 ? candidate.id : undefined
    const title = typeof candidate.title === 'string' ? candidate.title : undefined
    if (!id || title === undefined) continue
    const status = isProgressTaskStatus(candidate.status) ? candidate.status : 'pending'
    const task: ProgressTask = { id, title, status }
    if (typeof candidate.note === 'string') task.note = candidate.note
    out.push(task)
  }
  return out
}
