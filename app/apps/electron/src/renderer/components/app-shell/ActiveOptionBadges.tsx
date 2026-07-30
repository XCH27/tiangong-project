import { cn } from '@/lib/utils'
import type { PermissionMode } from '@craft-agent/shared/agent/modes'
import type { LabelConfig } from '@craft-agent/shared/labels'
import { ActiveTasksBar, type BackgroundTask } from './ActiveTasksBar'
import type { TerminalOverlayData } from './TaskActionMenu'

export interface ActiveOptionBadgesProps {
  /** @deprecated Work phase and execution approval are not composer badges. */
  permissionMode?: PermissionMode
  tasks?: BackgroundTask[]
  sessionId?: string
  /** @deprecated Session information lives in the session header/menu. */
  sessionFolderPath?: string
  onKillTask?: (taskId: string) => void
  onInsertMessage?: (text: string) => void
  onShowTerminalOverlay?: (data: TerminalOverlayData) => void
  /** @deprecated Labels are assigned by rules/agents and reviewed from session surfaces. */
  sessionLabels?: string[]
  /** @deprecated Labels are assigned by rules/agents and reviewed from session surfaces. */
  labels?: LabelConfig[]
  /** @deprecated Labels are assigned by rules/agents and reviewed from session surfaces. */
  onRemoveLabel?: (labelId: string) => void
  /** @deprecated Labels are assigned by rules/agents and reviewed from session surfaces. */
  onLabelsChange?: (updatedLabels: string[]) => void
  /** @deprecated Composer label badges were removed. */
  autoOpenLabelId?: string | null
  /** @deprecated Composer label badges were removed. */
  onAutoOpenConsumed?: () => void
  sessionStatuses?: unknown
  currentSessionStatus?: string
  onSessionStatusChange?: (stateId: string) => void
  className?: string
}

/**
 * The band above the composer is reserved for live execution state only.
 * Work modes, labels and session information already have canonical homes
 * (Add/commands, Agent tools/rules, and the session menu respectively), so
 * rendering them here created a second set of controls and persistent clutter.
 */
export function ActiveOptionBadges({
  tasks = [],
  sessionId,
  onKillTask,
  onInsertMessage,
  onShowTerminalOverlay,
  className,
}: ActiveOptionBadgesProps) {
  if (!sessionId || tasks.length === 0) return null

  return (
    <div className={cn('flex items-center flex-wrap gap-2 mb-2 px-px', className)}>
      <ActiveTasksBar
        tasks={tasks}
        sessionId={sessionId}
        onKillTask={onKillTask}
        onInsertMessage={onInsertMessage}
        onShowTerminalOverlay={onShowTerminalOverlay}
      />
    </div>
  )
}
