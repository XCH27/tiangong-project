import { describe, expect, test } from 'bun:test'

import {
  findEqualGridLayout,
  getContentGridSpec,
  getMinDockedContentWidth,
  getRequiredContentSize,
  getAdaptivePanelMinWidth,
  shouldAutoCollapseGlobalSidebar,
} from '../workbench-layout'
import { PANEL_GAP } from '../panel-constants'
import { PANEL_MIN_WIDTH } from '../panel-constants'

describe('workbench-layout', () => {
  test('findEqualGridLayout uses zero-waste factorizations for 7+ fallback', () => {
    expect(findEqualGridLayout(2)).toEqual({ columns: 2, rows: 1 })
    expect(findEqualGridLayout(7)).toEqual({ columns: 7, rows: 1 })
    expect(findEqualGridLayout(8)).toEqual({ columns: 4, rows: 2 })
  })

  test('docs/37 grid recipes for 2–6 panels', () => {
    expect(getContentGridSpec(2)).toMatchObject({ columns: 2, rows: 1 })
    expect(getContentGridSpec(3)).toMatchObject({ columns: 2, rows: 2 })
    expect(getContentGridSpec(4)).toMatchObject({ columns: 2, rows: 2 })
    expect(getContentGridSpec(5)).toMatchObject({ columns: 3, rows: 2 })
    expect(getContentGridSpec(6)).toMatchObject({ columns: 3, rows: 2 })
  })

  test('3 panels use 上二下一 with bottom span', () => {
    const spec = getContentGridSpec(3)
    expect(spec.cells).toHaveLength(3)
    expect(spec.cells.find((c) => c.panelIndex === 2)).toMatchObject({
      column: 1,
      row: 2,
      columnSpan: 2,
      rowSpan: 1,
    })
  })

  test('5 panels use 上三下二 (3 top + 2 bottom)', () => {
    const spec = getContentGridSpec(5)
    expect(spec.cells).toHaveLength(5)
    const top = spec.cells.filter((c) => c.row === 1)
    const bottom = spec.cells.filter((c) => c.row === 2)
    expect(top.map((c) => c.panelIndex)).toEqual([0, 1, 2])
    expect(bottom.map((c) => c.panelIndex)).toEqual([3, 4])
  })

  test('6 panels fill 3×2 grid', () => {
    const spec = getContentGridSpec(6)
    expect(spec.cells).toHaveLength(6)
    expect(spec.cells.every((c) => c.columnSpan === 1 && c.rowSpan === 1)).toBe(true)
  })

  test('required content width follows grid columns not panel count', () => {
    expect(getRequiredContentSize(3).width).toBe(PANEL_MIN_WIDTH * 2 + PANEL_GAP)
    expect(getRequiredContentSize(5).width).toBe(PANEL_MIN_WIDTH * 3 + PANEL_GAP * 2)
    expect(getRequiredContentSize(6).width).toBe(PANEL_MIN_WIDTH * 3 + PANEL_GAP * 2)
    expect(getRequiredContentSize(5).height).toBeGreaterThan(getRequiredContentSize(2).height)
  })

  test('min docked content width is one column — grid cells share flex space', () => {
    expect(getMinDockedContentWidth(6)).toBe(PANEL_MIN_WIDTH)
    expect(getMinDockedContentWidth(1)).toBe(PANEL_MIN_WIDTH)
  })

  test('auto-collapse global sidebar at 5+ panels only', () => {
    expect(shouldAutoCollapseGlobalSidebar(4)).toBe(false)
    expect(shouldAutoCollapseGlobalSidebar(5)).toBe(true)
    expect(shouldAutoCollapseGlobalSidebar(6)).toBe(true)
  })

  test('adaptive min width is uniform for all panel counts', () => {
    expect(getAdaptivePanelMinWidth(1)).toBe(300)
    expect(getAdaptivePanelMinWidth(2)).toBe(PANEL_MIN_WIDTH)
    expect(getAdaptivePanelMinWidth(6)).toBe(PANEL_MIN_WIDTH)
  })
})
