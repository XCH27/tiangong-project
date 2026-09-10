import { describe, expect, it } from 'bun:test'
import {
  applySidebarToggle,
  resolveSidebarVisibility,
} from '../sidebar-visibility'

describe('resolveSidebarVisibility', () => {
  const desktop = {
    storedVisible: true,
    storedWidth: 220,
    focusMode: false,
    autoCompact: false,
  }

  it('renders stored width when visible on desktop', () => {
    const p = resolveSidebarVisibility(desktop)
    expect(p).toMatchObject({
      renderedWidth: 220,
      isRendered: true,
      showToggle: true,
      ariaPressed: true,
      titleFromSidebar: true,
      compensateForStoplight: false,
      resizeOffset: 220,
      toggleAction: 'hide',
    })
  })

  it('hides width when user preference is collapsed, without changing stored width', () => {
    const p = resolveSidebarVisibility({ ...desktop, storedVisible: false })
    expect(p.renderedWidth).toBe(0)
    expect(p.isRendered).toBe(false)
    expect(p.ariaPressed).toBe(false)
    expect(p.resizeOffset).toBe(0)
    expect(p.toggleAction).toBe('show')
    expect(p.titleFromSidebar).toBe(false)
    expect(p.compensateForStoplight).toBe(true)
  })

  it('focus mode zeros rendered width but preserves the stored preference for toggle', () => {
    const p = resolveSidebarVisibility({ ...desktop, focusMode: true })
    expect(p.renderedWidth).toBe(0)
    expect(p.ariaPressed).toBe(false)
    expect(p.toggleAction).toBe('exit-focus')
    expect(p.titleFromSidebar).toBe(true)
  })

  it('auto-compact hides toggle and width; preference is not rewritten', () => {
    const p = resolveSidebarVisibility({ ...desktop, autoCompact: true })
    expect(p.renderedWidth).toBe(0)
    expect(p.showToggle).toBe(false)
    expect(p.toggleAction).toBe('noop-compact')
    expect(p.ariaPressed).toBe(false)
  })

  it('never disagrees: renderedWidth>0 iff isRendered and ariaPressed on desktop', () => {
    for (const storedVisible of [true, false]) {
      for (const focusMode of [true, false]) {
        const p = resolveSidebarVisibility({
          ...desktop,
          storedVisible,
          focusMode,
        })
        expect(p.isRendered).toBe(p.renderedWidth > 0)
        expect(p.ariaPressed).toBe(p.isRendered)
        expect(p.resizeOffset).toBe(p.renderedWidth)
      }
    }
  })
})

describe('applySidebarToggle (pure state transitions)', () => {
  it('one action reveals a hidden desktop sidebar', () => {
    const next = applySidebarToggle({
      storedVisible: false,
      storedWidth: 220,
      focusMode: false,
      autoCompact: false,
    })
    expect(next).toEqual({ storedVisible: true, focusMode: false })
    const projected = resolveSidebarVisibility({
      storedVisible: next.storedVisible,
      storedWidth: 220,
      focusMode: next.focusMode,
      autoCompact: false,
    })
    expect(projected.isRendered).toBe(true)
    expect(projected.ariaPressed).toBe(true)
    expect(projected.renderedWidth).toBe(220)
  })

  it('one action hides a visible desktop sidebar', () => {
    const next = applySidebarToggle({
      storedVisible: true,
      storedWidth: 220,
      focusMode: false,
      autoCompact: false,
    })
    expect(next).toEqual({ storedVisible: false, focusMode: false })
    const projected = resolveSidebarVisibility({
      storedVisible: next.storedVisible,
      storedWidth: 220,
      focusMode: next.focusMode,
      autoCompact: false,
    })
    expect(projected.isRendered).toBe(false)
    expect(projected.ariaPressed).toBe(false)
    expect(projected.renderedWidth).toBe(0)
  })

  it('first toggle exits focus mode without flipping stored visibility', () => {
    const next = applySidebarToggle({
      storedVisible: true,
      storedWidth: 220,
      focusMode: true,
      autoCompact: false,
    })
    expect(next).toEqual({ storedVisible: true, focusMode: false })
  })

  it('compact toggle is a no-op so state cannot diverge under auto-compact', () => {
    const next = applySidebarToggle({
      storedVisible: true,
      storedWidth: 220,
      focusMode: false,
      autoCompact: true,
    })
    expect(next).toEqual({ storedVisible: true, focusMode: false })
  })

  it('round-trip hide then reveal restores rendered width and aria', () => {
    let state = { storedVisible: true, focusMode: false }
    state = applySidebarToggle({
      ...state,
      storedWidth: 260,
      autoCompact: false,
    })
    expect(state.storedVisible).toBe(false)
    state = applySidebarToggle({
      ...state,
      storedWidth: 260,
      autoCompact: false,
    })
    expect(state.storedVisible).toBe(true)
    const p = resolveSidebarVisibility({
      storedVisible: state.storedVisible,
      storedWidth: 260,
      focusMode: state.focusMode,
      autoCompact: false,
    })
    expect(p.renderedWidth).toBe(260)
    expect(p.ariaPressed).toBe(true)
  })
})
