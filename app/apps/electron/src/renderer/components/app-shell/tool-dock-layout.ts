/**
 * Tool Dock grid layout (docs/37).
 * Modules live inside one non-overlapping grid box; removing a module reflows fr tracks.
 */

import { PANEL_GAP } from './panel-constants'
import type { ToolDockModuleId } from './tool-dock-config'

export interface ToolDockGridCell {
  /** Index into the ordered activeModules array. */
  moduleIndex: number
  column: number
  row: number
  columnSpan: number
  rowSpan: number
}

export interface ToolDockGridSpec {
  columns: number
  rows: number
  columnTracks: string
  rowTracks: string
  cells: ToolDockGridCell[]
}

/** Non-overlapping grid assignments for 1–3 dock modules. */
export function getToolDockGridSpec(moduleCount: number): ToolDockGridSpec {
  if (moduleCount <= 1) {
    return {
      columns: 1,
      rows: 1,
      columnTracks: 'minmax(0, 1fr)',
      rowTracks: 'minmax(0, 1fr)',
      cells: moduleCount === 1
        ? [{ moduleIndex: 0, column: 1, row: 1, columnSpan: 1, rowSpan: 1 }]
        : [],
    }
  }

  if (moduleCount === 2) {
    return {
      columns: 1,
      rows: 2,
      columnTracks: 'minmax(0, 1fr)',
      rowTracks: 'minmax(0, 1fr) minmax(0, 1fr)',
      cells: [
        { moduleIndex: 0, column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
        { moduleIndex: 1, column: 1, row: 2, columnSpan: 1, rowSpan: 1 },
      ],
    }
  }

  // 3 modules: 上二下一（与内容区 3 面板一致，支持左右 + 上下重排）
  return {
    columns: 2,
    rows: 2,
    columnTracks: 'minmax(0, 1fr) minmax(0, 1fr)',
    rowTracks: 'minmax(0, 1fr) minmax(0, 1fr)',
    cells: [
      { moduleIndex: 0, column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
      { moduleIndex: 1, column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
      { moduleIndex: 2, column: 1, row: 2, columnSpan: 2, rowSpan: 1 },
    ],
  }
}

/** Vertical stack: module fr tracks interleaved with fixed PANEL_GAP sash rows. */
export function buildToolDockStackGridTemplateRows(
  modules: ToolDockModuleId[],
  ratios: Partial<Record<ToolDockModuleId, number>>,
): string {
  if (modules.length === 0) return 'minmax(0, 1fr)'

  const tracks: string[] = []
  for (let i = 0; i < modules.length; i++) {
    const id = modules[i]!
    const weight = ratios[id] ?? 1 / modules.length
    tracks.push(`minmax(0, ${weight}fr)`)
    if (i < modules.length - 1) {
      tracks.push(`${PANEL_GAP}px`)
    }
  }
  return tracks.join(' ')
}

export function toolDockModuleGridRow(moduleIndex: number): number {
  return moduleIndex * 2 + 1
}

export function toolDockSashGridRow(afterModuleIndex: number): number {
  return afterModuleIndex * 2 + 2
}

export function reorderToolDockModules(
  modules: ToolDockModuleId[],
  fromIndex: number,
  toIndex: number,
): ToolDockModuleId[] {
  if (
    fromIndex === toIndex
    || fromIndex < 0
    || toIndex < 0
    || fromIndex >= modules.length
    || toIndex >= modules.length
  ) {
    return modules
  }

  const next = [...modules]
  const [moved] = next.splice(fromIndex, 1)
  if (!moved) return modules
  next.splice(toIndex, 0, moved)
  return next
}
