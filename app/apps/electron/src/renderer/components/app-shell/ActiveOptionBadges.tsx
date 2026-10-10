import * as React from 'react'
import { useTranslation } from "react-i18next"
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SlashCommandMenu, DEFAULT_SLASH_COMMAND_GROUPS, type SlashCommandId } from '@/components/ui/slash-command-menu'
import { ChevronDown } from 'lucide-react'
import { PERMISSION_MODE_CONFIG, type PermissionMode } from '@craft-agent/shared/agent/modes'
import { ActiveTasksBar, type BackgroundTask } from './ActiveTasksBar'
import type { TerminalOverlayData } from './TaskActionMenu'
import { LabelBadgeRow } from '@/components/ui/label-badge-row'
import type { LabelConfig } from '@craft-agent/shared/labels'
import type { SessionStatus } from '@/config/session-status-config'

// ============================================================================
// Permission Mode Icon Component
// ============================================================================

function PermissionModeIcon({ mode, className }: { mode: PermissionMode; className?: string }) {
  const config = PERMISSION_MODE_CONFIG[mode]
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={config.svgPath} />
    </svg>
  )
}

export interface ActiveOptionBadgesProps {
  showPermissionMode?: boolean
  /** Current permission mode */
  permissionMode?: PermissionMode
  /** Callback when permission mode changes */
  onPermissionModeChange?: (mode: PermissionMode) => void
  /** Background tasks to display */
  tasks?: BackgroundTask[]
  /** Session ID for opening preview windows */
  sessionId?: string
  /** Absolute path to the session folder (for Files header actions) */
  sessionFolderPath?: string
  /** Callback when kill button is clicked on a task */
  onKillTask?: (taskId: string) => void
  /** Callback to insert message into input field */
  onInsertMessage?: (text: string) => void
  /** Callback to show a task's output in a terminal overlay (optional) */
  onShowTerminalOverlay?: (data: TerminalOverlayData) => void
  /** Label entries applied to this session (e.g., ["bug", "priority::3"]) */
  sessionLabels?: string[]
  /** Available label configs (tree structure) for resolving label display */
  labels?: LabelConfig[]
  /** Callback when a label is removed (legacy — prefer onLabelsChange) */
  onRemoveLabel?: (labelId: string) => void
  /** Callback when session labels array changes (value edits or removals) */
  onLabelsChange?: (updatedLabels: string[]) => void
  /** Label ID whose value popover should auto-open (set when a valued label is added via # menu) */
  autoOpenLabelId?: string | null
  /** Called after the auto-open has been consumed, so the parent can clear the signal */
  onAutoOpenConsumed?: () => void
  // ── State/status badge (in dynamic stack) ──
  /** Available workflow states */
  sessionStatuses?: SessionStatus[]
  /** Current session state ID */
  currentSessionStatus?: string
  /** Callback when state changes */
  onSessionStatusChange?: (stateId: string) => void
  /** Additional CSS classes */
  className?: string
}

/** Compatibility preview composition; production keeps tasks above the input and labels inside it. */
export function ActiveOptionBadges(props: ActiveOptionBadgesProps) {
  return <div className={cn('space-y-2', props.className)}>
    {!!props.tasks?.length && props.sessionId && <ActiveTasksBar
      tasks={props.tasks} sessionId={props.sessionId} onKillTask={props.onKillTask}
      onInsertMessage={props.onInsertMessage} onShowTerminalOverlay={props.onShowTerminalOverlay} />}
    {props.showPermissionMode !== false && <PermissionModeDropdown
      permissionMode={props.permissionMode ?? 'ask'} onPermissionModeChange={props.onPermissionModeChange}
      sessionId={props.sessionId} toolbar />}
    <LabelBadgeRow sessionLabels={props.sessionLabels ?? []} labels={props.labels ?? []}
      onLabelsChange={props.onLabelsChange} autoOpenLabelId={props.autoOpenLabelId}
      onAutoOpenConsumed={props.onAutoOpenConsumed} />
  </div>
}

interface PermissionModeDropdownProps {
  toolbar?: boolean
  permissionMode: PermissionMode
  onPermissionModeChange?: (mode: PermissionMode) => void
  sessionId?: string
}

export function PermissionModeDropdown({ permissionMode, onPermissionModeChange, sessionId, toolbar = false }: PermissionModeDropdownProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  // Optimistic local state - updates immediately, syncs with prop
  const [optimisticMode, setOptimisticMode] = React.useState(permissionMode)

  // Sync optimistic state when prop changes (confirmation from backend)
  React.useEffect(() => {
    setOptimisticMode(permissionMode)
  }, [permissionMode])

  const activeCommands = React.useMemo((): SlashCommandId[] => {
    return [optimisticMode as SlashCommandId]
  }, [optimisticMode])

  // Handle command selection from dropdown
  const handleSelect = React.useCallback((commandId: SlashCommandId) => {
    if (commandId === 'safe' || commandId === 'ask' || commandId === 'allow-all') {
      setOptimisticMode(commandId)
      onPermissionModeChange?.(commandId)
    }
    setOpen(false)
  }, [onPermissionModeChange])

  // Get config for current mode (use optimistic state for instant UI update)
  const config = PERMISSION_MODE_CONFIG[optimisticMode]

  // Mode-specific styling using CSS variables (theme-aware)
  // - safe (Explore): foreground at 60% opacity - subtle, read-only feel
  // - ask (Ask to Edit): info color - amber, prompts for edits
  // - allow-all (Auto): accent color - purple, full autonomy
  const modeStyles: Record<PermissionMode, { className: string; shadowVar: string }> = {
    'safe': {
      className: 'bg-foreground/5 text-foreground/60',
      shadowVar: 'var(--foreground-rgb)',
    },
    'ask': {
      className: 'bg-info/10 text-info',
      shadowVar: 'var(--info-rgb)',
    },
    'allow-all': {
      className: 'bg-accent/5 text-accent',
      shadowVar: 'var(--accent-rgb)',
    },
  }
  const currentStyle = modeStyles[optimisticMode]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-tutorial="permission-mode-dropdown"
          className={cn(
            toolbar
              ? "input-toolbar-btn inline-flex h-7 min-w-0 items-center gap-1.5 rounded-[6px] px-1.5 text-[13px] outline-none select-none"
              : "h-[30px] pl-2.5 pr-2 text-xs font-medium rounded-[8px] flex items-center gap-1.5 shadow-tinted outline-none select-none",
            currentStyle.className
          )}
          style={{ '--shadow-color': currentStyle.shadowVar } as React.CSSProperties}
        >
          <PermissionModeIcon mode={optimisticMode} className="h-3.5 w-3.5" />
          <span>{t(`mode.${optimisticMode}`)}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-[8px] bg-background text-foreground shadow-modal-small"
        side="top"
        align="start"
        sideOffset={4}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          // Don't auto-focus the text input on touch devices — it pulls up the virtual keyboard
          const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
          if (!isTouchDevice) {
            window.dispatchEvent(new CustomEvent('craft:focus-input', {
              detail: { sessionId }
            }))
          }
        }}
      >
        <SlashCommandMenu
          commandGroups={DEFAULT_SLASH_COMMAND_GROUPS}
          activeCommands={activeCommands}
          onSelect={handleSelect}
          showFilter
        />
      </PopoverContent>
    </Popover>
  )
}

