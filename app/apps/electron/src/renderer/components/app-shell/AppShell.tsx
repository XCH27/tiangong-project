import * as React from "react"
import { useTranslation, Trans } from "react-i18next"
import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { useAtomValue, useStore } from "jotai"
import { motion, AnimatePresence } from "motion/react"
import {
  Settings,
  ChevronDown,
  MoreHorizontal,
  RotateCw,
  Flag,
  ListFilter,
  Tag,
  Check,
  X,
  Search,
  Plus,
  DatabaseZap,
  Zap,
  Inbox,
  Globe,
  Calendar,
  Layers,
  ListTodo,
  Clock,
  Radio,
  Bot,
  Info,
  MailOpen,
  CheckCheck,
  FolderKanban,
  MessageSquareText,
  Folder,
  Cloud,
} from "lucide-react"
import { formatDistanceToNowStrict, type Locale } from "date-fns"
// SessionStatusIcons no longer used - icons come from dynamic sessionStatuses
import { SourceAvatar } from "@/components/ui/source-avatar"
import { TopBar } from "./TopBar"
import { GlobalSearchDialog } from "./GlobalSearchDialog"
import { SquarePenRounded } from "../icons/SquarePenRounded"
import { McpIcon } from "../icons/McpIcon"
import { cn } from "@/lib/utils"
import { getSessionStatus, getSessionTitle, shortTimeLocale } from "@/utils/session"
import { getStateIcon, getStateIconStyle } from "@/config/session-status-config"
import { Button } from "@/components/ui/button"
import { HeaderIconButton } from "@/components/ui/HeaderIconButton"
import { PanelHeaderCenterButton } from "@/components/ui/PanelHeaderCenterButton"
import { PanelRightRounded } from "../icons/PanelRightRounded"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipTrigger, TooltipContent, DocumentFormattedMarkdownOverlay } from "@craft-agent/ui"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuSub,
  StyledDropdownMenuContent,
  StyledDropdownMenuItem,
  StyledDropdownMenuSeparator,
  StyledDropdownMenuSubTrigger,
  StyledDropdownMenuSubContent,
} from "@/components/ui/styled-dropdown"
import {
  ContextMenu,
  ContextMenuTrigger,
  StyledContextMenuContent,
} from "@/components/ui/styled-context-menu"
import { ContextMenuProvider, DropdownMenuProvider } from "@/components/ui/menu-context"
import { SidebarMenu } from "./SidebarMenu"
import { SidebarSessionActions } from "./SidebarSessionActions"
import { SessionLabelBadges } from "./SessionBadges"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FadingText } from "@/components/ui/fading-text"
import {
  Collapsible,
  CollapsibleTrigger,
  AnimatedCollapsibleContent,
  springTransition as collapsibleSpring,
} from "@/components/ui/collapsible"
import { SessionList, type ChatGroupingMode } from "./SessionList"
import { FabNewChat } from "./FabNewChat"
import { MainContentPanel } from "./MainContentPanel"
import { PanelStackContainer } from "./PanelStackContainer"
import { RightWorkbench } from "./RightWorkbench"
import {
  isRightWorkbenchAvailable,
  rightWorkbenchAtom,
} from "@/atoms/right-workbench"
import { resolveShellLayout } from "./shell-layout"
import { BOARD_VIEW_ENABLED } from "@/lib/product-surface"
import { useDirectoryPicker } from "@/hooks/useDirectoryPicker"
import { ServerDirectoryBrowser } from "@/components/ServerDirectoryBrowser"
import { CompactSessionListFilter } from "./CompactSessionListFilter"
import type { ChatDisplayHandle } from "./ChatDisplay"
import { LeftSidebar } from "./LeftSidebar"
import { useSession } from "@/hooks/useSession"
import { ensureSessionMessagesLoadedAtom } from "@/atoms/sessions"
import { AppShellProvider, type AppShellContextType } from "@/context/AppShellContext"
import { EscapeInterruptProvider, useEscapeInterrupt } from "@/context/EscapeInterruptContext"
import { useTheme } from "@/context/ThemeContext"
import { getResizeGradientStyle } from "@/hooks/useResizeGradient"
import { useAction, useActionLabel } from "@/actions"
import { useFocusZone } from "@/hooks/keyboard"
import { useFocusContext } from "@/context/FocusContext"
import { getLocalizedLabelName } from "@/utils/label-display-name"
import { getWorkspaceDisplayName } from "@/utils/workspace-display-name"
import { useSetAtom } from "jotai"
import { fullscreenOverlayOpenAtom } from "@/atoms/overlay"
import { WorkspaceCreationScreen } from "@/components/workspace"

import type { Session, Workspace, FileAttachment, PermissionRequest, LoadedSource, LoadedSkill, PermissionMode, SourceFilter, AutomationFilter } from "../../../shared/types"
import { sessionMetaMapAtom, sendToWorkspaceAtom, type SessionMeta } from "@/atoms/sessions"
import { sourcesAtom } from "@/atoms/sources"
import { skillsAtom } from "@/atoms/skills"
import { panelStackAtom, panelCountAtom, focusedPanelIdAtom, focusedSessionIdAtom, focusNextPanelAtom, focusPrevPanelAtom, parseSessionIdFromRoute, updateFocusedPanelRouteAtom } from "@/atoms/panel-stack"
import type { ViewRoute } from "../../../shared/routes"
import { getLocalizedStatusLabel, type SessionStatusId, type SessionStatus, statusConfigsToSessionStatuses } from "@/config/session-status-config"
import { useStatuses } from "@/hooks/useStatuses"
import { useLabels } from "@/hooks/useLabels"
import { useViews } from "@/hooks/useViews"
import { useContainerWidth } from "@/hooks/useContainerWidth"
import { LabelIcon } from "@/components/ui/label-icon"
import { filterSessionStatuses as filterLabelMenuStates } from "@/components/ui/label-menu"
import { createLabelMenuItems, filterItems as filterLabelMenuItems, type LabelMenuItem } from "@/components/ui/label-menu-utils"
import { flattenLabels, getDescendantIds, getLabelDisplayName, extractLabelId, findLabelById, sortLabelsForDisplay, matchesLabelFilter } from "@craft-agent/shared/labels"
import type { LabelConfig } from "@craft-agent/shared/labels"
import { resolveEntityColor } from "@craft-agent/shared/colors"
import * as storage from "@/lib/local-storage"
import { toast } from "sonner"
import { navigate, routes } from "@/lib/navigate"
import {
  R1_HIDE_NESTED_PROJECT_FILTER_UI,
  R1_HIDE_NESTED_PROJECT_ID_UI,
} from "@/lib/r1-product-gates"
import { getUnreadSessionIds, isSessionListVisible } from "@/lib/session-list-read"
import {
  useNavigation,
  useNavigationState,
  isSessionsNavigation,
  isSourcesNavigation,
  isSettingsNavigation,
  isSkillsNavigation,
  isAutomationsNavigation,
  isProjectsNavigation,
  type NavigationState,
} from "@/context/NavigationContext"
import type { SettingsSubpage } from "../../../shared/types"
import { SourcesListPanel } from "./SourcesListPanel"
import { SkillsListPanel } from "./SkillsListPanel"
import { AutomationsListPanel } from "../automations/AutomationsListPanel"
import { ProjectsListPanel } from "./ProjectsListPanel"
import { APP_EVENTS, AGENT_EVENTS, type AutomationFilterKind, AUTOMATION_TYPE_TO_FILTER_KIND } from "../automations/types"
import { useAutomations } from "@/hooks/useAutomations"
import { useProjects } from "@/hooks/useProjects"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { PanelHeader } from "./PanelHeader"
import { SendToWorkspaceDialog } from "./SendToWorkspaceDialog"

import { MessagingDialogHost } from "@/components/messaging/MessagingDialogHost"
import { EditPopover, getEditConfig, type EditContextKey } from "@/components/ui/EditPopover"
import SettingsNavigator from "@/pages/settings/SettingsNavigator"
import {
  PANEL_GAP,
  PANEL_EDGE_INSET,
  PANEL_TOP_EDGE_INSET,
  PANEL_RIGHT_EDGE_INSET,
  PANEL_BOTTOM_EDGE_INSET,
  PANEL_SIDEBAR_GAP,
  PANEL_SASH_HALF_HIT_WIDTH,
  PANEL_SASH_HIT_WIDTH,
  PANEL_SASH_LINE_WIDTH,
  PANEL_STACK_VERTICAL_OVERFLOW,
  RIGHT_WORKBENCH_MIN_WIDTH,
  RADIUS_EDGE,
  RADIUS_INNER,
} from "./panel-constants"
import {
  applySidebarToggle,
  resolveSidebarVisibility,
} from "./sidebar-visibility"
import { hasOpenOverlay } from "@/lib/overlay-detection"
import { clearSourceIconCaches } from "@/lib/icon-cache"
import { dispatchFocusInputEvent } from "./input/focus-input-events"

/**
 * AppShellProps - Minimal props interface for AppShell component
 *
 * Data and callbacks come via contextValue (AppShellContextType).
 * Only UI-specific state is passed as separate props.
 *
 * Adding new features:
 * 1. Add to AppShellContextType in context/AppShellContext.tsx
 * 2. Update App.tsx to include in contextValue
 * 3. Use via useAppShellContext() hook in child components
 */
interface AppShellProps {
  /** All data and callbacks - passed directly to AppShellProvider */
  contextValue: AppShellContextType
  /** UI-specific props */
  defaultLayout?: number[]
  defaultCollapsed?: boolean
  menuNewChatTrigger?: number
  /** Focused mode - hides sidebars, shows only the chat content */
  isFocusedMode?: boolean
}

/** Filter mode for tri-state filtering: include shows only matching, exclude hides matching */
import {
  AltExcludeTooltip,
  FilterLabelItems,
  FilterMenuRow,
  FilterModeBadge,
  FilterModeSubMenuItems,
  type FilterMode,
} from './session-filter-menu'



/**
 * AppShell - Main 3-panel layout container
 *
 * Layout: [LeftSidebar 20%] | [NavigatorPanel 32%] | [MainContentPanel 48%]
 *
 * Session Filters:
 * - 'allSessions': Shows all sessions
 * - 'flagged': Shows flagged sessions
 * - 'state': Shows sessions with a specific todo state
 */
export function AppShell(props: AppShellProps) {
  // Wrap with EscapeInterruptProvider so AppShellContent can use useEscapeInterrupt
  return (
    <EscapeInterruptProvider>
      <AppShellContent {...props} />
    </EscapeInterruptProvider>
  )
}

/**
 * AppShellContent - Inner component that contains all the AppShell logic
 * Separated to allow useEscapeInterrupt hook to work (must be inside provider)
 */
function AppShellContent({
  contextValue,
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  menuNewChatTrigger,
  isFocusedMode = false,
}: AppShellProps) {
  // Destructure commonly used values from context
  // Note: sessions is NOT destructured here - we use sessionMetaMapAtom instead
  // to prevent closures from retaining the full messages array
  const {
    workspaces,
    activeWorkspaceId,
    sessionOptions,
    onCreateSession,
    onSelectWorkspace,
    onRefreshWorkspaces,
    onDeleteSession,
    onFlagSession,
    onUnflagSession,
    onArchiveSession,
    onUnarchiveSession,
    onMarkSessionRead,
    onSessionStatusChange,
    onRenameSession,
    onOpenFile,
    onOpenSettings,
    onOpenKeyboardShortcuts,
    onOpenStoredUserPreferences,
    onReset,
    onSendMessage,
    pendingPermissions,
  } = contextValue

  const { t } = useTranslation()

  // Get hotkey labels from centralized action registry
  const newChatHotkey = useActionLabel('app.newChat').hotkey
  const globalSearchHotkey = useActionLabel('app.search').hotkey

  const [isSidebarVisible, setIsSidebarVisible] = React.useState(() => {
    return storage.get(storage.KEYS.sidebarVisible, !defaultCollapsed)
  })
  const [sidebarWidth, setSidebarWidth] = React.useState(() => {
    return storage.get(storage.KEYS.sidebarWidth, 220)
  })
  // Session list width in pixels (min 240, max 480)
  const [sessionListWidth, setSessionListWidth] = React.useState(() => {
    return storage.get(storage.KEYS.sessionListWidth, 300)
  })
  const [rightWorkbenchWidth, setRightWorkbenchWidth] = React.useState(() => {
    return storage.get(storage.KEYS.rightWorkbenchWidth, 420)
  })
  const rightWorkbenchWidthRef = React.useRef(rightWorkbenchWidth)
  // Live mirrors so the resize effect below registers global listeners only when
  // isResizing toggles, not on every width change during a drag.
  const isSidebarVisibleRef = React.useRef(isSidebarVisible)
  isSidebarVisibleRef.current = isSidebarVisible
  const sidebarWidthRef = React.useRef(sidebarWidth)
  sidebarWidthRef.current = sidebarWidth
  const sessionListWidthRef = React.useRef(sessionListWidth)
  sessionListWidthRef.current = sessionListWidth

  // Hides both sidebar and navigator (CMD+. toggle)
  // Seed from either focused window param or persisted preference, then keep it toggleable.
  const [isSidebarAndNavigatorHidden, setIsSidebarAndNavigatorHidden] = React.useState(() => {
    return isFocusedMode || storage.get(storage.KEYS.focusModeEnabled, false)
  })

  // Auto-compact mode: shell width below mobile threshold hides sidebar/navigator
  // and switches to single-panel mode. Works in both webui (narrow viewport) and
  // desktop (narrow window or small screen).
  const shellRef = useRef<HTMLDivElement>(null)
  const shellWidth = useContainerWidth(shellRef)
  const MOBILE_THRESHOLD = 768
  const isAutoCompact = shellWidth > 0 && shellWidth < MOBILE_THRESHOLD

  // What's New overlay
  const [showWhatsNew, setShowWhatsNew] = React.useState(false)
  const [releaseNotesContent, setReleaseNotesContent] = React.useState('')
  const [hasUnseenReleaseNotes, setHasUnseenReleaseNotes] = React.useState(false)

  // Check for unseen release notes on mount
  useEffect(() => {
    window.electronAPI.getLatestReleaseVersion().then((latestVersion) => {
      if (!latestVersion) return
      const lastSeen = storage.get(storage.KEYS.whatsNewLastSeenVersion, '')
      setHasUnseenReleaseNotes(lastSeen !== latestVersion)
    })
  }, [])

  const [isResizing, setIsResizing] = React.useState<'sidebar' | 'session-list' | 'right-workbench' | null>(null)
  const [sidebarHandleY, setSidebarHandleY] = React.useState<number | null>(null)
  const [sessionListHandleY, setSessionListHandleY] = React.useState<number | null>(null)
  const [rightWorkbenchHandleY, setRightWorkbenchHandleY] = React.useState<number | null>(null)
  const resizeHandleRef = React.useRef<HTMLDivElement>(null)
  const sessionListHandleRef = React.useRef<HTMLDivElement>(null)
  const rightWorkbenchHandleRef = React.useRef<HTMLDivElement>(null)
  const [session, setSession] = useSession()
  const { resolvedMode, isDark, setMode } = useTheme()
  const {
    goBack,
    goForward,
    navigateToSource,
    navigateToSession,
    updateRightSidebar,
  } = useNavigation()

  // Double-Esc interrupt feature: first Esc shows warning, second Esc interrupts
  const { handleEscapePress } = useEscapeInterrupt()

  // UNIFIED NAVIGATION STATE - single source of truth from NavigationContext
  // Derived from focused panel's route — all panels are peers
  const navState = useNavigationState()

  const store = useStore()
  const panelStack = useAtomValue(panelStackAtom)
  const panelCount = useAtomValue(panelCountAtom)
  const focusedSessionId = useAtomValue(focusedSessionIdAtom)
  const isRightWorkbenchAvailableForRoute = isRightWorkbenchAvailable(navState)
  const isRightWorkbenchVisible =
    isRightWorkbenchAvailableForRoute
    && navState.rightSidebar?.type === 'workbench'
    && !isAutoCompact
  const rightWorkbenchState = useAtomValue(rightWorkbenchAtom)
  const activeWorkbenchKind = rightWorkbenchState.entries.find(
    (entry) => entry.id === rightWorkbenchState.activeId,
  )?.kind ?? rightWorkbenchState.entries[0]?.kind ?? 'task-board'
  // Ref mirrors the latest fit probe so the toggle handler stays stable while
  // still refusing a no-op open with an explicit localized reason.
  const canFitRightWorkbenchRef = React.useRef(true)

  const handleToggleRightWorkbench = useCallback(() => {
    if (!isRightWorkbenchAvailableForRoute) return
    if (!canFitRightWorkbenchRef.current && !isRightWorkbenchVisible) {
      toast.info(t('rightWorkbench.toggleTooNarrow'))
      return
    }
    updateRightSidebar(isRightWorkbenchVisible ? undefined : { type: 'workbench' })
  }, [isRightWorkbenchAvailableForRoute, isRightWorkbenchVisible, updateRightSidebar, t])

  // Navigate the focused panel to a session.
  // If the session is already open in another panel, focus that panel and still
  // apply the correct home filter (项目 vs 对话) so list/highlight stay consistent.
  const setFocusedPanel = useSetAtom(focusedPanelIdAtom)
  const updateFocusedPanelRoute = useSetAtom(updateFocusedPanelRouteAtom)
  const openSessionInPanel = useCallback((
    sessionId: string,
    home: { workingDirectory?: string | null; workspaceId?: string },
  ) => {
    const route = routes.view.sessionHome({
      id: sessionId,
      workingDirectory: home.workingDirectory,
      workspaceId: home.workspaceId,
    }) as ViewRoute

    const stack = store.get(panelStackAtom)
    for (const entry of stack) {
      if (parseSessionIdFromRoute(entry.route) === sessionId) {
        setFocusedPanel(entry.id)
        // Correct filter even when focusing an already-open panel
        updateFocusedPanelRoute(route)
        return
      }
    }
    navigate(route)
  }, [store, setFocusedPanel, updateFocusedPanelRoute, navigate])

  const navigateToSessionInPanel = useCallback((sessionId: string) => {
    const meta = store.get(sessionMetaMapAtom).get(sessionId)
    openSessionInPanel(sessionId, {
      workingDirectory: meta?.workingDirectory,
      workspaceId: meta?.workspaceId,
    })
  }, [store, openSessionInPanel])

  const sessionsContext = React.useMemo(() => {
    if (isSessionsNavigation(navState)) {
      return {
        filter: navState.filter,
        sessionId: navState.details?.sessionId ?? null,
      }
    }
    return null
  }, [navState])

  const sessionFilter = sessionsContext?.filter ?? null

  // Session navigation now lives in the global left sidebar. Keep the middle navigator
  // only for domains that still require a dedicated list (sources, skills, settings,
  // automations, and project detail routes). This prevents a hidden second session list
  // from retaining width, focus targets, filters, and menu state.
  const isBoardView =
    BOARD_VIEW_ENABLED && isSessionsNavigation(navState) && navState.viewMode === 'board'
  const isNavigatorPanelNeeded = !isBoardView && !isSessionsNavigation(navState)

  // Single production layout authority: sidebar projection + session-pane
  // chat/workbench split (resolveSessionPaneLayout) + navigator yield.
  const shellLayout = resolveShellLayout({
    shellWidth,
    compact: isAutoCompact,
    focusMode: isSidebarAndNavigatorHidden,
    sidebarStoredVisible: isSidebarVisible,
    sidebarStoredWidth: sidebarWidth,
    navigatorNeeded: isNavigatorPanelNeeded,
    navigatorStoredWidth: sessionListWidth,
    workbenchRequested: isRightWorkbenchVisible,
    workbenchStoredWidth: rightWorkbenchWidth,
    workbenchKind: activeWorkbenchKind,
  })
  const sidebarProjection = shellLayout.sidebar
  const layoutSidebarWidth = shellLayout.sidebarWidth
  const layoutNavigatorWidth = shellLayout.navigatorWidth
  const layoutWorkbenchWidth = shellLayout.workbenchWidth
  const isRightWorkbenchRendered =
    isRightWorkbenchVisible && shellLayout.workbenchVisible && layoutWorkbenchWidth > 0

  // Probe with workbench requested so the toggle can refuse honestly when
  // session-pane would block by width (same production resolver).
  const workbenchFitProbe = resolveShellLayout({
    shellWidth,
    compact: isAutoCompact,
    focusMode: isSidebarAndNavigatorHidden,
    sidebarStoredVisible: isSidebarVisible,
    sidebarStoredWidth: sidebarWidth,
    navigatorNeeded: isNavigatorPanelNeeded,
    navigatorStoredWidth: sessionListWidth,
    workbenchRequested: true,
    workbenchStoredWidth: rightWorkbenchWidth,
    workbenchKind: activeWorkbenchKind,
  })
  const canFitRightWorkbench =
    isRightWorkbenchAvailableForRoute
    && !isAutoCompact
    && (
      shellWidth <= 0
      || (workbenchFitProbe.workbenchVisible && !workbenchFitProbe.workbenchBlockedByWidth)
    )
  canFitRightWorkbenchRef.current = canFitRightWorkbench
  const effectiveSidebarAndNavigatorHidden =
    !sidebarProjection.isRendered
    && (
      isSidebarAndNavigatorHidden
      || isAutoCompact
      || layoutNavigatorWidth === 0
    )

  // Derive source filter from navigation state (only when in sources navigator)
  const sourceFilter: SourceFilter | null = isSourcesNavigation(navState) ? navState.filter ?? null : null

  // Derive automation filter from navigation state (only when in automations navigator)
  const automationFilter: AutomationFilter | null = isAutomationsNavigation(navState) ? navState.filter ?? null : null

  // Per-view filter storage: each session list view (allSessions, flagged, state:X, label:X, view:X)
  // has its own independent set of status and label filters.
  // Each filter entry stores a mode ('include' or 'exclude') for tri-state filtering.
  type FilterEntry = Record<string, FilterMode> // id → mode
  type ViewFiltersMap = Record<string, { statuses: FilterEntry, labels: FilterEntry, projects?: FilterEntry, groupingMode?: ChatGroupingMode }>

  // Compute a stable key for the current chat filter view
  const sessionFilterKey = useMemo(() => {
    if (!sessionFilter) return null
    switch (sessionFilter.kind) {
      case 'allSessions': return 'allSessions'
      case 'projectSessions':
        return sessionFilter.workspaceId
          ? `projectSessions:${sessionFilter.workspaceId}`
          : 'projectSessions'
      case 'conversations': return 'conversations'
      case 'flagged': return 'flagged'
      case 'archived': return 'archived'
      case 'state': return `state:${sessionFilter.stateId}`
      case 'label': return `label:${sessionFilter.labelId}`
      case 'view': return `view:${sessionFilter.viewId}`
      default: return 'projectSessions'
    }
  }, [sessionFilter])

  const [viewFiltersMap, setViewFiltersMap] = React.useState<ViewFiltersMap>(() => {
    const saved = storage.get<ViewFiltersMap>(storage.KEYS.viewFilters, {})
    // Backward compat: migrate old format (arrays) into new format (Record<string, FilterMode>)
    if (saved.allSessions && Array.isArray((saved.allSessions as any).statuses)) {
      // Old format: { statuses: string[], labels: string[] } → new: { statuses: Record, labels: Record }
      for (const key of Object.keys(saved)) {
        const entry = saved[key] as any
        if (Array.isArray(entry.statuses)) {
          const newStatuses: FilterEntry = {}
          for (const id of entry.statuses) newStatuses[id] = 'include'
          const newLabels: FilterEntry = {}
          for (const id of entry.labels) newLabels[id] = 'include'
          saved[key] = { statuses: newStatuses, labels: newLabels }
        }
      }
    }
    // One-time key migration: the default sessions home moved from allSessions to
    // projectSessions. Seed projectSessions from a saved allSessions entry; new
    // writes only use projectSessions.
    if (!saved.projectSessions && saved.allSessions) {
      saved.projectSessions = saved.allSessions
      delete saved.allSessions
    }
    // Also migrate legacy global filters if no projectSessions entry exists
    if (!saved.projectSessions) {
      const oldStatuses = storage.get<SessionStatusId[]>(storage.KEYS.listFilter, [])
      const oldLabels = storage.get<string[]>(storage.KEYS.labelFilter, [])
      if (oldStatuses.length > 0 || oldLabels.length > 0) {
        const statuses: FilterEntry = {}
        for (const id of oldStatuses) statuses[id] = 'include'
        const labels: FilterEntry = {}
        for (const id of oldLabels) labels[id] = 'include'
        saved.projectSessions = { statuses, labels }
      }
    }
    return saved
  })

  // Derive current view's status filter as a Map<SessionStatusId, FilterMode>
  const listFilter = useMemo(() => {
    if (!sessionFilterKey) return new Map<SessionStatusId, FilterMode>()
    const entry = viewFiltersMap[sessionFilterKey]?.statuses ?? {}
    return new Map<SessionStatusId, FilterMode>(Object.entries(entry) as [SessionStatusId, FilterMode][])
  }, [viewFiltersMap, sessionFilterKey])

  // Derive current view's label filter as a Map<string, FilterMode>
  const labelFilter = useMemo(() => {
    if (!sessionFilterKey) return new Map<string, FilterMode>()
    const entry = viewFiltersMap[sessionFilterKey]?.labels ?? {}
    return new Map<string, FilterMode>(Object.entries(entry) as [string, FilterMode][])
  }, [viewFiltersMap, sessionFilterKey])

  // Derive current view's project filter as a Map<projectId, FilterMode>
  const projectFilter = useMemo(() => {
    if (R1_HIDE_NESTED_PROJECT_FILTER_UI || !sessionFilterKey) {
      return new Map<string, FilterMode>()
    }
    const entry = viewFiltersMap[sessionFilterKey]?.projects ?? {}
    return new Map<string, FilterMode>(Object.entries(entry) as [string, FilterMode][])
  }, [viewFiltersMap, sessionFilterKey])

  // Setter for status filter — updates only the current view's entry in the map
  const setListFilter = useCallback((updater: Map<SessionStatusId, FilterMode> | ((prev: Map<SessionStatusId, FilterMode>) => Map<SessionStatusId, FilterMode>)) => {
    setViewFiltersMap(prev => {
      if (!sessionFilterKey) return prev
      const current = new Map<SessionStatusId, FilterMode>(Object.entries(prev[sessionFilterKey]?.statuses ?? {}) as [SessionStatusId, FilterMode][])
      const next = typeof updater === 'function' ? updater(current) : updater
      const existing = prev[sessionFilterKey]
      return {
        ...prev,
        [sessionFilterKey]: {
          statuses: Object.fromEntries(next),
          labels: existing?.labels ?? {},
          projects: existing?.projects ?? {},
          groupingMode: existing?.groupingMode,
        }
      }
    })
  }, [sessionFilterKey])

  // Setter for label filter — updates only the current view's entry in the map
  const setLabelFilter = useCallback((updater: Map<string, FilterMode> | ((prev: Map<string, FilterMode>) => Map<string, FilterMode>)) => {
    setViewFiltersMap(prev => {
      if (!sessionFilterKey) return prev
      const current = new Map<string, FilterMode>(Object.entries(prev[sessionFilterKey]?.labels ?? {}) as [string, FilterMode][])
      const next = typeof updater === 'function' ? updater(current) : updater
      const existing = prev[sessionFilterKey]
      return {
        ...prev,
        [sessionFilterKey]: {
          statuses: existing?.statuses ?? {},
          labels: Object.fromEntries(next),
          projects: existing?.projects ?? {},
          groupingMode: existing?.groupingMode,
        }
      }
    })
  }, [sessionFilterKey])

  // Setter for project filter — updates only the current view's entry in the map
  const setProjectFilter = useCallback((updater: Map<string, FilterMode> | ((prev: Map<string, FilterMode>) => Map<string, FilterMode>)) => {
    setViewFiltersMap(prev => {
      if (!sessionFilterKey) return prev
      const current = new Map<string, FilterMode>(Object.entries(prev[sessionFilterKey]?.projects ?? {}) as [string, FilterMode][])
      const next = typeof updater === 'function' ? updater(current) : updater
      const existing = prev[sessionFilterKey]
      return {
        ...prev,
        [sessionFilterKey]: {
          statuses: existing?.statuses ?? {},
          labels: existing?.labels ?? {},
          projects: Object.fromEntries(next),
          groupingMode: existing?.groupingMode,
        }
      }
    })
  }, [sessionFilterKey])

  // Jump to folder-bound sessions for a project. Prefer workspaceId (R1 clause 3: folder = Project);
  // nested projectId chips remain only as a secondary list filter when still present.
  const handleJumpToProjectSessions = useCallback((projectId: string) => {
    const asWorkspace = workspaces.find(w => w.id === projectId)
    if (asWorkspace) {
      navigate(routes.view.projectSessions(undefined, asWorkspace.id))
      return
    }
    // Legacy nested project id: open 项目 overview; optional chip filter for residual projectId.
    setViewFiltersMap(prev => {
      const key = 'projectSessions'
      const existing = prev[key]
      return {
        ...prev,
        [key]: {
          statuses: existing?.statuses ?? {},
          labels: existing?.labels ?? {},
          projects: { [projectId]: 'include' },
          groupingMode: existing?.groupingMode ?? 'project',
        },
      }
    })
    navigate(routes.view.projectSessions())
  }, [workspaces, navigate])

  // Jump to a task session under the correct R1 home (项目 vs 对话), with optional label chip.
  const handleJumpToTaskSessions = useCallback(
    (sessionId: string, scope: { labelId: string; projectId?: string; session?: { workingDirectory?: string; workspaceId?: string } }) => {
      const meta = store.get(sessionMetaMapAtom).get(sessionId)
      // Right after task creation the meta map may not have the session yet; fall back
      // to the fields the creator passed along so the home/filterKey don't misfire.
      const workingDirectory = meta?.workingDirectory ?? scope.session?.workingDirectory
      const workspaceId = meta?.workspaceId ?? scope.session?.workspaceId ?? scope.projectId
      if (scope.labelId) {
        const filterKey = workingDirectory
          ? (workspaceId ? `projectSessions:${workspaceId}` : 'projectSessions')
          : 'conversations'
        setViewFiltersMap(prev => {
          const existing = prev[filterKey]
          return {
            ...prev,
            [filterKey]: {
              statuses: existing?.statuses ?? {},
              labels: { [scope.labelId]: 'include' },
              projects: scope.projectId ? { [scope.projectId]: 'include' } : (existing?.projects ?? {}),
              groupingMode: existing?.groupingMode,
            },
          }
        })
      }
      openSessionInPanel(sessionId, {
        workingDirectory,
        workspaceId,
      })
    },
    [store, openSessionInPanel]
  )

  // Search state for session list
  const [searchActive, setSearchActive] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [globalSearchOpen, setGlobalSearchOpen] = React.useState(false)

  // Grouping mode for chat list: per-view (stored in viewFiltersMap), forced to 'date' for state sub-views.
  // R1 clause 1: unscoped 项目 overview defaults to group-by-project (workspace buckets). Single-project
  // focus and 对话 stay date-grouped so the list shape does not thrash on every row click.
  const isStateSubView = sessionFilter?.kind === 'state'
  const isProjectOverview =
    sessionFilter?.kind === 'projectSessions' && !sessionFilter.workspaceId

  const chatGroupingMode: ChatGroupingMode = isStateSubView
    ? 'date'
    : (viewFiltersMap[sessionFilterKey ?? '']?.groupingMode
      ?? (isProjectOverview ? 'project' : 'date'))

  const setChatGroupingMode = useCallback((mode: ChatGroupingMode) => {
    setViewFiltersMap(prev => {
      if (!sessionFilterKey) return prev
      const existing = prev[sessionFilterKey] ?? { statuses: {}, labels: {} }
      return {
        ...prev,
        [sessionFilterKey]: { ...existing, groupingMode: mode }
      }
    })
  }, [sessionFilterKey])

  // Ref for ChatDisplay navigation (exposed via forwardRef)
  const chatDisplayRef = React.useRef<ChatDisplayHandle>(null)
  // Track match count and index from ChatDisplay (for SessionList navigation UI)
  const [chatMatchInfo, setChatMatchInfo] = React.useState<{ sessionId: string | null; count: number; index: number; isHighlighting?: boolean }>({ sessionId: null, count: 0, index: 0 })

  // Callback for immediate match info updates from ChatDisplay
  // Memo guard prevents render feedback loops from identical updates
  const handleChatMatchInfoChange = React.useCallback((info: { sessionId: string | null; count: number; index: number; isHighlighting: boolean }) => {
    setChatMatchInfo(prev => {
      if (prev.sessionId === info.sessionId && prev.count === info.count && prev.index === info.index && prev.isHighlighting === info.isHighlighting) {
        return prev
      }
      return info
    })
  }, [])

  // Reset match info when search is deactivated
  React.useEffect(() => {
    if (!searchActive || !searchQuery) {
      setChatMatchInfo({ sessionId: null, count: 0, index: 0 })
    }
  }, [searchActive, searchQuery])

  // Filter dropdown: inline search query for filtering statuses/labels in a flat list.
  // When empty, the dropdown shows hierarchical submenus. When typing, shows a flat filtered list.
  const [filterDropdownQuery, setFilterDropdownQuery] = React.useState('')
  const [filterAltHeld, setFilterAltHeld] = React.useState(false)

  // Reset search only when navigator or filter changes (not when selecting sessions)
  const navFilterKey = React.useMemo(() => {
    if (isSessionsNavigation(navState)) {
      const filter = navState.filter
      return `chats:${filter.kind}:${filter.kind === 'state' ? filter.stateId : ''}`
    }
    return navState.navigator
  }, [navState])

  React.useEffect(() => {
    setSearchActive(false)
    setSearchQuery('')
  }, [navFilterKey])

  useAction('app.search', () => setGlobalSearchOpen(true))
  useAction('session.search', () => setSearchActive(true))

  // Unified sidebar keyboard navigation state
  // Load expanded folders from localStorage (default: all collapsed)
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(() => {
    const saved = storage.get<string[]>(storage.KEYS.expandedFolders, [])
    return new Set(saved)
  })
  const [focusedSidebarItemId, setFocusedSidebarItemId] = React.useState<string | null>(null)
  const sidebarItemRefs = React.useRef<Map<string, HTMLElement>>(new Map())
  // Track which expandable sidebar items are collapsed
  // Labels are collapsed by default; user preference is persisted once toggled
  const [collapsedItems, setCollapsedItems] = React.useState<Set<string>>(() => {
    const saved = storage.get<string[] | null>(storage.KEYS.collapsedSidebarItems, null)
    if (saved !== null) return new Set(saved)
    return new Set(['nav:labels'])
  })
  const isExpanded = React.useCallback((id: string) => !collapsedItems.has(id), [collapsedItems])
  const toggleExpanded = React.useCallback((id: string) => {
    setCollapsedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  // Sources state (workspace-scoped)
  const [sources, setSources] = React.useState<LoadedSource[]>([])
  // Sync sources to atom for NavigationContext auto-selection
  const setSourcesAtom = useSetAtom(sourcesAtom)
  React.useEffect(() => {
    setSourcesAtom(sources)
  }, [sources, setSourcesAtom])

  // Skills state (workspace-scoped)
  const [skills, setSkills] = React.useState<LoadedSkill[]>([])
  // Sync skills to atom for NavigationContext auto-selection
  const setSkillsAtom = useSetAtom(skillsAtom)
  React.useEffect(() => {
    setSkillsAtom(skills)
  }, [skills, setSkillsAtom])
  // Automations — state, handlers, loading, subscriptions
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)

  // Send to Workspace dialog state (driven by sendToWorkspaceAtom set from SessionMenu/BatchSessionMenu)
  const sendToWorkspaceIds = useAtomValue(sendToWorkspaceAtom)
  const setSendToWorkspaceIds = useSetAtom(sendToWorkspaceAtom)
  const handleTransferComplete = useCallback((targetWorkspaceId: string, _newSessionIds: string[]) => {
    onSelectWorkspace(targetWorkspaceId)
  }, [onSelectWorkspace])
  const {
    automations, automationLoadError, retryLoadAutomations, automationTestResults,
    automationPendingDelete, pendingDeleteAutomation, setAutomationPendingDelete,
    handleTestAutomation, handleToggleAutomation, handleDuplicateAutomation, handleDeleteAutomation, confirmDeleteAutomation,
    getAutomationHistory, handleReplayAutomation,
  } = useAutomations(activeWorkspaceId)

  const { projects } = useProjects(activeWorkspaceId)
  const projectMenuOptions = useMemo(
    () => projects.map(p => ({ id: p.config.id, slug: p.config.slug, name: p.config.name, color: p.config.color })),
    [projects],
  )
  const handleSessionProjectChange = useCallback(async (sessionId: string, projectId: string | null) => {
    try {
      await window.electronAPI.sessionCommand(sessionId, { type: 'setProjectId', projectId })
    } catch (err) {
      console.error('[AppShell] Failed to update session project:', err)
      toast.error(t('toast.failedToUpdateProject'))
    }
  }, [t])

  // Whether local MCP servers are enabled (affects stdio source status)
  const [localMcpEnabled, setLocalMcpEnabled] = React.useState(true)

  // Load workspace runtime prefs (MCP only — work-mode cycle order is fixed).
  React.useEffect(() => {
    if (!activeWorkspaceId) return
    window.electronAPI.getWorkspaceSettings(activeWorkspaceId).then((settings) => {
      if (settings) {
        setLocalMcpEnabled(settings.localMcpEnabled ?? true)
      }
    }).catch((err) => {
      console.error('[Chat] Failed to load workspace settings:', err)
    })
  }, [activeWorkspaceId])

  // Reset UI state when workspace changes
  // This prevents stale search queries, focused items, and filter state from persisting
  const previousWorkspaceRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!activeWorkspaceId) return

    const previousWorkspaceId = previousWorkspaceRef.current

    // Clear transient UI state only on workspace SWITCH (not initial mount)
    if (previousWorkspaceId !== null && previousWorkspaceId !== activeWorkspaceId) {
      // Clear search state
      setSearchActive(false)
      setSearchQuery('')

      // Clear filter dropdown state
      setFilterDropdownQuery('')
      setFilterDropdownSelectedIdx(0)

      // Clear focused sidebar item
      setFocusedSidebarItemId(null)
    }

    // Load workspace-scoped state on BOTH initial mount AND workspace switch
    // This fixes CMD+R losing filters - previously only ran on workspace switch
    if (previousWorkspaceId !== activeWorkspaceId) {
      const newViewFilters = storage.get<ViewFiltersMap>(storage.KEYS.viewFilters, {}, activeWorkspaceId)
      setViewFiltersMap(newViewFilters)

      const newExpandedFolders = storage.get<string[]>(storage.KEYS.expandedFolders, [], activeWorkspaceId)
      setExpandedFolders(new Set(newExpandedFolders))

      const newCollapsedItems = storage.get<string[] | null>(storage.KEYS.collapsedSidebarItems, null, activeWorkspaceId)
      setCollapsedItems(newCollapsedItems !== null ? new Set(newCollapsedItems) : new Set(['nav:labels']))
    }

    previousWorkspaceRef.current = activeWorkspaceId
  }, [activeWorkspaceId])

  // Load sources from backend on mount
  React.useEffect(() => {
    if (!activeWorkspaceId) return
    window.electronAPI.getSources(activeWorkspaceId).then((loaded) => {
      setSources(loaded || [])
    }).catch(err => {
      console.error('[Chat] Failed to load sources:', err)
    })
  }, [activeWorkspaceId])

  // Subscribe to live source updates (when sources are added/removed dynamically)
  React.useEffect(() => {
    const cleanup = window.electronAPI.onSourcesChanged((workspaceId, updatedSources) => {
      if (workspaceId !== activeWorkspaceId) return
      // Clear icon cache so updated source icons are re-fetched on render
      clearSourceIconCaches()
      setSources(updatedSources || [])
    })
    return cleanup
  }, [activeWorkspaceId])

  // Handle session source selection changes
  const handleSessionSourcesChange = React.useCallback(async (sessionId: string, sourceSlugs: string[]) => {
    try {
      await window.electronAPI.sessionCommand(sessionId, { type: 'setSources', sourceSlugs })
      // Session will emit a 'sources_changed' event that updates the session state
    } catch (err) {
      console.error('[Chat] Failed to set session sources:', err)
    }
  }, [])

  // Handle session label changes (add/remove via # menu or badge X)
  const handleSessionLabelsChange = React.useCallback(async (sessionId: string, labels: string[]) => {
    try {
      await window.electronAPI.sessionCommand(sessionId, { type: 'setLabels', labels })
      // Session will emit a 'labels_changed' event that updates the session state
    } catch (err) {
      console.error('[Chat] Failed to set session labels:', err)
    }
  }, [])


  // Load dynamic statuses from workspace config
  const { statuses: statusConfigs, isLoading: isLoadingStatuses } = useStatuses(activeWorkspace?.id || null)
  const [sessionStatuses, setSessionStatuses] = React.useState<SessionStatus[]>([])

  // Convert StatusConfig to SessionStatus with resolved icons
  React.useEffect(() => {
    if (!activeWorkspace?.id || statusConfigs.length === 0) {
      setSessionStatuses([])
      return
    }

    setSessionStatuses(statusConfigsToSessionStatuses(statusConfigs, activeWorkspace.id, isDark))
  }, [statusConfigs, activeWorkspace?.id, isDark])

  const effectiveSessionStatuses = sessionStatuses

  // Load labels from workspace config
  const { labels: labelConfigs } = useLabels(activeWorkspace?.id || null)
  const displayLabelConfigs = useMemo(() => sortLabelsForDisplay(labelConfigs), [labelConfigs])
  const flatDisplayLabelConfigs = useMemo(
    () => flattenLabels(displayLabelConfigs),
    [displayLabelConfigs],
  )

  // Views: compiled once on config load, evaluated per session in list/chat
  const { evaluateSession: evaluateViews, viewConfigs } = useViews(activeWorkspace?.id || null)

  // Build hierarchical label tree from the display-sorted label config structure

  // Build flat LabelMenuItem[] from hierarchical labels for the filter dropdown's search mode.
  // Uses the same structure as the # inline menu so the two search surfaces stay aligned.
  const flatLabelMenuItems = useMemo(
    (): LabelMenuItem[] => createLabelMenuItems(displayLabelConfigs, [], label => getLocalizedLabelName(t, label)),
    [displayLabelConfigs, t],
  )

  // Filter dropdown keyboard navigation: tracks highlighted item index in flat search mode.
  // Unified index: [0..matchedStates-1] = statuses, [matchedStates..total-1] = labels.
  const [filterDropdownSelectedIdx, setFilterDropdownSelectedIdx] = React.useState(0)
  const filterDropdownListRef = React.useRef<HTMLDivElement>(null)
  const filterDropdownInputRef = React.useRef<HTMLInputElement>(null)

  // Compute filtered results for the dropdown's search mode (memoized for use in both
  // the keyboard handler and the JSX render).
  const filterDropdownResults = useMemo(() => {
    if (!filterDropdownQuery.trim()) return { states: [] as SessionStatus[], labels: [] as LabelMenuItem[] }
    return {
      states: filterLabelMenuStates(effectiveSessionStatuses, filterDropdownQuery),
      labels: filterLabelMenuItems(flatLabelMenuItems, filterDropdownQuery),
    }
  }, [filterDropdownQuery, effectiveSessionStatuses, flatLabelMenuItems])

  // Reset selected index when query changes
  React.useEffect(() => {
    setFilterDropdownSelectedIdx(0)
  }, [filterDropdownQuery])

  // Scroll keyboard-highlighted item into view
  React.useEffect(() => {
    if (!filterDropdownListRef.current) return
    const el = filterDropdownListRef.current.querySelector('[data-filter-selected="true"]')
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [filterDropdownSelectedIdx])

  // Ensure session messages are loaded when selected
  const ensureMessagesLoaded = useSetAtom(ensureSessionMessagesLoadedAtom)

  // Handle selecting a source from the list (preserves current filter type)
  const handleSourceSelect = React.useCallback((source: LoadedSource) => {
    if (!activeWorkspaceId) return
    navigateToSource(source.config.slug)
  }, [activeWorkspaceId, navigateToSource])

  // Handle selecting a skill from the list
  const handleSkillSelect = React.useCallback((skill: LoadedSkill) => {
    if (!activeWorkspaceId) return
    navigate(routes.view.skills(skill.slug))
  }, [activeWorkspaceId, navigate])

  // Handle selecting an automation from the list
  const handleAutomationSelect = React.useCallback((automationId: string) => {
    // Preserve current automation filter when selecting an automation
    const type = isAutomationsNavigation(navState) ? navState.filter?.automationType : undefined
    navigate(routes.view.automations({ automationId, type }))
  }, [navState, navigate])

  // Focus zone management
  const { focusZone, focusNextZone, focusPreviousZone } = useFocusContext()

  // Register focus zones
  const { zoneRef: sidebarRef, isFocused: sidebarFocused } = useFocusZone({ zoneId: 'sidebar' })

  // Global keyboard shortcuts using centralized action registry
  // Actions are defined in @/actions/definitions.ts

  // Zone navigation - explicit keyboard intent, always move DOM focus
  useAction('nav.focusSidebar', () => focusZone('sidebar', { intent: 'keyboard' }))
  useAction('nav.focusNavigator', () => focusZone('navigator', { intent: 'keyboard' }))
  useAction('nav.focusChat', () => focusZone('chat', { intent: 'keyboard' }))

  // Tab navigation between zones
  useAction('nav.nextZone', () => {
    focusNextZone()
  }, { enabled: () => !document.querySelector('[role="dialog"]') })

  const effectiveSessionId = focusedSessionId ?? session.selected

  // Focus chat input for the target session only (multi-panel safe).
  const focusChatInputForSession = useCallback((targetSessionId?: string | null) => {
    if (!targetSessionId) return
    dispatchFocusInputEvent({ sessionId: targetSessionId })
  }, [])

  const handleToggleSidebar = useCallback(() => {
    const next = applySidebarToggle({
      storedVisible: isSidebarVisibleRef.current,
      storedWidth: sidebarWidthRef.current,
      focusMode: isSidebarAndNavigatorHidden,
      autoCompact: isAutoCompact,
    })
    setIsSidebarVisible(next.storedVisible)
    setIsSidebarAndNavigatorHidden(next.focusMode)
  }, [isSidebarAndNavigatorHidden, isAutoCompact])

  // Sidebar toggle (CMD+B)
  useAction('view.toggleSidebar', handleToggleSidebar)

  // Focus mode toggle (CMD+.) - hides both sidebars
  useAction('view.toggleFocusMode', () => setIsSidebarAndNavigatorHidden(v => !v))

  // Panel focus navigation (CMD+SHIFT+[ / ])
  const focusNextPanel = useSetAtom(focusNextPanelAtom)
  const focusPrevPanel = useSetAtom(focusPrevPanelAtom)
  useAction('panel.focusNext', focusNextPanel, { enabled: () => panelCount > 1 })
  useAction('panel.focusPrev', focusPrevPanel, { enabled: () => panelCount > 1 })

  // New chat
  useAction('app.newChat', () => handleNewChat())
  useAction('app.newChatInPanel', () => handleNewChat(true))

  // Settings
  useAction('app.settings', onOpenSettings)

  // Keyboard shortcuts
  useAction('app.keyboardShortcuts', onOpenKeyboardShortcuts)

  // New window
  useAction('app.newWindow', () => window.electronAPI.menuNewWindow())

  // Quit (note: also handled by native menu on macOS)
  useAction('app.quit', () => window.electronAPI.menuQuit())

  // History navigation
  useAction('nav.goBack', goBack)
  useAction('nav.goForward', goForward)

  // History navigation (arrow key alternatives)
  useAction('nav.goBackAlt', goBack)
  useAction('nav.goForwardAlt', goForward)

  // Search match navigation (CMD+G next, CMD+SHIFT+G prev)
  useAction('chat.nextSearchMatch', () => chatDisplayRef.current?.goToNextMatch(), {
    enabled: () => searchActive && (chatMatchInfo.count ?? 0) > 0
  })
  useAction('chat.prevSearchMatch', () => chatDisplayRef.current?.goToPrevMatch(), {
    enabled: () => searchActive && (chatMatchInfo.count ?? 0) > 0
  })

  // ESC to stop processing - requires double-press within 1 second
  // First press shows warning overlay, second press interrupts
  // In multi-panel, targets the focused panel's session
  useAction('chat.stopProcessing', () => {
    if (effectiveSessionId) {
      const meta = sessionMetaMap.get(effectiveSessionId)
      if (meta?.isProcessing) {
        // handleEscapePress returns true on second press (within timeout)
        const shouldInterrupt = handleEscapePress()
        if (shouldInterrupt) {
          window.electronAPI.cancelProcessing(effectiveSessionId, false).catch(err => {
            console.error('[AppShell] Failed to cancel processing:', err)
          })
        }
      }
    }
  }, {
    // Only active when no overlay is open and session is processing
    // Overlays (dialogs, menus, popovers, etc.) should handle their own Escape
    enabled: () => {
      if (hasOpenOverlay()) return false
      if (!effectiveSessionId) return false
      const meta = sessionMetaMap.get(effectiveSessionId)
      return meta?.isProcessing ?? false
    }
  }, [effectiveSessionId, handleEscapePress])

  // Theme toggle (CMD+SHIFT+A)
  useAction('app.toggleTheme', () => setMode(resolvedMode === 'dark' ? 'light' : 'dark'))

  // Global paste listener for file attachments
  // Fires when Cmd+V is pressed anywhere in the app (not just textarea)
  React.useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Skip if a dialog or menu is open
      if (document.querySelector('[role="dialog"], [role="menu"]')) {
        return
      }

      // Skip if there are no files in the clipboard
      const files = e.clipboardData?.files
      if (!files || files.length === 0) return

      // Skip if the active element is an input/textarea/contenteditable (let it handle paste directly)
      const activeElement = document.activeElement as HTMLElement | null
      if (
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.tagName === 'INPUT' ||
        activeElement?.isContentEditable
      ) {
        return
      }

      // Prevent default paste behavior
      e.preventDefault()

      // Dispatch custom event for FreeFormInput to handle (target focused session only)
      const filesArray = Array.from(files)
      const targetSessionId = focusedSessionId ?? session.selected
      if (!targetSessionId) return
      window.dispatchEvent(new CustomEvent('craft:paste-files', {
        detail: { files: filesArray, sessionId: targetSessionId }
      }))
    }

    document.addEventListener('paste', handleGlobalPaste)
    return () => document.removeEventListener('paste', handleGlobalPaste)
  }, [focusedSessionId, session.selected])

  // Resize effect for sidebar, session list, browser host lane, and metadata right sidebar.
  React.useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing === 'sidebar') {
        const newWidth = Math.min(Math.max(e.clientX, 180), 320)
        setSidebarWidth(newWidth)
        if (resizeHandleRef.current) {
          const rect = resizeHandleRef.current.getBoundingClientRect()
          setSidebarHandleY(e.clientY - rect.top)
        }
      } else if (isResizing === 'session-list') {
        // Resize offset tracks the projected (rendered) sidebar, never a hidden
        // preference that would shift the sash by a phantom width.
        const offset = resolveSidebarVisibility({
          storedVisible: isSidebarVisibleRef.current,
          storedWidth: sidebarWidthRef.current,
          focusMode: isSidebarAndNavigatorHidden,
          autoCompact: isAutoCompact,
        }).resizeOffset
        const newWidth = Math.min(Math.max(e.clientX - offset, 240), 480)
        setSessionListWidth(newWidth)
        if (sessionListHandleRef.current) {
          const rect = sessionListHandleRef.current.getBoundingClientRect()
          setSessionListHandleY(e.clientY - rect.top)
        }
      } else if (isResizing === 'right-workbench') {
        const newWidth = Math.min(
          Math.max(window.innerWidth - e.clientX, RIGHT_WORKBENCH_MIN_WIDTH),
          Math.min(640, window.innerWidth * 0.55),
        )
        rightWorkbenchWidthRef.current = newWidth
        setRightWorkbenchWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      if (isResizing === 'sidebar') {
        storage.set(storage.KEYS.sidebarWidth, sidebarWidthRef.current)
        setSidebarHandleY(null)
      } else if (isResizing === 'session-list') {
        storage.set(storage.KEYS.sessionListWidth, sessionListWidthRef.current)
        setSessionListHandleY(null)
      } else if (isResizing === 'right-workbench') {
        storage.set(storage.KEYS.rightWorkbenchWidth, rightWorkbenchWidthRef.current)
      }
      setIsResizing(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, isSidebarAndNavigatorHidden, isAutoCompact])

  // Spring transition config - shared between sidebar and header
  // Critical damping (no bounce): damping = 2 * sqrt(stiffness * mass)
  const springTransition = {
    type: "spring" as const,
    stiffness: 600,
    damping: 49,
  }

  // Use session metadata from Jotai atom (lightweight, no messages)
  // This prevents closures from retaining full message arrays
  const sessionMetaMap = useAtomValue(sessionMetaMapAtom)
  const setSessionMetaMap = useSetAtom(sessionMetaMapAtom)

  const hasPendingPrompt = React.useCallback((sessionId: string) => {
    return (pendingPermissions.get(sessionId)?.length ?? 0) > 0
  }, [pendingPermissions])

  // Workspace-level unread indicators (needed for workspace selectors across all workspaces)
  const [workspaceUnreadMap, setWorkspaceUnreadMap] = useState<Record<string, boolean>>({})

  // Skills load — aligned with Craft v0.10.5 AppShell:
  // getSkills(workspaceId, workingDirectory?) where workingDirectory is the open
  // session's folder (tier 3: {wd}/.agents/skills). Global + workspace tiers always load.
  // When no session is open, fall back to active workspace rootPath so folder-as-project
  // workspaces still scan {root}/.agents/skills (same path session WD would use once bound).
  const activeSessionWorkingDirectory = session.selected
    ? sessionMetaMap.get(session.selected)?.workingDirectory
    : undefined
  const skillProjectRoot = activeSessionWorkingDirectory || activeWorkspace?.rootPath

  const reloadSkills = useCallback(() => {
    if (!activeWorkspaceId) return
    window.electronAPI.getSkills(activeWorkspaceId, skillProjectRoot).then((loaded) => {
      setSkills(loaded || [])
    }).catch(err => {
      console.error('[Chat] Failed to load skills:', err)
    })
  }, [activeWorkspaceId, skillProjectRoot])

  React.useEffect(() => {
    reloadSkills()
  }, [reloadSkills])

  // Watcher broadcasts workspace+global only; re-fetch with skillProjectRoot so project-tier
  // skills are not wiped (same failure mode as Craft 0.4.8 "global skills disappear").
  React.useEffect(() => {
    const cleanup = window.electronAPI.onSkillsChanged((workspaceId) => {
      if (workspaceId !== activeWorkspaceId) return
      reloadSkills()
    })
    return cleanup
  }, [activeWorkspaceId, reloadSkills])

  // All non-hidden sessions across loaded workspaces (local multi-project shell).
  const allSessionMetas = useMemo(() => {
    return Array.from(sessionMetaMap.values()).filter(s => !s.hidden && !s.parentSessionId && !s.taskDraft)
  }, [sessionMetaMap])

  const handleGlobalSearchSession = useCallback((meta: SessionMeta) => {
    openSessionInPanel(meta.id, {
      workingDirectory: meta.workingDirectory,
      workspaceId: meta.workspaceId,
    })
  }, [openSessionInPanel])

  // Filter session metadata by active workspace
  // Also exclude hidden sessions (mini-agent sessions) from all counts and lists
  // For remote workspaces, sessions have the remote workspace ID (not the local one),
  // so we match against both the local and remote workspace IDs.
  const remoteWorkspaceId = activeWorkspace?.remoteServer?.remoteWorkspaceId
  const workspaceSessionMetas = useMemo(() => {
    if (!activeWorkspaceId) return allSessionMetas
    return allSessionMetas.filter(s =>
      s.workspaceId === activeWorkspaceId || (remoteWorkspaceId && s.workspaceId === remoteWorkspaceId)
    )
  }, [allSessionMetas, activeWorkspaceId, remoteWorkspaceId])

  // Active sessions exclude archived - use this for workspace-scoped counts
  const activeSessionMetas = useMemo(() => {
    return workspaceSessionMetas.filter(s => !s.isArchived)
  }, [workspaceSessionMetas])

  const allActiveSessionMetas = useMemo(() => {
    return allSessionMetas.filter(s => !s.isArchived)
  }, [allSessionMetas])

  const refreshWorkspaceUnreadMap = useCallback(async () => {
    try {
      const summary = await window.electronAPI.getUnreadSummary()
      const next: Record<string, boolean> = {}

      for (const workspace of workspaces) {
        next[workspace.id] = !!summary.hasUnreadByWorkspace[workspace.id]
      }

      setWorkspaceUnreadMap(next)
    } catch (error) {
      console.error('[AppShell] Failed to refresh workspace unread indicators:', error)
    }
  }, [workspaces])

  // Initial + workspace-list refresh
  useEffect(() => {
    void refreshWorkspaceUnreadMap()
  }, [refreshWorkspaceUnreadMap])

  // Keep active workspace unread indicator in sync with live metadata updates
  useEffect(() => {
    if (!activeWorkspaceId) return
    const activeHasUnread = activeSessionMetas.some((session) => !!session.hasUnread)
    setWorkspaceUnreadMap((prev) => ({ ...prev, [activeWorkspaceId]: activeHasUnread }))
  }, [activeWorkspaceId, activeSessionMetas])

  // Keep cross-workspace indicators in sync with global unread updates from main process
  useEffect(() => {
    const cleanup = window.electronAPI.onUnreadSummaryChanged((summary) => {
      const next: Record<string, boolean> = {}
      for (const workspace of workspaces) {
        next[workspace.id] = !!summary.hasUnreadByWorkspace[workspace.id]
      }
      setWorkspaceUnreadMap(next)
    })

    return cleanup
  }, [workspaces])

  // Count sessions by todo state (scoped to workspace)
  const isMetaDone = (s: SessionMeta) => s.sessionStatus === 'done' || s.sessionStatus === 'cancelled'
  // Count sources by type for the Sources dropdown subcategories
  const sourceTypeCounts = useMemo(() => {
    const counts = { api: 0, mcp: 0, local: 0 }
    for (const source of sources) {
      const t = source.config.type
      if (t === 'api' || t === 'mcp' || t === 'local') {
        counts[t]++
      }
    }
    return counts
  }, [sources])

  // Count automations by type for the Automations dropdown subcategories
  const automationTypeCounts = useMemo(() => {
    const counts = { scheduled: 0, event: 0, agentic: 0 }
    for (const automation of automations) {
      if (automation.event === 'SchedulerTick') counts.scheduled++
      else if ((APP_EVENTS as string[]).includes(automation.event)) counts.event++
      else if ((AGENT_EVENTS as string[]).includes(automation.event)) counts.agentic++
    }
    return counts
  }, [automations])

  // Filter session metadata based on sidebar mode and chat filter
  const filteredSessionMetas = useMemo(() => {
    // When in sources mode, return empty (no sessions to show)
    if (!sessionFilter) {
      return []
    }

    let result: SessionMeta[]

    switch (sessionFilter.kind) {
      case 'allSessions':
        // Legacy: active workspace non-archived
        result = activeSessionMetas
        break
      case 'projectSessions': {
        // 项目 overview = every folder-bound session (same list as before, group by project).
        // Project row focus = that folder only. Folder-less work stays under 对话.
        result = allActiveSessionMetas.filter(s => {
          if (!s.workingDirectory) return false
          if (sessionFilter.workspaceId) return s.workspaceId === sessionFilter.workspaceId
          return true
        })
        break
      }
      case 'conversations':
        // 对话: no folder selected
        result = allActiveSessionMetas.filter(s => !s.workingDirectory)
        break
      case 'flagged':
        result = allActiveSessionMetas.filter(s => s.isFlagged)
        break
      case 'archived':
        // Archived view shows only archived sessions (cross-project)
        result = allSessionMetas.filter(s => s.isArchived)
        break
      case 'state':
        // Filter by specific todo state (excludes archived)
        result = activeSessionMetas.filter(s => (s.sessionStatus || 'todo') === sessionFilter.stateId)
        break
      case 'label': {
        // Shared predicate (handles '__all__', descendant labels, and the optional
        // project scope) — the same implementation the session list filters with,
        // so the two stay aligned by construction.
        result = activeSessionMetas.filter(s => matchesLabelFilter(s, sessionFilter, labelConfigs))
        break
      }
      case 'view': {
        // Filter by view: __all__ shows any session matched by any view,
        // otherwise filter to the specific view (excludes archived)
        result = activeSessionMetas.filter(s => {
          const matched = evaluateViews(s)
          if (sessionFilter.viewId === '__all__') {
            return matched.length > 0
          }
          return matched.some(v => v.id === sessionFilter.viewId)
        })
        break
      }
      default:
        result = activeSessionMetas
    }

    // Apply secondary filters (status + labels, AND-ed together) in ALL views.
    // These layer on top of the primary sessionFilter to allow further narrowing.
    // Each filter supports include/exclude modes:
    //   - Includes: if any exist, only matching items pass
    //   - Excludes: matching items are removed (applied after includes)
    if (listFilter.size > 0) {
      const statusIncludes = new Set<SessionStatusId>()
      const statusExcludes = new Set<SessionStatusId>()
      for (const [id, mode] of listFilter) {
        if (mode === 'include') statusIncludes.add(id)
        else statusExcludes.add(id)
      }
      if (statusIncludes.size > 0) {
        result = result.filter(s => statusIncludes.has((s.sessionStatus || 'todo') as SessionStatusId))
      }
      if (statusExcludes.size > 0) {
        result = result.filter(s => !statusExcludes.has((s.sessionStatus || 'todo') as SessionStatusId))
      }
    }
    // Filter by labels — supports include/exclude with descendant expansion
    if (labelFilter.size > 0) {
      const labelIncludes = new Set<string>()
      const labelExcludes = new Set<string>()
      for (const [id, mode] of labelFilter) {
        // Expand to include descendant label IDs
        const ids = [id, ...getDescendantIds(labelConfigs, id)]
        for (const expandedId of ids) {
          if (mode === 'include') labelIncludes.add(expandedId)
          else labelExcludes.add(expandedId)
        }
      }
      if (labelIncludes.size > 0) {
        result = result.filter(s =>
          s.labels?.some(l => labelIncludes.has(extractLabelId(l)))
        )
      }
      if (labelExcludes.size > 0) {
        result = result.filter(s =>
          !s.labels?.some(l => labelExcludes.has(extractLabelId(l)))
        )
      }
    }
    // Filter by project — supports include/exclude on session.projectId
    if (projectFilter.size > 0) {
      const projectIncludes = new Set<string>()
      const projectExcludes = new Set<string>()
      for (const [id, mode] of projectFilter) {
        if (mode === 'include') projectIncludes.add(id)
        else projectExcludes.add(id)
      }
      if (projectIncludes.size > 0) {
        result = result.filter(s => {
          const pid = (s as { projectId?: string }).projectId
          return pid !== undefined && projectIncludes.has(pid)
        })
      }
      if (projectExcludes.size > 0) {
        result = result.filter(s => {
          const pid = (s as { projectId?: string }).projectId
          return pid === undefined || !projectExcludes.has(pid)
        })
      }
    }

    // Never list composer placeholders: no first message yet (name/preview/count).
    // Placement (项目 vs 对话) applies once the session becomes list-visible.
    return result.filter(isSessionListVisible)
  }, [workspaceSessionMetas, activeSessionMetas, allActiveSessionMetas, allSessionMetas, sessionFilter, listFilter, labelFilter, projectFilter, labelConfigs, evaluateViews])

  const bulkActionSessionMetasRef = useRef<readonly SessionMeta[]>([])
  const handleBulkActionItemsChange = useCallback((items: readonly SessionMeta[]) => {
    bulkActionSessionMetasRef.current = items
  }, [])

  const handleMarkFilteredSessionsRead = useCallback(() => {
    for (const sessionId of getUnreadSessionIds(bulkActionSessionMetasRef.current)) {
      onMarkSessionRead(sessionId)
    }
  }, [onMarkSessionRead])

  // Derive "pinned" (non-removable) filters from the current sessionFilter path.
  // These represent filters that are implicit in the current deeplink/route and
  // should be displayed as fixed chips in the filter bar that users cannot remove.
  const pinnedFilters = useMemo(() => {
    if (!sessionFilter) return { pinnedStatusId: null as string | null, pinnedLabelId: null as string | null, pinnedFlagged: false }
    switch (sessionFilter.kind) {
      case 'state':
        return { pinnedStatusId: sessionFilter.stateId, pinnedLabelId: null, pinnedFlagged: false }
      case 'label':
        // Don't pin the __all__ pseudo-label — that just means "any label"
        return { pinnedStatusId: null, pinnedLabelId: sessionFilter.labelId !== '__all__' ? sessionFilter.labelId : null, pinnedFlagged: false }
      case 'flagged':
        return { pinnedStatusId: null, pinnedLabelId: null, pinnedFlagged: true }
      default:
        return { pinnedStatusId: null, pinnedLabelId: null, pinnedFlagged: false }
    }
  }, [sessionFilter])

  // Ensure session messages are loaded when selected
  React.useEffect(() => {
    if (session.selected) {
      ensureMessagesLoaded(session.selected)
    }
  }, [session.selected, ensureMessagesLoaded])

  // Wrap delete handler to clear selection when deleting the currently selected session
  // This prevents stale state during re-renders that could cause crashes
  const handleDeleteSession = useCallback(async (sessionId: string, skipConfirmation?: boolean): Promise<boolean> => {
    // Clear selection first if this is the selected session
    if (session.selected === sessionId) {
      setSession({ selected: null })
    }
    return onDeleteSession(sessionId, skipConfirmation)
  }, [session.selected, setSession, onDeleteSession])

  // Right workbench control for chat panel header (replaces the old close-X design).
  const workbenchHeaderButton = React.useMemo(() => {
    if (!isRightWorkbenchAvailableForRoute) return null
    const label = canFitRightWorkbench
      ? t('rightWorkbench.toggle')
      : t('rightWorkbench.toggleTooNarrow')
    return (
      <PanelHeaderCenterButton
        icon={<PanelRightRounded className="h-4 w-4" />}
        onClick={handleToggleRightWorkbench}
        // aria-disabled, not disabled: the tooltip must stay reachable so the
        // control can explain that the window is too narrow.
        aria-disabled={!canFitRightWorkbench}
        tooltip={label}
        aria-label={label}
        // Report what is on screen, not what was requested.
        aria-pressed={isRightWorkbenchRendered}
        className={isRightWorkbenchRendered ? 'opacity-100' : undefined}
      />
    )
  }, [
    canFitRightWorkbench,
    handleToggleRightWorkbench,
    isRightWorkbenchAvailableForRoute,
    isRightWorkbenchRendered,
    t,
  ])

  // Persist expanded folders to localStorage (workspace-scoped)
  React.useEffect(() => {
    if (!activeWorkspaceId) return
    storage.set(storage.KEYS.expandedFolders, [...expandedFolders], activeWorkspaceId)
  }, [expandedFolders, activeWorkspaceId])

  // Persist sidebar visibility to localStorage
  React.useEffect(() => {
    storage.set(storage.KEYS.sidebarVisible, isSidebarVisible)
  }, [isSidebarVisible])

  // Persist focus mode state to localStorage
  React.useEffect(() => {
    storage.set(storage.KEYS.focusModeEnabled, isSidebarAndNavigatorHidden)
  }, [isSidebarAndNavigatorHidden])

  // Listen for focus mode toggle from menu (View → Focus Mode)
  React.useEffect(() => {
    const cleanup = window.electronAPI.onMenuToggleFocusMode?.(() => {
      setIsSidebarAndNavigatorHidden(v => !v)
    })
    return cleanup
  }, [])

  // Listen for sidebar toggle from menu (View → Toggle Sidebar)
  React.useEffect(() => {
    const cleanup = window.electronAPI.onMenuToggleSidebar?.(() => {
      handleToggleSidebar()
    })
    return cleanup
  }, [handleToggleSidebar])

  // Persist per-view filter map to localStorage (workspace-scoped)
  React.useEffect(() => {
    if (!activeWorkspaceId) return
    storage.set(storage.KEYS.viewFilters, viewFiltersMap, activeWorkspaceId)
  }, [viewFiltersMap, activeWorkspaceId])

  // Persist sidebar section collapsed states (workspace-scoped)
  React.useEffect(() => {
    if (!activeWorkspaceId) return
    storage.set(storage.KEYS.collapsedSidebarItems, [...collapsedItems], activeWorkspaceId)
  }, [collapsedItems, activeWorkspaceId])


  const handleViewClick = useCallback((viewId: string) => {
    navigate(routes.view.view(viewId))
  }, [])

  // Handler for sources view (all sources)
  const handleSourcesClick = useCallback(() => {
    navigate(routes.view.sources())
  }, [])

  // Handlers for source type filter views (subcategories in Sources dropdown)
  const handleSourcesApiClick = useCallback(() => {
    navigate(routes.view.sourcesApi())
  }, [])

  const handleSourcesMcpClick = useCallback(() => {
    navigate(routes.view.sourcesMcp())
  }, [])

  // Handler for skills view
  const handleSkillsClick = useCallback(() => {
    navigate(routes.view.skills())
  }, [])

  // Handlers for automations view
  const handleAutomationsClick = useCallback(() => {
    navigate(routes.view.automations())
  }, [])

  // 对话 header = every session with no folder selected — independent of which project is focused.
  const handleConversationsClick = useCallback(() => {
    navigate(routes.view.conversations(), { skipAutoSelect: true })
  }, [])

  // Project row = list focus only for local folders (Cursor multi-root model).
  // Never call onSelectWorkspace for local — that reloads sources/skills/settings/?ws= and
  // makes 对话 appear to "belong" to the active workspace. Remote still hard-switches (P7).
  // skipAutoSelect: same exclusive-level selection as 自动化 → 定时/事件 (parent not dual-selected).
  const handleProjectRowClick = useCallback((workspace: Workspace) => {
    if (workspace.remoteServer) {
      void onSelectWorkspace(workspace.id)
    }
    const sessionWorkspaceId =
      workspace.remoteServer?.remoteWorkspaceId ?? workspace.id
    navigate(routes.view.projectSessions(undefined, sessionWorkspaceId), { skipAutoSelect: true })
  }, [onSelectWorkspace])

  const handleAutomationsScheduledClick = useCallback(() => {
    navigate(routes.view.automationsScheduled())
  }, [])

  const handleAutomationsEventClick = useCallback(() => {
    navigate(routes.view.automationsEvent())
  }, [])

  const handleAutomationsAgenticClick = useCallback(() => {
    navigate(routes.view.automationsAgentic())
  }, [])

  // Handler for settings view. With no arg → bare `settings` route (navigator-only
  // in compact mode, App fallback on desktop). With an arg → `settings/<subpage>`.
  const handleSettingsClick = useCallback((subpage?: SettingsSubpage) => {
    navigate(routes.view.settings(subpage))
  }, [])

  // Handler for What's New overlay
  const handleWhatsNewClick = useCallback(async () => {
    const content = await window.electronAPI.getReleaseNotes()
    setReleaseNotesContent(content)
    setShowWhatsNew(true)
    setHasUnseenReleaseNotes(false)
    // Update last seen version
    const latestVersion = await window.electronAPI.getLatestReleaseVersion()
    if (latestVersion) {
      storage.set(storage.KEYS.whatsNewLastSeenVersion, latestVersion)
    }
  }, [])

  // ============================================================================
  // EDIT POPOVER STATE
  // ============================================================================
  // State to control which EditPopover is open (triggered from context menus).
  // We use controlled popovers instead of deep links so the user can type
  // their request in the popover UI before opening a new chat window.
  // add-source variants: add-source (generic), add-source-api, add-source-mcp, add-source-local
  const [editPopoverOpen, setEditPopoverOpen] = useState<'statuses' | 'views' | 'add-source' | 'add-source-api' | 'add-source-mcp' | 'add-source-local' | 'add-skill' | 'automation-config' | null>(null)

  // Stores the Y position of the last right-clicked sidebar item so the EditPopover
  // appears near it rather than at a fixed location. Updated synchronously before
  // the setTimeout that opens the popover, ensuring the ref is set before render.
  const editPopoverAnchorY = useRef<number>(120)
  // Stores the trigger element (button) so we can keep it highlighted while the
  // EditPopover is open (after Radix removes data-state="open" on context menu close).
  const editPopoverTriggerRef = useRef<Element | null>(null)

  // Captures the bounding rect of the currently-open context menu trigger (the button).
  // Radix sets data-state="open" on the button (via ContextMenuTrigger asChild)
  // while the menu is visible, so we can locate it in the DOM at click time.
  const captureContextMenuPosition = useCallback(() => {
    const trigger = document.querySelector(
      '.group\\/section > [data-state="open"], [data-session-filter-trigger][data-state="open"]'
    )
    if (trigger) {
      const rect = trigger.getBoundingClientRect()
      editPopoverAnchorY.current = rect.top
      editPopoverTriggerRef.current = trigger
    }
  }, [])

  // Sync data-edit-active attribute on the trigger element with EditPopover open state.
  // This keeps the sidebar item visually highlighted while the popover is shown,
  // since Radix's data-state="open" disappears when the context menu closes.
  useEffect(() => {
    const el = editPopoverTriggerRef.current
    if (!el) return
    if (editPopoverOpen) {
      el.setAttribute('data-edit-active', 'true')
    } else {
      el.removeAttribute('data-edit-active')
      editPopoverTriggerRef.current = null
    }
  }, [editPopoverOpen])

  // Handler for "Configure Statuses" context menu action
  // Opens the EditPopover for status configuration
  // Uses setTimeout to delay opening until after context menu closes,
  // preventing the popover from immediately closing due to focus shift
  const openConfigureStatuses = useCallback(() => {
    captureContextMenuPosition()
    setTimeout(() => setEditPopoverOpen('statuses'), 50)
  }, [captureContextMenuPosition])

  // Handler for "Edit Views" context menu action
  // Opens the EditPopover for view configuration
  const openConfigureViews = useCallback(() => {
    captureContextMenuPosition()
    setTimeout(() => setEditPopoverOpen('views'), 50)
  }, [captureContextMenuPosition])

  // Handler for "Add Source" context menu action
  // Opens the EditPopover for adding a new source
  // Optional sourceType param allows filter-aware context (from subcategory menus or filtered views)
  const openAddSource = useCallback((sourceType?: 'api' | 'mcp' | 'local') => {
    captureContextMenuPosition()
    const key = sourceType ? `add-source-${sourceType}` as const : 'add-source' as const
    setTimeout(() => setEditPopoverOpen(key), 50)
  }, [captureContextMenuPosition])

  // Handler for "Add Skill" context menu action
  // Opens the EditPopover for adding a new skill
  const openAddSkill = useCallback(() => {
    captureContextMenuPosition()
    setTimeout(() => setEditPopoverOpen('add-skill'), 50)
  }, [captureContextMenuPosition])

  // Handler for "Add Automation" context menu action
  // Opens the EditPopover for adding a new automation
  const openAddAutomation = useCallback(() => {
    captureContextMenuPosition()
    setTimeout(() => setEditPopoverOpen('automation-config'), 50)
  }, [captureContextMenuPosition])

  /**
   * Resolve the "inherit sole active filter" rule: if exactly one filter value
   * is selected across statuses + labels + projects, return it as new-session
   * params. Otherwise return null (fall back to workspace defaults).
   */
  type NewSessionParams = {
    status?: string
    label?: string
    project?: string
    workdir?: string
    workspaceId?: string
  }

  const resolveInheritedNewSessionParams = useCallback((): NewSessionParams | null => {
    const statusCount = listFilter.size
    const labelCount = labelFilter.size
    const projectCount = projectFilter.size
    const total = statusCount + labelCount + projectCount
    if (total !== 1) return null
    if (statusCount === 1) {
      const [stateId] = [...listFilter.keys()]
      return { status: stateId }
    }
    if (labelCount === 1) {
      const [labelId] = [...labelFilter.keys()]
      return { label: labelId }
    }
    if (projectCount === 1) {
      const [projectId] = [...projectFilter.keys()]
      return { project: projectId }
    }
    return null
  }, [listFilter, labelFilter, projectFilter])

  // Resolve the one Session-create context used by the main task entry and the
  // right-workbench side-task projection. The latter changes placement only;
  // it does not introduce another task/session authority.
  const resolveNewSessionCreateParams = useCallback((): NewSessionParams | null => {
    if (!activeWorkspace) return null

    const inherited = resolveInheritedNewSessionParams()
    const focusedProjectId =
      sessionFilter?.kind === 'projectSessions' ? sessionFilter.workspaceId : undefined
    const focusedProject = focusedProjectId
      ? workspaces.find(w => w.id === focusedProjectId)
      : undefined

    const bindToProject = (ws: Workspace): NewSessionParams | null => {
      const folder = ws.rootPath?.trim()
      if (!folder) return null
      return { workspaceId: ws.id, workdir: folder }
    }

    let createParams: NewSessionParams
    if (sessionFilter?.kind === 'conversations') {
      createParams = { workdir: 'none' }
    } else if (focusedProject) {
      const bound = bindToProject(focusedProject)
      if (!bound) {
        toast.error(t('toast.failedToCreateWorkspace'))
        return null
      }
      createParams = bound
    } else {
      createParams = { workdir: 'none' }
    }

    if (inherited) {
      const { project: _ignoreNested, ...rest } = inherited
      createParams = { ...createParams, ...rest }
    }

    return createParams
  }, [
    activeWorkspace,
    resolveInheritedNewSessionParams,
    sessionFilter,
    workspaces,
    t,
  ])

  // New Task (R1 §2) — one Session create path; context from the trigger:
  // - 对话 filter → folder-less (workdir 'none' must be explicit)
  // - focused Project row (projectSessions + workspaceId) → that folder
  // - Project overview / Flagged / labels / etc. without a focused project → folder-less
  // Project-row trailing "+" uses handleNewTaskInProject (same Session path, folder prefilled).
  // Never omit workdir: SessionManager treats omit as workspace default, not Conversations.
  const handleNewChat = useCallback((newPanel: boolean = false) => {
    setSearchActive(false)
    setSearchQuery('')
    const createParams = resolveNewSessionCreateParams()
    if (!createParams) return

    navigate(
      routes.action.newSession(createParams),
      newPanel ? { newPanel: true, targetLaneId: 'main' } : undefined
    )

    setTimeout(() => focusZone('chat', { intent: 'programmatic' }), 50)
  }, [focusZone, navigate, resolveNewSessionCreateParams])

  const handleCreateSideTask = useCallback(async (): Promise<string | null> => {
    const createParams = resolveNewSessionCreateParams()
    if (!createParams || !activeWorkspace) return null

    try {
      const created = await onCreateSession(
        createParams.workspaceId ?? activeWorkspace.id,
        {
          workingDirectory: createParams.workdir,
          sessionStatus: createParams.status,
          labels: createParams.label ? [createParams.label] : undefined,
          projectId: createParams.project,
        },
      )
      setSearchActive(false)
      setSearchQuery('')
      return created.id
    } catch {
      toast.error(t('toast.failedToCreateSession'))
      return null
    }
  }, [
    activeWorkspace,
    onCreateSession,
    resolveNewSessionCreateParams,
    t,
  ])

  // P10: the Project-row create trigger. It is the *same* Session path as the global New Task
  // button with the Project pre-selected — not a second create flow, and never a Task record or
  // the Board (specs/R1-one-boundary-language.md §2).

  // Delete Source - simplified since agents system is removed
  const handleDeleteSource = useCallback(async (sourceSlug: string) => {
    if (!activeWorkspace) return
    try {
      await window.electronAPI.deleteSource(activeWorkspace.id, sourceSlug)
      toast.success(t('toast.deletedSource'))
    } catch (error) {
      console.error('[Chat] Failed to delete source:', error)
      toast.error(t('toast.failedToDeleteSource'))
    }
  }, [activeWorkspace, t])

  // Delete Skill
  const handleDeleteSkill = useCallback(async (skillSlug: string) => {
    if (!activeWorkspace) return
    try {
      await window.electronAPI.deleteSkill(activeWorkspace.id, skillSlug)
      toast.success(t('toast.deletedSkill', { slug: skillSlug }))
    } catch (error) {
      console.error('[Chat] Failed to delete skill:', error)
      toast.error(t('toast.failedToDeleteSkill'))
    }
  }, [activeWorkspace, t])

  // Respond to menu bar "New Chat" trigger
  const menuTriggerRef = useRef(menuNewChatTrigger)
  useEffect(() => {
    // Skip initial render
    if (menuTriggerRef.current === menuNewChatTrigger) return
    menuTriggerRef.current = menuNewChatTrigger
    handleNewChat()
  }, [menuNewChatTrigger, handleNewChat])

  // Unified sidebar items: nav buttons only (agents system removed)
  type SidebarItem = {
    id: string
    type: 'nav'
    action?: () => void
  }

  const pendingProjectCreationRef = React.useRef<((workspace: Workspace) => void) | null>(null)

  const handleProjectFolderPicked = useCallback(async (folderPath: string) => {
    const name = folderPath.split('/').filter(Boolean).pop() || folderPath
    try {
      const workspace = await window.electronAPI.createWorkspace(folderPath, name)
      // Project = folder: seed the workspace default WD so new sessions bind to this folder.
      try {
        await window.electronAPI.updateWorkspaceSetting(workspace.id, 'workingDirectory', folderPath)
      } catch (settingsErr) {
        console.warn('[AppShell] Project created but default workingDirectory not saved:', settingsErr)
      }
      onRefreshWorkspaces?.()
      const requester = pendingProjectCreationRef.current
      pendingProjectCreationRef.current = null
      if (requester) requester(workspace)
      else navigate(routes.view.projectSessions(undefined, workspace.id), { skipAutoSelect: true })
      toast.success(t('toast.createdWorkspace', { name: workspace.name }))
    } catch (err) {
      console.error('[AppShell] Failed to create project from folder:', err)
      toast.error(t('toast.failedToCreateWorkspace'))
    }
  }, [onRefreshWorkspaces, navigate, t])

  const {
    pickDirectory: pickProjectFolder,
    showServerBrowser: showProjectFolderBrowser,
    serverBrowserMode: projectFolderBrowserMode,
    cancelServerBrowser: cancelProjectFolderBrowser,
    confirmServerBrowser: confirmProjectFolderBrowser,
  } = useDirectoryPicker(handleProjectFolderPicked, () => {
    pendingProjectCreationRef.current = null
  })

  const openProjectCreateLocal = useCallback(() => {
    pickProjectFolder()
  }, [pickProjectFolder])

  // Project creation keeps two execution locations under one Project authority:
  // local folder first, user-owned cloud/remote through the existing connection path.
  const [showProjectCreateScreen, setShowProjectCreateScreen] = React.useState(false)
  const setFullscreenOverlayOpen = useSetAtom(fullscreenOverlayOpenAtom)

  const openProjectCreateCloud = useCallback(() => {
    setShowProjectCreateScreen(true)
    setFullscreenOverlayOpen(true)
  }, [setFullscreenOverlayOpen])

  const closeProjectCreateScreen = useCallback(() => {
    setShowProjectCreateScreen(false)
    setFullscreenOverlayOpen(false)
  }, [setFullscreenOverlayOpen])

  const cancelProjectCreateScreen = useCallback(() => {
    pendingProjectCreationRef.current = null
    closeProjectCreateScreen()
  }, [closeProjectCreateScreen])

  const handleProjectCreatedFromScreen = useCallback(async (workspace: Workspace) => {
    onRefreshWorkspaces?.()
    const requester = pendingProjectCreationRef.current
    pendingProjectCreationRef.current = null
    if (requester) {
      requester(workspace)
    } else {
      await onSelectWorkspace(workspace.id)
      navigate(routes.view.projectSessions(
        undefined,
        workspace.remoteServer?.remoteWorkspaceId ?? workspace.id,
      ), { skipAutoSelect: true })
    }
    closeProjectCreateScreen()
    toast.success(t('toast.createdWorkspace', { name: workspace.name }))
  }, [onRefreshWorkspaces, onSelectWorkspace, navigate, closeProjectCreateScreen, t])

  const requestProjectCreation = useCallback((
    kind: 'local' | 'remote',
    onCreated: (workspace: Workspace) => void,
  ) => {
    pendingProjectCreationRef.current = onCreated
    if (kind === 'local') openProjectCreateLocal()
    else openProjectCreateCloud()
  }, [openProjectCreateLocal, openProjectCreateCloud])

  const openAddProject = useCallback(() => {
    pickProjectFolder()
  }, [pickProjectFolder])

  // Trailing "+" in the sidebar slot: same 24 px slot + opacity reveal as count badges
  // (LeftSidebar). No second hover fill — the row already uses sidebar-hover via
  // group-hover/section when the action is hovered (UI-SPEC §8).
  const sidebarTrailingIconButtonClassName = cn(
    "inline-flex h-6 w-6 items-center justify-center rounded-[6px]",
    "text-muted-foreground hover:text-foreground",
    "data-[state=open]:text-foreground",
    "transition-opacity duration-150 outline-none",
    "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
  )

  // One row per workspace — this is the project list. Clicking a workspace shows *its* conversations;
  // clicking the 项目 header shows conversations across every workspace. Same data, different rule —
  // which is what the removed browse-trees were for, now expressed on the container list itself
  // (owner direction 2026-07-25; specs/R1-one-boundary-language.md clause 1).
  // Lifted from WorkspaceSwitcher, which no longer renders in normal mode. Guarded the same way:
  // the active project cannot be removed, because the shell has nowhere to fall back to.
  const handleRemoveProject = useCallback(async (workspace: Workspace) => {
    if (workspace.id === activeWorkspaceId) {
      toast.error(t('toast.cannotRemoveActiveWorkspace'))
      return
    }
    const removed = await window.electronAPI.removeWorkspace(workspace.id)
    if (removed) {
      toast.success(t('toast.removedWorkspace', { name: workspace.name }))
      onRefreshWorkspaces?.()
    }
  }, [activeWorkspaceId, onRefreshWorkspaces, t])

  // Project-row "+": create a Session bound to this folder (P10 / R1 §2).
  // Always pass workdir = project folder (rootPath). Without it the session is folder-less
  // and lands under 对话. Local: do not switch the shell.
  const handleNewTaskInProject = useCallback(async (workspace: Workspace) => {
    if (workspace.remoteServer && workspace.id !== activeWorkspaceId) {
      await onSelectWorkspace(workspace.id)
    }
    setSearchActive(false)
    setSearchQuery('')
    const folder = workspace.rootPath
    if (!folder) {
      toast.error(t('toast.failedToCreateWorkspace'))
      return
    }
    navigate(
      routes.action.newSession({
        workspaceId: workspace.id,
        workdir: folder,
      }),
    )
    setTimeout(() => focusZone('chat', { intent: 'programmatic' }), 50)
  }, [activeWorkspaceId, onSelectWorkspace, focusZone, navigate, t])

  // Exclusive sidebar selection (same contract as 自动化 / Sources):
  // - Parent selected only at that level (no child detail open)
  // - Child selected only when that child is the active detail
  // - Never parent + child both "default" at once
  const openSessionId = sessionsContext?.sessionId ?? null
  const hasSessionDetail = !!openSessionId
  const hasRemoteWorkspaces = workspaces.some(workspace => !!workspace.remoteServer)

  const renderSidebarSessionActions = useCallback((meta: SessionMeta) => (
    <SidebarSessionActions
      item={meta}
      buttonClassName={sidebarTrailingIconButtonClassName}
      hasRemoteWorkspaces={hasRemoteWorkspaces}
      projects={projectMenuOptions}
      onSetProjectId={handleSessionProjectChange}
      sessionStatuses={effectiveSessionStatuses}
      onSessionStatusChange={onSessionStatusChange}
      labels={displayLabelConfigs}
      onLabelsChange={handleSessionLabelsChange}
      onRename={onRenameSession}
      onFlag={onFlagSession}
      onUnflag={onUnflagSession}
      onArchive={onArchiveSession}
      onUnarchive={onUnarchiveSession}
      onSendToWorkspace={(sessionId) => setSendToWorkspaceIds([sessionId])}
      onDelete={(sessionId) => { void handleDeleteSession(sessionId) }}
    />
  ), [
    handleDeleteSession,
    hasRemoteWorkspaces,
    projectMenuOptions,
    handleSessionProjectChange,
    effectiveSessionStatuses,
    onSessionStatusChange,
    displayLabelConfigs,
    handleSessionLabelsChange,
    onArchiveSession,
    onFlagSession,
    onRenameSession,
    onUnarchiveSession,
    onUnflagSession,
    setSendToWorkspaceIds,
    sidebarTrailingIconButtonClassName,
  ])

  const renderSidebarSessionBadges = useCallback((meta: SessionMeta) => (
    meta.labels?.length ? (
      <SessionLabelBadges
        item={meta}
        flatLabels={flatDisplayLabelConfigs}
        readOnly
      />
    ) : undefined
  ), [flatDisplayLabelConfigs])

  /** Status glyph for a session leaf — same source as the conversation list. */
  const getSidebarSessionStatusIcon = useCallback((meta: SessionMeta): React.ReactNode => {
    const statusId = getSessionStatus(meta)
    return (
      <span
        className="flex h-3.5 w-3.5 items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>img]:h-full [&>img]:w-full [&>span]:text-[10px] leading-none"
        style={getStateIconStyle(statusId, effectiveSessionStatuses)}
      >
        {getStateIcon(statusId, effectiveSessionStatuses)}
      </span>
    )
  }, [effectiveSessionStatuses])

  /** Relative time / flag — same trailing slot language as SessionItem. */
  const getSidebarSessionTrailingMeta = useCallback((meta: SessionMeta): React.ReactNode => {
    if (meta.isFlagged) {
      return <Flag className="h-3.5 w-3.5 text-info" />
    }
    if (meta.lastMessageAt) {
      return formatDistanceToNowStrict(new Date(meta.lastMessageAt), {
        locale: shortTimeLocale as Locale,
        roundingMethod: 'floor',
      })
    }
    return null
  }, [])

  const workspaceProjectItems = useMemo(() => {
    const focusedWorkspaceId =
      sessionFilter?.kind === 'projectSessions' ? sessionFilter.workspaceId : undefined

    return workspaces.map(workspace => {
      const isRemote = !!workspace.remoteServer
      const sessionWorkspaceId =
        workspace.remoteServer?.remoteWorkspaceId ?? workspace.id
      // Project row = this workspace's list, with no session detail open (like 自动化父级)
      const isProjectRowSelected =
        sessionFilter?.kind === 'projectSessions'
        && focusedWorkspaceId === sessionWorkspaceId
        && !hasSessionDetail
      // Folder-bound sessions for this project — from the full map so local multi-project
      // rows stay populated without a hard workspace switch.
      const conversations = allActiveSessionMetas
        .filter(meta =>
          meta.workspaceId === sessionWorkspaceId
          && !!meta.workingDirectory
          && isSessionListVisible(meta),
        )
        .sort((a, b) => (b.lastMessageAt ?? b.createdAt ?? 0) - (a.lastMessageAt ?? a.createdAt ?? 0))
        .map(meta => ({
          id: `nav:projects:ws:${workspace.id}:session:${meta.id}`,
          title: getSessionTitle(meta),
          icon: getSidebarSessionStatusIcon(meta),
          iconColorable: false,
          trailingMeta: getSidebarSessionTrailingMeta(meta),
          badges: renderSidebarSessionBadges(meta),
          // Leaf only: selected when this session is the open detail under 项目
          variant: (
            sessionFilter?.kind === 'projectSessions'
            && openSessionId === meta.id
              ? 'default'
              : 'ghost'
          ) as 'default' | 'ghost',
          onClick: () => openSessionInPanel(meta.id, {
            workingDirectory: meta.workingDirectory,
            workspaceId: meta.workspaceId,
          }),
          trailingAction: renderSidebarSessionActions(meta),
        }))
      const projectTitle = getWorkspaceDisplayName(workspace.name, t)
      return {
        id: `nav:projects:ws:${workspace.id}`,
        title: projectTitle,
        // local = folder; remote/cloud computer = Cloud (existing Craft icon language)
        icon: isRemote ? Cloud : Folder,
        variant: (isProjectRowSelected ? 'default' : 'ghost') as 'default' | 'ghost',
        onClick: () => handleProjectRowClick(workspace),
        expandable: conversations.length > 0,
        expanded: isExpanded(`nav:projects:ws:${workspace.id}`),
        onToggle: () => toggleExpanded(`nav:projects:ws:${workspace.id}`),
        items: conversations.length > 0 ? conversations : undefined,
        // Same Session create path as the global button, with this folder pre-bound (R1 §2 / P10).
        trailingAction: (
          <button
            type="button"
            className={sidebarTrailingIconButtonClassName}
            aria-label={t('sidebar.newTaskInProject', { name: projectTitle })}
            title={t('sidebar.newTaskInProject', { name: projectTitle })}
            onClick={(event) => {
              event.stopPropagation()
              void handleNewTaskInProject(workspace)
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ),
        contextMenu: {
          type: 'project' as const,
          onOpenProjectSettings: () => {
            void (async () => {
              if (workspace.id !== activeWorkspaceId) {
                await onSelectWorkspace(workspace.id)
              }
              navigate(routes.view.settings('workspace'))
            })()
          },
          onRemoveProject: () => { void handleRemoveProject(workspace) },
        },
      }
    })
  }, [workspaces, allActiveSessionMetas, openSessionId, hasSessionDetail, sessionFilter, handleProjectRowClick, openSessionInPanel, isExpanded, toggleExpanded, handleRemoveProject, handleNewTaskInProject, activeWorkspaceId, onSelectWorkspace, navigate, renderSidebarSessionActions, renderSidebarSessionBadges, getSidebarSessionStatusIcon, getSidebarSessionTrailingMeta, sidebarTrailingIconButtonClassName, t])

  // Sessions with no project folder across all loaded workspaces (R1 clause 1).
  const unboundSessionItems = useMemo(() => {
    return allActiveSessionMetas
      .filter(meta => !meta.workingDirectory && isSessionListVisible(meta))
      .sort((a, b) => (b.lastMessageAt ?? b.createdAt ?? 0) - (a.lastMessageAt ?? a.createdAt ?? 0))
      .map(session => ({
        id: `nav:conversations:${session.id}`,
        title: getSessionTitle(session),
        icon: getSidebarSessionStatusIcon(session),
        iconColorable: false,
        trailingMeta: getSidebarSessionTrailingMeta(session),
        badges: renderSidebarSessionBadges(session),
        // Leaf only under 对话 — same exclusive rule as 自动化 → 定时
        variant: (
          sessionFilter?.kind === 'conversations' && openSessionId === session.id
            ? 'default'
            : 'ghost'
        ) as 'default' | 'ghost',
        onClick: () => openSessionInPanel(session.id, {
          workingDirectory: undefined,
          workspaceId: session.workspaceId,
        }),
        trailingAction: renderSidebarSessionActions(session),
      }))
  }, [allActiveSessionMetas, openSessionId, sessionFilter, openSessionInPanel, renderSidebarSessionActions, renderSidebarSessionBadges, getSidebarSessionStatusIcon, getSidebarSessionTrailingMeta])

  const unifiedSidebarItems = React.useMemo((): SidebarItem[] => {
    const result: SidebarItem[] = []

    // Derived from the *rendered* item arrays rather than re-deriving the same lists by hand.
    // Hand-maintained duplicates drift silently: before this, the project rows here still used the
    // retired `nav:projects:<projectId>` ids while the sidebar rendered `nav:projects:ws:<wsId>`,
    // so arrow-key navigation over the whole project section pointed at ids that no longer existed.
    const pushLink = (item: { id: string; onClick?: () => void; items?: Array<{ id: string; onClick?: () => void; items?: unknown }> }) => {
      result.push({ id: item.id, type: 'nav', action: () => item.onClick?.() })
      for (const child of item.items ?? []) {
        if ((child as { type?: string }).type === 'separator') continue
        pushLink(child as { id: string; onClick?: () => void; items?: Array<{ id: string; onClick?: () => void }> })
      }
    }

    result.push({ id: 'nav:search', type: 'nav', action: () => setGlobalSearchOpen(true) })
    result.push({ id: 'nav:sources', type: 'nav', action: handleSourcesClick })
    result.push({ id: 'nav:skills', type: 'nav', action: handleSkillsClick })
    result.push({ id: 'nav:automations', type: 'nav', action: handleAutomationsClick })

    result.push({
      id: 'nav:projects',
      type: 'nav',
      action: () => toggleExpanded('nav:projects'),
    })
    for (const workspaceItem of workspaceProjectItems) {
      pushLink(workspaceItem)
    }

    result.push({ id: 'nav:conversations', type: 'nav', action: handleConversationsClick })
    for (const item of unboundSessionItems) pushLink(item)

    result.push({ id: 'nav:settings', type: 'nav', action: () => handleSettingsClick() })

    return result
  }, [
    handleSourcesClick,
    handleSkillsClick,
    handleAutomationsClick,
    toggleExpanded,
    handleConversationsClick,
    workspaceProjectItems,
    unboundSessionItems,
    handleSettingsClick,
  ])

  // Toggle folder expanded state
  const handleToggleFolder = React.useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  // Get props for any sidebar item (unified roving tabindex pattern)
  const getSidebarItemProps = React.useCallback((id: string) => ({
    tabIndex: focusedSidebarItemId === id ? 0 : -1,
    'data-focused': focusedSidebarItemId === id,
    ref: (el: HTMLElement | null) => {
      if (el) {
        sidebarItemRefs.current.set(id, el)
      } else {
        sidebarItemRefs.current.delete(id)
      }
    },
  }), [focusedSidebarItemId])

  // Unified sidebar keyboard navigation
  const handleSidebarKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (!sidebarFocused || unifiedSidebarItems.length === 0) return

    const currentIndex = unifiedSidebarItems.findIndex(item => item.id === focusedSidebarItemId)
    const currentItem = currentIndex >= 0 ? unifiedSidebarItems[currentIndex] : null

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const nextIndex = currentIndex < unifiedSidebarItems.length - 1 ? currentIndex + 1 : 0
        const nextItem = unifiedSidebarItems[nextIndex]
        setFocusedSidebarItemId(nextItem.id)
        sidebarItemRefs.current.get(nextItem.id)?.focus()
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : unifiedSidebarItems.length - 1
        const prevItem = unifiedSidebarItems[prevIndex]
        setFocusedSidebarItemId(prevItem.id)
        sidebarItemRefs.current.get(prevItem.id)?.focus()
        break
      }
      case 'ArrowLeft': {
        e.preventDefault()
        // At boundary - do nothing (Left doesn't change zones from sidebar)
        break
      }
      case 'ArrowRight': {
        e.preventDefault()
        // Move to next zone (navigator) - keyboard navigation
        focusZone('navigator', { intent: 'keyboard' })
        break
      }
      case 'Enter':
      case ' ': {
        e.preventDefault()
        if (currentItem?.type === 'nav' && currentItem.action) {
          currentItem.action()
        }
        break
      }
      case 'Home': {
        e.preventDefault()
        if (unifiedSidebarItems.length > 0) {
          const firstItem = unifiedSidebarItems[0]
          setFocusedSidebarItemId(firstItem.id)
          sidebarItemRefs.current.get(firstItem.id)?.focus()
        }
        break
      }
      case 'End': {
        e.preventDefault()
        if (unifiedSidebarItems.length > 0) {
          const lastItem = unifiedSidebarItems[unifiedSidebarItems.length - 1]
          setFocusedSidebarItemId(lastItem.id)
          sidebarItemRefs.current.get(lastItem.id)?.focus()
        }
        break
      }
    }
  }, [sidebarFocused, unifiedSidebarItems, focusedSidebarItemId, focusZone])

  // Focus sidebar item when sidebar zone gains focus
  React.useEffect(() => {
    if (sidebarFocused && unifiedSidebarItems.length > 0) {
      // Set focused item if not already set
      const itemId = focusedSidebarItemId || unifiedSidebarItems[0].id
      if (!focusedSidebarItemId) {
        setFocusedSidebarItemId(itemId)
      }
      // Actually focus the DOM element
      requestAnimationFrame(() => {
        sidebarItemRefs.current.get(itemId)?.focus()
      })
    }
  }, [sidebarFocused, focusedSidebarItemId, unifiedSidebarItems])

  // Get title based on navigation state
  const listTitle = React.useMemo(() => {
    // Sources navigator
    if (isSourcesNavigation(navState)) {
      return t("sidebar.sources")
    }

    // Skills navigator
    if (isSkillsNavigation(navState)) {
      return t("sidebar.allSkills")
    }

    // Projects navigator
    if (isProjectsNavigation(navState)) {
      return t("sidebar.allProjects")
    }

    // Automations navigator
    if (isAutomationsNavigation(navState)) {
      if (!automationFilter) return t("sidebar.allAutomations")
      switch (automationFilter.automationType) {
        case 'scheduled': return t("sidebar.scheduled")
        case 'event': return t("sidebar.eventBased")
        case 'agentic': return t("sidebar.agentic")
        default: return t("sidebar.allAutomations")
      }
    }

    // Settings navigator
    if (isSettingsNavigation(navState)) return t("sidebar.settings")

    // Sessions navigator - use sessionFilter
    if (!sessionFilter) return t("sidebar.projects")

    switch (sessionFilter.kind) {
      case 'projectSessions': {
        if (sessionFilter.workspaceId) {
          const ws = workspaces.find(w => w.id === sessionFilter.workspaceId)
          return ws?.name ?? t("sidebar.projects")
        }
        return t("sidebar.projects")
      }
      case 'conversations':
        return t("sidebar.conversations")
      case 'flagged':
        return t("sidebar.flagged")
      case 'archived':
        return t("sidebar.archived")
      case 'state': {
        const state = effectiveSessionStatuses.find(s => s.id === sessionFilter.stateId)
        return state ? t(`status.${state.id}`, state.label) : t("sidebar.projects")
      }
      case 'label': {
        if (sessionFilter.labelId === '__all__') return t("sidebar.labels")
        const label = findLabelById(labelConfigs, sessionFilter.labelId)
        return label ? getLocalizedLabelName(t, label) : getLabelDisplayName(labelConfigs, sessionFilter.labelId)
      }
      case 'view':
        return sessionFilter.viewId === '__all__' ? t("sidebar.views") : viewConfigs.find(v => v.id === sessionFilter.viewId)?.name || t("sidebar.views")
      case 'allSessions':
        return t("sidebar.projects")
      default:
        return t("sidebar.projects")
    }
  }, [navState, t, sessionFilter, automationFilter, labelConfigs, viewConfigs, effectiveSessionStatuses, workspaces])

  // Build recursive sidebar items from the shared display-sorted label tree.
  // Each node renders with condensed height (compact: true) since many labels expected.
  // Clicking any label navigates to its filter view; the chevron toggles expand/collapse.

  // Extend the single shell authority only after all local actions exist. Project
  // creation requested by the composer resolves through the same folder/remote
  // flows used by the sidebar, then hands the Workspace back to the Session flow.
  const appShellContextValue = React.useMemo<AppShellContextType>(() => ({
    ...contextValue,
    onDeleteSession: handleDeleteSession,
    enabledSources: sources,
    skills,
    activeSessionWorkingDirectory,
    labels: displayLabelConfigs,
    onSessionLabelsChange: handleSessionLabelsChange,
    sessionStatuses: effectiveSessionStatuses,
    onSessionSourcesChange: handleSessionSourcesChange,
    onJumpToTaskSessions: handleJumpToTaskSessions,
    onRequestProjectCreation: requestProjectCreation,
    rightSidebarButton: workbenchHeaderButton,
    isCompactMode: isAutoCompact,
    sessionListSearchQuery: searchActive ? searchQuery : undefined,
    isSearchModeActive: searchActive,
    chatDisplayRef,
    onChatMatchInfoChange: handleChatMatchInfoChange,
    onTestAutomation: handleTestAutomation,
    onToggleAutomation: handleToggleAutomation,
    onDuplicateAutomation: handleDuplicateAutomation,
    onDeleteAutomation: handleDeleteAutomation,
    automationTestResults,
    getAutomationHistory,
    onReplayAutomation: handleReplayAutomation,
  }), [contextValue, handleDeleteSession, sources, skills, activeSessionWorkingDirectory, displayLabelConfigs, handleSessionLabelsChange, effectiveSessionStatuses, handleSessionSourcesChange, handleJumpToTaskSessions, requestProjectCreation, workbenchHeaderButton, isAutoCompact, searchActive, searchQuery, handleChatMatchInfoChange, handleTestAutomation, handleToggleAutomation, handleDuplicateAutomation, handleDeleteAutomation, automationTestResults, getAutomationHistory, handleReplayAutomation])



  return (
    <AppShellProvider value={appShellContextValue}>
        {/* === TOP BAR === */}
        <TopBar
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSelectWorkspace={onSelectWorkspace}
          workspaceUnreadMap={workspaceUnreadMap}
          onWorkspaceCreated={() => onRefreshWorkspaces?.()}
          onWorkspaceRemoved={() => onRefreshWorkspaces?.()}
          activeSessionId={effectiveSessionId}
          onNewChat={() => handleNewChat()}
          onNewWindow={() => window.electronAPI.menuNewWindow()}
          onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
          onOpenSettings={onOpenSettings}
          onOpenSettingsSubpage={handleSettingsClick}
          onOpenKeyboardShortcuts={onOpenKeyboardShortcuts}
          onOpenStoredUserPreferences={onOpenStoredUserPreferences}
          onOpenWhatsNew={handleWhatsNewClick}
          hasUnseenReleaseNotes={hasUnseenReleaseNotes}
          onToggleSidebar={handleToggleSidebar}
          onToggleFocusMode={() => setIsSidebarAndNavigatorHidden(prev => !prev)}
          isCompact={isAutoCompact}
          sidebarAriaPressed={sidebarProjection.ariaPressed}
          sidebarProjection={sidebarProjection}
        />
        <GlobalSearchDialog
          open={globalSearchOpen}
          onOpenChange={setGlobalSearchOpen}
          workspaces={workspaces}
          sessions={allSessionMetas.filter(isSessionListVisible)}
          onOpenSession={handleGlobalSearchSession}
          onOpenFile={onOpenFile}
          onNavigate={route => navigate(route)}
        />

      {/* === OUTER LAYOUT: Unified Panel Stack | Right Sidebar ===
          Keep Craft's single shell geometry authority: one shared gap separates
          adjacent panels and one shared inset clears every desktop window edge.
          The left global sidebar alone reserves the native titlebar controls. */}
      <div
        ref={shellRef}
        className="flex items-stretch relative"
        style={{
          height: '100%',
          paddingTop: isAutoCompact ? 0 : PANEL_TOP_EDGE_INSET,
          paddingRight: isAutoCompact ? 0 : PANEL_RIGHT_EDGE_INSET,
          paddingBottom: isAutoCompact ? 0 : PANEL_BOTTOM_EDGE_INSET,
          paddingLeft: 0,
          gap: PANEL_GAP,
        }}
      >
        <PanelStackContainer
          sidebarSlot={
            <div
              ref={sidebarRef}
              style={{ width: sidebarWidth }}
              className="h-full font-sans relative"
              data-focus-zone="sidebar"
              tabIndex={sidebarFocused ? 0 : -1}
              onKeyDown={handleSidebarKeyDown}
            >
            <div
              className="flex h-full flex-col select-none"
              style={{ paddingTop: 'var(--topbar-height)' }}
            >
              {/* Sidebar Top Section */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* New Session Button - Gmail-style, with context menu for "Open in New Window" */}
                <div className="px-2 pb-2 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <ContextMenu modal={true}>
                          <ContextMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              onClick={(e) => handleNewChat(e.metaKey || e.ctrlKey)}
                              className="w-full justify-start gap-2 py-[7px] px-2 text-[13px] font-normal rounded-[6px] shadow-minimal bg-background"
                              data-tutorial="new-chat-button"
                            >
                              <SquarePenRounded className="h-3.5 w-3.5 shrink-0" />
                              {t("sidebar.newTask")}
                            </Button>
                          </ContextMenuTrigger>
                          <StyledContextMenuContent>
                            <ContextMenuProvider>
                              <SidebarMenu type="newSession" />
                            </ContextMenuProvider>
                          </StyledContextMenuContent>
                        </ContextMenu>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">{newChatHotkey}</TooltipContent>
                  </Tooltip>
                </div>
                {/* Primary Nav: Search (own section) | tools | 项目 | 对话 | Settings.
                    Global search reuses LeftSidebar row chrome + GlobalSearchDialog — no custom bar. */}
                {/* pb-4 provides clearance so the last item scrolls above the mask-fade-bottom gradient */}
                <div className="flex-1 overflow-y-auto min-h-0 mask-fade-bottom pb-4">
                <LeftSidebar
                  isCollapsed={false}
                  getItemProps={getSidebarItemProps}
                  focusedItemId={focusedSidebarItemId}
                  links={[
                    // --- Global search (separate section above Sources; same SidebarButton language) ---
                    {
                      id: "nav:search",
                      title: t("sidebar.search"),
                      icon: Search,
                      variant: "ghost",
                      onClick: () => setGlobalSearchOpen(true),
                      dataTutorial: "global-search-button",
                      // Same trailing slot as source/skill counts — hotkey when known
                      label: globalSearchHotkey || undefined,
                    },
                    { id: "separator:search-tools", type: "separator" },
                    // --- Sources & Skills Section ---
                    {
                      id: "nav:sources",
                      title: t("sidebar.sources"),
                      label: String(sources.length),
                      icon: DatabaseZap,
                      variant: (isSourcesNavigation(navState) && !sourceFilter) ? "default" : "ghost",
                      onClick: handleSourcesClick,
                      dataTutorial: "sources-nav",
                      expandable: true,
                      expanded: isExpanded('nav:sources'),
                      onToggle: () => toggleExpanded('nav:sources'),
                      contextMenu: {
                        type: 'sources',
                        onAddSource: () => openAddSource(),
                      },
                      items: [
                        {
                          id: "nav:sources:api",
                          title: t("sidebar.apis"),
                          label: String(sourceTypeCounts.api),
                          icon: Globe,
                          variant: (sourceFilter?.kind === 'type' && sourceFilter.sourceType === 'api') ? "default" : "ghost",
                          onClick: handleSourcesApiClick,
                          contextMenu: {
                            type: 'sources' as const,
                            onAddSource: () => openAddSource('api'),
                            sourceType: 'api',
                          },
                        },
                        {
                          id: "nav:sources:mcp",
                          title: t("sidebar.mcps"),
                          label: String(sourceTypeCounts.mcp),
                          icon: <McpIcon className="h-3.5 w-3.5" />,
                          variant: (sourceFilter?.kind === 'type' && sourceFilter.sourceType === 'mcp') ? "default" : "ghost",
                          onClick: handleSourcesMcpClick,
                          contextMenu: {
                            type: 'sources' as const,
                            onAddSource: () => openAddSource('mcp'),
                            sourceType: 'mcp',
                          },
                        },
                      ],
                    },
                    {
                      id: "nav:skills",
                      title: t("sidebar.skills"),
                      label: String(skills.length),
                      icon: Zap,
                      variant: isSkillsNavigation(navState) ? "default" : "ghost",
                      onClick: handleSkillsClick,
                      contextMenu: {
                        type: 'skills',
                        onAddSkill: openAddSkill,
                      },
                    },
                    {
                      id: "nav:automations",
                      title: t("sidebar.automations"),
                      label: String(automations.length),
                      icon: ListTodo,
                      variant: (isAutomationsNavigation(navState) && !automationFilter) ? "default" : "ghost",
                      onClick: handleAutomationsClick,
                      expandable: true,
                      expanded: isExpanded('nav:automations'),
                      onToggle: () => toggleExpanded('nav:automations'),
                      contextMenu: {
                        type: 'automations' as const,
                        onAddAutomation: openAddAutomation,
                      },
                      items: [
                        {
                          id: "nav:automations:scheduled",
                          title: t("sidebar.scheduled"),
                          label: String(automationTypeCounts.scheduled),
                          icon: Clock,
                          variant: (automationFilter?.kind === 'type' && automationFilter.automationType === 'scheduled') ? "default" : "ghost",
                          onClick: handleAutomationsScheduledClick,
                          contextMenu: { type: 'automations' as const, onAddAutomation: openAddAutomation },
                        },
                        {
                          id: "nav:automations:event",
                          title: t("sidebar.eventBased"),
                          label: String(automationTypeCounts.event),
                          icon: Radio,
                          variant: (automationFilter?.kind === 'type' && automationFilter.automationType === 'event') ? "default" : "ghost",
                          onClick: handleAutomationsEventClick,
                          contextMenu: { type: 'automations' as const, onAddAutomation: openAddAutomation },
                        },
                        {
                          id: "nav:automations:agentic",
                          title: t("sidebar.agentic"),
                          label: String(automationTypeCounts.agentic),
                          icon: Bot,
                          variant: (automationFilter?.kind === 'type' && automationFilter.automationType === 'agentic') ? "default" : "ghost",
                          onClick: handleAutomationsAgenticClick,
                          contextMenu: { type: 'automations' as const, onAddAutomation: openAddAutomation },
                        },
                      ],
                    },
                    { id: "separator:tools-projects", type: "separator" },
                    {
                      id: "nav:projects",
                      title: t("sidebar.projects"),
                      // This is a disclosure heading, not a second Project home.
                      // Pointer and unified keyboard activation both toggle this same branch.
                      variant: "ghost" as const,
                      onClick: () => toggleExpanded('nav:projects'),
                      expandable: workspaceProjectItems.length > 0,
                      expanded: isExpanded('nav:projects'),
                      onToggle: () => toggleExpanded('nav:projects'),
                      contextMenu: {
                        type: 'projects' as const,
                        onAddProject: openProjectCreateLocal,
                        onAddCloudProject: openProjectCreateCloud,
                        // R1: Project home for folder-projects is Project Settings (Workspace
                        // authority), not the nested v0.11 projects list.
                        onManageProjects: () => navigate(routes.view.settings('workspace')),
                      },
                      // Create and more are independent controls; neither activates the heading.
                      trailingAction: (
                        <>
                          <button
                            type="button"
                            className={sidebarTrailingIconButtonClassName}
                            aria-label={t('sidebar.newProject')}
                            title={t('sidebar.newProject')}
                            onClick={(event) => {
                              event.stopPropagation()
                              openProjectCreateLocal()
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className={sidebarTrailingIconButtonClassName}
                                aria-label={t('common.more')}
                                title={t('common.more')}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <StyledDropdownMenuContent align="start" side="right">
                              <DropdownMenuProvider>
                                <SidebarMenu
                                  type="projects"
                                  onAddProject={openProjectCreateLocal}
                                  onAddCloudProject={openProjectCreateCloud}
                                  onManageProjects={() => navigate(routes.view.settings('workspace'))}
                                />
                              </DropdownMenuProvider>
                            </StyledDropdownMenuContent>
                          </DropdownMenu>
                        </>
                      ),
                      trailingActionSlots: 2,
                      items: workspaceProjectItems,
                    },
                    // Folder-less work is a sibling of Projects (R1 clause 1). Click = list all unbound.
                    {
                      id: "nav:conversations",
                      title: t("sidebar.conversations"),
                      icon: MessageSquareText,
                      // Exclusive like 自动化: header only when 对话 list is open without a session leaf.
                      variant: (
                        sessionFilter?.kind === 'conversations' && !hasSessionDetail
                          ? "default"
                          : "ghost"
                      ) as "default" | "ghost",
                      onClick: handleConversationsClick,
                      expandable: unboundSessionItems.length > 0,
                      expanded: isExpanded('nav:conversations'),
                      onToggle: () => toggleExpanded('nav:conversations'),
                      // Same trailing "+" slot/hover language as 项目; creates folder-less work.
                      trailingAction: (
                        <button
                          type="button"
                          className={sidebarTrailingIconButtonClassName}
                          aria-label={t('sidebar.newConversation')}
                          title={t('sidebar.newConversation')}
                          onClick={(event) => {
                            event.stopPropagation()
                            setSearchActive(false)
                            setSearchQuery('')
                            navigate(routes.action.newSession({ workdir: 'none' }))
                            setTimeout(() => focusZone('chat', { intent: 'programmatic' }), 50)
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      ),
                      items: unboundSessionItems,
                    },
                  ]}
                />
                {/* Agent Tree: Hierarchical list of agents */}
                {/* Agents section removed */}
                </div>
                <div className="shrink-0 border-t border-foreground/5">
                  <LeftSidebar
                    isCollapsed={false}
                    getItemProps={getSidebarItemProps}
                    focusedItemId={focusedSidebarItemId}
                    links={[{
                      id: "nav:settings",
                      title: t("sidebar.settings"),
                      icon: Settings,
                      variant: isSettingsNavigation(navState) ? "default" : "ghost",
                      onClick: () => handleSettingsClick(),
                    }]}
                  />
                </div>
              </div>

            </div>
          </div>
          }
          sidebarWidth={layoutSidebarWidth}
          navigatorSlot={isNavigatorPanelNeeded ? (
            <div
              style={{ width: isAutoCompact ? '100%' : sessionListWidth }}
              className="h-full flex flex-col min-w-0 relative z-panel"
            >
            <PanelHeader
              title={sidebarProjection.titleFromSidebar ? listTitle : undefined}
              compensateForStoplight={sidebarProjection.compensateForStoplight}
              badge={automationFilter?.automationType === 'scheduled' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground/50 cursor-default flex items-center titlebar-no-drag">
                      <Info className="h-3 w-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px]">
                    Scheduling requires your machine to be running. It can be locked, but must be powered on.
                  </TooltipContent>
                </Tooltip>
              ) : undefined}
              actions={
                <>
                  {/* List filter only — global search lives in the left sidebar above Sources. */}
                  {isSessionsNavigation(navState) && (
                    isAutoCompact ? (
                      <CompactSessionListFilter
                        listFilter={listFilter}
                        setListFilter={setListFilter}
                        labelFilter={labelFilter}
                        setLabelFilter={setLabelFilter}
                        pinnedFilters={pinnedFilters}
                        effectiveSessionStatuses={effectiveSessionStatuses}
                        displayLabelConfigs={displayLabelConfigs}
                        labelConfigs={labelConfigs}
                        chatGroupingMode={chatGroupingMode}
                        setChatGroupingMode={setChatGroupingMode}
                        isStateSubView={isStateSubView}
                        onOpenSearch={() => setSearchActive(true)}
                      />
                    ) : (
                    <DropdownMenu onOpenChange={(open) => { if (!open) { setFilterDropdownQuery(''); setFilterAltHeld(false) } }}>
                      <DropdownMenuTrigger asChild>
                        <HeaderIconButton
                          icon={<ListFilter className="h-4 w-4" />}
                          data-session-filter-trigger
                          className={(listFilter.size > 0 || labelFilter.size > 0 || projectFilter.size > 0) ? "bg-accent/5 text-accent rounded-[8px] shadow-tinted" : "rounded-[8px]"}
                          style={(listFilter.size > 0 || labelFilter.size > 0 || projectFilter.size > 0) ? { '--shadow-color': 'var(--accent-rgb)' } as React.CSSProperties : undefined}
                        />
                      </DropdownMenuTrigger>
                      <StyledDropdownMenuContent
                        align="end"
                        light
                        minWidth="min-w-[200px]"
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === 'Alt') setFilterAltHeld(true)
                          // When on the first menu item and pressing Up, refocus the search input
                          if (e.key === 'ArrowUp' && !filterDropdownQuery.trim()) {
                            const menu = (e.target as HTMLElement).closest('[role="menu"]')
                            const items = menu?.querySelectorAll('[role="menuitem"]')
                            if (items && items.length > 0 && document.activeElement === items[0]) {
                              e.preventDefault()
                              e.stopPropagation()
                              filterDropdownInputRef.current?.focus()
                            }
                          }
                        }}
                        onKeyUp={(e: React.KeyboardEvent) => {
                          if (e.key === 'Alt') setFilterAltHeld(false)
                        }}
                      >
                        {/* Header with title and clear button (only clears user-added filters, never pinned) */}
                        <div className="flex items-center justify-between px-2 py-1.5">
                          <span className="text-xs font-medium text-muted-foreground">{t("sidebar.filterChats")}</span>
                          {(listFilter.size > 0 || labelFilter.size > 0 || projectFilter.size > 0) && (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                setListFilter(new Map())
                                setLabelFilter(new Map())
                                setProjectFilter(new Map())
                              }}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              {t("common.clear")}
                            </button>
                          )}
                        </div>

                        {/* Search input — typing switches from hierarchical submenus to a flat filtered list.
                            stopPropagation prevents Radix from intercepting keys. Arrow/Enter handled for navigation. */}
                        <div className="px-1 pb-3 border-b border-foreground/5">
                          <div className="bg-background rounded-[6px] shadow-minimal px-2 py-1.5">
                            <input
                              ref={filterDropdownInputRef}
                              type="text"
                              value={filterDropdownQuery}
                              onChange={(e) => setFilterDropdownQuery(e.target.value)}
                              onKeyDown={(e) => {
                                // When input is empty, let ArrowDown/ArrowUp blur the input
                                // so Radix's native menu keyboard navigation takes over
                                if (!filterDropdownQuery.trim() && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                                  e.preventDefault()
                                  ;(e.target as HTMLInputElement).blur()
                                  // Focus the first menu item so Radix's keyboard navigation activates
                                  const menu = (e.target as HTMLElement).closest('[role="menu"]')
                                  const firstItem = menu?.querySelector('[role="menuitem"]') as HTMLElement | null
                                  firstItem?.focus()
                                  return
                                }
                                e.stopPropagation()
                                const { states: ms, labels: ml } = filterDropdownResults
                                const total = ms.length + ml.length
                                if (total === 0) return
                                switch (e.key) {
                                  case 'ArrowDown':
                                    e.preventDefault()
                                    setFilterDropdownSelectedIdx(prev => (prev < total - 1 ? prev + 1 : 0))
                                    break
                                  case 'ArrowUp':
                                    e.preventDefault()
                                    setFilterDropdownSelectedIdx(prev => (prev > 0 ? prev - 1 : total - 1))
                                    break
                                  case 'Enter': {
                                    e.preventDefault()
                                    const mode: FilterMode = e.altKey ? 'exclude' : 'include'
                                    const idx = filterDropdownSelectedIdx
                                    if (idx < ms.length) {
                                      // Toggle a status filter
                                      const state = ms[idx]
                                      if (state.id !== pinnedFilters.pinnedStatusId) {
                                        setListFilter(prev => {
                                          const next = new Map(prev)
                                          if (next.has(state.id)) next.delete(state.id)
                                          else next.set(state.id, mode)
                                          return next
                                        })
                                      }
                                    } else {
                                      // Toggle a label filter
                                      const item = ml[idx - ms.length]
                                      if (item && item.id !== pinnedFilters.pinnedLabelId) {
                                        setLabelFilter(prev => {
                                          const next = new Map(prev)
                                          if (next.has(item.id)) next.delete(item.id)
                                          else next.set(item.id, mode)
                                          return next
                                        })
                                      }
                                    }
                                    break
                                  }
                                }
                              }}
                              placeholder={t("sidebar.searchStatusesLabels")}
                              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* ── Conditional body: hierarchical (no query) vs flat filtered list (has query) ── */}
                        {filterDropdownQuery.trim() === '' ? (
                          <>
                            {/* === HIERARCHICAL MODE (default) === */}

                            <StyledDropdownMenuItem onClick={handleMarkFilteredSessionsRead}>
                              <CheckCheck className="h-3.5 w-3.5" />
                              <span className="flex-1">{t("sidebarMenu.markAllRead")}</span>
                            </StyledDropdownMenuItem>
                            <StyledDropdownMenuSeparator />

                            {/* Active filter chips: pinned (non-removable) + user-added (removable) */}
                            {(pinnedFilters.pinnedFlagged || pinnedFilters.pinnedStatusId || pinnedFilters.pinnedLabelId || listFilter.size > 0 || labelFilter.size > 0 || projectFilter.size > 0) && (
                              <>
                                {/* Pinned: flagged */}
                                {pinnedFilters.pinnedFlagged && (
                                  <StyledDropdownMenuItem disabled>
                                    <FilterMenuRow
                                      icon={<Flag className="h-3.5 w-3.5" />}
                                      label={t("sidebar.flagged")}
                                      accessory={<Check className="h-3 w-3 text-muted-foreground" />}
                                    />
                                  </StyledDropdownMenuItem>
                                )}
                                {/* Pinned: status from state view */}
                                {(() => {
                                  if (!pinnedFilters.pinnedStatusId) return null
                                  const state = effectiveSessionStatuses.find(s => s.id === pinnedFilters.pinnedStatusId)
                                  if (!state) return null
                                  return (
                                    <StyledDropdownMenuItem disabled key={`pinned-status-${state.id}`}>
                                      <FilterMenuRow
                                        icon={state.icon}
                                        label={getLocalizedStatusLabel(t, state)}
                                        accessory={<Check className="h-3 w-3 text-muted-foreground" />}
                                        iconStyle={state.iconColorable ? { color: state.resolvedColor } : undefined}
                                        noIconContainer
                                      />
                                    </StyledDropdownMenuItem>
                                  )
                                })()}
                                {/* Pinned: label from label view */}
                                {(() => {
                                  if (!pinnedFilters.pinnedLabelId) return null
                                  const label = findLabelById(labelConfigs, pinnedFilters.pinnedLabelId)
                                  if (!label) return null
                                  return (
                                    <StyledDropdownMenuItem disabled key={`pinned-label-${label.id}`}>
                                      <FilterMenuRow
                                        icon={<LabelIcon label={label} size="lg" />}
                                        label={getLocalizedLabelName(t, label)}
                                        accessory={<Check className="h-3 w-3 text-muted-foreground" />}
                                      />
                                    </StyledDropdownMenuItem>
                                  )
                                })()}
                                {/* User-added: selected statuses with mode pill (include/exclude) */}
                                {effectiveSessionStatuses.filter(s => listFilter.has(s.id)).map(state => {
                                  const applyColor = state.iconColorable
                                  const mode = listFilter.get(state.id)!
                                  return (
                                    <DropdownMenuSub key={`sel-status-${state.id}`}>
                                      <StyledDropdownMenuSubTrigger onClick={(e) => { e.preventDefault(); setListFilter(prev => { const next = new Map(prev); next.delete(state.id); return next }) }}>
                                        <FilterMenuRow
                                          icon={state.icon}
                                          label={getLocalizedStatusLabel(t, state)}
                                          accessory={<FilterModeBadge mode={mode} />}
                                          iconStyle={applyColor ? { color: state.resolvedColor } : undefined}
                                          noIconContainer
                                        />
                                      </StyledDropdownMenuSubTrigger>
                                      <StyledDropdownMenuSubContent minWidth="min-w-[140px]">
                                        <FilterModeSubMenuItems
                                          mode={mode}
                                          onChangeMode={(newMode) => setListFilter(prev => {
                                            const next = new Map(prev)
                                            next.set(state.id, newMode)
                                            return next
                                          })}
                                          onRemove={() => setListFilter(prev => {
                                            const next = new Map(prev)
                                            next.delete(state.id)
                                            return next
                                          })}
                                        />
                                      </StyledDropdownMenuSubContent>
                                    </DropdownMenuSub>
                                  )
                                })}
                                {/* User-added: selected labels with mode pill (include/exclude) */}
                                {Array.from(labelFilter).map(([labelId, mode]) => {
                                  const label = findLabelById(labelConfigs, labelId)
                                  if (!label) return null
                                  return (
                                    <DropdownMenuSub key={`sel-label-${labelId}`}>
                                      <StyledDropdownMenuSubTrigger onClick={(e) => { e.preventDefault(); setLabelFilter(prev => { const next = new Map(prev); next.delete(labelId); return next }) }}>
                                        <FilterMenuRow
                                          icon={<LabelIcon label={label} size="lg" />}
                                          label={getLocalizedLabelName(t, label)}
                                          accessory={<FilterModeBadge mode={mode} />}
                                        />
                                      </StyledDropdownMenuSubTrigger>
                                      <StyledDropdownMenuSubContent minWidth="min-w-[140px]">
                                        <FilterModeSubMenuItems
                                          mode={mode}
                                          onChangeMode={(newMode) => setLabelFilter(prev => {
                                            const next = new Map(prev)
                                            next.set(labelId, newMode)
                                            return next
                                          })}
                                          onRemove={() => setLabelFilter(prev => {
                                            const next = new Map(prev)
                                            next.delete(labelId)
                                            return next
                                          })}
                                        />
                                      </StyledDropdownMenuSubContent>
                                    </DropdownMenuSub>
                                  )
                                })}
                                {/* User-added: selected projects with mode pill (include/exclude) */}
                                {Array.from(projectFilter).map(([projectId, mode]) => {
                                  const project = projectMenuOptions.find(p => p.id === projectId)
                                  if (!project) return null
                                  return (
                                    <DropdownMenuSub key={`sel-project-${projectId}`}>
                                      <StyledDropdownMenuSubTrigger onClick={(e) => { e.preventDefault(); setProjectFilter(prev => { const next = new Map(prev); next.delete(projectId); return next }) }}>
                                        <FilterMenuRow
                                          icon={<FolderKanban className="h-3.5 w-3.5" />}
                                          label={project.name}
                                          accessory={<FilterModeBadge mode={mode} />}
                                        />
                                      </StyledDropdownMenuSubTrigger>
                                      <StyledDropdownMenuSubContent minWidth="min-w-[140px]">
                                        <FilterModeSubMenuItems
                                          mode={mode}
                                          onChangeMode={(newMode) => setProjectFilter(prev => {
                                            const next = new Map(prev)
                                            next.set(projectId, newMode)
                                            return next
                                          })}
                                          onRemove={() => setProjectFilter(prev => {
                                            const next = new Map(prev)
                                            next.delete(projectId)
                                            return next
                                          })}
                                        />
                                      </StyledDropdownMenuSubContent>
                                    </DropdownMenuSub>
                                  )
                                })}
                                <StyledDropdownMenuSeparator />
                              </>
                            )}

                            {/* Saved views are filters over the same task list, not another
                                conversation home in the sidebar. */}
                            <DropdownMenuSub>
                              <StyledDropdownMenuSubTrigger>
                                <Layers className="h-3.5 w-3.5" />
                                <span className="flex-1">{t("sidebar.views")}</span>
                              </StyledDropdownMenuSubTrigger>
                              <StyledDropdownMenuSubContent minWidth="min-w-[180px]">
                                {viewConfigs.map(view => (
                                  <StyledDropdownMenuItem
                                    key={view.id}
                                    onClick={() => handleViewClick(view.id)}
                                  >
                                    <Layers className="h-3.5 w-3.5" />
                                    <span className="flex-1">{view.name}</span>
                                    {sessionFilter?.kind === 'view' && sessionFilter.viewId === view.id && (
                                      <Check className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </StyledDropdownMenuItem>
                                ))}
                                {viewConfigs.length > 0 && <StyledDropdownMenuSeparator />}
                                <StyledDropdownMenuItem onClick={openConfigureViews}>
                                  <Settings className="h-3.5 w-3.5" />
                                  <span className="flex-1">{t("sidebarMenu.editViews")}</span>
                                </StyledDropdownMenuItem>
                              </StyledDropdownMenuSubContent>
                            </DropdownMenuSub>

                            {/* Statuses submenu - hierarchical with toggle selection */}
                            <DropdownMenuSub>
                              <StyledDropdownMenuSubTrigger>
                                <Inbox className="h-3.5 w-3.5" />
                                <span className="flex-1">{t("sidebar.statuses")}</span>
                              </StyledDropdownMenuSubTrigger>
                              <StyledDropdownMenuSubContent minWidth="min-w-[180px]">
                                {effectiveSessionStatuses.map(state => {
                                  const applyColor = state.iconColorable
                                  const isPinned = state.id === pinnedFilters.pinnedStatusId
                                  const currentMode = listFilter.get(state.id)
                                  const isActive = !!currentMode && !isPinned
                                  // Active status → DropdownMenuSub with mode options (Radix safe-triangle hover)
                                  if (isActive) {
                                    return (
                                      <DropdownMenuSub key={state.id}>
                                        <StyledDropdownMenuSubTrigger onClick={(e) => { e.preventDefault(); setListFilter(prev => { const next = new Map(prev); next.delete(state.id); return next }) }}>
                                          <FilterMenuRow
                                            icon={state.icon}
                                            label={getLocalizedStatusLabel(t, state)}
                                            accessory={<FilterModeBadge mode={currentMode} />}
                                            iconStyle={applyColor ? { color: state.resolvedColor } : undefined}
                                            noIconContainer
                                          />
                                        </StyledDropdownMenuSubTrigger>
                                        <StyledDropdownMenuSubContent minWidth="min-w-[140px]">
                                          <FilterModeSubMenuItems
                                            mode={currentMode}
                                            onChangeMode={(newMode) => setListFilter(prev => {
                                              const next = new Map(prev)
                                              next.set(state.id, newMode)
                                              return next
                                            })}
                                            onRemove={() => setListFilter(prev => {
                                              const next = new Map(prev)
                                              next.delete(state.id)
                                              return next
                                            })}
                                          />
                                        </StyledDropdownMenuSubContent>
                                      </DropdownMenuSub>
                                    )
                                  }
                                  // Inactive / pinned status → simple toggleable item
                                  return (
                                    <AltExcludeTooltip key={state.id} show={filterAltHeld && !isPinned}>
                                      <StyledDropdownMenuItem
                                        disabled={isPinned}
                                        onClick={(e) => {
                                          if (isPinned) return
                                          e.preventDefault()
                                          setListFilter(prev => {
                                            const next = new Map(prev)
                                            if (next.has(state.id)) next.delete(state.id)
                                            else next.set(state.id, e.altKey ? 'exclude' : 'include')
                                            return next
                                          })
                                        }}
                                      >
                                        <FilterMenuRow
                                          icon={state.icon}
                                          label={getLocalizedStatusLabel(t, state)}
                                          accessory={isPinned ? <Check className="h-3 w-3 text-muted-foreground" /> : null}
                                          iconStyle={applyColor ? { color: state.resolvedColor } : undefined}
                                          noIconContainer
                                        />
                                      </StyledDropdownMenuItem>
                                    </AltExcludeTooltip>
                                  )
                                })}
                                <StyledDropdownMenuSeparator />
                                <StyledDropdownMenuItem onClick={openConfigureStatuses}>
                                  <Settings className="h-3.5 w-3.5" />
                                  <span className="flex-1">{t("sidebarMenu.configureStatuses")}</span>
                                </StyledDropdownMenuItem>
                              </StyledDropdownMenuSubContent>
                            </DropdownMenuSub>

                            {/* Labels submenu - hierarchical tree with recursive submenus */}
                            <DropdownMenuSub>
                              <StyledDropdownMenuSubTrigger>
                                <Tag className="h-3.5 w-3.5" />
                                <span className="flex-1">{t("sidebar.labels")}</span>
                              </StyledDropdownMenuSubTrigger>
                              <StyledDropdownMenuSubContent minWidth="min-w-[180px]">
                                {labelConfigs.length === 0 ? (
                                  <StyledDropdownMenuItem disabled>
                                    <span className="text-muted-foreground">{t("table.noLabelsConfigured")}</span>
                                  </StyledDropdownMenuItem>
                                ) : (
                                  <FilterLabelItems
                                    labels={displayLabelConfigs}
                                    labelFilter={labelFilter}
                                    setLabelFilter={setLabelFilter}
                                    pinnedLabelId={pinnedFilters.pinnedLabelId}
                                    altHeld={filterAltHeld}
                                  />
                                )}
                                <StyledDropdownMenuSeparator />
                                <StyledDropdownMenuItem onClick={() => navigate(routes.view.settings('expert-kits'))}>
                                  <Settings className="h-3.5 w-3.5" />
                                  <span className="flex-1">{t("sidebarMenu.editLabels")}</span>
                                </StyledDropdownMenuItem>
                              </StyledDropdownMenuSubContent>
                            </DropdownMenuSub>

                            {/* Projects submenu - flat list of workspace projects */}
                            {!R1_HIDE_NESTED_PROJECT_FILTER_UI && projectMenuOptions.length > 0 && (
                              <DropdownMenuSub>
                                <StyledDropdownMenuSubTrigger>
                                  <FolderKanban className="h-3.5 w-3.5" />
                                  <span className="flex-1">{t("sidebar.projects")}</span>
                                </StyledDropdownMenuSubTrigger>
                                <StyledDropdownMenuSubContent minWidth="min-w-[180px]">
                                  {projectMenuOptions.map(project => {
                                    const currentMode = projectFilter.get(project.id)
                                    const isActive = !!currentMode
                                    if (isActive) {
                                      return (
                                        <DropdownMenuSub key={project.id}>
                                          <StyledDropdownMenuSubTrigger onClick={(e) => { e.preventDefault(); setProjectFilter(prev => { const next = new Map(prev); next.delete(project.id); return next }) }}>
                                            <FilterMenuRow
                                              icon={<FolderKanban className="h-3.5 w-3.5" />}
                                              label={project.name}
                                              accessory={<FilterModeBadge mode={currentMode} />}
                                            />
                                          </StyledDropdownMenuSubTrigger>
                                          <StyledDropdownMenuSubContent minWidth="min-w-[140px]">
                                            <FilterModeSubMenuItems
                                              mode={currentMode}
                                              onChangeMode={(newMode) => setProjectFilter(prev => {
                                                const next = new Map(prev)
                                                next.set(project.id, newMode)
                                                return next
                                              })}
                                              onRemove={() => setProjectFilter(prev => {
                                                const next = new Map(prev)
                                                next.delete(project.id)
                                                return next
                                              })}
                                            />
                                          </StyledDropdownMenuSubContent>
                                        </DropdownMenuSub>
                                      )
                                    }
                                    return (
                                      <AltExcludeTooltip key={project.id} show={filterAltHeld}>
                                        <StyledDropdownMenuItem
                                          onClick={(e) => {
                                            e.preventDefault()
                                            setProjectFilter(prev => {
                                              const next = new Map(prev)
                                              if (next.has(project.id)) next.delete(project.id)
                                              else next.set(project.id, e.altKey ? 'exclude' : 'include')
                                              return next
                                            })
                                          }}
                                        >
                                          <FilterMenuRow
                                            icon={<FolderKanban className="h-3.5 w-3.5" />}
                                            label={project.name}
                                          />
                                        </StyledDropdownMenuItem>
                                      </AltExcludeTooltip>
                                    )
                                  })}
                                </StyledDropdownMenuSubContent>
                              </DropdownMenuSub>
                            )}

                            {/* Group by submenu - hidden in state sub-views (always date there) */}
                            {!isStateSubView && (
                              <>
                                <StyledDropdownMenuSeparator />
                                <DropdownMenuSub>
                                  <StyledDropdownMenuSubTrigger>
                                    <Layers className="h-3.5 w-3.5" />
                                    <span className="flex-1">{t("sidebar.group")}</span>
                                  </StyledDropdownMenuSubTrigger>
                                  <StyledDropdownMenuSubContent minWidth="min-w-[140px]">
                                    <StyledDropdownMenuItem onClick={() => setChatGroupingMode('date')}>
                                      <Calendar className="h-3.5 w-3.5" />
                                      <span className="flex-1">{t("sidebar.groupByDate")}</span>
                                      {chatGroupingMode === 'date' && <Check className="h-3 w-3 text-muted-foreground" />}
                                    </StyledDropdownMenuItem>
                                    <StyledDropdownMenuItem onClick={() => setChatGroupingMode('status')}>
                                      <Inbox className="h-3.5 w-3.5" />
                                      <span className="flex-1">{t("sidebar.groupByStatus")}</span>
                                      {chatGroupingMode === 'status' && <Check className="h-3 w-3 text-muted-foreground" />}
                                    </StyledDropdownMenuItem>
                                    <StyledDropdownMenuItem onClick={() => setChatGroupingMode('unread')}>
                                      <MailOpen className="h-3.5 w-3.5" />
                                      <span className="flex-1">{t("sidebar.groupByUnread")}</span>
                                      {chatGroupingMode === 'unread' && <Check className="h-3 w-3 text-muted-foreground" />}
                                    </StyledDropdownMenuItem>
                                    {(projectMenuOptions.length > 0 || isProjectOverview || workspaces.length > 0) && (
                                      <StyledDropdownMenuItem onClick={() => setChatGroupingMode('project')}>
                                        <FolderKanban className="h-3.5 w-3.5" />
                                        <span className="flex-1">{t("sidebar.groupByProject")}</span>
                                        {chatGroupingMode === 'project' && <Check className="h-3 w-3 text-muted-foreground" />}
                                      </StyledDropdownMenuItem>
                                    )}
                                  </StyledDropdownMenuSubContent>
                                </DropdownMenuSub>
                              </>
                            )}

                            <StyledDropdownMenuSeparator />
                            <StyledDropdownMenuItem
                              onClick={() => {
                                setSearchActive(true)
                              }}
                            >
                              <Search className="h-3.5 w-3.5" />
                              <span className="flex-1">{t("sidebar.search")}</span>
                            </StyledDropdownMenuItem>
                          </>
                        ) : (
                          <>
                            {/* === FLAT FILTERED MODE (has query) ===
                                Uses the same filter/score logic as the # inline menu.
                                Shows matching statuses and labels in a single flat list.
                                Supports keyboard navigation (ArrowUp/Down/Enter in input). */}
                            {filterDropdownResults.states.length === 0 && filterDropdownResults.labels.length === 0 ? (
                              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                                {t("chat.noResults")}
                              </div>
                            ) : (
                              <div ref={filterDropdownListRef} className="max-h-[240px] overflow-y-auto py-1">
                                {/* Matched statuses */}
                                {filterDropdownResults.states.length > 0 && (
                                  <>
                                    <div className="px-3 pt-1.5 pb-1 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                                      {t("sidebar.statuses")}
                                    </div>
                                    {filterDropdownResults.states.map((state, index) => {
                                      const applyColor = state.iconColorable
                                      const isPinned = state.id === pinnedFilters.pinnedStatusId
                                      const currentMode = listFilter.get(state.id)
                                      const isHighlighted = index === filterDropdownSelectedIdx
                                      const isActive = !!currentMode && !isPinned
                                      // Active status → DropdownMenuSub with mode options
                                      if (isActive) {
                                        return (
                                          <DropdownMenuSub key={`flat-status-${state.id}`}>
                                            <StyledDropdownMenuSubTrigger
                                              data-filter-selected={isHighlighted}
                                              onMouseEnter={() => setFilterDropdownSelectedIdx(index)}
                                              className={cn("mx-1", isHighlighted && "bg-foreground/5")}
                                              onClick={(e) => { e.preventDefault(); setListFilter(prev => { const next = new Map(prev); next.delete(state.id); return next }) }}
                                            >
                                              <FilterMenuRow
                                                icon={state.icon}
                                                label={getLocalizedStatusLabel(t, state)}
                                                accessory={<FilterModeBadge mode={currentMode} />}
                                                iconStyle={applyColor ? { color: state.resolvedColor } : undefined}
                                                noIconContainer
                                              />
                                            </StyledDropdownMenuSubTrigger>
                                            <StyledDropdownMenuSubContent minWidth="min-w-[140px]">
                                              <FilterModeSubMenuItems
                                                mode={currentMode}
                                                onChangeMode={(newMode) => setListFilter(prev => {
                                                  const next = new Map(prev)
                                                  next.set(state.id, newMode)
                                                  return next
                                                })}
                                                onRemove={() => setListFilter(prev => {
                                                  const next = new Map(prev)
                                                  next.delete(state.id)
                                                  return next
                                                })}
                                              />
                                            </StyledDropdownMenuSubContent>
                                          </DropdownMenuSub>
                                        )
                                      }
                                      // Inactive / pinned status → plain div with click-to-toggle
                                      return (
                                        <AltExcludeTooltip key={`flat-status-${state.id}`} show={filterAltHeld && !isPinned}>
                                          <div
                                            data-filter-selected={isHighlighted}
                                            onMouseEnter={() => setFilterDropdownSelectedIdx(index)}
                                            onClick={(e) => {
                                              if (isPinned) return
                                              e.preventDefault()
                                              setListFilter(prev => {
                                                const next = new Map(prev)
                                                if (next.has(state.id)) next.delete(state.id)
                                                else next.set(state.id, e.altKey ? 'exclude' : 'include')
                                                return next
                                              })
                                            }}
                                            className={cn(
                                              // SVG sizing matches StyledDropdownMenuSubTrigger so icons render at the same size
                                              "flex cursor-pointer select-none items-center gap-2 rounded-[4px] mx-1 px-2 py-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
                                              isHighlighted && "bg-foreground/5",
                                              isPinned && "opacity-50 pointer-events-none",
                                            )}
                                          >
                                            <FilterMenuRow
                                              icon={state.icon}
                                              label={getLocalizedStatusLabel(t, state)}
                                              accessory={isPinned ? <Check className="h-3 w-3 text-muted-foreground" /> : null}
                                              iconStyle={applyColor ? { color: state.resolvedColor } : undefined}
                                              noIconContainer
                                            />
                                          </div>
                                        </AltExcludeTooltip>
                                      )
                                    })}
                                  </>
                                )}
                                {/* Separator between sections */}
                                {filterDropdownResults.states.length > 0 && filterDropdownResults.labels.length > 0 && (
                                  <div className="my-1 mx-2 border-t border-border/40" />
                                )}
                                {/* Matched labels — flat list with parent breadcrumbs */}
                                {filterDropdownResults.labels.length > 0 && (
                                  <>
                                    <div className="px-3 pt-1.5 pb-1 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                                      {t("sidebar.labels")}
                                    </div>
                                    {filterDropdownResults.labels.map((item, index) => {
                                      // Offset by state count for unified index
                                      const flatIndex = filterDropdownResults.states.length + index
                                      const isPinned = item.id === pinnedFilters.pinnedLabelId
                                      const currentMode = labelFilter.get(item.id)
                                      const isHighlighted = flatIndex === filterDropdownSelectedIdx
                                      const isActive = !!currentMode && !isPinned
                                      const labelDisplay = item.parentPath
                                        ? <><span className="text-muted-foreground">{item.parentPath}</span>{item.label}</>
                                        : item.label
                                      // Active label → DropdownMenuSub with mode options
                                      if (isActive) {
                                        return (
                                          <DropdownMenuSub key={`flat-label-${item.id}`}>
                                            <StyledDropdownMenuSubTrigger
                                              data-filter-selected={isHighlighted}
                                              onMouseEnter={() => setFilterDropdownSelectedIdx(flatIndex)}
                                              className={cn("mx-1", isHighlighted && "bg-foreground/5")}
                                              onClick={(e) => { e.preventDefault(); setLabelFilter(prev => { const next = new Map(prev); next.delete(item.id); return next }) }}
                                            >
                                              <FilterMenuRow
                                                icon={<LabelIcon label={item.config} size="lg" />}
                                                label={labelDisplay}
                                                accessory={<FilterModeBadge mode={currentMode} />}
                                              />
                                            </StyledDropdownMenuSubTrigger>
                                            <StyledDropdownMenuSubContent minWidth="min-w-[140px]">
                                              <FilterModeSubMenuItems
                                                mode={currentMode}
                                                onChangeMode={(newMode) => setLabelFilter(prev => {
                                                  const next = new Map(prev)
                                                  next.set(item.id, newMode)
                                                  return next
                                                })}
                                                onRemove={() => setLabelFilter(prev => {
                                                  const next = new Map(prev)
                                                  next.delete(item.id)
                                                  return next
                                                })}
                                              />
                                            </StyledDropdownMenuSubContent>
                                          </DropdownMenuSub>
                                        )
                                      }
                                      // Inactive / pinned label → plain div with click-to-toggle
                                      return (
                                        <AltExcludeTooltip key={`flat-label-${item.id}`} show={filterAltHeld && !isPinned}>
                                          <div
                                            data-filter-selected={isHighlighted}
                                            onMouseEnter={() => setFilterDropdownSelectedIdx(flatIndex)}
                                            onClick={(e) => {
                                              if (isPinned) return
                                              e.preventDefault()
                                              setLabelFilter(prev => {
                                                const next = new Map(prev)
                                                if (next.has(item.id)) next.delete(item.id)
                                                else next.set(item.id, e.altKey ? 'exclude' : 'include')
                                                return next
                                              })
                                            }}
                                            className={cn(
                                              // SVG sizing matches StyledDropdownMenuSubTrigger so icons render at the same size
                                              "flex cursor-pointer select-none items-center gap-2 rounded-[4px] mx-1 px-2 py-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
                                              isHighlighted && "bg-foreground/5",
                                              isPinned && "opacity-50 pointer-events-none",
                                            )}
                                          >
                                            <FilterMenuRow
                                              icon={<LabelIcon label={item.config} size="lg" />}
                                              label={labelDisplay}
                                              accessory={isPinned ? <Check className="h-3 w-3 text-muted-foreground" /> : null}
                                            />
                                          </div>
                                        </AltExcludeTooltip>
                                      )
                                    })}
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </StyledDropdownMenuContent>
                    </DropdownMenu>
                    )
                  )}
                  {/* Add Source button (only for sources mode) - uses filter-aware edit config */}
                  {isSourcesNavigation(navState) && activeWorkspace && (
                    <EditPopover
                      trigger={
                        <HeaderIconButton
                          icon={<Plus className="h-4 w-4" />}
                          tooltip={t("sidebarMenu.addSource")}
                          data-tutorial="add-source-button"
                        />
                      }
                      {...getEditConfig(
                        sourceFilter?.kind === 'type' ? `add-source-${sourceFilter.sourceType}` as EditContextKey : 'add-source',
                        activeWorkspace.rootPath
                      )}
                    />
                  )}
                  {/* Add Skill button (only for skills mode) */}
                  {isSkillsNavigation(navState) && activeWorkspace && (
                    <EditPopover
                      trigger={
                        <HeaderIconButton
                          icon={<Plus className="h-4 w-4" />}
                          tooltip={t("sidebarMenu.addSkill")}
                          data-tutorial="add-skill-button"
                        />
                      }
                      {...getEditConfig('add-skill', activeWorkspace.rootPath)}
                    />
                  )}
                  {/* Add Automation button (only for automations mode) */}
                  {isAutomationsNavigation(navState) && activeWorkspace && (
                    <EditPopover
                      trigger={
                        <HeaderIconButton
                          icon={<Plus className="h-4 w-4" />}
                          tooltip={t("sidebarMenu.addAutomation")}
                        />
                      }
                      {...getEditConfig('automation-config', activeWorkspace.rootPath)}
                    />
                  )}
                  {/* Add Project button (only for projects mode) */}
                  {isProjectsNavigation(navState) && activeWorkspace && (
                    <HeaderIconButton
                      icon={<Plus className="h-4 w-4" />}
                      tooltip={t("sidebarMenu.addProject")}
                      onClick={openAddProject}
                    />
                  )}
                </>
              }
            />
            {/* Content: SessionList, SourcesListPanel, or SettingsNavigator based on navigation state */}
            {isSourcesNavigation(navState) && (
              /* Sources List - filtered by type if sourceFilter is active */
              <SourcesListPanel
                sources={sources}
                sourceFilter={sourceFilter}
                workspaceRootPath={activeWorkspace?.rootPath}
                onDeleteSource={handleDeleteSource}
                onSourceClick={handleSourceSelect}
                selectedSourceSlug={isSourcesNavigation(navState) && navState.details ? navState.details.sourceSlug : null}
                localMcpEnabled={localMcpEnabled}
              />
            )}
            {isSkillsNavigation(navState) && activeWorkspaceId && (
              /* Skills List */
              <SkillsListPanel
                skills={skills}
                workspaceId={activeWorkspaceId}
                workspaceRootPath={activeWorkspace?.rootPath}
                onSkillClick={handleSkillSelect}
                onDeleteSkill={handleDeleteSkill}
                selectedSkillSlug={isSkillsNavigation(navState) && navState.details?.type === 'skill' ? navState.details.skillSlug : null}
              />
            )}
            {isProjectsNavigation(navState) && activeWorkspaceId && (
              /* R1: folder-Projects live in the sidebar. Nested v0.11 list is not the product home.
                 Keep panel for ProjectInfo deep links (details); list mode points users to settings. */
              navState.details?.projectSlug ? (
                <ProjectsListPanel
                  projects={projects}
                  workspaceId={activeWorkspaceId}
                  onProjectClick={(slug) => navigate(routes.view.projects(slug))}
                  onAddProject={openAddProject}
                  onJumpToSessions={handleJumpToProjectSessions}
                  selectedProjectSlug={navState.details.projectSlug}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('sidebar.projectsListRedirectHint', {
                      defaultValue:
                        'Projects are folders in the sidebar. Open Project settings to edit name, icon, and folder.',
                    })}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(routes.view.settings('workspace'))}
                  >
                    {t('sidebarMenu.manageProjects')}
                  </Button>
                </div>
              )
            )}
            {isAutomationsNavigation(navState) && (
              /* Automations List - filtered by type if automationFilter is active */
              <AutomationsListPanel
                automations={automations}
                loadError={automationLoadError}
                onRetryLoad={retryLoadAutomations}
                automationFilter={automationFilter ? { kind: AUTOMATION_TYPE_TO_FILTER_KIND[automationFilter.automationType] ?? 'all' } : undefined}
                onAutomationClick={handleAutomationSelect}
                onTestAutomation={handleTestAutomation}
                onToggleAutomation={handleToggleAutomation}
                onDuplicateAutomation={handleDuplicateAutomation}
                onDeleteAutomation={handleDeleteAutomation}
                selectedAutomationId={isAutomationsNavigation(navState) && navState.details ? navState.details.automationId : null}
                workspaceRootPath={activeWorkspace?.rootPath}
              />
            )}
            {isSettingsNavigation(navState) && (
              /* Settings Navigator */
              <SettingsNavigator
                selectedSubpage={navState.subpage}
                onSelectSubpage={(subpage) => handleSettingsClick(subpage)}
              />
            )}
            {isSessionsNavigation(navState) && (
              /* Sessions List */
              <>
                {/* SessionList: Scrollable list of session cards */}
                {/* Key on sidebarMode forces full remount when switching views, skipping animations */}
                <SessionList
                  key={sessionFilter?.kind}
                  items={searchActive
                    // Cross-project surfaces search the full map so 对话 does not shrink when a
                    // project row is focused; workspace-scoped tools still use active workspace.
                    // Always hide empty placeholders (not yet first-sent).
                    ? (sessionFilter?.kind === 'projectSessions'
                      || sessionFilter?.kind === 'conversations'
                      || sessionFilter?.kind === 'flagged'
                      || sessionFilter?.kind === 'archived'
                      ? allSessionMetas
                      : workspaceSessionMetas
                    ).filter(isSessionListVisible)
                    : filteredSessionMetas}
                  onDelete={handleDeleteSession}
                  onFlag={onFlagSession}
                  onUnflag={onUnflagSession}
                  onArchive={onArchiveSession}
                  onUnarchive={onUnarchiveSession}
                  onSessionStatusChange={onSessionStatusChange}
                  onRename={onRenameSession}
                  onFocusChatInput={(targetSessionId) => {
                    focusChatInputForSession(targetSessionId ?? focusedSessionId ?? session.selected)
                  }}
                  onSessionSelect={(selectedMeta) => {
                    navigateToSession(selectedMeta.id)
                  }}
                  onOpenInNewWindow={(selectedMeta) => {
                    // Open the window for the session's own workspace (cross-project lists
                    // may show sessions from other folders), falling back to the active one.
                    const targetWorkspaceId = selectedMeta?.workspaceId ?? activeWorkspaceId
                    if (targetWorkspaceId && selectedMeta) {
                      window.electronAPI.openSessionInNewWindow(targetWorkspaceId, selectedMeta.id, selectedMeta.workingDirectory)
                    }
                  }}
                  onNavigateToView={(view) => {
                    if (view === 'allSessions') {
                      // R1: permanent All Sessions removed — Projects overview is the folder-bound home
                      navigate(routes.view.projectSessions(), { skipAutoSelect: true })
                    } else if (view === 'flagged') {
                      navigate(routes.view.flagged())
                    }
                  }}
                  sessionOptions={sessionOptions}
                  searchActive={searchActive}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSearchClose={() => {
                    setSearchActive(false)
                    setSearchQuery('')
                  }}
                  sessionStatuses={effectiveSessionStatuses}
                  evaluateViews={evaluateViews}
                  labels={displayLabelConfigs}
                  onLabelsChange={handleSessionLabelsChange}
                  // Nested projectId: R1 hides new writes (gate). Flip R1_HIDE_NESTED_PROJECT_ID_UI
                  // only after a later release defines folder-bind vs nested migration UX.
                  projects={R1_HIDE_NESTED_PROJECT_ID_UI ? undefined : projectMenuOptions}
                  // Group-by-project buckets by workspace folder (Project=folder).
                  groupByProjects={
                    chatGroupingMode === 'project'
                      ? workspaces.map(w => ({
                          id: w.id,
                          name: getWorkspaceDisplayName(w.name, t),
                        }))
                      : undefined
                  }
                  projectGroupField="workspaceId"
                  onSetProjectId={R1_HIDE_NESTED_PROJECT_ID_UI ? undefined : handleSessionProjectChange}
                  groupingMode={chatGroupingMode}
                  workspaceId={activeWorkspaceId ?? undefined}
                  statusFilter={listFilter}
                  labelFilterMap={labelFilter}
                  focusedSessionId={panelCount === 0 ? null : panelCount > 1 ? focusedSessionId : undefined}
                  onNavigateToSession={panelCount > 1 ? navigateToSessionInPanel : undefined}
                  hasPendingPrompt={hasPendingPrompt}
                  activeChatMatchInfo={chatMatchInfo}
                  onNewSession={() => handleNewChat()}
                  onBulkActionItemsChange={handleBulkActionItemsChange}
                />
              </>
            )}
            {/* Compact/mobile FAB — same Craft placement: only on the session
                list itself, never over an open chat (would cover the composer).
                Use hasSessionDetail (not navState.details): sequential navigator
                type-guards above exhaustively narrow navState to never for TS. */}
            {isAutoCompact && isSessionsNavigation(navState) && !hasSessionDetail && (
              <FabNewChat onClick={() => handleNewChat()} />
            )}
            </div>
          ) : null}
          navigatorWidth={layoutNavigatorWidth}
          isSidebarAndNavigatorHidden={effectiveSidebarAndNavigatorHidden}
          isRightSidebarVisible={isRightWorkbenchRendered}
          isCompact={isAutoCompact}
          isResizing={!!isResizing}
        />

        {isRightWorkbenchRendered && (
          <div
            className="relative h-full shrink-0"
            style={{ width: layoutWorkbenchWidth }}
          >
            <div
              ref={rightWorkbenchHandleRef}
              className="absolute z-panel flex cursor-col-resize justify-center"
              style={{
                top: PANEL_STACK_VERTICAL_OVERFLOW,
                bottom: PANEL_STACK_VERTICAL_OVERFLOW,
                left: -(PANEL_GAP / 2) - PANEL_SASH_HALF_HIT_WIDTH,
                width: PANEL_SASH_HIT_WIDTH,
              }}
              onMouseDown={(event) => {
                event.preventDefault()
                setIsResizing('right-workbench')
              }}
              onMouseMove={(event) => {
                if (rightWorkbenchHandleRef.current) {
                  const rect = rightWorkbenchHandleRef.current.getBoundingClientRect()
                  setRightWorkbenchHandleY(event.clientY - rect.top)
                }
              }}
              onMouseLeave={() => {
                if (isResizing !== 'right-workbench') setRightWorkbenchHandleY(null)
              }}
            >
              <div
                className="h-full"
                style={{
                  ...getResizeGradientStyle(
                    rightWorkbenchHandleY,
                    rightWorkbenchHandleRef.current?.clientHeight ?? null,
                  ),
                  width: PANEL_SASH_LINE_WIDTH,
                }}
              />
            </div>
            <RightWorkbench
              sessionId={effectiveSessionId}
              workingDirectory={
                effectiveSessionId
                  ? sessionMetaMap.get(effectiveSessionId)?.workingDirectory
                  : undefined
              }
              sources={sources}
              skills={skills}
              projects={projects}
              labels={displayLabelConfigs}
              onCreateSideTask={handleCreateSideTask}
            />
          </div>
        )}

        {/* Sidebar Resize Handle (absolute, hidden in focused mode) */}
        {layoutSidebarWidth > 0 && (
        <div
          ref={resizeHandleRef}
          onMouseDown={(e) => { e.preventDefault(); setIsResizing('sidebar') }}
          onMouseMove={(e) => {
            if (resizeHandleRef.current) {
              const rect = resizeHandleRef.current.getBoundingClientRect()
              setSidebarHandleY(e.clientY - rect.top)
            }
          }}
          onMouseLeave={() => { if (!isResizing) setSidebarHandleY(null) }}
          className="absolute cursor-col-resize z-panel flex justify-center"
          style={{
            width: PANEL_SASH_HIT_WIDTH,
            top: PANEL_STACK_VERTICAL_OVERFLOW,
            bottom: PANEL_STACK_VERTICAL_OVERFLOW,
            left: layoutSidebarWidth > 0
              ? layoutSidebarWidth + (PANEL_SIDEBAR_GAP / 2) - PANEL_SASH_HALF_HIT_WIDTH
              : -PANEL_GAP,
            transition: isResizing === 'sidebar' ? undefined : 'left 0.15s ease-out',
          }}
        >
          <div
            className="h-full"
            style={{
              ...getResizeGradientStyle(sidebarHandleY, resizeHandleRef.current?.clientHeight ?? null),
              width: PANEL_SASH_LINE_WIDTH,
            }}
          />
        </div>
        )}

        {/* Session List Resize Handle (absolute, hidden in focused mode and board view) */}
        {layoutNavigatorWidth > 0 && (
        <div
          ref={sessionListHandleRef}
          onMouseDown={(e) => { e.preventDefault(); setIsResizing('session-list') }}
          onMouseMove={(e) => {
            if (sessionListHandleRef.current) {
              const rect = sessionListHandleRef.current.getBoundingClientRect()
              setSessionListHandleY(e.clientY - rect.top)
            }
          }}
          onMouseLeave={() => { if (isResizing !== 'session-list') setSessionListHandleY(null) }}
          className="absolute cursor-col-resize z-panel flex justify-center"
          style={{
            width: PANEL_SASH_HIT_WIDTH,
            top: PANEL_STACK_VERTICAL_OVERFLOW,
            bottom: PANEL_STACK_VERTICAL_OVERFLOW,
            left:
              (layoutSidebarWidth > 0
                ? layoutSidebarWidth + PANEL_SIDEBAR_GAP
                : PANEL_EDGE_INSET) +
              layoutNavigatorWidth +
              (PANEL_GAP / 2) -
              PANEL_SASH_HALF_HIT_WIDTH,
            transition: isResizing === 'session-list' ? undefined : 'left 0.15s ease-out',
          }}
        >
          <div
            className="h-full"
            style={{
              ...getResizeGradientStyle(sessionListHandleY, sessionListHandleRef.current?.clientHeight ?? null),
              width: PANEL_SASH_LINE_WIDTH,
            }}
          />
        </div>
        )}

      </div>

      {/* ============================================================================
       * CONTEXT MENU TRIGGERED EDIT POPOVERS
       * ============================================================================
       * These EditPopovers are opened programmatically from sidebar context menus.
       * They use controlled state (editPopoverOpen) and invisible anchors for positioning.
       * The anchor Y position is captured from the right-clicked item (editPopoverAnchorY ref)
       * so the popover appears near the triggering item rather than at a fixed location.
       * modal={true} prevents auto-close when focus shifts after context menu closes.
       */}
      {activeWorkspace && (
        <>
          {/* Configure Statuses EditPopover - anchored near sidebar */}
          <EditPopover
            open={editPopoverOpen === 'statuses'}
            onOpenChange={(isOpen) => setEditPopoverOpen(isOpen ? 'statuses' : null)}
            modal={true}
            trigger={
              <div
                className="fixed w-0 h-0 pointer-events-none"
                style={{ left: sidebarWidth + 20, top: editPopoverAnchorY.current }}
                aria-hidden="true"
              />
            }
            side="bottom"
            align="start"
            secondaryAction={{
              label: t('common.editFile'),
              filePath: `${activeWorkspace.rootPath}/statuses/config.json`,
            }}
            {...getEditConfig('edit-statuses', activeWorkspace.rootPath)}
          />
          {/* Edit Views EditPopover - anchored near sidebar */}
          <EditPopover
            open={editPopoverOpen === 'views'}
            onOpenChange={(isOpen) => setEditPopoverOpen(isOpen ? 'views' : null)}
            modal={true}
            trigger={
              <div
                className="fixed w-0 h-0 pointer-events-none"
                style={{ left: sidebarWidth + 20, top: editPopoverAnchorY.current }}
                aria-hidden="true"
              />
            }
            side="bottom"
            align="start"
            secondaryAction={{
              label: t('common.editFile'),
              filePath: `${activeWorkspace.rootPath}/views.json`,
            }}
            {...getEditConfig('edit-views', activeWorkspace.rootPath)}
          />
          {/* Add Source EditPopovers - one for each variant (generic + filter-specific)
           * editPopoverOpen can be: 'add-source', 'add-source-api', 'add-source-mcp', 'add-source-local'
           * Each variant uses its corresponding EditContextKey for filter-aware agent context */}
          {(['add-source', 'add-source-api', 'add-source-mcp', 'add-source-local'] as const).map((variant) => (
            <EditPopover
              key={variant}
              open={editPopoverOpen === variant}
              onOpenChange={(isOpen) => setEditPopoverOpen(isOpen ? variant : null)}
              modal={true}
              trigger={
                <div
                  className="fixed w-0 h-0 pointer-events-none"
                  style={{ left: sidebarWidth + 20, top: editPopoverAnchorY.current }}
                  aria-hidden="true"
                />
              }
              side="bottom"
              align="start"
              {...getEditConfig(variant, activeWorkspace.rootPath)}
            />
          ))}
          {/* Add Skill EditPopover */}
          <EditPopover
            open={editPopoverOpen === 'add-skill'}
            onOpenChange={(isOpen) => setEditPopoverOpen(isOpen ? 'add-skill' : null)}
            modal={true}
            trigger={
              <div
                className="fixed w-0 h-0 pointer-events-none"
                style={{ left: sidebarWidth + 20, top: editPopoverAnchorY.current }}
                aria-hidden="true"
              />
            }
            side="bottom"
            align="start"
            {...getEditConfig('add-skill', activeWorkspace.rootPath)}
          />
          {/* Add Automation EditPopover - triggered from "Add Automation" context menu in automations */}
          <EditPopover
            open={editPopoverOpen === 'automation-config'}
            onOpenChange={(isOpen) => setEditPopoverOpen(isOpen ? 'automation-config' : null)}
            modal={true}
            trigger={
              <div
                className="fixed w-0 h-0 pointer-events-none"
                style={{ left: sidebarWidth + 20, top: editPopoverAnchorY.current }}
                aria-hidden="true"
              />
            }
            side="bottom"
            align="start"
            {...getEditConfig('automation-config', activeWorkspace.rootPath)}
          />
        </>
      )}

      {/* What's New overlay */}
      <DocumentFormattedMarkdownOverlay
        isOpen={showWhatsNew}
        onClose={() => setShowWhatsNew(false)}
        content={releaseNotesContent}
        onOpenUrl={(url) => window.electronAPI.openUrl(url)}
      />

      {/* Delete automation confirmation dialog */}
      <Dialog open={!!automationPendingDelete} onOpenChange={(open) => { if (!open) setAutomationPendingDelete(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("dialog.deleteAutomation.title")}</DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey="dialog.deleteAutomation.description"
                values={{ name: pendingDeleteAutomation?.name }}
                components={{ strong: <strong /> }}
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutomationPendingDelete(null)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={confirmDeleteAutomation}>{t("common.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Workspace dialog (driven by sendToWorkspaceAtom) */}
      <SendToWorkspaceDialog
        open={sendToWorkspaceIds.length > 0}
        onOpenChange={(open) => { if (!open) setSendToWorkspaceIds([]) }}
        sessionIds={sendToWorkspaceIds}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onTransferComplete={handleTransferComplete}
      />

      {showProjectCreateScreen && (
        <WorkspaceCreationScreen
          initialStep="remote"
          onWorkspaceCreated={(workspace) => { void handleProjectCreatedFromScreen(workspace) }}
          onClose={cancelProjectCreateScreen}
        />
      )}

      <ServerDirectoryBrowser
        open={showProjectFolderBrowser}
        mode={projectFolderBrowserMode}
        onSelect={confirmProjectFolderBrowser}
        onCancel={cancelProjectFolderBrowser}
      />

      {/* Messaging dialogs (pairing-code + WA connect) — driven by messagingDialogAtom.
          Mounted here so they survive context-menu / dropdown close. */}
      <MessagingDialogHost />

    </AppShellProvider>
  )
}
