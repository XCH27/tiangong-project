import { describe, it, expect } from 'bun:test'
import {
  LAYOUT_SCHEMA_VERSION,
  MAX_TREE_DEPTH,
  MIN_SPLIT_CHILD_FRACTION,
  coerceLayout,
  countPanelKind,
  createDefaultLayout,
  findPaneById,
  findSplitChildByPanelKind,
  insertRootSplitPane,
  removeRootSplitPaneByKind,
  setPaneCollapsed,
  setSplitChildFraction,
  validateLayout,
  walkPanes,
  type Layout,
  type PaneNode,
  type SplitNode,
} from '../tree.ts'

function sum(layout: Layout): number {
  const root = layout.content as SplitNode
  return root.children.reduce((acc, c) => acc + c.fraction, 0)
}

describe('the default layout', () => {
  it('is legal', () => {
    expect(validateLayout(createDefaultLayout())).toEqual({ ok: true })
  })

  it('is a fresh object each time, so callers may edit it', () => {
    const a = createDefaultLayout()
    const b = createDefaultLayout()
    ;(a.content as SplitNode).children[0]!.fraction = 0.9
    expect((b.content as SplitNode).children[0]!.fraction).not.toBe(0.9)
  })

  it('reproduces the arrangement the app already shows', () => {
    const layout = createDefaultLayout()
    expect(walkPanes(layout).map((p) => p.panelKind)).toEqual([
      'nav-sidebar',
      'navigator',
      'main',
      'workbench',
    ])
  })
})

describe('validation', () => {
  it('requires exactly one main pane', () => {
    const layout = createDefaultLayout()
    const root = layout.content as SplitNode
    root.children[2]!.node = { type: 'pane', id: 'main2', panelKind: 'main' }
    expect(validateLayout(layout)).toMatchObject({ ok: false })
  })

  it('refuses a collapsed main pane, because it can never be reopened', () => {
    const layout = createDefaultLayout()
    const root = layout.content as SplitNode
    ;(root.children[1]!.node as { collapsed?: boolean }).collapsed = true
    expect(validateLayout(layout)).toMatchObject({ ok: false })
  })

  it('keeps the nav sidebar out of the content tree', () => {
    const layout = createDefaultLayout()
    const root = layout.content as SplitNode
    root.children[0]!.node = { type: 'pane', id: 'nav2', panelKind: 'nav-sidebar' }
    expect(validateLayout(layout)).toMatchObject({ ok: false })
  })

  it('rejects duplicate node ids anywhere in the layout', () => {
    const layout = createDefaultLayout()
    const root = layout.content as SplitNode
    root.children[2]!.node.id = 'navigator'
    expect(validateLayout(layout)).toMatchObject({ ok: false, reason: expect.stringContaining('duplicate') })
  })

  it('rejects fractions that do not sum to one', () => {
    const layout = createDefaultLayout()
    ;(layout.content as SplitNode).children[0]!.fraction = 0.9
    expect(validateLayout(layout)).toMatchObject({ ok: false })
  })

  it('rejects a split with fewer than two children', () => {
    const layout = createDefaultLayout()
    const root = layout.content as SplitNode
    root.children = [root.children[1]!]
    root.children[0]!.fraction = 1
    expect(validateLayout(layout)).toMatchObject({ ok: false })
  })

  it('rejects a tree deeper than the limit rather than recursing into it', () => {
    const layout = createDefaultLayout()
    let node: SplitNode = layout.content as SplitNode
    for (let i = 0; i < MAX_TREE_DEPTH + 2; i++) {
      const deeper: SplitNode = {
        type: 'split',
        id: `deep-${i}`,
        direction: 'row',
        children: [
          { fraction: 0.5, node: { type: 'pane', id: `a-${i}`, panelKind: 'workbench' } },
          { fraction: 0.5, node: { type: 'pane', id: `b-${i}`, panelKind: 'workbench' } },
        ],
      }
      node.children[0]!.node = deeper
      node = deeper
    }
    expect(validateLayout(layout)).toMatchObject({ ok: false, reason: expect.stringContaining('deeper') })
  })

  it('accepts an unregistered panel kind — an uninstalled surface is not an illegal tree', () => {
    const layout = createDefaultLayout()
    ;((layout.content as SplitNode).children[2]!.node as PaneNode).panelKind = 'surface:canvas'
    expect(validateLayout(layout)).toEqual({ ok: true })
  })
})

describe('coercion', () => {
  it('falls back to the default for anything unusable, and says why', () => {
    for (const bad of [null, 42, 'layout', [], { schemaVersion: 99 }]) {
      const result = coerceLayout(bad)
      expect(result.fallback).toBe(true)
      expect(result.reason).toBeTruthy()
      expect(validateLayout(result.layout)).toEqual({ ok: true })
    }
  })

  it('never throws on a circular structure', () => {
    const circular: Record<string, unknown> = { schemaVersion: LAYOUT_SCHEMA_VERSION }
    circular.self = circular
    expect(() => coerceLayout(circular)).not.toThrow()
    expect(coerceLayout(circular).fallback).toBe(true)
  })

  it('passes a good layout through and detaches it from the caller', () => {
    const source = createDefaultLayout()
    const result = coerceLayout(source)
    expect(result.fallback).toBe(false)
    ;(result.layout.content as SplitNode).children[0]!.fraction = 0.11
    expect((source.content as SplitNode).children[0]!.fraction).not.toBe(0.11)
  })
})

describe('operations', () => {
  it('collapses a pane and leaves the input untouched', () => {
    const layout = createDefaultLayout()
    const result = setPaneCollapsed(layout, 'workbench', true)
    expect(result.applied).toBe(true)
    expect(findPaneById(result.layout, 'workbench')?.collapsed).toBe(true)
    expect(findPaneById(layout, 'workbench')?.collapsed).toBeUndefined()
  })

  it('refuses to collapse the main pane and returns the original by reference', () => {
    const layout = createDefaultLayout()
    const result = setPaneCollapsed(layout, 'main', true)
    expect(result.applied).toBe(false)
    expect(result.layout).toBe(layout)
  })

  it('reports a missing pane instead of silently doing nothing', () => {
    const result = setPaneCollapsed(createDefaultLayout(), 'ghost', true)
    expect(result).toMatchObject({ applied: false, reason: expect.stringContaining('ghost') })
  })

  it('resizes a child and keeps the shares summing to one', () => {
    const layout = createDefaultLayout()
    const result = setSplitChildFraction(layout, 'root', 0, 0.4)
    expect(result.applied).toBe(true)
    expect((result.layout.content as SplitNode).children[0]!.fraction).toBeCloseTo(0.4, 10)
    expect(sum(result.layout)).toBeCloseTo(1, 10)
  })

  it('accepts a share clamped exactly to the floor, float residue and all', () => {
    // 0.4589135021784424 - 0.05 added back is 0.04999999999999999. Without the
    // tolerance this legal, already-clamped transfer is rejected and the drag
    // springs back at precisely the boundary the clamp aimed for.
    const layout = createDefaultLayout()
    const residual = 0.4589135021784424 - 0.4589135021784424 + (0.4589135021784424 - 0.05)
    const result = setSplitChildFraction(layout, 'root', 0, 0.4589135021784424 - residual)
    expect(result.applied).toBe(true)
  })

  it('refuses a transfer that would starve a sibling, rather than clamping it', () => {
    const result = setSplitChildFraction(createDefaultLayout(), 'root', 0, 0.99)
    expect(result.applied).toBe(false)
  })

  it('rejects a non-integer or out-of-range child index', () => {
    const layout = createDefaultLayout()
    expect(setSplitChildFraction(layout, 'root', 1.5, 0.4).applied).toBe(false)
    expect(setSplitChildFraction(layout, 'root', 9, 0.4).applied).toBe(false)
    expect(setSplitChildFraction(layout, 'nope', 0, 0.4).applied).toBe(false)
  })

  it('docks a new surface without disturbing the invariants', () => {
    const layout = createDefaultLayout()
    const result = insertRootSplitPane(layout, { id: 'canvas', panelKind: 'surface:canvas' }, 0.3)
    expect(result.applied).toBe(true)
    expect(countPanelKind(result.layout, 'surface:canvas')).toBe(1)
    expect(countPanelKind(result.layout, 'main')).toBe(1)
    expect(sum(result.layout)).toBeCloseTo(1, 10)
  })

  it('clamps an absurd share for a newly docked surface', () => {
    const result = insertRootSplitPane(createDefaultLayout(), { id: 'c', panelKind: 'surface:canvas' }, 5)
    expect(result.applied).toBe(true)
    const ref = findSplitChildByPanelKind(result.layout, 'surface:canvas')
    expect(ref!.fraction).toBeLessThanOrEqual(0.8)
    expect(ref!.fraction).toBeGreaterThanOrEqual(MIN_SPLIT_CHILD_FRACTION)
  })

  it('refuses to dock a pane whose id is already taken', () => {
    const result = insertRootSplitPane(createDefaultLayout(), { id: 'main', panelKind: 'surface:canvas' })
    expect(result.applied).toBe(false)
  })

  it('undocks a surface by kind', () => {
    const docked = insertRootSplitPane(createDefaultLayout(), { id: 'c', panelKind: 'surface:canvas' })
    const result = removeRootSplitPaneByKind(docked.layout, 'surface:canvas')
    expect(result.applied).toBe(true)
    expect(countPanelKind(result.layout, 'surface:canvas')).toBe(0)
    expect(sum(result.layout)).toBeCloseTo(1, 10)
  })

  it('refuses to undock the main pane', () => {
    const result = removeRootSplitPaneByKind(createDefaultLayout(), 'main')
    expect(result.applied).toBe(false)
  })

  it('finds a panel by kind rather than by position, so moving it does not break lookups', () => {
    const layout = createDefaultLayout()
    const root = layout.content as SplitNode
    root.children.reverse()
    expect(findSplitChildByPanelKind(layout, 'workbench')?.childIndex).toBe(0)
  })
})
