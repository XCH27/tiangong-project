/**
 * Workbench layout contract (docs/37).
 *
 * Anti-overlap rules:
 * 1. Primary regions (sidebar / navigator / content / tool dock) live in flex
 *    document flow — never absolute, except the explicit right-rail overlay mode.
 * 2. Each region declares min width/height; children use min-w-0 min-h-0 so flex
 *    can shrink them instead of painting on top of siblings.
 * 3. When min constraints cannot all be satisfied, the content scroller grows
 *    (overflow:auto) — boxes scroll apart instead of overlapping.
 * 4. Popovers/dialogs clamp to viewport margins; they are the only floating layer.
 */

import { PANEL_GAP, PANEL_MIN_WIDTH } from './panel-constants'

/** Minimum height for a chat content panel row in grid mode. */
export const PANEL_MIN_HEIGHT = 280

/** Minimum height for a right Tool Dock module. */
export const TOOL_DOCK_MODULE_MIN_HEIGHT = 120

/** Minimum height for the human terminal card. */
export const TERMINAL_MIN_HEIGHT = 140

export type ContentGridMode = 'single' | 'row' | 'grid'

export interface ContentPanelCell {
  panelIndex: number
  column: number
  row: number
  columnSpan: number
  rowSpan: number
}

export interface ContentGridSpec {
  mode: ContentGridMode
  columns: number
  rows: number
  columnTracks: string
  rowTracks: string
  cells: ContentPanelCell[]
}

/** Assign panels to non-overlapping grid cells per docs/37. */
export function getContentGridSpec(panelCount: number): ContentGridSpec {
  if (panelCount <= 1) {
    return {
      mode: 'single',
      columns: 1,
      rows: 1,
      columnTracks: '1fr',
      rowTracks: '1fr',
      cells: panelCount === 1 ? [{ panelIndex: 0, column: 1, row: 1, columnSpan: 1, rowSpan: 1 }] : [],
    }
  }

  if (panelCount === 2) {
    return {
      mode: 'row',
      columns: 2,
      rows: 1,
      columnTracks: '1fr 1fr',
      rowTracks: '1fr',
      cells: [
        { panelIndex: 0, column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
        { panelIndex: 1, column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
      ],
    }
  }

  if (panelCount === 3) {
    // 上二下一
    return {
      mode: 'grid',
      columns: 2,
      rows: 2,
      columnTracks: '1fr 1fr',
      rowTracks: '1fr 1fr',
      cells: [
        { panelIndex: 0, column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
        { panelIndex: 1, column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
        { panelIndex: 2, column: 1, row: 2, columnSpan: 2, rowSpan: 1 },
      ],
    }
  }

  if (panelCount === 4) {
    return {
      mode: 'grid',
      columns: 2,
      rows: 2,
      columnTracks: '1fr 1fr',
      rowTracks: '1fr 1fr',
      cells: [
        { panelIndex: 0, column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
        { panelIndex: 1, column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
        { panelIndex: 2, column: 1, row: 2, columnSpan: 1, rowSpan: 1 },
        { panelIndex: 3, column: 2, row: 2, columnSpan: 1, rowSpan: 1 },
      ],
    }
  }

  if (panelCount === 5) {
    // 上三下二
    return {
      mode: 'grid',
      columns: 6,
      rows: 2,
      columnTracks: 'repeat(6, 1fr)',
      rowTracks: '1fr 1fr',
      cells: [
        { panelIndex: 0, column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
        { panelIndex: 1, column: 3, row: 1, columnSpan: 2, rowSpan: 1 },
        { panelIndex: 2, column: 5, row: 1, columnSpan: 2, rowSpan: 1 },
        { panelIndex: 3, column: 1, row: 2, columnSpan: 3, rowSpan: 1 },
        { panelIndex: 4, column: 4, row: 2, columnSpan: 3, rowSpan: 1 },
      ],
    }
  }

  // 6: 上三下三
  return {
    mode: 'grid',
    columns: 3,
    rows: 2,
    columnTracks: '1fr 1fr 1fr',
    rowTracks: '1fr 1fr',
    cells: Array.from({ length: Math.min(panelCount, 6) }, (_, panelIndex) => ({
      panelIndex,
      column: (panelIndex % 3) + 1,
      row: Math.floor(panelIndex / 3) + 1,
      columnSpan: 1,
      rowSpan: 1,
    })),
  }
}

/** Minimum content-column size so panels never overlap — used for dock vs overlay. */
export function getRequiredContentSize(panelCount: number): { width: number; height: number } {
  const count = Math.max(panelCount, 1)
  const spec = getContentGridSpec(count)

  const width =
    spec.columns * PANEL_MIN_WIDTH +
    Math.max(0, spec.columns - 1) * PANEL_GAP

  const height =
    spec.rows * PANEL_MIN_HEIGHT +
    Math.max(0, spec.rows - 1) * PANEL_GAP

  return { width, height }
}

/** Auto layout policy when space is tight (docs/37). */
export function shouldAutoCollapseSidebar(panelCount: number): boolean {
  return panelCount >= 3
}

export function shouldPreferToolDockOverlay(panelCount: number): boolean {
  return panelCount >= 2
}
