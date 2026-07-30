import {
  PANEL_EDGE_INSET,
  PANEL_GAP,
  PANEL_MIN_WIDTH,
  PANEL_RIGHT_EDGE_INSET,
  PANEL_SIDEBAR_GAP,
  RIGHT_WORKBENCH_MIN_WIDTH,
} from './panel-constants'

interface ResponsivePanelLayoutInput {
  containerWidth: number
  compact: boolean
  focusMode: boolean
  sidebarVisible: boolean
  sidebarWidth: number
  navigatorVisible: boolean
  navigatorWidth: number
  workbenchVisible: boolean
  workbenchWidth: number
}

export interface ResponsivePanelLayout {
  sidebarWidth: number
  navigatorWidth: number
  workbenchWidth: number
}

function fixedChromeWidth(
  sidebarWidth: number,
  navigatorWidth: number,
  workbenchWidth: number,
): number {
  const leftInset = sidebarWidth > 0 ? 0 : PANEL_EDGE_INSET
  const sidebarSeam = sidebarWidth > 0 && navigatorWidth > 0
    ? PANEL_SIDEBAR_GAP
    : 0
  const contentSeam = sidebarWidth > 0 || navigatorWidth > 0
    ? PANEL_GAP
    : 0
  const workbenchSeam = workbenchWidth > 0 ? PANEL_GAP : 0

  return leftInset
    + sidebarWidth
    + sidebarSeam
    + navigatorWidth
    + contentSeam
    + workbenchSeam
    + workbenchWidth
    + PANEL_RIGHT_EDGE_INSET
}

function fitWorkbenchWidth(
  containerWidth: number,
  sidebarWidth: number,
  navigatorWidth: number,
  requestedWidth: number,
): number {
  if (requestedWidth <= 0) return 0

  const chromeWithoutWorkbench = fixedChromeWidth(
    sidebarWidth,
    navigatorWidth,
    0,
  )
  const available = containerWidth
    - chromeWithoutWorkbench
    - PANEL_GAP
    - PANEL_MIN_WIDTH

  if (available < RIGHT_WORKBENCH_MIN_WIDTH) return 0

  return Math.min(requestedWidth, available)
}

function hasComfortableContentWidth(
  containerWidth: number,
  sidebarWidth: number,
  navigatorWidth: number,
  workbenchWidth: number,
): boolean {
  return containerWidth
    - fixedChromeWidth(sidebarWidth, navigatorWidth, workbenchWidth)
    >= PANEL_MIN_WIDTH
}

/**
 * Resolve desktop chrome from actual available width rather than one viewport
 * breakpoint. Priority is deliberate:
 * 1. shrink the optional workbench to its usable minimum;
 * 2. hide the optional workbench when even its minimum cannot fit;
 * 3. yield the page-local navigator only when the main panel still cannot fit;
 * 4. preserve the explicitly visible global sidebar and main task panel.
 *
 * The global sidebar is user-controlled state and, on session routes, the only
 * navigation authority. Responsive projection must never silently turn its
 * width into zero: doing so leaves the toolbar toggle's state unchanged, so
 * subsequent clicks appear to do nothing.
 */
export function resolveResponsivePanelLayout(
  input: ResponsivePanelLayoutInput,
): ResponsivePanelLayout {
  if (input.compact) {
    return { sidebarWidth: 0, navigatorWidth: 0, workbenchWidth: 0 }
  }

  // ResizeObserver reports after the first layout. Preserve the requested
  // desktop chrome until a real width is available to avoid a one-frame
  // collapse during startup or reload.
  if (input.containerWidth <= 0) {
    return {
      sidebarWidth: input.focusMode || !input.sidebarVisible ? 0 : input.sidebarWidth,
      navigatorWidth: input.focusMode || !input.navigatorVisible ? 0 : input.navigatorWidth,
      workbenchWidth: input.workbenchVisible ? input.workbenchWidth : 0,
    }
  }

  let sidebarWidth = input.focusMode || !input.sidebarVisible
    ? 0
    : input.sidebarWidth
  let navigatorWidth = input.focusMode || !input.navigatorVisible
    ? 0
    : input.navigatorWidth

  // The *requested* width must survive the whole yielding chain. Re-fitting with
  // an already-collapsed width was the bug that made the workbench un-openable:
  // `fitWorkbenchWidth` short-circuits on `requestedWidth <= 0`, so once the
  // first fit returned 0, yielding the sidebar and then the navigator both
  // re-fitted 0 and returned 0 again. The documented priority below was
  // therefore never reachable — below roughly 1350px of shell width the toggle
  // flipped state, `workbenchWidth` stayed 0, and `isRightWorkbenchRendered`
  // silently rendered nothing.
  const requestedWorkbenchWidth = input.workbenchVisible ? input.workbenchWidth : 0

  const fit = () => fitWorkbenchWidth(
    input.containerWidth,
    sidebarWidth,
    navigatorWidth,
    requestedWorkbenchWidth,
  )
  const contentIsComfortable = (workbenchWidth: number) => hasComfortableContentWidth(
    input.containerWidth,
    sidebarWidth,
    navigatorWidth,
    workbenchWidth,
  )

  let workbenchWidth = fit()

  // A page-local navigator may yield only to protect the main panel — never to
  // make room for the workbench. The optional workbench has already been fitted
  // or hidden above.
  //
  // It may not yield past the point where nothing can navigate. If the user has
  // explicitly hidden the global sidebar, the navigator is the last navigation
  // surface and must remain available.
  const navigatorIsLastNavigation = sidebarWidth === 0
  if (
    navigatorWidth > 0
    && !navigatorIsLastNavigation
    && !contentIsComfortable(workbenchWidth)
  ) {
    navigatorWidth = 0
    workbenchWidth = fit()
  }

  return { sidebarWidth, navigatorWidth, workbenchWidth }
}
