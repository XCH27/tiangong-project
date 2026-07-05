/**
 * PanelSlot
 *
 * Renders a single content panel within the PanelStackContainer.
 *
 * When a panel is the only one (isOnly), it flex-grows to fill available space.
 * When multiple panels exist, each uses flex-grow with its proportion as the weight
 * and min-w-0 so panels shrink with inner content ellipsis instead of horizontal scroll.
 *
 * Each PanelSlot overrides AppShellContext to inject a per-panel close button
 * into PanelHeader's rightSidebarButton slot. All panels are equal — closing
 * any panel removes it from the stack. A reactive effect handles window close
 * when the stack becomes empty.
 */

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSetAtom, useAtomValue } from 'jotai'
import { cn } from '@/lib/utils'
import { X, ChevronLeft } from 'lucide-react'
import { parseRouteToNavigationState } from '../../../shared/route-parser'
import { closePanelAtom, focusedPanelIdAtom, type PanelStackEntry, parseSessionIdFromRoute } from '@/atoms/panel-stack'
import { sessionMetaMapAtom } from '@/atoms/sessions'
import { useAppShellContext, AppShellProvider } from '@/context/AppShellContext'
import { PanelHeaderCenterButton } from '@/components/ui/PanelHeaderCenterButton'
import { MainContentPanel } from './MainContentPanel'
import { TerminalPanel } from './TerminalPanel'
import { RADIUS_EDGE, RADIUS_INNER } from './panel-constants'

interface PanelSlotProps {
  entry: PanelStackEntry
  isOnly: boolean
  /** Whether this panel is the focused panel in a multi-panel layout */
  isFocusedPanel: boolean
  isSidebarAndNavigatorHidden: boolean
  /** Whether this panel's left corners touch the window edge (no sidebar/navigator before it) */
  isAtLeftEdge: boolean
  /** Whether this panel's right corners touch the window edge (no right sidebar after it) */
  isAtRightEdge: boolean
  /** Flex-grow weight for proportional sizing */
  proportion: number
  /** Optional sash element rendered before this panel */
  sash?: React.ReactNode
  /** Compact (mobile) mode — shows back button in panel header */
  isCompact?: boolean
  /** Fill parent grid/flex cell (multi-panel grid mode). */
  fillContainer?: boolean
  /** Terminal or another bottom module sits below this content panel. */
  isAboveBottomModule?: boolean
}

export function PanelSlot({
  entry,
  isOnly,
  isFocusedPanel,
  isSidebarAndNavigatorHidden,
  isAtLeftEdge,
  isAtRightEdge,
  proportion,
  sash,
  isCompact,
  fillContainer = false,
  isAboveBottomModule = false,
}: PanelSlotProps) {
  const { t } = useTranslation()
  const closePanel = useSetAtom(closePanelAtom)
  const setFocusedPanel = useSetAtom(focusedPanelIdAtom)
  const parentContext = useAppShellContext()
  const navState = parseRouteToNavigationState(entry.route)

  const sessionMetaMap = useAtomValue(sessionMetaMapAtom)
  const sessionId = parseSessionIdFromRoute(entry.route)
  const isTerminalSession = sessionId ? (sessionMetaMap.get(sessionId)?.surface === 'terminal') : false
  const isTerminalRoute = entry.route.startsWith('terminal') || isTerminalSession

  const handleClose = useCallback(() => {
    closePanel(entry.id)
  }, [closePanel, entry.id])

  // Build close button for PanelHeader (via context override)
  const closeButton = useMemo(() => {
    return (
      <PanelHeaderCenterButton
        icon={<X className="h-4 w-4" />}
        onClick={handleClose}
        tooltip={t("common.close")}
      />
    )
  }, [handleClose])

  // Build back button for compact mode — closes the panel to reveal the session list.
  // Same PanelHeaderCenterButton style as X and share, just on the left side.
  const backButton = useMemo(() => {
    if (!isCompact) return undefined
    return (
      <PanelHeaderCenterButton
        icon={<ChevronLeft className="h-4 w-4" />}
        onClick={handleClose}
        tooltip={t("common.backToList")}
      />
    )
  }, [isCompact, handleClose])

  // Override AppShellContext so ChatPage/PanelHeader gets our per-panel close button,
  // back button (compact mode), and isFocusedPanel for input field appearance
  const contextOverride = useMemo(() => ({
    ...parentContext,
    rightSidebarButton: closeButton,
    leadingAction: backButton,
    isFocusedPanel,
  }), [parentContext, closeButton, backButton, isFocusedPanel])

  const handlePointerDown = useCallback(() => {
    if (!isFocusedPanel) {
      setFocusedPanel(entry.id)
    }
  }, [isFocusedPanel, setFocusedPanel, entry.id])

  return (
    <>
      {sash}
      <div
        onPointerDown={handlePointerDown}
        data-panel-role="content"
        data-compact={isCompact || undefined}
        className={cn(
          fillContainer ? 'h-full w-full' : 'h-full',
          'overflow-hidden relative @container/panel',
          !isOnly && isFocusedPanel ? 'shadow-panel-focused z-[1]' : 'shadow-middle z-0',
          isAboveBottomModule && 'z-[1]',
          'bg-foreground-2',
        )}
        style={{
          // In multi-panel, unfocused panels override --background so all
          // bg-background children render at the elevated (dimmed) background.
          ...(!isFocusedPanel && !isOnly
            ? {
                '--background': 'var(--background-elevated)',
                '--shadow-minimal': 'var(--shadow-minimal-flat)',
                '--user-message-bubble': 'var(--user-message-bubble-dimmed)',
              } as React.CSSProperties
            : {}
          ),
          // Corner radii: edge corners (touching window boundary) vs interior corners.
          // Compact mode panels run flush to the viewport floor — no rounded bottom.
          borderTopLeftRadius: RADIUS_INNER,
          borderBottomLeftRadius: isCompact ? 0 : (isAboveBottomModule ? RADIUS_INNER : (isAtLeftEdge ? RADIUS_EDGE : RADIUS_INNER)),
          borderTopRightRadius: RADIUS_INNER,
          borderBottomRightRadius: isCompact ? 0 : (isAboveBottomModule ? RADIUS_INNER : (isAtRightEdge ? RADIUS_EDGE : RADIUS_INNER)),
          ...(fillContainer
            ? { width: '100%', minWidth: 0, minHeight: 0 }
            : isOnly
            ? { flexGrow: 1, minWidth: 0 }
            : { flexGrow: proportion, flexShrink: 1, flexBasis: 0, minWidth: 0 }
          ),
        }}
      >
        <div className="h-full flex flex-col">
          <AppShellProvider value={contextOverride}>
            {isTerminalRoute ? (
              <TerminalPanel onClose={handleClose} sessionId={sessionId ?? undefined} />
            ) : (
              <MainContentPanel
                navStateOverride={navState}
                isSidebarAndNavigatorHidden={isSidebarAndNavigatorHidden}
              />
            )}
          </AppShellProvider>
        </div>
      </div>
    </>
  )
}
