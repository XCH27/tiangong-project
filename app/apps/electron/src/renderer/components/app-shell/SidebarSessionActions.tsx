import * as React from 'react'
import { MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { SessionMeta } from '@/atoms/sessions'
import { RenameDialog } from '@/components/ui/rename-dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  StyledDropdownMenuContent,
} from '@/components/ui/styled-dropdown'
import { DropdownMenuProvider } from '@/components/ui/menu-context'
import { getSessionTitle } from '@/utils/session'
import type { LabelConfig } from '@craft-agent/shared/labels'
import type { SessionStatus, SessionStatusId } from '@/config/session-status-config'
import { SessionMenu, type SessionMenuProjectOption } from './SessionMenu'

interface SidebarSessionActionsProps {
  item: SessionMeta
  buttonClassName: string
  hasRemoteWorkspaces: boolean
  projects: SessionMenuProjectOption[]
  onSetProjectId: (sessionId: string, projectId: string | null) => void
  sessionStatuses: SessionStatus[]
  onSessionStatusChange: (sessionId: string, state: SessionStatusId) => void
  labels: LabelConfig[]
  onLabelsChange: (sessionId: string, labels: string[]) => void
  onRename: (sessionId: string, name: string) => void
  onFlag: (sessionId: string) => void
  onUnflag: (sessionId: string) => void
  onArchive: (sessionId: string) => void
  onUnarchive: (sessionId: string) => void
  onSendToWorkspace: (sessionId: string) => void
  onDelete: (sessionId: string) => void
}

/**
 * Reuses the same SessionMenu that powers the conversation list. This component
 * only owns the trigger and shared RenameDialog state required by a sidebar row.
 */
export function SidebarSessionActions({
  item,
  buttonClassName,
  hasRemoteWorkspaces,
  projects,
  onSetProjectId,
  sessionStatuses,
  onSessionStatusChange,
  labels,
  onLabelsChange,
  onRename,
  onFlag,
  onUnflag,
  onArchive,
  onUnarchive,
  onSendToWorkspace,
  onDelete,
}: SidebarSessionActionsProps) {
  const { t } = useTranslation()
  const title = getSessionTitle(item)
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [renameValue, setRenameValue] = React.useState(title)

  React.useEffect(() => {
    if (!renameOpen) setRenameValue(title)
  }, [renameOpen, title])

  const handleRenameSubmit = React.useCallback(() => {
    const nextName = renameValue.trim()
    if (nextName && nextName !== title) onRename(item.id, nextName)
    setRenameOpen(false)
  }, [item.id, onRename, renameValue, title])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={buttonClassName}
            aria-label={t('common.more')}
            title={t('common.more')}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <StyledDropdownMenuContent align="end">
          <DropdownMenuProvider>
            <SessionMenu
              item={item}
              hasRemoteWorkspaces={hasRemoteWorkspaces}
              projects={projects}
              onSetProjectId={(projectId) => onSetProjectId(item.id, projectId)}
              sessionStatuses={sessionStatuses}
              onSessionStatusChange={(state) => onSessionStatusChange(item.id, state)}
              labels={labels}
              onLabelsChange={(nextLabels) => onLabelsChange(item.id, nextLabels)}
              onRename={() => setRenameOpen(true)}
              onFlag={() => onFlag(item.id)}
              onUnflag={() => onUnflag(item.id)}
              onArchive={() => onArchive(item.id)}
              onUnarchive={() => onUnarchive(item.id)}
              onSendToWorkspace={() => onSendToWorkspace(item.id)}
              onDelete={() => onDelete(item.id)}
            />
          </DropdownMenuProvider>
        </StyledDropdownMenuContent>
      </DropdownMenu>
      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title={t('chat.renameSession')}
        value={renameValue}
        onValueChange={setRenameValue}
        onSubmit={handleRenameSubmit}
        placeholder={t('chat.enterSessionName')}
      />
    </>
  )
}
