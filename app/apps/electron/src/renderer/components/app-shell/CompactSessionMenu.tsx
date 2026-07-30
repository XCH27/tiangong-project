/**
 * CompactSessionMenu
 *
 * Bottom-sheet replacement for the desktop ChatPage title dropdown
 * (`SessionMenu` wrapped by `PanelHeader`'s Radix DropdownMenu) when
 * `AppShellContext.isCompactMode === true`. Mirrors the same actions but
 * routes Share / Connect Messaging submenus through
 * an internal view stack instead of nested Radix popovers — Radix submenus
 * get clipped by the panel container query on narrow viewports, and the
 * nested submenus can fall off the right edge.
 *
 * Pattern matches the other compact pickers (`CompactSessionListFilter`,
 * `CompactWorkspaceSwitcher`) and also
 * follows the iOS-style drill-in behaviour established by `MobileAppMenu`.
 *
 * Side-effect handlers (share / copy path / share submenu) come from
 * `useSessionMenuActions`,
 * shared with the desktop `SessionMenu` so a new session action only has to
 * be wired through one place.
 *
 * Leaf actions close the drawer on tap.
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import {
  Archive,
  ArchiveRestore,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  FlagOff,
  FolderKanban,
  MessageSquare,
  Pencil,
  Send,
  Tag,
  Trash2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import type { SessionMeta } from '@/atoms/sessions'
import { getSessionStatus } from '@/utils/session'
import { useMessagingConnect, type MessagingPlatform } from '@/components/messaging/MessagingSessionMenuItem'
import { useSessionMenuActions } from '@/hooks/useSessionMenuActions'
import type { SessionMenuProjectOption } from './SessionMenu'
import type { LabelConfig } from '@craft-agent/shared/labels'
import { flattenLabels } from '@craft-agent/shared/labels'
import { getLocalizedLabelName } from '@/utils/label-display-name'
import {
  getLocalizedStatusLabel,
  getStateColor,
  getStateIcon,
  type SessionStatusId,
  type SessionStatus,
} from '@/config/session-status-config'

type View = 'root' | 'messaging' | 'status' | 'labels' | 'projects'

export interface CompactSessionMenuProps {
  /** Title text shown in the trigger button + drawer header. */
  title?: string
  /** Optional badge element rendered next to the title (e.g. agent badge). */
  badge?: React.ReactNode
  /** Shimmer animation while the title is being regenerated. */
  isRegeneratingTitle?: boolean

  // Session data — same as SessionMenu
  item: SessionMeta
  hasRemoteWorkspaces?: boolean
  projects?: SessionMenuProjectOption[]
  onSetProjectId?: (projectId: string | null) => void
  sessionStatuses?: SessionStatus[]
  onSessionStatusChange?: (state: SessionStatusId) => void
  labels?: LabelConfig[]
  onLabelsChange?: (labels: string[]) => void

  // Callbacks — same as SessionMenu
  onRename: () => void
  onFlag: () => void
  onUnflag: () => void
  onArchive: () => void
  onUnarchive: () => void
  onSendToWorkspace?: () => void
  onDelete: () => void

  // ---------------------------------------------------------------------------
  // Controlled-component shim — used by EntityRow / SessionItem so a single
  // drawer instance can be driven from multiple triggers (`…` button + long-
  // press). When `open` is omitted the component owns its own state (the
  // chat-header callsite, unchanged). Matches the Radix Dialog convention.
  // ---------------------------------------------------------------------------
  /** Controlled open state. When omitted, the component owns its own state. */
  open?: boolean
  /** Notifies the consumer when the controlled open state should change. */
  onOpenChange?: (open: boolean) => void
  /** Custom trigger node. `null` opts out of rendering ANY trigger (the row
   *  provides its own). When omitted, renders the title-pill trigger used
   *  by the chat header. */
  trigger?: React.ReactNode | null
}

export function CompactSessionMenu({
  title,
  badge,
  isRegeneratingTitle,
  item,
  hasRemoteWorkspaces,
  projects = [],
  onSetProjectId,
  sessionStatuses = [],
  onSessionStatusChange,
  labels = [],
  onLabelsChange,
  onRename,
  onFlag,
  onUnflag,
  onArchive,
  onUnarchive,
  onSendToWorkspace,
  onDelete,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: CompactSessionMenuProps) {
  const { t } = useTranslation()
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )
  const [view, setView] = React.useState<View>('root')

  // Reset to root pane every time the drawer closes so the next open
  // doesn't surprise the user with a sub-pane from the previous session.
  React.useEffect(() => {
    if (!open) setView('root')
  }, [open])

  // Close+reset the drawer if the underlying session changes while it's open.
  // Otherwise action handlers retarget to the new session (e.g. user opens
  // menu for A, navigation switches to B, "Delete" deletes B).
  React.useEffect(() => {
    setOpen(false)
    setView('root')
  }, [item.id, setOpen])

  const isFlagged = item.isFlagged ?? false
  const isArchived = item.isArchived ?? false
  const currentSessionStatus = getSessionStatus(item)
  const flatLabels = React.useMemo(() => flattenLabels(labels), [labels])

  const actions = useSessionMenuActions({ item, onLabelsChange })

  // Wrap a callback so it also closes the drawer. Async callbacks fire
  // their work in the background — the drawer doesn't need to stay open
  // for the request to complete.
  const closeAfter = React.useCallback(
    <T extends (...args: never[]) => void | Promise<void>>(fn?: T) => {
      if (!fn) return undefined
      return ((...args: Parameters<T>) => {
        void fn(...args)
        setOpen(false)
      }) as T
    },
    [setOpen],
  )

  const connectMessaging = useMessagingConnect({ sessionId: item.id })
  const handleConnectMessaging = (platform: MessagingPlatform) => {
    setOpen(false)
    void connectMessaging(platform)
  }

  // ---------------------------------------------------------------------------
  // Drawer header — shared between root + sub-panes. Sub-panes show a back
  // chevron; the root pane shows the session title.
  // ---------------------------------------------------------------------------
  const headerTitle = (() => {
    switch (view) {
      case 'messaging': return t('sessionMenu.connectMessaging')
      case 'status': return t('sessionMenu.status')
      case 'labels': return t('sessionMenu.labels')
      case 'projects': return t('sessionMenu.projects')
      default: return title ?? ''
    }
  })()

  const showBack = view !== 'root'

  // Resolve the trigger node:
  //   - `trigger === null`  → don't render any trigger (row provides its own).
  //   - `trigger` provided  → render the consumer's node inside DrawerTrigger.
  //   - `trigger` omitted   → render the default title-pill button (chat header).
  const triggerNode = trigger === null
    ? null
    : trigger !== undefined
      ? <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      : (
        <DrawerTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md titlebar-no-drag min-w-0',
              'hover:bg-foreground/[0.03] transition-colors',
              'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'data-[state=open]:bg-foreground/[0.03]',
            )}
            aria-label={title}
          >
            <motion.div
              initial={false}
              animate={{ opacity: title ? 1 : 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1 min-w-0"
            >
              <h1
                className={cn(
                  'text-sm font-semibold truncate font-sans leading-tight',
                  isRegeneratingTitle && 'animate-shimmer-text',
                )}
              >
                {title}
              </h1>
              {badge}
            </motion.div>
            <span className="shrink-0 flex items-center justify-center">
              <ChevronDown className="h-3.5 w-3.5 text-foreground/50 translate-y-[1px]" />
            </span>
          </button>
        </DrawerTrigger>
      )

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {triggerNode}

      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="!flex flex-row items-center gap-2 !text-left pr-3">
          {showBack && (
            <button
              type="button"
              onClick={() => setView('root')}
              className="-ml-1 h-8 w-8 rounded-md flex items-center justify-center hover:bg-foreground/5 active:bg-foreground/10 transition-colors text-foreground/50"
              aria-label={t('common.back')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <DrawerTitle className="flex-1 min-w-0 truncate">{headerTitle}</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-6">
          {view === 'root' && (
            <RootPane
              isFlagged={isFlagged}
              isArchived={isArchived}
              hasRemoteWorkspaces={hasRemoteWorkspaces}
              hasStatus={sessionStatuses.length > 0 && !!onSessionStatusChange}
              hasLabels={flatLabels.length > 0 && !!onLabelsChange}
              hasProjects={projects.length > 0 && !!onSetProjectId}
              statusIcon={
                sessionStatuses.length > 0
                  ? (
                    <span style={{ color: getStateColor(currentSessionStatus, sessionStatuses) ?? 'var(--foreground)' }}>
                      {(() => {
                        const icon = getStateIcon(currentSessionStatus, sessionStatuses)
                        return React.isValidElement(icon)
                          ? React.cloneElement(icon as React.ReactElement<{ bare?: boolean }>, { bare: true })
                          : icon
                      })()}
                    </span>
                  )
                  : undefined
              }
              onSendToWorkspace={closeAfter(onSendToWorkspace)}
              onOpenMessagingSub={() => setView('messaging')}
              onOpenStatusSub={() => setView('status')}
              onOpenLabelsSub={() => setView('labels')}
              onOpenProjectsSub={() => setView('projects')}
              onFlag={closeAfter(onFlag)}
              onUnflag={closeAfter(onUnflag)}
              onArchive={closeAfter(onArchive)}
              onUnarchive={closeAfter(onUnarchive)}
              onRename={closeAfter(onRename)}
              onCopyPath={closeAfter(actions.copyPath)}
              onDelete={closeAfter(onDelete)}
            />
          )}

          {view === 'messaging' && (
            <MessagingPane onConnect={handleConnectMessaging} />
          )}

          {view === 'status' && onSessionStatusChange && (
            <StatusPane
              sessionStatuses={sessionStatuses}
              activeStateId={currentSessionStatus}
              onSelect={(state) => {
                onSessionStatusChange(state)
                setOpen(false)
              }}
            />
          )}

          {view === 'labels' && onLabelsChange && (
            <LabelsPane
              labels={flatLabels}
              appliedLabelIds={actions.appliedLabelIds}
              onToggle={actions.toggleLabel}
            />
          )}

          {view === 'projects' && onSetProjectId && (
            <ProjectsPane
              projects={projects}
              activeProjectId={item.projectId}
              onSelect={(projectId) => {
                onSetProjectId(projectId)
                setOpen(false)
              }}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// ---------------------------------------------------------------------------
// Panes
// ---------------------------------------------------------------------------

interface RootPaneProps {
  isFlagged: boolean
  isArchived: boolean
  hasRemoteWorkspaces?: boolean
  hasStatus?: boolean
  hasLabels?: boolean
  hasProjects?: boolean
  statusIcon?: React.ReactNode
  onSendToWorkspace?: () => void
  onOpenMessagingSub: () => void
  onOpenStatusSub?: () => void
  onOpenLabelsSub?: () => void
  onOpenProjectsSub?: () => void
  onFlag?: () => void
  onUnflag?: () => void
  onArchive?: () => void
  onUnarchive?: () => void
  onRename?: () => void
  onCopyPath?: () => void
  onDelete?: () => void
}

function RootPane({
  isFlagged,
  isArchived,
  hasRemoteWorkspaces,
  hasStatus,
  hasLabels,
  hasProjects,
  statusIcon,
  onSendToWorkspace,
  onOpenMessagingSub,
  onOpenStatusSub,
  onOpenLabelsSub,
  onOpenProjectsSub,
  onFlag,
  onUnflag,
  onArchive,
  onUnarchive,
  onRename,
  onCopyPath,
  onDelete,
}: RootPaneProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col">
      {hasRemoteWorkspaces && onSendToWorkspace && (
        <Row icon={<Send className="h-4 w-4" />} label={t('sessionMenu.sendToWorkspace')} onTap={onSendToWorkspace} />
      )}

      <Row
        icon={<MessageSquare className="h-4 w-4" />}
        label={t('sessionMenu.connectMessaging')}
        chevron
        onTap={onOpenMessagingSub}
      />

      <Separator />

      {hasStatus && onOpenStatusSub && (
        <Row
          icon={statusIcon ?? <span className="h-4 w-4" />}
          label={t('sessionMenu.status')}
          chevron
          onTap={onOpenStatusSub}
        />
      )}
      {hasLabels && onOpenLabelsSub && (
        <Row icon={<Tag className="h-4 w-4" />} label={t('sessionMenu.labels')} chevron onTap={onOpenLabelsSub} />
      )}
      {hasProjects && onOpenProjectsSub && (
        <Row icon={<FolderKanban className="h-4 w-4" />} label={t('sessionMenu.projects')} chevron onTap={onOpenProjectsSub} />
      )}
      {(hasStatus || hasLabels || hasProjects) && <Separator />}

      {!isFlagged ? (
        <Row icon={<Flag className="h-4 w-4 text-info" />} label={t('sessionMenu.flag')} onTap={onFlag} />
      ) : (
        <Row icon={<FlagOff className="h-4 w-4" />} label={t('sessionMenu.unflag')} onTap={onUnflag} />
      )}

      {!isArchived ? (
        <Row icon={<Archive className="h-4 w-4" />} label={t('sessionMenu.archive')} onTap={onArchive} />
      ) : (
        <Row icon={<ArchiveRestore className="h-4 w-4" />} label={t('sessionMenu.unarchive')} onTap={onUnarchive} />
      )}

      <Separator />

      <Row icon={<Pencil className="h-4 w-4" />} label={t('common.rename')} onTap={onRename} />
      <Row icon={<Copy className="h-4 w-4" />} label={t('sessionMenu.copyPath')} onTap={onCopyPath} />

      <Separator />

      <Row
        icon={<Trash2 className="h-4 w-4" />}
        label={t('common.delete')}
        destructive
        onTap={onDelete}
      />
    </div>
  )
}

function MessagingPane({ onConnect }: { onConnect: (platform: MessagingPlatform) => void }) {
  return (
    <div className="flex flex-col">
      <Row icon={<MessageSquare className="h-4 w-4" />} label="Telegram" onTap={() => onConnect('telegram')} />
      <Row icon={<MessageSquare className="h-4 w-4" />} label="WhatsApp" onTap={() => onConnect('whatsapp')} />
      <Row icon={<MessageSquare className="h-4 w-4" />} label="Lark / Feishu" onTap={() => onConnect('lark')} />
    </div>
  )
}

function StatusPane({
  sessionStatuses,
  activeStateId,
  onSelect,
}: {
  sessionStatuses: SessionStatus[]
  activeStateId: SessionStatusId
  onSelect: (state: SessionStatusId) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col">
      {sessionStatuses.map((state) => {
        const icon = getStateIcon(state.id, sessionStatuses)
        return (
          <Row
            key={state.id}
            icon={(
              <span style={{ color: getStateColor(state.id, sessionStatuses) ?? 'var(--foreground)' }}>
                {React.isValidElement(icon)
                  ? React.cloneElement(icon as React.ReactElement<{ bare?: boolean }>, { bare: true })
                  : icon}
              </span>
            )}
            label={getLocalizedStatusLabel(t, state)}
            trailing={activeStateId === state.id ? <Check className="h-4 w-4 text-foreground/60" /> : undefined}
            onTap={() => onSelect(state.id)}
          />
        )
      })}
    </div>
  )
}

function LabelsPane({
  labels,
  appliedLabelIds,
  onToggle,
}: {
  labels: LabelConfig[]
  appliedLabelIds: Set<string>
  onToggle: (labelId: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col">
      {labels.map((label) => (
        <Row
          key={label.id}
          icon={<Tag className="h-4 w-4" />}
          label={getLocalizedLabelName(t, label)}
          trailing={appliedLabelIds.has(label.id) ? <Check className="h-4 w-4 text-foreground/60" /> : undefined}
          onTap={() => onToggle(label.id)}
        />
      ))}
    </div>
  )
}

function ProjectsPane({
  projects,
  activeProjectId,
  onSelect,
}: {
  projects: SessionMenuProjectOption[]
  activeProjectId?: string | null
  onSelect: (projectId: string | null) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col">
      <Row
        icon={<FolderKanban className="h-4 w-4" />}
        label={t('sessionMenu.noProject')}
        trailing={!activeProjectId ? <Check className="h-4 w-4 text-foreground/60" /> : undefined}
        onTap={() => onSelect(null)}
      />
      {projects.map((project) => (
        <Row
          key={project.id}
          icon={<FolderKanban className="h-4 w-4" />}
          label={project.name}
          trailing={activeProjectId === project.id ? <Check className="h-4 w-4 text-foreground/60" /> : undefined}
          onTap={() => onSelect(project.id)}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

interface RowProps {
  icon: React.ReactNode
  label: React.ReactNode
  trailing?: React.ReactNode
  chevron?: boolean
  destructive?: boolean
  onTap?: () => void
}

function Row({
  icon,
  label,
  trailing,
  chevron,
  destructive,
  onTap,
}: RowProps) {
  if (!onTap) return null
  return (
    <button
      type="button"
      onClick={onTap}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-3 rounded-[10px] text-left transition-colors',
        'hover:bg-foreground/5 active:bg-foreground/10',
        destructive && 'text-destructive hover:bg-destructive/10 active:bg-destructive/15',
      )}
    >
      <span className="shrink-0 inline-flex items-center justify-center h-5 w-5">
        {icon}
      </span>
      <span className="flex-1 min-w-0 text-sm truncate">{label}</span>
      {trailing}
      {chevron && <ChevronRight className="h-4 w-4 shrink-0 text-foreground/50" />}
    </button>
  )
}

function Separator() {
  return <div className="my-1 mx-3 h-px bg-foreground/[0.06]" />
}
