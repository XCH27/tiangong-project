import { describe, expect, it } from 'bun:test'

import { getToolDockGridSpec, reorderToolDockModules, buildToolDockStackGridTemplateRows } from '../tool-dock-layout'

describe('getToolDockGridSpec', () => {
  it('fills a single module cell', () => {
    const spec = getToolDockGridSpec(1)
    expect(spec.cells).toHaveLength(1)
    expect(spec.rowTracks).toContain('1fr')
  })

  it('stacks two modules vertically with equal tracks', () => {
    const spec = getToolDockGridSpec(2)
    expect(spec.rows).toBe(2)
    expect(spec.cells.map((cell) => cell.row)).toEqual([1, 2])
  })

  it('uses a 2+1 grid for three modules', () => {
    const spec = getToolDockGridSpec(3)
    expect(spec.columns).toBe(2)
    expect(spec.rows).toBe(2)
    expect(spec.cells.find((cell) => cell.moduleIndex === 2)?.columnSpan).toBe(2)
  })
})

describe('buildToolDockStackGridTemplateRows', () => {
  it('interleaves fr module tracks with fixed sash rows', () => {
    const rows = buildToolDockStackGridTemplateRows(['progress', 'files', 'review'], {
      progress: 0.25,
      files: 0.35,
      review: 0.4,
    })
    expect(rows).toBe('minmax(0, 0.25fr) 6px minmax(0, 0.35fr) 6px minmax(0, 0.4fr)')
  })
})

describe('reorderToolDockModules', () => {
  it('moves a module to another slot', () => {
    expect(reorderToolDockModules(['progress', 'files', 'review'], 2, 0)).toEqual([
      'review',
      'progress',
      'files',
    ])
  })
})
