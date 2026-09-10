/**
 * Production sidebar chrome integration.
 *
 * Mounts production leaves AppShell/TopBar/PanelStackContainer actually use:
 * - TopBarButton (toggle TopBar paints with projection attrs)
 * - SidebarPanelSlot (sidebar column PanelStackContainer paints)
 *
 * Toggle path: applySidebarToggle + resolveShellLayout (AppShell's path).
 * SSR re-render only — no page clicks.
 */

import { describe, expect, it } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  applySidebarToggle,
  resolveSidebarVisibility,
  type SidebarVisibilityInput,
} from '../sidebar-visibility'
import { resolveShellLayout } from '../shell-layout'
import { TopBarButton } from '../../ui/TopBarButton'
import { SidebarPanelSlot } from '../SidebarPanelSlot'

const NO_MOTION = { duration: 0 } as const

function shellState(input: SidebarVisibilityInput) {
  const projection = resolveSidebarVisibility(input)
  const layout = resolveShellLayout({
    shellWidth: 1_400,
    compact: input.autoCompact,
    focusMode: input.focusMode,
    sidebarStoredVisible: input.storedVisible,
    sidebarStoredWidth: input.storedWidth,
    navigatorNeeded: false,
    navigatorStoredWidth: 300,
    workbenchRequested: false,
    workbenchStoredWidth: 420,
    workbenchKind: 'task-board',
  })
  return { projection, layout }
}

/** Same attrs TopBar applies from sidebarProjection (production wiring). */
function mountProductionToggle(projection: ReturnType<typeof resolveSidebarVisibility>) {
  return renderToStaticMarkup(
    <TopBarButton
      onClick={() => {}}
      aria-label="Toggle sidebar"
      aria-pressed={projection.ariaPressed}
      title="Toggle sidebar"
      data-sidebar-chrome="toggle"
      data-sidebar-rendered-width={String(projection.renderedWidth)}
      data-sidebar-visible={projection.isRendered ? 'true' : 'false'}
    >
      <span>sidebar</span>
    </TopBarButton>,
  )
}

/** Production SidebarPanelSlot used by PanelStackContainer. */
function mountProductionSidebar(sidebarWidth: number, visible: boolean) {
  return renderToStaticMarkup(
    <SidebarPanelSlot
      sidebarWidth={sidebarWidth}
      visible={visible}
      transition={NO_MOTION}
    >
      <div data-sidebar-slot-content="true">Sessions</div>
    </SidebarPanelSlot>,
  )
}

function readToggle(html: string) {
  return {
    pressed: /aria-pressed="(true|false)"/.exec(html)?.[1],
    visible: /data-sidebar-visible="(true|false)"/.exec(html)?.[1],
    width: /data-sidebar-rendered-width="(\d+)"/.exec(html)?.[1],
  }
}

function readPanel(html: string) {
  return {
    panelWidth: /data-sidebar-panel-width="(\d+)"/.exec(html)?.[1],
    panelVisible: /data-panel-role="sidebar"[^>]*data-sidebar-visible="(true|false)"/.exec(html)?.[1]
      ?? /data-sidebar-visible="(true|false)"/.exec(html)?.[1],
    styleWidth: /data-sidebar-panel-width="\d+"[^>]*style="[^"]*width:\s*(\d+)px/.exec(html)?.[1],
    hasSlotContent: html.includes('data-sidebar-slot-content'),
  }
}

describe('production TopBarButton + SidebarPanelSlot chrome', () => {
  it('production sources wire projection into TopBarButton and PanelStackContainer→SidebarPanelSlot', async () => {
    const topBar = await Bun.file(new URL('../TopBar.tsx', import.meta.url)).text()
    expect(topBar).toContain('sidebarProjection')
    expect(topBar).toContain('data-sidebar-chrome="toggle"')
    expect(topBar).toContain('aria-pressed={sidebarProjection?.ariaPressed')

    const panelStack = await Bun.file(new URL('../PanelStackContainer.tsx', import.meta.url)).text()
    expect(panelStack).toContain('SidebarPanelSlot')
    expect(panelStack).toContain('sidebarWidth={sidebarWidth}')

    const slot = await Bun.file(new URL('../SidebarPanelSlot.tsx', import.meta.url)).text()
    expect(slot).toContain('data-panel-role="sidebar"')
    expect(slot).toContain('data-sidebar-panel-width')
  })

  it('one hide action zeros SidebarPanelSlot width and TopBarButton aria-pressed', () => {
    const beforeInput: SidebarVisibilityInput = {
      storedVisible: true,
      storedWidth: 220,
      focusMode: false,
      autoCompact: false,
    }
    const before = shellState(beforeInput)
    const beforeToggle = readToggle(mountProductionToggle(before.projection))
    const beforePanel = readPanel(mountProductionSidebar(
      before.layout.sidebarWidth,
      before.layout.sidebarWidth > 0,
    ))
    expect(beforeToggle.pressed).toBe('true')
    expect(beforeToggle.visible).toBe('true')
    expect(beforeToggle.width).toBe('220')
    expect(beforePanel.panelWidth).toBe('220')
    expect(beforePanel.panelVisible).toBe('true')
    expect(beforePanel.styleWidth).toBe('220')
    expect(beforePanel.hasSlotContent).toBe(true)

    const toggled = applySidebarToggle(beforeInput)
    const afterInput: SidebarVisibilityInput = {
      storedVisible: toggled.storedVisible,
      storedWidth: 220,
      focusMode: toggled.focusMode,
      autoCompact: false,
    }
    const after = shellState(afterInput)
    const afterToggle = readToggle(mountProductionToggle(after.projection))
    const afterPanel = readPanel(mountProductionSidebar(
      after.layout.sidebarWidth,
      after.layout.sidebarWidth > 0,
    ))
    expect(after.layout.sidebarWidth).toBe(0)
    expect(afterToggle.pressed).toBe('false')
    expect(afterToggle.visible).toBe('false')
    expect(afterToggle.width).toBe('0')
    expect(afterPanel.panelWidth).toBe('0')
    expect(afterPanel.panelVisible).toBe('false')
    expect(afterPanel.styleWidth).toBe('0')
    expect(afterPanel.hasSlotContent).toBe(false)
  })

  it('one reveal action restores panel width and aria-pressed', () => {
    const hidden: SidebarVisibilityInput = {
      storedVisible: false,
      storedWidth: 260,
      focusMode: false,
      autoCompact: false,
    }
    const toggled = applySidebarToggle(hidden)
    expect(toggled.storedVisible).toBe(true)
    const after = shellState({
      storedVisible: toggled.storedVisible,
      storedWidth: 260,
      focusMode: toggled.focusMode,
      autoCompact: false,
    })
    const toggle = readToggle(mountProductionToggle(after.projection))
    const panel = readPanel(mountProductionSidebar(
      after.layout.sidebarWidth,
      after.layout.sidebarWidth > 0,
    ))
    expect(toggle.pressed).toBe('true')
    expect(panel.panelWidth).toBe('260')
    expect(panel.styleWidth).toBe('260')
    expect(panel.panelVisible).toBe('true')
  })

  it('focus-mode first toggle exits focus and repaints the sidebar', () => {
    const focused: SidebarVisibilityInput = {
      storedVisible: true,
      storedWidth: 220,
      focusMode: true,
      autoCompact: false,
    }
    const mid = shellState(focused)
    expect(mid.layout.sidebarWidth).toBe(0)
    expect(readToggle(mountProductionToggle(mid.projection)).pressed).toBe('false')

    const afterExit = applySidebarToggle(focused)
    expect(afterExit).toEqual({ storedVisible: true, focusMode: false })
    const revealed = shellState({
      storedVisible: afterExit.storedVisible,
      storedWidth: 220,
      focusMode: afterExit.focusMode,
      autoCompact: false,
    })
    expect(revealed.layout.sidebarWidth).toBe(220)
    expect(readToggle(mountProductionToggle(revealed.projection)).pressed).toBe('true')
    expect(readPanel(mountProductionSidebar(220, true)).panelWidth).toBe('220')
  })
})
