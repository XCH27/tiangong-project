/**
 * Single production layout authority for AppShell chrome.
 *
 * Composes:
 * - sidebar-visibility (left chrome projection)
 * - session-pane-layout (chat · workbench split — the OpenCode two-pane model)
 * - navigator yielding (page-local list may drop to protect the main panel)
 *
 * AppShell must call `resolveShellLayout` rather than inventing a second
 * workbench width path. `resolveResponsivePanelLayout` is no longer the
 * production workbench authority.
 */

import type { WorkbenchModuleKind } from '@/atoms/right-workbench'
import {
  PANEL_EDGE_INSET,
  PANEL_GAP,
  PANEL_MIN_WIDTH,
  PANEL_RIGHT_EDGE_INSET,
  PANEL_SIDEBAR_GAP,
} from './panel-constants'
import {
  CHAT_PANE_WIDTH_MIN,
  resolveSessionPaneLayout,
  type SessionPaneLayout,
  type WorkbenchDiffStyle,
} from './session-pane-layout'
import {
  resolveSidebarVisibility,
  type SidebarVisibilityProjection,
} from './sidebar-visibility'

export interface ShellLayoutInput {
  shellWidth: number
  compact: boolean
  focusMode: boolean
  sidebarStoredVisible: boolean
  sidebarStoredWidth: number
  /** Whether a page-local navigator panel is needed for this route. */
  navigatorNeeded: boolean
  navigatorStoredWidth: number
  workbenchRequested: boolean
  /** User-resized preferred workbench width (inverse of chat preference). */
  workbenchStoredWidth: number
  workbenchKind: WorkbenchModuleKind
  diffStyle?: WorkbenchDiffStyle
}

export interface ShellLayout {
  sidebar: SidebarVisibilityProjection
  sidebarWidth: number
  navigatorWidth: number
  /** Resolved chat column width inside the content row. */
  chatWidth: number
  workbenchWidth: number
  workbenchVisible: boolean
  workbenchBlockedByWidth: boolean
  /** session-pane result for tests / diagnostics. */
  sessionPane: SessionPaneLayout
}

function leftChromeWidth(sidebarWidth: number, navigatorWidth: number): number {
  const leftInset = sidebarWidth > 0 ? 0 : PANEL_EDGE_INSET
  const sidebarSeam = sidebarWidth > 0 && navigatorWidth > 0 ? PANEL_SIDEBAR_GAP : 0
  const contentSeam = sidebarWidth > 0 || navigatorWidth > 0 ? PANEL_GAP : 0
  return leftInset + sidebarWidth + sidebarSeam + navigatorWidth + contentSeam
}

/**
 * Width available for the chat + workbench row after left chrome and the right inset.
 * Workbench seam is owned by session-pane (workbench takes remainder of the row).
 */
export function contentRowWidth(
  shellWidth: number,
  sidebarWidth: number,
  navigatorWidth: number,
): number {
  if (shellWidth <= 0) return 0
  return Math.max(
    0,
    shellWidth - leftChromeWidth(sidebarWidth, navigatorWidth) - PANEL_RIGHT_EDGE_INSET,
  )
}

/**
 * Convert a stored workbench preference into the chat-owned width session-pane expects.
 */
export function preferredChatWidthFromWorkbenchStore(input: {
  contentWidth: number
  workbenchStoredWidth: number
  workbenchRequested: boolean
}): number {
  if (!input.workbenchRequested || input.contentWidth <= 0) {
    return Math.max(CHAT_PANE_WIDTH_MIN, input.contentWidth)
  }
  const preferred = input.contentWidth - Math.max(0, input.workbenchStoredWidth)
  return Math.max(CHAT_PANE_WIDTH_MIN, preferred)
}

function sessionPaneFor(
  contentWidth: number,
  input: ShellLayoutInput,
): SessionPaneLayout {
  return resolveSessionPaneLayout({
    containerWidth: contentWidth,
    chatWidth: preferredChatWidthFromWorkbenchStore({
      contentWidth,
      workbenchStoredWidth: input.workbenchStoredWidth,
      workbenchRequested: input.workbenchRequested,
    }),
    workbenchRequested: input.workbenchRequested,
    workbenchKind: input.workbenchKind,
    diffStyle: input.diffStyle,
    chromeWidth: 0,
  })
}

/**
 * Production shell layout. Always routes chat/workbench through
 * `resolveSessionPaneLayout` so that model is not test-only dead code.
 */
export function resolveShellLayout(input: ShellLayoutInput): ShellLayout {
  const sidebar = resolveSidebarVisibility({
    storedVisible: input.sidebarStoredVisible,
    storedWidth: input.sidebarStoredWidth,
    focusMode: input.focusMode,
    autoCompact: input.compact,
  })

  if (input.compact) {
    const emptyPane = resolveSessionPaneLayout({
      containerWidth: input.shellWidth,
      chatWidth: input.shellWidth,
      workbenchRequested: false,
      workbenchKind: input.workbenchKind,
      chromeWidth: 0,
    })
    return {
      sidebar,
      sidebarWidth: 0,
      navigatorWidth: 0,
      chatWidth: emptyPane.chatWidth,
      workbenchWidth: 0,
      workbenchVisible: false,
      workbenchBlockedByWidth: false,
      sessionPane: emptyPane,
    }
  }

  const sidebarWidth = sidebar.renderedWidth
  let navigatorWidth = input.focusMode || !input.navigatorNeeded
    ? 0
    : input.navigatorStoredWidth

  // Unmeasured shell: preserve requested shape without snapping.
  if (input.shellWidth <= 0) {
    const sessionPane = sessionPaneFor(0, input)
    return {
      sidebar,
      sidebarWidth,
      navigatorWidth,
      chatWidth: sessionPane.chatWidth,
      workbenchWidth: input.workbenchRequested ? input.workbenchStoredWidth : 0,
      workbenchVisible: input.workbenchRequested,
      workbenchBlockedByWidth: false,
      sessionPane,
    }
  }

  let contentWidth = contentRowWidth(input.shellWidth, sidebarWidth, navigatorWidth)
  let sessionPane = sessionPaneFor(contentWidth, input)

  // Yield the page-local navigator only when the main content row cannot host
  // a comfortable chat floor (and the global sidebar still provides navigation).
  const navigatorIsLastNavigation = sidebarWidth === 0
  if (
    navigatorWidth > 0
    && !navigatorIsLastNavigation
    && contentWidth < PANEL_MIN_WIDTH
  ) {
    navigatorWidth = 0
    contentWidth = contentRowWidth(input.shellWidth, sidebarWidth, navigatorWidth)
    sessionPane = sessionPaneFor(contentWidth, input)
  }

  // Also yield navigator when workbench was requested and is width-blocked only
  // because the navigator stole the margin — retry without it.
  if (
    navigatorWidth > 0
    && !navigatorIsLastNavigation
    && input.workbenchRequested
    && sessionPane.workbenchBlockedByWidth
  ) {
    const withoutNav = contentRowWidth(input.shellWidth, sidebarWidth, 0)
    const retried = sessionPaneFor(withoutNav, input)
    if (retried.workbenchVisible || !retried.workbenchBlockedByWidth) {
      navigatorWidth = 0
      contentWidth = withoutNav
      sessionPane = retried
    }
  }

  return {
    sidebar,
    sidebarWidth,
    navigatorWidth,
    chatWidth: sessionPane.chatWidth,
    workbenchWidth: sessionPane.workbenchVisible ? sessionPane.workbenchWidth : 0,
    workbenchVisible: sessionPane.workbenchVisible,
    workbenchBlockedByWidth: sessionPane.workbenchBlockedByWidth,
    sessionPane,
  }
}
