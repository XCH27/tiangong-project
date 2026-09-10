/**
 * Production sidebar column chrome used by PanelStackContainer / AppShell.
 *
 * Owns the width, visibility data attrs, and painted width so toggle/layout
 * projection cannot disagree with what is on screen.
 */

import { motion, type Transition } from 'motion/react'
import { PANEL_GAP, PANEL_SIDEBAR_GAP } from './panel-constants'

export interface SidebarPanelSlotProps {
  sidebarWidth: number
  /** When false, column collapses to 0 width (same as AppShell layoutSidebarWidth). */
  visible: boolean
  transition: Transition
  children?: React.ReactNode
}

export function SidebarPanelSlot({
  sidebarWidth,
  visible,
  transition,
  children,
}: SidebarPanelSlotProps) {
  const paintedWidth = visible ? sidebarWidth : 0
  return (
    <motion.div
      data-panel-role="sidebar"
      data-sidebar-rendered-width={String(paintedWidth)}
      data-sidebar-visible={visible ? 'true' : 'false'}
      initial={false}
      animate={{
        width: paintedWidth,
        marginRight: visible ? PANEL_SIDEBAR_GAP - PANEL_GAP : -PANEL_GAP,
        opacity: visible ? 1 : 0,
      }}
      transition={transition}
      className="h-full relative shrink-0"
      style={{ overflowX: 'clip', overflowY: 'visible' }}
    >
      {/* Explicit width for paint + SSR (animate alone is not in the DOM style). */}
      <div
        className="h-full"
        data-sidebar-panel-width={String(paintedWidth)}
        style={{ width: `${paintedWidth}px` }}
      >
        {visible ? children : null}
      </div>
    </motion.div>
  )
}
