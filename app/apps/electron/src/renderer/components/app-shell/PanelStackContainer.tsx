/**
 * PanelStackContainer
 *
 * Horizontal layout container for ALL panels:
 * Sidebar → Navigator → Content Panel(s) with resize sashes.
 *
 * Content panels use CSS flex-grow with their proportions as weights:
 * - Each panel gets `flex: <proportion> 1 0px` with min-w-0 so flex can shrink below PANEL_MIN_WIDTH
 * - Flex distributes available space proportionally — panels fill the viewport
 * - When space is tight, panels compress and inner content truncates (no horizontal scroll)
 *
 * Sidebar and Navigator are NOT part of the proportional layout —
 * they have their own fixed/user-resizable widths managed by AppShell.
 * They just reduce the available width for content panels; overflow is clipped, not scrolled.
 *
 * The right sidebar stays OUTSIDE this container.
 *
 * Compact mode (mobile / narrow window):
 * The flex layout is replaced with an absolute-positioned, transform-animated
 * stack — navigator and the focused content panel both stay mounted and slide
 * in/out via CompactPanelTransition. This produces an iOS UINavigationController
 * feel rather than a CSS reflow.
 */

import { useRef, type CSSProperties } from 'react'
import { useAtomValue } from 'jotai'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { panelStackAtom, focusedPanelIdAtom, focusedPanelRouteAtom } from '@/atoms/panel-stack'
import { parseRouteToNavigationState } from '../../../shared/route-parser'
import { isDetailNavState } from '@/lib/nav-helpers'
import { PanelSlot } from './PanelSlot'
import { PanelResizeSash } from './PanelResizeSash'
import { CompactPanelTransition } from './CompactPanelTransition'
import {
  PANEL_GAP,
  PANEL_EDGE_INSET,
  PANEL_STACK_VERTICAL_OVERFLOW,
  RADIUS_EDGE,
  RADIUS_INNER,
} from './panel-constants'
import { getContentGridSpec } from './workbench-layout'

/** Spring transition matching AppShell's sidebar/navigator animation */
const PANEL_SPRING = { type: 'spring' as const, stiffness: 600, damping: 49 }

/** Visual breathing room between the fixed compact TopBar and the first panel. */
const COMPACT_PANEL_TOP_GAP = 8

interface PanelStackContainerProps {
  sidebarSlot: React.ReactNode
  sidebarWidth: number
  navigatorSlot: React.ReactNode
  navigatorWidth: number
  isSidebarAndNavigatorHidden: boolean
  isRightSidebarVisible?: boolean
  /** Optional bottom slot in the middle content column (e.g. terminal card). */
  contentBottomSlot?: React.ReactNode
  contentBottomHeight?: number
  /** Compact mode: single-panel, list/content toggle (mobile or narrow window) */
  isCompact?: boolean
  isResizing?: boolean
}

export function PanelStackContainer({
  sidebarSlot,
  sidebarWidth,
  navigatorSlot,
  navigatorWidth,
  isSidebarAndNavigatorHidden,
  isRightSidebarVisible,
  contentBottomSlot,
  contentBottomHeight = 0,
  isCompact = false,
  isResizing,
}: PanelStackContainerProps) {
  const panelStack = useAtomValue(panelStackAtom)
  const focusedPanelId = useAtomValue(focusedPanelIdAtom)
  const focusedRoute = useAtomValue(focusedPanelRouteAtom)

  const contentPanels = panelStack

  // Compact mode: drill-in is "detail focused", not just "session selected".
  // For sessions: a session is selected. For settings: a subpage is selected.
  // For sources/skills/automations: a detail entity is selected.
  const focusedNavState = focusedRoute ? parseRouteToNavigationState(focusedRoute) : null
  const isDetailFocused = isDetailNavState(focusedNavState)
  const hasSelectedContent = isCompact && isDetailFocused

  const visiblePanels = isCompact
    ? contentPanels.filter(e => e.id === focusedPanelId).slice(0, 1)
    : contentPanels

  const scrollRef = useRef<HTMLDivElement>(null)

  const hasSidebar = sidebarWidth > 0
  // Desktop: navigator is shown when AppShell asks for it. Compact: navigator
  // is always mounted (transform-hidden when detail-focused) so the slide can
  // animate both slots in lockstep.
  const hasNavigator = isCompact ? navigatorWidth > 0 : navigatorWidth > 0
  const isMultiPanel = visiblePanels.length > 1
  const isLeftEdge = !hasSidebar && !hasNavigator
  const gridSpec = getContentGridSpec(visiblePanels.length)
  const hasBottomModule = Boolean(contentBottomSlot && contentBottomHeight > 0)

  const panelAreaStyle: CSSProperties = gridSpec.mode === 'grid'
    ? {
        display: 'grid',
        gridTemplateColumns: gridSpec.columnTracks.replace(/1fr/g, 'minmax(0, 1fr)'),
        gridTemplateRows: gridSpec.rowTracks.replace(/1fr/g, 'minmax(0, 1fr)'),
        gap: PANEL_GAP,
        minHeight: 0,
        width: '100%',
        height: '100%',
        minWidth: 0,
      }
    : {
        display: 'flex',
        minWidth: 0,
        width: '100%',
        height: '100%',
      }

  // Auto-scroll removed: panels compress with ellipsis instead of horizontal scroll.

  const transition = (isResizing || isCompact) ? { duration: 0 } : PANEL_SPRING

  /**
   * Content layout contract (docs/00B) — do not add ad-hoc wrappers.
   *
   * Craft baseline: PanelSlot(s) are flex-row siblings of sidebar/navigator; scrollRef
   * owns vertical shadow gutter (±PANEL_STACK_VERTICAL_OVERFLOW), no horizontal scroll.
   *
   * Fleet terminal extension ONLY: when contentBottomSlot is set, replace inline panels
   * with one flex-col column (panels above / terminal below). Panel area stays
   * overflow-visible; never overflow-auto on ancestors of shadow-middle.
   */
  const renderPanelSlots = (isAboveBottomModule: boolean, includeFlexSashes: boolean) => {
    if (visiblePanels.length === 0) {
      return <div className="flex flex-1 items-center justify-center" />
    }

    if (gridSpec.mode === 'grid') {
      return visiblePanels.map((entry, index) => {
        const cell = gridSpec.cells.find((item) => item.panelIndex === index)
        if (!cell) return null
        return (
          <div
            key={entry.id}
            className="min-h-0 min-w-0"
            style={{
              gridColumn: `${cell.column} / span ${cell.columnSpan}`,
              gridRow: `${cell.row} / span ${cell.rowSpan}`,
            }}
          >
            <PanelSlot
              entry={entry}
              isOnly={false}
              isFocusedPanel={isMultiPanel ? entry.id === focusedPanelId : true}
              isSidebarAndNavigatorHidden={isSidebarAndNavigatorHidden}
              isAtLeftEdge={index === 0 && isLeftEdge}
              isAtRightEdge={index === visiblePanels.length - 1 && !isRightSidebarVisible}
              proportion={entry.proportion}
              isCompact={false}
              fillContainer
              isAboveBottomModule={isAboveBottomModule}
            />
          </div>
        )
      })
    }

    return visiblePanels.map((entry, index) => (
      <PanelSlot
        key={entry.id}
        entry={entry}
        isOnly={visiblePanels.length === 1}
        isFocusedPanel={isMultiPanel ? entry.id === focusedPanelId : true}
        isSidebarAndNavigatorHidden={isSidebarAndNavigatorHidden}
        isAtLeftEdge={index === 0 && isLeftEdge}
        isAtRightEdge={index === visiblePanels.length - 1 && !isRightSidebarVisible}
        proportion={entry.proportion}
        isCompact={false}
        isAboveBottomModule={isAboveBottomModule}
        sash={includeFlexSashes && index > 0 ? (
          <PanelResizeSash
            leftIndex={index - 1}
            rightIndex={index}
          />
        ) : undefined}
      />
    ))
  }

  const renderContentRegion = () => {
    if (hasBottomModule) {
      return (
        <div
          className="flex h-full min-h-0 min-w-0 flex-1 flex-col"
          style={{ gap: PANEL_GAP }}
        >
          <div className="relative z-[1] min-h-0 min-w-0 flex-1 overflow-visible">
            {gridSpec.mode === 'grid' ? (
              <div className="h-full" style={panelAreaStyle}>
                {renderPanelSlots(true, false)}
              </div>
            ) : (
              <div className="flex h-full min-w-0" style={{ gap: PANEL_GAP }}>
                {renderPanelSlots(true, true)}
              </div>
            )}
          </div>
          <div
            className="relative z-0 shrink-0 overflow-visible"
            style={{ height: contentBottomHeight }}
          >
            {contentBottomSlot}
          </div>
        </div>
      )
    }

    if (visiblePanels.length === 0) {
      return <div className="flex-1 flex items-center justify-center" />
    }

    if (gridSpec.mode === 'grid') {
      return (
        <div
          className="flex h-full min-h-0 min-w-0 flex-1 overflow-visible"
          style={panelAreaStyle}
        >
          {renderPanelSlots(false, false)}
        </div>
      )
    }

    // Craft baseline: content panels are direct flex-row siblings (shadow paints in scrollRef gutter).
    return renderPanelSlots(false, true)
  }

  // === COMPACT BRANCH ===
  // Single-panel layout with iOS-style slide between navigator and detail.
  // Both stay in the DOM; CompactPanelTransition transforms whichever should be
  // off-screen. Sidebar is hidden by AppShell in compact mode (sidebarWidth = 0).
  if (isCompact) {
    const focusedEntry = visiblePanels[0]
    return (
      <div
        ref={scrollRef}
        data-mobile-menu-root="true"
        className="flex-1 min-w-0 relative panel-scroll @container/shell"
        style={{
          paddingBlock: PANEL_STACK_VERTICAL_OVERFLOW,
          marginBlock: -PANEL_STACK_VERTICAL_OVERFLOW,
          marginBottom: -6,
          paddingBottom: 6,
          '--compact-panel-stack-top': `${PANEL_STACK_VERTICAL_OVERFLOW + COMPACT_PANEL_TOP_GAP}px`,
        } as React.CSSProperties}
      >
        {/* Navigator slot — full width, slides left to -30% when detail focused. */}
        {hasNavigator && (
          <CompactPanelTransition role="navigator" isDetailActive={hasSelectedContent}>
            <div
              data-panel-role="navigator"
              className={cn(
                'h-full w-full overflow-hidden relative',
                'bg-background shadow-middle',
              )}
              style={{
                // Compact mode runs flush to the viewport floor — no rounded bottom.
                borderTopLeftRadius: RADIUS_INNER,
                borderBottomLeftRadius: 0,
                borderTopRightRadius: RADIUS_INNER,
                borderBottomRightRadius: 0,
              }}
            >
              {navigatorSlot}
            </div>
          </CompactPanelTransition>
        )}

        {/* Content slot — full width, slides in from the right when detail focused. */}
        {focusedEntry && (
          <CompactPanelTransition role="detail" isDetailActive={hasSelectedContent}>
            <div className="h-full w-full flex">
              <PanelSlot
                key={focusedEntry.id}
                entry={focusedEntry}
                isOnly={true}
                isFocusedPanel={true}
                isSidebarAndNavigatorHidden={isSidebarAndNavigatorHidden}
                isAtLeftEdge={isLeftEdge}
                isAtRightEdge={!isRightSidebarVisible}
                proportion={focusedEntry.proportion}
                isCompact={true}
              />
            </div>
          </CompactPanelTransition>
        )}
      </div>
    )
  }

  // === DESKTOP BRANCH ===
  // Same flex-row layout as before; behavior is unchanged.
  return (
    <div
      ref={scrollRef}
      data-mobile-menu-root="true"
      className="flex-1 min-w-0 flex relative z-panel @container/shell overflow-x-clip overflow-y-visible"
      style={{
        paddingBlock: PANEL_STACK_VERTICAL_OVERFLOW,
        marginBlock: -PANEL_STACK_VERTICAL_OVERFLOW,
        paddingRight: 8,
        marginRight: -8,
      }}
    >
      <motion.div
        className="flex h-full"
        initial={false}
        animate={{ paddingLeft: !hasSidebar ? PANEL_EDGE_INSET : 0 }}
        transition={transition}
        style={{ gap: PANEL_GAP, flexGrow: 1, minWidth: 0 }}
      >
        {/* === SIDEBAR SLOT === */}
        <motion.div
          data-panel-role="sidebar"
          initial={false}
          animate={{
            width: hasSidebar ? sidebarWidth : 0,
            marginRight: hasSidebar ? 0 : -PANEL_GAP,
            opacity: hasSidebar ? 1 : 0,
          }}
          transition={transition}
          className="h-full relative shrink-0"
          style={{ overflowX: 'clip', overflowY: 'visible' }}
        >
          <div className="h-full" style={{ width: sidebarWidth }}>
            {sidebarSlot}
          </div>
        </motion.div>

        {/* === NAVIGATOR SLOT === */}
        <motion.div
          data-panel-role="navigator"
          initial={false}
          animate={{
            width: hasNavigator ? navigatorWidth : 0,
            marginRight: hasNavigator ? 0 : -PANEL_GAP,
            opacity: hasNavigator ? 1 : 0,
          }}
          transition={transition}
          className={cn(
            'h-full overflow-hidden relative shrink-0 z-[2]',
            'bg-background shadow-middle',
          )}
          style={{
            borderTopLeftRadius: RADIUS_INNER,
            borderBottomLeftRadius: !hasSidebar ? RADIUS_EDGE : RADIUS_INNER,
            borderTopRightRadius: RADIUS_INNER,
            borderBottomRightRadius: RADIUS_INNER,
          }}
        >
          <div className="h-full" style={{ width: navigatorWidth }}>
            {navigatorSlot}
          </div>
        </motion.div>

        {/* === CONTENT: craft inline panels, or terminal split when bottom slot set === */}
        <div className="flex min-h-0 min-w-0 flex-1">
          {renderContentRegion()}
        </div>
      </motion.div>
    </div>
  )
}
