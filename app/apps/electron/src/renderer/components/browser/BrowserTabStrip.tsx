/**
 * BrowserTabStrip
 *
 * Rendered in the TopBar, shows compact badges for all active browser instances.
 * Each badge opens a shared action menu.
 */

import { useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import * as Icons from 'lucide-react'
import { Spinner } from '@craft-agent/ui'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuSub,
  StyledDropdownMenuContent,
  StyledDropdownMenuItem,
  StyledDropdownMenuSubTrigger,
  StyledDropdownMenuSubContent,
  StyledDropdownMenuSeparator,
} from '@/components/ui/styled-dropdown'
import {
  activeBrowserInstanceIdAtom,
  browserInstancesAtom,
  filterInstancesForWorkspace,
  setBrowserInstancesAtom,
  updateBrowserInstanceAtom,
  removeBrowserInstanceAtom,
} from '@/atoms/browser-pane'
import { useAppShellContext } from '@/context/AppShellContext'
import { NavigationContext } from '@/context/NavigationContext'
import { sessionMetaMapAtom } from '@/atoms/sessions'
import { BrowserTabBadge } from './BrowserTabBadge'
import type { BrowserInstanceInfo } from '../../../shared/types'
import { getHostname } from './utils'
import { navigate, routes } from '@/lib/navigate'
import { getBrowserActionErrorMessage, runConfirmedBrowserAction } from './browser-action'

const DEFAULT_MAX_VISIBLE_BADGES = 3

interface BrowserTabStripProps {
  activeSessionId?: string | null
  instancesOverride?: BrowserInstanceInfo[]
  maxVisibleBadges?: number
}

export function BrowserTabStrip({
  activeSessionId,
  instancesOverride,
  maxVisibleBadges = DEFAULT_MAX_VISIBLE_BADGES,
}: BrowserTabStripProps) {
  const { t } = useTranslation()
  // Filter the badge strip to the workspace currently in focus. Remote-connected
  // workspaces have a different `remoteWorkspaceId` (what the remote agent
  // stamps onto its tabs) than the local `activeWorkspaceId` (what locally-
  // opened manual tabs use), so we accept either.
  const { activeWorkspaceId, workspaces } = useAppShellContext()
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)
  const remoteWorkspaceId = activeWorkspace?.remoteServer?.remoteWorkspaceId ?? null
  const allInstances = useAtomValue(browserInstancesAtom)
  const instances = useMemo(
    () => filterInstancesForWorkspace(allInstances, activeWorkspaceId, remoteWorkspaceId),
    [allInstances, activeWorkspaceId, remoteWorkspaceId],
  )
  const setInstances = useSetAtom(setBrowserInstancesAtom)
  const updateInstance = useSetAtom(updateBrowserInstanceAtom)
  const removeInstance = useSetAtom(removeBrowserInstanceAtom)
  const [activeInstanceId, setActiveInstanceId] = useAtom(activeBrowserInstanceIdAtom)
  // NavigationContext is nullable so the strip stays mountable in the playground;
  // navigateToSession rehomes by session meta, the raw navigate() fallback needs
  // the meta's workingDirectory/workspaceId to build the correct sessionHome route.
  const nav = useContext(NavigationContext)
  const sessionMetaMap = useAtomValue(sessionMetaMapAtom)
  const effectiveInstances = instancesOverride ?? instances
  const instancesRef = useRef(effectiveInstances)
  const removeReconcileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const orderedInstances = useMemo(() => {
    const items = [...effectiveInstances]

    // Global list: keep all browser windows visible.
    // Optional ordering preference: session-local windows first.
    if (activeSessionId) {
      items.sort((a, b) => {
        const aInActiveSession = a.boundSessionId === activeSessionId ? 0 : 1
        const bInActiveSession = b.boundSessionId === activeSessionId ? 0 : 1
        if (aInActiveSession !== bInActiveSession) return aInActiveSession - bInActiveSession
        return a.id.localeCompare(b.id)
      })
    } else {
      items.sort((a, b) => a.id.localeCompare(b.id))
    }

    return items
  }, [effectiveInstances, activeSessionId])

  useEffect(() => {
    instancesRef.current = effectiveInstances
  }, [effectiveInstances])

  useEffect(() => {
    if (instancesOverride) return

    const browserPaneApi = window.electronAPI?.browserPane
    if (!browserPaneApi || !window.electronAPI.isChannelAvailable('browser-pane:list')) {
      setInstances([])
      setActiveInstanceId(null)
      return
    }

    browserPaneApi.list()
      .then((items) => {
        setInstances(items)
        if (items.length === 0) {
          setActiveInstanceId(null)
          return
        }
        setActiveInstanceId((prev) => prev ?? items[0].id)
      })
      .catch((error) => {
        console.warn('[BrowserTabStrip] Failed to list browser panes:', error)
        setInstances([])
        setActiveInstanceId(null)
      })
  }, [instancesOverride, setInstances, setActiveInstanceId])

  useEffect(() => {
    if (instancesOverride) return

    const browserPaneApi = window.electronAPI?.browserPane
    if (!browserPaneApi || !window.electronAPI.isChannelAvailable('browser-pane:list')) return

    const cleanupState = browserPaneApi.onStateChanged((info: BrowserInstanceInfo) => {
      updateInstance(info)
    })

    const cleanupRemoved = browserPaneApi.onRemoved((id: string) => {
      removeInstance(id)
      setActiveInstanceId((prev) => {
        if (prev !== id) return prev
        const remaining = instancesRef.current.filter((item) => item.id !== id)
        return remaining[0]?.id ?? null
      })

      if (removeReconcileTimerRef.current) {
        clearTimeout(removeReconcileTimerRef.current)
      }

      removeReconcileTimerRef.current = setTimeout(() => {
        removeReconcileTimerRef.current = null
        void browserPaneApi.list()
          .then((items) => {
            setInstances(items)
            setActiveInstanceId((prev) => {
              if (!prev) return items[0]?.id ?? null
              return items.some((item) => item.id === prev) ? prev : (items[0]?.id ?? null)
            })
          })
          .catch((error) => {
            console.warn('[BrowserTabStrip] Reconcile list failed after remove:', error)
          })
      }, 75)
    })

    const cleanupInteracted = browserPaneApi.onInteracted((id: string) => {
      setActiveInstanceId(id)
    })

    return () => {
      cleanupState()
      cleanupRemoved()
      cleanupInteracted()
      if (removeReconcileTimerRef.current) {
        clearTimeout(removeReconcileTimerRef.current)
        removeReconcileTimerRef.current = null
      }
    }
  }, [instancesOverride, updateInstance, removeInstance, setActiveInstanceId, setInstances])

  useEffect(() => {
    if (orderedInstances.length === 0) {
      setActiveInstanceId(null)
      return
    }
    if (!activeInstanceId || !orderedInstances.some((item) => item.id === activeInstanceId)) {
      setActiveInstanceId(orderedInstances[0].id)
    }
  }, [orderedInstances, activeInstanceId, setActiveInstanceId])

  const focusBrowserWindow = useCallback(async (instance: BrowserInstanceInfo) => {
    if (instancesOverride) {
      setActiveInstanceId(instance.id)
      return
    }

    const browserPaneApi = window.electronAPI?.browserPane
    if (!browserPaneApi) {
      console.warn('[BrowserTabStrip] browserPane API unavailable for focus action')
      toast.error(t('rightWorkbench.browser.focusFailed'))
      return
    }

    const result = await runConfirmedBrowserAction(
      () => browserPaneApi.focus(instance.id),
      () => setActiveInstanceId(instance.id),
    )
    if (!result.ok) {
      const message = getBrowserActionErrorMessage(result.error)
      console.warn(`[BrowserTabStrip] Failed to focus browser window ${instance.id}:`, result.error)
      toast.error(t('rightWorkbench.browser.focusFailed'), { description: message })
    }
  }, [instancesOverride, setActiveInstanceId, t])

  const openSessionUsingWindow = useCallback((instance: BrowserInstanceInfo) => {
    const sessionId = instance.boundSessionId ?? instance.ownerSessionId
    if (!sessionId) return
    if (nav) {
      nav.navigateToSession(sessionId)
      return
    }
    // R1: no permanent All Sessions; home from meta so folder-bound sessions keep
    // their selection (bare {id} would wrongly route them to 对话).
    const meta = sessionMetaMap.get(sessionId)
    navigate(routes.view.sessionHome({
      id: sessionId,
      workingDirectory: meta?.workingDirectory,
      workspaceId: meta?.workspaceId,
    }))
  }, [nav, sessionMetaMap])

  const confirmBrowserRemoved = useCallback((instance: BrowserInstanceInfo) => {
    if (!instancesOverride) removeInstance(instance.id)
    setActiveInstanceId((prev) => {
      if (prev !== instance.id) return prev
      const remaining = instancesRef.current.filter((item) => item.id !== instance.id)
      return remaining[0]?.id ?? null
    })
  }, [instancesOverride, removeInstance, setActiveInstanceId])

  const terminateBrowserWindow = useCallback(async (instance: BrowserInstanceInfo) => {
    if (instancesOverride) {
      confirmBrowserRemoved(instance)
      return
    }

    const browserPaneApi = window.electronAPI?.browserPane
    if (!browserPaneApi) {
      console.warn('[BrowserTabStrip] browserPane API unavailable for terminate action')
      toast.error(t('rightWorkbench.browser.terminateFailed'))
      return
    }

    const result = await runConfirmedBrowserAction(
      () => browserPaneApi.destroy(instance.id),
      () => confirmBrowserRemoved(instance),
    )
    if (!result.ok) {
      const message = getBrowserActionErrorMessage(result.error)
      console.warn(`[BrowserTabStrip] Failed to terminate browser window ${instance.id}:`, result.error)
      toast.error(t('rightWorkbench.browser.terminateFailed'), { description: message })
    }
  }, [confirmBrowserRemoved, instancesOverride, t])

  const renderBrowserActions = useCallback((instance: BrowserInstanceInfo) => {
    const canUseLiveWindowActions = !instancesOverride
    const targetSessionId = instance.boundSessionId ?? instance.ownerSessionId
    const canOpenSession = !!targetSessionId
    const openSessionLabel = instance.agentControlActive
      ? 'Open Session Using this Window'
      : 'Open Session Which Used this Window'

    return (
      <>
        <StyledDropdownMenuItem
          disabled={!canUseLiveWindowActions}
          onSelect={() => focusBrowserWindow(instance)}
        >
          <Icons.Monitor className="h-3.5 w-3.5" />
          Show Browser Window
        </StyledDropdownMenuItem>

        <StyledDropdownMenuItem
          disabled={!canOpenSession}
          onSelect={() => openSessionUsingWindow(instance)}
        >
          <Icons.PanelRightOpen className="h-3.5 w-3.5" />
          {openSessionLabel}
        </StyledDropdownMenuItem>

        <StyledDropdownMenuSeparator />

        <StyledDropdownMenuItem
          variant="destructive"
          disabled={!canUseLiveWindowActions}
          onSelect={() => terminateBrowserWindow(instance)}
        >
          <Icons.XCircle className="h-3.5 w-3.5" />
          Terminate Browser
        </StyledDropdownMenuItem>
      </>
    )
  }, [instancesOverride, focusBrowserWindow, openSessionUsingWindow, terminateBrowserWindow])

  if (orderedInstances.length === 0) return null

  const visibleBadgeCount = Math.max(1, maxVisibleBadges)
  const visible = orderedInstances.slice(0, visibleBadgeCount)
  const overflow = orderedInstances.slice(visibleBadgeCount)

  return (
    <div className="flex items-center gap-1.5">
      {visible.map((instance) => (
        <DropdownMenu key={instance.id}>
          <DropdownMenuTrigger asChild>
            <BrowserTabBadge
              instance={instance}
              isActive={instance.id === activeInstanceId}
            />
          </DropdownMenuTrigger>
          <StyledDropdownMenuContent align="end" minWidth="min-w-56">
            {renderBrowserActions(instance)}
          </StyledDropdownMenuContent>
        </DropdownMenu>
      ))}

      {overflow.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-[26px] px-1.5 rounded-[6px] text-[11px] text-foreground/50 hover:bg-sidebar-hover hover:text-foreground transition-colors cursor-pointer titlebar-no-drag"
            >
              +{overflow.length}
            </button>
          </DropdownMenuTrigger>
          <StyledDropdownMenuContent align="end" minWidth="min-w-64">
            {overflow.map((instance) => {
              const hostname = getHostname(instance.url)
              const displayLabel = instance.title.trim() || hostname || 'Local File'
              return (
                <DropdownMenuSub key={instance.id}>
                  <StyledDropdownMenuSubTrigger>
                    {instance.isLoading ? (
                      <Spinner className="text-[10px]" />
                    ) : (
                      <Icons.Globe className="h-3.5 w-3.5" />
                    )}
                    <span className="truncate">{displayLabel}</span>
                  </StyledDropdownMenuSubTrigger>
                  <StyledDropdownMenuSubContent minWidth="min-w-56">
                    {renderBrowserActions(instance)}
                  </StyledDropdownMenuSubContent>
                </DropdownMenuSub>
              )
            })}
          </StyledDropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
