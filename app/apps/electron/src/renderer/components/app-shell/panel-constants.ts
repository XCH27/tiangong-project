import { isMac } from '@/lib/platform'

/** Gap between any adjacent panels (sidebar ↔ navigator ↔ content ↔ right sidebar) */
export const PANEL_GAP = 6

/** Sidebar seams use the same panel rhythm as every adjacent panel. */
export const PANEL_SIDEBAR_GAP = PANEL_GAP

/** Padding from window edges to outermost panels (right, left when sidebar hidden) */
export const PANEL_EDGE_INSET = 6

/** The outer desktop edges share one canonical Craft inset. */
export const PANEL_TOP_EDGE_INSET = PANEL_EDGE_INSET
export const PANEL_RIGHT_EDGE_INSET = PANEL_EDGE_INSET
export const PANEL_BOTTOM_EDGE_INSET = PANEL_EDGE_INSET

/** Corner radius for panel edges touching the window boundary (macOS native corners → larger) */
export const RADIUS_EDGE = isMac ? 14 : 8

/** Corner radius for interior corners between panels */
export const RADIUS_INNER = 10

/** Minimum width for any content panel */
export const PANEL_MIN_WIDTH = 440

/** Minimum usable width for the right workbench before left-side chrome yields. */
export const RIGHT_WORKBENCH_MIN_WIDTH = 320

/** Extra vertical space reserved in panel stack for box-shadows. */
export const PANEL_STACK_VERTICAL_OVERFLOW = 8

/**
 * Shared resize sash geometry.
 *
 * Keep all seams (sidebar, navigator/content, panel/panel) aligned by deriving
 * offsets from these constants instead of hardcoded pixel literals.
 */
export const PANEL_SASH_HIT_WIDTH = 8
export const PANEL_SASH_LINE_WIDTH = 2

/**
 * When the sash is inserted between two flex items, flex gap would apply twice
 * (item↔sash and sash↔item). Pull it back by half the gap on both sides so
 * the visible distance remains exactly PANEL_GAP.
 */
export const PANEL_SASH_FLEX_MARGIN = -(PANEL_GAP / 2)

/** Half-width helper for centering sash containers on seam coordinates. */
export const PANEL_SASH_HALF_HIT_WIDTH = PANEL_SASH_HIT_WIDTH / 2
