import { describe, expect, it } from 'bun:test'
import { resolveResponsivePanelLayout } from '../responsive-panel-layout'

const desktopLayout = {
  compact: false,
  focusMode: false,
  sidebarVisible: true,
  sidebarWidth: 260,
  navigatorVisible: true,
  navigatorWidth: 340,
  workbenchVisible: true,
  workbenchWidth: 420,
}

describe('responsive panel layout', () => {
  it('preserves the main panel by yielding optional chrome at narrow widths', () => {
    expect(resolveResponsivePanelLayout({
      ...desktopLayout,
      containerWidth: 900,
    })).toEqual({
      sidebarWidth: 260,
      navigatorWidth: 0,
      workbenchWidth: 0,
    })
  })

  // Regression: responsive projection used to collapse the global sidebar
  // without updating its explicit visibility state. The toolbar toggle then
  // flipped true/false while both projections still rendered width 0.
  it('never auto-collapses the explicitly visible global sidebar', () => {
    const layout = resolveResponsivePanelLayout({
      ...desktopLayout,
      containerWidth: 1_200,
    })

    expect(layout.sidebarWidth).toBe(260)
    expect(layout.navigatorWidth).toBe(340)
    expect(layout.workbenchWidth).toBe(0)
  })

  it('keeps the global sidebar when it is the only navigation surface', () => {
    const layout = resolveResponsivePanelLayout({
      ...desktopLayout,
      containerWidth: 900,
      navigatorVisible: false,
    })

    expect(layout.sidebarWidth).toBe(260)
    expect(layout.navigatorWidth).toBe(0)
    expect(layout.workbenchWidth).toBe(0)
  })

  it('yields the page navigator only to preserve the main panel', () => {
    const layout = resolveResponsivePanelLayout({
      ...desktopLayout,
      containerWidth: 1_000,
    })

    expect(layout.sidebarWidth).toBe(260)
    expect(layout.navigatorWidth).toBe(0)
    expect(layout.workbenchWidth).toBe(0)
  })

  it('keeps a usable workbench when it fits beside the main panel', () => {
    const layout = resolveResponsivePanelLayout({
      ...desktopLayout,
      containerWidth: 1_800,
    })

    expect(layout.sidebarWidth).toBe(260)
    expect(layout.navigatorWidth).toBe(340)
    expect(layout.workbenchWidth).toBeGreaterThanOrEqual(320)
  })
})
