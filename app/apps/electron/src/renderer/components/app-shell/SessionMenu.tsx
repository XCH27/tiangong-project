/**
 * SessionMenu - Shared menu content for session actions
 *
 * Used by:
 * - SessionList (dropdown via "..." button, context menu via right-click)
 * - ChatPage (title dropdown menu, desktop only — compact mode uses
 *   `CompactSessionMenu` which renders these same actions in a Drawer)
 *
 * Renders menu items via `useMenuComponents()` so the same content works
 * inside DropdownMenu or ContextMenu primitives. Side-effect handlers and
 * optimistic label state come from `useSessionMenuActions`, shared with
 * the compact-mode drawer to keep behaviour in one place.
 */

import * as React from 'react'
import { useTranslation } from "react-i18next"
import {
  Archive,
  ArchiveRestore,
  Trash2,
  Pencil,
  Flag,
  FlagOff,
  Copy,
  Send,
  FolderKanban,
  Check,
  Tag,
} from 'lucide-react'
import { useMenuComponents } from '@/components/ui/menu-context'
import type { SessionMeta } from '@/atoms/sessions'
import { getSessionStatus } from '@/utils/session'
import { MessagingSessionMenuItem } from '@/components/messaging/MessagingSessionMenuItem'
import { useSessionMenuActions } from '@/hooks/useSessionMenuActions'
import { LabelMenuItems, StatusMenuItems } from './SessionMenuParts'
import {
  getStateColor,
  getStateIcon,
  type SessionStatusId,
  type SessionStatus,
} from '@/config/session-status-config'
import type { LabelConfig } from '@craft-agent/shared/labels'

export interface SessionMenuProjectOption {
  id: string
  slug: string
  name: string
}

export interface SessionMenuProps {
  /** Session data — display state is derived from this */
  item: SessionMeta
  /** Whether multiple workspaces exist (enables "Send to Workspace" item) */
  hasRemoteWorkspaces?: boolean
  /** Workspace projects (omit to hide the submenu) */
  projects?: SessionMenuProjectOption[]
  /** Callback for binding/unbinding the session to a project. `null` = unbind. */
  onSetProjectId?: (projectId: string | null) => void
  /** Workspace status definitions for the Status submenu (Decision E10 / R1 labels home). */
  sessionStatuses?: SessionStatus[]
  onSessionStatusChange?: (state: SessionStatusId) => void
  /** Label definitions for the Labels submenu. */
  labels?: LabelConfig[]
  onLabelsChange?: (labels: string[]) => void
  /** Callbacks */
  onRename: () => void
  onFlag: () => void
  onUnflag: () => void
  onArchive: () => void
  onUnarchive: () => void
  onSendToWorkspace?: () => void
  onDelete: () => void
}

/**
 * SessionMenu - Renders the menu items for session actions
 * This is the content only, not wrapped in a DropdownMenu
 */
export function SessionMenu({
  item,
  onRename,
  onFlag,
  onUnflag,
  onArchive,
  onUnarchive,
  onSendToWorkspace,
  onDelete,
  hasRemoteWorkspaces,
  projects = [],
  onSetProjectId,
  sessionStatuses = [],
  onSessionStatusChange,
  labels = [],
  onLabelsChange,
}: SessionMenuProps) {
  const { t } = useTranslation()

  const sessionId = item.id
  const isFlagged = item.isFlagged ?? false
  const isArchived = item.isArchived ?? false
  const currentSessionStatus = getSessionStatus(item)
  const sessionLabels = item.labels ?? []

  const actions = useSessionMenuActions({ item, onLabelsChange })

  // Get menu components from context (works with both DropdownMenu and ContextMenu)
  const { MenuItem, Separator, Sub, SubTrigger, SubContent } = useMenuComponents()

  return (
    <>
      {/* Send to Workspace — visible when at least one other workspace exists */}
      {hasRemoteWorkspaces && onSendToWorkspace && (
        <MenuItem onClick={onSendToWorkspace}>
          <Send className="h-3.5 w-3.5" />
          <span className="flex-1">{t("sessionMenu.sendToWorkspace")}</span>
        </MenuItem>
      )}

      {/* Connect to Messaging — pairing code flow */}
      <MessagingSessionMenuItem sessionId={sessionId} />

      <Separator />

      {/* Status submenu — definitions live in Settings; assignment stays on the Session menu (E10). */}
      {sessionStatuses.length > 0 && onSessionStatusChange && (
        <Sub>
          <SubTrigger className="pr-2">
            <span style={{ color: getStateColor(currentSessionStatus, sessionStatuses) ?? 'var(--foreground)' }}>
              {(() => {
                const icon = getStateIcon(currentSessionStatus, sessionStatuses)
                return React.isValidElement(icon)
                  ? React.cloneElement(icon as React.ReactElement<{ bare?: boolean }>, { bare: true })
                  : icon
              })()}
            </span>
            <span className="flex-1">{t("sessionMenu.status")}</span>
          </SubTrigger>
          <SubContent>
            <StatusMenuItems
              sessionStatuses={sessionStatuses}
              activeStateId={currentSessionStatus}
              onSelect={onSessionStatusChange}
              menu={{ MenuItem }}
            />
          </SubContent>
        </Sub>
      )}

      {/* Labels submenu — definitions live in Settings; assignment stays here (R1/P10). */}
      {labels.length > 0 && onLabelsChange && (
        <Sub>
          <SubTrigger className="pr-2">
            <Tag className="h-3.5 w-3.5" />
            <span className="flex-1">{t("sessionMenu.labels")}</span>
            {sessionLabels.length > 0 && (
              <span className="text-[10px] text-muted-foreground tabular-nums -mr-2.5">
                {sessionLabels.length}
              </span>
            )}
          </SubTrigger>
          <SubContent>
            <LabelMenuItems
              labels={labels}
              appliedLabelIds={actions.appliedLabelIds}
              onToggle={actions.toggleLabel}
              menu={{ MenuItem, Separator, Sub, SubTrigger, SubContent }}
            />
          </SubContent>
        </Sub>
      )}

      {/* Projects submenu - workspace projects + "No project" to clear binding */}
      {projects.length > 0 && onSetProjectId && (
        <Sub>
          <SubTrigger className="pr-2">
            <FolderKanban className="h-3.5 w-3.5" />
            <span className="flex-1">{t("sessionMenu.projects")}</span>
          </SubTrigger>
          <SubContent>
            <MenuItem onClick={() => onSetProjectId(null)}>
              {!item.projectId && <Check className="h-3.5 w-3.5" />}
              <span className={item.projectId ? 'flex-1 ml-[18px]' : 'flex-1'}>
                {t("sessionMenu.noProject")}
              </span>
            </MenuItem>
            <Separator />
            {projects.map((p) => {
              const isBound = item.projectId === p.id
              return (
                <MenuItem key={p.id} onClick={() => onSetProjectId(p.id)}>
                  {isBound && <Check className="h-3.5 w-3.5" />}
                  <span className={isBound ? 'flex-1' : 'flex-1 ml-[18px]'}>{p.name}</span>
                </MenuItem>
              )
            })}
          </SubContent>
        </Sub>
      )}

      {/* Flag/Unflag */}
      {!isFlagged ? (
        <MenuItem onClick={onFlag}>
          <Flag className="h-3.5 w-3.5 text-info" />
          <span className="flex-1">{t("sessionMenu.flag")}</span>
        </MenuItem>
      ) : (
        <MenuItem onClick={onUnflag}>
          <FlagOff className="h-3.5 w-3.5" />
          <span className="flex-1">{t("sessionMenu.unflag")}</span>
        </MenuItem>
      )}

      {/* Archive/Unarchive */}
      {!isArchived ? (
        <MenuItem onClick={onArchive}>
          <Archive className="h-3.5 w-3.5" />
          <span className="flex-1">{t("sessionMenu.archive")}</span>
        </MenuItem>
      ) : (
        <MenuItem onClick={onUnarchive}>
          <ArchiveRestore className="h-3.5 w-3.5" />
          <span className="flex-1">{t("sessionMenu.unarchive")}</span>
        </MenuItem>
      )}

      <Separator />

      {/* Rename */}
      <MenuItem onClick={onRename}>
        <Pencil className="h-3.5 w-3.5" />
        <span className="flex-1">{t("common.rename")}</span>
      </MenuItem>

      {/* Copy Path */}
      <MenuItem onClick={actions.copyPath}>
        <Copy className="h-3.5 w-3.5" />
        <span className="flex-1">{t("sessionMenu.copyPath")}</span>
      </MenuItem>

      <Separator />

      {/* Delete */}
      <MenuItem onClick={onDelete} variant="destructive">
        <Trash2 className="h-3.5 w-3.5" />
        <span className="flex-1">{t("common.delete")}</span>
      </MenuItem>
    </>
  )
}
