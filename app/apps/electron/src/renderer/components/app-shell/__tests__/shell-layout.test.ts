import { describe, expect, it } from 'bun:test'
import { resolveSessionPaneLayout } from '../session-pane-layout'
import {
  contentRowWidth,
  preferredChatWidthFromWorkbenchStore,
  resolveShellLayout,
} from '../shell-layout'

/**
 * Proves AppShell's production layout path routes chat/workbench through
 * resolveSessionPaneLayout (not a second competing workbench fitter).
 */
describe('resolveShellLayout production composition', () => {
  const desktopBase = {
    shellWidth: 1_600,
    compact: false,
    focusMode: false,
    sidebarStoredVisible: true,
    sidebarStoredWidth: 220,
    navigatorNeeded: false,
    navigatorStoredWidth: 300,
    workbenchRequested: true,
    workbenchStoredWidth: 420,
    workbenchKind: 'task-board' as const,
  }

  it('calls the session-pane model for chat/workbench (not a fixed workbench column)', () => {
    const layout = resolveShellLayout(desktopBase)
    const contentW = contentRowWidth(
      desktopBase.shellWidth,
      layout.sidebarWidth,
      layout.navigatorWidth,
    )
    const direct = resolveSessionPaneLayout({
      containerWidth: contentW,
      chatWidth: preferredChatWidthFromWorkbenchStore({
        contentWidth: contentW,
        workbenchStoredWidth: desktopBase.workbenchStoredWidth,
        workbenchRequested: true,
      }),
      workbenchRequested: true,
      workbenchKind: 'task-board',
      chromeWidth: 0,
    })

    expect(layout.sessionPane).toEqual(direct)
    expect(layout.workbenchWidth).toBe(direct.workbenchWidth)
    expect(layout.workbenchVisible).toBe(direct.workbenchVisible)
    expect(layout.chatWidth).toBe(direct.chatWidth)
    // Workbench is the remainder after chat — the session-pane signature.
    expect(layout.workbenchWidth).toBe(contentW - layout.chatWidth)
  })

  it('blocks a content module when the row is too narrow (session-pane floor)', () => {
    const layout = resolveShellLayout({
      ...desktopBase,
      shellWidth: 700,
      workbenchKind: 'review',
      workbenchStoredWidth: 480,
    })
    // Chat floor 450 + review floor 480 cannot both fit in ~700 after sidebar.
    expect(layout.workbenchBlockedByWidth).toBe(true)
    expect(layout.workbenchVisible).toBe(false)
    expect(layout.workbenchWidth).toBe(0)
  })

  it('opens a compact module at widths the old four-column fitter refused', () => {
    const layout = resolveShellLayout({
      ...desktopBase,
      shellWidth: 1_050,
      workbenchKind: 'task-board',
      workbenchStoredWidth: 320,
    })
    expect(layout.sidebarWidth).toBe(220)
    expect(layout.workbenchVisible).toBe(true)
    expect(layout.workbenchWidth).toBeGreaterThanOrEqual(320)
  })

  it('hides sidebar width via the same projection AppShell paints', () => {
    const layout = resolveShellLayout({
      ...desktopBase,
      sidebarStoredVisible: false,
    })
    expect(layout.sidebarWidth).toBe(0)
    expect(layout.sidebar.ariaPressed).toBe(false)
    expect(layout.sidebar.isRendered).toBe(false)
  })

  it('matches AppShell probe: workbenchRequested true reports blocked vs open consistently', () => {
    const open = resolveShellLayout({ ...desktopBase, workbenchRequested: true })
    const closed = resolveShellLayout({ ...desktopBase, workbenchRequested: false })
    expect(open.workbenchVisible).toBe(true)
    expect(closed.workbenchVisible).toBe(false)
    expect(closed.workbenchBlockedByWidth).toBe(false)
  })
})

describe('AppShell production integration contract', () => {
  it('exports resolveShellLayout as the sole shell workbench authority used by AppShell', async () => {
    // Static proof: AppShell imports resolveShellLayout and does not import
    // resolveResponsivePanelLayout (workbench no longer uses that fitter).
    const appShellSource = await Bun.file(
      new URL('../AppShell.tsx', import.meta.url),
    ).text()
    expect(appShellSource).toContain('resolveShellLayout')
    expect(appShellSource).toContain('from "./shell-layout"')
    expect(appShellSource).not.toContain('resolveResponsivePanelLayout')
    // shell-layout must invoke resolveSessionPaneLayout
    const shellSource = await Bun.file(
      new URL('../shell-layout.ts', import.meta.url),
    ).text()
    expect(shellSource).toContain('resolveSessionPaneLayout(')
  })
})
