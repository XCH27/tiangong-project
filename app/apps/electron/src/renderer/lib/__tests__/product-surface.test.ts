import { describe, expect, it } from 'bun:test'
import {
  BOARD_VIEW_ENABLED,
  isWorkbenchModuleOpenable,
  WORKBENCH_OPENABLE_MODULES,
} from '../product-surface'

describe('product-surface gates', () => {
  it('keeps full-width Board off by default', () => {
    expect(BOARD_VIEW_ENABLED).toBe(false)
  })

  it('registers every R18 workbench module while leaving top-level Board gated', () => {
    expect(WORKBENCH_OPENABLE_MODULES).toEqual([
      'side-task',
      'task-board',
      'browser',
      'review',
      'terminal',
      'canvas',
    ])
    expect(isWorkbenchModuleOpenable('browser')).toBe(true)
    expect(isWorkbenchModuleOpenable('side-task')).toBe(true)
    expect(isWorkbenchModuleOpenable('task-board')).toBe(true)
    expect(isWorkbenchModuleOpenable('review')).toBe(true)
    expect(isWorkbenchModuleOpenable('terminal')).toBe(true)
    expect(isWorkbenchModuleOpenable('canvas')).toBe(true)
    // Top-level Board remains a separate product gate (not a workbench kind).
    expect(BOARD_VIEW_ENABLED).toBe(false)
  })
})
