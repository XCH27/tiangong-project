/**
 * SessionProgressCard（任务进度卡 · docs/35 / docs/00A §4）
 *
 * 展示某会话当前的有序任务清单（像 Claude Cowork 的当前工作清单）。
 * 纯展示组件——数据来自 craft 原 SessionEvent `progress_updated` → session.progress，
 * 不建第二套 store。状态严格按后端给的来：completed=✓、in_progress=spinner、
 * pending=○、cancelled=删除线，绝不把未驱动的步骤画成完成/进行中（docs/00A §3.3 诚实）。
 *
 * 挂点：默认工作台右侧上下文栏顶部；会话行仍只显示 N/M 小药丸。
 */

import { Check, Circle, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { summarizeProgress, type ProgressTask } from '@craft-agent/shared/protocol'
import { cn } from '@/lib/utils'

export function SessionProgressCard({ tasks, variant = 'card', compact = false }: { tasks: ProgressTask[]; variant?: 'card' | 'plain'; compact?: boolean }) {
  const { t } = useTranslation()
  if (!tasks || tasks.length === 0) return null

  const { done, total, activeTitle } = summarizeProgress(tasks)
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div
      className={cn(
        variant === 'card'
          ? 'rounded-[8px] border border-border/50 bg-foreground/[0.02] px-3 py-2.5'
          : 'px-0 py-0',
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-foreground/70">{t('session.taskProgress')}</span>
        <span className="text-[11px] tabular-nums text-foreground/45">{done}/{total}</span>
      </div>

      <div className="mb-2.5 h-1 w-full overflow-hidden rounded-full bg-foreground/[0.08]">
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>

      <ul className="space-y-1">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-start gap-2 text-[12px] leading-snug">
            <span className="mt-[3px] flex-shrink-0">
              {task.status === 'completed' ? (
                <Check className="h-3 w-3 text-accent" />
              ) : task.status === 'in_progress' ? (
                <Loader2 className="h-3 w-3 animate-spin text-accent" />
              ) : task.status === 'cancelled' ? (
                <X className="h-3 w-3 text-foreground/30" />
              ) : (
                <Circle className="h-3 w-3 text-foreground/25" />
              )}
            </span>
            <span
              className={cn(
                'min-w-0',
                task.status === 'completed' && 'text-foreground/45 line-through',
                task.status === 'cancelled' && 'text-foreground/30 line-through',
                task.status === 'in_progress' && 'font-medium text-foreground/85',
                task.status === 'pending' && 'text-foreground/55',
              )}
            >
              {task.title}
              {!compact && task.note && <span className="text-foreground/40"> · {task.note}</span>}
            </span>
          </li>
        ))}
      </ul>

      {!compact && activeTitle && (
        <p className="mt-2 truncate text-[11px] text-foreground/40" title={activeTitle}>
          {activeTitle}
        </p>
      )}
    </div>
  )
}
