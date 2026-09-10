import { describe, expect, it } from 'bun:test'
import {
  CHAT_PANE_WIDTH_MIN,
  WORKBENCH_WIDTH_MIN_COMPACT,
  WORKBENCH_WIDTH_MIN_CONTENT,
  WORKBENCH_WIDTH_MIN_SPLIT,
  chatPaneWidthMax,
  clampChatPaneWidth,
  resolveSessionPaneLayout,
  resolveWorkbenchStacking,
  workbenchModuleWidthMin,
} from '../session-pane-layout'

const base = {
  chatWidth: 600,
  workbenchRequested: true,
  chromeWidth: 24,
} as const

describe('workbench module floors', () => {
  it('scales the floor to what the module actually needs', () => {
    expect(workbenchModuleWidthMin('task-board')).toBe(WORKBENCH_WIDTH_MIN_COMPACT)
    expect(workbenchModuleWidthMin('side-task')).toBe(WORKBENCH_WIDTH_MIN_COMPACT)
    expect(workbenchModuleWidthMin('canvas')).toBe(WORKBENCH_WIDTH_MIN_COMPACT)
    expect(workbenchModuleWidthMin('browser')).toBe(WORKBENCH_WIDTH_MIN_CONTENT)
    expect(workbenchModuleWidthMin('terminal')).toBe(WORKBENCH_WIDTH_MIN_CONTENT)
    expect(workbenchModuleWidthMin('review')).toBe(WORKBENCH_WIDTH_MIN_CONTENT)
    expect(workbenchModuleWidthMin('review', { diffStyle: 'split' }))
      .toBe(WORKBENCH_WIDTH_MIN_SPLIT)
  })
})

describe('resolveSessionPaneLayout', () => {
  it('gives the workbench the remainder rather than a fixed column', () => {
    const layout = resolveSessionPaneLayout({
      ...base,
      containerWidth: 1_400,
      workbenchKind: 'review',
    })

    expect(layout.workbenchVisible).toBe(true)
    expect(layout.chatWidth).toBe(600)
    expect(layout.chatWidth + layout.workbenchWidth).toBe(1_400 - base.chromeWidth)
  })

  // The four-column resolver needed ~1440px before the workbench could appear
  // at all. A checklist beside a chat pane fits in far less than that.
  it('opens a compact module at widths the old four-column shell refused', () => {
    const layout = resolveSessionPaneLayout({
      ...base,
      chatWidth: 520,
      containerWidth: 900,
      workbenchKind: 'task-board',
    })

    expect(layout.workbenchVisible).toBe(true)
    expect(layout.workbenchWidth).toBeGreaterThanOrEqual(WORKBENCH_WIDTH_MIN_COMPACT)
    expect(layout.chatWidth).toBeGreaterThanOrEqual(CHAT_PANE_WIDTH_MIN)
  })

  it('shrinks an oversized stored chat width instead of starving the workbench', () => {
    const layout = resolveSessionPaneLayout({
      ...base,
      chatWidth: 5_000,
      containerWidth: 1_200,
      workbenchKind: 'review',
    })

    expect(layout.workbenchWidth).toBe(WORKBENCH_WIDTH_MIN_CONTENT)
    expect(layout.chatWidth).toBe(1_200 - base.chromeWidth - WORKBENCH_WIDTH_MIN_CONTENT)
  })

  // Reporting *why* the panel is unavailable is the whole point: the previous
  // implementation flipped the toggle and rendered nothing.
  it('reports a width block rather than silently rendering nothing', () => {
    const layout = resolveSessionPaneLayout({
      ...base,
      containerWidth: 900,
      workbenchKind: 'review',
      diffStyle: 'split',
    })

    expect(layout.workbenchVisible).toBe(false)
    expect(layout.workbenchBlockedByWidth).toBe(true)
    expect(layout.workbenchWidth).toBe(0)
  })

  it('does not report a block when the workbench was never requested', () => {
    const layout = resolveSessionPaneLayout({
      ...base,
      containerWidth: 700,
      workbenchRequested: false,
    })

    expect(layout.workbenchVisible).toBe(false)
    expect(layout.workbenchBlockedByWidth).toBe(false)
    expect(layout.chatWidth).toBe(700 - base.chromeWidth)
  })

  it('preserves the requested shape before the row is measured', () => {
    const layout = resolveSessionPaneLayout({ ...base, containerWidth: 0 })

    expect(layout.chatWidth).toBe(600)
    expect(layout.workbenchVisible).toBe(true)
    expect(layout.workbenchBlockedByWidth).toBe(false)
  })
})

describe('chat pane width clamping', () => {
  it('never clamps below the chat floor', () => {
    expect(chatPaneWidthMax({ available: 500, workbenchMin: 480 }))
      .toBe(CHAT_PANE_WIDTH_MIN)
  })

  it('leaves a stored width alone until the row is measured', () => {
    expect(clampChatPaneWidth({ width: 9_000, available: undefined, workbenchMin: 480 }))
      .toBe(9_000)
  })
})

describe('resolveWorkbenchStacking', () => {
  it('stacks two content modules instead of splitting the width again', () => {
    expect(resolveWorkbenchStacking({ kinds: ['review', 'terminal'] }))
      .toEqual({ visible: true, stacked: true })
  })

  it('keeps a content module beside a compact one unstacked', () => {
    expect(resolveWorkbenchStacking({ kinds: ['review', 'task-board'] }))
      .toEqual({ visible: true, stacked: false })
  })

  it('reports an empty workbench as not visible', () => {
    expect(resolveWorkbenchStacking({ kinds: [] }))
      .toEqual({ visible: false, stacked: false })
  })
})
