/**
 * Workbench layout contract (docs/37).
 *
 * Anti-overlap rules:
 * 1. Primary regions (sidebar / navigator / content / tool dock) live in flex
 *    document flow — never absolute, except the explicit right-rail overlay mode.
 * 2. Each region declares min width/height; children use min-w-0 min-h-0 so flex
 *    can shrink them instead of painting on top of siblings.
 * 3. When min constraints cannot all be satisfied, panels shrink (min-w-0) and inner
 *    content truncates — no horizontal scroll on the panel row.
 * 4. Popovers/dialogs clamp to viewport margins; they are the only floating layer.
 *
 * Content panel grid recipes (docs/37 §0.4 / §81):
 * - 2: side-by-side (2×1)
 * - 3: 上二下一 (2×2, bottom spans full width)
 * - 4: 2×2
 * - 5: 上三下二 (3×2, one empty cell bottom-right)
 * - 6: 上三下三 (3×2)
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

/** Uniform per-panel min width for all layout modes (docs/37 §6.4). */
export function getAdaptivePanelMinWidth(_panelCount: number): number {
  return PANEL_MIN_WIDTH
}

/** Pick cols×rows with zero empty cells; prefer wider layouts when tied. Used for 7+ panels. */
export function findEqualGridLayout(panelCount: number): { columns: number; rows: number } {
  if (panelCount <= 1) return { columns: 1, rows: 1 }

  let best = { columns: panelCount, rows: 1, waste: 0, aspect: panelCount }

  for (let columns = 1; columns <= panelCount; columns++) {
    const rows = Math.ceil(panelCount / columns)
    const waste = columns * rows - panelCount
    const aspect = Math.abs(columns - rows)
    const isBetter =
      waste < best.waste ||
      (waste === best.waste && aspect < best.aspect) ||
      (waste === best.waste && aspect === best.aspect && columns > best.columns)

    if (isBetter) {
      best = { columns, rows, waste, aspect }
    }
  }

  return { columns: best.columns, rows: best.rows }
}

function buildGridSpec(
  columns: number,
  rows: number,
  cells: ContentPanelCell[],
): ContentGridSpec {
  return {
    mode: 'grid',
    columns,
    rows,
    columnTracks: Array.from({ length: columns }, () => '1fr').join(' '),
    rowTracks: Array.from({ length: rows }, () => '1fr').join(' '),
    cells,
  }
}

function rowMajorCells(panelCount: number, columns: number): ContentPanelCell[] {
  return Array.from({ length: panelCount }, (_, panelIndex) => ({
    panelIndex,
    column: (panelIndex % columns) + 1,
    row: Math.floor(panelIndex / columns) + 1,
    columnSpan: 1,
    rowSpan: 1,
  }))
}

/** Grid assignments for 2–6 content panels (docs/37). */
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
    return buildGridSpec(2, 1, rowMajorCells(2, 2))
  }

  if (panelCount === 3) {
    // 上二下一 — same topology as Tool Dock 3-module grid
    return buildGridSpec(2, 2, [
      { panelIndex: 0, column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
      { panelIndex: 1, column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
      { panelIndex: 2, column: 1, row: 2, columnSpan: 2, rowSpan: 1 },
    ])
  }

  if (panelCount === 4) {
    return buildGridSpec(2, 2, rowMajorCells(4, 2))
  }

  if (panelCount === 5) {
    // 上三下二
    return buildGridSpec(3, 2, [
      { panelIndex: 0, column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
      { panelIndex: 1, column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
      { panelIndex: 2, column: 3, row: 1, columnSpan: 1, rowSpan: 1 },
      { panelIndex: 3, column: 1, row: 2, columnSpan: 1, rowSpan: 1 },
      { panelIndex: 4, column: 2, row: 2, columnSpan: 1, rowSpan: 1 },
    ])
  }

  if (panelCount === 6) {
    // 上三下三
    return buildGridSpec(3, 2, rowMajorCells(6, 3))
  }

  const { columns, rows } = findEqualGridLayout(panelCount)
  return buildGridSpec(columns, rows, rowMajorCells(panelCount, columns))
}

/** Minimum content width for dock-vs-overlay (grid cells shrink via minmax(0,1fr)). */
export function getMinDockedContentWidth(_panelCount: number): number {
  return PANEL_MIN_WIDTH
}

/** Minimum content-column size — used for layout diagnostics / scroll hints. */
export function getRequiredContentSize(panelCount: number): { width: number; height: number } {
  const count = Math.max(panelCount, 1)
  const spec = getContentGridSpec(count)
  const minPanelWidth = getAdaptivePanelMinWidth(count)

  const width =
    spec.columns * minPanelWidth +
    Math.max(0, spec.columns - 1) * PANEL_GAP

  const height =
    spec.rows * PANEL_MIN_HEIGHT +
    Math.max(0, spec.rows - 1) * PANEL_GAP

  return { width, height }
}

/** @deprecated §6.4 — global sidebar may auto-collapse at high panel count; navigator stays. */
export function shouldAutoCollapseGlobalSidebar(panelCount: number): boolean {
  return panelCount >= 5
}

/** @deprecated §6.4 — Tool Dock overlay is width-based only (see AppShell dock check). */
export function shouldPreferToolDockOverlay(_panelCount: number): boolean {
  return false
}
