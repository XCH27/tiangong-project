import { CompactPermissionModeSelector } from './CompactPermissionModeSelector'
import { CompactModelSelector } from './CompactModelSelector'
import type { PermissionMode } from '@craft-agent/shared/agent/modes'
import type { ThinkingLevel } from '@craft-agent/shared/agent/thinking-levels'

interface CompactSessionLoadoutProps {
  sessionId?: string
  permissionMode?: PermissionMode
  onPermissionModeChange?: (mode: PermissionMode) => void
  enableCompactModelPicker?: boolean
  currentModel: string
  currentConnection?: string
  onModelChange: (model: string, connection?: string) => void
  onConnectionChange?: (connectionSlug: string) => void
  thinkingLevel?: ThinkingLevel
  onThinkingLevelChange?: (level: ThinkingLevel) => void
  isEmptySession?: boolean
  connectionUnavailable?: boolean
  contextStatus?: {
    isCompacting?: boolean
    inputTokens?: number
    contextWindow?: number
  }
}

export function CompactSessionLoadout({
  sessionId: _sessionId,
  permissionMode,
  onPermissionModeChange,
  enableCompactModelPicker,
  currentModel,
  currentConnection,
  onModelChange,
  onConnectionChange,
  thinkingLevel,
  onThinkingLevelChange,
  isEmptySession,
  connectionUnavailable,
  contextStatus,
}: CompactSessionLoadoutProps) {
  return (
    <>
      {onPermissionModeChange && permissionMode && (
        <CompactPermissionModeSelector
          permissionMode={permissionMode}
          onPermissionModeChange={onPermissionModeChange}
        />
      )}
      {enableCompactModelPicker && (
        <CompactModelSelector
          currentModel={currentModel}
          currentConnection={currentConnection}
          onModelChange={onModelChange}
          onConnectionChange={onConnectionChange}
          thinkingLevel={thinkingLevel}
          onThinkingLevelChange={onThinkingLevelChange}
          isEmptySession={isEmptySession}
          connectionUnavailable={connectionUnavailable}
          contextStatus={contextStatus}
        />
      )}
    </>
  )
}
