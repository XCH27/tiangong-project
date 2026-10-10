import * as React from 'react'
import { cn } from '@/lib/utils'
import { CHAT_LAYOUT } from '@/config/layout'
import { flattenLabels, parseLabelEntry, type LabelConfig } from '@craft-agent/shared/labels'
import type { PermissionMode } from '@craft-agent/shared/agent/modes'
import type { SessionStatus } from '@/config/session-status-config'
import type { BackgroundTask } from '../ActiveTasksBar'
import { PermissionModeDropdown } from '../ActiveOptionBadges'
import { ActiveTasksBar } from '../ActiveTasksBar'
import { InputContainer } from './InputContainer'
import { InputErrorBoundary } from './InputErrorBoundary'
import { NewConversationGreeting } from './NewConversationGreeting'

interface ChatInputZoneProps {
  newConversation?: boolean
  compactMode?: boolean
  showOptionBadges?: boolean
  permissionMode?: PermissionMode
  onPermissionModeChange?: (mode: PermissionMode) => void
  tasks?: BackgroundTask[]
  sessionId: string
  sessionFolderPath?: string
  onKillTask?: (taskId: string) => void
  onInsertMessage?: (text: string) => void
  sessionLabels?: string[]
  labels?: LabelConfig[]
  onLabelsChange?: (labels: string[]) => void
  sessionStatuses?: SessionStatus[]
  currentSessionStatus?: string
  onSessionStatusChange?: (stateId: string) => void
  className?: string
  inputProps: React.ComponentProps<typeof InputContainer>
}

export function ChatInputZone({
  newConversation = false,
  compactMode = false,
  showOptionBadges,
  permissionMode = 'ask',
  onPermissionModeChange,
  tasks = [],
  sessionId,
  sessionFolderPath,
  onKillTask,
  onInsertMessage,
  sessionLabels = [],
  labels = [],
  onLabelsChange,
  sessionStatuses = [],
  currentSessionStatus = 'todo',
  onSessionStatusChange,
  className,
  inputProps,
}: ChatInputZoneProps) {
  const [autoOpenLabelId, setAutoOpenLabelId] = React.useState<string | null>(null)
  const inputResetKey = `${sessionId}::${inputProps.structuredInput?.type ?? 'freeform'}`

  const handleClearDraft = React.useCallback(() => {
    inputProps.onInputChange?.('')
    inputProps.onAttachmentsChange?.([])
  }, [inputProps])

  const handleLabelAdd = React.useCallback((labelId: string) => {
    const current = sessionLabels || []
    if (current.some(entry => parseLabelEntry(entry).id === labelId)) return

    onLabelsChange?.([...current, labelId])

    const config = flattenLabels(labels || []).find(label => label.id === labelId)
    if (config?.valueType) {
      setAutoOpenLabelId(labelId)
    }
  }, [labels, onLabelsChange, sessionLabels])

  return (
    <div className={cn(
      CHAT_LAYOUT.maxWidth,
      'mx-auto w-full',
      newConversation ? 'py-8' : 'mt-1',
      compactMode ? 'px-2 pb-3' : 'px-3 @xs/panel:px-4 pb-4',
      className,
    )}>
      {newConversation && <NewConversationGreeting />}
      {tasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <ActiveTasksBar tasks={tasks} sessionId={sessionId} onKillTask={onKillTask} onInsertMessage={onInsertMessage ?? inputProps.onInputChange} />
        </div>
      )}
      {inputProps.structuredInput && (
        <div className="mb-2">
          <PermissionModeDropdown toolbar permissionMode={permissionMode} onPermissionModeChange={onPermissionModeChange} sessionId={sessionId} />
        </div>
      )}

      <InputErrorBoundary
        sessionId={sessionId}
        resetKey={inputResetKey}
        onClearDraft={handleClearDraft}
      >
        <InputContainer
          {...inputProps}
          compactMode={compactMode}
          permissionMode={permissionMode}
          onPermissionModeChange={onPermissionModeChange}
          labels={labels}
          sessionLabels={sessionLabels}
          onLabelAdd={handleLabelAdd}
          onLabelsChange={onLabelsChange}
          autoOpenLabelId={autoOpenLabelId}
          onAutoOpenLabelConsumed={() => setAutoOpenLabelId(null)}
          sessionFolderPath={sessionFolderPath}
          sessionId={sessionId}
          currentSessionStatus={currentSessionStatus}
        />
      </InputErrorBoundary>
    </div>
  )
}
