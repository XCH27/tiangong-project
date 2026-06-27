import * as React from "react"
import { useTranslation } from "react-i18next"
import { useState, useCallback } from "react"
import { ChevronDown, Cloud, CloudOff, ExternalLink, Pencil, Trash2, X } from "lucide-react"
import { AnimatePresence } from "motion/react"
import { useSetAtom } from "jotai"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { fullscreenOverlayOpenAtom } from "@/atoms/overlay"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  StyledDropdownMenuContent,
  StyledDropdownMenuItem,
  StyledDropdownMenuSeparator,
} from "@/components/ui/styled-dropdown"
import { CrossfadeAvatar } from "@/components/ui/avatar"
import { FadingText } from "@/components/ui/fading-text"
import { WorkspaceCreationScreen } from "@/components/workspace"
import { waitForTransportConnected } from '@/lib/transport-wait'
import { RenameDialog } from "@/components/ui/rename-dialog"
import { useWorkspaceIcons } from "@/hooks/useWorkspaceIcon"
import { useTransportConnectionState } from "@/hooks/useTransportConnectionState"
import type { Workspace } from "../../../shared/types"

interface WorkspaceSwitcherProps {
  variant?: 'sidebar' | 'topbar'
  isCollapsed?: boolean
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  onSelect: (workspaceId: string, openInNewWindow?: boolean) => void | Promise<void>
  onWorkspaceCreated?: (workspace: Workspace) => void
  onWorkspaceRemoved?: () => void
  onWorkspaceUpdated?: () => void
  /** workspaceId -> has unread */
  workspaceUnreadMap?: Record<string, boolean>
}

/**
 * WorkspaceSwitcher - Dropdown to select active workspace.
 *
 * Supports two trigger variants:
 * - sidebar: bottom-left selector trigger
 * - topbar: center top-bar selector trigger
 */
export function WorkspaceSwitcher({
  variant = 'sidebar',
  isCollapsed = false,
  workspaces,
  activeWorkspaceId,
  onSelect,
  onWorkspaceCreated,
  onWorkspaceRemoved,
  onWorkspaceUpdated,
  workspaceUnreadMap,
}: WorkspaceSwitcherProps) {
  const { t } = useTranslation()
  const [showCreationScreen, setShowCreationScreen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [reconnectTarget, setReconnectTarget] = useState<Workspace | null>(null)
  const setFullscreenOverlayOpen = useSetAtom(fullscreenOverlayOpenAtom)
  const selectedWorkspace = workspaces.find(w => w.id === activeWorkspaceId)
  const selectedWorkspaceName = selectedWorkspace?.name
  const workspaceIconMap = useWorkspaceIcons(workspaces)
  const connectionState = useTransportConnectionState()
  const isRemote = connectionState?.mode === 'remote'

  /** True when we know a remote workspace is unreachable. */
  const isRemoteDisconnected = (workspaceId: string) => {
    // Active workspace: use live transport state
    if (workspaceId === activeWorkspaceId) {
      if (!isRemote || !connectionState) return false
      const { status } = connectionState
      return status !== 'connected' && status !== 'connecting' && status !== 'idle'
    }
    return false
  }

  const hasUnreadInOtherWorkspaces = React.useMemo(() => {
    if (!activeWorkspaceId || !workspaceUnreadMap) return false
    return workspaces.some((workspace) => workspace.id !== activeWorkspaceId && workspaceUnreadMap[workspace.id])
  }, [workspaces, activeWorkspaceId, workspaceUnreadMap])

  const handleWorkspaceCreated = (workspace: Workspace) => {
    setShowCreationScreen(false)
    setFullscreenOverlayOpen(false)
    toast.success(t('toast.createdWorkspace', { name: workspace.name }))
    onWorkspaceCreated?.(workspace)
    onSelect(workspace.id)
  }

  const handleCloseCreationScreen = useCallback(() => {
    setShowCreationScreen(false)
    setReconnectTarget(null)
    setFullscreenOverlayOpen(false)
  }, [setFullscreenOverlayOpen])

  const handleRenameWorkspace = useCallback(() => {
    if (!selectedWorkspace) return
    setRenameValue(selectedWorkspace.name)
    setRenameDialogOpen(true)
  }, [selectedWorkspace])

  const handleOpenWorkspaceInNewWindow = useCallback(() => {
    if (!selectedWorkspace) return
    onSelect(selectedWorkspace.id, true)
  }, [onSelect, selectedWorkspace])

  const handleCloseWorkspace = useCallback(async () => {
    if (!selectedWorkspace) return

    const fallbackWorkspace = workspaces.find((workspace) => workspace.id !== selectedWorkspace.id)
    const removed = await window.electronAPI.removeWorkspace(selectedWorkspace.id)
    if (!removed) return

    toast.success(t('toast.removedWorkspace', { name: selectedWorkspace.name }))
    onWorkspaceRemoved?.()

    if (fallbackWorkspace) {
      await Promise.resolve(onSelect(fallbackWorkspace.id))
    } else {
      window.electronAPI.closeWindow()
    }
  }, [onSelect, onWorkspaceRemoved, selectedWorkspace, t, workspaces])

  const handleDeleteWorkspace = useCallback(async () => {
    if (!selectedWorkspace) return

    const fallbackWorkspace = workspaces.find((workspace) => workspace.id !== selectedWorkspace.id)
    if (fallbackWorkspace) {
      await Promise.resolve(onSelect(fallbackWorkspace.id))
    }

    const deleted = await window.electronAPI.deleteWorkspace(selectedWorkspace.id)
    if (!deleted) return

    toast.success(t('toast.removedWorkspace', { name: selectedWorkspace.name }))
    onWorkspaceRemoved?.()

    if (!fallbackWorkspace) {
      window.electronAPI.closeWindow()
    }
  }, [onSelect, onWorkspaceRemoved, selectedWorkspace, t, workspaces])

  const handleSubmitRename = useCallback(async () => {
    if (!selectedWorkspace) return

    const nextName = renameValue.trim()
    if (!nextName || nextName === selectedWorkspace.name) {
      setRenameDialogOpen(false)
      return
    }

    try {
      await window.electronAPI.updateWorkspaceSetting(selectedWorkspace.id, 'name', nextName)
      toast.success(t('toast.updatedWorkspaceSettings'))
      onWorkspaceUpdated?.()
    } catch (error) {
      toast.error(t('toast.failedToUpdateWorkspaceSettings'), {
        description: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setRenameDialogOpen(false)
    }
  }, [onWorkspaceUpdated, renameValue, selectedWorkspace, t])

  const handleReconnectWorkspace = useCallback(async (workspaceId: string, remoteServer: { url: string; token: string; remoteWorkspaceId: string }) => {
    await window.electronAPI.updateWorkspaceRemoteServer(workspaceId, remoteServer)

    if (workspaceId === activeWorkspaceId) {
      await window.electronAPI.reconnectTransport()
      await waitForTransportConnected(window.electronAPI)
    } else {
      await Promise.resolve(onSelect(workspaceId))
      await waitForTransportConnected(window.electronAPI)
    }

    handleCloseCreationScreen()
    toast.success(t('toast.workspaceReconnected'))
  }, [activeWorkspaceId, handleCloseCreationScreen, onSelect])

  return (
    <>
      {/* Full-screen workspace creation overlay */}
      <AnimatePresence>
        {showCreationScreen && (
          <WorkspaceCreationScreen
            onWorkspaceCreated={handleWorkspaceCreated}
            onClose={handleCloseCreationScreen}
            reconnectWorkspace={reconnectTarget ?? undefined}
            onReconnectWorkspace={handleReconnectWorkspace}
          />
        )}
      </AnimatePresence>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === 'topbar' ? (
            <button
              type="button"
              data-workspace-switcher="topbar"
              className="header-icon-btn titlebar-no-drag ml-1 max-w-full min-w-0 inline-flex items-center justify-start gap-0.5 h-[30px] px-3 rounded-[8px] border border-foreground/6 text-[13px] text-foreground/50 hover:bg-foreground/5 hover:text-foreground transition-colors cursor-pointer data-[state=open]:bg-foreground/5 data-[state=open]:text-foreground"
              aria-label={t('workspace.selectWorkspace')}
            >
              <CrossfadeAvatar
                src={selectedWorkspace ? workspaceIconMap.get(selectedWorkspace.id) : undefined}
                alt={selectedWorkspaceName}
                className="h-4 w-4 mr-1.5 rounded-full ring-1 ring-border/50"
                fallbackClassName="bg-muted text-[10px] rounded-full"
                fallback={selectedWorkspaceName?.charAt(0) || t('workspace.fallbackInitial')}
              />
              <span className="truncate min-w-0 max-w-[220px] text-left">{selectedWorkspaceName || t('workspace.selectWorkspace')}</span>
              {selectedWorkspace?.remoteServer && (
                isRemoteDisconnected(selectedWorkspace.id)
                  ? <CloudOff className="h-3 w-3 text-destructive shrink-0" />
                  : <Cloud className="h-3 w-3 opacity-60 shrink-0" />
              )}
              <ChevronDown data-slot="chevron" className="h-3 w-3 opacity-60 shrink-0" />
              {hasUnreadInOtherWorkspaces && <span className="h-2 w-2 rounded-full bg-accent shrink-0" />}
            </button>
          ) : (
            <button
              className={cn(
                "flex items-center gap-1 w-full min-w-0 justify-start px-2 py-1.5 rounded-md",
                "text-foreground hover:bg-foreground/5 data-[state=open]:bg-foreground/5 transition-colors duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isCollapsed && "h-9 w-9 shrink-0 justify-center p-0"
              )}
              aria-label={t('workspace.selectWorkspace')}
            >
              <CrossfadeAvatar
                src={selectedWorkspace ? workspaceIconMap.get(selectedWorkspace.id) : undefined}
                alt={selectedWorkspaceName}
                className="h-4 w-4 rounded-full ring-1 ring-border/50"
                fallbackClassName="bg-foreground text-background text-[10px] rounded-full"
                fallback={selectedWorkspaceName?.charAt(0) || t('workspace.fallbackInitial')}
              />
              {!isCollapsed && (
                <>
                  <FadingText className="ml-1 font-sans min-w-0 text-sm" fadeWidth={36}>
                    {selectedWorkspaceName || t('workspace.selectWorkspace')}
                  </FadingText>
                  {selectedWorkspace?.remoteServer && (
                    isRemoteDisconnected(selectedWorkspace.id)
                      ? <CloudOff className="h-3 w-3 text-destructive shrink-0" />
                      : <Cloud className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
                </>
              )}
            </button>
          )}
        </DropdownMenuTrigger>

        <StyledDropdownMenuContent
          align={variant === 'topbar' ? 'center' : 'start'}
          sideOffset={variant === 'topbar' ? 6 : 4}
          minWidth={variant === 'topbar' ? 'min-w-64' : undefined}
        >
          <StyledDropdownMenuItem
            onClick={handleRenameWorkspace}
            className="font-sans"
          >
            <Pencil className="h-4 w-4" />
            {t("settings.workspace.renameWorkspace")}
          </StyledDropdownMenuItem>
          <StyledDropdownMenuItem
            onClick={handleOpenWorkspaceInNewWindow}
            className="font-sans"
          >
            <ExternalLink className="h-4 w-4" />
            {t("sidebarMenu.openInNewWindow")}
          </StyledDropdownMenuItem>
          <StyledDropdownMenuItem
            onClick={handleCloseWorkspace}
            className="font-sans"
          >
            <X className="h-4 w-4" />
            {t("workspace.closeWorkspace")}
          </StyledDropdownMenuItem>
          <StyledDropdownMenuSeparator />
          <StyledDropdownMenuItem
            onClick={handleDeleteWorkspace}
            className="font-sans text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {t("workspace.deleteWorkspace")}
          </StyledDropdownMenuItem>
        </StyledDropdownMenuContent>
      </DropdownMenu>

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        title={t("settings.workspace.renameWorkspace")}
        value={renameValue}
        onValueChange={setRenameValue}
        onSubmit={handleSubmitRename}
        placeholder={t("settings.workspace.enterWorkspaceName")}
      />
    </>
  )
}

interface WorkspaceAddButtonProps {
  onSelect: (workspaceId: string, openInNewWindow?: boolean) => void | Promise<void>
  onWorkspaceCreated?: (workspace: Workspace) => void
  className?: string
  children: React.ReactNode
}

export function WorkspaceAddButton({
  onSelect,
  onWorkspaceCreated,
  className,
  children,
}: WorkspaceAddButtonProps) {
  const { t } = useTranslation()
  const [showCreationScreen, setShowCreationScreen] = useState(false)
  const setFullscreenOverlayOpen = useSetAtom(fullscreenOverlayOpenAtom)

  const open = useCallback(() => {
    setShowCreationScreen(true)
    setFullscreenOverlayOpen(true)
  }, [setFullscreenOverlayOpen])

  const close = useCallback(() => {
    setShowCreationScreen(false)
    setFullscreenOverlayOpen(false)
  }, [setFullscreenOverlayOpen])

  const handleWorkspaceCreated = useCallback((workspace: Workspace) => {
    setShowCreationScreen(false)
    setFullscreenOverlayOpen(false)
    toast.success(t('toast.createdWorkspace', { name: workspace.name }))
    onWorkspaceCreated?.(workspace)
    onSelect(workspace.id)
  }, [onSelect, onWorkspaceCreated, setFullscreenOverlayOpen, t])

  return (
    <>
      <button type="button" className={className} onClick={open} aria-label={t("workspace.addWorkspace")}>
        {children}
      </button>
      <AnimatePresence>
        {showCreationScreen && (
          <WorkspaceCreationScreen
            onWorkspaceCreated={handleWorkspaceCreated}
            onClose={close}
          />
        )}
      </AnimatePresence>
    </>
  )
}
